import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AgentAvatar,
  ApprovalCard,
  AttachmentCard,
  FeedbackButtons,
  PlanCard,
  RecoveryBanner,
  RunProgress,
  StepTimeline,
  ToolCallCard,
} from "./index";

/**
 * WI-0063: 기본 테마 비텍스트 대비(WCAG 1.4.11)를 소스 구조로 고정한다(값의 대비는 tokens default-contrast.test).
 *  ① 아이콘 색 · 상태 점 바탕에 기본 흰 바탕 3:1 미만인 상태 색(status-success 2.28 · status-warning 1.91 ·
 *     status-neutral 2.54)을 쓰지 않는다. ontology 값이 같은 text-success · text-warning · text-tertiary 를 쓴다.
 *     (status-running · status-info 3.68, status-error 3.76 은 3:1 이상이라 그대로 둔다)
 *  ② 상태 아이콘 스피너(PlanCard · ToolCallCard)의 arc 는 불투명이다(opacity .75 합성 2.81).
 *     RunProgress 점 안 글리프는 짙은 글자(running-contrast)라 .75 합성도 4.49 여서 그대로 둔다.
 *  ③ 오류 테두리는 status-error-border(기본 red.200, 1.44) 대신 border-error 를 쓴다.
 * 막대 채움(h-full)은 진행률 글자가 함께 보여 이 검사에서 뺀다.
 */

/** 정규식 안의 변수 접두. check-token-refs 가 정규식 조각을 토큰 참조로 읽지 않게 문자열로 잇는다 */
const AX = ["--", "axis-"].join("");
const WEAK = "status-(?:success|warning|neutral)";
const WEAK_TEXT = new RegExp(String.raw`^text-\[var\(${AX}${WEAK}\)\]$`);
const WEAK_BG = new RegExp(String.raw`^bg-\[var\(${AX}${WEAK}\)\]$`);
const ERROR_BORDER = new RegExp(String.raw`^border-\[var\(${AX}status-error-border\)\]$`);
const TEXT_COLOR = new RegExp(String.raw`^text-\[var\(${AX}[\w-]+\)\]$`);

/** svg 의 색을 정하는 가장 가까운 조상(자기 포함)의 글자 색 클래스 */
function iconColor(svg: Element): string {
  for (let el: Element | null = svg; el; el = el.parentElement) {
    const cls = Array.from(el.classList).find((c) => TEXT_COLOR.test(c));
    if (cls) return cls;
  }
  return "";
}

const steps = (["pending", "running", "complete", "error"] as const).map((status, i) => ({
  id: `s${i}`,
  label: `단계 ${i}`,
  status,
}));
const noop = () => {};

const cases: Array<[string, () => JSX.Element]> = [
  ["PlanCard", () => <PlanCard title="계획" steps={[...steps, { id: "s9", label: "건너뜀", status: "skipped" }]} onApprove={noop} onReject={noop} />],
  ...(["pending", "running", "success", "error"] as const).map(
    (status): [string, () => JSX.Element] => [`ToolCallCard ${status}`, () => <ToolCallCard toolName="t" status={status} />],
  ),
  ...(["info", "warning", "error"] as const).map(
    (severity): [string, () => JSX.Element] => [`ApprovalCard ${severity}`, () => <ApprovalCard title="승인" severity={severity} actions={[{ label: "승인", onClick: noop }]} />],
  ),
  ...(["online", "busy", "offline"] as const).map(
    (status): [string, () => JSX.Element] => [`AgentAvatar ${status}`, () => <AgentAvatar name="A" status={status} />],
  ),
  ["StepTimeline", () => <StepTimeline steps={[...steps, { id: "s9", label: "건너뜀", status: "skipped" }]} />],
  ["RunProgress", () => <RunProgress status="running" steps={steps} currentStep={2} />],
  ["FeedbackButtons like", () => <FeedbackButtons messageId="m" initialFeedback="like" />],
  ["FeedbackButtons dislike", () => <FeedbackButtons messageId="m" initialFeedback="dislike" />],
  ["RecoveryBanner", () => <RecoveryBanner message="오류" onRetry={noop} />],
  ["AttachmentCard error", () => <AttachmentCard type="document" name="a.pdf" status="error" />],
];

describe("기본 테마 비텍스트 대비 구조 (WI-0063)", () => {
  it("검사 대상이 실제로 그려진다 (양성 대조: 아이콘 · 점 · 테두리)", () => {
    let svgs = 0;
    let dots = 0;
    let borders = 0;
    for (const [, ui] of cases) {
      const { container, unmount } = render(ui());
      svgs += container.querySelectorAll("svg").length;
      dots += Array.from(container.querySelectorAll(".rounded-full")).filter((el) => !el.classList.contains("h-full")).length;
      borders += Array.from(container.querySelectorAll("[class]")).filter((el) => Array.from(el.classList).some((c) => c.startsWith("border-[var("))).length;
      unmount();
    }
    expect(svgs).toBeGreaterThan(20);
    expect(dots).toBeGreaterThan(10);
    expect(borders).toBeGreaterThan(5);
  });

  for (const [name, ui] of cases) {
    it(`${name}: 아이콘 · 점 · 테두리에 3:1 미만 상태 색이 없다`, () => {
      const { container } = render(ui());
      const bad: string[] = [];
      for (const svg of Array.from(container.querySelectorAll("svg"))) {
        const c = iconColor(svg);
        if (WEAK_TEXT.test(c)) bad.push(`아이콘 ${c}`);
      }
      for (const el of Array.from(container.querySelectorAll("[class]"))) {
        const cls = Array.from(el.classList);
        if (!el.classList.contains("h-full") && cls.some((c) => WEAK_BG.test(c))) bad.push(`점 ${el.getAttribute("class")}`);
        if (cls.some((c) => ERROR_BORDER.test(c))) bad.push(`테두리 ${el.getAttribute("class")}`);
      }
      expect(bad).toEqual([]);
    });
  }

  for (const [name, ui] of [cases[0], cases[2]] as const) {
    it(`${name}: 상태 아이콘 스피너 arc 가 불투명이다`, () => {
      const { container } = render(ui());
      const spinners = Array.from(container.querySelectorAll("svg.animate-spin"));
      expect(spinners.length).toBeGreaterThan(0);
      for (const svg of spinners) {
        const arc = svg.querySelector("path");
        expect(arc?.getAttribute("class") ?? "").not.toMatch(/opacity-/);
      }
    });
  }
});
