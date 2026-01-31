#!/usr/bin/env node
/**
 * AXIS Design System MCP Server
 *
 * AI 어시스턴트를 위한 디자인 시스템 컴포넌트 검색 및 설치 도구
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  handleSearchComponents,
  handleGetComponent,
  handleGetToken,
  handleListComponents,
  handleListTokens,
  handleInstallComponent,
  formatSearchResult,
  formatComponentDetail,
  formatTokenDetail,
  formatComponentList,
  formatTokenList,
  formatInstallResult,
  // 템플릿 도구
  handleListTemplates,
  formatListTemplatesResult,
  handleGetTemplate,
  formatGetTemplateResult,
  handleApplyTemplate,
  formatApplyTemplateResult,
  handleDiffTemplate,
  formatDiffTemplateResult,
  handleCheckProject,
  formatCheckProjectResult,
  // 프롬프트 도구
  handleDetect,
  handleAnalyze,
  handleRefine,
  handleValidate,
  handleSave,
  formatDetectResult,
  formatAnalyzeResult,
  formatRefineResult,
  formatValidateResult,
  formatSaveResult,
} from "./tools/index.js";

import type { ComponentCategory, TokenCategory } from "./types.js";
import type { PromptCategory } from "./tools/prompt/index.js";

// MCP 서버 생성
const server = new McpServer({
  name: "axis-design-system",
  version: "0.1.0",
});

// 도구 스키마 정의
const ComponentCategorySchema = z
  .enum(["core", "agentic", "form", "layout"])
  .optional()
  .describe("컴포넌트 카테고리 필터");

const TokenCategorySchema = z
  .enum(["color", "typography", "spacing", "radius", "shadow", "animation"])
  .optional()
  .describe("토큰 카테고리 필터");

// 도구 등록: axis.search_components
server.tool(
  "axis.search_components",
  "AXIS 디자인 시스템에서 컴포넌트를 검색합니다.",
  {
    query: z.string().describe("검색어 (컴포넌트 이름, 설명 등)"),
    category: ComponentCategorySchema,
  },
  async ({ query, category }) => {
    try {
      const result = handleSearchComponents({
        query,
        category: category as ComponentCategory | undefined,
      });
      const formatted = formatSearchResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.get_component
server.tool(
  "axis.get_component",
  "AXIS 디자인 시스템 컴포넌트의 상세 정보를 조회합니다.",
  {
    name: z.string().describe("컴포넌트 이름 (예: button, input)"),
  },
  async ({ name }) => {
    try {
      const component = handleGetComponent({ name });
      const formatted = formatComponentDetail(component);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.list_components
server.tool(
  "axis.list_components",
  "AXIS 디자인 시스템의 모든 컴포넌트 목록을 조회합니다.",
  {
    category: ComponentCategorySchema,
  },
  async ({ category }) => {
    try {
      const result = handleListComponents({
        category: category as ComponentCategory | undefined,
      });
      const formatted = formatComponentList(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.list_tokens
server.tool(
  "axis.list_tokens",
  "AXIS 디자인 시스템의 디자인 토큰 목록을 조회합니다.",
  {
    category: TokenCategorySchema,
  },
  async ({ category }) => {
    try {
      const result = handleListTokens({
        category: category as TokenCategory | undefined,
      });
      const formatted = formatTokenList(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.get_token
server.tool(
  "axis.get_token",
  "AXIS 디자인 시스템 토큰의 상세 정보를 조회합니다.",
  {
    path: z.string().describe("토큰 경로 (예: colors.primary, spacing.4)"),
  },
  async ({ path }) => {
    try {
      const token = handleGetToken({ path });
      const formatted = formatTokenDetail(token);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.install_component
server.tool(
  "axis.install_component",
  "AXIS 디자인 시스템 컴포넌트를 프로젝트에 설치합니다.",
  {
    name: z.string().describe("설치할 컴포넌트 이름"),
    targetDir: z.string().describe("설치 대상 디렉토리 경로"),
  },
  async ({ name, targetDir }) => {
    try {
      const result = handleInstallComponent({ name, targetDir });
      const formatted = formatInstallResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 프롬프트 카테고리 스키마
const PromptCategorySchema = z
  .enum(["planning", "quality", "documentation", "workflow"])
  .optional()
  .describe("프롬프트 카테고리");

// 도구 등록: axis.prompt.detect
server.tool(
  "axis.prompt.detect",
  "세션 컨텍스트에서 재사용 가능한 프롬프트 후보를 탐지합니다.",
  {
    context: z.string().describe("세션 컨텍스트 텍스트"),
    minScore: z.number().optional().describe("최소 점수 기준 (기본: 70)"),
    maxCandidates: z.number().optional().describe("최대 후보 수 (기본: 5)"),
  },
  async ({ context, minScore, maxCandidates }) => {
    try {
      const result = handleDetect({ context, minScore, maxCandidates });
      const formatted = formatDetectResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.prompt.analyze
server.tool(
  "axis.prompt.analyze",
  "텍스트의 재사용 가능성을 분석하고 구조를 파악합니다.",
  {
    text: z.string().describe("분석할 텍스트"),
  },
  async ({ text }) => {
    try {
      const result = handleAnalyze({ text });
      const formatted = formatAnalyzeResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.prompt.refine
server.tool(
  "axis.prompt.refine",
  "프로젝트 종속성을 제거하고 범용 프롬프트로 정제합니다.",
  {
    text: z.string().describe("정제할 텍스트"),
    name: z.string().optional().describe("프롬프트 이름 (kebab-case)"),
    category: PromptCategorySchema,
  },
  async ({ text, name, category }) => {
    try {
      const result = handleRefine({
        text,
        name,
        category: category as PromptCategory | undefined,
      });
      const formatted = formatRefineResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.prompt.validate
server.tool(
  "axis.prompt.validate",
  "정제된 프롬프트의 품질을 검증합니다.",
  {
    promptText: z.string().describe("검증할 프롬프트 텍스트 (프론트매터 포함)"),
    checkDuplicate: z.boolean().optional().describe("중복 검사 활성화 (기본: true)"),
  },
  async ({ promptText, checkDuplicate }) => {
    try {
      const result = handleValidate({ promptText, checkDuplicate });
      const formatted = formatValidateResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.prompt.save
server.tool(
  "axis.prompt.save",
  "검증된 프롬프트를 파일로 저장하고 인덱스를 갱신합니다.",
  {
    promptText: z.string().describe("저장할 프롬프트 텍스트 (프론트매터 포함)"),
    name: z.string().describe("프롬프트 이름 (kebab-case)"),
    category: z.enum(["planning", "quality", "documentation", "workflow"]).describe("카테고리"),
    force: z.boolean().optional().describe("강제 저장 (중복 무시, 기본: false)"),
  },
  async ({ promptText, name, category, force }) => {
    try {
      const result = handleSave({
        promptText,
        name,
        category: category as PromptCategory,
        force,
      });
      const formatted = formatSaveResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.list_templates
server.tool(
  "axis.list_templates",
  "AXIS 디자인 시스템의 템플릿 목록을 조회합니다.",
  {
    category: z.string().optional().describe("템플릿 카테고리 필터"),
  },
  async ({ category }) => {
    try {
      const result = await handleListTemplates({ category });
      const formatted = formatListTemplatesResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.get_template
server.tool(
  "axis.get_template",
  "AXIS 디자인 시스템 템플릿의 상세 정보를 조회합니다.",
  {
    name: z.string().describe("템플릿 이름 (slug)"),
  },
  async ({ name }) => {
    try {
      const result = await handleGetTemplate({ name });
      const formatted = formatGetTemplateResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.apply_template
server.tool(
  "axis.apply_template",
  "AXIS 디자인 시스템 템플릿을 프로젝트에 적용합니다.",
  {
    name: z.string().describe("템플릿 이름 (slug)"),
    targetDir: z.string().describe("적용 대상 디렉토리 경로"),
    dryRun: z.boolean().optional().describe("미리보기 모드 (파일 미생성, 기본: false)"),
  },
  async ({ name, targetDir, dryRun }) => {
    try {
      const result = await handleApplyTemplate({ name, targetDir, dryRun });
      const formatted = formatApplyTemplateResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
        isError: !result.success,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.diff_template
server.tool(
  "axis.diff_template",
  "로컬 프로젝트와 원격 템플릿의 파일 차이를 비교합니다.",
  {
    name: z.string().describe("템플릿 이름 (slug)"),
    targetDir: z.string().optional().describe("비교 대상 디렉토리 (기본: 현재 디렉토리)"),
  },
  async ({ name, targetDir }) => {
    try {
      const result = await handleDiffTemplate({ name, targetDir });
      const formatted = formatDiffTemplateResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 도구 등록: axis.check_project
server.tool(
  "axis.check_project",
  "프로젝트의 AXIS 디자인 시스템 설정 상태를 검증합니다.",
  {
    targetDir: z.string().optional().describe("검증 대상 디렉토리 (기본: 현재 디렉토리)"),
  },
  async ({ targetDir }) => {
    try {
      const result = await handleCheckProject({ targetDir });
      const formatted = formatCheckProjectResult(result);

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      return {
        content: [
          {
            type: "text" as const,
            text: `오류: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // 종료 시그널 처리
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("MCP 서버 시작 실패:", error);
  process.exit(1);
});
