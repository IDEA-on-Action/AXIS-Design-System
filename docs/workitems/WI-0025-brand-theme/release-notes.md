# WI-0025 릴리스 노트: 브랜드 테마 축 도입과 온톨로지 테마

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | TODO: [todo.md](./todo.md)

## 1.3.0 (minor, 초안) - 브랜드 테마 축 (M2) · 온톨로지 프리셋 (M3)

> 대상: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme` 1.2.1 → 1.3.0 (linked)
> 상태: M3 시점 초안(plan U22, 2026-10-18). M4(문서 사이트 브랜드 전환 데모 · `theme-customization.md` 「브랜드 테마」 절)의 내용, 배포 일시 · run 번호, 소비 프로젝트 영향은 M4에서 채웁니다

### 배경

1.2.1까지 AXIS는 라이트 · 다크 한 벌의 색만 가졌고, 다른 제품이 자기 색을 쓰려면 primitive 색 변수를 덮어써야 했습니다(1.2.1부터는 agentic-ui에도 닿지 않음). 1.3.0은 테마(라이트 · 다크)와 독립된 **브랜드 축**(`data-brand`)을 더하고, 첫 브랜드로 온톨로지 플랫폼 프리셋(`ontology`)을 함께 냅니다. 브랜드를 지정하지 않으면 1.2.1과 같은 화면입니다.

### 변경 사항

#### tokens: 브랜드 빌드 (M2)
- 브랜드 소스 `src/brands/<brand>/{light,dark,brand}.json`을 빌드하면 `dist/css/brands/<brand>.css`가 생깁니다. 브랜드 값은 이 파일에만 있고 `variables.css`에는 들어가지 않습니다
- 선택자: 라이트 `[data-brand="<brand>"]`, 다크 `[data-brand="<brand>"].dark` · `[data-brand="<brand>"][data-theme="dark"]` · `.dark [data-brand="<brand>"]`
- 메타데이터 `dist/brands/<brand>/brand.json`(name · description · themes · a11y)과 브랜드 목록 `dist/brands/index.json`(`{ "brands": [{ "name", "css", "meta" }] }`, 이름순)
- 브랜드 JSON 검증(파일 구성 · 기본 토큰 경로 존재 · 라이트/다크 짝 · 변수명 충돌 · shadcn 값 형식 등)에 실패하거나 브랜드에 맞는 `package.json` exports 항목이 없으면 빌드가 실패합니다

#### tokens: ontology 브랜드 프리셋 (M3)
- 사용: `import "@axis-ds/tokens/css"` 다음에 `import "@axis-ds/tokens/css/brands/ontology"`, 그리고 `<html data-brand="ontology">`(또는 하위 컨테이너). 다크는 기존 `.dark` · `data-theme="dark"`를 그대로 씁니다
- 새 exports: `./css/brands/ontology`, `./brands/ontology/brand.json`, `./brands`(목록)
- 값의 출처는 디자인 시스템 「온톨로지 플랫폼」 v1입니다. 라이트는 WCAG AA를 맞추려고 보조 글자 한 값(`sub` #6B7280 → #5F6673)만 보정했고, 다크는 원본 그대로입니다
- AXIS의 상태 의미는 v1의 상태 다섯 가지로 접습니다: success → 회색 계열, warning · error → `bad` 계열(바탕은 연한 단계), running · info → `key` 계열. 상태가 색만으로 구분되지 않으므로, 상태는 글자 · 아이콘과 함께 표시해 주세요
- 글꼴(`Pretendard Variable` · `JetBrains Mono` 우선), `--radius: 12px`, 그림자(`--axis-shadow-sm` · `--axis-shadow-lg`), PlanCard 색 선 1px, Card 그림자 없음(`0 0 #0000`)을 함께 지정합니다
- 산출 CSS: 라이트 블록 `--axis-*` 116 · shadcn 20, 다크 블록 `--axis-*` 106 · shadcn 19
- 접근성: 문서 사이트 9페이지 x 라이트 · 다크 axe 위반 0(ontology 전용 예외 없음), 포커스 링 · 상태 아이콘 비텍스트 대비 3:1 이상(라이트 최소 4.53:1 · 다크 5.60:1)을 로컬에서 확인했습니다. 색 결정 일부(보정값, 상태 색 접기, 경고 단계, 에이전트 아바타 색 등)는 디자인 오너의 사후 확인을 기다리며, 확인 결과에 따라 이후 patch에서 값이 바뀔 수 있습니다(`brand.json`의 `a11y.status`에 같은 상태를 적었습니다)

