/**
 * library 데이터 오프라인 검사 (WI-0057 FR-4)
 *
 * `apps/web/public/library` 의 문서 링크와 파일 간 정합을 네트워크 없이 검사합니다.
 *
 * 판정
 *   1. 문서 라우트: library JSON 어디에든 나오는 사이트 주소(https://axis-design-system.pages.dev/...) 링크마다
 *      문서 앱에 그 라우트(`apps/web/src/app/(docs)/<경로>/page.tsx`)가 있어야 합니다.
 *      배포된 사이트의 404 를 머지 전에 잡기 위한 판정입니다(2026-10-23 실측: 네트워크 GET 결과와 같은 7건).
 *      라우트 그룹 `(docs)` 밖의 페이지(`apps/web/src/app/<경로>/page.tsx`)도 실재로 인정합니다.
 *   2. 집합 정합: index.json · search-index.json · categories/*.json 의 항목 id 집합이 같아야 합니다.
 *   3. 카테고리: categories/<id>.json 의 항목 category 가 파일과 같고 count 가 항목 수와 같아야 합니다.
 *      index.json 의 categories 와 categories/*.json 파일 집합이 같아야 합니다.
 *   4. 컴포넌트 파일 (WI-0060): index.json 항목마다 components/<id>.json 이 있고, 그 파일의 id · slug · category ·
 *      source.type 이 항목과 같아야 합니다. 어느 항목도 가리키지 않는 파일은 위반입니다.
 *   6. 상세 주소 (WI-0060): 상세 화면 주소 /library/<category>/<slug> 가 항목마다 하나여야 합니다((category, slug) 중복은 위반).
 *      search-index.json 의 url 은 그 주소와 같고, search-index · categories 항목의 slug · category 는 index.json 과 같아야 합니다.
 *      카테고리가 다른 같은 slug(예: shadcn data-display/badge 와 axis ui/badge)는 주소가 달라 위반이 아니고 개수만 알립니다.
 *   5. 통계: index.json · meta.json 의 stats 가 index.json 항목에서 센 값과 같아야 합니다.
 *   7. code 모양 (WI-0083): components/<id>.json 의 code 가 상세 화면(component-detail-content.tsx)이 바로 읽는 모양이어야 합니다.
 *      code 는 객체, code.files 는 배열이고 원소마다 path · content 가 문자열, code.dependencies · code.registryDeps 는
 *      문자열 배열. 화면은 이 값을 검사 없이 읽어서 빠지면 그 항목 상세 화면이 깨집니다. e2e/library-reps.cjs 는 대표 3개만
 *      읽으므로 나머지 항목의 모양은 여기서만 봅니다.
 *
 * 옵션
 *   --library <dir>   library 디렉터리 (기본: apps/web/public/library)
 *   --app <dir>       문서 앱 app 디렉터리 (기본: apps/web/src/app)
 *   --site <url>      사이트 주소 (기본: https://axis-design-system.pages.dev)
 *
 * 종료 코드
 *   0: 위반 0건이면서 사이트 링크 1건 이상 · 항목 1개 이상을 검사함
 *   1: 위반 있음
 *   2: 측정 실패 (디렉터리 · 파일 없음, 사이트 링크 0건, 항목 0개)
 */

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const opts = {
    library: "apps/web/public/library",
    app: "apps/web/src/app",
    site: "https://axis-design-system.pages.dev",
  };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === "--library" || key === "--app" || key === "--site") {
      if (!value) fail(`${key} 값이 없습니다`);
      opts[key.slice(2)] = value;
      i++;
    } else {
      fail(`알 수 없는 옵션: ${key}`);
    }
  }
  return opts;
}

function fail(message) {
  console.error(`측정 실패: ${message}`);
  process.exit(2);
}

