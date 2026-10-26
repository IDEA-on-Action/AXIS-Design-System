# WI-0079: ontology 남은 대비 미달 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-26 | 기준: `main` e2a9725 + 브랜치 `fix/ontology-contrast`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(토큰 값에서 유도) · **추정**(실행하지 않음)
> 측정 원자료는 작성 세션의 임시 디렉터리 `scratchpad/w79impl/` 에 있어요(레포에는 옮기지 않았고, 값은 아래 표에 옮겨 적었어요).

## 1. 수정 전 재현과 새 테스트의 실패 (측정)

| 테스트 | 수정 전 값(main 토큰) | 수정 후 |
|---|---|---|
| `ontology-values.test` | **19 실패**: WI-0079 값 3테스트 + 짝 대비 16칸(placeholder 라이트, 경계 · 트랙 x card · panel · 페이지 x 2테마 12칸, 흰 썸 라이트, Progress success · warning 라이트) | 통과 |
| `brands.test` | **2 실패**: 초안 대조(placeholder 예외), WI-0063 · WI-0079 팔레트 값 | 통과 |
| `default-contrast.test` | 통과(기본 브랜드는 수정 전에도 3:1 · 4.5:1, 옮긴 13행 x 2테마 포함 198 통과) | 통과 |
| E2E `brand-nontext-contrast` ⑤ 폼 컨트롤 | **ontology 라이트 · 다크 2건 실패(soft 단언 44개)**, 기본 2건 통과. 「렌더 색 = 대상 변수」 단언 실패 0(엉뚱한 요소를 잰 것이 아님) | 4건 통과 |

- 수정 전 E2E 는 main 정적 빌드(`apps/web/out`, 토큰 수정 전)에 새 spec 을 그대로 돌렸어요.

## 2. 브라우저 실측 (측정: Chromium 계산값, 정적 빌드 문서 컴포넌트 페이지, `scratchpad/w79impl/measure2.mjs`)

바탕: 실제 = 요소 뒤 불투명 바탕 합성, bg = `--background`, card = `--axis-surface-default`, panel = `--axis-surface-secondary`.

### 2.1 ontology 라이트

| 대상 | 색 | 실제 바탕 | bg · card · panel | 기준 | 판정 |
|---|---|---|---|---|---|
| Checkbox · Radio · Textarea 경계 | #6B7280 | #F7F7F7 4.51 | 4.51 · 4.83 · 4.39 | 3 | 통과 |
| Switch 꺼짐 · Slider 트랙 | #6B7280 | #F7F7F7 4.51 | 4.51 · 4.83 · 4.39 | 3 | 통과 |
| Switch 흰 썸 / 트랙 | #FFFFFF | #6B7280 4.83 | - | 3 | 통과 |
| Progress success / 트랙 | #2A2F36 | #EAECEF 11.39 | 12.58 · 13.48 · 12.25 | 3 | 통과 |
| Progress warning / 트랙 (4b 결정 전 값) | #C8332E | #EAECEF 4.47 | 4.94 · 5.29 · 4.81 | 3 | 통과 |
| Progress destructive / 트랙 | #A8281F | #EAECEF 5.94 | 6.56 · 7.03 · 6.39 | 3 | 통과 |
| Progress default / 트랙 (바꾸지 않음) | #326ADA | #EAECEF 4.21 | - | 3 | 통과 |
| Input placeholder | #5F6673 | #FFFFFF 5.78 | 5.39 · 5.78 · 5.25 | 4.5 | 통과 |
| (예외) Input 테두리 | #D6DADF | #F7F7F7 1.31 | 1.31 · 1.40 · 1.28 | - | 수정 전과 같음 |

### 2.2 ontology 다크

| 대상 | 색 | 실제 바탕 | bg · card · panel | 기준 | 판정 |
|---|---|---|---|---|---|
| Checkbox · Radio · Textarea 경계 | #7A828D | #0E1013 4.90 | 4.90 · 4.53 · 4.11 | 3 | 통과 |
| Switch 꺼짐 · Slider 트랙 | #7A828D | #0E1013 4.90 | 4.90 · 4.53 · 4.11 | 3 | 통과 |
| Switch 흰 썸 / 트랙 | #FFFFFF | #7A828D 3.89 | - | 3 | 통과 |
| Progress success / 트랙 | #D0D4D9 | #2A2E34 9.16 | 12.79 · 11.82 · 10.71 | 3 | 통과 |
| Progress warning / 트랙 (4b 결정 전 값) | #F07A72 | #2A2E34 5.02 | 7.01 · 6.48 · 5.87 | 3 | 통과 |
| Progress destructive / 트랙 | #F49890 | #2A2E34 6.33 | 8.84 · 8.16 · 7.40 | 3 | 통과 |
| Input placeholder | #9CA3AD | #17191D 6.92 | 7.49 · 6.92 · 6.27 | 4.5 | 통과 |
| (예외) Input 테두리 | #5F6874 | #0E1013 3.37 | 3.37 · 3.12 · 2.83 | - | 수정 전과 같음 |

