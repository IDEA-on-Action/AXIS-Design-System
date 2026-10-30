/**
 * WI-0075: template init · apply 의 비대화형(비TTY) 질문 처리
 *
 * 질문마다 성격으로 나눕니다(배치 6 결정 D1 · D2).
 * - 기본값이 있고 파괴적이지 않은 질문(init 의 디렉터리 = 템플릿 이름)은 기본값으로 진행하고 1줄로 알림
 * - 기본값이 없는 입력(템플릿 이름 없음) · 덮어쓰기 확인(비어 있지 않은 디렉터리, apply 충돌)은 rc 1 + 플래그 안내
 * - `template init -y` 는 질문을 기본값으로 답하고 비어 있지 않은 디렉터리도 진행(apply -y 와 같은 뜻)
 * 대화형(TTY) 경로는 종전과 같아야 합니다(prompts 호출 수와 inject 응답으로 확인).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  detail: {
    name: "Fixture",
    slug: "fixture",
    description: "테스트 템플릿",
    category: "dashboard",
    version: "1.0.0",
    tags: [],
    features: [],
    dependencies: {},
    devDependencies: {},
    updatedAt: "2026-10-25T00:00:00.000Z",
    files: [
      { path: "package.json", content: '{ "name": "fixture" }\n', type: "config" },
      { path: "app/page.tsx", content: "export default function Page() { return null; }\n", type: "page" },
    ],
  },
}));

vi.mock("./registry-client.js", () => ({
  fetchTemplateDetail: vi.fn(async () => fixture.detail),
  fetchTemplateIndex: vi.fn(async () => ({
    version: "1",
    updatedAt: fixture.detail.updatedAt,
    total: 1,
    templates: [fixture.detail],
  })),
}));

// 질문이 실제로 떴는지 세려고 prompts 를 감쌉니다(응답은 원본의 inject 를 그대로 씀)
vi.mock("prompts", async (importOriginal) => {
  const actual = (await importOriginal<{ default: typeof import("prompts") }>()).default;
  const spy = vi.fn((...args: Parameters<typeof actual>) => actual(...args));
  return { default: Object.assign(spy, { inject: actual.inject, override: actual.override, prompt: actual.prompt }) };
});

import { Command } from "commander";
import fs from "fs-extra";
import os from "os";
import path from "path";
import prompts from "prompts";
import { applyTemplate, initTemplate } from "./template-apply.js";
import { fetchTemplateIndex } from "./registry-client.js";
import { registerTemplateCommand } from "./index.js";
import { detectInstallCommand } from "@axis-ds/registry-core/project";

const promptsSpy = prompts as unknown as ReturnType<typeof vi.fn>;
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
  vi.mocked(fetchTemplateIndex).mockClear();
});

afterEach(async () => {
  process.chdir(cwd0);
  vi.restoreAllMocks();
  process.exitCode = undefined;
  while (created.length > 0) await fs.remove(created.pop()!);
});

/** 임시 디렉터리로 이동합니다 */
async function inTmp(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-tpl-"));
  created.push(dir);
  process.chdir(dir);
  return dir;
}

/** 디렉터리 아래 파일 경로 → 내용 */
async function snapshot(dir: string): Promise<Record<string, string>> {
  const res: Record<string, string> = {};
  if (!(await fs.pathExists(dir))) return res;
  async function walk(cur: string) {
    for (const name of await fs.readdir(cur)) {
      const full = path.join(cur, name);
      if ((await fs.lstat(full)).isDirectory()) await walk(full);
      else res[path.relative(dir, full).split(path.sep).join("/")] = await fs.readFile(full, "utf8");
    }
  }
  await walk(dir);
  return res;
}

const rc = () => (typeof process.exitCode === "number" ? process.exitCode : 0);
const TEMPLATE_FILES = ["app/page.tsx", "axis.config.json", "package.json"];

