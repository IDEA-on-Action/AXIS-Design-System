# WI-0085: pnpm 고정 설치 · 실행 안내를 대상 프로젝트 매니저로, lockfile 이 없으면 packageManager PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0085 | GitHub: #217 | 우선순위: P3 | 상태: Approved (2026-10-26 배치 6c 결정, project-todo 「배치 6c 결정」 줄이 정본)
> 기준: `main` 1168942 (linked 1.8.1 · cli 1.7.1 · mcp 1.4.1 발행됨, 미발행 changeset 0) 위 브랜치 `fix/batch6c`, WI-0086 커밋(0ad6d5e · e63553a) 위 | 묶음: 배치 6c (커밋 순서 WI-0086 → **WI-0085**, 한 PR · 한 Release)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

착수 전 grep 으로 위치를 다시 쟀어요(반박 검토가 정정한 MCP 호출부 줄 번호 701 · 737 · 729 확인). `detectInstallCommand` 를 거치지 않고 pnpm 을 박은 안내가 아래에 있었어요(수정 전 줄 번호).

| 위치 | 안내 | 대상 디렉터리 |
|---|---|---|
| `packages/axis-cli/src/template/template-apply.ts:159 · 162` | apply 「필요한 의존성」 `pnpm add …` · `pnpm add -D …`(따옴표 없음) | `--dir` |
| 같은 파일 `:289 · 290` | init 다음 단계 `pnpm install` · `pnpm dev` | 새 프로젝트 디렉터리 |
| `packages/axis-cli/src/theme/index.ts:103` | 빌드 전 「워크스페이스면 `pnpm --filter @axis-ds/tokens build`」 | `--dir` |
| `packages/axis-cli/src/monet.ts:214` | import 다음 단계 `(pnpm add ...)` | cwd |
| `packages/axis-mcp/src/tools/brand.ts:45 · 77 · 84 · 91` | list_brands · get_brand 3상태 안내 전부 pnpm(포매터가 대상 디렉터리를 모름) | `targetDir`(호출부 `index.ts:701 · 737`) |
| `packages/axis-mcp/src/tools/template.ts:533 · 536` | apply_template 「필요한 의존성」 `pnpm add …` | `targetDir` |

- 실경로 측정(WI-0086 커밋 위 빌드를 `pnpm pack` 해 새 디렉터리에 `npm install`, 15픽스처 x 11칸, testplan 2절): 기대 매니저와 다른 명령 **168/285**. 발행본 cli 1.7.1 · mcp 1.4.1 은 171/285(차이 3은 WI-0086 실경로 진입부로 링크 행 cli 설치 줄이 이미 고쳐진 것).
- `detectInstallCommand` 는 package.json `packageManager` 를 보지 않아(배치 6b D2), lockfile 없이 `packageManager` 만 있는 프로젝트(pm-npm-nolock · pm-yarn-nolock · ws-pm-*-nolock)는 이미 판정을 거치던 안내까지 pnpm 이었어요.
- 헬퍼 쪽: `project.ts` `addCommandFor` 에 dev 옵션이 없고 `add.ts` `addCommandForSpecs` 가 같은 분기를 따로 복제했으며, 스크립트 실행 · 워크스페이스 실행 명령을 만드는 헬퍼가 없었어요.

### 1.2 결정 (2026-10-26 배치 6c 결정, 사용자 결정 포함)

