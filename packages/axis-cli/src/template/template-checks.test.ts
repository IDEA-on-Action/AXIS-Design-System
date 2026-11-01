/**
 * WI-0107: 템플릿별 규칙 검사(axis check 10번째 항목, registry-core template-checks.ts)
 *
 * - 5규칙 양성 · 음성, 주석 안 긴 줄표, cn() 조합, 측정 실패, 링크 밖 · 순환, 큰 파일 · 긴 줄 · 시간 상한, template 이상값, 줄바꿈 파일명
 * - 패리티: 템플릿 안 scripts/check-ontology.mjs(테스트에서만 child_process 로 실행)와 내장 판정이 같은 위반 목록(파일 · 줄 · 규칙)을 냄
 * - 동기화: apps/web/templates/<slug>/template.json 의 checks 가 registry-core 정적 표와 같음(모르는 id 는 실패)
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "fs-extra";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import {
  collectTemplateCheckResults,
  inspectOntologyRules,
  inspectOntologySource,
  messageSafePath,
  ONTOLOGY_MAX_FILE_BYTES,
  ONTOLOGY_MAX_LINE_CHARS,
  TEMPLATE_CHECK_DEFINITIONS,
  TEMPLATE_CHECKS,
  templateChecksFor,
} from "@axis-ds/registry-core/template-checks";
import { collectCheckResults, runCheck } from "./template-check.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../../..");
const TEMPLATES_DIR = path.join(REPO, "apps/web/templates");
const ONTOLOGY_FILES = path.join(TEMPLATES_DIR, "ontology-console/files");
const SCRIPT = path.join(ONTOLOGY_FILES, "scripts/check-ontology.mjs");
const REGISTRY_DIR = path.join(REPO, "apps/web/public/r");

const EM = String.fromCharCode(0x2014);
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

const created: string[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  while (created.length > 0) {
    const dir = created.pop()!;
    await fs.chmod(dir, 0o755).catch(() => undefined);
    await fs.remove(dir);
  }
});

async function tempDir(prefix = "axis-tc-"): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  created.push(dir);
  return dir;
}

async function writeFiles(dir: string, files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) await fs.outputFile(path.join(dir, rel), content);
}

/** 템플릿 원본 files 사본(axis.config.json 의 template = ontology-console 포함) */
async function ontologyCopy(): Promise<string> {
  const dir = await tempDir("axis-tc-onto-");
  await fs.copy(ONTOLOGY_FILES, dir);
  return dir;
}

/** 레지스트리 전 컴포넌트(r/*.json files)를 프로젝트에 넣습니다(axis add 와 같은 경로: components/ui · components/agentic) */
async function addAllRegistryComponents(dir: string): Promise<number> {
  let n = 0;
  for (const name of (await fs.readdir(REGISTRY_DIR)).sort()) {
    if (!name.endsWith(".json") || name === "index.json" || name === "registry.json") continue;
    const item = await fs.readJSON(path.join(REGISTRY_DIR, name));
    for (const f of item.files ?? []) {
      if (typeof f.content !== "string" || typeof f.path !== "string") continue;
      await fs.outputFile(path.join(dir, f.path), f.content);
      n++;
    }
  }
  return n;
}

type Row = { file: string; line: number; rule: string };
const rowKey = (r: Row) => `${r.file}:${r.line}:${r.rule}`;

/** 템플릿 스크립트를 실행하고 위반 목록 · 검사 파일 수 · rc 를 돌려줍니다(테스트 전용) */
function runScript(dir: string): { rc: number | null; rows: Row[]; checked: number | undefined; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: dir, encoding: "utf8", timeout: 60_000 });
  const rows: Row[] = [];
  for (const line of r.stdout.split("\n")) {
    const m = /^(.*):(\d+) {2}([a-z-]+) {2}/.exec(line);
    if (m) rows.push({ file: m[1].split(path.sep).join("/"), line: Number(m[2]), rule: m[3] });
  }
  const sum = /검사 파일 (\d+)개, 위반 (\d+)건/.exec(r.stdout);
  return { rc: r.status, rows, checked: sum ? Number(sum[1]) : undefined, stdout: r.stdout, stderr: r.stderr };
}

