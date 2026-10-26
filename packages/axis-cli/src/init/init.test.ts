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
import prompts from "prompts";
import { createHash } from "crypto";
import fs from "fs-extra";
import { readFileSync } from "node:fs";
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
  tailwind4GuideLines,
  TAILWIND4_TOKENS_VERSION,
  UTILS_TS_CONTENT,
  INIT_DEFAULTS,
  INIT_DEFAULTS_NO_SRC,
  mergeInitConfig,
  resolveInitAnswers,
  planUtilsWrite,
} from "./init.js";
import { DEFAULT_REGISTRY_URL } from "../registry/remote.js";

const REGISTRY = "https://axis-design-system.pages.dev/r";
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
    '  "$schema": "https://axis-design-system.pages.dev/schema.json",\n' +
    '  "componentsDir": "./src/components/ui",\n' +
    '  "tailwindConfig": "./tailwind.config.ts",\n' +
    '  "globalCss": "./src/app/globals.css",\n' +
    // WI-0045 D8: 기본 registry 를 axis.minu.best/r(403) 에서 pages.dev 로 바꿨습니다(실측 당시 값은 axis.minu.best/r)
    '  "registry": "https://axis-design-system.pages.dev/r"\n' +
    "}\n",
  utilsTs:
    'import { type ClassValue, clsx } from "clsx";\n' +
    'import { twMerge } from "tailwind-merge";\n' +
    "\n" +
    "export function cn(...inputs: ClassValue[]) {\n" +
    "  return twMerge(clsx(inputs));\n" +
    "}\n",
} as const;

/**
 * WI-0045 FR-4: init 이 쓰는 utils.ts 는 레지스트리 utils 항목과 같은 내용입니다(BASELINE.utilsTs 의 twMerge 기본판에서 바뀜).
 * 기대값은 코드 상수가 아니라 두 원본(배포 레지스트리 · ui-react 소스)에서 읽어, 어느 한쪽이 바뀌면 이 테스트가 갈립니다.
 */
const REGISTRY_UTILS_TS = (
  JSON.parse(readFileSync(path.join(HERE, "../../../../apps/web/public/r/utils.json"), "utf8")) as {
    files: { content: string }[];
  }
).files[0].content;
const UI_REACT_UTILS_TS = readFileSync(path.join(HERE, "../../../axis-ui-react/src/utils.ts"), "utf8");

/**
 * WI-0049 D6: src/ 가 없는 빈 디렉터리의 axis.config.json. 기준값(c131ee9)에서 componentsDir · globalCss 만
 * src 없는 기본값(./components/ui · ./app/globals.css)으로 바뀝니다(나머지 키 · 순서 · 값은 같음).
 */
const NO_SRC_CONFIG = BASELINE.axisConfig
  .replace('"./src/components/ui"', '"./components/ui"')
  .replace('"./src/app/globals.css"', '"./app/globals.css"');
/** WI-0049 D6: 실재 파일을 찾지 못했을 때의 안내 줄(빈 디렉터리) */
const NOTE_CSS_DEFAULT =
  "! 전역 CSS 파일을 찾지 못해 기본값 ./app/globals.css 를 기록합니다. 파일 위치에 맞게 axis.config.json 을 고치세요.";
const NOTE_TW_DEFAULT =
  "! Tailwind 설정 파일을 찾지 못해 기본값 ./tailwind.config.ts 를 기록합니다. 파일 위치에 맞게 axis.config.json 을 고치세요.";
/** WI-0065 D8: 애니메이션 플러그인 안내 한 줄(Tailwind 3 · lockfile 별 명령) */
const ANIMATION_TW3 = (cmd = "pnpm add") =>
  `  애니메이션: Dialog · Select 등의 열고 닫는 애니메이션(animate-in 류)은 플러그인이 필요합니다. ${cmd} tailwindcss-animate 뒤 tailwind.config 의 plugins 에 require("tailwindcss-animate") 를 넣으세요.`;
/** 기존 config 를 병합 갱신할 때의 문구 앞부분(WI-0041 D4) */
const UPDATED = (note: string) => `✓ axis.config.json 갱신(init 이 다루는 키만 바꾸고 나머지 키는 그대로 둠, ${note})`;

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

describe("axis init: utils.ts 내용(WI-0045 FR-4)", () => {
  it("레지스트리 utils 항목 · ui-react src/utils.ts 와 같고, 종전 twMerge 기본판과는 다름", () => {
    expect(UTILS_TS_CONTENT).toBe(REGISTRY_UTILS_TS);
    expect(UTILS_TS_CONTENT).toBe(UI_REACT_UTILS_TS);
    expect(UTILS_TS_CONTENT).not.toBe(BASELINE.utilsTs);
  });
});

