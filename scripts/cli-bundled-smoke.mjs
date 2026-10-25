#!/usr/bin/env node
/**
 * G3 · G4 실행 파일 수준 스모크 (WI-0045 FR-7 · AC2 · AC3)
 *
 * 폴백(D1) · 덮어쓰기(D3) · 경로 이탈의 세부 갈래는 cli 단위 테스트(packages/axis-cli/src/registry/registry.test.ts,
 * src/add/add.test.ts)가 덮습니다. 이 스크립트는 그 위에 「빌드한 dist/index.js 를 실제로 실행했을 때」만 봅니다.
 *   G3-a AXIS_REGISTRY_URL=http://127.0.0.1:9(접속 불가)로 add 하면 dist/registry(동봉본)에서 설치, 폴백 안내 정확히 1번
 *   G3-b 404 + HTML 을 주는 로컬 서버로도 같음
 *        양성 대조: 네트워크 훅 기록에 원격 요청 시도가 있어야 함(원격을 건너뛴 것이 아님을 확인)
 *   G4-a -y 는 내용이 다른 기존 파일을 건너뜀(사용자 수정 유지), --overwrite 만 덮어씀
 *   G4-b componentsDir 가 ../ 로 프로젝트 밖이면 rc 1, 밖에 파일이 생기지 않음
 *   D7   AXIS_REGISTRY_URL 을 준 init -y 뒤 axis.config.json registry 는 기본값(env 값을 기록하지 않음)
 *   D5   동봉본의 registryDependencies 는 절대 URL(<공개 URL>/<이름>.json)인데, 그 basename 으로 utils ·
 *        agentic-a11y-labels 를 같은 동봉본에서 찾아 설치(G3 의 설치 파일 검사가 이 경로를 지남)
 *   N    비TTY(WI-0075): stdin 을 /dev/null(stdio ignore)과 빈 파이프 두 조건으로 주고, 질문이 뜨는 경로가
 *        「질문 한 줄 · 파일 0 · rc 0」으로 끝나지 않는지 봅니다. 템플릿은 127.0.0.1 서버의 2파일 픽스처(AXIS_TEMPLATE_URL).
 *        template init(--dir 없음 → ./<이름>, 이름 없음 → rc 1) · template apply 충돌(rc 1, 바이트 그대로) ·
 *        init(-y 없음 → 기본값, 내용이 다른 utils.ts 가 있으면 rc 1 · 바이트 그대로) · v0 import(rc 1). 갈래 실행 건수가 기대와 다르면 측정 실패(rc 2).
 *        이 갈래는 진입점의 `await program.parseAsync()` 안전망도 빌드 산출물로 지납니다(단위 테스트는 못 봄).
 *
 * 네트워크는 127.0.0.1 만 씁니다(npm 설치 없음). 사용: node scripts/cli-bundled-smoke.mjs [--cli <dist/index.js>]
 * 종료 코드: 0 통과 / 1 결함 / 2 측정 실패(cli 빌드 산출물 없음 · 훅 미동작)
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cliArg = process.argv.indexOf('--cli');
const CLI = cliArg >= 0 ? resolve(process.argv[cliArg + 1]) : join(ROOT, 'packages', 'axis-cli', 'dist', 'index.js');
const BUNDLED = join(dirname(CLI), 'registry', 'index.json');
const FALLBACK_NOTICE = '원격 레지스트리에 접근하지 못해';
/** init 이 config 에 적는 기본 registry(packages/axis-cli/src/registry/remote.ts DEFAULT_REGISTRY_URL) */
const DEFAULT_CONFIG_REGISTRY = 'https://axis-design-system.pages.dev/r';

if (!existsSync(CLI)) {
  console.error(`[cli-smoke] 측정 실패: cli 빌드 산출물이 없습니다: ${CLI}`);
  process.exit(2);
}

const work = mkdtempSync(join(tmpdir(), 'axis-cli-smoke-'));
const HOOK = join(work, 'net-hook.mjs');
writeFileSync(HOOK, `import { appendFileSync } from 'node:fs';
const file = process.env.NET_LOG;
appendFileSync(file, 'loaded\\n');
const orig = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  try {
    const res = await orig(input, init);
    appendFileSync(file, 'fetch ' + String(input) + ' ' + res.status + '\\n');
    return res;
  } catch (e) {
    appendFileSync(file, 'fetch ' + String(input) + ' ERR ' + (e?.cause?.code ?? e?.name) + '\\n');
    throw e;
  }
};
`);

