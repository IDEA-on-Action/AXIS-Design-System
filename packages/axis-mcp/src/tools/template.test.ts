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
    // WI-0070: 자체 --background · --primary 만 있으면 AXIS 근거가 없어 WARN(종전 pass 는 거짓 초록). CLI 와 같은 문구
    expect(results[2]).toEqual({
      name: "globals.css",
      severity: "warn",
      message: "globals.css에 자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다 → @axis-ds/tokens CSS 를 import 하세요",
    });
  });
});

// WI-0028 P4 (T4-4): brand 검사. CLI `axis check` 의 T4-3 과 같은 severity · 문구를 냅니다
// (packages/axis-cli/src/template/template-check.test.ts 의 기대 문구와 같은 문자열).

/** node_modules/<name>/package.json 설치본 stub(WI-0051: dependencies 항목이 설치본을 봄) */
async function writeInstalledStub(dir: string, name: string, version = "1.0.0") {
  await fs.outputJSON(path.join(dir, "node_modules", ...name.split("/"), "package.json"), { name, version });
}

/** 기존 5항목이 모두 pass 이던 프로젝트(WI-0051 부터 설치본 stub 도 씀) */
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
  for (const name of ["tailwindcss", "clsx", "tailwind-merge"]) await writeInstalledStub(dir, name);
}

/** 자체 변수만(WI-0070 부터 globals.css WARN) */
const BASE_CSS = ":root{--background:0;--primary:0;}\n";
/** AXIS 근거(tokens CSS import)가 있는 CSS */
const AXIS_CSS = `@import "@axis-ds/tokens/css";\n${BASE_CSS}`;

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
      `@import "@axis-ds/tokens/css/brands/sample";\n${AXIS_CSS}`
    );
    // WI-0065 D8: preset 과 브랜드를 켜는 코드가 있어야 warn 0(brand 가 있으면 brand.activation 항목이 더해져 7항목)
    await fs.writeFile(path.join(tmp, "tailwind.config.ts"), 'import axis from "@axis-ds/tokens/tailwind";\nhsl(var(--x))');
    await fs.writeFile(path.join(tmp, "app/layout.tsx"), '<html lang="ko" data-brand="sample">');
    const { results, summary } = await handleCheckProject({ targetDir: tmp });
    expect(results).toHaveLength(7);
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
    expect(summary).toEqual({ pass: 7, warn: 0, fail: 0 });
  });

  it("import 없음 → warn", async () => {
    await writeAllPassProject(tmp, { globalCss: "./app/globals.css", brand: "sample" }, BASE_CSS);
    const { results, summary } = await handleCheckProject({ targetDir: tmp });
    expect(results[5]).toEqual({
      name: "brand",
      severity: "warn",
      message: "brand \"sample\" import 가 app/globals.css에 없습니다 → 'axis theme add sample'",
    });
    // tailwind.config(자체 hsl 매핑만, preset 없음) · brand · brand.activation(레이아웃 없음) 3개(WI-0065 D8) + globals.css(자체 변수만, WI-0070)
    expect(results.filter((r) => r.severity === "warn").map((r) => r.name)).toEqual(["tailwind.config", "globals.css", "brand", "brand.activation"]);
    expect(summary.warn).toBe(4);
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
    expect(results).toHaveLength(7);
    expect(results[5]).toEqual({
      name: "brand",
      severity: "warn",
      message: 'brand "sample" 가 설정됐지만 CSS 파일을 찾지 못했습니다 (globalCss ./src/app/globals.css 없음)',
    });
    expect(results[6]).toMatchObject({ name: "brand.activation", severity: "warn" });
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

  /** Tailwind 4 프로젝트에 src/app/globals.css 를 씁니다. */
  async function tailwind4Css(css: string) {
    await fs.writeJSON(path.join(tmp, "package.json"), { dependencies: { tailwindcss: "^4" } });
    await fs.ensureDir(path.join(tmp, "src/app"));
    await fs.writeFile(path.join(tmp, "src/app/globals.css"), css);
  }

  it("Tailwind 4 + @import \"tailwindcss\" · 토큰 진입점 → pass, 설정 파일 없음 fail 이 나지 않음 (WI-0044)", async () => {
    await tailwind4Css('@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n');
    expect(await item()).toEqual({
      name: "tailwind.config",
      severity: "pass",
      message: 'Tailwind 4: src/app/globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다',
    });
  });

  it("Tailwind 4 + @import \"tailwindcss\" 만 있으면 CLI 와 같은 warn 문구 (WI-0044 FR-4)", async () => {
    await tailwind4Css('@import "tailwindcss";\n');
    expect(await item()).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message: 'Tailwind 4: src/app/globals.css에 AXIS 토큰 진입점이 없습니다 → @import "@axis-ds/tokens/css/tailwind4";',
    });
    const text = formatCheckProjectResult(await handleCheckProject({ targetDir: tmp }));
    expect(text).toContain('AXIS 토큰 진입점이 없습니다 → @import "@axis-ds/tokens/css/tailwind4";');
  });

  it("토큰 진입점이 블록 주석 안에만 있으면 warn (WI-0044 FR-4)", async () => {
    await tailwind4Css('@import "tailwindcss";\n/* @import "@axis-ds/tokens/css/tailwind4"; */\n');
    expect(await item()).toMatchObject({ severity: "warn", message: expect.stringContaining("AXIS 토큰 진입점이 없습니다") });
  });

  it("Tailwind 3 + tailwind.config.mjs(preset 없음) → warn (WI-0065 D8, CLI 와 같은 문구)", async () => {
    await fs.writeJSON(path.join(tmp, "package.json"), { dependencies: { tailwindcss: "^3.4.0" } });
    await fs.writeFile(path.join(tmp, "tailwind.config.mjs"), "export default {}");
    expect(await item()).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message: "tailwind.config.mjs에 AXIS preset(@axis-ds/tokens/tailwind)이 없습니다 (presets 에 넣으세요)",
    });
  });

  it("WI-0065 D8: content FAIL · animation WARN 을 CLI 와 같은 코어 · 순서로 냄", async () => {
    await fs.writeJSON(path.join(tmp, "package.json"), {
      dependencies: { "@axis-ds/ui-react": "^1.6.0" },
      devDependencies: { tailwindcss: "^3.4.17" },
    });
    await fs.writeJSON(path.join(tmp, "axis.config.json"), { componentsDir: "./src/components/ui" });
    await fs.writeFile(path.join(tmp, "tailwind.config.ts"), 'export default { content: ["./app/**/*.{ts,tsx}"] };');
    const { results, summary } = await handleCheckProject({ targetDir: tmp });
    expect(results.slice(5).map((r) => [r.name, r.severity])).toEqual([
      ["tailwind.content", "fail"],
      ["animation", "warn"],
    ]);
    expect(summary.fail).toBeGreaterThanOrEqual(1);
  });
});

