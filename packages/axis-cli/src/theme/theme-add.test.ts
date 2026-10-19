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
    expect(css).toBe(`\uFEFF${line}\n@tailwind base;\n`);
    expect(css.slice(1).includes("\uFEFF")).toBe(false);
  });

  it("CRLF 파일은 CRLF 를 유지", () => {
    const out = insertImportLine("@tailwind base;\r\n.a{}\r\n", line);
    expect(out).toBe(`${line}\r\n@tailwind base;\r\n.a{}\r\n`);
  });

  it("theme-only 의 globals.css 에서 첫 줄 · @tailwind base; 보다 앞", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    applyThemeAdd(planThemeAdd(dir, "sample"));
    const lines = (await fs.readFile(path.join(dir, "globals.css"), "utf8")).split("\n");
    expect(lines[0]).toBe(line);
    expect(lines[1]).toBe("@tailwind base;");
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

    const css = await fs.readFile(path.join(dir, "globals.css"), "utf8");
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
    expect((pkg.dependencies as Record<string, string>)["@axis-ds/tokens"]).toBe("^1.3.0");
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
    expect(out).toContain("업그레이드: pnpm add @axis-ds/tokens@^1.3.0");
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
    const css = await fs.readFile(path.join(dir, "globals.css"), "utf8");
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
    const cssFile = path.join(dir, "globals.css");
    const original = await fs.readFile(cssFile, "utf8");
    await fs.writeFile(cssFile, `@import "@axis-ds/tokens/css/brands/other";\n${original}`);

    const { out, exitCode } = await runAdd(["sample", "-d", dir]);
    expect(exitCode).toBe(0);
    const css = await fs.readFile(cssFile, "utf8");
    expect(findBrandImports(css)).toEqual(["other", "sample"]);
    expect(css.split("\n").slice(0, 2)).toEqual(['@import "@axis-ds/tokens/css/brands/other";', IMPORT_SAMPLE]);
    expect(out).toContain("다른 브랜드 import(other)는 그대로 두었습니다");
    expect(out).toContain("이전 브랜드 import 를 지워도 됩니다");
  });

  it("같은 브랜드가 url() · 작은따옴표 형태로 있으면 추가하지 않음", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const cssFile = path.join(dir, "globals.css");
    const original = await fs.readFile(cssFile, "utf8");
    await fs.writeFile(cssFile, `@import url('@axis-ds/tokens/css/brands/sample');\n${original}`);
    const plan = planThemeAdd(dir, "sample");
    expect(plan.css?.action).toBe("exists");
    expect(plan.writes.map((w) => w.file)).not.toContain(cssFile);
  });

  it("주석 안의 import 는 있는 것으로 보지 않음", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const cssFile = path.join(dir, "globals.css");
    const original = await fs.readFile(cssFile, "utf8");
    await fs.writeFile(cssFile, `/* ${IMPORT_SAMPLE} */\n${original}`);
    const plan = planThemeAdd(dir, "sample");
    expect(plan.css?.action).toBe("add");
  });
});

describe("T3-9: Provider 안내", () => {
  it("defaultBrand 예시 · 화면이 바뀌지 않는 조건 · theme 1.3.0 조건 · theme 설치 안내", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const { out } = await runAdd(["sample", "-d", dir]);
    expect(out).toContain('<ThemeProvider defaultBrand="sample">');
    expect(out).toContain('import { ThemeProvider } from "@axis-ds/theme";');
    expect(out).toContain('ThemeProvider 나 <html data-brand="sample"> 가 없으면 import 만으로는 화면이 바뀌지 않습니다');
    expect(out).toContain("@axis-ds/theme 1.3.0 이상");
    expect(out).toContain("@axis-ds/theme 설치: pnpm add @axis-ds/theme@^1.3.0");
  });

  it("코드는 고치지 않음(layout.tsx 불변)", async () => {
    const dir = await project({ tokens: "none", layout: "theme-only" });
    const layout = path.join(dir, "layout.tsx");
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
    expect(out).toContain(`직접 넣으세요: ${IMPORT_SAMPLE}`);
    const pkg = await readJson(path.join(dir, "package.json"));
    expect((pkg.dependencies as Record<string, string>)["@axis-ds/tokens"]).toBe("^1.3.0");
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
