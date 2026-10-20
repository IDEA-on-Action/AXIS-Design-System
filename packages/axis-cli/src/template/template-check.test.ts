import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { collectCheckResults, runCheck } from "./template-check.js";
import { axisPackagesBelowTailwind4, rangeLowerAtLeast } from "./tailwind-core.js";
import { applyThemeAdd, planThemeAdd } from "../theme/theme-add.js";
import { makeProject } from "../theme/test-helpers.js";
import type { CheckResult } from "./types.js";

// WI-0028 P4 (FR-5, AC4): axis check 의 brand 검사

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_FILE = path.resolve(HERE, "../../test/fixtures/check/run-check-baseline.json");
/** create-next-app@15.5.28 `--yes` 가 만든 app/globals.css 실물(2026-10-20, sha256 769edf77…, B2 판정 기준) */
const CNA_GLOBALS_FILE = path.resolve(HERE, "../../test/fixtures/check/create-next-app-15.5.28-globals.css");

type BaselineName = "emptyDir" | "theme-only" | "app-init" | "src-app" | "brokenConfig" | "allPass";

const created: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function tempDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-check-"));
  created.push(dir);
  return dir;
}

/** 기준선(run-check-baseline.json)을 캡처할 때와 같은 방법으로 프로젝트를 만듭니다. */
async function buildBaselineProject(name: BaselineName): Promise<string> {
  if (name === "emptyDir") return tempDir();
  if (name === "theme-only" || name === "app-init" || name === "src-app") {
    const dir = await makeProject({ tokens: "none", layout: name });
    created.push(dir);
    return dir;
  }
  if (name === "brokenConfig") {
    const dir = await makeProject({ tokens: "none", layout: "app-init" });
    created.push(dir);
    await fs.writeFile(path.join(dir, "axis.config.json"), "{ broken");
    return dir;
  }
  const dir = await tempDir();
  await writeAllPassProject(dir, { globalCss: "./app/globals.css" });
  return dir;
}

/** 기존 5항목이 모두 pass 인 프로젝트(기준선 allPass 와 같은 파일) */
async function writeAllPassProject(dir: string, config: Record<string, unknown>, css = ":root{--background:0;--primary:0;}") {
  await fs.writeJSON(path.join(dir, "axis.config.json"), config);
  await fs.writeFile(path.join(dir, "tailwind.config.ts"), "hsl(var(--x))");
  await fs.ensureDir(path.join(dir, "app"));
  await fs.writeFile(path.join(dir, "app/globals.css"), css);
  await fs.ensureDir(path.join(dir, "lib"));
  await fs.writeFile(path.join(dir, "lib/utils.ts"), "export function cn() {}");
  await fs.writeJSON(path.join(dir, "package.json"), {
    dependencies: { tailwindcss: "1", clsx: "1", "tailwind-merge": "1" },
  });
}

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

async function captureRunCheck(dir: string): Promise<string[]> {
  const logs: string[] = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(" ").replace(ANSI, ""));
  });
  await runCheck(dir);
  vi.restoreAllMocks();
  return logs;
}

/** 기존 5항목 이름(package.json 이 없으면 5번째는 "package.json") */
const EXISTING_NAMES = ["axis.config.json", "tailwind.config", "globals.css", "utils.ts", "dependencies"];

const ICON: Record<CheckResult["severity"], string> = { pass: "PASS", warn: "WARN", fail: "FAIL" };

describe("T4-1: collectCheckResults 분리 뒤 출력 불변 (brand 없는 프로젝트)", async () => {
  const baseline = (await fs.readJSON(BASELINE_FILE)) as {
    head: string;
    outputs: Record<BaselineName, string[]>;
  };
  const names = Object.keys(baseline.outputs) as BaselineName[];

  it("기준선은 1e84f15 에서 캡처한 6개 프로젝트", () => {
    expect(baseline.head).toBe("1e84f15");
    expect(names).toEqual(["emptyDir", "theme-only", "app-init", "src-app", "brokenConfig", "allPass"]);
  });

  for (const name of names) {
    it(`${name}: runCheck 출력이 정정 전과 줄 단위로 같음`, async () => {
      const dir = await buildBaselineProject(name);
      expect(await captureRunCheck(dir)).toEqual(baseline.outputs[name]);
    });

    it(`${name}: collectCheckResults 가 5항목이고 이름 · severity · 문구가 정정 전 출력 줄과 같음`, async () => {
      const dir = await buildBaselineProject(name);
      const results = await collectCheckResults(dir);
      expect(results).toHaveLength(5);
      expect(results.some((r) => r.name === "brand")).toBe(false);
      const lines = results.map((r) => `  ${ICON[r.severity]}  ${r.message}`);
      expect(lines).toEqual(baseline.outputs[name].slice(1, 6));
    });
  }
});

describe("T4-2: brand 항목을 추가하지 않는 경우", () => {
  it("config 없음 · brand 키 없음 · brand 빈 문자열 · brand 가 문자열이 아님 → 5항목", async () => {
    const configs: (Record<string, unknown> | null)[] = [
      null,
      { globalCss: "./app/globals.css" },
      { globalCss: "./app/globals.css", brand: "" },
      { globalCss: "./app/globals.css", brand: 1 },
    ];
    for (const config of configs) {
      const dir = await tempDir();
      await writeAllPassProject(dir, {}, ':root{--background:0;--primary:0;}\n@import "@axis-ds/tokens/css/brands/sample";');
      if (config === null) await fs.remove(path.join(dir, "axis.config.json"));
      else await fs.writeJSON(path.join(dir, "axis.config.json"), config);
      const results = await collectCheckResults(dir);
      expect(results).toHaveLength(5);
      expect(results.some((r) => r.name === "brand")).toBe(false);
    }
  });

  it("config JSON 파손: brand 항목 없음, 기존 axis.config.json 항목은 종전대로 pass(존재만 봄)", async () => {
    const dir = await tempDir();
    await writeAllPassProject(dir, {});
    await fs.writeFile(path.join(dir, "axis.config.json"), '{ "brand": "sample", ');
    const results = await collectCheckResults(dir);
    expect(results).toHaveLength(5);
    expect(results[0]).toEqual({
      name: "axis.config.json",
      severity: "pass",
      message: "axis.config.json 파일이 존재합니다",
    });
  });
});

