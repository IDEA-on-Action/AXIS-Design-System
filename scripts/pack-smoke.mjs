/**
 * 외부 소비(npm 설치) 스모크 게이트
 *
 * 배경: 로컬 `pnpm build` 통과가 npm 설치 통과를 보장하지 않는다.
 * 1.1.2에서 발생한 3건(workspace 프로토콜 누출, exports 미존재 파일, 토큰 CSS 점 변수)은
 * 전부 "빌드는 되는데 외부 설치/소비 시 깨지는" 동일 계열이었다.
 *
 * 이 스크립트는 각 퍼블리시 대상 패키지를 `pnpm pack`으로 tarball을 만든 뒤,
 * tarball 내부를 실제 npm 설치 관점으로 검증한다(설계 매칭이 아니라 산출물 실측).
 *
 *   1. dependencies/peer/optional 에 `workspace:` 프로토콜 잔존 금지   (BUG1)
 *   2. exports 맵의 모든 타깃 파일이 tarball에 실재               (BUG2)
 *   3. 배포되는 .css 에 점 포함 커스텀 프로퍼티(--x-...-N.N) 금지   (BUG3)
 *   4. @axis-ds/mcp 는 tarball 을 빈 디렉터리에 설치해 stdio 로 실행하고
 *      레지스트리 도구를 호출한다(scripts/mcp-smoke.mjs, WI-0036)
 *   5. Tailwind 4 CSS 진입점이 tarball 에 실재하고, 그 안의 @source 상대 경로가
 *      tarball 안의 실제 경로를 가리킨다(WI-0044). 배포 CSS 중 하나라도 파일을 스캔하는 @source 를
 *      담으면 tarball package.json 의 preferUnplugged 가 true 여야 한다(WI-0105: Yarn Plug'n'Play 는
 *      패키지를 zip 으로 두고 Tailwind 4 스캐너는 실제 디렉터리만 읽어서, 풀어 두지 않으면 아무것도 스캔되지 않는다)
 *   6. G1 "use client" 정적 검사(WI-0050): ui-react · agentic-ui · theme 의 지시문 목록 파일에는
 *      ESM · CJS 모두 지시문이 있고, 루트 배럴 · cn · *Variants 파일에는 없으며, 목록 밖 파일에
 *      상태 훅 · createContext/useContext · "use client" 모듈 점 접근이 없다(scripts/use-client-gate.mjs)
 *   7. 발행하지 않는 공유 코어(@axis-ds/registry-core, WI-0055)가 발행본에 새지 않는다: dependencies · peer · optional 에
 *      이름이 없고, 배포 .js 에 그 패키지를 import · require 하는 문이 없다(cli · mcp 는 빌드 때 번들한다)
 *
 * 사용: node scripts/pack-smoke.mjs        (실패 시 exit 1)
 */
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { runMcpSmoke } from './mcp-smoke.mjs';
import { USE_CLIENT_PACKAGES, checkUseClient, describeG1 } from './use-client-gate.mjs';

const ROOT = process.cwd();
const PKG_DIR = join(ROOT, 'packages');

// 퍼블리시 대상: packages/* 중 private 아님
const packages = readdirSync(PKG_DIR)
  .map((d) => join(PKG_DIR, d))
  .filter((p) => existsSync(join(p, 'package.json')))
  .filter((p) => {
    const j = JSON.parse(readFileSync(join(p, 'package.json'), 'utf8'));
    return j.private !== true;
  });

// 5. 패키지별 필수 배포 파일(WI-0044). exports 검사는 exports 에서 빠지면 함께 빠지므로 따로 센다.
const REQUIRED_FILES = {
  '@axis-ds/tokens': ['dist/css/tailwind4.css'],
  '@axis-ds/ui-react': ['tailwind.css'],
  '@axis-ds/agentic-ui': ['tailwind.css'],
  // WI-0045 FR-3: add · list 의 동봉 레지스트리(원격 실패 시 폴백). 빠지면 오프라인 설치가 조용히 불가능해진다
  '@axis-ds/cli': ['dist/registry/index.json'],
  // WI-0055 FR-5: mcp 컴포넌트 도구의 동봉 레지스트리
  '@axis-ds/mcp': ['dist/registry/index.json'],
};

