import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import nodeFs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "os";
import path from "path";
import {
  BRAND_ADJUSTMENT_REFERENCE,
  KEY_TOKENS,
  brandImportPath,
  findBrandImports,
  findGlobalCss,
  getBrand,
  inspectBrandImport,
  listBrands,
  parseBrandCss,
  readBrandConfig,
  resolveTokens,
  isolatedResolveStats,
  setIsolatedResolveFactoryForTest,
  workerResolveSessionForTest,
} from "./brand-core.js";
import { THEME_FIXTURES_DIR, installTokens, makeProject } from "./test-helpers.js";

const created: string[] = [];

async function project(...args: Parameters<typeof makeProject>): Promise<string> {
  const dir = await makeProject(...args);
  created.push(dir);
  return dir;
}

afterEach(async () => {
  while (created.length > 0) await fs.remove(created.pop()!);
});

const SAMPLE_CSS = path.join(THEME_FIXTURES_DIR, "tokens-1.3/pkg/_dist/css/brands/sample.css");
const SAMPLE_META = path.join(THEME_FIXTURES_DIR, "tokens-1.3/pkg/_dist/brands/sample/brand.json");
const SAMPLE_INDEX = path.join(THEME_FIXTURES_DIR, "tokens-1.3/pkg/_dist/brands/index.json");

/** `<dir>` 에서 위로 `node_modules/@axis-ds/tokens` 가 하나도 없는지(미설치 판정의 전제) */
function hasTokensAbove(dir: string): boolean {
  let cur = path.resolve(dir);
  for (;;) {
    if (fs.existsSync(path.join(cur, "node_modules", "@axis-ds", "tokens"))) return true;
    const parent = path.dirname(cur);
    if (parent === cur) return false;
    cur = parent;
  }
}

describe("resolveTokens (T2-1)", () => {
  it("tokens 1.3 fixture 는 ok, 버전과 index 경로를 돌려줌", async () => {
    const dir = await project({ tokens: "1.3" });
    const r = resolveTokens(dir);
    expect(r.status).toBe("ok");
    expect(r.version).toBe("1.3.0");
    expect(r.indexPath).toBe(
      path.join(dir, "node_modules/@axis-ds/tokens/dist/brands/index.json")
    );
  });

  it("tokens 1.2 fixture 는 unsupported, 버전 1.2.1", async () => {
    const dir = await project({ tokens: "1.2" });
    expect(resolveTokens(dir)).toEqual({ status: "unsupported", version: "1.2.1" });
  });

  it("미설치는 not-installed (전제: 임시 디렉터리 위로 tokens 없음)", async () => {
    const dir = await project({ tokens: "none" });
    expect(hasTokensAbove(dir)).toBe(false);
    expect(resolveTokens(dir)).toEqual({ status: "not-installed" });
  });

  it("dist 없는 1.3 fixture 는 not-built 이고 버전 1.3.0 을 읽음(음성 대조군: not-installed 아님)", async () => {
    const dir = await project({ tokens: "1.3-unbuilt" });
    expect(fs.existsSync(path.join(dir, "node_modules/@axis-ds/tokens/dist"))).toBe(false);
    const r = resolveTokens(dir);
    expect(r.status).not.toBe("not-installed");
    expect(r).toEqual({ status: "not-built", version: "1.3.0" });
  });

  it("하위 디렉터리에서도 위로 올라가며 찾음", async () => {
    const dir = await project({ tokens: "1.3" });
    const sub = path.join(dir, "packages/web");
    await fs.ensureDir(sub);
    expect(resolveTokens(sub).status).toBe("ok");
  });
});

