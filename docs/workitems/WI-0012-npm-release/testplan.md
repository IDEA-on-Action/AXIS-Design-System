# 테스트 계획 — WI-0012: npm 정식 배포 실행

> 작성일: 2026-02-01

---

## 테스트 항목

### T1: 배포 확인
- [ ] `npm view @axis-ds/tokens` 조회 성공
- [ ] `npm view @axis-ds/ui-react` 조회 성공
- [ ] `npm view @axis-ds/agentic-ui` 조회 성공
- [ ] `npm view @axis-ds/theme` 조회 성공
- [ ] `npm view @axis-ds/cli` 조회 성공
- [ ] `npm view @axis-ds/mcp` 조회 성공

### T2: 설치 테스트
- [ ] 빈 프로젝트에서 `npm install @axis-ds/ui-react` 성공
- [ ] `@axis-ds/tokens` peer dependency 자동 해결

### T3: 타입 검증
- [ ] TypeScript 프로젝트에서 타입 import 정상 동작