describe("axis init: 기준값 불변(AC7)", () => {
  it("package.json 이 없으면 기존 줄 · axis.config.json 이 c131ee9 과 같고(utils.ts 는 WI-0045 로 레지스트리 utils), 의존성 안내 2줄과 D2 문구만 다름", async () => {
    const dir = await tmpDir();
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    // WI-0049 D6: 경로를 찾지 못한 안내 2줄(머리 뒤), WI-0065 D8: 애니메이션 안내 1줄(마무리 앞)이 더해집니다
    expect(r.logs).toEqual([
      BASELINE.logs[0],
      NOTE_CSS_DEFAULT,
      NOTE_TW_DEFAULT,
      BASELINE.logs[1],
      BASELINE.logs[2],
      "! package.json 이 없어 utils.ts 의존성(clsx, tailwind-merge)을 추가하지 않았습니다.",
      `  설치: ${ADD_CMD}`,
      BASIS_NONE,
      ANIMATION_TW3(),
      BASELINE.logs[3],
      NEXT_STEP,
    ]);
    expect(await fs.readFile(path.join(dir, "axis.config.json"), "utf8")).toBe(NO_SRC_CONFIG);
    expect(await fs.readFile(path.join(dir, "components/ui/utils.ts"), "utf8")).toBe(REGISTRY_UTILS_TS);
    // 파일은 두 개만 생기고 package.json 은 만들지 않음(AC3). src/ 를 새로 만들지 않음(WI-0049 부수 결함)
    expect(Object.keys(await snapshot(dir)).sort()).toEqual(
      ["axis.config.json", path.join("components", "ui", "utils.ts")].sort()
    );
  });

  it("package.json 이 있으면 의존성 줄 2개와 D2 문구 외에는 기준값과 같음", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), '{"name":"x"}\n');
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toEqual([
      BASELINE.logs[0],
      NOTE_CSS_DEFAULT,
      NOTE_TW_DEFAULT,
      BASELINE.logs[1],
      BASELINE.logs[2],
      ADDED_BOTH,
      BASIS_NONE,
      NO_INSTALL("pnpm install"),
      ANIMATION_TW3(),
      BASELINE.logs[3],
      NEXT_STEP,
    ]);
    expect(await fs.readFile(path.join(dir, "axis.config.json"), "utf8")).toBe(NO_SRC_CONFIG);
    expect(await fs.readFile(path.join(dir, "components/ui/utils.ts"), "utf8")).toBe(REGISTRY_UTILS_TS);
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

  it("tailwind-merge: 저장소 템플릿 전부가 1.6 규칙(Tailwind 3 → ^2.6.0)과 같음 (WI-0037 D2 로 정정)", async () => {
    // 종전에는 tailwindcss ^3.4.0(Tailwind 3)에 tailwind-merge ^3.4.0 을 써서 알려진 불일치로 고정했습니다.
    // WI-0037 D2(Tailwind 3 유지 + ^2.6)로 고쳤으므로 이제 규칙값과 같아야 합니다. 다시 어긋나면 이 기대값이 깨집니다.
    const templatesDir = path.resolve(HERE, "../../../../apps/web/templates");
    const names = (await fs.readdir(templatesDir)).filter((n) =>
      fs.existsSync(path.join(templatesDir, n, "files", "package.json"))
    );
    // 템플릿이 늘어도 목록을 손으로 고치지 않게 개수는 고정하지 않고 0건(측정 실패)만 막습니다(WI-0027, 위 clsx 테스트와 같은 방식)
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      const filesDir = path.join(templatesDir, n, "files");
      const pkg = await fs.readJSON(path.join(filesDir, "package.json"));
      // 선언만 보려고 저장소 밖(tmpdir)에서 판정합니다. WI-0074 부터 설치본을 상위로 찾으므로 템플릿 디렉터리에서 판정하면
      // 저장소 루트 node_modules 의 tailwindcss(개발 의존성)를 읽습니다.
      const tailwind = detectTailwind(await tmpDir(), pkg);
      expect({
        template: n,
        tailwind,
        current: pkg.dependencies["tailwind-merge"],
        rule: selectUtilsDependencies(tailwind)["tailwind-merge"],
      }).toEqual({
        template: n,
        tailwind: { major: 3, source: "declared", value: "^3.4.0" },
        current: "^2.6.0",
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

// WI-0081: 앱 층에 lockfile 이 없으면 워크스페이스 루트(pnpm-workspace.yaml · package.json workspaces, .git 에서 중단)의 lockfile 을 따름
describe("WI-0081: 워크스페이스 앱의 설치 · 애니메이션 안내", () => {
  /** 루트(workspaces 여부 · lockfile) 아래 apps/web 을 만들고 그 경로를 돌려줍니다 */
  async function wsApp(lock: string, workspaces = true): Promise<string> {
    const root = await tmpDir();
    await fs.writeJSON(path.join(root, "package.json"), workspaces ? { name: "root", private: true, workspaces: ["apps/*"] } : { name: "unrelated", private: true });
    await fs.writeFile(path.join(root, lock), "");
    const app = path.join(root, "apps", "web");
    await fs.ensureDir(app);
    return app;
  }
  const cases = [
    { lock: "package-lock.json", install: "npm install", add: 'npm install "clsx@^2.1.1" "tailwind-merge@^2.6.0"', animate: "npm install tw-animate-css" },
    { lock: "yarn.lock", install: "yarn install", add: 'yarn add "clsx@^2.1.1" "tailwind-merge@^2.6.0"', animate: "yarn add tw-animate-css" },
  ];
  for (const c of cases) {
    it(`루트 ${c.lock}: 「설치:」 · package.json 없을 때 추가 명령 · 애니메이션 안내가 모두 ${c.install} 계열(종전 pnpm)`, async () => {
      const withPkg = await wsApp(c.lock);
      await fs.writeFile(path.join(withPkg, "package.json"), '{"name":"web"}\n');
      expect((await runInitCli(withPkg)).logs).toContain(NO_INSTALL(c.install));

      const noPkg = await wsApp(c.lock);
      expect((await runInitCli(noPkg)).logs).toContain(`  설치: ${c.add}`);

      const tw4 = await wsApp(c.lock);
      await fs.writeFile(path.join(tw4, "package.json"), JSON.stringify({ name: "web", devDependencies: { tailwindcss: "^4" } }));
      expect((await runInitCli(tw4)).logs.find((l) => l.includes("애니메이션:"))).toContain(`${c.animate} 뒤 전역 CSS`);
    });
  }

  it("음성 대조: 워크스페이스가 아닌 상위의 package-lock.json 은 쓰지 않음 → pnpm 그대로", async () => {
    const app = await wsApp("package-lock.json", false);
    await fs.writeFile(path.join(app, "package.json"), '{"name":"web"}\n');
    expect((await runInitCli(app)).logs).toContain(NO_INSTALL("pnpm install"));
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

describe("axis init: Tailwind 4 연동 안내 (WI-0044 FR-3)", () => {
  // WI-0049 D6: src 없는 임시 디렉터리라 제목의 경로가 ./app/globals.css 입니다(종전에는 없는 경로 ./src/app/globals.css)
  const GLOBAL_CSS = "./app/globals.css";
  const HEAD = `\nTailwind 4: 전역 CSS(${GLOBAL_CSS}) 맨 위에 다음 줄을 넣으세요(파일은 고치지 않았습니다).`;
  const TW_LINE = '  @import "tailwindcss";';
  const TOKENS_LINE = '  @import "@axis-ds/tokens/css/tailwind4";';
  const EXAMPLE_LINE =
    '  npm 패키지 컴포넌트를 쓰면 그 패키지의 tailwind.css 도 넣으세요(예: @import "@axis-ds/ui-react/tailwind.css";).';
  /** quick-start 「create-next-app 기본 globals.css 와의 충돌」과 같은 내용(블록 4개 · 이름 5개 · 지움, WI-0044 보정) */
  const CONFLICT_LINE =
    "  ! create-next-app 기본 globals.css 의 :root · @theme inline · @media (prefers-color-scheme: dark) · body 블록은 " +
    "AXIS 와 같은 이름(--background · --foreground · --color-background · --font-sans · --font-mono)을 다른 값으로 정의합니다. 이 블록들을 지우세요.";
  const INSTALL_LINE = (cmd: string) => `  @axis-ds/tokens 설치: ${cmd}`;
  /** init 출력에서 Tailwind 4 안내 구간(제목 줄부터 '초기화 완료' 앞까지) */
  const guideOf = (lines: string[]) => {
    const start = lines.indexOf(HEAD);
    const end = lines.indexOf(BASELINE.logs[3]);
    return start < 0 ? [] : lines.slice(start, end);
  };

  async function installTailwind(dir: string, version: string) {
    await fs.outputFile(
      path.join(dir, "node_modules", "tailwindcss", "package.json"),
      JSON.stringify({ name: "tailwindcss", version }) + "\n"
    );
  }

  /** axis.config.json 의 키 목록과 tailwindConfig 값 */
  async function configKeys(dir: string) {
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    return { keys: Object.keys(config), tailwindConfig: config.tailwindConfig };
  }

  it("설치본 4.3.3 · tokens 없음: import 2줄 · 패키지 예시 · 이름 충돌 주의 · tokens 설치 명령, '초기화 완료' 앞", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^4" } }) + "\n");
    await installTailwind(dir, "4.3.3");
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(guideOf(r.logs)).toEqual([
      HEAD,
      TW_LINE,
      TOKENS_LINE,
      EXAMPLE_LINE,
      CONFLICT_LINE,
      INSTALL_LINE(`pnpm add "@axis-ds/tokens@^${TAILWIND4_TOKENS_VERSION}"`),
    ]);
    // 안내는 의존성 줄 뒤, 마무리 줄 앞
    expect(r.logs.slice(-2)).toEqual([BASELINE.logs[3], NEXT_STEP]);
    expect(TAILWIND4_TOKENS_VERSION).toBe("1.4.0");
  });

  it("tokens · ui-react · agentic-ui 가 선언돼 있으면 설치 줄 없이 두 패키지의 tailwind.css import", async () => {
    const dir = await tmpDir();
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "x",
        dependencies: { "@axis-ds/tokens": "^1.4.0", "@axis-ds/ui-react": "^1.4.0", "@axis-ds/agentic-ui": "^1.4.0" },
        devDependencies: { tailwindcss: "^4" },
      }) + "\n"
    );
    const r = await runInitCli(dir);
    expect(guideOf(r.logs)).toEqual([
      HEAD,
      TW_LINE,
      TOKENS_LINE,
      '  @import "@axis-ds/ui-react/tailwind.css";',
      '  @import "@axis-ds/agentic-ui/tailwind.css";',
      CONFLICT_LINE,
    ]);
  });

  it("tokens 설치 명령은 lockfile 을 따름(theme add 와 같은 판정)", async () => {
    for (const [lock, cmd] of [
      ["package-lock.json", 'npm install "@axis-ds/tokens@^1.4.0"'],
      ["yarn.lock", 'yarn add "@axis-ds/tokens@^1.4.0"'],
      ["pnpm-lock.yaml", 'pnpm add "@axis-ds/tokens@^1.4.0"'],
    ] as const) {
      const dir = await tmpDir();
      await fs.writeFile(path.join(dir, lock), "");
      await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^4.1.0" } }));
      const r = await runInitCli(dir);
      expect({ lock, last: guideOf(r.logs).at(-1) }).toEqual({ lock, last: INSTALL_LINE(cmd) });
    }
  });

  it("package.json 이 없어도 설치본 4 면 안내와 tokens 설치 명령을 냄", async () => {
    const dir = await tmpDir();
    await installTailwind(dir, "4.0.0");
    const r = await runInitCli(dir);
    expect(guideOf(r.logs)).toEqual([
      HEAD,
      TW_LINE,
      TOKENS_LINE,
      EXAMPLE_LINE,
      CONFLICT_LINE,
      INSTALL_LINE('pnpm add "@axis-ds/tokens@^1.4.0"'),
    ]);
  });

  it("Tailwind 4 의 axis.config.json 에는 tailwindConfig 키가 없음, 나머지 키 순서 유지", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^4" } }));
    await runInitCli(dir);
    expect(await configKeys(dir)).toEqual({
      keys: ["$schema", "componentsDir", "globalCss", "registry"],
      tailwindConfig: undefined,
    });
    expect(await fs.pathExists(path.join(dir, "tailwind.config.ts"))).toBe(false);
  });

  it("대화형: Tailwind 4 는 설정 파일을 묻지 않고, 받은 경로 2개만 기록", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^4" } }));
    prompts.inject(["./components/ui", "./app/globals.css"]);
    const program = new Command();
    program.exitOverride();
    // 대화형 경로를 보려면 판정을 주입합니다(테스트 stdin 은 TTY 가 아니라 기본은 비대화형, WI-0075)
    registerInitCommand(program, REGISTRY, { isInteractive: () => true });
    process.chdir(dir);
    try {
      await program.parseAsync(["init"], { from: "user" });
    } finally {
      process.chdir(cwd0);
    }
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(config).toEqual({
      $schema: "https://axis-design-system.pages.dev/schema.json",
      componentsDir: "./components/ui",
      globalCss: "./app/globals.css",
      registry: REGISTRY,
    });
    expect(logs).toContain("\nTailwind 4: 전역 CSS(./app/globals.css) 맨 위에 다음 줄을 넣으세요(파일은 고치지 않았습니다).");
  });

  it("대화형: Tailwind 3 은 종전대로 설정 파일을 묻고 기록", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.0" } }));
    prompts.inject(["./components/ui", "./tailwind.config.js", "./app/globals.css"]);
    const program = new Command();
    program.exitOverride();
    registerInitCommand(program, REGISTRY, { isInteractive: () => true });
    process.chdir(dir);
    try {
      await program.parseAsync(["init"], { from: "user" });
    } finally {
      process.chdir(cwd0);
    }
    expect(await fs.readJSON(path.join(dir, "axis.config.json"))).toEqual({
      $schema: "https://axis-design-system.pages.dev/schema.json",
      componentsDir: "./components/ui",
      tailwindConfig: "./tailwind.config.js",
      globalCss: "./app/globals.css",
      registry: REGISTRY,
    });
  });

  it("Tailwind 3 선언: 출력 전체 · axis.config.json 이 종전과 같고 안내가 없음", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.0" } }));
    const r = await runInitCli(dir);
    expect(r.logs).toEqual([
      BASELINE.logs[0],
      NOTE_CSS_DEFAULT,
      NOTE_TW_DEFAULT,
      BASELINE.logs[1],
      BASELINE.logs[2],
      ADDED_BOTH,
      "  tailwind-merge 범위 기준: package.json 의 tailwindcss ^3.4.0",
      NO_INSTALL("pnpm install"),
      ANIMATION_TW3(),
      BASELINE.logs[3],
      NEXT_STEP,
    ]);
    expect(await fs.readFile(path.join(dir, "axis.config.json"), "utf8")).toBe(NO_SRC_CONFIG);
  });

  it("설치본 3.x · 판정 불가(catalog:) · tailwindcss 없음은 안내 없음, tailwindConfig 기록", async () => {
    const v3 = await tmpDir();
    await fs.writeFile(path.join(v3, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^4" } }));
    await installTailwind(v3, "3.4.17");
    const unknown = await tmpDir();
    await fs.writeFile(path.join(unknown, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "catalog:" } }));
    const none = await tmpDir();
    for (const dir of [v3, unknown, none]) {
      const r = await runInitCli(dir);
      expect(r.logs.some((l) => l.includes("Tailwind 4:") || l.includes("@axis-ds/tokens/css/tailwind4"))).toBe(false);
      expect((await configKeys(dir)).tailwindConfig).toBe("./tailwind.config.ts");
    }
  });

  // WI-0044 보정: 선언된 AXIS 패키지의 하한이 1.4.0 미만이면 ^1.4.0 으로 올리는 명령(판정 불가는 보정 2차 A1 에서 확인 줄로 나눔)
  const UPGRADE_LINE = (declared: string, cmd: string) =>
    `  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 선언(${declared})을 올리세요: ${cmd}`;

  it("tokens 1.3.x 선언 → 업그레이드 명령(lockfile 별), 설치 줄은 없음", async () => {
    for (const [lock, cmd] of [
      ["pnpm-lock.yaml", 'pnpm add "@axis-ds/tokens@^1.4.0"'],
      ["package-lock.json", 'npm install "@axis-ds/tokens@^1.4.0"'],
      ["yarn.lock", 'yarn add "@axis-ds/tokens@^1.4.0"'],
    ] as const) {
      const dir = await tmpDir();
      await fs.writeFile(path.join(dir, lock), "");
      await fs.writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({ name: "x", dependencies: { "@axis-ds/tokens": "^1.3.0" }, devDependencies: { tailwindcss: "^4" } })
      );
      const r = await runInitCli(dir);
      expect({ lock, guide: guideOf(r.logs) }).toEqual({
        lock,
        guide: [HEAD, TW_LINE, TOKENS_LINE, EXAMPLE_LINE, CONFLICT_LINE, UPGRADE_LINE("@axis-ds/tokens ^1.3.0", cmd)],
      });
    }
  });

  it("세 패키지 중 1.4.0 미만인 것만 한 명령으로 올림(ui-react ~1.3.2 · agentic-ui 1.3.0, tokens ^1.4.0 은 제외)", async () => {
    const dir = await tmpDir();
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "x",
        dependencies: { "@axis-ds/tokens": "^1.4.0", "@axis-ds/ui-react": "~1.3.2" },
        devDependencies: { "@axis-ds/agentic-ui": "1.3.0", tailwindcss: "^4" },
      })
    );
    const r = await runInitCli(dir);
    expect(guideOf(r.logs).at(-1)).toBe(
      UPGRADE_LINE(
        "@axis-ds/ui-react ~1.3.2 · @axis-ds/agentic-ui 1.3.0",
        'pnpm add "@axis-ds/ui-react@^1.4.0" "@axis-ds/agentic-ui@^1.4.0"'
      )
    );
  });

  it("^1.4.0 · >=1.4 · ~1.5.0 선언은 업그레이드 줄 없음", () => {
    for (const range of ["^1.4.0", ">=1.4", "~1.5.0", "1.4.0", ">1.3", "1.4.0 - 1.9.0"]) {
      const lines = tailwind4GuideLines({ dependencies: { "@axis-ds/tokens": range } }, "pnpm install", "./g.css");
      expect({ range, upgrade: lines.some((l) => l.includes("올리세요")) }).toEqual({ range, upgrade: false });
    }
  });

  it("하한이 1.4.0 미만(prerelease 하한 ^1.4.0-beta.1 · >1.3.9 · 1.x · 1.3.0 - 1.5.0)은 업그레이드 안내", () => {
    for (const range of ["^1.4.0-beta.1", ">1.3.9", "1.x", "1.3.0 - 1.5.0"]) {
      const lines = tailwind4GuideLines({ dependencies: { "@axis-ds/tokens": range } }, "pnpm install", "./g.css");
      expect({ range, last: lines.at(-1) }).toEqual({
        range,
        last: UPGRADE_LINE(`@axis-ds/tokens ${range}`, 'pnpm add "@axis-ds/tokens@^1.4.0"'),
      });
    }
  });

  // 보정 2차 A1: 판정 불가 범위는 선언을 덮어쓰지 않고 설치본 확인, workspace: 는 안내 없음(axis check 와 같은 규칙)
  const CONFIRM_LINE = (declared: string) =>
    `  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 선언(${declared})으로는 버전을 판정할 수 없으니 설치된 버전이 1.4.0 이상인지 확인하세요.`;

  it("판정 불가(catalog: · latest · ^1 || ^2 · <2 · *)는 설치된 버전 확인 줄, 업그레이드 명령 없음(A1)", () => {
    for (const range of ["catalog:", "latest", "^1 || ^2", "<2", "*"]) {
      const lines = tailwind4GuideLines({ dependencies: { "@axis-ds/tokens": range } }, "pnpm install", "./g.css");
      expect({ range, last: lines.at(-1), upgrade: lines.some((l) => l.includes("올리세요")) }).toEqual({
        range,
        last: CONFIRM_LINE(`@axis-ds/tokens ${range}`),
        upgrade: false,
      });
    }
  });

  it("workspace: 프로토콜은 업그레이드 · 확인 줄 모두 없음(A1, 모노레포 링크를 덮어쓰지 않음)", () => {
    for (const range of ["workspace:*", "workspace:^1.3.0"]) {
      const lines = tailwind4GuideLines({ dependencies: { "@axis-ds/tokens": range } }, "pnpm install", "./g.css");
      expect({ range, last: lines.at(-1) }).toEqual({ range, last: CONFLICT_LINE });
    }
  });

  it("미만 · 판정 불가가 섞이면 업그레이드 줄 다음 확인 줄(선언 순서), 판정 불가는 명령에 넣지 않음", async () => {
    const dir = await tmpDir();
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "x",
        dependencies: { "@axis-ds/agentic-ui": "catalog:", "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "workspace:*" },
        devDependencies: { tailwindcss: "^4" },
      })
    );
    const r = await runInitCli(dir);
    expect(guideOf(r.logs).slice(-2)).toEqual([
      UPGRADE_LINE("@axis-ds/tokens ^1.3.0", 'pnpm add "@axis-ds/tokens@^1.4.0"'),
      CONFIRM_LINE("@axis-ds/agentic-ui catalog:"),
    ]);
  });

  // 보정 3차: runInit 이 프로젝트 디렉터리를 넘겨 설치본(node_modules)을 먼저 봄(axis check 와 같은 함수)
  it("init -y: 설치본 1.4.2 + 선언 ^1.3.0 은 안내 없음, 설치본 1.3.0 + 선언 ^1.4.0 은 설치본 버전으로 안내", async () => {
    const ok = await tmpDir();
    await fs.writeFile(
      path.join(ok, "package.json"),
      JSON.stringify({ name: "x", dependencies: { "@axis-ds/tokens": "^1.3.0" }, devDependencies: { tailwindcss: "^4" } })
    );
    await fs.outputJSON(path.join(ok, "node_modules/@axis-ds/tokens/package.json"), { version: "1.4.2" });
    expect(guideOf((await runInitCli(ok)).logs).at(-1)).toBe(CONFLICT_LINE);

    const old = await tmpDir();
    await fs.writeFile(
      path.join(old, "package.json"),
      JSON.stringify({ name: "x", dependencies: { "@axis-ds/tokens": "^1.4.0" }, devDependencies: { tailwindcss: "^4" } })
    );
    await fs.outputJSON(path.join(old, "node_modules/@axis-ds/tokens/package.json"), { version: "1.3.0" });
    expect(guideOf((await runInitCli(old)).logs).at(-1)).toBe(
      '  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 설치본(@axis-ds/tokens 1.3.0, 선언 ^1.4.0)을 올리세요: pnpm add "@axis-ds/tokens@^1.4.0"'
    );
  });

  // 보정 3차 후속: 설치본이 1.4.0 미만이어도 하한을 읽을 수 없는 선언(catalog: · npm: · latest · ||)은 덮어쓰는 명령을 내지 않음
  it("설치본 1.3.0 + 하한을 읽을 수 없는 선언은 pnpm add 없이 선언을 올리고 다시 설치하라는 줄", async () => {
    for (const range of ["catalog:", "npm:@axis-ds/tokens@1.3.0", "latest", "^1 || ^2"]) {
      const dir = await tmpDir();
      await fs.writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({ name: "x", dependencies: { "@axis-ds/tokens": range }, devDependencies: { tailwindcss: "^4" } })
      );
      await fs.outputJSON(path.join(dir, "node_modules/@axis-ds/tokens/package.json"), { version: "1.3.0" });
      const guide = guideOf((await runInitCli(dir)).logs);
      expect({ range, last: guide.at(-1), add: guide.some((l) => l.includes("pnpm add")) }).toEqual({
        range,
        last: `  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 설치본(@axis-ds/tokens 1.3.0, 선언 ${range})이 1.4.0 미만입니다. 선언이 가리키는 버전을 1.4.0 이상으로 올린 뒤 다시 설치하세요(선언은 덮어쓰지 않습니다).`,
        add: false,
      });
    }
  });

  it("설치본 미만이 섞이면 읽을 수 있는 선언만 명령에 넣음(catalog: 는 명령 밖)", async () => {
    const dir = await tmpDir();
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "x",
        dependencies: { "@axis-ds/tokens": "^1.3.0", "@axis-ds/ui-react": "catalog:" },
        devDependencies: { tailwindcss: "^4" },
      })
    );
    await fs.outputJSON(path.join(dir, "node_modules/@axis-ds/tokens/package.json"), { version: "1.3.0" });
    await fs.outputJSON(path.join(dir, "node_modules/@axis-ds/ui-react/package.json"), { version: "1.3.0" });
    expect(guideOf((await runInitCli(dir)).logs).slice(-2)).toEqual([
      '  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 설치본(@axis-ds/tokens 1.3.0, 선언 ^1.3.0)을 올리세요: pnpm add "@axis-ds/tokens@^1.4.0"',
      "  ! Tailwind 4 진입점은 1.4.0 부터 있습니다. 설치본(@axis-ds/ui-react 1.3.0, 선언 catalog:)이 1.4.0 미만입니다. 선언이 가리키는 버전을 1.4.0 이상으로 올린 뒤 다시 설치하세요(선언은 덮어쓰지 않습니다).",
    ]);
  });

  it("이름 충돌 안내는 quick-start 「Tailwind CSS 4」 절의 지울 블록 · 이름과 같음(두 곳 대조)", async () => {
    const doc = await fs.readFile(path.resolve(HERE, "../../../../docs/guides/quick-start.md"), "utf8");
    const section = doc.slice(doc.indexOf("### Tailwind CSS 4"), doc.indexOf("### Tailwind CSS 3"));
    const block = /```css\n\/\* 지울 블록[^\n]*\n([\s\S]*?)```/.exec(section)?.[1] ?? "";
    // 문서 코드 블록의 최상위 블록 머리(들여쓰기 없는 `... {`)
    const heads = [...block.matchAll(/^(\S[^{\n]*?)\s*\{/gm)].map((m) => m[1].trim());
    expect(heads).toEqual([":root", "@theme inline", "@media (prefers-color-scheme: dark)", "body"]);
    for (const head of heads) expect(CONFLICT_LINE).toContain(head);
    const names = ["--background", "--foreground", "--color-background", "--font-sans", "--font-mono"];
    for (const name of names) {
      expect(section).toContain(`\`${name}\``);
      expect(CONFLICT_LINE).toContain(name);
    }
    expect(section).toContain("지웁니다");
    expect(CONFLICT_LINE).toContain("지우세요");
  });

  it("tailwind4GuideLines: devDependencies 의 tokens 도 선언으로 침, 첫 줄은 제목", () => {
    const lines = tailwind4GuideLines({ devDependencies: { "@axis-ds/tokens": "workspace:*" } }, "pnpm install", "./g.css");
    expect(lines[0]).toBe("Tailwind 4: 전역 CSS(./g.css) 맨 위에 다음 줄을 넣으세요(파일은 고치지 않았습니다).");
    expect(lines.some((l) => l.includes("설치:"))).toBe(false);
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

describe("axis init: 환경변수 AXIS_REGISTRY_URL 을 config 에 기록하지 않음(WI-0045 D7)", () => {
  const ENV_URL = "http://127.0.0.1:9/r";
  let envBefore: string | undefined;
  beforeEach(() => {
    envBefore = process.env.AXIS_REGISTRY_URL;
    process.env.AXIS_REGISTRY_URL = ENV_URL;
  });
  afterEach(() => {
    if (envBefore === undefined) delete process.env.AXIS_REGISTRY_URL;
    else process.env.AXIS_REGISTRY_URL = envBefore;
  });

  // 이 describe 는 registerInitCommand 를 직접 부릅니다. 실제 진입점(src/index.ts)이 env 를 넘기도록 바뀌는 회귀는
  // 아래 「진입점 등록」 검사와, 빌드한 dist 를 실행하는 scripts/cli-bundled-smoke.mjs(pnpm cli-smoke, CI) D7 단계가 잡습니다.
  it("진입점 등록: src/index.ts 는 registerInitCommand 에 registryUrl 을 넘기지 않음(env 를 init 에 전달하지 않음)", () => {
    const entry = readFileSync(fileURLToPath(new URL("../index.ts", import.meta.url)), "utf8");
    const calls = entry.match(/registerInitCommand\([^)]*\)/g) ?? [];
    // 양성 대조: 호출이 실제로 있어야 함(0건이면 검사 자체가 빗나간 것)
    expect(calls.length).toBe(1);
    expect(calls[0]).toBe("registerInitCommand(program)");
  });

  /** src/index.ts 와 같은 등록(registryUrl 인자 없음)으로 `axis init -y` */
  async function runInitAsEntry(dir: string): Promise<void> {
    const program = new Command();
    program.exitOverride();
    registerInitCommand(program);
    process.chdir(dir);
    try {
      await program.parseAsync(["init", "-y"], { from: "user" });
    } finally {
      process.chdir(cwd0);
    }
  }

  it("env 를 준 init 뒤 config.registry 는 기본값", async () => {
    const dir = await tmpDir();
    // 대조: 이 테스트 안에서 env 가 실제로 걸려 있음
    expect(process.env.AXIS_REGISTRY_URL).toBe(ENV_URL);
    await runInitAsEntry(dir);
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(config.registry).toBe(DEFAULT_REGISTRY_URL);
    expect(config.registry).not.toBe(ENV_URL);
  });

  it("이미 있던 config 의 registry 는 지킴(env 가 있어도)", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./x", registry: "https://mirror.example/r" });
    await runInitAsEntry(dir);
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(config.registry).toBe("https://mirror.example/r");
    // WI-0041 D5: 기존 componentsDir 는 보존합니다(종전에는 init 기본값으로 되돌림)
    expect(config.componentsDir).toBe("./x");
  });

  it("기존 config 에 registry 가 없거나 비었으면 기본값", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./x", registry: "  " });
    await runInitAsEntry(dir);
    expect((await fs.readJSON(path.join(dir, "axis.config.json"))).registry).toBe(DEFAULT_REGISTRY_URL);
  });
});

describe("axis init: 기존 axis.config.json 출력(WI-0045 m5)", () => {
  it("양성 대조: config 가 없으면 「생성 완료」", async () => {
    const dir = await tmpDir();
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ axis.config.json 생성 완료");
  });

  it("같은 내용의 config 가 이미 있으면 「유지」이고 파일을 다시 쓰지 않음", async () => {
    const dir = await tmpDir();
    await runInitCli(dir);
    const file = path.join(dir, "axis.config.json");
    const before = await fs.readFile(file, "utf8");
    const mtimeBefore = (await fs.stat(file)).mtimeMs;
    await new Promise((ok) => setTimeout(ok, 20));
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ axis.config.json 유지(이미 같은 내용)");
    expect(r.logs.some((l) => l.includes("axis.config.json 생성 완료"))).toBe(false);
    expect(await fs.readFile(file, "utf8")).toBe(before);
    expect((await fs.stat(file)).mtimeMs).toBe(mtimeBefore);
  });

  it("내용이 다른 config 가 있으면 「갱신」(registry 기존 값 유지를 함께 알림)", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./x", registry: "https://mirror.example/r" });
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain(UPDATED("registry 는 기존 값 유지"));
    expect(r.logs.some((l) => l.includes("axis.config.json 생성 완료"))).toBe(false);
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(config.componentsDir).toBe("./x");
    expect(config.registry).toBe("https://mirror.example/r");
  });

  it("registry 가 없던 config 를 갱신하면 「registry 는 기본값」", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./x" });
    const r = await runInitCli(dir);
    expect(r.logs).toContain(UPDATED("registry 는 기본값"));
  });

  it("다시 실행해도 add 가 읽는 agenticDir 를 지키고(키 순서는 componentsDir 다음), 갱신 문구에 알림", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "src/components/ui", agenticDir: "src/ai" });
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain(UPDATED("registry 는 기본값, agenticDir 는 기존 값 유지"));
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(config.agenticDir).toBe("src/ai");
    expect(Object.keys(config).indexOf("agenticDir")).toBe(Object.keys(config).indexOf("componentsDir") + 1);
    // 같은 내용으로 다시 실행하면 「유지」
    const r2 = await runInitCli(dir);
    expect(r2.logs).toContain("✓ axis.config.json 유지(이미 같은 내용)");
    expect((await fs.readJSON(path.join(dir, "axis.config.json"))).agenticDir).toBe("src/ai");
  });

  it("WI-0041 D4: init 이 쓰지 않는 키(brand · monetDir)는 값 · 순서를 그대로 지키고, 빠진 키 안내가 없음", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./x", brand: "acme", monetDir: "monet" });
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs.some((l) => l.includes("빠진 키"))).toBe(false);
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(config.brand).toBe("acme");
    expect(config.monetDir).toBe("monet");
    // 기존 키 순서(componentsDir · brand · monetDir)를 지키고, 없던 init 키는 init 순서의 앞 키 다음에 들어감
    expect(Object.keys(config)).toEqual(["$schema", "componentsDir", "tailwindConfig", "globalCss", "registry", "brand", "monetDir"]);
  });

  it("음성 대조(종전 결함 재현 조건): theme add 가 쓴 brand 가 init 재실행 뒤에도 남음", async () => {
    const dir = await tmpDir();
    await runInitCli(dir);
    const file = path.join(dir, "axis.config.json");
    await fs.writeJSON(file, { ...(await fs.readJSON(file)), brand: "ontology" }, { spaces: 2 });
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect((await fs.readJSON(file)).brand).toBe("ontology");
    expect(r.logs).toContain("✓ axis.config.json 유지(이미 같은 내용)");
  });

  it("음성 대조: agenticDir 가 없던 config 에는 agenticDir 를 만들지 않고 빠진 키 안내도 없음", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./x" });
    const r = await runInitCli(dir);
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect("agenticDir" in config).toBe(false);
    expect(r.logs.some((l) => l.includes("빠진 키"))).toBe(false);
  });
});

