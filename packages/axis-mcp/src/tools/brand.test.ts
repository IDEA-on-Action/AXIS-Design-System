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
