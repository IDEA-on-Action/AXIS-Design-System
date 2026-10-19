import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";

// FR-5: 설치 명령을 실행하지 않는지(자식 프로세스 호출 0) 보려고 child_process 를 감쌉니다.
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
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { registerInitCommand } from "./index.js";
import {
  addCommandFor,
  applyUtilsDependencies,
  CLSX_RANGE,
  detectTailwind,
  planUtilsDependencies,
  selectUtilsDependencies,
  TAILWIND_MERGE_RANGES,
  tailwindMajorBounds,
  tailwindMajorFromRange,
  tailwindWarnings,
} from "./init.js";

const REGISTRY = "https://axis.minu.best/r";
const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * c131ee9(수정 전) 빌드를 `pnpm pack` 해 설치한 `axis init -y` 의 실제 결과(2026-10-19 실측).
 * D1 · D2 외에는 이 값과 같아야 합니다(AC7).
 */
const BASELINE = {
  /** 출력 5줄(console.log 인자). 마지막 줄의 `npx axis-cli` 만 D2 로 바뀝니다. */
  logs: [
    "\n🎨 AXIS Design System 초기화\n",
    "✓ axis.config.json 생성 완료",
    "✓ utils.ts 생성 완료",
    "\n초기화 완료! 이제 다음 명령어로 컴포넌트를 추가하세요:",
    "  npx axis-cli add button\n",
  ],
  axisConfig:
    "{\n" +
    '  "$schema": "https://axis.minu.best/schema.json",\n' +
    '  "componentsDir": "./src/components/ui",\n' +
    '  "tailwindConfig": "./tailwind.config.ts",\n' +
    '  "globalCss": "./src/app/globals.css",\n' +
    '  "registry": "https://axis.minu.best/r"\n' +
    "}\n",
  utilsTs:
    'import { type ClassValue, clsx } from "clsx";\n' +
    'import { twMerge } from "tailwind-merge";\n' +
    "\n" +
    "export function cn(...inputs: ClassValue[]) {\n" +
    "  return twMerge(clsx(inputs));\n" +
    "}\n",
} as const;

/** D2 로 바뀐 마지막 줄 */
const NEXT_STEP = "  npx @axis-ds/cli add button\n";
const ADDED_BOTH = "✓ package.json dependencies 에 추가: clsx@^2.1.1, tailwind-merge@^2.6.0";
const NO_INSTALL = (cmd: string) => `  설치는 실행하지 않았습니다. 설치: ${cmd}`;
const ADD_CMD = 'pnpm add "clsx@^2.1.1" "tailwind-merge@^2.6.0"';
/** tailwindcss 를 찾지 못했을 때의 근거 줄(E2 기본값) */
const BASIS_NONE = "  tailwind-merge 범위 기준: tailwindcss 를 찾지 못해 기본값(Tailwind 3)";
/** 선언 범위를 판정하지 못했을 때의 경고 줄(F1 (a)) */
const UNDETERMINED = (range: string) =>
  `  ! tailwindcss 선언(${range})은 판정 불가 - 기본값 사용(Tailwind 3, tailwind-merge ^2.6.0). ` +
  "Tailwind 4 이상이면 tailwind-merge 를 ^3.4.0 으로 바꾸세요.";
/** 설치본과 선언 범위의 major 가 다를 때의 경고 줄(F1 (b)) */
const MISMATCH = (installed: string, im: number, declared: string, dm: number, cmd = "pnpm install") =>
  `  ! 설치본 tailwindcss ${installed}(major ${im})와 package.json 선언 ${declared}(major ${dm})가 다름 - ` +
  `설치본을 따랐습니다. ${cmd} 뒤 tailwind-merge 범위를 다시 확인하세요.`;
/** 출력에서 tailwind 판정 경고 줄만 고릅니다. */
const warningLines = (lines: string[]) =>
  lines.filter((l) => l.startsWith("  ! tailwindcss 선언") || l.startsWith("  ! 설치본 tailwindcss"));

// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g;

const created: string[] = [];
const cwd0 = process.cwd();
let logs: string[];

beforeEach(() => {
  logs = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(" ").replace(ANSI, ""));
  });
  process.exitCode = undefined;
});

afterEach(async () => {
  process.chdir(cwd0);
  vi.restoreAllMocks();
  vi.clearAllMocks();
  process.exitCode = undefined;
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function tmpDir(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-init-"));
  created.push(dir);
  return dir;
}

/** 실제 명령 등록 경로로 `axis init -y` 를 `dir` 에서 실행합니다. */
async function runInitCli(dir: string): Promise<{ logs: string[]; exitCode: number }> {
  logs = [];
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program, REGISTRY);
  process.chdir(dir);
  try {
    await program.parseAsync(["init", "-y"], { from: "user" });
  } finally {
    process.chdir(cwd0);
  }
  const exitCode = typeof process.exitCode === "number" ? process.exitCode : 0;
  process.exitCode = undefined;
  return { logs: [...logs], exitCode };
}

async function snapshot(dir: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  async function walk(cur: string) {
    for (const name of await fs.readdir(cur)) {
      const full = path.join(cur, name);
      const stat = await fs.lstat(full);
      if (stat.isDirectory()) await walk(full);
      else out[path.relative(dir, full)] = createHash("sha256").update(await fs.readFile(full)).digest("hex");
    }
  }
  await walk(dir);
  return out;
}

function childProcessCalls(): number {
  let n = 0;
  for (const mod of [childProcess, childProcessBare] as unknown as Record<string, { mock?: { calls: unknown[] } }>[]) {
    for (const fn of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]) {
      n += mod[fn]?.mock?.calls.length ?? 0;
    }
  }
  return n;
}

