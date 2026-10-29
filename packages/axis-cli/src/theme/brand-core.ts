/**
 * 브랜드 공유 코어 (WI-0028 plan 4.1)
 *
 * 원본은 `packages/axis-cli/src/theme/brand-core.ts` 이고, `packages/axis-mcp/src/tools/brand-core.ts` 에
 * 바이트 단위로 같은 사본을 둡니다(U1). 사본 동일성은 MCP 테스트가 막습니다.
 * 두 패키지에서 똑같이 컴파일되도록 Node 내장 모듈과 공유 코어(@axis-ds/registry-core, 두 패키지가 번들)만 쓰고,
 * 출력 문자열은 만들지 않고 구조화된 값만 돌려줍니다. 전역 CSS 후보는 init 과 같이 쓰려고 공유 코어에 둡니다(WI-0065).
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { MessageChannel, Worker, receiveMessageOnPort } from "node:worker_threads";
import { GLOBAL_CSS_CANDIDATES, ROOT_LAYOUT_FILES, selectGlobalCss } from "@axis-ds/registry-core/project";
import { expandGlobalCss, packageVersionGate, type PackageVersionGate } from "@axis-ds/registry-core/tailwind-core";

/** 브랜드를 담는 패키지 이름 */
export const TOKENS_PACKAGE = "@axis-ds/tokens";

/** 브랜드 이름 규칙. `packages/axis-tokens/scripts/brands.mjs` 의 `BRAND_NAME_PATTERN` 과 같은 정규식입니다. */
export const BRAND_NAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** 브랜드 산출물(`./brands` exports)이 처음 들어간 `@axis-ds/tokens` 버전 */
export const MIN_BRAND_TOKENS_VERSION = "1.3.0";

/**
 * `axis theme add` 가 package.json 에 기록하고 설치 안내에 쓰는 `@axis-ds/tokens` 하한(WI-0065 D7, 종전 1.3.0).
 * linked 현행 버전이고, theme add 가 넣는 기본 토큰 CSS(Tailwind 4 진입점은 1.4.0 부터)와 agentic-ui 1.6.0 이 쓰는 변수
 * (이슈 #175 서술, 미측정)를 담습니다. 설치본 업그레이드 안내 기준은 `MIN_BRAND_TOKENS_VERSION` 그대로입니다.
 */
export const TOKENS_DEPENDENCY_MIN_VERSION = "1.6.0";

/** `axis theme info` · `axis.get_brand` 가 보여 주는 주요 토큰(U4, 라이트 · 다크 각각 브랜드 CSS 에 있는 것만) */
export const KEY_TOKENS = [
  "--primary",
  "--primary-foreground",
  "--background",
  "--foreground",
  "--ring",
  "--radius",
  "--axis-surface-default",
  "--axis-text-primary",
  "--axis-text-brand",
  "--axis-button-bg-default",
  "--axis-border-focus",
  "--axis-font-family-sans",
] as const;

/** 보정 내역의 근거 문서(U3 (A): 보정 전 · 후 값은 후속 WI, 이번에는 a11y 메타와 근거 문서 안내만) */
export const BRAND_ADJUSTMENT_REFERENCE = "WI-0025 PRD 부록 B (docs/workitems/WI-0025-brand-theme/prd.md)";

/**
 * 대상 프로젝트의 `@axis-ds/tokens` 상태
 * - `ok`: 브랜드 목록(`@axis-ds/tokens/brands`)을 읽을 수 있음
 * - `not-installed`: 패키지가 없음
 * - `unsupported`: 패키지는 있지만 `./brands` exports 가 없음(1.2.1 이하)
 * - `not-built`: exports 는 있지만 대상 파일이 없음(워크스페이스 링크 뒤 빌드 전 등)
 */
export type TokensStatus = "ok" | "not-installed" | "unsupported" | "not-built";

export interface TokensResolution {
  status: TokensStatus;
  /** 찾은 `@axis-ds/tokens/package.json` 의 version (`not-installed` 면 없음) */
  version?: string;
  /** 브랜드 목록 파일 절대 경로 (`ok` 일 때만) */
  indexPath?: string;
  /** 같은 프로세스에서 package.json 이 바뀌었는데 새 내용을 다시 읽지 못해 이전 판독 기준일 수 있음(WI-0089 Q83, 그럴 때만 있음) */
  stale?: true;
}

/** `dist/brands/index.json` 항목 (tokens 1.3.0 공개 API) */
export interface BrandIndexEntry {
  name: string;
  /** exports 하위 경로, 예 `./css/brands/<b>` */
  css: string;
  /** exports 하위 경로, 예 `./brands/<b>/brand.json` */
  meta: string;
}

export interface BrandA11y {
  status?: unknown;
  checkedAt?: unknown;
  gate?: unknown;
  [key: string]: unknown;
}

export interface BrandSummary {
  name: string;
  description: string;
  themes: string[];
  a11y: BrandA11y;
  /** CSS 에 넣을 import 경로, 예 `@axis-ds/tokens/css/brands/<b>` */
  importPath: string;
}

