import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { collectCheckResults, runCheck } from "./template-check.js";
import { applyThemeAdd, planThemeAdd } from "../theme/theme-add.js";
import { makeProject } from "../theme/test-helpers.js";
import type { CheckResult } from "./types.js";

// WI-0028 P4 (FR-5, AC4): axis check 의 brand 검사

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASELINE_FILE = path.resolve(HERE, "../../test/fixtures/check/run-check-baseline.json");

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