describe("axis init: 기준값 불변(AC7)", () => {
  it("package.json 이 없으면 기존 줄 · axis.config.json · utils.ts 가 c131ee9 과 같고, 의존성 안내 2줄과 D2 문구만 다름", async () => {
    const dir = await tmpDir();
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toEqual([
      BASELINE.logs[0],
      BASELINE.logs[1],
      BASELINE.logs[2],
      "! package.json 이 없어 utils.ts 의존성(clsx, tailwind-merge)을 추가하지 않았습니다.",
      `  설치: ${ADD_CMD}`,
      BASIS_NONE,
      BASELINE.logs[3],
      NEXT_STEP,
    ]);
    expect(await fs.readFile(path.join(dir, "axis.config.json"), "utf8")).toBe(BASELINE.axisConfig);
    expect(await fs.readFile(path.join(dir, "src/components/ui/utils.ts"), "utf8")).toBe(BASELINE.utilsTs);
    // 파일은 두 개만 생기고 package.json 은 만들지 않음(AC3)
    expect(Object.keys(await snapshot(dir)).sort()).toEqual(
      ["axis.config.json", path.join("src", "components", "ui", "utils.ts")].sort()
    );
  });

  it("package.json 이 있으면 의존성 줄 2개와 D2 문구 외에는 기준값과 같음", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), '{"name":"x"}\n');
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toEqual([
      BASELINE.logs[0],
      BASELINE.logs[1],
      BASELINE.logs[2],
      ADDED_BOTH,
      BASIS_NONE,
      NO_INSTALL("pnpm install"),
      BASELINE.logs[3],
      NEXT_STEP,
    ]);
    expect(await fs.readFile(path.join(dir, "axis.config.json"), "utf8")).toBe(BASELINE.axisConfig);
    expect(await fs.readFile(path.join(dir, "src/components/ui/utils.ts"), "utf8")).toBe(BASELINE.utilsTs);
  });
});

describe("axis init: package.json 의존성(D1)", () => {
  it("없을 때 dependencies 에 추가, 나머지 키 · 순서 유지(AC1)", async () => {
    const dir = await tmpDir();
    const pkg = {
      name: "app",
      version: "0.1.0",
      private: true,
      scripts: { build: "next build" },
      dependencies: { next: "15.5.28", react: "19.1.0" },
      devDependencies: { typescript: "^5" },
    };
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
    await runInitCli(dir);
    const text = await fs.readFile(path.join(dir, "package.json"), "utf8");
    expect(JSON.parse(text)).toEqual({
      ...pkg,
      dependencies: { next: "15.5.28", react: "19.1.0", clsx: "^2.1.1", "tailwind-merge": "^2.6.0" },
    });
    expect(Object.keys(JSON.parse(text))).toEqual(Object.keys(pkg));
    expect(text).toBe(
      JSON.stringify(
        { ...pkg, dependencies: { ...pkg.dependencies, clsx: "^2.1.1", "tailwind-merge": "^2.6.0" } },
        null,
        2
      ) + "\n"
    );
  });

  it("dependencies 필드가 없으면 만들어 추가", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), '{\n  "name": "x"\n}\n');
    await runInitCli(dir);
    expect(await fs.readFile(path.join(dir, "package.json"), "utf8")).toBe(
      '{\n  "name": "x",\n  "dependencies": {\n    "clsx": "^2.1.1",\n    "tailwind-merge": "^2.6.0"\n  }\n}\n'
    );
  });

  it("둘 다 dependencies 에 있으면 package.json 바이트 불변, 버전 유지 안내(AC2)", async () => {
    const dir = await tmpDir();
    const original = '{\n  "name": "x",\n  "dependencies": { "clsx": "^2.0.0", "tailwind-merge": "^2.5.0" }\n}\n';
    await fs.writeFile(path.join(dir, "package.json"), original);
    const r = await runInitCli(dir);
    expect(await fs.readFile(path.join(dir, "package.json"), "utf8")).toBe(original);
    expect(r.logs).toContain(
      "✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): clsx (^2.0.0), tailwind-merge (^2.5.0)"
    );
    expect(r.logs).toContain(NO_INSTALL("pnpm install"));
    expect(planUtilsDependencies(dir).write).toBeUndefined();
  });

  it("devDependencies 에 있으면 그 버전 유지, dependencies 에 중복 추가 안 함(AC2)", async () => {
    const dir = await tmpDir();
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "x", devDependencies: { clsx: "~2.0.1", "tailwind-merge": "2.6.0" } }, null, 2) + "\n"
    );
    const before = await fs.readFile(path.join(dir, "package.json"), "utf8");
    await runInitCli(dir);
    expect(await fs.readFile(path.join(dir, "package.json"), "utf8")).toBe(before);
  });

  it("하나만 있으면(devDependencies) 없는 것만 dependencies 에 추가", async () => {
    const dir = await tmpDir();
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "x", dependencies: { react: "19" }, devDependencies: { clsx: "~2.0.1" } }, null, 2) + "\n"
    );
    const r = await runInitCli(dir);
    const pkg = await fs.readJSON(path.join(dir, "package.json"));
    expect(pkg.dependencies).toEqual({ react: "19", "tailwind-merge": "^2.6.0" });
    expect(pkg.devDependencies).toEqual({ clsx: "~2.0.1" });
    expect(r.logs).toContain("✓ package.json dependencies 에 추가: tailwind-merge@^2.6.0");
    expect(r.logs).toContain("  이미 있음(버전 유지): clsx (~2.0.1)");
  });

  it("범위 상수: clsx ^2.1.1, tailwind-merge 는 Tailwind 4 ^3.4.0 · Tailwind 3 ^2.6.0 (prd 1.5 · 1.6)", () => {
    expect(CLSX_RANGE).toBe("^2.1.1");
    expect(TAILWIND_MERGE_RANGES).toEqual({ tailwind4: "^3.4.0", tailwind3: "^2.6.0" });
  });

  it("clsx 범위는 템플릿 4종과 같음 (prd 1.5)", async () => {
    const templatesDir = path.resolve(HERE, "../../../../apps/web/templates");
    const names = (await fs.readdir(templatesDir)).filter((n) =>
      fs.existsSync(path.join(templatesDir, n, "files", "package.json"))
    );
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      const pkg = await fs.readJSON(path.join(templatesDir, n, "files", "package.json"));
      expect({ template: n, clsx: pkg.dependencies.clsx }).toEqual({ template: n, clsx: CLSX_RANGE });
    }
  });

  it("tailwind-merge: 템플릿 4종은 1.6 규칙과 어긋남을 알려진 불일치로 고정 (prd 1.6 참고)", async () => {
    // 템플릿은 tailwindcss ^3.4.0(Tailwind 3)인데 tailwind-merge ^3.4.0 을 씁니다. 규칙값은 ^2.6.0 입니다.
    // 템플릿을 고치거나 더 어긋나면 이 기대값이 깨져 신호가 납니다. 템플릿 불일치는 WI-0037(#119)에서 다룹니다.
    const templatesDir = path.resolve(HERE, "../../../../apps/web/templates");
    const names = (await fs.readdir(templatesDir)).filter((n) =>
      fs.existsSync(path.join(templatesDir, n, "files", "package.json"))
    );
    expect(names.length).toBe(4);
    for (const n of names) {
      const filesDir = path.join(templatesDir, n, "files");
      const pkg = await fs.readJSON(path.join(filesDir, "package.json"));
      const tailwind = detectTailwind(filesDir, pkg);
      expect({
        template: n,
        tailwind,
        current: pkg.dependencies["tailwind-merge"],
        rule: selectUtilsDependencies(tailwind)["tailwind-merge"],
      }).toEqual({
        template: n,
        tailwind: { major: 3, source: "declared", value: "^3.4.0" },
        current: "^3.4.0",
        rule: "^2.6.0",
      });
    }
  });
});