/** 두 구현을 같은 디렉터리에 돌려 위반 목록 · 파일 수 · 종료 분류가 같은지 봅니다 */
function expectParity(dir: string): { rows: Row[]; checked: number } {
  const script = runScript(dir);
  const core = inspectOntologyRules(dir);
  const coreRows = core.violations.map((v) => ({ file: v.file, line: v.line, rule: v.rule }));
  expect(script.rows.map(rowKey)).toEqual(coreRows.map(rowKey));
  if (core.checked === 0) {
    expect(script.rc).toBe(2);
  } else {
    expect(script.checked).toBe(core.checked);
    expect(script.rc).toBe(core.violations.length > 0 ? 1 : 0);
  }
  return { rows: coreRows, checked: core.checked };
}

/** 규칙별 소스 fixture(양성) */
const POSITIVE: Record<string, string> = {
  "lib/em.ts": `export const a = 1 // 설명 ${EM} 주석 안\n`,
  "components/bang.tsx": `export function A() {\n  return <p>현황이에요!</p>\n}\nexport const t = '저장했어요\uFF01'\n`,
  "components/side-class.tsx": `export const a = 'border-l-4 border-primary'\n`,
  "components/side-cn.tsx": `import { cn } from '@/lib/utils'\nexport function A({ on }: { on: boolean }) {\n  return <div className={cn('border-l-4', on && 'border-primary')} />\n}\n`,
  "app/side.css": `.x { border-left: 3px solid #123456; }\n`,
  "components/side-style.tsx": `export const s = { borderLeft: '2px solid red' }\n`,
  "components/card-class.tsx": `export const c = 'bg-card shadow-md'\n`,
  "components/card-tag.tsx": `export function A() {\n  return <Card className="p-4 shadow-sm">x</Card>\n}\n`,
  "app/card.css": `.my-card { box-shadow: 0 1px 2px hsl(var(--x)); }\n`,
  "components/card-style.tsx": `export function A() {\n  return <Card style={{ boxShadow: '0 0 4px var(--x)' }}>x</Card>\n}\n`,
  "lib/hex.ts": `export const c = '#ff0000'\n`,
  "lib/rgb.ts": `export const c = 'rgb(1, 2, 3)'\n`,
  "app/named.css": `.x { color: white; }\n`,
  "components/pal.tsx": `export const p = 'text-red-500'\n`,
};

/** 음성: 규칙에 걸리지 않아야 하는 것 */
const NEGATIVE: Record<string, string> = {
  "lib/ok.ts": `// 주석 속 #ff0000 · text-red-500 은 보지 않아요\nexport const a = 'border-l-4 border-border'\nexport const b = 'rounded-lg border shadow-none'\n`,
  "components/ok.tsx": `export function A() {\n  return <a href="#add" className="bg-primary text-muted-foreground">추가</a>\n}\n`,
  "app/ok.css": `.x { border-left: 1px solid hsl(var(--border)); color: hsl(var(--foreground)); }\n.card { box-shadow: none; }\n`,
};

