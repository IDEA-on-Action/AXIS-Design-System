# WI-0082 릴리스 노트: Select placeholder 색

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #211 | 대상: `@axis-ds/ui-react` patch(WI-0079 와 같은 발행, linked 4패키지 1.8.2 예정)

## 바뀐 점

`SelectTrigger` 에서 값을 고르기 전의 안내 글자(`SelectValue` 의 `placeholder`)가 Input placeholder 와 같은 `--axis-input-text-placeholder` 색으로 보여요. 종전에는 Trigger(button)에 붙은 `placeholder:` 클래스가 효과가 없어 안내 글자가 입력한 값과 같은 진한 색이었어요.

| 조합 | 이전 | 이후 | 입력 바탕 대비 |
|---|---|---|---|
| 기본 라이트 | #09090B | #6B7280 | 4.83 |
| 기본 다크 | #FAFAFA | #9CA3AF | 7.93 |
| ontology 라이트 | #111418 | #5F6673 | 5.78 |
| ontology 다크 | #F1F3F5 | #9CA3AD | 6.92 |

(Chromium 계산값, ontology 값은 WI-0079 반영 뒤)

- 값을 고른 뒤의 글자색은 그대로예요.
- placeholder 색은 안내 글자(span)에만 줘요. 화살표 아이콘은 종전처럼 본문 색 50% 라 Trigger 바탕 위 3:1 이상이에요(기본 3.74 · 5.16, ontology 3.46 · 4.82).
- **기본 브랜드에서도 보이는 변화**예요. 값 없는 Select 의 안내 글자가 회색이 돼요.

## 업그레이드

컴포넌트를 그대로 쓰면 할 일이 없어요. `axis add select` 로 소스를 복사해 쓰는 프로젝트는 다시 받거나 Trigger 클래스의 `placeholder:text-[var(--axis-input-text-placeholder)]` 를 `[&[data-placeholder]>span]:text-[var(--axis-input-text-placeholder)]` 로 바꾸세요(`data-[placeholder]:text-[...]` 처럼 Trigger 전체에 주면 화살표도 흐려져요). `className` 으로 Trigger 글자색을 직접 준 경우, 값이 없는 동안의 안내 글자는 이제 그 색이 아니라 placeholder 색이에요.
