/**
 * 레지스트리 응답 검증 (WI-0045 FR-3)
 *
 * 원격 응답과 동봉본을 같은 함수로 검증합니다. 응답 판정은 Content-Type 이 아니라 본문으로 합니다.
 * 404 에 HTML 을 주는 호스트(Pages 의 404.html, WAF 차단 페이지)는 JSON 파싱 단계에서 실패로 걸러집니다.
 *
 * 형식은 scripts/build-registry.mjs 가 쓰는 apps/web/public/r 과 같습니다.
 *   - index.json: { name?, homepage?, version, items: [{ name, type, title?, description?, sha256? }] }
 *   - <name>.json: { name, type, dependencies?, registryDependencies?, files: [{ path, content, type?, target? }] }
 *
 * registryDependencies(WI-0045 D5 · D11): build-registry 는 `<공개 URL>/<이름>.json` 절대 URL 로 내보냅니다(shadcn CLI 가
 * 접두 없는 이름을 공식 레지스트리로 풀지 않게). 이 CLI 는 받아 주는 base(지금 조회 중인 원격 base, 그리고 공개 기본
 * base https://axis-design-system.pages.dev/r) 중 하나로 시작하는 `<base>/<slug>.json` 만 이름으로 바꿔
 * 「같은 레지스트리(지금 읽는 원격 또는 동봉본)」 안에서 찾습니다. 판정은 G1(scripts/registry-integrity.mjs
 * registryDependencyName)과 같이 문자열 접두로 합니다. 다른 호스트 · 경로, 공백 · userinfo 가 든 URL, 쿼리 · 해시는 거부합니다.
 * 접두 없는 이름도 받습니다(하위 호환). 그 밖의 형태(@ns/이름, 상대 경로, .json 이 아닌 확장자, slug 위반 이름)는 항목
 * 검증 실패입니다.
 */

import { createHash } from "node:crypto";

/** 항목 이름 규칙(kebab-case slug). 이름이 URL · 파일 경로에 그대로 들어가므로 이 규칙 밖은 조회 전에 거부합니다 */
export const REGISTRY_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 이름 길이 상한. 레지스트리의 가장 긴 이름(agentic-token-usage-indicator, 29자)에 여유를 둔 값입니다 */
export const REGISTRY_NAME_MAX_LENGTH = 64;

export interface RegistryFile {
  path: string;
  content: string;
  type?: string;
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}

export interface RegistryIndexEntry {
  name: string;
  type: string;
  title?: string;
  description?: string;
  /** 단일 파일 항목의 content sha256(build-registry 의 itemSha256) */
  sha256?: string;
}

export interface RegistryIndex {
  name?: string;
  homepage?: string;
  version: string;
  items: RegistryIndexEntry[];
}

/** 이름이 slug 규칙에 맞는지 */
export function isValidRegistryName(name: unknown): name is string {
  return (
    typeof name === "string" &&
    name.length > 0 &&
    name.length <= REGISTRY_NAME_MAX_LENGTH &&
    REGISTRY_NAME_PATTERN.test(name)
  );
}

/**
 * 레지스트리 공개 기본 base(WI-0045 D11). build-registry 가 registryDependencies 를 `<base>/<이름>.json` 으로 내보낼 때
 * 쓰는 기본값(scripts/registry-integrity.mjs 의 DEFAULT_REGISTRY_PUBLIC_URL, 환경변수 AXIS_REGISTRY_PUBLIC_URL)과 같은
 * 값입니다. CLI 는 이 환경변수를 읽지 않고, 의존 URL 을 해석할 때 받아 주는 base 와 기본 원격(D8)으로 씁니다.
 * remote.ts 가 이 모듈을 import 하므로 순환을 피하려고 여기에 둡니다.
 */
export const REGISTRY_PUBLIC_BASE_URL = "https://axis-design-system.pages.dev/r";

