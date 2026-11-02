# WI-0110: Tooltip 토큰 그림자 릴리스 노트

> 미발행(2026-11-02 작성) | 대상: `@axis-ds/ui-react` patch · `@axis-ds/agentic-ui` patch(내부 의존) → 1.8.6 | GitHub: #283
> `@axis-ds/tokens` · `@axis-ds/theme` · cli · mcp 는 바뀌지 않아요. 레지스트리(`r/`)에는 tooltip 이 없어요

## 바뀐 점

- TooltipContent 에 Dialog · SelectContent · Toast · PopoverContent · DropdownMenuContent · SheetContent 와 같은 토큰 그림자 `shadow-[shadow:var(--axis-shadow-lg)]` 를 넣었어요. 종전에는 그림자가 없었어요.
- 기본 브랜드(밝은 · 어두운 같음): `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` 그림자가 생겨요.
- ontology 브랜드: 밝은 테마 `0 8px 24px rgba(17,20,24,.10)`, 어두운 테마 `0 8px 24px rgba(0,0,0,.50)` 를 써요.

## 바뀌지 않은 점

- 배경 · 글자색, 테두리 없음, 화살표 없음, 열림 제어(WI-0073 래퍼)는 그대로예요.
- Tailwind 3 `content` · Tailwind 4 `@import "@axis-ds/ui-react/tailwind.css"` 설정은 그대로예요. 같은 클래스가 다른 떠 있는 레이어에 이미 있어 기존 스캔 경로에서 생성돼요.

## 동작이 달라지는 사용 방식

- 종전처럼 그림자 없이 쓰려면 `className="shadow-none"` 을 넘겨요. 패키지 `cn` 이 이 클래스를 그림자 그룹으로 병합해 토큰 그림자를 대체해요.
- 그림자 색 수식어(`shadow-black/50` 등)만 넘기면 종전에는 그림자가 없었지만 이제는 토큰 그림자가 보이고 넘긴 색은 적용되지 않아요. 색을 바꾸려면 `shadow-[shadow:0_10px_15px_-3px_rgb(0_0_0/0.5)]` 처럼 그림자 전체를 넘기거나 `--axis-shadow-lg` 를 덮어써요(트러블슈팅 가이드 5절). CSS 변수만 담은 임의값(`shadow-[var(--x)]` · `shadow-[--x]`)도 그림자 색으로 해석돼 같은 동작이에요.

## 알려진 한계

- 기본 브랜드 어두운 테마에서는 lg 그림자가 거의 보이지 않아요. 밝은 툴팁 배경(#F3F4F6) 아래 그림자 영역과 주변의 색 차이가 최대 7/765 였어요(조사 측정, prd 3절). 다른 떠 있는 레이어 6종도 같은 상태이고 어두운 테마 토큰 값 조정은 후속 후보로 남겨요(사용자 결정 D4).
- 소비자가 Radix `TooltipPrimitive.Arrow` 를 직접 넣으면 화살표 윤곽에는 그림자가 생기지 않아요(조사 측정, prd 6절). 이 패키지는 TooltipArrow 를 내보내지 않아요.
- 포털로 렌더되므로 `data-brand` 를 `<html>` 이 아닌 하위 요소에만 두면 브랜드 그림자가 적용되지 않아요(Dialog · Select 와 같은 종전 한계).
