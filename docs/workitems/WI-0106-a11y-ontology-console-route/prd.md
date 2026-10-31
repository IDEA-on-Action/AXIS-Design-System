# WI-0106: a11y 게이트가 상세 JSON 이 있는 템플릿 상세를 전부 검사 PRD

> 작성일: 2026-11-01 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0106 | GitHub: #270 | 우선순위: P3 | 상태: Approved (2026-11-01 사용자 결정 D1 · D2 · D3)
> 기준: `main` 71f0c62 | 묶음: 배치 12 (WI-0105 와 병렬, 고치는 파일이 겹치지 않음)
> 폴더 이름: wi-mapping 의 slug(`a11y-ontology-console-route`) 그대로예요. 범위는 D1 로 「ontology-console 하나」에서 「상세 JSON 이 있는 템플릿 전부」로 넓어졌어요
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정, 수정 전)

- `apps/web/e2e/a11y-routes.cjs` 의 `templates/[slug]` 규칙은 상세 JSON(`public/templates/<slug>.json`)이 있는 **첫 템플릿 하나**(`/templates/dashboard/`)만 a11y 게이트에 넣었어요(`node e2e/a11y-routes.cjs --count` rc 0 · 59).
- 상세 JSON 이 있는 템플릿은 5개(dashboard · hr-dashboard · landing-page · ontology-console · theme-only)라 나머지 4개, 특히 ontology 테마 완료(WI-0027)로 생긴 `/templates/ontology-console/` 상세 페이지는 4조합(default · ontology × light · dark) 검사를 받지 않았어요. WI-0027 release-notes 「알려진 한계」와 todo 후속 항목이 이를 적어 두었어요.
- 준비 판정은 기본 `h1` 이었어요. 정적 export 는 상세 JSON 이 없는 slug 에도(`generateStaticParams` 가 index 의 slug 43개를 모두 내므로) 404 화면을 그린 `index.html` 을 HTTP 200 으로 내고, 그 화면에도 h1(「404」)이 있어 기본 `h1` 으로는 404 화면을 재고 통과해요(testplan 4.2 의 종전 선택자 대조로 측정).

### 1.2 결정 (2026-11-01 사용자)

| # | 결정 |
|---|---|
| D1 | `templates/[slug]` 규칙이 상세 JSON 이 있는 템플릿 **전부**를 돌려줘요. DYNAMIC 규칙이 배열을 돌려줄 수 있게 `listA11yRoutes` 를 고치고, 중복 검사 · 0건 throw 는 유지해요. ontology-console 이 목록에 있는지 단언해요(빠지면 설정 단계에서 실패) |
| D2 | templates 상세는 `{ path, ready }` 로 그 템플릿 상세 JSON 의 `name` 기반 준비 선택자(`h1:text-is("<name>")`)를 써요. library 상세의 `LIBRARY_DETAIL_READY`(WI-0078 D2-C) 방식이에요. 상세 JSON 없는 slug 를 강제로 넣으면 준비 선택자에서 실패해야 해요 |
| D3 | 콘솔 결과 앱(템플릿으로 만든 앱) UI 자체의 a11y 는 범위 밖이에요(한계로 적음) |

---

## 2. 범위

### 2.1 바꾸는 것

- `apps/web/e2e/a11y-routes.cjs`
  - `templateDetailRoutes()`: index.json 순서대로 상세 JSON 이 있는 템플릿 전부의 `{ path, ready }`. `name` 이 없거나 빈 문자열이면 throw, 0건이면 throw, `TEMPLATE_DETAIL_REQUIRED`(`ontology-console`)가 빠지면 throw
  - `templateDetailReady(name)`: `h1:text-is(<JSON 문자열>)`
  - `listA11yRoutes`: DYNAMIC 규칙이 문자열 · `{ path, ready }` · 그 배열을 돌려줄 수 있음. 빈 배열은 throw. 정렬 · 중복 검사 · 0건 throw 는 그대로
  - 머리 주석 「대표 1개씩」을 library 대표 1개 · templates 상세 전부로 고침
