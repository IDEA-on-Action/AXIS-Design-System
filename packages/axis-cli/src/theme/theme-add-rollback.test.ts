import { describe, it, expect, afterEach, vi } from "vitest";

// 쓰기 도중 실패(실패 주입)를 만들려고 node:fs 의 writeFileSync 를 감쌉니다. 기본 동작은 원래 함수 그대로입니다.
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, writeFileSync: vi.fn(actual.writeFileSync) };
});

import * as nodeFs from "node:fs";
import fs from "fs-extra";
import { ThemeApplyError, applyThemeAdd, planThemeAdd } from "./theme-add.js";
import { makeProject } from "./test-helpers.js";

const created: string[] = [];

afterEach(async () => {
  vi.mocked(nodeFs.writeFileSync).mockReset();
  while (created.length > 0) await fs.remove(created.pop()!);
});

describe("applyThemeAdd: 쓰는 도중 실패하면 되돌림", () => {
  it("세 번째 파일 쓰기가 실패하면 앞의 두 파일을 원래 내용으로 되돌리고 ThemeApplyError", async () => {
    const dir = await makeProject({ tokens: "1.3", layout: "app-init" });
    created.push(dir);
    const plan = planThemeAdd(dir, "sample");
    expect(plan.errors).toEqual([]);
    expect(plan.writes.length).toBe(3);
    const before = new Map(plan.writes.map((w) => [w.file, w.before]));

    const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
    const failing = plan.writes[2].file;
    vi.mocked(nodeFs.writeFileSync).mockImplementation(((file: nodeFs.PathOrFileDescriptor, data: string) => {
      if (file === failing && data !== before.get(failing)) {
        throw Object.assign(new Error("주입한 쓰기 실패"), { code: "EIO" });
      }
      return actual.writeFileSync(file, data);
    }) as typeof nodeFs.writeFileSync);

    let caught: unknown;
    try {
      applyThemeAdd(plan);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ThemeApplyError);
    const err = caught as ThemeApplyError;
    expect(err.failedFile).toBe(failing);
    expect(err.restored.sort()).toEqual([plan.writes[0].file, plan.writes[1].file].sort());
    expect(err.restoreFailed).toEqual([]);
    for (const w of plan.writes) {
      expect(await fs.readFile(w.file, "utf8")).toBe(w.before);
    }
  });
});
