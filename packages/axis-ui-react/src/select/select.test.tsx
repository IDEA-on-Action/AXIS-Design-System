import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./index";

/**
 * WI-0082: Select 의 placeholder 글자가 입력 placeholder 색 토큰(input-text-placeholder)을 받는지 고정한다.
 * placeholder 글자는 SelectValue 의 span 이라 `::placeholder`(input · textarea 전용)로는 칠할 수 없다.
 * Radix 는 값이 없을 때 Trigger(button)에 data-placeholder 를 붙이므로 그 상태에 글자색을 준다.
 * 실제 렌더 색과 대비(4.5:1)는 E2E brand-nontext-contrast ⑤ 의 select-placeholder 행이 Chromium 계산값으로 본다.
 */
const PH = "text-[var(--axis-input-text-placeholder)]";
const classes = (el: Element) => (el.getAttribute("class") ?? "").split(/\s+/);

function renderSelect(value?: string) {
  render(
    <Select defaultValue={value}>
      <SelectTrigger aria-label="테마">
        <SelectValue placeholder="테마를 고르세요" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">라이트</SelectItem>
        <SelectItem value="dark">다크</SelectItem>
      </SelectContent>
    </Select>,
  );
  return screen.getByRole("combobox", { name: "테마" });
}

describe("Select placeholder 색 (WI-0082)", () => {
  it("값이 없으면 Trigger 에 data-placeholder 가 붙고 placeholder 글자를 보여 준다 (전제 확인)", () => {
    const trigger = renderSelect();
    expect(trigger.hasAttribute("data-placeholder")).toBe(true);
    expect(trigger.textContent).toContain("테마를 고르세요");
  });

  it("data-placeholder 상태에 placeholder 글자색을 준다", () => {
    const trigger = renderSelect();
    expect(classes(trigger)).toContain(`data-[placeholder]:${PH}`);
  });

  it("button 에 효과가 없는 ::placeholder 클래스를 두지 않는다", () => {
    const trigger = renderSelect();
    expect(classes(trigger).filter((c) => c.startsWith("placeholder:"))).toEqual([]);
  });

  it("값을 고른 상태에는 data-placeholder 가 없어 placeholder 색이 적용되지 않는다", () => {
    const trigger = renderSelect("dark");
    expect(trigger.hasAttribute("data-placeholder")).toBe(false);
    expect(trigger.textContent).toContain("다크");
    expect(classes(trigger)).not.toContain(PH);
  });
});
