import { describe, it, expect } from "vitest";
import { createRequire } from "module";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

// src/index.ts 는 import 하면 program.parse() 가 돌아 명령이 실행되므로 소스와 경로 해석만 봅니다(WI-0028 2.2).
// 빌드 산출물의 `--version` 출력은 testplan T1-1 에서 따로 잽니다.
const indexPath = fileURLToPath(new URL("./index.ts", import.meta.url));
const source = readFileSync(indexPath, "utf-8");

describe("CLI 버전 표기", () => {
  it("src/index.ts 기준 ../package.json 이 @axis-ds/cli 패키지 루트를 가리킨다", () => {
    const pkg = createRequire(indexPath)("../package.json") as { name: string; version: string };
    expect(pkg.name).toBe("@axis-ds/cli");
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it(".version() 에 package.json 값을 넘기고 문자열로 박지 않는다", () => {
    expect(source).toContain('createRequire(import.meta.url)("../package.json")');
    expect(source).toContain(".version(CLI_VERSION)");
    expect(source).not.toMatch(/\.version\(\s*"/);
  });

  it("src/index.ts 가 src 바로 아래에 있다(빌드 뒤 dist/index.js 와 같은 깊이)", () => {
    expect(path.basename(path.dirname(indexPath))).toBe("src");
  });
});