export interface BrandTokens {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export interface BrandAdjustments {
  a11y: BrandA11y;
  reference: string;
}

export interface BrandDetail extends BrandSummary {
  /** `KEY_TOKENS` 가운데 브랜드 CSS 에 있는 것만, `KEY_TOKENS` 순서 */
  tokens: BrandTokens;
  providerExample: string;
  adjustments: BrandAdjustments;
}

export interface BrandListResult {
  status: TokensStatus;
  version?: string;
  brands: BrandSummary[];
  /** `TokensResolution.stale` 와 같음(WI-0089 Q83, 그럴 때만 있음) */
  stale?: true;
}

export interface BrandGetResult {
  status: TokensStatus;
  version?: string;
  /** 브랜드를 찾지 못했거나 `status` 가 `ok` 가 아니면 `null` */
  brand: BrandDetail | null;
  /** 설치된 브랜드 이름(이름순) */
  available: string[];
  /** `TokensResolution.stale` 와 같음(WI-0089 Q83, 그럴 때만 있음) */
  stale?: true;
}

function readJsonFile(file: string): unknown {
  return JSON.parse(readFileSync(file, "utf8"));
}

function errorCode(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "code" in err
    ? String((err as { code: unknown }).code)
    : undefined;
}

/**
 * `<baseDir>` 에서 위로 올라가며 `node_modules/@axis-ds/tokens/package.json` 을 찾습니다(심볼릭 링크는 그대로 따라감).
 * 본 후보 경로들도 함께 돌려줍니다(WI-0089). 찾았으면 `candidates` 의 마지막이 `found` 이고, 그 앞의 후보는 모두 없는 경로입니다.
 * Node 의 패키지 탐색도 같은 순서로 이 경로들을 읽습니다.
 */
function tokensPackageJsonCandidates(baseDir: string): { found?: string; candidates: string[] } {
  const candidates: string[] = [];
  let dir = resolve(baseDir);
  for (;;) {
    const candidate = join(dir, "node_modules", TOKENS_PACKAGE, "package.json");
    candidates.push(candidate);
    if (existsSync(candidate)) return { found: candidate, candidates };
    const parent = dirname(dir);
    if (parent === dir) return { candidates };
    dir = parent;
  }
}

function projectRequire(baseDir: string): ReturnType<typeof createRequire> {
  return createRequire(join(resolve(baseDir), "package.json"));
}

/** `@axis-ds/tokens` 뒤에 붙는 exports 하위 경로(`./x/y`)를 패키지 지정자로 바꿉니다. */
function tokensSpecifier(subpath: string): string {
  return `${TOKENS_PACKAGE}/${subpath.replace(/^\.\//, "")}`;
}

/*
 * WI-0089: 같은 프로세스에서 tokens package.json 이 바뀐 뒤의 해석
 *
 * Node 는 `require.resolve` 가 처음 읽은 package.json(`exports` 등)을 프로세스가 끝날 때까지 기억하고, 지우는 공개 API 가 없습니다.
 * 그래서 오래 사는 MCP 서버에서 tokens 를 바꾸면(업그레이드 · 다운그레이드 · 브랜드 추가 · 중첩 설치본 제거) 첫 판독의 `exports` 로
 * 계속 판정했습니다. 후보 경로별로 「Node 해석이 그 경로를 처음 볼 때의 상태(내용 sha256 또는 없음)」를 기록해 두고(사용자 결정 Q81),
 * 이번 후보들의 상태가 기록과 하나라도 다르면 그 판정의 해석을 Worker 스레드에서 합니다(Q80 방식 B). Worker 는 자기 환경의 캐시를
 * 따로 가져 새 내용을 읽습니다.
 * - 처음 보는 경로 · 상태가 같은 경로는 종전 그대로 `createRequire().resolve` 입니다. CLI 는 명령마다 새 프로세스라 늘 이 갈래입니다
 * - 기록한 내용과 Node 가 실제로 읽은 내용이 다를 수 있는 경합(설치 도중의 호출)은 해석 직후 다시 읽어 가리고, 달라졌으면 그 경로를
 *   「알 수 없음」으로 표시해 격리 해석으로 다시 판정합니다
 * - 호출지가 동기 함수라(CLI `theme list` · `theme info` · `theme add`) Worker 응답을 `Atomics.wait` 로 기다립니다
 * - Worker 를 만들 수 없거나 응답이 없으면 종전 Node 해석으로 판정하고 결과에 `stale: true` 를 답니다(Q83). 그 뒤로 이 프로세스에서는
 *   Worker 를 다시 만들지 않습니다(호출마다 대기 한도만큼 멈추지 않게). MCP 는 재시작 안내를 붙입니다
 */

/** tokens package.json 후보 경로 → Node 해석이 그 경로를 처음 볼 때의 상태(내용 sha256 · `ABSENT` · `UNKNOWN`) */
const nodeSeenStates = new Map<string, string>();
/** 후보 경로에 파일이 없었음 */
const ABSENT = "absent";
/** 기록과 Node 판독이 어긋났을 수 있음(경합). 어떤 상태와도 같지 않습니다 */
const UNKNOWN = "unknown";

/** 격리 해석이 한 번 실패하면 이 프로세스에서는 다시 만들지 않습니다 */
let isolationDisabled = false;

/** 격리 해석 통계(테스트 · 측정용). `workers` 는 만든 Worker 수, `resolves` 는 Worker 로 해석한 지정자 수, `fallbacks` 는 Node 해석으로 돌아간 판정 수 */
const isolatedStats = { workers: 0, resolves: 0, fallbacks: 0 };

/** Worker 응답을 기다리는 한도(ms). 넘으면 Node 해석으로 돌아갑니다 */
const ISOLATED_RESOLVE_TIMEOUT_MS = 5_000;

/** 지정자 하나를 해석해 절대 경로를 돌려주거나, Node 와 같은 `code` 를 단 오류를 던지는 해석기 */
export interface IsolatedResolveSession {
  resolve(spec: string): string;
  close(): void;
}

/** 격리 해석 세션을 만드는 함수. `from` 은 `createRequire` 에 넘길 파일 경로입니다 */
export type IsolatedResolveFactory = (from: string) => IsolatedResolveSession;

const ISOLATED_RESOLVE_SOURCE = `
const { workerData } = require("node:worker_threads");
const { createRequire } = require("node:module");
const { port, signal, from } = workerData;
const req = createRequire(from);
port.on("message", (spec) => {
  let reply;
  try {
    reply = { path: req.resolve(spec) };
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? String(err.code) : undefined;
    reply = { code, message: err && err.message ? String(err.message) : String(err) };
  }
  port.postMessage(reply);
  Atomics.store(signal, 0, 1);
  Atomics.notify(signal, 0);
});
`;

/** 격리 해석이 응답하지 못함(해석 결과가 아니라 Worker 자체의 실패) */
export class IsolationFailure extends Error {}

function createWorkerResolveSession(from: string, source: string, timeoutMs: number): IsolatedResolveSession {
  const { port1, port2 } = new MessageChannel();
  const signal = new Int32Array(new SharedArrayBuffer(4));
  const worker = new Worker(source, {
    eval: true,
    workerData: { port: port2, signal, from },
    transferList: [port2],
  });
  // Worker 의 비동기 오류(시작 실패 · 메모리 부족 등)가 처리되지 않은 'error' 로 올라가 프로세스를 끝내지 않게 합니다.
  // 실패는 신호 대기의 시간 초과로 압니다
  worker.on("error", () => {});
  worker.unref();
  return {
    resolve(spec) {
      Atomics.store(signal, 0, 0);
      port1.postMessage(spec);
      const waited = Atomics.wait(signal, 0, 0, timeoutMs);
      const received = receiveMessageOnPort(port1);
      if (waited === "timed-out" || !received) throw new IsolationFailure("격리 해석이 응답하지 않았습니다");
      const reply = received.message as { path?: string; code?: string; message?: string };
      if (typeof reply.path === "string") return reply.path;
      throw Object.assign(new Error(reply.message ?? spec), reply.code === undefined ? {} : { code: reply.code });
    },
    close() {
      port1.close();
      void worker.terminate();
    },
  };
}

function workerResolveSession(from: string): IsolatedResolveSession {
  return createWorkerResolveSession(from, ISOLATED_RESOLVE_SOURCE, ISOLATED_RESOLVE_TIMEOUT_MS);
}

/** 테스트 전용: Worker 소스 · 대기 한도를 바꾼 세션(비동기 실패 · 시간 초과 주입) */
export function workerResolveSessionForTest(from: string, source: string, timeoutMs: number): IsolatedResolveSession {
  return createWorkerResolveSession(from, source, timeoutMs);
}

let isolatedFactory: IsolatedResolveFactory = workerResolveSession;

/**
 * 테스트 전용: 격리 해석 세션 생성기를 바꿉니다(`null` 이면 기본 Worker). 실패 주입(Q83 폴백)에 씁니다.
 * 부를 때마다 「격리 해석 끔」 래치도 풉니다
 */
export function setIsolatedResolveFactoryForTest(factory: IsolatedResolveFactory | null): void {
  isolatedFactory = factory ?? workerResolveSession;
  isolationDisabled = false;
}

/** 격리 해석 통계의 사본(테스트 · 측정용) */
export function isolatedResolveStats(): { workers: number; resolves: number; fallbacks: number } {
  return { ...isolatedStats };
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** 한 번의 판정(목록 · 상세) 동안 tokens 지정자를 해석하는 해석기. 끝나면 `close` 합니다 */
interface TokensResolver {
  resolve(spec: string): string;
  /** 바뀐 내용을 격리 해석하지 못해 종전 Node 해석으로 판정했는지(Q83) */
  readonly stale: boolean;
  /** Node 해석 직후 package.json 이 기록과 달라 격리 해석으로 다시 판정했는지(경합). 쓴 쪽은 version 을 다시 읽습니다 */
  readonly raced: boolean;
  close(): void;
}

function openTokensResolver(baseDir: string, candidates: string[], pkgJson: string, pkgText: string): TokensResolver {
  const nodeRequire = projectRequire(baseDir);
  const key = sha256(pkgText);
  const current = candidates.map((c) => (c === pkgJson ? key : ABSENT));
  const changed = candidates.some((c, i) => {
    const seen = nodeSeenStates.get(c);
    return seen !== undefined && seen !== current[i];
  });

  let mode: "node" | "isolated" = changed ? "isolated" : "node";
  if (mode === "node") {
    candidates.forEach((c, i) => {
      if (!nodeSeenStates.has(c)) nodeSeenStates.set(c, current[i]);
    });
  }

  let session: IsolatedResolveSession | null = null;
  let stale = false;
  let raced = false;
  let postChecked = false;
  const markStale = () => {
    if (!stale) isolatedStats.fallbacks += 1;
    stale = true;
  };
  const fallBack = () => {
    markStale();
    isolationDisabled = true;
    session?.close();
    session = null;
  };
  const startIsolation = () => {
    if (isolationDisabled) {
      markStale();
      return;
    }
    try {
      session = isolatedFactory(join(resolve(baseDir), "package.json"));
      isolatedStats.workers += 1;
    } catch {
      fallBack();
    }
  };
  if (mode === "isolated") startIsolation();

  const isolatedResolve = (spec: string): string => {
    if (session) {
      try {
        const resolved = session.resolve(spec);
        isolatedStats.resolves += 1;
        return resolved;
      } catch (err) {
        if (!(err instanceof IsolationFailure)) {
          isolatedStats.resolves += 1;
          throw err;
        }
        fallBack();
      }
    }
    return nodeRequire.resolve(spec);
  };

  return {
    resolve(spec) {
      if (mode === "isolated") return isolatedResolve(spec);
      let resolved: string | undefined;
      let failure: unknown;
      let failed = false;
      try {
        resolved = nodeRequire.resolve(spec);
      } catch (err) {
        failed = true;
        failure = err;
      }
      if (!postChecked) {
        postChecked = true;
        let after: string;
        try {
          after = sha256(readFileSync(pkgJson, "utf8"));
        } catch {
          after = UNKNOWN;
        }
        if (after !== key) {
          // 기록한 뒤 Node 가 읽기 전에 바뀌었을 수 있습니다. Node 가 무엇을 기억했는지 모르므로 이 경로는 늘 격리 해석합니다
          nodeSeenStates.set(pkgJson, UNKNOWN);
          raced = true;
          mode = "isolated";
          startIsolation();
          return isolatedResolve(spec);
        }
      }
      if (failed) throw failure;
      return resolved as string;
    },
    get stale() {
      return stale;
    },
    get raced() {
      return raced;
    },
    close() {
      session?.close();
      session = null;
    },
  };
}

interface OpenedTokens {
  resolution: TokensResolution;
  /** package.json 을 찾았을 때만 있습니다. 쓴 쪽이 `close` 합니다 */
  resolver?: TokensResolver;
}

function readVersion(pkgText: string): string | undefined {
  const pkg = JSON.parse(pkgText) as { version?: unknown };
  return typeof pkg.version === "string" ? pkg.version : undefined;
}

function openTokens(baseDir: string): OpenedTokens {
  const { found: pkgJson, candidates } = tokensPackageJsonCandidates(baseDir);
  if (!pkgJson) return { resolution: { status: "not-installed" } };

  const pkgText = readFileSync(pkgJson, "utf8");
  let version = readVersion(pkgText);

  const resolver = openTokensResolver(baseDir, candidates, pkgJson, pkgText);
  const finish = (status: TokensStatus, indexPath?: string): OpenedTokens => {
    if (resolver.raced) {
      try {
        version = readVersion(readFileSync(pkgJson, "utf8"));
      } catch {
        // 다시 읽을 수 없으면 처음 읽은 값을 둡니다
      }
    }
    const resolution: TokensResolution = indexPath === undefined ? { status, version } : { status, version, indexPath };
    return { resolution: resolver.stale ? { ...resolution, stale: true } : resolution, resolver };
  };
  try {
    const indexPath = resolver.resolve(tokensSpecifier("./brands"));
    return finish("ok", indexPath);
  } catch (err) {
    const code = errorCode(err);
    if (code === "ERR_PACKAGE_PATH_NOT_EXPORTED") return finish("unsupported");
    if (code === "MODULE_NOT_FOUND") return finish("not-built");
    resolver.close();
    throw err;
  }
}

/**
 * 대상 프로젝트의 `@axis-ds/tokens` 상태를 판정합니다(plan 3장 5).
 * 설치 여부는 파일을 직접 찾아 보고, exports 해석은 찾았을 때만 합니다.
 * `MODULE_NOT_FOUND` 하나로 「미설치」를 판정하지 않습니다(빌드 전 링크도 같은 코드를 냄).
 * 같은 프로세스에서 package.json 이 바뀌었으면 격리 해석으로 새 내용을 봅니다(WI-0089, 위 주석).
 */
export function resolveTokens(baseDir: string): TokensResolution {
  const { resolution, resolver } = openTokens(baseDir);
  resolver?.close();
  return resolution;
}

/** index 항목에서 CSS import 경로를 만듭니다. FR-2 · FR-4 · FR-5 가 같은 함수를 씁니다. */
export function brandImportPath(entry: Pick<BrandIndexEntry, "css">): string {
  return tokensSpecifier(entry.css);
}

/** `axis.config.json` 가운데 브랜드 기능이 읽는 키(MCP 는 config 를 읽기만 하므로 최소 타입만 둡니다) */
export interface BrandConfigLike {
  globalCss?: unknown;
  brand?: unknown;
}

export interface GlobalCssLocation {
  /** 고른 CSS 파일의 절대 경로. 후보가 모두 없으면 없음 */
  path?: string;
  /** `globalCss` 키가 가리키는데 파일이 없을 때 그 값(설정에 적힌 그대로) */
  configuredMissing?: string;
}

/**
 * `globalCss` 다음으로 보는 후보(PRD FR-2 순서). 원본은 공유 코어(`@axis-ds/registry-core/project`)이고 init 의 탐색과 같은
 * 목록입니다(WI-0065, `styles/globals.css` · `src/styles/globals.css` 추가).
 */
export { GLOBAL_CSS_CANDIDATES };

function isFile(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

/**
 * 브랜드 import 를 넣을 CSS 파일을 찾습니다(PRD FR-2 · A1, plan 4.1 U14 (A)). `axis theme add` 가 씁니다.
 * 공유 코어 `selectGlobalCss`(WI-0100a) 위의 얇은 래퍼이고 규칙은 종전 그대로입니다.
 * 후보는 `config.globalCss` → `GLOBAL_CSS_CANDIDATES`(`app/globals.css` → `src/app/globals.css` → `styles/globals.css` →
 * `src/styles/globals.css` → 루트 `globals.css`) 순이고,
 * `globalCss` 는 키가 없을 때와 키가 가리키는 파일이 없을 때 모두 다음 후보로 넘어갑니다.
 * 파일이 없을 때는 `configuredMissing` 에 그 값을 담아 호출한 쪽이 경고하게 합니다.
 * `.css` 가 아닌 파일 · 프로젝트 밖 파일도 그대로 돌려주고, theme add 가 쓰기 직전에 거절합니다(`css-not-stylesheet` ·
 * `css-outside-project`). check 의 brand 항목은 이 함수가 아니라 `selectGlobalCss` 를 `.css` 확인을 켜고 부릅니다(`inspectBrandImport`).
 */
export function findGlobalCss(baseDir: string, config: BrandConfigLike | null | undefined): GlobalCssLocation {
  const selection = selectGlobalCss(resolve(baseDir), config?.globalCss, GLOBAL_CSS_CANDIDATES);
  const result: GlobalCssLocation = {};
  if (selection.configuredMissing !== undefined) result.configuredMissing = selection.configuredMissing;
  if (selection.path !== undefined) result.path = selection.path;
  return result;
}

/**
 * CSS 안의 브랜드 import 이름 목록(나온 순서, 중복 포함). 주석 안의 import 는 세지 않습니다.
 * `@import "..."` · `@import '...'` · `@import url(...)` 세 형태를 읽습니다.
 */
export function findBrandImports(css: string): string[] {
  const names: string[] = [];
  const pattern =
    /@import\s+(?:url\(\s*)?["']?@axis-ds\/tokens\/css\/brands\/([a-z][a-z0-9-]*)(?:\.css)?["']?\s*\)?\s*(?=[;\s]|$)/g;
  for (const m of stripComments(css).matchAll(pattern)) {
    names.push(m[1]);
  }
  return names;
}

/** 설정 파일 이름 */
export const AXIS_CONFIG_FILE_NAME = "axis.config.json";

/**
 * `<baseDir>/axis.config.json` 을 읽습니다(FR-5 검사용).
 * 파일이 없거나, JSON 이 깨졌거나, 최상위가 객체가 아니면 `null` 입니다. 검사기는 이때 brand 항목을 더하지 않습니다.
 */
export function readBrandConfig(baseDir: string): BrandConfigLike | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(join(resolve(baseDir), AXIS_CONFIG_FILE_NAME), "utf8"));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  return parsed as BrandConfigLike;
}

/**
 * `axis check` · `axis.check_project` 의 brand 검사 결과(FR-5, plan 4.5)
 * - `match`: CSS 에 `brand` import 가 있음
 * - `css-missing`: CSS 후보를 하나도 찾지 못함
 * - `import-missing`: CSS 에 브랜드 import 가 하나도 없음
 * - `other-brand`: 다른 브랜드 import 만 있음
 */
export type BrandImportState = "match" | "css-missing" | "import-missing" | "other-brand";

export interface BrandImportCheck {
  brand: string;
  state: BrandImportState;
  /** 검사한 CSS 파일(`baseDir` 기준 상대 경로, `/` 구분). `css-missing` 이면 없음 */
  cssFile?: string;
  /** `globalCss` 가 가리키는 파일이 없을 때(디렉터리 포함) 그 값(설정에 적힌 그대로) */
  configuredMissing?: string;
  /** `globalCss` 가 `.css` 가 아닌 일반 파일을 가리켜 버리고 후보로 넘어갔을 때 그 값(설정에 적힌 그대로, WI-0100 D10) */
  configuredRejected?: string;
  /** CSS 안의 브랜드 import 이름(나온 순서, 중복 제거). 상대 `@import` 로 들여온 프로젝트 안 하위 파일까지 봅니다(WI-0100b) */
  imports: string[];
  /**
   * 판정에 쓴 브랜드 import 가 진입 파일이 아니라 하위 파일에 있을 때 그 파일들(앱 기준 상대 경로, 나온 순서, WI-0100b D6 접미사용).
   * `match` 는 `brand` import 가 처음 나온 하위 파일, `other-brand` 는 브랜드 import 가 있는 하위 파일이에요. 진입 파일에 있으면 없음
   */
  importVia?: string[];
}

/**
 * `axis.config.json` 의 `brand` 와 CSS 의 브랜드 import 를 대조합니다(FR-5).
 * config 가 없거나 읽을 수 없거나 `brand` 가 비어 있으면 `null` 이고, 검사기는 결과를 추가하지 않습니다(기존 출력 불변).
 * CSS 파일은 공유 코어 `selectGlobalCss`(`globalCss` → `GLOBAL_CSS_CANDIDATES`, theme add 와 같은 순서)로 고르되, check 경로라
 * `globalCss` 가 `.css` 가 아닌 일반 파일이면 버리고 후보로 넘어가 `configuredRejected` 를 담습니다(WI-0100 D10). theme add 는 그때
 * 후보로 넘어가지 않고 오류로 멈추며(`css-not-stylesheet`, 아무것도 쓰지 않음), check 는 후보 파일을 판정하고 버린 사유를 표기합니다.
 * 프로젝트 밖 `globalCss` 는 읽기만 합니다. 브랜드 import 는 고른 파일이 상대 `@import` 로 들여온 프로젝트 안 하위 파일에서도 찾습니다
 * (WI-0100b `expandGlobalCss`, D5, 상대 `@import` 가 순환하면 진입 파일만 봄, 사용자 결정 Q52). 브랜드 import 는 WI-0097 해석 게이트 대상이
 * 아니라 위치만 봅니다(D8 ②).
 */
export function inspectBrandImport(baseDir: string): BrandImportCheck | null {
  const config = readBrandConfig(baseDir);
  const brand = config?.brand;
  if (typeof brand !== "string" || brand.trim() === "") return null;

  const root = resolve(baseDir);
  const location = selectGlobalCss(root, config?.globalCss, GLOBAL_CSS_CANDIDATES, { requireStylesheet: true });
  const base: Pick<BrandImportCheck, "brand" | "configuredMissing" | "configuredRejected"> = { brand };
  if (location.configuredMissing !== undefined) base.configuredMissing = location.configuredMissing;
  if (location.configuredRejected !== undefined) base.configuredRejected = location.configuredRejected;
  if (!location.path) {
    return { ...base, state: "css-missing", imports: [] };
  }

  const cssFile = relative(root, location.path).split(sep).join("/");
  // WI-0100b(D5 · D8 ②): 상대 @import 를 펼친 근거에서 찾아요. 브랜드 import 는 WI-0097 해석 게이트 대상이 아니라 위치만 펼친 근거에서 봐요
  const expanded = expandGlobalCss(root, location.path, cssFile);
  const imports = [...new Set(findBrandImports(expanded.evidence))];
  let state: BrandImportState;
  if (imports.includes(brand)) state = "match";
  else if (imports.length === 0) state = "import-missing";
  else state = "other-brand";
  const sub = expanded.files.filter((f) => f.depth > 0);
  const via =
    state === "match"
      ? sub.filter((f) => findBrandImports(f.css).includes(brand)).slice(0, 1)
      : state === "other-brand"
        ? sub.filter((f) => findBrandImports(f.css).length > 0)
        : [];
  const entryHas = state === "match" && findBrandImports(expanded.files[0].css).includes(brand);
  if (via.length > 0 && !entryHas) return { ...base, state, cssFile, imports, importVia: via.map((f) => f.rel) };
  return { ...base, state, cssFile, imports };
}

/**
 * index 항목이 가리키는 파일(brand.json · CSS)이 없을 때 나는 오류인지 봅니다.
 * index.json 은 있는데 항목 파일이 없는 부분 빌드 상태를 `not-built` 로 돌려주는 데 씁니다(plan 3장 5).
 */
function isMissingBuildFile(err: unknown): boolean {
  const code = errorCode(err);
  return code === "MODULE_NOT_FOUND" || code === "ENOENT";
}

function readBrandIndex(indexPath: string): BrandIndexEntry[] {
  const data = readJsonFile(indexPath) as { brands?: unknown };
  if (!Array.isArray(data.brands)) {
    throw new Error(`${indexPath}: "brands" 배열이 없습니다`);
  }
  return data.brands as BrandIndexEntry[];
}

function readSummary(resolver: TokensResolver, entry: BrandIndexEntry): BrandSummary {
  const metaPath = resolver.resolve(tokensSpecifier(entry.meta));
  const meta = readJsonFile(metaPath) as {
    description?: unknown;
    themes?: unknown;
    a11y?: unknown;
  };
  return {
    name: entry.name,
    description: typeof meta.description === "string" ? meta.description : "",
    themes: Array.isArray(meta.themes) ? meta.themes.map(String) : [],
    a11y:
      typeof meta.a11y === "object" && meta.a11y !== null ? (meta.a11y as BrandA11y) : {},
    importPath: brandImportPath(entry),
  };
}

/**
 * 설치된 브랜드 목록(FR-1). `index.json` 을 읽고 각 항목의 `meta` 로 `brand.json` 을 읽습니다.
 * 순서는 index 순서(이름순)를 그대로 따릅니다. `status` 가 `ok` 가 아니면 빈 목록이 아니라 「측정 못 함」입니다.
 */
export function listBrands(baseDir: string): BrandListResult {
  const { resolution: tokens, resolver } = openTokens(baseDir);
  try {
    return withStaleOf(resolver, listBrandsWith(tokens, resolver));
  } finally {
    resolver?.close();
  }
}

function listBrandsWith(tokens: TokensResolution, resolver: TokensResolver | undefined): BrandListResult {
  if (tokens.status !== "ok" || !tokens.indexPath || !resolver) {
    return { status: tokens.status, version: tokens.version, brands: [] };
  }
  const entries = readBrandIndex(tokens.indexPath);
  const brands: BrandSummary[] = [];
  for (const entry of entries) {
    try {
      brands.push(readSummary(resolver, entry));
    } catch (err) {
      if (isMissingBuildFile(err)) return { status: "not-built", version: tokens.version, brands: [] };
      // WI-0089 Q83: 종전 Node 해석(낡은 exports)으로 판정하는 중이면 새로 생긴 브랜드는 exports 에 없다고 나옵니다.
      // 도구 오류로 끝내지 않고 그 항목만 빼며, 결과의 stale 표시가 재시작을 안내합니다
      if (resolver.stale && errorCode(err) === "ERR_PACKAGE_PATH_NOT_EXPORTED") continue;
      throw err;
    }
  }
  return { status: "ok", version: tokens.version, brands };
}

/** 판정 중 한 번이라도 종전 Node 해석으로 돌아갔으면 결과에 `stale: true` 를 답니다(WI-0089 Q83). 아니면 결과를 그대로 돌려줍니다 */
function withStaleOf<T extends object>(resolver: TokensResolver | undefined, result: T): T {
  return resolver?.stale ? { ...result, stale: true } : result;
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseDeclarations(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;]+);/g)) {
    out[m[1]] = m[2].trim();
  }
  return out;
}

