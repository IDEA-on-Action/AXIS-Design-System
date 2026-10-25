# WI-0083: library 대표 선택 · TW3 preset dist 진입점 테스트 보강 PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0083 | GitHub: #212 | 우선순위: P3 | 상태: Approved (2026-10-26 사용자 결정, project-todo 「배치 6b 결정」 권장안 일괄 채택)
> 기준: `main` 6d455f7 (linked 1.8.1 · cli 1.7.0 · mcp 1.4.0 발행본, 미발행 changeset 0) | 묶음: 배치 6b (WI-0080 · 0081 과 파일이 겹치지 않아 별도 PR)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

배치 6 검토(WI-0077 · WI-0078) 뒤에 남은 테스트 빈칸 두 건이에요. 제품 코드 · 발행물은 바뀌지 않아요.

1. **library 대표 선택이 상세 JSON 129개를 모두 읽음** (`apps/web/e2e/library-reps.cjs`)
   - 수정 전 `pickLibraryReps` 는 `list.map(withDetail)` 로 index 129개 상세 JSON 을 먼저 다 읽고 그 뒤에 대표를 골랐어요. 대표와 무관한 파일 하나의 결손(ENOENT)이나 대표보다 앞 항목의 `code` 결손(TypeError)이 대표 선택 전체를 멈추고, 그 결과 a11y 경로 목록(`a11y-routes.cjs --count`, CI 건수 가드)까지 멈췄어요.
   - `a11y-routes.cjs` 의 `libraryCodeRep` 가 DYNAMIC 두 라우트에서 각각 불려 1회 계산에 상세 JSON 읽기가 258회였어요.
   - code 대표와 renamed 대표가 같은 항목이어도 통과했어요(같은 항목 금지 검사 없음).
   - 경로가 `PUBLIC_DIR` 상수라 픽스처로 단위 테스트할 수단이 없었어요.
   - `scripts/check-library-links.mjs` 는 파일 결손은 잡지만 상세 화면(`component-detail-content.tsx` 216 · 217 · 234 · 238 · 243행)이 검사 없이 읽는 `code.files` · `code.dependencies` · `code.registryDeps` 모양은 아무도 보지 않았어요.
2. **TW3 preset 테스트가 dist 진입점을 보지 않음** (`packages/axis-tokens/test/tw3-border-default.test.mjs`)
   - `src/tailwind-preset.ts` 를 바로 읽어 소비자가 받는 `dist/tailwind-preset.mjs`(import) · `dist/tailwind-preset.js`(require, 후처리)의 `borderColor.DEFAULT` 를 보지 않았어요. 한쪽 진입점에서만 값이 빠지는 회귀를 못 잡아요.
   - preflight 만 보면 `borderColor` 를 `theme.extend` 밖으로 옮기는 우선순위 회귀(기본 팔레트 테두리 유틸리티 소실)를 dist 에서 못 잡아요.
   - `cjs-preset.test.mjs` 의 사본 빌드는 tsup 인자를 package.json build 스크립트에서 손으로 복제하고 있었어요(반박 검토 major).

### 1.2 재현 (측정, 수정 전 6d455f7)

| 조건 | 결과 |
|---|---|
| 원본 데이터 사본 | `a11y-routes.cjs --count` rc 0 · 59, 대표 axis-accordion · shadcn-accordion · monet-hero-with-image, 상세 JSON 읽기 a11y 1회 258 · pickLibraryReps 1회 129 |
| 비대표 마지막 항목 `axis-tool-call-card.json` 삭제 | `--count` rc 1 ENOENT. check-library-links rc 1 · 「components/axis-tool-call-card.json 이 없습니다」 |
| `shadcn-accordion` 상세에 코드 파일 1개 주입 | library-reps rc 0, code = renamed = shadcn-accordion |
| 맨 앞 `shadcn-accordion` 상세의 `code` 삭제 | library-reps rc 1 `TypeError: Cannot read properties of undefined (reading 'files')`, check-library-links rc 0 · 위반 0건 |
| 비대표 항목 `code.files[0].path = 1` · `registryDeps = 'x'` | `--count` rc 0 · 59, check-library-links rc 0 · 위반 0건 |
| tokens 패키지 사본, 후처리가 `.mjs` DEFAULT 를 지움(M1) · footer 가 CJS borderColor 를 지움(M2) | 수정 전 cjs-preset · tw3 테스트 21/21 통과(공백) |
| src 에서 borderColor 를 theme 직속으로(M3) | 수정 전 테스트는 src deepEqual 2건만 실패, dist 는 아무것도 못 잡음 |

측정 산출물: `scratchpad/w6bimpl/WI-0083/`(`repro-head.txt` · `neg-head.log` · `mut-*.txt` · `scripts/`). 상세는 [testplan.md](./testplan.md).

### 1.3 결정 (2026-10-26 사용자, 권장안 일괄 채택)

| # | 결정 | 근거 |
|---|---|---|
| D1 | A. index 속성(source · slug)으로 후보를 먼저 정하고 대표 3개만 상세 JSON 을 읽음. code 는 source axis 첫 항목(코드 파일 있어야 함), existing 은 코드 없어야 함 | 코드 있는 항목은 axis 48/48 뿐이라 지금 데이터에서 같은 항목. 읽기 258 → 3 |
| D2 | A. check-library-links 에 code 모양 판정 추가 | 비대표 항목 모양은 지연 읽기 뒤 이 검사만 봄 |
| D3 | A 변형. node --test 파일을 루트 `check-library-links` 스크립트에 `&&` 로 이어 기존 CI 단계에서 실행 | 선례(check-types-versions · check-changeset-mcp-tokens), workflow 단계 추가 없음, E2E 건수 가드 불변 |
| D4 | A. cjs-preset.test.mjs 의 makeConsumer 재사용, 변이는 빌드 파이프라인 쪽(후처리 · src · build 스크립트) | 빌드 비용 0, 실제 dist 를 읽으면 turbo test 가 build 에 의존하지 않아 낡은 dist 로 거짓 초록 |
| D5 | A. TW4 무영향은 dist/css sha256 불변 + tailwind4.test 통과, 브라우저는 testplan 1회 기록 | 테스트만 바뀌어 발행물 바이트 불변 |
| 릴리스 | changeset 없음, 6b Release 와 별도 PR | tokens `files` 는 `["dist"]` 뿐, 나머지는 발행 패키지 밖 |

