# WI-0082: Select placeholder 색 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-26 | 기준: `main` e2a9725 + 브랜치 `fix/ontology-contrast`(WI-0079 커밋 뒤)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**. 측정 원자료는 작성 세션의 `scratchpad/w79impl/` 에 있어요.

## 1. 수정 전 재현과 새 테스트의 실패 (측정)

| 테스트 | 수정 전 소스 | 수정 후 |
|---|---|---|
| `src/select/select.test.tsx`(처음 4건, 1b 절에서 5건) | **2 실패**: 「data-placeholder 상태에 placeholder 글자색」, 「`placeholder:` 클래스 없음」. 전제 2건(값 없을 때 data-placeholder · 값 고른 상태)은 통과 | 4 통과 |
| E2E `brand-nontext-contrast` ⑤ select-placeholder 행 | **4조합 모두 실패**(「렌더 색 = 대상 변수」 4건, 그 밖의 단언 실패 0). 대비는 진한 글자라 통과 | 4조합 통과 |

## 1b. 검토 뒤 보강: 화살표 대비 (측정, 2026-10-26)

검토에서 「Trigger 전체에 placeholder 색을 주면 화살표 svg(`stroke=currentColor`, `opacity-50`)도 따라가 3:1 아래로 떨어진다」는 지적을 받았어요. E2E ⑤ 에 `select-chevron` 행(화살표 색 x svg opacity 를 Trigger 바탕 위에 합성, 3:1)을 넣고 수정 전 · 후를 쟀어요.

| 조합 | `data-[placeholder]:text-[...]`(Trigger 전체) | span 한정(최종) | 바탕 |
|---|---|---|---|
| 기본 라이트 | #B5B9C0 **실패** | #848485 3.74 | #FFFFFF |
| 기본 다크 | #505561 **실패** | #7F8186 5.16 | #030712 |
| ontology 라이트 | #AFB3B9 **실패** | #888A8C 3.46 | #FFFFFF |
| ontology 다크 | #5A5E65 **실패** | #848689 4.82 | #17191D |

- 최종값은 WI-0082 전(화살표가 본문 색 50%)과 같은 대비예요. placeholder 글자는 그대로 4.83 · 7.93 · 5.78 · 6.92 예요.
- 단위 테스트는 5건이고 수정 전 소스(Trigger 전체 클래스)에서 2건 실패해요.
- 선택자 확인: Tailwind 3.4.19(웹 빌드 CSS)와 Tailwind 4(`@tailwindcss/node` compile) 모두 `.<클래스>[data-placeholder] > span { color: var(--axis-input-text-placeholder) }` 를 만들어요.

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
| `turbo run test --force` | 7/7 통과, Cached 0. ui-react 199(+node 7, select 5건 추가, 검토 뒤 1건 더함) · tokens 568 · agentic-ui 148 · theme 47 · cli 819 · mcp 169 |
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

## 5. 발행본 재측정 (측정, 2026-10-26)

- 대상: npm 발행본 `@axis-ds/ui-react` 1.8.2 · `cli` 1.7.3(같은 발행의 linked 4패키지 1.8.2 · mcp 1.4.3, PR #228 머지 d7ae4a5, Release PR #229 머지 8afc883(사용자 직접 머지라 PR CI 가 붙지 않았고, 머지 뒤 main run 40302973137 CI · Deploy Production success 로 확인), publish run 40302972775, provenance 6/6). 대조 1.8.1.
- 조건: 새 HOME · XDG_CONFIG_HOME 에서 env 주입 없이 `npm view` · `npm pack` · `npm install`(정확 버전) · `next build` · `next start` 를 돌렸어요. 소비자 앱은 Next 15.5.28 + Tailwind 4(quick-start 방식, globals.css 순서 tailwindcss → tw-animate-css → tokens/css/tailwind4 → ui-react/tailwind.css → tokens/css/brands/ontology)이고, lock 의 resolved 가 registry.npmjs.org 의 1.8.2 · 1.8.1 tgz 이며 tokens · ui-react · theme 사본이 각 1개예요. `next build` rc 0, `next start` 200.
- 측정 도구만 레포 본체 apps/web 의 Playwright(Chromium)를 썼어요(소비자 앱 설치 경로에는 들어가지 않음). 브랜드 · 다크는 html 에 `data-brand="ontology"` 와 `.dark` 를 스크립트로 붙여 켰고 ThemeProvider 경로는 재지 않았어요. 대비는 WCAG 2.x 상대 휘도, 반투명 색은 실제 조상 바탕 위에 합성한 값이에요.
- 음성 대조: 같은 스크립트로 1.8.1 소비자 앱을 재서 값이 갈렸어요(측정이 실제로 돌았다는 근거).

| 조합 | 값 없음(1.8.2) | 대비 | 고른 뒤 · defaultValue | 1.8.1 값 없음 |
|---|---|---|---|---|
| ontology 라이트 | #5F6673 = 변수값 | 5.78 | #111418(body 색) | #111418(본문색, 변수값 #9aa1ab 와 다름) |
| ontology 다크 | #9CA3AD = 변수값 | 6.92 | #F1F3F5(body 색) | #F1F3F5(본문색) |
| 기본 라이트 | #6B7280 | 4.83 | 본문색 | #111827(본문색) |
| 기본 다크 | #9CA3AF | 7.93 | 본문색 | #F3F4F6(본문색) |

- 값을 고를 때는 실제로 클릭해 '가' 를 골랐고, 고른 뒤 `data-placeholder` 가 없어지는 것을 확인했어요.
- 기본 브랜드 측정 행에서 1.8.1 과 1.8.2 가 다른 칸은 Select placeholder 하나뿐이고, 기본 브랜드 CSS 는 바뀌지 않았어요(파일 diff rc 0 · 계산 변수 8개 같음). ui-react `dist/select` 빌드가 바뀐 결과라 모든 브랜드에 적용되는 변화이고, 릴리스 노트의 「기본 브랜드에서도 보이는 변화」 문구와 맞아요.
- 판정: 2절 수정 후 값과 발행본 값이 같아요(기본 브랜드 본문색 hex 는 측정한 앱의 body 색이라 문서 사이트 값과 다르지만, 「본문색과 같다」는 판정은 같아요). 불일치 0.