- 수정 전 값은 PRD 1.2 표와 같아요(같은 스크립트, `base.txt`). 확인 문서(design-review.md) 5절의 계산값과 소수 둘째 자리까지 같아요.

### 2.3 기본 브랜드 음성 대조

- 측정값: 기본 라이트 · 다크 26행(위 대상 + Select placeholder)이 수정 전 · 후 한 글자도 다르지 않아요(`diff` 0줄).
- 스크린샷: 기본 브랜드 컴포넌트 페이지 8개 x 2테마 16장, 따로 찍은 Checkbox · Progress · Input · Select · Button · 브랜드 데모 6페이지 x 2테마 12장이 수정 전 · 후 **바이트 단위로 같아요**.
- 양성 대조: 같은 방법으로 찍은 ontology 스크린샷은 Checkbox · Progress · Input · 브랜드 데모 8장이 **달라졌고**, 값이 바뀌지 않은 Button · Select 4장은 같았어요(비교가 변화를 잡고, 같은 빌드에서 결정적임).
- tokens dist: 수정 전 백업과 `diff -r` 하면 `css/brands/ontology.css` 한 파일, 24줄(12값 x 라이트 · 다크 블록)만 달라요. `variables.css` · `shadcn-compat.css` · `js` · `json` 은 같아요.

## 3. 단위 · 패키지 테스트 (측정)

| 대상 | 결과 |
|---|---|
| `turbo run test --force` | 7/7 성공, Cached 0. tokens 568 · ui-react 194(+node 7) · agentic-ui 148 · theme 47 · cli 819 · mcp 169 |
| tokens 짝 표 | `CONTRAST_PAIRS` 69 → 82행. 공용 표로 옮긴 7변수가 표에 있는지, 페이지 바탕 짝 2개인지 단언 |

- 한 번은 mcp 169 중 7개가 「원격 레지스트리 version 1.8.1」로 실패했어요. 게이트 스크립트에서 `build:registry` 가 `r/` version 을 1.8.1 로 바꾼 뒤 테스트를 다시 돌린 순서 탓이에요(CI 는 test 가 build:registry 보다 먼저). `r/` 를 1.5.0 으로 되돌린 뒤 같은 명령은 통과했어요.

## 4. 게이트 (측정)

| 단계 | 결과 |
|---|---|
| `pnpm lint --force` | 통과, 7 tasks · Cached 0 |
| `pnpm type-check --force` | 통과, 11 tasks · Cached 0 |
| `pnpm build --force` | 통과, 8 tasks · Cached 0 |
| check-token-refs · check-contrast-pairs · check-types-versions · check-changeset-mcp-tokens · check-library-links | 통과 |
| build:registry · test:registry · check-licenses | 통과 |
| pack-smoke · cli-smoke · registry-install-smoke | 통과 |
| E2E(정적 빌드, CI=1): a11y 236(59경로 x 4조합, a11y-routes.cjs) · nontext 12 · demo 8 · tooltip 6 · library 4 | 266 통과 |
| E2E tokens | 22 통과 |

- frontend.yml 건수 가드: nontext 8 → 12, describe 별 「nontext form controls (브랜드/테마)」 1건씩을 더했어요.

## 4b. 검토 뒤 결정: Progress warning 을 노랑으로 (계산 · 측정, 2026-10-26)

