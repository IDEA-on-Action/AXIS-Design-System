import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { Command } from "commander";
import fs from "fs-extra";
import { registerThemeCommand, TOKENS_INSTALL_COMMAND } from "./index.js";
import { makeProject, type TokensFixture } from "./test-helpers.js";

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

async function project(tokens: TokensFixture): Promise<string> {
  const dir = await makeProject({ tokens });
  created.push(dir);
  return dir;
}

/** 실제 명령 등록 경로로 `axis theme ...` 을 실행하고 출력과 종료 코드를 돌려줍니다. */
async function runTheme(args: string[]): Promise<{ out: string; exitCode: number }> {
  const program = new Command();
  program.exitOverride();
  registerThemeCommand(program);
  await program.parseAsync(["theme", ...args], { from: "user" });
  const exitCode = typeof process.exitCode === "number" ? process.exitCode : 0;
  process.exitCode = undefined;
  return { out: logs.join("\n"), exitCode };
}

describe("부분 빌드(brand.json 없음)", () => {
  it("list · info 모두 빌드 전 안내와 rc 1, 스택 트레이스 없음", async () => {
    const dir = await project("1.3");
    await fs.remove(`${dir}/node_modules/@axis-ds/tokens/dist/brands/sample/brand.json`);
    for (const args of [["list", "-d", dir], ["info", "sample", "-d", dir]]) {
      logs = [];
      const { out, exitCode } = await runTheme(args);
      expect(exitCode).toBe(1);
      expect(out).toContain("빌드 산출물이 없어 브랜드를 읽을 수 없습니다");
      expect(out).not.toContain("MODULE_NOT_FOUND");
    }
  });
});

describe("axis theme list", () => {
  it("T2-4: 이름 · 설명 · 테마, rc 0", async () => {
    const dir = await project("1.3");
    const { out, exitCode } = await runTheme(["list", "-d", dir]);
    expect(exitCode).toBe(0);
    expect(out).toContain("sample");
    expect(out).toContain("브랜드 빌드 · 검증 테스트용 fixture 브랜드");
    expect(out).toContain("(light · dark)");
    expect(out).toContain("@axis-ds/tokens 1.3.0");
    // a11y 상태는 list 에서 내지 않음(plan 6.2-5)
    expect(out).not.toContain("unchecked");
  });

  const guides: [TokensFixture, string, string][] = [
    ["none", "설치돼 있지 않아", `설치: ${TOKENS_INSTALL_COMMAND}`],
    ["1.2", "1.2.1 은 브랜드를 지원하지 않습니다", `업그레이드: ${TOKENS_INSTALL_COMMAND}`],
    ["1.3-unbuilt", "빌드 산출물이 없어", "pnpm --filter @axis-ds/tokens build"],
  ];

  it("WI-0065 D7: 설치 안내는 lockfile 을 따름(npm 프로젝트에 pnpm 명령을 내지 않음), lockfile 이 없으면 종전 pnpm", async () => {
    const dir = await project("none");
    await fs.writeFile(`${dir}/package-lock.json`, "");
    const { out } = await runTheme(["list", "-d", dir]);
    expect(out).toContain('설치: npm install "@axis-ds/tokens@^1.6.0"');
    expect(out).not.toContain("pnpm add");
    expect(TOKENS_INSTALL_COMMAND).toBe('pnpm add "@axis-ds/tokens@^1.6.0"');
  });

  it("WI-0085: 빌드 전 안내의 워크스페이스 빌드 명령도 같은 매니저(npm · yarn · packageManager), 없으면 종전 pnpm --filter", async () => {
    const cases: [Record<string, string>, Record<string, unknown> | undefined, string[]][] = [
      [{ "package-lock.json": "" }, undefined, ["npm run build -w @axis-ds/tokens", 'npm install "@axis-ds/tokens@^1.6.0"']],
      [{ "yarn.lock": "" }, undefined, ["yarn workspace @axis-ds/tokens build", 'yarn add "@axis-ds/tokens@^1.6.0"']],
      [{}, { packageManager: "npm@10.9.0" }, ["npm run build -w @axis-ds/tokens", 'npm install "@axis-ds/tokens@^1.6.0"']],
      [{}, undefined, ["pnpm --filter @axis-ds/tokens build", 'pnpm add "@axis-ds/tokens@^1.6.0"']],
    ];
    for (const [files, pkgExtra, [build, reinstall]] of cases) {
      const dir = await project("1.3-unbuilt");
      for (const [name, content] of Object.entries(files)) await fs.writeFile(`${dir}/${name}`, content);
      if (pkgExtra) await fs.writeJSON(`${dir}/package.json`, { name: "empty", private: true, ...pkgExtra });
      logs = [];
      const { out } = await runTheme(["list", "-d", dir]);
      expect({ files, out: out.includes(`워크스페이스면 ${build}, 아니면 재설치: ${reinstall}`) }).toEqual({ files, out: true });
    }
  });

  for (const [tokens, reason, command] of guides) {
    it(`T2-5: tokens ${tokens} 는 안내와 rc 1, 빈 목록 문구 없음`, async () => {
      const dir = await project(tokens);
      const { out, exitCode } = await runTheme(["list", "-d", dir]);
      expect(exitCode).toBe(1);
      expect(out).toContain(reason);
      expect(out).toContain(command);
      expect(out).not.toContain("브랜드가 없습니다");
      expect(out).not.toContain("AXIS 브랜드 (");
    });
  }
});

