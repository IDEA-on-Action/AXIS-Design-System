# TODO — WI-0009 MCP 템플릿 Tools 구현

> PRD: [prd.md](./prd.md) | GitHub: #53

---

## 체크리스트

### AC1: 5개 MCP tool 모두 등록 및 동작

- [x] `axis.list_templates` — 템플릿 목록 조회 도구
- [x] `axis.get_template` — 템플릿 상세 정보 도구
- [x] `axis.apply_template` — 템플릿 적용 도구
- [x] `axis.diff_template` — 로컬 vs 템플릿 비교 도구
- [x] `axis.check_project` — 프로젝트 상태 검증 도구
- [x] `tools/template.ts` 모듈 생성
- [x] `tools/index.ts`에 export 등록
- [x] `index.ts`에 tool 등록 (server.tool + Zod 스키마)

### AC2: Claude Code에서 tool 호출 가능

- [x] 타입 체크 통과 (`pnpm type-check`)
- [x] 린트 통과 (`pnpm lint`)
- [x] 빌드 통과 (`pnpm build`)

### AC3: 워크플로우 문서 작성 완료

- [x] release-notes.md 작성
