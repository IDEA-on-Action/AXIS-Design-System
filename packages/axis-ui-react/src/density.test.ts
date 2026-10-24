// @vitest-environment node
/**
 * 밀도 토큰 회귀 방지 (WI-0026)
 *
 * - AC3 정적 검사: Button · Input · Select · Toggle 소스에 고정 높이 클래스(h-8|9|10|11|12 · min-w-9|10|11)가 남지 않는다.
 *   앞뒤 경계를 두어 `max-h-96` · `h-4` · `h-3.5` 같은 다른 클래스는 잡지 않는다(아래 양성 · 음성 대조).
 * - fallback 정합: 컴포넌트 클래스의 `var(<밀도 변수>,<리터럴>)` fallback 이 tokens 기본값과 같은 길이다.
 *   기본값이 tokens(JSON → CSS)와 컴포넌트 두 곳에 있으므로, 한쪽만 바뀌면 여기서 빨개진다.
 *   둥글기 기본값은 `--radius`(shadcn-compat.css 0.5rem) 계산식이라 0.5rem 을 넣어 계산한다.
 * - 대상 범위: 밀도 토큰을 참조하는 파일은 정확히 7개(Sheet 제외 결정)이고, 토큰 15개를 빠짐없이 쓴다.
 * - 변수 이름은 `var(...)` 형태로만 적는다. scripts/check-token-refs.mjs 가 테스트 파일도 읽어, 그 밖의 형태는 「판정 불가」다.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { tokens } from "@axis-ds/tokens";

const SRC = fileURLToPath(new URL(".", import.meta.url));
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");

/** AC3 대상 4개 */
const AC3_FILES = ["button/index.tsx", "input/index.tsx", "select/index.tsx", "toggle/index.tsx"];
/** 밀도 토큰을 참조하는 파일(Q3 (나) 직접 참조 대상, Sheet 제외) */
const DENSITY_FILES = [...AC3_FILES, "table/index.tsx", "card/index.tsx", "dialog/index.tsx"];
const FIXED_SIZE = /(?<![\w-])(?:h-(?:8|9|10|11|12)|min-w-(?:9|10|11))(?![\w.[-])/g;

/** 밀도 토큰(`var(이름)`) → tokens JS export 경로 */
const DENSITY_TOKENS: Record<string, string[]> = {
  "var(--axis-control-h-sm)": ["control", "h", "sm"],
  "var(--axis-control-h-md)": ["control", "h", "md"],
  "var(--axis-control-h-lg)": ["control", "h", "lg"],
  "var(--axis-control-font-size-sm)": ["control", "font-size", "sm"],
  "var(--axis-control-font-size-md)": ["control", "font-size", "md"],
  "var(--axis-control-font-size-lg)": ["control", "font-size", "lg"],
  "var(--axis-field-h)": ["field", "h"],
  "var(--axis-toggle-h-sm)": ["toggle", "h", "sm"],
  "var(--axis-toggle-h-md)": ["toggle", "h", "md"],
  "var(--axis-toggle-h-lg)": ["toggle", "h", "lg"],
  "var(--axis-table-font-size)": ["table", "font-size"],
  "var(--axis-table-head-font-size)": ["table", "head", "font-size"],
  "var(--axis-radius-control)": ["radius", "control"],
  "var(--axis-radius-field)": ["radius", "field"],
  "var(--axis-radius-surface)": ["radius", "surface"],
};
/** 소스의 밀도 토큰 참조(이름 · fallback). 접두를 `--[a-z]+-` 로 두어 목록 밖 이름도 잡는다 */
const DENSITY_REF = /var\((--[a-z]+-(?:control|field|toggle|table)-[a-z-]+|--[a-z]+-radius-(?:control|field|surface))(?:,([^()\]]+))?\)/g;
const nameOf = (key: string) => key.slice("var(".length, -1);

/** 길이 문자열을 px 로. `--radius` 는 0.5rem(8px)으로 계산한다 */
function toPx(value: string): number {
  const v = value.trim().replace(/var\(--radius\)/g, "8px");
  const one = (s: string) => {
    const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(s.trim());
    if (!m) throw new Error(`길이로 읽을 수 없음: ${s}`);
    return m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]);
  };
  const calc = /^calc\((.+?)\s-\s(.+)\)$/.exec(v);
  return calc ? one(calc[1]) - one(calc[2]) : one(v);
}

