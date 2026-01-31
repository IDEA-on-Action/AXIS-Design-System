/**
 * AXIS Design System MCP - 프롬프트 분석 도구
 *
 * 텍스트의 재사용 가능성을 분석하고 구조를 파악합니다.
 */

import type {
  AnalyzeParams,
  AnalyzeResult,
  PromptScores,
  PromptCategory,
} from "./types.js";

/**
 * 섹션 키워드 매핑
 */
const SECTION_KEYWORDS = {
  goal: ["목표", "목적", "개요", "소개", "배경"],
  steps: ["단계", "절차", "수행", "작업", "방법", "구현"],
  output: ["출력", "결과", "형식", "산출물", "템플릿"],
  validation: ["검증", "확인", "체크", "테스트", "검사", "검토"],
};

/**
 * 카테고리 키워드
 */
const CATEGORY_KEYWORDS: Record<PromptCategory, string[]> = {
  planning: [
    "계획",
    "설계",
    "전략",
    "로드맵",
    "마일스톤",
    "요구사항",
    "분석",
    "아키텍처",
  ],
  quality: [
    "리뷰",
    "점검",
    "품질",
    "테스트",
    "검증",
    "보안",
    "성능",
    "접근성",
  ],
  documentation: [
    "문서",
    "가이드",
    "매뉴얼",
    "API",
    "README",
    "설명",
    "튜토리얼",
  ],
  workflow: [
    "워크플로우",
    "프로세스",
    "파이프라인",
    "자동화",
    "CI",
    "CD",
    "배포",
    "릴리스",
  ],
};

/**
 * 프로젝트 종속 패턴
 */
const PROJECT_PATTERNS = {
  path: /(?:src|packages|apps|lib|components)\/[\w\-\/]+\.(?:ts|tsx|js|jsx|md)/gi,
  name: /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g,
  version: /\b\d+\.\d+\.\d+(?:-[\w.]+)?\b/g,
  date: /\b\d{4}-\d{2}-\d{2}\b/g,
  package: /@[\w-]+\/[\w-]+/g,
};

/**
 * 반복성 점수 계산
 */
