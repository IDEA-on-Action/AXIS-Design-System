# WI-0033: 다크 모드 component 토큰 재정의 누락 해소 TODO

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | 상태: ✅ 완료 (2026-10-17, 1.2.1 배포. 남은 항목은 WI-0025 M2 · M3 rebase 때 수행)

## 진행 순서

| Phase | 범위 | 릴리스 | GitHub |
|---|---|---|---|
| M1 | 다크 선언 · preprocessor · 가드 · 회귀 테스트 (FR-1~7) | 1.2.1 (changeset 없음, D6) | #99 |
| M2 | 릴리스 문서 반영 · WI-0025 rebase 안내 | 1.2.1 | #99 |

- 머지 순서: **이 WI 머지 → 1.2.1 npm 배포 → WI-0025 M2 · M3 rebase** (plan 6장 체크리스트)
- `project-todo.md` · `.github/wi-mapping.json`은 이 브랜치에서 고치지 않습니다(PR #98과 충돌 방지). 머지 뒤 별도로 현행화합니다

---

## 착수 전 결정

> 2026-10-16 사용자 결정. prd 1.6 표와 같습니다.

- [x] 구현 방식: A(var() 사슬) vs B(다크 블록 별도 정의) vs C(leaf 다크 선언 + preprocessor) → ✅ 2026-10-16: C안, 등록은 공용 모듈 `packages/axis-tokens/scripts/theme-modes.mjs` (D1)
- [x] 테마 무관 표기: 마커 vs 같은 값 명시 vs 비색 판정만 → ✅ 2026-10-16: `axis.themeIndependent: true` 마커 (D2)
- [x] 채움 버튼 다크: 유지 vs `surface.brand` 다크 vs 별도 WI → ✅ 2026-10-16: 유지, WI-0029 소관 (D3)
- [x] 다크 placeholder: gray.400(7.93:1) vs gray.500(4.16:1) → ✅ 2026-10-16: gray.400, `{text.secondary}`로 선언 (D4)
- [x] 브랜드 다크 preprocessor: M2 rebase 때 vs M2에 직접 vs 반영 안 함 → ✅ 2026-10-16: M2 rebase 때, 공용 모듈로 한 줄 연결 (D5)
- [x] 릴리스: 1.2.1 포함 vs 1.2.2 vs 1.3.0 → ✅ 2026-10-16: changeset 없이 1.2.1 포함 (D6)

---

## Phase M1: 다크 선언 · preprocessor · 가드

### M1-1 공용 모듈 (`packages/axis-tokens/scripts/theme-modes.mjs`)
- [x] `registerThemePreprocessors(StyleDictionary)` · `themePreprocessorsFor(theme)` · `THEME_DARK_PREPROCESSOR`(`axis/theme-dark`) (FR-3)
- [x] `applyThemeValues`: `$extensions.axis.dark`가 있는 leaf만 `value` 교체, `$` 키 아래로 내려가지 않음 (FR-3)
- [x] `isNonColorValue`: 길이 · 숫자 · 그림자 · 비색 범주 참조만 비색, `transparent` 등 이름 색은 색 (FR-6)
- [x] `findThemeDeclarationViolations`: 선언 누락 · 동시 선언 · 라이트와 같은 다크 값 · 알 수 없는 키 · `themeIndependent` 비 true (FR-5)
- [x] 최상위 실행 코드 없음, style-dictionary 직접 import 없음 (D1 · D5)

### M1-2 토큰 선언 (`packages/axis-tokens/src/component/components.json`)
- [x] 테마 의존 31줄에 `axis.dark` (semantic 26 · primitive 5, plan 4.1) (FR-1)
- [x] 테마 무관 14줄에 `axis.themeIndependent: true` (채움 버튼 6 · 흰 글자 2 · transparent 2 · 포커스 테두리 · 오버레이 · 그림자 2, plan 4.2) (FR-2 · D2)
- [x] 줄 단위 제자리 수정(45줄), `$extensions`를 뺀 트리가 수정 전과 같음 확인 (FR-1)

### M1-3 빌드 배선 (`packages/axis-tokens/build-tokens.mjs`)
- [x] L180 주석 정정(긴 줄표 제거), theme-modes import · 등록 (FR-4)
- [x] `sdDark`에 `preprocessors: themePreprocessorsFor('dark')` · `src/component/**/*.json` 추가 (FR-4)
- [x] 빌드 시작 전 선언 검사, 위반 시 rc 1 (FR-4) → components.json 수정 전 상태에서 색 leaf 43건 검출 · rc 1 확인 (transparent 2 · rgba 오버레이 포함)

### M1-4 CI 가드 (`scripts/check-token-refs.mjs`)
- [x] 판정 5: `variables.css` `:root` 이름 집합 = `.dark` 이름 집합 (`:root` 전용 · `.dark` 전용 각각 위반) (FR-5)
- [x] 판정 6: component 색 leaf 테마 선언 (theme-modes 함수 재사용, `--component-dir` 옵션) (FR-5)
- [x] 측정 실패 rc 2: `.dark` 정의 0, component 디렉터리 없음 · JSON 0 · leaf 0 (FR-5)
- [x] 요약 줄 추가: `다크 완전성: :root N · .dark N · :root 전용 N · .dark 전용 N · 다크 값 대상 N · 미반영 N | 테마 선언: JSON N · leaf N · 색 leaf N · 위반 N` (FR-5)

### M1-5 테스트
- [x] `packages/axis-tokens/test/theme-modes.test.mjs`: 색 판정 · preprocessor · 선언 검사 · 실제 components.json(leaf 수는 소스에서 센 값 · 색 leaf 43 · 위반 0) · `darkBuildConfig` 해석(바뀌는 목록이 다크 값 기대값과 같음) · 변이 대조(preprocessor 없으면 0개) · `resolveTokenValue` · `findDarkValueExpectations` (FR-7)
- [x] `packages/axis-tokens/test/dark-completeness.test.mjs`: fixture 양성 rc 0, 음성(`:root` 전용 · `.dark` 전용 · 다크 값 미반영 · transparent 선언 누락) rc 1, 토큰 소스 · component 디렉터리 없음 rc 2 (FR-7 · AC6)
- [x] `scripts/check-token-refs.mjs` 판정 5 다크 값 축: `sdDark` preprocessor 제거 빌드에서 rc 1(미반영 29) 확인 (AC5)
- [x] `packages/axis-tokens/package.json` `test` 스크립트 (FR-7)
- [x] `apps/web/e2e/dark-tokens.spec.ts` + `playwright.tokens.config.ts` + `test:e2e:tokens`: Chromium 라이트 component 45개 = 3b52976 고정 기준값(`e2e/fixtures/dark-tokens-light-3b52976.json`), `html.dark` · `div.dark` 29개 이름 · 다크 hex 맵 일치, 다크 대비 ≥ 4.5 (FR-7 · AC4 · AC7)
- [x] 테스트 변이 확인: preprocessor 본체 무력화 시 2건 실패, transparent를 비색으로 바꾸면 5건 실패
- [ ] Chromium 계산값 테스트 CI 배선: 이번 WI 에서는 배선하지 않습니다(CI 에 Playwright 브라우저 설치 단계가 없음). WI-0025 M3 a11y CI 배선 때 함께 검토합니다

### M1-6 검증
- [x] dist sha256: `variables.css`만 변경, 9개 일치, 재빌드 결정성 확인 (AC1)
- [x] `:root` 블록 문자열 동일(8,917바이트), `.dark` 249 = `:root` 249 (AC1 · AC2)
- [x] `variables.css` diff 삭제 0 · 추가 45 (AC3)
- [x] 다크 계산값 변경 29개가 plan 4.1과 일치 (AC4)
- [x] 변이(preprocessor 제거) CSS에서 Chromium 다크 단언 2건 실패, 수정 전 CSS에서 3건 실패, 같은 변이에서 `check-token-refs` rc 1 (AC5)
- [x] `pnpm check-token-refs` rc 0, 실제 산출물 `.dark` 1줄 삭제 사본 rc 1, 수정 전 dist · components 사본 rc 1 (AC6)
- [x] `tokens.json` · `tokens.js` · `tokens.mjs`에 `$extensions` 0건 (소스 45건 대조) (AC8)
- [x] `pnpm turbo run type-check build test --force` (캐시 0) · `pnpm lint` 통과 (비기능)

---

## Phase M2: 릴리스 문서

- [x] `docs/workitems/WI-0025-brand-theme/release-notes.md` 1.2.1 절에 다크 component 토큰 수정 추가 (D6)
- [x] `packages/axis-{tokens,ui-react,agentic-ui,theme}/CHANGELOG.md` 1.2.1 절에 같은 내용 추가 (changeset 없음, D6)
- [x] PR 생성 · 리뷰 · main 머지 → PR #101 머지(b548748, 2026-10-16), Issue #99 종료
- [ ] 1.2.1 npm 배포 후 소비 화면(Card · Dialog · Badge · Input 다크) 확인 → 미확인. 배포는 확인(run 38992207088, npm `latest` 1.2.1, provenance 4/4)했고, 빈 디렉터리에 설치한 `@axis-ds/tokens@1.2.1` `dist/css/variables.css`에서 `:root` 249 · `.dark` 249, `.dark`의 `--axis-card-bg-default` #030712를 확인했습니다. 화면 렌더링은 보지 않아 체크하지 않습니다
- [ ] WI-0025 M2 · M3 rebase 시 plan 6장 체크리스트 수행
- [x] 머지 뒤 `project-todo.md` · `.github/wi-mapping.json` 현행화 (PR #98 머지 후) → 2026-10-17 `chore/post-121-cleanup`에서 ✅ 반영
