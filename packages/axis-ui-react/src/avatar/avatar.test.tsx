import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { Avatar } from "./index";

describe("Avatar", () => {
  it("src 있을 때 img 렌더", () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="사용자" />);
    const img = screen.getByRole("img", { name: "사용자" });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("https://example.com/photo.jpg");
  });

  it("src 없을 때 alt에서 이니셜 fallback 표시 (John Doe -> JD)", () => {
    render(<Avatar alt="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("src 없을 때 한글 이름 이니셜 추출 (홍 길동 -> 홍길)", () => {
    render(<Avatar alt="홍 길동" />);
    expect(screen.getByText("홍길")).toBeInTheDocument();
  });

  it("fallback prop이 alt 이니셜보다 우선", () => {
    render(<Avatar alt="John Doe" fallback="AB" />);
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.queryByText("JD")).toBeNull();
  });

  it("alt 없을 때 '?' 표시", () => {
    render(<Avatar />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("img 로드 에러 시 fallback으로 전환", () => {
    render(<Avatar src="https://example.com/broken.jpg" alt="Test User" />);
    const img = screen.getByRole("img");
    fireEvent.error(img);
    // 에러 후 이니셜 fallback 표시
    expect(screen.getByText("TU")).toBeInTheDocument();
    // img는 더 이상 없음
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("size=sm 시 sm 클래스 포함", () => {
    const { container } = render(<Avatar size="sm" alt="A" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("h-8");
    expect(wrapper.className).toContain("w-8");
  });

  it("size=default 시 기본 크기 클래스 포함", () => {
    const { container } = render(<Avatar size="default" alt="A" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("h-10");
    expect(wrapper.className).toContain("w-10");
  });

  it("size=lg 시 lg 클래스 포함", () => {
    const { container } = render(<Avatar size="lg" alt="A" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("h-12");
    expect(wrapper.className).toContain("w-12");
  });

  it("size=xl 시 xl 클래스 포함", () => {
    const { container } = render(<Avatar size="xl" alt="A" />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("h-16");
    expect(wrapper.className).toContain("w-16");
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Avatar ref={ref} alt="Ref Test" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
