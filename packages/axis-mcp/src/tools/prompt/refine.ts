/**
 * AXIS Design System MCP - 프롬프트 정제 도구
 *
 * 프로젝트 종속성을 제거하고 범용 프롬프트로 변환합니다.
 */

import type {
  RefineParams,
  RefineResult,
  PromptVariable,
  PromptCategory,
} from "./types.js";

/**
 * 변수화 패턴 및 대체 규칙
 */
const VARIABLE_PATTERNS: Array<{
  pattern: RegExp;
  variable: string;
  description: string;
  type: string;
}> = [
  {
    pattern: /(?:src|packages|apps|lib|components)\/[\w\-\/]+\.(?:ts|tsx|js|jsx|md)/gi,
    variable: "{{FILE_PATH}}",
    description: "파일 경로",
    type: "path",
  },
  {
    pattern: /\b\d+\.\d+\.\d+(?:-[\w.]+)?\b/g,
    variable: "{{VERSION}}",
    description: "버전 번호",
    type: "version",
  },
  {
    pattern: /\b\d{4}-\d{2}-\d{2}\b/g,
    variable: "{{DATE}}",
    description: "날짜",
    type: "date",
  },
  {
    pattern: /@[\w-]+\/[\w-]+/g,
    variable: "{{PACKAGE_NAME}}",
    description: "패키지명",
    type: "package",
  },
];

/**
 * PascalCase 컴포넌트명 패턴 (일반 단어 제외)
 */
const COMPONENT_PATTERN = /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g;
const COMMON_WORDS = [
  "README",
  "TypeScript",
  "JavaScript",
  "React",
  "Next",
  "Node",
  "Tailwind",
  "WCAG",
  "HTML",
  "CSS",
  "JSON",
  "YAML",
  "API",
  "REST",
  "GraphQL",
];

/**
 * 카테고리 키워드 기반 추론
 */
const CATEGORY_INFERENCE: Record<string, PromptCategory> = {
  계획: "planning",
  설계: "planning",
  전략: "planning",
  요구사항: "planning",
  리뷰: "quality",
  점검: "quality",
  테스트: "quality",
  검증: "quality",
  문서: "documentation",
  가이드: "documentation",
  매뉴얼: "documentation",
  워크플로우: "workflow",
  프로세스: "workflow",
  자동화: "workflow",
};

/**
 * 프롬프트 이름 생성
 */
function generatePromptName(text: string): string {
  // 첫 번째 헤더에서 이름 추출 시도
  const headerMatch = text.match(/^#\s+(.+)$/m);
  if (headerMatch) {
    return headerMatch[1]
      .toLowerCase()
      .replace(/[^a-z가-힣0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 30);
  }

  // 키워드 기반 이름 생성
  for (const keyword of Object.keys(CATEGORY_INFERENCE)) {
    if (text.includes(keyword)) {
      return `${keyword}-prompt`.replace(/\s+/g, "-");
    }
  }

  return "custom-prompt";
}

/**
 * 카테고리 추론
 */
function inferCategory(text: string, providedCategory?: PromptCategory): PromptCategory {
  if (providedCategory) return providedCategory;

  // 키워드 기반 추론
  for (const [keyword, category] of Object.entries(CATEGORY_INFERENCE)) {
    if (text.includes(keyword)) {
      return category;
    }
  }

  return "workflow"; // 기본값
}

/**
 * 텍스트에서 변수 추출 및 대체
 */
function extractAndReplaceVariables(
  text: string
): { refinedText: string; variables: PromptVariable[]; transformations: RefineResult["transformations"] } {
  const variables: PromptVariable[] = [];
  const transformations: RefineResult["transformations"] = [];
  const seen = new Map<string, string>(); // 원본 값 → 변수명 매핑
  let refinedText = text;

  // 패턴별 변수화
  for (const { pattern, variable, description, type } of VARIABLE_PATTERNS) {
    const matches = refinedText.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (!seen.has(match)) {
          seen.set(match, variable);

          // 동일 변수 타입이 여러 개면 번호 부여
          const existingVars = variables.filter((v) => v.name.startsWith(variable.replace("}}", "")));
          const varName = existingVars.length > 0
            ? variable.replace("}}", `_${existingVars.length + 1}}`)
            : variable;

          variables.push({
            name: varName,
            description,
            originalValue: match,
            example: match,
            required: true,
          });

          transformations.push({
            original: match,
            replacement: varName,
            type,
          });

          // 텍스트에서 대체
          refinedText = refinedText.split(match).join(varName);
        }
      }
    }
  }

  // 컴포넌트명 변수화
  const componentMatches = refinedText.match(COMPONENT_PATTERN);
  if (componentMatches) {
    const uniqueComponents = [...new Set(componentMatches)].filter(
      (c) => !COMMON_WORDS.includes(c)
    );

    for (const comp of uniqueComponents) {
      if (!seen.has(comp)) {
        const existingVars = variables.filter((v) =>
          v.name.startsWith("{{COMPONENT_NAME")
        );
        const varName =
          existingVars.length > 0
            ? `{{COMPONENT_NAME_${existingVars.length + 1}}}`
            : "{{COMPONENT_NAME}}";

        seen.set(comp, varName);

        variables.push({
          name: varName,
          description: "컴포넌트/기능명",
          originalValue: comp,
          example: comp,
          required: true,
        });

        transformations.push({
          original: comp,
          replacement: varName,
          type: "component",
        });

        refinedText = refinedText.split(comp).join(varName);
      }
    }
  }

  return { refinedText, variables, transformations };
}

