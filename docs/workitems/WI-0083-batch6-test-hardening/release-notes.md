# WI-0083: library 대표 선택 · TW3 preset dist 진입점 테스트 보강 릴리스 노트

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #212 | 날짜: 2026-10-26 | 배포: PR #220 머지 3591f9b(2026-10-26), npm 발행 없음

## 요약

배치 6 검토에서 남은 테스트 빈칸 두 건을 메웠어요. 제품 코드와 발행물은 바뀌지 않아요.

- library 상세 E2E 의 대표 선택이 index.json 속성으로 후보를 정하고 대표 3개의 상세 JSON 만 읽어요(a11y 경로 1회 계산 읽기 258 → 3). 대표와 무관한 항목의 결손은 대표 선택을 멈추지 않고, 그 판정은 `check-library-links` 가 맡아요. 같은 항목이 두 대표로 뽑히면 멈춰요.
- `check-library-links` 가 상세 화면이 바로 읽는 `code` 모양(files · dependencies · registryDeps)을 봐요.
- Tailwind 3 preset 테스트가 소비자가 받는 dist 세 진입점(import `.mjs` · require `.js` · require `.js` 의 default)에서 기본 테두리색 · preflight · `border-red-500` · 소비자 우선을 봐요.

## 변경

- `apps/web/e2e/library-reps.cjs`: `pickLibraryReps(publicDir)`, 후보 선택 · 같은 항목 금지 · 대표 결손 메시지
- `apps/web/e2e/a11y-routes.cjs`: code 대표 한 번만 고름
- `apps/web/e2e/library-detail.spec.ts`: 주석 · 형 선언
- `scripts/check-library-links.mjs`: 판정 7 「code 모양」
- `scripts/library-reps.test.mjs` · `scripts/check-library-links.test.mjs`(신규): 루트 `pnpm check-library-links` 가 함께 실행(CI 「Library link check (offline)」 단계)
- `.github/workflows/frontend.yml`: 주석만. 단계 · E2E 건수 기대값(a11y 236 · library 4) 그대로
- `packages/axis-tokens/test/cjs-preset.test.mjs`: 사본 빌드가 package.json build 스크립트의 tsup 인자 · 후처리 단계를 따름, dist 진입점 테스트 8건
- `packages/axis-tokens/test/tw3-border-default.test.mjs`: 주석

## 영향

- npm 발행 없음, changeset 없음. `@axis-ds/tokens` 의 `files` 는 `["dist"]` 뿐이고 dist 15개 파일 sha256 이 변경 전후 같아요(testplan 5절). 나머지 파일은 발행 패키지 밖이에요.
- CI 시간: Library link check 단계에 node --test 28건(로컬 약 0.7초), tokens test 에 8건(cjs-preset 로컬 약 10초, 종전 약 5.5초).
- Pages: main 머지 때 배포가 다시 돌 수 있지만 사이트 콘텐츠 · public 데이터는 바뀌지 않아요.

## 배포

- 2026-10-26 PR #220 머지 3591f9b(PR CI 19m45s 통과). 6b Release(WI-0080 · 0081, Release PR #221 → cli 1.7.1 · mcp 1.4.1) 와 별도 PR 이고, 이 WI 로 발행된 npm 패키지는 없어요(changeset 없음, linked 4패키지 1.8.1 그대로).
