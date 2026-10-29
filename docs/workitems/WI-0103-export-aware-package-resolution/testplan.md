# WI-0103: exports 를 보는 패키지 CSS import 해석 테스트 계획

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 작성일: 2026-10-29 | 상태: 착수 측정(2절) · 구현 결과(4 ~ 7절) 반영(2026-10-29), 기대값은 사용자 결정 Q70 ~ Q79(모두 권장안) 기준
> 기준선 두 축: ① 문제 재현(음성 대조)은 **npm 발행본 cli 1.7.7 · mcp 1.4.6**(`$S/pub/node_modules/@axis-ds`) ② 「수정 전후 불변」(AC7 · AC9)은 착수 직전 HEAD 빌드 사본(f9785c2, 7절)
> `S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad`(세션 임시 경로, 구현 때 사라질 수 있음)

## 1. fixture · 측정 명령

- 실설치본: `$S/WI-0103/build/tw4`(npm install, `@axis-ds/tokens` · `ui-react` · `agentic-ui` 1.8.2, `tailwindcss` · `@tailwindcss/postcss` 4.1.14, `postcss` 8.5.6, `clsx` 2.1.1, `tailwind-merge` 3.3.1, enhanced-resolve 5.26.0)
- 생성 · 실행: `$S/WI-0103/scripts/mx.sh [필터]`(`MXDIR` 로 출력 디렉터리 지정). fixture 하나를 check 와 실빌드가 **함께** 써요(앱 `node_modules` 는 실설치본을 항목별 심볼릭 링크로, 그림자는 실제 디렉터리). 그래서 check 용 stub 과 빌드용 설치본이 어긋나는 일이 없어요
- 앱 골격: `.git` · `lib/utils.ts` · `package.json`(tokens ^1.8.2 · clsx · tailwind-merge · tailwindcss ^4.1.14, 대상이 컴포넌트면 그 패키지 ^1.8.2) · `axis.config.json`(globalCss `./app/globals.css`) · `app/page.tsx`. 컴포넌트 칸은 진입 파일에 tokens 줄을 늘 둬요
- check: `judge.sh` 가 `out=$(NO_COLOR=1 node <cli> check --dir <d> 2>&1); rc=$?` 로 받고, MCP 는 `$S/WI-0100b/scripts/mcp-call.mjs`(stdio `axis.check_project`). `sev.mjs` 가 항목 줄을 순서로 읽어(2번째 Tailwind · 3번째 globals.css) 심각도와 CLI = MCP 를 적어요. 항목 줄이 0 이면 `items=0` 으로 계측 실패를 드러내요(147칸 모두 5 또는 6)
- 실빌드: `$S/WI-0100b/scripts/pcss.cjs <앱> app/globals.css <출력>`(앱의 `@tailwindcss/postcss` 를 `from` = 입력 실경로로 직접 부름, WI-0100a · 0100b 와 같은 방법). 산출 CSS 의 `--axis-` 줄 수와 그림자 표지 `--shadow-marker` 줄 수를 세요
- 판정 대상 항목: tokens 줄은 globals.css 항목, 컴포넌트 줄은 tailwind.config 항목이에요(`classify.mjs`). 「거짓 PASS」 = check PASS · 실빌드 rc 1, 「거짓 WARN」 = check WARN · 실빌드 rc 0

## 2. 착수 측정 (발행본 cli 1.7.7 · mcp 1.4.6)

### 2.1 양성 대조: WI-0100b 의 s3 · s7 · z5 재현

WI-0100b fixture 를 그대로 복사해 판정하고(`$S/WI-0103/pc`), 실빌드는 원본 빌드 fixture 를 다시 빌드했어요(`$S/WI-0103/scripts/pc.sh` → `$S/WI-0103/out/pc.tsv`).

