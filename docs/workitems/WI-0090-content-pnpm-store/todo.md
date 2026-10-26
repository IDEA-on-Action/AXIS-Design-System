# WI-0090: pnpm 기본 레이아웃 content 거짓 FAIL TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #227 | 상태: 🔄 구현 완료 · PR 대기

## 결정
- [x] D1 실경로 같은 상위 설치본만 · D2 스토어 상대 실경로 포함 · D3 이유 문구 · D4 cli · mcp patch (2026-10-26 사용자 결정)

## 구현
- [x] `tailwind-core.ts`: `packageContentTarget` alternates · others, `inspectTailwindContent` 덮음 · note, `checkTailwindContent` 목록에 note
- [x] 문서: `docs/guides/theme-customization.md` tailwind.content 행, `packages/axis-cli/README.md`, WI-0086 PRD 범위 밖 줄에 해소 표시

## 테스트
- [x] cli 단위 +4, mcp 단위 1 전이, 수정 전 3 빨강, 변이 M1 ~ M3 빨강
- [x] 실제 설치 픽스처 10행 빌드 정답 일치 7/10 → 10/10
- [x] turbo lint · type-check · test `--force`(Cached 0)

## 릴리스
- [x] changeset `.changeset/wi-0090-content-pnpm-store.md`(@axis-ds/cli patch · @axis-ds/mcp patch)
- [ ] PR · 머지, Release PR 머지, 발행본으로 testplan 2절 재측정
