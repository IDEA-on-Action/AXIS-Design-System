# WI-0046: 애니메이션 플러그인 의존 선언 · keyframes 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-24 | 기준: `main` 59dd6a3 + 브랜치 `fix/wi-0046-animation-keyframes`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 단위 테스트

### 1.1 tokens (`node --test`)

| 대상 | 결과 (측정) |
|---|---|
| `pnpm --filter @axis-ds/tokens test` 전체 10파일 | 281 통과 · 0 실패 |
| `test/tailwind4.test.mjs` | 20 통과(종전 14 + 새 6: keyframes 대조 · `--animate-*` 참조 · 변이 4종) |
| 음성 대조: 구판 `tailwind4.test.mjs`(HEAD) 를 신판 코드에 실행 | 3 실패(76 「변환 대상 3종뿐」 · 80 「그 밖의 선언은 없다」 · 91 「색 24 · radius 3 · 글꼴 3」), 11 통과. review 지적 행과 일치 |

새 변이 4종(변환기가 throw 해야 함): animation 이 없는 keyframes 를 가리킴 · 단계 선택자 아님(`start`) · camelCase 속성(`maxHeight`) · 문자열 아닌 값. 넷 다 통과(throw 확인).
keyframes 대조 테스트는 생성기와 다른 코드(테스트 쪽 파서)로 `@keyframes` 를 읽고, 원문의 `^@keyframes ` 개수를 따로 세어 파서가 블록을 놓치지 않았음을 같이 봐요(양성 대조).

### 1.2 ui-react · agentic-ui (vitest)

| 대상 | 결과 (측정) |
|---|---|
| ui-react 전체 | vitest 124 통과(10파일) + `fix-cva-dts.test.mjs` 7 통과 |
| agentic-ui 전체 | 93 통과(9파일) |
| 새 `progress/progress.test.tsx` | 3건: 값 있음(w-full · translateX(-60%)) · 불확정(w-1/3 · w-full 제거 · animate · motion-reduce · duration-[1500ms] · duration-300 제거) · duration 이 토큰 `axisAnimation` 과 같음 |
| 새 `reduced-motion.test.ts`(두 패키지) | 소스의 `animate-*` 문자열 리터럴 전수가 `motion-reduce:!animate-none` 을 가짐. 양성 대조: ui-react 13곳 이상 · agentic-ui 9곳 이상 찾음(0건이면 스캔 실패로 실패) |
| 새 `surface-renderer/surface-renderer.test.tsx` | text surface 가 `text-sm` 이고 `prose*` 없음 |
| 변이: accordion 의 `motion-reduce:!animate-none` 제거 + progress `w-1/3` 제거 | 2 실패(`accordion/index.tsx:65` 지목 · progress 불확정), 원복 후 통과 |

## 2. 실빌드 · 브라우저 실측 (측정)

구성: 스크래치에 배포본 1.6.0 을 설치한 node_modules(브리프와 같음)를 쓰고 `@axis-ds/*` 3패키지의 `dist` · `package.json` · `tailwind.css` 만 이 브랜치 빌드본으로 바꿨어요. Tailwind 3.4.17 CLI · 4.1.11 CLI, esbuild 번들, Playwright Chromium(브리프와 같은 러너). 앱은 Accordion · Progress(indeterminate) · Dialog · SurfaceRenderer 를 렌더해요.

### 2.1 33개 클래스 커버리지

| 구성 | 이 브랜치 | 1.6.0 대조군 |
|---|---|---|
| Tailwind 3 preset 만 | 3/33 (keyframes 3개) | 0/33 (브리프) |
| Tailwind 3 + tailwindcss-animate 1.0.7 | **33/33** | 30/33 (재측정) |
| Tailwind 4 진입점만 | 3/33 | 0/33 (브리프) |
| Tailwind 4 + tw-animate-css 1.3.5 (진입점 뒤) | **33/33** | 32/33 (재측정) |
| Tailwind 4 + tw-animate-css (tailwindcss 바로 다음, 문서 권장 위치) | **33/33** | - |

빌드 CSS 의 keyframes: 플러그인 없는 두 구성 모두 `accordion-down · accordion-up · progress-indeterminate · bounce · pulse · spin`, 플러그인 구성은 `enter · exit` 추가. Tailwind 4 + tw-animate-css 는 accordion-down/up 이 2벌(AXIS + tw-animate-css, 뒤가 이김).

### 2.2 동작 (기본 / reduce 에뮬레이션)

