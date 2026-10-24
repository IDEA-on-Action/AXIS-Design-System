# WI-0046: 애니메이션 플러그인 의존 선언 · accordion · progress keyframes PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0046 | GitHub: #137 | 우선순위: P2 | 상태: Approved (2026-10-24 결정 반영)
> 기준: `main` 59dd6a3 (linked 4패키지 1.6.0, Release PR #179 머지 대기) | 배치 2 묶음 ②

---

## 1. 개요

### 1.1 문제 (측정, 배치 2 브리프 · 이 WI 재측정)

측정 방법: 배포본 1.6.0 을 스크래치에 설치해 Tailwind 3.4.17 · 4.1.11 CLI 로 CSS 를 만들고, esbuild 로 묶은 React 19 앱을 Playwright Chromium 에서 렌더해 `getComputedStyle().animationName` 과 `getAnimations()` 를 읽었어요. 33개 애니메이션 클래스 커버리지는 클래스를 붙인 요소와 대조 요소의 계산 스타일이 달라지는지로 판정했어요.

| 구성 (1.6.0) | 33개 중 동작 | 빠진 것 |
|---|---|---|
| Tailwind 3 preset 만 | 0 | 전부 |
| Tailwind 3 + tailwindcss-animate | 30 | `animate-accordion-up/down` · `animate-progress-indeterminate` |
| Tailwind 4 진입점만 | 0 | 전부 |
| Tailwind 4 + tw-animate-css | 32 | `animate-progress-indeterminate` |

- `progress-indeterminate` keyframes 는 저장소 · 배포본 어디에도 없었어요(grep 0건, tokens dist keyframes 0건). 어떤 플러그인으로도 안 생겨요.
- Progress `indeterminate` 는 표시기가 트랙 전체 폭(1280px 중 1280px, left 0)이라 애니메이션이 없으면 100% 완료처럼 보였어요.
- 운영 문서 사이트(pages.dev) CSS 의 keyframes 는 bounce · enter · exit · pulse · spin 뿐이었어요. 사이트는 preset 을 쓰지 않아 Accordion 데모도 돌지 않았고, `/components/progress` 는 mock 이었어요.
- 두 플러그인 모두 `prefers-reduced-motion: reduce` 에서도 Dialog enter 가 돌았고, 컴포넌트에 `motion-reduce` 처리가 0건이었어요.
- SurfaceRenderer text 의 `prose prose-sm` 은 설치되지 않은 `@tailwindcss/typography` 클래스예요. 플러그인을 넣어도 바뀌는 값은 font-size 16px → 14px 하나였어요(평문 렌더).
- tokens Tailwind 4 변환기(`scripts/tailwind4.mjs`)는 `theme.extend.keyframes` · `preset.plugins` 에서 throw 해요. `tailwind4.test.mjs` 76 · 80 · 91 행 단언도 키 · 접두사 집합이 3종이라고 고정해요(이 WI 에서 구판 테스트를 신판 코드에 태워 3건 실패로 확인).

### 1.2 범위 밖

- init 안내 한 줄 · `axis check` WARN(애니메이션 플러그인 없음): 묶음 ③(WI-0037 · 0041 · 0049 · 0065) 소유예요. `packages/axis-cli/src/init/init.ts` 는 고치지 않아요.
- quick-start 「Tailwind CSS 3」 코드 블록 최종 형태: 묶음 ④(WI-0064) 소유예요. 이 WI 는 「Tailwind CSS 4」 절의 애니메이션 문단만 고쳐요.
- 템플릿 4종의 애니메이션 플러그인 · keyframes: 템플릿은 구조 수정 + features 설명 정정만 하고 AXIS 전환은 WI-0067(#181) 이에요.
- `/components` 의 나머지 mock 페이지(avatar · alert · skeleton · tooltip): WI-0066(#180).
- agentic-ui 의 비대비 a11y(aria-prohibited-attr · scrollable-region-focusable · 시각 포맷 #418): WI-0069(#183). 대비 결함은 WI-0062(#170).

## 2. 결정 (2026-10-24 사용자: 브리프 권장안 + review major 지적 반영)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 열고 닫는 애니메이션(animate-in · fade · zoom · slide, 33개 중 30개)은 `@axis-ds/ui-react` 에 `tailwindcss-animate`(Tailwind 3) · `tw-animate-css`(Tailwind 4) 를 **optional peer** 로 선언하고 문서로 안내해요. 코드에 플러그인을 넣지 않아요 | 브리프 D1 (a). preset 탑재(b)는 변환기 금지 · 규칙 2벌 · 새 hard dependency |
| D2 | keyframes 3개(`accordion-down` · `accordion-up` · `progress-indeterminate`)는 **tokens preset** 에 두고, Tailwind 4 진입점은 변환기에 **`@keyframes` 블록 생성 경로를 새로 추가**해 같은 출처에서 만들어요. `tailwind4.test.mjs` 76 · 80 · 91 행 단언을 고치고 Tailwind 4 **실빌드**로 확인해요 | 브리프 D2 + review major(wi0046 D2) |
| D3 | Progress 불확정은 **트랙 폭 1/3 막대가 왕복**해요(`w-1/3`, translateX 0 ↔ 200%) | 브리프 D3. 움직임이 꺼져도 꽉 찬 막대와 구별됨 |
| D4 | SurfaceRenderer text 는 `prose prose-sm max-w-none` 을 `text-sm` 으로 바꿔요(플러그인 의존 0, 같은 14px) | 브리프 D4 |
| D5 | prefers-reduced-motion 과 문서 사이트를 함께 다뤄요. 사이트(`apps/web`)는 **preset 을 채택하지 않고** tokens 가 내보내는 `axisKeyframes` · `axisAnimation` 객체만 `tailwind.config.ts` 에 import 해요(사이트 색 · radius · 글꼴 매핑과 ① 의 a11y 기준 불변) | 브리프 D5 + review major(wi0046 D5) |
| D6 | **reduced-motion 범위**: 새 keyframes 3개뿐 아니라 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 소스의 **모든 `animate-*`**(열고 닫기 7개 컴포넌트 10곳 · accordion · progress · skeleton, agentic spin 4 · pulse 4 · bounce 1, 합계 22곳)에 `motion-reduce:!animate-none` 을 붙여요. 스피너도 멈춰요(정지 아이콘과 상태 문구가 남음) | review minor(wi0046 D5 범위). 아래 4.2 |
| D7 | `/components/progress` 페이지를 mock 대신 실제 `Progress`(`@axis-ds/ui-react`)로 바꾸고 Indeterminate 데모를 더해요 | 사용자 추가 결정(mock 은 WI-0066 으로 분리하되 progress 만 여기서) |
| D8 | **복사 설치(registry `public/r`) 경로는 한계로 명시**하고 항목에 애니메이션 플러그인을 기재하지 않아요 | review major(wi0046 D1). 아래 4.3 |
| D9 | changeset 은 linked patch 3개(tokens · ui-react · agentic-ui)예요. `@axis-ds/theme` 은 소스 변경이 없어 빼요(`git diff --stat packages/axis-theme` 0줄) | 사용자 지시(theme 은 확인해서 결정) |
| D10 | 레지스트리 · library 는 생성 명령으로 다시 만들고 `version` 필드는 그대로 둬요(WI-0052 선례) | 사용자 지시 |

## 3. 요구사항

- FR-1 tokens preset `theme.extend` 에 `keyframes` · `animation` 을 더하고, 같은 객체를 `axisKeyframes` · `axisAnimation` 으로 named export 해요
- FR-2 Tailwind 4 진입점(`dist/css/tailwind4.css`)은 `@theme inline` 에 `--animate-*` 3개를, 최상위에 `@keyframes` 3개를 preset 과 같은 값으로 가져요
- FR-3 변환기는 keyframes 형태가 `{ 이름: { 단계: { kebab-case 속성: 문자열 } } }` 가 아니거나, animation 이 preset 에 없는 keyframes 를 가리키면 throw 해요(조용히 빠뜨리지 않음)
- FR-4 Progress `indeterminate` 의 표시기는 트랙 폭 1/3 이고 `animate-progress-indeterminate` 로 왕복해요. `aria-valuenow` 는 없어요(종전과 같음)
- FR-5 ui-react · agentic-ui 의 모든 `animate-*` 는 `prefers-reduced-motion: reduce` 에서 멈춰요
- FR-6 SurfaceRenderer text 는 플러그인 없이 14px 이에요
- FR-7 ui-react `package.json` 에 두 플러그인이 optional peer 로 선언돼요
- FR-8 문서(quick-start Tailwind 4 절 · troubleshooting · 문서 사이트 docs 페이지 · ui-react README · tokens README)가 Tailwind 3/4 별 플러그인과 keyframes 위치를 안내해요
- FR-9 문서 사이트 CSS 에 `accordion-*` · `progress-indeterminate` keyframes 가 생기고 `/components/progress` 가 실컴포넌트로 렌더돼요

## 4. 설계

### 4.1 keyframes

```
accordion-down          from { height: 0 } to { height: var(--radix-accordion-content-height) }     0.2s ease-out
accordion-up            from { height: var(--radix-accordion-content-height) } to { height: 0 }     0.2s ease-out
progress-indeterminate  0%, 100% { translateX(0) } 50% { translateX(200%) }                          1.5s ease-in-out infinite
```

- translateX 는 표시기 자신의 폭 기준이에요. 폭이 트랙의 1/3 이라 200% 가 트랙 오른쪽 끝이에요(계산). 실측: 트랙 900px 에서 표시기 300px, left 0 → 약 598px 왕복.
- Tailwind 4 의 `@keyframes` 는 `@theme inline` 밖 최상위에 둬요. 테스트 파서가 `@theme inline` 블록 안을 모두 선언으로 보기 때문이고, 최상위 keyframes 는 Tailwind 4.1.11 실빌드에서 그대로 출력돼요(측정).
- tw-animate-css 도 같은 이름의 accordion keyframes 를 정의해요. 4.1.11 실빌드에서 두 정의가 모두 나오고 tw-animate-css 정의가 뒤에 와서 이겨요(import 순서와 무관, 측정). 같은 Radix 높이 변수를 써서 동작은 같아요(측정: 열기 accordion-down 0.2s).

### 4.2 reduced-motion

- 클래스 `motion-reduce:!animate-none` 을 각 `animate-*` 문자열에 붙여요. `!` 가 필요한 이유: `data-[state=open]:animate-in` 은 선택자가 `.클래스[data-state=open]` 이라 명시도가 (0,2,0) 이고 `motion-reduce:animate-none` 은 (0,1,0) 이라 이기지 못해요(계산). Tailwind 4.1.11 이 앞쪽 `!` 표기를 `animation: none !important` 로 출력하는 것을 실빌드로 확인했어요.
- Radix Presence 는 닫힐 때 animationName 이 none 이면 바로 unmount 해요. 그래서 reduce 에서 Dialog 가 기다림 없이 닫혀요(측정: 닫은 뒤 `[role=dialog]` 없음).
- Tooltip 은 두 문자열로 나뉘어 있던 열기 · 닫기 클래스를 한 문자열로 합쳤어요(클래스 집합은 그대로 + `motion-reduce:!animate-none`). 회귀 테스트가 문자열 단위로 보기 때문이에요.

### 4.3 복사 설치 한계 (D8)

- `axis add` 는 항목의 `dependencies` 만 설치 안내에 쓰고 `devDependencies` 는 읽기만 해요(`packages/axis-registry-core/src/add/add.ts` `missingDependencies`, 코드 확인).
- 플러그인 이름이 Tailwind 3 · 4 에 따라 달라 한 항목에 하나를 적으면 반대쪽 사용자에게 틀려요. 패키지 설치만으로는 동작하지 않고 `plugins` · `@import` 줄도 넣어야 해요.
- 그래서 항목에 기재하지 않고 troubleshooting 에 「복사 설치」 단락을 두었어요. cli 경로의 안내 한 줄 · check WARN 은 묶음 ③ 이 맡아요.
- 복사 설치 사용자도 tokens preset · Tailwind 4 진입점을 쓰면 accordion · progress keyframes 는 받아요(같은 출처).

### 4.4 Progress 와 tailwindcss-animate 의 duration 충돌 (구현 중 발견, 측정)

- tailwindcss-animate 는 `duration-300` 을 `animation-duration` 에도 적용해요. 표시기 기본 클래스의 `duration-300` 때문에 Tailwind 3 + 플러그인에서 왕복이 0.3s 로 빨라졌어요(측정: dur 0.3s, left 275 ↔ 326 진동).
- 불확정일 때 `duration-[1500ms]` 로 덮어요(tailwind-merge 가 `duration-300` 을 지움). 값은 토큰 `axisAnimation` 의 1.5s 와 같고 `progress.test.tsx` 가 토큰 값과 대조해요. 고친 뒤 dur 1.5s · left 3 → 597(측정).
- `progressIndicatorVariants` export 의 출력은 바꾸지 않았어요.

## 5. 수용 기준

- AC1 tokens 테스트 전체 통과, 새 단언(keyframes 대조 · `--animate-*` 참조 · 변이 4종)이 있고, 구판 76 · 80 · 91 행 단언은 신판 코드에서 실패함(음성 대조)
- AC2 Tailwind 3 · 4 실빌드: 플러그인 없이 3/33, 플러그인과 함께 33/33. 1.6.0 대조군은 30 · 32
- AC3 Playwright: Progress 불확정 폭 비율 0.333 · 왕복, Accordion accordion-down/up, reduce 에서 Progress · Accordion · Dialog 모두 animationName none
- AC4 문서 사이트 빌드 CSS 에 accordion-down · accordion-up · progress-indeterminate keyframes, `/components/progress` 실컴포넌트 9개 · axe 위반 0, 사이트 a11y 게이트 40건 통과
- AC5 cli 테스트(init.test.ts quick-start 대조 · guidance.test.ts) 통과, `init.ts` 변경 없음
- AC6 품질 게이트: type-check · lint · test · build(--force, Cached 0) · test:registry · pack-smoke · check-library-links

## 6. 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v1.0 | 2026-10-24 | 배치 2 브리프 권장안 + review major 3건(D2 변환기 · D5 사이트 · D1 복사 설치) · minor 1건(D6 범위) 반영, 구현 중 발견한 4.4 추가 |
