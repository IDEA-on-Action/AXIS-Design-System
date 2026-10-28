# WI-0100: check 의 전역 CSS 파일 선택 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #244 | 상태: 🔄 착수(2026-10-28)

## 결정
- [ ] 사용자 결정 Q24 · Q25 · Q27 · Q35 · Q36 · Q37 · Q38 반영 확인, 선례 D1 ~ D12 를 PRD 1.2 표대로 적용 (AC1 ~ AC14)
- [x] 구현 세부 확정: 표기를 세 항목 모든 심각도 + brand 에 붙임 · D10 표기 문구 「 (globalCss <값> 없음)」 · 「 (globalCss <값>: .css 파일이 아님)」, 항목 문구 맨 끝 (AC3 · AC8) (2026-10-28, 사용자 결정 Q36)
- [ ] 펼침 깊이 한도 확정(0100b 구현 뒤 Master 확인) (AC5)
- [x] T4-1 app-init 2건 기대 기준선에 globals.css 표기 한 줄 반영, plan 4절 목록 추가 (AC11) (2026-10-28, 사용자 결정 Q35, cli vitest 966/966)
- [x] 프로젝트 밖 진입 파일 패키지 import 의 파일 위치 기준 해석: **WI-0097 2부로 이관(Q37)**, 0100a 코드 불변, 넘길 측정은 plan 4-1절 (AC7)
- [x] 심볼릭 링크 앱 + 밖 상대 globalCss 의 brand · CSS 기준 차이는 잔여(Q38, prd 4절 · release-notes 한계)
- [x] 착수 측정 넘김 H3(A1 · mono/app2 의 B1 WARN 잔존 → testplan 기대 정정, A1b · mono/app2b 추가) · H4(AC6 지표를 「각 항목 줄이 가리키는 판정 파일」로 정정, N1 발행본 1 → 2) 문서 반영 (AC1 · AC6 · AC7) (2026-10-28)
- [x] WI-0097 과 `tailwind4Issues` 인자 모양(진입 문자열 · 근거 문자열) 합의 (AC10) (2026-10-28, 0097 1부 `{ entry, evidence }` 위에 0100b 가 줄별 기준 디렉터리 `cssDirOf` 를 더함)

## 착수 측정
- [ ] 바뀔 기존 테스트 목록 고정(plan 4절), A/B probe 로 전이 전수 기록 (AC11)
- [ ] 새 fixture A1 · E1~E5 · N1 · N2 의 발행본 출력 재현(음성 대조, plan 5절 1단계와 같은 집합) (AC1 · AC5 · AC8)
- [x] 0100b 착수 때 기준선 SHA(WI-0097 머지 직후 HEAD) 기록, 새 fixture mono/app2 · G1 · G2 · G3 · K1 · K2 의 그 기준선 출력 재현 (AC7 · AC10 · AC11) (2026-10-28, 기준선 2d12ae2, fixture 53개 출력 scratchpad `WI-0100b/out/head`)
- [ ] 실빌드 1회: TW4 · TW3 + Next 의 상대 `@import` 펼침, mono/app1 형태의 밖 진입 파일 패키지 import 해석 기준 (testplan 4절, AC4 · AC7). mono/app1 형태 결과(앱 아래에만 → 빌드 실패, 상위 호이스팅 → 성공)는 WI-0097 2부로 이관(Q37, plan 4-1절)

## 구현 0100a (파일 선택, 펼침 없음)
- [x] registry-core `project.ts` 선택 헬퍼(globalCss 우선 · `configuredMissing` · `configuredRejected` · 밖 경로 읽기) (AC1 · AC3 · AC7 · AC8) → `selectGlobalCss` · `globalCssSelectionNote` (2026-10-28, 새 테스트 R1 · R2 · mono · x2 · N1 · N2)
- [x] `checkGlobalsCss` · `checkTailwindSetup`(TW4) · `checkAnimationPlugin`(TW4) 가 헬퍼 사용, 표기 접미사 (AC1 · AC2 · AC3) (2026-10-28, fixture 32개 재측정에서 R2 · R3 · I1 · mono/app1 · mono/app2 · mono/app2b rc 1 → 0, R1 · R8 WARN → PASS(rc 0 그대로))
- [x] 레이아웃 폴백 위치 · FAIL 조건 유지 (AC9) (2026-10-28, x4 PASS 파일명만 `app/globals.css`, x3 FAIL · rc 1 그대로)
- [x] cli `brand-core.ts` `findGlobalCss` 래퍼(theme add 종전 규칙) · `inspectBrandImport` 헬퍼 사용, mcp 사본 `cp` (AC6 · AC8 · AC11) (2026-10-28, A/B probe 의 `findGlobalCss` 전이 0건, `cmp` 동일)
- [x] brand `configuredRejected` 표기(cli `template-check.ts` · mcp `template.ts`) (AC8 · AC12) (2026-10-28, N1 · CLI · MCP 항목 줄 32/32 같음. 표기 문구 확정 Q36)

