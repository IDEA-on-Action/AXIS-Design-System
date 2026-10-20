# WI-0044 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-20 | 브랜치: `feat/wi-0044-tailwind4` | 환경: Node 20, tailwindcss · `@tailwindcss/cli` · `@tailwindcss/postcss` 4.3.3, Playwright chromium 1.61.1
> 범례: 통과 / 실패 / **미측정**(이 문서 작성 시점까지 실행하지 않음). 결과는 구현 단계별 실행 기록이며 통합 브랜치에서 다시 돌린 값이 아닙니다.

## 1. 패키지 단위 품질 게이트

| # | 대상 | 명령 | 결과 |
|---|---|---|---|
| G1 | `@axis-ds/tokens` | `build` · `lint` · `type-check` · `test` | rc 0. 테스트 235개 통과(새 `test/tailwind4.test.mjs` 14개 포함) |
| G2 | `@axis-ds/ui-react` | `build` · `test` · `type-check` · `lint` · `check-exports` | rc 0. 테스트 110개 통과, exports 32항목 일치, build 전후 `package.json` sha 동일 |
| G3 | `@axis-ds/agentic-ui` | `build` · `test` · `type-check` · `lint` | rc 0. 테스트 72개 통과 |
| G4 | `@axis-ds/cli` | `build` · `test` · `tsc --noEmit` | 테스트 257 → 274개 통과(보정 뒤 288, 6절 F9 · 보정 2차 뒤 319, 7절 S12). `tsc` 오류 20건은 변경 전후 같은 수(기존 `library/*` · `template-apply.ts`) |
| G5 | `@axis-ds/mcp` | `build` · `test` · `tsc --noEmit` | 테스트 27 → 29개 통과(보정 뒤 33, 6절 F9 · 보정 2차 뒤 39, 7절 S12), `tsc` 오류 0 |
| G6 | 루트 | `pnpm pack-smoke` | rc 0, 6개 패키지 통과(검사 5번: tarball 의 `dist/css/tailwind4.css` · 두 `tailwind.css` 포함과 `@source` 경로 실재) |
| G7 | `apps/web` | `pnpm type-check` · `pnpm lint` | rc 0 · rc 0(`/docs` 안내 텍스트 변경 뒤). 양성 대조: `docs/page.tsx` 에 타입 오류 한 줄을 넣으면 `tsc` rc 2, 복원 후 sha256 일치 |
| G8 | `.changeset` | `pnpm exec changeset status --verbose` | rc 0. minor: tokens · ui-react · agentic-ui · theme 1.4.0(theme 는 linked 로 함께), cli 1.4.0. patch: mcp 1.2.2 |
| G9 | 루트 | `pnpm exec turbo run type-check|lint|build|test --force` | **미측정** (AC6) |
| G10 | `apps/web` | `pnpm build:web` | **미측정** (다음 단계) |

## 2. FR-1 토큰 진입점 (AC2 · AC3 · AC5)