function readJson(file) {
  if (!fs.existsSync(file)) fail(`파일이 없습니다: ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function listJson(dir) {
  if (!fs.existsSync(dir)) fail(`디렉터리가 없습니다: ${dir}`);
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort()
    .map((n) => path.join(dir, n));
}

const opts = parseArgs(process.argv.slice(2));
const libraryDir = path.resolve(opts.library);
const appDir = path.resolve(opts.app);
if (!fs.existsSync(appDir)) fail(`문서 앱 디렉터리가 없습니다: ${appDir}`);
const site = opts.site.replace(/\/+$/, "");

const violations = { route: [], set: [], category: [], file: [], route_key: [], stats: [], code: [] };

/**
 * 상세 화면이 읽는 code 모양 판정 (7). 위반 문구 배열을 돌려준다
 * @param {unknown} code
 */
function codeShapeProblems(code) {
  if (!code || typeof code !== "object" || Array.isArray(code)) return ["code 가 객체가 아닙니다"];
  const out = [];
  if (!Array.isArray(code.files)) out.push("code.files 가 배열이 아닙니다");
  else {
    code.files.forEach((f, i) => {
      if (!f || typeof f !== "object") out.push(`code.files[${i}] 가 객체가 아닙니다`);
      else for (const k of ["path", "content"]) if (typeof f[k] !== "string") out.push(`code.files[${i}].${k} 가 문자열이 아닙니다`);
    });
  }
  for (const k of ["dependencies", "registryDeps"]) {
    if (!Array.isArray(code[k])) out.push(`code.${k} 가 배열이 아닙니다`);
    else if (code[k].some((d) => typeof d !== "string")) out.push(`code.${k} 에 문자열이 아닌 값이 있습니다`);
  }
  return out;
}

// ---- 1. 문서 라우트 ----
const allFiles = [
  path.join(libraryDir, "index.json"),
  path.join(libraryDir, "search-index.json"),
  path.join(libraryDir, "meta.json"),
  ...listJson(path.join(libraryDir, "categories")),
  ...listJson(path.join(libraryDir, "components")),
];
const escaped = site.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const linkPattern = new RegExp(`${escaped}(/[^\\s"'\`<>)\\\\]*)?`, "g");
const links = new Map(); // 경로 -> 처음 나온 파일
for (const file of allFiles) {
  if (!fs.existsSync(file)) fail(`파일이 없습니다: ${file}`);
  const raw = fs.readFileSync(file, "utf-8");
  for (const m of raw.matchAll(linkPattern)) {
    const p = (m[1] || "/").split(/[?#]/)[0].replace(/\/+$/, "");
    if (!links.has(p)) links.set(p, path.relative(libraryDir, file));
  }
}
if (links.size === 0) fail(`사이트 링크(${site})를 하나도 찾지 못했습니다. 주소나 경로를 확인하세요`);

function routeExists(routePath) {
  if (routePath === "") return fs.existsSync(path.join(appDir, "(marketing)", "page.tsx")) || fs.existsSync(path.join(appDir, "page.tsx"));
  const rel = routePath.replace(/^\//, "");
  const groups = fs
    .readdirSync(appDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\(.+\)$/.test(e.name))
    .map((e) => e.name);
  const candidates = [path.join(appDir, rel, "page.tsx"), ...groups.map((g) => path.join(appDir, g, rel, "page.tsx"))];
  // 정적 파일(예: /r/index.json, /schema.json)은 public 아래에 있으면 실재로 봅니다
  candidates.push(path.join(libraryDir, "..", rel));
  return candidates.some((c) => fs.existsSync(c) && fs.statSync(c).isFile());
}
for (const [p, file] of [...links.entries()].sort()) {
  if (!routeExists(p)) violations.route.push(`${site}${p} (처음 나온 곳: ${file})`);
}

// ---- 2 · 3 · 4 · 5. 정합 ----
const index = readJson(path.join(libraryDir, "index.json"));
const search = readJson(path.join(libraryDir, "search-index.json"));
const meta = readJson(path.join(libraryDir, "meta.json"));
if (!Array.isArray(index.components) || index.components.length === 0) fail("index.json 항목이 0개입니다");

const indexIds = new Set(index.components.map((c) => c.id));
const searchIds = new Set(search.map((c) => c.id));
const categoryIds = new Set();
const categoryFiles = listJson(path.join(libraryDir, "categories"));
const categoryFileIds = new Set(categoryFiles.map((f) => path.basename(f, ".json")));
const declared = new Set((index.categories || []).map((c) => c.id));
for (const id of declared) if (!categoryFileIds.has(id)) violations.category.push(`categories/${id}.json 이 없습니다`);
for (const id of categoryFileIds) if (!declared.has(id)) violations.category.push(`categories/${id}.json 이 index.json categories 에 없습니다`);
for (const file of categoryFiles) {
  const data = readJson(file);
  const name = path.basename(file);
  if (data.count !== data.components.length) violations.category.push(`${name}: count ${data.count} ≠ 항목 ${data.components.length}`);
  for (const c of data.components) {
    categoryIds.add(c.id);
    if (c.category !== data.category) violations.category.push(`${name}: ${c.id} 의 category 가 ${c.category}`);
  }
}
const diff = (a, b) => [...a].filter((x) => !b.has(x)).sort();
for (const [label, a, b] of [
  ["index.json 에만", indexIds, searchIds],
  ["search-index.json 에만", searchIds, indexIds],
  ["index.json 에 있고 categories 에 없음", indexIds, categoryIds],
  ["categories 에 있고 index.json 에 없음", categoryIds, indexIds],
]) {
  const d = diff(a, b);
  if (d.length) violations.set.push(`${label} ${d.length}개: ${d.join(", ")}`);
}
const dupIds = index.components.length - indexIds.size;
if (dupIds) violations.set.push(`index.json 에 같은 id 가 ${dupIds}번 더 나옵니다`);

// ---- 4. 컴포넌트 파일: components/<id>.json (WI-0060) ----
const entryById = new Map(index.components.map((c) => [c.id, c]));
const componentFiles = listJson(path.join(libraryDir, "components"));
const fileIds = new Set();
for (const file of componentFiles) {
  const key = path.basename(file, ".json");
  fileIds.add(key);
  const data = readJson(file);
  for (const problem of codeShapeProblems(data?.code)) violations.code.push(`components/${key}.json: ${problem}`);
  const entry = entryById.get(key);
  if (!entry) {
    violations.file.push(`components/${key}.json: index.json 에 id ${key} 항목이 없습니다`);
    continue;
  }
  if (data.id !== key) violations.file.push(`components/${key}.json: 파일 id 가 ${data.id}`);
  if (data.slug !== entry.slug) violations.file.push(`components/${key}.json: slug ${data.slug} ≠ index.json ${entry.slug}`);
  if (data.category !== entry.category) violations.file.push(`components/${key}.json: category ${data.category} ≠ index.json ${entry.category}`);
  if (data.source?.type !== entry.source) violations.file.push(`components/${key}.json: source ${data.source?.type} ≠ index.json ${entry.source}`);
}
for (const id of entryById.keys()) {
  if (!fileIds.has(id)) violations.file.push(`components/${id}.json 이 없습니다`);
}

// ---- 6. 상세 주소: /library/<category>/<slug> 가 항목마다 하나 (WI-0060) ----
const routeOf = (c) => `/library/${c.category}/${c.slug}`;
const routeToIds = new Map();
const slugToIds = new Map();
for (const c of index.components) {
  if (!routeToIds.has(routeOf(c))) routeToIds.set(routeOf(c), []);
  routeToIds.get(routeOf(c)).push(c.id);
  if (!slugToIds.has(c.slug)) slugToIds.set(c.slug, []);
  slugToIds.get(c.slug).push(c.id);
}
for (const [route, ids] of [...routeToIds.entries()].sort()) {
  if (ids.length > 1) violations.route_key.push(`${route} 를 ${ids.length}개 항목이 씁니다: ${ids.join(", ")}`);
}
for (const s of search) {
  const entry = entryById.get(s.id);
  if (!entry) continue; // 집합 불일치(2)에서 셉니다
  if (s.slug !== entry.slug || s.category !== entry.category) {
    violations.route_key.push(`search-index.json ${s.id}: ${s.category}/${s.slug} ≠ index.json ${entry.category}/${entry.slug}`);
  }
  if (s.url !== routeOf(entry)) violations.route_key.push(`search-index.json ${s.id}: url ${s.url} ≠ ${routeOf(entry)}`);
}
for (const file of categoryFiles) {
  for (const c of readJson(file).components) {
    const entry = entryById.get(c.id);
    if (entry && (c.slug !== entry.slug || c.category !== entry.category)) {
      violations.route_key.push(`${path.basename(file)} ${c.id}: ${c.category}/${c.slug} ≠ index.json ${entry.category}/${entry.slug}`);
    }
  }
}
// 카테고리가 실제로 갈리는 slug 만 센다(같은 카테고리 안의 중복은 위반 쪽에서 따로 잡힌다)
const crossCategorySlugs = [...slugToIds.values()].filter(
  (ids) => ids.length > 1 && new Set(ids.map((id) => entryById.get(id)?.category)).size > 1,
).length;

const expected = { total: index.components.length, bySource: {}, byCategory: {} };
for (const c of index.components) {
  expected.bySource[c.source] = (expected.bySource[c.source] || 0) + 1;
  expected.byCategory[c.category] = (expected.byCategory[c.category] || 0) + 1;
}
const sameCounts = (a, b) => {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  return [...keys].every((k) => (a || {})[k] === (b || {})[k]);
};
for (const [label, stats] of [["index.json", index.stats], ["meta.json", meta.stats]]) {
  if (!stats || stats.total !== expected.total || !sameCounts(stats.bySource, expected.bySource) || !sameCounts(stats.byCategory, expected.byCategory)) {
    violations.stats.push(`${label} stats ${JSON.stringify(stats)} ≠ 실제 ${JSON.stringify(expected)}`);
  }
}

// ---- 보고 ----
const labels = {
  route: "문서 라우트 없음",
  set: "집합 불일치",
  category: "카테고리 불일치",
  file: "컴포넌트 파일 불일치",
  route_key: "상세 주소 중복 · 불일치",
  stats: "통계 불일치",
  code: "code 모양 불일치",
};
let total = 0;
for (const [key, list] of Object.entries(violations)) {
  total += list.length;
  if (list.length === 0) continue;
  console.log(`\n[${labels[key]}] ${list.length}건`);
  for (const v of list) console.log(`  - ${v}`);
}
console.log(
  `\n검사: 사이트 링크 ${links.size}개 · 항목 ${index.components.length}개 · 컴포넌트 파일 ${componentFiles.length}개 · 카테고리 ${categoryFiles.length}개`
);
console.log(
  `상세 주소 ${routeToIds.size}개 (항목 ${index.components.length}개) · 카테고리가 달라 주소로 구분되는 같은 slug ${crossCategorySlugs}개 (위반 아님)`
);
if (total > 0) {
  console.log(`위반 ${total}건 (라우트 ${violations.route.length})`);
  process.exit(1);
}
console.log("위반 0건");
