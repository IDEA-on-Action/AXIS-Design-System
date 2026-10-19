import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// src/index.ts 는 import 하면 stdio 서버가 뜨므로 소스와 경로 해석만 봅니다(WI-0028 2.2).
const indexPath = fileURLToPath(new URL("./index.ts", import.meta.url));
const source = readFileSync(indexPath, "utf-8");

describe("MCP 서버 버전 표기", () => {
  it("src/index.ts 기준 ../package.json 이 @axis-ds/mcp 패키지 루트를 가리킨다", () => {
    const pkg = createRequire(indexPath)("../package.json") as { name: string; version: string };
    expect(pkg.name).toBe("@axis-ds/mcp");
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("McpServer version 을 package.json 에서 읽고 문자열로 박지 않는다", () => {
    expect(source).toContain('createRequire(import.meta.url)("../package.json")');
    expect(source).toMatch(/version:\s*SERVER_VERSION/);
    expect(source).not.toMatch(/version:\s*"\d+\.\d+\.\d+"/);
  });

  it("src/index.ts 가 src 바로 아래에 있다(빌드 뒤 dist/index.js 와 같은 깊이)", () => {
    expect(path.basename(path.dirname(indexPath))).toBe("src");
  });
});
