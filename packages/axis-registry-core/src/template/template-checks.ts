/**
 * 템플릿별 규칙 검사 공유 코어 (WI-0107, WI-0027 PRD FR-4b)
 *
 * `axis check`(packages/axis-cli/src/template/template-check.ts)와 MCP `axis.check_project`
 * (packages/axis-mcp/src/tools/template.ts)가 같은 함수 · 같은 문구로 10번째 항목을 만듭니다.
 *
 * 규칙(사용자 결정 D1 ~ D3, 2026-11-01)
 * 1. 실행할 검사는 `axis.config.json` 의 `template` 값과 이 파일의 정적 표(`TEMPLATE_CHECKS`)로만 고릅니다.
 *    템플릿 정의(template.json)의 `checks` 는 빌드 · 동기화 테스트 전용 메타데이터라 런타임에서 읽지 않습니다.
 *    원격 템플릿 JSON 이 무엇을 적든 어떤 검사를 돌릴지는 바뀌지 않습니다. `script` 는 사람에게 보여 줄 안내 문자열입니다.
 * 2. 사용자 프로젝트의 스크립트(scripts/check-ontology.mjs)를 실행하지 않습니다. 같은 판정을 이 파일에 옮겨 두었고(읽기 전용),
 *    두 구현이 같은 입력에 같은 위반 목록(파일 · 줄 · 규칙)을 내는지는 패리티 테스트(packages/axis-cli/src/template/template-checks.test.ts)가 봅니다.
 * 3. `template` 이 없거나 문자열이 아니거나 slug 형식이 아니거나 표에 없으면 항목을 만들지 않습니다(종전 출력과 바이트 같음).
 *    표는 Map 이라 "__proto__" · "constructor" 같은 값이 표에 있는 것으로 읽히지 않습니다.
 * 4. 위반은 WARN 입니다(rc 0 유지). 검사한 파일이 0개이거나 읽기 오류가 나면 WARN 「측정 실패」이고 PASS 로 다루지 않습니다.
 * 5. 문구에는 고정 문구 · 건수 · 규칙 id 만 넣고 소스 조각은 넣지 않습니다. 첫 위치의 파일 경로는 제어문자 · 줄바꿈 · 방향 제어 문자를
 *    \uXXXX 로 바꾸고 길이를 잘라 한 줄로 고정합니다. 「전체 보기: npm run <script>」 안내는 프로젝트 package.json 의 scripts 에
 *    그 이름이 있을 때만 붙입니다.
 * 6. 읽는 범위: app · components · lib 아래 .ts · .tsx · .js · .jsx · .mjs · .css. 디렉터리는 lstat 로 훑고 심볼릭 링크는 실경로가
 *    프로젝트 실경로 안일 때만 따라갑니다(WI-0100b `expandGlobalCss` 와 같은 규칙, `isSameOrInside`). 같은 실경로는 한 번만 읽고
 *    디렉터리 깊이 32 단계까지만 내려갑니다. 256KB 를 넘거나 한 줄이 4,096자를 넘는 파일은 건너뛰고 건수를 문구에 적습니다.
 */

import { lstatSync, readdirSync, readFileSync, realpathSync, statSync, type Stats } from "node:fs";
import path from "node:path";
import { isSameOrInside } from "../add/safe-write.js";

/** 템플릿 검사 항목. CLI · MCP 의 `CheckResult` 와 같은 모양입니다. */
export interface TemplateCheckResult {
  name: string;
  severity: "pass" | "warn" | "fail";
  message: string;
}

/** 내장 검사 정의 */
export interface TemplateCheckDefinition {
  /** 검사 id. template.json `checks[].id` 와 같아야 합니다 */
  id: string;
  /** 사람에게 보여 줄 npm script 이름(실행하지 않음). template.json `checks[].script` 와 같아야 합니다 */
  script: string;
}

/** template.json 의 `checks` 한 칸(빌드 · 동기화 테스트 전용, 런타임은 읽지 않음) */
export interface TemplateCheckDecl {
  id: string;
  script?: string;
}

/** 내장 검사 id → 정의 */
export const TEMPLATE_CHECK_DEFINITIONS: ReadonlyMap<string, TemplateCheckDefinition> = new Map([
  ["ontology-rules", { id: "ontology-rules", script: "check:ontology" }],
]);

