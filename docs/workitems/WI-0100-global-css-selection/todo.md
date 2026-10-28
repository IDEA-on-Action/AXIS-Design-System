# WI-0100: check 의 전역 CSS 파일 선택 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #244 | 상태: 🔄 착수(2026-10-28)

## 결정
- [ ] 사용자 결정 Q24 · Q25 · Q27 반영 확인, 선례 D1 ~ D12 를 PRD 1.2 표대로 적용 (AC1 ~ AC14)
- [ ] 구현 세부 확정: 표기를 세 항목 모든 심각도에 붙임 · D10 표기 문구 · 펼침 깊이 한도(구현 뒤 Master 확인) (AC3 · AC5 · AC8)
- [ ] WI-0097 과 `tailwind4Issues` 인자 모양(진입 문자열 · 근거 문자열) 합의 (AC10)

## 착수 측정
- [ ] 바뀔 기존 테스트 목록 고정(plan 4절), A/B probe 로 전이 전수 기록 (AC11)
- [ ] 새 fixture A1 · E1~E5 · N1 · N2 의 발행본 출력 재현(음성 대조, plan 5절 1단계와 같은 집합) (AC1 · AC5 · AC8)
- [ ] 0100b 착수 때 기준선 SHA(WI-0097 머지 직후 HEAD) 기록, 새 fixture mono/app2 · G1 · G2 · G3 · K1 · K2 의 그 기준선 출력 재현 (AC7 · AC10 · AC11)
- [ ] 실빌드 1회: TW4 · TW3 + Next 의 상대 `@import` 펼침, mono/app1 형태의 밖 진입 파일 패키지 import 해석 기준 (testplan 4절, AC4 · AC7)

## 구현 0100a (파일 선택, 펼침 없음)
- [ ] registry-core `project.ts` 선택 헬퍼(globalCss 우선 · `configuredMissing` · `configuredRejected` · 밖 경로 읽기) (AC1 · AC3 · AC7 · AC8)
- [ ] `checkGlobalsCss` · `checkTailwindSetup`(TW4) · `checkAnimationPlugin`(TW4) 가 헬퍼 사용, 표기 접미사 (AC1 · AC2 · AC3)
- [ ] 레이아웃 폴백 위치 · FAIL 조건 유지 (AC9)
- [ ] cli `brand-core.ts` `findGlobalCss` 래퍼(theme add 종전 규칙) · `inspectBrandImport` 헬퍼 사용, mcp 사본 `cp` (AC6 · AC8 · AC11)
- [ ] brand `configuredRejected` 표기(cli `template-check.ts` · mcp `template.ts`) (AC8 · AC12)

## 구현 0100b (WI-0097 머지 뒤)
- [ ] 상대 `@import` 펼침 헬퍼(프로젝트 안 · 방문 집합 · 깊이 한도, 근거 · 진입 문자열 분리) (AC4 · AC5)
- [ ] 세 항목 · brand 가 근거 문자열 사용, 결함 판정은 진입 문자열 (AC4 · AC10)
- [ ] 펼친 게이트 대상 줄은 WI-0097 해석 게이트 경유(진입 파일과 같은 판정, Q21 · Q22), 브랜드 import 는 게이트 비대상 (AC10)
- [ ] D6 접미사 「(<하위 파일> 의 import)」 (AC4)

## 문서
- [ ] `packages/axis-cli/README.md:98` · `:109` · `:116` (AC14)
- [ ] docstring · 주석 `tailwind-core.ts:1-33`(머리 주석 globals 서술) · `:259` · `:343` · `:853`, `project.ts:370-372`, `brand-core.ts:211-217` · `:290-292`(cli · mcp 사본), 범위 서술 전 트리 grep (AC14)

## 테스트
- [ ] cli `template-check.test.ts` 새 describe 「WI-0100 전역 CSS 선택」(testplan 1절 fixture) (AC1 ~ AC10 · AC13)
- [ ] mcp `template.test.ts` 대표 4건(R1 · R2 · R4 · mono) (AC12)
- [ ] 새 테스트를 HEAD 소스에 돌려 빨강 확인, 회귀 가드는 초록 확인 (AC1 ~ AC11)
- [ ] 변이 M1 ~ M14 각각 빨강 (testplan 5절)
- [ ] 발행본 · 수정본 dist 로 전 fixture 재측정, rc 는 `out=$(...); rc=$?` (AC2 · AC7 · AC13)
- [ ] CLI · MCP 줄 대조 diff 0 (AC12)
- [ ] `pnpm turbo run build type-check lint --force`, cli · mcp vitest (AC11)

## 릴리스
- [ ] changeset(0100a · 0100b 각 PR 에 하나씩, `@axis-ds/cli` patch + `@axis-ds/mcp` patch, 「check 종료 코드가 1 에서 0 으로 바뀔 수 있는 경우」 명시) (AC2 · AC7)
- [ ] release-notes.md 확정(측정값으로 갱신)
- [ ] PR · 머지 · 발행(Master, WI-0097 · 0098 과 Version PR 하나, cli 1.7.7 · mcp 1.4.6)
- [ ] 발행본 재측정 · project-todo.md · wi-mapping.json 현행화(Master)
