# WI-0111: turbo test 빌드 의존 PRD

> 작성일: 2026-11-02 | 버전: v1.0 | WI: WI-0111 | GitHub: #286 | 상태: 진행 중
> 상위: project-todo 124(WI-0108 측정 · WI-0109 재관찰) | 기준: `main` a2504cc
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음)

## 1. 배경(조사 워크플로 2026-11-02, 레포 사본에서 측정)

- 루트 `turbo.json` 의 `test` 는 `dependsOn` 이 없어요. 패키지 turbo.json 은 mcp 만 `test` 에 `["^build"]` 를 걸었어요. 그래서 한 번의 turbo 호출 안에서 test 와 build 의 순서를 정해 주는 것이 없어요.
- tsup 8.5.1 은 JS 를 빌드 시작 때 지우고, d.ts 는 DTS 단계 끝(rollup buildStart)에 지워요. 그래서 빌드 끝 무렵 약 1.7초(무부하) ~ 5초(부하) 동안 d.ts 가 0개예요(측정). 빌드 한 번 동안 ui-react 산출물 테스트를 반복하면 165 ~ 174회 중 19 ~ 23회가 「d.ts 0개」로 실패했어요(측정).
- 빌드를 그 구간에서 끊으면 d.ts 0 · js 68 dist 가 남고, `turbo run test --filter=@axis-ds/ui-react --concurrency=1` 도 실패해요. turbo 가 실패 뒤 막 시작한 build 를 중단시켜 같은 상태가 다시 남아요(측정, WI-0109 재관찰과 같음).
- 레포 dist 를 읽는 테스트(grep 전수 96파일, 측정): ui-react `scripts/fix-cva-dts.test.mjs`(자기 dist), ui-react `progress` · `reduced-motion` · `density` 와 agentic-ui `reduced-motion`(tokens dist), agentic-ui 테스트 전체(ui-react dist, 없으면 12개 파일 중 11개 실패), tokens `baseline-1.2.1` · `default-contrast` · `ontology-values`(자기 dist), mcp `tokens-sync`(tokens dist, 이미 `^build`).
- DTS 단계 중간에 끊긴 「세대 혼합」 dist(JS 는 postbuild 전 새 빌드본, d.ts 는 이전 빌드본)에서는 산출물 테스트가 통과해요(거짓 통과, 측정).
- CI(`frontend.yml`)는 lint → type-check(^build) → test → build 를 단계별로 나눠 돌려 이 경합이 생기지 않아요. 최근 frontend run 300개에서 Test step 실패 0건이에요(측정). 이 문제는 로컬에서 여러 작업을 한 turbo 호출로 묶을 때 생겨요.

## 2. 사용자 결정(2026-11-02)

| ID | 결정 |
|---|---|
| D1 | 패키지별 turbo.json 으로 레포 dist 를 읽는 test 에만 build 의존을 걸어요: ui-react `["^build", "build"]`, agentic-ui `["^build"]`, tokens `["build"]`(mcp 선례). 루트 turbo.json 은 바꾸지 않아요 |
| D2 | ui-react 산출물 검사(fix-cva-dts `--check`)를 test 에서 build 스크립트 끝으로 옮겨요(설계 3b). 불완전한 빌드는 build 단계에서 실패해요. test 는 dist 상태에 따라 결과가 갈리지 않아요. 대신 turbo 를 거치지 않고 직접 돌리는 test 는 남은 불완전 dist 를 더는 잡지 않아요(의도한 교환, testplan 에 잃는 보증으로 기록) |
| D3 | cli 시간 한도 테스트(500ms · 1000ms 고정 상한) · guidance 5초 제한은 이번 범위에서 빼고 후속 후보로 등록해요. 상한을 올리면 WI-0107 이 잡은 회귀 일부를 놓쳐요(측정) |
| D4 | web 의 next build 와 type-check 가 `.next/types` 를 두고 경합하는 문제(사본 3회 중 2회 TS6053)는 후속 후보로 등록해요 |
| D5 | 발행 없음(turbo.json · 빌드 스크립트만 바뀌고 패키지 dist 내용은 같음) |

## 3. 요구사항

- FR-1: `packages/axis-ui-react/turbo.json`(새 파일) · `packages/axis-agentic-ui/turbo.json`(새 파일) · `packages/axis-tokens/turbo.json`(수정)에 D1 의존을 넣어요. 기존 `inputs` 는 유지하고 `extends: ["//"]` 를 써요.
- FR-2: ui-react build 스크립트 끝에서 dist 의 d.ts 가 1개 이상이고 cva/types 참조가 0인지 검사해요. 어긋나면 build 가 실패해요. `scripts/fix-cva-dts.test.mjs` 의 산출물 테스트는 dist 를 읽지 않는 「빌드 배선」 정적 검사(tsup 뒤 후처리, 마지막 단계가 `--check`)로 바꿔요(D2).
- FR-3: 결정과 판정 기준(어떤 test 가 어떤 산출물을 읽는지, 새 테스트가 dist 를 읽으면 그 패키지 turbo.json 에 의존을 추가)을 testplan 과 release-notes 에 남겨요.
- FR-4: 후속 후보(D3 · D4)를 project-todo 에 등록해요.

## 4. 수용 기준

- AC1(음성 대조): 레포 사본에서 고치기 전, d.ts 0 · js 68 dist 상태로 `turbo run test --filter=@axis-ds/ui-react --concurrency=1` 이 rc 1 「d.ts 0개」예요.
- AC2: 고친 뒤 같은 상태에서 같은 명령이 rc 0 이고 실행 순서가 build → test 예요. agentic-ui(ui-react dist 를 치운 상태) · tokens(dist 를 치운 상태)도 고치기 전 실패 → 고친 뒤 통과예요.
- AC3: `turbo run test --dry=json` 의 의존 그래프에서 ui-react · agentic-ui · tokens 의 test 가 해당 build 에 의존해요. cli · theme 의 test 는 build 에 의존하지 않아요(범위가 새지 않음).
- AC4: FR-2 검사가 d.ts 0개 · cva/types 참조가 남은 dist 에서 실패하고 정상 dist 에서 통과해요.
- AC5: 레포에서 `turbo run build --force`, `turbo run type-check lint test --force`(기본 동시 실행) 통과. PR CI 의 Test step 시간과 캐시 적중 수를 고치기 전 run 과 같은 방법으로 읽어 나란히 적어요.
