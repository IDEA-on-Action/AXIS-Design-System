import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MessageBubble } from "./index";

describe("MessageBubble", () => {
  it("기본 렌더링 시 role='article'을 가진다", () => {
    render(<MessageBubble role="user" content="안녕하세요" />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("content 텍스트를 표시한다", () => {
    render(<MessageBubble role="user" content="테스트 메시지입니다" />);
    expect(screen.getByText("테스트 메시지입니다")).toBeInTheDocument();
  });

  it("user 역할일 때 aria-label이 '사용자 메시지'이다", () => {
    render(<MessageBubble role="user" content="안녕" />);
    expect(screen.getByRole("article")).toHaveAttribute(
      "aria-label",
      "사용자 메시지"
    );
  });

  it("assistant 역할일 때 aria-label이 '어시스턴트 메시지'이다", () => {
    render(<MessageBubble role="assistant" content="답변" />);
    expect(screen.getByRole("article")).toHaveAttribute(
      "aria-label",
      "어시스턴트 메시지"
    );
  });

  it("system 역할일 때 aria-label이 '시스템 메시지'이다", () => {
    render(<MessageBubble role="system" content="알림" />);
    expect(screen.getByRole("article")).toHaveAttribute(
      "aria-label",
      "시스템 메시지"
    );
  });

  it("system 역할일 때 avatar를 표시하지 않는다", () => {
    render(
      <MessageBubble
        role="system"
        content="시스템 메시지"
        avatar="https://example.com/avatar.png"
      />
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("timestamp가 있으면 time 태그를 렌더한다", () => {
    const date = new Date("2025-01-15T10:30:00");
    render(<MessageBubble role="user" content="안녕" timestamp={date} />);
    const timeElement = screen.getByText(/10/);
    expect(timeElement.tagName).toBe("TIME");
    expect(timeElement).toHaveAttribute("dateTime", date.toISOString());
  });

  it("avatar가 string이면 img를 렌더한다", () => {
    const { container } = render(
      <MessageBubble
        role="user"
        content="안녕"
        avatar="https://example.com/avatar.png"
      />
    );
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("avatar가 ReactNode이면 그대로 렌더한다", () => {
    render(
      <MessageBubble
        role="assistant"
        content="답변"
        avatar={<span data-testid="custom-avatar">A</span>}
      />
    );
    expect(screen.getByTestId("custom-avatar")).toBeInTheDocument();
  });

  it("status가 'sending'일 때 aria-label이 '전송 중'이다", () => {
    const { container } = render(
      <MessageBubble role="user" content="안녕" status="sending" />
    );
    const statusSpan = container.querySelector("[aria-label='전송 중']");
    expect(statusSpan).toBeInTheDocument();
  });

  it("status가 'sent'일 때 aria-label이 '전송됨'이다", () => {
    const { container } = render(
      <MessageBubble role="user" content="안녕" status="sent" />
    );
    const statusSpan = container.querySelector("[aria-label='전송됨']");
    expect(statusSpan).toBeInTheDocument();
  });

  it("status가 'error'일 때 aria-label이 '전송 실패'이다", () => {
    const { container } = render(
      <MessageBubble role="user" content="안녕" status="error" />
    );
    const statusSpan = container.querySelector("[aria-label='전송 실패']");
    expect(statusSpan).toBeInTheDocument();
  });

  it("metadata 텍스트를 표시한다", () => {
    render(
      <MessageBubble role="assistant" content="답변" metadata="GPT-4o" />
    );
    expect(screen.getByText("GPT-4o")).toBeInTheDocument();
  });

  it("actions 영역을 렌더한다", () => {
    render(
      <MessageBubble
        role="assistant"
        content="답변"
        actions={<button data-testid="action-btn">좋아요</button>}
      />
    );
    expect(screen.getByTestId("action-btn")).toBeInTheDocument();
  });
});
