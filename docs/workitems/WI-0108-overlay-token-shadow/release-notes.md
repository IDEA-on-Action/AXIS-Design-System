# WI-0108: 떠 있는 레이어 토큰 그림자 통일 릴리스 노트

> 미발행(2026-11-01 작성) | 대상: `@axis-ds/ui-react` patch · `@axis-ds/agentic-ui` patch(내부 의존) → 1.8.5 | GitHub: #277
> `@axis-ds/tokens` · `@axis-ds/theme` · cli · mcp 는 바뀌지 않아요. 레지스트리(`r/`)에는 이 컴포넌트들이 없어요

## 바뀐 점

- PopoverContent · DropdownMenuContent · DropdownMenuSubContent · SheetContent 의 그림자를 Dialog · Select · Toast 와 같은 토큰 그림자 `shadow-[shadow:var(--axis-shadow-lg)]` 로 바꿨어요. 테두리와 다른 클래스는 그대로예요.
- 기본 브랜드(밝은 · 어두운 같음): PopoverContent · DropdownMenuContent 는 `shadow-md`(`0 4px 6px -1px …, 0 2px 4px -2px …`)에서 `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` 로 바뀌어 그림자가 조금 크고 진해져요. DropdownMenuSubContent · SheetContent 는 원래 `shadow-lg` 와 값이 같아 그대로예요.
- ontology 브랜드: 네 컴포넌트 모두 `0 8px 24px rgba(17,20,24,.10)`(어두운 테마 `0 8px 24px rgba(0,0,0,.50)`)를 써요. 이제 Select 목록 · Toast · Dialog 와 같은 고도로 보여요.

## 바뀌지 않은 점

- `className` 으로 `shadow-none` · `shadow-md` · `shadow-[…]` 를 넘기면 종전처럼 기본 그림자를 대체해요(패키지 `cn` 이 이 클래스를 그림자 그룹으로 병합, WI-0025 부터).
- Tailwind 3 `content` · Tailwind 4 `@import "@axis-ds/ui-react/tailwind.css"` 설정은 그대로예요. 새 클래스는 기존 스캔 경로에서 생성돼요.

## 동작이 달라지는 사용 방식

- 그림자 색 수식어(`shadow-black/50` 등)만 넘긴 경우 색이 더는 적용되지 않아요. 토큰 그림자는 색까지 값에 들어 있어서예요(Dialog · Select · Toast 와 같은 동작). 색을 바꾸려면 그림자 전체를 임의값으로 넘기거나 `--axis-shadow-lg` 를 덮어써요.

## 알려진 한계

- 포털로 렌더되는 Popover · DropdownMenu · Sheet 는 `body` 아래에 붙어요. `data-brand` 를 `<html>` 이 아닌 하위 요소에만 두면 브랜드 그림자가 적용되지 않아요(Dialog · Select 와 같은 종전 한계).
- DropdownMenuSubContent 의 브라우저 계산값은 재지 않았어요(문서 페이지에 예제가 없음, testplan 4.1절).