/**
 * URL 의 사용자 정보(userinfo)와 쿼리 · 해시 값을 가립니다(n4 · p1). 안내 · 오류 문구에 URL 을 찍을 때 씁니다.
 * 정규식으로 `스킴://` 형태만 보면 WHATWG URL 이 userinfo 로 읽는 `https:/u:p@h` · `https:\\u:p@h` · `https:u:p@h` 가
 * 새므로, URL 파서가 읽은 결과로 판정합니다.
 * - 파싱에 성공하고 userinfo 가 있으면 그것을 비운 정규화 주소에 `***@` 를 넣습니다.
 * - 파싱에 성공한 http · https 주소에 userinfo 가 없으면 원문을 씁니다(경로의 `@scope` 등은 가리지 않습니다).
 * - 그 밖(파싱 실패 · 다른 스킴)에 `@` 가 있으면 스킴 뒤부터 마지막 `@` 앞까지 전부 가립니다(보수적, 슬래시가 든 비밀번호 대비).
 * - 마지막으로 쿼리 · 해시 값을 `?***` · `#***` 로 가립니다(p1, 토큰을 쿼리로 넘기는 미러 대비). userinfo 를 먼저 가려야
 *   비밀번호에 든 `?` · `#` 가 쿼리로 읽혀 비밀번호 앞부분이 남지 않습니다.
 * 이 CLI 가 레지스트리 URL 을 찍는 모든 문구(normalizeRegistryBaseUrl · fetchRegistryJson · 의존 URL 검증 · init 의 registry 안내)가
 * 이 함수를 거칩니다. 같은 규칙의 빌드 쪽 함수는 scripts/registry-integrity.mjs 의 redactPublicUrl 입니다.
 */
export function redactRegistryUrl(raw: string): string {
  return maskQueryAndHash(redactUserinfo(raw));
}

/** 쿼리(`?` 뒤)와 해시(`#` 뒤) 값을 가립니다. 해시가 쿼리보다 앞이면 그 뒤는 모두 해시입니다 */
function maskQueryAndHash(value: string): string {
  const hashAt = value.indexOf("#");
  let head = hashAt >= 0 ? value.slice(0, hashAt) : value;
  const queryAt = head.indexOf("?");
  if (queryAt >= 0) head = `${head.slice(0, queryAt)}?***`;
  return hashAt >= 0 ? `${head}#***` : head;
}

function redactUserinfo(raw: string): string {
  let parsed: URL | null = null;
  try {
    parsed = new URL(raw);
  } catch {
    parsed = null;
  }
  if (parsed && (parsed.username || parsed.password)) {
    parsed.username = "";
    parsed.password = "";
    const href = parsed.href;
    const scheme = `${parsed.protocol}//`;
    return href.startsWith(scheme) ? `${scheme}***@${href.slice(scheme.length)}` : `***@${href}`;
  }
  // 스킴 뒤 첫 `/` 앞(authority 후보)에 `@` 가 있으면 그 `@` 앞까지 가립니다(파서가 userinfo 를 읽은 경우는 위에서 처리).
  // 비밀번호가 숫자로 시작하고 `?` · `#` 가 섞이면(https://admin:12345?x@host) 파서가 userinfo 를 못 읽기 때문입니다
  const authPrefix = /^\s*[A-Za-z][A-Za-z0-9+.-]*:[/\\]*/.exec(raw)?.[0] ?? "";
  const authority = raw.slice(authPrefix.length).split(/[/\\]/)[0];
  const authorityAt = authority.lastIndexOf("@");
  if (authPrefix && authorityAt >= 0) return `${authPrefix}***${raw.slice(authPrefix.length + authorityAt)}`;
  if (parsed && (parsed.protocol === "http:" || parsed.protocol === "https:")) return raw;
  const at = raw.lastIndexOf("@");
  if (at < 0) return raw;
  const prefix = /^\s*[A-Za-z][A-Za-z0-9+.-]*:[/\\]*/.exec(raw)?.[0] ?? "";
  if (prefix.length > at) return raw;
  return `${prefix}***${raw.slice(at)}`;
}

/** 의존 URL 을 받아 주는 base 의 기본값. 동봉본은 공개 기본 base 로 빌드되므로 이것만 받습니다(D11) */
export const DEFAULT_DEPENDENCY_BASES: readonly string[] = [REGISTRY_PUBLIC_BASE_URL];

/** base 끝의 `/` 를 뗍니다 */
function trimBase(base: string): string {
  return base.replace(/\/+$/, "");
}

/**
 * registryDependencies 값 하나를 항목 이름으로 바꿉니다(D5 · D11). 받지 않는 형태면 null 입니다.
 *  - 접두 없는 slug 이름: 그대로(하위 호환)
 *  - `<base>/<slug>.json`: 그 slug. base 는 allowedBases 중 하나여야 하고(문자열 접두 비교), 값에 공백 · userinfo ·
 *    쿼리 · 해시가 없어야 합니다
 */
