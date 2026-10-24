# WI-0071: 움직임 줄이기에서 로딩 · 진행 표시는 느리게 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` 3368786 + 브랜치 `fix/wi-0071-reduced-motion-slow-loading`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 단위 테스트 (측정)

| 대상 | 결과 |
|---|---|
| ui-react 전체(vitest) | 126 통과(10파일, 종전 124 + 스캐너 테스트 2) + `fix-cva-dts.test.mjs` 7 통과 |
| agentic-ui 전체(vitest) | 95 통과(9파일, 종전 93 + 스캐너 테스트 2) |
| `reduced-motion.test.ts`(두 패키지 각 4건) | 스캐너 fixture(세 종류 따옴표 · 여러 줄 백틱 · 주석 · JSX 아포스트로피) · 음성 대조(작은따옴표 · 백틱 위반 검출, 배율 1s · 9s 실패, 분류 안 된 `animate-ping` 실패) · 양성 대조(ui-react stop 11 · slow 2, agentic-ui stop 0 · slow 9 정확 개수) · 분류 규칙 |
| `progress.test.tsx` | 3 통과. 불확정 클래스에 `motion-reduce:![animation-duration:4s]` 있음 · `motion-reduce:!animate-none` 없음(tailwind-merge 를 거친 렌더 결과) |

### 1.1 변이 (측정)

| 변이 | 신판 테스트 | 구판 테스트(HEAD 의 `reduced-motion.test.ts`) |
|---|---|---|
| Tooltip 리터럴을 작은따옴표로 바꾸고 `motion-reduce:!animate-none` 제거 | 실패: `tooltip/index.tsx:25 animate-in · animate-out: stop 대상인데 ... 없음` | 위반 목록에 tooltip 이 없음(리터럴을 못 봄, 찾은 개수 12). 개수 하한 13 때문에 우연히 실패했을 뿐 위치는 지목하지 못함 |
| PlanCard spin 을 `motion-reduce:!animate-none` 로 되돌림 | 실패: `plan-card/index.tsx:66 animate-spin: slow 대상인데 멈춤` · `주기 없음` | (구판 규칙상 통과하는 형태) |

원복 뒤 두 패키지 모두 통과.

## 2. 소비자 빌드 · 브라우저 실측 (측정)

구성: 이 브랜치에서 `pnpm turbo run build --force` 후 `pnpm pack` 한 tokens · ui-react · agentic-ui 1.6.2 tarball 3개를 스크래치 디렉터리 2곳에 npm 으로 설치(npm 레지스트리의 @axis-ds 는 받지 않음, 설치본 dist 에서 `animation-duration:3s` 8파일 확인).

- Tailwind 3: tailwindcss 3.4.17 + tailwindcss-animate 1.0.7, quick-start 와 같은 `tailwind.config.ts`(preset · content · plugins, 그 밖의 설정 없음)
- Tailwind 4: tailwindcss · @tailwindcss/cli 4.1.11 + tw-animate-css 1.3.5, quick-start 와 같은 import 4줄 + `@source` 앱 파일
- 앱: React 19.2.3, esbuild 0.25.8 번들, 정적 HTML. Playwright 1.61.1 Chromium, `reducedMotion` 을 `no-preference` · `reduce` 로 에뮬레이션
- 값: `getComputedStyle().animationName` · `animationDuration`, 실행 중 `getAnimations()` 의 `getComputedTiming().duration`(실효 주기), Progress 표시기 left 를 250ms 간격 18회 표본

### 2.1 slow 대상

| 요소 | no-preference (tw3 · tw4 같음) | reduce tw3 | reduce tw4 |
|---|---|---|---|
| Progress 불확정 | progress-indeterminate 1.5s · 실행 1 | progress-indeterminate **4s** · 실효 4000ms | 같음 **4s** · 4000ms |
| Progress 막대 left 범위(4.5초) | tw3 11 → 564 · tw4 0 → 578 | **0 → 579**(움직임) | **3 → 578** |
| Skeleton | pulse 2s | pulse **5s** | pulse **5s** |
| ThinkingIndicator 점 3개 | bounce 1s | bounce **2.5s** ×3 | bounce **2.5s** ×3 |
| RunProgress 헤더 점 · 단계 배지 | pulse 2s ×2 | pulse **5s** ×2 | 같음 |
| RunProgress 단계 스피너 | spin 1s | spin **3s** | spin **3s** |
| ToolCallCard 스피너 | spin 1s | spin **3s** | spin **3s** |
| StreamingText 커서 | pulse 2s | pulse **5s** | pulse **5s** |

