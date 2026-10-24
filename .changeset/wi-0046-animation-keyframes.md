---
"@axis-ds/tokens": patch
"@axis-ds/ui-react": patch
"@axis-ds/agentic-ui": patch
---

Accordion · Progress 애니메이션이 어떤 설정에서도 돌지 않던 결함을 고치고, 애니메이션 플러그인 의존을 선언했습니다(WI-0046).

- `@axis-ds/tokens`: Tailwind 3 preset 에 keyframes 3개(`accordion-down` · `accordion-up` · `progress-indeterminate`)와 `animate-*` 를 더했습니다. Tailwind 4 진입점(`css/tailwind4`)은 같은 출처로 `@keyframes` 와 `--animate-*` 를 만듭니다. preset 을 쓰지 않는 앱을 위해 `axisKeyframes` · `axisAnimation` 을 `@axis-ds/tokens/tailwind` 에서 내보냅니다.
- `@axis-ds/ui-react`: Progress `indeterminate` 가 트랙 전체를 채워 100% 완료처럼 보이던 표시를, 1/3 폭 막대가 왕복하는 형태로 바꿨습니다. Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast 가 쓰는 열고 닫는 애니메이션 플러그인(Tailwind 3 `tailwindcss-animate` · Tailwind 4 `tw-animate-css`)을 선택적 peer 의존으로 선언했습니다(설치 경고는 나오지 않습니다).
- `@axis-ds/ui-react` · `@axis-ds/agentic-ui`: 움직임 줄이기(`prefers-reduced-motion: reduce`) 설정에서 모든 컴포넌트 애니메이션이 멈춥니다(`motion-reduce:!animate-none`).
- `@axis-ds/agentic-ui`: SurfaceRenderer 의 text surface 가 설치되지 않은 `@tailwindcss/typography` 의 `prose` 대신 `text-sm` 을 씁니다. 플러그인을 넣었을 때와 같은 14px 입니다.
