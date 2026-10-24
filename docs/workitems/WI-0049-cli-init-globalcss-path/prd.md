# WI-0049: axis init 의 경로 기본값이 실제 프로젝트 구조와 다름 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0049 | GitHub: #140 | 우선순위: P3 | 상태: Approved (2026-10-24 배치 2 결정 반영)
> 기준: `main` 59dd6a3 (cli 1.5.4) | 묶음: 배치 2 묶음 ③(WI-0037 · WI-0041 · WI-0049 · WI-0065)

---

## 1. 개요

### 1.1 문제 (측정, 2026-10-24)

- src 없는 Next(Tailwind 3) 프로젝트에서 `axis init -y` 가 `globalCss` 를 없는 경로 `./src/app/globals.css` 로 기록하고, `src/components/ui/utils.ts` 를 만들어 없던 `src/` 가 생겨요(부수 결함, 결정 대기 목록에 있던 것)
- 같은 부류(브리프에서 새로 찾음): `tailwind.config.js` 만 있는 프로젝트에 `tailwindConfig` 를 `./tailwind.config.ts` 로 기록해요
- Tailwind 4 의 src 없는 프로젝트에서 안내 제목에 없는 경로 `./src/app/globals.css` 가 나와요
- `axis check` · `theme add` 는 후보 탐색이라 판정은 맞지만, 후보 목록이 brand-core 두 사본(styles/ 없음)과 init 기본값에 따로 있었어요

### 1.2 결정 (2026-10-24 사용자, 브리프 권장안 + 반박 검토 반영)

| # | 결정 |
|---|---|
| D6 | 실재 파일 탐색 + src 유무. `componentsDir` 는 `src/` 가 있으면 `./src/components/ui`, 없으면 `./components/ui`. `globalCss` 는 실재 후보(`app/globals.css` · `src/app/globals.css` · `styles/globals.css` · `src/styles/globals.css` · `globals.css`) 가운데 첫 파일, `tailwindConfig` 는 실재하는 `tailwind.config.{ts,js,mjs,cjs}` 가운데 첫 파일. 찾지 못하면 기본값(src 유무별)을 기록하고 안내해요. `-y` · 대화형 초기값 · Tailwind 4 안내 제목이 같은 값을 써요 |
| D6-후보 | 반박 검토 반영: 후보 상수를 `@axis-ds/registry-core/project` 한 곳(`GLOBAL_CSS_CANDIDATES` · `TAILWIND_CONFIG_CANDIDATES`)에 두고 brand-core 두 사본이 import 해요. 바이트 사본 일치 테스트(mcp `brand-core.test.ts`)는 그대로예요. theme add · check 의 brand 항목도 같은 후보(styles/ 두 개 추가)를 보게 돼요 |
| D6-범위 | check 의 Tailwind 4 · globals.css 항목 후보(`TAILWIND_CSS_CANDIDATES`, 루트 globals.css 가 먼저)는 기존 판정 순서를 바꾸지 않으려고 그대로 둬요 |
| 릴리스 | `@axis-ds/cli` minor · `@axis-ds/mcp` patch(brand-core 사본 · registry-core 번들, WI-0065 D9) |

## 2. 수용 기준

- AC1 src 없는 Tailwind 3 프로젝트(app/globals.css · tailwind.config.js): config 에 `./components/ui` · `./app/globals.css` · `./tailwind.config.js`, `src/` 를 만들지 않음, 경고 없음
- AC2 src 가 있으면 종전 기본값(음성 대조)
- AC3 globalCss 후보 순서 5단계, Tailwind 4 는 tailwindConfig 를 정하지 않음
- AC4 Tailwind 4 안내 제목이 실재 경로(`./app/globals.css`)
- AC5 찾지 못하면 기본값을 기록하고 1줄씩 안내