- 모든 slow 요소가 reduce 에서 실행 중(`playState running`)이고 주기는 PRD 2.2 표와 같아요. tw3 + tailwindcss-animate 에서도 Progress 는 `duration-[1500ms]` 의 영향 없이 4s 예요(important).
- 빌드 CSS: tw3 은 `@media (prefers-reduced-motion: reduce)` 안에 `animation-duration: 3s !important` 등 4규칙, tw4 는 같은 규칙을 중첩 `@media` 로 출력.
- PlanCard · MessageBubble · StepTimeline 은 앱에 렌더하지 않았어요. 클래스 문자열은 RunProgress · ToolCallCard 와 같은 형태라 같게 동작할 것으로 추정해요(단위 테스트가 문자열을 강제).

### 2.2 stop 대상 (대조)

| 요소 | no-preference | reduce (tw3 · tw4) |
|---|---|---|
| Dialog Overlay · Content | enter 0.15s (tw4 Content 0.2s) | **none** |
| Dialog 닫기(Escape) 뒤 | `[role=dialog]` 0 | 0 |
| Accordion 다시 열기 | accordion-down 0.2s · 실행 1 | **none** · 실행 0 |

- reduce 에뮬레이션이 실제로 걸렸다는 양성 대조로도 써요(같은 페이지에서 stop 은 none, slow 는 길어진 주기).
- 한계: Next.js 앱 빌드가 아닌 정적 HTML + esbuild, Chromium 만 봤어요.

### 2.3 구현 중 발견: CJS 설정의 preset (측정, PRD 5.1)

| Tailwind 3.4.17 `loadConfig` 로 읽은 설정 | preset `theme.extend.keyframes` 키 |
|---|---|
| `module.exports = { presets: [require("@axis-ds/tokens/tailwind")] }` | 없음 |
| `module.exports = { presets: [require("@axis-ds/tokens/tailwind").default] }` | 3개 |
| `export default { presets: [require("@axis-ds/tokens/tailwind")] }` | 3개 |

첫 측정을 CJS 설정으로 했을 때 Progress 는 no-preference 에서도 animationName none 이었어요(keyframes 미생성). 측정은 quick-start 의 TS 설정으로 다시 했어요.

## 3. 게이트 (측정)

| 명령 | 결과 |
|---|---|
| `pnpm turbo run type-check lint test build --force` | 28 tasks 성공 · Cached 0 (cli 707 · mcp 139 · theme 31 · tokens 281 · ui-react 126+7 · agentic-ui 95) |
| `pnpm check-token-refs` · `check-contrast-pairs` · `check-types-versions` | rc 0 |
| `pnpm check-library-links` | 위반 0건 |
| `pnpm build:registry` | 30개 항목, G1 통과 |
| `pnpm test:registry` | 45 통과 |
| `pnpm check-licenses` | rc 0 |
| `pnpm pack-smoke` | rc 0, 퍼블리시 대상 6개 |
| `pnpm cli-smoke` | rc 0 |
| `pnpm registry-install-smoke` | 5/5 통과 |
| E2E a11y · nontext · demo (`E2E_SERVER=static`) · tokens | 40 · 8 · 8 · 22 통과, 실패 · flaky · skipped 0 (CI 건수 가드 기대값과 같음) |

## 4. 생성물 (측정)

| 생성물 | 명령 | 결과 |
|---|---|---|
| `apps/web/public/r` | `pnpm build:registry` | agentic 7항목(message-bubble · plan-card · run-progress · step-timeline · streaming-text · thinking-indicator · tool-call-card) content 와 index · registry 의 sha256 14줄. 생성기가 바꾼 `version` 1.5.0 → 1.6.2 두 줄은 1.5.0 으로 되돌림(WI-0052 선례). ui-react 항목(dialog · select · toast)은 stop 대상이라 변경 없음 |
| `apps/web/public/library` | `pnpm library:refresh-axis` | 파일 쓰기 11개(agentic 7 · categories 2 · index · meta, updatedAt 2026-10-25). progress · skeleton 은 E4 slug 충돌로 파일을 쓰지 않음(종전과 같음). 재실행 변경 0 · `--dry-run` 쓰기 0 |
| `apps/web/public/templates/*.json` | (빌드 부수효과) | `pnpm build` 가 5개를 바꿨으나 이번 변경과 무관해 되돌림 |

## 5. 배포 뒤 확인 (미실행)

- [ ] npm 발행본(ui-react · agentic-ui) 을 2절 구성에 설치해 2.1 · 2.2 표 다시 재기
- [ ] pages.dev `/components/progress` 를 reduce 에뮬레이션으로 열어 불확정 막대 4s 왕복
