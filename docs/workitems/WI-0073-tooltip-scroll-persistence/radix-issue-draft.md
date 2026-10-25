<!--
메모(게시 금지 · 초안): WI-0073(#194) Radix 업스트림 이슈 초안이에요. 게시 여부는 사용자가 정해요.
- 대상: radix-ui/primitives, 패키지 @radix-ui/react-tooltip
- 근거: 설치본 1.2.8 dist/index.mjs 와 npm 최신 1.4.1(2026-10-14) dist/index.mjs 를 직접 읽음.
  Context7 · 웹 검색 MCP 가 연결 실패해서 같은 내용의 기존 이슈가 있는지는 확인하지 못했어요. 게시 전에 중복 검색이 필요해요.
- 재현 수치: AXIS 문서 /components/tooltip/ 정적 빌드(Chromium, Playwright), 2026-10-25.
  수정 전 1280x720: 화면 밖 트리거 Tab 뒤 scrollY 0 -> 848, 800ms 뒤 role=tooltip 0(닫힘). 같은 페이지의 스크롤 없는 트리거 4개는 열린 채.
  1280x3000(스크롤 없음): 5개 모두 열린 채(음성 대조).
- 본문은 업스트림이 영어 저장소라 영어로 적었어요.
-->

# [Tooltip] Tooltip opened by keyboard focus is closed immediately by the focus-induced scroll (WCAG 1.4.13)

## Bug report

### Current behavior

When a `Tooltip.Trigger` is outside the viewport and the user moves focus to it with <kbd>Tab</kbd>,
the browser scrolls the trigger into view. `TooltipContentImpl` listens to `scroll` on `window`
(capture) and calls `onClose()` whenever the scrolled element contains the trigger:

```js
// @radix-ui/react-tooltip 1.4.1, dist/index.mjs (same logic in 1.2.8)
React.useEffect(() => {
  if (context.trigger) {
    const handleScroll = (event) => {
      if (event.target instanceof Node && event.target.contains(context.trigger)) {
        onClose();
      }
    };
    window.addEventListener("scroll", handleScroll, { capture: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }
}, [context.trigger, onClose]);
```

The tooltip opens on `focus`, then the scroll caused by that same focus closes it in the next frame.
Keyboard users never see the tooltip for any trigger that was off screen, while the trigger keeps focus.

### Expected behavior

A tooltip shown because its trigger has keyboard focus should stay visible until focus leaves the trigger,
the user dismisses it (<kbd>Esc</kbd>), or pointer hover ends. WCAG 2.2 SC 1.4.13 (Content on Hover or Focus)
requires additional content triggered by focus to be **persistent**. The scroll that the browser performs to
reveal the focused element is not a user action that should dismiss it.

### Steps to reproduce

1. Render a page taller than the viewport with a `Tooltip` whose trigger is below the fold (e.g. viewport 1280x720, trigger at y ~ 1200).
2. Press <kbd>Tab</kbd> until the trigger receives focus. The page scrolls (`scrollY` 0 -> 848 in our case).
3. Wait ~800ms: `data-state` on the trigger is `closed`, no `[role="tooltip"]` in the DOM. Focus is still on the trigger.
4. Control: make the viewport tall enough that no scroll happens (1280x3000). The same trigger stays open.

### Why it cannot be worked around with public props

- `TooltipContentProps` exposes `onEscapeKeyDown` and `onPointerDownOutside`, but nothing for the scroll close.
- `onOpenChange(false)` does not carry a reason, so a controlled consumer cannot tell a scroll close
  from blur / Escape / pointer leave without listening to `scroll` itself and relying on listener order.

### Suggested fix (any one)

1. Ignore the scroll close while the trigger is the active element and the tooltip was opened by focus
   (the Popper already repositions the content on scroll).
2. Or add a prop on `Tooltip.Content`, e.g. `onScrollDismiss?: (event: Event) => void` with `event.preventDefault()`
   support, consistent with `onEscapeKeyDown` / `onPointerDownOutside`.
3. Or pass a reason to `onOpenChange` (`"scroll" | "escape" | "blur" | ...`).

### Our workaround

We wrap `Tooltip.Root` in a controlled component that registers its own capture `scroll` listener before the
content mounts, sets a flag for the current task, and drops `onOpenChange(false)` when the flag is set and the
trigger has focus (Escape / pointer-down-outside are marked explicitly so they still close). It works but depends
on listener registration order, which is an implementation detail.

### Your environment

| Software | Version |
| --- | --- |
| @radix-ui/react-tooltip | 1.2.8 (also read 1.4.1 source: same logic) |
| React | 19.2.3 |
| Browser | Chromium (Playwright 1.61.1) |
| OS | Linux (WSL2) |