| # | 내용 | 결과 |
|---|---|---|
| T1 | 생성기와 다른 코드로 preset 을 펼쳐 `@theme inline` 파싱 결과와 키 집합 · 값 대조 | 통과 |
| T2 | 개수 색 24 · radius 3 · 글꼴 3, 대표값, dark 변형, import 2줄 · `layer(base)` | 통과 |
| T3 | 모르는 항목 throw 4종(extend 새 키 · 다른 dark 전략 · extend 밖 키 · 문자열 아닌 값) | 통과 |
| T4 | 패키지 사본에서 `build-tokens.mjs` 실행 → 산출물 일치, import 대상 파일 존재, exports | 통과 |
| T5 | 생성기 변이 5종(chart 누락 · DEFAULT 이름 규칙 · dark 변형 삭제 · 모르는 키 무시 · layer 제거) | 5종 모두 rc 1(각 3 · 2 · 1 · 1 · 1 실패), 복원 후 sha 일치 |
| T6 | AC3: 기존 dist 13개(variables · shadcn-compat · brands/ontology CSS · brands json · js · preset) sha256 변경 전후 | 일치(diff rc 0). 한 바이트 바꾼 사본은 diff rc 1 |
| T7 | Tailwind 4 CLI 출력(진입점 있음) | `bg-primary` → `hsl(var(--primary))`, `rounded-md` → `calc(var(--radius) - 2px)`, `rounded-lg` → `var(--radius)`, `font-mono` → `var(--axis-font-family-mono, …)`, `dark:bg-primary` → `:where(.dark, .dark *)` |
| T8 | 음성 대조(진입점 없음) | `bg-primary` · `bg-chart-3` · `dark:bg-primary` 0건, `rounded-md` 는 `var(--radius-md)`. 같은 빌드에서 `border-red-500` 생성(스캔 수행 확인) |
| T9 | 브라우저 계산값(정적 HTML, chromium) | `bg-primary` rgb(17,24,39), radius 6px, `--radius:1rem` 프로브 14px(진입점 없음 6px), `.dark` 안 배경 rgb(243,244,246)(진입점 없음 투명) |
| T10 | ontology 브랜드를 진입점 뒤에 import | `rounded-lg` 12px · `rounded-md` 10px, `font-mono` 가 "JetBrains Mono" 로 시작 |
| T11 | 한 줄 import 결정 근거: tarball 을 npm 으로 설치해 CLI · `@tailwindcss/postcss` 로 컴파일 | 둘 다 rc 0, node_modules 안 상대 `@import` 해석, 토큰 변수가 `@layer base` 안 |
| T12 | `layer(base)` 필요성: `css/shadcn` 을 레이어 없이 import | `border-red-500` 이 rgb(229,231,235) 로 짐. 진입점(`layer(base)`)에서는 oklch(0.637 0.237 25.331) 적용, 색 미지정 `border` 는 AXIS `--border` |
| T13 | D5 dark 변형 의미 | `class="dark dark:bg-primary"` 요소 자신에도 적용(Tailwind 3 `:is(.dark *)` 와 다름, 문서화) |

## 3. FR-2 패키지 `tailwind.css` (D2 · AC5)

| # | 내용 | 결과 |
|---|---|---|
| P1 | D2 전제: `@import "tailwindcss"; @import "@axis-ds/ui-react/tailwind.css";` 만으로 `.bg-[var(--axis-button-bg-default)]` 생성(npm 실디렉터리 · pnpm 심볼릭 링크 × CLI · postcss) | 1건 생성. agentic-ui `bg-[var(--axis-agent-avatar-assistant)]` 도 1건 |
| P2 | 음성 대조: import 없음 | 두 클래스 0건 |
| P3 | 양성 대조: 직접 `@source "./node_modules/.../dist"` 1건, `"../node_modules/..."` 0건 | 상대 경로가 CSS 파일 기준임을 확인 |
| P4 | 계측 대조군 | 모든 케이스에서 앱 쪽 `border-red-500` 생성 |
| P5 | workspace 링크 모양 | 1건 |
| P6 | 변이: 설치본 `tailwind.css` 에서 `@source` 삭제 | 0건 |
| P7 | `@import "tailwindcss"` 없는 별도 CSS 에서 import | 0건(유틸리티 출력 없음, 문서에 같은 파일에서 import 하라고 적음) |
| P8 | `sync-exports` 구판 대조 | 구판은 갱신 시 `./tailwind.css` export 를 지우고 `--check` rc 1, 신판은 유지 · rc 0 |
| P9 | `pack-smoke` 변이 3종(files · exports 제외 / `@source` 줄 삭제 / 경로 `./dsit`) | 모두 rc 1, 실패 메시지 정확, 복원 후 `sha256sum -c` OK |

## 4. FR-3 · FR-4 CLI · MCP (AC4 · AC5)

