/**
 * @axis-ds/mcp 실행 스모크 (WI-0036)
 *
 * 배경: 1.1.0~1.1.4 배포본에서 번들 `dist/index.js` 는 `dist/data/` 에서 레지스트리 JSON 을 찾는데
 * tarball 에는 `dist/registry/data/` 만 있어 레지스트리 도구가 전부 ENOENT(isError)였다.
 * pack-smoke 는 tarball 구조만 보고 서버를 실행하지 않아 이 결함을 잡지 못했다.
 *
 * 이 스크립트는 tarball 을 빈 임시 디렉터리에 `npm install` 로 설치하고(소비자와 같은 경로),
 * 설치된 패키지의 `bin` 으로 서버를 stdio 로 띄워 JSON-RPC 로 다음을 확인한다.
 *
 *   1. initialize 응답과 tools/list 의 도구 수(EXPECTED_TOOLS 와 1:1)
 *   2. 번들 레지스트리 데이터를 읽는 도구 6개를 실제 호출해 isError 가 없고 기대 문자열이 있는지
 *
 * 템플릿 도구(list/get/apply/diff_template)는 원격 `axis.minu.best` 를 읽고 번들 데이터를 읽지 않아
 * 이 스모크의 대상이 아니다(사이트 가용성이 배포를 막지 않게 하려는 것).
 *
 * 사용:
 *   node scripts/mcp-smoke.mjs                 packages/axis-mcp 를 pnpm pack 해서 검사(빌드 선행 필요)
 *   node scripts/mcp-smoke.mjs <tarball.tgz>   주어진 tarball 을 검사(배포본 음성 대조용)
 * 실패 시 exit 1. pack-smoke.mjs 는 runMcpSmoke() 를 직접 호출한다.
 */
import { execFileSync, spawn } from 'child_process';
import { mkdtempSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const REQUEST_TIMEOUT_MS = 30_000;

// tools/list 가 내야 하는 도구(src/index.ts 의 server.tool 등록과 1:1)
const EXPECTED_TOOLS = [
  'axis.search_components',
  'axis.get_component',
  'axis.list_components',
  'axis.list_tokens',
  'axis.get_token',
  'axis.install_component',
  'axis.prompt.detect',
  'axis.prompt.analyze',
  'axis.prompt.refine',
  'axis.prompt.validate',
  'axis.prompt.save',
  'axis.list_templates',
  'axis.get_template',
  'axis.apply_template',
  'axis.diff_template',
  'axis.check_project',
];

// 번들 레지스트리 데이터(components.json · tokens.json)를 읽는 도구 호출과 기대 문자열
function registryCalls(installDir) {
  return [
    { name: 'axis.list_components', args: {}, expect: 'button' },
    { name: 'axis.list_tokens', args: {}, expect: 'colors.primary' },
    { name: 'axis.search_components', args: { query: 'button' }, expect: 'button' },
    { name: 'axis.get_component', args: { name: 'button' }, expect: 'button' },
    { name: 'axis.get_token', args: { path: 'colors.primary' }, expect: 'colors.primary' },
    {
      name: 'axis.install_component',
      args: { name: 'button', targetDir: join(installDir, 'install-target') },
      expect: 'button',
    },
  ];
}

/** stdio JSON-RPC 클라이언트(줄 단위 JSON) */
function startServer(binPath, cwd) {
  const child = spawn(process.execPath, [binPath], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
  let buf = '';
  let stderr = '';
  const pending = new Map();
  let nextId = 1;

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve: done, timer } = pending.get(msg.id);
        clearTimeout(timer);
        pending.delete(msg.id);
        done(msg);
      }
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (c) => {
    stderr += c;
  });
  const exited = new Promise((res) => child.on('exit', (code) => res(code)));

  const request = (method, params) =>
    new Promise((done, reject) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`${method} 응답 시간 초과(${REQUEST_TIMEOUT_MS}ms). stderr: ${stderr.trim()}`));
      }, REQUEST_TIMEOUT_MS);
      pending.set(id, { resolve: done, timer });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  const notify = (method, params) =>
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  const stop = async () => {
    child.stdin.end();
    child.kill('SIGTERM');
    await exited;
  };
  return { request, notify, stop, stderr: () => stderr };
}