describe("T4-3 (AC4): brand 와 import 대조", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await tempDir();
  });

  async function brandResult(): Promise<CheckResult> {
    const results = await collectCheckResults(dir);
    expect(results).toHaveLength(6);
    expect(results.slice(0, 4).map((r) => r.name)).toEqual(EXISTING_NAMES.slice(0, 4));
    return results[5];
  }

  it("일치 → pass, 기존 5항목과 합쳐 warn 0 (음성 대조군)", async () => {
    await writeAllPassProject(
      dir,
      { globalCss: "./app/globals.css", brand: "sample" },
      '@import "@axis-ds/tokens/css/brands/sample";\n:root{--background:0;--primary:0;}\n'
    );
    const results = await collectCheckResults(dir);
    expect(results[5]).toEqual({
      name: "brand",
      severity: "pass",
      message: 'brand "sample" import 가 app/globals.css에 있습니다',
    });
    expect(results.filter((r) => r.severity !== "pass")).toEqual([]);
  });

  it("import 없음 → warn, theme add 안내", async () => {
    await writeAllPassProject(dir, { globalCss: "./app/globals.css", brand: "sample" });
    expect(await brandResult()).toEqual({
      name: "brand",
      severity: "warn",
      message: "brand \"sample\" import 가 app/globals.css에 없습니다 → 'axis theme add sample'",
    });
  });

  it("주석 안의 import 만 있으면 import 없음으로 봄", async () => {
    await writeAllPassProject(
      dir,
      { globalCss: "./app/globals.css", brand: "sample" },
      '/* @import "@axis-ds/tokens/css/brands/sample"; */\n:root{--background:0;--primary:0;}\n'
    );
    expect((await brandResult()).severity).toBe("warn");
  });

  it("다른 브랜드만 import → warn, 다른 이름을 문구에 냄", async () => {
    await writeAllPassProject(
      dir,
      { globalCss: "./app/globals.css", brand: "sample" },
      '@import "@axis-ds/tokens/css/brands/ontology";\n@import url("@axis-ds/tokens/css/brands/other");\n'
    );
    expect(await brandResult()).toEqual({
      name: "brand",
      severity: "warn",
      message: 'brand "sample" 와 import(ontology, other)가 다릅니다',
    });
  });

  it("다른 브랜드와 함께 brand 도 import → pass (U13: 이전 import 를 남겨 둔 경우)", async () => {
    await writeAllPassProject(
      dir,
      { globalCss: "./app/globals.css", brand: "sample" },
      "@import \"@axis-ds/tokens/css/brands/ontology\";\n@import '@axis-ds/tokens/css/brands/sample';\n"
    );
    expect((await brandResult()).severity).toBe("pass");
  });

  it("CSS 후보가 모두 없음 → warn", async () => {
    await fs.writeJSON(path.join(dir, "axis.config.json"), { brand: "sample" });
    expect(await brandResult()).toEqual({
      name: "brand",
      severity: "warn",
      message: 'brand "sample" 가 설정됐지만 CSS 파일을 찾지 못했습니다',
    });
  });

  it("globalCss 가 없는 파일을 가리키고 다른 후보도 없음 → warn, globalCss 없음 표기", async () => {
    await fs.writeJSON(path.join(dir, "axis.config.json"), { globalCss: "./src/app/globals.css", brand: "sample" });
    expect(await brandResult()).toEqual({
      name: "brand",
      severity: "warn",
      message: 'brand "sample" 가 설정됐지만 CSS 파일을 찾지 못했습니다 (globalCss ./src/app/globals.css 없음)',
    });
  });

  it("탐색은 FR-2 순서: globalCss 가 가리키는 파일을 루트 globals.css 보다 먼저 봄 (기존 globals.css 항목은 루트 우선 그대로)", async () => {
    await writeAllPassProject(
      dir,
      { globalCss: "./app/globals.css", brand: "sample" },
      '@import "@axis-ds/tokens/css/brands/sample";\n:root{--background:0;--primary:0;}\n'
    );
    await fs.writeFile(path.join(dir, "globals.css"), ":root{--background:0;--primary:0;}\n");
    const results = await collectCheckResults(dir);
    expect(results[2].message).toBe("globals.css에 AXIS CSS 변수가 정의되어 있습니다");
    expect(results[5].message).toBe('brand "sample" import 가 app/globals.css에 있습니다');
  });

  it("projects/app-init 에 theme add 한 뒤: app/globals.css 를 검사해 pass, globalCss 경로 없음 표기", async () => {
    const project = await makeProject({ tokens: "1.3", layout: "app-init" });
    created.push(project);
    const plan = planThemeAdd(project, "sample");
    expect(plan.errors).toEqual([]);
    applyThemeAdd(plan);

    const results = await collectCheckResults(project);
    expect(results).toHaveLength(6);
    expect(results[5]).toEqual({
      name: "brand",
      severity: "pass",
      message: 'brand "sample" import 가 app/globals.css에 있습니다 (globalCss ./src/app/globals.css 없음)',
    });
    expect(await fs.pathExists(path.join(project, "src"))).toBe(false);
  });

  it("theme add 전 app-init 에 brand 만 적으면 warn (같은 프로젝트의 대조군)", async () => {
    const project = await makeProject({ tokens: "1.3", layout: "app-init" });
    created.push(project);
    const configFile = path.join(project, "axis.config.json");
    await fs.writeJSON(configFile, { ...(await fs.readJSON(configFile)), brand: "sample" });
    const results = await collectCheckResults(project);
    expect(results[5]).toEqual({
      name: "brand",
      severity: "warn",
      message:
        "brand \"sample\" import 가 app/globals.css에 없습니다 → 'axis theme add sample' (globalCss ./src/app/globals.css 없음)",
    });
  });

  it("runCheck 출력에 brand 줄과 6항목 합계가 나옴", async () => {
    await writeAllPassProject(dir, { globalCss: "./app/globals.css", brand: "sample" });
    const out = await captureRunCheck(dir);
    expect(out).toContain("  WARN  brand \"sample\" import 가 app/globals.css에 없습니다 → 'axis theme add sample'");
    expect(out).toContain("  결과: 5 pass / 1 warn / 0 fail");
    expect(out).toContain("\n권장 항목을 확인하세요.");
  });
});

