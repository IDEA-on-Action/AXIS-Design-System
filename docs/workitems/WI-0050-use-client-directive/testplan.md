# WI-0050 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-20 | 브랜치: `fix/wi-0050-use-client` | 환경: Node 20, tsup(esbuild), turbo 2.7.5, RSC 하네스는 워크스페이스 react 19.2.3 + react-server-dom-webpack 19.2.3(`react-server` 조건), Next 실빌드는 create-next-app 15.5.28 · react 19.1.0
> 범례: 통과 / 실패 / **미측정**(이 문서 작성 시점까지 실행하지 않음). 결과는 구현 단계별 실행 기록이며 통합 브랜치에서 다시 돌린 값이 아닙니다. 「재실행」 표시는 문서 단계에서 현 작업 트리로 다시 돌린 값입니다.
> 판정 방식: 기준선(현행 소스를 같은 명령으로 빌드한 dist, 또는 npm 1.4.0 tarball)과 신판을 같은 방법으로 재서 A/B 로 비교했습니다.

## 1. 패키지 단위 품질 게이트

| # | 대상 | 명령 | 결과 |
|---|---|---|---|
| Q1 | `@axis-ds/ui-react` | `build` · `test` · `check-exports` | rc 0. 테스트 110개 통과, exports 32항목 일치. postbuild `파일 68개, 상대 import 보정 126건, "use client" 4개 파일(목록 2개 x ESM · CJS)` |
| Q2 | `@axis-ds/ui-react` | `type-check` · `lint` (재실행) | rc 0 · rc 0. 양성 대조: `src/` 에 타입 오류 파일 하나를 넣으면 `type-check` rc 2(TS2322 1건), 지운 뒤 작업 트리 원상 |
| Q3 | `@axis-ds/agentic-ui` | `turbo run build test type-check lint --filter=@axis-ds/agentic-ui --force` | Tasks 6/6, Cached 0/6. 테스트 72개 통과. postbuild `파일 40개, 상대 import 보정 58건, "use client" 14개 파일(목록 7개 x ESM · CJS), 서브패스 엔트리 18개 exports 대조` |
| Q4 | `@axis-ds/agentic-ui` | `type-check` · `lint` (재실행) | rc 0 · rc 0. 양성 대조: Q2 와 같은 방법으로 `type-check` rc 2 |
| Q5 | `@axis-ds/theme` | `build` · `test` · `turbo run build test --filter=@axis-ds/theme --force` | rc 0, 테스트 31개 통과(`theme.ssr.test` 포함), Cached 0/3. tsup 로그 warn · error · directive · ignored 0줄 |
| Q6 | `@axis-ds/theme` | `eslint src` · `tsc --noEmit` | eslint rc 0(양성 대조: curly 규칙 주입 시 rc 1, 6건). tsc 오류 12건은 전부 `theme.test.tsx` 의 vi · jest-dom 타입(변경 전부터 있음), `index.ts` 오류 0 |
| Q7 | 루트 | `pnpm pack-smoke` (재실행, 현 작업 트리 dist) | rc 0, 6개 패키지 통과. G1 · G2 결과는 5절 |
| Q8 | `.changeset` | `pnpm exec changeset status --verbose` (재실행) | rc 0. minor: ui-react · agentic-ui · theme 1.5.0. patch: `axis-nextjs-example` 0.1.7(내부 의존 갱신). `@axis-ds/tokens` 는 변경이 없어 1.4.0 그대로(9절 참고) |
| Q9 | 루트 | `pnpm exec turbo run type-check\|lint\|build\|test --force` | **미측정** (AC5) |
| Q10 | `apps/web` | `pnpm build:web` | **미측정** |

## 2. FR-1 빌드 산출물

