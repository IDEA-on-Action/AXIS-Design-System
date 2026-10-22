#!/usr/bin/env node
/**
 * AXIS Design System 레지스트리 빌드 스크립트 (shadcn 레지스트리 형식)
 *
 * 입력: packages/{axis-ui-react,axis-agentic-ui}/registry/registry.json(메타)과 각 패키지 소스
 * 출력: apps/web/public/r 하나(배포되는 유일한 사본, WI-0045 D4). `--out <디렉터리>` 로 다른 곳에 만들 수 있습니다
 *   (AC5 스모크가 공개 URL 을 로컬 서버로 바꾼 사본을 scratch 에 만들 때 씁니다. 배포본은 기본 위치만 씁니다).
 *   `--out` 은 없거나 빈 디렉터리, 또는 이 스크립트가 만든 레지스트리 디렉터리(index.json)만 받고, 그때 지우는 것은
 *   index.json · registry.json · 기존 index 의 항목 파일뿐입니다(그 밖의 디렉터리는 rc 1 로 거부, staleRegistryFiles).
 *   - <name>.json  항목(registry-item)
 *   - registry.json · index.json  목록. version(ui-react package.json) 과 항목별 sha256 포함
 *
 * 정규화(WI-0045 D2 · FR-1):
 *   1. 상대 import 와 agentic 의 `@axis-ds/ui-react` cn import 를 레지스트리 lib 항목의 표준 형태로 바꿉니다.
 *        ../utils                       -> @/registry/axis/lib/utils                (항목 utils)
 *        ../constants/a11y-labels       -> @/registry/axis/lib/agentic-a11y-labels  (항목 agentic-a11y-labels)
 *        { cn } from "@axis-ds/ui-react" -> @/registry/axis/lib/utils
 *      근거: shadcn 4.21.4 가 쓰는 @shadcn/registry 0.1.3 의 transformImport
 *      (dist/chunk-YOXNNYPQ.js) 는 `^@/registry/(.+)/lib/utils$` 를 components.json 의 aliases.utils 로,
 *      `^@/registry/(.+)/lib` 를 aliases.lib 로 바꿉니다(보통 @/lib/utils · @/lib/agentic-a11y-labels).
 *      registry:lib 파일은 path 에서 마지막 `lib/` 뒤를 lib 폴더 아래 경로로 씁니다(resolveNestedFilePath).
 *      앞선 실측: `@/registry/new-york/lib/utils` 로 바꾼 badge 가 `@/lib/utils` 로 변환되어 tsc 통과,
 *      `../utils` 그대로인 badge 는 TS2307(WI-0045 측정 format).
 *   2. dependencies · registryDependencies 는 손 메타가 아니라 content 의 import 스캔으로 만듭니다(WI-0047 흡수).
 *      react · react-dom 은 앱이 가진 것으로 보고 넣지 않습니다.
 *      registryDependencies 는 레지스트리 절대 URL `<공개 URL>/<이름>.json` 으로 내보냅니다(WI-0045 D5, 2026-10-21).
 *      접두 없는 이름은 shadcn CLI 가 공식 레지스트리(ui.shadcn.com)로 풀어 AC5 가 깨지기 때문입니다.
 *      공개 URL 은 AXIS_REGISTRY_PUBLIC_URL(없으면 https://axis-design-system.pages.dev/r, registry-integrity.mjs 한 곳)
 *      이고, axis CLI 는 URL 의 basename 을 이름으로 풀어 지금 읽는 레지스트리 안에서 찾습니다.
 *   3. 각 패키지 scripts/client-modules.mjs(WI-0050 SSOT)에 있는 모듈은 content 맨 앞에 "use client" 를 붙입니다.
 *   4. 레지스트리 사본에서만 `export interface X extends Y {}` 를 `export type X = Y;` 로 바꿉니다(WI-0045 D6).
 *      바로 위 JSDoc 이 「Props 인터페이스」처럼 interface 를 가리키면 그 주석도 「Props 타입」으로 맞춥니다.
 *      create-next-app 기본 ESLint(@typescript-eslint/no-empty-object-type)를 통과시키기 위해서입니다.
 *      패키지 소스는 interface 를 유지합니다(WI-0034 D5: type 으로 바꾸면 소비자의 선언 병합이 TS2300 으로 깨짐).
 *      복사 설치본은 사용자 코드라 '@axis-ds/ui-react' 모듈 선언 병합 대상이 아닙니다.
 *
 * 생성 뒤 G1(scripts/registry-integrity.mjs)이 디스크의 산출물을 다시 읽어 import 가 닫혀 있는지 검사하고,
 * 위반이 있으면 rc 1 로 끝납니다(FR-7).
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { CLIENT_MODULES as UI_CLIENT_MODULES } from "../packages/axis-ui-react/scripts/client-modules.mjs";
import { CLIENT_MODULES as AGENTIC_CLIENT_MODULES } from "../packages/axis-agentic-ui/scripts/client-modules.mjs";
import {
  scanImports,
  classifySpecifier,
  registryImportOf,
  itemSha256,
  checkRegistryDir,
  hasUseClientDirective,
  registryPublicUrl,
  registryDependencyUrl,
  REGISTRY_NAME_PATTERN,
} from "./registry-integrity.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** 배포되는 유일한 출력 위치(CI frontend.yml 이 build:registry 로 다시 만들고 apps/web/out/r 로 배포) */
export const OUTPUT_DIR = "apps/web/public/r";

