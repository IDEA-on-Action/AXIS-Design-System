---
"@axis-ds/ui-react": patch
---

Tooltip 이 키보드 포커스로 열린 뒤 그 포커스가 만든 스크롤에 바로 닫히던 결함을 고쳤어요(WI-0073, WCAG 1.4.13 지속성).

- 화면 밖 트리거로 Tab 하면 브라우저가 트리거를 화면 안으로 스크롤하는데, Radix Tooltip 은 트리거를 담은 요소의 스크롤에 툴팁을 닫아요. 이제 `Tooltip` 래퍼가 open 을 직접 제어해 **트리거에 포커스가 있는 동안 스크롤로 생긴 닫힘**만 무시해요.
- Esc · 포인터 이탈 · 다른 요소로 포커스 이동 · 클릭 · 포커스 없이 hover 로 연 툴팁의 스크롤 닫힘은 이전과 같아요.
- `open` · `defaultOpen` · `onOpenChange` 는 그대로 통과해요. 제어 모드에서 무시한 닫힘은 `onOpenChange(false)` 로 전달하지 않아요.
- `tooltip` 모듈 산출물에 `"use client"` 가 붙어요(상태 훅을 쓰므로). 서버 컴포넌트에서 `<Tooltip>` 을 쓰는 방식은 그대로예요.