| # | 결정 | 근거 |
|---|---|---|
| D1 | `detectInstallCommand` 순서: 앱 층 lockfile → 워크스페이스 루트 층 lockfile → 앱 층 `packageManager` → 같은 루트 층 `packageManager` → pnpm. `packageManager` 는 `npm@` · `yarn@` · `pnpm@` 만, 모르는 이름(bun 등) · 문자열 아님 · 깨진 JSON 은 무시 | 사용자 결정(브리프 P1). lockfile 이 있는 행은 바뀌지 않음(「없을 때 종전 동작」). 경계는 lockfile 과 같음(워크스페이스가 아닌 상위 · `.git` 너머는 보지 않음). 배치 6b D2 · WI-0081 AC5 를 이 순위로 바꿈 |
| D2 | 빌드 전 tokens 안내의 워크스페이스 실행 명령을 매니저별로(`pnpm --filter X build` · `npm run build -w X` · `yarn workspace X build`) | 브리프 F1(기본안). lockfile 없는 행은 종전 문자열 |
| D3 | template apply · init 의존성 줄을 다른 안내처럼 따옴표로 감싸고(`"react@^19.0.0"`) dev 는 `-D` 옵션 헬퍼 | 브리프 T1(기본안), WI-0065 D7 원칙. 안내를 고정한 테스트 · 스모크 0건 |
| D4 | 헬퍼(`packageManagerOf` · `addCommandPrefix` · `addCommandFor` dev 옵션 · `runScriptCommand` · `workspaceRunCommand`)를 registry-core `project.ts` 한 곳에, `add.ts` `addCommandForSpecs` 도 그 위로(동작 불변) | 브리프 H1. cli · mcp 문자열 일치 |
| D5 | accordion 데모(`apps/web/src/app/(docs)/components/accordion/page.tsx:62 · 99`)는 그대로 | 데모 콘텐츠, Pages 배포가 섞이지 않음 |
| D6 | 매니저는 **템플릿 파일을 쓰기 전**의 프로젝트로 고름(apply · init · MCP apply_template) | 구현 중 발견: 템플릿 `package.json` 이 사용자 `package.json` 을 덮어써 `packageManager` 가 사라짐. 쓰기 뒤에 고르면 pm-npm 행이 pnpm 으로 남음(변이 A3) |
| D7 | MCP 포매터 3개(`formatTokensStatusGuide` · `formatListBrandsResult` · `formatGetBrandResult`)와 `ApplyTemplateResult.installCommand` 는 **선택 인자 · 선택 필드**(없으면 종전 pnpm) | tools/index.ts 에서 export 되는 공개 함수라 외부 사용처 호환 |
| D8 | U6 정정: U6 은 WI-0028 plan 의 tokens **버전 범위** 결정이고 pnpm 고정 결정이 아니었음을 `brand.ts` 주석과 WI-0081 prd D3 에 적음. MCP `axis.get_brand` 설명의 `defaultBrand` 예시는 WI-0065 D7-Provider 에 맞춰 `<html data-brand>` · `setBrand` 로 | 배치 6c 결정 · 브리프 부수 발견 |
| D9 | 버전: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(예상 1.7.2 · 1.4.2, WI-0086 과 한 Release) | 배치 6c 결정 |

### 1.3 범위 밖

- bun(`bun.lock` · `bun.lockb` · `packageManager bun@`)은 지원하지 않아요. 모르는 이름이라 pnpm 으로 남고, landing 설치 탭(pnpm · npm · bun)과는 어긋나요.
- Corepack 의 실제 탐색 방식(가장 가까운 package.json 인지, npm 을 가로채는지)은 재지 않았어요(추정 · 미측정). 이 설계는 Corepack 활성 여부와 무관하게 선언을 신호로만 써요.
- yarn 은 빈 `yarn.lock` 픽스처로만 쟀어요. `yarn workspace X build` · `yarn dev` 를 실제 yarn(classic · berry) 설치본에서 실행하지 않았어요(미측정). `npm run build -w X` 는 npm 7 이상 전제예요.
- `axis monet import` 의 실제 대화형(TTY) 출력은 재지 않았어요(판정 함수 `monetImportNextSteps` 단위 테스트로 고정).
- template init 은 새 디렉터리에서 판정해, 워크스페이스 글롭 밖 하위에 만든 새 프로젝트도 루트 lockfile 을 따라요(WI-0081 멤버십 잔여 오차).

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | template apply 의존성 줄이 대상 디렉터리 매니저 · 따옴표 · `-D` | AC1 |
| FR-2 | template init 다음 단계 install · dev 가 새 프로젝트 디렉터리 매니저 | AC2 |
| FR-3 | MCP apply_template 이 CLI 와 같은 명령 | AC3 |
| FR-4 | MCP list_brands · get_brand 3상태 안내가 targetDir 매니저, CLI theme list 와 같은 문자열 | AC4 |
| FR-5 | 빌드 전 워크스페이스 빌드 명령이 매니저별 | AC5 |
| FR-6 | monet import 다음 단계가 cwd 매니저 | AC6 |
| FR-7 | lockfile 이 없을 때만 packageManager | AC7 |
| FR-8 | 음성 대조 · 불변, 전수 grep | AC8 · AC9 |

### 2.1 AC

