#!/usr/bin/env node
/**
 * 레지스트리 무결성 검사 (WI-0045 FR-7 G1)
 *
 * 생성된 레지스트리 디렉터리(apps/web/public/r)의 모든 항목에서
 * content 의 import 가 dependencies · registryDependencies · lib 항목으로 닫혀 있는지 봅니다.
 * build-registry.mjs 가 생성 직후 이 검사를 돌리고, 실패하면 빌드를 실패시킵니다.
 *
 * 생성기와 같은 결과를 내도록 짜면 검사가 자기 증명이 되므로, 이 검사는 생성기의 메모리 상태를 쓰지 않고
 * 디스크에 쓰인 JSON 만 다시 읽어 content 를 새로 파싱합니다.
 *
 * registryDependencies 는 `<공개 URL>/<이름>.json` 형태이고 그 이름의 항목이 레지스트리에 있어야 합니다(D5).
 * 공개 URL 은 AXIS_REGISTRY_PUBLIC_URL(없으면 DEFAULT_REGISTRY_PUBLIC_URL)이고 build-registry 와 같은 값을 씁니다.
 *
 * 사용: node scripts/registry-integrity.mjs [레지스트리 디렉터리]
 *   rc 0 = 통과, rc 1 = 위반 발견, rc 2 = 측정 실패(디렉터리 · index.json 없음, 항목 0개 등)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import ts from "typescript";

/** 레지스트리 표준 import 접두. shadcn 변환 규칙의 근거는 build-registry.mjs 머리 주석 참고 */
export const REGISTRY_IMPORT_PREFIX = "@/registry/axis/";

/**
 * registryDependencies 를 내보낼 레지스트리 공개 URL 의 기본값(WI-0045 D5, 2026-10-21 사용자 결정).
 * 항목은 registryDependencies 를 `<공개 URL>/<이름>.json` 절대 URL 로 적습니다. 접두 없는 이름은 shadcn CLI 가
 * 공식 레지스트리(ui.shadcn.com)로 풀기 때문입니다(AC5). axis.minu.best 는 Cloudflare 403 이라 pages.dev 를 씁니다.
 * 바꾸려면 환경변수 AXIS_REGISTRY_PUBLIC_URL 을 씁니다(build-registry · G1 이 같은 값을 읽습니다).
 */
export const DEFAULT_REGISTRY_PUBLIC_URL = "https://axis-design-system.pages.dev/r";

/** 공개 URL 환경변수 이름 */
export const REGISTRY_PUBLIC_URL_ENV = "AXIS_REGISTRY_PUBLIC_URL";

/** 항목 이름 규칙(kebab-case slug). CLI(packages/axis-cli/src/registry/schema.ts)와 같은 규칙입니다 */
export const REGISTRY_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * 공개 URL 을 검사하고 끝 `/` 를 뗍니다. http · https 이고 쿼리 · 해시 · 공백 · userinfo 가 없어야 합니다.
 * CLI 의 registryDependencies 해석(packages/axis-cli/src/registry/schema.ts registryDependencyName)과 같은 기준입니다.
 * 기준이 다르면 G1 은 통과하는데 CLI 는 그 항목을 형식 검증 실패로 보고 동봉본으로 폴백하게 됩니다(WI-0045 D11).
 */
