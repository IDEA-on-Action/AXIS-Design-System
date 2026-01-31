# 릴리스 노트 — WI-0004 Agentic UI 추가 구현

> 릴리스 날짜: 2026-02-01

---

## 요약

AI/Agent 워크플로우를 위한 Agentic UI 컴포넌트 8종을 추가 구현하여 라인업을 확장했습니다.

---

## 변경 내역

### ✨ 추가 (Added)

- **MessageBubble**: 에이전트/사용자 메시지 버블 컴포넌트
- **CodeBlock**: 구문 강조 지원 코드 블록
- **FeedbackButtons**: 좋아요/싫어요 피드백 UI
- **TokenUsageIndicator**: 토큰 사용량 시각화 인디케이터
- **PlanCard**: 에이전트 실행 계획 카드
- **AttachmentCard**: 파일 첨부 카드
- **ContextPanel**: 컨텍스트 정보 패널
- **DiffViewer**: 코드 변경사항 비교 뷰어
- 모든 컴포넌트에 JSDoc 문서화, WCAG 2.1 AA 접근성 지원
- `package.json` exports 서브패스 등록
- `src/index.ts`에서 모든 컴포넌트 및 타입 re-export

---

## Breaking Changes

> 없음 — 기존 API와 호환됩니다.

---

## 검증 방법 (How to Verify)

1. `pnpm install` 실행
2. `pnpm type-check` 타입 체크 통과 확인
3. `pnpm build` 빌드 통과 확인
4. `pnpm dev:web` 으로 개발 서버 시작 후 Library 페이지에서 컴포넌트 확인

---

## 관련

- WI: WI-0004
- GitHub: #40
- PRD: [prd.md](./prd.md)
