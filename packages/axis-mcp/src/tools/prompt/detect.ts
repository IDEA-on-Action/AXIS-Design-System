/**
 * AXIS Design System MCP - 프롬프트 탐지 도구
 *
 * 세션 컨텍스트에서 재사용 가능한 프롬프트 후보를 탐지합니다.
 */

import type {
  DetectParams,
  DetectResult,
  PromptCandidate,
  PromptScores,
  PromptCategory,
  PromptVariable,
} from "./types.js";

/** 기본 최소 점수 */
const DEFAULT_MIN_SCORE = 70;

/** 기본 최대 후보 수 */
const DEFAULT_MAX_CANDIDATES = 5;

/**
 * 재사용 패턴 키워드
 */
const REUSABLE_PATTERNS = {
  goal: ["목표", "목적", "달성", "위해", "수행"],
  steps: ["단계", "절차", "순서", "먼저", "다음", "마지막"],
  output: ["출력", "결과", "형식", "템플릿", "산출물"],
  validation: ["검증", "확인", "체크", "테스트", "검사"],
  planning: ["계획", "설계", "전략", "로드맵", "마일스톤"],
  quality: ["리뷰", "점검", "분석", "평가", "품질"],
  documentation: ["문서", "가이드", "설명", "매뉴얼", "README"],
  workflow: ["워크플로우", "프로세스", "파이프라인", "자동화"],
};

/**
 * 프로젝트 종속 패턴 (변수화 대상)
 */
const PROJECT_SPECIFIC_PATTERNS = [
  // 파일 경로
  /(?:src|packages|apps|lib|components)\/[\w\-\/]+\.(?:ts|tsx|js|jsx|md)/gi,
  // 컴포넌트명 (PascalCase)
  /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g,
  // 버전
  /\b\d+\.\d+\.\d+(?:-[\w.]+)?\b/g,
  // 날짜
  /\b\d{4}-\d{2}-\d{2}\b/g,
  // 패키지명
  /@[\w-]+\/[\w-]+/g,
];

/**
 * 텍스트를 세그먼트로 분할
 */
