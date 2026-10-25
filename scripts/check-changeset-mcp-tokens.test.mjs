/**
 * changeset 동반 검사 테스트 (tokens → mcp: WI-0076 후속 규칙, registry-core → cli · mcp: WI-0080)
 *
 * 실행: node --test scripts/check-changeset-mcp-tokens.test.mjs
 * 임시 git 저장소(origin/main 은 refs/remotes 로 흉내)에 changeset 과 파일 변경을 만들어 통과 · 위반 · 읽기 실패 ·
 * 비교 기준 없음의 종료 코드를 확인합니다. 부모 프로세스(CI)의 GITHUB_* 환경 변수는 지우고 사례마다 직접 넣습니다.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, checkChangesetDir, checkRegistryCore } from './check-changeset-mcp-tokens.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'check-changeset-mcp-tokens.mjs');
const tmpDirs = [];
after(() => { for (const d of tmpDirs) rmSync(d, { recursive: true, force: true }); });

const cs = (bumps) => `---\n${Object.entries(bumps).map(([p, b]) => `"${p}": ${b}`).join('\n')}\n---\n\n본문\n`;
/** GITHUB_* 를 지운 환경(CI 안에서 테스트가 돌아도 사례가 고른 이벤트만 보이게) */
function cleanEnv(extra = {}) {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) if (!k.startsWith('GITHUB_')) env[k] = v;
  return {
    ...env,
    GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com',
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null',
    ...extra,
  };
}
function git(repo, ...args) {
  const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8', env: cleanEnv() });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout.trim();
}
function write(repo, files) {
  for (const [rel, body] of Object.entries(files)) {
    if (body === null) { rmSync(join(repo, rel), { force: true }); continue; }
    mkdirSync(dirname(join(repo, rel)), { recursive: true });
    writeFileSync(join(repo, rel), body);
  }
}
/**
 * base 커밋(main, origin/main 으로 표시) 위에 feature 커밋을 만든 저장소.
 * `head` 의 값이 null 이면 그 파일을 지웁니다. `originMain: false` 면 origin/main 을 만들지 않습니다.
 */
function makeRepo({ base = {}, head = {}, originMain = true, afterBase } = {}) {
  const repo = mkdtempSync(join(tmpdir(), 'axis-cs-'));
  tmpDirs.push(repo);
  git(repo, 'init', '-q', '-b', 'main');
  write(repo, { '.changeset/README.md': '# Changesets\n', '.changeset/config.json': '{}\n', 'package.json': '{}\n', ...base });
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'base');
  if (originMain) git(repo, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
  git(repo, 'checkout', '-q', '-b', 'feature');
  write(repo, head);
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '--allow-empty', '-m', 'head');
  if (afterBase) {
    // origin/main 이 갈라진 뒤 앞서 나간 경우(main 에 다른 커밋)
    git(repo, 'checkout', '-q', '-b', 'main2', 'main');
    write(repo, afterBase);
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'main moved');
    git(repo, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    git(repo, 'checkout', '-q', 'feature');
  }
  return repo;
}
const run = (repo, env = {}, dir) =>
  spawnSync(process.execPath, [SCRIPT, ...(dir ? [dir] : []), '--repo', repo], { cwd: repo, encoding: 'utf8', env: cleanEnv(env) });
const CORE = 'packages/axis-registry-core/src/template/tailwind-core.ts';
const PR = { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'pull_request', GITHUB_BASE_REF: 'main' };
const PUSH = { GITHUB_ACTIONS: 'true', GITHUB_EVENT_NAME: 'push' };

test('앞머리 판독: 따옴표 종류 · 따옴표 없음 · 주석 줄', () => {
  assert.deepEqual(
    parseFrontmatter(`---\n"@axis-ds/tokens": patch\n'@axis-ds/mcp': minor\n@axis-ds/cli: major\n# 주석\n---\n`),
    { '@axis-ds/tokens': 'patch', '@axis-ds/mcp': 'minor', '@axis-ds/cli': 'major' },
  );
  assert.equal(parseFrontmatter('앞머리 없음'), null);
});

// ─── tokens → mcp (WI-0076 후속) ───

test('위반: tokens 만 올리면 rc 1', () => {
  const r = run(makeRepo({ head: { '.changeset/a.md': cs({ '@axis-ds/tokens': 'patch' }) } }));
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /@axis-ds\/mcp 를 올리는 changeset 이 없어요/);
});

