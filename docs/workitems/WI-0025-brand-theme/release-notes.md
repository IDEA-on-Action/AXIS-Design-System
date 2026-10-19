# WI-0025 릴리스 노트: 브랜드 테마 축 도입과 온톨로지 테마

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | TODO: [todo.md](./todo.md)

## 1.3.0 (minor) - 브랜드 테마 축 (M2) · 온톨로지 프리셋 (M3) · 브랜드 전환 데모와 가이드 (M4)

> 대상: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme` 1.2.1 → 1.3.0 (linked)
> 배포: (배포 후 기입: 일시 KST · Version Packages PR · publish run id · provenance N/4 · `npm view` 4패키지 1.3.0 · dist-tags latest)

### 배경

1.2.1까지 AXIS는 라이트 · 다크 한 벌의 색만 가졌고, 다른 제품이 자기 색을 쓰려면 primitive 색 변수를 덮어써야 했습니다(1.2.1부터는 agentic-ui에도 닿지 않음). 1.3.0은 테마(라이트 · 다크)와 독립된 **브랜드 축**(`data-brand`)을 더하고, 첫 브랜드로 온톨로지 플랫폼 프리셋(`ontology`)을 함께 냅니다. 브랜드를 지정하지 않으면 1.2.1과 같은 화면입니다.

### 변경 사항

#### tokens: 브랜드 빌드 (M2)
- 브랜드 소스 `src/brands/<brand>/{light,dark,brand}.json`을 빌드하면 `dist/css/brands/<brand>.css`가 생깁니다. 브랜드 값은 이 파일에만 있고 `variables.css`에는 들어가지 않습니다
- 선택자: 라이트 `[data-brand="<brand>"][data-brand="<brand>"]`(명시도 (0,2,0), 아래 「동작이 달라지는 사용 방식」 참고), 다크 `[data-brand="<brand>"].dark` · `[data-brand="<brand>"][data-theme="dark"]` · `.dark [data-brand="<brand>"]`
- 메타데이터 `dist/brands/<brand>/brand.json`(name · description · themes · a11y)과 브랜드 목록 `dist/brands/index.json`(`{ "brands": [{ "name", "css", "meta" }] }`, 이름순)
- 브랜드 JSON 검증(파일 구성 · 기본 토큰 경로 존재 · 라이트/다크 짝 · 변수명 충돌 · shadcn 값 형식 등)에 실패하거나 브랜드에 맞는 `package.json` exports 항목이 없으면 빌드가 실패합니다

#### tokens: ontology 브랜드 프리셋 (M3)
- 사용: `import "@axis-ds/tokens/css"` 다음에 `import "@axis-ds/tokens/css/brands/ontology"`, 그리고 `<html data-brand="ontology">`(또는 하위 컨테이너). 다크는 기존 `.dark` · `data-theme="dark"`를 그대로 씁니다
- 새 exports: `./css/brands/ontology`, `./brands/ontology/brand.json`, `./brands`(목록)
- 값의 출처는 디자인 시스템 「온톨로지 플랫폼」 v1입니다. 라이트는 WCAG AA를 맞추려고 보조 글자 한 값(`sub` #6B7280 → #5F6673)만 보정했고, 다크는 원본 그대로입니다
- AXIS의 상태 의미는 v1의 상태 다섯 가지로 접습니다: success → 회색 계열, warning · error → `bad` 계열(바탕은 연한 단계), running · info → `key` 계열. 상태가 색만으로 구분되지 않으므로, 상태는 글자 · 아이콘과 함께 표시해 주세요
- 글꼴(`Pretendard Variable` · `JetBrains Mono` 우선), `--radius: 12px`, 그림자(`--axis-shadow-sm` · `--axis-shadow-lg`), PlanCard 색 선 1px, Card 그림자 없음(`0 0 #0000`)을 함께 지정합니다
- 산출 CSS: 라이트 블록 `--axis-*` 117 · shadcn 20, 다크 블록 `--axis-*` 107 · shadcn 19
- 접근성: 문서 사이트 10페이지 x 라이트 · 다크 axe 위반 0(ontology 전용 예외 없음)을 확인했습니다. 10페이지에는 실제 ui-react · agentic-ui 컴포넌트를 그리는 브랜드 전환 데모 페이지가 들어 있습니다(M3 시점에는 9페이지). 포커스 링(Input · Button)은 비텍스트 대비 3:1 이상(ontology 라이트 4.66:1 · 다크 6.69:1)입니다. 상태 표식은 브랜드 전환 데모 페이지에서 agentic-ui 실제 컴포넌트(PlanCard 단계 아이콘 · StepTimeline 점과 글리프 · RunProgress 점과 글리프)가 그린 요소를 실제 부모 바탕 위에서 잽니다. 판정은 정지 상태의 주 표식(상태 아이콘 · 실행 중 스피너의 arc · 상태 점 · 점 안 글리프, 단 대기 · 건너뜀 상태 점은 아래 하한 판정)만 3:1로 하며(2026-10-19 결정), ontology는 라이트 최소 3.55:1 · 다크 4.50:1(실행 중 스피너 arc, 반투명 도형을 실제로 겹치는 순서대로 합성한 값)로 3:1 판정 대상이 모두 통과합니다. 실행 중 스피너의 트랙 원(opacity .25, 1.34~1.58:1) · 깜빡이는 점의 가장 흐린 시점(1.77~2.53:1) · PlanCard 왼쪽 상태 선 · 진행 막대 채움 · RunProgress 머리 점은 재서 기록만 합니다. 데모에 실제 요소가 없는 쌍(info · warning 아이콘, `surface-secondary` 위 아이콘 · 대기 점)은 같은 페이지에 넣은 프로브로 계속 재며(ontology 라이트 최소 4.53:1 · 다크 5.60:1), 측정 대상이 M3 프로브보다 줄지 않았는지 검사합니다. 기본 브랜드(1.2.1과 같은 값)는 라이트 success 2.28:1 · neutral 2.54:1 · 실행 중 스피너 arc 2.83:1 · RunProgress 실행 중 글리프 arc 2.97:1, 라이트 · 다크 흰 체크 글리프 2.28:1처럼 3:1에 못 미치는 주 표식이 있어, 1.3.0에서는 값을 바꾸지 않고 이번 측정값을 하한으로 고정했습니다(측정값이 낮아지면 CI 실패, 해소는 WI-0029 #94). 대기 · 건너뜀 상태 점(`status-neutral-muted`, StepTimeline · RunProgress)은 3:1에 못 미칩니다. 라이트 #D6DADF는 `surface-default` 위 1.40:1 · `surface-secondary` 위 1.28:1 · 페이지 바탕(`--background` #F7F7F7) 위 1.31:1, 다크 #5F6874는 3.12:1 · 2.83:1 · 3.37:1(#0E1013)로 3:1에 못 미치는 바탕이 있으며, 값을 바꿀지는 디자인 오너 사후 확인 대상입니다(기본 테마 gray-300도 1.47:1로 같은 수준). 색 결정 일부(보정값, 상태 색 접기, 경고 단계, 에이전트 아바타 색 등)는 디자인 오너의 사후 확인을 기다리며, 확인 결과에 따라 이후 patch에서 값이 바뀔 수 있습니다(`brand.json`의 `a11y.status`에는 M3 시점(문서 사이트 9페이지 기준) 상태가 적혀 있습니다)

#### tokens: 새 변수 (기본값은 기존 화면과 같음)
브랜드를 지정하지 않은 `variables.css`에는 아래 11개 변수만 `:root` · `.dark`에 새로 생깁니다. 1.2.1에 있던 변수 249개의 값은 바뀌지 않습니다.

| 변수 | 기본값 | 쓰는 곳 |
|---|---|---|
| `--axis-shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Tailwind `shadow-sm`) | `--axis-card-shadow` 기본값 |
| `--axis-shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` (Tailwind `shadow-lg`) | Dialog |
| `--axis-card-shadow` | `--axis-shadow-sm`과 같은 값 | Card |
| `--axis-plan-card-accent-width` | `4px` | PlanCard 왼쪽 색 선 |
| `--axis-plan-card-reject-hover-text` | `--axis-status-error`와 같은 값(`#EF4444`) | PlanCard 거절 버튼 hover 글자 |
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
| PlanCard 거절 버튼 hover | 바탕 변화 없음 | `status-error` 10% 옅은 바탕, 글자는 새 component 토큰 `--axis-plan-card-reject-hover-text`(기본 브랜드는 `status-error`와 같은 값이라 글자 불변. ontology는 `status-error-strong`과 같은 값 라이트 #A8281F · 다크 #F49890으로 바꿔, 하단 영역 `surface-secondary` 위 옅은 바탕에서 라이트 5.53:1 · 다크 6.36:1. 종전 `status-error` 글자였다면 라이트 4.17:1로 4.5 미달) |
| DiffViewer 추가 · 삭제 줄 | 바탕 투명 | `diff-added` · `diff-removed` 10% 옅은 바탕 |
| FeedbackButtons 선택 상태 | 바탕 투명 | `status-success` · `status-error` 10% 옅은 바탕 |
| AttachmentCard `status="error"` | 기본 테두리(`border-default`) | `status-error-border` 테두리 |

옅은 바탕은 `color-mix(in srgb, <색> 10%, transparent)`로 만들며, `color-mix()`를 지원하지 않는 브라우저에서는 바탕이 1.2.1처럼 투명합니다.

#### 문서 사이트: 브랜드 전환 데모 (M4)
- 문서 사이트 `/docs/brand-demo/`(사이드바 「Brand Theme」)에서 브랜드(기본 · Ontology)와 테마(시스템 · 라이트 · 다크)를 바꾸며 실제 패키지 컴포넌트(Button · Card · Input · Badge · Alert · PlanCard · MessageBubble · StepTimeline · RunProgress)의 변화를 볼 수 있습니다. 브랜드는 `<html data-brand>`를 직접 붙이고 지우며, 페이지를 떠나면 지워 다른 문서 페이지는 기본 브랜드 그대로입니다(패키지 변경 없음)

#### 가이드 (M4)
- `docs/guides/theme-customization.md`에 「4. 브랜드 테마」 절을 더했습니다: import 순서, `ThemeProvider`의 `defaultBrand` · `brandStorageKey`와 `useTheme()`의 `brand` · `setBrand`, 선택자와 다크 구성, Provider 없이 적용하는 방법과 첫 화면, ontology 프리셋의 값 출처와 접근성 보정 내역(디자인 오너 사후 확인 대기)
- 같은 문서 「5. 커스텀 테마 생성」(종전 4절)을 브랜드 선택자 예시와 tokens 패키지 브랜드 추가 절차로 바꿨습니다
- primitive 색 오버라이드 안내를 고쳤습니다(`theme-customization.md` 2절, `component-usage.md` 「테마 커스터마이징」). primitive 색 오버라이드가 닿는 곳은 ui-react Progress의 `success` · `warning` · `destructive` 채움과 앱 코드의 직접 참조뿐이라고 적고, 예시를 시맨틱 · component 토큰과 `--radius`로 바꿨습니다

#### 폐기 예정
- `--axis-card-shadow-default`(JS `CardShadowDefault`)는 폐기 예정입니다. 1.x 동안 이름과 값(`0 1px 3px 0 rgb(0 0 0 / 0.1)`)을 유지하지만, 배포된 어느 버전에서도 Card에 반영된 적이 없습니다. Card 그림자는 `--axis-card-shadow`로 조정해 주세요(가이드 예시 정정이며 동작 변경은 아닙니다). 토큰 원본에는 `$extensions.axis.deprecated` 마커가 붙습니다

#### 동작이 달라지는 사용 방식
- Card · Dialog 그림자가 tokens CSS 변수를 참조하므로, `@axis-ds/tokens/css`를 로드하지 않는 환경에서는 그림자가 없습니다
- Card · DialogContent에 그림자 색 수식어만 붙인 경우(`className="shadow-black/50"`, `shadow-blue-500/20` 등) 1.3.0에서는 색이 바뀌지 않습니다. 종전 `shadow-sm` · `shadow-lg`는 `--tw-shadow-colored`에 `var(--tw-shadow-color)` 자리가 있어 색 수식어가 적용됐지만, 새 클래스 `shadow-[shadow:var(--axis-card-shadow)]` · `shadow-[shadow:var(--axis-shadow-lg)]`는 Tailwind 3.4가 값을 분해하지 못해 `--tw-shadow-colored`가 변수 값 그대로입니다. `cn()`은 두 클래스를 모두 남기므로 병합 문제가 아니라 CSS 생성 방식의 차이입니다. 대안: ① 크기 클래스와 색을 함께 지정(`shadow-sm shadow-black/50`, `cn()`이 기본 그림자 클래스를 크기 클래스로 바꿔 종전처럼 색이 적용됨) ② 변수 재정의(Card `[--axis-card-shadow:0_1px_2px_0_rgb(0_0_0/0.5)]`, Dialog는 `--axis-shadow-lg`, 또는 앱 CSS에서 범위를 정해 재정의). 확인 범위: Tailwind 3.4.19가 만든 CSS와 `cn()` 병합 결과이며, 브라우저 계산 스타일은 실측하지 않았습니다
- 브랜드 CSS는 `@axis-ds/tokens/css` 다음에 import하는 것을 권장하지만, 순서가 달라도 브랜드 값이 이깁니다. 라이트 선택자가 같은 속성을 두 번 쓴 `[data-brand="<brand>"][data-brand="<brand>"]`라 명시도가 (0,2,0)이고, 기본 `:root` · `.dark`와 앱이 직접 정의한 shadcn 변수(예: `globals.css`의 `:root` · `.dark`)는 (0,1,0)이기 때문입니다. 그래서 브랜드 CSS를 `globals.css` 맨 앞에 `@import`해도 됩니다. 다크 선택자 3종도 (0,2,0)이라 라이트와 같고, 같은 파일에서 다크 블록이 뒤에 있어 다크가 이깁니다. `:root[data-brand]`로 올리지 않은 것은 하위 컨테이너(`<div data-brand>`)에도 맞게 하려는 것입니다. 앱이 브랜드 값을 다시 덮으려면 (0,2,0)보다 높은 선택자이거나 같은 명시도로 브랜드 CSS 뒤에 둬야 합니다
- `@axis-ds/theme`의 공개 타입 `ThemeContextValue`에 필수 멤버 `brand: string | undefined` · `setBrand: (brand: string | undefined) => void`가 늘었습니다. 런타임 동작은 추가만이지만, `ThemeContextValue` 타입으로 값을 직접 만드는 경우(테스트 mock, 자체 Provider 등)에는 `brand` · `setBrand`가 필요합니다. 두 멤버를 채우지 않으면 TypeScript 컴파일 오류가 납니다(2026-10-19 결정: Breaking change로 분류하지 않음)
- 같은 요소에 `data-brand`와 `.dark`를 함께 붙이면, ontology 라이트 블록에만 있고 다크 블록에 없는 변수 11개(`--axis-*` 10 · shadcn `--radius` 1) 가운데 기본 `.dark`(`variables.css` · `shadcn-compat.css`)와 값이 달라지는 9개(`--axis-radius-sm|md|lg` 3 · 글꼴 2 · PlanCard 색 선 · Card 그림자 2 · shadcn `--radius` 12px)는 브랜드 라이트 값이 다크에서도 유지됩니다(라이트 (0,2,0)가 기본 `.dark` (0,1,0)를 이김). 나머지 2개(`button-border-default` · `button-ghost-bg-default`)는 양쪽 모두 `transparent`라 화면 차이가 없습니다

#### CI
- `check-token-refs` 판정 7: Tailwind가 CSS를 만들지 않는 클래스 패턴(임의값 `var()` + 불투명도 수식어)을 위반으로 잡습니다
- `pnpm check-contrast-pairs`: ontology 대비 짝 표와 컴포넌트 소스의 드리프트 검사
- `frontend.yml`: pack-smoke, Playwright a11y(4조합 40건 = 10페이지 x 4, 조합별 10건. 기본 브랜드는 WI-0029 두 쌍만 노드 단위 기준선이고, 브랜드 전환 데모 경로에만 기본 브랜드 토큰 결함 쌍 기준선 라이트 2 · 다크 4노드를 더함, PRD AC8 변경 주석. M3 시점에는 9페이지 36건) · 비텍스트 대비 · 브랜드 전환 데모(AC7, 8건) · AC6 계산 스타일 검사. 첫 실행(run 39072471115)을 확인한 뒤 2026-10-18 게이트로 켰고, M4 에서 더한 데모 step 은 처음부터 게이트입니다. 네 E2E step 중 하나라도 실패하면 `ci` job이 실패해 배포를 막습니다

### Breaking change
없습니다. 공개 export와 CSS 변수 이름 삭제 0건이고, 공개 API는 추가만 있습니다(브랜드 exports · `ThemeProvider` 옵션 · `useTheme()` 반환값). 다만 위 agentic-ui 표의 화면 변화와 「동작이 달라지는 사용 방식」(특히 `ThemeContextValue` 필수 멤버)을 확인해 주세요. tokens ESM 엔트리 `dist/js/tokens.mjs`는 비교하지 못했습니다(아래 「비교하지 못한 것」, WI-0035 #113 에서 수정). 판정은 같은 값을 내는 CJS · JSON 비교로 했습니다(2026-10-19 결정).

근거(2026-10-19, HEAD 3c74992, `pnpm turbo run build --force` 8/8 · 캐시 0 뒤의 dist 를 `npm pack`으로 받은 npm 1.2.1 배포본 4개와 비교. tokens tgz shasum `2332e344…`는 AC3 기준선 `SOURCE.json`과 같음):
- CSS: 브랜드 미지정 `variables.css`의 `:root` · `.dark` 각각 1.2.1 변수 249개 중 같음 249 · 변경 0 · 삭제 0, 추가 11(위 새 변수 표). `shadcn-compat.css`는 바이트까지 같음(`cmp` rc 0). AC3 테스트는 아래 tokens 테스트 217건에 포함
- tokens JS · JSON: `dist/json/tokens.json`과 CJS `dist/js/tokens.js`의 leaf 각 249개 같음 · 변경 0 · 삭제 0, 추가 11. `dist/js/tokens.d.ts`는 삭제 줄 0(키 추가만)
- exports subpath: tokens 5 → 8(추가 `./brands` · `./css/brands/ontology` · `./brands/ontology/brand.json`), ui-react 31 · agentic-ui 13 · theme 1은 같음, 삭제 0
- 런타임 export 이름(subpath마다 CJS 엔트리를 require, 건너뜀 0): ui-react 245 · agentic-ui 30 · theme 2개가 1.2.1과 같음(삭제 0 · 추가 0)
- 타입 선언(`dist/**/*.d.ts` 파일별 비교): agentic-ui 19개 차이 0, ui-react 31개 중 `sheet/index.d.ts` 1개(`side` 유니온 순서만 다르고 같은 타입), theme `index.d.ts`는 `ThemeProviderProps` 선택 속성 2개(`defaultBrand?` · `brandStorageKey?`)와 `ThemeContextValue` 필수 멤버 2개(`brand` · `setBrand`) 추가
- 비교하지 못한 것: tokens ESM 엔트리 `dist/js/tokens.mjs`(exports `.`의 `import` 조건)는 1.2.1 배포본부터 `as const`가 남아 `node --check`에서 문법 오류입니다(1.3.0 회귀가 아니며 생성 위치는 `build-tokens.mjs`). 같은 값을 내는 CJS · JSON으로 비교했고, ESM 엔트리 자체의 동등성은 확인하지 않았습니다. 이 문법 오류는 WI-0035(#113)에서 고칩니다. 1.3.0은 `tokens.mjs`를 바꾸지 않습니다(2026-10-19 결정)

### 소비 프로젝트 영향 (2026-10-19 확인)
| 프로젝트 (원격 기준) | 선언 · lock | 영향 패턴 사용처 |
|---|---|---|
| RFP-X (origin/master 6c6329c, 2026-09-28) | 루트 `pnpm.overrides` tokens · ui-react `1.1.2`, `packages/web` agentic-ui · tokens · ui-react `^1.1.2`, `packages/ui` tokens `^1.1.2`, lock agentic-ui · tokens · ui-react 1.1.2, tailwindcss `^4` | 0 |
| Discovery-X (origin/master 85b6ef2, 2026-10-09) | theme · tokens · ui-react `1.1.1` 정확 고정, lock 1.1.1, tailwindcss `^4.1.18`, tailwind-merge `^3.4.0` | 0 (`@axis-ds/theme`의 `useTheme()` 3파일 · `ThemeProvider` 1파일을 쓰지만 `ThemeContextValue` 참조 0, 테스트의 `vi.mock("@axis-ds/theme")` 1곳은 타입을 쓰지 않음) |

영향 패턴은 그림자 색 수식어(`shadow-<색>/N`), `ThemeContextValue`, `--axis-card-shadow-default` · `CardShadowDefault`, `data-brand` 네 가지이고, 양성 대조로 같은 트리에서 `@axis-ds/*` import 파일(RFP-X 59 · Discovery-X 17)이 잡히는 것을 확인했습니다. 두 프로젝트 모두 lock이 1.1.x를 고정해 1.3.0이 자동으로 반영되지 않습니다. RFP-X의 agentic-ui는 `^1.1.2` 범위 선언이고 override가 없어(1.2.1 절의 「정확 버전 고정」 표기는 agentic-ui에는 맞지 않음), lock을 다시 만들면 agentic-ui만 1.3.0으로 올라갈 수 있습니다. 이때 override로 1.1.2에 묶인 tokens · ui-react와의 조합 동작은 확인하지 않았습니다. 두 프로젝트 모두 Tailwind 4라 위 「동작이 달라지는 사용 방식」의 Tailwind 3.4.19 기준 분석은 그 환경에서 확인하지 않았습니다. 확인 범위는 로컬에 체크아웃된 두 레포이고, Minu는 범위 밖입니다.

### 검증 (M3 시점)
- 2026-10-18 M3 브랜치 95e8547(PlanCard 거절 버튼 hover 글자 토큰 반영 뒤, turbo `--force`, 캐시 0, build 를 먼저 단독 실행): build 8/8 · type-check 8/8 · lint 4/4 rc 0, test 5/5 rc 0(tokens 190 · ui-react 110 · agentic-ui 72 · cli 58 · theme 31 통과)
- `check-token-refs` 위반 0(검사 파일 68 · 참조 514, `:root` · `.dark` 260 · 미반영 0), `check-contrast-pairs` 위반 0(짝 10)
- 브랜드 미지정 `variables.css` · `shadcn-compat.css` sha256 `e3ced2d8…` · `dd374eca…`. `variables.css`는 npm 1.2.1 배포본 대비 `:root` · `.dark` 각 값 변경 0 · 삭제 0 · 추가 11(위 새 변수 표), `shadcn-compat.css`는 1.2.1과 바이트까지 같음, AC3 테스트 통과
- `test:e2e:a11y`(정적 서버, 위 빌드의 `apps/web/out`) 36/36 통과(M3 시점 9페이지. M4 수치는 아래 「검증 (M4)」)
- `test:e2e:a11y`(정적 서버, 위 빌드의 `apps/web/out`) 36/36 통과
- 2026-10-19 라이트 선택자 (0,2,0) 상향 뒤(M3 브랜치 17e4427 위, turbo `--force` 캐시 0): dist 13파일 중 `css/brands/ontology.css` 만 바뀌고 차이는 라이트 선택자 1줄(sha256 `f06a96e4…` → `d69437fe…`), 나머지 12파일(`variables.css` `e3ced2d8…` · `shadcn-compat.css` `dd374eca…` · js · json · tailwind preset) 바이트 동일. tokens test 217/217, type-check 4/4 · lint 4/4 rc 0, `test:e2e:a11y`(E2E_SERVER=static, chromium) 36/36, `test:e2e:nontext` 6/6, `test:e2e:tokens` 22/22(brand 18 · dark 4, 「프로젝트 `:root`가 브랜드 뒤」 갈래 5 추가), `check-token-refs` · `check-contrast-pairs` 위반 0. 음성 대조: 종전 선택자 dist 로 tokens E2E 를 돌리면 라이트 `html[data-brand]` · 프로젝트 `:root` 뒤 갈래 1건 실패. 앱 층: `layout.tsx`에서 브랜드 import 를 tokens 와 `globals.css` 사이로 옮겨 빌드해도(종전 U11 음성 대조, 라이트 9건 실패) a11y 36/36 통과(확인 뒤 되돌림)
- 레지스트리 사본 content 와 src 대조 84/84 일치(a8fe0a0 시점). 95e8547 뒤 PlanCard 사본 3벌(`public/r` · `apps/web/public/r` · `packages/axis-agentic-ui/registry/r`)이 src 와 일치

### 검증 (M4)
- 2026-10-19 M4 브랜치 3c74992(데모 진입 헬퍼 · 가이드 반영 뒤. 이후 커밋은 문서 · changeset만 바꿈): `pnpm turbo run build --force` 8/8(캐시 0)을 먼저 단독 실행한 뒤 type-check 8/8 · lint 4/4 · test 5/5(각 `--force`, 캐시 0) rc 0, tokens 217 · ui-react 110 · agentic-ui 72 · cli 58 · theme 31 통과(skipped 0)
- `check-token-refs` 위반 0(검사 파일 68 · 참조 514, `:root` · `.dark` 260 · 미반영 0), `check-contrast-pairs` 위반 0(소스 짝 14 · 표 짝 14), `pnpm pack-smoke` 6개 패키지 통과
- 브랜드 미지정 `variables.css` · `shadcn-compat.css` sha256 `e3ced2d8…` · `dd374eca…`(M3 기록과 같음)
- E2E(`E2E_SERVER=static`, 위 빌드의 `apps/web/out`, Chromium Desktop Chrome 1280x720, Playwright 1.61.1): `test:e2e:a11y` 40/40(조합별 10건) · `test:e2e:demo` 8/8 · `test:e2e:nontext` 6/6 · `test:e2e:tokens` 17/17 통과. nontext 6건은 M3 프로브 spec 기준입니다
- 2026-10-19 비텍스트 실요소 spec 반영 뒤 재측정(HEAD 6817df7 위 변경, `pnpm turbo run build --filter=@ax/web... --force` 4/4 캐시 0, 같은 static 조건): `test:e2e:nontext` 8/8(포커스 링 ontology 2조합 x 2 + 상태 표식 4조합 x 1) · `test:e2e:demo` 8/8 · `test:e2e:a11y` 40/40 · `test:e2e:tokens` 17/17 통과. CI 건수 가드는 nontext 8건과 조합별 건수를 봅니다
- 기본 브랜드 기준선: WI-0029 두 쌍 라이트 · 다크 각 7페이지 20노드, 데모 경로 기준선 라이트 2 · 다크 4노드(상한과 같음). ontology 20건 위반 0
- `pnpm changeset status --verbose`: minor 로 `@axis-ds/tokens` · `ui-react` · `agentic-ui` · `theme` 1.3.0(linked), cli · mcp 없음, major 없음. private 예제 `axis-nextjs-example`은 내부 의존성 갱신으로 patch(0.1.4 → 0.1.5, npm 배포 대상 아님)
- CI: 마지막으로 push 된 34d7bca 의 PR #110 `Frontend CI/CD` run 39100155713 success. 그 뒤 커밋은 push 전이라 CI 결과가 없고, 머지 전 PR #110 run 으로 확인합니다
- 2026-10-19 M3 라이트 선택자 (0,2,0) 상향(94f3b33 · 90df600) 병합 뒤 재측정(병합 커밋 7a0bc8c, `pnpm turbo run build --force` 8/8 캐시 0을 먼저 단독 실행한 뒤 type-check 8/8 · lint 4/4 · test 5/5 각 `--force` 캐시 0, rc 0): tokens 217 · ui-react 110 · agentic-ui 72 · cli 58 · theme 31 통과(skipped 0). dist `variables.css` · `shadcn-compat.css` sha256 `e3ced2d8…` · `dd374eca…`(AC3, 위 기록과 같음), `css/brands/ontology.css` `d69437fe…`(M3 기록과 같음, 라이트 선택자 `[data-brand="ontology"][data-brand="ontology"]`). `check-token-refs` · `check-contrast-pairs` 위반 0. E2E(`E2E_SERVER=static`, Chromium, Playwright 1.61.1, 포트 3101 이 비어 있음을 확인하고 이 브랜치 `apps/web/out`을 직접 서빙, 서빙 `index.html` 해시가 `out/index.html`과 같음): `test:e2e:a11y` 40/40 · `test:e2e:demo` 8/8 · `test:e2e:nontext` 8/8 · `test:e2e:tokens` 22/22(「프로젝트 `:root`가 브랜드 뒤」 갈래 5건 포함) 통과, `playwright --list` 기본 설정 전체 78건(40 + 8 + 8 + 22). `frontend.yml` 「E2E 실행 건수 가드」 run 블록을 이 결과 JSON 에 돌리면 rc 0(a11y 40 · nontext 8 · tokens 22 · demo 8, 조합별 건수 일치), 구판 기대값(tokens:17)은 rc 1 `tokens: 실행 22건`
- 레지스트리로 컴포넌트를 받는 소비자의 `cn()`(레지스트리에 utils 항목이 없음) 영향과 Tailwind 4 환경의 그림자 클래스 동작은 실측하지 않았습니다

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
