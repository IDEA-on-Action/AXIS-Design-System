# WI-0073: Tooltip 이 포커스 스크롤에 닫힘 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0073 | GitHub: #194 | 우선순위: P3 | 상태: Approved (2026-10-25 사용자 결정 D6 (가), project-todo 「배치 4 결정」)
> 기준: `main` f8a05be (linked 1.7.0 · cli 1.6.1 · mcp 1.3.4 발행본) | 묶음: 배치 4 ② a11y(WI-0062 · 0063 · 0069 · 0073)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

- 화면 밖에 있는 Tooltip 트리거로 Tab 하면 브라우저가 트리거를 화면 안으로 스크롤하고, 그 스크롤이 막 열린 툴팁을 닫아요. 포커스는 트리거에 남아 있는데 툴팁은 보이지 않아요(WCAG 2.2 SC 1.4.13 「지속성」 미달).
- 원인(측정: 설치본 `@radix-ui/react-tooltip` 1.2.8 `dist/index.mjs` 판독): `TooltipContentImpl` 이 `window` 의 `scroll`(capture)을 듣다가 스크롤된 요소가 트리거를 담고 있으면 `onClose()` 를 불러요. 열기는 `onFocus` 에서 바로 일어나고, 같은 포커스가 만든 스크롤이 다음 프레임에 닫아요.
- npm 최신 1.4.1(2026-10-14) 소스에도 같은 코드가 있고(`instanceof Node` 검사만 추가), `TooltipContentProps` 에는 이 닫힘을 끄는 prop 이 없으며 `onOpenChange` 는 닫힘 이유를 넘기지 않아요(측정: 1.4.1 dist · d.ts 판독). 버전을 올려도 해결되지 않아요.

### 1.2 재현 (측정, 수정 전)

| 조건 | 결과 |
|---|---|
| 배포본 pages.dev 1.7.0, 1280x720, 첫 트리거 「Hover me」 Tab | scrollY 0 → 848, 800ms 뒤 `data-state=closed` · `role=tooltip` 0 |
| 같은 페이지의 스크롤 없는 트리거 4개(Top · Right · Bottom · Left) | 4/4 열린 채(같은 페이지 대조군) |
| 1280x3000(스크롤 없음) | 5/5 열린 채(음성 대조) |
| 이 브랜치 수정 전 정적 빌드, 새 E2E 6건 | 2 실패(720 지속성 · 720 Esc 의 전제 「열림」) · 4 통과 |

배포본 행은 배치 4 브리프 측정(`scratchpad/b4/tooltip-out.txt`), 마지막 행은 이번 측정이에요.

### 1.3 결정 (2026-10-25 사용자, D6 (가))

| # | 결정 | 근거 |
|---|---|---|
| D6 | ui-react `Tooltip` 래퍼가 open 을 직접 제어하고, **트리거에 포커스가 있는 동안 스크롤로 생긴 닫힘**만 무시한다. Esc · 포인터 이탈 · 블러 · 클릭 · 포커스 없는 hover 툴팁의 스크롤 닫힘은 그대로 둔다 | 사용자 결정(래퍼 제어). 버전 업은 효과 없음(1.4.1 실측) |
| D6-1 | Radix 업스트림 이슈는 **초안만** 쓰고 게시하지 않는다 | 사용자 결정 |
| D6-2 | open · defaultOpen · onOpenChange 는 그대로 통과한다. 소비자가 제어하면 무시한 닫힘은 `onOpenChange(false)` 로 전달하지 않는다 | 제어 상태 전환 시 소비자 계약 유지(브리프 위험 4) |

### 1.4 구현 방식 선택 (브리프 대안과의 차이)