// 404 + HTML 을 주는 서버(배포 사이트 오경로 · WAF 오류 페이지 흉내)
const server = createServer((_req, res) => {
  res.writeHead(404, { 'content-type': 'text/html' });
  res.end('<!doctype html><html><body>not found</body></html>');
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const HTML404 = `http://127.0.0.1:${server.address().port}/r`;

// 비TTY 갈래(N)용 템플릿 서버: index.json · smoke.json 만 200
const TPL = {
  name: 'Smoke', slug: 'smoke', description: 'cli-smoke 픽스처', category: 'dashboard', version: '1.0.0',
  tags: [], features: [], dependencies: {}, devDependencies: {}, updatedAt: '2026-10-25T00:00:00.000Z',
  files: [
    { path: 'package.json', content: '{ "name": "smoke" }\n', type: 'config' },
    { path: 'app/page.tsx', content: 'export default function Page() { return null; }\n', type: 'page' },
  ],
};
const tplServer = createServer((req, res) => {
  const body = req.url === '/templates/index.json'
    ? { version: '1', updatedAt: TPL.updatedAt, total: 1, templates: [TPL] }
    : req.url === '/templates/smoke.json' ? TPL : undefined;
  res.writeHead(body ? 200 : 404, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body ?? { error: 'not found' }));
});
await new Promise((ok) => tplServer.listen(0, '127.0.0.1', ok));
const TEMPLATE_URL = `http://127.0.0.1:${tplServer.address().port}/templates`;

/** stdin: 'ignore'(= /dev/null, 기본) 또는 'empty-pipe'(파이프를 열고 바로 닫음) */
function run(args, cwd, registry, netLog, stdin = 'ignore') {
  return new Promise((done) => {
    const child = spawn(process.execPath, ['--import', HOOK, CLI, ...args], {
      cwd,
      env: { ...process.env, AXIS_REGISTRY_URL: registry, AXIS_TEMPLATE_URL: TEMPLATE_URL, NET_LOG: netLog, NO_COLOR: '1' },
      stdio: [stdin === 'empty-pipe' ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    });
    if (stdin === 'empty-pipe') child.stdin.end();
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => done({ rc: code ?? 1, out }));
  });
}

let failures = 0;
let measureErrors = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => { console.error(`  ✗ ${msg}`); failures++; };
const check = (cond, msg, detail = '') => (cond ? ok(msg) : bad(`${msg}${detail ? `\n${detail}` : ''}`));

function newProject(name) {
  const dir = join(work, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, private: true, dependencies: { react: '19.1.0' } }, null, 2));
  return dir;
}
const count = (text, needle) => text.split(needle).length - 1;

/**
 * 설치 위치는 init 이 실제로 기록한 axis.config.json 에서 읽는다(WI-0049: src 가 없으면 ./components/ui).
 * 경로를 스모크에 박으면 init 기본값이 바뀔 때마다 스모크가 낡는다. agentic 은 add.ts 와 같은 규칙
 * (agenticDir 이 없으면 componentsDir 의 형제 agentic)을 따른다.
 */
function installDirs(dir) {
  const cfg = JSON.parse(readFileSync(join(dir, 'axis.config.json'), 'utf8'));
  const ui = join(dir, cfg.componentsDir);
  const agentic = cfg.agenticDir ? join(dir, cfg.agenticDir) : join(dirname(ui), 'agentic');
  return { ui, agentic };
}

// 동봉본이 없어도 여기서 멈추지 않습니다(G3 검사가 결함으로 잡아야 함)
const bundledVersion = existsSync(BUNDLED) ? JSON.parse(readFileSync(BUNDLED, 'utf8')).version : '없음';
console.log(`[cli-smoke] cli ${CLI} (동봉본 version ${bundledVersion})`);

