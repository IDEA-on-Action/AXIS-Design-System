---
"@axis-ds/tokens": minor
"@axis-ds/ui-react": minor
"@axis-ds/agentic-ui": minor
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

기본 테마(브랜드 미지정)에서 4.5:1 에 못 미치던 글자 대비를 맞췄어요(WI-0062). ontology 브랜드 출력은 바뀌지 않아요.

- tokens 기본값: `--axis-agent-avatar-assistant` purple.500 → purple.600 · `--axis-agent-avatar-tool` blue.500 → blue.600(흰 이니셜 3.95 · 3.67 → 5.38 · 5.17), `--axis-status-neutral-muted-contrast` 흰색 → gray.700(대기 단계 숫자 1.47 → 7.00), `--axis-diff-added-text` 라이트 green.600 → green.700 · `--axis-diff-removed-text` 라이트 red.600 → red.700 · 다크 red.400, `--axis-input-text-placeholder` 라이트 gray.400 → gray.500(다크 gray.400 유지), `--axis-button-text-disabled` 라이트 gray.500 → gray.600 · `--axis-button-bg-disabled` 다크 gray.700 → gray.800, shadcn 호환 `--destructive` 라이트 red.500 → red.600(흰 글자 3.76 → 4.83). 전역 `status.*` 값은 그대로예요.
- ui-react `Toast` 설명에서 `opacity-90` 을 뺐어요(성공 · 경고 바탕 3.99 · 3.98, ontology 경고 · 오류 3.95 → 불투명 글자). `DropdownMenuShortcut` 은 포커스 바탕 위에서도 읽히게 `text-secondary` 를 써요.
- agentic-ui: `TokenUsageIndicator` 경고 · 초과 글자는 `text-warning` · `text-error`, `DiffViewer` 헤더 `+N` · `-N` 은 `text-secondary` · `text-error`, 보기 탭 · 줄 번호와 `CodeBlock` 언어 배지 · `ContextPanel` 제공자 · 버전 · `ToolCallCard` 소요 시간은 회색 바탕 위라 `text-secondary` 를 써요.
- cli · mcp: 동봉 레지스트리의 toast · agentic 5개 항목(code-block · context-panel · diff-viewer · token-usage-indicator · tool-call-card) 소스가 새 코드로 바뀌었어요.