| # | 내용 | 결과 |
|---|---|---|
| B1 | 지시문 파일 집합(ui-react) | 정확히 `avatar/avatar.{mjs,js}` · `command/index.{mjs,js}` 4개. 루트 `index` · `utils` · `avatar/index` · `avatar/variants` 에는 없음 |
| B2 | 지시문 파일 집합(agentic-ui) | 정확히 14개(목록 7개 x ESM · CJS). 루트 `index` · `constants` · 나머지 11개에는 없음. grep 결과와 postbuild 집계 일치 |
| B3 | CJS 지시문 위치 | 목록 파일 `.js` 는 1행 `"use client";`, 2행 `"use strict";`(ui-react · agentic-ui, postbuild 삽입). theme `dist/index.js` 는 1행 `"use strict";`, 2행 `"use client";`(esbuild). 둘 다 지시문 프롤로그 안 |
| B4 | chunk | ui-react · agentic-ui `dist` 의 `chunk-*` 0개(기준선 ui-react 31개 · agentic-ui 19개) |
| B5 | `clean:true` | `dist` 에 `chunk-STALEMARK.mjs` 표식을 심고 빌드하면 표식과 이전 chunk 가 모두 사라짐 |
| B6 | postbuild 검사 | 목록 밖 파일의 지시문 · 상태 훅 · createContext · DOM 인라인 핸들러를 찾으면 빌드 실패. 확장자 보정 대상 파일이 없으면 실패 |
| B7 | tarball(agentic-ui) | 84개 파일, `scripts/` · `tsup.config.ts` 미포함 |
| B8 | theme 산출물 diff | 기준선 대비 다른 곳은 지시문 줄뿐, `index.d.ts` · `index.d.mts` 같음(diff rc 0) |

## 3. FR-2 · FR-5 하위 호환 (AC3 일부)

| # | 내용 | 결과 |
|---|---|---|
| C1 | ui-react exports 맵 | 기준선 · 신판 모두 32항목, 같음 |
| C2 | ui-react 진입점 31개 | ESM · CJS 런타임 이름 목록 31/31 같음(재실행 대조), d.ts 진단 0 |
| C3 | ui-react d.ts 공개 심볼 | 루트 132개(타입 10개 포함)와 심볼별 타입 문자열 같음 |
| C4 | agentic-ui exports | 14 → 20항목. 더해진 6개는 agent-avatar · recovery-banner · source-panel · step-timeline · surface-renderer · thinking-indicator, 빠진 항목 0 |
| C5 | agentic-ui 기존 진입점 13개 | 런타임 이름 · d.ts 결과 13/13 같음(재실행 대조), d.ts 진단 0 |

## 4. RSC 하네스 A/B (AC1 · AC2 의 서버 렌더 부분)

react-server 조건으로 컴포넌트를 렌더하고 서버 함수를 호출한 결과입니다. 「경계」는 클라이언트 참조로 렌더, 「서버」는 서버에서 렌더, 「호출」은 서버 함수 호출 통과입니다.

| 패키지 | 기준선 | 신판 |
|---|---|---|
| ui-react | 경계 146 · 서버 70 · 호출 15 · **실패 14**(Avatar, CommandEmpty · Group · Input · Item · List · Separator 를 루트 · 서브패스에서 각각) | 경계 167 · 서버 81 · 호출 15 · 실패 0 |
| agentic-ui | 서버 17 · **실패 19**(useState 7종 루트 7건 + 서브패스 6건(source-panel 은 서브패스 없음) + exports 누락 서브패스 6개 import 실패) | 경계 14 · 서버 22 · 실패 0 |
| theme | import 단계에서 `React.createContext is not a function`(결과 행 없음) | `ThemeProvider` 경계, `useTheme` 서버 호출 FAIL(훅이라 정상, 허용) |

- 서버 호출 15건: ui-react 루트 8개(`cn` · `alertVariants` · `avatarVariants` · `badgeVariants` · `buttonVariants` · `progressIndicatorVariants` · `progressVariants` · `toggleVariants`)와 서브패스 7개. 신판에서도 모두 통과(AC2, D2).
- Radix 래퍼는 기준선 · 신판 모두 경계로 통과해 목록에 넣지 않았습니다.

## 5. 회귀 게이트 G1 · G2 (FR-6 · AC4)

