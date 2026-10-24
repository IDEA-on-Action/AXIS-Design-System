# WI-0070: cli check · theme add 판정 정확도 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0070 | GitHub: #189 | 우선순위: P2 | 상태: Approved (2026-10-25 사용자 결정: 권장안 + 템플릿 4종 WARN 수용 + 검토 지적 반영)
> 기준: `main` 778e1dd (cli 1.6.0 · mcp 1.3.3 배포됨) | 묶음: 배치 3 ① (WI-0051 · 0068 · 0070 · 0072)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (배치 3 브리프 실측, cli 1.6.0 · MCP 1.3.3)

1. animation 거짓 PASS: `import animate from "tailwindcss-animate"` + `plugins: []`, 주석 밖의 무관한 문자열 `"tailwindcss-animate"` + `plugins: []` 가 모두 PASS. 판정이 설정 파일 전체의 문자열과 선언만 봄. 「미설치」 문구도 실제로는 선언 기준
2. globals.css 거짓 PASS: 자체 `--background` · `--primary` 만 있어도 「AXIS CSS 변수가 정의되어 있습니다」. 템플릿 4종(`--axis-` 0건)이 모두 해당
3. `theme add` 재실행: 브랜드 줄 뒤에 들어간 컴포넌트 `tailwind.css` 를 「기본 토큰 CSS, 브랜드 앞」으로 출력(ui-react 1.6.2 `tailwind.css` 는 `@source "./dist";` 한 줄이라 cascade 영향은 없고 문구만 틀림)
4. Tailwind 3 body 글꼴: create-next-app 형태 `body { font-family: Arial, ... }` 가 Pretendard 를 덮음(이슈 본문 브라우저 실측). 가이드 4절 Tailwind 3 체크리스트와 check 에 안내 없음
5. (이슈 코멘트) Tailwind 3 CLI 의 postcss-import 가 `exports` 하위 경로를 풀지 못해 `@import "@axis-ds/tokens/css"` 가 `Failed to find` 로 실패

### 1.2 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 | animation(Tailwind 3)은 `plugins` 배열 안의 `require("tailwindcss-animate")` 나 그 패키지를 받은 식별자로 판정. 배열을 다 읽지 못하면(펼침 · 단축 속성 · 변수) 「확인하지 못함」 WARN | 권장안 |
| D2 | animation 「미설치」는 설치본으로 본다(registry-core `findInstalledPackage`, Plug'n'Play 는 선언 기준). 선언 없음은 「선언 없음」 | 브리프 지적(문구가 선언 기준) |
| D3 | globals.css 는 AXIS 근거가 있을 때만 PASS: CSS 의 tokens CSS import · `--axis-*` 정의 · **루트 레이아웃 JS 의 `@axis-ds/tokens/css` import** | 권장안 + 검토 major(가이드의 JS import 구성이 거짓 WARN 이 되는 것을 막음). 레이아웃 후보는 brand.activation 과 같은 목록(`ROOT_LAYOUT_FILES`, registry-core 로 옮김) |
| D4 | 자체 변수만 있으면 「자체 CSS 변수만 있고 AXIS 토큰이 없습니다」 WARN 으로 「아무것도 없음」 WARN 과 구분 | 검토 major |
| D5 | 템플릿 4종(자체 HSL)이 WI-0067 전까지 globals.css WARN 이 되는 것을 수용 | 사용자 결정(2026-10-25). WARN 이라 종료 코드 불변 |
| D6 | `theme add` 는 삽입 위치를 바꾸지 않고 출력 문구만 실제 위치 · 분류대로: 컴포넌트 `tailwind.css` 는 「컴포넌트 스캔 경로, 위치 무관」, 기본 토큰 CSS 는 실제로 브랜드 줄 앞일 때만 「브랜드 앞」, 뒤면 옮기라는 경고 | 권장안. 위치를 바꾸는 것은 효과 없는 변경. 기본 토큰 CSS 가 브랜드 뒤에 들어가는 경우(브랜드 줄만 손으로 넣어 둔 파일)는 cascade 가 실제로 틀리므로 경고를 더함 |
| D7 | create-next-app 기본 정의 검출에 body `font-family: Arial` 을 더한다. Tailwind 4 는 tailwind.config 항목 B2 에, Tailwind 3 은 globals.css 항목(PASS 조건을 채워도 WARN)에 낸다 | 권장안. 가이드 4절 Tailwind 3 체크리스트와 quick-start 에 제거 안내 |
| D8 | postcss-import(Tailwind 3 CLI · Vite) 사용자 안내: 앱 진입점 JS import 또는 실제 파일 경로(`dist/css/variables.css` · `dist/css/shadcn-compat.css`). tokens exports 는 바꾸지 않는다 | 이슈 코멘트 범위(가이드 보강). exports 변경은 ② 와 겹치고 공개 진입점이 늘어나므로 이번에는 안내만 |

### 1.3 범위 밖

- 템플릿 4종의 토큰 전환(WI-0067).
- check 가 Tailwind 를 실행해 빌드 CSS 를 보는 방식(브리프 선택지 「빌드 CSS 확인」, 느리고 환경 의존).

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | animation plugins 배열 판독 · 설치본 기준 | AC1: 9형태 + 미설치 + 양성 대조(선언 없음 WARN) 단위 테스트, cli · mcp 같은 문구 |
| FR-2 | globals.css AXIS 근거 · 레이아웃 JS import · 자체 변수만 WARN | AC2: 단위 테스트(쓰기만 하는 `var(--axis-*)` 음성 대조 포함), T4-1 기준선 의도 변경 기록 |
| FR-3 | theme add 문구 | AC3: 재실행 시나리오 · 기본 토큰 CSS 가 브랜드 뒤인 시나리오 |
| FR-4 | body font-family Arial | AC4: Tailwind 3 globals WARN · Tailwind 4 B2 표시 · 실물 fixture(create-next-app 15.5.28) B2 문구 |
| FR-5 | postcss-import 안내 | AC5: Tailwind 3.4.19 CLI 로 실패 · 우회 2가지 실측(testplan 3) |
