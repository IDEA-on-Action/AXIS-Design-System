# WI-0081: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #210 | 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w6bimpl/WI-0081/`(세션 scratchpad, 커밋하지 않음)
> 기준: worktree `fix/batch6b`(main 6d455f7 위, WI-0080 커밋 0ceaf94 다음). 수정 전 = 이 브랜치 HEAD 의 `project.ts` · `dependencies-core.ts`(발행본 cli 1.7.0 · mcp 1.4.0 와 이 두 파일의 판정 경로가 같음, WI-0080 은 두 파일을 고치지 않음)

## 1. 재현 (수정 전, 음성 대조)

- 새 · 바뀐 테스트를 수정 전 소스로 실행했어요. `git show HEAD:<path>` 로 두 코어 파일을 잠시 되돌리고, 수정본으로 복원한 뒤 `cmp` 로 같음을 확인했어요(`pre-all-cli.log` · `pre-all-mcp.log`).
  - CLI(workspace-root · init · theme-add · add · template-check) 507건 중 `22 failed | 485 passed`. MCP template 38건 중 `2 failed`.
  - 빨강: workspace-root 13건(대부분 `findWorkspaceRoot is not a function`, 동작 판별은 3절 변이로 따로 보임), init 워크스페이스 npm · yarn 2건, theme add 1건, add 1건, template-check WI-0074 hoisted · isolated(d · h 행) 2건, WI-0081 양성 3건(npm PASS · yarn 안내 · PnP), MCP h 행 · d-rootonly 2건.
  - 초록으로 남은 것은 불변 단언이에요: workspace-root 의 앱 층 lockfile 2건, init 의 워크스페이스 밖 음성 대조, template-check 의 앱 선언 우선 · 음성 대조 3건, MCP 양성 대조 · a · b 행.
- 발행본 실측(2절 「수정 전」 열)이 브리프 `pub170.txt` · `check170.json` 과 같은 줄이에요(계측 대조).

## 2. 실제 설치 픽스처 신구 비교 (측정, 2026-10-26)

브리프 측정 디렉터리(`w6bbrief/WI-0081`, 실제 `npm install` · `pnpm install` 된 fx-npm · fx-pnpm · fx-pnpmhoisted · fx-single, 빈 lockfile 의 fx-yarn · fx-outside · fx-gitstop, ctl-npm · ctl-yarn)를 `w6bimpl/WI-0081/m` 으로 `cp -a` 하고, 워크스페이스 밖 상위에 tailwindcss 를 선언한 `fx-outside-tw` 를 더했어요.

재현 방법:

1. `bash m/meas.sh <m> <worktree>`. 자식 프로세스 환경은 `env -i` PATH · 새 HOME · 새 XDG_CONFIG_HOME 만이에요.
2. 수정 전(pub) = `m/tools` 의 npm 설치 cli 1.7.0 · mcp 1.4.0, 수정 후(new) = worktree `packages/axis-cli/dist` · `packages/axis-mcp/dist`(turbo build 산출물).
3. 안내 명령: `run.sh`(앱마다 tpl 복사 뒤 `init -y` · `theme add ontology --dir` · `add dialog -y`, 설치 명령 줄만 추림) 6픽스처 + `run-ctl.sh` 2개 → `guide-pub.txt` · `guide-new.txt`.
4. check: `run-all2.mjs` 가 `axis check` 와 MCP stdio `axis.check_project` 를 8앱에 돌려 `check-pub.json` · `check-new.json`, 줄 단위 신구 차이는 `check-diff.json`.

안내 명령(`diff guide-pub.txt guide-new.txt`, 양쪽 49줄, 바뀐 줄 8):

