---
'@axis-ds/tokens': patch
---

Tailwind 3 preset 이 preflight 의 기본 테두리색(`theme.extend.borderColor.DEFAULT`)을 `hsl(var(--border, 220 13% 91%))` 로 정합니다(WI-0077). 1.8.0 까지는 기본값 gray-200(#e5e7eb)이 그대로라, quick-start 예시처럼 `@axis-ds/tokens/css/shadcn` 을 `@tailwind` 앞에 import 하면 preflight 가 그 파일의 `* { border-color: hsl(var(--border)) }` 를 이겨 색을 지정하지 않은 `border` · `border-t` · `hr` 가 다크 · 브랜드에서도 회색이었어요.

- Next 15 · Tailwind 3.4.19 소비자, 기본 · ontology x 라이트 · 다크 4개 상태에서 세 탐침의 테두리 불일치가 1.8.0 의 9/12 에서 0/12 가 됐어요. `border-red-500` · `border-border` 같은 색 지정 유틸리티는 그대로 이겨요.
- `--border` 를 정의하지 않은 앱(`css/shadcn` 을 넣지 않은 앱)은 fallback 이 gray-200 과 같은 값이라 종전 색(rgb(229, 231, 235))을 그대로 써요.
- 앱이 `--border` 를 HSL 삼중값이 아닌 형식(hex · `hsl(...)` · `oklch(...)`)으로 따로 정의했다면 기본 테두리가 글자색으로 바뀌어요(1.8.0 은 gray-200). `--border` 를 삼중값으로 바꾸거나 `tailwind.config` 의 `borderColor.DEFAULT` 로 정하세요.
- Tailwind 4 진입점(`css/tailwind4`)과 CSS 파일은 바뀌지 않았어요(바이트 동일).
- 문서: `@axis-ds/ui-react` README 의 Tailwind 3 절이 `@axis-ds/tokens/css/shadcn` 만 안내해 컴포넌트가 읽는 `--axis-*` 변수가 빠지던 예시를 `@axis-ds/tokens/css` 와 함께 두 줄로 바로잡았어요. tokens README 와 가이드의 「Tailwind 3 은 gray-200」 서술도 고쳤고, 1.8.0 이하에서는 `@layer base { * { @apply border-border; } }` 블록을 두라고 안내해요.
