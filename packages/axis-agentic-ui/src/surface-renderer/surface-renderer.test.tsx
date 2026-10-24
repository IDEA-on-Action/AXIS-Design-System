import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SurfaceRenderer } from "./index";

describe("SurfaceRenderer text (WI-0046)", () => {
  it("text surface 는 플러그인 없이 동작하는 text-sm 으로 그린다(@tailwindcss/typography 의 prose 를 쓰지 않음)", () => {
    render(<SurfaceRenderer surface={{ id: "s1", type: "text", content: "본문 텍스트" }} />);
    const el = screen.getByText("본문 텍스트");
    const classes = el.className.split(/\s+/);
    expect(classes).toContain("text-sm");
    expect(classes.some((c) => c === "prose" || c.startsWith("prose-"))).toBe(false);
  });
});
