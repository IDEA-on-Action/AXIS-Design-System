/**
 * changeset 동반 검사 두 가지
 *
 * 1. tokens 를 올리는 changeset 에 mcp 도 함께 올리는지 (WI-0076 후속 규칙)
 *    @axis-ds/mcp 는 빌드할 때 @axis-ds/tokens dist 에서 토큰 데이터를 생성해 동봉합니다(WI-0076).
 *    mcp 는 tokens 를 devDependency 로만 가지므로, tokens 만 올리는 changeset 으로는 mcp 가
 *    다시 발행되지 않고 MCP 토큰 응답이 이전 tokens 값으로 남습니다. 그래서 미발행 changeset 들 가운데
 *    @axis-ds/tokens 를 올리는 것이 있으면 @axis-ds/mcp 도 (같은 파일이든 다른 파일이든) 올려야 합니다.
 *
 * 2. registry-core 를 바꾸면 cli 와 mcp 를 모두 올리는지 (WI-0080, 배치 6b 사용자 결정)
 *    @axis-ds/registry-core 는 발행하지 않는 패키지(private 0.0.0)이고 cli · mcp 가 빌드 때 번들합니다.
 *    그래서 packages/axis-registry-core/ 아래 파일을 바꾼 변경은 미발행 changeset 에 @axis-ds/cli 와
 *    @axis-ds/mcp 올림이 모두 있어야 합니다(하나만 올리면 다른 쪽 판정이 낡은 코어로 남음).
 *    바뀐 파일은 git 으로 비교 기준을 정해 봅니다(워킹트리 기준, CI 에서는 HEAD 와 같음).
 *    - pull_request(GITHUB_ACTIONS · GITHUB_EVENT_NAME=pull_request · GITHUB_BASE_REF): origin/<base> 와의 merge-base
 *    - push(GITHUB_EVENT_NAME=push): HEAD^ (main 은 squash 머지라 커밋 하나가 PR 하나)
 *    - 그 밖(로컬 · workflow_dispatch): origin/main 과의 merge-base
 *    기준을 구하지 못하면(얕은 clone · origin/main 없음 · git 아님) 통과로 넘기지 않고 종료 코드 2 로 알립니다.
 *    CI 는 checkout 의 fetch-depth: 0 으로 기준 커밋을 받습니다(frontend.yml).
 *    Release PR(changeset 을 소비하고 registry-core 는 바꾸지 않음)과 registry-core 를 바꾸지 않는 변경은 통과합니다.
 *
 * 실행: node scripts/check-changeset-mcp-tokens.mjs [changeset 디렉터리] [--repo <git 저장소 디렉터리>]
 *       (기본: 이 스크립트가 있는 저장소와 그 .changeset)
 * 종료 코드: 0 통과(검사 대상 0개 포함) · 1 위반 · 2 디렉터리나 파일을 읽지 못함 · 비교 기준을 구하지 못함
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TOKENS = '@axis-ds/tokens';
export const MCP = '@axis-ds/mcp';
export const CLI = '@axis-ds/cli';
/** 이 경로 아래 파일을 바꾸면 cli · mcp 를 모두 올려야 함(저장소 루트 기준, posix) */
export const REGISTRY_CORE_DIR = 'packages/axis-registry-core/';

/** changeset 본문 앞머리(--- 사이)에서 패키지 이름 → bump 종류를 읽는다 */
export function parseFrontmatter(text) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const bumps = {};
  for (const line of m[1].split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const kv = /^["']?([^"':]+)["']?\s*:\s*["']?(major|minor|patch|none)["']?\s*$/.exec(t);
    if (kv) bumps[kv[1].trim()] = kv[2];
  }
  return bumps;
}

