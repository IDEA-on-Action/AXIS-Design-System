/**
 * WI-0088 Q107 (보안): 템플릿 files[].path · postInstall[].file 이 대상 디렉터리 밖(절대 경로 · `..` · 심볼릭 링크 경유)을 가리키면
 * template apply · init · diff 가 아무 파일도 쓰거나 읽지 않고 rc 1. 정상 템플릿(저장소의 실제 5개)은 그대로 적용됨
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

type Detail = {
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  tags: string[];
  features: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  updatedAt: string;
  files: { path: string; content: string; type: string }[];
  postInstall?: { file: string; type: "append"; value: string }[];
};

const state = vi.hoisted(() => ({ detail: undefined as unknown as Detail }));

vi.mock("./registry-client.js", () => ({
  fetchTemplateDetail: vi.fn(async () => state.detail),
}));

import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyTemplate, initTemplate } from "./template-apply.js";
import { diffTemplate } from "./template-diff.js";
import {
  TemplatePathError,
  planTemplateFiles,
  resolveTemplatePath,
  writeTemplateFiles,
} from "@axis-ds/registry-core/apply-files";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_TEMPLATES = path.resolve(HERE, "../../../../apps/web/public/templates");

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;
const created: string[] = [];
let out: string[];

beforeEach(() => {
  out = [];
  const push = (...a: unknown[]) => out.push(a.map(String).join(" ").replace(ANSI, ""));
  vi.spyOn(console, "log").mockImplementation(push);
  vi.spyOn(console, "error").mockImplementation(push);
  vi.spyOn(process.stderr, "write").mockImplementation((() => true) as typeof process.stderr.write);
  process.exitCode = undefined;
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function tmp(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-tpl88pg-"));
  created.push(dir);
  return dir;
}

/** 디렉터리 아래 파일 · 링크 → 내용(링크는 대상 경로) */
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

function makeDetail(paths: string[], postInstall?: Detail["postInstall"]): Detail {
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
    updatedAt: "2026-10-30T00:00:00.000Z",
    // 정상 파일을 앞에 둬, 검증이 쓰기 전에 모두 끝나지 않으면 일부가 쓰이는지(부분 적용) 드러나게 함
    files: [
      { path: "package.json", content: '{ "name": "evil" }\n', type: "config" },
      { path: "app/page.tsx", content: "export default 1;\n", type: "page" },
      ...paths.map((p) => ({ path: p, content: "PWNED\n", type: "x" })),
    ],
    ...(postInstall ? { postInstall } : {}),
  };
}

/**
 * root/project(대상, 사용자 파일 있음) · root/outside(밖) 를 만들고 악성 경로를 돌려줍니다.
 * 심볼릭 링크 경우는 project/link → outside, project/filelink → outside/victim.txt, project/dangling → outside/none.txt
 */
async function arena() {
  const root = await tmp();
  const project = path.join(root, "project");
  const outside = path.join(root, "outside");
  await fs.outputJSON(path.join(project, "package.json"), { name: "user", packageManager: "yarn@4.5.0" }, { spaces: 2 });
  await fs.outputFile(path.join(project, "app", "page.tsx"), "// 사용자\n");
  await fs.outputFile(path.join(outside, "victim.txt"), "원본\n");
  await fs.symlink(outside, path.join(project, "link"), "dir");
  await fs.symlink(path.join(outside, "victim.txt"), path.join(project, "filelink"));
  await fs.symlink(path.join(outside, "none.txt"), path.join(project, "dangling"));
  return { root, project, outside };
}

/** 4가지 요청 경우 + 링크 변형 */
function evilCases(outside: string): [string, string, string][] {
  return [
    ["../escape.txt", "../escape.txt", "상위 디렉터리로 나감"],
    ["절대 경로", path.join(outside, "abs.txt"), "절대 경로"],
    ["a/../../escape", "a/../../escape", "상위 디렉터리로 나감"],
    ["심볼릭 링크 디렉터리 경유", "link/via-link.txt", "심볼릭 링크가 대상 디렉터리 밖을 가리킴"],
    ["심볼릭 링크 파일 덮어쓰기", "filelink", "심볼릭 링크가 대상 디렉터리 밖을 가리킴"],
    ["끊긴 심볼릭 링크", "dangling", "심볼릭 링크가 대상 디렉터리 밖을 가리킴"],
  ];
}

