# WI-0052: StreamingText 표시 결함(첫 글자 누락 · undefined 덧붙음) 수정 PRD

> 작성일: 2026-10-23 | 버전: v0.1 (초안) | 작성자: Sinclair Seo | WI: WI-0052 | GitHub: #146 | 우선순위: P2 | 상태: Draft (결정 대기)
> 기준: `origin/main` 8a8cd5b (linked 4패키지 1.5.0 배포, `@axis-ds/agentic-ui@1.5.0` dist 의 streaming-text 도 같은 코드임을 확인)
> 관련: WI-0050(#143) 구현 검증(2026-10-20)에서 발견

---

## 1. 개요

### 1.1 문제 (실측, 2026-10-23)

`packages/axis-agentic-ui/src/streaming-text/index.tsx` 의 `StreamingText` 를 jsdom 에서 렌더하고 fake timer 로 `speed`(10ms) 만큼씩 진행해 화면 문자열을 읽었어요. React 18.3.1(패키지 devDependency)과 React 19.2.3(apps/web 버전) 결과가 같았어요.

| 경우 | StrictMode 끔 | StrictMode 켬 |
|---|---|---|
| A. `text="스트리밍 완료 문장"` 끝까지 진행 | `트리밍 완료 문장undefined` (중간 `트` → `트리` → `트리밍`) | `""` (아무것도 안 나옴, onComplete 0회) |
| B. `"가나다라"` 2글자 진행 뒤 `"가나다라마바"` 로 이어 붙임 | `나다마undefined` | `마undefined` |
| C. `"가나다"` 완료 뒤 `"ABC"` 로 통째 교체 | `""` | `""` |
| D. `isComplete=true` (음성 대조: 스트리밍 경로를 안 탐) | `스트리밍 완료 문장` | `스트리밍 완료 문장` |

D 가 정상이라 렌더 · 측정 경로 자체는 살아 있고, 결함은 스트리밍 경로(effect 와 interval)에만 있어요. 발행본 `@axis-ds/agentic-ui@1.5.0` 의 `dist/streaming-text/index.mjs` 에도 같은 코드(`setDisplayedText((prev) => prev + newText[charIndex]); charIndex++;`)가 들어 있어요. 문서 사이트(`apps/web/next.config` `reactStrictMode: true`)의 `/agentic/streaming-text` 는 실제 컴포넌트가 아니라 페이지 안의 mock 을 써서 이 결함이 사이트에서는 드러나지 않아요.

### 1.2 원인 (원본 줄 번호)

| # | 위치 | 원인 | 증상 |
|---|---|---|---|
| C1 | `index.tsx:56-57` | 함수형 갱신 `(prev) => prev + newText[charIndex]` 는 React 가 다음 렌더에서 실행해요. 그 전에 57행 `charIndex++` 가 먼저 돌아서 갱신 함수는 늘 한 칸 뒤의 글자를 읽어요. 첫 tick 은 `newText[1]`, 마지막 tick 은 `newText[length]`(= `undefined`) | 첫 글자 누락 + 끝에 `undefined` (A · B) |
| C2 | `index.tsx:49 · 65` | effect 본문에서 `prevTextRef.current = text` 를 먼저 기록해요. StrictMode 는 마운트 직후 effect 를 정리 후 다시 실행하는데, 두 번째 실행에서 `text.length > prevTextRef.current.length` 가 거짓이 되어 interval 을 다시 만들지 않아요(첫 interval 은 정리에서 해제됨) | StrictMode 에서 빈 화면, onComplete 미호출 (A) |
| C3 | `index.tsx:50 · 66` | 이어 붙임으로 effect 가 다시 돌면 정리 함수가 이전 interval 을 끊고, 새 effect 는 `prevTextRef`(이미 이전 text 전체) 이후만 흘려요. 아직 안 나간 이전 글자가 버려져요 | 이어 붙인 글자 사이 누락 (B 의 `가` · `라` · `바`) |
| C4 | `index.tsx:67-71` | 통째 교체 시 화면을 `""` 로 비우고 `prevTextRef` 를 `""` 로 돌리지만, effect 의존성(`text` 등)은 그 뒤 바뀌지 않아 새 text 를 흘리는 effect 가 다시 안 돌아요 | 교체 뒤 빈 화면 (C) |
| C5 | `index.tsx:72` | `onComplete` 가 의존성에 있어 부모가 매 렌더 새 함수를 넘기면 effect 가 다시 돌아요. 다시 돌면 C2 와 같은 경로(조건 거짓)로 interval 이 사라져요 | 부모 재렌더 시 스트리밍 멈춤 (코드 독해상 C2 와 같은 기제, 별도 실측 안 함) |

### 1.3 수정 방향 (시제품으로 확인)

누적 문자열과 interval 안의 지역 인덱스를 버리고, **표시할 글자 수(`visibleLength`)만 상태로 두고 화면 문자열은 `text.slice(0, visibleLength)` 로 만들어요.** effect 는 「아직 다 안 보였으면 interval 로 1씩 늘린다」만 하고, 정리 후 다시 실행돼도(StrictMode · 부모 재렌더) 현재 위치에서 이어 가요. 이어 붙임이면 위치를 유지하고, 통째 교체면 렌더 중 상태 조정으로 0 으로 돌려요. onComplete 는 ref 로 받아 의존성에서 빼고, 「스트리밍 중 → 끝」 전환에서 한 번만 불러요.

시제품을 같은 재현 테스트에 태우면 A~D 가 React 18 · 19, StrictMode 켬 · 끔 모두 통과했어요(8/8 × 2). 패키지 기존 테스트 83개 · `tsc --noEmit` · `eslint` 도 통과했어요. 시제품 diff 는 1단계 보고에 첨부했고 커밋하지 않았어요.

## 2. 결정 (사용자 결정 대기)

| # | 질문 | 선택지 (첫 번째가 권장) |
|---|---|---|
| D1 | onComplete 는 언제 부르나 | ① 화면이 text 끝까지 따라잡을 때마다 1회(이어 붙인 뒤 다시 따라잡으면 또 1회), `isComplete=true` 로 즉시 표시할 때는 안 부름(종전 의도 유지) ② `isComplete=true` 로 즉시 표시할 때도 부름 ③ text 가 통째 바뀔 때까지 최초 1회만 |
| D2 | 스트리밍 도중 text 를 이어 붙이면 | ① 지금 위치에서 계속 흘림 ② 이어 붙인 부분은 즉시 표시 |
| D3 | text 가 통째 바뀌면(이전 text 로 시작하지 않으면) | ① 처음부터 다시 흘림(종전 주석 의도) ② 새 text 를 즉시 전부 표시 |
| D4 | 글자 단위 | ① 코드 포인트(`Array.from`, 이모지 반쪽 표시 방지) ② UTF-16 코드 유닛 유지(종전, 한글은 문제없음) ③ 자소 묶음(`Intl.Segmenter`) |
| D5 | 문서 사이트 `/agentic/streaming-text` 의 mock | ① 이번 범위 밖, 후속 WI 로 등록 ② 이번에 실제 컴포넌트로 교체 |
| D6 | `apps/web/public/library/components/streaming-text.json` · `categories/agentic.json` 에 든 옛 소스 | ① WI-0057(library 데이터) 에서 함께 재생성 ② 이번에 손으로 갱신 |
| D7 | 릴리스 | ① agentic-ui patch changeset 1개(linked 4패키지 1.5.1 동반) ② 다른 WI(0053) 와 한 릴리스로 묶을 때까지 changeset 보류 |

## 3. 요구사항

- FR-1 표시: 스트리밍 중 화면은 늘 `text` 의 앞부분이고, 끝나면 `text` 와 정확히 같아요(누락 · `undefined` 없음)
- FR-2 StrictMode · 재렌더 내성: effect 가 정리 후 다시 실행돼도 진행이 멈추거나 처음으로 돌아가지 않아요
- FR-3 text 변경: 이어 붙임 · 통째 교체를 D2 · D3 대로 처리해요
- FR-4 onComplete: D1 대로, StrictMode 에서도 한 번만 불러요
- FR-5 `isComplete=true`: 즉시 전체 표시, 커서 숨김(종전 유지)
- FR-6 공개 API(props 이름 · 타입 · 기본값 `speed=20` · `showCursor=true`)는 바꾸지 않아요
- FR-7 레지스트리 `apps/web/public/r/agentic-streaming-text.json` 을 `pnpm build:registry` 로 재생성해요

## 4. 수용 기준

- AC1 신규 단위 테스트 `streaming-text.test.tsx` 가 StrictMode 켬 · 끔 각각 A(중간 상태 `스` → `스트` → `스트리`, 완료 텍스트, onComplete 1회) · B · C · D 를 고정하고, **수정 전 소스에서는 실패**(음성 대조)하고 수정 후 통과해요
- AC2 React 19.2.3 로 같은 시나리오를 1회 실측해 통과해요(패키지 테스트는 React 18 devDependency)
- AC3 기존 게이트(type-check · lint · build · test · test:registry) 통과, 레지스트리 재생성본의 streaming-text 소스가 패키지 소스와 같아요
- AC4 배포 뒤 발행본으로 A 시나리오를 실측해 `스트리밍 완료 문장` 이 나와요

## 5. 범위 밖

- 문서 사이트 mock 교체(D5 ①일 때)
- library 데이터 재생성(D6 ①일 때, WI-0057)
- 다른 agentic 컴포넌트의 같은 유형 결함 점검(필요하면 별도 WI)
