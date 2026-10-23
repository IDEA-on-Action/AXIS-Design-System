/**
 * 외부 소비 스모크 2단계: tarball 을 빈 디렉터리에 설치해 실제로 불러 본다 (WI-0035)
 *
 * 배경: pack-smoke.mjs 는 tarball 안의 파일이 "있는지"만 본다. @axis-ds/tokens 의
 * dist/js/tokens.mjs 는 파일이 있어서 통과했지만 TypeScript 전용 문법(`as const`)이 남아
 * Node 에서 import 하면 문법 오류였다(1.1.0~1.2.1 배포본 전부). 이 스크립트는 설치한 패키지를
 * 소비자 자리에서 직접 불러 그 부류를 잡는다.
 *
 *   1. exports 맵 전수: import 조건은 import(), require 조건은 require() 로 불러 성공해야 한다
 *      (.json 은 require 와 import ... with { type: 'json' }, .css 같은 자산은 두 해석기로 경로 해석 + 0바이트 아님)
 *   2. types 조건이 있으면 TypeScript(module/moduleResolution node16)로 그 서브패스를 import 해
 *      컴파일 오류가 없어야 한다
 *
 * 대상: 인자로 준 패키지 디렉터리(기본값 packages/axis-tokens). 다른 패키지는 런타임 의존
 * (react 등)을 설치해야 해서 아직 넣지 않았다. 넓힐 때는 그 패키지의 설치 비용과 결과를 먼저 잰다.
 *
 * G2 RSC 하네스(WI-0050 D4 · FR-6): tokens · ui-react · agentic-ui · theme tarball 을 한 소비자 디렉터리에
 * 함께 설치하고 react · react-dom · react-server-dom-webpack(그 디렉터리에만, 워크스페이스와 같은 react 버전)을
 * 더한 뒤 react-server 조건으로 각 패키지의 루트 · 서브패스 엔트리를 불러
 *   - 컴포넌트를 RSC 로 렌더해 실패 0 ("use client" 모듈은 scripts/rsc-smoke/client-loader.mjs 가 클라이언트 참조로 바꾼다)
 *   - 소문자 내보내기(cn · *Variants)를 서버에서 호출해 통과(클라이언트 참조면 실패)
 *   - 훅(use*)은 클라이언트 참조여야 함(서버에서 호출할 수 없음. 예: theme 의 useTheme)
 * 을 확인합니다. 하네스는 ESM import 경로만 봅니다(CJS 지시문 위치는 G1 이 정적으로 봅니다).
 *
 * G2 타입 해석(WI-0053 FR-3): 같은 소비자 디렉터리에서 4패키지 exports 의 types · .json 항목 전수를
 * moduleResolution node · node16(CJS · ESM) · bundler 로 tsc 하고, 각 탐침이 exports 가 가리키는 파일로
 * 해석됐는지 explainFiles 로 봅니다(scripts/types-resolution-gate.mjs). node 는 Next 15 가 만드는 tsconfig 값입니다.
 *
 * 사용:
 *   node scripts/pack-install-smoke.mjs                          (tokens 설치 스모크 + G2)
 *   node scripts/pack-install-smoke.mjs [패키지 디렉터리...]     (설치 스모크만)
 *   node scripts/pack-install-smoke.mjs --tarball <tgz 경로>     (이미 있는 tarball 로 설치 스모크. 음성 대조용)
 *   node scripts/pack-install-smoke.mjs --rsc-only [--rsc-tarball <tgz>]...
 *       G2 만 실행. --rsc-tarball 로 준 tarball 은 같은 이름 패키지의 워크스페이스 pack 을 대신한다(음성 대조용)
 *
 * 종료 코드: 0 통과 / 1 결함 / 2 측정 실패(pack · 설치 실패, 검사한 서브패스 0개, tsc 없음)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runTypesResolutionGate, summarize } from './types-resolution-gate.mjs';

const ROOT = process.cwd();
const rawArgs = process.argv.slice(2);
// G2 플래그를 먼저 떼어 낸다
const rscOnly = rawArgs.includes('--rsc-only');
const rscTarballs = [];
const args = [];
for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i] === '--rsc-only') continue;
  if (rawArgs[i] === '--rsc-tarball') { rscTarballs.push(resolve(rawArgs[++i])); continue; }
  args.push(rawArgs[i]);
}
const tarballIdx = args.indexOf('--tarball');
const givenTarball = tarballIdx >= 0 ? resolve(args[tarballIdx + 1]) : null;
const pkgDirs = rscOnly
  ? []
  : givenTarball
    ? [null]
    : (args.length > 0 ? args : ['packages/axis-tokens']).map((p) => resolve(ROOT, p));
// G2 는 인자 없는 기본 실행(pnpm pack-smoke)과 --rsc-only · --rsc-tarball 에서 돈다
const runRsc = rscOnly || rscTarballs.length > 0 || rawArgs.length === 0;

const TSC = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

let failures = 0;
let measureErrors = 0;
const fail = (name, msg) => { console.error(`  ✗ [${name}] ${msg}`); failures++; };
const measureFail = (name, msg) => { console.error(`  ! [${name}] 측정 실패: ${msg}`); measureErrors++; };

/** 소비자 디렉터리 안에서 실행하는 검사 스크립트(그 디렉터리의 node_modules 로 해석된다) */
const PROBE = `
import { createRequire } from 'node:module';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const checks = JSON.parse(process.argv[2]);
const results = [];
for (const c of checks) {
  const r = { ...c, ok: false };
  try {
    if (c.kind === 'import') {
      const m = await import(c.spec);
      r.ok = Object.keys(m).length > 0;
      r.detail = 'exports: ' + Object.keys(m).join(',');
    } else if (c.kind === 'require') {
      const m = require(c.spec);
      r.ok = m !== undefined && m !== null && (typeof m !== 'object' || Object.keys(m).length > 0);
      r.detail = 'keys: ' + (typeof m === 'object' ? Object.keys(m).length : typeof m);
    } else if (c.kind === 'import-json') {
      const m = await import(c.spec, { with: { type: 'json' } });
      r.ok = Object.keys(m.default).length > 0;
      r.detail = 'keys: ' + Object.keys(m.default).length;
    } else if (c.kind === 'asset') {
      const viaRequire = require.resolve(c.spec);
      const viaImport = fileURLToPath(import.meta.resolve(c.spec));
      r.ok = viaRequire === viaImport && existsSync(viaRequire) && statSync(viaRequire).size > 0;
      r.detail = 'bytes: ' + statSync(viaRequire).size;
    }
  } catch (e) {
    r.detail = String(e && e.message || e).split('\\n')[0];
  }
  results.push(r);
}
console.log(JSON.stringify(results));
`;

