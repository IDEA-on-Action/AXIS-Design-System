# WI-0080: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #209 | 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w6bimpl/WI-0080/`(세션 scratchpad, 커밋하지 않음)
> 기준: worktree `fix/batch6b`(main 6d455f7 위). 수정 전 = 발행본 cli 1.7.0 · mcp 1.4.0(Release 61ae674 와 HEAD 사이 `packages/axis-registry-core` · `axis-cli/src` · `axis-mcp/src` diff 0줄, ref 는 `rev-parse --verify` 로 확인)

## 1. 재현 (수정 전, 음성 대조)

- 새 CLI 테스트를 수정 전 소스로 실행: `template-check.test.ts` 155건 중 `8 failed | 147 passed`. 빨간 것은 WI-0074 hoisted(f-tw3content 제안), WI-0080 매트릭스 3건(hoisted 판정, isolated · single 의 abs 거짓 FAIL), AC1~3, AC6, AC7, `contentGlobCovers` 단위(함수 없음). 초록으로 남은 것은 WI-0074 isolated(f 포함)와 AC5(미설치 · PnP)로, 둘 다 종전과 같아야 하는 불변 단언이에요.
- MCP `template.test.ts` 37건 중 1 failed(hoisted), isolated 음성 대조는 초록. theme add `theme-add.test.ts` 56건 중 1 failed(hoisted 제안 · 안내).
- 수정 전 원본은 `git show HEAD:<path>` 로 잠시 되돌려 재고, 수정본으로 복원한 뒤 `cmp` 로 같음을 확인했어요.

## 2. 실제 설치 매트릭스 (측정, 2026-10-26)

브리프 픽스처(`w6bbrief/WI-0080/` 의 fx-npm · fx-pnpmhoisted · fx-pnpm · fx-single3, 실제 `npm install` · `pnpm install`, ui-react 1.8.0 · fx-single3 은 1.8.1, tailwindcss 3.4.19)를 `w6bimpl/WI-0080/` 로 복사해 `matrix2.mjs` 로 쟀어요. 결과는 `matrix2.json`(행마다 `bApp.uiReactHit` · `bRoot.uiReactHit` 교집합 수, 반박 검토 minor 반영).

재현 방법:

1. 앱(`apps/f-tw3content`, 단일은 루트)의 `tailwind.config.ts` 를 `import axis from "@axis-ds/tokens/tailwind"; import animate from "tailwindcss-animate"; export default { presets: [axis], content: <변형>, plugins: [animate] };` 로 써요. base 는 `"./app/**/*.{ts,tsx}", "./components/ui/**/*.{ts,tsx}"`.
2. 변형: `up` = base + `"../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"`, `local` = base + `"./node_modules/..."`, `none` = base, `broad` = base + `"./**/*.{js,mjs}"`, `relobj` = `{ relative: true, files: [base, up] }`, `abs` = base + 실제 설치 위치 절대경로.
3. 판정: 수정 전 발행본(`w6bbrief/WI-0080/tools` 의 npm 설치 cli 1.7.0 `axis check` · mcp 1.4.0 stdio `axis.check_project`)과 수정 후 worktree 빌드본(`packages/axis-cli/dist` · `packages/axis-mcp/dist`). 자식 프로세스 환경은 PATH · 새 HOME · 새 XDG_CONFIG_HOME 만.
4. 정답: 앱 디렉터리를 cwd 로 `node <앱의 tailwindcss>/lib/cli.js -c tailwind.config.ts -i in.css -o out.css`(in.css 는 `@tailwind base/components/utilities`), 모노레포는 루트 cwd 로도. CSS 의 클래스 선택자를 모아 R = (npm-hoisted up 선택자) - (npm-hoisted none 선택자) 를 만들고(|R| = 402), 행마다 |선택자 ∩ R| 을 세요. |R| 과 같으면 PASS(덮음), 아니면 FAIL.
5. 실행: `node matrix2.mjs <W> <TOOLS> <worktree>`, 요약은 stdout 첫 줄.

