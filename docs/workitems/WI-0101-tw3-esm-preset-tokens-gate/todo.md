# WI-0101: Tailwind 3 preset 의 tokens 해석 게이트 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #248 | 상태: 🔄 구현 · 검증 완료(2026-10-29) · 추가 결정 Q61a · Q61b · Q65a 확인 대기 · PR 리뷰 대기

## 결정
- [x] 착수 측정: 발행본 cli 1.7.7 · mcp 1.4.6 으로 형태 7 × tokens 상태 9 = 63칸, CLI · MCP · Tailwind 3.4.19 실빌드 (AC1 ~ AC5 · AC7) → testplan 2절. 2회 재현 같음, CLI = MCP 63/63
- [x] 양성 대조: CJS bare 가 지금 게이트에 걸리는지 먼저 확인 (AC5) → A-inst162 · R-inst162 · U-inst162 · U-none 의 CJS bare 2형태 모두 WARN(testplan 2.1)
- [x] 원인 위치 확인 (plan 1절) → `tailwind-core.ts:1453` 의 게이트 조건, `:1194-1220` 선언 하한 `ok`
- [x] 사용자 결정 Q61 ~ Q69 를 prd 1.2 표에 기록하고 상태를 Approved 로 (전부) → 2026-10-29 모두 권장안, prd 머리 · 1.2 표 · 6절 머리
- [x] 결정이 권장안과 다르면 prd 1.4 · 2절, plan 2 · 4절을 다시 씀 → 모두 권장안이라 해당 없음. 조건부 서술(AC4 · AC6 · 1.4 표 1번)만 결정 · 측정 값으로 고침
- [ ] 추가 결정 Q61a(설치 안내 범위 `^1.7.0`) · Q61b(새 문구 2종 확정) · Q65a(루트 1.7.0 미만 · bare 의 안내에 1.7.0 덧붙임 여부)를 사용자에게 확인 (prd 1.2 「추가 결정」, 구현은 권장안으로 진행함)

## 구현
- [x] 착수 게이트(Q69): PnP 루트 전용 ESM `.mjs` · `.ts` 실빌드 1회씩, rc · 오류 문구를 testplan 3.3 에 기록. rc 0 이면 중단 · 보고 (AC6) → 루트 전용 rc 1 ×2(2회 재현), 앱 선언 rc 0. 게이트 통과
- [x] HEAD 기준선(빌드 사본 sha · 파일별 통과 수) 고정 (AC5 · AC8) → headbuild cli df33d876… · mcp 87f1bd34…(발행본과 같은 바이트), cli 1096 · mcp 231
- [x] 새 테스트 먼저: cli describe 「WI-0101」 · mcp 대응 행, 기준선에서 빨강 확인 (AC1 ~ AC4 · AC6) → cli 4 · mcp 3 빨강, 회귀 가드 3 초록(testplan 3.1)
- [x] `tailwind-core.ts` Tailwind 3 루프에 `tokensCssResolution` 게이트(prd 1.4 표 1 ~ 3번) (AC1 · AC2 · AC6) → `presetTokensUnresolvedMessage`, 변이 M1 · M2 · M6 빨강
- [x] U-none CJS bare 의 버전 문구를 해석 불가 문구로(Q65) (AC3) → AC3 테스트 · 변이 M4 빨강
- [x] 앱 선언 · 설치본 있음은 종전 흐름 그대로 (AC4 · AC5) → 91칸 A/B 에서 해당 칸 diff 0, 변이 M3 · M5 빨강
- [ ] 새 문구 확정(구현 그대로 확정할지 사용자 확인, WI-0097 Q43 · Q48 선례) (AC1 ~ AC3 · AC6) → 추가 결정 Q61b 대기. 문구는 testplan 3.4
- [x] 기존 테스트 처리: plan 4절 후보를 실행으로 확정하고 「stub 보강」 · 「기대 변경」 · 「불변」으로 분류 (AC8) → cli 5 · mcp 1(보강 5 · 기대 변경 1), 보강분은 HEAD 판정 소스에서도 초록
- [x] 주석 `tailwind-core.ts:34-35` · `:1168-1170` · `:1381-1385`, README `:110-111` 갱신, 범위 서술 grep 대조 (AC10) → 머리 주석 35행 · WI-0101 단락 · `checkTailwindSetup` docstring · 새 함수 docstring, README 110 · 111 · 새 단락, 반박 검증이 찾은 `docs/guides/theme-customization.md:355` 도 고침(`isCommonJsConfig` 주석은 여전히 맞아 그대로)
- [x] changeset: `@axis-ds/cli` patch · `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` 통과 → rc 0, mcp 줄을 지운 음성 대조 rc 1

## 테스트
- [x] fixture A/B 63칸 + 새 칸(PnP · P2 · 템플릿 5개): 바뀐 칸이 R-none · U-none 14칸뿐이고 실빌드 rc 1 과 1:1 (AC1 ~ AC5) → 63칸 안에서는 14칸만 바뀜. 91칸 전체로는 26칸(모두 tailwind.config 줄만), 실빌드를 잰 바뀐 칸은 모두 rc 1(미측정 4칸은 testplan 3.2)
- [x] CLI = MCP 전 칸 (AC7) → 91/91
- [x] 변이 M1 ~ M4 빨강 (AC9) → M1 ~ M6 모두 지목한 테스트 빨강, sha256 원복 6/6(testplan 4절)
- [x] 종료 코드 전 칸 불변 (prd 3절) → 91칸 전이 0
- [x] `pnpm type-check` · `pnpm lint` · `pnpm build` · cli · mcp 테스트 → `turbo run build type-check lint test --force` 를 registry-core · cli · mcp 범위로 Tasks 11/11 · Cached 0 · rc 0(저장소 전체 범위는 돌리지 않음)

## 릴리스
- [x] release-notes.md 작성(구현 뒤)
- [ ] PR 본문에 측정 표 · 변이 결과 · 바뀐 기존 테스트 목록
