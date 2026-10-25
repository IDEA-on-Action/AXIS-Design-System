/**
 * axis add · list (WI-0045 FR-4 · FR-5 · D3)
 *
 * 레지스트리는 배포되는 SSOT(apps/web/public/r)를 동봉본 자리에 두고 씁니다(url null → 네트워크 없음).
 * 원격 경로는 127.0.0.1 임시 포트 서버로 따로 봅니다. 순환 · 누락 의존 · 미해석 import 는 임시 레지스트리 fixture 로 만듭니다.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { Command } from "commander";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_REGISTRY_URL, LEGACY_REGISTRY_NOTICE, RegistryClient, sha256Hex } from "../registry/index.js";
import { UTILS_TS_CONTENT, runInit } from "../init/init.js";
import {
  addCommandForSpecs,
  applyAgenticAlias,
  createClientFor,
  dependencyName,
  escapeReason,
  groupIndex,
  isSameOrInside,
  layoutFromConfig,
  relativeSpecifier,
  relativeSpecifierResolves,
  rewriteImports,
  runAdd,
  type AddOptions,
  type ConfirmFn,
} from "./add.js";
import { registerAddCommand, registerListCommand } from "./index.js";
import { HARDLINK_ERROR_CODE, writeNoFollow } from "./safe-write.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = path.resolve(HERE, "../../../../apps/web/public/r");

const created: string[] = [];
const cwd0 = process.cwd();

afterEach(async () => {
  process.chdir(cwd0);
  process.exitCode = undefined;
  vi.restoreAllMocks();
  for (const d of created.splice(0)) await fs.remove(d);
});

async function tmpDir(): Promise<string> {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), "axis-add-"));
  created.push(d);
  return fs.realpath(d);
}

/** init -y 와 같은 config(componentsDir ./src/components/ui) */
async function project(config: Record<string, unknown> = {}): Promise<string> {
  const dir = await tmpDir();
  await fs.writeJSON(path.join(dir, "axis.config.json"), {
    componentsDir: "./src/components/ui",
    registry: "https://axis-design-system.pages.dev/r",
    ...config,
  });
  return dir;
}

function bundledClient(dir = REGISTRY_DIR, notify: (m: string) => void = () => {}): RegistryClient {
  return new RegistryClient({ url: null, bundledDir: dir, notify });
}

interface Run {
  code: 0 | 1;
  out: string[];
  err: string[];
  written: string[];
  unchanged: string[];
  skipped: string[];
  overwritten: string[];
}

async function add(
  dir: string,
  names: string[],
  options: AddOptions = {},
  extra: { client?: RegistryClient; confirm?: ConfirmFn } = {}
): Promise<Run> {
  const out: string[] = [];
  const err: string[] = [];
  const r = await runAdd(dir, names, options, {
    client: extra.client ?? bundledClient(),
    log: (...a) => out.push(a.map(String).join(" ")),
    error: (...a) => err.push(a.map(String).join(" ")),
    ...(extra.confirm ? { confirm: extra.confirm } : {}),
  });
  return { code: r.exitCode, out, err, written: r.written, unchanged: r.unchanged, skipped: r.skipped, overwritten: r.overwritten };
}

/** 디렉터리 안 파일 전부(상대 경로 POSIX → 내용) */
async function snapshot(dir: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  async function walk(d: string) {
    for (const name of await fs.readdir(d)) {
      const p = path.join(d, name);
      const st = await fs.lstat(p);
      if (st.isDirectory()) await walk(p);
      else out[path.relative(dir, p).split(path.sep).join("/")] = st.isSymbolicLink() ? `->${await fs.readlink(p)}` : await fs.readFile(p, "utf8");
    }
  }
  await walk(dir);
  return out;
}

function registryContent(name: string): string {
  return (JSON.parse(readFileSync(path.join(REGISTRY_DIR, `${name}.json`), "utf8")) as { files: { content: string }[] }).files[0]
    .content;
}

/** 임시 레지스트리. items: 이름 → { deps, content } */
async function fixtureRegistry(
  items: Record<string, { type?: string; registryDependencies?: string[]; dependencies?: string[]; path?: string; content: string }>
): Promise<string> {
  const dir = await tmpDir();
  const entries = Object.entries(items).map(([name, it]) => {
    const item = {
      name,
      type: it.type ?? "registry:ui",
      dependencies: it.dependencies ?? [],
      registryDependencies: it.registryDependencies ?? [],
      files: [{ path: it.path ?? `components/ui/${name}.tsx`, type: it.type ?? "registry:ui", content: it.content }],
    };
    fs.writeJSONSync(path.join(dir, `${name}.json`), item);
    return { name, type: item.type, sha256: sha256Hex(it.content) };
  });
  await fs.writeJSON(path.join(dir, "index.json"), { version: "0.0.0-test", items: entries });
  return dir;
}