test('위반: linked 패키지와 함께여도 mcp 가 없으면 rc 1', () => {
  const r = run(makeRepo({ head: { '.changeset/a.md': cs({ '@axis-ds/tokens': 'patch', '@axis-ds/ui-react': 'patch', '@axis-ds/cli': 'minor' }) } }));
  assert.equal(r.status, 1, r.stdout + r.stderr);
});

test('통과: 같은 changeset 에 mcp 가 있으면 rc 0', () => {
  const r = run(makeRepo({ head: { '.changeset/a.md': cs({ '@axis-ds/tokens': 'patch', '@axis-ds/mcp': 'patch' }) } }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('통과: 다른 changeset 에 mcp 가 있어도 같은 발행에 묶이므로 rc 0', () => {
  const r = run(makeRepo({ head: { '.changeset/a.md': cs({ '@axis-ds/tokens': 'patch' }), '.changeset/b.md': cs({ '@axis-ds/mcp': 'minor' }) } }));
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('통과: tokens 를 올리지 않으면 검사 대상 없음 rc 0 (changeset 0개 포함)', () => {
  assert.equal(run(makeRepo({ head: { '.changeset/a.md': cs({ '@axis-ds/cli': 'patch' }) } })).status, 0);
  const empty = run(makeRepo());
  assert.equal(empty.status, 0, empty.stdout + empty.stderr);
  assert.match(empty.stdout, /changeset 0개/);
});

test('none 은 올림으로 치지 않음: mcp none 이면 위반', () => {
  const repo = makeRepo({ head: { '.changeset/a.md': cs({ '@axis-ds/tokens': 'patch', '@axis-ds/mcp': 'none' }) } });
  assert.equal(checkChangesetDir(join(repo, '.changeset')).violation, true);
});

test('읽기 실패: 디렉터리 없음 · 앞머리 없는 changeset 은 rc 2', () => {
  const repo = makeRepo();
  assert.equal(run(repo, {}, join(tmpdir(), 'axis-cs-없는-디렉터리-zz')).status, 2);
  assert.equal(run(makeRepo({ head: { '.changeset/a.md': '앞머리 없는 본문\n' } })).status, 2);
});

// ─── registry-core → cli · mcp (WI-0080) ───

test('위반: registry-core 를 바꿨는데 changeset 이 없거나 cli · mcp 중 하나만이면 rc 1', () => {
  for (const [label, bumps, missing] of [
    ['changeset 없음', null, /@axis-ds\/cli · @axis-ds\/mcp 올림이 없어요/],
    ['cli 만', { '@axis-ds/cli': 'patch' }, /changeset 에 @axis-ds\/mcp 올림이 없어요/],
    ['mcp 만', { '@axis-ds/mcp': 'patch' }, /changeset 에 @axis-ds\/cli 올림이 없어요/],
    ['cli none', { '@axis-ds/cli': 'none', '@axis-ds/mcp': 'patch' }, /changeset 에 @axis-ds\/cli 올림이 없어요/],
  ]) {
    const head = { [CORE]: 'export const x = 2;\n', ...(bumps ? { '.changeset/a.md': cs(bumps) } : {}) };
    for (const env of [{}, PR]) {
      const r = run(makeRepo({ base: { [CORE]: 'export const x = 1;\n' }, head }), env);
      assert.equal(r.status, 1, `${label} ${JSON.stringify(env)}: ${r.stdout}${r.stderr}`);
      assert.match(r.stderr, missing, label);
    }
  }
});

test('통과: registry-core 를 바꾸고 cli · mcp 를 모두 올림(같은 파일 · 다른 파일), 로컬 · PR 모두 rc 0', () => {
  for (const files of [
    { '.changeset/a.md': cs({ '@axis-ds/cli': 'patch', '@axis-ds/mcp': 'patch' }) },
    { '.changeset/a.md': cs({ '@axis-ds/cli': 'patch' }), '.changeset/b.md': cs({ '@axis-ds/mcp': 'minor' }) },
  ]) {
    for (const env of [{}, PR]) {
      const r = run(makeRepo({ base: { [CORE]: '1\n' }, head: { [CORE]: '2\n', ...files } }), env);
      assert.equal(r.status, 0, r.stdout + r.stderr);
      assert.match(r.stdout, /통과\(registry-core → cli · mcp\)/);
    }
  }
});

test('통과: registry-core 를 바꾸지 않는 변경(cli 만 바꿈 · changeset 없음)은 rc 0', () => {
  const r = run(makeRepo({ base: { [CORE]: '1\n', 'packages/axis-cli/src/a.ts': '1\n' }, head: { 'packages/axis-cli/src/a.ts': '2\n' } }), PR);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /registry-core\/ 0개/);
});

test('통과: Release PR(changeset 을 소비하고 버전만 올림, registry-core 변경 없음)은 rc 0', () => {
  // base 는 registry-core 수정과 changeset 이 이미 머지된 main, head 는 changesets/action 이 만든 버전 커밋
  const repo = makeRepo({
    base: { [CORE]: '2\n', '.changeset/a.md': cs({ '@axis-ds/cli': 'patch', '@axis-ds/mcp': 'patch' }), 'packages/axis-cli/package.json': '{"version":"1.7.0"}\n' },
    head: { '.changeset/a.md': null, 'packages/axis-cli/package.json': '{"version":"1.7.1"}\n', 'packages/axis-cli/CHANGELOG.md': '# 1.7.1\n' },
  });
  for (const env of [{}, PR]) {
    const r = run(repo, env);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /changeset 0개/);
  }
});

test('PR 기준은 merge-base: origin/main 이 갈라진 뒤 registry-core 를 바꿔도 PR 의 변경으로 치지 않음', () => {
  const repo = makeRepo({ base: { [CORE]: '1\n' }, head: { 'docs/a.md': 'x\n' }, afterBase: { [CORE]: '9\n' } });
  const r = run(repo, PR);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /merge-base\(origin\/main, HEAD\)/);
});

test('push 기준은 HEAD^: 마지막 커밋이 registry-core 를 바꾸면 검사, 아니면 통과', () => {
  const bad = run(makeRepo({ base: { [CORE]: '1\n' }, head: { [CORE]: '2\n' }, originMain: false }), PUSH);
  assert.equal(bad.status, 1, bad.stdout + bad.stderr);
  assert.match(bad.stdout, /push: HEAD\^/);
  const ok = run(makeRepo({ base: { [CORE]: '1\n' }, head: { 'docs/a.md': 'x\n' }, originMain: false }), PUSH);
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
});

test('기준 없음은 통과가 아니라 rc 2: origin/main 없음 · PR 의 base 브랜치 없음 · GITHUB_BASE_REF 빈 값 · push 첫 커밋 · git 아님', () => {
  const noOrigin = makeRepo({ originMain: false, head: { 'docs/a.md': 'x\n' } });
  const local = run(noOrigin);
  assert.equal(local.status, 2, local.stdout + local.stderr);
  assert.match(local.stderr, /origin\/main 가 없어요/);
  assert.equal(run(noOrigin, { ...PR, GITHUB_BASE_REF: 'release' }).status, 2);
  assert.equal(run(noOrigin, { ...PR, GITHUB_BASE_REF: '' }).status, 2);

  const single = mkdtempSync(join(tmpdir(), 'axis-cs-'));
  tmpDirs.push(single);
  git(single, 'init', '-q', '-b', 'main');
  write(single, { '.changeset/README.md': '#\n' });
  git(single, 'add', '-A');
  git(single, 'commit', '-q', '-m', 'only');
  const push = run(single, PUSH);
  assert.equal(push.status, 2, push.stdout + push.stderr);
  assert.match(push.stderr, /HEAD\^ 가 없어요/);

  const notGit = mkdtempSync(join(tmpdir(), 'axis-cs-nogit-'));
  tmpDirs.push(notGit);
  write(notGit, { '.changeset/README.md': '#\n' });
  const ng = run(notGit, { GIT_CEILING_DIRECTORIES: dirname(notGit) });
  assert.equal(ng.status, 2, ng.stdout + ng.stderr);
  assert.match(ng.stderr, /git 저장소가 아니에요/);
});

test('로컬은 커밋하지 않은 registry-core 변경도 셈(워킹트리 기준)', () => {
  const repo = makeRepo({ base: { [CORE]: '1\n' } });
  write(repo, { [CORE]: '2\n' });
  const r = run(repo);
  assert.equal(r.status, 1, r.stdout + r.stderr);
});

test('checkRegistryCore 단위: 경로 접두어는 packages/axis-registry-core/ (비슷한 이름은 제외)', () => {
  const cs0 = { cliIn: [], mcpIn: [] };
  assert.equal(checkRegistryCore(['packages/axis-registry-core-old/a.ts', 'packages/axis-cli/a.ts'], cs0).violation, false);
  assert.deepEqual(checkRegistryCore([CORE], cs0).missing, ['@axis-ds/cli', '@axis-ds/mcp']);
  assert.equal(checkRegistryCore([CORE], { cliIn: ['a.md'], mcpIn: ['a.md'] }).violation, false);
});
