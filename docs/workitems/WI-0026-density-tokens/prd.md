# WI-0026: 밀도 토큰 PRD

> 작성일: 2026-10-15 | 작성자: Sinclair Seo | WI: WI-0026 | GitHub: #85 | 상태: Approved (2026-10-25 사용자 결정, 배치 3 묶음 ②) | 버전: v1.0(2026-10-25)
> 기준: `main` 778e1dd(tokens · theme 1.6.2, ui-react · agentic-ui 1.6.3 배포됨) | 선행: WI-0025(브랜드 테마 축, 1.3.0 에서 `brands/ontology` 생성 완료)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)
> v1.0 변경: 배치 3 브리프 권장안과 반박 검토 지적을 반영했어요. v0.4 의 낡은 전제를 아래 1.4 에서 정정했어요.

---

## 1. 개요

### 1.1 배경
- AXIS 컴포넌트의 크기는 Tailwind 클래스에 고정되어 있었어요. 버튼 높이 `h-8|10|12`(32 · 40 · 48px), 입력 · Select 트리거 `h-10`(40px), 토글 `h-9|10|11`(36 · 40 · 44px), 표 글자 `text-sm`(14px)은 테마로 바꿀 수 없었어요.
- 둥글기는 shadcn `--radius` 하나에서 계산돼(`md = --radius - 2px`) 단계 간격이 다른 브랜드를 표현하지 못해요. ontology 는 `--radius: 12px` 근사라 Button · Input 이 10px 였어요(1.6.3 측정).
- 온톨로지 콘솔(디자인 시스템 v1, 프로토타입 v0.24 · v0.26)은 버튼 34px(작은 버튼 27px · 큰 버튼 42px) · 입력 36px · 표 본문 13.5px / 머리 13px · 둥글기 카드 12px / 버튼 8px / 입력 6px 의 촘촘한 밀도를 써요(브리프의 Chromium 계산값 측정, 두 판 같음).

### 1.2 목표
- 컨트롤 높이 · 글자 크기 · 단계별 둥글기를 CSS 변수로 열어 브랜드 프리셋이 밀도를 바꿀 수 있게 해요.
- 기본값은 1.6.3 의 클래스 값과 같게 두어, 브랜드를 지정하지 않은 화면을 바꾸지 않아요.

### 1.3 범위
- 포함: 밀도 토큰 15개 정의(tokens), ui-react 대상 7개 컴포넌트(Button · Input · Select 트리거 · Toggle · Table · Card · Dialog)의 클래스를 토큰 직접 참조로 교체, `ontology` 프리셋에 밀도 값 추가, 문서 가이드 · E2E 기대값 갱신
- 제외: 여백(padding · gap) 토큰화, agentic-ui 크기 조정, 「compact · comfortable」 전환 기능, Tailwind preset `borderRadius` 매핑 변경(Q3), Sheet(Q3-sheet), cli · mcp `KEY_TOKENS`(key-tokens)

### 1.4 v0.4 전제 정정

| v0.4 서술 | 정정 |
|---|---|
| FR-3 preset `rounded-md|lg` 전역 재매핑 + 복제본 9곳 수정 | Q3 (나): preset 은 그대로 두고 대상 컴포넌트만 토큰을 직접 참조해요. 복제본(사이트 · 템플릿 4종 · tailwind4) 수정이 없어요 |
| 대상 8개(Sheet 포함), Sheet 는 `var(--axis-radius-surface, 0)` | Sheet 는 대상에서 빼요. ontology 에서 12px 가 되면 디자인 시스템 v1 드로어(0px)와 어긋나요 |
| 글자 토큰 이름 `--axis-font-size-control-*` · `--axis-font-size-table` | 경로 `font.size.*` 는 brands.mjs V4 가 브랜드 덮어쓰기를 막아요. component 최상위 이름 `--axis-control-font-size-*` · `--axis-table-font-size` 로 바꿨어요 |
| FR-4 에 큰 버튼 값 없음 | ontology lg 42px · 15px 를 더해요(프로토타입 `.o-btn.lg`) |
| AC1 기준 「이전 버전」 | 기준은 npm 배포본 ui-react 1.6.3 + tokens 1.6.2 예요. 대상 7개(와 Sheet)의 dist 는 1.6.2 와 1.6.3 이 같아요(아래 3, 측정) |
| 「WI-0025 M3 이후 착수, brands 디렉터리 없음」 | M3 는 1.3.0 에서 배포됐고 `src/brands/ontology` 가 있어요 |

---

## 2. 결정 (2026-10-25 사용자, 브리프 권장안 일괄 채택)