describe("axis init: Tailwind 버전별 tailwind-merge 범위(E2, prd 1.6)", () => {
  /** `dir/node_modules/tailwindcss/package.json` 에 설치본 version 을 씁니다. */
  async function installTailwind(dir: string, version: string) {
    await fs.outputFile(
      path.join(dir, "node_modules", "tailwindcss", "package.json"),
      JSON.stringify({ name: "tailwindcss", version }) + "\n"
    );
  }

  async function addedTwMerge(pkg: Record<string, unknown>, installed?: string) {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
    if (installed) await installTailwind(dir, installed);
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    const after = await fs.readJSON(path.join(dir, "package.json"));
    return { range: after.dependencies["tailwind-merge"] as string, logs: r.logs };
  }

  it("설치본 4.x: ^3.4.0 (선언이 3 이어도 설치본 우선)", async () => {
    const r = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: "^3.4.0" } }, "4.3.3");
    expect(r.range).toBe("^3.4.0");
    expect(r.logs).toContain("✓ package.json dependencies 에 추가: clsx@^2.1.1, tailwind-merge@^3.4.0");
    expect(r.logs).toContain("  tailwind-merge 범위 기준: 설치된 tailwindcss 4.3.3");
    expect(r.logs).toContain(MISMATCH("4.3.3", 4, "^3.4.0", 3));
  });

  it("설치본 3.x: ^2.6.0 (선언이 4 여도 설치본 우선, 불일치 경고)", async () => {
    const r = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: "^4" } }, "3.4.17");
    expect(r.range).toBe("^2.6.0");
    expect(r.logs).toContain("  tailwind-merge 범위 기준: 설치된 tailwindcss 3.4.17");
    expect(r.logs).toContain(MISMATCH("3.4.17", 3, "^4", 4));
  });

  it("설치본과 선언의 major 가 같으면 경고 없음, 선언을 읽지 못하면 비교하지 않음 (F1 (b))", async () => {
    const same = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: "^4" } }, "4.3.3");
    expect(same.range).toBe("^3.4.0");
    expect(warningLines(same.logs)).toEqual([]);
    const unreadable = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: "catalog:" } }, "4.3.3");
    expect(unreadable.range).toBe("^3.4.0");
    expect(unreadable.logs).toContain("  tailwind-merge 범위 기준: 설치된 tailwindcss 4.3.3");
    expect(warningLines(unreadable.logs)).toEqual([]);
  });

  it("설치본이 선언 범위를 만족하면 하한 major 와 달라도 경고 없음, 범위 밖이면 경고 (F1 (b) 보정)", async () => {
    // 4.1.0 은 세 범위를 모두 만족합니다(semver 7.7.3 satisfies 로 확인).
    for (const declared of [">=3.4", ">=3 <5", "3.4 - 4", ">3"]) {
      const r = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: declared } }, "4.1.0");
      expect({ declared, range: r.range, warnings: warningLines(r.logs) }).toEqual({
        declared,
        range: "^3.4.0",
        warnings: [],
      });
    }
    const outside = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: ">=3.4 <4" } }, "4.1.0");
    expect(outside.range).toBe("^3.4.0");
    expect(warningLines(outside.logs)).toEqual([MISMATCH("4.1.0", 4, ">=3.4 <4", 3)]);
    const below = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: ">=4" } }, "3.4.17");
    expect(below.range).toBe("^2.6.0");
    expect(warningLines(below.logs)).toEqual([MISMATCH("3.4.17", 3, ">=4", 4)]);
  });

  it("설치본 version 이 0.0.0-insiders.* 이면 설치본으로 판정하지 않고 선언 범위로 (F1 (a))", async () => {
    const r = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: ">=4" } }, "0.0.0-insiders.4a4e1ec");
    expect(r.range).toBe("^3.4.0");
    expect(r.logs).toContain("  tailwind-merge 범위 기준: package.json 의 tailwindcss >=4");
    expect(warningLines(r.logs)).toEqual([]);
  });

  it("설치본 version 이 정확한 버전이 아니면 선언 범위로", async () => {
    const r = await addedTwMerge({ name: "x", devDependencies: { tailwindcss: "^4" } }, "not-a-version");
    expect(r.range).toBe("^3.4.0");
    expect(r.logs).toContain("  tailwind-merge 범위 기준: package.json 의 tailwindcss ^4");
  });

  /** 판정한 선언: 근거 줄은 `package.json 의 tailwindcss <범위>`, 경고 없음 */
  const readable = (range: string, expected: string, field: "dependencies" | "devDependencies" = "devDependencies") => ({
    range,
    field,
    expected,
    basis: `package.json 의 tailwindcss ${range}`,
    warnings: [] as string[],
  });
  /** 판정하지 못한 선언: 기본값 ^2.6.0, 근거 줄과 '판정 불가 - 기본값 사용' 경고 */
  const unreadable = (range: string) => ({
    range,
    field: "devDependencies" as const,
    expected: "^2.6.0",
    basis: `package.json 의 tailwindcss ${range} 로 버전을 판정하지 못해 기본값(Tailwind 3)`,
    warnings: [UNDETERMINED(range)],
  });
  const declared = [
    readable("^4", "^3.4.0"),
    readable("~3.4", "^2.6.0"),
    readable("^4.1.0", "^3.4.0", "dependencies"),
    // F1 (a): 하한의 major
    readable(">=4", "^3.4.0"),
    readable(">=4.0.0", "^3.4.0"),
    readable(">=3.4 <4", "^2.6.0"),
    readable("4 - 4.2", "^3.4.0"),
    // F1 (c): 4 이상
    readable("^5", "^3.4.0"),
    readable(">=5.0.0", "^3.4.0"),
    unreadable("workspace:*"),
    unreadable("latest"),
    unreadable("^3 || ^4"),
    unreadable("catalog:"),
    unreadable("0.0.0-insiders.4a4e1ec"),
  ];
  for (const c of declared) {
    it(`선언만 ${c.field}.tailwindcss = ${c.range}: ${c.expected}`, async () => {
      const r = await addedTwMerge({ name: "x", [c.field]: { tailwindcss: c.range } });
      expect(r.range).toBe(c.expected);
      expect(r.logs).toContain(`  tailwind-merge 범위 기준: ${c.basis}`);
      expect(warningLines(r.logs)).toEqual(c.warnings);
    });
  }

  it("tailwindcss 가 없으면 기본값 ^2.6.0 (근거 줄만, 경고 없음)", async () => {
    const r = await addedTwMerge({ name: "x", dependencies: { next: "15.5.28" } });
    expect(r.range).toBe("^2.6.0");
    expect(r.logs).toContain(BASIS_NONE);
    expect(warningLines(r.logs)).toEqual([]);
  });

  it("package.json 을 쓸 수 없을 때도 판정 불가 경고를 냄", async () => {
    const dir = await tmpDir();
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "x", dependencies: [], devDependencies: { tailwindcss: "catalog:" } })
    );
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain('  utils.ts 의존성 설치: pnpm add "clsx@^2.1.1" "tailwind-merge@^2.6.0"');
    expect(warningLines(r.logs)).toEqual([UNDETERMINED("catalog:")]);
  });

  it("package.json 이 없을 때 안내 명령도 같은 규칙(설치본 4 → ^3.4.0, 없음 → ^2.6.0)", async () => {
    const withTw4 = await tmpDir();
    await installTailwind(withTw4, "4.3.3");
    const r4 = await runInitCli(withTw4);
    expect(r4.logs).toContain('  설치: pnpm add "clsx@^2.1.1" "tailwind-merge@^3.4.0"');
    expect(r4.logs).toContain("  tailwind-merge 범위 기준: 설치된 tailwindcss 4.3.3");
    expect(await fs.pathExists(path.join(withTw4, "package.json"))).toBe(false);

    const none = await tmpDir();
    const r0 = await runInitCli(none);
    expect(r0.logs).toContain(`  설치: ${ADD_CMD}`);
    expect(r0.logs).toContain(BASIS_NONE);
  });

  it("package.json 을 읽을 수 없으면 설치본으로 판정해 안내, rc 0", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), "{ nope");
    await installTailwind(dir, "4.0.0");
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain('  utils.ts 의존성 설치: pnpm add "clsx@^2.1.1" "tailwind-merge@^3.4.0"');
  });

  it("tailwind-merge 가 이미 있으면 범위를 바꾸지 않고 근거 줄도 내지 않음", async () => {
    const dir = await tmpDir();
    const pkgFile = path.join(dir, "package.json");
    await fs.writeFile(
      pkgFile,
      JSON.stringify({ name: "x", dependencies: { "tailwind-merge": "^2.5.0" }, devDependencies: { tailwindcss: "^4" } })
    );
    const r = await runInitCli(dir);
    const pkg = await fs.readJSON(pkgFile);
    expect(pkg.dependencies).toEqual({ "tailwind-merge": "^2.5.0", clsx: "^2.1.1" });
    expect(r.logs.some((l) => l.includes("tailwind-merge 범위 기준"))).toBe(false);
  });

  it("tailwindMajorFromRange: 단순 범위의 major, 아니면 하한의 major (F1 (a))", () => {
    const cases: [string, number | undefined][] = [
      ["4", 4],
      ["^4", 4],
      ["^4.1.0", 4],
      ["~3.4", 3],
      ["=3.4.17", 3],
      ["3.4.x", 3],
      ["v4", 4],
      [" ^4 ", 4],
      ["4.0.0-beta.1", 4],
      // F1 (a): 단순 형태가 아니면 하한의 major
      [">=3", 3],
      [">=4", 4],
      [">=4.0.0", 4],
      [">= 4", 4],
      // `>M` · `>M.x` 는 `>=(M+1).0.0` 이라 하한 M+1, minor 를 쓴 `>M.m` 은 M (semver 7.7.3 validRange 와 같음)
      [">4", 5],
      [">3", 4],
      [">3.x", 4],
      [">3.*", 4],
      [">3.x.x", 4],
      [">3.0", 3],
      [">3.4.x", 3],
      [">3.9.9", 3],
      [">= 3", 3],
      [">=3.4 <4", 3],
      ["<5 >=4.1", 4],
      [">=3 >=4.1.0", 4],
      ["4 - 4.2", 4],
      ["3.4 - 4", 3],
      [">=5", 5],
      // 하한이 없거나 하나로 정해지지 않거나 버전이 아님
      ["<4", undefined],
      ["<=4.2", undefined],
      ["^3 || ^4", undefined],
      [">=3 || >=4", undefined],
      ["*", undefined],
      ["x", undefined],
      ["latest", undefined],
      ["workspace:*", undefined],
      ["workspace:^4", undefined],
      ["catalog:", undefined],
      ["catalog:tw4", undefined],
      ["0.0.0-insiders.4a4e1ec", undefined],
      ["^0.0.0-insiders.4a4e1ec", undefined],
      [">=0.0.0-insiders.4a4e1ec", undefined],
      ["insiders", undefined],
      ["npm:tailwindcss@^4", undefined],
      ["github:tailwindlabs/tailwindcss", undefined],
      ["file:../tailwindcss", undefined],
      [">=4 foo", undefined],
      [">=4 <4", undefined],
      ["4 - 3", undefined],
      ["", undefined],
    ];
    for (const [range, major] of cases) {
      expect({ range, major: tailwindMajorFromRange(range) }).toEqual({ range, major });
    }
  });

  it("tailwindMajorBounds: 선언 범위가 허용하는 major 구간 (F1 (b) 보정)", () => {
    const cases: [string, ReturnType<typeof tailwindMajorBounds>][] = [
      ["^4", { lower: 4, upper: 4 }],
      ["~3.4", { lower: 3, upper: 3 }],
      ["4.x", { lower: 4, upper: 4 }],
      [">=3.4", { lower: 3 }],
      [">3", { lower: 4 }],
      [">=3 <5", { lower: 3, upper: 4 }],
      [">=3.4 <4", { lower: 3, upper: 3 }],
      [">=3.4 <4.0.0", { lower: 3, upper: 3 }],
      [">=3.4 <4.x", { lower: 3, upper: 3 }],
      [">=3.4 <4.1", { lower: 3, upper: 4 }],
      [">=3.4 <4.0.1", { lower: 3, upper: 4 }],
      [">=3 <=4", { lower: 3, upper: 4 }],
      [">=3 <=4.0.0", { lower: 3, upper: 4 }],
      ["3.4 - 4", { lower: 3, upper: 4 }],
      ["4 - 4.2", { lower: 4, upper: 4 }],
      ["<5 >=4.1", { lower: 4, upper: 4 }],
      ["<4", undefined],
      ["catalog:", undefined],
    ];
    for (const [range, bounds] of cases) {
      expect({ range, bounds: tailwindMajorBounds(range) }).toEqual({ range, bounds });
    }
  });

  it("detectTailwind · selectUtilsDependencies: 판정 결과와 범위", async () => {
    const dir = await tmpDir();
    expect(detectTailwind(dir)).toEqual({ source: "none" });
    expect(detectTailwind(dir, { devDependencies: { tailwindcss: "^4" } })).toEqual({
      major: 4,
      source: "declared",
      value: "^4",
    });
    expect(detectTailwind(dir, { devDependencies: { tailwindcss: "catalog:" } })).toEqual({
      source: "none",
      value: "catalog:",
    });
    await installTailwind(dir, "3.4.17");
    expect(detectTailwind(dir, { devDependencies: { tailwindcss: "^4" } })).toEqual({
      major: 3,
      source: "installed",
      value: "3.4.17",
      mismatch: { declared: "^4", declaredMajor: 4 },
    });
    expect(detectTailwind(dir, { devDependencies: { tailwindcss: ">=3.4 <4" } })).toEqual({
      major: 3,
      source: "installed",
      value: "3.4.17",
    });
    // 설치본 4.1.0 이 선언 범위를 만족하면 하한 major(3)와 달라도 mismatch 가 아닙니다.
    const dir4 = await tmpDir();
    await installTailwind(dir4, "4.1.0");
    for (const declared of [">=3.4", ">=3 <5", "3.4 - 4"]) {
      expect(detectTailwind(dir4, { devDependencies: { tailwindcss: declared } })).toEqual({
        major: 4,
        source: "installed",
        value: "4.1.0",
      });
    }
    expect(detectTailwind(dir4, { devDependencies: { tailwindcss: ">=3.4 <4" } })).toEqual({
      major: 4,
      source: "installed",
      value: "4.1.0",
      mismatch: { declared: ">=3.4 <4", declaredMajor: 3 },
    });
    // `>3` 은 Tailwind 4 이상만 허용하는 선언이라 설치본이 없어도 ^3.4.0
    const empty = await tmpDir();
    expect(selectUtilsDependencies(detectTailwind(empty, { devDependencies: { tailwindcss: ">3" } }))).toEqual({
      clsx: "^2.1.1",
      "tailwind-merge": "^3.4.0",
    });
    expect(selectUtilsDependencies({ major: 4, source: "declared" })).toEqual({
      clsx: "^2.1.1",
      "tailwind-merge": "^3.4.0",
    });
    // F1 (c): 4 이상은 ^3.4.0, 3 이하와 판정 불가는 ^2.6.0
    for (const major of [5, 6]) {
      expect({ major, r: selectUtilsDependencies({ major, source: "declared" })["tailwind-merge"] }).toEqual({
        major,
        r: "^3.4.0",
      });
    }
    for (const t of [
      { major: 3, source: "installed" as const },
      { major: 2, source: "declared" as const },
      { major: 0, source: "declared" as const },
      { source: "none" as const },
    ]) {
      expect(selectUtilsDependencies(t)["tailwind-merge"]).toBe("^2.6.0");
    }
    expect(tailwindWarnings({ major: 4, source: "declared", value: "^4" }, "pnpm install")).toEqual([]);
    expect(tailwindWarnings({ source: "none" }, "pnpm install")).toEqual([]);
    expect(
      tailwindWarnings(
        { major: 4, source: "installed", value: "4.3.3", mismatch: { declared: "^3.4.0", declaredMajor: 3 } },
        "yarn install"
      )
    ).toEqual([MISMATCH("4.3.3", 4, "^3.4.0", 3, "yarn install").trim()]);
  });
});

