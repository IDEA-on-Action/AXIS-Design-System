# WI-0040: library `npx axis-cli` 실행 안내 정리 TODO

> PRD: [prd.md](./prd.md) | Testplan: [testplan.md](./testplan.md) | GitHub: #127 | 상태: ✅ 완료 (2026-10-24, 배포 없음)

## 실측
- [x] 006836a~1 의 `npx axis-cli` 분포: 8개 파일 14곳, 모두 데모 페이지 소스 문자열 안의 `<CodeBlock code=\"npx axis-cli add <slug>\"` (2026-10-24)
- [x] 해소 근거: 006836a(WI-0057, #162) 이후 0건(`git grep` rc 1), 계측 대조로 같은 범위에서 `pages.dev` 45개 파일 · `CodeBlock` 2개 파일이 잡힘 (2026-10-24)

## 구현
- [x] `guidance.test.ts`: `LIBRARY_DATA_DIRS`(`apps/web/public/library`) 스캔, `jsonStringLines` 로 JSON 문자열 이스케이프를 풀어 줄 단위 검사, 파싱 실패는 오류 (FR-1)
- [x] 양성 대조 fixture `packages/axis-cli/test/fixtures/guidance/library-step-indicator-006836a.json` 과 테스트 (FR-2)
- [x] 계측 대조: library 파일 100개 초과 · 실재 파일 포함 · 풀어 읽은 줄 50줄 초과 (FR-3)
- [x] 위반 표기: library 는 풀어 읽은 줄 번호라 `파일#N`, 원문은 `파일:N`
- [x] cli `turbo.json` test inputs 에 `$TURBO_ROOT$/apps/web/public/library/**` (FR-4)
- [x] 스캔 범위 주석에서 library 제외 항목을 지우고 이 WI 결정으로 바꿈

## 검증
- [x] AC1 · AC3 · AC4 → testplan T1 · T2 · T4
- [x] AC2 변이(006836a~1 데이터 복원) → testplan T3
- [x] 릴리스 노트 작성
