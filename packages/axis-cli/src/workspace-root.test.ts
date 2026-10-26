/**
 * WI-0081: 설치 명령(lockfile) 판정의 워크스페이스 루트 탐색.
 * registry-core 에는 테스트 러너가 없어서(test 스크립트 · 테스트 파일 0개) vitest 가 실제로 도는 cli 아래에 둡니다.
 *
 * 규칙(배치 6b 결정): 앱 층 lockfile 우선 → 없으면 워크스페이스 루트(pnpm-workspace.yaml 또는 package.json workspaces)까지 올라가
 * 그 층의 lockfile 만 인정 → 그 전에 .git(디렉터리 또는 파일)이 나오면 중단 → 못 찾으면 종전 기본값 pnpm install.
 * 같은 층에 lockfile 이 여럿이면 종전 우선순위(pnpm → yarn → npm). packageManager 필드는 lockfile 이 없을 때만 봅니다(WI-0085, 아래 describe).
 *
 * 판별력이 있는 행은 npm · yarn 이에요. pnpm 행은 기본값과 같아 상위 탐색이 깨져도 초록이라 회귀 확인용입니다.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import {
  addCommandFor,
  addCommandPrefix,
  declaredDependency,
  detectInstallCommand,
  findInstalledPackage,
  findWorkspaceRoot,
  isPnpProject,
  packageManagerOf,
  resolveBaseDir,
  runScriptCommand,
  workspaceRootPackage,
  workspaceRunCommand,
} from "@axis-ds/registry-core/project";
import { addCommandForSpecs } from "@axis-ds/registry-core/add";

const created: string[] = [];
afterEach(async () => {
  for (const dir of created.splice(0)) await fs.remove(dir);
});

/** tmpdir 에 파일 트리를 만듭니다. 값이 객체면 JSON, 문자열이면 그대로. 끝이 `/` 인 키는 디렉터리 */
async function tree(files: Record<string, string | Record<string, unknown>>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "axis-ws-"));
  created.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(root, rel);
    if (rel.endsWith("/")) await fs.ensureDir(file);
    else if (typeof content === "string") await fs.outputFile(file, content);
    else await fs.outputJSON(file, content);
  }
  // WI-0086: 탐색 함수가 실경로(realpath)를 돌려주므로 tmpdir 이 링크인 머신(macOS /var → /private/var 등)에서도 비교가 맞게 실경로로
  return fs.realpath(root);
}

const APP_PKG = { name: "web", private: true };

