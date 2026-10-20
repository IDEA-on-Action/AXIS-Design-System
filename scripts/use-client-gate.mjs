/**
 * G1: "use client" 지시문 정적 검사 (WI-0050 D4 · FR-6)
 *
 * tarball 을 푼 패키지 디렉터리(package/)를 보고 다음을 확인합니다.
 *   1. 지시문 목록 파일의 ESM(.mjs) · CJS(.js) 산출물에 "use client" 가 있다
 *      (CJS 는 "use strict" 다음 줄에 올 수 있어 첫 줄이 아니라 지시문 프롤로그 전체를 본다)
 *   2. 루트 배럴(dist/index) 과 cn · *Variants 를 내보내는 파일에는 지시문이 없다
 *      (서버 컴포넌트에서 cn() · buttonVariants() 를 호출할 수 있어야 한다. D1 · D2)
 *   3. 목록 밖 파일에 상태 훅(useState · useEffect · useRef · useReducer · useLayoutEffect 등) ·
 *      createContext · useContext 호출, 인라인 이벤트 핸들러, "use client" 의존 패키지의 점 접근
 *      (cmdk 의 Command.Input 같은 것)이 없다
 *      인라인 핸들러는 props 자리에 화살표 · function 을 바로 쓴 경우만 본다. 지역 함수를 넘기는 경우
 *      (const h = () => {}; onClick: h)는 prop 을 그대로 넘기는 형태와 구분되지 않아 여기서는 통과하고,
 *      G2(pack-install-smoke.mjs --rsc-only)의 ESM 렌더가 'Event handlers cannot be passed' 로 잡는다
 *
 * 목록은 각 패키지의 단일 출처를 읽습니다(여기에 복제하지 않습니다).
 *   - @axis-ds/ui-react · @axis-ds/agentic-ui: packages/<dir>/scripts/client-modules.mjs 의 CLIENT_MODULES
 *   - @axis-ds/theme: 단일 엔트리 전체가 클라이언트 전용이라 모든 JS 산출물에 지시문(D3).
 *     목록 파일이 없으므로 "전부" 규칙으로 둡니다.
 * scripts/ 는 tarball 에 들어가지 않으므로 목록은 저장소 쪽(같은 이름의 워크스페이스 패키지)에서 읽습니다.
 *
 * 사용:
 *   모듈: import { checkUseClient } from './use-client-gate.mjs'  (pack-smoke.mjs 가 호출)
 *   CLI : node scripts/use-client-gate.mjs <tgz 경로>...         (이미 있는 tarball 검사. 음성 대조용)
 *         종료 코드 0 통과 / 1 결함 / 2 측정 실패
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');

/** 검사 대상 패키지와 목록 출처. 목록 자체는 여기 두지 않는다 */
export const USE_CLIENT_PACKAGES = {
  '@axis-ds/ui-react': { dir: 'axis-ui-react', mode: 'list' },
  '@axis-ds/agentic-ui': { dir: 'axis-agentic-ui', mode: 'list' },
  '@axis-ds/theme': { dir: 'axis-theme', mode: 'all' },
};

