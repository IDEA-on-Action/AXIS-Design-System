# WI-0104: Tailwind 3 preset · tokens 줄의 exports 해석 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-30 | 상태: 착수 측정 · 구현 측정(2026-10-30)
> 측정 scratchpad(세션 임시 경로, 사라질 수 있음): `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/4ae00ed9-0062-46ea-b36b-1f1bfaf43fe2/scratchpad/w104/`. 이하 `$S` 로 줄여요
> 발행본: `$S/pub/node_modules/@axis-ds/{cli,mcp}`(cli 1.7.8 · mcp 1.4.7, npm 설치). Tailwind CLI 3.4.19(jiti 1.21.7 · postcss-import 15.1.0), Node 22.22.0, tokens 실패키지 1.8.2 를 복사해 변형. Next 14.2.33 + React 18.3.1 + Tailwind 3.4.19(`$S/next`)

## 1. fixture · 측정 명령

### 1.1 preset (`$S/scripts/mk.mjs`, 189칸)

- 모양 7: WI-0101 testplan 1절과 같아요(`cjs-bare-js` · `cjs-bare-cjs` · `cjs-default-js` · `esm-mjs` · `esm-js` · `ts` · `mjs-require`)
- 레이아웃: `A-<변형>` 단일 앱(앱 `dependencies` `^1.8.2`, 앱 `node_modules` 에 변형) · `W-<변형>` npm 워크스페이스(루트 `node_modules` 에 정상 1.8.2, 앱 `apps/web/node_modules` 에 변형, 앱 선언) · `W-none`(중첩 없음, 양성 대조)
- tokens 변형 13: `ok`(실패키지 그대로) · `noexp`(exports `{"./css": …}` 만, preset 파일 없음: Issue 재현) · `noexpf`(exports 에서 `./tailwind` 만 뺌, 파일 있음) · `noexports`(exports 없음, 파일 없음) · `noexportsf`(exports 없음, dist preset 파일 있음, 맨 경로 `tailwind` 없음) · `noexportsb`(exports 없음, 맨 경로 `tailwind.js` 있음) · `tmiss`(exports 정상, dist preset 파일 없음) · 조건만 `cimp`(import) · `creq`(require) · `cnode`(node) · `cdef`(default) · `cms`(module-sync, `.mjs` 대상) · `cstyle`(style)
- 명령(`$S/scripts/run.mjs`): 칸마다 ① `node <cli> check --dir <app>` 의 tailwind.config 줄과 rc ② MCP `axis.check_project`(stdio JSON-RPC 한 프로세스)의 같은 줄 ③ 앱에서 `node tailwindcss/lib/cli.js -c <설정> -i in.css -o out.css` 의 rc · `{` 개수 · `.bg-primary` 개수, 실패면 첫 오류 줄. 표는 `$S/scripts/table.mjs`

### 1.2 Tailwind 3 globals.css (`$S/scripts/mk-next.mjs`, 10칸)

- 앱: `src/app/layout.jsx` 가 `./globals.css` import, `tailwind.config.js`(`require(…).default`), `postcss.config.js`, 앱 `node_modules/@axis-ds/tokens` 정상 1.8.2(나머지는 `$S/next/node_modules` 심볼릭 링크)
- `sub-<상태>`: `src/app/globals.css` 가 `../styles/axis.css` 를 import, 그 파일에 `@import "@axis-ds/tokens/css";`, 그림자는 `src/styles/node_modules/@axis-ds/tokens`
- `entry-<상태>`: 진입 파일에 tokens 줄, 그림자는 `src/app/node_modules/@axis-ds/tokens`
- 그림자 상태: `none`(대조) · `ex`(`./css` 키 없음) · `em`(대상 파일 없음) · `n0`(exports 없음) · `mark`(파일이 `--shadow-marker` 만) · `ci` · `cs` · `creq`(`./css` 가 import · style · require 조건만, 파일은 표지)
- 명령(`$S/scripts/run-next.mjs`): `next build` rc, `.next/static/css` 의 `--axis-*` 정의 수 · 표지 수 · `.bg-primary` 수, 발행본 check 의 globals.css · tailwind.config 줄. MCP 대조는 `ITEM=globals.css node run.mjs nfx3 … --no-build`

