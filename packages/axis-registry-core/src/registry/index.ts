/**
 * 레지스트리 클라이언트 (WI-0045 FR-3 · D1)
 *
 * 원격 1차(AXIS_REGISTRY_URL → axis.config.json registry → 기본값), 실패하면 CLI 동봉본으로 폴백합니다.
 * 2차 원격(pages.dev · jsDelivr)은 두지 않습니다(D1).
 *
 * 판정 규칙
 * - 이름은 조회 전에 slug 검사를 합니다. 규칙 밖 이름은 네트워크 · 파일을 건드리지 않고 거부합니다.
 * - index 에 없는 이름은 「없음」이고 폴백하지 않습니다(원격 장애가 아니라 이름 문제).
 * - 원격 실패(접속 · 타임아웃 · 상태 코드 · JSON · 스키마 · sha256)는 모두 폴백 사유입니다. 안내 문구는 원격에 닿지
 *   못한 실패(접근 실패)와 응답 내용이 검증을 통과하지 못한 실패(형식 검증 실패)를 구분합니다(m1). 폴백 동작은 같습니다.
 * - registryDependencies URL 은 원격 응답이면 지금 조회 중인 원격 base 와 공개 기본 base, 동봉본이면 공개 기본 base 로
 *   시작하는 `<base>/<이름>.json` 만 받습니다(D11).
 *   index 조회든 항목 조회든 한 번 실패하면 그 뒤로는 동봉본만 씁니다. 이미 원격에서 받은 항목은 이 클라이언트가
 *   되돌리지 않으므로, 한 실행 안에서 출처를 섞지 않으려면 호출한 쪽이 출처가 바뀐 것(origin)을 보고 처음부터
 *   다시 받아야 합니다(add 의 collectItems 가 그렇게 합니다).
 * - 폴백 안내와 version 차이 알림은 실행마다 한 번만 냅니다.
 */

import { findBundledRegistryDir, readBundledJson } from "./bundled.js";
import {
  DEFAULT_REGISTRY_TIMEOUT_MS,
  RegistryAccessError,
  fetchRegistryJson,
  normalizeRegistryBaseUrl,
  type FetchLike,
} from "./remote.js";
import {
  DEFAULT_DEPENDENCY_BASES,
  REGISTRY_PUBLIC_BASE_URL,
  checkItemSha256,
  isValidRegistryName,
  validateRegistryIndex,
  validateRegistryItem,
  type RegistryIndex,
  type RegistryItem,
} from "./schema.js";

export * from "./schema.js";
export {
  DEFAULT_REGISTRY_TIMEOUT_MS,
  DEFAULT_REGISTRY_URL,
  fetchRegistryJson,
  isLegacyDefaultRegistryUrl,
  LEGACY_DEFAULT_REGISTRY_URL,
  LEGACY_REGISTRY_NOTICE,
  normalizeRegistryBaseUrl,
  redactRegistryUrl,
  RegistryAccessError,
  resolveRegistryUrl,
  type FetchLike,
  type RegistryUrlSource,
  type ResolvedRegistryUrl,
} from "./remote.js";
export { findBundledRegistryDir } from "./bundled.js";

export type RegistryErrorCode = "invalid-name" | "not-found" | "unavailable";

/** 조회 실패. code 로 원인을 가릅니다 */
export class RegistryError extends Error {
  constructor(
    readonly code: RegistryErrorCode,
    message: string
  ) {
    super(message);
    this.name = "RegistryError";
  }
}

export type RegistryOrigin = "remote" | "bundled";

export interface RegistryClientOptions {
  /** 원격 레지스트리 기본 URL(resolveRegistryUrl 결과). null 이면 원격을 건너뛰고 동봉본만 씁니다 */
  url: string | null;
  /** 동봉본 디렉터리. 생략하면 dist/registry 를 찾고, null 이면 동봉본 없음으로 봅니다 */
  bundledDir?: string | null;
  /** 원격 요청 하나의 타임아웃(ms) */
  timeoutMs?: number;
  fetchImpl?: FetchLike;
  /** 안내 출력. 기본은 console.warn */
  notify?: (message: string) => void;
  /** 동봉본을 부르는 이름(안내 · 오류 문구). 기본은 「CLI 에 포함된 레지스트리」, mcp 는 「MCP 에 포함된 레지스트리」(WI-0055) */
  bundledLabel?: string;
}

