# @axis-ds/agentic-ui

## 1.6.2

### Patch Changes

- bf629b9: Accordion · Progress 애니메이션이 어떤 설정에서도 돌지 않던 결함을 고치고, 애니메이션 플러그인 의존을 선언했습니다(WI-0046).
  - `@axis-ds/tokens`: Tailwind 3 preset 에 keyframes 3개(`accordion-down` · `accordion-up` · `progress-indeterminate`)와 `animate-*` 를 더했습니다. Tailwind 4 진입점(`css/tailwind4`)은 같은 출처로 `@keyframes` 와 `--animate-*` 를 만듭니다. preset 을 쓰지 않는 앱을 위해 `axisKeyframes` · `axisAnimation` 을 `@axis-ds/tokens/tailwind` 에서 내보냅니다.
  - `@axis-ds/ui-react`: Progress `indeterminate` 가 트랙 전체를 채워 100% 완료처럼 보이던 표시를, 1/3 폭 막대가 왕복하는 형태로 바꿨습니다. Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast 가 쓰는 열고 닫는 애니메이션 플러그인(Tailwind 3 `tailwindcss-animate` · Tailwind 4 `tw-animate-css`)을 선택적 peer 의존으로 선언했습니다(설치 경고는 나오지 않습니다).
  - `@axis-ds/ui-react` · `@axis-ds/agentic-ui`: 움직임 줄이기(`prefers-reduced-motion: reduce`) 설정에서 모든 컴포넌트 애니메이션이 멈춥니다(`motion-reduce:!animate-none`).
  - `@axis-ds/agentic-ui`: SurfaceRenderer 의 text surface 가 설치되지 않은 `@tailwindcss/typography` 의 `prose` 대신 `text-sm` 을 씁니다. 플러그인을 넣었을 때와 같은 14px 입니다.

- Updated dependencies [bf629b9]
  - @axis-ds/tokens@1.6.2
  - @axis-ds/ui-react@1.6.2

## 1.6.1

### Patch Changes

- Updated dependencies [dff48ee]
  - @axis-ds/ui-react@1.6.1

## 1.6.0

### Minor Changes