describe("axis init: 기존 utils.ts 출력(WI-0045 n1)", () => {
  const utilsFile = (dir: string) => path.join(dir, INIT_DEFAULTS_NO_SRC.componentsDir, "utils.ts");

  it("양성 대조: utils.ts 가 없으면 「생성 완료」", async () => {
    const dir = await tmpDir();
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ utils.ts 생성 완료");
    expect(await fs.readFile(utilsFile(dir), "utf8")).toBe(UTILS_TS_CONTENT);
  });

  it("같은 내용의 utils.ts 가 있으면 「유지」이고 파일을 다시 쓰지 않음", async () => {
    const dir = await tmpDir();
    await runInitCli(dir);
    const mtimeBefore = (await fs.stat(utilsFile(dir))).mtimeMs;
    await new Promise((ok) => setTimeout(ok, 20));
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ utils.ts 유지(이미 같은 내용)");
    expect(r.logs.some((l) => l.includes("utils.ts 생성 완료"))).toBe(false);
    expect((await fs.stat(utilsFile(dir))).mtimeMs).toBe(mtimeBefore);
  });

  it("내용이 다른 utils.ts 가 있으면 종전처럼 덮어쓰고 「덮어씀」으로 알림", async () => {
    const dir = await tmpDir();
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.writeFile(utilsFile(dir), "// 사용자 utils\n");
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ utils.ts 덮어씀(기존 내용과 달라 init 의 utils 로 다시 씀)");
    expect(r.logs.some((l) => l.includes("utils.ts 생성 완료") || l.includes("utils.ts 유지"))).toBe(false);
    expect(await fs.readFile(utilsFile(dir), "utf8")).toBe(UTILS_TS_CONTENT);
  });
});

