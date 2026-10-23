/**
 * AXIS Design System MCP - 설치 도구 (WI-0055)
 *
 * cli `axis add` 와 같은 공유 코어(@axis-ds/registry-core 의 runAdd)로 레지스트리 항목을 설치합니다.
 * registryDependencies 재귀 수집 · import 재작성 · 경로 이탈 · 링크 · 하드링크 검사 · 의존성 안내가 cli 와 같습니다.
 *
 * MCP 고유 규칙(2026-10-23 사용자 결정)
 * - D3 덮어쓰기: 대화형 확인이 없으므로 내용이 다른 기존 파일은 건너뛰고 알립니다(cli `-y`). `overwrite: true` 일 때만 덮어씁니다.
 *   건너뛰어도 isError 는 false 이고, 결과 첫머리에 건너뛴 수를 적습니다.
 * - D4 targetDir: 프로젝트 루트입니다. axis.config.json 이 있으면 그 배치, 없으면 기본 배치(components/ui · components/agentic)로
 *   설치하고 그 사실을 알립니다. 결과에 해석한 절대 경로를 적고, 경로 이탈 검사의 루트도 targetDir 입니다.
 *   상대 경로는 서버의 현재 디렉터리 기준이라, 없는 디렉터리면 아무것도 쓰지 않고 실패합니다.
 * - D5 의존성: 설치 명령만 안내하고 실행하지 않습니다.
 * - D7 출력: 종전 머리글(「# 컴포넌트 설치 완료」 · 「# 컴포넌트 설치 실패」)을 유지하고 줄을 더합니다. 실패(일부 쓰기 뒤 실패 포함)는 isError 입니다.
 */

import { statSync } from "node:fs";
import path from "node:path";
import { runAdd, type AddHints } from "@axis-ds/registry-core/add";
import type { AxisConfig } from "@axis-ds/registry-core/config";
import { describeOrigin, noticeLines, openSource, type RegistryDeps } from "./registry-source.js";
import type { InstallResult } from "../types.js";

export interface InstallComponentParams {
  /** 설치할 이름 하나(종전 인자) */
  name?: string;
  /** 설치할 이름 여러 개(D6). name 과 함께 주면 합칩니다 */
  names?: string[];
  /** 프로젝트 루트 */
  targetDir: string;
  /** 내용이 다른 기존 파일을 덮어쓸지(D3). 기본 false */
  overwrite?: boolean;
}

/** config 가 없을 때의 기본 배치(D4). agentic 은 componentsDir 의 형제 components/agentic 입니다 */
export const DEFAULT_LAYOUT_CONFIG: AxisConfig = { componentsDir: "components/ui" };

/** 코어 안내 문구를 MCP 인자 이름으로 */
export const MCP_ADD_HINTS: AddHints = {
  listCommand: "axis.list_components",
  overwrite: "overwrite: true",
  agenticFlag: false,
};

function requestedNames(params: InstallComponentParams): string[] {
  const raw = [...(params.name !== undefined ? [params.name] : []), ...(params.names ?? [])];
  // 종전처럼 대소문자를 가리지 않습니다(레지스트리 이름은 모두 소문자)
  return raw.map((n) => n.trim().toLowerCase()).filter((n) => n !== "");
}

function emptyResult(root: string, message: string): InstallResult {
  return {
    success: false,
    root,
    source: "레지스트리를 조회하지 않음(설치 전에 멈춤)",
    items: [],
    installedFiles: [],
    overwrittenFiles: [],
    unchangedFiles: [],
    skippedFiles: [],
    usedDefaultLayout: false,
    notices: [],
    errors: [],
    message,
  };
}

/**
 * axis.install_component 도구 구현
 */