describe("inspectOntologyRules: 5규칙", () => {
  it("양성: 규칙마다 잡고, 음성은 0건", async () => {
    const dir = await tempDir();
    await writeFiles(dir, { ...POSITIVE, ...NEGATIVE });
    const { violations, checked } = inspectOntologyRules(dir);
    expect(checked).toBe(Object.keys(POSITIVE).length + Object.keys(NEGATIVE).length);
    const byFile = new Map<string, string[]>();
    for (const v of violations) byFile.set(v.file, [...(byFile.get(v.file) ?? []), v.rule]);
    expect(byFile.get("lib/em.ts")).toEqual(["em-dash"]);
    expect(byFile.get("components/bang.tsx")).toEqual(["exclamation", "exclamation"]);
    expect(byFile.get("components/side-class.tsx")).toEqual(["one-side-line"]);
    expect(byFile.get("components/side-cn.tsx")).toEqual(["one-side-line"]);
    expect(byFile.get("app/side.css")).toEqual(["one-side-line", "palette"]);
    expect(byFile.get("components/side-style.tsx")).toEqual(["one-side-line", "palette"]);
    expect(byFile.get("components/card-class.tsx")).toEqual(["card-shadow"]);
    expect(byFile.get("components/card-tag.tsx")).toEqual(["card-shadow"]);
    expect(byFile.get("app/card.css")).toEqual(["card-shadow"]);
    expect(byFile.get("components/card-style.tsx")).toEqual(["card-shadow"]);
    expect(byFile.get("lib/hex.ts")).toEqual(["palette"]);
    expect(byFile.get("lib/rgb.ts")).toEqual(["palette"]);
    expect(byFile.get("app/named.css")).toEqual(["palette"]);
    expect(byFile.get("components/pal.tsx")).toEqual(["palette"]);
    for (const f of Object.keys(NEGATIVE)) expect(byFile.get(f), f).toBeUndefined();
  });

  it("긴 줄표는 주석 안에서도 잡고, 다른 규칙은 주석을 보지 않아요", () => {
    expect(inspectOntologySource(`/* a ${EM} b */\nconst x = 1\n`, ".ts")).toEqual([{ line: 1, rule: "em-dash" }]);
    expect(inspectOntologySource(`/* '#ff0000' */\n// 'text-red-500'\n`, ".ts")).toEqual([]);
  });

  it("cn() 조합: 조건부로 나눈 클래스도 합쳐 보고, 중립 선은 통과", () => {
    expect(inspectOntologySource(`cn('border-l-4', a && 'border-primary')`, ".ts")).toEqual([{ line: 1, rule: "one-side-line" }]);
    expect(inspectOntologySource(`cn('border-l-4', a && 'border-border')`, ".ts")).toEqual([]);
    expect(inspectOntologySource(`cn('rounded-lg border', a && 'shadow-lg')`, ".ts")).toEqual([{ line: 1, rule: "card-shadow" }]);
  });

  it("같은 줄 · 같은 규칙은 한 번만", () => {
    expect(inspectOntologySource(`const a = '#fff #000 #123'\n`, ".ts")).toEqual([{ line: 1, rule: "palette" }]);
  });
});

