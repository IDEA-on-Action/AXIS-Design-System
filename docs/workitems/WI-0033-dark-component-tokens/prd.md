# WI-0033: 다크 모드 component 토큰 재정의 누락 해소 PRD

> 작성일: 2026-10-16 | 버전: v1.0 (2026-10-16) | 작성자: Sinclair Seo | WI: WI-0033 | GitHub: #99 | 상태: Approved (2026-10-16 결정 반영)
> 선행: 없음. 기준 `origin/main` 3b52976 (`@axis-ds/*` 1.2.1 버전 표기, npm 미배포)
> 관련: WI-0025 M2(`feat/wi-0025-m2-brand-axis`) · M3(`feat/wi-0025-m3-ontology`)가 이 수정 위로 rebase 됩니다
> 후속: WI-0025 M3 머지(다크 PlanCard 배지 · Card 표시가 이 WI에 의존)

---

## 1. 개요

### 1.1 배경
- WI-0025 M3에서 문서 사이트(`apps/web`)가 AXIS 토큰 CSS를 실제로 import하면서, 다크 모드의 Card 바탕이 흰색으로 남는 결함이 처음 화면에 드러났습니다.
- 원인은 토큰 빌드입니다. `dist/css/variables.css`의 `:root`에는 있지만 `.dark`에는 재정의가 없는 `--axis-*` 변수가 main 기준 45개, M3 기준 47개입니다. 모두 component 토큰입니다.
- 이 결함은 1.2.0 배포본에도 있습니다(다크 빌드 구성이 M1 이전부터 같음).

### 1.2 원인 (실측)
| # | 내용 | 위치 (수정 전) |
|---|---|---|
| C1 | 다크 빌드(`sdDark`)의 source가 primitives와 `semantic/dark.json` 둘뿐이고 `src/component/**`가 빠져 있습니다. 주석에 의도적으로 뺐다고 적혀 있습니다 | `packages/axis-tokens/build-tokens.mjs` L180-196 |
| C2 | component 색 leaf 43개가 모두 primitive를 직접 참조하거나(`card.bg.default = {color.white}`) 리터럴입니다. primitive는 라이트 · 다크 값이 같으므로, component를 다크 빌드에 넣기만 하면 라이트 값이 그대로 복제됩니다(변이 빌드에서 추가 45 · 값 변경 0으로 재현) | `packages/axis-tokens/src/component/components.json` |
| C3 | CSS 포맷이 참조를 끝까지 푼 리터럴을 쓰고 `outputReferences`가 없습니다. `.dark`가 semantic을 바꿔도 component 변수로 전파되지 않습니다 | `build-tokens.mjs` L39-48 · L51-60 |
| C4 | CI 참조 검사는 `:root` 블록의 이름만 수집합니다. `.dark` 재정의 누락은 측정하지 않습니다 | `scripts/check-token-refs.mjs` L69-80 |

### 1.3 영향 (다크, WCAG 대비 실측)
| 소비처 | 수정 전 | 수정 후 |
|---|---|---|
| ui-react Card · Dialog 제목(`text-primary`) / 설명(`text-secondary`) | 1.10:1 / 2.54:1 | 18.30:1 / 7.93:1 |
| agentic-ui ApprovalCard · PlanCard secondary 버튼(바탕 / `text-primary`) | 1.00:1 (글자 안 보임) | 16.12:1 |
| ui-react Button ghost 글자 | 1.95:1 | 13.66:1 |
| ui-react Input placeholder | 2.54:1 | 7.93:1 |
| ui-react Select 트리거(글자 상속 시) | 1.10:1 | 정상(다크 바탕) |
| ui-react Input · Badge | 자체 짝이라 읽히지만 다크 화면에 흰 칸 · 밝은 칩으로 남음 | 다크 톤 |

### 1.4 목표
1. 다크(`.dark`)에서 모든 component 토큰이 다크 값으로 재정의되게 합니다.
2. 브랜드를 지정하지 않은 라이트 출력은 한 바이트도 바꾸지 않습니다.
3. 같은 누락이 다시 생기면 빌드 또는 CI가 실패하게 합니다.

### 1.5 범위
- 포함: component 토큰 다크 값 선언(`components.json`), 다크 빌드 preprocessor와 공용 모듈, 다크 완전성 가드(`check-token-refs` 확장 · 빌드 선언 검사), 계산값 회귀 테스트, 1.2.1 릴리스 노트
- 제외: 2장 Non-goals 참고

