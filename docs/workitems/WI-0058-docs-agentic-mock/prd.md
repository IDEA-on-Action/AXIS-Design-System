# WI-0058: 문서 사이트 agentic 페이지의 mock 을 실제 컴포넌트로 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0058 | GitHub: #157 | 우선순위: P3 | 상태: Approved (2026-10-24 결정 반영)
> 기준: `main` 59dd6a3 (배치 1 머지 뒤). 배치 2 브리프 측정 기준은 18fac64 이고, 그 사이 `apps/web/src/app/(docs)/agentic` · `packages/axis-agentic-ui` · `apps/web/e2e` 변경은 0줄이에요(`git diff --stat 18fac64 HEAD`)
> 관련: WI-0052(#146) 에서 분리. 컴포넌트 대비 결함은 WI-0062(#170), 비대비 결함은 WI-0069(#183), `/components` mock 은 WI-0066(#180)

---

## 1. 개요

### 1.1 문제 (실측, 배치 2 브리프)

- `/agentic` 하위 문서 18페이지 가운데 `@axis-ds/agentic-ui` 를 실제로 import 하는 페이지가 0개였어요. import 문은 `basicExample` 같은 코드 문자열 안에만 있었어요
- 17페이지는 페이지 안에 mock 컴포넌트를 정의했고, `surface-renderer` 는 mock 도 없이 Tailwind HTML 을 직접 적은 모조 데모였어요. 이 페이지는 코드 예시도 `import { SurfaceRenderer } from '@axis-ds/ui-react'` 로 틀렸고, 설명한 API(`A2UISurface` · `context.onAction` · message/card/progress 등 10종)도 패키지의 `SurfaceRenderer`(`surface` · `renderCustom` · `className`, type 6종)와 달랐어요
- `approval-dialog` 는 패키지에 없는 `ApprovalDialog`(open · impact · changes 등)를 설명했어요. 패키지에 있는 것은 `ApprovalCard`(title · description · severity · actions · children · id · className)예요
- mock 은 없는 결함을 보여 주기도 하고 있는 결함을 가리기도 했어요(브리프 측정: attachment-card 다크 위반 15 → 0, diff-viewer 라이트 8 → 35, message-bubble 0 → 2)
- 페이지 쪽 결함: message-bubble · step-timeline 페이지에서 React #418(하이드레이션 불일치). 데모 데이터가 렌더 중에 `new Date()` 를 만들어 정적 빌드 시각과 브라우저 시각이 달라요. token-usage-indicator 데모 슬라이더에 label 연결이 없어요

### 1.2 범위

- 교체: 16페이지(agent-avatar · attachment-card · code-block · context-panel · diff-viewer · feedback-buttons · message-bubble · plan-card · recovery-banner · run-progress · source-panel · step-timeline · streaming-text · thinking-indicator · token-usage-indicator · tool-call-card)의 mock 을 지우고 실컴포넌트를 import
- surface-renderer: 실제 `SurfaceRenderer` 로 렌더하고 Props · type · 코드 예시를 실제 API 로 다시 씀
- approval-dialog: 경로는 두고 내용을 `ApprovalCard` 문서와 실렌더로 바꿈. 사이드바(`config/docs.ts`) · agentic 인덱스 라벨을 `ApprovalCard` 로
- 페이지 결함: #418(데모 시각을 마운트 뒤 클라이언트에서만 만듦), 슬라이더 label 연결, surface-renderer import 경로
- 범위 밖: 컴포넌트 결함(대비는 WI-0062, 비대비는 WI-0069), `/components` mock(WI-0066, progress 는 WI-0046), a11y 게이트 PAGES 확장(WI-0062)

## 2. 결정 (2026-10-24 사용자, 배치 2 브리프 권장안 일괄 채택 + 반박 검토 major 지적 반영)

| # | 결정 | 반영한 major 지적 |
|---|---|---|
| D1 범위 | 16페이지 일괄 교체 + surface-renderer 실렌더(교체 뒤 재측정). `/components` 는 범위 밖(WI-0066) | surface-renderer 는 브리프에서 측정하지 않았으므로 이 WI 에서 교체 뒤 처음 잰다. `/components` mock 5페이지는 별도 WI(WI-0066, progress 는 WI-0046) |
| D2 approval | 경로 `/agentic/approval-dialog` 유지 · 내용을 ApprovalCard 로 교체. cli 는 손대지 않음 | 근거에 WI-0057 D3(라우트 실재 확인, 없으면 별칭 표 `approval-card → approval-dialog`) · AC4 를 더함 |
| D3 드러난 결함 | 페이지 쪽만 이 WI 에서 고치고, 컴포넌트 대비는 WI-0062, 비대비는 WI-0069 | #418 처방을 "데모 시각은 마운트 뒤 클라이언트에서만 만든다"로 구체화. 컴포넌트가 timeZone 없이 시각을 포맷해 SSR 소비자 전반에 생기는 불일치는 WI-0069 에 둠 |
| D4 a11y PAGES | 게이트 PAGES 는 그대로 두고 측정만 testplan 에 첨부 | 측정은 기본 · ontology 두 브랜드로 잼(브리프는 기본만) |

## 3. 구현하며 정한 것 (사용자 결정 아님, 검토 대상)

| # | 내용 | 근거 |
|---|---|---|
| I1 | 시각 생성은 `apps/web/src/lib/use-client-now.ts` 의 `useClientNow()`(마운트 뒤 `Date.now()`, 그 전에는 null) 한 곳에 둠 | 두 페이지가 같은 처방을 씀. 첫 렌더에 시각을 그리지 않으므로 빌드 환경의 시간대 · 로케일과 무관해져, 리뷰가 착수 조건으로 둔 "고정 timestamp · TZ=UTC 빌드" 재측정 없이도 원인이 사라짐(교체 뒤 콘솔 오류 0 으로 확인, testplan) |
| I2 | 문서 Props 표에 빠진 prop 3개를 더함(streaming-text `className`, tool-call-card `description` · `className`) | 브리프 Props 이름 대조에서 드러난 누락. 표만 고침 |
| I3 | approval-dialog 데모의 `alert()` 를 화면 안 결과 문구(`aria-live="polite"`)로 바꿈 | 측정 spec 이 대화상자에 막히지 않게 하고, 데모 결과를 보조기기에도 알림 |
| I4 | 설치 명령 표기(`--agentic` 유무)는 손대지 않음 | 이 WI 범위 밖. 페이지마다 표기가 다른 것은 기존 상태 그대로 |

## 4. 요구사항

| ID | 요구사항 |
|---|---|
| FR-1 | 16페이지가 페이지 안 mock 없이 `@axis-ds/agentic-ui` 의 실컴포넌트를 렌더한다 |
| FR-2 | surface-renderer 페이지가 실제 `SurfaceRenderer` 를 렌더하고, Props · type · 코드 예시가 패키지 API 와 같다 |
| FR-3 | approval-dialog 경로가 그대로 있고, 내용이 `ApprovalCard` 를 설명 · 렌더한다. 사이드바 · 인덱스 라벨은 `ApprovalCard` |
| FR-4 | message-bubble · step-timeline 페이지가 하이드레이션 오류(#418) 없이 뜬다 |
| FR-5 | token-usage-indicator 데모 슬라이더가 label 과 연결된다 |

## 5. 수용 기준 (AC)

| AC | 기준 |
|---|---|
| AC1 | `(docs)/agentic/*/page.tsx` 18개 모두 `@axis-ds/agentic-ui` 를 import 하고, 페이지 안 mock 정의(`// Mock` · `const <컴포넌트> = (`)가 0건 |
| AC2 | `apps/web` type-check · lint · build 통과(캐시 우회), tsc 는 양성 대조(일부러 넣은 오류 1건 검출)로 검사가 돌았음을 보임 |
| AC3 | 기존 a11y 게이트(`e2e/a11y.spec.ts`, static, 기본 · ontology × 라이트 · 다크 × 10페이지 = 40건) 모두 통과 |
| AC4 | 교체 뒤 18페이지를 기본 · ontology × 라이트 · 다크로 axe 측정해 testplan 에 기록하고, passes > 0 으로 미측정이 아님을 보임. 드러난 위반은 WI-0062(#170) · WI-0069(#183) 로 분류 |
| AC5 | message-bubble · step-timeline 측정에서 콘솔 · 페이지 오류 0(음성 대조: 브리프 측정에서 같은 페이지 #418) |
| AC6 | cli `axis-collector.test.ts` 의 approval-dialog 라우트 실재 확인이 그대로 통과(경로 유지) |
