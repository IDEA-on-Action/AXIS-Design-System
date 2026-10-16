# WI-0033 구현 계획

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 작성일: 2026-10-16 | 기준: `origin/main` 3b52976
> 채택: C안(leaf 다크 선언 + 다크 preprocessor) + B · A안 접목. 줄 번호는 2026-10-16 실측값이며, 코드가 바뀌면 낡으므로 착수 시점에 다시 확인합니다.

## 1. 수정 파일

| # | 파일 | 변경 |
|---|---|---|
| 1 | `packages/axis-tokens/scripts/theme-modes.mjs` (신규) | `THEME_DARK_PREPROCESSOR` · `registerThemePreprocessors(StyleDictionary)` · `themePreprocessorsFor(theme)` · `applyThemeValues` · `isNonColorValue` · `findThemeDeclarationViolations` export. 최상위 실행 코드 없음, style-dictionary를 직접 import하지 않음 |
| 2 | `packages/axis-tokens/src/component/components.json` | 테마 의존 31줄에 `axis.dark`, 테마 무관 14줄에 `axis.themeIndependent` 덧붙임. 줄 단위 제자리 수정, 재포맷 없음(45줄 변경) |
| 3 | `packages/axis-tokens/build-tokens.mjs` | L180-199에 theme-modes import · 등록 · 선언 검사(위반 시 rc 1), `sdDark`에 `preprocessors: themePreprocessorsFor('dark')`와 `src/component/**/*.json` 추가, L180 주석 정정(긴 줄표 제거) |
| 4 | `scripts/check-token-refs.mjs` | 판정 5(이름 집합 동일) · 판정 6(테마 선언) 추가, `--component-dir` 옵션, 요약 줄 1줄 추가. 기존 판정 1~4는 그대로 둠 |
| 5 | `packages/axis-tokens/test/theme-modes.test.mjs` · `dark-completeness.test.mjs` (신규) | node --test. fixture는 `test/fixtures/dark-completeness/`(양성 1 · 음성 3) |
| 6 | `packages/axis-tokens/package.json` | `"test": "node --test test/theme-modes.test.mjs test/dark-completeness.test.mjs"` |
| 7 | `apps/web/e2e/dark-tokens.spec.ts` · `apps/web/playwright.tokens.config.ts` (신규), `apps/web/package.json` | Chromium 계산값 회귀 테스트, `test:e2e:tokens` 스크립트(개발 서버 없이 실행) |
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
| V5 | 계산값 | `pnpm --filter @ax/web test:e2e:tokens`: 라이트 0, `html.dark` 29, `div.dark` 29 | 기준선(`.dark`에서 component 줄을 지운 CSS)이 수정 전 실제 `variables.css`와 문자열 동일 |
| V6 | 변이(음성) | `preprocessors`를 `[]`로 바꾼 빌드 CSS로 V5 실행 → 다크 단언 2건 실패. 같은 변이에서 V4는 통과(이름 집합만으로는 못 잡음) | 수정 전 CSS로 V5 실행 → 3건 실패 |
| V7 | 가드 | `pnpm check-token-refs` rc 0 | fixture 음성 3종 rc 1, 실제 산출물에서 `.dark` 1줄 삭제 사본 rc 1, 수정 전 dist · components 사본 rc 1(`:root` 전용 45 · 선언 위반 43) |
| V8 | 누수 | `grep -c '$extensions'` `tokens.json` · `tokens.js` · `tokens.mjs` 각 0 | 소스 `components.json`에는 45 |
| V9 | 대비 | V5 안의 대비 단언(≥ 4.5) | 수정 전 값 1.10 · 2.54가 재현되는지(대비 계산 스크립트) |
| V10 | 품질 게이트 | `pnpm turbo run type-check build test --force` · `pnpm lint` | `Cached: 0 cached` 확인 |

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

- M3: `components.json` L99-110 수동 확인(plan-card · card-shadow는 비색이라 선언 필수 아님), `check-token-refs` 요약 줄에서 `:root` 전용 47→0, 브랜드 테스트 64/64
- M3: `dark-tokens.spec.ts`의 `:root` 249 · 기준선 `.dark` 204 · 변경 29 단언은 M3에서 숫자가 달라집니다(`:root` 259 등). rebase 때 실측값으로 고칩니다
- M2: `scripts/build-brands.mjs` `renderTheme`에 아래 두 줄을 추가합니다(공용 모듈 덕분에 등록은 한 번, 설정은 한 줄)

  ```js
  import { registerThemePreprocessors, themePreprocessorsFor } from './theme-modes.mjs'
  registerThemePreprocessors(StyleDictionary)
  // new StyleDictionary({ ..., preprocessors: themePreprocessorsFor(theme) })
  ```

  fixture 브랜드 `dark.json`에 `{card.bg.default}` 참조를 넣은 프로브가 #030712로 풀리는지(미반영 시 #FFFFFF 대조), 순환 참조 Reference Errors가 없는지 확인합니다
- M2: `packages/axis-tokens/package.json` `test` 줄이 겹칩니다. 두 목록을 합칩니다(`node --test test/brands.test.mjs test/build-brands.test.mjs test/theme-modes.test.mjs test/dark-completeness.test.mjs`)
- M2: `build-tokens.mjs`는 M2가 L31-36 · L58 · L114-122 · 끝부분을, 이 WI가 L180-205를 바꿉니다. 겹치는 hunk는 없을 것으로 보지만 실제 rebase로 확인합니다
- 둘 다 `pnpm check-token-refs` rc 0, `pnpm --filter @axis-ds/tokens test` 통과 확인

## 7. 실측 결과 (2026-10-16, main 3b52976 위)

- 빌드 rc 0, `collision` · `warn` 0건(수정 전도 0건)
- dist sha256: 10개 중 `css/variables.css`만 변경(079530b5 → 4c1296c5), 나머지 9개 일치. 같은 소스 재빌드는 10개 모두 일치
- `:root` 블록 8,917바이트 문자열 동일. `.dark` 204 → 249, `:root` 전용 45 → 0, `.dark` 전용 0. diff 삭제 0 · 추가 45
- 다크 계산값 변경 29개(4.1표에서 #2 · #13 제외), 라이트 변경 0
- 변이(preprocessor 제거): 추가 45 · 다크 값 변경 0. 이름 집합 검사는 통과하고 Chromium 다크 단언 2건이 실패
- 대비(다크, 수정 전 → 후): Card / text-primary 1.10 → 18.30, Card / text-secondary 2.54 → 7.93, Input / placeholder 2.54 → 7.93, ghost 글자 1.95 → 13.66, Badge success 4.57 → 8.55 · warning 4.58 → 9.52 · error 5.30 → 5.84 · info 5.49 → 5.78 · default 9.37 → 12.04, 채움 버튼 3.68 · 3.76 유지
