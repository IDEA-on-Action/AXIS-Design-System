# WI-0038 테스트 계획: `axis init` utils.ts 의존성 추가 · 안내

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 릴리스 노트: [release-notes.md](./release-notes.md)

## 1. 범위

- `packages/axis-cli` init 명령(FR-1 ~ FR-6)과 `axis-cli` 실행 안내 정정(D2)
- theme add 는 바꾸지 않습니다. 재사용하는 함수에 `export` 만 붙이므로 theme add 테스트가 수정 없이 통과하는지로 확인합니다.

## 2. 단위 테스트 (vitest, `packages/axis-cli`)

| ID | AC | 경우 | 기대 |
|---|---|---|---|
| U1 | AC3 | `package.json` 없음 | 파일을 만들지 않음, `pnpm add "clsx@^2.1.1" "tailwind-merge@^3.4.0"` 안내 |
| U2 | AC1 | `package.json` 있음, 두 의존성 없음 | `dependencies` 에 두 범위 추가, 나머지 키 · 순서 유지, `pnpm install` 안내 |
| U3 | AC2 | 둘 다 `dependencies` 에 있음 | `package.json` 바이트 불변, 쓰기 0 |
| U4 | AC2 | `devDependencies` 에 있음(하나 · 둘) | 그 범위 유지, `dependencies` 에 중복 추가 안 함 |
| U5 | AC4 | 탭 · 4칸 들여쓰기, CRLF, BOM, 끝 줄바꿈 없음 | 형식 유지, 결과가 JSON |
| U6 | AC4 | init 두 번 | 두 번째 실행 전후 디렉터리 스냅샷 같음 |
| U7 | AC5 | lockfile pnpm · yarn · npm · 없음 | `pnpm install` · `yarn install` · `npm install` · `pnpm install`, 추가 명령도 매니저별 |
| U8 | FR-3 | JSON 이 아님 · 최상위 배열 · `dependencies` 가 배열 · 실제 경로가 밖(심볼릭 링크) · 쓰기 권한 없음(0444, root 아닌 사용자 전제) | `package.json` 불변, 경고 + 추가 명령, rc 0 |
| U9 | FR-4 | 계획 뒤 `package.json` 변경 | 쓰지 않고 오류 |
| U10 | FR-5 | 모든 경우 | `child_process` 호출 0 |
| U11 | AC7 | 기본값 init | 기존 출력 줄 · `axis.config.json` · `utils.ts` 가 c131ee9 기준값과 같음 |
| U13 | FR-4 | 쓰는 도중 실패(파일을 자르고 ENOSPC 를 던지는 쓰기를 주입) · 복원도 실패 · 복원 내용 불일치 | 원래 내용으로 되돌림, 오류에 실패 원인과 복원 결과(성공 · 실패와 이유)를 담음 |
| U12 | AC6 | init 출력 · 소스 스캔 | `axis-cli` 실행 안내 0건, 스캔 대상 파일 수 > 0, 패턴이 알려진 나쁜 문자열을 잡는지 양성 대조 |

## 3. 실경로 스모크 (AC9)

- 프로젝트: `npx --yes create-next-app@15.5.28 <dir> --ts --tailwind --eslint --app --no-src-dir --use-pnpm --import-alias "@/*" --no-turbopack --skip-git`(WI-0028 T7-2 와 같은 명령)
- CLI: 이 브랜치 빌드를 `pnpm pack` 한 tarball 을 별도 디렉터리에 `npm install` 하고 그 `bin` 으로 실행합니다(수정본은 아직 npm 에 없음). 음성 대조는 c131ee9 빌드의 tarball 입니다.
- 절차: `axis init -y` → `pnpm install` → `pnpm build`. env · 의존성 주입 없음.

## 3.1 결과 (2026-10-19)

조건: 기준 `origin/main` c131ee9, 구현 커밋 ce163f9 · 2d75b39 와 이 문서 커밋의 테스트 1건 추가. Node v22.22.0 · pnpm 9.15.4(저장소) · vitest 2.1.9. 스모크 디렉터리의 pnpm 은 PATH 의 10.33.0, 레지스트리 https://registry.npmjs.org/, 주입 env 0개(`AXIS_` · `NEXT_` · `NPM_CONFIG` · `npm_config` · `PNPM_`).

