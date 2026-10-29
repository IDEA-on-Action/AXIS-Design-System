# WI-0097: check 의 CSS import 해석 가능성 판정 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #241 | 상태: ✅ 완료(2026-10-29, cli 1.7.7 · mcp 1.4.6) · 남은 항목 2개(plan 4절 분류 확정 · AC1 · AC5 F 행 실빌드)

## 결정
- [x] 사용자 결정 Q21 · Q22 · Q24 · Q26 · Q27 · Q28(2026-10-28)과 선례 항목(prd 1.2)을 구현 전에 다시 읽고 범위 고정 (AC1 ~ AC13) (2026-10-28, prd 1.2 결정 표 · 머리말 상태 Approved, AC1 ~ AC13 은 prd 2절. 구현이 Q21 · Q28 범위를 따름은 testplan 4.1 · 4.2)
- [x] **착수 게이트(Q22)**: PnP 루트 전용 CSS `@import` 실빌드 1회(`@axis-ds/ui-react/tailwind.css` · `@axis-ds/tokens/css/tailwind4`, Yarn 4.5.3 실설치, `.pnp.cjs` 표지 사용). rc 와 오류 문구를 testplan 2절에 기록. rc 0 이면 구현 중단 · Master 보고 (AC3 · AC5 · AC6) → 2026-10-28 측정: 루트 전용 세 spec 모두 rc 1 「Can't resolve」, 앱에도 선언하면 rc 0, 재현 2회 같음(testplan 2절). 게이트 통과
- [x] 사용자 결정 Q37 · Q39 · Q40 · Q41 · Q42(2026-10-28)를 prd 1.2 결정 표에 기록 → Q39 구현(아래), Q40 · Q41 잔여 기록, Q42 문구 정정, Q37 은 2부
- [x] 사용자 결정 Q43(2026-10-28): TW4 B1 새 안내 문구 8개(줄 없음 4 · 줄 있음 4)를 구현 그대로 확정, prd 결정 표에 기록 → 코드 변경 없음, 확정 문구와 코드 문자열 grep 대조를 testplan 4.4 에 기록
- [x] 사용자 결정 Q48 · Q49(2026-10-28): 2부 새 문구 G-1 ~ G-4 와 추가 명령 범위 `^1.4.0` 확정, plan 목록 밖 기존 테스트 7건은 기대 불변 · 설치 stub 보강 승인 (AC6 · AC10)
- [x] 열린 확인 O1(g2 tokens 앱 선언 · 미설치의 globals) → 결정됨(Q28, 2026-10-28): globals PASS 유지, 앱 선언 · 미설치는 globals 게이트 밖 (AC6 · AC7 · AC11 M6)
- [ ] 바뀔 기존 테스트 목록을 plan 4절에서 「stub 보강」 · 「기대 변경」 · 「불변」으로 확정 (AC10) (남음: plan 4절 표의 globals PASS 후보 · TW4 PASS 행이 아직 「추정」 · 「뒤집힐 후보」 분류 그대로예요. 실제 전이는 testplan 4.1 1부 · 2부에 있어요)
- [x] WI-0100a 머지 확인(파일 선택 헬퍼 · `findGlobalCss` 이전) 뒤 그 위에서 착수 (plan 3절) → 0100a 는 #250(293500e)로 머지됐고, 1부를 origin/main ce04f02 위로 옮긴 ac65811 에서 2부를 했어요(2026-10-28)