// WI-0044 보정: globals.css 의 tokens CSS import 인정 · 진입점 WARN 의 1.4.0 안내(CLI template-check.test.ts 와 같은 문구)
describe("handleCheckProject globals.css · 버전 안내 (WI-0044 보정)", () => {
  async function write(css: string, deps: Record<string, string>) {
    await fs.writeJSON(path.join(tmp, "package.json"), { dependencies: deps });
    await fs.ensureDir(path.join(tmp, "src/app"));
    await fs.writeFile(path.join(tmp, "src/app/globals.css"), css);
  }
  const find = async (name: string) => (await handleCheckProject({ targetDir: tmp })).results.find((r) => r.name === name);

  it("토큰 진입점 import 만 있으면 globals.css pass, 문구에 import 경로", async () => {
    await write('@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n', { tailwindcss: "^4" });
    expect(await find("globals.css")).toEqual({
      name: "globals.css",
      severity: "pass",
      message: "src/app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css/tailwind4 import)",
    });
  });

  it("css/shadcn 작은따옴표 · layer() 도 pass", async () => {
    await write("@import 'tailwindcss';\n@import url('@axis-ds/tokens/css/shadcn') layer(base);\n", { tailwindcss: "^4" });
    expect(await find("globals.css")).toMatchObject({
      severity: "pass",
      message: "src/app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css/shadcn import)",
    });
  });

  it("주석 안에만 있으면 종전 warn, 변수 직접 정의만은 WARN(WI-0070), --axis-* 정의는 pass", async () => {
    await write('/* @import "@axis-ds/tokens/css"; */', { tailwindcss: "^4" });
    expect(await find("globals.css")).toEqual({
      name: "globals.css",
      severity: "warn",
      message: "src/app/globals.css에 AXIS CSS 변수가 없습니다",
    });
    await write(":root{--background:0 0% 100%;--primary:0 0% 0%;}", { tailwindcss: "^3.4.0" });
    expect(await find("globals.css")).toMatchObject({
      severity: "warn",
      message: "src/app/globals.css에 자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다 → @axis-ds/tokens CSS 를 import 하세요",
    });
    await write(":root{--axis-color-primary:#000;}", { tailwindcss: "^3.4.0" });
    expect(await find("globals.css")).toMatchObject({ severity: "pass", message: "src/app/globals.css에 AXIS CSS 변수(--axis-*)가 정의되어 있습니다" });
  });

  it("진입점 WARN: tokens ^1.3.0 이면 1.4.0 이상 필요, ^1.4.0 이면 없음", async () => {
    const WARN =
      'Tailwind 4: src/app/globals.css에 AXIS 토큰 진입점이 없습니다 → @import "@axis-ds/tokens/css/tailwind4";';
    await write('@import "tailwindcss";', { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0" });
    expect((await find("tailwind.config"))?.message).toBe(`${WARN} (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)`);
    await write('@import "tailwindcss";', { tailwindcss: "^4", "@axis-ds/tokens": "^1.4.0" });
    expect((await find("tailwind.config"))?.message).toBe(WARN);
  });
});

// 보정 2차(2026-10-20 사용자 결정): CLI template-check.test.ts 「WI-0044 보정 2차」와 같은 문구(공유 코어 사본)
describe("handleCheckProject 보정 2차: A1 · A4 · B1 · B2 · B3 · C (CLI 와 같은 문구)", () => {
  const TW = '@import "tailwindcss";';
  const ENTRY = '@import "@axis-ds/tokens/css/tailwind4";';
  const UI = '@import "@axis-ds/ui-react/tailwind.css";';
  const AG = '@import "@axis-ds/agentic-ui/tailwind.css";';
  async function write(files: Record<string, string>, deps: Record<string, string>) {
    await fs.writeJSON(path.join(tmp, "package.json"), { dependencies: deps });
    for (const [rel, content] of Object.entries(files)) await fs.outputFile(path.join(tmp, rel), content);
  }
  const item = async () => (await handleCheckProject({ targetDir: tmp })).results.find((r) => r.name === "tailwind.config");

  it("A1: 판정 불가는 확인 문구, workspace: 는 안내 없음", async () => {
    await write({ "globals.css": TW }, { tailwindcss: "^4", "@axis-ds/tokens": "catalog:" });
    expect((await item())?.message).toBe(
      `Tailwind 4: globals.css에 AXIS 토큰 진입점이 없습니다 → ${ENTRY} (설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/tokens catalog:)`
    );
    await write({ "globals.css": TW }, { tailwindcss: "^4", "@axis-ds/tokens": "workspace:*" });
    expect((await item())?.message).toBe(`Tailwind 4: globals.css에 AXIS 토큰 진입점이 없습니다 → ${ENTRY}`);
  });

  it("A4: 진입점이 있어도 tokens ^1.3.0 이면 warn", async () => {
    await write({ "globals.css": `${TW}\n${ENTRY}` }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0" });
    expect(await item()).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message:
        "Tailwind 4: globals.css에 AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)",
    });
  });

  it("B1: 선언된 ui-react · agentic-ui 의 tailwind.css 가 없으면 warn, 선언이 없으면 pass", async () => {
    await write({ "globals.css": `${TW}\n${ENTRY}` }, { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0", "@axis-ds/agentic-ui": "^1.4.0" });
    expect((await item())?.message).toBe(`Tailwind 4: globals.css에 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${UI} ${AG}`);
    await write({ "globals.css": `${TW}\n${ENTRY}` }, { tailwindcss: "^4" });
    expect((await item())?.severity).toBe("pass");
  });

  it("B2: create-next-app 기본 정의가 남으면 warn", async () => {
    await write(
      {
        "app/globals.css": `${TW}\n${ENTRY}\n:root { --background: #ffffff; }\n@theme inline { --color-background: var(--background); --font-mono: var(--font-geist-mono); }\nbody { background: var(--background); }`,
      },
      { tailwindcss: "^4" }
    );
    expect((await item())?.message).toBe(
      "Tailwind 4: app/globals.css에 create-next-app 기본 정의가 남아 있습니다(:root 색값 --background · @theme --color-background: var(--background) · @theme --font-mono: var(--font-geist-mono) · body background: var(--background)) → 지우세요"
    );
  });

  it("B3: Tailwind 3 tailwind.config.mjs 의 preset 참조 → pass", async () => {
    await write({ "tailwind.config.mjs": "import axis from '@axis-ds/tokens/tailwind';\nexport default { presets: [axis] };" }, { tailwindcss: "^3.4.0" });
    expect(await item()).toEqual({
      name: "tailwind.config",
      severity: "pass",
      message: "tailwind.config.mjs에 AXIS 토큰이 설정되어 있습니다 (@axis-ds/tokens/tailwind preset)",
    });
  });

  it("C: 여러 문제는 우선순위 순서로 ' / ' 로 잇고 버전 안내는 끝에 한 번", async () => {
    await write({ "globals.css": TW }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "^1.3.0" });
    expect((await item())?.message).toBe(
      `Tailwind 4: globals.css에 AXIS 토큰 진입점이 없습니다 → ${ENTRY} / 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${UI} (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0 · @axis-ds/ui-react ^1.3.0)`
    );
  });
});

// 보정 3차(2026-10-20 사용자 결정): CLI template-check.test.ts 「WI-0044 보정 3차」와 같은 문구(공유 코어 사본)
describe("handleCheckProject 보정 3차: B2 라벨 · 설치본 우선 · 컴포넌트 버전 · 직접 @source (CLI 와 같은 문구)", () => {
  const TW = '@import "tailwindcss";';
  const ENTRY = '@import "@axis-ds/tokens/css/tailwind4";';
  const UI = '@import "@axis-ds/ui-react/tailwind.css";';
  const PASS4 = 'Tailwind 4: globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다';
  async function write(files: Record<string, string>, deps: Record<string, string>, installed: Record<string, string> = {}) {
    await fs.remove(path.join(tmp, "node_modules"));
    await fs.writeJSON(path.join(tmp, "package.json"), { dependencies: deps });
    for (const [rel, content] of Object.entries(files)) await fs.outputFile(path.join(tmp, rel), content);
    for (const [name, version] of Object.entries(installed)) {
      await fs.outputJSON(path.join(tmp, "node_modules", name, "package.json"), { name, version });
    }
  }
  const item = async () => (await handleCheckProject({ targetDir: tmp })).results.find((r) => r.name === "tailwind.config");

  it("B2: --font-sans 만 남으면 그 이름만 표시", async () => {
    await write({ "globals.css": `${TW}\n${ENTRY}\n@theme inline { --font-sans: var(--font-geist-sans); }` }, { tailwindcss: "^4" });
    expect((await item())?.message).toBe(
      "Tailwind 4: globals.css에 create-next-app 기본 정의가 남아 있습니다(@theme --font-sans: var(--font-geist-sans)) → 지우세요"
    );
  });

  it("설치본 우선: 설치본 1.4.2 + 선언 ^1.3.0 → pass, 설치본 1.3.0 + 선언 ^1.4.0 → 설치본 버전 안내", async () => {
    await write({ "globals.css": `${TW}\n${ENTRY}` }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.3.0" }, { "@axis-ds/tokens": "1.4.2" });
    expect(await item()).toEqual({ name: "tailwind.config", severity: "pass", message: PASS4 });
    await write({ "globals.css": `${TW}\n${ENTRY}` }, { tailwindcss: "^4", "@axis-ds/tokens": "^1.4.0" }, { "@axis-ds/tokens": "1.3.0" });
    expect((await item())?.message).toBe(
      "Tailwind 4: globals.css에 AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/tokens 설치본 1.3.0)"
    );
  });

  it("ui-react tailwind.css import + ui-react 1.3.0 → warn", async () => {
    await write({ "globals.css": `${TW}\n${ENTRY}\n${UI}` }, { tailwindcss: "^4", "@axis-ds/ui-react": "1.3.0" });
    expect((await item())?.message).toBe(
      "Tailwind 4: globals.css에 @axis-ds/ui-react/tailwind.css import 가 있지만 @axis-ds/ui-react 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/ui-react 1.3.0)"
    );
  });

  it("직접 @source 가 ui-react 를 가리키면 B1 없음, 주석 안이면 B1", async () => {
    await write({ "globals.css": `${TW}\n${ENTRY}\n@source '../node_modules/@axis-ds/ui-react/dist';` }, { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0" });
    expect(await item()).toEqual({ name: "tailwind.config", severity: "pass", message: PASS4 });
    await write({ "globals.css": `${TW}\n${ENTRY}\n/* @source "../node_modules/@axis-ds/ui-react"; */` }, { tailwindcss: "^4", "@axis-ds/ui-react": "^1.4.0" });
    expect((await item())?.message).toBe(`Tailwind 4: globals.css에 컴포넌트 스캔 경로(tailwind.css)가 없습니다 → ${UI}`);
  });
});

// 배치 3 묶음 ①: CLI template-check.test.ts 「배치 3 ①」 과 같은 판정 · 문구(공유 코어 · brand-core 사본)
describe("handleCheckProject 배치 3 ①: WI-0051 · WI-0068 · WI-0072 · WI-0070 (CLI 와 같은 문구)", () => {
  async function project(files: Record<string, string>, pkg: Record<string, unknown> | null, config: Record<string, unknown> | null = {}) {
    if (pkg) await fs.writeJSON(path.join(tmp, "package.json"), pkg);
    if (config) await fs.writeJSON(path.join(tmp, "axis.config.json"), config);
    for (const [rel, content] of Object.entries(files)) await fs.outputFile(path.join(tmp, rel), content);
  }
  const item = async (name: string) => (await handleCheckProject({ targetDir: tmp })).results.find((r) => r.name === name);
  const TW3 = { tailwindcss: "^3.4.17", clsx: "^2.1.1", "tailwind-merge": "^2.6.0" };

  it("WI-0051: 선언만 있고 설치본이 없으면 WARN, 설치되면 PASS", async () => {
    await project({}, { dependencies: TW3 });
    expect(await item("dependencies")).toEqual({
      name: "dependencies",
      severity: "warn",
      message: "선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → pnpm install",
    });
    for (const name of Object.keys(TW3)) await writeInstalledStub(tmp, name);
    expect(await item("dependencies")).toEqual({ name: "dependencies", severity: "pass", message: "필수 및 권장 의존성이 선언 · 설치되어 있습니다 (3개 확인)" });
  });

  it("WI-0072: .cjs bare require + 설치본 tokens 1.6.2 → WARN, .ts export default + require → PASS", async () => {
    await project({ "tailwind.config.cjs": 'module.exports = { presets: [require("@axis-ds/tokens/tailwind")] };' }, { devDependencies: { tailwindcss: "^3.4.17" } });
    await writeInstalledStub(tmp, "@axis-ds/tokens", "1.6.2");
    expect(await item("tailwind.config")).toMatchObject({
      severity: "warn",
      message: expect.stringContaining('@axis-ds/tokens 설치본 1.6.2 에서는 CommonJS 의 require("@axis-ds/tokens/tailwind") 가 preset 이 아니라'),
    });
    await fs.remove(path.join(tmp, "tailwind.config.cjs"));
    await fs.writeFile(path.join(tmp, "tailwind.config.ts"), 'export default { presets: [require("@axis-ds/tokens/tailwind")] };');
    expect(await item("tailwind.config")).toMatchObject({ severity: "pass" });
  });

  it("WI-0068: 마크업 data-brand + ThemeProvider 는 theme 설치본 1.6.2 → WARN, 1.7.0 → PASS", async () => {
    await project({ "app/layout.tsx": '<html data-brand="ontology"><ThemeProvider>{children}</ThemeProvider></html>' }, { dependencies: {} }, { brand: "ontology" });
    await writeInstalledStub(tmp, "@axis-ds/theme", "1.6.2");
    expect(await item("brand.activation")).toEqual({
      name: "brand.activation",
      severity: "warn",
      message: 'app/layout.tsx의 <html data-brand> 를 @axis-ds/theme 설치본 1.6.2 의 ThemeProvider 가 마운트 때 지웁니다 → @axis-ds/theme 1.7.0 이상으로 올리거나 setBrand("ontology")',
    });
    await writeInstalledStub(tmp, "@axis-ds/theme", "1.7.0");
    expect(await item("brand.activation")).toMatchObject({ severity: "pass" });
  });

  it("WI-0070: animation 은 plugins 배열 판독(import 만이면 WARN), 레이아웃 JS import 는 globals.css 근거", async () => {
    await project(
      {
        "tailwind.config.ts": 'import animate from "tailwindcss-animate";\nexport default { plugins: [] };',
        "app/globals.css": ":root{--background:0;--primary:0;}",
        "app/layout.tsx": 'import "@axis-ds/tokens/css";',
      },
      { dependencies: { "@axis-ds/ui-react": "^1.6.3" }, devDependencies: { tailwindcss: "^3.4.17", "tailwindcss-animate": "^1.0.7" } }
    );
    await writeInstalledStub(tmp, "tailwindcss-animate", "1.0.7");
    expect(await item("animation")).toMatchObject({ severity: "warn", message: expect.stringContaining("plugins 에 없음") });
    expect(await item("globals.css")).toEqual({
      name: "globals.css",
      severity: "pass",
      message: "app/globals.css에 AXIS CSS 변수가 있습니다 (app/layout.tsx의 @axis-ds/tokens/css import)",
    });
  });
});

// WI-0074: CLI template-check.test.ts 「WI-0074」 의 hoisted 전이와 같은 판정 · 문구(공유 코어 번들, 사본 없음)
describe("handleCheckProject WI-0074: 호이스팅 모노레포의 설치본을 상위 디렉터리에서 찾음 (CLI 와 같은 문구)", () => {
  const TW4_CSS = '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n';
  const NAMES = ["tailwind.config", "globals.css", "dependencies", "animation"];
  /** tmp 를 모노레포 루트로 두고(루트 node_modules 에만 설치본) apps/<이름> 을 만듭니다 */
  async function app(name: string, deps: Record<string, string>, css: string, rootInstalled: Record<string, string>) {
    await fs.writeJSON(path.join(tmp, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], devDependencies: { tailwindcss: "^4.1.0" } });
    for (const [pkg, version] of Object.entries(rootInstalled)) await writeInstalledStub(tmp, pkg, version);
    const dir = path.join(tmp, "apps", name);
    await fs.outputJSON(path.join(dir, "package.json"), { name, private: true, dependencies: deps });
    await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "components/ui" });
    await fs.outputFile(path.join(dir, "lib/utils.ts"), "export function cn() {}\n");
    await fs.outputFile(path.join(dir, "app/globals.css"), css);
    return dir;
  }
  const items = async (dir: string) => (await handleCheckProject({ targetDir: dir })).results.filter((r) => NAMES.includes(r.name));
  const ROOT = { tailwindcss: "4.3.3", "@axis-ds/tokens": "1.8.0", "@axis-ds/ui-react": "1.8.0" };
  const PASS4 = { name: "tailwind.config", severity: "pass", message: 'Tailwind 4: app/globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다' };
  const GLOBALS4 = { name: "globals.css", severity: "pass", message: "app/globals.css에 AXIS CSS 변수가 있습니다 (@axis-ds/tokens/css/tailwind4 import)" };

  it("앱 선언 tailwindcss latest · tokens ^1.3.0 이어도 루트 설치본(4.3.3 · 1.8.0)으로 PASS (종전 FAIL · WARN)", async () => {
    const a = await app("a", { "@axis-ds/tokens": "^1.8.0", tailwindcss: "latest" }, TW4_CSS, ROOT);
    const b = await app("b", { "@axis-ds/tokens": "^1.3.0", tailwindcss: "^4.1.0" }, TW4_CSS, ROOT);
    const deps = { name: "dependencies", severity: "warn", message: "권장 의존성 누락: clsx, tailwind-merge" };
    expect(await items(a)).toEqual([PASS4, GLOBALS4, deps]);
    expect(await items(b)).toEqual([PASS4, GLOBALS4, deps]);
  });

  // WI-0092(사용자 결정 Q12): WI-0074 원 픽스처는 tw-animate-css 를 선언 · 설치하지 않았어요(optional peer, npm 10.9.4 재현). 종전 PASS 는 결함 상태였어요.
  it("루트에만 선언한 Tailwind 4 + ui-react(h-rootonly-ui): tailwind.config WARN(Arial) · globals.css PASS · animation WARN(tw-animate-css 선언 없음)", async () => {
    const css = `${TW4_CSS}@import "@axis-ds/ui-react/tailwind.css";\n@import "tw-animate-css";\nbody { font-family: Arial, Helvetica, sans-serif; }\n`;
    const h = await app("h", { "@axis-ds/tokens": "^1.8.0", "@axis-ds/ui-react": "^1.8.0" }, css, ROOT);
    expect(await items(h)).toEqual([
      { name: "tailwind.config", severity: "warn", message: "Tailwind 4: app/globals.css에 create-next-app 기본 정의가 남아 있습니다(body font-family: Arial) → 지우세요" },
      GLOBALS4,
      // WI-0081: 루트에만 선언한 tailwindcss 를 워크스페이스 루트 선언으로 인정(종전 「필수 의존성 누락」 FAIL)
      { name: "dependencies", severity: "warn", message: "권장 의존성 누락: clsx, tailwind-merge (워크스페이스 루트에 선언: tailwindcss)" },
      {
        name: "animation",
        severity: "warn",
        message:
          "app/globals.css의 애니메이션 플러그인을 쓸 수 없습니다(@axis-ds/ui-react 선언, tw-animate-css 선언 없음): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않고 빌드가 실패할 수 있습니다 → tw-animate-css 를 package.json 에 선언 · 설치하세요",
      },
    ]);
  });

  it("WI-0081: 루트에만 tailwindcss 를 선언한 d-rootonly 는 FAIL 이 없고, 워크스페이스가 아닌 상위의 선언은 FAIL 그대로(음성 대조)", async () => {
    const d = await app("d", { "@axis-ds/tokens": "^1.8.0" }, TW4_CSS, ROOT);
    const all = (await handleCheckProject({ targetDir: d })).results;
    expect(all.filter((r) => r.severity === "fail")).toEqual([]);
    expect(all.find((r) => r.name === "dependencies")).toEqual({
      name: "dependencies",
      severity: "warn",
      message: "권장 의존성 누락: clsx, tailwind-merge (워크스페이스 루트에 선언: tailwindcss)",
    });
    await fs.writeJSON(path.join(tmp, "package.json"), { name: "unrelated", private: true, devDependencies: { tailwindcss: "^4.1.0" } });
    expect((await handleCheckProject({ targetDir: d })).results.find((r) => r.name === "dependencies")).toEqual({
      name: "dependencies",
      severity: "fail",
      message: "필수 의존성 누락: tailwindcss",
    });
  });

  it("양성 대조: 루트 tokens 설치본 1.3.0 이면 상위에서 읽은 설치본으로 WARN", async () => {
    const b = await app("b", { "@axis-ds/tokens": "^1.3.0", tailwindcss: "^4.1.0" }, TW4_CSS, { ...ROOT, "@axis-ds/tokens": "1.3.0" });
    expect((await items(b))[0]).toEqual({
      name: "tailwind.config",
      severity: "warn",
      message: "Tailwind 4: app/globals.css에 AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/tokens 설치본 1.3.0)",
    });
  });
});

// WI-0080: CLI template-check.test.ts 「WI-0080」 과 같은 tailwind.content 판정 · 문구(공유 코어 번들)
describe("handleCheckProject WI-0080: 호이스팅 Tailwind 3 앱의 content 표본 · 제안 (CLI 와 같은 문구)", () => {
  const UP = "../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}";
  const LOCAL = "./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}";
  const PARENT_NOTE =
    "상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀려요. 모노레포 루트 등 앱 디렉터리 밖에서 빌드하면 content: { relative: true, files: [...] } 로 설정 파일 기준으로 바꾸세요";
  /** tmp 를 모노레포 루트로 두고 ui-react 설치본은 루트에만(hoisted), isolated 면 앱 node_modules 에도 둡니다 */
  async function app(layout: "hoisted" | "isolated", content: string[]) {
    await fs.writeJSON(path.join(tmp, "package.json"), { name: "root", private: true, workspaces: ["apps/*"] });
    await writeInstalledStub(tmp, "@axis-ds/ui-react", "1.8.1");
    const dir = path.join(tmp, "apps", "web");
    await fs.outputJSON(path.join(dir, "package.json"), { name: "web", private: true, dependencies: { "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" } });
    await writeInstalledStub(dir, "tailwindcss", "3.4.19");
    if (layout === "isolated") await writeInstalledStub(dir, "@axis-ds/ui-react", "1.8.1");
    await fs.outputFile(path.join(dir, "tailwind.config.ts"), `export default { content: ${JSON.stringify(content)} };\n`);
    return dir;
  }
  const contentItem = async (dir: string) => (await handleCheckProject({ targetDir: dir })).results.find((r) => r.name === "tailwind.content");
  const FAIL = (suggest: string, note: boolean) => ({
    name: "tailwind.content",
    severity: "fail",
    message: `tailwind.config.ts의 content 가 컴포넌트 경로를 덮지 않습니다(클래스가 생성되지 않음): @axis-ds/ui-react → "${suggest}"${note ? ` (${PARENT_NOTE})` : ""}`,
  });
  const PASS = { name: "tailwind.content", severity: "pass", message: "tailwind.config.ts의 content 가 @axis-ds/ui-react 를 덮습니다" };

  it("hoisted: 실제 위치 ../../node_modules 는 PASS, ./node_modules 만이면 FAIL 이고 제안은 ../../node_modules + cwd 안내", async () => {
    expect(await contentItem(await app("hoisted", ["./app/**/*.tsx", UP]))).toEqual(PASS);
    expect(await contentItem(await app("hoisted", ["./app/**/*.tsx", LOCAL]))).toEqual(FAIL(UP, true));
    expect(await contentItem(await app("hoisted", ["./app/**/*.tsx", "./**/*.{js,mjs}"]))).toEqual(FAIL(UP, true));
  });

  // WI-0090: 루트 설치본이 앱 설치본과 실경로가 다르면(이 픽스처는 두 디렉터리 모두 실제 디렉터리) 판정은 종전대로 FAIL 이고,
  // 그 상위 설치본을 가리키는 glob 이 있으면 이유를 붙여요(CLI 와 같은 문구)
  it("isolated(음성 대조): 앱 node_modules 설치본이면 종전 판정 · 제안(./node_modules), 루트 사본을 가리키면 이유를 붙임", async () => {
    expect(await contentItem(await app("isolated", ["./app/**/*.tsx", LOCAL]))).toEqual(PASS);
    const fail = FAIL(LOCAL, false);
    expect(await contentItem(await app("isolated", ["./app/**/*.tsx", UP]))).toEqual({
      ...fail,
      message: `${fail.message} (상위 경로 ../../node_modules/@axis-ds/ui-react 는 앱이 쓰는 설치본과 다른 설치본(버전은 1.8.1 로 같음)이라 덮음으로 보지 않아요)`,
    });
  });
});

// WI-0086: axis.check_project 도 같은 코어를 번들하므로 루트에만 ui-react 를 선언한 Tailwind 3 앱에 content · animation 항목이 생기고,
// targetDir 를 앱 링크로 줘도 실경로와 같은 판정이에요(cli check 와 같은 문구, 브리프 측정 L1 15/15 다름 → 0).
describe("WI-0086: check_project 의 루트 선언 인정 · 심링크 targetDir", () => {
  const UP = "../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}";
  async function wsApp(): Promise<string> {
    const root = await fs.realpath(tmp);
    await fs.writeJSON(path.join(root, "package.json"), {
      name: "root",
      private: true,
      workspaces: ["apps/*"],
      devDependencies: { tailwindcss: "^3.4.0", "@axis-ds/tokens": "^1.8.0", "@axis-ds/ui-react": "^1.8.0", "tailwindcss-animate": "^1.0.7" },
    });
    await fs.writeFile(path.join(root, "package-lock.json"), "{}");
    for (const [name, version] of [["tailwindcss", "3.4.19"], ["@axis-ds/tokens", "1.8.1"], ["@axis-ds/ui-react", "1.8.1"], ["tailwindcss-animate", "1.0.7"]]) {
      await fs.outputJSON(path.join(root, "node_modules", ...name.split("/"), "package.json"), { name, version });
    }
    const app = path.join(root, "apps", "web");
    await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: {} });
    await fs.outputJSON(path.join(app, "axis.config.json"), {});
    await fs.outputFile(
      path.join(app, "tailwind.config.js"),
      'module.exports = { presets: [require("@axis-ds/tokens/tailwind")], content: ["./app/**/*.{ts,tsx}"], plugins: [require("tailwindcss-animate")] };\n'
    );
    return app;
  }
  const pick = (results: { name: string }[]) => results.filter((r) => r.name === "tailwind.content" || r.name === "animation");

  it("루트 선언 앱: content FAIL(상위 제안) · animation PASS, 앱 링크 targetDir 도 같은 결과", async () => {
    const app = await wsApp();
    const real = (await handleCheckProject({ targetDir: app })).results;
    expect(pick(real)).toEqual([
      expect.objectContaining({ name: "tailwind.content", severity: "fail", message: expect.stringContaining(`@axis-ds/ui-react → "${UP}"`) }),
      { name: "animation", severity: "pass", message: "tailwind.config.js의 plugins 에 tailwindcss-animate 가 있습니다" },
    ]);
    const links = await fs.mkdtemp(path.join(os.tmpdir(), "axis-mcp-link-"));
    try {
      const link = path.join(links, "web-link");
      await fs.symlink(app, link, "dir");
      expect((await handleCheckProject({ targetDir: link })).results).toEqual(real);
    } finally {
      await fs.remove(links);
    }
  });
});

