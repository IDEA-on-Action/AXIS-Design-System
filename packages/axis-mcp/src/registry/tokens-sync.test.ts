/**
 * WI-0076: MCP 토큰 데이터가 @axis-ds/tokens 빌드 산출물과 일치하는지 검사합니다.
 *
 * vitest 는 src 에서 돌고 loader 는 dist/data 를 읽으므로, dist 의 생성본이 아니라 생성 함수를 직접 불러
 * tokens dist 와 비교합니다(dist 에 낡은 생성본이 남아 있어도 이 테스트는 그것을 보지 않음).
 * 기대값은 생성기의 파서를 다시 쓰지 않고 이 파일에서 따로 읽습니다(자기 증명 방지).
 * mcp test 는 turbo 에서 dependsOn ^build 라 tokens 가 먼저 빌드됩니다(packages/axis-mcp/turbo.json).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  GENERATED_CATEGORIES,
  buildTokenData,
  generateTokens,
  resolveTokenSources,
} from "./token-gen.mjs";
import { clearRegistryCache, setTokenData } from "./loader.js";
import { formatTokenDetail, handleGetToken } from "../tools/get.js";
import { formatTokenList, handleListTokens } from "../tools/list.js";
import { TOKEN_CATEGORIES, type TokenMeta } from "../types.js";

const here = dirname(fileURLToPath(import.meta.url));
const paths = resolveTokenSources();
const raw = {
  json: readFileSync(paths.json, "utf8"),
  variablesCss: readFileSync(paths.variablesCss, "utf8"),
  shadcnCss: readFileSync(paths.shadcnCss, "utf8"),
};

/** 기대값: 선택자 블록을 줄 단위로 읽습니다(생성기와 다른 방법) */
function cssVars(css: string, selector: ":root" | ".dark"): Record<string, string> {
  const out: Record<string, string> = {};
  let inside = false;
  for (const line of css.split("\n")) {
    if (!inside && line.trim().startsWith(selector) && line.includes("{")) {
      inside = true;
      continue;
    }
    if (inside && line.trim().startsWith("}")) break;
    if (!inside) continue;
    const m = /^\s*(--[\w-]+):\s*(.*);\s*$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const axisRoot = cssVars(raw.variablesCss, ":root");
const axisDark = cssVars(raw.variablesCss, ".dark");
const shadRoot = cssVars(raw.shadcnCss, ":root");
const shadDark = cssVars(raw.shadcnCss, ".dark");
const flatJson = JSON.parse(raw.json) as Record<string, string>;

/** shadcn 색 변수는 hsl() 로 감싼 값, --radius 는 그대로 */
const shadValue = (name: string, v: string) => (name === "--radius" ? v : `hsl(${v})`);

const generated = generateTokens(raw);
const byVar = new Map(generated.map((t) => [t.cssVariable, t]));

/** 1.3.5 동봉본 같은 과거 데이터와 생성본을 경로로 비교합니다(AC3) */
function diffAgainst(old: TokenMeta[], current: TokenMeta[]) {
  const find = (p: string) =>
    current.find((t) => t.path === p || (t.aliases ?? []).includes(p));
  const definedVars = new Set([...Object.keys(axisRoot), ...Object.keys(shadRoot)]);
  const valueDiff: string[] = [];
  const missing: string[] = [];
  const unknownVar: string[] = [];
  for (const t of old) {
    const now = find(t.path);
    if (!now) missing.push(t.path);
    else if (now.value !== t.value) valueDiff.push(t.path);
    if (t.cssVariable && !definedVars.has(t.cssVariable)) unknownVar.push(t.cssVariable);
  }
  return { valueDiff, missing, unknownVar };
}

describe("token-gen: tokens dist 와 일치 (AC1 · AC2 · AC4)", () => {
  it("원천을 실제로 읽었다(0건 비교 방지: 하한)", () => {
    // 2026-10-25 tokens 1.8.0 기준 variables.css 284 · shadcn 25. 줄면 원천을 잘못 읽은 것으로 봅니다
    expect(Object.keys(axisRoot).length).toBeGreaterThanOrEqual(284);
    expect(Object.keys(shadRoot).length).toBeGreaterThanOrEqual(25);
    expect(Object.keys(flatJson).length).toBe(Object.keys(axisRoot).length);
    expect(generated.length).toBe(Object.keys(axisRoot).length + Object.keys(shadRoot).length);
  });

  it("variables.css 의 모든 변수가 라이트 · 다크 값 그대로 한 번씩 나온다", () => {
    let compared = 0;
    for (const [name, value] of Object.entries(axisRoot)) {
      const t = byVar.get(name);
      expect(t, name).toBeDefined();
      expect(t!.value, name).toBe(value);
      expect(t!.dark, name).toBe(axisDark[name]);
      compared++;
    }
    expect(compared).toBeGreaterThanOrEqual(284);
  });

  it("shadcn-compat.css 의 모든 변수가 라이트 · 다크 값 그대로 한 번씩 나온다", () => {
    let compared = 0;
    for (const [name, value] of Object.entries(shadRoot)) {
      const t = byVar.get(name);
      expect(t, name).toBeDefined();
      expect(t!.value, name).toBe(shadValue(name, value));
      expect(t!.dark, name).toBe(shadValue(name, shadDark[name]));
      compared++;
    }
    expect(compared).toBeGreaterThanOrEqual(25);
  });

  it("tokens.json 의 모든 값이 같은 이름의 항목 값과 같다", () => {
    const flat = (s: string) => s.replace(/-/g, "").toLowerCase();
    const axisTokens = generated.filter((t) => t.cssVariable.startsWith("--axis-"));
    let compared = 0;
    for (const [key, value] of Object.entries(flatJson)) {
      const hit = axisTokens.filter((t) => flat(t.cssVariable.slice("--axis-".length)) === key.toLowerCase());
      expect(hit, key).toHaveLength(1);
      expect(hit[0].value, key).toBe(String(value));
      compared++;
    }
    expect(compared).toBeGreaterThanOrEqual(284);
  });

  it("모든 cssVariable 이 tokens CSS 에 실제로 정의돼 있다", () => {
    const defined = new Set([...Object.keys(axisRoot), ...Object.keys(shadRoot)]);
    const undefinedVars = generated.map((t) => t.cssVariable).filter((v) => !defined.has(v));
    expect(undefinedVars).toEqual([]);
  });

  it("값 예: colors.primary 가 1.3.5 의 낡은 값이 아니라 shadcn :root 값이다", () => {
    const primary = generated.find((t) => t.path === "colors.primary")!;
    expect(primary.value).toBe(`hsl(${shadRoot["--primary"]})`);
    expect(primary.value).not.toBe("hsl(222.2 47.4% 11.2%)");
    expect(primary.dark).toBe(`hsl(${shadDark["--primary"]})`);
  });

  it("1.3.5 경로 36개는 그대로, 원천이 없는 5개는 없다(D2 · D3)", () => {
    const old = JSON.parse(readFileSync(join(here, "../../test/fixtures/tokens-1.3.5.json"), "utf8"))
      .tokens as TokenMeta[];
    expect(old).toHaveLength(41);
    const removed = ["shadow.md", "animation.duration.fast", "animation.duration.normal", "animation.duration.slow", "animation.easing.default"];
    const paths = new Set(generated.map((t) => t.path));
    for (const t of old) {
      if (removed.includes(t.path)) expect(paths.has(t.path), t.path).toBe(false);
      else expect(paths.has(t.path), t.path).toBe(true);
    }
    // radius.md 는 --radius(0.5rem)가 아니라 --axis-radius-md 를 가리킨다
    expect(generated.find((t) => t.path === "radius.md")!.cssVariable).toBe("--axis-radius-md");
  });

  it("밀도 토큰을 tokens 이름 경로로 받고 카테고리는 types.ts 와 같다", () => {
    const density = generated.filter((t) => t.category === "density").map((t) => t.path);
    for (const p of ["control.h.md", "control.font.size.sm", "field.h", "toggle.h.lg", "table.head.font.size", "radius.control", "radius.field", "radius.surface"]) {
      expect(density, p).toContain(p);
    }
    expect([...GENERATED_CATEGORIES].sort()).toEqual([...TOKEN_CATEGORIES].sort());
    for (const c of TOKEN_CATEGORIES) {
      expect(generated.some((t) => t.category === c), c).toBe(true);
    }
  });

  it("경로 · 별칭이 겹치지 않는다", () => {
    const all = generated.flatMap((t) => [t.path, ...(t.aliases ?? [])].map((p) => p.toLowerCase()));
    expect(new Set(all).size).toBe(all.length);
  });

  it("buildTokenData 는 출처 버전을 함께 낸다", () => {
    const data = buildTokenData(paths);
    expect(data.source).toEqual({ package: "@axis-ds/tokens", version: paths.version });
    expect(data.tokens).toEqual(generated);
  });
});

describe("token-gen: 원천이 어긋나면 조용히 넘기지 않는다(변이 · 음성 대조)", () => {
  it("1.3.5 동봉본은 값 다름 16 · 없어진 토큰 5 · 없는 CSS 변수 4 로 잡힌다 (AC3)", () => {
    const old = JSON.parse(readFileSync(join(here, "../../test/fixtures/tokens-1.3.5.json"), "utf8"))
      .tokens as TokenMeta[];
    const r = diffAgainst(old, generated);
    expect(r.valueDiff).toHaveLength(16);
    expect(r.valueDiff).toEqual(expect.arrayContaining(["colors.primary", "colors.ring", "typography.fontFamily.sans", "shadow.lg"]));
    expect(r.valueDiff).not.toContain("colors.background");
    expect(r.missing.sort()).toEqual(
      ["animation.duration.fast", "animation.duration.normal", "animation.duration.slow", "animation.easing.default", "shadow.md"].sort()
    );
    expect(r.unknownVar.sort()).toEqual(["--radius-full", "--radius-lg", "--radius-none", "--radius-sm"]);
  });

  it("생성본 자신과 비교하면 0건(비교기 대조)", () => {
    const r = diffAgainst(generated, generated);
    expect(r).toEqual({ valueDiff: [], missing: [], unknownVar: [] });
  });

  it("json 값과 variables.css 값이 다르면 실패", () => {
    const json = JSON.stringify({ ...flatJson, ControlHMd: "9rem" });
    expect(() => generateTokens({ ...raw, json })).toThrow(/ControlHMd/);
  });

  it(".dark 블록이 없으면 실패", () => {
    const shadcnCss = raw.shadcnCss.replace(".dark {", ".night {");
    expect(() => generateTokens({ ...raw, shadcnCss })).toThrow(/\.dark/);
  });

  it("모르는 접두의 토큰이 생기면 분류를 요구하며 실패", () => {
    const json = JSON.stringify({ ...flatJson, MotionFast: "150ms" });
    const variablesCss = raw.variablesCss.replace(":root {", ":root {\n  --axis-motion-fast: 150ms;");
    expect(() => generateTokens({ ...raw, json, variablesCss })).toThrow(/motion/);
  });

  it("호환 경로의 원천 변수가 사라지면 실패", () => {
    const shadcnCss = raw.shadcnCss.replace(/\n\s*--ring:[^;]+;/g, "");
    expect(() => generateTokens({ ...raw, shadcnCss })).toThrow(/colors\.ring/);
  });

  it("tokens 를 찾지 못하면 0건 생성이 아니라 실패", () => {
    expect(() => resolveTokenSources("file:///nonexistent/dir/x.mjs")).toThrow();
  });
});

describe("axis.get_token · axis.list_tokens 응답 (AC5 · AC8)", () => {
  afterEach(() => {
    setTokenData(null);
    clearRegistryCache();
  });

  it("밀도 경로 · CSS 변수 이름 · 호환 경로의 별칭으로 찾고 다크 값을 보여준다", () => {
    setTokenData(buildTokenData(paths));
    const h = handleGetToken({ path: "control.h.md" })!;
    expect(h.value).toBe(axisRoot["--axis-control-h-md"]);
    expect(handleGetToken({ path: "--axis-control-h-md" })).toBe(h);
    expect(handleGetToken({ path: "space.4" })!.path).toBe("spacing.4");
    // 1.3.5 에 없던 같은 계열 토큰도 그 체계로 받는다(spacing.5 · typography.fontSize.3xl)
    expect(handleGetToken({ path: "spacing.5" })!.value).toBe(axisRoot["--axis-space-5"]);
    expect(handleGetToken({ path: "space.5" })!.path).toBe("spacing.5");
    expect(handleGetToken({ path: "typography.fontSize.3xl" })!.value).toBe(axisRoot["--axis-font-size-3xl"]);
    const text = formatTokenDetail(handleGetToken({ path: "colors.primary" }), "colors.primary");
    expect(text).toContain(`\`hsl(${shadRoot["--primary"]})\``);
    expect(text).toContain(`- **다크 값**: \`hsl(${shadDark["--primary"]})\``);
    expect(text).toContain("hsl(var(--primary))");
  });

  it("없는 경로는 null 이고 안내 문구에 경로와 브랜드 도구가 나온다", () => {
    setTokenData(buildTokenData(paths));
    expect(handleGetToken({ path: "animation.duration.fast" })).toBeNull();
    const text = formatTokenDetail(null, "brand.ontology");
    expect(text).toContain("토큰을 찾을 수 없습니다: `brand.ontology`");
    expect(text).toContain("axis.get_brand");
  });

  it("목록은 카테고리별 개수와 출처 버전을 보여준다", () => {
    setTokenData(buildTokenData(paths));
    const all = handleListTokens({});
    expect(all.totalCount).toBe(generated.length);
    const text = formatTokenList(all);
    expect(text).toContain(`@axis-ds/tokens ${paths.version}`);
    expect(text).toContain(`| **합계** | **${generated.length}** |`);
    expect(text).toContain("`control.h.md`");
    const density = handleListTokens({ category: "density" });
    expect(density.tokens.every((t) => t.category === "density")).toBe(true);
    expect(density.totalCount).toBe(generated.filter((t) => t.category === "density").length);
  });
});