| # | 대상 | G1(정적, 재실행) | G2(RSC, 재실행) |
|---|---|---|---|
| R1 | 현 작업 트리(`pnpm pack-smoke`) | 실패 0. ui-react JS 68 · 지시문 4(목록 2) · 서버 호출 함수 8 · "use client" 의존 17, agentic-ui JS 40 · 지시문 14(목록 7) · 의존 1(framer-motion), theme JS 2 · 지시문 2 | 결함 0. spec 51 · 행 283(렌더 267 중 경계 175 · 호출 15 · 훅 1 · import 실패 0) |
| R2 | ui-react Avatar 지시문 제거 변이 | 실패 2건(`avatar/avatar.mjs` · `.js` 지시문 없음) | rc 1, 결함 2건(Avatar 루트 · 서브패스 `useState is not a function`) |
| R3 | ui-react 루트 배럴 지시문 추가 변이 | 실패 2건(루트 `index.mjs` · `.js` 지시문 있음) | rc 1, 결함 30건(`cn` · `*Variants` 서버 호출 불가 등) |
| R4 | theme 지시문 제거 변이 | 실패 2건(`index.mjs` · `.js` 지시문 없음) | rc 1, 결함 1건(import 실패 `createContext is not a function`) |
| R5 | npm `@axis-ds/ui-react@1.4.0` tarball | 실패 12건(목록 파일 부재 · command 지시문 없음 등) | rc 1, 결함 14건(Avatar · Command 6종 x 루트 · 서브패스) |

- G2 는 측정 실패(패키지 · tarball 미발견, 설치 버전 불일치, react-server 조건 미적용, spec 결과 0행)를 통과로 넘기지 않고 rc 2 로 끝냅니다.
- CI(frontend.yml 「Pack smoke」 · publish.yml)에서 G2 를 실제로 돌린 적은 **미측정**입니다.

## 6. theme Next 실빌드 (AC1 의 ThemeProvider 부분)

create-next-app 15.5.28 · react 19.1.0 앱의 서버 `app/layout.tsx` 에서 `<ThemeProvider defaultTheme="dark">` 를 쓰고 변형마다 `.next` 를 치운 뒤 `next build`.

| dist 변형 | ESM `import` | CJS `require` |
|---|---|---|
| 기준선(지시문 없음) | 실패 `Failed to collect page data for /` | 실패 `Failed to collect page data for /_not-found` |
| 신판 | 통과(Static prerender) | 통과(Static prerender) |
| `.mjs` 지시문만 제거 | 실패 | - |
| `.js` 지시문만 제거 | - | 실패 |

- CJS 변형이 실패에서 통과로 바뀌므로, Next 15.5.28 webpack 빌드는 `"use strict"` 다음 줄의 `"use client"` 를 인식합니다(theme 단일 파일 기준).

## 7. 미측정

| 항목 | 상태 |
|---|---|
| AC1: ui-react · agentic-ui 실패 대상 전부의 Next 실빌드(`next build` · 렌더) | **미측정**(verify-render 단계 항목) |
| AC1: Playwright 상호작용(Dialog 열기 · CodeBlock 복사 · Avatar 이미지 오류 대체) | **미측정** |
| ui-react · agentic-ui CJS 산출물(`"use client"` 다음 `"use strict"`)이 Next require 경로에서 인식되는지 | **미측정**. theme(순서 반대)만 6절에서 확인 |
| AC3: 클라이언트 컴포넌트 페이지(`"use client"`) 실앱 동작 | **미측정**(단위 테스트 · exports · d.ts 대조만 통과) |
| AC5: 루트 `turbo run type-check\|lint\|build\|test --force` | **미측정** |
| Turbopack · `next dev` · Next 16 | **미측정** |
| `dev` 스크립트(`tsup --watch --onSuccess`)와 watch 재빌드 때 `clean:true` 동작 | **미측정** |
| CI 에서 G2 실행(레지스트리에서 76개 패키지 설치) | **미측정** |
| ui-react · agentic-ui `lint` 양성 대조 | **미측정**(theme 만 Q6 에서 확인) |
| 서버 그래프 크기(First Load JS): agentic-ui 서브패스 하나만 import 해도 ui-react 루트 배럴 때문에 Radix 등 클라이언트 참조 19개가 실림 | 기록만(1.4.0 에도 있음, PRD 4절) |