| # | 내용 | 결과 |
|---|---|---|
| C1 | `axis check` Tailwind 4: `@import "tailwindcss"` 없음 → 종전 WARN 문구 | 통과 |
| C2 | 있음 + 토큰 진입점 없음 → WARN `Tailwind 4: <css>에 AXIS 토큰 진입점이 없습니다 → @import "@axis-ds/tokens/css/tailwind4";` | 통과 |
| C3 | 둘 다 있음 → PASS, 블록 주석 제거 · 작은따옴표 · `url()` · `layer()` 표기, `css` · `css/shadcn` · `tailwind` 는 진입점 아님 | 통과 |
| C4 | MCP 코어 사본 sha256 이 CLI 원본과 같음(e7cc6705…), MCP 같은 문구 | 통과 |
| C5 | Tailwind 3 경로 · T4-1 기준선 6개 프로젝트 출력 불변 | 통과 |
| C6 | `axis init` Tailwind 4: 제목 · import 2줄 · 선언된 패키지별 `tailwind.css` 줄(없으면 예시 1줄) · 이름 충돌 주의 · tokens 설치 명령(lockfile 별) | 통과 |
| C7 | `axis init` Tailwind 4: `axis.config.json` 에 `tailwindConfig` 없음, 대화형 질문 건너뜀 | 통과 |
| C8 | `axis init` Tailwind 3 · 판정 불가 출력 불변, Tailwind 3 전체 출력 고정 테스트 | 통과 |
| C9 | 빌드한 `dist/index.js` 를 scratch 프로젝트에서 실행(Tailwind 4.3.3 설치본) | init 안내 출력, config 에 `tailwindConfig` 없음. check: 진입점 없음 WARN(rc 0), 있음 PASS. Tailwind 3 은 종전과 같음 |
| C10 | WI-0042 기존 테스트 5건(CLI 4 · MCP 1) | `@import "tailwindcss"` 만으로 pass 를 기대하던 fixture 에 진입점 줄 추가(FR-4 동작 변경 반영) |

## 5. FR-5 문서 내용 근거 실측 (2026-10-20, 정적 HTML · chromium)

문서에 적은 주의 문장을 tokens 단계 tarball 을 설치한 scratch 프로젝트에서 Tailwind 4.3.3 CLI 로 컴파일해 확인했습니다.

| # | 내용 | 진입점 있음 | 진입점 없음 / 대조 |
|---|---|---|---|
| D1 | 색 미지정 `ring-2` | 링 색 = 글자색(rgb(220,38,38)), CSS `var(--tw-ring-color, currentcolor)` | 같음 |
| D2 | 색 미지정 `border-t` | rgb(229,231,235)(AXIS `--border`) | rgb(220,38,38)(currentColor) |
| D3 | create-next-app 기본 블록(`:root` · `@theme inline` · `@media` · `body`)을 진입점 뒤에 남김 | `.dark` 안 `bg-background` 투명, `font-mono` · `font-sans` · body 글꼴 Arial, `:root --background` = `#ffffff` | 블록 삭제 시 `.dark` 안 `bg-background` rgb(3,7,17), `font-mono` ui-monospace…, `font-sans` "Pretendard Variable"…, `--background` = `0 0% 100%` |
| D4 | 앱 `@theme inline` 확장 예시(`--color-surface` · `--color-surface-brand` · `--color-success` · `--radius-xl`) | `bg-surface` · `bg-surface-brand` · `text-success` · `rounded-xl` 이 각 AXIS 변수로 생성, `bg-primary` 유지 | - |
| D5 | 애니메이션 클래스 사용처 | `animate-in` · `animate-out` 을 쓰는 컴포넌트 7개(ui-react dialog · sheet · popover · select · dropdown-menu · tooltip · toast), preset 과 진입점에 애니메이션 정의 없음 | - |

## 6. 보정 (2026-10-20 사용자 결정 3건 + 문서)

결정: ① globals.css 오탐을 이번에 고침 ② init 충돌 문구를 `@theme inline` · `@media` 두 블록까지 넓힘 ③ 1.4.0 미만 선언에 업그레이드 명령 안내. 판정 로직은 공유 코어(`tailwind-core.ts`, MCP 사본 바이트 동일)에 두었습니다.

