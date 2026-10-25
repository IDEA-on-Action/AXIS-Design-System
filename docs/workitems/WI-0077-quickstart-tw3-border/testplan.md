# WI-0077: Tailwind 3 기본 테두리색 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` 3b5ed0f + 브랜치 `fix/batch6`(59c354c 위)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 측정 환경 (전제)

- 측정 디렉터리: 세션 scratchpad `w6impl/WI-0077`. `HOME` · `XDG_CONFIG_HOME` 을 그 아래 `home/` 으로 격리했고 소비자 env 는 `NEXT_TELEMETRY_DISABLED=1` 하나뿐이에요(동작과 무관).
- 소비자: Next 15.5.28 · React 19.2.3 · tailwindcss 3.4.19 · tailwindcss-animate 1.0.7, `@axis-ds/ui-react` · `theme` · `agentic-ui` 1.8.0(npm). `tailwind.config.ts` 는 quick-start 「Tailwind CSS 3」 예시 그대로(`presets: [axisPreset]`, `theme.extend: {}`).
- 두 벌: `tw3-pub`(npm `@axis-ds/tokens@1.8.0`), `tw3-cand`(이 브랜치 `pnpm pack` tarball, npm `overrides` 로 하위 의존까지 같은 tarball). 두 dist 의 차이는 `tailwind-preset.js` · `.mjs` 둘뿐이에요(`diff -rq`).
- `next build` 뒤 `next start`, Playwright 1.61.1 + Chromium(Chrome for Testing 151, executablePath 지정, 측정 도구 쪽 사정)으로 `<html>` 의 `class` · `data-brand` 를 바꿔 4개 상태를 재요. transition-colors 때문에 상태마다 1초 기다린 뒤 읽어요.
- 기대값: 페이지에 붙인 probe 요소의 `border-color: hsl(var(--border))` 계산값. 탐침은 색 없는 `border` · `border-t` · `hr` 3개라 3 x 4 = 12칸이에요.

## 2. 브라우저 실측 (측정)