## 2. 범위

### 2.1 바꾸는 파일

- `apps/web/e2e/library-reps.cjs`: `pickLibraryReps(publicDir = PUBLIC_DIR)`, index 속성으로 후보 선택, 같은 항목(id · 상세 주소) 금지, 대표 3개만 읽고 대표 결손은 종류 · id 를 담아 멈춤
- `apps/web/e2e/a11y-routes.cjs`: `libraryCodeRep` 메모이즈(1회 계산 읽기 3회)
- `apps/web/e2e/library-detail.spec.ts`: 대표 규칙 주석, `pickLibraryReps` 형 선언에 `publicDir?` (동작 변경 없음)
- `scripts/check-library-links.mjs`: 판정 7 「code 모양」
- `scripts/library-reps.test.mjs`(신규) · `scripts/check-library-links.test.mjs`(신규): node --test. `apps/web/e2e` 는 Playwright 기본 testDir 이라 `*.test.*` 를 두면 E2E 건수가 바뀌므로 scripts 아래에 둠
- `package.json`(루트): `check-library-links` 에 두 테스트 연결
- `.github/workflows/frontend.yml`: 주석만(Library link check 단계 설명, 건수 가드의 대표 규칙 서술). 단계 · 건수 기대값 변경 없음
- `packages/axis-tokens/test/cjs-preset.test.mjs`: tsup 인자 · 후처리 여부를 build 스크립트에서 읽음, dist 세 진입점 판독(`probe-dist.mjs`) 테스트 8건
- `packages/axis-tokens/test/tw3-border-default.test.mjs`: 주석(dist 단언 위치 안내)

### 2.2 범위 밖

- `index.json` 에 코드 파일 수를 넣는 데이터 · 생성기 변경(D1-C)
- TW3 · TW4 소비자 브라우저 측정의 CI 상시화(D5-B)
- 발행물 · 사이트 콘텐츠 변경

## 3. 수용 기준 (AC)

| AC | 기준 |
|---|---|
| AC1 | 원본 데이터에서 `pickLibraryReps` 1회와 `listA11yRoutes` 1회가 상세 JSON 을 각각 3번만 읽음(수정 전 129 · 258). 전체 읽기로 되돌리는 변이에서 테스트 실패 |
| AC2 | 대표가 아닌 상세 JSON 결손 · 대표보다 앞 항목의 code 결손 사본에서 대표가 그대로. 같은 결손을 check-library-links 가 rc 1 로 잡음 |
| AC3 | code · renamed · existing 대표 자신의 상세 JSON 결손 · code 결손은 「대표 <kind> <id> 의 상세 JSON ...」 메시지로 멈춤(TypeError 아님). code 대표에 코드 없음 · existing 대표에 코드 있음도 멈춤 |
| AC4 | code 와 renamed 가 같은 항목(id 또는 상세 주소)이면 멈춤. 검사를 지우는 변이에서 테스트 실패 |
| AC5 | 원본 데이터에서 대표 3개 · `--count` 59 · E2E a11y 236 · library 4 그대로(frontend.yml 기대값 수정 없음) |
| AC6 | 패키지 사본 빌드 dist 의 import(.mjs) default · require(.js) · require(.js).default 각각 resolveConfig `borderColor.DEFAULT` 와 TW3 preflight border-color 가 `hsl(var(--border, 220 13% 91%))` 하나. 변이 M1 은 ESM 단언만, M2 는 CJS 두 단언만 실패 |
| AC7 | 같은 dist 컴파일에 `.border-red-500` 규칙 1개, 소비자 `theme.extend.borderColor.DEFAULT`(#123456)가 이김. 변이 M3 은 preflight 단언은 통과하고 border-red-500 단언만 실패 |
| AC8 | `dist/css` 4개 sha256 이 변경 전후 같음, tailwind4.test 통과 수 불변. 브라우저 1회 기록(testplan) |
| AC9 | 새 테스트가 실제로 돎: turbo test `--force`(Cached 0)에서 tokens 통과 수 증가, `pnpm check-library-links` 에서 node --test 통과 수 확인, 변이로 그 단계가 rc 1 |

## 4. 위험

- D1-A 는 code 대표 규칙을 「코드 있는 첫 항목」에서 「source axis 첫 항목이며 코드 있음」으로 바꿔요. 지금 데이터에서는 같은 항목이지만, axis 첫 항목에서 코드가 빠지면 다른 항목으로 넘어가지 않고 멈춰요(의도). 규칙 서술은 library-reps.cjs · a11y-routes.cjs · library-detail.spec.ts · frontend.yml 주석 4곳을 함께 고쳤어요.
- CI 에서는 check-library-links 가 a11y E2E 보다 앞 단계라 결손 시 그 단계에서 먼저 멈춰요. 이번 개선의 체감 이득은 주로 로컬 · E2E 단독 실행 쪽이에요.
- `packages/axis-tokens/package.json` 의 test 목록은 손으로 적혀 있어요. 이번에는 새 파일을 만들지 않고 기존 `cjs-preset.test.mjs` 에 넣어 목록 변경이 없어요.
