/**
 * 원격 레지스트리 조회 (WI-0045 FR-3 · D1)
 *
 * 조회 순서: AXIS_REGISTRY_URL → axis.config.json 의 registry → 기본값.
 * 응답은 res.ok 를 본 뒤 본문 문자열을 직접 JSON 으로 읽습니다. Content-Type 은 보지 않습니다.
 * 타임아웃은 본문 읽기까지 포함합니다(헤더만 보내고 멈추는 서버 대비).
 */

import type { AxisConfig } from "../config/axis-config.js";
import { REGISTRY_PUBLIC_BASE_URL, parseJsonText, redactRegistryUrl } from "./schema.js";

export { REGISTRY_PUBLIC_BASE_URL };
// 가림 함수는 schema.ts 에 있습니다(schema 의 의존 URL 오류 문구도 쓰므로 순환 import 를 피해 그쪽에 둠). 종전 import 경로는 그대로 둡니다
export { redactRegistryUrl };

/**
 * 기본 레지스트리(WI-0045 D8). init 이 axis.config.json 에 기록하는 값이기도 합니다(src/init/index.ts, env 는 기록하지
 * 않음 D7). 종전 기본값 axis.minu.best/r 는 Cloudflare 403 이라(2026-10-22 실측) 공개 base 와 같은 pages.dev 로 바꿨습니다.
 */
export const DEFAULT_REGISTRY_URL = REGISTRY_PUBLIC_BASE_URL;

/** 원격 요청 하나의 기본 타임아웃(ms). 실패하면 동봉본으로 넘어가므로 짧게 둡니다 */
export const DEFAULT_REGISTRY_TIMEOUT_MS = 5000;

export type RegistryUrlSource = "env" | "config" | "default";

/**
 * 종전 기본값(WI-0045 D13). 1.4.0 이하의 init 이 axis.config.json 에 적던 값이고 지금은 Cloudflare 403 입니다.
 * config 의 registry 가 이 값과 같으면(D18 URL 정규화 비교) 새 기본값으로 바꿔 읽고 안내합니다. add · list 는 파일을 고치지 않고,
 * init 을 다시 실행하면 새 기본값으로 바꿔 씁니다(D20).
 */
export const LEGACY_DEFAULT_REGISTRY_URL = "https://axis.minu.best/r";

/** 종전 기본값 이전 안내(D13) */
export const LEGACY_REGISTRY_NOTICE =
  `axis.config.json 의 registry 가 종전 기본 주소(${LEGACY_DEFAULT_REGISTRY_URL})라 새 기본 주소(${REGISTRY_PUBLIC_BASE_URL})로 조회해요. ` +
  "axis.config.json 의 registry 를 고치면 이 안내가 사라져요";

export interface ResolvedRegistryUrl {
  url: string;
  source: RegistryUrlSource;
  /** config 의 종전 기본값을 새 기본값으로 바꿔 읽었으면 원래 값(D13) */
  migratedFrom?: string;
}

/**
 * config 값이 종전 기본값인지(D18). 앞뒤 공백을 떼고 실제 조회 URL 을 만드는 normalizeRegistryBaseUrl 로 정규화한 결과가
 * 종전 기본값과 같으면 같은 값입니다. 정규화는 스킴 · 호스트 소문자, 스킴의 기본 포트(https :443 · http :80) 제거, 경로 끝
 * `/` 모두 제거입니다. 파싱 실패 · 공백 · userinfo · 쿼리 · 해시(조회에서도 거부되는 값), 다른 경로(`/rx`) · 다른 호스트 ·
 * 다른 스킴(`http://`) · 기본이 아닌 포트는 이전하지 않습니다. 두 판정이 같은 함수를 써서 어긋나지 않습니다.
 */
export function isLegacyDefaultRegistryUrl(value: string): boolean {
  let normalized: string;
  try {
    normalized = normalizeRegistryBaseUrl(value.trim());
  } catch {
    return false;
  }
  return normalized === LEGACY_DEFAULT_REGISTRY_URL;
}

/**
 * D1 순서로 레지스트리 URL 을 고릅니다. 빈 문자열 · 공백은 없는 것으로 봅니다.
 * config 의 registry 가 종전 기본값이면 새 기본값으로 바꿔 읽고 migratedFrom 에 원래 값을 남깁니다(D13).
 * 환경변수가 있으면 그것이 우선이라 이전은 적용되지 않습니다. 사용자가 직접 지정한 다른 주소는 그대로 존중합니다.
 */
export function resolveRegistryUrl(options: {
  env?: NodeJS.ProcessEnv;
  config?: AxisConfig | null;
}): ResolvedRegistryUrl {
  const env = options.env ?? process.env;
  const fromEnv = env.AXIS_REGISTRY_URL?.trim();
  if (fromEnv) return { url: fromEnv, source: "env" };
  const fromConfig = typeof options.config?.registry === "string" ? options.config.registry.trim() : "";
  if (fromConfig) {
    if (isLegacyDefaultRegistryUrl(fromConfig)) {
      return { url: DEFAULT_REGISTRY_URL, source: "config", migratedFrom: fromConfig };
    }
    return { url: fromConfig, source: "config" };
  }
  return { url: DEFAULT_REGISTRY_URL, source: "default" };
}

