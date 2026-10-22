/**
 * axis add · list (WI-0045 FR-4 · FR-5 · D3)
 *
 * 레지스트리(원격 1차, 실패하면 CLI 동봉본, src/registry)에서 항목을 읽어 프로젝트에 복사합니다.
 *
 * 순서
 *  1. 요청 이름 정리(`--agentic` 은 `agentic-` 접두 별칭, 이미 붙은 이름은 그대로)
 *  2. index 로 이름 확인. 하나라도 없으면 없는 이름을 모두 알리고 아무것도 쓰지 않습니다(rc 1)
 *  3. registryDependencies 를 재귀로 모읍니다(순환 방지 · 중복 제거, 의존 항목이 먼저). 모으는 도중 원격이 실패해
 *     동봉본으로 바뀌면 처음부터 동봉본으로 다시 모읍니다(한 실행 안에서 출처를 섞지 않음)
 *  4. 배치: ui 는 componentsDir, agentic- 항목은 agenticDir(없으면 componentsDir 의 형제 agentic),
 *     lib 은 componentsDir(utils 는 init 이 쓰는 componentsDir/utils.ts 와 같은 위치). 파일 이름은 file.path 의
 *     basename 만 씁니다(file.path 를 그대로 join 하면 components/ui/components/ui/... 처럼 이중이 됩니다).
 *     file.path · target 이 절대 경로이거나 `..` · `.` 세그먼트 · 역슬래시를 포함하거나, 파일 이름이 .ts · .tsx 가
 *     아니면 거부합니다(AC3, rc 1 · 아무것도 쓰지 않음). 레지스트리 항목 파일은 모두 이 형태입니다
 *  5. import 재작성: 레지스트리 표준 형태(`@/registry/<style>/lib/<name>` 와 `@/<file.path 확장자 제외>`)를 설치 위치
 *     기준 상대 경로(POSIX 구분자)로 바꿉니다. 바꿀 대상이 없는 표준 형태가 남으면 쓰기 전에 실패합니다.
 *     주석 · 문자열 · 템플릿 글자 안에서 시작하는 지정자는 바꾸지도 판정하지도 않습니다. build 쪽 G1 은 TypeScript AST 로
 *     스캔하고 여기는 런타임 의존을 늘리지 않으려고 상태 기계(nonCodeRanges)로 가립니다. 정규식 리터럴처럼 상태 기계가
 *     다루지 않는 형태에서는 두 판정이 다를 수 있습니다
 *  6. 경로 이탈 검사(쓰기 전 전체 · 쓰기 직전 파일마다): 가장 가까운 기존 상위 디렉터리와 만든 뒤 부모 디렉터리의
 *     realpath 가 프로젝트 루트 안인지, 기존 파일이 밖을 가리키는 링크가 아닌지 봅니다. 쓴 뒤에는 realpath(대상)를 다시
 *     보고 프로젝트 밖이면 지우지 않고 그 경로를 알린 뒤 rc 1 로 끝냅니다(검사와 쓰기 사이에 상위 디렉터리가 바뀌는 동시
 *     경합 감지, m3: 밖의 파일은 사용자 것일 수 있어 이 CLI 가 지우지 않음)
 *  7. 덮어쓰기(D3): 같은 내용은 건너뜀, 다르면 대화형은 묻고 `-y` 는 건너뛰며 목록 안내, `--overwrite` 만 덮어씀.
 *     기존 대상 파일이 심볼릭 링크여도(프로젝트 밖을 가리켜도, D15) 내용이 같거나 `-y` 로 건너뛰면 쓰지 않으므로 통과합니다.
 *     실제로 써야 하는 링크만 쓰기 전에 거부 사유로 모아 아무것도 쓰지 않습니다(D12 · D15, lstat). 밖을 가리키는 링크를
 *     건너뛸 때는 그 사실을 출력에 함께 적습니다. 출력은 새로 만든 파일 `+`, 덮어쓴 파일 `~` 로 구분합니다(m2).
 *     새 파일은 O_EXCL 로 열어, 판정 뒤(확인 대기 중 등) 같은 이름의 파일이 생겼으면 덮어쓰지 않고 rc 1 로 끝냅니다(n3).
 *     덮어써야 하는 일반 파일이 하드링크(nlink 2 이상)면 쓰기 전에 거부하고, 쓰기 직전 연 fd 의 fstat 로 한 번 더 봅니다(D19).
 *     쓰기 헬퍼는 init 과 같이 쓰려고 safe-write.ts 에 있습니다(D17)
 *  8. 설치 뒤 재작성한 상대 import 가 실제 파일을 가리키는지 검사
 *  9. 설치한 항목 전체의 dependencies 중 package.json 에 없는 것만 설치 명령으로 안내(설치는 하지 않음)
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import fs from "fs-extra";
import { readAxisConfig, type AxisConfig } from "../config/axis-config.js";
import {
  RegistryClient,
  RegistryError,
  LEGACY_REGISTRY_NOTICE,
  isValidRegistryName,
  resolveRegistryUrl,
  type RegistryIndex,
  type RegistryItem,
} from "../registry/index.js";
import { detectInstallCommand, hasDependency, isPlainObject } from "../theme/theme-add.js";
import { detectTailwind } from "../template/tailwind-core.js";
import { selectUtilsDependencies } from "../init/init.js";
import {
  HARDLINK_ERROR_CODE,
  checkParentInside,
  escapeReason,
  hardLinkCount,
  hardLinkMessage,
  isSymlink,
  outsideLinkTarget,
  writeNoFollow,
  writtenOutside,
} from "./safe-write.js";

// 경로 이탈 · 링크 판정 · O_NOFOLLOW 쓰기는 init 의 utils.ts 쓰기(D17)와 함께 쓰려고 safe-write.ts 로 옮겼습니다. 종전 이름은 그대로 내보냅니다
export { escapeReason, isSameOrInside, outsideLinkTarget, writtenOutside } from "./safe-write.js";

/** agentic 항목 이름 접두 */
export const AGENTIC_PREFIX = "agentic-";