요약(`matrix2.json` summary): `refSelectors 402 · before cliOk 12 · mcpOk 12 · after cliOk 24 · mcpOk 24 · cliMcpMismatch before 0 · after 0 · negativeControl rows 10 · sameCli 10 · sameRc 10 · rows 24`.

| 픽스처 | 변형 | 빌드(앱 cwd) ∩ R | 빌드(루트 cwd) ∩ R | 정답 | 수정 전 | 수정 후 |
|---|---|---|---|---|---|---|
| npm-hoisted | up | 402/402 | 0 | PASS | FAIL | PASS |
| npm-hoisted | local | 0/402 | 402 | FAIL | PASS | FAIL |
| npm-hoisted | none | 0/402 | 0 | FAIL | FAIL | FAIL |
| npm-hoisted | broad | 44/402 | 402 | FAIL | PASS | FAIL |
| npm-hoisted | relobj | 402/402 | 402 | PASS | FAIL | PASS |
| npm-hoisted | abs | 402/402 | 402 | PASS | FAIL | PASS |
| pnpm-hoisted | up | 402/402 | 0 | PASS | FAIL | PASS |
| pnpm-hoisted | local | 0/402 | 402 | FAIL | PASS | FAIL |
| pnpm-hoisted | none | 0/402 | 0 | FAIL | FAIL | FAIL |
| pnpm-hoisted | broad | 44/402 | 402 | FAIL | PASS | FAIL |
| pnpm-hoisted | relobj | 402/402 | 402 | PASS | FAIL | PASS |
| pnpm-hoisted | abs | 402/402 | 402 | PASS | FAIL | PASS |
| pnpm-default | up | 0/402 | 0 | FAIL | FAIL | FAIL |
| pnpm-default | local | 402/402 | 0 | PASS | PASS | PASS |
| pnpm-default | none | 0/402 | 0 | FAIL | FAIL | FAIL |
| pnpm-default | broad | 402/402 | 402 | PASS | PASS | PASS |
| pnpm-default | relobj | 0/402 | 0 | FAIL | FAIL | FAIL |
| pnpm-default | abs | 402/402 | 402 | PASS | FAIL | PASS |
| single | up | 0/402 | - | FAIL | FAIL | FAIL |
| single | local | 402/402 | - | PASS | PASS | PASS |
| single | none | 0/402 | - | FAIL | FAIL | FAIL |
| single | broad | 402/402 | - | PASS | PASS | PASS |
| single | relobj | 0/402 | - | FAIL | FAIL | FAIL |
| single | abs | 402/402 | - | PASS | FAIL | PASS |

- 계측 대조: 수정 전 열은 브리프 matrix.json 의 발행본 판정과 24/24 같고, 정답 일치 12/24 가 브리프와 같아요. 브리프의 broad 44/402 를 이번에 교집합으로 처음 셌어요(브리프 시점에는 전체 선택자 수만 있어 미검증이던 값).
- 루트 cwd 열(D4 근거): 호이스팅 up 은 0, local 은 402 예요. 판정은 앱 cwd 를 전제로 두고, 상위 경로 제안에 `relative: true` 안내를 붙였어요. relobj 는 두 cwd 모두 402 예요.
- 수정 후 cli 와 mcp 의 content 문구는 24/24 같아요(심볼 · 목록 접두어만 뺀 비교).

theme add(세 번째 호출지, `theme-add.mjs` → `theme-add.json`): fx-npm · fx-pnpm 사본의 f-tw3content(content 가 ui-react 를 덮지 않음)에서 `theme add ontology` 를 실행했어요. 수정 전 둘 다 `"./node_modules/..."`, 수정 후 fx-npm 은 `"../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` + 안내 1줄, fx-pnpm 은 종전 문구 그대로(안내 없음). rc 는 모두 0.

## 3. 단위 테스트

CLI `packages/axis-cli/src/template/template-check.test.ts`: WI-0074 monorepo 블록에 Tailwind 3 + ui-react 앱 `f-tw3content` 를 더하고 기대값을 레이아웃별(`expected("hoisted" | "isolated")`)로 바꿨어요(반박 검토 major). a · b · c · d · e · h 는 공통 AFTER, f 의 tailwind.content 만 hoisted `../../` + 안내, isolated `./` 예요. 새 describe 「WI-0080」 8건. theme add `theme-add.test.ts` 1건, MCP `template.test.ts` 「WI-0080」 2건.