| fixture | 출처 | check tailwind.config / globals.css (CLI = MCP) | check rc | 실빌드 | 재현 |
|---|---|---|---|---|---|
| s3 | `WI-0100b/q50/fx/s3` · 빌드 `q50/c/s3` | WARN(「이 파일 위치에서 @axis-ds/ui-react 를 찾지 못해 … globalCss 를 앱 안 파일로 바꾸세요 (app/vendor/sub.css 의 import)」) / PASS | 0 | rc 0 · `--axis-` 806 · 표지 0 | 재현(WI-0100b 4-1 절 「warn / pass」 · rc 0 · 806 과 같음) |
| s7 | `q50/fx/s7` · `q50/c/s7` | PASS / PASS | 0 | rc 1 「"./css/tailwind4" is not exported under the condition "style" from package …/app/vendor/node_modules/@axis-ds/tokens」 | 재현 |
| z5 | `q50-verify-correctness/fx/z5` · `bfx/z5` | PASS / PASS(「(src/styles/axis.css 의 import)」), dependencies 는 tokens 미설치 WARN | 0 | rc 1 「Can't resolve '@axis-ds/tokens/css/tailwind4' in '…/z5/src/styles'」 | 재현(`build.tsv` 의 z5 rc 1 과 같음) |
| z5c · z5r | 같은 출처 | PASS / PASS | 0 | rc 0 · 570 | 대조(종전과 같음) |

### 2.2 그림자 상태와 실빌드 해석기의 동작

그림자 버전은 tokens 1.2.0 · 컴포넌트 1.3.0, 그림자 파일 내용은 `:root{--shadow-marker:1}` 이에요. subpath 는 tokens `./css/tailwind4`(대상 `dist/css/tailwind4.css`) · 컴포넌트 `./tailwind.css`(대상 `tailwind.css`), 「맨 경로」는 tokens `css/tailwind4.css` · 컴포넌트 `tailwind.css` 예요.

| 상태 | 그림자 package.json · 파일 | 실빌드(147칸 모두 같은 동작) | 해석기가 하는 일 |
|---|---|---|---|
| n0 | `exports` 없음 · 파일 없음(s3 · s8) | rc 0, 표지 0, 토큰 변수가 상위 설치본 값(806 · 570 · 738) | 그림자를 **건너뛰고** 상위 `node_modules` 로 |
| nf | `exports` 없음 · 맨 경로에 파일(s6) | rc 0, 표지 1 | 그림자 파일을 씀 |
| es | `exports` 에 subpath · 대상 파일 있음(s9) | rc 0, 표지 1 | 그림자 파일을 씀 |
| em | `exports` 에 subpath · 대상 파일 없음 | rc 1 「Package path ./tailwind.css is exported from package …, but no valid target file was found」 | **멈추고 실패**(상위로 가지 않음) |
| ex | `exports` 에 `"."` 만 · 맨 경로에 파일 있음 | rc 1 「"./tailwind.css" is not exported under the condition "style"」 | 멈추고 실패(파일이 있어도) |
| ex0 | `exports` 에 `"."` 만 · 파일 없음(s5 · s7, 발행된 1.4.0 미만과 같은 모양) | rc 1, 같은 오류 | 멈추고 실패 |
| cs | subpath 값이 `{ "style": … }` · 파일 있음 | rc 0, 표지 1 | 그림자 파일 |
| cd | subpath 값이 `{ "default": … }` · 파일 있음 | rc 0, 표지 1 | 그림자 파일(`default` 는 늘 맞는 조건) |
| ci | subpath 값이 `{ "import": … }` 만 · 파일 있음 | rc 1 「not exported under the condition "style"」 | 멈추고 실패 |
| np | package.json 없음 · 맨 경로에 파일 | rc 0, 표지 1 | 그림자 파일 |
| np0 | package.json 없음 · 파일 없음(빈 `dist/`) | rc 0, 표지 0 | 건너뛰고 상위로 |

해석기 설정은 `@tailwindcss/node` 4.1.14 `dist/index.js` 의 `ResolverFactory.createResolver({ …, extensions: [".css"], mainFields: ["style"], conditionNames: ["style"], … })` 예요(측정). 이 표가 plan 1절 모델의 기준이에요.