/** 템플릿 slug → 돌릴 검사 id(정적 표). template.json `checks` 와 같은지 동기화 테스트가 봅니다 */
export const TEMPLATE_CHECKS: ReadonlyMap<string, readonly string[]> = new Map([["ontology-console", ["ontology-rules"]]]);

/** 템플릿 slug 형식 */
const TEMPLATE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 온톨로지 규칙 id(문구의 건수 순서) */
export const ONTOLOGY_RULE_IDS = ["em-dash", "exclamation", "one-side-line", "card-shadow", "palette"] as const;
export type OntologyRuleId = (typeof ONTOLOGY_RULE_IDS)[number];

/** 기본 검사 대상 디렉터리 */
export const ONTOLOGY_TARGETS = ["app", "components", "lib"] as const;
/** 파일 크기 상한(바이트). 넘으면 건너뜁니다 */
export const ONTOLOGY_MAX_FILE_BYTES = 256 * 1024;
/** 한 줄 길이 상한(UTF-16 글자 수). 넘는 줄이 있으면 건너뜁니다 */
export const ONTOLOGY_MAX_LINE_CHARS = 4096;
/** 디렉터리 깊이 상한 */
export const ONTOLOGY_DIR_DEPTH_LIMIT = 32;
/** 클래스 묶음 길이 상한(글자 수). 넘는 묶음은 보지 않습니다 */
export const ONTOLOGY_MAX_UNIT_CHARS = 8000;
/** 문구에 넣는 파일 경로 길이 상한(이스케이프 뒤 글자 수) */
const MESSAGE_PATH_MAX = 120;

/**
 * `axis.config.json` 의 `template` 값으로 돌릴 검사 id 를 고릅니다. 해당하지 않으면 빈 배열입니다.
 * 설정이 없거나 깨졌거나 값이 이상하면(문자열이 아님 · slug 형식이 아님 · 표에 없음) 조용히 빈 배열을 돌려줍니다.
 */
export function templateChecksFor(baseDirInput: string): { template: string; ids: readonly string[] } | null {
  let config: unknown;
  try {
    config = JSON.parse(readFileSync(path.join(path.resolve(baseDirInput), "axis.config.json"), "utf8"));
  } catch {
    return null;
  }
  if (typeof config !== "object" || config === null || Array.isArray(config)) return null;
  if (!Object.prototype.hasOwnProperty.call(config, "template")) return null;
  const template = (config as Record<string, unknown>).template;
  if (typeof template !== "string" || !TEMPLATE_SLUG.test(template)) return null;
  const ids = TEMPLATE_CHECKS.get(template);
  if (!ids || ids.length === 0) return null;
  return { template, ids };
}

/**
 * 적용한 템플릿의 규칙 검사 항목들(10번째 항목, WI-0107). 해당하지 않으면 빈 배열이라 종전 출력과 같습니다.
 * CLI `axis check` 와 MCP `axis.check_project` 가 같은 결과를 냅니다.
 */
export function collectTemplateCheckResults(baseDirInput: string): TemplateCheckResult[] {
  const baseDir = path.resolve(baseDirInput);
  const picked = templateChecksFor(baseDir);
  if (!picked) return [];
  const out: TemplateCheckResult[] = [];
  for (const id of picked.ids) {
    const def = TEMPLATE_CHECK_DEFINITIONS.get(id);
    if (def?.id === "ontology-rules") out.push(ontologyRulesResult(baseDir, picked.template, def));
  }
  return out;
}

/** 프로젝트 package.json scripts 에 그 이름이 있는가(안내를 붙일지) */
function hasPackageScript(baseDir: string, script: string): boolean {
  try {
    const pkg: unknown = JSON.parse(readFileSync(path.join(baseDir, "package.json"), "utf8"));
    if (typeof pkg !== "object" || pkg === null || Array.isArray(pkg)) return false;
    const scripts = (pkg as Record<string, unknown>).scripts;
    if (typeof scripts !== "object" || scripts === null || Array.isArray(scripts)) return false;
    return (
      Object.prototype.hasOwnProperty.call(scripts, script) && typeof (scripts as Record<string, unknown>)[script] === "string"
    );
  } catch {
    return false;
  }
}

