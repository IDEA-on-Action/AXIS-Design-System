import { render } from "@testing-library/react";
import { axe, type JestAxeConfigureOptions } from "jest-axe";
import type { ReactElement } from "react";

/**
 * 컴포넌트를 렌더링하고 axe-core a11y 검사 결과를 반환한다 (WI-0020).
 *
 * jsdom은 레이아웃/색상을 계산하지 않으므로 color-contrast 규칙은 비활성화한다.
 * (색상 대비는 시각 회귀/디자인 토큰 단계에서 별도 검증)
 *
 * 사용: `expect(await axeCheck(<Button>x</Button>)).toHaveNoViolations()`
 */
export function axeCheck(
  ui: ReactElement,
  options?: JestAxeConfigureOptions,
): ReturnType<typeof axe> {
  const { container } = render(ui);
  return axe(container, {
    rules: { "color-contrast": { enabled: false } },
    ...options,
  });
}
