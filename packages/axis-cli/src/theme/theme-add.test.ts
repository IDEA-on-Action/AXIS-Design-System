import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

// T3-5: 설치 명령을 실행하지 않는지(자식 프로세스 호출 0) 보려고 child_process 를 감쌉니다.
vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    spawn: vi.fn(actual.spawn),
    spawnSync: vi.fn(actual.spawnSync),
    exec: vi.fn(actual.exec),
    execSync: vi.fn(actual.execSync),
    execFile: vi.fn(actual.execFile),
    execFileSync: vi.fn(actual.execFileSync),
    fork: vi.fn(actual.fork),
  };
});
vi.mock("child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("child_process")>();
  return {
    ...actual,
    spawn: vi.fn(actual.spawn),
    spawnSync: vi.fn(actual.spawnSync),
    exec: vi.fn(actual.exec),
    execSync: vi.fn(actual.execSync),
    execFile: vi.fn(actual.execFile),
    execFileSync: vi.fn(actual.execFileSync),
    fork: vi.fn(actual.fork),
  };
});

import * as childProcess from "node:child_process";
import * as childProcessBare from "child_process";
import { Command } from "commander";
import { createHash } from "crypto";
import fs from "fs-extra";
import path from "path";
import { findBrandImports, findGlobalCss } from "./brand-core.js";
import { registerThemeCommand } from "./index.js";
import {
  applyThemeAdd,
  formatJsonLike,
  insertImportLine,
  planThemeAdd,
  TOKENS_DEPENDENCY_RANGE,
} from "./theme-add.js";
import { makeProject, type MakeProjectOptions } from "./test-helpers.js";

const IMPORT_SAMPLE = '@import "@axis-ds/tokens/css/brands/sample";';
/** WI-0065 D7: Tailwind 3 에서 브랜드 앞에 넣는 기본 토큰 CSS 두 줄(variables → shadcn) */
const BASE3 = ['@import "@axis-ds/tokens/css";', '@import "@axis-ds/tokens/css/shadcn";'];

const created: string[] = [];
let logs: string[];

beforeEach(() => {
  logs = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  });
  process.exitCode = undefined;
});

afterEach(async () => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function project(options: MakeProjectOptions): Promise<string> {
  const dir = await makeProject(options);
  created.push(dir);
  return dir;
}

/** 실제 명령 등록 경로로 `axis theme add ...` 을 실행합니다. */
async function runAdd(args: string[]): Promise<{ out: string; exitCode: number }> {
  logs = [];
  const program = new Command();
  program.exitOverride();
  registerThemeCommand(program);
  await program.parseAsync(["theme", "add", ...args], { from: "user" });
  const exitCode = typeof process.exitCode === "number" ? process.exitCode : 0;
  process.exitCode = undefined;
  return { out: logs.join("\n"), exitCode };
}

/** 디렉터리 아래 모든 파일(node_modules 제외)의 상대 경로 → sha256 */
async function snapshot(dir: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  async function walk(cur: string) {
    for (const name of await fs.readdir(cur)) {
      const full = path.join(cur, name);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) {
        if (name === "node_modules") continue;
        await walk(full);
      } else {
        out[path.relative(dir, full)] = createHash("sha256").update(await fs.readFile(full)).digest("hex");
      }
    }
  }
  await walk(dir);
  return out;
}

function countLines(text: string, line: string): number {
  return text.split(/\r?\n/).filter((l) => l.trim() === line).length;
}

async function readJson(file: string): Promise<Record<string, unknown>> {
  return (await fs.readJSON(file)) as Record<string, unknown>;
}

describe("planThemeAdd · applyThemeAdd 분리", () => {
  it("plan 은 파일을 쓰지 않고, apply 가 계획한 파일만 씀", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    const before = await snapshot(dir);
    const plan = planThemeAdd(dir, "sample");
    expect(plan.errors).toEqual([]);
    expect(await snapshot(dir)).toEqual(before);
    const written = applyThemeAdd(plan);
    expect(written.sort()).toEqual(plan.writes.map((w) => w.file).sort());
    const after = await snapshot(dir);
    const changed = Object.keys(after).filter((k) => after[k] !== before[k]).sort();
    expect(changed).toEqual(["axis.config.json", "package.json", path.join("src", "app", "globals.css")].sort());
  });

  it("계획 뒤 파일이 바뀌면 apply 는 아무것도 쓰지 않고 오류", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    const plan = planThemeAdd(dir, "sample");
    const pkg = path.join(dir, "package.json");
    await fs.appendFile(pkg, " ");
    const before = await snapshot(dir);
    expect(() => applyThemeAdd(plan)).toThrow(/계획 뒤에 바뀌었습니다/);
    expect(await snapshot(dir)).toEqual(before);
  });

  it("오류가 있는 계획은 apply 하지 않음", async () => {
    const dir = await project({ tokens: "1.3" });
    const plan = planThemeAdd(dir, "sample");
    expect(plan.errors[0]?.kind).toBe("no-config");
    expect(plan.writes).toEqual([]);
    expect(() => applyThemeAdd(plan)).toThrow();
  });
});

describe("T3-1: axis.config.json 이 없을 때", () => {
  it("파일 변경 0, rc 1, axis init 안내", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    await fs.remove(path.join(dir, "axis.config.json"));
    const before = await snapshot(dir);
    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(1);
    expect(out).toContain("axis.config.json 이 없습니다");
    expect(out).toContain("axis init");
    expect(await snapshot(dir)).toEqual(before);
    expect(await fs.pathExists(path.join(dir, "axis.config.json"))).toBe(false);
  });

  it("axis.config.json 이 깨졌으면 파일 변경 0, rc 1", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    await fs.writeFile(path.join(dir, "axis.config.json"), "{ broken");
    const before = await snapshot(dir);
    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(1);
    expect(out).toContain("axis.config.json 을 읽을 수 없습니다");
    expect(await snapshot(dir)).toEqual(before);
  });
});

describe("T3-2: CSS 대상 탐색 순서", () => {
  const CANDIDATES = ["styles/custom.css", "app/globals.css", "src/app/globals.css", "globals.css"];

  it("네 후보가 모두 있으면 globalCss → app → src/app → 루트 순으로 하나만 고름", async () => {
    const dir = await project({ tokens: "1.3" });
    await fs.writeJSON(path.join(dir, "axis.config.json"), { globalCss: "./styles/custom.css" }, { spaces: 2 });
    for (const c of CANDIDATES) await fs.outputFile(path.join(dir, c), "@tailwind base;\n");

    for (let i = 0; i < CANDIDATES.length; i++) {
      const plan = planThemeAdd(dir, "sample");
      expect(plan.css?.file).toBe(path.join(dir, CANDIDATES[i]));
      const cssWrites = plan.writes.filter((w) => w.file.endsWith(".css"));
      expect(cssWrites.map((w) => w.file)).toEqual([path.join(dir, CANDIDATES[i])]);
      // 앞 후보를 지우면 다음 후보로 넘어감(globalCss 가 지워지면 configuredMissing)
      await fs.remove(path.join(dir, CANDIDATES[i]));
    }
    const none = planThemeAdd(dir, "sample");
    expect(none.css?.action).toBe("manual");
    expect(none.css?.configuredMissing).toBe("./styles/custom.css");
  });

  it("globalCss 키가 없으면(projects/src-app) 두 번째 후보부터 봄", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    await fs.outputFile(path.join(dir, "globals.css"), "@tailwind base;\n");
    const loc = findGlobalCss(dir, await readJson(path.join(dir, "axis.config.json")));
    expect(loc).toEqual({ path: path.join(dir, "src/app/globals.css") });
    const plan = planThemeAdd(dir, "sample");
    expect(plan.css?.file).toBe(path.join(dir, "src/app/globals.css"));
    expect(plan.css?.configuredMissing).toBeUndefined();
  });
});

describe("T3-2b: globalCss 가 없는 파일을 가리킬 때(projects/app-init)", () => {
  it("app/globals.css 에 import 1줄, 경고, globalCss 값 불변", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const configBefore = await readJson(path.join(dir, "axis.config.json"));
    expect(await fs.pathExists(path.join(dir, "src/app/globals.css"))).toBe(false);

    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(0);
    expect(out).toContain("globalCss(./src/app/globals.css)가 없어");
    const css = await fs.readFile(path.join(dir, "app/globals.css"), "utf8");
    expect(countLines(css, IMPORT_SAMPLE)).toBe(1);
    const configAfter = await readJson(path.join(dir, "axis.config.json"));
    expect(configAfter.globalCss).toBe(configBefore.globalCss);
    expect(configAfter.brand).toBe("sample");
    expect(await fs.pathExists(path.join(dir, "src/app/globals.css"))).toBe(false);
  });
});