### 2.3 교차 표 (위치 × 상태 × 대상 패키지, 147칸)

위치: **P1** 하위 파일 쪽(`app/vendor/node_modules`, 줄은 `app/vendor/sub.css`) · **P2** 진입 파일 쪽(`app/node_modules`, 줄은 `app/globals.css`) · **P3** 진입 파일 쪽(`app/node_modules`, 줄은 하위 파일) · **P4** 둘 다(같은 상태의 그림자를 두 곳에, 줄은 하위 파일). 앱 루트 `node_modules` 에는 늘 정상 1.8.2 설치본이 있어요(z5 계열 제외).

- P1 · P3 · P4 는 99칸(3패키지 × 11상태 × 3위치) 모두 check 판정 · 실빌드가 같아요(측정). 하위 파일이 진입 파일 디렉터리 아래에 있어 어느 쪽이든 같은 그림자를 먼저 만나요
- ui-react 와 agentic-ui 는 49칸 모두 같아요(측정, 「컴포넌트」 열로 묶음)
- 칸 값은 check 판정이고, **굵게**는 실빌드와 어긋난 칸이에요. CLI = MCP 147/147, check rc 147/147 이 0 이에요

| 상태 | 실빌드 | tokens P1 · P3 · P4 | tokens P2 | 컴포넌트 P1 · P3 · P4 | 컴포넌트 P2 |
|---|---|---|---|---|---|
| (그림자 없음, P0e · P0s) | rc 0 | PASS | PASS | PASS | PASS |
| n0 | rc 0(상위) | PASS | PASS | **WARN**(위치 해석 불가 문구) | PASS |
| nf | rc 0(그림자 파일) | PASS | PASS | PASS | PASS |
| es | rc 0(그림자 파일) | PASS | PASS | PASS | PASS |
| em | rc 1(대상 파일 없음) | **PASS** | **PASS** | WARN(위치 해석 불가 문구, 원인과 다름) | **PASS** |
| ex | rc 1(미노출) | **PASS** | **PASS** | **PASS** | **PASS** |
| ex0 | rc 1(미노출) | **PASS** | **PASS** | WARN(위치 해석 불가 문구, 원인과 다름) | **PASS** |
| cs | rc 0(그림자 파일) | PASS | PASS | PASS | PASS |
| cd | rc 0(그림자 파일) | PASS | PASS | PASS | PASS |
| ci | rc 1(미노출) | **PASS** | **PASS** | **PASS** | **PASS** |
| np | rc 0(그림자 파일) | PASS | PASS | PASS | PASS |
| np0 | rc 0(상위) | PASS | PASS | PASS | PASS |

| z5 계열(진입 `src/app/globals.css`, 하위 `src/styles/axis.css`, 대상 패키지는 앱 루트에 없음) | 실빌드 | tokens | 컴포넌트 |
|---|---|---|---|
| z5 설치본은 `src/app/node_modules` 에만, 줄은 하위 파일 | rc 1 「Can't resolve … in '…/src/styles'」 | **PASS** | **PASS** |
| z5c 같은 설치, 줄은 진입 파일 | rc 0 | PASS | PASS |
| z5r 설치본은 `src/styles/node_modules` 에만, 줄은 하위 파일 | rc 0 | PASS | PASS |

합계: 거짓 PASS 39(tokens 16 · 하위 파일 컴포넌트 12 · 진입 파일 컴포넌트 8 · z5 3) · 거짓 WARN 6 · 맞는 WARN 12(문구가 원인과 다름) · 맞음 90(그 가운데 tokens 그림자 파일을 쓴 20칸은 산출 `--axis-` 0, prd 2.3). 칸별 원자료는 `$S/WI-0103/out/table.md`(49행 전체) · `classified.tsv` · `all.tsv` 예요.

