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

/**
 * 스캔 대상: CLI · MCP 등 패키지 소스와 README, 문서 사이트 소스, 루트 README, docs/guides,
 * 에이전트 지시문(.claude/agents, 에이전트가 이 안내를 그대로 옮겨 씀), docs 최상위 *.md(설계 · 계획 문서).
 *
 * 성격상 스캔하면 안 되는 것(2026-10-19 사용자 결정 E1):
 * - docs/workitems/**: 결함을 설명하는 WI 기록이라 `npx axis-cli` 를 인용해야 합니다. 이를 빼려고 docs 는
 *   하위 디렉터리로 내려가지 않고 최상위 *.md 와 docs/guides 만 봅니다.
 * - .changeset/*.md · CHANGELOG.md: 무엇을 고쳤는지 설명하는 문장에 옛 안내를 인용합니다.
 * - 테스트 파일(*.test.ts)과 test/ fixture: 이 테스트처럼 나쁜 문자열을 양성 대조로 담습니다.
 *   walk 는 *.test.ts 를 건너뛰고, 패키지는 src 만 내려가므로 test/ 는 들어오지 않습니다.
 * - apps/web/public/library/**: 외부 소스에서 수집한 데이터라 손으로 고치지 않습니다(별도 WI).
 *   apps/web 은 src 만 봅니다.
 * 새로 실행 안내를 쓰는 곳이 생기면 성격이 위 제외에 해당하지 않는 한 여기에 더합니다.
 *
 * 성격상 제외할 근거는 없지만 아직 스캔하지 않는 것(E1 지시 범위 밖, 넣을지 사용자 확인 대기):
 * - docs/templates/**: 위 docs 구조 규칙 때문에 함께 빠집니다. WI 기록도 changeset 도 fixture 도 아닙니다.
 * - .claude/commands · .claude/prompts · .claude/rules · .clinerules: .claude/agents 와 같은 근거
 *   (에이전트가 안내를 옮겨 씀)가 들어맞습니다.
 * 2026-10-19 git grep 실측으로 이 다섯 곳의 위반은 0건입니다(같은 패턴이 docs/workitems 에서는 13줄 잡혀
 * 계측은 살아 있음). 이 테스트는 이들에 새로 들어오는 위반을 잡지 못합니다.
 */
const SCAN_DIRS = ["apps/web/src", "docs/guides", ".claude/agents"];
const SCAN_FILES = ["README.md"];
/** 하위로 내려가지 않고 바로 아래 *.md 만 보는 디렉터리 */
const SCAN_TOP_LEVEL_MD = ["docs"];
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
  for (const d of SCAN_TOP_LEVEL_MD) {
    const dir = path.join(ROOT, d);
    if (!(await fs.pathExists(dir))) throw new Error(`스캔 대상이 없습니다: ${dir}`);
    for (const name of await fs.readdir(dir)) {
      const full = path.join(dir, name);
      if (name.endsWith(".md") && (await fs.stat(full)).isFile()) files.push(full);
    }
  }
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

  it("패키지 소스 · README, apps/web/src, docs/guides, .claude/agents, docs 최상위 *.md, 루트 README 에 위반 0건", async () => {
    const files = await scanTargets();
    // 계측 대조: 스캔이 실제로 대상을 읽는지(0건이 미측정이 아님을 보임)
    expect(files.length).toBeGreaterThan(100);
    expect(files).toContain(path.join(ROOT, "packages/axis-cli/src/index.ts"));
    expect(files).toContain(path.join(ROOT, "apps/web/src/components/landing/install-command.tsx"));
    expect(files).toContain(path.join(ROOT, ".claude/agents/docs-writer.md"));
    expect(files).toContain(path.join(ROOT, "docs/axis-ds-implementation-plan.md"));
    // 제외 확인: 결함을 설명하는 WI 문서는 스캔하지 않음
    expect(files.some((f) => f.startsWith(path.join(ROOT, "docs/workitems") + path.sep))).toBe(false);
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
