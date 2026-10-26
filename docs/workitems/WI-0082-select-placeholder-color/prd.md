# WI-0082: Select placeholder 색 PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0082 | GitHub: #211 | 우선순위: P3 | 상태: Approved (2026-10-26 사용자 결정, project-todo 「ontology 테마 완료 목표」: WI-0079 와 같은 발행)
> 기준: `main` e2a9725 + 브랜치 `fix/ontology-contrast`(WI-0079 커밋 뒤) | 발견: WI-0079 검토(design-review.md 6절)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(토큰 값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

ui-react `SelectTrigger` 는 `placeholder:text-[var(--axis-input-text-placeholder)]` 를 Trigger(button)에 붙여요. `::placeholder` 는 input · textarea 에만 적용되므로 이 클래스는 효과가 없어요. placeholder 글자는 `SelectValue` 의 span 이라 부모 글자색을 그대로 받아, **고르지 않은 상태의 안내 글자가 입력한 값처럼 진하게** 보여요.

### 1.2 기준선 (측정: Chromium 계산값, 문서 `/components/select/` 의 값 없는 Trigger)

| 조합 | placeholder 글자 색 | `--axis-input-text-placeholder` | 변수와 같은가 |
|---|---|---|---|
| 기본 라이트 | #09090B (본문 글자) | #6B7280 | 아니요 |
| 기본 다크 | #FAFAFA | #9CA3AF | 아니요 |
| ontology 라이트 | #111418 | #5F6673 (WI-0079 뒤) | 아니요 |
| ontology 다크 | #F1F3F5 | #9CA3AD (WI-0079 뒤) | 아니요 |

대비는 통과하지만(진한 글자라서) placeholder 와 값이 구분되지 않아요. 비교: 같은 페이지의 Input `::placeholder` 는 변수 색으로 칠해져요.

### 1.3 결정

| # | 결정 | 근거 |
|---|---|---|
| D1 | Radix 가 값이 없을 때 Trigger 에 붙이는 `data-placeholder` 상태에 `--axis-input-text-placeholder` 를 적용(`data-[placeholder]:text-[...]`), 효과 없는 `placeholder:` 클래스는 뺌 | 사용자 결정(작업 지시), shadcn Select 와 같은 방식 |
| D2 | 기본 · ontology 둘 다 적용, 대비 4.5:1 이상 | 같음 |
| D3 | 값을 고른 뒤의 글자색은 바꾸지 않음 | 회귀 방지 |

## 2. 요구사항

| ID | 요구사항 |
|---|---|
| FR-1 | `packages/axis-ui-react/src/select/index.tsx` Trigger 클래스 교체 |
| FR-2 | 단위 테스트(`src/select/select.test.tsx`): data-placeholder 전제, 클래스 존재, `placeholder:` 클래스 없음, 값 고른 상태 |
| FR-3 | E2E `brand-nontext-contrast` ⑤ 에 select-placeholder 행(렌더 색 = 변수, 4.5:1) |
| FR-4 | library 사본(`library:refresh-axis`) · 레지스트리 사본(`build:registry`, `r/` version 1.5.0 유지) 재생성 |
| FR-5 | changeset `@axis-ds/ui-react` patch(WI-0079 와 같은 발행, linked 4패키지 1.8.2) |

## 3. 수용 기준

| AC | 기준 | 확인 방법 |
|---|---|---|
| AC1 | 값 없는 Trigger 의 placeholder 글자 렌더 색 = `--axis-input-text-placeholder` (기본 · ontology x 라이트 · 다크) | E2E ⑤ · 브라우저 실측 |
| AC2 | 그 글자 대 입력 바탕 4.5:1 이상 | 같음 |
| AC3 | 값을 고른 Trigger 글자색은 수정 전과 같음 | 브라우저 실측(옵션 선택 뒤) |
| AC4 | Select 밖의 렌더는 수정 전과 같음 | 측정값 diff(select 행 외 0) · 스크린샷(select 페이지 외 바이트 일치) |
| AC5 | 새 테스트가 수정 전 소스에서 실패 | testplan |

## 4. 범위 밖

- `axis-cli` 동봉 레지스트리 사본: cli 를 올리지 않으면 cli 1.7.1 의 오프라인 폴백 사본은 종전 select 소스로 남아요(원격 pages.dev 우선이라 일반 경로는 새 소스). 결과 보고의 결정 필요 항목으로 넘겨요.
