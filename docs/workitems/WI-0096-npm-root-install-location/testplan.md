# WI-0096: npm 워크스페이스 루트 선언의 설치 위치 안내 테스트 계획

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 기준: `main` e32275e | 측정일: 2026-10-30 | node 22.22.0

## 1. fixture · 측정 명령

- 설치 위치 fixture: 루트 `package.json` 에 `workspaces: ["apps/*"]` 와 `is-number@7.0.0`(루트 선언), `apps/web/package.json` 에 `kind-of@6.0.3`(앱 선언). 판정은 `node_modules/<이름>/package.json` 이 루트 · 앱 어디에 생겼는지예요.
  - npm: scratchpad `measure-npm.sh <npm 명령> <라벨>`. 10.9.4 는 머신의 npm, 7.24.2 · 8.19.4 · 9.9.4 는 `npx -y npm@<버전>`(각각 `-v` 로 버전 확인)
  - lockfile 조건: 없음 · 빈 파일(루트 `package-lock.json` 0바이트) · 정상(루트에서 설치한 뒤 node_modules 만 지움) · 앱 lockfile(워크스페이스 밖 사본에서 만든 `package-lock.json` 을 `apps/web` 에 둠)
  - pnpm 9.15.4 · yarn 1.22.22: scratchpad `measure-other.sh`(pnpm 은 `pnpm-workspace.yaml` 을 더함, lockfile 없음 · 정상 두 조건)
- CLI 출력 fixture: scratchpad `run-cli.sh <cli dist> <출력 디렉터리>`. 매니저 3종(npm: 루트 `package-lock.json` `{}` · pnpm: `pnpm-lock.yaml` + `pnpm-workspace.yaml` · yarn 1: `yarn.lock`) × 선언 위치 2종(루트 · 앱) × 명령 3종(theme add · init · check) = 18개 출력. 선언은 `@axis-ds/tokens` · `@axis-ds/ui-react` · `tailwindcss@^4.1.0` · `clsx` · `tailwind-merge` · `tw-animate-css`, 설치본 없음. theme add · check 는 `init -y` 뒤에 실행해요.
  - 종전: main e32275e 빌드 사본(scratchpad `base-cli`), 수정 후: worktree 빌드(`pnpm turbo build --filter=@axis-ds/cli... --filter=@axis-ds/mcp... --force`, Cached 0)

## 2. 착수 측정

### 2.1 설치 위치 (측정, 60칸)

npm 48칸(루트 선언 `is-number` 이 설치됐는가):

| npm | lockfile | 앱 디렉터리 `npm install` | 앱 디렉터리 `--include-workspace-root` | 루트 `npm install` |
|---|---|---|---|---|
| 10.9.4 | 없음 · 빈 파일 · 정상 · 앱 lockfile | 4조건 모두 미설치 | 4조건 모두 설치 | 4조건 모두 설치 |
| 9.9.4 | 같음 | 모두 미설치 | 모두 설치 | 모두 설치 |
| 8.19.4 | 같음 | 모두 미설치 | 모두 설치 | 모두 설치 |
| 7.24.2 | 같음 | 모두 미설치 | **모두 미설치** | 모두 설치 |

- 모든 칸 rc 0 이에요. 실패하지 않고 조용히 루트 선언만 빠져요.
- 앱 선언 `kind-of` 는 48칸 모두 설치됐어요. npm 8 ~ 10 은 루트 `node_modules` 로 호이스팅, npm 7 의 앱 디렉터리 실행은 `apps/web/node_modules` 에 설치(워크스페이스로 보지 않음)했어요. 루트 실행은 네 버전 모두 루트 · 앱 선언을 함께 설치했어요(16/16).
- 앱 lockfile 조건: npm 8 ~ 10 은 앱 디렉터리에 lockfile 이 있어도 워크스페이스로 동작했어요(prd 2.3 · Q113).

pnpm · yarn 1 12칸:

| 매니저 | 조건 | 앱 디렉터리 install | 루트 install |
|---|---|---|---|
| pnpm 9.15.4 | 없음 · 정상 | 루트 선언 설치 2/2 | 2/2 |
| yarn 1.22.22 | 없음 · 정상 | 루트 선언 설치 2/2 | 2/2 |

### 2.2 main 출력 (측정, 18개)

npm 루트 선언에서 앱 디렉터리 명령을 안내한 줄은 6줄이에요(prd 1.1 표). 나머지 15개 출력(npm 앱 선언 3 · pnpm 6 · yarn 6)의 설치 구절은 「<pm> install」로 실제 동작과 맞아요. 같은 npm 루트 check 출력의 Tailwind 4 줄은 이미 「설치(워크스페이스 루트에서 npm install)」(WI-0097)이었어요. 18개 모두 rc 0 이에요.

### 2.3 원인 위치

| 줄 | 위치(main e32275e) |
|---|---|
| theme add 컴포넌트 보류 | cli `theme/index.ts` 가 `deferredComponentImportReason(d, plan.installCommand)` 에 앱 디렉터리 명령을 넘김 |
| theme add tokens | cli `theme/index.ts` 루트 선언 갈래의 `설치: ${plan.installCommand}`(주석에 「npm 루트 위치 문구는 WI-0096」) |
| init utils | cli `init/init.ts` `reportDependencies` 의 `plan.installCommand` 두 곳 |
| init 애니메이션 | cli `init/init.ts` `animationGuideLine` 의 `${installCommand} 뒤` |
| check 두 묶음 | registry-core `template/dependencies-core.ts` `checkDependencies` 의 `detectInstallCommand(baseDir)` 두 곳 |

