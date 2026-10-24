# WI-0029: 기본 테마 흰 글자 대비 미달 해소 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0029 | GitHub: #94 | 우선순위: P2 | 상태: Approved (2026-10-24 결정 반영)
> 기준: `main` 1fa347c (linked 4패키지 tokens · theme 1.5.1, ui-react · agentic-ui 1.5.2)
> 관련: WI-0025 M3 설계 중 발견(plan.md 5.1 U20). 기준선 조항은 WI-0025 PRD AC3(기본 출력 불변) · AC8(a11y 기준선)

---

## 1. 개요

### 1.1 문제 (실측, 2026-10-24)

기본 테마(브랜드 미지정)에서 흰 글자가 놓이는 채운 바탕과 일부 보조 글자가 WCAG AA 4.5:1 에 못 미쳐요.

측정 조건: 루트에서 `pnpm turbo run build --filter=@ax/web... --force`(캐시 0/4, rc 0) 뒤 `apps/web/out` 을 static 서버로 띄우고 Chromium 에서 `a11y.spec.ts` 를 실행했어요(40건 통과, 기준선 이내). 위반 노드는 스펙이 붙이는 axe 첨부에서 뽑았어요. 대비는 axe 표기(소수 둘째 자리 버림)예요.

| # | 테마 | 전경 / 바탕 | 대비 | 노드 | 토큰 | 소비처 |
|---|---|---|---|---|---|---|
| P1 | 라이트 · 다크 | 흰 / #3B82F6 | 3.67 | 각 18 | `button-bg-default`(themeIndependent) · `agent-message-user-bg` | Button default, MessageBubble user |
| P2 | 라이트 · 다크 | 흰 / #EF4444 | 3.76 | 각 2 | `button-destructive-bg-default` | Button destructive |
| P3 | 라이트 · 다크 | 흰 / #22C55E | 2.27 | 각 1 | `status-success-contrast` / `status-success` | PlanCard 승인 버튼(데모 경로) |
| P4 | 라이트 | #EF4444 / #F3F4F6 | 3.41 | 1 | `status-error` / `surface-secondary` | PlanCard 거절 버튼 글자(데모 경로) |
| P5 | 다크 | #6B7280 / #030712 | 4.16 | 2 | `text-tertiary` | PlanCard 진행률(데모 경로) |
| P6 | 다크 | #6B7280 / #09090B | 4.11 | 1 | `text-tertiary` | MessageBubble metadata(데모 경로) |

- 합계: 기본 브랜드 46노드(WI-0029 기준선 14건 · 40노드 + 데모 경로 라이트 2 · 다크 4). 2026-10-17~18 기록(project-todo.md)과 같아요
- ontology 브랜드: 20테스트 위반 0. 같은 첨부 경로가 기본 브랜드에서는 위반을 실어 와서(양성 대조) 실측된 0이에요
- axe 기준선 밖(hover, 계산값): PlanCard 거절 hover 글자 라이트 #EF4444 / #F3E2E4 3.01, 다크 #EF4444 / #271C2A 4.34. 바탕은 `surface-secondary` 위 `status-error` 10% sRGB 합성을 8bit 로 양자화한 값이에요

### 1.2 결정 (2026-10-24 사용자)

| # | 결정 |
|---|---|
| D1 | 교체 전략은 **컴포넌트 한정 재지정**이에요. primitive 값과 전역 `status.*` 는 바꾸지 않고, 미달을 일으키는 component · semantic 참조만 한 단계 진하게 옮겨요 |
| D2 | 다크 `text.tertiary` 를 gray.400 으로 올리면서 계층을 지키려고 다크 `text.secondary` 를 gray.300 으로 같이 올려요. 다크 `input.text.placeholder` 는 gray.400 에 고정해 입력값과 구분되게 해요 |
| D3 | 범위는 1.1 의 기준선 쌍(P1~P6)과 PlanCard 거절 hover 쌍이에요. CI 밖에서 찾은 쌍은 후속 WI 로 나눠요(5절) |
| D4 | WI-0025 AC3 게이트(`baseline-1.2.1.test.mjs`)에는 WI-0029 예외 목록을 명시해요. 목록 밖의 1.2.1 변수는 계속 불변이어야 해요 |
| D5 | 새 공개 CSS 변수가 생기므로 minor 로 올려요. linked 규칙상 tokens · theme · ui-react · agentic-ui 가 1.6.0 이 돼요 |
| D6 | (구현 중 추가, 2026-10-24) shadcn `--muted-foreground` 는 종전처럼 `text.secondary` 에서 파생해요. 그래서 D2 로 다크 값이 gray.300 으로 바뀌고, `shadcn-compat.css` 다크 한 줄(`--muted-foreground`)을 WI-0029 예외로 등록해요 |

### 1.3 검토했지만 고르지 않은 안