describe("T3-3: import 삽입 위치", () => {
  const line = IMPORT_SAMPLE;

  it("@charset · 기존 @import 다음", () => {
    const css = '@charset "utf-8";\n@import "./base.css";\n@import url("x.css");\n\n@tailwind base;\n';
    const out = insertImportLine(css, line).split("\n");
    expect(out.indexOf(line)).toBe(3);
    expect(out.indexOf(line)).toBeLessThan(out.indexOf("@tailwind base;"));
  });

  it("@charset 만 있으면 그 다음", () => {
    const out = insertImportLine('@charset "utf-8";\n.a { color: red; }\n', line).split("\n");
    expect(out.slice(0, 2)).toEqual(['@charset "utf-8";', line]);
  });

  it("없으면 첫 줄, @tailwind base; 보다 앞", () => {
    const out = insertImportLine("@tailwind base;\n@tailwind components;\n", line).split("\n");
    expect(out[0]).toBe(line);
    expect(out[1]).toBe("@tailwind base;");
  });

  it("앞쪽 주석은 건너뛰고, 규칙 뒤의 @import 는 기준으로 삼지 않음", () => {
    const css = '/* 헤더\n 주석 */\n@import "./a.css";\n:root { --x: 1; }\n@import "./late.css";\n';
    const out = insertImportLine(css, line).split("\n");
    expect(out.indexOf(line)).toBe(3);
    expect(out.indexOf(line)).toBeLessThan(out.indexOf(":root { --x: 1; }"));
  });

  it("맨 앞 UTF-8 BOM 은 맨 앞에 남고 파일 중간으로 밀려나지 않음", () => {
    const out = insertImportLine("\uFEFF@tailwind base;\n", line);
    expect(out.startsWith(`\uFEFF${line}\n`)).toBe(true);
    expect(out.split("\uFEFF").length - 1).toBe(1);
    // @charset 이 있어도 BOM 은 맨 앞 한 번
    const withCharset = insertImportLine('\uFEFF@charset "utf-8";\n.a { color: red; }\n', line);
    expect(withCharset).toBe(`\uFEFF@charset "utf-8";\n${line}\n.a { color: red; }\n`);
  });

  it("BOM 이 있는 globals.css 에 theme add: 결과도 BOM 으로 시작, 중간 BOM 0개", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const file = path.join(dir, "app", "globals.css");
    await fs.writeFile(file, "\uFEFF@tailwind base;\n");
    const { exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(0);
    const css = await fs.readFile(file, "utf8");
    expect(css).toBe(`\uFEFF${BASE3.join("\n")}\n${line}\n@tailwind base;\n`);
    expect(css.slice(1).includes("\uFEFF")).toBe(false);
  });

  it("CRLF 파일은 CRLF 를 유지", () => {
    const out = insertImportLine("@tailwind base;\r\n.a{}\r\n", line);
    expect(out).toBe(`${line}\r\n@tailwind base;\r\n.a{}\r\n`);
  });

  it("theme-only 의 app/globals.css 에서 기본 토큰 CSS 2줄 다음 · @tailwind base; 보다 앞 (WI-0037 app/ 구조)", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    applyThemeAdd(planThemeAdd(dir, "sample"));
    const lines = (await fs.readFile(path.join(dir, "app", "globals.css"), "utf8")).split("\n");
    expect(lines.slice(0, 3)).toEqual([...BASE3, line]);
    expect(lines[3]).toBe("@tailwind base;");
  });
});

describe("쓰기 대상 CSS 가 프로젝트 밖일 때", () => {
  async function setup(): Promise<{ dir: string; outside: string; outsideFile: string }> {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const outside = await fs.mkdtemp(path.join(path.dirname(dir), "axis-theme-outside-"));
    created.push(outside);
    const outsideFile = path.join(outside, "globals.css");
    await fs.writeFile(outsideFile, "@tailwind base;\n");
    return { dir, outside, outsideFile };
  }

  async function expectRejected(dir: string, outside: string) {
    const beforeProject = await snapshot(dir);
    const beforeOutside = await snapshot(outside);
    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(1);
    expect(out).toContain("프로젝트 디렉터리 밖입니다. 아무것도 바꾸지 않았습니다.");
    expect(await snapshot(dir)).toEqual(beforeProject);
    expect(await snapshot(outside)).toEqual(beforeOutside);
  }

  it("globalCss 가 ../ 로 밖을 가리키면 거절, 파일 변경 0, rc 1", async () => {
    const { dir, outside } = await setup();
    await fs.writeJSON(
      path.join(dir, "axis.config.json"),
      { globalCss: `../${path.basename(outside)}/globals.css` },
      { spaces: 2 }
    );
    expect(planThemeAdd(dir, "sample").errors[0]?.kind).toBe("css-outside-project");
    await expectRejected(dir, outside);
  });

  it("globalCss 가 밖의 절대경로면 거절", async () => {
    const { dir, outside, outsideFile } = await setup();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { globalCss: outsideFile }, { spaces: 2 });
    await expectRejected(dir, outside);
  });

  it("app/globals.css 가 밖의 파일을 가리키는 심볼릭 링크면 거절(링크 · 대상 불변)", async () => {
    const { dir, outside, outsideFile } = await setup();
    const link = path.join(dir, "app", "globals.css");
    await fs.remove(link);
    await fs.symlink(outsideFile, link);
    await expectRejected(dir, outside);
    expect((await fs.lstat(link)).isSymbolicLink()).toBe(true);
  });

  it("음성 대조군: 프로젝트 안 절대경로 · 안을 가리키는 심볼릭 링크는 그대로 씀", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const real = path.join(dir, "styles", "main.css");
    await fs.ensureDir(path.dirname(real));
    await fs.writeFile(real, "@tailwind base;\n");
    await fs.writeJSON(path.join(dir, "axis.config.json"), { globalCss: real }, { spaces: 2 });
    const plan = planThemeAdd(dir, "sample");
    expect(plan.errors).toEqual([]);
    expect(plan.css?.action).toBe("add");

    const dir2 = await project({ tokens: "1.3", layout: "app-init" });
    const target = path.join(dir2, "styles", "main.css");
    await fs.ensureDir(path.dirname(target));
    await fs.writeFile(target, "@tailwind base;\n");
    await fs.remove(path.join(dir2, "app", "globals.css"));
    await fs.symlink(target, path.join(dir2, "app", "globals.css"));
    const { exitCode } = await runAdd(["sample", "-d", dir2]);
    expect(exitCode).toBe(0);
    expect(countLines(await fs.readFile(target, "utf8"), IMPORT_SAMPLE)).toBe(1);
  });

  it("globalCss 가 프로젝트 안의 CSS 가 아닌 파일(package.json)을 가리키면 거절, 파일 변경 0, rc 1", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    await fs.writeJSON(path.join(dir, "axis.config.json"), { globalCss: "package.json" }, { spaces: 2 });
    expect(planThemeAdd(dir, "sample").errors[0]?.kind).toBe("css-not-stylesheet");
    const before = await snapshot(dir);
    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(1);
    expect(out).toContain("CSS 파일(.css)이 아닙니다. 아무것도 바꾸지 않았습니다.");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("app/globals.css 가 프로젝트 안의 CSS 가 아닌 파일을 가리키는 심볼릭 링크면 거절", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const notCss = path.join(dir, "notes.txt");
    await fs.writeFile(notCss, "@tailwind base;\n");
    const link = path.join(dir, "app", "globals.css");
    await fs.remove(link);
    await fs.symlink(notCss, link);
    expect(planThemeAdd(dir, "sample").errors[0]?.kind).toBe("css-not-stylesheet");
    expect(await fs.readFile(notCss, "utf8")).toBe("@tailwind base;\n");
  });

  it("계획 뒤 CSS 가 밖을 가리키는 심볼릭 링크로 바뀌면 apply 가 쓰기 전에 거절(밖 파일 불변)", async () => {
    const { dir, outside, outsideFile } = await setup();
    const css = path.join(dir, "app", "globals.css");
    const plan = planThemeAdd(dir, "sample");
    expect(plan.errors).toEqual([]);
    const original = await fs.readFile(css, "utf8");
    // 같은 내용의 밖 파일로 바꿔치기(내용 비교만으로는 못 잡는 경우)
    await fs.writeFile(outsideFile, original);
    await fs.remove(css);
    await fs.symlink(outsideFile, css);
    const beforeOutside = await snapshot(outside);
    expect(() => applyThemeAdd(plan)).toThrow("프로젝트 디렉터리 밖입니다");
    expect(await snapshot(outside)).toEqual(beforeOutside);
  });
});

