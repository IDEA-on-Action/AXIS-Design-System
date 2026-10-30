# WI-0104: Tailwind 3 preset · tokens 줄의 exports 해석 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #260 | 상태: 🔄 구현 · 검증 완료, 사용자 확인(Q130 ~ Q137) · PR 리뷰 · 발행 대기

## 착수
- [x] Issue #260 본문, WI-0101 · WI-0103 prd · plan · testplan 의 판정 축(Q61a · Q65 · Q68 · Q70c · Q72 · Q79) 확인 (2026-10-30)
- [x] 발행본 cli 1.7.8 · mcp 1.4.7 로 preset 189칸(모양 7 × 변형 13 × 단일 앱 · 중첩 설치본 + 중첩 없음) CLI · MCP · Tailwind 3.4.19 실빌드 대조 (AC1 ~ AC4) (testplan 2.2: 거짓 PASS 78 · 거짓 WARN 0, CLI = MCP 189/189, 2회 재현 같음)
- [x] Issue 의 「미검증」 Tailwind 3 CSS 쪽 중첩 그림자를 Next 14 + Tailwind 3 실빌드로 측정 (AC6) (testplan 2.4: 거짓 PASS 4, 대상 파일 없음은 rc 0)
- [x] 발행된 tokens 버전별 `./tailwind` exports 확인 (testplan 2.5: 17개 모두 내보냄)

## 결정
- [x] Q130 ~ Q137 을 권장안으로 진행, prd 1.2 · 6절에 선택지 · 근거 기록 (사용자 확인 대기)

## 구현
- [x] registry-core `project.ts`: 해석기 본체를 `resolvePackageSubpath` 로 나눔(CSS 동작 불변), `tailwindConfigImportResolution` 추가 (AC1 ~ AC4)
- [x] `presetTokensUnresolvedMessage` 에 미노출 WARN (AC1 · AC5)
- [x] `packageLineShadowIssue` 의 `tailwind3` 옵션, `judgeGlobalsCss` Tailwind 3 갈래 연결 (AC6)
- [x] 머리 주석 · `checkTailwindSetup` docstring · `outsideCssPackageResolution` 주석 · `packages/axis-cli/README.md` 범위 서술 갱신 (AC9)

## 테스트
- [x] 새 describe 「WI-0104」(cli 12 · mcp 2), 교차 레이아웃(Tailwind 3 + 중첩 설치본, Tailwind 4 + preset 설정 파일) 고정 (AC1 ~ AC7)
- [x] 바뀐 기존 테스트 1건(WI-0103 회귀 가드의 Tailwind 3 하위 파일 그림자) (AC6)
- [x] 음성 대조: HEAD 소스에서 새 테스트 9 빨강(회귀 가드 3 초록), mcp 2 빨강 (AC8)
- [x] 변이 m1 ~ m6 빨강, sha256 대조 원복 (AC8)
- [x] 수정본 189칸 · Next 10칸 · 종료 코드 기준선 6칸 재측정 (AC1 ~ AC7) (거짓 PASS preset 78 → 28 · CSS 4 → 0, 남은 28칸은 Q132 · Q133, 거짓 WARN 0, rc 모두 같음)
- [x] `pnpm turbo run type-check lint test --force`(registry-core · cli · mcp) rc 0, cli 1178 · mcp 242

## 릴리스
- [x] changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0 (AC9)
- [x] release-notes.md
- [x] 사용자 확인 Q130 ~ Q137(Master) (2026-10-30 전부 권장안으로 확정)
- [x] PR 리뷰 · 머지 · 발행(Master) (#264 머지 d592aef, Version PR #266 으로 cli 1.7.9 · mcp 1.4.8 발행, 2026-10-31)
