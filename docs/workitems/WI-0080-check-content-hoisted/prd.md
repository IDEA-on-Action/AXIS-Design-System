# WI-0080: 호이스팅 모노레포에서 Tailwind 3 content 판정이 실제 설치 위치를 인정 PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0080 | GitHub: #209 | 우선순위: P3 | 상태: Approved (2026-10-26 배치 6b 결정: 브리프 권장안 일괄 채택, project-todo 「배치 6b 결정」 줄이 정본)
> 기준: `main` 6d455f7 (linked 1.8.1 · cli 1.7.0 · mcp 1.4.0 발행됨, 미발행 changeset 0) | 묶음: 배치 6b (**WI-0080** → WI-0081 → Release, WI-0083 독립)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

- registry-core `template/tailwind-core.ts` 의 `inspectTailwindContent` 는 선언된 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 표본을 `node_modules/<pkg>/dist/index.js`, 제안을 `./node_modules/<pkg>/dist/**/*.{js,mjs}` 로 고정했어요(수정 전 1055행). `contentGlobToRegExp` 는 앞의 `./` 만 지우고 `../` 는 글자 그대로 비교해서, 실제 위치 `../../node_modules/...` glob 은 표본과 맞을 수가 없었어요.
- 브리프 측정(발행본 cli 1.7.0 · mcp 1.4.0, 실제 설치 픽스처 4종 x content 변형 6 = 24행, 정답은 Tailwind 3.4.19 CLI 를 앱 디렉터리에서 실행한 빌드에서 ui-react 전용 선택자 402개가 모두 생기는지): 정답과 맞는 행은 12/24 예요. 이번 재측정(testplan 2절)에서 교집합 수로 같은 12/24 를 다시 셌어요.
  - 호이스팅(npm workspaces · pnpm `node-linker=hoisted`)의 실제 위치 `../../node_modules/...` 는 빌드 402/402 인데 FAIL(rc 1).
  - 같은 앱에서 check 가 제안한 `./node_modules/...` 를 넣으면 빌드 0/402 인데 PASS(거짓 PASS).
  - `./**/*.{js,mjs}` 는 호이스팅 앱에서 44/402 인데 PASS(정규식 `**` 가 `..` 세그먼트까지 먹음, 거짓 PASS).
  - 실제 위치를 가리키는 절대경로 glob 은 4픽스처 모두 402/402 인데 FAIL(거짓 FAIL).
- 같은 함수를 쓰는 세 번째 호출지 `axis theme add` 도 호이스팅 앱에 `./node_modules/...` 를 넣으라고 안내했어요(rc 0).
- 인접 공백(반박 검토 major): registry-core(private 0.0.0, cli · mcp 가 번들)를 바꾸는 PR 에 `@axis-ds/cli` · `@axis-ds/mcp` changeset 이 둘 다 붙었는지 보는 게이트가 없었어요. `scripts/check-changeset-mcp-tokens.mjs` 는 tokens → mcp 동반만 셌어요.

