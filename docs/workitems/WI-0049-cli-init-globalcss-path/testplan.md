# WI-0049 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24

## 1. 단위 테스트 (`packages/axis-cli/src/init/init.test.ts`)

| 테스트 | 결과 |
|---|---|
| AC7 기준값(c131ee9) 2건: 빈 디렉터리 config 는 componentsDir · globalCss 만 src 없는 값(`./components/ui` · `./app/globals.css`)으로 다르고, 안내 2줄(전역 CSS · Tailwind 설정을 찾지 못함)과 애니메이션 안내 1줄(WI-0065)이 더해짐. 생기는 파일은 `axis.config.json` · `components/ui/utils.ts` 둘뿐(`src/` 없음) | 통과 |
| src 없는 Tailwind 3(app/globals.css · tailwind.config.js) → 찾은 값 기록, `src/` 없음, 안내 없음 | 통과 |
| 음성 대조: src/ 가 있으면 `INIT_DEFAULTS`(종전 값) 그대로 | 통과 |
| 후보 5단계 순서 | 통과 |
| Tailwind 4: tailwindConfig 미결정, 안내는 전역 CSS 1줄 | 통과 |
| 「Tailwind 4 연동 안내(WI-0044 FR-3)」 describe 의 안내 제목 기대값이 `./app/globals.css`(src 없는 임시 디렉터리, 종전 기대 `./src/app/globals.css` 는 없는 경로였음) | 통과 |
| utils.ts 쓰기 · 링크 · 하드링크 규칙 테스트들이 src 없는 위치(`components/ui`)에서 그대로 통과 | 통과 |

## 2. 변이 (A/B)

| 변이 | init.test.ts 결과 |
|---|---|
| componentsDir 기본값을 `./src/components/ui` 로 고정(종전 동작) | 21건 실패 |

## 3. 실측 (ontology 경로 A, WI-0065 testplan 2절)

src 없는 Next 15.5.28 + Tailwind 3.4.19 프로젝트에 빌드한 cli 로 `init -y` 를 돌리면 config 에 `./components/ui` · `./tailwind.config.ts`(실재) · `./app/globals.css`(실재) 가 기록되고 「찾지 못해」 안내가 없었어요(측정). 같은 프로젝트에 cli 1.5.4 코드(main 59dd6a3 빌드)는 `./src/components/ui` · `./src/app/globals.css` 를 기록하고 `src/components/ui/utils.ts` 를 만들었어요(측정, 음성 대조).

## CI 스모크 정합(2026-10-25)

- 첫 PR CI 에서 `pnpm cli-smoke`(scripts/cli-bundled-smoke.mjs) 3건 실패: 스모크가 종전 기본값 `src/components/ui` 를 박아 두어, src 없는 임시 프로젝트에서 init 이 이제 `./components/ui` 를 기록하자 설치 파일을 찾지 못함(의도된 동작 변경, 회귀 아님)
- 처방: 스모크가 init 이 실제로 쓴 `axis.config.json` 의 componentsDir · agenticDir 를 읽도록 바꿈(add.ts 와 같은 형제 agentic 규칙). 로컬 `pnpm cli-smoke` rc 0, ✓ 21건
- 구현 단계 게이트 목록에 cli-smoke 가 빠져 있었음. scripts/ · .github/workflows 의 `src/components` 하드코딩 전수 grep 0건
