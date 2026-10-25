// @ts-check
/**
 * Tailwind preset CommonJS 진입점 회귀 테스트 (WI-0072)
 *
 * 1.1.0~1.6.2 의 dist/tailwind-preset.js 는 tsup cjs 산출물 그대로라 require 결과가 `{ default, axisKeyframes, axisAnimation }` 였다.
 * 그래서 CommonJS 설정(module.exports 를 쓰는 .cjs · type 이 없는 .js · .ts)에 `presets: [require("@axis-ds/tokens/tailwind")]` 를
 * 넣으면 preset 이 통째로 빠졌다. `.ts` 안의 `export default { presets: [require(...)] }` 는 Tailwind 의 jiti interop 덕분에 원래 정상이었다.
 *
 * 여기서는 패키지 사본에서 tsup + scripts/cjs-preset.mjs 를 실제로 돌리고, 사본을 node_modules/@axis-ds/tokens 로 둔 소비자 디렉터리에서
 * Tailwind 3 의 loadConfig + resolveConfig 로 설정 형태별 결과를 본다. 후처리 전 산출물로 같은 검사를 돌려 음성 대조군도 둔다.
 * dist 를 읽지 않는다(turbo test 는 build 에 의존하지 않음). 산출물은 OS 임시 디렉터리에 쓴다.
 * 사본 빌드의 tsup 인자와 후처리 여부는 package.json 의 build 스크립트에서 읽는다(손으로 복제하면 build 가 바뀔 때 낡는다).
 *
 * WI-0083: 같은 사본 dist 의 세 진입점(import → .mjs default, require → .js, require(...).default)마다 Tailwind 3 로
 * borderColor.DEFAULT · preflight border-color(WI-0077) · border-red-500 유틸리티 · 소비자 theme.extend 우선을 본다.
 * src 를 바로 읽는 tw3-border-default.test.mjs 는 소비자가 받는 dist 회귀(한쪽 진입점만 값이 빠짐)를 못 잡는다.
 *
 * 실행: node --test test/cjs-preset.test.mjs
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CJS_MARKER, patchCjsPreset } from '../scripts/cjs-preset.mjs';

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(pkgDir, 'package.json'));
const tsupCli = join(dirname(require.resolve('tsup/package.json')), 'dist', 'cli-default.js');
const tscCli = join(dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
const tailwindDir = dirname(require.resolve('tailwindcss/package.json'));
const postcssPath = createRequire(join(tailwindDir, 'package.json')).resolve('postcss');

/**
 * package.json build 스크립트의 단계(`a && b && c`). 사본 빌드는 이 값을 따른다
 * @type {string[]}
 */
const BUILD_STEPS = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8')).scripts.build.split('&&').map((/** @type {string} */ x) => x.trim());
const TSUP_STEP = BUILD_STEPS.findIndex((x) => x.startsWith('tsup '));
const CJS_STEP = BUILD_STEPS.indexOf('node scripts/cjs-preset.mjs');

/** preset 이 적용됐는지 판정하는 값(resolveConfig 결과) */
const PRESET_KEYFRAMES = ['accordion-down', 'accordion-up', 'progress-indeterminate'];

/**
 * 설정 형태: 파일 이름 · 본문 · 지금(수정 후) 기대 · 후처리 전 기대
 * 후처리 전 기대는 1.6.2 배포본 실측(WI-0072 PRD 1.2)과 같아야 한다.
 */
