import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ToolCallCard } from "./index";

describe("ToolCallCard", () => {
  it("기본 렌더링 시 toolName을 표시한다", () => {
    render(<ToolCallCard toolName="search_web" status="success" />);
    expect(screen.getByText("search_web")).toBeInTheDocument();
  });

  it("기본 상태에서 접힌 상태이다 (aria-expanded='false')", () => {
    render(<ToolCallCard toolName="search_web" status="success" />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("헤더 클릭 시 펼침 상태로 전환된다 (aria-expanded='true')", () => {
    render(<ToolCallCard toolName="search_web" status="success" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("defaultExpanded=true이면 초기 펼침 상태이다", () => {
    render(
      <ToolCallCard toolName="search_web" status="success" defaultExpanded />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("description을 표시한다", () => {
    render(
      <ToolCallCard
        toolName="search_web"
        status="success"
        description="웹 검색 도구"
      />
    );
    expect(screen.getByText(/웹 검색 도구/)).toBeInTheDocument();
  });

  it("duration을 표시한다", () => {
    render(
      <ToolCallCard toolName="search_web" status="success" duration={1234} />
    );
    expect(screen.getByText("1234ms")).toBeInTheDocument();
  });

  it("펼침 시 input JSON을 표시한다", () => {
    const input = { query: "hello", limit: 10 };
    render(
      <ToolCallCard
        toolName="search_web"
        status="success"
        input={input}
        defaultExpanded
      />
    );
    expect(screen.getByText(/\"query\": \"hello\"/)).toBeInTheDocument();
    expect(screen.getByText(/\"limit\": 10/)).toBeInTheDocument();
  });

  it("펼침 시 output을 표시한다", () => {
    render(
      <ToolCallCard
        toolName="search_web"
        status="success"
        output="검색 결과입니다"
        defaultExpanded
      />
    );
    expect(screen.getByText("검색 결과입니다")).toBeInTheDocument();
  });

  it("펼침 시 error를 표시한다", () => {
    render(
      <ToolCallCard
        toolName="search_web"
        status="error"
        error="API 호출 실패"
        defaultExpanded
      />
    );
    expect(screen.getByText("API 호출 실패")).toBeInTheDocument();
  });

  it("접힌 상태에서는 input/output/error가 보이지 않는다", () => {
    render(
      <ToolCallCard
        toolName="search_web"
        status="error"
        input={{ query: "test" }}
        output="result"
        error="fail"
      />
    );
    expect(screen.queryByText("입력")).not.toBeInTheDocument();
    expect(screen.queryByText("출력")).not.toBeInTheDocument();
    expect(screen.queryByText("에러")).not.toBeInTheDocument();
  });

  it("커스텀 aria-label이 적용된다", () => {
    render(
      <ToolCallCard
        toolName="search_web"
        status="success"
        aria-label="웹 검색 도구 호출"
      />
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "웹 검색 도구 호출");
  });
});