검토에서 빨강 두 단계(warning `bad` 대 destructive `bad-dark`)의 구분이 약하다는 지적을 받았고, 사용자 결정으로 warning 만 AXIS 원시색 노랑(라이트 `{color.yellow.700}` #A16207 · 다크 `{color.yellow.500}` #EAB308)으로 바꿨어요. destructive · success 는 그대로예요.

**warning 대 destructive 의 구분 (계산: 상대휘도 대비 · HSV 색상 각도 차)**

| 짝 | 라이트 휘도 대비 · 색상 차 | 다크 휘도 대비 · 색상 차 |
|---|---|---|
| 이번 값 노랑 대 `bad-dark` | #A16207 / #A8281F 1.43 · 31.5도 | #EAB308 / #F49890 1.12 · 40.6도 |
| 직전 값 `bad` 대 `bad-dark` | #C8332E / #A8281F 1.33 · 2.0도 | #F07A72 / #F49890 1.26 · 1.0도 |
| 발행본 1.8.1 yellow-500 대 red-500 | #EAB308 / #EF4444 1.96 · 45.4도 | 같음 |

- 색상(hue)으로는 노랑과 빨강이 30~40도 갈라져 직전(1~2도)보다 뚜렷해요. 휘도 대비는 라이트 1.43(직전 1.33)으로 조금 늘고 다크 1.12(직전 1.26)로 줄었어요. 다크는 밝기가 비슷한 노랑 · 분홍이라 적록 색각 이상에서는 구분이 약할 수 있어 상태 이름을 글자로 함께 보여 주는 안내는 그대로예요.
- 계산 스크립트: `scratchpad/w79fu/calc.py`(결과 `calc.txt`).

**트랙 위 대비 (측정: 정적 빌드 Chromium 계산값, `scratchpad/w79fu/afterfu.txt`)**

| 테마 | warning 색 | 트랙 위 | bg · card · panel |
|---|---|---|---|
| 라이트 | #A16207 | #EAECEF 4.16 | 4.60 · 4.92 · 4.47 |
| 다크 | #EAB308 | #2A2E34 7.12 | 9.93 · 9.18 · 8.32 |

- 직전 측정(`scratchpad/w79impl/after82.txt`)과 `diff` 하면 ontology 라이트 · 다크 Progress warning 2행만 달라요. 기본 브랜드 26행과 ontology 나머지 행은 같아요(음성 대조). 바뀐 2행은 측정이 변화를 잡는다는 양성 대조예요.
- 단위 테스트 변이: ontology 라이트 warning 을 `#C8332E` 로 되돌리면 `ontology-values`(WI-0079 Progress 테스트)와 `brands.test`(WI0063_SAME 대조) 2건이 실패하고, 되돌린 뒤 통과해요.
- 「hex 는 v1 팔레트 안에서만」 테스트는 hex 리터럴만 보므로 원시색 참조는 예외 목록 없이 통과해요(1.8.0 의 green · yellow-500 참조와 같은 방식). 대신 `ontology-values` 가 소스의 참조 문자열(`{color.yellow.700}` · `{color.yellow.500}`)과 풀린 hex 를 직접 단언해요.

**이번 반영의 게이트 (측정, 2026-10-26, main 6617869 병합 뒤)**

| 단계 | 결과 |
|---|---|
| `pnpm lint --force` · `type-check --force` · `build --force` · `turbo run test --force` | 7 · 11 · 8 · 7 tasks 성공, 모두 Cached 0. tokens 568 · ui-react 199 · agentic-ui 148 · theme 47 · cli 873 · mcp 181 |
| check-token-refs · check-contrast-pairs · check-types-versions · check-changeset-mcp-tokens(tokens 1 · mcp 1 · cli 1, registry-core 변경 0) · check-library-links | 통과 |
| build:registry · test:registry · check-licenses · pack-smoke(퍼블리시 대상 6개) · cli-smoke · registry-install-smoke 5/5 | 통과 |
| E2E(정적 빌드, CI=1): a11y 236(a11y-routes.cjs 59경로 x 4조합) · nontext 12 · demo 8 · tooltip 6 · library 4 · tokens 22 | 모두 통과, 실패 · 건너뜀 0 |
| `changeset status` | tokens · theme · ui-react · agentic-ui 1.8.2 · cli 1.7.3 · mcp 1.4.3 |

## 5. 생성물

- `library:refresh-axis`: 추가 0 · 변경 0 · 유지 48(값만 바뀌는 변경이라 library 사본 내용 변화 없음)
- `build:registry`: `r/index.json` · `r/registry.json` 의 version 1.5.0 → 1.8.1 만 바뀌어 되돌렸어요(항목 내용 변화 없음)
- `apps/web/public/templates/*.json`: 빌드가 바꾼 `updatedAt` 만이라 되돌렸어요
- mcp 동봉 토큰 데이터 `dist/data/tokens.json`: ontology 색 #C8332E 0건, 기본 #2563EB 13건(양성 대조)이라 brand 값을 담지 않아 바뀌지 않아요
