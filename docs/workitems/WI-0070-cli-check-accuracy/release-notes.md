# WI-0070 릴리스 노트: check 가 결과를 보고 판정해요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #189 | 대상: `@axis-ds/cli` · `@axis-ds/mcp` patch

## 바뀐 점

- animation(Tailwind 3): `plugins` 배열 안에 `require("tailwindcss-animate")` 나 그 패키지를 받은 식별자가 있어야 PASS 예요. import 만 있고 `plugins: []` 이거나 설정 어딘가에 같은 문자열만 있으면 WARN 이에요(종전 거짓 PASS). 배열을 정적으로 다 읽지 못하면 「확인하지 못함」 WARN, 「미설치」는 이제 실제 설치본 기준이에요.
- globals.css: AXIS 근거(tokens CSS import · `--axis-*` 정의 · 루트 레이아웃의 `import "@axis-ds/tokens/css"`)가 있을 때만 PASS 예요. 자체 `--background` · `--primary` 만 있으면 「AXIS 토큰이 없습니다」 WARN 이에요. Tailwind 3 에서 create-next-app 기본 `body { font-family: Arial }` 이 남아 있으면 WARN 이에요(Tailwind 4 는 tailwind.config 항목에 표시).
- `theme add` 출력: 컴포넌트 `tailwind.css` 는 「컴포넌트 스캔 경로, 위치 무관」, 기본 토큰 CSS 는 실제로 브랜드 줄 앞에 넣었을 때만 「브랜드 앞」이에요. 뒤에 들어가면 옮기라고 경고해요.
- 가이드: Tailwind 3 체크리스트에 body 글꼴 제거, Tailwind 3 CLI · Vite postcss-import 에서 `@import "@axis-ds/tokens/css"` 가 실패할 때의 우회(진입점 JS import 또는 `dist/css` 경로)를 더했어요.

## 동작이 달라지는 것

- WARN 만 늘어나요. 종료 코드는 그대로예요.
- AXIS 템플릿 4종(자체 HSL 변수)은 WI-0067 에서 토큰으로 바꾸기 전까지 globals.css WARN 이에요(2026-10-25 사용자 결정).

## 발행 전 대조

- Release PR(changesets version-packages)에서 tokens · theme 가 **1.7.0** 인지 확인해요. check 의 수정 버전 상수(`TOKENS_CJS_PRESET_FIXED_VERSION` · `THEME_MARKUP_BRAND_MIN_VERSION`)가 1.7.0 이고, 근거는 이 묶음의 theme changeset 이 minor 라 linked 4패키지가 최고 현재 버전(1.6.3)에서 1.7.0 으로 오른다는 것이에요. 다른 값이면 상수를 고친 뒤 발행해요.
- 이 브랜치의 `pnpm changeset status --verbose`(측정): tokens · theme 1.7.0(minor), linked 라 ui-react · agentic-ui 도 1.7.0(내용 변경 없음), cli 1.6.1 · mcp 1.3.4(patch). 예제 앱 axis-nextjs-example 0.1.14 는 내부 의존 갱신이에요.
