import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `shadow-[shadow:<CSS 변수 참조>]` 처럼 `shadow:` 타입 힌트가 붙은 임의값 그림자 클래스인지 판정
 *
 * tailwind-merge 기본 설정은 이 클래스를 그림자 색(shadow-color) 그룹으로 분류해서
 * `cn(기본, "shadow-none")` 이 기본 그림자를 지우지 못하고, `shadow-black/50` 은 그림자를 통째로 지운다.
 * 그림자(shadow) 그룹에 등록해 종전 `shadow-sm` · `shadow-lg` 와 같은 병합 결과를 낸다(WI-0025 U4).
 */
const isArbitraryShadowWithHint = (value: string) => /^\[shadow:.+\]$/.test(value);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: [isArbitraryShadowWithHint] }],
    },
  },
});

/**
 * Tailwind CSS 클래스를 병합하는 유틸리티 함수
 * clsx로 조건부 클래스를 처리하고 tailwind-merge로 충돌을 해결
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
