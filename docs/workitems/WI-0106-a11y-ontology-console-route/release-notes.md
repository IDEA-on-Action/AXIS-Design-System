# WI-0106: a11y 게이트가 상세 JSON 이 있는 템플릿 상세를 전부 검사 릴리스 노트

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #270 | 날짜: 2026-11-01 | 미배포(PR 리뷰 대기). npm 발행 없음, changeset 없음(`@ax/web` private), 머지 뒤 Pages 배포만

## 요약

문서 사이트 a11y E2E 게이트가 템플릿 상세 페이지를 첫 항목(dashboard) 하나만 재던 것을, 상세 JSON 이 있는 템플릿 전부(지금 5개, `/templates/ontology-console/` 포함)로 넓혔어요. 상세 페이지가 데이터 없이 404 화면을 그려도 「준비 완료」로 재던 기본 `h1` 준비 판정도 그 템플릿 이름이 든 h1 로 좁혔어요.

## 바뀐 점

- `apps/web/e2e/a11y-routes.cjs`
  - `templates/[slug]` 가 상세 JSON(`public/templates/<slug>.json`)이 있는 템플릿 전부를 돌려줘요(dashboard · hr-dashboard · landing-page · ontology-console · theme-only)
  - 준비 선택자는 상세 JSON 의 name 으로 만든 `h1:text-is("<name>")` 예요(예: `h1:text-is("Ontology Console")`)
  - 설정 단계에서 멈추는 경우: 상세 JSON 이 있는 템플릿이 0개, ontology-console 이 목록에 없음, 상세 JSON 에 name 이 없음(그리고 종전대로 같은 주소 중복 · 경로 0개)
  - DYNAMIC 규칙이 경로 배열을 돌려줄 수 있어요. library 두 라우트는 대표 1개씩 그대로예요
- 경로 수 59 → 63, a11y 검사 236 → 252건(63 x 4조합). CI 「E2E 실행 건수 가드」는 같은 파일에서 기대 건수를 계산해 따로 고칠 값이 없어요(주석의 실측값만 갱신)
- `a11y.spec.ts` · `frontend.yml` 은 주석만 바뀌었어요

## 측정

- 정적 빌드 `out/` 에서 a11y 252건 통과, 실패 · skipped 0, 조합마다 63건(testplan 3절)
- 음성 대조: ontology-console 상세에 대비 위반을 넣으면 4조합 모두 color-contrast 로 실패, 상세 JSON 없는 slug 를 넣으면 4조합 모두 준비 선택자에서 실패(testplan 4절)
- 새로 넣은 템플릿 상세 4개(16건)에서 새 axe 위반은 없었어요

## 바뀌지 않은 점

- 제품 코드 · 템플릿 데이터 · 건수 가드 스크립트 · 다른 E2E spec
- npm 패키지(발행 없음)

## 알려진 한계

- 콘솔 결과 앱(`axis template init ontology-console` 로 만든 앱) UI 자체의 a11y 는 이 게이트가 재지 않아요. 게이트는 문서 사이트의 템플릿 상세 소개 페이지만 재요(D3). 결과 앱 axe 측정은 WI-0027 의 로컬 기록이에요
- 상세 페이지는 처음 보이는 Overview 탭만 재요(Files · Setup 탭은 클릭해야 그려짐)
- 상세 JSON 이 늘면 a11y 검사 건수와 실행 시간이 경로당 4건씩 늘어요
