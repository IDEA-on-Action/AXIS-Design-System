/**
 * tokens 를 올리는 changeset 에 mcp 도 함께 올리는지 검사 (WI-0076 후속 규칙)
 *
 * @axis-ds/mcp 는 빌드할 때 @axis-ds/tokens dist 에서 토큰 데이터를 생성해 동봉합니다(WI-0076).
 * mcp 는 tokens 를 devDependency 로만 가지므로, tokens 만 올리는 changeset 으로는 mcp 가
 * 다시 발행되지 않고 MCP 토큰 응답이 이전 tokens 값으로 남습니다. 그래서 미발행 changeset 들 가운데
 * @axis-ds/tokens 를 올리는 것이 있으면 @axis-ds/mcp 도 (같은 파일이든 다른 파일이든) 올려야 합니다.
 *
 * 실행: node scripts/check-changeset-mcp-tokens.mjs [changeset 디렉터리]
 * 종료 코드: 0 통과(검사 대상 0개 포함) · 1 위반 · 2 디렉터리나 파일을 읽지 못함
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TOKENS = '@axis-ds/tokens';
export const MCP = '@axis-ds/mcp';

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

/** 디렉터리의 changeset 들을 모아 판정한다 */
export function checkChangesetDir(dir) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .filter((f) => statSync(join(dir, f)).isFile())
    .sort();
  const tokensIn = [];
  const mcpIn = [];
  const unreadable = [];
  for (const f of files) {
    const bumps = parseFrontmatter(readFileSync(join(dir, f), 'utf8'));
    if (bumps === null) { unreadable.push(f); continue; }
    if (bumps[TOKENS] && bumps[TOKENS] !== 'none') tokensIn.push(f);
    if (bumps[MCP] && bumps[MCP] !== 'none') mcpIn.push(f);
  }
  const violation = tokensIn.length > 0 && mcpIn.length === 0;
  return { files, tokensIn, mcpIn, unreadable, violation };
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const dir = process.argv[2] ?? join(root, '.changeset');
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
  console.log(`changeset ${r.files.length}개 · ${TOKENS} 올림 ${r.tokensIn.length}개 · ${MCP} 올림 ${r.mcpIn.length}개`);
  if (r.violation) {
    console.error(
      `::error::${TOKENS} 를 올리는 changeset(${r.tokensIn.join(', ')})이 있는데 ${MCP} 를 올리는 changeset 이 없어요. ` +
        `mcp 는 빌드할 때 tokens 값을 동봉하므로, 함께 발행하지 않으면 MCP 토큰 응답이 이전 값으로 남아요. ` +
        `같은 changeset 에 "${MCP}": patch 를 더하세요.`,
    );
    process.exit(1);
  }
  if (r.tokensIn.length === 0) console.log(`${TOKENS} 를 올리는 changeset 이 없어 검사할 것이 없어요.`);
  else console.log(`통과: ${MCP} 도 함께 올라가요(${r.mcpIn.join(', ')}).`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
