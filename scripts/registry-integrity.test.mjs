/**
 * 레지스트리 정규화 · G1 검사 테스트 (WI-0045 FR-1 · FR-7)
 *
 * 실행: node --test scripts/registry-integrity.test.mjs
 * 먼저 pnpm build:registry 로 apps/web/public/r 를 만들어 두어야 합니다(없으면 측정 실패로 실패).
 * 음성 대조: 생성된 사본에서 의존 하나를 지운 변이 · 상대 import 를 되살린 변이가 G1 에서 실패해야 합니다.
 */

import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import {
  checkRegistryDir,
  scanImports,
  classifySpecifier,
  itemSha256,
  hasUseClientDirective,
  registryPublicUrl,
  registryDependencyName,
  normalizePublicUrl,
  redactPublicUrl,
  DEFAULT_REGISTRY_PUBLIC_URL,
} from "./registry-integrity.mjs";
import { emptyInterfaceToType, rewriteImports, staleRegistryFiles } from "./build-registry.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REG = path.join(ROOT, "apps/web/public/r");

/** 이 실행이 만든 임시 디렉터리. 끝나면 모두 지웁니다(로컬에 쌓이지 않게) */
const tmpDirs = [];
after(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});
function makeTmpDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "axis-reg-"));
  tmpDirs.push(dir);
  return dir;
}

function copyRegistry() {
  const dir = makeTmpDir();
  for (const f of fs.readdirSync(REG)) fs.copyFileSync(path.join(REG, f), path.join(dir, f));
  return dir;
}
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
/** 테스트가 쓰는 공개 URL(build-registry 와 같은 값, D5) */
const PUBLIC_URL = registryPublicUrl();
const depUrl = (name) => `${PUBLIC_URL}/${name}.json`;
const writeJson = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2));

test("양성: 생성된 레지스트리는 G1 을 통과하고 항목을 실제로 검사함", () => {
  const r = checkRegistryDir(REG);
  assert.equal(r.measured, true);
  assert.deepEqual(r.errors, []);
  assert.ok(r.checkedItems >= 30, `검사 항목 ${r.checkedItems}`);
});

test("음성: dependencies 하나를 지우면 G1 실패", () => {
  const dir = copyRegistry();
  const p = path.join(dir, "button.json");
  const item = readJson(p);
  item.dependencies = item.dependencies.filter((d) => d !== "@radix-ui/react-slot");
  writeJson(p, item);
  const r = checkRegistryDir(dir);
  assert.equal(r.measured, true);
  assert.ok(r.errors.some((e) => e.includes("button") && e.includes("@radix-ui/react-slot")), r.errors.join("\n"));
});

test("음성: registryDependencies 하나를 지우면 G1 실패", () => {
  const dir = copyRegistry();
  const p = path.join(dir, "agentic-run-progress.json");
  const item = readJson(p);
  item.registryDependencies = item.registryDependencies.filter((d) => d !== depUrl("agentic-a11y-labels"));
  assert.equal(item.registryDependencies.length, 1, "지울 대상이 실제로 있었는지(대조)");
  writeJson(p, item);
  const r = checkRegistryDir(dir);
  assert.ok(r.errors.some((e) => e.includes("agentic-run-progress") && e.includes("agentic-a11y-labels")), r.errors.join("\n"));
});

test("음성: 상대 import 가 남거나 쓰지 않는 의존을 선언하면 G1 실패", () => {
  const dir = copyRegistry();
  const p = path.join(dir, "card.json");
  const item = readJson(p);
  item.files[0].content = item.files[0].content.replace("@/registry/axis/lib/utils", "../utils");
  item.dependencies = ["framer-motion"];
  writeJson(p, item);
  // sha 도 맞춰 두어 sha 불일치가 아니라 import 위반으로 실패하는지 봅니다
  const index = readJson(path.join(dir, "index.json"));
  index.items.find((i) => i.name === "card").sha256 = itemSha256(item);
  writeJson(path.join(dir, "index.json"), index);
  const r = checkRegistryDir(dir);
  assert.ok(r.errors.some((e) => e.includes("상대") && e.includes("../utils")), r.errors.join("\n"));
  assert.ok(r.errors.some((e) => e.includes("framer-motion")), r.errors.join("\n"));
});

