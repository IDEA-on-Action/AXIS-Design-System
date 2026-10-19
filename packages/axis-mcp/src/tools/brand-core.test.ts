import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// WI-0028 U1: MCP 의 brand-core.ts 는 CLI 원본(packages/axis-cli/src/theme/brand-core.ts)의 바이트 단위 사본입니다.
// 원본을 고쳤으면 `cp packages/axis-cli/src/theme/brand-core.ts packages/axis-mcp/src/tools/brand-core.ts` 로 맞춥니다.

const HERE = dirname(fileURLToPath(import.meta.url));
const COPY = resolve(HERE, "brand-core.ts");
const ORIGINAL = resolve(HERE, "../../../axis-cli/src/theme/brand-core.ts");

describe("brand-core 사본 동일성 (T5-1)", () => {
  it("CLI 원본과 바이트 단위로 같음", () => {
    const original = readFileSync(ORIGINAL);
    const copy = readFileSync(COPY);
    expect(original.length).toBeGreaterThan(0);
    expect(copy.equals(original)).toBe(true);
  });
});