function isDarkSelector(selector: string): boolean {
  return /\.dark\b/.test(selector) || /\[data-theme=["']?dark["']?\]/.test(selector);
}

/**
 * 브랜드 CSS 에서 라이트 · 다크 첫 블록의 사용자 정의 속성을 뽑습니다(FR-3).
 * 선택자 목록에 `.dark` 나 `[data-theme="dark"]` 가 있으면 다크, 그 밖에 `[data-brand="<name>"]` 가 있으면 라이트입니다.
 * 라이트 선택자 형태(`[data-brand]` · 명시도를 올린 `[data-brand][data-brand]`)에 기대지 않습니다.
 */
export function parseBrandCss(css: string, name: string): BrandTokens {
  const result: BrandTokens = { light: {}, dark: {} };
  let lightFound = false;
  let darkFound = false;
  const brandAttr = new RegExp(`\\[data-brand=["']?${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?\\]`);
  for (const m of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map((s) => s.trim());
    if (!selectors.some((s) => brandAttr.test(s))) continue;
    if (selectors.some(isDarkSelector)) {
      if (!darkFound) {
        result.dark = parseDeclarations(m[2]);
        darkFound = true;
      }
    } else if (!lightFound) {
      result.light = parseDeclarations(m[2]);
      lightFound = true;
    }
  }
  return result;
}

function pickKeyTokens(decls: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of KEY_TOKENS) {
    if (Object.prototype.hasOwnProperty.call(decls, key)) out[key] = decls[key];
  }
  return out;
}

/**
 * ThemeProvider 가 서버 마크업 `<html data-brand>` 를 초기값으로 읽고, `setBrand(undefined)` 로 끈 상태를 새로고침 뒤에도
 * 유지하는 첫 `@axis-ds/theme` 버전(WI-0068). 1.6.2 이하는 브랜드 상태가 비면 마운트 때 마크업 속성을 지웠습니다.
 * 근거는 bump 종류입니다: theme changeset 이 minor 라 linked 4패키지가 1.6.x 에서 1.7.0 으로 오릅니다.
 */
export const THEME_MARKUP_BRAND_MIN_VERSION = "1.7.0";

/**
 * 브랜드를 켜는 예시(FR-3 · FR-4, WI-0065 D7 · WI-0068). 버전과 상관없이 같은 문구이고, 버전 조건을 문구 안에 적습니다.
 * 1. 서버 마크업: 루트 레이아웃의 `<html>` 에 `data-brand` 를 붙입니다(첫 화면부터 적용). ThemeProvider 를 함께 쓰면
 *    `@axis-ds/theme` 1.7.0 이상이어야 마운트 때 지워지지 않습니다(1.6.2 이하는 지움).
 * 2. 사용자가 고르게 하려면 `useTheme().setBrand` 로 켜고 끕니다(저장값으로 유지). 끈 상태가 새로고침 뒤에도 유지되는 것은 1.7.0 부터입니다.
 */
export function providerExample(name: string): string {
  return [
    "// 1) 루트 레이아웃(app/layout.tsx)의 <html> 에 붙입니다(첫 화면부터 적용)",
    `//    ThemeProvider 를 함께 쓰면 @axis-ds/theme ${THEME_MARKUP_BRAND_MIN_VERSION} 이상이 필요합니다(그 아래는 마운트 때 속성을 지움)`,
    `<html lang="ko" data-brand="${name}">`,
    "",
    `// 2) 사용자가 고르게 하려면 setBrand 로 켜고 끕니다(저장돼 유지, setBrand(undefined) 로 끈 상태 유지는 ${THEME_MARKUP_BRAND_MIN_VERSION} 이상)`,
    'import { useTheme } from "@axis-ds/theme";',
    "const { setBrand } = useTheme();",
    `setBrand("${name}");`,
  ].join("\n");
}

/**
 * 브랜드를 켜는 코드(`data-brand` · `setBrand` · `defaultBrand`)를 찾는 파일(앞에서부터, WI-0065 D8).
 * 목록은 globals.css 항목과 같이 쓰려고 공유 코어(`ROOT_LAYOUT_FILES`)로 옮겼습니다(WI-0070).
 */
export const BRAND_ACTIVATION_FILES = ROOT_LAYOUT_FILES;

/** 브랜드를 켜는 코드를 찾은 결과(WI-0065 D8) */
export interface BrandActivationLocation {
  /** `data-brand` · `setBrand(` · `defaultBrand=` 가 있는 첫 파일(`baseDir` 기준 상대 경로, `/` 구분) */
  found?: string;
  /** 읽은 루트 레이아웃 후보. 비어 있으면 레이아웃을 찾지 못한 것입니다 */
  layoutFiles: string[];
  /**
   * 켜는 코드가 마크업 `data-brand` 뿐이고(`setBrand(` · `defaultBrand=` 없음) 같은 레이아웃 · providers 파일에 `ThemeProvider` 가
   * 있는지(WI-0068). 이 구성은 `@axis-ds/theme` 1.6.2 이하에서 마운트 때 브랜드가 지워집니다.
   */
  markupWithProvider?: boolean;
}

export interface BrandActivationCheck extends BrandActivationLocation {
  brand: string;
  /** `markupWithProvider` 일 때만: 설치본(없으면 선언) `@axis-ds/theme` 가 1.7.0 이상인지(WI-0068) */
  theme?: PackageVersionGate;
}

/**
 * 브랜드를 실제로 켜는 코드만 셉니다. `ThemeProvider` 단독은 넣지 않습니다: 브랜드 상태가 비어 있으면 마운트 때
 * `data-brand` 를 지우므로, Provider 만 있는 레이아웃은 브랜드가 꺼진 상태입니다(2026-10-25 WI-0064 검토 실측).
 */
const BRAND_ACTIVATION_PATTERN = /data-brand|setBrand\s*\(|defaultBrand\s*=/;

/** Provider 쪽에서 켜는 코드(`setBrand(` · `defaultBrand=`). 마크업만 있는 구성과 가르려고 따로 봅니다(WI-0068) */
const PROVIDER_ACTIVATION_PATTERN = /setBrand\s*\(|defaultBrand\s*=/;

/** `<ThemeProvider` JSX 사용 */
const THEME_PROVIDER_PATTERN = /<ThemeProvider\b/;

/** JS · TS 의 블록 주석과 줄 주석을 지웁니다(`https://` 같은 문자열 안의 `//` 는 앞 글자로 구분해 남김). */
function stripJsLikeComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
}

/**
 * 루트 레이아웃 후보(`BRAND_ACTIVATION_FILES`)에서 브랜드를 켜는 코드를 찾습니다(WI-0065 D7 · D8, 휴리스틱).
 * Provider 를 다른 파일에서 감싸는 구성(예: `app/providers.tsx`)도 있어, 레이아웃이 import 하는 같은 디렉터리의
 * `./providers` · `./provider` 파일을 한 단계만 더 봅니다. 그보다 깊으면 못 찾을 수 있으므로 검사기는 WARN 만 냅니다.
 */
export function findBrandActivation(baseDir: string): BrandActivationLocation {
  const root = resolve(baseDir);
  const layoutFiles: string[] = [];
  for (const candidate of BRAND_ACTIVATION_FILES) {
    const file = join(root, candidate);
    if (!isFile(file)) continue;
    layoutFiles.push(candidate);
    const text = stripJsLikeComments(readFileSync(file, "utf8"));
    // 레이아웃이 import 하는 같은 디렉터리의 ./providers · ./provider 파일(한 단계)
    const providerTexts: Array<{ rel: string; text: string }> = [];
    for (const m of text.matchAll(/from\s+["']\.\/(providers?)["']/g)) {
      for (const ext of [".tsx", ".jsx", ".ts", ".js"]) {
        const rel = `${dirname(candidate)}/${m[1]}${ext}`;
        const p = join(root, rel);
        if (isFile(p)) providerTexts.push({ rel, text: stripJsLikeComments(readFileSync(p, "utf8")) });
      }
    }
    const all = [text, ...providerTexts.map((x) => x.text)];
    // WI-0068: 마크업 data-brand 만 있고 Provider 쪽 켜는 코드가 없으며 ThemeProvider 를 쓰는 구성인지
    const markupWithProvider =
      !all.some((t) => PROVIDER_ACTIVATION_PATTERN.test(t)) && all.some((t) => THEME_PROVIDER_PATTERN.test(t));
    if (BRAND_ACTIVATION_PATTERN.test(text)) {
      return markupWithProvider ? { found: candidate, layoutFiles, markupWithProvider } : { found: candidate, layoutFiles };
    }
    for (const x of providerTexts) {
      if (BRAND_ACTIVATION_PATTERN.test(x.text)) {
        return markupWithProvider ? { found: x.rel, layoutFiles, markupWithProvider } : { found: x.rel, layoutFiles };
      }
    }
  }
  return { layoutFiles };
}

/** `brand` 가 설정된 프로젝트의 활성화 검사(WI-0065 D8). config 가 없거나 `brand` 가 비어 있으면 `null` 입니다 */
export function inspectBrandActivation(baseDir: string): BrandActivationCheck | null {
  const config = readBrandConfig(baseDir);
  const brand = config?.brand;
  if (typeof brand !== "string" || brand.trim() === "") return null;
  const location = findBrandActivation(baseDir);
  if (!location.markupWithProvider) return { brand, ...location };
  // WI-0068: 마크업 + ThemeProvider 구성은 설치본(없으면 선언) theme 버전으로 가릅니다
  // WI-0091: check 경로라 Plug'n'Play 면 루트에만 선언한 theme 를 「앱에서 해석되지 않음」(unresolved)으로 가립니다
  return {
    brand,
    ...location,
    theme: packageVersionGate(baseDir, readProjectPackageJson(baseDir), THEME_PACKAGE, THEME_MARKUP_BRAND_MIN_VERSION, { appOnlyInPnp: true }),
  };
}

/** ThemeProvider 를 담는 패키지 */
export const THEME_PACKAGE = "@axis-ds/theme";

/** 프로젝트 package.json(읽지 못하면 `undefined`) */
function readProjectPackageJson(baseDir: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(resolve(baseDir), "package.json"), "utf8"));
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 브랜드 하나의 상세(FR-3 · FR-4). 없는 이름이면 `brand: null` 과 설치된 이름 목록을 돌려줍니다.
 */
export function getBrand(baseDir: string, name: string): BrandGetResult {
  const { resolution: tokens, resolver } = openTokens(baseDir);
  try {
    return withStaleOf(resolver, getBrandWith(tokens, resolver, name));
  } finally {
    resolver?.close();
  }
}

function getBrandWith(tokens: TokensResolution, resolver: TokensResolver | undefined, name: string): BrandGetResult {
  if (tokens.status !== "ok" || !tokens.indexPath || !resolver) {
    return { status: tokens.status, version: tokens.version, brand: null, available: [] };
  }
  const entries = readBrandIndex(tokens.indexPath);
  const available = entries.map((e) => e.name);
  const entry = entries.find((e) => e.name === name);
  if (!entry) {
    return { status: "ok", version: tokens.version, brand: null, available };
  }

  let summary: BrandSummary;
  let parsed: BrandTokens;
  try {
    summary = readSummary(resolver, entry);
    const cssPath = resolver.resolve(summary.importPath);
    parsed = parseBrandCss(readFileSync(cssPath, "utf8"), name);
  } catch (err) {
    if (isMissingBuildFile(err)) return { status: "not-built", version: tokens.version, brand: null, available: [] };
    // WI-0089 Q83: 낡은 exports 로 판정하는 중이면 새 브랜드를 읽을 수 없습니다. 도구 오류 대신 「없는 이름」과 stale 표시로 돌려줍니다
    if (resolver.stale && errorCode(err) === "ERR_PACKAGE_PATH_NOT_EXPORTED") {
      return { status: "ok", version: tokens.version, brand: null, available: available.filter((n) => n !== name) };
    }
    throw err;
  }

  return {
    status: "ok",
    version: tokens.version,
    available,
    brand: {
      ...summary,
      tokens: { light: pickKeyTokens(parsed.light), dark: pickKeyTokens(parsed.dark) },
      providerExample: providerExample(name),
      adjustments: { a11y: summary.a11y, reference: BRAND_ADJUSTMENT_REFERENCE },
    },
  };
}
