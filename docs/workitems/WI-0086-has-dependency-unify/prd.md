# WI-0086: 의존성 선언 판정을 워크스페이스 루트까지 합치고 기준 디렉터리를 실경로로 PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0086 | GitHub: #218 | 우선순위: P3 | 상태: Approved (2026-10-26 배치 6c 결정, project-todo 「배치 6c 결정」 줄이 정본)
> 기준: `main` 1168942 (linked 1.8.1 · cli 1.7.1 · mcp 1.4.1 발행됨, 미발행 changeset 0) 위 브랜치 `fix/batch6c` | 묶음: 배치 6c (커밋 순서 **WI-0086** → WI-0085, 한 PR · 한 Release)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

착수 전 실측으로 브리프 줄 번호를 확인했어요(반박 검토 정정 반영: `findInstalledPackage` 229, `isPnpProject` 251). 결함은 세 갈래이고, 공통점은 선언 판독 · 경로 기준이 함수마다 따로 있었다는 거예요.

1. **tailwind-core 지역 `hasDependency`** (`packages/axis-registry-core/src/template/tailwind-core.ts` 수정 전 39행). 앱 package.json 만 보는 사본이 있어서 아래 7곳이 루트 선언을 못 봤어요. 설치본(`findInstalledPackage`)은 WI-0074 부터 루트까지 올라가므로 「설치본은 루트, 선언은 앱」 비대칭이었어요.
   - 204 `detectTailwind` 선언 폴백, 499 `axisPackagesBelowTailwind4`, 751 `packageVersionGate`(tokens CJS preset 게이트와 cli · mcp `brand-core.ts:534` 의 theme 게이트), 795 `tailwind4Issues` 컴포넌트 `tailwind.css`, 1184 `inspectTailwindContent` 패키지 대상, 1307 · 1329 `checkAnimationPlugin`.
   - 측정(worktree 의 수정 전 빌드본, 실제 설치 픽스처): 루트에만 ui-react 를 선언한 Tailwind 3 앱(g1-none, npm · pnpm · pnpm hoisted)은 `tailwind.content` · `animation` 항목이 아예 없고 rc 0. 브리프의 정답 축(Tailwind 3.4.19 CLI 앱 cwd 빌드)은 ui-react 선택자 0/388 이라 조용한 거짓 음성이에요. 루트에만 `tailwindcss ^4.1.0` 을 선언한 미설치 앱(noinst4/r-app)은 「tailwind.config 파일이 없습니다」 FAIL, rc 1.
2. **init utils · add 의존성 안내**: `packages/axis-cli/src/init/init.ts` 수정 전 421행 `planUtilsDependencies` 와 `packages/axis-registry-core/src/add/add.ts` 519행 `missingDependencies`(cli add · MCP `install_component`) 가 앱 선언만 봐서, 루트에 `clsx` · `tailwind-merge` 를 선언한 앱에 둘을 다시 써 넣거나(init, 3레이아웃 3/3) 다시 안내했어요(add). 루트 Tailwind 4 미설치 앱에는 Tailwind 3 범위 `tailwind-merge@^2.6.0` 을 썼어요.
3. **심링크 baseDir**: `project.ts` 의 `findWorkspaceRoot` · `findInstalledPackage` · `isPnpProject` 가 `path.resolve` 만 써서, 앱 디렉터리 자체를 가리키는 링크(`--dir <링크>` · MCP `targetDir`)를 주면 링크가 놓인 쪽 상위를 올라갔어요. 측정: 링크 행 60개 중 실경로 행과 같은 것 37/60(L1 18행 다름 + L2 절대 glob 1행 다름 + inst4 · noinst 행).

### 1.2 결정 (2026-10-26 배치 6c 결정, 사용자 결정 포함)

