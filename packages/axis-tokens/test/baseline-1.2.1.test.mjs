/**
 * AC3 기준선 테스트 (WI-0025 M3): 브랜드 미지정 기본 출력이 npm 1.2.1 과 같은지 본다.
 *
 * - 기준선은 test/fixtures/baseline-1.2.1/ 의 npm 1.2.1 tarball 원문이다(SOURCE.json 에 출처·해시).
 * - variables.css 는 블록(:root · .dark)별 변수 이름-값으로 비교한다. 1.2.1 변수는 값이 그대로여야 하고,
 *   1.2.1 이후 새로 생긴 변수는 SOURCE.json expectedNew 에 적힌 기본값이어야 한다. 그 밖의 신규 변수는 실패다.
 * - WI-0029(기본 테마 흰 글자 대비, PRD 2.1 · 2.2)는 1.2.1 변수 값을 의도적으로 바꾼다. 바뀐 변수와 새 값은
 *   아래 WI0029_CHANGED 에 이름 단위로 적고, 그 목록 밖의 1.2.1 변수는 계속 불변이어야 한다.
 *   WI-0029 가 더하거나 기본값을 바꾼 신규 변수는 WI0029_NEW 에 적어 SOURCE.json expectedNew 위에 덮는다.
 * - shadcn-compat.css 는 바이트 일치를 본다. 예외는 WI-0029 D6 의 다크 `--muted-foreground` 한 줄뿐이다
 *   (text.secondary 파생이라 D2 로 gray.400 → gray.300). 기대 출력은 1.2.1 원문에서 그 한 줄만 새 값으로 바꾼 것이고,
 *   그 밖의 줄이 하나라도 바뀌면 실패한다(WI0029_SHADCN · expectedShadcn).
 * - 실제 대조는 dist/css 를 읽는다. dist 가 없으면 건너뛰지 않고 실패한다(미측정 0 금지).
 *   CI 는 type-check(^build) 다음에 test 가 돌아 dist 가 있다.
 * - dist stale 가드: 로컬에서는 src · scripts · build-tokens.mjs 중 가장 늦은 mtime 보다 dist 산출물
 *   (variables.css · shadcn-compat.css 중 가장 오래된 것)이 오래되면
 *   '재빌드 필요'로 실패한다. CI(env CI) 에서는 checkout 이 mtime 을 바꿔 거짓 실패를 낼 수 있어 생략한다.
 *   AXIS_BASELINE_CSS_DIR 로 비교 대상을 바꿨을 때도 생략한다(음성 대조용 사본은 src 와 무관).
 *
 * 실행: node --test test/baseline-1.2.1.test.mjs
 * 음성 대조: AXIS_BASELINE_CSS_DIR=<dist/css 사본> node --test test/baseline-1.2.1.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureDir = join(pkgDir, 'test', 'fixtures', 'baseline-1.2.1');
const SOURCE = JSON.parse(readFileSync(join(fixtureDir, 'SOURCE.json'), 'utf8'));
const BLOCKS = [':root', '.dark'];
/** 아래 '실제 기본 출력 대조'가 읽는 dist/css 산출물. stale 가드도 이 목록 전부를 본다. */
const DIST_OUTPUTS = ['variables.css', 'shadcn-compat.css'];

const overrideDir = process.env.AXIS_BASELINE_CSS_DIR;
const cssDir = overrideDir ? resolve(overrideDir) : join(pkgDir, 'dist', 'css');

const baseVariables = readFileSync(join(fixtureDir, 'variables.css'), 'utf8');

/**
 * WI-0029 예외 목록: 1.2.1 변수 중 값이 바뀌어도 되는 것과 그 새 값(PRD 2.1).
 * 목록에 있는데 값이 1.2.1 그대로이거나 다른 값이면 위반이다(목록이 낡으면 바로 드러나게).
 */
