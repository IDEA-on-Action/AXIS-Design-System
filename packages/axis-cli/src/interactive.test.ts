/**
 * WI-0075: 대화형 판정 공통 헬퍼 · v0 · monet import 의 비대화형 처리 · 재발 방지 가드
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// 질문이 실제로 떴는지 세려고 prompts 를 감쌉니다(응답은 원본의 inject 를 그대로 씀)
vi.mock("prompts", async (importOriginal) => {
  const actual = (await importOriginal<{ default: typeof import("prompts") }>()).default;
  const spy = vi.fn((...args: Parameters<typeof actual>) => actual(...args));
  return { default: Object.assign(spy, { inject: actual.inject, override: actual.override, prompt: actual.prompt }) };
});

import fs from "fs-extra";
import { readdirSync, readFileSync, statSync } from "node:fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import prompts from "prompts";
import { ask, isInteractive, NonInteractiveError } from "./interactive.js";
import { V0Client } from "./v0.js";
import { MonetClient } from "./monet.js";

const promptsSpy = prompts as unknown as ReturnType<typeof vi.fn>;
const SRC = path.dirname(fileURLToPath(import.meta.url));
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;
const cwd0 = process.cwd();
const created: string[] = [];
let out: string[];

beforeEach(() => {
  out = [];
  const push = (...a: unknown[]) => out.push(a.map(String).join(" ").replace(ANSI, ""));
  vi.spyOn(console, "log").mockImplementation(push);
  vi.spyOn(console, "error").mockImplementation(push);
  process.exitCode = undefined;
  promptsSpy.mockClear();
});

afterEach(async () => {
  process.chdir(cwd0);
  vi.restoreAllMocks();
  process.exitCode = undefined;
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function inTmp(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-interactive-"));
  created.push(dir);
  process.chdir(dir);
  return dir;
}

async function fileCount(dir: string): Promise<number> {
  let n = 0;
  async function walk(cur: string) {
    for (const name of await fs.readdir(cur)) {
      const full = path.join(cur, name);
      if ((await fs.lstat(full)).isDirectory()) await walk(full);
      else n++;
    }
  }
  await walk(dir);
  return n;
}

const rc = () => (typeof process.exitCode === "number" ? process.exitCode : 0);

describe("WI-0075 isInteractive · ask", () => {
  it("isInteractive 는 stdin.isTTY 가 true 일 때만 참", () => {
    const desc = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
    try {
      for (const [value, expected] of [[true, true], [false, false], [undefined, false]] as const) {
        Object.defineProperty(process.stdin, "isTTY", { value, configurable: true, writable: true });
        expect(isInteractive()).toBe(expected);
      }
    } finally {
      if (desc) Object.defineProperty(process.stdin, "isTTY", desc);
      else delete (process.stdin as { isTTY?: boolean }).isTTY;
    }
  });

  it("ask 는 비대화형이면 질문을 띄우지 않고 NonInteractiveError(가드 누락 방어)", async () => {
    await expect(ask({ type: "text", name: "x", message: "이름:" }, false)).rejects.toBeInstanceOf(NonInteractiveError);
    await expect(ask({ type: "text", name: "x", message: "이름:" }, false)).rejects.toThrow("이름:");
    expect(promptsSpy).toHaveBeenCalledTimes(0);
  });

  it("양성 대조: 대화형이면 prompts 를 그대로 부르고 응답을 돌려줌", async () => {
    prompts.inject(["값"]);
    await expect(ask({ type: "text", name: "x", message: "이름:" }, true)).resolves.toEqual({ x: "값" });
    expect(promptsSpy).toHaveBeenCalledTimes(1);
  });
});

describe("WI-0075 v0 import · monet import 비대화형(D4)", () => {
  it("v0 import: rc 1 과 convert 안내, 질문 0 · 파일 0", async () => {
    const dir = await inTmp();
    await new V0Client().importFromUrl({ interactive: false });
    expect(rc()).toBe(1);
    expect(out.some((l) => l.includes("axis v0 convert <file>"))).toBe(true);
    expect(promptsSpy).toHaveBeenCalledTimes(0);
    expect(await fileCount(dir)).toBe(0);
  });

  it("v0 의 ZIP · 클립보드 변환도 비대화형이면 rc 1, 질문 0", async () => {
    for (const run of [
      (c: V0Client) => c.convertFromZip({ interactive: false }),
      (c: V0Client) => c.convertFromClipboard({ interactive: false }),
    ]) {
      const dir = await inTmp();
      process.exitCode = undefined;
      await run(new V0Client());
      expect(rc()).toBe(1);
      expect(await fileCount(dir)).toBe(0);
    }
    expect(promptsSpy).toHaveBeenCalledTimes(0);
  });

  it("monet import: rc 1 과 대화형 안내, 질문 0 · 파일 0", async () => {
    const dir = await inTmp();
    await new MonetClient().importFromClipboard({ interactive: false });
    expect(rc()).toBe(1);
    expect(out.some((l) => l.includes("대화형 터미널에서 다시 실행하세요: axis monet import"))).toBe(true);
    expect(promptsSpy).toHaveBeenCalledTimes(0);
    expect(await fileCount(dir)).toBe(0);
  });

  it("양성 대조(대화형): v0 import 는 방법을 묻고, monet import 는 받은 이름 · 코드로 파일을 씀", async () => {
    await inTmp();
    prompts.inject(["cancel"]);
    await new V0Client().importFromUrl({ interactive: true });
    expect(promptsSpy).toHaveBeenCalledTimes(1);
    expect(rc()).toBe(0);

    const dir = await inTmp();
    prompts.inject(["hero", "export const Hero = () => null;"]);
    await new MonetClient().importFromClipboard({ interactive: true });
    expect(promptsSpy).toHaveBeenCalledTimes(3);
    expect(await fs.readFile(path.join(dir, "src", "components", "monet", "hero.tsx"), "utf8")).toBe(
      "export const Hero = () => null;"
    );
  });
});

describe("WI-0075 재발 방지 가드", () => {
  /** src 아래 테스트가 아닌 .ts 파일 */
  function sourceFiles(dir: string): string[] {
    const res: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) res.push(...sourceFiles(full));
      else if (name.endsWith(".ts") && !name.endsWith(".test.ts") && !name.endsWith(".spec.ts")) res.push(full);
    }
    return res;
  }

  it("prompts 를 import 하는 소스는 src/interactive.ts 하나뿐(질문은 ask 와 판정을 거침)", () => {
    const files = sourceFiles(SRC);
    // 계측 대조: 검사 대상이 실제로 읽혔는지(명령 파일 수십 개)
    expect(files.length).toBeGreaterThan(20);
    const importers = files
      .filter((f) => /from\s+["']prompts["']|require\(\s*["']prompts["']\s*\)|import\(\s*["']prompts["']\s*\)/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(SRC, f).split(path.sep).join("/"));
    // 양성 대조: interactive.ts 자신은 잡혀야 함(0건이면 정규식이 빗나간 것)
    expect(importers).toEqual(["interactive.ts"]);
  });

  it("진입점은 action 을 끝까지 기다림: await program.parseAsync(), 코드의 program.parse() 0건", () => {
    // 주석은 빼고 봅니다(종전 호출을 설명하는 주석이 있음)
    const code = readFileSync(path.join(SRC, "index.ts"), "utf8")
      .split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n");
    expect(code).toMatch(/await program\.parseAsync\(\)/);
    expect(code).not.toMatch(/program\.parse\(/);
  });
});