- **AC1**: ws-npm · single-npm → `npm install "…"` · `npm install -D "…"`, ws-yarn · single-yarn → `yarn add "…"` · `yarn add -D "…"`, lockfile 없음 → `pnpm add "…"` · `pnpm add -D "…"`. lockfile 없이 `packageManager npm@` 인 앱은 템플릿이 package.json 을 덮어써도 npm. 변이 A1(상수 pnpm) · A2(dev 누락) · A3(쓰기 뒤 판정)에서 빨강.
- **AC2**: ws-npm/apps/new → `npm install` · `npm run dev`, ws-yarn → `yarn install` · `yarn dev`, 루트 `packageManager yarn@` → yarn, ws-pnpm · 빈 tmpdir → `pnpm install` · `pnpm dev`. 음성 대조: 워크스페이스가 아닌 상위(single-npm/new)는 pnpm, cwd 가 npm 이어도 `--dir` 기준. 변이 I1(cwd 판정) · I2(pnpm dev 고정)에서 빨강.
- **AC3**: MCP `axis.apply_template` 의 명령이 같은 픽스처의 CLI `templateDependencyCommands` 결과와 같음(백틱만 다름), 결과 객체 `installCommand` = 쓰기 전 `detectInstallCommand`. `installCommand` 가 없는 종전 객체는 pnpm. 변이 M1 에서 빨강.
- **AC4**: list_brands · get_brand 의 미설치 · 미지원 · 빌드 전 안내가 targetDir 매니저(npm · yarn · packageManager), 없으면 종전 `pnpm add "@axis-ds/tokens@^1.6.0"`(기존 brand.test.ts 기대 그대로). CLI `tokensInstallCommand` · `tokensStatusGuide` 와 문자열 같음. 변이 B2(포매터가 인자 무시)에서 단위 테스트, B1(index.ts 가 넘기지 않음)에서 MCP stdio 실측이 빨강.
- **AC5**: 빌드 전 안내: pnpm(없음) → `pnpm --filter @axis-ds/tokens build`(theme-commands.test.ts 기존 기대 유지), npm → `npm run build -w @axis-ds/tokens`, yarn → `yarn workspace @axis-ds/tokens build`, cli · mcp 같음. 변이 W1 에서 빨강.
- **AC6**: monet import 다음 단계 2번 줄이 `(npm install ...)` · `(yarn add ...)` · `(pnpm add ...)`. 변이 N1 에서 빨강.
- **AC7**: lockfile 이 없을 때만 `packageManager`(앱 → 같은 워크스페이스 루트). conflict(package-lock + yarn@) → npm, 루트 yarn.lock + 앱 npm@ → yarn, 앱 npm@ + 루트 yarn@ → npm, 모르는 이름 · 문자열 아님 · 이름만 · 깨진 JSON → pnpm, 워크스페이스가 아닌 상위 · `.git` 너머 · 중간 층 → pnpm. WI-0081 AC5 의 packageManager 변형 2개는 npm · yarn 으로 뒤집히고 나머지 2개는 pnpm. 환경 가드: tmpdir 조상 package.json 에 `packageManager` 없음. 변이 P1 · P2 · P3 에서 빨강.
- **AC8**: 음성 대조(none · ws-pnpm · pm-bun-nolock · outside-pm-npm)는 template apply · apply_template · init 의 pnpm 의존성 줄에 따옴표가 붙는 것만 바뀌고 나머지 칸은 바이트 같음. 이미 판정을 거치던 줄(lockfile 이 있는 행의 theme 설치 줄)은 바이트 같음. rc 바뀐 칸 0.
- **AC9**: `grep -rnE "pnpm (add|install|dev)|pnpm --filter" packages/*/src --include=*.ts`(테스트 제외)에 남는 것이 기본값 · 주석 · 헬퍼 분기뿐. 계측 대조군: 같은 grep 이 `project.ts` `["pnpm-lock.yaml", "pnpm install"]` 를 잡음.
- **AC10**: 발행 뒤 새 발행본(cli 1.7.2 · mcp 1.4.2 예상)으로 testplan 2절 스크립트를 다시 돌려 수정 후(after) 표와 1:1(WI-0086 전이와 합친 표).

## 3. 릴리스

- `@axis-ds/cli` patch · `@axis-ds/mcp` patch(예상 1.7.2 · 1.4.2, WI-0086 과 한 Release). registry-core 변경이라 `check-changeset-mcp-tokens` 가 cli · mcp 둘 다를 강제하고, 로컬 실측 「통과(registry-core → cli · mcp)」(changeset 2개 모두 cli · mcp).
- 동작 변경은 안내 문구뿐이고 종료 코드 변화 0(측정). `packageManager` 만 있고 lockfile 이 없는 프로젝트는 이미 판정을 거치던 안내(init · theme add · add · check)도 npm · yarn 으로 바뀌어요(release-notes).
