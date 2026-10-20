# WI-0042: `axis check` Tailwind 4 오탐 · 종료 코드 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | 상태: 🔄 진행 (2026-10-20 구현 · 검증 완료, PR 대기)

- [x] Tailwind 판정을 공유 코어 `tailwind-core.ts` 로 옮기고 `init.ts` 에서 다시 내보내기 (FR-1)
- [x] Tailwind 4 이상 CSS 진입점 검사 (FR-2, AC1)
- [x] Tailwind 3 `.mjs` · `.cjs` 인정, 종전 문구 유지 (FR-3, AC3)
- [x] `runCheck` 개수 반환, `axis check` fail 시 종료 코드 1 (FR-4, AC2)
- [x] MCP `axis.check_project` 에 같은 코어 적용, 사본 동일성 테스트 (D3, AC4)
- [x] README 갱신 (FR-5)
- [x] 테스트 · 변이 대조 · 품질 게이트 · 실경로 (AC1 ~ AC5)
- [x] changeset: cli minor · mcp patch
- [ ] PR 머지 → Version PR → 배포본으로 재확인