for (const [label, registry] of [['G3-a 접속 불가(127.0.0.1:9)', 'http://127.0.0.1:9/r'], ['G3-b 404 HTML', HTML404]]) {
  console.log(`\n${label}`);
  const dir = newProject(label.slice(0, 4));
  const netLog = join(dir, 'net.log');
  const init = await run(['init', '-y'], dir, registry, netLog);
  if (init.rc !== 0) { bad(`init -y rc ${init.rc}\n${init.out}`); continue; }
  const cfgRegistry = JSON.parse(readFileSync(join(dir, 'axis.config.json'), 'utf8')).registry;
  check(
    cfgRegistry === DEFAULT_CONFIG_REGISTRY && cfgRegistry !== registry,
    `D7: env(${registry})를 준 init 뒤 config.registry 가 기본값(받은 값 ${cfgRegistry})`
  );
  const r = await run(['add', 'button', 'agentic-tool-call-card', '-y'], dir, registry, netLog);
  const net = existsSync(netLog) ? readFileSync(netLog, 'utf8') : '';
  if (!net.startsWith('loaded')) { console.error('  ! 측정 실패: 네트워크 훅이 로드되지 않음'); measureErrors++; continue; }
  check(r.rc === 0, `add rc 0 (받은 값 ${r.rc})`, r.out);
  check(count(r.out, FALLBACK_NOTICE) === 1, `폴백 안내 정확히 1번(${count(r.out, FALLBACK_NOTICE)}번)`, r.out);
  check(net.includes(`fetch ${registry}/index.json`), '양성 대조: 원격 index.json 요청을 시도함', net);
  const { ui, agentic } = installDirs(dir);
  const files = {
    button: join(ui, 'button.tsx'),
    utils: join(ui, 'utils.ts'),
    labels: join(ui, 'agentic-a11y-labels.ts'),
    tool: join(agentic, 'tool-call-card.tsx'),
  };
  const missing = Object.values(files).filter((f) => !existsSync(f));
  check(missing.length === 0, '동봉본에서 button · utils · agentic-a11y-labels · tool-call-card 설치', missing.join('\n'));
  if (missing.length === 0) {
    const all = Object.values(files).map((f) => readFileSync(f, 'utf8')).join('\n');
    check(!all.includes('@/registry/'), '설치본에 @/registry/ import 가 남지 않음');
    check(readFileSync(files.tool, 'utf8').startsWith('"use client"'), 'tool-call-card 첫 줄 "use client"');
    check(readFileSync(files.tool, 'utf8').includes('from "../ui/agentic-a11y-labels"'), 'tool-call-card 의 a11y-labels import 가 설치 위치 기준 상대 경로');
  }
}

console.log('\nG4-a 덮어쓰기(-y 건너뜀, --overwrite 만 덮어씀)');
{
  const dir = newProject('g4a');
  const netLog = join(dir, 'net.log');
  const reg = 'http://127.0.0.1:9/r';
  await run(['init', '-y'], dir, reg, netLog);
  const first = await run(['add', 'button', '-y'], dir, reg, netLog);
  const file = join(installDirs(dir).ui, 'button.tsx');
  if (first.rc !== 0 || !existsSync(file)) {
    bad(`첫 설치 실패 rc ${first.rc}\n${first.out}`);
  } else {
    const original = readFileSync(file, 'utf8');
    appendFileSync(file, '\n// 사용자 수정\n');
    const edited = readFileSync(file, 'utf8');
    const y = await run(['add', 'button', '-y'], dir, reg, netLog);
    check(y.rc === 0 && readFileSync(file, 'utf8') === edited, '-y: 내용이 다른 기존 파일을 건너뛰고 사용자 수정 유지', y.out);
    check(y.out.includes('--overwrite'), '-y: 건너뛴 목록과 --overwrite 안내', y.out);
    const o = await run(['add', 'button', '--overwrite'], dir, reg, netLog);
    check(o.rc === 0 && readFileSync(file, 'utf8') === original, '--overwrite: 레지스트리 내용으로 덮어씀', o.out);
  }
}

console.log('\nG4-b 경로 이탈(componentsDir ../outside)');
{
  const dir = newProject('g4b');
  const netLog = join(dir, 'net.log');
  const reg = 'http://127.0.0.1:9/r';
  await run(['init', '-y'], dir, reg, netLog);
  const cfgFile = join(dir, 'axis.config.json');
  const cfg = JSON.parse(readFileSync(cfgFile, 'utf8'));
  cfg.componentsDir = '../outside';
  writeFileSync(cfgFile, JSON.stringify(cfg, null, 2));
  mkdirSync(join(work, 'outside'), { recursive: true });
  const r = await run(['add', 'button', '-y', '--overwrite'], dir, reg, netLog);
  // rc 1 만으로는 다른 실패(모르는 옵션 · 레지스트리 없음)와 구별되지 않아 거부 사유 문구까지 봅니다
  check(r.rc === 1 && r.out.includes('프로젝트 디렉터리 밖'), `프로젝트 밖 componentsDir 는 경로 이탈로 거부, rc 1 (받은 값 ${r.rc})`, r.out);
  check(!existsSync(join(work, 'outside', 'button.tsx')) && !existsSync(join(work, 'outside', 'utils.ts')), '프로젝트 밖에 파일이 생기지 않음');
}

