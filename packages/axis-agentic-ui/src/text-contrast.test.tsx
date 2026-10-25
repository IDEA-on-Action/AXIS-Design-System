import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CodeBlock,
  ContextPanel,
  DiffViewer,
  TokenUsageIndicator,
  ToolCallCard,
} from "./index";

/**
 * WI-0062: 기본 테마 글자 대비를 소스 구조로 고정한다.
 * 토큰 값의 대비는 tokens 패키지 default-contrast.test 가 보고, 여기서는 「어떤 토큰을 어느 바탕 위 글자에 쓰는가」를 본다.
 *  ① 보조 글자(text-tertiary, 기본 라이트 흰 바탕 4.83)는 surface-default 위에만 둔다. surface-secondary(4.39) ·
 *     surface-tertiary(3.90) · diff 옅은 바탕(4.23) 위 보조 글자는 text-secondary 를 쓴다.
 *  ② 상태 색(status-* · diff-added · diff-removed)은 점 · 막대 · 아이콘 색이라 글자에 직접 쓰지 않는다(D1 (가)).
 *     상태를 글자로 보일 때는 text-success · text-warning · text-error · text-info 를 쓴다.
 * jsdom 은 대비를 계산하지 못하므로 클래스 구조만 본다. 실제 대비는 문서 사이트 axe(브라우저)에서 잰다.
 */

const TERTIARY = "text-[var(--axis-text-tertiary)]";
/** 정규식 안의 변수 접두. check-token-refs 가 정규식 조각을 토큰 참조로 읽지 않게 문자열로 잇는다 */
const AX = ["--", "axis-"].join("");
const SURFACE_BG = new RegExp(String.raw`^bg-\[var\(${AX}(surface-[a-z]+)\)\]$`);
const MIX_BG = new RegExp(String.raw`^bg-\[color:color-mix\(in_srgb,var\((${AX}[\w-]+)\)_\d+%,transparent\)\]$`);
const STATUS_TEXT = new RegExp(String.raw`^text-\[var\(${AX}(status-(?:success|error|warning|running|info|neutral)|diff-added|diff-removed)\)\]$`);

/** 가장 가까운 조상(자기 포함)의 불투명 · 옅은 바탕 이름. 변형 접두(hover: 등)는 평소 바탕이 아니라 보지 않는다 */
function nearestBackground(el: Element | null): string {
  for (let node = el; node; node = node.parentElement) {
    for (const cls of Array.from(node.classList)) {
      const m = SURFACE_BG.exec(cls);
      if (m) return m[1];
      const mix = MIX_BG.exec(cls);
      if (mix) return `mix(${mix[1]})`;
    }
  }
  return "none";
}

const TEXT_COLOR = new RegExp(String.raw`^text-\[var\((${AX}[\w-]+)\)\]$`);

/** 보이는 글자 노드(공백 · sr-only 제외)마다 그 색을 정하는 가장 가까운 조상의 글자 색 클래스 */
function visibleTextColors(root: Element): Array<{ text: string; cls: string }> {
  const out: Array<{ text: string; cls: string }> = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = (n.textContent ?? "").trim();
    if (!text) continue;
    let cls = "";
    let hidden = false;
    for (let el = n.parentElement; el && el !== root.parentElement; el = el.parentElement) {
      if (el.classList.contains("sr-only")) hidden = true;
      if (!cls) cls = Array.from(el.classList).find((c) => TEXT_COLOR.test(c)) ?? "";
    }
    if (!hidden && cls) out.push({ text, cls });
  }
  return out;
}

const cases: Array<[string, () => JSX.Element]> = [
  ["DiffViewer unified", () => <DiffViewer filename="a.ts" before={"a\nb\nc"} after={"a\nB\nc\nd"} />],
  ["DiffViewer split", () => <DiffViewer filename="a.ts" viewMode="split" before={"a\nb\nc"} after={"a\nB\nc\nd"} />],
  [
    "ContextPanel 펼침",
    () => (
      <ContextPanel
        defaultExpanded
        modelInfo={{ name: "claude", provider: "Anthropic", version: "4.5" }}
        systemPrompt="sp"
        settings={{ t: "1" }}
      />
    ),
  ],
  ["CodeBlock 언어 · 줄 번호", () => <CodeBlock code={"a\nb"} language="ts" filename="a.ts" showLineNumbers />],
  ["ToolCallCard 소요 시간", () => <ToolCallCard toolName="t" status="success" duration={12} description="d" />],
  ["TokenUsage 경고 compact", () => <TokenUsageIndicator current={85} max={100} compact />],
  ["TokenUsage 초과 compact", () => <TokenUsageIndicator current={120} max={100} compact />],
  ["TokenUsage 경고", () => <TokenUsageIndicator current={85} max={100} />],
  ["TokenUsage 초과", () => <TokenUsageIndicator current={120} max={100} cost={0.1} />],
];

describe("기본 테마 글자 대비 구조 (WI-0062)", () => {
  it("검사 대상이 실제로 그려진다 (양성 대조: 보조 글자 · 상태 글자 후보가 있다)", () => {
    let tertiary = 0;
    let text = 0;
    for (const [, ui] of cases) {
      const { container, unmount } = render(ui());
      tertiary += container.querySelectorAll(`[class~="${TERTIARY}"]`).length;
      text += Array.from(container.querySelectorAll("[class]")).filter((el) => new RegExp(String.raw`(^|\s)text-\[var\(${AX}text-`).test(el.getAttribute("class") ?? "")).length;
      unmount();
    }
    expect(tertiary).toBeGreaterThan(0);
    expect(text).toBeGreaterThan(10);
  });

  for (const [name, ui] of cases) {
    it(`${name}: 보조 글자는 surface-default 위에만 있다`, () => {
      const { container } = render(ui());
      const bad = Array.from(container.querySelectorAll(`[class~="${TERTIARY}"]`))
        .map((el) => ({ el, bg: nearestBackground(el) }))
        .filter(({ bg }) => bg !== "surface-default" && bg !== "none")
        .map(({ el, bg }) => `${el.tagName.toLowerCase()} "${el.textContent?.trim()}" on ${bg}`);
      expect(bad).toEqual([]);
    });

    it(`${name}: 상태 색을 글자에 직접 쓰지 않는다`, () => {
      const { container } = render(ui());
      const bad = visibleTextColors(container)
        .filter(({ cls }) => STATUS_TEXT.test(cls))
        .map(({ text, cls }) => `"${text}" ${cls}`);
      expect(bad).toEqual([]);
    });
  }
});
