# WI-0108: TODO

> PRD: [prd.md](./prd.md) | 테스트: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #277 | 상태: 구현 완료(머지 전)

## 조사
- [x] ui-react · agentic-ui 그림자 클래스 전수 조사, 떠 있는 레이어 판정표 (FR-1, testplan 1절)
- [x] ui-react `cn` 그림자 그룹 병합 실측(tailwind-merge 2.6.0) (FR-3, 이미 확장돼 있어 코드 변경 없음)

## 구현
- [x] PopoverContent · DropdownMenuContent · DropdownMenuSubContent · SheetContent 그림자를 토큰으로 (FR-2)
- [x] 단위 테스트 `overlay-shadow.test.tsx`(렌더 4건 + 소스 검사 1건) (AC1 ~ AC3)
- [x] changeset ui-react patch, `pnpm changeset status` 로 agentic-ui 1.8.5 동반 확인 (FR-5)
- [x] 문서 · 스토리 · 스냅샷 확인(바꿀 곳 없음, testplan 5절)
- [x] 라이브러리 상세 데이터 `pnpm library:refresh-axis` 재생성(변경 6 · 파일 10, 재실행 변경 0, testplan 5절)
- [x] 소스 검사 고정 그림자 정규식에 bare `shadow` · `shadow-xs` · `shadow-inner` 추가, 변이 확인(testplan 3절)

## 검증
- [x] Tailwind 3 · 4 클래스 생성 (AC4)
- [x] 브랜드 · 테마별 계산값, 브라우저 실측 (AC5)
- [x] turbo build · type-check · lint · test `--force`, pack-smoke, check-changeset-mcp-tokens (AC6)

## 릴리스
- [x] release-notes.md
- [ ] PR 리뷰 · 머지 · 발행(Master)
- [ ] 발행 뒤 Issue #277 닫기 · project-todo 현행화(Master)