/** exports 맵에서 (서브패스, 조건, 타깃) 을 모은다 */
function exportEntries(exportsField) {
  if (typeof exportsField === 'string') return [{ sub: '.', cond: 'default', target: exportsField }];
  const out = [];
  for (const [sub, val] of Object.entries(exportsField || {})) {
    if (typeof val === 'string') out.push({ sub, cond: 'default', target: val });
    else if (val && typeof val === 'object') {
      for (const [cond, target] of Object.entries(val)) {
        if (typeof target === 'string') out.push({ sub, cond, target });
      }
    }
  }
  return out;
}

function checksFor(name, entries) {
  const checks = [];
  for (const { sub, cond, target } of entries) {
    const spec = sub === '.' ? name : `${name}/${sub.replace(/^\.\//, '')}`;
    if (cond === 'types') continue;
    if (cond === 'import') checks.push({ spec, kind: 'import', cond, target });
    else if (cond === 'require') checks.push({ spec, kind: 'require', cond, target });
    else if (target.endsWith('.json')) {
      checks.push({ spec, kind: 'require', cond, target });
      checks.push({ spec, kind: 'import-json', cond, target });
    } else if (/\.(c|m)?js$/.test(target)) {
      checks.push({ spec, kind: 'import', cond, target });
      checks.push({ spec, kind: 'require', cond, target });
    } else {
      checks.push({ spec, kind: 'asset', cond, target });
    }
  }
  return checks;
}

function typeCheck(name, consumer, entries) {
  const typed = [...new Set(entries.filter((e) => e.cond === 'types').map((e) => e.sub))];
  if (typed.length === 0) return;
  if (!existsSync(TSC)) { measureFail(name, `tsc 없음(${TSC})`); return; }
  const lines = typed.map((sub, i) => {
    const spec = sub === '.' ? name : `${name}/${sub.replace(/^\.\//, '')}`;
    return `import * as m${i} from '${spec}';\nexport const probe${i} = m${i};`;
  });
  writeFileSync(join(consumer, 'probe.mts'), lines.join('\n') + '\n');
  writeFileSync(join(consumer, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      module: 'node16', moduleResolution: 'node16', target: 'es2022', strict: true,
      noEmit: true, skipLibCheck: false, types: [],
    },
    files: ['probe.mts'],
  }));
  const r = spawnSync(process.execPath, [TSC, '-p', 'tsconfig.json'], { cwd: consumer, encoding: 'utf-8' });
  if (r.status !== 0) {
    fail(name, `TypeScript import 실패 (tsc rc=${r.status}): ${(r.stdout + r.stderr).trim().split('\n').slice(0, 3).join(' | ')}`);
  } else {
    console.log(`    ✓ types: ${typed.join(', ')} (tsc node16 rc=0)`);
  }
}