describe("axis init: 포맷 보존 · 멱등(AC4)", () => {
  const cases: { name: string; text: string; expected: string }[] = [
    {
      name: "탭 들여쓰기",
      text: '{\n\t"name": "x"\n}\n',
      expected: '{\n\t"name": "x",\n\t"dependencies": {\n\t\t"clsx": "^2.1.1",\n\t\t"tailwind-merge": "^2.6.0"\n\t}\n}\n',
    },
    {
      name: "4칸 들여쓰기",
      text: '{\n    "name": "x"\n}\n',
      expected:
        '{\n    "name": "x",\n    "dependencies": {\n        "clsx": "^2.1.1",\n        "tailwind-merge": "^2.6.0"\n    }\n}\n',
    },
    {
      name: "CRLF",
      text: '{\r\n  "name": "x"\r\n}\r\n',
      expected: '{\r\n  "name": "x",\r\n  "dependencies": {\r\n    "clsx": "^2.1.1",\r\n    "tailwind-merge": "^2.6.0"\r\n  }\r\n}\r\n',
    },
    {
      name: "BOM",
      text: '﻿{\n  "name": "x"\n}\n',
      expected: '﻿{\n  "name": "x",\n  "dependencies": {\n    "clsx": "^2.1.1",\n    "tailwind-merge": "^2.6.0"\n  }\n}\n',
    },
    {
      name: "BOM + CRLF",
      text: '﻿{\r\n  "name": "x"\r\n}\r\n',
      expected:
        '﻿{\r\n  "name": "x",\r\n  "dependencies": {\r\n    "clsx": "^2.1.1",\r\n    "tailwind-merge": "^2.6.0"\r\n  }\r\n}\r\n',
    },
    {
      name: "끝 줄바꿈 없음",
      text: '{\n  "name": "x"\n}',
      expected: '{\n  "name": "x",\n  "dependencies": {\n    "clsx": "^2.1.1",\n    "tailwind-merge": "^2.6.0"\n  }\n}',
    },
  ];

  for (const c of cases) {
    it(`${c.name}: 형식 유지, 두 번째 실행은 아무것도 바꾸지 않음`, async () => {
      const dir = await tmpDir();
      const pkgFile = path.join(dir, "package.json");
      await fs.writeFile(pkgFile, c.text);
      const first = await runInitCli(dir);
      expect(first.exitCode).toBe(0);
      expect(await fs.readFile(pkgFile, "utf8")).toBe(c.expected);
      const afterFirst = await snapshot(dir);
      const second = await runInitCli(dir);
      expect(second.exitCode).toBe(0);
      expect(await snapshot(dir)).toEqual(afterFirst);
      expect(second.logs).toContain(
        "✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): clsx (^2.1.1), tailwind-merge (^2.6.0)"
      );
    });
  }

  it("package.json 이 없을 때 두 번 실행해도 결과가 같음", async () => {
    const dir = await tmpDir();
    await runInitCli(dir);
    const first = await snapshot(dir);
    await runInitCli(dir);
    expect(await snapshot(dir)).toEqual(first);
  });
});

