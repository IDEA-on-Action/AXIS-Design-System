import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { collectCheckResults, runCheck } from "./template-check.js";
import {
  axisPackagesBelowTailwind4,
  contentGlobCovers,
  contentGlobToRegExp,
  detectTailwind,
  findCreateNextAppDefaults,
  hasComponentSource,
  packageVersionGate,
  rangeLowerAtLeast,
  readTailwindContent,
} from "./tailwind-core.js";
import { findPnpUnpluggedPackages, isPnpProject, versionSatisfiesRange } from "@axis-ds/registry-core/project";
import { templateApplyWarnings } from "./template-apply.js";
import { planUtilsDependencies, resolveInitAnswers, tailwind4GuideLines } from "../init/init.js";
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

/** node_modules/<name>/package.json 설치본 stub(WI-0051: dependencies 항목이 설치본을 봄) */
async function writeInstalledStub(dir: string, name: string, version = "1.0.0") {
  await fs.outputJSON(path.join(dir, "node_modules", ...name.split("/"), "package.json"), { name, version });
}

/**
 * 기존 5항목이 모두 pass 이던 프로젝트(기준선 allPass 와 같은 파일). WI-0051 부터 dependencies 는 설치본도 보므로
 * 선언한 세 패키지의 설치본 stub 을 함께 씁니다. 기본 CSS 는 자체 변수만이라 WI-0070 부터 globals.css 는 WARN 입니다.
 */
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
  for (const name of ["tailwindcss", "clsx", "tailwind-merge"]) await writeInstalledStub(dir, name);
}

/** AXIS 근거가 있는 globals.css(WI-0070: tokens CSS import 가 있어야 pass) */
const AXIS_CSS = '@import "@axis-ds/tokens/css";\n:root{--background:0;--primary:0;}\n';

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

/**
 * 기준선(1e84f15) 대비 의도한 변경(WI-0037 · WI-0065). 여기 적은 줄 말고는 기준선과 같아야 합니다.
 * - theme-only: 템플릿 구조가 app/ 로 바뀌어(WI-0037 D1) globals.css 항목이 app/globals.css 를 봄 · Tailwind 3 은 preset 이
 *   있어야 pass 라 자체 hsl(var()) 매핑은 WARN(WI-0065 D8 거짓 초록 정정) · componentsDir 가 있어 content 항목(PASS)이 더해짐
 * - allPass: 같은 거짓 초록 정정으로 tailwind.config 가 WARN(fixture 는 기준선 캡처 때와 같은 "hsl(var(--x))")
 * - WI-0051(배치 3): dependencies 가 설치본도 봄. fixture 에 node_modules 가 없는 theme-only · app-init · src-app · brokenConfig 는
 *   「선언됐지만 설치되지 않은 의존성」이 붙고, allPass 는 빌더가 설치본 stub 을 써서 pass 문구만 바뀜
 * - WI-0070(배치 3): 자체 --background · --primary 만 있는 globals.css(theme-only · allPass)가 pass 에서 WARN(AXIS 근거 없음)
 * - WI-0100a(Q35): app-init 은 globalCss 가 가리키는 ./src/app/globals.css 가 없어 globals.css 항목 끝에 「(globalCss ./src/app/globals.css 없음)」
 * 바뀌지 않은 프로젝트(emptyDir)는 기준선 그대로입니다(음성 대조).
 */
const INTENDED: Partial<Record<BaselineName, (l: string[]) => string[]>> = {
  "theme-only": (l) => [
    l[0],
    l[1],
    "  WARN  tailwind.config.ts에 AXIS preset(@axis-ds/tokens/tailwind)이 없습니다 (자체 CSS 변수 매핑만 있음, presets 에 넣으세요)",
    "  WARN  app/globals.css에 자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다 → @axis-ds/tokens CSS 를 import 하세요",
    l[4],
    "  WARN  선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → pnpm install",
    "  PASS  tailwind.config.ts의 content 가 componentsDir(./components/ui) 를 덮습니다",
    "",
    "  결과: 2 pass / 4 warn / 0 fail",
    l[8],
  ],
  // WI-0100a(Q35): app-init 의 globalCss(./src/app/globals.css)가 없어 globals.css 항목 끝에 brand 와 같은 표기가 붙음
  "app-init": (l) => [
    ...l.slice(0, 3),
    `${l[3]} (globalCss ./src/app/globals.css 없음)`,
    l[4],
    "  WARN  권장 의존성 누락: clsx, tailwind-merge / 선언됐지만 설치되지 않은 의존성: tailwindcss → pnpm install",
    ...l.slice(6),
  ],
  "src-app": (l) => [...l.slice(0, 5), "  WARN  권장 의존성 누락: clsx, tailwind-merge / 선언됐지만 설치되지 않은 의존성: tailwindcss → pnpm install", ...l.slice(6)],
  brokenConfig: (l) => [...l.slice(0, 5), "  WARN  권장 의존성 누락: clsx, tailwind-merge / 선언됐지만 설치되지 않은 의존성: tailwindcss → pnpm install", ...l.slice(6)],
  allPass: (l) => [
    l[0],
    l[1],
    "  WARN  tailwind.config.ts에 AXIS preset(@axis-ds/tokens/tailwind)이 없습니다 (자체 CSS 변수 매핑만 있음, presets 에 넣으세요)",
    "  WARN  app/globals.css에 자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다 → @axis-ds/tokens CSS 를 import 하세요",
    l[4],
    "  PASS  필수 및 권장 의존성이 선언 · 설치되어 있습니다 (3개 확인)",
    "",
    "  결과: 3 pass / 2 warn / 0 fail",
    "\n권장 항목을 확인하세요.",
  ],
};

/** 기준선에 의도한 변경을 적용한 기대 출력 */
const expectedOutput = (name: BaselineName, lines: string[]) => (INTENDED[name] ?? ((l: string[]) => l))(lines);

/** 기존 5항목 이름(package.json 이 없으면 5번째는 "package.json") */
const EXISTING_NAMES = ["axis.config.json", "tailwind.config", "globals.css", "utils.ts", "dependencies"];

const ICON: Record<CheckResult["severity"], string> = { pass: "PASS", warn: "WARN", fail: "FAIL" };

describe("T4-1: collectCheckResults 분리 뒤 출력 불변 (brand 없는 프로젝트, WI-0037 · WI-0065 의 의도한 변경만 반영)", async () => {
  const baseline = (await fs.readJSON(BASELINE_FILE)) as {
    head: string;
    outputs: Record<BaselineName, string[]>;
  };
  const names = Object.keys(baseline.outputs) as BaselineName[];

  it("기준선은 1e84f15 에서 캡처한 6개 프로젝트", () => {
    expect(baseline.head).toBe("1e84f15");
    expect(names).toEqual(["emptyDir", "theme-only", "app-init", "src-app", "brokenConfig", "allPass"]);
  });

  it("의도한 변경이 없는 프로젝트는 emptyDir 하나(음성 대조, 배치 3 의 WI-0051 · WI-0070 반영)", () => {
    expect(Object.keys(INTENDED).sort()).toEqual(["allPass", "app-init", "brokenConfig", "src-app", "theme-only"]);
  });

  for (const name of names) {
    it(`${name}: runCheck 출력이 정정 전과 줄 단위로 같음(의도한 변경 제외)`, async () => {
      const dir = await buildBaselineProject(name);
      expect(await captureRunCheck(dir)).toEqual(expectedOutput(name, baseline.outputs[name]));
    });

    it(`${name}: collectCheckResults 의 이름 · severity · 문구가 기대 출력 줄과 같음`, async () => {
      const dir = await buildBaselineProject(name);
      const results = await collectCheckResults(dir);
      const expected = expectedOutput(name, baseline.outputs[name]);
      const items = expected.slice(1, expected.indexOf(""));
      expect(results).toHaveLength(items.length);
      expect(results.slice(0, 5).map((r) => r.name)).toEqual(
        EXISTING_NAMES.slice(0, 4).concat(results[4].name === "package.json" ? "package.json" : "dependencies")
      );
      expect(results.some((r) => r.name === "brand")).toBe(false);
      const lines = results.map((r) => `  ${ICON[r.severity]}  ${r.message}`);
      expect(lines).toEqual(items);
    });
  }
});

/**
 * WI-0067 D4 (다): AXIS 토큰으로 전환한 현재 theme-only 템플릿(apps/web/public/templates/theme-only.json)의 check 기준선.
 * 위 T4-1 의 theme-only 는 전환 전 동결 사본이라(음성 대조) 같은 항목이 WARN 이고, 여기서는 tailwind.config · globals.css 가 PASS 입니다.
 * 설치본은 fixture tokens-1.3 만 두므로 의존성 항목은 「설치되지 않은 의존성」 WARN 입니다(기준선에 그대로 고정).
 */