#### tokens: 새 변수 (기본값은 기존 화면과 같음)
브랜드를 지정하지 않은 `variables.css`에는 아래 10개 변수만 `:root` · `.dark`에 새로 생깁니다. 1.2.1에 있던 변수 249개의 값은 바뀌지 않습니다.

| 변수 | 기본값 | 쓰는 곳 |
|---|---|---|
| `--axis-shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Tailwind `shadow-sm`) | `--axis-card-shadow` 기본값 |
| `--axis-shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` (Tailwind `shadow-lg`) | Dialog |
| `--axis-card-shadow` | `--axis-shadow-sm`과 같은 값 | Card |
| `--axis-plan-card-accent-width` | `4px` | PlanCard 왼쪽 색 선 |
| `--axis-status-{success,running,error,neutral-muted}-contrast` | `#FFFFFF` | 상태 바탕 위 글자 · 아이콘(RunProgress · StepTimeline · PlanCard) |
| `--axis-agent-message-user-text` | `#FFFFFF` | MessageBubble 사용자 말풍선 글자 |
| `--axis-agent-avatar-text` | `#FFFFFF` | AgentAvatar 이니셜 |

#### theme: ThemeProvider 브랜드
- `ThemeProvider`에 `defaultBrand?: string` · `brandStorageKey?: string`(기본 `"axis-brand"`), `useTheme()`에 `brand` · `setBrand` 추가
- 브랜드가 있으면 `<html data-brand="...">`를 붙이고 `localStorage`에 저장합니다. `setBrand(undefined)`는 속성과 저장값을 지웁니다. 기존 `theme` 동작은 바뀌지 않습니다

#### ui-react: Card · Dialog 그림자 변수
- Card는 `--axis-card-shadow`, DialogContent는 `--axis-shadow-lg`를 참조합니다(종전 Tailwind `shadow-sm` · `shadow-lg` 하드코딩). 기본 화면의 계산값은 같습니다
- `cn()`이 새 그림자 클래스(`shadow-[shadow:var(...)]`)를 그림자 그룹으로 병합하도록 규칙을 넓혔습니다. `className="shadow-none"` · `shadow-md` 등으로 기본 그림자를 덮어쓰는 결과는 종전과 같습니다

#### agentic-ui: 흰 글자 · 색 선 토큰과 옅은 바탕 복원 (기본 화면 일부 변화)
- 흰 글자 5곳(MessageBubble · PlanCard 승인 버튼 · StepTimeline 완료 아이콘 · RunProgress 단계 점 · AgentAvatar)과 PlanCard 색 선 두께가 위 새 변수를 참조합니다. 기본 화면은 같습니다
- Tailwind 3.4가 `bg-[var(...)]/10`처럼 임의값 `var()`에 불투명도 수식어를 붙인 클래스의 CSS를 만들지 않아, 1.2.1까지 아래 바탕 · 테두리가 투명했습니다. 1.3.0에서 의도한 모습으로 고쳐 **기본 화면이 바뀝니다**

| 컴포넌트 | 1.2.1 | 1.3.0 |
|---|---|---|
| PlanCard 상태 배지 (`pending` · `approved` · `rejected` · `executing` · `completed`) | 바탕 투명, 글자 `status-*-strong` | `badge-{warning,success,error,info}` 바탕 · 글자 (기본 브랜드 대비 라이트 4.57~5.49:1 · 다크 5.78~9.52:1) |
| PlanCard 거절 버튼 hover | 바탕 변화 없음 | `status-error` 10% 옅은 바탕 |
| DiffViewer 추가 · 삭제 줄 | 바탕 투명 | `diff-added` · `diff-removed` 10% 옅은 바탕 |
| FeedbackButtons 선택 상태 | 바탕 투명 | `status-success` · `status-error` 10% 옅은 바탕 |
| AttachmentCard `status="error"` | 기본 테두리(`border-default`) | `status-error-border` 테두리 |

옅은 바탕은 `color-mix(in srgb, <색> 10%, transparent)`로 만들며, `color-mix()`를 지원하지 않는 브라우저에서는 바탕이 1.2.1처럼 투명합니다.

#### 폐기 예정
- `--axis-card-shadow-default`(JS `CardShadowDefault`)는 폐기 예정입니다. 1.x 동안 이름과 값(`0 1px 3px 0 rgb(0 0 0 / 0.1)`)을 유지하지만, 배포된 어느 버전에서도 Card에 반영된 적이 없습니다. Card 그림자는 `--axis-card-shadow`로 조정해 주세요(가이드 예시 정정이며 동작 변경은 아닙니다). 토큰 원본에는 `$extensions.axis.deprecated` 마커가 붙습니다

