# WI-0050: 서버 컴포넌트(RSC) 호환 - "use client" 지시문 PRD

> 작성일: 2026-10-20 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0050 | GitHub: #143 | 우선순위: P1 | 상태: Approved (2026-10-20 결정 반영)
> 기준: `origin/main` efd1741 (linked 4패키지 1.4.0 배포 완료)
> 관련: WI-0044(#134) 배포본 확인에서 발견. 실측 워크플로 `wf_03f8f50c-125`(측정 3 · 반박 검증 9 · 설계 1 에이전트)

---

## 1. 개요

### 1.1 배경
`@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme` 의 소스와 배포본 dist 에 `"use client"` 지시문이 없습니다. Next.js App Router 의 서버 컴포넌트(create-next-app 기본 `page.tsx` · `layout.tsx`)에서 일부 컴포넌트를 쓰면 `next build` 가 실패합니다. 1.2.1 · 1.3.0 에도 있는 기존 결함입니다.

### 1.2 실측 (배포본 1.4.0, create-next-app 15.5.28 · react 19.1.0, 컴포넌트 단독 페이지 94개)

| 패키지 | 실패 | 원인 |
|---|---|---|
| ui-react | `Avatar` | `useState` → `X.useState is not a function` |
| ui-react | `CommandInput` · `CommandList` · `CommandItem` · `CommandSeparator` · `CommandGroup` · `CommandEmpty`(`<Command>` 단독은 통과) | cmdk 가 `"use client"` 모듈이라 서버에서 `CommandPrimitive.Input` 같은 점 접근이 undefined → `Element type is invalid` |
| agentic-ui | `CodeBlock` · `ContextPanel` · `DiffViewer` · `FeedbackButtons` · `SourcePanel` · `StreamingText` · `ToolCallCard` | `useState`(StreamingText 는 `useEffect` · `useRef` 도) |
| theme | `ThemeProvider`(import 만 해도) | 모듈 최상위 `createContext` → `Collecting page data` 단계에서 빌드 전체 중단 |

- 통과: Radix 기반 컴포넌트 전부(Radix dist 의 `"use client"` 로 경계가 생김), Button · Card 등 순수 컴포넌트, agentic-ui 나머지 11개. 루트 `.` import 와 서브패스 import 결과가 같습니다.
- 서버에서 지금 동작하는 것: `cn` 과 `*Variants` 7개(`button` · `toggle` · `alert` · `badge` · `progress` · `progressIndicator` · `avatar`), 합 8개 함수 호출(2026-10-20 사실 정정: 종전 표기 「`*Variants` 8개」는 `cn` 을 포함한 수). agentic-ui 서버 렌더 가능 컴포넌트 11개가 루트 배럴에서 `cn` 을 import 합니다.
- 빌드 제약: tsup(esbuild) splitting 은 `"use client"` 를 공용 chunk 로 옮기지 않습니다(0/31). 엔트리 지시문 · banner · no-splitting 어느 쪽이든 루트까지 클라이언트가 되어, 서버의 `cn()` · `*Variants()` 호출이 `Attempted to call X() from the server` 로 깨집니다(실측, 회귀).
- 시제품: 모듈 보존 빌드(bundle:false)에 명시한 파일에만 지시문을 붙이면, 실패 대상이 경계가 되고 서버의 `cn` · `buttonVariants` 호출이 유지됩니다(`avatarVariants` 는 `useState` 와 같은 파일이라 실패, 분리 필요).
- 범위 밖: 서버 컴포넌트에서 함수 prop(onClick 등)을 넘기는 것은 RSC 계약상 원래 불가합니다.

### 1.3 결정 (2026-10-20 사용자)

| # | 결정 |
|---|---|
| D1 | 방안 C: ui-react · agentic-ui 빌드를 모듈 단위 출력(bundle:false 등 모듈 보존)으로 바꾸고, 클라이언트 요소가 필요한 파일의 명시 목록에만 `"use client"` 를 둡니다. 루트 배럴 · `cn` · `*Variants` 는 지시문 없이 서버에서 호출 가능하게 유지합니다. minor |
| D2 | `avatarVariants` 는 지시문 없는 별도 파일로 분리해 서버 호출을 유지합니다. 루트 · avatar 서브패스 내보내기 이름은 그대로 |
| D3 | 범위에 theme(`ThemeProvider` 등 클라이언트 전용, 전 파일 지시문으로 충분)와 agentic-ui exports 누락 서브패스 6개(agent-avatar · recovery-banner · source-panel · step-timeline · surface-renderer · thinking-indicator)를 포함합니다. 레지스트리(`apps/web/public/r`) 소스는 범위 밖(WI-0045 와 함께 별도) |
| D4 | 회귀 게이트: G1 정적 검사(`scripts/pack-smoke.mjs`: 목록 파일에는 지시문, 루트 · 유틸에는 없음, 목록 밖 파일에 상태 훅 · createContext 없음)와 G2 RSC 하네스(`scripts/pack-install-smoke.mjs`: react-server 조건 렌더 실패 0, 서버 `cn` · `*Variants` 호출 통과). Next 실빌드(G3)는 CI 에 넣지 않고 구현 검증에서 실측 |

## 2. 요구사항

- FR-1: ui-react · agentic-ui 빌드 산출물(ESM · CJS · d.ts)이 모듈 구조를 보존하고, 명시 목록 파일의 ESM · CJS 출력 맨 앞(CJS 는 `"use strict"` 뒤 허용 여부를 실측으로 확인)에 `"use client"` 가 남습니다. 목록은 소스의 단일 위치에서 관리하고 판정 근거(상태 훅 · context · cmdk 점 접근 등)를 주석으로 남깁니다.
- FR-2: 루트 `.` 와 기존 서브패스 exports 경로 · 이름이 바뀌지 않습니다(하위 호환). ui-react `sync-exports` · `check-exports` 와 충돌하지 않습니다.
- FR-3: `avatarVariants` 를 별도 파일로 분리합니다(D2).
- FR-4: theme 의 클라이언트 전용 모듈에 `"use client"` 를 둡니다. theme 가 서버에서 쓸 수 있는 비컴포넌트 내보내기(있다면)를 확인해 처리합니다.
- FR-5: agentic-ui exports 에 누락 서브패스 6개를 더합니다.
- FR-6: G1 · G2 게이트를 pack-smoke · pack-install-smoke 에 넣습니다. 음성 대조(지시문 제거 · 현행 1.4.0 tarball)에서 실패하는지 확인합니다.
- FR-7: 문서: 패키지 README 에 서버 컴포넌트 사용(서버에서 함수 prop 은 불가, `cn` · `*Variants` 는 서버 호출 가능) 안내.

## 3. 수용 기준

- AC1: create-next-app 15.5.28 서버 컴포넌트 페이지에서 1.2 표의 실패 대상 전부가 `next build` 를 통과하고 렌더되며, next start 후 상호작용(Dialog 열기 · CodeBlock 복사 · Avatar 이미지 오류 대체)이 동작합니다(Playwright). 서버 layout 에서 `ThemeProvider` 를 쓰면 빌드가 통과합니다.
- AC2: 서버 컴포넌트에서 `cn` · `buttonVariants` · `avatarVariants` 등 8개 호출이 루트 · 서브패스 모두 동작합니다(현행과 같은 결과).
- AC3: 클라이언트 컴포넌트 페이지(`"use client"`)의 동작이 그대로이고, 기존 테스트 · exports · d.ts 타입이 유지됩니다.
- AC4: G1 · G2 가 pack-smoke 에서 통과하고, 지시문 제거 변이와 현행 1.4.0 에서 실패합니다.
- AC5: `pnpm exec turbo run type-check|lint|build|test --force` · `pnpm pack-smoke` 통과.

## 4. 범위 밖 · 미측정
- 레지스트리 복사 소스의 지시문(WI-0045 와 함께), Turbopack · dev 모드, Next 16 은 가능한 범위에서 실측하고 못 한 것은 testplan 에 남깁니다.
- 서버에서 루트 배럴을 import 하면 Radix 클라이언트 참조가 실려 First Load JS 가 커지는 현상(현행에도 있음)은 기록만 합니다.
