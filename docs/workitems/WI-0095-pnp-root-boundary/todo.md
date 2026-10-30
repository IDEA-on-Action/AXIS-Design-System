# WI-0095: Plug'n'Play 루트 선언 경계를 init · add 로 넓힘 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #239 | 상태: 🔄 구현 · 검증 완료, 사용자 확인(Q150 ~ Q157) · PR 리뷰 · 발행 대기

## 착수
- [x] Issue #239 본문, WI-0091(Q1 · Q2 · Q5 · Q6) · WI-0099(Q144 · `pnp-root-Ltwa-Itwa`) · WI-0087(P1) · WI-0086 문서와 지금 코드의 호출지 확인 (2026-10-31, Issue 의 줄 번호는 낡아서 다시 찾음)
- [x] Yarn 4.5.3 실설치 fixture 9개 × init · theme add · add · template apply + check · 해석 · 빌드 측정 (AC1) (testplan 2절: 결함 init 2 · add 1, 어긋남 init 2, theme add · template apply 결함 없음)

## 결정
- [x] Q150 ~ Q157 을 권장안으로 진행, prd 1.2 · 7절에 선택지 · 근거 기록 (사용자 확인 대기)

## 구현
- [x] registry-core `add/add.ts` `missingDependencies`: `appOnlyInPnp` (AC6)
- [x] cli `init/init.ts`: `planUtilsDependencies` · `reportDependencies`(AC2), `tailwind4GuideLines`(AC3), `animationGuideLine`(AC4), `pnpRootOnlyTailwindLine` · `runInit`(AC5)
- [x] registry-core `project.ts` 주석, cli · mcp README

## 테스트
- [x] 새 `src/wi-0095-pnp-root-boundary.test.ts` 20건, mcp `registry-tools.test.ts` +2건 (AC2 ~ AC7)
- [x] 바뀐 기존 테스트 1건(WI-0099 PnP 루트 전용 칸) (AC4)
- [x] 음성 대조: 수정 전 소스로 cli 8 빨강 · 40 초록, mcp 1 빨강 · 23 초록, 변이 5건 모두 빨강, sha256 원복 (AC10)
- [x] 수정본 재측정: 차이는 PnP 루트 전용 4 fixture 뿐, 36칸 rc 같음, 쓴 파일 차이 3칸(init package.json) (AC7 · AC9)
- [x] 스모크: 수정 init 안내대로 → check FAIL 0 · 빌드 rc 0, 종전 안내대로 → FAIL 1 · 빌드 rc 1 (AC8)
- [x] registry-core · cli · mcp type-check · lint rc 0, cli test 1286 · mcp test 253 통과 (AC11)

## 릴리스
- [x] changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch(머리에 바뀔 수 있는 것 + 해결법), `pnpm check-changeset-mcp-tokens` rc 0 (AC11)
- [x] release-notes.md
- [ ] 사용자 확인 Q150 ~ Q157(Master)
- [ ] PR 리뷰 · 머지 · 발행(Master)