// WI-0091 · 0094 · 0092: CLI template-check.test.ts 「WI-0091 · 0094 · 0092」 와 같은 판정 · 문구(AC 동등성). brand.activation 은 MCP 가
// 자기 문구 함수(template.ts brandActivationResult)를 따로 가져서 이 행이 MCP 쪽 회귀를 잡아요.
describe("handleCheckProject WI-0091 · 0094 · 0092 (CLI 와 같은 문구)", () => {
  const PNP_NOTE = "워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다";
  const item = async (dir: string, name: string) => (await handleCheckProject({ targetDir: dir })).results.find((r) => r.name === name);
  /** tmp 를 Yarn PnP 워크스페이스 루트로(.pnp.cjs · yarn.lock · .yarnrc.yml), apps/web 앱 */
  async function pnpApp(rootDeps: Record<string, string>, appDeps: Record<string, string>, files: Record<string, string> = {}, config: Record<string, unknown> = {}) {
    await fs.writeJSON(path.join(tmp, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], devDependencies: rootDeps });
    await fs.writeFile(path.join(tmp, "yarn.lock"), "");
    await fs.writeFile(path.join(tmp, ".yarnrc.yml"), "nodeLinker: pnp\n");
    await fs.writeFile(path.join(tmp, ".pnp.cjs"), "");
    const dir = path.join(tmp, "apps", "web");
    await fs.outputJSON(path.join(dir, "package.json"), { name: "web", private: true, dependencies: appDeps });
    await fs.outputJSON(path.join(dir, "axis.config.json"), config);
    for (const [rel, content] of Object.entries(files)) await fs.outputFile(path.join(dir, rel), content);
    return dir;
  }
  const TRIO3 = { tailwindcss: "^3.4.0", clsx: "^2.1.1", "tailwind-merge": "^2.6.0" };

  it("WI-0091: PnP 루트 전용 필수 → dependencies FAIL 전용 문구, theme 게이트 → brand.activation 「앱에서 해석되지 않음」 WARN", async () => {
    const a = await pnpApp(TRIO3, {});
    expect(await item(a, "dependencies")).toEqual({
      name: "dependencies",
      severity: "fail",
      message: `필수 의존성 tailwindcss 가 ${PNP_NOTE} → 앱 package.json 에 선언하세요`,
    });
    const b = await pnpApp({ "@axis-ds/theme": "^1.7.0" }, TRIO3, { "app/layout.tsx": '<html data-brand="ontology"><ThemeProvider>{children}</ThemeProvider></html>' }, { brand: "ontology" });
    expect(await item(b, "brand.activation")).toEqual({
      name: "brand.activation",
      severity: "warn",
      message: `app/layout.tsx의 <html data-brand> 를 ThemeProvider 와 함께 쓰는데 @axis-ds/theme 가 ${PNP_NOTE}(워크스페이스 루트 선언 ^1.7.0) → 앱 package.json 에 @axis-ds/theme 1.7.0 이상을 선언하거나 setBrand("ontology")`,
    });
  });

  it("추가 결정 A3 · A1: PnP 루트 전용 @axis-ds → dependencies 전용 문구 WARN, TW3 루트 전용 플러그인 → animation 같은 틀", async () => {
    const dir = await pnpApp(
      { "@axis-ds/ui-react": "1.8.2", "tailwindcss-animate": "^1.0.7" },
      { ...TRIO3, "@axis-ds/tokens": "1.8.2" },
      { "tailwind.config.cjs": 'module.exports = { content: ["./app/**/*.{ts,tsx}"], plugins: [require("tailwindcss-animate")] };\n' }
    );
    expect(await item(dir, "dependencies")).toEqual({
      name: "dependencies",
      severity: "warn",
      message: `@axis-ds/ui-react 가 ${PNP_NOTE} → 앱 package.json 에 선언하세요`,
    });
    expect(await item(dir, "animation")).toEqual({
      name: "animation",
      severity: "warn",
      message: `애니메이션 플러그인 tailwindcss-animate 가 ${PNP_NOTE}(@axis-ds/ui-react 선언): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않습니다 → 앱 package.json 에 tailwindcss-animate 를 선언하세요`,
    });
  });

  it("WI-0094: npm 워크스페이스 루트 전용 · 미설치 @axis-ds → WARN 루트 문구 · 출처 표시", async () => {
    await fs.writeJSON(path.join(tmp, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], devDependencies: { "@axis-ds/ui-react": "^1.8.0" } });
    await fs.writeFile(path.join(tmp, "package-lock.json"), "{}");
    const dir = path.join(tmp, "apps", "web");
    await fs.outputJSON(path.join(dir, "package.json"), { name: "web", private: true, dependencies: TRIO3 });
    for (const name of Object.keys(TRIO3)) await writeInstalledStub(dir, name);
    expect(await item(dir, "dependencies")).toEqual({
      name: "dependencies",
      severity: "warn",
      message: "워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/ui-react → npm install (워크스페이스 루트에 선언: @axis-ds/ui-react)",
    });
  });

  it("WI-0092: Tailwind 4 줄은 있는데 tw-animate-css 미설치 → WARN, 선언 · 설치면 PASS", async () => {
    await fs.writeJSON(path.join(tmp, "package.json"), { name: "app", private: true, dependencies: { tailwindcss: "^4.1.0", "@axis-ds/ui-react": "^1.8.0", "tw-animate-css": "^1.3.0" } });
    await fs.outputFile(path.join(tmp, "app/globals.css"), '@import "tailwindcss";\n@import "tw-animate-css";\n');
    await writeInstalledStub(tmp, "tailwindcss", "4.1.14");
    expect(await item(tmp, "animation")).toEqual({
      name: "animation",
      severity: "warn",
      message:
        "app/globals.css의 애니메이션 플러그인을 쓸 수 없습니다(@axis-ds/ui-react 선언, tw-animate-css 미설치(선언만 있음)): Dialog · Select 등의 열고 닫는 애니메이션이 동작하지 않고 빌드가 실패할 수 있습니다 → tw-animate-css 를 package.json 에 선언 · 설치하세요",
    });
    await writeInstalledStub(tmp, "tw-animate-css", "1.4.0");
    expect(await item(tmp, "animation")).toEqual({ name: "animation", severity: "pass", message: "app/globals.css에 애니메이션 플러그인이 있습니다" });
  });
});