describe("listBrands (T2-2)", () => {
  it("index.json 항목 수 = 결과 수, 메타는 brand.json 과 같음", async () => {
    const dir = await project({ tokens: "1.3" });
    const index = (await fs.readJSON(SAMPLE_INDEX)) as { brands: { name: string; css: string }[] };
    const meta = await fs.readJSON(SAMPLE_META);

    const r = listBrands(dir);
    expect(r.status).toBe("ok");
    expect(r.version).toBe("1.3.0");
    expect(r.brands).toHaveLength(index.brands.length);
    expect(r.brands[0]).toEqual({
      name: "sample",
      description: meta.description,
      themes: meta.themes,
      a11y: meta.a11y,
      importPath: "@axis-ds/tokens/css/brands/sample",
    });
  });

  it("대조군: index 에 없는 브랜드 디렉터리는 결과에 없음", async () => {
    const dir = await project({ tokens: "1.3" });
    const ghost = path.join(dir, "node_modules/@axis-ds/tokens/dist/brands/ghost/brand.json");
    await fs.outputJSON(ghost, {
      name: "ghost",
      description: "index 밖",
      themes: ["light", "dark"],
      a11y: {},
    });
    const names = listBrands(dir).brands.map((b) => b.name);
    expect(names).toEqual(["sample"]);
  });

  it("ok 가 아니면 빈 목록과 상태를 함께 돌려줌", async () => {
    for (const tokens of ["none", "1.2", "1.3-unbuilt"] as const) {
      const dir = await project({ tokens });
      const r = listBrands(dir);
      expect(r.status).not.toBe("ok");
      expect(r.brands).toEqual([]);
    }
  });

  it("brandImportPath 는 index 의 css 하위 경로를 패키지 지정자로 바꿈", () => {
    expect(brandImportPath({ css: "./css/brands/ontology" })).toBe(
      "@axis-ds/tokens/css/brands/ontology"
    );
  });
});

describe("parseBrandCss (T2-3)", () => {
  it("fixture CSS(명시도 0,2,0 라이트 선택자 · 다크 3줄)에서 라이트 · 다크 선언을 분리", async () => {
    const css = await fs.readFile(SAMPLE_CSS, "utf8");
    const r = parseBrandCss(css, "sample");
    expect(r.light["--primary"]).toBe("180 81% 43%");
    expect(r.light["--background"]).toBe("210 22% 96%");
    expect(r.light["--radius"]).toBe("12px");
    expect(r.light["--axis-font-family-sans"]).toBe("'Pretendard Variable', Pretendard, sans-serif");
    expect(r.dark["--background"]).toBe("217 41% 10%");
    expect(r.dark["--axis-surface-default"]).toBe("#172030");
    expect(r.dark["--radius"]).toBeUndefined();
    expect(Object.keys(r.light)).toHaveLength(12);
    expect(Object.keys(r.dark)).toHaveLength(8);
  });

  it("명시도 0,1,0 라이트 선택자(M3 이전 형식)도 라이트로 읽음", () => {
    const css = `[data-brand="b"] {\n  --primary: 1 2% 3%;\n}\n\n[data-brand="b"].dark,\n[data-brand="b"][data-theme="dark"],\n.dark [data-brand="b"] {\n  --primary: 4 5% 6%;\n}\n`;
    expect(parseBrandCss(css, "b")).toEqual({
      light: { "--primary": "1 2% 3%" },
      dark: { "--primary": "4 5% 6%" },
    });
  });

  it("다크 블록이 없으면 다크는 빈 맵", () => {
    const css = `/* head { } */\n[data-brand="b"][data-brand="b"] {\n  --primary: 1 2% 3%;\n}\n`;
    expect(parseBrandCss(css, "b")).toEqual({ light: { "--primary": "1 2% 3%" }, dark: {} });
  });

  it("다른 브랜드 블록과 :root 블록은 읽지 않음", () => {
    const css = `:root {\n  --primary: 0 0% 0%;\n}\n[data-brand="other"] {\n  --primary: 9 9% 9%;\n}\n[data-brand="b"] {\n  --ring: 1 1% 1%;\n}\n`;
    expect(parseBrandCss(css, "b")).toEqual({ light: { "--ring": "1 1% 1%" }, dark: {} });
  });
});

