/**
 * exports 맵 동기화/검증 스크립트
 *
 * 빌드 산출물(dist/<name>/index.*)에서 package.json의 exports 맵을 생성한다.
 * tsup이 `src/<name>/index.tsx`를 중첩 디렉토리(dist/<name>/index.mjs)로 출력하므로
 * 수기 평면 경로(dist/<name>.mjs)와 드리프트가 발생했다(BUG: ./button 미존재 파일 참조).
 *
 * 사용:
 *   node scripts/sync-exports.mjs          # package.json exports를 dist 기준으로 갱신
 *   node scripts/sync-exports.mjs --check   # 드리프트 시 exit 1 (CI/prepublish 게이트)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, '..');
const distDir = join(pkgRoot, 'dist');
const pkgPath = join(pkgRoot, 'package.json');

if (!existsSync(distDir)) {
  console.error('[sync-exports] dist/ 없음 - 먼저 빌드하세요 (pnpm build)');
  process.exit(1);
}

// 루트 배럴(.)은 평면 출력(dist/index.*)
const exportsMap = {
  '.': {
    types: './dist/index.d.ts',
    import: './dist/index.mjs',
    require: './dist/index.js',
  },
};

// 컴포넌트 서브패스: dist/<name>/index.mjs 존재하는 디렉토리만
const subdirs = readdirSync(distDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .filter((name) => existsSync(join(distDir, name, 'index.mjs')))
  .sort();

for (const name of subdirs) {
  exportsMap[`./${name}`] = {
    types: `./dist/${name}/index.d.ts`,
    import: `./dist/${name}/index.mjs`,
    require: `./dist/${name}/index.js`,
  };
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const current = JSON.stringify(pkg.exports ?? {});
const next = JSON.stringify(exportsMap);

const isCheck = process.argv.includes('--check');

if (current === next) {
  console.log(`[sync-exports] OK - exports ${subdirs.length + 1}개 항목 일치`);
  process.exit(0);
}

if (isCheck) {
  console.error('[sync-exports] DRIFT - exports 맵이 dist 산출물과 불일치');
  console.error('  → `node scripts/sync-exports.mjs` 실행 후 커밋하세요');
  process.exit(1);
}

pkg.exports = exportsMap;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`[sync-exports] 갱신 완료 - exports ${subdirs.length + 1}개 항목`);