describe("WI-0067: 전환 후 theme-only 템플릿 check 기준선", () => {
  it("tailwind.config · globals.css 가 PASS, fail 0 (동결 사본은 같은 두 항목이 WARN)", async () => {
    const dir = await makeProject({ tokens: "1.3", layout: "theme-only-axis" });
    created.push(dir);
    const byName = Object.fromEntries((await collectCheckResults(dir)).map((r) => [r.name, r.severity]));
    expect(byName["tailwind.config"]).toBe("pass");
    expect(byName["globals.css"]).toBe("pass");
    expect(Object.values(byName).filter((s) => s === "fail")).toEqual([]);

    const frozen = await makeProject({ tokens: "1.3", layout: "theme-only" });
    created.push(frozen);
    const frozenByName = Object.fromEntries((await collectCheckResults(frozen)).map((r) => [r.name, r.severity]));
    expect([frozenByName["tailwind.config"], frozenByName["globals.css"]]).toEqual(["warn", "warn"]);
  });

  it("runCheck 출력 줄 고정", async () => {
    const dir = await makeProject({ tokens: "1.3", layout: "theme-only-axis" });
    created.push(dir);
    expect(await captureRunCheck(dir)).toEqual([
      "\nAXIS 프로젝트 검증 결과:\n",
      "  PASS  axis.config.json 파일이 존재합니다",
      "  PASS  tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)",
      "  PASS  app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css import)",
      "  WARN  utils.ts를 찾을 수 없습니다 (컴포넌트 사용 시 필요)",
      "  WARN  선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → pnpm install",
      "  PASS  tailwind.config.ts의 content 가 componentsDir(./components/ui) 를 덮습니다",
      "",
      "  결과: 4 pass / 2 warn / 0 fail",
      "\n권장 항목을 확인하세요.",
    ]);
  });
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

  // WI-0065 D8: brand 가 있으면 brand 다음에 brand.activation 항목이 더해집니다(7항목)
  async function brandResult(): Promise<CheckResult> {
    const results = await collectCheckResults(dir);
    expect(results).toHaveLength(7);
    expect(results.slice(0, 4).map((r) => r.name)).toEqual(EXISTING_NAMES.slice(0, 4));
    expect(results[6].name).toBe("brand.activation");
    return results[5];
  }

  it("일치 → pass, 기존 5항목과 합쳐 warn 0 (음성 대조군)", async () => {
    await writeAllPassProject(
      dir,
      { globalCss: "./app/globals.css", brand: "sample" },
      '@import "@axis-ds/tokens/css";\n@import "@axis-ds/tokens/css/brands/sample";\n:root{--background:0;--primary:0;}\n'
    );
    // 브랜드를 켜는 코드(data-brand)와 preset 이 있어야 warn 0 입니다(WI-0065 D8). globals.css 는 AXIS 근거(tokens CSS import)가 필요합니다(WI-0070)
    await fs.writeFile(path.join(dir, "tailwind.config.ts"), 'import axis from "@axis-ds/tokens/tailwind";\nhsl(var(--x))');
    await fs.writeFile(path.join(dir, "app/layout.tsx"), '<html lang="ko" data-brand="sample">');
    const results = await collectCheckResults(dir);
    expect(results[5]).toEqual({
      name: "brand",
      severity: "pass",
      message: 'brand "sample" import 가 app/globals.css에 있습니다',
    });
    expect(results[6]).toEqual({
      name: "brand.activation",
      severity: "pass",
      message: "app/layout.tsx에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다",
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

  // WI-0100a(D1): globals.css 항목도 globalCss 를 먼저 봐서 brand 와 같은 app/globals.css 를 판정합니다(종전은 루트 우선이라 루트 PASS)
  it("탐색은 FR-2 순서: globalCss 가 가리키는 파일을 루트 globals.css 보다 먼저 봄 (globals.css 항목도 같은 파일, WI-0100a)", async () => {
    await writeAllPassProject(
      dir,
      { globalCss: "./app/globals.css", brand: "sample" },
      '@import "@axis-ds/tokens/css/brands/sample";\n:root{--background:0;--primary:0;}\n'
    );
    await fs.writeFile(path.join(dir, "globals.css"), AXIS_CSS);
    const results = await collectCheckResults(dir);
    expect(results[2]).toEqual({
      name: "globals.css",
      severity: "warn",
      message:
        "app/globals.css에 자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다 → @axis-ds/tokens CSS 를 import 하세요",
    });
    expect(results[5].message).toBe('brand "sample" import 가 app/globals.css에 있습니다');
  });

  it("projects/app-init 에 theme add 한 뒤: app/globals.css 를 검사해 pass, globalCss 경로 없음 표기", async () => {
    const project = await makeProject({ tokens: "1.3", layout: "app-init" });
    created.push(project);
    const plan = planThemeAdd(project, "sample");
    expect(plan.errors).toEqual([]);
    applyThemeAdd(plan);

    const results = await collectCheckResults(project);
    // app-init 은 componentsDir 가 있지만 tailwind.config 가 없어 content 항목은 없음. brand.activation 은 레이아웃에 없어 WARN
    expect(results.map((r) => r.name)).toEqual([...EXISTING_NAMES, "brand", "brand.activation"]);
    expect(results[6]).toMatchObject({ name: "brand.activation", severity: "warn" });
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
    // tailwind.config(자체 hsl 매핑만) · brand · brand.activation 이 WARN(WI-0065 D8), globals.css(자체 변수만)도 WARN(WI-0070)
    expect(out).toContain("  결과: 3 pass / 4 warn / 0 fail");
    expect(out).toContain("\n권장 항목을 확인하세요.");
  });
});

// WI-0100a: check 의 CSS 판정 3항목(Tailwind 4 의 tailwind.config · globals.css · Tailwind 4 의 animation)이 axis.config.json 의
// globalCss 를 먼저 보고(실재하는 .css 일반 파일, 프로젝트 밖은 읽기만), 쓰지 못하면 표기를 붙임. brand 와 같은 파일을 판정.
// fixture 이름은 WI-0100 testplan 1절(R1 · R2 · R3 · R6 · R7 · R8 · R9 · I1 · I2 · mono · x2 ~ x5 · N1 · N2 · A1). 펼침(R4 · R5 · E*)은 0100b.
describe("WI-0100a 전역 CSS 선택", () => {
  const GOOD4 = '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n';
  const OLD = "body{margin:0}\n";

  /** testplan 1절 공통 모양: .git · lib/utils.ts · 선언 + 설치본 stub. Tailwind 3 은 preset 과 content 가 맞는 설정 파일 */
  async function app(dir: string, tw: 3 | 4, opts: { ui?: boolean; pnp?: boolean } = {}) {
    await fs.ensureDir(path.join(dir, ".git"));
    await fs.outputFile(path.join(dir, "lib/utils.ts"), 'export function cn(...a: string[]) { return a.join(" "); }\n');
    const deps: Record<string, string> = { "@axis-ds/tokens": "^1.8.2", clsx: "^2.1.1", "tailwind-merge": "^3.3.1" };
    const installed: [string, string][] = [["@axis-ds/tokens", "1.8.2"], ["clsx", "2.1.1"], ["tailwind-merge", "3.3.1"]];
    if (tw === 4) {
      deps.tailwindcss = "^4.1.14";
      installed.push(["tailwindcss", "4.1.14"]);
    } else {
      deps.tailwindcss = "^3.4.17";
      deps["tailwindcss-animate"] = "^1.0.7";
      installed.push(["tailwindcss", "3.4.17"], ["tailwindcss-animate", "1.0.7"]);
      await fs.outputFile(
        path.join(dir, "tailwind.config.js"),
        'module.exports = { presets: [require("@axis-ds/tokens/tailwind")], content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] };\n'
      );
    }
    if (opts.ui) {
      deps["@axis-ds/ui-react"] = "^1.8.2";
      deps["tw-animate-css"] = "^1.4.0";
      installed.push(["@axis-ds/ui-react", "1.8.2"], ["tw-animate-css", "1.4.0"]);
    }
    await fs.outputJSON(path.join(dir, "package.json"), { name: "app", version: "0.0.0", private: true, dependencies: deps });
    if (opts.pnp) await fs.outputFile(path.join(dir, ".pnp.cjs"), "");
    else for (const [name, version] of installed) await writeInstalledStub(dir, name, version);
  }

  async function config(dir: string, extra: Record<string, unknown>) {
    await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "./components/ui", ...extra });
  }

  async function items(dir: string): Promise<Record<string, CheckResult>> {
    return Object.fromEntries((await collectCheckResults(dir)).map((r) => [r.name, r]));
  }

  /** 문구에서 「<파일>.css에」 · 「<파일>.css의」 자리의 파일명 집합(AC6 지표, 파일명이 없는 문구는 세지 않음) */
  function judgedFiles(results: Record<string, CheckResult>, names: string[]): string[] {
    const files = new Set<string>();
    for (const n of names) {
      const m = /([^ ]+\.css)(?:에|의) /.exec(results[n]?.message ?? "");
      if (m) files.add(m[1]);
    }
    return [...files];
  }

  const TW4_PASS = (file: string, note = "") => ({
    name: "tailwind.config",
    severity: "pass",
    message: `Tailwind 4: ${file}에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다${note}`,
  });
  const GLOBALS_PASS = (file: string, note = "") => ({
    name: "globals.css",
    severity: "pass",
    message: `${file}에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css/tailwind4 import)${note}`,
  });

  it("R1 (AC1): 루트에 낡은 globals.css 가 있어도 globalCss 의 app/globals.css 로 PASS 2건", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.outputFile(path.join(dir, "app/globals.css"), GOOD4);
    await fs.outputFile(path.join(dir, "globals.css"), OLD);
    await config(dir, { globalCss: "./app/globals.css" });
    const r = await items(dir);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css"));
  });

  it("R8 (AC1): 같은 CSS 를 Yarn PnP(.pnp.cjs, 설치본 없음)로 둬도 PASS 2건", async () => {
    const dir = await tempDir();
    await app(dir, 4, { pnp: true });
    await fs.outputFile(path.join(dir, "app/globals.css"), GOOD4);
    await fs.outputFile(path.join(dir, "globals.css"), OLD);
    await config(dir, { globalCss: "./app/globals.css" });
    const r = await items(dir);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css"));
  });

  it("A1b (AC1, A1 에 컴포넌트 tailwind.css 줄을 더해 B1 을 뺀 변형): Tailwind 4 animation 도 globalCss 파일의 tw-animate-css 줄로 PASS", async () => {
    const dir = await tempDir();
    await app(dir, 4, { ui: true });
    await fs.outputFile(path.join(dir, "app/globals.css"), `${GOOD4}@import "@axis-ds/ui-react/tailwind.css";\n@import "tw-animate-css";\n`);
    await fs.outputFile(path.join(dir, "globals.css"), OLD);
    await config(dir, { globalCss: "./app/globals.css" });
    const r = await items(dir);
    expect(r.animation).toEqual({ name: "animation", severity: "pass", message: "app/globals.css에 애니메이션 플러그인이 있습니다" });
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css"));
  });

  it("R7 (AC1): Tailwind 3 의 globals.css 항목도 globalCss 의 app/globals.css 를 판정", async () => {
    const dir = await tempDir();
    await app(dir, 3);
    await fs.outputFile(path.join(dir, "app/globals.css"), '@import "@axis-ds/tokens/css";\n');
    await fs.outputFile(path.join(dir, "globals.css"), OLD);
    await config(dir, { globalCss: "./app/globals.css", tailwindConfig: "./tailwind.config.js" });
    expect((await items(dir))["globals.css"]).toEqual({
      name: "globals.css",
      severity: "pass",
      message: "app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css import)",
    });
  });

  for (const [label, rel] of [
    ["R2", "src/styles/globals.css"],
    ["R3", "styles/app.css"],
  ] as const) {
    it(`${label} (AC2): 후보 밖 ${rel} 를 globalCss 로 지정하면 FAIL 이 사라짐(종료 코드 1 → 0)`, async () => {
      const dir = await tempDir();
      await app(dir, 4);
      await fs.remove(path.join(dir, "app"));
      await fs.outputFile(path.join(dir, rel), GOOD4);
      await config(dir, { globalCss: `./${rel}` });
      const results = await collectCheckResults(dir);
      const r = Object.fromEntries(results.map((x) => [x.name, x]));
      expect(r["tailwind.config"]).toEqual(TW4_PASS(rel));
      expect(r["globals.css"]).toEqual(GLOBALS_PASS(rel));
      expect(results.filter((x) => x.severity === "fail")).toEqual([]);
    });
  }

  for (const [label, files] of [
    ["I1", { "src/styles/globals.css": GOOD4 }],
    ["I2", { "app/globals.css": GOOD4, "globals.css": OLD }],
  ] as const) {
    it(`${label} (AC13): init 이 기록할 globalCss 를 check 가 같은 파일로 판정`, async () => {
      const dir = await tempDir();
      await app(dir, 4);
      if (!("app/globals.css" in files)) await fs.remove(path.join(dir, "app"));
      for (const [rel, css] of Object.entries(files)) await fs.outputFile(path.join(dir, rel), css);
      const { answers } = await resolveInitAnswers(dir, true);
      await config(dir, { globalCss: answers.globalCss });
      const file = answers.globalCss.replace(/^\.\//, "");
      const results = await collectCheckResults(dir);
      const r = Object.fromEntries(results.map((x) => [x.name, x]));
      expect(r["tailwind.config"]).toEqual(TW4_PASS(file));
      expect(r["globals.css"]).toEqual(GLOBALS_PASS(file));
      expect(results.filter((x) => x.severity === "fail")).toEqual([]);
    });
  }

  it("R6 (AC6): globals.css · tailwind.config · brand 가 같은 app/globals.css 를 판정(파일명 집합 1개)", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.outputFile(path.join(dir, "app/globals.css"), `${GOOD4}@import "@axis-ds/tokens/css/brands/ontology";\n`);
    await fs.outputFile(path.join(dir, "globals.css"), OLD);
    await config(dir, { globalCss: "./app/globals.css", brand: "ontology" });
    const r = await items(dir);
    expect(r.brand).toEqual({ name: "brand", severity: "pass", message: 'brand "ontology" import 가 app/globals.css에 있습니다' });
    expect(judgedFiles(r, ["tailwind.config", "globals.css", "brand"])).toEqual(["app/globals.css"]);
  });

  it("R9 (D1 의 대가): globalCss 의 app/globals.css 가 비면 루트에 내용이 있어도 WARN(종료 코드 그대로)", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.outputFile(path.join(dir, "globals.css"), GOOD4);
    await fs.outputFile(path.join(dir, "app/globals.css"), "body{}\n");
    await config(dir, { globalCss: "./app/globals.css" });
    const results = await collectCheckResults(dir);
    const r = Object.fromEntries(results.map((x) => [x.name, x]));
    expect(r["tailwind.config"]).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message: 'Tailwind 4: app/globals.css에 @import "tailwindcss" 가 없습니다',
    });
    expect(r["globals.css"]).toEqual({ name: "globals.css", severity: "warn", message: "app/globals.css에 AXIS CSS 변수가 없습니다" });
    expect(results.filter((x) => x.severity === "fail")).toEqual([]);
  });

  it("mono/app1 (AC7 · Q25): 프로젝트 밖 globalCss 를 읽기만 해서 CSS 2항목 PASS, FAIL 0, brand 그대로", async () => {
    const root = await tempDir();
    const dir = path.join(root, "app1");
    await app(dir, 4);
    await fs.outputFile(path.join(root, "shared/globals.css"), `${GOOD4}@import "@axis-ds/tokens/css/brands/ontology";\n`);
    await config(dir, { globalCss: "../shared/globals.css", brand: "ontology" });
    const results = await collectCheckResults(dir);
    const r = Object.fromEntries(results.map((x) => [x.name, x]));
    expect(r["tailwind.config"]).toEqual(TW4_PASS("../shared/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("../shared/globals.css"));
    expect(r.brand).toEqual({ name: "brand", severity: "pass", message: 'brand "ontology" import 가 ../shared/globals.css에 있습니다' });
    expect(r.animation).toBeUndefined();
    expect(results.filter((x) => x.severity === "fail")).toEqual([]);
    expect(judgedFiles(r, ["tailwind.config", "globals.css", "brand"])).toEqual(["../shared/globals.css"]);
    // 쓰기는 종전대로 거절(theme add 의 css-outside-project)
    expect(planThemeAdd(dir, "ontology").errors.map((e) => e.kind)).toContain("css-outside-project");
  });

  it("mono/app2 (AC7): ui-react 를 쓰는 앱의 Tailwind 4 animation 도 밖 파일을 판정", async () => {
    const root = await tempDir();
    const dir = path.join(root, "app2");
    await app(dir, 4, { ui: true });
    await fs.outputFile(
      path.join(root, "shared/globals.css"),
      `${GOOD4}@import "@axis-ds/ui-react/tailwind.css";\n@import "@axis-ds/tokens/css/brands/ontology";\n@import "tw-animate-css";\n`
    );
    await config(dir, { globalCss: "../shared/globals.css", brand: "ontology" });
    const r = await items(dir);
    expect(r.animation).toEqual({ name: "animation", severity: "pass", message: "../shared/globals.css에 애니메이션 플러그인이 있습니다" });
    expect(r["tailwind.config"]).toEqual(TW4_PASS("../shared/globals.css"));
  });

  it("x2 (AC3): globalCss 가 없는 파일이면 후보로 넘어가고 PASS 에도 「(globalCss ./nope.css 없음)」", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.remove(path.join(dir, "app"));
    await fs.outputFile(path.join(dir, "globals.css"), GOOD4);
    await config(dir, { globalCss: "./nope.css" });
    const r = await items(dir);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("globals.css", " (globalCss ./nope.css 없음)"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("globals.css", " (globalCss ./nope.css 없음)"));
  });

  it("x3 (AC3 · AC9): 고를 CSS 가 없으면 종전 FAIL 그대로(종료 코드 1) + 표기, Tailwind 4 항목 WARN · animation WARN 에도 표기", async () => {
    const dir = await tempDir();
    await app(dir, 4, { ui: true });
    await fs.remove(path.join(dir, "app"));
    await config(dir, { globalCss: "./nope.css" });
    const r = await items(dir);
    expect(r["globals.css"]).toEqual({
      name: "globals.css",
      severity: "fail",
      message: "globals.css 파일을 찾을 수 없습니다 (globalCss ./nope.css 없음)",
    });
    expect(r["tailwind.config"]).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message: 'Tailwind 4: @import "tailwindcss" 를 확인할 CSS 파일을 찾지 못했습니다 (globalCss ./nope.css 없음)',
    });
    expect(r.animation.severity).toBe("warn");
    expect(r.animation.message.endsWith("@import \"tw-animate-css\"; (globalCss ./nope.css 없음)")).toBe(true);
  });

  it("x4 (AC9 · D11): 레이아웃 JS 의 tokens CSS import 폴백은 그대로, 파일명만 globalCss 파일", async () => {
    const dir = await tempDir();
    await app(dir, 3);
    await fs.outputFile(path.join(dir, "globals.css"), OLD);
    await fs.outputFile(path.join(dir, "app/globals.css"), OLD);
    await fs.outputFile(
      path.join(dir, "app/layout.tsx"),
      'import "@axis-ds/tokens/css";\nimport "./globals.css";\nexport default function L({children}){return children}\n'
    );
    await config(dir, { globalCss: "./app/globals.css", tailwindConfig: "./tailwind.config.js" });
    expect((await items(dir))["globals.css"]).toEqual({
      name: "globals.css",
      severity: "pass",
      message: "app/globals.css에 AXIS CSS 변수가 있습니다 (app/layout.tsx의 @axis-ds/tokens/css import)",
    });
  });

  it("N1 (AC8 · D10): globalCss 가 .css 아닌 일반 파일이면 버리고 후보를 판정, 세 항목 · brand 에 표기. theme add 는 css-not-stylesheet 그대로", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.outputFile(path.join(dir, "app/globals.css"), `${GOOD4}@import "@axis-ds/tokens/css/brands/ontology";\n`);
    await config(dir, { globalCss: "./package.json", brand: "ontology" });
    const note = " (globalCss ./package.json: .css 파일이 아님)";
    const r = await items(dir);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css", note));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css", note));
    expect(r.brand).toEqual({ name: "brand", severity: "pass", message: `brand "ontology" import 가 app/globals.css에 있습니다${note}` });
    expect(planThemeAdd(dir, "ontology").errors.map((e) => e.kind)).toEqual(["css-not-stylesheet"]);
  });

  it("N2 (AC8 · D10): globalCss 가 디렉터리면 「(globalCss ./app 없음)」, brand 문구는 종전 그대로", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.outputFile(path.join(dir, "app/globals.css"), `${GOOD4}@import "@axis-ds/tokens/css/brands/ontology";\n`);
    await config(dir, { globalCss: "./app", brand: "ontology" });
    const note = " (globalCss ./app 없음)";
    const r = await items(dir);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css", note));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css", note));
    expect(r.brand).toEqual({ name: "brand", severity: "pass", message: `brand "ontology" import 가 app/globals.css에 있습니다${note}` });
  });

  it("회귀 가드 (AC11): globalCss 키가 없으면 종전대로 후보(루트 우선)에서 처음 찾은 파일, 표기 없음", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.outputFile(path.join(dir, "app/globals.css"), GOOD4);
    await fs.outputFile(path.join(dir, "globals.css"), OLD);
    await config(dir, {});
    const r = await items(dir);
    expect(r["tailwind.config"]).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message: 'Tailwind 4: globals.css에 @import "tailwindcss" 가 없습니다',
    });
    expect(r["globals.css"]).toEqual({ name: "globals.css", severity: "warn", message: "globals.css에 AXIS CSS 변수가 없습니다" });
  });

  it("회귀 가드 (AC10 ① · AC11, x5): 진입 파일만 판정하므로 하위 base.css 의 create-next-app 정의는 보지 않음, PASS 2건", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.outputFile(
      path.join(dir, "app/globals.css"),
      '@import "tailwindcss";\n@import "./base.css";\n@import "@axis-ds/tokens/css/tailwind4";\n'
    );
    await fs.outputFile(path.join(dir, "app/base.css"), ":root{--background:#fff;--foreground:#171717}\nbody{font-family: Arial, Helvetica, sans-serif}\n");
    await config(dir, { globalCss: "./app/globals.css" });
    const r = await items(dir);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css"));
  });

  // 후보 판정이 existsSync 에서 일반 파일 확인으로 바뀌어, globalCss 키가 없어도 후보 이름의 디렉터리는 건너뜁니다(1.7.6 까지는 EISDIR 로 check 가 멈춤)
  it("globalCss 키 없음 + 루트 globals.css/ 디렉터리: 그 후보를 건너뛰고 app/globals.css 로 PASS 2건 (예외 없음)", async () => {
    const dir = await tempDir();
    await app(dir, 4);
    await fs.ensureDir(path.join(dir, "globals.css"));
    await fs.outputFile(path.join(dir, "app/globals.css"), GOOD4);
    await config(dir, {});
    const r = await items(dir);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css"));
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

  it("Tailwind 3: .mjs · .cjs 설정은 warn(preset 없음), 종전에는 fail", async () => {
    const mjs = await project({ "tailwind.config.mjs": "export default {}" }, { tailwindcss: "^3.4.0" });
    const cjs = await project({ "tailwind.config.cjs": "module.exports = {}" }, { tailwindcss: "^3.4.0" });
    expect(await tailwindItem(mjs)).toMatchObject({
      severity: "warn",
      message: "tailwind.config.mjs에 AXIS preset(@axis-ds/tokens/tailwind)이 없습니다 (presets 에 넣으세요)",
    });
    expect(await tailwindItem(cjs)).toMatchObject({
      severity: "warn",
      message: "tailwind.config.cjs에 AXIS preset(@axis-ds/tokens/tailwind)이 없습니다 (presets 에 넣으세요)",
    });
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

    it("Tailwind 3 은 CSS 진입점과 관계없이 설정 파일 규칙(WI-0065 D8: 자체 hsl(var()) 만 있으면 WARN)", async () => {
      const withEntry = await project(
        { "tailwind.config.ts": "hsl(var(--x))", "globals.css": `@import "tailwindcss";\n${TOKENS_LINE}` },
        { tailwindcss: "^3.4.0" }
      );
      const withoutEntry = await project({ "tailwind.config.ts": "hsl(var(--x))", "globals.css": "" }, { tailwindcss: "^3.4.0" });
      for (const dir of [withEntry, withoutEntry]) {
        expect(await tailwindItem(dir)).toEqual({
          name: "tailwind.config",
          severity: "warn",
          message: "tailwind.config.ts에 AXIS preset(@axis-ds/tokens/tailwind)이 없습니다 (자체 CSS 변수 매핑만 있음, presets 에 넣으세요)",
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

    it("변수를 직접 정의해도 import 가 있으면 import 근거 pass 문구(WI-0070: 자체 변수만으로는 pass 가 아님)", async () => {
      const dir = await project(
        { "globals.css": `${TOKENS_LINE}\n:root{--background:0 0% 100%;--primary:0 0% 0%;}` },
        { tailwindcss: "^4" }
      );
      expect(await globalsItem(dir)).toEqual({
        name: "globals.css",
        severity: "pass",
        message: "globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css/tailwind4 import)",
      });
    });

    // WI-0070: pass 는 AXIS 근거(tokens CSS import · --axis-* 정의 · 루트 레이아웃의 tokens CSS JS import)가 있을 때만
    it("WI-0070: 자체 --background · --primary 만 있으면 WARN(AXIS 토큰 미사용), --axis-* 정의 · 레이아웃 JS import 는 pass", async () => {
      const selfOnly = await project({ "app/globals.css": ":root{--background:0 0% 100%;--primary:221 83% 53%;}" }, { tailwindcss: "^3.4.17" });
      const axisVars = await project({ "app/globals.css": ":root{--axis-color-primary:#2563eb;--background:0 0% 100%;--primary:0 0% 0%;}" }, { tailwindcss: "^3.4.17" });
      const axisUseOnly = await project({ "app/globals.css": ".x{color:var(--axis-text-primary)}" }, { tailwindcss: "^3.4.17" });
      const layoutJs = await project(
        {
          "app/globals.css": ":root{--background:0 0% 100%;--primary:0 0% 0%;}",
          "app/layout.tsx": 'import "@axis-ds/tokens/css";\nimport "@axis-ds/tokens/css/shadcn";\nimport "./globals.css";',
        },
        { tailwindcss: "^3.4.17" }
      );
      const layoutCommented = await project(
        { "app/globals.css": "body{}", "src/app/layout.tsx": '// import "@axis-ds/tokens/css";\nimport "./globals.css";' },
        { tailwindcss: "^3.4.17" }
      );
      expect(await globalsItem(selfOnly)).toEqual({
        name: "globals.css",
        severity: "warn",
        message: "app/globals.css에 자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다 → @axis-ds/tokens CSS 를 import 하세요",
      });
      expect(await globalsItem(axisVars)).toEqual({ name: "globals.css", severity: "pass", message: "app/globals.css에 AXIS CSS 변수(--axis-*)가 정의되어 있습니다" });
      // 쓰기만 하는 var(--axis-*) 는 정의가 아니다(음성 대조)
      expect(await globalsItem(axisUseOnly)).toMatchObject({ severity: "warn", message: "app/globals.css에 AXIS CSS 변수가 없습니다" });
      expect(await globalsItem(layoutJs)).toEqual({
        name: "globals.css",
        severity: "pass",
        message: "app/globals.css에 AXIS CSS 변수가 있습니다 (app/layout.tsx의 @axis-ds/tokens/css import)",
      });
      expect(await globalsItem(layoutCommented)).toMatchObject({ severity: "warn" });
    });

    it("WI-0070: Tailwind 3 에서 근거가 있어도 create-next-app 기본 body font-family: Arial 이 남으면 WARN(Tailwind 4 는 B2 가 냄)", async () => {
      const css = '@import "@axis-ds/tokens/css";\n@import "@axis-ds/tokens/css/shadcn";\n@tailwind base;\nbody {\n  font-family: Arial, Helvetica, sans-serif;\n}';
      const tw3 = await project({ "app/globals.css": css }, { tailwindcss: "^3.4.17" });
      const tw3Clean = await project({ "app/globals.css": css.replace(/body \{[\s\S]*\}/, "") }, { tailwindcss: "^3.4.17" });
      const tw4 = await project({ "app/globals.css": `@import "tailwindcss";\n${TOKENS_LINE}\nbody { font-family: Arial, Helvetica, sans-serif; }` }, { tailwindcss: "^4" });
      expect(await globalsItem(tw3)).toEqual({
        name: "globals.css",
        severity: "warn",
        message:
          "app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css import). 다만 create-next-app 기본 body font-family: Arial 이 남아 있습니다 → 지우세요(AXIS 글꼴 대신 Arial 이 적용됨)",
      });
      expect(await globalsItem(tw3Clean)).toMatchObject({ severity: "pass" });
      expect(await globalsItem(tw4)).toMatchObject({ severity: "pass" });
      expect(await tailwindItem(tw4)).toMatchObject({ severity: "warn", message: expect.stringContaining("body font-family: Arial") });
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
      // 보정 3차: import 중인 tailwind.css 의 패키지도 버전 조건을 문제로 올립니다(A4 와 같은 규칙).
      expect((await tailwindItem(dir)).message).toBe(
        `${WARN} / @axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 버전 확인이 필요합니다` +
          ` / @axis-ds/agentic-ui/tailwind.css import 가 있지만 @axis-ds/agentic-ui 버전 확인이 필요합니다` +
          ` (1.4.0 이상 필요: @axis-ds/ui-react 1.3.1) (설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/agentic-ui catalog:)`
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
        { name: "@axis-ds/ui-react", range: "1.3.0 - 1.5.0", status: "below", source: "declared" },
        { name: "@axis-ds/agentic-ui", range: "latest", status: "unknown", source: "declared" },
      ]);
      expect(axisPackagesBelowTailwind4({ dependencies: { "@axis-ds/tokens": ">=1.2 >=1.4" } })).toEqual([]);
      expect(axisPackagesBelowTailwind4({ dependencies: { "@axis-ds/tokens": "workspace:*" } })).toEqual([]);
      expect(axisPackagesBelowTailwind4({ dependencies: { "@axis-ds/tokens": "^1 || ^2" } })).toEqual([
        { name: "@axis-ds/tokens", range: "^1 || ^2", status: "unknown", source: "declared" },
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

    it("보정 3차: import 중인 ui-react tailwind.css 의 패키지도 A4 와 같은 조건(ui-react 1.3.0 → warn, 종전에는 pass)", async () => {
      const dir = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n${UI}` },
        { tailwindcss: "^4", "@axis-ds/tokens": "^1.4.0", "@axis-ds/ui-react": "1.3.0" }
      );
      expect(await tailwindItem(dir)).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message:
          "Tailwind 4: globals.css에 @axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/ui-react 1.3.0)",
      });
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
    // 보정 3차: 특징마다 실제로 걸린 정의를 나온 순서로, 중복 없이 표시합니다(fixture 의 다크 :root 재정의는 한 번만).
    const ALL =
      "create-next-app 기본 정의가 남아 있습니다(" +
      [
        ":root 색값 --background, --foreground",
        "@theme --color-background: var(--background), --color-foreground: var(--foreground)",
        "@theme --font-sans: var(--font-geist-sans), --font-mono: var(--font-geist-mono)",
        // WI-0070: body 의 font-family: Arial 도 같은 특징(레이어 밖이라 AXIS 글꼴을 이김)
        "body background: var(--background), color: var(--foreground), font-family: Arial",
      ].join(" · ") +
      ") → 지우세요";

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

    it("특징을 하나씩만 남기면 실제로 걸린 정의 이름만 표시(보정 3차: --font-sans 만 남으면 --font-mono 를 말하지 않음)", async () => {
      const cases: [string, string][] = [
        [":root { --foreground: oklch(0.2 0 0); }", ":root 색값 --foreground"],
        [":root { --background: #fff; }", ":root 색값 --background"],
        ["@theme inline { --color-foreground: var(--foreground); }", "@theme --color-foreground: var(--foreground)"],
        ["@theme inline { --font-sans: var(--font-geist-sans); }", "@theme --font-sans: var(--font-geist-sans)"],
        ["@theme inline { --font-mono:var( --font-geist-mono ); }", "@theme --font-mono: var(--font-geist-mono)"],
        ["body { color: var(--foreground); }", "body color: var(--foreground)"],
        ["body { background-color: var(--background); }", "body background-color: var(--background)"],
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

    it(".js · .mjs · .cjs 도 preset 참조면 pass, 없으면 warn(preset 없음)", async () => {
      for (const file of ["tailwind.config.js", "tailwind.config.mjs", "tailwind.config.cjs"]) {
        // WI-0072: CommonJS 의 bare require 는 tokens 1.7.0 이상일 때만 pass 라 선언을 1.7.0 으로 둡니다(아래 WI-0072 테스트가 경계를 봄)
        const withPreset = await project(
          { [file]: "module.exports = { presets: [require('@axis-ds/tokens/tailwind')] };" },
          { tailwindcss: "^3.4.0", "@axis-ds/tokens": "^1.7.0" }
        );
        const without = await project({ [file]: "module.exports = { content: ['./app/**/*.tsx'] };" }, { tailwindcss: "^3.4.0" });
        expect(await tailwindItem(withPreset)).toEqual(PRESET(file));
        expect(await tailwindItem(without)).toEqual({
          name: "tailwind.config",
          severity: "warn",
          message: `${file}에 AXIS preset(@axis-ds/tokens/tailwind)이 없습니다 (presets 에 넣으세요)`,
        });
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
      const NO_PRESET = "tailwind.config.ts에 AXIS preset(@axis-ds/tokens/tailwind)이 없습니다 (presets 에 넣으세요)";
      expect((await tailwindItem(commented)).message).toBe(NO_PRESET);
      expect((await tailwindItem(other)).message).toBe(NO_PRESET);
      expect(await tailwindItem(urlString)).toEqual(PRESET("tailwind.config.ts"));
    });

    it("preset 과 자체 hsl(var()) 매핑이 함께 있으면 preset pass 문구(WI-0065 D8: 판정 근거는 preset)", async () => {
      const dir = await project(
        { "tailwind.config.ts": "import axis from '@axis-ds/tokens/tailwind';\nexport default { presets: [axis], theme: { extend: { colors: { x: 'hsl(var(--x))' } } } };" },
        { tailwindcss: "^3.4.0" }
      );
      expect(await tailwindItem(dir)).toEqual(PRESET("tailwind.config.ts"));
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

    it("버전만 걸린 ui-react: import 중이면 버전 확인 문제(보정 3차, 종전에는 pass), 다른 문제가 있으면 그 뒤에 잇고 끝에 안내", async () => {
      const onlyVersion = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n${UI}` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.3.0" }
      );
      const withDefault = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n${UI}\n:root { --background: #fff; }` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.3.0" }
      );
      const VERSION_ISSUE = "@axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 버전 확인이 필요합니다";
      expect((await tailwindItem(onlyVersion)).message).toBe(
        `Tailwind 4: globals.css에 ${VERSION_ISSUE} (1.4.0 이상 필요: @axis-ds/ui-react ^1.3.0)`
      );
      expect((await tailwindItem(withDefault)).message).toBe(
        `Tailwind 4: globals.css에 create-next-app 기본 정의가 남아 있습니다(:root 색값 --background) → 지우세요 / ${VERSION_ISSUE} (1.4.0 이상 필요: @axis-ds/ui-react ^1.3.0)`
      );
    });

    it("@import \"tailwindcss\" 가 없으면 다른 문제와 합치지 않고 종전 문구 하나", async () => {
      const dir = await project({ "globals.css": ":root { --background: #fff; }" }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "^1.3.0" });
      expect((await tailwindItem(dir)).message).toBe('Tailwind 4: globals.css에 @import "tailwindcss" 가 없습니다');
    });
  });
});

describe("WI-0044 보정 3차: B2 라벨 · 설치본 우선 버전 판정 · 직접 @source", () => {
  async function project(
    files: Record<string, string>,
    deps: Record<string, string> | null,
    installed: Record<string, string> = {}
  ): Promise<string> {
    const dir = await tempDir();
    if (deps) await fs.writeJSON(path.join(dir, "package.json"), { dependencies: deps });
    for (const [rel, content] of Object.entries(files)) {
      await fs.ensureDir(path.dirname(path.join(dir, rel)));
      await fs.writeFile(path.join(dir, rel), content);
    }
    // node_modules/<pkg>/package.json 설치본
    for (const [name, version] of Object.entries(installed)) {
      await fs.ensureDir(path.join(dir, "node_modules", name));
      await fs.writeJSON(path.join(dir, "node_modules", name, "package.json"), { name, version });
    }
    return dir;
  }
  const tailwindItem = async (dir: string) => (await collectCheckResults(dir)).find((r) => r.name === "tailwind.config")!;
  const pkgOf = async (dir: string) => (await fs.readJSON(path.join(dir, "package.json"))) as Record<string, unknown>;
  /** init 의 안내 중 1.4.0 조건 줄(「!」 로 시작하는 버전 줄) */
  const initVersionLines = async (dir: string) =>
    tailwind4GuideLines(await pkgOf(dir), "pnpm install", "./globals.css", dir).filter((l) => l.includes("1.4.0 부터"));
  const TW = '@import "tailwindcss";';
  const UI = '@import "@axis-ds/ui-react/tailwind.css";';
  const PASS4 = 'Tailwind 4: globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다';
  const B1 = "컴포넌트 스캔 경로(tailwind.css)가 없습니다 →";

  describe("1. B2 라벨: 실제로 걸린 정의 이름", () => {
    it("findCreateNextAppDefaults 직접 호출: 나온 순서 · 중복 없음 · 공백 정규화, 걸리지 않은 이름은 말하지 않음", () => {
      expect(
        findCreateNextAppDefaults(
          ":root { --foreground: #000; --background: rgb(0 0 0); }\n@media (x) { :root { --foreground: #111; } }\n" +
            "@theme inline { --font-sans: var(--font-geist-sans); --font-sans:var( --font-geist-sans ); }"
        )
      ).toEqual([":root 색값 --foreground, --background", "@theme --font-sans: var(--font-geist-sans)"]);
      expect(findCreateNextAppDefaults("/* --font-mono: var(--font-geist-mono); */ body { color: var(--foreground); }")).toEqual([
        "body color: var(--foreground)",
      ]);
      expect(findCreateNextAppDefaults(":root { --background: 0 0% 100%; }")).toEqual([]);
    });

    it("check 문구: --font-sans 만 남으면 --font-mono 를 말하지 않음", async () => {
      const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}\n@theme inline { --font-sans: var(--font-geist-sans); }` }, { tailwindcss: "^4" });
      const message = (await tailwindItem(dir)).message;
      expect(message).toBe(
        "Tailwind 4: globals.css에 create-next-app 기본 정의가 남아 있습니다(@theme --font-sans: var(--font-geist-sans)) → 지우세요"
      );
      expect(message).not.toContain("--font-mono");
    });
  });

  describe("2. 버전 판정: 설치본 → 선언 하한 → 판정 불가 (init · check 같은 함수)", () => {
    it("설치본 1.4.2 + 선언 ^1.3.0 → check pass · init 안내 없음", async () => {
      const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0" }, { "@axis-ds/tokens": "1.4.2" });
      expect(axisPackagesBelowTailwind4(await pkgOf(dir), dir)).toEqual([]);
      expect(await tailwindItem(dir)).toEqual({ name: "tailwind.config", severity: "pass", message: PASS4 });
      expect(await initVersionLines(dir)).toEqual([]);
    });

    it("설치본 1.3.0 + 선언 ^1.4.0 → 안내(설치본 우선, 문구에 설치본 버전)", async () => {
      const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.4.0" }, { "@axis-ds/tokens": "1.3.0" });
      expect(axisPackagesBelowTailwind4(await pkgOf(dir), dir)).toEqual([
        { name: "@axis-ds/tokens", range: "^1.4.0", status: "below", source: "installed", installed: "1.3.0" },
      ]);
      expect((await tailwindItem(dir)).message).toBe(
        "Tailwind 4: globals.css에 AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/tokens 설치본 1.3.0)"
      );
      expect(await initVersionLines(dir)).toEqual([
        '  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 설치본(@axis-ds/tokens 1.3.0, 선언 ^1.4.0)을 올리세요: pnpm add "@axis-ds/tokens@^1.4.0"',
      ]);
    });

    it("설치본 없음 + ^1.3.0 → 기존 안내(선언 하한)", async () => {
      const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0" });
      expect((await tailwindItem(dir)).message).toBe(
        "Tailwind 4: globals.css에 AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)"
      );
      expect(await initVersionLines(dir)).toEqual([
        '  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 선언(@axis-ds/tokens ^1.3.0)을 올리세요: pnpm add "@axis-ds/tokens@^1.4.0"',
      ]);
    });

    it("ui-react tailwind.css import + ui-react 설치본 1.3.0(선언 ^1.4.0) → warn", async () => {
      const dir = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n${UI}` },
        { tailwindcss: "^4", "@axis-ds/tokens": "^1.4.0", "@axis-ds/ui-react": "^1.4.0" },
        { "@axis-ds/tokens": "1.4.0", "@axis-ds/ui-react": "1.3.0" }
      );
      expect(await tailwindItem(dir)).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message:
          "Tailwind 4: globals.css에 @axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/ui-react 설치본 1.3.0)",
      });
    });

    it("설치본 1.4.0 이상이면 판정 불가 선언(catalog: · 1.x · latest)도 안내 없음", async () => {
      for (const range of ["catalog:", "1.x", "latest"]) {
        const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4", "@axis-ds/tokens": range }, { "@axis-ds/tokens": "1.5.0" });
        expect({ range, item: await tailwindItem(dir), init: await initVersionLines(dir) }).toEqual({
          range,
          item: { name: "tailwind.config", severity: "pass", message: PASS4 },
          init: [],
        });
      }
    });

    it("설치본 prerelease 1.4.0-beta.1 은 1.4.0 미만, 정확한 버전이 아니면(1.4 · 0.0.0-insiders.1 · 숫자 아님) 선언 하한으로", async () => {
      const pre = await project({ "globals.css": TW }, { "@axis-ds/tokens": "^1.4.0" }, { "@axis-ds/tokens": "1.4.0-beta.1" });
      expect(axisPackagesBelowTailwind4(await pkgOf(pre), pre)).toEqual([
        { name: "@axis-ds/tokens", range: "^1.4.0", status: "below", source: "installed", installed: "1.4.0-beta.1" },
      ]);
      for (const version of ["1.4", "0.0.0-insiders.1", "abc"]) {
        const dir = await project({ "globals.css": TW }, { "@axis-ds/tokens": "^1.3.0" }, { "@axis-ds/tokens": version });
        expect({ version, got: axisPackagesBelowTailwind4(await pkgOf(dir), dir) }).toEqual({
          version,
          got: [{ name: "@axis-ds/tokens", range: "^1.3.0", status: "below", source: "declared" }],
        });
      }
    });

    it("workspace: 는 설치본이 1.3.0 이어도 안내 없음(링크된 소스 version 은 배포 전 version 이라 근거가 아님)", async () => {
      const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}` }, { tailwindcss: "^4", "@axis-ds/tokens": "workspace:*" }, { "@axis-ds/tokens": "1.3.0" });
      expect(axisPackagesBelowTailwind4(await pkgOf(dir), dir)).toEqual([]);
      expect((await tailwindItem(dir)).severity).toBe("pass");
      expect(await initVersionLines(dir)).toEqual([]);
    });

    it("선언이 없으면 설치본이 1.3.0 이어도 넣지 않음(다른 패키지가 끌어온 의존성), baseDir 없으면 선언만 봄", async () => {
      const dir = await project({ "globals.css": TW }, { "@axis-ds/ui-react": "^1.4.0" }, { "@axis-ds/tokens": "1.3.0", "@axis-ds/ui-react": "1.4.1" });
      expect(axisPackagesBelowTailwind4(await pkgOf(dir), dir)).toEqual([]);
      const declaredOnly = await project({ "globals.css": TW }, { "@axis-ds/tokens": "^1.3.0" }, { "@axis-ds/tokens": "1.4.2" });
      expect(axisPackagesBelowTailwind4(await pkgOf(declaredOnly))).toEqual([
        { name: "@axis-ds/tokens", range: "^1.3.0", status: "below", source: "declared" },
      ]);
    });

    it("init 과 check 가 같은 프로젝트에서 같은 패키지를 걸러냄(설치본 · 선언 · 판정 불가 혼합)", async () => {
      const dir = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}` },
        { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "^1.4.0", "@axis-ds/agentic-ui": "catalog:" },
        { "@axis-ds/tokens": "1.4.2", "@axis-ds/ui-react": "1.3.5" }
      );
      const issues = axisPackagesBelowTailwind4(await pkgOf(dir), dir);
      expect(issues.map((i) => i.name)).toEqual(["@axis-ds/ui-react", "@axis-ds/agentic-ui"]);
      const message = (await tailwindItem(dir)).message;
      expect(message).toContain("(1.4.0 이상 필요: @axis-ds/ui-react 설치본 1.3.5) (설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/agentic-ui catalog:)");
      expect(message).not.toContain("@axis-ds/tokens");
      const init = await initVersionLines(dir);
      expect(init).toEqual([
        '  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 설치본(@axis-ds/ui-react 1.3.5, 선언 ^1.4.0)을 올리세요: pnpm add "@axis-ds/ui-react@^1.4.0"',
        "  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 선언(@axis-ds/agentic-ui catalog:)으로는 버전을 판정할 수 없으니 설치된 버전이 1.4.0 이상인지 확인하세요.",
      ]);
      expect(init.join("\n")).not.toContain("@axis-ds/tokens");
    });
  });

  describe("3. 직접 @source 인정(B1)", () => {
    it("ui-react 를 가리키는 @source(패키지 · dist · 작은따옴표 · 다른 상대 경로)가 있으면 B1 없음 → pass", async () => {
      for (const line of [
        '@source "../node_modules/@axis-ds/ui-react";',
        '@source "../node_modules/@axis-ds/ui-react/dist";',
        "@source '../../node_modules/@axis-ds/ui-react/dist/index.js';",
        '@source "./node_modules/@axis-ds/ui-react/";',
      ]) {
        const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}\n${line}` }, { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0" });
        expect({ line, item: await tailwindItem(dir) }).toEqual({ line, item: { name: "tailwind.config", severity: "pass", message: PASS4 } });
      }
    });

    it("주석 안 · @source not · 다른 패키지 이름 · 다른 컴포넌트 패키지 경로는 인정하지 않음 → B1 warn", async () => {
      for (const line of [
        '/* @source "../node_modules/@axis-ds/ui-react"; */',
        '@source not "../node_modules/@axis-ds/ui-react";',
        '@source "../node_modules/@axis-ds/ui-react-extra";',
        '@source "../node_modules/@axis-ds/agentic-ui";',
        '@source "../node_modules/ui-react";',
      ]) {
        const dir = await project({ "globals.css": `${TW}\n${TOKENS_LINE}\n${line}` }, { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0" });
        expect({ line, message: (await tailwindItem(dir)).message }).toEqual({
          line,
          message: `Tailwind 4: globals.css에 ${B1} ${UI}`,
        });
      }
    });

    it("hasComponentSource 직접 호출", () => {
      expect(hasComponentSource('@source "../node_modules/@axis-ds/agentic-ui/dist";', "@axis-ds/agentic-ui")).toBe(true);
      expect(hasComponentSource('@source "../node_modules/@axis-ds/agentic-ui/dist";', "@axis-ds/ui-react")).toBe(false);
      expect(hasComponentSource('@source inline("@axis-ds/ui-react");', "@axis-ds/ui-react")).toBe(false);
      // 패키지 이름 그대로는 CSS 기준 상대 경로라 node_modules 를 가리키지 않음(PRD V2 와 같은 상태)
      expect(hasComponentSource('@source "@axis-ds/ui-react";', "@axis-ds/ui-react")).toBe(false);
      expect(hasComponentSource("@source '@axis-ds/ui-react/dist';", "@axis-ds/ui-react")).toBe(false);
      expect(hasComponentSource('@source "node_modules/@axis-ds/ui-react";', "@axis-ds/ui-react")).toBe(true);
    });

    it("두 패키지 중 하나만 @source → 다른 하나만 B1, 직접 @source 는 tailwind.css 가 필요 없으니 버전 문제를 만들지 않음", async () => {
      const dir = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n@source "../node_modules/@axis-ds/ui-react/dist";` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0", "@axis-ds/agentic-ui": "^1.4.0" }
      );
      expect((await tailwindItem(dir)).message).toBe(`Tailwind 4: globals.css에 ${B1} @import "@axis-ds/agentic-ui/tailwind.css";`);
      const old = await project(
        { "globals.css": `${TW}\n${TOKENS_LINE}\n@source "../node_modules/@axis-ds/ui-react/dist";` },
        { tailwindcss: "^4", "@axis-ds/ui-react": "^1.3.0" }
      );
      expect((await tailwindItem(old)).severity).toBe("pass");
    });
  });
});

