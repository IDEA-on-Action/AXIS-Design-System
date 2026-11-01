import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `shadow-[shadow:var(--axis-shadow-lg)]` 처럼 `shadow:` 타입 힌트가 붙은 임의값 그림자 클래스인지 판정해요.
 * tailwind-merge 기본 설정은 이 클래스를 그림자 색 그룹으로 보아서 `cn(기본, 'shadow-black/50')` 이 그림자를 통째로 지워요.
 * 그림자 그룹에 등록해 `shadow-md` · `shadow-lg` 와 같은 병합 결과를 내요(AXIS 레지스트리 utils 와 같은 설정, WI-0107).
 */
const isArbitraryShadowWithHint = (value: string) => /^\[shadow:.+\]$/.test(value)

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: [isArbitraryShadowWithHint] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
