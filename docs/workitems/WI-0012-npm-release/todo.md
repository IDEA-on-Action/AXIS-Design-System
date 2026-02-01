# TODO — WI-0012: npm 정식 배포 실행

> 생성일: 2026-02-01 | PRD: [prd.md](./prd.md)

---

## 체크리스트

### AC1: npm registry에 패키지 배포

- [x] npm 조직 `@axis-ds` 존재 확인 (npmjs.com)
- [x] NPM_TOKEN 발급 (Automation 타입 권장)
- [x] 로컬 환경변수 또는 GitHub Secrets에 NPM_TOKEN 설정
- [x] 빌드 성공 확인 (`pnpm build`)
- [x] npm dry-run 배포 테스트 (`pnpm release --dry-run` 또는 패키지별 `npm pack --dry-run`)
- [x] 정식 배포 실행 (방법 B: 로컬 수동 배포)
- [x] 6개 패키지 모두 npmjs.com에서 조회 가능 확인

### AC2: 외부 프로젝트 설치 검증

- [x] 새 프로젝트에서 `npm install @axis-ds/ui-react` 설치 성공
- [x] 기본 컴포넌트 import 및 렌더링 동작 확인

### AC3: TypeScript 타입 검증

- [x] 설치된 패키지에서 타입 자동완성 동작 확인
- [x] `d.ts` 파일 정상 포함 확인

### AC4: CI 배포 파이프라인 검증 (선택)

- [ ] GitHub Actions `publish.yml` 워크플로우 정상 실행 확인
- [ ] Changesets action을 통한 자동 버전 관리 확인

### 기타

- [x] project-todo.md 완료 처리
- [x] 배포 완료 후 release-notes.md 작성