export interface AddOptions {
  agentic?: boolean;
  yes?: boolean;
  overwrite?: boolean;
}

/** 대화형 확인. true 면 덮어씁니다 */
export type ConfirmFn = (message: string) => Promise<boolean>;

type Log = (...args: unknown[]) => void;

export interface AddContext {
  client: RegistryClient;
  log?: Log;
  error?: Log;
  confirm?: ConfirmFn;
}

/** `--agentic` 별칭. 이미 `agentic-` 로 시작하면 그대로 둡니다 */
export function applyAgenticAlias(name: string, agentic: boolean | undefined): string {
  if (!agentic || name.startsWith(AGENTIC_PREFIX)) return name;
  return `${AGENTIC_PREFIX}${name}`;
}

/** 이름 하나의 오류 안내. 다른 쪽(ui · agentic)에 비슷한 이름이 있으면 함께 알려 줍니다 */
export function describeMissingName(
  requested: string,
  resolved: string,
  index: RegistryIndex,
  agentic: boolean | undefined
): string {
  const names = new Set(index.items.map((it) => it.name));
  if (!isValidRegistryName(resolved)) {
    return `'${requested}': 이름 규칙(소문자 · 숫자 · 하이픈)에 맞지 않습니다`;
  }
  if (agentic && resolved !== requested && names.has(requested)) {
    return `'${requested}': Agentic UI 에 '${resolved}' 가 없습니다. '${requested}' 는 Core UI 항목이니 --agentic 없이 실행하세요`;
  }
  if (!agentic && names.has(`${AGENTIC_PREFIX}${requested}`)) {
    return `'${requested}': 없습니다. Agentic UI 항목 '${AGENTIC_PREFIX}${requested}' 를 뜻했다면 전체 이름을 쓰거나 --agentic 을 붙이세요`;
  }
  return `'${requested}': 레지스트리에 없습니다`;
}

/** 설치 위치 설정. 경로는 프로젝트 루트 기준 상대 경로 그대로 둡니다(출력용) */
export interface InstallLayout {
  root: string;
  componentsDir: string;
  agenticDir: string;
}

/** axis.config.json 에서 배치 위치를 고릅니다. agenticDir 이 없으면 componentsDir 의 형제 agentic 입니다 */
export function layoutFromConfig(root: string, config: AxisConfig): InstallLayout {
  const componentsRaw = config.componentsDir;
  if (typeof componentsRaw !== "string" || componentsRaw.trim() === "") {
    throw new Error("axis.config.json 에 componentsDir 가 없습니다. 'npx @axis-ds/cli init' 을 다시 실행하거나 직접 적으세요");
  }
  const agenticRaw = (config as { agenticDir?: unknown }).agenticDir;
  if (agenticRaw !== undefined && (typeof agenticRaw !== "string" || agenticRaw.trim() === "")) {
    throw new Error("axis.config.json 의 agenticDir 가 문자열이 아닙니다");
  }
  // Windows 에서 적은 역슬래시 경로(src\\components\\ui)도 같은 위치로 읽도록 '/' 로 맞춥니다.
  // 맞추지 않으면 POSIX 에서 dirname 이 '.' 이 되어 agentic 이 프로젝트 루트로 갑니다
  const componentsDir = componentsRaw.replace(/\\/g, "/");
  const agenticDir =
    typeof agenticRaw === "string"
      ? agenticRaw.replace(/\\/g, "/")
      : path.posix.join(path.posix.dirname(componentsDir), "agentic");
  return { root: path.resolve(root), componentsDir, agenticDir };
}

/** 플랫폼 구분자를 `/` 로. impl 은 테스트에서 path.win32 를 넣어 Windows 변환을 고정하려고 받습니다 */
export function toPosix(p: string, impl: path.PlatformPath = path): string {
  return p.split(impl.sep).join("/");
}

export type ItemKind = "ui" | "agentic" | "lib";

/** 항목 종류. lib 은 type 으로, agentic 은 이름 접두로 가립니다 */
export function itemKind(item: Pick<RegistryItem, "name" | "type">): ItemKind {
  if (item.type === "registry:lib") return "lib";
  return item.name.startsWith(AGENTIC_PREFIX) ? "agentic" : "ui";
}

/** 설치할 수 있는 파일 이름(.ts · .tsx). 레지스트리 항목 파일은 모두 이 형태입니다 */
const INSTALL_FILE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*\.tsx?$/;