// 7. 발행하지 않는 공유 코어(WI-0055 D1). 이름이 발행본의 의존이나 런타임 import 로 남으면 소비자 설치 · 실행이 깨진다
const PRIVATE_CORE = '@axis-ds/registry-core';
const PRIVATE_CORE_IMPORT = new RegExp(
  String.raw`(?:\bfrom\s*|\bimport\s*\(\s*|\brequire\s*\(\s*|\bimport\s+)["']` + PRIVATE_CORE.replace('/', '\\/') + String.raw`(?:["'/])`
);

/** 디렉토리 재귀 .js · .mjs · .cjs 수집 */
function collectJs(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') collectJs(full, acc);
    } else if (/\.(?:m|c)?js$/.test(e.name)) acc.push(full);
  }
  return acc;
}
const requiredSeen = new Set();
const g1Seen = new Set();

let failures = 0;
let mcpSmokeRan = false;
const fail = (pkg, msg) => {
  console.error(`  ✗ [${pkg}] ${msg}`);
  failures++;
};

// 디렉토리 재귀 .css 수집
function collectCss(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) collectCss(full, acc);
    else if (e.name.endsWith('.css')) acc.push(full);
  }
  return acc;
}

for (const pkgPath of packages) {
  const pkgJson = JSON.parse(readFileSync(join(pkgPath, 'package.json'), 'utf8'));
  const name = pkgJson.name;
  const tmp = mkdtempSync(join(tmpdir(), 'axis-pack-'));
  try {
    execFileSync('pnpm', ['pack', '--pack-destination', tmp], { cwd: pkgPath, stdio: 'pipe' });
    const tgz = readdirSync(tmp).find((f) => f.endsWith('.tgz'));
    if (!tgz) {
      fail(name, 'tarball 생성 실패');
      continue;
    }
    execFileSync('tar', ['-xzf', join(tmp, tgz), '-C', tmp], { stdio: 'pipe' });
    const root = join(tmp, 'package');
    const published = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

    // 1. workspace 프로토콜 잔존 검사
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const [dep, ver] of Object.entries(published[field] || {})) {
        if (String(ver).startsWith('workspace:')) {
          fail(name, `${field}.${dep} = "${ver}" (workspace 프로토콜 누출)`);
        }
      }
    }

    // 7. 공유 코어 누출 검사
    for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
      if (published[field] && PRIVATE_CORE in published[field]) {
        fail(name, `${field}.${PRIVATE_CORE} (발행하지 않는 공유 코어가 의존으로 남음)`);
      }
    }
    for (const js of collectJs(root)) {
      if (PRIVATE_CORE_IMPORT.test(readFileSync(js, 'utf8'))) {
        fail(name, `${js.replace(root + '/', '')} 가 ${PRIVATE_CORE} 를 import 함(번들되지 않음)`);
      }
    }

    // 2. exports 타깃 실재 검사
    const walkExports = (val) => {
      if (typeof val === 'string') {
        if (val.startsWith('./') && !existsSync(join(root, val))) {
          fail(name, `exports 타깃 미존재: ${val}`);
        }
      } else if (val && typeof val === 'object') {
        Object.values(val).forEach(walkExports);
      }
    };
    walkExports(published.exports || {});

    // 3. 점 포함 CSS 커스텀 프로퍼티 검사
    for (const css of collectCss(root)) {
      const m = readFileSync(css, 'utf8').match(/--[a-z0-9-]+-\d+\.\d+\s*:/i);
      if (m) {
        fail(name, `점 포함 CSS 변수 "${m[0].trim()}" (${css.replace(root + '/', '')})`);
      }
    }

    // 5. Tailwind 4 진입점 실재 + @source 경로 실재
    if (REQUIRED_FILES[name]) requiredSeen.add(name);
    for (const rel of REQUIRED_FILES[name] || []) {
      const file = join(root, rel);
      if (!existsSync(file)) {
        fail(name, `필수 배포 파일 미존재: ${rel}`);
        continue;
      }
      const sources = [...readFileSync(file, 'utf8').matchAll(/^\s*@source\s+"([^"]+)"/gm)];
      // 컴포넌트 패키지의 tailwind.css 는 @source 가 존재 이유다. 빠지면 조용히 아무것도 스캔하지 않는다
      if (rel === 'tailwind.css' && sources.length === 0) {
        fail(name, `${rel} 에 @source 가 없음`);
      }
      for (const m of sources) {
        if (!existsSync(join(dirname(file), m[1]))) {
          fail(name, `${rel} 의 @source "${m[1]}" 가 tarball 안에 없음`);
        }
      }
    }
    // 5-1. 파일을 스캔하는 @source 를 담은 배포 CSS 가 있으면 preferUnplugged 필수(WI-0105).
    // 패키지 이름 목록이 아니라 tarball 안 CSS 의 관측값으로 분기한다. `@source not` · `@source inline(...)` 은
    // 디렉터리를 읽지 않으므로 세지 않는다
    const scanningCss = collectCss(root).filter((css) =>
      /^\s*@source\s+(?!not\b|inline\s*\()["']/m.test(readFileSync(css, 'utf8'))
    );
    if (scanningCss.length > 0) {
      const files = scanningCss.map((css) => css.replace(root + '/', '')).join(', ');
      if (published.preferUnplugged !== true) {
        fail(
          name,
          `${files} 에 @source 가 있지만 package.json 의 preferUnplugged 가 true 가 아님` +
            ` (값: ${JSON.stringify(published.preferUnplugged)}). Yarn Plug'n'Play 는 패키지를 .yarn/cache 의 zip 안에 두고` +
            ` Tailwind 4 스캐너는 zip 안을 읽지 못해 컴포넌트 클래스가 생성되지 않음(WI-0105)`
        );
      } else {
        console.log(`  · [${name}] @source CSS ${scanningCss.length}개(${files}) · preferUnplugged true`);
      }
    }

    // 6. G1 "use client" 정적 검사(목록은 각 패키지 scripts/client-modules.mjs 단일 출처)
    if (USE_CLIENT_PACKAGES[name]) {
      g1Seen.add(name);
      const r = await checkUseClient(name, root, (msg) => fail(name, msg));
      if (r) console.log(`  · [${name}] ${describeG1(r)}`);
    }

    // 4. MCP 서버 실행 스모크(구조 검사로는 런타임 데이터 경로 결함을 못 잡는다)
    if (name === '@axis-ds/mcp') {
      mcpSmokeRan = true;
      const { tools, calls } = await runMcpSmoke(join(tmp, tgz), (msg) => fail(name, msg));
      console.log(`  · [${name}] stdio 실행: tools/list ${tools}개, 레지스트리 도구 호출 ${calls}건`);
    }

    if (failures === 0 || !published) {
      // 패키지별 통과 메시지는 누적 실패와 무관하게 표기
    }
    console.log(`  ✓ [${name}] pack 검증 완료`);
  } catch (e) {
    fail(name, `pack 중 오류: ${e.message.split('\n')[0]}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// 실행 스모크가 대상을 못 찾아 건너뛴 것을 통과로 읽지 않는다
if (!mcpSmokeRan) fail('@axis-ds/mcp', '실행 스모크 미수행(퍼블리시 대상에서 패키지를 찾지 못함)');
for (const pkg of Object.keys(USE_CLIENT_PACKAGES)) {
  if (!g1Seen.has(pkg)) fail(pkg, 'G1 "use client" 검사 미수행(퍼블리시 대상에서 패키지를 찾지 못함)');
}
for (const pkg of Object.keys(REQUIRED_FILES)) {
  if (!requiredSeen.has(pkg)) fail(pkg, '필수 배포 파일 검사 미수행(퍼블리시 대상에서 패키지를 찾지 못함)');
}

if (failures > 0) {
  console.error(`\n[pack-smoke] FAIL - ${failures}건 결함`);
  process.exit(1);
}
console.log(`\n[pack-smoke] OK - 퍼블리시 대상 ${packages.length}개 패키지 전부 통과`);
