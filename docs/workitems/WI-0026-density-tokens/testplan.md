# WI-0026: 밀도 토큰 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` 778e1dd + 브랜치 `feat/wi-0026-density-tokens`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 기준선 (측정)

- 기준: npm 배포본 `@axis-ds/ui-react` 1.6.3 + `@axis-ds/tokens` 1.6.2(현재 latest). 설치본 `dist/index.mjs` sha256 e43f00a6… · `variables.css` c8934534…(브리프의 1.6.2 측정과 같은 해시).
- 1.6.2 와 1.6.3 의 대상 8개(button · input · select · toggle · table · card · dialog · sheet) dist 를 `diff -r` 로 비교: 8개 모두 rc 0(같음). 계측 대조로 WI-0071 이 바꾼 skeleton · progress 는 rc 1(다름)이 나왔어요. 그래서 1.6.2 기준 브리프 측정과 1.6.3 기준이 같아요.
- 브리프 작성(a1a32ca) 뒤 main(778e1dd)까지 바뀐 51개 파일 중 `packages/axis-tokens` 와 대상 8개 컴포넌트 디렉터리는 0개예요(`git diff --name-only`, 목록에 ui-react progress · skeleton 이 있어 조회가 살아 있음).

## 2. 측정 하네스

- 앱: `entry.jsx` 가 실제 패키지 컴포넌트를 클라이언트 렌더해요. Select 는 `defaultOpen`, Dialog · Sheet 는 `open` 으로 포털까지 실제로 렌더해요(브리프의 정적 클래스 근사를 대체).
- 번들: esbuild 0.25.0, React 19.1.0. CSS: Tailwind 3.4.17 + tailwindcss-animate 1.0.7, 그 패키지 버전의 preset 과 `variables.css` · `shadcn-compat.css` · `brands/ontology.css`.
- 픽스처: `default`(variables + shadcn), `ontology`(+ ontology.css, `<html data-brand="ontology">`), `varsonly`(variables.css 단독), `varsonly-ontology`, preset 없는 Tailwind 기본 설정, Tailwind 4.1.14(`@import "tailwindcss"` + `tokens/css/tailwind4` + `@source` 번들 + ontology).
- 측정: Playwright 1.61.1 Chromium, 1280x720 · 375x720, `getComputedStyle` 의 height · width · min-width · font-size · border-top-left-radius. Pretendard 는 싣지 않았어요. 표 · 카드 · 팝업 · Dialog 의 높이는 글꼴에 따라 달라 비교에서 뺐어요(글자 · 둥글기는 비교).
- 파일: 스크래치 `wi26/harness/{entry.jsx,build.mjs,measure.cjs,compare.py,cmp_tw4.py}`, 원자료 `wi26/measure-base-1.6.3.json` · `wi26/measure-new.json` · `m-nopreset.json` · `m-noshadcn.json` · `m-tw4.json`.

## 3. AC1 브랜드 미지정 하위 호환 (측정)

| 비교 | 값 수 | 차이 |
|---|---|---|
| 1.6.3 대 이 브랜치, `default` 픽스처, 1280 · 375 | 150 | **0** |

- 1.6.3 값(1280): Button sm · default · lg · icon 32 · 40 · 48 · 40x40px, 글자 12 · 14 · 16 · 14px, 둥글기 6px. Input · Select 트리거 40px · 6px. Toggle 36 · 40 · 44px(최소 너비 같음) · 6px. Table · TableHead · TableCell 14px. Card · Dialog 8px, Sheet 0px, Select 팝업 6px. 375px 의 Dialog 0px.
- 측정이 새 빌드를 봤다는 대조: 같은 실행에서 `ontology` 값이 1.6.3 과 달라졌어요(아래 4).

## 4. AC2 ontology (측정)

| 대상 | 기대 | 측정 |
|---|---|---|
| Button sm · default · lg | 27 · 34 · 42px, 글자 13 · 14 · 15px, 둥글기 8px | 같음 |
| Button icon | 34x34px · 8px | 같음 |
| Input · Select 트리거 | 36px · 6px(Input 글자 14px) | 같음 |
| Toggle sm · default · lg | 36 · 40 · 44px(최소 너비 같음) · 8px | 같음 |
| Table 본문 · TableCell · TableHead | 13.5 · 13.5 · 13px | 같음 |
| Card · Dialog(1280) | 12px | 같음 |
| Dialog(375) · Sheet | 0px | 같음 |
| Select 팝업(대상 밖) | 10px(1.6.3 과 같음) | 같음 |

33항목 불일치 0(`compare.py`). 1.6.3 의 같은 픽스처는 Button 40px · 10px, Input 40px · 10px, Table 14px 였어요.

- Tailwind 4.1 과 Tailwind 3.4 결과 대조: `default` · `ontology` 232값 차이 0(`cmp_tw4.py`).
- preset 없는 Tailwind 3 기본 설정: ontology Button 34px · 8px, Input 36px · 6px, Card 12px(토큰 직접 참조라 preset 과 무관), Select 팝업 6px(Tailwind 기본 `rounded-md`, preset 이 있으면 10px).

## 5. AC5 variables.css 단독 구성 (측정, review 지적)

