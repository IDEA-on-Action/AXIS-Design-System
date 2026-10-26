# WI-0079: ontology 남은 대비 미달 PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0079 | GitHub: #208 | 우선순위: P2 | 상태: Approved (2026-10-26 사용자 결정, project-todo 「ontology 테마 완료 목표」 · 「WI-0079 세부 결정」 · 「WI-0079 Q3 추가 결정」, 같은 날 검토 뒤 Progress warning 노랑 결정 D9)
> 기준: `main` e2a9725 (linked 1.8.1 · cli 1.7.1 · mcp 1.4.1 발행본) | 브랜치 `fix/ontology-contrast` | 같은 발행: WI-0082(Select placeholder)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(토큰 값에서 유도) · **추정**(실행하지 않음)
> 근거 자료: [design-review.md](./design-review.md)(후보 · 대비 · 영향 범위 · 고칠 테스트, 디자인 오너 확인 문서)

---

## 1. 개요

### 1.1 문제

배치 4(WI-0062 · 0063, 1.8.0)는 기본 브랜드만 대비를 맞췄고(결정 D3), ontology 브랜드에는 1.7.0 렌더 값을 그대로 넣어 두었어요. 그래서 ontology 에 WCAG 미달이 남아 있어요.

### 1.2 기준선 (측정: main e2a9725 정적 빌드, Chromium 계산값, 문서 컴포넌트 페이지 실요소)

