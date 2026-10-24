# WI-0064 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 기준: main 59dd6a3

## 1. 측정 근거 (문서 서술의 출처)

모두 npm 1.6.0 배포본(tokens · theme · ui-react · agentic-ui)을 스크래치 프로젝트에 설치해 Playwright Chromium 에서 `getComputedStyle` 로 잰 값이에요. 레포 파일은 바꾸지 않았어요.

| 서술 | 구성 | 결과 |
|---|---|---|
| Tailwind 3 preset · css/shadcn | Next 15.5.28 + tailwindcss 3.4.17, 컴포넌트는 `axis add` 복사본. A1 preset 없음 / A2 preset · css/shadcn 없음 / A3 둘 다(`@import` 3줄 → `@tailwind` 3줄) | Button 둥글기 · 글꼴: A1 켬 6px · `ui-sans-serif`, A2 끔 0px, A3 켬 10px · 끔 6px · Pretendard 스택 |
| Tailwind 3 테두리색 | A3 의 Next 빌드 산출 CSS 규칙 순서 | `*{border-color:hsl(var(--border))}` 21904번째 문자, preflight `border:0 solid #e5e7eb` 33452번째. 브라우저 계산값은 재지 않음 |
| Tailwind 4 컴포넌트 tailwind.css | Vite + tailwindcss 4. A: tailwindcss · tailwind4 · 브랜드 3줄 / B: 컴포넌트 tailwind.css 2줄 추가 | A: 변수 #326ada, Button 바탕 `rgba(0,0,0,0)` · 둥글기 0px · PlanCard 왼쪽 선 0px. B: rgb(50,106,218) · 10px · 1px |
| defaultBrand 해제 | Vite + Tailwind 3 + ThemeProvider. E: `defaultBrand="ontology"` 에서 끔 → 새로고침 / F: defaultBrand 없이 켬 · 끔 → 새로고침 반복 | E reload#1 brand ontology(저장값 null). F 마지막 선택 유지(reload#3 brand null) |
| `.dark` 하위 요소 | 같은 앱, `<div data-brand><div class=dark>` 와 대조 요소 | 하위 요소 Button 바탕 #2563EB = `.dark` 만 둔 대조와 같음. `<div class=dark><div data-brand>` 는 #6B98F0 |
| 깜빡임 | 같은 앱 빌드를 python 정적 서버로, chromium-1234, 10회 × (스크립트 없음 / 인라인 스크립트) × CPU 1배 · 4배 | 스크립트 없음: `data-brand` FCP 전 10/10, FCP 시점 Button background-color 전환 진행 6/10(1배 · 4배 모두). 인라인 스크립트: 전환 0/9(1배, FCP 미수집 1회) · 0/10(4배). 처음 측정(chromium-1243 · vite preview)은 3/10 이고 그 브라우저가 없어 같은 조건 재현은 못 했어요 |
| PlanCard 새 변수 | 1.6.0 tgz `dist/css/brands/ontology.css` | 라이트 reject-text #C8332E · approve-bg #2A2F36 · approve-hover-bg #111418, 다크 #F07A72 · #D0D4D9 · #F1F3F5. 같은 파일의 `status-error` · `status-success` · `status-success-strong` 과 같음 |
| 변수 개수 | 이 브랜치에서 tokens 빌드(`turbo run build --force`, Cached 0) 뒤 `variables.css` 블록별 `--이름:` 계수 | `:root` 263 · `.dark` 263. 1.6.0 tgz 도 줄 계수 526 |
| `@font-face` | 위 빌드의 `dist/css` 4개 파일(variables · shadcn-compat · tailwind4 · brands/ontology) | 0건씩. 양성 대조: 같은 grep 이 `pretendard` 패키지 dynamic-subset CSS 에서 92건 |

측정하지 않은 것: Tailwind 4 진입점 구성의 `.dark` 하위 요소(추정으로 표시), Next App Router 의 인라인 스크립트, 인라인 스크립트 예시 자체(측정 스크립트에서 저장값 없음 대체값 `"ontology"` 만 뺀 형태), quick-start 의 `import animate from "tailwindcss-animate"` ESM 형태 빌드.

## 2. 자동 테스트

