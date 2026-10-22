#!/usr/bin/env node
/**
 * G2 레지스트리 설치 후 빌드 게이트 (WI-0045 FR-7 · AC1 · AC6)
 *
 * 레지스트리(apps/web/public/r)를 로컬 정적 서버(127.0.0.1)로 띄우고, 빌드한 cli(packages/axis-cli/dist)로
 * create-next-app 15.5 + Tailwind 4 + pnpm 픽스처에 항목을 하나씩 설치한 뒤
 *   1. `axis add <항목> -y` 가 rc 0 이고, 원격(로컬 서버)에서 받았는지(fetch 기록 · 폴백 안내 없음)
 *   2. cli 가 안내한 설치 명령(「package.json 에 없는 의존성」 다음 줄)만 실행
 *   3. 린트 포함 `next build` rc 0
 *   4. 서버 page(지시문 없음, 함수 prop 없음)의 프리렌더 HTML 에 항목 마크업이 있는지
 * 를 봅니다. 항목마다 픽스처를 새로 복사해서 다른 항목의 설치가 누락을 가리지 않게 합니다.
 *
 * 픽스처: create-next-app(--ts --tailwind --eslint --app --src-dir, pnpm) 기본 그대로 두고
 *   globals.css 만 `@import "tailwindcss"; @import "@axis-ds/tokens/css/tailwind4";` 로 바꿉니다(Quick Start 「Tailwind CSS 4」).
 *   @axis-ds/tokens 는 워크스페이스 pack tarball 을 씁니다(배포 전 버전도 같은 run 에서 검사). 그다음 `axis init -y`.
 *   create-next-app 의 저장된 설정(conf)은 임시 XDG_CONFIG_HOME 으로 격리합니다.
 *   기준 앱(항목 설치 전) 빌드를 양성 대조로 먼저 돌립니다. 기준 앱이 실패하면 측정 실패(rc 2)입니다.
 *
 * 사용:
 *   node scripts/registry-install-smoke.mjs                       대표 항목 5개(PR 용)
 *   node scripts/registry-install-smoke.mjs --items all           레지스트리 ui 항목 전수(릴리스 전, lib 제외 28개)
 *   node scripts/registry-install-smoke.mjs --items button,toast  고른 항목
 *   옵션: --jobs <n>(동시 항목 수, 기본 1) · --port <n>(기본 0 = 임시 포트) · --work <dir>(작업 상위 디렉터리, 그 아래 새 하위 디렉터리를 만들어 씀, 기본 임시)
 *         --keep(작업 디렉터리 남김) · --report <file>(JSON 결과) · --cna-version <v>(기본 15.5.28)
 *   음성 대조(정규화 전 레지스트리):
 *     --registry-ref <git ref>   그 ref 의 apps/web/public/r 를 꺼내 씀(예: HEAD~)
 *     --registry-dir <dir>       디렉터리를 그대로 씀
 *     --index-version <v>        index.json 에 version 이 없을 때만 넣음. 정규화 전 index 는 version 이 없어 cli 가
 *                                스키마 실패로 동봉본에 폴백하는데(1단계에서 「원격 미사용」으로 실패), 이 옵션을 주면
 *                                정규화 전 항목 내용이 실제로 설치돼 빌드 단계에서 실패하는지 볼 수 있습니다.
 *
 * 종료 코드: 0 통과 / 1 결함(항목 하나라도 실패) / 2 측정 실패(빌드 산출물 없음 · 픽스처 생성 실패 · 기준 앱 빌드 실패 · 검사 0건)
 */
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(ROOT, 'packages', 'axis-cli', 'dist', 'index.js');
const TOKENS_DIR = join(ROOT, 'packages', 'axis-tokens');

/** PR 대표 항목: Core UI 3(Slot · cva · Radix 포털) + agentic 2(use client 경계 · a11y-labels lib · utils) */
const REPRESENTATIVE = ['button', 'dialog', 'toast', 'agentic-tool-call-card', 'agentic-approval-card'];

