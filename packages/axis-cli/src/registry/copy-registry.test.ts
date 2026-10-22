/**
 * 동봉본 복사 스크립트 검사 (WI-0045 FR-3 · D11)
 *
 * scripts/copy-registry.mjs 를 임시 원본 · 대상 디렉터리 인자로 실행해, CLI 가 동봉본에서 읽지 못하는
 * registryDependencies(공개 기본 base 밖의 URL)가 든 레지스트리를 rc 1 로 막는지 봅니다.
 * 저장소의 dist/registry 는 건드리지 않습니다.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { REGISTRY_PUBLIC_BASE_URL } from "./schema.js";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "scripts", "copy-registry.mjs");

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** registryDependencies 를 받아 원본 레지스트리(utils · button 두 항목)를 만들고 [원본, 대상] 을 돌려줍니다 */
function makeSource(buttonDeps: unknown[]): [string, string] {
  const root = mkdtempSync(path.join(tmpdir(), "axis-copy-registry-"));
  dirs.push(root);
  const src = path.join(root, "r");
  mkdirSync(src);
  const item = (name: string, registryDependencies: unknown[]) => ({
    name,
    type: "registry:ui",
    dependencies: [],
    registryDependencies,
    files: [{ path: `components/ui/${name}.tsx`, type: "registry:ui", content: `export const ${name.replace(/-/g, "")} = 1;\n` }],
  });
  writeFileSync(
    path.join(src, "index.json"),
    JSON.stringify({ version: "9.9.9", items: [{ name: "utils", type: "registry:lib" }, { name: "button", type: "registry:ui" }] })
  );
  writeFileSync(path.join(src, "utils.json"), JSON.stringify(item("utils", [])));
  writeFileSync(path.join(src, "button.json"), JSON.stringify(item("button", buttonDeps)));
  return [src, path.join(root, "out")];
}

function run(src: string, out: string) {
  const r = spawnSync(process.execPath, [SCRIPT, src, out], { encoding: "utf8" });
  return { rc: r.status, text: `${r.stdout}${r.stderr}` };
}

describe("copy-registry 동봉본 의존 형식 검사(D11)", () => {
  it("스크립트의 공개 기본 base 가 CLI 상수와 같음", () => {
    expect(readFileSync(SCRIPT, "utf8")).toContain(`const REGISTRY_PUBLIC_BASE_URL = "${REGISTRY_PUBLIC_BASE_URL}";`);
  });

  it("양성: 공개 기본 base URL 과 접두 없는 이름은 통과하고 파일을 복사", () => {
    const [src, out] = makeSource([`${REGISTRY_PUBLIC_BASE_URL}/utils.json`, "utils"]);
    const r = run(src, out);
    expect(r.rc, r.text).toBe(0);
    expect(existsSync(path.join(out, "button.json"))).toBe(true);
    expect(r.text).toContain("항목 2개");
  });

  it.each([
    ["다른 호스트(AXIS_REGISTRY_PUBLIC_URL 을 바꿔 만든 레지스트리)", "https://mirror.example/r/utils.json"],
    ["userinfo 가 든 공개 base", "https://u:p@axis-design-system.pages.dev/r/utils.json"],
    ["공개 base 의 다른 경로", `${REGISTRY_PUBLIC_BASE_URL}/sub/utils.json`],
    ["slug 가 아닌 이름", "Utils"],
  ])("음성: %s 이면 rc 1", (_label, dep) => {
    const [src, out] = makeSource([dep]);
    const r = run(src, out);
    expect(r.rc, r.text).toBe(1);
    expect(r.text).toContain("button.json 의 registryDependencies");
  });

  it("인자를 하나만 주면 rc 2 이고 아무것도 만들지 않음", () => {
    const [src, out] = makeSource([]);
    const r = spawnSync(process.execPath, [SCRIPT, src], { encoding: "utf8" });
    expect(r.status).toBe(2);
    expect(existsSync(out)).toBe(false);
  });
});