- `<html>` 계산값 `--axis-radius-control` 이 빈 문자열(guaranteed-invalid)이고, 컴포넌트 둥글기는 fallback 으로 떨어졌어요: Button · Input · Select 트리거 · Toggle 6px, Card · Dialog 8px(1280), 높이 · 글자는 1.6.3 과 같음.
- 1.6.3 의 같은 구성은 대상 7개 모두 0px 였어요. 이 구성에서는 둥글기가 달라져요(PRD 6 R1, 릴리스 노트에 기록).
- `varsonly-ontology`(shadcn 없이 브랜드): Button 34px · 8px, Input 36px · 6px, Card 12px, Select 팝업 10px.
- CI 축: `e2e/dark-tokens.spec.ts` 라이트 테스트가 variables.css 단독에서 빈 값이 정확히 이 3개뿐인지, shadcn-compat.css 를 더하면 `calc(0.5rem - 2px)` · `calc(0.5rem - 2px)` · `0.5rem` 인지 단언해요.

## 6. 단위 · 정적 검사 (측정)

| 대상 | 결과 |
|---|---|
| tokens 전체(node --test) | 283 통과(종전 281 + 2). `baseline-1.2.1`: 신규 변수 15개 기본값 단언, var() 허용은 둥글기 3개 이름에만(변이 단위 테스트 5종). `brands`: ontology 밀도 15개가 FR-4 표와 같고 라이트에만 있음, U18 초안 대조는 이 15개만 제외 |
| ui-react 전체(vitest) | 151 통과(11파일) + `fix-cva-dts.test.mjs` 7 통과. 새 `density.test.ts` 25건: AC3 패턴 대조(양성 7개 검출 · 음성 `max-h-96` `h-4` `h-3.5` `h-px` 미검출) · 대상 4개 고정 크기 0 · 참조 20건 이상 · fallback 15종이 tokens 기본값과 같음 · 대상 밖 파일(Sheet 포함) 참조 0 |
| 그 밖의 패키지 | agentic-ui 95 · theme 31 · cli 707 · mcp 139 통과 |

### 6.1 변이 (측정)

| 변이 | 결과 | 원복 |
|---|---|---|
| ontology `control.h.md` 34px → 35px | `brands` 「WI-0026: 밀도 값이 FR-4 표와 같고」 실패 | 통과 |
| Button default 에 `h-10` 추가 + fallback 2.4rem | AC3(button) · `--axis-control-h-md` fallback 정합 2건 실패 | 통과 |
| Card fallback 0.5rem → 0.375rem, Sheet 닫기 버튼에 surface 참조 추가 | surface fallback 정합 · 대상 밖 파일 2건 실패 | 통과 |

## 7. 게이트 (측정)

| 명령 | 결과 |
|---|---|
| `pnpm exec turbo run type-check lint test build --force` | 1회차 28 tasks 성공 · Cached 0. 테스트 파일 수정 뒤 2회차는 `@ax/web#type-check` 가 TS6053(`.next/types/*` 없음)로 실패했어요. 앞 빌드가 남긴 `.next` 를 같은 실행의 `next build` 가 다시 쓰는 동안 tsc 가 읽은 경합이고, 단독 `pnpm --filter @ax/web type-check` 는 rc 0 이에요. 그래서 `type-check lint test --force`(24/24, Cached 0)와 `build --force`(8/8, Cached 0)로 나눠 다시 통과시켰어요. CI 는 깨끗한 checkout 에서 type-check 를 build 앞 단계로 돌려 이 경합이 없어요(추정) |
| `pnpm check-token-refs` | 위반 0(참조 571 · 정의 303 · 판정 불가 0) |
| `check-contrast-pairs` · `check-types-versions` · `check-library-links` · `test:registry` · `check-licenses` | 모두 rc 0 |
| `pnpm build:registry` | 30항목, 갱신 5개(button · input · select · card · dialog). `index.json` · `registry.json` 의 `version` 은 1.5.0 유지(WI-0052 선례) |
| `pnpm library:refresh-axis` | 7개 컴포넌트 파일 + `categories/ui.json` 갱신, 재실행 쓰기 0 |
| `pnpm pack-smoke` · `cli-smoke` · `registry-install-smoke` | rc 0(퍼블리시 대상 6개 · cli OK · 대표 5/5 통과) |
| E2E static(a11y · nontext · demo · tokens) | 40 · 8 · 8 · 22 통과, skipped 0(CI 건수 가드와 같음) |
| 템플릿 churn(`public/templates` updatedAt 5개) | 되돌림 |

- E2E demo 는 `SHAPE_EXPECTED` 에 Button 높이 · Input 높이 · Input 둥글기를 더했어요(기본 40 · 40 · 6px, ontology 34 · 36 · 6px, Button 둥글기 ontology 10 → 8px). 테스트 수는 그대로예요.

## 8. 남은 측정

- 배포 뒤 npm 1.7.0 발행본으로 3 · 4 절을 다시 재요(이번 측정은 로컬 빌드).
- Pretendard 를 실은 화면에서 표 셀 높이 · 카드 높이(글꼴 의존 값)는 재지 않았어요.