## 구현
- [x] registry-core `project.ts`: 컴포넌트 `tailwind.css` 해석 상태 헬퍼(1.4 표 6갈래 + 앱 선언) (AC1 ~ AC5) → `componentCssResolution`(1부, 단위 테스트 11갈래 · 변이 M2 · M3 · M5a · M5b · M8 · M10 · M11 빨강)
- [x] registry-core `project.ts`: tokens CSS 해석 상태 헬퍼(앱 선언은 미설치여도 해석으로 봄(Q28) · non-PnP 설치본 디렉터리 · PnP 루트 전용. WARN 은 루트 선언 · 미설치, 미선언 · 미설치, PnP 루트 전용만) (AC6 · AC7) → `tokensCssResolution`(1부, 단위 테스트 9갈래만. globals 게이트에 붙이는 것은 2부)
- [x] DEC-2 판정 · 미루는 이유 문구 · 1.4.0 상수를 registry-core 로 이전, `COMPONENT_TAILWIND_CSS_MIN_VERSION` 과 `TAILWIND4_MIN_AXIS_VERSION` 통합 (AC9) → `deferredComponentImportReason` · `DeferredComponentImport` · 상수(원본 project.ts, 종전 이름은 다시 내보냄)
- [x] cli `theme-add.ts:404-419` · `theme/index.ts:367-385` 가 이전한 헬퍼 · 문구 함수를 부르게 교체(출력 바이트 불변) (AC9) → theme-add.test 기존 73건 기대 변경 0, theme add A/B 20개 diff 0(testplan 4.2)
- [x] `tailwind4Issues` B1 줄 없음 방향(`:826-835`)을 헬퍼로 (AC1 ~ AC4) → 새 테스트 c0dcc14 소스에서 빨강 · 수정본 초록, fixture 40개 A/B(testplan 4.2)
- [x] `tailwind4Issues` 줄 있음 방향(`:843-849`)에 해석 불가 WARN, 혼합 패키지 문구 잇기 (AC5) → 같은 측정, 변이 M7 빨강. 문구는 확정(Q43, testplan 4.4)
- [x] Q39: 루트 선언 · 설치본 버전 모름 · 파일 없음 + 줄(root-inst-unknown-withline)을 PASS 에서 해석 불가 WARN 으로(`componentCssPresentIssue` 의 `root-old` 갈래, 문구는 확정(Q43)). 줄 없음(F4u)은 prd 1.4 표 4번대로 이미 「버전 모름」 올림 안내 → 새 행 F4uw(cli 2 · mcp 1), 갈래를 끈 변이에서 cli 2 · mcp 1 빨강, fixture A/B 전이 2개 · rc 0 그대로, theme add 20쌍 diff 0
- [x] Q42: 해석 순서(파일 존재 → 버전) 확정, prd 1.4 표 6번 칸과 `project.ts` `componentCssResolution` docstring 정정
- [x] `checkGlobalsCss` pass 갈래(WI-0100a 가 옮긴 뒤의 `:360-366` 상당)에 tokens 게이트 (AC6) → 2부(2026-10-28): `tokensCssUnresolvedIssue` 를 import 갈래 · 레이아웃 JS 갈래에 붙임(`--axis-*` 직접 정의는 게이트 없음). 앱 선언은 미설치여도 PASS(Q28), 설치본 디렉터리가 있으면 PASS(G6). testplan 4.1 · 4.2 · 5절 2부
- [x] 2부 · Q37(WI-0100a 에서 넘어옴): 프로젝트 밖 진입 파일의 패키지 줄은 그 파일 위치 기준으로 해석 게이트를 돌려 해석되지 않으면 WARN (0100a 머지 뒤) → 2부(2026-10-28): `outsideCssPackageResolution`(project.ts). 앱에서 찾은 설치본이 그 파일 위치에서 보이지 않으면 tailwind.config(`tailwindcss` · 컴포넌트 줄) · globals(토큰 줄) WARN. PnP 이거나 앱 위치에서 설치본을 찾지 못하면 판정하지 않음(종전). 실빌드 A/B 5개가 check 와 5/5 대응(testplan 4.3)
- [x] 주석 갱신: `tailwind-core.ts:1-33`(`:12-14` · `:24-26`), `:55-65`(B1 은 `declaredRange` 그대로라는 서술), `project.ts:174-175`. 확인은 범위 서술 grep 대조(「`declaredRange` 그대로」 · 「check 만 불인정」 류가 남은 곳 0) (AC13) → 1부: B1 서술(`tailwind-core.ts` 머리 주석 · `declaredRangeForCheck` 주석 · `project.ts:174-176`)만 고침, globals 서술 · README 는 2부 → 2부: 머리 주석에 globals 게이트 · Q37 서술을 더하고 「tokens CSS import 가 있으면 pass」 서술을 좁힘, `checkGlobalsCss` · `tailwind4Issues` docstring 갱신. grep 대조에서 낡은 범위 서술 0(남은 2곳은 좁혀졌다는 한정이 붙은 새 문장)
- [x] 문서: `packages/axis-cli/README.md:101` · `:104` · `:109`, `docs/guides/troubleshooting.md` PnP 한 줄(Q27) (AC13) → 2부: README Tailwind 4 문제 2번 · 5번 · 프로젝트 밖 전역 CSS 단락 · globals.css 항목, troubleshooting 2절 Tailwind 4 목록에 PnP 한 줄(0098 은 Tailwind 3 단락이라 겹치지 않음). 같은 절의 `axis check` 설명 줄 · theme-customization 표(`:356`)는 Q27 범위 밖이라 그대로 둠(Master 확인)

