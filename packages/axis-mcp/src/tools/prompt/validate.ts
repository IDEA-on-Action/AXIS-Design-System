/**
 * AXIS Design System MCP - 프롬프트 검증 도구
 *
 * 정제된 프롬프트의 품질을 검증합니다.
 */

import type { ValidateParams, ValidateResult, PromptIndex } from "./types.js";
import * as fs from "fs";
import * as path from "path";

/** 프롬프트 인덱스 경로 */
const INDEX_PATH = ".claude/prompts/_registry/prompt-index.json";

/**
 * YAML 프론트매터 파싱
 */
function parseFrontmatter(
  text: string
): { valid: boolean; data?: Record<string, unknown>; error?: string } {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return { valid: false, error: "프론트매터가 없습니다" };
  }

  try {
    // 간단한 YAML 파싱 (키: 값 형태만)
    const yaml = match[1];
    const data: Record<string, unknown> = {};
    const lines = yaml.split("\n");

    let currentKey = "";
    let currentArray: string[] | null = null;

    for (const line of lines) {
      // 배열 항목
      if (line.trim().startsWith("- ") && currentArray) {
        currentArray.push(line.trim().substring(2));
        continue;
      }

      // 키: 값
      const kvMatch = line.match(/^(\w+):\s*(.*)$/);
      if (kvMatch) {
        if (currentArray && currentKey) {
          data[currentKey] = currentArray;
        }

        currentKey = kvMatch[1];
        const value = kvMatch[2].trim();

        if (value === "") {
          // 다음 라인에 배열이 올 수 있음
          currentArray = [];
        } else {
          data[currentKey] = value;
          currentArray = null;
        }
      }
    }

    // 마지막 배열 처리
    if (currentArray && currentKey) {
      data[currentKey] = currentArray;
    }

    // 필수 필드 검증
    if (!data.name) {
      return { valid: false, error: "name 필드가 필요합니다" };
    }
    if (!data.category) {
      return { valid: false, error: "category 필드가 필요합니다" };
    }

    const validCategories = ["planning", "quality", "documentation", "workflow"];
    if (!validCategories.includes(data.category as string)) {
      return {
        valid: false,
        error: `유효하지 않은 category: ${data.category}. 허용값: ${validCategories.join(", ")}`,
      };
    }

    return { valid: true, data };
  } catch (error) {
    return {
      valid: false,
      error: `YAML 파싱 오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
    };
  }
}

/**
 * 필수 섹션 검사
 */
function checkRequiredSections(text: string): {
  hasGoal: boolean;
  hasSteps: boolean;
  details: string[];
} {
  const details: string[] = [];

  // 목표 섹션
  const goalKeywords = ["목표", "목적", "개요"];
  const hasGoal = goalKeywords.some(
    (k) => text.includes(`## ${k}`) || text.includes(`### ${k}`)
  );
  if (!hasGoal) {
    details.push("목표/개요 섹션이 권장됩니다");
  }

  // 단계 섹션
  const stepKeywords = ["단계", "절차", "수행"];
  const hasSteps = stepKeywords.some(
    (k) => text.includes(`## ${k}`) || text.includes(`### ${k}`)
  ) || /^\d+\.\s/m.test(text);
  if (!hasSteps) {
    details.push("수행 단계 섹션이 권장됩니다");
  }

  return {
    hasGoal,
    hasSteps,
    details,
  };
}

/**
 * 하드코딩 경로 검사
 */
function checkHardcodedPaths(text: string): {
  clean: boolean;
  found: string[];
} {
  const hardcodedPatterns = [
    // 절대 경로 (변수화되지 않은)
    /(?<!{{)(?:src|packages|apps|lib|components)\/[\w\-\/]+\.(?:ts|tsx|js|jsx|md)(?!}})/gi,
    // 특정 프로젝트 경로
    /D:\\|C:\\|\/Users\/|\/home\//gi,
  ];

  const found: string[] = [];

  for (const pattern of hardcodedPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  }

  return {
    clean: found.length === 0,
    found,
  };
}

