/**
 * WI-0095: Yarn Plug'n'Play 의 워크스페이스 루트 선언 경계(WI-0091, check 전용)를 init 과 registry-core add 로 넓힘(권장안으로 진행).
 *
 * 착수 측정(main e4d89ae, Yarn 4.5.3 실설치 fixture): PnP 에서 루트에만 선언한 clsx · tailwind-merge 를 init 은 「이미 있습니다」로 보고
 * 앱 package.json 에 쓰지 않았고, add 는 의존성 안내에서 뺐어요(앱 issuer 의 require.resolve 는 MODULE_NOT_FOUND). Tailwind 4 안내는
 * 루트 전용 @axis-ds/ui-react 의 tailwind.css 줄을 그대로 내고 루트 전용 tokens 의 설치 줄을 감췄어요(그대로 넣으면 빌드가 Can't resolve).
 * 이 파일은 실제 PnP 레이아웃(루트 workspaces · yarn.lock · .yarnrc.yml · .pnp.cjs, node_modules 없음)과 PnP 가 아닌 레이아웃(yarn
 * node-modules · npm · pnpm)의 음성 대조를 고정해요. registry-core 에는 테스트 러너가 없어서 add 의 공용 판정도 여기서 봐요.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { missingDependencies } from "@axis-ds/registry-core/add";
import type { RegistryItem } from "@axis-ds/registry-core/registry";
import { checkDependencies } from "@axis-ds/registry-core/dependencies-core";
import { PNP_ROOT_ONLY_NOTE } from "@axis-ds/registry-core/project";
import { planUtilsDependencies, pnpRootOnlyTailwindLine, resolveInitAnswers, runInit, tailwind4GuideLines } from "./init/init.js";

const REGISTRY = "https://axis-design-system.pages.dev/r";
const created: string[] = [];
afterEach(async () => {
  process.exitCode = undefined;
  for (const dir of created.splice(0)) await fs.remove(dir);
});

type Layout = "pnp" | "yarn-nm" | "npm" | "pnpm";

interface Ws {
  layout: Layout;
  /** 루트 package.json dependencies */
  root?: Record<string, string>;
  /** 앱(apps/web) package.json dependencies */
  app?: Record<string, string>;
  /** 전역 CSS(app/globals.css) 본문. 없으면 파일 없음 */
  css?: string;
}

const TW4 = { tailwindcss: "4.1.14" };
const UTILS4 = { clsx: "^2.1.1", "tailwind-merge": "^3.3.1" };
const AXIS = { "@axis-ds/tokens": "^1.8.2", "@axis-ds/ui-react": "^1.8.2" };
const TWA = { "tw-animate-css": "^1.4.0" };

/**
 * 워크스페이스(루트 workspaces · apps/web)를 만들고 앱 경로를 돌려줘요. `.git` 으로 상위 탐색을 막아요.
 * - pnp: yarn.lock · .yarnrc.yml(nodeLinker: pnp) · .pnp.cjs, node_modules 없음(WI-0091 의 pnpWs 와 같은 실제 레이아웃)
 * - yarn-nm · npm · pnpm: 루트 선언을 node_modules 설치본으로도 둬요(호이스팅). pnpm 은 pnpm-workspace.yaml
 */
async function ws(w: Ws): Promise<string> {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "axis-wi0095-")));
  created.push(root);
  await fs.ensureDir(path.join(root, ".git"));
  await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], dependencies: w.root ?? {} });
  if (w.layout === "pnp" || w.layout === "yarn-nm") {
    await fs.writeFile(path.join(root, "yarn.lock"), "# yarn lockfile v8\n");
    await fs.writeFile(path.join(root, ".yarnrc.yml"), `nodeLinker: ${w.layout === "pnp" ? "pnp" : "node-modules"}\n`);
  }
  if (w.layout === "pnp") await fs.writeFile(path.join(root, ".pnp.cjs"), "#!/usr/bin/env node\n/* eslint-disable */\n// @ts-nocheck\n");
  if (w.layout === "npm") await fs.writeJSON(path.join(root, "package-lock.json"), { lockfileVersion: 3 });
  if (w.layout === "pnpm") {
    await fs.writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
  }
  if (w.layout !== "pnp") {
    for (const [name, range] of Object.entries({ ...(w.root ?? {}), ...(w.app ?? {}) })) {
      const version = range.replace(/^[\^~]/, "");
      await fs.outputJSON(path.join(root, "node_modules", name, "package.json"), { name, version });
    }
  }
  const app = path.join(root, "apps", "web");
  await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: w.app ?? {} });
  if (w.css !== undefined) await fs.outputFile(path.join(app, "app", "globals.css"), w.css);
  return app;
}