describe("inspectOntologyRules: 읽는 범위와 측정 실패", () => {
  it("대상 디렉터리가 없으면 checked 0, 항목은 WARN 측정 실패(PASS 아님)", async () => {
    const dir = await tempDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { template: "ontology-console" });
    expect(inspectOntologyRules(dir).checked).toBe(0);
    const [r] = collectTemplateCheckResults(dir);
    expect(r.severity).toBe("warn");
    expect(r.message).toContain("측정 실패, 검사할 파일이 없습니다(대상: app · components · lib)");
  });

  it("프로젝트 밖을 가리키는 링크는 따라가지 않고 건수만 셈", async () => {
    const outside = await tempDir("axis-tc-out-");
    await writeFiles(outside, { "x.ts": "export const c = '#ff0000'\n" });
    const dir = await tempDir();
    await writeFiles(dir, { "lib/ok.ts": "export const a = 1\n" });
    await fs.symlink(outside, path.join(dir, "lib/ext"));
    await fs.symlink(path.join(outside, "x.ts"), path.join(dir, "lib/file-link.ts"));
    const r = inspectOntologyRules(dir);
    expect(r.violations).toEqual([]);
    expect(r.checked).toBe(1);
    expect(r.skippedLinks).toBe(2);
    const parity = expectParity(dir);
    expect(parity.checked).toBe(1);
  });

  it("프로젝트 안 링크는 따라가고 같은 실경로는 한 번만 읽음", async () => {
    const dir = await tempDir();
    await writeFiles(dir, { "lib/real/x.ts": "export const c = '#ff0000'\n" });
    await fs.symlink(path.join(dir, "lib/real"), path.join(dir, "components"));
    const r = inspectOntologyRules(dir);
    expect(r.checked).toBe(1);
    expect(r.violations).toEqual([{ file: "components/x.ts", line: 1, rule: "palette" }]);
    expectParity(dir);
  });

  it("순환 링크는 죽지 않고 끝남(종전 스크립트는 ELOOP)", async () => {
    const dir = await tempDir();
    await writeFiles(dir, { "lib/a.ts": "export const a = 1\n" });
    await fs.symlink("..", path.join(dir, "lib/up"));
    await fs.symlink(".", path.join(dir, "lib/self"));
    const r = inspectOntologyRules(dir);
    expect(r.checked).toBe(1);
    expectParity(dir);
  });

  it("깨진 링크는 건너뛰고 셈", async () => {
    const dir = await tempDir();
    await writeFiles(dir, { "lib/a.ts": "export const a = 1\n" });
    await fs.symlink(path.join(dir, "nope.ts"), path.join(dir, "lib/broken.ts"));
    expect(inspectOntologyRules(dir).skippedLinks).toBe(1);
    expectParity(dir);
  });

  it("node_modules · 점 디렉터리 · 확장자 밖 파일은 보지 않음", async () => {
    const dir = await tempDir();
    await writeFiles(dir, {
      "lib/node_modules/x.ts": "'#ff0000'",
      "lib/.cache/x.ts": "'#ff0000'",
      "lib/x.md": "'#ff0000'",
      "lib/ok.ts": "export const a = 1\n",
    });
    expect(inspectOntologyRules(dir)).toMatchObject({ checked: 1, violations: [] });
    expectParity(dir);
  });

  it("256KB 초과 · 한 줄 상한 초과 파일은 건너뛰고 건수를 문구에 적음", async () => {
    const dir = await tempDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { template: "ontology-console" });
    await writeFiles(dir, {
      "lib/big.ts": `// ${"a".repeat(80)}\n`.repeat(Math.ceil((ONTOLOGY_MAX_FILE_BYTES + 10) / 84)) + "'#ff0000'\n",
      "lib/long.ts": `export const s = '${"x".repeat(ONTOLOGY_MAX_LINE_CHARS)}' + '#ff0000'\n`,
      "lib/ok.ts": "export const a = 1\n",
    });
    const r = inspectOntologyRules(dir);
    expect(r).toMatchObject({ checked: 1, skippedLarge: 2, violations: [] });
    expect(collectTemplateCheckResults(dir)[0].message).toContain("건너뜀: 크기 상한(256KB · 한 줄 4,096자) 초과 2개");
    expectParity(dir);
  });

  it("읽기 오류는 WARN 측정 실패", async () => {
    if (process.getuid?.() === 0) return; // root 는 권한으로 막을 수 없음
    const dir = await tempDir();
    await fs.writeJSON(path.join(dir, "axis.config.json"), { template: "ontology-console" });
    await writeFiles(dir, { "lib/a.ts": "export const a = 1\n" });
    await fs.chmod(path.join(dir, "lib"), 0o000);
    try {
      const [r] = collectTemplateCheckResults(dir);
      expect(r).toEqual({
        name: "template.ontology-rules",
        severity: "warn",
        message:
          "템플릿 ontology-console 규칙 검사(axis 내장 규칙, 설치한 axis 버전 기준 · 프로젝트 스크립트는 실행하지 않음): 측정 실패, 파일을 읽지 못했습니다(EACCES)",
      });
      expect(runScript(dir).rc).toBe(2);
    } finally {
      await fs.chmod(path.join(dir, "lib"), 0o755);
    }
  });
});