| 안 | 내용 | 고르지 않은 이유(계산값) |
|---|---|---|
| A | D1 과 같고, PlanCard 를 전역 `status.success` · `status.error` 로 고침 | 성공 녹색 휘도가 0.411 에서 0.159 로 떨어져 막대 · 아이콘 · 테두리 전체가 바뀌어요. 다크 #1F2937 위 green.700 아이콘이 2.92 로 비텍스트 3:1 에 못 미쳐요 |
| B | primitive 500 단계 값을 4.5 경계까지 조정 | 거절 4.10 · 승인 hover 3.29 가 남고, 라이트 tertiary 4.37 · 다크 거절 3.92 가 새로 미달이에요. 500 과 600 의 구분이 1.06~1.14 로 줄고 green 스케일 순서가 뒤집혀요 |
| C | 흰 글자 대신 #030712 글자 | hover · active 에서 3.00~4.16 으로 새 미달이 생기고, 채운 버튼에 흰 글자를 쓰는 관례에서 벗어나요 |

---

## 2. 변경 명세

값은 모두 기존 primitive 를 참조해요. 대비는 node 로 계산한 값이에요(소수 둘째 자리 버림).

### 2.1 기존 토큰 참조 변경 (`packages/axis-tokens/src`)

| 토큰 | 테마 | 현재 | 변경 | 대비(현재 → 변경) |
|---|---|---|---|---|
| `button.bg.default` | 공통 | blue.500 | blue.600 #2563EB | 흰 3.67 → 5.16 |
| `button.bg.hover` | 공통 | blue.600 | blue.700 #1D4ED8 | 흰 5.16 → 6.70 |
| `button.bg.active` | 공통 | blue.700 | blue.800 #1E40AF | 흰 6.70 → 8.72 |
| `button-destructive.bg.default` | 공통 | red.500 | red.600 #DC2626 | 흰 3.76 → 4.82 |
| `button-destructive.bg.hover` | 공통 | red.600 | red.700 #B91C1C | 흰 4.82 → 6.47 |
| `button-destructive.bg.active` | 공통 | red.700 | red.800 #991B1B | 흰 6.47 → 8.31 |
| `agent.message-user-bg` | 라이트 · 다크 | blue.500 | blue.600 | 흰 3.67 → 5.16 |
| `text.tertiary` | 다크 | gray.500 | gray.400 #9CA3AF | /#030712 4.16 → 7.93, /#09090B 4.11 → 7.83 |
| `text.secondary` | 다크 | gray.400 | gray.300 #D1D5DB | 계층 유지(D2) |
| `input.text.placeholder` | 다크 | {text.secondary} | gray.400 고정(themeIndependent, 출력 값은 1.2.1 과 같음) | 입력 글자 gray.100 과 구분 유지(D2) |
| `plan-card.reject-hover-text` | 라이트 / 다크 | {status.error}(themeIndependent) | 라이트 red.700 · 다크 red.400 #F87171 | 3.01 → 5.17 / 4.34 → 5.90 |

- 단계 구분(휘도 비): blue 600/700 1.29, red 600/700 1.34, green 700/800 1.42 로 hover 구분이 남아요
- 다크 비텍스트: blue.600 버튼은 #030712 위 3.89, #09090B 위 3.84, red.600 은 #030712 위 4.16 이에요

### 2.2 새 component 토큰 (PlanCard 전용)

| 토큰 | 라이트 | 다크 | 대비 | 바꾸는 자리 |
|---|---|---|---|---|
| `plan-card.approve-bg` | green.700 #15803D | green.700 | 흰 2.27 → 5.01 | PlanCard 승인 버튼 바탕 |
| `plan-card.approve-hover-bg` | green.800 #166534 | green.800 | 흰 3.29 → 7.13 | 승인 버튼 hover 바탕 |
| `plan-card.reject-text` | red.700 #B91C1C | {status.error} 유지 | /#F3F4F6 3.41 → 5.87, 다크 /#111827 4.71 유지 | 거절 버튼 글자 |

- `packages/axis-agentic-ui/src/plan-card/index.tsx` 의 className 3곳을 새 변수로 바꿔요
- ontology 출력 불변: ontology 는 기존 semantic · component 변수를 모두 재정의해서(라이트 · 다크 각 블록, 2.1 의 대상 10개 확인) 2.1 은 영향이 없어요. 2.2 의 새 변수 3개는 `src/brands/ontology/{light,dark}.json` 에 지금 ontology 의 `status-success` · `status-success-strong` · `status-error` 값으로 넣고, 같은 선언을 WI-0025 초안 CSS(`docs/workitems/WI-0025-brand-theme/axis-theme-ontology.css`)에도 추가해 `brands.test.mjs` U18 대조를 맞춰요

### 2.3 바꾸지 않는 것

- primitive(`colors.json`), 전역 `status.*`, `surface-brand`, `interactive.primary`
- `shadcn-compat.css` 는 다크 `--muted-foreground` 한 줄만 바뀌고(D6) 나머지는 바이트 불변이에요

---

## 3. 수용 기준