const PACKAGES = [
  {
    name: "axis-ui-react",
    prefix: "",
    path: "packages/axis-ui-react",
    clientModules: UI_CLIENT_MODULES,
  },
  {
    name: "axis-agentic-ui",
    prefix: "agentic-",
    path: "packages/axis-agentic-ui",
    clientModules: AGENTIC_CLIENT_MODULES,
  },
];

/**
 * 워크스페이스 패키지 import 를 lib 항목으로 바꾸는 표. 이름 있는 import 가 모두 허용 목록 안일 때만 바꿉니다.
 * 그 밖의 이름을 import 하면 바꾸지 않고, G1 이 워크스페이스 의존으로 실패시킵니다.
 */
const PACKAGE_IMPORT_TO_LIB = [
  { specifier: "@axis-ds/ui-react", names: ["cn"], libItem: "utils" },
];

const USE_CLIENT = '"use client";\n\n';

/** 메타 항목의 소스 파일(패키지 루트 기준). ui 는 src/<name>/index.tsx, lib 은 meta.source */
function sourcePathOf(metaItem) {
  if (metaItem.type === "registry:lib") {
    const src = metaItem.meta?.source;
    if (!src) throw new Error(`${metaItem.name}: registry:lib 항목에 meta.source 가 없음`);
    return src;
  }
  return `src/${metaItem.name}/index.tsx`;
}