describe("시간 상한(2차 시간 정규식 대체, WI-0107 D3 ②)", () => {
  // 종전 정규식 /([^{}]+)\{([^{}]*)\}/g 는 같은 입력(규칙 하나 + 12만 자 주석)에 7.2초(브리프 실측)
  it("CSS 꼬리 주석 12만 자: 판정이 1초 안", () => {
    const css = `.a{color:red}/*${"x".repeat(120_000)}*/`;
    const t = performance.now();
    inspectOntologySource(css, ".css");
    expect(performance.now() - t).toBeLessThan(1000);
  });

  it("여러 줄 꼬리 주석(상한 안 파일)도 파일 단위로 1초 안", async () => {
    const dir = await tempDir();
    await writeFiles(dir, { "app/g.css": `.a{color:hsl(var(--x))}\n/*\n${`${"x".repeat(4000)}\n`.repeat(60)}*/\n` });
    const t = performance.now();
    const r = inspectOntologyRules(dir);
    expect(performance.now() - t).toBeLessThan(1000);
    expect(r.checked).toBe(1);
  });

  it("닫히지 않은 cn( · 블록 주석 · 많은 위반이 상한 크기에 있어도 1초 안", () => {
    const wrap = (unit: string) => {
      const lines: string[] = [];
      while (lines.length * 4001 < 250 * 1024) lines.push(unit.repeat(Math.floor(4000 / unit.length)));
      return lines.join("\n");
    };
    for (const [src, ext] of [
      [wrap("cn("), ".ts"],
      [wrap("/*a "), ".ts"],
      [wrap("#fff "), ".ts"],
      [wrap("className={cn( "), ".tsx"],
      [wrap("boxShadow: 'x' "), ".tsx"],
    ] as const) {
      const t = performance.now();
      inspectOntologySource(src, ext);
      expect(performance.now() - t, src.slice(0, 20)).toBeLessThan(1000);
    }
  });
});

describe("template 값 안전 조회 · 종전 출력과 바이트 같음", () => {
  async function project(template: unknown | undefined): Promise<string> {
    const dir = await tempDir();
    const config: Record<string, unknown> = { globalCss: "./app/globals.css" };
    if (template !== undefined) config.template = template;
    await fs.writeJSON(path.join(dir, "axis.config.json"), config);
    await writeFiles(dir, { "app/globals.css": ":root{}", "lib/a.ts": "export const c = '#ff0000'\n" });
    return dir;
  }

  it.each([
    ["__proto__"],
    ["constructor"],
    ["toString"],
    ["hasOwnProperty"],
    [["ontology-console"]],
    [42],
    [null],
    [{ slug: "ontology-console" }],
    ["ONTOLOGY-CONSOLE"],
    ["ontology-console "],
    ["dashboard"],
    ["../ontology-console"],
  ])("template=%j 는 항목을 만들지 않고 종전과 같음", async (value) => {
    const base = await project(undefined);
    const dir = await project(value);
    expect(templateChecksFor(dir)).toBeNull();
    expect(collectTemplateCheckResults(dir)).toEqual([]);
    expect(JSON.stringify(await collectCheckResults(dir))).toBe(JSON.stringify(await collectCheckResults(base)));
  });

  it('JSON 의 "__proto__" 키도 표에 있는 것으로 읽지 않음', async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, "axis.config.json"), '{"__proto__": {"template": "ontology-console"}}');
    expect(templateChecksFor(dir)).toBeNull();
  });

  it("깨진 axis.config.json · 배열 config 는 항목 없음", async () => {
    const dir = await tempDir();
    await fs.writeFile(path.join(dir, "axis.config.json"), "{ broken");
    expect(collectTemplateCheckResults(dir)).toEqual([]);
    await fs.writeFile(path.join(dir, "axis.config.json"), '["ontology-console"]');
    expect(collectTemplateCheckResults(dir)).toEqual([]);
  });

  it("ontology-console 이면 10번째 항목이 마지막에 붙음", async () => {
    const dir = await project("ontology-console");
    const results = await collectCheckResults(dir);
    expect(results[results.length - 1].name).toBe("template.ontology-rules");
    const base = await collectCheckResults(await project(undefined));
    expect(results.slice(0, -1)).toEqual(base);
  });
});

