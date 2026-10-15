# WI-0025 릴리스 노트: 브랜드 테마 축 도입과 온톨로지 테마

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | TODO: [todo.md](./todo.md)

## 1.2.1 (patch) - 토큰 정합 (M1, PR #90)

> 대상: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme` 1.2.0 → 1.2.1 (linked)

### 배경

1.2.0의 ui-react 컴포넌트 일부가 토큰 원본에 없는 CSS 변수(`--axis-surface-primary` · `--axis-ring` · `--axis-interactive-primary` 등 24종, 60곳)를 참조했습니다. 정의 없는 변수는 속성을 무효로 만들어 바탕이 투명해지거나 키보드 포커스 링이 사라졌습니다. agentic-ui는 primitive 색(`--axis-color-*`, 80곳)을 직접 참조해 테마가 바꿀 수 없었습니다.

### 변경 사항

#### tokens: semantic 토큰 추가 (기존 값 변경 없음)
- `interactive.primary` (체크 · 선택 · 진행 표시, 라이트 · 다크 #3B82F6)
- `status.*` 14개, `diff.*` 4개, `agent.*` 4개 (agentic-ui용, 값은 기존 참조와 동일)
- Alert용 `border.info` · `border.warning` · `icon.info`

#### ui-react: 화면이 바뀌는 컴포넌트 13개
| 컴포넌트 | 1.2.0 | 1.2.1 |
|---|---|---|
| Popover · DropdownMenu(Content · SubContent) · Sheet · Command | 바탕 투명 | `surface-default` 불투명 바탕 |
| Checkbox · RadioGroup · Switch · Slider · Textarea · Toggle · Sheet | 키보드 포커스 표시 없음 | `border-focus` 포커스 링 (라이트 #3B82F6 · 다크 #60A5FA) |
| Checkbox · RadioGroup · Switch · Slider | 선택 · 켜짐 상태 색 없음 | `interactive.primary` |
| Alert (info · success · warning · destructive) | 바탕 없음, 테두리가 글자색 | 상태별 semantic 바탕 · 글자 · 테두리, 다크에서는 어두운 상자. 아이콘은 변형 글자색을 따름 |
| Alert (default) · Textarea | 바탕 투명 | `surface-default` |
| Badge (secondary) | 바탕 없음 | `surface-secondary` 회색 바탕 |
| Progress | 채움 막대 투명 | default `surface-brand`, success · warning · error는 상태 색 |

라이트 Alert success · warning의 테두리 대비(2.18:1 · 1.85:1)는 상태를 전달하는 유일한 수단이 아닌 장식 요소라 WCAG 1.4.11 비텍스트 대비 대상에서 제외한다고 판단했습니다(글자 · 아이콘은 4.7:1 이상).

#### agentic-ui: 화면 변화 없음
13개 컴포넌트의 상태 · diff · 아바타 색을 semantic 토큰으로 교체했습니다. 라이트 · 다크 계산값이 1.2.0과 같음을 측정으로 확인했습니다. 버튼 글자의 `text-white` 4곳은 `--axis-button-text-default` · `--axis-button-destructive-text-default`(기본 #FFFFFF)로 바꿨습니다.

#### 동작이 달라지는 사용 방식
`:root { --axis-color-blue-500: ... }`처럼 primitive 색을 덮어써 브랜드 색을 바꾸던 방식(`theme-customization.md` 92~97행 안내)은 이제 agentic-ui에도 닿지 않습니다. semantic · component 토큰은 빌드 때 값으로 풀려 나가므로, 1.2.0에서도 이 방식이 닿던 곳은 agentic-ui뿐이었습니다. 1.3.0의 브랜드 축(`data-brand`)이 대체 수단이며, 가이드는 1.3.0(M4)에서 고칩니다.

#### CI
- `pnpm check-token-refs`: ui-react · agentic-ui의 `var(--axis-*)`가 모두 정의됐는지, agentic-ui에 primitive 참조가 없는지 검사 (frontend · publish 워크플로)

### 소비 프로젝트 영향 (2026-10-15 확인)
| 프로젝트 | 설치 버전 | 영향 컴포넌트 사용처 |
|---|---|---|
| RFP-X | tokens · ui-react 1.1.2 (정확 버전 고정) | Badge secondary 1곳 |
| Discovery-X | tokens · theme · ui-react 1.1.1 (정확 버전 고정) | Badge secondary 7곳, Textarea 3곳 |

두 프로젝트 모두 정확 버전을 고정해 1.2.1이 자동으로 반영되지 않습니다. 업그레이드 시 Badge secondary에 회색 바탕이, Textarea에 바탕과 포커스 링이 생깁니다. Minu는 로컬에서 확인하지 못했습니다.

### 검증
- type-check · lint · test · build (turbo `--force`, 캐시 0): ui-react 100 · agentic-ui 72 · cli 58 · theme 21 통과
- `check-token-refs`: 1.2.0 소스에서 위반 140건(정의 누락 60 · primitive 80) 재현, 1.2.1에서 0건. 정의 1줄 삭제 · 판정 fixture · 측정 실패 대조군 통과. CI 로그에서 단계 실행 확인
- 화면 비교(Playwright 하네스, 라이트 · 다크 · 포커스 208장): ui-react 13개 변화가 plan 1.3 대상 값과 일치, agentic-ui 13개 차이 0
- Breaking change 없음: 공개 export와 기존 CSS 변수 이름 삭제 0건, 화면 변화는 정의 누락 보완분뿐
