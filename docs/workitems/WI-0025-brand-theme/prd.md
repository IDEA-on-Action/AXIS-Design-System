# WI-0025: 브랜드 테마 축 도입과 온톨로지 테마 PRD

> 작성일: 2026-10-15 | 버전: v0.4 (2026-10-16, 디자인 기준 v0.24 교체) | 작성자: Sinclair Seo | WI: WI-0025 | GitHub: #83 (M1) · #84 (M2~M4) | 상태: Draft (Gate 1 · Gate 2 결정 반영)
> v0.4 변경: 온톨로지 디자인 기준을 프로토타입 v0.22에서 v0.24(디자인 시스템 v1)로 교체했습니다. 배경 · D1 · FR-8 · FR-9 · Non-goals · AC6 예시 · shadcn HSL 소수 퍼센트 표기(±1 유지) · A1(출처 v0.24) · Q1 · Q3 · Q6 · 부록 A · B를 v1 값으로 다시 쓰고, Q8 · Q9와 부록 C를 추가했으며, 다음 단계의 부록 B 승인 항목에 승인자(김정원 책임)와 입력 테두리 대비를 넣었습니다. 트랙 A · B와 Gate 2 결정은 바뀌지 않았고, 부록 B는 2026-10-16 사용자가 대리 승인했고 디자인 오너의 사후 확인을 기다립니다.
> 선행: 없음. 기준 버전 `@axis-ds/*` 1.2.0 (cli · mcp 1.1.3)
> 참조: 디자인 시스템 「온톨로지 플랫폼」(claude.ai Design System 아티팩트), 테마 초안 `axis-theme-ontology.css`(초안 2, 디자인 시스템 v1 기준)
> 후속: WI-0026 밀도 토큰, WI-0027 온톨로지 콘솔 템플릿, WI-0028 CLI · MCP 브랜드 명령

---

## 1. 개요

