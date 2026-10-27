import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  handleListBrands,
  handleGetBrand,
  formatListBrandsResult,
  formatGetBrandResult,
  TOKENS_INSTALL_COMMAND,
  tokensInstallCommandFor,
  tokensInstallGuideFor,
} from "./brand.js";

// WI-0028 P5 (T5-2 · T5-4 · T5-5): MCP 브랜드 도구.
// fixture 원본은 CLI 의 `packages/axis-cli/test/fixtures/theme` 를 그대로 씁니다(plan 6.1). 원본에서는
// `dist` 가 `_dist` 이므로 임시 프로젝트의 `node_modules/@axis-ds/tokens` 로 복사하면서 이름을 바꿉니다
// (CLI `test-helpers.ts` 의 `copyTokensPackage` 와 같은 방식).

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(HERE, "../../../axis-cli/test/fixtures/theme");
// AC3 비교 대상: CLI 원본 코어. 정적 import 는 mcp tsconfig 의 rootDir(src) 밖이라 동적 import 로 읽습니다.
const CLI_CORE = path.resolve(HERE, "../../../axis-cli/src/theme/brand-core.ts");

type TokensFixture = "1.3" | "1.3-unbuilt" | "1.2" | "none";

const created: string[] = [];

afterEach(async () => {
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function project(tokens: TokensFixture): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-mcp-brand-"));
  created.push(dir);
  await fs.writeJSON(path.join(dir, "package.json"), { name: "empty", private: true }, { spaces: 2 });
  if (tokens !== "none") {
    const dest = path.join(dir, "node_modules", "@axis-ds", "tokens");
    await fs.copy(path.join(FIXTURES, `tokens-${tokens}`, "pkg"), dest);
    if (await fs.pathExists(path.join(dest, "_dist"))) {
      await fs.move(path.join(dest, "_dist"), path.join(dest, "dist"));
    }
  }
  return dir;
}

interface CliCore {
  listBrands: (baseDir: string) => unknown;
  getBrand: (baseDir: string, name: string) => unknown;
}

async function cliCore(): Promise<CliCore> {
  return (await import(pathToFileURL(CLI_CORE).href)) as CliCore;
}

describe("handleListBrands · handleGetBrand (T5-2)", () => {
  it("fixture 1.3 에서 코어 결과를 그대로 돌려줌", async () => {
    const dir = await project("1.3");
    const list = await handleListBrands({ targetDir: dir });
    expect(list).toEqual({
      status: "ok",
      version: "1.3.0",
      brands: [
        {
          name: "sample",
          description: "브랜드 빌드 · 검증 테스트용 fixture 브랜드",
          themes: ["light", "dark"],
          a11y: { status: "unchecked", checkedAt: null, gate: null },
          importPath: "@axis-ds/tokens/css/brands/sample",
        },
      ],
    });

    const got = await handleGetBrand({ name: "sample", targetDir: dir });
    expect(got.status).toBe("ok");
    expect(got.available).toEqual(["sample"]);
    expect(got.brand?.importPath).toBe("@axis-ds/tokens/css/brands/sample");
    expect(got.brand?.tokens.light["--primary"]).toBe("180 81% 43%");
    expect(got.brand?.tokens.dark["--background"]).toBe("217 41% 10%");
    // WI-0065 D7: defaultBrand 대신 data-brand · setBrand(CLI 와 같은 코어)
    expect(got.brand?.providerExample).toContain('<html lang="ko" data-brand="sample">');
    expect(got.brand?.providerExample).not.toContain("defaultBrand");
  });

  it("없는 브랜드는 brand null 과 설치된 이름 목록, isError 대상 아님(throw 없음)", async () => {
    const dir = await project("1.3");
    const got = await handleGetBrand({ name: "nope", targetDir: dir });
    expect(got).toEqual({ status: "ok", version: "1.3.0", brand: null, available: ["sample"] });
    const text = formatGetBrandResult(got, "nope");
    expect(text).toContain("브랜드 'nope' 가 설치된 @axis-ds/tokens 1.3.0 에 없습니다.");
    expect(text).toContain("설치된 브랜드: sample");
  });

  it("name 이 비면 오류(도구는 isError)", async () => {
    const dir = await project("1.3");
    await expect(handleGetBrand({ name: " ", targetDir: dir })).rejects.toThrow("브랜드 이름(name)은 필수입니다.");
  });
});

describe("미설치 · 미지원 · 빌드 전 안내 (T5-4)", () => {
  const cases: [TokensFixture, string, string][] = [
    ["none", "not-installed", `설치: \`${TOKENS_INSTALL_COMMAND}\``],
    ["1.2", "unsupported", `업그레이드: \`${TOKENS_INSTALL_COMMAND}\``],
    ["1.3-unbuilt", "not-built", `재설치: \`${TOKENS_INSTALL_COMMAND}\``],
  ];

  for (const [tokens, status, guide] of cases) {
    it(`tokens ${tokens}: status ${status}, throw 없이 설치 명령이 담긴 안내`, async () => {
      const dir = await project(tokens);

      const list = await handleListBrands({ targetDir: dir });
      expect(list.status).toBe(status);
      expect(list.brands).toEqual([]);
      const listText = formatListBrandsResult(list);
      expect(listText).toContain(guide);
      // WI-0065 D7: CLI 와 같은 범위(^1.6.0), ^ 가 셸에서 사라지지 않게 따옴표
      expect(listText).toContain('pnpm add "@axis-ds/tokens@^1.6.0"');

      const got = await handleGetBrand({ name: "sample", targetDir: dir });
      expect(got.status).toBe(status);
      expect(got.brand).toBeNull();
      expect(formatGetBrandResult(got, "sample")).toContain(guide);
    });
  }
});

describe("CLI · MCP 응답 동일성 (T5-5, AC3)", () => {
  for (const tokens of ["1.3", "1.2", "none", "1.3-unbuilt"] as TokensFixture[]) {
    it(`tokens ${tokens}: 핸들러 결과 = CLI 코어 결과 (deep equal)`, async () => {
      const dir = await project(tokens);
      const cli = await cliCore();
      expect(await handleListBrands({ targetDir: dir })).toEqual(cli.listBrands(dir));
      expect(await handleGetBrand({ name: "sample", targetDir: dir })).toEqual(cli.getBrand(dir, "sample"));
      expect(await handleGetBrand({ name: "nope", targetDir: dir })).toEqual(cli.getBrand(dir, "nope"));
    });
  }

  it("format 글에 CLI 출력 항목(이름 · 설명 · 테마 · import 경로 · 브랜드 켜기 예시 · 주요 토큰 값)이 모두 있음", async () => {
    const dir = await project("1.3");
    const list = await handleListBrands({ targetDir: dir });
    const got = await handleGetBrand({ name: "sample", targetDir: dir });
    const brand = got.brand!;

    const listText = formatListBrandsResult(list);
    for (const b of list.brands) {
      expect(listText).toContain(b.name);
      expect(listText).toContain(b.description);
      expect(listText).toContain(`(${b.themes.join(" · ")})`);
      expect(listText).toContain(b.importPath);
    }

    const text = formatGetBrandResult(got, "sample");
    expect(text).toContain(brand.name);
    expect(text).toContain(brand.description);
    expect(text).toContain(brand.themes.join(" · "));
    expect(text).toContain(`@import "${brand.importPath}";`);
    expect(text).toContain(brand.providerExample);
    expect(text).toContain('setBrand("sample");');

    const light = Object.entries(brand.tokens.light);
    const dark = Object.entries(brand.tokens.dark);
    expect(light.length).toBeGreaterThan(0);
    expect(dark.length).toBeGreaterThan(0);
    for (const [k, v] of light) {
      expect(text).toContain(`\`${k}\``);
      expect(text).toContain(v);
    }
    for (const [k, v] of dark) {
      expect(text).toContain(`\`${k}\``);
      expect(text).toContain(v);
    }
    // 라이트 · 다크 값이 같은 행에 있는지(표 행 단위)
    expect(text).toContain("| `--primary` | 180 81% 43% | 180 81% 43% |");
    expect(text).toContain("| `--background` | 210 22% 96% | 217 41% 10% |");
    expect(text).toContain("| `--radius` | 12px | - |");

    // 보정 내역(U3 (A)): a11y 메타 3개와 근거 문서
    expect(text).toContain("a11y 상태: unchecked");
    expect(text).toContain("점검일: -");
    expect(text).toContain("게이트: -");
    expect(text).toContain(brand.adjustments.reference);
  });
});

describe("WI-0085: 안내가 targetDir 의 lockfile · packageManager 를 따름(CLI theme list 와 같은 명령)", () => {
  // CLI 원본(theme/index.ts)의 안내 함수를 같은 픽스처에 돌려 문자열을 비교합니다(동적 import, rootDir 밖)
  const CLI_THEME = path.resolve(HERE, "../../../axis-cli/src/theme/index.ts");
  interface CliTheme {
    tokensInstallCommand: (baseDir: string) => string;
    tokensStatusGuide: (status: "not-installed" | "unsupported" | "not-built", version?: string, cmd?: string) => string[];
  }
  // eslint-disable-next-line no-control-regex
  const ANSI = /\u001b\[[0-9;]*m/g;

  const variants: [string, Record<string, string>, Record<string, unknown> | undefined, string][] = [
    ["npm lockfile", { "package-lock.json": "" }, undefined, "npm"],
    ["yarn lockfile", { "yarn.lock": "" }, undefined, "yarn"],
    ["packageManager yarn@", {}, { packageManager: "yarn@4.5.0" }, "yarn"],
    ["없음(종전 pnpm)", {}, undefined, "pnpm"],
  ];

  for (const [label, files, pkgExtra, manager] of variants) {
    it(`${label}: list_brands · get_brand 3상태 안내가 ${manager}, CLI 줄과 같음`, async () => {
      const cli = (await import(pathToFileURL(CLI_THEME).href)) as CliTheme;
      for (const tokens of ["none", "1.2", "1.3-unbuilt"] as TokensFixture[]) {
        const dir = await project(tokens);
        for (const [name, content] of Object.entries(files)) await fs.writeFile(path.join(dir, name), content);
        if (pkgExtra) await fs.writeJSON(path.join(dir, "package.json"), { name: "empty", private: true, ...pkgExtra });
        const cmd = tokensInstallCommandFor(dir);
        expect(cmd).toBe(cli.tokensInstallCommand(dir));
        expect(cmd.split(" ")[0]).toBe(manager);
        const list = await handleListBrands({ targetDir: dir });
        const got = await handleGetBrand({ name: "sample", targetDir: dir });
        expect(list.status).not.toBe("ok");
        const listText = formatListBrandsResult(list, cmd);
        const getText = formatGetBrandResult(got, "sample", cmd);
        // CLI 안내 줄(색 제거 · 앞 공백 제거)의 명령 부분이 MCP 글에 그대로 있음(MCP 는 백틱)
        const cliLines = cli
          .tokensStatusGuide(list.status as "not-installed", list.version, cli.tokensInstallCommand(dir))
          .map((l) => l.replace(ANSI, "").trim())
          .slice(1);
        expect(cliLines.length).toBe(1);
        const mcpLine = listText.split("\n").find((l) => l.startsWith("- "))!.slice(2).replace(/`/g, "");
        expect({ tokens, mcpLine }).toEqual({ tokens, mcpLine: cliLines[0] });
        expect(getText).toContain(listText.split("\n").find((l) => l.startsWith("- "))!);
        if (manager !== "pnpm") expect(listText).not.toContain("pnpm");
      }
    });
  }

  it("installCommand 를 주지 않으면 종전 pnpm(외부 사용처 호환)", async () => {
    const dir = await project("1.3-unbuilt");
    await fs.writeFile(path.join(dir, "package-lock.json"), "");
    const text = formatListBrandsResult(await handleListBrands({ targetDir: dir }));
    expect(text).toContain(`\`pnpm --filter @axis-ds/tokens build\`, 아니면 재설치: \`${TOKENS_INSTALL_COMMAND}\``);
  });
});

describe("WI-0093: 설치 안내가 선언 출처를 따름(CLI theme list · info 와 같은 registry-core 헬퍼 · 같은 문장)", () => {
  const CLI_THEME = path.resolve(HERE, "../../../axis-cli/src/theme/index.ts");
  interface CliTheme {
    tokensInstallGuide: (baseDir: string) => unknown;
    tokensStatusGuide: (status: "not-installed" | "unsupported" | "not-built", version?: string, guide?: unknown) => string[];
  }
  // eslint-disable-next-line no-control-regex
  const ANSI = /\u001b\[[0-9;]*m/g;
  const DECL = { "@axis-ds/tokens": "^1.8.0" };

  interface Ws {
    kind: "pnpm" | "npm" | "yarn" | "none";
    tokens: TokensFixture;
    rootDeps?: Record<string, string>;
    appDeps?: Record<string, string>;
    appLock?: string;
    pnp?: boolean;
  }
  const LOCK = { pnpm: "pnpm-lock.yaml", npm: "package-lock.json", yarn: "yarn.lock" } as const;

  /** 루트(설치본 · lockfile)와 `apps/web` 앱. `kind: "none"` 은 루트가 곧 앱(pnpm-lock.yaml) */
  async function ws(o: Ws): Promise<string> {
    const root = await project(o.tokens);
    if (o.kind === "none") {
      await fs.writeJSON(path.join(root, "package.json"), { name: "a", private: true, dependencies: o.appDeps ?? {} });
      await fs.writeFile(path.join(root, "pnpm-lock.yaml"), "");
      if (o.pnp) await fs.writeFile(path.join(root, ".pnp.cjs"), "");
      return root;
    }
    await fs.writeJSON(path.join(root, "package.json"), {
      name: "root",
      private: true,
      ...(o.kind !== "pnpm" ? { workspaces: ["apps/*"] } : {}),
      dependencies: o.rootDeps ?? {},
    });
    if (o.kind === "pnpm") await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "apps/*"\n');
    await fs.writeFile(path.join(root, LOCK[o.kind]), "");
    if (o.pnp) await fs.writeFile(path.join(root, ".pnp.cjs"), "");
    const app = path.join(root, "apps", "web");
    await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: o.appDeps ?? {} });
    if (o.appLock) await fs.writeFile(path.join(app, o.appLock), "");
    return app;
  }

  const cases: [string, Ws, string][] = [
    ["선언 없음", { kind: "none", tokens: "none" }, '설치: `pnpm add "@axis-ds/tokens@^1.6.0"`'],
    ["앱 선언", { kind: "none", tokens: "none", appDeps: DECL }, "설치: `pnpm install`"],
    ["pnpm 루트 선언", { kind: "pnpm", tokens: "none", rootDeps: DECL }, "설치: `pnpm install`"],
    ["yarn 루트 선언", { kind: "yarn", tokens: "none", rootDeps: DECL }, "설치: `yarn install`"],
    ["npm 루트 선언", { kind: "npm", tokens: "none", rootDeps: DECL }, "설치: 워크스페이스 루트에서 `npm install`"],
    ["P2 앱 lockfile", { kind: "pnpm", tokens: "none", rootDeps: DECL, appLock: "yarn.lock" }, '설치: `yarn add "@axis-ds/tokens@^1.6.0"`'],
    ["P1 PnP 루트 선언만", { kind: "yarn", tokens: "none", rootDeps: DECL, pnp: true }, '설치: `yarn add "@axis-ds/tokens@^1.6.0"`'],
    [
      "P1 PnP 앱 선언",
      { kind: "none", tokens: "none", appDeps: DECL, pnp: true },
      "@axis-ds/tokens ^1.8.0 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.",
    ],
    [
      "루트 선언 · 미지원",
      { kind: "pnpm", tokens: "1.2", rootDeps: { "@axis-ds/tokens": "^1.2.0" } },
      "워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.",
    ],
    [
      "npm 루트 선언 · 빌드 전",
      { kind: "npm", tokens: "1.3-unbuilt", rootDeps: DECL },
      "워크스페이스면 `npm run build -w @axis-ds/tokens`, 아니면 재설치: 워크스페이스 루트에서 `npm install`",
    ],
  ];

  for (const [label, fx, expected] of cases) {
    it(`${label}: list_brands · get_brand 안내 줄이 기대와 같고 CLI 줄과 같음`, async () => {
      const cli = (await import(pathToFileURL(CLI_THEME).href)) as CliTheme;
      const dir = await ws(fx);
      const guide = tokensInstallGuideFor(dir);
      expect(guide).toEqual(cli.tokensInstallGuide(dir));
      const list = await handleListBrands({ targetDir: dir });
      expect(list.status).not.toBe("ok");
      const listText = formatListBrandsResult(list, guide);
      const getText = formatGetBrandResult(await handleGetBrand({ name: "sample", targetDir: dir }), "sample", guide);
      // 안내 줄: PnP 는 머리 줄 하나, 그 밖에는 「- 」 줄
      const line = guide.kind === "pnp" ? listText.split("\n")[2] : listText.split("\n").find((l) => l.startsWith("- "))!.slice(2);
      expect({ label, line }).toEqual({ label, line: expected });
      expect(getText).toContain(expected);
      const cliLines = cli
        .tokensStatusGuide(list.status as "not-installed", list.version, cli.tokensInstallGuide(dir))
        .map((l) => l.replace(ANSI, "").trim());
      const cliLine = cliLines[cliLines.length - 1];
      expect({ label, cliLine }).toEqual({ label, cliLine: expected.replace(/`/g, "") });
    });
  }
});
