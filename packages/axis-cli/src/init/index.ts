/**
 * `axis init` 명령 등록 (WI-0038)
 */

import type { Command } from "commander";
import chalk from "chalk";
import { DEFAULT_REGISTRY_URL } from "../registry/remote.js";
import { ask, isInteractive as stdinIsInteractive, noteDefault, type InteractiveCheck } from "../interactive.js";
import { isTailwind4, planUtilsDependencies, resolveInitAnswers, runInit, type InitAnswers } from "./init.js";

/** 테스트에서 대화형 판정을 바꿀 때만 씁니다(WI-0075) */
export interface InitCommandDeps {
  /** 질문을 띄울 수 있는지. 기본은 stdin 이 TTY 인지입니다 */
  isInteractive?: InteractiveCheck;
}

/**
 * registryUrl: 새 axis.config.json 에 적을 registry. 기본값은 DEFAULT_REGISTRY_URL 이고, 환경변수 AXIS_REGISTRY_URL 은
 * 여기서 읽지 않습니다(WI-0045 D7: 환경변수는 add · list 실행 때만 우선, config 에는 기본값 또는 기존 값만 기록).
 */
export function registerInitCommand(
  program: Command,
  registryUrl: string = DEFAULT_REGISTRY_URL,
  deps: InitCommandDeps = {}
) {
  program
    .command("init")
    .description("프로젝트에 AXIS Design System 초기화")
    .option("-y, --yes", "기본값으로 자동 설정")
    .action(async (options) => {
      console.log(chalk.blue("\n🎨 AXIS Design System 초기화\n"));
      const baseDir = process.cwd();
      // Tailwind 4 이상은 설정 파일이 없어 묻지 않습니다(WI-0044 FR-3). runInit 도 같은 판정으로 기록하지 않습니다.
      const tailwind4 = isTailwind4(planUtilsDependencies(baseDir).tailwind);
      // 기존 config 값 · 실재 파일 · src 유무로 정한 값(WI-0041 D5 · WI-0049 D6). -y 는 그대로, 대화형은 초기값으로 씁니다
      const resolved = await resolveInitAnswers(baseDir, tailwind4);
      for (const note of resolved.notes) console.log(note.startsWith("!") ? chalk.yellow(note) : chalk.gray(note));

      // 비대화형(CI · 파이프)은 묻지 않고 -y 와 같은 기본값으로 진행하고 쓴 값을 알립니다(WI-0075 D1).
      // 기본값은 기존 config · 실재 파일로 정한 값이고, 파일 덮어쓰기 판정은 runInit 이 -y 와 똑같이 합니다
      const interactive = (deps.isInteractive ?? stdinIsInteractive)();
      if (!options.yes && !interactive) {
        const a = resolved.answers;
        const values = [`componentsDir=${a.componentsDir}`, ...(tailwind4 ? [] : [`tailwindConfig=${a.tailwindConfig}`]), `globalCss=${a.globalCss}`];
        noteDefault(`기본값으로 진행합니다(-y 와 같음): ${values.join(", ")}`);
      }
      const config: InitAnswers = options.yes || !interactive
        ? { ...resolved.answers }
        : await ask([
            {
              type: "text",
              name: "componentsDir",
              message: "컴포넌트 디렉토리:",
              initial: resolved.answers.componentsDir,
            },
            {
              type: tailwind4 ? null : "text",
              name: "tailwindConfig",
              message: "Tailwind 설정 파일:",
              initial: resolved.answers.tailwindConfig,
            },
            {
              type: "text",
              name: "globalCss",
              message: "글로벌 CSS 파일:",
              initial: resolved.answers.globalCss,
            },
          ], interactive);

      await runInit(baseDir, config, registryUrl);
    });
}