describe("axis init: utils.ts 링크 규칙(WI-0045 D17)", () => {
  const utilsFile = (dir: string) => path.join(dir, INIT_DEFAULTS_NO_SRC.componentsDir, "utils.ts");
  const configFile = (dir: string) => path.join(dir, "axis.config.json");

  /** utils.ts 자리에 target 을 가리키는 심볼릭 링크를 둡니다 */
  async function linkUtils(dir: string, target: string): Promise<void> {
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.symlink(target, utilsFile(dir));
  }

  it("프로젝트 안 링크 · 같은 내용: 쓰지 않고 「유지(이미 같은 내용, 링크)」, rc 0, 링크 그대로", async () => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    await fs.ensureDir(path.join(dir, "shared"));
    await fs.writeFile(path.join(dir, "shared/utils.ts"), UTILS_TS_CONTENT);
    await linkUtils(dir, path.join(dir, "shared/utils.ts"));
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ utils.ts 유지(이미 같은 내용, 링크)");
    expect((await fs.lstat(utilsFile(dir))).isSymbolicLink()).toBe(true);
    expect(await fs.pathExists(configFile(dir))).toBe(true);
  });

  it("프로젝트 밖 링크 · 같은 내용: 쓰지 않고 유지, 링크 대상이 밖이라는 사실을 알림(rc 0)", async () => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    const outside = await tmpDir();
    const real = path.join(await fs.realpath(outside), "utils.ts");
    await fs.writeFile(real, UTILS_TS_CONTENT);
    await linkUtils(dir, real);
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain(`✓ utils.ts 유지(이미 같은 내용, 링크 대상이 프로젝트 밖: ${real})`);
    expect(await fs.readFile(real, "utf8")).toBe(UTILS_TS_CONTENT);
  });

  it.each([
    ["프로젝트 안", false],
    ["프로젝트 밖", true],
  ])("%s 링크 · 다른 내용: 아무것도 쓰지 않고(config 포함) 그 사실을 알린 뒤 rc 1", async (_label, outsideLink) => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    const base = outsideLink ? await fs.realpath(await tmpDir()) : path.join(dir, "shared");
    await fs.ensureDir(base);
    const real = path.join(base, "utils.ts");
    await fs.writeFile(real, "// 사용자 utils\n");
    await linkUtils(dir, real);
    const before = await snapshot(dir);
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(1);
    const all = r.logs.join("\n");
    expect(all).toContain("아무것도 쓰지 않았습니다");
    expect(all).toContain(outsideLink ? `프로젝트 밖(${real})을 가리키는 심볼릭 링크라` : "프로젝트 안을 가리키는 심볼릭 링크라");
    expect(all).not.toContain("생성 완료");
    expect(all).not.toContain("덮어씀");
    expect(await fs.pathExists(configFile(dir))).toBe(false);
    expect(await snapshot(dir)).toEqual(before);
    expect(await fs.readFile(real, "utf8")).toBe("// 사용자 utils\n");
    expect((await fs.lstat(utilsFile(dir))).isSymbolicLink()).toBe(true);
  });

  it("깨진 링크 · 디렉터리 · 디렉터리를 가리키는 링크는 쓰지 않고 rc 1(config 도 쓰지 않음)", async () => {
    if (process.platform === "win32") return;
    const cases: { label: string; setup: (dir: string) => Promise<void>; expected: string }[] = [
      { label: "깨진 링크", setup: (dir) => linkUtils(dir, path.join(dir, "missing.ts")), expected: "깨진 심볼릭 링크" },
      { label: "디렉터리", setup: (dir) => fs.ensureDir(utilsFile(dir)), expected: "이름의 디렉터리가 있어" },
      {
        label: "디렉터리 링크",
        setup: async (dir) => {
          await fs.ensureDir(path.join(dir, "somedir"));
          await linkUtils(dir, path.join(dir, "somedir"));
        },
        expected: "링크가 디렉터리",
      },
    ];
    for (const c of cases) {
      const dir = await tmpDir();
      await c.setup(dir);
      const r = await runInitCli(dir);
      expect(r.exitCode, c.label).toBe(1);
      expect(r.logs.join("\n"), c.label).toContain(c.expected);
      expect(await fs.pathExists(configFile(dir)), c.label).toBe(false);
    }
  });

  it("양성 대조: 링크가 아닌 다른 내용의 일반 파일은 종전처럼 덮어씀", async () => {
    const dir = await tmpDir();
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.writeFile(utilsFile(dir), "// 사용자 utils\n");
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ utils.ts 덮어씀(기존 내용과 달라 init 의 utils 로 다시 씀)");
  });

  it("쓰기는 add 와 같은 O_NOFOLLOW 경로: 판정 뒤 쓰기 직전에 링크로 바뀌면 따라가 쓰지 않고 rc 1", async () => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    const outside = await fs.realpath(await tmpDir());
    const victim = path.join(outside, "victim.ts");
    await fs.writeFile(victim, "원본\n");
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.writeFile(utilsFile(dir), "// 사용자 utils\n");
    const realOpen = fs.open.bind(fs) as (...a: unknown[]) => Promise<number>;
    vi.spyOn(fs, "open").mockImplementation((async (...args: unknown[]) => {
      if (args[0] === utilsFile(dir) && !(await fs.lstat(utilsFile(dir))).isSymbolicLink()) {
        await fs.remove(utilsFile(dir));
        await fs.symlink(victim, utilsFile(dir));
      }
      return realOpen(...args);
    }) as unknown as typeof fs.open);
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(1);
    expect(r.logs.join("\n")).toContain("utils.ts 를 쓰지 못했습니다");
    expect(await fs.readFile(victim, "utf8")).toBe("원본\n");
  });
});

