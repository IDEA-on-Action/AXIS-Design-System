# WI-0026: 밀도 토큰 PRD

> 작성일: 2026-10-15 | 작성자: Sinclair Seo | WI: WI-0026 | GitHub: #85 | 상태: Draft | 버전: v0.3(2026-10-15)
> 선행: WI-0025(브랜드 테마 축). 밀도 값을 담을 `brands/ontology` 프리셋은 WI-0025 M3(FR-8, 1.3.0)에서 생성되므로 WI-0025 M3(brands/ontology 생성) 이후 착수합니다. 2026-10-15 기준 `packages/axis-tokens/src/brands`는 아직 없습니다.

---

## 1. 개요

### 1.1 배경
- AXIS 컴포넌트의 크기는 Tailwind 클래스에 고정되어 있습니다. 버튼 높이 `h-8|10|12`(32 · 40 · 48px), 입력 · Select 트리거 높이 `h-10`(40px), 토글 높이 `h-9|10|11`(36 · 40 · 44px), 표 글자 `text-sm`(14px) 등은 테마로 바꿀 수 없습니다.
- 둥글기는 shadcn `--radius` 하나에서 계산되어(`md = --radius - 2px`, `sm = --radius - 4px`) 단계 간격이 다른 브랜드를 정확히 표현하지 못합니다.
- 온톨로지 콘솔은 버튼 약 38px · 표 13.5px · 둥글기 카드 14px / 버튼 10px / 입력 6px처럼 촘촘한 콘솔 밀도를 씁니다. WI-0025는 이를 `--radius: 12px` 근사로만 맞춥니다.

### 1.2 목표
- 컨트롤 높이 · 글자 크기 · 단계별 둥글기를 CSS 변수로 열어, 브랜드 프리셋이 밀도를 바꿀 수 있게 합니다.
- 기본값은 현재 클래스 값과 같게 두어 기존 화면을 바꾸지 않습니다.

### 1.3 범위
- 포함: 밀도 토큰 정의, `axis-ui-react` 대상 컴포넌트(Button · Input · Select · Toggle · Table · Card · Dialog · Sheet)의 클래스를 토큰 참조로 교체, Tailwind preset 둥글기 매핑 변경과 그 복제본(문서 사이트 · 템플릿 4종 · 템플릿 배포 JSON) 동기화, `ontology` 프리셋에 밀도 값 추가
- 제외: 여백(padding · gap) 전체의 토큰화, agentic-ui 컴포넌트의 크기 조정, 「compact · comfortable」 같은 사용자 전환 기능

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR-1: 컨트롤 높이 토큰을 정의하고 대상 컴포넌트의 높이 클래스를 토큰 참조로 바꿉니다. 컴포넌트마다 현재 높이 체계가 달라 아래처럼 나눕니다.
  - `--axis-control-h-sm|md|lg`(기본 32 · 40 · 48px): Button `sm · default · lg`의 `h-8|10|12`를 `h-[var(--axis-control-h-*)]`로 바꿉니다.
  - Input(`input/index.tsx`)과 Select 트리거(`select/index.tsx`)는 size 변형 없이 `h-10` 하나만 쓰므로 `--axis-control-h-md` 하나에만 연결합니다.
  - Toggle은 `sm · default · lg`가 `h-9|10|11`(36 · 40 · 44px)과 `min-w-9|10|11`을 함께 씁니다. 32 · 40 · 48px 토큰에 연결하면 sm · lg가 4px씩 바뀌어 하위 호환이 깨지므로, Toggle 전용 토큰 `--axis-toggle-h-sm|md|lg`(기본 36 · 40 · 44px)를 두고 높이와 `min-w`를 같은 토큰으로 바꿉니다.