describe("WI-0075 template init 비대화형", () => {
  it("--dir 없음: 템플릿 이름 디렉터리에 파일과 axis.config.json 을 만들고 rc 0, 쓴 값을 1줄로 알림, 질문 0", async () => {
    const dir = await inTmp();
    await initTemplate("fixture", { interactive: false });
    expect(rc()).toBe(0);
    expect(Object.keys(await snapshot(path.join(dir, "fixture"))).sort()).toEqual(TEMPLATE_FILES);
    expect(out).toContain("비대화형 실행이라 프로젝트 디렉토리를 기본값 'fixture' 로 정했습니다(바꾸려면 --dir <path>).");
    expect(promptsSpy).toHaveBeenCalledTimes(0);
  });

  it("템플릿 이름 없음: 기본값이 없어 rc 1 과 이름 안내, 목록을 받지 않고 파일 0", async () => {
    const dir = await inTmp();
    await initTemplate(undefined, { interactive: false });
    expect(rc()).toBe(1);
    expect(out).toContain("비대화형 실행이라 템플릿을 고를 수 없습니다. 템플릿 이름을 주세요.");
    expect(out.some((l) => l.includes("axis template init <name>"))).toBe(true);
    expect(await snapshot(dir)).toEqual({});
    expect(fetchTemplateIndex).toHaveBeenCalledTimes(0);
    expect(promptsSpy).toHaveBeenCalledTimes(0);
  });

  it("-y 와 템플릿 이름 없음도 비대화형이면 rc 1(템플릿 선택에는 기본값이 없음)", async () => {
    await inTmp();
    await initTemplate(undefined, { interactive: false, yes: true });
    expect(rc()).toBe(1);
    expect(promptsSpy).toHaveBeenCalledTimes(0);
  });

  it("비어 있지 않은 --dir, -y 없음: 기존 파일 바이트 그대로 · 새 파일 0 · rc 1 과 -y 안내", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "app", "package.json"), "// 사용자 파일\n");
    await fs.outputFile(path.join(dir, "app", "keep.txt"), "x\n");
    const before = await snapshot(dir);
    await initTemplate("fixture", { dir: "app", interactive: false });
    expect(rc()).toBe(1);
    expect(await snapshot(dir)).toEqual(before);
    expect(out.some((l) => l.includes("--dir app -y"))).toBe(true);
    expect(promptsSpy).toHaveBeenCalledTimes(0);
  });

  it("음성 대조: 같은 디렉터리에 -y 를 주면 진행해 템플릿 파일을 덮어쓰고 rc 0(기존 다른 파일은 유지)", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "app", "package.json"), "// 사용자 파일\n");
    await fs.outputFile(path.join(dir, "app", "keep.txt"), "x\n");
    await initTemplate("fixture", { dir: "app", interactive: false, yes: true });
    expect(rc()).toBe(0);
    const after = await snapshot(path.join(dir, "app"));
    expect(after["package.json"]).toBe(fixture.detail.files[0].content);
    expect(after["keep.txt"]).toBe("x\n");
    expect(Object.keys(after).sort()).toEqual([...TEMPLATE_FILES, "keep.txt"].sort());
    expect(out.some((l) => l.includes("-y 라 진행합니다"))).toBe(true);
  });

  it("--dir 없음 + 기본 디렉터리가 이미 비어 있지 않으면 -y 없이는 rc 1(기본값은 덮어쓰기를 뜻하지 않음)", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "fixture", "package.json"), "// 사용자 파일\n");
    const before = await snapshot(dir);
    await initTemplate("fixture", { interactive: false });
    expect(rc()).toBe(1);
    expect(await snapshot(dir)).toEqual(before);
  });
});

describe("WI-0075 template apply 비대화형", () => {
  it("충돌 있음, -y 없음: 기존 파일 바이트 그대로 · rc 1 · -y 안내, 질문 0", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "package.json"), "// 사용자 파일\n");
    const before = await snapshot(dir);
    await applyTemplate("fixture", { interactive: false });
    expect(rc()).toBe(1);
    expect(await snapshot(dir)).toEqual(before);
    expect(out).toContain("비대화형 실행이라 충돌 파일을 덮어쓸지 물을 수 없어 아무것도 쓰지 않았습니다.");
    expect(out.some((l) => l.includes("axis template apply fixture -y"))).toBe(true);
    expect(promptsSpy).toHaveBeenCalledTimes(0);
  });

  it("음성 대조: -y 를 주면 덮어쓰고 rc 0", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "package.json"), "// 사용자 파일\n");
    await applyTemplate("fixture", { interactive: false, yes: true });
    expect(rc()).toBe(0);
    expect((await snapshot(dir))["package.json"]).toBe(fixture.detail.files[0].content);
  });

  it("--dry-run 은 충돌이 있어도 묻지 않고 rc 0, 파일은 그대로(종전과 같음)", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "package.json"), "// 사용자 파일\n");
    const before = await snapshot(dir);
    await applyTemplate("fixture", { interactive: false, dryRun: true });
    expect(rc()).toBe(0);
    expect(await snapshot(dir)).toEqual(before);
  });

  it("충돌 없음: 비대화형에서도 질문 없이 적용(종전과 같음)", async () => {
    const dir = await inTmp();
    await applyTemplate("fixture", { interactive: false });
    expect(rc()).toBe(0);
    expect(Object.keys(await snapshot(dir)).sort()).toEqual(["app/page.tsx", "package.json"]);
  });
});

