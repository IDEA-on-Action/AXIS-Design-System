# 릴리스 노트 — WI-0006 DX 개발자 경험 향상

> 릴리스 날짜: 2026-02-01

---

## 요약

모든 공개 API에 JSDoc 문서화를 추가하고, 개발자 가이드 4종을 작성하여 개발자 온보딩 경험을 개선했습니다.

---

## 변경 내역

### ✨ 추가 (Added)

- 모든 공개 컴포넌트·훅·타입에 JSDoc 주석 추가
- 개발자 가이드 문서 4종:
  - Monorepo 설정 가이드
  - Agentic UI 디자인 가이드
  - 컴포넌트 개발 가이드
  - 테마 커스터마이징 가이드

### 🔄 변경 (Changed)

- 에러 메시지를 구체적이고 유의미한 형태로 개선
- IDE 자동완성 및 타입 힌트 향상

---

## Breaking Changes

> 없음 — 기존 API와 호환됩니다.

---

## 검증 방법 (How to Verify)

1. `pnpm install` 실행
2. `pnpm type-check` 타입 체크 통과 확인
3. IDE에서 컴포넌트 import 시 JSDoc 자동완성 확인
4. `pnpm dev:web` 으로 가이드 문서 페이지 확인

---

## 관련

- WI: WI-0006
- GitHub: #44
- PRD: [prd.md](./prd.md)
