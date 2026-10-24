# WI-0071 릴리스 노트: 움직임 줄이기에서 로딩 · 진행 표시는 느리게

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #190 | 대상: `@axis-ds/ui-react` · `@axis-ds/agentic-ui` patch

## 바뀐 점

움직임 줄이기(`prefers-reduced-motion: reduce`)를 켠 사용자에게 1.6.2 에서는 스피너 · 진행 표시까지 멈춰 앱이 응답하지 않는 것처럼 보였어요. 이제 로딩 · 진행 표시는 멈추지 않고 느리게 움직여요.

| 컴포넌트 | 표시 | 기본 | 움직임 줄이기 |
|---|---|---|---|
| Progress (`indeterminate`) | 1/3 폭 막대 왕복 | 1.5초 | 4초 |
| Skeleton | 깜박임 | 2초 | 5초 |
| RunProgress · ToolCallCard · PlanCard · MessageBubble | 스피너 회전 | 1초 | 3초 |
| ThinkingIndicator | 점 튀기 | 1초 | 2.5초 |
| RunProgress · StepTimeline · StreamingText | 실행 중 점 · 배지 · 커서 깜박임 | 2초 | 5초 |

- 열고 닫는 애니메이션(Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast)과 Accordion 은 1.6.2 와 같이 움직임 줄이기에서 멈춰요.
- 움직임 줄이기를 켜지 않은 사용자에게는 바뀌는 것이 없어요.

## 업그레이드

- 코드나 Tailwind 설정을 바꿀 필요가 없어요. Tailwind 3 · 4 기본 유틸리티(`motion-reduce:![animation-duration:...]`)만 써요.
- 복사 설치(`axis add`)로 agentic 컴포넌트를 받은 경우 다시 받으면 같은 동작이 돼요(레지스트리 항목 7개 갱신).
