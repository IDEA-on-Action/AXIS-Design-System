/**
 * WI-0081: 설치 명령(lockfile) 판정의 워크스페이스 루트 탐색.
 * registry-core 에는 테스트 러너가 없어서(test 스크립트 · 테스트 파일 0개) vitest 가 실제로 도는 cli 아래에 둡니다.
 *
 * 규칙(배치 6b 결정): 앱 층 lockfile 우선 → 없으면 워크스페이스 루트(pnpm-workspace.yaml 또는 package.json workspaces)까지 올라가
 * 그 층의 lockfile 만 인정 → 그 전에 .git(디렉터리 또는 파일)이 나오면 중단 → 못 찾으면 종전 기본값 pnpm install.
 * 같은 층에 lockfile 이 여럿이면 종전 우선순위(pnpm → yarn → npm). packageManager 필드는 쓰지 않습니다.
 *
 * 판별력이 있는 행은 npm · yarn 이에요. pnpm 행은 기본값과 같아 상위 탐색이 깨져도 초록이라 회귀 확인용입니다.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { detectInstallCommand, findWorkspaceRoot } from "@axis-ds/registry-core/project";

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
  return root;
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

  it("AC5 lockfile 없는 워크스페이스 루트 → 종전 기본값 pnpm install, packageManager 필드는 보지 않음", async () => {
    const variants: Record<string, string | Record<string, unknown>>[] = [
      { "pnpm-workspace.yaml": "packages:\n  - apps/*\n", "package.json": { name: "root", private: true } },
      { "package.json": { name: "root", private: true, workspaces: ["apps/*"] } },
      { "package.json": { name: "root", private: true, workspaces: ["apps/*"], packageManager: "npm@10.9.0" } },
      { "package.json": { name: "root", private: true, workspaces: ["apps/*"], packageManager: "yarn@4.5.0" } },
    ];
    for (const files of variants) {
      const root = await tree({ ...files, "apps/web/package.json": APP_PKG });
      const app = path.join(root, "apps", "web");
      expect({ files: Object.keys(files), root: findWorkspaceRoot(app) === root, cmd: detectInstallCommand(app) }).toEqual({
        files: Object.keys(files),
        root: true,
        cmd: "pnpm install",
      });
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