const SHAPES = [
  { file: 'a.cjs', body: 'module.exports = { content: [], presets: [require("@axis-ds/tokens/tailwind")] }\n', before: false },
  { file: 'b.js', body: 'module.exports = { content: [], presets: [require("@axis-ds/tokens/tailwind")] }\n', before: false },
  { file: 'c.ts', body: 'module.exports = { content: [], presets: [require("@axis-ds/tokens/tailwind")] }\n', before: false },
  { file: 'd.ts', body: 'export default { content: [], presets: [require("@axis-ds/tokens/tailwind")] }\n', before: true },
  { file: 'e.ts', body: "import type { Config } from 'tailwindcss'\nimport axisPreset from '@axis-ds/tokens/tailwind'\nconst config: Config = { content: [], presets: [axisPreset] }\nexport default config\n", before: true },
  { file: 'f.mjs', body: "import axisPreset from '@axis-ds/tokens/tailwind'\nexport default { content: [], presets: [axisPreset] }\n", before: true },
  { file: 'g.cjs', body: 'module.exports = { content: [], presets: [require("@axis-ds/tokens/tailwind").default] }\n', before: true },
  { file: 'h.ts', body: 'module.exports = { content: [], presets: [require("@axis-ds/tokens/tailwind").default] }\n', before: true },
  // apps/web tailwind.config.ts 처럼 preset 없이 이름 내보내기만 쓰는 형태(WI-0046)
  { file: 'i.ts', body: "import { axisAnimation, axisKeyframes } from '@axis-ds/tokens/tailwind'\nexport default { content: [], theme: { extend: { keyframes: axisKeyframes, animation: axisAnimation, colors: { primary: 'hsl(var(--primary))' } } } }\n", before: true },
  { file: 'j.cjs', body: 'const { axisKeyframes, axisAnimation } = require("@axis-ds/tokens/tailwind")\nmodule.exports = { content: [], theme: { extend: { keyframes: axisKeyframes, animation: axisAnimation, colors: { primary: "hsl(var(--primary))" } } } }\n', before: true },
];

/** 소비자 디렉터리에서 실행하는 판독 스크립트(설정 파일마다 새 프로세스: require 캐시 · jiti 캐시 격리) */
const PROBE = `
const loadConfig = require(${JSON.stringify(join(tailwindDir, 'lib', 'lib', 'load-config.js'))}).loadConfig;
const resolveConfig = require(${JSON.stringify(join(tailwindDir, 'resolveConfig.js'))});
const cfg = resolveConfig(loadConfig(process.argv[2]));
const kf = Object.keys(cfg.theme.keyframes || {});
console.log(JSON.stringify({
  primary: cfg.theme.colors.primary ?? null,
  keyframes: kf,
  radiusLg: cfg.theme.borderRadius.lg,
}));
`;

/** preset 이 정하는 기본 테두리색(src/tailwind-preset.ts axisBorderColorDefault, WI-0077) */
const EXPECTED_BORDER = 'hsl(var(--border, 220 13% 91%))';
/** 소비자가 theme.extend 로 덮는 값 */
const CONSUMER_BORDER = '#123456';

/**
 * dist 진입점 판독(ESM 프로세스). 인자: esm | cjs | cjs-default
 * esm 은 import 조건(.mjs)의 default, cjs 는 require 조건(.js) 결과, cjs-default 는 그 .default 를 preset 으로 쓴다.
 */
const DIST_PROBE = `
import { createRequire } from 'node:module';
import { basename } from 'node:path';
const require = createRequire(import.meta.url);
const tailwindcss = require(${JSON.stringify(tailwindDir)});
const resolveConfig = require(${JSON.stringify(join(tailwindDir, 'resolveConfig.js'))});
const postcss = require(${JSON.stringify(postcssPath)});
const kind = process.argv[2];
let preset;
let resolved;
if (kind === 'esm') {
  preset = (await import('@axis-ds/tokens/tailwind')).default;
  resolved = import.meta.resolve('@axis-ds/tokens/tailwind');
} else {
  const m = require('@axis-ds/tokens/tailwind');
  preset = kind === 'cjs-default' ? m.default : m;
  resolved = require.resolve('@axis-ds/tokens/tailwind');
}
const html = '<div class="border border-red-500"></div>';
async function compile(config) {
  const r = await postcss([tailwindcss({ ...config, content: [{ raw: html, extension: 'html' }] })]).process('@tailwind base;\\n@tailwind utilities;', { from: undefined });
  const preflight = [];
  let red = 0;
  r.root.walkRules((rule) => {
    const sel = rule.selector.replace(/\\s+/g, ' ');
    if (/^\\*, ?::before, ?::after$/.test(sel)) rule.walkDecls('border-color', (d) => { preflight.push(d.value); });
    if (sel === '.border-red-500') red++;
  });
  return { preflight, red };
}
const base = { presets: [preset] };
const consumer = { presets: [preset], theme: { extend: { borderColor: { DEFAULT: ${JSON.stringify(CONSUMER_BORDER)} } } } };
const a = await compile(base);
const b = await compile(consumer);
console.log(JSON.stringify({
  file: basename(resolved.startsWith('file:') ? new URL(resolved).pathname : resolved),
  borderDefault: resolveConfig({ ...base, content: [] }).theme.borderColor.DEFAULT ?? null,
  preflight: a.preflight,
  red: a.red,
  consumerDefault: resolveConfig({ ...consumer, content: [] }).theme.borderColor.DEFAULT ?? null,
  consumerPreflight: b.preflight,
}));
`;