/** 문구에 넣을 경로: 제어문자 · 줄바꿈 · 방향 제어 · 줄 구분 문자를 \uXXXX 로 바꾸고 길이를 자릅니다 */
export function messageSafePath(p: string): string {
  // eslint-disable-next-line no-control-regex
  const escaped = p.replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, (c) =>
    `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
  return escaped.length > MESSAGE_PATH_MAX ? `${escaped.slice(0, MESSAGE_PATH_MAX)}...` : escaped;
}

function ontologyRulesResult(baseDir: string, template: string, def: TemplateCheckDefinition): TemplateCheckResult {
  const name = `template.${def.id}`;
  const head = `템플릿 ${template} 규칙 검사(axis 내장 규칙, 설치한 axis 버전 기준 · 프로젝트 스크립트는 실행하지 않음)`;
  let inspection: OntologyInspection;
  try {
    inspection = inspectOntologyRules(baseDir);
  } catch (e) {
    const code = typeof (e as { code?: unknown })?.code === "string" && /^[A-Z0-9_]{1,32}$/.test((e as { code: string }).code)
      ? (e as { code: string }).code
      : "오류";
    return { name, severity: "warn", message: `${head}: 측정 실패, 파일을 읽지 못했습니다(${code})` };
  }
  const skipped = skippedNote(inspection);
  if (inspection.checked === 0) {
    return {
      name,
      severity: "warn",
      message: `${head}: 측정 실패, 검사할 파일이 없습니다(대상: ${ONTOLOGY_TARGETS.join(" · ")})${skipped}`,
    };
  }
  const { violations } = inspection;
  if (violations.length === 0) {
    return { name, severity: "pass", message: `${head}: 파일 ${inspection.checked}개, 위반 0건${skipped}` };
  }
  const counts = ONTOLOGY_RULE_IDS.map((rule) => [rule, violations.filter((v) => v.rule === rule).length] as const)
    .filter(([, n]) => n > 0)
    .map(([rule, n]) => `${rule} ${n}`)
    .join(" · ");
  const first = violations[0];
  const hint = hasPackageScript(baseDir, def.script) ? ` → 전체 보기: npm run ${def.script}` : "";
  return {
    name,
    severity: "warn",
    message: `${head}: 파일 ${inspection.checked}개, 위반 ${violations.length}건(${counts}), 첫 위치 "${messageSafePath(first.file)}":${first.line} ${first.rule}${skipped}${hint}`,
  };
}

function skippedNote(found: OntologyInspection): string {
  const parts: string[] = [];
  if (found.skippedLarge > 0) parts.push(`크기 상한(256KB · 한 줄 4,096자) 초과 ${found.skippedLarge}개`);
  if (found.skippedLinks > 0) parts.push(`프로젝트 밖 · 깨진 링크 ${found.skippedLinks}개`);
  if (found.skippedDeep > 0) parts.push(`깊이 ${ONTOLOGY_DIR_DEPTH_LIMIT} 단계 밖 디렉터리 ${found.skippedDeep}개`);
  return parts.length > 0 ? `, 건너뜀: ${parts.join(" · ")}` : "";
}

// --- 판정 엔진: apps/web/templates/ontology-console/files/scripts/check-ontology.mjs 와 같은 판정 ---
// 정규식 · 함수 이름을 스크립트와 맞춰 두었습니다. 한쪽을 고치면 다른 쪽도 고치고 패리티 테스트로 확인합니다.

/** 위반 하나(소스 조각은 담지 않음) */
export interface OntologyViolation {
  /** 프로젝트 기준 상대 경로(구분자 `/`) */
  file: string;
  line: number;
  rule: OntologyRuleId;
}

export interface OntologyInspection {
  /** 실제로 판정한 파일 수 */
  checked: number;
  violations: OntologyViolation[];
  /** 크기 · 줄 길이 상한으로 건너뛴 파일 수 */
  skippedLarge: number;
  /** 프로젝트 밖 · 깨진 링크로 건너뛴 수 */
  skippedLinks: number;
  /** 깊이 한도로 건너뛴 디렉터리 수 */
  skippedDeep: number;
}

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);
/** 긴 줄표 문자. 소스에 그 문자를 쓰지 않으려고 코드 포인트로 만듭니다 */
const EM_DASH = String.fromCharCode(0x2014);
/** 전각 느낌표 */
const FULLWIDTH_BANG = String.fromCharCode(0xff01);
const NEUTRAL_BORDER = new Set(["border-border", "border-input", "border-transparent", "border-inherit", "border-current"]);
const SIDE_WIDTH = /(?:^|\s|:)border-[lrse](?:-(?:0|2|4|8|\[[^\]]+\]))?(?=\s|$)/;
const BORDER_COLOR =
  /(?:^|\s|:)(border-(?:[lrse]-)?(?!(?:0|2|4|8|x|y|t|b|l|r|s|e|solid|dashed|dotted|double|none|hidden|collapse|separate|spacing)(?:\s|$))[a-z][\w-]*(?:\/\d+)?|border-(?:[lrse]-)?\[(?:#|rgb|hsl)[^\]]*\])(?=\s|$)/g;
/** 색이 아닌 테두리 클래스(두께 · 방향 · 선 모양) */
const BORDER_NOT_COLOR =
  /^border-(?:(?:[lrsetbxy])(?:-(?:0|2|4|8|\[[^\]]+\]))?|0|2|4|8|\[\d[^\]]*\]|solid|dashed|dotted|double|none|hidden|collapse|separate)$/;
const SHADOW = /(?:^|\s|:)shadow(?:-(?!none(?:\s|$))[\w[\]().,%-]+)?(?=\s|$)/;
const PALETTE_NAMES =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PALETTE_CLASS = new RegExp(
  `(?:^|[\\s:"'\`])((?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration|shadow|accent|caret|placeholder)-(?:(?:${PALETTE_NAMES})-\\d{2,3}|white|black)(?:\\/\\d+)?)(?=[\\s"'\`]|$)`,
  "g"
);
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
/** CSS 이름 색(transparent · currentColor · inherit 는 색이 아니라 통과) */
const NAMED_COLORS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue " +
    "chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey " +
    "darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray " +
    "darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen " +
    "fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen " +
    "lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime " +
    "limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue " +
    "mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive " +
    "olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum " +
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue " +
    "slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke " +
    "yellow yellowgreen"
  ).split(" ")
);
/** 색을 받는 CSS 속성(케밥) · style 객체 키(카멜) */
const CSS_COLOR_PROP =
  /(?:^|[;{\s])((?:background|border|outline|text-decoration|column-rule)(?:-(?:top|right|bottom|left|inline-start|inline-end))?(?:-color)?|color|fill|stroke|caret-color|accent-color|box-shadow)\s*:\s*([^;}]+)/g;
