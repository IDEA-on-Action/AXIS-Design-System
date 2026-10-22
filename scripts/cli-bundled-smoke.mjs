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
 *
 * 네트워크는 127.0.0.1 만 씁니다(npm 설치 없음). 사용: node scripts/cli-bundled-smoke.mjs [--cli <dist/index.js>]
 * 종료 코드: 0 통과 / 1 결함 / 2 측정 실패(cli 빌드 산출물 없음 · 훅 미동작)
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
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

function run(args, cwd, registry, netLog) {
  return new Promise((done) => {
    const child = spawn(process.execPath, ['--import', HOOK, CLI, ...args], {
      cwd,
      env: { ...process.env, AXIS_REGISTRY_URL: registry, NET_LOG: netLog, NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
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
  const files = {
    button: join(dir, 'src/components/ui/button.tsx'),
    utils: join(dir, 'src/components/ui/utils.ts'),
    labels: join(dir, 'src/components/ui/agentic-a11y-labels.ts'),
    tool: join(dir, 'src/components/agentic/tool-call-card.tsx'),
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
  const file = join(dir, 'src/components/ui/button.tsx');
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

server.close();
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