/** 진입점 세 개: 판독 인자 · 해석돼야 하는 dist 파일 */
const DIST_ENTRIES = [
  { kind: 'esm', file: 'tailwind-preset.mjs', label: 'import(.mjs) default' },
  { kind: 'cjs', file: 'tailwind-preset.js', label: 'require(.js)' },
  { kind: 'cjs-default', file: 'tailwind-preset.js', label: 'require(.js).default' },
];

/** @type {Map<string, any>} */
const distCache = new Map();
/**
 * @param {string} consumer
 * @param {string} kind
 */
function probeDist(consumer, kind) {
  const key = `${consumer}\0${kind}`;
  if (!distCache.has(key)) {
    const r = spawnSync(process.execPath, ['probe-dist.mjs', kind], { cwd: consumer, encoding: 'utf-8' });
    assert.equal(r.status, 0, `${kind}: ${r.stderr}`);
    distCache.set(key, JSON.parse(r.stdout.trim().split('\n').pop() ?? '{}'));
  }
  return distCache.get(key);
}

/**
 * @param {string} consumer
 * @param {string} file
 */
function probe(consumer, file) {
  const r = spawnSync(process.execPath, ['probe.cjs', join(consumer, file)], { cwd: consumer, encoding: 'utf-8' });
  assert.equal(r.status, 0, `${file}: ${r.stderr}`);
  return JSON.parse(r.stdout.trim().split('\n').pop() ?? '{}');
}

/**
 * 설정 결과가 preset 을 받았는지
 * @param {{ primary: unknown, keyframes: string[] }} got
 */
function hasPreset(got) {
  return got.primary !== null && PRESET_KEYFRAMES.every((k) => got.keyframes.includes(k));
}

/**
 * 패키지 사본 하나와 그 사본을 쓰는 소비자 디렉터리를 만든다
 * @param {string} work
 * @param {string} label
 * @param {boolean} patch
 */
function makeConsumer(work, label, patch) {
  const copy = join(work, `pkg-${label}`);
  for (const entry of ['src', 'scripts', 'package.json', 'tsconfig.json']) {
    cpSync(join(pkgDir, entry), join(copy, entry), { recursive: true });
  }
  writeFileSync(join(copy, 'tsconfig.base.json'), readFileSync(join(pkgDir, '..', '..', 'tsconfig.base.json')));
  // tsconfig.json 의 extends 는 레포 루트를 가리키므로 사본 안의 사본으로 바꾼다
  const tsconfig = JSON.parse(readFileSync(join(copy, 'tsconfig.json'), 'utf-8'));
  tsconfig.extends = './tsconfig.base.json';
  writeFileSync(join(copy, 'tsconfig.json'), JSON.stringify(tsconfig));
  symlinkSync(join(pkgDir, 'node_modules'), join(copy, 'node_modules'), 'junction');
  assert.ok(TSUP_STEP >= 0, `build 스크립트에 tsup 단계가 없어요: ${BUILD_STEPS.join(' && ')}`);
  const build = spawnSync(process.execPath, [tsupCli, ...BUILD_STEPS[TSUP_STEP].split(/\s+/).slice(1)], {
    cwd: copy, encoding: 'utf-8',
  });
  assert.equal(build.status, 0, build.stderr || build.stdout);
  // fixed 는 실제 build 처럼 후처리 단계가 있을 때만 후처리한다(build 에서 빠지면 아래 테스트가 실패해야 함)
  if (patch && CJS_STEP > TSUP_STEP) patchCjsPreset(join(copy, 'dist'));

  const consumer = join(work, `app-${label}`);
  mkdirSync(join(consumer, 'node_modules', '@axis-ds'), { recursive: true });
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ name: `axis-cjs-${label}`, private: true }));
  symlinkSync(copy, join(consumer, 'node_modules', '@axis-ds', 'tokens'), 'junction');
  symlinkSync(tailwindDir, join(consumer, 'node_modules', 'tailwindcss'), 'junction');
  writeFileSync(join(consumer, 'probe.cjs'), PROBE);
  writeFileSync(join(consumer, 'probe-dist.mjs'), DIST_PROBE);
  for (const s of SHAPES) writeFileSync(join(consumer, s.file), s.body);
  return { copy, consumer };
}