| ID | AC | 명령 | 결과 |
|---|---|---|---|
| T1 | AC1~AC5 · AC7 | `npx vitest run src/init` (packages/axis-cli) | 33/33 통과(U1 ~ U11, 양성 대조 포함) |
| T2 | AC6 | `npx vitest run src/guidance.test.ts` | 3/3 통과. 스캔 파일 수 > 100, 위반 0건 |
| T3 | AC8 | `npx vitest run` (packages/axis-cli) | 12 파일 · 212건 통과(수정 전 10 파일 · 176건 + init 33 + guidance 3). theme 디렉터리 4 파일 · 81건 통과, `theme-add.test.ts` · `theme-add-rollback.test.ts` 는 고치지 않음 |
| T4 | AC8 | `pnpm turbo run test --force` | rc 0, 6/6 태스크 · `Cached: 0`. cli 211건(권한 테스트 추가 전) · mcp 24 · theme 31 · ui-react 110 · agentic-ui 72 |
| T5 | 품질 | `pnpm turbo run lint type-check --force` | rc 0, 12/12 · `Cached: 0` |
| T6 | 품질 | `pnpm build --force` | rc 0, 8/8 · `Cached: 0`(79초). 빌드가 고친 `apps/web/public/templates/*.json` 5개는 되돌림 |
| T7 | 품질 | `npx tsc --noEmit -p packages/axis-cli` | 오류 20건(수정 전과 같은 수, 모두 `src/library` · `src/template` 기존 오류, WI-0039). 새 파일 오류 0 |
| T8 | 음성 | `src/init/init.ts` 의 `applyUtilsDependencies` · `reportDependencies` 호출을 지운 변이로 `npx vitest run src/init` | 24/32 실패(권한 테스트 추가 전). 원본은 `git restore` 로 되돌림 |
| T9 | 음성 | 2d75b39 의 문구 변경(apps · monet · v0 · sync · library)을 `git apply -R` 한 상태로 `npx vitest run src/guidance.test.ts` | 1/3 실패, 위반 75줄(바꾼 79곳 중 index.ts list 2줄은 ce163f9 에 있어 되돌리지 않았고, 산문 2줄은 패턴 밖). `git restore` 로 되돌림 |
| T10 | AC9 | 3장 절차, 이 브랜치 tarball(sha256 `bb38a9a5b7e9801c`) | create-next-app rc 0 · init rc 0 · `pnpm install` rc 0 · **`pnpm build` rc 0**. `package.json` 차이는 `clsx ^2.1.1` · `tailwind-merge ^3.4.0` 두 줄, lockfile clsx 2.1.1 · tailwind-merge 3.7.0. init 출력 끝 줄 `npx @axis-ds/cli add button` |
| T11 | AC9 음성 | 같은 절차, c131ee9 tarball(sha256 `f7ee2f9e27895adb`) | init rc 0 · `package.json` 불변 · install rc 0 · **`pnpm build` rc 1**, `./src/components/ui/utils.ts:1:39 Type error: Cannot find module 'clsx'` |
| T12 | 참고 | WI-0028 T7-2 절차(init 뒤 `axis theme add ontology` 추가), 이 브랜치 tarball | 전 단계 rc 0, `pnpm build` rc 0, CSS 1개, `data-brand=ontology` 5건, `@axis-ds/tokens` 1.3.0 |

- 스모크 프로젝트: next 15.5.28 · react 19.1.0 · tailwindcss `^4`, `app/globals.css` 첫 줄 `@import "tailwindcss";`. CLI 는 tarball 을 별도 디렉터리에 `npm install` 해 그 `bin` 으로 실행했습니다(수정본은 npm 에 없음, 이것이 유일한 전제입니다).
- T12 는 WI-0028 AC2(b) 의 정식 재측정이 아닙니다. 판정 항목(① ~ ④)을 모두 본 재측정은 3.2 T15 · T16 이고, cli 배포본으로 하는 재확인은 배포 뒤에 남습니다.
- 변이 T8 · T9 는 워킹트리에서 하고 `git restore --source=HEAD` 로 되돌린 뒤 `git status` 0줄을 확인했습니다.