브리프의 (가) 원안은 Trigger `onFocus` 에서 `preventDefault()` 로 Radix 의 즉시 열기를 건너뛰고 스크롤이 끝난 뒤 래퍼가 `open` 을 true 로 바꾸는 방식이었어요. 소스를 읽어 보니(측정) Radix 는 **자기 setOpen 을 거친 열기에서만** `TOOLTIP_OPEN` 문서 이벤트(다른 열린 툴팁 닫기)와 Provider 의 skip-delay 처리를 해요. 래퍼가 prop 으로 직접 열면 이 둘이 빠져 다른 툴팁이 같이 열려 있는 회귀가 생겨요(계산). 그래서 열기 경로는 Radix 그대로 두고 **닫힘 쪽만** 가려 막는 방식으로 했어요. 사용자 결정 문구 「open 을 제어해 스크롤 직후 포커스 상태면 닫힘을 막음」과 같은 동작이에요.

- 닫힘 이유 판정: 래퍼가 `window` scroll(capture) 리스너를 레이아웃 단계에서 먼저 등록해(Radix Content 의 리스너보다 앞) 「지금 스크롤 이벤트 처리 중」 플래그를 켜고, 다음 태스크(`setTimeout 0`)에서 꺼요. 같은 대상 · 같은 단계 리스너는 등록 순서로 불리므로 Radix 의 `onClose` 가 오기 전에 플래그가 켜져 있어요. 마이크로태스크는 리스너 사이에 비워져서 쓰지 않았어요.
- Esc · 바깥 포인터 누름은 Content 의 `onEscapeKeyDown` · `onPointerDownOutside` 에서 「명시 닫힘」으로 표시해 스크롤 플래그가 켜져 있어도 닫아요. 소비자 핸들러가 `preventDefault()` 하면 표시하지 않아요(Radix 도 닫지 않음).
- 포커스 판정은 `trigger.ownerDocument.activeElement === trigger` 예요. 블러는 포커스가 떠난 뒤라 이 조건이 거짓이 되어 정상으로 닫혀요.
- 모듈에 상태 훅 · createContext · 인라인 핸들러가 생겨 `client-modules.mjs` 에 `tooltip/index` 를 추가해요(postbuild 가드가 요구, "use client" 지시문은 산출물에만).

### 1.5 범위 밖

- 포커스가 트리거에 있는 상태에서 사용자가 직접 스크롤해도 이제 툴팁이 남아요(Popper 가 위치를 따라감). 1.4.13 「포커스가 남아 있는 동안 유지」에 맞는 동작이라 따로 막지 않아요.
- Radix 업스트림 이슈 게시(초안만, D6-1).
- shadcn 원본 Tooltip(library 의 `shadcn-tooltip`) 은 외부 사본이라 바꾸지 않아요.

## 2. 수용 기준 (AC)

| AC | 내용 | 검증 |
|---|---|---|
| AC1 | 1280x720 에서 화면 밖 트리거로 Tab 하면 스크롤(scrollY > 0)이 일어나고, 800ms 뒤에도 `role=tooltip` 1 · `data-state` open | E2E `tooltip-persistence.spec.ts` |
| AC2 | Esc 로 닫히고 포커스는 트리거에 남는다 | E2E · 단위 |
| AC3 | 다른 요소로 포커스가 옮겨 가면 닫히고 다음 트리거가 열린다 | E2E · 단위 |
| AC4 | 포인터 이탈로 닫히고, 포커스 없이 hover 로 연 툴팁은 스크롤에 닫힌다(Radix 동작 유지) | E2E · 단위 |
| AC5 | 1280x3000(스크롤 없음)에서 5개 트리거 모두 Tab 뒤 열린 채, Esc 로 닫힘(회귀 없음) | E2E |
| AC6 | 제어 모드: 무시한 닫힘은 `onOpenChange(false)` 로 전달하지 않고, Esc 는 전달한다. `open={false}` 고정이면 열리지 않는다. ref 전달 · 서버 렌더 유지 | 단위 |
| AC7 | 새 테스트가 수정 없는 코드에서 실패한다(음성 대조 · 변이) | 수정 전 빌드 E2E · 변이 3종 |
| AC8 | CI 에 E2E 단계와 건수 가드(tooltip 6)를 둔다 | frontend.yml |
| AC9 | 업스트림 이슈 초안 작성(게시 안 함) | `scratchpad/wa11y/radix-issue-draft.md` |