describe("axis init: utils.ts 를 읽지 못할 때(WI-0045 p2)", () => {
  const utilsFile = (dir: string) => path.join(dir, INIT_DEFAULTS_NO_SRC.componentsDir, "utils.ts");

  it("읽을 수 없는 기존 axis.config.json(EACCES)은 없는 파일로 보지 않고 쓰지 않음(rc 1, 사용자 값 보존)", async () => {
    if (process.platform === "win32" || process.getuid?.() === 0) return;
    const dir = await tmpDir();
    const cfg = path.join(dir, "axis.config.json");
    const original = `${JSON.stringify({ registry: "https://my.example/r", brand: "keep" }, null, 2)}\n`;
    await fs.writeFile(cfg, original);
    await fs.chmod(cfg, 0o200);
    try {
      const r = await runInitCli(dir);
      expect(r.exitCode).toBe(1);
      const all = r.logs.join("\n");
      expect(all).toContain("기존 axis.config.json 을 읽지 못해 비교할 수 없습니다(EACCES)");
      expect(all).not.toContain("axis.config.json 생성 완료");
      expect(await fs.pathExists(utilsFile(dir))).toBe(false);
    } finally {
      await fs.chmod(cfg, 0o644);
    }
    expect(await fs.readFile(cfg, "utf8")).toBe(original);
  });

  it("읽기 전용 utils.ts(내용이 다름)는 계획 단계에서 막아 config 도 쓰지 않음(rc 1, 부분 쓰기 없음)", async () => {
    if (process.platform === "win32" || process.getuid?.() === 0) return;
    const dir = await tmpDir();
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.writeFile(utilsFile(dir), "// 사용자 utils\n");
    await fs.chmod(utilsFile(dir), 0o444);
    try {
      const r = await runInitCli(dir);
      expect(r.exitCode).toBe(1);
      expect(r.logs.join("\n")).toContain("쓸 권한이 없어 덮어쓸 수 없습니다(EACCES)");
      expect(await fs.pathExists(path.join(dir, "axis.config.json"))).toBe(false);
    } finally {
      await fs.chmod(utilsFile(dir), 0o644);
    }
    expect(await fs.readFile(utilsFile(dir), "utf8")).toBe("// 사용자 utils\n");
  });

  it("읽을 수 없는 utils.ts(EACCES)는 「생성 완료」가 아니라 그 사실을 알리고 쓰지 않음(rc 1)", async () => {
    if (process.platform === "win32" || process.getuid?.() === 0) return;
    const dir = await tmpDir();
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.writeFile(utilsFile(dir), "// 사용자 utils\n");
    await fs.chmod(utilsFile(dir), 0o000);
    try {
      const r = await runInitCli(dir);
      expect(r.exitCode).toBe(1);
      const all = r.logs.join("\n");
      expect(all).toContain("읽지 못해 비교할 수 없습니다(EACCES)");
      expect(all).not.toContain("utils.ts 생성 완료");
      expect(await fs.pathExists(path.join(dir, "axis.config.json"))).toBe(false);
    } finally {
      await fs.chmod(utilsFile(dir), 0o644);
    }
    expect(await fs.readFile(utilsFile(dir), "utf8")).toBe("// 사용자 utils\n");
  });

  it("ENOENT 가 아닌 정보 오류(ENOTDIR: 상위 경로가 파일)는 rc 1, 「생성 완료」 없음", async () => {
    const dir = await tmpDir();
    await fs.ensureDir(path.join(dir, "src"));
    await fs.writeFile(path.join(dir, "src/components"), "파일\n");
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(1);
    const all = r.logs.join("\n");
    expect(all).toContain("ENOTDIR");
    expect(all).not.toContain("utils.ts 생성 완료");
  });

  it("양성 대조: 없는 utils.ts(ENOENT)는 「생성 완료」", async () => {
    const dir = await tmpDir();
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ utils.ts 생성 완료");
  });
});

