/**
 * WI-0088: 템플릿 파일 쓰기 공유 코어(@axis-ds/registry-core/apply-files)
 *
 * template apply · init 과 MCP axis.apply_template 이 템플릿 package.json 으로 사용자 package.json 을 통째로 덮어써
 * packageManager 등 사용자 필드가 사라지던 결함(착수 측정: 사용자 필드 18개 중 최상위 12개 사라짐 · 6개 바뀜)을 막습니다.
 * registry-core 에는 테스트 실행기가 없어 cli 아래에 둡니다(WI-0081 선례).
 */
import { describe, it, expect, afterEach, vi } from "vitest";

// 쓰기 도중 실패를 주입하려고 node:fs 의 writeFileSync 를 감쌉니다. 기본 동작은 원래 함수 그대로입니다(theme-add-rollback 선례)
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, writeFileSync: vi.fn(actual.writeFileSync) };
});

import * as nodeFs from "node:fs";
import fs from "fs-extra";
import os from "node:os";
import path from "node:path";
import {
  PACKAGE_JSON_MERGED_MAPS,
  TemplateApplyError,
  detectJsonIndent,
  isMergedTemplateFile,
  mergeAxisConfigJson,
  mergePackageJson,
  planTemplateFileContent,
  planTemplateFiles,
  writeTemplateFiles,
} from "@axis-ds/registry-core/apply-files";

const created: string[] = [];
afterEach(async () => {
  vi.mocked(nodeFs.writeFileSync).mockReset();
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  vi.mocked(nodeFs.writeFileSync).mockImplementation(actual.writeFileSync);
  while (created.length > 0) await fs.remove(created.pop()!);
});

async function tmp(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "axis-apply88-"));
  created.push(dir);
  return dir;
}

/** 착수 측정의 rich 픽스처(사용자 필드 18개) */
const RICH = {
  name: "my-app",
  version: "2.3.4",
  private: false,
  description: "사용자 앱",
  type: "module",
  packageManager: "npm@10.9.0",
  engines: { node: ">=20" },
  license: "MIT",
  repository: { type: "git", url: "https://example.invalid/r.git" },
  browserslist: ["defaults"],
  scripts: { dev: "vite", test: "vitest", "user:only": "echo hi" },
  dependencies: { react: "^18.3.1", zod: "^3.23.0" },
  devDependencies: { vitest: "^2.1.0", typescript: "^5.4.0" },
  peerDependencies: { "react-dom": "^18" },
  optionalDependencies: { fsevents: "^2.3.3" },
  overrides: { glob: "^10" },
  pnpm: { overrides: { semver: "^7" } },
  resolutions: { semver: "^7" },
};

/** 템플릿 package.json(landing-page 와 같은 모양) */
const TEMPLATE = {
  name: "axis-landing-page",
  version: "0.1.0",
  private: true,
  scripts: { dev: "next dev", build: "next build", start: "next start", lint: "next lint" },
  dependencies: { next: "^15.1.0", react: "^19.0.0", "@axis-ds/tokens": "^1.7.0" },
  devDependencies: { tailwindcss: "^3.4.0", typescript: "^5.7.0" },
};
const TEMPLATE_TEXT = JSON.stringify(TEMPLATE, null, 2) + "\n";