/**
 * 레지스트리 파일 경로(file.path · target) 검사. 절대 경로 · 드라이브 문자 · 역슬래시 · `..` 와 `.` 세그먼트 · 빈
 * 세그먼트를 거부합니다. basename 만 쓰므로 이탈은 원래 일어나지 않지만, 이런 경로는 레지스트리가 만들지 않는 형태라
 * 조용히 평탄화하지 않고 거부합니다(AC3). 문제가 있으면 이유를, 없으면 null 을 돌려줍니다.
 */
export function registryPathProblem(p: string): string | null {
  if (p.length === 0) return "비어 있음";
  if (p.includes("\0")) return "NUL 문자";
  if (p.includes("\\")) return "역슬래시";
  if (p.startsWith("/") || /^[A-Za-z]:/.test(p)) return "절대 경로";
  const segments = p.split("/");
  if (segments.some((seg) => seg === "" || seg === "." || seg === "..")) return "`..` · `.` · 빈 세그먼트";
  return null;
}

/** 파일 하나의 설치 위치(프로젝트 루트 기준 절대 경로). file.path 의 basename 만 씁니다 */
export function placeFile(
  layout: InstallLayout,
  item: Pick<RegistryItem, "name" | "type">,
  filePath: string,
  target?: string
): string {
  for (const p of target === undefined ? [filePath] : [filePath, target]) {
    const problem = registryPathProblem(p);
    if (problem) throw new Error(`${item.name}: 파일 경로가 올바르지 않습니다(${JSON.stringify(p)}, ${problem})`);
  }
  const base = path.posix.basename(filePath);
  if (!INSTALL_FILE_NAME_PATTERN.test(base)) {
    throw new Error(`${item.name}: 파일 경로가 올바르지 않습니다(${JSON.stringify(filePath)}, 파일 이름은 .ts · .tsx 만 설치합니다)`);
  }
  const dir = itemKind(item) === "agentic" ? layout.agenticDir : layout.componentsDir;
  return path.resolve(layout.root, dir, base);
}

/** 확장자를 뗀 경로 */
function stripExt(p: string): string {
  return p.replace(/\.(?:tsx?|jsx?|mjs|cjs)$/, "");
}

/**
 * 표준 형태 import 를 설치 위치로 바꾸는 표.
 *  - `@/<file.path 확장자 제외>` (예: `@/registry/axis/lib/utils`, `@/components/ui/button`)
 *  - lib 파일은 style 이름과 관계없이 `@/registry/<style>/lib/<파일 이름>` 도 받습니다(shadcn transformImport 와 같은 기준)
 */
export interface ImportTargets {
  exact: Map<string, string>;
  lib: Map<string, string>;
}

export function buildImportTargets(entries: { item: RegistryItem; file: { path: string }; target: string }[]): ImportTargets {
  const exact = new Map<string, string>();
  const lib = new Map<string, string>();
  for (const { item, file, target } of entries) {
    const rel = stripExt(file.path.replace(/\\/g, "/").replace(/^\.?\//, ""));
    exact.set(`@/${rel}`, target);
    if (itemKind(item) === "lib") lib.set(path.posix.basename(rel), target);
  }
  return { exact, lib };
}

/** 코드가 아닌 구간: 주석과 문자열 · 템플릿 리터럴의 글자 부분([시작, 끝)) */
export interface NonCodeRanges {
  comments: [number, number][];
  strings: [number, number][];
}

/**
 * 코드가 아닌 구간을 찾는 상태 기계. 문자열(' ")과 템플릿(`) 안의 `//` · `/*` 는 주석으로 보지 않고,
 * 템플릿 `${}` 안은 코드로 보고 중첩(템플릿 안 템플릿, 중괄호)을 따라갑니다.
 * 정규식 리터럴은 따로 다루지 않습니다(레지스트리 소스에서 import 지정자 판정에만 씁니다).
 */
export function nonCodeRanges(src: string): NonCodeRanges {
  const comments: [number, number][] = [];
  const strings: [number, number][] = [];

  /** 템플릿 하나를 읽고 닫는 ` 다음 위치를 돌려줍니다. 글자 부분만 strings 에 넣습니다 */
  function scanTemplate(start: number): number {
    let i = start + 1;
    let seg = start;
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") {
        i += 2;
      } else if (c === "`") {
        strings.push([seg, i + 1]);
        return i + 1;
      } else if (c === "$" && src[i + 1] === "{") {
        strings.push([seg, i]);
        i = scanCode(i + 2, true);
        // scanCode 는 닫는 } 위치를 돌려줍니다
        seg = i;
        i++;
      } else {
        i++;
      }
    }
    strings.push([seg, src.length]);
    return src.length;
  }

  /** 코드 구간을 읽습니다. untilBrace 면 짝이 맞는 닫는 } 위치에서 멈춥니다 */
  function scanCode(start: number, untilBrace: boolean): number {
    let i = start;
    let depth = 0;
    while (i < src.length) {
      const c = src[i];
      if (c === "/" && src[i + 1] === "/") {
        const end = src.indexOf("\n", i);
        const stop = end === -1 ? src.length : end;
        comments.push([i, stop]);
        i = stop;
      } else if (c === "/" && src[i + 1] === "*") {
        const end = src.indexOf("*/", i + 2);
        const stop = end === -1 ? src.length : end + 2;
        comments.push([i, stop]);
        i = stop;
      } else if (c === '"' || c === "'") {
        const s = i;
        i++;
        while (i < src.length && src[i] !== c && src[i] !== "\n") {
          if (src[i] === "\\") i++;
          i++;
        }
        i = Math.min(i + 1, src.length);
        strings.push([s, i]);
      } else if (c === "`") {
        i = scanTemplate(i);
      } else if (c === "{") {
        depth++;
        i++;
      } else if (c === "}") {
        if (untilBrace && depth === 0) return i;
        depth = Math.max(0, depth - 1);
        i++;
      } else {
        i++;
      }
    }
    return src.length;
  }

  scanCode(0, false);
  return { comments, strings };
}

