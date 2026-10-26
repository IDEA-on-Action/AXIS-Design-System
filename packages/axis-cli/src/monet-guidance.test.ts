/**
 * WI-0085: `axis monet import` 저장 뒤 다음 단계의 의존성 설치 줄이 cwd(import 가 axis.config.json 을 읽는 기준)의
 * lockfile · packageManager 를 따름. import 는 TTY 에서만 그 줄에 닿아 판정 함수를 따로 고정합니다.
 */
import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { monetImportNextSteps } from "./monet.js";

const created: string[] = [];
afterEach(async () => {
  for (const dir of created.splice(0)) await fs.remove(dir);
});

async function dirWith(files: Record<string, string | Record<string, unknown>>): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-monet-"));
  created.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    if (typeof content === "string") await fs.outputFile(path.join(dir, rel), content);
    else await fs.outputJSON(path.join(dir, rel), content);
  }
  return dir;
}

describe("WI-0085 monet import 다음 단계", () => {
  it("npm · yarn lockfile · packageManager 를 따르고, 없으면 종전 pnpm add", async () => {
    const cases: [Record<string, string | Record<string, unknown>>, string][] = [
      [{ "package.json": { name: "a" }, "package-lock.json": "" }, "2. 필요한 의존성 설치 (npm install ...)"],
      [{ "package.json": { name: "a" }, "yarn.lock": "" }, "2. 필요한 의존성 설치 (yarn add ...)"],
      [{ "package.json": { name: "a", packageManager: "yarn@4.5.0" } }, "2. 필요한 의존성 설치 (yarn add ...)"],
      [{ "package.json": { name: "a" } }, "2. 필요한 의존성 설치 (pnpm add ...)"],
    ];
    for (const [files, line] of cases) {
      const steps = monetImportNextSteps(await dirWith(files));
      expect({ files, steps }).toEqual({ files, steps: ["1. 파일을 열어 import 경로 수정", line, "3. 컴포넌트 사용"] });
    }
  });
});