test("음성: content 를 바꾸고 sha256 을 그대로 두면 G1 실패", () => {
  const dir = copyRegistry();
  const p = path.join(dir, "badge.json");
  const item = readJson(p);
  item.files[0].content += "\n// 변조\n";
  writeJson(p, item);
  const r = checkRegistryDir(dir);
  assert.ok(r.errors.some((e) => e.includes("badge") && e.includes("sha256")), r.errors.join("\n"));
});

test("음성: 정규화가 문법을 깨면 G1 실패(extends 둘을 type 으로 잘못 바꾼 경우)", () => {
  const dir = copyRegistry();
  const p = path.join(dir, "badge.json");
  const item = readJson(p);
  item.files[0].content += "\nexport type Broken = A, B;\n";
  writeJson(p, item);
  const index = readJson(path.join(dir, "index.json"));
  index.items.find((i) => i.name === "badge").sha256 = itemSha256(item);
  writeJson(path.join(dir, "index.json"), index);
  const r = checkRegistryDir(dir);
  assert.ok(r.errors.some((e) => e.includes("badge") && e.includes("문법")), r.errors.join("\n"));
});

for (const [label, line, expect] of [
  ["typeof import 의 미선언 패키지", 'export type Z = typeof import("zod");', "zod"],
  ["import(\"x\").T 의 워크스페이스 의존", 'export type Q = import("@axis-ds/ui-react").ButtonProps;', "@axis-ds/ui-react"],
]) {
  test(`음성: 타입 위치 import(${label})도 G1 이 잡음`, () => {
    const dir = copyRegistry();
    const p = path.join(dir, "badge.json");
    const item = readJson(p);
    item.files[0].content += `\n${line}\n`;
    writeJson(p, item);
    // sha 를 맞춰 sha 불일치가 아니라 import 위반으로 실패하는지 봅니다
    const index = readJson(path.join(dir, "index.json"));
    index.items.find((i) => i.name === "badge").sha256 = itemSha256(item);
    writeJson(path.join(dir, "index.json"), index);
    const r = checkRegistryDir(dir);
    assert.ok(r.errors.some((e) => e.includes("badge") && e.includes(expect)), r.errors.join("\n"));
  });
}

/**
 * 사본의 badge content 에 줄을 붙이고 sha 를 맞춥니다(sha 불일치가 아니라 import 위반으로 실패하는지 보려고).
 * `///` 지시문은 파일 맨 앞에서만 지시문이라 prepend 로 앞에 붙입니다
 */
function appendToBadge(dir, line, prepend = false) {
  const p = path.join(dir, "badge.json");
  const item = readJson(p);
  item.files[0].content = prepend ? `${line}\n${item.files[0].content}` : `${item.files[0].content}\n${line}\n`;
  writeJson(p, item);
  const index = readJson(path.join(dir, "index.json"));
  index.items.find((i) => i.name === "badge").sha256 = itemSha256(item);
  writeJson(path.join(dir, "index.json"), index);
  // registry.json 도 index 와 같게 맞춰 그 검사가 아니라 import 위반으로 실패하는지 봅니다
  const reg = readJson(path.join(dir, "registry.json"));
  reg.items = index.items;
  writeJson(path.join(dir, "registry.json"), reg);
}

for (const [label, line, expect, prepend] of [
  ["동적 import 의 미선언 패키지", 'export const load = () => import("dyn-pkg");', "dyn-pkg"],
  ["export * from 재내보내기", 'export * from "reexp-star";', "reexp-star"],
  ["export { x } from 재내보내기", 'export { x } from "reexp-named";', "reexp-named"],
  ["export type { T } from 재내보내기", 'export type { T } from "reexp-type";', "reexp-type"],
  ["require 호출", 'export const r = require("cjs-pkg");', "cjs-pkg"],
  ["reference types 지시문", '/// <reference types="ref-types" />', "ref-types", true],
  ["reference path 지시문", '/// <reference path="./ref-path.d.ts" />', "ref-path", true],
]) {
  test(`음성: ${label}를 G1 이 잡음`, () => {
    const dir = copyRegistry();
    // 양성 대조: 손대기 전 사본은 통과
    assert.deepEqual(checkRegistryDir(dir).errors, []);
    appendToBadge(dir, line, prepend);
    const r = checkRegistryDir(dir);
    assert.ok(r.errors.some((e) => e.includes("badge") && e.includes(expect)), r.errors.join("\n"));
  });
}

