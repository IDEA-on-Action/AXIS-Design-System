# WI-0103: exports 를 보는 패키지 CSS import 해석 테스트 계획

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 작성일: 2026-10-29 | 상태: 착수 측정 반영(2026-10-29, 2절), 기대값은 사용자 결정 Q70 ~ Q79 권장안 기준(3절)
> 기준선 두 축: ① 문제 재현(음성 대조)은 **npm 발행본 cli 1.7.7 · mcp 1.4.6**(`$S/pub/node_modules/@axis-ds`) ② 「수정 전후 불변」(AC7 · AC9)은 착수 직전 HEAD 빌드 사본(SHA 는 구현 때 7절에 기록)
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
| z5 (3) | PASS | WARN, 「이 위치에서 안 보임」 문구(`src/app/node_modules` 언급) | 0 → 0 |
| 나머지 90칸(P0 6 · nf · es · cs · cd · np · np0 72 · tokens n0 P1 ~ P4 와 컴포넌트 n0 P2 6 · z5c · z5r 6) | PASS | 발행본과 항목 줄 바이트 같음 | 0 → 0 |
| WI-0097 Q37 fixture(밖 진입 파일) | WARN(Q37 문구) | 바이트 같음 | 불변 |
| 앱 선언 · 어디에도 미설치(Q28 가드, z5 에서 `src/app/node_modules` 를 뺀 형태) | PASS | PASS | 불변 |

- 다른 항목(axis.config · utils · dependencies · animation) 줄은 147칸 모두 발행본과 같아야 해요
- 단위 테스트(해석기): 2.2 의 11상태 + 문자열 단축형 · 중첩 조건 · 배열 대상 · `null` 대상 · 패턴 키(`unknown`) · 실경로 비교(심볼릭 링크) · Plug'n'Play(`unknown`)

## 4. 미측정 (구현 첫 단계에서 재는 것)

| 축 | 방법 | 결과에 따라 |
|---|---|---|
| Next.js 15 + Tailwind 4 | 대표 4칸(tok-P1-ex0 · ui-P2-ex0 · ui-P1-n0 · tok-z5)을 `next build` 로 1회 | 2.2 와 다르면 plan 1절 수정 뒤 진행 |
| pnpm 기본 레이아웃의 그림자 | `.pnpm` 스토어 심볼릭 링크 앱에 P2 · ex0 1칸 | 실경로 비교가 그림자 판별을 맞게 하는지 |
| Tailwind 3(postcss-import · Next css-loader) | Q79 (c) 를 고를 때만 | Q79 결정 |
| 앱 기준 설치본 1.4.0 미만 + tokens `css/tailwind4` 줄 | Q72 (b) · (c) 를 고를 때만 | globals 전이 목록 |
| 조건부 키 순서(`import` 다음 `style`) · 배열 대상 | 단위 테스트만(발행본에 없음) | - |
| `tailwindcss` · `tw-animate-css` · 브랜드 import 의 그림자 | Q78 (b) 를 고를 때만 | - |

## 5. 변이 테스트 (적용 → cli template-check · mcp template 실행 → sha256 대조 원복)

| 변이 | 잡아야 할 AC | 기대 |
|---|---|---|
| V1 `exports` 를 무시(종전처럼 맨 경로 파일만) | AC1 · AC2 · AC3(ex · ci) | 빨강 |
| V2 `exports` 없는 그림자에서 멈춤(건너뛰지 않음) | AC1 · AC3(n0) | 빨강 |
| V3 조건 `default` 를 뺌 | AC1(cd) | 빨강 |
| V4 조건에 `import` 를 더함 | AC1 · AC3(ci) | 빨강 |
| V5 대상 파일 없음을 해석됨으로 | AC1 · AC2(em) | 빨강 |
| V6 그림자 판별 없이 앱 기준 설치본에도 대상 파일 판정(Q72 (c)) | AC7(dist 미빌드 workspace 링크 가드) | 빨강 |
| V7 앱 안 진입 파일은 위치 판정 안 함(종전) | AC4 | 빨강 |
| V8 z5 규칙 제거 | AC5 | 빨강 |
| V9 z5 규칙을 「줄 위치에서 못 찾으면 늘 WARN」으로(Q74 (b)) | AC5 Q28 가드 | 빨강 |
| V10 그림자 문구 대신 Q37 문구 | AC6 | 빨강 |
| V11 밖 진입 파일에도 그림자 문구 | AC7(Q37 바이트) | 빨강 |
| V12 레이아웃 JS import 갈래(`:796`)에 위치 판정 | AC7 | 빨강 |

새 테스트는 HEAD 소스에 먼저 돌려 빨강을 확인해요. 회귀 가드는 HEAD 에서도 초록이 설계대로이고, 그 유효성은 이 표의 변이로만 판정해요.

## 6. CLI · MCP 대조

2.3 의 147칸을 수정본 CLI · MCP 로 다시 재서 항목 줄(심각도 · 문구)을 대조해요. 기대는 147/147 같음이에요. 대조 줄 수가 0 이면 계측 실패로 보고 원출력을 다시 봐요(발행본은 147/147 같음, 측정).

## 7. 결과 (구현 뒤 채움)

| 항목 | 기준선 | 수정 뒤 | 비고 |
|---|---|---|---|
| 착수 직전 HEAD SHA · 빌드 사본 | | | |
| cli 전체 · `template-check.test.ts` | | | |
| mcp 전체 · `template.test.ts` | | | |
| 147칸 재측정(판정 전이 · rc · CLI = MCP) | 발행본 `out/all.tsv` | | |
| A/B probe(기존 테스트 코퍼스) | | | 기대 전이는 s5 문구 1건 |
| theme add A/B | | | |
| 변이 V1 ~ V12 | | | |
| Next 15 · pnpm 레이아웃(4절) | | | |
| 발행본 재측정 | | | |
