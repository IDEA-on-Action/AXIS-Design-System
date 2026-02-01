import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { Badge } from "./index";

describe("Badge", () => {
  it("기본 렌더링 - div 태그와 children 표시", () => {
    render(<Badge>기본 배지</Badge>);
    expect(screen.getByText("기본 배지")).toBeInTheDocument();
  });

  it("variant=default 시 기본 클래스 포함", () => {
    const { container } = render(<Badge variant="default">기본</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[var(--axis-badge-default-bg)]");
  });

  it("variant=secondary 시 secondary 클래스 포함", () => {
    const { container } = render(<Badge variant="secondary">보조</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[var(--axis-bg-muted)]");
  });

  it("variant=destructive 시 destructive 클래스 포함", () => {
    const { container } = render(<Badge variant="destructive">삭제</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[var(--axis-badge-error-bg)]");
  });

  it("variant=success 시 success 클래스 포함", () => {
    const { container } = render(<Badge variant="success">성공</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[var(--axis-badge-success-bg)]");
  });

  it("variant=warning 시 warning 클래스 포함", () => {
    const { container } = render(<Badge variant="warning">경고</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[var(--axis-badge-warning-bg)]");
  });

  it("variant=error 시 error 클래스 포함", () => {
    const { container } = render(<Badge variant="error">에러</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[var(--axis-badge-error-bg)]");
  });

  it("variant=info 시 info 클래스 포함", () => {
    const { container } = render(<Badge variant="info">정보</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("bg-[var(--axis-badge-info-bg)]");
  });

  it("variant=outline 시 outline 클래스 포함", () => {
    const { container } = render(<Badge variant="outline">아웃라인</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("border-[var(--axis-border-default)]");
  });

  it("커스텀 className 병합", () => {
    const { container } = render(<Badge className="my-class">커스텀</Badge>);
    const badge = container.firstElementChild!;
    expect(badge.className).toContain("my-class");
    // 기본 클래스도 유지
    expect(badge.className).toContain("inline-flex");
  });

  it("children 표시", () => {
    render(<Badge>테스트 텍스트</Badge>);
    expect(screen.getByText("테스트 텍스트")).toBeInTheDocument();
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Badge ref={ref}>참조</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
