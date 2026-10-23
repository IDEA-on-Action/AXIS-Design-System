/**
 * AXIS Design System MCP - 레지스트리 출처 (WI-0055 D2 · D8)
 *
 * list · search · get · install 이 모두 cli 와 같은 레지스트리(공유 코어 @axis-ds/registry-core)를 읽습니다.
 * - 주소: AXIS_REGISTRY_URL → 기준 디렉터리의 axis.config.json registry → 기본값(pages.dev). 원격이 실패하면
 *   MCP 에 포함된 레지스트리(dist/registry, 빌드 때 apps/web/public/r 복사)로 폴백합니다.
 * - 기준 디렉터리: install 은 targetDir(프로젝트 루트), list · search · get 은 서버의 현재 디렉터리입니다.
 * - 캐시 없음: 호출마다 클라이언트를 새로 만듭니다(장수 서버가 낡은 목록을 주지 않게, D8).
 * - stdout 금지: stdio MCP 는 stdout 이 JSON-RPC 통로라, 안내는 notify 로 모아 도구 결과에 싣습니다.
 */

import { createClientFor, itemKind } from "@axis-ds/registry-core/add";
import type { RegistryClient, RegistryIndex, RegistryIndexEntry } from "@axis-ds/registry-core/registry";
import { getComponentMeta } from "../registry/loader.js";
import type { ComponentCategory, PackageName } from "../types.js";

/** 안내 · 오류 문구에서 동봉본을 부르는 이름 */
export const MCP_BUNDLED_LABEL = "MCP 에 포함된 레지스트리";

/** 레지스트리 클라이언트를 만드는 함수(테스트에서 동봉본 디렉터리 · 원격 없음을 주입) */
export type CreateClient = (baseDir: string, notify: (message: string) => void) => Promise<RegistryClient>;

/** 도구 핸들러가 받는 선택 의존(테스트 전용) */
export interface RegistryDeps {
  createClient?: CreateClient;
  /** list · search · get 의 기준 디렉터리. 기본은 process.cwd() */
  cwd?: string;
}

export const defaultCreateClient: CreateClient = (baseDir, notify) =>
  createClientFor(baseDir, notify, process.env, { bundledLabel: MCP_BUNDLED_LABEL });

/** 클라이언트와 그 클라이언트가 낸 안내(폴백 · version 차이 등) */
export interface Source {
  client: RegistryClient;
  notices: string[];
}

export async function openSource(baseDir: string, deps: RegistryDeps = {}): Promise<Source> {
  const notices: string[] = [];
  const client = await (deps.createClient ?? defaultCreateClient)(baseDir, (m) => notices.push(m));
  return { client, notices };
}

/** 출처 표시. index 를 읽은 뒤에만 의미가 있습니다 */
export function describeOrigin(client: RegistryClient, version: string): string {
  const where = client.origin === "bundled" ? MCP_BUNDLED_LABEL : "원격 레지스트리";
  return `${where} (version ${version})`;
}

/** list · search 에 쓰는 컴포넌트 요약. 이름은 레지스트리 이름(agentic 은 agentic- 접두 전체 이름)입니다 */
export interface RegistryComponent {
  name: string;
  title: string;
  description: string;
  kind: "ui" | "agentic";
  category: ComponentCategory;
  package: PackageName;
}

/** list · search 의 category 필터. 종전 enum(core · agentic · form · layout)에 ui 를 더했습니다(D6) */
export type ComponentFilter = ComponentCategory | "ui";

/** index 항목 하나를 요약으로. lib 항목(utils · a11y-labels)은 다른 항목이 끌어오는 것이라 null 입니다 */
export function toComponent(entry: RegistryIndexEntry): RegistryComponent | null {
  const kind = itemKind(entry);
  if (kind === "lib") return null;
  const meta = getComponentMeta(entry.name);
  const category: ComponentCategory =
    kind === "agentic" ? "agentic" : meta && meta.category !== "agentic" ? meta.category : "core";
  return {
    name: entry.name,
    title: entry.title ?? meta?.displayName ?? entry.name,
    description: entry.description ?? meta?.description ?? "",
    kind,
    category,
    package: meta?.package ?? (kind === "agentic" ? "@axis-ds/agentic-ui" : "@axis-ds/ui-react"),
  };
}

/** index 의 컴포넌트(lib 제외) */
export function componentsOf(index: RegistryIndex): RegistryComponent[] {
  const out: RegistryComponent[] = [];
  for (const entry of index.items) {
    const c = toComponent(entry);
    if (c) out.push(c);
  }
  return out;
}

export function matchesFilter(component: RegistryComponent, filter: ComponentFilter | undefined): boolean {
  if (!filter) return true;
  if (filter === "ui") return component.kind === "ui";
  return component.category === filter;
}

/** 안내 블록(인용). 없으면 빈 배열 */
export function noticeLines(notices: string[]): string[] {
  return notices.map((n) => `> 안내: ${n}`);
}
