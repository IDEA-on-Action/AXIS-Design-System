# WI-0046 릴리스 노트: 애니메이션 플러그인 의존 선언 · accordion · progress keyframes

> 작성일: 2026-10-24 | WI: WI-0046 | GitHub: #137 | changeset: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` patch

## 변경 사항

- **keyframes**: `@axis-ds/tokens` Tailwind 3 preset 에 `accordion-down` · `accordion-up` · `progress-indeterminate` keyframes 와 `animate-*` 를 더했어요. Tailwind 4 진입점(`@axis-ds/tokens/css/tailwind4`)은 같은 출처로 `@keyframes` 와 `--animate-*` 를 만들어요. 그동안 Accordion · Progress 불확정 애니메이션은 어떤 플러그인을 넣어도 돌지 않았어요
- **preset 없이 쓰기**: `import { axisKeyframes, axisAnimation } from '@axis-ds/tokens/tailwind'` 로 keyframes 만 가져올 수 있어요
- **Progress 불확정**: 트랙 전체를 채워 100% 완료처럼 보이던 표시를 1/3 폭 막대가 왕복하는 형태로 바꿨어요. 애니메이션이 꺼져도 꽉 찬 막대와 구별돼요
- **플러그인 의존 선언**: `@axis-ds/ui-react` 가 `tailwindcss-animate`(Tailwind 3) · `tw-animate-css`(Tailwind 4) 를 선택적 peer 의존으로 선언해요. Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast 의 열고 닫는 애니메이션에 필요해요. 설치 경고는 나오지 않으니 문서(Quick Start 「Tailwind CSS 4」 · Troubleshooting · README)대로 넣어 주세요
- **움직임 줄이기**: `prefers-reduced-motion: reduce` 에서 ui-react · agentic-ui 의 모든 컴포넌트 애니메이션(스피너 포함)이 멈춰요
- **SurfaceRenderer**: text surface 가 설치되지 않은 `@tailwindcss/typography` 의 `prose` 대신 `text-sm`(14px) 을 써요
- **문서 사이트**: Accordion 데모가 움직이고, `/components/progress` 가 실제 Progress 로 바뀌었어요(Indeterminate 데모 추가)

## 알려진 한계

- 복사 설치(`axis add` · shadcn 레지스트리) 항목에는 애니메이션 플러그인이 기재되지 않아요. 플러그인이 Tailwind 버전마다 다르고 설정 줄도 필요해서예요. `axis init` 안내 · `axis check` 경고는 후속 묶음(WI-0037 · 0041 · 0049 · 0065)에서 다뤄요
- 템플릿 4종은 이번에 바뀌지 않았어요(AXIS 전환은 WI-0067)
- Safari · Firefox 와 Next.js 앱 빌드 소비자 환경은 실측하지 않았어요(Chromium + 정적 번들로 측정)
- Tailwind 4 + tw-animate-css 에서는 accordion keyframes 가 두 벌 생성되고 tw-animate-css 정의가 적용돼요(동작 같음)
