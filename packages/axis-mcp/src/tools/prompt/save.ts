/**
 * AXIS Design System MCP - 프롬프트 저장 도구
 *
 * 검증된 프롬프트를 파일로 저장하고 인덱스를 갱신합니다.
 */

import type {
  SaveParams,
  SaveResult,
  PromptIndex,
  PromptIndexEntry,
  PromptCategory,
} from "./types.js";
import * as fs from "fs";
import * as path from "path";

/** 프롬프트 저장 기본 경로 */
const PROMPTS_BASE_PATH = ".claude/prompts";

/** 프롬프트 인덱스 경로 */
const INDEX_PATH = ".claude/prompts/_registry/prompt-index.json";

/**
 * 프론트매터에서 메타데이터 추출
 */
function extractMetadata(
  promptText: string
): { name: string; category: PromptCategory; description: string; variables: string[] } | null {
  const match = promptText.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const lines = yaml.split("\n");

  let name = "";
  let category: PromptCategory = "workflow";
  let description = "";
  const variables: string[] = [];

  let inVariables = false;

  for (const line of lines) {
    if (line.startsWith("name:")) {
      name = line.replace("name:", "").trim();
    } else if (line.startsWith("category:")) {
      category = line.replace("category:", "").trim() as PromptCategory;
    } else if (line.startsWith("description:")) {
      description = line.replace("description:", "").trim();
    } else if (line.startsWith("variables:")) {
      inVariables = true;
    } else if (inVariables && line.includes("name:")) {
      const varMatch = line.match(/name:\s*"?({{[A-Z_]+}})"?/);
      if (varMatch) {
        variables.push(varMatch[1]);
      }
    }
  }

  if (!name || !category) return null;

  return { name, category, description, variables };
}

/**
 * 인덱스 파일 로드
 */
function loadIndex(basePath: string): PromptIndex {
  const indexPath = path.join(basePath, INDEX_PATH);

  if (!fs.existsSync(indexPath)) {
    // 기본 인덱스 생성
    return {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      categories: {
        planning: { description: "계획 수립", count: 0 },
        quality: { description: "품질 관리", count: 0 },
        documentation: { description: "문서화", count: 0 },
        workflow: { description: "워크플로우", count: 0 },
      },
      prompts: [],
      stats: {
        totalPrompts: 0,
        totalUsage: 0,
        mostUsed: null,
        recentlyAdded: null,
      },
    };
  }

  const content = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(content);
}

/**
 * 인덱스 파일 저장
 */
function saveIndex(basePath: string, index: PromptIndex): void {
  const indexPath = path.join(basePath, INDEX_PATH);

  // 디렉토리 확인
  const indexDir = path.dirname(indexPath);
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true });
  }

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

/**
 * 프롬프트 파일 저장
 */
function savePromptFile(
  basePath: string,
  category: PromptCategory,
  name: string,
  content: string
): string {
  const promptDir = path.join(basePath, PROMPTS_BASE_PATH, category);
  const promptPath = path.join(promptDir, `${name}.md`);

  // 디렉토리 확인
  if (!fs.existsSync(promptDir)) {
    fs.mkdirSync(promptDir, { recursive: true });
  }

  fs.writeFileSync(promptPath, content, "utf-8");

  return `${PROMPTS_BASE_PATH}/${category}/${name}.md`;
}

/**
 * 인덱스에 프롬프트 추가/업데이트
 */
function updateIndex(
  index: PromptIndex,
  entry: Omit<PromptIndexEntry, "createdAt" | "updatedAt" | "usageCount">,
  isNew: boolean
): void {
  const now = new Date().toISOString();

  const existingIndex = index.prompts.findIndex((p) => p.id === entry.id);

  if (existingIndex >= 0) {
    // 업데이트
    index.prompts[existingIndex] = {
      ...index.prompts[existingIndex],
      ...entry,
      updatedAt: now,
    };
  } else {
    // 신규 추가
    index.prompts.push({
      ...entry,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    });

    // 카테고리 카운트 증가
    index.categories[entry.category].count++;
  }

  // 통계 업데이트
  index.stats.totalPrompts = index.prompts.length;
  index.stats.recentlyAdded = entry.id;
  index.lastUpdated = now;
}