export async function handleInstallComponent(
  params: InstallComponentParams,
  deps: RegistryDeps = {}
): Promise<InstallResult> {
  const names = requestedNames(params);
  if (names.length === 0) {
    throw new Error("컴포넌트 이름(name 또는 names)은 필수입니다.");
  }
  if (!params.targetDir || params.targetDir.trim() === "") {
    throw new Error("대상 디렉토리(targetDir)는 필수입니다.");
  }

  const root = path.resolve(params.targetDir);
  let isDir = false;
  try {
    isDir = statSync(root).isDirectory();
  } catch {
    isDir = false;
  }
  if (!isDir) {
    return emptyResult(
      root,
      `대상 디렉터리가 없습니다: ${root}. targetDir 에는 이미 있는 프로젝트 루트를 주세요(상대 경로는 서버의 현재 디렉터리 기준).`
    );
  }

  const { client, notices } = await openSource(root, deps);
  const logs: string[] = [];
  const errors: string[] = [];
  const add = await runAdd(
    root,
    names,
    { overwrite: params.overwrite === true, yes: true },
    {
      client,
      log: (...a) => logs.push(a.map(String).join(" ")),
      error: (...a) => errors.push(a.map(String).join(" ")),
      hints: MCP_ADD_HINTS,
      fallbackConfig: DEFAULT_LAYOUT_CONFIG,
    }
  );

  // D13: 사용한 주소와 출처는 실패해도 항상 적습니다
  let source = describeOrigin(client);
  if (client.origin !== null) {
    try {
      source = describeOrigin(client, (await client.getIndex()).version);
    } catch {
      // index 를 다시 읽지 못하면 version 없이 둡니다
    }
  }
  const usedDefaultLayout = add.usedFallbackConfig === true;
  if (usedDefaultLayout) {
    notices.push("axis.config.json 이 없어 기본 배치(components/ui · components/agentic)로 설치했습니다. 배치를 바꾸려면 프로젝트 루트에서 `npx @axis-ds/cli init` 으로 config 를 만드세요");
  }

  const overwritten = new Set(add.overwritten);
  const success = add.exitCode === 0;
  const items = add.items ?? [];
  return {
    success,
    root,
    source,
    items,
    installedFiles: add.written.filter((p) => !overwritten.has(p)),
    overwrittenFiles: add.overwritten,
    unchangedFiles: add.unchanged,
    skippedFiles: add.skipped,
    ...(add.dependencyCommand ? { dependencyCommand: add.dependencyCommand } : {}),
    usedDefaultLayout,
    notices,
    errors,
    message: success
      ? `컴포넌트 ${names.map((n) => `'${n}'`).join(", ")} 설치를 마쳤습니다(설치 항목 ${items.length}개: ${items.join(", ")}).`
      : `컴포넌트 ${names.map((n) => `'${n}'`).join(", ")} 를 설치하지 못했습니다.`,
  };
}

function fileList(title: string, files: string[], note?: string): string[] {
  if (files.length === 0) return [];
  const lines = [`## ${title}`];
  if (note) lines.push(note);
  for (const f of files) lines.push(`- \`${f}\``);
  lines.push("");
  return lines;
}

/**
 * 설치 결과를 Markdown 형식으로 포맷팅
 */
export function formatInstallResult(result: InstallResult): string {
  const lines: string[] = [];

  lines.push(result.success ? "# 컴포넌트 설치 완료" : "# 컴포넌트 설치 실패");
  lines.push("");
  // D3: 건너뛴 수는 결과 첫머리에 적습니다
  if (result.skippedFiles.length > 0) {
    lines.push(
      `> 내용이 다른 기존 파일 ${result.skippedFiles.length}개를 건너뛰었습니다(사용자 수정 유지). 덮어쓰려면 \`overwrite: true\` 로 다시 호출하세요.`
    );
    lines.push("");
  }
  lines.push(result.message);
  lines.push("");
  lines.push(`- **프로젝트 루트**: \`${result.root}\``);
  if (result.source) lines.push(`- **레지스트리**: ${result.source}`);
  lines.push(...noticeLines(result.notices));
  lines.push("");

  if (!result.success && result.errors.length > 0) {
    lines.push("## 오류");
    for (const e of result.errors) lines.push(e.startsWith("  ") ? e : `- ${e}`);
    lines.push("");
  }

  lines.push(...fileList("설치된 파일", result.installedFiles));
  lines.push(...fileList("덮어쓴 파일", result.overwrittenFiles));
  lines.push(...fileList("같은 내용이라 건너뛴 파일", result.unchangedFiles));
  lines.push(...fileList("내용이 달라 건너뛴 파일", result.skippedFiles, "덮어쓰려면 `overwrite: true` 로 다시 호출하세요."));

  if (result.dependencyCommand) {
    lines.push("## 필요한 의존성");
    lines.push("package.json 에 없는 패키지입니다. 다음 명령으로 설치해 주세요(서버는 설치를 실행하지 않았습니다):");
    lines.push("");
    lines.push("```bash");
    lines.push(result.dependencyCommand);
    lines.push("```");
  }

  return lines.join("\n").replace(/\n+$/, "");
}
