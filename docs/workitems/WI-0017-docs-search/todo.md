# WI-0017: 문서 사이트 검색 (Pagefind) TODO

> PRD: [prd.md](./prd.md) | 상태: 🔄 구현 완료, 배포 검증 대기

## Phase 1: 빌드 통합 ✅
- [x] `pagefind` devDependency 설치 (^1.3.0, 실설치 1.5.2)
- [x] `build` 스크립트에 `&& pagefind --site out` 체이닝 (turbo lifecycle 보장) (AC1)
- [x] 산출물 경로 `out/pagefind` 확인 (out/ 이미 gitignore → 별도 처리 불필요)
- [x] DocPageLayout에 `data-pagefind-body` 부여 → 본문만 인덱싱 (WI-0016 시너지)

## Phase 2: 검색 훅 ✅
- [x] `src/components/search/use-pagefind.ts` (동적 import + webpackIgnore + debounce + dev graceful)

## Phase 3: 검색 UI ✅
- [x] `src/components/search/search-dialog.tsx` (DS Dialog + Command 조합, shouldFilter=false) (AC2)
- [x] `src/components/search/search-trigger.tsx` ⌘K / Ctrl+K / `/` 글로벌 핫키 (AC4)
- [x] 결과 항목: 제목 + excerpt(`<mark>` 하이라이트), 선택 시 router.push (AC3)
- [x] site-header에 검색 트리거 배치 + Dialog 포커스 트랩(Radix) + Esc 닫기
- [x] 다이얼로그 a11y: sr-only DialogTitle

## Phase 4: 검증 ✅(빌드)
- [x] 빌드 인덱싱 동작: "Found data-pagefind-body" + **48개 페이지 인덱싱** (표준화 문서 전수)
- [ ] 배포 후 실제 검색 동작 확인 (Cloudflare Pages preview/production)

## Definition of Done
- [x] 타입 체크 통과
- [x] 린트 통과
- [x] 빌드 성공 (정적 214페이지 + Pagefind 인덱스 생성)
- [ ] Cloudflare Pages 정적 배포 검증 (배포 후)
- [ ] release-notes.md 작성

## 참고
- 인덱싱 대상은 `data-pagefind-body`(DocPageLayout) 보유 페이지 = 컴포넌트/Agentic 48개. 인덱스 페이지·랜딩 등은 제외(의도). 더 넓은 검색이 필요하면 해당 레이아웃에도 `data-pagefind-body` 추가.
- Pagefind는 한국어 stemming 미지원(word 기반 인덱싱은 동작). 컴포넌트명/prop은 영문이라 영향 적음.
- dev 모드(`next dev`)는 인덱스 미생성 → 검색 다이얼로그가 "프로덕션 빌드에서 동작" 안내(graceful).
