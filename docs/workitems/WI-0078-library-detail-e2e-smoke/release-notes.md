# WI-0078: library 상세 화면 E2E 스모크 릴리스 노트

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #206 | 날짜: 2026-10-25

## 요약

library 상세 화면이 런타임에 받는 데이터(`/library/components/<id>.json`)와 화면 내용을 지키는 E2E 스모크를 CI 에 넣었어요. 데이터가 비어 오류 화면이 떠도 a11y E2E 가 초록이던 거짓 양성도 없앴어요.

## 변경

- `apps/web/e2e/library-detail.spec.ts`(신규): 대표 3건(코드 있음 · slug 바뀐 외부 · 코드 없는 외부)의 데이터 응답 200 과 h1 · 설치 명령 · 코드 블록을 상세 JSON 과 대조, 404 주입 자기 검사 1건
- `apps/web/e2e/library-reps.cjs`(신규): 대표를 index.json 에서 규칙으로 고르고 못 고르면 멈춤. a11y-routes.cjs 와 공유
- `apps/web/e2e/a11y-routes.cjs`: library 상세 준비 선택자를 로드 뒤에만 있는 「설치」 h2 로 좁힘(경로 59 · 건수 236 불변)
- `apps/web/package.json`: `test:e2e:library`
- `.github/workflows/frontend.yml`: 「E2E library 상세 스모크 (WI-0078)」 step, 건수 가드 `library:4`(describe 별 3 · 1), 실패 산출물 업로드 조건

## 영향

- npm 발행 없음(changeset 없음). `@ax/web` 은 private 이고 제품 코드는 바뀌지 않아요. Pages 배포만 있어요.
- CI 시간: library step 이 4건 약 10초(로컬 측정) 늘어요.