describe("WI-0081: detectInstallCommand 의 워크스페이스 루트 탐색", () => {
  it("환경 가드: tmpdir 조상에 워크스페이스 표지 · lockfile 이 없음(있으면 아래 「pnpm 유지」 기대가 머신마다 달라짐)", async () => {
    const dir = await tree({ "package.json": APP_PKG });
    expect(findWorkspaceRoot(path.dirname(dir))).toBeUndefined();
    expect(detectInstallCommand(path.dirname(dir))).toBe("pnpm install");
  });

  it("AC1 npm 워크스페이스(fx-npm): 루트 package-lock.json + workspaces, 앱에는 lockfile 없음 → npm install", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"] },
      "package-lock.json": "{}",
      "apps/web/package.json": APP_PKG,
    });
    const app = path.join(root, "apps", "web");
    expect(findWorkspaceRoot(app)).toBe(root);
    expect(detectInstallCommand(app)).toBe("npm install");
  });

  it("AC2 yarn 워크스페이스(fx-yarn): 루트 yarn.lock + workspaces → yarn install, workspaces 객체형({ packages })도 같음", async () => {
    for (const workspaces of [["apps/*"], { packages: ["apps/*"] }]) {
      const root = await tree({
        "package.json": { name: "root", private: true, workspaces },
        "yarn.lock": "",
        "apps/web/package.json": APP_PKG,
      });
      const app = path.join(root, "apps", "web");
      expect({ workspaces, root: findWorkspaceRoot(app) === root, cmd: detectInstallCommand(app) }).toEqual({ workspaces, root: true, cmd: "yarn install" });
    }
  });

  it("pnpm 워크스페이스(fx-pnpm, 회귀 확인): pnpm-workspace.yaml + pnpm-lock.yaml → pnpm install, 루트는 찾음", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true },
      "pnpm-workspace.yaml": "packages:\n  - apps/*\n",
      "pnpm-lock.yaml": "",
      "apps/web/package.json": APP_PKG,
    });
    const app = path.join(root, "apps", "web");
    expect(findWorkspaceRoot(app)).toBe(root);
    expect(detectInstallCommand(app)).toBe("pnpm install");
  });

  it("AC3-① 음성 대조(fx-outside): 워크스페이스가 아닌 상위(workspaces 없음)의 package-lock.json 은 쓰지 않음 → pnpm install", async () => {
    const root = await tree({
      "package.json": { name: "unrelated", private: true },
      "package-lock.json": "{}",
      "sub/app/package.json": APP_PKG,
    });
    const app = path.join(root, "sub", "app");
    expect(findWorkspaceRoot(app)).toBeUndefined();
    expect(detectInstallCommand(app)).toBe("pnpm install");
  });

  it("AC3-② 음성 대조(fx-gitstop): 앱과 상위 워크스페이스 루트 사이에 .git 이 있으면 거기서 멈춤(디렉터리 · 파일형 gitdir 모두)", async () => {
    for (const git of [".git/", ".git"]) {
      const root = await tree({
        "package.json": { name: "root", private: true, workspaces: ["repo/*"] },
        "package-lock.json": "{}",
        [`repo/${git}`]: "gitdir: ../.git/modules/repo\n",
        "repo/app/package.json": APP_PKG,
      });
      const app = path.join(root, "repo", "app");
      expect({ git, root: findWorkspaceRoot(app), cmd: detectInstallCommand(app) }).toEqual({ git, root: undefined, cmd: "pnpm install" });
    }
  });

  it("같은 층에 .git 과 워크스페이스 표지가 함께 있으면(보통의 저장소 루트) 워크스페이스 판정이 먼저 → npm install", async () => {
    const root = await tree({
      ".git/": "",
      "package.json": { name: "root", private: true, workspaces: ["apps/*"] },
      "package-lock.json": "{}",
      "apps/web/package.json": APP_PKG,
    });
    const app = path.join(root, "apps", "web");
    expect(findWorkspaceRoot(app)).toBe(root);
    expect(detectInstallCommand(app)).toBe("npm install");
  });

  it("AC4 가까운 lockfile 우선(양성 대조): 앱 층 lockfile 이 루트보다 앞섬(루트 npm · 앱 yarn.lock → yarn)", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"] },
      "package-lock.json": "{}",
      "apps/web/package.json": APP_PKG,
      "apps/web/yarn.lock": "",
    });
    expect(detectInstallCommand(path.join(root, "apps", "web"))).toBe("yarn install");
  });

  it("AC4 양성 대조(ctl-npm · ctl-yarn · fx-single): 상위가 없는 단일 앱은 종전대로 앱 층 lockfile", async () => {
    for (const [lock, cmd] of [
      ["package-lock.json", "npm install"],
      ["yarn.lock", "yarn install"],
      ["pnpm-lock.yaml", "pnpm install"],
    ] as const) {
      const dir = await tree({ "package.json": APP_PKG, [lock]: "" });
      expect({ lock, cmd: detectInstallCommand(dir) }).toEqual({ lock, cmd });
    }
  });

  it("앱이 곧 워크스페이스 루트면 그 층 lockfile(종전과 같음)", async () => {
    const root = await tree({ "package.json": { name: "root", private: true, workspaces: ["apps/*"] }, "package-lock.json": "{}" });
    expect(findWorkspaceRoot(root)).toBe(root);
    expect(detectInstallCommand(root)).toBe("npm install");
  });

  it("같은 층에 lockfile 이 여럿이면 종전 우선순위(pnpm → yarn → npm)", async () => {
    for (const [locks, cmd] of [
      [["pnpm-lock.yaml", "package-lock.json"], "pnpm install"],
      [["yarn.lock", "package-lock.json"], "yarn install"],
      [["pnpm-lock.yaml", "yarn.lock"], "pnpm install"],
    ] as const) {
      const files: Record<string, string | Record<string, unknown>> = {
        "package.json": { name: "root", private: true, workspaces: ["apps/*"] },
        "apps/web/package.json": APP_PKG,
      };
      for (const lock of locks) files[lock] = "";
      const root = await tree(files);
      expect({ locks, cmd: detectInstallCommand(path.join(root, "apps", "web")) }).toEqual({ locks, cmd });
    }
  });

  it("AC5 lockfile 없는 워크스페이스 루트 → 종전 기본값 pnpm install(WI-0085 뒤: packageManager 가 있으면 그 매니저)", async () => {
    // WI-0081 AC5 는 packageManager 변형 2개도 pnpm 이었어요. 배치 6c 결정(lockfile 다음 순위로 packageManager)으로 npm · yarn 으로 바뀌어요
    const variants: [Record<string, string | Record<string, unknown>>, string][] = [
      [{ "pnpm-workspace.yaml": "packages:\n  - apps/*\n", "package.json": { name: "root", private: true } }, "pnpm install"],
      [{ "package.json": { name: "root", private: true, workspaces: ["apps/*"] } }, "pnpm install"],
      [{ "package.json": { name: "root", private: true, workspaces: ["apps/*"], packageManager: "npm@10.9.0" } }, "npm install"],
      [{ "package.json": { name: "root", private: true, workspaces: ["apps/*"], packageManager: "yarn@4.5.0" } }, "yarn install"],
    ];
    for (const [files, cmd] of variants) {
      const root = await tree({ ...files, "apps/web/package.json": APP_PKG });
      const app = path.join(root, "apps", "web");
      expect({ files, root: findWorkspaceRoot(app) === root, cmd: detectInstallCommand(app) }).toEqual({ files, root: true, cmd });
    }
  });

  it("중간 층(워크스페이스 루트가 아닌 apps/)의 lockfile 은 인정하지 않고 루트 lockfile 을 씀", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"] },
      "yarn.lock": "",
      "apps/package-lock.json": "{}",
      "apps/web/package.json": APP_PKG,
    });
    expect(detectInstallCommand(path.join(root, "apps", "web"))).toBe("yarn install");
  });

  it("가장 가까운 워크스페이스 루트에서 멈춤(그 위의 다른 워크스페이스 lockfile 은 보지 않음)", async () => {
    const root = await tree({
      "package.json": { name: "outer", private: true, workspaces: ["inner"] },
      "package-lock.json": "{}",
      "inner/package.json": { name: "inner", private: true, workspaces: ["apps/*"] },
      "inner/apps/web/package.json": APP_PKG,
    });
    const app = path.join(root, "inner", "apps", "web");
    expect(findWorkspaceRoot(app)).toBe(path.join(root, "inner"));
    expect(detectInstallCommand(app)).toBe("pnpm install");
  });

  it("workspaces 가 배열 · { packages: 배열 } 이 아니거나 package.json 이 깨졌으면 워크스페이스 루트가 아님", async () => {
    for (const rootPkg of ['{"workspaces": "apps/*"}', '{"workspaces": {"nohoist": ["x"]}}', "{ not json"]) {
      const root = await tree({ "package.json": rootPkg, "package-lock.json": "{}", "apps/web/package.json": APP_PKG });
      const app = path.join(root, "apps", "web");
      expect({ rootPkg, root: findWorkspaceRoot(app), cmd: detectInstallCommand(app) }).toEqual({ rootPkg, root: undefined, cmd: "pnpm install" });
    }
  });
});