| 픽스처 | 명령 | 수정 전 | 수정 후 |
|---|---|---|---|
| fx-npm | init 설치 · 애니메이션 | `pnpm install` · `pnpm add tw-animate-css` | `npm install` · `npm install tw-animate-css` |
| fx-npm | theme add | `pnpm add "@axis-ds/theme@^1.3.0"` | `npm install "@axis-ds/theme@^1.3.0"` |
| fx-npm | add dialog | `pnpm add @radix-ui/react-dialog` | `npm install @radix-ui/react-dialog` |
| fx-yarn | init 설치 · 애니메이션 | `pnpm install` · `pnpm add tailwindcss-animate` | `yarn install` · `yarn add tailwindcss-animate` |
| fx-yarn | theme add | `pnpm add ...` | `yarn add "@axis-ds/theme@^1.3.0"` |
| fx-yarn | add dialog | `pnpm add ...` | `yarn add @radix-ui/react-dialog` |
| fx-pnpm · fx-pnpmhoisted | 3명령 | pnpm | 같음(회귀 확인, 판별력 없음) |
| fx-outside/sub · fx-gitstop/repo | 3명령 | pnpm | 같음(AC3 음성 대조) |
| ctl-npm · ctl-yarn | init | npm · yarn | 같음(AC4 양성 대조) |

check(cli rc · dependencies 줄, MCP 는 같은 문구의 markdown 줄. 바뀐 줄 cli 13 · mcp 9, 모두 dependencies 줄과 그에 딸린 결과 요약 줄):

| 앱 | cli rc | 수정 전 | 수정 후 |
|---|---|---|---|
| fx-npm/apps/d-rootonly | 1 → 0 | FAIL 필수 의존성 누락: tailwindcss | WARN 권장 의존성 누락: clsx, tailwind-merge (워크스페이스 루트에 선언: tailwindcss) |
| fx-npm/apps/h-rootonly-ui | 1 → 0 | FAIL 같음 | WARN 같음(요약 4 pass / 1 warn / 1 fail → 4 pass / 2 warn / 0 fail) |
| fx-pnpm/apps/d-rootonly | 1 → 0 | FAIL 같음 | WARN 같음 |
| fx-pnpmhoisted/apps/d-rootonly | 1 → 0 | FAIL 같음 | WARN 같음 |
| fx-yarn/apps/w81-check | 1 → 1 | WARN 선언됐지만 설치되지 않은 의존성: tailwindcss, clsx, tailwind-merge → pnpm install | 같은 WARN, `→ yarn install`(rc 1 은 axis.config.json 없음 FAIL 때문) |
| fx-npm/apps/a-twlatest | 0 → 0 | WARN 권장 의존성 누락 | 같음(앱 선언, 출처 표시 없음) |
| fx-single | 0 → 0 | WARN 권장 의존성 누락 | 같음 |
| fx-outside-tw/sub/app | 1 → 1 | FAIL 필수 의존성 누락: tailwindcss | 같음(AC6 음성 대조, 워크스페이스 밖 선언) |

- d · h · pnpm 3행에서 dependencies 밖의 cli 줄은 결과 요약 2줄만 바뀌었어요. a-twlatest · fx-single · fx-yarn · fx-outside-tw 의 dependencies 밖 줄은 같아요.
- cli 와 mcp 의 dependencies 문구는 8/8 같아요(목록 접두어만 다름).

## 3. 단위 테스트 · 변이

