/**
 * WI-0088 (Q106): template init · apply 가 파일을 쓰는 도중 실패하면 건드린 파일을 되돌리고 rc 1,
 * init 은 axis.config.json 생성 · 다음 단계 안내로 넘어가지 않음
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, writeFileSync: vi.fn(actual.writeFileSync) };
});

vi.mock("./registry-client.js", () => ({
  fetchTemplateDetail: vi.fn(async () => ({
    name: "Fixture",
    slug: "fixture",
    description: "테스트 템플릿",
    category: "dashboard",
    version: "1.0.0",
    tags: [],
    features: [],
    dependencies: {},
    devDependencies: {},
    updatedAt: "2026-10-30T00:00:00.000Z",
    files: [
      { path: "package.json", content: '{ "name": "fixture" }\n', type: "config" },
      { path: "app/page.tsx", content: "export default function Page() { return null; }\n", type: "page" },
    ],
  })),
}));

import * as nodeFs from "node:fs";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { applyTemplate, initTemplate } from "./template-apply.js";

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;
const created: string[] = [];
let out: string[];

beforeEach(async () => {
  out = [];
  const push = (...a: unknown[]) => out.push(a.map(String).join(" ").replace(ANSI, ""));
  vi.spyOn(console, "log").mockImplementation(push);
  vi.spyOn(console, "error").mockImplementation(push);
  // ora 스피너(실패 문구)는 stderr 로 바로 씁니다
  vi.spyOn(process.stderr, "write").mockImplementation(((chunk: string | Uint8Array) => {
    out.push(String(chunk).replace(ANSI, ""));
    return true;
  }) as typeof process.stderr.write);
  process.exitCode = undefined;
  // app/page.tsx 쓰기에서 실패를 주입합니다(package.json 은 먼저 쓰임)
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  vi.mocked(nodeFs.writeFileSync).mockImplementation(((file: nodeFs.PathOrFileDescriptor, data: string) => {
    if (String(file).endsWith(path.join("app", "page.tsx"))) throw Object.assign(new Error("주입한 쓰기 실패"), { code: "EIO" });
    return actual.writeFileSync(file, data);
  }) as typeof nodeFs.writeFileSync);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.mocked(nodeFs.writeFileSync).mockReset();
  process.exitCode = undefined;
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function tmp(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-tpl88rb-"));
  created.push(dir);
  return dir;
}

describe("WI-0088 쓰기 도중 실패", () => {
  it("apply -y: 합친 package.json 을 원래 바이트로 되돌리고 새 디렉터리를 지움, rc 1 · false", async () => {
    const dir = await tmp();
    const before = JSON.stringify({ name: "a", packageManager: "yarn@4.5.0" }, null, 2) + "\n";
    await fs.outputFile(path.join(dir, "package.json"), before);
    expect(await applyTemplate("fixture", { dir, yes: true, interactive: false })).toBe(false);
    expect(process.exitCode).toBe(1);
    expect(await fs.readFile(path.join(dir, "package.json"), "utf8")).toBe(before);
    expect(await fs.readdir(dir)).toEqual(["package.json"]);
    expect(out.some((l) => l.includes("원래대로 되돌렸습니다") && l.includes("주입한 쓰기 실패"))).toBe(true);
    expect(out.some((l) => l.includes("템플릿 적용 완료"))).toBe(false);
  });

  it("init: 템플릿 파일이 남지 않고 axis.config.json 도 만들지 않으며 다음 단계 안내 없음, rc 1", async () => {
    const root = await tmp();
    const target = path.join(root, "new");
    await initTemplate("fixture", { dir: target, interactive: false });
    expect(process.exitCode).toBe(1);
    expect(await fs.readdir(target)).toEqual([]);
    expect(out.some((l) => l.includes("다음 단계"))).toBe(false);
    expect(out.some((l) => l.includes("axis.config.json 생성 완료"))).toBe(false);
  });
});
