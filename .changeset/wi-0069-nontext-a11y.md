---
"@axis-ds/ui-react": minor
"@axis-ds/agentic-ui": minor
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

문서 페이지 axe 에서 나온 비대비 접근성 결함을 고치고, 시각 표시에 하이드레이션 안전 prop 을 더했어요(WI-0069).

- agentic-ui `MessageBubble` · `StepTimeline`: `locale` · `timeZone` · `formatTime` prop 을 더했어요. `timeZone`(StepTimeline 은 `locale` 도) 을 주지 않으면 시각을 하이드레이션 뒤에 브라우저 시간대로 채워, 서버와 브라우저 시간대가 달라 생기던 하이드레이션 오류(React #418)가 나지 않아요. 최종 표시는 이전과 같아요. 두 모듈 산출물에 `"use client"` 가 붙어요.
- agentic-ui `MessageBubble` 전송 상태 아이콘이 `role="img"` 와 `aria-label` 로 읽혀요(역할 없는 span 의 aria-label, axe aria-prohibited-attr).
- agentic-ui `CodeBlock` 코드 스크롤 영역이 Tab 으로 포커스를 받는 이름 있는 region 이에요(axe scrollable-region-focusable).
- agentic-ui `DiffViewer` 추가 · 삭제 줄 수를 aria-label 대신 화면 낭독 전용 문장으로 읽어요.
- agentic-ui `RecoveryBanner` 재시도 버튼이 description 이 없을 때 없는 id 를 `aria-describedby` 로 가리키지 않아요.
- ui-react `Dialog` · `Sheet` · `Popover`: 닫힌 동안 트리거에 `aria-controls` 를 두지 않아요(없는 id 참조, axe aria-valid-attr-value). open · defaultOpen · onOpenChange 는 그대로이고, 세 모듈 산출물에 `"use client"` 가 붙어요.
- ui-react `CommandSeparator` 가 listbox 안에서 `role="separator"` 대신 보조기술에서 숨긴 장식 요소예요(axe aria-required-children). 검색 중 숨김 · `alwaysRender` 는 그대로예요.
- ui-react `ScrollArea` 뷰포트가 Tab 으로 포커스를 받아 키보드로 스크롤할 수 있어요.
- cli · mcp: 동봉 레지스트리의 dialog · agentic 5개 항목(code-block · diff-viewer · message-bubble · recovery-banner · step-timeline) 소스가 새 코드로 바뀌었어요.
