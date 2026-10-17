# WI-0033 구현 계획

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 작성일: 2026-10-16 | 기준: `origin/main` 3b52976
> 채택: C안(leaf 다크 선언 + 다크 preprocessor) + B · A안 접목. 줄 번호는 2026-10-16 실측값이며, 코드가 바뀌면 낡으므로 착수 시점에 다시 확인합니다.

## 1. 수정 파일

| # | 파일 | 변경 |
|---|---|---|
| 1 | `packages/axis-tokens/scripts/theme-modes.mjs` (신규) | `THEME_DARK_PREPROCESSOR` · `registerThemePreprocessors(StyleDictionary)` · `themePreprocessorsFor(theme)` · `applyThemeValues` · `isNonColorValue` · `findThemeDeclarationViolations` export. 기본 다크 빌드 설정 `darkBuildConfig({ root })`와 다크 값 기대값 계산(`cssVarNameOf` · `flattenTokens` · `resolveTokenValue` · `findDarkValueExpectations`)도 둠. 최상위 실행 코드 없음, style-dictionary를 직접 import하지 않음 |
| 2 | `packages/axis-tokens/src/component/components.json` | 테마 의존 31줄에 `axis.dark`, 테마 무관 14줄에 `axis.themeIndependent` 덧붙임. 줄 단위 제자리 수정, 재포맷 없음(45줄 변경) |
| 3 | `packages/axis-tokens/build-tokens.mjs` | L180-199에 theme-modes import · 등록 · 선언 검사(위반 시 rc 1), `sdDark`를 `new StyleDictionary(darkBuildConfig())`로 만듦(설정에 `preprocessors: themePreprocessorsFor('dark')`와 `src/component/**/*.json` 포함), L180 주석 정정(긴 줄표 제거) |
| 4 | `scripts/check-token-refs.mjs` | 판정 5(이름 집합 동일 + 다크 값 미반영) · 판정 6(테마 선언) 추가, `--component-dir` · `--token-dir` 옵션, 요약 줄 1줄 추가. 기존 판정 1~4는 그대로 둠 |
| 5 | `packages/axis-tokens/test/theme-modes.test.mjs` · `dark-completeness.test.mjs` (신규) | node --test. fixture는 `test/fixtures/dark-completeness/`(양성 1 · 음성 4, 토큰 소스 `tokens/`) |
| 6 | `packages/axis-tokens/package.json` | `"test": "node --test test/theme-modes.test.mjs test/dark-completeness.test.mjs"` |
| 7 | `apps/web/e2e/dark-tokens.spec.ts` · `apps/web/e2e/fixtures/dark-tokens-light-3b52976.json` · `apps/web/playwright.tokens.config.ts` (신규), `apps/web/package.json` | Chromium 계산값 회귀 테스트, 라이트 고정 기준값(M1 반영 빌드 3b52976 의 component 45개 `:root` 값), `test:e2e:tokens` 스크립트(개발 서버 없이 실행) |
| 8 | `docs/workitems/WI-0025-brand-theme/release-notes.md`, `packages/axis-{tokens,ui-react,agentic-ui,theme}/CHANGELOG.md` | 1.2.1 절에 이 수정 추가(changeset 없음, D6) |

