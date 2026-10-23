# WI-0057: library 낡은 항목 · 문서 링크 404 정리 TODO

> PRD: [prd.md](./prd.md) | GitHub: #155

## 1단계 실측 · PRD
- [x] 생성 경로(collect → `.claude/data/library` → publish → `apps/web/public/library`) · 소비처 · 커밋 이력 실측
- [x] 링크 전수 GET 103개(200 96 · 404 7), 대조군 3개
- [x] 소스 ↔ `(docs)` 라우트 이름 대응 전수(불일치 approval-card ↔ approval-dialog 1쌍)
- [x] 수집기 오프라인 시험 실행(axis 49개, E5)
- [x] PRD 초안 · 결정 목록(D1~D6)
- [ ] 사용자 결정 반영(D1~D6)

## FR-1 · FR-2 수집기 (결정 대기)
- [ ] `getDocsUrl` 라우트 실재 확인 + 별칭 표, 없으면 URL 생략
- [ ] 데모 페이지 스캔 제거, 단일 파일 · 테스트 파일 · 비컴포넌트 디렉터리 제외
- [ ] 수집기 테스트(실제 저장소 루트), 수정 전 코드로 실패 확인(변이)

## FR-3 데이터 (결정 대기)
- [ ] 낡은 항목 삭제(components · index · search-index · categories/agentic · meta 통계)
- [ ] approval-card URL `/agentic/approval-dialog`
- [ ] (D1 ①) axis 항목 재생성, shadcn · monet 항목 바이트 불변 확인

## FR-4 검사 (결정 대기)
- [ ] 오프라인 검사 스크립트(라우트 실재 + 파일 간 정합), main 데이터 7건 실패 · 수정 데이터 0건
- [ ] (D4 ①) CI 단계 추가

## 검증 · 릴리스
- [ ] AC5 기존 게이트
- [ ] (D5) changeset, release-notes, testplan
- [ ] 배포 뒤 AC1 pages.dev 링크 전수 200
