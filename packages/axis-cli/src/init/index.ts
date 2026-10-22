/**
 * `axis init` 명령 등록 (WI-0038)
 */

import type { Command } from "commander";
import chalk from "chalk";
import prompts from "prompts";
import { DEFAULT_REGISTRY_URL } from "../registry/remote.js";
import { INIT_DEFAULTS, isTailwind4, planUtilsDependencies, runInit, type InitAnswers } from "./init.js";

/**
 * registryUrl: 새 axis.config.json 에 적을 registry. 기본값은 DEFAULT_REGISTRY_URL 이고, 환경변수 AXIS_REGISTRY_URL 은
 * 여기서 읽지 않습니다(WI-0045 D7: 환경변수는 add · list 실행 때만 우선, config 에는 기본값 또는 기존 값만 기록).
 */
export function registerInitCommand(program: Command, registryUrl: string = DEFAULT_REGISTRY_URL) {
  program
    .command("init")
    .description("프로젝트에 AXIS Design System 초기화")
    .option("-y, --yes", "기본값으로 자동 설정")
    .action(async (options) => {
      console.log(chalk.blue("\n🎨 AXIS Design System 초기화\n"));
      // Tailwind 4 이상은 설정 파일이 없어 묻지 않습니다(WI-0044 FR-3). runInit 도 같은 판정으로 기록하지 않습니다.
      const tailwind4 = isTailwind4(planUtilsDependencies(process.cwd()).tailwind);

      const config: InitAnswers = options.yes
        ? { ...INIT_DEFAULTS }
        : await prompts([
            {
              type: "text",
              name: "componentsDir",
              message: "컴포넌트 디렉토리:",
              initial: INIT_DEFAULTS.componentsDir,
            },
            {
              type: tailwind4 ? null : "text",
              name: "tailwindConfig",
              message: "Tailwind 설정 파일:",
              initial: INIT_DEFAULTS.tailwindConfig,
            },
            {
              type: "text",
              name: "globalCss",
              message: "글로벌 CSS 파일:",
              initial: INIT_DEFAULTS.globalCss,
            },
          ]);

      await runInit(process.cwd(), config, registryUrl);
    });
}
