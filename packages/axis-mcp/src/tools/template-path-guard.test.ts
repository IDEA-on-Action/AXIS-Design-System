/**
 * WI-0088 Q107 (보안): MCP axis.apply_template · axis.diff_template 이 targetDir 밖을 가리키는 템플릿 경로(절대 경로 · `..` ·
 * 심볼릭 링크 경유 · postInstall 대상)에서 아무 파일도 쓰거나 읽지 않고, CLI 와 같은 문구의 오류를 던짐
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";

const state = vi.hoisted(() => ({ detail: undefined as unknown as Record<string, unknown> }));

vi.mock("node-fetch", () => ({
  default: vi.fn(async () => ({ ok: true, status: 200, json: async () => state.detail })),
}));

import { handleApplyTemplate, handleDiffTemplate } from "./template.js";

const created: string[] = [];
afterEach(async () => {
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function snapshot(dir: string): Promise<Record<string, string>> {
  const res: Record<string, string> = {};
  if (!(await fs.pathExists(dir))) return res;
  async function walk(cur: string) {
    for (const name of await fs.readdir(cur)) {
      const full = path.join(cur, name);
      const st = await fs.lstat(full);
      const rel = path.relative(dir, full).split(path.sep).join("/");
      if (st.isSymbolicLink()) res[rel] = `-> ${await fs.readlink(full)}`;
      else if (st.isDirectory()) await walk(full);
      else res[rel] = await fs.readFile(full, "utf8");
    }
  }
  await walk(dir);
  return res;
}

async function arena() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "axis-mcp88pg-"));
  created.push(root);
  const project = path.join(root, "project");
  const outside = path.join(root, "outside");
  await fs.outputJSON(path.join(project, "package.json"), { name: "user", packageManager: "yarn@4.5.0" }, { spaces: 2 });
  await fs.outputFile(path.join(outside, "victim.txt"), "원본\n");
  await fs.symlink(outside, path.join(project, "link"), "dir");
  await fs.symlink(path.join(outside, "victim.txt"), path.join(project, "filelink"));
  return { root, project, outside };
}

function detail(paths: string[], postInstall?: unknown[]) {
  return {
    name: "Evil",
    slug: "evil",
    description: "",
    category: "x",
    version: "1.0.0",
    tags: [],
    features: [],
    dependencies: {},
    devDependencies: {},
    files: [
      { path: "package.json", content: '{ "name": "evil" }\n', type: "config" },
      { path: "app/page.tsx", content: "export default 1;\n", type: "page" },
      ...paths.map((p) => ({ path: p, content: "PWNED\n", type: "x" })),
    ],
    ...(postInstall ? { postInstall } : {}),
  };
}

const msg = (p: string, reason: string) =>
  `템플릿 경로 '${p}' 가 대상 디렉터리 밖을 가리켜(${reason}) 중단했습니다. 아무 파일도 바꾸지 않았습니다`;

describe("WI-0088 Q107 axis.apply_template 경로 탈출", () => {
  it("../escape.txt · 절대 경로 · a/../../escape · 심볼릭 링크 경유: 오류 문구가 CLI 와 같고 밖 · 안 모두 그대로", async () => {
    for (const make of [
      () => ["../escape.txt", "상위 디렉터리로 나감"],
      (o: string) => [path.join(o, "abs.txt"), "절대 경로"],
      () => ["a/../../escape", "상위 디렉터리로 나감"],
      () => ["link/via-link.txt", "심볼릭 링크가 대상 디렉터리 밖을 가리킴"],
      () => ["filelink", "심볼릭 링크가 대상 디렉터리 밖을 가리킴"],
    ]) {
      const { root, project, outside } = await arena();
      const [p, reason] = make(outside);
      state.detail = detail([p]);
      const before = { project: await snapshot(project), outside: await snapshot(outside), root: (await fs.readdir(root)).sort() };
      for (const dryRun of [false, true]) {
        await expect(handleApplyTemplate({ name: "evil", targetDir: project, dryRun }), p).rejects.toThrow(msg(p, reason));
      }
      expect(await snapshot(project), p).toEqual(before.project);
      expect(await snapshot(outside), p).toEqual(before.outside);
      expect((await fs.readdir(root)).sort(), p).toEqual(before.root);
    }
  });

  it("postInstall 대상이 밖이면 템플릿 파일도 쓰지 않음", async () => {
    const { project, outside } = await arena();
    state.detail = detail([], [{ file: "../outside/victim.txt", type: "append", value: "PWNED" }]);
    const before = await snapshot(project);
    await expect(handleApplyTemplate({ name: "evil", targetDir: project })).rejects.toThrow(msg("../outside/victim.txt", "상위 디렉터리로 나감"));
    expect(await snapshot(project)).toEqual(before);
    expect(await fs.readFile(path.join(outside, "victim.txt"), "utf8")).toBe("원본\n");
  });

  it("axis.diff_template: 링크 경유 경로는 읽지 않고 오류", async () => {
    const { project } = await arena();
    state.detail = detail(["filelink"]);
    await expect(handleDiffTemplate({ name: "evil", targetDir: project })).rejects.toThrow(
      msg("filelink", "심볼릭 링크가 대상 디렉터리 밖을 가리킴")
    );
  });

  it("양성 대조: 안쪽 경로만 있으면 그대로 적용", async () => {
    const { project } = await arena();
    state.detail = detail(["components/hero.tsx"]);
    const r = await handleApplyTemplate({ name: "evil", targetDir: project });
    expect(r.files.map((f) => f.action)).toEqual(["merged", "created", "created"]);
    expect(await fs.readFile(path.join(project, "components/hero.tsx"), "utf8")).toBe("PWNED\n");
  });
});