describe("getBrand (T2-6 · T2-7 코어)", () => {
  it("주요 토큰은 KEY_TOKENS 가운데 브랜드 CSS 에 있는 것만, KEY_TOKENS 순서", async () => {
    const dir = await project({ tokens: "1.3" });
    const r = getBrand(dir, "sample");
    expect(r.status).toBe("ok");
    expect(r.available).toEqual(["sample"]);
    const b = r.brand!;
    expect(b.importPath).toBe("@axis-ds/tokens/css/brands/sample");
    expect(Object.keys(b.tokens.light)).toEqual(
      KEY_TOKENS.filter((k) =>
        [
          "--primary",
          "--background",
          "--radius",
          "--axis-surface-default",
          "--axis-text-primary",
          "--axis-button-bg-default",
          "--axis-border-focus",
          "--axis-font-family-sans",
        ].includes(k)
      )
    );
    expect(b.tokens.dark).toEqual({
      "--primary": "180 81% 43%",
      "--background": "217 41% 10%",
      "--axis-surface-default": "#172030",
      "--axis-text-primary": "#E6EBF1",
      "--axis-button-bg-default": "#15C7C7",
      "--axis-border-focus": "#60A5FA",
    });
    // WI-0065 D7: defaultBrand 대신 data-brand · setBrand 를 안내합니다(defaultBrand 는 끈 상태가 유지되지 않음, WI-0068)
    expect(b.providerExample).toContain('<html lang="ko" data-brand="sample">');
    expect(b.providerExample).toContain('setBrand("sample");');
    expect(b.providerExample).not.toContain("defaultBrand");
    expect(b.adjustments).toEqual({
      a11y: { status: "unchecked", checkedAt: null, gate: null },
      reference: BRAND_ADJUSTMENT_REFERENCE,
    });
  });

  it("없는 브랜드는 brand null 과 설치된 이름 목록", async () => {
    const dir = await project({ tokens: "1.3" });
    expect(getBrand(dir, "nope")).toEqual({
      status: "ok",
      version: "1.3.0",
      brand: null,
      available: ["sample"],
    });
  });

  it("ok 가 아니면 brand null, 목록 없음", async () => {
    const dir = await project({ tokens: "none" });
    expect(getBrand(dir, "sample")).toEqual({
      status: "not-installed",
      version: undefined,
      brand: null,
      available: [],
    });
  });
});

describe("부분 빌드(index.json 은 있는데 항목 파일이 없음)는 not-built", () => {
  const BUILT = "node_modules/@axis-ds/tokens/dist";

  it("brand.json 이 없으면 listBrands · getBrand 모두 not-built (throw 없음)", async () => {
    const dir = await project({ tokens: "1.3" });
    await fs.remove(path.join(dir, BUILT, "brands/sample/brand.json"));
    expect(listBrands(dir)).toEqual({ status: "not-built", version: "1.3.0", brands: [] });
    expect(getBrand(dir, "sample")).toEqual({ status: "not-built", version: "1.3.0", brand: null, available: [] });
  });

  it("CSS 가 없으면 getBrand 는 not-built", async () => {
    const dir = await project({ tokens: "1.3" });
    await fs.remove(path.join(dir, BUILT, "css/brands/sample.css"));
    expect(getBrand(dir, "sample")).toMatchObject({ status: "not-built", brand: null });
  });

  it("음성 대조군: 파일이 다 있으면 ok", async () => {
    const dir = await project({ tokens: "1.3" });
    expect(listBrands(dir).status).toBe("ok");
    expect(getBrand(dir, "sample").status).toBe("ok");
  });
});

describe("test-helpers", () => {
  it("theme-only 레이아웃은 템플릿 files[] 8개(app/ 4개 · postcss 포함, WI-0037)와 initTemplate 형태 config 를 펼침", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const files = (await fs.readdir(dir)).sort();
    expect(files).toEqual(
      ["app", "axis.config.json", "package.json", "postcss.config.mjs", "tailwind.config.ts", "tsconfig.json"].sort()
    );
    expect((await fs.readdir(path.join(dir, "app"))).sort()).toEqual(
      ["globals.css", "layout.tsx", "page.tsx", "theme-toggle.tsx"].sort()
    );
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(Object.keys(config)).toEqual([
      "$schema",
      "template",
      "componentsDir",
      "tailwindConfig",
      "globalCss",
    ]);
  });

  it("임시 디렉터리는 os.tmpdir 아래에 만들어짐", async () => {
    const dir = await project({ tokens: "none" });
    expect(dir.startsWith(os.tmpdir())).toBe(true);
  });
});