/**
 * 변수 문서화 검사
 */
function checkVariablesDocumented(text: string): {
  documented: boolean;
  undocumented: string[];
} {
  // 사용된 변수 추출
  const usedVariables = text.match(/{{[A-Z_]+}}/g) || [];
  const uniqueVariables = [...new Set(usedVariables)];

  // 프론트매터에서 변수 문서화 확인
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";

  const undocumented: string[] = [];
  for (const variable of uniqueVariables) {
    // 변수명이 프론트매터에 있는지 확인
    if (!frontmatter.includes(variable)) {
      undocumented.push(variable);
    }
  }

  return {
    documented: undocumented.length === 0,
    undocumented,
  };
}

/**
 * 중복 검사
 */
function checkDuplicate(
  text: string,
  _basePath?: string
): { noDuplicate: boolean; similar: ValidateResult["similarPrompts"] } {
  const similar: ValidateResult["similarPrompts"] = [];

  try {
    // 인덱스 파일 읽기 시도
    const indexPath = path.resolve(process.cwd(), INDEX_PATH);
    if (!fs.existsSync(indexPath)) {
      return { noDuplicate: true, similar };
    }

    const indexContent = fs.readFileSync(indexPath, "utf-8");
    const index: PromptIndex = JSON.parse(indexContent);

    // 간단한 유사도 검사 (키워드 기반)
    const textKeywords = extractKeywords(text);

    for (const prompt of index.prompts) {
      // 프롬프트 파일 읽기
      const promptPath = path.resolve(process.cwd(), prompt.path);
      if (!fs.existsSync(promptPath)) continue;

      const promptContent = fs.readFileSync(promptPath, "utf-8");
      const promptKeywords = extractKeywords(promptContent);

      // 키워드 유사도 계산
      const similarity = calculateSimilarity(textKeywords, promptKeywords);

      if (similarity >= 0.6) {
        similar.push({
          id: prompt.id,
          name: prompt.name,
          similarity: Math.round(similarity * 100),
        });
      }
    }

    return {
      noDuplicate: !similar.some((s) => s.similarity >= 80),
      similar: similar.sort((a, b) => b.similarity - a.similarity),
    };
  } catch {
    // 인덱스 읽기 실패 시 중복 없음으로 처리
    return { noDuplicate: true, similar };
  }
}

/**
 * 키워드 추출
 */
function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

/**
 * 키워드 유사도 계산 (Jaccard 유사도)
 */
function calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

/**
 * axis.prompt.validate 도구 구현
 *
 * 정제된 프롬프트의 품질을 검증합니다.
 */