export function normalizePublicUrl(raw) {
  // 오류 문구에는 userinfo · 쿼리 · 해시 값을 가린 URL 을 찍습니다(WI-0045 p1, CLI redactRegistryUrl 과 같은 규칙)
  const shown = typeof raw === "string" ? redactPublicUrl(raw) : raw;
  if (typeof raw !== "string" || /\s/.test(raw)) throw new Error(`레지스트리 공개 URL 에 공백을 둘 수 없음: ${JSON.stringify(shown)}`);
  if (raw.includes("?") || raw.includes("#")) throw new Error(`레지스트리 공개 URL 에 쿼리 · 해시를 둘 수 없음: ${shown}`);
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`레지스트리 공개 URL 형식이 아님: ${shown}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`레지스트리 공개 URL 은 http · https 만: ${shown}`);
  }
  if (parsed.search || parsed.hash) throw new Error(`레지스트리 공개 URL 에 쿼리 · 해시를 둘 수 없음: ${shown}`);
  if (parsed.username || parsed.password) throw new Error(`레지스트리 공개 URL 에 사용자 정보(userinfo)를 둘 수 없음: ${shown}`);
  // CLI normalizeRegistryBaseUrl(D18)과 같은 정규화: 스킴 · 호스트 소문자, 스킴 기본 포트 제거(URL 파서), 경로 끝 / 제거.
  // 원문을 그대로 쓰면 대문자 호스트 · :443 으로 빌드한 의존 URL 이 CLI 가 정규화한 base 와 접두가 맞지 않습니다
  return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/+$/, "");
}

const schemePrefix = (raw) => /^\s*[A-Za-z][A-Za-z0-9+.-]*:[/\\]*/.exec(raw)?.[0] ?? "";
/** 스킴 뒤 첫 `/` · `\\` 앞 구간의 마지막 `@` 위치(스킴이 없으면 -1) */
function authorityAtOf(raw) {
  const prefix = schemePrefix(raw);
  if (!prefix) return -1;
  return raw.slice(prefix.length).split(/[/\\]/)[0].lastIndexOf("@");
}

/**
 * 오류 문구용 URL 가림(WI-0045 p1). CLI 의 redactRegistryUrl(packages/axis-cli/src/registry/schema.ts)과 같은 규칙입니다.
 * userinfo 를 먼저 가리고(URL 파서가 읽은 결과로 판정, 못 읽었어도 authority 후보에 `@` 가 있거나 파싱 실패면 스킴 뒤부터 그 `@` 앞까지) 쿼리 · 해시 값을
 * `?***` · `#***` 로 가립니다.
 */
export function redactPublicUrl(raw) {
  let parsed = null;
  try {
    parsed = new URL(raw);
  } catch {
    parsed = null;
  }
  let out;
  if (parsed && (parsed.username || parsed.password)) {
    parsed.username = "";
    parsed.password = "";
    const scheme = `${parsed.protocol}//`;
    out = parsed.href.startsWith(scheme) ? `${scheme}***@${parsed.href.slice(scheme.length)}` : `***@${parsed.href}`;
  } else if (authorityAtOf(raw) >= 0) {
    // 스킴 뒤 첫 `/` 앞(authority 후보)에 `@` 가 있으면 그 `@` 앞까지 가립니다(https://admin:12345?x@host 처럼 파서가 userinfo 를 못 읽는 경우)
    const authPrefix = schemePrefix(raw);
    out = `${authPrefix}***${raw.slice(authPrefix.length + authorityAtOf(raw))}`;
  } else if (parsed && (parsed.protocol === "http:" || parsed.protocol === "https:")) {
    out = raw;
  } else {
    const at = raw.lastIndexOf("@");
    const prefix = /^\s*[A-Za-z][A-Za-z0-9+.-]*:[/\\]*/.exec(raw)?.[0] ?? "";
    out = at < 0 || prefix.length > at ? raw : `${prefix}***${raw.slice(at)}`;
  }
  const hashAt = out.indexOf("#");
  let head = hashAt >= 0 ? out.slice(0, hashAt) : out;
  const queryAt = head.indexOf("?");
  if (queryAt >= 0) head = `${head.slice(0, queryAt)}?***`;
  return hashAt >= 0 ? `${head}#***` : head;
}

/** 쓸 공개 URL. 환경변수가 비었거나 공백이면 기본값 */
export function registryPublicUrl(env = process.env) {
  const fromEnv = env[REGISTRY_PUBLIC_URL_ENV]?.trim();
  return normalizePublicUrl(fromEnv || DEFAULT_REGISTRY_PUBLIC_URL);
}

/** 항목 이름 -> registryDependencies 값(`<공개 URL>/<이름>.json`) */
export function registryDependencyUrl(publicUrl, name) {
  return `${publicUrl}/${name}.json`;
}

/**
 * registryDependencies 값 -> 항목 이름. `<공개 URL>/<slug 이름>.json` 형태가 아니면 null 입니다
 * (접두 없는 이름 · 다른 호스트 · 다른 확장자 · 상대 경로 · @ns 형태 모두 null).
 */
export function registryDependencyName(dep, publicUrl) {
  if (typeof dep !== "string") return null;
  const prefix = `${publicUrl}/`;
  if (!dep.startsWith(prefix) || !dep.endsWith(".json")) return null;
  const name = dep.slice(prefix.length, -".json".length);
  return REGISTRY_NAME_PATTERN.test(name) ? name : null;
}

/** 사용하는 앱이 이미 가진 패키지(Next · React 앱 전제). dependencies 에 넣지 않습니다 */
export const PROVIDED_PACKAGES = new Set(["react", "react-dom"]);

/** 레지스트리 항목은 자기 완결이어야 해서 워크스페이스 패키지에 의존하면 안 됩니다(D2: cn 은 utils 항목으로) */
export const FORBIDDEN_PACKAGE_PREFIXES = ["@axis-ds/"];

/**
 * content 에서 모듈 지정자를 모두 찾습니다.
 * import · export ... from · import "x" · import("x") · import x = require("x") · require("x") 호출 ·
 * 타입 위치의 import("x")(typeof import("x"), import("x").T) 를 봅니다.
 * `/// <reference types · path>` 지시문은 지정자로 보지 않고 checkRegistryDir 에서 위반으로 거부합니다.
 * 반환: [{ specifier, start, end, namedImports, defaultImport, namespaceImport, typeOnly }]
 *   start · end 는 따옴표를 포함한 문자열 리터럴의 위치입니다(재작성에 씁니다).
 */
export function scanImports(content, fileName = "item.tsx") {
  const kind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, kind);
  const found = [];

  const push = (lit, extra = {}) => {
    found.push({
      specifier: lit.text,
      start: lit.getStart(sf),
      end: lit.getEnd(),
      namedImports: null,
      defaultImport: false,
      namespaceImport: false,
      typeOnly: false,
      ...extra,
    });
  };

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const extra = { typeOnly: Boolean(clause?.isTypeOnly) };
      if (clause) {
        extra.defaultImport = Boolean(clause.name);
        const nb = clause.namedBindings;
        if (nb && ts.isNamespaceImport(nb)) extra.namespaceImport = true;
        if (nb && ts.isNamedImports(nb)) {
          extra.namedImports = nb.elements.map((el) => (el.propertyName ?? el.name).text);
        }
      }
      push(node.moduleSpecifier, extra);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      push(node.moduleSpecifier);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      push(node.moduleReference.expression);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      push(node.arguments[0]);
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      // CommonJS require 도 그 패키지가 있어야 동작하므로 의존으로 셉니다
      push(node.arguments[0]);
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      // 타입 위치 import 도 그 패키지의 타입 선언이 있어야 컴파일되므로 의존으로 셉니다
      push(node.argument.literal, { typeOnly: true });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found.sort((a, b) => a.start - b.start);
}