describe("findGlobalCss (plan 4.1, U14 (A))", () => {
  it("globalCss 파일이 있으면 그것만 고름", async () => {
    const dir = await project({ tokens: "none" });
    await fs.outputFile(path.join(dir, "styles/x.css"), "");
    await fs.outputFile(path.join(dir, "app/globals.css"), "");
    expect(findGlobalCss(dir, { globalCss: "./styles/x.css" })).toEqual({ path: path.join(dir, "styles/x.css") });
  });

  it("globalCss 파일이 없으면 configuredMissing 과 함께 다음 후보", async () => {
    const dir = await project({ tokens: "none" });
    await fs.outputFile(path.join(dir, "src/app/globals.css"), "");
    await fs.outputFile(path.join(dir, "globals.css"), "");
    expect(findGlobalCss(dir, { globalCss: "./nope.css" })).toEqual({
      path: path.join(dir, "src/app/globals.css"),
      configuredMissing: "./nope.css",
    });
  });

  it("후보가 모두 없으면 path 없음, 디렉터리는 파일로 보지 않음", async () => {
    const dir = await project({ tokens: "none" });
    await fs.ensureDir(path.join(dir, "app/globals.css"));
    expect(findGlobalCss(dir, null)).toEqual({});
    expect(findGlobalCss(dir, { globalCss: "./globals.css" })).toEqual({ configuredMissing: "./globals.css" });
  });
});

describe("findBrandImports", () => {
  it("세 형태 · .css 접미 · 나온 순서", () => {
    const css = [
      '@import "@axis-ds/tokens/css/brands/a";',
      "@import '@axis-ds/tokens/css/brands/b-2';",
      "@import url(@axis-ds/tokens/css/brands/c);",
      '@import url("@axis-ds/tokens/css/brands/d.css") layer(base);',
      '@import "@axis-ds/tokens/css/brands/e"',
    ].join("\n");
    expect(findBrandImports(css)).toEqual(["a", "b-2", "c", "d", "e"]);
  });

  it("주석 · 다른 경로 · 이름 뒤에 다른 글자가 붙은 경로는 세지 않음", () => {
    const css = [
      '/* @import "@axis-ds/tokens/css/brands/a"; */',
      '@import "@axis-ds/tokens/css/shadcn";',
      '@import "@axis-ds/tokens/css/brands/x_y";',
      ".a { content: '@axis-ds/tokens/css/brands/z'; }",
    ].join("\n");
    expect(findBrandImports(css)).toEqual([]);
  });
});

describe("readBrandConfig · inspectBrandImport (FR-5)", () => {
  async function dirWith(files: Record<string, string>): Promise<string> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-brand-check-"));
    created.push(dir);
    for (const [file, content] of Object.entries(files)) {
      await fs.ensureDir(path.dirname(path.join(dir, file)));
      await fs.writeFile(path.join(dir, file), content);
    }
    return dir;
  }

  it("config 없음 · JSON 파손 · 최상위가 객체가 아님 → null", async () => {
    expect(readBrandConfig(await dirWith({}))).toBeNull();
    expect(readBrandConfig(await dirWith({ "axis.config.json": "{ x" }))).toBeNull();
    expect(readBrandConfig(await dirWith({ "axis.config.json": '["sample"]' }))).toBeNull();
    expect(readBrandConfig(await dirWith({ "axis.config.json": "null" }))).toBeNull();
    expect(readBrandConfig(await dirWith({ "axis.config.json": '{"brand":"a"}' }))).toEqual({ brand: "a" });
  });

  it("brand 가 없거나 공백뿐이면 null (검사기가 항목을 더하지 않음)", async () => {
    const css = { "app/globals.css": '@import "@axis-ds/tokens/css/brands/a";' };
    expect(inspectBrandImport(await dirWith({ ...css, "axis.config.json": "{}" }))).toBeNull();
    expect(inspectBrandImport(await dirWith({ ...css, "axis.config.json": '{"brand":"  "}' }))).toBeNull();
  });

  it("상태 4종과 상대 경로(/ 구분) · import 중복 제거", async () => {
    const config = '{"brand":"a"}';
    expect(
      inspectBrandImport(
        await dirWith({
          "axis.config.json": config,
          "src/app/globals.css": '@import "@axis-ds/tokens/css/brands/a";\n@import "@axis-ds/tokens/css/brands/a";',
        })
      )
    ).toEqual({ brand: "a", state: "match", cssFile: "src/app/globals.css", imports: ["a"] });
    expect(
      inspectBrandImport(await dirWith({ "axis.config.json": config, "globals.css": ":root{}" }))
    ).toEqual({ brand: "a", state: "import-missing", cssFile: "globals.css", imports: [] });
    expect(
      inspectBrandImport(
        await dirWith({ "axis.config.json": config, "globals.css": '@import "@axis-ds/tokens/css/brands/b";' })
      )
    ).toEqual({ brand: "a", state: "other-brand", cssFile: "globals.css", imports: ["b"] });
    expect(
      inspectBrandImport(await dirWith({ "axis.config.json": '{"brand":"a","globalCss":"./x.css"}' }))
    ).toEqual({ brand: "a", state: "css-missing", configuredMissing: "./x.css", imports: [] });
  });
});