describe('CommonJS preset 진입점 (패키지 사본에서 빌드 · Tailwind 3 loadConfig)', () => {
  /** @type {string} */
  let work;
  /** @type {{ copy: string, consumer: string }} */
  let fixed;
  /** @type {{ copy: string, consumer: string }} */
  let unpatched;

  before(() => {
    work = mkdtempSync(join(tmpdir(), 'axis-cjs-preset-test-'));
    fixed = makeConsumer(work, 'fixed', true);
    unpatched = makeConsumer(work, 'unpatched', false);
    // dist 판독은 빌드 직후에 한 번 해 둔다(뒤의 「다시 실행」 테스트가 fixed dist 에 후처리를 다시 돌리므로 순서에 묶이지 않게)
    for (const c of [fixed, unpatched]) for (const e of DIST_ENTRIES) probeDist(c.consumer, e.kind);
  });
  after(() => { rmSync(work, { recursive: true, force: true }); });

  for (const s of SHAPES) {
    test(`${s.file}: 수정 후 preset 이 들어온다`, () => {
      const got = probe(fixed.consumer, s.file);
      assert.ok(hasPreset(got), `${s.file}: ${JSON.stringify(got)}`);
      assert.equal(got.primary && typeof got.primary === 'object' ? /** @type {any} */ (got.primary).DEFAULT : got.primary, 'hsl(var(--primary))');
    });
  }

  test('음성 대조군: 후처리 전 산출물은 CommonJS 형태에서 preset 이 빠진다(1.6.2 배포본과 같은 결과)', () => {
    const results = SHAPES.map((s) => ({ file: s.file, want: s.before, got: hasPreset(probe(unpatched.consumer, s.file)) }));
    assert.deepEqual(results.filter((r) => r.want !== r.got), [], JSON.stringify(results));
    // 대조군이 실제로 실패 형태를 포함하는지(0건이면 이 대조는 아무것도 증명하지 않는다)
    assert.ok(results.filter((r) => !r.got).length >= 3);
  });

  test('require 결과는 preset 자체이고 붙인 속성은 열거되지 않는다', () => {
    const r = spawnSync(process.execPath, ['-e', `
      const p = require('@axis-ds/tokens/tailwind');
      console.log(JSON.stringify({
        keys: Object.keys(p),
        spreadKeys: Object.keys({ ...p }),
        selfDefault: p.default === p,
        kf: Object.keys(p.axisKeyframes),
        anim: Object.keys(p.axisAnimation),
        theme: typeof p.theme,
      }));
    `], { cwd: fixed.consumer, encoding: 'utf-8' });
    assert.equal(r.status, 0, r.stderr);
    const got = JSON.parse(r.stdout.trim());
    assert.deepEqual(got.keys, ['darkMode', 'theme']);
    assert.deepEqual(got.spreadKeys, ['darkMode', 'theme']);
    assert.equal(got.selfDefault, true);
    assert.deepEqual(got.kf, PRESET_KEYFRAMES);
    assert.deepEqual(got.anim, PRESET_KEYFRAMES);
    assert.equal(got.theme, 'object');
  });

  test('ESM import 는 바뀌지 않는다(default 와 이름 내보내기)', () => {
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import p, { axisKeyframes, axisAnimation } from '@axis-ds/tokens/tailwind';
      console.log(JSON.stringify({ keys: Object.keys(p), kf: Object.keys(axisKeyframes), anim: Object.keys(axisAnimation) }));
    `], { cwd: fixed.consumer, encoding: 'utf-8' });
    assert.equal(r.status, 0, r.stderr);
    const got = JSON.parse(r.stdout.trim());
    assert.deepEqual(got.keys, ['darkMode', 'theme']);
    assert.deepEqual(got.kf, PRESET_KEYFRAMES);
    assert.deepEqual(got.anim, PRESET_KEYFRAMES);
  });

  test('후처리는 다시 실행해도 한 번만 붙는다', () => {
    const second = patchCjsPreset(join(fixed.copy, 'dist'));
    assert.equal(second.patched, false);
    const js = readFileSync(join(fixed.copy, 'dist', 'tailwind-preset.js'), 'utf-8');
    assert.equal(js.split(CJS_MARKER).length - 1, 1);
  });

  test('build 스크립트: tsup 다음에 CommonJS 후처리가 돈다 (사본 빌드가 이 순서를 따름)', () => {
    assert.ok(TSUP_STEP >= 0, BUILD_STEPS.join(' && '));
    assert.ok(CJS_STEP > TSUP_STEP, `node scripts/cjs-preset.mjs 가 tsup 뒤에 없어요: ${BUILD_STEPS.join(' && ')}`);
  });

  for (const e of DIST_ENTRIES) {
    test(`dist ${e.label}: borderColor.DEFAULT 와 TW3 preflight border-color 가 preset 값이다 (WI-0083)`, () => {
      const got = probeDist(fixed.consumer, e.kind);
      assert.equal(got.file, e.file, JSON.stringify(got));
      assert.equal(got.borderDefault, EXPECTED_BORDER, JSON.stringify(got));
      assert.deepEqual(got.preflight, [EXPECTED_BORDER], JSON.stringify(got));
    });

    test(`dist ${e.label}: border-red-500 가 남고 소비자 theme.extend 가 이긴다 (preflight 만으로는 우선순위 회귀를 못 잡음, WI-0083)`, () => {
      const got = probeDist(fixed.consumer, e.kind);
      assert.equal(got.red, 1, `기본 팔레트 테두리 유틸리티가 없어요: ${JSON.stringify(got)}`);
      assert.equal(got.consumerDefault, CONSUMER_BORDER, JSON.stringify(got));
      assert.deepEqual(got.consumerPreflight, [CONSUMER_BORDER], JSON.stringify(got));
    });
  }

  test('음성 대조군: 후처리 전 산출물의 require(.js) 는 preset 이 빠져 preflight 가 gray-200 이고, .mjs · .default 는 그대로다', () => {
    const got = Object.fromEntries(DIST_ENTRIES.map((e) => [e.kind, probeDist(unpatched.consumer, e.kind)]));
    assert.equal(got.cjs.borderDefault, '#e5e7eb', JSON.stringify(got.cjs));
    assert.deepEqual(got.cjs.preflight, ['#e5e7eb'], JSON.stringify(got.cjs));
    for (const k of ['esm', 'cjs-default']) {
      assert.equal(got[k].borderDefault, EXPECTED_BORDER, JSON.stringify(got[k]));
      assert.deepEqual(got[k].preflight, [EXPECTED_BORDER], JSON.stringify(got[k]));
    }
  });

  test('타입: require(.cts) 는 export = 형식(d.cts), import(.mts) 는 d.mts 로 해석된다', () => {
    const dir = join(fixed.consumer, 'types');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'cjs.cts'), [
      "import preset = require('@axis-ds/tokens/tailwind')",
      "export const a: string = preset.axisKeyframes['accordion-down'].from.height",
      "export const b: string = preset.axisAnimation['progress-indeterminate']",
      'export const c = preset.default.theme',
      'export const d = preset.theme',
      '',
    ].join('\n'));
    writeFileSync(join(dir, 'esm.mts'), [
      "import preset, { axisKeyframes } from '@axis-ds/tokens/tailwind'",
      "export const a: string = axisKeyframes['accordion-up'].to.height",
      'export const c = preset.theme',
      '',
    ].join('\n'));
    writeFileSync(join(dir, 'bad.cts'), [
      "import preset = require('@axis-ds/tokens/tailwind')",
      '// @ts-expect-error 없는 keyframes 이름(타입이 any 로 무너지면 이 줄이 오류가 된다)',
      "export const x = preset.axisKeyframes['nope']",
      '',
    ].join('\n'));
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { module: 'node16', moduleResolution: 'node16', target: 'es2022', strict: true, noEmit: true, skipLibCheck: false, types: [] },
      files: ['cjs.cts', 'esm.mts', 'bad.cts'],
    }));
    const r = spawnSync(process.execPath, [tscCli, '-p', 'tsconfig.json', '--explainFiles'], { cwd: dir, encoding: 'utf-8' });
    assert.equal(r.status, 0, (r.stdout + r.stderr).split('\n').filter((l) => /error TS/.test(l)).join('\n'));
    assert.match(r.stdout, /tailwind-preset\.d\.cts\n\s+Imported via '@axis-ds\/tokens\/tailwind' from file 'cjs\.cts'/);
    assert.match(r.stdout, /tailwind-preset\.d\.mts\n\s+Imported via '@axis-ds\/tokens\/tailwind' from file 'esm\.mts'/);
  });
});