function segmentText(text: string): string[] {
  // 마크다운 섹션 기준으로 분할
  const sections = text.split(/(?=^#{1,3}\s)/m);

  // 빈 섹션 제거 및 최소 길이 필터링
  return sections.filter((s) => s.trim().length > 50);
}

/**
 * 반복성 점수 계산 (25점 만점)
 */
function calculateRepeatability(text: string, _context: string): number {
  let score = 0;

  // 구조화된 패턴 (목표, 단계, 출력 등) 존재 여부
  const structuredPatterns = [
    REUSABLE_PATTERNS.goal,
    REUSABLE_PATTERNS.steps,
    REUSABLE_PATTERNS.output,
  ];

  for (const patterns of structuredPatterns) {
    if (patterns.some((p) => text.includes(p))) {
      score += 5;
    }
  }

  // 마크다운 구조 (헤더, 리스트) 존재
  if (/^#{1,3}\s/m.test(text)) score += 5;
  if (/^[\-\*]\s/m.test(text)) score += 3;
  if (/^\d+\.\s/m.test(text)) score += 2;

  return Math.min(25, score);
}

/**
 * 범용성 점수 계산 (30점 만점)
 */
function calculateGenerality(text: string): number {
  let score = 30;

  // 프로젝트 특정 패턴이 많을수록 감점
  for (const pattern of PROJECT_SPECIFIC_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      score -= Math.min(10, matches.length * 2);
    }
  }

  return Math.max(0, score);
}

/**
 * 독립성 점수 계산 (25점 만점)
 */
function calculateIndependence(text: string): number {
  let score = 25;

  // 컨텍스트 의존 표현 감점
  const contextDependentPhrases = [
    "위에서 언급한",
    "앞서 말한",
    "이전에",
    "아까",
    "위 코드",
    "아래 코드",
  ];

  for (const phrase of contextDependentPhrases) {
    if (text.includes(phrase)) {
      score -= 5;
    }
  }

  return Math.max(0, score);
}

/**
 * 명확성 점수 계산 (20점 만점)
 */
function calculateClarity(text: string): number {
  let score = 0;

  // 목표 섹션 존재
  if (
    REUSABLE_PATTERNS.goal.some(
      (p) => text.includes(`## ${p}`) || text.includes(`### ${p}`)
    )
  ) {
    score += 5;
  }

  // 단계 섹션 존재
  if (
    REUSABLE_PATTERNS.steps.some(
      (p) => text.includes(`## ${p}`) || text.includes(`### ${p}`)
    )
  ) {
    score += 5;
  }

  // 출력 형식 정의
  if (text.includes("```") && text.includes("출력")) {
    score += 5;
  }

  // 체크리스트 존재
  if (/\[[\sx]\]/i.test(text)) {
    score += 5;
  }

  return Math.min(20, score);
}

/**
 * 점수 계산
 */
function calculateScores(text: string, context: string): PromptScores {
  const repeatability = calculateRepeatability(text, context);
  const generality = calculateGenerality(text);
  const independence = calculateIndependence(text);
  const clarity = calculateClarity(text);

  return {
    repeatability,
    generality,
    independence,
    clarity,
    total: repeatability + generality + independence + clarity,
  };
}

/**
 * 카테고리 추천
 */
function suggestCategory(text: string): PromptCategory {
  const categoryScores: Record<PromptCategory, number> = {
    planning: 0,
    quality: 0,
    documentation: 0,
    workflow: 0,
  };

  // 각 카테고리 키워드 매칭
  for (const keyword of REUSABLE_PATTERNS.planning) {
    if (text.includes(keyword)) categoryScores.planning += 1;
  }
  for (const keyword of REUSABLE_PATTERNS.quality) {
    if (text.includes(keyword)) categoryScores.quality += 1;
  }
  for (const keyword of REUSABLE_PATTERNS.documentation) {
    if (text.includes(keyword)) categoryScores.documentation += 1;
  }
  for (const keyword of REUSABLE_PATTERNS.workflow) {
    if (text.includes(keyword)) categoryScores.workflow += 1;
  }

  // 최고 점수 카테고리 반환
  const entries = Object.entries(categoryScores) as [PromptCategory, number][];
  entries.sort((a, b) => b[1] - a[1]);

  return entries[0][0];
}

/**
 * 변수 추출
 */
function extractVariables(text: string): PromptVariable[] {
  const variables: PromptVariable[] = [];
  const seen = new Set<string>();

  for (const pattern of PROJECT_SPECIFIC_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (seen.has(match)) continue;
        seen.add(match);

        let varName: string;
        let description: string;

        if (match.includes("/")) {
          varName = "{{FILE_PATH}}";
          description = "파일 경로";
        } else if (/^\d+\.\d+\.\d+/.test(match)) {
          varName = "{{VERSION}}";
          description = "버전";
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(match)) {
          varName = "{{DATE}}";
          description = "날짜";
        } else if (match.startsWith("@")) {
          varName = "{{PACKAGE_NAME}}";
          description = "패키지명";
        } else {
          varName = "{{COMPONENT_NAME}}";
          description = "컴포넌트/기능명";
        }

        // 중복 변수명 방지
        if (!variables.some((v) => v.name === varName)) {
          variables.push({
            name: varName,
            description,
            originalValue: match,
          });
        }
      }
    }
  }

  return variables;
}

/**
 * 개선 제안 생성
 */
function generateSuggestions(scores: PromptScores): string[] {
  const suggestions: string[] = [];

  if (scores.repeatability < 15) {
    suggestions.push("구조화된 섹션 (목표, 단계, 출력) 추가 권장");
  }
  if (scores.generality < 20) {
    suggestions.push("프로젝트 특정 값을 변수로 대체 필요");
  }
  if (scores.independence < 15) {
    suggestions.push("컨텍스트 의존 표현 제거 필요");
  }
  if (scores.clarity < 12) {
    suggestions.push("출력 형식 및 검증 체크리스트 추가 권장");
  }

  return suggestions;
}

