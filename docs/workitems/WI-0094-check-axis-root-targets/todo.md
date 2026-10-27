# WI-0094: dependencies 의 @axis-ds/* 루트 대상 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #237 | 상태: 🔄 구현 · 검증 완료, PR · 릴리스 대기

## 결정
- [x] Q11 · Q19 (2026-10-27 사용자 결정), PnP 행은 WI-0091 Q1
- [x] 추가 결정 A3: PnP 루트 전용 `@axis-ds/*` 전용 문구 WARN(대상 수에는 넣지 않음)

## 구현
- [x] `checkDependencies` 루트 `@axis-ds/*` 대상 · 루트 출처 미설치 문구 · 출처 표시 (AC1 ~ AC4)
- [x] 문서: `docs/guides/theme-customization.md` dependencies 행, `packages/axis-cli/README.md` dependencies 절

## 테스트
- [x] 기존 fixture 전이 표(A/B probe, 기존 기대 변경 0건)
- [x] 새 describe 「WI-0094」 5건 · MCP 1건
- [x] HEAD 소스에서 새 테스트 4 빨강(음성 대조 N1 · N2 는 설계상 초록)
- [x] 변이 M3 · M4 · M9 각각 빨강
- [x] 실제 설치 fixture 17개 재측정 · CLI · MCP 대조

## 릴리스
- [x] changeset(WI-0091 과 같은 파일)
- [x] PR · 머지 · 발행(Master)

> 완료 기록(2026-10-28, Master): #245 머지 → cli 1.7.6 · mcp 1.4.5 (#247, run 40578802526, provenance 2/2), 발행본 재측정 2026-10-28. 발행본 실측 통과(PR-A 7/7 · PR-B 18/18, CLI · MCP 출력 일치).