### 1.6 확정 결정 (2026-10-16)
| # | 결정 | 내용 |
|---|---|---|
| D1 | 구현 방식 | C안. component leaf에 `$extensions.axis.dark`로 다크 값을 적고, 다크 빌드 preprocessor가 그 값으로 바꿔 넣습니다. 등록은 공용 모듈 `packages/axis-tokens/scripts/theme-modes.mjs`에 둡니다(`build-tokens.mjs`는 최상위 await라 다른 곳에서 import하지 않습니다) |
| D2 | 테마 무관 표기 | 그림자 · `transparent` · 채움 버튼처럼 다크에서도 같은 값인 leaf는 같은 값을 두 번 적지 않고 `$extensions.axis.themeIndependent: true` 마커만 붙입니다 |
| D3 | 채움 버튼 | primary · destructive 채움 버튼(흰 글자 3.68 · 3.76:1)은 다크에서도 바꾸지 않습니다(WI-0029 소관) |
| D4 | 다크 placeholder | gray.400(7.93:1). 같은 값인 semantic `{text.secondary}`(다크 gray.400)로 선언합니다 |
| D5 | 브랜드 다크 빌드 | M2 `renderTheme`에 같은 처리를 넣는 일은 이번 범위가 아니라 M2 rebase 때 합니다. 공용 모듈 덕분에 그때 한 줄로 붙습니다 |
| D6 | 릴리스 | changeset 없이 main에 머지해 1.2.1(버전만 올라가고 npm 미배포)에 포함합니다. 1.2.1 릴리스 노트와 CHANGELOG 1.2.1 절에 이 수정을 더합니다 |

---

## 2. Non-goals (범위 제외)

- **var() 사슬(`outputReferences`) 도입**: 런타임에 semantic을 바꿀 때 component로 전파하는 일은 라이트 출력 텍스트를 바꾸므로 다루지 않습니다.
- **브랜드 다크 빌드 수정**: `scripts/build-brands.mjs`(WI-0025 M2 소유)에 preprocessor를 넣는 일은 M2 rebase 때 반영합니다(D5).
- **채움 버튼(primary · destructive) 디자인 변경**: 테마 무관으로 유지합니다(D3).
- **신규 semantic 토큰 추가**: 공개 변수 이름을 늘리지 않습니다.
- `apps/web`의 토큰 import 변경(M3 범위), Chromium 계산값 테스트의 CI 배선(WI-0025 M3 a11y CI 배선 때 함께 검토)

---

## 3. 요구사항

### 3.1 기능 요구사항
- FR-1: `components.json`의 테마 의존 색 leaf 31개에 다크 값 `"$extensions": { "axis": { "dark": "<참조>" } }`를 줄 단위로 덧붙입니다. 다크 값은 같은 의미의 semantic이 있으면 semantic 참조(26개), 없으면 primitive(5개)로 씁니다. 라이트 `value` 문자열은 바꾸지 않습니다.
- FR-2: 테마 무관 leaf 14개(채움 버튼 · 흰 글자 · `transparent` · 포커스 테두리 · 오버레이 · 그림자)에는 `"$extensions": { "axis": { "themeIndependent": true } }` 마커를 둡니다(D2).
- FR-3: 공용 모듈 `packages/axis-tokens/scripts/theme-modes.mjs`에 Style Dictionary preprocessor `axis/theme-dark` 등록(`registerThemePreprocessors`), 테마별 preprocessor 목록(`themePreprocessorsFor`), 색 판정(`isNonColorValue`), 선언 검사(`findThemeDeclarationViolations`)를 둡니다. preprocessor는 `$extensions.axis.dark`가 있는 leaf의 `value`를 그 값으로 바꾸고, `$`로 시작하는 키 아래로는 내려가지 않으며, 확장이 없는 leaf는 건드리지 않습니다. 모듈에는 최상위 실행 코드가 없습니다.
- FR-4: `build-tokens.mjs`의 다크 빌드(`sdDark`)에 `src/component/**/*.json`과 `preprocessors: themePreprocessorsFor('dark')`를 추가하고, 빌드 시작 전에 선언 검사를 실행해 위반이 있으면 rc 1로 끝냅니다. 라이트 빌드 · JS · JSON 플랫폼 · 포맷은 바꾸지 않습니다. L180 주석을 새 동작에 맞게 고칩니다.
- FR-5: `scripts/check-token-refs.mjs`에 판정 5(`variables.css`의 `:root` 이름 집합 = `.dark` 이름 집합, `:root` 전용 0 · `.dark` 전용 0)와 판정 6(component 색 leaf의 `axis.dark` 또는 `axis.themeIndependent` 선언, 형식 오류 포함)을 추가합니다. 위반은 rc 1, `.dark` 정의 0 · component leaf 0은 측정 실패 rc 2입니다.
- FR-6: 색 판정은 보수적으로 합니다. 길이 · 숫자 · 그림자 리터럴 · 비색 범주 참조(`space` · `radius` · `font` · `shadow` 등)만 비색이고, `transparent` · `currentColor` 같은 이름 색과 알 수 없는 참조는 색으로 봅니다.
- FR-7: 회귀 테스트를 둡니다. (a) `@axis-ds/tokens` `test`(node --test): preprocessor · 색 판정 · 선언 검사 · Style Dictionary 해석 · 변이 대조 · check-token-refs fixture (b) `@ax/web` `test:e2e:tokens`: Chromium `getComputedStyle` 계산값(`html.dark` · 하위 `div.dark` 두 시나리오, 라이트 변경 0 · 다크 변경 29개 단언).