test("음성: registry.json items 가 index.json 과 다르면 G1 실패", () => {
  const dir = copyRegistry();
  const p = path.join(dir, "registry.json");
  const reg = readJson(p);
  reg.items = reg.items.slice(1);
  writeJson(p, reg);
  const r = checkRegistryDir(dir);
  assert.ok(r.errors.some((e) => e.includes("registry.json") && e.includes("index.json")), r.errors.join("\n"));
});

test("음성: index.json 에 없는 낡은 항목 파일이 있으면 G1 실패", () => {
  const dir = copyRegistry();
  fs.copyFileSync(path.join(dir, "button.json"), path.join(dir, "zzz.json"));
  const r = checkRegistryDir(dir);
  assert.ok(r.errors.some((e) => e.includes("zzz.json") && e.includes("index.json 에 없는")), r.errors.join("\n"));
});

test("음성: index.json version 이 없으면 G1 실패", () => {
  const dir = copyRegistry();
  const p = path.join(dir, "index.json");
  const index = readJson(p);
  delete index.version;
  writeJson(p, index);
  // registry.json 도 같게 맞춰 「registry.json 과 다름」이 아니라 version 검사로 실패하는지 봅니다
  const reg = readJson(path.join(dir, "registry.json"));
  delete reg.version;
  writeJson(path.join(dir, "registry.json"), reg);
  const r = checkRegistryDir(dir);
  assert.ok(r.errors.some((e) => e.startsWith("index.json version")), r.errors.join("\n"));
  assert.ok(!r.errors.some((e) => e.startsWith("registry.json")), r.errors.join("\n"));
});

test("음성: registryDependencies 에 쓰지 않는 항목을 넣으면 G1 실패", () => {
  const dir = copyRegistry();
  const p = path.join(dir, "button.json");
  const item = readJson(p);
  item.registryDependencies = [...item.registryDependencies, depUrl("agentic-a11y-labels")];
  writeJson(p, item);
  const r = checkRegistryDir(dir);
  assert.ok(
    r.errors.some((e) => e.includes("button") && e.includes("agentic-a11y-labels") && e.includes("import 하지 않음")),
    r.errors.join("\n")
  );
});

test("scanImports: 주석 · 문자열 안의 지정자는 건너뜀(대조: 코드의 같은 형태는 찾음)", () => {
  const src = [
    '// import x from "comment-pkg";',
    'const s = "import y from \'string-pkg\'";',
    'const t = `export * from "tmpl-pkg"`;',
    'import z from "code-pkg";',
  ].join("\n");
  assert.deepEqual(scanImports(src, "a.ts").map((f) => f.specifier), ["code-pkg"]);
});

test("scanImports: 타입 위치 import 를 찾고 위치가 문자열 리터럴을 가리킴", () => {
  const src = 'type A = typeof import("zod");\ntype B = import("x/y").T;\n';
  const found = scanImports(src, "a.ts");
  assert.deepEqual(found.map((f) => f.specifier), ["zod", "x/y"]);
  for (const f of found) assert.equal(src.slice(f.start, f.end), JSON.stringify(f.specifier));
});

test('hasUseClientDirective: 주석 뒤 지시문도 찾고, 지시문이 아닌 위치의 문자열은 무시', () => {
  assert.equal(hasUseClientDirective('"use client";\nimport x from "y";\n'), true);
  assert.equal(hasUseClientDirective("/** 라이선스 */\n// 주석\n'use client';\nexport {};\n"), true);
  assert.equal(hasUseClientDirective('"use strict";\n"use client";\nexport {};\n'), true);
  assert.equal(hasUseClientDirective('import x from "y";\n"use client";\n'), false);
  assert.equal(hasUseClientDirective('const s = "use client";\n'), false);
  assert.equal(hasUseClientDirective("export {};\n"), false);
});

