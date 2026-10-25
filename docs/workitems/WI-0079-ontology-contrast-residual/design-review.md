# WI-0079 ontology 남은 대비 미달 · 디자인 오너 확인 요청 (초안)

> 작성 2026-10-25 · 기준 `@axis-ds/tokens` 1.8.0 발행본 · 레포 main f622364 · GitHub #208
> 이 문서는 값 후보와 근거를 모은 초안이에요. 고른 값은 아직 토큰에 넣지 않았어요.
> 검토판(2026-10-25, main 3b5ed0f 기준 재대조): 대비 수치는 독립 계산으로 전부 일치했고, 고친 곳은 §3 placeholder 승인 범위 · 인용 행 번호 · Switch 엄지 수치 · Select placeholder 영향 · 고칠 테스트 목록이에요. 바뀐 곳에는 「(검토 정정)」 · 「(검토 추가)」를 붙였어요.

## 1. 배경

- 배치 4(WI-0062 · WI-0063, 1.8.0)에서는 결정 D3 에 따라 기본 브랜드만 대비를 맞췄고, ontology 브랜드 값은 바꾸지 않았어요. 그래서 ontology 에는 아래 4가지 미달이 남아 있어요.
- 1.8.0 부터는 브랜드마다 값을 따로 줄 수 있는 변수가 생겼어요. `--axis-form-control-border` · `--axis-form-control-track` · `--axis-progress-fill-*` 이에요. ontology 에는 1.7.0 때 그려지던 색을 그대로 넣어 두었어요(`packages/axis-tokens/src/brands/ontology/{light,dark}.json`).
- 이 변수들만 바꾸면 구분선 · 카드 테두리(`--axis-border-default`)를 비롯한 다른 화면은 그대로예요. 그래서 이번 결정은 아래 4개 변수(+ placeholder 1개)로 범위가 좁혀져요.

## 2. 측정 방법과 신뢰도