| 대상 | 변수 | 라이트 (실제 바탕 · card · panel) | 다크 (실제 바탕 · card · panel) | 기준 |
|---|---|---|---|---|
| Checkbox · Radio · Textarea 경계 | `--axis-form-control-border` | #E6E8EB 1.15 · 1.23 · 1.12 | #2B2F35 1.42 · 1.31 · 1.19 | 3:1 (1.4.11) |
| Switch 꺼짐 · Slider 트랙 | `--axis-form-control-track` | #EAECEF 1.10 · 1.18 · 1.08 | #2A2E34 1.40 · 1.29 · 1.17 | 3:1 |
| Switch 흰 썸 대 꺼짐 트랙 | (고정 #FFFFFF) | 1.18 | 13.65 | 3:1 |
| Progress success · warning (트랙 위) | `--axis-progress-fill-success` · `-warning` | #22C55E 1.93 · #EAB308 1.62 | 5.99 · 7.12 | 3:1 |
| Progress destructive (트랙 위) | `--axis-progress-fill-destructive` | #EF4444 3.18 | 3.63 | 3:1 (통과, Q3 대상) |
| Input placeholder (입력 바탕 위) | `--axis-input-text-placeholder` | #9AA1AB 2.61 | #7A828D 4.53 | 4.5:1 (1.4.3) |
| (참고) Input 테두리, 부록 B ③ 예외 | `--axis-input-border-default` | #D6DADF 1.31 · 1.40 · 1.28 | #5F6874 3.37 · 3.12 · 2.83 | 예외 |

실제 바탕은 문서 사이트 페이지 바탕(`--background` 라이트 #F7F7F7 · 다크 #0E1013), 입력 바탕(#FFFFFF · #17191D), 트랙(#EAECEF · #2A2E34)이에요. 측정 원자료: `scratchpad/w79impl/base.txt` · `base.json`.

### 1.3 결정 (2026-10-26 사용자)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 디자인 오너 답을 기다리지 않고 확인 문서 7절 권장안으로 반영. 오너가 다른 값을 고르면 다시 발행 | project-todo 「ontology 테마 완료 목표」 |
| D2 | 경계 · 트랙 = 라이트 `sub` #6B7280 · 다크 `muted` #7A828D (확인 문서 ① · ② B) | 같음 |
| D3 | Progress success · warning = `ink-2` · `bad` (③ A, 상태 색 접기와 같은 의미 매핑). warning 부분은 D9 로 바뀜 | 같음 |
| D4 | Progress destructive = `bad-dark`(라이트 #A8281F · 다크 #F49890). warning(bad)과 빨강 두 단계로 나눔(Q3 C안의 destructive 부분) | 「WI-0079 Q3 추가 결정」 |
| D5 | Input placeholder = 라이트 `sub-aa` #5F6673 · 다크 `sub` #9CA3AD (④ A). WI-0025 부록 B ② 「`muted` 는 placeholder 에만」(2026-10-19 디자인 오너 확인)을 철회하고 부록 B 와 release-notes 에 기록 | 「WI-0079 세부 결정」 Q4 |
| D6 | Input 테두리 `--axis-input-border-default`(부록 B ③ 예외)는 바꾸지 않음 | 같음 Q5 |
| D7 | 값은 팔레트 이름으로 단언(테스트가 `V1_PALETTE` 이름으로 비교, hex 복제 없음). 브랜드 JSON 에는 v1 팔레트 hex | 결정 문장 「팔레트 이름 참조로」 |
| D8 | 기본 브랜드는 바뀌지 않아야 함(음성 대조) | 같음 |
| D9 | Progress warning = AXIS 원시색 노랑(라이트 `{color.yellow.700}` #A16207 · 다크 `{color.yellow.500}` #EAB308, 다크는 종전 값). destructive `bad-dark` · success `ink-2` 는 그대로. 검토에서 빨강 두 단계(bad · bad-dark)의 휘도 대비가 1.33 · 1.26 이라 색 구분이 약하다는 지적을 받아 바꿈 | 2026-10-26 사용자 결정(검토 뒤) |

D9 와 WI-0025 PRD Q8(「v1 에는 초록 · 노랑이 없다」)의 관계: Q8 은 상태 색 접기(`status.*`)의 제약으로 그대로 두고, Progress warning 채움 하나만 v1 팔레트 밖의 AXIS 원시색을 참조하는 예외예요(1.8.0 의 green · yellow-500 참조와 같은 방식, 「hex 는 v1 팔레트 안에서만」 테스트는 hex 리터럴만 보므로 예외 목록 없이 통과).

## 2. 요구사항

| ID | 요구사항 |
|---|---|
| FR-1 | ontology 라이트 · 다크 `form-control.border` · `form-control.track` 을 D2 값으로 |
| FR-2 | ontology `progress.fill.success` · `warning` · `destructive` 를 D3 · D4 · D9 값으로(success · destructive 는 v1 팔레트 hex, warning 은 원시색 참조 `{color.yellow.700}` · `{color.yellow.500}`) |
| FR-3 | ontology `input.text.placeholder` 를 D5 값으로 |
| FR-4 | 고칠 테스트(design-review 6절): `brands.test` `WI0063_SAME` 갱신, `default-contrast` `DEFAULT_ONLY` 의 placeholder · 경계 · 트랙 · 썸 · Progress 짝을 `ontology-pairs.mjs` `CONTRAST_PAIRS`(두 브랜드 공용)로 옮기고 bg · panel 바탕 짝 추가, `brand-nontext-contrast.spec` 에 대상 표 추가 |
| FR-5 | 문서: theme-customization 「ontology 프리셋」 절, WI-0025 부록 B 철회 기록, 확인 문서 맨 위 「권장안으로 먼저 반영」 안내 |
| FR-6 | changeset: `@axis-ds/tokens` patch + `@axis-ds/mcp` patch(tokens 동반 규칙). WI-0082 의 `@axis-ds/ui-react` · `@axis-ds/cli` patch 와 합쳐 linked 4패키지 1.8.2 · cli 1.7.3 · mcp 1.4.3 |
| FR-7 | `brand.json` `a11y.status` 에 2026-10-26 권장안 선반영 · 부록 B ② 철회 · 디자인 오너 재확인 대기를 적음(MCP get_brand · `axis theme info` 가 그대로 보여 줌) |

## 3. 수용 기준

| AC | 기준 | 확인 방법 |
|---|---|---|
| AC1 | ontology 라이트 · 다크에서 Checkbox · Radio · Textarea 경계, Switch · Slider 트랙이 실제 바탕 · card · panel · 페이지 바탕 모두 3:1 이상 | 브라우저 실측 · `brand-nontext-contrast` ⑤ · `ontology-values` 짝 대비 |
| AC2 | Switch 흰 썸 대 꺼짐 트랙 3:1 이상 | 같음 |
| AC3 | Progress success · warning · destructive 가 트랙 위 3:1 이상이고 warning 과 destructive 색이 다름 | 같음 + `ontology-values` WI-0079 테스트 |
| AC4 | Input placeholder 가 입력 바탕 위 4.5:1 이상 | 같음 |
| AC5 | 기본 브랜드 렌더가 수정 전과 같음 | 기본 브랜드 측정값 diff 0 · 스크린샷 바이트 일치, tokens dist `variables.css` · `shadcn-compat.css` diff 0 |
| AC6 | Input 테두리(부록 B ③)는 수정 전과 같음 | 측정값 · `ontology-values` 단언 |
| AC7 | 새 테스트는 수정 전 값에서 실패 | 수정 전 실행 기록(testplan) |
| AC8 | 게이트: turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계, E2E a11y · nontext · demo · tooltip · library · tokens(정적 빌드) | testplan |

## 4. 범위 밖

- Input 테두리 대비(부록 B ③ 예외 유지, D6)
- Select placeholder 색이 적용되지 않는 결함: WI-0082 에서 따로 다룸
- 디자인 오너가 다른 값을 고를 때의 재발행