describe("WI-0075 대화형(TTY) 경로는 종전과 같음", () => {
  it("init --dir 없음: 디렉터리를 묻고 받은 값에 만듦", async () => {
    const dir = await inTmp();
    prompts.inject(["mine"]);
    await initTemplate("fixture", { interactive: true });
    expect(promptsSpy).toHaveBeenCalledTimes(1);
    expect(rc()).toBe(0);
    expect(Object.keys(await snapshot(path.join(dir, "mine"))).sort()).toEqual(TEMPLATE_FILES);
  });

  it("init 템플릿 이름 없음: 목록을 받아 고르게 함", async () => {
    const dir = await inTmp();
    prompts.inject(["fixture", "picked"]);
    await initTemplate(undefined, { interactive: true });
    expect(fetchTemplateIndex).toHaveBeenCalledTimes(1);
    expect(promptsSpy).toHaveBeenCalledTimes(2);
    expect(Object.keys(await snapshot(path.join(dir, "picked"))).sort()).toEqual(TEMPLATE_FILES);
  });

  it("init 비어 있지 않은 디렉터리: 묻고, 아니요면 아무것도 쓰지 않음(rc 0, 종전과 같음)", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "app", "keep.txt"), "x\n");
    const before = await snapshot(dir);
    prompts.inject([false]);
    await initTemplate("fixture", { dir: "app", interactive: true });
    expect(promptsSpy).toHaveBeenCalledTimes(1);
    expect(rc()).toBe(0);
    expect(await snapshot(dir)).toEqual(before);
  });

  it("init -y(대화형): 디렉터리를 묻지 않고 템플릿 이름으로 진행", async () => {
    const dir = await inTmp();
    await initTemplate("fixture", { interactive: true, yes: true });
    expect(promptsSpy).toHaveBeenCalledTimes(0);
    expect(out).toContain("-y 라 프로젝트 디렉토리를 기본값 'fixture' 로 정했습니다(바꾸려면 --dir <path>).");
    expect(Object.keys(await snapshot(path.join(dir, "fixture"))).sort()).toEqual(TEMPLATE_FILES);
  });

  it("apply 충돌: 묻고, 예면 덮어씀", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "package.json"), "// 사용자 파일\n");
    prompts.inject([true]);
    await applyTemplate("fixture", { interactive: true });
    expect(promptsSpy).toHaveBeenCalledTimes(1);
    expect((await snapshot(dir))["package.json"]).toBe(fixture.detail.files[0].content);
  });
});

describe("WI-0075 명령 등록", () => {
  /** 실제 명령 등록 경로로 template 하위 명령을 실행합니다 */
  async function runTemplate(args: string[], interactive: boolean): Promise<void> {
    const program = new Command();
    program.exitOverride();
    registerTemplateCommand(program, { isInteractive: () => interactive });
    await program.parseAsync(["template", ...args], { from: "user" });
  }

  it("template init 에 -y 옵션이 있음(종전에는 unknown option)", async () => {
    const dir = await inTmp();
    await fs.outputFile(path.join(dir, "app", "keep.txt"), "x\n");
    await runTemplate(["init", "fixture", "--dir", "app", "-y"], false);
    expect(rc()).toBe(0);
    expect(Object.keys(await snapshot(path.join(dir, "app"))).sort()).toEqual([...TEMPLATE_FILES, "keep.txt"].sort());
  });

  it("주입한 판정이 init · apply 에 전달됨: 비대화형이면 질문 0 · rc 1", async () => {
    const dir = await inTmp();
    await runTemplate(["init"], false);
    expect(rc()).toBe(1);
    process.exitCode = undefined;
    await fs.outputFile(path.join(dir, "package.json"), "// 사용자 파일\n");
    await runTemplate(["apply", "fixture"], false);
    expect(rc()).toBe(1);
    expect(promptsSpy).toHaveBeenCalledTimes(0);
  });

  it("양성 대조: 대화형으로 주입하면 질문이 뜸", async () => {
    await inTmp();
    prompts.inject(["fixture", "picked"]);
    await runTemplate(["init"], true);
    expect(promptsSpy).toHaveBeenCalledTimes(2);
  });
});