// WI-0086: 의존성 선언 판정의 공용 헬퍼(declaredDependency)와 공개 함수 진입부의 실경로(resolveBaseDir).
// 선언은 앱 package.json 다음 워크스페이스 루트 package.json(findWorkspaceRoot 와 같은 경계)이고, 기준 디렉터리는 심볼릭 링크를 푼 실경로예요.
describe("WI-0086: declaredDependency(앱 다음 워크스페이스 루트 선언)", () => {
  const ROOT_DEPS = { tailwindcss: "^3.4.0", clsx: "^2.1.1", "@axis-ds/ui-react": "^1.8.0" };

  it("앱 선언이 있으면 앱(source app), 없으면 워크스페이스 루트(source root), 어디에도 없으면 undefined", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"], devDependencies: ROOT_DEPS },
      "apps/web/package.json": { name: "web", dependencies: { clsx: "^2.0.0" } },
    });
    const app = path.join(root, "apps", "web");
    const pkg = { name: "web", dependencies: { clsx: "^2.0.0" } };
    expect(declaredDependency(app, pkg, "clsx")).toEqual({ range: "^2.0.0", source: "app" });
    expect(declaredDependency(app, pkg, "tailwindcss")).toEqual({ range: "^3.4.0", source: "root" });
    expect(declaredDependency(app, pkg, "@axis-ds/ui-react")).toEqual({ range: "^1.8.0", source: "root" });
    expect(declaredDependency(app, pkg, "tailwind-merge")).toBeUndefined();
    // 앱 package.json 이 없으면(pkg undefined) 루트도 보지 않음(종전 동작)
    expect(declaredDependency(app, undefined, "tailwindcss")).toBeUndefined();
    // rootPkg 를 넘기면 다시 읽지 않고 그것을 씀(null 은 루트 없음)
    expect(declaredDependency(app, pkg, "tailwindcss", null)).toBeUndefined();
    expect(declaredDependency(app, pkg, "tailwindcss", { devDependencies: { tailwindcss: "^4" } })).toEqual({ range: "^4", source: "root" });
  });

  it("음성 대조: 워크스페이스가 아닌 상위 · .git 너머 · 앱이 곧 루트면 루트 선언을 인정하지 않음", async () => {
    const outside = await tree({ "package.json": { name: "unrelated", devDependencies: ROOT_DEPS }, "sub/app/package.json": APP_PKG });
    expect(declaredDependency(path.join(outside, "sub", "app"), APP_PKG, "tailwindcss")).toBeUndefined();
    const gitstop = await tree({
      "package.json": { name: "root", workspaces: ["repo/*"], devDependencies: ROOT_DEPS },
      "repo/.git/HEAD": "ref: refs/heads/main\n",
      "repo/app/package.json": APP_PKG,
    });
    expect(declaredDependency(path.join(gitstop, "repo", "app"), APP_PKG, "tailwindcss")).toBeUndefined();
    const self = await tree({ "package.json": { name: "root", workspaces: ["apps/*"], devDependencies: ROOT_DEPS } });
    expect(workspaceRootPackage(self)).toBeUndefined();
    expect(declaredDependency(self, APP_PKG, "tailwindcss")).toBeUndefined();
  });
});

