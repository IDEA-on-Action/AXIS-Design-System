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
      message: "app/layout.tsx에 ThemeProvider · data-brand 가 있습니다",
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
    // tailwind.config(자체 hsl 매핑만, preset 없음) · brand · brand.activation(레이아웃 없음) 3개(WI-0065 D8)
    expect(results.filter((r) => r.severity === "warn").map((r) => r.name)).toEqual(["tailwind.config", "brand", "brand.activation"]);
    expect(summary.warn).toBe(3);
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

  it("주석 안에만 있으면 종전 warn, 변수 직접 정의는 종전 pass 문구", async () => {
    await write('/* @import "@axis-ds/tokens/css"; */', { tailwindcss: "^4" });
    expect(await find("globals.css")).toEqual({
      name: "globals.css",
      severity: "warn",
      message: "src/app/globals.css에 AXIS CSS 변수가 없습니다",
    });
    await write(":root{--background:0 0% 100%;--primary:0 0% 0%;}", { tailwindcss: "^3.4.0" });
    expect(await find("globals.css")).toMatchObject({
      severity: "pass",
      message: "src/app/globals.css에 AXIS CSS 변수가 정의되어 있습니다",
    });
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