| # | 테스트 | AC |
|---|---|---|
| 1 | WI-0074 hoisted 표에 f-tw3content(제안 `../../` + 안내) | AC1 · AC2 |
| 2 | WI-0074 isolated 표에 f-tw3content(제안 `./`, 안내 없음, 수정 전에도 초록) | AC4 |
| 3~5 | 매트릭스(hoisted · isolated · single) x 변형 7(up · local · none · broad · relobj · abs · absOther), 기대값은 2절 빌드 정답 | AC1~AC7 |
| 6 | AC1 · AC2 · AC3 hoisted | AC1~AC3 |
| 7 | AC5 미설치 · PnP 종전 경로(수정 전에도 초록) | AC5 |
| 8 | AC6 `**` 는 `../` 를 넘지 않음 | AC6 |
| 9 | AC7 절대경로 | AC7 |
| 10 | `contentGlobCovers` 단위(앞쪽 `../` 개수 · 절대경로 · 정규식 한계 표시) | AC6 · AC7 |
| 11 | theme add hoisted 제안 · 안내, isolated 음성 대조 | AC2 · AC4 |
| 12~13 | MCP hoisted(PASS · FAIL · broad), isolated 음성 대조 | AC2 · AC4 |

안내 문자열은 테스트에 글자 그대로 적었어요(import 하면 수정 전 소스에서 파일 전체가 깨져 판정 단언으로 빨개지는지 볼 수 없음).

변이(`mutate.mjs` → `mutate.json`, 각각 원복 뒤 내용 같음 확인, 실행 범위 cli template-check · theme-add + mcp template 248건):

| 변이 | 빨강 |
|---|---|
| M1 표본을 `node_modules/${name}` 로 고정 | 7(CLI 6 · MCP 1) |
| M2 PnP 가드 제거 | 1(AC5) |
| M3 앞쪽 `../` 개수 비교 제거 | 4(매트릭스 hoisted · AC6 · 단위 · MCP) |
| M4 절대경로 분기 제거 | 5(매트릭스 3 · AC7 · 단위) |
| M5 상위 경로 제안의 `./` 생략 제거 | 6 |
| M6 check 문구의 cwd 안내 제거 | 5 |
| M7 theme add 안내 줄 제거 | 1 |

## 4. changeset 동반 검사 (registry-core → cli · mcp)

`scripts/check-changeset-mcp-tokens.test.mjs` 17건(기존 8건은 임시 git 저장소 안에서 돌도록 옮김, 새 9건). 테스트는 부모 환경의 `GITHUB_*` 를 지우고 사례마다 이벤트를 넣어요(CI 안에서 돌아도 같은 결과).

| 사례 | 기대 |
|---|---|
| registry-core 변경 + changeset 없음 · cli 만 · mcp 만 · cli none(로컬 · PR 각각) | rc 1 |
| registry-core 변경 + cli · mcp(같은 파일 · 다른 파일, 로컬 · PR) | rc 0 |
| registry-core 를 안 바꾸는 PR | rc 0 |
| Release PR 형태(changeset 삭제 · 버전 · CHANGELOG, registry-core 변경 없음) | rc 0 |
| PR 기준은 merge-base(origin/main 이 갈라진 뒤 registry-core 를 바꿈) | rc 0 |
| push 는 `HEAD^`(마지막 커밋이 registry-core 를 바꾸면 rc 1, 아니면 0) | 1 · 0 |
| 기준 없음: origin/main 없음 · PR base 브랜치 없음 · `GITHUB_BASE_REF` 빈 값 · push 첫 커밋 · git 아님 | rc 2 |
| 로컬 워킹트리의 커밋 전 registry-core 변경 | rc 1 |