- FR-2: 글자 크기 토큰을 정의하고 Button · Input · Table에 적용합니다. Button의 글자는 크기별로 다릅니다(sm `text-xs` 12px, default · icon `text-sm` 14px, lg `text-base` 16px. base의 `text-sm`을 크기별 클래스가 덮어씁니다). 단일 토큰을 Button 전 크기에 적용하면 sm(12 → 14)과 lg(16 → 14)가 바뀌어 하위 호환이 깨지므로 크기별 토큰 `--axis-font-size-control-sm|md|lg`(기본 12 · 14 · 16px)를 둡니다. Input은 `text-sm` 하나라 `--axis-font-size-control-md`를 씁니다. 표 글자는 `--axis-font-size-table`(기본 14px)로 Table 루트의 `text-sm`을 바꿉니다.
- FR-3: 단계별 둥글기 토큰 `--axis-radius-control`(Button · Toggle), `--axis-radius-field`(Input · Select 트리거), `--axis-radius-surface`(Card · Dialog · Sheet)를 정의합니다. 토큰이 없으면 지금처럼 `--radius` 계산값(control · field는 `calc(var(--radius) - 2px)`, surface는 `var(--radius)`)으로 떨어지게 합니다.
  - Tailwind preset의 `rounded-md` · `rounded-lg`가 각각 control · surface 토큰을 참조하게 바꿉니다. Input · Select 트리거는 `rounded-md`를 쓰므로 field 토큰을 직접 참조하는 클래스로 바꿉니다.
  - 같은 `borderRadius` 매핑이 preset(`packages/axis-tokens/src/tailwind-preset.ts`) 밖에 복제되어 있습니다. 문서 사이트 `apps/web/tailwind.config.ts`, 템플릿 4종 `apps/web/templates/*/files/tailwind.config.ts`, 그 배포본 `apps/web/public/templates/*.json` 4개(템플릿 재생성으로 맞춰짐)도 함께 바꾸거나 preset 소비로 전환합니다. 저장소 안에서 preset을 소비하는 곳은 `examples/nextjs-app` 하나뿐입니다.
  - Dialog는 `sm:rounded-lg`만 있어 sm 미만 화면에서는 둥글기가 0이며 surface 토큰도 sm 이상에서만 적용됩니다. Sheet 콘텐츠에는 rounded 클래스가 없어 매핑 변경만으로는 surface 토큰이 적용되지 않으므로 컴포넌트에 클래스를 추가합니다. 이때 Sheet는 다른 surface와 달리 토큰이 없을 때의 fallback을 0으로 둡니다(`var(--axis-radius-surface, 0)`). `--radius`로 떨어지면 브랜드 미지정 상태에서도 8px로 둥글어져 2.2 하위 호환을 어기기 때문입니다.
  - preset 매핑은 전역이라 Select 팝업 콘텐츠(`rounded-md`)는 표면 성격인데도 control 토큰을 받고, popover · dropdown-menu · tooltip · toast · command 등 `rounded-md` · `rounded-lg`를 쓰는 다른 ui-react 컴포넌트와 agentic-ui 파일 13개도 control · surface 토큰을 받습니다. 이 영향은 Q3에서 정합니다.
- FR-4: WI-0025 M3가 생성하는 `brands/ontology` 프리셋에 밀도 값을 추가합니다(컨트롤 높이 md 38px · 컨트롤 글자 md 14px · 표 글자 13.5px · 둥글기 control 10px / field 6px / surface 14px).

### 2.2 비기능 요구사항
- 하위 호환: 브랜드 미지정 시 모든 컴포넌트의 계산 크기가 이전 버전과 같아야 합니다.
- 릴리스: `@axis-ds/tokens` · `@axis-ds/ui-react` minor.

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: 브랜드 미지정 상태에서 Button · Input · Select · Toggle · Table · Card · Dialog · Sheet의 계산 높이 · 글자 크기 · 둥글기가 이전 버전과 같습니다(Playwright 계산 스타일 스냅샷).
- AC2: `data-brand="ontology"`에서 Button 높이 38px, Table 본문 13.5px, Card 둥글기 14px, Button 둥글기 10px, Input 둥글기 6px입니다.
- AC3: Button · Input · Select · Toggle 소스에 `h-(8|9|10|11|12)` · `min-w-(9|10|11)` 고정 크기 클래스가 남지 않습니다(정적 검사). 검사 패턴은 앞에 경계를 두어 Select 팝업의 `max-h-96` 같은 접두 클래스를 잡지 않게 합니다. Table의 TableHead `h-12`는 FR-1 대상이 아니므로 검사 대상에서 뺍니다.
- 비기능: 단위 테스트 · typecheck · build · a11y 게이트 회귀가 없습니다.

---

## 4. Assumptions

- A1: 터치 타깃 최소 크기는 브랜드 책임으로 두고, 프리셋 문서에 권장값을 적습니다.

## 5. Risks / Open questions

- Q1: 아이콘 버튼(`size="icon"`, `h-10 w-10`)의 정사각 크기를 같은 토큰으로 묶을지 별도 토큰을 둘지 정해야 합니다.
- Q2: 문서 사이트 데모가 고정 크기를 가정한 곳이 있으면 함께 고쳐야 합니다.
- Q3: preset의 `rounded-md` · `rounded-lg` 전역 재매핑은 Select 팝업 · popover · dropdown-menu · tooltip · toast · command와 agentic-ui 13개 파일까지 control · surface 토큰을 적용합니다. 전역 재매핑을 유지하고 영향을 문서화할지, preset은 그대로 두고 대상 컴포넌트만 토큰을 직접 참조하는 클래스로 바꿀지 정해야 합니다. 후자를 고르면 FR-3의 복제본 9곳 수정도 필요 없어집니다.
- Q4: Toggle 전용 높이 토큰(FR-1)을 `ontology` 프리셋에서도 덮어쓸지(예: 컨트롤 높이 38px에 맞출지) 정해야 합니다. FR-4는 지금 Toggle 값을 지정하지 않습니다.
- Q5: field 둥글기 토큰을 control과 따로 두는 것은 온톨로지 콘솔의 입력 6px · 버튼 10px 차이를 표현하기 위해서입니다. 토큰 수를 줄이려면 입력도 10px로 맞추고 field 토큰을 없애는 선택지가 있습니다.
