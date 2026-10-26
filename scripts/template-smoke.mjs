#!/usr/bin/env node
/**
 * 템플릿 실경로 스모크 (WI-0037 D3: 빈 디렉터리의 `axis template init` 을 보장)
 *
 * 템플릿마다 다음을 실제로 실행하고, next build 의 rc 가 아니라 생성 CSS 의 내용으로 판정합니다.
 *   1. 빌드한 cli(dist/index.js)로 `axis template init <slug> --dir <임시 디렉터리>`
 *      템플릿 JSON 은 이 스크립트가 띄운 127.0.0.1 서버가 `apps/web/public/templates`(또는 --templates-dir)에서 줍니다.
 *      cli 는 환경변수 AXIS_TEMPLATE_URL 로 이 서버를 봅니다. 즉 이 스모크는 「pages.dev 에서 받는 경로」가 아니라
 *      「저장소의 템플릿 JSON 내용」을 검증합니다(AXIS_TEMPLATE_URL 주입 전제로 성립).
 *   2. npm install(실제 npm 레지스트리, 네트워크 필요)
 *   3. npx next build
 *   4. 판정(CSS 내용): .next/static/css/*.css 에서 `@tailwind` 지시문이 0건이고 유틸리티 `.bg-background` 가 있어야 PASS.
 *      PostCSS 설정이 없으면 build 는 rc 0 인데 `@tailwind` 가 그대로 남고 유틸리티가 0건이라(WI-0037 측정) rc 로는 판정하지 않습니다.
 *      WI-0067: AXIS 토큰 전환 회귀도 잡도록 `--axis-*` 변수 정의 1건 이상 · 전환 전 자체 --primary(240 5.9% 10%) 0건을 더합니다.
 *      `.bg-background` 는 전환 전후 모두 1건이라 이 두 조건이 없으면 자체 변수 템플릿도 PASS 였습니다(WI-0067 측정).
 *      AXIS 값 자체(예: --primary 221 39% 11%)는 tokens 버전마다 바뀔 수 있어 판정에 넣지 않습니다.
 *      WI-0027: slug 별 추가 판정(EXTRA_CHECKS 표). ontology-console 은 빌드 HTML(.next/server/app/index.html)에
 *      data-brand="ontology" 가 1건 이상이어야 합니다(서버 HTML 부터 브랜드를 켜는지).
 *
 * 사용: node scripts/template-smoke.mjs [slug ...] [--templates-dir <dir>] [--cli <dist/index.js>] [--keep]
 *   slug 를 주지 않으면 템플릿 디렉터리의 index.json 에서 로컬 템플릿(type 이 external 이 아니고 <slug>.json 이 있는 항목)을
 *   모두 고릅니다(WI-0027 D9, 목록을 손으로 복제하지 않음). index.json 을 읽지 못하거나 0건이면 측정 실패(2)
 *   --templates-dir: 다른 템플릿 JSON 디렉터리(음성 대조: 고치기 전 JSON 을 넣어 FAIL 이 나는지 확인)
 * 종료 코드: 0 통과 / 1 결함 / 2 측정 실패(cli 빌드 산출물 없음 · 서버 실패)
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const CLI = resolve(opt('--cli') ?? join(ROOT, 'packages', 'axis-cli', 'dist', 'index.js'));
const TEMPLATES_DIR = resolve(opt('--templates-dir') ?? join(ROOT, 'apps', 'web', 'public', 'templates'));
const KEEP = args.includes('--keep');
const valued = new Set(['--templates-dir', '--cli']);
const slugs = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));

if (!existsSync(CLI)) {
  console.error(`[template-smoke] 측정 실패: cli 빌드 산출물이 없습니다: ${CLI}`);
  process.exit(2);
}
if (!existsSync(TEMPLATES_DIR)) {
  console.error(`[template-smoke] 측정 실패: 템플릿 디렉터리가 없습니다: ${TEMPLATES_DIR}`);
  process.exit(2);
}

/** index.json 의 로컬 템플릿 slug(외부 블록 제외, 상세 JSON 이 있는 것만) */
function localSlugs() {
  try {
    const index = JSON.parse(readFileSync(join(TEMPLATES_DIR, 'index.json'), 'utf8'));
    return (index.templates ?? [])
      .filter((t) => t && typeof t.slug === 'string' && t.type !== 'external' && existsSync(join(TEMPLATES_DIR, `${t.slug}.json`)))
      .map((t) => t.slug);
  } catch (err) {
    console.error(`[template-smoke] 측정 실패: index.json 을 읽지 못했습니다: ${err.message}`);
    process.exit(2);
  }
}
const SLUGS = slugs.length > 0 ? slugs : localSlugs();
if (SLUGS.length === 0) {
  console.error(`[template-smoke] 측정 실패: 고를 로컬 템플릿이 0건입니다(${TEMPLATES_DIR}/index.json)`);
  process.exit(2);
}

/**
 * slug 별 추가 판정(WI-0027). 빌드 결과 디렉터리를 받아 { label, value, pass } 를 돌려줍니다.
 * 표에 없는 slug 는 공통 판정만 합니다
 */
const EXTRA_CHECKS = {
  'ontology-console': (dir) => {
    const html = join(dir, '.next', 'server', 'app', 'index.html');
    const n = existsSync(html) ? (readFileSync(html, 'utf8').match(/data-brand="ontology"/g) ?? []).length : 0;
    return { label: 'data-brand="ontology"(index.html)', value: n, pass: n > 0 };
  },
};

