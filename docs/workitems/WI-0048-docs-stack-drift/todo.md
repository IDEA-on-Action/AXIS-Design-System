# WI-0048: 문서 기술 스택 표기 드리프트 · 문서 라우트 점검 TODO

> PRD: [prd.md](./prd.md) | Testplan: [testplan.md](./testplan.md) | GitHub: #139 | 상태: ✅ 완료 (2026-10-24, 배포 없음)

## 실측
- [x] Tailwind 표기 전수 grep(루트 README · `docs/guides` · `.claude/prompts`): 저장소 스택 표기 3곳(README:74 · monorepo-setup:29 · prompts/README:50), 나머지는 소비자 설정 안내 (2026-10-24)
- [x] 실제 버전: `apps/web/package.json` tailwindcss `^3.4.17`, 소비자 Tailwind 4 연동 1.4.0 부터(quick-start:9)
- [x] 문서 라우트: `apps/web/src/app` page 59개. `/docs/components` 없음(사이트 404), `/components/` 200

## 수정
- [x] `README.md` 기술 스택 표 (FR-1)
- [x] `docs/guides/monorepo-setup.md` 기술 스택 (FR-1)
- [x] `.claude/prompts/README.md` 프로젝트 컨텍스트 예시 (FR-1)
- [x] `docs/guides/quick-start.md` 208행 링크 → `https://axis-design-system.pages.dev/components/` (FR-2)

## 검증
- [x] 링크 전수 점검 깨진 0건 · 원격 200 (FR-3) → testplan T2
- [x] guidance 테스트(`.claude/prompts` · `docs/guides` · README 스캔) 통과 → testplan T3
- [x] 릴리스 노트 작성
