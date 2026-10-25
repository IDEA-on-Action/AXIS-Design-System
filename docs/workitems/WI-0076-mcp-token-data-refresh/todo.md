# WI-0076: MCP 토큰 데이터 생성 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #202 | 상태: 구현 · 로컬 검증 완료(2026-10-25), PR 대기

## 결정
- [x] 원천 tokens dist · 기존 경로 유지 + tokens 이름 경로 · 원천 없는 5개 제거 · 생성본 dist 전용 · 다크 필드 · isError · 브랜드는 get_brand (PRD D1~D7, 배치 6 결정)

## 구현
- [x] `src/registry/token-gen.mjs`(생성 · 원천 대조 · throw) + `token-gen.d.mts`
- [x] build 에 `gen-tokens` 단계, `src/registry/data/tokens.json` 삭제
- [x] `@axis-ds/tokens` devDependency(workspace) · `turbo.json` test `dependsOn: ["^build"]` · lockfile
- [x] loader 캐시 분리 · 별칭 · CSS 변수 조회, types `TOKEN_CATEGORIES` · `dark` · `aliases`
- [x] list · get 출력(다크 · CSS 열, 출처 줄, `hsl(var(--x))`), index enum · 미발견 isError
- [x] `scripts/mcp-smoke.mjs` 값 기대(tokens dist 에서 읽음) · 밀도 · isError
- [x] `docs/guides/claude-workflow.md` 3.2
- [x] mcp README 「토큰 도구」 절 신설(종전에는 절이 없었음), changeset 에 radius.md cssVariable · 표 열 변경 추가(반박 검토 minor)

## 테스트
- [x] `src/registry/tokens-sync.test.ts` 20건 + 변이 M0~M6 빨개짐 확인
- [x] turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계 10종
- [x] AC6 turbo dry-run 의존 · 해시 무효화, AC7 격리 HOME stdio 309행 대조, mcp-smoke 1.3.5 음성 대조

## 릴리스
- [x] changeset `.changeset/wi-0076-mcp-token-data.md`(@axis-ds/mcp minor)
- [ ] PR · 머지(배치 6 순서 WI-0078 → 0076), Release PR 에서 mcp 1.4.0 대조
- [ ] 발행본 1.4.0 으로 testplan 3 다시 재기(격리 HOME, 같은 버전 tokens 발행본과 불일치 0)
