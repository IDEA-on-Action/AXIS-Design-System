# WI-0088: template apply 의 package.json 합치기 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #223 | 상태: 🔄 구현 · 검증 완료, 결정 확인 · PR 리뷰 · 발행 대기

## 착수
- [x] 이슈 #223 · WI-0085 D6 · WI-0027 AC9 의 범위 확인 (2026-10-30)
- [x] e32275e 빌드로 70칸 측정(7모양 × 5템플릿 × CLI · MCP), 사라지는 필드 · 다음 명령 안내 · axis.config.json 기록 (AC1 ~ AC6 · AC10) (testplan 2절: rich 12개 사라짐 · pm-* 의 check 안내 pnpm, CLI = MCP 35/35)
- [x] 계측 확인: check 설치 명령 정규식의 부분 문자열 오탐을 원문으로 잡아 고침 (testplan 1절)
- [x] 템플릿 postInstall 유무 확인 (0/5)

## 결정
- [x] Q100 ~ Q106 을 권장안으로 진행하고 prd 1.2 · 7절에 기록 (사용자 확인 대기)

## 구현
- [x] registry-core `src/template/apply-files.ts` 새 파일 · `exports` `./apply-files` (plan 1 · 2절) (AC1 ~ AC7 · AC9)
- [x] CLI `applyTemplate` · `initTemplate` 이 코어 사용, 「합치기」 표시, 실패 시 rc 1 · init 중단 (AC8 · AC9)
- [x] MCP `handleApplyTemplate` · `formatApplyTemplateResult` 이 코어 사용, `merged` · `note` (AC8 · AC10)
- [x] cli · mcp README 한 줄씩

## 테스트
- [x] 새 테스트 cli 18 · mcp 2 (testplan 4절)
- [x] 호출지 HEAD 되돌림 음성 대조 cli 6 · mcp 2 빨강, sha256 원복 (AC11)
- [x] 코어 변이 V1 ~ V11 빨강 11/11, sha256 원복 (AC11)
- [x] 수정본 70칸 재측정 (testplan 3절: 사라짐 0, pm-* check 안내 yarn · npm, CLI = MCP 35/35)
- [x] `pnpm turbo run build type-check lint test --force`(registry-core · cli · mcp, Cached 0) (AC11) (rc 0, cli 1184 · mcp 242)

## 릴리스
- [x] changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0 (AC12)
- [x] release-notes.md
- [ ] 결정 Q100 ~ Q106 사용자 확인(Master)
- [ ] PR 리뷰 · 머지 · 발행(Master)