손대지 않는 파일: 라이트 빌드 source(L136-141), 포맷 L39-60, JS · JSON 플랫폼, `scripts/build-brands.mjs` · `scripts/brands.mjs`(M2 소유), `project-todo.md` · `.github/wi-mapping.json`(PR #98과 충돌 방지)

`build-tokens.mjs` L331의 긴 줄표는 `shadcn-compat.css` 출력 문자열 안에 있어 지우면 라이트 산출물 바이트가 바뀝니다. 그래서 그대로 둡니다.

## 2. 순서

1. 기준선 저장: `pnpm install --frozen-lockfile` → `pnpm --filter @axis-ds/tokens build` → `dist/` 전체 복사, sha256 목록 저장. 같은 빌드를 한 번 더 돌려 sha가 같은지 확인(빌드 결정성 대조)
2. theme-modes.mjs 작성, build-tokens.mjs 배선. 이 시점(components.json 무변경)에 빌드하면 선언 검사가 색 leaf 43건을 잡고 rc 1이어야 합니다(가드 양성 대조)
3. components.json 다크 선언 · 마커 적용 → `$extensions`를 뺀 트리가 수정 전과 같은지 확인
4. 빌드 → 3장 검증
5. check-token-refs 확장 + fixture 테스트
6. Chromium 계산값 테스트
7. 릴리스 문서

## 3. 검증 명령

| # | 목적 | 명령 · 판정 | 대조군 |
|---|---|---|---|
| V1 | 빌드 | `pnpm --filter @axis-ds/tokens build` rc 0, 로그에 `collision` · `warn` 0건 | 수정 전 빌드 로그도 0건(같은 grep) |
| V2 | 라이트 바이트 동일 | dist 10개 파일 sha256 비교: `variables.css`만 다르고 9개 일치. `:root` 블록 문자열 동일 | 같은 소스 재빌드 sha 전부 일치(결정성), `variables.css` 전체는 달라야 함 |
| V3 | 다크 추가만 | `diff base new variables.css`에 `<` 줄 0, `>` 줄 45 | - |
| V4 | 이름 집합 | `:root` 전용 0 · `.dark` 전용 0 (249 / 249) | 수정 전 base에서 `:root` 전용 45 |
| V5 | 계산값 | `pnpm --filter @ax/web test:e2e:tokens`: 라이트 component 45개가 고정 기준값(3b52976)과 같음, `html.dark` · `div.dark` 각 29개의 이름과 다크 hex 가 4.1 표와 같음 | 기준선(`.dark`에서 component 줄을 지운 CSS)이 수정 전 실제 `variables.css`와 문자열 동일 |
| V6 | 변이(음성) | `preprocessors`를 `[]`로 바꾼 빌드 CSS로 V5 실행 → 다크 단언 2건 실패. 같은 변이에서 V4 이름 집합은 통과하지만 V7 다크 값 축이 rc 1 | 수정 전 CSS로 V5 실행 → 3건 실패. 라이트 값 변이 → 라이트 단언 실패, 다크 값을 다른 다크 값으로 바꾼 변이 → 다크 단언 2건 실패 |
| V7 | 가드 | `pnpm check-token-refs` rc 0, 요약에 `다크 값 대상 29 · 미반영 0` | fixture 음성 4종 rc 1(다크 값 미반영 포함), 실제 산출물에서 `.dark` 1줄 삭제 사본 rc 1, 수정 전 dist · components 사본 rc 1(`:root` 전용 45 · 선언 위반 43), `sdDark` preprocessor 제거 빌드 rc 1(미반영 29) |
| V8 | 누수 | `grep -c '$extensions'` `tokens.json` · `tokens.js` · `tokens.mjs` 각 0 | 소스 `components.json`에는 45 |
| V9 | 대비 | V5 안의 대비 단언(≥ 4.5) | 수정 전 값 1.10 · 2.54가 재현되는지(대비 계산 스크립트) |
| V10 | 품질 게이트 | `pnpm turbo run type-check build test --force` · `pnpm lint` | `Cached: 0 cached` 확인 |

CI 가 실행하는 것은 V7(`pnpm check-token-refs`: 이름 집합 · 다크 값 · 테마 선언)과 tokens test(`pnpm test`)입니다. V5 · V6 의 Chromium 계산값 테스트는 CI 에 배선하지 않습니다(CI 에 Playwright 브라우저 설치 단계가 없음). WI-0025 M3 의 a11y CI 배선 때 함께 검토합니다.

## 4. 45개 분류표 (main)

라이트 값은 현재 `:root` 값입니다. 다크 선언은 `$extensions.axis.dark`에 적은 참조이고, 다크 값은 다크 빌드에서 풀린 결과입니다. 줄은 `components.json` 줄 번호입니다.

### 4.1 테마 의존 31개

| # | 변수 | 줄 | 라이트 | 다크 선언 | 다크 값 |
|---|---|---|---|---|---|
| 1 | `--axis-button-bg-disabled` | 7 | gray.300 #D1D5DB | `{color.gray.700}` | #374151 |
| 2 | `--axis-button-text-disabled` | 11 | gray.500 #6B7280 | `{text.tertiary}` | #6B7280 (값 동일) |
| 3 | `--axis-button-secondary-bg-default` | 20 | gray.100 #F3F4F6 | `{surface.secondary}` | #111827 |
| 4 | `--axis-button-secondary-bg-hover` | 21 | gray.200 #E5E7EB | `{surface.tertiary}` | #1F2937 |
| 5 | `--axis-button-secondary-bg-active` | 22 | gray.300 #D1D5DB | `{color.gray.700}` | #374151 |
| 6 | `--axis-button-secondary-text-default` | 25 | gray.900 #111827 | `{text.primary}` | #F3F4F6 |
| 7 | `--axis-button-ghost-bg-hover` | 31 | gray.100 #F3F4F6 | `{surface.secondary}` | #111827 |
| 8 | `--axis-button-ghost-bg-active` | 32 | gray.200 #E5E7EB | `{surface.tertiary}` | #1F2937 |
| 9 | `--axis-button-ghost-text-default` | 35 | gray.700 #374151 | `{color.gray.300}` | #D1D5DB |
| 10 | `--axis-input-bg-default` | 50 | white #FFFFFF | `{surface.default}` | #030712 |
| 11 | `--axis-input-bg-disabled` | 51 | gray.100 #F3F4F6 | `{surface.secondary}` | #111827 |
| 12 | `--axis-input-text-default` | 54 | gray.900 #111827 | `{text.primary}` | #F3F4F6 |
| 13 | `--axis-input-text-placeholder` | 55 | gray.400 #9CA3AF | `{text.secondary}` (D4) | #9CA3AF (값 동일, 7.93:1) |
| 14 | `--axis-input-border-default` | 58 | gray.300 #D1D5DB | `{border.secondary}` | #374151 |
| 15 | `--axis-input-border-hover` | 59 | gray.400 #9CA3AF | `{color.gray.500}` | #6B7280 |
| 16 | `--axis-input-border-focus` | 60 | blue.500 #3B82F6 | `{border.focus}` | #60A5FA |
| 17 | `--axis-input-border-error` | 61 | red.500 #EF4444 | `{border.error}` | #F87171 |
| 18 | `--axis-card-bg-default` | 66 | white #FFFFFF | `{surface.default}` | #030712 |
| 19 | `--axis-card-border-default` | 69 | gray.200 #E5E7EB | `{border.default}` | #1F2937 |
| 20 | `--axis-badge-default-bg` | 77 | gray.100 #F3F4F6 | `{surface.secondary}` | #111827 |
| 21 | `--axis-badge-default-text` | 78 | gray.700 #374151 | `{color.gray.300}` | #D1D5DB |
| 22 | `--axis-badge-success-bg` | 81 | green.100 #DCFCE7 | `{surface.success}` | #052E16 |
| 23 | `--axis-badge-success-text` | 82 | green.700 #15803D | `{text.success}` | #4ADE80 |
| 24 | `--axis-badge-warning-bg` | 85 | yellow.100 #FEF9C3 | `{surface.warning}` | #422006 |
| 25 | `--axis-badge-warning-text` | 86 | yellow.700 #A16207 | `{text.warning}` | #FACC15 |
| 26 | `--axis-badge-error-bg` | 89 | red.100 #FEE2E2 | `{surface.error}` | #450A0A |
| 27 | `--axis-badge-error-text` | 90 | red.700 #B91C1C | `{text.error}` | #F87171 |
| 28 | `--axis-badge-info-bg` | 93 | blue.100 #DBEAFE | `{surface.info}` | #172554 |
| 29 | `--axis-badge-info-text` | 94 | blue.700 #1D4ED8 | `{text.info}` | #60A5FA |
| 30 | `--axis-dialog-content-bg` | 102 | white #FFFFFF | `{surface.default}` | #030712 |
| 31 | `--axis-dialog-content-border` | 103 | gray.200 #E5E7EB | `{border.default}` | #1F2937 |

semantic 참조 26개 + primitive 5개입니다. 다크 계산값이 실제로 바뀌는 것은 #2 · #13을 뺀 29개입니다(#2 · #13은 다크 semantic 값이 라이트 primitive 값과 우연히 같음). 의미가 다른 값이므로 마커가 아니라 다크 선언으로 둡니다.

### 4.2 테마 무관 14개 (`axis.themeIndependent: true`)

| # | 변수 | 줄 | 값 | 비고 |
|---|---|---|---|---|
| 32 | `--axis-button-bg-default` | 4 | blue.500 #3B82F6 | 흰 글자와 자체 짝 3.68:1 (D3) |
| 33 | `--axis-button-bg-hover` | 5 | blue.600 #2563EB | |
| 34 | `--axis-button-bg-active` | 6 | blue.700 #1D4ED8 | |
| 35 | `--axis-button-text-default` | 10 | white #FFFFFF | 채움 버튼 위 글자 |
| 36 | `--axis-button-border-default` | 14 | transparent | 이름 색. 색 판정 대상 |
| 37 | `--axis-button-border-focus` | 15 | blue.400 #60A5FA | 다크 semantic과 값 같음. 브랜드 fixture가 역참조하므로 참조로 바꾸지 않음 |
| 38 | `--axis-button-ghost-bg-default` | 30 | transparent | |
| 39 | `--axis-button-destructive-bg-default` | 40 | red.500 #EF4444 | 3.76:1 (D3) |
| 40 | `--axis-button-destructive-bg-hover` | 41 | red.600 #DC2626 | |
| 41 | `--axis-button-destructive-bg-active` | 42 | red.700 #B91C1C | |
| 42 | `--axis-button-destructive-text-default` | 45 | white #FFFFFF | |
| 43 | `--axis-dialog-overlay-bg` | 99 | rgba(0, 0, 0, 0.5) | |
| 44 | `--axis-card-shadow-default` | 72 | 0 1px 3px 0 rgb(0 0 0 / 0.1) | 그림자(비색). 선언 필수는 아니지만 D2에 따라 마커를 둠 |
| 45 | `--axis-dialog-content-shadow` | 104 | 0 25px 50px -12px rgb(0 0 0 / 0.25) | 그림자(비색), 마커 |

M3 전용 2개(`--axis-plan-card-accent-width` 4px, `--axis-card-shadow` `{shadow.sm}`)는 비색이라 선언 검사 대상이 아닙니다. 마커를 붙일지는 M3 rebase 때 정합니다.

## 5. 선언 검사 규칙

`findThemeDeclarationViolations`가 위반으로 보는 것:

1. 색 leaf에 `axis.dark`도 `axis.themeIndependent`도 없음
2. `axis.dark`와 `axis.themeIndependent`를 함께 선언
3. `axis.dark`가 문자열이 아니거나, 라이트 `value`와 같은 문자열(같은 값이면 마커를 씀)
4. `axis.themeIndependent`가 true가 아님, `axis` 안의 알 수 없는 키(`drak` 같은 오타)

색 판정은 보수적입니다. 비색은 길이 · 숫자(`4px` · `0`) · 그림자 리터럴(길이 2개 이상 뒤에 색) · `none` · 비색 범주 참조(`space` · `radius` · `font` · `shadow` · `size` · `duration` · `opacity` · `z` · `zIndex`)뿐이고, 나머지는 모두 색입니다.

같은 함수를 `build-tokens.mjs`(빌드 실패)와 `check-token-refs`(CI 판정 6)가 함께 씁니다.

## 6. WI-0025 M2 · M3 rebase 체크리스트

> 충돌 위치는 38ecea7 을 기준으로 임시 rebase 해서 잰 값입니다(2026-10-16). 그 뒤 리뷰 반영(다크 값 축 · `darkBuildConfig`)으로 `scripts/check-token-refs.mjs` · `build-tokens.mjs`가 더 바뀌었으므로, 실제 rebase 에서 hunk 수를 다시 확인합니다.

### 공통

- 실측 충돌: M2 는 `packages/axis-tokens/package.json` `test` 줄 2회(커밋 24cc10f · 9c7eb5b, 각 1 hunk)입니다. M3 는 같은 `test` 줄 2회(101f879 · 7227b4c)와 `scripts/check-token-refs.mjs` 1회(9f8c18c, 2 hunk)입니다. `build-tokens.mjs` · `components.json`은 둘 다 자동 병합됐습니다
- `test` 줄 해소값: `node --test test/theme-modes.test.mjs test/dark-completeness.test.mjs test/brands.test.mjs test/build-brands.test.mjs`
- 둘 다 `pnpm check-token-refs` rc 0, `pnpm --filter @axis-ds/tokens test` 통과, `pnpm --filter @ax/web test:e2e:tokens` 통과를 확인합니다

### M2

- `scripts/build-brands.mjs` `renderTheme`에 아래 두 줄을 추가합니다(공용 모듈 덕분에 등록은 한 번, 설정은 한 줄)

  ```js
  import { registerThemePreprocessors, themePreprocessorsFor } from './theme-modes.mjs'
  registerThemePreprocessors(StyleDictionary)
  // new StyleDictionary({ ..., preprocessors: themePreprocessorsFor(theme) })
  ```

  fixture 브랜드 `dark.json`에 `{card.bg.default}` 참조를 넣은 프로브의 기대값은 다음과 같습니다. 브랜드가 `surface.default`를 덮어쓰면 그 값(sample 브랜드는 #172030), 덮어쓰지 않으면 기본 다크 #030712 입니다. preprocessor 가 빠지면 라이트 값 #FFFFFF 가 나옵니다(음성 대조). 순환 참조 Reference Errors 가 없는지도 확인합니다
- 실측(38ecea7 기준) tokens test 는 62/62(WI-0033 12 + 브랜드 50)였습니다. 리뷰 반영으로 WI-0033 테스트가 16개가 되었으므로 기대값은 WI-0033 16 + 브랜드 50 입니다

### M3

- `scripts/check-token-refs.mjs` 판정 번호(2026-10-16 사용자 결정): WI-0033 의 판정 5(이름 집합 · 다크 값) · 6(테마 선언)을 유지하고, M3 의 CSS 미생성을 판정 7 로 바꿉니다. 해소 방법은 다음과 같습니다
  - 상단 주석의 판정 목록은 양쪽을 모두 남기고, M3 의 「6. CSS 미생성 …」을 「7. CSS 미생성 …」으로 고칩니다
  - M3 주석의 「(번호 5는 비워 둡니다. WI-0025 plan.md 결정 U7 의 번호를 그대로 씁니다.)」 줄은 지웁니다
  - M3 의 함수 주석 「판정 6: Tailwind 3.4가 CSS를 만들지 않는 …」도 「판정 7」로 고칩니다
  - `const violations` 식은 `counts.missing + counts.primitive + counts.dynamic + counts.noCss + darkViolations + theme.violations.length`로 합칩니다
  - WI-0025 plan.md 의 U7(L654) · G2(L678)에 적힌 「판정 6」도 M3 쪽에서 「판정 7」로 고칩니다
- `components.json`: 실측에서 자동 병합, 충돌 0 이었습니다. M3 전용 2개(plan-card · card-shadow)는 비색이라 선언이 필요 없습니다(실측 leaf 47 · 색 leaf 43 · 위반 0)
- 고정 수치
  - `theme-modes.test.mjs`의 component leaf 수는 소스에서 센 값과 비교하도록 바꿨으므로 고칠 것이 없습니다(M3 47). 색 leaf 43 은 고정값이고 M3 에서도 43 이라 그대로 둡니다
  - `dark-tokens.spec.ts`의 `:root` 수와 기준선 `.dark` 수는 산출물과 `components.json`에서 센 값으로 비교하므로 고칠 것이 없습니다. M3 실측 기대값은 `:root` 249 → 259, 기준선 `.dark` 204 → 212(259 - 47)이며 rebase 뒤 테스트를 실행해 확인합니다
  - `dark-tokens.spec.ts`의 다크 기대 맵 29개(`EXPECTED_DARK`)와 라이트 고정 기준값 45개(`fixtures/dark-tokens-light-3b52976.json`)는 고정값입니다. M3 에서도 다크 값이 바뀌는 것은 29개이고(실측), M3 추가 2개는 라이트 기준값에 없어 검사 대상이 아니므로 그대로 둡니다
  - `check-token-refs` 요약 줄 기대값: `:root 259 · .dark 259 · :root 전용 0 · .dark 전용 0 · 다크 값 대상 29 · 미반영 0`, 테마 선언 `leaf 47 · 색 leaf 43 · 위반 0`
- 브랜드 테스트 64/64 유지를 확인합니다

## 7. 실측 결과 (2026-10-16, main 3b52976 위)

- 빌드 rc 0, `collision` · `warn` 0건(수정 전도 0건)
- dist sha256: 10개 중 `css/variables.css`만 변경(079530b5 → 4c1296c5), 나머지 9개 일치. 같은 소스 재빌드는 10개 모두 일치
- `:root` 블록 8,917바이트 문자열 동일. `.dark` 204 → 249, `:root` 전용 45 → 0, `.dark` 전용 0. diff 삭제 0 · 추가 45
- 다크 계산값 변경 29개(4.1표에서 #2 · #13 제외), 라이트 변경 0
- 변이(preprocessor 제거): 추가 45 · 다크 값 변경 0. 이름 집합 검사는 통과하고 Chromium 다크 단언 2건이 실패
- 대비(다크, 수정 전 → 후): Card / text-primary 1.10 → 18.30, Card / text-secondary 2.54 → 7.93, Input / placeholder 2.54 → 7.93, ghost 글자 1.95 → 13.66, Badge success 4.57 → 8.55 · warning 4.58 → 9.52 · error 5.30 → 5.84 · info 5.49 → 5.78 · default 9.37 → 12.04, 채움 버튼 3.68 · 3.76 유지

### 7.1 리뷰 반영 뒤 재측정 (2026-10-16)

- `sdDark` 설정을 `darkBuildConfig()`로 옮긴 뒤 dist 10개 sha256 이 38ecea7 빌드와 모두 일치합니다. `:root` 블록 8,917바이트는 38ecea7 · 3b52976 빌드와 바이트 동일합니다
- `pnpm check-token-refs` rc 0: `:root 249 · .dark 249 · :root 전용 0 · .dark 전용 0 · 다크 값 대상 29 · 미반영 0`, 테마 선언 `leaf 45 · 색 leaf 43 · 위반 0`
- 변이 A(`build-tokens.mjs`에서 `{ ...darkBuildConfig(), preprocessors: [] }`): 빌드 rc 0, `check-token-refs` rc 1(미반영 29), Chromium 다크 단언 2건 실패
- 변이 B(`darkBuildConfig`의 `preprocessors`를 `[]`): 빌드 rc 0, `check-token-refs` rc 1(미반영 29), tokens test 1건 실패(`darkBuildConfig` 해석)
- 변이 L(`card.bg.default` 라이트 값을 `{color.gray.50}`): Chromium 라이트 단언 1건 실패. 변이 D(`card.bg.default` 다크 값을 `{surface.secondary}`): 바뀌는 이름 목록은 같지만 Chromium 다크 단언 2건 실패
- tokens test 16/16, `pnpm --filter @ax/web test:e2e:tokens` 4/4
- `pnpm turbo run type-check build test --force`를 한 번에 돌리면 `@ax/web#type-check`가 TS6053 61건(`.next/types` 누락)으로 실패합니다. build 와 type-check 의 실행 순서 경합입니다. `pnpm turbo run build --force`(8/8, 캐시 0)를 먼저 단독으로 돌린 뒤 `pnpm turbo run type-check test --force`(12/12, 캐시 0)는 rc 0 입니다