describe("문구: 고정 문구 · 건수 · 규칙 id, 경로 이스케이프, 안내 조건", () => {
  it("위반 WARN: 건수 · 규칙별 수 · 첫 위치, package.json 에 script 가 있으면 전체 보기 안내", async () => {
    const dir = await ontologyCopy();
    await writeFiles(dir, {
      "lib/bad.ts": `export const a = '${EM}'\nexport const c = '#ff0000'\nexport const d = 'text-red-500'\n`,
    });
    const [r] = collectTemplateCheckResults(dir);
    expect(r).toEqual({
      name: "template.ontology-rules",
      severity: "warn",
      message:
        '템플릿 ontology-console 규칙 검사(axis 내장 규칙, 설치한 axis 버전 기준 · 프로젝트 스크립트는 실행하지 않음): 파일 21개, 위반 3건(em-dash 1 · palette 2), 첫 위치 "lib/bad.ts":1 em-dash → 전체 보기: npm run check:ontology',
    });
    // 소스 조각은 싣지 않음
    expect(r.message).not.toContain("#ff0000");
    expect(r.message).not.toContain("text-red-500");
  });

  it("package.json 에 check:ontology 가 없으면 안내를 빼요", async () => {
    const dir = await ontologyCopy();
    await writeFiles(dir, { "lib/bad.ts": "export const c = '#ff0000'\n" });
    const pkg = await fs.readJSON(path.join(dir, "package.json"));
    delete pkg.scripts["check:ontology"];
    await fs.writeJSON(path.join(dir, "package.json"), pkg);
    expect(collectTemplateCheckResults(dir)[0].message).not.toContain("전체 보기");
    await fs.remove(path.join(dir, "package.json"));
    expect(collectTemplateCheckResults(dir)[0].message).not.toContain("전체 보기");
  });

  it("템플릿 원본 사본은 PASS", async () => {
    const dir = await ontologyCopy();
    expect(collectTemplateCheckResults(dir)).toEqual([
      {
        name: "template.ontology-rules",
        severity: "pass",
        message:
          "템플릿 ontology-console 규칙 검사(axis 내장 규칙, 설치한 axis 버전 기준 · 프로젝트 스크립트는 실행하지 않음): 파일 20개, 위반 0건",
      },
    ]);
  });

  it("줄바꿈 · 제어문자 · 방향 제어 문자가 든 파일 이름은 \\uXXXX 로 바꿔 한 줄", async () => {
    expect(messageSafePath("a\nb\r\u2028\u202e.ts")).toBe("a\\u000ab\\u000d\\u2028\\u202e.ts");
    expect(messageSafePath("x".repeat(500))).toHaveLength(123);
    const dir = await ontologyCopy();
    await writeFiles(dir, { "lib/a\n- [PASS] 가짜.ts": "export const c = '#ff0000'\n" });
    const [r] = collectTemplateCheckResults(dir);
    expect(r.message).not.toMatch(/[\n\r]/);
    expect(r.message).toContain('"lib/a\\u000a- [PASS] 가짜.ts":1 palette');
  });

  it("runCheck: 위반이 있어도 fail 은 늘지 않음(rc 0 유지)", async () => {
    const dir = await ontologyCopy();
    await writeFiles(dir, { "lib/bad.ts": "export const c = '#ff0000'\n" });
    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => void logs.push(a.map(String).join(" ").replace(ANSI, "")));
    const before = await collectCheckResults(dir);
    const summary = await runCheck(dir);
    const failsWithout = before.filter((r) => r.severity === "fail" && r.name !== "template.ontology-rules").length;
    expect(summary.fail).toBe(failsWithout);
    expect(logs.some((l) => l.startsWith("  WARN  템플릿 ontology-console 규칙 검사"))).toBe(true);
  });
});