## 3.2 실경로 재측정 · 배포본 음성 대조 · WI-0028 T7-2 (2026-10-19)

조건: HEAD 6ec4219. `pnpm exec turbo run build --filter=@axis-ds/cli --force` rc 0(1/1, `Cached: 0`) 뒤 `pnpm pack` 한 tarball(sha256 `bb38a9a5b7e9801c`, 3.1 T10 과 같은 값)을 별도 디렉터리에 `npm install` 해 그 `bin` 으로 실행했습니다. 배포본 대조는 별도 디렉터리에 `npm install @axis-ds/cli@1.2.0`(integrity `sha512-tT1OPEvn...`)한 `bin` 입니다. Node v22.22.0, 스모크 디렉터리 pnpm 10.33.0, 레지스트리 https://registry.npmjs.org/, 주입 env 0개(`AXIS_` · `NEXT_` · `NPM_CONFIG` · `npm_config` · `PNPM_`). 세 프로젝트 모두 새 `create-next-app@15.5.28`(3장 명령, rc 0)이고 next 15.5.28 · tailwindcss 4.3.3 입니다.

| ID | AC | 절차 | 결과 |
|---|---|---|---|
| T13 | AC9 | create-next-app → 이 브랜치 CLI `axis init -y` → init 이 안내한 설치 명령 → `pnpm build` | init rc 0, 출력 `✓ package.json dependencies 에 추가: clsx@^2.1.1, tailwind-merge@^3.4.0` · `설치: pnpm install` · 끝 줄 `npx @axis-ds/cli add button`. `package.json` 차이는 두 줄. 안내된 `pnpm install` rc 0(lockfile clsx 2.1.1 · tailwind-merge 3.7.0). **`pnpm build` rc 0** |
| T14 | AC9 음성 | 같은 절차, npm 배포본 `@axis-ds/cli@1.2.0` | init rc 0, 의존성 안내 0줄 · 끝 줄 `npx axis-cli add button`, `package.json` 불변(diff rc 0). 안내된 설치 명령이 없어 `pnpm install`(rc 0)을 실행. **`pnpm build` rc 1**, `./src/components/ui/utils.ts:1:39 Type error: Cannot find module 'clsx' or its corresponding type declarations.`(`Compiled successfully` 뒤 타입 검사) |
| T15 | WI-0028 AC2(b) | create-next-app → `axis init -y` → `axis theme add ontology` → `pnpm install` → `pnpm build` (이 브랜치 CLI) | theme add rc 0, globalCss 없음 경고 뒤 `app/globals.css` 2행에 `@import "@axis-ds/tokens/css/brands/ontology";`(grep 1건). `pnpm install` rc 0, `@axis-ds/tokens` 1.3.0. **`pnpm build` rc 0**, `.next/static/css/*.css` 1개에서 `data-brand=["']?ontology` 5건. `axis check` rc 0, `PASS brand "ontology" import 가 app/globals.css에 있습니다 (globalCss ./src/app/globals.css 없음)`, `PASS 필수 및 권장 의존성이 모두 설치되어 있습니다`(WI-0028 측정 때는 WARN) |
| T16 | WI-0028 AC2(b) ④ | T13 프로젝트(theme add 없음)의 산출 CSS | CSS 1개, 같은 grep 0건 · rc 1(측정 수행 증명) |