for (const pkgDir of pkgDirs) {
  const work = mkdtempSync(join(tmpdir(), 'axis-install-smoke-'));
  let name = pkgDir ? JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8')).name : givenTarball;
  try {
    // 1. tarball 확보
    let tgz = givenTarball;
    if (!tgz) {
      const packDir = join(work, 'pack');
      execFileSync('pnpm', ['pack', '--pack-destination', packDir], { cwd: pkgDir, stdio: 'pipe' });
      const f = readdirSync(packDir).find((x) => x.endsWith('.tgz'));
      if (!f) { measureFail(name, 'tarball 생성 실패'); continue; }
      tgz = join(packDir, f);
    }

    // 2. 빈 소비자 디렉터리에 설치(워크스페이스 링크 없이 npm 이 tarball 을 푼다)
    const consumer = join(work, 'consumer');
    mkdirSync(consumer, { recursive: true });
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'axis-install-smoke', private: true }));
    execFileSync('npm', ['install', tgz, '--no-audit', '--no-fund', '--ignore-scripts', '--no-package-lock'], {
      cwd: consumer, stdio: 'pipe',
    });
    const installedDir = readdirSync(join(consumer, 'node_modules'), { withFileTypes: true })
      .flatMap((d) => (d.name.startsWith('@')
        ? readdirSync(join(consumer, 'node_modules', d.name)).map((n) => join(d.name, n))
        : [d.name]))
      .map((n) => join(consumer, 'node_modules', n))
      .find((p) => existsSync(join(p, 'package.json')) && resolve(p) !== consumer);
    if (!installedDir) { measureFail(name, '설치된 패키지를 찾지 못함'); continue; }
    const installed = JSON.parse(readFileSync(join(installedDir, 'package.json'), 'utf8'));
    name = installed.name;
    console.log(`  - [${name}@${installed.version}] 빈 디렉터리 설치 완료`);

    // 3. exports 전수 런타임 로드
    const entries = exportEntries(installed.exports);
    const checks = checksFor(name, entries);
    if (checks.length === 0) { measureFail(name, '검사할 서브패스 0개'); continue; }
    writeFileSync(join(consumer, 'probe.mjs'), PROBE);
    const r = spawnSync(process.execPath, ['probe.mjs', JSON.stringify(checks)], { cwd: consumer, encoding: 'utf-8' });
    if (r.status !== 0) { measureFail(name, `probe rc=${r.status} ${r.stderr.trim().split('\n')[0]}`); continue; }
    const results = JSON.parse(r.stdout.trim().split('\n').pop());
    if (results.length !== checks.length) { measureFail(name, `결과 ${results.length}건 != 검사 ${checks.length}건`); continue; }
    for (const x of results) {
      const label = `${x.spec} [${x.cond} → ${x.target}] ${x.kind}`;
      if (x.ok) console.log(`    ✓ ${label} (${x.detail})`);
      else fail(name, `${label} 실패: ${x.detail}`);
    }

    // 4. TypeScript 로 types 조건 import
    //    타입 선언이 peer 의 타입을 참조하므로(예: tailwind-preset.d.ts → tailwindcss) 이 단계 전에만
    //    peer 를 설치한다. 버전은 워크스페이스에 설치된 것과 맞추고, 없으면 선언된 범위를 쓴다.
    //    런타임 검사(3단계)는 peer 없이 돌았으므로 런타임이 peer 를 요구하지 않는다는 것도 함께 보인다.
    //    --tarball 로 받은 경우에도 같은 이름의 워크스페이스 패키지를 찾아 그 버전을 쓴다.
    const wsDir = pkgDir || readdirSync(join(ROOT, 'packages'))
      .map((d) => join(ROOT, 'packages', d))
      .find((p) => existsSync(join(p, 'package.json'))
        && JSON.parse(readFileSync(join(p, 'package.json'), 'utf8')).name === name);
    const peers = Object.entries(installed.peerDependencies || {}).map(([dep, range]) => {
      const local = wsDir && join(wsDir, 'node_modules', dep, 'package.json');
      const ver = local && existsSync(local) ? JSON.parse(readFileSync(local, 'utf8')).version : range;
      return `${dep}@${ver}`;
    });
    if (peers.length > 0) {
      execFileSync('npm', ['install', ...peers, '--no-audit', '--no-fund', '--ignore-scripts', '--no-package-lock', '--no-save'], {
        cwd: consumer, stdio: 'pipe',
      });
      console.log(`    - 타입 검사용 peer 설치: ${peers.join(', ')}`);
    }
    typeCheck(name, consumer, entries);
  } catch (e) {
    measureFail(name, String(e.message).split('\n')[0]);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (runRsc) await runRscSmoke();

if (measureErrors > 0) {
  console.error(`\n[pack-install-smoke] 측정 실패 ${measureErrors}건${failures ? `, 결함 ${failures}건` : ''}`);
  process.exit(2);
}
if (failures > 0) {
  console.error(`\n[pack-install-smoke] FAIL - ${failures}건 결함`);
  process.exit(1);
}
console.log(`\n[pack-install-smoke] OK - ${[
  pkgDirs.length ? `${pkgDirs.length}개 패키지 설치 후 로드 통과` : '',
  runRsc ? 'G2 RSC 통과' : '',
].filter(Boolean).join(', ')}`);

// ---------------------------------------------------------------------------
// G2 타입 해석 게이트 (WI-0053)
// ---------------------------------------------------------------------------
function runTypesGate(consumer, packages) {
  const TG = 'G2-types';
  if (!existsSync(TSC)) { measureFail(TG, `tsc 없음(${TSC})`); return; }
  const t0 = Date.now();
  const res = runTypesResolutionGate({ consumer, tsc: TSC, packages });
  for (const m of res.measureErrors) measureFail(TG, m);
  const probes = res.rows.length;
  const expected = res.targets.length * res.modes.length;
  if (probes !== expected) measureFail(TG, `탐침 결과 ${probes}건 != 대상 ${res.targets.length}개 × 방식 ${res.modes.length}`);
  console.log(`  - [${TG}] 탐침 ${res.targets.length}개 × ${res.modes.join(' · ')} = ${probes}건, 실패 ${res.failures.length}건 (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  for (const line of summarize(res)) console.log(`    ${line}`);
  for (const f of res.failures.slice(0, 10)) fail(TG, f);
  // 나머지는 줄을 아끼되 결함 수에는 모두 센다
  if (res.failures.length > 10) {
    failures += res.failures.length - 10;
    console.error(`  ✗ [${TG}] 그 밖 ${res.failures.length - 10}건(위 요약 참고)`);
  }
}

// ---------------------------------------------------------------------------
// G2: RSC 하네스 (WI-0050)
// ---------------------------------------------------------------------------
async function runRscSmoke() {
  const G2 = 'G2';
  const RSC_PACKAGES = ['@axis-ds/tokens', '@axis-ds/ui-react', '@axis-ds/agentic-ui', '@axis-ds/theme'];
  // 렌더 · 호출 대상(tokens 는 의존으로만 설치)
  const PROBE_PACKAGES = ['@axis-ds/ui-react', '@axis-ds/agentic-ui', '@axis-ds/theme'];
  const HARNESS = join(ROOT, 'scripts', 'rsc-smoke');
  const work = mkdtempSync(join(tmpdir(), 'axis-rsc-smoke-'));
  const t0 = Date.now();
  try {
    const wsByName = new Map(readdirSync(join(ROOT, 'packages'))
      .map((d) => join(ROOT, 'packages', d))
      .filter((p) => existsSync(join(p, 'package.json')))
      .map((p) => [JSON.parse(readFileSync(join(p, 'package.json'), 'utf8')).name, p]));

    // 1. tarball 확보: --rsc-tarball 로 준 것이 같은 이름의 워크스페이스 pack 을 대신한다
    const tarballs = new Map();
    for (const tgz of rscTarballs) {
      const pj = JSON.parse(execFileSync('tar', ['-xzOf', tgz, 'package/package.json'], { encoding: 'utf8' }));
      tarballs.set(pj.name, tgz);
      console.log(`  - [${G2}] ${pj.name}@${pj.version} 는 주어진 tarball 사용: ${tgz}`);
    }
    const packDir = join(work, 'pack');
    for (const name of RSC_PACKAGES) {
      if (tarballs.has(name)) continue;
      const dir = wsByName.get(name);
      if (!dir) { measureFail(G2, `워크스페이스에서 ${name} 를 찾지 못함`); return; }
      const before = existsSync(packDir) ? new Set(readdirSync(packDir)) : new Set();
      execFileSync('pnpm', ['pack', '--pack-destination', packDir], { cwd: dir, stdio: 'pipe' });
      const f = readdirSync(packDir).find((x) => x.endsWith('.tgz') && !before.has(x));
      if (!f) { measureFail(G2, `${name} tarball 생성 실패`); return; }
      tarballs.set(name, join(packDir, f));
    }
    const tPack = Date.now();

    // 2. 소비자 디렉터리 설치. react 는 워크스페이스에 설치된 버전과 맞추고,
    //    react-server-dom-webpack 은 react 와 같은 버전이어야 한다(G2 전용, 저장소 의존 아님).
    //    --legacy-peer-deps: react-server-dom-webpack 의 peer 인 webpack 을 받지 않는다(서버 렌더에 쓰지 않음)
    const reactPj = join(wsByName.get('@axis-ds/ui-react'), 'node_modules', 'react', 'package.json');
    if (!existsSync(reactPj)) { measureFail(G2, `워크스페이스 react 버전을 읽지 못함(${reactPj})`); return; }
    const reactVer = JSON.parse(readFileSync(reactPj, 'utf8')).version;
    const consumer = join(work, 'consumer');
    mkdirSync(consumer, { recursive: true });
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: 'axis-rsc-smoke', private: true, type: 'module' }));
    writeFileSync(join(consumer, 'probe-entry.mjs'), 'export const imp = (s) => import(s);\n');
    execFileSync('npm', [
      'install', ...RSC_PACKAGES.map((n) => tarballs.get(n)),
      `react@${reactVer}`, `react-dom@${reactVer}`, `react-server-dom-webpack@${reactVer}`,
      '--legacy-peer-deps', '--no-audit', '--no-fund', '--ignore-scripts', '--no-package-lock',
    ], { cwd: consumer, stdio: 'pipe' });
    const tInstall = Date.now();

    // 설치된 @axis-ds 패키지가 각각 한 벌이고 버전이 tarball 과 같은지(레지스트리 사본이 끼면 측정 대상이 바뀐다)
    // 중첩 설치(node_modules/@axis-ds/x/node_modules/@axis-ds/y)도 세도록 경로 끝 모양으로만 거른다
    const found = execFileSync('find', ['node_modules', '-path', '*/@axis-ds/*/package.json'], { cwd: consumer, encoding: 'utf8' })
      .split('\n').filter((l) => /(^|\/)node_modules\/@axis-ds\/[^/]+\/package\.json$/.test(l));
    for (const name of RSC_PACKAGES) {
      const copies = found.filter((l) => l.endsWith(`${name}/package.json`));
      const want = JSON.parse(execFileSync('tar', ['-xzOf', tarballs.get(name), 'package/package.json'], { encoding: 'utf8' })).version;
      if (copies.length !== 1) { measureFail(G2, `${name} 설치본이 ${copies.length}벌(${copies.join(', ')})`); return; }
      const got = JSON.parse(readFileSync(join(consumer, copies[0]), 'utf8')).version;
      if (got !== want) { measureFail(G2, `${name} 설치 버전 ${got} != tarball ${want}`); return; }
    }

    // 2b. 타입 해석 게이트(WI-0053 FR-3): 같은 소비자 디렉터리의 4패키지 exports(types · .json) 전수를
    //     node · node16 CJS · node16 ESM · bundler 로 tsc. 탐침 수를 찍어 0 으로 무너지지 않았음을 남긴다
    runTypesGate(consumer, RSC_PACKAGES);

    // 3. 대상 spec: 루트 + exports 서브패스(.css · package.json 제외)
    const specs = [];
    for (const name of PROBE_PACKAGES) {
      const pj = JSON.parse(readFileSync(join(consumer, 'node_modules', name, 'package.json'), 'utf8'));
      const subs = typeof pj.exports === 'object' && pj.exports ? Object.keys(pj.exports) : ['.'];
      for (const sub of subs) {
        if (sub.endsWith('.css') || sub.endsWith('.json')) continue;
        specs.push(sub === '.' ? name : `${name}/${sub.replace(/^\.\//, '')}`);
      }
    }

    // 4. react-server 조건으로 실행
    const r = spawnSync(process.execPath, [
      '--conditions=react-server', '--import', pathToFileURL(join(HARNESS, 'register.mjs')).href,
      join(HARNESS, 'run.mjs'), consumer, ...specs,
    ], { cwd: consumer, encoding: 'utf-8', timeout: 180000, maxBuffer: 64 * 1024 * 1024 });
    const tRun = Date.now();
    if (r.status !== 0) {
      measureFail(G2, `하네스 rc=${r.status}${r.signal ? ` signal=${r.signal}` : ''} ${String(r.stderr).trim().split('\n').slice(-2).join(' | ')}`);
      return;
    }
    const lines = r.stdout.split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
    const env = lines.find((x) => x.type === 'env');
    if (!env || !env.reactServer || !env.rsdw) {
      measureFail(G2, `react-server 조건 미적용(env=${JSON.stringify(env)}) - 이 상태의 통과는 근거가 아님`);
      return;
    }
    const rows = lines.filter((x) => x.type === 'row');
    for (const spec of specs) {
      if (!rows.some((x) => x.spec === spec)) measureFail(G2, `${spec} 결과 0행`);
    }

    // 5. 판정
    const count = { render: 0, boundary: 0, call: 0, hook: 0, import: 0 };
    const before = failures;
    for (const x of rows) {
      count[x.kind]++;
      const where = `${x.spec} ${x.name}${x.clientRef ? '[client-ref]' : ''}`;
      if (x.kind === 'import') fail(G2, `${where} import 실패: ${x.detail}`);
      else if (x.kind === 'render') {
        if (!x.ok) fail(G2, `${where} RSC 렌더 실패: ${x.detail}`);
        else if (x.detail.startsWith('경계')) count.boundary++;
      } else if (x.kind === 'call') {
        if (x.clientRef) fail(G2, `${where} 서버 호출 불가(클라이언트 참조): ${x.detail}`);
        else if (!x.ok) fail(G2, `${where} 서버 호출 실패: ${x.detail}`);
      } else if (x.kind === 'hook' && !x.clientRef) {
        fail(G2, `${where} 훅이 클라이언트 참조가 아님(서버 그래프에서 평가됨)`);
      }
    }
    // 서버 호출 대상이 실제로 불렸는지(0건 통과 방지): ui-react 루트의 cn 과 *Variants
    const uiRootCalls = rows.filter((x) => x.spec === '@axis-ds/ui-react' && x.kind === 'call');
    const callNames = [...new Set(uiRootCalls.map((x) => x.name))];
    // AC2: 서버에서 호출할 수 있어야 하는 8개가 모두 루트 내보내기에 있어야 함(하나라도 빠지면 하위 호환 결함)
    const REQUIRED_SERVER_CALLS = [
      'cn', 'buttonVariants', 'toggleVariants', 'alertVariants', 'badgeVariants',
      'progressVariants', 'progressIndicatorVariants', 'avatarVariants',
    ];
    for (const name of REQUIRED_SERVER_CALLS) {
      if (!callNames.includes(name)) fail(G2, `@axis-ds/ui-react 루트에서 ${name} 호출 행이 없음`);
    }
    const okCalls = uiRootCalls.filter((x) => x.ok && !x.clientRef).map((x) => x.name);
    const theme = rows.find((x) => x.spec === '@axis-ds/theme' && x.name === 'ThemeProvider');

    console.log(`  - [${G2}] spec ${specs.length}개, 행 ${rows.length}개(렌더 ${count.render} 중 경계 ${count.boundary}, 호출 ${count.call}, 훅 ${count.hook}, import 실패 ${count.import}), 결함 ${failures - before}건`);
    console.log(`    서버 호출 통과(ui-react 루트): ${okCalls.length}개 ${okCalls.join(', ')}`);
    console.log(`    ThemeProvider: ${theme ? (theme.ok ? theme.detail : 'FAIL ' + theme.detail) : '행 없음'}`);
    console.log(`    비용: pack ${((tPack - t0) / 1000).toFixed(1)}s, npm install ${((tInstall - tPack) / 1000).toFixed(1)}s (react ${reactVer}, node_modules ${execFileSync('du', ['-sm', 'node_modules'], { cwd: consumer, encoding: 'utf8' }).split('\t')[0]}MB), 하네스 ${((tRun - tInstall) / 1000).toFixed(1)}s`);
  } catch (e) {
    measureFail(G2, String(e.message).split('\n')[0]);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
