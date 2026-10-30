/**
 * AXIS MCP 템플릿 도구
 *
 * CLI의 template 로직을 MCP tool로 래핑하여 AI 에이전트가 활용할 수 있게 합니다.
 */

import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";
import {
  THEME_MARKUP_BRAND_MIN_VERSION,
  inspectBrandActivation,
  inspectBrandImport,
  type BrandActivationCheck,
  type BrandImportCheck,
} from "./brand-core.js";
import {
  checkAnimationPlugin,
  checkGlobalsCss,
  checkTailwindContent,
  checkTailwindSetup,
  versionGateLabel,
} from "@axis-ds/registry-core/tailwind-core";
import { checkDependencies } from "@axis-ds/registry-core/dependencies-core";
import {
  planTemplateFiles,
  resolveTemplatePath,
  writeTemplateFiles,
  type TemplateFileAction,
} from "@axis-ds/registry-core/apply-files";
import { PNP_ROOT_ONLY_NOTE, addCommandFor, cssImportViaNote, detectInstallCommand, globalCssSelectionNote } from "@axis-ds/registry-core/project";
import { AXIS_SITE_URL } from "../site.js";

// --- 타입 ---

interface TemplateIndexEntry {
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  author?: string;
  tags: string[];
  features: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

interface TemplateIndex {
  version: string;
  updatedAt: string;
  total: number;
  templates: TemplateIndexEntry[];
}

interface TemplateFile {
  path: string;
  content: string;
  type: string;
}

interface PostInstallPatch {
  file: string;
  type: "replace" | "append" | "prepend" | "json-merge";
  search?: string;
  value?: string;
  merge?: Record<string, unknown>;
}

interface TemplateDetail extends TemplateIndexEntry {
  files: TemplateFile[];
  postInstall?: PostInstallPatch[];
  updatedAt: string;
}

type DiffStatus = "added" | "modified" | "unchanged" | "extra";

interface DiffEntry {
  path: string;
  status: DiffStatus;
  localLines?: number;
  remoteLines?: number;
}

type CheckSeverity = "pass" | "warn" | "fail";

interface CheckResult {
  name: string;
  severity: CheckSeverity;
  message: string;
}

// --- 레지스트리 클라이언트 ---

const TEMPLATE_REGISTRY_URL =
  process.env.AXIS_TEMPLATE_URL || `${AXIS_SITE_URL}/templates`;

async function fetchTemplateIndex(): Promise<TemplateIndex> {
  const url = `${TEMPLATE_REGISTRY_URL}/index.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`템플릿 인덱스를 가져올 수 없습니다 (${res.status}): ${url}`);
  }
  return (await res.json()) as TemplateIndex;
}

async function fetchTemplateDetail(slug: string): Promise<TemplateDetail> {
  const url = `${TEMPLATE_REGISTRY_URL}/${slug}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`'${slug}' 템플릿을 찾을 수 없습니다 (${res.status}): ${url}`);
  }
  return (await res.json()) as TemplateDetail;
}

// --- 핸들러 파라미터/결과 타입 ---

export interface ListTemplatesParams {
  category?: string;
}

export interface ListTemplatesResult {
  total: number;
  templates: { name: string; slug: string; description: string; category: string }[];
}

export interface GetTemplateParams {
  name: string;
}

export interface GetTemplateResult {
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  features: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  files: string[];
}

export interface ApplyTemplateParams {
  name: string;
  targetDir: string;
  dryRun?: boolean;
}

