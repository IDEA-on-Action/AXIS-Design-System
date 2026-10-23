/**
 * 소비자 타입 해석 게이트 (WI-0053 FR-3)
 *
 * 설치된 @axis-ds 패키지의 exports 중 `types` 조건이 있는 항목(루트 포함)과 `.json` 항목을
 * moduleResolution 네 가지(node · node16 CJS · node16 ESM · bundler)로 tsc 해 봅니다.
 * node(node10)는 Next 15 가 tsconfig 를 만들 때 쓰는 값이고 exports 를 읽지 않으므로 typesVersions 가
 * 없으면 서브패스가 TS2307 로 실패합니다(1.5.0 배포본: 52건).
 *
 * 판정(항목 × 방식마다)
 *   - 탐침 파일에 tsc 오류가 0 이고
 *   - `--explainFiles` 에서 그 탐침의 import 가 exports 가 가리키는 바로 그 파일(types 타깃 또는 .json)로 해석됨
 * 「오류 0」만으로는 부족합니다. strict 가 꺼져 있으면 타입 없이 JS 로 해석돼도 오류가 나지 않기 때문입니다.
 * 컴파일 옵션은 Next 가 만드는 값(skipLibCheck · strict false · resolveJsonModule 등)을 따릅니다.
 *
 * 변형 타입 탐침(WI-0059): ui-react 가 대상이면 방식마다 `variants<ext>` 를 함께 컴파일합니다. 없는 변형 값
 * (`variant: 'nope'` 등)에 `@ts-expect-error` 를 붙여 두므로, 변형 타입이 any 로 무너지면(예: d.ts 의
 * `class-variance-authority/types` 미해석) 「쓰이지 않은 @ts-expect-error」(TS2578)로 실패합니다. 올바른 값은
 * 오류가 없어야 합니다(양성 대조).
 *
 * 반환: { modes, targets, rows, failures, measureErrors }
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { spawnSync } from 'node:child_process';

export const RESOLUTION_MODES = {
  // Next 15.5.28 writeConfigurationDefaults 의 moduleResolution 값
  node: { ext: '.ts', module: 'esnext', moduleResolution: 'node' },
  'node16-cjs': { ext: '.cts', module: 'node16', moduleResolution: 'node16' },
  'node16-esm': { ext: '.mts', module: 'node16', moduleResolution: 'node16' },
  // create-next-app@15.5.28 템플릿 값
  bundler: { ext: '.ts', module: 'esnext', moduleResolution: 'bundler' },
};

/** 설치된 패키지 package.json 에서 탐침 대상을 모은다 */
export function collectTargets(consumer, packageNames) {
  const targets = [];
  for (const name of packageNames) {
    const pj = JSON.parse(readFileSync(join(consumer, 'node_modules', name, 'package.json'), 'utf8'));
    const exp = pj.exports && typeof pj.exports === 'object' ? pj.exports : {};
    for (const [key, val] of Object.entries(exp)) {
      const spec = key === '.' ? name : `${name}/${key.slice(2)}`;
      let file = null;
      let kind = null;
      if (val && typeof val === 'object' && typeof val.types === 'string') { file = val.types; kind = 'ts'; }
      else if (typeof val === 'string' && val.endsWith('.json')) { file = val; kind = 'json'; }
      if (!file) continue;
      targets.push({ name, spec, kind, root: key === '.', expected: posix.join('node_modules', name, file) });
    }
  }
  return targets;
}

/** explainFiles 출력에서 "탐침 파일 → 해석된 파일" 을 뽑는다 */
export function parseExplain(out) {
  const resolved = new Map(); // `${probeFile}\0${spec}` -> 해석된 파일(경로 그대로)
  let current = null;
  for (const line of out.split('\n')) {
    if (!line) continue;
    if (!/^\s/.test(line)) { current = line.trim(); continue; }
    const m = line.match(/Imported via '([^']+)' from file '([^']+)'/);
    if (m && current) resolved.set(`${posix.basename(m[2])}\0${m[1]}`, current);
  }
  return resolved;
}

/**
 * @param {{ consumer: string, tsc: string, packages: string[] }} opts
 */
/** 변형 타입 탐침 본문. 없는 값 3곳은 오류가 나야 하고(@ts-expect-error), 올바른 값은 통과해야 한다 */
export const VARIANT_PROBE = [
  "import type { ButtonProps } from '@axis-ds/ui-react';",
  "import type { BadgeProps } from '@axis-ds/ui-react/badge';",
  "import { buttonVariants } from '@axis-ds/ui-react/button';",
  "export const ok: ButtonProps = { variant: 'secondary', size: 'sm' };",
  "export const okClass: string = buttonVariants({ variant: 'ghost', className: 'x' });",
  '// @ts-expect-error 없는 변형 값',
  "export const bad1: ButtonProps = { variant: 'nope' };",
  '// @ts-expect-error 없는 변형 값',
  "export const bad2: BadgeProps = { variant: 'nope' };",
  '// @ts-expect-error 없는 변형 값',
  "export const bad3: string = buttonVariants({ size: 'huge' });",
  '',
].join('\n');

