# WI-0077 릴리스 노트: Tailwind 3 의 색 없는 border 가 AXIS 테두리색을 따라요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #203 | 대상: `@axis-ds/tokens` patch(linked 로 tokens · theme · ui-react · agentic-ui 1.8.1 예정). cli · mcp 는 이 WI 로 바뀌지 않아요

## 바뀐 점

- Tailwind 3 preset 이 preflight 의 기본 테두리색(`theme.extend.borderColor.DEFAULT`)을 `hsl(var(--border, 220 13% 91%))` 로 정해요. quick-start 예시처럼 `@axis-ds/tokens/css/shadcn` 을 `@tailwind` 앞에 import 한 앱에서 색을 지정하지 않은 `border` · `border-t` · `hr` 가 다크 · 브랜드에서도 AXIS `--border` 색이 돼요(1.8.0: 4개 상태 x 3 탐침 12칸 중 9칸 회색, 1.8.1 후보: 0칸).
- `border-red-500` · `border-border` 같은 색 지정 유틸리티는 종전처럼 이겨요.
- `--border` 를 정의하지 않은 앱(`css/shadcn` 을 넣지 않은 앱)은 fallback 이 gray-200 과 같은 값이라 테두리색이 그대로예요(rgb(229, 231, 235)).
- Tailwind 4 진입점과 CSS 파일은 바이트 단위로 같아요.

## 문서

- `@axis-ds/ui-react` README 「Tailwind CSS 3」 절: `@axis-ds/tokens/css` 와 `@axis-ds/tokens/css/shadcn` 두 줄을 이 순서로 안내해요. 종전 예시(`css/shadcn` 한 줄)는 컴포넌트가 읽는 `--axis-*` 가 빠져 Input 경계가 글자색, Progress 채움이 투명이었어요.
- `@axis-ds/tokens` README · quick-start · 테마 커스터마이징 가이드의 「Tailwind 3 은 gray-200」 서술을 고쳤어요.

## 업그레이드 안내

- 1.8.0 이하를 쓰는 동안에는 전역 CSS 의 `@tailwind utilities;` 뒤에 `@layer base { * { @apply border-border; } }` 블록을 두면 같은 결과예요. AXIS 템플릿 4종은 이미 이 블록을 갖고 있고 1.8.1 에서도 그대로 둬요(결과 같음).
- preset 을 쓰면서 앱 `tailwind.config` 에서 `borderColor.DEFAULT` 를 직접 정한 경우는 앱 값이 이겨요(Tailwind 의 extend 병합 순서).
- 앱이 `--border` 를 HSL 삼중값(`220 13% 91%`)이 아닌 형식(`#e5e7eb` · `hsl(...)` 함수 · `oklch(...)`)으로 따로 정의했다면 `hsl(var(--border))` 가 계산 시점에 무효가 되어 기본 테두리가 글자색(currentColor)으로 바뀌어요(1.8.0 에서는 gray-200). 그런 앱은 `--border` 를 삼중값으로 바꾸거나 `tailwind.config` 에서 `borderColor.DEFAULT` 를 직접 정하세요(Chromium 측정: 정의 없음 · 삼중값은 정상, hex · `hsl()` · `oklch()` 는 글자색).
