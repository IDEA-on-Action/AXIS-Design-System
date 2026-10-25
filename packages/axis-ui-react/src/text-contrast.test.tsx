import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DropdownMenuShortcut, Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "./index";

/**
 * WI-0062: 기본 테마 글자 대비를 소스 구조로 고정한다(값의 대비는 tokens default-contrast.test).
 *  - Toast 설명은 불투명 글자다. opacity-90 은 성공 · 경고 바탕에서 3.99 · 3.98, ontology 경고 · 오류에서 3.95 로 떨어뜨렸다.
 *  - DropdownMenuShortcut 은 항목 포커스 바탕(surface-secondary) 위에 놓여 text-tertiary(4.39) 대신 text-secondary 를 쓴다.
 */
describe("ui-react 글자 대비 구조 (WI-0062)", () => {
  for (const variant of ["default", "success", "error", "warning"] as const) {
    it(`Toast(${variant}) 설명과 제목에 opacity 클래스가 없다`, () => {
      render(
        <ToastProvider>
          <Toast open variant={variant}>
            <ToastTitle>제목</ToastTitle>
            <ToastDescription>설명 글자</ToastDescription>
          </Toast>
          <ToastViewport />
        </ToastProvider>,
      );
      const desc = screen.getByText("설명 글자");
      const title = screen.getByText("제목");
      for (const el of [desc, title]) {
        expect(Array.from(el.classList).filter((c) => /(^|:)opacity-/.test(c))).toEqual([]);
      }
    });
  }

  it("DropdownMenuShortcut 은 text-secondary 를 쓴다", () => {
    render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
    const el = screen.getByText("⌘K");
    expect(el.classList.contains("text-[var(--axis-text-secondary)]")).toBe(true);
    expect(el.classList.contains("text-[var(--axis-text-tertiary)]")).toBe(false);
  });
});
