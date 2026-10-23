/**
 * typesVersions 생성 · 검사 스크립트 (WI-0053)
 *
 * 배경: TypeScript `moduleResolution: "node"`(node10)는 package.json `exports` 를 읽지 않습니다.
 * Next 15 가 tsconfig 를 만들어 줄 때 이 값을 쓰므로 `@axis-ds/ui-react/avatar` 같은 서브패스가
 * TS2307 로 실패했습니다(1.5.0 배포본 실측: 서브패스 52개 전부). node10 이 읽는 `typesVersions` 를
 * exports 에서 1:1 로 만들어 같은 타입 파일을 가리키게 합니다.
 *
 * 생성 규칙(buildTypesVersions)
 *   - 키: exports 키에서 `./` 를 뗀 값. 루트(`.`)는 넣지 않습니다(node10 은 `types` 필드로 루트를 찾음)
 *   - 값: 그 항목의 `types` 조건 타깃 1개. 문자열 항목은 `.json` 타깃만 넣습니다(CSS 는 tsc 대상이 아님)
 *   - 와일드카드 키는 쓰지 않습니다. `"*": ["./dist/*\/index.d.ts"]` 는 node10 이 `types` 필드까지 다시
 *     매핑해 루트 import 를 깨뜨립니다(WI-0053 PRD 1.3 B 실측)
 *   - 생성할 항목이 없으면 typesVersions 를 두지 않습니다(theme). 있으면 드리프트로 봅니다
 *
 * 사용:
 *   node scripts/sync-types-versions.mjs                 # 대상 패키지 package.json 갱신
 *   node scripts/sync-types-versions.mjs --check         # 드리프트 시 exit 1 (CI 게이트)
 *   node scripts/sync-types-versions.mjs --only <디렉터리>  # 그 패키지만(ui-react build 에서 사용)
 *
 * 종료 코드: 0 일치(또는 갱신) / 1 드리프트(--check) / 2 측정 실패(package.json 없음 · exports 없음)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 검사 대상: linked 4패키지. theme 은 서브패스가 없어 typesVersions 가 없어야 합니다 */
export const TARGET_PACKAGES = [
  'packages/axis-tokens',
  'packages/axis-ui-react',
  'packages/axis-agentic-ui',
  'packages/axis-theme',
];

/**
 * exports 에서 typesVersions 를 만든다. 생성할 항목이 없으면 null
 * @param {Record<string, unknown>} exportsField
 * @returns {{ '*': Record<string, string[]> } | null}
 */
export function buildTypesVersions(exportsField) {
  if (!exportsField || typeof exportsField !== 'object') return null;
  const map = {};
  for (const [key, val] of Object.entries(exportsField)) {
    if (key === '.') continue;
    if (!key.startsWith('./') || key.includes('*')) {
      throw new Error(`지원하지 않는 exports 키: ${key} (./ 로 시작하는 명시 경로만 지원)`);
    }
    const sub = key.slice(2);
    let target = null;
    if (val && typeof val === 'object' && typeof val.types === 'string') target = val.types;
    else if (typeof val === 'string' && val.endsWith('.json')) target = val;
    if (target) map[sub] = [target];
  }
  return Object.keys(map).length ? { '*': map } : null;
}

/** package.json 객체에 typesVersions 를 넣거나 뺀 새 객체(키 순서: exports 바로 뒤) */
export function applyTypesVersions(pkg, typesVersions) {
  const out = {};
  for (const [k, v] of Object.entries(pkg)) {
    if (k === 'typesVersions') continue;
    out[k] = v;
    if (k === 'exports' && typesVersions) out.typesVersions = typesVersions;
  }
  if (typesVersions && !('typesVersions' in out)) out.typesVersions = typesVersions;
  return out;
}

/** 한 패키지 디렉터리를 검사(또는 갱신)한다 */
export function syncPackage(pkgDir, { check = false } = {}) {
  const pkgPath = join(pkgDir, 'package.json');
  if (!existsSync(pkgPath)) return { status: 'error', message: `package.json 없음: ${pkgPath}` };
  const raw = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);
  if (!pkg.exports) return { status: 'error', message: `${pkg.name}: exports 없음` };
  const want = buildTypesVersions(pkg.exports);
  const keys = want ? Object.keys(want['*']).length : 0;
  const same = JSON.stringify(pkg.typesVersions ?? null) === JSON.stringify(want);
  if (same) return { status: 'ok', name: pkg.name, keys };
  if (check) return { status: 'drift', name: pkg.name, keys, message: describeDrift(pkg.typesVersions, want) };
  const next = applyTypesVersions(pkg, want);
  writeFileSync(pkgPath, JSON.stringify(next, null, 2) + '\n');
  return { status: 'updated', name: pkg.name, keys };
}

/** 드리프트 요약: 빠진 키 · 남는 키 · 값이 다른 키 */
export function describeDrift(current, want) {
  const cur = (current && current['*']) || {};
  const exp = (want && want['*']) || {};
  const missing = Object.keys(exp).filter((k) => !(k in cur));
  const extra = Object.keys(cur).filter((k) => !(k in exp));
  const changed = Object.keys(exp).filter((k) => k in cur && JSON.stringify(cur[k]) !== JSON.stringify(exp[k]));
  const parts = [];
  if (missing.length) parts.push(`빠짐 ${missing.join(', ')}`);
  if (extra.length) parts.push(`남음 ${extra.join(', ')}`);
  if (changed.length) parts.push(`값 다름 ${changed.join(', ')}`);
  if (!parts.length) parts.push('typesVersions 형태가 생성 규칙과 다름(범위 키 · 순서 등)');
  return parts.join(' / ');
}

function main(argv) {
  const check = argv.includes('--check');
  const onlyIdx = argv.indexOf('--only');
  const dirs = onlyIdx >= 0
    ? [resolve(process.cwd(), argv[onlyIdx + 1] ?? '')]
    : TARGET_PACKAGES.map((p) => join(ROOT, p));
  let drift = 0;
  let errors = 0;
  let checked = 0;
  for (const dir of dirs) {
    const r = syncPackage(dir, { check });
    if (r.status === 'error') { console.error(`[sync-types-versions] 측정 실패 - ${r.message}`); errors++; continue; }
    checked++;
    if (r.status === 'drift') { console.error(`[sync-types-versions] DRIFT ${r.name}: ${r.message}`); drift++; }
    else console.log(`[sync-types-versions] ${r.status === 'ok' ? 'OK' : '갱신'} ${r.name} - 키 ${r.keys}개`);
  }
  if (errors || checked === 0) return 2;
  if (drift) {
    console.error('  → `node scripts/sync-types-versions.mjs` 실행 후 커밋하세요');
    return 1;
  }
  console.log(`[sync-types-versions] ${check ? '검사' : '처리'} ${checked}개 패키지`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