## 2. 착수 측정 (발행본 cli 1.7.8 · mcp 1.4.7)

### 2.1 양성 대조

- 실빌드 측정이 동작함: `A-ok` · `W-ok` · `W-none` 21칸 모두 rc 0 · 규칙 5 · `.bg-primary` 1, Next `sub-none` rc 0 · 토큰 변수 568
- 해석기가 상위로 건너뛰는 경로가 측정에 잡힘: `W-noexports` 7칸 rc 0(앱 중첩 디렉터리를 지나 루트 설치본으로 풂), 같은 변형의 `A-noexports` 7칸은 rc 1
- check 판독이 동작함: 기존 버전 게이트는 이 fixture 에 걸리지 않지만(모두 1.8.2) WI-0101 회귀 테스트가 수정본에서 그대로 통과(3절)

### 2.2 preset 189칸

칸 = `CLI 심각도`(MCP 와 다르면 `CLI≠MCP`) / 실빌드(`rc 0 · 규칙 수 · .bg-primary 수` 또는 `rc 1`).

| 레이아웃 | cjs-bare-js | cjs-bare-cjs | cjs-default-js | esm-mjs | esm-js | ts | mjs-require |
|---|---|---|---|---|---|---|---|
| A-ok | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| A-noexp | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| A-noexpf | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| A-noexports | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| A-noexportsf | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| A-noexportsb | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| A-tmiss | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| A-cimp | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 1 |
| A-creq | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| A-cnode | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| A-cdef | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| A-cms | PASS / rc 0 · 2 · 0 | PASS / rc 0 · 2 · 0 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| A-cstyle | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| W-ok | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| W-noexp | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| W-noexpf | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| W-noexports | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| W-noexportsf | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| W-noexportsb | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| W-tmiss | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| W-cimp | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 1 |
| W-creq | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| W-cnode | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| W-cdef | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| W-cms | PASS / rc 0 · 2 · 0 | PASS / rc 0 · 2 · 0 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| W-cstyle | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| W-none | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |

- 거짓 PASS 78 · 거짓 WARN 0 · CLI≠MCP 0 · check rc 1 이 189/189(원인은 axis.config.json · globals.css 없음 FAIL)
- 실빌드 오류: `ERR_PACKAGE_PATH_NOT_EXPORTED` 50칸 · `Cannot find module '@axis-ds/tokens/tailwind'` 14칸(A-noexports · A-noexportsf) · `Cannot find module '<…>/dist/tailwind-preset.*'` 14칸(tmiss)
- 해석기 동작(이 표에서 읽음): ① exports 가 있으면 처음 잡힌 설치본에서 멈춤(W-noexp 가 루트 정상본이 있어도 rc 1) ② exports 가 없고 맨 경로 파일이 없으면 상위로(W-noexports rc 0) ③ `require()` 참조는 require · node · default · module-sync 조건에서 풀림, import · style 은 안 풀림 ④ ESM 참조(esm-mjs · esm-js · ts)는 import 만 · require 만 모두 풀림
- 재현: 같은 fixture 로 2회(`out-pub.tsv` · `out-pub2.tsv`) 1 ~ 10열 `cmp` rc 0
- 발행본과 소스가 같은지: `git log 2445270..HEAD -- packages/` 0줄, 같은 범위 전체 2줄(조회 동작)

### 2.3 해석은 되지만 preset 이 빠지는 칸

`cms`(module-sync 만, `.mjs` 대상) × CommonJS bare 4칸은 rc 0 · 규칙 2 · `.bg-primary` 0 이에요. `require(esm)` 이 모듈 네임스페이스를 돌려줘 bare require 가 preset 을 못 받아요(WI-0072 의 1.6.2 와 같은 모양). 발행본에 없는 모양이고 해석 여부가 아니라 내용 문제라 범위 밖이에요(prd 2.2).

