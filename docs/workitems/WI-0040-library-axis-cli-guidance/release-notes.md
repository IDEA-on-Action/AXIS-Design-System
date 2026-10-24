# WI-0040 릴리스 노트: library `npx axis-cli` 실행 안내 회귀 방지

> 작성일: 2026-10-24 | WI: WI-0040 | GitHub: #127 | changeset: 없음(테스트 · 문서만 바뀜, 배포 없음)

## 해소 근거

- library 데이터의 `npx axis-cli add ...` 안내 14곳(8개 파일)은 WI-0057(006836a, #162)이 수집기의 데모 페이지 스캔을 없애고 AXIS 항목을 다시 만들 때 모두 사라졌습니다. 2026-10-24 main bd54e91 에서 0건입니다.

## 변경 사항

- **검사 범위(test)**: `packages/axis-cli/src/guidance.test.ts` 가 `apps/web/public/library/**/*.json` 도 검사합니다. JSON 을 파싱해 문자열(키 포함)의 `\n` · `\"` · `\u` 이스케이프를 풀고 줄 단위로 봅니다. 파싱에 실패하면 테스트가 실패합니다. 위반은 `파일#풀어 읽은 줄 번호` 로 표시합니다.
- **양성 대조 fixture**: 006836a~1 의 `step-indicator.json` 원문 조각을 `packages/axis-cli/test/fixtures/guidance/library-step-indicator-006836a.json` 에 두고, 그 조각이 걸리는지 테스트로 고정했습니다.
- **turbo**: cli `test` 태스크 inputs 에 `apps/web/public/library/**` 를 더해 데이터가 바뀌면 캐시를 쓰지 않습니다.

## 검증

- 006836a~1 데이터를 되살리면 테스트가 14곳을 모두 내며 실패하고, library 스캔을 끄면 계측 대조가 실패합니다. 상세는 [testplan.md](./testplan.md).
- `pnpm --filter @axis-ds/cli test` rc 0(17파일 662건).

## 소비 프로젝트 영향

- 없습니다. 배포 패키지 내용은 바뀌지 않습니다.