- tokens 줄은 그림자 상태와 상관없이 PASS 예요. 하위 파일 줄도 「처음 만난 설치본 디렉터리가 있음」만 보고(`outsideCssPackageResolution` 에 `file` 을 넘기지 않음), 진입 파일 줄은 위치 판정을 하지 않아요
- 컴포넌트 하위 파일 줄은 처음 만난 설치본의 `tailwind.css` 파일 존재만 봐서, ex(파일 있음 · 미노출)는 PASS, n0(파일 없음 · 건너뜀)은 WARN 이에요
- 발행본 모양(prd 1.1): 1.4.0 미만 그림자는 ex0 이에요. 이 모양이 진입 파일 쪽(P2)에 있으면 세 패키지 모두 거짓 PASS 예요

### 2.4 발행된 AXIS 버전의 exports (`$S/WI-0103/out/exports-hist.tsv`)

tokens · ui-react · agentic-ui 1.1.0 ~ 1.8.2 모두 `exports` 가 있어요. 패턴 키 · 조건부 CSS 값은 0건이에요. `./css/tailwind4` · `./tailwind.css` 는 1.4.0 부터예요(1.3.0 까지 `null`).

## 3. 기대값 (권장안 기준)

| 칸 | 발행본 | 수정본 기대 | rc |
|---|---|---|---|
| tokens P1 ~ P4 × em · ex · ex0 · ci (16) | PASS | globals.css WARN, 그림자 문구(미노출 · 대상 파일 없음) + 출처 접미사(P1 · P3 · P4) | 0 → 0 |
| 컴포넌트 P1 · P3 · P4 × ex · ci (12) | PASS | tailwind.config WARN, 미노출 문구 | 0 → 0 |
| 컴포넌트 P1 · P3 · P4 × n0 (6) | WARN | PASS(발행본 n0 없는 P0s 와 바이트 같음) | 0 → 0 |
| 컴포넌트 P1 · P3 · P4 × em · ex0 (12) | WARN(Q37 문구) | WARN, 그림자 문구(대상 파일 없음 · 미노출). 「globalCss 를 앱 안 파일로 바꾸세요」 없음 | 0 → 0 |
| 컴포넌트 P2 × em · ex · ex0 · ci (8) | PASS | WARN, 그림자 문구(출처 접미사 없음, 진입 파일) | 0 → 0 |
| z5 (3) | PASS | WARN, 「설치본이 src/app/node_modules/<name> 에만 있음」 문구 | 0 → 0 |
| 나머지 90칸(P0 6 · nf · es · cs · cd · np · np0 72 · tokens n0 P1 ~ P4 와 컴포넌트 n0 P2 6 · z5c · z5r 6) | PASS | 발행본과 항목 줄 바이트 같음 | 0 → 0 |
| WI-0097 Q37 fixture(밖 진입 파일) | WARN(Q37 문구) | 바이트 같음 | 불변 |
| 앱 선언 · 어디에도 미설치(Q28 가드, z5 에서 `src/app/node_modules` 를 뺀 형태) | PASS | PASS | 불변 |

- 다른 항목(axis.config · utils · dependencies · animation) 줄은 147칸 모두 발행본과 같아야 해요
- 단위 테스트(해석기): 2.2 의 11상태 + 문자열 단축형 · 중첩 조건 · 배열 대상 · `null` 대상 · 패턴 키(`unknown`) · 실경로 비교(심볼릭 링크) · Plug'n'Play(`cssPackageLineResolution` 이 `ok`) · 반박 검증 보정(거짓 값 exports · 대상 `.css` · `index.css` · 조건 안 `null`)
- 문구는 반박 검증 보정 뒤 「그 줄이 있는 파일 위치에서 …」 형태예요(plan 3절)

## 4. 착수 뒤 측정한 축 · 남은 미측정

### 4.1 Next.js 15 대표 칸 (`$S/WI-0103/scripts/nextb.sh` → `out/next.tsv`)

Next 15.1.4 + `@tailwindcss/postcss` 4.1.14(`next build`)로 재 보니 `pcss.cjs` 직접 호출과 결과가 같았어요(측정, 2026-10-29).

