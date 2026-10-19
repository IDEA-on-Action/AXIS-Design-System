// @ts-check
/**
 * JS 진입점 회귀 테스트 (WI-0035)
 *
 * exports '.' 의 import 조건인 dist/js/tokens.mjs 는 Node 와 번들러가 JavaScript 로 그대로 읽는다.
 * 1.1.0~1.2.1 배포본은 이 파일에 TypeScript 전용 문법(`as const`, `export type`)이 남아
 * import 하면 "Unexpected identifier 'as'" 로 실패했다. 여기서는 build-tokens.mjs 를 패키지 사본에서
 * 실제로 실행하고, 만들어진 tokens.mjs 를 node 로 import 해 본다.
 *
 * dist 를 읽지 않는다(turbo test 는 build 에 의존하지 않음). 산출물은 OS 임시 디렉터리에 쓴다.
 * 실행: node --test test/js-entry.test.mjs
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

/**
 * 중첩 토큰 객체를 Style Dictionary js 그룹의 name/pascal 키(예: ColorGray50)로 평면화한다
 * @param {Record<string, unknown>} obj
 * @returns {Record<string, unknown>}
 */
function flattenPascal(obj) {
  /** @type {Record<string, unknown>} */
  const out = {};
  /**
   * @param {Record<string, unknown>} o
   * @param {string[]} path
   */
  const walk = (o, path) => {
    for (const [k, v] of Object.entries(o)) {
      if (v && typeof v === 'object') walk(/** @type {Record<string, unknown>} */ (v), [...path, k]);
      else {
        const key = [...path, k].join(' ').split(/[^A-Za-z0-9]+/).filter(Boolean)
          .map(w => w[0].toUpperCase() + w.slice(1)).join('');
        out[key] = v;
      }
    }
  };
  walk(obj, []);
  return out;
}

describe('dist/js/tokens.mjs ESM 진입점 (패키지 사본에서 빌드)', () => {
  /** @type {string} */
  let work;
  /** @type {string} */
  let copy;
  /** @type {import('node:child_process').SpawnSyncReturns<string>} */
  let build;

  before(() => {
    work = mkdtempSync(join(tmpdir(), 'axis-js-entry-test-'));
    copy = join(work, 'pkg');
    for (const entry of ['build-tokens.mjs', 'scripts', 'src', 'package.json']) {
      cpSync(join(pkgDir, entry), join(copy, entry), { recursive: true });
    }
    // junction: Windows 에서 관리자 권한 없이 만들 수 있다(Linux 는 type 인자를 무시)
    symlinkSync(join(pkgDir, 'node_modules'), join(copy, 'node_modules'), 'junction');
    build = spawnSync(process.execPath, ['build-tokens.mjs'], { cwd: copy, encoding: 'utf-8' });
  });
  after(() => { rmSync(work, { recursive: true, force: true }); });

  test('build-tokens.mjs 가 rc 0 으로 끝난다', () => {
    assert.equal(build.status, 0, build.stderr);
  });

  test('node 가 tokens.mjs 를 import 한다(문법 오류 없음)', async () => {
    const mod = await import(pathToFileURL(join(copy, 'dist', 'js', 'tokens.mjs')).href);
    assert.deepEqual(Object.keys(mod).sort(), ['default', 'tokens']);
    assert.equal(mod.default, mod.tokens);
    assert.ok(Object.keys(mod.tokens).length > 0);
  });

  test('tokens.mjs 에 TypeScript 전용 문법이 없다', () => {
    const src = readFileSync(join(copy, 'dist', 'js', 'tokens.mjs'), 'utf-8');
    assert.doesNotMatch(src, /\bas const\b/);
    assert.doesNotMatch(src, /^export type\b/m);
  });

  test('ESM 값이 CJS(tokens.js) · JSON(tokens.json) 값과 같다(모양은 중첩 대 평면)', async () => {
    const mod = await import(pathToFileURL(join(copy, 'dist', 'js', 'tokens.mjs')).href);
    const cjs = require(join(copy, 'dist', 'js', 'tokens.js'));
    const json = JSON.parse(readFileSync(join(copy, 'dist', 'json', 'tokens.json'), 'utf-8'));
    const flat = flattenPascal(mod.tokens);
    assert.ok(Object.keys(flat).length > 0);
    assert.deepStrictEqual(flat, { ...cjs });
    assert.deepStrictEqual(flat, json);
  });
});