/** Tailwind 4 토큰 진입점 import 줄(WI-0044 FR-4) */
const TOKENS_LINE = '@import "@axis-ds/tokens/css/tailwind4";';

// WI-0042: Tailwind 4 의 tailwind.config 오탐 · fail 시 종료 코드
describe("WI-0042: Tailwind 구성 항목과 종료 코드", () => {
  async function project(files: Record<string, string>, deps: Record<string, string> | null): Promise<string> {
    const dir = await tempDir();
    if (deps) await fs.writeJSON(path.join(dir, "package.json"), { dependencies: deps });
    for (const [rel, content] of Object.entries(files)) {
      await fs.ensureDir(path.dirname(path.join(dir, rel)));
      await fs.writeFile(path.join(dir, rel), content);
    }
    return dir;
  }

  const tailwindItem = async (dir: string) => (await collectCheckResults(dir)).find((r) => r.name === "tailwind.config")!;

  // 보정 2차(B2): 종전 fixture 의 `:root{--background:#fff;}` 는 create-next-app 기본 정의라 이제 warn 입니다(아래 B2 절).
  it("Tailwind 4 선언 + src/app/globals.css 에 @import \"tailwindcss\" · 토큰 진입점, 설정 파일 없음 → pass (재현 사례)", async () => {
    const dir = await project(
      { "src/app/globals.css": `@import "tailwindcss";\n${TOKENS_LINE}\n:root{--radius:0.5rem;}` },
      { tailwindcss: "^4" }
    );
    expect(await tailwindItem(dir)).toEqual({
      name: "tailwind.config",
      severity: "pass",
      message: 'Tailwind 4: src/app/globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다',
    });
  });

  it("같은 프로젝트에서 import 를 지우면 warn (대조군)", async () => {
    const dir = await project({ "src/app/globals.css": ":root{--background:#fff;}" }, { tailwindcss: "^4" });
    expect(await tailwindItem(dir)).toMatchObject({ severity: "warn", message: 'Tailwind 4: src/app/globals.css에 @import "tailwindcss" 가 없습니다' });
  });

  it("Tailwind 4 인데 CSS 후보가 없으면 warn, CSS 없음의 fail 은 globals.css 항목이 냄", async () => {
    const dir = await project({}, { tailwindcss: "^4.1.0" });
    const results = await collectCheckResults(dir);
    expect(results.find((r) => r.name === "tailwind.config")).toMatchObject({ severity: "warn" });
    expect(results.find((r) => r.name === "globals.css")).toMatchObject({ severity: "fail" });
  });

  it("import 표기: 작은따옴표 + layer, url(), 블록 주석 안만 있으면 없음", async () => {
    const one = await project({ "app/globals.css": `@import 'tailwindcss' layer(base);\n${TOKENS_LINE}` }, { tailwindcss: "4.1.3" });
    const two = await project({ "app/globals.css": `@import url("tailwindcss");\n${TOKENS_LINE}` }, { tailwindcss: ">=4" });
    const commented = await project({ "app/globals.css": '/* @import "tailwindcss"; */' }, { tailwindcss: "^4" });
    expect((await tailwindItem(one)).severity).toBe("pass");
    expect((await tailwindItem(two)).severity).toBe("pass");
    expect((await tailwindItem(commented)).severity).toBe("warn");
  });

  it("설치본이 선언보다 앞섬: 선언 ^3 이어도 설치본 4.1.0 이면 Tailwind 4 규칙", async () => {
    const dir = await project(
      { "node_modules/tailwindcss/package.json": JSON.stringify({ version: "4.1.0" }), "globals.css": `@import "tailwindcss";${TOKENS_LINE}` },
      { tailwindcss: "^3.4.0" }
    );
    expect(await tailwindItem(dir)).toMatchObject({ severity: "pass", message: expect.stringContaining("Tailwind 4: globals.css") });
  });

  it("Tailwind 4 라도 tailwind.config.ts 는 보지 않음(CSS 기준)", async () => {
    const dir = await project({ "tailwind.config.ts": "hsl(var(--x))", "globals.css": "" }, { tailwindcss: "^4" });
    expect((await tailwindItem(dir)).severity).toBe("warn");
  });

  it("Tailwind 3: .mjs · .cjs 설정은 warn(TypeScript 권장), 종전에는 fail", async () => {
    const mjs = await project({ "tailwind.config.mjs": "export default {}" }, { tailwindcss: "^3.4.0" });
    const cjs = await project({ "tailwind.config.cjs": "module.exports = {}" }, { tailwindcss: "^3.4.0" });
    expect(await tailwindItem(mjs)).toMatchObject({ severity: "warn", message: "tailwind.config.mjs 존재 (TypeScript 권장)" });
    expect(await tailwindItem(cjs)).toMatchObject({ severity: "warn", message: "tailwind.config.cjs 존재 (TypeScript 권장)" });
  });

  it("Tailwind 3 · 판정 불가에서 설정 파일이 없으면 종전대로 fail", async () => {
    const v3 = await project({ "globals.css": '@import "tailwindcss";' }, { tailwindcss: "^3.4.0" });
    const unknown = await project({ "globals.css": '@import "tailwindcss";' }, { tailwindcss: "catalog:" });
    const noPkg = await project({}, null);
    for (const dir of [v3, unknown, noPkg]) {
      expect(await tailwindItem(dir)).toEqual({ name: "tailwind.config", severity: "fail", message: "tailwind.config 파일이 없습니다" });
    }
  });

  it("runCheck 는 개수를 돌려줌", async () => {
    const dir = await project({ "src/app/globals.css": `@import "tailwindcss";\n${TOKENS_LINE}` }, { tailwindcss: "^4" });
    vi.spyOn(console, "log").mockImplementation(() => {});
    // WI-0044 보정: 토큰 진입점 import 로 globals.css 도 pass(종전 1 pass / 3 warn)
    expect(await runCheck(dir)).toEqual({ pass: 2, warn: 2, fail: 1 });
  });

  // WI-0044 FR-4: Tailwind 4 에서 토큰 진입점이 없으면 warn
  describe("WI-0044: Tailwind 4 토큰 진입점", () => {
    const WARN_MESSAGE = (css: string) =>
      `Tailwind 4: ${css}에 AXIS 토큰 진입점이 없습니다 → @import "@axis-ds/tokens/css/tailwind4";`;

    it("@import \"tailwindcss\" 만 있고 진입점이 없으면 warn, 문구에 넣을 import 줄", async () => {
      const dir = await project({ "src/app/globals.css": '@import "tailwindcss";\n' }, { tailwindcss: "^4" });
      expect(await tailwindItem(dir)).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message: WARN_MESSAGE("src/app/globals.css"),
      });
    });

    it("진입점이 있으면 pass (작은따옴표 · url() · layer 표기 포함)", async () => {
      for (const line of [
        TOKENS_LINE,
        "@import '@axis-ds/tokens/css/tailwind4';",
        '@import url("@axis-ds/tokens/css/tailwind4");',
        '@import "@axis-ds/tokens/css/tailwind4" layer(theme);',
      ]) {
        const dir = await project({ "app/globals.css": `@import "tailwindcss";\n${line}\n` }, { tailwindcss: "^4" });
        expect({ line, item: await tailwindItem(dir) }).toEqual({
          line,
          item: {
            name: "tailwind.config",
            severity: "pass",
            message: 'Tailwind 4: app/globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다',
          },
        });
      }
    });

    it("진입점이 블록 주석 안에만 있으면 warn", async () => {
      const dir = await project(
        { "globals.css": `@import "tailwindcss";\n/* ${TOKENS_LINE} */\n/*\n${TOKENS_LINE}\n*/` },
        { tailwindcss: "^4" }
      );
      expect(await tailwindItem(dir)).toMatchObject({ severity: "warn", message: WARN_MESSAGE("globals.css") });
    });

    it("다른 tokens 경로(css · css/shadcn · tailwind preset)는 진입점으로 치지 않음", async () => {
      const dir = await project(
        {
          "globals.css":
            '@import "tailwindcss";\n@import "@axis-ds/tokens/css";\n@import "@axis-ds/tokens/css/shadcn";\n@import "@axis-ds/tokens/tailwind";',
        },
        { tailwindcss: "^4" }
      );
      expect((await tailwindItem(dir)).severity).toBe("warn");
    });

    it("진입점만 있고 @import \"tailwindcss\" 가 없으면 종전 warn 문구(Tailwind 진입 import 없음)", async () => {
      const dir = await project({ "globals.css": `${TOKENS_LINE}\n` }, { tailwindcss: "^4" });
      expect(await tailwindItem(dir)).toMatchObject({
        severity: "warn",
        message: 'Tailwind 4: globals.css에 @import "tailwindcss" 가 없습니다',
      });
    });

    it("다른 CSS 파일에 있는 진입점은 보지 않음(처음 찾은 CSS 하나만 봄)", async () => {
      const dir = await project(
        { "globals.css": '@import "tailwindcss";', "app/globals.css": `@import "tailwindcss";\n${TOKENS_LINE}` },
        { tailwindcss: "^4" }
      );
      expect(await tailwindItem(dir)).toMatchObject({ severity: "warn", message: WARN_MESSAGE("globals.css") });
    });

    it("Tailwind 3 은 CSS 진입점과 관계없이 종전 규칙(tailwind.config.ts)", async () => {
      const withEntry = await project(
        { "tailwind.config.ts": "hsl(var(--x))", "globals.css": `@import "tailwindcss";\n${TOKENS_LINE}` },
        { tailwindcss: "^3.4.0" }
      );
      const withoutEntry = await project({ "tailwind.config.ts": "hsl(var(--x))", "globals.css": "" }, { tailwindcss: "^3.4.0" });
      for (const dir of [withEntry, withoutEntry]) {
        expect(await tailwindItem(dir)).toEqual({
          name: "tailwind.config",
          severity: "pass",
          message: "tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다",
        });
      }
    });
  });

  // WI-0044 보정: globals.css 항목이 tokens CSS import 를 AXIS 변수 정의로 인정
  describe("WI-0044 보정: globals.css 의 tokens CSS import", () => {
    const globalsItem = async (dir: string) => (await collectCheckResults(dir)).find((r) => r.name === "globals.css")!;

    it("css · css/shadcn · css/tailwind4 import(큰 · 작은따옴표 · url() · layer())는 pass, 문구에 import 경로", async () => {
      for (const spec of ["@axis-ds/tokens/css", "@axis-ds/tokens/css/shadcn", "@axis-ds/tokens/css/tailwind4"]) {
        for (const line of [
          `@import "${spec}";`,
          `@import '${spec}';`,
          `@import url("${spec}");`,
          `@import url('${spec}') layer(base);`,
          `@import "${spec}" layer(base);`,
        ]) {
          const dir = await project({ "src/app/globals.css": `@import "tailwindcss";\n${line}\n` }, { tailwindcss: "^4" });
          expect({ line, item: await globalsItem(dir) }).toEqual({
            line,
            item: {
              name: "globals.css",
              severity: "pass",
              message: `src/app/globals.css에 AXIS CSS 변수가 있습니다 (${spec} import)`,
            },
          });
        }
      }
    });

    it("블록 주석 안에만 있으면 종전 warn", async () => {
      const dir = await project(
        { "app/globals.css": `@import "tailwindcss";\n/* ${TOKENS_LINE} */\n/*\n@import "@axis-ds/tokens/css";\n*/` },
        { tailwindcss: "^4" }
      );
      expect(await globalsItem(dir)).toEqual({ name: "globals.css", severity: "warn", message: "app/globals.css에 AXIS CSS 변수가 없습니다" });
    });

    it("다른 tokens 경로(brands/ontology · tailwind preset · css/variables 오타)는 인정하지 않음", async () => {
      const dir = await project(
        {
          "globals.css":
            '@import "@axis-ds/tokens/css/brands/ontology";\n@import "@axis-ds/tokens/tailwind";\n@import "@axis-ds/tokens/css/shadcn-compat";',
        },
        { tailwindcss: "^4" }
      );
      expect((await globalsItem(dir)).severity).toBe("warn");
    });

    it("변수를 직접 정의하면 import 가 함께 있어도 종전 pass 문구", async () => {
      const dir = await project(
        { "globals.css": `${TOKENS_LINE}\n:root{--background:0 0% 100%;--primary:0 0% 0%;}` },
        { tailwindcss: "^4" }
      );
      expect(await globalsItem(dir)).toEqual({
        name: "globals.css",
        severity: "pass",
        message: "globals.css에 AXIS CSS 변수가 정의되어 있습니다",
      });
    });

    it("처음 찾은 CSS 하나만 봄(다른 후보의 import 는 보지 않음)", async () => {
      const dir = await project({ "globals.css": "body{}", "app/globals.css": TOKENS_LINE }, { tailwindcss: "^4" });
      expect(await globalsItem(dir)).toMatchObject({ severity: "warn", message: "globals.css에 AXIS CSS 변수가 없습니다" });
    });
  });

  // WI-0044 보정: Tailwind 4 진입점 WARN 의 버전 안내
  describe("WI-0044 보정: 진입점 WARN 의 1.4.0 안내", () => {
    const WARN = 'Tailwind 4: globals.css에 AXIS 토큰 진입점이 없습니다 → @import "@axis-ds/tokens/css/tailwind4";';

    it("tokens ^1.3.0 선언 → 문구에 1.4.0 이상 필요", async () => {
      const dir = await project({ "globals.css": '@import "tailwindcss";' }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0" });
      expect((await tailwindItem(dir)).message).toBe(`${WARN} (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)`);
    });

    it("^1.4.0 선언 · 선언 없음 → 덧붙이지 않음", async () => {
      const ok = await project({ "globals.css": '@import "tailwindcss";' }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.4.0" });
      const none = await project({ "globals.css": '@import "tailwindcss";' }, { tailwindcss: "^4" });
      expect((await tailwindItem(ok)).message).toBe(WARN);
      expect((await tailwindItem(none)).message).toBe(WARN);
    });

    it("1.4.0 미만(ui-react 1.3.1)은 「1.4.0 이상 필요」, 판정 불가(agentic-ui catalog:)는 「설치된 버전을 확인」으로 나눔(A1, 선언 순서)", async () => {
      const dir = await project(
        {
          "globals.css":
            '@import "tailwindcss";\n@import "@axis-ds/ui-react/tailwind.css";\n@import "@axis-ds/agentic-ui/tailwind.css";',
        },
        { tailwindcss: "^4", "@axis-ds/agentic-ui": "catalog:", "@axis-ds/ui-react": "1.3.1" }
      );
      expect((await tailwindItem(dir)).message).toBe(
        `${WARN} (1.4.0 이상 필요: @axis-ds/ui-react 1.3.1) (설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/agentic-ui catalog:)`
      );
    });

    it("진입점이 있어도 tokens 선언 하한이 1.4.0 미만이면 warn(A4, 종전에는 pass)", async () => {
      const dir = await project(
        { "globals.css": `@import "tailwindcss";\n${TOKENS_LINE}` },
        { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0" }
      );
      expect(await tailwindItem(dir)).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message:
          "Tailwind 4: globals.css에 AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)",
      });
    });
  });

  describe("axis check 종료 코드", () => {
    let saved: typeof process.exitCode;
    beforeEach(() => {
      saved = process.exitCode;
      process.exitCode = undefined;
    });
    afterEach(() => {
      process.exitCode = saved;
    });

    async function runCommand(dir: string): Promise<typeof process.exitCode> {
      const { Command } = await import("commander");
      const { registerCheckCommand } = await import("./index.js");
      const program = new Command().exitOverride();
      registerCheckCommand(program);
      vi.spyOn(console, "log").mockImplementation(() => {});
      await program.parseAsync(["node", "axis", "check", "-d", dir]);
      const code = process.exitCode;
      process.exitCode = undefined;
      return code;
    }

    it("fail 이 있으면 1", async () => {
      expect(await runCommand(await tempDir())).toBe(1);
    });

    it("warn 만 있으면 설정하지 않음(0)", async () => {
      const dir = await tempDir();
      await writeAllPassProject(dir, {}, ":root{--background:0;}");
      const summary = await runCheck(dir);
      expect(summary.fail).toBe(0);
      expect(summary.warn).toBeGreaterThan(0);
      expect(await runCommand(dir)).toBeUndefined();
    });

    it("모두 pass 면 설정하지 않음(0)", async () => {
      const dir = await tempDir();
      await writeAllPassProject(dir, {});
      expect(await runCommand(dir)).toBeUndefined();
    });
  });
});