// 지시문 프롤로그(파일 앞쪽 문자열 문장 나열) 안에 "use client" 가 있는지 본다
export function hasUseClient(code) {
  let s = code;
  for (;;) {
    s = s.replace(/^(?:\s+|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/, '');
    const m = /^(["'])([^"'\n]*)\1\s*;?/.exec(s);
    if (!m) return false;
    if (m[2] === 'use client') return true;
    s = s.slice(m[0].length);
  }
}

// CJS 는 `(0, import_react.useState)(` 꼴로도 나오므로 이름 뒤 `)` 를 허용한다
const CLIENT_API_RE =
  /\b(useState|useEffect|useLayoutEffect|useInsertionEffect|useRef|useReducer|useContext|createContext|useSyncExternalStore|useImperativeHandle|useTransition|useOptimistic|useActionState|useDeferredValue)\s*\)?\s*\(/;
// 컴파일된 JSX props 의 인라인 핸들러: onError: () => ..., onClick: (e) => ..., onClick: function
const INLINE_HANDLER_RE =
  /\bon[A-Z][A-Za-z]*\s*:\s*(?:async\s+)?(?:\([^()]*\)|[A-Za-z_$][\w$]*)\s*=>|\bon[A-Z][A-Za-z]*\s*:\s*function\b/;
// 서버에서 호출할 수 있어야 하는 내보내기 이름
const SERVER_CALLABLE_RE = /^(cn|[a-z][A-Za-z0-9]*Variants)$/;

function walkJs(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walkJs(p, acc);
    else if (/\.(mjs|js)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** ESM 산출물의 export { a, b as c } / export { x } from '...' 에서 공개 이름을 모은다 */
function esmExportNames(code) {
  const names = new Set();
  for (const m of code.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const part of m[1].split(',')) {
      const p = part.trim();
      if (!p) continue;
      const as = p.split(/\s+as\s+/);
      names.add((as[1] || as[0]).trim());
    }
  }
  for (const m of code.matchAll(/export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
  return names;
}

/**
 * 의존 패키지 중 진입 파일이 "use client" 인 것(서버에서 점 접근하면 깨지는 모듈)을 찾는다.
 * 워크스페이스 패키지 디렉터리에서 import · require 두 해석으로 연다.
 */
function clientDeps(wsPkgDir, deps) {
  const req = createRequire(join(wsPkgDir, 'package.json'));
  const out = [];
  for (const dep of deps) {
    let isClient = false;
    let resolved = 0;
    for (const how of ['require', 'import']) {
      try {
        const file = how === 'require'
          ? req.resolve(dep)
          : fileURLToPath(import.meta.resolve(dep, pathToFileURL(join(wsPkgDir, 'package.json')).href));
        resolved++;
        if (hasUseClient(readFileSync(file, 'utf8'))) isClient = true;
      } catch {
        // 한쪽 해석만 있는 패키지도 있다
      }
    }
    if (resolved === 0) out.push({ dep, unresolved: true });
    else if (isClient) out.push({ dep });
  }
  return out;
}

/** 파일에서 "use client" 의존 패키지의 내보내기를 점으로 접근하는 곳을 찾는다 */
export function clientDotAccess(code, clientDepNames) {
  const hits = [];
  for (const dep of clientDepNames) {
    const q = dep.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    // ESM 이름 import: import { Command as CommandPrimitive } from "cmdk" → CommandPrimitive.Input
    for (const m of code.matchAll(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']${q}["']`, 'g'))) {
      for (const part of m[1].split(',')) {
        const local = part.trim().split(/\s+as\s+/).pop()?.trim();
        if (!local) continue;
        const re = new RegExp(`(?<![\\w$.])${local.replace(/\$/g, '\\$')}\\.([A-Z][\\w$]*)`);
        const h = re.exec(code);
        if (h) hits.push(`${dep}: ${h[0]}`);
      }
    }
    // ESM 네임스페이스 import: import * as X from "dep" → X.Name.Sub (X.Name 은 이름 있는 내보내기라 괜찮다)
    // CJS: var import_dep = require("dep") → import_dep.Name.Sub
    const nsBindings = [
      ...[...code.matchAll(new RegExp(`import\\s*\\*\\s*as\\s+([\\w$]+)\\s+from\\s*["']${q}["']`, 'g'))].map((m) => m[1]),
      ...[...code.matchAll(new RegExp(`(?:var|const|let)\\s+([\\w$]+)\\s*=\\s*(?:__toESM\\()?require\\(\\s*["']${q}["']`, 'g'))].map((m) => m[1]),
    ];
    for (const ns of nsBindings) {
      const re = new RegExp(`(?<![\\w$.])${ns.replace(/\$/g, '\\$')}\\.[\\w$]+\\.([A-Z][\\w$]*)`);
      const h = re.exec(code);
      if (h) hits.push(`${dep}: ${h[0]}`);
    }
  }
  return hits;
}

/**
 * G1 본체. root 는 tarball 을 푼 package/ 디렉터리.
 * 반환: { checked, directives, listed, clientDeps } 와 함께 fail(msg) · measureFail(msg) 를 부른다.
 */
export async function checkUseClient(name, root, fail, measureFail = fail) {
  const conf = USE_CLIENT_PACKAGES[name];
  if (!conf) return null;
  const wsPkgDir = join(ROOT, 'packages', conf.dir);
  const distDir = join(root, 'dist');
  if (!existsSync(distDir)) {
    measureFail(`G1: tarball 에 dist/ 가 없음`);
    return null;
  }
  const files = walkJs(distDir);
  if (files.length === 0) {
    measureFail('G1: dist 안 JS 파일 0개');
    return null;
  }
  const toId = (file) => relative(distDir, file).split(sep).join('/').replace(/\.(mjs|js)$/, '');

  // 1. 목록 읽기(단일 출처)
  let listed;
  if (conf.mode === 'all') {
    listed = new Set(files.map(toId));
  } else {
    const listFile = join(wsPkgDir, 'scripts', 'client-modules.mjs');
    if (!existsSync(listFile)) {
      measureFail(`G1: 목록 파일 없음(${relative(ROOT, listFile)})`);
      return null;
    }
    const { CLIENT_MODULES } = await import(pathToFileURL(listFile).href);
    if (!Array.isArray(CLIENT_MODULES) || CLIENT_MODULES.length === 0) {
      measureFail(`G1: ${relative(ROOT, listFile)} 의 CLIENT_MODULES 가 비어 있음`);
      return null;
    }
    listed = new Set(CLIENT_MODULES.map((m) => m.path));
  }

  // 서버 호출 함수(cn · *Variants)를 내보내는 파일 id: .mjs 의 export 블록 기준, .js 에도 같은 id 로 적용
  const serverCallable = new Map();
  for (const f of files.filter((x) => x.endsWith('.mjs'))) {
    const names = [...esmExportNames(readFileSync(f, 'utf8'))].filter((n) => SERVER_CALLABLE_RE.test(n));
    if (names.length) serverCallable.set(toId(f), names);
  }

  // "use client" 의존 패키지(점 접근 검사 대상)
  const pkgJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const deps = clientDeps(wsPkgDir, Object.keys(pkgJson.dependencies || {}));
  for (const d of deps.filter((x) => x.unresolved)) {
    measureFail(`G1: 의존 ${d.dep} 를 워크스페이스에서 해석하지 못해 "use client" 여부를 판정 못함`);
  }
  const clientDepNames = deps.filter((x) => !x.unresolved).map((x) => x.dep);

  // 2. 목록 파일: ESM · CJS 모두 지시문
  for (const id of listed) {
    for (const ext of ['.mjs', '.js']) {
      const f = join(distDir, id + ext);
      if (!existsSync(f)) {
        fail(`G1: 목록 파일 산출물 dist/${id}${ext} 가 tarball 에 없음`);
        continue;
      }
      if (!hasUseClient(readFileSync(f, 'utf8'))) fail(`G1: 목록 파일 dist/${id}${ext} 에 "use client" 가 없음`);
    }
    if (conf.mode === 'list' && serverCallable.has(id)) {
      fail(`G1: 목록 파일 dist/${id} 가 서버 호출 함수(${serverCallable.get(id).join(', ')})를 내보냄 - 지시문 없는 파일로 분리해야 함`);
    }
  }

  // 3. 목록 밖 파일 + 루트 배럴 · cn · *Variants 파일
  let directives = 0;
  for (const f of files) {
    const id = toId(f);
    const rel = `dist/${relative(distDir, f).split(sep).join('/')}`;
    const code = readFileSync(f, 'utf8');
    const has = hasUseClient(code);
    if (has) directives++;
    if (listed.has(id)) continue;
    if (has) {
      const why = id === 'index' ? '루트 배럴' : serverCallable.has(id) ? `서버 호출 함수(${serverCallable.get(id).join(', ')}) 파일` : '목록 밖 파일';
      fail(`G1: ${why} ${rel} 에 "use client" 가 있음`);
    }
    const api = CLIENT_API_RE.exec(code);
    if (api) fail(`G1: 목록 밖 파일 ${rel} 이 ${api[1]}() 를 씀 - 서버 컴포넌트에서 깨짐`);
    const h = INLINE_HANDLER_RE.exec(code);
    if (h) fail(`G1: 목록 밖 파일 ${rel} 에 인라인 이벤트 핸들러(${h[0].slice(0, 40)})`);
    for (const hit of clientDotAccess(code, clientDepNames)) {
      fail(`G1: 목록 밖 파일 ${rel} 이 "use client" 모듈 내보내기를 점으로 접근(${hit})`);
    }
  }
  // 루트 배럴 실재(없으면 2번 검사가 빈 집합으로 통과해 버린다)
  if (conf.mode === 'list' && !files.some((f) => toId(f) === 'index')) measureFail('G1: 루트 배럴 dist/index 가 없음');

  return {
    checked: files.length,
    directives,
    listed: listed.size,
    serverCallable: [...serverCallable.values()].flat(),
    clientDeps: clientDepNames,
  };
}

/** 사람이 읽는 한 줄 요약 */
export function describeG1(r) {
  const uniq = [...new Set(r.serverCallable)];
  return `G1 "use client": JS ${r.checked}개 검사, 지시문 ${r.directives}개 파일(목록 ${r.listed}개), `
    + `서버 호출 함수 ${uniq.length}개(${uniq.join(', ') || '없음'}), "use client" 의존 ${r.clientDeps.length}개(${r.clientDeps.join(', ') || '없음'})`;
}

// CLI: node scripts/use-client-gate.mjs <tgz>...
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tgzs = process.argv.slice(2).map((p) => resolve(p));
  if (tgzs.length === 0) {
    console.error('사용: node scripts/use-client-gate.mjs <tgz 경로>...');
    process.exit(2);
  }
  let failures = 0;
  let measureErrors = 0;
  for (const tgz of tgzs) {
    const tmp = mkdtempSync(join(tmpdir(), 'axis-g1-'));
    let name = tgz;
    try {
      execFileSync('tar', ['-xzf', tgz, '-C', tmp], { stdio: 'pipe' });
      const root = join(tmp, 'package');
      name = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name;
      if (!USE_CLIENT_PACKAGES[name]) {
        console.error(`  ! [${name}] G1 대상 패키지가 아님`);
        measureErrors++;
        continue;
      }
      const r = await checkUseClient(
        name,
        root,
        (m) => { console.error(`  ✗ [${name}] ${m}`); failures++; },
        (m) => { console.error(`  ! [${name}] 측정 실패: ${m}`); measureErrors++; },
      );
      if (r) console.log(`  · [${name}] ${describeG1(r)}`);
    } catch (e) {
      console.error(`  ! [${name}] 측정 실패: ${String(e.message).split('\n')[0]}`);
      measureErrors++;
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (measureErrors > 0) {
    console.error(`\n[use-client-gate] 측정 실패 ${measureErrors}건${failures ? `, 결함 ${failures}건` : ''}`);
    process.exit(2);
  }
  if (failures > 0) {
    console.error(`\n[use-client-gate] FAIL - ${failures}건 결함`);
    process.exit(1);
  }
  console.log(`\n[use-client-gate] OK - tarball ${tgzs.length}개`);
}
