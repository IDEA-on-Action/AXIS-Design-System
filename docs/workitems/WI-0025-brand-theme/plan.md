# WI-0025: 브랜드 테마 축 도입과 온톨로지 테마 구현 계획

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 작성일: 2026-10-15 | 기준: main `042b3b0`
>
> 각 절의 수치 · 파일:줄은 2026-10-15 실측값이며, 절마다 독립 검증(반박 관점)을 거쳤습니다. 구현 중 코드가 바뀌면 줄 번호는 낡으므로 착수 시점에 다시 확인합니다.

## 1. FR-1 정의 없는 변수 처리 방식

### 1.1 수집 결과 요약

- 범위: `packages/axis-ui-react` · `packages/axis-agentic-ui` 안의 `.ts/.tsx/.js/.jsx/.css/.md/.mdx` 75개 파일입니다(`node_modules` · `dist` 제외, 테스트 포함). 이 파일들에 있는 `var(--axis-*)` 참조는 492건이고(ui-react 231 · agentic-ui 261), 고유 이름은 99개입니다.
- 정의 기준: 빌드된 `variables.css`에는 `--axis-*` 이름이 223개 있고, `shadcn-compat.css`에는 0개 있습니다. `tokens/src` JSON의 잎 토큰을 빌드 규칙(`cssVarName`)으로 바꾸면 223개가 나오며, 빌드 결과와 양방향 차집합이 모두 0입니다. 따라서 dist와 src는 같은 정의 집합입니다.
- 정의 없는 이름은 **24개, 60건(테스트 10건 포함)**이고 모두 `axis-ui-react`의 15개 파일(테스트 2개 포함)에 있습니다. `axis-agentic-ui`에는 0건입니다.
- `var()` 없이 `--axis-`를 쓰는 형태와 `axis-${...}`처럼 동적으로 만드는 참조는 두 패키지 `src`에서 0건입니다.
- 아래 표의 파일 경로는 `packages/axis-ui-react/src/` 기준이고, 라이트/다크 값은 빌드된 `variables.css`의 `:root` / `.dark` 값입니다.

### 1.2 현재 렌더 규칙 (실측)

정의 없는 변수에 fallback 인자가 있는 참조는 **0건**입니다. 모두 "계산값 시점 무효"가 되어 속성이 `unset`처럼 동작하고, UA 스타일과 Tailwind preflight 값으로도 돌아가지 않습니다.

