#!/usr/bin/env node
/**
 * AC5 shadcn CLI 직접 설치 스모크 (WI-0045 AC5 · D5 · D9)
 *
 * axis CLI 를 거치지 않고 shadcn CLI(기본 4.21.4)로 AXIS 레지스트리 항목을 URL 로 직접 설치해도 빌드되는지 봅니다.
 * registryDependencies 가 레지스트리 절대 URL(<공개 URL>/<이름>.json, D5)이라 shadcn 이 공식 레지스트리(ui.shadcn.com)로
 * 가지 않고 같은 레지스트리의 utils · agentic-a11y-labels 를 받아야 합니다.
 *
 * 순서(D9: 사용자가 실제로 밟는 경로 그대로. components.json 을 직접 쓰지 않음)
 *   1. 127.0.0.1 임시 포트에 정적 서버를 띄우고, 그 URL 을 공개 URL(AXIS_REGISTRY_PUBLIC_URL)로 준
 *      `build-registry --out <작업>/registry` 사본을 만듭니다(배포본 apps/web/public/r 는 건드리지 않음).
 *   2. create-next-app(15.5.28, --ts --tailwind --eslint --app --src-dir, pnpm) 픽스처, globals.css 는 Quick Start
 *      「Tailwind CSS 4」 두 줄, @axis-ds/tokens 는 워크스페이스 pack. 기준 앱 next build 를 양성 대조로 먼저 돌립니다.
 *   3. `shadcn init -b radix -p nova --yes --no-monorepo`(radix 베이스 · nova 프리셋, 비대화, stdin 닫음. -p 가 없으면 프리셋 선택 프롬프트가 남). init 은 공식 레지스트리에서 스타일 ·
 *      색 · button · utils 를 받고 npm 패키지 cn 을 dependencies 에 넣습니다. 이 단계의 ui.shadcn.com 요청은 판정하지 않고
 *      네트워크 기록 훅의 양성 대조로 씁니다(기록되지 않으면 아래 「0건」은 측정 실패라 rc 2).
 *      base-ui 기본 프리셋(init --defaults, base-nova)은 select 의 asChild → render 변환으로 빌드가 실패해 쓰지 않습니다
 *      (알려진 한계, Quick Start 안내).
 *   4. `shadcn add <URL...> --overwrite --yes` 로 대표 항목(button · dialog · select · agentic-tool-call-card)을 한 번에
 *      설치합니다. --overwrite 는 init 이 만든 utils.ts(`export { cn } from "cn"` 계열)를 AXIS utils 로 바꾸려고 붙입니다.
 *      init 이 button.tsx 도 만든 경우에만 그 파일이 AXIS 판으로 바뀌었는지 함께 봅니다(radix · nova 의 4.21.4 init 은
 *      button.tsx 를 만들지 않아 이 검사는 건너뛰고 로그에 한 줄 남깁니다).
 *
 * 판정(하나라도 어기면 rc 1)
 *   - shadcn add rc 0
 *   - 항목마다 컴포넌트 파일이 실제로 생성(init 이 button.tsx 를 만든 경우 그 판과 다른 AXIS 판으로 바뀜)
 *   - 설치된 src/lib/utils.ts 가 레지스트리 utils 항목(AXIS utils)과 같은 내용
 *   - 설치된 파일(컴포넌트 · utils)이 npm 패키지 cn 을 import 하지 않음
 *   - add 단계에서 npm 패키지 cn 을 설치하려 하지 않음: add 동안 패키지 레지스트리에 /cn 메타데이터 요청 0건.
 *     양성 대조로 add 가 새로 넣은 패키지 중 하나 이상의 메타데이터 요청이 기록돼야 합니다(없으면 측정 실패 rc 2).
 *     package.json 비교만으로는 init 이 cn 을 이미 넣은 경우 add 가 다시 넣어도 구분하지 못하기 때문입니다.
 *     레지스트리 데이터 기준(받은 항목 JSON 의 dependencies 에 cn 선언 0건)도 함께 봅니다. init 이 넣은 cn 은 남음(기록만)
 *   - add 실행 동안 ui.shadcn.com 요청 중 /r/colors/ 를 뺀 요청 0건(colors 요청 수는 기록. init 이 baseColor neutral 을
 *     적으므로 shadcn 4.21.4 는 항목과 관계없이 /r/colors/neutral.json 을 받음). 네트워크 기록 훅: fetch · http(s).request ·
 *     dns.lookup. 그리고 로컬 서버가 utils.json · agentic-a11y-labels.json 을 받았음(URL 의존을 따라간 양성 대조)
 *   - 네 항목을 쓰는 서버 page 로 린트 포함 next build rc 0
 *
 * 사용: node scripts/registry-shadcn-smoke.mjs [--items a,b] [--work <상위 dir>] [--keep] [--shadcn-version v] [--cna-version v]
 * 종료 코드: 0 통과 / 1 결함 / 2 측정 실패(픽스처 · 기준 빌드 · init 실패, 양성 대조 실패, 산출물 없음)
 * 로컬 서버는 이 프로세스 안의 http 서버라 끝날 때 server.close() 로 닫습니다(별도 프로세스 없음).
 * 자식 프로세스는 stdin 을 닫고(ignore) 15분 상한으로 돌립니다(대화형 프롬프트가 나도 멈춰 기다리지 않음).
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_DIR = join(ROOT, 'packages', 'axis-tokens');
const OFFICIAL_HOST = 'ui.shadcn.com';

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : def;
};
const items = opt('--items', 'button,dialog,select,agentic-tool-call-card').split(',').map((s) => s.trim()).filter(Boolean);
const shadcnVersion = opt('--shadcn-version', '4.21.4');
const cnaVersion = opt('--cna-version', '15.5.28');
const keep = argv.includes('--keep');
// --work 는 상위 디렉터리입니다. 스크립트는 그 아래에 새 하위 디렉터리(mkdtemp)를 만들고, 정리할 때도 그 하위만 지웁니다.
// 사용자가 준 경로 자체(원래 들어 있던 파일 포함)는 절대 지우지 않습니다.
const workParent = opt('--work', null) ? resolve(opt('--work')) : tmpdir();
mkdirSync(workParent, { recursive: true });
const work = mkdtempSync(join(workParent, 'axis-ac5-'));

const log = (...a) => console.log('[ac5]', ...a);
const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;
let server = null;
function cleanup() {
  if (server) {
    try { server.closeAllConnections(); server.close(); } catch { /* 이미 닫힘 */ }
  }
  if (!keep) rmSync(work, { recursive: true, force: true });
}
function measureFail(msg) {
  console.error(`[ac5] 측정 실패: ${msg}`);
  cleanup();
  process.exit(2);
}

