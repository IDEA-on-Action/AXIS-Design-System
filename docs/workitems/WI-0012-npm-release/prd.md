# PRD — WI-0012: npm 정식 배포 실행

> 작성일: 2026-02-01 | 상태: Approved

---

## 1. 개요

### 1.1 배경
- WI-0005에서 npm 배포 **준비** 완료 (패키지 설정, Changesets, CI 워크플로우)
- 현재 6개 패키지 모두 v1.1.0으로 범핑 완료
- NPM_TOKEN 설정 및 실제 npm registry 배포가 남아있음

### 1.2 목표
- 6개 공개 패키지를 npm registry에 정식 배포
- CI/CD 파이프라인을 통한 자동 배포 체계 검증
- 배포 후 패키지 설치 및 사용 가능 여부 확인

### 1.3 범위
- **포함**: npm 배포 실행, 배포 검증, 문서 업데이트
- **제외**: 새 기능 개발, 버전 변경

---

## 2. 대상 패키지

| 패키지 | 버전 | npm 스코프 |
|--------|------|-----------|
| @axis-ds/tokens | 1.1.0 | @axis-ds |
| @axis-ds/ui-react | 1.1.0 | @axis-ds |
| @axis-ds/agentic-ui | 1.1.0 | @axis-ds |
| @axis-ds/theme | 1.1.0 | @axis-ds |
| @axis-ds/cli | 1.1.0 | @axis-ds |
| @axis-ds/mcp | 1.1.0 | @axis-ds |

---

## 3. 배포 방법

### 방법 A: GitHub Actions 자동 배포 (권장)
1. GitHub Secrets에 `NPM_TOKEN` 등록
2. Changeset 파일 생성 → PR 머지 → 자동 배포

### 방법 B: 로컬 수동 배포
1. `NPM_TOKEN` 환경변수 설정
2. `pnpm build && pnpm release` 실행

---

## 4. 사전 조건

- [x] npm 조직 `@axis-ds` 생성 완료
- [ ] NPM_TOKEN 발급 (npmjs.com → Access Tokens)
- [ ] GitHub Secrets에 NPM_TOKEN 등록 (방법 A 사용 시)

---

## 5. 수용 기준 (Acceptance Criteria)

- **AC1**: 6개 패키지 모두 npmjs.com에서 `npm view @axis-ds/<pkg>` 조회 가능
- **AC2**: `npm install @axis-ds/ui-react` 로 외부 프로젝트에서 설치 성공
- **AC3**: 배포된 패키지의 TypeScript 타입 정상 동작
- **AC4**: CI 배포 파이프라인 정상 동작 확인 (방법 A 사용 시)

---

## 6. 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| npm 스코프 미등록 | 배포 실패 | 사전에 @axis-ds 조직 확인 |
| NPM_TOKEN 권한 부족 | 배포 실패 | Automation 타입 토큰 발급 |
| 패키지 의존성 순서 | 빌드/배포 실패 | Changesets linked 설정으로 동시 배포 |