- T15 의 `axis check` 에는 `FAIL tailwind.config 파일이 없습니다` 1건과 `WARN app/globals.css에 AXIS CSS 변수가 없습니다` 1건이 있습니다. Tailwind 4 기본 구성에 config 파일이 없어서 나오는 기존 항목이고 WI-0028 측정 때와 같습니다. 이 WI 범위 밖이며 AC2(b) 판정 항목(brand)이 아닙니다.
- 전제: 수정본이 npm 에 없어 CLI 만 이 브랜치 tarball 입니다. 프로젝트 의존성(`@axis-ds/tokens` 포함)은 모두 레지스트리에서 설치했고 다른 주입은 없습니다. cli patch 배포 뒤 배포본으로 T13 · T15 를 다시 확인합니다.
- `pnpm changeset status --verbose`(changeset 추가 뒤): rc 0, patch `@axis-ds/cli` 1.2.1(`.changeset/wi-0038-cli-init-utils-deps.md`), minor · major 없음.
- 같은 HEAD 에서 `npx vitest run`(packages/axis-cli): 12 파일 · 212건 통과.

## 3.3 보정: 쓰는 도중 실패 시 복원 (2026-10-19)

조건: 기준 HEAD 7aa5e55, 수정은 `src/init/init.ts` · `src/init/init.test.ts`. Node v22.22.0 · vitest 2.1.9. 쓰기 도중 실패는 root 없이 만들 수 있는 `ulimit -f 1`(1024B 한도, `trap '' XFSZ` 로 신호 대신 EFBIG)로 재현했습니다. 이 한도는 실경로에 없는 조건이고, 디스크 공간 · I/O 오류를 대신하는 실험 조건입니다. `package.json` 은 `{name, version, description, dependencies: {react}}` 에 `description` 길이로 크기를 맞췄습니다(init 이 더하는 내용이 54B 라 원본 1013B 는 쓰기만 한도를 넘고, 1053B 는 복원도 한도를 넘습니다). CLI 는 `pnpm build` 한 `dist/index.js` 를 `node` 로 실행했습니다.

| ID | AC | 명령 | 결과 |
|---|---|---|---|
| T17 | FR-4 | `npx vitest run src/init` (packages/axis-cli) | 36/36 통과(U13 3건 추가) |
| T18 | FR-4 음성 | HEAD 의 `init.ts` 로 같은 명령 | U13 3건 실패 · 33건 통과. 원본은 scratchpad 사본으로 되돌림 |
| T19 | FR-4 재현 | HEAD 빌드, 원본 1013B | rc 1, `EFBIG: file too large, write`, `package.json` 1024B 로 잘림 · JSON 파손(sha `cd55b1ac8430` → `51312d2d1ee6`) |
| T20 | FR-4 | 수정본 빌드, 원본 1013B | rc 1, `... 쓰는 도중 실패했습니다(EFBIG: file too large, write). 원래 내용으로 되돌렸습니다.` · `axis.config.json 과 utils.ts 는 이미 만들어졌습니다.` · 추가 명령 안내. `package.json` sha 전후 같음(`cd55b1ac8430`), JSON 정상 |
| T21 | FR-4 | 수정본 빌드, 원본 1053B(복원도 한도 초과) | rc 1, `원래 내용으로 되돌리지 못했습니다(EFBIG: file too large, write). 파일이 잘렸거나 비었을 수 있으니 버전 관리 도구 등으로 복구하세요.` 파일은 1024B 로 남음(복원 불가 사실을 알리는 경우) |
| T22 | AC9 | 3장 절차, 수정본 `pnpm exec turbo run build --filter=@axis-ds/cli --force`(1/1, `Cached: 0`) tarball(sha256 `7ae210780de251f8`) | create-next-app rc 0 · init rc 0(출력은 T13 과 같음) · `package.json` 차이 두 줄 · `pnpm install` rc 0 · **`pnpm build` rc 0**. 주입 env 0개 |
| T23 | 품질 | `npx vitest run` (packages/axis-cli) · `pnpm turbo run lint type-check --force` · `npx tsc --noEmit -p packages/axis-cli` | 215건 통과 · rc 0, 12/12, `Cached: 0` · 오류 20건(T7 과 같은 수, 새 파일 오류 0) |

- init 이 `axis.config.json` · `utils.ts` 를 쓴 뒤 `package.json` 을 쓰는 순서는 바꾸지 않았습니다(AC7 기준 출력 순서 유지). 그래서 rc 1 이면 두 파일은 이미 만들어진 상태이고, 출력에 그 사실을 적습니다.

