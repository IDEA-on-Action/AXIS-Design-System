# TODO — axis-cli 기능 확장

> WI: WI-0001 | PRD 기반 | 상태: In Progress

---

## 실행 순서 (제안)

1. GitHub API 클라이언트 구현
2. WI 매핑 파서 구현
3. sync 명령어 통합
4. 테스트 및 문서화

---

## Tasks

### Phase 1: 기본 구현

- [x] **T1: GitHub API 클라이언트 구현**
  - AC: AC2 — GitHub Issue 조회 가능
  - 대상 파일: `packages/axis-cli/src/sync/github-client.ts`
  - 테스트: API 호출 mock 테스트

- [x] **T2: WI 매핑 파서 구현**
  - AC: AC2 — wi-mapping.json 파싱 및 WI ↔ Issue 매핑
  - 대상 파일: `packages/axis-cli/src/sync/parser.ts`, `mapper.ts`
  - 테스트: 매핑 정확성 검증

- [x] **T3: sync 명령어 기본 구현**
  - AC: AC1 — `axis sync` 실행 시 동기화 수행
  - 대상 파일: `packages/axis-cli/src/sync/index.ts`
  - 테스트: E2E 시나리오

- [x] **T4: 타입 정의 완성**
  - AC: AC3 — 타입 체크 통과
  - 대상 파일: `packages/axis-cli/src/sync/types.ts`
  - 테스트: `pnpm type-check`

### Phase 2: 확장

- [x] **T5: status 명령어 구현**
  - AC: 프로젝트 상태 요약 출력
  - 대상 파일: `packages/axis-cli/src/`
  - 테스트: 출력 형식 검증

- [x] **T6: dry-run 모드 구현**
  - AC: `--dry-run` 플래그로 변경 없이 미리보기
  - 대상 파일: `packages/axis-cli/src/sync/index.ts`

---

## Definition of Done (WI)

- [x] 모든 Task 완료
- [x] 타입 체크 통과 (`pnpm type-check`)
- [x] 린트 통과 (`pnpm lint`)
- [x] 빌드 성공 (`pnpm build`)
- [ ] 문서 업데이트
- [ ] 릴리스 노트 작성