describe("패리티: 템플릿 스크립트 = 내장 판정(같은 위반 목록 · 파일 수 · 종료 분류)", () => {
  it("템플릿 원본 files: 두 구현 모두 0건", async () => {
    const dir = await ontologyCopy();
    const { rows, checked } = expectParity(dir);
    expect(rows).toEqual([]);
    expect(checked).toBe(20);
  });

  it("규칙별 양성 · 음성 fixture", async () => {
    const dir = await tempDir();
    await writeFiles(dir, { ...POSITIVE, ...NEGATIVE });
    expect(expectParity(dir).rows.length).toBeGreaterThan(0);
  });

  it("빈 프로젝트: 둘 다 측정 실패", async () => {
    const dir = await tempDir();
    const s = runScript(dir);
    expect(s.rc).toBe(2);
    expect(inspectOntologyRules(dir).checked).toBe(0);
  });

  it("레지스트리 전 컴포넌트를 넣은 사본(axis add 경로)", async () => {
    const dir = await ontologyCopy();
    expect(await addAllRegistryComponents(dir)).toBeGreaterThan(25);
    const { rows } = expectParity(dir);
    // WI-0107 D4: tool-call-card 의 긴 줄표를 가운뎃점으로 고쳐 em-dash 는 0건. 남은 것은 카드 모양 + 그림자 판정(open_questions)
    expect(rows.filter((r) => r.rule === "em-dash")).toEqual([]);
  });

  it("상한 · 링크가 섞인 fixture", async () => {
    const outside = await tempDir("axis-tc-out-");
    await writeFiles(outside, { "x.ts": "'#ff0000'" });
    const dir = await tempDir();
    await writeFiles(dir, {
      ...POSITIVE,
      "lib/long.ts": `'${"x".repeat(ONTOLOGY_MAX_LINE_CHARS + 1)}'\n'#ff0000'\n`,
      "app/g.css": `.card{box-shadow:0 0 1px hsl(var(--x))}\n/*\n${`${"y".repeat(100)}\n`.repeat(1200)}*/\n.b{color:red}\n`,
    });
    await fs.symlink(outside, path.join(dir, "components/out"));
    await fs.symlink("..", path.join(dir, "components/loop"));
    expectParity(dir);
  });
});

describe("동기화: template.json checks = registry-core 정적 표", () => {
  it("모든 템플릿의 checks id 가 표와 같고, 표의 id 는 모두 정의가 있음", async () => {
    const declared = new Map<string, string[]>();
    for (const slug of (await fs.readdir(TEMPLATES_DIR)).sort()) {
      const metaPath = path.join(TEMPLATES_DIR, slug, "template.json");
      if (!(await fs.pathExists(metaPath))) continue;
      const meta = await fs.readJSON(metaPath);
      expect(meta.slug).toBe(slug);
      if (meta.checks === undefined) continue;
      expect(Array.isArray(meta.checks), slug).toBe(true);
      const ids: string[] = [];
      for (const c of meta.checks) {
        const def = TEMPLATE_CHECK_DEFINITIONS.get(c.id);
        expect(def, `${slug}: 모르는 검사 id ${c.id}`).toBeDefined();
        expect(c.script, `${slug}: ${c.id} script`).toBe(def!.script);
        ids.push(c.id);
      }
      if (ids.length > 0) declared.set(slug, ids);
    }
    expect(Object.fromEntries(declared)).toEqual(Object.fromEntries(TEMPLATE_CHECKS));
    for (const ids of TEMPLATE_CHECKS.values()) for (const id of ids) expect(TEMPLATE_CHECK_DEFINITIONS.has(id)).toBe(true);
    expect(TEMPLATE_CHECKS.size).toBeGreaterThan(0);
  });

  it("공개 템플릿 JSON(public/templates)도 같은 checks 를 실음", async () => {
    const detail = await fs.readJSON(path.join(REPO, "apps/web/public/templates/ontology-console.json"));
    const index = await fs.readJSON(path.join(REPO, "apps/web/public/templates/index.json"));
    const entry = index.templates.find((t: { slug: string }) => t.slug === "ontology-console");
    expect(detail.checks).toEqual([{ id: "ontology-rules", script: "check:ontology" }]);
    expect(entry.checks).toEqual(detail.checks);
    // 공개 JSON 의 스크립트가 원본 files 와 같은지(빌드 누락 방지)
    const script = detail.files.find((f: { path: string }) => f.path === "scripts/check-ontology.mjs");
    expect(script.content).toBe(await fs.readFile(SCRIPT, "utf8"));
  });
});