## 구현 0100b (WI-0097 머지 뒤)
- [x] 상대 `@import` 펼침 헬퍼(프로젝트 안 · 방문 집합 · 깊이 한도, 근거 · 진입 문자열 분리) (AC4 · AC5) → `expandGlobalCss` · `CSS_IMPORT_DEPTH_LIMIT`(5, 초안) (2026-10-28, E1 ~ E7 · f1 ~ f10 fixture 기준선 대비 측정, 최대 165ms · stderr 0)
- [x] 세 항목 · brand 가 근거 문자열 사용, 결함 판정은 진입 문자열 (AC4 · AC10) (2026-10-28, R4 · R5 · R5p · T3s PASS, x5 · T3x5 PASS 그대로, T3a 는 진입 파일 Arial WARN)
- [x] 펼친 게이트 대상 줄은 WI-0097 해석 게이트 경유(진입 파일과 같은 판정, Q21 · Q22), 브랜드 import 는 게이트 비대상 (AC10) (2026-10-28, G1 · G2 · G3 · K1 · K2 · K2u 가 대조 fixture 와 접미사만 다름, BR2 PASS = BR2c)
- [x] D6 접미사 「(<하위 파일> 의 import)」 (AC4) (2026-10-28, `cssImportViaNote`, 하위 파일 없으면 빈 문자열이라 기존 테스트 코퍼스 전이 0)

## 문서
- [x] `packages/axis-cli/README.md:98` · `:109` · `:116` (AC14) (2026-10-28, 0100b 상대 `@import` 펼침 항목 추가 · :99 범위 서술도 함께)
- [ ] docstring · 주석 `tailwind-core.ts:1-33`(머리 주석 globals 서술) · `:259` · `:343` · `:853`, `project.ts:370-372`, `brand-core.ts:211-217` · `:290-292`(cli · mcp 사본), 범위 서술 전 트리 grep (AC14)

## 테스트
- [ ] cli `template-check.test.ts` 새 describe 「WI-0100 전역 CSS 선택」(testplan 1절 fixture) (AC1 ~ AC10 · AC13) (0100b 몫: describe 「WI-0100b 상대 @import 펼침」 31건, 2026-10-28)
- [ ] mcp `template.test.ts` 대표 4건(R1 · R2 · R4 · mono) (AC12) (0100b 몫: R4 · E3 · K1 · G2/BR2 4건, 2026-10-28)
- [ ] 새 테스트를 HEAD 소스에 돌려 빨강 확인, 회귀 가드는 초록 확인 (AC1 ~ AC11) (0100b 몫: 기준선 2d12ae2 사본에서 cli 22 빨강 · 9 초록(회귀 가드), mcp 4 빨강)
- [ ] 변이 M1 ~ M14 각각 빨강 (testplan 5절) (0100b 몫 12종 모두 빨강, testplan 7절)
- [ ] 발행본 · 수정본 dist 로 전 fixture 재측정, rc 는 `out=$(...); rc=$?` (AC2 · AC7 · AC13)
- [ ] CLI · MCP 줄 대조 diff 0 (AC12)
- [ ] `pnpm turbo run build type-check lint --force`, cli · mcp vitest (AC11)

## 릴리스
- [ ] changeset(0100a · 0100b 각 PR 에 하나씩, `@axis-ds/cli` patch + `@axis-ds/mcp` patch, 「check 종료 코드가 1 에서 0 으로 바뀔 수 있는 경우」 명시) (AC2 · AC7)
- [ ] release-notes.md 확정(측정값으로 갱신)
- [ ] PR · 머지 · 발행(Master, WI-0097 · 0098 과 Version PR 하나, cli 1.7.7 · mcp 1.4.6)
- [ ] 발행본 재측정 · project-todo.md · wi-mapping.json 현행화(Master)
