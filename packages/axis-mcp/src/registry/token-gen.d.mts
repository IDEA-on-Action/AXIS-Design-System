/**
 * token-gen.mjs 타입 선언 (WI-0076). 구현은 빌드 단계에서 node 로 바로 실행되도록 JS 로 둡니다.
 */
import type { TokenMeta } from "../types.js";

export type { TokenMeta };

export declare const GENERATED_CATEGORIES: string[];

export interface TokenSourcePaths {
  json: string;
  variablesCss: string;
  shadcnCss: string;
  version: string;
}

export interface TokenData {
  source: { package: "@axis-ds/tokens"; version: string };
  tokens: TokenMeta[];
}

export declare function axisPath(name: string): string;

export declare function generateTokens(sources: {
  json: string;
  variablesCss: string;
  shadcnCss: string;
}): TokenMeta[];

export declare function resolveTokenSources(from?: string): TokenSourcePaths;

export declare function buildTokenData(paths?: TokenSourcePaths): TokenData;