| # | 내용 | 결과 |
|---|---|---|
| F1 | globals.css: tokens CSS import(`css` · `css/shadcn` · `css/tailwind4` × 큰 · 작은따옴표 · `url()` · `url() layer()` · `layer()` 15조합)만 있으면 pass, 문구 `<css>에 AXIS CSS 변수가 있습니다 (<경로> import)` | 통과(CLI). MCP 는 `css/tailwind4` · `css/shadcn` 작은따옴표 `url() layer()` 2건 같은 문구로 통과 |
| F2 | globals.css: 블록 주석 안만 있음 → 종전 warn, `brands/ontology` · `tailwind` · `css/shadcn-compat` → warn, 변수 직접 정의(import 함께 있어도) → 종전 pass 문구, 처음 찾은 CSS 하나만 봄 | 통과(CLI · MCP) |
| F3 | 기준선 불변: T4-1 6개 프로젝트 · MCP 기준선 테스트 | 통과(그 fixture 에는 tokens import 없음). 기대값이 바뀐 기존 테스트는 1건: WI-0044 의 `runCheck 는 개수를 돌려줌`(진입점 import 로 globals.css 도 pass, 1 pass / 3 warn → 2 pass / 2 warn) |
| F4 | init 충돌 문구: `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 블록과 겹치는 이름 5개 · 「지우세요」 | 통과. quick-start 「Tailwind CSS 4」 절의 지울 블록 코드에서 최상위 블록 머리 4개와 이름 5개를 읽어 init 문구와 대조하는 테스트 추가 |
| F5 | init 업그레이드: tokens `^1.3.0` → `! Tailwind 4 진입점은 1.4.0 부터 있습니다. 선언(...)을 올리세요: <add 명령>`(lockfile 3종), ui-react `~1.3.2` · agentic-ui `1.3.0` → 한 명령, `^1.4.0` · `>=1.4` · `~1.5.0` · `1.4.0` · `>1.3` · `1.4.0 - 1.9.0` → 없음, 판정 불가 · 1.4.0 미만 하한(`catalog:` · `workspace:*` · `latest` · `^1 \|\| ^2` · `^1.4.0-beta.1` · `>1.3.9` · `<2` · `1.x`) → 안내, 선언 없음 → 기존 설치 안내만 | 통과 |
| F6 | check 진입점 WARN: tokens `^1.3.0` → 끝에 ` (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)`, `^1.4.0` · 선언 없음 → 붙지 않음, `catalog:` · ui-react `1.3.1` → 붙음, 진입점이 있으면 pass 문구 그대로 | 통과(CLI · MCP 같은 문구) |
| F7 | 변이 음성 대조 ①: 코어의 import 인정 끄기(`findTokensCssImport` 결과를 `undefined` 로, 두 사본 같게) | CLI rc 1(2건 실패) · MCP rc 1(2건 실패). 원복 후 `sha256sum -c` OK |
| F8 | 변이 음성 대조 ②: 버전 조건 끄기(`axisPackagesBelowTailwind4` 가 항상 빈 목록) | CLI rc 1(5건 실패: check 2 · init 3) · MCP rc 1(1건 실패). 원복 후 `sha256sum -c` OK |
| F9 | 품질 게이트 | cli: `pnpm test` 274 → 288개 통과, `pnpm build` rc 0, `tsc --noEmit` 오류 20건(변경 전 목록과 diff 0). mcp: `pnpm test` 29 → 33개 통과, `pnpm build` rc 0, `tsc` 오류 0. 두 코어 `cmp` 동일 |
| F10 | 빌드한 cli `dist/index.js` 를 scratch(Tailwind `^4` 선언 · tokens `^1.3.0` · package-lock)에서 실행 | init: 넓힌 충돌 문구와 `npm install "@axis-ds/tokens@^1.4.0"` 업그레이드 줄. check: 진입점 WARN 에 `(1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)`, `:root{--background}` 만 있으면 globals.css warn. 진입점 import 로 바꾸면 5 pass / 0 warn, globals.css `(@axis-ds/tokens/css/tailwind4 import)` |
| B1 | Tailwind 3 preset 의 색 미지정 테두리: tailwindcss 3.4.19 CLI 로 preset + `@tailwind base` 컴파일 | preflight `border-color: #e5e7eb`(gray-200), 다크용 재정의 없음 |
| B2 | AXIS `--border` 값(dist CSS 의 HSL 을 RGB 로 환산, 브라우저 계산값 아님) | 기본 라이트 `220 13% 91%` = rgb(229,231,235)(gray-200 과 같음, testplan D2 브라우저값과 일치), 다크 `215 28% 17%` = rgb(31,41,55), ontology 라이트 rgb(230,232,235) · 다크 rgb(43,47,53) |