// ---------------------------------------------------------------- 인자
const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : def;
};
const has = (name) => argv.includes(name);
const itemsArg = opt('--items', 'rep');
const jobs = Math.max(1, Number(opt('--jobs', '1')) || 1);
const port = Number(opt('--port', '0'));
const cnaVersion = opt('--cna-version', '15.5.28');
const registryRef = opt('--registry-ref', null);
const registryDirArg = opt('--registry-dir', null);
const indexVersion = opt('--index-version', null);
const reportFile = opt('--report', null);
const keep = has('--keep');
// --work 는 상위 디렉터리입니다. 스크립트는 그 아래에 새 하위 디렉터리(mkdtemp)를 만들고, 정리할 때도 그 하위만 지웁니다.
// 사용자가 준 경로 자체(원래 들어 있던 파일 포함)는 절대 지우지 않습니다.
const workParent = opt('--work', null) ? resolve(opt('--work')) : tmpdir();
mkdirSync(workParent, { recursive: true });
const work = mkdtempSync(join(workParent, 'axis-g2-'));

const log = (...a) => console.log('[g2]', ...a);
function measureFail(msg) {
  console.error(`[g2] 측정 실패: ${msg}`);
  cleanup();
  process.exit(2);
}

// ---------------------------------------------------------------- 실행 도우미(비동기: 같은 프로세스의 정적 서버가 응답해야 함)
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
    console.error(`[g2] ${sig} 를 받아 자식 프로세스 그룹을 끝내고 멈춥니다`);
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
      const note = timedOut ? `\n[g2] ${limitMs}ms 상한에 걸려 프로세스 그룹을 끝냈습니다` : '';
      done({ rc: timedOut ? 124 : code ?? (signal ? 124 : 1), stdout, stderr: stderr + note, ms: Date.now() - t0 });
    });
    child.on('error', (e) => {
      settle();
      done({ rc: 127, stdout, stderr: stderr + String(e), ms: Date.now() - t0 });
    });
  });
}
const secs = (ms) => `${(ms / 1000).toFixed(1)}s`;
/**
 * pnpm --reporter=ndjson 출력에서 네트워크로 받은 패키지 수(pnpm:progress status fetched).
 * 진행 이벤트가 하나도 없으면 null(미측정). 비 TTY 기본 리포터는 진행 줄을 내지 않아 ndjson 을 씁니다.
 */
const NDJSON = '--reporter=ndjson';
function pnpmDownloaded(out) {
  let progress = 0;
  let fetched = 0;
  for (const line of out.split('\n')) {
    if (!line.startsWith('{')) continue;
    try {
      const j = JSON.parse(line);
      if (j.name !== 'pnpm:progress') continue;
      progress++;
      if (j.status === 'fetched') fetched++;
    } catch { /* ndjson 이 아닌 줄 */ }
  }
  return progress ? fetched : null;
}

// ---------------------------------------------------------------- 사전 조건
if (!existsSync(CLI)) measureFail(`cli 빌드 산출물이 없습니다: ${CLI} (먼저 pnpm --filter @axis-ds/cli build)`);
if (!existsSync(join(ROOT, 'packages', 'axis-cli', 'dist', 'registry', 'index.json'))) {
  measureFail('cli 동봉 레지스트리(dist/registry)가 없습니다');
}
if (!existsSync(join(TOKENS_DIR, 'dist', 'css'))) measureFail('@axis-ds/tokens dist 가 없습니다(먼저 빌드)');

// ---------------------------------------------------------------- 레지스트리 준비
let registryDir = join(ROOT, 'apps', 'web', 'public', 'r');
if (registryRef) {
  registryDir = join(work, 'registry-ref');
  rmSync(registryDir, { recursive: true, force: true });
  mkdirSync(registryDir, { recursive: true });
  try {
    const tar = execFileSync('git', ['archive', registryRef, 'apps/web/public/r'], { cwd: ROOT, maxBuffer: 1 << 28 });
    execFileSync('tar', ['x', '--strip-components=4', '-C', registryDir], { input: tar });
  } catch (e) {
    measureFail(`--registry-ref ${registryRef} 에서 apps/web/public/r 를 꺼내지 못했습니다: ${e.message}`);
  }
} else if (registryDirArg) {
  registryDir = resolve(registryDirArg);
}
if (indexVersion) {
  // 원본을 건드리지 않게 사본에서만 고칩니다
  const copy = join(work, 'registry-indexed');
  rmSync(copy, { recursive: true, force: true });
  cpSync(registryDir, copy, { recursive: true });
  registryDir = copy;
  const idx = JSON.parse(readFileSync(join(registryDir, 'index.json'), 'utf8'));
  if (typeof idx.version !== 'string') {
    idx.version = indexVersion;
    writeFileSync(join(registryDir, 'index.json'), JSON.stringify(idx, null, 2));
    log(`index.json 에 version ${indexVersion} 을 넣었습니다(음성 대조용 사본)`);
  }
}
if (!existsSync(join(registryDir, 'index.json'))) measureFail(`레지스트리 index.json 이 없습니다: ${registryDir}`);
const index = JSON.parse(readFileSync(join(registryDir, 'index.json'), 'utf8'));
const indexNames = (index.items ?? []).filter((x) => x.type !== 'registry:lib').map((x) => x.name);