| # | 파일 | 테스트 | AC |
|---|---|---|---|
| 1 | `axis-cli/src/workspace-root.test.ts` | 환경 가드(tmpdir 조상에 표지 · lockfile 없음) | 계측 |
| 2~4 | 같음 | npm · yarn(배열 · 객체형) · pnpm 워크스페이스 | AC1 · AC2 |
| 5~6 | 같음 | fx-outside · fx-gitstop(`.git` 디렉터리 · 파일형) | AC3 |
| 7 | 같음 | 같은 층의 `.git` + 표지는 표지 먼저 | AC4 |
| 8~10 | 같음 | 앱 층 lockfile 우선, 단일 앱, 앱 = 루트 | AC4 |
| 11 | 같음 | 같은 층 lockfile 여럿은 종전 우선순위 | AC4 |
| 12 | 같음 | lockfile 없는 루트 4변형(packageManager 포함) → pnpm | AC5 |
| 13~15 | 같음 | 중간 층 lockfile 무시, 가장 가까운 루트에서 멈춤, 잘못된 workspaces · 깨진 JSON | AC3 |
| 16~18 | `init.test.ts` 「WI-0081」 | npm · yarn 3줄(설치 · 추가 · 애니메이션), 워크스페이스 밖 음성 대조 | AC1 · AC2 · AC3 |
| 19 | `theme-add.test.ts` | npm · yarn · 워크스페이스 밖(토큰 업그레이드 · theme 설치 안내) | AC1 · AC2 · AC3 |
| 20 | `add.test.ts` | npm · yarn · 워크스페이스 밖(dependencyCommand) | AC1 · AC2 · AC3 |
| 21~22 | `template-check.test.ts` WI-0074 hoisted · isolated | d-rootonly · h-rootonly-ui 행을 루트 선언 WARN 으로 | AC6 |
| 23~29 | `template-check.test.ts` 「WI-0081」 | npm PASS + 출처 + `runCheck` fail 0, yarn `→ yarn install`, 앱 선언 우선, 음성 대조 3(워크스페이스 밖 · `.git` 너머 · 선언 없음), PnP 문구 | AC2 · AC6 |
| 30~31 | `axis-mcp/src/tools/template.test.ts` | h 행, d-rootonly FAIL 없음 + 워크스페이스 밖 FAIL | AC6 |

변이(각각 원복 뒤 sha 같음 확인, `mut-*.log` · `mut-int-*.log`):

| 변이 | 내용 | 빨강 |
|---|---|---|
| M1 | 루트 층 lockfile 을 보지 않음(한 층 판독) | 단위 5 · init 2 · theme add 1 · add 1 · check yarn 안내 1 |
| M2 | 멈춤 없이 가장 가까운 lockfile(파일시스템 루트까지) | 단위 5(fx-outside · fx-gitstop · 중간 층 · 가까운 루트 · 잘못된 workspaces), 통합 판에서는 init · theme add · add 음성 대조 + check 음성 대조 2 |
| M3 | 루트 lockfile 을 앱 층보다 먼저 | 단위 1(앱 층 우선) |
| M4 | 같은 층에서 `.git` 을 표지보다 먼저 | 단위 1 |
| M5 | `.git` 멈춤 제거 | 단위 1(fx-gitstop) |
| D1 | 루트 선언 인정 제거 | cli 5 · mcp 2 |
| D2 | 워크스페이스 판정 없이 두 층 위 package.json 을 루트로 | cli 2 · mcp 1(음성 대조) |
| D3 | 출처 표시 제거 | cli 5 · mcp 2 |

## 4. 전수 grep (AC8, `ac8-grep.txt`)

`grep -rn "detectInstallCommand(\|addCommandFor(\|addCommandForSpecs(\|tokensInstallCommand(" packages/*/src --include=*.ts`(테스트 제외)와 `grep -rnE "pnpm (add|install)|pnpm --filter"` 의 결과예요. 계측 대조군: 첫 grep 이 `project.ts` 의 `detectInstallCommand` 정의 줄을 잡았어요(42줄 중 하나).

`detectInstallCommand` 를 거쳐 이번에 바뀌는 곳:

| 위치 | 경로 |
|---|---|
| `axis-cli/src/init/init.ts:368` → 379 · 417 · 426 · 217 · 295 · 303 | init「설치:」 · 추가 명령 · 애니메이션 · Tailwind 4 안내 |
| `axis-cli/src/theme/theme-add.ts:285` → 427 · 428 | theme add 토큰 · theme 설치 안내 |
| `axis-cli/src/theme/index.ts:69-70` `tokensInstallCommand` → 445 · 454 | theme list · info 안내 |
| `axis-registry-core/src/add/add.ts:505` → 537 `addCommandForSpecs` → 841 | cli add · MCP `axis.install_component` dependencyCommand |
| `axis-registry-core/src/template/dependencies-core.ts:95` | check · check_project 미설치 안내 |

