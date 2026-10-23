/**
 * fix-cva-dts 테스트 (WI-0059)
 *
 * 1. 변환: tsup 이 내는 모양의 d.ts 에서 cva/types import 를 지우고 ClassProp 을 로컬 타입으로 바꾸는지
 * 2. 실패: 예상 밖 모양 · ClassProp 밖 멤버는 고치지 않고 문제로 알리는지
 * 3. 동치: 로컬 타입이 설치된 cva 의 ClassProp 과 서로 대입 가능한지(tsc). cva 를 올려 모양이 바뀌면 여기서 실패
 * 4. 산출물: dist 가 있으면 남은 참조가 0 인지(빌드에 후처리가 붙어 있는지)
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { CVA_TYPES_SPEC, LOCAL_CLASSPROP_DECL, fixDts, run } from "./fix-cva-dts.mjs";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(pkgRoot, "package.json"));

const SAMPLE = `import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const buttonVariants: (props?: ({
    variant?: "default" | "ghost" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const other: (props?: ({ size?: "sm" | null | undefined } & class_variance_authority_types.ClassProp) | undefined) => string;

export { buttonVariants, other };
`;

test("변환: import 를 지우고 ClassProp 을 로컬 타입으로 바꾼다", () => {
  const r = fixDts(SAMPLE);
  assert.equal(r.changed, true);
  assert.deepEqual(r.problems, []);
  assert.equal(r.text.includes(CVA_TYPES_SPEC), false);
  assert.equal(r.text.includes("class_variance_authority_types"), false);
  assert.equal(r.text.split("__AxisCvaClassProp").length - 1, 3); // 선언 1 + 사용 2
  assert.ok(r.text.startsWith(LOCAL_CLASSPROP_DECL));
  // 다른 import 와 본문은 그대로
  assert.ok(r.text.includes("import { VariantProps } from 'class-variance-authority';"));
  assert.ok(r.text.includes('variant?: "default" | "ghost" | null | undefined;'));
});

test("변환: 부수효과 import 만 있는 파일은 그 줄만 지운다", () => {
  const bare = "import { VariantProps } from 'class-variance-authority';\nimport 'class-variance-authority/types';\nexport {};\n";
  const r = fixDts(bare);
  assert.equal(r.changed, true);
  assert.deepEqual(r.problems, []);
  assert.equal(r.text, "import { VariantProps } from 'class-variance-authority';\nexport {};\n");
});

test("변환: 참조가 없으면 그대로 둔다", () => {
  const plain = "import * as React from 'react';\nexport {};\n";
  const r = fixDts(plain);
  assert.equal(r.changed, false);
  assert.equal(r.text, plain);
});

test("실패: 예상 밖 import 모양은 고치지 않고 알린다", () => {
  const odd = `import { ClassProp } from 'class-variance-authority/types';\nexport type X = ClassProp;\n`;
  const r = fixDts(odd);
  assert.equal(r.changed, false);
  assert.equal(r.problems.length, 1);
});

test("실패: ClassProp 밖 멤버가 남으면 알린다", () => {
  const extra = SAMPLE.replace("export {", "type Y = class_variance_authority_types.ClassValue;\nexport {");
  const r = fixDts(extra);
  assert.equal(r.problems.length, 1);
});

test("동치: 로컬 ClassProp 이 설치된 cva 의 ClassProp 과 서로 대입 가능(tsc)", () => {
  const tsc = require.resolve("typescript/bin/tsc");
  const dir = mkdtempSync(join(pkgRoot, ".tmp-cva-"));
  try {
    writeFileSync(
      join(dir, "eq.ts"),
      `import type { ClassProp } from 'class-variance-authority/types';\n` +
        LOCAL_CLASSPROP_DECL +
        `type Eq<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;\n` +
        `export const same: Eq<ClassProp, __AxisCvaClassProp> = true;\n` +
        // 음성 대조: 다른 모양이면 false 여야 한다(비교식 자체가 동작하는지)
        `export const diff: Eq<ClassProp, { class?: string }> = false;\n`
    );
    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { strict: true, noEmit: true, module: "esnext", moduleResolution: "bundler", skipLibCheck: false, types: [] },
        files: ["eq.ts"],
      })
    );
    const r = spawnSync(process.execPath, [tsc, "-p", join(dir, "tsconfig.json"), "--pretty", "false"], { encoding: "utf8" });
    assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("산출물: dist 가 있으면 남은 cva/types 참조가 0", (t) => {
  const dist = join(pkgRoot, "dist");
  if (!existsSync(dist)) return t.skip("dist 없음(빌드 전)");
  const r = run(dist, { check: true });
  assert.ok(r.files > 0, "d.ts 0개");
  assert.deepEqual(r.problems, []);
});