| # | 결정 | 근거 |
|---|---|---|
| D1 | `project.ts` 에 공용 헬퍼 `declaredDependency(baseDir, pkg, name, rootPkg?) -> { range, source: "app" \| "root" } \| undefined` 를 두고, tailwind-core 지역 사본을 지우고, dependencies-core 의 루트 인정도 이 헬퍼로. 쓰기는 앱 pkg 로만 | 브리프 D1 A. 판정 7곳 · init · add 가 같은 경계(`findWorkspaceRoot`, `.git` 멈춤, 워크스페이스 밖 불인정)를 씀 |
| D2 | 범위: tailwind-core 7곳 + init utils + cli add · MCP install(`add.ts`). theme add 쓰기 경로(`theme-add.ts:356 · 432-433`)는 고치지 않고 WI-0087(#222)로 | 사용자 결정. theme-add 433 은 앱 package.json 에 쓰는 첫 쓰기 경로라 rollback 범위가 커짐 |
| D3 | `declaredAxisPackages`(dependencies 3단계 `@axis-ds/*` 설치 확인 대상)는 앱 선언만 유지 | WI-0081 1.3 과 같음, 전이 표를 작게 |
| D4 | realpath 는 registry-core 공개 함수 진입부에서 한 번(`resolveBaseDir`, 실패 시 `path.resolve` 폴백). 찾은 설치본 dir 은 풀지 않음. `contentGlobCovers` 의 기준도 실경로 | 반박 검토 major: 브리프 M2 만으로는 절대 glob x 심링크에서 거짓 FAIL. 진입부 한 번이면 내부 호출(packageContentTarget · contentGlobBranchCovers)이 모두 실경로를 받음 |
| D5 | 버전: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(예상 1.7.2 · 1.4.2, WI-0085 와 한 Release) | WI-0080 · WI-0081 patch 선례(사용자 결정). 거짓 음성 수정 |
| D6 | 커밋 순서 WI-0086 → WI-0085(같은 `project.ts` · `add.ts` 를 고침) | 반박 검토 major: 경계 함수를 바꾸는 쪽이 먼저여야 packageManager 탐색도 같은 실경로 경계를 따름 |

### 1.3 범위 밖

- `axis theme add` 가 루트에 선언된 의존성을 앱 package.json 에 다시 쓰는 경로(theme-add 356 · 432-433): WI-0087. 다만 theme add 가 부르는 `detectTailwind` · `inspectTailwindContent` 는 공용 코어라 판단(Tailwind 버전 · content 안내)과 전역 CSS 에 쓰는 기본 토큰 줄(Tailwind 4 진입점)은 함께 바뀌어요(testplan 3.3 TA1, changeset · release-notes 에 기록). → WI-0087(#222)에서 해소(tokens · theme 판정과 Tailwind 4 컴포넌트 tailwind.css 줄이 루트 선언을 인정, 쓰기는 앱으로만).
- `axis init` 의 애니메이션 안내(init.ts 213 `animationGuideLine`)는 앱 선언만 봐요(종전부터). → WI-0087(#222)에서 해소(루트 선언 · 설치본을 보고 3갈래로 안내). 281 Tailwind 4 컴포넌트 import 안내 · 294 「@axis-ds/tokens 설치:」는 Tailwind 4 판정 전이로 루트 선언 tokens 를 다시 설치하라는 줄이 새로 생겨(testplan I5) 검토 후속에서 `declaredDependency` 로 고쳤어요.
- 워크스페이스 글롭 멤버십, yarn 레이아웃, Windows 의 realpath(subst · 대소문자) 동작은 재지 않았어요(추정 · 미검증).
- 링크 경로로 쓴 절대 content glob(`/links/app/node_modules/...`)은 기준이 실경로라 덮음으로 보지 않아요(추정, 측정 행 없음).
- pnpm 기본에서 앱 · 루트가 모두 ui-react 를 선언하면 앱 쪽 링크가 표본이 돼 `../../node_modules/...` content 가 FAIL 인 기존 거짓 FAIL(WI-0080 D1 표본 하나 설계, 브리프 위험 1): 이번 WI 가 만든 것이 아니고 바꾸지 않았어요(pnpm/c1-appdecl-up real 행 바이트 불변). → WI-0090(#227)에서 해소(실경로가 같은 상위 설치본을 표본으로 인정).

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | 루트에만 ui-react 를 선언한 Tailwind 3 앱에 content 항목 | AC1 |
| FR-2 | 같은 앱의 animation 항목(ui-react 사용 · tailwindcss-animate 선언 모두 루트 인정), Tailwind 4 컴포넌트 tailwind.css | AC2 |
| FR-3 | detectTailwind 선언 폴백 · 1.4.0 안내 · preset 게이트 · theme 게이트가 루트 선언을 근거로 | AC3 |
| FR-4 | init utils 가 루트 선언을 「이미 있음」으로, add 안내에서 루트 선언 제외, 쓰기는 앱만 | AC4 |
| FR-5 | 심링크 --dir · targetDir 가 실경로와 같은 판정(절대 glob 행 포함) | AC5 |
| FR-6 | pnpm 기본 레이아웃 제안 문구 불변(스토어 경로 누출 · 링크 기준 상대경로 없음) | AC6 |
| FR-7 | 전이 표 밖 전이 0, cli · mcp 대칭 | AC7 · AC8 |

### 2.1 AC

- **AC1**: 루트에만 ui-react 를 선언한 Tailwind 3 앱(npm · pnpm · pnpm hoisted, content `./app` 만)은 `tailwind.content` FAIL, 제안 `"../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` + 상위 경로 안내, cli rc 0→1. content 에 그 경로가 있으면 PASS · rc 0. 변이 V1 에서 빨강.
- **AC2**: 같은 앱에서 tailwindcss-animate 를 루트에 선언 · 설치하고 plugins 에 있으면 animation PASS, 없으면 「plugins 에 없음」 WARN(「선언 없음」 아님). Tailwind 4 설치 앱(루트 ui-react · tw-animate-css, CSS import 없음)은 컴포넌트 스캔 경로 WARN · animation WARN. 변이 V2 · V3 · V9 에서 빨강.
- **AC3**: 미설치 루트 `tailwindcss ^4.1.0` → `detectTailwind` = `{ major: 4, source: "declared" }`, 「tailwind.config 파일이 없습니다」 FAIL 이 사라지고 rc 1→0. 루트 tokens · ui-react `^1.3.0` 미설치 → 「1.4.0 이상 필요」 안내. 루트 tokens `^1.6.0` 미설치 CJS 설정 → preset 게이트 근거 「선언 ^1.6.0」. 루트 `@axis-ds/theme ^1.5.0` 미설치 → `packageVersionGate` 근거 `declared`(설치본이 있으면 설치본 우선). 변이 V4 · V7 · V8 에서 빨강.
- **AC4**: 루트에 clsx · tailwind-merge 를 선언한 워크스페이스 앱(npm · pnpm · pnpm hoisted 3/3 + noinst4 · inst4)에서 init -y 가 앱 package.json 을 바꾸지 않고(바이트 같음) 「(워크스페이스 루트에 선언: clsx, tailwind-merge)」. 루트 Tailwind 4 미설치에서 `^2.6.0` 을 쓰지 않음. add button 안내에 clsx · tailwind-merge 가 빠짐. 음성 대조: 앱 선언이면 종전 문구, 워크스페이스 밖 상위 · 어디에도 없음은 종전처럼 추가. 변이 V5 · V6 에서 빨강.
- **AC5**: 3레이아웃 x 6앱(g1-none · g1-up · g1-noanim · c1-appdecl · c1-appdecl-up · **c1-abs 절대 glob**) x {L1 앱 링크 · L2 루트 링크 · 링크로 cd} + noinst3 · noinst4 · inst4 x 2앱 x L1 = 60행이 같은 앱 실경로 행과 cli 판정 줄 · rc · mcp 줄 모두 같음(수정 전 37/60 → 60/60). ENOENT 행 불변. 변이 M1 · M2 에서 빨강.
- **AC6**: pnpm 기본 레이아웃(앱 node_modules/@axis-ds/ui-react 가 .pnpm 스토어 링크)의 real 행(c1-appdecl · c1-appdecl-up)이 수정 전과 바이트 같음(제안 `"./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"`). 링크로 줘도 같음. 변이 M3(찾은 dir 까지 realpath) · M1 에서 빨강.
- **AC7**: real 행 전이는 testplan 3절 표 12행뿐, 앱 선언 대조 · 설치본 우선 · ENOENT 행 전이 0. 계측 대조군: 같은 스크립트가 c1-appdecl real 3행에 content · animation 줄을 냄(수정 전 · 후 3/3).
- **AC8**: after 매트릭스 85행에서 cli 판정 줄 수와 mcp 판정 줄 수가 다른 행 0. MCP 단위 테스트(루트 선언 앱 · 링크 targetDir) 1건.
- **AC9**: 발행 뒤 새 발행본(cli 1.7.2 · mcp 1.4.2 예상)으로 testplan 2절 스크립트를 다시 돌려 바뀐 줄이 3절 표(WI-0085 전이와 합친 표)와 1:1.

## 3. 릴리스

- `@axis-ds/cli` patch · `@axis-ds/mcp` patch(예상 1.7.2 · 1.4.2, WI-0085 와 한 Release). registry-core 변경이라 `check-changeset-mcp-tokens` 가 cli · mcp 둘 다를 강제하고 이 WI 의 changeset 이 충족해요(로컬 실측: 「통과(registry-core → cli · mcp)」).
- 동작 변경: release-notes 의 다섯 가지(content FAIL 신규 rc 0→1, Tailwind 4 미설치 루트 rc 1→0, init · add 가 루트 선언을 다시 쓰거나 안내하지 않음, 심링크 판정 일치, brand theme 게이트 근거).