/**
 * 자식 프로세스 그룹 정리(WI-0045 n5). 자식은 detached 로 띄워 자기 프로세스 그룹의 리더가 되고, timeout · 이 스크립트의
 * 종료(exit · SIGINT · SIGTERM · SIGHUP) · 자식 종료 때 그룹 전체(-pid)에 SIGKILL 을 보냅니다. 자식만 죽이면 pnpm dlx shadcn 이 띄운
 * pnpm add 같은 손자 프로세스가 남아 계속 돕니다(실측). --run-timeout-ms 는 명령 하나의 상한을 낮춥니다(재현 · 점검용).
 * 한계: 자식이 별도 그룹이라, 이 스크립트가 처리기를 돌리지 못하고 죽는 경우(밖에서 보낸 SIGKILL, 예: `timeout -k` 의 마지막 단계)에는
 * 손자 그룹이 남습니다. 그런 경우를 대비해 밖에서 이 스크립트를 끝낼 때는 SIGTERM 을 먼저 보내고 충분히 기다리세요.
 */
const RUN_TIMEOUT_CAP_MS = Number(opt('--run-timeout-ms', '0')) || Infinity;
const liveGroups = new Set();
function killGroup(pid) {
  try {
    process.kill(-pid, 'SIGKILL');
  } catch {
    /* 그룹이 이미 비었음(ESRCH) */
  }
}
function killAllGroups() {
  for (const pid of liveGroups) killGroup(pid);
  liveGroups.clear();
}
process.on('exit', killAllGroups);
for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
  process.on(sig, () => {
    console.error(`[ac5] ${sig} 를 받아 자식 프로세스 그룹을 끝내고 멈춥니다`);
    killAllGroups();
    try {
      cleanup();
    } catch {
      /* 정리 대상이 아직 준비되지 않음 */
    }
    process.exit(code);
  });
}