- e6f6eef: 기본 테마(브랜드 미지정)에서 흰 글자와 일부 보조 글자가 WCAG AA 4.5:1 에 못 미치던 색을 고쳤습니다(WI-0029). primitive 값과 전역 `status-*` 는 그대로이고, 미달을 일으키던 component · semantic 참조만 한 단계 진하게 옮겼습니다. `data-brand="ontology"` 화면은 바뀌지 않고, `shadcn-compat.css` 는 아래 다크 `--muted-foreground` 한 줄만 바뀝니다.

  기본 화면에서 바뀌는 색(라이트 · 다크 공통이 아니면 테마를 적었습니다):
  - Button 기본 바탕 `--axis-button-bg-default · hover · active`: #3B82F6 · #2563EB · #1D4ED8 → #2563EB · #1D4ED8 · #1E40AF (흰 글자 3.67 → 5.16)
  - Button destructive 바탕 `--axis-button-destructive-bg-default · hover · active`: #EF4444 · #DC2626 · #B91C1C → #DC2626 · #B91C1C · #991B1B (흰 글자 3.76 → 4.82)
  - MessageBubble 사용자 바탕 `--axis-agent-message-user-bg`: #3B82F6 → #2563EB
  - 다크 보조 글자 `--axis-text-secondary` #9CA3AF → #D1D5DB, `--axis-text-tertiary` #6B7280 → #9CA3AF (다크 `--axis-button-text-disabled` 도 #9CA3AF 로 같이 바뀝니다). 다크 `--axis-input-text-placeholder` 는 #9CA3AF 그대로입니다
  - shadcn 호환 다크 `--muted-foreground`(`shadcn-compat.css` 의 `.dark`): `218 11% 65%`(#9CA3AF) → `216 12% 84%`(#D1D5DB). 종전처럼 `text.secondary` 에서 파생되어 함께 바뀝니다. 라이트 값과 그 밖의 줄은 그대로입니다
  - PlanCard 거절 hover 글자 `--axis-plan-card-reject-hover-text`: #EF4444 → 라이트 #B91C1C · 다크 #F87171

  새 CSS 변수 3개(PlanCard 전용, 기본값 라이트 / 다크):
  - `--axis-plan-card-approve-bg` #15803D / #15803D: 승인 버튼 바탕(종전 `--axis-status-success`)
  - `--axis-plan-card-approve-hover-bg` #166534 / #166534: 승인 버튼 hover 바탕(종전 `--axis-status-success-strong`)
  - `--axis-plan-card-reject-text` #B91C1C / #EF4444: 거절 버튼 글자(종전 `--axis-status-error`)

  PlanCard 는 이 새 변수를 씁니다. ontology 브랜드 CSS 에는 새 변수 3개를 종전과 같은 값(`status-success` · `status-success-strong` · `status-error`)으로 더해 화면이 바뀌지 않습니다.

  마이그레이션: 토큰 변수(`var(--axis-button-bg-default)` 등)로 색을 쓰고 있다면 할 일이 없습니다. 위 hex 값을 직접 적어 AXIS 버튼 색과 맞추던 곳(스크린샷 비교, 하드코딩한 #3B82F6 · #EF4444 등)은 새 값으로 고치세요. 자체 브랜드 CSS 로 PlanCard 색을 바꾸던 경우에는 승인 버튼 · 거절 글자가 이제 `--axis-status-*` 대신 새 변수 3개를 읽으므로, 같은 값을 새 변수에도 지정하세요.

  cli · mcp 는 동봉 레지스트리의 PlanCard(`agentic-plan-card`) 항목을 위 새 변수 3개를 쓰는 소스로 갱신합니다. `axis add plan-card` 는 원격 레지스트리(pages.dev)를 먼저 읽으므로, 받는 소스는 문서 사이트가 배포된 뒤부터 새 변수를 씁니다. 원격에 닿지 못해 동봉본으로 폴백할 때는 이 cli · mcp 버전부터 새 소스가 설치됩니다.

  `axis add plan-card` 로 PlanCard 소스를 이미 프로젝트에 복사해 간 경우, 토큰 패키지만 올려서는 승인 · 거절 버튼 대비가 고쳐지지 않습니다. 복사본은 여전히 `--axis-status-success` · `--axis-status-success-strong` · `--axis-status-error` 를 읽기 때문입니다. `axis add plan-card` 로 다시 받거나, 복사본의 className 3곳을 새 변수로 바꾸세요: `bg-[var(--axis-status-success)]` -> `bg-[var(--axis-plan-card-approve-bg)]`, `hover:bg-[var(--axis-status-success-strong)]` -> `hover:bg-[var(--axis-plan-card-approve-hover-bg)]`, 거절 버튼의 `text-[var(--axis-status-error)]` -> `text-[var(--axis-plan-card-reject-text)]`.

### Patch Changes

- Updated dependencies [e6f6eef]
  - @axis-ds/tokens@1.6.0
  - @axis-ds/ui-react@1.6.0

## 1.5.2

### Patch Changes

- Updated dependencies [a36eb82]
  - @axis-ds/ui-react@1.5.2

## 1.5.1

### Patch Changes

- 4f59fe0: `StreamingText` 가 첫 글자를 빼고 끝에 `undefined` 를 붙여 표시하던 결함을 고쳤습니다(WI-0052).
  - 「스트리밍 완료 문장」이 「트리밍 완료 문장undefined」로 보이던 문제가 사라졌습니다. 스트리밍 중 화면은 늘 `text` 의 앞부분이고, 끝나면 `text` 와 정확히 같습니다.
  - React StrictMode(Next.js 개발 서버 기본값)에서 아무 글자도 표시되지 않던 문제, 부모가 렌더마다 새 `onComplete` 함수를 넘기면 진행이 멈추던 문제를 함께 고쳤습니다.
  - 스트리밍 도중 `text` 를 이어 붙이면 지금 위치에서 계속 흘리고, 이전 `text` 로 시작하지 않는 새 `text` 가 오면 처음부터 다시 흘립니다(종전에는 남은 글자가 버려지거나 빈 화면이 됐습니다).
  - 글자를 코드 포인트 단위로 흘려 이모지가 반쪽으로 보이지 않습니다.
  - `onComplete` 는 화면이 `text` 끝까지 따라잡을 때마다 한 번 불립니다. `isComplete` 로 즉시 전체를 표시할 때는 부르지 않습니다(종전 의도와 같음).
  - props 이름 · 타입 · 기본값은 바뀌지 않았습니다.

- 0911f1a: TypeScript `moduleResolution: "node"` 에서도 서브패스 타입을 찾도록 `typesVersions` 를 추가했습니다(WI-0053).
  - `@axis-ds/ui-react/avatar` · `@axis-ds/agentic-ui/agent-avatar` 같은 서브패스 import 가 `"moduleResolution": "node"` 인 프로젝트에서 「Cannot find module ... or its corresponding type declarations」(TS2307)로 실패했습니다. tsconfig 없이 시작한 Next 15 앱은 `next build` 때 이 값으로 tsconfig 를 만들기 때문에 타입 단계에서 빌드가 멈췄습니다. 1.5.0 기준 ui-react 30개 · agentic-ui 18개 · tokens 4개(`tailwind` · `json` · `brands` · `brands/ontology/brand.json`) 서브패스가 해당합니다.
  - `typesVersions` 는 `exports` 와 1:1 이고 같은 타입 파일을 가리킵니다. `node16` · `nodenext` · `bundler` 는 종전처럼 `exports` 로 해석되며 결과가 바뀌지 않습니다. 런타임 동작과 `exports` 는 바뀌지 않았습니다.

- Updated dependencies [0911f1a]
  - @axis-ds/tokens@1.5.1
  - @axis-ds/ui-react@1.5.1

## 1.5.0

### Minor Changes

- 4eb8a83: Next.js App Router 서버 컴포넌트에서 바로 쓸 수 있게 `"use client"` 경계를 넣었습니다(WI-0050).
  - 종전(1.2.1 · 1.3.0 · 1.4.0)에는 `"use client"` 를 쓰지 않은 서버 컴포넌트(create-next-app 기본 `page.tsx` · `layout.tsx`)에서 아래 컴포넌트를 쓰면 `next build` 가 실패했습니다. 이제 패키지 안에 클라이언트 경계가 있어 그대로 렌더됩니다.
    - `@axis-ds/ui-react`: `Avatar`(`useState`), `CommandInput` · `CommandList` · `CommandEmpty` · `CommandGroup` · `CommandItem` · `CommandSeparator`(cmdk 점 접근)
    - `@axis-ds/agentic-ui`: `CodeBlock` · `ContextPanel` · `DiffViewer` · `FeedbackButtons` · `SourcePanel` · `StreamingText` · `ToolCallCard`
    - `@axis-ds/theme`: `ThemeProvider`(import 만 해도 `createContext is not a function` 으로 빌드 전체가 멈췄음). 서버 `app/layout.tsx` 에서 바로 써도 됩니다
  - `cn` 과 `*Variants` 7개(`alertVariants` · `avatarVariants` · `badgeVariants` · `buttonVariants` · `progressVariants` · `progressIndicatorVariants` · `toggleVariants`), 합 8개 함수는 지금처럼 서버 컴포넌트에서 호출할 수 있습니다. 루트 배럴과 이 함수들을 담은 파일에는 지시문을 두지 않습니다. `avatarVariants` 는 `Avatar` 컴포넌트와 파일을 나눴고 import 경로 · 이름은 그대로입니다.
  - `@axis-ds/agentic-ui` 에 서브패스 6개를 더했습니다: `./agent-avatar` · `./recovery-banner` · `./source-panel` · `./step-timeline` · `./surface-renderer` · `./thinking-indicator`(종전에는 루트로만 import 할 수 있었음).

  하위 호환: 루트 `.` 와 기존 서브패스의 exports 경로 · 내보내기 이름 · 타입 선언은 바뀌지 않았습니다.

  빌드 산출물 구조 변경: `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 는 번들(공용 `chunk-*.mjs`) 대신 소스 파일 하나가 `dist` 파일 한 벌(`.mjs` · `.js` · `.d.ts` · `.d.mts`)이 되는 모듈 보존 빌드로 바꿨습니다. `dist` 안의 파일 경로를 exports 를 거치지 않고 직접 import 했다면 경로가 달라질 수 있습니다. `@axis-ds/theme` 는 단일 파일 그대로이고 `dist/index.mjs` · `index.js` 앞에 `"use client"` 가 붙습니다.

  서버 컴포넌트에서 `onClick` 같은 함수 prop 을 넘길 수 없는 것은 React Server Components 규칙이라 그대로입니다. 핸들러가 필요하면 그 부분을 `"use client"` 파일로 만듭니다(각 패키지 README 「서버 컴포넌트」 절).

  `@axis-ds/tokens` 는 코드 변경이 없고, linked 4패키지를 같은 버전으로 맞추려고 함께 올립니다(2026-10-20 결정).

### Patch Changes

- Updated dependencies [4eb8a83]
  - @axis-ds/ui-react@1.5.0
  - @axis-ds/tokens@1.5.0

## 1.4.0

### Minor Changes

- 4f578fc: Tailwind CSS 4 프로젝트에서 AXIS 를 import 몇 줄로 연동할 수 있게 했습니다(WI-0044).
  - `@axis-ds/tokens`: Tailwind 4 진입점 `@axis-ds/tokens/css/tailwind4` 를 더했습니다. Tailwind 3 preset(`@axis-ds/tokens/tailwind`)과 같은 매핑(색 24 · radius 3 · 글꼴 3)을 `@theme inline` 으로, `.dark` 클래스 다크 모드를 `@custom-variant dark (&:where(.dark, .dark *))` 로 정의하고, 토큰 변수(`css` · `css/shadcn`)를 base 레이어로 함께 불러옵니다. `@import "tailwindcss";` 뒤에 `@import "@axis-ds/tokens/css/tailwind4";` 한 줄이면 `bg-primary` · `rounded-md` · `font-mono` · `dark:bg-primary` 가 AXIS 변수로 생성되고, `--radius` 와 브랜드 CSS(ontology 등)를 따라갑니다. preset 과 같은 소스에서 빌드 때 만들어집니다.
  - `@axis-ds/ui-react` · `@axis-ds/agentic-ui`: 패키지 빌드 산출물을 가리키는 `@source` 를 담은 `tailwind.css` 를 배포합니다. Tailwind 4 는 `node_modules` 를 스캔하지 않아 컴포넌트 클래스(`bg-[var(--axis-button-bg-default)]` 등)가 생성되지 않았는데, 전역 CSS 에 `@import "@axis-ds/ui-react/tailwind.css";` 한 줄을 더하면 생성됩니다. npm · pnpm 설치 모두 동작합니다.
  - 다크 변형은 Tailwind 4 공식 형태라 Tailwind 3 preset(`.dark` 의 자손에만 적용, 명시도 +1)과 달리 `.dark` 를 붙인 요소 자신에도 적용되고 명시도를 올리지 않습니다.

  Tailwind 3 사용자는 영향이 없습니다. preset 과 기존 CSS 산출물(`variables.css` · `shadcn-compat.css` · 브랜드 CSS · JSON · JS)은 바뀌지 않았고, 새 파일과 exports 항목만 더해졌습니다.

### Patch Changes

- Updated dependencies [4f578fc]
  - @axis-ds/tokens@1.4.0
  - @axis-ds/ui-react@1.4.0

## 1.3.0

### Minor Changes

- 2d403bc: 브랜드 테마 축과 온톨로지 프리셋(WI-0025 M2 · M3): `data-brand`로 테마와 독립된 브랜드 색을 적용하고, 첫 브랜드 `ontology`를 함께 배포
  - tokens: 브랜드 빌드(`dist/css/brands/<brand>.css`, `dist/brands/<brand>/brand.json`, 목록 `dist/brands/index.json`)와 exports `./css/brands/ontology` · `./brands/ontology/brand.json` · `./brands` 추가. 브랜드 미지정 `variables.css`는 1.2.1 변수 249개(`:root` · `.dark` 각각)의 값이 그대로이고 새 변수 11개(`--axis-shadow-sm|lg`, `--axis-card-shadow`, `--axis-plan-card-accent-width`, `--axis-plan-card-reject-hover-text`, 흰 글자 짝 토큰 6개, 기본값은 기존 화면과 같음)만 추가. `--axis-card-shadow-default`는 폐기 예정
  - tokens 브랜드 선택자: 라이트는 같은 속성을 두 번 쓴 `[data-brand="<brand>"][data-brand="<brand>"]`로 명시도 (0,2,0)이라(다크 3종도 (0,2,0)) 기본 `:root` · `.dark`와 앱 `globals.css`의 (0,1,0) 정의보다 높아, 브랜드 CSS import 순서와 상관없이 브랜드 값이 이김(하위 컨테이너 `<div data-brand>`도 지원)
  - theme: `ThemeProvider`에 `defaultBrand` · `brandStorageKey`, `useTheme()`에 `brand` · `setBrand` 추가(`ThemeContextValue` 타입에 필수 멤버 `brand: string | undefined` · `setBrand: (brand: string | undefined) => void`가 늘어, `ThemeContextValue` 타입으로 값을 직접 만드는 경우(테스트 mock 등) `brand` · `setBrand`가 필요. 공개 API 추가로 보고 Breaking change로 분류하지 않음)
  - ui-react: Card · Dialog 그림자가 `--axis-card-shadow` · `--axis-shadow-lg`를 참조(기본 화면 불변, tokens CSS를 로드하지 않으면 그림자 없음), `cn()`이 그림자 변수 클래스를 그림자 그룹으로 병합
  - agentic-ui: 흰 글자 5곳과 PlanCard 색 선 두께를 토큰으로 교체하고, PlanCard 거절 버튼 hover 글자를 `--axis-plan-card-reject-hover-text`로 분리(기본 화면 불변, 기본 브랜드 값은 `status-error`와 같음). CSS가 생성되지 않던 불투명도 수식어 11곳을 고쳐 PlanCard 상태 배지 · 거절 버튼 hover, DiffViewer 줄, FeedbackButtons 선택 상태의 옅은 바탕과 AttachmentCard 오류 테두리가 표시됨(기본 화면 변화)

### Patch Changes

- Updated dependencies [2d403bc]
- Updated dependencies [50bc160]
  - @axis-ds/tokens@1.3.0
  - @axis-ds/ui-react@1.3.0

## 1.2.1

### Patch Changes

- a5aef4f: 토큰 정합(WI-0025 M1): 정의되지 않은 CSS 변수 참조 24종을 정의된 토큰으로 바로잡고, agentic-ui의 primitive 색 직접 참조를 semantic 토큰으로 교체
  - tokens: semantic `interactive.primary`, `status.*`(14), `diff.*`(4), `agent.*`(4), Alert용 `border.info` · `border.warning` · `icon.info` 추가 (기존 토큰 값 변경 없음)
  - ui-react: Alert · Badge · Progress · Checkbox · RadioGroup · Switch · Slider · Textarea · Toggle · Sheet · Popover · DropdownMenu · Command가 정의된 토큰을 참조하도록 수정. 투명하던 바탕이 불투명해지고 7개 컴포넌트에 키보드 포커스 링이 표시됨
  - agentic-ui: 13개 컴포넌트의 상태 · diff · 아바타 색을 semantic 토큰으로 교체 (라이트 · 다크 계산값 변경 없음)
  - theme: 배포된 1.2.0이 tokens를 1.2.0 정확 버전으로 고정하므로 tokens 1.2.1을 받도록 함께 배포

- WI-0033: 다크 모드에서 component 토큰(button · input · card · badge · dialog) 45개가 `.dark`에 재정의되지 않아 라이트 값이 쓰이던 문제 수정 (changeset 없이 1.2.1에 포함)
  - tokens: component 토큰에 `$extensions.axis.dark`(다크 값 31개) · `$extensions.axis.themeIndependent`(테마 무관 14개) 선언, 다크 빌드가 component 토큰을 다크 값으로 출력. 다크 값이 바뀌는 변수 29개. WI-0033 은 라이트 출력을 바꾸지 않음(M1 반영 빌드 3b52976 대비 `:root` 블록과 나머지 산출물 9개 sha256 일치)
  - ui-react: 다크에서 Card · Dialog 바탕이 흰색으로 남던 문제(제목 대비 1.10:1 → 18.30:1), Button ghost · secondary, Input · Select 트리거, Badge가 다크 톤으로 표시됨. 채움 버튼(primary · destructive)은 변경 없음
  - agentic-ui: ApprovalCard · PlanCard secondary 버튼 글자가 다크에서 보이지 않던 문제 해소(1.00:1 → 16.12:1)
  - 검사: `check-token-refs`에 `:root` · `.dark` 이름 집합 동일 판정, 다크 값 미반영 판정(다크 값이 라이트와 달라야 하는 component 토큰의 `.dark` 값이 `:root`와 같으면 실패), component 색 토큰 테마 선언 판정 추가, 토큰 빌드도 선언 누락 시 실패

- Updated dependencies [a5aef4f]
  - @axis-ds/tokens@1.2.1
  - @axis-ds/ui-react@1.2.1

## 1.2.0

### Patch Changes

- Updated dependencies [8c36953]
  - @axis-ds/tokens@1.2.0
  - @axis-ds/ui-react@1.2.0

## 1.1.3

### Patch Changes

- Updated dependencies [bdbd1ad]
  - @axis-ds/tokens@1.1.3
  - @axis-ds/ui-react@1.1.3

## 1.1.0

### Minor Changes

- dc711a8: 외부 프로젝트 연동을 위한 패키지 설정 개선
  - @axis-ds/tokens: Dark mode CSS Variables 빌드 추가, shadcn 호환 CSS Variables (shadcn-compat.css) 생성, Tailwind CSS preset 추가
  - 전체 패키지: sideEffects 필드 추가, README 개선
  - examples/nextjs-app: 외부 프로젝트 연동 예제 추가

### Patch Changes

- Updated dependencies [dc711a8]
  - @axis-ds/tokens@1.1.0
  - @axis-ds/ui-react@1.1.0