test("측정 실패: 디렉터리가 없으면 measured=false", () => {
  const r = checkRegistryDir(path.join(os.tmpdir(), "axis-reg-없는-경로"));
  assert.equal(r.measured, false);
});

test("정규화: 상대 import 와 cn 만 가져오는 @axis-ds/ui-react import 를 표준 형태로", () => {
  const libBySource = new Map([["/pkg/src/utils", "@/registry/axis/lib/utils"]]);
  const libByName = new Map([["utils", "@/registry/axis/lib/utils"]]);
  const src = [
    'import { cn } from "../utils";',
    'import { cn as c2 } from "@axis-ds/ui-react";',
    'import { cn as c3, Button } from "@axis-ds/ui-react";',
  ].join("\n");
  const out = rewriteImports(src, "x.tsx", "/pkg/src/button/index.tsx", libBySource, libByName);
  const specs = scanImports(out).map((i) => i.specifier);
  assert.deepEqual(specs, ["@/registry/axis/lib/utils", "@/registry/axis/lib/utils", "@axis-ds/ui-react"]);
});

test("분류: react 는 제외, 하위 경로는 패키지 이름으로, @axis-ds 는 위반", () => {
  const m = new Map();
  assert.equal(classifySpecifier("react", m).kind, "provided");
  assert.equal(classifySpecifier("react-dom/client", m).kind, "provided");
  assert.deepEqual(classifySpecifier("@radix-ui/react-slot", m), { kind: "package", name: "@radix-ui/react-slot" });
  assert.deepEqual(classifySpecifier("lodash/merge", m), { kind: "package", name: "lodash" });
  assert.equal(classifySpecifier("@axis-ds/ui-react", m).kind, "error");
  assert.equal(classifySpecifier("@/lib/utils", m).kind, "error");
});

test("빈 interface: extends 하나뿐인 빈 interface 만 type 으로, 멤버가 있으면 그대로", () => {
  assert.equal(
    emptyInterfaceToType("export interface A\n  extends B<typeof C.Root> {}"),
    "export type A = B<typeof C.Root>;"
  );
  const keep = "export interface D extends E { x: string }";
  assert.equal(emptyInterfaceToType(keep), keep);
  // extends 가 둘이면 type 으로 바꿀 수 없고(A, B 는 문법 오류) 규칙도 허용하므로 그대로
  const multi = "export interface F\n  extends G<H>,\n    VariantProps<typeof v> {}";
  assert.equal(emptyInterfaceToType(multi), multi);
});

test('"use client": client-modules.mjs 목록의 항목만 맨 앞에 지시문', async () => {
  const { CLIENT_MODULES } = await import("../packages/axis-agentic-ui/scripts/client-modules.mjs");
  const { CLIENT_MODULES: UI_CLIENT_MODULES } = await import("../packages/axis-ui-react/scripts/client-modules.mjs");
  const expected = new Set(CLIENT_MODULES.map((m) => `agentic-${m.path.replace(/\/index$/, "")}`));
  // ui-react 는 컴포넌트 일부만 레지스트리에 있다(WI-0069 에서 dialog 가 client 모듈이 됨).
  // 목록 중 `<이름>/index` 이면서 레지스트리 항목이 있는 것만 기대값에 넣는다(avatar · command · tooltip 은 항목 없음)
  const uiInRegistry = UI_CLIENT_MODULES.map((m) => m.path)
    .filter((p) => /^[a-z0-9-]+\/index$/.test(p))
    .map((p) => p.replace(/\/index$/, ""))
    .filter((name) => fs.existsSync(path.join(REG, `${name}.json`)));
  for (const name of uiInRegistry) expected.add(name);
  assert.ok(uiInRegistry.length > 0, "ui-react client 모듈 중 레지스트리 항목이 0개(dialog 가 있어야 함, 측정 실패)");
  const actual = new Set(
    fs
      .readdirSync(REG)
      .filter((f) => !["index.json", "registry.json"].includes(f))
      .filter((f) => readJson(path.join(REG, f)).files[0].content.startsWith('"use client";'))
      .map((f) => f.replace(/\.json$/, ""))
  );
  assert.ok(expected.size > 0);
  assert.deepEqual([...actual].sort(), [...expected].sort());
});

