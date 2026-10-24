// @vitest-environment node
/**
 * 움직임 줄이기(prefers-reduced-motion) 회귀 방지 (WI-0046 · WI-0071)
 *
 * 컴포넌트 소스의 문자열 리터럴(큰따옴표 · 작은따옴표 · 백틱) 중 animate-* 유틸리티(animate-none 제외)를 쓰는 것은
 * 애니메이션 이름에 따라 둘 중 하나를 같은 문자열에 가져야 한다(WI-0071 PRD 분류표).
 *
 * - stop(열고 닫기 · Accordion · 장식성 전환): `motion-reduce:!animate-none`. `!` 가 필요한 이유는
 *   `data-[state=open]:animate-in` 처럼 속성 변형이 붙은 규칙의 명시도가 클래스 2개라서다.
 * - slow(로딩 · 진행 표시): 멈추지 않고 `motion-reduce:![animation-duration:<값>]` 으로 기본 주기의 2~3배로 느려진다.
 *   멈추면 처리 중 표시가 멈춰 앱이 응답하지 않는 것처럼 보이기 때문이다(2026-10-25 사용자 결정).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { axisAnimation } from "@axis-ds/tokens/tailwind";

const SRC = fileURLToPath(new URL(".", import.meta.url));
const ANIMATE = /(?:^|[\s:])animate-(?!none\b)([a-z][a-z0-9-]*)/g;
const STOP_CLASS = "motion-reduce:!animate-none";
const SLOW_CLASS = /(?:^|\s)motion-reduce:!\[animation-duration:(\d+(?:\.\d+)?)(ms|s)\](?=\s|$)/;

/** 토큰 animation 값("이름 1.5s ...")의 길이(ms) */
function tokenMs(name: string): number {
  const m = /^\S+ (\d+(?:\.\d+)?)(ms|s) /.exec(axisAnimation[name as keyof typeof axisAnimation] ?? "");
  if (!m) throw new Error(`토큰 axisAnimation 에 ${name} 길이가 없음`);
  return m[2] === "s" ? Number(m[1]) * 1000 : Number(m[1]);
}

/** stop 대상 애니메이션 이름 */
const STOP = new Set(["in", "out", "accordion-up", "accordion-down"]);
/** slow 대상 애니메이션 이름과 기본 주기(ms). spin · pulse · bounce 는 Tailwind 3.4 · 4.1 기본값(빌드 CSS 실측) */
const SLOW: Record<string, number> = {
  spin: 1000,
  pulse: 2000,
  bounce: 1000,
  "progress-indeterminate": tokenMs("progress-indeterminate"),
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(e.name) && !/\.(test|stories)\.tsx?$/.test(e.name) ? [p] : [];
  });
}

/**
 * 소스의 문자열 리터럴을 모두 꺼낸다. 주석은 건너뛰고, 따옴표 문자열은 줄을 넘지 않는다
 * (JSX 본문의 아포스트로피가 문자열로 잡히지 않게). 한계: 한 줄의 JSX 본문에 아포스트로피가 둘 있으면 그 사이를
 * 문자열로 읽는다(잘못 잡혀 실패하는 쪽이라 조용히 놓치지 않음). 백틱은 여러 줄과 ${...} 를 포함한 원문 전체를 하나로 본다.
 */
function stringLiterals(src: string): Array<{ line: number; text: string }> {
  const out: Array<{ line: number; text: string }> = [];
  let i = 0;
  let line = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "\n") {
      line++;
      i++;
    } else if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      for (let k = i; k < stop; k++) if (src[k] === "\n") line++;
      i = stop;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      let text = "";
      while (j < n && src[j] !== c && src[j] !== "\n") {
        if (src[j] === "\\") {
          text += src[j + 1] ?? "";
          j += 2;
        } else text += src[j++];
      }
      if (src[j] === c) {
        out.push({ line, text });
        i = j + 1;
      } else i++; // 닫히지 않은 따옴표(JSX 본문 등): 문자열이 아님
    } else if (c === "`") {
      const startLine = line;
      let j = i + 1;
      let depth = 0;
      let text = "";
      while (j < n) {
        const d = src[j];
        if (d === "\\") {
          text += src[j + 1] ?? "";
          j += 2;
          continue;
        }
        if (depth === 0 && d === "`") break;
        if (d === "$" && src[j + 1] === "{") depth++;
        else if (d === "}" && depth > 0) depth--;
        if (d === "\n") line++;
        text += d;
        j++;
      }
      out.push({ line: startLine, text });
      i = j + 1;
    } else i++;
  }
  return out;
}

interface Found {
  where: string;
  text: string;
  names: string[];
}