### 2.4 Tailwind 3 globals.css 10칸 (Next 14.2.33)

| 칸 | Next rc | 토큰 변수 · 표지 · `.bg-primary` | 발행본 globals.css | 오류 |
|---|---|---|---|---|
| sub-none | 0 | 568 · 0 · 1 | PASS | - |
| sub-ex | 1 | - | PASS | `Package path ./css is not exported from package …/src/styles/node_modules/@axis-ds/tokens` |
| sub-em | 0 | 568 · 0 · 1 | PASS | - |
| sub-n0 | 0 | 568 · 0 · 1 | PASS | - |
| sub-mark | 0 | 0 · 1 · 1 | PASS | -(그림자 파일을 씀) |
| sub-ci | 1 | - | PASS | 같은 「not exported」 |
| sub-cs | 0 | 0 · 1 · 1 | PASS | -(그림자 파일을 씀) |
| sub-creq | 1 | - | PASS | 같은 「not exported」 |
| entry-ex | 1 | - | PASS | 같은 「not exported」(`…/src/app/node_modules/…`) |
| entry-n0 | 0 | 568 · 0 · 1 | PASS | - |

- 발행본 check rc 는 10칸 모두 1(axis.config.json 없음 FAIL), tailwind.config 는 모두 PASS
- Tailwind 3 CLI(postcss-import)로는 `sub-none` 도 「Failed to find '@axis-ds/tokens/css'」 rc 1 이라(정상 설치본에서도 exports 를 보지 않음) CSS 쪽 기준에서 뺐어요

### 2.5 발행된 tokens 의 `./tailwind` (`$S/scripts/exports-hist.mjs`, `npm view`)

1.1.0 ~ 1.6.2 는 `{ types, import, require }`(문자열), 1.7.0 ~ 1.8.2 는 `{ types, import: { types, default }, require: { types, default } }`. 17개 버전 모두 `./tailwind` 를 내보내요.

## 3. 구현 측정 (수정본, 2026-10-30)

### 3.1 preset 189칸 (`out-new.tsv`)

- 바뀐 칸: PASS → WARN 50(ERR_PACKAGE_PATH_NOT_EXPORTED 50칸과 정확히 같은 칸), 그 밖 139칸은 심각도 · 문구가 발행본과 바이트 같음
- 거짓 PASS 78 → 28(남은 28칸은 Q132 tmiss 14 · Q133 A-noexports · A-noexportsf 14), 거짓 WARN 0 → 0
- CLI = MCP 189/189, check rc 189/189 발행본과 같음(1 → 1)

### 3.2 Tailwind 3 globals.css 10칸 (`out-next-new.tsv` · `out-next3-new.tsv`)

| 칸 | Next rc | 수정본 globals.css |
|---|---|---|
| sub-ex · sub-ci · sub-creq | 1 | WARN 「src/app/globals.css에 @axis-ds/tokens/css import 가 있지만 그 줄이 있는 파일 위치에서 먼저 잡히는 src/styles/node_modules/@axis-ds/tokens(1.8.2)가 ./css 를 내보내지 않아 해석되지 않습니다 → 그 중첩 node_modules 의 @axis-ds/tokens 를 지우거나 다시 설치하세요 (src/styles/axis.css 의 import)」 |
| entry-ex | 1 | WARN(같은 문구, 경로 `src/app/node_modules/…`, 접미사 없음) |
| sub-none · sub-em · sub-n0 · sub-mark · sub-cs · entry-n0 | 0 | PASS(발행본과 바이트 같음) |

- 실빌드와 어긋나는 칸 4 → 0, CLI = MCP 10/10, check rc 10/10 같음

### 3.3 종료 코드 기준선 (`$S/scripts/mk-rc.mjs`, 6칸)

다른 항목이 모두 통과하도록(axis.config.json · `--axis-*` 정의 globals.css · lib/utils.ts · clsx · tailwind-merge 설치본, componentsDir `./src`) 2.2 의 칸을 복사한 fixture 예요.