describe("axis theme info", () => {
  it("T2-6: import 경로 · 브랜드 켜기 예시(data-brand · setBrand, WI-0065 D7) · 주요 토큰 라이트 · 다크", async () => {
    const dir = await project("1.3");
    const { out, exitCode } = await runTheme(["info", "sample", "-d", dir]);
    expect(exitCode).toBe(0);
    expect(out).toContain('@import "@axis-ds/tokens/css/brands/sample";');
    expect(out).toContain('import { useTheme } from "@axis-ds/theme";');
    expect(out).toContain('<html lang="ko" data-brand="sample">');
    expect(out).not.toContain("defaultBrand");
    expect(out).toContain('<html data-brand="sample">');
    expect(out).toContain("@axis-ds/theme 1.3.0 이상");
    expect(out).toMatch(/--background\s+210 22% 96%\s+217 41% 10%/);
    expect(out).toMatch(/--primary\s+180 81% 43%\s+180 81% 43%/);
    expect(out).toMatch(/--radius\s+12px\s+-/);
    // 브랜드 CSS 에 없는 주요 토큰은 표 대신 「덮어쓰지 않음」 줄로
    expect(out).toContain("브랜드가 덮어쓰지 않음: --primary-foreground, --foreground, --ring, --axis-text-brand");
  });

  it("T2-6: 없는 브랜드는 rc 1 + 설치된 목록", async () => {
    const dir = await project("1.3");
    const { out, exitCode } = await runTheme(["info", "nope", "-d", dir]);
    expect(exitCode).toBe(1);
    expect(out).toContain("브랜드 'nope'");
    expect(out).toContain("설치된 브랜드: sample");
  });

  it("T2-6: 미설치면 설치 안내와 rc 1", async () => {
    const dir = await project("none");
    const { out, exitCode } = await runTheme(["info", "sample", "-d", dir]);
    expect(exitCode).toBe(1);
    expect(out).toContain(TOKENS_INSTALL_COMMAND);
  });

  it("T2-7: 보정 내역은 a11y 메타와 근거 문서 안내만 (U3 (A))", async () => {
    const dir = await project("1.3");
    const { out } = await runTheme(["info", "sample", "-d", dir]);
    const section = out.slice(out.indexOf("보정 내역"));
    expect(section).toContain("a11y 상태: unchecked");
    expect(section).toContain("점검일: -");
    expect(section).toContain("게이트: -");
    expect(section).toContain("근거 문서: WI-0025 PRD 부록 B");
    expect(section).toContain("보정 전 · 후 값은 이 버전에서 출력하지 않습니다.");
  });
});