| Tailwind 클래스 | 생성 CSS | 무효일 때 결과 |
|---|---|---|
| `bg-[var(--x)]` | `background-color` | 초기값 `transparent` (rgba(0,0,0,0)) |
| `text-[var(--x)]` | `color` | 부모 글자색 상속 (실측 라이트 #111827 · 다크 #F3F4F6) |
| `border-[var(--x)]` | `border-color` | 초기값 `currentcolor`, 즉 그 요소의 글자색 |
| `ring-[var(--x)]` · `ring-offset-[var(--x)]` | `--tw-ring-color` · `--tw-ring-offset-color` | 이 변수를 품은 `box-shadow` 전체가 무효가 되어 `none`이 됩니다. `outline-none`과 겹쳐 **키보드 포커스 표시가 없습니다** |

### 1.3 변수별 처리 표

| 변수 | 참조 파일(줄) | 현재 렌더 결과 | 처리 방식 | 대상 토큰과 라이트/다크 값 | 화면 변화 여부(Q2) |
|---|---|---|---|---|---|
| `--axis-surface-primary` | alert/index.tsx(11), alert/alert.test.tsx(17), checkbox(17), command(16), dropdown-menu(73, 92), popover(22), radio-group(27), sheet(35, 73), slider(34, 2회), switch(13), textarea(11, 13), toggle(7). 11개 파일 + 테스트 1, 16건 | 바탕은 `transparent`입니다. `ring-offset`으로 쓰인 곳은 box-shadow가 `none`이 되어 포커스 링이 없습니다 | 참조 교체 | `--axis-surface-default` #FFFFFF / #030712 | 예. Popover · DropdownMenu(Content · SubContent) · Sheet · Command는 투명에서 불투명으로 바뀝니다. Alert(default) · Textarea · Slider 썸은 바탕이 surface-default가 아닌 곳에 놓일 때만 차이가 보입니다(페이지 `--background` 렌더값 라이트 #FFFFFF · 다크 rgb(3,7,17)과 같거나 1 차이). 7개 컴포넌트에는 포커스 링이 생깁니다(`--axis-ring`과 함께) |
| `--axis-ring` | checkbox(18), radio-group(28), sheet(73), slider(34), switch(13), textarea(15), toggle(7). 7건 | `--tw-ring-color`가 무효가 되어 box-shadow가 `none`이고, 포커스 표시가 없습니다 | 참조 교체 | `--axis-border-focus` #3B82F6 / #60A5FA | 예(포커스 상태만). 실측 후 값은 라이트 `#FFF 2px + rgb(59,130,246) 4px`, 다크 `rgb(3,7,18) 2px + rgb(96,165,250) 4px`입니다 |
| `--axis-interactive-primary` | checkbox(20, 2회), radio-group(30, 2회), slider(28, 34), switch(15). 4개 파일 7건 | Checkbox(checked)는 바탕이 투명이고 테두리가 `text-white` 때문에 흰색이라, 라이트에서는 체크 상태가 흰 바탕에 묻힙니다. Radio는 테두리와 점이 상속 글자색입니다. Switch(on)는 바탕이 투명이라 흰 썸만 보입니다. Slider는 Range가 투명이고 썸 테두리가 상속 글자색입니다 | semantic 신설 `interactive.primary` | `{color.blue.500}` #3B82F6 / `{color.blue.500}` #3B82F6 | 예(라이트 · 다크) |
| `--axis-brand-500` | progress(26) | 기본 진행 막대의 채움이 투명이라 트랙만 보입니다 | 참조 교체 | `--axis-surface-brand` #3B82F6 / #2563EB | 예 |
| `--axis-bg-muted` | badge/index.tsx(13), badge/badge.test.tsx(21) | secondary 변형의 바탕이 투명이라 글자만 보입니다 | 참조 교체 | `--axis-surface-secondary` #F3F4F6 / #111827 | 예 |
| `--axis-blue-100` | alert/index.tsx(12), alert.test.tsx(24) | 바탕 투명 | 오타 정정 | `--axis-color-blue-100` #DBEAFE / #DBEAFE | 예 |
| `--axis-blue-200` | alert/index.tsx(12), alert.test.tsx(25) | 테두리가 currentcolor라 상속 글자색입니다(#111827 / #F3F4F6) | 오타 정정 | `--axis-color-blue-200` #BFDBFE / #BFDBFE | 예 |
| `--axis-blue-600` | alert/index.tsx(12) | 아이콘이 상속 글자색입니다 | 오타 정정 | `--axis-color-blue-600` #2563EB / #2563EB | 예 |
| `--axis-blue-900` | alert/index.tsx(12) | 글자가 부모 상속색입니다 | 오타 정정 | `--axis-color-blue-900` #1E3A8A / #1E3A8A | 예 |
| `--axis-green-100` | alert/index.tsx(14), alert.test.tsx(31) | 바탕 투명 | 오타 정정 | `--axis-color-green-100` #DCFCE7 / #DCFCE7 | 예 |
| `--axis-green-200` | alert/index.tsx(14), alert.test.tsx(32) | 테두리가 상속 글자색 | 오타 정정 | `--axis-color-green-200` #BBF7D0 / #BBF7D0 | 예 |
| `--axis-green-600` | alert/index.tsx(14) | 아이콘이 상속 글자색 | 오타 정정 | `--axis-color-green-600` #16A34A / #16A34A | 예 |
| `--axis-green-900` | alert/index.tsx(14) | 글자가 부모 상속색 | 오타 정정 | `--axis-color-green-900` #14532D / #14532D | 예 |
| `--axis-yellow-100` | alert/index.tsx(16), alert.test.tsx(38) | 바탕 투명 | 오타 정정 | `--axis-color-yellow-100` #FEF9C3 / #FEF9C3 | 예 |
| `--axis-yellow-200` | alert/index.tsx(16), alert.test.tsx(39) | 테두리가 상속 글자색 | 오타 정정 | `--axis-color-yellow-200` #FEF08A / #FEF08A | 예 |
| `--axis-yellow-600` | alert/index.tsx(16) | 아이콘이 상속 글자색 | 오타 정정 | `--axis-color-yellow-600` #CA8A04 / #CA8A04 | 예 |
| `--axis-yellow-900` | alert/index.tsx(16) | 글자가 부모 상속색 | 오타 정정 | `--axis-color-yellow-900` #713F12 / #713F12 | 예 |
| `--axis-red-100` | alert/index.tsx(18), alert.test.tsx(45) | 바탕 투명 | 오타 정정 | `--axis-color-red-100` #FEE2E2 / #FEE2E2 | 예 |
| `--axis-red-200` | alert/index.tsx(18), alert.test.tsx(46) | 테두리가 상속 글자색 | 오타 정정 | `--axis-color-red-200` #FECACA / #FECACA | 예 |
| `--axis-red-600` | alert/index.tsx(18) | 아이콘이 상속 글자색 | 오타 정정 | `--axis-color-red-600` #DC2626 / #DC2626 | 예 |
| `--axis-red-900` | alert/index.tsx(18) | 글자가 부모 상속색 | 오타 정정 | `--axis-color-red-900` #7F1D1D / #7F1D1D | 예 |
| `--axis-green-500` | progress(27) | 진행 막대 채움 투명 | 오타 정정 | `--axis-color-green-500` #22C55E / #22C55E | 예 |
| `--axis-yellow-500` | progress(28) | 진행 막대 채움 투명 | 오타 정정 | `--axis-color-yellow-500` #EAB308 / #EAB308 | 예 |
| `--axis-red-500` | progress(29) | 진행 막대 채움 투명 | 오타 정정 | `--axis-color-red-500` #EF4444 / #EF4444 | 예 |

- primitive는 `.dark`에도 같은 값으로 다시 나오므로, 오타 정정 행은 라이트와 다크 값이 같습니다.
- Alert의 info · success · warning · destructive 변형은 지금 바탕이 없고, 1px 테두리가 부모 글자색으로 그려집니다.
- Alert 아이콘 행(`*-600`)의 결과는 `cn()`의 tailwind-merge가 기본 클래스 `[&>svg]:text-current`를 지운다는 전제 위에 있습니다. `cn()`을 거치지 않는 경로라면 아이콘은 글자색(`*-900`)으로 그려집니다.

### 1.4 `surface-primary`: 별칭 대신 참조 교체를 고른 근거

1. **1.2.1 기본 테마의 화면 변화는 두 방식이 같습니다.** 별칭(`surface.primary = {surface.default}`)을 흉내 낸 렌더의 계산값은 surface-default 값(라이트 rgb(255,255,255), 다크 rgb(3,7,18))과 같았습니다. 어느 방식을 골라도 11개 컴포넌트의 1.2.1 변화량은 똑같습니다.
2. **1.3.0 브랜드에서는 별칭이 화면 차이를 남깁니다.** 토큰 빌드는 참조를 리터럴로 풀어서 냅니다(`build-tokens.mjs`에 `outputReferences` 0건, `variables.css`에 `--axis-surface-default: #FFFFFF`처럼 리터럴로 출력). 그래서 별칭은 `--axis-surface-primary: #FFFFFF`라는 독립된 값이 됩니다. 온톨로지 초안(`axis-theme-ontology.css`)은 `--axis-surface-default`만 덮어쓰고 `surface-primary`는 정의하지 않습니다(grep 0건). 별칭으로 가면 온톨로지 다크에서 Popover · Sheet 같은 11개 컴포넌트만 AXIS 기본값 #030712에 남고, 나머지 화면은 온톨로지 값 #172030이 됩니다. 참조를 교체하면 이 어긋남이 생기지 않습니다.
3. **공개 이름이 늘지 않습니다.** `variables.css`에 새 이름을 더하지 않으므로 NFR의 번들 증가 제한에도 맞습니다. `--axis-surface-primary`를 소비자 코드가 직접 쓴 경우는 이 저장소에서 확인할 수 없어서 영향 밖으로 둡니다.
4. 같은 이유로 `ring` · `bg-muted` · `brand-500`도 별칭 대신 참조 교체로 처리합니다. 온톨로지 초안이 `--axis-border-focus` · `--axis-surface-secondary` · `--axis-surface-brand`를 덮어쓰므로, 교체하면 브랜드 값이 그대로 닿습니다.

### 1.5 `interactive.primary` 값 선택 근거

| 후보 | 라이트 근거 | 다크 근거 | 판정 |
|---|---|---|---|
| `color.blue.500` #3B82F6 | `button.bg.default` · `border.focus` · `surface.brand`(라이트)와 같은 값이라, 체크된 컨트롤이 Primary Button과 같은 색이 됩니다. surface-default #FFFFFF 대비 3.68:1(비텍스트 3:1 충족), 흰 체크 표시와의 대비도 3.68:1입니다 | 컴포넌트 토큰은 다크 빌드에서 빠지므로(`build-tokens.mjs` 176행 주석, `.dark`에 `button-*` 0건) 다크의 Primary Button도 #3B82F6입니다. #030712 대비 5.47:1, surface-tertiary #1F2937(Switch off · Slider 트랙) 대비 3.99:1, 흰 체크 3.68:1입니다 | **채택(라이트 · 다크 동일)** |
| `color.blue.600` #2563EB | 대비 5.17:1로 더 높지만 `button.bg.hover` 값이라 기본 버튼과 색이 달라집니다 | #1F2937 대비 2.84:1로 3:1에 못 미칩니다 | 기각 |
| `color.blue.400` #60A5FA | 흰 바탕 대비 2.54:1로 미달입니다 | `border.focus`(다크) 값이지만 흰 체크 표시 대비가 2.54:1로 미달입니다 | 기각 |

`light.json` · `dark.json`에 두 벌 모두 둡니다. 값이 같아도 1.3.0 브랜드가 테마별로 덮어쓸 수 있어야 하기 때문입니다.

### 1.6 1.2.1 릴리스 노트에 적을 화면 변화 컴포넌트

> 2026-10-15 구현 반영: Alert 상태 변형은 D-a 결정대로 semantic 매핑이라 아래 1.3 표의 alert 행(primitive 값)과 "다크에서도 밝은 파스텔 상자" 서술은 낡았습니다. 실제로는 다크에서 어두운 상자(예: info 바탕 #172554)이고, 아이콘은 변형 글자색(`text-current`)을 따릅니다.

모두 `@axis-ds/ui-react`입니다. `@axis-ds/agentic-ui`는 정의 없는 참조가 0건이라 해당이 없습니다.

1. Alert: default 바탕이 surface-default가 됩니다. info · success · warning · destructive는 바탕 · 글자 · 테두리 · 아이콘 색이 생기며, 다크에서도 밝은 파스텔 상자로 보입니다.
2. Badge: secondary 변형에 회색 바탕이 생깁니다.
3. Progress: default · success · warning · destructive의 채움 색이 생깁니다. 지금은 채움이 보이지 않습니다.
4. Checkbox: 체크 시 파란 바탕과 테두리가 생기고, 포커스 링이 생깁니다.
5. RadioGroup: 선택 시 테두리와 점이 파란색이 되고, 포커스 링이 생깁니다.
6. Switch: 켜짐 바탕이 파란색이 되고, 포커스 링이 생깁니다.
7. Slider: Range가 파란색이 되고, 썸에 바탕과 파란 테두리가 생기며, 포커스 링이 생깁니다.
8. Textarea: 바탕이 surface-default가 되고, 포커스 링이 생깁니다.
9. Toggle: 포커스 링이 생깁니다.
10. Sheet: 패널 바탕이 불투명해지고, 닫기 버튼에 포커스 링이 생깁니다.
11. Popover: 바탕이 불투명해집니다.
12. DropdownMenu(Content · SubContent): 바탕이 불투명해집니다.
13. Command: 바탕이 surface-default가 됩니다.

### 1.7 결정 필요

> 2026-10-15 결정: D-a는 semantic 매핑(`border-info` · `border-warning` · `icon-info` 신설), D-d는 M1 별도 하네스 · `apps/web` 정비는 M3입니다. 나머지는 권장안으로 진행합니다.

- **D-a 다크 모드 Alert 상태 변형**: PRD대로 오타를 정정하면 primitive라서 다크에서도 라이트 파스텔 상자가 됩니다. 상자 안 대비는 글자 8.07~8.49:1로 충분합니다. 대안은 semantic `surface-info` · `text-info` 계열로 매핑하는 것인데, 라이트 값이 달라집니다(예: `surface-info` #EFF6FF ≠ blue-100 #DBEAFE). 또 primitive로 남기면 1.3.0 브랜드가 상태 Alert에 닿지 않아, AC7의 Alert 데모에서는 default 변형만 바뀝니다. 아이콘 대비는 yellow-600/yellow-100이 2.74:1, green-600/green-100이 3.00:1입니다.
- **D-b Progress 기본 채움의 대상**: `surface-brand`(채택)는 다크 #2563EB의 트랙 #1F2937 대비가 2.84:1입니다. `interactive.primary`로 가면 3.99:1입니다. 상태 막대는 라이트 트랙 #E5E7EB 대비 green-500 1.84:1, yellow-500 1.55:1로 3:1에 못 미칩니다.
- **D-c Slider Range 라이트 대비**: #3B82F6과 트랙 #E5E7EB의 대비가 2.97:1입니다. 값은 썸(#FFFFFF 대비 3.68:1)이 전달하므로 허용할지 정해야 합니다.
- **D-d Q2 전후 스크린샷 장소**: 문서 사이트는 다음 이유로 AXIS 컴포넌트 색을 그리지 못하는 상태라, 문서 사이트로 전후를 비교하면 차이가 나타나지 않습니다. 별도 하네스(1.8의 4번 방식)를 쓸지, `apps/web` 설정 수정을 범위에 넣을지 정해야 합니다(AC7에도 영향).
  - `apps/web/tailwind.config.ts`의 content가 존재하지 않는 `../../packages/ui/src`를 봅니다.
  - `globals.css`와 `layout.tsx`가 tokens CSS를 import하지 않습니다.
  - 2026-08-07에 빌드된 `apps/web/out` CSS에 `var(--axis-` 0건, `--axis-surface-default` 0건입니다.
- **D-e 생성 사본 갱신**: FR-3 검사는 `src`만 보므로 아래 사본은 잡지 못합니다.
  - registry `badge.json` 3곳(`packages/axis-ui-react/registry/r`, `public/r`, `apps/web/public/r`)에 `--axis-bg-muted`가 있습니다. `pnpm build:registry`로 다시 만듭니다.
  - `apps/web/public/library/components/*.json` 10개에 `surface-primary` · `ring` · `interactive-primary`가 있습니다. 이 파일을 만드는 스크립트는 `scripts/` · `apps/web/package.json`에서 찾지 못했습니다. 수동 갱신 여부를 정해야 합니다.
- **D-f 온톨로지 초안 정리(FR-8)**: `bg-muted`를 참조 교체하면 초안의 `--axis-bg-muted`(98행 #F0F3F6, 197행 #1E293A)는 쓰이지 않습니다. 이 값은 초안의 `--axis-surface-secondary`(28행 · 127행)와 같으므로 지워도 화면 변화가 없습니다.

### 1.8 실측 근거

1. 정의·참조 전수 스캔(스크래치 스크립트 `scan.mjs`):
   - 정의: `variables.css`에서 223개, `shadcn-compat.css`에서 0개를 수집했습니다. JSON 잎 223개와 비교한 양방향 차집합은 0입니다.
   - 참조: 75개 파일에서 492건을 찾았습니다(ui-react 231 · agentic-ui 261, `grep -rhoE 'var\(--axis-'`로 교차 확인). 고유 이름은 99개입니다.
   - 미정의: 24개 이름, 60건(`.test.tsx` 10건), 15개 파일이며 모두 ui-react에 있습니다. fallback이 있는 참조는 0건입니다.
2. 다른 참조 형태: `grep -rnE -e '--axis-' <두 패키지>/src | grep -vE 'var\(--axis-[A-Za-z0-9-]+\)'` 0줄, `grep -rnE -e 'axis-\$\{'` 0줄입니다.
3. 클래스 생성 확인: `tailwindcss` 3.4.19 CLI로 실제 클래스를 컴파일했습니다.
   - `bg-`는 `background-color`, `border-`는 `border-color`, `text-`는 `color`로 나옵니다.
   - `ring-[var()]`는 `--tw-ring-color`, `ring-offset-[var()]`는 `--tw-ring-offset-color`로 나옵니다.
   - `ring-2`는 이 두 변수를 품은 `box-shadow`를 만듭니다.
4. 전후 렌더 측정:
   - 방법: `@playwright/test` 1.61.1 Chromium을 썼습니다. 페이지는 ui-react `src` 전체로 컴파일한 Tailwind(preflight 포함)와 `variables.css` · `shadcn-compat.css`로 구성하고, transition은 껐습니다. 컴포넌트 DOM은 소스의 클래스 문자열을 옮겨 손으로 구성했습니다(React 렌더 아님). 정의 전과 정의 시뮬레이션 후를 각각 라이트 · 다크로 재고, 포커스는 Tab 키로 `:focus-visible` true를 확인한 뒤 쟀습니다.
   - 전제: 손으로 구성한 DOM의 클래스 문자열은 `cn()`(tailwind-merge 2.6.0)을 거친 결과 기준입니다. Alert 기본 클래스의 `[&>svg]:text-current`는 컴파일된 CSS에서 변형 클래스보다 뒤에 나오므로, twMerge가 이 클래스를 지워야만 아이콘이 `*-600` 색이 됩니다. `twMerge('[&>svg]:text-current [&>svg]:text-[var(--axis-color-blue-600)]')`의 결과가 뒤쪽 클래스 하나만 남는 것으로 확인했습니다.
   - 정의 전: 모든 대상의 바탕이 rgba(0,0,0,0)이고 포커스 box-shadow가 `none`입니다.
   - 정의 후: 1.3 표의 대상 값과 일치합니다. Checkbox 테두리는 전 rgb(255,255,255)에서 후 rgb(59,130,246)이 되고, Alert info 테두리는 전 rgb(17,24,39)(라이트) · rgb(243,244,246)(다크)에서 바뀝니다.
5. 대비: WCAG 상대 휘도 공식을 node로 계산했습니다. 1.5와 1.7의 비율이 모두 이 계산값입니다.
6. 빌드 방식:
   - `grep -c outputReferences build-tokens.mjs`는 0입니다.
   - `build-tokens.mjs` 176~181행에서 다크 소스는 primitives와 `semantic/dark.json`뿐입니다.
   - `variables.css`의 리터럴 값은 156 · 157 · 160 · 176행(라이트)과 382 · 383 · 386 · 402행(다크)에 있습니다.
   - dist 수정 시각은 2026-10-15 04:34이고, tokens `src` 마지막 커밋은 8c36953(2026-08-07)이므로 dist가 src보다 새것입니다.
7. 온톨로지 초안: `grep -nE 'bg-muted|surface-primary|interactive|--axis-ring|brand-500' axis-theme-ontology.css`의 결과는 `bg-muted` 2줄(98, 197행)뿐이고 나머지는 0건입니다.
8. 문서 사이트:
   - `tailwind.config.ts` 9행이 `'../../packages/ui/src/**/*'`를 가리키는데, `ls packages/ui`는 "No such file"입니다.
   - `grep -c -e '--axis-' apps/web/src/app/globals.css`는 0입니다.
   - `apps/web/out/_next/static/css/*.css`(2026-08-07)에서 `--axis-surface-default` 0건, `var(--axis-` 0건입니다.
9. 생성 사본:
   - `git ls-files apps/web/public/library/components`는 98개이고, 그중 미정의 이름을 담은 파일은 10개입니다.
   - `badge.json`의 `--axis-bg-muted`는 3곳에서 확인했습니다.
   - `build-registry.mjs` 35~36행의 출력 경로는 `public/r` · `apps/web/public/r`입니다.

---

## 2. FR-2 agentic-ui primitive 직접 참조 매핑

### 2.1 요약

- `packages/axis-agentic-ui/src`에서 `var(--axis-color-*)` 참조는 **13개 파일, 68줄, 80건**입니다. 서로 다른 primitive는 14종이고, 모두 `index.tsx`에 있습니다. 테스트 파일에서 이 이름을 단언하는 곳은 없습니다.
- 빌드된 `variables.css`에서 14종 primitive는 `:root`(7행부터)와 `.dark`(233행부터)에 **같은 값**으로 들어 있습니다. 다크 빌드(`sdDark`)도 `src/primitives/**/*.json`을 소스로 다시 내보내기 때문입니다. 그래서 아래 표의 다크 값은 모두 라이트 값과 같고, **다크에서 primitive가 바뀌는 항목은 없습니다**.
- 기존 semantic 토큰 가운데 의미가 맞는 것(`icon.success|warning|error`, `border.error`, `surface.brand` 등)은 라이트 값은 같지만 다크 값이 다릅니다(예: `--axis-icon-success`는 라이트 #22C55E, 다크 #4ADE80). 그대로 쓰면 다크 화면이 바뀌므로 화면 불변 원칙에 따라 **채택하지 않았습니다**(결정 필요 D-1).
- 기존 토큰으로 대체하는 것은 component 버튼 토큰 4개(2개 줄)뿐입니다. component 토큰은 다크 빌드 소스에서 빠져 있어 `.dark` 블록에 없으므로, 다크에서도 `:root` 값이 그대로 적용됩니다. 그래서 primitive를 직접 쓰던 현재 값과 다크에서도 같습니다.
- 나머지 66줄은 **신설 semantic 토큰 22개**(`status` 14 · `diff` 4 · `agent` 4)로 바꿉니다. 각 토큰은 `light.json`과 `dark.json`에서 같은 primitive를 참조합니다.
- Tailwind 불투명도 수식어(`/10`, `/30`)는 변수 이름만 바꾸고 그대로 둡니다.

### 2.2 매핑 표

다크 값 칸의 「(불변)」은 `.dark`에서 해당 primitive 값이 라이트와 같다는 뜻입니다.

| 파일:줄 | 현재 참조 | 용도 | 대체 토큰 | 신설 여부 | 라이트 값 | 다크 값 |
|---|---|---|---|---|---|---|
| agent-avatar/index.tsx:28 | `--axis-color-green-500` | 접속 상태 점(online) | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| agent-avatar/index.tsx:29 | `--axis-color-yellow-500` | 접속 상태 점(busy) | `--axis-status-warning` | 신설 | #EAB308 | #EAB308 (불변) |
| agent-avatar/index.tsx:30 | `--axis-color-gray-400` | 접속 상태 점(offline) | `--axis-status-neutral` | 신설 | #9CA3AF | #9CA3AF (불변) |
| agent-avatar/index.tsx:34 | `--axis-color-purple-500` | 아바타 배경(assistant) | `--axis-agent-avatar-assistant` | 신설 | #A855F7 | #A855F7 (불변) |
| agent-avatar/index.tsx:35 | `--axis-color-blue-500` | 아바타 배경(tool) | `--axis-agent-avatar-tool` | 신설 | #3B82F6 | #3B82F6 (불변) |
| agent-avatar/index.tsx:36 | `--axis-color-gray-600` | 아바타 배경(system) | `--axis-agent-avatar-system` | 신설 | #4B5563 | #4B5563 (불변) |
| approval-card/index.tsx:32 | `--axis-color-blue-500` | info 왼쪽 색 선 | `--axis-status-info` | 신설 | #3B82F6 | #3B82F6 (불변) |
| approval-card/index.tsx:33 | `--axis-color-blue-500` | info 아이콘 | `--axis-status-info` | 신설 | #3B82F6 | #3B82F6 (불변) |
| approval-card/index.tsx:37 | `--axis-color-yellow-500` | warning 왼쪽 색 선 | `--axis-status-warning` | 신설 | #EAB308 | #EAB308 (불변) |
| approval-card/index.tsx:38 | `--axis-color-yellow-500` | warning 아이콘 | `--axis-status-warning` | 신설 | #EAB308 | #EAB308 (불변) |
| approval-card/index.tsx:42 | `--axis-color-red-500` | error 왼쪽 색 선 | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| approval-card/index.tsx:43 | `--axis-color-red-500` | error 아이콘 | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| attachment-card/index.tsx:86 | `--axis-color-red-500` (`/30`) | 오류 상태 테두리 | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| attachment-card/index.tsx:141 | `--axis-color-blue-500` | 업로드 진행 막대 | `--axis-status-running` | 신설 | #3B82F6 | #3B82F6 (불변) |
| code-block/index.tsx:77 | `--axis-color-green-500` | 복사 완료 아이콘 | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| diff-viewer/index.tsx:71 | `--axis-color-green-500` (`/10`) | 추가 줄 배경 | `--axis-diff-added` | 신설 | #22C55E | #22C55E (불변) |
| diff-viewer/index.tsx:72 | `--axis-color-red-500` (`/10`) | 삭제 줄 배경 | `--axis-diff-removed` | 신설 | #EF4444 | #EF4444 (불변) |
| diff-viewer/index.tsx:77 | `--axis-color-green-600` | 추가 줄 글자 | `--axis-diff-added-text` | 신설 | #16A34A | #16A34A (불변) |
| diff-viewer/index.tsx:78 | `--axis-color-red-600` | 삭제 줄 글자 | `--axis-diff-removed-text` | 신설 | #DC2626 | #DC2626 (불변) |
| diff-viewer/index.tsx:123 | `--axis-color-green-500` | 추가 줄 수 글자 | `--axis-diff-added` | 신설 | #22C55E | #22C55E (불변) |
| diff-viewer/index.tsx:126 | `--axis-color-red-500` | 삭제 줄 수 글자 | `--axis-diff-removed` | 신설 | #EF4444 | #EF4444 (불변) |
| feedback-buttons/index.tsx:62 | `--axis-color-green-500` ×2 (글자, `/10` 배경) | 좋아요 활성 상태 | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| feedback-buttons/index.tsx:78 | `--axis-color-red-500` ×2 (글자, `/10` 배경) | 싫어요 활성 상태 | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| message-bubble/index.tsx:30 | `--axis-color-blue-500` | 사용자 말풍선 배경 | `--axis-agent-message-user-bg` | 신설 | #3B82F6 | #3B82F6 (불변) |
| plan-card/index.tsx:34 | `--axis-color-gray-400` | draft 왼쪽 색 선 | `--axis-status-neutral` | 신설 | #9CA3AF | #9CA3AF (불변) |
| plan-card/index.tsx:35 | `--axis-color-gray-100` / `--axis-color-gray-600` | draft 뱃지 배경 / 글자 | `--axis-status-neutral-bg` / `--axis-status-neutral-strong` | 신설 | #F3F4F6 / #4B5563 | #F3F4F6 / #4B5563 (불변) |
| plan-card/index.tsx:38 | `--axis-color-yellow-500` | pending 왼쪽 색 선 | `--axis-status-warning` | 신설 | #EAB308 | #EAB308 (불변) |
| plan-card/index.tsx:39 | `--axis-color-yellow-500` (`/10`) / `--axis-color-yellow-600` | pending 뱃지 배경 / 글자 | `--axis-status-warning` / `--axis-status-warning-strong` | 신설 | #EAB308 / #CA8A04 | #EAB308 / #CA8A04 (불변) |
| plan-card/index.tsx:42 | `--axis-color-green-500` | approved 왼쪽 색 선 | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| plan-card/index.tsx:43 | `--axis-color-green-500` (`/10`) / `--axis-color-green-600` | approved 뱃지 배경 / 글자 | `--axis-status-success` / `--axis-status-success-strong` | 신설 | #22C55E / #16A34A | #22C55E / #16A34A (불변) |
| plan-card/index.tsx:46 | `--axis-color-red-500` | rejected 왼쪽 색 선 | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| plan-card/index.tsx:47 | `--axis-color-red-500` (`/10`) / `--axis-color-red-600` | rejected 뱃지 배경 / 글자 | `--axis-status-error` / `--axis-status-error-strong` | 신설 | #EF4444 / #DC2626 | #EF4444 / #DC2626 (불변) |
| plan-card/index.tsx:50 | `--axis-color-blue-500` | executing 왼쪽 색 선 | `--axis-status-running` | 신설 | #3B82F6 | #3B82F6 (불변) |
| plan-card/index.tsx:51 | `--axis-color-blue-500` (`/10`) / `--axis-color-blue-600` | executing 뱃지 배경 / 글자 | `--axis-status-running` / `--axis-status-running-strong` | 신설 | #3B82F6 / #2563EB | #3B82F6 / #2563EB (불변) |
| plan-card/index.tsx:54 | `--axis-color-green-500` | completed 왼쪽 색 선 | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| plan-card/index.tsx:55 | `--axis-color-green-500` (`/10`) / `--axis-color-green-600` | completed 뱃지 배경 / 글자 | `--axis-status-success` / `--axis-status-success-strong` | 신설 | #22C55E / #16A34A | #22C55E / #16A34A (불변) |
| plan-card/index.tsx:61 | `--axis-color-gray-400` | 단계 아이콘(pending) | `--axis-status-neutral` | 신설 | #9CA3AF | #9CA3AF (불변) |
| plan-card/index.tsx:66 | `--axis-color-blue-500` | 단계 아이콘(running) | `--axis-status-running` | 신설 | #3B82F6 | #3B82F6 (불변) |
| plan-card/index.tsx:72 | `--axis-color-green-500` | 단계 아이콘(complete) | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| plan-card/index.tsx:77 | `--axis-color-red-500` | 단계 아이콘(error) | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| plan-card/index.tsx:82 | `--axis-color-gray-400` | 단계 아이콘(skipped) | `--axis-status-neutral` | 신설 | #9CA3AF | #9CA3AF (불변) |
| plan-card/index.tsx:138 | `--axis-color-green-500` | 완료 진행 막대 | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| plan-card/index.tsx:179 | `--axis-color-green-500` / `--axis-color-green-600` | 승인 버튼 배경 / hover | `--axis-status-success` / `--axis-status-success-strong` | 신설 | #22C55E / #16A34A | #22C55E / #16A34A (불변) |
| plan-card/index.tsx:195 | `--axis-color-red-500` ×2 (글자, hover `/10` 배경) | 거절 버튼 | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| recovery-banner/index.tsx:34 | `--axis-color-red-200` | 배너 테두리 | `--axis-status-error-border` | 신설 | #FECACA | #FECACA (불변) |
| recovery-banner/index.tsx:42 | `--axis-color-red-500` | 경고 아이콘 | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| recovery-banner/index.tsx:69 | `--axis-color-red-500` / `--axis-color-red-600` | 재시도 버튼 배경 / hover | `--axis-button-destructive-bg-default` / `--axis-button-destructive-bg-hover` | 기존(component) | #EF4444 / #DC2626 | #EF4444 / #DC2626 (component 토큰은 `.dark`에 없어 라이트 값 유지) |
| run-progress/index.tsx:30 | `--axis-color-gray-300` | 단계 점(pending) | `--axis-status-neutral-muted` | 신설 | #D1D5DB | #D1D5DB (불변) |
| run-progress/index.tsx:31 | `--axis-color-blue-500` | 단계 점(running) | `--axis-status-running` | 신설 | #3B82F6 | #3B82F6 (불변) |
| run-progress/index.tsx:32 | `--axis-color-green-500` | 단계 점(complete) | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| run-progress/index.tsx:33 | `--axis-color-red-500` | 단계 점(error) | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| run-progress/index.tsx:84 | `--axis-color-blue-500` | 헤더 실행 중 점 | `--axis-status-running` | 신설 | #3B82F6 | #3B82F6 (불변) |
| run-progress/index.tsx:108 | `--axis-color-blue-500` | 전체 진행 막대 | `--axis-status-running` | 신설 | #3B82F6 | #3B82F6 (불변) |
| run-progress/index.tsx:163 | `--axis-color-blue-500` / `--axis-color-blue-600` | 재시도 버튼 배경 / hover | `--axis-button-bg-default` / `--axis-button-bg-hover` | 기존(component) | #3B82F6 / #2563EB | #3B82F6 / #2563EB (component 토큰은 `.dark`에 없어 라이트 값 유지) |
| step-timeline/index.tsx:68 | `--axis-color-green-500` | 단계 점(complete) | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| step-timeline/index.tsx:69 | `--axis-color-blue-500` | 단계 점(running) | `--axis-status-running` | 신설 | #3B82F6 | #3B82F6 (불변) |
| step-timeline/index.tsx:70 | `--axis-color-red-500` | 단계 점(error) | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| step-timeline/index.tsx:71 | `--axis-color-gray-300` | 단계 점(skipped) | `--axis-status-neutral-muted` | 신설 | #D1D5DB | #D1D5DB (불변) |
| step-timeline/index.tsx:72 | `--axis-color-gray-300` | 단계 점(pending) | `--axis-status-neutral-muted` | 신설 | #D1D5DB | #D1D5DB (불변) |
| token-usage-indicator/index.tsx:34 | `--axis-color-red-500` | 사용량 막대(초과) | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| token-usage-indicator/index.tsx:35 | `--axis-color-yellow-500` | 사용량 막대(경고) | `--axis-status-warning` | 신설 | #EAB308 | #EAB308 (불변) |
| token-usage-indicator/index.tsx:36 | `--axis-color-green-500` | 사용량 막대(정상) | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| token-usage-indicator/index.tsx:40 | `--axis-color-red-500` | 사용량 글자(초과) | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |
| token-usage-indicator/index.tsx:41 | `--axis-color-yellow-500` | 사용량 글자(경고) | `--axis-status-warning` | 신설 | #EAB308 | #EAB308 (불변) |
| tool-call-card/index.tsx:32 | `--axis-color-gray-400` | 상태 아이콘 색(pending) | `--axis-status-neutral` | 신설 | #9CA3AF | #9CA3AF (불변) |
| tool-call-card/index.tsx:40 | `--axis-color-blue-500` | 상태 아이콘 색(running) | `--axis-status-running` | 신설 | #3B82F6 | #3B82F6 (불변) |
| tool-call-card/index.tsx:49 | `--axis-color-green-500` | 상태 아이콘 색(success) | `--axis-status-success` | 신설 | #22C55E | #22C55E (불변) |
| tool-call-card/index.tsx:57 | `--axis-color-red-500` | 상태 아이콘 색(error) | `--axis-status-error` | 신설 | #EF4444 | #EF4444 (불변) |

경로는 모두 `packages/axis-agentic-ui/src/` 아래의 상대 경로입니다.

### 2.3 용도 분류

| 용도 | 해당 줄 | 대체 토큰 계열 |
|---|---|---|
| 상태 점 · 진행 막대 | agent-avatar 28~30, attachment-card 141, plan-card 138, run-progress 30~33 · 84 · 108, step-timeline 68~72, token-usage-indicator 34~36 | `status.*` |
| 상태 아이콘 · 글자 | approval-card 33 · 38 · 43, code-block 77, plan-card 61~82, recovery-banner 42, token-usage-indicator 40~41, tool-call-card 32~57 | `status.*` |
| 상태 왼쪽 색 선 · 테두리 | approval-card 32 · 37 · 42, attachment-card 86, plan-card 34~54(짝수 줄), recovery-banner 34 | `status.*`, `status.error-border` |
| 상태 뱃지 | plan-card 35 · 39 · 43 · 47 · 51 · 55 | `status.*`, `status.*-strong`, `status.neutral-bg` |
| 피드백 · 승인 · 거절 동작 | feedback-buttons 62 · 78, plan-card 179 · 195 | `status.success|error(-strong)` |
| 버튼(기존 버튼과 같은 역할) | recovery-banner 69, run-progress 163 | 기존 component `button-*` |
| diff | diff-viewer 71 · 72 · 77 · 78 · 123 · 126 | `diff.*` |
| 아바타 배경 | agent-avatar 34~36 | `agent.avatar-*` |
| 말풍선 배경 | message-bubble 30 | `agent.message-user-bg` |

### 2.4 신설 토큰 목록과 JSON 경로

`packages/axis-tokens/src/semantic/light.json`과 `dark.json`의 최상위 `icon` 다음에 `status`, `diff`, `agent` 세 범주를 추가합니다. 두 파일에 같은 경로와 같은 참조값을 넣습니다. 기존 semantic처럼 2단 구조(`범주.키`)로 둡니다. 이렇게 해야 `build-tokens.mjs`의 `resolveSemanticJson`(범주 → 키 → `value`의 2단 순회)과 형태가 맞습니다.

| JSON 경로 (light.json · dark.json 공통) | CSS 변수 | 참조값 | 값(라이트 = 다크) | 사용 줄 |
|---|---|---|---|---|
| `status.running` | `--axis-status-running` | `{color.blue.500}` | #3B82F6 | attachment-card 141, plan-card 50 · 51 · 66, run-progress 31 · 84 · 108, step-timeline 69, tool-call-card 40 |
| `status.running-strong` | `--axis-status-running-strong` | `{color.blue.600}` | #2563EB | plan-card 51 |
| `status.success` | `--axis-status-success` | `{color.green.500}` | #22C55E | agent-avatar 28, code-block 77, feedback-buttons 62, plan-card 42 · 43 · 54 · 55 · 72 · 138 · 179, run-progress 32, step-timeline 68, token-usage-indicator 36, tool-call-card 49 |
| `status.success-strong` | `--axis-status-success-strong` | `{color.green.600}` | #16A34A | plan-card 43 · 55 · 179 |
| `status.error` | `--axis-status-error` | `{color.red.500}` | #EF4444 | approval-card 42 · 43, attachment-card 86, feedback-buttons 78, plan-card 46 · 47 · 77 · 195, recovery-banner 42, run-progress 33, step-timeline 70, token-usage-indicator 34 · 40, tool-call-card 57 |
| `status.error-strong` | `--axis-status-error-strong` | `{color.red.600}` | #DC2626 | plan-card 47 |
| `status.error-border` | `--axis-status-error-border` | `{color.red.200}` | #FECACA | recovery-banner 34 |
| `status.warning` | `--axis-status-warning` | `{color.yellow.500}` | #EAB308 | agent-avatar 29, approval-card 37 · 38, plan-card 38 · 39, token-usage-indicator 35 · 41 |
| `status.warning-strong` | `--axis-status-warning-strong` | `{color.yellow.600}` | #CA8A04 | plan-card 39 |
| `status.info` | `--axis-status-info` | `{color.blue.500}` | #3B82F6 | approval-card 32 · 33 |
| `status.neutral` | `--axis-status-neutral` | `{color.gray.400}` | #9CA3AF | agent-avatar 30, plan-card 34 · 61 · 82, tool-call-card 32 |
| `status.neutral-muted` | `--axis-status-neutral-muted` | `{color.gray.300}` | #D1D5DB | run-progress 30, step-timeline 71 · 72 |
| `status.neutral-strong` | `--axis-status-neutral-strong` | `{color.gray.600}` | #4B5563 | plan-card 35 |
| `status.neutral-bg` | `--axis-status-neutral-bg` | `{color.gray.100}` | #F3F4F6 | plan-card 35 |
| `diff.added` | `--axis-diff-added` | `{color.green.500}` | #22C55E | diff-viewer 71 · 123 |
| `diff.removed` | `--axis-diff-removed` | `{color.red.500}` | #EF4444 | diff-viewer 72 · 126 |
| `diff.added-text` | `--axis-diff-added-text` | `{color.green.600}` | #16A34A | diff-viewer 77 |
| `diff.removed-text` | `--axis-diff-removed-text` | `{color.red.600}` | #DC2626 | diff-viewer 78 |
| `agent.avatar-assistant` | `--axis-agent-avatar-assistant` | `{color.purple.500}` | #A855F7 | agent-avatar 34 |
| `agent.avatar-tool` | `--axis-agent-avatar-tool` | `{color.blue.500}` | #3B82F6 | agent-avatar 35 |
| `agent.avatar-system` | `--axis-agent-avatar-system` | `{color.gray.600}` | #4B5563 | agent-avatar 36 |
| `agent.message-user-bg` | `--axis-agent-message-user-bg` | `{color.blue.500}` | #3B82F6 | message-bubble 30 |

이 토큰 작업에 딸린 빌드 변경은 다음과 같습니다.
- `build-tokens.mjs`의 `typescript/axis-declarations` 포맷은 범주 이름(`surface` · `text` · `border` · `icon` · `button` 등)을 하드코딩합니다. 그래서 `status` · `diff` · `agent`를 그 선언에 함께 추가해야 `dist/js/tokens.d.ts` 타입이 실제 값과 맞습니다.
- 신설 이름 `--axis-status-*` · `--axis-diff-*` · `--axis-agent-*`와 겹치는 기존 정의나 참조는 소스(`packages` · `apps`)에 없습니다.
- 신설 토큰은 반드시 2단(`범주.키`)으로 넣습니다. 2단을 넘으면 `resolveSemanticJson`이 `token.value`를 읽지 못해 `undefined`를 만듭니다. 이 결과는 shadcn-compat 생성에만 쓰여 화면 영향은 없지만, 산출물이 깨집니다.

소스 교체 뒤에는 git이 추적하는 생성 사본도 함께 갱신해야 합니다. `pnpm build`는 이 사본에 닿지 않습니다.

| 사본 경로 | 생성 절차 | 현재 primitive 참조 |
|---|---|---|
| `packages/axis-agentic-ui/registry/r` | `pnpm build:registry`(`scripts/build-registry.mjs`가 `src/<comp>/index.tsx`를 복사) | 13개 파일, 80건 |
| `public/r` | 같은 스크립트의 배포 대상(`DEPLOY_DIRS`) | 13개 파일, 80건 |
| `apps/web/public/r` | 같은 스크립트의 배포 대상(`DEPLOY_DIRS`) | 13개 파일, 80건 |
| `apps/web/public/library` | axis-cli `publisher.ts`의 기본 출력 경로 | 7개 파일(components 6개 + `categories/agentic.json`), 66건 |

레지스트리 사본을 재생성하지 않으면 CLI·레지스트리로 설치하는 사용자는 primitive 참조 코드를 계속 받습니다. 라이브러리 사본은 axis-cli 명령으로 다시 내보내야 하며, 정확한 명령과 대상 범위는 구현 단계에서 확인합니다(미검증).

### 2.5 결정 필요

> 2026-10-15 결정: D-1 ~ D-4는 이 절의 제안대로 확정합니다. D-5는 버튼 4곳만 M1에서 button-text 토큰으로 바꾸고, 나머지 짝 토큰은 M3에서 만듭니다.

- **D-1 기존 semantic 재사용 여부**: 라이트 값이 같은 기존 토큰으로 `icon.success`(라이트 #22C55E / 다크 #4ADE80), `border.error`(#EF4444 / #F87171), `surface.brand`(#3B82F6 / #2563EB) 등이 있습니다. 재사용하면 신설 수가 줄지만 다크 화면이 바뀌어 3.2 하위 호환 원칙을 어깁니다. 이 절은 원칙대로 신설안을 기본으로 둡니다. 다크 변화를 받아들이고 재사용할지 정해야 합니다.
- **D-2 토큰 이름 체계**: 접미사 `-strong`(600 단계), `-muted`, `-bg`, `-border`, `neutral` 범주, 그리고 PRD 예시 `agent.avatar-bg` 하나 대신 `avatar-assistant|tool|system` 세 개로 나눈 안을 확정해야 합니다. 말풍선을 `agent.message-user-bg`로 둘지 별도 `message` 범주로 둘지도 함께 정해야 합니다.
- **D-3 `status.info`와 `status.running` 분리**: 두 토큰은 지금 값이 같습니다(blue-500). 브랜드가 실행 중 색과 정보 색을 따로 줄 수 있게 분리안을 제안합니다. 하나로 합칠지 정해야 합니다.
- **D-4 diff를 status 별칭으로 둘지**: Style Dictionary가 참조를 hex로 풀어서 내보냅니다(예: `--axis-icon-success: #22C55E`). 그래서 `diff.added`를 `{status.success}`로 적어도 CSS에서는 연쇄되지 않고, 브랜드는 두 변수를 각각 덮어써야 합니다. 이 절은 primitive를 직접 참조하는 안을 제안합니다.
- **D-5 `text-white` 하드코딩 짝**: 다음 두 줄은 배경을 기존 버튼 토큰으로 바꾸지만 글자는 `text-white` 그대로입니다.
  - run-progress 163, recovery-banner 69
  - ontology 프리셋은 버튼 배경을 #15C7C7로, 위험 버튼 배경을 라이트 #FDE8E8로 바꾸면서 글자 토큰도 #0F1724 · #C92C2C로 바꿉니다. 흰 글자가 그대로 남으면 대비가 무너집니다.
  - 같은 문제가 approval-card 67 · 70에 이미 있습니다.
  - `--axis-button-text-default` · `--axis-button-destructive-text-default`는 기본값이 #FFFFFF이므로, 글자도 이 토큰으로 바꿔도 기본 화면은 그대로입니다. 이 교체를 FR-2 범위에 넣을지 정해야 합니다.
  - 신설 토큰 배경 위에 흰 글자·아이콘이 고정된 줄도 같은 문제를 갖습니다. message-bubble 30, plan-card 179, step-timeline 76(68행 `status.success` 점 위 체크 아이콘), run-progress 127(30~33행 `statusColors` 원 위 번호·아이콘), agent-avatar 80(34~36행 `typeColors` 위 이니셜)입니다.
  - 이 줄들에 짝 토큰(예: `agent.message-user-text`, `status.*-contrast`, `agent.avatar-text`)을 신설할지도 정해야 합니다. AC2는 `--axis-color-`만 검사하므로 이 항목은 AC로 잡히지 않습니다.
- **D-6 ontology 프리셋 값**: 초안 `axis-theme-ontology.css`에는 신설 22개 토큰의 값이 없습니다. 보완하지 않으면 `data-brand="ontology"`에서 agentic-ui 상태색이 AXIS 기본값으로 남습니다. FR-8에서 초안에 값을 추가할지 정해야 하고, 추가한다면 라이트 AA 보정 대상에 넣을지도 정해야 합니다.
- **D-7 primitive 오버라이드 안내 문서**: `docs/guides/theme-customization.md` 92~97행과 `docs/guides/component-usage.md` 175행은 `:root { --axis-color-blue-500: ... }` 오버라이드로 브랜드 색을 바꾸라고 안내합니다. semantic·component 토큰은 hex로 풀려 나가므로 지금 이 오버라이드가 닿는 곳은 primitive를 직접 참조하는 agentic-ui뿐입니다. FR-2 이후에는 agentic-ui 상태색·말풍선·아바타가 이 오버라이드를 따르지 않습니다. 3.2 하위 호환(브랜드 미지정 시 계산값 동일)에는 걸리지 않지만 사용자 오버라이드 동작이 바뀝니다. 릴리스 노트에 적을지, 가이드를 고칠지(FR-10 테마 문서 작업과 묶을지) 정해야 합니다.

### 실측 근거

- `grep -rnoE 'var\(--axis-color-[a-z0-9-]+' packages/axis-agentic-ui/src`: 80건이 나왔습니다. `grep -rlE` 기준 13개 파일, `grep -rnE ... | wc -l` 기준 68줄입니다. `var(` 없이 `--axis-color-`를 쓰는 줄은 0건입니다. 같은 패턴으로 `node_modules` · `dist`를 뺀 소스만 셌습니다.
- `grep -rhoE ... | sort | uniq -c`: primitive 14종이 나왔고 건수는 blue-500 14, blue-600 2, gray-100 1, gray-300 3, gray-400 5, gray-600 2, green-500 17, green-600 4, purple-500 1, red-200 1, red-500 19, red-600 3, yellow-500 7, yellow-600 1입니다.
- 파일별 건수(`grep -oE ... | wc -l`)는 plan-card 28, run-progress 8, agent-avatar 6, approval-card 6, diff-viewer 6, step-timeline 5, token-usage-indicator 5, recovery-banner 4, feedback-buttons 4, tool-call-card 4, attachment-card 2, code-block 1, message-bubble 1입니다. 모두 `index.tsx`이고 테스트 파일에서는 나오지 않았습니다.
- `grep -nE '^(:root|\.dark) \{' packages/axis-tokens/dist/css/variables.css`: `:root`는 7행, `.dark`는 233행에서 시작합니다. 14종 primitive를 하나씩 grep해 보니 모두 두 블록에 같은 hex로 있었습니다(예: green-500은 37행과 263행 모두 #22C55E).
- `packages/axis-tokens/build-tokens.mjs`를 열람했습니다.
  - `sdDark`의 source는 `src/primitives/**/*.json`과 `src/semantic/dark.json`입니다. component는 빠져 있습니다.
  - CSS 이름은 `cssVarName(path)`가 정하며 `--axis-` 뒤에 경로를 `-`로 이어 붙입니다.
  - `typescript/axis-declarations`는 범주를 하드코딩합니다.
  - `resolveSemanticJson`은 2단으로 순회합니다(`entries` → `token.value`).
  - `css/axis-variables` 포맷은 `token.value`(이미 풀린 값)를 출력하고 `outputReferences`를 쓰지 않습니다(파일 내 0건). D-4의 '참조가 hex로 풀린다'는 근거입니다.
- `grep -nE -- '--axis-(button-bg-default|button-bg-hover|button-destructive-bg-default|button-destructive-bg-hover):' variables.css`: 186 · 187 · 202 · 203행(#3B82F6 · #2563EB · #EF4444 · #DC2626)에서만 나왔습니다. 모두 `.dark` 시작(233행)보다 앞이므로 다크 블록에는 없습니다.
- 같은 파일에서 `--axis-icon-success`는 183행 #22C55E / 409행 #4ADE80입니다. `--axis-border-error`는 177행 #EF4444 / 403행 #F87171, `--axis-surface-brand`는 160행 #3B82F6 / 386행 #2563EB입니다. 그래서 다크 값이 맞지 않습니다.
- `ls -l --time-style=full-iso`: dist `variables.css`의 수정 시각(2026-10-15)이 소스 json(2026-02-26)보다 뒤입니다. `git log -1 -- src`는 2026-08-07입니다. dist 값을 소스와 같은 기준으로 참고했습니다.
- `src/semantic/light.json` · `dark.json`(각 40줄)과 `src/component/components.json`(107줄)을 열람했습니다. 최상위 범주는 semantic이 `surface` · `text` · `border` · `icon`이고, component가 `button` · `button-secondary` · `button-ghost` · `button-destructive` · `input` · `card` · `badge` · `dialog`입니다.
- `grep -rnoE -- '--axis-(status|diff|agent|...)' packages apps`(`node_modules` 제외): 신설 이름과 겹치는 정의나 참조는 0건입니다. 걸린 것은 `--axis-interactive-primary`(FR-1 대상)뿐입니다.
- `grep -nE -- '--axis-(status|diff|agent|color)' docs/workitems/WI-0025-brand-theme/axis-theme-ontology.css`: 0건이 나왔습니다. 같은 파일에서 `--axis-button-text-default`는 #0F1724, `--axis-button-destructive-bg-default`는 라이트 #FDE8E8 / 다크 #3D1C1F, `--axis-button-destructive-text-default`는 #C92C2C / #F28B8B입니다.
- `grep -rn 'text-white' packages/axis-agentic-ui/src --include=*.tsx`: 7개 파일, 9줄에서 나왔습니다. 그중 이 매핑과 맞물리는 줄은 run-progress 127 · 163, recovery-banner 69, plan-card 179, message-bubble 30, step-timeline 76, agent-avatar 80이고, 같은 문제가 이미 있는 줄은 approval-card 67 · 70입니다.
- `grep -rhoE 'var\(--axis-color-[a-z0-9-]+' <dir> | wc -l`: `packages/axis-agentic-ui/registry/r` · `public/r` · `apps/web/public/r`는 각각 13개 파일 80건, `apps/web/public/library`는 7개 파일 66건입니다. `scripts/build-registry.mjs`의 `DEPLOY_DIRS`는 `public/r` · `apps/web/public/r`이고, `packages/axis-cli/src/library/publisher.ts`의 기본 출력은 `apps/web/public/library`입니다.
- 미검증: Tailwind 불투명도 수식어(`/10` · `/30`)가 `var()` 임의값에서 실제로 어떤 CSS를 만드는지는 빌드 산출물로 확인하지 않았습니다. 다만 변수 이름만 바꾸므로 교체 전후 결과는 같습니다.

---

## 3. M2 브랜드 빌드 · ThemeProvider 설계

> 전제: 이 절은 M2(FR-4~6)만 다룹니다. 온톨로지 실제 값(`brands/ontology/*`)은 M3에서, 문서와 데모는 M4에서 다룹니다. 줄 번호는 `042b3b0` 기준입니다(`docs/wi-0025-start` 브랜치, M1 미반영 상태).

### 3.1 현재 토큰 빌드 파이프라인 (`packages/axis-tokens/build-tokens.mjs`, 335줄)

| 단계 | 줄 | 내용 | 브랜드 설계에 주는 제약 |
|---|---|---|---|
| 포맷 등록 | 39-60 | `css/axis-variables`(`:root`)와 `css/axis-variables-dark`(`.dark`)를 등록합니다. 선택자가 포맷 안에 고정되어 있습니다 | 브랜드 선택자를 쓰려면 선택자를 옵션으로 받는 포맷을 새로 등록해야 합니다 |
| 변수명 | 34-36 | `cssVarName(path)` = `--axis-` + 경로를 `-`로 이은 이름입니다. 세그먼트 안의 `.`도 `-`로 바꿉니다 | `plan-card.accent.width`와 `plan-card.accent-width`가 같은 이름이 됩니다. 경로와 함께 변수명도 비교해야 합니다 |
| Light 빌드 | 131-174 | 입력은 `src/primitives/**/*.json` + `src/semantic/light.json` + `src/component/**/*.json`입니다. 출력은 `dist/css/_light.css`, `dist/js/tokens.{mjs,js,d.ts}`, `dist/json/tokens.json`입니다 | |
| Dark 빌드 | 177-192 | 입력은 primitives + `src/semantic/dark.json`입니다. **component 토큰은 넣지 않습니다**(176줄 주석) | 기본 다크에서 component 토큰은 라이트 값 그대로입니다. 브랜드 다크는 component 토큰을 직접 덮어써야 합니다 |
| 결합 | 204-225 | `_light.css`와 `_dark.css`를 합쳐 `dist/css/variables.css`를 만들고 임시 파일을 지웁니다 | |
| shadcn 해석 | 230-263 | JSON을 직접 읽고 `colors.json`으로만 참조를 풉니다. `resolveSemanticJson`은 `카테고리 → 키` 2단계만 처리합니다(255-256줄) | 3단계 항목은 예외 없이 조용히 무시됩니다(`token.value`가 undefined라 `resolveRef`가 undefined를 돌려줌). `buildShadcnVars`가 읽는 `surface` · `text` · `border`를 3단계로 바꿀 때만 shadcn 값이 `0 0% 0%`로 떨어집니다(3.5 표 참고) |
| (미사용) `build-tokens.js` | - | SD v3 `formatter` API와 `require`를 쓰는 구판 스크립트로, 초기 커밋 `f57de7d` 이후 그대로 남아 있습니다. `package.json` build 스크립트는 `.mjs`만 실행합니다 | 이름이 비슷해 잘못 고칠 위험이 있습니다. M2 변경은 `build-tokens.mjs`에만 넣고 이 파일은 무시합니다 |
| shadcn 생성 | 274-302, 304-333 | `--primary` = `text.primary`(282줄), `--radius: 0.5rem` 고정(295줄)입니다. `:root`와 `.dark` 두 블록을 `dist/css/shadcn-compat.css`에 씁니다 | 초안의 shadcn 값(`--primary` = 민트, `--card` ≠ `--background`, `--radius: 12px`)은 이 매핑에서 나오지 않습니다. 브랜드가 shadcn 값을 직접 지정해야 합니다 |

### 3.2 빌드 변경 설계 (FR-4 · FR-5)

**원칙**: 기존 1~4단계(131-333줄)는 한 줄도 바꾸지 않습니다. 브랜드 처리는 333줄 다음에 5단계로 덧붙입니다. 이렇게 하면 `variables.css`와 `shadcn-compat.css`가 바이트 단위로 그대로 남습니다. AC3과 번들 크기 요구(브랜드 값은 `variables.css`에 넣지 않음)를 구조로 보장하는 셈입니다. 검증은 M2 적용 전후에 두 파일의 `sha256sum`이 같은지 비교해서 합니다.

**소스 구조 (FR-4)**

```
packages/axis-tokens/src/brands/<brand>/
├── light.json   # 덮어쓸 토큰만. 최상위 예약 키 "shadcn" 에 HSL 호환 층 값
├── dark.json    # 같은 형식
└── brand.json   # { name, description, themes: ["light","dark"], a11y: { status, checkedAt, gate } }
```

**변경 지점**

| # | 위치 | 변경 |
|---|---|---|
| B0 | `build-tokens.mjs` 34-36줄(`cssVarName`) | 이 함수를 B2의 `scripts/brands.mjs`에서도 써야 합니다(V6 · `collectBasePaths`). 하지만 `build-tokens.mjs`는 최상위 await 스크립트라(197줄 `await sdLight.buildAllPlatforms()`) import할 수 없습니다. 함수를 `brands.mjs`로 옮기고 `build-tokens.mjs`가 import하게 할지(34-36줄 수정, 산출물 sha는 불변이어야 함), 복제할지(복제본 드리프트 위험) 정해야 합니다(결정 필요 10) |
| B1 | `build-tokens.mjs` 60줄 다음 | 포맷 `css/axis-brand`를 등록합니다. `file.options.selector`를 받아 `${selector} {\n...\n}` 블록을 만들고, 변수명은 기존 `cssVarName`을 그대로 씁니다 |
| B2 | 신규 `packages/axis-tokens/scripts/brands.mjs` | 순수 함수 모듈입니다. 함수는 `listBrands(dir)`, `loadBrand(dir, name)`(JSON 읽기, `shadcn` 키 분리), `collectBasePaths()`(기본 경로 집합 · 변수명 집합 · 허용 범위), `validateBrand(brand, base)`(3.3의 V1~V8, 위반 목록 반환), `renderShadcnBlock(map)`, `brandSelectors(name)`입니다. 파일을 쓰지 않으므로 바로 단위 테스트할 수 있습니다. `build-tokens.mjs`는 최상위 await 스크립트라 import하는 순간 빌드가 실행되므로 따로 분리합니다 |
| B3 | `build-tokens.mjs` 333줄 다음(5단계) | 브랜드마다 다음을 실행합니다. ① `validateBrand`에서 위반이 나오면 목록을 출력하고 `process.exit(1)`로 끝냅니다. ② `shadcn` 키를 뺀 토큰 JSON을 `dist/.tmp/brands/<brand>/{light,dark}.json`에 씁니다. ③ SD 인스턴스를 둘 만듭니다. Light용 입력은 primitives + `semantic/light.json` + component + 임시 light이고, Dark용 입력은 primitives + `semantic/dark.json` + **component** + 임시 dark입니다. 기본 Dark 빌드와 달리 component를 넣는 이유는 V5가 component 경로 참조를 허용하므로 그런 참조가 풀리게 하기 위해서입니다. 현재 component 토큰은 primitive(`{color.*}`)만 참조하므로 넣어도 무해합니다. 두 인스턴스의 css 플랫폼은 기존 빌드와 같은 `transformGroup: 'css'`를 씁니다. 값 변환이 기본 빌드와 같아야 sha 비교와 V6 비교가 성립합니다. 두 인스턴스 모두 `filter: t => brandPaths.has(t.path.join('.'))`로 브랜드 파일에 적힌 토큰만 냅니다. ④ 라이트 블록(`--axis-*` + shadcn light)과 다크 블록(`--axis-*` + shadcn dark)을 이어 `dist/css/brands/<brand>.css`에 씁니다. ⑤ `src/brands/<brand>/brand.json`을 `dist/brands/<brand>/brand.json`으로 복사합니다. ⑥ `dist/.tmp`를 지웁니다. V 검사를 통과한 뒤 ②~⑤에서 실패하면 ⑥이 실행되지 않아 임시 파일이 남고, `files: ["dist"]` 때문에 pack 산출물에 들어갈 수 있습니다. 따라서 ②~⑤를 try/finally로 감싸 정리하거나, 임시 파일을 dist 밖(`os.tmpdir()`)에 씁니다(결정 필요 11) |
| B4 | B3의 SD 인스턴스 | `log: { verbosity: 'silent' }`로 둡니다. 브랜드가 덮어쓸 때마다 SD는 "Token collisions detected"를 내는데, 같은 검사를 V3가 이미 하므로 경고를 끕니다 |
| B5 | `packages/axis-tokens/package.json` `exports`(8-22줄) | M2는 아래 항목 추가 규칙과 누락 검사만 구현하고, `ontology` 항목의 실제 추가는 소스가 생기는 M3에서 합니다. `"./css/brands/ontology": "./dist/css/brands/ontology.css"`와 `"./brands/ontology/brand.json": "./dist/brands/ontology/brand.json"`을 추가합니다(명시형, 결정 필요 1). `files: ["dist"]`(26-28줄)는 그대로 두어도 dist 아래 파일이라 배포본에 들어갑니다. 5단계에서 `src/brands/*`마다 exports 항목이 있는지 확인하고, 없으면 빌드를 실패시킵니다 |
| B6 | `packages/axis-tokens/package.json` `scripts`(32-36줄) | `"test": "node --test test/brands.test.mjs"`를 추가합니다. 파일 경로를 명시합니다. 디렉터리 인자 `node --test test/`는 Node v22.22.0에서 디렉터리를 모듈로 해석해 `Cannot find module` · `# fail 1`로 실패하고, 글롭은 Node 21 이상에서만 지원되기 때문입니다. CI(`frontend.yml`)는 Node 20, publish(`publish.yml`)는 Node 22라 버전이 다릅니다. Node 20 동작은 이 머신에 Node 20이 없어 실측하지 못했습니다(결정 필요 12). 지금 tokens 패키지에는 `test` 스크립트도 테스트 파일도 없습니다 |

**선택자 규칙 (FR-5)**: `brandSelectors(name)`이 만듭니다.
- 라이트: `[data-brand="<b>"]`
- 다크: `[data-brand="<b>"].dark`, `[data-brand="<b>"][data-theme="dark"]`, `.dark [data-brand="<b>"]`. PRD FR-5 기준으로는 3개입니다. 초안 CSS는 `[data-theme="dark"] [data-brand="<b>"]`까지 넣어 4개라서 결정 필요 4로 올렸습니다.
- 명시도: 라이트 블록은 (0,1,0)이고 기본 `.dark`도 (0,1,0)입니다. 따라서 브랜드 CSS를 `variables.css` 뒤에 import해야 라이트 블록이 기본값을 이깁니다. `shadcn-compat.css`의 `:root` · `.dark`(같은 (0,1,0), 295줄 `--radius` 포함)도 같은 상대이므로 그 파일보다도 뒤에 와야 합니다. 소비자가 직접 shadcn 변수를 정의하는 경우도 같습니다. 예를 들어 `apps/web/src/app/globals.css` 5-31줄은 Tailwind 3 `@layer base` 안의 `:root` · `.dark`에서 `--background` · `--radius` 등을 정의하므로 M4 데모에 영향을 줍니다(결정 필요 13). 다크 블록은 (0,2,0)이라 순서와 상관없이 라이트 블록을 이깁니다. 같은 이유로, 라이트에만 있고 다크에 없는 **색** 키는 다크 화면에서 기본 `.dark` 값을 덮어 버립니다. 이 경우는 V7로 막습니다.

**SD 동작 실측(스크래치패드 실험, style-dictionary 4.4.0)**: 기본 소스 뒤에 브랜드 파일을 마지막 소스로 넣으면 같은 경로에서는 브랜드 값이 이깁니다. 브랜드 경로로 거르면 브랜드 토큰 3개만 출력됩니다. 반대로 **기본에 없는 경로(`surface.nonexistent`)는 경고 없이 rc 0으로 통과하고 새 변수 `--axis-surface-nonexistent`가 출력**됩니다. 따라서 경로 검증은 SD에 맡길 수 없고 V3로 직접 해야 합니다.

### 3.3 브랜드 JSON 검증 규칙

검증에 쓰는 집합은 목록으로 복제하지 않고 빌드할 때 소스 파일에서 직접 읽습니다. 그래야 M1이 semantic 토큰(FR-1 `interactive.primary`, FR-2 `status.*` 등)을 추가해도 따로 고치지 않고 허용 범위에 들어옵니다.

| # | 규칙 | 위반 예 | 근거 |
|---|---|---|---|
| V1 | 디렉터리 이름이 kebab-case `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`여야 합니다 | `Ontology`, `onto_logy` | FR-4 |
| V2 | `light.json` · `dark.json` · `brand.json`이 모두 있어야 합니다. `brand.json.name`은 디렉터리 이름과 같아야 하고, `themes`는 실제 파일과 맞아야 합니다 | `name: "onto"` | D6 |
| V3 | 모든 leaf 경로가 **기본 집합**(primitives + `semantic/light.json` + component)에 이미 있어야 합니다. 없는 경로는 거부합니다 | `surface.nonexistent`, 현재 소스 기준 `bg.muted` · `shadow.sm` · `plan-card.accent.width` | 3.2 실측 |
| V4 | 최상위 범위를 제한합니다. 허용 범위는 semantic 카테고리(`semantic/light.json` 최상위 키), component 카테고리(`components.json` 최상위 키), primitive 허용 목록 `radius.*` · `font.family.*` · `shadow.*`의 합집합입니다. `color.*` · `space.*` · `font.size|weight|lineHeight.*`는 거부합니다 | `color.blue.500` 덮어쓰기 | FR-4, 1.2 primitive 직접 참조 결함 |
| V5 | leaf는 `{ "value": string }` 형태여야 합니다. 참조(`{a.b}`)는 기본 집합에 있는 경로만 가리킬 수 있습니다 | `{color.teal.500}` | |
| V6 | 브랜드 경로를 `cssVarName`으로 바꾼 이름이 기본 변수명 집합에 있어야 합니다. 한 파일 안에서 서로 다른 경로가 같은 변수명을 만들어서도 안 됩니다 | `plan-card.accent-width`와 `plan-card.accent.width` 동시 사용 | 34-36줄 |
| V7 | 짝 맞춤: `light.json`의 색 값 키(hex · rgb · hsl · `{color.*}` 참조)와 `shadcn` 키(`radius` 제외)는 `dark.json`에도 있어야 합니다. `radius.*` · `font.family.*` · `shadow.*`와 색이 아닌 값은 라이트에만 있어도 됩니다 | 라이트에만 `text.primary` | 3.2 명시도 |
| V8 | `shadcn` 키는 `buildShadcnVars`(276-300줄)가 내는 25개 이름(`background` … `chart-5`, `radius` 포함) 안에서만 쓸 수 있습니다. 값 규칙은 키별로 나눕니다. `radius`는 CSS 길이(px · rem)로 검사하고, 나머지 24개 색 키만 HSL 삼중값 `^\d{1,3} \d{1,3}% \d{1,3}%$` 또는 6자리 hex로 검사합니다(`hexToHsl` 6-29줄이 6자리만 처리합니다) | `--sidebar`, `#FFF`, `radius: "0 0% 0%"` | 기본 `--radius: 0.5rem`(295줄), 초안 `--radius: 12px`(17줄) |

V8의 25개 이름을 복제하지 않으려면 276-300줄의 이름을 상수 배열로 빼야 합니다. 그러면 기존 4단계 코드를 건드리게 되므로, 리팩터링 전후 `shadcn-compat.css`의 `sha256sum`이 같다는 조건에서만 리팩터링합니다.

**초안 CSS를 이 규칙에 대 본 결과**: 초안의 `--axis-*` 변수는 고유 75개입니다. 그중 현재 소스에 없는 이름은 `--axis-bg-muted` · `--axis-plan-card-accent-width` · `--axis-shadow-lg` · `--axis-shadow-sm` 4개입니다. `bg-muted`는 M1(FR-1)에서, 나머지 셋은 M3(FR-7 · FR-9)에서 기본 토큰으로 생기므로 순서를 지키면 V3를 통과합니다. 라이트에만 있는 키는 9개(`font-family-sans|mono`, `radius-sm|md|lg`, `shadow-sm|lg`, `plan-card-accent-width`, `--radius`)이고, 모두 테마와 무관한 값이라 V7을 통과합니다. `--radius: 12px`(17줄)는 길이 값이라 V8의 `radius` 길이 규칙으로 통과합니다(색 형식 규칙을 모든 키에 적용하면 여기서 빌드가 실패합니다). 다크에만 있는 키는 없습니다. 초안 마지막 줄의 `word-break` 규칙(221줄)은 토큰이 아니라서 JSON으로 옮길 수 없습니다(결정 필요 5).

### 3.4 `ThemeProvider` brand 설계 (FR-6, `packages/axis-theme/src/index.ts` 116줄)

| 위치 | 변경 |
|---|---|
| `ThemeProviderProps` 11-18줄 | `defaultBrand?: string`, `brandStorageKey?: string`(기본 `"axis-brand"`)를 추가합니다 |
| `ThemeContextValue` 20-27줄 | `brand: string \| undefined`, `setBrand: (brand: string \| undefined) => void`를 추가합니다 |
| 37줄 다음(신규 헬퍼) | `readBrand(key)`와 `writeBrand(key, value)`를 둡니다. `typeof window === "undefined"` 가드와 try/catch를 넣어, 사생활 보호 모드처럼 `localStorage`가 예외를 던지는 경우에 대비합니다. 빈 문자열은 `undefined`로 봅니다. 기존 theme 저장 코드(50 · 87줄)는 동작 불변 요구에 따라 고치지 않습니다 |
| 55줄 다음(상태) | `useState(() => typeof window === "undefined" ? defaultBrand : readBrand(brandStorageKey) ?? defaultBrand)`. 저장값이 기본값보다 우선합니다(theme 49-50줄과 같은 규칙) |
| 66줄 다음(신규 effect) | `[brand]`에 의존하는 effect를 따로 둡니다. 값이 있으면 `documentElement.setAttribute("data-brand", brand)`를, 없으면 `removeAttribute`를 호출합니다. theme effect(57-66줄)와 시스템 감지 effect(68-83줄)는 건드리지 않으므로 theme 동작은 그대로입니다 |
| 91줄 다음 | `setBrand = useCallback((b) => { writeBrand(brandStorageKey, b); setBrandState(b || undefined); }, [brandStorageKey])`. 값이 `undefined`이면 `removeItem`을 씁니다(결정 필요 6) |
| `value` 93-96줄 | `brand`와 `setBrand`를 넣고 deps에도 추가합니다 |
| 116줄 | 타입 export는 그대로 둡니다. 필요하면 `type Brand = string`을 추가합니다 |

**SSR 안전성**: 서버 렌더 중에는 `document`와 `localStorage`에 접근하지 않습니다(초기화 함수의 window 가드). 클라이언트 첫 렌더에서는 초기화 함수가 `readBrand`로 `localStorage`를 읽지만 마크업에 반영하지 않으므로 hydration 불일치는 없습니다(기존 theme 초기화 48-51줄도 같은 구조입니다). DOM 조작은 effect 안에서만 합니다. 서버 HTML에는 `data-brand`가 없고 hydration 뒤 effect에서 붙기 때문에, 첫 화면이 기본 브랜드로 잠깐 보일 수 있습니다(FOUC). 기존 theme 클래스도 같은 구조입니다. 이를 막는 인라인 스크립트를 제공할지는 결정 필요 7입니다. `brand`는 마크업이 아니라 속성만 바꾸므로, 소비자가 `brand` 값을 직접 렌더하지 않는 한 hydration 불일치는 생기지 않습니다.

**테스트**: 테스트 파일은 이미 있습니다. `packages/axis-theme/src/theme.test.tsx`(301줄, `it` 21개: ThemeProvider 9 · useTheme 9 · 시스템 감지 3)이고, vitest jsdom 환경에 `include: src/**/*.test.{ts,tsx}` 설정입니다. 추가할 내용은 다음과 같습니다.
- `beforeEach`(28-38줄)에 `removeAttribute("data-brand")`를 추가합니다.
- 새 `describe("brand")`에 다음 경우를 넣습니다.
  - defaultBrand를 주면 `data-brand`가 붙습니다(AC5).
  - 지정하지 않으면 속성이 없습니다.
  - `setBrand("ontology")`를 호출하면 속성과 `localStorage["axis-brand"]`가 생깁니다.
  - `setBrand(undefined)`를 호출하면 속성과 저장값이 지워집니다.
  - 저장값이 있으면 복원됩니다.
  - 커스텀 `brandStorageKey`가 동작합니다.
  - `setTheme`은 `data-brand`를 건드리지 않습니다(회귀).
- SSR: 새 파일 `src/theme.ssr.test.tsx`에 `// @vitest-environment node`를 두고, `react-dom/server`의 `renderToString`이 예외 없이 끝나는지 확인합니다. react-dom 18.3.1이 이미 devDependency에 있습니다.
- tokens 쪽: 신규 `packages/axis-tokens/test/brands.test.mjs`(`node --test test/brands.test.mjs`, B6 참고)에서 `scripts/brands.mjs` 순수 함수에 V1~V8 양성 · 음성 fixture를 넣습니다. fixture는 `test/fixtures/brands/`에 둡니다(`src/brands/`에 두면 배포됩니다). turbo `test` 작업은 `dependsOn`이 없어 빌드 전에 돌 수 있으므로, dist를 읽지 않는 테스트로만 구성합니다. 산출 파일이 실제로 생기는지(AC4)는 `publish.yml`의 `pnpm pack-smoke`가 확인합니다. 이 스크립트는 exports 타깃이 실제로 있는지 검사합니다(`scripts/pack-smoke.mjs` 75-84줄).

### 3.5 M1(1.2.1)과 같은 파일을 건드리는 지점

| 파일 | M1(트랙 A) | M2 | 충돌 형태 · 대응 |
|---|---|---|---|
| `packages/axis-tokens/src/semantic/{light,dark}.json` | 토큰 추가(FR-1 `interactive.primary`, FR-2 `status.*` · `diff.*` · `agent.*`) | 수정하지 않습니다. V3 · V4가 키를 읽습니다 | 텍스트 충돌은 없지만 좁은 **논리 의존**이 있습니다. M1이 새 카테고리(`status.*` · `diff.*` · `agent.*`)를 3단계로 넣어도 `resolveSemanticJson`(255-256줄)은 그 항목을 조용히 무시하고, `buildShadcnVars`가 `surface` · `text` · `border`만 읽으므로 `shadcn-compat.css`는 바뀌지 않습니다. M1이 `surface` · `text` · `border` 자체를 3단계로 바꿀 때만 shadcn 값이 `0 0% 0%`로 떨어지므로, 그 경우에만 함수를 함께 고쳐야 합니다 |
| `packages/axis-tokens/src/component/components.json` | `bg-muted` 처리 방식(FR-1)에 따라 수정할 수 있음 | 수정하지 않습니다 | 논리 의존입니다. M1이 `bg-muted`를 정의하지 않고 컴포넌트 쪽 교체로 끝내면, M3에서 초안의 `--axis-bg-muted` 줄이 V3에 걸립니다. 그 경우 초안에서 이 줄을 빼야 합니다 |
| `packages/axis-tokens/build-tokens.mjs` | FR-3 참조 검사를 빌드에 넣으면 수정 | 60줄 다음과 333줄 다음에 추가. B0에서 이동을 고르면 34-36줄도 수정 | M1은 FR-3을 별도 스크립트(예: `scripts/check-token-refs.mjs`)로 두고 이 파일은 건드리지 않기를 권합니다 |
| `packages/axis-tokens/package.json` | 릴리스 PR이 `version`(3줄)을 바꿉니다 | `exports`(8-22줄), `scripts`(32-36줄) | 서로 다른 hunk라 위험이 낮습니다. M2 브랜치는 1.2.1 릴리스 뒤에 rebase합니다 |
| `packages/axis-theme/src/index.ts` · `theme.test.tsx` | 없음(D5는 버전만 올림) | 주 변경 | 없음 |
| `packages/axis-theme/package.json` · `CHANGELOG.md` | 릴리스 PR이 1.2.1로 갱신 | 없음(1.3.0 릴리스 때 갱신) | 없음 |
| `scripts/pack-smoke.mjs` | 없음 | 패턴 exports를 고를 때만 77줄 수정 | 결정 필요 1 |
| `.github/workflows/frontend.yml` | FR-3 CI 단계 추가 | 없음. `pnpm test`(= `turbo run test`)가 tokens `test`를 실행할 것으로 봅니다 | 미검증 축: 이 워크플로는 Node 20인데 이 머신에 Node 20이 없어 tokens `test`가 실제로 도는지 확인하지 못했습니다(B6) |
| `.changeset/*.md` | patch, 4개 패키지 | minor | 파일 충돌은 없지만 **순서 충돌**이 있습니다(3.6) |
| `axis-ui-react` · `axis-agentic-ui` 소스 | 주 변경 | 없음 | 없음(M3에서 Card · Dialog · PlanCard를 수정) |
| `docs/workitems/WI-0025-brand-theme/{plan,todo}.md`, `project-todo.md` | 갱신 | 갱신 | 문서 충돌이 생깁니다. 한 번에 한 브랜치에서만 갱신합니다 |

### 3.6 changesets 운영 절차 (1.2.1 → 1.3.0)

**설정 실측** (`.changeset/config.json`): `linked: [[tokens, ui-react, agentic-ui, theme]]`, `updateInternalDependencies: "patch"`, `baseBranch: "main"`, `commit: false`, `ignore: ["@ax/web"]`입니다. `publish.yml`은 `main`에 push가 들어오면(`packages/**`, `.changeset/**`) `changesets/action`을 실행합니다. 대기 중인 changeset이 있으면 릴리스 PR(`chore(release): 패키지 버전 업데이트`, `pnpm version-packages`)을 만들고, 없으면 `pnpm release`(build → pack-smoke → publish)를 실행합니다. theme 1.2.0 CHANGELOG에는 "Updated dependencies"만 있습니다. 직전 릴리스에서도 theme은 의존 갱신만으로 함께 올라갔다는 뜻입니다.

**위험**: changesets는 `main`에 쌓인 changeset 전체를 릴리스 PR 하나로 묶고, 그중 가장 큰 bump를 적용합니다. 1.2.1 릴리스 PR을 머지하기 전에 M2의 minor changeset이 `main`에 들어가면 1.2.1 없이 1.3.0이 나갑니다. 이는 changesets의 일반 동작이며 이 저장소에서 재현하지는 않았습니다.

**절차**
1. M1 PR에 patch changeset 1개를 넣고 4개 패키지를 모두 적습니다. theme은 D5에 따라 의존 갱신에 맡기지 않고 직접 적습니다. 머지 전에 `pnpm changeset status --verbose`로 4개 패키지가 모두 1.2.1인지 확인합니다.
2. M1을 머지한 뒤 생긴 릴리스 PR을 **다른 어떤 changeset보다 먼저** 머지하고, publish를 확인합니다. 확인 명령은 `npm view @axis-ds/theme@1.2.1 dependencies`이고, 기대값은 `{ '@axis-ds/tokens': '1.2.1' }`입니다. 현재 1.2.0은 `{ '@axis-ds/tokens': '1.2.0' }`임을 실측했습니다.
3. M2~M4 PR을 1.2.1 publish 전에 `main`에 머지한다면 **changeset 파일 없이** 머지합니다. minor changeset(tokens · theme · ui-react · agentic-ui)은 1.2.1 publish를 확인한 뒤에 추가합니다. 각 M2~M4 PR을 머지하기 전에 두 가지를 확인합니다. `npm view @axis-ds/tokens version`이 `1.2.1`인지, 그리고 `main`의 `.changeset/`에 config 외의 patch 파일이 남아 있지 않은지입니다.
4. 1.3.0 릴리스 PR에서 linked 4개 패키지가 모두 1.3.0인지 확인하고 머지합니다. 이때 `pack-smoke`가 브랜드 exports 타깃이 실제로 있는지 검사합니다.

### 결정 필요

1. **exports 방식**: 권장안은 명시형 `./css/brands/ontology`입니다. 기존 `pack-smoke` 77줄의 `existsSync` 검사를 그대로 쓸 수 있고, 빌드가 누락을 막습니다. 대안인 패턴형 `"./css/brands/*": "./dist/css/brands/*.css"`는 브랜드를 추가할 때 package.json을 고치지 않아도 되는 장점이 있습니다. 다만 `pack-smoke`가 리터럴 `*` 경로로 `existsSync`를 호출해 실패하므로 그 스크립트도 함께 고쳐야 합니다. 번들러(Next/Turbopack)가 CSS 패턴 exports를 어떻게 해석하는지도 확인하지 않았습니다.
2. **`brand.json` 최종 경로와 목록 파일**: `dist/brands/<brand>/brand.json`과 exports `./brands/<brand>/brand.json`을 제안합니다. WI-0028 `axis theme list`가 브랜드를 열거하려면 `dist/brands/index.json`(+ exports `./brands`)도 만들지 정해야 합니다. 정한 뒤 WI-0028에 알립니다.
3. **shadcn 층 생성 방식**: 권장안은 브랜드 JSON의 `shadcn` 섹션 값을 그대로 내는 것입니다(초안을 그대로 옮기는 방식). 대안은 브랜드 semantic에서 `buildShadcnVars`로 값을 유도한 뒤 덮어쓰는 방식입니다. 하지만 현재 매핑은 `--primary` = `text.primary`라 초안 값과 맞지 않고, 출력 변수도 늘어납니다.
4. **다크 선택자 수**: PRD FR-5의 3개로 할지, 초안처럼 `[data-theme="dark"] [data-brand]`를 더해 4개로 할지 정해야 합니다.
5. **토큰이 아닌 규칙(초안 221줄 `word-break: keep-all`)**: 브랜드 CSS에 넣지 않고 문서로 안내할지, `brand.json`에 부가 CSS 필드를 둘지 정해야 합니다.
6. **`setBrand(undefined)`의 저장 의미**: `removeItem`을 쓰면 `defaultBrand`가 있을 때 새로고침 후 기본 브랜드가 다시 적용됩니다. "브랜드 없음"을 저장하려면 sentinel 값이 필요합니다. AC5 문구("지워지며")에는 `removeItem`이 맞습니다.
7. **FOUC 방지 인라인 스크립트**: 저장된 `data-brand`를 첫 페인트 전에 `<html>`에 붙이는 스크립트를 theme 패키지에서 제공할지 정해야 합니다. PRD 범위에는 없습니다.
8. **import 순서 의존**: 라이트 블록의 명시도가 기본 `:root` · `.dark`와 같아서 브랜드 CSS를 `variables.css` 뒤에 import해야 합니다. 이를 문서로 안내할지, `:root[data-brand]`처럼 명시도를 올릴지 정해야 합니다. 명시도를 올리면 하위 컨테이너 선택자 규칙도 다시 맞춰야 합니다.
9. **V7 "색 값" 판정 기준**: 값 형식(hex · rgb · hsl · `{color.*}`)으로 판정할지, component 토큰에 테마 무관 표지를 둘지 정해야 합니다.
10. **`cssVarName` 공유 방식(B0)**: `scripts/brands.mjs`로 옮기고 `build-tokens.mjs`가 import하게 할지(34-36줄 수정, `variables.css` · `shadcn-compat.css` sha 불변 확인 조건), 복제할지(드리프트 위험) 정해야 합니다.
11. **브랜드 임시 파일 위치(B3 ②)**: `dist/.tmp`에 두고 try/finally로 정리할지, 처음부터 `os.tmpdir()` 등 dist 밖에 쓸지 정해야 합니다.
12. **tokens `test` 명령 형식(B6)**: 파일 명시(`node --test test/brands.test.mjs`, 권장)로 할지 다른 형식으로 할지 정해야 합니다. CI(`frontend.yml`)는 Node 20, publish(`publish.yml`)는 Node 22로 버전이 다르고, 디렉터리 인자는 Node 22에서 실패하며 글롭은 Node 21 이상에서만 지원됩니다. Node 20 동작은 미실측입니다.
13. **브랜드 CSS와 shadcn 변수의 순서**: 브랜드 CSS가 `shadcn-compat.css`와 소비자 자체 shadcn 정의(예: `apps/web` `globals.css`의 `@layer base`)보다 뒤에 와야 하는 문제를 결정 필요 8과 같은 방식(문서 안내 또는 명시도 상향)으로 풀지 정해야 합니다.

### 실측 근거

- `cat -n packages/axis-tokens/build-tokens.mjs` → 335줄입니다. 단계와 줄 번호는 3.1 표와 같습니다. Dark 빌드 소스에 component가 없는 것(177-181줄)과 `--radius: 0.5rem` 고정(295줄)을 확인했습니다.
- `cat packages/axis-tokens/package.json` → version 1.2.0, exports 5개(`.`, `./css`, `./css/shadcn`, `./tailwind`, `./json`), `files: ["dist"]`입니다. scripts는 `build` · `clean` · `prepublishOnly`뿐이고 `test`는 없습니다.
- `find src -type f` (axis-tokens) → `component/components.json`, `primitives/{colors,spacing,typography}.json`, `semantic/{light,dark}.json`, `tailwind-preset.ts`입니다. `src/brands`는 아직 없습니다.
- 스크래치패드 SD 실험(`style-dictionary` 4.4.0, node v22.22.0) → 기본 소스 뒤에 브랜드 파일(경로 3개)을 넣으면 브랜드 값이 이기고, 경로 필터로 3개만 출력됩니다. 없는 경로 `surface.nonexistent`는 rc 0으로 통과하고 `--axis-surface-nonexistent`가 출력됩니다(거부되지 않음).
- 기본 변수명 집합 → light 223개, dark 178개입니다(소스 leaf: primitives 148 + semantic light 30 + component 45 = 223, dark = 148 + 30 = 178). `dist/css/variables.css`의 `:root` · `.dark` 선언 수도 223 · 178이고 이름까지 전부 일치하므로(누락 · 초과 · 중복 0), dist가 현재 소스로 빌드된 상태임을 확인했습니다.
- `node --test test/`(node v22.22.0, 스크래치패드) → `# fail 1`(디렉터리를 모듈로 해석)입니다. `node --test test/brands.test.mjs` → `# pass 1`입니다. `grep -n node-version .github/workflows/*.yml` → `frontend.yml` 56 · 119 · 190줄 `'20'`, `publish.yml` 36줄 `22`입니다.
- `components.json`의 참조는 모두 `{color.*}` primitive입니다(B3 ③ 근거).
- `grep` 초안 `axis-theme-ontology.css` → 221줄입니다. 라이트 블록 선언은 95개(`--axis-*` 75 + shadcn 20), 다크 블록은 86개입니다. 현재 소스에 없는 `--axis-*`는 `bg-muted` · `plan-card-accent-width` · `shadow-lg` · `shadow-sm` 4개입니다. 라이트에만 있는 키는 9개, 다크에만 있는 키는 0개, 다크 선택자는 4개(121-124줄)입니다.
- `cat -n packages/axis-theme/src/index.ts` → 116줄입니다. theme effect는 57-66줄, 시스템 감지는 68-83줄, `setTheme`은 85-91줄, value는 93-96줄입니다. tokens import는 없습니다.
- `find ... -name '*.test.*'` (axis-theme · axis-tokens) → `packages/axis-theme/src/theme.test.tsx` 1개(301줄, `it` 21개)입니다. tokens 테스트는 0개입니다. `vitest.config.ts`는 jsdom 환경에 `src/**/*.test.{ts,tsx}`입니다.
- `cat .changeset/config.json` → 3.6에 적은 설정값입니다. `ls .changeset` → `config.json`만 있어 대기 changeset은 0개입니다.
- `npm view @axis-ds/theme@1.2.0 dependencies` → `{ '@axis-ds/tokens': '1.2.0' }`입니다(D5 전제 확인).
- `head packages/axis-theme/CHANGELOG.md` → 1.2.0 항목에는 "Updated dependencies"만 있습니다.
- `cat turbo.json` → `test` 작업에 `dependsOn`이 없습니다. `cat .github/workflows/publish.yml` → lint · type-check · build · `pnpm pack-smoke`를 거친 뒤 `changesets/action`을 실행합니다.
- `grep -n walkExports scripts/pack-smoke.mjs` → 75-84줄이고, 77줄이 `existsSync(join(root, val))`입니다.
- `git branch -a` · `gh pr list` → 진행 중인 M1 브랜치나 PR은 없습니다(열린 PR #55는 관계없음).

**호출한 쪽이 사용자에게 물어야 할 항목**: 위 "결정 필요" 1~13번입니다. 그중 사용자 판단이 꼭 필요한 것은 1(exports 방식), 3(shadcn 생성 방식), 4(다크 선택자 수), 6(`setBrand(undefined)` 저장 의미)입니다. 나머지는 권장안대로 진행해도 됩니다.

---

## 4. FR-3 참조 검사 스크립트 · CI 배선

### 4.1 현재 CI 구성

| 워크플로 | 트리거 | job | 실행 명령 (순서대로) | 비고 |
|---|---|---|---|---|
| `frontend.yml` | `main` 대상 push · PR (paths: `apps/**` · `packages/**` · `package.json` · `pnpm-lock.yaml` · `turbo.json` · 자기 자신), `workflow_dispatch` | `ci` → `deploy-preview`(PR) · `deploy-production`(main) | `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm type-check` → `pnpm test` → `pnpm build:registry` → `pnpm check-licenses` → `pnpm build` → `apps/web/out` 업로드 | Node 20, `.turbo` 캐시 사용. paths에 `scripts/**`가 없습니다 |
| `publish.yml` | `main` push (paths: `packages/**` · `.changeset/**` · 자기 자신), `workflow_dispatch` | `publish` | install → `pnpm lint` → `pnpm type-check` → `pnpm build` → `pnpm pack-smoke` → `changesets/action` | Node 22 |
| `sync-project.yml` | `project-todo.md` push, `workflow_dispatch` | `sync` | `@axis-ds/cli` 빌드 → `sync` | FR-3과 관계없습니다 |

turbo 태스크 구성(`turbo.json`):
- `build`: `dependsOn: ["^build"]`, 출력 `dist/**` 등
- `type-check`: `dependsOn: ["^build"]`
- `test` · `lint`: 의존 없음

`@axis-ds/ui-react` · `@axis-ds/agentic-ui`는 `@axis-ds/tokens`를 `dependencies`에 `workspace:*`로 둡니다. 그래서 `pnpm type-check` 단계에서 `^build`를 따라 `@axis-ds/tokens` 빌드가 먼저 실행됩니다. 이 순서는 독립 검증에서 스크래치 사본에 turbo 2.7.5 `run type-check --dry=json`(rc 0)을 실행해 확인했습니다. `@axis-ds/ui-react#type-check` · `@axis-ds/agentic-ui#type-check`가 `@axis-ds/tokens#build`에 의존합니다.

루트 스크립트 관례:
- `scripts/`에는 `.mjs` 4개(`build-registry` · `check-licenses` · `guard-pnpm-publish` · `pack-smoke`)가 있습니다. 모두 Node 내장 모듈만 쓰며 외부 의존이 없습니다(`node:` 접두는 `check-licenses`에만 있고 나머지는 접두 없이 씁니다).
- 출력 관례는 파일마다 다릅니다. `check-licenses`는 `[OK]` · `[WARN]` · `[BLOCK]` 태그 접두와 위반 시 `process.exit(1)`을 씁니다. `guard-pnpm-publish`는 `[guard]` 접두와 `exit(1)`, `pack-smoke`는 `✗ [pkg]` 접두와 `exit(1)`을 씁니다. `build-registry`는 이모지 출력이고 `main().catch(console.error)`로 끝나 실패해도 종료 코드 1을 내지 않습니다. 신규 스크립트는 `check-licenses` 방식(태그 접두 + `exit(1)`)을 따릅니다.
- 루트 `package.json` 등록 이름은 하이픈(`check-licenses` · `pack-smoke`)과 콜론(`build:registry`)이 섞여 있습니다. `guard-pnpm-publish`는 루트 scripts에 없고 ui-react · agentic-ui · theme의 `prepublishOnly`에서 부릅니다. 이런 루트 스크립트는 turbo 태스크가 아니라 CI step이나 패키지 훅에서 직접 부릅니다. `check-token-refs`는 하이픈 이름을 택합니다.

### 4.2 설계

| 항목 | 설계 |
|---|---|
| 경로 · 언어 | `scripts/check-token-refs.mjs` (Node ESM, 외부 의존 없음). 세 패키지(tokens · ui-react · agentic-ui)에 걸친 검사이므로 패키지 안이 아니라 루트 `scripts/`에 둡니다. 루트 `package.json`에 `"check-token-refs": "node scripts/check-token-refs.mjs"`를 추가합니다 |
| 입력 | ① 정의 집합: `packages/axis-tokens/dist/css/variables.css`의 `:root` 블록과 `shadcn-compat.css`의 `:root` 블록에서 `--이름:` 형태로 선언된 이름 ② 검사 대상: `packages/axis-ui-react/src` · `packages/axis-agentic-ui/src` 아래 `.ts` · `.tsx` · `.css` 전체(테스트 포함) ③ 옵션: `--css-dir <dir>`, `--src <dir>`(여러 번 지정 가능). 대조군 실험에서 fixture를 넣는 데 씁니다 |
| 빌드 필요 여부 | 빌드된 CSS를 기준으로 하므로 tokens 빌드가 끝난 뒤에 실행해야 합니다. turbo 태스크로 만들지 않고 CI step으로 둡니다. tokens 빌드를 보장하는 앞 단계(`pnpm type-check`)의 `^build`에 기대며, dist가 없으면 0건 통과가 아니라 측정 실패로 끝냅니다(아래 종료 코드) |
| 판정 1: 정의 누락 | `var(--axis-NAME)`의 NAME이 정의 집합에 없으면 위반입니다. 라이트 `:root` 기준으로 판정하고 `.dark`에만 있는 이름은 누락으로 칩니다(현재 `.dark` 178개는 모두 `:root` 223개 안에 있어 해당 사례가 없습니다) |
| 판정 2: fallback 인자 | `var(--axis-NAME, 대체값)`도 NAME이 정의되어 있어야 합니다. fallback은 면제 사유가 아닙니다. fallback이 있으면 정의 누락이 화면에서 가려지므로 오히려 잡아야 할 대상입니다 |
| 판정 3: 동적 이름 | 소스에 나온 `--axis-` 출현 수와 `var(--axis-[A-Za-z0-9-]+` 정적 매치 수가 다르면, 그 차이에 해당하는 출현(템플릿 리터럴 `` `--axis-${x}` ``, 문자열 조합, 인라인 정의 `'--axis-x': ...`)을 「정적 판정 불가」 위반으로 냅니다. 동적 이름을 허용하려면 예외 목록이 필요하며 결정 필요 항목에 따로 적었습니다 |
| 판정 4: primitive 직접 참조 | `axis-agentic-ui` 소스(테스트 포함)에 `var(--axis-color-` 참조가 있으면 위반입니다. `axis-ui-react`에는 적용하지 않습니다. FR-1에서 alert · progress의 접두 누락분을 `--axis-color-*`로 고치면 ui-react에 primitive 참조가 정상적으로 생기기 때문입니다 |
| 테스트 파일 | 포함합니다. FR-1이 `alert.test.tsx` · `badge.test.tsx`의 단언도 고치도록 정하고 있고, 현재 테스트 파일에서도 정의 누락 10건이 나옵니다. 출력에서는 `[test]` 표지로 따로 셉니다 |
| 실패 출력 | 위반 한 건마다 한 줄씩 냅니다. 예: `[token-refs] 정의 누락 packages/axis-ui-react/src/alert/index.tsx:LINE --axis-red-100`, `[token-refs] primitive 참조 packages/axis-agentic-ui/src/plan-card/index.tsx:LINE --axis-color-blue-500`. `GITHUB_ACTIONS=true`이면 같은 내용을 `::error file=…,line=…::` 형식으로도 내 PR diff에 주석을 답니다. 마지막 줄에는 요약을 냅니다: `검사 파일 N · 참조 보유 파일 N · 참조 N · 정의 N · 정의 누락 N · primitive 참조 N · 판정 불가 N` |
| 종료 코드 | 0: 위반 0건이면서 검사 파일 1개 이상, 참조 1건 이상, 정의 1개 이상 / 1: 위반 있음 / 2: 측정 실패(CSS 파일 없음, 정의 0개, 검사 파일 0개, 참조 0건). 측정 실패를 0건 통과와 구분하기 위한 장치입니다 |

### 4.3 CI 배선

| 위치 | 변경 | 시점 |
|---|---|---|
| `frontend.yml` `ci` job | 「Type check」 다음에 `- name: Token reference check` / `run: pnpm check-token-refs` step을 넣습니다. tokens dist가 생긴 직후이고 test · build보다 앞이라 빨리 실패합니다 | M1 |
| `frontend.yml` 트리거 paths | push · pull_request 양쪽에 `'scripts/**'`를 추가합니다. 지금은 `scripts/`만 바꾼 PR에서 CI가 돌지 않아, 검사 스크립트를 고친 PR이 검사 없이 머지될 수 있습니다 | M1 |
| `publish.yml` `publish` job | 「Build」 다음, 「Pack smoke」 앞에 같은 step을 넣어 1.2.1 · 1.3.0 배포 직전에도 검사합니다 | M1 |
| `frontend.yml` `ci` job (a11y, Q7: M3에 포함) | 「Build」 다음에 ① `~/.cache/ms-playwright` 캐시(키에 Playwright 버전 포함, 현재 설치본 1.61.1) ② `pnpm --filter @ax/web exec playwright install --with-deps chromium` ③ `pnpm --filter @ax/web test:e2e:a11y` ④ 실패할 때만 `apps/web/test-results/`를 업로드하는 step을 순서대로 넣습니다. GitHub Actions가 `CI=true`를 주므로 기존 설정의 `forbidOnly` · `retries: 1` · `workers: 1` · `reuseExistingServer: false`가 그대로 적용됩니다 | M3 |
| `apps/web/e2e/a11y.spec.ts` | 지금은 `THEMES`(light · dark) × `PAGES` 9개 = 18건입니다. M3에서 브랜드 축(기본 · ontology)을 더해 36건으로 늘리고, ontology 갈래에서는 `page.goto` 전에 `addInitScript`로 `document.documentElement`에 `data-brand="ontology"`를 붙입니다 | M3 |

### 4.4 대조군 검증 절차

1. **음성 대조군 (정의 누락)**:
   - `variables.css`와 `shadcn-compat.css`를 함께 임시 디렉터리에 복사한 뒤, `variables.css`에서 정의 한 줄(예: `--axis-button-bg-default:`)을 지웁니다. `shadcn-compat.css`를 빼면 「CSS 파일 없음」으로 종료 코드 2가 나옵니다.
   - `--css-dir`로 그 디렉터리를 지정해 실행합니다.
   - 종료 코드 1과 함께 그 이름을 참조하는 모든 위치가 나와야 합니다.
   - 사전 실측: 이 조작을 탐색용 스크립트에 적용하자 위반이 3건(`button/index.tsx`, `button/button.test.tsx`, agentic-ui 1건) 늘었습니다.
2. **음성 대조군 (판정 규칙)**:
   - 임시 `--src` fixture를 만듭니다. 미정의 이름, fallback이 있는 미정의 이름(`var(--axis-nope, red)`), 템플릿 리터럴(`` `var(--axis-${k})` ``), agentic 경로를 흉내 낸 `var(--axis-color-blue-500)`를 하나씩 넣습니다.
   - 네 건이 각각 정의 누락, 정의 누락, 판정 불가, primitive 참조로 잡혀야 합니다.
3. **측정 실패 대조군**: 존재하지 않는 `--css-dir`, 빈 `--src`로 실행해 종료 코드 2가 나오는지 확인합니다. 0건 통과로 끝나면 안 됩니다.
4. **양성 대조군**:
   - M1 수정 후 실제 저장소에서 종료 코드 0을 확인합니다.
   - 요약 줄의 검사 파일 수와 참조 수가 0이 아니고, 현재 실측(검사 파일 67개, 그중 참조 보유 파일 51개, 참조 492건)과 같은 규모인지도 함께 봅니다.
   - M1 착수 전 현재 상태로 돌리면 종료 코드 1과 아래 예상치가 나와야 합니다. 그래야 스크립트가 정의 누락을 실제로 잡는다는 근거가 됩니다.
5. **CI 배선 확인**: 위반 1건을 넣은 확인용 PR에서 `ci` job이 「Token reference check」 step에서 실패하는지 1회 확인한 뒤 되돌립니다.

### 4.5 현재 상태 예상치 (M1 착수 전)

| 구분 | 출현 | 행 | 고유 이름 | 파일 |
|---|---|---|---|---|
| 정의 누락, ui-react 소스 | 50 | (합산) | 24 | 13 |
| 정의 누락, ui-react 테스트 | 10 | (합산) | 10 | 2 (`alert.test.tsx` · `badge.test.tsx`) |
| 정의 누락, 소계 | 60 | 40 | 24 | 15 |
| 정의 누락, agentic-ui | 0 | 0 | 0 | 0 |
| primitive 참조, agentic-ui | 80 | 68 | 14 | 13 (모두 소스, 테스트 0) |
| 판정 불가(동적 이름) | 0 | 0 | 0 | 0 |
| **합계 (위반 출력 줄 수 = 출현 수)** | **140** | **108** | | |

fallback 형태(`var(--axis-x, …)`)는 판정 2에 따라 정의 누락으로 셉니다. 현재 0건이라 표 수치에는 영향이 없습니다.

이 수치는 PRD 1.2의 실측과 맞습니다.
- 정의 누락 고유 이름 24개는 의미 있는 이름 5개와 접두 누락 19개를 더한 값입니다.
- 비테스트 파일 수는 `surface-primary` 11 · `ring` 7 · `interactive-primary` 4 · `brand-500` 1 · `bg-muted` 1입니다.
- agentic-ui에서 primitive를 직접 참조하는 파일은 13개입니다.

`shadcn-compat.css`는 `--axis-*`를 하나도 정의하지 않습니다(정의 25개 모두 `--background` 등 shadcn 이름). 그래서 현재 `--axis-*` 판정에는 영향이 없습니다. 검사 대상 소스에는 `--axis-*` 외 `var()`가 radix 변수 4건뿐이고 shadcn 변수 참조는 0건입니다.

**검사 범위 밖의 추적 사본**

FR-3 검사 대상은 `src`뿐이라, git이 추적하는 아래 산출물에 복제된 같은 결함은 검사하지 않습니다.

| 경로 | 추적 파일 | `--axis-` 출현 | `var(--axis-color-` | 미정의 참조 | CI 재생성 |
|---|---|---|---|---|---|
| `public/r` | 30 | 354 | 80 | `bg-muted` 1 | 예(`build:registry`) |
| `apps/web/public/r` | 30 | 354 | 80 | `bg-muted` 1 | 예(`build:registry`) |
| `packages/axis-ui-react/registry/r` | 11 | 93 | 0 | `bg-muted` 1 | 확인 필요 |
| `packages/axis-agentic-ui/registry/r` | 19 | 261 | 80 | 0 | 확인 필요 |
| `apps/web/public/library/components` | 98 | 287 | 33 | 28(`surface-primary` 14 · `ring` 7 · `interactive-primary` 7) | 아니요 |
| `apps/web/public/library/categories` | 10 | 203 | 33 | 미집계 | 아니요 |

- CI에서는 `build:registry`가 `build`보다 먼저 돌아 `public/r` · `apps/web/public/r` 배포본은 다시 생성됩니다(`build-registry.mjs`의 `DEPLOY_DIRS`). 다만 추적본을 갱신해 커밋할지는 계획에 없습니다.
- `apps/web/public/library` JSON은 `build:registry`로 다시 생성되지 않습니다. 그래서 FR-1 · FR-2 이후에도 문서 사이트에 낡은 코드가 남습니다. 이 JSON의 생성기와 갱신 절차를 M1 산출물에 넣어야 합니다.

**실측 근거**
- `node build-tokens.mjs`를 스크래치 복사본에서 실행(rc=0)하고 산출물을 `cmp`로 비교: `variables.css` · `shadcn-compat.css`가 저장소 `packages/axis-tokens/dist/css`와 바이트 단위로 같았습니다. 따라서 dist는 현재 소스로 빌드한 결과와 같습니다.
- `cat -n .github/workflows/*.yml`: 4.1 표의 트리거 · step 순서를 확인했고, `frontend.yml` paths에 `scripts/**`가 없음을 확인했습니다.
- `cat turbo.json` 및 각 `package.json`의 scripts · deps 출력:
  - `type-check`·`build`는 `^build`에 의존합니다.
  - ui-react · agentic-ui는 `@axis-ds/tokens`를 `dependencies`의 `workspace:*`로 둡니다.
  - `apps/web`에는 `test` 스크립트가 없고 `test:e2e:a11y`만 있습니다.
- `ls scripts` · `head scripts/check-licenses.mjs`: `.mjs` ESM, `[태그]` 출력, `process.exit(1)` 관례를 확인했습니다.
- `grep -oE '^\s*--axis-…' variables.css | sort -u | wc -l` → 223. awk로 선택자별로 세면 `:root` 223 · `.dark` 178이고, `.dark`에만 있는 이름은 0개입니다. `grep -c -- '--axis-' shadcn-compat.css` → 0, shadcn 정의는 25개입니다.
- `grep -rho -- '--axis-'` → 492, `grep -rhoE 'var\(--axis-[A-Za-z0-9-]+'` → 492로 같았습니다. fallback 형태(`var(--axis-x, …)`) 0건, `--axis-…${` 템플릿 0건, `"--axis`·`` `--axis `` 문자열 0건입니다.
- `find packages/axis-ui-react/src packages/axis-agentic-ui/src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) | wc -l` → 67(입력 정의 기준 검사 파일), `grep -rlE -- '--axis-'` 같은 두 디렉터리 → 51(참조 보유 파일).
- 스크래치 탐색 스크립트 `probe.mjs`(정의 집합 대비 판정): 참조 보유 파일 51, 참조 492이고, 위반 수치는 4.5 표와 같습니다. `grep -rnoE … | sort -u | wc -l`로 행 수 40 · 68을 확인했습니다.
- 음성 대조군 실험: 복사본에서 `--axis-button-bg-default:` 1줄을 삭제하자 정의가 248개에서 247개로 줄고, 위반이 ui-react 소스 51 · 테스트 11 · agentic 1로 늘었습니다(원본 대비 +3).
- `grep -rhoE 'var\(--axis-color-' packages/axis-ui-react/src | wc -l` → 0, agentic-ui 테스트 파일 → 0.
- `apps/web/playwright.config.ts` · `e2e/a11y.spec.ts` 읽기:
  - `webServer: pnpm dev`(3100)이고, CI 분기 설정은 `forbidOnly` · `retries` · `workers`입니다.
  - `PAGES` 9개 × `THEMES` 2 구조이며 브랜드 축은 없습니다.
- `node -p require('@playwright/test/package.json').version` → 1.61.1. `next.config` → 프로덕션에서만 `output: 'export'`입니다.

**결정 필요**
1. **CI a11y의 서버 방식**: 현재 설정은 `next dev`를 띄웁니다. CI에서는 「Build」가 만든 `apps/web/out` 정적 산출물을 정적 서버로 띄우는 편이 배포본과 같아 더 충실하고 컴파일 대기도 없습니다. 다만 `playwright.config.ts`의 `webServer`를 CI 분기로 바꿔야 합니다. 어느 쪽으로 할지 정해야 합니다.
2. **M3 a11y와 M4 데모의 선후**: AC8의 ontology 조합을 M3에서 CI로 돌리려면 `apps/web`이 `@axis-ds/tokens/css/brands/ontology`를 불러와야 합니다. PRD는 문서 사이트 변경(FR-10)을 M4에 두었습니다. 브랜드 CSS import만 M3로 당길지, ontology 조합 CI 게이트를 M4 이후에 켤지 정해야 합니다.
3. **동적 이름 예외**: 현재 동적 이름은 0건이므로 예외 없이 「판정 불가 = 실패」로 시작하는 안을 권합니다. FR-7 · FR-9에서 인라인 정의(`style={{'--axis-…': …}}`)가 필요해지면 예외 목록을 둘지, 토큰으로만 정의하게 할지 정해야 합니다.
4. **브랜드 CSS 정합 검사 확장(M2)**: 브랜드 CSS가 `variables.css`에 없는 이름을 덮어쓰는 오타(정의 이름 불일치)도 같은 스크립트로 검사할지 정해야 합니다. FR-3 원문 범위 밖입니다.
5. **ui-react primitive 참조**: FR-1 이후 alert · progress가 `--axis-color-*` 19개를 직접 참조하게 됩니다. 판정 4를 agentic-ui에만 적용하는 지금 안을 유지할지, 후속에서 ui-react도 semantic화할지 정해야 합니다.
6. **판정 범위와 추적 산출물**: 판정 범위를 `src`로 한정할지, 레지스트리(`public/r` · `apps/web/public/r` · 패키지 `registry/r`) · `apps/web/public/library` 추적 산출물까지 넓힐지, 아니면 src와 산출물의 일치 검사를 따로 둘지 정해야 합니다.
7. **`publish.yml` paths의 `scripts/**`**: `publish.yml` paths에도 `scripts/**`가 없어, 검사 스크립트만 바꾼 main push에서는 배포 직전 게이트 쪽 검사가 돌지 않습니다. paths에 추가할지 정해야 합니다.
8. **판정 3의 주석 · 문자열 처리**: 판정 3은 전체 `--axis-` 출현 수와 정적 `var()` 매치 수의 차이를 쓰므로, 앞으로 주석 · JSDoc · 테스트 설명 문자열에 `--axis-이름`이 들어가면 판정 불가 위반으로 잡힙니다. 현재는 두 수가 492로 같아 실해가 없습니다. 주석을 제외할지, 문자열 리터럴만 볼지 규칙에 적어야 합니다.


---