/** 패키지 소스 기준 모듈 경로(확장자 없이). client-modules.mjs 의 path 와 같은 형식 */
function moduleIdOf(srcPath) {
  return srcPath.replace(/^src\//, "").replace(/\.(tsx?|jsx?)$/, "");
}

/** 꺾쇠 · 괄호 밖에 쉼표가 있는지(extends 가 둘 이상인지) */
function hasTopLevelComma(text) {
  let depth = 0;
  for (const ch of text) {
    if (ch === "<" || ch === "(" || ch === "[") depth++;
    else if (ch === ">" || ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) return true;
  }
  return false;
}

/**
 * 레지스트리 사본 전용: extends 하나뿐인 빈 interface 를 type alias 로.
 * extends 가 둘 이상인 빈 interface(badge · label 등)는 규칙이 허용하므로 그대로 둡니다
 * (create-next-app 기본 ESLint 실측에서 card · separator 2건만 걸림).
 */
export function emptyInterfaceToType(content) {
  return content.replace(
    /(\/\*\*(?:(?!\*\/)[\s\S])*?\*\/\s*)?export interface (\w+)\s+extends\s+([^{};]+?)\s*\{\s*\}/g,
    (match, doc, name, base) => {
      if (hasTopLevelComma(base)) return match;
      // 바로 위 JSDoc 의 「인터페이스」는 type 으로 바뀐 선언과 어긋나므로 「타입」으로 맞춥니다(D6)
      const fixedDoc = doc ? doc.replace(/인터페이스/g, "타입") : "";
      return `${fixedDoc}export type ${name} = ${base.trim()};`;
    }
  );
}

/**
 * import 지정자 재작성. sourceAbsPath: 이 content 의 원본 파일 절대 경로
 * libBySource: Map<원본 절대 경로(확장자 없이), 표준 import 지정자>
 * libByName: Map<항목 이름, 표준 import 지정자>
 */
export function rewriteImports(content, fileName, sourceAbsPath, libBySource, libByName) {
  const edits = [];
  for (const imp of scanImports(content, fileName)) {
    let to = null;
    if (imp.specifier.startsWith(".")) {
      const abs = path.resolve(path.dirname(sourceAbsPath), imp.specifier).replace(/\.(tsx?|jsx?)$/, "");
      to = libBySource.get(abs) ?? libBySource.get(path.join(abs, "index")) ?? null;
    } else {
      const rule = PACKAGE_IMPORT_TO_LIB.find((r) => r.specifier === imp.specifier);
      if (
        rule &&
        imp.namedImports &&
        imp.namedImports.length > 0 &&
        !imp.defaultImport &&
        !imp.namespaceImport &&
        imp.namedImports.every((n) => rule.names.includes(n))
      ) {
        to = libByName.get(rule.libItem) ?? null;
      }
    }
    if (to) edits.push({ start: imp.start, end: imp.end, text: JSON.stringify(to) });
  }
  let out = content;
  for (const e of edits.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  }
  return out;
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf-8"));
}

/** 레지스트리 전체를 메모리에 만듭니다. 반환: { version, items: [registry-item...] } */
export async function buildRegistry({ publicUrl = registryPublicUrl() } = {}) {
  const uiPkg = await readJson(path.join(ROOT, "packages/axis-ui-react/package.json"));
  const version = uiPkg.version;

  // 1단계: 메타 수집과 lib 항목 위치 표
  const entries = [];
  const libBySource = new Map();
  const libByName = new Map();
  for (const pkg of PACKAGES) {
    const meta = await readJson(path.join(ROOT, pkg.path, "registry", "registry.json"));
    const clientIds = new Set(pkg.clientModules.map((m) => m.path));
    for (const metaItem of meta.items) {
      const name = `${pkg.prefix}${metaItem.name}`;
      const srcRel = sourcePathOf(metaItem);
      const srcAbs = path.join(ROOT, pkg.path, srcRel);
      const filePath = metaItem.files[0].path;
      entries.push({ pkg, metaItem, name, srcRel, srcAbs, filePath, clientIds });
      if (metaItem.type === "registry:lib") {
        const spec = registryImportOf(filePath);
        if (!spec) throw new Error(`${name}: lib 항목 path 는 registry/axis/ 아래여야 함(${filePath})`);
        libBySource.set(srcAbs.replace(/\.(tsx?|jsx?)$/, ""), spec);
        libByName.set(name, spec);
      }
    }
  }
  const registryImports = new Map();
  for (const [name, spec] of libByName) registryImports.set(spec, name);

  // 2단계: content 정규화와 의존성 스캔
  const items = [];
  for (const { pkg, metaItem, name, srcRel, srcAbs, filePath, clientIds } of entries) {
    let content = await fs.readFile(srcAbs, "utf-8");
    content = rewriteImports(content, filePath, srcAbs, libBySource, libByName);
    if (metaItem.type === "registry:ui") content = emptyInterfaceToType(content);

    const moduleId = moduleIdOf(srcRel);
    const hasDirective = hasUseClientDirective(content, filePath);
    if (clientIds.has(moduleId) && !hasDirective) content = USE_CLIENT + content;
    if (!clientIds.has(moduleId) && hasDirective) {
      throw new Error(`${name}: client-modules.mjs 에 없는데 소스에 "use client" 가 있음(${pkg.name}/${srcRel})`);
    }

    const deps = new Set();
    const regDeps = new Set();
    const problems = [];
    for (const imp of scanImports(content, filePath)) {
      const c = classifySpecifier(imp.specifier, registryImports);
      if (c.kind === "package") deps.add(c.name);
      else if (c.kind === "registry" && c.itemName !== name) regDeps.add(c.itemName);
      else if (c.kind === "error") problems.push(c.reason);
    }
    if (problems.length > 0) {
      // 여기서 멈추지 않고 그대로 내보내 G1 이 같은 위반을 독립적으로 보고하게 합니다
      console.warn(`  경고: ${name}: ${problems.join("; ")}`);
    }

    const item = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name,
      type: metaItem.type,
      title: metaItem.title,
      description: metaItem.description,
      dependencies: [...deps].sort(),
      registryDependencies: [...regDeps].sort().map((dep) => registryDependencyUrl(publicUrl, dep)),
      files: [{ path: filePath, type: metaItem.files[0].type, content }],
    };
    items.push(item);
  }
  return { version, items };
}

/**
 * 출력 전에 지울 낡은 레지스트리 파일 이름 목록.
 * - owned(배포 위치 OUTPUT_DIR): 이 스크립트만 쓰는 디렉터리라 *.json 전부
 * - 그 밖(`--out`): 없거나 비어 있으면 없음. index.json 이 있는 레지스트리 디렉터리면
 *   index.json · registry.json 과 기존 index 의 항목 이름(slug) 파일만. 그 외의 디렉터리는 거부(관계없는 json 보호)
 */