describe("axis init: lockfile 별 안내(AC5)", () => {
  const cases = [
    { lock: "pnpm-lock.yaml", install: "pnpm install", add: ADD_CMD },
    { lock: "yarn.lock", install: "yarn install", add: 'yarn add "clsx@^2.1.1" "tailwind-merge@^2.6.0"' },
    { lock: "package-lock.json", install: "npm install", add: 'npm install "clsx@^2.1.1" "tailwind-merge@^2.6.0"' },
    { lock: null, install: "pnpm install", add: ADD_CMD },
  ];
  for (const c of cases) {
    it(`${c.lock ?? "lockfile 없음"}: 추가 뒤 ${c.install}`, async () => {
      const dir = await tmpDir();
      await fs.writeFile(path.join(dir, "package.json"), '{"name":"x"}\n');
      if (c.lock) await fs.writeFile(path.join(dir, c.lock), "");
      const r = await runInitCli(dir);
      expect(r.logs).toContain(NO_INSTALL(c.install));
    });

    it(`${c.lock ?? "lockfile 없음"}: package.json 없을 때 ${c.add}`, async () => {
      const dir = await tmpDir();
      if (c.lock) await fs.writeFile(path.join(dir, c.lock), "");
      const r = await runInitCli(dir);
      expect(r.logs).toContain(`  설치: ${c.add}`);
      expect(await fs.pathExists(path.join(dir, "package.json"))).toBe(false);
    });
  }

  it("addCommandFor 는 빠진 의존성만 넣음", () => {
    expect(addCommandFor("yarn install", { "tailwind-merge": "^3.4.0" })).toBe('yarn add "tailwind-merge@^3.4.0"');
  });
});

