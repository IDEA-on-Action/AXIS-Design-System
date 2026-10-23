/**
 * d.ts 후처리: class-variance-authority/types 참조 제거 (WI-0059)
 *
 * tsup 의 d.ts 생성은 `cva(...)` 로 만든 `*Variants` 의 추론 타입을 펼치면서
 * `import * as class_variance_authority_types from 'class-variance-authority/types'` 를 넣습니다.
 * cva 0.7.1 은 `./types` 를 exports 로만 내보내고 typesVersions 가 없어서, moduleResolution node(node10,
 * Next 15 가 tsconfig 를 만들 때 쓰는 값)에서는 이 경로가 풀리지 않습니다. skipLibCheck(Next 기본)라 오류는
 * 안 나지만 `{ variant?: ... } & any` 가 any 로 무너져 variant · size 같은 변형 prop 의 타입 검사가 꺼집니다.
 *
 * 이 스크립트는 그 import 를 지우고 `class_variance_authority_types.ClassProp` 를 같은 모양의 로컬 타입으로
 * 바꿉니다. ClassValue 는 cva 와 같이 clsx 루트(ui-react 의 dependencies)에서 가져오므로 node10 에서도 풀립니다.
 * 로컬 타입이 cva 의 ClassProp 과 같은지는 scripts/fix-cva-dts.test.mjs 가 tsc 로 확인합니다.
 *
 * 사용: node scripts/fix-cva-dts.mjs          dist 의 d.ts 를 고침(남은 참조가 있으면 exit 1)
 *       node scripts/fix-cva-dts.mjs --check  고치지 않고 남은 참조만 검사(있으면 exit 1)
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

export const CVA_TYPES_SPEC = "class-variance-authority/types";
const NAMESPACE = "class_variance_authority_types";
const IMPORT_RE = /^import \* as class_variance_authority_types from ['"]class-variance-authority\/types['"];\r?\n/m;
// tsup 이 다른 모듈의 타입을 다시 내보낼 때 남기는 부수효과 import. 타입에는 쓰이지 않으므로 지웁니다
const BARE_IMPORT_RE = /^import ['"]class-variance-authority\/types['"];\r?\n/gm;
const LOCAL = "__AxisCvaClassProp";

/** cva 0.7.1 dist/types.d.ts 의 ClassProp 과 같은 모양(ClassValue 는 clsx 루트) */
export const LOCAL_CLASSPROP_DECL =
  `import type * as __AxisClsx from 'clsx';\n` +
  `type ${LOCAL} = { class: __AxisClsx.ClassValue; className?: never } | ` +
  `{ class?: never; className: __AxisClsx.ClassValue } | { class?: never; className?: never };\n`;

/**
 * d.ts 한 파일을 고칩니다.
 * @returns {{ text: string, changed: boolean, problems: string[] }}
 */
export function fixDts(text) {
  const problems = [];
  if (!text.includes(CVA_TYPES_SPEC)) return { text, changed: false, problems };
  let out = text.replace(BARE_IMPORT_RE, "");
  if (IMPORT_RE.test(out)) {
    out = out.replace(IMPORT_RE, LOCAL_CLASSPROP_DECL);
    out = out.split(`${NAMESPACE}.ClassProp`).join(LOCAL);
  }
  // 예상한 두 모양(이름공간 import · 부수효과 import) 밖의 참조나 ClassProp 밖 멤버는 대응 표가 없으므로
  // 고치지 않고 알립니다(tsup · TypeScript 출력이 바뀐 것)
  if (out.includes(CVA_TYPES_SPEC) || out.includes(`${NAMESPACE}.`)) {
    problems.push(`'${CVA_TYPES_SPEC}' 참조가 예상한 import 형태가 아님(고친 뒤에도 남음)`);
    return { text, changed: false, problems };
  }
  return { text: out, changed: true, problems };
}

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.d\.(m|c)?ts$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** dist 의 d.ts 전체를 고치거나(check=false) 검사합니다 */
export function run(distDir, { check = false } = {}) {
  const files = walk(distDir);
  const changed = [];
  const problems = [];
  for (const f of files) {
    const before = readFileSync(f, "utf8");
    const rel = relative(distDir, f);
    if (check) {
      if (before.includes(CVA_TYPES_SPEC)) problems.push(`${rel}: '${CVA_TYPES_SPEC}' 참조가 남음`);
      continue;
    }
    const r = fixDts(before);
    for (const p of r.problems) problems.push(`${rel}: ${p}`);
    if (r.changed && r.problems.length === 0) {
      writeFileSync(f, r.text);
      changed.push(rel);
    }
  }
  return { files: files.length, changed, problems };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes("--check");
  const distDir = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
  if (!existsSync(distDir)) {
    console.error("[fix-cva-dts] dist/ 없음 - 먼저 tsup 을 실행하세요");
    process.exit(2);
  }
  const r = run(distDir, { check });
  // d.ts 를 하나도 못 찾았으면 측정 실패(0 통과 방지)
  if (r.files === 0) {
    console.error("[fix-cva-dts] dist 에서 d.ts 0개");
    process.exit(2);
  }
  for (const p of r.problems) console.error(`[fix-cva-dts] ${p}`);
  console.log(
    check
      ? `[fix-cva-dts] 검사 d.ts ${r.files}개, 남은 참조 ${r.problems.length}건`
      : `[fix-cva-dts] d.ts ${r.files}개 중 ${r.changed.length}개 고침`
  );
  process.exit(r.problems.length ? 1 : 0);
}