## 8. 문서 (FR-7)

| # | 내용 | 결과 |
|---|---|---|
| D1 | README 예시 props 가 실제 타입과 맞는지 | 수작업 대조: `Avatar`(`src` · `alt` · `fallback`, 하위 컴포넌트 없음), `StreamingText`(`text`), `MessageBubble`(`role` · `content`), `CodeBlock`(`code` · `language`), `FeedbackButtons`(`messageId` · `onFeedback`). 예시 코드의 컴파일 · 렌더는 **미측정** |
| D2 | README 경계 표의 Radix 목록 | G1 이 판정한 "use client" 의존 17개와 대조(`@radix-ui/react-separator` 와 Button · Breadcrumb 의 `@radix-ui/react-slot` 은 그 17개에 없어 「없음(서버에서 렌더)」 쪽에 둠) |

## 9. 확인 필요

- `.changeset/config.json` 의 `linked` 는 변경이 있는 패키지끼리만 버전을 맞춥니다. 이번 changeset 은 tokens 를 올리지 않아 `changeset status` 기준 tokens 1.4.0 · 나머지 1.5.0 이 됩니다. 4패키지를 같은 버전으로 낼지는 별도 판단입니다.

## 10. 배포본 확인 (2026-10-21, publish run 39496056901)

npm 배포본 1.5.0 만 정확한 버전으로 설치해 새 디렉터리에서 쟀습니다(대조군 1.4.0).

| 대상 | 1.5.0 | 1.4.0(대조군) |
|---|---|---|
| create-next-app 15.5.28 서버 layout(ThemeProvider) + 지시문 없는 서버 page(Avatar · Command · CodeBlock · StreamingText · ToolCallCard · DiffViewer · Button · Card · Dialog · Select · MessageBubble · PlanCard) + 서버 호출 page + 클라이언트 page | `next build` rc 0(11/11), 콘솔 오류 0(수집기 양성 대조 확인) | 전체 rc 1(createContext), 경로별: Avatar · CodeBlock useState 실패, Command `Element type is invalid`, Button 등 · 서버 호출은 통과 |
| 상호작용(Playwright) | Command 필터링 · CodeBlock 복사(클립보드 원문) · Dialog 열기/Esc · Select 변경 통과 | 빌드 실패로 미측정 |
| 서버 `cn` · `buttonVariants` · `avatarVariants` · `badgeVariants` | 1.4.0 서버 page · 클라이언트 page 출력과 문자열 일치(`cn` 은 tailwind-merge 적용값) | 기준 |
| pnpm 사본 | layout + Avatar · CodeBlock 빌드 rc 0 | |
| Node CJS · ESM | 루트 · 서브패스 로드, 내보내기 이름 수 1.4.0 과 같음(ui-react 122 · agentic-ui 18 · theme 2), agentic-ui 새 서브패스 6개 로드 | 새 서브패스 `ERR_PACKAGE_PATH_NOT_EXPORTED` |
| Vite 6 + plugin-react SPA | build rc 0, 렌더 확인, 경고 0줄 | 같음 |
| Vite plugin-react 없음 | `"use client" was ignored` 경고 3건 증가(@axis-ds 파일), rc 0 | 0건 |
| TypeScript bundler | `tsc --noEmit` rc 0 | rc 0 |
| TypeScript node10 | 서브패스 TS2307(WI-0053 기존 결함, 서브패스 6개 증가분만 증가) | 같은 형태 |

관찰: Avatar 는 서버 렌더된 깨진 이미지를 하드 로드했을 때 fallback 으로 바뀌지 않습니다(1.4.0 클라이언트 page 에서도 같음, WI-0054 #148). 소프트 내비게이션에서는 정상입니다.

미측정: next dev · Turbopack, Next 16, 1.4.0 런타임(빌드 실패), pnpm 사본 런타임, 다크 · 브랜드 전환.