const WI0029_COMMON = {
  '--axis-agent-message-user-bg': '#2563EB',
  '--axis-button-bg-default': '#2563EB',
  '--axis-button-bg-hover': '#1D4ED8',
  '--axis-button-bg-active': '#1E40AF',
  '--axis-button-destructive-bg-default': '#DC2626',
  '--axis-button-destructive-bg-hover': '#B91C1C',
  '--axis-button-destructive-bg-active': '#991B1B',
};
export const WI0029_CHANGED = {
  ':root': { ...WI0029_COMMON },
  '.dark': {
    ...WI0029_COMMON,
    '--axis-text-secondary': '#D1D5DB',
    '--axis-text-tertiary': '#9CA3AF',
    // button.text.disabled 다크는 {text.tertiary} 참조라 함께 바뀐다(PRD AC6)
    '--axis-button-text-disabled': '#9CA3AF',
  },
};

/** WI-0029 신규 변수(PRD 2.2)와 1.2.1 이후 신규 변수의 기본값 변경(plan-card-reject-hover-text, PRD 2.1) */
const WI0029_NEW = {
  ':root': {
    '--axis-plan-card-reject-hover-text': '#B91C1C',
    '--axis-plan-card-reject-text': '#B91C1C',
    '--axis-plan-card-approve-bg': '#15803D',
    '--axis-plan-card-approve-hover-bg': '#166534',
  },
  '.dark': {
    '--axis-plan-card-reject-hover-text': '#F87171',
    '--axis-plan-card-reject-text': '#EF4444',
    '--axis-plan-card-approve-bg': '#15803D',
    '--axis-plan-card-approve-hover-bg': '#166534',
  },
};
/**
 * WI-0029 shadcn-compat.css 예외(PRD D6 · 2.3 · AC5): 블록 · 변수 · 1.2.1 값 · 새 값.
 * 새 값 216 12% 84% 는 gray.300 #D1D5DB 의 HSL 이다(다크 text.secondary, PRD D2).
 */
export const WI0029_SHADCN = [
  { sel: '.dark', name: '--muted-foreground', base: '218 11% 65%', next: '216 12% 84%' },
];

/**
 * 1.2.1 shadcn-compat.css 원문에 예외 줄만 새 값으로 바꾼 기대 출력을 만든다.
 * 예외 줄은 해당 블록 안에서 정확히 1번 나와야 하고, 아니면 throw 한다(목록이 낡으면 바로 드러나게).
 */
export function expectedShadcn(baseText, exceptions) {
  const lines = baseText.split('\n');
  for (const ex of exceptions) {
    const open = lines.indexOf(`${ex.sel} {`);
    if (open < 0) throw new Error(`shadcn 블록 없음: ${ex.sel}`);
    const close = lines.indexOf('}', open);
    if (close < 0) throw new Error(`shadcn 블록이 닫히지 않음: ${ex.sel}`);
    const from = `    ${ex.name}: ${ex.base};`;
    const hits = [];
    for (let i = open + 1; i < close; i += 1) if (lines[i] === from) hits.push(i);
    if (hits.length !== 1) throw new Error(`shadcn 예외 줄이 ${ex.sel} 안에 ${hits.length}번 있다: ${from}`);
    lines[hits[0]] = `    ${ex.name}: ${ex.next};`;
  }
  return lines.join('\n');
}

/** 두 텍스트에서 달라진 줄 번호(1부터)와 내용. 줄 수가 다르면 길이 차이도 줄로 센다. */
export function diffLines(aText, bText) {
  const a = aText.split('\n');
  const b = bText.split('\n');
  const out = [];
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) out.push({ line: i + 1, expected: a[i], cur: b[i] });
  }
  return out;
}

const EXPECTED_NEW = Object.fromEntries(
  BLOCKS.map(sel => [sel, { ...SOURCE.expectedNew[sel], ...WI0029_NEW[sel] }]),
);

/**
 * 최상위 블록을 선택자별 Map(변수 이름 -> 값)으로 읽는다.
 * 블록 안의 모든 줄은 `  --이름: 값;` 이어야 하고, 아니면 throw 한다(조용히 줄어드는 파싱 방지).
 * 이름은 대문자를 허용한다(--axis-font-lineHeight-*).
 */