/** 동봉본을 부르는 기본 이름(cli) */
export const DEFAULT_BUNDLED_LABEL = "CLI 에 포함된 레지스트리";

/**
 * 폴백 사유 종류(m1). access: 원격에 닿지 못함(접속 · 타임아웃 · 상태 코드 · URL 없음 · URL 형식),
 * invalid: 응답은 받았지만 내용이 검증을 통과하지 못함(JSON · 스키마 · sha256 · 이름 불일치 · 의존 URL 형식)
 */
export type FallbackKind = "access" | "invalid";

/** 폴백 안내 문구(FR-3 · m1). version 은 동봉본의 index.json version 입니다 */
export function bundledFallbackMessage(
  version: string,
  reason: string,
  kind: FallbackKind = "access",
  label: string = DEFAULT_BUNDLED_LABEL
): string {
  const lead =
    kind === "invalid"
      ? "원격 레지스트리 응답이 형식 검증을 통과하지 못해"
      : "원격 레지스트리에 접근하지 못해";
  return `${lead} ${label}(version ${version})를 사용합니다. (원인: ${reason})`;
}

/** 실패 종류 판정. 원격 접근 실패(RegistryAccessError)만 access 이고 나머지는 응답 내용 문제입니다 */
function fallbackKindOf(error: unknown): FallbackKind {
  return error instanceof RegistryAccessError ? "access" : "invalid";
}

