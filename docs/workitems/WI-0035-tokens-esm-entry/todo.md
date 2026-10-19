# WI-0035: tokens ESM 진입점 문법 오류 수정 TODO

> PRD: [prd.md](./prd.md) | 상태: 🔄 진행 (2026-10-19 구현 · 검증 완료, PR #118 머지 대기. 1.2.2 취소, 1.3.0 에 포함)

## 진행 순서

| Phase | 범위 | 릴리스 | GitHub |
|---|---|---|---|
| M1 | ESM 포맷 수정 · 설치 스모크 · 회귀 테스트 · changeset (FR-1~6) | 1.3.0 에 포함 (linked 4패키지, WI-0025 M4 와 함께. tokens changeset 은 patch) | #113 |

- 브랜치: `fix/wi-0035-tokens-esm` (기준 main e690905)
- `project-todo.md` · `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다(PR #112 담당)

---

## 착수 전 결정

- [x] 1.3.0 포함 vs 별도 patch 선배포 → ~~2026-10-19: 별도 patch 1.2.2 선배포~~ → ✅ 2026-10-19 재결정: 1.2.2 취소, 1.3.0 에 포함 (D1). 근거: `main` 에 1.2.1 배포(014e8ac) 뒤 머지된 WI-0025 M2(89ab33a, ThemeProvider `brand` · `ThemeContextValue` 필수 멤버)가 changeset 없이 있어 `main` 에서 1.2.2 를 내면 그 기능과 타입 변경이 patch 로 나감(실측 `git diff 014e8ac origin/main -- packages/axis-theme/src/index.ts`). `publish.yml` 은 `main` 에서만 발행(OIDC)해 1.2.1 태그 기반 release 브랜치는 인프라 변경이 필요. 결함은 6개 배포본 전부에 있었고 보고 0건 (D3)
- [x] 수정 방식 → ✅ 포맷에서 TS 전용 두 줄만 제거, `.d.ts` 불변 (D2)
- [x] 의존 정확 고정(`updateInternalDependencies`)에 따른 동반 bump 수용 여부 → ✅ 2026-10-19 사용자 결정: 수용. 1.3.0 에 합치면서 자연히 해소됨: tokens · ui-react · agentic-ui · theme 는 linked 라 넷이 함께 1.3.0 으로 오르고, 세 패키지의 `@axis-ds/tokens` 고정도 1.3.0 이 됨 (아래 M1-5)
- [x] 머지 순서 → ✅ 2026-10-19: #116(mcp 1.1.5) → M3 #107 → WI-0030 #114 → #118(이 PR) → M4 #110 → Version Packages PR(1.3.0). #118 을 일찍 머지하면 Version PR 이 1.2.2 를 제안하므로 M4 바로 앞에 둠 (D4)

---

## Phase M1

### M1-1 원인 실측
- [x] `tokens.mjs` 생성 위치: `build-tokens.mjs` 커스텀 포맷 `typescript/axis-module`, 최초 커밋 f57de7d 부터 (C1)
- [x] CJS · `.d.ts` 생성과 비교: 내장 `javascript/module-flat` · 커스텀 `typescript/axis-declarations`, TS 전용 문법 없음 (C2)
- [x] npm 배포본 6개(1.1.0~1.2.1) 전부 import 실패, 1.2.1 배포본 = e690905 빌드 (C3)

### M1-2 수정과 산출물 비교
- [x] 수정 전 기준선: e690905 `turbo run build --filter=@axis-ds/tokens --force` (rc 0, cached 0/1), dist 10개 sha256 저장
- [x] 포맷에서 ` as const` · `export type Tokens` 제거 (FR-1)
- [x] 수정 뒤 `--force` 빌드 sha256 diff: `js/tokens.mjs` 1개만 변경, `css/variables.css` · `css/shadcn-compat.css` · `tokens.js` · `tokens.json` · `tokens.d.ts` · tailwind 4개 동일 (FR-2)
- [x] 새 `tokens.mjs` = 1.2.1 배포본에서 TS 전용 두 줄만 걷어낸 파일 (`cmp` rc 0)
- [x] 값 동등: ESM 평면화 249개 = `tokens.js` 249개 = `tokens.json` (깊은 동등 PASS). 원형 그대로의 깊은 동등은 모양 차이(중첩 대 평면)로 성립하지 않음 (FR-3)

### M1-3 설치 스모크 (FR-4)
- [x] `scripts/pack-install-smoke.mjs` 추가, 루트 `pack-smoke` 뒤에 연결
- [x] 수정본: 런타임 8건 통과 + types(`.` · `./tailwind`) tsc rc 0, 스모크 rc 0
- [x] 음성 대조: e690905 사본 빌드 tarball → `.` import `Unexpected identifier 'as'` 1건, rc 1. npm 1.2.1 tarball 도 rc 1
- [x] 공개 타입: 수정 전후 tarball 의 `tokens.d.ts` sha256 동일(0993bd72dbb0), tsc 선언 출력 diff rc 0
- [x] `pnpm pack-smoke` 전체 rc 0 (6개 패키지 pack 검증 + tokens 설치 스모크)

### M1-4 테스트 (FR-5)
- [x] `test/js-entry.test.mjs` 4건 추가, `test` 스크립트에 등록
- [x] 음성 대조: 포맷에 ` as const` 를 되살리면 4건 중 3건 실패(rc 1), 원복 뒤 sha 동일 확인
- [x] tokens `turbo run test type-check lint --force`: rc 0, cached 0/3, tests 73 (기존 69 + 4), fail 0, skipped 0

### M1-5 changeset (FR-6)
- [x] `.changeset/wi-0035-tokens-esm-entry.md` (`@axis-ds/tokens` patch)
- [x] `pnpm changeset status --verbose`: tokens 1.2.2, ui-react · agentic-ui · theme 1.2.2, axis-nextjs-example 0.1.5 (전부 patch)
- [x] 동반 bump 수용 여부 확인 (✅ 2026-10-19 수용, ui-react · agentic-ui · theme 는 `dependencies` 에 `workspace:*` 라 배포본이 `"@axis-ds/tokens": "1.2.1"` 정확 고정. tokens 만 올리면 이 세 패키지 사용자는 수정본을 받지 못함). 1.3.0 에 합치면서 별도 동반 bump 는 없어짐: 위 1.2.2 는 이 브랜치 단독 상태의 표시이고, M4 minor changeset 과 합쳐지면 linked 4패키지가 1.3.0 으로 오름
- [x] changeset 파일은 patch 그대로 유지 (M4 minor 와 합쳐 1.3.0, 2026-10-19 결정)

### M1-6 마무리
- [ ] PR 생성 · 리뷰 · main 머지 (머지 시점: WI-0030 #114 뒤, M4 #110 바로 앞)
- [ ] Version Packages PR 이 linked 4패키지 1.3.0 을 제안하는지 확인 (1.2.2 가 나오면 머지 순서 위반)
- [ ] publish.yml 실행 뒤 npm 1.3.0 배포본으로 설치 스모크 재실행(`--tarball`)

---

## 후속 (backlog)

- tailwindcss 4 와 TypeScript `node16` 조합에서 `@axis-ds/tokens/tailwind` 타입 import 가 TS1479 로 실패합니다(peer 범위 `>=3.0.0` 그대로 설치했을 때 관측, 3.4.19 에서는 통과). 별도 WI 후보
- `.d.ts` 의 `export =` 와 ESM 런타임 export 정합 검토. `.d.ts` 는 중첩 모양이라 CJS require(평면 249키, `ColorGray50`) 런타임과 타입이 어긋나요(기존 결함)
- M3·M4 브랜치(WI-0025)와 병합할 때 `packages/axis-tokens/package.json` 의 `test` 스크립트 줄이 충돌합니다(`git merge-tree` rc 1, M3 `origin/feat/wi-0025-m3-ontology-v2` · M4 34d7bca 둘 다). 나중에 머지되는 쪽(M3)이 test 목록을 합집합으로 해소하고 `test/js-entry.test.mjs` 를 유지합니다. 해소 뒤 M3 에서 tokens test 를 재실행해 js-entry 4건이 포함되어 도는지 확인합니다. `build-tokens.mjs` 는 자동 병합되고 `as const` 템플릿은 남지 않습니다
- ~~1.2.2 배포 후 M4(WI-0025) 1.3.0 릴리스 노트의 대상 줄을 `1.2.2 → 1.3.0` 으로 고치고 `1.2.2 (patch, WI-0035)` 항목 링크를 추가합니다(M4 담당)~~ → 1.2.2 취소(2026-10-19)로 M4 릴리스 노트의 대상 줄은 `1.2.1 → 1.3.0` 그대로이고, WI-0035 ESM 수정을 1.3.0 의 fix 항목으로 넣습니다(M4 담당). AC3 기준선(1.2.1 fixture)은 CSS 가 같으므로 유지합니다
- 설치 스모크 대상 확대(ui-react · agentic-ui · theme · cli · mcp), PR CI 에서 pack-smoke 실행
- 루트 `scripts/pack-smoke.mjs` 의 미사용 `statSync` import(eslint no-unused-vars 1건, 루트 scripts 는 lint 대상 밖)