변이(`mutate-cs.mjs` → `mutate-cs.json`): V1 규칙 끔 3 빨강 · V2 mcp 요구 제거 2 · V3 기준 없음을 통과로 1 · V4 merge-base 대신 origin/main 직접 1 · V5 push 도 merge-base 2 · V6 접두어를 이름 포함으로 1 · V7 워킹트리 대신 HEAD 1. 모두 원복 확인. 새 테스트를 수정 전 스크립트에 붙이면 `checkRegistryCore` export 가 없어 파일 전체가 실패해요(그래서 판정 근거는 변이예요).

양성 대조(이 브랜치): changeset 을 넣기 전 `node scripts/check-changeset-mcp-tokens.mjs` 는 「비교 기준 6d455f7d18db (로컬: merge-base(origin/main, HEAD)) · packages/axis-registry-core/ 1개」 뒤 rc 1, `.changeset/wi-0080-check-content-hoisted.md` 를 넣은 뒤 rc 0.

이력 대조(git diff 로 계산, 스크립트는 돌리지 않음): 배치 6 수정 커밋 4a5e185 는 HEAD^ 대비 registry-core 1파일을 바꾸고 그 시점 changeset 에 wi-0074(cli · mcp patch)가 있어 push 기준 통과, Release 61ae674 는 registry-core 변경 0이라 통과로 판정될 구조예요.

## 5. 게이트 (측정, 2026-10-26)

| 게이트 | 결과 |
|---|---|
| `turbo lint --force` | rc 0, 7/7, Cached 0 |
| `turbo type-check --force` | rc 0, 11/11, Cached 0 |
| `turbo build --force` | rc 0, 8/8, Cached 0. `public/templates/*.json` 5개는 updatedAt 한 줄만 바뀌어 되돌림 |
| `turbo test --force` | rc 0, 7/7, Cached 0. cli 790(HEAD 781 + 9, 계산) · mcp 168(HEAD 166 + 2) · ui-react 194 · agentic-ui 148 · theme 47 |
| `check-token-refs` | rc 0, 위반 0건(:root 284 · .dark 284) |
| `check-contrast-pairs` | rc 0, 위반 0건(검사 파일 21) |
| `check-types-versions` | rc 0, node --test 8/8 |
| `check-changeset-mcp-tokens` | rc 0, changeset 1개 · registry-core 1개 · 통과, node --test 17/17 |
| `check-library-links` | rc 0, 링크 48 · 항목 129 · 위반 0건 |
| `build:registry` | rc 0, 30개 항목 · G1 통과. `r/index.json` · `registry.json` version 1.8.1 → 1.5.0 으로 되돌림(스모크 뒤) |
| `test:registry` | rc 0, 45/45 |
| `check-licenses` | rc 0, 통과 |
| `pack-smoke` | rc 0, 퍼블리시 대상 6개 |
| `cli-smoke` | rc 0, 비TTY 갈래 12건, OK |
| `registry-install-smoke` | rc 0, 5/5 |
| E2E | 실행하지 않음: `apps/web` · 디자인 패키지 변경 없음(바뀐 것은 registry-core · cli · mcp 테스트 · scripts · 문서), 해당 spec 없음 |

## 6. 발행 뒤 재측정 (AC8, 2026-10-26)