describe("쓰기 전 권한 확인", () => {
  it("axis.config.json 이 읽기 전용이면 아무것도 쓰지 않고 rc 1, 스택 트레이스 없음", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const config = path.join(dir, "axis.config.json");
    await fs.chmod(config, 0o444);
    try {
      const before = await snapshot(dir);
      const { out, exitCode } = await runAdd(["sample", "-d", dir]);
      expect(exitCode).toBe(1);
      expect(out).toContain("쓸 수 없습니다");
      expect(out).toContain("바뀐 파일이 없습니다");
      expect(out).not.toMatch(/\bat applyThemeAdd\b/);
      expect(await snapshot(dir)).toEqual(before);
    } finally {
      await fs.chmod(config, 0o644);
    }
  });
});

describe("T3-4 (AC2(a) fixture 판): theme-only 에서 2회 실행", () => {
  it("import 1줄 · tokens 키 1개 · brand 기록, 2회차 파일 변경 0", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });

    const first = await runAdd(["sample", "-d", dir]);
    expect(first.exitCode).toBe(0);
    const afterFirst = await snapshot(dir);

    const second = await runAdd(["sample", "-d", dir]);
    expect(second.exitCode).toBe(0);
    expect(second.out).toContain("바꾼 파일이 없습니다");
    expect(planThemeAdd(dir, "sample").writes).toEqual([]);
    expect(await snapshot(dir)).toEqual(afterFirst);

    const css = await fs.readFile(path.join(dir, "app", "globals.css"), "utf8");
    expect(countLines(css, IMPORT_SAMPLE)).toBe(1);
    expect(findBrandImports(css)).toEqual(["sample"]);
    const pkgText = await fs.readFile(path.join(dir, "package.json"), "utf8");
    expect(pkgText.match(/"@axis-ds\/tokens"/g)?.length).toBe(1);
    const config = await readJson(path.join(dir, "axis.config.json"));
    expect(config.brand).toBe("sample");
  });
});

describe("T3-5: tokens 가 package.json 에 없을 때", () => {
  it(`dependencies 에 ${TOKENS_DEPENDENCY_RANGE}, 설치 안내, 설치 미실행`, async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const spies = [childProcess, childProcessBare].flatMap((m) =>
      (["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"] as const).map(
        (k) => m[k] as unknown as ReturnType<typeof vi.fn>
      )
    );
    for (const s of spies) s.mockClear();

    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(0);
    const pkg = await readJson(path.join(dir, "package.json"));
    // WI-0065 D7: 기록 범위는 ^1.6.0(종전 ^1.3.0)
    expect((pkg.dependencies as Record<string, string>)["@axis-ds/tokens"]).toBe("^1.6.0");
    expect(out).toContain("설치는 실행하지 않았습니다");
    expect(out).toContain("pnpm install");
    expect(spies.reduce((n, s) => n + s.mock.calls.length, 0)).toBe(0);
    expect(await fs.pathExists(path.join(dir, "node_modules"))).toBe(false);
  });

  it("devDependencies 에 있으면 추가하지 않음", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    const pkgFile = path.join(dir, "package.json");
    const pkg = await readJson(pkgFile);
    (pkg.devDependencies as Record<string, string>)["@axis-ds/tokens"] = "^1.3.0";
    await fs.writeJSON(pkgFile, pkg, { spaces: 2 });
    const plan = planThemeAdd(dir, "sample");
    expect(plan.dependency?.action).toBe("present");
    expect(plan.writes.map((w) => w.file)).not.toContain(pkgFile);
  });
});

describe("T3-6: tokens 1.3.0 미만이 이미 있을 때", () => {
  it("범위 불변 + 업그레이드 안내", async () => {
    const dir = await project({ tokens: "1.2", layout: "src-app" });
    const pkgFile = path.join(dir, "package.json");
    const pkg = await readJson(pkgFile);
    (pkg.dependencies as Record<string, string>)["@axis-ds/tokens"] = "^1.2.1";
    await fs.writeJSON(pkgFile, pkg, { spaces: 2 });
    const pkgBefore = await fs.readFile(pkgFile, "utf8");

    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(0);
    expect(await fs.readFile(pkgFile, "utf8")).toBe(pkgBefore);
    expect(out).toContain("1.2.1 은 브랜드를 지원하지 않습니다");
    // lockfile 이 없으면 pnpm, 범위는 기록 범위와 같은 ^1.6.0(따옴표로 감쌈, WI-0065 D7)
    expect(out).toContain('업그레이드: pnpm add "@axis-ds/tokens@^1.6.0"');
    expect(out).toContain("^1.2.1 가 이미 있어 범위를 바꾸지 않음");
  });

  it("음성 대조군: tokens 1.3.0 이면 업그레이드 안내 없음", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).not.toContain("업그레이드");
  });
});

describe("T3-7: 브랜드 이름 검증(U5)", () => {
  it("이름 규칙 위반은 거절, 파일 변경 0", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const before = await snapshot(dir);
    const { out, exitCode } = await runAdd(["Bad_Name", "-d", dir]);
    expect(exitCode).toBe(1);
    expect(out).toContain("규칙");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("설치돼 있는데 index 에 없는 이름은 거절, 설치된 목록 안내, 파일 변경 0", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    const before = await snapshot(dir);
    const { out, exitCode } = await runAdd(["nope", "-d", dir]);
    expect(exitCode).toBe(1);
    expect(out).toContain("설치된 브랜드: sample");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("미설치면 경고와 함께 진행", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const { out, exitCode } = await runAdd(["ontology", "-d", dir]);
    expect(exitCode).toBe(0);
    expect(out).toContain("이름 규칙만 확인했습니다");
    const css = await fs.readFile(path.join(dir, "app", "globals.css"), "utf8");
    expect(findBrandImports(css)).toEqual(["ontology"]);
  });

  it("음성 대조군: 설치돼 있고 index 에 있으면 경고 없음", async () => {
    const dir = await project({ tokens: "1.3", layout: "src-app" });
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).not.toContain("이름 규칙만 확인했습니다");
  });
});

describe("T3-8: 다른 브랜드 import 가 있을 때(U13)", () => {
  it("기존 줄 유지 + 새 줄 추가 + 안내", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const cssFile = path.join(dir, "app", "globals.css");
    const original = await fs.readFile(cssFile, "utf8");
    await fs.writeFile(cssFile, `@import "@axis-ds/tokens/css/brands/other";\n${original}`);

    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(0);
    const css = await fs.readFile(cssFile, "utf8");
    expect(findBrandImports(css)).toEqual(["other", "sample"]);
    // 기존 import 구간 끝에 기본 토큰 CSS 2줄 · 새 브랜드 순으로 넣음(WI-0065 D7)
    expect(css.split("\n").slice(0, 4)).toEqual(['@import "@axis-ds/tokens/css/brands/other";', ...BASE3, IMPORT_SAMPLE]);
    expect(out).toContain("다른 브랜드 import(other)는 그대로 두었습니다");
    expect(out).toContain("이전 브랜드 import 를 지워도 됩니다");
  });

  it("같은 브랜드가 url() · 작은따옴표 형태로 있으면 추가하지 않음", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const cssFile = path.join(dir, "app", "globals.css");
    const original = await fs.readFile(cssFile, "utf8");
    await fs.writeFile(cssFile, `@import url('@axis-ds/tokens/css/brands/sample');\n${original}`);
    const plan = planThemeAdd(dir, "sample");
    // 브랜드는 넣지 않고(이미 있음) 빠진 기본 토큰 CSS 만 넣음(WI-0065 D7)
    expect(plan.css?.brandAdded).toBe(false);
    expect(plan.css?.baseImports).toEqual(["@axis-ds/tokens/css", "@axis-ds/tokens/css/shadcn"]);
    const after = plan.writes.find((w) => w.file === cssFile)?.after ?? "";
    expect(findBrandImports(after)).toEqual(["sample"]);
    // 기본 토큰 CSS 도 이미 있으면 CSS 는 쓰지 않음(종전 「exists」)
    await fs.writeFile(cssFile, `${BASE3.join("\n")}\n@import url('@axis-ds/tokens/css/brands/sample');\n${original}`);
    const plan2 = planThemeAdd(dir, "sample");
    expect(plan2.css?.action).toBe("exists");
    expect(plan2.writes.map((w) => w.file)).not.toContain(cssFile);
  });

  it("주석 안의 import 는 있는 것으로 보지 않음", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const cssFile = path.join(dir, "app", "globals.css");
    const original = await fs.readFile(cssFile, "utf8");
    await fs.writeFile(cssFile, `/* ${IMPORT_SAMPLE} */\n${original}`);
    const plan = planThemeAdd(dir, "sample");
    expect(plan.css?.action).toBe("add");
  });
});

