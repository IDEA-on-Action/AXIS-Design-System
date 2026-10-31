/**
 * WI-0055: 컴포넌트 도구(list · search · get · install)가 레지스트리와 공유 코어로 동작하는지
 *
 * 레지스트리는 저장소의 apps/web/public/r(배포 원본, mcp 동봉본의 원본)을 씁니다. 원격은 기본으로 끄고(url null),
 * 원격 경로는 로컬 http 서버와 접속 불가 주소(127.0.0.1:1)로 따로 봅니다.
 */

import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClientFor, runAdd } from "@axis-ds/registry-core/add";
import { RegistryClient } from "@axis-ds/registry-core/registry";
import { formatComponentDetail, handleGetComponent } from "./get.js";
import { DEFAULT_LAYOUT_CONFIG, formatInstallResult, handleInstallComponent } from "./install.js";
import { formatComponentList, handleListComponents } from "./list.js";
import { MCP_BUNDLED_LABEL, type CreateClient, type RegistryDeps } from "./registry-source.js";
import { handleSearchComponents } from "./search.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = path.resolve(HERE, "../../../../apps/web/public/r");

/** 원격 없이 동봉본(저장소 레지스트리)만 읽는 클라이언트 */
const offline: CreateClient = async (_baseDir, notify) =>
  new RegistryClient({ url: null, bundledDir: REGISTRY_DIR, notify, bundledLabel: MCP_BUNDLED_LABEL });
const deps: RegistryDeps = { createClient: offline };