/**
 * `/// <reference types="x" />` · `/// <reference path="x" />` 지시문 목록.
 * 설치 위치에서 풀리는지 레지스트리가 보장할 수 없어 G1 위반으로 거부합니다(지금 소스에는 0건).
 */
export function referenceDirectives(content, fileName = "item.tsx") {
  const kind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, kind);
  return [
    ...sf.typeReferenceDirectives.map((r) => `types="${r.fileName}"`),
    ...sf.referencedFiles.map((r) => `path="${r.fileName}"`),
  ];
}

/**
 * 파일 맨 앞 지시문(directive prologue)에 "use client" 가 있는지. 앞의 주석(라이선스 등)은 건너뜁니다.
 * 정규식으로 content 맨 앞만 보면 주석 뒤의 지시문을 놓칩니다.
 */
export function hasUseClientDirective(content, fileName = "item.tsx") {
  const kind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, kind);
  for (const st of sf.statements) {
    if (!ts.isExpressionStatement(st) || !ts.isStringLiteral(st.expression)) break;
    if (st.expression.text === "use client") return true;
  }
  return false;
}

/** "@scope/pkg/sub" -> "@scope/pkg", "pkg/sub" -> "pkg" */
export function packageNameOf(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

/** 레지스트리 파일 경로(확장자 없이) -> 표준 import 지정자. 예: registry/axis/lib/utils.ts -> @/registry/axis/lib/utils */
export function registryImportOf(filePath) {
  const noExt = filePath.replace(/\.(tsx?|jsx?)$/, "");
  if (!noExt.startsWith("registry/axis/")) return null;
  return "@/" + noExt;
}

/**
 * 지정자 하나를 분류합니다.
 *   { kind: "provided" }                      react 등, 선언 불필요
 *   { kind: "package", name }                 dependencies 로 선언해야 함
 *   { kind: "registry", itemName }            registryDependencies 로 선언해야 함
 *   { kind: "error", reason }                 설치 위치에서 풀리지 않음
 * registryImports: Map<표준 import 지정자, 항목 이름>
 */
export function classifySpecifier(specifier, registryImports) {
  if (specifier.startsWith(".") || specifier.startsWith("/")) {
    return { kind: "error", reason: `상대 · 절대 경로 import 가 남음: ${specifier}` };
  }
  if (specifier.startsWith("@/")) {
    if (specifier.startsWith(REGISTRY_IMPORT_PREFIX)) {
      const itemName = registryImports.get(specifier);
      if (itemName) return { kind: "registry", itemName };
      return { kind: "error", reason: `레지스트리에 없는 표준 import: ${specifier}` };
    }
    return { kind: "error", reason: `표준 형태가 아닌 별칭 import: ${specifier}` };
  }
  const name = packageNameOf(specifier);
  if (PROVIDED_PACKAGES.has(name)) return { kind: "provided" };
  if (FORBIDDEN_PACKAGE_PREFIXES.some((p) => name.startsWith(p))) {
    return { kind: "error", reason: `워크스페이스 패키지 의존이 남음: ${specifier}` };
  }
  return { kind: "package", name };
}

/** 정규화(재작성 · interface 변환)가 문법을 깨지 않았는지. 반환: 진단 메시지 배열 */
export function syntaxErrors(content, fileName = "item.tsx") {
  const out = ts.transpileModule(content, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.Latest },
  });
  return (out.diagnostics ?? [])
    .filter((d) => d.category === ts.DiagnosticCategory.Error)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "));
}