/** animate-* 를 쓰는 문자열 리터럴 목록 (파일:줄) */
function animatedLiterals(): Found[] {
  const out: Found[] = [];
  for (const file of sourceFiles(SRC)) {
    for (const lit of stringLiterals(readFileSync(file, "utf8"))) {
      const names = [...lit.text.matchAll(ANIMATE)].map((m) => m[1]);
      if (names.length) out.push({ where: `${relative(SRC, file)}:${lit.line}`, text: lit.text, names });
    }
  }
  return out;
}

/** 리터럴 하나의 위반 사유(없으면 빈 배열) */
function violations(f: Found): string[] {
  const out: string[] = [];
  for (const name of f.names) {
    if (STOP.has(name)) {
      if (!f.text.includes(STOP_CLASS)) out.push(`${f.where} animate-${name}: stop 대상인데 ${STOP_CLASS} 없음`);
    } else if (name in SLOW) {
      if (f.text.includes(STOP_CLASS)) out.push(`${f.where} animate-${name}: slow 대상인데 멈춤`);
      const m = SLOW_CLASS.exec(f.text);
      if (!m) {
        out.push(`${f.where} animate-${name}: slow 대상인데 motion-reduce:![animation-duration:..] 없음`);
        continue;
      }
      const ms = m[2] === "s" ? Number(m[1]) * 1000 : Number(m[1]);
      const ratio = ms / SLOW[name];
      if (ratio < 2 || ratio > 3) out.push(`${f.where} animate-${name}: 주기 ${ms}ms 가 기본 ${SLOW[name]}ms 의 2~3배가 아님`);
    } else out.push(`${f.where} animate-${name}: 분류되지 않은 애니메이션(PRD 분류표에 추가)`);
  }
  return out;
}

const kind = (f: Found) => (f.names.some((n) => STOP.has(n)) ? "stop" : f.names.some((n) => n in SLOW) ? "slow" : "?");

describe("문자열 리터럴 스캐너", () => {
  it("큰따옴표 · 작은따옴표 · 백틱(여러 줄 · ${}) 을 모두 꺼내고 주석과 JSX 아포스트로피는 건너뛴다", () => {
    const src = [
      `const a = "x animate-spin";`,
      `const b = 'y animate-pulse';`,
      "const c = `z ${cond ? \"q\" : ''}",
      "  animate-bounce`;",
      `// "animate-in 주석"`,
      `/* 'animate-out' */`,
      `const d = <p>don't animate-ping</p>;`,
    ].join("\n");
    const lits = stringLiterals(src);
    const texts = lits.map((l) => l.text);
    expect(texts).toContain("x animate-spin");
    expect(texts).toContain("y animate-pulse");
    expect(lits.find((l) => l.text.includes("animate-bounce"))?.line).toBe(3);
    expect(texts.some((t) => t.includes("animate-in") || t.includes("animate-out"))).toBe(false);
    expect(texts.some((t) => t.includes("animate-ping"))).toBe(false);
  });

  it("음성 대조: 작은따옴표 · 백틱 안의 멈추지 않는 stop 대상 · 멈추는 slow 대상을 잡는다", () => {
    const f = (text: string): Found => ({ where: "fixture:1", text, names: [...text.matchAll(ANIMATE)].map((m) => m[1]) });
    const lits = stringLiterals("const a = 'data-[state=open]:animate-in';\nconst b = `animate-spin motion-reduce:!animate-none`;");
    // 두 리터럴 모두 위반(b 는 멈춤 · 주기 없음 두 사유)
    expect(lits.filter((l) => violations(f(l.text)).length > 0).length).toBe(2);
    // 주기가 기본과 같거나 너무 길면 실패
    expect(violations(f("animate-spin motion-reduce:![animation-duration:1s]")).length).toBe(1);
    expect(violations(f("animate-pulse motion-reduce:![animation-duration:9s]")).length).toBe(1);
    expect(violations(f("animate-ping motion-reduce:!animate-none")).length).toBe(1);
    expect(violations(f("animate-spin motion-reduce:![animation-duration:3s]"))).toEqual([]);
  });
});

describe("animate-* 는 움직임 줄이기에서 분류대로 멈추거나 느려진다 (ui-react)", () => {
  const found = animatedLiterals();

  it("양성 대조: 스캔이 PRD 분류표의 리터럴을 모두 찾는다(stop 11 · slow 2)", () => {
    // 2026-10-25 기준: stop 11(열고 닫기 7개 컴포넌트 10 · accordion), slow 2(progress · skeleton)
    expect(found.filter((f) => kind(f) === "stop").length).toBe(11);
    expect(found.filter((f) => kind(f) === "slow").map((f) => f.where.split(":")[0]).sort()).toEqual([
      "progress/index.tsx",
      "skeleton/index.tsx",
    ]);
  });

  it("모든 animate-* 리터럴이 분류 규칙을 지킨다", () => {
    expect(found.flatMap(violations)).toEqual([]);
  });
});