function run(cmd, args, { cwd, env, timeoutMs = 15 * 60 * 1000 } = {}) {
  const limitMs = Math.min(timeoutMs, RUN_TIMEOUT_CAP_MS);
  return new Promise((done) => {
    const t0 = Date.now();
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });
    if (child.pid !== undefined) liveGroups.add(child.pid);
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid !== undefined) killGroup(child.pid);
    }, limitMs);
    const settle = () => {
      clearTimeout(timer);
      // 자식이 끝난 뒤에도 그룹에 남은 손자(백그라운드로 떨어진 것)를 함께 끝냅니다
      if (child.pid !== undefined) {
        killGroup(child.pid);
        liveGroups.delete(child.pid);
      }
    };
    // 'close' 는 stdout · stderr 파이프가 모두 닫혀야 옵니다. 손자가 파이프를 물려받아 쥐고 있으면 자식이 끝나도
    // 상한까지 기다리게 되므로, 자식이 끝나는 'exit' 에서 그룹을 정리해 파이프를 닫고 rc 는 exit 의 값으로 정합니다
    let exited = null;
    child.on('exit', (code, signal) => {
      exited = { code, signal };
      if (child.pid !== undefined) killGroup(child.pid);
    });
    child.on('close', (closeCode, closeSignal) => {
      const code = exited ? exited.code : closeCode;
      const signal = exited ? exited.signal : closeSignal;
      settle();
      const note = timedOut ? `\n[ac5] ${limitMs}ms 상한에 걸려 프로세스 그룹을 끝냈습니다` : '';
      done({ rc: timedOut ? 124 : code ?? (signal ? 124 : 1), stdout, stderr: stderr + note, ms: Date.now() - t0 });
    });
    child.on('error', (e) => {
      settle();
      done({ rc: 127, stdout, stderr: stderr + String(e), ms: Date.now() - t0 });
    });
  });
}

if (!existsSync(join(TOKENS_DIR, 'dist', 'css'))) measureFail('@axis-ds/tokens dist 가 없습니다(먼저 빌드)');