/**
 * 레지스트리 기본 URL 을 검사하고 정규화합니다. http · https 만 허용하고, 공백 · userinfo · 쿼리 · 해시는
 * G1 normalizePublicUrl(scripts/registry-integrity.mjs)과 같은 기준으로 거부합니다(n4). 거부되면 호출한 쪽(RegistryClient)이
 * 접근 실패로 보고 동봉본으로 폴백합니다. 오류 문구의 URL 은 userinfo · 쿼리 · 해시 값을 가립니다(p1).
 * 결과는 `<스킴>//<호스트[:포트]><경로>` 이고 스킴 · 호스트 소문자, 스킴의 기본 포트 제거, 경로 끝 `/` 제거입니다(D18).
 * 종전 기본값 판정(isLegacyDefaultRegistryUrl)도 이 결과로 비교합니다.
 */
export function normalizeRegistryBaseUrl(raw: string): string {
  const shown = redactRegistryUrl(raw);
  if (/\s/.test(raw)) throw new Error(`레지스트리 URL 에 공백을 둘 수 없습니다: ${JSON.stringify(shown)}`);
  if (raw.includes("?") || raw.includes("#")) throw new Error(`레지스트리 URL 에 쿼리 · 해시를 둘 수 없습니다: ${shown}`);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`레지스트리 URL 형식이 아닙니다: ${shown}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`레지스트리 URL 은 http · https 만 지원합니다: ${shown}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`레지스트리 URL 에 사용자 정보(userinfo)를 둘 수 없습니다: ${shown}`);
  }
  if (parsed.search || parsed.hash) throw new Error(`레지스트리 URL 에 쿼리 · 해시를 둘 수 없습니다: ${shown}`);
  // D18 정규화: URL 파서가 스킴 · 호스트를 소문자로 바꾸고 스킴의 기본 포트를 지웁니다. 경로 끝 `/` 는 모두 뗍니다
  return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, "")}`;
}

/**
 * 원격에 닿지 못한 실패(접속 · 타임아웃 · 2xx 가 아닌 상태 코드). 응답을 받았는데 내용이 틀린 실패(JSON · 스키마 · sha256)와
 * 폴백 안내 문구를 가르려고 따로 둡니다(WI-0045 m1)
 */
export class RegistryAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistryAccessError";
  }
}

export type FetchLike = (
  input: string,
  init?: { signal?: AbortSignal; headers?: Record<string, string>; redirect?: "manual" }
) => Promise<{
  ok: boolean;
  status: number;
  /** redirect: "manual" 에서 브라우저형 구현이 주는 "opaqueredirect" */
  type?: string;
  text(): Promise<string>;
}>;

/**
 * URL 하나를 받아 JSON 으로 읽습니다. 접속 · 타임아웃 · 상태 코드 실패는 RegistryAccessError, 본문이 JSON 이 아니면
 * 일반 Error 로 던집니다.
 */
export async function fetchRegistryJson(
  url: string,
  options: {
    timeoutMs?: number;
    fetchImpl?: FetchLike;
    /** 리다이렉트를 따라가지 않고 접근 실패로 봅니다(WI-0055 D13, mcp 의 config registry). 기본은 따라감(cli 종전) */
    rejectRedirects?: boolean;
  } = {}
): Promise<unknown> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REGISTRY_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as unknown as FetchLike | undefined);
  if (!fetchImpl) throw new RegistryAccessError("이 Node 런타임에는 fetch 가 없습니다(Node 18 이상 필요)");

  // 오류 문구에 찍는 URL 은 userinfo · 쿼리 · 해시를 가립니다(p1). 요청에는 원래 URL 을 씁니다
  const shown = redactRegistryUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  /** 접속 · 본문 읽기 실패를 한 형태의 메시지로 바꿉니다 */
  const describe = (error: unknown): Error => {
    if (controller.signal.aborted) return new RegistryAccessError(`${shown}: ${timeoutMs}ms 안에 응답이 없습니다`);
    const cause = (error as { cause?: { code?: string; message?: string } })?.cause;
    const detail = cause?.code ?? cause?.message ?? (error instanceof Error ? error.message : String(error));
    return new RegistryAccessError(`${shown}: 요청 실패(${detail})`);
  };

  let text: string;
  try {
    let res: Awaited<ReturnType<FetchLike>>;
    try {
      res = await fetchImpl(url, {
        signal: controller.signal,
        headers: { accept: "application/json" },
        ...(options.rejectRedirects ? { redirect: "manual" as const } : {}),
      });
    } catch (error) {
      throw describe(error);
    }
    if (options.rejectRedirects && (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400) || res.status === 0)) {
      await res.text().catch(() => undefined);
      throw new RegistryAccessError(`${shown}: 리다이렉트(HTTP ${res.status})를 따라가지 않습니다`);
    }
    if (!res.ok) {
      // 본문을 비워 연결을 돌려줍니다(남은 본문이 프로세스 종료를 붙잡지 않게). 실패해도 판정은 상태 코드로 끝납니다
      await res.text().catch(() => undefined);
      throw new RegistryAccessError(`${shown}: HTTP ${res.status}`);
    }
    try {
      text = await res.text();
    } catch (error) {
      throw describe(error);
    }
  } finally {
    clearTimeout(timer);
  }
  return parseJsonText(text, shown);
}
