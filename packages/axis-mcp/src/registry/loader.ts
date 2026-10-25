/**
 * AXIS Design System MCP - 레지스트리 로더
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  TOKEN_CATEGORIES,
  type ComponentMeta,
  type TokenMeta,
  type Registry,
  type TokenCategory,
} from "../types.js";

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 레지스트리 데이터 경로
const DATA_DIR = join(__dirname, "data");

// 캐시(컴포넌트 메타와 토큰은 따로 읽습니다. 토큰 파일은 빌드 산출물이라 src 에서 도는 테스트에는 없을 수 있음)
let cachedComponents: ComponentMeta[] | null = null;
let cachedTokens: TokenData | null = null;

/** dist/data/tokens.json 의 내용 */
export interface TokenData {
  source?: Registry["tokenSource"];
  tokens: TokenMeta[];
}

/**
 * 컴포넌트 레지스트리 로드
 */
function loadComponents(): ComponentMeta[] {
  if (!cachedComponents) {
    const filePath = join(DATA_DIR, "components.json");
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    cachedComponents = data.components as ComponentMeta[];
  }
  return cachedComponents;
}

/**
 * 토큰 레지스트리 로드. dist/data/tokens.json 은 빌드 때 @axis-ds/tokens 산출물에서 생성합니다(WI-0076, token-gen.mjs).
 * src 에는 사본을 두지 않습니다(사본이 원본에 뒤처진 1.3.5 까지의 결함).
 */
function loadTokens(): TokenData {
  if (!cachedTokens) {
    const filePath = join(DATA_DIR, "tokens.json");
    const content = readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    cachedTokens = { source: data.source, tokens: data.tokens as TokenMeta[] };
  }
  return cachedTokens;
}

/**
 * 전체 레지스트리 로드 (캐시 사용)
 */
export function getRegistry(): Registry {
  const tokens = loadTokens();
  return { components: loadComponents(), tokens: tokens.tokens, tokenSource: tokens.source };
}

/**
 * 레지스트리 캐시 초기화 (테스트/개발용)
 */
export function clearRegistryCache(): void {
  cachedComponents = null;
  cachedTokens = null;
}

/**
 * 토큰 데이터를 직접 넣습니다(테스트용: src 에서 돌 때 생성 함수 결과를 넣음). null 이면 다시 파일에서 읽습니다.
 */
export function setTokenData(data: TokenData | null): void {
  cachedTokens = data;
}

/**
 * 컴포넌트 보조 메타 조회(이름으로). 목록 · 설치의 기준은 레지스트리이고(WI-0055 D2),
 * 이 메타(components.json)는 get 의 props · examples 와 ui 항목의 category · package 를 덧붙이는 데만 씁니다.
 */
export function getComponentMeta(name: string): ComponentMeta | undefined {
  return loadComponents().find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * 토큰 목록 조회
 */
export function listTokens(category?: TokenCategory): TokenMeta[] {
  const { tokens } = loadTokens();

  if (category) {
    return tokens.filter((t) => t.category === category);
  }

  return tokens;
}

/**
 * 토큰 조회. 경로 · 별칭(tokens 이름 기반 경로) · CSS 변수 이름 가운데 하나와 같으면 찾습니다(대소문자 무시).
 */
export function getToken(path: string): TokenMeta | undefined {
  const q = path.trim().toLowerCase();
  return loadTokens().tokens.find(
    (t) =>
      t.path.toLowerCase() === q ||
      (t.aliases ?? []).some((a) => a.toLowerCase() === q) ||
      t.cssVariable.toLowerCase() === q
  );
}

/**
 * 토큰 데이터의 출처(생성에 쓴 @axis-ds/tokens 버전)
 */
export function getTokenSource(): Registry["tokenSource"] {
  return loadTokens().source;
}

/**
 * 토큰 카테고리별 개수
 */
export function getTokenStats(): Record<TokenCategory, number> {
  const { tokens } = loadTokens();
  const stats = Object.fromEntries(TOKEN_CATEGORIES.map((c) => [c, 0])) as Record<TokenCategory, number>;

  for (const token of tokens) {
    stats[token.category]++;
  }

  return stats;
}