### 1.2 결정 (2026-10-26 배치 6b 결정)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 표본 · 제안 경로를 `findInstalledPackage(baseDir, name)` 로 찾은 설치본 dir 의 baseDir 기준 상대 경로(posix)로 써요. 제안은 상위 경로면 `./` 없이(`../../node_modules/...`), 아니면 종전처럼 `./`. 상위 어디에도 설치본이 없거나 Plug'n'Play 면 종전 `node_modules/<pkg>` | WI-0074 의 설치본 판독과 같은 함수 하나로 맞춰요. 브리프 시뮬레이션에서 pnpm 기본 · 단일 12행이 그대로였어요 |
| D2 | `**` 가 `..` 세그먼트를 넘는 판독도 함께 고쳐요: glob 과 표본의 앞쪽 `../` 개수가 같을 때만 덮은 것으로 봐요(`contentGlobCovers`) | D1 만 넣으면 표본이 `../` 로 시작해 `./**/*.{js,mjs}` 거짓 PASS(44/402)가 그대로 남아요 |
| D3 | 절대경로 glob 은 `resolve(baseDir, sample)`(posix) 와, 그 실경로(심링크를 푼 경로)와 비교해 인정해요(실경로 비교는 검토 후속: pnpm 기본 앱에서 `.pnpm` 스토어 실경로 절대 glob 은 빌드 372/372 인데 FAIL 이었음). 동적 표현(`path.join(__dirname, ...)`)은 종전처럼 dynamic → WARN | 4픽스처 모두 빌드 402/402 인데 FAIL 이었어요. 비교는 한 분기예요 |
| D4 | Tailwind 3 의 cwd 기준(relative 가 없으면 `process.cwd()`)은 판정에 반영하지 않고, 상위 경로 제안이 있을 때 문구 끝에 안내 한 줄(`CONTENT_PARENT_PATH_NOTE`, `relative: true` 권장)과 문서 한 줄을 둬요 | 측정: 호이스팅 up 은 앱 cwd 402, 루트 cwd 0, relobj 는 둘 다 402. next dev · npm -w · turbo 는 앱 cwd 로 실행해요. 판정을 낮추면 정상 사례가 WARN 소음이 돼요 |
| D5 | 세 호출지(cli `check` · mcp `check_project` · cli `theme add` 안내 `theme/index.ts`)는 같은 `t.suggest` 와 같은 안내 문자열을 써요 | 반박 검토 minor(theme add 출력 위치는 `theme/index.ts`) |
| D6 | `scripts/check-changeset-mcp-tokens.mjs` 를 넓혀 `packages/axis-registry-core/` 아래 파일을 바꾸면 미발행 changeset 에 cli · mcp 올림이 모두 있어야 통과하게 해요. 비교 기준은 PR 이면 `origin/<GITHUB_BASE_REF>` 와의 merge-base, push 면 push 이전 커밋(`github.event.before` → `AXIS_PUSH_BEFORE`)과의 merge-base(없거나 0 sha 면 `HEAD^`, 받지 못한 커밋이면 exit 2, 검토 후속), 로컬(그 밖)은 `origin/main` 과의 merge-base. 기준을 못 구하면 exit 2. frontend.yml ci job checkout 에 `fetch-depth: 0` | 사용자 결정(배치 6b). 조용히 통과하면 「0건 = 위반 없음」과 「측정 실패」가 구별되지 않아요. push 를 `HEAD^` 하나로 두면 rebase 머지(저장소 설정 허용) · 직접 push 의 앞 커밋 변경을 놓쳐요(검토 후속, 스크래치 클론 실측) |
| D7 | 덮음 판정 전에 glob 의 중괄호 갈래를 펼쳐 갈래마다 앞쪽 `../` 개수를 비교해요(갈래 256개 초과면 펼치지 않음, 검토 후속) | 반박 검토 실측: `{./src,../../node_modules/@axis-ds/ui-react/dist}/**/*.{js,mjs,tsx}` 는 npm · yarn workspaces 앱 cwd 빌드 372/372 인데 수정 전 · 후 모두 FAIL(앞쪽 `{` 때문에 `../` 를 0 으로 셈) |

### 1.3 범위 밖

