---
"@axis-ds/tokens": minor
"@axis-ds/ui-react": minor
"@axis-ds/agentic-ui": minor
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

기본 테마(브랜드 미지정)의 비텍스트 대비(WCAG 1.4.11, 3:1)를 맞췄어요(WI-0063). ontology 브랜드의 기존 토큰 값과 렌더 색은 바뀌지 않아요.

- tokens 새 변수: `--axis-form-control-border` · `--axis-form-control-track`(기본 gray.500, 흰 바탕 4.83), `--axis-progress-fill-default` · `-success` · `-warning` · `-destructive`(기본 라이트 blue.600 · green.700 · yellow.700 · red.600, 다크 blue.500 · green.500 · yellow.500 · red.500). ontology 는 1.7.0 에서 그 자리에 그려지던 값을 그대로 가져요.
- tokens 기본값: `--axis-input-border-default` gray.300(다크 gray.700) → gray.500(1.47 · 1.95 → 4.83 · 4.16), `--axis-input-border-hover` 라이트 gray.600 · 다크 gray.400, `--axis-button-border-focus` blue.400 → blue.500(흰 바탕 2.54 → 3.68), `--axis-border-warning` 라이트 yellow.500 → yellow.700(1.85 → 4.76), `--axis-status-running-contrast` 흰색 → gray.950, `--axis-status-success-contrast` 다크 흰색 → gray.950. 전역 `status.*` 점 · 막대 색은 그대로예요.
- ui-react: `Checkbox` · `RadioGroupItem` · `Textarea` 경계는 `form-control-border`, `Switch` 꺼짐 · `Slider` 트랙은 `form-control-track`, `Progress` 채움은 `progress-fill-*` 를 써요.
- agentic-ui: 성공 · 경고 · 대기 아이콘과 상태 점(PlanCard · ToolCallCard · ApprovalCard · CodeBlock · FeedbackButtons · AgentAvatar · StepTimeline · RunProgress 완료)은 `text-success` · `text-warning` · `text-tertiary`, 오류 아이콘은 `text-error` 를 써요. PlanCard · ToolCallCard 진행 스피너 arc 는 불투명이에요. RecoveryBanner · AttachmentCard 오류 테두리는 `border-error`, PlanCard 승인 글자는 `button-text-default` 예요.
- cli · mcp: 동봉 레지스트리의 agentic 10개 항목(agent-avatar · approval-card · attachment-card · code-block · feedback-buttons · plan-card · recovery-banner · run-progress · step-timeline · tool-call-card) 소스가 새 코드로 바뀌었어요. ui-react 폼 컨트롤 library 사본은 새 토큰(tokens 1.8.0)을 참조해요.
