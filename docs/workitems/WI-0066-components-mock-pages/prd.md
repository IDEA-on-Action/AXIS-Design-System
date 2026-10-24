# WI-0066: 문서 사이트 `/components` mock 페이지를 실제 컴포넌트로 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0066 | GitHub: #180 | 우선순위: P3 | 상태: Approved (2026-10-25 결정 반영)
> 기준: `main` 778e1dd(linked tokens · theme 1.6.2, ui-react · agentic-ui 1.6.3, cli 1.6.0, mcp 1.3.3). 배치 3 브리프는 a1a32ca(WI-0071 이전)에서 쟀고, 그 뒤 WI-0071(#192 → Release #193)이 머지 · 발행돼 Skeleton dist 가 바뀌었으므로 이 WI 의 수치는 778e1dd 에서 다시 쟀어요(testplan)
> 관련: WI-0058(#157, `/agentic` mock 교체 선례), WI-0071(#190, 움직임 줄이기에서 Skeleton 5초 느린 펄스), WI-0073(#194, Tooltip 스크롤 닫힘), WI-0062(#170, a11y 게이트 PAGES 확장)

---

## 1. 개요

### 1.1 문제 (실측, 배치 3 브리프 + 778e1dd 재측정)

- `/components` 의 avatar · alert · skeleton · tooltip 4페이지가 `@axis-ds/ui-react` 를 import 하지 않고 페이지 안에 mock 컴포넌트를 정의했어요(`// Mock` 블록). import 문은 코드 예시 문자열 안에만 있었어요
- mock 은 패키지와 다르게 동작했어요(778e1dd 측정)
  - skeleton: mock 이 자체 `animate-pulse` 를 써서 움직임 줄이기에서도 15개가 2초 주기로 그대로 돌았어요. 패키지 Skeleton 은 WI-0071 뒤 5초로 느려져요
  - tooltip: mock 은 CSS `group-hover` 만 있어 키보드 포커스로 열리지 않고 `role="tooltip"` 도 없었어요
  - avatar: mock 은 `next/image` 로 그려 외부 이미지가 막히면 깨진 img 3개가 남았어요. 패키지 Avatar 는 이니셜로 대체해요(WI-0054 수정이 사이트에서 보이지 않던 상태)
  - alert: mock 이 `bg-blue-50` 같은 Tailwind 기본 팔레트를 써서 실토큰(`surface-info`)이 렌더되지 않았어요

### 1.2 범위

- 교체: 4페이지의 mock 블록을 지우고 `@axis-ds/ui-react` 에서 import(avatar 는 `next/image` import 도 지움). 페이지 본문 · PropsTable · 코드 예시 문자열은 손대지 않음
- 범위 밖: PropsTable 정비(Tooltip `align` · Provider `delayDuration`, Alert `AlertTitle` · `AlertDescription` 항목), avatar 데모의 github.com 외부 이미지, Skeleton 문서의 `aria-hidden` 권고와 데모 불일치, Tooltip 스크롤 닫힘(WI-0073), a11y 게이트 PAGES 확장(WI-0062), progress 페이지(WI-0046 에서 처리됨)

## 2. 결정 (2026-10-25 사용자, 배치 3 브리프 권장안 일괄 채택 + 반박 검토 지적 반영)

| # | 결정 | 반영한 검토 지적 |
|---|---|---|
| D1 범위 (Q1) | 페이지 mock 교체만. PropsTable · 외부 이미지는 손대지 않음 | - |
| D2 a11y PAGES (Q2) | `e2e/a11y.spec.ts` PAGES 는 그대로 두고, 기본 · ontology x 라이트 · 다크 측정표를 testplan 에 첨부(WI-0058 D4 와 같음) | - |
| D3 skeleton 수용 기준 (Q3) | 「패키지 Skeleton 동작을 그대로 렌더」(페이지 안 animate 정의 0, 렌더된 클래스가 패키지와 같음). 착수 순서와 무관한 기준 | 브리프 전제(npm latest 1.6.2, packages 차이 0줄)가 WI-0071 발행으로 무너졌으므로 착수 기준을 현재 main(778e1dd)으로 두고 reduce 측정을 다시 함. 기대값은 정지가 아니라 5초 느린 펄스. 배포 확인 문구도 `motion-reduce:![animation-duration:5s]` 기준 |
| D4 Tooltip 스크롤 닫힘 (Q4) | 새 WI 로 분리(WI-0073 #194, 배치 4 a11y 묶음). 이 WI 는 그대로 진행 | - |

## 3. 구현하며 정한 것 (사용자 결정 아님, 검토 대상)

| # | 내용 | 근거 |
|---|---|---|
| I1 | 교체본은 브리프 스크래치 교체본(`pages-after/`)을 그대로 씀 | `git diff --name-only a1a32ca HEAD -- apps/web/src/app/(docs)/components` 가 progress/page.tsx(WI-0071) 1개만 내고 4파일은 0이에요(같은 조회가 progress 변경을 잡으므로 0 은 계측 실패가 아님). 현재 파일과 교체본의 diff 도 mock 블록 삭제 · import 추가뿐이에요 |
| I2 | 툴팁 키보드 측정은 「트리거 앞 포커스 요소에서 Tab 1회」 경로로 잼 | `focus()` 직후 Shift+Tab · Tab 을 10ms 안에 연달아 누르면 닫힌 직후 재포커스가 열리지 않는 경우가 있었어요(300ms 간격이면 다시 열림, testplan 4.3). 실제 키보드 사용 경로가 아니라 측정 절차의 산물로 보고(추정) 판정에서 뺌 |

## 4. 요구사항

| ID | 요구사항 |
|---|---|
| FR-1 | avatar · alert · skeleton · tooltip 4페이지가 페이지 안 mock 없이 `@axis-ds/ui-react` 의 실컴포넌트를 렌더한다 |
| FR-2 | skeleton 페이지가 패키지 Skeleton 의 클래스를 그대로 렌더한다(움직임 줄이기 동작은 패키지가 정함) |
| FR-3 | tooltip 페이지의 툴팁이 키보드 포커스로 열리고 `role="tooltip"` 을 가지며 Esc 로 닫힌다 |

## 5. 수용 기준 (AC)

| AC | 기준 |
|---|---|
| AC1 | 4페이지 모두 `@axis-ds/ui-react` 에서 실컴포넌트를 import 하고, 페이지 안 mock 정의(`// Mock` · `const <대문자> = (`)가 0건. 미사용 import 0건(lint 가 잡지 않으므로 grep, 양성 대조 포함) |
| AC2 | `turbo type-check lint test build --force` 통과(Cached 0), apps/web tsc 는 양성 대조(오류 1건 검출)로 검사가 돌았음을 보임 |
| AC3 | `frontend.yml` 의 run 단계 전체 통과(check-token-refs · check-contrast-pairs · check-types-versions · check-library-links · build:registry · test:registry · check-licenses · pack-smoke · cli-smoke · registry-install-smoke · E2E a11y 40 · nontext 8 · demo 8 · tokens 22, 조합별 10건) |
| AC4 | 4페이지(+대조군 progress)를 기본 · ontology x 라이트 · 다크로 axe 측정해 testplan 에 기록. passes > 0 과 브랜드 양성 대조로 미측정이 아님을 보임 |
| AC5 | skeleton: 정적 HTML 에 `motion-reduce:![animation-duration:5s]` 15개, 페이지 안 animate 정의 0. 움직임 줄이기 에뮬레이션에서 pulse@5s 15개(수정 전 pulse@2s 15개) |
| AC6 | tooltip: 키보드 Tab 으로 `role="tooltip"` 생성 · 유지, Esc 로 닫힘(수정 전 mock 은 열리지 않음). alert: 정적 HTML 에 `surface-info` 1 · `bg-blue-50` 0. avatar: 외부 요청 차단 시 깨진 img 0 · 이니셜 폴백(수정 전 깨진 img 3) |