## 테스트
- [x] 0100a 머지 직후 HEAD 기준선(파일별 통과 수 · 빌드 사본 · SHA) 고정, mcp `tokens-sync` 는 빌드 뒤 실행 확인 (AC7 · AC10 · AC12) → ac65811 빌드 사본 `$S/WI-0097impl/part2/headbuild`(cli `index.js` 133eb86b…), 기준선 cli 1002 · mcp 213(rebase 측정), mcp vitest 는 빌드 뒤 실행
- [x] 새 describe 「WI-0097」: AC1 ~ AC6 행 · AC7 가드 행(cli), MCP 대응 행 (AC1 ~ AC8) → 1부 + 2부 「2부」 describe(cli 16 · mcp 4, G1 ~ G7 · G7b · Q37 · 헬퍼)
- [x] 새 테스트를 HEAD 소스에 돌려 AC1 ~ AC6 행 빨강 · AC7 가드 행 초록 확인 (AC1 ~ AC7) → 1부 분(AC1 ~ AC5 · B1 가드)은 c0dcc14 소스에서 확인(cli 24 · mcp 7 빨강, 가드 초록, testplan 4.1). AC6 · globals 가드는 2부 → 2부: ac65811 소스에서 cli 10 · mcp 4 빨강, 가드 초록(testplan 4.1 2부)
- [x] A/B probe 로 기존 테스트 전이 전수 기록, plan 4절 목록과 대조 (AC10) → 2부: 전이 cli 10 · mcp 5, 모두 stub 보강 · 기대 불변. 그 가운데 plan 4절 목록 밖 cli 5 · mcp 2(testplan 4.1 2부). plan 4절 표 갱신은 Master 확인 뒤 (2026-10-28, testplan 4.1 2부. 목록 밖 7건은 사용자 결정 Q49 로 승인, plan 4절 마지막 행에 기록)
- [x] 변이 M1 ~ M4 · M5a · M5b · M6 ~ M12 각각 빨강, sha256 대조 원복 (AC11) → 1부 M1 ~ M3 · M5a · M5b · M6 · M7 · M8 · M10 · M11(B1 쪽), 2부 M4 · M6g · M9 · M11g · M12 · MQ37 · MQ37d · ML 모두 빨강, 원복 sha256 OK(M11g 는 mcp 0, 행 없음)
- [x] scratchpad fixture 를 발행본 · 수정본 CLI · MCP 로 재측정, rc 표 (AC1 ~ AC8 · AC12) → 2부: F 40 · F6i 2 · G 12 · Q37 5 = 59개를 ac65811 사본 · 수정본 CLI · MCP 로 잼(CLI rc 59/59 같음, CLI=MCP 59/59). 발행본 열은 2부에서 다시 재지 않음 (2026-10-29, 발행본 1.7.6 · 1.7.7 CLI 의 rc 를 `out=$(...); rc=$?` 로 fixture 174개에서 받음: 0→0 102 · 1→1 62 · 1→0 10 · 0→1 0, CLI = MCP 판정 줄 174/174). 이 WI 계열 fixture 의 rc 는 바뀌지 않음(종료 코드 불변과 맞음)
- [x] theme add 출력 A/B(fixture 5종) diff 0 (AC9) → 1부 중간 측정: c0dcc14 사본 대 수정본, 10 레이아웃 × 2 패키지 = 20개 diff 0(stdout · rc · 파일 sha256, testplan 4.2). testplan 머리말의 기준(WI-0100a 머지 직후 HEAD 빌드 사본)으로 2부 뒤 다시 잰 뒤 닫음 → 2부: ac65811 사본 대 2부 수정본 20/20 같음(testplan 4.2 2부)
- [ ] 안내대로 고친 fixture 실빌드 rc 0(AC1), 해석 불가 줄 rc 1 재확인(AC5) → 2부: Q37 형태만 실빌드(rc 1 셋 · rc 0 둘). AC1 · AC5 의 F 행 실빌드는 아직 (남음: AC1 · AC5 의 F 행 실빌드)
- [x] turbo build · type-check · lint `--force`(Cached 0 확인), cli · mcp vitest (AC10) → 2부(2026-10-28): registry-core · cli · mcp type-check · lint, cli · mcp build 모두 `--force` rc 0 · Cached 0, vitest cli 1018 · mcp 217 rc 0

## 릴리스
- [x] changeset: `@axis-ds/cli` patch + `@axis-ds/mcp` patch(registry-core 변경, `pnpm check-changeset-mcp-tokens` rc 0), 이 WI 의 changeset 이 PR 에 있는지 리뷰에서 따로 확인 (AC13) → 1부: `.changeset/wi-0097-css-import-resolvability.md` 작성(B1 동작만), check rc 0(「통과(registry-core → cli · mcp)」). changeset 끝의 HTML 주석 메모는 지웠어요(changesets 가 본문을 CHANGELOG 로 옮겨서) (2026-10-28, 머지 커밋 e2701fe 에 `.changeset/wi-0097-css-import-resolvability.md` 포함 · PR #253 검증에 `pnpm check-changeset-mcp-tokens` 통과 · CI 성공, Version PR #251 이 cli · mcp CHANGELOG 로 옮김)
- [x] 2부 changeset 본문 보강: globals.css 의 tokens CSS import 해석 게이트(루트 선언 · 미설치, 미선언 · 미설치, PnP 루트 전용 WARN, 앱 선언은 종전 PASS), Q37 밖 진입 파일 WARN → PASS → WARN 경우 목록 · 종료 코드 불변 포함, `pnpm check-changeset-mcp-tokens` rc 0
- [x] release-notes.md 초안을 수정본 측정 문구로 갱신 (AC1 ~ AC6) → 2부 반영(globals 게이트 · Q37 · 한계)
- [x] PR · 머지 · 발행(Master, WI-0098 · WI-0100 과 한 발행: cli 1.7.7 · mcp 1.4.6, linked 4패키지 1.8.2 그대로) (2026-10-29, PR #253 머지 e2701fe · Version PR #251 머지 1e8da06 · publish run 40811479954 success, cli 1.7.7 · mcp 1.4.6 발행 · provenance 2/2, linked 4패키지 1.8.2 그대로)
