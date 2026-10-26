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
