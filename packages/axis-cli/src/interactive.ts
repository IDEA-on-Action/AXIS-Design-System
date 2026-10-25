/**
 * 대화형 질문의 공통 판정 (WI-0075)
 *
 * prompts 2.4 는 비TTY stdin 이 닫히면(EOF) submit · abort 를 내지 않아 `await prompts(...)` 가 끝나지 않습니다.
 * 이벤트 루프가 비면 Node 가 정상 종료해 「질문 한 줄만 찍고 파일 0개 · rc 0」이 됐습니다(add 는 WI-0045 D3 에서 따로 막음).
 * 그래서 질문은 이 모듈의 `ask` 로만 띄우고, 부르는 쪽이 먼저 `isInteractive()` 로 갈래를 나눕니다.
 * - 기본값이 있고 파괴적이지 않은 질문: 기본값으로 진행하고 쓴 값을 1줄로 알림(`noteDefault`)
 * - 덮어쓰기 확인 · 기본값이 없는 입력: rc 1 과 필요한 플래그 안내(`failNonInteractive`)
 * 가드를 빠뜨린 호출은 `ask` 가 NonInteractiveError 로 막고, 진입점(src/index.ts)의 `await program.parseAsync()` 가
 * 그 오류를 rc 1 로 바꿉니다. 소스에서 prompts 를 직접 import 하는 곳은 이 파일뿐입니다(interactive.test.ts 가 검사).
 */

import chalk from "chalk";
import prompts from "prompts";

/** 질문을 띄울 수 있는지 판정하는 함수. 테스트에서 주입합니다 */
export type InteractiveCheck = () => boolean;

/** stdin 이 TTY 이면 대화형입니다(CI · 파이프 · `</dev/null` 은 비대화형) */
export const isInteractive: InteractiveCheck = () => process.stdin.isTTY === true;

/** 비대화형에서 질문을 띄우려 할 때의 오류. 진입점이 rc 1 로 바꿉니다 */
export class NonInteractiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonInteractiveError";
  }
}

/**
 * 질문을 띄웁니다. 비대화형이면 질문을 띄우지 않고 NonInteractiveError 를 던집니다(가드 누락 방어).
 * 응답 타입은 prompts 와 같이 느슨합니다(부르는 쪽에서 좁힙니다).
 */
export async function ask<T extends string = string>(
  questions: prompts.PromptObject<T> | Array<prompts.PromptObject<T>>,
  interactive: boolean
): Promise<prompts.Answers<T>> {
  if (!interactive) {
    const list = Array.isArray(questions) ? questions : [questions];
    const first = list.find((q) => q.type !== null);
    const message = typeof first?.message === "string" ? first.message : String(first?.name ?? "");
    throw new NonInteractiveError(`비대화형 실행이라 질문(${message})에 답할 수 없습니다. 대화형 터미널에서 실행하거나 필요한 옵션을 주세요.`);
  }
  return prompts(questions);
}

/** 비대화형이라 기본값으로 진행할 때 쓴 값을 한 줄로 알립니다 */
export function noteDefault(message: string): void {
  console.log(chalk.gray(`비대화형 실행이라 ${message}`));
}

/**
 * 비대화형에서 답할 사람이 없어 멈출 때: 이유와 필요한 옵션을 알리고 rc 1 로 끝나게 합니다(파일은 쓰지 않음).
 * 출력이 끝나도록 exit 대신 exitCode 를 씁니다.
 */
export function failNonInteractive(reason: string, hints: string[]): void {
  console.error(chalk.red(`비대화형 실행이라 ${reason}`));
  for (const hint of hints) console.error(chalk.yellow(`  ${hint}`));
  process.exitCode = 1;
}
