# 구현 계획 — WI-0012: npm 정식 배포 실행

> 작성일: 2026-02-01

---

## 배포 전략

### 1단계: 사전 확인
- npm 조직 및 토큰 준비
- 품질 게이트 통과 확인 (build, type-check, lint)

### 2단계: 배포 실행
- **우선**: 로컬 수동 배포 (`NPM_TOKEN` 환경변수 + `pnpm release`)
- **이후**: GitHub Actions 자동 배포 검증

### 3단계: 배포 검증
- npmjs.com에서 각 패키지 조회
- 외부 프로젝트에서 설치 테스트

### 4단계: 정리
- project-todo.md 완료 처리
- release-notes.md 작성
