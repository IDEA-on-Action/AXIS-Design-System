# WI-0091: check 의 Plug'n'Play 루트 선언 판정 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #234 | 상태: 🔄 구현 · 검증 완료, PR · 릴리스 대기

## 결정
- [x] Q1 · Q2 · Q3 · Q5 · Q6 · Q7 · Q8 (2026-10-27 사용자 결정)
- [x] 구현 후 추가 결정 A1(TW3 PnP animation 문구 틀) · A3(PnP 루트 전용 `@axis-ds/*` WARN) 반영, 테스트 cli +2 · mcp +1, 변이 MA1 · MA3 빨강 (testplan 6절)

## 구현
- [x] `isPnpProject` `.git` 경계 (AC5)
- [x] `declaredDependency` `appOnlyInPnp` · `pnpRootOnlyDependency` · `PNP_ROOT_ONLY_NOTE` (AC1)
- [x] dependencies 필수 FAIL · 권장 WARN 전용 문구 (AC1)
- [x] `packageVersionGate` `unresolved` · tokens CJS 게이트 · brand.activation(cli · mcp) (AC2)
- [x] animation 플러그인 선언 PnP 판정 (AC3)
- [x] 문서: `docs/guides/theme-customization.md` check 표, `packages/axis-cli/README.md` check 절

## 테스트
- [x] 기존 기대 변경 1건(template-check 「Plug'n'Play 워크스페이스」 PASS → FAIL)
- [x] 새 describe 「WI-0091」 6건(실제 PnP 레이아웃 fixture, Q8) · MCP 1건
- [x] HEAD 소스에서 새 테스트 빨강(음성 대조 1건은 설계상 초록)
- [x] 변이 M1 · M2 · M7 · M8 · M9 각각 빨강
- [x] 실제 설치 fixture 8종 재측정 · CLI · MCP 대조
- [x] turbo build · type-check · lint `--force`, cli · mcp vitest

## 릴리스
- [x] changeset `.changeset/wi-0091-0094-0092-check-root-pnp-animation.md`(@axis-ds/cli patch + @axis-ds/mcp patch)
- [ ] PR · 머지 · 발행(Master)