/** 주석 구간([시작, 끝)) 목록(nonCodeRanges 의 주석 부분) */
export function commentRanges(src: string): [number, number][] {
  return nonCodeRanges(src).comments;
}

function insideRanges(ranges: [number, number][], at: number): boolean {
  return ranges.some(([a, b]) => at >= a && at < b);
}

/** import · export from · 동적 import · require 의 모듈 지정자 */
const SPECIFIER_PATTERN =
  /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(["'])(@\/[^"'\n]+)\2/g;
const STANDARD_LIB_PATTERN = /^@\/registry\/[^/]+\/lib\/(.+)$/;

/** 설치 파일 기준 상대 지정자(POSIX). 확장자는 붙이지 않습니다 */
export function relativeSpecifier(fromFile: string, toFile: string, impl: path.PlatformPath = path): string {
  let rel = toPosix(impl.relative(impl.dirname(fromFile), stripExt(toFile)), impl);
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

export interface RewriteResult {
  content: string;
  /** 바꾼 지정자와 가리키는 파일 */
  rewritten: { from: string; to: string; target: string }[];
  /** 바꿀 대상이 없는 `@/registry/` 지정자 */
  unresolved: string[];
}

/** 표준 형태 import 를 상대 경로로 바꿉니다 */
export function rewriteImports(content: string, fileTarget: string, targets: ImportTargets): RewriteResult {
  const rewritten: RewriteResult["rewritten"] = [];
  const unresolved: string[] = [];
  const { comments, strings } = nonCodeRanges(content);
  const out = content.replace(SPECIFIER_PATTERN, (whole, lead: string, quote: string, spec: string, offset: number) => {
    // 주석 · 문자열 안에서 시작하는 것은 코드가 아니므로 바꾸지 않고 미해석으로도 세지 않습니다.
    // offset 은 from · import 같은 앞부분 위치라, 지정자 자체의 문자열 리터럴은 여기에 걸리지 않습니다
    if (insideRanges(comments, offset) || insideRanges(strings, offset)) return whole;
    let target = targets.exact.get(spec);
    if (target === undefined) {
      const m = STANDARD_LIB_PATTERN.exec(spec);
      if (m) target = targets.lib.get(m[1]);
    }
    if (target === undefined) {
      if (spec.startsWith("@/registry/")) unresolved.push(spec);
      return whole;
    }
    const to = relativeSpecifier(fileTarget, target);
    rewritten.push({ from: spec, to, target });
    return `${lead}${quote}${to}${quote}`;
  });
  return { content: out, rewritten, unresolved };
}

const RESOLVE_EXTS = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", "/index.ts", "/index.tsx", "/index.js"];

/** 상대 지정자가 실제 파일을 가리키는지(TypeScript 해석과 같은 확장자 후보) */
export function relativeSpecifierResolves(fromFile: string, spec: string): boolean {
  const base = path.resolve(path.dirname(fromFile), spec);
  return RESOLVE_EXTS.some((ext) => {
    try {
      // statSync 는 링크를 따라갑니다(링크된 파일도 해석되므로 같은 판정)
      return statSync(base + ext).isFile();
    } catch {
      return false;
    }
  });
}

export interface PlannedFile {
  item: RegistryItem;
  /** 레지스트리의 file.path */
  sourcePath: string;
  /** 설치 위치(절대 경로) */
  target: string;
  content: string;
  rewritten: RewriteResult["rewritten"];
}

/**
 * registryDependencies 를 재귀로 모읍니다. 의존 항목이 먼저 오고, 순환은 한 번만 방문해 끊습니다.
 * 없는 의존 항목은 missing 에 모읍니다(요청 이름과 같이 rc 1).
 */
export async function collectItems(
  client: RegistryClient,
  roots: string[]
): Promise<{ items: RegistryItem[]; missingDeps: { name: string; from: string }[] }> {
  const first = await collectOnce(client, roots);
  // 원격에서 일부를 받은 뒤 원격이 실패해 동봉본으로 바뀌었으면, 이미 받은 원격 항목을 버리고 동봉본으로 다시 모읍니다.
  // 동봉본으로 바뀐 뒤에는 다시 바뀌지 않으므로 두 번째 수집에서 끝납니다.
  if (first.origin === "remote" && client.origin === "bundled") return collectOnce(client, roots);
  return first;
}

async function collectOnce(
  client: RegistryClient,
  roots: string[]
): Promise<{ items: RegistryItem[]; missingDeps: { name: string; from: string }[]; origin: RegistryClient["origin"] }> {
  const index = await client.getIndex();
  const origin = client.origin;
  const known = new Set(index.items.map((it) => it.name));
  const visited = new Set<string>();
  const items: RegistryItem[] = [];
  const missingDeps: { name: string; from: string }[] = [];

  async function visit(name: string): Promise<void> {
    if (visited.has(name)) return;
    visited.add(name);
    const item = await client.getItem(name);
    for (const dep of item.registryDependencies) {
      if (!known.has(dep)) {
        missingDeps.push({ name: dep, from: name });
        continue;
      }
      await visit(dep);
    }
    items.push(item);
  }

  for (const root of roots) await visit(root);
  return { items, missingDeps, origin };
}

/** 설치 계획(쓰기 전). 오류가 있으면 아무것도 쓰지 않습니다 */
export function planFiles(layout: InstallLayout, items: RegistryItem[]): { files: PlannedFile[]; errors: string[] } {
  const errors: string[] = [];
  const placed: { item: RegistryItem; file: RegistryItem["files"][number]; target: string }[] = [];
  const byTarget = new Map<string, string>();
  for (const item of items) {
    for (const file of item.files) {
      let target: string;
      try {
        target = placeFile(layout, item, file.path, file.target);
      } catch (error) {
        errors.push((error as Error).message);
        continue;
      }
      const prev = byTarget.get(target);
      if (prev !== undefined) {
        errors.push(`${item.name}: ${toPosix(path.relative(layout.root, target))} 를 ${prev} 와 함께 씁니다(같은 위치)`);
        continue;
      }
      byTarget.set(target, item.name);
      placed.push({ item, file, target });
    }
  }
  const targets = buildImportTargets(placed);
  const files: PlannedFile[] = [];
  for (const { item, file, target } of placed) {
    const r = rewriteImports(file.content, target, targets);
    for (const spec of r.unresolved) {
      errors.push(`${item.name}: import '${spec}' 를 설치 위치로 바꿀 수 없습니다(registryDependencies 에 해당 항목이 없음)`);
    }
    files.push({ item, sourcePath: file.path, target, content: r.content, rewritten: r.rewritten });
  }
  for (const f of files) {
    const reason = escapeReason(layout.root, f.target, { allowOutsideLink: true });
    if (reason) errors.push(`${f.item.name}: ${reason}. 쓰지 않습니다`);
    // 기존 대상이 심볼릭 링크인 경우(프로젝트 밖을 가리켜도)는 덮어쓰기 판정 뒤(runAdd)에 봅니다. 내용이 같거나 -y 로
    // 건너뛰는 링크는 쓰지 않으므로 통과하고, 실제로 써야 하는 링크만 쓰기 전에 거부합니다(D12 · D15)
  }
  return { files, errors };
}

/** package.json 에 없는 dependencies(이름 순). clsx · tailwind-merge 는 init 과 같은 범위를 붙입니다 */
export function missingDependencies(root: string, items: RegistryItem[]): { specs: Record<string, string | undefined>; installCommand: string } {
  const installCommand = detectInstallCommand(root);
  let pkg: Record<string, unknown> | undefined;
  try {
    const text = readFileSync(path.join(root, "package.json"), "utf8").replace(/^﻿/, "");
    const parsed: unknown = JSON.parse(text);
    pkg = isPlainObject(parsed) ? parsed : undefined;
  } catch {
    pkg = undefined;
  }
  const ranges = selectUtilsDependencies(detectTailwind(root, pkg));
  const specs: Record<string, string | undefined> = {};
  for (const item of items) {
    for (const dep of item.dependencies) {
      const name = dependencyName(dep);
      if (pkg !== undefined && hasDependency(pkg, name) !== undefined) continue;
      if (name in specs) continue;
      const explicit = dep.length > name.length ? dep.slice(name.length + 1) : undefined;
      specs[name] = explicit ?? (ranges as Record<string, string>)[name];
    }
  }
  const sorted: Record<string, string | undefined> = {};
  for (const name of Object.keys(specs).sort()) sorted[name] = specs[name];
  return { specs: sorted, installCommand };
}

/** `name@range` · `@scope/name@range` 에서 이름만 */
export function dependencyName(spec: string): string {
  const at = spec.indexOf("@", spec.startsWith("@") ? 1 : 0);
  return at > 0 ? spec.slice(0, at) : spec;
}

/** lockfile 에 맞춘 추가 명령. 범위가 있으면 따옴표로 감쌉니다(`^` 보존) */
export function addCommandForSpecs(installCommand: string, specs: Record<string, string | undefined>): string {
  const args = Object.entries(specs)
    .map(([name, range]) => (range ? `"${name}@${range}"` : name))
    .join(" ");
  if (installCommand.startsWith("yarn")) return `yarn add ${args}`;
  if (installCommand.startsWith("npm")) return `npm install ${args}`;
  return `pnpm add ${args}`;
}

export interface AddResult {
  exitCode: 0 | 1;
  /** 쓴 파일 전체(새로 만든 파일 + 덮어쓴 파일) */
  written: string[];
  /** written 가운데 기존 파일을 덮어쓴 것(m2) */
  overwritten: string[];
  unchanged: string[];
  skipped: string[];
}

function rel(root: string, p: string): string {
  return toPosix(path.relative(root, p));
}

/**
 * add 를 실행합니다. 반환값의 exitCode 를 호출한 쪽이 process.exitCode 로 씁니다.
 */
export async function runAdd(
  cwd: string,
  requested: string[],
  options: AddOptions,
  ctx: AddContext
): Promise<AddResult> {
  const log = ctx.log ?? console.log;
  const error = ctx.error ?? console.error;
  const root = path.resolve(cwd);
  const result: AddResult = { exitCode: 1, written: [], overwritten: [], unchanged: [], skipped: [] };

  if (requested.length === 0) {
    error("추가할 컴포넌트 이름을 하나 이상 적으세요. 목록: npx @axis-ds/cli list");
    return result;
  }

  let config: AxisConfig | null;
  try {
    config = await readAxisConfig(root);
  } catch (e) {
    error(`axis.config.json 을 읽지 못했습니다: ${(e as Error).message}`);
    return result;
  }
  if (!config) {
    error(
      "axis.config.json을 찾을 수 없습니다.\n" +
        "  해결: 프로젝트 루트에서 'npx @axis-ds/cli init'을 실행하세요.\n" +
        "  참고: https://axis.minu.best/docs/guides/quick-start"
    );
    return result;
  }
  let layout: InstallLayout;
  try {
    layout = layoutFromConfig(root, config);
  } catch (e) {
    error((e as Error).message);
    return result;
  }

  // 1 · 2. 이름 확인(하나라도 없으면 쓰지 않음)
  let index: RegistryIndex;
  try {
    index = await ctx.client.getIndex();
  } catch (e) {
    error(`레지스트리를 읽지 못했습니다: ${(e as Error).message}`);
    return result;
  }
  const names = new Set(index.items.map((it) => it.name));
  const resolved: string[] = [];
  const missing: string[] = [];
  for (const req of requested) {
    const name = applyAgenticAlias(req, options.agentic);
    if (!isValidRegistryName(name) || !names.has(name)) missing.push(describeMissingName(req, name, index, options.agentic));
    else if (!resolved.includes(name)) resolved.push(name);
  }
  if (missing.length > 0) {
    error(`컴포넌트를 찾을 수 없어 아무것도 설치하지 않았습니다(레지스트리 version ${index.version}).`);
    for (const m of missing) error(`  - ${m}`);
    error("  사용 가능한 목록: npx @axis-ds/cli list");
    return result;
  }

  // 3. 재귀 수집
  let items: RegistryItem[];
  try {
    const collected = await collectItems(ctx.client, resolved);
    if (collected.missingDeps.length > 0) {
      error("레지스트리 항목의 의존 항목이 레지스트리에 없어 아무것도 설치하지 않았습니다.");
      for (const d of collected.missingDeps) error(`  - ${d.from} → ${d.name}`);
      return result;
    }
    items = collected.items;
  } catch (e) {
    const msg = e instanceof RegistryError ? e.message : `레지스트리 항목을 읽지 못했습니다: ${(e as Error).message}`;
    error(msg);
    return result;
  }

  // 4 · 5 · 6. 계획(배치 · import 재작성 · 경로 이탈)
  const plan = planFiles(layout, items);
  if (plan.errors.length > 0) {
    error("설치할 수 없어 아무것도 쓰지 않았습니다.");
    for (const e of plan.errors) error(`  - ${e}`);
    return result;
  }

  // 기존 파일을 먼저 모두 읽습니다. 읽지 못하면(권한 없음 등) 예외로 끝내지 않고 모아 안내한 뒤,
  // 덮어쓰기 질문을 하기 전에 아무것도 쓰지 않고 멈춥니다
  const existing = new Map<PlannedFile, string | null>();
  const readErrors: string[] = [];
  for (const file of plan.files) {
    if (!existsSync(file.target)) {
      existing.set(file, null);
      continue;
    }
    try {
      existing.set(file, readFileSync(file.target, "utf8"));
    } catch (e) {
      readErrors.push(
        `${file.item.name}: 기존 파일 ${rel(root, file.target)} 을 읽지 못해 비교할 수 없습니다(${(e as NodeJS.ErrnoException).code ?? (e as Error).message})`
      );
    }
  }
  if (readErrors.length > 0) {
    error("설치할 수 없어 아무것도 쓰지 않았습니다.");
    for (const e of readErrors) error(`  - ${e}`);
    return result;
  }

  // 7. 덮어쓰기 판정(D3). overwrite 는 기존 파일을 덮어쓰는 쓰기입니다(출력 표시 구분, m2)
  const decisions: { file: PlannedFile; action: "write" | "overwrite" | "unchanged" | "skip" }[] = [];
  for (const file of plan.files) {
    const current = existing.get(file) ?? null;
    if (current === null) {
      decisions.push({ file, action: "write" });
      continue;
    }
    if (current === file.content) {
      decisions.push({ file, action: "unchanged" });
      continue;
    }
    if (options.overwrite) {
      decisions.push({ file, action: "overwrite" });
    } else if (options.yes || !ctx.confirm) {
      decisions.push({ file, action: "skip" });
    } else {
      const ok = await ctx.confirm(`${rel(root, file.target)} 의 내용이 레지스트리와 다릅니다. 덮어쓰시겠습니까?`);
      decisions.push({ file, action: ok ? "overwrite" : "skip" });
    }
  }

  // 실제로 써야 하는 대상이 심볼릭 링크면(프로젝트 안 · 밖 어느 쪽을 가리켜도) 아무것도 쓰지 않고 멈춥니다(D12 · D15).
  // 쓰기는 O_NOFOLLOW 라 링크에서 ELOOP 로 멈추므로, 그 전에 다른 파일이 쓰여 부분 설치가 남지 않게 쓰기 전에 모아 거부합니다.
  // 내용이 같아 건너뛰는 링크(unchanged)와 -y 로 건너뛰는 링크(skip)는 쓰지 않으므로 막지 않습니다
  const outsideLinks = new Map<PlannedFile, string>();
  for (const d of decisions) {
    const outside = outsideLinkTarget(root, d.file.target);
    if (outside !== null) outsideLinks.set(d.file, outside);
  }
  const linkErrors = decisions
    .filter((d) => (d.action === "write" || d.action === "overwrite") && isSymlink(d.file.target))
    .map((d) => {
      const outside = outsideLinks.get(d.file);
      const what = outside !== undefined ? `프로젝트 밖(${outside})을 가리키는 심볼릭 링크라` : "프로젝트 안을 가리키는 심볼릭 링크라";
      return (
        `${d.file.item.name}: 기존 파일 ${rel(root, d.file.target)} 이 ${what} 덮어쓸 수 없습니다. ` +
        "링크는 따라가 쓰지 않으니 링크를 지우거나 실제 파일로 바꾼 뒤 다시 실행하세요"
      );
    });
  // 덮어써야 하는 일반 파일이 다른 경로와 하드링크로 이어져 있으면(nlink 2 이상) 아무것도 쓰지 않고 멈춥니다(D19).
  // 덮어쓰면 이어진 다른 경로의 내용도 바뀌기 때문입니다. 내용이 같거나(unchanged) 건너뛰는(skip) 파일은 쓰지 않으므로 보지 않습니다.
  // 쓰기 직전에는 연 fd 의 fstat 로 한 번 더 봅니다(writeNoFollow, 경합)
  for (const d of decisions) {
    if (d.action !== "overwrite") continue;
    const nlink = hardLinkCount(d.file.target);
    if (nlink !== null) linkErrors.push(`${d.file.item.name}: ${hardLinkMessage(rel(root, d.file.target), nlink)}`);
  }
  if (linkErrors.length > 0) {
    error("설치할 수 없어 아무것도 쓰지 않았습니다.");
    for (const e of linkErrors) error(`  - ${e}`);
    return result;
  }

  // 쓰기(파일마다 직전 재검사). 쓰기 도중 실패하면 이미 쓴 파일을 알리고 rc 1 로 끝냅니다
  const stopWriting = (p: string, reason: string, tail = "쓰지 않았습니다."): AddResult => {
    error(`${p}: ${reason}. ${tail}`);
    if (result.written.length > 0) {
      error(`이미 쓴 파일(${result.written.length}):`);
      for (const w of result.written) error(`  ${result.overwritten.includes(w) ? "~" : "+"} ${w}`);
    }
    return { ...result, exitCode: 1 };
  };
  for (const d of decisions) {
    const p = rel(root, d.file.target);
    if (d.action === "unchanged") {
      result.unchanged.push(p);
      continue;
    }
    if (d.action === "skip") {
      result.skipped.push(p);
      continue;
    }
    let actual: "new" | "overwrite" = d.action === "write" ? "new" : "overwrite";
    try {
      const before = escapeReason(root, d.file.target);
      if (before) return stopWriting(p, before);
      await fs.ensureDir(path.dirname(d.file.target));
      const after = checkParentInside(root, d.file.target);
      if (after) return stopWriting(p, after);
      // 검사와 쓰기 사이에 파일이 링크로 바뀌어도 따라가지 않습니다(O_NOFOLLOW 가 없는 플랫폼은 0).
      // 새 파일(write)은 O_EXCL 이라 판정 뒤 같은 이름의 파일이 생겼으면 덮어쓰지 않습니다(n3)
      // 덮어쓰기 판정 파일이 그 사이 지워졌으면 새로 만들고 `+` 로 표기합니다(actual)
      actual = await writeNoFollow(d.file.target, d.file.content, actual);
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      // 기존 링크는 계획 단계에서 거부하므로(M1) 여기의 ELOOP · 링크 EEXIST 는 검사 뒤에 링크로 바뀐 동시 경합입니다
      if (code === "ELOOP" || (code === "EEXIST" && isSymlink(d.file.target))) {
        return stopWriting(p, "검사 뒤 쓰기 직전에 링크로 바뀌었습니다(동시 경합)");
      }
      if (code === HARDLINK_ERROR_CODE) {
        return stopWriting(
          p,
          "검사 뒤 쓰기 직전에 다른 경로와 하드링크로 이어졌습니다(동시 경합)",
          "그 파일은 덮어쓰지 않았습니다(D19). 하드링크를 끊은 뒤 다시 실행하세요."
        );
      }
      if (code === "EEXIST") {
        return stopWriting(
          p,
          "새 파일로 판정한 뒤(확인 대기 중 등) 같은 이름의 파일이 생겼습니다(동시 경합)",
          "그 파일은 덮어쓰지 않았습니다. 내용을 확인한 뒤 다시 실행하세요."
        );
      }
      return stopWriting(p, `쓰기 실패(${(e as Error).message})`);
    }
    // 사후 검사(M2 · m3): 쓴 파일의 실제 위치가 프로젝트 밖이면 지우지 않고 그 경로를 알린 뒤 rc 1 로 멈춥니다.
    // 밖의 그 경로에 있는 파일은 경합한 다른 프로세스나 사용자의 것일 수 있어, 이 CLI 가 지우는 경로를 두지 않습니다
    const outside = writtenOutside(root, d.file.target);
    if (outside !== null) {
      return stopWriting(
        p,
        `쓴 뒤 확인한 실제 위치(${outside})가 프로젝트 디렉터리 밖입니다(검사와 쓰기 사이에 상위 디렉터리가 바뀐 동시 경합)`,
        `그 파일은 지우지 않았습니다. ${outside} 를 직접 확인하세요.`
      );
    }
    result.written.push(p);
    if (actual === "overwrite") result.overwritten.push(p);
  }

  // 8. 재작성한 import 가 실제 파일을 가리키는지
  const broken: string[] = [];
  for (const d of decisions) {
    if (d.action === "skip") continue;
    for (const r of d.file.rewritten) {
      if (!relativeSpecifierResolves(d.file.target, r.to)) {
        broken.push(`${rel(root, d.file.target)}: '${r.to}'(원래 '${r.from}')가 가리키는 파일이 없습니다`);
      }
    }
  }

  const itemNames = items.map((it) => it.name);
  log(`설치 항목(${items.length}): ${itemNames.join(", ")}`);
  for (const p of result.written) {
    if (result.overwritten.includes(p)) log(`  ~ ${p} (덮어씀)`);
    else log(`  + ${p}`);
  }
  // 프로젝트 밖을 가리키는 링크는 쓰지 않았어도 그 사실을 함께 알립니다(D15)
  const outsideRel = new Set([...outsideLinks.keys()].map((f) => rel(root, f.target)));
  for (const p of result.unchanged) {
    log(outsideRel.has(p) ? `  = ${p} (같은 내용이라 건너뜀, 링크 대상이 프로젝트 밖)` : `  = ${p} (같은 내용이라 건너뜀)`);
  }
  if (result.skipped.length > 0) {
    log(`내용이 다른 기존 파일 ${result.skipped.length}개를 건너뛰었습니다(덮어쓰려면 --overwrite):`);
    for (const p of result.skipped) log(outsideRel.has(p) ? `  - ${p} (링크 대상이 프로젝트 밖)` : `  - ${p}`);
  }

  if (broken.length > 0) {
    error("설치한 파일의 import 가 풀리지 않습니다:");
    for (const b of broken) error(`  - ${b}`);
    return { ...result, exitCode: 1 };
  }

  // 9. 의존성 안내
  const deps = missingDependencies(root, items);
  if (Object.keys(deps.specs).length > 0) {
    log("\npackage.json 에 없는 의존성(설치는 실행하지 않았습니다):");
    log(`  ${addCommandForSpecs(deps.installCommand, deps.specs)}`);
  }

  return { ...result, exitCode: 0 };
}

export interface ListEntry {
  name: string;
  title?: string;
  description?: string;
}

/** list 표시용 분류. lib 항목은 다른 항목이 끌어오는 것이라 목록에서 뺍니다 */
export function groupIndex(index: RegistryIndex): { ui: ListEntry[]; agentic: ListEntry[] } {
  const ui: ListEntry[] = [];
  const agentic: ListEntry[] = [];
  for (const it of index.items) {
    const kind = itemKind(it);
    if (kind === "lib") continue;
    const entry = { name: it.name, title: it.title, description: it.description };
    (kind === "agentic" ? agentic : ui).push(entry);
  }
  return { ui, agentic };
}

/**
 * add · list 가 쓰는 레지스트리 클라이언트. URL 은 env → config.registry → 기본값.
 * config 의 registry 가 종전 기본값이면 새 기본값으로 조회하고 안내를 한 줄 냅니다(D13, 파일은 고치지 않음).
 * env 는 테스트에서만 넘깁니다(기본 process.env).
 */
export async function createClientFor(
  cwd: string,
  notify?: (message: string) => void,
  env: NodeJS.ProcessEnv = process.env
): Promise<RegistryClient> {
  let config: AxisConfig | null = null;
  try {
    config = await readAxisConfig(path.resolve(cwd));
  } catch {
    config = null;
  }
  const resolved = resolveRegistryUrl({ config, env });
  const say = notify ?? ((message: string) => console.warn(message));
  if (resolved.migratedFrom !== undefined) say(LEGACY_REGISTRY_NOTICE);
  return new RegistryClient({ url: resolved.url, ...(notify ? { notify } : {}) });
}
