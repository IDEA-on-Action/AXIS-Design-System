/**
 * WI-0038 D2: 실행 안내에 `axis-cli` 를 쓰지 않습니다.
 * `axis-cli` 는 2026-01-15 npm 에서 unpublish 된 타인 이름이라 누구나 다시 등록할 수 있습니다(typosquat).
 * 우리 패키지는 `@axis-ds/cli` 입니다. 패키지 디렉터리 이름(`packages/axis-cli`) 같은 경로는 실행 안내가 아니라 대상이 아닙니다.
 */

import { describe, it, expect } from "vitest";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { INIT_NEXT_STEP_COMMAND } from "./init/init.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");

/** `npx axis-cli` · `pnpm dlx axis-cli` · `bunx axis-cli` 처럼 패키지 이름으로 실행하는 안내 */
const RUNNER_PATTERN = /\b(?:npx|pnpm\s+dlx|pnpm\s+exec|bunx|yarn\s+dlx)\s+(?:-y\s+|--yes\s+)?axis-cli\b/;
/** `npx` 없이 `axis-cli <명령>` 으로 쓴 안내(경로 `packages/axis-cli/` 는 앞이 `/` 라 걸리지 않음) */
const BARE_PATTERN =
  /(?:^|[\s"'`(*])axis-cli\s+(?:init|add|list|monet|v0|library|lib|sync|template|check|theme|status)\b/m;

function isGuidanceViolation(text: string): boolean {
  return RUNNER_PATTERN.test(text) || BARE_PATTERN.test(text);
}

/** 스캔 대상: CLI · MCP 등 패키지 소스와 README, 문서 사이트 소스, 루트 README, docs/guides */
const SCAN_DIRS = ["apps/web/src", "docs/guides"];
const SCAN_FILES = ["README.md"];
const SOURCE_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".md", ".mdx", ".json"]);

async function walk(dir: string, out: string[]) {
  if (!(await fs.pathExists(dir))) throw new Error(`스캔 대상이 없습니다: ${dir}`);
  for (const name of await fs.readdir(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".next" || name === ".turbo") continue;
    const full = path.join(dir, name);
    const stat = await fs.stat(full);
    if (stat.isDirectory()) await walk(full, out);
    else if (SOURCE_EXT.has(path.extname(name)) && !/\.test\.tsx?$/.test(name)) out.push(full);
  }
}

async function scanTargets(): Promise<string[]> {
  const files: string[] = [];
  for (const pkg of await fs.readdir(path.join(ROOT, "packages"))) {
    const pkgDir = path.join(ROOT, "packages", pkg);
    if (await fs.pathExists(path.join(pkgDir, "src"))) await walk(path.join(pkgDir, "src"), files);
    const readme = path.join(pkgDir, "README.md");
    if (await fs.pathExists(readme)) files.push(readme);
  }
  for (const d of SCAN_DIRS) await walk(path.join(ROOT, d), files);
  for (const f of SCAN_FILES) files.push(path.join(ROOT, f));
  return files;
}

describe("WI-0038 D2: axis-cli 실행 안내 금지", () => {
  it("패턴 양성 대조: 알려진 나쁜 안내는 걸리고, 경로 · 우리 패키지 이름은 걸리지 않음", () => {
    for (const bad of [
      "npx axis-cli add button",
      "pnpm dlx axis-cli add button",
      "bunx axis-cli add button",
      "npx -y axis-cli init",
      '<code className="text-sm">npx axis-cli init</code>',
      "  axis-cli monet browse <category>",
      " *   axis-cli v0 convert <file>",
      "   axis-cli library collect 명령어로",
    ]) {
      expect({ bad, hit: isGuidanceViolation(bad) }).toEqual({ bad, hit: true });
    }
    for (const ok of [
      "npx @axis-ds/cli add button",
      "pnpm dlx @axis-ds/cli add button",
      "packages/axis-cli/src/theme/brand-core.ts",
      '"directory": "packages/axis-cli"',
      "│   ├── axis-cli/               # @axis-ds/cli",
      "../../../axis-cli/test/fixtures/theme",
    ]) {
      expect({ ok, hit: isGuidanceViolation(ok) }).toEqual({ ok, hit: false });
    }
  });

  it("init 안내는 npx @axis-ds/cli", () => {
    expect(INIT_NEXT_STEP_COMMAND).toBe("npx @axis-ds/cli add button");
    expect(isGuidanceViolation(INIT_NEXT_STEP_COMMAND)).toBe(false);
  });

  it("패키지 소스 · README, apps/web/src, docs/guides, 루트 README 에 위반 0건", async () => {
    const files = await scanTargets();
    // 계측 대조: 스캔이 실제로 대상을 읽는지(0건이 미측정이 아님을 보임)
    expect(files.length).toBeGreaterThan(100);
    expect(files).toContain(path.join(ROOT, "packages/axis-cli/src/index.ts"));
    expect(files).toContain(path.join(ROOT, "apps/web/src/components/landing/install-command.tsx"));
    const hits: string[] = [];
    for (const file of files) {
      const lines = (await fs.readFile(file, "utf8")).split(/\r?\n/);
      lines.forEach((line, i) => {
        if (isGuidanceViolation(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