export interface ApplyTemplateResult {
  success: boolean;
  templateName: string;
  /** WI-0088: `merged` 는 기존 package.json · axis.config.json 과 합친 파일, `note` 는 JSON 으로 읽을 수 없어 덮어쓴 경우 등의 알림 */
  files: { path: string; action: TemplateFileAction; note?: string }[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  dryRun: boolean;
  /**
   * 대상 디렉터리의 lockfile · `packageManager` 로 고른 설치 명령(WI-0085, `detectInstallCommand`). 「필요한 의존성」 명령의 매니저를 정합니다.
   * 없으면(종전 결과 객체) 포매터가 pnpm 으로 안내합니다.
   */
  installCommand?: string;
}

export interface DiffTemplateParams {
  name: string;
  targetDir?: string;
}

export interface DiffTemplateResult {
  templateName: string;
  entries: DiffEntry[];
  summary: { added: number; modified: number; unchanged: number; extra: number };
}

export interface CheckProjectParams {
  targetDir?: string;
}

export interface CheckProjectResult {
  results: CheckResult[];
  summary: { pass: number; warn: number; fail: number };
}

// --- 핸들러 ---

/** 템플릿 목록 조회 */
export async function handleListTemplates(
  params: ListTemplatesParams
): Promise<ListTemplatesResult> {
  const index = await fetchTemplateIndex();
  let templates = index.templates;

  if (params.category) {
    templates = templates.filter((t) => t.category === params.category);
  }

  return {
    total: templates.length,
    templates: templates.map((t) => ({
      name: t.name,
      slug: t.slug,
      description: t.description,
      category: t.category,
    })),
  };
}

/** 템플릿 상세 정보 조회 */
export async function handleGetTemplate(
  params: GetTemplateParams
): Promise<GetTemplateResult> {
  const detail = await fetchTemplateDetail(params.name);
  return {
    name: detail.name,
    slug: detail.slug,
    description: detail.description,
    category: detail.category,
    version: detail.version,
    features: detail.features,
    dependencies: detail.dependencies || {},
    devDependencies: detail.devDependencies || {},
    files: detail.files.map((f) => f.path),
  };
}

/** 템플릿 적용 */
export async function handleApplyTemplate(
  params: ApplyTemplateParams
): Promise<ApplyTemplateResult> {
  const detail = await fetchTemplateDetail(params.name);
  const baseDir = path.resolve(params.targetDir);
  // 의존성 안내의 매니저는 템플릿 파일(package.json 포함)을 쓰기 전의 프로젝트로 고릅니다(WI-0085, CLI template apply 와 같음)
  const installCommand = detectInstallCommand(baseDir);
  // WI-0088: 쓸 내용은 CLI 와 같은 코어로 정합니다(package.json · axis.config.json 은 기존 파일과 합침). 쓰는 도중 실패하면
  // 코어가 건드린 파일을 되돌리고 TemplateApplyError 를 던지며, 도구 등록부가 오류 응답으로 돌려줍니다
  // Q107: 템플릿 경로 · postInstall 대상이 targetDir 밖이면 아무것도 읽거나 쓰지 않고 TemplatePathError(CLI 와 같은 문구)
  const plan = planTemplateFiles(baseDir, detail.files, (detail.postInstall ?? []).map((p) => p.file));
  if (!params.dryRun) writeTemplateFiles(plan);
  const files: ApplyTemplateResult["files"] = plan.map((item) => ({
    path: item.path,
    action: item.action,
    ...(item.note ? { note: item.note } : {}),
  }));

  // postInstall 패치 (dry-run이 아닌 경우만)
  if (!params.dryRun && detail.postInstall?.length) {
    for (const patch of detail.postInstall) {
      const target = resolveTemplatePath(baseDir, patch.file);
      if (!(await fs.pathExists(target))) continue;

      if (patch.type === "replace" && patch.search && patch.value) {
        const content = await fs.readFile(target, "utf-8");
        await fs.writeFile(target, content.replace(patch.search, patch.value));
      } else if (patch.type === "append" && patch.value) {
        await fs.appendFile(target, patch.value);
      } else if (patch.type === "prepend" && patch.value) {
        const content = await fs.readFile(target, "utf-8");
        await fs.writeFile(target, patch.value + content);
      } else if (patch.type === "json-merge" && patch.merge) {
        const content = await fs.readJSON(target);
        await fs.writeJSON(target, { ...content, ...patch.merge }, { spaces: 2 });
      }
    }
  }

  return {
    success: true,
    templateName: detail.name,
    files,
    dependencies: detail.dependencies || {},
    devDependencies: detail.devDependencies || {},
    dryRun: !!params.dryRun,
    installCommand,
  };
}

/** 로컬 vs 템플릿 비교 */
export async function handleDiffTemplate(
  params: DiffTemplateParams
): Promise<DiffTemplateResult> {
  const detail = await fetchTemplateDetail(params.name);
  const baseDir = path.resolve(params.targetDir || ".");
  const entries: DiffEntry[] = [];

  // WI-0088 Q107: 템플릿 경로가 targetDir 밖이면 아무것도 읽지 않고 TemplatePathError(CLI template diff 와 같은 문구)
  const localPaths = detail.files.map((file) => resolveTemplatePath(baseDir, file.path));
  for (const [i, file] of detail.files.entries()) {
    const localPath = localPaths[i];

    if (!(await fs.pathExists(localPath))) {
      entries.push({ path: file.path, status: "added" });
      continue;
    }

    const localContent = await fs.readFile(localPath, "utf-8");
    if (localContent === file.content) {
      entries.push({ path: file.path, status: "unchanged" });
    } else {
      entries.push({
        path: file.path,
        status: "modified",
        localLines: localContent.split("\n").length,
        remoteLines: file.content.split("\n").length,
      });
    }
  }

  const summary = {
    added: entries.filter((e) => e.status === "added").length,
    modified: entries.filter((e) => e.status === "modified").length,
    unchanged: entries.filter((e) => e.status === "unchanged").length,
    extra: entries.filter((e) => e.status === "extra").length,
  };

  return { templateName: detail.name, entries, summary };
}

/**
 * brand 검사 결과를 check 항목으로 바꿉니다(WI-0028 FR-5, plan 4.5).
 * CLI `axis check` 의 `brandCheckResult`(packages/axis-cli/src/template/template-check.ts)와 같은 문구입니다.
 */
function brandCheckResult(check: BrandImportCheck): CheckResult {
  const { brand } = check;
  // 「(globalCss <값> 없음)」 · .css 아닌 파일을 버린 표기(WI-0100 D10). CSS 3항목과 같은 공유 코어 문구입니다
  const suffix = globalCssSelectionNote(check);
  // WI-0100b(D6): 브랜드 import 를 상대 @import 로 들여온 하위 파일에서 찾았으면 그 출처(「(app/brand.css 의 import)」)를 표기 앞에 붙여요
  const via = cssImportViaNote(check.importVia);
  switch (check.state) {
    case "match":
      return {
        name: "brand",
        severity: "pass",
        message: `brand "${brand}" import 가 ${check.cssFile}에 있습니다${via}${suffix}`,
      };
    case "css-missing":
      return {
        name: "brand",
        severity: "warn",
        message: `brand "${brand}" 가 설정됐지만 CSS 파일을 찾지 못했습니다${suffix}`,
      };
    case "import-missing":
      return {
        name: "brand",
        severity: "warn",
        message: `brand "${brand}" import 가 ${check.cssFile}에 없습니다 → 'axis theme add ${brand}'${suffix}`,
      };
    case "other-brand":
      return {
        name: "brand",
        severity: "warn",
        message: `brand "${brand}" 와 import(${check.imports.join(", ")})가 다릅니다${via}${suffix}`,
      };
  }
}

/** 프로젝트 상태 검증 */
/**
 * 브랜드를 켜는 코드 검사 결과(WI-0065 D8). CLI `axis check` 의 `brandActivationResult`
 * (packages/axis-cli/src/template/template-check.ts)와 같은 문구입니다.
 */
function brandActivationResult(check: BrandActivationCheck): CheckResult {
  if (check.found && check.theme?.status === "unresolved") {
    // WI-0091(사용자 결정 Q7): Plug'n'Play 에서 루트에만 선언한 theme 는 앱이 해석하지 못합니다
    return {
      name: "brand.activation",
      severity: "warn",
      message: `${check.found}의 <html data-brand> 를 ThemeProvider 와 함께 쓰는데 @axis-ds/theme 가 ${PNP_ROOT_ONLY_NOTE}(${versionGateLabel(check.theme)}) → 앱 package.json 에 @axis-ds/theme ${THEME_MARKUP_BRAND_MIN_VERSION} 이상을 선언하거나 setBrand("${check.brand}")`,
    };
  }
  if (check.found && check.theme && check.theme.status !== "ok") {
    // WI-0068: 마크업 data-brand + ThemeProvider(켜는 코드 없음)는 theme 1.6.2 이하에서 마운트 때 브랜드를 지웁니다
    const label = versionGateLabel(check.theme);
    const why =
      check.theme.status === "below"
        ? `@axis-ds/theme ${label} 의 ThemeProvider 가 마운트 때 지웁니다`
        : `@axis-ds/theme 버전을 확인하지 못했습니다(${label}). ${THEME_MARKUP_BRAND_MIN_VERSION} 미만이면 ThemeProvider 가 마운트 때 지웁니다`;
    return {
      name: "brand.activation",
      severity: "warn",
      message: `${check.found}의 <html data-brand> 를 ${why} → @axis-ds/theme ${THEME_MARKUP_BRAND_MIN_VERSION} 이상으로 올리거나 setBrand("${check.brand}")`,
    };
  }
  if (check.found) {
    return {
      name: "brand.activation",
      severity: "pass",
      message: `${check.found}에 브랜드를 켜는 코드(data-brand · setBrand 등)가 있습니다`,
    };
  }
  const where = check.layoutFiles.length > 0 ? check.layoutFiles.join(" · ") : "루트 레이아웃(app/layout.tsx 등)";
  return {
    name: "brand.activation",
    severity: "warn",
    message: `brand "${check.brand}" 가 설정됐지만 ${where}에 브랜드를 켜는 코드(data-brand · setBrand 등)가 없습니다(ThemeProvider 만으로는 마운트 때 꺼짐) → <html data-brand="${check.brand}"> 또는 setBrand("${check.brand}")`,
  };
}

export async function handleCheckProject(
  params: CheckProjectParams
): Promise<CheckProjectResult> {
  const baseDir = path.resolve(params.targetDir || ".");
  const results: CheckResult[] = [];

  // 1. axis.config.json
  const configExists = await fs.pathExists(path.join(baseDir, "axis.config.json"));
  results.push({
    name: "axis.config.json",
    severity: configExists ? "pass" : "fail",
    message: configExists
      ? "axis.config.json 파일이 존재합니다"
      : "axis.config.json 파일이 없습니다 → 'axis init'을 실행하세요",
  });

  // 2. Tailwind 구성: 3 이하는 tailwind.config 파일, 4 이상은 CSS 의 @import "tailwindcss"(WI-0042, CLI 와 같은 코어)
  results.push(checkTailwindSetup(baseDir));

  // 3. globals.css: 변수 직접 정의 또는 tokens CSS import(CLI 와 같은 코어, WI-0044 보정)
  results.push(checkGlobalsCss(baseDir));

  // 4. utils.ts
  const utilsCandidates = [
    "lib/utils.ts",
    "src/lib/utils.ts",
    "components/ui/utils.ts",
    "src/components/ui/utils.ts",
    "utils.ts",
  ];
  let utilsFound = false;
  for (const candidate of utilsCandidates) {
    const fullPath = path.join(baseDir, candidate);
    if (await fs.pathExists(fullPath)) {
      const content = await fs.readFile(fullPath, "utf-8");
      const hasCn = content.includes("function cn");
      results.push({
        name: "utils.ts",
        severity: hasCn ? "pass" : "warn",
        message: hasCn
          ? `${candidate}에 cn() 함수가 있습니다`
          : `${candidate}에 cn() 함수가 없습니다`,
      });
      utilsFound = true;
      break;
    }
  }
  if (!utilsFound) {
    results.push({
      name: "utils.ts",
      severity: "warn",
      message: "utils.ts를 찾을 수 없습니다 (컴포넌트 사용 시 필요)",
    });
  }

  // 5. package.json 의존성: 선언 + 설치본(CLI 와 같은 코어, WI-0051)
  results.push(checkDependencies(baseDir));

  // 6. brand 와 CSS import 대조 (WI-0028 FR-5, brand 가 없으면 추가하지 않음)
  const brandCheck = inspectBrandImport(baseDir);
  if (brandCheck) results.push(brandCheckResult(brandCheck));

  // 7~9. 해당할 때만 더하는 항목(WI-0065 D8, CLI `axis check` 와 같은 순서 · 문구 · 같은 코어)
  const activation = inspectBrandActivation(baseDir);
  if (activation) results.push(brandActivationResult(activation));
  const content = checkTailwindContent(baseDir);
  if (content) results.push(content);
  const animation = checkAnimationPlugin(baseDir);
  if (animation) results.push(animation);

  const summary = {
    pass: results.filter((r) => r.severity === "pass").length,
    warn: results.filter((r) => r.severity === "warn").length,
    fail: results.filter((r) => r.severity === "fail").length,
  };

  return { results, summary };
}

// --- 포매터 ---

/** 템플릿 목록 포매팅 */
export function formatListTemplatesResult(result: ListTemplatesResult): string {
  const lines = [`## AXIS 템플릿 목록 (${result.total}개)\n`];

  if (result.templates.length === 0) {
    lines.push("등록된 템플릿이 없습니다.");
    return lines.join("\n");
  }

  lines.push("| 이름 | 설명 | 카테고리 |");
  lines.push("|------|------|----------|");
  for (const t of result.templates) {
    lines.push(`| ${t.name} | ${t.description} | ${t.category} |`);
  }

  return lines.join("\n");
}

/** 템플릿 상세 포매팅 */
export function formatGetTemplateResult(result: GetTemplateResult): string {
  const lines = [
    `## ${result.name}`,
    "",
    `- **설명**: ${result.description}`,
    `- **카테고리**: ${result.category}`,
    `- **버전**: ${result.version}`,
  ];

  if (result.features.length > 0) {
    lines.push("", "### Features", "");
    for (const f of result.features) {
      lines.push(`- ${f}`);
    }
  }

  const deps = Object.entries(result.dependencies);
  const devDeps = Object.entries(result.devDependencies);
  if (deps.length > 0 || devDeps.length > 0) {
    lines.push("", "### 의존성", "");
    for (const [k, v] of deps) {
      lines.push(`- ${k}@${v}`);
    }
    for (const [k, v] of devDeps) {
      lines.push(`- ${k}@${v} (dev)`);
    }
  }

  if (result.files.length > 0) {
    lines.push("", "### 파일 목록", "");
    for (const f of result.files) {
      lines.push(`- ${f}`);
    }
  }

  return lines.join("\n");
}

/** 템플릿 적용 결과 포매팅 */
export function formatApplyTemplateResult(result: ApplyTemplateResult): string {
  const mode = result.dryRun ? " (미리보기)" : "";
  const lines = [`## 템플릿 적용 결과${mode}\n`];

  lines.push(`템플릿: **${result.templateName}**\n`);

  if (result.files.length > 0) {
    lines.push("### 파일", "");
    // WI-0088: 합친 파일은 CLI 와 같은 뜻의 「합치기」로 표시합니다
    const label: Record<TemplateFileAction, string> = {
      created: "생성",
      overwritten: "덮어쓰기",
      merged: "합치기: 기존 필드를 두고 템플릿 키를 합침",
    };
    for (const f of result.files) {
      const icon = f.action === "created" ? "+" : "~";
      lines.push(`- ${icon} ${f.path} (${label[f.action]})`);
      if (f.note) lines.push(`  - ! ${f.note}`);
    }
  }

  const deps = Object.entries(result.dependencies);
  const devDeps = Object.entries(result.devDependencies);
  if (deps.length > 0 || devDeps.length > 0) {
    lines.push("", "### 필요한 의존성", "");
    // WI-0085: CLI `axis template apply` 와 같은 명령(대상 디렉터리 매니저 · 범위 따옴표 · `-D`). 종전에는 `pnpm add` 고정
    const installCommand = result.installCommand ?? "pnpm install";
    if (deps.length > 0) {
      lines.push(`\`${addCommandFor(installCommand, result.dependencies)}\``);
    }
    if (devDeps.length > 0) {
      lines.push(`\`${addCommandFor(installCommand, result.devDependencies, { dev: true })}\``);
    }
  }

  return lines.join("\n");
}

/** Diff 결과 포매팅 */
export function formatDiffTemplateResult(result: DiffTemplateResult): string {
  const lines = [`## '${result.templateName}' 템플릿 diff 결과\n`];

  const statusLabel: Record<DiffStatus, string> = {
    added: "+ 추가 필요",
    modified: "~ 변경됨",
    unchanged: "= 동일",
    extra: "? 로컬 전용",
  };

  for (const entry of result.entries) {
    lines.push(`- ${statusLabel[entry.status]}  ${entry.path}`);
  }

  const s = result.summary;
  lines.push(
    "",
    `**요약**: 추가 필요 ${s.added} | 변경됨 ${s.modified} | 동일 ${s.unchanged}${s.extra > 0 ? ` | 로컬 전용 ${s.extra}` : ""}`
  );

  return lines.join("\n");
}

/** 프로젝트 검증 결과 포매팅 */
export function formatCheckProjectResult(result: CheckProjectResult): string {
  const lines = ["## AXIS 프로젝트 검증 결과\n"];

  const icon: Record<CheckSeverity, string> = {
    pass: "PASS",
    warn: "WARN",
    fail: "FAIL",
  };

  for (const r of result.results) {
    lines.push(`- [${icon[r.severity]}] ${r.message}`);
  }

  const s = result.summary;
  lines.push("", `**결과**: ${s.pass} pass / ${s.warn} warn / ${s.fail} fail`);

  return lines.join("\n");
}
