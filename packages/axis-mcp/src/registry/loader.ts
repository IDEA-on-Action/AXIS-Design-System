/**
 * AXIS Design System MCP - 레지스트리 로더
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type {
  ComponentMeta,
  TokenMeta,
  Registry,
  TokenCategory,
} from "../types.js";

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 레지스트리 데이터 경로
const DATA_DIR = join(__dirname, "data");

// 캐시된 레지스트리
let cachedRegistry: Registry | null = null;

/**
 * 컴포넌트 레지스트리 로드
 */
function loadComponents(): ComponentMeta[] {
  const filePath = join(DATA_DIR, "components.json");
  const content = readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);
  return data.components as ComponentMeta[];
}

/**
 * 토큰 레지스트리 로드
 */
function loadTokens(): TokenMeta[] {
  const filePath = join(DATA_DIR, "tokens.json");
  const content = readFileSync(filePath, "utf-8");
  const data = JSON.parse(content);
  return data.tokens as TokenMeta[];
}

/**
 * 전체 레지스트리 로드 (캐시 사용)
 */
export function getRegistry(): Registry {
  if (!cachedRegistry) {
    cachedRegistry = {
      components: loadComponents(),
      tokens: loadTokens(),
    };
  }
  return cachedRegistry;
}

/**
 * 레지스트리 캐시 초기화 (테스트/개발용)
 */
export function clearRegistryCache(): void {
  cachedRegistry = null;
}

/**
 * 컴포넌트 보조 메타 조회(이름으로). 목록 · 설치의 기준은 레지스트리이고(WI-0055 D2),
 * 이 메타(components.json)는 get 의 props · examples 와 ui 항목의 category · package 를 덧붙이는 데만 씁니다.
 */
export function getComponentMeta(name: string): ComponentMeta | undefined {
  const registry = getRegistry();
  return registry.components.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * 토큰 목록 조회
 */
export function listTokens(category?: TokenCategory): TokenMeta[] {
  const registry = getRegistry();

  if (category) {
    return registry.tokens.filter((t) => t.category === category);
  }

  return registry.tokens;
}

/**
 * 토큰 조회 (경로로)
 */
export function getToken(path: string): TokenMeta | undefined {
  const registry = getRegistry();
  return registry.tokens.find(
    (t) => t.path.toLowerCase() === path.toLowerCase()
  );
}

/**
 * 토큰 카테고리별 개수
 */
export function getTokenStats(): Record<TokenCategory, number> {
  const registry = getRegistry();
  const stats: Record<TokenCategory, number> = {
    color: 0,
    typography: 0,
    spacing: 0,
    radius: 0,
    shadow: 0,
    animation: 0,
  };

  for (const token of registry.tokens) {
    stats[token.category]++;
  }

  return stats;
}