| 구성 | tokens | 세 탐침 불일치 | `border-red-500` | `border-border` | 비고 |
|---|---|---|---|---|---|
| V0 quick-start 예시 그대로 | 1.8.0 | **9/12** | 4/4 rgb(239, 68, 68) | 4/4 | 음성 대조. 세 탐침 모두 rgb(229, 231, 235), 기대 다크 (31, 41, 55) · ontology (230, 232, 235) · (43, 47, 53) |
| V0 | 후보 | **0/12** | 4/4 | 4/4 | AC1 · AC2 |
| N0 `tokens/css` 만(shadcn 없음) | 1.8.0 | - | 4/4 | - | 세 탐침 4상태 모두 rgb(229, 231, 235)(`--border` 미정의라 probe 는 검정) |
| N0 | 후보 | - | 4/4 | - | 세 탐침 4상태 모두 rgb(229, 231, 235). 종전과 같고 검정 붕괴 없음(AC3) |
| N0 + 변이(config 에서 DEFAULT 를 fallback 없는 `hsl(var(--border))` 로) | 후보 | - | 4/4 | - | 세 탐침 4상태 모두 rgb(0, 0, 0). fallback 이 필요함을 보여요(AC3 변이) |
| R0 ui-react README 종전 예시(`css/shadcn` 한 줄) | 후보 | 0/12 | 4/4 | 4/4 | `--axis-border-default` 미정의, Input 경계 rgb(17, 24, 39) · 다크 (243, 244, 246)(글자색), Progress 채움 rgba(0, 0, 0, 0). 음성 대조(AC5) |
| R1 ui-react README 새 예시(`tokens/css` + `css/shadcn`) | 후보 | 0/12 | 4/4 | 4/4 | `--axis-border-default` 정의(#E5E7EB · 다크 #1F2937), Input (107, 114, 128), Progress (37, 99, 235) · 다크 (59, 130, 246)(AC5) |

- R0 · R1 은 브랜드 CSS 를 넣지 않아 ontology 상태가 기본과 같은 값이에요(브랜드 줄이 없는 README 예시 그대로).
- axe color-contrast 는 V0 · R0 · R1 에서 0건, N0 다크 2개 상태에서 1건이고 1.8.0 과 후보가 같아요(이 WI 와 무관, 같은 화면에서 tokens 만 다름).

## 3. Tailwind 4 무회귀 (측정 · 계산)

- 후보 `dist/css/tailwind4.css` · `variables.css` · `shadcn-compat.css` · `brands/ontology.css` sha256 이 npm 1.8.0 과 같아요(측정, 예: tailwind4.css 73236368…). 생성기로도 HEAD preset + HEAD 생성기 결과와 새 preset + 새 생성기 결과가 바이트 같았어요(측정).
- 그래서 Tailwind 4 소비자가 받는 CSS 는 1.8.0 과 같고, 브리프의 T0 0/12 가 그대로 성립해요(계산, 브라우저로 다시 재지 않음).

## 4. 단위 테스트 · 변이 (측정)

| 대상 | 결과 |
|---|---|
| `test/tw3-border-default.test.mjs`(새 파일) | 6 통과. Tailwind 3.4.19 로 preset 을 컴파일해 `*, ::before, ::after` 의 border-color 가 `hsl(var(--border, 220 13% 91%))` 하나뿐인지, borderColor 를 뺀 preset 은 `#e5e7eb` 인지(음성 대조), fallback HSL 이 Tailwind `colors.gray[200]` 과 같은 rgb(229, 231, 235)인지(계산기 자기 검사 포함) |
| 수정 전 preset(HEAD)으로 같은 테스트 | rc 1, 2 실패(DEFAULT 단언 · 컴파일 단언) |
| `test/tailwind4.test.mjs` | 24 통과(종전 19 + 5: extend 키 목록 · 건너뛰기 목록이 borderColor 하나 · @theme 에 안 옮김 · `foo` throw · `borderWidth` throw) |
| 변이: 모르는 키를 전부 건너뛰게 | rc 1, 3 실패(spacing · foo · borderWidth) |
| 변이: borderColor 건너뛰기 제거 | rc 1, 12 실패(생성기 throw) |
| 수정 전 생성기 + 새 preset | throw `preset.theme.extend.borderColor: Tailwind 4 진입점 변환을 모르는 키입니다` |

## 5. 문서 정합 (측정)

- 낡은 서술 grep(「Tailwind 3 preset 의 기본 테두리색은 preflight 의 gray-200」 · 「Tailwind 3 preset 은 preflight 의 gray-200」 · 「템플릿 밖은 재지 않음」 · 「브라우저 계산값은 재지 않음」 · 「다크 · 브랜드에서도 gray-200(#e5e7eb)입니다」): HEAD 에서 quick-start 1 · theme-customization 2 · tokens README 1(양성 대조), 수정 후 `docs/guides` · `packages/*/README.md` · `apps/web/src` 0건(grep rc 1, 경로 존재).
- 「`css/shadcn` 한 줄만」 안내는 ui-react README 1곳뿐이었고 고쳤어요. `apps/web/src/app/(docs)/docs/page.tsx` 는 이미 `tokens/css` 와 `css/shadcn` 을 함께 안내해요.
- 템플릿 4종의 `@apply border-border` 블록은 그대로예요.

## 6. 게이트 (측정)

| 단계 | 결과 |
|---|---|
| `turbo lint --force` | rc 0, 7 tasks, Cached 0 (테스트 파일 수정 뒤 tokens 만 다시 `--force`, Cached 0) |
| `turbo type-check --force` | 첫 실행 rc 2(새 테스트의 암묵 any 2건, 새 파일이 검사 대상임을 확인) → 수정 뒤 rc 0, 11 tasks, Cached 0 |
| `turbo build --force` | rc 0, 8 tasks, Cached 0. templates JSON 5개는 `updatedAt` 만 바뀌어 되돌림 |
| `turbo test --force` | rc 0, 7 tasks, Cached 0. tokens 522 통과(새 테스트 포함), cli 778(guidance.test 4 · init.test 147 포함), mcp 166, ui-react 194 + 7, agentic-ui 148, theme 47 |
| frontend.yml run 단계 | check-token-refs · check-contrast-pairs · check-types-versions · check-library-links · build:registry(r/ version 1.8.0 → 1.5.0 되돌림) · test:registry · check-licenses · pack-smoke(퍼블리시 대상 6개) · cli-smoke(비TTY 갈래 10건) · registry-install-smoke(5/5) 모두 rc 0 |
| E2E tokens(`E2E_SERVER=static`, workers 1) | 22 통과. 문서 사이트는 preset 을 쓰지 않고(`apps/web/tailwind.config.ts` 는 keyframes · animation 만 import) apps/web 변경이 없어 다른 E2E 는 해당 없음 |

## 7. 발행 뒤 재측정 (예정)

- 발행본 1.8.1 을 같은 소비자(격리 HOME)에 설치해 V0 0/12 · N0 gray 유지 · R1 을 다시 재요.