describe("axis init: 하드링크로 이어진 파일은 덮어쓰지 않음(WI-0045 D19)", () => {
  const utilsFile = (dir: string) => path.join(dir, INIT_DEFAULTS_NO_SRC.componentsDir, "utils.ts");

  it("다른 내용의 utils.ts 가 하드링크면 아무것도 쓰지 않고 경로 · 이유를 알린 뒤 rc 1", async () => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    const other = path.join(dir, "other-utils.ts");
    await fs.writeFile(other, "// 사용자 utils\n");
    await fs.link(other, utilsFile(dir));
    const before = await snapshot(dir);
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(1);
    const all = r.logs.join("\n");
    // src 없는 임시 디렉터리라 utils 는 components/ui 아래(WI-0049 D6)
    expect(all).toContain("components/ui/utils.ts 이 다른 경로와 하드링크로 이어진 파일이라");
    expect(all).not.toContain("src/components/ui/utils.ts");
    expect(all).toContain("아무것도 쓰지 않았습니다");
    expect(await snapshot(dir)).toEqual(before);
    expect(await fs.readFile(other, "utf8")).toBe("// 사용자 utils\n");
  });

  it("같은 내용의 하드링크는 쓰지 않으므로 영향 없음(유지, rc 0)", async () => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    const other = path.join(dir, "other-utils.ts");
    await fs.writeFile(other, UTILS_TS_CONTENT);
    await fs.link(other, utilsFile(dir));
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs).toContain("✓ utils.ts 유지(이미 같은 내용)");
  });

  it("다른 내용의 axis.config.json 이 하드링크면 아무것도 쓰지 않고 rc 1", async () => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    const other = path.join(dir, "config-copy.json");
    await fs.writeJSON(other, { componentsDir: "./x" });
    await fs.link(other, path.join(dir, "axis.config.json"));
    const before = await snapshot(dir);
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(1);
    expect(r.logs.join("\n")).toContain("axis.config.json 이 다른 경로와 하드링크로 이어진 파일이라");
    expect(await snapshot(dir)).toEqual(before);
  });

  it("양성 대조: 하드링크가 아닌 다른 내용의 config 는 「갱신」", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./x" });
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(r.logs.some((l) => l.startsWith("✓ axis.config.json 갱신"))).toBe(true);
  });
});

describe("axis init: 종전 기본 registry 를 새 기본값으로 갱신(WI-0045 D20)", () => {
  it.each(["https://axis.minu.best/r", "https://axis.minu.best/r/", "HTTPS://AXIS.MINU.BEST:443/r//", " https://axis.minu.best/r "])(
    "기존 registry %j 는 새 기본값으로 바꿔 쓰고 알림",
    async (legacy) => {
      const dir = await tmpDir();
      await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: INIT_DEFAULTS.componentsDir, registry: legacy });
      const r = await runInitCli(dir);
      expect(r.exitCode).toBe(0);
      expect((await fs.readJSON(path.join(dir, "axis.config.json"))).registry).toBe(REGISTRY);
      expect(r.logs).toContain(UPDATED("registry 를 새 기본 주소로 갱신"));
      expect(r.logs.some((l) => l.includes(`registry 를 새 기본 주소(${REGISTRY})로 갱신했습니다(종전 axis.minu.best:`))).toBe(true);
      // 다시 실행하면 같은 내용이라 「유지」
      const r2 = await runInitCli(dir);
      expect(r2.logs).toContain("✓ axis.config.json 유지(이미 같은 내용)");
    }
  );

  it.each(["https://axis.minu.best/rx", "https://mirror.example/r", "http://axis.minu.best/r"])(
    "사용자가 지정한 다른 값 %j 는 그대로 둠(m5 · D7)",
    async (custom) => {
      const dir = await tmpDir();
      await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./x", registry: custom });
      const r = await runInitCli(dir);
      expect(r.exitCode).toBe(0);
      expect((await fs.readJSON(path.join(dir, "axis.config.json"))).registry).toBe(custom);
      expect(r.logs).toContain(UPDATED("registry 는 기존 값 유지"));
      expect(r.logs.some((l) => l.includes("새 기본 주소"))).toBe(false);
    }
  );
});

describe("axis init: 링크 대상이 일반 파일이 아님(WI-0045 D17)", () => {
  const utilsFile = (dir: string) => path.join(dir, INIT_DEFAULTS_NO_SRC.componentsDir, "utils.ts");

  it("문자 장치(/dev/null)를 가리키는 링크는 읽기 전에 「일반 파일이 아님」으로 거부(판정 단계)", async () => {
    if (process.platform === "win32" || !(await fs.pathExists("/dev/null"))) return;
    const dir = await tmpDir();
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.symlink("/dev/null", utilsFile(dir));
    const plan = planUtilsWrite(dir, utilsFile(dir));
    expect(plan.action).toBe("reject");
    // 가드가 빠지면 /dev/null 을 읽어 빈 내용으로 비교하고 「심볼릭 링크라 덮어쓸 수 없습니다」로 갈립니다
    expect(plan.action === "reject" && plan.reason).toContain("일반 파일이 아닙니다");
  });

  it("문자 장치를 가리키는 링크면 init 은 아무것도 쓰지 않고 rc 1", async () => {
    if (process.platform === "win32" || !(await fs.pathExists("/dev/null"))) return;
    const dir = await tmpDir();
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.symlink("/dev/null", utilsFile(dir));
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(1);
    expect(r.logs.join("\n")).toContain("일반 파일이 아닙니다");
    expect(await fs.pathExists(path.join(dir, "axis.config.json"))).toBe(false);
    expect((await fs.lstat(utilsFile(dir))).isSymbolicLink()).toBe(true);
  });

  it("양성 대조: 일반 파일을 가리키는 링크는 같은 판정에서 일반 파일 거부가 나오지 않음", async () => {
    if (process.platform === "win32") return;
    const dir = await tmpDir();
    await fs.ensureDir(path.join(dir, "shared"));
    await fs.writeFile(path.join(dir, "shared/utils.ts"), UTILS_TS_CONTENT);
    await fs.ensureDir(path.dirname(utilsFile(dir)));
    await fs.symlink(path.join(dir, "shared/utils.ts"), utilsFile(dir));
    expect(planUtilsWrite(dir, utilsFile(dir))).toEqual({ action: "keep", link: { outside: null } });
  });
});

describe("axis init: utils.ts 쓰기 실패 때 config 안내는 사실대로", () => {
  const utilsFile = (dir: string) => path.join(dir, INIT_DEFAULTS_NO_SRC.componentsDir, "utils.ts");
  const configPath = (dir: string) => path.join(dir, "axis.config.json");

  /** utils.ts 를 만들 수 없게(디렉터리 쓰기 불가) 둡니다 */
  async function readonlyComponentsDir(dir: string): Promise<string> {
    const ui = path.dirname(utilsFile(dir));
    await fs.ensureDir(ui);
    await fs.chmod(ui, 0o555);
    return ui;
  }

  it("config 가 이미 같은 내용(유지)이면 「이미 썼습니다」 류 문구 없이 「바꾸지 않았습니다」, 새 파일은 「만들지 못했습니다」", async () => {
    if (process.platform === "win32" || process.getuid?.() === 0) return;
    const dir = await tmpDir();
    const first = await runInitCli(dir);
    expect(first.exitCode).toBe(0);
    await fs.remove(utilsFile(dir));
    const ui = await readonlyComponentsDir(dir);
    const before = await fs.readFile(configPath(dir), "utf8");
    try {
      const r = await runInitCli(dir);
      expect(r.exitCode).toBe(1);
      const all = r.logs.join("\n");
      expect(all).toContain("✓ axis.config.json 유지(이미 같은 내용)");
      expect(all).toContain("axis.config.json 은 바꾸지 않았습니다(이미 같은 내용).");
      expect(all).not.toContain("이미 썼습니다");
      expect(all).not.toContain("이미 만들었습니다");
      expect(all).toContain("✗ utils.ts 를 만들지 못했습니다");
      expect(all).not.toContain("덮어쓰지 않았습니다");
    } finally {
      await fs.chmod(ui, 0o755);
    }
    expect(await fs.readFile(configPath(dir), "utf8")).toBe(before);
  });

  it("대조: config 를 새로 만든 실행이면 「이미 만들었습니다」로 알림(부분 쓰기 사실)", async () => {
    if (process.platform === "win32" || process.getuid?.() === 0) return;
    const dir = await tmpDir();
    const ui = await readonlyComponentsDir(dir);
    try {
      const r = await runInitCli(dir);
      expect(r.exitCode).toBe(1);
      const all = r.logs.join("\n");
      expect(all).toContain("axis.config.json 은 이미 만들었습니다.");
      expect(all).not.toContain("바꾸지 않았습니다");
    } finally {
      await fs.chmod(ui, 0o755);
    }
    expect(await fs.pathExists(configPath(dir))).toBe(true);
  });
});

describe("WI-0049 D6: 경로 기본값을 실재 파일 · src 유무로 정함", () => {
  it("src 없는 Tailwind 3 프로젝트(app/globals.css · tailwind.config.js): 찾은 경로를 기록, src/ 를 만들지 않음, 안내 없음", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.17" } }));
    await fs.outputFile(path.join(dir, "app/globals.css"), "@tailwind base;\n");
    await fs.writeFile(path.join(dir, "tailwind.config.js"), "module.exports = {};\n");
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(config).toMatchObject({
      componentsDir: "./components/ui",
      tailwindConfig: "./tailwind.config.js",
      globalCss: "./app/globals.css",
    });
    expect(await fs.pathExists(path.join(dir, "src"))).toBe(false);
    expect(await fs.pathExists(path.join(dir, "components/ui/utils.ts"))).toBe(true);
    expect(r.logs.some((l) => l.includes("찾지 못해"))).toBe(false);
  });

  it("음성 대조: src/ 가 있으면 종전 기본값(./src/components/ui · ./src/app/globals.css)", async () => {
    const dir = await tmpDir();
    await fs.ensureDir(path.join(dir, "src"));
    const { answers } = await resolveInitAnswers(dir);
    expect(answers).toEqual({ ...INIT_DEFAULTS });
  });

  it("후보 순서: app/globals.css → src/app/globals.css → styles/globals.css → src/styles/globals.css → globals.css", async () => {
    const order = ["app/globals.css", "src/app/globals.css", "styles/globals.css", "src/styles/globals.css", "globals.css"];
    for (let i = 0; i < order.length; i++) {
      const dir = await tmpDir();
      for (const f of order.slice(i)) await fs.outputFile(path.join(dir, f), "");
      expect({ i, css: (await resolveInitAnswers(dir, false)).answers.globalCss }).toEqual({ i, css: `./${order[i]}` });
    }
  });

  it("Tailwind 4 이면 tailwindConfig 를 정하지 않고 그 안내도 없음", async () => {
    const dir = await tmpDir();
    const { answers, notes } = await resolveInitAnswers(dir, true);
    expect(answers.tailwindConfig).toBeUndefined();
    expect(notes).toEqual([NOTE_CSS_DEFAULT]);
  });
});