let items;
if (itemsArg === 'rep') items = REPRESENTATIVE;
else if (itemsArg === 'all') items = indexNames;
else items = itemsArg.split(',').map((s) => s.trim()).filter(Boolean);
if (items.length === 0) measureFail('검사할 항목이 0개입니다');

// ---------------------------------------------------------------- 서버 page 픽스처(함수 prop 없음, 지시문 없음)
// text: 프리렌더 HTML 에 있어야 하는 문자열(null 이면 래퍼 안에 요소가 있는지만 봄)
const FIXTURES = {
  button: { names: 'Button', jsx: '<Button>G2 button</Button>', text: 'G2 button' },
  badge: { names: 'Badge', jsx: '<Badge>G2 badge</Badge>', text: 'G2 badge' },
  card: { names: 'Card, CardHeader, CardTitle, CardContent', jsx: '<Card><CardHeader><CardTitle>G2 card</CardTitle></CardHeader><CardContent>c</CardContent></Card>', text: 'G2 card' },
  dialog: { names: 'Dialog, DialogTrigger, DialogContent, DialogTitle', jsx: '<Dialog><DialogTrigger>G2 dialog</DialogTrigger><DialogContent><DialogTitle>t</DialogTitle></DialogContent></Dialog>', text: 'G2 dialog' },
  input: { names: 'Input', jsx: '<Input placeholder="G2 input" />', text: 'G2 input' },
  label: { names: 'Label', jsx: '<Label>G2 label</Label>', text: 'G2 label' },
  select: { names: 'Select, SelectTrigger, SelectValue, SelectContent, SelectItem', jsx: '<Select><SelectTrigger><SelectValue placeholder="G2 select" /></SelectTrigger><SelectContent><SelectItem value="a">a</SelectItem></SelectContent></Select>', text: 'G2 select' },
  separator: { names: 'Separator', jsx: '<Separator />', text: null },
  tabs: { names: 'Tabs, TabsList, TabsTrigger, TabsContent', jsx: '<Tabs defaultValue="a"><TabsList><TabsTrigger value="a">G2 tabs</TabsTrigger></TabsList><TabsContent value="a">a</TabsContent></Tabs>', text: 'G2 tabs' },
  toast: { names: 'ToastProvider, Toast, ToastTitle, ToastViewport', jsx: '<ToastProvider><Toast open><ToastTitle>G2 toast</ToastTitle></Toast><ToastViewport /></ToastProvider>', text: null },
  'agentic-agent-avatar': { names: 'AgentAvatar', jsx: '<AgentAvatar name="G2 avatar" status="online" />', text: null },
  'agentic-approval-card': { names: 'ApprovalCard', jsx: '<ApprovalCard title="G2 approval" actions={[]} />', text: 'G2 approval' },
  'agentic-attachment-card': { names: 'AttachmentCard', jsx: '<AttachmentCard type="document" name="g2-attachment.txt" size={10} />', text: 'g2-attachment.txt' },
  'agentic-code-block': { names: 'CodeBlock', jsx: '<CodeBlock code="g2_code_block" language="ts" />', text: 'g2_code_block' },
  'agentic-context-panel': { names: 'ContextPanel', jsx: '<ContextPanel modelInfo={{ name: "G2 model" }} systemPrompt="s" />', text: null },
  'agentic-diff-viewer': { names: 'DiffViewer', jsx: '<DiffViewer before="g2-before" after="g2-after" />', text: null },
  'agentic-feedback-buttons': { names: 'FeedbackButtons', jsx: '<FeedbackButtons messageId="m1" />', text: null },
  'agentic-message-bubble': { names: 'MessageBubble', jsx: '<MessageBubble role="assistant" content="G2 message" />', text: 'G2 message' },
  'agentic-plan-card': { names: 'PlanCard', jsx: '<PlanCard title="G2 plan" steps={[{ id: "1", label: "s", status: "pending" }]} />', text: 'G2 plan' },
  'agentic-recovery-banner': { names: 'RecoveryBanner', jsx: '<RecoveryBanner message="G2 recovery" />', text: 'G2 recovery' },
  'agentic-run-progress': { names: 'RunProgress', jsx: '<RunProgress status="running" steps={[{ id: "1", label: "G2 step", status: "running" }]} />', text: null },
  'agentic-source-panel': { names: 'SourcePanel', jsx: '<SourcePanel sources={[{ id: "1", type: "web", title: "G2 source" }]} />', text: null },
  'agentic-step-timeline': { names: 'StepTimeline', jsx: '<StepTimeline steps={[{ id: "1", label: "G2 timeline", status: "complete" }]} />', text: null },
  'agentic-streaming-text': { names: 'StreamingText', jsx: '<StreamingText text="G2 stream" />', text: null },
  'agentic-surface-renderer': { names: 'SurfaceRenderer', jsx: '<SurfaceRenderer surface={{ id: "1", type: "text", content: "G2 surface" }} />', text: null },
  'agentic-thinking-indicator': { names: 'ThinkingIndicator', jsx: '<ThinkingIndicator />', text: null },
  'agentic-token-usage-indicator': { names: 'TokenUsageIndicator', jsx: '<TokenUsageIndicator current={10} max={100} />', text: null },
  'agentic-tool-call-card': { names: 'ToolCallCard', jsx: '<ToolCallCard toolName="G2 tool" status="running" />', text: 'G2 tool' },
};
const missingFixture = items.filter((n) => !FIXTURES[n]);
if (missingFixture.length) {
  // 레지스트리에 새 항목이 생겼는데 픽스처가 없으면 조용히 빼지 않고 측정 실패로 알립니다
  measureFail(`page 픽스처가 없는 항목: ${missingFixture.join(', ')} (FIXTURES 에 추가하세요)`);
}

