# WI-0064: 브랜드 테마 가이드 현행화 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0064 | GitHub: #174 | 우선순위: P2 | 상태: Approved (2026-10-24 결정 반영)
> 기준: `main` 59dd6a3 (tokens · theme 1.6.0, cli 1.5.4)
> 관련: 배치 2 묶음 ④. 묶음 ②(WI-0046, quick-start Tailwind 4 절 애니메이션 안내) · ③(WI-0037 · 0041 · 0049 · 0065, cli theme add · check)와 같은 파일을 고칩니다. 분리된 후속: WI-0068(#182, defaultBrand 해제 저장)

---

## 1. 개요

### 1.1 문제 (실측, 2026-10-24)

1.6.0 배포본으로 새 프로젝트 3개(Next 15.5 + Tailwind 3, Vite + Tailwind 4, Vite + Tailwind 3 · ThemeProvider)를 만들고 브라우저 계산 스타일로 브랜드 적용을 쟀어요. 가이드만 따르면 브랜드가 적용되지 않거나 서술이 사실과 다른 곳이 있었어요.

| # | 위치 | 서술 | 실측 |
|---|---|---|---|
| P1 | theme-customization 4절 「개념」 | 브랜드 미지정이면 `variables.css` 249개 값은 1.2.1 과 같다 | 1.6.0 은 `:root` · `.dark` 각 263개(빌드 산출물 블록별 계수). 1.6.0(WI-0029)에서 값 11개 변경 · PlanCard 변수 3개 추가 |
| P2 | 4절 「import 순서」 Tailwind 4 블록 | 3줄(tailwindcss · tailwind4 · 브랜드) | 컴포넌트 `tailwind.css` 가 없으면 변수는 #326ada 인데 Button 바탕 `rgba(0,0,0,0)` · 둥글기 0px · PlanCard 왼쪽 선 0px. 넣으면 rgb(50,106,218) · 10px · 1px |
| P3 | quick-start 「Tailwind CSS 3」 · tokens README 「Tailwind CSS 3 Preset」 | preset 없음(quick-start), `css/shadcn` 안내 없음(둘 다), `@import` 가 `@tailwind` 뒤(quick-start) | preset 없음(A1): 브랜드 켬에도 둥글기 6px · `ui-sans-serif`. preset 있고 `css/shadcn` 없음(A2): 브랜드 끔 둥글기 0px. 둘 다(A3): 켬 10px · 끔 6px |
| P4 | 4절 「브랜드 적용」 | `defaultBrand` · `setBrand(undefined)` 의 상호작용 서술 없음 | `defaultBrand` 가 있으면 끈 뒤 새로고침 시 다시 ontology. 없으면 끈 상태 유지(theme `index.ts` `readBrand(key) ?? defaultBrand`) |
| P5 | 4절 「선택자와 다크 모드」 | `[data-brand]` 아래 `.dark` 하위 요소는 「걸리지 않는다, E2E 미측정」 | 그 요소 아래 Button 바탕이 기본 다크(#2563EB, `.dark` 만 둔 대조와 같음). 브랜드가 통째로 꺼짐 |
| P6 | 4절 「Provider 없이 적용 · 첫 화면」 | 첫 페인트는 기본 브랜드 | `data-brand` 는 FCP 전 10/10. 깜빡임은 기본값으로 계산된 스타일이 `transition-colors` 로 브랜드 색으로 넘어가는 것(FCP 시점 전환 6/10, 인라인 스크립트 시 0) |
| P7 | 4절 ontology 절 | PlanCard 새 변수 3개 값 없음, Pretendard 로드 안내 없음 | ontology 라이트 #C8332E · #2A2F36 · #111418, 다크 #F07A72 · #D0D4D9 · #F1F3F5. tokens dist CSS 4개의 `@font-face` 0건 |
| P8 | quick-start | 브랜드 적용 안내 없음 | 확인 |

측정 원자료: 스크래치 `brand/`(cli-next-tw3 · tw4-vite · provider-runtime)와 `b2-4-brand-guide/`(fouc 재측정 10회 × 4조건). 측정 조건은 testplan 1절에 있어요.

### 1.2 결정 (2026-10-24 사용자, 모든 항목 권장안 + 반박 검토 major 지적 반영)

| # | 결정 |
|---|---|
| D1 | theme-customization 4절 맨 앞에 「브랜드 적용 빠른 시작」(Tailwind 4/3 별 CSS · preset · 브랜드 켜기 · 글꼴 체크리스트 + 함정 요약)을 두고, 기존 하위 절은 사실관계만 정정해요. 새 문서는 만들지 않아요(INDEX 동기화 불필요) |
| D2 | quick-start 3절 아래에 「브랜드 적용(선택)」 하위 단계를 넣고, Tailwind 3 절을 고쳐요. 번호 체계는 그대로예요. **반박 반영**: quick-start Tailwind 3 코드 블록(presets · css/shadcn · plugins)의 최종 형태는 이 WI 가 맡아요. ② WI-0046 은 Tailwind 4 절의 플러그인 안내만 고쳐요 |
| D3 | `.dark` 하위 요소: 「지원하지 않음 · 브랜드가 꺼지고 기본 다크(실측)」로 정정하고 우회 2가지를 적어요. Tailwind 4 진입점 구성은 추정으로 표시해요 |
| D4 | `defaultBrand` 해제 한계를 명시하고(용도별 표, WI-0068 링크), theme 코드 수정은 WI-0068(#182)로 분리해요 |
| D5 | 깜빡임 메커니즘을 정정하고 인라인 스크립트 예시를 넣어요. 예시는 저장값이 없을 때 ontology 를 넣는 대체값(`\|\| "ontology"`)을 쓰지 않아 D4 의 해제 풀림을 되풀이하지 않아요. 비율은 고정값 대신 조건별로 적어요 |
| D6 | Pretendard 안내와 tokens README Tailwind 3 Preset 절의 `css/shadcn` 안내를 함께 넣어요 |
| D7 | 수동 적용 경로는 지금 쓰고, `npx @axis-ds/cli theme add` 가 해 주는 일 단락은 ③ 머지 뒤 rebase 해서 확정한 다음 PR 1개로 머지해요. **반박 반영**: 확정 대상에 ③ 이 정할 import 삽입 순서(Tailwind 3 에서 tokens/css · css/shadcn · 브랜드 순서와 `@tailwind` 대비 위치)와 theme add 가 출력하는 Provider 예시 형태(defaultBrand 사용 여부)를 더해요 |
| D8 | changeset 없음(문서만). tokens README 는 다음 tokens 발행 때 npm 에 반영돼요 |

### 1.3 구현하며 정한 것 (사용자 결정 아님, 검토 대상)

| # | 내용 | 근거 |
|---|---|---|
| I1 | quick-start Tailwind 3 블록의 `plugins` 는 `[animate]`(`tailwindcss-animate`) 로 쓰고 「필요 없으면 뺀다」를 붙였어요 | ② WI-0046 권장안 (a)(tw3 는 tailwindcss-animate, 측정 30/33)와 같은 플러그인이에요. 블록 소유가 이 WI 라 ② 의 결론을 여기서 옮겨요. ② 가 다른 플러그인을 고르면 rebase 때 바꿔요 |
| I2 | Tailwind 3 CSS 는 `@import` 3줄을 `@tailwind` 앞에 둬요 | 측정 구성 A3 의 순서이고, CSS 규칙상 `@import` 는 다른 규칙보다 앞이어야 해요. 종전 quick-start 는 `@tailwind` 뒤였어요 |
| I3 | Tailwind 3 의 색 없는 `border` 는 gray-200 이라고 적었어요(quick-start · README 의 Tailwind 4 비교 문장 괄호도 같은 내용으로 정정) | A3 의 Next 빌드 산출 CSS 에서 `css/shadcn` 의 `*{border-color:hsl(var(--border))}`(21904번째 문자) 뒤에 preflight `*,:after,:before{...border:0 solid #e5e7eb}`(33452번째)가 와요. 브라우저 계산값은 재지 않았어요 |
| I4 | quick-start Tailwind 3 블록에서 `darkMode: "class"` 를 뺐어요 | preset 이 `darkMode: ["class"]` 를 정해요(`tailwind-preset.ts` 4행) |
| I5 | cli 서술 자리에는 가이드 안에 HTML 주석 TODO 를 두었어요(화면에 보이지 않음) | rebase 때 확정할 위치와 확인 항목 3개를 파일 안에 남기려는 것이에요 |
| I6 | 브랜드 켜기 안내를 「`ThemeProvider` 를 쓰면 `defaultBrand`(첫 화면용 마크업 속성은 함께), Provider 없이 쓸 때만 마크업 속성 단독」으로 나눴어요(quick-start 3절 2단계, theme-customization 빠른 시작 2번 · 첫 화면 처방 첫 항목 · 사용자 브랜드 적용 문장) | 검토 지적(major). `ThemeProvider` 는 브랜드가 `undefined` 이면 마운트 때 `data-brand` 를 지워요(`packages/axis-theme/src/index.ts` 브랜드 effect 의 `removeAttribute`, 초기값은 저장값, 없으면 `defaultBrand`, 둘 다 없으면 `undefined`). 코드로 확인했고 이 조합을 브라우저로 재지는 않았어요 |

## 2. 요구사항

- FR-1 theme-customization 4절에 「브랜드 적용 빠른 시작」 체크리스트(Tailwind 4 CSS · Tailwind 3 preset · css/shadcn · 브랜드 켜기 · Pretendard · 함정 3개)
- FR-2 4절 사실 정정: P1(263개 · 1.6.0 변경), P2(Tailwind 4 블록에 컴포넌트 tailwind.css), P5(`.dark` 하위 요소), P6(깜빡임 메커니즘 · 인라인 스크립트), P7(PlanCard 변수 3개)
- FR-3 `defaultBrand` 해제 한계 · 용도별 설정 표 · WI-0068 링크(P4)
- FR-4 quick-start: Tailwind 3 블록(preset · css/shadcn · plugins · `@import` 순서), 3절 「브랜드 적용(선택)」(P3 · P8)
- FR-5 tokens README Tailwind 3 Preset 절: css/shadcn · 브랜드 켜기 · 글꼴 안내(P3 · P7)
- FR-6 (③ 머지 뒤) cli theme add 단락 확정(D7)

## 3. 수용 기준

| AC | 내용 |
|---|---|
| AC1 | P1~P8 의 각 서술이 실측과 맞고, 측정하지 않은 것은 추정 · 미측정으로 표시됨 |
| AC2 | 인라인 스크립트 예시가 저장값이 없을 때 브랜드를 붙이지 않음(D4 한계를 되풀이하지 않음) |
| AC3 | `pnpm --filter @axis-ds/cli exec vitest run src/guidance.test.ts src/init/init.test.ts` 통과, 두 테스트가 이 문서를 실제로 읽는다는 양성 대조(변이 주입 시 실패) |
| AC4 | 변경 파일에 U+2014 0건, `npx axis-cli` 형식 0건(guidance.test) |
| AC5 | FR-6: ③ 머지 뒤 theme add 의 import 순서 · Provider 예시가 가이드 서술과 일치 |

## 4. 범위 밖

- defaultBrand 해제 저장(theme 코드) → WI-0068(#182)
- `[data-brand] .dark` 선택자 추가(tokens) → 등록하지 않음(D3 권장안은 비지원 명시 + 우회)
- 템플릿의 브랜드 적용 → WI-0067(#181)
- 브랜드 대비 결함 → WI-0062(#170)
- 문서 사이트(apps/web)에 가이드 페이지 신설: 없음(가이드 md 가 유일한 원본, /docs Getting Started 에 브랜드 절 없음 확인)