function tokenValue(path: string[]): string {
  let cur: unknown = tokens;
  for (const key of path) cur = (cur as Record<string, unknown> | undefined)?.[key];
  if (typeof cur !== "string") throw new Error(`tokens 에 ${path.join(".")} 가 없음`);
  return cur;
}

describe("AC3 고정 크기 클래스 정적 검사", () => {
  it("검사 패턴 대조: 고정 크기는 잡고 접두 · 다른 크기는 잡지 않는다", () => {
    const hits = (s: string) => [...s.matchAll(FIXED_SIZE)].map((m) => m[0]);
    // 양성: 1.6.3 배포본의 클래스 문자열
    expect(hits('"h-8 px-3 text-xs" "h-10 w-10" "h-12" "h-9 px-2.5 min-w-9" "h-11 min-w-11"')).toEqual([
      "h-8", "h-10", "h-12", "h-9", "min-w-9", "h-11", "min-w-11",
    ]);
    // 음성: 같은 파일에 실제로 있는 다른 클래스
    expect(hits('"max-h-96 h-4 w-4 h-3.5 h-px h-[var(--axis-control-h-md,2.5rem)] min-w-[8rem]"')).toEqual([]);
  });

  it.each(AC3_FILES)("%s 에 고정 크기 클래스가 없다", (file) => {
    const src = read(file);
    expect(src.length).toBeGreaterThan(0);
    expect([...src.matchAll(FIXED_SIZE)].map((m) => m[0])).toEqual([]);
  });
});

describe("밀도 토큰 fallback 정합", () => {
  const uses = DENSITY_FILES.flatMap((file) =>
    [...read(file).matchAll(DENSITY_REF)].map((m) => ({ file, name: m[1], fallback: m[2] })),
  );

  it("참조가 읽힌다 (양성 대조: 0 이면 측정 실패)", () => {
    expect(uses.length).toBeGreaterThanOrEqual(20);
  });

  it("모든 참조에 리터럴 fallback 이 있다", () => {
    expect(uses.filter((u) => !u.fallback || u.fallback.includes("var(")).map((u) => `${u.file} ${u.name}`)).toEqual([]);
  });

  it("토큰 15개를 모두 쓰고 목록 밖 이름은 없다", () => {
    expect([...new Set(uses.map((u) => u.name))].sort()).toEqual(Object.keys(DENSITY_TOKENS).map(nameOf).sort());
  });

  it.each(Object.entries(DENSITY_TOKENS))("%s fallback 이 tokens 기본값과 같다", (key, path) => {
    const name = nameOf(key);
    const want = toPx(tokenValue(path));
    const mine = uses.filter((u) => u.name === name);
    expect(mine.length).toBeGreaterThan(0);
    for (const u of mine) expect([u.file, toPx(u.fallback!)]).toEqual([u.file, want]);
  });

  it("fallback 비교 대조: 기본값과 다른 fallback 은 다르게 읽힌다", () => {
    expect(toPx("calc(var(--radius) - 2px)")).toBe(6);
    expect(toPx("0.375rem")).toBe(6);
    expect(toPx("0.5rem")).not.toBe(toPx("calc(var(--radius) - 2px)"));
  });

  it("대상 밖 파일(Sheet 포함)은 밀도 토큰을 참조하지 않는다", () => {
    const others: string[] = [];
    for (const entry of readdirSync(SRC, { recursive: true }) as string[]) {
      if (!/\.tsx?$/.test(entry) || /\.test\.tsx?$/.test(entry)) continue;
      const rel = entry.split("\\").join("/");
      if (DENSITY_FILES.includes(rel)) continue;
      if (DENSITY_REF.test(read(rel))) others.push(rel);
      DENSITY_REF.lastIndex = 0;
    }
    expect(others).toEqual([]);
    expect([...read("sheet/index.tsx").matchAll(DENSITY_REF)]).toEqual([]);
  });
});