describe("WI-0085 template apply · init 의 설치 안내가 대상 디렉터리의 매니저를 따름", () => {
  const DEPS = { react: "^19.0.0", clsx: "^2.1.1" };
  const DEV = { typescript: "^5.7.0" };

  beforeEach(() => {
    fixture.detail.dependencies = { ...DEPS };
    fixture.detail.devDependencies = { ...DEV };
  });
  afterEach(() => {
    fixture.detail.dependencies = {};
    fixture.detail.devDependencies = {};
  });

  /** tmpdir 아래에 파일 트리(값이 객체면 JSON) */
  async function tree(files: Record<string, string | Record<string, unknown>>): Promise<string> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "axis-tpl85-"));
    created.push(root);
    for (const [rel, content] of Object.entries(files)) {
      if (typeof content === "string") await fs.outputFile(path.join(root, rel), content);
      else await fs.outputJSON(path.join(root, rel), content);
    }
    return root;
  }

  /** 「필요한 의존성:」 다음 줄들 */
  const depLines = () => {
    const i = out.findIndex((l) => l.includes("필요한 의존성:"));
    return i < 0 ? [] : out.slice(i + 1).filter((l) => /^ {2}\S/.test(l) && !l.includes("템플릿 적용 완료")).map((l) => l.trim()).slice(0, 2);
  };
  /** 「다음 단계:」 다음 줄들(cd 제외) */
  const nextLines = () => {
    const i = out.findIndex((l) => l.includes("다음 단계:"));
    return i < 0 ? [] : out.slice(i + 1).map((l) => l.trim()).filter((l) => l !== "" && !l.startsWith("cd "));
  };

  const WS = (lock: string, extra: Record<string, unknown> = {}) => ({
    "package.json": { name: "root", private: true, workspaces: ["apps/*"], ...extra },
    ...(lock ? { [lock]: "" } : {}),
    "apps/web/package.json": { name: "web", private: true },
  });

  const applyCases: [string, Record<string, string | Record<string, unknown>>, string, string[]][] = [
    ["ws-npm(루트 package-lock)", WS("package-lock.json"), "apps/web", ['npm install "react@^19.0.0" "clsx@^2.1.1"', 'npm install -D "typescript@^5.7.0"']],
    ["ws-yarn(루트 yarn.lock)", WS("yarn.lock"), "apps/web", ['yarn add "react@^19.0.0" "clsx@^2.1.1"', 'yarn add -D "typescript@^5.7.0"']],
    ["single-npm", { "package.json": { name: "a" }, "package-lock.json": "" }, ".", ['npm install "react@^19.0.0" "clsx@^2.1.1"', 'npm install -D "typescript@^5.7.0"']],
    ["single-yarn", { "package.json": { name: "a" }, "yarn.lock": "" }, ".", ['yarn add "react@^19.0.0" "clsx@^2.1.1"', 'yarn add -D "typescript@^5.7.0"']],
    // 템플릿 package.json 이 앱 package.json 을 덮어써도 쓰기 전의 packageManager 로 고름
    ["pm-npm(lockfile 없음, packageManager npm@)", { "package.json": { name: "a", packageManager: "npm@10.9.0" } }, ".", ['npm install "react@^19.0.0" "clsx@^2.1.1"', 'npm install -D "typescript@^5.7.0"']],
    ["none(음성 대조)", { "package.json": { name: "a" } }, ".", ['pnpm add "react@^19.0.0" "clsx@^2.1.1"', 'pnpm add -D "typescript@^5.7.0"']],
  ];

  for (const [label, files, sub, expected] of applyCases) {
    it(`apply ${label}: ${expected[0].split(" ")[0]} 명령 · -D · 따옴표`, async () => {
      const root = await tree(files);
      await inTmp(); // cwd 는 무관한 빈 디렉터리
      await applyTemplate("fixture", { dir: path.join(root, sub), yes: true, interactive: false });
      expect(rc()).toBe(0);
      expect(depLines()).toEqual(expected);
    });
  }

  const initCases: [string, Record<string, string | Record<string, unknown>> | null, string, string[]][] = [
    ["ws-npm 의 apps/new", WS("package-lock.json"), "apps/new", ["npm install", "npm run dev"]],
    ["ws-yarn 의 apps/new", WS("yarn.lock"), "apps/new", ["yarn install", "yarn dev"]],
    ["ws-pm-yarn(lockfile 없음, 루트 packageManager yarn@)", WS("", { packageManager: "yarn@4.5.0" }), "apps/new", ["yarn install", "yarn dev"]],
    ["ws-pnpm(회귀 확인)", { "pnpm-workspace.yaml": "packages:\n  - apps/*\n", "package.json": { name: "root" }, "pnpm-lock.yaml": "" }, "apps/new", ["pnpm install", "pnpm dev"]],
    ["빈 tmpdir", null, "new", ["pnpm install", "pnpm dev"]],
    // 음성 대조: 워크스페이스가 아닌 상위의 lockfile 은 쓰지 않음(WI-0081 경계)
    ["single-npm/new(워크스페이스 아닌 상위)", { "package.json": { name: "a" }, "package-lock.json": "" }, "new", ["pnpm install", "pnpm dev"]],
  ];

  for (const [label, files, sub, expected] of initCases) {
    it(`init ${label}: 다음 단계 ${expected.join(" · ")}`, async () => {
      const root = files ? await tree(files) : await tree({});
      // cwd 는 lockfile 이 없는 다른 디렉터리(변이 I1: --dir 대신 cwd 로 판정하면 npm · yarn 행이 빨강)
      await inTmp();
      await initTemplate("fixture", { dir: path.join(root, sub), interactive: false });
      expect(rc()).toBe(0);
      expect(nextLines()).toEqual(expected);
      // apply 단계의 의존성 줄도 같은 매니저
      expect(depLines()[0]?.split(" ")[0]).toBe(expected[0].split(" ")[0]);
    });
  }

  it("cwd 가 npm 프로젝트여도 --dir 의 매니저를 따름(I1 의 반대 방향)", async () => {
    const root = await tree({ "package.json": { name: "a" } });
    const cwd = await inTmp();
    await fs.outputFile(path.join(cwd, "package-lock.json"), "");
    await initTemplate("fixture", { dir: path.join(root, "new"), interactive: false });
    expect(nextLines()).toEqual(["pnpm install", "pnpm dev"]);
  });
});