export async function staleRegistryFiles(outDir, { owned }) {
  let entries;
  try {
    entries = await fs.readdir(outDir);
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
  if (owned) return entries.filter((f) => f.endsWith(".json"));
  if (entries.length === 0) return [];
  const refuse = (why) =>
    new Error(`--out 디렉터리(${outDir})는 비어 있거나 이 스크립트가 만든 레지스트리(index.json)여야 함: ${why}`);
  if (!entries.includes("index.json")) throw refuse("index.json 이 없음");
  let index;
  try {
    index = JSON.parse(await fs.readFile(path.join(outDir, "index.json"), "utf8"));
  } catch (e) {
    throw refuse(`index.json 을 읽지 못함(${e.message})`);
  }
  if (!index || !Array.isArray(index.items)) throw refuse("index.json 에 items 배열이 없음");
  const names = new Set(["index.json", "registry.json"]);
  for (const it of index.items) {
    if (it && typeof it.name === "string" && REGISTRY_NAME_PATTERN.test(it.name)) names.add(`${it.name}.json`);
  }
  return entries.filter((f) => names.has(f));
}

export async function writeRegistry({ version, items }, outDir, { owned = false } = {}) {
  // 낡은 항목 파일이 남지 않게 먼저 지웁니다. 지우는 범위는 staleRegistryFiles 가 정합니다
  const stale = await staleRegistryFiles(outDir, { owned });
  await fs.mkdir(outDir, { recursive: true });
  for (const f of stale) await fs.rm(path.join(outDir, f));

  const list = items.map((item) => ({
    name: item.name,
    type: item.type,
    title: item.title,
    description: item.description,
    sha256: itemSha256(item),
  }));

  for (const item of items) {
    await fs.writeFile(path.join(outDir, `${item.name}.json`), JSON.stringify(item, null, 2) + "\n");
  }

  const header = { name: "axis", homepage: "https://axis-design-system.pages.dev", version };
  // registry.json: shadcn 레지스트리 루트 형식
  await fs.writeFile(
    path.join(outDir, "registry.json"),
    JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", ...header, items: list }, null, 2) + "\n"
  );
  // index.json: 같은 목록(컬렉터 · axis CLI 가 ${registryUrl}/index.json 을 조회)
  await fs.writeFile(path.join(outDir, "index.json"), JSON.stringify({ ...header, items: list }, null, 2) + "\n");
  return outDir;
}

/** `--out <디렉터리>` 인자. 없으면 배포 위치(OUTPUT_DIR) */
function outDirFromArgs(argv) {
  const i = argv.indexOf("--out");
  if (i < 0) return path.join(ROOT, OUTPUT_DIR);
  const v = argv[i + 1];
  if (!v || v.startsWith("--")) throw new Error("--out 뒤에 디렉터리가 필요함");
  return path.resolve(v);
}

async function main() {
  const outDirArg = outDirFromArgs(process.argv.slice(2));
  const publicUrl = registryPublicUrl();
  console.log(`AXIS 레지스트리 빌드 시작 (registryDependencies 공개 URL ${publicUrl})`);
  const registry = await buildRegistry({ publicUrl });
  for (const item of registry.items) {
    const deps = item.dependencies.join(", ") || "-";
    const reg = item.registryDependencies.join(", ") || "-";
    console.log(`  - ${item.name}  deps: ${deps}  registry: ${reg}`);
  }
  const outDir = await writeRegistry(registry, outDirArg, { owned: outDirArg === path.join(ROOT, OUTPUT_DIR) });
  console.log(`  ${registry.items.length}개 항목 -> ${path.relative(ROOT, outDir) || outDir}/ (version ${registry.version})`);

  // G1: 디스크 산출물을 다시 읽어 검사
  const { measured, errors, checkedItems } = checkRegistryDir(outDir, { publicUrl });
  if (!measured) throw new Error(`G1 측정 실패: ${errors.join("; ")}`);
  if (errors.length > 0) {
    console.error(`G1 실패: ${errors.length}건`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
    return;
  }
  if (checkedItems !== registry.items.length) {
    throw new Error(`G1 검사 항목 수(${checkedItems})가 생성 항목 수(${registry.items.length})와 다름`);
  }
  console.log(`G1 통과: ${checkedItems}개 항목의 import 가 dependencies · registryDependencies 로 닫혀 있음`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
