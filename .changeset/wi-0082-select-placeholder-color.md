---
'@axis-ds/ui-react': patch
---

`SelectTrigger` 의 placeholder 글자가 `--axis-input-text-placeholder` 색으로 보여요(WI-0082). 종전에는 `placeholder:` 클래스가 Trigger(button)에 붙어 있었는데, `::placeholder` 는 input · textarea 에만 적용돼서 placeholder 글자(`SelectValue`)가 입력한 값과 같은 진한 색으로 보였어요.

- 값이 없을 때 Radix 가 Trigger 에 붙이는 `data-placeholder` 상태에 글자색을 줘요(`data-[placeholder]:text-[var(--axis-input-text-placeholder)]`). 화살표 아이콘(`currentColor` · 50%)도 같은 색을 따라가요
- 기본 브랜드 라이트 #6B7280 · 다크 #9CA3AF, ontology 라이트 #5F6673 · 다크 #9CA3AD 로 입력 바탕 위 4.5:1 이상이에요(Chromium 실측 4.83 · 7.93 · 5.78 · 6.92)
- 값을 고른 뒤의 글자색은 그대로예요. `axis add select` 레지스트리 사본과 library 사본도 같은 소스로 바뀌어요
