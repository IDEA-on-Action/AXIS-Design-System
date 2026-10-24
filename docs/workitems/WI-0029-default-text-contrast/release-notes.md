# WI-0029 릴리스 노트: 기본 테마 대비 미달 해소

> 작성일: 2026-10-24 | WI: WI-0029 | GitHub: #94 | changeset: linked 4패키지(tokens · theme · ui-react · agentic-ui) minor → 1.6.0, `@axis-ds/cli` · `@axis-ds/mcp` patch

## 변경 사항

- 기본 테마의 Button · Button destructive · MessageBubble 사용자 바탕을 한 단계 진하게 바꿔 흰 글자 대비가 4.5:1 이상이 됐어요(3.67 → 5.16, 3.76 → 4.82). hover · active 도 한 단계씩 내려 단계 구분을 유지해요
- 다크 보조 글자를 밝혔어요: `text-tertiary` #6B7280 → #9CA3AF(4.11~4.16 → 7.83~7.93), 계층 유지를 위해 `text-secondary` #9CA3AF → #D1D5DB. 다크 placeholder 는 #9CA3AF 그대로예요
- PlanCard 전용 변수 3개를 새로 뒀어요: `--axis-plan-card-approve-bg`(#15803D, 흰 글자 5.01) · `--axis-plan-card-approve-hover-bg`(#166534) · `--axis-plan-card-reject-text`(라이트 #B91C1C 5.87). 거절 hover 글자도 라이트 #B91C1C · 다크 #F87171 로 나눴어요
- shadcn 호환 다크 `--muted-foreground` 는 `text-secondary` 를 따라 #D1D5DB 로 바뀌어요
- 바뀌지 않는 것: primitive 색, 전역 `--axis-status-*`, ontology 브랜드 화면
- a11y E2E 의 WI-0029 기준선(허용 위반)을 없애고, 기본 브랜드에서도 위반 0 을 단언해요
- cli · mcp 에 들어 있는 레지스트리의 PlanCard 를 새 코드로 갱신했어요

## 사용자 조치

- 토큰 변수로 색을 쓰고 있다면 할 일이 없어요
- `axis add plan-card` 로 PlanCard 소스를 이미 복사해 갔다면 토큰만 올려서는 승인 · 거절 버튼 대비가 고쳐지지 않아요. `axis add plan-card` 로 다시 받거나, className 3곳을 새 변수로 바꾸세요
- #3B82F6 · #EF4444 를 직접 적어 AXIS 버튼 색과 맞추던 곳은 새 값으로 고치세요
- 자체 브랜드 CSS 로 PlanCard 색을 바꾸던 경우, 같은 값을 새 변수 3개에도 지정하세요

## 남겨 둔 것

- 텍스트 대비 잔여 쌍과 a11y 측정 범위 확대: WI-0062(#170)
- 비텍스트 대비(WCAG 1.4.11): WI-0063(#171)