/** 디렉터리의 changeset 들을 모아 판정한다(tokens → mcp 규칙). cli 올림 목록도 함께 돌려준다 */
export function checkChangesetDir(dir) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .filter((f) => statSync(join(dir, f)).isFile())
    .sort();
  const tokensIn = [];
  const mcpIn = [];
  const cliIn = [];
  const unreadable = [];
  for (const f of files) {
    const bumps = parseFrontmatter(readFileSync(join(dir, f), 'utf8'));
    if (bumps === null) { unreadable.push(f); continue; }
    if (bumps[TOKENS] && bumps[TOKENS] !== 'none') tokensIn.push(f);
    if (bumps[MCP] && bumps[MCP] !== 'none') mcpIn.push(f);
    if (bumps[CLI] && bumps[CLI] !== 'none') cliIn.push(f);
  }
  const violation = tokensIn.length > 0 && mcpIn.length === 0;
  return { files, tokensIn, mcpIn, cliIn, unreadable, violation };
}

/** git 을 repo 에서 실행한다. 실패해도 던지지 않고 { status, stdout, stderr } 를 돌려준다 */
export function makeGit(repo) {
  return (args) => {
    const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
    return { status: r.status ?? (r.error ? 127 : 1), stdout: r.stdout ?? '', stderr: (r.stderr ?? '') + (r.error ? String(r.error.message) : '') };
  };
}

/**
 * 비교 기준 커밋을 정한다. 성공하면 { ok: true, base, how }, 못 구하면 { ok: false, reason }.
 * 파이프 · 무출력으로 실패가 가려지지 않도록 git 의 종료 코드와 출력(40자 sha)을 모두 본다.
 */
export function resolveBase(env, git) {
  const inside = git(['rev-parse', '--is-inside-work-tree']);
  if (inside.status !== 0 || inside.stdout.trim() !== 'true') return { ok: false, reason: `git 저장소가 아니에요 (${inside.stderr.trim() || inside.stdout.trim()})` };
  const sha = (r) => (r.status === 0 && /^[0-9a-f]{40,64}$/.test(r.stdout.trim()) ? r.stdout.trim() : undefined);
  const mergeBaseWith = (ref, how) => {
    const verified = sha(git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]));
    if (!verified) return { ok: false, reason: `${ref} 가 없어요(${how}). git fetch origin 으로 받거나 CI 는 checkout fetch-depth: 0 이 필요해요` };
    const mb = git(['merge-base', ref, 'HEAD']);
    const base = sha(mb);
    if (!base) return { ok: false, reason: `${ref} 와 HEAD 의 merge-base 를 구하지 못했어요(${how}, 얕은 clone 이면 fetch-depth: 0 이 필요해요): ${mb.stderr.trim()}` };
    return { ok: true, base, how: `${how}: merge-base(${ref}, HEAD)` };
  };
  const event = env.GITHUB_ACTIONS === 'true' ? env.GITHUB_EVENT_NAME ?? '' : '';
  if (event === 'pull_request' || event === 'pull_request_target') {
    const baseRef = (env.GITHUB_BASE_REF ?? '').trim();
    if (!baseRef) return { ok: false, reason: `GITHUB_BASE_REF 가 비어 있어요(${event})` };
    return mergeBaseWith(`origin/${baseRef}`, event);
  }
  if (event === 'push') {
    // `HEAD^` 가 없으면(첫 커밋 · fetch-depth 1) 비교할 수 없음
    const parent = sha(git(['rev-parse', '--verify', '--quiet', 'HEAD^']));
    if (!parent) return { ok: false, reason: 'HEAD^ 가 없어요(push, 얕은 clone 이면 fetch-depth: 0 이 필요해요)' };
    return { ok: true, base: parent, how: 'push: HEAD^' };
  }
  return mergeBaseWith('origin/main', event ? `${event}(로컬과 같은 기준)` : '로컬');
}

/** base 와 워킹트리 사이에 바뀐 파일(저장소 루트 기준 posix, 이름 바꿈은 지움 + 추가로). 실패면 undefined */
export function changedFiles(git, base) {
  const r = git(['diff', '--name-only', '--no-renames', '-z', base, '--']);
  if (r.status !== 0) return undefined;
  return r.stdout.split('\0').filter((f) => f !== '');
}

