# WI-0078: library 상세 화면 데이터 fetch 경로 E2E 스모크 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0078 | GitHub: #206 | 우선순위: P3 | 상태: Approved (2026-10-25 사용자 결정, project-todo 「배치 6 결정」 권장안 일괄 채택)
> 기준: `main` 3b5ed0f (linked 1.8.0 · cli 1.6.2 · mcp 1.3.5 발행본) | 묶음: 배치 6 (WI-0078 → 0076 → 0074 → 0075 → 0077)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

- library 상세 화면(`/library/<category>/<slug>/`)은 정적 HTML 에 내용이 없어요. 정적 생성 때는 index.json 에서 항목 id 만 넘기고(`apps/web/src/app/library/[category]/[slug]/page.tsx`), 클라이언트가 런타임에 `/library/components/<id>.json` 을 받아 그려요(`_components/component-detail-content.tsx` 의 `fetch`).
- 받기에 실패하면 같은 HTTP 200 페이지 안에 h1 「컴포넌트를 찾을 수 없습니다」를 그려요.
- 기존 a11y E2E 는 준비 판정을 기본 `h1` 로 해서 오류 화면의 h1 도 「준비 완료」로 보고, 위반 0 으로 통과했어요. 데이터 요청 상태나 화면 내용을 단언하는 곳이 없었어요.
- `check-library-links`(CI 「Library link check」)는 public 소스 파일 집합만 봐서, 클라이언트 fetch 경로가 바뀌거나 배포 산출물 `out/` 에서 파일이 빠지는 축은 원리상 볼 수 없어요.

### 1.2 재현 (측정, 수정 전)

| 조건 | 기존 a11y(`--grep library/ui/accordion`, 4조합) | 새 스모크(수정 뒤 spec) |
|---|---|---|
| 정상 `out/` | 4 통과 | 4 통과 |
| `out/` 사본에서 `components/axis-accordion.json` 삭제(데이터 404 · 페이지 200 을 curl 로 확인) | **4 통과**(거짓 초록) | 1 실패(code 대표) · 3 통과 |
| 빌드 chunk 의 fetch 접두를 `/library/component/` 로 바꾼 사본 | 브리프 측정 4 통과(이번에는 READY 변경 뒤라 재지 않음) | 양성 3 모두 실패 |

측정 산출물은 `scratchpad/w6impl/WI-0078/` 에 있어요(로그 · 서버 로그 · 변이 스크립트). 상세는 [testplan.md](./testplan.md).

### 1.3 결정 (2026-10-25 사용자, 권장안 일괄 채택)

| # | 결정 | 근거 |
|---|---|---|
| D1-C | 새 spec `library-detail.spec.ts` + CI step + 건수 가드, 그리고 a11y 의 library 상세 준비 선택자도 좁힌다 | 새 spec 만 하면 a11y 가 오류 화면을 계속 「측정 완료」로 셈하고, READY 만 하면 대표 1경로만 덮여요 |
| D2-B · C | 제품 코드는 고치지 않는다. 스모크는 h1 == JSON name · 기대 URL 응답 200 · 오류 h1 0건 · 설치 명령 · 코드 블록으로 판정하고, a11y READY 는 로드 뒤에만 있는 「설치」 h2 를 쓴다 | 화면에 실제 그려진 값을 JSON 과 대조해 속성만 붙고 내용이 빠진 경우까지 잡아요 |
| D3-A | 대표는 index.json 에서 규칙으로 고르고, 못 고르면 설정 단계에서 throw. a11y-routes.cjs 와 함수 공유 | 손으로 쓴 목록이 낡던 선례(WI-0062 D2) |
| D4-A | spec 안에 page.route 404 주입 자기 검사를 상시 테스트로 둔다(양성 3 + 1 = 4건) | 판정 함수가 퇴화해 늘 통과하는 회귀를 CI 가 매번 잡아요 |

---

## 2. 범위