describe("WI-0065 D8: content · 브랜드 켜기 · 애니메이션 항목", () => {
  async function project(files: Record<string, string>, pkg: Record<string, unknown> | null, config?: Record<string, unknown>) {
    const dir = await tempDir();
    if (pkg) await fs.writeJSON(path.join(dir, "package.json"), pkg);
    if (config) await fs.writeJSON(path.join(dir, "axis.config.json"), config);
    for (const [rel, content] of Object.entries(files)) {
      await fs.outputFile(path.join(dir, rel), content);
    }
    return dir;
  }
  const item = async (dir: string, name: string) => (await collectCheckResults(dir)).find((r) => r.name === name);
  const TW3 = { devDependencies: { tailwindcss: "^3.4.17" } };
  const installStub = (dir: string, name: string, version = "1.0.7") => writeInstalledStub(dir, name, version);
  /** create-next-app(Tailwind 3) 기본 content */
  const CNA_CONTENT = 'export default { content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"] };';

  it("이슈 #175 재현 조합: content 가 src/components/ui 를 덮지 않으면 FAIL(rc 1 의 근거), 넣을 glob 안내", async () => {
    const dir = await project({ "tailwind.config.ts": CNA_CONTENT }, TW3, { componentsDir: "./src/components/ui" });
    expect(await item(dir, "tailwind.content")).toEqual({
      name: "tailwind.content",
      severity: "fail",
      message:
        'tailwind.config.ts의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): componentsDir(./src/components/ui) → "./src/components/ui/**/*.{ts,tsx}"',
    });
  });

  it("음성 대조: componentsDir ./components/ui 는 create-next-app content(./components/**)가 덮어 PASS", async () => {
    const dir = await project({ "tailwind.config.ts": CNA_CONTENT }, TW3, { componentsDir: "./components/ui" });
    expect(await item(dir, "tailwind.content")).toMatchObject({ severity: "pass" });
  });

  it("npm 패키지(ui-react) 선언: node_modules 경로를 덮어야 함(quick-start 의 {js,jsx} glob 도 dist/*.js 를 덮음)", async () => {
    const pkg = { dependencies: { "@axis-ds/ui-react": "^1.6.0" }, ...TW3 };
    const missing = await project({ "tailwind.config.ts": CNA_CONTENT }, pkg, {});
    const covered = await project(
      { "tailwind.config.ts": 'export default { content: ["./app/**/*.tsx", "./node_modules/@axis-ds/ui-react/**/*.{js,jsx}"] };' },
      pkg,
      {}
    );
    expect(await item(missing, "tailwind.content")).toMatchObject({ severity: "fail", message: expect.stringContaining("@axis-ds/ui-react") });
    expect(await item(covered, "tailwind.content")).toMatchObject({ severity: "pass" });
  });

  it("content 를 정적으로 다 읽지 못하면(변수 · 펼침) FAIL 대신 WARN", async () => {
    const dir = await project(
      { "tailwind.config.ts": 'const extra = ["./src/**/*.tsx"];\nexport default { content: ["./app/**/*.tsx", ...extra] };' },
      TW3,
      { componentsDir: "./src/components/ui" }
    );
    expect(await item(dir, "tailwind.content")).toMatchObject({ severity: "warn" });
  });

  it("content: { files: [...] } 형태와 negated glob(!) 을 읽음", async () => {
    const dir = await project(
      { "tailwind.config.js": 'module.exports = { content: { files: ["./src/**/*.{ts,tsx}", "!./src/**/*.test.tsx"] } };' },
      TW3,
      { componentsDir: "./src/components/ui" }
    );
    expect(await item(dir, "tailwind.content")).toMatchObject({ severity: "pass" });
  });

  it("해당하지 않으면 항목을 더하지 않음: Tailwind 4 · 설정 파일 없음 · 대상(componentsDir · 패키지) 없음", async () => {
    const tw4 = await project({ "app/globals.css": '@import "tailwindcss";' }, { devDependencies: { tailwindcss: "^4" } }, { componentsDir: "./components/ui" });
    const noConfig = await project({}, TW3, { componentsDir: "./components/ui" });
    const noTarget = await project({ "tailwind.config.ts": CNA_CONTENT }, TW3, {});
    for (const dir of [tw4, noConfig, noTarget]) expect(await item(dir, "tailwind.content")).toBeUndefined();
  });

  it("brand.activation: brand 가 있고 레이아웃에 켜는 코드(data-brand · setBrand · defaultBrand)가 없으면 WARN(ThemeProvider 단독 포함), 있으면 PASS, brand 없으면 항목 없음", async () => {
    const none = await project({ "app/layout.tsx": '<html lang="en">' }, TW3, { brand: "ontology" });
    const attr = await project({ "app/layout.tsx": '<html lang="en" data-brand="ontology">' }, TW3, { brand: "ontology" });
    const provider = await project(
      { "src/app/layout.tsx": 'import { Providers } from "./providers";', "src/app/providers.tsx": '<ThemeProvider defaultBrand="ontology">{children}</ThemeProvider>' },
      TW3,
      { brand: "ontology" }
    );
    const commented = await project({ "app/layout.tsx": '// <html data-brand="ontology">\n<html lang="en">' }, TW3, { brand: "ontology" });
    // ThemeProvider 만 있으면 마운트 때 data-brand 를 지우므로 켜진 것이 아니다(2026-10-25 WI-0064 검토 실측)
    const providerOnly = await project(
      { "src/app/layout.tsx": 'import { Providers } from "./providers";', "src/app/providers.tsx": '<ThemeProvider defaultTheme="system">{children}</ThemeProvider>' },
      TW3,
      { brand: "ontology" }
    );
    const noBrand = await project({ "app/layout.tsx": '<html lang="en">' }, TW3, {});
    expect(await item(none, "brand.activation")).toEqual({
      name: "brand.activation",
      severity: "warn",
      message: 'brand "ontology" 가 설정됐지만 app/layout.tsx에 브랜드를 켜는 코드(data-brand · setBrand 등)가 없습니다(ThemeProvider 만으로는 마운트 때 꺼짐) → <html data-brand="ontology"> 또는 setBrand("ontology")',
    });
    expect(await item(attr, "brand.activation")).toMatchObject({ severity: "pass" });
    expect(await item(provider, "brand.activation")).toMatchObject({ severity: "pass", message: "src/app/providers.tsx에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다" });
    expect(await item(commented, "brand.activation")).toMatchObject({ severity: "warn" });
    expect(await item(providerOnly, "brand.activation")).toMatchObject({ severity: "warn" });
    expect(await item(noBrand, "brand.activation")).toBeUndefined();
  });

  it("animation: ui-react 선언 + 플러그인 없음 → WARN, tailwindcss-animate 선언 + plugins 참조 → PASS", async () => {
    const pkg = { dependencies: { "@axis-ds/ui-react": "^1.6.0" }, ...TW3 };
    const none = await project({ "tailwind.config.ts": "export default { plugins: [] };" }, pkg, {});
    const declaredOnly = await project(
      { "tailwind.config.ts": "export default { plugins: [] };" },
      { ...pkg, devDependencies: { ...TW3.devDependencies, "tailwindcss-animate": "^1.0.7" } },
      {}
    );
    const ok = await project(
      { "tailwind.config.ts": 'export default { plugins: [require("tailwindcss-animate")] };' },
      { ...pkg, devDependencies: { ...TW3.devDependencies, "tailwindcss-animate": "^1.0.7" } },
      {}
    );
    await installStub(ok, "tailwindcss-animate");
    await installStub(declaredOnly, "tailwindcss-animate");
    expect(await item(none, "animation")).toMatchObject({ severity: "warn", message: expect.stringContaining("tailwindcss-animate 선언 없음") });
    expect(await item(declaredOnly, "animation")).toMatchObject({ severity: "warn", message: expect.stringContaining("plugins 에 없음") });
    expect(await item(ok, "animation")).toEqual({ name: "animation", severity: "pass", message: "tailwind.config.ts의 plugins 에 tailwindcss-animate 가 있습니다" });
  });

  // WI-0070: 설정 파일 어딘가의 문자열 · import 만으로는 PASS 가 아니고 plugins 배열을 읽는다. 「미설치」는 설치본 기준
  it("WI-0070 animation: plugins 배열 판독(import 만 · 무관한 문자열 → WARN, 식별자 · require → PASS, 동적 → 확인 못함) · 설치본 기준", async () => {
    const pkg = { dependencies: { "@axis-ds/ui-react": "^1.6.0" }, devDependencies: { ...TW3.devDependencies, "tailwindcss-animate": "^1.0.7" } };
    const cases: Array<[string, string, "pass" | "warn", string?]> = [
      ["import 만 + plugins []", 'import animate from "tailwindcss-animate";\nexport default { plugins: [] };', "warn", "plugins 에 없음"],
      ["무관한 문자열 + plugins []", 'const x = { a: "tailwindcss-animate" };\nexport default { plugins: [] };', "warn", "plugins 에 없음"],
      ["ESM 식별자", 'import animate from "tailwindcss-animate";\nexport default { plugins: [animate] };', "pass"],
      ["CJS 변수", 'const animate = require("tailwindcss-animate");\nmodule.exports = { plugins: [require("@tailwindcss/forms"), animate] };', "pass"],
      ["require 직접 + 다른 플러그인", 'module.exports = { plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")] };', "pass"],
      // 리뷰 변이 C10(식별자를 import 했으면 배열의 아무 요소나 found)을 잡는 케이스
      ["import 식별자 + 다른 플러그인만", 'import animate from "tailwindcss-animate";\nexport default { plugins: [require("@tailwindcss/forms")] };', "warn", "plugins 에 없음"],
      ["CJS 변수 + 다른 플러그인만", 'const animate = require("tailwindcss-animate");\nmodule.exports = { plugins: [require("@tailwindcss/forms")] };', "warn", "plugins 에 없음"],
      ["plugins 키 없음", "export default { content: [] };", "warn", "plugins 에 없음"],
      ["주석 안 require", 'export default { plugins: [/* require("tailwindcss-animate") */] };', "warn", "plugins 에 없음"],
      ["펼침(동적)", 'import shared from "./shared";\nexport default { plugins: [...shared.plugins] };', "warn", "정적으로 다 읽지 못해 확인하지 못함"],
      ["단축 속성(동적)", 'const plugins = [];\nexport default { content: [], plugins };', "warn", "정적으로 다 읽지 못해 확인하지 못함"],
    ];
    for (const [label, src, severity, contains] of cases) {
      const dir = await project({ "tailwind.config.ts": src }, pkg, {});
      await installStub(dir, "tailwindcss-animate");
      const got = await item(dir, "animation");
      expect({ label, severity: got?.severity }).toEqual({ label, severity });
      if (contains) expect({ label, message: got?.message }).toEqual({ label, message: expect.stringContaining(contains) });
    }
    // 선언 + plugins 참조여도 설치본이 없으면 「미설치(선언만 있음)」 WARN
    const notInstalled = await project({ "tailwind.config.ts": 'export default { plugins: [require("tailwindcss-animate")] };' }, pkg, {});
    expect(await item(notInstalled, "animation")).toMatchObject({ severity: "warn", message: expect.stringContaining("tailwindcss-animate 미설치(선언만 있음)") });
    // 양성 대조: 선언 없음은 이 항목의 계측이 살아 있어 WARN 이 나온다
    const undeclared = await project({ "tailwind.config.ts": 'export default { plugins: [require("tailwindcss-animate")] };' }, { dependencies: pkg.dependencies, ...TW3 }, {});
    expect(await item(undeclared, "animation")).toMatchObject({ severity: "warn", message: expect.stringContaining("선언 없음") });
  });

  it("animation: 복사 설치(componentsDir 에 animate-in 클래스)도 대상, Tailwind 4 는 tw-animate-css import 로 판정", async () => {
    const copied = await project(
      { "components/ui/dialog.tsx": 'const c = "data-[state=open]:animate-in fade-in-0";', "tailwind.config.ts": "export default {};" },
      TW3,
      { componentsDir: "./components/ui" }
    );
    const tw4 = { devDependencies: { tailwindcss: "^4" }, dependencies: { "@axis-ds/ui-react": "^1.6.0" } };
    const tw4None = await project({ "app/globals.css": '@import "tailwindcss";' }, tw4, {});
    const tw4Ok = await project({ "app/globals.css": '@import "tailwindcss";\n@import "tw-animate-css";' }, tw4, {});
    expect(await item(copied, "animation")).toMatchObject({ severity: "warn", message: expect.stringContaining("componentsDir 의 animate-in 류 클래스") });
    expect(await item(tw4None, "animation")).toMatchObject({ severity: "warn", message: expect.stringContaining('@import "tw-animate-css";') });
    // WI-0092(사용자 결정 Q9 · Q10 · Q12): 줄만 있고 tw-animate-css 선언 · 설치본이 없으면 WARN(종전 PASS, 실빌드 rc 1 인 상태)
    expect(await item(tw4Ok, "animation")).toMatchObject({ severity: "warn", message: expect.stringContaining("tw-animate-css 선언 없음") });
    // 같은 줄에 선언 · 설치본을 갖추면 PASS(종전 PASS 의 의미를 새 행으로 지킴)
    const tw4Installed = await project(
      { "app/globals.css": '@import "tailwindcss";\n@import "tw-animate-css";' },
      { ...tw4, devDependencies: { ...tw4.devDependencies, "tw-animate-css": "^1.3.0" } },
      {}
    );
    await writeInstalledStub(tw4Installed, "tw-animate-css", "1.4.0");
    expect(await item(tw4Installed, "animation")).toEqual({ name: "animation", severity: "pass", message: "app/globals.css에 애니메이션 플러그인이 있습니다" });
  });

  it("animation 스캔: 심링크는 따라가지 않아 순환 링크에서도 끝나고, 링크 너머의 animate-in 은 세지 않음", async () => {
    const dir = await project({ "components/ui/button.tsx": 'const c = "rounded-md";', "outside/dialog.tsx": 'const c = "animate-in";', "tailwind.config.ts": "export default {};" }, TW3, {
      componentsDir: "./components/ui",
    });
    await fs.symlink(path.join(dir, "components"), path.join(dir, "components/ui/loop"), "dir");
    await fs.symlink(path.join(dir, "outside"), path.join(dir, "components/ui/linked"), "dir");
    expect(await item(dir, "animation")).toBeUndefined();
  });

  it("animation 스캔: 깊이 상한(8) 밖의 파일은 읽지 않음(상한 안이면 잡힘)", async () => {
    const deep = "components/ui/" + Array.from({ length: 9 }, (_, i) => `d${i}`).join("/") + "/dialog.tsx";
    const shallow = "components/ui/" + Array.from({ length: 8 }, (_, i) => `d${i}`).join("/") + "/dialog.tsx";
    const cfg = { "tailwind.config.ts": "export default {};" };
    const tooDeep = await project({ [deep]: 'const c = "animate-in";', ...cfg }, TW3, { componentsDir: "./components/ui" });
    const within = await project({ [shallow]: 'const c = "animate-in";', ...cfg }, TW3, { componentsDir: "./components/ui" });
    expect(await item(tooDeep, "animation")).toBeUndefined();
    expect(await item(within, "animation")).toMatchObject({ severity: "warn" });
  });

  it("음성 대조: ui-react 를 쓰지 않으면(선언 없음 · componentsDir 에 animate-in 없음) 항목 없음", async () => {
    const dir = await project({ "components/ui/button.tsx": 'const c = "rounded-md";', "tailwind.config.ts": "export default {};" }, TW3, {
      componentsDir: "./components/ui",
    });
    expect(await item(dir, "animation")).toBeUndefined();
  });

  it("FAIL 이 생기면 axis check 종료 코드 1(content FAIL 단독)", async () => {
    const dir = await project(
      { "tailwind.config.ts": 'import a from "@axis-ds/tokens/tailwind";\n' + CNA_CONTENT, "app/globals.css": '@import "@axis-ds/tokens/css";', "lib/utils.ts": "export function cn() {}" },
      { dependencies: { clsx: "1", "tailwind-merge": "1" }, ...TW3 },
      { componentsDir: "./src/components/ui" }
    );
    // WI-0051: dependencies 는 설치본도 봄
    for (const name of ["tailwindcss", "clsx", "tailwind-merge"]) await installStub(dir, name);
    vi.spyOn(console, "log").mockImplementation(() => {});
    expect(await runCheck(dir)).toEqual({ pass: 5, warn: 0, fail: 1 });
  });
});

describe("WI-0037 D3: template apply 는 기존 프로젝트 구조가 다르면 경고만", () => {
  const detail = (files: string[], tailwind = "^3.4.0") =>
    ({
      name: "t",
      slug: "t",
      description: "",
      category: "minimal",
      version: "0.1.0",
      files: files.map((p) => ({ path: p, content: "", type: "text" })),
      dependencies: {},
      devDependencies: { tailwindcss: tailwind },
    }) as unknown as Parameters<typeof templateApplyWarnings>[1];

  it("빈 디렉터리(template init 경로)는 경고 없음", async () => {
    const dir = await tempDir();
    expect(await templateApplyWarnings(dir, detail(["app/page.tsx"]))).toEqual([]);
  });

  it("Tailwind major 가 다르면(create-next-app@latest 의 Tailwind 4 위) 경고", async () => {
    const dir = await tempDir();
    await fs.writeJSON(path.join(dir, "package.json"), { devDependencies: { tailwindcss: "^4" } });
    const w = await templateApplyWarnings(dir, detail(["app/page.tsx"]));
    expect(w).toHaveLength(1);
    expect(w[0]).toContain("템플릿은 Tailwind 3 기준인데 이 프로젝트는 Tailwind 4(^4) 입니다");
  });

  it("음성 대조: 같은 major(Tailwind 3)면 경고 없음", async () => {
    const dir = await tempDir();
    await fs.writeJSON(path.join(dir, "package.json"), { devDependencies: { tailwindcss: "^3.4.17" } });
    expect(await templateApplyWarnings(dir, detail(["app/page.tsx"]))).toEqual([]);
  });

  it("src/app 이 있는데 템플릿이 루트 app/ 을 쓰면 경고, app/ 을 쓰지 않는 템플릿은 경고 없음", async () => {
    const dir = await tempDir();
    await fs.ensureDir(path.join(dir, "src", "app"));
    expect((await templateApplyWarnings(dir, detail(["app/page.tsx"])))[0]).toContain("src/app 이 있는데 템플릿은 루트 app/ 을 씁니다");
    expect(await templateApplyWarnings(dir, detail(["components/x.tsx"]))).toEqual([]);
  });

  it("저장소 템플릿 4종은 app/layout.tsx · app/page.tsx · app/globals.css · postcss.config.mjs 를 담고 루트 page.tsx 는 없음", async () => {
    const dirTemplates = path.resolve(HERE, "../../../../apps/web/public/templates");
    for (const slug of ["theme-only", "dashboard", "landing-page", "hr-dashboard"]) {
      const t = (await fs.readJSON(path.join(dirTemplates, `${slug}.json`))) as { files: { path: string }[]; dependencies: Record<string, string> };
      const paths = t.files.map((f) => f.path);
      expect({ slug, has: ["app/layout.tsx", "app/page.tsx", "app/globals.css", "postcss.config.mjs"].every((p) => paths.includes(p)) }).toEqual({ slug, has: true });
      expect({ slug, root: paths.filter((p) => ["page.tsx", "layout.tsx", "globals.css"].includes(p)) }).toEqual({ slug, root: [] });
      expect({ slug, twMerge: t.dependencies["tailwind-merge"] }).toEqual({ slug, twMerge: "^2.6.0" });
    }
  });
});

