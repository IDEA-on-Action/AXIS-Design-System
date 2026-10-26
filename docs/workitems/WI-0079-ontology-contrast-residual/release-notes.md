# WI-0079 릴리스 노트: ontology 남은 대비 미달

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 확인 문서: [design-review.md](./design-review.md) | GitHub: #208 | 대상: `@axis-ds/tokens` patch · `@axis-ds/mcp` patch(WI-0082 의 `@axis-ds/ui-react` · `@axis-ds/cli` patch 와 같은 발행, linked 4패키지 1.8.2 · cli 1.7.3 · mcp 1.4.3 예정)

## 바뀐 점

ontology 브랜드에 남아 있던 대비 미달을 고쳤어요. Progress warning 만 AXIS 원시색 노랑이고 나머지는 v1 팔레트 안의 값이에요. **기본 브랜드(브랜드 미지정) 값과 렌더는 바뀌지 않아요.** 디자인 오너 확인 문서의 권장안으로 먼저 반영했고, 오너가 다른 값을 고르면 다시 발행해요.

| 대상 | 변수 | 이전 (라이트 · 다크) | 이후 (라이트 · 다크) | 대비 이전 → 이후 (라이트 · 다크) |
|---|---|---|---|---|
| Checkbox · Radio · Textarea 경계 | `--axis-form-control-border` | `line` #E6E8EB · #2B2F35 | `sub` #6B7280 · `muted` #7A828D | 페이지 바탕 1.15 · 1.42 → 4.51 · 4.90, panel 최저 1.12 · 1.19 → 4.39 · 4.11 |
| Switch 꺼짐 · Slider 트랙 | `--axis-form-control-track` | `panel-2` #EAECEF · #2A2E34 | `sub` #6B7280 · `muted` #7A828D | 페이지 바탕 1.10 · 1.40 → 4.51 · 4.90, 흰 썸 대 트랙 1.18 · 13.65 → 4.83 · 3.89 |
| Progress success | `--axis-progress-fill-success` | green-500 #22C55E | `ink-2` #2A2F36 · #D0D4D9 | 트랙 위 1.93 · 5.99 → 11.39 · 9.16 |
| Progress warning | `--axis-progress-fill-warning` | yellow-500 #EAB308 | 원시색 yellow-700 #A16207 · yellow-500 #EAB308(다크는 그대로) | 트랙 위 1.62 · 7.12 → 4.16 · 7.12 |
| Progress destructive | `--axis-progress-fill-destructive` | red-500 #EF4444 | `bad-dark` #A8281F · #F49890 | 트랙 위 3.18 · 3.63 → 5.94 · 6.33 |
| Input placeholder | `--axis-input-text-placeholder` | `muted` #9AA1AB · #7A828D | `sub-aa` #5F6673 · `sub` #9CA3AD | 입력 바탕 위 2.61 · 4.53 → 5.78 · 6.92 |

수치는 정적 빌드 문서 사이트의 Chromium 계산값이에요(testplan 3절).

## 승인 철회 (WI-0025 부록 B ②)

- **Input placeholder 에 `muted` 를 쓰던 처리를 철회했어요.** WI-0025 부록 B 승인 범위 ② 「`muted` 는 글자에 쓰지 않고 placeholder · 보조 아이콘 · 입력 hover 테두리에만」(2026-10-16 대리 승인, 2026-10-19 디자인 오너 사후 확인) 가운데 placeholder 부분이에요.
- 이유: WCAG 2.2 Understanding 1.4.3 은 placeholder 를 글자 대비 대상으로 적고 있고, 라이트 `muted` 는 입력 바탕 위 2.61:1 이에요. axe 는 placeholder 를 판정하지 않아 CI a11y 게이트로는 드러나지 않았어요.
- 보조 아이콘 · 입력 hover 테두리의 `muted` 는 그대로예요. 철회 기록은 WI-0025 prd.md 부록 B 「철회 기록」에 있어요.

## 바꾸지 않은 것

- Input · Select 트리거 테두리 `--axis-input-border-default`(라이트 `line-2` #D6DADF, 부록 B ③ 예외)는 그대로예요. 그래서 라이트에서는 Checkbox · Textarea 경계(4.51)보다 Input 테두리(1.31)가 옅어 보여요.
- Progress default 채움(`key`)은 그대로예요. Progress warning 다크 값(yellow-500 #EAB308)도 그대로예요.

## 알아 둘 점

- Progress success · destructive 는 상태 색 접기와 같은 의미 매핑이에요: success = `status-success`(ink-2), destructive = `status-warning-strong`(bad-dark). warning 은 2026-10-26 결정으로 상태 색 접기(`status-warning` = bad)를 따르지 않고 AXIS 원시색 노랑(라이트 yellow-700 · 다크 yellow-500)을 써요. v1 에는 초록 · 노랑이 없어서(WI-0025 PRD Q8) 이 값 하나만 v1 팔레트 밖이에요. success 막대는 거의 검정이에요. **색만으로 상태를 구분하지 말고 상태 이름을 글자로 함께 보여 주세요**(Progress 는 값 글자를 스스로 그리지 않아요).
- warning 과 destructive 의 구분 정도(계산, testplan 4b): 상대휘도 대비는 라이트 1.43 · 다크 1.12 로 휘도만으로는 여전히 비슷하지만, 색상(HSV hue) 차이가 라이트 31.5도 · 다크 40.6도로 노랑과 빨강이 갈려요. 빨강 두 단계(bad 대 bad-dark)였을 때는 휘도 1.33 · 1.26 에 색상 차 2.0 · 1.0도였어요. 색각 이상 시뮬레이션(Viénot, CIE76 dE)으로 보면 다크는 적록(deutan 53.2 · protan 62.8)에서는 잘 갈리지만 청황(tritan 12.3)에서 약하고, 라이트는 적록(deutan 14.2)에서 가장 약해요. 그래서 글자 병기가 여전히 필요해요(참고: 기본 브랜드 라이트 #A16207 대 #DC2626 은 deutan 3.8).
- 꺼진 Switch 가 진한 회색 알약으로 보여요(종전 라이트는 바탕과 거의 같은 색이라 그림자 말고는 알아볼 단서가 없었어요).
- `axis add` 로 설치한 컴포넌트도 같은 변수를 읽으므로 ontology 를 켠 화면은 함께 바뀌어요. 레지스트리 · library 사본은 값만 바뀌는 변경이라 내용이 바뀌지 않아요.
- mcp 는 tokens 동반 규칙으로 올려요. 동봉 토큰 데이터는 기본 브랜드 값만 담아 바뀌지 않아요.

## 업그레이드

컴포넌트를 그대로 쓰면 할 일이 없어요. ontology 의 위 변수 값을 직접 참조하거나 덮어쓰던 앱은 새 값을 확인하세요. 종전 색을 유지하려면 앱 CSS 에서 `[data-brand="ontology"]` 블록 뒤에 같은 변수를 다시 정의하면 되지만, 그러면 위 대비 미달이 되돌아와요.