#### 동작이 달라지는 사용 방식
- Card · Dialog 그림자가 tokens CSS 변수를 참조하므로, `@axis-ds/tokens/css`를 로드하지 않는 환경에서는 그림자가 없습니다
- 브랜드 CSS는 `@axis-ds/tokens/css` **다음에** import합니다. 앱이 shadcn 변수(`--primary` 등)를 직접 정의한다면(예: `globals.css`의 `:root`) 브랜드 CSS를 그 정의보다 뒤에 둬야 합니다. 라이트 `[data-brand]`와 `:root`의 명시도가 같아 나중에 온 쪽이 이깁니다
- 같은 요소에 `data-brand`와 `.dark`를 함께 붙이면, ontology 다크 블록에 없는 변수 10개 가운데 값이 달라지는 8개(radius 3 · 글꼴 2 · PlanCard 색 선 · Card 그림자 2)는 import 순서대로 브랜드 라이트 값이 다크에서도 유지됩니다

#### CI
- `check-token-refs` 판정 7: Tailwind가 CSS를 만들지 않는 클래스 패턴(임의값 `var()` + 불투명도 수식어)을 위반으로 잡습니다
- `pnpm check-contrast-pairs`: ontology 대비 짝 표와 컴포넌트 소스의 드리프트 검사
- `frontend.yml`: pack-smoke, Playwright a11y(4조합 36건, 기본 브랜드는 WI-0029 두 쌍만 노드 단위 기준선) · 비텍스트 대비 · AC6 계산 스타일 검사. 첫 배선은 결과만 보고하고, 결과를 확인한 뒤 실패 시 배포를 막는 게이트로 켭니다

### Breaking change
없습니다. 공개 export와 CSS 변수 이름 삭제 0건, 공개 API는 추가만 있습니다(브랜드 exports · `ThemeProvider` 옵션). 브랜드 미지정 출력은 npm 1.2.1 배포본 대비 `variables.css` `:root` · `.dark` 각 249개 값이 같고 새 변수 10개만 늘며, `shadcn-compat.css`는 바이트까지 같습니다(AC3 테스트). 다만 위 agentic-ui 표의 화면 변화와 「동작이 달라지는 사용 방식」을 확인해 주세요.

### 검증 (M3 시점)
- 2026-10-18 M3 브랜치(turbo `--force`, 캐시 0, build 를 먼저 단독 실행): build 8/8 · type-check 8/8 · lint 4/4 rc 0, test 5/5 rc 0(tokens 187 · ui-react 110 · agentic-ui 72 · cli 58 · theme 31 통과)
- `check-token-refs` 위반 0(검사 파일 68 · 참조 513, `:root` · `.dark` 259 · 미반영 0), `check-contrast-pairs` 위반 0(짝 9)
- 브랜드 미지정 `variables.css` · `shadcn-compat.css` sha256 `fa637a54…` · `dd374eca…`(ontology 브랜드 추가 전 빌드와 같음), AC3 테스트 통과
- `test:e2e:a11y`(정적 서버, 위 빌드의 `apps/web/out`) 36/36 통과
- 레지스트리 사본 content 와 src 대조 84/84 일치

> M4 에서 채울 것: 문서 사이트 브랜드 전환 데모(AC7) · 가이드 절, CI(게이트 켠 뒤) 결과, 배포 정보, 소비 프로젝트 영향. 레지스트리로 컴포넌트를 받는 소비자의 `cn()`(레지스트리에 utils 항목이 없음) 영향은 tailwind-merge 버전별 실측 뒤에만 적습니다

## 1.2.1 (patch) - 토큰 정합 (M1, PR #90) · 다크 component 토큰 (WI-0033)