### 1.1 배경
- 「온톨로지 플랫폼(가칭)」 디자인을 디자인 시스템으로 정리했고, 라이트(원본)와 다크(신규) 두 테마 값을 확정했습니다.
- 2026-10-16에 기준을 프로토타입 v0.22에서 **v0.24(김정원 책임, 디자인 시스템 v1)**로 교체했습니다. 색은 민트 주색 · 다색 상태에서 **무채색 + 파랑 키컬러(`key` #326ADA) + 빨강(`bad` #C8332E)** 세 계열로 줄었고, 둥글기는 8 · 12px로 바뀌었으며 카드 그림자는 없어졌습니다. 이 PRD의 프리셋 값과 부록은 v1 기준으로 다시 썼습니다(바뀐 점은 부록 C에 있습니다).
- 이 제품을 AXIS 컴포넌트로 만들려면 AXIS 위에 온톨로지 룩을 테마로 얹을 수 있어야 합니다.
- 현재 AXIS 테마는 라이트 · 다크 한 축뿐입니다. `ThemeProvider`는 `<html>`에 `light|dark` 클래스와 `data-theme`만 붙이고, 브랜드(제품 룩)를 고르는 축이 없습니다.
- 사전 검토(2026-10-15)에서 CSS 변수 덮어쓰기로 색 · 글꼴 · 둥글기는 바꿀 수 있음을 확인했습니다. 다만 아래 결함 때문에 테마가 닿지 않는 곳이 생깁니다.

### 1.2 사전 검토에서 확인한 결함 (실측)
| 구분 | 내용 | 위치 |
|---|---|---|
| 정의 없는 변수 참조 | `--axis-surface-primary`(테스트 제외 11개 파일, 테스트 `alert.test.tsx`도 단언), `--axis-ring`(7), `--axis-interactive-primary`(4), `--axis-brand-500`(1, progress), `--axis-bg-muted`(1, 테스트 `badge.test.tsx`도 단언), `color-` 접두 누락 2개 파일 · 19개 변수(alert의 `--axis-{yellow,red,green,blue}-{100,200,600,900}` 16개, progress의 `--axis-{green,yellow,red}-500` 3개)를 참조하지만 `packages/axis-tokens/src`에 해당 이름의 토큰이 없습니다. 접두 누락분은 `--axis-color-{색}-{단계}`로는 모두 정의되어 있습니다 | `axis-ui-react`: dropdown-menu · sheet · popover · checkbox · switch · alert · textarea · slider · toggle · command · radio-group · progress · badge |
| primitive 직접 참조 | `--axis-color-*`(blue · gray · green · red · yellow · purple 14종)를 semantic 토큰을 거치지 않고 직접 씁니다. 테마가 이 값을 바꾸려면 primitive를 덮어써야 하고, 그러면 같은 primitive를 다른 의미로 쓰는 곳도 함께 바뀝니다 | `axis-agentic-ui` 13개 파일: run-progress · approval-card · tool-call-card · diff-viewer · agent-avatar · step-timeline · attachment-card · feedback-buttons · plan-card · recovery-banner · code-block · token-usage-indicator · message-bubble |
| 둥글기 | Tailwind preset의 `rounded-lg|md|sm`이 shadcn 변수 `--radius` 하나에서 계산됩니다(`md = --radius - 2px`). 버튼 8px · 카드 12px처럼 단계 간격이 다른 브랜드는 근사치만 맞출 수 있습니다. primitive `--axis-radius-*`(none~full 9종)는 정의되어 있지만 컴포넌트가 참조하지 않습니다 | `packages/axis-tokens/src/tailwind-preset.ts` |
| 크기 고정 | 버튼 높이(`h-8|10|12`), 표 글자(`text-sm`)가 클래스에 고정되어 테마로 바꿀 수 없습니다 | `axis-ui-react` button · table 등 |
| 그림자 | primitive 그림자 토큰(`--axis-shadow-*`)이 없습니다. component 토큰 `--axis-card-shadow-default` · `--axis-dialog-content-shadow`는 있지만 참조하는 컴포넌트가 없고, Card는 Tailwind `shadow-sm`, Dialog는 `shadow-lg`를 클래스에 고정합니다 | `axis-ui-react` card · dialog |

### 1.3 목표
1. **토큰 정합**: 컴포넌트가 참조하는 `--axis-*` 변수가 모두 토큰 원본에 정의되고, agentic-ui가 semantic 토큰만 참조하게 합니다.
2. **브랜드 테마 축**: 라이트 · 다크와 독립된 브랜드 축(`data-brand`)을 토큰 빌드와 `ThemeProvider`에 도입합니다.
3. **온톨로지 브랜드 프리셋**: 첫 브랜드로 `ontology`를 라이트 · 다크 두 벌로 제공하며, 두 벌 모두 AXIS의 a11y 엄격 게이트를 예외 없이 통과합니다.

### 1.4 범위
- 포함: 토큰 정합(정의 누락 · primitive 직접 참조 해소), 브랜드 토큰 소스 구조와 빌드 산출물, `ThemeProvider`의 `brand` 옵션, `ontology` 프리셋(공개), 문서 사이트의 브랜드 전환 데모, 테스트 · 릴리스
- 제외: 2장 Non-goals 참고

### 1.5 결정 사항 (Gate 1 · Gate 2, 2026-10-15)
| # | 쟁점 | 결정 | 반영 위치 |
|---|---|---|---|
| D1 | 온톨로지 라이트 원본 색 일부가 WCAG AA에 못 미침 | **AA 보정값을 사용합니다.** 색상(hue)은 유지하고 명도만 기준을 넘는 데까지 낮춥니다. 원본과의 차이는 부록 B에 기록하고 디자인 오너 승인을 받습니다. v1 기준에서는 주요 쌍(흰 글자/`key` 4.99:1 등)이 원본 값으로 통과하므로, 보정은 보조 글자 한 값(`sub` #6B7280 → #5F6673)만 남았습니다 | FR-8, 3.2, AC8, 부록 B |
| D2 | 온톨로지 프리셋 공개 여부 | **AXIS 저장소와 npm에 함께 공개합니다** | FR-4, FR-8 |
| D3 | 배포 단위 | **토큰 정리(트랙 A)를 1.2.1 patch로 먼저 내고**, 브랜드 축과 프리셋(트랙 B · C)은 1.3.0 minor로 냅니다. WI는 하나로 유지합니다 | 3.2, 4장 |
| D4 | 범위 밖 항목 | 밀도 토큰 · 온톨로지 콘솔 템플릿 · CLI · MCP 브랜드 명령을 후속 WI로 바로 등록합니다 | 2장, 다음 단계 |
| D5 | 1.2.1 patch에 `@axis-ds/theme` 포함 여부 (Gate 2) | **포함합니다.** 배포된 theme 1.2.0이 `@axis-ds/tokens`를 1.2.0 정확 버전으로 고정하므로(`workspace:*`가 배포 시 정확 버전으로 바뀜), theme을 빼면 theme 사용자는 tokens 1.2.1을 받을 수 없습니다 | 3.2, 4장 |
| D6 | 브랜드 메타데이터 `brand.json`의 담당 WI와 위치 (Gate 2) | **이 WI가 만듭니다.** 소스는 `brands/<brand>/brand.json`(name · description · themes · a11y 상태)이고, 빌드가 dist에 복사해 npm 배포본에 넣습니다(1.3.0). WI-0028 CLI · MCP 브랜드 명령이 이 파일을 읽습니다 | FR-4, FR-5 |
| D8 | M1 · M2 진행 방식 (착수, 2026-10-15) | **M1과 M2를 병렬로 개발하고 머지 순서만 고정합니다.** M1 머지 → 1.2.1 배포 → M2 머지 순서이며, minor changeset이 먼저 들어가면 1.2.1이 1.3.0이 되므로 M2 PR은 1.2.1 배포 뒤에 머지합니다 | 4장 |
| D9 | Q7 a11y CI 배선 (착수, 2026-10-15) | **M3에 포함합니다.** ontology 프리셋이 생기는 M3에서 `frontend.yml`에 Playwright a11y 단계를 추가해 AC8을 자동 게이트로 만듭니다 | AC8, Q7 |

---

## 2. Non-goals (범위 제외)

- **컴포넌트 크기 · 밀도 토큰화**: 버튼 34px · 입력 36px, 표 13.5px, 사이드바 240px, 단계별 둥글기 같은 밀도 차이는 **WI-0026 밀도 토큰**에서 다룹니다.
- **온톨로지 화면 패턴 이식**: 사이드바 틀 · 목록 페이지(상태 칩 · 검색 · 표) · depth 상세 · 보조 상자 · 칸반 · 노드 캔버스 · 에이전트 대화 · 처리 시트 등은 AXIS core에 넣지 않고 **WI-0027 온톨로지 콘솔 템플릿**에서 다룹니다.
- **CLI · MCP 브랜드 명령**: `axis theme list|add`, MCP 브랜드 조회 도구는 **WI-0028**에서 다룹니다.
- **온톨로지 가이드의 모양 규칙 강제**: 「한쪽 색 선 금지」「카드 그림자 금지」「뱃지 20 · 24px」 같은 규칙은 컴포넌트 구조를 바꾸므로 core에 넣지 않습니다. 단, PlanCard 왼쪽 색 선의 두께는 토큰으로 열어 브랜드가 0으로 둘 수 있게 합니다(FR-7).
- 기존 기본 테마(브랜드 미지정)의 색 · 크기 변경

---

## 3. 요구사항

### 3.1 기능 요구사항

**트랙 A. 토큰 정합 (1.2.1 patch)**
- FR-1: 정의 없는 변수 참조를 모두 해소합니다. 의미가 있는 것은 semantic 토큰으로 정의하고(예: `surface-primary` → `surface-default`의 별칭 또는 컴포넌트 교체, `ring` → `border-focus`, `interactive-primary` → 신규 semantic `interactive.primary`), 오타성 참조(alert · progress의 `color-` 접두 누락 19개, 예: `--axis-red-100` → `--axis-color-red-100`)는 올바른 이름으로 고칩니다. 같은 이름을 단언하는 테스트 파일(`alert/alert.test.tsx`의 `surface-primary` · 접두 누락 이름, `badge/badge.test.tsx`의 `bg-muted`)도 함께 고칩니다. 각 건의 처리 방식은 plan.md에 표로 남깁니다.
- FR-2: agentic-ui의 primitive 직접 참조 13개 파일을 semantic 토큰으로 바꿉니다. 필요한 semantic 토큰(예: `status.running|success|error|warning`, `diff.added|removed`, `agent.avatar-bg`)은 `light.json` · `dark.json`에 함께 추가합니다.
- FR-3: CI에 참조 검사 스크립트를 추가합니다. `axis-ui-react` · `axis-agentic-ui` 소스의 `var(--axis-*)`가 빌드된 `variables.css`에 모두 있는지, agentic-ui에 `--axis-color-*` 참조가 남았는지 검사하고 위반이 있으면 실패시킵니다.

**트랙 B. 브랜드 테마 축 (1.3.0)**
- FR-4: 토큰 소스에 브랜드 디렉터리를 둡니다. `packages/axis-tokens/src/brands/<brand>/{light,dark}.json`은 semantic · component 토큰과 일부 primitive(radius · font · shadow, shadow는 FR-9에서 신설)를 덮어쓰는 값만 담습니다. 같은 디렉터리에 메타데이터 `brand.json`(name · description · themes · a11y 상태)을 둡니다(D6). 브랜드 이름은 kebab-case이며 공개 저장소에 둡니다.
- FR-5: 빌드는 브랜드마다 `dist/css/brands/<brand>.css`를 만들고 `package.json` exports에 `./css/brands/<brand>`를 추가합니다. 선택자 규칙은 다음과 같습니다.
  - 라이트: `[data-brand="<brand>"]`
  - 다크: `[data-brand="<brand>"].dark`, `[data-brand="<brand>"][data-theme="dark"]`, 그리고 하위 컨테이너용 `.dark [data-brand="<brand>"]`
  - shadcn HSL 호환 층(`--background`, `--primary` 등)도 같은 규칙으로 함께 냅니다.
  - 참고: 기본 토큰 CSS(`variables.css` · `shadcn-compat.css`)의 다크 선택자는 `.dark` 하나뿐이고 `[data-theme="dark"]`는 없습니다. `@axis-ds/theme` `ThemeProvider`는 `.dark` 클래스와 `data-theme`을 함께 붙이므로 문제가 없지만, `data-theme`만 붙이는 환경에서는 브랜드 다크 값만 적용되고 기본 토큰은 라이트 값으로 남습니다. 브랜드 CSS의 `[data-theme="dark"]` 갈래는 이 점을 전제로 둡니다.
  - 빌드는 `src/brands/<brand>/brand.json`을 dist(예: `dist/brands/<brand>/brand.json`)로 복사하고 exports에 경로를 추가해 npm 배포본에 넣습니다(D6). `package.json`의 `files`가 `dist`뿐이므로 dist 밖에 두면 배포되지 않습니다. 최종 경로는 plan.md에서 정하고 WI-0028에 알립니다.
- FR-6: `@axis-ds/theme`의 `ThemeProvider`에 `defaultBrand?: string`, `brandStorageKey?: string`(기본 `"axis-brand"`)를 추가하고, `useTheme()`가 `brand` · `setBrand`를 돌려주게 합니다. 브랜드가 정해지면 `<html>`에 `data-brand`를 붙이고, `undefined`면 속성을 지웁니다. 기존 `theme` · `setTheme` · `resolvedTheme` 동작은 바꾸지 않습니다.
- FR-7: PlanCard 상태 색 선 두께를 컴포넌트 토큰 `--axis-plan-card-accent-width`(기본 4px)로 엽니다. 기본값에서는 현재 모습이 그대로 유지됩니다.

**트랙 C. 온톨로지 브랜드 프리셋 (1.3.0)**
- FR-8: `brands/ontology/{light,dark}.json`을 작성합니다. 값은 초안 `axis-theme-ontology.css`를 그대로 옮깁니다.
  - 라이트: 디자인 시스템 「온톨로지 플랫폼」 v1 원본 값에 부록 B의 AA 보정(한 값)을 적용한 값
  - 다크: 디자인 시스템의 다크 값(이미 AA 통과, 보정 없음)
  - AXIS의 success · warning · error · info 의미는 v1의 상태 다섯 가지에 맞춰 접습니다: success → 기본(회색), warning → `bad` 연한 단계, error → `bad`(뱃지는 진한 바탕 + `on-key` 글자), info → `key`. 매핑 표는 부록 A에 있습니다. (변경 주석: 「`bad` 연한 단계」는 바탕 역할(`surface.warning` · `badge.warning.bg` = `bad-light`)의 서술이고, 표식 · 글자 역할 `status.warning`은 `bad`, 강조 `status.warning-strong`은 `bad-dark`입니다(plan U25 · 5.3). 초안에 없던 기본 토큰 42개의 값은 plan 5.3 표에 있고 초안에도 역반영합니다(plan U18).)
- FR-9: 온톨로지 프리셋은 글꼴, 둥글기, 그림자, PlanCard 색 선 두께 0을 함께 지정합니다.
  - 글꼴: `--axis-font-family-sans`(`Pretendard Variable` 우선) · `--axis-font-family-mono`(`JetBrains Mono` 우선). 초안의 `--axis-font-sans` · `--axis-font-mono`는 정의된 토큰 이름이 아니어서 바로잡았고, JSON에서는 primitive `font.family.sans` · `font.family.mono` 경로에 넣습니다.
  - 둥글기: `--radius: 12px`만 실제 화면에 반영됩니다(Tailwind preset의 `rounded-*`가 `--radius`에서 계산하므로 카드 `rounded-lg`는 12px, 버튼 · 입력 `rounded-md`는 10px이 되어 v1의 8px과 2px 차이가 납니다. Q3 참고). `--axis-radius-md: 8px` · `--axis-radius-lg: 12px` · `--axis-radius-sm: 6px`는 컴포넌트가 참조하지 않아 이번 WI에서는 효과가 없으며, WI-0026의 단계별 radius 변수화에 대비한 값으로만 둡니다.
  - 그림자: `--axis-shadow-sm` · `--axis-shadow-lg`는 덮어쓸 기존 토큰이 없으므로 primitive로 **신설**합니다. 기본값은 현재 Tailwind `shadow-sm` · `shadow-lg`와 같은 값으로 두어 브랜드 미지정 화면이 바뀌지 않게 하고, Card(`shadow-sm` 하드코딩) · Dialog(`shadow-lg` 하드코딩)가 이 변수를 참조하도록 컴포넌트를 고칩니다. 이 변경이 없으면 프리셋의 그림자 값은 화면에 반영되지 않습니다. 온톨로지 프리셋 값은 `--axis-shadow-sm`이 v1 `sh-1`, `--axis-shadow-lg`가 `sh-2`이며, v1은 카드에 그림자를 쓰지 않습니다(팝오버 · 고른 탭만). 이 구조에서는 Card가 `--axis-shadow-sm`을 참조하므로 `sh-1`을 넣으면 카드에도 그림자가 생깁니다. 이를 피하려고 Card는 component 토큰 `--axis-card-shadow`(기본값 `var(--axis-shadow-sm)`)를 참조하고, 온톨로지 프리셋은 이 토큰을 `none`으로 둡니다. 팝오버 · 탭은 `--axis-shadow-sm`(`sh-1`)을 그대로 씁니다(2026-10-16 결정). (변경 주석: 기본값은 plan U3에 따라 `{shadow.sm}` 참조이며 빌드에서 리터럴 `0 1px 2px 0 rgb(0 0 0 / 0.05)`로 풀립니다. ontology 값은 plan U2에 따라 `none` 대신 `0 0 #0000`입니다. 기존 `--axis-card-shadow-default`는 plan U23에 따라 폐기 예정이고 ontology에도 `0 0 #0000`을 넣습니다.)
  - PlanCard 색 선 두께 0: FR-7에서 만드는 `--axis-plan-card-accent-width`를 `0`으로 지정합니다. 이 값은 FR-7 이후에 생기는 토큰이므로 초안 CSS에도 같은 줄을 추가해 FR-8의 「초안 그대로 옮기기」에 포함되게 했습니다.
- FR-10: 문서 사이트(`apps/web`)에 브랜드 전환 데모를 추가합니다. 문서 사이트의 테마 전환은 `@axis-ds/theme`가 아니라 `next-themes`(`attribute="class"`)가 맡아 `<html>`에 `.dark` 클래스만 붙이고 `data-theme` · `data-brand`는 붙이지 않습니다. 따라서 데모는 브랜드 선택 시 `document.documentElement`에 `data-brand`를 직접 붙이고 지우는 방식으로 구현하고, 다크는 `next-themes`의 `.dark`로 계속 동작하게 둡니다(브랜드 CSS의 `[data-brand].dark` 갈래). 문서 사이트 Provider를 `@axis-ds/theme`로 바꾸는 일은 이번 범위에 넣지 않습니다. 테마 문서(`docs/guides/theme-customization.md`)에 「브랜드 테마」 절을 추가하고, 기존 「4. 커스텀 테마 생성」 예시를 브랜드 디렉터리 방식으로 갱신합니다. 부록 B의 원본 대비 보정 내역도 문서에 싣습니다.

### 3.2 비기능 요구사항
- **하위 호환**: `data-brand`가 없으면 모든 CSS 변수의 계산값이 1.2.0과 같아야 합니다. 단, 트랙 A에서 정의 누락을 채운 변수는 예외이며 1.2.1 릴리스 노트에 바뀐 컴포넌트를 적습니다. 1.3.0에서 새로 생기는 변수(FR-7 `--axis-plan-card-accent-width`, FR-9 `--axis-shadow-*` · `--axis-card-shadow`, D-5 흰 글자 짝 토큰)도 예외이며, 이 변수들의 기본값은 기존 화면 모습(색 선 4px, Tailwind `shadow-sm` · `shadow-lg`, 흰 글자 #FFFFFF)과 같아야 합니다.
- **접근성**: 온톨로지 프리셋(라이트 · 다크)은 기존 a11y 게이트(axe 단위 테스트, `test:e2e:a11y` 엄격 모드)를 **예외 없이** 통과해야 합니다. 의미를 지닌 아이콘 · 포커스 링은 3:1 이상입니다.
  - 단위 axe 테스트(`src/test-utils/axe.ts`)는 jsdom 한계로 `color-contrast` 규칙을 꺼 두었으므로 색 대비는 검증하지 못합니다. 대비 검증은 `apps/web`의 `test:e2e:a11y`(Playwright)뿐입니다.
  - `test:e2e:a11y`는 현재 수동 실행 스크립트이며 CI에 연결되어 있지 않습니다(`frontend.yml`의 `pnpm test`는 `apps/web`에 `test` 스크립트가 없어 Playwright를 실행하지 않습니다). CI 배선을 이 WI 범위에 넣을지는 Q7에서 정합니다.
- **번들 크기**: 브랜드 값은 `dist/css/brands/<brand>.css`에만 두고 `variables.css`에는 넣지 않습니다. 단, 트랙 A에서 정의 누락을 채우는 토큰(FR-1 · FR-2), FR-7의 `--axis-plan-card-accent-width`, FR-9의 `--axis-shadow-*` · `--axis-card-shadow`, D-5 흰 글자 짝 토큰의 기본값은 `variables.css`에 추가되므로 그만큼은 늘어납니다. 이 외의 증가는 없어야 합니다.
- **릴리스**: changesets linked 릴리스를 두 번 냅니다.
  - 1.2.1 patch: 트랙 A(`@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme`). theme은 코드 변경이 없어도 함께 냅니다. 배포된 theme 1.2.0이 tokens를 1.2.0 정확 버전으로 고정하기 때문입니다(D5).
  - 1.3.0 minor: 트랙 B · C(`@axis-ds/tokens` · `@axis-ds/theme` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui`)
  - 두 릴리스 모두 Breaking change가 없어야 합니다.

---

## 4. MVP 범위

| 단계 | 내용 | 산출물 | 릴리스 |
|---|---|---|---|
| M1 | 트랙 A 전체(FR-1~3) | 토큰 추가 · 컴포넌트 수정 · 참조 검사 CI · 전후 스크린샷 비교 · tokens 의존 버전을 올린 theme 재배포(D5) | **1.2.1** (tokens · ui-react · agentic-ui · theme) |
| M2 | 트랙 B의 빌드와 Provider(FR-4~6) | `dist/css/brands/*`, `brand.json` dist 복사, `ThemeProvider` brand 옵션, 단위 테스트 | 1.3.0 |
| M3 | 트랙 C(FR-8~9)와 FR-7 | `brands/ontology`, PlanCard 토큰, 그림자 토큰과 Card · Dialog 참조 변경, a11y 검증과 CI 배선(D9) | 1.3.0 |
| M4 | 문서와 데모(FR-10) | 문서 절 · 전환 데모 · 1.3.0 릴리스 노트 | 1.3.0 |

M1이 끝나야 M3의 매핑이 모든 컴포넌트에 닿으므로 M3는 M1 · M2 뒤에, M4는 M3 뒤에 진행합니다. M1과 M2는 병렬로 개발하되 머지는 M1 → 1.2.1 배포 → M2 순서로 고정합니다(D8).

---

## 5. 수용 기준 (Acceptance Criteria)

- AC1: 참조 검사 스크립트가 0건으로 통과합니다. `axis-ui-react` · `axis-agentic-ui`의 모든 `var(--axis-*)`가 빌드된 `variables.css`에 정의되어 있습니다.
- AC2: `axis-agentic-ui` 소스에 `var(--axis-color-` 참조가 0건입니다.
- AC3: 브랜드를 지정하지 않은 상태에서 `variables.css`의 라이트 · 다크 계산값이 1.2.1 스냅샷과 일치합니다(스냅샷 테스트, 1.3.0 기준). 비교 대상은 1.2.1에 있던 변수이며, 1.3.0에서 새로 생긴 변수(FR-7 · FR-9 · D-5 짝 토큰)는 별도로 기본값만 검사합니다.
- AC4: `pnpm build` 후 `dist/css/brands/ontology.css`가 생기고 `import "@axis-ds/tokens/css/brands/ontology"`가 동작합니다.
- AC5: `ThemeProvider defaultBrand="ontology"`로 렌더하면 `<html data-brand="ontology">`가 붙고, `setBrand(undefined)`로 지워지며, 값이 `localStorage["axis-brand"]`에 남습니다(단위 테스트).
- AC6: `data-brand="ontology"`에서 라이트 · 다크 각각 `--axis-button-bg-default`, `--axis-button-text-default`, `--axis-surface-default`, `--axis-text-primary`, `--axis-text-secondary`, `--axis-border-focus`, `--primary`(HSL)의 계산값이 부록 A와 일치합니다(Playwright 계산 스타일 검사). shadcn HSL 변수(`--background` · `--primary` 등)는 정수 퍼센트로 적으면 원본 hex와 채널당 최대 2 어긋나므로(예: `220 69% 53%`는 rgb(52,108,218)), 프리셋은 원본 hex로 정확히 렌더되는 소수 퍼센트(예: 라이트 `--primary` `220 69.4% 52.5%` = #326ADA)로 적고, 렌더된 rgb를 채널당 ±1 허용 오차로 비교합니다(2026-10-16 결정).
- AC7: 문서 사이트에서 브랜드(기본 · ontology, `data-brand` 직접 전환)와 테마(라이트 · 다크, `next-themes`)를 바꾸면 Button · Card · Input · Badge · Alert · PlanCard · MessageBubble 데모가 함께 바뀝니다.
- AC8: 9개 대표 페이지 axe 위반 0건을 기본 · ontology 브랜드 × 라이트 · 다크 네 조합에서 모두 만족합니다. 온톨로지 전용 예외 항목은 없습니다. 색 대비는 `test:e2e:a11y`로만 검증되며(단위 axe는 `color-contrast` 비활성), M3에서 CI에 연결하며(D9), 그 전까지는 로컬 수동 실행 결과를 근거로 삼습니다.
- 비기능: 단위 테스트 · typecheck · lint · build · 기존 E2E 회귀가 없습니다.

---

## 6. Assumptions (가정)

- A1: 온톨로지 프리셋 값의 출처는 디자인 시스템 「온톨로지 플랫폼」의 `tokens.json`입니다. 라이트는 「온톨로지 플랫폼(가칭)」 프로토타입 v0.24에 복사된 디자인 시스템 v1 토큰 원본 값에 AA 보정을 적용한 값이고, 다크는 그 디자인 시스템에서 새로 정의한 값입니다. 제품 화면 자체의 색은 이 WI가 바꾸지 않습니다.
- A2: 브랜드 축은 `data-brand` 속성 하나로 충분합니다. 한 페이지 안에서 여러 브랜드를 섞는 경우는 하위 컨테이너 선택자로만 지원합니다.
- A3: 기존 소비자(Minu · Discovery-X 등)는 `data-brand`를 쓰지 않으므로 1.3.0의 영향을 받지 않습니다. 1.2.1의 정의 누락 보완은 영향이 있을 수 있어 Q2에서 확인합니다.
- A4: AXIS 아티팩트에 있는 `axis-styles.css`의 `data-style="foundry|classic"` 플레이버는 프레젠테이션용이며 npm 패키지와 별개입니다. 이번 WI는 이를 건드리지 않습니다.

---

## 7. Risks / Open questions

| # | 내용 | 영향 | 상태 · 제안 |
|---|---|---|---|
| Q1 | 온톨로지 라이트 원본 색의 AA 미달 | 낮음(v1 기준) | **결정됨(D1)**: AA 보정값 사용. v1에서는 보정이 한 값으로 줄었습니다. 부록 B는 2026-10-16 사용자(Sinclair Seo) 대리 승인, 디자인 오너(김정원 책임) 사후 확인 대기 |
| Q2 | `--axis-surface-primary` 등 정의 없는 변수가 지금은 브라우저 기본값으로 떨어져 보이고 있을 수 있습니다. 정의를 추가하면 기존 화면 모습이 바뀔 수 있습니다 | 중간 | 열림. M1에서 정의 전후 스크린샷을 비교하고, 바뀌는 컴포넌트는 1.2.1 릴리스 노트에 적습니다 |
| Q3 | 둥글기를 `--radius` 하나로 계산하는 구조라 카드 12px · 버튼 8px을 동시에 맞추지 못합니다(`md = --radius - 2px` = 10px) | 낮음 | 열림. 이번 WI는 `--radius: 12px` 근사로 진행하고 WI-0026에서 단계별 radius를 변수화합니다 |
| Q4 | 프리셋 공개 여부 | 중간 | **결정됨(D2)**: AXIS에 함께 공개 |
| Q5 | 코드 글꼴: AXIS 기본 mono 스택은 `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace`이고(D2Coding 없음), 온톨로지는 `JetBrains Mono` 우선입니다. D2Coding은 온톨로지 초안 스택에만 있습니다 | 낮음 | 열림. 프리셋에서 `--axis-font-family-mono` 스택만 바꾸고 웹폰트 로드는 소비자 책임으로 둡니다 |
| Q6 | AA 보정으로 보조 글자가 한 단계 진해집니다. v0.22 기준에서 문제였던 주 버튼 글자 · 포커스 링 변경은 v1에서 필요 없어졌습니다 | 낮음 | **결정됨(2026-10-16 사용자(Sinclair Seo) 대리 승인, 디자인 오너(김정원 책임) 사후 확인 대기)**: 제품 화면에도 같은 보정을 적용합니다 |
| Q7 | AC8의 대비 검증(`test:e2e:a11y`)이 CI에 연결되어 있지 않아 자동 게이트가 아닙니다 | 중간 | **결정됨(D9)**: M3에서 `frontend.yml`에 Playwright a11y 단계를 추가합니다 |
| Q8 | v1에는 초록 · 노랑이 없어 AXIS의 success · warning 의미가 회색 · 연한 빨강으로 접힙니다. agentic-ui의 실행 상태(성공 · 경고)가 색만으로는 구분되지 않습니다 | 중간 | 열림. FR-2에서 만드는 `status.*` semantic 토큰이 온톨로지에서 위 매핑을 따르게 하고, 상태가 늘 글자 · 아이콘과 함께 보이는지 AC7 데모에서 확인합니다 |
| Q9 | 키컬러 `key`(#326ADA)는 AXIS 기본 주 버튼(blue-500 #3B82F6)보다 진하고 blue-600(#2563EB)에 가깝습니다. 두 테마의 색 차이가 작아 데모에서 브랜드 전환이 잘 드러나지 않을 수 있습니다 | 낮음 | 열림. 전환 데모는 상태 뱃지 · 둥글기 · 그림자 차이가 함께 보이는 화면으로 구성합니다 |

---

## 부록 A. 온톨로지 매핑 (요약, v1 기준)

값의 전체 목록은 `axis-theme-ontology.css`(초안 2)에 있습니다. 아래는 AC6 검사 대상과 주요 역할이며, 라이트는 AA 보정 후 값입니다(보정한 칸은 굵게 표시).

| AXIS 토큰 | 온톨로지 토큰 | 라이트 | 다크 |
|---|---|---|---|
| `--axis-surface-default` | `card` | #FFFFFF | #17191D |
| `--axis-surface-secondary` | `panel` | #F3F4F6 | #1F2227 |
| `--axis-surface-tertiary` | `panel-2` | #EAECEF | #2A2E34 |
| `--axis-text-primary` | `ink` | #111418 | #F1F3F5 |
| `--axis-text-secondary` · `-tertiary` | `sub` | **#5F6673** | #9CA3AD |
| `--axis-text-brand` · `-info` | `key-dark` | #2757B8 | #9DBBF6 |
| `--axis-border-default` | `line` | #E6E8EB | #2B2F35 |
| `--axis-border-secondary` · `--axis-input-border-default` | `line-2` | #D6DADF | #5F6874 |
| `--axis-border-focus` | `key` | #326ADA | #6B98F0 |
| `--axis-button-bg-default` | `key` | #326ADA | #6B98F0 |
| `--axis-button-bg-hover` | `key-dark` | #2757B8 | #9DBBF6 |
| `--axis-button-text-default` | `on-key` | #FFFFFF | #0E1013 |
| `--axis-button-secondary-bg-default` | `card` | #FFFFFF | #17191D |
| `--axis-button-destructive-bg-default` / `-text` | `bad-light` / `bad-dark` | #FDE8E8 / #A8281F | #3A1A1A / #F49890 |
| `--axis-badge-default-bg` / `-text` | `panel-2` / `ink-2` | #EAECEF / #2A2F36 | #2A2E34 / #D0D4D9 |
| `--axis-badge-success-bg` / `-text` | `panel-2` / `ink-2` (기본) | #EAECEF / #2A2F36 | #2A2E34 / #D0D4D9 |
| `--axis-badge-warning-bg` / `-text` | `bad-light` / `bad` (주의) | #FDE8E8 / #C8332E | #3A1A1A / #F07A72 |
| `--axis-badge-error-bg` / `-text` | `bad` / `on-key` (오류) | #C8332E / #FFFFFF | #F07A72 / #0E1013 |
| `--axis-badge-info-bg` / `-text` | `key-light` / `key-dark` (봐야 할 것) | #E8EFFC / #2757B8 | #1C2A45 / #9DBBF6 |
| `--background`(shadcn) | `bg` | `0 0% 97%` (렌더 #F7F7F7) | `216 15.2% 6.5%` (렌더 #0E1013) |
| `--primary`(shadcn) | `key` | `220 69.4% 52.5%` (렌더 #326ADA) | `219.7 81.6% 68%` (렌더 #6B98F0) |

shadcn 행은 HSL 원문 값입니다. 원본 hex로 정확히 렌더되도록 소수 퍼센트로 적었습니다(초안 2 원본은 정수 퍼센트라 최대 2 어긋났습니다, AC6 참고).

주요 대비(라이트): 흰 글자/`key` 4.99:1, 흰 글자/`bad` 5.29:1, `key-dark`/`key-light` 5.79:1, `bad`/`bad-light` 4.51:1, `bad-dark`/`bad-light` 5.98:1, `ink-2`/`panel-2` 11.39:1. 다크는 글자 대비가 모두 4.5:1 이상이고 입력 테두리 `line-2`는 `card` 위 3.12:1입니다.

라이트의 입력 테두리 `line-2`는 `card` 위 1.40:1(v1 원본 값)입니다. 입력 상자의 경계는 WCAG 1.4.11 대상이므로, AC8에서 axe가 지적하지 않더라도 포커스 때 `key` 테두리로 바뀌는지 확인합니다. 원본 값을 유지할지는 디자인 오너가 부록 B와 함께 정합니다.

---

## 부록 B. 라이트 AA 보정 내역 (2026-10-16 대리 승인)

승인 상태: **2026-10-16 사용자(Sinclair Seo) 대리 승인, 디자인 오너(김정원 책임) 사후 확인 대기**. 승인 범위는 ① `sub` 보정 ② 미달 쌍 처리 ③ 라이트 입력 테두리 `line-2` 1.40:1은 원본을 유지하고 포커스 때 `key` 테두리로 구분 ④ 제품 화면에도 같은 보정 적용(Q6) ⑤ PlanCard 색 선 두께 1px(왼쪽 테두리선을 다른 변과 같게 유지) ⑥ 에이전트 상태 색 접기(성공 `ink-2`, 경고 · 오류 `bad`, 진행 · 정보 `key`, diff 추가 회색)입니다.

보정 방식: 원본과 같은 색상(hue) · 채도를 유지하고 명도만 낮춰, 실제로 놓이는 바탕 모두에서 4.5:1 이상이 되는 값을 골랐습니다. 바탕 색은 바꾸지 않았습니다.

| 역할 | 원본 | 보정 | 원본 대비 | 보정 후 대비 |
|---|---|---|---|---|
| 보조 · 흐린 글자 (`card` · `bg` · `panel` · `panel-2` 위) | `sub` #6B7280 | #5F6673 | 4.83 · 4.51 · 4.39 · 4.08:1 | 5.78 · 5.39 · 5.25 · 4.88:1 |

그 밖의 미달 쌍은 보정하지 않고, 통과하는 단계 토큰을 고르는 방식으로 해결했습니다.

| 미달 쌍 (원본) | 대비 | AXIS 프리셋의 처리 |
|---|---|---|
| `key`/`key-light` (고른 칩 · 메뉴 글자) | 4.32:1 | brand · info 글자는 `key-dark`를 씁니다(5.79:1) |
| `muted`/`card` (흐린 글) | 2.61:1 | 글자에 쓰지 않고 placeholder · 보조 아이콘 · 입력 hover 테두리에만 씁니다 |
| `line-2`/`card` (입력 테두리) | 1.40:1 | 원본 유지, 포커스 때 `key`로 구분합니다(부록 A 끝 참고) |
| `bad-line`/`card` (주의 점) | 1.52:1 | warning 아이콘에만 쓰고, 상태는 늘 글자와 함께 보입니다 |

디자인 오너 사후 확인 대상 (2026-10-17 사용자 결정): 위 부록 B ①~⑥에 더해, M3 구현에서 정한 아래 화면 색 결정도 함께 확인받습니다. 값 표와 대비 검산은 plan.md 5.3, 확인 체크는 todo.md M3 「디자인 오너 사후 확인 목록」에 있습니다.

- warning 단계: 바탕 역할(`surface.warning` · `badge.warning.bg`)은 `bad-light`, 표식 · 글자(`status.warning`)는 `bad`, 강조(`status.warning-strong`)는 `bad-dark`
- 에이전트 아바타 3색: tool = `key`, assistant = `ink-2`, system = `sub`(라이트 `sub-aa`)
- Dialog overlay: v1 팔레트에 없어 기본값 `rgba(0, 0, 0, 0.5)` 유지
- 위 승인 범위에 맞추려고 바꾼 값: destructive 버튼 hover · active 바탕 `bad-line` → `bad-light`, Alert warning 테두리 · `status.error-border` `bad-line` → `bad`, 비활성 버튼 글자 `muted` → `sub-aa`
- 초안 역반영: 초안 2에 없던 42개 값(상태 · diff · 에이전트 · interactive · dialog · 버튼 비활성 등)을 `axis-theme-ontology.css`에 추가

---

## 부록 C. v0.22 기준 초안과 달라진 점 (2026-10-16)

| 항목 | 초안 1 (v0.22) | 초안 2 (v0.24 · 디자인 시스템 v1) |
|---|---|---|
| 주색 | 민트 #15C7C7 | 파랑 `key` #326ADA (AXIS blue-600 #2563EB에 가까움) |
| 상태 색 | 민트 · 주황 · 빨강 · 파랑 · 보라 | 회색(정상) · 빨강 두 단계(주의 · 오류) · 파랑(봐야 할 것) |
| 주 버튼 글자 | 흰색 → #0F1724로 AA 보정 | 흰색 원본 그대로 통과(4.99:1) |
| AA 보정 수 | 8개 역할 | 1개 값 (`sub`) |
| 둥글기 | 10 · 14px (`--radius` 12 근사) | 8 · 12px (`--radius` 12) |
| 그림자 | 카드 그림자 사용 | 카드 그림자 없음, 팝오버 · 고른 탭만 |
| 바탕 · 잉크 | #F4F6F8 · #1F2933 | #F7F7F7 · #111418 |
| 다크 | 남색 계열(#0F1724) | 무채색 계열(#0E1013), v1 팔레트로 다시 정의 |

트랙 A · B(토큰 정합, 브랜드 축)와 결정 D2 · D3 · D4 · D5 · D6 · D8 · D9는 바뀌지 않았습니다.

---

## 다음 단계

- GitHub 이슈 발급 후 이 문서의 `GitHub` 칸을 채우고, `project-todo.md`의 「할 일」에 WI-0025 ~ WI-0028을 추가합니다.
- 부록 B는 2026-10-16 사용자가 대리 승인했습니다. 디자인 오너(김정원 책임)의 사후 확인을 받습니다. 확인 대상은 부록 B 끝의 「디자인 오너 사후 확인 대상」 목록 전체입니다.
- `/wi-todo.md WI-0025 brand-theme`로 실행 체크리스트를 만듭니다.
