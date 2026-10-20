/**
 * 빌드 후처리 (WI-0050)
 *
 * tsup 은 bundle:false(모듈 보존) 로 소스 파일마다 dist 파일을 하나씩 냅니다. 이 스크립트는 그 뒤에
 *   1. 상대 import 에 확장자를 붙입니다. esbuild 는 bundle:false 에서 `../constants/a11y-labels` 를 그대로
 *      두는데, Node ESM 은 확장자 없는 상대 경로를 풀지 못합니다(.mjs 는 .mjs, .js 는 .js 로, 디렉터리면 /index).
 *   2. scripts/client-modules.mjs 목록의 산출물(ESM · CJS) 맨 앞에 "use client" 를 붙입니다.
 *   3. 검사: 지시문은 목록 파일에만 있어야 하고(루트 배럴 · constants 에는 없음),
 *      목록 밖 파일에서 상태 훅 · createContext · 인라인 이벤트 핸들러가 보이면 실패합니다.
 *      (인라인 핸들러는 화살표 · function 을 props 에 바로 쓴 경우만. 지역 함수 핸들러는 G2 RSC 하네스가 잡습니다)
 *   4. exports 대조: package.json exports 가 가리키는 파일이 모두 있고, dist 의 컴포넌트 엔트리
 *      (dist/<name>/index.mjs)가 모두 exports 에 있어야 합니다(WI-0050 D3, 서브패스 누락 재발 방지).
 *
 * 처리 방식은 @axis-ds/ui-react 의 scripts/postbuild.mjs 와 같습니다(패키지마다 독립 실행되도록 따로 둡니다).
 *
 * 사용: node scripts/postbuild.mjs   (실패 시 exit 1)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, relative, resolve, sep } from "path";
import { CLIENT_MODULES } from "./client-modules.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, "..");
const distDir = join(pkgRoot, "dist");
const srcDir = join(pkgRoot, "src");
const DIRECTIVE = '"use client";';

const errors = [];
const fail = (msg) => errors.push(msg);

if (!existsSync(distDir)) {
  console.error("[postbuild] dist/ 없음 - 먼저 tsup 을 실행하세요");
  process.exit(1);
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(mjs|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const files = walk(distDir);
const toId = (file) => relative(distDir, file).split(sep).join("/").replace(/\.(mjs|js)$/, "");

// 1. 상대 import 확장자 보정
// from "./x" · import "./x" · import("./x") · require("./x")
const SPEC_RE = /(\bfrom\s*|\bimport\s*\(?\s*|\brequire\(\s*)(["'])(\.\.?\/[^"']*)\2/g;
let rewritten = 0;
for (const file of files) {
  const ext = file.endsWith(".mjs") ? ".mjs" : ".js";
  const src = readFileSync(file, "utf8");
  const out = src.replace(SPEC_RE, (m, pre, q, spec) => {
    if (/\.(mjs|cjs|js|json|css)$/.test(spec)) return m;
    const abs = resolve(dirname(file), spec);
    let target = null;
    if (existsSync(abs + ext)) target = spec + ext;
    else if (existsSync(join(abs, "index" + ext))) target = spec.replace(/\/$/, "") + "/index" + ext;
    if (!target) {
      fail(`${relative(pkgRoot, file)}: 상대 import '${spec}' 의 대상(${ext})을 찾지 못함`);
      return m;
    }
    rewritten++;
    return pre + q + target + q;
  });
  if (out !== src) writeFileSync(file, out);
}

// 2. 목록 파일에 지시문 삽입
// 지시문 프롤로그(파일 앞쪽 문자열 문장 나열) 안에 "use client" 가 있는지 본다.
// CJS 는 "use strict" 뒤에 올 수도 있으므로 첫 줄만 보지 않는다.
function hasUseClient(code) {
  let s = code;
  for (;;) {
    s = s.replace(/^(?:\s+|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, "");
    const m = /^(["'])([^"'\n]*)\1\s*;?/.exec(s);
    if (!m) return false;
    if (m[2] === "use client") return true;
    s = s.slice(m[0].length);
  }
}

const listed = new Set();
for (const { path, reason } of CLIENT_MODULES) {
  if (!reason) fail(`client-modules: '${path}' 에 근거(reason)가 없음`);
  if (!["ts", "tsx"].some((x) => existsSync(join(srcDir, `${path}.${x}`)))) {
    fail(`client-modules: 소스 src/${path}.ts(x) 가 없음`);
    continue;
  }
  for (const ext of [".mjs", ".js"]) {
    const file = join(distDir, path + ext);
    if (!existsSync(file)) {
      fail(`client-modules: 산출물 dist/${path}${ext} 가 없음`);
      continue;
    }
    const code = readFileSync(file, "utf8");
    if (!hasUseClient(code)) writeFileSync(file, `${DIRECTIVE}\n${code}`);
  }
  listed.add(path);
}

// 3. 검사
const CLIENT_API_RE =
  /\b(useState|useEffect|useLayoutEffect|useInsertionEffect|useRef|useReducer|useContext|createContext|useSyncExternalStore|useImperativeHandle|useTransition|useOptimistic|useActionState|useDeferredValue)\s*\(/;
// 컴파일된 JSX props 의 인라인 핸들러: onClick: () => ..., onClick: (e) => ..., onClick: function
// (onClick: onRetry 처럼 받은 prop 을 그대로 넘기는 것은 걸리지 않습니다)
const INLINE_HANDLER_RE = /\bon[A-Z][A-Za-z]*\s*:\s*(?:async\s+)?(?:\([^()]*\)|[A-Za-z_$][\w$]*)\s*=>|\bon[A-Z][A-Za-z]*\s*:\s*function\b/;
let withDirective = 0;
for (const file of files) {
  const id = toId(file);
  const code = readFileSync(file, "utf8");
  const has = hasUseClient(code);
  if (has) withDirective++;
  if (listed.has(id)) {
    if (!has) fail(`dist/${relative(distDir, file)}: 목록 파일인데 "use client" 가 없음`);
    continue;
  }
  if (has) fail(`dist/${relative(distDir, file)}: 목록 밖 파일에 "use client" 가 있음(client-modules.mjs 에 근거와 함께 추가하거나 소스에서 지시문 제거)`);
  const api = CLIENT_API_RE.exec(code);
  if (api) fail(`dist/${relative(distDir, file)}: 목록 밖 파일이 ${api[1]}() 를 씀 - 서버 컴포넌트에서 깨짐. client-modules.mjs 에 추가하세요`);
  const h = INLINE_HANDLER_RE.exec(code);
  if (h) fail(`dist/${relative(distDir, file)}: 목록 밖 파일에 인라인 이벤트 핸들러(${h[0].slice(0, 40)}) - 서버 컴포넌트에서 깨짐. client-modules.mjs 에 추가하세요`);
}

// 4. exports 대조
const pkg = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8"));
const exportKeys = new Set(Object.keys(pkg.exports || {}));
for (const [key, val] of Object.entries(pkg.exports || {})) {
  const targets = typeof val === "string" ? [val] : Object.values(val);
  for (const t of targets) {
    if (!existsSync(join(pkgRoot, t))) fail(`exports['${key}']: 대상 ${t} 가 없음`);
  }
}
let entries = 0;
for (const e of readdirSync(distDir, { withFileTypes: true })) {
  if (!e.isDirectory() || !existsSync(join(distDir, e.name, "index.mjs"))) continue;
  entries++;
  if (!exportKeys.has(`./${e.name}`)) fail(`dist/${e.name}/index.mjs 가 package.json exports 에 없음('./${e.name}' 추가 필요)`);
}

if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`[postbuild] 실패 ${errors.length}건`);
  process.exit(1);
}
console.log(
  `[postbuild] OK - 파일 ${files.length}개, 상대 import 보정 ${rewritten}건, "use client" ${withDirective}개 파일(목록 ${listed.size}개 x ESM · CJS), 서브패스 엔트리 ${entries}개 exports 대조`
);
