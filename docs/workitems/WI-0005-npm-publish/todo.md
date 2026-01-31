# TODO — WI-0005: npm 배포 준비

> 생성일: 2026-02-01 | PRD: [prd.md](./prd.md) | GitHub: #43

---

## 체크리스트

### AC1: npm publish 또는 CI를 통해 패키지 배포 가능

- [x] 각 패키지 `publishConfig: { "access": "public" }` 추가
- [x] 각 패키지 `prepublishOnly` 스크립트 추가
- [x] CLI 패키지명 `axis-cli` → `@axis-ds/cli` 통일
- [x] GitHub Actions 배포 워크플로우 (`.github/workflows/publish.yml`) 작성
- [x] 각 패키지 `npm pack --dry-run` 성공 확인

### AC2: 버전 관리 워크플로우 동작 (Changesets)

- [x] `@changesets/cli` 설치
- [x] `.changeset/config.json` 설정 (linked, access, ignore)
- [x] 루트 스크립트 추가 (`changeset`, `version-packages`, `release`)

### AC3: 배포 전 품질 게이트 통과 필수

- [x] `pnpm build` 성공
- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] GitHub Actions 워크플로우에 lint → type-check → build 단계 포함

### 기타

- [x] 패키지별 README.md 작성 (6개 패키지)
- [ ] NPM_TOKEN 시크릿 설정 (GitHub repo settings에서 수동 등록 필요)