describe("T3-9: 브랜드 켜기 안내 (WI-0065 D7: defaultBrand 대신 data-brand · setBrand)", () => {
  it("data-brand · setBrand 예시 · 찾지 못한 레이아웃 · theme 1.3.0 조건 · theme 설치 안내, defaultBrand 없음", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).toContain('<html lang="ko" data-brand="sample">');
    expect(out).toContain('import { useTheme } from "@axis-ds/theme";');
    expect(out).toContain('setBrand("sample");');
    expect(out).not.toContain("defaultBrand");
    expect(out).toContain("app/layout.tsx 에서 브랜드를 켜는 코드(data-brand · setBrand 등)를 찾지 못했습니다");
    expect(out).toContain("@axis-ds/theme 1.3.0 이상");
    expect(out).toContain('@axis-ds/theme 설치: pnpm add "@axis-ds/theme@^1.3.0"');
  });

  it("레이아웃에 data-brand 가 있으면 예시 대신 찾은 파일을 알림 (음성 대조: 없을 때는 위 경고)", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const layout = path.join(dir, "app", "layout.tsx");
    await fs.writeFile(layout, (await fs.readFile(layout, "utf8")).replace('<html lang="ko"', '<html lang="ko" data-brand="sample"'));
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).toContain("app/layout.tsx 에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다");
    expect(out).not.toContain("찾지 못했습니다");
  });

  it("레이아웃이 import 하는 ./providers 의 setBrand 도 찾음(한 단계)", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const layout = path.join(dir, "app", "layout.tsx");
    await fs.writeFile(layout, `import { Providers } from "./providers";\n${await fs.readFile(layout, "utf8")}`);
    await fs.writeFile(path.join(dir, "app", "providers.tsx"), 'import { ThemeProvider, useTheme } from "@axis-ds/theme";\nconst { setBrand } = useTheme();\nsetBrand("sample");\n');
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).toContain("app/providers.tsx 에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다");
  });

  it("WI-0068: 마크업 data-brand + ThemeProvider 이면 theme 1.7.0 이상이 필요하다는 안내(axis check 가 설치본으로 판정)", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const layout = path.join(dir, "app", "layout.tsx");
    await fs.writeFile(layout, '<html lang="ko" data-brand="sample"><body><ThemeProvider>{children}</ThemeProvider></body></html>\n');
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).toContain("app/layout.tsx 에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다");
    expect(out).toContain("<html data-brand> 와 ThemeProvider 를 함께 쓰면 @axis-ds/theme 1.7.0 이상이어야 마운트 때 지워지지 않습니다");
  });

  it("ThemeProvider 만 있고 켜는 코드가 없으면 찾지 못한 것으로 보고 예시를 출력(마운트 때 브랜드가 지워지는 구성)", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const layout = path.join(dir, "app", "layout.tsx");
    await fs.writeFile(layout, `import { Providers } from "./providers";\n${await fs.readFile(layout, "utf8")}`);
    await fs.writeFile(path.join(dir, "app", "providers.tsx"), 'import { ThemeProvider } from "@axis-ds/theme";\n<ThemeProvider defaultTheme="system">{children}</ThemeProvider>\n');
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).toContain("를 찾지 못했습니다");
    expect(out).toContain('setBrand("sample");');
  });

  it("코드는 고치지 않음(layout.tsx 불변)", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const layout = path.join(dir, "app", "layout.tsx");
    const before = await fs.readFile(layout, "utf8");
    await runAdd(["sample", "-d", dir]);
    expect(await fs.readFile(layout, "utf8")).toBe(before);
  });
});

describe("T3-10: CSS 후보가 모두 없을 때(A1)", () => {
  it("수동 안내, package.json · config 는 갱신", async () => {
    const dir = await project({ tokens: "none" });
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./components/ui" }, { spaces: 2 });
    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(0);
    expect(out).toContain("CSS 진입점");
    expect(out).toContain(`이 순서로 직접 넣으세요: ${BASE3.join(" ")} ${IMPORT_SAMPLE}`);
    const pkg = await readJson(path.join(dir, "package.json"));
    expect((pkg.dependencies as Record<string, string>)["@axis-ds/tokens"]).toBe("^1.6.0");
    expect((await readJson(path.join(dir, "axis.config.json"))).brand).toBe("sample");
    const files = await snapshot(dir);
    expect(Object.keys(files).filter((f) => f.endsWith(".css"))).toEqual([]);
  });
});

describe("T3-11: 파일 형식 유지", () => {
  it("2칸 들여쓰기 · 끝 줄바꿈 · config 키 순서", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const configBefore = await readJson(path.join(dir, "axis.config.json"));
    await runAdd(["sample", "-d", dir]);
    const configText = await fs.readFile(path.join(dir, "axis.config.json"), "utf8");
    expect(configText.endsWith("}\n")).toBe(true);
    expect(configText.split("\n")[1]).toMatch(/^ {2}"\$schema"/);
    expect(Object.keys(JSON.parse(configText))).toEqual([...Object.keys(configBefore), "brand"]);
    const pkgText = await fs.readFile(path.join(dir, "package.json"), "utf8");
    expect(pkgText.endsWith("}\n")).toBe(true);
    expect(pkgText.split("\n")[1]).toMatch(/^ {2}"name"/);
    const pkgKeys = Object.keys(JSON.parse(pkgText));
    expect(pkgKeys[0]).toBe("name");
    // dependencies 의 기존 키 순서 유지 + 끝에 추가
    const deps = Object.keys((JSON.parse(pkgText) as { dependencies: object }).dependencies);
    expect(deps[deps.length - 1]).toBe("@axis-ds/tokens");
  });

  it("brand 키가 이미 있으면 그 자리에서 값만 바뀜", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const file = path.join(dir, "axis.config.json");
    const config = await readJson(file);
    await fs.writeJSON(file, { $schema: config.$schema, brand: "other", globalCss: "./globals.css" }, { spaces: 2 });
    await runAdd(["sample", "-d", dir]);
    expect(Object.entries(await readJson(file))).toEqual([
      ["$schema", config.$schema],
      ["brand", "sample"],
      ["globalCss", "./globals.css"],
    ]);
  });

  it("formatJsonLike: 4칸 · 탭 · 끝 줄바꿈 없음 · CRLF 를 그대로 따름", () => {
    expect(formatJsonLike('{\n    "a": 1\n}\n', { a: 1, b: 2 })).toBe('{\n    "a": 1,\n    "b": 2\n}\n');
    expect(formatJsonLike('{\n\t"a": 1\n}', { a: 1 })).toBe('{\n\t"a": 1\n}');
    expect(formatJsonLike('{\r\n  "a": 1\r\n}\r\n', { a: 2 })).toBe('{\r\n  "a": 2\r\n}\r\n');
  });
});