### 2.1 바꾸는 것

- `apps/web/e2e/library-reps.cjs`(신규): 대표 3종을 index.json · 상세 JSON 에서 규칙으로 고름
  - code: 상세 JSON 에 코드 파일이 있는 첫 항목(측정: `axis-accordion`, `/library/ui/accordion/`)
  - renamed: slug 가 `<source>-` 로 시작하는 첫 항목(측정: `shadcn-accordion`)
  - existing: 코드가 없고 slug 가 그대로이며 앞의 둘과 source 가 다른 첫 항목(측정: `monet-hero-with-image`). 설치 접두 셋이 모두 달라져요
- `apps/web/e2e/library-detail.spec.ts`(신규): 양성 3 + 감지기 자기 검사 1
- `apps/web/e2e/a11y-routes.cjs`: library 상세 대표를 `library-reps.cjs` 의 code 로, 준비 선택자를 `h2:text-is("설치")` 로. DYNAMIC 규칙이 `{ path, ready }` 를 돌려줄 수 있게 함. 경로 수(59)와 경로 목록은 그대로(측정: 수정 전후 library 줄 diff 0)
- `apps/web/package.json`: `test:e2e:library`
- `.github/workflows/frontend.yml`: 「E2E library 상세 스모크 (WI-0078)」 step, 건수 가드 `library:4` 와 describe 별 3 · 1, 실패 산출물 업로드 조건

### 2.2 바꾸지 않는 것

- 제품 코드(`component-detail-content.tsx` 등): D2-B
- `check-library-links`: 판정 축이 달라 보완 관계로 둬요
- templates 상세의 같은 구조(런타임 fetch + h1 준비 판정)는 이 WI 범위 밖이에요(결과에 후보로 보고)

---

## 3. 수용 기준 (AC)

| AC | 내용 |
|---|---|
| AC1 | 정적 빌드 `out/` 에서 대표 3경로 모두: 문서 200, 정확히 `/library/components/<id>.json` 응답 200, h1 이 JSON name 과 같고 오류 h1 0건, 설치 명령이 JSON 에서 계산한 값과 같음, code 대표는 pre 수 == 파일 수 · 파일 경로 표시, 나머지는 「코드가 없습니다.」 1건. 대표가 없으면 설정 단계에서 throw |
| AC2 | 음성 대조(파일 누락): `out/` 사본에서 code 대표 JSON 을 지우면 새 spec 은 code 1건만 실패. 같은 조건에서 수정 전 a11y 는 4 통과(거짓 초록) |
| AC3 | 변이(fetch 경로 drift): chunk 의 fetch 접두를 바꾼 사본에서 양성 3건 모두 실패. 같은 조건에서 `check-library-links` 는 rc 0(축이 다름) |
| AC4 | spec 안 자기 검사: 404 주입이 관측되고(응답 [404]) 오류 화면이 보이며 판정 함수가 실패 문구를 냄 |
| AC5 | CI 배선: step(id e2e-library), 건수 가드 `library:4` · describe 별 3 · 1, 업로드 if. 가드 변이(기대 건수 바꿈 · test 하나 skip)에서 가드 스크립트가 실패 |
| AC6 | 기존 게이트 불변: a11y 236(59 x 4) · nontext 8 · tokens 22 · demo 8 · tooltip 6. READY 를 좁힌 뒤 AC2 조건에서 a11y library 상세 4건이 실패. 좁혀서 새 axe 위반이 드러나면 고치지 않고 보고 |
| AC7 | turbo lint · type-check · build · test 각각 `--force` 통과, frontend.yml run 단계 통과, git status 에 빌드 생성물 없음 |

---

## 4. 릴리스 영향

- npm 패키지 영향 없음: `@ax/web` 은 private 이고 바뀌는 곳은 `apps/web/e2e` · `apps/web/package.json` scripts · `.github/workflows` 뿐이에요. changeset 없음, Pages 배포만 있어요.
