# Release Notes — WI-0012: npm 정식 배포 실행

> 완료일: 2026-02-01

---

## 요약

AXIS Design System 6개 공개 패키지를 npm registry에 정식 배포하였습니다.

## 배포된 패키지

| 패키지 | 버전 | npm |
|--------|------|-----|
| @axis-ds/tokens | 1.1.1 | [npmjs.com](https://www.npmjs.com/package/@axis-ds/tokens) |
| @axis-ds/ui-react | 1.1.1 | [npmjs.com](https://www.npmjs.com/package/@axis-ds/ui-react) |
| @axis-ds/agentic-ui | 1.1.1 | [npmjs.com](https://www.npmjs.com/package/@axis-ds/agentic-ui) |
| @axis-ds/theme | 1.1.1 | [npmjs.com](https://www.npmjs.com/package/@axis-ds/theme) |
| @axis-ds/cli | 1.1.1 | [npmjs.com](https://www.npmjs.com/package/@axis-ds/cli) |
| @axis-ds/mcp | 1.1.1 | [npmjs.com](https://www.npmjs.com/package/@axis-ds/mcp) |

## 검증 결과

- npm registry 조회: 6/6 성공
- 외부 프로젝트 설치: 성공 (205 dependencies, 0 vulnerabilities)
- 컴포넌트 import/export: 정상 동작
- TypeScript 타입 (d.ts): 모든 컴포넌트에 포함 확인

## 배포 방법

- 로컬 수동 배포 (`pnpm publish -r --access public --no-git-checks`)
- CI 자동 배포는 GitHub Secrets에 NPM_TOKEN 등록 후 활성화 가능

## 설치 방법

```bash
npm install @axis-ds/ui-react @axis-ds/tokens
```