describe("WI-0065 D7: 기본 토큰 CSS 자동 삽입 · 삽입 위치 · 설치 명령", () => {
  it("Tailwind 3: 이미 있는 기본 토큰 CSS 는 다시 넣지 않고 빠진 것만(멱등, 2회차 변경 0)", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const file = path.join(dir, "app", "globals.css");
    await fs.writeFile(file, '@import "@axis-ds/tokens/css";\n@tailwind base;\n');
    applyThemeAdd(planThemeAdd(dir, "sample"));
    expect(await fs.readFile(file, "utf8")).toBe(`${BASE3.join("\n")}\n${IMPORT_SAMPLE}\n@tailwind base;\n`);
    expect(planThemeAdd(dir, "sample").writes).toEqual([]);
  });

  it("Tailwind 4: tailwindcss import 다음에 tailwind4 진입점 · 선언된 컴포넌트 패키지 tailwind.css · 브랜드 순", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const pkgFile = path.join(dir, "package.json");
    const pkg = await readJson(pkgFile);
    await fs.writeJSON(
      pkgFile,
      { ...pkg, dependencies: { "@axis-ds/ui-react": "^1.6.0" }, devDependencies: { tailwindcss: "^4.1.0" } },
      { spaces: 2 }
    );
    const file = path.join(dir, "app", "globals.css");
    await fs.writeFile(file, '@import "tailwindcss";\n\nbody { margin: 0; }\n');
    const plan = planThemeAdd(dir, "sample");
    expect(plan.css?.tailwind4).toBe(true);
    expect(plan.tailwindConfig).toBeUndefined();
    applyThemeAdd(plan);
    expect((await fs.readFile(file, "utf8")).split("\n").slice(0, 4)).toEqual([
      '@import "tailwindcss";',
      '@import "@axis-ds/tokens/css/tailwind4";',
      '@import "@axis-ds/ui-react/tailwind.css";',
      IMPORT_SAMPLE,
    ]);
  });

  // WI-0086 검토 후속(major): detectTailwind 가 워크스페이스 루트 선언도 보므로, 루트에만 tailwindcss ^4 를 선언한(미설치) 앱에서
  // theme add 가 전역 CSS 에 쓰는 기본 토큰 줄이 Tailwind 3 의 두 줄(css · shadcn)에서 Tailwind 4 진입점으로 바뀜(changeset · release-notes 에 기록).
  // 같은 분기의 컴포넌트 tailwind.css 목록은 WI-0087(DEC-2)부터 루트 선언도 보지만, 설치본에 tailwind.css 가 있을 때만 줄을 씀.
  // 이 픽스처는 루트 ui-react 가 미설치라 줄이 들어가지 않는 음성 대조로 남음(기대 불변, 설치본 쪽은 아래 「WI-0087」 describe).
  it("WI-0086: 루트에만 tailwindcss ^4.1.0(미설치) → 전역 CSS 에 tailwind4 진입점 · 브랜드, 앱 package.json 은 쓰지 않음, 음성 대조는 Tailwind 3 두 줄", async () => {
    const make = async (workspaces: boolean) => {
      const root = await project({ tokens: "1.3", layout: "empty" });
      await fs.writeJSON(path.join(root, "package.json"), {
        name: "root",
        private: true,
        ...(workspaces ? { workspaces: ["apps/*"] } : {}),
        devDependencies: { tailwindcss: "^4.1.0", "@axis-ds/ui-react": "^1.8.1" },
      });
      const app = path.join(root, "apps", "web");
      await fs.outputJSON(path.join(app, "package.json"), { name: "web", dependencies: { "@axis-ds/tokens": "^1.3.0" } });
      await fs.outputJSON(path.join(app, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./app/globals.css" });
      await fs.outputFile(path.join(app, "app", "globals.css"), '@import "tailwindcss";\n\nbody { margin: 0; }\n');
      return app;
    };
    const app = await make(true);
    const pkgBefore = await fs.readFile(path.join(app, "package.json"), "utf8");
    const plan = planThemeAdd(app, "sample");
    expect(plan.errors).toEqual([]);
    expect(plan.css?.tailwind4).toBe(true);
    expect(plan.css?.baseImports).toEqual(["@axis-ds/tokens/css/tailwind4"]);
    applyThemeAdd(plan);
    expect((await fs.readFile(path.join(app, "app", "globals.css"), "utf8")).split("\n").slice(0, 3)).toEqual([
      '@import "tailwindcss";',
      '@import "@axis-ds/tokens/css/tailwind4";',
      IMPORT_SAMPLE,
    ]);
    expect(await fs.readFile(path.join(app, "package.json"), "utf8")).toBe(pkgBefore);
    // 음성 대조: 워크스페이스가 아닌 상위의 선언은 인정하지 않음(종전과 같은 Tailwind 3 두 줄)
    const outside = planThemeAdd(await make(false), "sample");
    expect(outside.css?.tailwind4).toBe(false);
    expect(outside.css?.baseImports).toEqual(["@axis-ds/tokens/css", "@axis-ds/tokens/css/shadcn"]);
  });

  // WI-0070: 출력 문구는 실제 위치 · 분류를 따른다(종전에는 모든 줄이 「기본 토큰 CSS, 브랜드 앞」)
  it("WI-0070 재실행: 브랜드 뒤에 들어간 컴포넌트 tailwind.css 는 「컴포넌트 스캔 경로, 위치 무관」, 처음 실행은 「브랜드 앞」", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const pkgFile = path.join(dir, "package.json");
    const pkg = await readJson(pkgFile);
    await fs.writeJSON(pkgFile, { ...pkg, devDependencies: { tailwindcss: "^4.1.0" } }, { spaces: 2 });
    const file = path.join(dir, "app", "globals.css");
    await fs.writeFile(file, '@import "tailwindcss";\n\nbody { margin: 0; }\n');
    const first = await runAdd(["sample", "-d", dir]);
    expect(first.out).toContain('app/globals.css: @import "@axis-ds/tokens/css/tailwind4"; 추가(기본 토큰 CSS, 브랜드 앞)');
    // ui-react 를 선언하고 다시 실행: 컴포넌트 tailwind.css 는 import 구간 끝(브랜드 뒤)에 들어간다
    await fs.writeJSON(pkgFile, { ...(await readJson(pkgFile)), dependencies: { "@axis-ds/ui-react": "^1.6.3" } }, { spaces: 2 });
    const again = await runAdd(["sample", "-d", dir]);
    expect(again.out).toContain('app/globals.css: @import "@axis-ds/ui-react/tailwind.css"; 추가(컴포넌트 스캔 경로, 위치 무관)');
    expect(again.out).not.toContain("tailwind.css\"; 추가(기본 토큰 CSS");
    const lines = (await fs.readFile(file, "utf8")).split("\n");
    expect(lines.indexOf('@import "@axis-ds/ui-react/tailwind.css";')).toBeGreaterThan(lines.indexOf(IMPORT_SAMPLE));
  });

  it("WI-0070: 기본 토큰 CSS 가 브랜드 import 뒤에 들어가면 「브랜드 앞」 대신 옮기라는 경고(종전 문구는 거짓)", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const file = path.join(dir, "app", "globals.css");
    // 브랜드 import 만 있고 기본 토큰 CSS 가 없는 상태(수동 편집 등)
    await fs.writeFile(file, `${IMPORT_SAMPLE}\n@tailwind base;\n`);
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).toContain('app/globals.css: @import "@axis-ds/tokens/css"; 추가(기본 토큰 CSS)');
    expect(out).toContain("이 줄이 브랜드 import 뒤에 들어갔습니다");
    expect(out).not.toContain("브랜드 앞)");
  });

  it("규칙 뒤에 있는 기존 @import 는 경고하고, 새 줄은 맨 앞 import 구간에 넣음(quick-start 종전 예시 형태)", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const file = path.join(dir, "app", "globals.css");
    await fs.writeFile(file, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@import "@axis-ds/tokens/css";\n');
    const plan = planThemeAdd(dir, "sample");
    expect(plan.css?.lateImports).toEqual(['@import "@axis-ds/tokens/css";']);
    // 규칙 뒤의 tokens/css 도 「있음」으로 봄(Next.js 는 끌어올려 적용, 측정) → shadcn 과 브랜드만 맨 앞에
    expect(plan.css?.baseImports).toEqual(["@axis-ds/tokens/css/shadcn"]);
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).toContain("규칙(@tailwind 등) 뒤에 있는 @import 1줄은 CSS 규칙상 무시될 수 있습니다");
    expect((await fs.readFile(file, "utf8")).split("\n").slice(0, 3)).toEqual([BASE3[1], IMPORT_SAMPLE, "@tailwind base;"]);
  });

  it("음성 대조: import 가 맨 앞에만 있으면 위치 경고 없음", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    await fs.writeFile(path.join(dir, "app", "globals.css"), '@import "@axis-ds/tokens/css";\n@tailwind base;\n');
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).not.toContain("CSS 규칙상 무시될 수 있습니다");
  });

  it("설치 안내 명령은 lockfile 을 따름(npm · yarn), theme 설치 안내도 같음", async () => {
    for (const [lock, verb] of [
      ["package-lock.json", "npm install"],
      ["yarn.lock", "yarn add"],
    ] as const) {
      const dir = await project({ tokens: "1.2", layout: "src-app" });
      await fs.writeFile(path.join(dir, lock), "");
      const { out } = await runAdd(["sample", "-d", dir]);
      expect({ lock, upgrade: out.includes(`업그레이드: ${verb} "@axis-ds/tokens@^1.6.0"`) }).toEqual({ lock, upgrade: true });
      expect({ lock, theme: out.includes(`@axis-ds/theme 설치: ${verb} "@axis-ds/theme@^1.3.0"`) }).toEqual({ lock, theme: true });
      expect(out).not.toContain("pnpm add");
    }
  });

  it("WI-0081: 앱에 lockfile 이 없으면 워크스페이스 루트 lockfile(npm · yarn)을 따름, 워크스페이스가 아닌 상위는 pnpm 그대로(음성 대조)", async () => {
    for (const [lock, verb, workspaces] of [
      ["package-lock.json", "npm install", true],
      ["yarn.lock", "yarn add", true],
      ["package-lock.json", "pnpm add", false],
    ] as const) {
      const app0 = await project({ tokens: "1.2", layout: "src-app" });
      const root = await fs.mkdtemp(path.join(path.dirname(app0), "axis-ws-"));
      created.push(root);
      await fs.writeJSON(path.join(root, "package.json"), workspaces ? { name: "root", private: true, workspaces: ["apps/*"] } : { name: "unrelated", private: true });
      await fs.writeFile(path.join(root, lock), "");
      const dir = path.join(root, "apps", "web");
      await fs.move(app0, dir);
      const { out } = await runAdd(["sample", "-d", dir]);
      expect({ lock, workspaces, upgrade: out.includes(`업그레이드: ${verb} "@axis-ds/tokens@^1.6.0"`) }).toEqual({ lock, workspaces, upgrade: true });
      expect({ lock, workspaces, theme: out.includes(`@axis-ds/theme 설치: ${verb} "@axis-ds/theme@^1.3.0"`) }).toEqual({ lock, workspaces, theme: true });
    }
  });
});