describe("WI-0065 D8: content glob 판독 단위", () => {
  it("contentGlobToRegExp: ** · * · {a,b} · 앞의 ./", () => {
    const m = (g: string, f: string) => contentGlobToRegExp(g).test(f);
    expect(m("./components/**/*.{js,ts,jsx,tsx,mdx}", "components/ui/button.tsx")).toBe(true);
    expect(m("./components/**/*.{js,ts,jsx,tsx,mdx}", "src/components/ui/button.tsx")).toBe(false);
    expect(m("./src/**/*.{ts,tsx}", "src/components/ui/button.tsx")).toBe(true);
    expect(m("./app/**/*.tsx", "app/page.tsx")).toBe(true);
    expect(m("./node_modules/@axis-ds/ui-react/**/*.{js,jsx}", "node_modules/@axis-ds/ui-react/dist/index.js")).toBe(true);
    expect(m("./node_modules/@axis-ds/ui-react/dist/*.mjs", "node_modules/@axis-ds/ui-react/dist/index.js")).toBe(false);
  });

  it("readTailwindContent: 배열 · files 객체 · 주석 안 content 무시 · 문자열 아닌 요소는 dynamic", () => {
    expect(readTailwindContent('export default { content: ["./a/**/*.tsx", \'./b/*.ts\'] }')).toEqual({ globs: ["./a/**/*.tsx", "./b/*.ts"], dynamic: false });
    expect(readTailwindContent("module.exports = { content: { files: ['./x/**'] } }")).toEqual({ globs: ["./x/**"], dynamic: false });
    expect(readTailwindContent('// content: ["./nope"]\nexport default { content: ["./yes/**"] }')).toEqual({ globs: ["./yes/**"], dynamic: false });
    expect(readTailwindContent('export default { content: [...base, "./a/**"] }')).toEqual({ globs: ["./a/**"], dynamic: true });
    expect(readTailwindContent("export default { theme: {} }")).toBeUndefined();
  });
});

// ─── 배치 3 묶음 ①: WI-0051 · WI-0068 · WI-0072 (설치본 판독은 registry-core 의 findInstalledPackage 하나) ───

describe("배치 3 ①: 설치본 기반 판정", () => {
  async function project(files: Record<string, string>, pkg: Record<string, unknown> | null, config: Record<string, unknown> | null = {}) {
    const dir = await tempDir();
    if (pkg) await fs.writeJSON(path.join(dir, "package.json"), pkg);
    if (config) await fs.writeJSON(path.join(dir, "axis.config.json"), config);
    for (const [rel, content] of Object.entries(files)) await fs.outputFile(path.join(dir, rel), content);
    return dir;
  }
  const item = async (dir: string, name: string) => (await collectCheckResults(dir)).find((r) => r.name === name);
  const TW3 = { tailwindcss: "^3.4.17", clsx: "^2.1.1", "tailwind-merge": "^2.6.0" };

  describe("WI-0051: dependencies 는 선언 + 설치본(상위 디렉터리 탐색)", () => {
    it("선언만 있고 node_modules 가 없으면 WARN(종전 거짓 PASS), 설치 명령은 lockfile 로 고름", async () => {
      const dir = await project({ "package-lock.json": "{}" }, { dependencies: TW3 });
      expect(await item(dir, "dependencies")).toEqual({
        name: "dependencies",
        severity: "warn",
        message: "선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → npm install",
      });
    });

    it("모두 설치되면 PASS, 선언된 @axis-ds/* 도 대상(ui-react 선언 · 미설치 → WARN)", async () => {
      const dir = await project({}, { dependencies: { ...TW3, "@axis-ds/ui-react": "^1.6.3" } });
      for (const name of Object.keys(TW3)) await writeInstalledStub(dir, name);
      expect(await item(dir, "dependencies")).toEqual({
        name: "dependencies",
        severity: "warn",
        message: "선언됐지만 설치되지 않은 의존성: @axis-ds/ui-react → pnpm install",
      });
      await writeInstalledStub(dir, "@axis-ds/ui-react", "1.6.3");
      expect(await item(dir, "dependencies")).toEqual({
        name: "dependencies",
        severity: "pass",
        message: "필수 및 권장 의존성이 선언 · 설치되어 있습니다 (4개 확인)",
      });
    });

    it("모노레포 호이스팅: 상위 디렉터리 node_modules 의 설치본도 설치로 봄", async () => {
      const root = await tempDir();
      for (const name of Object.keys(TW3)) await writeInstalledStub(root, name);
      const app = path.join(root, "apps", "web");
      await fs.outputJSON(path.join(app, "package.json"), { dependencies: TW3 });
      expect(await item(app, "dependencies")).toMatchObject({ severity: "pass" });
    });

    it("exports 에 ./package.json 이 없는 패키지(@axis-ds/tokens 형태)도 디렉터리로 판독", async () => {
      const dir = await project({}, { dependencies: { ...TW3, "@axis-ds/tokens": "^1.6.2" } });
      for (const name of Object.keys(TW3)) await writeInstalledStub(dir, name);
      await fs.outputJSON(path.join(dir, "node_modules/@axis-ds/tokens/package.json"), {
        name: "@axis-ds/tokens",
        version: "1.6.2",
        exports: { "./tailwind": "./dist/tailwind-preset.js" },
      });
      expect(await item(dir, "dependencies")).toMatchObject({ severity: "pass" });
    });

    it("Plug'n'Play(.pnp.cjs)는 설치본을 읽지 않고 선언 기준 PASS(문구에 남김)", async () => {
      const dir = await project({ ".pnp.cjs": "" }, { dependencies: TW3 });
      expect(await item(dir, "dependencies")).toEqual({
        name: "dependencies",
        severity: "pass",
        message: "필수 및 권장 의존성이 선언되어 있습니다 (Plug'n'Play 라 설치본은 확인하지 않음, 3개)",
      });
    });

    it("권장 누락과 미설치가 같이 있으면 한 WARN 에 잇고, 필수 선언 누락은 종전대로 FAIL", async () => {
      const both = await project({}, { dependencies: { tailwindcss: "^3.4.17" } });
      const noTw = await project({}, { dependencies: { clsx: "1" } });
      expect(await item(both, "dependencies")).toEqual({
        name: "dependencies",
        severity: "warn",
        message: "권장 의존성 누락: clsx, tailwind-merge / 선언됐지만 설치되지 않은 의존성: tailwindcss → pnpm install",
      });
      expect(await item(noTw, "dependencies")).toEqual({ name: "dependencies", severity: "fail", message: "필수 의존성 누락: tailwindcss" });
    });

    it("package.json 없음 · JSON 파손 → FAIL(항목 이름은 dependencies)", async () => {
      const none = await project({}, null);
      const broken = await project({ "package.json": "{ broken" }, null);
      expect(await item(none, "dependencies")).toEqual({ name: "dependencies", severity: "fail", message: "package.json 파일이 없습니다" });
      expect(await item(broken, "dependencies")).toEqual({ name: "dependencies", severity: "fail", message: "package.json 을 읽지 못했습니다(JSON 확인)" });
    });
  });

  describe("WI-0072: Tailwind 3 CommonJS 설정의 bare require 는 설치본 tokens 버전으로 판정", () => {
    const BARE_CJS = 'module.exports = { content: [], presets: [require("@axis-ds/tokens/tailwind")] };';
    const WARN_BELOW = (file: string, label: string) =>
      `${file}에 AXIS preset 참조가 있지만 @axis-ds/tokens ${label} 에서는 CommonJS 의 require("@axis-ds/tokens/tailwind") 가 preset 이 아니라 { default } 를 돌려줘 색 · keyframes 가 적용되지 않습니다 → require("@axis-ds/tokens/tailwind").default 로 바꾸거나 @axis-ds/tokens 1.7.0 이상`;

    it(".cjs · .js · .ts 의 module.exports + bare require: 설치본 1.6.2 → WARN, 1.7.0 → PASS", async () => {
      for (const file of ["tailwind.config.cjs", "tailwind.config.js", "tailwind.config.ts"]) {
        const dir = await project({ [file]: BARE_CJS }, { devDependencies: { tailwindcss: "^3.4.17", "@axis-ds/tokens": "^1.6.2" } });
        await writeInstalledStub(dir, "@axis-ds/tokens", "1.6.2");
        expect(await item(dir, "tailwind.config")).toEqual({ name: "tailwind.config", severity: "warn", message: WARN_BELOW(file, "설치본 1.6.2") });
        await writeInstalledStub(dir, "@axis-ds/tokens", "1.7.0");
        expect(await item(dir, "tailwind.config")).toMatchObject({ severity: "pass" });
      }
    });

    it("jiti 경로 4형태: .ts export default + require · import · .cjs/.ts 의 .default 는 버전과 상관없이 PASS", async () => {
      const forms: Record<string, string> = {
        "tailwind.config.ts": 'export default { content: [], presets: [require("@axis-ds/tokens/tailwind")] };',
        "tailwind.config.mjs": 'import axisPreset from "@axis-ds/tokens/tailwind";\nexport default { presets: [axisPreset] };',
        "tailwind.config.cjs": 'module.exports = { presets: [require("@axis-ds/tokens/tailwind").default] };',
      };
      for (const [file, src] of Object.entries(forms)) {
        const dir = await project({ [file]: src }, { devDependencies: { tailwindcss: "^3.4.17" } });
        await writeInstalledStub(dir, "@axis-ds/tokens", "1.6.2");
        expect({ file, item: await item(dir, "tailwind.config") }).toEqual({ file, item: expect.objectContaining({ severity: "pass" }) });
      }
      const tsDefault = await project(
        { "tailwind.config.ts": 'module.exports = { presets: [require("@axis-ds/tokens/tailwind")["default"]] };' },
        { devDependencies: { tailwindcss: "^3.4.17" } }
      );
      await writeInstalledStub(tsDefault, "@axis-ds/tokens", "1.5.0");
      expect(await item(tsDefault, "tailwind.config")).toMatchObject({ severity: "pass" });
    });

    it("변수에 받은 뒤 .default · 구조분해 default 는 1.6.2 에서도 PASS, 변수를 .default 없이 쓰면 WARN", async () => {
      const R = 'require("@axis-ds/tokens/tailwind")';
      const passForms: Record<string, string> = {
        "변수 + .default": `const preset = ${R};\nmodule.exports = { content: [], presets: [preset.default] };`,
        '변수 + ["default"]': `const preset = ${R};\nmodule.exports = { presets: [preset["default"]] };`,
        "구조분해 default": `const { default: preset } = ${R};\nmodule.exports = { presets: [preset] };`,
        "구조분해 default + 이름": `const { default: axis, axisKeyframes } = ${R};\nmodule.exports = { presets: [axis] };`,
        "require(...).default 를 변수에": `const preset = ${R}.default;\nmodule.exports = { presets: [preset] };`,
      };
      const warnForms: Record<string, string> = {
        "변수 bare": `const preset = ${R};\nmodule.exports = { presets: [preset] };`,
        "변수 .default 와 bare 섞임": `const preset = ${R};\nconst p = preset.default;\nmodule.exports = { presets: [preset] };`,
        "변수 bare + 인라인 bare": `const preset = ${R}.default;\nmodule.exports = { presets: [preset, ${R}] };`,
      };
      for (const [label, src] of Object.entries(passForms)) {
        const dir = await project({ "tailwind.config.js": src }, { devDependencies: { tailwindcss: "^3.4.17", "@axis-ds/tokens": "^1.6.2" } });
        await writeInstalledStub(dir, "@axis-ds/tokens", "1.6.2");
        expect({ label, severity: (await item(dir, "tailwind.config"))?.severity }).toEqual({ label, severity: "pass" });
      }
      for (const [label, src] of Object.entries(warnForms)) {
        const dir = await project({ "tailwind.config.js": src }, { devDependencies: { tailwindcss: "^3.4.17", "@axis-ds/tokens": "^1.6.2" } });
        await writeInstalledStub(dir, "@axis-ds/tokens", "1.6.2");
        expect({ label, item: await item(dir, "tailwind.config") }).toEqual({
          label,
          item: { name: "tailwind.config", severity: "warn", message: WARN_BELOW("tailwind.config.js", "설치본 1.6.2") },
        });
      }
    });

    // 리뷰 변이 C12(prerelease 비교 무력화)를 잡는 케이스. changesets pre 모드로 발행하면 1.7.0-beta.N 이 설치될 수 있어요
    it("설치본 prerelease 1.7.0-beta.1 은 1.7.0 미만이라 WARN", async () => {
      const dir = await project({ "tailwind.config.cjs": BARE_CJS }, { devDependencies: { tailwindcss: "^3.4.17", "@axis-ds/tokens": "^1.7.0-beta.1" } });
      await writeInstalledStub(dir, "@axis-ds/tokens", "1.7.0-beta.1");
      expect(await item(dir, "tailwind.config")).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message: WARN_BELOW("tailwind.config.cjs", "설치본 1.7.0-beta.1"),
      });
    });

    it("설치본이 없으면 선언 하한으로, 둘 다 없으면 「확인하지 못했습니다」 WARN", async () => {
      const declared17 = await project({ "tailwind.config.cjs": BARE_CJS }, { devDependencies: { tailwindcss: "^3.4.17", "@axis-ds/tokens": "^1.7.0" } });
      const declared16 = await project({ "tailwind.config.cjs": BARE_CJS }, { devDependencies: { tailwindcss: "^3.4.17", "@axis-ds/tokens": "^1.6.0" } });
      const none = await project({ "tailwind.config.cjs": BARE_CJS }, { devDependencies: { tailwindcss: "^3.4.17" } });
      expect(await item(declared17, "tailwind.config")).toMatchObject({ severity: "pass" });
      expect(await item(declared16, "tailwind.config")).toEqual({ name: "tailwind.config", severity: "warn", message: WARN_BELOW("tailwind.config.cjs", "선언 ^1.6.0") });
      expect(await item(none, "tailwind.config")).toMatchObject({
        severity: "warn",
        message: expect.stringContaining("@axis-ds/tokens 버전을 확인하지 못했습니다(설치본 · 선언 없음)"),
      });
    });
  });

  describe("WI-0068: brand.activation 의 마크업 data-brand + ThemeProvider 는 설치본 theme 버전으로 판정", () => {
    const LAYOUT = '<html lang="ko" data-brand="ontology">\n<body><ThemeProvider>{children}</ThemeProvider></body>';
    it("theme 설치본 1.6.2 → WARN(마운트 때 지움), 1.7.0 → PASS", async () => {
      const dir = await project({ "app/layout.tsx": LAYOUT }, { dependencies: { "@axis-ds/theme": "^1.6.2" } }, { brand: "ontology" });
      await writeInstalledStub(dir, "@axis-ds/theme", "1.6.2");
      expect(await item(dir, "brand.activation")).toEqual({
        name: "brand.activation",
        severity: "warn",
        message: 'app/layout.tsx의 <html data-brand> 를 @axis-ds/theme 설치본 1.6.2 의 ThemeProvider 가 마운트 때 지웁니다 → @axis-ds/theme 1.7.0 이상으로 올리거나 setBrand("ontology")',
      });
      await writeInstalledStub(dir, "@axis-ds/theme", "1.7.0");
      expect(await item(dir, "brand.activation")).toEqual({
        name: "brand.activation",
        severity: "pass",
        message: "app/layout.tsx에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다",
      });
    });

    it("providers 파일의 ThemeProvider 도 같은 구성으로 봄, 설치본 · 선언이 없으면 「확인하지 못했습니다」 WARN", async () => {
      const dir = await project(
        {
          "src/app/layout.tsx": 'import { Providers } from "./providers";\n<html data-brand="ontology"><Providers /></html>',
          "src/app/providers.tsx": "<ThemeProvider>{children}</ThemeProvider>",
        },
        { dependencies: {} },
        { brand: "ontology" }
      );
      expect(await item(dir, "brand.activation")).toMatchObject({
        severity: "warn",
        message: expect.stringContaining("@axis-ds/theme 버전을 확인하지 못했습니다(설치본 · 선언 없음)"),
      });
    });

    it("음성 대조: ThemeProvider 가 없거나 defaultBrand · setBrand 가 함께 있으면 버전과 상관없이 종전 PASS", async () => {
      const markupOnly = await project({ "app/layout.tsx": '<html data-brand="ontology">' }, { dependencies: {} }, { brand: "ontology" });
      const withDefault = await project(
        { "app/layout.tsx": '<html data-brand="ontology"><ThemeProvider defaultBrand="ontology">{children}</ThemeProvider></html>' },
        { dependencies: {} },
        { brand: "ontology" }
      );
      for (const dir of [markupOnly, withDefault]) {
        await writeInstalledStub(dir, "@axis-ds/theme", "1.6.2");
        expect(await item(dir, "brand.activation")).toMatchObject({ severity: "pass" });
      }
    });
  });
});

/**
 * WI-0080 D4: 제안이 상위 경로(`../`)일 때 FAIL · WARN 문구 끝에 붙는 안내(판정에는 반영하지 않음). 세 호출지(cli check ·
 * MCP check_project · theme add)가 같은 문자열을 써요. 수정 전 소스에서 테스트가 판정 단언으로 빨개지도록 import 하지 않고 적어 둡니다.
 */
const PARENT_NOTE =
  "상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀립니다. 모노레포 루트 등 앱 디렉터리 밖에서 빌드하면 content: { relative: true, files: [...] } 로 설정 파일 기준으로 바꾸세요";
/** WI-0098 PnP 안내(코어 상수를 import 하지 않고 리터럴로 고정, testplan 6절) */
const WI0098_PNP_NOTE =
  'Plug\'n\'Play 에는 node_modules 가 없습니다. content 에 path.join(path.dirname(require.resolve("@axis-ds/ui-react")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다). 정적 경로를 쓰려면 package.json 의 dependenciesMeta 에 "@axis-ds/ui-react": { "unplugged": true } 를 두고 yarn install 뒤 .yarn/unplugged 경로를 넣으세요';

/** WI-0098(Q31) 덮지 않은 PnP 대상이 ui-react · agentic-ui 둘일 때: 동적 형태와 dependenciesMeta 항목을 패키지마다 나열 */
const WI0098_PNP_NOTE_BOTH =
  'Plug\'n\'Play 에는 node_modules 가 없습니다. content 에 path.join(path.dirname(require.resolve("@axis-ds/ui-react")), "..", "dist/**/*.{js,mjs}"), path.join(path.dirname(require.resolve("@axis-ds/agentic-ui")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다). 정적 경로를 쓰려면 package.json 의 dependenciesMeta 에 "@axis-ds/ui-react": { "unplugged": true }, "@axis-ds/agentic-ui": { "unplugged": true } 를 두고 yarn install 뒤 .yarn/unplugged 경로를 넣으세요';

/** WI-0098(Q45) 덮지 않은 PnP 대상이 모두 unplugged 디렉터리가 있으면: dependenciesMeta 설정 안내 문장이 없음(정적 경로 제안은 목록 항목에) */
const WI0098_PNP_NOTE_UNPLUGGED =
  'Plug\'n\'Play 에는 node_modules 가 없습니다. content 에 path.join(path.dirname(require.resolve("@axis-ds/ui-react")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다).';

/** WI-0098(Q45) ui-react 만 unplugged 이고 agentic-ui 는 아닐 때: 동적 형태는 둘 다, 설정 안내는 agentic-ui 만 */
const WI0098_PNP_NOTE_MIXED =
  'Plug\'n\'Play 에는 node_modules 가 없습니다. content 에 path.join(path.dirname(require.resolve("@axis-ds/ui-react")), "..", "dist/**/*.{js,mjs}"), path.join(path.dirname(require.resolve("@axis-ds/agentic-ui")), "..", "dist/**/*.{js,mjs}") 처럼 실제 위치를 넣으세요(정적으로 확인할 수 없어 WARN 으로 남습니다). 정적 경로를 쓰려면 package.json 의 dependenciesMeta 에 "@axis-ds/agentic-ui": { "unplugged": true } 를 두고 yarn install 뒤 .yarn/unplugged 경로를 넣으세요';

