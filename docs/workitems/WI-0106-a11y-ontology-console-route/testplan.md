# WI-0106: a11y 게이트 템플릿 상세 경로 확대 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #270 | 측정일: 2026-11-01 | 브랜치 `wi-0106-a11y-template-routes`(main 71f0c62 기준)
> 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/batch12/WI-0106/`(`ci.0v3V/` 본 실행 · `neg.b9YK/` 음성 대조 · `setup.*/` 설정 단계 대조 · `guard-a11y.sh` 가드 재현 · `old-list.txt` · `new-list.txt`)
> 서버: E2E 는 정적 빌드 `out/`(`pnpm turbo run build --filter=@ax/web... --force`, rc 0, Cached 0 / 5). 빌드가 바꾼 `public/templates/*.json` 6개는 `updatedAt` 만 바뀌어 되돌렸어요

## 1. 경로 목록 (AC1 · AC2)

| 항목 | 수정 전 | 수정 뒤 |
|---|---|---|
| `node e2e/a11y-routes.cjs --count` | rc 0 · 59 | rc 0 · 63 |
| 경로 목록 diff(`old-list.txt` 대 `new-list.txt`) | - | rc 1, `/templates/hr-dashboard/` · `/templates/landing-page/` · `/templates/ontology-console/` · `/templates/theme-only/` 4줄 추가뿐(삭제 0) |
| 기대 건수(계산) | 59 x 4 = 236 | 63 x 4 = 252 |

수정 뒤 템플릿 상세 준비 선택자(측정, `listA11yRoutes()`):

| 경로 | 준비 선택자 |
|---|---|
| /templates/dashboard/ | `h1:text-is("Dashboard")` |
| /templates/hr-dashboard/ | `h1:text-is("HR Dashboard")` |
| /templates/landing-page/ | `h1:text-is("Landing Page")` |
| /templates/ontology-console/ | `h1:text-is("Ontology Console")` |
| /templates/theme-only/ | `h1:text-is("Theme Only")` |

library 두 라우트는 그대로(`/library/ui/` 는 `h1`, `/library/ui/accordion/` 는 `h2:text-is("설치")`).

## 2. 설정 단계 대조 (AC3)

`e2e/a11y-routes.cjs` · `library-reps.cjs` · `src/` · `public/templates` · `public/library` 를 scratchpad 사본(`setup.*`)에 복사해 데이터만 바꿨어요.

| 조건 | rc | 출력 |
|---|---|---|
| 대조군: 무변경 사본 | 0 | 63 |
| `ontology-console.json` 제거 | 1 | 「templates 상세 목록에 ontology-console 가 없어요」 |
| 상세 JSON 5개 전부 제거 | 1 | 「templates/index.json 에 상세 JSON 이 있는 템플릿이 없어요」 |
| `theme-only.json` 의 name 제거 | 1 | 「templates/theme-only.json 에 name 이 없어요」 |
| index.json 에 dashboard 항목 하나 더 | 1 | 「같은 주소가 두 번 나왔어요: /templates/dashboard/」(종전 중복 검사 유지) |

## 3. E2E a11y 전체 (AC4)

명령(apps/web): `CI=1 E2E_SERVER=static PLAYWRIGHT_JSON_OUTPUT_NAME=<ci.0v3V>/a11y.json pnpm exec playwright test e2e/a11y.spec.ts --reporter=list,json`(CI 와 같은 static 서버 3101, workers 1, retries 1)

| 항목 | 값 |
|---|---|
| rc | 0 |
| stats | expected 252 · unexpected 0 · flaky 0 · skipped 0, 19.4분 |
| 조합별 건수 | default/light 63 · default/dark 63 · ontology/light 63 · ontology/dark 63 |
| 템플릿 상세 5경로 x 4조합 | 20건 모두 통과, 위반 합 0, axe passes 최소 21(측정이 수행됨) |
| 가드 재현(`guard-a11y.sh`, frontend.yml 건수 가드의 a11y 부분과 같은 식) | rc 0, 기대 252 · 실행 252, 조합마다 63 |
| 가드 음성 대조: `--count` 를 64 로 속인 사본 | rc 1, 「기대 256 실행 252」 · 조합마다 「63건 (기대 64건)」 |

참고: 처음 낸 실행(`full.*`)은 `--workers=4` 였고, 워크트리 경로에 `a11y` 가 들어 있어 `playwright test a11y` 의 파일 필터가 다른 spec 까지 잡았어요(CI 경로에는 해당 없음). 그 실행의 a11y.spec 은 242 통과 · 10 flaky(전부 정적 서버 부하로 인한 30초 타임아웃, 템플릿 상세는 0건)였고 판정 근거로 쓰지 않았어요. 위 표는 a11y.spec 만, CI 와 같은 workers 1 로 다시 낸 값이에요.

## 4. 음성 대조 (AC5 · AC6)

같은 spec 을 scratchpad 사본(`neg.b9YK/`)에서 돌렸어요. `e2e/a11y-routes.cjs` 는 워크트리의 실제 모듈을 불러 템플릿 상세만 고르는 래퍼, 서버는 `out/` 사본(3196 포트, 끝난 뒤 리슨 0 확인).

### 4.1 axe 위반 주입 (AC5)

| 조건 | 결과 |
|---|---|
| `out/templates/ontology-console/index.html` 의 `</head>` 앞에 `h1{color:#777777;background:#888888}` 스타일 주입 | rc 1, 4조합 모두 실패. 오류 「a11y 위반(<조합>): color-contrast」, 「insufficient color contrast of 1.26」 |
| 원본으로 되돌림(`cmp` 같음) | rc 0, 4조합 통과 |

### 4.2 상세 JSON 없는 slug (AC6)

`/templates/monet-hero/`(index.json 에 있고 상세 JSON 없음)는 정적 서버가 200 으로 404 화면을 내요.

아래 표의 앞 두 줄(`neg.b9YK/`)은 래퍼가 선택자 문자열을 직접 만들어 넣은 대조예요(`templateDetailReady` 와 같은 형식, 운영 규칙은 상세 JSON 이 없는 이 slug 를 내지 않음). 그래서 「같은 모양의 선택자가 404 화면에서 실패한다」까지만 보여요. 운영 코드가 실제로 그 선택자를 낸다는 것은 셋째 줄(`negop.NiDp/`)에서 따로 확인했어요. 이 사본은 `a11y-routes.cjs` · `library-reps.cjs` 를 그대로 복사하고(`cmp` 같음) 그 옆 `public/templates/` 사본에만 `monet-hero.json`(index 의 slug · name 만)을 더했고, 서버가 내는 `out/` 에는 상세 JSON 이 없어요. 래퍼는 운영 `listA11yRoutes()` 결과에서 그 경로를 고르기만 하고 선택자는 만들지 않아요.

| 준비 선택자 | 결과 |
|---|---|
| 래퍼가 만든 새 규칙 모양 `h1:text-is("Monet Hero Sections")`(index 의 name) | rc 1, 4조합 모두 「locator.waitFor: Test timeout of 30000ms exceeded」(`waiting for locator('h1:text-is("Monet Hero Sections")')`) |
| 종전 기본 `h1` | rc 1, default 2조합 **통과**(404 화면을 재고 위반 0, 종전 구멍), ontology 2조합은 준비 선택자가 아니라 브랜드 양성 대조(`data-brand` Expected "ontology" Received null)에서 실패 |
| 운영 규칙이 낸 선택자(`readySelector` = `h1:text-is("Monet Hero Sections")`, `negop.NiDp/monet.log`) | rc 1, 4조합 모두 「locator.waitFor: Test timeout of 30000ms exceeded」(`waiting for locator('h1:text-is("Monet Hero Sections")')`) |
| 같은 사본 · 같은 래퍼의 양성 대조: ontology-console(상세 JSON 있음, `negop.NiDp/oc.log`) | rc 0, 4 passed |

## 5. 그 밖의 검사 (AC7)

| 명령 | 결과 |
|---|---|
| `pnpm check-library-links`(check-library-links.test.mjs · library-reps.test.mjs 포함) | rc 0, tests 28 · pass 28 · fail 0 |
| `pnpm turbo run type-check lint --filter=@ax/web --force` | rc 0, 6 successful, Cached 0 / 6, ESLint 경고 · 오류 없음 |
| `git status --short`(커밋 전) | 바꾼 파일 5개 + WI-0106 문서 폴더뿐, 빌드 생성물 없음 |