- 대상: npm 발행본 `@axis-ds/cli` 1.7.1 · `@axis-ds/mcp` 1.4.1(PR #219 머지 79c3208, Release PR #221 머지 cb8f27c, publish run 40247657745, provenance 2/2 `https://slsa.dev/provenance/v1`), 대조 cli 1.7.0 · mcp 1.4.0. package-lock resolved 가 `registry.npmjs.org` 의 네 tgz 이고 `--version` 실행값 1.7.0 / 1.7.1.
- 환경: `env -i` PATH · 새 HOME · 새 XDG_CONFIG_HOME 으로 tools-old · tools-new 를 npm 설치(rc 0), 측정 드라이버도 같은 env. 픽스처(fx-npm · fx-pnpm · fx-pnpmhoisted · fx-single3 · fx-single)는 `mkfx.mjs` 로 새로 만들어 레지스트리에서 설치(npm rc 0, pnpm 9.15.4 rc 0). 배치 실측: npm · pnpm hoisted 의 f-tw3content 는 ui-react 1.8.1 이 `../..` 에, pnpm 기본 · single 은 앱 `node_modules` 에 있음. tailwindcss 3.4.19.
- 측정이 돈 근거: `matrix-pub.mjs` rc 0 · stderr 0바이트 · 24행, 판정을 못 읽은 행 0 · 빈 문구 0 · 빌드 실패 0, out/ CSS 42개. 정답 기준 ui-react 전용 선택자 402개(npm hoisted up 빌드 - none 빌드).
- 결과: cli 1.7.1 24/24 · mcp 1.4.1 24/24 정답 일치, 대조 cli 1.7.0 · mcp 1.4.0 각 12/24(틀린 12행은 호이스팅 2종의 up · local · broad · relobj · abs 10행, pnpm 기본 abs 1행, single abs 1행). hoisted broad 는 402개 중 44개만 맞혀 1.7.1 FAIL 이 정답과 같음. cli · mcp content 문구 불일치 신판 0 · 구판 0.
- 음성 대조: pnpm 기본 · single 의 abs 가 아닌 10행은 신구 문구 · rc 10/10 바이트 일치.
- theme add ontology(신구 4경우 rc 0): 1.7.1 은 fx-npm · fx-pnpmhoisted 에서 `../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` 제안 + cwd 안내 1줄(2줄), fx-pnpm 은 `./node_modules/...` 1줄로 1.7.0 과 같음. 1.7.0 은 세 픽스처 모두 `./node_modules/...` 1줄.
- 측정 조건: 새 HOME 에서 corepack 이 최신 pnpm 을 받으려다 실패해 픽스처 루트 package.json 에 `packageManager: pnpm@9.15.4` 를 넣고 설치(원래 픽스처와 같은 설정, 측정 단계에는 env 주입 없음).
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/wpub6b/w/`(matrix2.json · matrix.txt · theme-add.json · theme-add-h.json)

### 6.1 changeset 검사 실경로 (CI, 2026-10-26)

- PR 모드: #219 PR CI(13m47s)에서 기준 merge-base 6d455f7 · registry-core 3파일 · cli · mcp changeset 각 2개로 통과. 확장 검사가 PR 모드로 실제로 돌았어요.
- main push 모드(정착 대기): #219 push run 40246073020 은 #220 push 에 취소되어(cancelled) 검사 단계가 skipped, #220 push run 40246082456 은 기준 `github.event.before` 79c3208 · registry-core 0개로 통과. 그래서 **registry-core 변경이 있는 push 에서 push 모드 검사가 실제로 돈 적은 아직 없어요.** 다음 registry-core 머지(WI-0085 · 0086)를 다른 머지와 겹치지 않게 단독 push 로 보내, 그 run 의 검사 단계가 skipped 가 아니라 실행되어 registry-core 파일 수를 셌는지 확인해요.

## 7. 반박 검토 후속 (2026-10-26, 검토 2건 모두 approve · major 0 · minor 6)

검토 지적을 실측으로 판정했어요. 두 검토가 같은 결함을 따로 짚은 것(중괄호 갈래)은 하나로 묶었어요.

| # | 지적 | 판정 | 처리 |
|---|---|---|---|
| R1 | changeset 검사 push 모드가 `HEAD^` 하나만 봄(rebase 머지 · 직접 push 의 앞 커밋 누락) | 맞음. 새 테스트(커밋 3개, 첫 커밋만 registry-core)를 수정 전 스크립트에 돌리면 rc 0(기대 1)으로 빨강 | 고침: frontend.yml 이 `github.event.before` 를 `AXIS_PUSH_BEFORE` 로 넘기고, 스크립트는 그 커밋과 HEAD 의 merge-base 를 기준으로 씀. 비었거나 0 sha 면 `HEAD^`, sha 형식 오류 · 받지 못한 커밋이면 exit 2 |
| R2 | `contentGlobCovers` 가 중괄호 안의 상위 경로 갈래를 못 셈(검토 두 건 공통) | 맞음. 단위 · 호이스팅 픽스처 테스트가 수정 전 소스에서 빨강 | 고침(D7): 중괄호 갈래를 펼쳐(중첩 포함, 256개 상한) 갈래마다 판정. 빌드 정답은 검토 실측 372/372(npm · yarn ws 앱 cwd) |
| R3 | 절대경로 glob 이 심링크 경로와만 비교(pnpm `.pnpm` 스토어 실경로 거짓 FAIL) | 맞음. 심링크 스토어 픽스처 테스트가 수정 전 소스에서 빨강 | 고침(D3 확장): 표본의 실경로(있는 조상까지 realpath)와도 비교. 빌드 정답은 검토 실측 372/372 |
| R4 | `findWorkspaceRoot` · `findInstalledPackage` 가 realpath 를 쓰지 않음(심링크 baseDir) | 맞음(검토 픽스처 실측). 종전 동작과 같아 회귀 아님 | 후속: WI-0080 · WI-0081 PRD 1.3 「범위 밖」에 잔여 경계로 기록 → 해소: WI-0086(#218, 배치 6c, 2026-10-26 구현, cli 1.7.2 · mcp 1.4.2 예정) |
| R5 | init 의 utils 의존성 추가가 루트 선언을 무시(check 와 판단 불일치) | 맞음(검토 rootonly 픽스처 실측) | 후속: WI-0081 PRD 1.3 에 기록, WI-0086 합류 · 새 WI 여부는 결정 필요로 넘김. 배치 6c 결정으로 WI-0086 에 합류 → 해소: WI-0086(#218, 배치 6c, 2026-10-26 구현, cli 1.7.2 · mcp 1.4.2 예정) |

새 테스트 4건과 수정 전 확인:

| 테스트 | 수정 전 | 수정 후 |
|---|---|---|
| template-check 「중괄호 갈래마다 ../ 개수를 셈」(단위 6 · hoisted PASS · isolated FAIL 음성 대조) | 빨강(`contentGlobCovers(MIXED)` false) | 초록 |
| template-check 「절대경로 glob 은 표본의 실경로와도 비교」(스토어 실경로 PASS · 심링크 절대 · 상대 PASS · 다른 스토어 FAIL 음성 대조) | 빨강(FAIL) | 초록 |
| changeset 「push 기준은 github.event.before」 | 빨강(rc 0) | 초록 |
| changeset 「before 가 0 sha 거나 없으면 HEAD^, 받지 못한 커밋 · 형식 오류면 rc 2」 | 빨강 | 초록 |

변이(각각 원복 뒤 `cmp` 로 같음 확인): 중괄호 펼침 끔(`branches = [glob]`) → template-check 1 빨강, 실경로 비교 끔 → 1 빨강.

게이트(측정, 이 수정 뒤 다시, 하나씩):

| 게이트 | 결과 |
|---|---|
| `turbo lint --force` | rc 0, 7/7, Cached 0 |
| `turbo type-check --force` | rc 0, 11/11, Cached 0 |
| `turbo build --force` | rc 0, 8/8, Cached 0. `public/templates/*.json` 5개는 updatedAt 한 줄만 바뀌어 되돌림 |
| `turbo test --force` | rc 0, 7/7, Cached 0. cli 819 · mcp 169 · ui-react 194 · agentic-ui 148 · theme 47 |
| `check-token-refs` · `check-contrast-pairs` | rc 0, 위반 0건(:root 284 · .dark 284 / 검사 파일 21) |
| `check-types-versions` | rc 0, 8/8 |
| `check-changeset-mcp-tokens` | rc 0, changeset 2개 · 기준 6d455f7 · registry-core 3개 · 통과, node --test 19/19 |
| `check-library-links` | rc 0, 링크 48 · 항목 129 · 위반 0건 |
| `build:registry` | rc 0, 30개 항목 · G1 통과. `r/index.json` · `registry.json` version 1.8.1 → 1.5.0 으로 되돌림(스모크 뒤) |
| `test:registry` | rc 0, 45/45 |
| `check-licenses` | rc 0, 통과 |
| `pack-smoke` | rc 0, 퍼블리시 대상 6개 |
| `cli-smoke` | rc 0, OK |
| `registry-install-smoke` | rc 0, 5/5 |
| E2E | 실행하지 않음: `apps/web` 변경 없음(바뀐 것은 registry-core · cli 테스트 · scripts · workflow · 문서) |
