# WI-0070: cli check · theme add 판정 정확도 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` 778e1dd + 브랜치 `fix/wi-0051-0070-0068-0072-check-brand-cjs`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 단위 테스트 (측정)

| 대상 | 결과 |
|---|---|
| cli 전체(vitest) | 726 통과 |
| mcp 전체(vitest) | 143 통과 |
| animation | 9형태 표(import 만 + `plugins []` WARN · 무관한 문자열 WARN · ESM 식별자 PASS · CJS 변수 PASS · require 직접 + 다른 플러그인 PASS · plugins 키 없음 WARN · 주석 안 require WARN · 펼침 「확인하지 못함」 · 단축 속성 「확인하지 못함」), 선언 + 참조인데 설치본 없음 「미설치(선언만 있음)」, 양성 대조 선언 없음 「선언 없음」 |
| globals.css | 자체 변수만 WARN · `--axis-*` 정의 PASS · 쓰기만 하는 `var(--axis-*)` WARN(음성 대조) · 레이아웃 JS import PASS · 주석 안 JS import WARN · Tailwind 3 body Arial WARN · 지운 뒤 PASS · Tailwind 4 는 globals PASS 이고 tailwind.config B2 에 `body font-family: Arial` |
| create-next-app 15.5.28 실물 fixture | B2 문구에 `body background: var(--background), color: var(--foreground), font-family: Arial` |
| T4-1 기준선(1e84f15 캡처) | 의도한 변경 목록을 theme-only · allPass 에서 app-init · src-app · brokenConfig 까지 넓힘(WI-0051 미설치 · WI-0070 자체 변수 WARN). emptyDir 은 기준선 그대로(음성 대조) |
| theme add 문구 | Tailwind 4 처음 실행 「기본 토큰 CSS, 브랜드 앞」, ui-react 선언 뒤 재실행 「컴포넌트 스캔 경로, 위치 무관」(브랜드 줄 뒤에 들어간 것 확인), 브랜드 줄만 있던 파일에 기본 토큰 CSS 가 뒤로 들어가면 「(기본 토큰 CSS)」 + 옮기라는 경고 · 「브랜드 앞)」 부재 |

## 2. 배포 경로 실측 (측정, 이 브랜치 pack 한 cli · MCP)

npm 으로 tokens · theme 1.6.2 · tailwindcss 3.4.19 · tailwindcss-animate 1.0.7 · clsx · tailwind-merge 를 설치한 Tailwind 3 프로젝트 f1(`const animate = require("tailwindcss-animate")` + `plugins: []`, `globals.css` 는 자체 `--background` · `--primary` + body Arial).

| 항목 | cli 1.6.0 · MCP 1.3.3 | 이 브랜치 cli · MCP(stdio) |
|---|---|---|
| animation | PASS 「tailwindcss-animate 플러그인이 있습니다」 | WARN 「tailwind.config.js plugins 에 없음」 |
| globals.css | PASS 「AXIS CSS 변수가 정의되어 있습니다」 | WARN 「자체 CSS 변수(--background · --primary)만 있고 AXIS 토큰이 없습니다」 |
| 합계 | 7 pass / 1 warn / 1 fail | 2 pass / 6 warn / 1 fail(FAIL 은 두 쪽 모두 content, 종료 코드 1 같음) |

- f3(f1 에서 preset 을 뺀 것)에 이 브랜치 `theme add ontology` 뒤 check: globals.css WARN `...(@axis-ds/tokens/css import). 다만 create-next-app 기본 body font-family: Arial 이 남아 있습니다`.
- 가이드대로 고친 f2: 8 pass / 0 warn / 0 fail(새 판정이 PASS 를 낼 수 있음을 보이는 음성 대조).

## 3. 글꼴 · postcss-import (측정)

- Tailwind 3.4.19 CLI 로 빌드한 CSS 를 Chromium 에 넣어 계산값: body `font-family: Arial` 이 있으면 `html` 은 Pretendard 스택, `body` · 클래스 없는 `<button>` 은 `Arial, Helvetica, sans-serif`, `font-sans` 를 붙인 버튼은 Pretendard. 그 줄을 지우면 셋 다 Pretendard.
- 같은 CLI 로 `@import "@axis-ds/tokens/css"` 는 rc 1 `Error: Failed to find '@axis-ds/tokens/css'`(postcss-import). `@import "@axis-ds/tokens/dist/css/variables.css"` · `shadcn-compat.css` 는 rc 0, `--axis-` 528건 · `.bg-primary` · `.rounded-lg` · `@keyframes accordion-down` 생성.
- 앱 진입점 JS import(Vite 등 번들러) 우회는 재지 않음(추정).

## 4. 남는 확인

- 템플릿 4종은 WI-0067 전까지 globals.css WARN(사용자 결정, 종료 코드 불변).