describe("axis init: 쓸 수 없는 package.json(FR-3 · FR-4)", () => {
  const bad: { name: string; text: string; reason: RegExp }[] = [
    { name: "JSON 이 아님", text: "{ name: x }\n", reason: /JSON 을 읽을 수 없습니다/ },
    { name: "최상위 배열", text: "[]\n", reason: /최상위가 객체가 아닙니다/ },
    { name: "dependencies 가 배열", text: '{"name":"x","dependencies":[]}\n', reason: /dependencies 가 객체가 아닙니다/ },
  ];
  for (const c of bad) {
    it(`${c.name}: package.json 불변, 경고 + 추가 명령, rc 0`, async () => {
      const dir = await tmpDir();
      await fs.writeFile(path.join(dir, "package.json"), c.text);
      const r = await runInitCli(dir);
      expect(r.exitCode).toBe(0);
      expect(await fs.readFile(path.join(dir, "package.json"), "utf8")).toBe(c.text);
      expect(r.logs.some((l) => l.startsWith("! package.json 을 바꾸지 않았습니다(") && c.reason.test(l))).toBe(true);
      expect(r.logs).toContain(`  utils.ts 의존성 설치: ${ADD_CMD}`);
      expect(r.logs.at(-1)).toBe(NEXT_STEP);
    });
  }

  it("package.json 이 프로젝트 밖을 가리키는 심볼릭 링크면 건드리지 않음", async () => {
    const dir = await tmpDir();
    const outside = await tmpDir();
    const target = path.join(outside, "package.json");
    await fs.writeFile(target, '{"name":"outside"}\n');
    await fs.symlink(target, path.join(dir, "package.json"));
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(await fs.readFile(target, "utf8")).toBe('{"name":"outside"}\n');
    expect(r.logs.some((l) => /프로젝트 디렉터리 밖/.test(l))).toBe(true);
  });

  // root 는 권한 비트와 무관하게 쓸 수 있으므로 이 테스트는 root 가 아닌 사용자 전제입니다(CI runner 포함).
  it(
    "쓰기 권한이 없으면 package.json 불변, 경고 + 추가 명령, rc 0",
    async () => {
      const dir = await tmpDir();
      const pkgFile = path.join(dir, "package.json");
      await fs.writeFile(pkgFile, '{"name":"x"}\n');
      await fs.chmod(pkgFile, 0o444);
      const r = await runInitCli(dir);
      await fs.chmod(pkgFile, 0o644);
      expect(r.exitCode).toBe(0);
      expect(await fs.readFile(pkgFile, "utf8")).toBe('{"name":"x"}\n');
      expect(r.logs.some((l) => /^! package\.json 을 바꾸지 않았습니다\(쓸 수 없습니다/.test(l))).toBe(true);
      expect(r.logs).toContain(`  utils.ts 의존성 설치: ${ADD_CMD}`);
    }
  );

  it("계획 뒤 package.json 이 바뀌면 쓰지 않고 오류", async () => {
    const dir = await tmpDir();
    const pkgFile = path.join(dir, "package.json");
    await fs.writeFile(pkgFile, '{"name":"x"}\n');
    const plan = planUtilsDependencies(dir);
    expect(plan.action).toBe("add");
    await fs.appendFile(pkgFile, " ");
    expect(() => applyUtilsDependencies(dir, plan)).toThrow(/계획 뒤에 바뀌었습니다/);
    expect(await fs.readFile(pkgFile, "utf8")).toBe('{"name":"x"}\n ');
  });

  /** 실제 writeFileSync 처럼 파일을 비우고 앞부분만 쓴 뒤 실패하는 쓰기(ENOSPC 흉내) */
  function truncatingThenFail(file: string, data: string) {
    fs.writeFileSync(file, data.slice(0, 5));
    throw Object.assign(new Error("ENOSPC: no space left on device, write"), { code: "ENOSPC" });
  }

  it("쓰는 도중 실패하면 원래 내용으로 되돌리고 그 결과를 오류에 담음", async () => {
    const dir = await tmpDir();
    const pkgFile = path.join(dir, "package.json");
    const original = '{\n  "name": "x"\n}\n';
    await fs.writeFile(pkgFile, original);
    const plan = planUtilsDependencies(dir);
    expect(plan.action).toBe("add");
    let calls = 0;
    const writer = (file: string, data: string) => {
      calls += 1;
      if (calls === 1) truncatingThenFail(file, data);
      else fs.writeFileSync(file, data);
    };
    expect(() => applyUtilsDependencies(dir, plan, writer)).toThrow(
      /쓰는 도중 실패했습니다\(ENOSPC: no space left on device, write\)\. 원래 내용으로 되돌렸습니다\./
    );
    expect(calls).toBe(2);
    expect(await fs.readFile(pkgFile, "utf8")).toBe(original);
  });

  it("되돌리기도 실패하면 그 사실과 이유를 오류에 담음", async () => {
    const dir = await tmpDir();
    const pkgFile = path.join(dir, "package.json");
    await fs.writeFile(pkgFile, '{"name":"x"}\n');
    const plan = planUtilsDependencies(dir);
    const writer = (file: string, data: string) => truncatingThenFail(file, data);
    expect(() => applyUtilsDependencies(dir, plan, writer)).toThrow(
      /쓰는 도중 실패했습니다\(ENOSPC[^)]*\)\. 원래 내용으로 되돌리지 못했습니다\(ENOSPC[^)]*\)\. 파일이 잘렸거나 비었을 수 있으니/
    );
    // 주입한 쓰기가 실제로 파일을 잘랐는지(양성 대조)
    expect(await fs.readFile(pkgFile, "utf8")).toBe('{"nam');
  });

  it("되돌린 내용이 원래와 다르면 되돌리기 실패로 알림", async () => {
    const dir = await tmpDir();
    const pkgFile = path.join(dir, "package.json");
    await fs.writeFile(pkgFile, '{"name":"x"}\n');
    const plan = planUtilsDependencies(dir);
    let calls = 0;
    const writer = (file: string, data: string) => {
      calls += 1;
      if (calls === 1) truncatingThenFail(file, data);
      else fs.writeFileSync(file, data.slice(0, 3));
    };
    expect(() => applyUtilsDependencies(dir, plan, writer)).toThrow(
      /원래 내용으로 되돌리지 못했습니다\(되돌린 내용이 원래 내용과 다릅니다\)/
    );
  });

  it("plan 은 파일을 쓰지 않음", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), '{"name":"x"}\n');
    const before = await snapshot(dir);
    planUtilsDependencies(dir);
    expect(await snapshot(dir)).toEqual(before);
  });
});

describe("axis init: 설치를 실행하지 않음(FR-5)", () => {
  it("양성 대조: 감싼 child_process 호출은 셈에 잡힘", () => {
    vi.clearAllMocks();
    childProcess.spawnSync(process.execPath, ["-e", ""]);
    // node:child_process 와 child_process 가 같은 감싼 함수를 가리켜 두 번 셀 수 있으므로 0 보다 큰지만 봅니다.
    expect(childProcessCalls()).toBeGreaterThan(0);
  });

  it("모든 경우 자식 프로세스 호출 0", async () => {
    vi.clearAllMocks();
    const a = await tmpDir();
    await runInitCli(a);
    const b = await tmpDir();
    await fs.writeFile(path.join(b, "package.json"), '{"name":"x"}\n');
    await fs.writeFile(path.join(b, "yarn.lock"), "");
    await runInitCli(b);
    const c = await tmpDir();
    await fs.writeFile(path.join(c, "package.json"), "nope");
    await runInitCli(c);
    expect(childProcessCalls()).toBe(0);
  });
});