// WI-0074: detectTailwind · axisPackagesBelowTailwind4 의 설치본 판독을 findInstalledPackage(상위 디렉터리 탐색)로.
// 브리프 측정(발행본 cli 1.6.2 · mcp 1.3.5, 실제 설치 픽스처 20개 앱 · 항목 70개)의 전이 표를 stub 설치본으로 고정합니다.
// - hoisted: npm workspaces · pnpm node-linker=hoisted 형태(앱 node_modules 에 tailwindcss · tokens 가 없고 루트에만 있음)
// - isolated: pnpm 기본 형태(앱 node_modules 에 선언한 패키지가 있음, 루트에만 선언한 tailwindcss 는 앱에 없음)
describe("WI-0074: 호이스팅 모노레포의 설치본을 상위 디렉터리에서 찾음", () => {
  const TW4_CSS = '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n';
  const TW3_CSS = '@import "@axis-ds/tokens/css";\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n';
  const TW3_CONFIG = 'import axis from "@axis-ds/tokens/tailwind";\nexport default { presets: [axis], content: ["./app/**/*.{ts,tsx}"] };\n';
  const H_CSS = `${TW4_CSS}@import "@axis-ds/ui-react/tailwind.css";\n@import "tw-animate-css";\nbody { font-family: Arial, Helvetica, sans-serif; }\n`;
  type AppName = "a-twlatest" | "b-tokold" | "c-toklatest" | "d-rootonly" | "e-tw3" | "f-tw3content" | "h-rootonly-ui";
  /** `tw3` 는 Tailwind 3 앱(설정 파일 · 앱 node_modules 의 tailwindcss 3.4.19), `config` 는 그 설정 파일(없으면 TW3_CONFIG) */
  const APPS: Record<AppName, { deps: Record<string, string>; css: string; tw3?: boolean; config?: string }> = {
    "a-twlatest": { deps: { "@axis-ds/tokens": "^1.8.0", tailwindcss: "latest" }, css: TW4_CSS },
    "b-tokold": { deps: { "@axis-ds/tokens": "^1.3.0", tailwindcss: "^4.1.0" }, css: TW4_CSS },
    "c-toklatest": { deps: { "@axis-ds/tokens": "latest", tailwindcss: "^4.1.0" }, css: TW4_CSS },
    "d-rootonly": { deps: { "@axis-ds/tokens": "^1.8.0" }, css: TW4_CSS },
    "e-tw3": { deps: { "@axis-ds/tokens": "^1.8.0", tailwindcss: "^3.4.0" }, css: TW3_CSS, tw3: true },
    // WI-0080: Tailwind 3 + ui-react(브리프 픽스처 f-tw3content 와 같은 구조). content 는 componentsDir 만 덮고 ui-react 는 덮지 않음
    "f-tw3content": {
      deps: { "@axis-ds/tokens": "^1.8.0", "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" },
      css: TW3_CSS,
      tw3: true,
      config: 'import axis from "@axis-ds/tokens/tailwind";\nexport default { presets: [axis], content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] };\n',
    },
    "h-rootonly-ui": { deps: { "@axis-ds/tokens": "^1.8.0", "@axis-ds/ui-react": "^1.8.0" }, css: H_CSS },
  };
  /** 루트 설치본(4.3.3 · 1.8.0 은 브리프 측정 때의 npm 최신) */
  const ROOT_INSTALLED = { tailwindcss: "4.3.3", "@axis-ds/tokens": "1.8.0", "@axis-ds/ui-react": "1.8.0" };

  /**
   * 모노레포 루트(tmpdir) 와 apps/<이름> 을 만듭니다. Tailwind 3 앱(e)은 실측대로 앱 node_modules 에 tailwindcss 3.4.19 가 있습니다.
   * isolated 는 앱이 선언한 패키지를 앱 node_modules 에도 둡니다(루트 설치본과 같은 version, tailwindcss 는 선언했을 때만).
   */
  async function monorepo(layout: "hoisted" | "isolated", rootInstalled: Record<string, string> = ROOT_INSTALLED, extra: Record<string, string> = {}) {
    const root = await tempDir();
    await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], devDependencies: { tailwindcss: "^4.1.0" } });
    for (const [rel, content] of Object.entries(extra)) await fs.outputFile(path.join(root, rel), content);
    for (const [name, version] of Object.entries(rootInstalled)) await writeInstalledStub(root, name, version);
    const apps = {} as Record<AppName, string>;
    for (const [name, spec] of Object.entries(APPS) as [AppName, (typeof APPS)[AppName]][]) {
      const dir = path.join(root, "apps", name);
      apps[name] = dir;
      await fs.outputJSON(path.join(dir, "package.json"), { name, private: true, dependencies: spec.deps });
      await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "components/ui" });
      await fs.outputFile(path.join(dir, "lib/utils.ts"), "export function cn() {}\n");
      await fs.outputFile(path.join(dir, "app/globals.css"), spec.css);
      if (spec.tw3) {
        await fs.outputFile(path.join(dir, "tailwind.config.ts"), spec.config ?? TW3_CONFIG);
        await writeInstalledStub(dir, "tailwindcss", "3.4.19");
      }
      if (layout === "isolated") {
        for (const dep of Object.keys(spec.deps)) {
          if (dep === "tailwindcss" && spec.tw3) continue;
          const version = rootInstalled[dep];
          if (version !== undefined) await writeInstalledStub(dir, dep, version);
        }
      }
    }
    return { root, apps };
  }
  const NAMES = ["tailwind.config", "globals.css", "dependencies", "tailwind.content", "animation"];
  const items = async (dir: string) => (await collectCheckResults(dir)).filter((r) => NAMES.includes(r.name));
  const pkgOf = async (dir: string) => (await fs.readJSON(path.join(dir, "package.json"))) as Record<string, unknown>;

  const PASS4 = { name: "tailwind.config", severity: "pass", message: 'Tailwind 4: app/globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다' };
  const GLOBALS4 = { name: "globals.css", severity: "pass", message: "app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css/tailwind4 import)" };
  const DEPS_WARN = { name: "dependencies", severity: "warn", message: "권장 의존성 누락: clsx, tailwind-merge" };
  /** WI-0081: 루트에만 선언한 tailwindcss 는 워크스페이스 루트 선언으로 인정하고 출처를 문구에 붙임(종전 「필수 의존성 누락」 FAIL) */
  const DEPS_ROOT = { name: "dependencies", severity: "warn", message: "권장 의존성 누락: clsx, tailwind-merge (워크스페이스 루트에 선언: tailwindcss)" };
  /**
   * 전이 뒤 기대값. a · b · c · d · e · h 는 hoisted · isolated 공통이에요(WI-0074 수정 전 hoisted 는 a · b · c · d 의 tailwind.config 와
   * h 의 세 항목이 다름). f 는 레이아웃마다 content 제안이 달라 `expected(layout)` 이 레이아웃별 값을 붙입니다(WI-0080).
   */
  const AFTER: Record<Exclude<AppName, "f-tw3content">, unknown[]> = {
    "a-twlatest": [PASS4, GLOBALS4, DEPS_WARN],
    "b-tokold": [PASS4, GLOBALS4, DEPS_WARN],
    "c-toklatest": [PASS4, GLOBALS4, DEPS_WARN],
    // WI-0081: 루트에만 선언한 tailwindcss 를 워크스페이스 루트 선언으로 인정(WI-0074 때는 「필수 의존성 누락」 FAIL 로 남겨 둔 인접 결함)
    "d-rootonly": [PASS4, GLOBALS4, DEPS_ROOT],
    "e-tw3": [
      { name: "tailwind.config", severity: "pass", message: "tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)" },
      { name: "globals.css", severity: "pass", message: "app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css import)" },
      DEPS_WARN,
      {
        name: "tailwind.content",
        severity: "fail",
        message: 'tailwind.config.ts의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): componentsDir(components/ui) → "./components/ui/**/*.{ts,tsx}"',
      },
    ],
    "h-rootonly-ui": [
      { name: "tailwind.config", severity: "warn", message: "Tailwind 4: app/globals.css에 create-next-app 기본 정의가 남아 있습니다(body font-family: Arial) → 지우세요" },
      GLOBALS4,
      DEPS_ROOT,
      // WI-0092(사용자 결정 Q12): WI-0074 원 픽스처(fx-npm)는 tw-animate-css 를 어디에도 선언하지 않았고, ui-react 의 optional peer 라
      // npm 이 설치하지 않아요(2026-10-27 npm 10.9.4 재현: ui-react 설치 · tw-animate-css 없음). 그래서 PASS 가 아니라 WARN 이 맞아요.
      {
        name: "animation",
        severity: "warn",
        message:
          "app/globals.css의 애니메이션 플러그인을 쓸 수 없습니다(@axis-ds/ui-react 선언, tw-animate-css 선언 없음): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않고 빌드가 실패할 수 있습니다 → tw-animate-css 를 package.json 에 선언 · 설치하세요",
      },
    ],
  };
  /** WI-0080: f 의 ui-react content 제안은 설치본 위치를 따라요(hoisted 는 루트 `../../node_modules`, isolated 는 앱 `./node_modules`) */
  const F_SUGGEST = {
    hoisted: "../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}",
    isolated: "./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}",
  } as const;
  const expected = (layout: "hoisted" | "isolated"): Record<AppName, unknown[]> => ({
    ...AFTER,
    "f-tw3content": [
      AFTER["e-tw3"][0],
      AFTER["e-tw3"][1],
      DEPS_WARN,
      {
        name: "tailwind.content",
        severity: "fail",
        message:
          `tailwind.config.ts의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): @axis-ds/ui-react → "${F_SUGGEST[layout]}"` +
          (layout === "hoisted" ? ` (${PARENT_NOTE})` : ""),
      },
      {
        name: "animation",
        severity: "warn",
        message:
          '애니메이션 플러그인이 없습니다(@axis-ds/ui-react 선언, tailwindcss-animate 선언 없음 · tailwind.config.ts plugins 에 없음): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → tailwindcss-animate 설치 뒤 plugins 에 require("tailwindcss-animate")',
      },
    ],
  });

  it("hoisted: 전이 표대로(a · d FAIL → PASS, b · c WARN → PASS, h 세 항목) 판정하고 detectTailwind 는 루트 설치본", async () => {
    const { apps } = await monorepo("hoisted");
    const want = expected("hoisted");
    for (const name of Object.keys(APPS) as AppName[]) {
      expect({ name, items: await items(apps[name]) }).toEqual({ name, items: want[name] });
    }
    expect(detectTailwind(apps["a-twlatest"], await pkgOf(apps["a-twlatest"]))).toEqual({ major: 4, source: "installed", value: "4.3.3" });
    expect(detectTailwind(apps["d-rootonly"], await pkgOf(apps["d-rootonly"]))).toEqual({ major: 4, source: "installed", value: "4.3.3" });
    for (const name of ["b-tokold", "c-toklatest"] as const) {
      expect({ name, below: axisPackagesBelowTailwind4(await pkgOf(apps[name]), apps[name]) }).toEqual({ name, below: [] });
    }
  });

  it("isolated(음성 대조): 앱 node_modules 에서 찾는 앱은 종전과 같은 판정, 루트에만 선언한 d · h 도 hoisted 와 같은 결과", async () => {
    const { apps } = await monorepo("isolated");
    const want = expected("isolated");
    for (const name of Object.keys(APPS) as AppName[]) {
      expect({ name, items: await items(apps[name]) }).toEqual({ name, items: want[name] });
    }
  });

  it("단일 프로젝트(음성 대조): 설치본이 baseDir 에 있으면 종전과 같음", async () => {
    const dir = await tempDir();
    await fs.writeJSON(path.join(dir, "package.json"), { dependencies: { "@axis-ds/tokens": "^1.3.0", tailwindcss: "^4.1.0" } });
    await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "components/ui" });
    await fs.outputFile(path.join(dir, "app/globals.css"), TW4_CSS);
    await writeInstalledStub(dir, "tailwindcss", "4.3.3");
    await writeInstalledStub(dir, "@axis-ds/tokens", "1.8.0");
    expect(await items(dir)).toEqual([PASS4, GLOBALS4, DEPS_WARN]);
  });

  it("양성 대조: 루트 tokens 설치본이 1.3.0 이면 상위에서 읽은 설치본으로 안내(below 1건, 판정 0 이 측정 실패가 아님)", async () => {
    const { apps } = await monorepo("hoisted", { ...ROOT_INSTALLED, "@axis-ds/tokens": "1.3.0" });
    const b = apps["b-tokold"];
    expect(axisPackagesBelowTailwind4(await pkgOf(b), b)).toEqual([
      { name: "@axis-ds/tokens", range: "^1.3.0", status: "below", source: "installed", installed: "1.3.0" },
    ]);
    expect((await items(b))[0]).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message: "Tailwind 4: app/globals.css에 AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/tokens 설치본 1.3.0)",
    });
  });

  it("가까운 설치본 우선: 앱 node_modules 의 tailwindcss 3.4.19 가 루트 4.3.3 보다 앞섬(e-tw3 실측 구조)", async () => {
    const { apps } = await monorepo("hoisted");
    const e = apps["e-tw3"];
    expect(detectTailwind(e, await pkgOf(e))).toEqual({ major: 3, source: "installed", value: "3.4.19" });
  });

  it("환경 가드: tmpdir 조상에 tailwindcss · AXIS 설치본이 없음(있으면 tmpdir 픽스처의 「설치본 없음」 기대가 머신마다 달라짐)", async () => {
    const dir = await tempDir();
    expect(detectTailwind(dir)).toEqual({ source: "none" });
    const declared = { dependencies: { "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "^1.3.0", "@axis-ds/agentic-ui": "^1.3.0" } };
    expect(axisPackagesBelowTailwind4(declared, dir).map((i) => i.source)).toEqual(["declared", "declared", "declared"]);
  });

  it("Plug'n'Play(.pnp.cjs): 상위에 남은 node_modules 를 읽지 않고 선언으로 감(packageVersionGate 와 같은 규칙)", async () => {
    const { apps } = await monorepo("hoisted", ROOT_INSTALLED, { ".pnp.cjs": "" });
    expect(detectTailwind(apps["a-twlatest"], await pkgOf(apps["a-twlatest"]))).toEqual({ source: "none", value: "latest" });
    expect(detectTailwind(apps["b-tokold"], await pkgOf(apps["b-tokold"]))).toEqual({ major: 4, source: "declared", value: "^4.1.0" });
    expect(axisPackagesBelowTailwind4(await pkgOf(apps["b-tokold"]), apps["b-tokold"])).toEqual([
      { name: "@axis-ds/tokens", range: "^1.3.0", status: "below", source: "declared" },
    ]);
  });

  it("check 밖 호출지: init 의 tailwind-merge 범위 · theme add 의 기본 CSS · template apply 경고가 루트 설치본 Tailwind 4 를 따름", async () => {
    const { apps } = await monorepo("hoisted");
    const d = apps["d-rootonly"];
    const plan = planUtilsDependencies(d);
    expect(plan.tailwind).toEqual({ major: 4, source: "installed", value: "4.3.3" });
    expect(plan.ranges["tailwind-merge"]).toBe("^3.4.0");
    expect(planUtilsDependencies(apps["a-twlatest"]).ranges["tailwind-merge"]).toBe("^3.4.0");
    const detail = {
      name: "t",
      slug: "t",
      description: "",
      category: "minimal",
      version: "0.1.0",
      files: [{ path: "components/x.tsx", content: "", type: "text" }],
      dependencies: {},
      devDependencies: { tailwindcss: "^3.4.0" },
    } as unknown as Parameters<typeof templateApplyWarnings>[1];
    const warnings = await templateApplyWarnings(d, detail);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("템플릿은 Tailwind 3 기준인데 이 프로젝트는 Tailwind 4(4.3.3) 입니다");
  });

  it("check 밖 호출지: theme add 는 루트 설치본 Tailwind 4 에서 tailwind4 진입점을 기본 CSS 로 고름", async () => {
    // tokens 1.3 fixture(브랜드 sample)를 루트 node_modules 에 둔 모노레포. 앱은 tailwindcss 를 선언하지 않음
    const root = await makeProject({ tokens: "1.3", layout: "empty" });
    created.push(root);
    await writeInstalledStub(root, "tailwindcss", "4.3.3");
    const app = path.join(root, "apps", "web");
    await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/tokens": "^1.3.0" } });
    await fs.outputJSON(path.join(app, "axis.config.json"), { componentsDir: "components/ui" });
    await fs.outputFile(path.join(app, "app/globals.css"), '@import "tailwindcss";\n');
    const plan = planThemeAdd(app, "sample");
    expect(plan.errors).toEqual([]);
    expect(plan.css?.tailwind4).toBe(true);
    expect(plan.css?.requiredBaseImports).toEqual(["@axis-ds/tokens/css/tailwind4"]);
    expect(plan.tailwindConfig).toBeUndefined();
  });
});

// WI-0080: Tailwind 3 content 판정의 ui-react 표본 · 제안을 findInstalledPackage(상위 탐색)로 찾은 설치본 위치 기준으로.
// 기대값은 브리프 매트릭스의 빌드 실측(Tailwind 3.4.19 CLI 를 앱 디렉터리에서 실행, ui-react 전용 선택자 402개가 생기는지)이에요.
// hoisted = npm workspaces · pnpm node-linker=hoisted(설치본이 루트 node_modules 에만), isolated = pnpm 기본(앱 node_modules 에 링크),
// single = 단일 프로젝트, missing = 설치본 없음, pnp = Plug'n'Play(.pnp.cjs). testplan 2절 표와 같은 행이에요.
describe("WI-0080: Tailwind 3 content 의 패키지 표본 · 제안을 설치본 위치 기준으로", () => {
  type Layout = "hoisted" | "isolated" | "single" | "missing" | "pnp";
  type Variant = "up" | "local" | "none" | "broad" | "relobj" | "abs" | "absOther";
  const UI = "/@axis-ds/ui-react/dist/**/*.{js,mjs}";
  const UP = `../../node_modules${UI}`;
  const LOCAL = `./node_modules${UI}`;
  const BASE = '"./app/**/*.{ts,tsx}", "./components/ui/**/*.{ts,tsx}"';

  /** 레이아웃대로 앱을 만들고 앱 디렉터리와 실제 설치 위치(node_modules 디렉터리, 없으면 앱 기준)를 돌려줍니다 */
  async function app(layout: Layout): Promise<{ dir: string; realNodeModules: string }> {
    const root = await tempDir();
    const mono = layout === "hoisted" || layout === "isolated" || layout === "pnp";
    const dir = mono ? path.join(root, "apps", "web") : root;
    if (mono) await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, workspaces: ["apps/*"] });
    if (layout === "hoisted" || layout === "pnp") await writeInstalledStub(root, "@axis-ds/ui-react", "1.8.1");
    if (layout === "pnp") await fs.outputFile(path.join(root, ".pnp.cjs"), "");
    if (layout === "isolated" || layout === "single") await writeInstalledStub(dir, "@axis-ds/ui-react", "1.8.1");
    await fs.outputJSON(path.join(dir, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" } });
    await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "components/ui" });
    if (layout !== "pnp") await writeInstalledStub(dir, "tailwindcss", "3.4.19");
    const realNodeModules = layout === "hoisted" || layout === "pnp" ? path.join(root, "node_modules") : path.join(dir, "node_modules");
    return { dir, realNodeModules };
  }
  function contentOf(v: Variant, realNodeModules: string): string {
    switch (v) {
      case "up":
        return `[${BASE}, "${UP}"]`;
      case "local":
        return `[${BASE}, "${LOCAL}"]`;
      case "none":
        return `[${BASE}]`;
      case "broad":
        return `[${BASE}, "./**/*.{js,mjs}"]`;
      case "relobj":
        return `{ relative: true, files: [${BASE}, "${UP}"] }`;
      case "abs":
        return `[${BASE}, ${JSON.stringify(`${realNodeModules.split(path.sep).join("/")}${UI}`)}]`;
      case "absOther":
        return `[${BASE}, ${JSON.stringify(`${path.join(realNodeModules, "..", "elsewhere", "node_modules").split(path.sep).join("/")}${UI}`)}]`;
    }
  }
  async function contentItem(layout: Layout, v: Variant) {
    const { dir, realNodeModules } = await app(layout);
    await fs.outputFile(path.join(dir, "tailwind.config.ts"), `export default { content: ${contentOf(v, realNodeModules)} };\n`);
    return (await collectCheckResults(dir)).find((r) => r.name === "tailwind.content");
  }
  const PASS = {
    name: "tailwind.content",
    severity: "pass",
    message: "tailwind.config.ts의 content 가 componentsDir(components/ui) · @axis-ds/ui-react 를 덮습니다",
  };
  const FAIL = (suggest: string) => ({
    name: "tailwind.content",
    severity: "fail",
    message:
      `tailwind.config.ts의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): @axis-ds/ui-react → "${suggest}"` +
      (suggest.startsWith("../") ? ` (${PARENT_NOTE})` : ""),
  });

  /** 빌드 실측(앱 cwd)과 같은 판정. hoisted 의 up · relobj · abs 는 402/402, local · none 은 0, broad 는 44/402(** 가 ../ 를 넘지 않음) */
  const MATRIX: Record<"hoisted" | "isolated" | "single", Record<Variant, unknown>> = {
    hoisted: { up: PASS, local: FAIL(UP), none: FAIL(UP), broad: FAIL(UP), relobj: PASS, abs: PASS, absOther: FAIL(UP) },
    isolated: { up: FAIL(LOCAL), local: PASS, none: FAIL(LOCAL), broad: PASS, relobj: FAIL(LOCAL), abs: PASS, absOther: FAIL(LOCAL) },
    single: { up: FAIL(LOCAL), local: PASS, none: FAIL(LOCAL), broad: PASS, relobj: FAIL(LOCAL), abs: PASS, absOther: FAIL(LOCAL) },
  };

  for (const layout of ["hoisted", "isolated", "single"] as const) {
    it(`매트릭스(${layout}): 판정 · 제안이 빌드 실측과 같음`, async () => {
      for (const v of Object.keys(MATRIX[layout]) as Variant[]) {
        expect({ layout, v, item: await contentItem(layout, v) }).toEqual({ layout, v, item: MATRIX[layout][v] });
      }
    });
  }

  it("AC1 · AC2 · AC3 (hoisted): 실제 위치 ../../node_modules 를 인정하고, 종전 제안 ./node_modules 만 있으면 FAIL(종전 거짓 PASS, 빌드 0/402)", async () => {
    expect(await contentItem("hoisted", "up")).toEqual(PASS);
    expect(await contentItem("hoisted", "local")).toEqual(FAIL(UP));
    expect((await contentItem("hoisted", "none"))?.message).toContain(`@axis-ds/ui-react → "${UP}"`);
  });

  it("AC5: 설치본이 없으면 종전 표본 node_modules/<pkg> · 제안 ./node_modules/<pkg> 를 쓰고, Plug'n'Play 는 node_modules 표본을 덮음으로 보지 않음(WI-0098)", async () => {
    expect(await contentItem("missing", "local")).toEqual(PASS);
    expect(await contentItem("missing", "none")).toEqual(FAIL(LOCAL));
    // PnP: 루트에 남은 node_modules 설치본을 읽지 않음(isPnpProject 가드). 가드를 지우면 up 이 PASS 로 바뀌어 빨개짐.
    // WI-0098(AC3 · C1): FAIL 은 유지하고 제안 자리에 ./node_modules 대신 PnP 안내
    expect(await contentItem("pnp", "up")).toEqual({
      name: "tailwind.content",
      severity: "fail",
      message:
        "tailwind.config.ts의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): @axis-ds/ui-react(Plug'n'Play 라 node_modules 경로가 없음)" +
        ` (${WI0098_PNP_NOTE})`,
    });
    // WI-0098(AC1): 종전 거짓 PASS 를 WARN 으로(0 → 0)
    expect(await contentItem("pnp", "local")).toEqual({
      name: "tailwind.content",
      severity: "warn",
      message:
        "tailwind.config.ts의 content 가 Plug'n'Play 에서 스캔되지 않는 경로로 @axis-ds/ui-react 를 덮습니다(node_modules 경로 · ./** 는 스캔되지 않음)" +
        ` (${WI0098_PNP_NOTE})`,
    });
  });

  it("AC6: ** 는 ../ 세그먼트를 넘지 않음(hoisted 의 ./**/*.{js,mjs} 는 FAIL, 단일 프로젝트는 PASS 유지)", async () => {
    expect(await contentItem("hoisted", "broad")).toEqual(FAIL(UP));
    expect(await contentItem("single", "broad")).toEqual(PASS);
  });

  it("AC7: 절대경로 glob 은 resolve(baseDir, 표본) 와 비교(실제 위치면 PASS, 다른 위치면 FAIL)", async () => {
    for (const layout of ["hoisted", "isolated", "single"] as const) {
      expect({ layout, item: await contentItem(layout, "abs") }).toEqual({ layout, item: PASS });
      expect({ layout, severity: (await contentItem(layout, "absOther"))?.severity }).toEqual({ layout, severity: "fail" });
    }
  });

  it("contentGlobCovers 단위: 앞쪽 ../ 개수가 같을 때만 덮음 · 절대경로는 baseDir 기준 절대 표본과 비교", () => {
    const base = path.resolve("/work/mono/apps/web");
    const sample = "../../node_modules/@axis-ds/ui-react/dist/index.js";
    expect(contentGlobCovers(UP, sample, base)).toBe(true);
    expect(contentGlobCovers(`./${UP}`, sample, base)).toBe(true);
    expect(contentGlobCovers("../node_modules/**/*.js", sample, base)).toBe(false);
    expect(contentGlobCovers("./**/*.{js,mjs}", sample, base)).toBe(false);
    expect(contentGlobCovers("**/*.js", sample, base)).toBe(false);
    expect(contentGlobCovers("./**/*.{js,mjs}", "node_modules/@axis-ds/ui-react/dist/index.js", base)).toBe(true);
    expect(contentGlobCovers("/work/mono/node_modules/@axis-ds/ui-react/dist/**/*.js", sample, base)).toBe(path.sep === "/");
    expect(contentGlobCovers("/work/other/node_modules/@axis-ds/ui-react/dist/**/*.js", sample, base)).toBe(false);
    // 정규식 자체는 ** 가 ../ 를 먹음(그래서 ../ 개수 비교를 따로 둠)
    expect(contentGlobToRegExp("./**/*.{js,mjs}").test(sample)).toBe(true);
  });

  // 검토 후속(배치 6b 반박 검토 finding): 중괄호 안에 깊이가 다른 경로를 섞은 glob 은 갈래마다 ../ 개수를 따로 셈.
  // 빌드 실측(npm · yarn workspaces 앱 cwd, Tailwind 3.4.17): `{./src,../../node_modules/@axis-ds/ui-react/dist}/**/*.{js,mjs,tsx}` 는
  // ui-react 선택자 372/372 인데 수정 전에는 FAIL(갈래를 펼치지 않고 앞쪽 ../ 를 0 으로 셈)
  it("중괄호 갈래마다 ../ 개수를 셈(깊이를 섞은 glob 이 실제 설치 위치를 덮으면 PASS)", async () => {
    const MIXED = "{./src,../../node_modules/@axis-ds/ui-react/dist}/**/*.{js,mjs,tsx}";
    const base = path.resolve("/work/mono/apps/web");
    const sample = "../../node_modules/@axis-ds/ui-react/dist/index.js";
    expect(contentGlobCovers(MIXED, sample, base)).toBe(true);
    expect(contentGlobCovers("./{src,../../node_modules/@axis-ds/ui-react/dist}/**/*.js", sample, base)).toBe(true);
    // 갈래를 펼쳐도 ** 가 ../ 를 넘지 않는 규칙은 그대로(../ 하나짜리 갈래는 표본 ../../ 를 덮지 않음)
    expect(contentGlobCovers("{./src,../node_modules}/**/*.js", sample, base)).toBe(false);
    expect(contentGlobCovers("{./src,./lib}/**/*.js", sample, base)).toBe(false);
    expect(contentGlobCovers("{./src,./node_modules/@axis-ds/ui-react/dist}/**/*.js", "node_modules/@axis-ds/ui-react/dist/index.js", base)).toBe(true);
    // 절대경로 갈래도 펼친 뒤 절대 비교
    expect(contentGlobCovers("{./src,/work/mono/node_modules/@axis-ds/ui-react/dist}/**/*.js", sample, base)).toBe(path.sep === "/");

    const { dir: hoisted } = await app("hoisted");
    await fs.outputFile(path.join(hoisted, "tailwind.config.ts"), `export default { content: [${BASE}, "${MIXED}"] };\n`);
    expect((await collectCheckResults(hoisted)).find((r) => r.name === "tailwind.content")).toEqual(PASS);
    // 음성 대조: 같은 glob 이 pnpm 기본(앱 node_modules 설치)에서는 실제 위치를 덮지 않아 FAIL
    const { dir: isolated } = await app("isolated");
    await fs.outputFile(path.join(isolated, "tailwind.config.ts"), `export default { content: [${BASE}, "${MIXED}"] };\n`);
    expect((await collectCheckResults(isolated)).find((r) => r.name === "tailwind.content")).toEqual(FAIL(LOCAL));
  });

  // 검토 후속: pnpm 기본 앱의 node_modules/@axis-ds/ui-react 는 .pnpm 스토어로 가는 심링크예요. 스토어 실경로를 가리키는 절대 glob 도
  // Tailwind 가 실제로 스캔하므로(빌드 실측 372/372) 실경로와도 비교. 수정 전에는 심링크 경로와만 비교해 FAIL
  it("절대경로 glob 은 표본의 실경로(심링크를 푼 경로)와도 비교", async () => {
    const root = await tempDir();
    const dir = path.join(root, "apps", "web");
    const store = path.join(root, "node_modules", ".pnpm", "@axis-ds+ui-react@1.8.1", "node_modules", "@axis-ds", "ui-react");
    await fs.outputJSON(path.join(store, "package.json"), { name: "@axis-ds/ui-react", version: "1.8.1" });
    await fs.outputFile(path.join(store, "dist", "index.js"), "");
    await fs.ensureDir(path.join(dir, "node_modules", "@axis-ds"));
    await fs.symlink(store, path.join(dir, "node_modules", "@axis-ds", "ui-react"), "dir");
    await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    await fs.outputJSON(path.join(dir, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" } });
    await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "components/ui" });
    await writeInstalledStub(dir, "tailwindcss", "3.4.19");
    const item = async (glob: string) => {
      await fs.outputFile(path.join(dir, "tailwind.config.ts"), `export default { content: [${BASE}, ${JSON.stringify(glob)}] };\n`);
      return (await collectCheckResults(dir)).find((r) => r.name === "tailwind.content");
    };
    const real = (await fs.realpath(store)).split(path.sep).join("/");
    expect(await item(`${real}/dist/**/*.{js,mjs}`)).toEqual(PASS);
    // 종전대로 심링크 경로 · 상대 제안도 PASS, 다른 스토어 항목은 FAIL(음성 대조)
    expect(await item(`${path.join(dir, "node_modules").split(path.sep).join("/")}${UI}`)).toEqual(PASS);
    expect(await item(LOCAL)).toEqual(PASS);
    expect((await item(`${real.replace("ui-react@1.8.1", "ui-react@9.9.9")}/dist/**/*.{js,mjs}`))?.severity).toBe("fail");
  });
});

