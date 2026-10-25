# WI-0063 릴리스 노트: 기본 테마 비텍스트 대비

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #171 | 대상: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` minor, `@axis-ds/cli` · `@axis-ds/mcp` patch(배치 4 ② 묶음과 함께 linked 1.8.0 으로 발행 예정)

## 바뀐 점

기본 테마(브랜드 미지정)의 폼 컨트롤 경계 · 트랙, 포커스 링, Progress 채움, 상태 점 · 아이콘을 WCAG 1.4.11(3:1) 이상으로 맞췄어요. **ontology 브랜드의 기존 토큰 값과 렌더 색은 그대로예요.** 새 토큰 6개는 ontology 에서 1.7.0 과 같은 색으로 풀려요. ontology 에서 렌더가 바뀌는 곳은 PlanCard · ToolCallCard 진행 스피너 arc 가 불투명해지는 것 하나예요.

| 대상 | 1.7.0(기본 라이트) | 이번 변경 뒤 |
|---|---|---|
| Checkbox · Radio · Textarea 경계 | 1.23 | 4.83(다크 4.12) |
| Input · Select 경계 | 1.47(다크 1.95) | 4.83(다크 4.12) |
| Switch 꺼짐 트랙 · Slider 트랙 | 1.23 | 4.83(다크 4.12) |
| Button 포커스 링 | 2.54 | 3.68 |
| Progress 채움(default · success · warning) | 2.97 · 1.84 · 1.54 | 4.17 · 4.05 · 3.98 |
| 성공 · 경고 · 대기 아이콘 · 상태 점 | 2.28 · 1.91 · 2.54 | 5.02 · 4.92 · 4.83 |
| 진행 스피너 arc | 2.83 | 3.68 |
| 완료 · 진행 점 위 글리프 | 2.28 · 2.97 | 5.02 · 4.49(다크 11.55 · 4.49) |
| 오류 테두리(RecoveryBanner · AttachmentCard) | 1.32 · 1.44 | 3.44 · 3.76 |
| Alert 경고 테두리 | 1.85 | 4.76 |

## 업그레이드

컴포넌트를 그대로 쓰면 코드를 바꿀 필요가 없어요. 토큰 값을 직접 참조하거나 library 소스를 복사해 쓴다면 아래를 확인하세요.

| 변수 | 바뀐 값(기본 라이트 / 다크) | 확인할 것 |
|---|---|---|
| `--axis-input-border-default` | #6B7280 / #6B7280 | 입력 테두리가 눈에 띄게 짙어져요. hover 는 `--axis-input-border-hover` #4B5563 / #9CA3AF |
| `--axis-button-border-focus` | #3B82F6 (테마 무관) | 버튼 포커스 링이 input 포커스 링과 같은 색이에요 |
| `--axis-border-warning` | #A16207 / 그대로 | 경고 테두리가 짙어져요 |
| `--axis-status-running-contrast` | #030712 (흰색에서) | 진행 상태 점 위 글리프가 짙은 색이에요. 진행 점 위에 흰 글자를 그렸다면 확인하세요 |
| `--axis-status-success-contrast` | 라이트 흰색 그대로 / 다크 #030712 | 다크에서 완료 점이 green.400 으로 밝아져 위의 글리프가 짙은 색이에요. **성공 바탕 버튼의 흰 글자로 썼다면 `--axis-button-text-default` 로 바꾸세요**(PlanCard 승인 버튼이 그렇게 바뀌었어요) |
| 새 `--axis-form-control-border` · `--axis-form-control-track` | #6B7280 | 체크박스 · 라디오 · 텍스트영역 경계와 스위치 · 슬라이더 트랙 |
| 새 `--axis-progress-fill-{default,success,warning,destructive}` | #2563EB · #15803D · #A16207 · #DC2626 / #3B82F6 · #22C55E · #EAB308 · #EF4444 | Progress 채움 |

- 상태 점 · 아이콘을 직접 그린다면 흰 바탕 3:1 에 못 미치는 `--axis-status-success` · `--axis-status-warning` · `--axis-status-neutral` 대신 `--axis-text-success` · `--axis-text-warning` · `--axis-text-tertiary` 를 쓰세요. 전역 `status.*` 값은 이번에도 바꾸지 않았어요(진행 막대 · 왼쪽 선 등은 그대로).
- library 사본(Checkbox · RadioGroup · Textarea · Switch · Slider · Progress)과 레지스트리 agentic 항목은 새 변수를 참조해요. `@axis-ds/tokens` 1.8.0 이상과 함께 쓰세요. 1.7.0 tokens 와 섞으면 새 변수가 정의되지 않아, 경계는 글자색(currentColor)으로 그려지고 트랙 · 채움 바탕은 투명해져요(추정: CSS 의 정의되지 않은 var() 규칙).

## 알려진 제약

- ontology 컨트롤 경계(라이트 1.15~1.31 · 다크 1.40~1.42)와 ontology Progress success · warning 채움(1.93 · 1.62)은 ontology 값을 바꾸지 않는 범위라 그대로예요. 값 결정이 필요해요.
- 대기 · 건너뜀 점(`--axis-status-neutral-muted`, 1.47)은 사용자 결정으로 값을 유지해요.
