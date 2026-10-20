# WI-0050: 서버 컴포넌트(RSC) 호환 - "use client" 지시문 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #143 | 상태: ✅ 완료 (2026-10-21, linked 4패키지 1.5.0 배포, 배포본 실측 통과)

## FR-1 모듈 보존 빌드 · 지시문 목록 (D1)
- [x] ui-react · agentic-ui `tsup.config.ts`: `bundle:false` · cjs · esm · dts · `clean:true`, 엔트리에서 테스트 파일 · `test-utils` 제외
- [x] build `tsup && node scripts/postbuild.mjs`(ui-react 는 뒤에 `sync-exports`), dev `tsup --watch --onSuccess "node scripts/postbuild.mjs"`
- [x] 지시문 목록 단일 위치 `packages/<pkg>/scripts/client-modules.mjs`(항목마다 근거 주석 · `reason`), 소스 파일에는 지시문 없음
  - ui-react 2개: `avatar/avatar`(useState · img onError), `command/index`(cmdk 점 접근)
  - agentic-ui 7개: code-block · context-panel · diff-viewer · feedback-buttons · source-panel · streaming-text · tool-call-card
- [x] `scripts/postbuild.mjs`: 상대 import 확장자 보정(ui-react 126건 · agentic-ui 58건), 목록 파일 ESM · CJS 맨 앞 `"use client"`(CJS 는 다음 줄 `"use strict"`), 목록 밖 파일의 지시문 · 상태 훅 · createContext · DOM 인라인 핸들러 검사, agentic-ui 는 exports 대조 추가
- [x] 산출물: 지시문 파일 ui-react 4개 · agentic-ui 14개, 루트 index · utils · constants · variants 에는 없음, chunk 0개
- [x] `clean:true` 낡은 파일 제거 확인(표식 파일 심고 빌드)
- [x] CJS 지시문(`"use strict"` 다음 줄)을 Next 가 require 경로에서 인식하는지: theme 는 확인, ui-react · agentic-ui 는 미측정(testplan 7절) (배포본 Node CJS require 로 ui-react · agentic-ui · theme 루트 · 서브패스 로드 확인, testplan 10절)

## FR-2 하위 호환
- [x] ui-react exports 32항목 · 진입점 31개 ESM · CJS 런타임 이름 · d.ts 공개 심볼(루트 132개)과 타입 문자열 기준선과 같음
- [x] agentic-ui 기존 진입점 13개 결과 기준선과 같음
- [x] `sync-exports --check` 32항목 일치

## FR-3 avatarVariants 분리 (D2)
- [x] `src/avatar/avatar.tsx`(컴포넌트, `git mv` 로 이력 유지) · `variants.ts`(지시문 없음) · `index.tsx`(배럴), 루트 · `./avatar` 내보내기 이름 그대로
- [x] RSC 하네스에서 서버 `avatarVariants()` 호출 통과(루트 · 서브패스)

## FR-4 theme (D3)
- [x] 내보내기 전수: 런타임은 `ThemeProvider` · `useTheme` 뿐, 서버용 비컴포넌트 내보내기 0개
- [x] `src/index.ts` 맨 앞 `"use client"` + 근거 주석, `dist/index.mjs` 1행 · `index.js` 2행
- [x] Next 15.5.28 서버 layout 에서 `ThemeProvider`(ESM import · CJS require 둘 다) 빌드 통과, 기준선 · 지시문 제거 변이는 실패

## FR-5 agentic-ui 서브패스 (D3)
- [x] exports 에 agent-avatar · recovery-banner · source-panel · step-timeline · surface-renderer · thinking-indicator 6개(20항목), RSC 하네스 import 통과

## FR-6 회귀 게이트 (D4)
- [x] G1 `scripts/use-client-gate.mjs`(pack-smoke 6번): 목록 파일 지시문 · 루트 배럴과 cn · *Variants 파일 지시문 없음 · 목록 밖 상태 훅 · createContext · useContext · 인라인 핸들러 · "use client" 의존 점 접근, 미수행은 실패
- [x] G2 `scripts/pack-install-smoke.mjs` `runRscSmoke` + `scripts/rsc-smoke/`: tarball 4개 설치 후 react-server 조건 렌더 · 서버 호출
- [x] 음성 대조: Avatar 지시문 제거 · 루트 배럴 지시문 추가 · theme 지시문 제거 · npm 1.4.0 tarball 에서 G1 · G2 모두 실패
- [x] CI(frontend.yml · publish.yml)에서 G2 실행 확인 (PR #145 CI · #145 · #149 publish 에서 G2 통과)

## FR-7 문서
- [x] 패키지 README(ui-react · agentic-ui · theme)에 「서버 컴포넌트 (Next.js App Router)」 절: 경계 컴포넌트 목록 · 판단 기준, 함수 prop 불가, cn · *Variants 서버 호출, ThemeProvider 서버 layout 사용
- [x] agentic-ui README 컴포넌트 목록에 빠진 6개 추가, 새 서브패스 안내
- [x] `docs/guides/troubleshooting.md`: Next.js App Router 절 · FAQ 를 1.5.0 기준으로 갱신(1.4.0 이하 래퍼 안내 유지)
- [x] changeset `.changeset/wi-0050-use-client.md`: ui-react · agentic-ui · theme minor

## 검증 · 릴리스
- [x] AC1: create-next-app 15.5.28 서버 컴포넌트 페이지에서 실패 대상 전부 `next build` 통과 · 렌더, Playwright 상호작용(Dialog 열기 · CodeBlock 복사 · Avatar 이미지 오류 대체) (배포본 1.5.0, testplan 10절)
- [x] AC3: 클라이언트 컴포넌트 페이지 동작 유지(Next 실앱) (배포본 /client · /clientw, testplan 10절)
- [x] AC5: `pnpm exec turbo run type-check|lint|build|test --force`(통합 브랜치) (PR #145 기준)
- [x] AC5 일부: `pnpm pack-smoke` rc 0(현 작업 트리 dist)
- [x] 미측정 항목 정리(Turbopack · next dev · Next 16 · dev watch) (Turbopack · next dev · Next 16 · dev watch 는 미측정으로 남김, testplan 10절)
- [x] PR 생성 · 머지 (#145, 4eb8a83)
- [x] Version PR 머지 → npm 배포 확인, 배포본으로 AC1 재확인 (#149, 8548528, publish run 39496056901, provenance 4/4)
- [x] project-todo.md · wi-mapping 현행화 (2026-10-21)