docs/guides 만 바꾸면 frontend CI 가 돌지 않을 수 있어(paths 필터에 docs 없음) 로컬에서 돌렸어요.

| 대상 | 명령 | 결과 |
|---|---|---|
| 기준선(수정 전) | `pnpm exec vitest run src/guidance.test.ts src/init/init.test.ts` (packages/axis-cli) | 2파일 134/134, rc 0 |
| 수정 후 | 같은 명령 | 2파일 134/134, rc 0 |
| cli 전체 | `pnpm test` (packages/axis-cli) | 17파일 662/662, rc 0 |

빌드: `turbo run build --filter=@axis-ds/cli... --filter=@axis-ds/tokens --force` rc 0, 2 tasks Cached 0. 빌드 뒤 `git status` 변경 0건(public/templates 등 생성물 변화 없음).

**양성 대조(두 테스트가 이 문서를 실제로 읽는지)**

| 주입 | 결과 |
|---|---|
| theme-customization.md 끝에 `npx axis-cli theme add ontology` 한 줄 | guidance.test 1건 실패(「docs/guides … 위반 0건」), rc 1 |
| quick-start 「Tailwind CSS 4」 지울 블록의 `@media (prefers-color-scheme: dark)` 를 `@media screen` 으로 | init.test 1건 실패(「이름 충돌 안내는 quick-start 「Tailwind CSS 4」 절의 지울 블록 · 이름과 같음」), rc 1 |
| (참고) 같은 블록에서 `--font-mono` 줄 삭제 | init.test 통과. 이름은 같은 절 산문에도 있어 이 테스트는 블록 머리와 이름 존재만 대조해요 |

주입 뒤 두 파일을 백업본으로 되돌리고 sha256 이 주입 전과 같음을 확인했어요(`sha256sum -c` OK 2건).

## 3. 문서 점검

| 항목 | 방법 | 결과 |
|---|---|---|
| U+2014 | 변경 3파일 + WI 문서에서 문자 계수 | 0건 |
| 표 안의 파이프 | 파이프로 시작하는 표 행에서 연속 파이프 2개를 검색(코드 안 파이프는 표를 깨므로) | 0건 |
| 상대 링크 | `./quick-start.md` · `./theme-customization.md` 는 같은 docs/guides 디렉터리 | 파일 실재 |
| 외부 링크 | WI-0068 이슈 #182 | 이슈 번호는 project-todo 80행 · wi-mapping 과 같음 |

## 4. 검토 지적 반영 (I6, 2026-10-24)

| 항목 | 방법 | 결과 |
|---|---|---|
| 지적 근거 | `packages/axis-theme/src/index.ts` 브랜드 초기값(111-112행)과 브랜드 effect(127-133행) 읽기 | 저장값 · `defaultBrand` 가 모두 없으면 `undefined`, effect 가 `removeAttribute("data-brand")`. 코드 확인(브라우저 측정 아님) |
| 남은 「둘 중 하나」 서술 | `docs/guides` 에서 `data-brand` · `defaultBrand` 를 담은 행 전수 확인 | quick-start 156행 · theme-customization 빠른 시작 2번 · 첫 화면 처방 첫 항목 · 사용자 브랜드 절 적용 문장(「`<html data-brand="acme">`나 `defaultBrand`」) 4곳을 고침. 용도별 표 · 「Provider 없이 적용」 절의 Provider 병용 항목은 이미 Provider 유무를 갈라 그대로 둠 |
| 자동 테스트 | 2절과 같은 명령 재실행 | 아래 결과 |


| 대상 | 명령 | 결과 |
|---|---|---|
| guidance · init | `pnpm exec vitest run src/guidance.test.ts src/init/init.test.ts` (packages/axis-cli) | 2파일 134/134, rc 0 |
| 양성 대조 | theme-customization.md 끝에 `npx axis-cli theme add ontology` 한 줄 주입 뒤 guidance.test | rc 1(이 문서를 실제로 읽음). 백업본으로 되돌리고 `sha256sum -c` OK |
| cli 전체 | `pnpm test` (packages/axis-cli) | 662/662, rc 0 |
| U+2014 | 변경 4파일에서 문자 계수 | 0건 |
