/**
 * 템플릿 파일 쓰기 공유 코어 (WI-0088)
 *
 * `axis template apply` · `template init`(packages/axis-cli/src/template/template-apply.ts)과 MCP `axis.apply_template`
 * (packages/axis-mcp/src/tools/template.ts)이 같은 함수로 쓸 내용을 정하고 씁니다.
 *
 * 종전에는 두 경로 모두 템플릿 파일 내용을 그대로 썼습니다. 그래서 템플릿의 package.json 이 사용자 package.json 을 통째로 바꿔
 * `packageManager` · `workspaces` · `engines` · `type` 등 템플릿에 없는 필드와 `name` · `version`, 템플릿에 없는 의존성 · 스크립트가
 * 사라졌고(착수 측정: 사용자 필드 18개짜리 package.json 에서 최상위 키 12개 사라짐 · 6개 바뀜, 5템플릿 × CLI · MCP 같음),
 * ontology-console 의 axis.config.json 도 사용자 키(예: `registry`)를 지웠습니다.
 *
 * 규칙(사용자 결정 대기, 권장안으로 진행: prd Q100 ~ Q106)
 * 1. 대상에 같은 경로의 파일이 없으면 템플릿 내용 그대로 씁니다(`created`, 빈 디렉터리 init 은 종전과 바이트 같음)
 * 2. 템플릿 루트의 `package.json` 은 기존 파일과 합칩니다(`merged`, Q100)
 *    - 최상위 키는 사용자 값을 둡니다(`name` · `version` · `private` · `packageManager` · `workspaces` …). 템플릿에만 있는 키는 뒤에 붙입니다
 *    - `scripts` · `dependencies` · `devDependencies` · `peerDependencies` · `optionalDependencies` 는 키 단위로 합치고,
 *      같은 키는 템플릿 값을 씁니다(종전 동작 · 「필요한 의존성」 설치 명령과 같은 범위)
 * 3. 템플릿 루트의 `axis.config.json` 은 키 단위로 합치고 같은 키는 템플릿 값을 씁니다(템플릿이 쓴 파일을 가리키므로, Q103).
 *    사용자에게만 있는 키는 남깁니다
 * 4. 기존 파일을 JSON 객체로 읽을 수 없으면 종전처럼 템플릿 내용으로 덮어쓰고 그 사실을 `note` 로 알립니다(Q101)
 * 5. 합친 JSON 은 기존 파일의 들여쓰기 · 줄바꿈(CRLF) · 끝 줄바꿈 유무를 따릅니다(Q102)
 * 6. 그 밖의 파일은 종전처럼 덮어씁니다(`overwritten`)
 * 7. 쓰기는 모든 내용을 먼저 정한 뒤 하고, 쓰는 도중 실패하면 이미 쓴 파일을 원래 내용으로 되돌리고(새로 만든 파일 · 빈 디렉터리는 지움)
 *    `TemplateApplyError` 를 던집니다(Q106)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

export type TemplateFileAction = "created" | "overwritten" | "merged";

export interface TemplateFileInput {
  path: string;
  content: string;
}

export interface TemplateFilePlan {
  /** 템플릿 기준 상대 경로 */
  path: string;
  /** 쓸 절대 경로 */
  dest: string;
  action: TemplateFileAction;
  /** 쓸 내용 */
  content: string;
  /** 기존 내용(없으면 undefined) */
  before?: string;
  /** 사용자에게 알릴 한 줄(예: JSON 으로 읽을 수 없어 덮어씀) */
  note?: string;
}

