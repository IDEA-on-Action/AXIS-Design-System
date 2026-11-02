# WI-0110: TODO

> PRD: [prd.md](./prd.md) | 테스트: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #283 | 상태: 완료(2026-11-02, PR #284 · Version PR #285, ui-react · agentic-ui 1.8.6 발행)

## 조사
- [x] 현재 구조 · 함께 고칠 곳 · 레지스트리 · 템플릿 규칙 영향, 브랜드별 시각 측정, 설계 · 반박(조사 워크플로, 2026-11-02)
- [x] 사용자 결정 D1 ~ D5 (prd 2절)

## 구현
- [x] TooltipContent 토큰 그림자 (FR-1)
- [x] overlay-shadow.test.tsx 렌더 단언 (FR-2)
- [x] 라이브러리 상세 데이터 재생성 · 재실행 변경 0 (FR-3)
- [x] troubleshooting 5절 (FR-4)
- [x] changeset ui-react patch, agentic-ui 동반 확인 (FR-5)

## 검증
- [x] 단위 · 음성 대조 · 변이 (AC1 ~ AC3)
- [x] 문서 페이지 브라우저 계산값 4조합 (AC4)
- [x] Tailwind 3 · 4 클래스 생성 (AC5)
- [x] turbo build · type-check · lint · test `--force`, check-changeset-mcp-tokens, check-token-refs (AC6)

## 릴리스
- [x] release-notes.md
- [x] PR 리뷰 · 머지 · 발행
- [x] 발행 뒤 Issue #283 닫기 · project-todo · CLAUDE.md 현행화
