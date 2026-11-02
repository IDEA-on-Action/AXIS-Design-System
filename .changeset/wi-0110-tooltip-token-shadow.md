---
"@axis-ds/ui-react": patch
---

TooltipContent 에 다른 떠 있는 레이어(Dialog · SelectContent · Toast · PopoverContent · DropdownMenuContent · SheetContent)와 같은 토큰 그림자 `shadow-[shadow:var(--axis-shadow-lg)]` 를 넣었어요(WI-0110). 종전에는 그림자가 없었고, 배경 · 글자색 · 테두리 없음 · 화살표 없음과 열림 동작은 그대로예요.

- 기본 브랜드: `--axis-shadow-lg`(`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`) 그림자가 생겨요. 밝은 테마와 어두운 테마의 값이 같아요.
- ontology 브랜드: 그 브랜드의 `--axis-shadow-lg`(밝은 테마 `0 8px 24px rgba(17,20,24,.10)`, 어두운 테마 `0 8px 24px rgba(0,0,0,.50)`)를 써요.
- 종전처럼 그림자 없이 쓰려면 `className="shadow-none"` 을 넘겨요(`cn` 이 이 클래스를 그림자 그룹으로 병합해 토큰 그림자를 대체해요).
- 그림자 색 수식어(`shadow-black/50` 등)만 넘기면 색은 적용되지 않고 토큰 그림자가 그대로 보여요. 종전에는 이 클래스만으로는 그림자가 생기지 않았어요. 색을 바꾸려면 `shadow-[shadow:0_10px_15px_-3px_rgb(0_0_0/0.5)]` 처럼 그림자 전체를 넘기거나 `--axis-shadow-lg` 를 덮어써요(트러블슈팅 가이드 5절 방법 2 · 3). CSS 변수만 담은 임의값(`shadow-[var(--x)]` · `shadow-[--x]`)도 그림자 색으로 해석돼 같은 동작이에요.
