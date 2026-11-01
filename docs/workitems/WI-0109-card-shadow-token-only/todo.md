# WI-0109: TODO

> PRD: [prd.md](./prd.md) | 테스트: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #280 | 상태: 진행 중

## 조사
- [x] 두 구현 판정 경로 · 테스트 · Tailwind 문법 · 영향 코퍼스 조사, 설계안과 반박 검토(조사 워크플로, 2026-11-02)
- [x] 사용자 결정 D1 ~ D4 (prd 2절)

## 구현
- [ ] 값 판정 헬퍼(클래스 토큰 분류 · CSS/style 값 분류, 단위 종류별 허용 토큰) 두 구현에 같은 글자로 (FR-1)
- [ ] 클래스 경로 2곳 교체 (FR-2)
- [ ] style boxShadow · CSS box-shadow 선언 단위 판정 (FR-3)
- [ ] 그림자 토큰 재정의 판정 (FR-4)
- [ ] `[box-shadow:…]` · 카드 CSS `@apply` (FR-5)
- [ ] isCardLike `rounded-[…]` (FR-6)
- [ ] palette 밑줄 뒤 색 (FR-7)
- [ ] 스크립트 보고 메시지 (FR-8)
- [ ] 템플릿 공개 JSON 재생성 · README 58행 · WI-0107 문서 서술 · changeset cli · mcp patch (FR-9)

## 검증
- [ ] 경계 사례 단위 테스트 + 패리티 양성 · 음성 등록 (AC1)
- [ ] 레지스트리 사본 · 템플릿 원본 위반 0 (AC2)
- [ ] 코퍼스 A/B와 양성 대조군 (AC3)
- [ ] 변이 3종 rc 1 (AC4)
- [ ] 적대 입력 시간 · 작업량 (AC5)
- [ ] turbo build · type-check · lint · test `--force`, check-changeset-mcp-tokens, check-token-refs (AC6)

## 릴리스
- [ ] release-notes.md
- [ ] PR 리뷰 · 머지 · 발행(Master)
- [ ] 발행 뒤 Issue #280 닫기 · project-todo 현행화(Master)
