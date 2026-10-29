# WI-0101: Tailwind 3 preset 의 tokens 해석 게이트 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #248 | 상태: 🔄 착수 측정 완료(2026-10-29) · 사용자 결정 Q61 ~ Q69 대기

## 결정
- [x] 착수 측정: 발행본 cli 1.7.7 · mcp 1.4.6 으로 형태 7 × tokens 상태 9 = 63칸, CLI · MCP · Tailwind 3.4.19 실빌드 (AC1 ~ AC5 · AC7) → testplan 2절. 2회 재현 같음, CLI = MCP 63/63
- [x] 양성 대조: CJS bare 가 지금 게이트에 걸리는지 먼저 확인 (AC5) → A-inst162 · R-inst162 · U-inst162 · U-none 의 CJS bare 2형태 모두 WARN(testplan 2.1)
- [x] 원인 위치 확인 (plan 1절) → `tailwind-core.ts:1453` 의 게이트 조건, `:1194-1220` 선언 하한 `ok`
- [ ] 사용자 결정 Q61 ~ Q69 를 prd 1.2 표에 기록하고 상태를 Approved 로 (전부)
- [ ] 결정이 권장안과 다르면 prd 1.4 · 2절, plan 2 · 4절을 다시 씀

## 구현
- [ ] 착수 게이트(Q69): PnP 루트 전용 ESM `.mjs` · `.ts` 실빌드 1회씩, rc · 오류 문구를 testplan 3.3 에 기록. rc 0 이면 중단 · 보고 (AC6)
- [ ] HEAD 기준선(빌드 사본 sha · 파일별 통과 수) 고정 (AC5 · AC8)
- [ ] 새 테스트 먼저: cli describe 「WI-0101」 · mcp 대응 행, 기준선에서 빨강 확인 (AC1 ~ AC4 · AC6)
- [ ] `tailwind-core.ts` Tailwind 3 루프에 `tokensCssResolution` 게이트(prd 1.4 표 1 ~ 3번) (AC1 · AC2 · AC6)
- [ ] U-none CJS bare 의 버전 문구를 해석 불가 문구로(Q65) (AC3)
- [ ] 앱 선언 · 설치본 있음은 종전 흐름 그대로 (AC4 · AC5)
- [ ] 새 문구 확정(구현 그대로 확정할지 사용자 확인, WI-0097 Q43 · Q48 선례) (AC1 ~ AC3 · AC6)
- [ ] 기존 테스트 처리: plan 4절 후보를 실행으로 확정하고 「stub 보강」 · 「기대 변경」 · 「불변」으로 분류 (AC8)
- [ ] 주석 `tailwind-core.ts:34-35` · `:1168-1170` · `:1381-1385`, README `:110-111` 갱신, 범위 서술 grep 대조 (AC10)
- [ ] changeset: `@axis-ds/cli` patch · `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` 통과

## 테스트
- [ ] fixture A/B 63칸 + 새 칸(PnP · P2 · 템플릿 5개): 바뀐 칸이 R-none · U-none 14칸뿐이고 실빌드 rc 1 과 1:1 (AC1 ~ AC5)
- [ ] CLI = MCP 전 칸 (AC7)
- [ ] 변이 M1 ~ M4 빨강 (AC9)
- [ ] 종료 코드 전 칸 불변 (prd 3절)
- [ ] `pnpm type-check` · `pnpm lint` · `pnpm build` · cli · mcp 테스트

## 릴리스
- [ ] release-notes.md 작성(구현 뒤)
- [ ] PR 본문에 측정 표 · 변이 결과 · 바뀐 기존 테스트 목록
