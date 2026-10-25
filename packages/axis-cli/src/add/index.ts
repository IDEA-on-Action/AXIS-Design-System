/**
 * `axis add` · `axis list` 명령 등록 (WI-0045 FR-4 · FR-5)
 */

import type { Command } from "commander";
import chalk from "chalk";
import type { RegistryClient } from "../registry/index.js";
import { ask, isInteractive as stdinIsInteractive, type InteractiveCheck } from "../interactive.js";
import { createClientFor, groupIndex, runAdd, type ConfirmFn, type ListEntry } from "./add.js";

/** 테스트에서 레지스트리 클라이언트를 바꿀 때만 씁니다 */
export interface CommandDeps {
  createClient?: (cwd: string) => Promise<RegistryClient>;
  /** 대화형 확인을 띄울 수 있는지. 기본은 stdin 이 TTY 인지입니다 */
  isInteractive?: InteractiveCheck;
}

/**
 * 대화형 확인. stdin 이 TTY 가 아니면(CI · 파이프 · 닫힌 stdin) 확인을 띄우지 않고 undefined 를 돌려줍니다.
 * 그러면 runAdd 는 `-y` 와 같이 내용이 다른 기존 파일을 건너뛰고 요약을 출력합니다(D3).
 * 닫힌 stdin 에서 prompts 를 띄우면 응답이 오지 않은 채 이벤트 루프가 비어 요약 없이 rc 0 으로 끝났습니다.
 * Ctrl+C 등으로 취소하면 덮어쓰지 않습니다. 판정과 질문은 공통 헬퍼(src/interactive.ts, WI-0075)를 씁니다.
 */
export function createConfirm(interactive: boolean): ConfirmFn | undefined {
  if (!interactive) return undefined;
  return async (message) => {
    const { overwrite } = await ask({ type: "confirm", name: "overwrite", message, initial: false }, interactive);
    return overwrite === true;
  };
}

const defaultCreateClient = (cwd: string) => createClientFor(cwd, (m) => console.warn(chalk.yellow(m)));

export function registerAddCommand(program: Command, deps: CommandDeps = {}) {
  program
    .command("add <components...>")
    .description("레지스트리의 컴포넌트를 프로젝트에 복사(registryDependencies 포함)")
    .option("--agentic", "이름 앞에 agentic- 를 붙여 찾음(전체 이름도 허용)")
    .option("-y, --yes", "묻지 않고 진행. 내용이 다른 기존 파일은 건너뜀")
    .option("--overwrite", "내용이 다른 기존 파일을 덮어씀")
    .action(async (components: string[], options: { agentic?: boolean; yes?: boolean; overwrite?: boolean }) => {
      const client = await (deps.createClient ?? defaultCreateClient)(process.cwd());
      const confirm = createConfirm((deps.isInteractive ?? stdinIsInteractive)());
      const result = await runAdd(process.cwd(), components, options, {
        client,
        log: (...a) => console.log(...a),
        error: (...a) => console.error(chalk.red(a.map(String).join(" "))),
        ...(confirm ? { confirm } : {}),
      });
      process.exitCode = result.exitCode;
    });
}

export function registerListCommand(program: Command, deps: CommandDeps = {}) {
  program
    .command("list")
    .description("레지스트리의 컴포넌트 목록")
    .option("--category <type>", "카테고리 필터 (ui, agentic)")
    .action(async (options: { category?: string }) => {
      if (options.category !== undefined && options.category !== "ui" && options.category !== "agentic") {
        console.error(chalk.red(`--category 는 ui 또는 agentic 입니다(받은 값: ${options.category})`));
        process.exitCode = 1;
        return;
      }
      const client = await (deps.createClient ?? defaultCreateClient)(process.cwd());
      let groups: ReturnType<typeof groupIndex>;
      let version: string;
      try {
        const index = await client.getIndex();
        groups = groupIndex(index);
        version = index.version;
      } catch (e) {
        console.error(chalk.red(`레지스트리를 읽지 못했습니다: ${(e as Error).message}`));
        process.exitCode = 1;
        return;
      }

      const total = groups.ui.length + groups.agentic.length;
      const origin = client.origin === "bundled" ? "CLI 에 포함된 레지스트리" : "원격 레지스트리";
      console.log(chalk.blue(`\n📦 AXIS Design System 컴포넌트 ${total}개 (${origin}, version ${version})\n`));

      const show = (label: string, items: ListEntry[]) => {
        console.log(chalk.bold(`${label} (${items.length})`));
        for (const c of items) {
          console.log(`  ${chalk.cyan(c.name.padEnd(32))} ${chalk.gray(c.description ?? c.title ?? "")}`);
        }
        console.log();
      };
      if (!options.category || options.category === "ui") show("Core UI", groups.ui);
      if (!options.category || options.category === "agentic") show("Agentic UI", groups.agentic);

      console.log(chalk.gray("사용법: npx @axis-ds/cli add <이름...>  (예: add button input card)"));
      console.log(chalk.gray("Agentic: npx @axis-ds/cli add run-progress --agentic  (= add agentic-run-progress)\n"));
    });
}