보정 미측정: 빌드한 MCP 서버(`dist/index.js`, 번들)를 stdio 로 실행한 `axis.check_project` 결과(소스 테스트로만 확인). 다크 · ontology 테두리색의 브라우저 계산값(B2 는 CSS 값 환산).

## 7. 보정 2차 (2026-10-20 사용자 결정 7건: A1 ~ A4 · B1 ~ B3 · C)

판정 로직은 모두 공유 코어(`tailwind-core.ts`, MCP 사본 바이트 동일, sha256 98173ce4…)에 있습니다. 테스트는 CLI `template-check.test.ts` 「WI-0044 보정 2차」 절과 `init.test.ts`, MCP `template.test.ts` 「보정 2차」 절입니다.

결정한 규칙:
- A1 버전 조건(`axisPackagesBelowTailwind4` 가 `below` · `unknown` 으로 나눔, init · check 공용): 하한 1.4.0 미만 → 올리기(init 명령 · check `(1.4.0 이상 필요: …)`), 하한을 읽을 수 없음 → 확인(`설치된 버전이 1.4.0 이상인지 확인하세요`), `workspace:` → 대상 아님.
- C 합치기: Tailwind 4 이고 `@import "tailwindcss"` 가 있을 때 문제를 ① 토큰 진입점 없음 ② 선언된 컴포넌트 `tailwind.css` 없음(B1) ③ 진입점이 있는데 create-next-app 기본 정의(B2) ④ 진입점이 있는데 tokens 버전 조건(A4) 순서로 모아 ` / ` 로 잇고, 버전 안내는 끝에 한 번(`below` 다음 `unknown`). 문제가 하나면 그 문구만 나옵니다. `@import "tailwindcss"` 가 없으면 종전 WARN 하나만.
- B2 위치: tailwind 항목. 조건(Tailwind 4 · 진입점 있음)을 이 항목만 알고, globals.css 항목은 Tailwind 3 과 공용인 변수 정의 판정이라 의미 · 기준선을 바꾸지 않으려는 것입니다.
- B3: `.ts` 의 종전 기준(`--background` · `hsl(var(`)이 먼저이고, 그 다음 preset 참조(주석 제외)면 `(@axis-ds/tokens/tailwind preset)` 을 붙인 PASS. `.js` · `.mjs` · `.cjs` 도 읽어 preset 참조면 PASS, 아니면 종전 WARN.