/**
 * 중복 검사
 */
function checkDuplicateEntry(index: PromptIndex, name: string, category: PromptCategory): boolean {
  const id = `${category}/${name}`;
  return index.prompts.some((p) => p.id === id);
}

/**
 * axis.prompt.save 도구 구현
 *
 * 검증된 프롬프트를 파일로 저장하고 인덱스를 갱신합니다.
 */
export function handleSave(params: SaveParams): SaveResult {
  const { promptText, name, category, force = false } = params;

  if (!promptText || promptText.trim() === "") {
    throw new Error("저장할 프롬프트(promptText)는 필수입니다.");
  }

  if (!name || name.trim() === "") {
    throw new Error("프롬프트 이름(name)은 필수입니다.");
  }

  if (!category) {
    throw new Error("카테고리(category)는 필수입니다.");
  }

  // 이름 검증 (kebab-case)
  const kebabCaseRegex = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
  if (!kebabCaseRegex.test(name)) {
    return {
      success: false,
      error: `이름은 kebab-case 형식이어야 합니다: ${name}`,
    };
  }

  try {
    const basePath = process.cwd();

    // 인덱스 로드
    const index = loadIndex(basePath);

    // 중복 검사
    const isDuplicate = checkDuplicateEntry(index, name, category);
    if (isDuplicate && !force) {
      return {
        success: false,
        error: `이미 존재하는 프롬프트입니다: ${category}/${name}. --force 옵션으로 덮어쓸 수 있습니다.`,
      };
    }

    // 메타데이터 추출
    const metadata = extractMetadata(promptText);
    const description = metadata?.description || "재사용 가능한 프롬프트";
    const variables = metadata?.variables || [];

    // 파일 저장
    const relativePath = savePromptFile(basePath, category, name, promptText);

    // 인덱스 업데이트
    const entryId = `${category}/${name}`;
    updateIndex(
      index,
      {
        id: entryId,
        name,
        category,
        description,
        path: relativePath,
        variables,
      },
      !isDuplicate
    );

    // 인덱스 저장
    saveIndex(basePath, index);

    return {
      success: true,
      path: relativePath,
      promptId: entryId,
      indexUpdated: true,
    };
  } catch (error) {
    return {
      success: false,
      error: `저장 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    };
  }
}

/**
 * 저장 결과를 Markdown 형식으로 포맷팅
 */
export function formatSaveResult(result: SaveResult): string {
  const lines: string[] = [];

  if (result.success) {
    lines.push("## 저장 완료 ✅");
    lines.push("");
    lines.push(`- **경로**: \`${result.path}\``);
    lines.push(`- **프롬프트 ID**: \`${result.promptId}\``);
    lines.push(`- **인덱스 갱신**: ${result.indexUpdated ? "✅" : "❌"}`);
    lines.push("");
    lines.push("### 사용 방법");
    lines.push("");
    lines.push("```");
    lines.push(`이 프롬프트를 사용하여 {{VARIABLE}}에 대해...`);
    lines.push("```");
    lines.push("");
    lines.push("또는 직접 참조:");
    lines.push("");
    lines.push("```");
    lines.push(`${result.path}`);
    lines.push("```");
  } else {
    lines.push("## 저장 실패 ❌");
    lines.push("");
    lines.push(`**오류**: ${result.error}`);
    lines.push("");
    lines.push("### 해결 방법");
    lines.push("");
    if (result.error?.includes("kebab-case")) {
      lines.push("- 이름을 kebab-case 형식으로 변경하세요 (예: my-prompt)");
    } else if (result.error?.includes("이미 존재")) {
      lines.push("- 다른 이름을 사용하거나");
      lines.push("- `--force` 옵션으로 덮어쓰기: `/ax-prompt save --force`");
    } else {
      lines.push("- 오류 메시지를 확인하고 수정하세요");
    }
  }

  return lines.join("\n");
}