/**
 * WI-0089: 같은 프로세스에서 같은 경로의 tokens 를 바꾼 뒤 다시 판정하면 새 상태를 따라가야 해요.
 * Node 는 처음 해석한 package.json 의 `exports` 를 프로세스가 끝날 때까지 기억해서, 고치기 전에는 첫 상태의 판정이 남았어요.
 * vitest 도 한 프로세스라 같은 낡음이 재현돼요. 기대값은 같은 상태를 새 경로(= 새 프로세스와 같은 첫 해석)에서 본 판정이에요.
 */
describe("WI-0089: 같은 프로세스 · 같은 경로에서 tokens 가 바뀌면 새 상태로 판정", () => {
  afterEach(() => setIsolatedResolveFactoryForTest(null));

  /** 1.3 fixture 의 sample 브랜드를 `name` 으로 복제하고 exports 키 2개를 더해요(같은 version, exports 만 바뀜) */
  async function addBrand(dir: string, name: string): Promise<void> {
    const t = path.join(dir, "node_modules", "@axis-ds", "tokens");
    const indexFile = path.join(t, "dist/brands/index.json");
    const index = (await fs.readJSON(indexFile)) as { brands: { name: string; css: string; meta: string }[] };
    index.brands.push({ name, css: `./css/brands/${name}`, meta: `./brands/${name}/brand.json` });
    await fs.writeJSON(indexFile, index, { spaces: 2 });
    await fs.copy(path.join(t, "dist/brands/sample"), path.join(t, `dist/brands/${name}`));
    await fs.copy(path.join(t, "dist/css/brands/sample.css"), path.join(t, `dist/css/brands/${name}.css`));
    const css = await fs.readFile(path.join(t, `dist/css/brands/${name}.css`), "utf8");
    await fs.writeFile(path.join(t, `dist/css/brands/${name}.css`), css.replaceAll("sample", name));
    const pkg = (await fs.readJSON(path.join(t, "package.json"))) as { exports: Record<string, string> };
    pkg.exports[`./css/brands/${name}`] = `./dist/css/brands/${name}.css`;
    pkg.exports[`./brands/${name}/brand.json`] = `./dist/brands/${name}/brand.json`;
    await fs.writeJSON(path.join(t, "package.json"), pkg, { spaces: 2 });
  }

  it("미지원 1.2 → 빌드 전 1.3 은 not-built (WI-0085 원 재현, 고치기 전 unsupported)", async () => {
    const dir = await project({ tokens: "1.2" });
    expect(resolveTokens(dir)).toEqual({ status: "unsupported", version: "1.2.1" });
    await installTokens(dir, "1.3-unbuilt");
    expect(resolveTokens(dir)).toEqual({ status: "not-built", version: "1.3.0" });
    expect(listBrands(dir)).toEqual({ status: "not-built", version: "1.3.0", brands: [] });
  });

  it("미지원 1.2 → 정상 1.3 은 ok 이고 브랜드 상세도 읽음(고치기 전 unsupported)", async () => {
    const dir = await project({ tokens: "1.2" });
    expect(listBrands(dir).status).toBe("unsupported");
    await installTokens(dir, "1.3");
    const list = listBrands(dir);
    expect(list.status).toBe("ok");
    expect(list.brands.map((b) => b.name)).toEqual(["sample"]);
    const got = getBrand(dir, "sample");
    expect(got.status).toBe("ok");
    expect(got.brand?.name).toBe("sample");
  });

  it("정상 1.3 → 미지원 1.2 는 unsupported (고치기 전 not-built)", async () => {
    const dir = await project({ tokens: "1.3" });
    expect(resolveTokens(dir).status).toBe("ok");
    await installTokens(dir, "1.2");
    expect(resolveTokens(dir)).toEqual({ status: "unsupported", version: "1.2.1" });
    expect(getBrand(dir, "sample")).toEqual({ status: "unsupported", version: "1.2.1", brand: null, available: [] });
  });

  it("같은 version 에 브랜드가 추가되면(exports 키 추가) 새 브랜드를 읽음(고치기 전 ERR_PACKAGE_PATH_NOT_EXPORTED 로 던짐)", async () => {
    const dir = await project({ tokens: "1.3" });
    expect(listBrands(dir).brands.map((b) => b.name)).toEqual(["sample"]);
    await addBrand(dir, "zeta");
    expect(listBrands(dir).brands.map((b) => b.name)).toEqual(["sample", "zeta"]);
    const got = getBrand(dir, "zeta");
    expect(got.status).toBe("ok");
    expect(got.brand?.importPath).toBe("@axis-ds/tokens/css/brands/zeta");
  });

  it("두 번 바뀌어도(1.2 → 빌드 전 1.3 → 정상 1.3) 마지막 상태를 따라감", async () => {
    const dir = await project({ tokens: "1.2" });
    expect(resolveTokens(dir).status).toBe("unsupported");
    await installTokens(dir, "1.3-unbuilt");
    expect(resolveTokens(dir).status).toBe("not-built");
    await installTokens(dir, "1.3");
    expect(resolveTokens(dir).status).toBe("ok");
    await installTokens(dir, "1.2");
    expect(resolveTokens(dir).status).toBe("unsupported");
  });

  it("package.json 이 첫 해석과 같으면 격리 해석을 하지 않음(지우고 같은 내용으로 다시 설치해도)", async () => {
    const dir = await project({ tokens: "1.3" });
    const before = isolatedResolveStats().workers;
    expect(listBrands(dir).status).toBe("ok");
    expect(getBrand(dir, "sample").status).toBe("ok");
    await installTokens(dir, "1.3");
    expect(listBrands(dir).status).toBe("ok");
    expect(isolatedResolveStats().workers).toBe(before);
  });

  it("package.json 이 바뀐 뒤에는 그 호출을 격리 해석하고(호출 하나에 Worker 하나), 결과는 새 경로의 첫 판정과 같음", async () => {
    const dir = await project({ tokens: "1.2" });
    expect(listBrands(dir).status).toBe("unsupported");
    await installTokens(dir, "1.3");
    const before = isolatedResolveStats();
    const got = getBrand(dir, "sample");
    const after = isolatedResolveStats();
    expect(after.workers - before.workers).toBe(1);
    expect(after.resolves - before.resolves).toBeGreaterThanOrEqual(3);
    const fresh = await project({ tokens: "1.3" });
    expect(JSON.stringify(got).split(dir).join("<D>")).toBe(JSON.stringify(getBrand(fresh, "sample")).split(fresh).join("<D>"));
  });

  it("격리 해석을 만들 수 없으면 종전 Node 해석으로 판정하고 stale 를 표시 (Q83)", async () => {
    const dir = await project({ tokens: "1.2" });
    expect(listBrands(dir).status).toBe("unsupported");
    await installTokens(dir, "1.3-unbuilt");
    setIsolatedResolveFactoryForTest(() => {
      throw new Error("worker 를 만들 수 없음(테스트 주입)");
    });
    const before = isolatedResolveStats().fallbacks;
    expect(listBrands(dir)).toEqual({ status: "unsupported", version: "1.3.0", brands: [], stale: true });
    expect(getBrand(dir, "sample")).toEqual({ status: "unsupported", version: "1.3.0", brand: null, available: [], stale: true });
    expect(isolatedResolveStats().fallbacks - before).toBe(2);
  });

  it("중첩 설치본을 지워 상위 설치본으로 넘어가도 새 경로의 판정과 같음(반박 검증 결함 1)", async () => {
    const root = await project({ tokens: "1.3" });
    const app = path.join(root, "apps", "a");
    await fs.ensureDir(app);
    await fs.writeJSON(path.join(app, "package.json"), { name: "a", private: true });
    await installTokens(app, "1.3");
    expect(resolveTokens(app).indexPath).toBe(path.join(app, "node_modules/@axis-ds/tokens/dist/brands/index.json"));
    await installTokens(app, "none");
    const r = resolveTokens(app);
    expect(r).toEqual({
      status: "ok",
      version: "1.3.0",
      indexPath: path.join(root, "node_modules/@axis-ds/tokens/dist/brands/index.json"),
    });
    expect(listBrands(app).brands.map((b) => b.name)).toEqual(["sample"]);
  });

  it("격리 해석을 못 하는 중에 브랜드가 추가되면 그 항목만 빼고 stale 로 돌려줌(도구 오류로 끝나지 않음, 반박 검증 결함 2)", async () => {
    const dir = await project({ tokens: "1.3" });
    expect(listBrands(dir).status).toBe("ok");
    await addBrand(dir, "zeta");
    setIsolatedResolveFactoryForTest(() => {
      throw new Error("worker 를 만들 수 없음(테스트 주입)");
    });
    const list = listBrands(dir);
    expect(list.stale).toBe(true);
    expect(list.status).toBe("ok");
    expect(list.brands.map((b) => b.name)).toEqual(["sample"]);
    expect(getBrand(dir, "zeta")).toEqual({ status: "ok", version: "1.3.0", brand: null, available: ["sample"], stale: true });
    expect(getBrand(dir, "sample").brand?.name).toBe("sample");
  });

  it("Worker 가 시작 중에 죽거나 던져도 프로세스는 살아 있고 stale 폴백, 그 뒤로는 Worker 를 다시 만들지 않음(반박 검증 위험 2 · 3)", async () => {
    for (const source of ['throw new Error("boom at startup")', "process.exit(3)"]) {
      setIsolatedResolveFactoryForTest((from) => workerResolveSessionForTest(from, source, 300));
      const dir = await project({ tokens: "1.2" });
      expect(listBrands(dir).status).toBe("unsupported");
      await installTokens(dir, "1.3");
      const before = isolatedResolveStats();
      const first = listBrands(dir);
      expect(first).toEqual({ status: "unsupported", version: "1.3.0", brands: [], stale: true });
      expect(isolatedResolveStats().workers - before.workers).toBe(1);
      const second = getBrand(dir, "sample");
      expect(second.stale).toBe(true);
      expect(isolatedResolveStats().workers - before.workers).toBe(1);
      // Worker 의 비동기 'error' 가 처리되지 않은 오류로 올라오는지 잠깐 기다려 봐요(올라오면 vitest 가 실패로 잡음)
      await new Promise((r) => setTimeout(r, 200));
    }
  });

  it("기록한 뒤 Node 가 읽기 전에 package.json 이 바뀌는 경합이면 격리 해석으로 다시 판정하고, 그 경로는 늘 격리 해석(반박 검증 위험 1)", async () => {
    const dir = await project({ tokens: "1.2" });
    const pkgFile = path.join(dir, "node_modules/@axis-ds/tokens/package.json");
    const original = nodeFs.readFileSync;
    let armed = true;
    // brand-core 가 1.2 package.json 을 읽은 직후 1.3 설치가 끝난 것처럼 만들어요(Node 는 1.3 을 읽음)
    nodeFs.readFileSync = function (this: unknown, ...args: Parameters<typeof original>) {
      const out = original.apply(this, args);
      if (armed && String(args[0]) === pkgFile) {
        armed = false;
        fs.removeSync(path.join(dir, "node_modules/@axis-ds/tokens"));
        fs.copySync(path.join(THEME_FIXTURES_DIR, "tokens-1.3/pkg"), path.join(dir, "node_modules/@axis-ds/tokens"));
        fs.moveSync(path.join(dir, "node_modules/@axis-ds/tokens/_dist"), path.join(dir, "node_modules/@axis-ds/tokens/dist"));
      }
      return out;
    } as typeof original;
    syncBuiltinESMExports();
    let raced;
    try {
      raced = resolveTokens(dir);
    } finally {
      nodeFs.readFileSync = original;
      syncBuiltinESMExports();
    }
    expect(armed).toBe(false);
    expect(raced).toEqual({ status: "ok", version: "1.3.0", indexPath: path.join(dir, "node_modules/@axis-ds/tokens/dist/brands/index.json") });
    await installTokens(dir, "1.2");
    expect(resolveTokens(dir)).toEqual({ status: "unsupported", version: "1.2.1" });
  });

  it("처음 보는 경로에는 stale 필드가 없음(CLI 결과 객체 불변)", async () => {
    const dir = await project({ tokens: "1.3" });
    expect(Object.keys(listBrands(dir)).sort()).toEqual(["brands", "status", "version"]);
    expect(Object.keys(resolveTokens(dir)).sort()).toEqual(["indexPath", "status", "version"]);
  });
});
