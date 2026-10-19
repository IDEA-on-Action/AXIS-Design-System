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
 * 사용:
 *   node scripts/pack-install-smoke.mjs [패키지 디렉터리...]
 *   node scripts/pack-install-smoke.mjs --tarball <tgz 경로>   (이미 있는 tarball 로 검사. 음성 대조용)
 *
 * 종료 코드: 0 통과 / 1 결함 / 2 측정 실패(pack · 설치 실패, 검사한 서브패스 0개, tsc 없음)
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const tarballIdx = args.indexOf('--tarball');
const givenTarball = tarballIdx >= 0 ? resolve(args[tarballIdx + 1]) : null;
const pkgDirs = givenTarball
  ? [null]
  : (args.length > 0 ? args : ['packages/axis-tokens']).map((p) => resolve(ROOT, p));

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

if (measureErrors > 0) {
  console.error(`\n[pack-install-smoke] 측정 실패 ${measureErrors}건${failures ? `, 결함 ${failures}건` : ''}`);
  process.exit(2);
}
if (failures > 0) {
  console.error(`\n[pack-install-smoke] FAIL - ${failures}건 결함`);
  process.exit(1);
}
console.log(`\n[pack-install-smoke] OK - ${pkgDirs.length}개 패키지 설치 후 로드 통과`);