describe("WI-0041 D4 · D5: 재실행은 기존 키를 병합하고 값을 보존", () => {
  it("기존 componentsDir 는 디렉터리가 없어도 보존, 실재하는 globalCss · tailwindConfig 는 보존", async () => {
    const dir = await tmpDir();
    await fs.outputFile(path.join(dir, "styles/main.css"), "");
    await fs.writeFile(path.join(dir, "tw.config.ts"), "");
    await fs.writeJSON(path.join(dir, "axis.config.json"), {
      componentsDir: "./ui",
      globalCss: "./styles/main.css",
      tailwindConfig: "./tw.config.ts",
    });
    const r = await runInitCli(dir);
    expect(r.exitCode).toBe(0);
    expect(await fs.readJSON(path.join(dir, "axis.config.json"))).toMatchObject({
      componentsDir: "./ui",
      globalCss: "./styles/main.css",
      tailwindConfig: "./tw.config.ts",
    });
    expect(r.logs.some((l) => l.startsWith("!") && (l.includes("globalCss") || l.includes("tailwindConfig")))).toBe(false);
  });

  it("실재하지 않는 globalCss 는 찾은 파일로 바꾸고 알림(cli 1.5.4 템플릿 config ./globals.css 사례)", async () => {
    const dir = await tmpDir();
    await fs.outputFile(path.join(dir, "app/globals.css"), "");
    await fs.writeJSON(path.join(dir, "axis.config.json"), { template: "theme-only", componentsDir: "./components/ui", globalCss: "./globals.css" });
    const r = await runInitCli(dir);
    expect(r.logs).toContain("! 기존 globalCss(./globals.css)가 없어 찾은 파일 ./app/globals.css 로 바꿉니다.");
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect(config.globalCss).toBe("./app/globals.css");
    expect(config.template).toBe("theme-only");
  });

  it("실재하지 않는데 찾은 파일도 없으면 기존 값을 그대로 두고 알림(재실행 때 값이 오가지 않음)", async () => {
    const dir = await tmpDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./src/components/ui", globalCss: "./src/app/globals.css" });
    const r1 = await runInitCli(dir);
    const after1 = await fs.readFile(path.join(dir, "axis.config.json"), "utf8");
    expect(JSON.parse(after1).globalCss).toBe("./src/app/globals.css");
    expect(r1.logs.some((l) => l.includes("기존 globalCss(./src/app/globals.css) 파일이 없고"))).toBe(true);
    const r2 = await runInitCli(dir);
    expect(r2.logs).toContain("✓ axis.config.json 유지(이미 같은 내용)");
    expect(await fs.readFile(path.join(dir, "axis.config.json"), "utf8")).toBe(after1);
  });

  it("mergeInitConfig: 기존 키 순서 유지 · init 이 다루지 않는 키 보존 · 없던 init 키는 앞 키 다음 · next 에 없는 init 키는 지움", () => {
    const { merged, removed } = mergeInitConfig(
      { brand: "ontology", componentsDir: "./a", tailwindConfig: "./t.ts", monetDir: "m" },
      { $schema: "s", componentsDir: "./b", globalCss: "./g.css", registry: "r" }
    );
    expect(Object.entries(merged)).toEqual([
      ["$schema", "s"],
      ["brand", "ontology"],
      ["componentsDir", "./b"],
      ["globalCss", "./g.css"],
      ["registry", "r"],
      ["monetDir", "m"],
    ]);
    expect(removed).toEqual(["tailwindConfig"]);
  });

  it("Tailwind 4 로 바뀐 프로젝트에서 재실행하면 tailwindConfig 를 지우고 알림, brand 는 남김", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^4.1.0" } }));
    await fs.writeJSON(path.join(dir, "axis.config.json"), { componentsDir: "./components/ui", tailwindConfig: "./tailwind.config.ts", brand: "ontology" });
    const r = await runInitCli(dir);
    expect(r.logs).toContain("  지운 키: tailwindConfig (Tailwind 4 이상은 설정 파일을 쓰지 않습니다)");
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect("tailwindConfig" in config).toBe(false);
    expect(config.brand).toBe("ontology");
  });

  it("기존 파일의 들여쓰기(4칸)를 따름", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "axis.config.json"), JSON.stringify({ componentsDir: "./x", brand: "b" }, null, 4) + "\n");
    await runInitCli(dir);
    const text = await fs.readFile(path.join(dir, "axis.config.json"), "utf8");
    expect(text).toContain('\n    "componentsDir": "./x"');
  });
});

describe("WI-0065 D8: init 애니메이션 플러그인 안내", () => {
  it("Tailwind 4 는 tw-animate-css import 를 안내, lockfile 을 따름", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package-lock.json"), "");
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^4" } }));
    const r = await runInitCli(dir);
    expect(r.logs).toContain(
      '  애니메이션: Dialog · Select 등의 열고 닫는 애니메이션(animate-in 류)은 플러그인이 필요합니다. npm install tw-animate-css 뒤 전역 CSS 에 @import "tw-animate-css"; 를 넣으세요.'
    );
  });

  it("음성 대조: 플러그인이 이미 선언돼 있으면 안내 없음", async () => {
    const dir = await tmpDir();
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.0", "tailwindcss-animate": "^1.0.7" } })
    );
    const r = await runInitCli(dir);
    expect(r.logs.some((l) => l.includes("애니메이션:"))).toBe(false);
  });
});

describe("WI-0075 D1: -y 없는 init 을 비대화형으로 부르면 기본값으로 진행", () => {
  /** `axis init`(-y 없음)을 판정을 주입해 실행합니다 */
  async function runInitNoYes(dir: string, interactive: boolean): Promise<number> {
    const program = new Command();
    program.exitOverride();
    registerInitCommand(program, REGISTRY, { isInteractive: () => interactive });
    process.chdir(dir);
    try {
      await program.parseAsync(["init"], { from: "user" });
    } finally {
      process.chdir(cwd0);
    }
    const exitCode = typeof process.exitCode === "number" ? process.exitCode : 0;
    process.exitCode = undefined;
    return exitCode;
  }
  const NOTE = "비대화형 실행이라 기본값으로 진행합니다(-y 와 같음): ";

  it("Tailwind 3: init -y 와 같은 파일을 만들고 쓴 값 3개를 1줄로 알림, rc 0", async () => {
    const pkg = JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.0" } });
    const a = await tmpDir();
    const b = await tmpDir();
    await fs.writeFile(path.join(a, "package.json"), pkg);
    await fs.writeFile(path.join(b, "package.json"), pkg);
    expect(await runInitNoYes(a, false)).toBe(0);
    const noteLines = logs.filter((l) => l.startsWith(NOTE));
    expect(noteLines).toEqual([
      `${NOTE}componentsDir=./components/ui, tailwindConfig=./tailwind.config.ts, globalCss=./app/globals.css`,
    ]);
    await runInitCli(b);
    // 계측 대조: 비교 대상이 실제로 만들어졌는지(파일 3개)
    expect(Object.keys(await snapshot(a)).sort()).toEqual(["axis.config.json", path.join("components", "ui", "utils.ts"), "package.json"]);
    expect(await snapshot(a)).toEqual(await snapshot(b));
  });

  it("Tailwind 4: tailwindConfig 는 알리지 않음(묻지도 기록하지도 않는 값)", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^4" } }));
    expect(await runInitNoYes(dir, false)).toBe(0);
    expect(logs.filter((l) => l.startsWith(NOTE))).toEqual([`${NOTE}componentsDir=./components/ui, globalCss=./app/globals.css`]);
    expect(await fs.pathExists(path.join(dir, "axis.config.json"))).toBe(true);
  });

  it("-y 는 알림 없이 종전과 같음", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x" }));
    await runInitCli(dir);
    expect(logs.some((l) => l.startsWith(NOTE))).toBe(false);
  });

  it("내용이 다른 기존 utils.ts 는 덮어쓰지 않고 rc 1 과 -y 안내, 아무것도 쓰지 않음(덮어쓰기 확인 갈래)", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.0" } }));
    await fs.ensureDir(path.join(dir, "components", "ui"));
    await fs.writeFile(path.join(dir, "components", "ui", "utils.ts"), "export const mine = 2\n");
    const before = await snapshot(dir);
    expect(await runInitNoYes(dir, false)).toBe(1);
    // 계측 대조: 비교 대상이 실제로 있는지(파일 2개)
    expect(Object.keys(before).sort()).toEqual([path.join("components", "ui", "utils.ts"), "package.json"]);
    expect(await snapshot(dir)).toEqual(before);
    const all = logs.join("\n");
    expect(all).toContain("비대화형 실행이라 내용이 다른 기존 components/ui/utils.ts 를 덮어쓰지 않습니다");
    expect(all).toContain("-y");
    expect(all).not.toContain("덮어씀");
  });

  it("양성 대조: 같은 경우 -y 를 주면 종전처럼 덮어씀(rc 0)", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.0" } }));
    await fs.ensureDir(path.join(dir, "components", "ui"));
    await fs.writeFile(path.join(dir, "components", "ui", "utils.ts"), "export const mine = 2\n");
    const r = await runInitCli(dir);
    expect(r.logs).toContain("✓ utils.ts 덮어씀(기존 내용과 달라 init 의 utils 로 다시 씀)");
    expect(await fs.readFile(path.join(dir, "components", "ui", "utils.ts"), "utf8")).toBe(UTILS_TS_CONTENT);
  });

  it("음성 대조: 기존 utils.ts 가 같은 내용이면 비대화형도 그대로 진행(rc 0)", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.0" } }));
    await fs.ensureDir(path.join(dir, "components", "ui"));
    await fs.writeFile(path.join(dir, "components", "ui", "utils.ts"), UTILS_TS_CONTENT);
    expect(await runInitNoYes(dir, false)).toBe(0);
    expect(logs).toContain("✓ utils.ts 유지(이미 같은 내용)");
    expect(await fs.pathExists(path.join(dir, "axis.config.json"))).toBe(true);
  });

  it("양성 대조: 대화형으로 주입하면 묻고 받은 값으로 기록(기본값과 다른 값)", async () => {
    const dir = await tmpDir();
    await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "x", devDependencies: { tailwindcss: "^3.4.0" } }));
    prompts.inject(["./src/ui", "./tailwind.config.js", "./styles/globals.css"]);
    expect(await runInitNoYes(dir, true)).toBe(0);
    expect(logs.some((l) => l.startsWith(NOTE))).toBe(false);
    const config = await fs.readJSON(path.join(dir, "axis.config.json"));
    expect([config.componentsDir, config.tailwindConfig, config.globalCss]).toEqual(["./src/ui", "./tailwind.config.js", "./styles/globals.css"]);
  });
});

