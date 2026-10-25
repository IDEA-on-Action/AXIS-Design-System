# WI-0080: Tailwind 3 content 판정의 설치본 위치 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #209 | 상태: 🔄 진행 중(2026-10-26, 구현 · 게이트 완료, PR · 발행 전)

## 결정
- [x] D1 설치본 기준 상대 표본 · 제안 · D2 `../` 개수 비교 · D3 절대경로 인정 · D4 cwd 안내 한 줄 · D5 세 호출지 같은 문구 · D6 registry-core changeset 동반 CI 검사 (배치 6b 결정)

## 구현
- [x] `tailwind-core.ts`: `packageContentTarget`(findInstalledPackage · isPnpProject 가드 · posix 상대 경로), `contentGlobCovers`, `CONTENT_PARENT_PATH_NOTE`, check 문구에 상위 경로 안내, 헤더 · 함수 주석
- [x] `axis-cli/src/theme/index.ts`: theme add 안내에 같은 cwd 안내 1줄
- [x] `scripts/check-changeset-mcp-tokens.mjs`: registry-core → cli · mcp 규칙, 비교 기준(PR merge-base · push HEAD^ · 로컬 merge-base), 기준 없음 exit 2, `--repo`
- [x] `frontend.yml` ci job checkout `fetch-depth: 0` · 단계 주석, CLAUDE.md 규칙 줄
- [x] 문서: `docs/guides/theme-customization.md` tailwind.content 행, `packages/axis-cli/README.md` tailwind.content 설명

## 테스트
- [x] CLI template-check: WI-0074 monorepo 블록에 f-tw3content + 레이아웃별 기대값, 「WI-0080」 8건
- [x] CLI theme-add 1건, MCP template 2건
- [x] 수정 전 소스에서 CLI 8 · MCP 1 · theme add 1 빨강, 변이 M1~M7 빨강 · 원복
- [x] changeset 검사 테스트 17건(기존 8건을 임시 git 저장소로), 변이 V1~V7 빨강 · 원복, 이 브랜치 양성 대조
- [x] 실제 설치 매트릭스 24행: 수정 전 12/24 → 수정 후 24/24, 교집합 수 matrix2.json, 음성 대조 10/10
- [x] turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계 11종

## 릴리스
- [x] changeset `.changeset/wi-0080-check-content-hoisted.md`(@axis-ds/cli patch · @axis-ds/mcp patch)
- [ ] PR · 머지(배치 6b 순서 WI-0080 → WI-0081 → Release)
- [ ] 발행본으로 testplan 6절 다시 재기