/** 명령을 실행하고 rc 와 출력(stdout+stderr)을 돌려줍니다. 셸을 거치지 않습니다. */
function run(cmd, cmdArgs, cwd, env = {}) {
  return new Promise((ok) => {
    const child = spawn(cmd, cmdArgs, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.on('close', (code) => ok({ rc: code ?? 1, out }));
    child.on('error', (err) => ok({ rc: 1, out: String(err) }));
  });
}

const server = createServer((req, res) => {
  const name = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '');
  const file = join(TEMPLATES_DIR, name);
  if (!/^[a-z0-9-]+\.json$/.test(name) || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(readFileSync(file));
});
await new Promise((ok, fail) => server.listen(0, '127.0.0.1', ok).on('error', fail));
const port = server.address().port;
const env = { AXIS_TEMPLATE_URL: `http://127.0.0.1:${port}`, NEXT_TELEMETRY_DISABLED: '1', CI: '1' };

/** 전환 전 템플릿 4종이 :root 에 직접 정의하던 --primary 값(minify 뒤 공백 유무 모두) */
const LEGACY_PRIMARY = /--primary:\s*240 5\.9% 10%/g;

const work = mkdtempSync(join(tmpdir(), 'axis-template-smoke-'));
const rows = [];
let measureFailed = false;
for (const slug of SLUGS) {
  const dir = join(work, slug);
  const row = { slug, init: '-', install: '-', build: '-', tailwindLeft: '-', bgBackground: '-', axisVars: '-', legacyPrimary: '-', extra: '-', verdict: 'FAIL' };
  rows.push(row);
  const init = await run(process.execPath, [CLI, 'template', 'init', slug, '--dir', dir], ROOT, env);
  row.init = init.rc;
  if (init.rc !== 0 || !existsSync(join(dir, 'package.json'))) {
    console.error(`[template-smoke] ${slug}: template init 실패(rc ${init.rc})\n${init.out.slice(-2000)}`);
    measureFailed = measureFailed || init.out.includes('ECONNREFUSED');
    continue;
  }
  const install = await run('npm', ['install', '--no-audit', '--no-fund'], dir, env);
  row.install = install.rc;
  if (install.rc !== 0) {
    console.error(`[template-smoke] ${slug}: npm install 실패(rc ${install.rc})\n${install.out.slice(-2000)}`);
    measureFailed = true;
    continue;
  }
  const build = await run('npx', ['next', 'build'], dir, env);
  row.build = build.rc;
  const cssDir = join(dir, '.next', 'static', 'css');
  const cssFiles = existsSync(cssDir) ? readdirSync(cssDir).filter((f) => f.endsWith('.css')) : [];
  const css = cssFiles.map((f) => readFileSync(join(cssDir, f), 'utf8')).join('\n');
  row.tailwindLeft = (css.match(/@tailwind/g) ?? []).length;
  row.bgBackground = (css.match(/\.bg-background\{/g) ?? []).length;
  row.axisVars = (css.match(/--axis-[a-z0-9-]+:/g) ?? []).length;
  row.legacyPrimary = (css.match(LEGACY_PRIMARY) ?? []).length;
  const extra = EXTRA_CHECKS[slug]?.(dir);
  if (extra) row.extra = `${extra.label} ${extra.value}`;
  // 판정: CSS 파일이 있고, @tailwind 지시문이 남지 않았고, 유틸리티가 생성되고, AXIS 토큰 변수가 들어 있고 전환 전 자체 --primary 가 없음.
  // build rc 0 은 필요조건일 뿐입니다
  row.verdict =
    build.rc === 0 &&
    cssFiles.length > 0 &&
    row.tailwindLeft === 0 &&
    row.bgBackground > 0 &&
    row.axisVars > 0 &&
    row.legacyPrimary === 0 &&
    (extra ? extra.pass : true)
      ? 'PASS'
      : 'FAIL';
  if (row.verdict === 'FAIL') console.error(`[template-smoke] ${slug}: build 출력 끝\n${build.out.slice(-1500)}`);
}
server.close();

console.log('\n템플릿 스모크 (CSS 내용 판정: @tailwind 0건 · .bg-background 1건 이상 · --axis-* 정의 1건 이상 · 전환 전 --primary 0건)');
console.log('slug | init rc | install rc | build rc | @tailwind 잔존 | .bg-background | --axis-* 정의 | 전환 전 --primary | 추가 판정 | 판정');
for (const r of rows) {
  console.log(
    `${r.slug} | ${r.init} | ${r.install} | ${r.build} | ${r.tailwindLeft} | ${r.bgBackground} | ${r.axisVars} | ${r.legacyPrimary} | ${r.extra} | ${r.verdict}`
  );
}
if (!KEEP) rmSync(work, { recursive: true, force: true });
else console.log(`작업 디렉터리 유지: ${work}`);

if (measureFailed) {
  console.error('[template-smoke] 측정 실패: 서버 접속 또는 npm install 이 실패해 판정하지 못한 템플릿이 있습니다');
  process.exit(2);
}
process.exit(rows.every((r) => r.verdict === 'PASS') ? 0 : 1);