/** 원격과 동봉본의 version 이 다를 때 알림 */
export function versionMismatchMessage(
  remoteVersion: string,
  bundledVersion: string,
  label: string = DEFAULT_BUNDLED_LABEL
): string {
  return `원격 레지스트리(version ${remoteVersion})와 ${label}(version ${bundledVersion})의 version 이 다릅니다. 원격 레지스트리를 우선 사용합니다.`;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class RegistryClient {
  private readonly baseUrl: string | null;
  private readonly baseUrlError: string | null;
  private readonly bundledDir: string | null;
  private readonly timeoutMs: number;
  private readonly fetchImpl?: FetchLike;
  private readonly notify: (message: string) => void;
  private readonly bundledLabel: string;

  private mode: RegistryOrigin | null = null;
  private indexPromise: Promise<RegistryIndex> | null = null;
  private bundledIndex: RegistryIndex | null = null;
  private fallbackAnnounced = false;

  constructor(options: RegistryClientOptions) {
    let baseUrl: string | null = null;
    let baseUrlError: string | null = null;
    if (options.url !== null) {
      try {
        baseUrl = normalizeRegistryBaseUrl(options.url);
      } catch (error) {
        baseUrlError = messageOf(error);
      }
    } else {
      baseUrlError = "원격 레지스트리 URL 이 지정되지 않았습니다";
    }
    this.baseUrl = baseUrl;
    this.baseUrlError = baseUrlError;
    this.bundledDir = options.bundledDir === undefined ? findBundledRegistryDir() : options.bundledDir;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_REGISTRY_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl;
    this.notify = options.notify ?? ((message) => console.warn(message));
    this.bundledLabel = options.bundledLabel ?? DEFAULT_BUNDLED_LABEL;
  }

  /** 지금 쓰는 출처. index 를 읽기 전에는 null 입니다 */
  get origin(): RegistryOrigin | null {
    return this.mode;
  }

  /** 레지스트리 목록(index.json) */
  getIndex(): Promise<RegistryIndex> {
    if (!this.indexPromise) this.indexPromise = this.loadIndex();
    return this.indexPromise;
  }

  /** 항목 하나. 이름 검사 → index 확인 → 항목 조회 순서입니다 */
  async getItem(name: string): Promise<RegistryItem> {
    if (!isValidRegistryName(name)) {
      throw new RegistryError(
        "invalid-name",
        `'${name}' 는 레지스트리 항목 이름 규칙(소문자 · 숫자 · 하이픈)에 맞지 않습니다`
      );
    }
    const index = await this.getIndex();
    const entry = index.items.find((it) => it.name === name);
    if (!entry) {
      throw new RegistryError("not-found", `'${name}' 항목이 레지스트리(version ${index.version})에 없습니다`);
    }

    if (this.mode === "remote" && this.baseUrl) {
      try {
        const data = await fetchRegistryJson(`${this.baseUrl}/${name}.json`, this.fetchOptions());
        const item = validateRegistryItem(data, name, `${name}.json`, this.remoteDependencyBases());
        checkItemSha256(item, entry);
        return item;
      } catch (error) {
        // 항목 조회가 실패하면 그 뒤로는 동봉본만 씁니다
        await this.switchToBundled(messageOf(error), fallbackKindOf(error));
        return this.readBundledItem(name);
      }
    }
    return this.readBundledItem(name);
  }

  /** 원격 응답의 의존 URL 로 받아 주는 base: 지금 조회 중인 원격 base 와 공개 기본 base(D11) */
  private remoteDependencyBases(): string[] {
    const bases = [REGISTRY_PUBLIC_BASE_URL];
    if (this.baseUrl && this.baseUrl !== REGISTRY_PUBLIC_BASE_URL) bases.unshift(this.baseUrl);
    return bases;
  }

  private fetchOptions() {
    return { timeoutMs: this.timeoutMs, ...(this.fetchImpl ? { fetchImpl: this.fetchImpl } : {}) };
  }

  private async loadIndex(): Promise<RegistryIndex> {
    let remoteError: string;
    let kind: FallbackKind = "access";
    if (this.baseUrl) {
      try {
        const data = await fetchRegistryJson(`${this.baseUrl}/index.json`, this.fetchOptions());
        const index = validateRegistryIndex(data, `${this.baseUrl}/index.json`);
        this.mode = "remote";
        this.warnVersionMismatch(index.version);
        return index;
      } catch (error) {
        remoteError = messageOf(error);
        kind = fallbackKindOf(error);
      }
    } else {
      remoteError = this.baseUrlError ?? "원격 레지스트리 URL 이 없습니다";
    }
    return this.switchToBundled(remoteError, kind);
  }

  /** 동봉본 index 를 읽습니다(성공하면 한 번만). 실패하면 이유를 돌려줍니다 */
  private loadBundledIndex(): { index: RegistryIndex } | { error: string } {
    if (this.bundledIndex) return { index: this.bundledIndex };
    if (!this.bundledDir) return { error: `${this.bundledLabel}를 찾지 못했습니다` };
    try {
      this.bundledIndex = validateRegistryIndex(readBundledJson(this.bundledDir, "index.json"), "동봉 레지스트리 index.json");
      return { index: this.bundledIndex };
    } catch (error) {
      return { error: messageOf(error) };
    }
  }

  private warnVersionMismatch(remoteVersion: string): void {
    const bundled = this.loadBundledIndex();
    // 동봉본이 없으면 비교할 대상이 없으니 알리지 않습니다(원격이 정상이므로 설치에는 영향이 없음)
    if ("index" in bundled && bundled.index.version !== remoteVersion) {
      this.notify(versionMismatchMessage(remoteVersion, bundled.index.version, this.bundledLabel));
    }
  }

  private async switchToBundled(reason: string, kind: FallbackKind = "access"): Promise<RegistryIndex> {
    const bundled = this.loadBundledIndex();
    if ("error" in bundled) {
      throw new RegistryError(
        "unavailable",
        `레지스트리를 읽지 못했습니다. 원격: ${reason} / 동봉본: ${bundled.error}`
      );
    }
    this.mode = "bundled";
    this.indexPromise = Promise.resolve(bundled.index);
    if (!this.fallbackAnnounced) {
      this.fallbackAnnounced = true;
      this.notify(bundledFallbackMessage(bundled.index.version, reason, kind, this.bundledLabel));
    }
    return bundled.index;
  }

  private readBundledItem(name: string): RegistryItem {
    const index = this.bundledIndex;
    const entry = index?.items.find((it) => it.name === name);
    if (!index || !entry || !this.bundledDir) {
      throw new RegistryError(
        "not-found",
        `'${name}' 항목이 ${this.bundledLabel}(version ${index?.version ?? "알 수 없음"})에 없습니다`
      );
    }
    try {
      // 동봉본은 공개 기본 base 로 빌드되므로 그 base 만 받습니다(D11)
      const item = validateRegistryItem(readBundledJson(this.bundledDir, `${name}.json`), name, `${name}.json`, DEFAULT_DEPENDENCY_BASES);
      checkItemSha256(item, entry);
      return item;
    } catch (error) {
      throw new RegistryError("unavailable", `${this.bundledLabel}의 '${name}' 항목을 읽지 못했습니다: ${messageOf(error)}`);
    }
  }
}

/** 클라이언트 생성 도우미 */
export function createRegistryClient(options: RegistryClientOptions): RegistryClient {
  return new RegistryClient(options);
}