| # | 결정 | 근거 |
|---|---|---|
| Q3 | (나) 대상 7개만 토큰을 직접 참조(`rounded-[var(--axis-radius-*,<fallback>)]`). preset `rounded-*` 와 나머지 ui-react 15개 · agentic-ui 13개 파일은 지금처럼 `--radius` 를 따라요 | 복제본 수정 0, WI-0067 과 충돌 없음. 대신 ontology 의 Select 팝업 · Popover 는 10px 로 남아요 |
| Q3-sheet | Sheet 는 대상에서 빼요(0px 유지) | 프로토타입 `.o-drawer` 0px(측정) |
| naming | 높이 · 글자는 component 최상위(`control` · `field` · `toggle` · `table`), 둥글기는 primitives `radius.control|field|surface` | brands.mjs 를 바꾸지 않고 V3 · V4 · V7 을 통과해요 |
| radius-scale | 둥글기는 기존 `radius.sm|md|lg` 와 따로 두고 기본값은 `--radius` 계산식(control · field `calc(var(--radius) - 2px)`, surface `var(--radius)`) | 기본 계산값 6 · 6 · 8px 가 1.6.3 과 같아요. 기존 스케일 sm 2px 에 묶으면 AC1 이 깨져요 |
| fallback | 모든 참조에 리터럴 fallback(예 `h-[var(--axis-control-h-md,2.5rem)]`) | 토큰 CSS 가 1.6.x 이하이거나 `--radius` 가 없어도 크기가 무너지지 않아요 |
| Q1 | 아이콘 버튼은 `--axis-control-h-md` 로 높이 · 너비를 함께 | 프로토타입 `.o-iconbtn` 34x34 |
| lg | ontology lg 42px · 15px | 프로토타입 `.o-btn.lg` |
| select-h | Select 트리거는 `--axis-field-h`(ontology 36px) | 입력과 같은 높이. 프로토타입 select 38px 는 UA 상자 차이로 봐요(추정) |
| line-height | `text-sm` 같은 크기 클래스를 `text-[length:var(...)]` 로 바꾸면 줄 높이가 빠지므로 크기별 `leading-4` · `leading-5` · `leading-6` 을 명시해요(Button sm · default · lg, Input, Table). 줄 높이 토큰은 만들지 않아요 | 1.6.3 의 줄 높이 16 · 20 · 24px 를 그대로 유지(review 지적, 측정). 토큰은 범위 밖이라 ontology 도 같은 줄 높이예요 |
| Q4 | ontology 는 Toggle 높이를 덮어쓰지 않아요(기본값 36 · 40 · 44px 를 같은 값으로 명시, D4 결정 36 의 완전성 규칙) | 프로토타입에 대응 요소 없음 |
| Q5 | field 둥글기는 control 과 따로(입력 6px · 버튼 8px) | 프로토타입 `.o-input` 6px · `.o-btn` 8px |
| Q6 | 표 머리 전용 토큰 `--axis-table-head-font-size`(기본 14px, ontology 13px) | 프로토타입 th 13px · td 13.5px |
| key-tokens | cli · mcp `KEY_TOKENS` 에 넣지 않아요 | 배치 3 범위를 cli · mcp 로 넓히지 않아요 |
| 릴리스 | `@axis-ds/tokens` minor · `@axis-ds/ui-react` minor. linked 그룹이라 묶음 ① 의 theme minor 와 함께 1.7.0 | 사용자 결정(배치 3) |

---

## 3. 요구사항

### 3.1 기능 요구사항

- FR-1 높이: `--axis-control-h-sm|md|lg`(기본 2 · 2.5 · 3rem)를 Button `sm · default · lg` 에, `icon` 은 md 를 높이 · 너비 모두에 써요. `--axis-field-h`(기본 2.5rem)를 Input · Select 트리거에, `--axis-toggle-h-sm|md|lg`(기본 2.25 · 2.5 · 2.75rem)를 Toggle 높이와 `min-w` 에 써요.
- FR-2 글자: `--axis-control-font-size-sm|md|lg`(기본 0.75 · 0.875 · 1rem)를 Button 크기별 글자에(base 가 md, sm · lg 가 덮어씀), Input 은 md 를 써요. `--axis-table-font-size`(0.875rem)는 Table 루트, `--axis-table-head-font-size`(0.875rem)는 TableHead 에 써요. Select 트리거 · Toggle 글자는 `text-sm` 그대로예요. 클래스는 색 임의값과 구분되도록 `text-[length:var(...)]` 형태예요.
- FR-3 둥글기: `--axis-radius-control`(Button · Toggle), `--axis-radius-field`(Input · Select 트리거), `--axis-radius-surface`(Card · Dialog 640px 이상)를 정의해요. 기본값은 `--radius` 계산식이고 컴포넌트 fallback 은 0.375rem · 0.375rem · 0.5rem 이에요.
  - 기본값은 variables.css 의 `:root` · `.dark` 에 실려요. `--radius` 는 shadcn-compat.css 에만 있으므로, variables.css 만 쓰는 구성에서는 세 변수가 guaranteed-invalid 가 되어 컴포넌트 fallback 이 적용돼요(AC5).
