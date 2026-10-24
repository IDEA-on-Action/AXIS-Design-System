# WI-0037: 템플릿 원형 빌드 실패(app 디렉터리 · postcss 설정 없음) 수정 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0037 | GitHub: #119 | 우선순위: P2 | 상태: Approved (2026-10-24 배치 2 결정 반영)
> 기준: `main` 59dd6a3 (cli 1.5.4 · mcp 1.3.2, linked 4패키지 1.6.0)
> 묶음: 배치 2 묶음 ③(WI-0037 · WI-0041 · WI-0049 · WI-0065), 브랜치 `feat/wi-0037-0041-0049-0065-init-theme`
> 분리: 템플릿을 AXIS 토큰 · 컴포넌트 기반으로 바꾸는 일은 WI-0067(#181)

---

## 1. 개요

### 1.1 문제 (측정, 2026-10-24)

- `axis template init <slug>` 로 펼친 템플릿 4종(theme-only · dashboard · landing-page · hr-dashboard)이 `npm install` 뒤 `next build` 에서 4/4 rc 1 이었어요. layout · page · globals 가 루트에 평면으로 놓여 `app/` 이 없었고(`Couldn't find any pages or app directory`), `postcss.config` 도 없었어요
- 음성 대조(측정): `app/` 으로만 옮기고 postcss 설정이 없으면 build 는 rc 0 인데 생성 CSS 에 `@tailwind` 가 그대로 남고 `.bg-background` 가 0건이에요. 빌드 rc 로는 스타일 적용을 증명하지 못해요
- 템플릿이 `tailwindcss ^3.4.0` 과 `tailwind-merge ^3.4.0`(Tailwind 4 용)을 함께 선언해 3.x 가 설치됐어요
- 템플릿 원본에는 `@axis-ds` 참조가 0건이고 자체 HSL 변수를 쓰는데, features · description 이 「AXIS 디자인 토큰 적용」「AXIS 컴포넌트를 활용한」이라고 적혀 있었어요
- 이번 작업에서 새로 찾은 것(측정): `CI=1` 로 빌드하면 템플릿에 `@types/node` 가 없어 4/4 rc 1 이었어요(Next 가 TypeScript 빌드에 요구). hr-dashboard 는 `./lib/demo-data` import 경로도 `app/` 이동 뒤 깨져요

### 1.2 결정 (2026-10-24 사용자, 브리프 권장안 일괄 채택 + 반박 검토 major 반영)

| # | 결정 |
|---|---|
| D1 | layout · page · globals(theme-only 는 theme-toggle 포함)를 `app/` 으로 옮기고 `postcss.config.mjs`(tailwindcss · autoprefixer)를 넣어요. `createTemplateConfig` 의 globalCss 를 `./globals.css` 에서 `./app/globals.css` 로 바꿔요 |
| D2 | Tailwind 3 을 유지하고 `tailwind-merge` 를 `^2.6.0` 으로 내려요(init 의 Tailwind 3 규칙 · ui-react 범위와 같음) |
| D3 | 빈 디렉터리의 `template init` 을 보장하고(next build + CSS 내용 스모크로 고정), 기존 프로젝트 `apply` 는 Tailwind major 가 다르거나 `src/app` 이 있으면 경고만 해요. 사이트 SetupTab 안내도 `template init` 경로로 바꿔요 |
| D-범위 | 템플릿은 구조 수정 + features · description 정정만 해요(AXIS 전환은 WI-0067). 반박 검토의 「빠진 결정: 템플릿 AXIS 전환 범위」에 대한 결정이에요 |
| D-보정 | 측정으로 찾은 `@types/node ^20` 누락과 hr-dashboard `../lib` import 경로도 함께 고쳐요(구조 수정의 일부) |
| 릴리스 | 템플릿 JSON 은 pages.dev 배포로 반영돼요. `createTemplateConfig` · apply 경고는 cli 에 들어가 묶음 ③ 의 cli minor 에 포함돼요(WI-0065 D9) |

## 2. 수용 기준

- AC1 템플릿 4/4 를 `template init` → `npm install` → `next build`(CI=1) 로 실행해 생성 CSS 에 `@tailwind` 0건 · `.bg-background` 1건 이상(rc 가 아니라 CSS 내용으로 판정)
- AC2 음성 대조: 고치기 전 템플릿 JSON 은 같은 스모크에서 FAIL, postcss 를 뺀 변형은 build rc 0 이어도 FAIL
- AC3 템플릿 4종의 `tailwind-merge` 가 init 규칙값(^2.6.0)과 같음(종전 「알려진 불일치」 테스트를 정합 테스트로)
- AC4 `apply` 경고: 빈 디렉터리 0건, Tailwind 4 프로젝트 · `src/app` 있는 프로젝트에서 각 1건, 같은 major 는 0건
- AC5 features · description 에 사실과 다른 「AXIS 토큰 · 컴포넌트」 서술이 없음

## 3. 범위 밖

- 템플릿의 AXIS 토큰 · ui-react 전환(WI-0067), 애니메이션 플러그인 안내의 템플릿 반영(WI-0046 · WI-0067)
- `apply` 로 create-next-app 위에 덮어썼을 때의 빌드 보장(WI-0027 AC2 는 그 WI 에서 다시 정함)
- 구버전 cli(1.5.4) 사용자: config 에 `./globals.css`(없는 경로)가 기록돼요. theme add · check 는 후보 탐색으로 `app/globals.css` 를 찾고, 새 cli 의 init 재실행은 찾은 파일로 바꿔 알려요(WI-0041 D5)