// WI-0086: init 의 utils 의존성(clsx · tailwind-merge) 판정이 워크스페이스 루트 선언도 「이미 있음」으로 봄(declaredDependency, axis check 의
// dependencies 항목과 같은 경계). 쓰기는 앱 package.json 에만 하고 루트 선언을 앱으로 옮기지 않아요. 브리프 측정: 발행본 cli 1.7.1 은
// npm · pnpm · pnpm hoisted 3/3 에서 루트 선언 clsx · tailwind-merge 를 앱에 다시 써 넣음(diff 3줄).
describe("WI-0086: init 은 워크스페이스 루트에 선언된 utils 의존성을 앱에 다시 쓰지 않음", () => {
  /** 루트(workspaces · lockfile · devDependencies) 아래 apps/web(package.json 원문)을 만들고 앱 경로를 돌려줍니다 */
  async function wsApp(rootDeps: Record<string, string>, appPkgText: string, opts: { workspaces?: boolean; lock?: string } = {}): Promise<string> {
    const root = await tmpDir();
    const workspaces = opts.workspaces === false ? {} : { workspaces: ["apps/*"] };
    await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, ...workspaces, devDependencies: rootDeps });
    await fs.writeFile(path.join(root, opts.lock ?? "package-lock.json"), "{}");
    const app = path.join(root, "apps", "web");
    await fs.ensureDir(app);
    await fs.writeFile(path.join(app, "package.json"), appPkgText);
    return app;
  }
  const APP_TEXT = '{\n  "name": "web",\n  "dependencies": {\n    "@axis-ds/tokens": "^1.8.0"\n  }\n}\n';
  const ROOT_UTILS = { tailwindcss: "^3.4.0", clsx: "^2.1.1", "tailwind-merge": "^2.6.0" };

  for (const lock of ["package-lock.json", "pnpm-lock.yaml"]) {
    it(`루트(${lock})에 clsx · tailwind-merge 선언 → 앱 package.json 바이트 불변, 출처 표시(종전: 앱 dependencies 에 추가)`, async () => {
      const app = await wsApp(ROOT_UTILS, APP_TEXT, { lock });
      const r = await runInitCli(app);
      expect(await fs.readFile(path.join(app, "package.json"), "utf8")).toBe(APP_TEXT);
      expect(r.logs).toContain(
        "✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): clsx (^2.1.1), tailwind-merge (^2.6.0) (워크스페이스 루트에 선언: clsx, tailwind-merge)"
      );
      const plan = planUtilsDependencies(app);
      expect({ action: plan.action, write: plan.write, present: plan.present }).toEqual({
        action: "present",
        write: undefined,
        present: [
          { name: "clsx", range: "^2.1.1", source: "root" },
          { name: "tailwind-merge", range: "^2.6.0", source: "root" },
        ],
      });
    });
  }

  it("루트 Tailwind 4 미설치(tailwindcss ^4.1.0 · tailwind-merge ^3.0.0): 범위 기준이 루트 선언 Tailwind 4, 앱에 ^2.6.0 을 쓰지 않음", async () => {
    const app = await wsApp({ tailwindcss: "^4.1.0", clsx: "^2.1.1", "tailwind-merge": "^3.0.0" }, APP_TEXT);
    const plan = planUtilsDependencies(app);
    expect(plan.tailwind).toEqual({ major: 4, source: "declared", value: "^4.1.0" });
    expect(plan.ranges["tailwind-merge"]).toBe("^3.4.0");
    expect(plan.action).toBe("present");
    await runInitCli(app);
    expect(await fs.readFile(path.join(app, "package.json"), "utf8")).toBe(APP_TEXT);
  });

  it("루트에 clsx 만 있으면 tailwind-merge 만 앱에 추가하고 clsx 는 출처 표시", async () => {
    const app = await wsApp({ tailwindcss: "^3.4.0", clsx: "^2.1.1" }, APP_TEXT);
    const r = await runInitCli(app);
    expect(JSON.parse(await fs.readFile(path.join(app, "package.json"), "utf8")).dependencies).toEqual({
      "@axis-ds/tokens": "^1.8.0",
      "tailwind-merge": "^2.6.0",
    });
    expect(r.logs).toContain("  이미 있음(버전 유지): clsx (^2.1.1) (워크스페이스 루트에 선언: clsx)");
  });

  // 검토 지적(minor): 루트에 tailwindcss ^4 만 있고 tailwind-merge 는 없으면 앱에 쓰는 범위가 Tailwind 4 기준으로 바뀜(종전 ^2.6.0)
  it("루트에 tailwindcss ^4.1.0 만 선언(미설치): 앱에 쓰는 tailwind-merge 가 ^3.4.0(종전 Tailwind 3 판정의 ^2.6.0)", async () => {
    const app = await wsApp({ tailwindcss: "^4.1.0" }, APP_TEXT);
    await runInitCli(app);
    expect(JSON.parse(await fs.readFile(path.join(app, "package.json"), "utf8")).dependencies).toEqual({
      "@axis-ds/tokens": "^1.8.0",
      clsx: "^2.1.1",
      "tailwind-merge": "^3.4.0",
    });
  });

  // 검토 지적(minor): Tailwind 4 안내의 「@axis-ds/tokens 설치:」 · 컴포넌트 tailwind.css 줄도 루트 선언을 봄(init 이 루트 선언으로 Tailwind 4 를
  // 판정한 뒤 루트에 이미 있는 tokens 를 더 낮은 범위로 앱에 설치하라고 안내하던 줄, 배포본에는 없던 줄)
  it("Tailwind 4 안내: 루트에 tokens · ui-react 선언이면 tokens 설치 줄 없음 · ui-react tailwind.css 줄 있음, 음성 대조는 종전", async () => {
    const NAME_ONLY = '{\n  "name": "web"\n}\n';
    const ROOT4 = { tailwindcss: "^4.1.0", "@axis-ds/tokens": "^1.8.1", "@axis-ds/ui-react": "^1.8.1" };
    const TOKENS_LINE = '  @axis-ds/tokens 설치: npm install "@axis-ds/tokens@^1.4.0"';
    const UI_LINE = '  @import "@axis-ds/ui-react/tailwind.css";';
    const ws = await wsApp(ROOT4, NAME_ONLY);
    const lines = tailwind4GuideLines({ name: "web" }, "npm install", "./g.css", ws);
    expect(lines).not.toContain(TOKENS_LINE);
    expect(lines).toContain(UI_LINE);
    const r = await runInitCli(ws);
    expect(r.logs.some((l) => l.includes("@axis-ds/tokens 설치:"))).toBe(false);
    // 루트에 없는 utils 의존성만 앱에 추가하고 tokens 는 앱에 쓰지 않음
    expect(JSON.parse(await fs.readFile(path.join(ws, "package.json"), "utf8")).dependencies).toEqual({ clsx: "^2.1.1", "tailwind-merge": "^3.4.0" });
    // 음성 대조: 워크스페이스가 아닌 상위의 선언 · baseDir 를 주지 않은 호출은 종전처럼 앱 선언만 봄
    const outside = await wsApp(ROOT4, NAME_ONLY, { workspaces: false });
    const outsideLines = tailwind4GuideLines({ name: "web" }, "npm install", "./g.css", outside);
    expect(outsideLines).toContain(TOKENS_LINE);
    expect(outsideLines).not.toContain(UI_LINE);
    const noBase = tailwind4GuideLines({ name: "web" }, "npm install", "./g.css");
    expect(noBase).toContain(TOKENS_LINE);
    expect(noBase).not.toContain(UI_LINE);
  });

  it("음성 대조: 앱 선언이면 종전 문구, 워크스페이스가 아닌 상위 · 어디에도 없으면 종전처럼 앱에 추가", async () => {
    const appDecl = await wsApp(ROOT_UTILS, '{\n  "name": "web",\n  "dependencies": { "clsx": "^2.0.0", "tailwind-merge": "^2.5.0" }\n}\n');
    expect((await runInitCli(appDecl)).logs).toContain("✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): clsx (^2.0.0), tailwind-merge (^2.5.0)");
    for (const app of [await wsApp(ROOT_UTILS, APP_TEXT, { workspaces: false }), await wsApp({}, APP_TEXT)]) {
      await runInitCli(app);
      expect(JSON.parse(await fs.readFile(path.join(app, "package.json"), "utf8")).dependencies).toEqual({
        "@axis-ds/tokens": "^1.8.0",
        clsx: "^2.1.1",
        "tailwind-merge": "^2.6.0",
      });
    }
  });
});