/** 설치 위치(cli 배치 규칙 D3/FR-4: ui → componentsDir, agentic → 형제 agentic, 접두 없는 파일명) */
function installedImport(name) {
  return name.startsWith('agentic-')
    ? `@/components/agentic/${name.slice('agentic-'.length)}`
    : `@/components/ui/${name}`;
}
function pageSource(name) {
  const f = FIXTURES[name];
  return `import { ${f.names} } from "${installedImport(name)}";\n\nexport default function Page() {\n  return (\n    <main className="p-8">\n      <div data-g2-item="${name}">\n        ${f.jsx}\n      </div>\n    </main>\n  );\n}\n`;
}
/** 프리렌더 HTML 판정: 래퍼가 있고 그 안에 요소가 있으며, text 가 있으면 그 문자열도 있어야 함 */
function checkHtml(name, html) {
  const marker = `data-g2-item="${name}">`;
  const at = html.indexOf(marker);
  if (at < 0) return `래퍼(data-g2-item) 없음`;
  const after = html.slice(at + marker.length, at + marker.length + 200);
  if (!after.startsWith('<') || after.startsWith('</div>')) return `래퍼 안에 마크업 없음(${JSON.stringify(after.slice(0, 40))})`;
  const t = FIXTURES[name].text;
  if (t && !html.includes(t)) return `문자열 '${t}' 없음`;
  return null;
}

// ---------------------------------------------------------------- 정적 서버
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
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
await new Promise((ok) => server.listen(port, '127.0.0.1', ok));
const REGISTRY_URL = `http://127.0.0.1:${server.address().port}/r`;

function cleanup() {
  try { server.close(); } catch { /* 이미 닫힘 */ }
  if (!keep) rmSync(work, { recursive: true, force: true });
}