| 칸 | 발행본 | 수정본 |
|---|---|---|
| A-ok/esm-mjs | PASS · rc 0 | PASS · rc 0 |
| A-noexp/esm-mjs · A-noexp/cjs-bare-js · W-noexp/ts · A-cimp/cjs-default-js | PASS · rc 0 | **WARN** · rc 0 |
| A-tmiss/esm-mjs | PASS · rc 0 | PASS · rc 0 |

CLI = MCP 12/12.

## 4. 회귀 테스트 · 음성 대조

- 새 테스트: cli `template-check.test.ts` 「WI-0104」 describe 12개, mcp `template.test.ts` 「handleCheckProject WI-0104」 2개
- 바뀐 기존 테스트: cli 「WI-0103 … 회귀 가드 > Tailwind 3: 하위 파일 쪽 tokens 그림자(미노출)」 1건(PASS → WARN 과 전체 문구, Q134)
- 음성 대조(registry-core `project.ts` · `tailwind-core.ts` 를 `git show HEAD:` 로 되돌림): cli 새 테스트 12개 가운데 9 빨강 · 3 초록(초록은 회귀 가드: AC4 정상 · tmiss · noexports, z5 형, Tailwind 4 교차. HEAD 에서도 PASS 가 맞는 칸), 바뀐 기존 테스트 1 빨강, mcp 새 테스트 2/2 빨강. 복원 뒤 sha256 앞 16자 `project.ts` a26253372256c992 · `tailwind-core.ts` 1cedc046fd94be02 가 보관본과 같음
- 교차 레이아웃 고정: 「AC2 Tailwind 3 + 중첩 설치본」(W-noexp · W-noexports · W-none × 7형태), 「교차: Tailwind 4 프로젝트의 preset 설정 파일」(미노출 설치본 + `tailwind.config.js` preset 이어도 Tailwind 4 판정만)

## 5. 변이 테스트 (`$S/scripts/mutate.py`, 적용 → cli 「WI-0104 | Tailwind 3: 하위 파일 쪽 tokens 그림자」 → 원복)

| 변이 | 결과 |
|---|---|
| m1 ESM 참조도 require 조건만(합집합 제거) | 빨강 1(AC3) |
| m2 대상 파일 없음도 판정 | 빨강 1(AC4 회귀 가드) |
| m3 Tailwind 3 CSS 줄도 모든 그림자 원인 | 빨강 1(하위 파일 em) |
| m4 Tailwind 3 CSS 줄 판정 끔 | 빨강 3(바뀐 기존 테스트 · 하위 파일 · 진입 파일) |
| m5 require 조건에서 module-sync 뺌 | 빨강 1(AC3 cms) |
| m6 앱 선언이면 exports 판정 건너뜀 | 빨강 6(AC1 · AC2 · AC3 · AC5 2 · 주석) |

6/6 빨강, 원복 뒤 sha256 이 보관본과 같음.

## 6. 결과

| 명령 | rc | 통과 |
|---|---|---|
| `pnpm turbo run type-check lint --filter=@axis-ds/registry-core --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 0 | 7/7 task, Cached 0 |
| `pnpm turbo run test --filter=@axis-ds/cli --filter=@axis-ds/mcp --filter=@axis-ds/registry-core --force` | 0 | cli 1178 · mcp 242, Cached 0 |
| `pnpm check-changeset-mcp-tokens` | 0 | registry-core → cli · mcp 함께 올림 통과, 자체 테스트 19/19 |

## 7. 남은 미측정

- Node 20(`require(esm)` · 타입 제거 기본값 다름)에서 ESM 설정 × import 조건만 설치본(prd 5절)
- Vite 등 Next 밖 Tailwind 3 CSS 파이프라인, Next 15 + Tailwind 3
- Tailwind 3 globals.css 의 「이 위치에서 안 보임」(z5 형): 테스트로 종전 PASS 를 고정만 했어요
- Windows
