# WI-0081: 워크스페이스 앱의 설치 안내 명령과 dependencies 판정이 워크스페이스 루트를 봄 PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0081 | GitHub: #210 | 우선순위: P3 | 상태: Approved (2026-10-26 배치 6b 결정: 브리프 권장안 일괄 채택, project-todo 「배치 6b 결정」 줄이 정본)
> 기준: `main` 6d455f7 (linked 1.8.1 · cli 1.7.0 · mcp 1.4.0 발행됨) 위 브랜치 `fix/batch6b` 의 WI-0080 커밋 다음 | 묶음: 배치 6b (WI-0080 → **WI-0081** → Release, WI-0083 독립)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

- `packages/axis-registry-core/src/project.ts` 의 `detectInstallCommand(baseDir)` 는 lockfile 을 앱 디렉터리 한 층에서만 봤어요(수정 전 11-16행). 이슈 본문의 경로 `src/template/project.ts` 는 실재하지 않고, 실제 파일은 `src/project.ts` 예요.
  - npm workspaces(루트 `package-lock.json`) · yarn workspaces(루트 `yarn.lock`) 의 앱에서 lockfile 을 못 찾아 기본값 `pnpm install` 로 떨어졌어요. 발행본 cli 1.7.0 실측: fx-npm · fx-yarn 앱의 `init`「설치:」, init 애니메이션 안내, `theme add` 의 theme 설치 안내, `add` 의 의존성 명령 4줄이 모두 pnpm 이에요(testplan 2절).
  - pnpm 워크스페이스는 기본값과 같아 우연히 맞았어요. 판별력 있는 행은 npm · yarn 뿐이에요.
- `packages/axis-registry-core/src/template/dependencies-core.ts` 의 필수 판정은 앱 package.json 선언만 봤어요(수정 전 59-61행). 워크스페이스 루트에만 `tailwindcss` 를 선언한 앱은 설치본이 루트에 있어도 「필수 의존성 누락: tailwindcss」 FAIL, `axis check` rc 1 이었어요. 발행본 실측 4행(fx-npm d-rootonly · h-rootonly-ui, fx-pnpm d-rootonly, fx-pnpmhoisted d-rootonly). 같은 화면의 Tailwind 항목은 루트 설치본으로 PASS 라 서로 모순이었어요.
- 같은 코어를 MCP `axis.check_project` · `axis.install_component`(dependencyCommand) 가 번들해서 cli 와 mcp 가 같은 결함을 냈어요.

### 1.2 결정 (2026-10-26 배치 6b 결정, 사용자가 권장안 일괄 채택)

