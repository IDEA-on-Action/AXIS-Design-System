import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { formatCheckProjectResult, handleCheckProject } from "./template.js";

// brand 검사(WI-0028 P4)를 더하기 전의 axis.check_project 결과를 고정합니다.
// P4 에서 brand 가 없는 프로젝트의 결과 개수 · 이름 · severity · 문구가 그대로인지 이 기대값으로 봅니다(T4-4).

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "axis-mcp-check-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("handleCheckProject (brand 검사 추가 전 기준선)", () => {
  it("빈 디렉터리: 5항목, 이름 · severity · 문구 고정", async () => {
    const { results } = await handleCheckProject({ targetDir: tmp });
    expect(results).toEqual([
      {
        name: "axis.config.json",
        severity: "fail",
        message: "axis.config.json 파일이 없습니다 → 'axis init'을 실행하세요",
      },
      { name: "tailwind.config", severity: "fail", message: "tailwind.config 파일이 없습니다" },
      { name: "globals.css", severity: "fail", message: "globals.css 파일을 찾을 수 없습니다" },
      {
        name: "utils.ts",
        severity: "warn",
        message: "utils.ts를 찾을 수 없습니다 (컴포넌트 사용 시 필요)",
      },
      { name: "dependencies", severity: "fail", message: "package.json 파일이 없습니다" },
    ]);
  });

  it("brand 없는 axis.config.json 이 있어도 5항목", async () => {
    await fs.writeJSON(path.join(tmp, "axis.config.json"), { globalCss: "./globals.css" });
    await fs.writeFile(path.join(tmp, "globals.css"), ":root { --background: 0; --primary: 0; }\n");
    const { results } = await handleCheckProject({ targetDir: tmp });
    expect(results.map((r) => r.name)).toEqual([
      "axis.config.json",
      "tailwind.config",
      "globals.css",
      "utils.ts",
      "dependencies",
    ]);
    expect(results[0].severity).toBe("pass");
    expect(results[2]).toEqual({
      name: "globals.css",
      severity: "pass",
      message: "globals.css에 AXIS CSS 변수가 정의되어 있습니다",
    });
  });
});

// WI-0028 P4 (T4-4): brand 검사. CLI `axis check` 의 T4-3 과 같은 severity · 문구를 냅니다
// (packages/axis-cli/src/template/template-check.test.ts 의 기대 문구와 같은 문자열).

