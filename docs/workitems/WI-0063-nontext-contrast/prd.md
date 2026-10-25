# WI-0063: 기본 테마 비텍스트 대비 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0063 | GitHub: #171 | 우선순위: P3 | 상태: Approved (2026-10-25 사용자 결정 D1 (가) · D3 (가), project-todo 「배치 4 결정」)
> 기준: `main` f8a05be (linked 1.7.0 · cli 1.6.1 · mcp 1.3.4 발행본) + 브랜치 `fix/batch4-a11y`(WI-0062 794e23f 뒤) | 묶음: 배치 4 ② a11y(WI-0062 · 0063 · 0069 · 0073)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(토큰 값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

기본 테마의 폼 컨트롤 경계 · 트랙, 포커스 링, Progress 채움, 상태 점 · 아이콘이 WCAG 1.4.11(비텍스트 3:1)에 못 미쳐요. brand-nontext-contrast E2E 는 기본 브랜드 주 표식 8쌍을 `DEFAULT_BRAND_FLOOR`(실측 하한)로 묶어 두었고, 그 주석의 「해소는 WI-0029 #94」는 WI-0029 완료 뒤에도 남아 낡았어요.

### 1.2 기준선 (1.7.0 dist 재측정 · 브라우저 실측, 이 브랜치 수정 전)

| 표식(기본 브랜드) | 라이트 | 다크 | 근거 |
|---|---|---|---|
| Checkbox · Radio · Textarea 경계(border-default) | 1.23(브라우저 1.24) | 1.37(1.36) | 계산 · `ctrl-before.txt` |
| Input · Select 경계(input-border-default) | 1.47 | 1.95(1.93) | 같음 |
| Switch 꺼짐 · Slider 트랙(surface-tertiary) | 1.23 | 1.37 | 같음 |
| Button 포커스 링(button-border-focus blue.400) | 2.54 | 통과 | 계산 |
| Progress 채움 default · success · warning / 트랙 | 2.97 · 1.84 · 1.54 | default 2.84 | 계산 · 브라우저 |
| 상태 점 · 아이콘: 성공 green.500 · 경고 yellow.500 · 대기 gray.400 / 흰 바탕 | 2.28 · 1.91 · 2.54 | 통과 | E2E 실측(DEFAULT_BRAND_FLOOR) |
| 스피너 arc(blue.500, opacity .75 합성) / 흰 바탕 | 2.83 | 통과 | 같음 |
| RunProgress · StepTimeline 점 위 흰 글리프(성공 · 진행 arc) | 2.28 · 2.97 | 같음 | 같음 |
| Alert 경고 테두리 / 경고 바탕 | 1.85 | 통과 | 계산 |
| 오류 테두리(status-error-border red.200) / 흰 · 오류 바탕 | 1.44 · 1.32 | 통과 | 계산 |
| FeedbackButtons 좋아요 아이콘 / 옅은 바탕 | 2.08 | 통과 | 계산 |

### 1.3 결정

| # | 결정 | 근거 |
|---|---|---|
| D3 | (가) 기본 브랜드만 컨트롤 전용 경계 · 트랙 토큰을 새로 두어 3:1, `button-border-focus` 는 `input-border-focus` 와 같은 blue.500, Progress 는 채움 전용 토큰으로 짙게. ontology 는 부록 B ③ 승인값 · 1.7.0 렌더 값 유지 | 사용자 결정(가). border-default 는 구분선 · 카드에도 쓰여 전역 값을 바꾸지 않음 |
| D3-1 | 새 토큰: `form-control.border` · `form-control.track`(기본 gray.500, 테마 무관), `progress.fill.{default,success,warning,destructive}`. ontology 값은 1.7.0 에서 그 자리를 칠하던 변수 값(border-default · surface-tertiary · surface-brand)과 primitive 참조(`{color.green.500}` 등)로 둔다 | ontology 완전성 테스트가 모든 기본 토큰의 ontology 값을 요구. 값이 같아 ontology 렌더 불변 |
| D3-2 | 이름은 `control-*` 가 아니라 `form-control-*` | `--axis-control-*` 는 WI-0026 밀도 토큰 접두라 brands.test 밀도 판정(`^--axis-(control|field|toggle|table)-`)에 걸림 |
| D1 | 상태 점 · 아이콘은 ontology 값이 라이트 · 다크 모두 같은 `text-*` 로(성공 → text-success, 경고 → text-warning, 대기 → text-tertiary, 오류 → text-error). 진행 · 정보는 같은 값의 대체 토큰이 없어 status-* 그대로(3.68) | 사용자 결정 D1 (가). 전역 status.* 값 불변 |
| D1-5 | 진행 스피너(PlanCard · ToolCallCard) arc 의 opacity .75 를 뗀다(합성 2.81 → 3.68). ontology 는 같은 색이 불투명해져 렌더가 바뀐다(대비 개선 방향) | 토큰으로는 해소할 방법이 없음(대체 토큰 없음) |
| D1-6 | 점 위 글리프: `status-running-contrast` 는 gray.950(arc 합성 4.49), `status-success-contrast` 는 다크만 gray.950(완료 점이 다크 green.400 이 되어 흰 글리프 1.7). PlanCard 승인 글자는 같은 토큰을 쓰던 자리라 `button-text-default`(흰색, ontology 값 같음)로 옮긴다 | 흰 글자 짝 기본값 조정(D1 (가)) |
| D1-7 | 오류 테두리(RecoveryBanner · AttachmentCard)는 `status-error-border` 대신 `border-error`, Alert 경고 테두리는 `border.warning` 라이트 기본값을 yellow.700 | ontology 는 두 변수 값이 같거나 덮어씀 |
| D1-8 | 짝 표의 아이콘 행(`kind: 'icon'`)은 기본 브랜드에 1.4.11 3:1 로 적용한다. ontology 는 종전 4.5 그대로 | WI-0062 D2 와 같은 규칙 |

### 1.4 범위 밖

- 대기 · 건너뜀 점 `--axis-status-neutral-muted`(1.47)는 2026-10-18 사용자 결정 · 2026-10-19 디자인 오너 수락으로 값을 유지해요(NEUTRAL_MUTED_FLOOR 하한 가드 그대로).
- ontology 컨트롤 경계(라이트 1.15~1.31 · 다크 1.40~1.42, 브라우저 실측)와 ontology Progress success · warning 채움(1.93 · 1.62, 계산)은 「ontology 값 불변」 범위라 그대로예요. 해소하려면 ontology 값 결정이 필요해요(사용자 결정 대상).
- 진행 막대가 진행률 글자와 함께 보이는 곳(TokenUsage · PlanCard · AttachmentCard 막대)은 글자가 정보를 주므로 이번 판정 밖이에요(추정: 1.4.11 의 「이해에 필요한 그래픽」 아님). RunProgress 머리 점 · PlanCard 왼쪽 선 · pulse 최저 시점은 종전대로 기록만 해요(2026-10-19 D1).
- Slider 채움(interactive-primary)과 새 트랙(gray.500)은 서로 1.31 이에요. 값은 썸(3.68)이 보여 주므로 트랙 대 채움은 판정하지 않았어요.
- shadcn 호환 `--input`(border.default)은 바꾸지 않았어요(WI-0062 와 같음).

## 2. 변경

| 대상 | 1.7.0 | 이번 | 대비(기본 라이트 / 다크) |
|---|---|---|---|
| Checkbox · Radio · Textarea 경계 | border-default | `form-control-border` gray.500 | 4.83 / 4.12(브라우저, 문서 바탕 #09090B) |
| Input · Select 경계 | gray.300 · 다크 gray.700 | gray.500(hover 라이트 gray.600 · 다크 gray.400) | 4.83 / 4.12 |
| Switch 꺼짐 · Slider 트랙 | surface-tertiary | `form-control-track` gray.500 | 4.83 / 4.12, 흰 썸 4.83 |
| Button 포커스 링 | blue.400 | blue.500 | 3.68 / 5.47 |
| Progress 채움 | surface-brand · green.500 · yellow.500 · red.500 | `progress-fill-*` | 4.17 · 4.05 · 3.98 · 3.90 / 3.99 · 6.44 · 7.65 · 3.90 |
| 성공 · 경고 · 대기 · 오류 아이콘 | status-* | text-success · text-warning · text-tertiary · text-error | 5.02 · 4.92 · 4.83 · 6.47 |
| 상태 점(완료 · 아바타) | status-success · warning · neutral | text-success · text-warning · text-tertiary | 5.02 · 4.92 · 4.83 |
| 진행 스피너 arc | opacity .75(2.81) | 불투명 | 3.68 · 회색 바탕 3.34 |
| 점 위 글리프 | 흰색 | running gray.950 · success 다크 gray.950 | 4.49(arc) · 5.02 / 11.55 |
| 오류 테두리 | status-error-border | border-error | 3.76 · 3.44 |
| Alert 경고 테두리 | yellow.500 | yellow.700 | 4.76 |

## 3. 수용 기준 (AC)

| AC | 내용 | 검증 |
|---|---|---|
| AC1 | 짝 표 전 행(글자 · 아이콘 · 비텍스트)과 기본 전용 비텍스트 짝(폼 컨트롤 경계 · 트랙 · 썸 · Progress)이 기본 라이트 · 다크에서 기준 이상 | tokens `default-contrast.test` |
| AC2 | ontology: 기존 토큰 출력 불변(ontology.css 기존 줄 바이트 동일, 새 6변수만 추가), 새 변수 값 = 1.7.0 렌더 값(brands.test WI0063_SAME), `ontology-values` 통과, 브라우저 렌더 색 수정 전후 비교에서 의도한 스피너 arc 외 차이 없음 | 테스트 · 바이트 · 브라우저 |
| AC3 | brand-nontext-contrast E2E: 기본 브랜드 주 표식 전부 3:1, `DEFAULT_BRAND_FLOOR` 비움, 낡은 주석 정정 | E2E nontext |
| AC4 | 폼 컨트롤 실제 요소(문서 페이지)의 경계 · 트랙 · 채움이 기본 라이트 · 다크 3:1 이상 | 브라우저 실측 |
| AC5 | 아이콘 · 점에 3:1 미만 상태 색 없음, 스피너 arc 불투명, 오류 테두리 border-error, 폼 컨트롤이 새 토큰 사용. 수정 전 소스에서 실패 | 단위 `nontext-contrast.test.tsx`(agentic · ui-react) |
| AC6 | 1.2.1 기준선 예외 표(WI0063_CHANGED · NEW), dark-tokens E2E 기대값, check-contrast-pairs rc 0, 레지스트리(version 1.5.0) · library 재생성 | 게이트 |
| AC7 | 게이트: turbo lint · type-check · build · test 각각 `--force`, frontend.yml run 단계 전부, E2E static(a11y · nontext · demo · tooltip)과 tokens | 게이트 로그 |