export function runTypesResolutionGate({ consumer, tsc, packages }) {
  const targets = collectTargets(consumer, packages);
  const rows = [];
  const failures = [];
  const measureErrors = [];
  if (targets.length === 0) {
    measureErrors.push('탐침 대상 0개(exports 를 읽지 못함)');
    return { modes: Object.keys(RESOLUTION_MODES), targets, rows, failures, measureErrors };
  }
  const base = join(consumer, 'types-probe');
  rmSync(base, { recursive: true, force: true });
  for (const [mode, cfg] of Object.entries(RESOLUTION_MODES)) {
    const dir = join(base, mode);
    mkdirSync(dir, { recursive: true });
    const files = targets.map((t, i) => {
      const f = `p${String(i).padStart(3, '0')}${cfg.ext}`;
      const body = t.kind === 'json'
        ? `import data from '${t.spec}';\nexport const v = data;\n`
        : `import * as m from '${t.spec}';\nexport { m };\n`;
      writeFileSync(join(dir, f), body);
      return f;
    });
    const variantFile = packages.includes('@axis-ds/ui-react') ? `variants${cfg.ext}` : null;
    if (variantFile) writeFileSync(join(dir, variantFile), VARIANT_PROBE);
    writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], allowJs: true, skipLibCheck: true,
        strict: false, noEmit: true, esModuleInterop: true, resolveJsonModule: true, isolatedModules: true,
        jsx: 'preserve', types: [], module: cfg.module, moduleResolution: cfg.moduleResolution,
      },
      files: variantFile ? [...files, variantFile] : files,
    }));
    const r = spawnSync(process.execPath, [tsc, '-p', 'tsconfig.json', '--pretty', 'false', '--explainFiles'], {
      cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 300000,
    });
    if (r.status === null) { measureErrors.push(`${mode}: tsc 미종료(signal=${r.signal})`); continue; }
    const out = `${r.stdout}${r.stderr}`;
    const errLines = out.split('\n').filter((l) => /error TS\d+/.test(l));
    const resolved = parseExplain(out);
    // 해석 결과를 하나도 못 읽었으면 출력 형식이 바뀐 것(측정 실패). 0 통과 방지
    if (resolved.size === 0) { measureErrors.push(`${mode}: explainFiles 에서 해석 결과 0건(rc=${r.status})`); continue; }
    const probeErrs = new Set();
    targets.forEach((t, i) => {
      const f = files[i];
      const errs = errLines.filter((l) => l.startsWith(`${f}(`));
      const got = resolved.get(`${f}\0${t.spec}`) ?? null;
      // 경로는 cwd(dir) 기준 상대 경로라 node_modules/... 꼬리로 비교한다
      const ok = errs.length === 0 && got !== null && got.replace(/\\/g, '/').endsWith(t.expected.replace(/^\.\//, '').replace('/./', '/'));
      if (errs.length) probeErrs.add(f);
      rows.push({ mode, spec: t.spec, kind: t.kind, root: t.root, ok, got, errors: errs.map((e) => (e.match(/TS\d+/) || [''])[0]) });
      if (!ok) failures.push(`${mode} ${t.spec}: ${errs.length ? errs.map((e) => e.replace(/^\S+\(\d+,\d+\): /, '')).join(' | ') : `해석 파일 ${got ?? '없음'} != ${t.expected}`}`);
    });
    if (variantFile) {
      const verrs = errLines.filter((l) => l.startsWith(`${variantFile}(`));
      rows.push({ mode, spec: 'variants', kind: 'variant', root: false, ok: verrs.length === 0, got: null, errors: verrs.map((e) => (e.match(/TS\d+/) || [''])[0]) });
      if (verrs.length) failures.push(`${mode} 변형 타입: ${verrs.map((e) => e.replace(/^\S+\(\d+,\d+\): /, '')).join(' | ')}`);
    }
    // 탐침 밖 오류(설정 문제 등)는 skipLibCheck 로 라이브러리 오류가 빠지므로 원래 0 이어야 한다
    const known = variantFile ? [...files, variantFile] : files;
    const outside = errLines.filter((l) => !known.some((f) => l.startsWith(`${f}(`)));
    if (outside.length) measureErrors.push(`${mode}: 탐침 밖 오류 ${outside.length}건 ${outside[0]}`);
  }
  return { modes: Object.keys(RESOLUTION_MODES), targets, rows, failures, measureErrors };
}

/** 패키지 × 방식별 실패 수 요약 문자열 */
export function summarize(result) {
  const lines = [];
  const names = [...new Set(result.targets.map((t) => t.name))];
  for (const name of names) {
    const ts = result.targets.filter((t) => t.name === name);
    const cells = result.modes.map((m) => {
      const rs = result.rows.filter((r) => r.mode === m && ts.some((t) => t.spec === r.spec));
      return `${m} ${rs.filter((r) => !r.ok).length}/${rs.length}`;
    });
    lines.push(`${name}: 대상 ${ts.length}개(루트 ${ts.filter((t) => t.root).length} · TS 서브패스 ${ts.filter((t) => !t.root && t.kind === 'ts').length} · JSON ${ts.filter((t) => t.kind === 'json').length}) 실패 ${cells.join(', ')}`);
  }
  const vrows = result.rows.filter((r) => r.kind === 'variant');
  if (vrows.length) {
    lines.push(`변형 타입 탐침(ui-react): ${vrows.map((r) => `${r.mode} ${r.ok ? '통과' : `실패(${r.errors.join(',')})`}`).join(', ')}`);
  }
  return lines;
}