describe("WI-0086: 공개 함수 진입부의 실경로(resolveBaseDir)", () => {
  /** npm 워크스페이스(루트 package-lock + 루트 node_modules 설치본) + apps/web, 그리고 앱 디렉터리 자체를 가리키는 링크(L1) */
  async function linked() {
    const root = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"], devDependencies: { tailwindcss: "^3.4.0" } },
      "package-lock.json": "{}",
      "node_modules/tailwindcss/package.json": { name: "tailwindcss", version: "3.4.19" },
      "apps/web/package.json": APP_PKG,
    });
    const app = path.join(root, "apps", "web");
    const links = await tree({});
    const link = path.join(links, "web-link");
    await fs.symlink(app, link, "dir");
    return { root, app, link };
  }

  it("앱 링크(L1)를 주어도 실경로와 같은 루트 · 설치 명령 · 설치본 · 루트 선언(수정 전: 링크 쪽 상위를 올라가 못 찾음)", async () => {
    const { root, app, link } = await linked();
    expect(resolveBaseDir(link)).toBe(app);
    expect({ root: findWorkspaceRoot(link), cmd: detectInstallCommand(link), pnp: isPnpProject(link) }).toEqual({ root, cmd: "npm install", pnp: false });
    expect(findInstalledPackage(link, "tailwindcss")).toEqual({ dir: path.join(root, "node_modules", "tailwindcss"), version: "3.4.19" });
    expect(declaredDependency(link, APP_PKG, "tailwindcss")).toEqual({ range: "^3.4.0", source: "root" });
  });

  it("루트 쪽 링크(L2, 링크/apps/web)와 실경로는 종전과 같음(음성 대조)", async () => {
    const { root, app } = await linked();
    const links = await tree({});
    const wsLink = path.join(links, "ws");
    await fs.symlink(root, wsLink, "dir");
    expect(findWorkspaceRoot(app)).toBe(root);
    expect(detectInstallCommand(path.join(wsLink, "apps", "web"))).toBe("npm install");
    expect(declaredDependency(path.join(wsLink, "apps", "web"), APP_PKG, "tailwindcss")).toEqual({ range: "^3.4.0", source: "root" });
  });

  it("찾은 설치본 dir 은 풀지 않음: 앱 node_modules 의 pnpm 스토어 링크는 링크 경로 그대로(풀면 .pnpm 경로가 제안에 새어 나옴)", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true },
      "pnpm-workspace.yaml": "packages:\n  - apps/*\n",
      "node_modules/.pnpm/@axis-ds+ui-react@1.8.1/node_modules/@axis-ds/ui-react/package.json": { name: "@axis-ds/ui-react", version: "1.8.1" },
      "apps/web/package.json": APP_PKG,
      "apps/web/node_modules/@axis-ds/": "",
    });
    const app = path.join(root, "apps", "web");
    const store = path.join(root, "node_modules", ".pnpm", "@axis-ds+ui-react@1.8.1", "node_modules", "@axis-ds", "ui-react");
    await fs.symlink(store, path.join(app, "node_modules", "@axis-ds", "ui-react"), "dir");
    expect(findInstalledPackage(app, "@axis-ds/ui-react")?.dir).toBe(path.join(app, "node_modules", "@axis-ds", "ui-react"));
  });

  it("없는 경로(ENOENT)는 종전처럼 path.resolve 결과로 폴백", async () => {
    const base = await tree({});
    const missing = path.join(base, "no-such-dir");
    expect(resolveBaseDir(missing)).toBe(missing);
    expect(resolveBaseDir("relative/x")).toBe(path.resolve("relative/x"));
    expect(detectInstallCommand(missing)).toBe("pnpm install");
  });
});

