/**
 * AXIS MCP 템플릿 도구
 *
 * CLI의 template 로직을 MCP tool로 래핑하여 AI 에이전트가 활용할 수 있게 합니다.
 */

import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";

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
  process.env.AXIS_TEMPLATE_URL || "https://ds.minu.best/templates";

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
  files: { path: string; action: "created" | "overwritten" }[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  dryRun: boolean;
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
  const files: ApplyTemplateResult["files"] = [];

  for (const file of detail.files) {
    const dest = path.join(baseDir, file.path);
    const exists = await fs.pathExists(dest);

    if (!params.dryRun) {
      await fs.ensureDir(path.dirname(dest));
      await fs.writeFile(dest, file.content);
    }

    files.push({
      path: file.path,
      action: exists ? "overwritten" : "created",
    });
  }

  // postInstall 패치 (dry-run이 아닌 경우만)
  if (!params.dryRun && detail.postInstall?.length) {
    for (const patch of detail.postInstall) {
      const target = path.join(baseDir, patch.file);
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
  };
}

/** 로컬 vs 템플릿 비교 */
export async function handleDiffTemplate(
  params: DiffTemplateParams
): Promise<DiffTemplateResult> {
  const detail = await fetchTemplateDetail(params.name);
  const baseDir = path.resolve(params.targetDir || ".");
  const entries: DiffEntry[] = [];

  for (const file of detail.files) {
    const localPath = path.join(baseDir, file.path);

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

/** 프로젝트 상태 검증 */
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

  // 2. tailwind.config
  const twTs = path.join(baseDir, "tailwind.config.ts");
  const twJs = path.join(baseDir, "tailwind.config.js");
  if (await fs.pathExists(twTs)) {
    const content = await fs.readFile(twTs, "utf-8");
    const hasTokens = content.includes("--background") || content.includes("hsl(var(");
    results.push({
      name: "tailwind.config",
      severity: hasTokens ? "pass" : "warn",
      message: hasTokens
        ? "tailwind.config.ts에 AXIS 토큰이 설정되어 있습니다"
        : "tailwind.config.ts에 AXIS 토큰 설정이 없습니다",
    });
  } else if (await fs.pathExists(twJs)) {
    results.push({
      name: "tailwind.config",
      severity: "warn",
      message: "tailwind.config.js 존재 (TypeScript 권장)",
    });
  } else {
    results.push({
      name: "tailwind.config",
      severity: "fail",
      message: "tailwind.config 파일이 없습니다",
    });
  }

  // 3. globals.css
  const cssCandidates = [
    "globals.css",
    "app/globals.css",
    "src/app/globals.css",
    "src/globals.css",
    "styles/globals.css",
  ];
  let cssFound = false;
  for (const candidate of cssCandidates) {
    const fullPath = path.join(baseDir, candidate);
    if (await fs.pathExists(fullPath)) {
      const content = await fs.readFile(fullPath, "utf-8");
      const hasTokens = content.includes("--background") && content.includes("--primary");
      results.push({
        name: "globals.css",
        severity: hasTokens ? "pass" : "warn",
        message: hasTokens
          ? `${candidate}에 AXIS CSS 변수가 정의되어 있습니다`
          : `${candidate}에 AXIS CSS 변수가 없습니다`,
      });
      cssFound = true;
      break;
    }
  }
  if (!cssFound) {
    results.push({
      name: "globals.css",
      severity: "fail",
      message: "globals.css 파일을 찾을 수 없습니다",
    });
  }

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

  // 5. package.json 의존성
  const pkgPath = path.join(baseDir, "package.json");
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJSON(pkgPath);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const required = ["tailwindcss"];
    const recommended = ["clsx", "tailwind-merge"];
    const missingRequired = required.filter((d) => !allDeps[d]);
    const missingRecommended = recommended.filter((d) => !allDeps[d]);

    if (missingRequired.length > 0) {
      results.push({
        name: "dependencies",
        severity: "fail",
        message: `필수 의존성 누락: ${missingRequired.join(", ")}`,
      });
    } else if (missingRecommended.length > 0) {
      results.push({
        name: "dependencies",
        severity: "warn",
        message: `권장 의존성 누락: ${missingRecommended.join(", ")}`,
      });
    } else {
      results.push({
        name: "dependencies",
        severity: "pass",
        message: "필수 및 권장 의존성이 모두 설치되어 있습니다",
      });
    }
  } else {
    results.push({
      name: "dependencies",
      severity: "fail",
      message: "package.json 파일이 없습니다",
    });
  }

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
    for (const f of result.files) {
      const icon = f.action === "created" ? "+" : "~";
      lines.push(`- ${icon} ${f.path} (${f.action === "created" ? "생성" : "덮어쓰기"})`);
    }
  }

  const deps = Object.entries(result.dependencies);
  const devDeps = Object.entries(result.devDependencies);
  if (deps.length > 0 || devDeps.length > 0) {
    lines.push("", "### 필요한 의존성", "");
    if (deps.length > 0) {
      lines.push(`\`pnpm add ${deps.map(([k, v]) => `${k}@${v}`).join(" ")}\``);
    }
    if (devDeps.length > 0) {
      lines.push(`\`pnpm add -D ${devDeps.map(([k, v]) => `${k}@${v}`).join(" ")}\``);
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
