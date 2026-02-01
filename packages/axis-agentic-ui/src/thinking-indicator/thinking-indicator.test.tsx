import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ThinkingIndicator } from "./index";

describe("ThinkingIndicator", () => {
  it("기본 렌더링 시 role='status'를 가진다", () => {
    render(<ThinkingIndicator />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("기본 텍스트 '생각 중'을 표시한다", () => {
    render(<ThinkingIndicator />);
    expect(screen.getByText("생각 중")).toBeInTheDocument();
  });

  it("커스텀 텍스트를 표시한다", () => {
    render(<ThinkingIndicator text="분석 중" />);
    expect(screen.getByText("분석 중")).toBeInTheDocument();
  });

  it("aria-live='polite' 속성을 가진다", () => {
    render(<ThinkingIndicator />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("aria-label에 텍스트가 설정된다", () => {
    render(<ThinkingIndicator text="처리 중" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "처리 중");
  });

  it("애니메이션 dot 3개를 렌더한다", () => {
    const { container } = render(<ThinkingIndicator />);
    const dots = container.querySelectorAll(".animate-bounce");
    expect(dots).toHaveLength(3);
  });

  it("커스텀 className이 적용된다", () => {
    render(<ThinkingIndicator className="custom-class" />);
    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });
});
