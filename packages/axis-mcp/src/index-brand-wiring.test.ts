import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";

// WI-0093 B4: 서버 등록부(src/index.ts)의 axis.list_brands · axis.get_brand 가 선언 출처를 보는 안내(tokensInstallGuideFor)를
// 넘기는지 고정합니다. src/index.ts 는 import 하면 stdio 서버가 뜨므로 SDK 의 McpServer · StdioServerTransport 만 바꿔
// 등록된 도구 처리기를 모으고, 그 처리기를 실제 픽스처에 돌려 응답 글을 봅니다(종전 tokensInstallCommandFor 로 되돌리면 빨개져요).
const { tools } = vi.hoisted(() => ({
  tools: new Map<string, (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>>(),
}));

vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: class {
    tool(name: string, ...rest: unknown[]) {
      tools.set(name, rest[rest.length - 1] as never);
    }
    async connect() {}
    async close() {}
  },
}));
vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({ StdioServerTransport: class {} }));

const DECL = { "@axis-ds/tokens": "^1.8.0" };
const dirs: string[] = [];

/** npm 워크스페이스(package-lock.json) 루트에만 tokens 를 선언하고 설치본은 없는 `apps/web` 앱 */
async function npmRootDeclared(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "axis-mcp-wiring-"));
  dirs.push(root);
  await fs.writeJSON(path.join(root, "package.json"), { name: "root", private: true, workspaces: ["apps/*"], dependencies: DECL });
  await fs.writeFile(path.join(root, "package-lock.json"), "");
  const app = path.join(root, "apps", "web");
  await fs.outputJSON(path.join(app, "package.json"), { name: "web", private: true, dependencies: {} });
  return app;
}

/** Yarn Plug'n'Play(.pnp.cjs) 단독 앱에 tokens 를 선언(node_modules 설치본 없음) */
async function pnpAppDeclared(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "axis-mcp-wiring-"));
  dirs.push(root);
  await fs.writeJSON(path.join(root, "package.json"), { name: "a", private: true, dependencies: DECL });
  await fs.writeFile(path.join(root, "yarn.lock"), "");
  await fs.writeFile(path.join(root, ".pnp.cjs"), "");
  return root;
}

async function call(name: string, args: Record<string, unknown>): Promise<string> {
  const handler = tools.get(name);
  expect(handler, `${name} 가 등록되지 않음`).toBeTypeOf("function");
  const res = await handler!(args);
  expect(res.isError).toBeUndefined();
  return res.content.map((c) => c.text).join("\n");
}

describe("WI-0093 B4: MCP 등록부의 브랜드 도구가 tokensInstallGuideFor 를 씀", () => {
  beforeAll(async () => {
    await import("./index.js");
  });
  afterAll(async () => {
    for (const d of dirs) await fs.remove(d);
  });

  it("npm 루트 선언 · 미설치: list_brands · get_brand 가 「워크스페이스 루트에서 `npm install`」, 범위를 붙인 add 없음", async () => {
    const app = await npmRootDeclared();
    for (const [name, args] of [
      ["axis.list_brands", { targetDir: app }],
      ["axis.get_brand", { name: "sample", targetDir: app }],
    ] as const) {
      const text = await call(name, args);
      expect({ name, has: text.includes("설치: 워크스페이스 루트에서 `npm install`") }).toEqual({ name, has: true });
      expect({ name, add: text.includes("@axis-ds/tokens@") }).toEqual({ name, add: false });
    }
  });

  it("PnP 앱 선언: 두 도구 모두 판정하지 못했다는 한 줄, 설치 명령 없음", async () => {
    const app = await pnpAppDeclared();
    const pnp = "@axis-ds/tokens ^1.8.0 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.";
    for (const [name, args] of [
      ["axis.list_brands", { targetDir: app }],
      ["axis.get_brand", { name: "sample", targetDir: app }],
    ] as const) {
      const text = await call(name, args);
      expect({ name, has: text.includes(pnp) }).toEqual({ name, has: true });
      expect({ name, install: text.includes("설치: `") }).toEqual({ name, install: false });
    }
  });
});