| # | 내용 | 결과 |
|---|---|---|
| S1 | A3: `rangeLowerAtLeast` 직접 17개(`1.3.0 - 1.5.0` false · `1.4.0 - 1.3.0` true(왼쪽만) · `>=1.2 >=1.4` · `>=1.4 >=1.2` true · `>=1.2 <1.9` false · `>1.3` true · `>1.3.9` false · `^1.4.0-beta.1` false · `<2` · `*` · `catalog:` · `latest` · `\|\|` · `workspace:*` undefined 등) | 통과 |
| S2 | A3: `axisPackagesBelowTailwind4` 직접(below · unknown · workspace 제외 · 선언 순서 · devDependencies · pkg 없음), check 문구 `1.3.0 - 1.5.0` 안내 있음 · `>=1.2 >=1.4` 안내 없음 | 통과 |
| S3 | A1 check: `catalog:` · `latest` · `^1 \|\| ^2` · `<2` → 확인 문구, `workspace:*` · `workspace:^1.3.0` → 안내 없음. A1 init: 미만 4종 → 올리기 명령, 판정 불가 5종 → 확인 줄(명령 없음), workspace 2종 → 줄 없음, 섞이면 올리기 줄 다음 확인 줄 | 통과 |
| S4 | A4: 진입점 + tokens `^1.3.0` → WARN `AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: …)`(종전 PASS 를 기대하던 테스트 1건을 WARN 으로 바꿈), `catalog:` → 확인 문구, `^1.4.0` · `workspace:*` · 선언 없음 → PASS, import 가 있는 ui-react 1.3.0 은 A4 대상 아님 | 통과 |
| S5 | B1: 선언 + import 없음 → 빠진 줄, 둘 중 하나만 → 빠진 쪽, 둘 다 → 선언 순서 두 줄, 작은따옴표 · `url()` · `layer()` 인정, 주석 안 · `tailwind.cs` 는 없음, 선언 없음 → 요구 안 함 | 통과 |
| S6 | B2: fixture `test/fixtures/check/create-next-app-15.5.28-globals.css`(scratch 에서 `npx create-next-app@15.5.28 base --yes --use-npm --skip-install` 로 만든 실물, sha256 769edf77…)에 진입점 한 줄 → 특징 4종 모두 표시, 진입점 없음 → 진입점 WARN 만, 특징 하나씩 4건 → 그 이름만 | 통과 |
| S7 | B2 오탐 음성 대조: 문서 권장형 · HSL 삼중값 재정의 · `hsl(var(--background))` · `--sidebar-background: #fff` 류 다른 이름 · 기본 globals.css 전체를 블록 주석으로 감쌈 → PASS. globals.css 항목은 진입점 import 로 계속 PASS | 통과 |
| S8 | B3: `.ts` 의 `import from` · `require('…')` · `import()` → preset PASS, `.js` · `.mjs` · `.cjs` 의 preset 참조 → PASS · 없으면 종전 WARN, `//` · `/* */` 주석 안 · `tailwind-preset` · `css/tailwind4` → 종전 WARN, 문자열 속 `https://` 뒤 참조 → PASS, `hsl(var(` 가 있으면 종전 문구, Tailwind 4 는 설정 파일을 보지 않음 | 통과 |
| S9 | B3 기준선: T4-1 6개 프로젝트 · MCP 기준선 테스트 그대로 통과. 기준선 fixture 에서 tailwind.config 를 만드는 것은 theme-only(`apps/web/public/templates/theme-only.json` 의 `tailwind.config.ts`, `hsl(var(` 포함 · preset 참조 없음)와 allPass(`hsl(var(--x))`)뿐이라 종전 분기로 판정됨을 읽어 확인 | 통과 |
| S10 | C: 진입점 없음 + 컴포넌트 + 미만 2개 → `… / … (1.4.0 이상 필요: tokens · ui-react)`, 진입점 있음 + 컴포넌트 + B2 + tokens `~1.3.2` + agentic-ui `catalog:` → 문제 3개 순서 + 버전 안내 2개, ui-react 버전만 걸리면 PASS · 다른 문제가 있으면 끝에 안내, `@import "tailwindcss"` 없음은 합치지 않음. MCP 에서 A1 · A4 · B1 · B2 · B3 · C 6건 같은 문자열 | 통과 |
| S11 | 변이 음성 대조(두 사본 같게 바꾸고 CLI · MCP 전체 테스트): A4 끄기 · B1 끄기 · B2 끄기 · B3 끄기 | A4: CLI rc 1(3건) · MCP rc 1(1건). B1: CLI rc 1(7건) · MCP rc 1(2건). B2: CLI rc 1(4건) · MCP rc 1(1건). B3: CLI rc 1(3건) · MCP rc 1(1건). 매회 원복 후 `sha256sum -c` OK |
| S12 | 품질 게이트 | cli: `pnpm test` 288 → 319개 통과(12파일), `pnpm build` rc 0, `tsc --noEmit` 오류 20건(이전 목록과 diff rc 0, 새 테스트의 타입 오류 1건을 고친 뒤). mcp: `pnpm test` 33 → 39개 통과, `pnpm build` rc 0, `tsc` 오류 0. 두 코어 `cmp` 동일 |
| S13 | 빌드한 cli `dist/index.js` 로 create-next-app@15.5.28 기반 scratch 세 프로젝트에 `init -y` 뒤 `check`(설치는 하지 않음, Tailwind 는 선언 `^4` 로 판정, lockfile 없음이라 설치 명령은 pnpm) | 아래 표 |

