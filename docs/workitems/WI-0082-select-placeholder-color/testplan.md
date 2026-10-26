# WI-0082: Select placeholder 색 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-26 | 기준: `main` e2a9725 + 브랜치 `fix/ontology-contrast`(WI-0079 커밋 뒤)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**. 측정 원자료는 작성 세션의 `scratchpad/w79impl/` 에 있어요.

## 1. 수정 전 재현과 새 테스트의 실패 (측정)

| 테스트 | 수정 전 소스 | 수정 후 |
|---|---|---|
| `src/select/select.test.tsx`(4건) | **2 실패**: 「data-placeholder 상태에 placeholder 글자색」, 「`placeholder:` 클래스 없음」. 전제 2건(값 없을 때 data-placeholder · 값 고른 상태)은 통과 | 4 통과 |
| E2E `brand-nontext-contrast` ⑤ select-placeholder 행 | **4조합 모두 실패**(「렌더 색 = 대상 변수」 4건, 그 밖의 단언 실패 0). 대비는 진한 글자라 통과 | 4조합 통과 |

## 2. 브라우저 실측 (측정: Chromium 계산값, `/components/select/` 첫 Trigger)

| 조합 | 값 없음: 수정 전 → 후 | 입력 바탕 대비(후) | 옵션 고른 뒤: 수정 전 · 후 |
|---|---|---|---|
| 기본 라이트 | #09090B → #6B7280 | 4.83 | #09090B · #09090B |
| 기본 다크 | #FAFAFA → #9CA3AF | 7.93 | #FAFAFA · #FAFAFA |
| ontology 라이트 | #111418 → #5F6673 | 5.78 | #111418 · #111418 |
| ontology 다크 | #F1F3F5 → #9CA3AD | 6.92 | #F1F3F5 · #F1F3F5 |

- 수정 후 placeholder 글자 색은 4조합 모두 `--axis-input-text-placeholder` 의 렌더 색과 같아요(측정 스크립트의 `placeholder변수일치=true`, 수정 전 false).
- 음성 대조: 측정 스크립트에서 Select 를 뺀 나머지 48행(브랜드 2 x 테마 2 x 12행)은 WI-0079 빌드와 같아요(`diff` 0줄). 스크린샷 6페이지 x 2테마 x 2브랜드 24장 가운데 달라진 것은 Select 페이지 4장뿐이고 나머지 20장은 바이트 단위로 같아요.

## 3. 게이트 (측정, 최종 상태)

| 단계 | 결과 |
|---|---|
| `pnpm lint --force` · `pnpm type-check --force` · `pnpm build --force` | 통과, Cached 0(7 · 11 · 8 tasks) |
| `turbo run test --force` | 7/7 통과, Cached 0. ui-react 198(+node 7, select 4건 추가) · tokens 568 · agentic-ui 148 · theme 47 · cli 819 · mcp 169 |
| check-token-refs | 첫 실행에서 새 테스트 주석의 변수 이름이 「판정 불가 1」로 잡혀 실패, 주석을 고친 뒤 위반 0 |
| check-contrast-pairs · check-types-versions · check-changeset-mcp-tokens · check-library-links | 통과 |
| build:registry · test:registry(45) · check-licenses | 통과 |
| pack-smoke · cli-smoke · registry-install-smoke | 통과 |
| E2E(정적 빌드, CI=1): a11y 236 · nontext 12 · demo 8 · tooltip 6 · library 4 | 266 통과 |
| E2E tokens | 22 통과 |

## 4. 생성물

- `library:refresh-axis`: 파일 쓰기 4개(axis-select · ui 카테고리 · index · meta)
- `build:registry`: `r/select.json` 내용과 `r/index.json` · `r/registry.json` 의 select sha256 만 바뀌고, version 1.8.1 은 1.5.0 으로 되돌렸어요
- 템플릿 `updatedAt` 은 되돌렸어요