describe("WI-0088 Q107 resolveTemplatePath", () => {
  it("밖을 가리키는 경로는 모두 TemplatePathError, 문구에 경로와 원인", async () => {
    const { project, outside } = await arena();
    for (const [, p, reason] of evilCases(outside)) {
      let caught: unknown;
      try {
        resolveTemplatePath(project, p);
      } catch (err) {
        caught = err;
      }
      expect(caught, p).toBeInstanceOf(TemplatePathError);
      expect((caught as Error).message).toBe(`템플릿 경로 '${p}' 가 대상 디렉터리 밖을 가리켜(${reason}) 중단했습니다. 아무 파일도 바꾸지 않았습니다`);
    }
    for (const p of ["", ".", "C:\\evil.txt", "a\0b"]) expect(() => resolveTemplatePath(project, p), JSON.stringify(p)).toThrow(TemplatePathError);
  });

  it("안쪽 경로는 그대로 통과(대상 디렉터리가 아직 없어도, 안쪽 링크도)", async () => {
    const { project } = await arena();
    await fs.symlink(path.join(project, "app"), path.join(project, "inner"), "dir");
    expect(resolveTemplatePath(project, "app/page.tsx")).toBe(path.join(project, "app/page.tsx"));
    expect(resolveTemplatePath(project, "./package.json")).toBe(path.join(project, "package.json"));
    expect(resolveTemplatePath(project, "a/../b.txt")).toBe(path.join(project, "b.txt"));
    expect(resolveTemplatePath(project, "inner/x.tsx")).toBe(path.join(project, "inner/x.tsx"));
    expect(resolveTemplatePath(path.join(project, "new", "deep"), "app/x.tsx")).toBe(path.join(project, "new/deep/app/x.tsx"));
  });
});

describe("WI-0088 Q107 template apply · init · diff 가 밖으로 쓰거나 읽지 않음", () => {
  it("apply -y: 경우마다 rc 1 · false, 밖에 파일 0 · 안쪽 바이트 그대로(정상 파일도 쓰지 않음)", async () => {
    for (const [label, , reason] of evilCases("/x")) {
      const { root, project, outside } = await arena();
      const evilPath = evilCases(outside).find(([l]) => l === label)![1];
      state.detail = makeDetail([evilPath]);
      const beforeProject = await snapshot(project);
      const beforeOutside = await snapshot(outside);
      const beforeRoot = (await fs.readdir(root)).sort();
      out = [];
      process.exitCode = undefined;
      expect(await applyTemplate("evil", { dir: project, yes: true, interactive: false }), label).toBe(false);
      expect(process.exitCode, label).toBe(1);
      expect(await snapshot(project), label).toEqual(beforeProject);
      expect(await snapshot(outside), label).toEqual(beforeOutside);
      expect((await fs.readdir(root)).sort(), label).toEqual(beforeRoot);
      expect(out, label).toContain(`템플릿 경로 '${evilPath}' 가 대상 디렉터리 밖을 가리켜(${reason}) 중단했습니다. 아무 파일도 바꾸지 않았습니다`);
    }
  });

  it("--dry-run 도 같은 오류(밖을 읽지 않음)", async () => {
    const { project } = await arena();
    state.detail = makeDetail(["../escape.txt"]);
    expect(await applyTemplate("evil", { dir: project, dryRun: true, interactive: false })).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  it("postInstall 대상이 밖이면 템플릿 파일도 쓰지 않음", async () => {
    const { project, outside } = await arena();
    state.detail = makeDetail([], [{ file: "../outside/victim.txt", type: "append", value: "PWNED" }]);
    const beforeProject = await snapshot(project);
    expect(await applyTemplate("evil", { dir: project, yes: true, interactive: false })).toBe(false);
    expect(await snapshot(project)).toEqual(beforeProject);
    expect(await fs.readFile(path.join(outside, "victim.txt"), "utf8")).toBe("원본\n");
  });

  it("init: 새 디렉터리에 아무것도 쓰지 않고 axis.config.json · 다음 단계 없음", async () => {
    const root = await tmp();
    state.detail = makeDetail(["../escape.txt"]);
    await initTemplate("evil", { dir: path.join(root, "new"), interactive: false });
    expect(process.exitCode).toBe(1);
    expect(await snapshot(root)).toEqual({});
    expect(out.some((l) => l.includes("다음 단계"))).toBe(false);
  });

  it("diff: rc 1, 밖의 파일 내용을 비교 결과로 내지 않음", async () => {
    const { project } = await arena();
    state.detail = makeDetail(["filelink"]);
    await diffTemplate("evil", { dir: project });
    expect(process.exitCode).toBe(1);
    expect(out).toContain("템플릿 경로 'filelink' 가 대상 디렉터리 밖을 가리켜(심볼릭 링크가 대상 디렉터리 밖을 가리킴) 중단했습니다. 아무 파일도 바꾸지 않았습니다");
    expect(out.some((l) => l.includes("diff 결과"))).toBe(false);
  });
});

describe("WI-0088 Q107 정상 템플릿은 그대로", () => {
  const slugs = ["landing-page", "dashboard", "hr-dashboard", "theme-only", "ontology-console"];
  for (const slug of slugs) {
    it(`${slug}: 모든 경로가 통과하고 빈 디렉터리에 템플릿 바이트 그대로 씀`, async () => {
      const detail = (await fs.readJSON(path.join(REPO_TEMPLATES, `${slug}.json`))) as Detail;
      const dir = path.join(await tmp(), "app");
      const plan = planTemplateFiles(dir, detail.files, (detail.postInstall ?? []).map((p) => p.file));
      expect(plan.every((p) => p.action === "created")).toBe(true);
      writeTemplateFiles(plan);
      const snap = await snapshot(dir);
      expect(Object.keys(snap).sort()).toEqual(detail.files.map((f) => f.path).sort());
      for (const f of detail.files) expect(snap[f.path]).toBe(f.content);
    });
  }
});