/** registry-core 규칙 판정 */
export function checkRegistryCore(changed, cs) {
  const coreChanged = changed.filter((f) => f.startsWith(REGISTRY_CORE_DIR));
  const missing = [];
  if (coreChanged.length > 0) {
    if (cs.cliIn.length === 0) missing.push(CLI);
    if (cs.mcpIn.length === 0) missing.push(MCP);
  }
  return { coreChanged, missing, violation: missing.length > 0 };
}

function parseArgs(argv, root) {
  let repo = root;
  let dir;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--repo') repo = argv[++i];
    else dir = argv[i];
  }
  return { repo, dir: dir ?? join(repo, '.changeset') };
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const { repo, dir } = parseArgs(process.argv.slice(2), root);
  let r;
  try {
    r = checkChangesetDir(dir);
  } catch (e) {
    console.error(`changeset 디렉터리를 읽지 못했어요: ${dir} (${e.message})`);
    process.exit(2);
  }
  if (r.unreadable.length > 0) {
    console.error(`앞머리(---)를 읽지 못한 changeset: ${r.unreadable.join(', ')}`);
    process.exit(2);
  }
  console.log(
    `changeset ${r.files.length}개 · ${TOKENS} 올림 ${r.tokensIn.length}개 · ${MCP} 올림 ${r.mcpIn.length}개 · ${CLI} 올림 ${r.cliIn.length}개`,
  );
  let code = 0;
  if (r.violation) {
    console.error(
      `::error::${TOKENS} 를 올리는 changeset(${r.tokensIn.join(', ')})이 있는데 ${MCP} 를 올리는 changeset 이 없어요. ` +
        `mcp 는 빌드할 때 tokens 값을 동봉하므로, 함께 발행하지 않으면 MCP 토큰 응답이 이전 값으로 남아요. ` +
        `같은 changeset 에 "${MCP}": patch 를 더하세요.`,
    );
    code = 1;
  } else if (r.tokensIn.length === 0) console.log(`${TOKENS} 를 올리는 changeset 이 없어 tokens → mcp 검사할 것이 없어요.`);
  else console.log(`통과(tokens → mcp): ${MCP} 도 함께 올라가요(${r.mcpIn.join(', ')}).`);

  // registry-core → cli · mcp
  const git = makeGit(repo);
  const base = resolveBase(process.env, git);
  if (!base.ok) {
    console.error(`::error::registry-core 변경 검사의 비교 기준을 구하지 못했어요: ${base.reason}`);
    process.exit(2);
  }
  const changed = changedFiles(git, base.base);
  if (changed === undefined) {
    console.error(`::error::바뀐 파일 목록을 읽지 못했어요(git diff ${base.base}).`);
    process.exit(2);
  }
  const core = checkRegistryCore(changed, r);
  console.log(`비교 기준 ${base.base.slice(0, 12)} (${base.how}) · 바뀐 파일 ${changed.length}개 · ${REGISTRY_CORE_DIR} ${core.coreChanged.length}개`);
  if (core.violation) {
    console.error(
      `::error::${REGISTRY_CORE_DIR} 를 바꿨는데(${core.coreChanged.slice(0, 5).join(', ')}${core.coreChanged.length > 5 ? ' 외' : ''}) ` +
        `미발행 changeset 에 ${core.missing.join(' · ')} 올림이 없어요. registry-core 는 발행하지 않고 cli · mcp 가 번들하므로 ` +
        `둘 다 다시 발행해야 바뀐 코어가 사용자에게 가요. changeset 에 "${CLI}": patch 와 "${MCP}": patch 를 모두 넣으세요.`,
    );
    code = Math.max(code, 1);
  } else if (core.coreChanged.length === 0) console.log(`${REGISTRY_CORE_DIR} 를 바꾸지 않아 registry-core → cli · mcp 검사할 것이 없어요.`);
  else console.log(`통과(registry-core → cli · mcp): ${CLI}(${r.cliIn.join(', ')}) · ${MCP}(${r.mcpIn.join(', ')}) 가 함께 올라가요.`);
  process.exit(code);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
