/**
 * WI-0096: npm 워크스페이스 루트 선언의 설치 위치 안내(theme add · init · check dependencies).
 *
 * npm 7.24.2 · 8.19.4 · 9.9.4 · 10.9.4 실측에서 앱 디렉터리의 plain `npm install` 은 워크스페이스 루트에만 선언한 패키지를 설치하지 않았고
 * (lockfile 없음 · 빈 파일 · 정상 · 앱 lockfile 네 조건 모두), 루트에서 실행하면 루트 · 앱 선언을 함께 설치했어요. pnpm 9.15.4 · yarn 1.22.22 는
 * 앱 디렉터리에서도 루트 선언을 설치해요. 그래서 npm 이고 안내 대상에 루트 선언이 있을 때만 「워크스페이스 루트에서 npm install」로 바꾸고,
 * pnpm · yarn · 앱 선언은 종전 문구 그대로예요(음성 대조 행).
 * registry-core 에는 테스트 러너가 없어서 공용 헬퍼(`installCommandPhrase`)도 여기서 봐요.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { Command } from "commander";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { installCommandPhrase } from "@axis-ds/registry-core/project";
import { checkDependencies } from "@axis-ds/registry-core/dependencies-core";
import { animationGuideLine, resolveInitAnswers, runInit } from "./init/init.js";
import { registerThemeCommand } from "./theme/index.js";

type Pm = "npm" | "pnpm" | "yarn";
const REGISTRY = "https://axis-design-system.pages.dev/r";
const ROOT_NPM = "워크스페이스 루트에서 npm install";

const created: string[] = [];
let logs: string[] = [];
beforeEach(() => {
  logs = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  });
});
afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  for (const dir of created.splice(0)) await fs.remove(dir);
});

/**
 * 워크스페이스 루트(`.git` 으로 탐색을 막음) 아래 apps/web 앱을 만들고 앱 경로를 돌려줘요. 설치본은 두지 않아요(미설치).
 * npm: 루트 package-lock.json · pnpm: pnpm-lock.yaml + pnpm-workspace.yaml · yarn: yarn.lock
 */