describe("WI-0088 mergePackageJson (Q100)", () => {
  it("사용자 최상위 키는 모두 남고 값도 사용자 값(name · version · private · packageManager …)", () => {
    const merged = mergePackageJson(RICH, TEMPLATE);
    for (const key of Object.keys(RICH)) {
      expect(merged).toHaveProperty(key);
      if (!(PACKAGE_JSON_MERGED_MAPS as readonly string[]).includes(key)) expect(merged[key]).toEqual(RICH[key as keyof typeof RICH]);
    }
    expect(merged.packageManager).toBe("npm@10.9.0");
    expect(merged.name).toBe("my-app");
    expect(merged.version).toBe("2.3.4");
    expect(merged.private).toBe(false);
  });

  it("scripts · 의존성 맵은 키 단위로 합치고 같은 키는 템플릿 값, 사용자에게만 있는 키는 남음", () => {
    const merged = mergePackageJson(RICH, TEMPLATE) as typeof RICH & typeof TEMPLATE;
    expect(merged.scripts).toEqual({ dev: "next dev", test: "vitest", "user:only": "echo hi", build: "next build", start: "next start", lint: "next lint" });
    expect(merged.dependencies).toEqual({ react: "^19.0.0", zod: "^3.23.0", next: "^15.1.0", "@axis-ds/tokens": "^1.7.0" });
    expect(merged.devDependencies).toEqual({ vitest: "^2.1.0", typescript: "^5.7.0", tailwindcss: "^3.4.0" });
    expect(merged.peerDependencies).toEqual(RICH.peerDependencies);
    expect(merged.optionalDependencies).toEqual(RICH.optionalDependencies);
  });

  it("키 순서: 사용자 순서 그대로, 템플릿에만 있는 키는 뒤에", () => {
    const merged = mergePackageJson({ packageManager: "yarn@4.5.0", name: "a" }, TEMPLATE);
    expect(Object.keys(merged)).toEqual(["packageManager", "name", "version", "private", "scripts", "dependencies", "devDependencies"]);
    expect(Object.keys(mergePackageJson(RICH, TEMPLATE).scripts as object)).toEqual(["dev", "test", "user:only", "build", "start", "lint"]);
  });

  it("사용자 맵이 객체가 아니면 템플릿 맵을 씀, 템플릿에 없는 맵은 사용자 값 그대로", () => {
    const merged = mergePackageJson({ scripts: "x", workspaces: ["apps/*"] }, TEMPLATE);
    expect(merged.scripts).toEqual(TEMPLATE.scripts);
    expect(merged.workspaces).toEqual(["apps/*"]);
  });
});

describe("WI-0088 mergeAxisConfigJson (Q103)", () => {
  it("같은 키는 템플릿 값, 사용자에게만 있는 키(registry)는 남음", () => {
    const user = { $schema: "s", componentsDir: "./src/components/ui", globalCss: "./src/app/globals.css", brand: "default", registry: "https://example.invalid/r" };
    const template = { $schema: "s", template: "ontology-console", componentsDir: "./components/ui", globalCss: "./app/globals.css", brand: "ontology" };
    expect(mergeAxisConfigJson(user, template)).toEqual({
      $schema: "s",
      componentsDir: "./components/ui",
      globalCss: "./app/globals.css",
      brand: "ontology",
      registry: "https://example.invalid/r",
      template: "ontology-console",
    });
  });
});

describe("WI-0088 planTemplateFileContent", () => {
  it("기존 파일이 없으면 created · 템플릿 바이트 그대로(빈 디렉터리 init 은 종전과 같음)", () => {
    expect(planTemplateFileContent("package.json", TEMPLATE_TEXT, undefined)).toEqual({ action: "created", content: TEMPLATE_TEXT });
  });

  it("packageManager 만 있는 사용자 package.json: 합친 뒤에도 packageManager 가 남음(이슈 #223)", () => {
    const before = JSON.stringify({ name: "a", packageManager: "yarn@4.5.0" }, null, 2) + "\n";
    const r = planTemplateFileContent("package.json", TEMPLATE_TEXT, before);
    expect(r.action).toBe("merged");
    expect(JSON.parse(r.content).packageManager).toBe("yarn@4.5.0");
  });

  it("JSON 으로 읽을 수 없거나 객체가 아니면 종전처럼 템플릿으로 덮어쓰고 note (Q101)", () => {
    for (const before of ["// 사용자 파일\n", "[1, 2]\n", "null\n", ""]) {
      const r = planTemplateFileContent("package.json", TEMPLATE_TEXT, before);
      expect(r).toEqual({ action: "overwritten", content: TEMPLATE_TEXT, note: "기존 package.json 을 JSON 객체로 읽을 수 없어 템플릿 내용으로 덮어씁니다" });
    }
  });

  it("합치지 않는 파일(tsconfig.json · 하위 경로의 package.json)은 종전처럼 덮어씀", () => {
    const before = JSON.stringify({ compilerOptions: { strict: false }, extra: 1 }, null, 2);
    expect(planTemplateFileContent("tsconfig.json", "{}\n", before)).toEqual({ action: "overwritten", content: "{}\n" });
    expect(planTemplateFileContent("app/package.json", TEMPLATE_TEXT, "{}")).toEqual({ action: "overwritten", content: TEMPLATE_TEXT });
    expect(isMergedTemplateFile("package.json")).toBe(true);
    expect(isMergedTemplateFile("./axis.config.json")).toBe(true);
    expect(isMergedTemplateFile("app/package.json")).toBe(false);
    expect(isMergedTemplateFile("tsconfig.json")).toBe(false);
  });

  it("서식: 기존 들여쓰기(탭 · 4칸) · CRLF · 끝 줄바꿈 없음을 따름 (Q102)", () => {
    const user = { name: "a", packageManager: "pnpm@9.0.0" };
    const tab = planTemplateFileContent("package.json", TEMPLATE_TEXT, JSON.stringify(user, null, "\t") + "\n").content;
    expect(tab).toBe(JSON.stringify(mergePackageJson(user, TEMPLATE), null, "\t") + "\n");
    const four = planTemplateFileContent("package.json", TEMPLATE_TEXT, JSON.stringify(user, null, 4)).content;
    expect(four).toBe(JSON.stringify(mergePackageJson(user, TEMPLATE), null, 4));
    const crlf = planTemplateFileContent("package.json", TEMPLATE_TEXT, (JSON.stringify(user, null, 2) + "\n").replace(/\n/g, "\r\n")).content;
    expect(crlf).toBe((JSON.stringify(mergePackageJson(user, TEMPLATE), null, 2) + "\n").replace(/\n/g, "\r\n"));
    expect(crlf.replace(/\r\n/g, "")).not.toContain("\n");
    expect(detectJsonIndent('{"a":1}')).toBe(2);
  });
});