- FR-4 ontology 값: control-h 27 · 34 · 42px, control-font-size 13 · 14 · 15px, field-h 36px, toggle-h 기본값과 같음, table-font-size 13.5px, table-head-font-size 13px, radius control 8px · field 6px · surface 12px. 모두 라이트 블록에만 두고(테마와 무관한 길이) 다크에서도 라이트 블록 명시도(0,2,0)로 유지돼요.

### 3.2 비기능 요구사항
- 하위 호환: 브랜드 미지정(variables.css + shadcn-compat.css + preset) 계산 크기가 1.6.3 과 같아요.
- 기본값의 두 출처(tokens JSON · 컴포넌트 fallback)가 어긋나면 테스트가 실패해요.
- 릴리스: tokens · ui-react minor(linked 1.7.0).

---

## 4. 수용 기준 (Acceptance Criteria)

- AC1: 브랜드 미지정에서 대상 7개(와 Sheet · Select 팝업)의 계산 높이 · 너비 · 최소 너비 · 글자 · 줄 높이 · 둥글기가 1.6.3 배포본과 같아요(Chromium 1280x720 · 375x720, 같은 글꼴로 대조, 표 · 표 셀 높이 포함, 카드 · 팝업 · Dialog 높이는 내용에 따라 달라 제외).
- AC2: `data-brand="ontology"` 에서 Button sm · default · lg 27 · 34 · 42px(글자 13 · 14 · 15px), icon 34x34, Input · Select 트리거 36px, Table 본문 13.5px · 머리 13px, 둥글기 Button · Toggle 8px · Input · Select 트리거 6px · Card · Dialog 12px, Toggle 36 · 40 · 44px, Sheet 0px(브라우저 계산값).
- AC3: Button · Input · Select · Toggle 소스에 `h-(8|9|10|11|12)` · `min-w-(9|10|11)` 고정 크기 클래스가 없어요(경계 있는 정적 검사, `max-h-96` · `h-4` 는 잡지 않음). TableHead `h-12` 는 대상 밖이에요.
- AC4: 컴포넌트 fallback 15종이 tokens 기본값과 같은 길이예요(`--radius` 0.5rem 으로 계산). 밀도 토큰을 참조하는 파일은 대상 7개뿐이에요.
- AC5(review 지적): variables.css 만 import 한 구성에서 `--axis-radius-control` 이 비고(guaranteed-invalid) 컴포넌트 둥글기가 fallback 6 · 6 · 8px 로 떨어져요(브라우저 측정). 1.6.3 의 같은 구성은 0px 라 이 구성에서는 대상 7개의 둥글기가 달라져요(아래 6 R1).
- 비기능: 단위 테스트 · type-check · lint · build · frontend.yml run 단계 · 관련 E2E 회귀가 없어요.

---

## 5. Assumptions

- A1: 터치 타깃 최소 크기는 브랜드 책임으로 두고 가이드에 적어요.
- A2: 프로토타입의 버튼 · 입력 높이는 선언값이 아니라 패딩과 Pretendard 줄 높이로 정해진 렌더값이에요. 토큰에는 고정 px 로 옮겨요.

## 6. Risks

- R1: variables.css 단독 구성(`@axis-ds/tokens/css/shadcn` 미사용)에서 대상 7개의 둥글기가 1.6.3 의 0px 에서 fallback 6 · 6 · 8px 로 바뀌어요(측정). 가이드는 이 구성의 0px 를 결함 증상으로 설명해 왔으니 개선 방향이지만, 「계산값 불변」 범위 밖의 변화라 릴리스 노트에 적어요.
- R2: 둥글기 기본값은 `:root` 에서 계산돼요. 하위 요소에서 `--radius` 만 바꾸는 소비자에게는 대상 7개가 따라가지 않아요(가이드에 우회 기록).
- R3: ontology 에서 Select 팝업 · Popover 등은 10px 로 남아 브랜드 안에서 둥글기 출처가 둘이에요(Q3 (나)의 비용).
- R4: Toggle 은 ontology 에서 40px 로 34px 버튼과 높이가 달라요(Q4, 디자인 오너 확인 대상).

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| v0.1~v0.3 | 2026-10-15 | 초안(세부는 git 이력) |
| v0.4 | 2026-10-16 | 디자인 기준 v0.24 교체, field 높이 · 표 머리 Q6 추가 |
| v1.0 | 2026-10-25 | 배치 3 결정(2절) 반영, 전제 정정(1.4), Sheet 제외 · lg · 이름 변경, AC1 기준 1.6.3, AC4 · AC5 추가 |
| v1.1 | 2026-10-25 | review 지적: AC1 에 줄 높이 · 표 높이 포함, 결정 line-height 추가 |