// WI-0100a: CSS 판정 3항목이 globalCss 를 먼저 보고 brand 와 같은 파일을 판정(CLI template-check.test.ts 「WI-0100a 전역 CSS 선택」과 같은 문구)
describe("handleCheckProject WI-0100a 전역 CSS 선택 (CLI 와 같은 문구)", () => {
  const GOOD4 = '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n';
  const TW4_DEPS = { "@axis-ds/tokens": "^1.8.2", clsx: "^2.1.1", "tailwind-merge": "^3.3.1", tailwindcss: "^4.1.14" };

  async function app(dir: string) {
    await fs.ensureDir(path.join(dir, ".git"));
    await fs.outputFile(path.join(dir, "lib/utils.ts"), 'export function cn(...a: string[]) { return a.join(" "); }\n');
    await fs.outputJSON(path.join(dir, "package.json"), { name: "app", private: true, dependencies: TW4_DEPS });
    for (const [name, range] of Object.entries(TW4_DEPS)) await writeInstalledStub(dir, name, range.slice(1));
  }

  async function items(dir: string) {
    return Object.fromEntries((await handleCheckProject({ targetDir: dir })).results.map((r) => [r.name, r]));
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

  it("R1: 루트 낡은 globals.css 대신 globalCss 의 app/globals.css 로 PASS 2건", async () => {
    await app(tmp);
    await fs.outputFile(path.join(tmp, "app/globals.css"), GOOD4);
    await fs.outputFile(path.join(tmp, "globals.css"), "body{margin:0}\n");
    await fs.outputJSON(path.join(tmp, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./app/globals.css" });
    const r = await items(tmp);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css"));
  });

  it("R2: 후보 밖 src/styles/globals.css 를 globalCss 로 지정하면 FAIL 0", async () => {
    await app(tmp);
    await fs.outputFile(path.join(tmp, "src/styles/globals.css"), GOOD4);
    await fs.outputJSON(path.join(tmp, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./src/styles/globals.css" });
    const { results, summary } = await handleCheckProject({ targetDir: tmp });
    const r = Object.fromEntries(results.map((x) => [x.name, x]));
    expect(r["tailwind.config"]).toEqual(TW4_PASS("src/styles/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("src/styles/globals.css"));
    expect(summary.fail).toBe(0);
  });

  it("mono: 프로젝트 밖 globalCss 를 읽기만 해서 CSS 2항목 PASS, brand 와 같은 파일", async () => {
    const dir = path.join(tmp, "app1");
    await app(dir);
    await fs.outputFile(path.join(tmp, "shared/globals.css"), `${GOOD4}@import "@axis-ds/tokens/css/brands/ontology";\n`);
    await fs.outputJSON(path.join(dir, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "../shared/globals.css", brand: "ontology" });
    const { results, summary } = await handleCheckProject({ targetDir: dir });
    const r = Object.fromEntries(results.map((x) => [x.name, x]));
    expect(r["tailwind.config"]).toEqual(TW4_PASS("../shared/globals.css"));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("../shared/globals.css"));
    expect(r.brand).toEqual({ name: "brand", severity: "pass", message: 'brand "ontology" import 가 ../shared/globals.css에 있습니다' });
    expect(summary.fail).toBe(0);
  });

  it("x2 · N1: globalCss 를 쓰지 못하면 표기(없음 · .css 아님), brand 도 같은 표기", async () => {
    await app(tmp);
    await fs.outputFile(path.join(tmp, "app/globals.css"), `${GOOD4}@import "@axis-ds/tokens/css/brands/ontology";\n`);
    await fs.outputJSON(path.join(tmp, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./nope.css" });
    expect((await items(tmp))["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css", " (globalCss ./nope.css 없음)"));

    await fs.outputJSON(path.join(tmp, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./package.json", brand: "ontology" });
    const note = " (globalCss ./package.json: .css 파일이 아님)";
    const r = await items(tmp);
    expect(r["tailwind.config"]).toEqual(TW4_PASS("app/globals.css", note));
    expect(r["globals.css"]).toEqual(GLOBALS_PASS("app/globals.css", note));
    expect(r.brand).toEqual({ name: "brand", severity: "pass", message: `brand "ontology" import 가 app/globals.css에 있습니다${note}` });
  });
});