describe("WI-0093: list · info · add 의 tokens 설치 안내가 선언 출처를 따름(경계는 theme add 와 같은 P1 · P2)", () => {
  // eslint-disable-next-line no-control-regex
  const ANSI = /\u001b\[[0-9;]*m/g;
  const DECL = { "@axis-ds/tokens": "^1.8.0" };

  interface Ws {
    /** 워크스페이스 종류(lockfile 을 루트에 둠). `none` 은 워크스페이스 없이 앱 하나(pnpm-lock.yaml) */
    kind: "pnpm" | "npm" | "yarn" | "none";
    tokens?: TokensFixture;
    rootDeps?: Record<string, string>;
    appDeps?: Record<string, string>;
    appLock?: string;
    pnp?: boolean;
  }

  const LOCK = { pnpm: "pnpm-lock.yaml", npm: "package-lock.json", yarn: "yarn.lock" } as const;

  /** 루트(설치본 · lockfile)와 `apps/web` 앱을 만들고 앱 경로를 돌려줍니다. `kind: "none"` 이면 루트가 곧 앱이에요 */
  async function ws(o: Ws): Promise<string> {
    const root = await project(o.tokens ?? "none");
    if (o.kind === "none") {
      await fs.writeJSON(`${root}/package.json`, { name: "a", private: true, dependencies: o.appDeps ?? {} });
      await fs.writeFile(`${root}/pnpm-lock.yaml`, "");
      if (o.pnp) await fs.writeFile(`${root}/.pnp.cjs`, "");
      return root;
    }
    await fs.writeJSON(`${root}/package.json`, {
      name: "root",
      private: true,
      ...(o.kind !== "pnpm" ? { workspaces: ["apps/*"] } : {}),
      dependencies: o.rootDeps ?? {},
    });
    if (o.kind === "pnpm") await fs.writeFile(`${root}/pnpm-workspace.yaml`, 'packages:\n  - "apps/*"\n');
    await fs.writeFile(`${root}/${LOCK[o.kind]}`, "");
    if (o.pnp) await fs.writeFile(`${root}/.pnp.cjs`, "");
    const app = `${root}/apps/web`;
    await fs.outputJSON(`${app}/package.json`, { name: "web", private: true, dependencies: o.appDeps ?? {} });
    if (o.appLock) await fs.writeFile(`${app}/${o.appLock}`, "");
    await fs.outputJSON(`${app}/axis.config.json`, { globalCss: "./app/globals.css" });
    await fs.outputFile(`${app}/app/globals.css`, "@tailwind base;\n");
    return app;
  }

  async function guideLines(cmd: "list" | "info", dir: string): Promise<{ lines: string[]; exitCode: number }> {
    logs = [];
    const args = cmd === "list" ? ["list", "-d", dir] : ["info", "sample", "-d", dir];
    const { out, exitCode } = await runTheme(args);
    return {
      lines: out
        .replace(ANSI, "")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l !== ""),
      exitCode,
    };
  }

  async function addLines(dir: string): Promise<string[]> {
    logs = [];
    return (await runTheme(["add", "sample", "-d", dir])).out.replace(ANSI, "").split("\n");
  }

  // [이름, 픽스처, 기대 안내 줄(둘째 줄), 그 줄에 없어야 하는 것]
  const notInstalled: [string, Ws, string, string | undefined][] = [
    ["선언 없음 · 단독 앱(종전 add)", { kind: "none" }, 'pnpm add "@axis-ds/tokens@^1.6.0"', undefined],
    ["앱 선언 · 단독 앱", { kind: "none", appDeps: DECL }, "pnpm install", "@axis-ds/tokens@"],
    ["pnpm 워크스페이스 앱 선언", { kind: "pnpm", appDeps: DECL }, "pnpm install", "@axis-ds/tokens@"],
    ["pnpm 워크스페이스 루트 선언", { kind: "pnpm", rootDeps: DECL }, "pnpm install", "@axis-ds/tokens@"],
    ["yarn 워크스페이스 루트 선언", { kind: "yarn", rootDeps: DECL }, "yarn install", "@axis-ds/tokens@"],
    ["npm 워크스페이스 루트 선언(Q15)", { kind: "npm", rootDeps: DECL }, "워크스페이스 루트에서 npm install", "@axis-ds/tokens@"],
    ["npm 워크스페이스 앱 선언", { kind: "npm", appDeps: DECL }, "npm install", "워크스페이스 루트에서"],
    [
      "P2: 루트 선언 + 앱 lockfile(루트 선언 불인정, 종전 add)",
      { kind: "pnpm", rootDeps: DECL, appLock: "package-lock.json" },
      'npm install "@axis-ds/tokens@^1.6.0"',
      undefined,
    ],
    ["P1: PnP 루트 선언만(루트 선언 불인정, 종전 add)", { kind: "yarn", rootDeps: DECL, pnp: true }, 'yarn add "@axis-ds/tokens@^1.6.0"', undefined],
  ];

  for (const [label, fx, expected, absent] of notInstalled) {
    it(`미설치 · ${label}: 「설치: ${expected}」, list · info 같음, rc 1`, async () => {
      const dir = await ws(fx);
      for (const cmd of ["list", "info"] as const) {
        const { lines, exitCode } = await guideLines(cmd, dir);
        expect(exitCode).toBe(1);
        expect({ cmd, lines }).toEqual({
          cmd,
          lines: ["@axis-ds/tokens 가 설치돼 있지 않아 브랜드를 읽을 수 없습니다.", `설치: ${expected}`],
        });
        if (absent) expect(lines[1]).not.toContain(absent);
      }
    });
  }

  it("P1: PnP 에서 앱에 선언이 있으면 설치 명령 대신 판정하지 못했다는 한 줄(Q13), .pnp.cjs 를 치우면 install(양성 대조)", async () => {
    const dir = await ws({ kind: "none", appDeps: DECL, pnp: true });
    for (const cmd of ["list", "info"] as const) {
      const { lines, exitCode } = await guideLines(cmd, dir);
      expect(exitCode).toBe(1);
      expect({ cmd, lines }).toEqual({
        cmd,
        lines: [
          "@axis-ds/tokens ^1.8.0 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.",
        ],
      });
    }
    await fs.remove(`${dir}/.pnp.cjs`);
    expect((await guideLines("list", dir)).lines[1]).toBe("설치: pnpm install");
  });

  it("미지원(1.2.1): 루트 선언은 WI-0087 DEC-8 문구, 앱 선언 · 선언 없음은 종전 추가 명령(범위를 올림, Q16)", async () => {
    const dec8 = "워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.";
    const root = await ws({ kind: "pnpm", tokens: "1.2", rootDeps: { "@axis-ds/tokens": "^1.2.0" } });
    expect((await guideLines("list", root)).lines[1]).toBe(dec8);
    const npmRoot = await ws({ kind: "npm", tokens: "1.2", rootDeps: { "@axis-ds/tokens": "^1.2.0" } });
    expect((await guideLines("info", npmRoot)).lines[1]).toBe(dec8);
    const app = await ws({ kind: "pnpm", tokens: "1.2", appDeps: { "@axis-ds/tokens": "^1.2.0" } });
    expect((await guideLines("list", app)).lines[1]).toBe('업그레이드: pnpm add "@axis-ds/tokens@^1.6.0"');
    const none = await ws({ kind: "pnpm", tokens: "1.2" });
    expect((await guideLines("list", none)).lines[1]).toBe('업그레이드: pnpm add "@axis-ds/tokens@^1.6.0"');
  });

  it("빌드 전: 선언이 있으면 재설치는 install(npm 루트 선언은 루트에서), 선언 없음은 종전 추가 명령(Q16)", async () => {
    const cases: [Ws, string][] = [
      [
        { kind: "pnpm", tokens: "1.3-unbuilt", rootDeps: DECL },
        "워크스페이스면 pnpm --filter @axis-ds/tokens build, 아니면 재설치: pnpm install",
      ],
      [
        { kind: "yarn", tokens: "1.3-unbuilt", appDeps: DECL },
        "워크스페이스면 yarn workspace @axis-ds/tokens build, 아니면 재설치: yarn install",
      ],
      [
        { kind: "npm", tokens: "1.3-unbuilt", rootDeps: DECL },
        "워크스페이스면 npm run build -w @axis-ds/tokens, 아니면 재설치: 워크스페이스 루트에서 npm install",
      ],
      [
        { kind: "pnpm", tokens: "1.3-unbuilt" },
        '워크스페이스면 pnpm --filter @axis-ds/tokens build, 아니면 재설치: pnpm add "@axis-ds/tokens@^1.6.0"',
      ],
    ];
    for (const [fx, expected] of cases) {
      const dir = await ws(fx);
      expect({ fx, line: (await guideLines("list", dir)).lines[1] }).toEqual({ fx, line: expected });
    }
  });

  it("theme add(Q17): 앱 선언 + 미설치는 「설치: <pm> install」, 루트 선언 + 빌드 전은 재설치 안내, 앱 package.json 쓰기 없음", async () => {
    const app = await ws({ kind: "pnpm", appDeps: DECL });
    const before = await fs.readFile(`${app}/package.json`, "utf8");
    let lines = await addLines(app);
    let at = lines.findIndex((l) => l.includes("package.json: @axis-ds/tokens ^1.8.0 가 이미 있어 범위를 바꾸지 않음"));
    expect(at).toBeGreaterThan(-1);
    expect(lines[at + 1]).toBe("    설치: pnpm install");
    expect(await fs.readFile(`${app}/package.json`, "utf8")).toBe(before);

    const unbuilt = await ws({ kind: "pnpm", tokens: "1.3-unbuilt", rootDeps: DECL });
    lines = await addLines(unbuilt);
    at = lines.findIndex((l) => l.includes("가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음"));
    expect(at).toBeGreaterThan(-1);
    expect(lines[at + 1]).toBe("    워크스페이스면 pnpm --filter @axis-ds/tokens build, 아니면 재설치: pnpm install");

    // 음성 대조: 설치본이 있으면(앱 선언 · 루트 선언 모두) 설치 · 재설치 줄 없음
    const installed: Ws[] = [
      { kind: "pnpm", tokens: "1.3", appDeps: DECL },
      { kind: "pnpm", tokens: "1.3", rootDeps: DECL },
    ];
    for (const fx of installed) {
      const out = (await addLines(await ws(fx))).join("\n");
      // ThemeProvider 줄의 「@axis-ds/theme 설치:」는 별개라 tokens 설치 줄(들여쓰기 4칸)만 셉니다
      expect({ fx, install: /^ {4}설치: /m.test(out), rebuild: out.includes("재설치") }).toEqual({ fx, install: false, rebuild: false });
    }
  });

  it("theme add B1: Yarn PnP 앱 선언이면 미설치 · 빌드 전 · 미지원 모두 theme list 와 같은 PnP 한 줄, 설치 · 재설치 · 업그레이드 줄 없음", async () => {
    const PNP = "@axis-ds/tokens ^1.8.0 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.";
    for (const tokens of ["none", "1.3-unbuilt", "1.2"] as const) {
      const dir = await ws({ kind: "yarn", tokens, appDeps: DECL, pnp: true });
      const lines = await addLines(dir);
      const at = lines.findIndex((l) => l.includes("package.json: @axis-ds/tokens ^1.8.0 가 이미 있어 범위를 바꾸지 않음"));
      expect({ tokens, at: at > -1 }).toEqual({ tokens, at: true });
      expect({ tokens, next: lines[at + 1] }).toEqual({ tokens, next: `    ${PNP}` });
      const out = lines.join("\n");
      expect({ tokens, pnpCount: out.split(PNP).length - 1 }).toEqual({ tokens, pnpCount: 1 });
      expect({ tokens, install: /^ {4}설치: /m.test(out), rebuild: out.includes("재설치"), upgrade: out.includes("업그레이드:") }).toEqual({
        tokens,
        install: false,
        rebuild: false,
        upgrade: false,
      });
      // theme list 도 같은 한 줄(B1 통일 대상)
      expect({ tokens, list: (await guideLines("list", dir)).lines }).toEqual({ tokens, list: [PNP] });
    }
    // 양성 대조: .pnp.cjs 를 치우면 종전 갈래(미지원은 업그레이드 줄)
    const plain = await ws({ kind: "yarn", tokens: "1.2", appDeps: DECL });
    expect((await addLines(plain)).join("\n")).toContain('업그레이드: yarn add "@axis-ds/tokens@^1.6.0"');
  });

  it("theme add B2 · B3: 빌드 전 재설치 줄은 선언 출처와 상관없이 나오고 공용 문구를 씀(npm 루트 선언은 「워크스페이스 루트에서 npm install」)", async () => {
    const cases: [string, Ws, string, string][] = [
      [
        "B2 npm 루트 선언 · 빌드 전",
        { kind: "npm", tokens: "1.3-unbuilt", rootDeps: DECL },
        "가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음",
        "    워크스페이스면 npm run build -w @axis-ds/tokens, 아니면 재설치: 워크스페이스 루트에서 npm install",
      ],
      [
        "B3 pnpm 앱 선언 · 빌드 전",
        { kind: "pnpm", tokens: "1.3-unbuilt", appDeps: DECL },
        "가 이미 있어 범위를 바꾸지 않음",
        "    워크스페이스면 pnpm --filter @axis-ds/tokens build, 아니면 재설치: pnpm install",
      ],
      [
        "B3 npm 앱 선언 · 빌드 전(앱 선언이라 앱에서 install)",
        { kind: "npm", tokens: "1.3-unbuilt", appDeps: DECL },
        "가 이미 있어 범위를 바꾸지 않음",
        "    워크스페이스면 npm run build -w @axis-ds/tokens, 아니면 재설치: npm install",
      ],
      // WI-0096: npm 루트 선언 · 미설치의 theme add 설치 줄도 「워크스페이스 루트에서 npm install」(종전 「설치: npm install」, B2 의 잔여였음)
      [
        "npm 루트 선언 · 미설치(WI-0096)",
        { kind: "npm", tokens: "none", rootDeps: DECL },
        "가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음",
        "    설치: 워크스페이스 루트에서 npm install",
      ],
    ];
    for (const [label, fx, anchorText, expected] of cases) {
      const dir = await ws(fx);
      const before = await fs.readFile(`${dir}/package.json`, "utf8");
      const lines = await addLines(dir);
      const at = lines.findIndex((l) => l.includes(anchorText));
      expect({ label, at: at > -1 }).toEqual({ label, at: true });
      expect({ label, next: lines[at + 1] }).toEqual({ label, next: expected });
      expect({ label, same: (await fs.readFile(`${dir}/package.json`, "utf8")) === before }).toEqual({ label, same: true });
    }
  });
});