- **AC1** 기본 브랜드 a11y(라이트 · 다크 10페이지)에서 P1~P6 위반 노드가 0이에요. `--force` 빌드 위 static 실측으로 판정하고, 위반이 0인 것을 양성 대조(기준선 상수를 비운 상태에서도 다른 위반이 잡히는 측정 경로)와 함께 보여요
- **AC2** `a11y.spec.ts` 의 `WI0029_KNOWN_PAIRS` · `DEFAULT_BASELINE_CAP` · `DEMO_KNOWN_PAIRS` · `DEMO_BASELINE_CAP` 을 지우고, 기본 브랜드 기준선 0 을 단언해요. `DEFAULT_BUTTON_BG` 양성 대조(a11y.spec · brand-demo.spec)는 새 값 #2563EB 로 고쳐요
- **AC3** 2.1 · 2.2 의 계산 대비가 모두 4.5 이상이에요(라이트 · 다크, hover · active 포함). 이를 단위 테스트로 고정해요(`scripts/check-contrast-pairs.mjs` 의 CONTRAST_PAIRS 갱신 포함)
- **AC4** ontology 출력이 바이트 불변이에요(`dist/css/brands/ontology.css` 를 변경 전후로 비교, 새 변수 3개 추가분만 차이로 허용). `brands.test.mjs` 통과
- **AC5** `baseline-1.2.1.test.mjs` 는 WI-0029 예외 목록(2.1 의 변수와 새 값)만 허용하고, 목록 밖 1.2.1 변수와 shadcn 출력(D6 의 다크 `--muted-foreground` 한 줄 제외)은 계속 불변을 단언해요. 변이 확인: 예외 목록 밖 변수 하나를 바꾸면 실패해야 해요
- **AC6** `dark-tokens.spec` 의 EXPECTED_DARK 와 fixture 를 갱신해요(다크 값이 라이트와 달라지는 `button-text-disabled` · `plan-card-reject-hover-text` · `plan-card-reject-text`). `input-text-placeholder` 는 gray.400 을 테마 무관으로 고정해 라이트 · 다크 값이 같으므로 증가분이 아니에요
- **AC7** 품질 게이트: `pnpm type-check` · `pnpm lint` · `pnpm test` · `pnpm build` 통과, E2E(a11y · nontext · demo · tokens) 통과
- **AC8** changeset 은 linked 4패키지 minor(1.6.0), 릴리스 노트에 기본 화면 색 변경과 마이그레이션 안내(값을 직접 참조하던 사용자용)를 적어요

---

## 4. 영향 범위

- 버튼 토큰 재사용처(RunProgress 재시도, ApprovalCard 액션, RecoveryBanner 재시도)도 같이 짙어져요. 모두 흰 글자 4.82 이상이 돼요(의도한 번짐)
- 다크 보조 글자(`text-secondary` 48곳 · `text-tertiary`)가 밝아져요. primary(gray.100)와 secondary(gray.300)의 휘도 비는 1.33 이에요
- 알려진 남는 위험: 다크 blue.600 버튼이 `surface-tertiary` #1F2937 위에 놓이면 경계가 2.84 예요. 이 조합이 실제로 쓰이는지는 확인하지 않았어요(후속 WI 비텍스트 범위에서 점검)

---

## 5. 범위 밖 (후속 WI)

이번 조사에서 찾았지만 axe 기준선 밖이어서 CI 가 잡지 않는 쌍이에요. 값은 모두 계산값이고 브라우저 재측정은 하지 않았어요.

- **WI-0062 텍스트 잔여 쌍과 측정 범위 확대**: Toast 설명 opacity-90(라이트 warning 3.98 · success 3.99), text-tertiary 의 hover · focus · 비활성 쌍(ToolCallCard 헤더 hover 라이트 4.39 · 다크 3.66, DropdownMenu shortcut focus, DiffViewer 보기 탭 라이트 3.90 · 다크 3.03, CodeBlock · ContextPanel 라이트 3.90), AgentAvatar 이니셜(흰 / #A855F7 3.95 · #3B82F6 3.67), RunProgress pending 숫자(흰 / #D1D5DB 1.47, axe incomplete), TokenUsageIndicator(warning 1.92 · 초과 3.76), DiffViewer 줄 · 카운트(라이트 2.07~4.24 · 다크 삭제 3.89), shadcn `--destructive-foreground`(흰 / #EF4343 3.78), Input placeholder(흰 바탕 2.54). 측정 범위 확대: a11y PAGES 에 없는 11페이지(실측 흰 / #3B82F6 모드마다 29노드), 패키지 컴포넌트를 렌더하지 않는 agentic 문서 mock, axe incomplete 판정
- **WI-0063 비텍스트 대비(WCAG 1.4.11)**: 폼 컨트롤 경계(Checkbox · RadioGroup 1.23, Input · Select 1.47 · 다크 1.95, Switch 꺼짐 트랙), 포커스 링(blue.400 / 흰 2.54), Progress 막대(다크 surface-brand 2.84, 라이트 green-500 1.84 · yellow-500 1.54), 상태 아이콘 · 점(ToolCallCard pending 2.53, StepTimeline pending 1.47, AgentAvatar busy 1.91 · offline 2.53, ApprovalCard warning 1.85, FeedbackButtons like 2.09), nontext floor 의 스피너(2.83 · 2.97)