describe("WI-0065 D7: Tailwind 3 설정 안내(파일은 고치지 않음)", () => {
  it("preset 없음 · content 가 componentsDir 를 덮지 않음 → 안내 2줄, tailwind.config 불변", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    const tw = path.join(dir, "tailwind.config.ts");
    await fs.writeFile(tw, 'export default { content: ["./app/**/*.{ts,tsx}"], plugins: [] };\n');
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./src/components/ui", globalCss: "./app/globals.css" }, { spaces: 2 });
    const before = await fs.readFile(tw, "utf8");
    const { out } = await runAdd(["sample", "-d", dir]);
    // WI-0072: CommonJS 안내는 모든 tokens 버전에서 동작하는 .default 형태(1.6.2 이하의 bare require 는 preset 이 빠짐)
    expect(out).toContain('AXIS preset 이 없습니다. presets 에 넣으세요: presets: [require("@axis-ds/tokens/tailwind").default]');
    expect(out).toContain('ESM · TypeScript 이면 import axisPreset from "@axis-ds/tokens/tailwind" 뒤 presets: [axisPreset]');
    expect(out).not.toContain('presets: [require("@axis-ds/tokens/tailwind")]');
    expect(out).toContain('content 가 componentsDir(./src/components/ui) 를 덮지 않습니다. 넣으세요: "./src/components/ui/**/*.{ts,tsx}"');
    expect(await fs.readFile(tw, "utf8")).toBe(before);
  });

  it("음성 대조: preset 이 있고 content 가 componentsDir 를 덮으면 Tailwind 설정 안내 없음", async () => {
    const dir = await project({ tokens: "1.3", layout: "app-init" });
    await fs.writeFile(
      path.join(dir, "tailwind.config.ts"),
      'import axisPreset from "@axis-ds/tokens/tailwind";\nexport default { presets: [axisPreset], content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] };\n'
    );
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./app/globals.css" }, { spaces: 2 });
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).not.toContain("Tailwind 설정 (");
  });

  // WI-0080: 세 번째 호출지(theme add 안내)도 check 와 같은 제안 · 안내를 씀. 호이스팅은 루트 설치본 기준 ../../node_modules
  it("호이스팅 모노레포: ui-react content 제안이 ../../node_modules 이고 cwd 기준 안내 1줄, 앱 node_modules 에 있으면(음성 대조) 종전 ./node_modules", async () => {
    const PARENT_NOTE =
      "상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀려요. 모노레포 루트 등 앱 디렉터리 밖에서 빌드하면 content: { relative: true, files: [...] } 로 설정 파일 기준으로 바꾸세요";
    const stub = (dir: string, name: string, version: string) =>
      fs.outputJSON(path.join(dir, "node_modules", ...name.split("/"), "package.json"), { name, version });
    const outFor = async (layout: "hoisted" | "isolated") => {
      const root = await project({ tokens: "1.3", layout: "empty" });
      await stub(root, "@axis-ds/ui-react", "1.8.1");
      const app = path.join(root, "apps", "web");
      await fs.outputJSON(path.join(app, "package.json"), {
        name: "web",
        private: true,
        dependencies: { "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "^1.8.0", tailwindcss: "^3.4.0" },
      });
      await stub(app, "tailwindcss", "3.4.19");
      if (layout === "isolated") await stub(app, "@axis-ds/ui-react", "1.8.1");
      await fs.outputJSON(path.join(app, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./app/globals.css" });
      await fs.outputFile(path.join(app, "app", "globals.css"), "@tailwind base;\n");
      await fs.outputFile(
        path.join(app, "tailwind.config.ts"),
        'import axisPreset from "@axis-ds/tokens/tailwind";\nexport default { presets: [axisPreset], content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"] };\n'
      );
      return (await runAdd(["sample", "-d", app])).out;
    };
    const hoisted = await outFor("hoisted");
    expect(hoisted).toContain('content 가 @axis-ds/ui-react 를 덮지 않습니다. 넣으세요: "../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"');
    expect(hoisted).toContain(PARENT_NOTE);
    const isolated = await outFor("isolated");
    expect(isolated).toContain('content 가 @axis-ds/ui-react 를 덮지 않습니다. 넣으세요: "./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"');
    expect(isolated).not.toContain(PARENT_NOTE);
  });
});

describe("WI-0087: theme add 가 워크스페이스 루트 선언을 인정(판정은 앱 다음 루트, 쓰기는 앱으로만)", () => {
  const ROOT_PRESENT = "package.json: @axis-ds/tokens ^1.8.0 가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음";
  const ROOT_UPGRADE = "워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.";
  const THEME_HINT = "ThemeProvider 를 쓰면 @axis-ds/theme 설치";
  const UI_LINE = '@import "@axis-ds/ui-react/tailwind.css";';

  interface WsOptions {
    /** npm: package.json workspaces · pnpm: pnpm-workspace.yaml · outside: 워크스페이스 표지 없는 상위 */
    kind?: "npm" | "pnpm" | "outside";
    /** 루트 node_modules 에 둘 tokens 설치본 */
    tokens?: "1.3" | "1.2" | "none";
    rootDeps?: Record<string, string>;
    rootDevDeps?: Record<string, string>;
    appDeps?: Record<string, string>;
    /** 앱 devDependencies 의 tailwindcss 와 전역 CSS 첫 줄 */
    tailwind?: 3 | 4;
    /** 루트 node_modules 에 둘 컴포넌트 패키지 설치본(tailwindCss: 패키지 안에 tailwind.css 파일이 있는지) */
    installed?: Record<string, { version: string; tailwindCss: boolean }>;
    /** 루트에 .pnp.cjs */
    pnp?: boolean;
    /** 앱 디렉터리 자체의 lockfile */
    appLock?: string;
  }

  /** 루트(워크스페이스 표지) 아래 apps/web 앱을 만듭니다. 돌려준 값은 앱 경로입니다. */
  async function wsApp(o: WsOptions = {}): Promise<string> {
    const root = await project({ tokens: o.tokens ?? "none", layout: "empty" });
    const kind = o.kind ?? "npm";
    await fs.writeJSON(path.join(root, "package.json"), {
      name: "root",
      private: true,
      ...(kind === "npm" ? { workspaces: ["apps/*"] } : {}),
      ...(o.rootDeps ? { dependencies: o.rootDeps } : {}),
      ...(o.rootDevDeps ? { devDependencies: o.rootDevDeps } : {}),
    });
    if (kind === "pnpm") await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "apps/*"\n');
    if (o.pnp) await fs.writeFile(path.join(root, ".pnp.cjs"), "");
    for (const [name, inst] of Object.entries(o.installed ?? {})) {
      const dir = path.join(root, "node_modules", ...name.split("/"));
      await fs.outputJSON(path.join(dir, "package.json"), { name, version: inst.version });
      if (inst.tailwindCss) await fs.outputFile(path.join(dir, "tailwind.css"), '@source "./dist";\n');
    }
    const app = path.join(root, "apps", "web");
    const tw = o.tailwind ?? 3;
    await fs.outputJSON(
      path.join(app, "package.json"),
      { name: "web", private: true, dependencies: o.appDeps ?? {}, devDependencies: { tailwindcss: tw === 4 ? "^4.1.0" : "^3.4.0" } },
      { spaces: 2 }
    );
    if (o.appLock) await fs.writeFile(path.join(app, o.appLock), "");
    await fs.outputJSON(path.join(app, "axis.config.json"), { componentsDir: "./components/ui", globalCss: "./app/globals.css" });
    await fs.outputFile(path.join(app, "app", "globals.css"), tw === 4 ? '@import "tailwindcss";\n\nbody { margin: 0; }\n' : "@tailwind base;\n");
    return app;
  }

  const appPkgFile = (app: string) => path.join(app, "package.json");
  const appPkgText = (app: string) => fs.readFile(appPkgFile(app), "utf8");

  it("npm workspaces 루트 devDependencies 에 tokens 선언 → present/root, 앱 package.json 쓰기 없음, CLI 출력은 루트 문구", async () => {
    const app = await wsApp({ kind: "npm", tokens: "1.3", rootDevDeps: { "@axis-ds/tokens": "^1.8.0" } });
    const before = await appPkgText(app);
    const plan = planThemeAdd(app, "sample");
    expect(plan.errors).toEqual([]);
    expect(plan.dependency?.action).toBe("present");
    expect(plan.dependency?.declaredRange).toBe("^1.8.0");
    expect(plan.dependency?.declaredSource).toBe("root");
    expect(plan.writes.map((w) => w.file)).not.toContain(appPkgFile(app));
    const { out, exitCode } = await runAdd(["sample", "-d", app]);
    expect(exitCode).toBe(0);
    expect(countLines(out, `- ${ROOT_PRESENT}`)).toBe(1);
    expect(out).not.toContain('dependencies 에 "@axis-ds/tokens"');
    expect(out).not.toContain("가 이미 있어 범위를 바꾸지 않음");
    // 설치본이 있으므로 설치 안내 줄 없음
    expect(out).not.toContain("설치: pnpm install");
    expect(out).toContain("파일 2개를 바꿨습니다.");
    expect(await appPkgText(app)).toBe(before);
  });

  it("pnpm-workspace.yaml 루트 dependencies 에 tokens 선언 → present/root, 앱 package.json 쓰기 없음", async () => {
    const app = await wsApp({ kind: "pnpm", tokens: "1.3", rootDeps: { "@axis-ds/tokens": "^1.8.0" } });
    const before = await appPkgText(app);
    const plan = planThemeAdd(app, "sample");
    expect(plan.dependency).toMatchObject({ action: "present", declaredRange: "^1.8.0", declaredSource: "root" });
    expect(plan.writes.map((w) => w.file)).not.toContain(appPkgFile(app));
    applyThemeAdd(plan);
    expect(await appPkgText(app)).toBe(before);
  });

  it("루트 선언 · tokens 미설치 → 루트 문구 다음에 설치 명령 줄(lockfile 로 고름), 앱 선언 미설치 출력은 종전대로(음성 대조)", async () => {
    const app = await wsApp({ kind: "npm", tokens: "none", rootDevDeps: { "@axis-ds/tokens": "^1.8.0" } });
    await fs.writeFile(path.join(path.dirname(path.dirname(app)), "package-lock.json"), "");
    const { out } = await runAdd(["sample", "-d", app]);
    const lines = out.split("\n");
    const at = lines.findIndex((l) => l.includes(ROOT_PRESENT));
    expect(at).toBeGreaterThan(-1);
    expect(lines[at + 1]).toContain("설치: npm install");
    // 음성 대조: 앱에 선언된 tokens(미설치)는 종전 present 문구 한 줄뿐(설치 줄을 붙이지 않음)
    const own = await wsApp({ kind: "npm", tokens: "none", appDeps: { "@axis-ds/tokens": "^1.8.0" } });
    const ownOut = (await runAdd(["sample", "-d", own])).out.split("\n");
    const ownAt = ownOut.findIndex((l) => l.includes("package.json: @axis-ds/tokens ^1.8.0 가 이미 있어 범위를 바꾸지 않음"));
    expect(ownAt).toBeGreaterThan(-1);
    expect(ownOut[ownAt + 1]).not.toContain("설치:");
  });

  it("루트에 @axis-ds/theme 선언 → themeMissing false · ThemeProvider 설치 안내 없음, 앱 · 루트 모두 없으면 안내 1줄(음성 대조)", async () => {
    const app = await wsApp({ kind: "npm", tokens: "1.3", rootDeps: { "@axis-ds/theme": "^1.8.0" } });
    expect(planThemeAdd(app, "sample").dependency?.themeMissing).toBe(false);
    expect((await runAdd(["sample", "-d", app])).out).not.toContain(THEME_HINT);
    const none = await wsApp({ kind: "npm", tokens: "1.3" });
    expect(planThemeAdd(none, "sample").dependency?.themeMissing).toBe(true);
    expect(countLines((await runAdd(["sample", "-d", none])).out, `${THEME_HINT}: pnpm add "@axis-ds/theme@^1.3.0"`)).toBe(1);
  });

  it("Tailwind 4 + 루트 ui-react 선언 · 설치본에 tailwind.css 있음 → 전역 CSS 에 컴포넌트 줄 추가, CLI 출력도 추가 문구", async () => {
    const app = await wsApp({
      kind: "pnpm",
      tokens: "1.3",
      tailwind: 4,
      rootDeps: { "@axis-ds/ui-react": "^1.8.1" },
      installed: { "@axis-ds/ui-react": { version: "1.8.1", tailwindCss: true } },
    });
    const plan = planThemeAdd(app, "sample");
    expect(plan.css?.baseImports).toEqual(["@axis-ds/tokens/css/tailwind4", "@axis-ds/ui-react/tailwind.css"]);
    expect(plan.css?.deferredComponentImports ?? []).toEqual([]);
    const { out } = await runAdd(["sample", "-d", app]);
    expect(out).toContain('app/globals.css: @import "@axis-ds/ui-react/tailwind.css"; 추가(컴포넌트 스캔 경로, 위치 무관)');
    expect(countLines(await fs.readFile(path.join(app, "app", "globals.css"), "utf8"), UI_LINE)).toBe(1);
  });

  it("Tailwind 4 + 루트 ui-react 설치본이 있지만 tailwind.css 가 없음(1.3.x) → 줄 없음 + 안내 1줄", async () => {
    const app = await wsApp({
      kind: "npm",
      tokens: "1.3",
      tailwind: 4,
      rootDeps: { "@axis-ds/ui-react": "^1.3.0" },
      installed: { "@axis-ds/ui-react": { version: "1.3.2", tailwindCss: false } },
    });
    const plan = planThemeAdd(app, "sample");
    expect(plan.css?.baseImports).toEqual(["@axis-ds/tokens/css/tailwind4"]);
    expect(plan.css?.deferredComponentImports).toEqual([{ name: "@axis-ds/ui-react", installedVersion: "1.3.2" }]);
    const { out } = await runAdd(["sample", "-d", app]);
    expect(
      countLines(
        out,
        '! 워크스페이스 루트에 선언된 @axis-ds/ui-react 의 설치본(1.3.2)에 tailwind.css 가 없어(1.4.0 부터 제공) @import "@axis-ds/ui-react/tailwind.css"; 를 넣지 않았습니다. 1.4.0 이상으로 올린 뒤 theme add 를 다시 실행하거나 직접 넣으세요.'
      )
    ).toBe(1);
    expect(countLines(await fs.readFile(path.join(app, "app", "globals.css"), "utf8"), UI_LINE)).toBe(0);
  });

  // 검토 후속: 1.4.0 이상인데 tailwind.css 만 없으면(손상된 설치) 「1.4.0 이상으로 올리세요」가 아니라 다시 설치를 안내해요
  it("Tailwind 4 + 루트 ui-react 설치본이 1.4.0 이상인데 tailwind.css 가 없음 → 줄 없음 + 다시 설치 안내", async () => {
    const app = await wsApp({
      kind: "npm",
      tokens: "1.3",
      tailwind: 4,
      rootDeps: { "@axis-ds/ui-react": "^1.8.1" },
      installed: { "@axis-ds/ui-react": { version: "1.8.1", tailwindCss: false } },
    });
    expect(planThemeAdd(app, "sample").css?.deferredComponentImports).toEqual([{ name: "@axis-ds/ui-react", installedVersion: "1.8.1" }]);
    const { out } = await runAdd(["sample", "-d", app]);
    expect(
      countLines(
        out,
        '! 워크스페이스 루트에 선언된 @axis-ds/ui-react 의 설치본(1.8.1)에 tailwind.css 가 없어 @import "@axis-ds/ui-react/tailwind.css"; 를 넣지 않았습니다. 설치가 손상됐을 수 있으니 다시 설치(pnpm install) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.'
      )
    ).toBe(1);
    expect(out).not.toContain("1.4.0 이상으로 올린 뒤");
  });

  // 검토 후속: 사용자가 이미 넣어 둔 줄은 「넣지 않았습니다」 안내 대상이 아니에요(다시 실행해도 같은 안내가 반복되지 않음)
  it("Tailwind 4 + 루트 ui-react 미설치라도 전역 CSS 에 그 줄이 이미 있으면 안내 없음", async () => {
    const app = await wsApp({ kind: "npm", tokens: "1.3", tailwind: 4, rootDeps: { "@axis-ds/ui-react": "^1.8.1" } });
    await fs.outputFile(path.join(app, "app", "globals.css"), `@import "tailwindcss";\n${UI_LINE}\n\nbody { margin: 0; }\n`);
    expect(planThemeAdd(app, "sample").css?.deferredComponentImports ?? []).toEqual([]);
    const { out } = await runAdd(["sample", "-d", app]);
    expect(out).not.toContain("를 넣지 않았습니다");
    expect(countLines(await fs.readFile(path.join(app, "app", "globals.css"), "utf8"), UI_LINE)).toBe(1);
  });

  it("Tailwind 4 + 루트 ui-react 선언 · 미설치 → 줄 없음 + 설치 안내 1줄, 앱 선언 · 미설치는 종전대로 줄 추가(음성 대조)", async () => {
    const app = await wsApp({ kind: "npm", tokens: "1.3", tailwind: 4, rootDeps: { "@axis-ds/ui-react": "^1.8.1" } });
    const plan = planThemeAdd(app, "sample");
    expect(plan.css?.baseImports).toEqual(["@axis-ds/tokens/css/tailwind4"]);
    expect(plan.css?.deferredComponentImports).toEqual([{ name: "@axis-ds/ui-react" }]);
    const { out } = await runAdd(["sample", "-d", app]);
    expect(
      countLines(
        out,
        '! @axis-ds/ui-react 가 워크스페이스 루트에 선언됐지만 설치되지 않아 @import "@axis-ds/ui-react/tailwind.css"; 를 넣지 않았습니다. 설치(pnpm install) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.'
      )
    ).toBe(1);
    expect(countLines(await fs.readFile(path.join(app, "app", "globals.css"), "utf8"), UI_LINE)).toBe(0);
    // 음성 대조: 앱 선언은 설치 여부와 상관없이 종전대로 씀(theme-add 711 과 같은 경계)
    const own = await wsApp({ kind: "npm", tokens: "1.3", tailwind: 4, appDeps: { "@axis-ds/ui-react": "^1.8.1" } });
    const ownPlan = planThemeAdd(own, "sample");
    expect(ownPlan.css?.baseImports).toContain("@axis-ds/ui-react/tailwind.css");
    expect(ownPlan.css?.deferredComponentImports ?? []).toEqual([]);
  });

  it("Tailwind 3 + 루트 ui-react 선언 · 설치본(tailwind.css 있음) → tailwind.css 줄 0, 안내도 없음", async () => {
    const app = await wsApp({
      kind: "npm",
      tokens: "1.3",
      tailwind: 3,
      rootDeps: { "@axis-ds/ui-react": "^1.8.1" },
      installed: { "@axis-ds/ui-react": { version: "1.8.1", tailwindCss: true } },
    });
    const plan = planThemeAdd(app, "sample");
    expect(plan.css?.tailwind4).toBe(false);
    expect(plan.css?.baseImports).toEqual(["@axis-ds/tokens/css", "@axis-ds/tokens/css/shadcn"]);
    expect(plan.css?.deferredComponentImports ?? []).toEqual([]);
    const { out } = await runAdd(["sample", "-d", app]);
    expect(out).not.toContain("tailwind.css");
    expect(countLines(await fs.readFile(path.join(app, "app", "globals.css"), "utf8"), UI_LINE)).toBe(0);
  });

  it("P1 Plug'n'Play(.pnp.cjs): 루트 선언을 인정하지 않음 → 앱에 tokens 씀 · 설치 안내 유지 · 컴포넌트 줄 없음 · theme 안내 유지(종전)", async () => {
    const app = await wsApp({
      kind: "npm",
      tokens: "1.3",
      tailwind: 4,
      pnp: true,
      rootDeps: { "@axis-ds/tokens": "^1.8.0", "@axis-ds/theme": "^1.8.0", "@axis-ds/ui-react": "^1.8.1" },
      installed: { "@axis-ds/ui-react": { version: "1.8.1", tailwindCss: true } },
    });
    const plan = planThemeAdd(app, "sample");
    expect(plan.dependency?.action).toBe("add");
    expect(plan.dependency?.declaredSource).toBeUndefined();
    expect(plan.dependency?.themeMissing).toBe(true);
    expect(plan.css?.baseImports).toEqual(["@axis-ds/tokens/css/tailwind4"]);
    expect(plan.css?.deferredComponentImports ?? []).toEqual([]);
    const { out } = await runAdd(["sample", "-d", app]);
    expect(out).toContain('package.json: dependencies 에 "@axis-ds/tokens": "^1.6.0" 추가');
    expect(out).toContain("설치는 실행하지 않았습니다. 설치: pnpm install");
    expect(out).toContain(THEME_HINT);
    expect(out).not.toContain("워크스페이스 루트에 선언");
    expect((await readJson(appPkgFile(app))).dependencies).toEqual({ "@axis-ds/tokens": "^1.6.0" });
  });

  it("P2 앱 디렉터리 자체에 lockfile → 루트 선언을 인정하지 않음(종전), lockfile 5종 모두", async () => {
    for (const lock of ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "bun.lock"]) {
      const app = await wsApp({
        kind: "npm",
        tokens: "1.3",
        tailwind: 4,
        appLock: lock,
        rootDeps: { "@axis-ds/tokens": "^1.8.0", "@axis-ds/theme": "^1.8.0", "@axis-ds/ui-react": "^1.8.1" },
        installed: { "@axis-ds/ui-react": { version: "1.8.1", tailwindCss: true } },
      });
      const plan = planThemeAdd(app, "sample");
      expect({ lock, action: plan.dependency?.action, themeMissing: plan.dependency?.themeMissing }).toEqual({
        lock,
        action: "add",
        themeMissing: true,
      });
      expect({ lock, base: plan.css?.baseImports }).toEqual({ lock, base: ["@axis-ds/tokens/css/tailwind4"] });
      expect(plan.writes.map((w) => w.file)).toContain(appPkgFile(app));
    }
  });

  it("워크스페이스가 아닌 상위의 선언 → 종전 add(앱에 ^1.6.0)", async () => {
    const app = await wsApp({ kind: "outside", tokens: "1.3", rootDeps: { "@axis-ds/tokens": "^1.8.0", "@axis-ds/theme": "^1.8.0" } });
    const plan = planThemeAdd(app, "sample");
    expect(plan.dependency?.action).toBe("add");
    expect(plan.dependency?.themeMissing).toBe(true);
    const { out } = await runAdd(["sample", "-d", app]);
    expect(out).toContain('package.json: dependencies 에 "@axis-ds/tokens": "^1.6.0" 추가');
    expect(out).not.toContain("워크스페이스 루트에 선언");
  });

  it("앱 · 루트 동시 선언 → 앱 우선(source app, 앱 범위), 종전 문구", async () => {
    const app = await wsApp({
      kind: "npm",
      tokens: "1.3",
      appDeps: { "@axis-ds/tokens": "^1.7.0" },
      rootDeps: { "@axis-ds/tokens": "^1.8.0" },
    });
    const plan = planThemeAdd(app, "sample");
    expect(plan.dependency).toMatchObject({ action: "present", declaredRange: "^1.7.0", declaredSource: "app" });
    const { out } = await runAdd(["sample", "-d", app]);
    expect(out).toContain("package.json: @axis-ds/tokens ^1.7.0 가 이미 있어 범위를 바꾸지 않음");
    expect(out).not.toContain("워크스페이스 루트에 선언");
  });

  // DEC-8 사용자 재결정: 루트 선언이면 앱 기준 업그레이드 명령(앱에서 실행하면 앱에 새 선언이 생김)을 내지 않고 루트 선언을 올리라는 줄만 내요
  it("루트 선언 · 설치본 < 1.3.0 → 업그레이드 명령 없이 루트 선언을 올리라는 줄, 앱 선언은 종전 명령(음성 대조)", async () => {
    const app = await wsApp({ kind: "npm", tokens: "1.2", rootDeps: { "@axis-ds/tokens": "^1.2.0" } });
    const plan = planThemeAdd(app, "sample");
    expect(plan.dependency).toMatchObject({ action: "present", declaredSource: "root", upgrade: true });
    const out = (await runAdd(["sample", "-d", app])).out;
    expect(countLines(out, ROOT_UPGRADE)).toBe(1);
    expect(out).not.toContain("업그레이드:");
    const own = await wsApp({ kind: "npm", tokens: "1.2", appDeps: { "@axis-ds/tokens": "^1.2.0" } });
    const ownOut = (await runAdd(["sample", "-d", own])).out;
    expect(ownOut).toContain('업그레이드: pnpm add "@axis-ds/tokens@^1.6.0"');
    expect(ownOut).not.toContain(ROOT_UPGRADE);
  });
});
