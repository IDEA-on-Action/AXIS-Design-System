# WI-0026 릴리스 노트: 밀도 토큰

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #85 | 대상: `@axis-ds/tokens` · `@axis-ds/ui-react` minor(linked 4패키지 1.7.0, 배치 3)

## 바뀐 점

컨트롤 높이 · 글자 크기 · 단계별 둥글기를 CSS 변수(밀도 토큰)로 바꿀 수 있어요. 브랜드 프리셋이 콘솔처럼 촘촘한 밀도를 표현할 수 있어요.

| 변수 | 기본값 | ontology | 쓰는 컴포넌트 |
|---|---|---|---|
| `--axis-control-h-sm` · `-md` · `-lg` | 32 · 40 · 48px | 27 · 34 · 42px | Button(`icon` 은 md 정사각) |
| `--axis-control-font-size-sm` · `-md` · `-lg` | 12 · 14 · 16px | 13 · 14 · 15px | Button, Input(md) |
| `--axis-field-h` | 40px | 36px | Input · Select 트리거 |
| `--axis-toggle-h-sm` · `-md` · `-lg` | 36 · 40 · 44px | 같음 | Toggle |
| `--axis-table-font-size` · `--axis-table-head-font-size` | 14 · 14px | 13.5 · 13px | Table · TableHead |
| `--axis-radius-control` · `-field` · `-surface` | 6 · 6 · 8px(`--radius` 계산식) | 8 · 6 · 12px | Button · Toggle / Input · Select 트리거 / Card · Dialog |

- 브랜드를 지정하지 않은 화면은 바뀌지 않아요(1.6.3 배포본과 Chromium 계산값 186개 대조, 줄 높이 · 표 셀 높이 포함, 차이 0). 글자 크기를 변수로 바꾸면서 빠지는 줄 높이는 크기별 `leading-4` · `leading-5` · `leading-6` 으로 1.6.x 와 같게 둬요.
- `ontology` 를 쓰는 화면은 디자인 시스템 v1 밀도로 바뀌어요. Button 높이 40 → 34px · 둥글기 10 → 8px, Input · Select 트리거 높이 40 → 36px · 둥글기 10 → 6px, Toggle 둥글기 10 → 8px, Table 본문 14 → 13.5px · 머리 14 → 13px, 큰 버튼 48 → 42px · 16 → 15px, 작은 버튼 32 → 27px · 12 → 13px. Card · Dialog 12px, Toggle 높이, Sheet 0px, Select 팝업 · Popover 등 나머지 컴포넌트(10px)는 그대로예요.

## 업그레이드

- 코드나 Tailwind 설정을 바꿀 필요가 없어요. 컴포넌트가 `h-[var(--axis-control-h-md,2.5rem)]` 처럼 리터럴 fallback 을 함께 쓰므로 토큰 CSS 가 1.6.x 이하여도 크기가 유지돼요.
- 주의: `@axis-ds/tokens/css/shadcn` 없이 `@axis-ds/tokens/css` 만 쓰는 구성에서는 위 7개 컴포넌트의 둥글기가 0px 에서 6px(Card · Dialog 8px)로 바뀌어요. 둥글기 기본값이 shadcn `--radius` 에서 계산되기 때문에, `--radius` 가 없으면 fallback 이 쓰여요.
- 하위 요소에서 `--radius` 만 바꿔 둥글기를 조절하던 경우, 위 7개 컴포넌트는 따라가지 않아요. 그 요소에서 `--axis-radius-control|field|surface` 도 함께 바꿔요.
- 복사 설치(`axis add`)로 받은 button · input · select · card · dialog 는 다시 받으면 같은 동작이 돼요(레지스트리 항목 5개 갱신).

## 검증 요약

- 브랜드 미지정 계산값: 1.6.3 대비 차이 0(1280px · 375px). ontology 기대값 33항목 일치. Tailwind 4.1 과 3.4 결과가 같음(308값, padding 미포함. TableHead 세로 padding 의 Tailwind 3 · 4 차이는 1.6.3 부터 있던 것).
- 정적 검사: 대상 4개 소스에 고정 높이 클래스 0, fallback 15종이 tokens 기본값과 같은 길이.
- 상세는 [testplan.md](./testplan.md).