// 네트워크 기록 훅: cli 의 fetch 호출과 응답 코드를 NET_LOG 에 적습니다(원격 사용 판정 · 양성 대조)
const HOOK = join(work, 'net-hook.mjs');
writeFileSync(HOOK, `import { appendFileSync } from 'node:fs';
const file = process.env.NET_LOG;
const orig = globalThis.fetch;
appendFileSync(file, 'loaded\\n');
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
const runCli = (args, cwd, netLog) =>
  run(process.execPath, ['--import', HOOK, CLI, ...args], { cwd, env: { AXIS_REGISTRY_URL: REGISTRY_URL, NET_LOG: netLog } });
const FALLBACK_NOTICE = '원격 레지스트리에 접근하지 못해';

// ---------------------------------------------------------------- 1. 기준 픽스처
const cost = { cna: null, tokensPack: null, baseInstall: null, baseBuild: null, downloaded: {} };
const base = join(work, 'base');
log(`작업 디렉터리 ${work}, 레지스트리 ${registryDir} → ${REGISTRY_URL}, 항목 ${items.length}개, jobs ${jobs}`);
{
  const cfg = join(work, 'xdg-config'); // create-next-app 저장 설정 격리
  mkdirSync(cfg, { recursive: true });
  rmSync(base, { recursive: true, force: true });
  const r = await run('pnpm', [
    NDJSON, 'dlx', `create-next-app@${cnaVersion}`, 'base',
    '--ts', '--tailwind', '--eslint', '--app', '--src-dir', '--import-alias', '@/*',
    '--use-pnpm', '--skip-install', '--disable-git', '--yes',
  ], { cwd: work, env: { XDG_CONFIG_HOME: cfg, CI: '1', NEXT_TELEMETRY_DISABLED: '1' } });
  cost.cna = r.ms;
  cost.downloaded.cna = pnpmDownloaded(r.stdout + r.stderr); // dlx 캐시가 있으면 진행 이벤트가 없어 null
  if (r.rc !== 0 || !existsSync(join(base, 'package.json'))) {
    measureFail(`create-next-app@${cnaVersion} 실패 rc ${r.rc}\n${(r.stdout + r.stderr).slice(-2000)}`);
  }
  const pkg = JSON.parse(readFileSync(join(base, 'package.json'), 'utf8'));
  if (!/^15\.5\./.test(pkg.dependencies?.next ?? '')) measureFail(`픽스처 next 버전이 15.5 가 아닙니다: ${pkg.dependencies?.next}`);
  if (!/^\^?4/.test(pkg.devDependencies?.tailwindcss ?? '')) measureFail(`픽스처 tailwindcss 가 4 가 아닙니다: ${pkg.devDependencies?.tailwindcss}`);

  // tokens: 워크스페이스 pack 을 픽스처 안(vendor/)에 두고 상대 file: 로 씀(lockfile 이 상대 경로라 사례 디렉터리로 복사해도 풀림)
  const packDir = join(base, 'vendor');
  mkdirSync(packDir, { recursive: true });
  const p = await run('pnpm', ['pack', '--pack-destination', packDir], { cwd: TOKENS_DIR });
  cost.tokensPack = p.ms;
  const tgz = readdirSync(packDir).find((f) => f.startsWith('axis-ds-tokens-') && f.endsWith('.tgz'));
  if (p.rc !== 0 || !tgz) measureFail(`@axis-ds/tokens pack 실패 rc ${p.rc}\n${p.stderr.slice(-1000)}`);
  pkg.dependencies['@axis-ds/tokens'] = `file:./vendor/${tgz}`;
  writeFileSync(join(base, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  // Quick Start 「Tailwind CSS 4」: 토큰 진입점만 두고 create-next-app 기본 블록은 지움
  writeFileSync(join(base, 'src', 'app', 'globals.css'), '@import "tailwindcss";\n@import "@axis-ds/tokens/css/tailwind4";\n');

  const net0 = join(work, 'net-init.log');
  const init = await runCli(['init', '-y'], base, net0);
  if (init.rc !== 0 || !existsSync(join(base, 'axis.config.json'))) {
    measureFail(`axis init -y 실패 rc ${init.rc}\n${(init.stdout + init.stderr).slice(-1500)}`);
  }
  const inst = await run('pnpm', ['install', NDJSON], { cwd: base });
  cost.baseInstall = inst.ms;
  cost.downloaded.base = pnpmDownloaded(inst.stdout + inst.stderr);
  writeFileSync(join(work, 'base-install.log'), inst.stdout + inst.stderr);
  if (inst.rc !== 0) measureFail(`기준 픽스처 pnpm install 실패\n${(inst.stdout + inst.stderr).slice(-2000)}`);

  // 양성 대조: 항목 설치 전 기준 앱이 린트 포함 빌드를 통과해야 그 뒤의 실패를 항목 탓으로 읽을 수 있음
  const b = await run('pnpm', ['build'], { cwd: base, env: { NEXT_TELEMETRY_DISABLED: '1' } });
  cost.baseBuild = b.ms;
  if (b.rc !== 0) measureFail(`기준 앱 next build 실패(픽스처 문제)\n${(b.stdout + b.stderr).slice(-3000)}`);
  rmSync(join(base, '.next'), { recursive: true, force: true });
  log(`기준 픽스처 준비: create-next-app ${secs(cost.cna)}(downloaded ${cost.downloaded.cna ?? '캐시'}), tokens pack ${secs(cost.tokensPack)}, install ${secs(cost.baseInstall)}(downloaded ${cost.downloaded.base ?? '미측정'}), 기준 빌드 ${secs(cost.baseBuild)} rc 0`);
}

// ---------------------------------------------------------------- 2. 항목별
async function runItem(name) {
  const dir = join(work, 'cases', name);
  const res = { name, ok: false, stage: null, detail: '', ms: {}, downloaded: null, fetches: 0 };
  rmSync(dir, { recursive: true, force: true });
  cpSync(base, dir, { recursive: true, filter: (src) => !/[/\\](node_modules|\.next)$/.test(src) });
  const fail = (stage, detail, out = '') => {
    res.stage = stage;
    res.detail = detail;
    writeFileSync(join(dir, `g2-${stage}.log`), out);
    return res;
  };

  // 기준 lockfile 그대로 store 에서 풉니다(네트워크 없음이 기대값, 실패하면 온라인으로 재시도)
  let r = await run('pnpm', ['install', '--frozen-lockfile', '--offline', NDJSON], { cwd: dir });
  if (r.rc !== 0) r = await run('pnpm', ['install', '--frozen-lockfile', '--prefer-offline', NDJSON], { cwd: dir });
  res.ms.install = r.ms;
  res.downloadedInstall = pnpmDownloaded(r.stdout + r.stderr);
  if (r.rc !== 0) return fail('install', `pnpm install rc ${r.rc}`, r.stdout + r.stderr);

  const netLog = join(dir, 'g2-net.log');
  r = await runCli(['add', name, '-y'], dir, netLog);
  res.ms.add = r.ms;
  const addOut = r.stdout + r.stderr;
  writeFileSync(join(dir, 'g2-add.log'), addOut);
  const net = existsSync(netLog) ? readFileSync(netLog, 'utf8') : '';
  if (!net.startsWith('loaded')) {
    res.measureError = true; // 원격 사용 여부를 판정할 수 없음(결함이 아니라 측정 실패, rc 2)
    return fail('add', '네트워크 훅이 로드되지 않음(측정 실패)', addOut);
  }
  res.fetches = (net.match(/^fetch /gm) ?? []).length;
  if (r.rc !== 0) return fail('add', `axis add rc ${r.rc}: ${addOut.trim().split('\n').slice(-3).join(' | ')}`, addOut);
  if (addOut.includes(FALLBACK_NOTICE)) return fail('add', '원격 미사용(동봉본 폴백): ' + addOut.split('\n').find((l) => l.includes(FALLBACK_NOTICE)), addOut);
  for (const want of [`${REGISTRY_URL}/index.json 200`, `${REGISTRY_URL}/${name}.json 200`]) {
    if (!net.includes(`fetch ${want}`)) return fail('add', `원격 요청 기록 없음: ${want}`, addOut + '\n' + net);
  }

  // cli 가 안내한 의존성 설치 명령만 실행(AC1 「선언된 의존성 설치만으로」)
  const lines = r.stdout.split('\n');
  const at = lines.findIndex((l) => l.includes('package.json 에 없는 의존성'));
  if (at >= 0) {
    const cmd = (lines[at + 1] ?? '').trim();
    if (!cmd.startsWith('pnpm add ')) return fail('deps', `설치 안내 명령을 읽지 못함: ${JSON.stringify(cmd)}`, addOut);
    // 리포터 옵션만 덧붙임(설치 대상 · 범위는 cli 안내 그대로)
    r = await run('sh', ['-c', `${cmd} ${NDJSON}`], { cwd: dir });
    res.ms.deps = r.ms;
    res.downloaded = pnpmDownloaded(r.stdout + r.stderr);
    if (r.rc !== 0) return fail('deps', `${cmd} rc ${r.rc}`, r.stdout + r.stderr);
  }

  writeFileSync(join(dir, 'src', 'app', 'page.tsx'), pageSource(name));
  r = await run('pnpm', ['build'], { cwd: dir, env: { NEXT_TELEMETRY_DISABLED: '1' } });
  res.ms.build = r.ms;
  // eslint-disable-next-line no-control-regex
  const buildOut = (r.stdout + r.stderr).replace(/\x1b\[[0-9;]*m/g, '');
  if (r.rc !== 0) {
    const reasons = [];
    for (const re of [
      /Module not found[^\n]*/g,
      /Type error:[^\n]*/g,
      /\d+:\d+\s+Error:[^\n]*/g,
      /Error occurred prerendering[^\n]*/g,
      /\w+\.useState is not a function|Event handlers cannot be passed[^\n]*/g,
    ]) for (const m of buildOut.matchAll(re)) reasons.push(m[0].replace(/\s+/g, ' ').trim());
    return fail('build', `next build rc ${r.rc}: ${[...new Set(reasons)].slice(0, 4).join(' / ') || buildOut.trim().split('\n').slice(-3).join(' | ')}`, buildOut);
  }

  const htmlFile = join(dir, '.next', 'server', 'app', 'index.html');
  if (!existsSync(htmlFile)) return fail('render', '프리렌더 HTML(.next/server/app/index.html)이 없음', buildOut);
  const problem = checkHtml(name, readFileSync(htmlFile, 'utf8'));
  if (problem) return fail('render', problem, buildOut);

  res.ok = true;
  if (!keep) rmSync(dir, { recursive: true, force: true });
  return res;
}

const results = [];
const queue = [...items];
const t0 = Date.now();
await Promise.all(Array.from({ length: Math.min(jobs, items.length) }, async () => {
  while (queue.length) {
    const name = queue.shift();
    const res = await runItem(name);
    results.push(res);
    const ms = Object.entries(res.ms).map(([k, v]) => `${k} ${secs(v)}`).join(', ');
    log(`${res.ok ? 'PASS' : 'FAIL'} ${name}${res.ok ? '' : ` [${res.stage}] ${res.detail}`} (${ms}; cli fetch ${res.fetches}, pnpm 다운로드 install ${res.downloadedInstall ?? '미측정'} · deps ${res.downloaded ?? '-'})`);
  }
}));
const totalMs = Date.now() - t0;

// ---------------------------------------------------------------- 결과
results.sort((a, b) => items.indexOf(a.name) - items.indexOf(b.name));
const passed = results.filter((x) => x.ok).length;
const byStage = {};
for (const x of results.filter((y) => !y.ok)) byStage[x.stage] = (byStage[x.stage] ?? 0) + 1;
const summary = {
  registry: registryRef ? `git:${registryRef}` : registryDir,
  registryVersion: index.version ?? null,
  cnaVersion,
  items: items.length,
  passed,
  failedByStage: byStage,
  cost: { ...cost, itemsTotalMs: totalMs, jobs },
  results,
};
if (reportFile) writeFileSync(resolve(reportFile), JSON.stringify(summary, null, 2));
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map((x) => `| ${x.name} | ${x.ok ? 'PASS' : `FAIL (${x.stage})`} | ${Object.values(x.ms).reduce((a, b) => a + b, 0) / 1000 | 0}s | ${x.ok ? '' : x.detail.replace(/\|/g, '/')} |`);
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, [
    '### G2 레지스트리 설치 후 빌드 (WI-0045)', '', `${passed}/${items.length} 통과, 항목 ${secs(totalMs)} (기준 픽스처 create-next-app ${secs(cost.cna)} · install ${secs(cost.baseInstall)} · 기준 빌드 ${secs(cost.baseBuild)})`, '',
    '| 항목 | 결과 | 시간 | 원인 |', '|---|---|---|---|', ...rows, '',
  ].join('\n'), { flag: 'a' });
}
console.log(`\n[g2] ${passed}/${items.length} 통과 (항목 ${secs(totalMs)}, jobs ${jobs}${Object.keys(byStage).length ? `, 실패 단계 ${JSON.stringify(byStage)}` : ''})`);
if (keep) console.log(`[g2] 작업 디렉터리 유지: ${work}`);
cleanup();
const measureErrors = results.filter((x) => x.measureError).length;
if (measureErrors) console.error(`[g2] 측정 실패 ${measureErrors}건(네트워크 훅 미로드)`);
process.exit(measureErrors ? 2 : passed === items.length ? 0 : 1);