### 2.4 실경로 스모크 (측정, scratchpad `smoke-npm.sh`, npm 10.9.4 실제 설치)

루트에 `tailwindcss@^4.1.0` · `clsx` · `tailwind-merge` · `@axis-ds/tokens@^1.8.0` 을 선언하고 앱은 비운 npm 워크스페이스에서 수정본 `axis check` 의 dependencies 항목:

| 단계 | 결과 |
|---|---|
| 설치 전 | WARN 「… → 워크스페이스 루트에서 npm install」 |
| 종전 안내대로 앱 디렉터리에서 `npm install`(rc 0) | WARN 그대로(같은 문장) |
| 새 안내대로 루트에서 `npm install`(rc 0) | PASS 「필수 및 권장 의존성이 선언 · 설치되어 있습니다 (4개 확인, 워크스페이스 루트에 선언: …)」 |

env · 플래그 주입 없이 fixture 디렉터리에서 그대로 실행했어요.

## 3. 테스트 (새로 더함)

cli `src/wi-0096-root-install.test.ts`(9건):

| describe | 행 | 판별력 |
|---|---|---|
| `installCommandPhrase` | npm · pnpm · yarn × 루트 선언 있음 · 없음 6행 | 헬퍼 단위(음성 대조 때도 초록, 헬퍼는 남겼으므로) |
| check dependencies | 루트 선언 · 미설치 npm · pnpm · yarn | npm 행이 판별, pnpm · yarn 은 음성 대조 |
| | 앱 선언 · 미설치 세 매니저 | 음성 대조(종전 문구 고정) |
| | npm 앱 · 루트 섞임, 같은 것에 앱 `package-lock.json` | Q111 · Q113(check 는 P2 를 보지 않음) |
| init | utils 루트 선언 npm · pnpm · yarn, npm 앱 선언 | `runInit` 출력의 「설치는 실행하지 않았습니다」 줄 |
| | utils 일부 루트 + 나머지 앱 추가(add 갈래), 루트 선언 없음 대조 | Q111 |
| | 애니메이션 루트 선언 npm · pnpm · yarn, npm 앱 선언 | `animationGuideLine` |
| theme add | tokens · ui-react 루트 선언 미설치 npm · pnpm · yarn | 두 줄(설치 줄 · 보류 안내) 전체 문장 |
| | npm 앱 선언 미설치 | 음성 대조 |

mcp `src/tools/template.test.ts` describe 「WI-0096」(2건): `handleCheckProject` 로 루트 선언 npm · pnpm · yarn, npm 앱 선언과 섞임. CLI 테스트와 같은 문장이에요(같은 코어).

## 4. 음성 대조 (측정)

호출부 3파일(`dependencies-core.ts` · `theme/index.ts` · `init/init.ts`)만 main 으로 되돌리고(새 헬퍼는 남겨 import 오류가 아니라 동작 차이로 빨강이 나는지 봄) 새 · 갱신 테스트를 돌렸어요.

| 패키지 | 명령 | rc | 결과 |
|---|---|---|---|
| cli | `npx vitest run src/wi-0096-root-install.test.ts src/template/template-check.test.ts src/theme/theme-add.test.ts src/theme/theme-commands.test.ts` | 1 | `Tests  9 failed \| 505 passed (514)`: 새 9건 가운데 6건 빨강(초록 3건은 헬퍼 단위 · 앱 선언 음성 대조 2건), 갱신 3건 빨강 |
| mcp | `npx vitest run src/tools/template.test.ts` | 1 | `Tests  3 failed \| 82 passed (85)`: 새 2건 · 갱신 1건 빨강 |

복원은 미리 떠 둔 패치를 `git apply` 하고 네 소스 파일 diff 의 sha256 이 같은지(f2d5af40…) 확인했어요.

## 5. 검증 (수정본, 패키지 디렉터리에서 직접 실행, turbo 캐시 없음)

| 패키지 | 명령 | rc | 결과 |
|---|---|---|---|
| registry-core | `pnpm type-check` · `pnpm lint` | 0 · 0 | (테스트 러너 없음, 테스트는 cli 에 둠) |
| cli | `pnpm type-check` · `pnpm lint` · `pnpm test` | 0 · 0 · 0 | `Test Files  22 passed (22)`, `Tests  1175 passed (1175)`(main 1166 + 새 9) |
| mcp | `pnpm type-check` · `pnpm lint` · `pnpm test` | 0 · 0 · 0 | `Test Files  9 passed (9)`, `Tests  242 passed (242)`(main 240 + 새 2) |
| 저장소 | `pnpm check-changeset-mcp-tokens` | 0 | 「통과(registry-core → cli · mcp): @axis-ds/cli · @axis-ds/mcp 가 함께 올라가요」, 자체 테스트 `pass 19` |

출력 A/B(`run-cli.sh`, 2.2 와 같은 fixture 18개): 바뀐 파일 3개(npm 루트 선언의 theme add · init · check), 바뀐 줄 6줄 모두 설치 구절뿐. 나머지 15개는 바이트 같음. rc 는 18개 모두 0 으로 같음.

## 6. 결과

AC1 ~ AC9 충족(prd 3절). 남은 것은 Q110 ~ Q115 사용자 확인과 PR 리뷰 · 발행(Master)이에요.