| 칸 | Next rc | 오류 첫 줄 · 산출 | 2.2 · 2.3 과 |
|---|---|---|---|
| tok-P1-ex0 | 1 | 「"./css/tailwind4" is not exported under the condition "style" from package …/app/vendor/node_modules/@axis-ds/tokens」 | 같음 |
| ui-P2-ex0 | 1 | 「"./tailwind.css" is not exported under the condition "style" from package …/app/node_modules/@axis-ds/ui-react」 | 같음 |
| ui-P1-n0 | 0 | `--axis-` 556 | 같음(그림자를 건너뜀) |
| tok-z5 | 1 | 「Can't resolve '@axis-ds/tokens/css/tailwind4' in '…/src/styles'」 | 같음 |
| ctl(그림자 없음, 양성 대조) | 0 | `--axis-` 556 | - |

- 측정 도구 주의(반박 검증): 진입 CSS 가 심볼릭 링크이면 `pcss.cjs` 는 `from` 을 실경로로 바꾸지 않아 Next 와 결과가 달라요(review-correct `d17`: pcss rc 0, Next rc 1, 신판 WARN 이 맞음). 이런 칸은 Next 로만 판정해요

### 4.2 pnpm 기본 레이아웃 (`$S/WI-0103/scripts/pnpm.sh`)

| 칸 | 실빌드 | 기준선 globals.css | 신판 globals.css |
|---|---|---|---|
| pn-shadow: `app/node_modules/@axis-ds/tokens` → `.pnpm/@axis-ds+tokens@1.2.0/…`(미노출) | rc 1 「not exported」 | PASS | WARN, 그림자 경로는 링크 경로 `app/node_modules/@axis-ds/tokens` |
| pn-same: 같은 1.8.2 스토어를 가리키는 다른 링크 | rc 0 | PASS | PASS(실경로가 같아 그림자 아님) |

### 4.3 남은 미측정 · 알려진 한계

| 축 | 상태 |
|---|---|
| Tailwind 3(postcss-import · Next css-loader) | 미측정. Q79 로 종전 그대로 |
| `tailwindcss` · `tw-animate-css` · 브랜드 import 의 그림자 | 미측정. Q78 로 종전 그대로 |
| 프로젝트 밖 진입 파일 옆의 그림자 | 측정(회귀 가드 테스트): 종전 Q37 판정 그대로라 실빌드가 실패하는 그림자도 PASS(추가 결정 Q70a) |
| 같은 줄이 두 파일에 있고 두 번째 위치에만 그림자(반박 검증 d19 · d19b) | 측정: 실빌드 rc 1 · 신판 PASS(처음 나온 줄만 판정, 추가 결정 Q70b) |
| 앱 기준 설치본이 stub · 손상이고 그 위 설치본이 빌드를 막음(반박 검증 R1) | 측정: 실빌드 rc 1 · 신판 PASS(종전으로 되돌림, 추가 결정 Q70c) |
| exports 대상이 `./` 로 시작하지 않음 · `./node_modules/` 대상 · 키에 조건과 경로가 섞임 · 깨진 package.json · 패턴 · 폴더 매핑(반박 검증 C) | 측정: 실빌드 rc 1 · 신판 PASS(`unknown`, 구판과 같음, 알려진 한계) |
| 대상에 `..` · 쿼리가 든 exports(반박 검증 c38 · c39) | 측정: WARN 은 맞고 원인 문구(「내보낸 파일이 없어」)만 실제 오류(무효 대상 · ENOENT)와 다름 |

## 5. 변이 테스트 (`$S/WI-0103/scripts/mut.sh` · `mut.py`, 적용 → cli `template-check.test.ts` · mcp `template.test.ts` 전체 → sha256 대조 원복)

최종 소스(반박 검증 보정 뒤)에서 19종 모두 cli 빨강, 원복 sha256 19/19 OK 예요(`out/mut2.tsv` · `out/mut2-v8.tsv`).

