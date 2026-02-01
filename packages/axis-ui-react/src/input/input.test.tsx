import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { Input } from "./index";

describe("Input", () => {
  it("기본 렌더링 - input 태그 표시", () => {
    render(<Input />);
    const input = screen.getByRole("textbox");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("type 속성 전달", () => {
    render(<Input type="email" />);
    const input = document.querySelector('input[type="email"]');
    expect(input).toBeInTheDocument();
  });

  it("placeholder 표시", () => {
    render(<Input placeholder="이메일을 입력하세요" />);
    const input = screen.getByPlaceholderText("이메일을 입력하세요");
    expect(input).toBeInTheDocument();
  });

  it("disabled 상태 적용", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("error prop 시 에러 클래스 포함", () => {
    const { container } = render(<Input error />);
    const input = container.querySelector("input")!;
    expect(input.className).toContain("border-[var(--axis-input-border-error)]");
  });

  it("error prop 없을 때 에러 클래스 미포함", () => {
    const { container } = render(<Input />);
    const input = container.querySelector("input")!;
    expect(input.className).not.toContain("border-[var(--axis-input-border-error)]");
  });

  it("onChange 핸들러 호출", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "테스트" } });
    expect(handleChange).toHaveBeenCalledOnce();
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("커스텀 className 병합", () => {
    const { container } = render(<Input className="my-custom-class" />);
    const input = container.querySelector("input")!;
    expect(input.className).toContain("my-custom-class");
    // 기본 클래스도 유지됨
    expect(input.className).toContain("rounded-md");
  });
});