S13 결과:

| 프로젝트 | `axis init` 의 Tailwind 4 안내 | `axis check` |
|---|---|---|
| p1 기본 그대로 | import 2줄 · 예시 줄 · 충돌 주의 · `pnpm add "@axis-ds/tokens@^1.4.0"`, config 에 `tailwindConfig` 없음 | 3 pass / 2 warn / 0 fail(rc 0). tailwind: `AXIS 토큰 진입점이 없습니다 → …`(B2 는 진입점이 없어 붙지 않음), globals.css: `AXIS CSS 변수가 없습니다` |
| p2 문서 권장형(진입점 · ui-react `tailwind.css`, tokens · ui-react `^1.4.0`) | import 3줄 · 충돌 주의, 버전 줄 없음 | 5 pass / 0 warn / 0 fail(rc 0) |
| p3 tokens `1.3.0` 선언형(진입점만, 기본 블록 지움) | 올리기 줄 `선언(@axis-ds/tokens 1.3.0)을 올리세요: pnpm add "@axis-ds/tokens@^1.4.0"` | 4 pass / 1 warn / 0 fail. tailwind: `AXIS 토큰 진입점이 있지만 @axis-ds/tokens 버전 확인이 필요합니다 (1.4.0 이상 필요: @axis-ds/tokens 1.3.0)` |
| p4 기본 그대로 + 진입점 한 줄(init 없이 check) | - | tailwind: `create-next-app 기본 정의가 남아 있습니다(특징 4종) → 지우세요`, globals.css PASS(import), axis.config.json 없음 FAIL(rc 1) |

- 계측 메모: dist 에서 한글 문구를 grep 하면 0건이었습니다. tsup 이 한글을 `\uXXXX` 로 escape 하기 때문이고(escape 된 문자열로는 잡힘), p3 · p4 출력에 새 문구가 실제로 나와 dist 가 새 코어로 빌드됐음을 확인했습니다.
- 관찰(범위 밖): `axis init -y` 의 기본 `globalCss` 는 `./src/app/globals.css` 라 create-next-app 15.5 기본(`app/globals.css`, `src` 없음)과 다릅니다. 안내 제목에 없는 경로가 나오지만 check 는 후보 탐색으로 `app/globals.css` 를 봅니다. 이번 보정에서는 고치지 않았습니다.

보정 2차 미측정: 빌드한 MCP 서버(stdio)의 `axis.check_project` 실행(소스 테스트로만 확인), Tailwind 3 실앱에서 preset 참조 PASS(소스 테스트로만 확인), 의존성을 설치한 상태(설치본 판정 경로)의 S13.

## 8. 미측정 (AC 판정 전에 필요)

| 항목 | 상태 |
|---|---|
| AC1: create-next-app 15.5.28 실앱(Next 빌드)에서 3줄 import 만으로 Button `#3B82F6` · 앱 `bg-primary` 가 Tailwind 3 대조군과 같은지(Playwright) | **미측정** (verify 단계) |
| AC2: 실앱에서 `--radius:1rem` 프로브 · ontology radius 12/10/8px · JetBrains Mono | 정적 HTML 로만 측정(T9 · T10), 실앱 **미측정**. `rounded-sm` 8px 는 **미측정** |
| AC4: 실앱에서 cli · mcp 출력(MCP 실행) | CLI 는 scratch(C9), MCP 실행 **미측정** |
| AC6: `turbo run … --force` 전체 | **미측정** |
| 다크 모드 실앱(ThemeProvider), hover · focus 상태 | **미측정** |
| Next 16 · turbopack | **미측정** |
| agentic-ui 실앱 렌더 | **미측정** (스캔 규칙 생성만 P1 에서 확인) |