test("D5: 생성된 registryDependencies 는 모두 <공개 URL>/<이름>.json 형태이고 0건이 아님", () => {
  let count = 0;
  for (const f of fs.readdirSync(REG)) {
    if (["index.json", "registry.json"].includes(f)) continue;
    for (const dep of readJson(path.join(REG, f)).registryDependencies) {
      count++;
      assert.ok(dep.startsWith(`${PUBLIC_URL}/`) && dep.endsWith(".json"), `${f}: ${dep}`);
    }
  }
  assert.ok(count > 0, "registryDependencies 가 하나도 없음(측정 실패)");
});

/** agentic-run-progress 의 utils 의존을 바꾼 사본으로 G1 을 돌립니다 */
function checkWithUtilsDep(dep) {
  const dir = copyRegistry();
  const p = path.join(dir, "agentic-run-progress.json");
  const item = readJson(p);
  const before = item.registryDependencies.length;
  item.registryDependencies = item.registryDependencies.map((d) => (d === depUrl("utils") ? dep : d));
  assert.equal(item.registryDependencies.length, before);
  assert.ok(item.registryDependencies.includes(dep), "바꿀 대상(utils)이 실제로 있었는지(대조)");
  writeJson(p, item);
  return checkRegistryDir(dir);
}

for (const [label, dep] of [
  ["접두 없는 이름(D5 이전 형태)", "utils"],
  ["다른 호스트", "https://axis.minu.best/r/utils.json"],
  ["다른 확장자", `${PUBLIC_URL}/utils.js`],
  ["상대 경로", "./utils.json"],
  ["@ns 형태", "@axis/utils"],
  ["slug 위반 이름", `${PUBLIC_URL}/Utils.json`],
  ["하위 경로", `${PUBLIC_URL}/lib/utils.json`],
]) {
  test(`음성 D5: registryDependencies 가 ${label}이면 G1 실패`, () => {
    const r = checkWithUtilsDep(dep);
    assert.equal(r.measured, true);
    assert.ok(
      r.errors.some((e) => e.includes("agentic-run-progress") && e.includes(JSON.stringify(dep)) && e.includes("형태가 아님")),
      r.errors.join("\n")
    );
  });
}

test("음성 D5: 형태는 맞지만 레지스트리에 없는 이름이면 G1 실패", () => {
  const r = checkWithUtilsDep(depUrl("ghost"));
  assert.ok(r.errors.some((e) => e.includes("agentic-run-progress") && e.includes("ghost") && e.includes("레지스트리에 없음")), r.errors.join("\n"));
});

test("D5: 공개 URL 을 바꿔 검사하면 기본 URL 산출물은 실패(공개 URL 이 실제로 판정에 쓰임)", () => {
  const r = checkRegistryDir(REG, { publicUrl: "http://127.0.0.1:1/r" });
  assert.equal(r.measured, true);
  assert.ok(r.errors.some((e) => e.includes("형태가 아님")), r.errors.join("\n"));
});