> 대상: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme` 1.2.0 → 1.2.1 (linked)
> WI-0033(#99)은 changeset 없이 1.2.1 배포 전에 main에 머지해 같은 버전에 포함합니다. 상세는 [WI-0033 PRD](../WI-0033-dark-component-tokens/prd.md)
> 배포: 2026-10-17 10:49 KST, NPM_TOKEN 대신 npm Trusted Publishing(OIDC)으로 처음 발행했습니다(WI-0031, run 38992207088, provenance 4/4)

### 배경

1.2.0의 ui-react 컴포넌트 일부가 토큰 원본에 없는 CSS 변수(`--axis-surface-primary` · `--axis-ring` · `--axis-interactive-primary` 등 24종, 60곳)를 참조했습니다. 정의 없는 변수는 속성을 무효로 만들어 바탕이 투명해지거나 키보드 포커스 링이 사라졌습니다. agentic-ui는 primitive 색(`--axis-color-*`, 80곳)을 직접 참조해 테마가 바꿀 수 없었습니다.

### 변경 사항

#### tokens: semantic 토큰 추가 (기존 값 변경 없음)
- `interactive.primary` (체크 · 선택 · 진행 표시, 라이트 · 다크 #3B82F6)
- `status.*` 14개, `diff.*` 4개, `agent.*` 4개 (agentic-ui용, 값은 기존 참조와 동일)
- Alert용 `border.info` · `border.warning` · `icon.info`

#### ui-react: 화면이 바뀌는 컴포넌트 13개
| 컴포넌트 | 1.2.0 | 1.2.1 |
|---|---|---|
| Popover · DropdownMenu(Content · SubContent) · Sheet · Command | 바탕 투명 | `surface-default` 불투명 바탕 |
| Checkbox · RadioGroup · Switch · Slider · Textarea · Toggle · Sheet | 키보드 포커스 표시 없음 | `border-focus` 포커스 링 (라이트 #3B82F6 · 다크 #60A5FA) |
| Checkbox · RadioGroup · Switch · Slider | 선택 · 켜짐 상태 색 없음 | `interactive.primary` |
| Alert (info · success · warning · destructive) | 바탕 없음, 테두리가 글자색 | 상태별 semantic 바탕 · 글자 · 테두리, 다크에서는 어두운 상자. 아이콘은 변형 글자색을 따름 |
| Alert (default) · Textarea | 바탕 투명 | `surface-default` |
| Badge (secondary) | 바탕 없음 | `surface-secondary` 회색 바탕 |
| Progress | 채움 막대 투명 | default `surface-brand`, success · warning · error는 상태 색 |

라이트 Alert success · warning의 테두리 대비(2.18:1 · 1.85:1)는 상태를 전달하는 유일한 수단이 아닌 장식 요소라 WCAG 1.4.11 비텍스트 대비 대상에서 제외한다고 판단했습니다(글자 · 아이콘은 4.7:1 이상).

#### agentic-ui: 화면 변화 없음
13개 컴포넌트의 상태 · diff · 아바타 색을 semantic 토큰으로 교체했습니다. 라이트 · 다크 계산값이 1.2.0과 같음을 측정으로 확인했습니다. 버튼 글자의 `text-white` 4곳은 `--axis-button-text-default` · `--axis-button-destructive-text-default`(기본 #FFFFFF)로 바꿨습니다.

#### tokens: 다크 모드 component 토큰 재정의 (WI-0033)
1.2.0까지 다크 빌드가 component 토큰을 빼고 있어, `variables.css`의 `.dark`에 component 변수 45개(button · input · card · badge · dialog)가 없었습니다. 그래서 다크에서도 라이트 값이 그대로 쓰여 Card · Dialog 바탕이 흰색으로 남았습니다. 1.2.1부터 `.dark`가 45개를 모두 재정의하고, 그중 29개의 다크 값이 바뀝니다. WI-0033 은 라이트 출력을 바꾸지 않습니다. M1 반영 빌드 3b52976 대비 `variables.css`의 `:root` 블록과 나머지 산출물 9개(JS · JSON · d.ts · `shadcn-compat.css` · tailwind preset)의 sha256 이 일치합니다. 1.2.0 대비 `:root`가 달라지는 부분은 M1(f465d2b, 위 tokens 항목)에서 온 것입니다(v1.2.0..3b52976 에서 토큰 소스를 바꾼 커밋은 f465d2b 하나입니다).

| 소비처 (다크) | 1.2.0 | 1.2.1 |
|---|---|---|
| ui-react Card · Dialog | 흰 바탕, 제목 대비 1.10:1 · 설명 2.54:1 | `surface-default` 바탕, 18.30:1 · 7.93:1 |
| agentic-ui ApprovalCard · PlanCard secondary 버튼 | 바탕과 글자가 같은 색 (1.00:1) | 16.12:1 |
| ui-react Button ghost · secondary | ghost 글자 1.95:1, secondary 밝은 회색 바탕 | ghost 글자 13.66:1, secondary 어두운 바탕 |
| ui-react Input · Select 트리거 | 흰 입력칸, placeholder 2.54:1 | 어두운 입력칸, placeholder 7.93:1, 테두리 · 포커스 · 오류 테두리 다크 값 |
| ui-react Badge 6변형 | 밝은 칩 | 어두운 바탕 · 밝은 글자 칩 (대비 5.78~12.04:1) |

바뀌지 않는 것: primary · destructive 채움 버튼 바탕과 흰 글자, `transparent` 테두리, Dialog 오버레이, 그림자는 다크에서도 같은 값입니다(채움 버튼 대비 3.68 · 3.76:1은 WI-0029에서 다룹니다).

하위 요소에 `.dark`를 거는 구성(`<div class="dark">`)에서는 이제 기본 다크 component 값이 브랜드 라이트 component 값보다 우선합니다. semantic 토큰이 1.2.0부터 이미 이렇게 동작하므로 같은 규칙입니다.

component 토큰 JSON에는 `$extensions.axis.dark`(다크 값) 또는 `$extensions.axis.themeIndependent`(테마 무관) 선언이 붙습니다. 이 확장은 `tokens.json` · `tokens.js` 출력에는 나타나지 않습니다.

#### 동작이 달라지는 사용 방식
`:root { --axis-color-blue-500: ... }`처럼 primitive 색을 덮어써 브랜드 색을 바꾸던 방식(`theme-customization.md` 92~97행 안내)은 이제 agentic-ui에도 닿지 않습니다. semantic · component 토큰은 빌드 때 값으로 풀려 나가므로, 1.2.0에서도 이 방식이 닿던 곳은 agentic-ui뿐이었습니다. 1.3.0의 브랜드 축(`data-brand`)이 대체 수단이며, 가이드는 1.3.0(M4)에서 고칩니다.

#### CI
- `pnpm check-token-refs`: ui-react · agentic-ui의 `var(--axis-*)`가 모두 정의됐는지, agentic-ui에 primitive 참조가 없는지 검사 (frontend · publish 워크플로)
- 같은 검사에 다크 완전성 추가 (WI-0033): `variables.css`의 `:root` 이름 집합과 `.dark` 이름 집합이 같은지, 다크 값이 라이트와 달라야 하는 component 토큰의 `.dark` 값이 실제로 다른지, component 색 토큰이 다크 값 또는 테마 무관을 선언했는지. 선언 검사는 토큰 빌드에서도 실행되어 누락 시 빌드가 실패합니다
- `pnpm --filter @axis-ds/tokens test` 신설(CI `pnpm test`에 포함), `pnpm --filter @ax/web test:e2e:tokens`(Chromium 계산값 회귀, 로컬 실행)

### 소비 프로젝트 영향 (2026-10-15 확인)
| 프로젝트 | 설치 버전 | 영향 컴포넌트 사용처 |
|---|---|---|
| RFP-X | tokens · ui-react 1.1.2 (정확 버전 고정) | Badge secondary 1곳 |
| Discovery-X | tokens · theme · ui-react 1.1.1 (정확 버전 고정) | Badge secondary 7곳, Textarea 3곳 |

두 프로젝트 모두 정확 버전을 고정해 1.2.1이 자동으로 반영되지 않습니다. 업그레이드 시 Badge secondary에 회색 바탕이, Textarea에 바탕과 포커스 링이 생깁니다. Minu는 로컬에서 확인하지 못했습니다.

### 검증
- type-check · lint · test · build (turbo `--force`, 캐시 0): ui-react 100 · agentic-ui 72 · cli 58 · theme 21 통과
- `check-token-refs`: 1.2.0 소스에서 위반 140건(정의 누락 60 · primitive 80) 재현, 1.2.1에서 0건. 정의 1줄 삭제 · 판정 fixture · 측정 실패 대조군 통과. CI 로그에서 단계 실행 확인
- 화면 비교(Playwright 하네스, 라이트 · 다크 · 포커스 208장): ui-react 13개 변화가 plan 1.3 대상 값과 일치, agentic-ui 13개 차이 0
- Breaking change 없음: 공개 export와 기존 CSS 변수 이름 삭제 0건, 화면 변화는 정의 누락 보완분뿐
- WI-0033 (2026-10-16): M1 반영 빌드 3b52976 대비 tokens dist 10개 중 `variables.css`만 변경(나머지 9개 sha256 일치), `:root` 블록 바이트 동일, `.dark` 204 → 249(삭제 0 · 추가 45). Chromium 계산값: 라이트 component 45개가 3b52976 고정 기준값과 같음, `html.dark` · `div.dark` 변경 29개의 이름과 다크 값이 기대 맵과 같음. preprocessor를 뺀 변이 빌드에서 Chromium 다크 단언 2건 실패, `check-token-refs` rc 1(다크 값 미반영 29) 확인. type-check · build · test(turbo `--force`, 캐시 0, build 를 먼저 단독 실행): tokens 16 · ui-react 100 · agentic-ui 72 · cli 58 · theme 21 통과