export function handleValidate(params: ValidateParams): ValidateResult {
  const { promptText, checkDuplicate: enableDuplicateCheck = true } = params;

  if (!promptText || promptText.trim() === "") {
    throw new Error("검증할 프롬프트(promptText)는 필수입니다.");
  }

  const errors: ValidateResult["errors"] = [];

  // 1. 프론트매터 검증
  const frontmatterResult = parseFrontmatter(promptText);
  if (!frontmatterResult.valid) {
    errors.push({
      code: "INVALID_FRONTMATTER",
      message: frontmatterResult.error || "프론트매터 오류",
      severity: "error",
    });
  }

  // 2. 필수 섹션 검사
  const sectionResult = checkRequiredSections(promptText);
  for (const detail of sectionResult.details) {
    errors.push({
      code: "MISSING_SECTION",
      message: detail,
      severity: "warning",
    });
  }

  // 3. 하드코딩 경로 검사
  const pathResult = checkHardcodedPaths(promptText);
  if (!pathResult.clean) {
    errors.push({
      code: "HARDCODED_PATH",
      message: `하드코딩된 경로 발견: ${pathResult.found.slice(0, 3).join(", ")}${pathResult.found.length > 3 ? "..." : ""}`,
      severity: "error",
    });
  }

  // 4. 변수 문서화 검사
  const varResult = checkVariablesDocumented(promptText);
  if (!varResult.documented) {
    errors.push({
      code: "UNDOCUMENTED_VARIABLE",
      message: `문서화되지 않은 변수: ${varResult.undocumented.join(", ")}`,
      severity: "warning",
    });
  }

  // 5. 중복 검사
  let duplicateResult = { noDuplicate: true, similar: undefined as ValidateResult["similarPrompts"] };
  if (enableDuplicateCheck) {
    duplicateResult = checkDuplicate(promptText);
    if (!duplicateResult.noDuplicate) {
      const mostSimilar = duplicateResult.similar?.[0];
      errors.push({
        code: "DUPLICATE_PROMPT",
        message: `유사 프롬프트 존재: ${mostSimilar?.name} (${mostSimilar?.similarity}% 유사)`,
        severity: "error",
      });
    }
  }

  // 결과 종합
  const hasErrors = errors.some((e) => e.severity === "error");

  return {
    isValid: !hasErrors,
    errors,
    checklist: {
      hasRequiredSections: sectionResult.hasGoal && sectionResult.hasSteps,
      noHardcodedPaths: pathResult.clean,
      variablesDocumented: varResult.documented,
      validFrontmatter: frontmatterResult.valid,
      noDuplicate: duplicateResult.noDuplicate,
    },
    similarPrompts: duplicateResult.similar,
  };
}

/**
 * 검증 결과를 Markdown 형식으로 포맷팅
 */
export function formatValidateResult(result: ValidateResult): string {
  const lines: string[] = [];

  lines.push("## 검증 결과");
  lines.push("");
  lines.push(`**유효성**: ${result.isValid ? "✅ 통과" : "❌ 실패"}`);
  lines.push("");

  lines.push("### 체크리스트");
  lines.push("");
  lines.push(
    `- [${result.checklist.validFrontmatter ? "x" : " "}] YAML 프론트매터 유효`
  );
  lines.push(
    `- [${result.checklist.hasRequiredSections ? "x" : " "}] 필수 섹션 존재 (목표, 단계)`
  );
  lines.push(
    `- [${result.checklist.noHardcodedPaths ? "x" : " "}] 하드코딩 경로 없음`
  );
  lines.push(
    `- [${result.checklist.variablesDocumented ? "x" : " "}] 변수 문서화 완료`
  );
  lines.push(
    `- [${result.checklist.noDuplicate ? "x" : " "}] 중복 프롬프트 없음`
  );
  lines.push("");

  if (result.errors.length > 0) {
    lines.push("### 발견된 문제");
    lines.push("");

    const errorItems = result.errors.filter((e) => e.severity === "error");
    const warningItems = result.errors.filter((e) => e.severity === "warning");

    if (errorItems.length > 0) {
      lines.push("**오류** (수정 필수):");
      for (const e of errorItems) {
        lines.push(`- ❌ [${e.code}] ${e.message}`);
      }
      lines.push("");
    }

    if (warningItems.length > 0) {
      lines.push("**경고** (권장 수정):");
      for (const w of warningItems) {
        lines.push(`- ⚠️ [${w.code}] ${w.message}`);
      }
      lines.push("");
    }
  }

  if (result.similarPrompts && result.similarPrompts.length > 0) {
    lines.push("### 유사 프롬프트");
    lines.push("");
    lines.push("| 프롬프트 | 유사도 |");
    lines.push("|----------|--------|");
    for (const s of result.similarPrompts.slice(0, 3)) {
      lines.push(`| ${s.name} | ${s.similarity}% |`);
    }
    lines.push("");
    lines.push("*80% 이상 유사 시 중복으로 간주됩니다.*");
    lines.push("");
  }

  if (result.isValid) {
    lines.push("---");
    lines.push("검증 통과! `/ax-prompt save`로 저장할 수 있습니다.");
  } else {
    lines.push("---");
    lines.push("오류를 수정한 후 다시 검증하세요.");
  }

  return lines.join("\n");
}