| # | 결정 | 근거 |
|---|---|---|
| D1 | lockfile 은 앱 층 → 없으면 가장 가까운 워크스페이스 루트(`pnpm-workspace.yaml` 또는 package.json `workspaces` 배열 · `{ packages: 배열 }`) 층만 인정. 그 사이 층의 lockfile 은 보지 않아요. 루트 판정 전에 `.git`(디렉터리 또는 파일)이 나오면 중단, 못 찾으면 종전 기본값 `pnpm install`. 같은 층에서는 워크스페이스 표지를 `.git` 보다 먼저 봐요. 같은 층에 lockfile 이 여럿이면 종전 우선순위(pnpm → yarn → npm) | 브리프 시뮬레이션: 결함 행(fx-npm npm, fx-yarn yarn)을 고치고 음성 대조(fx-outside · fx-gitstop)를 pnpm 으로 유지. 멤버십(글롭) 검사는 범위 · 위험이 커서 잔여 오차로 둬요 |
| D2 | package.json `packageManager` 필드는 쓰지 않아요 | 이슈 범위는 lockfile 상위 탐색. 후속 WI-0085(#217) 에서 검토 |
| D3 | `detectInstallCommand` 를 거치지 않는 pnpm 고정 안내(template apply · theme · mcp brand · mcp template · monet)는 고치지 않고 testplan 4절에 전수 목록만 남겨요 | WI-0085(#217) 로 분리. mcp brand.ts 의 「U6 범위」 결정을 뒤집지 않음 |
| D4 | dependencies 의 필수 · 권장 판정은 앱에 선언이 없으면 D1 의 `findWorkspaceRoot` 로 찾은 루트 package.json 선언도 인정하고, 문구 끝에 「워크스페이스 루트에 선언: …」을 붙여요. 그런 앱의 check rc 는 1→0 이 될 수 있어요(사용자 결정). 워크스페이스 밖 상위의 선언은 여전히 FAIL | 안내 명령과 의존성 판정이 같은 워크스페이스 경계를 써요. pnpm isolated 에서도 루트 devDependency 는 앱에서 해석돼 판정이 실행과 맞아요 |
| D5 | `findInstalledPackage` 에는 워크스페이스 멈춤을 두지 않아요 | 설치본 탐색은 Node 해석 방향(WI-0074 설계 경계 유지) |
| D6 | 단위 테스트는 vitest 가 실제로 도는 `packages/axis-cli/src` 아래에 둬요(`workspace-root.test.ts`) | registry-core 에는 test 스크립트 · 테스트 파일이 없음(반박 검토 major) |
| D7 | 버전: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(예상 1.7.1 · 1.4.1, 사용자 결정) | registry-core 는 private 이라 자동 범프가 없고, CI 검사(`check-changeset-mcp-tokens`, WI-0080 커밋에서 확장)가 cli · mcp 동반을 강제 |

### 1.3 범위 밖

- `tailwind-core.ts` 의 지역 `hasDependency`(detectTailwind 선언 폴백 · packageVersionGate · content 대상 · animation)는 앱 package.json 만 봐요. 그래서 루트에만 ui-react 를 선언한 Tailwind 3 앱은 content 대상이 생기지 않아요. WI-0086(#218) 로 분리했어요(WI-0027 과의 tailwind-core 충돌을 키우지 않기 위해서).
- `@axis-ds/*` 설치 확인 대상(dependencies 3단계)은 종전대로 앱 선언만 봐요.
- 워크스페이스 글롭이 앱을 포함하는지는 보지 않아요. 글롭에서 빠진 앱이 루트 아래 있으면 루트 lockfile · 선언을 채택해요(D1 잔여 오차, release-notes 에 기록).
- 서브모듈 · 중첩 저장소 안의 앱은 `.git` 에서 먼저 멈춰 바깥 루트 lockfile 에 닿지 않아요(의도, 테스트로 고정).

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | npm 워크스페이스 앱(앱 층 lockfile 없음)의 init「설치:」 · init 애니메이션 안내 · theme add 설치 안내 · add 의존성 명령이 npm 계열 | AC1 |
| FR-2 | yarn 워크스페이스 앱에서 같은 4줄과 check 미설치 WARN 의「→」안내가 yarn | AC2 |
| FR-3 | 워크스페이스가 아닌 상위의 lockfile, `.git` 너머의 lockfile 은 쓰지 않음 | AC3 |
| FR-4 | 앱 층 lockfile 이 루트보다 먼저, 단일 앱은 종전과 같음 | AC4 |
| FR-5 | lockfile 없는 워크스페이스 루트는 종전 기본값 pnpm, packageManager 무시 | AC5 |
| FR-6 | 루트에만 선언한 필수 · 권장 의존성을 인정하고 출처 표시, 워크스페이스 밖 선언은 FAIL | AC6 |
| FR-7 | 발행 뒤 발행본으로 같은 픽스처를 다시 재 예고한 줄만 바뀜 | AC7 |
| FR-8 | 호출처 · pnpm 고정 문자열 전수 목록 | AC8 |

### 2.1 AC

- **AC1**: fx-npm 형(루트 `package-lock.json` + workspaces)에서 4줄이 `npm install` 계열. 변이 M1(한 층 판독)에서 단위 2 · init 1 · theme add 1 · add 1 빨강.
- **AC2**: fx-yarn 형(루트 `yarn.lock` + workspaces, `{ packages }` 객체형 포함)에서 4줄 + check「→ yarn install」. 변이 M1 에서 빨강.
- **AC3**: fx-outside 형(상위 package.json 에 workspaces 없음)과 fx-gitstop 형(앱과 루트 사이 `.git`, 디렉터리 · 파일형)은 `pnpm install`. 변이 M2(멈춤 없는 상위 탐색) · M5(`.git` 멈춤 제거)에서 빨강.
- **AC4**: 앱 층 lockfile 우선(루트 npm · 앱 yarn.lock → yarn), 단일 앱 npm · yarn · pnpm 그대로. 변이 M3(루트 먼저)에서 빨강. 같은 층의 `.git` 과 표지는 표지 먼저(변이 M4 에서 빨강).
- **AC5**: `pnpm-workspace.yaml` 만 · workspaces 만 · packageManager `npm@` · `yarn@` 이 있어도 lockfile 이 없으면 `pnpm install`.
- **AC6**: 루트에만 tailwindcss 를 선언한 d-rootonly · h-rootonly-ui 형은 cli · mcp 모두 FAIL 이 사라지고「(워크스페이스 루트에 선언: tailwindcss)」, cli rc 1→0. 음성 대조: 워크스페이스 밖 상위 선언 · `.git` 너머 선언 · 어디에도 선언 없음은 FAIL 그대로. 변이 D1(루트 인정 제거) · D2(아무 상위나 인정) · D3(출처 표시 제거)에서 빨강.
- **AC7**: 배포 뒤 testplan 2절 `meas.sh` 를 새 발행본으로 다시 돌려, 수정 전 대비 바뀐 줄이 2절 표와 같아요(안내 8줄 · check cli 13줄 · mcp 9줄, 그 밖 전이 0).
- **AC8**: testplan 4절 전수 목록. 계측 대조군: 같은 grep 이 `project.ts` 의 `detectInstallCommand` 정의 줄을 잡아요.

## 3. 릴리스

- `@axis-ds/cli` patch · `@axis-ds/mcp` patch(예상 cli 1.7.1 · mcp 1.4.1). WI-0080 과 같은 Release PR 로 묶어요. linked 4패키지 · tokens 는 바뀌지 않아요.
- 동작 변경: 워크스페이스 앱의 안내 명령, dependencies 문구와 check 종료 코드(루트에만 선언한 앱 1→0).
