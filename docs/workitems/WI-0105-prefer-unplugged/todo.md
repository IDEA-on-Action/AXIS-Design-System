# WI-0105: preferUnplugged 선언 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #265 | 상태: 🔄 구현 · 검증 완료, PR 리뷰 대기

## 결정
- [x] D1 발행 범위 · D2 게이트 · D3 안내 문구 (2026-11-01 사용자 확정)

## 구현
- [x] `packages/axis-ui-react/package.json` · `packages/axis-agentic-ui/package.json` 에 `"preferUnplugged": true` (AC1)
- [x] `scripts/pack-smoke.mjs` 5-1: 배포 CSS 의 `@source` 관측 시 `preferUnplugged === true` 필수, 머리 주석 (AC5)
- [x] `docs/guides/troubleshooting.md` PnP 절 한 문단 (D3)
- [x] `.changeset/wi-0105-prefer-unplugged.md` (ui-react · agentic-ui patch) (AC6)

## 테스트
- [x] 이 브랜치 pack tarball 로 Yarn 4.5.3 PnP · node-modules 실설치(V1 ~ V5) (AC2 · AC3 · AC4)
- [x] npm · pnpm 산출물 불변 (AC4)
- [x] check 판정 대조(V1 · V2 · V5)
- [x] pack-smoke 변이 P1 · P2 rc 1, 원복 rc 0, 구판 rc 0 (AC5)
- [x] `pnpm check-changeset-mcp-tokens` rc 0, `pnpm changeset status --verbose` (AC6)
- [x] turbo build · type-check · lint `--force`(Cached 0) (AC7)

## 릴리스
- [x] release-notes.md
- [ ] PR 리뷰 · 머지 · 발행(Master)
- [ ] 발행 뒤 npm 발행본 1.8.3 으로 PnP 실설치 재측정, Issue #265 닫기 · 현행화(Master)
