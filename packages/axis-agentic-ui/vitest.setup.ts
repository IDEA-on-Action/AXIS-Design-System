import "@testing-library/jest-dom/vitest";
import { toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

// jest-axe matcher 등록 (axe 자동 a11y 테스트, WI-0020)
expect.extend(toHaveNoViolations);