// 보정 2차(2026-10-20 사용자 결정 A1 · A3 · A4 · B1 · B2 · B3 · C). MCP template.test.ts 가 같은 문구를 고정합니다.
describe("WI-0044 보정 2차: 버전 조건 · 컴포넌트 import · create-next-app 기본 정의 · preset · 합치기", () => {
  async function project(files: Record<string, string>, deps: Record<string, string> | null, field = "dependencies") {
    const dir = await tempDir();
    if (deps) await fs.writeJSON(path.join(dir, "package.json"), { [field]: deps });
    for (const [rel, content] of Object.entries(files)) {
      await fs.ensureDir(path.dirname(path.join(dir, rel)));
      await fs.writeFile(path.join(dir, rel), content);
    }
    return dir;
  }
  const tailwindItem = async (dir: string) => (await collectCheckResults(dir)).find((r) => r.name === "tailwind.config")!;
  const TW = '@import "tailwindcss";';
  const UI = '@import "@axis-ds/ui-react/tailwind.css";';
  const AG = '@import "@axis-ds/agentic-ui/tailwind.css";';
  const NO_ENTRY = `AXIS 토큰 진입점이 없습니다 → ${TOKENS_LINE}`;
  const PASS4 = 'Tailwind 4: globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다';

  describe("A3: 범위 하한 해석 분기", () => {
    it("rangeLowerAtLeast 직접 호출: 하이픈은 왼쪽 하한, 비교자 집합은 가장 높은 하한", () => {
      const table: [string, boolean | undefined][] = [
        ["1.3.0 - 1.5.0", false],
        ["1.4.0 - 1.3.0", true], // 왼쪽 하한만 봄(오른쪽은 읽을 수 있는지만 확인)
        ["1.4.0 - 2", true],
        [">=1.2 >=1.4", true],
        [">=1.4 >=1.2", true],
        [">=1.2 <1.9", false],
        [">1.3", true], // >1.3 → 1.4.0
        [">1.3.9", false], // >1.3.9 → 1.3.10
        [">1", true], // >1 → 2.0.0
        ["^1.4.0-beta.1", false], // prerelease 하한은 같은 core 정식보다 낮음
        ["1.x", false],
        ["<2", undefined],
        ["*", undefined],
        ["catalog:", undefined],
        ["latest", undefined],
        ["^1 || ^2", undefined],
        ["workspace:*", undefined],
      ];
      for (const [range, expected] of table) {
        expect({ range, got: rangeLowerAtLeast(range, "1.4.0") }).toEqual({ range, got: expected });
      }
    });

    it("axisPackagesBelowTailwind4 직접 호출: below · unknown 분류, workspace: 제외, 선언 순서, devDependencies 포함", () => {
      expect(
        axisPackagesBelowTailwind4({
          dependencies: { "@axis-ds/agentic-ui": "latest", "@axis-ds/ui-react": "1.3.0 - 1.5.0" },
          devDependencies: { "@axis-ds/tokens": "workspace:^1.3.0" },
        })
      ).toEqual([
        { name: "@axis-ds/ui-react", range: "1.3.0 - 1.5.0", status: "below" },
        { name: "@axis-ds/agentic-ui", range: "latest", status: "unknown" },
      ]);
      expect(axisPackagesBelowTailwind4({ dependencies: { "@axis-ds/tokens": ">=1.2 >=1.4" } })).toEqual([]);
      expect(axisPackagesBelowTailwind4({ dependencies: { "@axis-ds/tokens": "workspace:*" } })).toEqual([]);
      expect(axisPackagesBelowTailwind4({ dependencies: { "@axis-ds/tokens": "^1 || ^2" } })).toEqual([
        { name: "@axis-ds/tokens", range: "^1 || ^2", status: "unknown" },
      ]);
      expect(axisPackagesBelowTailwind4(undefined)).toEqual([]);
      expect(axisPackagesBelowTailwind4({ name: "x" })).toEqual([]);
    });

    it("check 문구: '1.3.0 - 1.5.0' 은 안내 있음, '>=1.2 >=1.4' 는 안내 없음", async () => {
      const hyphen = await project({ "globals.css": TW }, { tailwindcss: "^4", "@axis-ds/tokens": "1.3.0 - 1.5.0" });
      const set = await project({ "globals.css": TW }, { tailwindcss: "^4", "@axis-ds/tokens": ">=1.2 >=1.4" });
      expect((await tailwindItem(hyphen)).message).toBe(
        `Tailwind 4: globals.css에 ${NO_ENTRY} (1.4.0 이상 필요: @axis-ds/tokens 1.3.0 - 1.5.0)`
      );
      expect((await tailwindItem(set)).message).toBe(`Tailwind 4: globals.css에 ${NO_ENTRY}`);
    });
  });

  describe("A1: 판정 불가 범위는 확인 문구, workspace: 는 안내 없음", () => {
    it("catalog: · latest · || · <2 → (설치된 버전이 1.4.0 이상인지 확인하세요: ...)", async () => {
      for (const range of ["catalog:", "latest", "^1 || ^2", "<2"]) {
        const dir = await project({ "globals.css": TW }, { tailwindcss: "^4", "@axis-ds/tokens": range });
        expect({ range, message: (await tailwindItem(dir)).message }).toEqual({
          range,
          message: `Tailwind 4: globals.css에 ${NO_ENTRY} (설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/tokens ${range})`,
        });
      }
    });

    it("workspace:* · workspace:^1.3.0 → 버전 안내 없음", async () => {
      for (const range of ["workspace:*", "workspace:^1.3.0"]) {
        const dir = await project({ "globals.css": TW }, { tailwindcss: "^4", "@axis-ds/tokens": range });
        expect({ range, message: (await tailwindItem(dir)).message }).toEqual({ range, message: `Tailwind 4: globals.css에 ${NO_ENTRY}` });
      }
    });
  });

  describe("A4: 진입점이 있을 때 tokens 선언 조건", () => {
    it("tokens catalog: → warn, 확인 문구", async () => {
      const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4", "@axis-ds/tokens": "catalog:" });
      expect(await tailwindItem(dir)).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message:
          "Tailwind 4: globals.css에 AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/tokens catalog:)",
      });
    });

    it("tokens ^1.4.0 · workspace:* · 선언 없음 → pass (음성 대조)", async () => {
      const cases: Record<string, string>[] = [{ "@axis-ds/tokens": "^1.4.0" }, { "@axis-ds/tokens": "workspace:*" }, {}];
      for (const deps of cases) {
        const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4", ...deps });
        expect({ deps, item: await tailwindItem(dir) }).toEqual({
          deps,
          item: { name: "tailwind.config", severity: "pass", message: PASS4 },
        });
      }
    });

    it("A4 는 tokens 만 봄: import 가 있는 ui-react 1.3.0 은 진입점이 있으면 warn 을 만들지 않음", async () => {
      const dir = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n${UI}` },
        { tailwindcss: "^4", "@axis-ds/tokens": "^1.4.0", "@axis-ds/ui-react": "1.3.0" }
      );
      expect((await tailwindItem(dir)).severity).toBe("pass");
    });
  });

  describe("B1: 선언된 컴포넌트 패키지의 tailwind.css import", () => {
    it("ui-react 선언 + import 없음 → warn, 빠진 import 줄", async () => {
      const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0" });
      expect(await tailwindItem(dir)).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message: `Tailwind 4: globals.css에 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${UI}`,
      });
    });

    it("두 패키지 선언(devDependencies 포함), 하나만 import → 빠진 쪽만", async () => {
      const dir = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n${UI}` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0", "@axis-ds/agentic-ui": "^1.4.0" },
        "devDependencies"
      );
      expect((await tailwindItem(dir)).message).toBe(`Tailwind 4: globals.css에 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${AG}`);
    });

    it("둘 다 빠짐 → 선언 순서(ui-react · agentic-ui)로 두 줄", async () => {
      const dir = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}` },
        { tailwindcss: "^4", "@axis-ds/agentic-ui": "^1.4.0", "@axis-ds/ui-react": "^1.4.0" }
      );
      expect((await tailwindItem(dir)).message).toBe(`Tailwind 4: globals.css에 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${UI} ${AG}`);
    });

    it("작은따옴표 · url() · layer() 표기는 import 로 인정, 블록 주석 안은 없음", async () => {
      const ok = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n@import '@axis-ds/ui-react/tailwind.css' layer(base);\n@import url("@axis-ds/agentic-ui/tailwind.css");` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0", "@axis-ds/agentic-ui": "^1.4.0" }
      );
      const commented = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n/* ${UI} */` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0" }
      );
      expect((await tailwindItem(ok)).severity).toBe("pass");
      expect((await tailwindItem(commented)).severity).toBe("warn");
    });

    it("선언이 없으면 요구하지 않음(복사 설치), 다른 파일 이름(tailwind.cs)은 인정하지 않음", async () => {
      const none = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4" });
      const typo = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n@import "@axis-ds/ui-react/tailwind.cs";` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0" }
      );
      expect((await tailwindItem(none)).severity).toBe("pass");
      expect((await tailwindItem(typo)).severity).toBe("warn");
    });
  });

  describe("B2: create-next-app 기본 정의 (create-next-app@15.5.28 실물 기준)", () => {
    const ALL =
      "create-next-app 기본 정의가 남아 있습니다(:root 색값 --background · @theme --color-background: var(--background) · @theme --font-mono: var(--font-geist-mono) · body background: var(--background)) → 지우세요";

    it("fixture 는 create-next-app@15.5.28 기본 globals.css 그대로(특징 줄 4종을 담음)", async () => {
      const cna = await fs.readFile(CNA_GLOBALS_FILE, "utf8");
      expect(cna.startsWith('@import "tailwindcss";')).toBe(true);
      for (const line of ["--background: #ffffff;", "--color-background: var(--background);", "--font-mono: var(--font-geist-mono);", "background: var(--background);"]) {
        expect(cna).toContain(line);
      }
    });

    it("기본 globals.css 에 진입점만 더함 → warn, 특징 4종 모두 표시", async () => {
      const cna = await fs.readFile(CNA_GLOBALS_FILE, "utf8");
      const dir = await project({ "app/globals.css": cna.replace(TW, `${TW}\n${TOKENS_LINE}`) }, { tailwindcss: "^4" });
      expect(await tailwindItem(dir)).toEqual({ name: "tailwind.config", severity: "warn", message: `Tailwind 4: app/globals.css에 ${ALL}` });
    });

    it("기본 globals.css 그대로(진입점 없음) → 진입점 WARN 만, B2 는 진입점이 있을 때만 봄", async () => {
      const cna = await fs.readFile(CNA_GLOBALS_FILE, "utf8");
      const dir = await project({ "app/globals.css": cna }, { tailwindcss: "^4" });
      expect((await tailwindItem(dir)).message).toBe(`Tailwind 4: app/globals.css에 ${NO_ENTRY}`);
    });

    it("특징을 하나씩만 남기면 그 이름만 표시", async () => {
      const cases: [string, string][] = [
        [":root { --foreground: oklch(0.2 0 0); }", ":root 색값 --background"],
        ["@theme inline { --color-foreground: var(--foreground); }", "@theme --color-background: var(--background)"],
        ["@theme inline { --font-sans: var(--font-geist-sans); }", "@theme --font-mono: var(--font-geist-mono)"],
        ["body { color: var(--foreground); }", "body background: var(--background)"],
      ];
      for (const [css, label] of cases) {
        const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}\n${css}` }, { tailwindcss: "^4" });
        expect({ css, message: (await tailwindItem(dir)).message }).toEqual({
          css,
          message: `Tailwind 4: globals.css에 create-next-app 기본 정의가 남아 있습니다(${label}) → 지우세요`,
        });
      }
    });

    it("오탐 음성 대조: 문서 권장형 · HSL 삼중값 재정의 · hsl(var()) 사용 · 다른 이름 · 주석 안 → pass", async () => {
      const cna = await fs.readFile(CNA_GLOBALS_FILE, "utf8");
      const fine = [
        `${TW}\n${TOKENS_LINE}\n${UI}`,
        `${TW}\n${TOKENS_LINE}\n:root { --background: 0 0% 100%; --foreground: 222 47% 11%; --radius: 1rem; }`,
        `${TW}\n${TOKENS_LINE}\nbody { background: hsl(var(--background)); color: hsl(var(--foreground)); }`,
        `${TW}\n${TOKENS_LINE}\n:root { --sidebar-background: #fff; --axis-background: #000; }\n.x { --color-brand: var(--brand); font-family: var(--font-geist-sans); }`,
        `${TW}\n${TOKENS_LINE}\n/*\n${cna}\n*/`,
      ];
      for (const css of fine) {
        const dir = await project({ "globals.css": css }, { tailwindcss: "^4" });
        expect({ css, item: await tailwindItem(dir) }).toEqual({ css, item: { name: "tailwind.config", severity: "pass", message: PASS4 } });
      }
    });

    it("globals.css 항목은 그대로 pass(B2 는 tailwind 항목에만 붙임)", async () => {
      const cna = await fs.readFile(CNA_GLOBALS_FILE, "utf8");
      const dir = await project({ "app/globals.css": cna.replace(TW, `${TW}\n${TOKENS_LINE}`) }, { tailwindcss: "^4" });
      expect((await collectCheckResults(dir)).find((r) => r.name === "globals.css")).toEqual({
        name: "globals.css",
        severity: "pass",
        message: "app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css/tailwind4 import)",
      });
    });
  });

  describe("B3: Tailwind 3 설정 파일의 preset 참조", () => {
    const PRESET = (file: string) => ({
      name: "tailwind.config",
      severity: "pass",
      message: `${file}에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)`,
    });

    it("tailwind.config.ts: import · require(작은따옴표) · import() → preset pass", async () => {
      for (const src of [
        'import axis from "@axis-ds/tokens/tailwind";\nexport default { presets: [axis] };',
        "export default { presets: [require('@axis-ds/tokens/tailwind')] };",
        'export default { presets: [(await import("@axis-ds/tokens/tailwind")).default] };',
      ]) {
        const dir = await project({ "tailwind.config.ts": src }, { tailwindcss: "^3.4.0" });
        expect({ src, item: await tailwindItem(dir) }).toEqual({ src, item: PRESET("tailwind.config.ts") });
      }
    });

    it(".js · .mjs · .cjs 도 preset 참조면 pass, 없으면 종전 warn(TypeScript 권장)", async () => {
      for (const file of ["tailwind.config.js", "tailwind.config.mjs", "tailwind.config.cjs"]) {
        const withPreset = await project({ [file]: "module.exports = { presets: [require('@axis-ds/tokens/tailwind')] };" }, { tailwindcss: "^3.4.0" });
        const without = await project({ [file]: "module.exports = { content: ['./app/**/*.tsx'] };" }, { tailwindcss: "^3.4.0" });
        expect(await tailwindItem(withPreset)).toEqual(PRESET(file));
        expect(await tailwindItem(without)).toEqual({ name: "tailwind.config", severity: "warn", message: `${file} 존재 (TypeScript 권장)` });
      }
    });

    it("주석 안 · 다른 경로 · 문자열 속 // 뒤 참조", async () => {
      const commented = await project(
        { "tailwind.config.ts": '// import axis from "@axis-ds/tokens/tailwind";\n/* require("@axis-ds/tokens/tailwind") */\nexport default {};' },
        { tailwindcss: "^3.4.0" }
      );
      const other = await project(
        { "tailwind.config.ts": 'import a from "@axis-ds/tokens/tailwind-preset";\nimport b from "@axis-ds/tokens/css/tailwind4";\nexport default {};' },
        { tailwindcss: "^3.4.0" }
      );
      const urlString = await project(
        { "tailwind.config.ts": 'const u = "https://example.com"; const p = require("@axis-ds/tokens/tailwind");\nexport default { presets: [p] };' },
        { tailwindcss: "^3.4.0" }
      );
      expect((await tailwindItem(commented)).message).toBe("tailwind.config.ts에 AXIS 토큰 설정이 없습니다");
      expect((await tailwindItem(other)).message).toBe("tailwind.config.ts에 AXIS 토큰 설정이 없습니다");
      expect(await tailwindItem(urlString)).toEqual(PRESET("tailwind.config.ts"));
    });

    it("종전 기준(hsl(var( · --background))으로 pass 면 preset 이 함께 있어도 종전 문구(기준선 유지)", async () => {
      const dir = await project(
        { "tailwind.config.ts": "import axis from '@axis-ds/tokens/tailwind';\nexport default { presets: [axis], theme: { extend: { colors: { x: 'hsl(var(--x))' } } } };" },
        { tailwindcss: "^3.4.0" }
      );
      expect(await tailwindItem(dir)).toEqual({ name: "tailwind.config", severity: "pass", message: "tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다" });
    });

    it("Tailwind 4 에서는 preset 참조가 있어도 설정 파일을 보지 않음", async () => {
      const dir = await project(
        { "tailwind.config.ts": "import axis from '@axis-ds/tokens/tailwind';", "globals.css": TW },
        { tailwindcss: "^4" }
      );
      expect((await tailwindItem(dir)).message).toBe(`Tailwind 4: globals.css에 ${NO_ENTRY}`);
    });
  });

  describe("C: 여러 경고를 한 항목에 합침", () => {
    it("진입점 없음 + 컴포넌트 import 없음 + 1.4.0 미만 → 우선순위 순서, 버전 안내는 끝에 한 번", async () => {
      const dir = await project({ "globals.css": TW }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "^1.3.0" });
      expect(await tailwindItem(dir)).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message: `Tailwind 4: globals.css에 ${NO_ENTRY} / 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${UI} (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0 · @axis-ds/ui-react ^1.3.0)`,
      });
    });

    it("진입점 있음 + 컴포넌트 · create-next-app 기본 정의 · tokens 버전 · 판정 불가 → 4개 문제 + 버전 안내 2개", async () => {
      const dir = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\nbody { background: var(--background); }` },
        { tailwindcss: "^4", "@axis-ds/tokens": "~1.3.2", "@axis-ds/agentic-ui": "catalog:" }
      );
      expect((await tailwindItem(dir)).message).toBe(
        "Tailwind 4: globals.css에 " +
          [
            `컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${AG}`,
            "create-next-app 기본 정의가 남아 있습니다(body background: var(--background)) → 지우세요",
            "AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다",
          ].join(" / ") +
          " (1.4.0 이상 필요: @axis-ds/tokens ~1.3.2) (설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/agentic-ui catalog:)"
      );
    });

    it("버전만 걸린 ui-react 는 다른 문제가 없으면 warn 을 만들지 않고, 다른 문제가 있으면 끝에 안내", async () => {
      const onlyVersion = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n${UI}` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.3.0" }
      );
      const withDefault = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n${UI}\n:root { --background: #fff; }` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.3.0" }
      );
      expect((await tailwindItem(onlyVersion)).severity).toBe("pass");
      expect((await tailwindItem(withDefault)).message).toBe(
        "Tailwind 4: globals.css에 create-next-app 기본 정의가 남아 있습니다(:root 색값 --background) → 지우세요 (1.4.0 이상 필요: @axis-ds/ui-react ^1.3.0)"
      );
    });

    it("@import \"tailwindcss\" 가 없으면 다른 문제와 합치지 않고 종전 문구 하나", async () => {
      const dir = await project({ "globals.css": ":root { --background: #fff; }" }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "^1.3.0" });
      expect((await tailwindItem(dir)).message).toBe('Tailwind 4: globals.css에 @import "tailwindcss" 가 없습니다');
    });
  });
});
