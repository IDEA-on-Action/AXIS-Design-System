/**
 * utils.ts 가 import 하는 패키지의 범위 선택 (WI-0055: cli init/init.ts 에서 옮김)
 *
 * init 의 의존성 추가와 add 의 의존성 안내가 같은 범위를 쓰도록 한 곳에 둡니다.
 */

import type { TailwindDetection } from "./template/tailwind-core.js";

/** utils.ts 가 import 하는 `clsx` 의 범위(prd 1.5). Tailwind 버전과 관계없습니다. */
export const CLSX_RANGE = "^2.1.1";

/**
 * Tailwind major 별 `tailwind-merge` 범위(prd 1.6, 2026-10-19 사용자 결정 E2 · F1).
 * - Tailwind 4 이상: `^3.4.0`. tailwind-merge 3.x 가 Tailwind 4 를 대상으로 합니다(F1 로 `4` 만이 아니라 `4 이상`).
 * - Tailwind 3 이하: `^2.6.0`. tailwind-merge 2.x 가 Tailwind 3 을 대상으로 합니다. npm `tailwind-merge-2`
 *   태그가 2.6.1(2026-10-19 `npm view`)이고 2.x 의 마지막 minor 가 2.6 이라 `^2.6.0` 이 그 최신을 받습니다.
 * 템플릿 4종(`apps/web/templates/*`)은 이 범위의 근거가 아닙니다. 템플릿은 `tailwindcss ^3.4.0`(Tailwind 3)에
 * `tailwind-merge ^3.4.0` 을 함께 선언해 이 규칙과 어긋나고, 그 불일치는 WI-0037(#119)에서 다룹니다
 * (init.test.ts 에 알려진 불일치로 고정).
 */
export const TAILWIND_MERGE_RANGES = {
  tailwind4: "^3.4.0",
  tailwind3: "^2.6.0",
} as const;

/**
 * 추가할 범위를 고릅니다. Tailwind major 가 4 이상이면 `tailwind-merge ^3.4.0`, 3 이하와 판정 불가는
 * `^2.6.0` 입니다(F1 (c)). 판정 불가의 기본값을 Tailwind 3 쪽으로 둔 것은 사용자 결정(E2: 「3 이거나 없으면 ^2.6.0」)입니다.
 */
export function selectUtilsDependencies(tailwind: TailwindDetection): Record<string, string> {
  return {
    clsx: CLSX_RANGE,
    "tailwind-merge":
      tailwind.major !== undefined && tailwind.major >= 4
        ? TAILWIND_MERGE_RANGES.tailwind4
        : TAILWIND_MERGE_RANGES.tailwind3,
  };
}