const STYLE_COLOR_KEY =
  /\b((?:background|border|outline|textDecoration|columnRule)(?:Top|Right|Bottom|Left|InlineStart|InlineEnd)?(?:Color)?|color|fill|stroke|caretColor|accentColor|boxShadow)\s*:\s*(["'`])([^"'`]*)\2/g;
const COLOR_FN = /\b(?:rgba?|hsla?)\(\s*\d/g;
const HANGUL = /[가-힣]/;

/** 주석을 같은 길이의 공백으로 바꿔 줄 번호를 지킵니다(앞이 : 인 // 는 URL 로 보고 남김). 블록 주석은 indexOf 로 선형으로 훑어요 */
function stripComments(src: string): string {
  const blank = (m: string) => m.replace(/[^\n]/g, " ");
  let out = "";
  let last = 0;
  for (let i = src.indexOf("/*"); i !== -1; i = src.indexOf("/*", last)) {
    const end = src.indexOf("*/", i + 2);
    if (end === -1) break;
    out += src.slice(last, i) + blank(src.slice(i, end + 2));
    last = end + 2;
  }
  out += src.slice(last);
  return out.replace(/(^|[^:'"`\\])(\/\/[^\n]*)/g, (_, pre: string, c: string) => pre + blank(c));
}

/** 줄 번호 찾기: 줄바꿈 위치 목록을 한 번 만들고 이분 탐색합니다 */
function lineIndex(src: string): (index: number) => number {
  const breaks: number[] = [];
  for (let i = src.indexOf("\n"); i !== -1; i = src.indexOf("\n", i + 1)) breaks.push(i);
  return (index) => {
    let lo = 0;
    let hi = breaks.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (breaks[mid] < index) lo = mid + 1;
      else hi = mid;
    }
    return lo + 1;
  };
}

interface TextChunk {
  text: string;
  index: number;
  kind: "string" | "jsx";
}

/** 문자열 리터럴과 JSX 텍스트 조각을 위치와 함께 돌려줍니다 */
function textChunks(code: string, isJsx: boolean): TextChunk[] {
  const out: TextChunk[] = [];
  const str = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  let m: RegExpExecArray | null;
  while ((m = str.exec(code))) out.push({ text: m[2], index: m.index, kind: "string" });
  if (isJsx) {
    const jsx = /[>}]([^<>{}]+)(?=[<{])/g;
    while ((m = jsx.exec(code))) {
      if (/[=;]/.test(m[1])) continue;
      const text = m[1].replace(/(["'`])(?:(?!\1)[^\n])*\1/g, " ");
      out.push({ text, index: m.index + 1, kind: "jsx" });
    }
  }
  return out;
}

/** open 위치의 여는 괄호에 짝이 맞는 닫는 괄호 위치(문자열 안 괄호는 건너뜀, 못 찾으면 -1). 안에서 연 괄호의 짝도 기억합니다 */
function closeMatcher(code: string): (open: number) => number {
  const memo = new Map<number, number>();
  const pair: Record<string, string> = { "(": ")", "{": "}" };
  return (open) => {
    const known = memo.get(open);
    if (known !== undefined) return known;
    const stack = [pair[code[open]]];
    const opens = [open];
    for (let i = open + 1; i < code.length; i++) {
      const c = code[i];
      if (c === '"' || c === "'" || c === "`") {
        for (i++; i < code.length && code[i] !== c; i++) if (code[i] === "\\") i++;
        continue;
      }
      if (c === "(" || c === "{") {
        stack.push(pair[c]);
        opens.push(i);
      } else if (c === stack[stack.length - 1]) {
        stack.pop();
        memo.set(opens.pop()!, i);
        if (stack.length === 0) return i;
      }
    }
    for (const p of opens) memo.set(p, -1);
    return -1;
  };
}

/** 코드 조각 안 문자열 리터럴 내용을 공백으로 이어 붙입니다 */
function joinStrings(expr: string): string {
  return [...expr.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)].map((x) => x[2]).join(" ");
}

/** at 위치에서 `<Card` 태그가 시작하는가(뒤가 단어 글자가 아니거나 end) */
function isCardTagAt(code: string, at: number, end: number): boolean {
  if (at < 0 || at + 5 > end || !code.startsWith("<Card", at)) return false;
  const next = at + 5;
  return next >= end || !/\w/.test(code[next]);
}

/** index 이하에서 가장 가까운 `<` 위치. 위치가 늘어나는 순서로만 물어서 한 번만 훑어요 */
function lastLtFinder(code: string): (index: number) => number {
  let pos = 0;
  let last = -1;
  return (index) => {
    for (; pos <= index && pos < code.length; pos++) if (code[pos] === "<") last = pos;
    return last;
  };
}

interface ClassUnit {
  text: string;
  index: number;
  card: boolean;
}

/** `<Card ... className="..."` 의 className 문자열(정규식 /<Card\b(?:[^<>]|=>)*?className="([^"]*)"/g 와 같은 결과, 선형) */
function cardClassStrings(code: string): ClassUnit[] {
  const out: ClassUnit[] = [];
  let from = 0;
  let noQuoteAfter = Infinity;
  for (let at = code.indexOf("<Card", from); at !== -1; at = code.indexOf("<Card", from)) {
    from = at + 1;
    if (!isCardTagAt(code, at, code.length)) continue;
    for (let k = at + 5; k < code.length; k++) {
      if (k + 11 <= code.length && code.startsWith('className="', k) && k + 11 < noQuoteAfter) {
        const q = code.indexOf('"', k + 11);
        if (q !== -1) {
          out.push({ text: code.slice(k + 11, q), index: at, card: true });
          from = q + 1;
          break;
        }
        noQuoteAfter = k + 11;
      }
      const c = code[k];
      if (c === "<") break;
      if (c === ">" && !(k - 1 >= at + 5 && code[k - 1] === "=")) break;
    }
  }
  return out;
}

/** 클래스 묶음: className={...} 표현식과 cn() · clsx() · cva() · twMerge() 인자 안의 문자열을 하나로 합칩니다 */
function classUnits(code: string): ClassUnit[] {
  const out: ClassUnit[] = [];
  const matchClose = closeMatcher(code);
  const lastLt = lastLtFinder(code);
  let m: RegExpExecArray | null;
  const attr = /className=\{/g;
  while ((m = attr.exec(code))) {
    const open = m.index + m[0].length - 1;
    const close = matchClose(open);
    if (close === -1 || close - open + 1 > ONTOLOGY_MAX_UNIT_CHARS) continue;
    out.push({ text: joinStrings(code.slice(open, close + 1)), index: m.index, card: isCardTagAt(code, lastLt(m.index), m.index) });
  }
  const call = /\b(?:cn|clsx|cva|twMerge)\(/g;
  while ((m = call.exec(code))) {
    const open = m.index + m[0].length - 1;
    const close = matchClose(open);
    if (close === -1 || close - open + 1 > ONTOLOGY_MAX_UNIT_CHARS) continue;
    out.push({ text: joinStrings(code.slice(open, close + 1)), index: m.index, card: false });
  }
  out.push(...cardClassStrings(code));
  return out;
}

/** CSS 규칙(선택자 { 본문 })을 한 번 훑어 나눕니다(정규식 /([^{}]+)\{([^{}]*)\}/g 와 같은 결과, 선형) */
function cssRules(code: string): Array<{ selector: string; body: string; open: number }> {
  const out: Array<{ selector: string; body: string; open: number }> = [];
  const nextBrace = (from: number) => {
    for (let k = from; k < code.length; k++) if (code[k] === "{" || code[k] === "}") return k;
    return -1;
  };
  let i = 0;
  while (i < code.length) {
    if (code[i] === "{" || code[i] === "}") {
      i++;
      continue;
    }
    const open = nextBrace(i);
    if (open === -1) break;
    if (code[open] !== "{") {
      i = open + 1;
      continue;
    }
    const close = nextBrace(open + 1);
    if (close === -1) break;
    if (code[close] !== "}") {
      i = open + 1;
      continue;
    }
    out.push({ selector: code.slice(i, open), body: code.slice(open + 1, close), open });
    i = close + 1;
  }
  return out;
}

/** 한쪽 테두리 폭 클래스와 함께 쓴, 중립이 아닌 테두리 색 클래스 */
function oneSideColors(t: string): string[] {
  if (!SIDE_WIDTH.test(t)) return [];
  return [...t.matchAll(BORDER_COLOR)]
    .map((x) => x[1])
    .filter((c) => !NEUTRAL_BORDER.has(c.replace(/^border-[lrse]-/, "border-")) && !BORDER_NOT_COLOR.test(c));
}

/** 카드로 볼 클래스 묶음인가: <Card · bg-card · 카드 모양(rounded-* 와 border 를 함께) */
function isCardLike(t: string, card: boolean): boolean {
  return (
    card ||
    /(?:^|\s)bg-card(?=\s|$)/.test(t) ||
    (/(?:^|\s)rounded(?:-[\w[\]]+)?(?=\s|$)/.test(t) && /(?:^|\s)border(?:-(?:0|2|4|8))?(?=\s|$)/.test(t))
  );
}

/** CSS 값 또는 style 값이 한쪽 색 선인가 */
function sideValueColored(value: string): boolean {
  const v = value.trim();
  const neutral = /^(?:0|none|hidden)$/.test(v) || /var\(--border\)|hsl\(var\(--border\)\)|transparent|currentColor/.test(v);
  const colored = /#|rgb|hsl|var\(--/.test(v) || v.split(/[\s,()]+/).some((w) => NAMED_COLORS.has(w.toLowerCase()));
  return colored && !neutral;
}

/** 한 줄이라도 상한보다 긴가 */
function hasLongLine(src: string): boolean {
  let start = 0;
  for (let i = src.indexOf("\n"); ; i = src.indexOf("\n", start)) {
    const end = i === -1 ? src.length : i;
    if (end - start > ONTOLOGY_MAX_LINE_CHARS) return true;
    if (i === -1) return false;
    start = i + 1;
  }
}

/** 소스 하나의 위반(줄 · 규칙). 같은 줄 · 같은 규칙은 한 번만 냅니다 */
export function inspectOntologySource(raw: string, ext: string): Array<{ line: number; rule: OntologyRuleId }> {
  const out: Array<{ line: number; rule: OntologyRuleId }> = [];
  const seen = new Set<string>();
  const code = stripComments(raw);
  const lineOf = lineIndex(raw);
  const report = (index: number, rule: OntologyRuleId) => {
    const line = lineOf(index);
    const key = `${line}:${rule}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ line, rule });
  };

  // 1. 긴 줄표: 주석 안까지 봅니다
  for (let i = raw.indexOf(EM_DASH); i !== -1; i = raw.indexOf(EM_DASH, i + 1)) report(i, "em-dash");

  if (ext === ".css") {
    // 3. CSS 한쪽 색 선
    const side = /border-(?:left|right|inline-start|inline-end)(?:-color)?\s*:\s*([^;}]+)/g;
    let m: RegExpExecArray | null;
    while ((m = side.exec(code))) {
      if (sideValueColored(m[1])) report(m.index, "one-side-line");
    }
    // 4. 선택자에 card 가 든 규칙의 box-shadow
    for (const r of cssRules(code)) {
      if (/card/i.test(r.selector) && /box-shadow\s*:(?!\s*(?:none\b|0 0 #0000))/.test(r.body)) report(r.open, "card-shadow");
    }
  } else {
    const isJsx = ext === ".tsx" || ext === ".jsx";
    for (const chunk of textChunks(code, isJsx)) {
      const t = chunk.text;
      // 2. 느낌표가 든 한글 문구
      if (HANGUL.test(t) && (t.includes("!") || t.includes(FULLWIDTH_BANG))) report(chunk.index, "exclamation");
      if (chunk.kind !== "string") continue;
      // 3 · 4. 문자열 하나 안의 클래스
      if (oneSideColors(t).length > 0) report(chunk.index, "one-side-line");
      if (isCardLike(t, false) && SHADOW.test(t)) report(chunk.index, "card-shadow");
    }
    // 3 · 4. 여러 문자열로 나뉜 클래스 묶음
    for (const unit of classUnits(code)) {
      const t = unit.text;
      if (oneSideColors(t).length > 0) report(unit.index, "one-side-line");
      if (isCardLike(t, unit.card) && SHADOW.test(t)) report(unit.index, "card-shadow");
    }
    // 3 · 4 · 5. style 객체
    const lastLt = lastLtFinder(code);
    let m: RegExpExecArray | null;
    STYLE_COLOR_KEY.lastIndex = 0;
    while ((m = STYLE_COLOR_KEY.exec(code))) {
      const key = m[1];
      const value = m[3];
      if (/^border(?:Left|Right|InlineStart|InlineEnd)(?:Color)?$/.test(key) && sideValueColored(value)) {
        report(m.index, "one-side-line");
      }
      if (key === "boxShadow" && !/^(?:none|0 0 #0000)$/.test(value.trim())) {
        if (isCardTagAt(code, lastLt(m.index), code.length)) report(m.index, "card-shadow");
      }
      if (value.split(/[\s,()]+/).some((w) => NAMED_COLORS.has(w.toLowerCase()))) report(m.index, "palette");
    }
  }

  // 5. CSS 이름 색
  if (ext === ".css") {
    let m: RegExpExecArray | null;
    CSS_COLOR_PROP.lastIndex = 0;
    while ((m = CSS_COLOR_PROP.exec(code))) {
      if (m[2].split(/[\s,()]+/).some((w) => NAMED_COLORS.has(w.toLowerCase()))) report(m.index, "palette");
    }
  }

  // 5. 팔레트 밖 리터럴 색(주석 제외)
  let m: RegExpExecArray | null;
  HEX.lastIndex = 0;
  while ((m = HEX.exec(code))) {
    if (code[m.index - 1] === "&") continue; // HTML 엔티티(&#123;)
    if (/[\w/]/.test(code[m.index - 1] ?? "")) continue; // URL 조각(/entities#abc)
    if (/(?:href|to|id)=\{?\s*["'`]$/.test(code.slice(Math.max(0, m.index - 12), m.index))) continue; // 앵커(href="#add")
    report(m.index, "palette");
  }
  COLOR_FN.lastIndex = 0;
  while ((m = COLOR_FN.exec(code))) report(m.index, "palette");
  PALETTE_CLASS.lastIndex = 0;
  while ((m = PALETTE_CLASS.exec(code))) report(m.index, "palette");
  return out;
}

interface FoundFile {
  /** 표시 경로(프로젝트 기준, 링크 이름 그대로) */
  rel: string;
  real: string;
  ext: string;
}

/** 검사할 파일 목록. 읽기 오류는 그대로 던져 측정 실패로 다룹니다 */
function collectOntologyFiles(baseDir: string, targets: readonly string[]) {
  const rootReal = realpathSync(baseDir);
  const found = { files: [] as FoundFile[], skippedLarge: 0, skippedLinks: 0, skippedDeep: 0 };
  const visitedDirs = new Set<string>();
  const seenFiles = new Set<string>();
  const toRel = (p: string) => path.relative(baseDir, p).split(path.sep).join("/");

  const resolveEntry = (p: string, st: Stats): { st: Stats; real: string | undefined } | undefined => {
    if (!st.isSymbolicLink()) return { st, real: undefined };
    let real: string;
    let target: Stats;
    try {
      real = realpathSync(p);
      target = statSync(real);
    } catch {
      found.skippedLinks++;
      return undefined;
    }
    if (!isSameOrInside(rootReal, real)) {
      found.skippedLinks++;
      return undefined;
    }
    return { st: target, real };
  };

  const addFile = (p: string, real: string, st: Stats, ext: string) => {
    if (seenFiles.has(real)) return;
    seenFiles.add(real);
    if (st.size > ONTOLOGY_MAX_FILE_BYTES) {
      found.skippedLarge++;
      return;
    }
    found.files.push({ rel: toRel(p), real, ext });
  };

  const walk = (dir: string, dirReal: string, depth: number) => {
    const names = readdirSync(dir).sort();
    for (const name of names) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      const p = path.join(dir, name);
      const entry = resolveEntry(p, lstatSync(p));
      if (!entry) continue;
      const real = entry.real ?? path.join(dirReal, name);
      if (entry.st.isDirectory()) {
        if (visitedDirs.has(real)) continue;
        if (depth >= ONTOLOGY_DIR_DEPTH_LIMIT) {
          found.skippedDeep++;
          continue;
        }
        visitedDirs.add(real);
        walk(p, real, depth + 1);
      } else if (entry.st.isFile() && EXTS.has(path.extname(name))) {
        addFile(p, real, entry.st, path.extname(name));
      }
    }
  };

  for (const t of targets) {
    const p = path.join(baseDir, t);
    let st: Stats;
    try {
      st = lstatSync(p);
    } catch (e) {
      if ((e as { code?: unknown })?.code === "ENOENT") continue;
      throw e;
    }
    const entry = resolveEntry(p, st);
    if (!entry) continue;
    const real = entry.real ?? realpathSync(p);
    if (!isSameOrInside(rootReal, real)) {
      found.skippedLinks++;
      continue;
    }
    if (entry.st.isDirectory()) {
      if (visitedDirs.has(real)) continue;
      visitedDirs.add(real);
      walk(p, real, 1);
    } else if (entry.st.isFile() && EXTS.has(path.extname(p))) {
      addFile(p, real, entry.st, path.extname(p));
    }
  }
  return found;
}

/**
 * 온톨로지 콘솔 5규칙을 판정합니다(읽기 전용, 스크립트를 실행하지 않음). 파일 목록 · 읽기 오류는 던집니다.
 * `targets` 는 테스트 · 패리티용이고 axis check 는 기본값(app · components · lib)만 씁니다.
 */
export function inspectOntologyRules(baseDirInput: string, targets: readonly string[] = ONTOLOGY_TARGETS): OntologyInspection {
  const baseDir = path.resolve(baseDirInput);
  const found = collectOntologyFiles(baseDir, targets);
  const violations: OntologyViolation[] = [];
  let checked = 0;
  for (const f of found.files) {
    const raw = readFileSync(f.real, "utf8");
    if (hasLongLine(raw)) {
      found.skippedLarge++;
      continue;
    }
    checked++;
    for (const v of inspectOntologySource(raw, f.ext)) violations.push({ file: f.rel, line: v.line, rule: v.rule });
  }
  return { checked, violations, skippedLarge: found.skippedLarge, skippedLinks: found.skippedLinks, skippedDeep: found.skippedDeep };
}