/**
 * YAML 프론트매터 생성
 */
function generateFrontmatter(
  name: string,
  category: PromptCategory,
  description: string,
  variables: PromptVariable[]
): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`name: ${name}`);
  lines.push(`category: ${category}`);
  lines.push(`description: ${description}`);

  if (variables.length > 0) {
    lines.push("variables:");
    for (const v of variables) {
      lines.push(`  - name: "${v.name}"`);
      lines.push(`    description: ${v.description}`);
      if (v.example) {
        lines.push(`    example: ${v.example}`);
      }
      if (v.required !== undefined) {
        lines.push(`    required: ${v.required}`);
      }
    }
  }

  lines.push("---");

  return lines.join("\n");
}

/**
 * 설명 추출 또는 생성
 */
function extractDescription(text: string): string {
  // 첫 번째 문단에서 설명 추출
  const firstParagraph = text.match(/^[^#\n].+$/m);
  if (firstParagraph) {
    return firstParagraph[0].slice(0, 100).trim();
  }

  // 목표 섹션에서 추출
  const goalMatch = text.match(/##?\s*목표[\s\S]*?(?=##|$)/i);
  if (goalMatch) {
    const goalText = goalMatch[0].replace(/##?\s*목표\s*/i, "").trim();
    return goalText.slice(0, 100);
  }

  return "재사용 가능한 프롬프트";
}

/**
 * axis.prompt.refine 도구 구현
 *
 * 프로젝트 종속성을 제거하고 범용 프롬프트로 변환합니다.
 */
export function handleRefine(params: RefineParams): RefineResult {
  const { text, name: providedName, category: providedCategory } = params;

  if (!text || text.trim() === "") {
    throw new Error("정제할 텍스트(text)는 필수입니다.");
  }

  // 변수 추출 및 대체
  const { refinedText, variables, transformations } =
    extractAndReplaceVariables(text);

  // 메타데이터 추론
  const name = providedName || generatePromptName(text);
  const category = inferCategory(text, providedCategory);
  const description = extractDescription(text);

  // 프론트매터 생성
  const frontmatter = generateFrontmatter(name, category, description, variables);

  // 최종 정제된 텍스트
  const finalText = `${frontmatter}\n\n${refinedText.trim()}`;

  return {
    refinedText: finalText,
    frontmatter,
    variables,
    transformations,
    metadata: {
      name,
      category,
      description,
      variables,
    },
  };
}

/**
 * 정제 결과를 Markdown 형식으로 포맷팅
 */
export function formatRefineResult(result: RefineResult): string {
  const lines: string[] = [];

  lines.push("## 정제 결과");
  lines.push("");
  lines.push(`**이름**: \`${result.metadata.name}\``);
  lines.push(`**카테고리**: \`${result.metadata.category}\``);
  lines.push(`**설명**: ${result.metadata.description}`);
  lines.push("");

  if (result.transformations.length > 0) {
    lines.push("### 변환 내역");
    lines.push("");
    lines.push("| 원본 | 변수 | 유형 |");
    lines.push("|------|------|------|");
    for (const t of result.transformations) {
      lines.push(`| \`${t.original}\` | \`${t.replacement}\` | ${t.type} |`);
    }
    lines.push("");
  }

  if (result.variables.length > 0) {
    lines.push("### 변수 목록");
    lines.push("");
    lines.push("| 변수 | 설명 | 예시 |");
    lines.push("|------|------|------|");
    for (const v of result.variables) {
      lines.push(`| \`${v.name}\` | ${v.description} | ${v.example || "-"} |`);
    }
    lines.push("");
  }

  lines.push("### 정제된 프롬프트 미리보기");
  lines.push("");
  lines.push("```markdown");
  lines.push(result.refinedText.slice(0, 1000));
  if (result.refinedText.length > 1000) {
    lines.push("...(truncated)");
  }
  lines.push("```");
  lines.push("");
  lines.push("---");
  lines.push(`저장하려면: \`/ax-prompt save --name=${result.metadata.name} --category=${result.metadata.category}\``);

  return lines.join("\n");
}
