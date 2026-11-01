---
"@axis-ds/ui-react": patch
---

PopoverContent · DropdownMenuContent · DropdownMenuSubContent · SheetContent 의 그림자를 Dialog · Select · Toast 와 같은 토큰 그림자 `shadow-[shadow:var(--axis-shadow-lg)]` 로 맞췄어요(WI-0108). 떠 있는 레이어의 고도를 브랜드 토큰이 정하게 하려는 것이고, 테두리와 다른 클래스는 그대로예요.

- 기본 브랜드(밝은 · 어두운 테마 같음): PopoverContent 와 DropdownMenuContent 는 Tailwind `shadow-md`(`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`)에서 `--axis-shadow-lg`(`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`)로 바뀌어 그림자가 조금 더 크고 진해져요. DropdownMenuSubContent 와 SheetContent 는 원래 `shadow-lg` 라 값이 같아요.
- ontology 브랜드: 네 컴포넌트 모두 그 브랜드의 `--axis-shadow-lg`(밝은 테마 `0 8px 24px rgba(17,20,24,.10)`, 어두운 테마 `0 8px 24px rgba(0,0,0,.50)`)를 써요. 종전에는 브랜드와 관계없이 Tailwind 기본 그림자였어요.
- `className` 으로 `shadow-none` · `shadow-md` 나 길이로 시작하는 그림자 임의값(`shadow-[0_10px_15px_-3px_rgb(0_0_0/0.5)]` 등)을 넘기면 종전처럼 기본 그림자를 대체해요(`cn` 이 이 클래스를 그림자 그룹으로 병합).
- 그림자 색 수식어(`shadow-black/50` 등)만 넘긴 경우는 이제 색이 적용되지 않아요. 토큰 그림자는 색까지 값에 들어 있어서예요(Dialog · Select · Toast 와 같은 동작). 색을 바꾸려면 `shadow-[0_10px_15px_-3px_rgb(0_0_0/0.5)]` 처럼 그림자 전체를 넘기거나 `--axis-shadow-lg` 를 덮어써요. CSS 변수만 담은 임의값(`shadow-[var(--x)]` · `shadow-[--x]`)도 그림자 색으로 해석돼 같은 동작이에요. 변수로 그림자 전체를 넘기려면 `shadow-[shadow:var(--x)]` 처럼 `shadow:` 타입 힌트를 붙여요.
