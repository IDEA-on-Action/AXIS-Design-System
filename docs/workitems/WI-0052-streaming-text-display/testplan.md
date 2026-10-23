# WI-0052 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-23 | 기준: 8a8cd5b + 이 브랜치

## 1. 신규 단위 테스트 (AC1)

`packages/axis-agentic-ui/src/streaming-text/streaming-text.test.tsx`: fake timer 로 `speed`(10ms) 만큼씩 진행하고 화면 문자열(`span` textContent)을 읽어요. 아래 9개를 StrictMode 끔 · 켬으로 각각 돌려 18건이에요.

| # | 시나리오 | 고정하는 것 |
|---|---|---|
| A | 「스트리밍 완료 문장」 끝까지 | 처음 `""`, 중간 `스` → `스트` → `스트리`, 완료 시 text 와 같음 · `undefined` 없음, onComplete 1회 |
| A' | 「가나」 | 스트리밍 중 `aria-busy="true"`, 끝나면 `"false"` |
| B | 「가나다라」 2글자 뒤 「가나다라마바」, 다시 「…사」 | 이어 붙인 직후 `가나` 유지, 다음 tick `가나다`, 완료 `가나다라마바`, 따라잡을 때마다 onComplete 1회(누적 2회) (D1 · D2) |
| C | 「가나다」 완료 뒤 「ABC」 | 교체 직후 `""`, 다음 tick `A`, 완료 `ABC` (D3) |
| D | `isComplete=true` | 즉시 전체 표시, 커서 없음, onComplete 0회 (D1) |
| D' | 2글자 진행 뒤 `isComplete=true` | 즉시 전체 표시, onComplete 0회 |
| E | 「a😀b」 | `a` → `a😀` → `a😀b`, 서로게이트 반쪽 없음 (D4) |
| G | 빈 text 로 시작 뒤 「가나」 | 빈 동안 onComplete 0회, 흘린 뒤 1회 |
| F | 부모가 매 렌더 새 onComplete 전달 | 진행이 멈추지 않음(`가나` → `가나다라`), 최신 콜백만 1회 |

### 1.1 음성 대조 (수정 전 소스)

수정 전 `index.tsx`(8a8cd5b)로 같은 파일을 돌리면 **13 실패 · 5 통과 (18)** 예요. 통과 5건은 수정 전에도 정상인 경로(D · D' 양쪽, A' StrictMode 끔)예요. React 19 에서도 13 실패 · 5 통과로 같아요.

### 1.2 변이 (고친 핵심 줄을 하나씩 되돌림, 원복은 `cmp` 일치)

| 변이 | 잡은 테스트 (끔 · 켬 각 1건) |
|---|---|
| M1 코드 포인트 대신 `text.slice(0, visibleLength)` | E |
| M2 통째 교체 시 0 으로 되돌리지 않음 | C |
| M3 text 가 바뀌면 늘 0 으로 되돌림 | B |
| M4 `isComplete` 일 때도 onComplete 호출 | D' |
| M5 onComplete ref 갱신 제거 | F |
| M6 `isStreaming` 에서 `!isComplete` 제거 | D |
| M7 「스트리밍 중이었음」 가드 제거 | G |

M7 은 처음 테스트 세트(G 없음)에서 살아남아서 G 를 추가했어요. 추가 뒤 7개 변이 모두 2건씩 실패해요.

## 2. React 19 (AC2)

패키지 테스트는 devDependency React 18.3.1 로 돌아요. 일회 실측으로 vitest 설정에 react · react-dom 을 19.2.3(apps/web 버전), `@testing-library/react` 를 ESM 빌드로 별칭해 같은 파일을 돌렸어요(임시 설정은 커밋하지 않음). 실행 중 버전을 찍는 임시 테스트로 `react=19.2.3 react-dom=19.2.3` 을 확인했어요(기본 설정은 `18.3.1`).

| 소스 | React 19.2.3 결과 |
|---|---|
| 수정 후 | 18/18 통과 |
| 수정 전(음성 대조) | 13 실패 · 5 통과 |

## 3. 게이트 (AC3)

| 게이트 | rc | 수치 |
|---|---|---|
| `turbo run type-check --force` | 0 | 8/8, Cached 0 |
| `turbo run lint --force` | 0 | 4/4, Cached 0 |
| `turbo run build --force` | 0 | 8/8, Cached 0 (바뀐 `apps/web/public/templates/*.json` 은 되돌림) |
| `turbo run test --force` | 0 | 6/6, Cached 0. agentic-ui 90/90(종전 72 + 신규 18), ui-react 110, cli 640, mcp 43, theme 31, tokens 235 |
| `pnpm test:registry` | 0 | 45/45 |
| `pnpm pack-smoke` | 0 | 퍼블리시 대상 6개 통과, pack-install-smoke G2 RSC 통과 |
| `pnpm registry-install-smoke --items agentic-streaming-text` | 0 | 1/1 PASS (로컬 레지스트리 → Next 앱 add · build) |

`pnpm build:registry` 재생성으로 바뀐 파일은 `apps/web/public/r/agentic-streaming-text.json` 과, 그 항목의 sha256 한 줄씩인 `index.json` · `registry.json` 이에요. 재생성본의 소스는 패키지 소스와 같고, 빌드 변환(`"use client"` 머리말 · `cn` import 를 `@/registry/axis/lib/utils` 로)만 달라요.

## 4. 배포 뒤 (AC4, 미실행)

- [ ] 발행본 `@axis-ds/agentic-ui@1.5.1` 으로 A 시나리오(StrictMode 켬 · 끔)를 실측해 `스트리밍 완료 문장` 확인
