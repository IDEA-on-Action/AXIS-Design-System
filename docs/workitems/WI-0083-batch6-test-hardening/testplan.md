# WI-0083: library 대표 선택 · TW3 preset dist 진입점 테스트 보강 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #212 | 측정일: 2026-10-26 | 브랜치 `test/wi-0083`(main 6d455f7 기준, 격리 worktree)
> 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w6bimpl/WI-0083/`
> (스크립트 `scripts/repro-head.sh` · `neg-head.sh` · `mut-reps.sh` · `mut-tokens.sh` · `mut-tokens-head.sh` · `gates.sh` · `browser-tw4.sh`, 결과 `repro-head.txt` · `neg-head.log` · `mut-reps.txt` · `mut-tokens.txt` · `mut-tokens-head.txt` · `gates/` · `e2e-*.log` · `browser-tw4.txt`)
> 변이는 모두 scratchpad 사본에서 했고 워킹트리 파일은 고치지 않았어요.

## 1. 수정 전 재현 (6d455f7, `repro-head.txt`)

| 조건(apps/web 사본) | 결과 |
|---|---|
| 원본 | `--count` rc 0 · 59, 대표 axis-accordion · shadcn-accordion · monet-hero-with-image, 상세 JSON 읽기 listA11yRoutes 258 · pickLibraryReps 129, check-library-links rc 0 |
| 비대표 마지막 `axis-tool-call-card.json` 삭제 | `--count` rc 1 ENOENT, check-library-links rc 1 「components/axis-tool-call-card.json 이 없습니다」 |
| `shadcn-accordion` 에 코드 파일 주입 | rc 0, code = renamed = shadcn-accordion |
| `shadcn-accordion` 의 code 삭제 | library-reps rc 1 TypeError, check-library-links rc 0 · 위반 0건 |
| 비대표의 `code.files[0].path = 1` · `registryDeps = 'x'` | `--count` rc 0 · 59, check-library-links rc 0 · 위반 0건 |

## 2. library 새 테스트 (AC1 ~ AC5)

`scripts/library-reps.test.mjs` 18건 + `scripts/check-library-links.test.mjs` 10건 = 28건. `pnpm check-library-links` 에서 28/28 통과(`gates/check-library-links.log`, 0.63초).

| 측정 | 결과 |
|---|---|
| 새 테스트 x 수정 전 소스(`neg-head.sh`) | rc 1, 28 중 **20 실패**: code 모양 7 · 읽기 횟수 2 · 대표 결손 메시지 6 · 코드 유무 단언 2 · 같은 항목 3. 통과 8 은 원본 데이터 대표 · 계측 대조 · 수정 전에도 성립하는 판정(파일 결손 · devDependencies) · publicDir 를 무시하는 수정 전 코드가 원본을 읽어 우연히 통과한 3건(비대표 결손 2 · renamed 코드 주입 1, 수정 전 실패는 1절 사본 재현과 변이 M-a 로 대신 보임) |
| M-a 전체 읽기로 되돌림 | rc 1, 10 실패(읽기 횟수 2 · 비대표 결손 2 · 대표 결손 6) |
| M-b 같은 항목 검사 제거 | rc 1, 2 실패(code=renamed · 같은 상세 주소) |
| M-c check-library-links code 모양 판정 제거 | rc 1, 7 실패 |
| M-d a11y-routes 메모이즈 제거 | rc 1, 1 실패(a11y 읽기 3회) |
| M-e 대표 결손 메시지 제거(ENOENT 그대로) | rc 1, 3 실패 |
| 원본 데이터 | 대표 3개 그대로, `--count` 59, a11y 경로 목록 59줄 수정 전후 diff rc 0, 상세 JSON 읽기 pickLibraryReps 3 · listA11yRoutes 3 |

변이 실패는 `node --test` rc 1 이고, 루트 스크립트는 `node scripts/check-library-links.mjs && node --test ...` 라 그 rc 가 CI 단계 rc 가 돼요.

## 3. tokens dist 진입점 (AC6 · AC7)

`cjs-preset.test.mjs` 15 → 23건(+8: build 스크립트 순서 1 · 진입점 3 x 2 · 후처리 전 음성 대조 1). 변이는 패키지 사본(src · scripts · test · package.json, node_modules 는 링크)에서 빌드 파이프라인 소스만 바꿨어요(`mut-tokens.sh`, dist 직접 편집 없음).

| 변이(바꾼 곳 · diff 줄) | 새 테스트(cjs-preset + tw3, 29건) | 수정 전 테스트(21건, `mut-tokens-head.txt`) |
|---|---|---|
| 무변이 | 29/29 | - |
| M1 후처리가 .mjs DEFAULT 삭제(`scripts/cjs-preset.mjs`, 1줄) | 1 실패: import(.mjs) borderColor · preflight | 21/21 통과(공백) |
| M2 footer 가 CJS borderColor 삭제(`scripts/cjs-preset.mjs`, 1줄) | 2 실패: require(.js) · require(.js).default borderColor · preflight | 21/21 통과(공백) |
| M3 borderColor 를 theme 직속으로(`src/tailwind-preset.ts`, 6줄) | 5 실패: 진입점 3개 border-red-500 단언(preflight 단언은 통과) + tw3 src 2 | 2 실패(src 만, dist 는 못 잡음) |
| M4 build 스크립트에서 `node scripts/cjs-preset.mjs` 삭제(`package.json`, 2줄) | 7 실패: build 순서 · CJS 형태 3 · require 결과 · 재실행 · require(.js) borderColor | - |

단독 실행 `node --test test/cjs-preset.test.mjs` 23/23, 10.7초(종전 약 5.5초). dist 판독은 빌드 직후 `before` 에서 한 번 해요(「다시 실행」 테스트가 fixed dist 에 후처리를 다시 돌려 순서에 묶이던 것을 M4 에서 발견해 고침).

## 4. 게이트 (`gates/summary.txt`)

| 단계 | 결과 |
|---|---|
| `turbo run lint --force` | rc 0, 7 successful, Cached 0 |
| `turbo run type-check --force` | rc 0, 11 successful, Cached 0 |
| `turbo run build --force` | rc 0, 8 successful, Cached 0 |
| `turbo run test --force` | rc 0, 7 successful, Cached 0. tokens 530/530(HEAD 522 + 8), cli 781 · mcp 166 · ui-react 194 + 7 · agentic-ui 148 · theme 47 |
| check-token-refs | rc 0, 정의 누락 0 |
| check-contrast-pairs | rc 0, 위반 0건 |
| check-types-versions | rc 0, 8/8 |
| check-changeset-mcp-tokens | rc 0, 8/8 |
| check-library-links | rc 0, 위반 0건 · 컴포넌트 파일 129개 검사, node --test 28/28 |
| build:registry | rc 0, 30개 항목 (뒤에 r/index.json · registry.json version 1.8.1 → 1.5.0 되돌림) |
| test:registry | rc 0, 45/45 |
| check-licenses | rc 0, 라이선스 검증 통과 |
| pack-smoke | rc 0, OK |
| cli-smoke | rc 0, OK |
| registry-install-smoke | rc 0, g2 5/5 통과 |
| E2E library (`E2E_SERVER=static`, workers 1) | 4 passed |
| E2E a11y (`E2E_SERVER=static`, workers 1) | 236 passed(59 x 4), frontend.yml 기대값 그대로 |

빌드가 바꾼 templates JSON 5개(updatedAt 만)와 r/ 2개(version 만)는 되돌렸어요.

## 5. TW4 무영향 · 브라우저 1회 기록 (AC8, `browser-tw4.txt`)

- `packages/axis-tokens/dist` 15개 파일 sha256 이 수정 전(6d455f7 `--force` 빌드)과 수정 후(`--force` 빌드) 같음(cmp rc 0). `dist/css`: tailwind4.css 73236368f1a9 · variables.css ab5e38602750 · shadcn-compat.css 95b3f78f15db · brands/ontology.css 93ec9fa27857(앞 12자).
- `tailwind4.test.mjs` 24/24(파일 변경 없음, `git diff --stat 6d455f7 -- packages/axis-tokens` 는 테스트 2개만).
- TW3 브라우저(Chromium 1234, 정적 HTML 에 quick-start 순서로 variables · shadcn-compat · ontology CSS 를 `@tailwind` 앞에 두고 색 없는 border · border-t · hr 3탐침 x 4상태 = 12칸, tailwindcss 3.4.19): 워크트리 빌드 dist esm 0/12 · cjs 0/12, border-red-500 4/4. 음성 대조 발행본 1.8.0 esm · cjs 9/12, 1.8.1 0/12. 브리프 측정 · WI-0077 testplan 7절과 같은 값.
- TW4 4.3.3(`@tailwindcss/postcss` 4.3.3): 문서 경로 T0(`@import "@axis-ds/tokens/css/tailwind4"`) sha 6553d3fdeca4, 레거시 `@config` 경로 TC 3e03345d016f 로 워크트리 빌드와 1.8.0 이 같음.
- 도구는 브리프 측정의 Playwright · Chromium 경로를 빌렸고, Next 빌드 경로가 아닌 최소 재현이에요.

## 6. 발행 영향

changeset 없음. tokens `files` 는 `["dist"]` 이고 dist 바이트가 같아요(5절). 나머지 바뀐 파일(apps/web/e2e · scripts · 루트 package.json · frontend.yml · docs)은 발행 패키지 밖이에요. check-changeset-mcp-tokens 통과.

## 7. 검토 반영 (2026-10-26, minor 3건)

| 지적 | 판정 | 조치 · 측정 |
|------|------|-------------|
| check-library-links.test 의 `symlinkSync` 에 type 이 없어 Windows 로컬에서 EPERM 가능 | 맞음 | 디렉터리는 `'junction'`, 파일(_headers · favicon.svg · manifest.json · schema.json)은 복사로 바꿈. WSL 에서 28/28. Windows 실행은 미검증 |
| VICTIM 을 `axis-tool-call-card` 로 박음 | 맞음 | index 에서 「대표가 아니면서 code.files 가 1개 이상인 마지막 항목」을 고르고 없으면 원인 문구로 멈춤. 지금 데이터에서 고른 값은 axis-tool-call-card(종전과 같음). 변이 V1(조건을 `> 99999` 로) 에서 「코드 파일이 있는 항목이 없어요」 1건으로 실패(ENOENT 아님) |
| cjs-preset.test 의 tsup 인자 공백 분할 · 후처리 단계 재현 범위 | 맞음(현재 동작은 정상) | makeConsumer 가 빌드 전에 따옴표 · 이스케이프를 막고, build 스크립트 테스트가 단계 목록 전체(build-tokens · tsup · cjs-preset)를 단언. 변이 V2(build 끝에 `node scripts/extra.mjs` 추가)는 「build 단계가 바뀌었어요」 1건 실패(22 pass), V3(tsup 인자에 작은따옴표)는 빌드 전에 「따옴표 · 이스케이프」 문구로 멈춤. 기준 23/23. 「사본 dist」라는 점은 파일 머리말 14행에 이미 적혀 있어 문구는 그대로 둠 |

재게이트: turbo lint 7 · type-check 11 · build 8 · test 7(tokens 530 pass) 모두 `--force` Cached 0 rc 0. frontend.yml 단계 11개 rc 0(check-library-links 28/28). 생성물 r/ 2개(version) · templates 5개(updatedAt) 되돌림. 바뀐 파일이 테스트 2개뿐이고 E2E 가 읽는 코드(apps/web/e2e)는 그대로라 E2E 는 다시 돌리지 않았어요.