export function parseBlocks(css) {
  const lines = css.split('\n');
  const blocks = new Map();
  let current = null;
  let inComment = false;
  let declLines = 0;
  for (const [i, raw] of lines.entries()) {
    const line = raw.replace(/\r$/, '');
    if (current === null) {
      if (inComment) { if (line.includes('*/')) inComment = false; continue; }
      if (line.trim() === '') continue;
      if (line.trimStart().startsWith('/*')) { if (!line.includes('*/')) inComment = true; continue; }
      const open = /^(\S[^{]*?)\s*\{\s*$/.exec(line);
      if (!open) throw new Error(`블록 밖에서 해석할 수 없는 줄 ${i + 1}: ${line}`);
      if (blocks.has(open[1])) throw new Error(`블록 중복: ${open[1]}`);
      current = new Map();
      declLines = 0;
      blocks.set(open[1], current);
      continue;
    }
    if (line === '}') {
      // 자기 검사: 블록 안 `  --` 줄 수와 파싱한 변수 수가 같아야 한다.
      if (declLines !== current.size) throw new Error(`파싱 수 불일치: 줄 ${declLines} · 변수 ${current.size}`);
      current = null;
      continue;
    }
    if (line.startsWith('  --')) declLines += 1;
    const m = /^ {2}(--[A-Za-z0-9-]+): (.+);$/.exec(line);
    if (!m) throw new Error(`블록 안에서 해석할 수 없는 줄 ${i + 1}: ${line}`);
    if (current.has(m[1])) throw new Error(`변수 중복: ${m[1]}`);
    // 텍스트 비교가 계산값 비교와 같다는 전제의 가드: 참조(var())가 있으면 텍스트로 비교할 수 없다.
    if (m[2].includes('var(')) throw new Error(`var() 참조가 있어 텍스트 비교 불가: ${m[1]}`);
    current.set(m[1], m[2]);
  }
  if (current !== null) throw new Error('닫히지 않은 블록이 있다');
  if (blocks.size === 0) throw new Error('블록 0개');
  return blocks;
}

/**
 * 기준선과 현재 출력을 블록별로 비교한다. 위반을 이름 단위로 돌려준다.
 * missing: 1.2.1 에 있던 변수가 없음 / changed: 1.2.1 변수 값 변경 / unexpected: expectedNew 에 없는 신규 변수 /
 * newMismatch: 신규 변수 기본값 불일치 / newAbsent: expectedNew 에 있는데 출력에 없음 /
 * exceptionMismatch: 예외 목록(allowedChanges)에 있는데 값이 목록의 새 값이 아님(1.2.1 그대로인 경우 포함)
 * 예외 목록 값과 같으면 allowed 로 센다(위반 아님).
 */
export function compareBaseline(baseText, curText, expectedNew, allowedChanges = {}) {
  const base = parseBlocks(baseText);
  const cur = parseBlocks(curText);
  const result = { missingBlocks: [], extraBlocks: [], blocks: {} };
  for (const sel of base.keys()) if (!cur.has(sel)) result.missingBlocks.push(sel);
  for (const sel of cur.keys()) if (!base.has(sel)) result.extraBlocks.push(sel);
  for (const [sel, baseVars] of base) {
    const curVars = cur.get(sel) ?? new Map();
    const exp = expectedNew[sel] ?? {};
    const allow = allowedChanges[sel] ?? {};
    for (const name of Object.keys(allow)) {
      if (!baseVars.has(name)) throw new Error(`예외 목록에 1.2.1 에 없는 변수가 들어 있다: ${sel} ${name}`);
    }
    const r = { base: baseVars.size, matched: 0, allowed: 0, missing: [], changed: [], exceptionMismatch: [], unexpected: [], newMismatch: [], newAbsent: [], newCount: 0 };
    for (const [name, value] of baseVars) {
      if (Object.hasOwn(exp, name)) throw new Error(`expectedNew 에 1.2.1 변수가 들어 있다: ${sel} ${name}`);
      if (!curVars.has(name)) r.missing.push(name);
      else if (Object.hasOwn(allow, name)) {
        if (curVars.get(name) === allow[name]) r.allowed += 1;
        else r.exceptionMismatch.push({ name, base: value, expected: allow[name], cur: curVars.get(name) });
      } else if (curVars.get(name) !== value) r.changed.push({ name, base: value, cur: curVars.get(name) });
      else r.matched += 1;
    }
    for (const [name, value] of curVars) {
      if (baseVars.has(name)) continue;
      r.newCount += 1;
      if (!Object.hasOwn(exp, name)) r.unexpected.push(name);
      else if (exp[name] !== value) r.newMismatch.push({ name, expected: exp[name], cur: value });
    }
    for (const name of Object.keys(exp)) if (!curVars.has(name)) r.newAbsent.push(name);
    result.blocks[sel] = r;
  }
  return result;
}

/** 위반 총수 */
export function violationCount(result) {
  let n = result.missingBlocks.length + result.extraBlocks.length;
  for (const r of Object.values(result.blocks)) {
    n += r.missing.length + r.changed.length + r.exceptionMismatch.length + r.unexpected.length + r.newMismatch.length + r.newAbsent.length;
  }
  return n;
}

function summary(result) {
  return Object.entries(result.blocks)
    .map(([sel, r]) => `${sel} ${r.matched}/${r.base} 일치 · WI-0029 예외 ${r.allowed} · 신규 ${r.newCount}`)
    .join(' | ');
}

function newestMtime(paths) {
  let newest = { t: 0, p: '' };
  const walk = p => {
    const st = statSync(p);
    if (st.isDirectory()) { for (const e of readdirSync(p)) walk(join(p, e)); return; }
    if (st.mtimeMs > newest.t) newest = { t: st.mtimeMs, p };
  };
  for (const p of paths) walk(p);
  return newest;
}

const sha256 = buf => createHash('sha256').update(buf).digest('hex');

describe('fixture 출처', () => {
  test('fixture 파일 sha256 이 SOURCE.json 과 같다', () => {
    for (const [file, meta] of Object.entries(SOURCE.files)) {
      assert.equal(sha256(readFileSync(join(fixtureDir, file))), meta.sha256, `${file} 해시 불일치(fixture 재생성 금지)`);
    }
  });

  test('1.2.1 variables.css 는 :root · .dark 두 블록이고 블록당 249개다', () => {
    const blocks = parseBlocks(baseVariables);
    assert.deepEqual([...blocks.keys()], BLOCKS);
    for (const sel of BLOCKS) assert.equal(blocks.get(sel).size, 249, sel);
  });
});

describe('compareBaseline 변이 단위 테스트', () => {
  const none = { ':root': {}, '.dark': {} };
  const darkStart = baseVariables.indexOf('.dark {');

  /** 블록(:root 이면 앞부분, .dark 이면 뒷부분) 안의 첫 매칭 줄만 바꾼다 */
  function mutate(sel, from, to) {
    const start = sel === '.dark' ? darkStart : 0;
    const idx = baseVariables.indexOf(from, start);
    assert.ok(idx >= 0 && (sel === '.dark' || idx < darkStart), `변이 대상 없음: ${sel} ${from}`);
    return baseVariables.slice(0, idx) + to + baseVariables.slice(idx + from.length);
  }
  const lineOf = (sel, name) => {
    const start = sel === '.dark' ? darkStart : 0;
    const re = new RegExp(`\n  ${name}: [^\n]*;`, 'g');
    re.lastIndex = start;
    const m = re.exec(baseVariables);
    assert.ok(m, `줄 없음: ${sel} ${name}`);
    return m[0];
  };

  test('양성 대조: fixture 를 자기 자신과 비교하면 위반 0 · 신규 0', () => {
    const r = compareBaseline(baseVariables, baseVariables, none);
    assert.equal(violationCount(r), 0);
    for (const sel of BLOCKS) { assert.equal(r.blocks[sel].matched, 249); assert.equal(r.blocks[sel].newCount, 0); }
  });

  test(':root 값 변경은 :root changed 1건', () => {
    const l = lineOf(':root', '--axis-text-primary');
    const r = compareBaseline(baseVariables, mutate(':root', l, l.replace(/: [^;]*;/, ': #010203;')), none);
    assert.equal(violationCount(r), 1);
    assert.deepEqual(r.blocks[':root'].changed.map(c => c.name), ['--axis-text-primary']);
  });

  test('.dark 만 값 변경은 .dark changed 1건', () => {
    const l = lineOf('.dark', '--axis-text-primary');
    const r = compareBaseline(baseVariables, mutate('.dark', l, l.replace(/: [^;]*;/, ': #010203;')), none);
    assert.equal(violationCount(r), 1);
    assert.deepEqual(r.blocks['.dark'].changed.map(c => c.name), ['--axis-text-primary']);
  });

  test('대문자 이름 줄 삭제는 missing 1건', () => {
    const l = lineOf(':root', '--axis-font-lineHeight-none');
    const r = compareBaseline(baseVariables, mutate(':root', l, ''), none);
    assert.equal(violationCount(r), 1);
    assert.deepEqual(r.blocks[':root'].missing, ['--axis-font-lineHeight-none']);
  });

  test('대문자 이름 줄 값 변경도 changed 로 잡힌다', () => {
    const l = lineOf('.dark', '--axis-font-lineHeight-none');
    const r = compareBaseline(baseVariables, mutate('.dark', l, l.replace(/: [^;]*;/, ': 9;')), none);
    assert.deepEqual(r.blocks['.dark'].changed.map(c => c.name), ['--axis-font-lineHeight-none']);
  });

  test('미지 변수 추가는 unexpected 1건', () => {
    const l = lineOf(':root', '--axis-text-primary');
    const r = compareBaseline(baseVariables, mutate(':root', l, `${l}\n  --axis-zz: 1px;`), none);
    assert.equal(violationCount(r), 1);
    assert.deepEqual(r.blocks[':root'].unexpected, ['--axis-zz']);
  });

  test('신규 변수에 브랜드 값이 새면 newMismatch 1건', () => {
    const l = lineOf(':root', '--axis-text-primary');
    const exp = { ':root': { '--axis-plan-card-accent-width': '4px' }, '.dark': {} };
    const ok = compareBaseline(baseVariables, mutate(':root', l, `${l}\n  --axis-plan-card-accent-width: 4px;`), exp);
    assert.equal(violationCount(ok), 0);
    const r = compareBaseline(baseVariables, mutate(':root', l, `${l}\n  --axis-plan-card-accent-width: 1px;`), exp);
    assert.equal(violationCount(r), 1);
    assert.deepEqual(r.blocks[':root'].newMismatch.map(c => c.name), ['--axis-plan-card-accent-width']);
  });

  test('expectedNew 에 있는데 출력에 없으면 newAbsent 1건', () => {
    const exp = { ':root': {}, '.dark': { '--axis-card-shadow': '0 0 #0000' } };
    const r = compareBaseline(baseVariables, baseVariables, exp);
    assert.equal(violationCount(r), 1);
    assert.deepEqual(r.blocks['.dark'].newAbsent, ['--axis-card-shadow']);
  });

  test('예외 목록: 목록의 새 값이면 allowed, 1.2.1 값 그대로이거나 다른 값이면 exceptionMismatch', () => {
    const l = lineOf('.dark', '--axis-text-tertiary');
    const allow = { ':root': {}, '.dark': { '--axis-text-tertiary': '#9CA3AF' } };
    const ok = compareBaseline(baseVariables, mutate('.dark', l, l.replace(/: [^;]*;/, ': #9CA3AF;')), none, allow);
    assert.equal(violationCount(ok), 0);
    assert.equal(ok.blocks['.dark'].allowed, 1);
    const stale = compareBaseline(baseVariables, baseVariables, none, allow);
    assert.deepEqual(stale.blocks['.dark'].exceptionMismatch.map(c => c.name), ['--axis-text-tertiary']);
    const other = compareBaseline(baseVariables, mutate('.dark', l, l.replace(/: [^;]*;/, ': #010203;')), none, allow);
    assert.deepEqual(other.blocks['.dark'].exceptionMismatch.map(c => c.name), ['--axis-text-tertiary']);
    // 예외는 블록 단위다: .dark 예외가 :root 같은 이름 변경을 허용하지 않는다
    const lr = lineOf(':root', '--axis-text-tertiary');
    const root = compareBaseline(baseVariables, mutate(':root', lr, lr.replace(/: [^;]*;/, ': #9CA3AF;')), none, allow);
    assert.deepEqual(root.blocks[':root'].changed.map(c => c.name), ['--axis-text-tertiary']);
    assert.throws(() => compareBaseline(baseVariables, baseVariables, none, { ':root': { '--axis-zz': '1' } }), /1\.2\.1 에 없는 변수/);
  });

  test('예외 목록이 있어도 목록 밖 변수 변경은 changed 로 잡힌다 (WI-0029 변이)', () => {
    const l = lineOf(':root', '--axis-text-primary');
    const r = compareBaseline(baseVariables, mutate(':root', l, l.replace(/: [^;]*;/, ': #010203;')), none, WI0029_CHANGED);
    assert.deepEqual(r.blocks[':root'].changed.map(c => c.name), ['--axis-text-primary']);
  });

  test('WI-0029 예외 목록은 PRD 2.1 범위(:root 7 · .dark 10)이고 1.2.1 값과 모두 다르다', () => {
    assert.equal(Object.keys(WI0029_CHANGED[':root']).length, 7);
    assert.equal(Object.keys(WI0029_CHANGED['.dark']).length, 10);
    const base = parseBlocks(baseVariables);
    for (const sel of BLOCKS) {
      for (const [name, value] of Object.entries(WI0029_CHANGED[sel])) {
        assert.ok(base.get(sel).has(name), `${sel} ${name} 은 1.2.1 변수여야 한다`);
        assert.notEqual(base.get(sel).get(name), value, `${sel} ${name} 은 1.2.1 과 같은 값이라 예외가 필요 없다`);
      }
    }
  });

  test('.dark 블록이 없으면 missingBlocks 로 잡힌다', () => {
    const r = compareBaseline(baseVariables, baseVariables.slice(0, darkStart), none);
    assert.deepEqual(r.missingBlocks, ['.dark']);
  });

  test('해석할 수 없는 줄 · var() 참조 · 블록 0개는 throw', () => {
    const l = lineOf(':root', '--axis-text-primary');
    assert.throws(() => parseBlocks(mutate(':root', l, `${l}\n  color: red;`)), /해석할 수 없는 줄/);
    assert.throws(() => parseBlocks(mutate(':root', l, l.replace(/: [^;]*;/, ': var(--x);'))), /var\(\)/);
    assert.throws(() => parseBlocks('/* 비어 있음 */\n'), /블록 0개/);
    assert.throws(() => parseBlocks(':root {\n  --a: 1;'), /닫히지 않은/);
  });
});

describe('shadcn-compat.css 예외 변이 단위 테스트', () => {
  const base = readFileSync(join(fixtureDir, 'shadcn-compat.css'), 'utf8');
  const expected = expectedShadcn(base, WI0029_SHADCN);
  const darkStart = base.indexOf('.dark {');

  test('기대 출력은 1.2.1 과 정확히 다크 --muted-foreground 한 줄만 다르다', () => {
    const d = diffLines(base, expected);
    assert.equal(d.length, 1);
    assert.equal(d[0].expected, '    --muted-foreground: 218 11% 65%;');
    assert.equal(d[0].cur, '    --muted-foreground: 216 12% 84%;');
    assert.ok(base.indexOf(d[0].expected, darkStart) > darkStart, '바뀌는 줄은 .dark 블록 안이어야 한다');
    // :root 의 --muted-foreground 는 그대로다
    assert.ok(expected.slice(0, darkStart).includes('    --muted-foreground: 215 14% 34%;'));
  });

  test('변이: 예외 밖 줄(다크 --foreground)을 바꾸면 기대 출력과 달라진다', () => {
    const l = '    --foreground: ';
    const idx = expected.indexOf(l, darkStart);
    assert.ok(idx > darkStart);
    const end = expected.indexOf(';', idx);
    const mutated = expected.slice(0, idx) + l + '0 0% 0%' + expected.slice(end);
    const d = diffLines(expected, mutated);
    assert.equal(d.length, 1);
    assert.match(d[0].cur, /--foreground: 0 0% 0%;/);
  });

  test('변이: 예외 줄이 1.2.1 값 그대로이거나 다른 값이면 기대 출력과 달라진다', () => {
    assert.equal(diffLines(expected, base).length, 1);
    const other = expected.replace('    --muted-foreground: 216 12% 84%;', '    --muted-foreground: 0 0% 50%;');
    assert.equal(diffLines(expected, other).length, 1);
  });

  test('예외 목록이 1.2.1 과 맞지 않으면 throw', () => {
    assert.throws(() => expectedShadcn(base, [{ sel: '.dark', name: '--muted-foreground', base: '1 1% 1%', next: 'x' }]), /0번 있다/);
    assert.throws(() => expectedShadcn(base, [{ sel: '.nope', name: '--muted-foreground', base: '218 11% 65%', next: 'x' }]), /블록 없음/);
  });
});

describe('실제 기본 출력 대조 (dist/css)', () => {
  test('dist stale 가드 (로컬 전용)', t => {
    const varsPath = join(cssDir, 'variables.css');
    assert.ok(existsSync(varsPath), `${varsPath} 없음: pnpm --filter @axis-ds/tokens build 를 먼저 실행한다`);
    if (process.env.CI) { t.diagnostic('CI 환경: mtime 가드 생략(checkout 이 mtime 을 바꿔 거짓 실패 가능)'); return; }
    if (overrideDir) { t.diagnostic('AXIS_BASELINE_CSS_DIR 지정: mtime 가드 생략'); return; }
    const newest = newestMtime([join(pkgDir, 'src'), join(pkgDir, 'scripts'), join(pkgDir, 'build-tokens.mjs')]);
    // 대조하는 산출물 전부(variables.css · shadcn-compat.css) 중 가장 오래된 것을 기준으로 본다
    const outputs = DIST_OUTPUTS.map(f => {
      const p = join(cssDir, f);
      assert.ok(existsSync(p), `${p} 없음: pnpm --filter @axis-ds/tokens build 를 먼저 실행한다`);
      return { t: statSync(p).mtimeMs, p };
    });
    const oldest = outputs.reduce((a, b) => (b.t < a.t ? b : a));
    t.diagnostic(`dist 산출물 ${outputs.length}개 중 가장 오래된 것: ${oldest.p}`);
    assert.ok(oldest.t >= newest.t, `재빌드 필요: dist ${oldest.p} 가 ${newest.p} 보다 오래됐다`);
  });

  test('variables.css: 1.2.1 변수 불변 + 신규 변수는 기본값만', t => {
    const cur = readFileSync(join(cssDir, 'variables.css'), 'utf8');
    const r = compareBaseline(baseVariables, cur, EXPECTED_NEW, WI0029_CHANGED);
    t.diagnostic(`AC3 variables.css: ${summary(r)}`);
    assert.equal(violationCount(r), 0, JSON.stringify(r, null, 1));
    for (const sel of BLOCKS) {
      const allowed = Object.keys(WI0029_CHANGED[sel]).length;
      assert.equal(r.blocks[sel].allowed, allowed, sel);
      assert.equal(r.blocks[sel].matched, 249 - allowed, sel);
      assert.equal(r.blocks[sel].newCount, Object.keys(EXPECTED_NEW[sel]).length, sel);
    }
  });

  test('shadcn-compat.css: 1.2.1 과 바이트 일치(WI-0029 D6 다크 --muted-foreground 한 줄 제외)', t => {
    const cur = readFileSync(join(cssDir, 'shadcn-compat.css'));
    const baseText = readFileSync(join(fixtureDir, 'shadcn-compat.css'), 'utf8');
    const expected = Buffer.from(expectedShadcn(baseText, WI0029_SHADCN), 'utf8');
    const d = diffLines(baseText, cur.toString('utf8'));
    t.diagnostic(`AC5 shadcn-compat.css: ${cur.length}/${expected.length} bytes · 1.2.1 대비 바뀐 줄 ${d.length}`);
    assert.ok(cur.equals(expected), `shadcn-compat.css 가 기대 출력과 다르다: ${JSON.stringify(diffLines(expected.toString('utf8'), cur.toString('utf8')))}`);
    // 예외 줄 새 값 단언(바이트 일치와 별도로 명시)
    assert.equal(d.length, WI0029_SHADCN.length);
    assert.equal(d[0].cur, '    --muted-foreground: 216 12% 84%;');
  });
});
