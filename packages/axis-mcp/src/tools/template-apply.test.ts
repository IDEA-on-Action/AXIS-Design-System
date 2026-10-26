/**
 * WI-0085: MCP `axis.apply_template` 의 「필요한 의존성」 명령이 targetDir 의 lockfile · packageManager 를 따르고,
 * 같은 픽스처에서 CLI `axis template apply` 의 명령 문자열과 같음(목록 접두 · 백틱만 다름).
 * 템플릿 레지스트리는 node-fetch 를 가로채 고정 상세를 돌려줍니다(네트워크 없음).
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const detail = vi.hoisted(() => ({
  name: "Fixture",
  slug: "fixture",
  description: "테스트 템플릿",
  category: "dashboard",
  version: "1.0.0",
  tags: [],
  features: [],
  dependencies: { react: "^19.0.0", clsx: "^2.1.1" },
  devDependencies: { typescript: "^5.7.0" },
  files: [{ path: "package.json", content: '{ "name": "fixture" }\n', type: "config" }],
}));

vi.mock("node-fetch", () => ({
  default: vi.fn(async () => ({ ok: true, status: 200, json: async () => detail })),
}));

import { formatApplyTemplateResult, handleApplyTemplate } from "./template.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// 비교 대상: CLI 원본(rootDir 밖이라 동적 import)
const CLI_APPLY = path.resolve(HERE, "../../../axis-cli/src/template/template-apply.ts");
const CLI_PROJECT = path.resolve(HERE, "../../../axis-registry-core/src/project.ts");

const created: string[] = [];
afterEach(async () => {
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function tree(files: Record<string, string | Record<string, unknown>>): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "axis-mcp-apply-"));
  created.push(root);
  for (const [rel, content] of Object.entries(files)) {
    if (typeof content === "string") await fs.outputFile(path.join(root, rel), content);
    else await fs.outputJSON(path.join(root, rel), content);
  }
  return root;
}

const WS = (lock: string) => ({
  "package.json": { name: "root", private: true, workspaces: ["apps/*"] },
  [lock]: "",
  "apps/web/package.json": { name: "web", private: true },
});

describe("WI-0085 axis.apply_template 의존성 안내", () => {
  const cases: [string, Record<string, string | Record<string, unknown>>, string, string][] = [
    ["ws-npm", WS("package-lock.json"), "apps/web", "npm"],
    ["ws-yarn", WS("yarn.lock"), "apps/web", "yarn"],
    ["single-npm", { "package.json": { name: "a" }, "package-lock.json": "" }, ".", "npm"],
    ["pm-yarn(lockfile 없음, 쓰기 전 packageManager)", { "package.json": { name: "a", packageManager: "yarn@4.5.0" } }, ".", "yarn"],
    ["none(음성 대조)", { "package.json": { name: "a" } }, ".", "pnpm"],
  ];

  for (const [label, files, sub, manager] of cases) {
    it(`${label}: ${manager} 명령 · -D · 따옴표, CLI 와 같은 문자열`, async () => {
      const root = await tree(files);
      const target = path.join(root, sub);
      const { detectInstallCommand } = (await import(pathToFileURL(CLI_PROJECT).href)) as {
        detectInstallCommand: (d: string) => string;
      };
      // CLI 는 쓰기 전에 고르므로 MCP 적용 전에 같은 디렉터리로 계산
      const cliInstall = detectInstallCommand(target);
      const result = await handleApplyTemplate({ name: "fixture", targetDir: target });
      expect(result.installCommand).toBe(cliInstall);
      const text = formatApplyTemplateResult(result);
      const mcpLines = text
        .split("\n")
        .filter((l) => l.startsWith("`"))
        .map((l) => l.replace(/`/g, ""));
      const cli = (await import(pathToFileURL(CLI_APPLY).href)) as {
        templateDependencyCommands: (cmd: string, d: typeof detail) => string[];
      };
      expect(mcpLines).toEqual(cli.templateDependencyCommands(cliInstall, detail));
      const add = manager === "npm" ? "npm install" : `${manager} add`;
      expect(mcpLines).toEqual([`${add} "react@^19.0.0" "clsx@^2.1.1"`, `${add} -D "typescript@^5.7.0"`]);
    });
  }

  it("installCommand 가 없는 종전 결과 객체는 pnpm(외부 사용처 호환)", () => {
    const text = formatApplyTemplateResult({
      success: true,
      templateName: "Fixture",
      files: [],
      dependencies: { react: "^19.0.0" },
      devDependencies: { typescript: "^5.7.0" },
      dryRun: true,
    });
    expect(text).toContain('`pnpm add "react@^19.0.0"`');
    expect(text).toContain('`pnpm add -D "typescript@^5.7.0"`');
  });
});