/** 기존 5항목이 모두 pass 인 프로젝트 */
async function writeAllPassProject(dir: string, config: Record<string, unknown>, css: string) {
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

const BASE_CSS = ":root{--background:0;--primary:0;}\n";

describe("handleCheckProject brand 검사 (T4-4)", () => {
  it("brand 없는 config · config 없음 · config 파손에서 결과 5항목 그대로", async () => {
    await writeAllPassProject(tmp, { globalCss: "./app/globals.css" }, `@import "@axis-ds/tokens/css/brands/sample";\n${BASE_CSS}`);
    expect((await handleCheckProject({ targetDir: tmp })).results).toHaveLength(5);
    await fs.writeFile(path.join(tmp, "axis.config.json"), '{ "brand": "sample", ');
    const broken = await handleCheckProject({ targetDir: tmp });
    expect(broken.results).toHaveLength(5);
    expect(broken.results[0].severity).toBe("pass");
    await fs.remove(path.join(tmp, "axis.config.json"));
    expect((await handleCheckProject({ targetDir: tmp })).results).toHaveLength(5);
  });

  it("일치 → pass, summary warn 0 (음성 대조군)", async () => {
    await writeAllPassProject(
      tmp,
      { globalCss: "./app/globals.css", brand: "sample" },
      `@import "@axis-ds/tokens/css/brands/sample";\n${BASE_CSS}`
    );
    const { results, summary } = await handleCheckProject({ targetDir: tmp });
    expect(results).toHaveLength(6);
    expect(results[5]).toEqual({
      name: "brand",
      severity: "pass",
      message: 'brand "sample" import 가 app/globals.css에 있습니다',
    });
    expect(summary).toEqual({ pass: 6, warn: 0, fail: 0 });
  });

  it("import 없음 → warn", async () => {
    await writeAllPassProject(tmp, { globalCss: "./app/globals.css", brand: "sample" }, BASE_CSS);
    const { results, summary } = await handleCheckProject({ targetDir: tmp });
    expect(results[5]).toEqual({
      name: "brand",
      severity: "warn",
      message: "brand \"sample\" import 가 app/globals.css에 없습니다 → 'axis theme add sample'",
    });
    expect(summary.warn).toBe(1);
  });

  it("다른 브랜드만 import → warn", async () => {
    await writeAllPassProject(
      tmp,
      { globalCss: "./app/globals.css", brand: "sample" },
      '@import "@axis-ds/tokens/css/brands/ontology";\n@import url("@axis-ds/tokens/css/brands/other");\n'
    );
    expect((await handleCheckProject({ targetDir: tmp })).results[5]).toEqual({
      name: "brand",
      severity: "warn",
      message: 'brand "sample" 와 import(ontology, other)가 다릅니다',
    });
  });

  it("CSS 없음 → warn, globalCss 없음 표기", async () => {
    await fs.writeJSON(path.join(tmp, "axis.config.json"), { globalCss: "./src/app/globals.css", brand: "sample" });
    const { results } = await handleCheckProject({ targetDir: tmp });
    expect(results).toHaveLength(6);
    expect(results[5]).toEqual({
      name: "brand",
      severity: "warn",
      message: 'brand "sample" 가 설정됐지만 CSS 파일을 찾지 못했습니다 (globalCss ./src/app/globals.css 없음)',
    });
  });

  it("globalCss 가 없는 파일을 가리키면 app/globals.css 를 검사 (axis init -y config, theme add 뒤 모양)", async () => {
    await writeAllPassProject(
      tmp,
      { globalCss: "./src/app/globals.css", brand: "sample" },
      `@import "@axis-ds/tokens/css/brands/sample";\n${BASE_CSS}`
    );
    expect((await handleCheckProject({ targetDir: tmp })).results[5]).toEqual({
      name: "brand",
      severity: "pass",
      message: 'brand "sample" import 가 app/globals.css에 있습니다 (globalCss ./src/app/globals.css 없음)',
    });
  });

  it("formatCheckProjectResult 에 brand 줄이 나옴", async () => {
    await writeAllPassProject(tmp, { globalCss: "./app/globals.css", brand: "sample" }, BASE_CSS);
    const text = formatCheckProjectResult(await handleCheckProject({ targetDir: tmp }));
    expect(text).toContain("brand \"sample\" import 가 app/globals.css에 없습니다");
  });
});

// WI-0042: Tailwind 4 프로젝트의 tailwind.config 항목(CLI 와 같은 코어)
describe("handleCheckProject Tailwind 구성 (WI-0042)", () => {
  const item = async () => (await handleCheckProject({ targetDir: tmp })).results.find((r) => r.name === "tailwind.config");

  it("Tailwind 4 + @import \"tailwindcss\" → pass, 설정 파일 없음 fail 이 나지 않음", async () => {
    await fs.writeJSON(path.join(tmp, "package.json"), { dependencies: { tailwindcss: "^4" } });
    await fs.ensureDir(path.join(tmp, "src/app"));
    await fs.writeFile(path.join(tmp, "src/app/globals.css"), '@import "tailwindcss";');
    expect(await item()).toEqual({
      name: "tailwind.config",
      severity: "pass",
      message: 'Tailwind 4: src/app/globals.css에 @import "tailwindcss" 가 있습니다',
    });
  });

  it("Tailwind 3 + tailwind.config.mjs → warn(TypeScript 권장)", async () => {
    await fs.writeJSON(path.join(tmp, "package.json"), { dependencies: { tailwindcss: "^3.4.0" } });
    await fs.writeFile(path.join(tmp, "tailwind.config.mjs"), "export default {}");
    expect(await item()).toEqual({ name: "tailwind.config", severity: "warn", message: "tailwind.config.mjs 존재 (TypeScript 권장)" });
  });
});
