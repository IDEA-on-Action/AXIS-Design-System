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
- **변수를 덮어써서 테마 · 브랜드를 만들었다면** 새 변수도 함께 덮어쓰세요. 아래 컴포넌트는 1.8.0 에서 읽는 변수가 바뀌어, 예전 변수만 덮어쓰면 기본값으로 남아요.

  | 컴포넌트 | 1.7.0 까지 읽던 변수 | 1.8.0 에서 읽는 변수 |
  |---|---|---|
  | Progress `default` 채움 | `--axis-surface-brand` | `--axis-progress-fill-default` |
  | Progress `success` · `warning` · `destructive` 채움 | `--axis-color-green-500` · `-yellow-500` · `-red-500`(primitive) | `--axis-progress-fill-success` · `-warning` · `-destructive` |
  | Checkbox · RadioGroupItem · Textarea 경계 | `--axis-border-default` | `--axis-form-control-border` |
  | Switch 꺼짐 바탕 · Slider 트랙 | `--axis-surface-tertiary` | `--axis-form-control-track` |

  primitive 색 오버라이드는 1.8.0 부터 ui-react 컴포넌트에 닿지 않아요(테마 커스터마이징 가이드 「2. CSS 변수 오버라이드」 갱신).
- 새 변수는 ui-react 와 library 사본(Checkbox · RadioGroup · Textarea · Switch · Slider · Progress)만 참조해요. 레지스트리 `r/` 항목(32파일)에는 새 변수 참조가 없어요. agentic 항목이 새로 참조하는 `--axis-text-success` · `-warning` · `-error` · `-tertiary` · `--axis-border-error` · `--axis-button-text-default` 는 1.7.0 tokens 에도 있는 변수예요(실측: r/ 의 `--axis-*` 99개가 모두 1.7.0 `variables.css` 에 있음).
- 새 변수 참조에는 1.7.0 이 읽던 변수를 fallback 으로 두었어요(`var(--axis-progress-fill-default,var(--axis-surface-brand))`, success · warning · destructive 는 `--axis-color-{green,yellow,red}-500`, 경계는 `--axis-border-default`, 트랙은 `--axis-surface-tertiary`). 그래서 `@axis-ds/tokens` 1.7.0 CSS 와 섞여도 경계 · 트랙 · 채움은 1.7.0 색으로 물러나요. 실측(Next 15.5.4 · Tailwind 4 소비자, tokens 1.7.0 + 이 브랜치 ui-react, Chromium 계산값): 기본 라이트 Progress 채움 3.68 · 2.28 · 1.92 · 3.76, 트랙 · 체크박스 경계 1.24 로 1.7.0 단독 앱과 같고, fallback 이 없던 빌드에서는 채움 · 트랙이 투명(1)이고 체크박스 경계가 글자색(17.74)이었어요. 3:1 대비는 tokens 1.8.0 과 함께 쓸 때만 나와요(같은 앱에 tokens 1.8.0 을 넣으면 4.83 · 5.17 등).

## 알려진 제약

- ontology 컨트롤 경계(라이트 1.15~1.31 · 다크 1.40~1.42)와 ontology Progress success · warning 채움(1.93 · 1.62)은 ontology 값을 바꾸지 않는 범위라 그대로예요. 값 결정이 필요해요.
- 대기 · 건너뜀 점(`--axis-status-neutral-muted`, 1.47)은 사용자 결정으로 값을 유지해요.
- MCP 서버(`@axis-ds/mcp`)가 동봉한 토큰 데이터(`src/registry/data/tokens.json`)는 이번에 바뀐 기본 테마 값과 새 변수를 반영하지 않아요. 이 데이터는 처음 만든 뒤(ea764b4) 갱신되지 않았고, mcp patch 는 동봉 레지스트리(`apps/web/public/r`) 갱신만 담아요. MCP 로 토큰을 물으면 처음 만든 때의 목록과 값이 나와요(실측: 새 변수 6개와 1.7.0 의 `--axis-control-h-*` 밀도 토큰도 0건). WI-0076(#202)에서 고칠 예정이에요.
