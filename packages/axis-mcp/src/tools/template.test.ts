import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { handleCheckProject } from "./template.js";

// brand 검사(WI-0028 P4)를 더하기 전의 axis.check_project 결과를 고정합니다.
// P4 에서 brand 가 없는 프로젝트의 결과 개수 · 이름 · severity · 문구가 그대로인지 이 기대값으로 봅니다(T4-4).

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "axis-mcp-check-"));
});

afterEach(async () => {
  await fs.remove(tmp);
});

describe("handleCheckProject (brand 검사 추가 전 기준선)", () => {
  it("빈 디렉터리: 5항목, 이름 · severity · 문구 고정", async () => {
    const { results } = await handleCheckProject({ targetDir: tmp });
    expect(results).toEqual([
      {
        name: "axis.config.json",
        severity: "fail",
        message: "axis.config.json 파일이 없습니다 → 'axis init'을 실행하세요",
      },
      { name: "tailwind.config", severity: "fail", message: "tailwind.config 파일이 없습니다" },
      { name: "globals.css", severity: "fail", message: "globals.css 파일을 찾을 수 없습니다" },
      {
        name: "utils.ts",
        severity: "warn",
        message: "utils.ts를 찾을 수 없습니다 (컴포넌트 사용 시 필요)",
      },
      { name: "dependencies", severity: "fail", message: "package.json 파일이 없습니다" },
    ]);
  });

  it("brand 없는 axis.config.json 이 있어도 5항목", async () => {
    await fs.writeJSON(path.join(tmp, "axis.config.json"), { globalCss: "./globals.css" });
    await fs.writeFile(path.join(tmp, "globals.css"), ":root { --background: 0; --primary: 0; }\n");
    const { results } = await handleCheckProject({ targetDir: tmp });
    expect(results.map((r) => r.name)).toEqual([
      "axis.config.json",
      "tailwind.config",
      "globals.css",
      "utils.ts",
      "dependencies",
    ]);
    expect(results[0].severity).toBe("pass");
    expect(results[2]).toEqual({
      name: "globals.css",
      severity: "pass",
      message: "globals.css에 AXIS CSS 변수가 정의되어 있습니다",
    });
  });
});
