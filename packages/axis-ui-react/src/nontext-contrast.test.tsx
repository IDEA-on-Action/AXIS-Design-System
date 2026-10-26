import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox, Progress, RadioGroup, RadioGroupItem, Slider, Switch, Textarea } from "./index";

/**
 * WI-0063: 폼 컨트롤 경계 · 트랙과 Progress 채움이 비텍스트 대비용 component 토큰을 쓰는지 고정한다(D3 (가)).
 * 값의 대비는 tokens default-contrast.test(기본 브랜드)와 ontology-values.test(ontology, WI-0079 에서 v1 팔레트 값으로 3:1 이상)가 같은 짝 표로 본다.
 * 1.7.0 은 border-default(흰 바탕 1.23) · surface-tertiary(1.23) · surface-brand · 원색 primitive 를 직접 썼다.
 * 새 변수에는 그 1.7.0 변수를 fallback 으로 둔다. tokens 1.7.0 CSS 와 섞여도 투명 · currentColor 가 아니라 1.7.0 렌더로 물러난다.
 */
const AX = ["--", "axis-"].join("");
const FALLBACK = {
  "form-control-border": "border-default",
  "form-control-track": "surface-tertiary",
  "progress-fill-default": "surface-brand",
  "progress-fill-success": "color-green-500",
  "progress-fill-warning": "color-yellow-500",
  "progress-fill-destructive": "color-red-500",
} as const;
const ref = (name: keyof typeof FALLBACK) => `var(${AX}${name},var(${AX}${FALLBACK[name]}))`;
const has = (el: Element | null, cls: string) => (el?.getAttribute("class") ?? "").split(/\s+/).includes(cls);

describe("ui-react 비텍스트 대비 구조 (WI-0063)", () => {
  it("Checkbox · RadioGroupItem · Textarea 경계는 form-control-border", () => {
    const { container } = render(
      <div>
        <Checkbox aria-label="동의" />
        <RadioGroup defaultValue="a" aria-label="옵션">
          <RadioGroupItem value="a" aria-label="가" />
        </RadioGroup>
        <Textarea aria-label="메모" />
      </div>,
    );
    const want = `border-[${ref("form-control-border")}]`;
    const els = [
      container.querySelector('button[role="checkbox"]'),
      container.querySelector('button[role="radio"]'),
      container.querySelector("textarea"),
    ];
    for (const el of els) {
      expect(el).not.toBeNull();
      expect(has(el, want)).toBe(true);
      expect(has(el, `border-[var(${AX}border-default)]`)).toBe(false);
    }
  });

  it("Switch 꺼짐 · Slider 트랙은 form-control-track", () => {
    const { container } = render(
      <div>
        <Switch aria-label="알림" />
        <Slider defaultValue={[50]} aria-label="볼륨" />
      </div>,
    );
    const sw = container.querySelector('button[role="switch"]');
    expect(has(sw, `data-[state=unchecked]:bg-[${ref("form-control-track")}]`)).toBe(true);
    const track = Array.from(container.querySelectorAll("span")).find((el) => has(el, "grow"));
    expect(track).toBeDefined();
    expect(has(track ?? null, `bg-[${ref("form-control-track")}]`)).toBe(true);
  });

  for (const variant of ["default", "success", "warning", "destructive"] as const) {
    it(`Progress(${variant}) 채움은 progress-fill-${variant}`, () => {
      const { container } = render(<Progress value={40} variant={variant} aria-label="진행" />);
      const fill = container.querySelector('[role="progressbar"] > div');
      expect(fill).not.toBeNull();
      expect(has(fill, `bg-[${ref(`progress-fill-${variant}`)}]`)).toBe(true);
    });
  }
});
