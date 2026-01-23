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
} from "./tools/index.js";

import type { ComponentCategory, TokenCategory } from "./types.js";

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