const pkgOf = async (app: string) => (await fs.readJSON(path.join(app, "package.json"))) as Record<string, unknown>;

/** `axis init -y` 와 같은 경로로 돌리고 출력 줄(앞뒤 공백 제거)과 앱 package.json 을 돌려줘요 */
async function init(app: string): Promise<{ logs: string[]; pkg: Record<string, unknown> }> {
  const { answers } = await resolveInitAnswers(app);
  const out: string[] = [];
  await runInit(app, answers, REGISTRY, (...args: unknown[]) => out.push(args.map(String).join(" ")));
  // eslint-disable-next-line no-control-regex
  const logs = out.flatMap((l) => l.replace(/\x1b\[[0-9;]*m/g, "").split("\n")).map((l) => l.trim()).filter((l) => l !== "");
  return { logs, pkg: await pkgOf(app) };
}

const ROOT_NOTE = (names: string) => `${names} 는 ${PNP_ROOT_ONLY_NOTE}`;
const TAILWIND_LINE = `! 필수 의존성 tailwindcss 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요`;
const UI_LINE = `! @axis-ds/ui-react 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언한 뒤 @import "@axis-ds/ui-react/tailwind.css";`;
const TOKENS_LINE = (cmd: string, why = "") => `@axis-ds/tokens 설치${why}: ${cmd} "@axis-ds/tokens@^1.4.0"`;
const ANIM_ROOT = `애니메이션: app/globals.css의 애니메이션 줄을 쓸 수 없습니다(tw-animate-css 가 ${PNP_ROOT_ONLY_NOTE}). 설치하세요: yarn add tw-animate-css`;
const CSS4 = '@import "tailwindcss";\n@import "tw-animate-css";\n';

describe("WI-0095: init 의 utils 의존성(clsx · tailwind-merge)", () => {
  it("PnP 루트 전용: 「이미 있음」이 아니라 앱 package.json 에 더하고 사유를 알림(종전: 이미 있음 · 쓰지 않음)", async () => {
    const app = await ws({ layout: "pnp", root: { ...TW4, ...UTILS4 } });
    const plan = planUtilsDependencies(app);
    expect({ action: plan.action, added: plan.added, present: plan.present, pnpRootOnly: plan.pnpRootOnly }).toEqual({
      action: "add",
      added: ["clsx", "tailwind-merge"],
      present: [],
      pnpRootOnly: ["clsx", "tailwind-merge"],
    });
    const r = await init(app);
    expect(r.pkg.dependencies).toEqual({ clsx: "^2.1.1", "tailwind-merge": "^3.4.0" });
    expect(r.logs).toContain("✓ package.json dependencies 에 추가: clsx@^2.1.1, tailwind-merge@^3.4.0");
    expect(r.logs).toContain(ROOT_NOTE("clsx, tailwind-merge"));
    expect(r.logs.join("\n")).not.toContain("이미 있습니다");
  });

  it("PnP 한쪽만 루트 전용: 앱 선언은 그대로 두고 루트 전용만 더함", async () => {
    const app = await ws({ layout: "pnp", root: { ...TW4, "tailwind-merge": "^3.3.1" }, app: { clsx: "^2.1.1" } });
    const plan = planUtilsDependencies(app);
    expect({ added: plan.added, present: plan.present, pnpRootOnly: plan.pnpRootOnly }).toEqual({
      added: ["tailwind-merge"],
      present: [{ name: "clsx", range: "^2.1.1", source: "app" }],
      pnpRootOnly: ["tailwind-merge"],
    });
  });

  it("PnP 앱 선언(양성 대조): 종전처럼 이미 있음", async () => {
    const plan = planUtilsDependencies(await ws({ layout: "pnp", app: { ...TW4, ...UTILS4 } }));
    expect({ action: plan.action, added: plan.added, pnpRootOnly: plan.pnpRootOnly ?? [] }).toEqual({ action: "present", added: [], pnpRootOnly: [] });
  });

  for (const layout of ["yarn-nm", "npm", "pnpm"] as const) {
    it(`음성 대조 ${layout}: 루트 선언은 종전처럼 「이미 있음(워크스페이스 루트에 선언)」, 앱 package.json 그대로`, async () => {
      const app = await ws({ layout, root: { ...TW4, ...UTILS4 } });
      const before = await fs.readFile(path.join(app, "package.json"), "utf8");
      const plan = planUtilsDependencies(app);
      // `?? []`: 수정 전 코드(필드 없음)에서도 같은 기대로 돌려 음성 대조가 초록인지 보려고
      expect({ action: plan.action, pnpRootOnly: plan.pnpRootOnly ?? [], sources: plan.present.map((p) => p.source) }).toEqual({
        action: "present",
        pnpRootOnly: [],
        sources: ["root", "root"],
      });
      const r = await init(app);
      expect(await fs.readFile(path.join(app, "package.json"), "utf8")).toBe(before);
      expect(r.logs.join("\n")).not.toContain(PNP_ROOT_ONLY_NOTE);
    });
  }
});

describe("WI-0095: init 의 tailwindcss 루트 전용 안내(check 의 dependencies FAIL 과 같은 사유)", () => {
  it("PnP 루트 전용이면 한 줄, 앱 선언 · node-modules 루트 선언은 없음. check 문구와 같은 사유", async () => {
    const pnp = await ws({ layout: "pnp", root: TW4 });
    expect(pnpRootOnlyTailwindLine(pnp, await pkgOf(pnp))).toBe(TAILWIND_LINE);
    expect(checkDependencies(pnp)?.message).toContain(`필수 의존성 tailwindcss 가 ${PNP_ROOT_ONLY_NOTE} → 앱 package.json 에 선언하세요`);
    const appDecl = await ws({ layout: "pnp", app: TW4 });
    expect(pnpRootOnlyTailwindLine(appDecl, await pkgOf(appDecl))).toBeUndefined();
    const nm = await ws({ layout: "yarn-nm", root: TW4 });
    expect(pnpRootOnlyTailwindLine(nm, await pkgOf(nm))).toBeUndefined();
  });

  it("Tailwind 3 · 4 분기는 루트 선언을 계속 인정(WI-0091 Q6): PnP 루트 전용 Tailwind 4 는 Tailwind 4 안내를 냄", async () => {
    const r = await init(await ws({ layout: "pnp", root: TW4, css: CSS4 }));
    expect(r.logs).toContain(TAILWIND_LINE);
    expect(r.logs.some((l) => l.startsWith("Tailwind 4: 전역 CSS"))).toBe(true);
  });
});

describe("WI-0095: init 의 Tailwind 4 안내(컴포넌트 tailwind.css 줄 · tokens 설치 줄)", () => {
  it("PnP 루트 전용 ui-react · tokens: 줄 대신 앱 선언을 먼저 안내하고 tokens 설치 줄에 사유(종전: 줄 그대로 · 설치 줄 없음)", async () => {
    const app = await ws({ layout: "pnp", root: { ...AXIS }, app: { ...TW4, ...UTILS4 } });
    const lines = tailwind4GuideLines(await pkgOf(app), "yarn install", "./app/globals.css", app).map((l) => l.trim());
    expect(lines).toContain(UI_LINE);
    expect(lines).not.toContain('@import "@axis-ds/ui-react/tailwind.css";');
    expect(lines.some((l) => l.startsWith("npm 패키지 컴포넌트를 쓰면"))).toBe(false);
    expect(lines).toContain(TOKENS_LINE("yarn add", `(${PNP_ROOT_ONLY_NOTE})`));
  });

  it("PnP 앱 선언(양성 대조): 종전처럼 줄을 내고 설치 줄 없음", async () => {
    const app = await ws({ layout: "pnp", app: { ...TW4, ...UTILS4, ...AXIS } });
    const lines = tailwind4GuideLines(await pkgOf(app), "yarn install", "./app/globals.css", app).map((l) => l.trim());
    expect(lines).toContain('@import "@axis-ds/ui-react/tailwind.css";');
    expect(lines.join("\n")).not.toContain(PNP_ROOT_ONLY_NOTE);
    expect(lines.some((l) => l.startsWith("@axis-ds/tokens 설치"))).toBe(false);
  });

  it("PnP 미선언: 종전처럼 예시 줄과 사유 없는 설치 줄", async () => {
    const app = await ws({ layout: "pnp", app: { ...TW4 } });
    const lines = tailwind4GuideLines(await pkgOf(app), "yarn install", "./app/globals.css", app).map((l) => l.trim());
    expect(lines.some((l) => l.startsWith("npm 패키지 컴포넌트를 쓰면"))).toBe(true);
    expect(lines).toContain(TOKENS_LINE("yarn add"));
  });

  for (const [layout, cmd] of [
    ["yarn-nm", "yarn install"],
    ["npm", "npm install"],
    ["pnpm", "pnpm install"],
  ] as const) {
    it(`음성 대조 ${layout}: 루트 선언 ui-react · tokens 는 종전처럼 줄을 내고 설치 줄 없음`, async () => {
      const app = await ws({ layout, root: { ...AXIS }, app: { ...TW4 } });
      const lines = tailwind4GuideLines(await pkgOf(app), cmd, "./app/globals.css", app).map((l) => l.trim());
      expect(lines).toContain('@import "@axis-ds/ui-react/tailwind.css";');
      expect(lines.join("\n")).not.toContain(PNP_ROOT_ONLY_NOTE);
      expect(lines.some((l) => l.startsWith("@axis-ds/tokens 설치"))).toBe(false);
    });
  }
});

describe("WI-0095: init 애니메이션 안내의 PnP 루트 전용 칸(WI-0099 의 pnp-root-Ltwa-Itwa)", () => {
  it("줄 tw-animate-css · 루트에만 선언: check 와 같은 사유와 앱에 추가하는 명령(종전: 미선언 ① 줄)", async () => {
    const r = await init(await ws({ layout: "pnp", root: { ...TWA }, app: { ...TW4, ...UTILS4, "@axis-ds/ui-react": "^1.8.2" }, css: CSS4 }));
    expect(r.logs.filter((l) => l.startsWith("애니메이션:"))).toEqual([ANIM_ROOT]);
  });

  it("음성 대조 yarn node-modules: 같은 선언 위치는 루트 선언 · 설치로 침묵", async () => {
    const r = await init(await ws({ layout: "yarn-nm", root: { ...TWA }, app: { ...TW4, ...UTILS4, "@axis-ds/ui-react": "^1.8.2" }, css: CSS4 }));
    expect(r.logs.filter((l) => l.startsWith("애니메이션:"))).toEqual([]);
  });
});

describe("WI-0095: registry-core add 의 의존성 안내(cli axis add · MCP axis.install_component 공용 missingDependencies)", () => {
  const item = (deps: string[]): RegistryItem => ({ name: "x", type: "registry:ui", dependencies: deps, devDependencies: [], registryDependencies: [], files: [] });
  const ITEMS = [item(["@radix-ui/react-slot", "clsx", "tailwind-merge"])];

  it("PnP 루트 전용 clsx · tailwind-merge 는 안내에 넣음(종전: 뺌), 앱 선언은 뺌", async () => {
    const root = await ws({ layout: "pnp", root: { ...TW4, ...UTILS4 } });
    expect(missingDependencies(root, ITEMS).specs).toEqual({ "@radix-ui/react-slot": undefined, clsx: "^2.1.1", "tailwind-merge": "^3.4.0" });
    const app = await ws({ layout: "pnp", app: { ...TW4, ...UTILS4 } });
    expect(missingDependencies(app, ITEMS).specs).toEqual({ "@radix-ui/react-slot": undefined });
  });

  for (const layout of ["yarn-nm", "npm", "pnpm"] as const) {
    it(`음성 대조 ${layout}: 루트 선언은 종전처럼 「있음」`, async () => {
      const app = await ws({ layout, root: { ...TW4, ...UTILS4 } });
      expect(missingDependencies(app, ITEMS).specs).toEqual({ "@radix-ui/react-slot": undefined });
    });
  }
});
