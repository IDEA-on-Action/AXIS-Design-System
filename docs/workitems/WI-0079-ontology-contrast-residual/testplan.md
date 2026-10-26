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
| Progress warning / 트랙 | #C8332E | #EAECEF 4.47 | 4.94 · 5.29 · 4.81 | 3 | 통과 |
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
| Progress warning / 트랙 | #F07A72 | #2A2E34 5.02 | 7.01 · 6.48 · 5.87 | 3 | 통과 |
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

## 5. 생성물

- `library:refresh-axis`: 추가 0 · 변경 0 · 유지 48(값만 바뀌는 변경이라 library 사본 내용 변화 없음)
- `build:registry`: `r/index.json` · `r/registry.json` 의 version 1.5.0 → 1.8.1 만 바뀌어 되돌렸어요(항목 내용 변화 없음)
- `apps/web/public/templates/*.json`: 빌드가 바꾼 `updatedAt` 만이라 되돌렸어요
- mcp 동봉 토큰 데이터 `dist/data/tokens.json`: ontology 색 #C8332E 0건, 기본 #2563EB 13건(양성 대조)이라 brand 값을 담지 않아 바뀌지 않아요