- `apps/web/e2e/a11y.spec.ts`: 머리 주석(18행 경로 범위, 경로 양성 대조의 준비 선택자 설명)만. 검사 로직 변경 없음
- `.github/workflows/frontend.yml`: 193행 · 246행 주석(새 실측 63경로 x 4 = 252). 건수 가드 로직은 바꾸지 않아요(기대 건수를 `a11y-routes.cjs --count` 에서 계산하므로 자동으로 252)
- `docs/workitems/WI-0027-ontology-console-template/`: todo 후속 체크박스의 a11y 부분 완료 표시, release-notes 한계 줄에 WI-0106 해소 메모

### 2.2 바꾸지 않는 것

- 제품 코드(`src/app/templates/[slug]/*`), 템플릿 데이터
- 건수 가드 스크립트, 다른 E2E spec(nontext · demo · tooltip · library · tokens)
- library 동적 라우트 두 개(대표 1개씩 그대로)
- changeset 없음(`@ax/web` 은 private), npm 발행 없음. Pages 배포만 있어요

---

## 3. 수용 기준 (AC)

| AC | 내용 |
|---|---|
| AC1 | `node e2e/a11y-routes.cjs --count` 가 수정 전 59 · 수정 뒤 63(rc 0). 경로 목록 diff 는 templates 상세 4줄 추가뿐 |
| AC2 | templates 상세 5개의 준비 선택자가 각 상세 JSON 의 name 으로 만든 `h1:text-is(...)` |
| AC3 | 설정 단계 throw: ontology-console.json 제거 · 상세 JSON 전부 제거 · name 제거 · 중복 slug 각각 rc 1 과 해당 오류 문구. 무변경 사본은 rc 0 · 63(대조군) |
| AC4 | 정적 빌드 `out/` 에서 E2E a11y 전체가 252건(63 x 4) 통과, 실패 · flaky · skipped 0, 조합마다 63건 |
| AC5 | 음성 대조 ①: ontology-console 상세 HTML 에 대비 위반을 주입한 사본에서 해당 4조합이 axe 위반으로 실패 |
| AC6 | 음성 대조 ②: 상세 JSON 없는 slug(`monet-hero`)를 새 규칙 모양의 준비 선택자로 넣으면 4조합이 준비 선택자에서 실패. 같은 경로를 종전 기본 `h1` 으로 넣으면 통과(종전 구멍 재현) |
| AC7 | `pnpm check-library-links`(scripts/library-reps.test.mjs 포함) rc 0, `@ax/web` type-check · lint `--force`(Cached 0) 통과, git status 에 빌드 생성물 없음 |

---

## 4. 한계

- 콘솔 결과 앱(`axis template init ontology-console` 로 만든 앱) UI 자체의 a11y 는 이 게이트가 재지 않아요(D3). 이 게이트는 문서 사이트의 템플릿 **상세 소개 페이지**만 재요. 결과 앱 axe 측정은 WI-0027 의 로컬 기록(D7)이에요
- 상세 페이지는 Overview 탭만 재요. Files · Setup 탭은 클릭해야 그려지므로 재지 않아요(종전 dashboard 검사와 같음)
- 상세 JSON 이 없는 템플릿 38개(index 43개 중)는 상세 페이지가 404 라 게이트에 넣지 않아요
- 템플릿 상세 JSON 이 늘면 경로 수와 CI 기대 건수가 함께 늘어요(가드는 계산값이라 손으로 고칠 곳은 없음). 실행 시간도 경로당 4건씩 늘어요

---

## 5. 릴리스 영향

- npm 패키지 영향 없음: 바뀌는 곳은 `apps/web/e2e` · `.github/workflows` 주석 · 문서뿐이에요. changeset 없음, Pages 배포만 있어요
