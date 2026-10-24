---
"@axis-ds/ui-react": patch
"@axis-ds/agentic-ui": patch
---

움직임 줄이기(`prefers-reduced-motion: reduce`) 설정에서 로딩 · 진행 표시가 멈춰 앱이 응답하지 않는 것처럼 보이던 문제를 고쳤습니다(WI-0071).

- 로딩 · 진행 표시는 멈추지 않고 기본 주기의 2~3배로 느리게 움직입니다. 처리 중이라는 신호는 남기고 움직임의 속도만 줄입니다.
  - `@axis-ds/ui-react`: Progress `indeterminate` 1.5초 → 4초 왕복, Skeleton 깜박임 2초 → 5초
  - `@axis-ds/agentic-ui`: RunProgress · ToolCallCard · PlanCard · MessageBubble 의 스피너 1초 → 3초 회전, ThinkingIndicator 점 1초 → 2.5초, RunProgress · StepTimeline 의 실행 중 표시와 StreamingText 커서 2초 → 5초
- 열고 닫는 애니메이션(Dialog · Sheet · Popover · Select · DropdownMenu · Tooltip · Toast)과 Accordion 은 종전처럼 멈춥니다.
- 움직임 줄이기를 켜지 않은 사용자에게는 바뀌는 것이 없습니다. Tailwind 3 · 4 기본 유틸리티(`motion-reduce:![animation-duration:...]`)만 써서 앱 설정을 바꿀 필요가 없습니다.
