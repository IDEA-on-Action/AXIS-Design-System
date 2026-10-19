import { describe, it, expect } from "vitest";
import { cn } from "./utils";

const CARD = "shadow-[shadow:var(--axis-card-shadow)]";
const DIALOG = "shadow-[shadow:var(--axis-shadow-lg)]";

describe("cn() 그림자 변수 클래스 병합 (WI-0025 U4)", () => {
  it.each(["shadow-none", "shadow-md", "shadow-lg", "shadow-[0_0_0_1px_red]"])(
    "%s 가 기본 그림자 변수 클래스를 대체",
    (override) => {
      expect(cn("border", CARD, override)).toBe(`border ${override}`);
    }
  );

  it("그림자 변수 클래스끼리는 나중 것이 남음", () => {
    expect(cn(CARD, DIALOG)).toBe(DIALOG);
  });

  it("그림자 변수 클래스가 기존 크기 클래스를 대체", () => {
    expect(cn("shadow-sm", CARD)).toBe(CARD);
  });

  it("그림자 색 클래스와는 공존 (종전 shadow-sm 과 같은 분류)", () => {
    expect(cn(CARD, "shadow-black/50")).toBe(`${CARD} shadow-black/50`);
    expect(cn("shadow-sm", "shadow-black/50")).toBe("shadow-sm shadow-black/50");
  });

  it("타입 힌트 없는 임의값 var() 는 종전대로 그림자 색으로 분류", () => {
    expect(cn(CARD, "shadow-[var(--x)]")).toBe(`${CARD} shadow-[var(--x)]`);
  });
});