/** package.json 에서 키 단위로 합치는 맵(같은 키는 템플릿 값) */
export const PACKAGE_JSON_MERGED_MAPS = [
  "scripts",
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

type JsonObject = Record<string, unknown>;

function isPlainObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseObject(text: string): JsonObject | undefined {
  try {
    const v: unknown = JSON.parse(text);
    return isPlainObject(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 사용자 package.json 과 템플릿 package.json 을 합칩니다(Q100). 키 순서는 사용자 순서, 템플릿에만 있는 키는 뒤에 붙습니다.
 */
export function mergePackageJson(user: JsonObject, template: JsonObject): JsonObject {
  const maps = new Set<string>(PACKAGE_JSON_MERGED_MAPS);
  const out: JsonObject = {};
  for (const [key, value] of Object.entries(user)) {
    const tpl = template[key];
    if (maps.has(key) && isPlainObject(tpl)) {
      out[key] = isPlainObject(value) ? { ...value, ...tpl } : tpl;
    } else {
      out[key] = value;
    }
  }
  for (const [key, value] of Object.entries(template)) {
    if (!(key in out)) out[key] = value;
  }
  return out;
}

/** 사용자 axis.config.json 과 템플릿 axis.config.json 을 합칩니다(Q103). 같은 키는 템플릿 값, 사용자에게만 있는 키는 유지 */
export function mergeAxisConfigJson(user: JsonObject, template: JsonObject): JsonObject {
  return { ...user, ...template };
}

/** 기존 JSON 텍스트의 들여쓰기(탭이면 "\t", 아니면 칸 수, 못 찾으면 2) */
export function detectJsonIndent(text: string): string | number {
  const m = /^([ \t]+)\S/m.exec(text);
  if (!m) return 2;
  return m[1].startsWith("\t") ? "\t" : m[1].length;
}

/** 기존 텍스트의 서식(들여쓰기 · CRLF · 끝 줄바꿈)으로 JSON 을 씁니다(Q102) */
function serializeLike(before: string, value: JsonObject): string {
  const crlf = before.includes("\r\n");
  const trailing = /\r?\n$/.test(before);
  let text = JSON.stringify(value, null, detectJsonIndent(before));
  if (trailing) text += "\n";
  return crlf ? text.replace(/\n/g, "\r\n") : text;
}

const MERGERS: Record<string, (user: JsonObject, template: JsonObject) => JsonObject> = {
  "package.json": mergePackageJson,
  "axis.config.json": mergeAxisConfigJson,
};

/** 템플릿 파일 경로가 합치기 대상인지(템플릿 루트의 package.json · axis.config.json 만) */
export function isMergedTemplateFile(relPath: string): boolean {
  return Object.prototype.hasOwnProperty.call(MERGERS, relPath.replace(/^\.\//, ""));
}

/**
 * 템플릿 파일 하나의 쓸 내용을 정합니다. `before` 는 대상의 기존 내용(없으면 undefined)입니다.
 */
export function planTemplateFileContent(
  relPath: string,
  templateContent: string,
  before: string | undefined
): Pick<TemplateFilePlan, "action" | "content" | "note"> {
  if (before === undefined) return { action: "created", content: templateContent };
  const merger = MERGERS[relPath.replace(/^\.\//, "")];
  if (!merger) return { action: "overwritten", content: templateContent };
  const user = parseObject(before);
  const template = parseObject(templateContent);
  if (!user || !template) {
    return {
      action: "overwritten",
      content: templateContent,
      note: `기존 ${relPath} 을 JSON 객체로 읽을 수 없어 템플릿 내용으로 덮어씁니다`,
    };
  }
  return { action: "merged", content: serializeLike(before, merger(user, template)) };
}

/** 대상 디렉터리에 쓸 템플릿 파일 계획(파일을 쓰지 않음, dry-run · 충돌 목록에도 씀) */
export function planTemplateFiles(baseDir: string, files: readonly TemplateFileInput[]): TemplateFilePlan[] {
  return files.map((file) => {
    const dest = path.join(baseDir, file.path);
    const before = existsSync(dest) ? readFileSync(dest, "utf8") : undefined;
    return { path: file.path, dest, before, ...planTemplateFileContent(file.path, file.content, before) };
  });
}

/** 쓰는 도중 실패해 되돌린 뒤 던지는 오류 */
export class TemplateApplyError extends Error {
  constructor(
    message: string,
    /** 되돌린(원래 내용으로 다시 쓰거나 지운) 파일의 템플릿 상대 경로 */
    readonly restored: string[],
    /** 되돌리지 못한 파일(되돌리기 자체가 실패) */
    readonly unrestored: string[]
  ) {
    super(message);
    this.name = "TemplateApplyError";
  }
}

/**
 * 계획대로 씁니다. 쓰는 도중 실패하면 이미 쓴 파일을 원래 내용으로 되돌리고(새로 만든 파일은 지우고, 이번에 만든 빈 디렉터리도 지움)
 * `TemplateApplyError` 를 던집니다(Q106).
 */
export function writeTemplateFiles(plan: readonly TemplateFilePlan[]): void {
  const done: TemplateFilePlan[] = [];
  const madeDirs: string[] = [];
  try {
    for (const item of plan) {
      const dir = path.dirname(item.dest);
      if (!existsSync(dir)) {
        // 가장 바깥의 새 디렉터리부터 기록해, 되돌릴 때 안쪽부터 지웁니다
        const fresh: string[] = [];
        for (let d = dir; !existsSync(d); d = path.dirname(d)) fresh.unshift(d);
        mkdirSync(dir, { recursive: true });
        madeDirs.push(...fresh);
      }
      writeFileSync(item.dest, item.content);
      done.push(item);
    }
  } catch (err) {
    const restored: string[] = [];
    const unrestored: string[] = [];
    // 실패한 파일도 일부가 쓰였을 수 있어 함께 되돌립니다
    const failed = plan[done.length];
    const targets = failed ? [...done, failed] : done;
    for (const item of targets.reverse()) {
      try {
        if (item.before === undefined) {
          if (existsSync(item.dest)) unlinkSync(item.dest);
        } else {
          writeFileSync(item.dest, item.before);
        }
        restored.push(item.path);
      } catch {
        unrestored.push(item.path);
      }
    }
    for (const d of madeDirs.reverse()) {
      try {
        if (existsSync(d) && readdirSync(d).length === 0) rmdirSync(d);
      } catch {
        // 빈 디렉터리 정리는 최선만 다합니다
      }
    }
    const reason = err instanceof Error ? err.message : String(err);
    const tail = unrestored.length > 0 ? ` 되돌리지 못한 파일: ${unrestored.join(", ")}` : "";
    throw new TemplateApplyError(
      `템플릿 파일을 쓰는 도중 실패해 건드린 파일 ${restored.length}개를 원래대로 되돌렸습니다(${reason}).${tail}`,
      restored.reverse(),
      unrestored
    );
  }
}
