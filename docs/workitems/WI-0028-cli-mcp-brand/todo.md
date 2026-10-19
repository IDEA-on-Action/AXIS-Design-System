# WI-0028: CLI · MCP 브랜드 명령 TODO

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | Testplan: [testplan.md](./testplan.md) | GitHub: #87 | 상태: 🔄 구현 · 검증 진행 (2026-10-19, P1 ~ P6 완료, AC2(b) 결정 대기 · PR 전)

## 진행 순서

| Phase | 범위 | 시점 | 릴리스 |
|---|---|---|---|
| P0 | 착수 전 결정, S0 스파이크 | 지금 | 없음 |
| P1 | 공통 기반: 버전 표기, `AxisConfig`, MCP 테스트 환경 (2.2 · FR-2 설정 · FR-6) | 지금 | 없음 |
| P2 | 공유 코어 + fixture, `theme list` · `theme info` (FR-1 · FR-3) | 지금 | 없음 |
| P3 | `theme add` (FR-2) | 지금 | 없음 |
| P4 | `axis check` · `axis.check_project` brand 검사 (FR-5) | 지금 | 없음 |
| P5 | MCP `axis.list_brands` · `axis.get_brand` (FR-4) | 지금 | 없음 |
| P6 | ontology 실데이터 재확인 | **WI-0025 M3(#107) 머지 뒤** | 없음 |
| P7 | AC2(b) 레지스트리 설치 빌드, changeset, 머지 | **1.3.0 배포 뒤** | cli · mcp 1.2.0 |

- P1~P5 는 main 기준 fixture(plan 6.1)로 개발합니다. 코드 PR 은 draft 로 열고, P7 에서 changeset 을 더한 뒤 ready 로 바꿉니다(plan 7장).
- `project-todo.md` · `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다.

---

## P0. 착수 전 결정

> 권장안은 plan 8장. 「게이트」 항목은 결정 전 해당 작업을 시작하지 않습니다.
> 2026-10-19 사용자 결정: U3 = (A), U7 = 별도 WI-0036(#115), U14 = (A), 나머지는 권장안 그대로(plan 8장 「결정」 열). U2 는 S0 실측 뒤 정합니다.
> 2026-10-19 사용자 결정(S0 뒤): U2 = 대안 2(M3 에서 라이트 선택자 명시도 상향, FR-2 위치 유지, T3-3 확정). plan 8.1 끝.

- [x] U1 공유 코어 방식: 복제 + 동일성 테스트 / 내부 패키지 신설 / MCP 가 CLI 소스 번들 → 권장안(복제 + 동일성 테스트) (2026-10-19)
- [x] U2 브랜드 import 위치 (게이트: 위치를 바꾸는 경우): S0 실측 뒤 결정 → S0 에서 FR-2 위치는 라이트 짐 · 다크 이김(plan 8.1). → **대안 2** (2026-10-19): WI-0025 M3(#107)에서 `brandSelectors` 라이트 선택자 명시도를 0,2,0 으로 올리고, FR-2 위치(globals.css `@import`)는 그대로, P3 의 import 삽입 위치(T3-3)를 그 위치로 확정. 이 WI 는 M3 의 선택자 변경에 의존합니다(P6 에서 확인)
- [x] U3 FR-3 보정 내역 출처 (게이트): a11y 메타와 근거 안내만 / `brand.json` 보정 필드(WI-0025 D6 변경) / CLI 정적 표 → **(A)** a11y 메타(`status` · `checkedAt` · `gate`)와 WI-0025 부록 B 문서 안내만, 보정 전 · 후 값은 후속 (2026-10-19)
- [x] U4 「주요 토큰」 목록: 고정 12개 / 브랜드 CSS 전부 / `brand.json` 필드 → 권장안(고정 12개) (2026-10-19)
- [x] U5 tokens 미설치 시 `add` 검증: 이름 규칙만 + 경고 / npm 레지스트리 조회 / 거절 → 권장안(이름 규칙만 + 경고) (2026-10-19)
- [x] U6 추가할 tokens 범위: `^1.3.0` → 권장안 (2026-10-19)
- [x] U7 MCP 기존 데이터 경로 결함(plan 1.2): 별도 WI / 이 WI 포함(게이트) → **별도 WI-0036(#115)로 분리, 이 WI 범위 아님** (2026-10-19)
- [x] U8 기본 토큰 CSS 없는 프로젝트: 안내만 / 자동 추가(게이트) → 권장안(안내만) (2026-10-19)
- [x] U9 버전 번호(PRD Q3)와 PRD 기준 버전 표기 정정 위치 → 권장안(1.2.0 유지, PRD 정정은 PRD 담당 PR) (2026-10-19)
- [x] U10 ~ U13: `ThemeProvider` 안내만(Q1) · TS 타입만(Q2) · 설치 안내만(Q5) · 다른 브랜드 import 유지 + 추가 → 모두 권장안 (2026-10-19)
- [x] U14 「`globalCss` 최우선, 없으면」 해석 → **(A)** 키 부재 · 파일 부재 둘 다로 읽음(plan 4.1) (2026-10-19)
- [x] **S0 스파이크** (U2 판단 근거): Next 15 App Router 와 theme-only 구조에서 globals.css 맨 앞 `@import` 한 브랜드 CSS 의 라이트 shadcn 값이 프로젝트 `:root` 값을 이기는지 계산값으로 실측 (plan 2장 D5, testplan T0) → 2026-10-19 실측(plan 8.1): 라이트 **짐**(`--primary` `240 5.9% 10%`, 대조군과 같음) · 다크 이김(`180 81% 43%`). 대안 1 · 2 는 둘 다 이김. theme-only 원형은 `next build` rc 1(app 디렉터리 없음)

---

## P1. 공통 기반

- [x] CLI `.version()` 이 `package.json` 값을 읽음 (2.2) → testplan T1-1 (2026-10-19, `--version` 0.1.0 → 1.1.4)
- [x] MCP `McpServer` version 이 `package.json` 값을 읽음 (2.2) → T1-2 (2026-10-19, `serverInfo.version` 0.1.0 → 1.1.5)
- [x] `src/config/axis-config.ts`: `AxisConfig`(`brand?` 포함) · `readAxisConfig` · 스키마 URL 상수 (FR-2 설정) (2026-10-19)
- [x] `axis init` · `axis template init` 생성 객체에 `AxisConfig` 타입, 생성 내용 불변 → T1-3 (2026-10-19. 단위 테스트로 부를 수 있게 객체를 `createInitConfig` · `createTemplateConfig` 로 옮김, 키 · 값 · 순서 그대로)
- [x] MCP `vitest` devDependency · `test` 스크립트 · `vitest.config.ts` (FR-6) → T1-4 (2026-10-19)
- [x] MCP `turbo.json` test inputs 에 CLI `brand-core.ts` (FR-6, plan 4.7) (2026-10-19. 파일은 P2 에서 생기므로 그 전까지 해시 대상 0개)
- [x] `pnpm install --offline` rc 0, lockfile 변경은 mcp importer 만 (FR-6) (2026-10-19. pnpm 이 eslint 계열 peer 표기를 다시 쓴 hunk 는 빼고 importer 3줄만 남김, `--frozen-lockfile --offline` rc 0)
- [x] `turbo run test --dry=json` test 태스크 5 → 6 (FR-6) → T1-5 (2026-10-19)

## P2. 공유 코어 · list · info

- [x] fixture 원본 `packages/axis-cli/test/fixtures/theme/`(tokens-1.3 · tokens-1.3-unbuilt · tokens-1.2 · projects/app-init · projects/src-app)와 펼침 helper, theme-only 는 `theme-only.json` 에서 펼침 (plan 6.1) (2026-10-19. M3 가 머지돼 있어 sample 의 index · brand.json · CSS 는 손으로 쓰지 않고 f1777ee 의 `buildBrands` 를 tokens fixture `sample` 로 돌린 산출물을 그대로 넣음(라이트 선택자 `[data-brand="sample"][data-brand="sample"]`). exports 는 1.3.0 · 1.2.1 실제 package.json 에서 옮김. `dist` 는 `_dist` 로 두고 helper 가 바꿈. projects 두 개에 `package.json` 을 더했고, helper 에 tokens 만 까는 `empty` 레이아웃을 더함)
- [x] cli `turbo.json` test inputs 에 `theme-only.json` (plan 5장 12a) (2026-10-19, dry 에서 cli test inputs 에 `../../apps/web/public/templates/theme-only.json` 확인)
- [x] `brand-core.ts`: `resolveTokens` 4상태(ok · not-installed · unsupported · not-built), 설치 여부는 `node_modules/@axis-ds/tokens/package.json` 직접 탐색 (plan 3장 5) → T2-1 (2026-10-19. `findGlobalCss` · `findBrandImports` 는 쓰는 단계(P3 · P4)에서 더함)
- [x] `listBrands` 가 `index.json` → `brand.json` 순으로 읽음 (FR-1) → T2-2 (2026-10-19)
- [x] `parseBrandCss` 라이트 · 다크 블록 (FR-3) → T2-3 (2026-10-19. 선택자 목록에 `.dark` · `[data-theme="dark"]` 가 있으면 다크, 없으면 라이트로 갈라 라이트 선택자 형태(0,1,0 · 0,2,0)에 기대지 않음)
- [x] `axis theme list` 출력: 이름 · 설명 · 테마 (FR-1, AC1 fixture 판) → T2-4 (2026-10-19)
- [x] `axis theme list` 미설치 · 미지원 안내, rc 1 (FR-1) → T2-5 (2026-10-19, 빌드 산출물 없음 안내 포함. 리뷰 보정: index.json 은 있는데 brand.json · CSS 가 없는 부분 빌드도 `not-built`, 724d94b)
- [x] `axis theme info <brand>` 메타 · import 경로 · Provider 예시 · 주요 토큰 (FR-3) → T2-6 (2026-10-19. 브랜드 CSS 에 없는 주요 토큰은 「브랜드가 덮어쓰지 않음」 한 줄로 냄)
- [x] `axis theme info` 보정 내역 (FR-3, U3 (A): a11y 메타와 WI-0025 부록 B 안내만) → T2-7 (2026-10-19. 근거 문서 줄은 브랜드와 상관없이 같은 문구)

## P3. theme add

- [x] `planThemeAdd` · `applyThemeAdd` 분리 (FR-2) (2026-10-19. `src/theme/theme-add.ts`. plan 은 파일을 쓰지 않고 쓸 내용(`before` · `after`)만 계산, apply 는 쓰기 전에 모든 대상이 계획 때 내용과 같은지 · JSON 이 파싱되는지 · CSS 의 브랜드 import 가 정확히 1줄인지 먼저 보고 하나라도 어긋나면 아무것도 쓰지 않음. `findGlobalCss` · `findBrandImports` 는 공유 코어에 더함)
- [x] `axis.config.json` 없으면 아무것도 쓰지 않고 rc 1 (FR-2) → T3-1 (2026-10-19. config JSON 이 깨졌을 때도 같음)
- [x] CSS 대상 탐색 순서 `globalCss` → `app/` → `src/app/` → 루트 (FR-2, A1) → T3-2 (2026-10-19)
- [x] `globalCss` 가 없는 파일을 가리키면 경고 후 다음 후보 (U14 권장안, plan 4.1) → T3-2b (2026-10-19, 폴백을 끈 변이에서 3건 실패 확인)
- [x] import 삽입 위치(`@charset` · 기존 `@import` 뒤, U2 대안 2 로 확정) (FR-2, U2) → T3-3 (2026-10-19. 파일 앞쪽의 빈 줄 · 주석 · `@charset` · `@import` 구간만 보고, 규칙 뒤의 `@import` 는 기준으로 삼지 않음. CRLF 유지)
- [x] 두 번 실행해도 import 1줄 · 의존성 1회 · brand 기록 (AC2(a) fixture 판, 완료 판정은 T6-6) → T3-4 (2026-10-19. fixture 판만 통과, AC2(a) 완료는 T6-6)
- [x] tokens 없으면 `dependencies` 에 `^1.3.0` 추가 + 설치 안내, 설치 미실행 (FR-2, U6) → T3-5 (2026-10-19. 설치 안내 명령은 lockfile 로 고름: pnpm-lock · yarn.lock · package-lock, 없으면 `pnpm install`)
- [x] tokens 1.3.0 미만이면 범위 유지 + 업그레이드 안내 → T3-6 (2026-10-19. 판정은 설치된 버전 기준)
- [x] 브랜드 이름 검증(U5) · 다른 브랜드 import 처리(U13) → T3-7 · T3-8 (2026-10-19. tokens 가 `ok` 가 아닌 세 상태 모두 이름 규칙만 보고 경고와 함께 진행)
- [x] Provider 안내 문구(`defaultBrand`, `<html data-brand>`, theme 1.3.0 조건) (FR-2, Q1) → T3-9 (2026-10-19. `package.json` 에 `@axis-ds/theme` 이 없으면 설치 안내를 덧붙임)
- [x] CSS 대상 없음 → 수동 안내, 나머지 단계 진행 (A1) → T3-10 (2026-10-19)
- [x] 쓰기 대상 경로 검증 보강(2026-10-19 보안 리뷰 지적, 사용자 요청): 실제 경로가 프로젝트 밖이면 거절(기존) + 실제 대상이 `.css` 가 아니면 거절(`css-not-stylesheet`) + `applyThemeAdd` 가 쓰기 직전에 위치 · 확장자를 다시 확인(계획 뒤 심볼릭 링크 바꿔치기 차단) → T3-11
- [x] 리뷰 보정: BOM 으로 시작하는 CSS 에서 BOM 을 맨 앞에 유지 · 쓰기 대상 CSS 가 프로젝트 밖이면 거절 · 쓰기 전 권한 확인과 쓰기 실패 시 되돌림 → T3-3 · T3-12 · T3-13 (2026-10-19, 724d94b)

## P4. check 의 brand 검사

- [x] CLI `runCheck` → `collectCheckResults` 분리, 출력 문구 불변 (FR-5, 2.2) → T4-1 (2026-10-19. 1e84f15 의 `runCheck` 출력을 6개 프로젝트에서 캡처해 `test/fixtures/check/run-check-baseline.json` 으로 고정)
- [x] `brand` 없는 프로젝트는 결과 개수 · 문구가 이전과 같음 (FR-5) → T4-2 (2026-10-19. config JSON 파손도 brand 항목 없음, 기존 config 항목은 종전대로 존재만 봐서 pass)
- [x] brand 일치 pass · import 없음 warn · 다른 브랜드 warn · CSS 없음 warn (FR-5, AC4) → T4-3 (2026-10-19. 대조는 공유 코어 `inspectBrandImport`(구조화된 값만)가 하고, 문구는 두 검사기의 `brandCheckResult` 가 plan 4.5 표대로 만듦. CSS 는 `findGlobalCss`(FR-2 순서)로 고르고 기존 globals.css 항목의 루트 우선 순서는 그대로(D8))
- [x] MCP `handleCheckProject` 에 같은 검사 (FR-5) → T4-4 (2026-10-19. plan 4.5 「같은 함수(코어 사본)」대로 MCP `src/tools/brand-core.ts` 사본과 동일성 테스트를 이 단계에서 먼저 만듦(T5-1))

## P5. MCP 브랜드 도구

- [x] `src/tools/brand-core.ts` 사본 + 동일성 테스트 (U1) → T5-1 (2026-10-19, P4 에서 선행. `axis.check_project` 의 brand 검사가 코어 사본을 써야 해서 P4 에서 만듦. P5 에서 원본을 고치면 사본을 다시 복사)
- [x] `handleListBrands` · `handleGetBrand` · format (FR-4) → T5-2 (2026-10-19. `src/tools/brand.ts`. 핸들러는 코어 `listBrands` · `getBrand` 결과를 그대로 돌려주고, format 2개가 마크다운 글로 바꿈. 없는 브랜드는 `axis.get_component` 와 같이 `isError` 없이 설치된 이름 목록을 돌려주고, `name` 이 비면 오류)
- [x] `axis.list_brands` · `axis.get_brand` 등록, 도구 16 → 18 (FR-4) → T5-3 (2026-10-19, `axis.check_project` 와 같은 try/catch 형태)
- [x] 미설치 · 미지원이면 `isError` 없이 설치 안내 (FR-4, Q5) → T5-4 (2026-10-19. 빌드 전(`not-built`)도 같음. 문장은 CLI `tokensStatusGuide` 와 같음)
- [x] CLI · MCP 응답 동일성 (AC3) → T5-5 (2026-10-19, fixture 판. 실데이터는 T6-4)
- [x] 빌드 산출물 stdio 스모크: `tools/list` 18개, `axis.list_brands` 정상 응답 → T5-6 (2026-10-19)
- [x] README 2개 갱신 (2026-10-19. `packages/axis-cli/README.md` 에 「브랜드 테마 (`axis theme`)」 절, `packages/axis-mcp/README.md` 에 「브랜드 도구」 절)
- [x] **WI-0036(PR #116) 의 `scripts/mcp-smoke.mjs` `EXPECTED_TOOLS` 에 `axis.list_brands` · `axis.get_brand` 추가**. 스모크는 `tools/list` 를 1:1 로 보고 목록 밖 도구도 실패로 칩니다. 2026-10-19 결정 (다)로 WI-0036 이 PR CI 에서도 pack-smoke 를 돌리게 되면, 도구 2개를 등록하고 이 목록을 안 고쳤을 때 이 WI 의 PR CI 에서 실패합니다(PR 단계에서 잡힘). 그 배선이 WI-0036 에 커밋 · 머지되기 전에는(2026-10-19 `origin/fix/wi-0036-mcp-data-path` 497aca9 의 frontend.yml 에 pack-smoke 없음) PR CI 는 초록이고 main push 의 publish.yml Pack smoke 가 6개 패키지 발행을 막습니다. WI-0036 이 먼저 머지되면 이 브랜치에서 함께 고칩니다 → T5-3 (2026-10-19. WI-0036 이 main 에 머지돼 있어(frontend.yml `Pack smoke` 배선 포함) 이 브랜치에서 두 이름을 더함. 수정 전 `pack-smoke` 는 「목록 밖 도구: axis.list_brands, axis.get_brand」로 rc 1, 수정 뒤 rc 0. 두 도구는 대상 프로젝트를 읽으므로 번들 데이터 호출 목록(`registryCalls`)에는 넣지 않음)

## P6. M3 머지 뒤 (ontology 재확인)

- [x] tokens `build --force` 뒤 `dist/brands/index.json` · `ontology/brand.json` · `css/brands/ontology.css` 존재 (plan 6.2-1) → T6-1 (2026-10-19. 3개 모두 있고 npm 1.3.0 배포본과 바이트 같음)
- [x] 산출물 형식과 fixture 대조, 다르면 fixture · 코어 수정. U2 대안 2 로 라이트 블록 머리(선택자)가 바뀌므로 `parseBrandCss` 가 바뀐 머리를 읽는지 확인 (plan 6.2-2) → T6-2 (2026-10-19. 키 · 블록 머리 차이 0, fixture · 코어 수정 없음. fixture 는 P2 에서 이미 `[data-brand][data-brand]` 머리였음)
- [x] tokens tarball `file:` 설치 프로젝트에서 `axis theme list` 가 `ontology` 출력 (**AC1**) → T6-3 (2026-10-19. 1.3.0 이 배포돼 `file:` tarball 대신 npm 레지스트리 설치본으로 판정)
- [x] 같은 프로젝트에서 `theme info ontology` · MCP 두 도구 응답 (AC3 실데이터) → T6-4 (2026-10-19)
- [x] 주요 토큰 목록이 ontology 산출물에 있는지, 긴 `a11y.status` 출력 폭 (plan 6.2-4 · 5) → T6-5 (2026-10-19. 라이트 12/12 · 다크 10/12, 표 한 줄 최대 141자)
- [x] 실제 `axis template init theme-only` 산출물에 `axis theme add ontology` 2회 (**AC2(a)**, plan 6.2-7) → T6-6 (2026-10-19. 기본 레지스트리 403 이라 `AXIS_TEMPLATE_URL` 로컬 서버 주입 전제) → 2026-10-19 사용자 결정: 템플릿 파일이 같아 판정은 유효하므로 `AXIS_TEMPLATE_URL` 주입 전제로 통과로 둔다. `axis.minu.best` Cloudflare 403 이 풀리면 기본 레지스트리로 한 번 더 잰다
- [x] S0 은 P0 에서 fixture `sample` 로 실측함(plan 8.1). 여기서는 U2 결정(대안 2)대로 ontology 산출물로 같은 측정을 한 번 더 하고, **FR-2 위치에서 라이트 · 다크 모두 브랜드 값이 이기는지**를 확인 항목으로 둠(M3 선택자 변경 의존 확인, 음성 · 양성 대조군 포함). 라이트가 지면 진행하지 않고 보고 (plan 6.2-6) → T6-7 (2026-10-19. 라이트 · 다크 모두 이김)

## P7. 1.3.0 배포 뒤

- [x] `npm view @axis-ds/tokens@1.3.0 exports --json` 에 `./brands` (plan 6.3-1) → T7-1 (2026-10-19)
- [ ] App Router 프로젝트 `axis theme add ontology` → `pnpm install` → `pnpm build` rc 0 + import 1줄 · check brand pass · 산출 CSS 의 `data-brand` 선택자(음성 대조군 포함) (**AC2(b)**, plan 6.3-2) → T7-2 (2026-10-19 **미통과**. 이 절차의 `pnpm build` rc 1, 원인은 기존 `axis init -y` 의 `utils.ts`(`clsx` · `tailwind-merge` 미설치). 처리 결정 대기) → 2026-10-19 사용자 결정: 원인(`axis init -y` 의 utils.ts 의존성 누락)은 이 WI 밖이라 WI-0038(#124)로 분리하고, 이 WI 는 「선행 결함으로 보류」로 기록한 채 머지한다. WI-0038 완료 뒤 같은 절차로 다시 잰다
- [x] changeset: `@axis-ds/cli` · `@axis-ds/mcp` minor (plan 7장) (2026-10-19. `.changeset/wi-0028-cli-mcp-brand.md` 1개, `pnpm changeset status --verbose` 에서 둘 다 1.2.0)
- [x] `release-notes.md` 작성 (2026-10-19)
- [x] 품질 게이트: `turbo run build test --force` rc 0, cached 0 → T7-3 (2026-10-19)
- [ ] PR ready → 리뷰 → 머지, 배포 뒤 npm 실측(T7-4)
