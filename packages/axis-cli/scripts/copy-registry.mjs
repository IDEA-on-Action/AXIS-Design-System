#!/usr/bin/env node
/**
 * CLI 동봉 레지스트리 복사 (WI-0045 FR-3 · D1)
 *
 * 배포되는 유일한 레지스트리 apps/web/public/r(SSOT, scripts/build-registry.mjs 출력)을 dist/registry/ 로 복사합니다.
 * dist/ 는 .gitignore 대상이라 커밋되지 않고, package.json files(["dist"])로 npm 배포본에 들어갑니다.
 *
 * 복사 전에 낡은 dist/registry 를 지우고, 복사 뒤 index.json 의 항목마다 <name>.json 이 있는지와 name 이 맞는지 봅니다.
 * 원본이 없거나 항목이 0개면 실패합니다(빈 동봉본으로 빌드가 통과하지 않게).
 *
 * 각 항목의 registryDependencies 도 CLI 가 동봉본을 읽을 때 쓰는 기준(WI-0045 D11)으로 봅니다. 접두 없는 slug 이름이거나
 * 공개 기본 base(REGISTRY_PUBLIC_BASE_URL, src/registry/schema.ts 와 같은 값)로 시작하는 `<base>/<slug>.json` 이어야 합니다.
 * AXIS_REGISTRY_PUBLIC_URL 을 기본값과 다르게 두고 build:registry 를 돌리면 G1 은 통과해도 CLI 는 의존이 있는 항목을
 * 모두 읽지 못하므로, 그런 동봉본으로 빌드가 통과하지 않게 rc 1 로 끝냅니다.
 *
 * 사용: node scripts/copy-registry.mjs [원본 디렉터리 대상 디렉터리]
 *   인자를 생략하면 apps/web/public/r -> dist/registry 입니다(두 인자는 테스트용).
 *   @axis-ds/mcp 도 빌드 때 두 인자를 주어 자기 dist/registry 로 같은 검증을 거쳐 복사합니다(WI-0055 FR-5,
 *   packages/axis-mcp/package.json 의 copy-registry).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const [argSource, argTarget] = process.argv.slice(2);
if ((argSource === undefined) !== (argTarget === undefined)) {
  console.error("copy-registry: 원본과 대상 디렉터리는 함께 주거나 함께 생략합니다");
  process.exit(2);
}
const SOURCE_DIR = argSource ? path.resolve(argSource) : path.join(PKG_DIR, "..", "..", "apps", "web", "public", "r");
const TARGET_DIR = argTarget ? path.resolve(argTarget) : path.join(PKG_DIR, "dist", "registry");

/** 동봉본 registryDependencies 가 받는 공개 기본 base. src/registry/schema.ts 의 REGISTRY_PUBLIC_BASE_URL 과 같아야 합니다 */
const REGISTRY_PUBLIC_BASE_URL = "https://axis-design-system.pages.dev/r";
/** 항목 이름 규칙. src/registry/schema.ts 의 REGISTRY_NAME_PATTERN · REGISTRY_NAME_MAX_LENGTH 와 같습니다 */
const REGISTRY_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REGISTRY_NAME_MAX_LENGTH = 64;

/** registryDependencies 값 -> 항목 이름. 동봉본 기준(접두 없는 이름 또는 공개 기본 base URL)이 아니면 null */
function bundledDependencyName(dep) {
  if (typeof dep !== "string") return null;
  const isName = (n) => REGISTRY_NAME_PATTERN.test(n) && n.length <= REGISTRY_NAME_MAX_LENGTH;
  if (isName(dep)) return dep;
  const prefix = `${REGISTRY_PUBLIC_BASE_URL}/`;
  if (!dep.startsWith(prefix) || !dep.endsWith(".json")) return null;
  const name = dep.slice(prefix.length, -".json".length);
  return isName(name) ? name : null;
}

function fail(message) {
  console.error(`copy-registry: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(SOURCE_DIR, "index.json"))) {
  fail(`원본 레지스트리가 없습니다: ${SOURCE_DIR}/index.json (먼저 pnpm build:registry)`);
}

const index = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, "index.json"), "utf8"));
if (typeof index.version !== "string" || !Array.isArray(index.items) || index.items.length === 0) {
  fail("index.json 에 version 이나 항목이 없습니다");
}

fs.rmSync(TARGET_DIR, { recursive: true, force: true });
fs.mkdirSync(TARGET_DIR, { recursive: true });

const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".json"));
for (const f of files) fs.copyFileSync(path.join(SOURCE_DIR, f), path.join(TARGET_DIR, f));

for (const entry of index.items) {
  const file = path.join(TARGET_DIR, `${entry.name}.json`);
  if (!fs.existsSync(file)) fail(`index.json 의 '${entry.name}' 항목 파일이 없습니다`);
  const item = JSON.parse(fs.readFileSync(file, "utf8"));
  if (item.name !== entry.name) fail(`${entry.name}.json 의 name 이 '${item.name}' 입니다`);
  const deps = item.registryDependencies ?? [];
  if (!Array.isArray(deps)) fail(`${entry.name}.json 의 registryDependencies 가 배열이 아닙니다`);
  for (const dep of deps) {
    if (bundledDependencyName(dep) === null) {
      fail(
        `${entry.name}.json 의 registryDependencies ${JSON.stringify(dep)} 는 CLI 가 동봉본에서 받는 형태가 아닙니다` +
          `(이름 또는 ${REGISTRY_PUBLIC_BASE_URL}/<이름>.json). AXIS_REGISTRY_PUBLIC_URL 을 기본값으로 두고 build:registry 를 다시 돌리세요`
      );
    }
  }
}

console.log(`copy-registry: ${files.length}개 파일(항목 ${index.items.length}개, version ${index.version}) -> ${argTarget ? TARGET_DIR : "dist/registry"}`);