- **실제 화면 재측정**: 배포된 문서 사이트(https://axis-design-system.pages.dev, 1.8.0 CSS 가 들어 있는 것을 확인)에 `data-brand="ontology"` 를 붙여서 재쟀어요. 문서 페이지의 실제 요소에서 경계 · 트랙 · 채움 색을 읽고, 가장 가까운 불투명 바탕과 비교했어요(`ctrl-180-live.txt`).
  - 측정이 제대로 돈다는 확인(양성 대조): 같은 실행에서 기본 브랜드는 4.83 · 4.12 로 다르게 나왔어요. ontology 값은 WI-0063 testplan 의 기록과 소수 둘째 자리까지 같아요.
- **후보 비교 화면**: `site/compare.html` 은 1.8.0 발행본 `variables.css` 와 `brands/ontology.css` 를 그대로 불러와요. 그 위에 칸마다 후보 값만 CSS 변수로 덮어썼고, 숫자는 그 화면에서 브라우저가 계산한 값을 그대로 잰 것이에요(`measure.json`).
  - 측정이 제대로 돈다는 확인(양성 대조): 비교 화면의 「현재」 칸이 배포 사이트 값을 그대로 다시 냈어요(1.146 · 1.105 · 1.925 · 1.62 · 2.605 · 다크 1.416 · 1.396).
- **비교 화면의 한계**: 컴포넌트는 ui-react 1.8.0 의 클래스를 같은 변수를 쓰는 일반 CSS 로 옮겨 그렸어요. React 컴포넌트를 직접 렌더한 것이 아니라서 모양(둥글기 · 그림자)이 조금 다를 수 있지만, 색과 변수 연결은 소스와 같아요.
- **바탕 3종**: 문서 사이트의 컨트롤은 페이지 바탕 `bg`(라이트 #F7F7F7 · 다크 #0E1013) 위에 그려져요. 제품 화면에서는 카드 `card`(#FFFFFF · #17191D)와 패널 `panel`(#F3F4F6 · #1F2227) 위에도 올라가요. 그래서 셋 다 계산했어요(`contrast.txt`).

## 3. WI-0025 부록 B ③ 예외의 범위

**정본 위치**
- 값의 정본은 디자인 시스템 「온톨로지 플랫폼」(claude.ai Design System 아티팩트)의 `tokens.json` 이에요(WI-0025 prd.md 7행 · A1).
- 레포에 있는 사본은 두 가지예요. 하나는 `docs/workitems/WI-0025-brand-theme/axis-theme-ontology.css`(초안 2)이고, 다른 하나는 테스트에 고정된 팔레트 `packages/axis-tokens/test/ontology-pairs.mjs` 의 `V1_PALETTE` 예요.
- 아티팩트 URL 은 레포 어디에도 적혀 있지 않아요. 이번 세션의 아티팩트 목록에도 나오지 않아서 정본 원문과 직접 대조하지는 못했어요(아래 질문 Q7).

**원문 인용** (`docs/workitems/WI-0025-brand-theme/prd.md` 부록 B, 203행)

> 승인 범위는 ① `sub` 보정 ② 미달 쌍 처리 ③ 라이트 입력 테두리 `line-2` 1.40:1은 원본을 유지하고 포커스 때 `key` 테두리로 구분 ④ …

미달 쌍 표(217행, (검토 정정) 초안의 214행은 잘못된 행 번호)의 해당 줄은 아래와 같아요.

> | `line-2`/`card` (입력 테두리) | 1.40:1 | 원본 유지, 포커스 때 `key`로 구분합니다(부록 A 끝 참고) |

근거는 부록 A 끝(197행)에 있어요. 「라이트의 입력 테두리 `line-2`는 `card` 위 1.40:1(v1 원본 값)… 원본 값을 유지할지는 디자인 오너가 부록 B와 함께 정합니다」라고 적혀 있고, 2026-10-17 구현 정정으로 판정 기준이 「키보드 포커스 링이 `key` 이고 바탕 대비 3:1 이상(라이트 4.66 · 다크 6.69)」으로 바뀌었어요. 승인은 2026-10-16 사용자 대리 승인 뒤 2026-10-19 디자인 오너 사후 확인으로 끝났어요(값 변경 없음).

**예외의 범위**: 라이트 테마만 · 값 `line-2` · Input 의 기본 테두리(`--axis-input-border-default`)만 해당해요.

**이번 대상이 예외에 들어가나요?** ③ 예외에는 넷 다 들어가지 않아요. 다만 (검토 정정) **placeholder 는 ③ 이 아니라 승인 범위 ② 「미달 쌍 처리」로 이미 승인된 쓰임**이에요. 같은 표 216행이 「`muted`/`card` (흐린 글) | 2.61:1 | 글자에 쓰지 않고 placeholder · 보조 아이콘 · 입력 hover 테두리에만 씁니다」라고 적고 있고, 이 줄도 2026-10-19 디자인 오너 사후 확인(값 변경 없음) 대상이었어요. 그래서 ④ 는 「새 예외를 만들지」가 아니라 「이미 승인된 처리를 철회할지」의 문제예요.

| 대상 | 예외 밖인 이유 |
|---|---|
| Checkbox · Radio · Textarea 경계 | 값이 `line-2` 가 아니라 `line`(#E6E8EB, 더 옅음)이에요. 컴포넌트도 Input 이 아니에요. 다크(1.42)는 예외가 아예 없는 테마예요 |
| Switch · Slider 트랙 | 테두리가 아니라 채움(`panel-2`)이에요 |
| Progress 채움 | 다른 종류의 표식이에요 |
| placeholder | ③(1.4.11 경계 예외)와는 관계가 없어요. (검토 정정) 대신 승인 범위 ②(216행, `muted` 는 placeholder 에만)로 이미 승인됐어요. 1.4.3 미달인 채로 승인된 것이에요 |

**참고할 점 세 가지**
- (검토 추가) 같은 부록 B 226행에는 ③ 밖의 비텍스트 미달을 디자인 오너가 명시적으로 받아들인 선례가 있어요. 대기 · 건너뜀 상태 점 `status.neutral-muted` 는 `line-2` 로 라이트 1.40 · 1.28, 다크 3.12 · 2.83 인데 「값 유지를 명시적으로 수락(2026-10-19)」했어요. ① A(③ 예외 확대)를 고를 때 비교할 수 있는 전례예요.
- 예외는 `card` 위 1.40 으로 적혀 있지만, 문서 사이트에서는 Input 이 `bg` 위에 그려져 실측이 1.31 이에요. 예외를 만들 때 생각한 바탕과 실제 바탕이 달라요.
- WCAG 2.2 Understanding 1.4.11 은 입력을 알아보게 하는 표식이 테두리일 때 그 테두리에 3:1 을 요구해요(Figure 32 「that indicator must meet 3:1」). (검토 보충) 입력 바탕이 주변과 3:1 이상 다르면 테두리는 요구되지 않지만(Figure 3), ontology 라이트는 입력 바탕 #FFFFFF 대 페이지 #F7F7F7 이 1.07 이라 테두리가 유일한 표식이에요. 회색 체크박스 테두리 2.7:1 은 실패 예시예요(Figure 42). 그래서 ③ 은 1.4.11 을 충족한다는 판정이 아니라, 디자인 정체성을 지키려고 **위험을 알고 받아들인 예외**로 읽는 것이 정확해요. 포커스 링은 포커스된 동안만 보이기 때문에, 포커스되지 않은 상태에서 컴포넌트를 알아보는 문제(1.4.11)는 풀지 못해요.

## 4. 대상별 현재 값과 미달 근거

배포 사이트 실측(1.8.0)과 비교 화면의 「현재」 칸 값이 같았어요.

| 대상 | 변수 | 현재 값 (라이트 · 다크) | 라이트 bg · card | 다크 bg · card | 기준 |
|---|---|---|---|---|---|
| Checkbox · Radio · Textarea 경계 | `--axis-form-control-border` | `line` #E6E8EB · #2B2F35 | 1.15 · 1.23 | 1.42 · 1.31 | 3:1 (1.4.11) |
| Switch 꺼짐 · Slider 트랙 | `--axis-form-control-track` | `panel-2` #EAECEF · #2A2E34 | 1.10 · 1.18 | 1.40 · 1.29 | 3:1 (1.4.11) |
| Progress success · warning 채움 (트랙 `panel-2` 위) | `--axis-progress-fill-success` · `-warning` | green-500 #22C55E · yellow-500 #EAB308 (두 테마 같음) | 1.93 · 1.62 | 5.99 · 7.12 (통과) | 3:1 (1.4.11) |
| Input placeholder (입력 바탕 위) | `--axis-input-text-placeholder` | `muted` #9AA1AB · #7A828D | 2.605 | 4.53 (통과) | 4.5:1 (1.4.3) |
| (참고) Input 경계 · 부록 B ③ 예외 | `--axis-input-border-default` | `line-2` #D6DADF · #5F6874 | 1.31 · 1.40 | 3.37 · 3.12 | 예외 |

**보충**
- **범위 표기가 문서마다 달라요.** 이슈 #208 의 라이트 「1.10~1.31」은 Input(예외, 1.31)까지 넣은 범위예요. WI-0063 release-notes 의 「1.15~1.31」은 경계만 센 범위예요. 정확히는 Checkbox · Radio · Textarea 1.15, Switch · Slider 1.10 이에요.
- **다크 Switch**: 트랙은 1.40 이지만 흰 엄지가 트랙 대비 13.65, 바탕 대비 19.05 라 꺼진 스위치가 보이기는 해요. 라이트에서는 흰 엄지가 트랙 대비 1.18, 바탕 #F7F7F7 대비 1.07(card 위에서는 1.00)이라 그림자 말고는 스위치를 알아볼 단서가 없어요. 라이트가 실제 문제예요. (검토 정정: 초안은 「다크 엄지가 트랙 · 바탕 모두 13.6」, 「라이트 엄지가 바탕 위 1.18」이라고 적었는데 1.18 은 엄지 대 트랙 값이에요)
- **Progress 의 색 출처**: v1 팔레트에는 초록 · 노랑이 없어요(PRD Q8). success · warning 채움은 AXIS 원시색(`{color.green.500}` 등) 참조라서 「hex 는 v1 팔레트 안에서만」 테스트를 피해 들어와 있어요. destructive(red-500)는 라이트 3.18 · 다크 3.63 으로 지금은 통과해요.
- **placeholder 가 서로 달라요**: Textarea 의 placeholder 는 `--axis-text-tertiary`(#5F6673, 5.78)를 써요. 같은 브랜드 안에서도 Input 만 흐려요(`packages/axis-ui-react/src/textarea/index.tsx:14` 와 `input/index.tsx:24`).
- **placeholder 의 근거**: WCAG 2.2 Understanding 1.4.3 원문에 「This success criterion applies to text in the page, including placeholder text」라고 적혀 있어요. 「placeholder 는 보조 힌트라서 대상이 아니다」라는 의견이 업계에 있지만 W3C 해설은 대상이라고 해요.
  - axe 의 color-contrast 규칙은 placeholder 를 판정하지 않아요. 직접 확인했어요: axe 4.12.1 에서 같은 색 #9AA1AB 로 쓴 일반 글자는 위반으로 잡혔고(양성 대조), placeholder 는 위반 0건 · 미판정 0건이었어요(`axe-placeholder.txt`).
  - 그래서 CI a11y 게이트가 초록이어도 이 미달은 잡히지 않아요.

## 5. 후보

**후보를 고른 원칙**
- v1 팔레트 안에서 고르는 안을 먼저 봤어요.
- 3:1 을 넘는 가장 작은 변경을 찾았어요.
- 옅은 회색 톤을 더 지키는 대안도 함께 넣었어요.

**라이트 팔레트에는 빈 구간이 있어요.** v1 회색은 `line-2`(card 위 1.40) 다음이 `muted`(2.61), 그다음이 `sub`(4.83)예요. **팔레트 안에는 라이트 3:1 을 넘는 옅은 회색이 없어요.** 정체성에 더 가까운 3:1 값을 쓰려면 팔레트에 새 값을 하나 넣어야 해요.

**두께나 바탕만으로는 해결되지 않아요.** 1.4.11 은 색 대비 비율만 봐요. 테두리를 두껍게 해도 비율 기준은 그대로예요. 바탕 대비로 충족하는 방식(Understanding Figure 3 · 34: 입력 바탕이 주변과 3:1)도 ontology 에서는 쓸 수 없어요. 라이트의 입력 바탕 #FFFFFF 와 페이지 바탕 #F7F7F7 의 대비가 1.07 이라 결국 진한 바탕을 써야 하기 때문이에요. 그래서 「정체성 대안」은 **새 팔레트 값(C)** 과 **테두리를 다른 요소에 맡기는 코드 변경(②-D)** 두 가지로 냈어요.

### ① 폼 컨트롤 경계 `--axis-form-control-border` (Checkbox · Radio · Textarea)

| 후보 | 값 (라이트 · 다크) | 라이트 bg · card · panel | 다크 bg · card · panel | 장점 | 단점 |
|---|---|---|---|---|---|
| 현재 | `line` #E6E8EB · #2B2F35 | 1.15 · 1.23 · 1.12 | 1.42 · 1.31 · 1.19 | - | 미달 |
| A | `line-2` #D6DADF · #5F6874 | 1.31 · 1.40 · 1.28 | 3.37 · 3.12 · **2.83** | Input 테두리와 같아져 한 화면의 컨트롤이 통일돼요. 다크는 bg · card 에서 통과해요 | 라이트는 여전히 미달이에요. 부록 B ③ 을 세 컴포넌트로 넓히는 새 승인이 필요해요. 다크 panel 위에서는 미달이에요 |
| **B (권장)** | `sub` #6B7280 · `muted` #7A828D | 4.51 · 4.83 · 4.39 | 4.90 · 4.53 · 4.11 | 팔레트 안의 값이고 세 바탕 모두 통과해요. 라이트 #6B7280 은 기본 브랜드의 `form-control-border` 와 같은 값이에요 | 라이트 경계가 눈에 띄게 진해져요. 다크는 이름이 다른 단계(`muted`)를 써서 라이트 · 다크가 같은 역할에 다른 이름을 갖게 돼요 |
| C | 새 값 #878E99 · #646C78 (팔레트 밖) | 3.08 · 3.30 · 3.00 | 3.59 · 3.32 · 3.01 | 3:1 을 넘으면서 가장 옅은 값이라 정체성을 가장 많이 지켜요 | v1 팔레트에 새 값(예: `line-3`)을 넣어야 해요. 「hex 는 v1 팔레트 안에서만」 테스트(`ontology-values.test.mjs`)와 `V1_PALETTE` 를 고쳐야 해요. 여유가 거의 없어요(panel 3.00) |

### ② Switch 꺼짐 · Slider 트랙 `--axis-form-control-track`

엄지/트랙 = Switch 의 흰 엄지(#FFFFFF, 하드코딩) 대 트랙의 대비예요.

| 후보 | 값 (라이트 · 다크) | 라이트 bg · card · panel | 다크 bg · card · panel | 엄지/트랙 L · D | 장점 | 단점 |
|---|---|---|---|---|---|---|
| 현재 | `panel-2` #EAECEF · #2A2E34 | 1.10 · 1.18 · 1.08 | 1.40 · 1.29 · 1.17 | 1.18 · 13.65 | - | 라이트에서는 꺼진 스위치가 거의 안 보여요 |
| A | `line-2` #D6DADF · #5F6874 | 1.31 · 1.40 · 1.28 | 3.37 · 3.12 · 2.83 | 1.40 · 5.65 | 변경이 가장 작아요 | 라이트 미달, 다크 panel 미달 |
| **B (권장)** | `sub` #6B7280 · `muted` #7A828D | 4.51 · 4.83 · 4.39 | 4.90 · 4.53 · 4.11 | 4.83 · 3.89 | 팔레트 안의 값이고, 세 바탕과 엄지 대비 모두 통과해요. ① B 와 값이 같아 「컨트롤 회색」 하나로 정리돼요 | 꺼진 스위치가 진한 회색 알약이 돼요. 켜짐(파랑)과의 무게 차이가 줄어요 |
| C | 새 값 #878E99 · #646C78 | 3.08 · 3.30 · 3.00 | 3.59 · 3.32 · 3.01 | 3.30 · 5.31 | 가장 옅은 통과값이고 ① C 와 같아요 | ① C 와 같은 단점(팔레트 추가 · 테스트 수정) |
| D | 트랙은 `panel-2` 그대로, Switch 에만 2px 테두리 `sub` · `muted` | 테두리 4.51 · 4.83 | 테두리 4.90 · 4.53 | 1.18 · 13.65 | 옅은 알약 모양을 지켜요 | ui-react 코드 변경이 필요해요(새 변수, Switch 에는 이미 `border-2 border-transparent` 가 있음). 기본 브랜드에 영향이 없도록 기본값을 transparent 로 둬야 해요. Slider 트랙은 해결되지 않아 같은 방식을 Slider 에도 넣거나 A~C 와 섞어야 해요 |

Slider 의 엄지(흰 바탕 + `interactive-primary` 2px 테두리)는 이미 bg 위 4.66 이에요. 1.4.11 에서 Slider 트랙을 「컴포넌트를 알아보는 데 필요한 정보」로 볼지는 해석이 갈려요. 이번 표는 이슈 범위대로 트랙을 대상에 넣었어요.

### ③ Progress success · warning 채움 `--axis-progress-fill-success` · `-warning`

대비는 트랙 `panel-2`(#EAECEF · #2A2E34) 위의 값이에요.

| 후보 | success (L · D) | warning (L · D) | 대비 success L · D | 대비 warning L · D | 장점 | 단점 |
|---|---|---|---|---|---|---|
| 현재 | green-500 #22C55E | yellow-500 #EAB308 | 1.93 · 5.99 | 1.62 · 7.12 | - | 라이트 미달. v1 에 없는 초록 · 노랑이에요 |
| **A (권장)** | `ink-2` #2A2F36 · #D0D4D9 | `bad` #C8332E · #F07A72 | 11.39 · 9.16 | 4.47 · 5.02 | 팔레트 안의 값이에요. 상태 색 접기(부록 B ⑥ · `status-success` = ink-2, `status-warning` = bad)와 같은 의미 매핑이라 Badge · Alert 와 맞아요 | success 막대가 거의 검정으로 무거워요. warning(bad)과 destructive(red-500 #EF4444)가 둘 다 빨강이라 색만으로는 잘 구분되지 않아요(Q3) |
| B | 라이트 green-700 #15803D · 다크 유지 | 라이트 yellow-700 #A16207 · 다크 유지 | 4.24 · 5.99 | 4.16 · 7.12 | 최소 변경이에요. 기본 브랜드 라이트와 같은 값이고 초록 · 노랑 의미를 지켜요 | v1 팔레트 밖 색(초록 · 노랑, Q8 의 전제)이 그대로 남고 상태 색 접기(부록 B ⑥)와 어긋나요 |
| C | `sub-aa` #5F6673 · #9CA3AD | `bad` #C8332E · #F07A72 (+ destructive `bad-dark` #A8281F · #F49890) | 4.88 · 5.37 | 4.47 · 5.02 (destructive 5.94 · 6.33) | 팔레트 안의 값이고 A 보다 가벼운 회색이에요. warning · destructive 를 빨강 두 단계로 나눠요 | 이슈 범위 밖인 destructive 까지 바꿔요(지금은 3.18 로 통과). 회색 success 가 「진행 중 · 비활성」처럼 읽힐 수 있어요 |

v1 에는 초록 · 노랑이 없어서 팔레트 안에서는 success 와 warning 을 색만으로 구분할 수 없어요. 이건 PRD Q8 에서 이미 받아들인 제약이에요. Progress 는 값 글자를 스스로 그리지 않으니, 상태 이름을 글자로 함께 보여 주는 것은 쓰는 쪽의 몫이에요.

### ④ Input placeholder `--axis-input-text-placeholder`

| 후보 | 값 (라이트 · 다크) | 라이트 (입력 바탕 #FFFFFF) | 다크 (#17191D) | 장점 | 단점 |
|---|---|---|---|---|---|
| 현재 = C (승인된 처리 유지) | `muted` #9AA1AB · #7A828D | 2.605 | 4.53 | 부록 B 승인 범위 ②(216행)로 이미 승인된 값이라 새 승인이 필요 없어요. 입력한 값(ink)과 가장 잘 구분돼요 | W3C 해설상 1.4.3 위반이 그대로 남아요. axe 가 못 잡아 게이트로도 드러나지 않아요. Textarea 와 서로 달라요 |
| **A (권장)** | `sub-aa` #5F6673 · `sub` #9CA3AD | 5.78 | 6.92 | Textarea placeholder(`text-tertiary`)와 같은 값이 되어 한 브랜드 안의 차이가 없어져요. 비활성 바탕(#F3F4F6)에서도 5.25 예요 | 입력한 값 #111418 과의 차이가 줄어요(그래도 명도 차이가 커서 구분돼요) |
| B | `sub` #6B7280 · 다크 유지 #7A828D | 4.83 | 4.53 | v1 원본 값이고 기본 브랜드 placeholder(gray-500)와 같아요. 다크는 바꾸지 않아요 | 여유가 적어요(비활성 바탕 4.39, 비활성은 1.4.3 대상 밖). Textarea 와는 여전히 달라요 |

## 6. 영향 범위 (grep 집계, 레포 main f622364)

- **컴포넌트 소비처**: `packages/*/src` · `apps/web/src`, 생성 JSON 제외. 양성 대조로 `<Button` 은 apps/web 에서 30개 파일이 잡혔어요.
  - `--axis-form-control-border`: Checkbox · RadioGroup · Textarea 3곳뿐
  - `--axis-form-control-track`: Switch · Slider 2곳
  - `--axis-progress-fill-*`: Progress 1곳
  - `--axis-input-text-placeholder`: 소스에 적힌 곳은 Input · Select(`select/index.tsx:24`) 2곳이지만, (검토 정정) **실제로 색이 바뀌는 곳은 Input 하나예요.** Select 의 `placeholder:` 클래스는 Radix `SelectPrimitive.Trigger`(button)에 붙어 있고, `::placeholder` 는 input · textarea 에만 적용돼요. Select 의 placeholder 글자는 `SelectValue` 의 span 이라 이 변수를 받지 않아요. 브라우저로 확인했어요: 같은 규칙에서 input 의 `::placeholder` 는 #9AA1AB 로 나왔고(양성 대조), button · span 은 상속 글자색 그대로였어요(`rv/ph.mjs`). 그래서 ④ 를 바꿔도 Select 는 바뀌지 않아요(Select placeholder 가 흐리게 보이지 않는 것은 별도 결함 후보)
  - (검토 추가) `axis add` 레지스트리 사본 `apps/web/public/r/input.json` · `r/select.json` 도 같은 변수를 써요. 값만 바꾸는 후보라 이 파일을 고칠 필요는 없지만, `axis add input` 으로 설치한 소비자 화면도 ontology 를 켜면 함께 바뀌어요
  - agentic-ui 소스에서 이 변수를 쓰는 곳은 0건이에요.
- **문서 사이트 화면**:
  - Checkbox · Radio · Textarea · Switch · Slider · Progress · Select 는 각자의 컴포넌트 페이지 1곳에서만 그려져요.
  - Input 은 10개 파일(card · dialog · input · label · popover 페이지, brand-demo, component-preview, 랜딩 쇼케이스, 예제 레지스트리 2)에서 그려져요. ④ 의 영향이 가장 넓어요.
- **템플릿**(`apps/web/templates/**`): 대상 컴포넌트 0건이에요. 양성 대조로 같은 경로에서 `<div` 는 잡혔어요.
- **ontology 를 켠 화면만 바뀌어요.** 모든 후보가 `brands/ontology/{light,dark}.json` 의 해당 줄만 바꿔요. 기본 브랜드 렌더는 바뀌지 않아요(②-D 만 예외로 ui-react 코드가 바뀌어요).
- **고쳐야 하는 테스트 · 문서**:
  - `packages/axis-tokens/test/brands.test.mjs` 의 `WI0063_SAME`: 새 변수의 ontology 값이 1.7.0 렌더 값과 같다는 표예요. 모든 후보에서 고쳐야 해요.
  - `ontology-values.test.mjs` 의 팔레트 폐쇄성 테스트와 `ontology-pairs.mjs` 의 `V1_PALETTE`: C 후보만 해당돼요.
  - `apps/web/e2e/brand-nontext-contrast.spec.ts` 의 대상 표
  - (검토 추가) `packages/axis-tokens/test/default-contrast.test.mjs` 141~158행 `DEFAULT_ONLY`: placeholder · form-control-border · track · 엄지 · progress-fill 짝을 「ontology 가 실패하니 기본 브랜드만 검사」로 빼 둔 표예요. 값을 고치면 이 짝들을 `ontology-pairs.mjs` 의 `CONTRAST_PAIRS`(두 브랜드 공용)로 옮겨야 ontology 회귀 가드가 생겨요. 이 표의 바탕은 `--axis-surface-default`(card)뿐이라, C 후보처럼 bg 3.08 · panel 3.00 으로 여유가 적은 값은 card(3.30)만 보면 가려져요. bg · panel 짝도 함께 넣는 것을 권해요
  - (검토 추가) ②-D 를 고르면 `packages/axis-ui-react/src/nontext-contrast.test.tsx`(컴포넌트 클래스 단언)도 고쳐야 해요
  - `docs/guides/theme-customization.md` 「ontology 프리셋」 절
  - WI-0025 부록 B(예외 범위가 바뀌면)

## 7. 권장안 (한 묶음)

- **① 경계와 ② 트랙은 B 로 같은 값을 써요**: 라이트 `sub` #6B7280 · 다크 `muted` #7A828D.
  - v1 팔레트 안의 값이고, bg · card · panel 세 바탕 모두와 Switch 엄지까지 3:1 을 넘어요(최저 3.89).
  - 라이트 값이 기본 브랜드의 컨트롤 경계 #6B7280 과 같아서, 두 브랜드가 「컨트롤 경계는 gray-500 단계」라는 같은 규칙을 갖게 돼요.
  - 정체성이 더 중요하면 C(새 팔레트 값 #878E99 · #646C78)가 대안이에요. 이 경우 v1 팔레트 개정이 먼저예요.
- **③ Progress 는 A** 예요: success `ink-2`, warning `bad`. 이미 승인된 상태 색 접기와 같은 의미 매핑이라 새 규칙을 만들지 않아요. warning 과 destructive 의 구분은 Q3 의 답에 따라 정해요.
- **④ placeholder 는 A** 예요: `sub-aa` · 다크 `sub`. Textarea 와 같은 값으로 통일되고 W3C 해설 기준을 충족해요.
- **부록 B ③(Input 테두리) 은 이번 결정 대상이 아니에요.** 다만 ① 을 B 로 정하면 Checkbox · Textarea(4.51)와 Input(1.31)의 경계 진하기가 한 화면 안에서 크게 달라 보여요. 그래서 Input 도 같은 값으로 맞출지 함께 묻는 것이 좋아요(Q5).

## 8. 디자인 오너께 드릴 질문

1. **Q1** ① 폼 컨트롤 경계: A(`line-2`, 라이트 미달 · ③ 예외를 넓힘) · B(`sub`/`muted`, 팔레트 안 · 통과, 권장) · C(새 팔레트 값, 가장 옅은 통과값) 가운데 어느 것으로 할까요?
2. **Q2** ② Switch · Slider 트랙: ① 과 같은 값으로 묶을까요(B 또는 C)? 아니면 트랙은 옅게 두고 Switch 에 테두리를 더하는 D(코드 변경)를 원하시나요?
3. **Q3** ③ Progress: A(ink-2 / bad, 권장) · B(초록 · 노랑을 한 단계 진하게) · C(회색 / bad + destructive bad-dark) 가운데 어느 것으로 할까요? A 를 고르면 warning 과 destructive 가 둘 다 빨강인데, destructive 를 `bad-dark` 로 나눠도 될까요?
4. **Q4** ④ placeholder: 부록 B ②(216행)에서 승인한 「`muted` 는 placeholder 에만」 처리를 철회하고 A(`sub-aa`, Textarea 와 통일, 권장) · B(`sub`) 로 바꿀까요, 아니면 C(승인된 현재 값 유지, 1.4.3 미달을 계속 받아들임)로 둘까요?
5. **Q5** ① 을 B · C 로 고르면 Input 테두리(부록 B ③, `line-2` 1.31)와 진하기가 달라져요. Input 도 같은 값으로 맞출까요(③ 예외 철회), 아니면 ③ 을 유지할까요?
6. **Q6** C(새 팔레트 값)를 고르면 디자인 시스템 v1 팔레트에 회색 단계 하나를 더하는 개정이 필요해요. 정본(`tokens.json`)을 직접 고쳐 주실 수 있나요?
7. **Q7** 정본 아티팩트의 링크를 알려 주실 수 있나요? 레포에 URL 이 없어 이번 자료는 레포 사본(초안 2 CSS · `V1_PALETTE`)으로 만들었어요.

## 9. 스크린샷과 자료

비교 화면: 칸마다 위는 페이지 바탕, 아래는 카드 바탕이고, 칸 아래 숫자는 브라우저가 계산한 대비예요.

| 대상 | 라이트 | 다크 |
|---|---|---|
| 전체 | `shots/full-light.png` | `shots/full-dark.png` |
| ① 경계 | `shots/t1-light.png` | `shots/t1-dark.png` |
| ② 트랙 | `shots/t2-light.png` | `shots/t2-dark.png` |
| ③ Progress | `shots/t3-light.png` | `shots/t3-dark.png` |
| ④ placeholder | `shots/t4-light.png` | `shots/t4-dark.png` |

스크린샷은 이 문서 옆 `shots/` 에 있어요. 아래 측정 원자료는 작성 세션의 임시 디렉터리에 있었고 레포에는 옮기지 않았어요(값은 이 문서 표에 모두 옮겨 적었어요).

| 자료 | 파일 |
|---|---|
| 비교 화면 원본 | `site/compare.html` (1.8.0 발행본 CSS 복사본 `site/variables.css` · `site/ontology.css`) |
| 측정값 | `measure.json` · `measure.txt` (비교 화면) · `ctrl-180-live.txt` (배포 사이트) · `contrast.txt` (계산) · `axe-placeholder.txt` |
| 스크립트 | `scripts/shots.mjs` · `scripts/contrast.py` · `scripts/axe-ph.mjs` · `ctrl-probe.mjs` |
| 참고 원문 | `ref/contrast-minimum.html` · `ref/non-text-contrast.html` (W3C WCAG 2.2 Understanding, 2026-10-25 내려받음) |