describe("WI-0088 template apply · init 이 사용자 package.json 을 합침", () => {
  const USER = { name: "my-app", version: "2.3.4", packageManager: "yarn@4.5.0", workspaces: ["apps/*"], scripts: { test: "vitest" } };

  it("apply -y: packageManager · name · version · workspaces · 사용자 스크립트가 남음, 다음 명령도 yarn", async () => {
    const dir = await inTmp();
    await fs.outputJSON(path.join(dir, "package.json"), USER, { spaces: 2 });
    expect(await applyTemplate("fixture", { interactive: false, yes: true })).toBe(true);
    expect(rc()).toBe(0);
    // 픽스처 템플릿 package.json 은 name 만 있어 사용자 값이 이김
    expect(await fs.readJSON(path.join(dir, "package.json"))).toEqual(USER);
    expect(detectInstallCommand(dir)).toBe("yarn install");
    expect(out).toContain("  package.json: 기존 필드를 두고 템플릿 키를 합침");
  });

  it("충돌 목록에 합치는 파일을 따로 표시(-y 없음 · 비대화형은 종전처럼 rc 1 · 바이트 그대로)", async () => {
    const dir = await inTmp();
    await fs.outputJSON(path.join(dir, "package.json"), USER, { spaces: 2 });
    await fs.outputFile(path.join(dir, "app", "page.tsx"), "// 사용자\n");
    const before = await snapshot(dir);
    expect(await applyTemplate("fixture", { interactive: false })).toBe(false);
    expect(rc()).toBe(1);
    expect(await snapshot(dir)).toEqual(before);
    expect(out).toContain("  - package.json (기존 필드를 두고 템플릿 키를 합침)");
    expect(out).toContain("  - app/page.tsx");
  });

  it("--dry-run: 합치기 · 생성 표시, 파일 그대로", async () => {
    const dir = await inTmp();
    await fs.outputJSON(path.join(dir, "package.json"), USER, { spaces: 2 });
    const before = await snapshot(dir);
    expect(await applyTemplate("fixture", { interactive: false, dryRun: true })).toBe(false);
    expect(await snapshot(dir)).toEqual(before);
    expect(out.some((l) => l.startsWith("  합치기 ") && l.endsWith("package.json (기존 필드를 두고 템플릿 키를 합침)"))).toBe(true);
    expect(out.some((l) => l.startsWith("  생성 ") && l.endsWith(path.join("app", "page.tsx")))).toBe(true);
  });

  it("init -y 로 비어 있지 않은 디렉터리: package.json 을 합치고 packageManager 가 남음, 다음 단계도 yarn", async () => {
    const dir = await inTmp();
    await fs.outputJSON(path.join(dir, "app", "package.json"), USER, { spaces: 2 });
    await initTemplate("fixture", { dir: "app", interactive: false, yes: true });
    expect(rc()).toBe(0);
    expect((await fs.readJSON(path.join(dir, "app", "package.json"))).packageManager).toBe("yarn@4.5.0");
    expect(out).toContain("  yarn install");
  });
});