export function registryDependencyName(dep: string, allowedBases: readonly string[] = DEFAULT_DEPENDENCY_BASES): string | null {
  if (REGISTRY_NAME_PATTERN.test(dep) && dep.length <= REGISTRY_NAME_MAX_LENGTH) return dep;
  // 공백(앞뒤 · 중간)은 URL 파서가 지우거나 인코딩해 접두 비교를 흐리므로 먼저 거부합니다
  if (/\s/.test(dep) || dep.includes("?") || dep.includes("#")) return null;
  let url: URL;
  try {
    url = new URL(dep);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password || url.search || url.hash) return null;
  for (const raw of allowedBases) {
    const prefix = `${trimBase(raw)}/`;
    if (!dep.startsWith(prefix) || !dep.endsWith(".json")) continue;
    const name = dep.slice(prefix.length, -".json".length);
    if (isValidRegistryName(name)) return name;
  }
  return null;
}

function registryDependencyArray(obj: Record<string, unknown>, where: string, allowedBases: readonly string[]): string[] {
  const names: string[] = [];
  for (const dep of stringArray(obj, "registryDependencies", where)) {
    const name = registryDependencyName(dep, allowedBases);
    if (name === null) {
      throw new Error(
        `${where}: registryDependencies 의 ${JSON.stringify(redactRegistryUrl(dep).slice(0, 120))} 는 항목 이름이나 <레지스트리 base>/<이름>.json ` +
          `형태가 아닙니다(받는 base: ${allowedBases.map(trimBase).join(", ")})`
      );
    }
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

/** 본문 문자열을 JSON 으로 읽습니다. 실패하면 앞부분을 붙여 던집니다(HTML 응답 판별용) */
export function parseJsonText(text: string, where: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const head = text.slice(0, 40).replace(/\s+/g, " ").trim();
    throw new Error(`${where}: JSON 이 아닙니다(앞부분: ${JSON.stringify(head)})`);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function optionalString(obj: Record<string, unknown>, key: string, where: string): string | undefined {
  const v = obj[key];
  if (v === undefined) return undefined;
  if (typeof v !== "string") throw new Error(`${where}: ${key} 가 문자열이 아닙니다`);
  return v;
}

function stringArray(obj: Record<string, unknown>, key: string, where: string): string[] {
  const v = obj[key];
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((s) => typeof s !== "string" || s.length === 0)) {
    throw new Error(`${where}: ${key} 는 비어 있지 않은 문자열 배열이어야 합니다`);
  }
  return v as string[];
}

/**
 * dependencies · devDependencies 항목 규칙: npm 패키지 이름(@scope/ 선택) 뒤에 선택적으로 `@범위`.
 * 이 값은 설치 안내 명령(복사해 실행하는 셸 명령)에 그대로 들어가므로, 셸 메타 문자(; & $ ` 따옴표 등)가 든 값은
 * 받지 않습니다. 원격 응답이 이 규칙을 어기면 항목 검증 실패라 동봉본으로 폴백합니다
 */
export const DEPENDENCY_SPEC_PATTERN =
  /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*(?:@[0-9A-Za-z.^~<>=*+| -]+)?$/;

function dependencyArray(obj: Record<string, unknown>, key: string, where: string): string[] {
  const list = stringArray(obj, key, where);
  const bad = list.find((s) => s.length > 214 || !DEPENDENCY_SPEC_PATTERN.test(s));
  if (bad !== undefined) {
    throw new Error(`${where}: ${key} 에 패키지 이름 규칙에 맞지 않는 값이 있습니다(${JSON.stringify(bad.slice(0, 60))})`);
  }
  return list;
}

function requireType(obj: Record<string, unknown>, where: string): string {
  const type = obj.type;
  if (typeof type !== "string" || !type.startsWith("registry:")) {
    throw new Error(`${where}: type 이 registry:* 형식이 아닙니다`);
  }
  return type;
}

/** index.json 검증. 이름 중복 · slug 위반도 거부합니다 */
export function validateRegistryIndex(data: unknown, where = "index.json"): RegistryIndex {
  if (!isRecord(data)) throw new Error(`${where}: 객체가 아닙니다`);
  const version = data.version;
  if (typeof version !== "string" || version.length === 0) {
    throw new Error(`${where}: version 이 없습니다`);
  }
  if (!Array.isArray(data.items)) throw new Error(`${where}: items 가 배열이 아닙니다`);

  const seen = new Set<string>();
  const items: RegistryIndexEntry[] = data.items.map((raw, i) => {
    const at = `${where} items[${i}]`;
    if (!isRecord(raw)) throw new Error(`${at}: 객체가 아닙니다`);
    if (!isValidRegistryName(raw.name)) throw new Error(`${at}: name 이 slug 규칙에 맞지 않습니다`);
    if (seen.has(raw.name)) throw new Error(`${at}: name '${raw.name}' 가 중복입니다`);
    seen.add(raw.name);
    const sha256 = optionalString(raw, "sha256", at);
    if (sha256 !== undefined && !/^[0-9a-f]{64}$/.test(sha256)) {
      throw new Error(`${at}: sha256 형식이 아닙니다`);
    }
    return {
      name: raw.name,
      type: requireType(raw, at),
      title: optionalString(raw, "title", at),
      description: optionalString(raw, "description", at),
      ...(sha256 !== undefined ? { sha256 } : {}),
    };
  });

  return {
    name: optionalString(data, "name", where),
    homepage: optionalString(data, "homepage", where),
    version,
    items,
  };
}

/**
 * <name>.json 검증. `expectedName` 과 name 이 다르면 거부합니다(다른 항목을 돌려주는 응답 차단).
 * 파일 경로의 프로젝트 이탈 검사는 쓰기 단계(FR-4, realpath 기준)에서 따로 합니다.
 * dependencyBases: registryDependencies URL 로 받아 주는 base(D11). 생략하면 공개 기본 base 만 받습니다.
 */
export function validateRegistryItem(
  data: unknown,
  expectedName: string,
  where = `${expectedName}.json`,
  dependencyBases: readonly string[] = DEFAULT_DEPENDENCY_BASES
): RegistryItem {
  if (!isRecord(data)) throw new Error(`${where}: 객체가 아닙니다`);
  if (data.name !== expectedName) {
    throw new Error(`${where}: name 이 '${expectedName}' 가 아닙니다(${JSON.stringify(data.name)})`);
  }
  const type = requireType(data, where);
  if (!Array.isArray(data.files) || data.files.length === 0) {
    throw new Error(`${where}: files 가 비어 있습니다`);
  }
  const files: RegistryFile[] = data.files.map((raw, i) => {
    const at = `${where} files[${i}]`;
    if (!isRecord(raw)) throw new Error(`${at}: 객체가 아닙니다`);
    if (typeof raw.path !== "string" || raw.path.length === 0 || raw.path.includes("\0")) {
      throw new Error(`${at}: path 가 없습니다`);
    }
    if (typeof raw.content !== "string") throw new Error(`${at}: content 가 문자열이 아닙니다`);
    const fileType = optionalString(raw, "type", at);
    const target = optionalString(raw, "target", at);
    return {
      path: raw.path,
      content: raw.content,
      ...(fileType !== undefined ? { type: fileType } : {}),
      ...(target !== undefined ? { target } : {}),
    };
  });

  return {
    name: expectedName,
    type,
    title: optionalString(data, "title", where),
    description: optionalString(data, "description", where),
    dependencies: dependencyArray(data, "dependencies", where),
    devDependencies: dependencyArray(data, "devDependencies", where),
    // URL 형태는 이름으로 바꿔 둡니다. 호출한 쪽(add 의 collectItems)은 이름만 봅니다
    registryDependencies: registryDependencyArray(data, where, dependencyBases),
    files,
  };
}

/** 문자열 sha256(hex). build-registry 의 sha256 과 같은 계산입니다 */
export function sha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * index 의 sha256 과 항목 content 를 대조합니다. sha256 은 단일 파일 항목에만 정의돼 있습니다(registry-integrity.mjs
 * itemSha256). index 에 sha256 이 있는데 files 가 1개가 아니면 대조를 건너뛰지 않고 실패로 봅니다(파일을 하나 더 붙여
 * 대조를 피하는 응답 차단). sha256 이 없는 항목만 대조하지 않습니다.
 */
export function checkItemSha256(item: RegistryItem, entry: RegistryIndexEntry, where = `${item.name}.json`): void {
  if (entry.sha256 === undefined) return;
  if (item.files.length !== 1) {
    throw new Error(`${where}: index.json 에 sha256 이 있는데 files 가 ${item.files.length}개라 sha256 을 대조할 수 없습니다`);
  }
  const actual = sha256Hex(item.files[0].content);
  if (actual !== entry.sha256) {
    throw new Error(`${where}: content sha256 이 index.json 과 다릅니다`);
  }
}