| 변이 | 잡아야 할 것 | cli 빨강 | mcp 빨강 |
|---|---|---|---|
| V1 `exports` 무시 | AC1 · AC2 · AC3 | 26 | 3 |
| V2 exports 없는 그림자에서 멈춤 | AC1 · AC3(n0) | 5 | 1 |
| V3 조건 `default` 뺌 | AC1(cd) | 4 | 0 |
| V4 조건에 `import` 더함 | AC1 · AC3(ci) | 6 | 0 |
| V5 대상 파일 없음을 해석됨으로 | AC1 · AC2(em) | 4 | 0 |
| V6 그림자 판별(실경로 비교) 제거 | AC7(workspace 링크 · pnpm) | 2 | 0 |
| V7 앱 안 진입 파일은 종전 | AC4(Q73) | 8 | 1 |
| V8 z5 규칙 제거 | AC5 | 1 | 1 |
| V9 z5 규칙을 「늘 WARN」으로 | AC5 Q28 가드 | 57 | 16 |
| V10 그림자 문구 대신 Q37 문구 | AC6 | 11 | 2 |
| V11 밖 진입 파일에도 새 판정 | AC7(Q37) | 4 | 1 |
| V12 레이아웃 JS import 갈래에 위치 판정 | AC7 | 1 | 0 |
| V13 Tailwind 3 에도 새 판정 | Q79 | 1 | 0 |
| V14 거짓 값 exports 를 exports 로 봄 | 반박 검증 A | 1 | 0 |
| V15 대상에 `.css` · `index.css` 를 붙이지 않음 | 반박 검증 B | 3 | 0 |
| V16 조건 안 `null` 을 다음 키로 넘김 | 반박 검증 c22 | 1 | 0 |
| V17 1.4.0 이상 미노출에도 「1.4.0 이상으로」 | 반박 검증 1-a | 1 | 0 |
| V18 z5 문구에서 줄 파일 표시 뺌 | 반박 검증 1-c | 1 | 1 |
| V19 앱 위 조상 설치본 가드 제거 | 반박 검증 R1 | 1 | 0 |

mcp 는 대표 3건만 있어 0 인 변이가 있어요(CLI 와 같은 코어를 번들, CLI = MCP 는 6절).

## 6. 반박 검증 (3관점, 독립 에이전트, a5aed60 대상)

| 관점 | 찾은 것 | 보정 |
|---|---|---|
| 정확성(54칸 교차, 실빌드 대조) | A: `exports` 가 `null` · `false` · `""` 인 그림자를 미노출로 봐 거짓 WARN(6칸). B: exports 대상에 `.css` · `index.css` 를 붙이지 않아 거짓 WARN(3칸). c22: 조건 안 `null` 을 다음 키로 넘겨 거짓 PASS. C · D 는 4.3 의 한계 | A · B · c22 를 고침(plan 1절 3단계 · 4단계), 변이 V14 ~ V16, 테스트 1건. 보정 뒤 9칸 모두 실빌드와 같음(`out/revfx.tsv`) |
| 회귀(54 + 큰 트리 8, 코퍼스 196) | R1: 앱 기준 설치본이 stub 이고 앱 위에 다른 설치본이 있으면 범위 밖 새 WARN(4칸, 「중첩」이라 부르며 지우라고 안내). R2: 하위 CSS 파일 수에 대해 제곱(6000개에서 +40%). F2 · F4(앱 선언 · 미설치 + 설치본이 다른 디렉터리에만)는 z5 규칙으로 WARN, 추가 결정 Q70d 로 확인 | R1: 잡힌 설치본이 앱 기준 설치본의 조상이면 종전(`isAncestorInstall`), 4칸 모두 PASS 로 되돌림, 변이 V19 · 테스트 1건. R2: 다른 파일 디렉터리 목록을 z5 판정에서만 Set 으로 만듦 |
| 문구 · 문서 | 1-a 이미 1.4.0 이상인데 「1.4.0 이상으로」, 1-b 「이 파일」이 진입 파일로 읽힘, 1-c z5 문구가 모순처럼 읽힘. changeset 전이 서술이 칸과 다름 · 「바뀌지 않는 것」 누락, README 의 거짓이 된 문장 · 새 bullet 의 1.7.7 서술, 주석 4-a ~ 4-h, plan · prd · testplan · todo 의 낡은 서술 | 문구 3건 고침(plan 3절, 「버전 모름」은 WI-0097 표현과 같게 둠), changeset 다시 씀, README 3곳, 주석, WI 문서 현행화. 다른 WI 문서의 거짓이 된 서술(WI-0100 prd:153 · release-notes:14 · :45)은 고치지 않고 release-notes 에 적음 |