- 루트에만 ui-react 를 선언한 앱은 content 대상이 생기지 않아요(tailwind-core 의 지역 `hasDependency` 가 앱 package.json 만 봄). WI-0086(#218) 로 분리됐어요. → 해소: WI-0086(#218, 배치 6c, 2026-10-26 구현, cli 1.7.2 · mcp 1.4.2 예정)
- `findInstalledPackage` 는 워크스페이스 경계에서 멈추지 않아요(배치 6b 결정: 멈춤을 두지 않음). 그래서 앱 · 워크스페이스에 설치본이 없고 홈 같은 상위에만 있으면 표본 · 제안이 `../../../../node_modules/...` 처럼 프로젝트 밖을 가리켜요. Node 해석과 같아 의도로 두고, 폴백은 「상위 어디에도 없을 때만」이에요(반박 검토 minor).
- 심링크를 거친 baseDir(`--dir` · MCP 인자)에서는 `findInstalledPackage` 가 `path.resolve` 만 써서 심링크 쪽 상위를 올라가요. 실경로 쪽 워크스페이스의 설치본을 못 찾으면 종전 표본 `node_modules/<pkg>` 로 돌아가요(종전과 같은 동작, 회귀 아님, 검토 minor 를 잔여 경계로 기록). cwd 로 실행할 때는 `process.cwd()` 가 실경로라 해당하지 않아요.
- WI-0027 이 같은 `tailwind-core.ts` 를 고칠 예정이라 이 WI 를 먼저 머지해요(project-todo 388행).

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | 호이스팅 앱에서 content 에 실제 위치 `../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` 가 있으면 PASS | AC1 |
| FR-2 | 같은 앱에서 ui-react 를 덮지 않으면 제안이 `"../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` 이고, 세 호출지가 같은 문자열 + cwd 안내 | AC2 |
| FR-3 | 호이스팅 앱의 `./node_modules/...` 만이면 FAIL(종전 거짓 PASS) | AC3 |
| FR-4 | pnpm 기본(앱 node_modules 링크) 판정 · 문구는 수정 전과 바이트 같음(abs 행 제외) | AC4 |
| FR-5 | 단일 프로젝트 · 미설치 · Plug'n'Play 는 종전 표본 · 제안 | AC5 |
| FR-6 | `**` 는 `../` 를 넘지 않음 | AC6 |
| FR-7 | 실제 위치를 가리키는 절대경로 glob 은 PASS, 다른 절대경로는 FAIL | AC7 |
| FR-8 | 발행 뒤 발행본으로 24행 매트릭스를 다시 재 정답 일치 24/24, cli · mcp 불일치 0 | AC8 |
| FR-9 | registry-core 변경에 cli · mcp changeset 동반을 CI 가 강제, 기준 없음은 exit 2, Release PR · 무관 PR 은 통과 | AC9 |

### 2.1 AC

- **AC1**: hoisted 에서 `up` · `relobj` → PASS. 변이 M1(표본을 `node_modules/${name}` 로 고정)에서 CLI 6 · MCP 1 빨강.
- **AC2**: hoisted `none` · `local` → FAIL, 제안 `../../node_modules/...` + ` (상위 경로는 Tailwind 3 가 ...)`. theme add 출력에도 같은 제안 + 안내 1줄. 변이 M5(`./` 생략 제거) · M6(check 안내 제거) · M7(theme add 안내 제거)에서 빨강. 빌드 실측: 이 제안은 앱 cwd 402/402, 종전 제안은 0/402.
- **AC3**: hoisted `local` → FAIL. 수정 전 발행본은 PASS(전이 확인, testplan 2절).
- **AC4**: pnpm-default · single 의 abs 밖 10행에서 수정 전 발행본과 수정 후 빌드본의 content 문구 · rc 가 10/10 같음. 단위 테스트 isolated(WI-0074 블록 f-tw3content 포함)는 수정 전 소스에서도 초록.
- **AC5**: 설치본 없음 → `./node_modules/...`, `.pnp.cjs` → 루트 설치본을 읽지 않음. 변이 M2(PnP 가드 제거)에서 빨강.
- **AC6**: hoisted `broad` → FAIL(빌드 44/402), single `broad` → PASS(402/402). 변이 M3(`../` 개수 비교 제거)에서 빨강.
- **AC7**: hoisted · isolated · single 의 `abs` → PASS, `absOther` → FAIL. 변이 M4(절대경로 분기 제거)에서 빨강.
- **AC8**: 배포 뒤 testplan 2절 `matrix2.mjs` 를 새 발행본으로 다시 돌려 after 열 24/24 · cliMcpMismatch 0 · 음성 대조 10/10.
- **AC9**: `check-changeset-mcp-tokens.test.mjs` 17건(위반 · 통과 · Release PR · merge-base · push HEAD^ · 기준 없음 rc 2 · 워킹트리). 변이 V1~V7 각각 1건 이상 빨강. 이 브랜치 자체로 양성 대조(changeset 없을 때 rc 1, 넣은 뒤 rc 0).

## 3. 릴리스

- `@axis-ds/cli` patch · `@axis-ds/mcp` patch(예상 cli 1.7.1 · mcp 1.4.1, 배치 6b 결정). linked 4패키지 · tokens 는 바뀌지 않아요. WI-0081 과 같은 Release PR 로 묶어요.
- 동작 변경: 호이스팅 Tailwind 3 앱의 tailwind.content 판정 · 제안, 절대경로 glob 인정(모든 레이아웃), 상위 경로 안내 한 줄. 릴리스 노트에 세 호출지를 적어요.
