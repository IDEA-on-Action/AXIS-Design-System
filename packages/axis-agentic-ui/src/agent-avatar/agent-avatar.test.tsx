import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AgentAvatar } from "./index";

describe("AgentAvatar", () => {
  it("기본 렌더링 시 role='img'를 가진다", () => {
    render(<AgentAvatar name="John Doe" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("이름의 이니셜을 표시한다 ('John Doe' → 'JD')", () => {
    render(<AgentAvatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("단일 이름의 이니셜을 표시한다 ('Alice' → 'A')", () => {
    render(<AgentAvatar name="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("세 단어 이름은 앞 두 글자만 이니셜로 표시한다 ('Kim Min Su' → 'KM')", () => {
    render(<AgentAvatar name="Kim Min Su" />);
    expect(screen.getByText("KM")).toBeInTheDocument();
  });

  it("src가 있으면 img 요소를 렌더한다", () => {
    render(<AgentAvatar name="John Doe" src="https://example.com/avatar.png" />);
    const img = screen.getByRole("img").querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("src가 없으면 이니셜 div를 렌더한다", () => {
    render(<AgentAvatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getByRole("img").querySelector("img")).not.toBeInTheDocument();
  });

  it("aria-label에 이름이 포함된다", () => {
    render(<AgentAvatar name="John Doe" />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "John Doe");
  });

  it("status가 있으면 aria-label에 상태가 포함된다", () => {
    render(<AgentAvatar name="John Doe" status="online" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "John Doe, 온라인"
    );
  });

  it("status='busy'일 때 aria-label에 '사용 중'이 포함된다", () => {
    render(<AgentAvatar name="John Doe" status="busy" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "John Doe, 사용 중"
    );
  });

  it("status가 있으면 상태 인디케이터 span이 존재한다", () => {
    const { container } = render(<AgentAvatar name="John Doe" status="online" />);
    const indicator = container.querySelector("span.absolute");
    expect(indicator).toBeInTheDocument();
  });

  it("status가 없으면 상태 인디케이터가 존재하지 않는다", () => {
    const { container } = render(<AgentAvatar name="John Doe" />);
    const indicator = container.querySelector("span.absolute");
    expect(indicator).not.toBeInTheDocument();
  });

  it("커스텀 className이 적용된다", () => {
    render(<AgentAvatar name="John Doe" className="custom-class" />);
    expect(screen.getByRole("img")).toHaveClass("custom-class");
  });
});