/**
 * axis.prompt.detect 도구 구현
 *
 * 세션 컨텍스트에서 재사용 가능한 프롬프트 후보를 탐지합니다.
 */
export function handleDetect(params: DetectParams): DetectResult {
  const {
    context,
    minScore = DEFAULT_MIN_SCORE,
    maxCandidates = DEFAULT_MAX_CANDIDATES,
  } = params;

  if (!context || context.trim() === "") {
    throw new Error("컨텍스트(context)는 필수입니다.");
  }

  // 텍스트 세그먼트 분할
  const segments = segmentText(context);

  // 각 세그먼트 평가
  const candidates: PromptCandidate[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const scores = calculateScores(segment, context);

    // 최소 점수 이상만 후보로 선정
    if (scores.total >= minScore) {
      candidates.push({
        id: `candidate-${i + 1}`,
        source: i === 0 ? "user_input" : "work_output",
        originalText: segment,
        scores,
        suggestedCategory: suggestCategory(segment),
        extractedVariables: extractVariables(segment),
        suggestions: generateSuggestions(scores),
      });
    }
  }

  // 점수 기준 정렬
  candidates.sort((a, b) => b.scores.total - a.scores.total);

  // 최대 후보 수 제한
  const limitedCandidates = candidates.slice(0, maxCandidates);

  return {
    candidates: limitedCandidates,
    totalFound: candidates.length,
    threshold: minScore,
  };
}

/**
 * 탐지 결과를 Markdown 형식으로 포맷팅
 */
export function formatDetectResult(result: DetectResult): string {
  const lines: string[] = [];

  lines.push("## 프롬프트 후보 탐지");
  lines.push("");
  lines.push(`**최소 점수 기준**: ${result.threshold}점`);
  lines.push(`**발견된 후보**: ${result.totalFound}개`);
  lines.push("");

  if (result.candidates.length === 0) {
    lines.push("재사용 가능한 프롬프트 후보가 없습니다.");
    return lines.join("\n");
  }

  lines.push(
    "| # | 소스 | 점수 | 카테고리 (추천) | 변수 수 |"
  );
  lines.push("|---|------|------|-----------------|---------|");

  for (let i = 0; i < result.candidates.length; i++) {
    const c = result.candidates[i];
    const sourceLabel =
      c.source === "user_input"
        ? "사용자 입력"
        : c.source === "work_output"
          ? "작업 결과물"
          : "컨텍스트";

    lines.push(
      `| ${i + 1} | ${sourceLabel} | ${c.scores.total}점 | ${c.suggestedCategory} | ${c.extractedVariables.length}개 |`
    );
  }

  lines.push("");
  lines.push("### 상세 정보");
  lines.push("");

  for (let i = 0; i < result.candidates.length; i++) {
    const c = result.candidates[i];
    lines.push(`#### 후보 ${i + 1}`);
    lines.push("");
    lines.push("**점수 상세**:");
    lines.push(`- 반복성: ${c.scores.repeatability}/25`);
    lines.push(`- 범용성: ${c.scores.generality}/30`);
    lines.push(`- 독립성: ${c.scores.independence}/25`);
    lines.push(`- 명확성: ${c.scores.clarity}/20`);
    lines.push("");

    if (c.extractedVariables.length > 0) {
      lines.push("**추출된 변수**:");
      for (const v of c.extractedVariables) {
        lines.push(`- \`${v.name}\`: ${v.originalValue}`);
      }
      lines.push("");
    }

    if (c.suggestions.length > 0) {
      lines.push("**개선 제안**:");
      for (const s of c.suggestions) {
        lines.push(`- ${s}`);
      }
      lines.push("");
    }

    lines.push("**미리보기** (처음 200자):");
    lines.push("```");
    lines.push(c.originalText.slice(0, 200) + "...");
    lines.push("```");
    lines.push("");
  }

  lines.push("---");
  lines.push("저장하려면: `/ax-prompt save` 또는 번호 선택");

  return lines.join("\n");
}