## 7. 결과

| 항목 | 기준선 | 수정 뒤 | 비고 |
|---|---|---|---|
| 기준선 SHA · 빌드 사본 | f9785c2(패키지 소스 = main e103d43), `$S/WI-0103/dists/base` cli `index.js` sha256 앞 16자 df33d876e1e3bdef | 최종 `dists/new3` eb273eda56be7d55 | 기준선 출력은 발행본 1.7.7 · 1.4.6 과 147칸 CLI · MCP 294/294 바이트 같음 |
| cli 전체 · `template-check.test.ts` | 1096 · 344 | 1146 · 394 | 새 describe 「WI-0103」 50건. 기존 기대 변경은 s5 문구 1건 |
| mcp 전체 · `template.test.ts` | 231 · 77 | 234 · 80 | 새 describe 3건 |
| 새 테스트를 main 소스(e103d43 의 `project.ts` · `tailwind-core.ts`)에 | | cli 29 빨강 · 24 초록(가드), mcp 3 빨강 | `scripts/redmain.sh`, 원복 sha256 OK. 빨강 = 해석기 단위 14 · 판정 15(s5 포함), 초록 = PASS 가드 · Q28 · 회귀 가드 |
| 147칸 + 양성 대조 5칸 A/B(`compare.mjs base new3`) | 실빌드 불일치 48칸(147칸의 45 + s3 · s7 · z5) | **1칸**(pc-z5: stub fixture, 아래) | 전이 47(PASS → WARN 40 · WARN → PASS 7, s3 포함), 바이트 같음 93 · 문구만 바뀜 12, check rc 152/152 같음, CLI = MCP 152/152, 다른 항목 줄 152/152 같음 |
| 남은 1칸 pc-z5 | | PASS · 실빌드 rc 1 | WI-0100b check fixture 의 tokens stub 에 CSS 파일이 없어 「다른 위치에서 풀림」을 못 봄. 실설치본으로 만든 tok-z5 · ui-z5 · ag-z5 는 WARN |
| 기존 fixture 코퍼스 196개(`abx.sh base new3`) | | check · MCP 193/196 바이트 같음 | 바뀐 3개는 그림자 fixture s3(WARN → PASS) · s5(문구) · s7(PASS → WARN). 그림자 없는 fixture 는 모두 바이트 같음, CLI = MCP 196/196 |
| theme add A/B(출력 · 파일 트리 sha256) | | 코퍼스 196/196 · 측정 152/152 같음 | Q78 |
| 반박 검증 fixture(`out/revfx.tsv`) | | 정확성 A · B · c22 9칸, 회귀 R1 4칸 모두 보정 의도대로 | 대조군 c00-ctl-none · c00-ctl-ex0 은 그대로 |
| 변이 | | 19/19 cli 빨강 | 5절 |
| 품질 게이트 | | `pnpm turbo run build type-check lint test --filter=@axis-ds/registry-core --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` rc 0 · 11 tasks · Cached 0 | lint 문제 0 |
| `pnpm check-changeset-mcp-tokens` | | rc 0 「통과(registry-core → cli · mcp)」 | |
| 발행본 재측정 | | | 발행 뒤 Master |
