# WI-0071: 움직임 줄이기에서 로딩 · 진행 표시는 느리게 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0071 | GitHub: #190 | 우선순위: P2 | 상태: Approved (2026-10-25 사용자 결정)
> 기준: `main` 3368786 (linked 4패키지 1.6.2 배포됨) | 선행: WI-0046(#137, PRD D6)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

- WI-0046 D6 은 `prefers-reduced-motion: reduce` 에서 ui-react · agentic-ui 의 `animate-*` 22곳을 모두 `motion-reduce:!animate-none` 으로 멈추게 했어요. 여기에는 RunProgress · ToolCallCard 의 스피너, ThinkingIndicator, Progress 불확정 같은 로딩 · 진행 표시도 들어 있어요.
- 움직임 줄이기를 켠 사용자에게는 "처리 중" 표시가 멈춰 보여 앱이 응답하지 않는 것처럼 느껴질 수 있어요. WI-0046 구현 에이전트는 "멈추지 않고 느리게만 할지는 사용자 확인이 필요하다"고 남겼고 확인 전에 배포됐어요(1.6.2).

### 1.2 결정 (2026-10-25 사용자)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 로딩 · 진행 표시(스피너, Progress 불확정, ThinkingIndicator, 그 밖에 작업이 진행 중임을 알리는 반복 애니메이션)는 reduce 에서 **멈추지 않고 느리게** 돈다 | 사용자 결정. 멈춘 표시는 "응답 없음"과 구별되지 않음 |
| D2 | 열고 닫기(`animate-in` · `animate-out`) · Accordion · 장식성 전환은 **계속 멈춘다** | 사용자 결정. 화면 전환 움직임은 정보가 없고 즉시 나타나도 기능이 같음 |
| D3 | 느린 주기는 기본의 **2~3배**로 하고 애니메이션마다 값을 정한다(아래 2.2) | 사용자 결정(대략 2~3배, 정확한 값은 PRD 에 기록) |
| D4 | 구현은 컴포넌트 클래스 `motion-reduce:![animation-duration:<값>]` 으로 한다. tokens keyframes 는 바꾸지 않는다 | 아래 3.1 |
| D5 | 레지스트리 · library 생성물은 생성 명령으로 다시 만들고 `version` 필드는 그대로 둔다 | WI-0052 선례 |

### 1.3 범위 밖

- 앱 코드(AXIS 컴포넌트 밖)의 애니메이션. troubleshooting 안내만 고쳐요.
- ThinkingIndicator 점 사이의 지연(`animationDelay` 150ms)은 그대로 둬요. 주기가 2.5배가 되면 점 사이 위상차가 주기의 15% 에서 6% 로 줄어 물결이 덜 뚜렷해져요(계산). 지연까지 늘리려면 인라인 style 을 미디어 쿼리에 따라 바꿔야 해서 이번에 넣지 않아요.
- Tailwind 3 CJS 설정에서 `presets: [require("@axis-ds/tokens/tailwind")]` 가 preset 을 적용하지 못하는 현상(아래 5.1, 구현 중 발견). 이 WI 의 변경과 무관해 별도로 다뤄요.

## 2. 분류

### 2.1 전수 목록 (측정: 소스 스캔, `reduced-motion.test.ts` 와 같은 기준)

`packages/axis-ui-react/src` · `packages/axis-agentic-ui/src` 의 테스트 · 스토리 밖 `.ts` · `.tsx` 에서 문자열 리터럴(큰따옴표 · 작은따옴표 · 백틱) 안의 `animate-*`(animate-none 제외)를 모두 찾았어요. 22곳이고 WI-0046 의 22곳과 같아요. tokens keyframes 3개 중 `progress-indeterminate` 는 Progress(아래 #12) 하나가 써요.

| # | 위치 | 애니메이션 | 무엇을 알리나 | 분류 | 근거 |
|---|---|---|---|---|---|
| 1 | ui-react `dialog/index.tsx:25` Overlay | animate-in · out(fade) | 열고 닫기 | stop | D2 |
| 2 | ui-react `dialog/index.tsx:45` Content | animate-in · out(fade · zoom · slide) | 열고 닫기 | stop | D2 |
| 3 | ui-react `sheet/index.tsx:25` Overlay | animate-in · out | 열고 닫기 | stop | D2 |
| 4 | ui-react `sheet/index.tsx:35` Content | animate-in · out | 열고 닫기 | stop | D2 |
| 5 | ui-react `popover/index.tsx:23` | animate-in · out | 열고 닫기 | stop | D2 |
| 6 | ui-react `select/index.tsx:64` | animate-in · out | 열고 닫기 | stop | D2 |
| 7 | ui-react `dropdown-menu/index.tsx:74` SubContent | animate-in · out | 열고 닫기 | stop | D2 |
| 8 | ui-react `dropdown-menu/index.tsx:93` Content | animate-in · out | 열고 닫기 | stop | D2 |
| 9 | ui-react `tooltip/index.tsx:25` | animate-in · out | 열고 닫기 | stop | D2 |
| 10 | ui-react `toast/index.tsx:26` | animate-in · out(slide) | 나타나고 사라짐 | stop | D2 |
| 11 | ui-react `accordion/index.tsx:65` | accordion-down · up | 펼치고 접기 | stop | D2 |
| 12 | ui-react `progress/index.tsx:90` 불확정 | progress-indeterminate | 진행률을 모르는 처리 중 | **slow** | D1 |
| 13 | ui-react `skeleton/index.tsx:17` | pulse | 콘텐츠 로딩 중 | **slow** | D1(로딩 표시) |
| 14 | agentic-ui `run-progress/index.tsx:31` 단계 배지(running) | pulse | 단계 실행 중 | **slow** | D1 |
| 15 | agentic-ui `run-progress/index.tsx:39` 단계 아이콘(running) | spin | 단계 실행 중 | **slow** | D1 |
| 16 | agentic-ui `run-progress/index.tsx:84` 헤더 점(running) | pulse | 실행 중 | **slow** | D1 |
| 17 | agentic-ui `tool-call-card/index.tsx:42` (running) | spin | 도구 실행 중 | **slow** | D1 |
| 18 | agentic-ui `plan-card/index.tsx:66` (running) | spin | 계획 단계 실행 중 | **slow** | D1 |
| 19 | agentic-ui `message-bubble/index.tsx:44` (sending) | spin | 메시지 전송 중 | **slow** | D1 |
| 20 | agentic-ui `step-timeline/index.tsx:69` (running) | pulse | 단계 실행 중 | **slow** | D1 |
| 21 | agentic-ui `thinking-indicator/index.tsx:50` | bounce | 생각 중 | **slow** | D1(사용자 예시) |
| 22 | agentic-ui `streaming-text/index.tsx:93` 커서(isStreaming) | pulse | 응답 생성 중 | **slow** | D1. 스트리밍 중에만 보이고 생성이 진행 중임을 알림 |

합계 stop 11 · slow 11(계산). 장식성 반복 애니메이션은 이번 스캔에서 0곳이었어요(측정). #13 Skeleton 은 "로딩 중" 표시라 slow 로 두었고, #22 커서는 스트리밍 중에만 나타나 생성 진행을 알리므로 slow 예요.

### 2.2 느린 주기

| 애니메이션 | 기본 주기 | reduce 주기 | 배율 | 근거 |
|---|---|---|---|---|
| spin | 1s (Tailwind 3.4 · 4.1 기본, 측정) | **3s** | 3.0 | 회전은 공간 이동이 있어 범위 상단. 3s 는 분당 20회전으로 여전히 돌고 있음을 알아볼 수 있음 |
| bounce | 1s (측정) | **2.5s** | 2.5 | 세로 이동이 있지만 점이 작음(지름 0.25~0.5rem, `w-1` ~ `w-2`). 2.5s 면 점마다 1.25s 에 한 번 오르내림 |
| pulse | 2s (측정) | **5s** | 2.5 | 투명도만 바뀌고 위치 이동이 없음. 5s 로도 2.5s 마다 밝기 변화가 보임 |
| progress-indeterminate | 1.5s (tokens `axisAnimation`, 측정) | **4s** | 2.67 | 트랙 폭의 2/3 를 가로지르는 이동이라 범위 상단 쪽. 한쪽 끝까지 2s |

- 배율은 2~3 범위 안에서 움직임의 종류로 나눴어요. 공간 이동이 큰 것(spin · progress)은 3배 쪽, 투명도 · 작은 이동(pulse · bounce)은 2.5배예요. 판단 근거는 "움직임 줄이기는 움직임의 크기와 속도를 줄여 달라는 신호"라는 일반 해석이고, 특정 수치를 정한 표준은 없어요(추정 · 판단).
- 회귀 테스트는 배율이 2 이상 3 이하인지 검사해요.

## 3. 설계

### 3.1 방식: `motion-reduce:![animation-duration:<값>]`

- slow 대상 문자열에서 `motion-reduce:!animate-none` 을 지우고 `motion-reduce:![animation-duration:3s]` 처럼 바꿔요. 애니메이션 이름 · 타이밍 함수 · 반복은 기본 그대로이고 길이만 바뀌어요.
- **Tailwind 3 · 4 양쪽 기본 기능**이에요. 임의 속성(`[prop:value]`) · `motion-reduce` 변형 · 앞쪽 `!`(important)는 Tailwind 3.0 이상과 4 의 코어라 소비자 설정(preset · plugins · theme)이 필요 없어요. 측정: Tailwind 3.4.17 은 `@media (prefers-reduced-motion: reduce) { .motion-reduce\:\!\[animation-duration\:3s\] { animation-duration: 3s !important } }`, Tailwind 4.1.11 은 같은 규칙을 중첩 `@media` 로 출력했어요.
- `!` 가 필요한 이유: tailwindcss-animate 는 `duration-*` 를 `animation-duration` 에도 적용해요. Progress 는 그 충돌을 막으려고 `duration-[1500ms]` 를 가지고 있어(WI-0046 PRD 4.4), important 가 없으면 Tailwind 3 + tailwindcss-animate 에서 순서에 따라 1.5s 가 이길 수 있어요(추정). important 로 확실히 덮고, 실측에서 tw3 + tailwindcss-animate 도 4s 였어요(측정).
- tokens keyframes 의 reduce 변형(예: `@media` 안 별도 animation)은 쓰지 않았어요. spin · pulse · bounce 는 Tailwind 내장이라 tokens 가 덮을 수 없고, 한 방식으로 통일하는 편이 낫기 때문이에요. tokens 는 소스 변경이 없어 changeset 에서 빠져요.
- tailwind-merge: 임의 속성 클래스는 `animation-duration` 그룹이라 `animate-*` · `duration-*` 와 충돌로 지워지지 않아요. Progress · Skeleton · ThinkingIndicator 는 `cn()` 을 거치는데 렌더된 class 에 그대로 남는 것을 단위 테스트(progress)와 브라우저 실측(나머지)으로 확인했어요.

### 3.2 회귀 테스트 (`reduced-motion.test.ts`, 두 패키지)

- 문자열 리터럴 스캐너를 큰따옴표만에서 **큰따옴표 · 작은따옴표 · 백틱**으로 넓혔어요(WI-0046 검토 minor). 주석은 건너뛰고, 따옴표 문자열은 줄을 넘지 않게 해 JSX 본문의 아포스트로피를 문자열로 읽지 않아요. 백틱은 여러 줄 · `${}` 를 포함한 원문 전체를 하나로 봐요.
- 한계: 한 줄의 JSX 본문에 아포스트로피가 둘 있으면 그 사이를 문자열로 읽어요. 이 경우는 잘못 찾아 실패하는 쪽이라 조용히 놓치지 않아요(설계 판단).
- 규칙: 애니메이션 이름으로 분류해요. `in` · `out` · `accordion-up` · `accordion-down` 은 `motion-reduce:!animate-none` 필수, `spin` · `pulse` · `bounce` · `progress-indeterminate` 는 `!animate-none` 금지 + `motion-reduce:![animation-duration:..]` 필수 + 기본 대비 2~3배. 그 밖의 이름은 "분류되지 않음"으로 실패해 새 애니메이션을 넣을 때 이 표에 분류하게 해요.
- 양성 대조: ui-react 는 stop 11 · slow 2(progress · skeleton), agentic-ui 는 stop 0 · slow 9 를 정확히 찾아야 해요.
- 스캐너 자체 테스트: 세 종류 따옴표 · 여러 줄 백틱 · 주석 · JSX 아포스트로피 fixture, 작은따옴표 · 백틱 안의 위반 검출(음성 대조), 배율 경계(1s · 9s 실패).

## 4. 요구사항

- FR-1 slow 11곳은 reduce 에서 animationName 이 기본과 같고 주기가 2.2 표의 값이에요
- FR-2 stop 11곳은 reduce 에서 animationName 이 none 이에요(WI-0046 과 같음)
- FR-3 no-preference 에서는 22곳 모두 종전과 같아요
- FR-4 Tailwind 3(preset + tailwindcss-animate) · Tailwind 4(진입점 + tw-animate-css) 소비자 빌드에서 FR-1~3 이 성립해요. 소비자 설정을 더하지 않아요
- FR-5 회귀 테스트가 2.1 분류와 2.2 배율을 강제하고, 세 종류 따옴표를 모두 훑어요
- FR-6 README · quick-start · troubleshooting · 문서 사이트(docs · components/progress)의 "멈춥니다" 문구가 새 동작과 맞아요

## 5. 구현 중 발견

### 5.1 CJS 설정의 `require("@axis-ds/tokens/tailwind")` (측정, 이 WI 범위 밖)

- 측정용 Tailwind 3 소비자를 처음에 `tailwind.config.js`(CommonJS)의 `presets: [require("@axis-ds/tokens/tailwind")]` 로 만들었더니 빌드 CSS 에 `progress-indeterminate` · `accordion-*` keyframes 와 `animate-progress-indeterminate` 가 없었어요. Progress 는 no-preference 에서도 animationName none 이었어요.
- 원인(측정): `require()` 가 돌려주는 값이 `{ axisAnimation, axisKeyframes, default }` 이고 preset 본체는 `default` 안에 있어요. Tailwind 3.4.17 `loadConfig` 로 세 설정을 직접 읽어 preset 의 `theme.extend.keyframes` 키를 셌어요. `module.exports = { presets: [require(...)] }` 은 (없음), `require(...).default` 는 3개, ESM 문법 파일 안의 `require(...)`(`export default { presets: [require(...)] }`)는 3개였어요. CJS 문법 설정에서만 interop 이 빠져요(원인 경로는 jiti 내부로 추정). quick-start 의 TS 설정(`import axisPreset from ...`)으로 바꾸자 keyframes 가 생기고 동작했어요(측정).
- cli 가 안내하는 문구(`presets: [require("@axis-ds/tokens/tailwind")]`)가 이 형태라 확인이 필요해요. tokens 소스는 이 브랜치에서 바꾸지 않았으므로 1.6.2 발행본도 같을 것으로 추정해요(발행본으로는 재지 않음).

## 6. 수용 기준

- AC1 ui-react · agentic-ui 회귀 테스트 통과, 변이(작은따옴표 stop 누락 · slow 를 멈춤으로)를 잡고, 구판 테스트는 작은따옴표 리터럴을 보지 못함(음성 대조)
- AC2 Playwright(Chromium), 이 브랜치 pack 결과를 설치한 Tailwind 3 · 4 소비자 각 1개: reduce 에서 slow 대상 animationName 유지 · 주기 2.2 표 값 · Progress 막대 이동, stop 대상 none, no-preference 기본값
- AC3 게이트: `turbo run type-check lint test build --force`, frontend.yml run 단계(check-token-refs · check-contrast-pairs · check-types-versions · check-library-links · build:registry · test:registry · check-licenses · pack-smoke · cli-smoke · registry-install-smoke · E2E)
- AC4 changeset ui-react · agentic-ui patch, 레지스트리 version 유지, library 재실행 변경 0

## 7. 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v1.0 | 2026-10-25 | 사용자 결정(로딩 · 진행 표시는 느리게) 반영, 분류표 22곳 · 주기 표, 구현 중 발견 5.1 |
