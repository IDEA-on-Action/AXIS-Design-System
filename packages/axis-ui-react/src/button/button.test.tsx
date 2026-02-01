import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { Button } from "./index";

describe("Button", () => {
  it("기본 렌더링 - button 태그와 텍스트 내용 표시", () => {
    render(<Button>클릭</Button>);
    const button = screen.getByRole("button", { name: "클릭" });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe("BUTTON");
  });

  it("variant=default 시 기본 variant 클래스 포함", () => {
    const { container } = render(<Button variant="default">기본</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("bg-[var(--axis-button-bg-default)]");
  });

  it("variant=secondary 시 secondary 클래스 포함", () => {
    const { container } = render(<Button variant="secondary">보조</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("bg-[var(--axis-button-secondary-bg-default)]");
  });

  it("variant=ghost 시 ghost 클래스 포함", () => {
    const { container } = render(<Button variant="ghost">고스트</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("bg-[var(--axis-button-ghost-bg-default)]");
  });

  it("variant=destructive 시 destructive 클래스 포함", () => {
    const { container } = render(<Button variant="destructive">삭제</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("bg-[var(--axis-button-destructive-bg-default)]");
  });

  it("variant=outline 시 outline 클래스 포함", () => {
    const { container } = render(<Button variant="outline">아웃라인</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("border");
    expect(button.className).toContain("bg-transparent");
  });

  it("variant=link 시 link 클래스 포함", () => {
    const { container } = render(<Button variant="link">링크</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("underline-offset-4");
  });

  it("size=sm 시 sm 클래스 포함", () => {
    const { container } = render(<Button size="sm">작은</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("h-8");
    expect(button.className).toContain("px-3");
    expect(button.className).toContain("text-xs");
  });

  it("size=default 시 기본 크기 클래스 포함", () => {
    const { container } = render(<Button size="default">기본</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("h-10");
    expect(button.className).toContain("px-4");
  });

  it("size=lg 시 lg 클래스 포함", () => {
    const { container } = render(<Button size="lg">큰</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("h-12");
    expect(button.className).toContain("px-6");
  });

  it("size=icon 시 icon 클래스 포함", () => {
    const { container } = render(<Button size="icon">아이콘</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("h-10");
    expect(button.className).toContain("w-10");
  });

  it("disabled 상태 적용", () => {
    render(<Button disabled>비활성</Button>);
    const button = screen.getByRole("button", { name: "비활성" });
    expect(button).toBeDisabled();
  });

  it("onClick 핸들러 호출", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>클릭</Button>);
    fireEvent.click(screen.getByRole("button", { name: "클릭" }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>참조</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("asChild=true 시 Slot 동작 - 자식 요소로 렌더", () => {
    const { container } = render(
      <Button asChild>
        <a href="/test">링크 버튼</a>
      </Button>
    );
    const anchor = container.querySelector("a");
    expect(anchor).toBeInTheDocument();
    expect(anchor!.getAttribute("href")).toBe("/test");
    expect(anchor!.textContent).toBe("링크 버튼");
    // button 태그가 아닌 a 태그로 렌더링됨
    expect(container.querySelector("button")).toBeNull();
  });

  it("커스텀 className 병합", () => {
    const { container } = render(<Button className="my-custom-class">커스텀</Button>);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("my-custom-class");
    // 기본 클래스도 유지됨
    expect(button.className).toContain("inline-flex");
  });
});