### 3.2 비기능 요구사항
- **라이트 불변**: 기본 빌드의 `:root` 블록과 `tokens.js` · `tokens.mjs` · `tokens.d.ts` · `tokens.json` · `shadcn-compat.css` · `tailwind-preset.*`가 수정 전 빌드와 바이트 단위로 같아야 합니다.
- **다크 변경은 추가만**: `.dark` 블록의 기존 줄은 바뀌지 않고, component 줄만 추가됩니다.
- **하위 호환**: 공개 CSS 변수 이름은 새로 생기지 않습니다(patch 요건).
- **WI-0025 호환**: M2 · M3 rebase 뒤 브랜드 테스트가 수정 전과 같은 수로 통과해야 합니다(M2 50, M3 64).

---

## 4. MVP 범위

| 단계 | 내용 | 산출물 | 릴리스 |
|---|---|---|---|
| M1 | FR-1~7 | 토큰 다크 선언 · preprocessor · 가드 · 회귀 테스트 | 1.2.1 (D6) |
| M2 | 릴리스 반영 | 1.2.1 릴리스 노트 · CHANGELOG, WI-0025 M2 · M3 rebase 안내 | 1.2.1 (D6) |

---

## 5. 수용 기준 (Acceptance Criteria)

- AC1: 기본 빌드에서 `:root` 블록과 JS · JSON · d.ts · shadcn-compat · tailwind-preset 산출물이 수정 전과 바이트 단위로 같습니다(sha256 일치).
- AC2: `variables.css`에서 `:root` 전용 이름이 0개, `.dark` 전용 이름이 0개입니다(main 249 = 249).
- AC3: 기존 `.dark` 204줄의 텍스트가 바뀌지 않습니다(diff에 삭제 줄 0, 추가 줄 45).
- AC4: Chromium 계산값 기준으로 라이트는 변경 0, `html.dark`와 하위 `div.dark`는 각각 29개가 바뀝니다. 바뀌는 29개는 plan.md 4.1 분류표와 일치합니다.
- AC5: preprocessor를 뺀 변이 빌드에서는 AC4의 다크 변경 단언이 실패합니다(변이 대조).
- AC6: `node scripts/check-token-refs.mjs`가 수정 산출물에서 rc 0이고, 음성 fixture(`.dark` 줄 누락 · `.dark` 전용 이름 · `transparent` 선언 누락)에서 각각 rc 1입니다.
- AC7: 다크에서 Card · Dialog 바탕 / `text-primary`, button-secondary 바탕 / 글자, Input 바탕 / placeholder 대비가 4.5:1 이상입니다.
- AC8: `tokens.json` · `tokens.js` · `tokens.mjs`에 `$extensions`가 나타나지 않습니다.
- 비기능: type-check · lint · build · 기존 테스트 회귀가 없습니다.

---

## 6. Assumptions (가정)

- A1: Style Dictionary는 4.4.0입니다. preprocessor 동작과 `value` · `$extensions` 혼용 판정은 이 버전에서만 측정했습니다.
- A2: 저장소 밖에서 `components.json`을 다시 쓰는 도구(Tokens Studio · Figma 동기화 등)는 없습니다.
- A3: 다크 모드 소비자는 `.dark` 클래스를 사용합니다(`ThemeProvider` · `next-themes` 모두 해당).

---

## 7. Risks / Open questions

| # | 내용 | 영향 | 상태 · 대응 |
|---|---|---|---|
| Q1 | 릴리스 단위 | 높음 | 해결(D6): changeset 없이 1.2.1에 포함합니다 |
| Q2 | `components.json` 변경 줄이 WI-0025 M3 hunk(L106)와 2줄 간격입니다 | 중간 | 열림. 줄 단위 제자리 수정만 했습니다. M3 rebase 때 L99-110을 확인합니다(이 브랜치에서는 실제 rebase를 측정하지 않았습니다) |
| Q3 | 브랜드 다크 빌드는 preprocessor를 쓰지 않아, 브랜드 `dark.json`의 component 참조가 라이트 값으로 풀립니다(종전 동작) | 중간 | 해결(D5): M2 rebase 때 `renderTheme`에 한 줄을 추가합니다 |
| Q4 | 다크 placeholder | 낮음 | 해결(D4): gray.400(7.93:1) |
| Q5 | 채움 버튼(primary · destructive) 다크 대비 3.68 · 3.76:1 | 낮음 | 해결(D3): 테마 무관 유지, WI-0029 소관 |
| Q6 | 하위 요소 `.dark` 아래에서는 이제 기본 다크 component 값이 브랜드 라이트 component 값을 이깁니다 | 낮음 | semantic 토큰의 현재 동작과 같습니다. 릴리스 노트에 적습니다 |
| Q7 | `@axis-ds/tokens` `package.json`의 `test` 줄이 M2의 같은 자리 추가와 겹칩니다 | 낮음 | 열림. M2 rebase 때 두 목록을 합칩니다(plan 5장) |
