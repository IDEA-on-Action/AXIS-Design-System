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
 *   2. 번들 데이터를 읽는 도구를 실제 호출해 isError 가 기대와 같고 결과에서만 나오는 기대 문자열이 있는지
 *      (install_component 는 targetDir 에 파일이 실제로 생겼는지 · 사용자 수정이 남는지 · 밖에 파일이 생기지 않는지도)
 *
 * WI-0055: 컴포넌트 도구(list · search · get · install)는 레지스트리를 읽습니다. 서버를 AXIS_REGISTRY_URL=http://127.0.0.1:1/r
 * (접속 불가)로 띄워 원격 상태와 무관하게 tarball 에 실린 동봉 레지스트리(dist/registry)를 검사합니다. 폴백 안내가 나오는지가
 * 「원격을 시도했고 동봉본으로 설치했다」의 양성 대조입니다.
 *
 * 템플릿 도구(list/get/apply/diff_template)는 원격 사이트(기본 `axis-design-system.pages.dev`, WI-0056)를 읽고 번들 데이터를 읽지 않아
 * 이 스모크의 대상이 아니다(사이트 가용성이 배포를 막지 않게 하려는 것).
 *
 * 사용:
 *   node scripts/mcp-smoke.mjs                 packages/axis-mcp 를 pnpm pack 해서 검사(빌드 선행 필요)
 *   node scripts/mcp-smoke.mjs <tarball.tgz>   주어진 tarball 을 검사(배포본 음성 대조용)
 * 실패 시 exit 1. pack-smoke.mjs 는 runMcpSmoke() 를 직접 호출한다.
 */
import { execFileSync, spawn } from 'child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const REQUEST_TIMEOUT_MS = 30_000;
// npm install(레지스트리 · 네트워크 정지 시 publish job 이 매달리지 않게)
const INSTALL_TIMEOUT_MS = 300_000;

// tools/list 가 내야 하는 도구(src/index.ts 의 server.tool 등록과 1:1)
// 도구를 더하거나 빼면 이 목록도 같이 고친다. 안 고치면 PR CI(frontend.yml ci job 의 Pack smoke)가 실패하고,
// 그대로 main 에 들어가면 publish.yml(Pack smoke)이 6개 패키지 발행 전체를 막는다.
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
  // WI-0028 FR-4: 대상 프로젝트의 @axis-ds/tokens 를 읽으므로 번들 데이터 호출(registryCalls) 대상은 아님
  'axis.list_brands',
  'axis.get_brand',
];

/** 동봉본 폴백 안내(packages/axis-mcp/src/tools/registry-source.ts MCP_BUNDLED_LABEL, 코어 bundledFallbackMessage) */
const FALLBACK_NOTICE = '원격 레지스트리에 접근하지 못해 MCP 에 포함된 레지스트리';
/** 원격 차단 주소(접속 불가). 원격 가용성과 무관하게 동봉본을 검사합니다 */
const BLOCKED_REGISTRY_URL = 'http://127.0.0.1:1/r';
/** separator · dialog · agentic-run-progress 설치 결과(의존 utils · a11y-labels 포함, config 없음 기본 배치) */
const DEFAULT_LAYOUT_FILES = [
  'components/ui/utils.ts',
  'components/ui/separator.tsx',
  'components/ui/dialog.tsx',
  'components/ui/agentic-a11y-labels.ts',
  'components/agentic/run-progress.tsx',
];
const USER_EDIT = '// mcp-smoke 사용자 수정';