// WI-0098: Yarn Plug'n'Play 의 Tailwind 3 content 판정. 실설치 측정(Yarn 4.5.3 · Tailwind CLI 3.4.19, 발행본 1.7.6 · 1.4.5):
// 기본 PnP 의 node_modules glob · ./** 는 빌드 4(패키지 glob 없음과 같음)인데 PASS, unplugged 상대 · 절대 glob 은 빌드 429(node-modules
// 대조군과 바이트 같음)인데 FAIL, 루트 전용 선언의 동적 형태는 빌드 rc 1. 사용자 결정 Q22 · Q23 · Q29 와 구현 해석 C1 ~ C4(Q30)로
// 「종전 덮음 → WARN · 종전 덮지 않음 → FAIL 유지 · unplugged(앱 범위에 맞는 버전) 인정 · 루트 전용은 앱 선언 안내」를 고정해요.
// 스텁은 판정 입력(파일 존재 · 버전 · 선언 위치)만 재현하고, 빌드 정답은 testplan 4절 실설치 측정으로만 판정해요.
describe("WI-0098: Yarn Plug'n'Play 의 Tailwind 3 content 판정", () => {
  type Layout = "pnp" | "pnpUnplugged" | "pnpUnpluggedOther" | "pnpRootOnly";
  type Variant = "nm" | "broad" | "none" | "dyn" | "unplugRel" | "unplugAbs";
  const UI = "/@axis-ds/ui-react/dist/**/*.{js,mjs}";
  const NM = `./node_modules${UI}`;
  const UNPLUG_REL = `../../.yarn/unplugged/*/node_modules${UI}`;
  const BASE = '"./app/**/*.{ts,tsx}", "./components/ui/**/*.{ts,tsx}"';
  const UNPLUG_DIR = "@axis-ds-ui-react-virtual-0000000000";

  async function writeUnplugged(root: string, name: string, version: string, entry = UNPLUG_DIR) {
    const dir = path.join(root, ".yarn", "unplugged", entry, "node_modules", ...name.split("/"));
    await fs.outputJSON(path.join(dir, "package.json"), { name, version });
    await fs.outputFile(path.join(dir, "dist", "index.js"), "");
  }

  /** WI-0080 의 app("pnp") 와 같은 바탕(루트 workspaces + 빈 .pnp.cjs + 루트 node_modules 스텁, 가드 불변식용) */
  async function app(layout: Layout, extraAppDeps: Record<string, string> = {}): Promise<{ root: string; dir: string }> {
    const root = await tempDir();
    const dir = path.join(root, "apps", "web");
    const rootOnly = layout === "pnpRootOnly";
    await fs.writeJSON(path.join(root, "package.json"), {
      name: "root",
      private: true,
      workspaces: ["apps/*"],
      ...(rootOnly ? { dependencies: { "@axis-ds/ui-react": "^1.8.0" } } : {}),
    });
    await writeInstalledStub(root, "@axis-ds/ui-react", "1.8.1");
    await fs.outputFile(path.join(root, ".pnp.cjs"), "");
    if (layout === "pnpUnplugged" || rootOnly) await writeUnplugged(root, "@axis-ds/ui-react", "1.8.1");
    if (layout === "pnpUnpluggedOther") await writeUnplugged(root, "@axis-ds/ui-react", "1.7.0", "@axis-ds-ui-react-npm-1.7.0-0000000000");
    await fs.outputJSON(path.join(dir, "package.json"), {
      name: "web",
      private: true,
      dependencies: { ...(rootOnly ? {} : { "@axis-ds/ui-react": "^1.8.0" }), tailwindcss: "^3.4.0", ...extraAppDeps },
    });
    await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "components/ui" });
    return { root, dir };
  }
  function contentOf(v: Variant, root: string): string {
    switch (v) {
      case "nm":
        return `[${BASE}, "${NM}"]`;
      case "broad":
        return `[${BASE}, "./**/*.{js,mjs}"]`;
      case "none":
        return `[${BASE}]`;
      case "dyn":
        return `[${BASE}, path.join(ui, "dist/**/*.{js,mjs}")]`;
      case "unplugRel":
        return `[${BASE}, "${UNPLUG_REL}"]`;
      case "unplugAbs":
        return `[${BASE}, ${JSON.stringify(`${path.join(root, ".yarn", "unplugged", UNPLUG_DIR, "node_modules").split(path.sep).join("/")}${UI}`)}]`;
    }
  }
  async function contentItem(layout: Layout, v: Variant) {
    const { root, dir } = await app(layout);
    await fs.outputFile(path.join(dir, "tailwind.config.ts"), `export default { content: ${contentOf(v, await fs.realpath(root))} };\n`);
    return (await collectCheckResults(dir)).find((r) => r.name === "tailwind.content");
  }

  const PASS = {
    name: "tailwind.content",
    severity: "pass",
    message: "tailwind.config.ts의 content 가 componentsDir(components/ui) · @axis-ds/ui-react 를 덮습니다",
  };
  const NO_NM = "@axis-ds/ui-react(Plug'n'Play 라 node_modules 경로가 없음)";
  const ROOT_ONLY = "@axis-ds/ui-react 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요";
  const UNPLUG_ITEM = `@axis-ds/ui-react → "${UNPLUG_REL}"`;
  const LEGACY = "tailwind.config.ts의 content 가 Plug'n'Play 에서 스캔되지 않는 경로로 @axis-ds/ui-react 를 덮습니다(node_modules 경로 · ./** 는 스캔되지 않음)";
  const FAILP = "tailwind.config.ts의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): ";
  const DYNP = "tailwind.config.ts의 content 를 정적으로 다 읽지 못해 확인하지 못했습니다: ";
  const item = (severity: "pass" | "warn" | "fail", message: string) => ({ name: "tailwind.content", severity, message });
  const P = ` (${WI0098_PNP_NOTE})`;
  // 사용자 결정 Q45: unplugged 디렉터리가 이미 있는 대상은 설정 안내 없이 동적 형태만(정적 제안은 UNPLUG_ITEM)
  const U = ` (${WI0098_PNP_NOTE_UNPLUGGED})`;
  const PP = ` (${PARENT_NOTE})${U}`;

  const MATRIX: Record<Layout, Record<Variant, unknown>> = {
    // AC1 · AC2 · AC3: 종전 덮음(nm · broad) → WARN, 종전 덮지 않음 → FAIL 유지(C1), 동적 → WARN. 제안 ./node_modules 0건
    pnp: {
      nm: item("warn", LEGACY + P),
      broad: item("warn", LEGACY + P),
      none: item("fail", FAILP + NO_NM + P),
      dyn: item("warn", DYNP + NO_NM + P),
      unplugRel: item("fail", FAILP + NO_NM + P),
      unplugAbs: item("fail", FAILP + NO_NM + P),
    },
    // AC4(Q29): unplugged 상대 · 절대 glob PASS(1 → 0). nm · broad 는 WARN(C2), none 은 unplugged 상대 제안 + cwd 안내(C4)
    pnpUnplugged: {
      nm: item("warn", `${LEGACY}: ${UNPLUG_ITEM}${PP}`),
      broad: item("warn", `${LEGACY}: ${UNPLUG_ITEM}${PP}`),
      none: item("fail", FAILP + UNPLUG_ITEM + PP),
      // 사용자 결정 Q32(2026-10-28): unplugged PnP 의 dyn(실설치 Q3-dyn · P3-dyn, 빌드 429)은 WARN + unplugged 상대 glob + 상위 경로 안내 + PnP 안내로 확정
      dyn: item("warn", DYNP + UNPLUG_ITEM + PP),
      unplugRel: PASS,
      unplugAbs: PASS,
    },
    // AC4 · extra 4: 앱 범위(^1.8.0) 밖 버전(1.7.0)의 unplugged 만 있으면 기본 PnP 와 같음
    pnpUnpluggedOther: {
      nm: item("warn", LEGACY + P),
      broad: item("warn", LEGACY + P),
      none: item("fail", FAILP + NO_NM + P),
      dyn: item("warn", DYNP + NO_NM + P),
      unplugRel: item("fail", FAILP + NO_NM + P),
      unplugAbs: item("fail", FAILP + NO_NM + P),
    },
    // AC6(Q22 · C3): 루트 전용은 경로 제안 · 동적 형태 안내 · 덮음 인정 없음. unplugged 가 있어도 인정하지 않음(빌드 429 인 알려진 한계)
    pnpRootOnly: {
      nm: item("warn", `${LEGACY}: ${ROOT_ONLY}`),
      broad: item("warn", `${LEGACY}: ${ROOT_ONLY}`),
      none: item("fail", FAILP + ROOT_ONLY),
      dyn: item("warn", DYNP + ROOT_ONLY),
      unplugRel: item("fail", FAILP + ROOT_ONLY),
      unplugAbs: item("fail", FAILP + ROOT_ONLY),
    },
  };

  for (const layout of Object.keys(MATRIX) as Layout[]) {
    it(`매트릭스(${layout}): severity · 문구`, async () => {
      for (const v of Object.keys(MATRIX[layout]) as Variant[]) {
        expect({ layout, v, item: await contentItem(layout, v) }).toEqual({ layout, v, item: MATRIX[layout][v] });
      }
    });
  }

  it("AC1: agentic-ui 도 같은 판정(node_modules glob 두 개 → WARN, 제안 0건)", async () => {
    const { dir } = await app("pnp", { "@axis-ds/agentic-ui": "^1.8.0" });
    await fs.outputFile(
      path.join(dir, "tailwind.config.ts"),
      `export default { content: [${BASE}, "${NM}", "./node_modules/@axis-ds/agentic-ui/dist/**/*.{js,mjs}"] };\n`
    );
    const got = (await collectCheckResults(dir)).find((r) => r.name === "tailwind.content");
    expect(got).toEqual(
      item(
        "warn",
        "tailwind.config.ts의 content 가 Plug'n'Play 에서 스캔되지 않는 경로로 @axis-ds/ui-react · @axis-ds/agentic-ui 를 덮습니다(node_modules 경로 · ./** 는 스캔되지 않음)" +
          ` (${WI0098_PNP_NOTE_BOTH})`
      )
    );
    expect(got?.message).not.toContain('"./node_modules');
  });

  it("AC6 양성 대조: 루트 · 앱 모두 선언하면 루트 전용 문구가 아니라 AC1 판정", async () => {
    const { root, dir } = await app("pnp");
    const rootPkg = await fs.readJSON(path.join(root, "package.json"));
    await fs.writeJSON(path.join(root, "package.json"), { ...rootPkg, dependencies: { "@axis-ds/ui-react": "^1.8.0" } });
    await fs.outputFile(path.join(dir, "tailwind.config.ts"), `export default { content: ${contentOf("nm", root)} };\n`);
    expect((await collectCheckResults(dir)).find((r) => r.name === "tailwind.content")).toEqual(item("warn", LEGACY + P));
  });

  it("C1 · C2: 종전 덮음과 종전 덮지 않음이 섞이면 FAIL(0 → 1 없음은 종전 FAIL 행에만 해당)", async () => {
    const { dir } = await app("pnp", { "@axis-ds/agentic-ui": "^1.8.0" });
    await fs.outputFile(path.join(dir, "tailwind.config.ts"), `export default { content: [${BASE}, "${NM}"] };\n`);
    expect((await collectCheckResults(dir)).find((r) => r.name === "tailwind.content")).toEqual(
      item("fail", `${FAILP}${NO_NM} · @axis-ds/agentic-ui(Plug'n'Play 라 node_modules 경로가 없음) (${WI0098_PNP_NOTE_BOTH})`)
    );
  });

  it("unplugged 디렉터리가 앱 디렉터리 기준 PnP 루트에 있으면 제안은 ./.yarn/unplugged(상위 경로 안내 없음)", async () => {
    const root = await tempDir();
    await fs.outputFile(path.join(root, ".pnp.cjs"), "");
    await writeUnplugged(root, "@axis-ds/ui-react", "1.8.1");
    await fs.outputJSON(path.join(root, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" } });
    await fs.outputFile(path.join(root, "tailwind.config.js"), `module.exports = { content: ["./app/**/*.{ts,tsx}"] };\n`);
    expect((await collectCheckResults(root)).find((r) => r.name === "tailwind.content")).toEqual(
      item(
        "fail",
        `tailwind.config.js의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): @axis-ds/ui-react → "./.yarn/unplugged/*/node_modules${UI}"${U}`
      )
    );
    await fs.outputFile(path.join(root, "tailwind.config.js"), `module.exports = { content: ["./app/**/*.{ts,tsx}", "./.yarn/unplugged/*/node_modules${UI}"] };\n`);
    expect((await collectCheckResults(root)).find((r) => r.name === "tailwind.content")?.severity).toBe("pass");
  });

  // WI-0098(사용자 결정 Q45): unplugged 디렉터리가 있는 패키지는 dependenciesMeta 설정 안내에서 빠지고, 없는 패키지만 나열해요
  it("Q45: 일부만 unplugged 면 설정 안내에 unplugged 가 없는 패키지만, 모두 unplugged 면 설정 안내 문장 없음", async () => {
    const root = await tempDir();
    await fs.outputFile(path.join(root, ".pnp.cjs"), "");
    await writeUnplugged(root, "@axis-ds/ui-react", "1.8.1");
    await fs.outputJSON(path.join(root, "package.json"), {
      name: "web",
      private: true,
      dependencies: { "@axis-ds/ui-react": "^1.8.0", "@axis-ds/agentic-ui": "^1.8.0", tailwindcss: "^3.4.0" },
    });
    await fs.outputFile(path.join(root, "tailwind.config.js"), `module.exports = { content: ["./app/**/*.{ts,tsx}"] };\n`);
    const got = (await collectCheckResults(root)).find((r) => r.name === "tailwind.content");
    expect(got).toEqual(
      item(
        "fail",
        `${FAILP.replace("tailwind.config.ts", "tailwind.config.js")}@axis-ds/ui-react → "./.yarn/unplugged/*/node_modules${UI}" · ` +
          `@axis-ds/agentic-ui(Plug'n'Play 라 node_modules 경로가 없음) (${WI0098_PNP_NOTE_MIXED})`
      )
    );
    expect(got?.message).not.toContain('"@axis-ds/ui-react": { "unplugged": true }');
    // 둘 다 unplugged 면 설정 안내 문장이 없음(동적 형태는 둘 다)
    await writeUnplugged(root, "@axis-ds/agentic-ui", "1.8.1");
    const both = (await collectCheckResults(root)).find((r) => r.name === "tailwind.content");
    expect(both?.severity).toBe("fail");
    expect(both?.message).toContain('require.resolve("@axis-ds/agentic-ui")');
    expect(both?.message).not.toContain("dependenciesMeta");
    expect(both?.message.endsWith("(정적으로 확인할 수 없어 WARN 으로 남습니다).)")).toBe(true);
  });

  // WI-0098(사용자 결정 Q33): 앱이 PnP 루트 자신이고 unplugged 가 있으면 표본이 ./.yarn/unplugged/... 라 넓은 ./** 가 문자열로는 덮지만,
  // fast-glob 기본(dot: false)은 .yarn 을 넘지 않아 빌드는 규칙 4(실측 S1-broad, none 과 바이트 같음, 1.7.6 · 수정 전 신판 모두 PASS).
  // unplugged 표본은 ** · * 가 점으로 시작하는 세그먼트를 넘지 않을 때만 덮음으로 봐요(S1-unplugRel · S1-yarnstar 는 빌드 429 · 435 라 PASS 유지)
  it("Q33: PnP 루트 앱의 넓은 ./** 는 .yarn/unplugged 표본을 덮지 않음(WARN), .yarn 을 글자로 쓴 glob 은 PASS", async () => {
    const root = await tempDir();
    await fs.outputFile(path.join(root, ".pnp.cjs"), "");
    await writeUnplugged(root, "@axis-ds/ui-react", "1.8.2");
    await fs.outputJSON(path.join(root, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" } });
    const real = (await fs.realpath(root)).split(path.sep).join("/");
    const at = async (glob: string) => {
      await fs.outputFile(path.join(root, "tailwind.config.ts"), `export default { content: ["./app/**/*.{ts,tsx}", ${JSON.stringify(glob)}] };\n`);
      return (await collectCheckResults(root)).find((r) => r.name === "tailwind.content");
    };
    const warn = item("warn", `${LEGACY}: @axis-ds/ui-react → "./.yarn/unplugged/*/node_modules${UI}"${U}`);
    const pass = item("pass", "tailwind.config.ts의 content 가 @axis-ds/ui-react 를 덮습니다");
    const rows: Array<[string, unknown]> = [
      ["./**/*.{js,mjs}", warn],
      ["**/*.{js,mjs}", warn],
      ["./*/**/*.{js,mjs}", warn],
      ["./{*,app}/**/*.{js,mjs}", warn],
      [`${real}/**/*.{js,mjs}`, warn],
      ["./.yarn/**/*.{js,mjs}", pass],
      [`./.yarn/unplugged/*/node_modules${UI}`, pass],
      ["./{.yarn,app}/**/*.{js,mjs}", pass],
      [`${real}/.yarn/unplugged/*/node_modules${UI}`, pass],
    ];
    for (const [glob, want] of rows) expect({ glob, got: await at(glob) }).toEqual({ glob, got: want });
  });

  it("Q33 음성 대조: noDot 은 PnP unplugged 표본에만(비 PnP 단일 프로젝트의 ./** 는 종전 PASS, 정규식 기본값은 종전과 같음)", async () => {
    const root = await tempDir();
    await fs.ensureDir(path.join(root, ".git"));
    await writeInstalledStub(root, "@axis-ds/ui-react", "1.8.2");
    await fs.outputJSON(path.join(root, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" } });
    await fs.outputFile(path.join(root, "tailwind.config.ts"), `export default { content: ["./app/**/*.{ts,tsx}", "./**/*.{js,mjs}"] };\n`);
    expect((await collectCheckResults(root)).find((r) => r.name === "tailwind.content")).toEqual(
      item("pass", "tailwind.config.ts의 content 가 @axis-ds/ui-react 를 덮습니다")
    );
    const s = ".yarn/unplugged/x/node_modules/@axis-ds/ui-react/dist/index.js";
    expect(contentGlobToRegExp("./**/*.{js,mjs}").test(s)).toBe(true);
    expect(contentGlobToRegExp("./**/*.{js,mjs}", { noDot: true }).test(s)).toBe(false);
    expect(contentGlobToRegExp("./**/*.{js,mjs}").source).toBe(contentGlobToRegExp("./**/*.{js,mjs}", {}).source);
    expect(contentGlobToRegExp("./**/*.{js,mjs}", { noDot: true }).test("node_modules/@axis-ds/ui-react/dist/index.js")).toBe(true);
  });

  it("findPnpUnpluggedPackages: 앱 범위에 맞는 버전만 이름순으로, PnP 가 아니거나 범위를 읽지 못하면 빈 목록", async () => {
    const root = await tempDir();
    await fs.outputFile(path.join(root, ".pnp.cjs"), "");
    await writeUnplugged(root, "@axis-ds/ui-react", "1.8.2", "b-1.8.2");
    await writeUnplugged(root, "@axis-ds/ui-react", "1.7.0", "a-1.7.0");
    await writeUnplugged(root, "@axis-ds/ui-react", "1.8.1", "c-1.8.1");
    const dir = path.join(root, "apps", "web");
    await fs.ensureDir(dir);
    const real = await fs.realpath(root);
    const at = (entry: string) => path.join(real, ".yarn", "unplugged", entry, "node_modules", "@axis-ds", "ui-react");
    expect(findPnpUnpluggedPackages(dir, "@axis-ds/ui-react", "^1.8.0")).toEqual([at("b-1.8.2"), at("c-1.8.1")]);
    expect(findPnpUnpluggedPackages(dir, "@axis-ds/ui-react", "~1.7.0")).toEqual([at("a-1.7.0")]);
    expect(findPnpUnpluggedPackages(dir, "@axis-ds/ui-react", "workspace:*")).toEqual([]);
    expect(findPnpUnpluggedPackages(dir, "@axis-ds/agentic-ui", "^1.8.0")).toEqual([]);
    // 음성 대조: .pnp.cjs 가 없으면(.git 에서 멈춤) 찾지 않음
    const plain = await tempDir();
    await fs.ensureDir(path.join(plain, ".git"));
    await writeUnplugged(plain, "@axis-ds/ui-react", "1.8.2");
    expect(findPnpUnpluggedPackages(plain, "@axis-ds/ui-react", "^1.8.0")).toEqual([]);
  });

  it("versionSatisfiesRange: npm 범위 형태 · prerelease · 판정 불가", () => {
    const cases: Array<[string, string, boolean | undefined]> = [
      ["1.8.1", "^1.8.0", true],
      ["2.0.0", "^1.8.0", false],
      ["1.7.9", "^1.8.0", false],
      ["0.2.5", "^0.2.0", true],
      ["0.3.0", "^0.2.0", false],
      ["1.8.9", "~1.8.0", true],
      ["1.9.0", "~1.8.0", false],
      ["1.8.2", "1.8.2", true],
      ["1.8.3", "=1.8.2", false],
      ["1.9.0", "1.x", true],
      ["2.0.0", "1.x", false],
      ["1.8.0", "1.8", true],
      ["5.0.0", "*", true],
      ["1.8.0", ">=1.8.0 <2", true],
      ["2.0.0", ">=1.8.0 <2", false],
      ["1.9.0", "1.8.0 - 1.9", true],
      ["1.10.0", "1.8.0 - 1.9", false],
      ["3.0.0", "^1.8.0 || ^3.0.0", true],
      ["1.9.0-beta.1", "^1.8.0", false],
      ["1.9.0-beta.1", "^1.9.0-beta.0", true],
      ["1.8.1", "workspace:*", undefined],
      ["1.8.1", "catalog:", undefined],
      ["1.8.1", "latest", undefined],
    ];
    for (const [v, r, want] of cases) expect({ v, r, got: versionSatisfiesRange(v, r) }).toEqual({ v, r, got: want });
  });
});

// WI-0090: pnpm 기본 레이아웃에서 앱 · 루트가 모두 ui-react 를 선언하면 앱 node_modules 링크가 표본이라, 같은 스토어를 가리키는 루트 링크
// (`../../node_modules/...`)나 스토어 실경로를 상대 경로로 쓴 glob 이 거짓 FAIL 이었어요. 빌드 실측(Tailwind 3.4.19 CLI 앱 cwd, ui-react 1.8.2):
// 두 변형 모두 앱 경로 변형과 바이트 같은 CSS(선택자 427). 루트가 다른 버전(1.8.1)이면 루트 링크 변형은 426 으로 Select placeholder 클래스가
// 빠져 FAIL 이 맞아요(음성 대조). 그래서 실경로가 앱 설치본과 같은 상위 설치본만 인정하고, 다르면 FAIL 문구에 이유를 붙여요(사용자 결정).
describe("WI-0090: 앱 설치본과 실경로가 같은 상위 설치본 · 스토어 상대 실경로를 content 표본으로 인정", () => {
  const UI = "/@axis-ds/ui-react/dist/**/*.{js,mjs}";
  const UP = `../../node_modules${UI}`;
  const LOCAL = `./node_modules${UI}`;
  const BASE = '"./app/**/*.{ts,tsx}", "./components/ui/**/*.{ts,tsx}"';
  const STORE = (v: string) => `node_modules/.pnpm/@axis-ds+ui-react@${v}/node_modules/@axis-ds/ui-react`;
  const PASS = {
    name: "tailwind.content",
    severity: "pass",
    message: "tailwind.config.ts의 content 가 componentsDir(components/ui) · @axis-ds/ui-react 를 덮습니다",
  };
  const FAIL = (extra = "") => ({
    name: "tailwind.content",
    severity: "fail",
    message: `tailwind.config.ts의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): @axis-ds/ui-react → "${LOCAL}"${extra}`,
  });
  const OTHER = (versions: string) =>
    ` (상위 경로 ../../node_modules/@axis-ds/ui-react 는 앱이 쓰는 설치본과 다른 설치본${versions}이라 덮음으로 보지 않습니다)`;

  async function store(root: string, v: string): Promise<string> {
    const dir = path.join(root, ...STORE(v).split("/"));
    await fs.outputJSON(path.join(dir, "package.json"), { name: "@axis-ds/ui-react", version: v });
    await fs.outputFile(path.join(dir, "dist", "index.js"), "");
    return dir;
  }
  async function link(target: string, at: string): Promise<void> {
    await fs.ensureDir(path.join(at, "node_modules", "@axis-ds"));
    await fs.symlink(target, path.join(at, "node_modules", "@axis-ds", "ui-react"), "dir");
  }
  /** 앱은 1.8.1 스토어에 링크, 루트는 rootVersion 스토어에 링크(undefined 면 루트 설치본 없음) */
  async function app(rootVersion: string | undefined): Promise<string> {
    const root = await tempDir();
    const dir = path.join(root, "apps", "web");
    await link(await store(root, "1.8.1"), dir);
    if (rootVersion !== undefined) await link(rootVersion === "1.8.1" ? path.join(root, ...STORE("1.8.1").split("/")) : await store(root, rootVersion), root);
    await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    await fs.outputJSON(path.join(root, "package.json"), { name: "root", private: true, dependencies: { "@axis-ds/ui-react": "^1.8.0" } });
    await fs.outputJSON(path.join(dir, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" } });
    await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "components/ui" });
    await writeInstalledStub(dir, "tailwindcss", "3.4.19");
    return dir;
  }
  async function item(dir: string, glob: string | undefined) {
    const extra = glob === undefined ? "" : `, ${JSON.stringify(glob)}`;
    await fs.outputFile(path.join(dir, "tailwind.config.ts"), `export default { content: [${BASE}${extra}] };\n`);
    return (await collectCheckResults(dir)).find((r) => r.name === "tailwind.content");
  }

  it("AC1: 루트 링크가 앱과 같은 스토어면 ../../node_modules 를 인정(종전 거짓 FAIL, 빌드 427 = 앱 경로 427)", async () => {
    const dir = await app("1.8.1");
    expect(await item(dir, UP)).toEqual(PASS);
    // 종전 행은 그대로
    expect(await item(dir, LOCAL)).toEqual(PASS);
    expect(await item(dir, undefined)).toEqual(FAIL());
  });

  it("AC2: 스토어 실경로를 상대 경로로 쓴 glob 을 인정(종전 거짓 FAIL, 절대 실경로는 이미 PASS)", async () => {
    const dir = await app(undefined);
    expect(await item(dir, `../../${STORE("1.8.1")}/dist/**/*.{js,mjs}`)).toEqual(PASS);
    expect(await item(dir, `../../node_modules/.pnpm/**${UI}`)).toEqual(PASS);
    // 음성 대조: 다른 스토어 항목 · 깊이가 다른 상대 경로는 FAIL
    expect((await item(dir, `../../${STORE("9.9.9")}/dist/**/*.{js,mjs}`))?.severity).toBe("fail");
    expect((await item(dir, `../${STORE("1.8.1")}/dist/**/*.{js,mjs}`))?.severity).toBe("fail");
  });

  it("AC3: 루트 링크가 다른 버전 스토어면 FAIL 을 유지하고 이유를 붙임(빌드 426, Select placeholder 클래스 누락)", async () => {
    const dir = await app("1.8.0");
    expect(await item(dir, UP)).toEqual(FAIL(OTHER("(1.8.0, 앱 1.8.1)")));
    // 이유는 그 상위 설치본을 덮는 glob 이 있을 때만 붙여요
    expect(await item(dir, undefined)).toEqual(FAIL());
    expect(await item(dir, LOCAL)).toEqual(PASS);
  });

  it("AC4: 루트 설치본이 없으면 ../../node_modules 는 종전대로 FAIL(이유 없음)", async () => {
    const dir = await app(undefined);
    expect(await item(dir, UP)).toEqual(FAIL());
  });
});

// WI-0081: dependencies 판정은 앱에 선언이 없으면 워크스페이스 루트(findWorkspaceRoot, .git 에서 중단) package.json 선언도 인정하고,
// 문구에 「워크스페이스 루트에 선언」을 붙여요. 안내 명령(→ …)은 워크스페이스 루트 lockfile 을 따라요. 워크스페이스가 아닌 상위의 선언은
// 여전히 「필수 의존성 누락」이에요(음성 대조). 브리프 측정: fx-npm d-rootonly · h-rootonly-ui · fx-pnpm · fx-pnpmhoisted d-rootonly 4행 rc 1.
describe("WI-0081: dependencies 의 워크스페이스 루트 선언 인정", () => {
  const TRIO = { tailwindcss: "^4.1.0", clsx: "^2.1.1", "tailwind-merge": "^3.4.0" };
  /** 루트(root) + apps/web(app). rootPkg 가 null 이면 루트 package.json 을 만들지 않음 */
  async function ws(rootPkg: Record<string, unknown> | null, appDeps: Record<string, string>, extra: Record<string, string> = {}, appRel = "apps/web") {
    const root = await tempDir();
    if (rootPkg) await fs.writeJSON(path.join(root, "package.json"), rootPkg);
    for (const [rel, content] of Object.entries(extra)) await fs.outputFile(path.join(root, rel), content);
    const app = path.join(root, appRel);
    await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: appDeps });
    return { root, app };
  }
  const deps = async (dir: string) => (await collectCheckResults(dir)).find((r) => r.name === "dependencies");
  const quiet = () => vi.spyOn(console, "log").mockImplementation(() => {});

  it("npm 워크스페이스: 루트에만 tailwindcss · clsx · tailwind-merge 선언 + 루트 설치본 → PASS(출처 표시), check fail 0(종전 rc 1)", async () => {
    const { root, app } = await ws({ name: "root", private: true, workspaces: ["apps/*"], devDependencies: TRIO }, {}, { "package-lock.json": "{}" });
    for (const name of Object.keys(TRIO)) await writeInstalledStub(root, name);
    expect(await deps(app)).toEqual({
      name: "dependencies",
      severity: "pass",
      message: "필수 및 권장 의존성이 선언 · 설치되어 있습니다 (3개 확인, 워크스페이스 루트에 선언: tailwindcss, clsx, tailwind-merge)",
    });
    // check 종료 코드(fail 0): d-rootonly 형 앱(Tailwind 4 · tokens 진입점 · componentsDir · cn)을 갖춰 다른 FAIL 이 없게 함
    await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/tokens": "^1.8.0" } });
    await fs.outputJSON(path.join(app, "axis.config.json"), { componentsDir: "components/ui" });
    await fs.outputFile(path.join(app, "lib/utils.ts"), "export function cn() {}\n");
    await fs.outputFile(path.join(app, "app/globals.css"), '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n');
    await writeInstalledStub(root, "tailwindcss", "4.3.3");
    await writeInstalledStub(root, "@axis-ds/tokens", "1.8.0");
    quiet();
    const summary = await runCheck(app);
    expect({ summary, fails: (await collectCheckResults(app)).filter((r) => r.severity === "fail") }).toMatchObject({ summary: { fail: 0 }, fails: [] });
  });

  it("yarn 워크스페이스: 미설치 WARN 의 안내 명령이 루트 yarn.lock 을 따름(종전 FAIL, 안내는 pnpm install)", async () => {
    const { app } = await ws(
      { name: "root", private: true, workspaces: ["apps/*"], devDependencies: { tailwindcss: "^4.1.0" } },
      { clsx: "^2.1.1", "tailwind-merge": "^3.4.0" },
      { "yarn.lock": "" }
    );
    expect(await deps(app)).toEqual({
      name: "dependencies",
      severity: "warn",
      message: "선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → yarn install (워크스페이스 루트에 선언: tailwindcss)",
    });
  });

  it("앱 선언이 있으면 앱 선언을 쓰고 출처 표시 없음(루트에도 선언돼 있어도 종전 문구)", async () => {
    const { root, app } = await ws({ name: "root", private: true, workspaces: ["apps/*"], devDependencies: TRIO }, TRIO, { "package-lock.json": "{}" });
    for (const name of Object.keys(TRIO)) await writeInstalledStub(root, name);
    expect(await deps(app)).toEqual({ name: "dependencies", severity: "pass", message: "필수 및 권장 의존성이 선언 · 설치되어 있습니다 (3개 확인)" });
  });

  it("음성 대조: 워크스페이스가 아닌 상위(workspaces 없음, fx-outside 변형)의 선언은 인정하지 않음 → FAIL 그대로", async () => {
    const { root, app } = await ws({ name: "unrelated", private: true, devDependencies: TRIO }, {}, { "package-lock.json": "{}" }, "sub/app");
    for (const name of Object.keys(TRIO)) await writeInstalledStub(root, name);
    expect(await deps(app)).toEqual({ name: "dependencies", severity: "fail", message: "필수 의존성 누락: tailwindcss" });
    quiet();
    expect((await runCheck(app)).fail).toBeGreaterThan(0);
  });

  it("음성 대조: 앱과 워크스페이스 루트 사이에 .git 이 있으면(fx-gitstop) 루트 선언을 인정하지 않음 → FAIL", async () => {
    const { root, app } = await ws({ name: "root", private: true, workspaces: ["repo/*"], devDependencies: TRIO }, {}, { "repo/.git/HEAD": "ref: refs/heads/main\n" }, "repo/app");
    for (const name of Object.keys(TRIO)) await writeInstalledStub(root, name);
    expect(await deps(app)).toEqual({ name: "dependencies", severity: "fail", message: "필수 의존성 누락: tailwindcss" });
  });

  it("음성 대조: 앱 · 워크스페이스 루트 어디에도 선언이 없으면 FAIL(설치본만 있어도 선언 기준)", async () => {
    const { root, app } = await ws({ name: "root", private: true, workspaces: ["apps/*"] }, {});
    await writeInstalledStub(root, "tailwindcss", "4.3.3");
    expect(await deps(app)).toEqual({ name: "dependencies", severity: "fail", message: "필수 의존성 누락: tailwindcss" });
  });

  // WI-0091(사용자 결정 Q1 · Q5 · Q8): 종전 기대는 「루트 선언 = 선언됨 = 설치됨」 PASS 였어요(Yarn 4.5.3 실측으로 앱 issuer 해석 FAIL ·
  // 빌드 rc 1 인 레이아웃). 이제 Plug'n'Play 는 루트 선언을 인정하지 않고 필수 FAIL 을 전용 문구로 내요.
  it("Plug'n'Play 워크스페이스: 루트에만 선언한 필수 · 권장은 인정하지 않고 전용 문구 FAIL(WI-0091, 종전 PASS)", async () => {
    const { app } = await ws({ name: "root", private: true, workspaces: ["apps/*"], devDependencies: TRIO }, {}, { "yarn.lock": "", ".pnp.cjs": "" });
    expect(await deps(app)).toEqual({
      name: "dependencies",
      severity: "fail",
      message: "필수 의존성 tailwindcss 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요",
    });
  });
});

// WI-0086: tailwind-core 의 의존성 선언 판정(Tailwind 버전 · 1.4.0 안내 · 버전 게이트 · Tailwind 4 컴포넌트 tailwind.css · content 대상 ·
// animation)을 공용 헬퍼 declaredDependency(앱 다음 워크스페이스 루트)로, 공개 함수 진입부의 기준 디렉터리를 실경로(resolveBaseDir)로.
// 브리프 측정(발행본 cli 1.7.1 · mcp 1.4.1, 실제 설치 픽스처 fx-npm · fx-pnpm · fx-pnpmhoisted)의 전이 표를 stub 설치본으로 고정합니다.
// npm = workspaces + 루트 node_modules 설치본, pnpm = pnpm-workspace + 루트 node_modules/<pkg> 가 .pnpm 스토어로 가는 링크.
describe("WI-0086: 루트 선언 인정 일관화 · 심링크 baseDir", () => {
  type Layout = "npm" | "pnpm";
  const UI_GLOB = "/@axis-ds/ui-react/dist/**/*.{js,mjs}";
  const UP = `../../node_modules${UI_GLOB}`;
  const LOCAL = `./node_modules${UI_GLOB}`;
  const TW3_ROOT = {
    tailwindcss: "^3.4.0",
    "@axis-ds/tokens": "^1.8.0",
    "@axis-ds/ui-react": "^1.8.0",
    "tailwindcss-animate": "^1.0.7",
    clsx: "^2.1.1",
    "tailwind-merge": "^2.6.0",
  };
  const TW3_INSTALLED = {
    tailwindcss: "3.4.19",
    "@axis-ds/tokens": "1.8.1",
    "@axis-ds/ui-react": "1.8.1",
    "tailwindcss-animate": "1.0.7",
    clsx: "2.1.1",
    "tailwind-merge": "2.6.0",
  };
  const tw3Config = (content: string[], plugins = '[require("tailwindcss-animate")]') =>
    `module.exports = { presets: [require("@axis-ds/tokens/tailwind")], content: ${JSON.stringify(content)}, plugins: ${plugins} };\n`;
  const quietLog = () => vi.spyOn(console, "log").mockImplementation(() => {});

  /** 레이아웃대로 설치본 하나를 둡니다(pnpm 은 .pnpm 스토어 + 링크) */
  async function install(dir: string, name: string, version: string, layout: Layout) {
    if (layout === "npm") return writeInstalledStub(dir, name, version);
    const store = path.join(dir, "node_modules", ".pnpm", `${name.replace("/", "+")}@${version}`, "node_modules", ...name.split("/"));
    await fs.outputJSON(path.join(store, "package.json"), { name, version });
    await fs.outputFile(path.join(store, "dist", "index.js"), "");
    const at = path.join(dir, "node_modules", ...name.split("/"));
    await fs.ensureDir(path.dirname(at));
    await fs.symlink(store, at, "dir");
  }

  /** 워크스페이스 루트(rootDeps 선언 · installed 설치) + apps/web(appDeps 선언, files) */
  async function ws86(opts: {
    layout?: Layout;
    rootDeps?: Record<string, string>;
    installed?: Record<string, string>;
    appDeps?: Record<string, string>;
    files?: Record<string, string>;
    workspaces?: boolean;
  }) {
    const layout = opts.layout ?? "npm";
    const root = await fs.realpath(await tempDir());
    const marker = opts.workspaces !== false && layout === "npm" ? { workspaces: ["apps/*"] } : {};
    await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, ...marker, devDependencies: opts.rootDeps ?? {} });
    if (opts.workspaces !== false && layout === "pnpm") await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n");
    await fs.writeFile(path.join(root, layout === "npm" ? "package-lock.json" : "pnpm-lock.yaml"), layout === "npm" ? "{}" : "");
    for (const [name, version] of Object.entries(opts.installed ?? {})) await install(root, name, version, layout);
    const app = path.join(root, "apps", "web");
    await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: opts.appDeps ?? {} });
    await fs.outputJSON(path.join(app, "axis.config.json"), {});
    await fs.outputFile(path.join(app, "app/globals.css"), '@import "@axis-ds/tokens/css";\n');
    for (const [rel, content] of Object.entries(opts.files ?? {})) await fs.outputFile(path.join(app, rel), content);
    return { root, app };
  }
  /** 앱 디렉터리 자체를 가리키는 링크(L1, 다른 디렉터리에 둠) */
  async function linkTo(app: string): Promise<string> {
    const links = await tempDir();
    const link = path.join(links, "web-link");
    await fs.symlink(app, link, "dir");
    return link;
  }
  const item = async (dir: string, name: string) => (await collectCheckResults(dir)).find((r) => r.name === name);
  const appPkg = async (app: string) => (await fs.readJSON(path.join(app, "package.json"))) as Record<string, unknown>;
  const CONTENT_FAIL = (suggest: string) => ({
    name: "tailwind.content",
    severity: "fail",
    message:
      `tailwind.config.js의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): @axis-ds/ui-react → "${suggest}"` +
      (suggest.startsWith("../") ? ` (${PARENT_NOTE})` : ""),
  });
  const CONTENT_PASS = { name: "tailwind.content", severity: "pass", message: "tailwind.config.js의 content 가 @axis-ds/ui-react 를 덮습니다" };
  const ANIM_PASS = { name: "animation", severity: "pass", message: "tailwind.config.js의 plugins 에 tailwindcss-animate 가 있습니다" };

  for (const layout of ["npm", "pnpm"] as const) {
    it(`AC1 ${layout}: 루트에만 ui-react 를 선언한 Tailwind 3 앱에 content 항목이 생김(./app 만이면 FAIL · 상위 제안, 덮으면 PASS, 종전에는 항목 없음)`, async () => {
      const none = await ws86({ layout, rootDeps: TW3_ROOT, installed: TW3_INSTALLED, files: { "tailwind.config.js": tw3Config(["./app/**/*.{ts,tsx}"]) } });
      expect(await item(none.app, "tailwind.content")).toEqual(CONTENT_FAIL(UP));
      quietLog();
      expect((await runCheck(none.app)).fail).toBe(1);
      const up = await ws86({ layout, rootDeps: TW3_ROOT, installed: TW3_INSTALLED, files: { "tailwind.config.js": tw3Config(["./app/**/*.{ts,tsx}", UP]) } });
      expect(await item(up.app, "tailwind.content")).toEqual(CONTENT_PASS);
      expect((await runCheck(up.app)).fail).toBe(0);
    });
  }

  it("AC2 animation: 루트에만 ui-react · tailwindcss-animate 를 선언 · 설치하고 plugins 에 있으면 PASS, 없으면 「plugins 에 없음」 WARN(「선언 없음」이 아님)", async () => {
    const ok = await ws86({ rootDeps: TW3_ROOT, installed: TW3_INSTALLED, files: { "tailwind.config.js": tw3Config(["./app/**/*.{ts,tsx}", UP]) } });
    expect(await item(ok.app, "animation")).toEqual(ANIM_PASS);
    const noPlugin = await ws86({ rootDeps: TW3_ROOT, installed: TW3_INSTALLED, files: { "tailwind.config.js": tw3Config(["./app/**/*.{ts,tsx}", UP], "[]") } });
    expect(await item(noPlugin.app, "animation")).toEqual({
      name: "animation",
      severity: "warn",
      message:
        '애니메이션 플러그인이 없습니다(@axis-ds/ui-react 선언, tailwind.config.js plugins 에 없음): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → tailwindcss-animate 설치 뒤 plugins 에 require("tailwindcss-animate")',
    });
  });

  it("AC2 Tailwind 4 설치 앱(루트 ui-react · tw-animate-css 선언, CSS import 없음): tailwind.config 에 컴포넌트 스캔 경로 WARN · animation WARN", async () => {
    const { app } = await ws86({
      rootDeps: { tailwindcss: "^4.1.0", "@axis-ds/tokens": "^1.8.0", "@axis-ds/ui-react": "^1.8.0", "tw-animate-css": "^1.2.0" },
      installed: { tailwindcss: "4.3.3", "@axis-ds/tokens": "1.8.1", "@axis-ds/ui-react": "1.8.1", "tw-animate-css": "1.4.0" },
      files: { "app/globals.css": '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n' },
    });
    expect(await item(app, "tailwind.config")).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message: 'Tailwind 4: app/globals.css에 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → @import "@axis-ds/ui-react/tailwind.css";',
    });
    expect(await item(app, "animation")).toEqual({
      name: "animation",
      severity: "warn",
      message:
        '애니메이션 플러그인이 없습니다(@axis-ds/ui-react 선언): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → tw-animate-css 설치 뒤 @import "tw-animate-css";',
    });
  });

  it("AC3 미설치 루트 선언: tailwindcss ^4.1.0 이면 Tailwind 4 분기(「tailwind.config 파일이 없습니다」 FAIL 이 아님), 1.4.0 안내 · preset 게이트도 루트 선언", async () => {
    const tw4 = await ws86({
      rootDeps: { tailwindcss: "^4.1.0", "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "^1.3.0" },
      files: { "app/globals.css": '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n@import "@axis-ds/ui-react/tailwind.css";\n' },
    });
    const pkg = await appPkg(tw4.app);
    expect(detectTailwind(tw4.app, pkg)).toEqual({ major: 4, source: "declared", value: "^4.1.0" });
    expect(axisPackagesBelowTailwind4(pkg, tw4.app)).toEqual([
      { name: "@axis-ds/tokens", range: "^1.3.0", status: "below", source: "declared" },
      { name: "@axis-ds/ui-react", range: "^1.3.0", status: "below", source: "declared" },
    ]);
    // baseDir 를 주지 않으면 종전대로 앱 선언만(루트를 볼 기준이 없음)
    expect(axisPackagesBelowTailwind4(pkg)).toEqual([]);
    const setup = await item(tw4.app, "tailwind.config");
    expect(setup?.severity).toBe("warn");
    expect(setup?.message).toContain("(1.4.0 이상 필요: @axis-ds/tokens ^1.3.0 · @axis-ds/ui-react ^1.3.0)");
    quietLog();
    expect((await runCheck(tw4.app)).fail).toBe(0);

    const tw3 = await ws86({
      rootDeps: { tailwindcss: "^3.4.0", "@axis-ds/tokens": "^1.6.0" },
      files: { "tailwind.config.js": 'module.exports = { presets: [require("@axis-ds/tokens/tailwind")], content: ["./app/**/*.{ts,tsx}"] };\n' },
    });
    expect((await item(tw3.app, "tailwind.config"))?.message).toContain("@axis-ds/tokens 선언 ^1.6.0 에서는 CommonJS 의 require");
  });

  it("brand-core theme 게이트(packageVersionGate): 루트에만 선언한 미설치 @axis-ds/theme 는 「선언」 근거(종전 「설치본 · 선언 없음」)", async () => {
    const { app } = await ws86({ rootDeps: { "@axis-ds/theme": "^1.5.0" } });
    expect(packageVersionGate(app, await appPkg(app), "@axis-ds/theme", "1.7.0")).toEqual({ status: "below", source: "declared", value: "^1.5.0" });
    // 설치본이 있으면 설치본 우선(전이 없음)
    const inst = await ws86({ rootDeps: { "@axis-ds/theme": "^1.5.0" }, installed: { "@axis-ds/theme": "1.8.1" } });
    expect(packageVersionGate(inst.app, await appPkg(inst.app), "@axis-ds/theme", "1.7.0")).toEqual({ status: "ok", source: "installed", value: "1.8.1" });
  });

  it("음성 대조: 앱 선언 앱은 종전 판정, 워크스페이스가 아닌 상위의 선언은 인정하지 않음(content · animation 항목 없음)", async () => {
    const appDecl = await ws86({
      rootDeps: TW3_ROOT,
      installed: TW3_INSTALLED,
      appDeps: { "@axis-ds/ui-react": "^1.8.0", "tailwindcss-animate": "^1.0.7" },
      files: { "tailwind.config.js": tw3Config(["./app/**/*.{ts,tsx}"]) },
    });
    expect(await item(appDecl.app, "tailwind.content")).toEqual(CONTENT_FAIL(UP));
    expect(await item(appDecl.app, "animation")).toEqual(ANIM_PASS);
    const outside = await ws86({ workspaces: false, rootDeps: TW3_ROOT, installed: TW3_INSTALLED, files: { "tailwind.config.js": tw3Config(["./app/**/*.{ts,tsx}"]) } });
    expect(await item(outside.app, "tailwind.content")).toBeUndefined();
    expect(await item(outside.app, "animation")).toBeUndefined();
  });

  for (const layout of ["npm", "pnpm"] as const) {
    it(`AC5 ${layout}: 앱 링크(L1)로 준 check 가 실경로와 같은 판정(루트 선언 · 앱 선언 · 절대 glob 행)`, async () => {
      const variants: Array<{ label: string; appDeps?: Record<string, string>; content: (root: string) => string[] }> = [
        { label: "g1-none", content: () => ["./app/**/*.{ts,tsx}"] },
        { label: "g1-up", content: () => ["./app/**/*.{ts,tsx}", UP] },
        { label: "c1-appdecl", appDeps: { "@axis-ds/ui-react": "^1.8.0", "tailwindcss-animate": "^1.0.7" }, content: () => ["./app/**/*.{ts,tsx}"] },
        // 반박 검토: 실경로 절대 glob 은 링크로 줄 때 판정 기준(baseDir)도 실경로여야 함(contentGlobCovers). 탐색만 실경로면 거짓 FAIL
        { label: "c1-abs", appDeps: { "@axis-ds/ui-react": "^1.8.0" }, content: (root) => ["./app/**/*.{ts,tsx}", `${root}/node_modules${UI_GLOB}`] },
      ];
      for (const v of variants) {
        const { root, app } = await ws86({ layout, rootDeps: TW3_ROOT, installed: TW3_INSTALLED, appDeps: v.appDeps });
        await fs.outputFile(path.join(app, "tailwind.config.js"), tw3Config(v.content(root.split(path.sep).join("/"))));
        const link = await linkTo(app);
        const real = await collectCheckResults(app);
        expect({ label: v.label, results: await collectCheckResults(link) }).toEqual({ label: v.label, results: real });
        if (v.label === "c1-abs") expect({ label: v.label, content: real.find((r) => r.name === "tailwind.content") }).toEqual({ label: v.label, content: CONTENT_PASS });
        if (v.label === "g1-none") expect({ label: v.label, content: real.find((r) => r.name === "tailwind.content") }).toEqual({ label: v.label, content: CONTENT_FAIL(UP) });
      }
    });
  }

  // WI-0086 검토 후속(minor): export 된 contentGlobCovers 를 링크 baseDir 로 직접 부를 때도 실경로 기준으로 판정(진입부 resolveBaseDir).
  // 내부 호출자(inspectTailwindContent)는 이미 실경로를 넘겨 위 AC5 행만으로는 이 줄을 지워도 빨개지지 않았음(동치 변이)
  it("contentGlobCovers 단위: 링크 baseDir 의 절대 glob 은 실경로 기준(상위로 나가는 표본 · 아직 없는 표본)", async () => {
    const root = await fs.realpath(await tempDir());
    const app = path.join(root, "apps", "web");
    await fs.outputFile(path.join(root, "node_modules", "@axis-ds", "ui-react", "dist", "index.js"), "");
    await fs.ensureDir(app);
    const link = await linkTo(app);
    const posix = (p: string) => p.split(path.sep).join("/");
    const upGlob = `${posix(root)}/node_modules/@axis-ds/ui-react/dist/**/*.js`;
    const upSample = "../../node_modules/@axis-ds/ui-react/dist/index.js";
    const localGlob = `${posix(app)}/components/**/*.tsx`;
    const localSample = "components/ui/button.tsx";
    expect([contentGlobCovers(upGlob, upSample, app), contentGlobCovers(localGlob, localSample, app)]).toEqual([true, true]);
    expect([contentGlobCovers(upGlob, upSample, link), contentGlobCovers(localGlob, localSample, link)]).toEqual([true, true]);
    // 음성 대조: 다른 위치를 가리키는 절대 glob 은 링크로 불러도 덮지 않음
    expect(contentGlobCovers(`${posix(root)}/other/**/*.js`, upSample, link)).toBe(false);
  });

  it("AC6 pnpm 기본(앱 node_modules/@axis-ds/ui-react 가 .pnpm 스토어 링크): 실경로 · 링크 모두 제안 ./node_modules/…(스토어 경로가 새지 않고 링크 기준 상대경로로 깨지지 않음)", async () => {
    const { root, app } = await ws86({
      layout: "pnpm",
      rootDeps: { tailwindcss: "^3.4.0", "@axis-ds/tokens": "^1.8.0" },
      installed: { tailwindcss: "3.4.19", "@axis-ds/tokens": "1.8.1" },
      appDeps: { "@axis-ds/ui-react": "^1.8.0" },
      files: { "tailwind.config.js": tw3Config(["./app/**/*.{ts,tsx}"]) },
    });
    const store = path.join(root, "node_modules", ".pnpm", "@axis-ds+ui-react@1.8.1", "node_modules", "@axis-ds", "ui-react");
    await fs.outputJSON(path.join(store, "package.json"), { name: "@axis-ds/ui-react", version: "1.8.1" });
    await fs.ensureDir(path.join(app, "node_modules", "@axis-ds"));
    await fs.symlink(store, path.join(app, "node_modules", "@axis-ds", "ui-react"), "dir");
    expect(await item(app, "tailwind.content")).toEqual(CONTENT_FAIL(LOCAL));
    expect(await item(await linkTo(app), "tailwind.content")).toEqual(CONTENT_FAIL(LOCAL));
  });

  it("ENOENT: 없는 경로는 종전처럼 resolve 기준(메시지 그대로)", async () => {
    const missing = path.join(await tempDir(), "no-such-dir");
    const results = await collectCheckResults(missing);
    expect(results.find((r) => r.name === "dependencies")).toEqual({ name: "dependencies", severity: "fail", message: "package.json 파일이 없습니다" });
  });
});