async function wsApp(
  pm: Pm,
  rootDeps: Record<string, string>,
  appDeps: Record<string, string>,
  extra: { tailwind4?: boolean; axisConfig?: boolean; appLock?: string } = {}
): Promise<string> {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "axis-wi0096-")));
  created.push(root);
  await fs.ensureDir(path.join(root, ".git"));
  await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], dependencies: rootDeps });
  if (pm === "npm") await fs.writeFile(path.join(root, "package-lock.json"), "{}");
  if (pm === "pnpm") {
    await fs.writeFile(path.join(root, "pnpm-lock.yaml"), "");
    await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "apps/*"\n');
  }
  if (pm === "yarn") await fs.writeFile(path.join(root, "yarn.lock"), "");
  const app = path.join(root, "apps", "web");
  await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: appDeps });
  if (extra.appLock) await fs.writeFile(path.join(app, extra.appLock), "{}");
  if (extra.tailwind4) await fs.outputFile(path.join(app, "app", "globals.css"), '@import "tailwindcss";\n');
  if (extra.axisConfig) {
    await fs.outputJSON(path.join(app, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./app/globals.css" });
  }
  return app;
}

/** pnpm · yarn 의 종전 설치 명령, npm 루트 선언이면 루트 위치 문구 */
const expectedPhrase = (pm: Pm, root: boolean) => (pm === "npm" && root ? ROOT_NPM : `${pm} install`);

describe("WI-0096: installCommandPhrase(registry-core 공용 헬퍼)", () => {
  it("npm 이고 루트 선언이 있을 때만 「워크스페이스 루트에서 npm install」, 나머지는 설치 명령 그대로", () => {
    const rows: [string, boolean, string][] = [
      ["npm install", true, ROOT_NPM],
      ["npm install", false, "npm install"],
      ["pnpm install", true, "pnpm install"],
      ["pnpm install", false, "pnpm install"],
      ["yarn install", true, "yarn install"],
      ["yarn install", false, "yarn install"],
    ];
    for (const [cmd, root, expected] of rows) expect({ cmd, root, out: installCommandPhrase(cmd, root) }).toEqual({ cmd, root, out: expected });
  });
});

describe("WI-0096: check dependencies 의 미설치 안내 위치", () => {
  const ROOT_ALL = { tailwindcss: "^3.4.0", clsx: "^2.1.1", "tailwind-merge": "^2.6.0", "@axis-ds/ui-react": "^1.8.0" };

  it("루트 선언 · 미설치: npm 만 루트 위치 문구, pnpm · yarn 은 종전(음성 대조), 종료 코드에 더해지지 않는 WARN 그대로", async () => {
    for (const pm of ["npm", "pnpm", "yarn"] as const) {
      const p = expectedPhrase(pm, true);
      expect({ pm, r: checkDependencies(await wsApp(pm, ROOT_ALL, {})) }).toEqual({
        pm,
        r: {
          name: "dependencies",
          severity: "warn",
          message: `선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → ${p} / 워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/ui-react → ${p} (워크스페이스 루트에 선언: tailwindcss, clsx, tailwind-merge, @axis-ds/ui-react)`,
        },
      });
    }
  });

  it("앱 선언 · 미설치는 세 매니저 모두 종전 「→ <pm> install」(음성 대조)", async () => {
    for (const pm of ["npm", "pnpm", "yarn"] as const) {
      expect({ pm, m: checkDependencies(await wsApp(pm, {}, ROOT_ALL)).message }).toEqual({
        pm,
        m: `선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge, @axis-ds/ui-react → ${pm} install`,
      });
    }
  });

  it("npm 앱 · 루트 선언이 한 묶음에 섞이면 루트 위치 문구(루트에서 실행하면 앱 선언도 함께 설치됨), 앱 lockfile 이 있어도 같음", async () => {
    const mixed = { clsx: "^2.1.1" };
    const own = { tailwindcss: "^3.4.0", "tailwind-merge": "^2.6.0" };
    const expected = `선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → ${ROOT_NPM} (워크스페이스 루트에 선언: clsx)`;
    expect(checkDependencies(await wsApp("npm", mixed, own)).message).toBe(expected);
    // npm 10.9.4 실측: 앱 디렉터리에 package-lock.json 이 있어도 앱의 npm install 은 루트 선언을 설치하지 않음
    expect(checkDependencies(await wsApp("npm", mixed, own, { appLock: "package-lock.json" })).message).toBe(expected);
  });
});

describe("WI-0096: init 의 설치 안내 위치(utils 의존성 · 애니메이션)", () => {
  async function initLines(app: string): Promise<string[]> {
    const { answers } = await resolveInitAnswers(app);
    const out: string[] = [];
    await runInit(app, answers, REGISTRY, (...args: unknown[]) => out.push(args.map(String).join(" ")));
    return out;
  }
  const UTILS_ROOT = { clsx: "^2.1.1", "tailwind-merge": "^3.0.0", tailwindcss: "^4.1.0", "tw-animate-css": "^1.2.0" };

  it("utils 의존성이 루트에 있으면 npm 만 「설치: 워크스페이스 루트에서 npm install」, pnpm · yarn · 앱 선언은 종전", async () => {
    const rows: [Pm, boolean][] = [
      ["npm", true],
      ["pnpm", true],
      ["yarn", true],
      ["npm", false],
    ];
    for (const [pm, root] of rows) {
      const app = root ? await wsApp(pm, UTILS_ROOT, {}, { tailwind4: true }) : await wsApp(pm, {}, UTILS_ROOT, { tailwind4: true });
      const lines = await initLines(app);
      const install = lines.filter((l) => l.includes("설치는 실행하지 않았습니다"));
      expect({ pm, root, install }).toEqual({ pm, root, install: [`  설치는 실행하지 않았습니다. 설치: ${expectedPhrase(pm, root)}`] });
    }
  });

  it("utils 의존성 일부만 루트에 있고 나머지를 앱에 추가해도 npm 은 루트 위치 문구(루트에 있는 것이 앱 npm install 로 설치되지 않음)", async () => {
    const app = await wsApp("npm", { clsx: "^2.1.1" }, { tailwindcss: "^4.1.0" }, { tailwind4: true });
    const lines = await initLines(app);
    expect(lines.some((l) => l.includes("package.json dependencies 에 추가: tailwind-merge@"))).toBe(true);
    expect(lines.filter((l) => l.includes("설치는 실행하지 않았습니다"))).toEqual([`  설치는 실행하지 않았습니다. 설치: ${ROOT_NPM}`]);
    // 음성 대조: 루트 선언이 하나도 없으면 종전 「설치: npm install」
    const plain = await wsApp("npm", {}, { tailwindcss: "^4.1.0" }, { tailwind4: true });
    expect((await initLines(plain)).filter((l) => l.includes("설치는 실행하지 않았습니다"))).toEqual(["  설치는 실행하지 않았습니다. 설치: npm install"]);
  });

  it("애니메이션 선언 · 미설치: npm 루트 선언만 루트 위치 문구, pnpm · yarn · 앱 선언은 종전", async () => {
    const rows: [Pm, boolean][] = [
      ["npm", true],
      ["pnpm", true],
      ["yarn", true],
      ["npm", false],
    ];
    for (const [pm, root] of rows) {
      const decl = { "tw-animate-css": "^1.2.0" };
      const app = root ? await wsApp(pm, decl, {}) : await wsApp(pm, {}, decl);
      const pkg = (await fs.readJSON(path.join(app, "package.json"))) as Record<string, unknown>;
      const cmd = `${pm} install`;
      expect({ pm, root, line: animationGuideLine(pkg, true, cmd, app) }).toEqual({
        pm,
        root,
        line: `애니메이션: tw-animate-css 는 ${root ? "워크스페이스 루트에 " : ""}선언돼 있지만 설치되지 않았습니다. ${expectedPhrase(pm, root)} 뒤 전역 CSS 에 @import "tw-animate-css"; 를 넣으세요.`,
      });
    }
  });
});

describe("WI-0096: theme add 의 루트 선언 설치 줄", () => {
  async function runAdd(app: string): Promise<string[]> {
    logs = [];
    const program = new Command();
    program.exitOverride();
    registerThemeCommand(program);
    await program.parseAsync(["theme", "add", "sample", "-d", app], { from: "user" });
    process.exitCode = undefined;
    return [...logs];
  }
  const ROOT_PRESENT = "package.json: @axis-ds/tokens ^1.8.0 가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음";
  const deferred = (phrase: string) =>
    `  ! @axis-ds/ui-react 가 워크스페이스 루트에 선언됐지만 설치되지 않아 @import "@axis-ds/ui-react/tailwind.css"; 를 넣지 않았습니다. 설치(${phrase}) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.`;

  it("tokens · 컴포넌트 루트 선언 미설치: npm 만 「워크스페이스 루트에서 npm install」, pnpm · yarn 은 종전(음성 대조)", async () => {
    for (const pm of ["npm", "pnpm", "yarn"] as const) {
      const app = await wsApp(
        pm,
        { "@axis-ds/tokens": "^1.8.0", "@axis-ds/ui-react": "^1.8.0" },
        { tailwindcss: "^4.1.0" },
        { tailwind4: true, axisConfig: true }
      );
      const lines = (await runAdd(app)).flatMap((l) => l.split("\n"));
      const p = expectedPhrase(pm, true);
      const at = lines.findIndex((l) => l.includes(ROOT_PRESENT));
      expect({ pm, at: at > -1, next: lines[at + 1] }).toEqual({ pm, at: true, next: `    설치: ${p}` });
      expect({ pm, deferred: lines.filter((l) => l.includes("를 넣지 않았습니다")) }).toEqual({ pm, deferred: [deferred(p)] });
    }
  });

  it("npm 앱 선언 · 미설치는 종전 「설치: npm install」(음성 대조)", async () => {
    const app = await wsApp("npm", {}, { tailwindcss: "^4.1.0", "@axis-ds/tokens": "^1.8.0" }, { tailwind4: true, axisConfig: true });
    const lines = (await runAdd(app)).flatMap((l) => l.split("\n"));
    const at = lines.findIndex((l) => l.includes("package.json: @axis-ds/tokens ^1.8.0 가 이미 있어 범위를 바꾸지 않음"));
    expect(at).toBeGreaterThan(-1);
    expect(lines[at + 1]).toBe("    설치: npm install");
  });
});