// 번들 데이터(동봉 레지스트리 · tokens.json · components.json)를 읽는 도구 호출과 기대
// expect 는 질의 인자를 되풀이하는 머리글이 아니라 레지스트리에서 읽은 결과에서만 나오는 문자열로 고른다.
// before 는 호출 전 준비, check 는 응답 밖의 부수효과(파일)를 확인한다. isError 는 기대값(기본 false).
function registryCalls(work) {
  const project = join(work, 'install-target');
  const escape = join(work, 'escape-target');
  const sep = join(project, 'components', 'ui', 'separator.tsx');
  return [
    // lib 2개(utils · agentic-a11y-labels)를 뺀 28개(1.2.3 은 10개)
    { name: 'axis.list_components', args: {}, expect: ['| **합계** | **28** |', '`agentic-run-progress`', FALLBACK_NOTICE] },
    { name: 'axis.list_tokens', args: {}, expect: ['colors.primary'] },
    // 머리글 '## 검색 결과: "progress"' 는 결과 0건이어도 나오므로 결과 행을 본다(1.2.3 은 0건)
    { name: 'axis.search_components', args: { query: 'progress' }, expect: ['(`agentic-run-progress`)'] },
    // 레지스트리 설명 + components.json props
    { name: 'axis.get_component', args: { name: 'separator' }, expect: ['AXIS 구분선 컴포넌트', '`orientation`'] },
    { name: 'axis.get_token', args: { path: 'colors.primary' }, expect: ['colors.primary'] },
    {
      name: 'axis.install_component',
      before: () => {
        mkdirSync(project, { recursive: true });
        writeFileSync(join(project, 'package.json'), JSON.stringify({ name: 'smoke-target', private: true }));
      },
      args: { names: ['separator', 'dialog', 'agentic-run-progress'], targetDir: project },
      expect: ['기본 배치(components/ui · components/agentic)', FALLBACK_NOTICE, '@radix-ui/react-dialog'],
      check: () => {
        const missing = DEFAULT_LAYOUT_FILES.filter((f) => !existsSync(join(project, f)));
        if (missing.length) return `설치 파일 없음: ${missing.join(', ')}`;
        const run = readFileSync(join(project, 'components/agentic/run-progress.tsx'), 'utf8');
        return run.includes('from "../ui/utils"') ? null : 'run-progress 의 utils import 가 설치 위치 기준 상대 경로가 아님';
      },
    },
    {
      // D3: 내용이 다른 기존 파일은 건너뛰고(isError 아님) 첫머리에 건너뛴 수
      name: 'axis.install_component',
      before: () => writeFileSync(sep, `${USER_EDIT}\n${readFileSync(sep, 'utf8')}`),
      args: { name: 'separator', targetDir: project },
      expect: ['내용이 다른 기존 파일 1개를 건너뛰었습니다'],
      check: () => (readFileSync(sep, 'utf8').startsWith(USER_EDIT) ? null : '사용자 수정이 사라짐'),
    },
    {
      name: 'axis.install_component',
      args: { name: 'separator', targetDir: project, overwrite: true },
      expect: ['## 덮어쓴 파일'],
      check: () => (readFileSync(sep, 'utf8').includes(USER_EDIT) ? 'overwrite: true 인데 덮어쓰지 않음' : null),
    },
    {
      // 경로 이탈: componentsDir 이 프로젝트 밖이면 아무것도 쓰지 않고 isError
      name: 'axis.install_component',
      before: () => {
        mkdirSync(escape, { recursive: true });
        writeFileSync(join(escape, 'axis.config.json'), JSON.stringify({ componentsDir: '../escaped' }));
      },
      args: { name: 'separator', targetDir: escape },
      isError: true,
      expect: ['# 컴포넌트 설치 실패'],
      check: () => (existsSync(join(work, 'escaped')) ? `프로젝트 밖에 파일이 생김: ${join(work, 'escaped')}` : null),
    },
  ];
}

/** stdio JSON-RPC 클라이언트(줄 단위 JSON) */
function startServer(binPath, cwd, env = process.env) {
  const child = spawn(process.execPath, [binPath], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
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
      timeout: INSTALL_TIMEOUT_MS,
    });

    const pkgRoot = join(project, 'node_modules', '@axis-ds', 'mcp');
    const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8'));
    const binRel = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.['axis-mcp'];
    if (!binRel) {
      fail(`package.json bin.axis-mcp 없음 (${pkg.version})`);
      return counts;
    }

    const server = startServer(join(pkgRoot, binRel), project, { ...process.env, AXIS_REGISTRY_URL: BLOCKED_REGISTRY_URL });
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
        if (call.before) {
          // 앞 호출이 실패해 준비할 파일이 없으면(음성 대조 등) 이 호출을 결함으로 세고 다음으로 넘어갑니다
          try {
            call.before();
          } catch (e) {
            fail(`${call.name} ${JSON.stringify(call.args)}: 호출 준비 실패(앞 호출 결과 없음) - ${e.message.split('\n')[0]}`);
            continue;
          }
        }
        const res = await server.request('tools/call', { name: call.name, arguments: call.args });
        counts.calls++;
        const text = (res.result?.content ?? []).map((c) => c.text ?? '').join('\n');
        const missingExpect = call.expect.filter((e) => !text.includes(e));
        const label = `${call.name} ${JSON.stringify(call.args)}`;
        if (res.error) {
          fail(`${label}: JSON-RPC 오류 ${JSON.stringify(res.error)}`);
        } else if (Boolean(res.result?.isError) !== Boolean(call.isError)) {
          fail(`${label}: isError ${Boolean(res.result?.isError)}(기대 ${Boolean(call.isError)}) - ${text.split('\n').slice(0, 6).join(' / ')}`);
        } else if (missingExpect.length) {
          fail(`${label}: 응답에 ${missingExpect.map((e) => `'${e}'`).join(', ')} 없음`);
        } else if (call.check) {
          const problem = call.check();
          if (problem) fail(`${label}: ${problem}`);
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
      console.log(`[mcp-smoke] OK - tools/list ${tools}개, 번들 데이터 도구 호출 ${calls}건 기대 일치`);
    }
  } catch (e) {
    console.error(`[mcp-smoke] FAIL - 실행 오류: ${e.message.split('\n')[0]}`);
    process.exitCode = 1;
  } finally {
    if (packDir) rmSync(packDir, { recursive: true, force: true });
  }
}
