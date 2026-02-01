import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import { Alert, AlertTitle, AlertDescription } from "./index";

describe("Alert", () => {
  it("기본 렌더링 - role='alert' 포함", () => {
    render(<Alert>알림 내용</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("알림 내용")).toBeInTheDocument();
  });

  it("variant=default 시 기본 클래스 포함", () => {
    const { container } = render(<Alert variant="default">기본</Alert>);
    const alert = container.firstElementChild!;
    expect(alert.className).toContain("bg-[var(--axis-surface-primary)]");
    expect(alert.className).toContain("border-[var(--axis-border-default)]");
  });

  it("variant=info 시 info 클래스 포함", () => {
    const { container } = render(<Alert variant="info">정보</Alert>);
    const alert = container.firstElementChild!;
    expect(alert.className).toContain("bg-[var(--axis-blue-100)]");
    expect(alert.className).toContain("border-[var(--axis-blue-200)]");
  });

  it("variant=success 시 success 클래스 포함", () => {
    const { container } = render(<Alert variant="success">성공</Alert>);
    const alert = container.firstElementChild!;
    expect(alert.className).toContain("bg-[var(--axis-green-100)]");
    expect(alert.className).toContain("border-[var(--axis-green-200)]");
  });

  it("variant=warning 시 warning 클래스 포함", () => {
    const { container } = render(<Alert variant="warning">경고</Alert>);
    const alert = container.firstElementChild!;
    expect(alert.className).toContain("bg-[var(--axis-yellow-100)]");
    expect(alert.className).toContain("border-[var(--axis-yellow-200)]");
  });

  it("variant=destructive 시 destructive 클래스 포함", () => {
    const { container } = render(<Alert variant="destructive">위험</Alert>);
    const alert = container.firstElementChild!;
    expect(alert.className).toContain("bg-[var(--axis-red-100)]");
    expect(alert.className).toContain("border-[var(--axis-red-200)]");
  });

  it("커스텀 className 병합", () => {
    const { container } = render(<Alert className="my-alert">커스텀</Alert>);
    const alert = container.firstElementChild!;
    expect(alert.className).toContain("my-alert");
    expect(alert.className).toContain("rounded-lg");
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref}>참조</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("AlertTitle", () => {
  it("h5 태그로 렌더링", () => {
    render(<AlertTitle>알림 제목</AlertTitle>);
    const title = screen.getByText("알림 제목");
    expect(title.tagName).toBe("H5");
  });

  it("기본 클래스 포함", () => {
    const { container } = render(<AlertTitle>제목</AlertTitle>);
    const title = container.firstElementChild!;
    expect(title.className).toContain("font-medium");
    expect(title.className).toContain("leading-none");
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<AlertTitle ref={ref}>제목</AlertTitle>);
    expect(ref.current).not.toBeNull();
  });
});

describe("AlertDescription", () => {
  it("div 태그로 렌더링", () => {
    render(<AlertDescription>설명 내용</AlertDescription>);
    const desc = screen.getByText("설명 내용");
    expect(desc.tagName).toBe("DIV");
  });

  it("기본 클래스 포함", () => {
    const { container } = render(<AlertDescription>설명</AlertDescription>);
    const desc = container.firstElementChild!;
    expect(desc.className).toContain("text-sm");
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<AlertDescription ref={ref}>설명</AlertDescription>);
    expect(ref.current).not.toBeNull();
  });
});

describe("Alert 전체 조합", () => {
  it("Alert + AlertTitle + AlertDescription 조합 렌더링", () => {
    render(
      <Alert variant="info">
        <AlertTitle>정보 알림</AlertTitle>
        <AlertDescription>상세 설명입니다.</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("정보 알림")).toBeInTheDocument();
    expect(screen.getByText("상세 설명입니다.")).toBeInTheDocument();
  });
});