describe("add: 가변 인자(AC4)", () => {
  it("add button input card 는 셋 다 설치하고 utils 를 끌어옴", async () => {
    const dir = await project();
    const r = await add(dir, ["button", "input", "card"]);
    expect(r.code).toBe(0);
    expect(r.err).toEqual([]);
    expect(Object.keys(await snapshot(dir)).sort()).toEqual(
      [
        "axis.config.json",
        "src/components/ui/button.tsx",
        "src/components/ui/card.tsx",
        "src/components/ui/input.tsx",
        "src/components/ui/utils.ts",
      ].sort()
    );
  });

  it("없는 이름이 하나라도 있으면 아무것도 쓰지 않고 rc 1, 없는 이름을 모두 나열", async () => {
    const dir = await project();
    const before = await snapshot(dir);
    const r = await add(dir, ["button", "nope", "agentic-nope", "Bad_Name"]);
    expect(r.code).toBe(1);
    const text = r.err.join("\n");
    expect(text).toContain("'nope'");
    expect(text).toContain("'agentic-nope'");
    expect(text).toContain("'Bad_Name': 이름 규칙");
    expect(text).not.toContain("'button'");
    expect(text).toContain("아무것도 설치하지 않았습니다");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("commander 가 여러 이름을 받아 runAdd 로 넘김(종전 add <component> 는 나머지를 버렸음)", async () => {
    const dir = await project();
    process.chdir(dir);
    vi.spyOn(console, "log").mockImplementation(() => {});
    const program = new Command().exitOverride();
    registerAddCommand(program, { createClient: async () => bundledClient() });
    await program.parseAsync(["node", "axis", "add", "button", "input", "card", "-y"]);
    expect(process.exitCode).toBe(0);
    for (const f of ["button", "input", "card"]) {
      expect(await fs.pathExists(path.join(dir, `src/components/ui/${f}.tsx`))).toBe(true);
    }
  });

  it("이름 없이 부르면 commander 가 거부", async () => {
    const program = new Command().exitOverride().configureOutput({ writeErr: () => {} });
    registerAddCommand(program, { createClient: async () => bundledClient() });
    await expect(program.parseAsync(["node", "axis", "add"])).rejects.toThrow(/missing required argument/);
  });
});

describe("add: registryDependencies 재귀", () => {
  it("agentic-run-progress 는 utils · agentic-a11y-labels 를 함께 설치(의존 항목이 먼저)", async () => {
    const dir = await project();
    const r = await add(dir, ["agentic-run-progress"]);
    expect(r.code).toBe(0);
    expect(r.out[0]).toBe("설치 항목(3): agentic-a11y-labels, utils, agentic-run-progress");
    expect(r.written.sort()).toEqual(
      [
        "src/components/agentic/run-progress.tsx",
        "src/components/ui/agentic-a11y-labels.ts",
        "src/components/ui/utils.ts",
      ].sort()
    );
  });

  it("같은 의존 항목은 한 번만(button card → utils 1회)", async () => {
    const dir = await project();
    const r = await add(dir, ["button", "card", "button"]);
    expect(r.out[0]).toBe("설치 항목(3): utils, button, card");
  });

  it("순환(a → b → a, c → c)이어도 끝나고 항목마다 한 번만 설치", async () => {
    const reg = await fixtureRegistry({
      a: { registryDependencies: ["b"], content: "export const a = 1;\n" },
      b: { registryDependencies: ["a"], content: "export const b = 1;\n" },
      c: { registryDependencies: ["c"], content: "export const c = 1;\n" },
    });
    const dir = await project();
    const r = await add(dir, ["a", "c"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(0);
    expect(r.out[0]).toBe("설치 항목(3): b, a, c");
    expect(r.written.sort()).toEqual(["src/components/ui/a.tsx", "src/components/ui/b.tsx", "src/components/ui/c.tsx"]);
  });

  it("의존 항목이 레지스트리에 없으면 아무것도 쓰지 않고 rc 1", async () => {
    const reg = await fixtureRegistry({ a: { registryDependencies: ["ghost"], content: "export const a = 1;\n" } });
    const dir = await project();
    const before = await snapshot(dir);
    const r = await add(dir, ["a"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("a → ghost");
    expect(await snapshot(dir)).toEqual(before);
  });
});

describe("add: 배치", () => {
  it("ui 는 componentsDir, agentic 은 형제 agentic, lib 은 componentsDir(utils 는 init 위치). 경로가 이중이 되지 않음", async () => {
    const dir = await project();
    const r = await add(dir, ["button", "agentic-plan-card"]);
    expect(r.code).toBe(0);
    const files = Object.keys(await snapshot(dir));
    expect(files.sort()).toEqual(
      [
        "axis.config.json",
        "src/components/agentic/plan-card.tsx",
        "src/components/ui/agentic-a11y-labels.ts",
        "src/components/ui/button.tsx",
        "src/components/ui/utils.ts",
      ].sort()
    );
    expect(files.some((f) => f.includes("components/ui/components") || f.includes("registry/axis"))).toBe(false);
  });

  it("config 의 agenticDir 를 따름", async () => {
    const dir = await project({ componentsDir: "components/ui", agenticDir: "lib/agentic-ui" });
    const r = await add(dir, ["agentic-run-progress"]);
    expect(r.code).toBe(0);
    expect(r.written.sort()).toEqual(
      ["components/ui/agentic-a11y-labels.ts", "components/ui/utils.ts", "lib/agentic-ui/run-progress.tsx"].sort()
    );
    const content = await fs.readFile(path.join(dir, "lib/agentic-ui/run-progress.tsx"), "utf8");
    expect(content).toContain('from "../../components/ui/utils"');
    expect(content).toContain('from "../../components/ui/agentic-a11y-labels"');
  });

  it("Windows 에서 적은 역슬래시 componentsDir · agenticDir 도 같은 위치로 읽음", () => {
    expect(layoutFromConfig("/p", { componentsDir: "src\\components\\ui" } as never)).toMatchObject({
      componentsDir: "src/components/ui",
      agenticDir: "src/components/agentic",
    });
    expect(layoutFromConfig("/p", { componentsDir: ".\\src\\ui", agenticDir: "src\\agentic" } as never)).toMatchObject({
      componentsDir: "./src/ui",
      agenticDir: "src/agentic",
    });
    // 대조: POSIX 형태는 그대로
    expect(layoutFromConfig("/p", { componentsDir: "./src/components/ui" } as never)).toMatchObject({
      componentsDir: "./src/components/ui",
      agenticDir: "src/components/agentic",
    });
  });

  it("같은 설치 위치(같은 파일 이름의 ui · lib 항목)에 두 항목이 쓰면 rc 1, 아무것도 쓰지 않음", async () => {
    const reg = await fixtureRegistry({
      a: { path: "components/ui/same.tsx", content: "export const a = 1;\n" },
      l: { type: "registry:lib", path: "registry/axis/lib/same.tsx", content: "export const l = 1;\n" },
    });
    const dir = await project();
    const before = await snapshot(dir);
    const r = await add(dir, ["a", "l"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("같은 위치");
    expect(r.written).toEqual([]);
    expect(await snapshot(dir)).toEqual(before);
  });

  it("componentsDir 가 없으면 rc 1, 쓰지 않음", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { registry: "x" });
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("componentsDir");
    expect(Object.keys(await snapshot(dir))).toEqual(["axis.config.json"]);
  });

  it("axis.config.json 이 없으면 init 안내와 rc 1", async () => {
    const dir = await tmpDir();
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("npx @axis-ds/cli init");
  });

  it("init 이 쓴 utils.ts 와 레지스트리 utils 가 같아 add 가 「같은 내용」으로 건너뜀", async () => {
    const dir = await tmpDir();
    vi.spyOn(console, "log").mockImplementation(() => {});
    await runInit(dir, { componentsDir: "./src/components/ui", globalCss: "./src/app/globals.css" }, "https://axis-design-system.pages.dev/r", () => {});
    expect(await fs.readFile(path.join(dir, "src/components/ui/utils.ts"), "utf8")).toBe(UTILS_TS_CONTENT);
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(0);
    expect(r.unchanged).toEqual(["src/components/ui/utils.ts"]);
    expect(r.written).toEqual(["src/components/ui/button.tsx"]);
  });
});

describe("add: import 재작성", () => {
  it("표준 형태 import 가 설치 위치 기준 상대 경로(POSIX)로 바뀌고 @/registry 가 남지 않음", async () => {
    const dir = await project();
    await add(dir, ["button", "agentic-run-progress"]);
    const button = await fs.readFile(path.join(dir, "src/components/ui/button.tsx"), "utf8");
    const run = await fs.readFile(path.join(dir, "src/components/agentic/run-progress.tsx"), "utf8");
    expect(button).toContain('import { cn } from "./utils";');
    expect(run).toContain('import { cn } from "../ui/utils";');
    expect(run).toContain('import { STATUS_LABELS } from "../ui/agentic-a11y-labels";');
    for (const c of [button, run]) {
      expect(c).not.toContain("@/registry/");
      expect(c).not.toContain("\\");
    }
    // import 외 본문은 레지스트리와 같음
    expect(button.replace('"./utils"', '"@/registry/axis/lib/utils"')).toBe(registryContent("button"));
  });

  it("28개 항목 전부: 설치 뒤 재작성된 import 가 모두 실제 파일을 가리킴", async () => {
    const dir = await project();
    const index = JSON.parse(readFileSync(path.join(REGISTRY_DIR, "index.json"), "utf8")) as { items: { name: string }[] };
    const groups = groupIndex(JSON.parse(readFileSync(path.join(REGISTRY_DIR, "index.json"), "utf8")));
    const names = [...groups.ui, ...groups.agentic].map((e) => e.name);
    expect(names).toHaveLength(28);
    const r = await add(dir, names);
    expect(r.code).toBe(0);
    expect(r.written).toHaveLength(index.items.length);
    const snap = await snapshot(dir);
    let checked = 0;
    for (const [file, content] of Object.entries(snap)) {
      for (const m of content.matchAll(/from "(\.[^"]+)"/g)) {
        expect(relativeSpecifierResolves(path.join(dir, file), m[1]), `${file}: ${m[1]}`).toBe(true);
        checked++;
      }
      expect(content).not.toContain("@/registry/");
    }
    // 대조: 28 ui/agentic 이 utils 를, 11개가 a11y-labels 를 import(=39)
    expect(checked).toBe(39);
  });

  it("바꿀 대상이 없는 표준 형태 import 가 있으면 쓰기 전에 실패", async () => {
    const reg = await fixtureRegistry({
      a: { content: 'import { x } from "@/registry/axis/lib/missing";\nexport const a = x;\n' },
    });
    const dir = await project();
    const before = await snapshot(dir);
    const r = await add(dir, ["a"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("@/registry/axis/lib/missing");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("rewriteImports: from · export from · 동적 import 를 바꾸고 외부 패키지 · 다른 @/ 는 그대로", () => {
    const targets = {
      exact: new Map([["@/registry/axis/lib/utils", "/p/src/components/ui/utils.ts"]]),
      lib: new Map([["utils", "/p/src/components/ui/utils.ts"]]),
    };
    const src =
      'import { cn } from "@/registry/axis/lib/utils";\n' +
      "export { cn as c2 } from '@/registry/new-york/lib/utils';\n" +
      'const m = import("@/registry/axis/lib/utils");\n' +
      'import x from "@/lib/other";\nimport React from "react";\n';
    const r = rewriteImports(src, "/p/src/components/agentic/a.tsx", targets);
    expect(r.content).toBe(
      'import { cn } from "../ui/utils";\n' +
        "export { cn as c2 } from '../ui/utils';\n" +
        'const m = import("../ui/utils");\n' +
        'import x from "@/lib/other";\nimport React from "react";\n'
    );
    expect(r.rewritten).toHaveLength(3);
    expect(r.unresolved).toEqual([]);
  });

  it("relativeSpecifier: Windows 경로(path.win32)도 POSIX 구분자로", () => {
    expect(relativeSpecifier("C:\\p\\src\\components\\agentic\\a.tsx", "C:\\p\\src\\components\\ui\\utils.ts", path.win32)).toBe(
      "../ui/utils"
    );
    expect(relativeSpecifier("C:\\p\\ui\\b.tsx", "C:\\p\\ui\\utils.ts", path.win32)).toBe("./utils");
    // 대조: 같은 입력을 POSIX 구현으로 계산하면 역슬래시가 구분자가 아니라 결과가 다름
    expect(relativeSpecifier("C:\\p\\src\\components\\agentic\\a.tsx", "C:\\p\\src\\components\\ui\\utils.ts", path.posix)).not.toBe(
      "../ui/utils"
    );
  });

  it("relativeSpecifier 는 같은 디렉터리에 ./ 를 붙이고 확장자를 뗌", () => {
    expect(relativeSpecifier("/p/a/b.tsx", "/p/a/utils.ts")).toBe("./utils");
    expect(relativeSpecifier("/p/a/b.tsx", "/p/c/d/utils.ts")).toBe("../c/d/utils");
  });

  it("relativeSpecifierResolves 는 없는 파일을 거짓으로(음성 대조)", async () => {
    const dir = await tmpDir();
    await fs.outputFile(path.join(dir, "ui/utils.ts"), "");
    expect(relativeSpecifierResolves(path.join(dir, "ui/b.tsx"), "./utils")).toBe(true);
    expect(relativeSpecifierResolves(path.join(dir, "ui/b.tsx"), "./nope")).toBe(false);
    expect(relativeSpecifierResolves(path.join(dir, "agentic/b.tsx"), "./utils")).toBe(false);
  });
});

describe("add: 덮어쓰기(D3, AC3)", () => {
  async function withModifiedButton() {
    const dir = await project();
    await add(dir, ["button"]);
    const file = path.join(dir, "src/components/ui/button.tsx");
    await fs.appendFile(file, "// 사용자 수정\n");
    return { dir, file, modified: await fs.readFile(file, "utf8") };
  }

  it("같은 내용이면 묻지 않고 건너뜀(안내)", async () => {
    const dir = await project();
    await add(dir, ["button"]);
    const confirm = vi.fn(async () => true);
    const r = await add(dir, ["button"], {}, { confirm });
    expect(r.code).toBe(0);
    expect(confirm).not.toHaveBeenCalled();
    expect(r.unchanged.sort()).toEqual(["src/components/ui/button.tsx", "src/components/ui/utils.ts"]);
    expect(r.out.join("\n")).toContain("src/components/ui/button.tsx (같은 내용이라 건너뜀)");
  });

  it("-y 는 내용이 다른 파일을 건너뛰고 목록을 안내", async () => {
    const { dir, file, modified } = await withModifiedButton();
    const confirm = vi.fn(async () => true);
    const r = await add(dir, ["button"], { yes: true }, { confirm });
    expect(r.code).toBe(0);
    expect(confirm).not.toHaveBeenCalled();
    expect(r.skipped).toEqual(["src/components/ui/button.tsx"]);
    expect(r.out.join("\n")).toContain("--overwrite");
    expect(await fs.readFile(file, "utf8")).toBe(modified);
  });

  it("--overwrite 만 덮어씀", async () => {
    const { dir, file, modified } = await withModifiedButton();
    const r = await add(dir, ["button"], { overwrite: true });
    expect(r.code).toBe(0);
    expect(r.written).toEqual(["src/components/ui/button.tsx"]);
    const now = await fs.readFile(file, "utf8");
    expect(now).not.toBe(modified);
    expect(now).toContain('from "./utils"');
  });

  it("-y 와 --overwrite 를 함께 주면 덮어씀", async () => {
    const { dir, modified, file } = await withModifiedButton();
    const r = await add(dir, ["button"], { yes: true, overwrite: true });
    expect(r.written).toEqual(["src/components/ui/button.tsx"]);
    expect(await fs.readFile(file, "utf8")).not.toBe(modified);
  });

  it("대화형은 다른 파일마다 묻고 답대로 처리", async () => {
    const { dir, file, modified } = await withModifiedButton();
    const no = vi.fn<(message: string) => Promise<boolean>>(async () => false);
    const r1 = await add(dir, ["button"], {}, { confirm: no });
    expect(no).toHaveBeenCalledTimes(1);
    expect(no.mock.calls[0][0]).toContain("src/components/ui/button.tsx");
    expect(r1.skipped).toEqual(["src/components/ui/button.tsx"]);
    expect(await fs.readFile(file, "utf8")).toBe(modified);
    const yes = vi.fn(async () => true);
    const r2 = await add(dir, ["button"], {}, { confirm: yes });
    expect(r2.written).toEqual(["src/components/ui/button.tsx"]);
    expect(await fs.readFile(file, "utf8")).not.toBe(modified);
  });
});

describe("add: 경로 이탈(AC3)", () => {
  it("componentsDir 가 ../ 로 프로젝트 밖이면 거부, 밖에 아무것도 생기지 않음", async () => {
    const parent = await tmpDir();
    const dir = path.join(parent, "app");
    await fs.ensureDir(dir);
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "../outside" });
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("프로젝트 디렉터리 밖");
    expect(await fs.pathExists(path.join(parent, "outside"))).toBe(false);
  });

  it("componentsDir 가 밖을 가리키는 심볼릭 링크면 거부", async () => {
    const outside = await tmpDir();
    const dir = await project({ componentsDir: "./src/components/ui" });
    await fs.ensureDir(path.join(dir, "src/components"));
    await fs.symlink(outside, path.join(dir, "src/components/ui"), "dir");
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("실제 위치");
    expect(await fs.readdir(outside)).toEqual([]);
  });

  it("기존 파일이 밖의 파일로 가는 링크면 -y · --overwrite 여도 거부, 밖 파일은 그대로", async () => {
    const outside = await tmpDir();
    const victim = path.join(outside, "victim.tsx");
    await fs.writeFile(victim, "원본\n");
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.symlink(victim, path.join(dir, "src/components/ui/button.tsx"));
    const r = await add(dir, ["button"], { yes: true, overwrite: true });
    expect(r.code).toBe(1);
    expect(await fs.readFile(victim, "utf8")).toBe("원본\n");
    expect(r.written).toEqual([]);
  });

  it("양성 대조: 프로젝트 안을 가리키는 링크 디렉터리는 허용", async () => {
    const dir = await project({ componentsDir: "./ui-link" });
    await fs.ensureDir(path.join(dir, "real/ui"));
    await fs.symlink(path.join(dir, "real/ui"), path.join(dir, "ui-link"), "dir");
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(0);
    expect(await fs.pathExists(path.join(dir, "real/ui/button.tsx"))).toBe(true);
  });

  it.each([
    ["../ 이탈", "../../../evil.tsx"],
    ["중간의 ..", "components/../../evil.tsx"],
    ["절대 경로", "/tmp/evil-abs.tsx"],
    ["Windows 드라이브", "C:/evil.tsx"],
    ["역슬래시", "..\\..\\evil-win.tsx"],
    ["확장자 없음", "components/ui/x"],
    ["ts · tsx 아닌 파일", "components/ui/package.json"],
    ["숨김 파일", "components/ui/.env"],
  ])("file.path 가 %s(%s)면 거부하고 아무것도 쓰지 않음(rc 1)", async (_label, bad) => {
    const reg = await fixtureRegistry({ a: { path: bad, content: "export const a = 1;\n" } });
    const parent = await tmpDir();
    const dir = path.join(parent, "app");
    await fs.ensureDir(dir);
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./src/components/ui" });
    const before = await snapshot(parent);
    const r = await add(dir, ["a"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("파일 경로가 올바르지 않습니다");
    expect(r.written).toEqual([]);
    expect(await snapshot(parent)).toEqual(before);
  });

  it("files[].target 이 이탈 경로여도 거부", async () => {
    const reg = await fixtureRegistry({ a: { content: "export const a = 1;\n" } });
    const item = await fs.readJSON(path.join(reg, "a.json"));
    item.files[0].target = "../../../evil-target.tsx";
    await fs.writeJSON(path.join(reg, "a.json"), item);
    const dir = await project();
    const before = await snapshot(dir);
    const r = await add(dir, ["a"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(1);
    expect(await snapshot(dir)).toEqual(before);
  });

  it("양성 대조: 하위 디렉터리가 있는 정상 file.path(.ts · .tsx)는 설치", async () => {
    const reg = await fixtureRegistry({
      a: { path: "components/ui/a-b.tsx", content: "export const a = 1;\n" },
      l: { type: "registry:lib", path: "registry/axis/lib/l.ts", content: "export const l = 1;\n" },
    });
    const dir = await project();
    const r = await add(dir, ["a", "l"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(0);
    expect(r.written.sort()).toEqual(["src/components/ui/a-b.tsx", "src/components/ui/l.ts"]);
  });

  it("확인 중에 상위 디렉터리가 밖을 가리키는 링크로 바뀌면 쓰기 직전 재검사가 막고 밖에 디렉터리도 만들지 않음", async () => {
    const outside = await tmpDir();
    const dir = await project();
    await add(dir, ["button"]);
    await fs.remove(path.join(dir, "src/components/ui/utils.ts"));
    await fs.appendFile(path.join(dir, "src/components/ui/button.tsx"), "// 사용자 수정\n");
    const confirm: ConfirmFn = async () => {
      // 판정 뒤 · 쓰기 전에 src/components 를 밖으로 바꿉니다(경합 모사)
      await fs.move(path.join(dir, "src/components"), path.join(dir, "components-moved"));
      await fs.symlink(outside, path.join(dir, "src/components"), "dir");
      return true;
    };
    const r = await add(dir, ["button"], {}, { confirm });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("밖");
    expect(await fs.readdir(outside)).toEqual([]);
  });

  it("부모 디렉터리를 만든 직후 밖을 가리키는 링크로 바뀌면 쓰지 않음", async () => {
    const outside = await tmpDir();
    const dir = await project();
    const realEnsureDir = fs.ensureDir.bind(fs);
    vi.spyOn(fs, "ensureDir").mockImplementation((async (p: string) => {
      await realEnsureDir(p);
      if (p === path.join(dir, "src/components/ui")) {
        await fs.remove(p);
        await fs.symlink(outside, p, "dir");
      }
    }) as unknown as typeof fs.ensureDir);
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("실제 위치");
    expect(await fs.readdir(outside)).toEqual([]);
  });
});

describe("add: 쓰기 순간의 링크", () => {
  it("검사 뒤 쓰기 직전에 대상이 밖을 가리키는 링크로 바뀌어도 따라가지 않고 rc 1", async () => {
    if (process.platform === "win32") return;
    const outside = await tmpDir();
    const victim = path.join(outside, "victim.tsx");
    await fs.writeFile(victim, "원본\n");
    const dir = await project();
    const realOpen = fs.open.bind(fs) as (...a: unknown[]) => Promise<number>;
    vi.spyOn(fs, "open").mockImplementation((async (...args: unknown[]) => {
      const target = args[0] as string;
      if (target === path.join(dir, "src/components/ui/button.tsx")) await fs.symlink(victim, target);
      return realOpen(...args);
    }) as unknown as typeof fs.open);
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("링크로 바뀌었습니다");
    expect(r.err.join("\n")).toContain("이미 쓴 파일");
    expect(await fs.readFile(victim, "utf8")).toBe("원본\n");
  });
});

describe("add: 기존 대상이 심볼릭 링크(M1 · D12)", () => {
  it("실제로 덮어써야 하는 링크(--overwrite)는 쓰기 전에 거부하고 아무것도 쓰지 않음(부분 설치 0)", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.writeFile(path.join(dir, "real-input.tsx"), "// 사용자 파일\n");
    // input 이 card · button 보다 뒤에 쓰이도록 여러 항목을 함께 요청합니다(종전에는 앞 항목이 쓰인 뒤 ELOOP)
    await fs.symlink(path.join(dir, "real-input.tsx"), path.join(dir, "src/components/ui/input.tsx"));
    const before = await snapshot(dir);
    const r = await add(dir, ["button", "card", "input"], { yes: true, overwrite: true });
    expect(r.code).toBe(1);
    expect(r.written).toEqual([]);
    expect(r.err.join("\n")).toContain("심볼릭 링크");
    expect(r.err.join("\n")).toContain("src/components/ui/input.tsx");
    expect(r.err.join("\n")).not.toContain("ELOOP");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("대화형에서 링크 덮어쓰기에 예라고 답해도 쓰지 않고 거부", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.writeFile(path.join(dir, "real-button.tsx"), "// 사용자 파일\n");
    await fs.symlink(path.join(dir, "real-button.tsx"), path.join(dir, "src/components/ui/button.tsx"));
    const before = await snapshot(dir);
    const r = await add(dir, ["button"], {}, { confirm: async () => true });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("심볼릭 링크");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("내용이 같은 링크는 쓰지 않고 건너뜀(--overwrite 여도 rc 0, 링크 · 원본 그대로)", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "shared"));
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    // 모노레포 공용 utils 를 링크해 둔 프로젝트(내용은 레지스트리 utils 와 같음)
    await fs.writeFile(path.join(dir, "shared/utils.ts"), registryContent("utils"));
    await fs.symlink(path.join(dir, "shared/utils.ts"), path.join(dir, "src/components/ui/utils.ts"));
    for (const options of [{}, { yes: true }, { overwrite: true }] as AddOptions[]) {
      const r = await add(dir, ["button"], options);
      expect(r.code, JSON.stringify(options)).toBe(0);
      expect(r.unchanged).toContain("src/components/ui/utils.ts");
      expect(r.written).not.toContain("src/components/ui/utils.ts");
      expect((await fs.lstat(path.join(dir, "src/components/ui/utils.ts"))).isSymbolicLink()).toBe(true);
      expect(await fs.readFile(path.join(dir, "shared/utils.ts"), "utf8")).toBe(registryContent("utils"));
    }
    expect(await fs.pathExists(path.join(dir, "src/components/ui/button.tsx"))).toBe(true);
  });

  it("내용이 다른 링크를 -y 로 건너뛰는 경우는 쓰지 않으므로 막지 않음(rc 0, 건너뜀 목록)", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "shared"));
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.writeFile(path.join(dir, "shared/utils.ts"), "// 사용자 utils\n");
    await fs.symlink(path.join(dir, "shared/utils.ts"), path.join(dir, "src/components/ui/utils.ts"));
    const r = await add(dir, ["button"], { yes: true });
    expect(r.code).toBe(0);
    expect(r.skipped).toEqual(["src/components/ui/utils.ts"]);
    expect(await fs.readFile(path.join(dir, "shared/utils.ts"), "utf8")).toBe("// 사용자 utils\n");
  });

  it("양성 대조: 링크가 없으면 같은 요청이 설치됨", async () => {
    const dir = await project();
    const r = await add(dir, ["button", "card", "input"], { yes: true });
    expect(r.code).toBe(0);
    expect(r.written).toContain("src/components/ui/input.tsx");
  });
});

describe("add: 프로젝트 밖을 가리키는 링크 대상(D15)", () => {
  /** utils.ts 를 프로젝트 밖 파일로 가는 링크로 둔 프로젝트(모노레포 공용 utils 등) */
  async function outsideLinkedUtils(content: string): Promise<{ dir: string; shared: string }> {
    const outside = await tmpDir();
    const shared = path.join(outside, "utils.ts");
    await fs.writeFile(shared, content);
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.symlink(shared, path.join(dir, "src/components/ui/utils.ts"));
    return { dir, shared };
  }

  it("내용이 같으면 쓰지 않고 건너뛰며 링크 대상이 밖이라는 사실을 알림(옵션 무관 rc 0, 링크 · 밖 파일 그대로)", async () => {
    if (process.platform === "win32") return;
    const { dir, shared } = await outsideLinkedUtils(registryContent("utils"));
    const sharedMtime = (await fs.stat(shared)).mtimeMs;
    for (const options of [{}, { yes: true }, { overwrite: true }] as AddOptions[]) {
      const r = await add(dir, ["button"], options);
      expect(r.code, JSON.stringify(options)).toBe(0);
      expect(r.unchanged).toContain("src/components/ui/utils.ts");
      expect(r.written).not.toContain("src/components/ui/utils.ts");
      expect(r.out).toContain("  = src/components/ui/utils.ts (같은 내용이라 건너뜀, 링크 대상이 프로젝트 밖)");
      expect((await fs.lstat(path.join(dir, "src/components/ui/utils.ts"))).isSymbolicLink()).toBe(true);
      expect(await fs.readFile(shared, "utf8")).toBe(registryContent("utils"));
      expect((await fs.stat(shared)).mtimeMs).toBe(sharedMtime);
    }
    expect(await fs.pathExists(path.join(dir, "src/components/ui/button.tsx"))).toBe(true);
  });

  it("내용이 다른 밖 링크를 -y 로 건너뛰는 경우도 쓰지 않으므로 rc 0, 건너뜀 목록에 사실을 함께 적음", async () => {
    if (process.platform === "win32") return;
    const { dir, shared } = await outsideLinkedUtils("// 공용 utils\n");
    const r = await add(dir, ["button"], { yes: true });
    expect(r.code).toBe(0);
    expect(r.skipped).toEqual(["src/components/ui/utils.ts"]);
    expect(r.out).toContain("  - src/components/ui/utils.ts (링크 대상이 프로젝트 밖)");
    expect(await fs.readFile(shared, "utf8")).toBe("// 공용 utils\n");
  });

  it("실제로 써야 하는 밖 링크(--overwrite)는 계속 거부하고 아무것도 쓰지 않음(rc 1)", async () => {
    if (process.platform === "win32") return;
    const { dir, shared } = await outsideLinkedUtils("// 공용 utils\n");
    const before = await snapshot(dir);
    const r = await add(dir, ["button", "card"], { overwrite: true });
    expect(r.code).toBe(1);
    expect(r.written).toEqual([]);
    expect(r.err.join("\n")).toContain("프로젝트 밖");
    expect(r.err.join("\n")).toContain("src/components/ui/utils.ts");
    expect(await snapshot(dir)).toEqual(before);
    expect(await fs.readFile(shared, "utf8")).toBe("// 공용 utils\n");
  });

  it("대화형에서 밖 링크 덮어쓰기에 예라고 답해도 쓰지 않고 rc 1", async () => {
    if (process.platform === "win32") return;
    const { dir, shared } = await outsideLinkedUtils("// 공용 utils\n");
    const before = await snapshot(dir);
    const r = await add(dir, ["button"], {}, { confirm: async () => true });
    expect(r.code).toBe(1);
    expect(await snapshot(dir)).toEqual(before);
    expect(await fs.readFile(shared, "utf8")).toBe("// 공용 utils\n");
  });

  it("밖 링크의 대상이 디렉터리면 종전처럼 rc 1, 아무것도 쓰지 않음", async () => {
    if (process.platform === "win32") return;
    const outside = await tmpDir();
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.symlink(outside, path.join(dir, "src/components/ui/utils.ts"));
    const before = await snapshot(dir);
    const r = await add(dir, ["button"], { yes: true });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("디렉터리");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("밖 링크의 대상을 읽을 수 없으면 종전처럼 rc 1, 아무것도 쓰지 않음", async () => {
    if (process.platform === "win32" || process.getuid?.() === 0) return;
    const { dir, shared } = await outsideLinkedUtils(registryContent("utils"));
    await fs.chmod(shared, 0o000);
    try {
      const before = await snapshot(path.join(dir, "src"));
      const r = await add(dir, ["button"], { yes: true });
      expect(r.code).toBe(1);
      expect(r.err.join("\n")).toContain("읽지 못해");
      expect(await snapshot(path.join(dir, "src"))).toEqual(before);
    } finally {
      await fs.chmod(shared, 0o644);
    }
  });

  it("음성 대조: 밖 링크가 아니라 밖 디렉터리 안에 쓰게 되는 상위 링크는 내용이 같아도 종전처럼 거부", async () => {
    if (process.platform === "win32") return;
    const outside = await tmpDir();
    await fs.writeFile(path.join(outside, "utils.ts"), registryContent("utils"));
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components"));
    await fs.symlink(outside, path.join(dir, "src/components/ui"), "dir");
    const r = await add(dir, ["button"], { yes: true });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("실제 위치");
    expect(await fs.readdir(outside)).toEqual(["utils.ts"]);
  });
});

describe("add: 확인 대기 중 경합(n3)", () => {
  it("새 파일로 판정한 뒤 확인 대기 중에 같은 이름의 파일이 생기면 덮어쓰지 않고 그 경로를 알린 뒤 rc 1", async () => {
    const dir = await project();
    const ui = path.join(dir, "src/components/ui");
    await fs.ensureDir(ui);
    await fs.writeFile(path.join(ui, "button.tsx"), "// 사용자 button\n");
    const cardPath = path.join(ui, "card.tsx");
    let asked = 0;
    // card 는 처음에 없어서 새 파일(write)로 판정되고, button 확인을 기다리는 동안 사용자가 card 를 만듭니다
    const r = await add(dir, ["card", "button"], {}, {
      confirm: async () => {
        asked++;
        if (!(await fs.pathExists(cardPath))) await fs.writeFile(cardPath, "// 확인 대기 중에 만든 card\n");
        return false;
      },
    });
    expect(asked).toBe(1);
    expect(r.code).toBe(1);
    expect(await fs.readFile(cardPath, "utf8")).toBe("// 확인 대기 중에 만든 card\n");
    expect(r.written).not.toContain("src/components/ui/card.tsx");
    const err = r.err.join("\n");
    expect(err).toContain("src/components/ui/card.tsx");
    expect(err).toContain("같은 이름의 파일이 생겼습니다");
    expect(err).toContain("덮어쓰지 않았습니다");
    // 출력 표기가 실제 동작과 맞음: 쓰인 것은 + (새 파일)로만 나오고 card 는 나오지 않음
    expect(r.out.some((l) => l.includes("card.tsx"))).toBe(false);
    expect(await fs.readFile(path.join(ui, "button.tsx"), "utf8")).toBe("// 사용자 button\n");
  });

  it("덮어쓰기로 판정한 파일이 확인 대기 중 지워지면 새로 만들고 + 로 표기한다(overwritten 에 넣지 않음)", async () => {
    const dir = await project();
    const ui = path.join(dir, "src/components/ui");
    await fs.ensureDir(ui);
    const btn = path.join(ui, "button.tsx");
    await fs.writeFile(btn, "// 사용자 수정본\n");
    const r = await add(dir, ["button"], {}, {
      confirm: async () => {
        await fs.unlink(btn);
        return true;
      },
    });
    expect(r.code).toBe(0);
    expect(r.written).toContain("src/components/ui/button.tsx");
    expect(r.overwritten).not.toContain("src/components/ui/button.tsx");
    expect(r.out).toContain("  + src/components/ui/button.tsx");
    expect(r.out.some((l) => l.includes("button.tsx (덮어씀)"))).toBe(false);
    expect(await fs.readFile(btn, "utf8")).not.toBe("// 사용자 수정본\n");
  });

  it("대조: 덮어쓰기에 동의하고 파일이 그대로 있으면 ~ (덮어씀)", async () => {
    const dir = await project();
    const ui = path.join(dir, "src/components/ui");
    await fs.ensureDir(ui);
    const btn = path.join(ui, "button.tsx");
    await fs.writeFile(btn, "// 사용자 수정본\n");
    const r = await add(dir, ["button"], {}, { confirm: async () => true });
    expect(r.code).toBe(0);
    expect(r.overwritten).toContain("src/components/ui/button.tsx");
    expect(r.out).toContain("  ~ src/components/ui/button.tsx (덮어씀)");
  });

  it("대조: 처음부터 있던 파일은 묻고, 아니라고 답하면 건너뜀(rc 0)", async () => {
    const dir = await project();
    const ui = path.join(dir, "src/components/ui");
    await fs.ensureDir(ui);
    await fs.writeFile(path.join(ui, "card.tsx"), "// 사용자 card\n");
    let asked = 0;
    const r = await add(dir, ["card"], {}, { confirm: async () => (asked++, false) });
    expect(asked).toBe(1);
    expect(r.code).toBe(0);
    expect(r.skipped).toEqual(["src/components/ui/card.tsx"]);
  });

  it("양성 대조: 경합이 없으면 같은 요청이 card 를 + 로 새로 씀", async () => {
    const dir = await project();
    const ui = path.join(dir, "src/components/ui");
    await fs.ensureDir(ui);
    await fs.writeFile(path.join(ui, "button.tsx"), "// 사용자 button\n");
    const r = await add(dir, ["card", "button"], {}, { confirm: async () => false });
    expect(r.code).toBe(0);
    expect(r.out).toContain("  + src/components/ui/card.tsx");
    expect(await fs.readFile(path.join(ui, "card.tsx"), "utf8")).toContain("CardFooter");
  });
});

describe("add: 종전 기본 레지스트리 주소 이전(D13)", () => {
  async function clientFor(registry: string | undefined, env: NodeJS.ProcessEnv = {}) {
    const dir = await project(registry === undefined ? {} : { registry });
    if (registry === undefined) {
      const cfg = await fs.readJSON(path.join(dir, "axis.config.json"));
      delete cfg.registry;
      await fs.writeJSON(path.join(dir, "axis.config.json"), cfg);
    }
    const messages: string[] = [];
    const client = await createClientFor(dir, (m) => messages.push(m), env);
    const before = await fs.readFile(path.join(dir, "axis.config.json"), "utf8");
    return { dir, messages, baseUrl: (client as unknown as { baseUrl: string | null }).baseUrl, before };
  }

  it.each(["https://axis.minu.best/r", "https://axis.minu.best/r/"])(
    "config 가 종전 기본값(%s)이면 새 기본값으로 조회하고 안내 1줄, 파일은 고치지 않음",
    async (registry) => {
      const r = await clientFor(registry);
      expect(r.baseUrl).toBe(DEFAULT_REGISTRY_URL);
      expect(r.messages).toEqual([LEGACY_REGISTRY_NOTICE]);
      expect(LEGACY_REGISTRY_NOTICE).toContain("axis.config.json 의 registry 를 고치면 이 안내가 사라져요");
      expect(await fs.readFile(path.join(r.dir, "axis.config.json"), "utf8")).toBe(r.before);
      expect((await fs.readJSON(path.join(r.dir, "axis.config.json"))).registry).toBe(registry);
    }
  );

  it.each(["https://axis.minu.best/rx", "https://mirror.example/r"])("다른 주소(%s)는 그대로 쓰고 안내 없음", async (registry) => {
    const r = await clientFor(registry);
    expect(r.baseUrl).toBe(registry);
    expect(r.messages).toEqual([]);
  });

  it("AXIS_REGISTRY_URL 이 있으면 그 값을 쓰고 이전 안내 없음", async () => {
    const r = await clientFor("https://axis.minu.best/r", { AXIS_REGISTRY_URL: "http://127.0.0.1:9/r" });
    expect(r.baseUrl).toBe("http://127.0.0.1:9/r");
    expect(r.messages).toEqual([]);
  });

  it("양성 대조: registry 가 없으면 기본값이고 안내 없음", async () => {
    const r = await clientFor(undefined);
    expect(r.baseUrl).toBe(DEFAULT_REGISTRY_URL);
    expect(r.messages).toEqual([]);
  });
});

describe("add: 디렉터리를 가리키는 링크 · 읽을 수 없는 기존 파일", () => {
  it("대상이 프로젝트 안 디렉터리를 가리키는 링크면 예외 없이 rc 1, 안내하고 아무것도 쓰지 않음", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "somedir"));
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.symlink(path.join(dir, "somedir"), path.join(dir, "src/components/ui/badge.tsx"));
    const before = await snapshot(dir);
    const r = await add(dir, ["button", "badge"], { yes: true });
    expect(r.code).toBe(1);
    expect(r.written).toEqual([]);
    expect(r.err.join("\n")).toContain("디렉터리");
    expect(r.err.join("\n")).toContain("badge.tsx");
    expect(r.err.join("\n")).not.toContain("EISDIR");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("기존 파일을 읽을 수 없으면 예외 없이 rc 1, 묻지 않고 아무것도 쓰지 않음", async () => {
    if (process.platform === "win32" || process.getuid?.() === 0) return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    const target = path.join(dir, "src/components/ui/button.tsx");
    await fs.writeFile(target, "// 사용자 파일\n");
    await fs.chmod(target, 0o000);
    try {
      let asked = 0;
      const r = await add(dir, ["button"], {}, { confirm: async () => (asked++, true) });
      expect(r.code).toBe(1);
      expect(r.written).toEqual([]);
      expect(asked).toBe(0);
      expect(r.err.join("\n")).toContain("읽지 못해");
      expect(r.err.join("\n")).toContain("src/components/ui/button.tsx");
      expect(await fs.pathExists(path.join(dir, "src/components/ui/utils.ts"))).toBe(false);
    } finally {
      await fs.chmod(target, 0o644);
    }
  });
});

describe("add: 쓴 뒤 사후 검사(M2 · m3)", () => {
  it("검사 뒤 쓰기 전에 상위 디렉터리가 밖을 가리키는 링크로 바뀌어 밖에 쓰이면, 지우지 않고 그 경로를 알리며 rc 1", async () => {
    if (process.platform === "win32") return;
    const outside = await tmpDir();
    const dir = await project();
    const uiDir = path.join(dir, "src/components/ui");
    const realOpen = fs.open.bind(fs) as (...a: unknown[]) => Promise<number>;
    let swapped = false;
    vi.spyOn(fs, "open").mockImplementation((async (...args: unknown[]) => {
      const target = args[0] as string;
      if (!swapped && target === path.join(uiDir, "button.tsx")) {
        // 쓰기 직전 재검사(checkParentInside) 뒤 · 실제 쓰기 전에 상위 디렉터리를 밖으로 바꿉니다(경합 모사)
        swapped = true;
        await fs.move(uiDir, path.join(dir, "ui-moved"));
        await fs.symlink(outside, uiDir, "dir");
      }
      return realOpen(...args);
    }) as unknown as typeof fs.open);
    const r = await add(dir, ["button"]);
    expect(swapped).toBe(true);
    expect(r.code).toBe(1);
    const text = r.err.join("\n");
    expect(text).toContain("쓴 뒤 확인한 실제 위치");
    expect(text).toContain("지우지 않았습니다");
    expect(text).toContain(path.join(outside, "button.tsx"));
    // 밖에 쓰인 파일은 이 CLI 가 지우지 않음(사용자 파일을 지우는 경로 없음)
    expect(await fs.readdir(outside)).toEqual(["button.tsx"]);
    expect(r.written).not.toContain("src/components/ui/button.tsx");
  });

  it("프로젝트 안에 정상으로 쓴 뒤(사후 검사 전) 상위가 바깥 링크로 바뀌면, 바깥의 같은 이름 파일을 지우지 않고 rc 1", async () => {
    if (process.platform === "win32") return;
    const outside = await tmpDir();
    const victim = path.join(outside, "button.tsx");
    await fs.writeFile(victim, "피해자 원본\n");
    const dir = await project();
    const uiDir = path.join(dir, "src/components/ui");
    const opened = new Map<number, string>();
    const realOpen = fs.open.bind(fs) as (...a: unknown[]) => Promise<number>;
    vi.spyOn(fs, "open").mockImplementation((async (...args: unknown[]) => {
      const fd = await realOpen(...args);
      opened.set(fd, args[0] as string);
      return fd;
    }) as unknown as typeof fs.open);
    const realClose = fs.close.bind(fs) as (fd: number) => Promise<void>;
    let swapped = false;
    vi.spyOn(fs, "close").mockImplementation((async (fd: number) => {
      await realClose(fd);
      // 쓰기가 끝나 fd 를 닫은 직후, 사후 검사 전에 상위 디렉터리를 바깥으로 바꿉니다(경합 모사)
      if (!swapped && opened.get(fd) === path.join(uiDir, "button.tsx")) {
        swapped = true;
        await fs.move(uiDir, path.join(dir, "ui-moved"));
        await fs.symlink(outside, uiDir, "dir");
      }
    }) as unknown as typeof fs.close);
    const r = await add(dir, ["button"]);
    expect(swapped).toBe(true);
    expect(r.code).toBe(1);
    const text = r.err.join("\n");
    expect(text).toContain("쓴 뒤 확인한 실제 위치");
    expect(text).toContain("지우지 않았습니다");
    // 우리가 쓰지 않은 바깥 파일은 그대로, 우리가 쓴 파일(옮겨진 위치)도 그대로
    expect(await fs.readFile(victim, "utf8")).toBe("피해자 원본\n");
    expect(await fs.pathExists(path.join(dir, "ui-moved/button.tsx"))).toBe(true);
  });
});

describe("add: 하드링크로 이어진 기존 파일(D19)", () => {
  /** ui 디렉터리에 name 을 두고 프로젝트 안 다른 경로(shared/<name>)와 하드링크로 잇습니다 */
  async function hardlinked(dir: string, name: string, content: string): Promise<{ target: string; other: string }> {
    const ui = path.join(dir, "src/components/ui");
    await fs.ensureDir(ui);
    await fs.ensureDir(path.join(dir, "shared"));
    const other = path.join(dir, "shared", name);
    await fs.writeFile(other, content);
    const target = path.join(ui, name);
    await fs.link(other, target);
    return { target, other };
  }

  it("--overwrite 로 덮어써야 하는 파일이 하드링크면 쓰기 전에 거부하고 아무것도 쓰지 않음(rc 1, 경로 · 이유 안내)", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    // input 이 button · card 보다 뒤에 쓰이도록 함께 요청합니다(계획 단계 판정이 없으면 앞 항목이 먼저 쓰임)
    const { target, other } = await hardlinked(dir, "input.tsx", "// 사용자 input\n");
    expect((await fs.lstat(target)).nlink).toBe(2);
    const before = await snapshot(dir);
    const r = await add(dir, ["button", "card", "input"], { overwrite: true });
    expect(r.code).toBe(1);
    expect(r.written).toEqual([]);
    const err = r.err.join("\n");
    expect(err).toContain("설치할 수 없어 아무것도 쓰지 않았습니다");
    expect(err).toContain("src/components/ui/input.tsx");
    expect(err).toContain("다른 경로와 하드링크로 이어진 파일이라");
    expect(await snapshot(dir)).toEqual(before);
    expect(await fs.readFile(other, "utf8")).toBe("// 사용자 input\n");
  });

  it("대화형에서 덮어쓰기에 예라고 답해도 하드링크면 rc 1, 아무것도 쓰지 않음", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    const { other } = await hardlinked(dir, "utils.ts", "// 사용자 utils\n");
    const before = await snapshot(dir);
    const r = await add(dir, ["button"], {}, { confirm: async () => true });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("하드링크");
    expect(await snapshot(dir)).toEqual(before);
    expect(await fs.readFile(other, "utf8")).toBe("// 사용자 utils\n");
  });

  it("내용이 같은 하드링크는 쓰지 않으므로 건너뜀(--overwrite 여도 rc 0)", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    const { target } = await hardlinked(dir, "utils.ts", registryContent("utils"));
    const r = await add(dir, ["button"], { overwrite: true });
    expect(r.code).toBe(0);
    expect(r.unchanged).toContain("src/components/ui/utils.ts");
    expect((await fs.lstat(target)).nlink).toBe(2);
  });

  it("-y 로 건너뛰는 하드링크는 쓰지 않으므로 거부하지 않음(rc 0, 건너뜀 목록)", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    const { other } = await hardlinked(dir, "utils.ts", "// 사용자 utils\n");
    const r = await add(dir, ["button"], { yes: true });
    expect(r.code).toBe(0);
    expect(r.skipped).toEqual(["src/components/ui/utils.ts"]);
    expect(await fs.readFile(other, "utf8")).toBe("// 사용자 utils\n");
  });

  it("양성 대조: 하드링크가 아닌 같은 파일은 --overwrite 로 덮어씀(~)", async () => {
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.writeFile(path.join(dir, "src/components/ui/input.tsx"), "// 사용자 input\n");
    const r = await add(dir, ["button", "card", "input"], { overwrite: true });
    expect(r.code).toBe(0);
    expect(r.overwritten).toEqual(["src/components/ui/input.tsx"]);
  });

  it("경합: 계획 뒤 쓰기 직전에 하드링크가 생기면 연 fd 의 fstat 로 알고 자르지 않으며 rc 1", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    const ui = path.join(dir, "src/components/ui");
    await fs.ensureDir(ui);
    const target = path.join(ui, "utils.ts");
    await fs.writeFile(target, "// 사용자 utils\n");
    const other = path.join(dir, "late-link.ts");
    const realOpen = fs.open.bind(fs) as (...a: unknown[]) => Promise<number>;
    vi.spyOn(fs, "open").mockImplementation((async (...args: unknown[]) => {
      if (args[0] === target && !(await fs.pathExists(other))) await fs.link(target, other);
      return realOpen(...args);
    }) as unknown as typeof fs.open);
    const r = await add(dir, ["button"], { overwrite: true });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("하드링크로 이어졌습니다(동시 경합)");
    expect(await fs.readFile(target, "utf8")).toBe("// 사용자 utils\n");
    expect(await fs.readFile(other, "utf8")).toBe("// 사용자 utils\n");
  });

  it("writeNoFollow(overwrite): 하드링크면 자르지 않고 HARDLINK 오류, 양성 대조로 하드링크가 아니면 덮어씀", async () => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    const a = path.join(dir, "a.ts");
    const b = path.join(dir, "b.ts");
    await fs.writeFile(a, "원본\n");
    await fs.link(a, b);
    await expect(writeNoFollow(a, "새 내용\n", "overwrite")).rejects.toMatchObject({ code: HARDLINK_ERROR_CODE });
    expect(await fs.readFile(b, "utf8")).toBe("원본\n");
    const c = path.join(dir, "c.ts");
    await fs.writeFile(c, "원본\n");
    expect(await writeNoFollow(c, "새 내용\n", "overwrite")).toBe("overwrite");
    expect(await fs.readFile(c, "utf8")).toBe("새 내용\n");
  });
});

describe("add: 덮어쓴 파일 표시(m2)", () => {
  it("--overwrite 로 덮어쓴 파일은 ~ , 새로 만든 파일은 + 로 출력", async () => {
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.writeFile(path.join(dir, "src/components/ui/utils.ts"), "// 사용자 utils\n");
    const r = await add(dir, ["button"], { overwrite: true });
    expect(r.code).toBe(0);
    expect(r.out).toContain("  ~ src/components/ui/utils.ts (덮어씀)");
    expect(r.out).toContain("  + src/components/ui/button.tsx");
    expect(r.out).not.toContain("  + src/components/ui/utils.ts");
    expect(r.written.sort()).toEqual(["src/components/ui/button.tsx", "src/components/ui/utils.ts"]);
  });

  it("대화형에서 예라고 답해 덮어쓴 파일도 ~ 로 출력", async () => {
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.writeFile(path.join(dir, "src/components/ui/utils.ts"), "// 사용자 utils\n");
    const r = await add(dir, ["button"], {}, { confirm: async () => true });
    expect(r.code).toBe(0);
    expect(r.out).toContain("  ~ src/components/ui/utils.ts (덮어씀)");
  });
});

describe("isSameOrInside (m4)", () => {
  it.each([
    ["/p", "/p", true],
    ["/p", "/p/a", true],
    ["/p", "/p/..ui", true],
    ["/p", "/p/..ui/button.tsx", true],
    ["/p", "/p/...", true],
    ["/p", "/", false],
    ["/p", "/q", false],
    ["/p", "/p2", false],
    ["/p", "/p/../q", false],
  ])("posix %s 안의 %s → %s", (parent, child, expected) => {
    expect(isSameOrInside(parent, child, path.posix)).toBe(expected);
  });

  it.each([
    ["C:\\p", "C:\\p\\..ui\\x.tsx", true],
    ["C:\\p", "C:\\q", false],
    ["C:\\p", "D:\\p\\x.tsx", false],
  ])("win32 %s 안의 %s → %s", (parent, child, expected) => {
    expect(isSameOrInside(parent, child, path.win32)).toBe(expected);
  });

  it("componentsDir 가 '..' 로 시작하는 하위 이름(./..ui)이면 프로젝트 안으로 보고 설치", async () => {
    const dir = await project({ componentsDir: "./..ui" });
    const r = await add(dir, ["button"]);
    expect(r.code).toBe(0);
    expect(r.err).toEqual([]);
    expect(await fs.pathExists(path.join(dir, "..ui/button.tsx"))).toBe(true);
  });
});

describe("add: 설치 뒤 import 검사", () => {
  it("재작성한 import 가 가리키는 파일이 쓰기 단계 사이에 없어지면 rc 1", async () => {
    const dir = await project();
    await add(dir, ["button"]);
    await fs.appendFile(path.join(dir, "src/components/ui/button.tsx"), "// 사용자 수정\n");
    // utils 는 「같은 내용」으로 판정된 뒤 확인 단계에서 사라집니다
    const confirm: ConfirmFn = async () => {
      await fs.remove(path.join(dir, "src/components/ui/utils.ts"));
      return true;
    };
    const r = await add(dir, ["button"], {}, { confirm });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("가리키는 파일이 없습니다");
  });
});

describe("add: 주석 안의 표준 형태 문자열", () => {
  it("주석 안 '@/registry/...' 는 재작성 · 미해석 판정 대상이 아님", async () => {
    const content =
      '// 예: import { x } from "@/registry/axis/lib/missing"\n/* import y from "@/registry/axis/lib/gone" */\nexport const a = 1;\n';
    const reg = await fixtureRegistry({ a: { content } });
    const dir = await project();
    const r = await add(dir, ["a"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(0);
    expect(await fs.readFile(path.join(dir, "src/components/ui/a.tsx"), "utf8")).toBe(content);
  });

  it("음성 대조: 주석 밖의 같은 import 는 여전히 거부", async () => {
    const reg = await fixtureRegistry({
      a: { content: '// 설명 "@/registry/axis/lib/ok"\nimport { x } from "@/registry/axis/lib/missing";\nexport const a = x;\n' },
    });
    const dir = await project();
    const r = await add(dir, ["a"], {}, { client: bundledClient(reg) });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("@/registry/axis/lib/missing");
    expect(r.err.join("\n")).not.toContain("@/registry/axis/lib/ok");
  });

  it("문자열 · 템플릿 글자 안의 'from \"@/registry/...\"' 는 import 가 아니라 바꾸지도 미해석으로 세지도 않음", () => {
    const targets = { exact: new Map([["@/registry/axis/lib/utils", "/p/src/components/ui/utils.ts"]]), lib: new Map() };
    const src =
      "const code = 'import { x } from \"@/registry/axis/lib/other\"';\n" +
      'const d = "x from \'@/registry/axis/lib/utils\'";\n' +
      "const tpl = `${\"`\"}`; // from \"@/registry/axis/lib/zzz\"\n" +
      "const t2 = `a ${`b from \"@/registry/axis/lib/nested\"`} c`;\n" +
      'import { cn } from "@/registry/axis/lib/utils";\n';
    const r = rewriteImports(src, "/p/src/components/ui/a.tsx", targets);
    expect(r.unresolved).toEqual([]);
    expect(r.rewritten).toHaveLength(1);
    expect(r.content).toBe(src.replace('import { cn } from "@/registry/axis/lib/utils"', 'import { cn } from "./utils"'));
  });

  it("음성 대조: 템플릿 ${} 안의 동적 import 는 코드라 판정함", () => {
    const targets = { exact: new Map<string, string>(), lib: new Map<string, string>() };
    const src = 'const m = `${await import("@/registry/axis/lib/gone")}`;\n';
    expect(rewriteImports(src, "/p/src/components/ui/a.tsx", targets).unresolved).toEqual(["@/registry/axis/lib/gone"]);
  });

  it("rewriteImports: 문자열 · 템플릿 안의 // 는 주석으로 보지 않음", () => {
    const targets = { exact: new Map([["@/registry/axis/lib/utils", "/p/src/components/ui/utils.ts"]]), lib: new Map() };
    const src = 'const u = "http://x"; const t = `//`;\nimport { cn } from "@/registry/axis/lib/utils";\n';
    const r = rewriteImports(src, "/p/src/components/ui/a.tsx", targets);
    expect(r.content).toContain('from "./utils"');
    expect(r.rewritten).toHaveLength(1);
  });
});

describe("add: 비대화 실행", () => {
  it("TTY 가 아니면 묻지 않고 다른 내용의 파일을 건너뛰며 나머지는 설치하고 요약을 출력", async () => {
    const dir = await project();
    await add(dir, ["button"]);
    const file = path.join(dir, "src/components/ui/button.tsx");
    await fs.appendFile(file, "// 사용자 수정\n");
    const modified = await fs.readFile(file, "utf8");
    process.chdir(dir);
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void logs.push(a.map(String).join(" ")));
    const program = new Command().exitOverride();
    registerAddCommand(program, { createClient: async () => bundledClient(), isInteractive: () => false });
    await program.parseAsync(["node", "axis", "add", "button", "dialog"]);
    expect(process.exitCode).toBe(0);
    expect(await fs.readFile(file, "utf8")).toBe(modified);
    expect(await fs.pathExists(path.join(dir, "src/components/ui/dialog.tsx"))).toBe(true);
    expect(logs.join("\n")).toContain("설치 항목");
    expect(logs.join("\n")).toContain("--overwrite");
  });
});

describe("add: 의존성 안내", () => {
  it("package.json 에 없는 것만 lockfile 에 맞춘 명령으로(설치는 안 함)", async () => {
    const dir = await project();
    await fs.writeJSON(path.join(dir, "package.json"), {
      dependencies: { "class-variance-authority": "^0.7.0", tailwindcss: "^4.1.0" },
    });
    await fs.writeFile(path.join(dir, "package-lock.json"), "{}");
    const r = await add(dir, ["button", "toast"]);
    expect(r.code).toBe(0);
    const text = r.out.join("\n");
    expect(text).toContain("설치는 실행하지 않았습니다");
    expect(text).toContain('npm install @radix-ui/react-slot @radix-ui/react-toast "clsx@^2.1.1" "tailwind-merge@^3.4.0"');
    expect(text).not.toContain("class-variance-authority");
  });

  it("WI-0081: 앱에 lockfile 이 없으면 워크스페이스 루트 lockfile 을 따름(npm · yarn), 워크스페이스가 아닌 상위는 pnpm(음성 대조)", async () => {
    for (const [lock, verb, workspaces] of [
      ["package-lock.json", "npm install", true],
      ["yarn.lock", "yarn add", true],
      ["package-lock.json", "pnpm add", false],
    ] as const) {
      const root = await tmpDir();
      await fs.writeJSON(path.join(root, "package.json"), workspaces ? { name: "root", private: true, workspaces: ["apps/*"] } : { name: "unrelated", private: true });
      await fs.writeFile(path.join(root, lock), "{}");
      const dir = path.join(root, "apps", "web");
      await fs.move(await project(), dir);
      await fs.writeJSON(path.join(dir, "package.json"), { dependencies: { "class-variance-authority": "^0.7.0", tailwindcss: "^4.1.0" } });
      const r = await add(dir, ["button", "toast"]);
      expect({ lock, workspaces, code: r.code, cmd: r.out.join("\n").includes(`${verb} @radix-ui/react-slot @radix-ui/react-toast "clsx@^2.1.1" "tailwind-merge@^3.4.0"`) }).toEqual({
        lock,
        workspaces,
        code: 0,
        cmd: true,
      });
    }
  });

  it("Tailwind 3(판정 불가 포함)이면 tailwind-merge ^2.6.0, lockfile 없으면 pnpm", async () => {
    const dir = await project();
    await fs.writeJSON(path.join(dir, "package.json"), { dependencies: {} });
    const r = await add(dir, ["input"]);
    expect(r.out.join("\n")).toContain('pnpm add "clsx@^2.1.1" "tailwind-merge@^2.6.0"');
  });

  it("모두 있으면 안내하지 않음", async () => {
    const dir = await project();
    await fs.writeJSON(path.join(dir, "package.json"), { dependencies: { clsx: "^2", "tailwind-merge": "^3" } });
    const r = await add(dir, ["agentic-run-progress"]);
    expect(r.out.join("\n")).not.toContain("package.json 에 없는 의존성");
  });

  it("도우미: dependencyName · addCommandForSpecs", () => {
    expect(dependencyName("@radix-ui/react-slot@^1.2.0")).toBe("@radix-ui/react-slot");
    expect(dependencyName("clsx")).toBe("clsx");
    expect(addCommandForSpecs("yarn install", { a: undefined, b: "^1" })).toBe('yarn add a "b@^1"');
  });
});

describe("add: --agentic 별칭(AC4)", () => {
  it("add run-progress --agentic 과 add agentic-run-progress 가 같은 결과", async () => {
    const d1 = await project();
    const d2 = await project();
    const d3 = await project();
    expect((await add(d1, ["run-progress"], { agentic: true })).code).toBe(0);
    expect((await add(d2, ["agentic-run-progress"])).code).toBe(0);
    expect((await add(d3, ["agentic-run-progress"], { agentic: true })).code).toBe(0);
    const s1 = await snapshot(d1);
    expect(await snapshot(d2)).toEqual(s1);
    expect(await snapshot(d3)).toEqual(s1);
    expect(Object.keys(s1)).toContain("src/components/agentic/run-progress.tsx");
  });

  it("applyAgenticAlias", () => {
    expect(applyAgenticAlias("run-progress", true)).toBe("agentic-run-progress");
    expect(applyAgenticAlias("agentic-run-progress", true)).toBe("agentic-run-progress");
    expect(applyAgenticAlias("run-progress", false)).toBe("run-progress");
  });

  it("button --agentic 은 Core UI 라고 알려 줌(--agentic 을 더 붙이라는 안내 아님)", async () => {
    const dir = await project();
    const r = await add(dir, ["button"], { agentic: true });
    expect(r.code).toBe(1);
    const text = r.err.join("\n");
    expect(text).toContain("--agentic 없이");
    expect(text).not.toContain("--agentic 을 붙이세요");
  });

  it("run-progress(플래그 없음)는 agentic- 전체 이름이나 --agentic 을 안내", async () => {
    const dir = await project();
    const r = await add(dir, ["run-progress"]);
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("agentic-run-progress");
  });
});

describe("list(AC4)", () => {
  it("레지스트리 index 의 28개(ui 10 · agentic 18), lib 은 빠짐", () => {
    const index = JSON.parse(readFileSync(path.join(REGISTRY_DIR, "index.json"), "utf8"));
    const g = groupIndex(index);
    expect(g.ui).toHaveLength(10);
    expect(g.agentic).toHaveLength(18);
    expect(g.agentic.every((e) => e.name.startsWith("agentic-"))).toBe(true);
    const all = [...g.ui, ...g.agentic].map((e) => e.name);
    expect(all).not.toContain("utils");
    expect(all).not.toContain("agentic-a11y-labels");
    // 대조: index 에는 lib 2개를 포함한 30개
    expect(index.items).toHaveLength(30);
  });

  it("명령 출력에 28개 이름이 모두 나오고 --category 로 거름", async () => {
    const lines: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => lines.push(a.map(String).join(" ")));
    const program = new Command().exitOverride();
    registerListCommand(program, { createClient: async () => bundledClient() });
    await program.parseAsync(["node", "axis", "list"]);
    const text = lines.join("\n");
    const index = JSON.parse(readFileSync(path.join(REGISTRY_DIR, "index.json"), "utf8"));
    const g = groupIndex(index);
    for (const e of [...g.ui, ...g.agentic]) expect(text).toContain(e.name);
    expect(text).toContain("컴포넌트 28개");
    expect(text).toContain("Core UI (10)");
    expect(text).toContain("Agentic UI (18)");

    lines.length = 0;
    const p2 = new Command().exitOverride();
    registerListCommand(p2, { createClient: async () => bundledClient() });
    await p2.parseAsync(["node", "axis", "list", "--category", "agentic"]);
    expect(lines.join("\n")).not.toContain("Core UI");
    expect(lines.join("\n")).toContain("agentic-run-progress");
  });
});

describe("add: 원격 레지스트리 경로", () => {
  let server: Server | undefined;
  let requests: string[] = [];
  beforeEach(() => {
    requests = [];
  });
  afterEach(async () => {
    if (server) await new Promise((r) => server!.close(() => r(undefined)));
    server = undefined;
  });

  it("원격이 정상이면 원격에서 받아 설치(요청이 기록되고 폴백 안내 없음)", async () => {
    server = createServer((req, res) => {
      requests.push(req.url ?? "");
      const name = (req.url ?? "").replace(/^\/r\//, "");
      const file = path.join(REGISTRY_DIR, name);
      if (!/^[a-z0-9-]+\.json$/.test(name) || !fs.existsSync(file)) {
        res.writeHead(404).end("<html>404</html>");
        return;
      }
      res.writeHead(200, { "content-type": "application/json" }).end(readFileSync(file));
    });
    await new Promise<void>((r) => server!.listen(0, "127.0.0.1", () => r()));
    const port = (server.address() as AddressInfo).port;
    const notes: string[] = [];
    const client = new RegistryClient({ url: `http://127.0.0.1:${port}/r`, bundledDir: REGISTRY_DIR, notify: (m) => notes.push(m) });
    const dir = await project();
    const r = await add(dir, ["button"], {}, { client });
    expect(r.code).toBe(0);
    expect(client.origin).toBe("remote");
    expect(requests.sort()).toEqual(["/r/button.json", "/r/index.json", "/r/utils.json"]);
    expect(notes).toEqual([]);
  });

  it("원격 접속 불가면 동봉본으로 설치하고 안내는 한 번", async () => {
    const closed = createServer();
    await new Promise<void>((r) => closed.listen(0, "127.0.0.1", () => r()));
    const port = (closed.address() as AddressInfo).port;
    await new Promise((r) => closed.close(() => r(undefined)));
    const notes: string[] = [];
    const client = new RegistryClient({ url: `http://127.0.0.1:${port}/r`, bundledDir: REGISTRY_DIR, notify: (m) => notes.push(m) });
    const dir = await project();
    const r = await add(dir, ["button", "agentic-run-progress"], {}, { client });
    expect(r.code).toBe(0);
    expect(client.origin).toBe("bundled");
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain("CLI 에 포함된 레지스트리");
  });

  it("앞 항목은 원격에서 받고 뒤 항목에서 원격이 실패하면 처음부터 동봉본으로 다시 받아 출처를 섞지 않음", async () => {
    const marker = "// REMOTE-CARD\n";
    const remoteCard = JSON.parse(readFileSync(path.join(REGISTRY_DIR, "card.json"), "utf8"));
    remoteCard.files[0].content = marker + remoteCard.files[0].content;
    const remoteIndex = JSON.parse(readFileSync(path.join(REGISTRY_DIR, "index.json"), "utf8"));
    for (const e of remoteIndex.items) if (e.name === "card") e.sha256 = sha256Hex(remoteCard.files[0].content);
    server = createServer((req, res) => {
      requests.push(req.url ?? "");
      const name = (req.url ?? "").replace(/^\/r\//, "");
      if (name === "index.json") return void res.writeHead(200).end(JSON.stringify(remoteIndex));
      if (name === "card.json") return void res.writeHead(200).end(JSON.stringify(remoteCard));
      if (name === "utils.json") return void res.writeHead(200).end(readFileSync(path.join(REGISTRY_DIR, name)));
      res.writeHead(404, { "content-type": "text/html" }).end("<html>404</html>");
    });
    await new Promise<void>((r) => server!.listen(0, "127.0.0.1", () => r()));
    const port = (server.address() as AddressInfo).port;
    const notes: string[] = [];
    const client = new RegistryClient({ url: `http://127.0.0.1:${port}/r`, bundledDir: REGISTRY_DIR, notify: (m) => notes.push(m) });
    const dir = await project();
    const r = await add(dir, ["card", "button"], {}, { client });
    expect(r.code).toBe(0);
    expect(client.origin).toBe("bundled");
    // 측정 대조: 원격 card 를 실제로 받았는지(받지 않았다면 이 시험은 섞임을 재현하지 못함)
    expect(requests).toContain("/r/card.json");
    expect(await fs.readFile(path.join(dir, "src/components/ui/card.tsx"), "utf8")).not.toContain("REMOTE-CARD");
    expect(await fs.readFile(path.join(dir, "src/components/ui/card.tsx"), "utf8")).toBe(
      registryContent("card").replace(/@\/registry\/axis\/lib\/utils/g, "./utils")
    );
    // 폴백 안내는 한 번(내용 비교 알림 「…의 내용이 다른 항목이」 와 구분해 셉니다)
    expect(notes.filter((n) => /CLI 에 포함된 레지스트리\(version [^)]*\)를 사용합니다/.test(n))).toHaveLength(1);
    // 원격 card 내용이 동봉본과 달라 내용 비교 알림이 card 를 짚어야 합니다(WI-0061)
    expect(notes.filter((n) => n.includes("내용이 다른 항목이 1개 있습니다(card)"))).toHaveLength(1);
  });
});

describe("add: 일반 파일이 아닌 기존 대상(FIFO · 장치)", () => {
  /** 읽기 전 판정이 빠지면 FIFO 는 readFileSync 가 끝나지 않으므로, 판정 함수를 직접 봅니다(회귀가 테스트를 멈추지 않게) */
  it("escapeReason: FIFO 는 「일반 파일이 아니라」로 거부(링크 허용 옵션과 무관)", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    const target = path.join(dir, "src/components/ui/button.tsx");
    await fs.ensureDir(path.dirname(target));
    execFileSync("mkfifo", [target]);
    for (const opts of [{}, { allowOutsideLink: true }]) {
      expect(escapeReason(dir, target, opts)).toContain("일반 파일이 아니라");
    }
  });

  it("escapeReason: 프로젝트 밖 문자 장치(/dev/zero)를 가리키는 링크도 D15 허용과 관계없이 거부", async () => {
    if (process.platform === "win32" || !(await fs.pathExists("/dev/zero"))) return;
    const dir = await project();
    const target = path.join(dir, "src/components/ui/button.tsx");
    await fs.ensureDir(path.dirname(target));
    await fs.symlink("/dev/zero", target);
    expect(escapeReason(dir, target, { allowOutsideLink: true })).toContain("링크 대상(/dev/zero)이 일반 파일이 아니라");
  });

  it("밖 문자 장치(/dev/null) 링크를 -y 로 만나면 건너뛰지 않고 rc 1, 아무것도 쓰지 않음", async () => {
    if (process.platform === "win32" || !(await fs.pathExists("/dev/null"))) return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.symlink("/dev/null", path.join(dir, "src/components/ui/button.tsx"));
    const before = await snapshot(dir);
    // 가드가 빠지면 /dev/null 을 빈 내용으로 읽어 「다른 내용 · -y 건너뜀」 rc 0 이 됩니다
    const r = await add(dir, ["button"], { yes: true });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("일반 파일이 아니라");
    expect(r.written).toEqual([]);
    expect(await snapshot(dir)).toEqual(before);
  });

  it("양성 대조: 밖의 일반 파일을 가리키는 링크는 -y 로 건너뛰고 rc 0", async () => {
    if (process.platform === "win32") return;
    const outside = await tmpDir();
    await fs.writeFile(path.join(outside, "button.tsx"), "// 사용자 button\n");
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.symlink(path.join(outside, "button.tsx"), path.join(dir, "src/components/ui/button.tsx"));
    const r = await add(dir, ["button"], { yes: true });
    expect(r.code).toBe(0);
    expect(r.skipped).toContain("src/components/ui/button.tsx");
  });
});

describe("add: 링크 거부 문구가 init 과 맞음", () => {
  it("프로젝트 안 링크를 덮어써야 하면 「프로젝트 안을 가리키는 심볼릭 링크라」", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.writeFile(path.join(dir, "real-button.tsx"), "// 사용자 파일\n");
    await fs.symlink(path.join(dir, "real-button.tsx"), path.join(dir, "src/components/ui/button.tsx"));
    const r = await add(dir, ["button"], { overwrite: true });
    expect(r.code).toBe(1);
    expect(r.err.join("\n")).toContain("src/components/ui/button.tsx 이 프로젝트 안을 가리키는 심볼릭 링크라");
  });

  it("깨진 링크는 프로젝트 기준 상대 경로로 알리고 절대 경로를 찍지 않음", async () => {
    if (process.platform === "win32") return;
    const dir = await project();
    await fs.ensureDir(path.join(dir, "src/components/ui"));
    await fs.symlink(path.join(dir, "missing.tsx"), path.join(dir, "src/components/ui/button.tsx"));
    const r = await add(dir, ["button"], { yes: true });
    expect(r.code).toBe(1);
    const err = r.err.join("\n");
    expect(err).toContain("기존 파일 src/components/ui/button.tsx 이 깨진 심볼릭 링크라");
    expect(err).not.toContain(path.join(dir, "src/components/ui/button.tsx"));
  });
});