function calculateRepeatability(text: string): {
  score: number;
  feedback: string;
} {
  let score = 0;
  const reasons: string[] = [];

  // 마크다운 헤더 구조
  const headerCount = (text.match(/^#{1,3}\s/gm) || []).length;
  if (headerCount >= 3) {
    score += 8;
    reasons.push(`${headerCount}개 섹션 구조 발견`);
  } else if (headerCount > 0) {
    score += 4;
    reasons.push(`${headerCount}개 섹션 존재`);
  }

  // 리스트 구조
  const listCount = (text.match(/^[\-\*]\s/gm) || []).length;
  const numberedCount = (text.match(/^\d+\.\s/gm) || []).length;
  if (listCount + numberedCount >= 5) {
    score += 8;
    reasons.push("체계적인 리스트 구조");
  } else if (listCount + numberedCount > 0) {
    score += 4;
    reasons.push("리스트 구조 존재");
  }

  // 구조화 키워드
  const structuredKeywords = [
    ...SECTION_KEYWORDS.goal,
    ...SECTION_KEYWORDS.steps,
  ];
  const keywordMatches = structuredKeywords.filter((k) =>
    text.includes(k)
  ).length;
  if (keywordMatches >= 3) {
    score += 9;
    reasons.push("구조화 키워드 다수 포함");
  } else if (keywordMatches > 0) {
    score += 4;
    reasons.push(`${keywordMatches}개 구조화 키워드`);
  }

  return {
    score: Math.min(25, score),
    feedback: reasons.length > 0 ? reasons.join(", ") : "구조화 패턴 부족",
  };
}

/**
 * 범용성 점수 계산
 */
function calculateGenerality(
  text: string
): { score: number; feedback: string; projectValues: AnalyzeResult["projectSpecificValues"] } {
  let score = 30;
  const reasons: string[] = [];
  const projectValues: AnalyzeResult["projectSpecificValues"] = [];

  // 파일 경로
  const paths = text.match(PROJECT_PATTERNS.path);
  if (paths) {
    score -= Math.min(8, paths.length * 2);
    reasons.push(`${paths.length}개 파일 경로 감지`);
    paths.forEach((p) =>
      projectValues.push({
        value: p,
        type: "path",
        suggestedVariable: "{{FILE_PATH}}",
      })
    );
  }

  // 버전
  const versions = text.match(PROJECT_PATTERNS.version);
  if (versions) {
    score -= Math.min(4, versions.length);
    reasons.push(`${versions.length}개 버전 감지`);
    versions.forEach((v) =>
      projectValues.push({
        value: v,
        type: "version",
        suggestedVariable: "{{VERSION}}",
      })
    );
  }

  // 날짜
  const dates = text.match(PROJECT_PATTERNS.date);
  if (dates) {
    score -= Math.min(4, dates.length);
    reasons.push(`${dates.length}개 날짜 감지`);
    dates.forEach((d) =>
      projectValues.push({
        value: d,
        type: "date",
        suggestedVariable: "{{DATE}}",
      })
    );
  }

  // 패키지명
  const packages = text.match(PROJECT_PATTERNS.package);
  if (packages) {
    score -= Math.min(6, packages.length * 2);
    reasons.push(`${packages.length}개 패키지명 감지`);
    packages.forEach((p) =>
      projectValues.push({
        value: p,
        type: "name",
        suggestedVariable: "{{PACKAGE_NAME}}",
      })
    );
  }

  // PascalCase 이름 (컴포넌트명 추정)
  const names = text.match(PROJECT_PATTERNS.name);
  if (names) {
    // 일반적인 단어는 제외
    const filteredNames = names.filter(
      (n) =>
        ![
          "README",
          "TypeScript",
          "JavaScript",
          "React",
          "Next",
          "Node",
        ].includes(n)
    );
    if (filteredNames.length > 0) {
      score -= Math.min(8, filteredNames.length * 2);
      reasons.push(`${filteredNames.length}개 고유명 감지`);
      filteredNames.forEach((n) =>
        projectValues.push({
          value: n,
          type: "name",
          suggestedVariable: "{{COMPONENT_NAME}}",
        })
      );
    }
  }

  return {
    score: Math.max(0, score),
    feedback:
      reasons.length > 0 ? reasons.join(", ") : "프로젝트 종속성 낮음",
    projectValues,
  };
}

/**
 * 독립성 점수 계산
 */
function calculateIndependence(text: string): {
  score: number;
  feedback: string;
} {
  let score = 25;
  const reasons: string[] = [];

  // 컨텍스트 의존 표현
  const contextPhrases = [
    "위에서",
    "앞서",
    "이전에",
    "아까",
    "위 코드",
    "아래 코드",
    "말씀하신",
    "요청하신",
  ];

  for (const phrase of contextPhrases) {
    if (text.includes(phrase)) {
      score -= 5;
      reasons.push(`"${phrase}" 표현 포함`);
    }
  }

  // 대명사 의존
  const pronounPatterns = [/그것[을이가]/g, /이것[을이가]/g, /저것[을이가]/g];
  for (const pattern of pronounPatterns) {
    if (pattern.test(text)) {
      score -= 3;
      reasons.push("대명사 참조 포함");
      break;
    }
  }

  return {
    score: Math.max(0, score),
    feedback: reasons.length > 0 ? reasons.join(", ") : "독립적으로 동작 가능",
  };
}

/**
 * 명확성 점수 계산
 */
function calculateClarity(text: string): { score: number; feedback: string } {
  let score = 0;
  const reasons: string[] = [];

  // 목표 섹션
  if (SECTION_KEYWORDS.goal.some((k) => text.includes(`## ${k}`) || text.includes(`### ${k}`))) {
    score += 5;
    reasons.push("목표 섹션 존재");
  }

  // 단계 섹션
  if (SECTION_KEYWORDS.steps.some((k) => text.includes(`## ${k}`) || text.includes(`### ${k}`))) {
    score += 5;
    reasons.push("수행 단계 섹션 존재");
  }

  // 출력 형식
  if (text.includes("```") && SECTION_KEYWORDS.output.some((k) => text.includes(k))) {
    score += 5;
    reasons.push("출력 형식 정의됨");
  }

  // 체크리스트
  if (/\[[\sx]\]/i.test(text)) {
    score += 5;
    reasons.push("검증 체크리스트 포함");
  }

  return {
    score: Math.min(20, score),
    feedback: reasons.length > 0 ? reasons.join(", ") : "명확성 개선 필요",
  };
}

/**
 * 카테고리 추천
 */
function suggestCategory(text: string): PromptCategory {
  const scores: Record<PromptCategory, number> = {
    planning: 0,
    quality: 0,
    documentation: 0,
    workflow: 0,
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(keyword, "gi");
      const matches = text.match(regex);
      if (matches) {
        scores[category as PromptCategory] += matches.length;
      }
    }
  }

  const entries = Object.entries(scores) as [PromptCategory, number][];
  entries.sort((a, b) => b[1] - a[1]);

  return entries[0][0];
}

/**
 * 섹션 추출
 */
function extractSections(text: string): AnalyzeResult["sections"] {
  const sections: AnalyzeResult["sections"] = {};

  // 목표 추출
  for (const keyword of SECTION_KEYWORDS.goal) {
    const goalMatch = text.match(
      new RegExp(`##?#?\\s*${keyword}[\\s\\S]*?(?=##|$)`, "i")
    );
    if (goalMatch) {
      sections.goal = goalMatch[0].trim();
      break;
    }
  }

  // 단계 추출
  const stepMatches = text.match(/^\d+\.\s+.+$/gm);
  if (stepMatches) {
    sections.steps = stepMatches.map((s) => s.replace(/^\d+\.\s+/, ""));
  }

  // 출력 형식 추출
  for (const keyword of SECTION_KEYWORDS.output) {
    const outputMatch = text.match(
      new RegExp(`##?#?\\s*${keyword}[\\s\\S]*?(?=##|$)`, "i")
    );
    if (outputMatch) {
      sections.output = outputMatch[0].trim();
      break;
    }
  }

  // 검증 항목 추출
  const validationMatches = text.match(/^\s*\[[\sx]\]\s*.+$/gim);
  if (validationMatches) {
    sections.validation = validationMatches.map((v) =>
      v.replace(/^\s*\[[\sx]\]\s*/, "")
    );
  }

  return sections;
}

/**
 * axis.prompt.analyze 도구 구현
 *
 * 텍스트의 재사용 가능성을 분석하고 구조를 파악합니다.
 */
export function handleAnalyze(params: AnalyzeParams): AnalyzeResult {
  const { text } = params;

  if (!text || text.trim() === "") {
    throw new Error("분석할 텍스트(text)는 필수입니다.");
  }

  // 점수 계산
  const repeatability = calculateRepeatability(text);
  const generality = calculateGenerality(text);
  const independence = calculateIndependence(text);
  const clarity = calculateClarity(text);

  const scores: PromptScores = {
    repeatability: repeatability.score,
    generality: generality.score,
    independence: independence.score,
    clarity: clarity.score,
    total:
      repeatability.score +
      generality.score +
      independence.score +
      clarity.score,
  };

  return {
    text,
    scores,
    feedback: {
      repeatability: repeatability.feedback,
      generality: generality.feedback,
      independence: independence.feedback,
      clarity: clarity.feedback,
    },
    suggestedCategory: suggestCategory(text),
    isCandidate: scores.total >= 70,
    sections: extractSections(text),
    projectSpecificValues: generality.projectValues,
  };
}

/**
 * 분석 결과를 Markdown 형식으로 포맷팅
 */
export function formatAnalyzeResult(result: AnalyzeResult): string {
  const lines: string[] = [];

  lines.push("## 프롬프트 분석");
  lines.push("");
  lines.push(`**총점**: ${result.scores.total}/100`);
  lines.push(
    `**재사용 적합**: ${result.isCandidate ? "✅ 예 (70점 이상)" : "❌ 아니오"}`
  );
  lines.push(`**추천 카테고리**: ${result.suggestedCategory}`);
  lines.push("");

  lines.push("### 점수 상세");
  lines.push("");
  lines.push("| 항목 | 점수 | 피드백 |");
  lines.push("|------|------|--------|");
  lines.push(
    `| 반복성 | ${result.scores.repeatability}/25 | ${result.feedback.repeatability} |`
  );
  lines.push(
    `| 범용성 | ${result.scores.generality}/30 | ${result.feedback.generality} |`
  );
  lines.push(
    `| 독립성 | ${result.scores.independence}/25 | ${result.feedback.independence} |`
  );
  lines.push(
    `| 명확성 | ${result.scores.clarity}/20 | ${result.feedback.clarity} |`
  );
  lines.push("");

  if (result.projectSpecificValues.length > 0) {
    lines.push("### 프로젝트 종속 값 (변수화 대상)");
    lines.push("");
    lines.push("| 원본 값 | 유형 | 제안 변수 |");
    lines.push("|---------|------|-----------|");
    for (const v of result.projectSpecificValues) {
      lines.push(`| \`${v.value}\` | ${v.type} | \`${v.suggestedVariable}\` |`);
    }
    lines.push("");
  }

  if (Object.keys(result.sections).length > 0) {
    lines.push("### 추출된 섹션");
    lines.push("");
    if (result.sections.goal) {
      lines.push("- ✅ 목표 섹션");
    }
    if (result.sections.steps) {
      lines.push(`- ✅ 단계 (${result.sections.steps.length}개)`);
    }
    if (result.sections.output) {
      lines.push("- ✅ 출력 형식");
    }
    if (result.sections.validation) {
      lines.push(`- ✅ 검증 항목 (${result.sections.validation.length}개)`);
    }
    lines.push("");
  }

  // 개선 제안
  const suggestions: string[] = [];
  if (result.scores.repeatability < 15) {
    suggestions.push("구조화된 섹션 (목표, 단계, 출력) 추가 권장");
  }
  if (result.scores.generality < 20) {
    suggestions.push("프로젝트 특정 값을 변수로 대체 필요");
  }
  if (result.scores.independence < 15) {
    suggestions.push("컨텍스트 의존 표현 제거 필요");
  }
  if (result.scores.clarity < 12) {
    suggestions.push("출력 형식 및 검증 체크리스트 추가 권장");
  }

  if (suggestions.length > 0) {
    lines.push("### 개선 제안");
    lines.push("");
    for (const s of suggestions) {
      lines.push(`- ${s}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