console.log('\nN 비TTY 질문 처리(WI-0075: stdin /dev/null · 빈 파이프)');
{
  const reg = 'http://127.0.0.1:9/r';
  const filesUnder = (dir) => {
    const res = {};
    const walk = (cur) => {
      for (const name of readdirSync(cur)) {
        const full = join(cur, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name !== 'net.log') res[relative(dir, full)] = readFileSync(full, 'utf8');
      }
    };
    walk(dir);
    return res;
  };
  const EXPECTED_RUNS = 12;
  let runs = 0;
  for (const stdin of ['ignore', 'empty-pipe']) {
    const tag = stdin === 'ignore' ? '/dev/null' : '빈 파이프';
    {
      const dir = join(work, `n-init-nodir-${stdin}`);
      mkdirSync(dir, { recursive: true });
      const r = await run(['template', 'init', 'smoke'], dir, reg, join(dir, 'net.log'), stdin); runs++;
      const made = existsSync(join(dir, 'smoke')) ? Object.keys(filesUnder(join(dir, 'smoke'))).sort() : [];
      check(
        r.rc === 0 && JSON.stringify(made) === JSON.stringify(['app/page.tsx', 'axis.config.json', 'package.json'].map((p) => p.split('/').join(sep)).sort()),
        `${tag} template init smoke(--dir 없음): ./smoke 에 3파일 · rc 0 (받은 값 rc ${r.rc}, ${made.length}파일)`,
        r.out
      );
      check(r.out.includes("기본값 'smoke'"), `${tag} template init: 쓴 디렉토리를 1줄로 알림`, r.out);
    }
    {
      const dir = join(work, `n-init-noslug-${stdin}`);
      mkdirSync(dir, { recursive: true });
      const r = await run(['template', 'init'], dir, reg, join(dir, 'net.log'), stdin); runs++;
      check(
        r.rc === 1 && Object.keys(filesUnder(dir)).length === 0 && r.out.includes('템플릿 이름을 주세요'),
        `${tag} template init(이름 없음): rc 1 · 파일 0 · 이름 안내 (받은 값 rc ${r.rc})`,
        r.out
      );
    }
    {
      const dir = join(work, `n-apply-conflict-${stdin}`);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'package.json'), '// 사용자 파일\n');
      const before = JSON.stringify(filesUnder(dir));
      const r = await run(['template', 'apply', 'smoke'], dir, reg, join(dir, 'net.log'), stdin); runs++;
      check(
        r.rc === 1 && JSON.stringify(filesUnder(dir)) === before && r.out.includes('apply smoke -y'),
        `${tag} template apply 충돌(-y 없음): rc 1 · 기존 파일 바이트 그대로 · -y 안내 (받은 값 rc ${r.rc})`,
        r.out
      );
    }
    {
      const dir = newProject(`n-init-noy-${stdin}`);
      const r = await run(['init'], dir, reg, join(dir, 'net.log'), stdin); runs++;
      check(
        r.rc === 0 && existsSync(join(dir, 'axis.config.json')) && r.out.includes('기본값으로 진행합니다(-y 와 같음)'),
        `${tag} init(-y 없음): 기본값으로 axis.config.json 생성 · 1줄 알림 · rc 0 (받은 값 rc ${r.rc})`,
        r.out
      );
    }
    {
      // 덮어쓰기 확인은 기본값으로 대신하지 않음: 내용이 다른 utils.ts 가 있으면 rc 1 · 바이트 그대로(WI-0075 D1)
      const dir = newProject(`n-init-noy-overwrite-${stdin}`);
      mkdirSync(join(dir, 'components', 'ui'), { recursive: true });
      writeFileSync(join(dir, 'components', 'ui', 'utils.ts'), 'export const mine = 2\n');
      const before = JSON.stringify(filesUnder(dir));
      const r = await run(['init'], dir, reg, join(dir, 'net.log'), stdin); runs++;
      check(
        r.rc === 1 && JSON.stringify(filesUnder(dir)) === before && r.out.includes('axis init -y'),
        `${tag} init(-y 없음) 내용이 다른 utils.ts: rc 1 · 바이트 그대로 · -y 안내 (받은 값 rc ${r.rc})`,
        r.out
      );
    }
    {
      const dir = join(work, `n-v0-${stdin}`);
      mkdirSync(dir, { recursive: true });
      const r = await run(['v0', 'import'], dir, reg, join(dir, 'net.log'), stdin); runs++;
      check(
        r.rc === 1 && Object.keys(filesUnder(dir)).length === 0 && r.out.includes('axis v0 convert'),
        `${tag} v0 import: rc 1 · 파일 0 · convert 안내 (받은 값 rc ${r.rc})`,
        r.out
      );
    }
  }
  console.log(`  비TTY 갈래 ${runs}건 실행`);
  if (runs !== EXPECTED_RUNS) {
    console.error(`  ! 측정 실패: 비TTY 갈래 실행 ${runs}건(기대 ${EXPECTED_RUNS}건)`);
    measureErrors++;
  }
}

server.close();
tplServer.close();
rmSync(work, { recursive: true, force: true });
if (measureErrors) {
  console.error(`\n[cli-smoke] 측정 실패 ${measureErrors}건${failures ? `, 결함 ${failures}건` : ''}`);
  process.exit(2);
}
if (failures) {
  console.error(`\n[cli-smoke] FAIL - ${failures}건`);
  process.exit(1);
}
console.log('\n[cli-smoke] OK');
