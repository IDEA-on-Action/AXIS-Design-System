import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { createRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./index";

describe("Card", () => {
  it("기본 렌더링 - div 태그", () => {
    const { container } = render(<Card>카드 내용</Card>);
    const card = container.firstElementChild!;
    expect(card.tagName).toBe("DIV");
    expect(screen.getByText("카드 내용")).toBeInTheDocument();
  });

  it("기본 클래스 포함", () => {
    const { container } = render(<Card>내용</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain("rounded-lg");
    expect(card.className).toContain("border");
    expect(card.className).toContain("shadow-sm");
  });

  it("커스텀 className 병합", () => {
    const { container } = render(<Card className="my-card">내용</Card>);
    const card = container.firstElementChild!;
    expect(card.className).toContain("my-card");
    expect(card.className).toContain("rounded-lg");
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>내용</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardHeader", () => {
  it("렌더링 - div 태그와 기본 클래스", () => {
    const { container } = render(<CardHeader>헤더</CardHeader>);
    const header = container.firstElementChild!;
    expect(header.tagName).toBe("DIV");
    expect(header.className).toContain("p-6");
    expect(screen.getByText("헤더")).toBeInTheDocument();
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardHeader ref={ref}>헤더</CardHeader>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardTitle", () => {
  it("h3 태그로 렌더링", () => {
    render(<CardTitle>제목</CardTitle>);
    const title = screen.getByText("제목");
    expect(title.tagName).toBe("H3");
  });

  it("기본 클래스 포함", () => {
    const { container } = render(<CardTitle>제목</CardTitle>);
    const title = container.firstElementChild!;
    expect(title.className).toContain("text-2xl");
    expect(title.className).toContain("font-semibold");
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<CardTitle ref={ref}>제목</CardTitle>);
    expect(ref.current).not.toBeNull();
  });
});

describe("CardDescription", () => {
  it("p 태그로 렌더링", () => {
    render(<CardDescription>설명</CardDescription>);
    const desc = screen.getByText("설명");
    expect(desc.tagName).toBe("P");
  });

  it("기본 클래스 포함", () => {
    const { container } = render(<CardDescription>설명</CardDescription>);
    const desc = container.firstElementChild!;
    expect(desc.className).toContain("text-sm");
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<CardDescription ref={ref}>설명</CardDescription>);
    expect(ref.current).not.toBeNull();
  });
});

describe("CardContent", () => {
  it("렌더링 - div 태그와 기본 클래스", () => {
    const { container } = render(<CardContent>본문</CardContent>);
    const content = container.firstElementChild!;
    expect(content.tagName).toBe("DIV");
    expect(content.className).toContain("p-6");
    expect(screen.getByText("본문")).toBeInTheDocument();
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardContent ref={ref}>본문</CardContent>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("CardFooter", () => {
  it("렌더링 - div 태그와 기본 클래스", () => {
    const { container } = render(<CardFooter>푸터</CardFooter>);
    const footer = container.firstElementChild!;
    expect(footer.tagName).toBe("DIV");
    expect(footer.className).toContain("p-6");
    expect(screen.getByText("푸터")).toBeInTheDocument();
  });

  it("ref 전달", () => {
    const ref = createRef<HTMLDivElement>();
    render(<CardFooter ref={ref}>푸터</CardFooter>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe("Card 전체 조합", () => {
  it("모든 서브컴포넌트를 조합하여 렌더링", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>카드 제목</CardTitle>
          <CardDescription>카드 설명</CardDescription>
        </CardHeader>
        <CardContent>카드 본문</CardContent>
        <CardFooter>카드 푸터</CardFooter>
      </Card>
    );

    expect(screen.getByText("카드 제목")).toBeInTheDocument();
    expect(screen.getByText("카드 설명")).toBeInTheDocument();
    expect(screen.getByText("카드 본문")).toBeInTheDocument();
    expect(screen.getByText("카드 푸터")).toBeInTheDocument();
  });
});
