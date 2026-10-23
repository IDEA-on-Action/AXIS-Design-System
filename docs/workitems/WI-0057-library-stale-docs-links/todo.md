# WI-0057: library 낡은 항목 · 문서 링크 404 정리 TODO

> PRD: [prd.md](./prd.md) | GitHub: #155

## 1단계 실측 · PRD
- [x] 생성 경로(collect → `.claude/data/library` → publish → `apps/web/public/library`) · 소비처 · 커밋 이력 실측
- [x] 링크 전수 GET 103개(200 96 · 404 7), 대조군 3개
- [x] 소스 ↔ `(docs)` 라우트 이름 대응 전수(불일치 approval-card ↔ approval-dialog 1쌍)
- [x] 수집기 오프라인 시험 실행(axis 49개, E5)
- [x] PRD 초안 · 결정 목록(D1~D6)
- [x] 사용자 결정 반영(D1~D6 모두 ①, 2026-10-23), PRD v1.0

## FR-1 · FR-2 수집기
- [x] `resolveDocsUrl` 라우트 실재 확인 + `DOCS_SLUG_ALIASES`, 없으면 URL 비움
- [x] 데모 페이지 스캔 제거, 단일 파일 · 테스트 · 스토리 파일 제외, 이름순 정렬
- [x] 설명은 컴포넌트 이름 선언 앞 JSDoc 우선
- [x] 수집기 테스트(실제 저장소 루트 + 픽스처), 수정 전 코드로 9건 실패 확인(변이)

## FR-3 데이터
- [x] `axis library refresh-axis` · 루트 `pnpm library:refresh-axis`
- [x] 재생성: 추가 13 · 변경 35 · 삭제 7, 전체 129개
- [x] 외부 컴포넌트 파일 56개 sha256 불변 · 집계 파일 외부 항목 불변, 다시 돌리면 쓰기 0개

## FR-4 검사
- [x] 오프라인 검사 스크립트: main 데이터 라우트 7건 실패 · 수정 데이터 0건
- [x] CI 단계 `Library link check (offline)`
- [x] 네트워크 검사 수동 스크립트 1회 실행(109개 모두 2xx)

## 검증 · 릴리스
- [x] 게이트(type-check · lint · build · test --force, test:registry · cli-smoke · pack-smoke)
- [x] changeset(cli patch), release-notes, testplan
- [ ] 배포 뒤 pages.dev 링크 전수 200 재확인(`pnpm check-library-links:remote --host axis-design-system.pages.dev`)
