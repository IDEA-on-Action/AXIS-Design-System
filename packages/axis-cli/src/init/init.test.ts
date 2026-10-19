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
  planUtilsDependencies,
  UTILS_DEPENDENCIES,
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
const ADDED_BOTH = "✓ package.json dependencies 에 추가: clsx@^2.1.1, tailwind-merge@^3.4.0";
const NO_INSTALL = (cmd: string) => `  설치는 실행하지 않았습니다. 설치: ${cmd}`;
const ADD_CMD = 'pnpm add "clsx@^2.1.1" "tailwind-merge@^3.4.0"';

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
      dependencies: { next: "15.5.28", react: "19.1.0", clsx: "^2.1.1", "tailwind-merge": "^3.4.0" },
    });
    expect(Object.keys(JSON.parse(text))).toEqual(Object.keys(pkg));
    expect(text).toBe(
      JSON.stringify(
        { ...pkg, dependencies: { ...pkg.dependencies, clsx: "^2.1.1", "tailwind-merge": "^3.4.0" } },
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
      '{\n  "name": "x",\n  "dependencies": {\n    "clsx": "^2.1.1",\n    "tailwind-merge": "^3.4.0"\n  }\n}\n'
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
    expect(pkg.dependencies).toEqual({ react: "19", "tailwind-merge": "^3.4.0" });
    expect(pkg.devDependencies).toEqual({ clsx: "~2.0.1" });
    expect(r.logs).toContain("✓ package.json dependencies 에 추가: tailwind-merge@^3.4.0");
    expect(r.logs).toContain("  이미 있음(버전 유지): clsx (~2.0.1)");
  });

  it("범위는 템플릿과 같은 clsx ^2.1.1 · tailwind-merge ^3.4.0 (prd 1.5)", async () => {
    expect(UTILS_DEPENDENCIES).toEqual({ clsx: "^2.1.1", "tailwind-merge": "^3.4.0" });
    const templatesDir = path.resolve(HERE, "../../../../apps/web/templates");
    const names = (await fs.readdir(templatesDir)).filter((n) =>
      fs.existsSync(path.join(templatesDir, n, "files", "package.json"))
    );
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) {
      const pkg = await fs.readJSON(path.join(templatesDir, n, "files", "package.json"));
      expect({ template: n, clsx: pkg.dependencies.clsx, twMerge: pkg.dependencies["tailwind-merge"] }).toEqual({
        template: n,
        clsx: UTILS_DEPENDENCIES.clsx,
        twMerge: UTILS_DEPENDENCIES["tailwind-merge"],
      });
    }
  });
});

describe("axis init: 포맷 보존 · 멱등(AC4)", () => {
  const cases: { name: string; text: string; expected: string }[] = [
    {
      name: "탭 들여쓰기",
      text: '{\n\t"name": "x"\n}\n',
      expected: '{\n\t"name": "x",\n\t"dependencies": {\n\t\t"clsx": "^2.1.1",\n\t\t"tailwind-merge": "^3.4.0"\n\t}\n}\n',
    },
    {
      name: "4칸 들여쓰기",
      text: '{\n    "name": "x"\n}\n',
      expected:
        '{\n    "name": "x",\n    "dependencies": {\n        "clsx": "^2.1.1",\n        "tailwind-merge": "^3.4.0"\n    }\n}\n',
    },
    {
      name: "CRLF",
      text: '{\r\n  "name": "x"\r\n}\r\n',
      expected: '{\r\n  "name": "x",\r\n  "dependencies": {\r\n    "clsx": "^2.1.1",\r\n    "tailwind-merge": "^3.4.0"\r\n  }\r\n}\r\n',
    },
    {
      name: "BOM",
      text: '﻿{\n  "name": "x"\n}\n',
      expected: '﻿{\n  "name": "x",\n  "dependencies": {\n    "clsx": "^2.1.1",\n    "tailwind-merge": "^3.4.0"\n  }\n}\n',
    },
    {
      name: "BOM + CRLF",
      text: '﻿{\r\n  "name": "x"\r\n}\r\n',
      expected:
        '﻿{\r\n  "name": "x",\r\n  "dependencies": {\r\n    "clsx": "^2.1.1",\r\n    "tailwind-merge": "^3.4.0"\r\n  }\r\n}\r\n',
    },
    {
      name: "끝 줄바꿈 없음",
      text: '{\n  "name": "x"\n}',
      expected: '{\n  "name": "x",\n  "dependencies": {\n    "clsx": "^2.1.1",\n    "tailwind-merge": "^3.4.0"\n  }\n}',
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
        "✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): clsx (^2.1.1), tailwind-merge (^3.4.0)"
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
    { lock: "yarn.lock", install: "yarn install", add: 'yarn add "clsx@^2.1.1" "tailwind-merge@^3.4.0"' },
    { lock: "package-lock.json", install: "npm install", add: 'npm install "clsx@^2.1.1" "tailwind-merge@^3.4.0"' },
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