test("p1: normalizePublicUrl 오류 문구는 userinfo · 쿼리 · 해시 값을 가림", () => {
  const cases = [
    ["https://u:s3cret@mirror.example/r", ["s3cret", "u:"]],
    ["https://mirror.example/r?token=s3cret", ["s3cret"]],
    ["https://mirror.example/r#s3cret", ["s3cret"]],
    ["https://u:s3cret@mirror.example/r?token=t0ken#h4sh", ["s3cret", "t0ken", "h4sh"]],
    ["https://mirror.example/a b/r?token=s3cret", ["s3cret"]],
    ["ftp://u:s3cret@x/r?token=t0ken", ["s3cret", "t0ken"]],
    ["notaurl?token=s3cret", ["s3cret"]],
  ];
  for (const [raw, secrets] of cases) {
    let message = "";
    try {
      normalizePublicUrl(raw);
    } catch (error) {
      message = error.message;
    }
    // 양성 대조: 실제로 거부돼 문구가 있어야 함(빈 문구면 검사 자체가 빗나감)
    assert.ok(message.length > 0, raw);
    for (const secret of secrets) assert.ok(!message.includes(secret), `${raw} -> ${message}`);
  }
  assert.equal(redactPublicUrl("https://mirror.example/r?token=a&b=c#frag"), "https://mirror.example/r?***#***");
  assert.equal(redactPublicUrl("https://u:p@h/r?x=1"), "https://***@h/r?***");
  assert.equal(redactPublicUrl("https://h/r#a?b"), "https://h/r#***");
  // 음성 대조: 가릴 것이 없으면 그대로
  assert.equal(redactPublicUrl("https://mirror.example:8443/a/r"), "https://mirror.example:8443/a/r");
  // 파서가 userinfo 를 못 읽는 형태(숫자 비밀번호 + ? · #)도 @ 앞까지 가림
  assert.equal(redactPublicUrl("https://admin:12345?x@host/r"), "https://***@host/r");
  assert.equal(redactPublicUrl("https://user:123#ss@host/r"), "https://***@host/r");
  assert.equal(redactPublicUrl("https://host/r/@scope/x"), "https://host/r/@scope/x");
});

test("D18 정합: 공개 URL 은 CLI normalizeRegistryBaseUrl 과 같은 정규화(소문자 · 기본 포트 제거 · 끝 / 제거)", () => {
  assert.equal(normalizePublicUrl("HTTPS://AXIS-design-system.pages.dev:443/r"), "https://axis-design-system.pages.dev/r");
  assert.equal(normalizePublicUrl("https://My-Host.example/r//"), "https://my-host.example/r");
  // 기본이 아닌 포트와 경로 대소문자는 그대로
  assert.equal(normalizePublicUrl("http://127.0.0.1:8080/R/"), "http://127.0.0.1:8080/R");
});

test("D5: 공개 URL 결정과 이름 풀이", () => {
  assert.equal(registryPublicUrl({}), DEFAULT_REGISTRY_PUBLIC_URL);
  assert.equal(registryPublicUrl({ AXIS_REGISTRY_PUBLIC_URL: "  " }), DEFAULT_REGISTRY_PUBLIC_URL);
  assert.equal(registryPublicUrl({ AXIS_REGISTRY_PUBLIC_URL: "http://127.0.0.1:8080/r/" }), "http://127.0.0.1:8080/r");
  assert.throws(() => normalizePublicUrl("ftp://x/r"));
  assert.throws(() => normalizePublicUrl("r"));
  // CLI registryDependencyName 과 같은 기준(D11): userinfo · 공백 · 쿼리 · 해시가 든 공개 URL 은 거부
  assert.throws(() => normalizePublicUrl("https://u:p@mirror.example/r"), /userinfo/);
  assert.throws(() => normalizePublicUrl("https://u@mirror.example/r"), /userinfo/);
  assert.throws(() => normalizePublicUrl("https://mirror.example/a b/r"), /공백/);
  assert.throws(() => normalizePublicUrl("https://mirror.example/r?"), /쿼리/);
  assert.throws(() => registryPublicUrl({ AXIS_REGISTRY_PUBLIC_URL: "https://u:p@mirror.example/r" }), /userinfo/);
  // 양성 대조: 포트 · 하위 경로가 있는 정상 URL 은 받음
  assert.equal(normalizePublicUrl("https://mirror.example:8443/a/r/"), "https://mirror.example:8443/a/r");
  assert.equal(registryDependencyName("https://h/r/agentic-a11y-labels.json", "https://h/r"), "agentic-a11y-labels");
  assert.equal(registryDependencyName("utils", "https://h/r"), null);
  assert.equal(registryDependencyName("https://h/r/.json", "https://h/r"), null);
});