pnpm 고정으로 남긴 곳(D3, WI-0085(#217) 대상). **해소(2026-10-26, WI-0085)**: 아래 줄은 기본값 상수(`TOKENS_INSTALL_COMMAND`)와 accordion 데모(배치 6c 결정으로 그대로)를 빼고 모두 대상 디렉터리 매니저를 따르게 바뀌었어요. `template-apply.ts:290` `pnpm dev` 도 함께예요(WI-0085 testplan). 「U6 범위 결정」은 버전 범위 결정이었다는 정정은 prd D3:

| 위치 | 내용 |
|---|---|
| `axis-cli/src/template/template-apply.ts:159` · 162 · 289 | `pnpm add` · `pnpm add -D` · `pnpm install` |
| `axis-cli/src/theme/index.ts:74` | `TOKENS_INSTALL_COMMAND` 기본값(lockfile 없을 때와 같은 pnpm) |
| `axis-cli/src/theme/index.ts:103` | `pnpm --filter @axis-ds/tokens build`(워크스페이스 안내) |
| `axis-cli/src/monet.ts:214` | `pnpm add ...` 안내 |
| `axis-mcp/src/tools/brand.ts:45` · 91 | `TOKENS_INSTALL_COMMAND` · `pnpm --filter`(U6 범위 결정) |
| `axis-mcp/src/tools/template.ts:533` · 536 | template 안내 `pnpm add` · `pnpm add -D` |
| 문서 `apps/web/src/app/(docs)/components/accordion/page.tsx:62` · 99 | 설치 예시 `pnpm add @axis-ds/ui-react` |

나머지 줄은 주석(`init.ts:352` · 354, `theme/index.ts:67`)과 기본값 정의(`project.ts:12` · 70 · 97, `add.ts:543`)예요.

## 5. 게이트 (측정, 2026-10-26, 하나씩 실행)

| 게이트 | 결과 |
|---|---|
| `turbo lint --force` | 7/7 성공, Cached 0 (마지막 테스트 파일 수정 뒤 재실행) |
| `turbo type-check --force` | 11/11 성공, Cached 0 (첫 실행에서 새 테스트 파일 TS2345 1건 → 고친 뒤 재실행) |
| `turbo build --force` | 8/8 성공, Cached 0. `public/templates/*.json` 5개 updatedAt 만 바뀌어 되돌림 |
| `turbo test --force` | 7/7 성공, Cached 0. cli 817 · mcp 169 · ui-react 194 · agentic-ui 148 · theme 47 |
| check-token-refs · check-contrast-pairs · check-types-versions(8/8) · check-library-links | rc 0, 위반 0 |
| check-changeset-mcp-tokens | rc 0: 비교 기준 6d455f7d18db, 바뀐 파일 22 · registry-core 3, cli · mcp 둘 다 wi-0080 · wi-0081 changeset 으로 올림. 테스트 17/17 |
| build:registry · test:registry(45/45) | rc 0. `r/index.json` · `r/registry.json` version 1.8.1 → 1.5.0 으로 되돌림 |
| check-licenses | 통과 |
| pack-smoke | rc 0, 퍼블리시 대상 6개 |
| cli-smoke | rc 0, 비TTY 갈래 12건 |
| registry-install-smoke | rc 0, g2 5/5(이 스모크는 tmpdir 픽스처의 앱 층에 pnpm-lock 이 있어 영향 없음) |
| E2E | 해당 없음: `apps/web/e2e` 가 바뀐 코드(registry-core · axis-cli · dependencies-core)를 참조하지 않음(grep 0건, 같은 grep 이 `library` 로는 2파일을 잡아 계측은 정상) |

## 6. CI 영향 · 경계

- 레포 안 디렉터리에서 판정하는 테스트는 상위 탐색이 레포 루트 `pnpm-workspace.yaml` + `pnpm-lock.yaml` 에 닿아 `pnpm install` 이에요. 기본값과 같아 결과가 바뀌지 않지만 우연한 일치라, 새 테스트는 모두 tmpdir 에서 만들고 환경 가드(1번)를 뒀어요.
- `registry-install-smoke.mjs` 는 dependencyCommand 가 `pnpm add ` 로 시작한다고 기대해요. `--work` 를 npm lockfile 이 있는 워크스페이스 아래로 주면 실패할 수 있어요(CI 기본 경로는 tmpdir 이라 영향 없음).
- 판별력 있는 행은 npm · yarn 뿐이에요. pnpm 행은 상위 탐색이 깨져도 초록이라 변이 판정은 npm · yarn 행으로 했어요.

## 7. 발행 뒤 재측정 (AC7, 2026-10-26)

- 대상: npm 발행본 `@axis-ds/cli` 1.7.1 · `@axis-ds/mcp` 1.4.1(PR #219 머지 79c3208, Release PR #221 머지 cb8f27c, publish run 40247657745, provenance 2/2 `https://slsa.dev/provenance/v1`), 대조 cli 1.7.0 · mcp 1.4.0. 둘 다 `m/tools` 와 다른 새 디렉터리(tools-old · tools-new)에 `env -i` PATH · 새 HOME · 새 XDG_CONFIG_HOME 으로 npm 설치(rc 0), resolved 는 `registry.npmjs.org` tgz, `--version` 1.7.0 / 1.7.1.
- 안내 명령(`meas-pub.sh` rc 0, 9개 명령 rc 0): 신구 각 49줄, diff 는 2절 표의 8줄뿐(npm 4줄 · yarn 4줄, 1.7.0 은 같은 8줄이 pnpm). 이 신판 결과는 구현 때 worktree 빌드로 잰 `guide-new.txt` 와 diff rc 0, 구판 결과는 이전 `guide-pub.txt` 와 diff rc 0.
- 양성 대조: ctl-npm · ctl-yarn(앱 옆 lock) 은 신구 모두 `npm install` · `yarn install`, 추출 grep 이 npm · yarn 줄을 실제로 잡음. 음성 대조: fx-outside · fx-gitstop 6개 명령, pnpm · pnpmhoisted 6개 명령은 신구 diff 0(모두 pnpm).
- check(8앱): 바뀐 줄 cli 13 · mcp 9(check-old.json · check-new.json 을 줄 단위로 다시 셈, 2절 기대값과 같음). 루트에만 선언한 4앱(fx-npm d-rootonly · h-rootonly-ui, fx-pnpm d-rootonly, fx-pnpmhoisted d-rootonly)은 1.7.0 rc 1 「FAIL 필수 의존성 누락: tailwindcss」 → 1.7.1 rc 0 「WARN 권장 의존성 누락: clsx, tailwind-merge (워크스페이스 루트에 선언: tailwindcss)」, mcp 1.4.1 도 같은 문구. fx-outside-tw/sub/app 은 신구 rc 1 FAIL 유지, a-twlatest · fx-single 은 신구 같음, fx-yarn w81-check 는 신구 rc 1 이고 설치 안내만 `pnpm install` → `yarn install`. check 8행 41항목의 cli · mcp 불일치 행은 신구 모두 0.
- 구현 때와 다른 조건: fx-gitstop 은 빈 `.git` 디렉터리 대신 `git init` 한 실제 저장소(결과 같음, 신구 모두 pnpm). pnpm 픽스처는 새 HOME 에서 corepack 이 최신 pnpm 을 받으려다 실패해 루트 package.json 에 `packageManager: pnpm@9.15.4` 를 넣고 설치(원래 픽스처와 같은 설정, 측정 단계 env 주입 없음).
- 미측정: yarn 은 원래 측정처럼 빈 yarn.lock · 미설치 상태로만 쟀어요. 실제 yarn 설치 결과 위의 check 동작은 재지 않았어요.
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/wpub6b/w/`(guide-old.txt · guide-new.txt · check-old.json · check-new.json)

## 8. 반박 검토 후속 (2026-10-26)

- 심링크 baseDir 의 realpath 미사용 · init utils 의존성의 루트 선언 무시 두 건은 실측과 맞지만 회귀가 아니라 PRD 1.3 「범위 밖」에 잔여 경계로 기록했어요(후속). 판정 · 게이트는 WI-0080 testplan 7절에 함께 적었어요.