let work: string;
beforeEach(() => {
  work = mkdtempSync(path.join(tmpdir(), "axis-mcp-registry-"));
});
afterEach(() => {
  rmSync(work, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function project(name: string, config?: Record<string, unknown>): string {
  const dir = path.join(work, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name, private: true, dependencies: { react: "^19.0.0" } }));
  if (config) writeFileSync(path.join(dir, "axis.config.json"), JSON.stringify(config));
  return dir;
}

function read(root: string, rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

const INSTALLED_DEFAULT = [
  "components/ui/utils.ts",
  "components/ui/separator.tsx",
  "components/ui/dialog.tsx",
  "components/ui/agentic-a11y-labels.ts",
  "components/agentic/run-progress.tsx",
];

describe("list_components (D2 · D6)", () => {
  it("lib 를 뺀 28개(ui 10 · agentic 18), 카테고리 통계", async () => {
    const r = await handleListComponents({}, deps);
    const names = r.components.map((c) => c.name);
    expect(r.totalCount).toBe(28);
    expect(r.kinds).toEqual({ ui: 10, agentic: 18 });
    expect(r.stats).toEqual({ core: 4, form: 3, layout: 3, agentic: 18 });
    expect(names).not.toContain("utils");
    expect(names).not.toContain("agentic-a11y-labels");
    expect(names).toContain("agentic-run-progress");
  });

  it("category: ui 10 · agentic 18 · form 3(종전 enum 유지)", async () => {
    expect((await handleListComponents({ category: "ui" }, deps)).totalCount).toBe(10);
    expect((await handleListComponents({ category: "agentic" }, deps)).totalCount).toBe(18);
    const form = await handleListComponents({ category: "form" }, deps);
    expect(form.components.map((c) => c.name).sort()).toEqual(["input", "label", "select"]);
  });

  it("출력: 종전 머리글 · 합계 표 + 출처 · 폴백 안내", async () => {
    const text = formatComponentList(await handleListComponents({}, deps));
    expect(text.startsWith("# AXIS Design System 컴포넌트 목록")).toBe(true);
    expect(text).toContain("| **합계** | **28** |");
    expect(text).toContain(`- **출처**: ${MCP_BUNDLED_LABEL} (version`);
    expect(text).toContain("> 안내: 원격 레지스트리에 접근하지 못해 MCP 에 포함된 레지스트리");
    expect(text).toContain("| `agentic-run-progress` |");
  });
});

describe("search_components", () => {
  it("progress 로 agentic-run-progress 를 찾음(1.2.3 은 0건)", async () => {
    const r = await handleSearchComponents({ query: "progress" }, deps);
    expect(r.components.map((c) => c.name)).toEqual(["agentic-run-progress"]);
  });

  it("category 필터와 함께", async () => {
    const r = await handleSearchComponents({ query: "button", category: "ui" }, deps);
    expect(r.components.map((c) => c.name)).toEqual(["button"]);
  });

  it("빈 검색어는 오류", async () => {
    await expect(handleSearchComponents({ query: " " }, deps)).rejects.toThrow("검색어");
  });
});

describe("get_component (D2)", () => {
  it("레지스트리 항목 + components.json props · examples", async () => {
    const r = await handleGetComponent({ name: "separator" }, deps);
    expect(r.component?.description).toBe("AXIS 구분선 컴포넌트");
    expect(r.component?.registryDependencies).toEqual(["utils"]);
    expect(r.component?.dependencies).toEqual(["@radix-ui/react-separator"]);
    expect(r.component?.props?.map((p) => p.name)).toEqual(["orientation"]);
    const text = formatComponentDetail(r);
    expect(text).toContain("## Props");
    expect(text).toContain("## 함께 설치되는 항목");
  });

  it("agentic 항목도 조회(1.2.3 은 없음), 대소문자 무시(종전과 같음)", async () => {
    expect((await handleGetComponent({ name: "agentic-run-progress" }, deps)).component?.kind).toBe("agentic");
    expect((await handleGetComponent({ name: "Button" }, deps)).component?.name).toBe("button");
  });

  it("없는 이름은 null + 전체 이름 제안(--agentic 안내 없음)", async () => {
    const r = await handleGetComponent({ name: "run-progress" }, deps);
    expect(r.component).toBeNull();
    expect(r.hint).toContain("'agentic-run-progress'");
    expect(r.hint).not.toContain("--agentic");
    expect(formatComponentDetail(r)).toContain("컴포넌트를 찾을 수 없습니다.");
  });

  it("lib 항목은 상세 대상이 아님", async () => {
    const r = await handleGetComponent({ name: "utils" }, deps);
    expect(r.component).toBeNull();
    expect(r.hint).toContain("보조 항목");
  });
});

describe("install_component (D3 · D4 · D5 · D7)", () => {
  it("config 없음: 기본 배치로 의존 항목까지 설치하고 알림, 절대 경로 · 의존성 명령", async () => {
    const root = project("no-config");
    const r = await handleInstallComponent(
      { names: ["separator", "dialog", "agentic-run-progress"], targetDir: root },
      deps
    );
    expect(r.success).toBe(true);
    expect(r.root).toBe(path.resolve(root));
    expect(r.usedDefaultLayout).toBe(true);
    expect(r.items).toEqual(["utils", "separator", "dialog", "agentic-a11y-labels", "agentic-run-progress"]);
    expect(r.installedFiles).toEqual(INSTALLED_DEFAULT);
    for (const f of INSTALLED_DEFAULT) expect(existsSync(path.join(root, f))).toBe(true);
    expect(read(root, "components/agentic/run-progress.tsx")).toContain('from "../ui/utils"');
    expect(r.dependencyCommand).toBe('pnpm add @radix-ui/react-dialog @radix-ui/react-separator "clsx@^2.1.1" "tailwind-merge@^2.6.0"');
    const text = formatInstallResult(r);
    expect(text.startsWith("# 컴포넌트 설치 완료")).toBe(true);
    expect(text).toContain(`- **프로젝트 루트**: \`${path.resolve(root)}\``);
    expect(text).toContain("기본 배치(components/ui · components/agentic)");
    expect(text).toContain("서버는 설치를 실행하지 않았습니다");
  });

  it("cli 와 같은 결과: 같은 config 로 코어 runAdd 를 직접 부른 결과와 파일 · 내용이 같음", async () => {
    const config = { componentsDir: "src/components/ui" };
    const viaMcp = project("via-mcp", config);
    const viaCore = project("via-core", config);
    const names = ["separator", "dialog", "agentic-run-progress"];
    const r = await handleInstallComponent({ names, targetDir: viaMcp }, deps);
    expect(r.usedDefaultLayout).toBe(false);
    const add = await runAdd(viaCore, names, { yes: true }, { client: await offline(viaCore, () => {}), log: () => {}, error: () => {} });
    expect(add.exitCode).toBe(0);
    expect(r.installedFiles).toEqual(add.written);
    for (const f of add.written) expect(read(viaMcp, f)).toBe(read(viaCore, f));
  });

  it("name 하나(종전 인자)와 names 를 합침, 대소문자 무시", async () => {
    const root = project("merge");
    const r = await handleInstallComponent({ name: "Button", names: ["badge"], targetDir: root }, deps);
    expect(r.success).toBe(true);
    expect(r.items).toEqual(["utils", "button", "badge"]);
  });

  it("내용이 다른 기존 파일은 건너뛰고(isError 아님) 첫머리에 건너뛴 수, overwrite: true 만 덮어씀", async () => {
    const root = project("skip");
    await handleInstallComponent({ name: "separator", targetDir: root }, deps);
    const file = path.join(root, "components/ui/separator.tsx");
    const original = readFileSync(file, "utf8");
    writeFileSync(file, "// 사용자 수정\n" + original);

    const skipped = await handleInstallComponent({ name: "separator", targetDir: root }, deps);
    expect(skipped.success).toBe(true);
    expect(skipped.skippedFiles).toEqual(["components/ui/separator.tsx"]);
    expect(skipped.unchangedFiles).toEqual(["components/ui/utils.ts"]);
    expect(readFileSync(file, "utf8").startsWith("// 사용자 수정")).toBe(true);
    const lines = formatInstallResult(skipped).split("\n");
    expect(lines[0]).toBe("# 컴포넌트 설치 완료");
    expect(lines[2]).toContain("내용이 다른 기존 파일 1개를 건너뛰었습니다");

    const forced = await handleInstallComponent({ name: "separator", targetDir: root, overwrite: true }, deps);
    expect(forced.success).toBe(true);
    expect(forced.overwrittenFiles).toEqual(["components/ui/separator.tsx"]);
    expect(readFileSync(file, "utf8")).toBe(original);
  });

  it("경로 이탈(componentsDir ../outside)은 아무것도 쓰지 않고 실패(isError)", async () => {
    const root = project("escape", { componentsDir: "../outside" });
    const r = await handleInstallComponent({ name: "separator", targetDir: root }, deps);
    expect(r.success).toBe(false);
    expect(r.installedFiles).toEqual([]);
    expect(existsSync(path.join(work, "outside"))).toBe(false);
    const text = formatInstallResult(r);
    expect(text.startsWith("# 컴포넌트 설치 실패")).toBe(true);
    expect(text).toContain("## 오류");
  });

  it("없는 targetDir 은 만들지 않고 실패", async () => {
    const missing = path.join(work, "nope");
    const r = await handleInstallComponent({ name: "button", targetDir: missing }, deps);
    expect(r.success).toBe(false);
    expect(r.message).toContain("대상 디렉터리가 없습니다");
    expect(existsSync(missing)).toBe(false);
  });

  it("없는 이름은 아무것도 쓰지 않고 실패, 전체 이름 제안", async () => {
    const root = project("missing");
    const r = await handleInstallComponent({ names: ["button", "run-progress"], targetDir: root }, deps);
    expect(r.success).toBe(false);
    expect(r.installedFiles).toEqual([]);
    expect(r.errors.join("\n")).toContain("'agentic-run-progress'");
    expect(r.errors.join("\n")).toContain("axis.list_components");
    expect(existsSync(path.join(root, "components"))).toBe(false);
  });

  it("이름이 없으면 오류", async () => {
    await expect(handleInstallComponent({ targetDir: work }, deps)).rejects.toThrow("name 또는 names");
  });

  it("stdout 에 아무것도 쓰지 않음(stdio JSON-RPC 통로 보호)", async () => {
    const write = vi.spyOn(process.stdout, "write");
    const log = vi.spyOn(console, "log");
    const root = project("stdout");
    await handleListComponents({}, deps);
    await handleInstallComponent({ names: ["separator", "agentic-run-progress"], targetDir: root }, deps);
    await handleInstallComponent({ name: "nope-nope", targetDir: root }, deps);
    expect(write).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });
});

describe("레지스트리 출처 (D8)", () => {
  let server: Server | undefined;
  afterEach(async () => {
    if (server) await new Promise<void>((done) => server!.close(() => done()));
    server = undefined;
  });

  it("원격 접속 불가면 MCP 에 포함된 레지스트리로 폴백하고 안내 1번", async () => {
    const viaEnv: CreateClient = (baseDir, notify) =>
      createClientFor(baseDir, notify, { AXIS_REGISTRY_URL: "http://127.0.0.1:1/r" }, {
        bundledLabel: MCP_BUNDLED_LABEL,
        bundledDir: REGISTRY_DIR,
      });
    const root = project("fallback");
    const r = await handleInstallComponent({ name: "separator", targetDir: root }, { createClient: viaEnv });
    expect(r.success).toBe(true);
    expect(r.source).toContain(`${MCP_BUNDLED_LABEL} (version`);
    expect(r.notices.filter((n) => n.startsWith("원격 레지스트리에 접근하지 못해 MCP 에 포함된 레지스트리"))).toHaveLength(1);
  });

  it("원격이 되면 원격을 씀(로컬 서버, 요청 기록으로 양성 대조)", async () => {
    const requested: string[] = [];
    server = createServer((req, res) => {
      requested.push(req.url ?? "");
      const file = path.join(REGISTRY_DIR, path.basename(req.url ?? ""));
      if (!existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": "application/json" }).end(readFileSync(file));
    });
    await new Promise<void>((done) => server!.listen(0, "127.0.0.1", () => done()));
    const port = (server.address() as AddressInfo).port;
    const viaEnv: CreateClient = (baseDir, notify) =>
      createClientFor(baseDir, notify, { AXIS_REGISTRY_URL: `http://127.0.0.1:${port}/r` }, {
        bundledLabel: MCP_BUNDLED_LABEL,
        bundledDir: REGISTRY_DIR,
      });
    const list = await handleListComponents({}, { createClient: viaEnv });
    expect(list.source).toMatch(/^원격 레지스트리 \(version /);
    expect(list.notices).toEqual([]);
    expect(requested).toContain("/r/index.json");
  });

  it("기본 배치 상수는 components/ui(agentic 은 형제 components/agentic)", () => {
    expect(DEFAULT_LAYOUT_CONFIG).toEqual({ componentsDir: "components/ui" });
  });
});

// WI-0095: Yarn Plug'n'Play 에서 워크스페이스 루트에만 선언한 의존성은 앱이 해석하지 못하므로 의존성 명령에 넣음(cli axis add 와 같은
// registry-core missingDependencies). 착수 측정(main e4d89ae, Yarn 4.5.3 실설치): 루트 전용 clsx · tailwind-merge 를 명령에서 뺐음.
describe("install_component: Plug'n'Play 루트 선언 경계 (WI-0095)", () => {
  /** 루트 workspaces · apps/web 워크스페이스. `pnp` 면 yarn.lock · .yarnrc.yml · .pnp.cjs, 아니면 yarn node-modules(루트 설치본) */
  function workspace(name: string, pnp: boolean): string {
    const root = path.join(work, name);
    mkdirSync(path.join(root, ".git"), { recursive: true });
    const utils = { tailwindcss: "4.1.14", clsx: "^2.1.1", "tailwind-merge": "^3.3.1" };
    writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "root", private: true, workspaces: ["apps/*"], dependencies: utils }));
    writeFileSync(path.join(root, "yarn.lock"), "# yarn lockfile v8\n");
    writeFileSync(path.join(root, ".yarnrc.yml"), `nodeLinker: ${pnp ? "pnp" : "node-modules"}\n`);
    if (pnp) writeFileSync(path.join(root, ".pnp.cjs"), "// pnp\n");
    else {
      for (const [n, v] of Object.entries(utils)) {
        mkdirSync(path.join(root, "node_modules", n), { recursive: true });
        writeFileSync(path.join(root, "node_modules", n, "package.json"), JSON.stringify({ name: n, version: v.replace(/^\^/, "") }));
      }
    }
    const app = path.join(root, "apps", "web");
    mkdirSync(app, { recursive: true });
    writeFileSync(path.join(app, "package.json"), JSON.stringify({ name: "web", private: true }));
    return app;
  }

  it("PnP 루트 전용 clsx · tailwind-merge 는 의존성 명령에 들어감(종전: 빠짐)", async () => {
    const r = await handleInstallComponent({ name: "button", targetDir: workspace("pnp", true) }, deps);
    expect(r.success).toBe(true);
    expect(r.dependencyCommand).toBe('yarn add @radix-ui/react-slot class-variance-authority "clsx@^2.1.1" "tailwind-merge@^3.4.0"');
  });

  it("음성 대조 yarn node-modules: 루트 선언은 종전처럼 빠짐", async () => {
    const r = await handleInstallComponent({ name: "button", targetDir: workspace("nm", false) }, deps);
    expect(r.dependencyCommand).toBe("yarn add @radix-ui/react-slot class-variance-authority");
  });
});
