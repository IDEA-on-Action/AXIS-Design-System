// @vitest-environment node
/**
 * 움직임 줄이기(prefers-reduced-motion) 회귀 방지 (WI-0046)
 *
 * 컴포넌트 소스의 문자열 리터럴 중 animate-* 유틸리티(animate-none 제외)를 쓰는 것은 같은 문자열에
 * `motion-reduce:!animate-none` 을 함께 가져야 한다. `!` 가 필요한 이유: `data-[state=open]:animate-in` 처럼
 * 속성 변형이 붙은 규칙은 명시도가 클래스 2개라 `motion-reduce:animate-none`(클래스 1개)이 이기지 못한다.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const SRC = fileURLToPath(new URL(".", import.meta.url));
const ANIMATE = /(?:^|[\s:])animate-(?!none\b)[a-z]/;
const REDUCE = "motion-reduce:!animate-none";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(e.name) && !/\.(test|stories)\.tsx?$/.test(e.name) ? [p] : [];
  });
}

/** animate-* 를 쓰는 문자열 리터럴 목록 (파일:줄) */
function animatedLiterals(): Array<{ where: string; text: string }> {
  const out: Array<{ where: string; text: string }> = [];
  for (const file of sourceFiles(SRC)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/"([^"\n]*)"/g)) {
        if (ANIMATE.test(m[1])) out.push({ where: `${relative(SRC, file)}:${i + 1}`, text: m[1] });
      }
    });
  }
  return out;
}

describe("animate-* 는 움직임 줄이기에서 멈춘다 (ui-react)", () => {
  const found = animatedLiterals();

  it("양성 대조: 스캔이 animate-* 리터럴을 찾는다(0건이면 스캔 실패)", () => {
    // 2026-10-24 기준 13곳(열고 닫기 7개 컴포넌트 10 · accordion · progress · skeleton)
    expect(found.length).toBeGreaterThanOrEqual(13);
    expect(found.some((f) => f.where.startsWith("dialog"))).toBe(true);
    expect(found.some((f) => f.where.startsWith("accordion"))).toBe(true);
    expect(found.some((f) => f.where.startsWith("progress"))).toBe(true);
  });

  it("모든 animate-* 리터럴이 motion-reduce:!animate-none 을 함께 가진다", () => {
    expect(found.filter((f) => !f.text.includes(REDUCE)).map((f) => f.where)).toEqual([]);
  });
});