// ---------------------------------------------------------------- 1. 로컬 서버와 레지스트리 사본
const registryDir = join(work, 'registry');
const served = [];
server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  served.push(url.pathname);
  const m = url.pathname.match(/^\/r\/([a-z0-9-]+\.json)$/);
  const file = m ? join(registryDir, m[1]) : null;
  if (!file || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/html' });
    res.end('<html>not found</html>');
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(readFileSync(file));
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const PUBLIC_URL = `http://127.0.0.1:${server.address().port}/r`;
const timing = {};
{
  const r = await run(process.execPath, [join(ROOT, 'scripts', 'build-registry.mjs'), '--out', registryDir], {
    cwd: ROOT,
    env: { AXIS_REGISTRY_PUBLIC_URL: PUBLIC_URL },
  });
  if (r.rc !== 0) measureFail(`build-registry --out 실패 rc ${r.rc}\n${(r.stdout + r.stderr).slice(-2000)}`);
  // 사본의 registryDependencies 가 로컬 공개 URL 을 쓰는지(배포본 URL 이면 shadcn 이 pages.dev 로 감)
  let deps = 0;
  for (const f of readdirSync(registryDir)) {
    if (f === 'index.json' || f === 'registry.json') continue;
    for (const d of JSON.parse(readFileSync(join(registryDir, f), 'utf8')).registryDependencies ?? []) {
      if (!d.startsWith(`${PUBLIC_URL}/`)) measureFail(`사본 ${f} 의 registryDependencies 가 로컬 공개 URL 이 아님: ${d}`);
      deps++;
    }
  }
  if (deps === 0) measureFail('사본에 registryDependencies 가 0건(측정 대상 없음)');
  for (const n of items) if (!existsSync(join(registryDir, `${n}.json`))) measureFail(`레지스트리에 없는 항목: ${n}`);
  log(`레지스트리 사본 ${registryDir} (공개 URL ${PUBLIC_URL}, registryDependencies ${deps}건)`);
}

// 네트워크 기록 훅. 프로세스마다 NODE_OPTIONS 로 실려 pnpm · shadcn · shadcn 이 띄운 pnpm add 모두에 걸립니다.
const HOOK = join(work, 'net-hook.mjs');
writeFileSync(HOOK, `import { appendFileSync } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
const file = process.env.AC5_NET_LOG;
const rec = (kind, target) => { try { appendFileSync(file, kind + ' ' + target + '\\n'); } catch {} };
rec('loaded', process.pid);
// 요청 대상을 경로까지 남깁니다(/r/colors/ 와 그 밖의 요청을 가르려고)
const targetOf = (a, b) => {
  try {
    if (typeof a === 'string' || a instanceof URL) return String(a);
    if (a && typeof a === 'object') return (a.protocol || '') + '//' + (a.hostname || a.host || '') + (a.path || '');
  } catch {}
  return String(b?.hostname ?? b?.host ?? '?') + String(b?.path ?? '');
};
for (const [name, mod] of [['http', http], ['https', https]]) {
  for (const fn of ['request', 'get']) {
    const orig = mod[fn];
    mod[fn] = function (...args) { rec(name + '.' + fn, targetOf(args[0], args[1])); return orig.apply(this, args); };
  }
}
const origLookup = dns.lookup;
dns.lookup = function (host, ...rest) { rec('dns', host); return origLookup.call(this, host, ...rest); };
if (dns.promises?.lookup) {
  const p = dns.promises.lookup;
  dns.promises.lookup = function (host, ...rest) { rec('dns', host); return p.call(this, host, ...rest); };
}
if (globalThis.fetch) {
  const origFetch = globalThis.fetch;
  globalThis.fetch = function (input, init) {
    let u = input;
    try { u = typeof input === 'string' || input instanceof URL ? String(input) : input.url; } catch {}
    rec('fetch', u);
    return origFetch.call(this, input, init);
  };
}
`);
const netEnv = (netLog) => ({
  NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import ${HOOK}`.trim(),
  AC5_NET_LOG: netLog,
  NEXT_TELEMETRY_DISABLED: '1',
});
const readNet = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const officialHits = (net) => net.split('\n').filter((l) => l.includes(OFFICIAL_HOST));

// ---------------------------------------------------------------- 2. 픽스처
const app = join(work, 'app');
{
  const cfg = join(work, 'xdg-config');
  mkdirSync(cfg, { recursive: true });
  let r = await run('pnpm', [
    'dlx', `create-next-app@${cnaVersion}`, 'app',
    '--ts', '--tailwind', '--eslint', '--app', '--src-dir', '--import-alias', '@/*',
    '--use-pnpm', '--skip-install', '--disable-git', '--yes',
  ], { cwd: work, env: { XDG_CONFIG_HOME: cfg, CI: '1', NEXT_TELEMETRY_DISABLED: '1' } });
  timing.cna = r.ms;
  if (r.rc !== 0 || !existsSync(join(app, 'package.json'))) measureFail(`create-next-app 실패 rc ${r.rc}\n${(r.stdout + r.stderr).slice(-2000)}`);
  const pkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
  if (!/^15\.5\./.test(pkg.dependencies?.next ?? '')) measureFail(`픽스처 next 가 15.5 가 아님: ${pkg.dependencies?.next}`);

  const vendor = join(app, 'vendor');
  mkdirSync(vendor, { recursive: true });
  r = await run('pnpm', ['pack', '--pack-destination', vendor], { cwd: TOKENS_DIR });
  const tgz = readdirSync(vendor).find((f) => f.startsWith('axis-ds-tokens-') && f.endsWith('.tgz'));
  if (r.rc !== 0 || !tgz) measureFail(`@axis-ds/tokens pack 실패 rc ${r.rc}`);
  pkg.dependencies['@axis-ds/tokens'] = `file:./vendor/${tgz}`;
  writeFileSync(join(app, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  writeFileSync(join(app, 'src', 'app', 'globals.css'), '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n');

  r = await run('pnpm', ['install'], { cwd: app });
  timing.install = r.ms;
  if (r.rc !== 0) measureFail(`픽스처 pnpm install 실패\n${(r.stdout + r.stderr).slice(-2000)}`);
  r = await run('pnpm', ['build'], { cwd: app, env: { NEXT_TELEMETRY_DISABLED: '1' } });
  timing.baseBuild = r.ms;
  if (r.rc !== 0) measureFail(`기준 앱 next build 실패(픽스처 문제)\n${(r.stdout + r.stderr).slice(-3000)}`);
  rmSync(join(app, '.next'), { recursive: true, force: true });
  log(`픽스처 준비: create-next-app ${secs(timing.cna)}, install ${secs(timing.install)}, 기준 빌드 ${secs(timing.baseBuild)} rc 0`);
}

// ---------------------------------------------------------------- 3. shadcn init(radix) + 네트워크 기록 양성 대조
const hasCn = (p) => ['dependencies', 'devDependencies'].some((f) => p[f] && Object.hasOwn(p[f], 'cn'));
const utilsFile = join(app, 'src', 'lib', 'utils.ts');
let initButton = null;
{
  const netLog = join(work, 'net-init.log');
  const r = await run('pnpm', ['dlx', `shadcn@${shadcnVersion}`, 'init', '-b', 'radix', '-p', 'nova', '--yes', '--no-monorepo'], {
    cwd: app,
    env: netEnv(netLog),
  });
  timing.init = r.ms;
  writeFileSync(join(work, 'init.out'), r.stdout + r.stderr);
  const net = readNet(netLog);
  if (!net.includes('loaded')) measureFail('shadcn init 에서 네트워크 기록 훅이 로드되지 않음');
  if (r.rc !== 0 || !existsSync(join(app, 'components.json'))) {
    measureFail(`shadcn init -b radix 실패 rc ${r.rc}\n${(r.stdout + r.stderr).slice(-2000)}`);
  }
  const official = officialHits(net).filter((l) => !l.startsWith('dns '));
  if (official.length === 0) {
    measureFail(`양성 대조 실패: shadcn init 이 ${OFFICIAL_HOST} 요청을 기록하지 않음. 아래 0건 판정을 믿을 수 없음`);
  }
  const cfgJson = JSON.parse(readFileSync(join(app, 'components.json'), 'utf8'));
  const initPkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
  const initButtonFile = join(app, 'src', 'components', 'ui', 'button.tsx');
  initButton = existsSync(initButtonFile) ? readFileSync(initButtonFile, 'utf8') : null;
  log(
    `shadcn init -b radix rc 0 (${secs(r.ms)}): style ${cfgJson.style}, baseColor ${cfgJson.tailwind?.baseColor || '(빈 값)'}, ` +
      `${OFFICIAL_HOST} 요청 ${official.length}건(양성 대조), init 뒤 package.json 의 cn: ${hasCn(initPkg) ? '있음' : '없음'}, ` +
      `init 이 만든 button.tsx: ${initButton === null ? '없음' : '있음'}`
  );
}
const pkgBefore = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));

// ---------------------------------------------------------------- 4. shadcn add --overwrite
let failures = 0;
const check = (cond, msg, detail = '') => {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ ${msg}${detail ? `\n${detail}` : ''}`); failures++; }
};
const addLog = join(work, 'net-add.log');
served.length = 0;
const urls = items.map((n) => `${PUBLIC_URL}/${n}.json`);
const add = await run('pnpm', ['dlx', `shadcn@${shadcnVersion}`, 'add', ...urls, '--overwrite', '--yes'], { cwd: app, env: netEnv(addLog) });
timing.add = add.ms;
writeFileSync(join(work, 'add.out'), add.stdout + add.stderr);
const addNet = readNet(addLog);
if (!addNet.includes('loaded')) measureFail('shadcn add 에서 네트워크 기록 훅이 로드되지 않음');
console.log(`\nshadcn@${shadcnVersion} add ${items.join(' ')} --overwrite (${secs(add.ms)})`);
check(add.rc === 0, `shadcn add rc 0 (받은 값 ${add.rc})`, (add.stdout + add.stderr).slice(-1500));
// dns 줄은 호스트만 남으므로 경로가 있는 요청 줄(fetch · http(s).request)로 가립니다
const addOfficial = officialHits(addNet).filter((l) => !l.startsWith('dns '));
const colorReqs = addOfficial.filter((l) => /ui\.shadcn\.com\/r\/colors\//.test(l));
const nonColors = addOfficial.filter((l) => !/ui\.shadcn\.com\/r\/colors\//.test(l));
log(`add 동안 ${OFFICIAL_HOST} 요청: /r/colors/ ${colorReqs.length}건, 그 밖 ${nonColors.length}건`);
for (const l of colorReqs) console.log(`    ${l}`);
check(nonColors.length === 0, `${OFFICIAL_HOST} 요청 중 /r/colors/ 를 뺀 요청 0건 (${nonColors.length}건)`, nonColors.slice(0, 10).join('\n'));
for (const dep of ['utils', 'agentic-a11y-labels']) {
  check(served.includes(`/r/${dep}.json`), `양성 대조: 로컬 서버가 URL 의존 ${dep}.json 을 받음`, served.join('\n'));
}

const axisUtils = JSON.parse(readFileSync(join(registryDir, 'utils.json'), 'utf8')).files[0].content;
check(existsSync(utilsFile) && readFileSync(utilsFile, 'utf8') === axisUtils, '설치된 src/lib/utils.ts 가 AXIS utils 와 같은 내용(--overwrite 로 init 판을 바꿈)');

const pkgAfter = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8'));
const addedDeps = Object.keys(pkgAfter.dependencies ?? {}).filter((d) => !(d in (pkgBefore.dependencies ?? {})));
log(`shadcn add 가 추가한 dependencies: ${addedDeps.join(', ') || '없음'}`);
// add 동안의 패키지 메타데이터 요청(로컬 레지스트리 · ui.shadcn.com 제외)을 경로(패키지 이름)로 모읍니다.
// 스코프 패키지는 @scope%2Fname 으로 요청되므로 디코드해 비교합니다.
const pkgReqNames = [];
for (const line of addNet.split('\n')) {
  const sp = line.indexOf(' ');
  if (sp < 0 || line.startsWith('dns ') || line.startsWith('loaded ')) continue;
  let u;
  try { u = new URL(line.slice(sp + 1).trim()); } catch { continue; }
  if (u.hostname === '127.0.0.1' || u.hostname === 'localhost' || u.hostname === OFFICIAL_HOST) continue;
  try { pkgReqNames.push(decodeURIComponent(u.pathname.replace(/^\//, ''))); } catch { /* 디코드 불가 경로는 무시 */ }
}
const controlHits = addedDeps.filter((d) => pkgReqNames.includes(d));
if (controlHits.length === 0) {
  measureFail(
    `양성 대조 실패: add 가 새로 넣은 패키지(${addedDeps.join(', ') || '없음'})의 메타데이터 요청이 기록되지 않음. ` +
      `아래 「cn 요청 0건」을 믿을 수 없음`
  );
}
const cnReqs = pkgReqNames.filter((n) => n === 'cn');
check(
  cnReqs.length === 0,
  `add 단계에서 npm 패키지 cn 메타데이터 요청 0건 (${cnReqs.length}건, 양성 대조: 새 패키지 요청 ${controlHits.length}/${addedDeps.length}건 기록)`
);
const servedItems = readdirSync(registryDir).filter((f) => f.endsWith('.json') && f !== 'index.json' && f !== 'registry.json');
const cnDeclared = servedItems.filter((f) => (JSON.parse(readFileSync(join(registryDir, f), 'utf8')).dependencies ?? []).some((d) => d === 'cn' || d.startsWith('cn@')));
check(cnDeclared.length === 0, `레지스트리 항목 dependencies 에 cn 선언 0건 (${servedItems.length}개 항목 중 ${cnDeclared.length}건: ${cnDeclared.join(', ') || '없음'})`);
log(`package.json 의 cn: init 뒤 ${hasCn(pkgBefore) ? '있음' : '없음'} → add 뒤 ${hasCn(pkgAfter) ? '있음' : '없음'}(기록만)`);
if (hasCn(pkgAfter)) log('참고: init 이 넣은 npm 패키지 cn 은 package.json 에 남음(설치된 파일은 쓰지 않음, 필요 없으면 직접 지움)');

// 설치 위치는 shadcn 규칙을 따르므로 파일을 찾아 import 경로를 만듭니다
function findFile(dir, base) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.next') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      const f = findFile(p, base);
      if (f) return f;
    } else if (e.name === base) return p;
  }
  return null;
}
/** npm 패키지 cn 을 가리키는 import · export from */
const importsNpmCn = (src) => /\bfrom\s*["']cn["']|\bimport\s*\(\s*["']cn["']\s*\)|\brequire\s*\(\s*["']cn["']\s*\)/.test(src);
check(existsSync(utilsFile) && !importsNpmCn(readFileSync(utilsFile, 'utf8')), 'src/lib/utils.ts 가 npm 패키지 cn 을 import 하지 않음');
const PAGE = {
  button: { names: 'Button', jsx: '<Button>AC5 button</Button>', file: 'button.tsx' },
  dialog: { names: 'Dialog, DialogTrigger, DialogContent, DialogTitle', jsx: '<Dialog><DialogTrigger>AC5 dialog</DialogTrigger><DialogContent><DialogTitle>t</DialogTitle></DialogContent></Dialog>', file: 'dialog.tsx' },
  select: { names: 'Select, SelectTrigger, SelectValue, SelectContent, SelectItem', jsx: '<Select><SelectTrigger><SelectValue placeholder="AC5 select" /></SelectTrigger><SelectContent><SelectItem value="a">a</SelectItem></SelectContent></Select>', file: 'select.tsx' },
  'agentic-tool-call-card': { names: 'ToolCallCard', jsx: '<ToolCallCard toolName="AC5 tool" status="running" />', file: 'tool-call-card.tsx' },
};
const imports = [];
const jsx = [];
for (const n of items) {
  const spec = PAGE[n];
  if (!spec) measureFail(`page 픽스처가 없는 항목: ${n}`);
  const f = findFile(join(app, 'src'), spec.file);
  check(Boolean(f), `${n}: 설치 파일 ${spec.file} 이 src 아래에 생성됨`);
  if (!f) continue;
  const content = readFileSync(f, 'utf8');
  if (n === 'button') {
    if (initButton !== null) check(content !== initButton, 'button: init 이 만든 button.tsx 가 AXIS 판으로 바뀜(--overwrite)');
    else log('button: init 이 button.tsx 를 만들지 않아 「init 판이 AXIS 판으로 바뀜」 검사는 건너뜀');
  }
  const rel = relative(join(app, 'src'), f).split('\\').join('/').replace(/\.tsx?$/, '');
  imports.push(`import { ${spec.names} } from "@/${rel}";`);
  jsx.push(`      ${spec.jsx}`);
  check(!content.includes('@/registry/'), `${n}: 설치본에 @/registry/ import 가 남지 않음`);
  check(!importsNpmCn(content), `${n}: 설치본이 npm 패키지 cn 을 import 하지 않음`);
}
if (failures === 0) {
  writeFileSync(join(app, 'src', 'app', 'page.tsx'), `${imports.join('\n')}\n\nexport default function Page() {\n  return (\n    <main className="p-8">\n${jsx.join('\n')}\n    </main>\n  );\n}\n`);
  const b = await run('pnpm', ['build'], { cwd: app, env: { NEXT_TELEMETRY_DISABLED: '1' } });
  timing.build = b.ms;
  writeFileSync(join(work, 'build.out'), b.stdout + b.stderr);
  // eslint-disable-next-line no-control-regex
  const out = (b.stdout + b.stderr).replace(/\x1b\[[0-9;]*m/g, '');
  check(b.rc === 0, `서버 page 린트 포함 next build rc 0 (받은 값 ${b.rc}, ${secs(b.ms)})`, out.slice(-2500));
  check(/Linting and checking validity of types/.test(out), '빌드 출력에 린트 · 타입 검사 단계가 있음(린트 생략 아님)', out.slice(-800));
  const html = join(app, '.next', 'server', 'app', 'index.html');
  check(existsSync(html) && /AC5 button|AC5 tool/.test(readFileSync(html, 'utf8')), '서버 page 프리렌더 결과(.next/server/app/index.html)에 항목 출력이 있음');
}

console.log(`\n[ac5] 시간: ${Object.entries(timing).map(([k, v]) => `${k} ${secs(v)}`).join(', ')}`);
if (keep) console.log(`[ac5] 작업 디렉터리 유지: ${work}`);
cleanup();
if (failures) {
  console.error(`[ac5] FAIL - ${failures}건`);
  process.exit(1);
}
console.log('[ac5] OK');
process.exit(0);
