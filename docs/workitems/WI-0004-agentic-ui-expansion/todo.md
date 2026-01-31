# TODO — WI-0004 Agentic UI 추가 구현

> 생성일: 2026-02-01 | WI: WI-0004 | GitHub: #40

---

## 체크리스트

### Step 1: PRD/TODO 현행화
- [x] prd.md AC 구체화
- [x] todo.md 생성
- [x] project-todo.md 상태 🔄 갱신

### Step 2: Low 복잡도 컴포넌트 (4개)
- [x] MessageBubble — 대화 메시지 버블
- [x] FeedbackButtons — 좋아요/싫어요 피드백
- [x] TokenUsageIndicator — 토큰 사용량/비용 표시
- [x] ContextPanel — 모델/설정 메타 정보 패널

### Step 3: Medium 복잡도 컴포넌트 (3개)
- [x] CodeBlock — 코드 표시 + 복사 버튼
- [x] PlanCard — AI 실행 계획 표시/승인
- [x] AttachmentCard — 파일/이미지 첨부 표시

### Step 4: High 복잡도 컴포넌트 (1개)
- [x] DiffViewer — 코드 변경사항 비교 표시 (LCS 기반 자체 diff)

### Step 5: 통합
- [x] src/index.ts — 8개 컴포넌트 export 추가
- [x] package.json — exports 서브패스 추가
- [x] a11y-labels.ts — 새 상수 추가

### Step 6: 품질 검증
- [x] pnpm type-check 통과
- [x] pnpm build 통과 (6/6 tasks successful)

### Step 7: 문서/레지스트리
- [x] 레지스트리 JSON 갱신 (pnpm build:registry) — 28개 컴포넌트 빌드 완료
- [x] 웹 문서 페이지 추가 (8개 컴포넌트 문서 + 허브 갱신)
