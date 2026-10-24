import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axisAnimation } from "@axis-ds/tokens/tailwind";
import { Progress } from "./index";

/** 표시기(진행 막대 안쪽 div) */
function indicatorOf(bar: HTMLElement): HTMLElement {
  const el = bar.firstElementChild;
  if (!(el instanceof HTMLElement)) throw new Error("표시기 div 가 없음");
  return el;
}

describe("Progress (WI-0046)", () => {
  it("값이 있으면 표시기는 트랙 전체 폭이고 translateX 로 진행률을 보여 준다", () => {
    render(<Progress value={40} aria-label="업로드" />);
    const bar = screen.getByRole("progressbar", { name: "업로드" });
    const indicator = indicatorOf(bar);
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(indicator.className).toContain("w-full");
    expect(indicator.className).not.toContain("animate-progress-indeterminate");
    expect(indicator.style.transform).toBe("translateX(-60%)");
  });

  it("불확정이면 표시기 폭이 1/3 이고 progress-indeterminate 애니메이션을 쓴다(꽉 찬 막대로 보이지 않음)", () => {
    render(<Progress indeterminate aria-label="불러오는 중" />);
    const bar = screen.getByRole("progressbar", { name: "불러오는 중" });
    const indicator = indicatorOf(bar);
    expect(bar).not.toHaveAttribute("aria-valuenow");
    const classes = indicator.className.split(/\s+/);
    expect(classes).toContain("w-1/3");
    // tailwind-merge 가 기본 w-full 을 지워야 폭이 1/3 이 된다
    expect(classes).not.toContain("w-full");
    expect(classes).toContain("animate-progress-indeterminate");
    // 움직임 줄이기: 멈추지 않고 느리게(토큰 1.5s 의 2~3배) 왕복한다(WI-0071)
    expect(classes).not.toContain("motion-reduce:!animate-none");
    expect(classes).toContain("motion-reduce:![animation-duration:4s]");
    // tailwindcss-animate 가 duration-300 을 animation-duration 에 적용하지 않도록 같은 값으로 덮는다
    expect(classes).toContain("duration-[1500ms]");
    expect(classes).not.toContain("duration-300");
    expect(indicator.style.transform).toBe("");
  });

  it("덮어쓰는 duration 이 토큰 axisAnimation 의 progress-indeterminate 길이와 같다", () => {
    const m = /^progress-indeterminate (\d+(?:\.\d+)?)(ms|s) /.exec(axisAnimation["progress-indeterminate"]);
    expect(m).not.toBeNull();
    const ms = m![2] === "s" ? Number(m![1]) * 1000 : Number(m![1]);
    render(<Progress indeterminate aria-label="토큰 대조" />);
    const indicator = indicatorOf(screen.getByRole("progressbar", { name: "토큰 대조" }));
    expect(indicator.className.split(/\s+/)).toContain(`duration-[${ms}ms]`);
  });
});