describe("WI-0085: lockfile 이 없을 때 package.json packageManager 신호(배치 6c 결정)", () => {
  it("환경 가드: tmpdir 조상 package.json 에 packageManager 가 없음(있으면 아래 「pnpm 유지」 기대가 머신마다 달라짐)", async () => {
    const dir = await tree({ "package.json": APP_PKG });
    let cur = path.dirname(dir);
    const found: string[] = [];
    let checked = 0;
    for (;;) {
      checked++;
      try {
        const pkg = JSON.parse(await fs.readFile(path.join(cur, "package.json"), "utf8")) as Record<string, unknown>;
        if ("packageManager" in pkg) found.push(cur);
      } catch {
        // package.json 없음 · 깨짐
      }
      const parent = path.dirname(cur);
      if (parent === cur) break;
      cur = parent;
    }
    expect(checked).toBeGreaterThan(0);
    expect(found).toEqual([]);
  });

  it("단일 앱: npm@ · yarn@ · pnpm@ → 각 매니저, 모르는 이름 · 문자열 아님 · 이름만 · 깨진 JSON → 종전 pnpm", async () => {
    const cases: [unknown, string][] = [
      ["npm@10.9.0", "npm install"],
      ["yarn@4.5.0", "yarn install"],
      ["yarn@1.22.22+sha512.abc", "yarn install"],
      [" npm@10.9.0 ", "npm install"],
      ["pnpm@9.15.4", "pnpm install"],
      ["bun@1.1.0", "pnpm install"],
      ["yarn", "pnpm install"],
      [123, "pnpm install"],
      [{ name: "npm" }, "pnpm install"],
    ];
    for (const [packageManager, cmd] of cases) {
      const dir = await tree({ "package.json": { ...APP_PKG, packageManager } });
      expect({ packageManager, cmd: detectInstallCommand(dir) }).toEqual({ packageManager, cmd });
    }
    const broken = await tree({ "package.json": '{ "packageManager": "npm@10.9.0", ' });
    expect(detectInstallCommand(broken)).toBe("pnpm install");
  });

  it("lockfile 이 먼저(conflict): 같은 층 package-lock.json + packageManager yarn@ → npm install(변이 P1: packageManager 를 lockfile 앞에)", async () => {
    const dir = await tree({ "package.json": { ...APP_PKG, packageManager: "yarn@4.5.0" }, "package-lock.json": "{}" });
    expect(detectInstallCommand(dir)).toBe("npm install");
  });

  it("루트 lockfile 이 앱 packageManager 보다 먼저: 루트 yarn.lock + 앱 npm@ → yarn install", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"] },
      "yarn.lock": "",
      "apps/web/package.json": { ...APP_PKG, packageManager: "npm@10.9.0" },
    });
    expect(detectInstallCommand(path.join(root, "apps", "web"))).toBe("yarn install");
  });

  it("앱 packageManager 가 루트 packageManager 보다 먼저, 앱이 모르는 이름이면 루트 것", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"], packageManager: "yarn@4.5.0" },
      "apps/web/package.json": { ...APP_PKG, packageManager: "npm@10.9.0" },
      "apps/bun/package.json": { ...APP_PKG, packageManager: "bun@1.1.0" },
      "apps/plain/package.json": APP_PKG,
    });
    expect(detectInstallCommand(path.join(root, "apps", "web"))).toBe("npm install");
    expect(detectInstallCommand(path.join(root, "apps", "bun"))).toBe("yarn install");
    expect(detectInstallCommand(path.join(root, "apps", "plain"))).toBe("yarn install");
  });

  it("음성 대조(변이 P3: 아무 상위 package.json): 워크스페이스가 아닌 상위 · .git 너머 · 중간 층의 packageManager 는 보지 않음", async () => {
    const outside = await tree({
      "package.json": { name: "outer", private: true, packageManager: "npm@10.9.0" },
      "apps/web/package.json": APP_PKG,
    });
    expect(detectInstallCommand(path.join(outside, "apps", "web"))).toBe("pnpm install");
    const gitstop = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"], packageManager: "npm@10.9.0" },
      "apps/web/.git/": "",
      "apps/web/package.json": APP_PKG,
    });
    expect(detectInstallCommand(path.join(gitstop, "apps", "web"))).toBe("pnpm install");
    const middle = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*/*"] },
      "apps/package.json": { name: "mid", private: true, packageManager: "npm@10.9.0" },
      "apps/x/web/package.json": APP_PKG,
    });
    expect(detectInstallCommand(path.join(middle, "apps", "x", "web"))).toBe("pnpm install");
  });

  it("앱 링크(L1)로 주어도 실경로와 같음: 루트 packageManager npm@ 워크스페이스(WI-0086 실경로 진입부와 합친 전이)", async () => {
    const root = await tree({
      "package.json": { name: "root", private: true, workspaces: ["apps/*"], packageManager: "npm@10.9.0" },
      "apps/web/package.json": APP_PKG,
    });
    const links = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "axis-wslink-")));
    created.push(links);
    const link = path.join(links, "web");
    await fs.symlink(path.join(root, "apps", "web"), link);
    expect(detectInstallCommand(link)).toBe("npm install");
    expect(detectInstallCommand(path.join(root, "apps", "web"))).toBe("npm install");
  });
});

describe("WI-0085: 명령 헬퍼(registry-core project.ts 한 곳)", () => {
  const managers = ["pnpm install", "npm install", "yarn install"] as const;

  it("packageManagerOf: 설치 명령 · 추가 명령 접두로 판정, 모르면 pnpm", () => {
    expect(managers.map(packageManagerOf)).toEqual(["pnpm", "npm", "yarn"]);
    expect(packageManagerOf('npm install "x@^1.0.0"')).toBe("npm");
    expect(packageManagerOf("bun install")).toBe("pnpm");
  });

  it("addCommandFor: 따옴표 범위, dev 면 -D, 옵션 없으면 종전 바이트", () => {
    const deps = { react: "^19.0.0", "@types/node": "^20" };
    expect(managers.map((m) => addCommandFor(m, deps))).toEqual([
      'pnpm add "react@^19.0.0" "@types/node@^20"',
      'npm install "react@^19.0.0" "@types/node@^20"',
      'yarn add "react@^19.0.0" "@types/node@^20"',
    ]);
    expect(managers.map((m) => addCommandFor(m, deps, { dev: true }))).toEqual([
      'pnpm add -D "react@^19.0.0" "@types/node@^20"',
      'npm install -D "react@^19.0.0" "@types/node@^20"',
      'yarn add -D "react@^19.0.0" "@types/node@^20"',
    ]);
    // 빈 deps 는 종전처럼 끝에 공백(init.ts 가 trimEnd 로 씀)
    expect(addCommandFor("pnpm install", {})).toBe("pnpm add ");
    expect(managers.map((m) => addCommandPrefix(m))).toEqual(["pnpm add", "npm install", "yarn add"]);
  });

  it("add 의 addCommandForSpecs 는 헬퍼 위로 옮겨도 동작 불변(범위 없는 항목은 따옴표 없이)", () => {
    const specs = { clsx: "^2.1.1", "tailwind-merge": undefined };
    expect(managers.map((m) => addCommandForSpecs(m, specs))).toEqual([
      'pnpm add "clsx@^2.1.1" tailwind-merge',
      'npm install "clsx@^2.1.1" tailwind-merge',
      'yarn add "clsx@^2.1.1" tailwind-merge',
    ]);
  });

  it("runScriptCommand · workspaceRunCommand: 매니저별 스크립트 · 워크스페이스 실행", () => {
    expect(managers.map((m) => runScriptCommand(m, "dev"))).toEqual(["pnpm dev", "npm run dev", "yarn dev"]);
    expect(managers.map((m) => workspaceRunCommand(m, "@axis-ds/tokens", "build"))).toEqual([
      "pnpm --filter @axis-ds/tokens build",
      "npm run build -w @axis-ds/tokens",
      "yarn workspace @axis-ds/tokens build",
    ]);
  });
});