export function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

/** 항목 파일들의 content 기준 sha256. 지금은 항목당 파일 1개라 그 content 의 sha256 입니다 */
export function itemSha256(item) {
  if (!Array.isArray(item.files) || item.files.length !== 1) {
    throw new Error(`${item.name}: files 가 1개가 아님(다중 파일 항목은 아직 지원하지 않음)`);
  }
  return sha256(item.files[0].content);
}

/**
 * 레지스트리 디렉터리 검사. 반환: { measured, errors[], checkedItems }
 * measured=false 면 검사 자체를 하지 못한 것(0건 통과가 아님)입니다.
 * options.publicUrl: registryDependencies 가 따라야 할 공개 URL(기본은 registryPublicUrl(), D5)
 */
export function checkRegistryDir(dir, options = {}) {
  const errors = [];
  const publicUrl = normalizePublicUrl(options.publicUrl ?? registryPublicUrl());
  const indexPath = path.join(dir, "index.json");
  if (!fs.existsSync(dir) || !fs.existsSync(indexPath)) {
    return { measured: false, errors: [`index.json 없음: ${indexPath}`], checkedItems: 0 };
  }
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const indexItems = Array.isArray(index.items) ? index.items : [];
  if (indexItems.length === 0) {
    return { measured: false, errors: ["index.json 항목이 0개"], checkedItems: 0 };
  }
  if (typeof index.version !== "string" || !/^\d+\.\d+\.\d+/.test(index.version)) {
    errors.push(`index.json version 이 없거나 형식이 다름: ${index.version}`);
  }

  // registry.json 은 index.json 과 같은 목록이어야 합니다
  const regPath = path.join(dir, "registry.json");
  if (fs.existsSync(regPath)) {
    const reg = JSON.parse(fs.readFileSync(regPath, "utf8"));
    if (JSON.stringify(reg.items) !== JSON.stringify(index.items) || reg.version !== index.version) {
      errors.push("registry.json 의 items · version 이 index.json 과 다름");
    }
  } else {
    errors.push("registry.json 없음");
  }

  // 항목 파일 읽기
  const items = new Map();
  for (const entry of indexItems) {
    const p = path.join(dir, `${entry.name}.json`);
    if (!fs.existsSync(p)) {
      errors.push(`${entry.name}: 항목 파일 없음`);
      continue;
    }
    items.set(entry.name, { entry, item: JSON.parse(fs.readFileSync(p, "utf8")) });
  }
  // index 에 없는 항목 파일(낡은 산출물)
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json") || f === "index.json" || f === "registry.json") continue;
    if (!items.has(f.slice(0, -5))) errors.push(`${f}: index.json 에 없는 항목 파일`);
  }

  // 표준 import 지정자 -> 항목 이름
  const registryImports = new Map();
  for (const [name, { item }] of items) {
    for (const file of item.files ?? []) {
      const spec = registryImportOf(file.path);
      if (spec) registryImports.set(spec, name);
    }
  }

  for (const [name, { entry, item }] of items) {
    const where = `${name}`;
    if (item.name !== name) errors.push(`${where}: 파일 이름과 name 이 다름(${item.name})`);
    if (!Array.isArray(item.files) || item.files.length !== 1 || typeof item.files[0].content !== "string") {
      errors.push(`${where}: files 가 content 를 가진 1개가 아님`);
      continue;
    }
    if (entry.sha256 !== itemSha256(item)) errors.push(`${where}: index.json sha256 이 content 와 다름`);
    for (const d of syntaxErrors(item.files[0].content, item.files[0].path)) {
      errors.push(`${where}: 문법 오류 ${d}`);
    }

    const declaredDeps = new Set(item.dependencies ?? []);
    // registryDependencies 는 `<공개 URL>/<이름>.json` 형태여야 합니다(D5). 형태가 맞으면 이름으로 바꿔 대조합니다
    const declaredReg = new Set();
    for (const dep of item.registryDependencies ?? []) {
      const depName = registryDependencyName(dep, publicUrl);
      if (depName === null) {
        errors.push(`${where}: registryDependencies 의 ${JSON.stringify(dep)} 가 ${publicUrl}/<이름>.json 형태가 아님`);
      } else {
        declaredReg.add(depName);
      }
    }
    const usedDeps = new Set();
    const usedReg = new Set();

    for (const ref of referenceDirectives(item.files[0].content, item.files[0].path)) {
      errors.push(`${where}: /// <reference ${ref} /> 지시문은 레지스트리 항목에 둘 수 없음`);
    }
    for (const imp of scanImports(item.files[0].content, item.files[0].path)) {
      const c = classifySpecifier(imp.specifier, registryImports);
      if (c.kind === "error") errors.push(`${where}: ${c.reason}`);
      else if (c.kind === "package") usedDeps.add(c.name);
      else if (c.kind === "registry" && c.itemName !== name) usedReg.add(c.itemName);
    }

    for (const d of usedDeps) if (!declaredDeps.has(d)) errors.push(`${where}: import 하는 ${d} 가 dependencies 에 없음`);
    for (const d of declaredDeps) {
      const bare = d.replace(/(.)@[^/]*$/, "$1");
      if (!usedDeps.has(bare)) errors.push(`${where}: dependencies 의 ${d} 를 import 하지 않음`);
    }
    for (const r of usedReg) if (!declaredReg.has(r)) errors.push(`${where}: import 하는 항목 ${r} 가 registryDependencies 에 없음`);
    for (const r of declaredReg) {
      if (!items.has(r)) errors.push(`${where}: registryDependencies 의 ${r} 가 레지스트리에 없음`);
      else if (!usedReg.has(r)) errors.push(`${where}: registryDependencies 의 ${r} 를 import 하지 않음`);
    }
  }

  return { measured: true, errors, checkedItems: items.size };
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const dir = path.resolve(process.argv[2] ?? path.join(root, "apps/web/public/r"));
  // 공개 URL 입력 오류(AXIS_REGISTRY_PUBLIC_URL 형식 위반 등)는 「위반 발견(rc 1)」이 아니라 측정 실패(rc 2)입니다.
  // 오류 문구는 normalizePublicUrl 이 이미 userinfo · 쿼리 · 해시를 가린 것이고, 스택 트레이스는 찍지 않습니다
  let publicUrl;
  let result;
  try {
    publicUrl = registryPublicUrl();
    result = checkRegistryDir(dir, { publicUrl });
  } catch (e) {
    console.error(`G1 측정 실패: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(2);
  }
  const { measured, errors, checkedItems } = result;
  if (!measured) {
    console.error(`G1 측정 실패: ${errors.join("; ")}`);
    process.exit(2);
  }
  if (errors.length > 0) {
    console.error(`G1 실패: ${errors.length}건 (항목 ${checkedItems}개 검사)`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`G1 통과: 항목 ${checkedItems}개의 import 가 dependencies · registryDependencies(${publicUrl}/<이름>.json)로 닫혀 있음`);
}