describe("WI-0088 planTemplateFiles · writeTemplateFiles", () => {
  it("계획은 파일을 쓰지 않고, 쓰기는 계획 내용 그대로", async () => {
    const dir = await tmp();
    await fs.outputJSON(path.join(dir, "package.json"), RICH, { spaces: 2 });
    const before = await fs.readFile(path.join(dir, "package.json"), "utf8");
    const plan = planTemplateFiles(dir, [
      { path: "package.json", content: TEMPLATE_TEXT },
      { path: "app/page.tsx", content: "export default 1;\n" },
    ]);
    expect(plan.map((p) => [p.path, p.action])).toEqual([["package.json", "merged"], ["app/page.tsx", "created"]]);
    expect(await fs.readFile(path.join(dir, "package.json"), "utf8")).toBe(before);
    expect(await fs.pathExists(path.join(dir, "app"))).toBe(false);
    writeTemplateFiles(plan);
    expect(await fs.readFile(path.join(dir, "package.json"), "utf8")).toBe(plan[0].content);
    expect(await fs.readFile(path.join(dir, "app/page.tsx"), "utf8")).toBe("export default 1;\n");
  });

  it("rollback: 세 번째 파일 쓰기가 실패하면 앞의 파일을 원래대로 되돌리고 새 파일 · 새 디렉터리를 지운 뒤 TemplateApplyError (Q106)", async () => {
    const dir = await tmp();
    await fs.outputJSON(path.join(dir, "package.json"), RICH, { spaces: 2 });
    await fs.outputFile(path.join(dir, "keep.txt"), "x\n");
    const before = await fs.readFile(path.join(dir, "package.json"), "utf8");
    const plan = planTemplateFiles(dir, [
      { path: "package.json", content: TEMPLATE_TEXT },
      { path: "components/ui/hero.tsx", content: "export {};\n" },
      { path: "app/page.tsx", content: "export default 1;\n" },
    ]);
    const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
    const failing = plan[2].dest;
    vi.mocked(nodeFs.writeFileSync).mockImplementation(((file: nodeFs.PathOrFileDescriptor, data: string) => {
      if (file === failing) throw Object.assign(new Error("주입한 쓰기 실패"), { code: "EIO" });
      return actual.writeFileSync(file, data);
    }) as typeof nodeFs.writeFileSync);

    let caught: unknown;
    try {
      writeTemplateFiles(plan);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(TemplateApplyError);
    const err = caught as TemplateApplyError;
    expect(err.restored).toEqual(["package.json", "components/ui/hero.tsx", "app/page.tsx"]);
    expect(err.unrestored).toEqual([]);
    expect(err.message).toContain("주입한 쓰기 실패");
    expect(await fs.readFile(path.join(dir, "package.json"), "utf8")).toBe(before);
    expect(await fs.pathExists(path.join(dir, "components"))).toBe(false);
    expect(await fs.pathExists(path.join(dir, "app"))).toBe(false);
    expect((await fs.readdir(dir)).sort()).toEqual(["keep.txt", "package.json"]);
  });
});
