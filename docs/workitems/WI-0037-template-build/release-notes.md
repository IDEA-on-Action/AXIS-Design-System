# WI-0037 릴리스 노트: 템플릿을 그대로 빌드되는 구조로

> 작성일: 2026-10-24 | WI: WI-0037 | GitHub: #119 | 반영: 템플릿 JSON 은 pages.dev 배포, cli 변경은 `@axis-ds/cli` minor(묶음 ③ changeset)

## 변경 사항

- 템플릿 4종(theme-only · dashboard · landing-page · hr-dashboard)을 create-next-app 구조로 바꿨어요. `app/layout.tsx` · `app/page.tsx` · `app/globals.css` 와 `postcss.config.mjs` 가 들어 있어 `axis template init` 뒤 `npm install` · `next build` 가 그대로 통과하고 Tailwind 유틸리티가 생성돼요
- Tailwind 3 에 맞게 `tailwind-merge` 를 `^2.6.0` 으로 내리고, TypeScript 빌드에 필요한 `@types/node` 를 넣었어요
- 템플릿 설명에서 사실과 다른 「AXIS 디자인 토큰 적용」 서술을 「CSS 변수(HSL) 기반 자체 테마(AXIS 토큰 패키지 미사용)」로 고쳤어요. AXIS 토큰 · 컴포넌트로 바꾸는 일은 WI-0067 에서 해요
- `axis template init` 이 기록하는 `globalCss` 가 `./app/globals.css` 예요(종전 `./globals.css`)
- `axis template apply` 는 기존 프로젝트의 Tailwind major 가 템플릿과 다르거나 `src/app` 이 있으면 경고해요(파일 쓰기는 그대로)
- 문서 사이트 템플릿 상세의 「설치」 탭이 `npx @axis-ds/cli template init <slug>` 경로를 안내해요
- 루트 `pnpm template-smoke` 로 4종을 실제로 빌드하고 CSS 내용으로 판정할 수 있어요(네트워크 필요)

## 남겨 둔 것

- cli 1.5.4 로 만든 템플릿 프로젝트의 config 는 `globalCss: "./globals.css"`(없는 경로)예요. theme add · check 는 후보 탐색으로 동작하고, 새 cli 의 `axis init` 재실행이 찾은 파일로 바꿔 알려요
- 커밋돼 있던 `apps/web/public/templates/index.json` 은 data/ 의 외부 블록 3개(decode-x-kit)가 빠진 오래된 생성물이었어요. 이번 재생성으로 42개(로컬 4 · 외부 38)가 됐어요. 사이트 빌드(`build:web`)는 원래 이 파일을 다시 만들므로 배포본과는 같아요
