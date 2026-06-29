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
 *
 * 사용: node scripts/pack-smoke.mjs        (실패 시 exit 1)
 */
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

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

let failures = 0;
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

if (failures > 0) {
  console.error(`\n[pack-smoke] FAIL - ${failures}건 결함`);
  process.exit(1);
}
console.log(`\n[pack-smoke] OK - 퍼블리시 대상 ${packages.length}개 패키지 전부 통과`);