| 구성 | Progress 불확정 | Accordion 열기 · 닫기 | Dialog 열기 · 닫기 |
|---|---|---|---|
| tw3 preset 만 | progress-indeterminate 1.5s · 폭 0.333 · left 2 → 598 | accordion-down · up 0.2s | none (플러그인 없음) |
| tw3 + tailwindcss-animate | 1.5s · 0.333 · left 3 → 597 | 0.2s | enter 0.15s · exit 실행 3개 |
| tw4 진입점만 | 1.5s · 0.333 · left 5 → 595 | 0.2s | none |
| tw4 + tw-animate-css (두 위치) | 1.5s · 0.333 | 0.2s | enter 0.2s · exit 실행 3개 |
| **모든 구성, reduce** | animationName none · 폭 0.333 · left 0 고정 | none · 실행 0 | none · 닫은 뒤 바로 사라짐 |

- SurfaceRenderer text: 모든 구성에서 14px(플러그인 없음).
- 구현 중 발견(측정): `duration-[1500ms]` 를 넣기 전에는 tw3 + tailwindcss-animate 에서 Progress 가 0.3s(left 275 ↔ 326 진동)였어요. 원인은 PRD 4.4.
- 한계: Next.js 앱 빌드가 아니라 정적 HTML + esbuild 번들이고 Chromium 만 봤어요. Safari · Firefox 는 보지 않았어요.

## 3. 문서 사이트 (측정)

| 항목 | 결과 |
|---|---|
| `pnpm build --force` 뒤 `apps/web/.next/static/css` keyframes | accordion-down · accordion-up · bounce · enter · exit · progress-indeterminate · pulse · spin (운영 1.6.0 은 accordion · progress 0건, 브리프) |
| `/components/progress/`(out 정적 서빙, Chromium) | progressbar 9개(데모 1 · variant 4 · 불확정 1 · size 3), 불확정 1개가 progress-indeterminate 1.5s · 폭 0.333, 나머지 폭 1 · animation none. reduce 에서 불확정도 none |
| 같은 페이지 axe(wcag2a · 2aa · 21a · 21aa, main) | 위반 0 · 통과 규칙 19(양성 대조: 0 이 아님), 기본 · reduce 같음 |
| `/components/accordion/` 열기 | accordion-down 실행 1, reduce 에서 none · 실행 0 |
| `E2E_SERVER=static CI=1 playwright test a11y` | 40 통과(이 게이트의 페이지 목록에는 progress 가 없어 위 axe 를 따로 돌림) |

## 4. 게이트 (측정)

| 명령 | 결과 |
|---|---|
| `pnpm turbo run type-check lint --force` | 18 tasks 성공 · Cached 0 |
| `pnpm turbo run test --force` | 6 tasks 성공 · Cached 0 (cli 662 · mcp 138 · theme 31 · ui-react 124+7 · agentic-ui 93 · tokens 281) |
| `pnpm --filter @axis-ds/cli test` | 662 통과(init.test.ts 의 quick-start 「Tailwind CSS 4」 절 대조 · guidance.test.ts 의 docs/guides 스캔 포함) |
| `pnpm build --force` | 8 tasks 성공 · Cached 0 |
| `pnpm test:registry` | 45 통과 |
| `pnpm pack-smoke` | rc 0 |
| `pnpm check-library-links` | 위반 0건 |
| `pnpm install --frozen-lockfile` | 통과(lockfile 은 optional peer 2개를 `auto-install-peers=true` 로 ui-react importer 에 기록해 11줄 추가) |

## 5. 생성물

| 생성물 | 명령 | 결과 (측정) |
|---|---|---|
| `apps/web/public/r` | `pnpm build:registry` | 항목 11개(dialog · select · toast · agentic 8개) content 와 index · registry 의 sha256 22줄. 생성기가 `version` 을 1.5.0 → 1.6.0 으로 바꿔 두 줄을 1.5.0 으로 되돌림(WI-0052 선례). G1 통과 30개 |
| `apps/web/public/library` | `axis library refresh-axis` | 변경 18 · 유지 30, 파일 17개(E4 slug 충돌로 progress · skeleton · tooltip 은 파일을 쓰지 않음, 종전과 같음). 재실행 `--dry-run` 변경 0 · 쓰기 0. meta.json 변경 없음 |
| `apps/web/public/templates/*.json` | (빌드 부수효과) | `pnpm build` 가 5개를 바꿨으나 이번 변경과 무관(updatedAt · index total 39 → 42) 해 되돌림 |

## 6. 배포 뒤 확인 (미실행)

- [ ] pages.dev `/components/progress` · `/components/accordion` 운영 CSS 에 keyframes 3개, 불확정 막대 왕복
- [ ] npm 발행본(tokens · ui-react · agentic-ui) 을 스크래치에 설치해 2.1 표를 다시 재기