// WI-0091 · WI-0094 · WI-0092 (PR-A, 사용자 결정 Q1 ~ Q12 · Q19). 2026-10-27.
// - WI-0091: Yarn Plug'n'Play 에서 루트에만 선언한 패키지는 앱 issuer 가 해석하지 못해요(Yarn 4.5.3 실측 A · E · G: 빌드 rc 1 인데 check PASS).
//   check 경로에서만 앱 선언을 보고(Q1 · Q2), 필수 FAIL · 권장 WARN 을 전용 문구로(Q5), 버전 게이트는 「앱에서 해석되지 않음」 WARN(Q7).
//   isPnpProject 는 findWorkspaceRoot 처럼 .git 에서 멈춰요(Q3, refute-stray-1 실측: 상위 빈 .pnp.cjs 가 node-modules 프로젝트를 PnP 로 오인).
// - WI-0094: dependencies 의 @axis-ds/* 설치 확인 대상에 워크스페이스 루트 선언을 넣고, 루트 출처 미설치를 따로 알려요(Q11 · Q19).
// - WI-0092: Tailwind 4 animation 은 CSS 줄마다 그 패키지의 선언 + 설치본을 봐요(Q9), 줄은 있는데 미설치는 WARN(Q10).
describe("WI-0091 · 0094 · 0092: Plug'n'Play 루트 선언 · @axis-ds 루트 대상 · Tailwind 4 animation 설치본", () => {
  const PNP_NOTE = "워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다";
  const item = async (dir: string, name: string) => (await collectCheckResults(dir)).find((r) => r.name === name);
  const quietLog = () => vi.spyOn(console, "log").mockImplementation(() => {});

  /**
   * 실제 Yarn PnP 레이아웃(사용자 결정 Q8): 루트 package.json workspaces + yarn.lock + .yarnrc.yml(nodeLinker: pnp) + .pnp.cjs,
   * node_modules 없음. 루트 선언(rootDeps) · 앱 선언(appDeps) · 앱 파일(files). `.pnp.cjs` 는 Yarn 이 만든 파일의 머리 주석만 둬요
   * (판정은 파일 존재만 봄, 빈 표지와 같은 결과여야 해요).
   */
  async function pnpWs(opts: { rootDeps?: Record<string, string>; appDeps?: Record<string, string>; files?: Record<string, string>; config?: Record<string, unknown> }) {
    const root = await tempDir();
    await fs.writeJSON(path.join(root, "package.json"), {
      name: "root",
      private: true,
      packageManager: "yarn@4.5.3",
      workspaces: ["apps/*"],
      devDependencies: opts.rootDeps ?? {},
    });
    await fs.writeFile(path.join(root, "yarn.lock"), "__metadata:\n  version: 8\n");
    await fs.writeFile(path.join(root, ".yarnrc.yml"), "nodeLinker: pnp\n");
    await fs.writeFile(path.join(root, ".pnp.cjs"), '#!/usr/bin/env node\n/* eslint-disable */\n// @ts-nocheck\n"use strict";\n');
    const app = path.join(root, "apps", "web");
    await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: opts.appDeps ?? {} });
    await fs.outputJSON(path.join(app, "axis.config.json"), opts.config ?? {});
    for (const [rel, content] of Object.entries(opts.files ?? {})) await fs.outputFile(path.join(app, rel), content);
    return { root, app };
  }
  const TRIO3 = { tailwindcss: "^3.4.0", clsx: "^2.1.1", "tailwind-merge": "^2.6.0" };
  const BARE_CJS =
    'module.exports = { content: ["./app/**/*.{ts,tsx}"], presets: [require("@axis-ds/tokens/tailwind")], plugins: [require("tailwindcss-animate")] };\n';

  describe("WI-0091: Plug'n'Play 루트 선언(check 경로)", () => {
    it("A(TW3 루트 전용): dependencies 필수 FAIL 전용 문구 · tokens 게이트 WARN · animation 전용 사유, 앱 선언(B)은 PASS", async () => {
      const a = await pnpWs({
        rootDeps: { ...TRIO3, "@axis-ds/tokens": "^1.6.0", "@axis-ds/ui-react": "^1.8.0", "tailwindcss-animate": "^1.0.7" },
        files: { "tailwind.config.cjs": BARE_CJS },
      });
      expect(await item(a.app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "fail",
        message: `필수 의존성 tailwindcss 가 ${PNP_NOTE} → 앱 package.json 에 선언하세요`,
      });
      expect(await item(a.app, "tailwind.config")).toEqual({
        name: "tailwind.config",
        severity: "warn",
        message: `tailwind.config.cjs에 AXIS preset 참조가 있지만 @axis-ds/tokens 가 ${PNP_NOTE}(워크스페이스 루트 선언 ^1.6.0) → 앱 package.json 에 @axis-ds/tokens 1.7.0 이상을 선언하세요`,
      });
      // ui-react 사용 판정은 루트 선언을 계속 인정(Q7), 플러그인 선언은 앱만(Q1)
      // 추가 결정 A1: TW3 PnP 루트 전용 플러그인은 다른 PnP 문구와 같은 틀
      expect(await item(a.app, "animation")).toEqual({
        name: "animation",
        severity: "warn",
        message: `애니메이션 플러그인 tailwindcss-animate 가 ${PNP_NOTE}(@axis-ds/ui-react 선언): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → 앱 package.json 에 tailwindcss-animate 를 선언하세요`,
      });
      quietLog();
      expect((await runCheck(a.app)).fail).toBeGreaterThan(0);

      // 양성 대조 B: 같은 레이아웃에서 앱에 선언하면 PnP 선언 기준 PASS(설치본은 읽지 않음)
      const b = await pnpWs({
        appDeps: { ...TRIO3, "@axis-ds/tokens": "^1.7.0", "@axis-ds/ui-react": "^1.8.0", "tailwindcss-animate": "^1.0.7" },
        files: { "tailwind.config.cjs": BARE_CJS },
      });
      expect(await item(b.app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "pass",
        message: "필수 및 권장 의존성이 선언되어 있습니다 (Plug'n'Play 라 설치본은 확인하지 않음, 5개)",
      });
      expect(await item(b.app, "tailwind.config")).toMatchObject({ severity: "pass" });
      expect(await item(b.app, "animation")).toEqual({ name: "animation", severity: "pass", message: "tailwind.config.cjs의 plugins 에 tailwindcss-animate 가 있습니다" });
    });

    it("권장만 루트 전용이면 WARN 전용 문구(필수는 앱 선언), 루트 @axis-ds 는 대상에 넣지 않고 같은 전용 문구로 알림(Q1 · Q19 · A3)", async () => {
      const { app } = await pnpWs({
        rootDeps: { clsx: "^2.1.1", "tailwind-merge": "^2.6.0", "@axis-ds/ui-react": "^1.8.0" },
        appDeps: { tailwindcss: "^3.4.0" },
      });
      expect(await item(app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "warn",
        message: `권장 의존성 clsx, tailwind-merge 가 ${PNP_NOTE} → 앱 package.json 에 선언하세요 / @axis-ds/ui-react 가 ${PNP_NOTE} → 앱 package.json 에 선언하세요`,
      });
    });

    it("추가 결정 A3(M7): PnP 에서 @axis-ds/* 만 루트 전용이면 전용 문구 WARN(종전 PASS), 종료 코드 불변, 앱 · 루트 둘 다면 알리지 않음", async () => {
      const m7 = await pnpWs({
        rootDeps: { "@axis-ds/ui-react": "1.8.2" },
        appDeps: { ...TRIO3, "@axis-ds/tokens": "1.8.2", "@axis-ds/theme": "1.8.2" },
      });
      expect(await item(m7.app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "warn",
        message: `@axis-ds/ui-react 가 ${PNP_NOTE} → 앱 package.json 에 선언하세요`,
      });
      // 종료 코드 불변: dependencies 는 fail 이 아님(다른 항목의 fail 은 fixture 에 설정 파일이 없어서예요)
      expect((await collectCheckResults(m7.app)).filter((r) => r.name === "dependencies" && r.severity === "fail")).toEqual([]);

      // 양성 대조: 앱에도 선언하면 대상(앱 출처)이 되고 PnP 선언 기준 PASS
      const both = await pnpWs({
        rootDeps: { "@axis-ds/ui-react": "1.8.2" },
        appDeps: { ...TRIO3, "@axis-ds/tokens": "1.8.2", "@axis-ds/theme": "1.8.2", "@axis-ds/ui-react": "1.8.2" },
      });
      expect(await item(both.app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "pass",
        message: "필수 및 권장 의존성이 선언되어 있습니다 (Plug'n'Play 라 설치본은 확인하지 않음, 6개)",
      });
    });

    it("추가 결정 A1: TW3 PnP 루트 전용 플러그인이 plugins 에도 없으면 같은 틀에 사유 · require 안내를 덧붙임", async () => {
      const { app } = await pnpWs({
        rootDeps: { "tailwindcss-animate": "^1.0.7" },
        appDeps: { ...TRIO3, "@axis-ds/tokens": "^1.8.0", "@axis-ds/ui-react": "^1.8.0" },
        files: { "tailwind.config.cjs": 'module.exports = { content: ["./app/**/*.{ts,tsx}"], presets: [require("@axis-ds/tokens/tailwind")] };\n' },
      });
      expect(await item(app, "animation")).toEqual({
        name: "animation",
        severity: "warn",
        message: `애니메이션 플러그인 tailwindcss-animate 가 ${PNP_NOTE}(@axis-ds/ui-react 선언, tailwind.config.cjs plugins 에 없음): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → 앱 package.json 에 tailwindcss-animate 를 선언하세요 · plugins 에 require("tailwindcss-animate")`,
      });
    });

    it("G(TW4 루트 전용): Tailwind major 는 루트 선언으로 Tailwind 4 분기(Q6), 해석 불가는 dependencies 에서 FAIL", async () => {
      const g = await pnpWs({
        rootDeps: { tailwindcss: "^4.1.0", clsx: "^2.1.1", "tailwind-merge": "^3.4.0", "@axis-ds/tokens": "^1.8.0" },
        files: { "app/globals.css": '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n' },
      });
      expect(detectTailwind(g.app, await fs.readJSON(path.join(g.app, "package.json")))).toEqual({ major: 4, source: "declared", value: "^4.1.0" });
      expect(await item(g.app, "tailwind.config")).toMatchObject({ severity: "pass", message: expect.stringContaining("Tailwind 4") });
      expect(await item(g.app, "dependencies")).toMatchObject({ severity: "fail", message: expect.stringContaining(PNP_NOTE) });
    });

    it("theme 게이트: 마크업 data-brand + ThemeProvider 에 루트 전용 theme 는 「앱에서 해석되지 않음」 WARN, packageVersionGate 는 옵션일 때만 unresolved", async () => {
      const { app } = await pnpWs({
        rootDeps: { ...TRIO3, "@axis-ds/theme": "^1.7.0" },
        appDeps: TRIO3,
        config: { brand: "ontology" },
        files: { "app/layout.tsx": '<html data-brand="ontology"><ThemeProvider>{children}</ThemeProvider></html>' },
      });
      expect(await item(app, "brand.activation")).toEqual({
        name: "brand.activation",
        severity: "warn",
        message: `app/layout.tsx의 <html data-brand> 를 ThemeProvider 와 함께 쓰는데 @axis-ds/theme 가 ${PNP_NOTE}(워크스페이스 루트 선언 ^1.7.0) → 앱 package.json 에 @axis-ds/theme 1.7.0 이상을 선언하거나 setBrand("ontology")`,
      });
      const pkg = (await fs.readJSON(path.join(app, "package.json"))) as Record<string, unknown>;
      expect(packageVersionGate(app, pkg, "@axis-ds/theme", "1.7.0", { appOnlyInPnp: true })).toEqual({ status: "unresolved", source: "declared", value: "^1.7.0" });
      // 옵션 없는 호출(check 밖 호출지)은 종전대로 루트 선언을 인정(Q2)
      expect(packageVersionGate(app, pkg, "@axis-ds/theme", "1.7.0")).toEqual({ status: "ok", source: "declared", value: "^1.7.0" });
    });

    it("음성 대조: node-modules 워크스페이스(.pnp.cjs 없음)의 루트 선언 인정은 그대로", async () => {
      const root = await tempDir();
      await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], devDependencies: TRIO3 });
      await fs.writeFile(path.join(root, "yarn.lock"), "");
      for (const name of Object.keys(TRIO3)) await writeInstalledStub(root, name);
      const app = path.join(root, "apps", "web");
      await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true });
      expect(await item(app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "pass",
        message: "필수 및 권장 의존성이 선언 · 설치되어 있습니다 (3개 확인, 워크스페이스 루트에 선언: tailwindcss, clsx, tailwind-merge)",
      });
    });

    it("isPnpProject 는 .git 에서 멈춤: 저장소 밖 상위의 .pnp.cjs 는 PnP 가 아님(refute-stray-1), 같은 층 · 저장소 안은 PnP", async () => {
      const outer = await tempDir();
      await fs.writeFile(path.join(outer, ".pnp.cjs"), "");
      const repo = path.join(outer, "C");
      await fs.outputFile(path.join(repo, ".git", "HEAD"), "ref: refs/heads/main\n");
      await fs.outputJSON(path.join(repo, "package.json"), { name: "c", private: true, dependencies: TRIO3 });
      for (const name of Object.keys(TRIO3)) await writeInstalledStub(repo, name);
      expect(isPnpProject(repo)).toBe(false);
      expect(await item(repo, "dependencies")).toEqual({ name: "dependencies", severity: "pass", message: "필수 및 권장 의존성이 선언 · 설치되어 있습니다 (3개 확인)" });
      // 양성 대조: .git 이 없으면 종전처럼 상위 .pnp.cjs 를 따라 PnP
      const noGit = path.join(outer, "D");
      await fs.outputJSON(path.join(noGit, "package.json"), { name: "d", private: true, dependencies: TRIO3 });
      expect(isPnpProject(noGit)).toBe(true);
      // 같은 층에 .git 과 .pnp.cjs 가 함께 있으면(보통의 Yarn PnP 저장소 루트) PnP, 그 하위 앱도 PnP
      const pnpRepo = path.join(outer, "E");
      await fs.outputFile(path.join(pnpRepo, ".git", "HEAD"), "ref: refs/heads/main\n");
      await fs.writeFile(path.join(pnpRepo, ".pnp.cjs"), "");
      await fs.outputJSON(path.join(pnpRepo, "apps", "web", "package.json"), { name: "web" });
      expect(isPnpProject(pnpRepo)).toBe(true);
      expect(isPnpProject(path.join(pnpRepo, "apps", "web"))).toBe(true);
    });
  });

  describe("WI-0094: @axis-ds/* 설치 확인 대상에 워크스페이스 루트 선언", () => {
    /** npm 워크스페이스 루트(rootDeps · installed) + apps/web(필수 · 권장은 앱 선언 · 앱 설치본, appDeps · appLock) */
    async function npmWs(opts: {
      rootDeps: Record<string, string>;
      installed?: Record<string, string>;
      appDeps?: Record<string, string>;
      appLock?: string;
      workspaces?: boolean;
      gitBetween?: boolean;
    }) {
      const root = await tempDir();
      await fs.writeJSON(path.join(root, "package.json"), {
        name: "root",
        private: true,
        ...(opts.workspaces === false ? {} : { workspaces: ["apps/*"] }),
        devDependencies: opts.rootDeps,
      });
      await fs.writeFile(path.join(root, "package-lock.json"), "{}");
      for (const [name, version] of Object.entries(opts.installed ?? {})) await writeInstalledStub(root, name, version);
      const app = path.join(root, "apps", "web");
      if (opts.gitBetween) await fs.outputFile(path.join(root, "apps", ".git", "HEAD"), "ref: refs/heads/main\n");
      await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: { ...TRIO3, ...(opts.appDeps ?? {}) } });
      for (const name of Object.keys(TRIO3)) await writeInstalledStub(app, name);
      if (opts.appLock) await fs.writeFile(path.join(app, opts.appLock), "");
      return { root, app };
    }

    it("루트 전용 · 미설치 → WARN 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다」, 출처 표시에도 넣음(종전 PASS 「3개 확인」)", async () => {
      const { app } = await npmWs({ rootDeps: { "@axis-ds/ui-react": "^1.8.0", "@axis-ds/tokens": "^1.8.0" }, installed: { "@axis-ds/tokens": "1.8.2" } });
      expect(await item(app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "warn",
        message:
          "워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/ui-react → npm install (워크스페이스 루트에 선언: @axis-ds/ui-react, @axis-ds/tokens)",
      });
      // WARN 이라 종료 코드에 더해지지 않음(Q11: rc 불변)
      expect((await collectCheckResults(app)).filter((r) => r.name === "dependencies" && r.severity === "fail")).toEqual([]);
    });

    it("루트 전용 · 설치 → PASS, 대상 수만 늘어남(3 → 5)", async () => {
      const { app } = await npmWs({
        rootDeps: { "@axis-ds/ui-react": "^1.8.0", "@axis-ds/tokens": "^1.8.0" },
        installed: { "@axis-ds/ui-react": "1.8.2", "@axis-ds/tokens": "1.8.2" },
      });
      expect(await item(app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "pass",
        message: "필수 및 권장 의존성이 선언 · 설치되어 있습니다 (5개 확인, 워크스페이스 루트에 선언: @axis-ds/ui-react, @axis-ds/tokens)",
      });
    });

    it("앱 · 루트 둘 다 선언이면 앱 출처(종전 문구), 도구 패키지(@axis-ds/cli)도 이름 필터 없이 대상(Q19)", async () => {
      const both = await npmWs({ rootDeps: { "@axis-ds/ui-react": "^1.8.0" }, appDeps: { "@axis-ds/ui-react": "^1.8.0" } });
      expect(await item(both.app, "dependencies")).toEqual({
        name: "dependencies",
        severity: "warn",
        message: "선언됐지만 설치되지 않은 의존성: @axis-ds/ui-react → npm install",
      });
      const tool = await npmWs({ rootDeps: { "@axis-ds/cli": "^1.7.0" } });
      expect(await item(tool.app, "dependencies")).toMatchObject({
        severity: "warn",
        message: expect.stringContaining("워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/cli"),
      });
    });

    it("앱 lockfile(P2)이 있어도 루트 선언을 무시하지 않음(Q19, 필수 · 권장과 같은 규칙)", async () => {
      const { app } = await npmWs({ rootDeps: { "@axis-ds/ui-react": "^1.8.0" }, appLock: "package-lock.json" });
      expect(await item(app, "dependencies")).toMatchObject({
        severity: "warn",
        message: expect.stringContaining("워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/ui-react"),
      });
    });

    it("음성 대조: 워크스페이스가 아닌 상위(N1) · .git 너머 루트(N2)의 @axis-ds 선언은 대상이 아님", async () => {
      const n1 = await npmWs({ rootDeps: { "@axis-ds/ui-react": "^1.8.0" }, workspaces: false });
      const n2 = await npmWs({ rootDeps: { "@axis-ds/ui-react": "^1.8.0" }, gitBetween: true });
      for (const { app } of [n1, n2]) {
        expect(await item(app, "dependencies")).toEqual({ name: "dependencies", severity: "pass", message: "필수 및 권장 의존성이 선언 · 설치되어 있습니다 (3개 확인)" });
      }
    });
  });

  describe("WI-0092: Tailwind 4 animation 은 CSS 줄마다 그 패키지의 선언 + 설치본", () => {
    const TW4 = { tailwindcss: "^4.1.0", "@axis-ds/ui-react": "^1.8.0" };
    const IMPORT = '@import "tailwindcss";\n@import "tw-animate-css";\n';
    const PLUGIN = '@import "tailwindcss";\n@plugin "tailwindcss-animate";\n';
    const PASS = { name: "animation", severity: "pass", message: "app/globals.css에 애니메이션 플러그인이 있습니다" };
    async function single(css: string, deps: Record<string, string>, installed: Record<string, string> = {}) {
      const dir = await tempDir();
      await fs.writeJSON(path.join(dir, "package.json"), { name: "app", private: true, dependencies: { ...TW4, ...deps } });
      await fs.outputFile(path.join(dir, "app/globals.css"), css);
      await writeInstalledStub(dir, "tailwindcss", "4.1.14");
      for (const [name, version] of Object.entries(installed)) await writeInstalledStub(dir, name, version);
      return dir;
    }
    const warn = (reasons: string, pkgs: string) => ({
      name: "animation",
      severity: "warn",
      message: `app/globals.css의 애니메이션 플러그인을 쓸 수 없습니다(@axis-ds/ui-react 선언, ${reasons}): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않고 빌드가 실패할 수 있습니다 → ${pkgs} 를 package.json 에 선언 · 설치하세요`,
    });

    it("S1 선언 · 설치 → PASS, S2 선언 · 미설치 → WARN(종전 PASS, 실빌드 rc 1), S4 유령 설치(선언 없음) → WARN", async () => {
      expect(await item(await single(IMPORT, { "tw-animate-css": "^1.3.0" }, { "tw-animate-css": "1.4.0" }), "animation")).toEqual(PASS);
      expect(await item(await single(IMPORT, { "tw-animate-css": "^1.3.0" }), "animation")).toEqual(warn("tw-animate-css 미설치(선언만 있음)", "tw-animate-css"));
      expect(await item(await single(IMPORT, {}, { "tw-animate-css": "1.4.0" }), "animation")).toEqual(warn("tw-animate-css 선언 없음", "tw-animate-css"));
    });

    it("S9 다른 이름(tailwindcss-animate)만 설치돼 있어도 PASS 가 아님, @plugin 줄은 tailwindcss-animate 로 판정", async () => {
      expect(await item(await single(IMPORT, { "tailwindcss-animate": "^1.0.7" }, { "tailwindcss-animate": "1.0.7" }), "animation")).toEqual(
        warn("tw-animate-css 선언 없음", "tw-animate-css")
      );
      expect(await item(await single(PLUGIN, { "tailwindcss-animate": "^1.0.7" }, { "tailwindcss-animate": "1.0.7" }), "animation")).toEqual(PASS);
      expect(await item(await single(PLUGIN, { "tailwindcss-animate": "^1.0.7" }), "animation")).toEqual(
        warn("tailwindcss-animate 미설치(선언만 있음)", "tailwindcss-animate")
      );
    });

    it("두 줄이 다 있으면 줄마다 보고, 하나라도 미설치면 그 줄의 패키지만 안내", async () => {
      const css = '@import "tailwindcss";\n@import "tw-animate-css";\n@plugin "tailwindcss-animate";\n';
      const dir = await single(css, { "tw-animate-css": "^1.3.0", "tailwindcss-animate": "^1.0.7" }, { "tw-animate-css": "1.4.0" });
      expect(await item(dir, "animation")).toEqual(warn("tailwindcss-animate 미설치(선언만 있음)", "tailwindcss-animate"));
    });

    it("호이스팅 모노레포: 루트 선언 · 루트 설치본 → PASS, 줄 없음은 종전 WARN 그대로(AC6 대조군과 같은 문구)", async () => {
      const root = await tempDir();
      await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], devDependencies: { "tw-animate-css": "^1.3.0" } });
      await writeInstalledStub(root, "tw-animate-css", "1.4.0");
      await writeInstalledStub(root, "tailwindcss", "4.1.14");
      const app = path.join(root, "apps", "web");
      await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: TW4 });
      await fs.outputFile(path.join(app, "app/globals.css"), IMPORT);
      expect(await item(app, "animation")).toEqual(PASS);
      await fs.outputFile(path.join(app, "app/globals.css"), '@import "tailwindcss";\n');
      expect(await item(app, "animation")).toEqual({
        name: "animation",
        severity: "warn",
        message: '애니메이션 플러그인이 없습니다(@axis-ds/ui-react 선언): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → tw-animate-css 설치 뒤 @import "tw-animate-css";',
      });
    });

    it("Plug'n'Play: 앱 선언이면 PASS(설치본은 읽지 않음), 루트에만 선언이면 전용 사유 WARN(Q9 의 PnP 는 Q1 규칙)", async () => {
      const ok = await pnpWs({ appDeps: { ...TW4, "tw-animate-css": "^1.3.0" }, files: { "app/globals.css": IMPORT } });
      expect(await item(ok.app, "animation")).toEqual(PASS);
      const rootOnly = await pnpWs({ rootDeps: { "tw-animate-css": "^1.3.0" }, appDeps: TW4, files: { "app/globals.css": IMPORT } });
      expect(await item(rootOnly.app, "animation")).toEqual(warn(`tw-animate-css 가 ${PNP_NOTE}`, "tw-animate-css"));
    });

    it("WARN 이라 종료 코드는 바뀌지 않음(Q10): 줄은 있는데 미설치여도 animation 항목은 fail 이 아님", async () => {
      const dir = await single(IMPORT, { "tw-animate-css": "^1.3.0" });
      const results = await collectCheckResults(dir);
      expect(results.find((r) => r.name === "animation")?.severity).toBe("warn");
      expect(results.filter((r) => r.name === "animation" && r.severity === "fail")).toEqual([]);
    });
  });
});
