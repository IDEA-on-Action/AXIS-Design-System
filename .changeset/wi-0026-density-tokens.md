---
"@axis-ds/tokens": minor
"@axis-ds/ui-react": minor
---

밀도 토큰을 추가했습니다(WI-0026). 컨트롤 높이 · 글자 크기 · 단계별 둥글기를 CSS 변수로 바꿀 수 있습니다.

- `@axis-ds/tokens`: 새 변수 15개. `--axis-control-h-sm|md|lg`(32 · 40 · 48px), `--axis-control-font-size-sm|md|lg`(12 · 14 · 16px), `--axis-field-h`(40px), `--axis-toggle-h-sm|md|lg`(36 · 40 · 44px), `--axis-table-font-size` · `--axis-table-head-font-size`(14px), `--axis-radius-control|field`(`calc(var(--radius) - 2px)`) · `--axis-radius-surface`(`var(--radius)`). JS export 에도 `control` · `field` · `toggle` · `table` · `radius.control|field|surface` 가 생깁니다.
- `@axis-ds/ui-react`: Button · Input · Select 트리거 · Toggle · Table · Card · Dialog 가 고정 클래스 대신 이 변수를 읽습니다. 모든 참조에 1.6.x 와 같은 크기의 리터럴 fallback 이 있어, 토큰 CSS 가 옛 버전이어도 크기가 유지됩니다.
- 브랜드를 지정하지 않은 화면은 바뀌지 않습니다(1.6.3 배포본과 Chromium 계산값 대조). 예외: `@axis-ds/tokens/css/shadcn` 없이 `@axis-ds/tokens/css` 만 쓰는 구성에서는 위 7개 컴포넌트의 둥글기가 0px 에서 fallback 6px(Card · Dialog 8px)로 바뀝니다.
- `ontology` 브랜드는 디자인 시스템 v1 밀도를 씁니다. Button 27 · 34 · 42px(글자 13 · 14 · 15px), Input · Select 트리거 36px, Table 본문 13.5px · 머리 13px, 둥글기 Button · Toggle 10px → 8px, Input · Select 트리거 10px → 6px, Card · Dialog 12px. Toggle 높이와 Sheet(0px), 그 밖의 컴포넌트(Select 팝업 · Popover 10px 등)는 그대로입니다.