/**
 * tarball 하나를 설치 · 실행해 검사한다.
 * @param {string} tgzPath
 * @param {(msg: string) => void} fail 실패 1건마다 호출
 * @returns {Promise<{ tools: number, calls: number }>} 실제로 수행한 검사 건수
 */
export async function runMcpSmoke(tgzPath, fail) {
  const work = mkdtempSync(join(tmpdir(), 'axis-mcp-smoke-'));
  const counts = { tools: 0, calls: 0 };
  try {
    // 빈 소비자 프로젝트에 tarball 설치(소비자와 같은 npm 해석)
    const project = join(work, 'consumer');
    mkdirSync(project);
    writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'axis-mcp-smoke', private: true }));
    execFileSync('npm', ['install', resolve(tgzPath), '--no-audit', '--no-fund', '--loglevel=error'], {
      cwd: project,
      stdio: 'pipe',
    });

    const pkgRoot = join(project, 'node_modules', '@axis-ds', 'mcp');
    const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
    const binRel = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.['axis-mcp'];
    if (!binRel) {
      fail(`package.json bin.axis-mcp 없음 (${pkg.version})`);
      return counts;
    }

    const server = startServer(join(pkgRoot, binRel), project);
    try {
      const init = await server.request('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'axis-mcp-smoke', version: '0.0.0' },
      });
      if (init.error || !init.result) {
        fail(`initialize 실패: ${JSON.stringify(init.error)}`);
        return counts;
      }
      server.notify('notifications/initialized', {});

      const list = await server.request('tools/list', {});
      const names = (list.result?.tools ?? []).map((t) => t.name);
      counts.tools = names.length;
      const missing = EXPECTED_TOOLS.filter((n) => !names.includes(n));
      const extra = names.filter((n) => !EXPECTED_TOOLS.includes(n));
      if (missing.length) fail(`tools/list 누락: ${missing.join(', ')}`);
      if (extra.length) fail(`tools/list 에 목록 밖 도구: ${extra.join(', ')} (EXPECTED_TOOLS 갱신 필요)`);

      for (const call of registryCalls(work)) {
        const res = await server.request('tools/call', { name: call.name, arguments: call.args });
        counts.calls++;
        const text = (res.result?.content ?? []).map((c) => c.text ?? '').join('\n');
        if (res.error) {
          fail(`${call.name}: JSON-RPC 오류 ${JSON.stringify(res.error)}`);
        } else if (res.result?.isError) {
          fail(`${call.name}: isError - ${text.split('\n')[0]}`);
        } else if (!text.includes(call.expect)) {
          fail(`${call.name}: 응답에 '${call.expect}' 없음`);
        }
      }
    } finally {
      await server.stop();
    }
    return counts;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

// CLI 진입
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let failures = 0;
  const fail = (msg) => {
    console.error(`  ✗ [@axis-ds/mcp] ${msg}`);
    failures++;
  };
  let tgz = process.argv[2];
  let packDir;
  if (!tgz) {
    packDir = mkdtempSync(join(tmpdir(), 'axis-mcp-pack-'));
    execFileSync('pnpm', ['pack', '--pack-destination', packDir], {
      cwd: join(process.cwd(), 'packages', 'axis-mcp'),
      stdio: 'pipe',
    });
    tgz = join(packDir, readdirSync(packDir).find((f) => f.endsWith('.tgz')));
  }
  try {
    const { tools, calls } = await runMcpSmoke(tgz, fail);
    if (failures > 0) {
      console.error(`\n[mcp-smoke] FAIL - ${failures}건 결함 (tools/list ${tools}개, 호출 ${calls}건)`);
      process.exitCode = 1;
    } else {
      console.log(`[mcp-smoke] OK - tools/list ${tools}개, 레지스트리 도구 호출 ${calls}건 isError 없음`);
    }
  } catch (e) {
    console.error(`[mcp-smoke] FAIL - 실행 오류: ${e.message.split('\n')[0]}`);
    process.exitCode = 1;
  } finally {
    if (packDir) rmSync(packDir, { recursive: true, force: true });
  }
}