test("D6: 빈 interface 를 type 으로 바꿀 때 바로 위 JSDoc 의 「인터페이스」도 「타입」으로", () => {
  const src = "/** X 의 Props 인터페이스. */\nexport interface XProps\n  extends A<B> {}\n/** 다른 인터페이스 설명 */\nexport interface Y { a: 1 }\n";
  const out = emptyInterfaceToType(src);
  assert.ok(out.includes("/** X 의 Props 타입. */\nexport type XProps = A<B>;"), out);
  // 바꾸지 않은 선언의 주석은 그대로
  assert.ok(out.includes("/** 다른 인터페이스 설명 */\nexport interface Y { a: 1 }"), out);
  const sep = readJson(path.join(REG, "separator.json")).files[0].content;
  assert.ok(sep.includes("export type SeparatorProps"), "separator 가 type 으로 바뀌었는지(대조)");
  assert.ok(!sep.includes("인터페이스"), "separator 레지스트리 사본에 「인터페이스」 주석이 남음");
});

test("--out 정리 범위: 관계없는 json 이 있는 디렉터리는 거부하고 아무것도 지우지 않음", async () => {
  const dir = makeTmpDir();
  writeJson(path.join(dir, "package.json"), { name: "app" });
  writeJson(path.join(dir, "tsconfig.json"), {});
  await assert.rejects(() => staleRegistryFiles(dir, { owned: false }), /index\.json/);
  assert.deepEqual(fs.readdirSync(dir).sort(), ["package.json", "tsconfig.json"]);
  // 대조: 배포 위치(owned)로 다루면 json 전부가 대상
  assert.deepEqual((await staleRegistryFiles(dir, { owned: true })).sort(), ["package.json", "tsconfig.json"]);
});

test("--out 정리 범위: 레지스트리 디렉터리면 index 의 항목 · index.json · registry.json 만 대상", async () => {
  const dir = copyRegistry();
  writeJson(path.join(dir, "package.json"), { name: "app" });
  const stale = await staleRegistryFiles(dir, { owned: false });
  assert.ok(!stale.includes("package.json"), stale.join(","));
  assert.ok(stale.includes("index.json") && stale.includes("registry.json") && stale.includes("button.json"), stale.join(","));
  assert.equal(stale.length, fs.readdirSync(REG).length);
});

test("--out 정리 범위: 없거나 빈 디렉터리는 지울 것이 없음", async () => {
  const dir = makeTmpDir();
  assert.deepEqual(await staleRegistryFiles(dir, { owned: false }), []);
  assert.deepEqual(await staleRegistryFiles(path.join(dir, "없음"), { owned: false }), []);
});

test("CLI rc 계약: 잘못된 AXIS_REGISTRY_PUBLIC_URL 은 측정 실패 rc 2(위반 rc 1 과 구분), 값은 가리고 스택 없음", async () => {
  const { spawnSync } = await import("child_process");
  const script = path.join(ROOT, "scripts/registry-integrity.mjs");
  const run = (url) =>
    spawnSync(process.execPath, [script, REG], {
      env: { ...process.env, AXIS_REGISTRY_PUBLIC_URL: url },
      encoding: "utf8",
    });
  const bad = run("https://u:S3cret@h/r?t=X");
  assert.equal(bad.status, 2, bad.stderr);
  assert.ok(bad.stderr.includes("G1 측정 실패"), bad.stderr);
  assert.ok(!bad.stderr.includes("S3cret") && !bad.stderr.includes("t=X"), bad.stderr);
  assert.ok(!/\n\s+at /.test(bad.stderr), `스택 트레이스가 찍힘: ${bad.stderr}`);
  // 대조: 형식이 맞는 URL 은 측정이 되어 기본 URL 산출물과 달라 위반(rc 1)으로 끝남
  const other = run("https://other.example/r");
  assert.equal(other.status, 1, other.stderr);
  assert.ok(other.stderr.includes("G1 실패"), other.stderr);
  // 대조: 기본 URL 은 통과(rc 0)
  const ok = run(DEFAULT_REGISTRY_PUBLIC_URL);
  assert.equal(ok.status, 0, ok.stderr);
});
