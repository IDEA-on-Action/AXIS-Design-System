# WI-0017: 문서 사이트 검색 (Pagefind) TODO

> PRD: [prd.md](./prd.md) | 상태: 🔄 진행 예정

## Phase 1: 빌드 통합
- [ ] `pagefind` devDependency 설치
- [ ] `build:web` 후속 인덱싱 단계 추가 (`pagefind --site out`) (AC1)
- [ ] 인덱싱 산출물 경로 + Cloudflare Pages 배포 정합 확인
- [ ] `.gitignore`에 Pagefind 산출물 추가

## Phase 2: 검색 훅
- [ ] `src/components/search/use-pagefind.ts` (동적 import + debounce 쿼리)

## Phase 3: 검색 UI
- [ ] `src/components/search/search-dialog.tsx` (cmdk 모달 재활용) (AC2)
- [ ] ⌘K / `/` 글로벌 핫키 바인딩
- [ ] 결과 항목: 제목 + 섹션 + 스니펫, 클릭 시 앵커 이동 (AC3)
- [ ] 키보드 네비게이션 + Esc 닫기 + 포커스 트랩 (AC4)

## Phase 4: 검증
- [ ] 51개 문서 페이지 인덱싱 100% 확인
- [ ] a11y(role/aria/스크린리더) 점검

## Definition of Done
- [ ] 타입 체크 통과
- [ ] 린트 통과
- [ ] 빌드 성공 + Cloudflare Pages 정적 배포 검증
- [ ] release-notes.md 작성
