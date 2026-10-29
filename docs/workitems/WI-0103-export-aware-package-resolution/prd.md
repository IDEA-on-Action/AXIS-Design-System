# WI-0103: check 의 패키지 CSS import 해석이 exports · subpath 와 중첩 설치본(그림자)을 실빌드처럼 봄 PRD

> 작성일: 2026-10-29 | 버전: v0.1 | 작성자: Sinclair Seo | WI: WI-0103 | GitHub: #254 | 우선순위: P3 | 상태: Draft (사용자 결정 Q70 ~ Q79 대기)
> 기준: `main` e103d43 (linked 1.8.2 · cli 1.7.7 · mcp 1.4.6 발행됨). 착수 측정은 **npm 발행본 cli 1.7.7 · mcp 1.4.6**(scratchpad `pub/node_modules/@axis-ds`)으로 했어요
> 출처: WI-0100b 검증(사용자 결정 Q58 이 이 WI 로 넘긴 범위: 측정 s3 · s7 · z5 · 그림자 안내 문구)
> 표기: **측정**(이번 착수 측정에서 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, 발행본 cli 1.7.7 · mcp 1.4.6, `@tailwindcss/postcss` 4.1.14)

check 의 패키지 CSS import 해석 판정은 두 군데에서 해요.

- WI-0097 해석 게이트 · Q37: `outsideCssPackageResolution`(`packages/axis-registry-core/src/project.ts:739-744`). 앱 기준 설치본이 있으면 CSS 파일 디렉터리부터 위로 올라가 **처음 만난 `node_modules/<name>/package.json`** 에서 멈추고(`findInstalledPackage`, `:575-595`), 컴포넌트는 그 안에 `tailwind.css` 파일이 있는지만, tokens 는 디렉터리가 있는지만 봐요. 앱 기준 설치본이 없으면 판정하지 않아요(`unknown`)
- WI-0100b Q54: 하위 파일의 패키지 줄은 그 하위 파일 디렉터리를 기준으로 위 함수에 넘기고(`tailwind-core.ts:529` · `:630-634`), 앱 안 진입 파일의 줄은 기준 디렉터리가 없어(`outsideCssDir`, `:683-687`) **위치 판정을 하지 않아요**

실빌드(`@tailwindcss/node` 4.1.14 의 CSS 해석기 = enhanced-resolve 5.26.0, `conditionNames: ["style"]` · `mainFields: ["style"]` · `extensions: [".css"]`, 설치본 `dist/index.js` 에서 확인)는 import 한 파일 디렉터리부터 위로 `node_modules/<name>` 을 찾고, 찾은 패키지에 `exports` 가 있으면 subpath 를 `exports` 로만 풀어요. 그래서 두 판정이 어긋나요.

| 양성 대조(WI-0100b fixture 를 그대로 복사, 측정) | 모양 | 발행본 check | 실빌드 |
|---|---|---|---|
| s3 | 하위 파일 `app/vendor/sub.css` 에 ui-react 줄, `app/vendor/node_modules/@axis-ds/ui-react` 1.3.0 (`exports` 없음 · `tailwind.css` 없음) | tailwind.config **WARN**(「이 파일 위치에서 … 찾지 못해 … globalCss 를 앱 안 파일로 바꾸세요」) | rc 0, 토큰 변수 806(그림자를 지나 앱 설치본으로 풂) |
| s7 | 하위 파일에 tokens 줄, `app/vendor/node_modules/@axis-ds/tokens` 1.2.0 (`exports` 에 `./css/tailwind4` 없음) | globals.css **PASS** | rc 1 「"./css/tailwind4" is not exported under the condition "style"」 |
| z5 | 진입 `src/app/globals.css` 가 `../styles/axis.css` 를 import, tokens 설치본은 `src/app/node_modules` 에만 | globals.css **PASS** | rc 1 「Can't resolve '@axis-ds/tokens/css/tailwind4' in '…/src/styles'」 |
| z5c · z5r(대조) | 같은 줄을 진입 파일에 직접 / 설치본을 하위 파일 쪽에 | PASS | rc 0 · 570 |

세 경우 모두 WI-0100b testplan 4-1 절 · q50-verify-correctness 의 기록과 같은 결과로 재현됐어요(CLI = MCP, check rc 0).

교차 측정(위치 6 × 그림자 상태 11 × 대상 패키지 3 + z5 계열 3 × 3 = **147칸**, fixture 하나를 check 와 실빌드가 함께 씀, testplan 2절):

| 분류 | 칸 수 | 내용 |
|---|---|---|
| 거짓 PASS(check PASS · 실빌드 rc 1) | **39** | tokens 줄의 `exports` 미노출 · 대상 파일 없음 · 조건 불일치(16), 하위 파일의 컴포넌트 줄 미노출(맨 경로에 파일이 있음) · 조건 불일치(12), 진입 파일 쪽 그림자와 진입 파일의 컴포넌트 줄(8), z5(3) |
| 거짓 WARN(check WARN · 실빌드 rc 0) | **6** | `exports` 없고 파일 없는 컴포넌트 그림자(s3 형, 하위 파일 줄 3위치 × 2패키지) |
| 맞는 WARN 이지만 안내가 원인과 다름 | 12 | 컴포넌트 그림자의 대상 파일 없음 · 미노출(파일 없음), 「globalCss 를 앱 안 파일로 바꾸세요」 |
| 맞음 | 90 | 그 가운데 20칸은 tokens 그림자의 파일을 실빌드가 그대로 써서 산출 CSS 의 토큰 변수가 0(해석은 되지만 내용이 다름, s9 형, 2.3 범위 밖) |

- 위치 「하위 파일 쪽」 · 「진입 파일 쪽(줄은 하위 파일)」 · 「둘 다」는 99칸 모두 같은 결과예요. 하위 파일이 진입 파일 디렉터리 아래에 있어 같은 그림자를 먼저 만나기 때문이에요(측정)
- ui-react 와 agentic-ui 는 49칸 모두 같은 결과예요(측정)
- check 종료 코드는 147칸 모두 0 이에요(해당 항목은 WARN 까지만 내요)
- 발행된 AXIS 패키지(tokens · ui-react · agentic-ui 1.1.0 ~ 1.8.2, `npm view`)는 **모든 버전에 `exports` 가 있고** 패턴 키 · 조건부 CSS 값이 없어요. Tailwind 4 진입점(`./css/tailwind4` · `./tailwind.css`)은 1.4.0 부터 있어요(측정). 그래서 실제로 생기는 그림자는 「1.4.0 미만 = 미노출(ex0)」 또는 「1.4.0 이상 = 노출(es)」이고, `exports` 없는 그림자(s3 형)는 손으로 만든 디렉터리 · 낡은 stub 에서만 생겨요(추정)

### 1.2 결정

#### 사용자 결정 (대기)

결정 항목 Q70 ~ Q79 는 7절에 권장안 · 근거와 함께 모았어요. AC 는 **권장안 기준**으로 적었고, 다른 선택지가 정해지면 해당 AC 를 고쳐요.

#### 선례 · 이어받는 결정

| 출처 | 내용 | 이 WI 에서 |
|---|---|---|
| WI-0097 Q21 · Q28 | 앱에 선언했지만 미설치면 해석 게이트로 막지 않음(dependencies WARN 이 알림) | 새 모델에서도 「어디에서도 설치본을 찾지 못함」은 판정하지 않음(AC5 의 z5 예외만 Q74) |
| WI-0097 Q37 · Q43 · Q48 | 프로젝트 밖 진입 파일의 줄은 그 파일 위치 기준, 문구 확정 | 밖 진입 파일 경우의 문구 · 판정은 바이트 그대로(AC7) |
| WI-0097 `tokensCssResolution` 주석 | exports 대상 파일은 보지 않음(dist 없는 workspace 링크의 거짓 WARN 방지) | 앱 기준 설치본에는 그대로 둠(Q72) |
| WI-0100b Q54 | 하위 파일의 줄은 그 파일 디렉터리 기준 | 유지하고, 그 위에 exports 모델을 얹음 |
| WI-0100 Q58 | 그림자(s3 · s7 · z5 · 문구)를 이 WI 로 분리 | 이 WI 의 범위 |

## 2. 범위

### 2.1 하는 것

1. registry-core 에 **패키지 CSS import 해석기**를 둬요(`project.ts`). Tailwind 4 해석기와 같은 순서로 위로 올라가며 `node_modules/<name>` 을 보고, `exports` 가 있으면 subpath 를 조건 `style` · `default`(Q70)로 풀며, `exports` 가 없으면 맨 경로 파일이 있을 때만 그 설치본에서 멈추고 없으면 계속 올라가요(Q71)
2. check 의 tokens 줄(globals.css) · 컴포넌트 `tailwind.css` 줄(tailwind.config)이 하위 파일 · 진입 파일(Q73) 위치에서 이 해석기로 풀리는지 봐요
3. 그림자 원인별 안내 문구(Q76)
4. z5 형(설치본이 다른 줄의 기준 디렉터리에서만 보임)을 해석 불가로(Q74)
5. cli · mcp patch changeset(registry-core 변경)

### 2.2 하지 않는 것

- `tailwindcss` · `tw-animate-css` 줄, 브랜드 import, theme add 의 줄 넣기 판정(Q78)
- Tailwind 3 경로(Q79)
- 그림자 파일 내용 판정(s9 형, Q75)
- Plug'n'Play(종전처럼 판정하지 않음)

### 2.3 알려진 한계 (이 WI 뒤에도 남음)

- 그림자가 subpath 를 내보내고 파일도 있으면 실빌드는 그 파일을 써요. 파일 내용이 AXIS 토큰이 아니어도 check 는 PASS 예요(측정 20칸, Q75 권장안)
- 조건부 `exports` 의 키 순서 · 배열 대상 · 패턴 키(`./css/*`)는 발행된 AXIS 패키지에 없어 재지 않았어요(미측정, 4절)

## 3. 수용 기준 (AC)

AC 마다 근거 칸 이름(testplan 2.3 표의 `<패키지>-<위치>-<상태>`)을 붙였어요. 위치 P1 하위 파일 쪽 · P2 진입 파일 쪽(줄은 진입 파일) · P3 진입 파일 쪽(줄은 하위 파일) · P4 둘 다, 상태는 testplan 2.2 표를 봐요.

| AC | 내용 | 근거(측정) | 결정 |
|---|---|---|---|
| AC1 | registry-core 해석기가 11개 그림자 상태를 실빌드와 같게 풀어요: n0 · np0 는 건너뛰고 상위로, nf · es · cs · cd · np 는 그림자에서 해석, em 은 대상 파일 없음, ex · ex0 · ci 는 미노출. 단위 테스트의 기대값은 testplan 2.2 의 실빌드 열이에요 | 147칸 실빌드 열(rc · 그림자 표지 `--shadow-marker`) | Q70 · Q71 |
| AC2 | tokens 줄의 거짓 PASS 16칸(tok-P1 ~ P4 × em · ex · ex0 · ci)이 globals.css WARN 이 돼요 | 16칸 모두 발행본 PASS · 실빌드 rc 1 | Q72 · Q73 |
| AC3 | 하위 파일 컴포넌트 줄의 거짓 PASS 12칸(ui · ag × P1 · P3 · P4 × ex · ci)이 tailwind.config WARN, 거짓 WARN 6칸(같은 위치 × n0, s3 형)이 PASS 가 돼요 | 발행본 PASS · rc 1 / WARN · rc 0 | Q70 · Q71 |
| AC4 | 진입 파일 쪽 그림자와 진입 파일의 컴포넌트 줄(ui · ag × P2 × em · ex · ex0 · ci, 8칸)이 WARN 이 돼요. P2 의 나머지 상태(n0 · nf · es · cs · cd · np · np0)와 그림자 없는 P0e 는 PASS 그대로예요 | 발행본은 앱 안 진입 파일을 위치 판정하지 않아 모두 PASS | Q73 |
| AC5 | z5 3칸(tokens · ui · ag)이 WARN 이 되고, 대조 z5c · z5r 은 PASS 그대로예요. 앱에 선언했지만 어디에도 설치본이 없는 경우는 종전처럼 PASS 예요(Q28 회귀 가드) | z5 rc 1 「Can't resolve … in '…/src/styles'」, z5c · z5r rc 0 | Q74 |
| AC6 | 그림자 원인의 WARN(AC2 ~ AC5 와 맞는 WARN 12칸)은 그림자 전용 문구를 써요. 원인(미노출 · 대상 파일 없음 · 이 위치에서 보이지 않음), 그림자 경로(앱 상대 `…/node_modules/<name>`)와 버전, 할 일을 담고 「globalCss 를 앱 안 파일로 바꾸세요」는 쓰지 않아요. 출처 접미사 「(<하위 파일> 의 import)」 자리는 그대로예요 | s3 · s5 · 12칸의 발행본 문구 | Q76 |
| AC7 | 회귀 가드: 맞음 90칸은 판정 · 문구 바이트가 발행본과 같아요. 프로젝트 밖 진입 파일(Q37) 문구 · 판정, WI-0097 · WI-0100 테스트 기대는 plan 4절 목록 밖에서 바뀌지 않아요 | 90칸 발행본 출력 저장(`<fixture>.cli.txt`) | - |
| AC8 | CLI = MCP 항목 줄 147/147, check 종료 코드 147/147 이 발행본과 같아요(0 → 0) | 발행본 CLI = MCP 147/147 · rc 0 147/147 | Q77 |
| AC9 | theme add 출력 · 파일 트리와 브랜드 항목은 바뀌지 않아요(A/B) | `componentCssResolution` · 브랜드 `expandGlobalCss` 는 위치 판정을 쓰지 않음(코드) | Q78 |
| AC10 | 새 테스트는 HEAD 소스에서 빨강 · 수정본에서 초록, 변이(testplan 5절) 모두 빨강, `pnpm turbo run build type-check lint --force` · cli · mcp vitest 통과 | - | - |
| AC11 | changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0. `packages/axis-cli/README.md` 의 Q54 서술(하위 파일 중첩 node_modules)을 새 모델로 고쳐요 | registry-core 변경 규칙(CLAUDE.md) | - |

## 4. 미측정 · 위험

| 항목 | 상태 | 영향 |
|---|---|---|
| Next.js 15 실빌드 | 미측정(이번에는 `@tailwindcss/postcss` 를 `pcss.cjs` 로 직접 부름. WI-0100b 4-1 절에서는 Next TW4 결과가 같았음) | 구현 첫 단계에서 대표 4칸(tok-P1-ex0 · ui-P2-ex0 · ui-P1-n0 · tok-z5)을 Next 로 1회 |
| Tailwind 3(postcss-import · Next css-loader) | 미측정 | Q79. 두 해석기는 `exports` 를 다르게 다룰 수 있어(추정) TW3 에 같은 모델을 쓰면 거짓 판정이 생길 수 있음 |
| 앱 기준 설치본 자체가 1.4.0 미만(그림자 아님) + tokens `css/tailwind4` 줄 | 미측정 | Q72 의 (b) · (c) 를 고르면 globals PASS → WARN 전이가 생김 |
| 조건부 exports 키 순서(`import` 가 `style` 앞) · 배열 대상 · `null` 대상 · 패턴 키 | 미측정(발행본에 없음, 측정) | 해석기 구현은 Node 규격(객체 키 순서 · 첫 일치)을 따르고 단위 테스트만 둠 |
| pnpm 기본 레이아웃(심볼릭 링크)의 그림자 | 미측정 | 해석기는 실경로로 비교(plan 2절). 구현 때 1칸 측정 |
| `tailwindcss` · `tw-animate-css` 그림자 | 미측정 | Q78 로 범위 밖 |

## 5. 의존 · 순서

- 배치 9(WI-0101 ∥ WI-0103 ∥ WI-0089) 안에서 registry-core `project.ts` · `tailwind-core.ts` 를 함께 건드리는 WI 가 있으면 텍스트 충돌만 있어요(판정 축은 겹치지 않음, 추정). 머지 순서는 Master 가 정해요
- 발행은 cli · mcp patch 하나로 묶어요(linked 4패키지는 그대로)

## 6. 측정 출처

- scratchpad `S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad`
- 양성 대조: `$S/WI-0103/pc`(s3 · s7 · z5 · z5c · z5r 복사본), `$S/WI-0103/out/pc.tsv`
- 교차 측정: `$S/WI-0103/scripts/mx.sh` · `judge.sh` · `sev.mjs` · `classify.mjs` · `table.mjs`, 결과 `$S/WI-0103/out/all.tsv` · `classified.tsv` · `table.md`, 칸별 출력 `$S/WI-0103/mx*/<칸>.cli.txt` · `.mcp.txt` · `.build.css`
- 과거 버전 exports: `$S/WI-0103/scripts/exports-hist.sh` → `$S/WI-0103/out/exports-hist.tsv`

## 7. 사용자 결정 항목 (Q70 ~ Q79)

| # | 질문 | 선택지 | 권장안 | 근거 |
|---|---|---|---|---|
| Q70 | 조건부 `exports` 에서 어떤 조건 이름을 맞는 것으로 볼까요 | (a) `style` · `default` 만(Tailwind 4 해석기와 같음) (b) `style` · `default` · `import` · `require` 등 넓게 (c) 조건부 값은 판정하지 않음(종전 PASS) | (a) | 측정: cs · cd 는 rc 0, ci(`import` 만)는 rc 1 「not exported under the condition "style"」. 해석기 설정이 `conditionNames: ["style"]` 이고 enhanced-resolve 가 `default` 를 늘 더해요. 발행된 AXIS 버전에는 조건부 CSS 값이 없어 실제 전이는 손으로 만든 그림자에서만 생겨요 |
| Q71 | `exports` 가 없는 그림자를 건너뛸까요 | (a) 실빌드처럼: 맨 경로 파일(`<subpath>` · `.css` 붙인 이름)이 있으면 그 설치본에서 해석, 없으면 건너뛰고 상위로 (b) 종전처럼 처음 만난 설치본에서 멈춤 | (a) | 측정: n0 은 실빌드 rc 0(상위 설치본, 토큰 변수 806 · 738), nf 는 그림자 파일을 씀. (a) 는 s3 거짓 WARN 6칸을 없애요. package.json 없는 디렉터리(np · np0)도 같은 규칙이에요(측정: np 는 그림자 파일, np0 는 상위) |
| Q72 | `exports` 미노출 · 대상 파일 없음 판정을 어느 설치본에 적용할까요 | (a) 그림자(줄 위치에서 처음 잡힌 설치본이 앱 기준 설치본과 실경로가 다름)에만 (b) 미노출은 모든 설치본, 대상 파일 없음은 그림자만 (c) 둘 다 모든 설치본 | (a) | 변경을 이 WI 문제(그림자)에 한정해요. 앱 기준 설치본이 1.4.0 미만이면 tailwind.config 의 버전 확인 WARN 이 이미 알리고(WI-0044), 대상 파일 없음을 앱 기준에도 적용하면 dist 를 아직 빌드하지 않은 workspace 링크에서 거짓 WARN 이 돌아와요(`tokensCssResolution` 주석의 이유). (b) · (c) 의 앱 기준 전이는 미측정이에요 |
| Q73 | 앱 안 진입 파일의 패키지 줄도 그 파일 디렉터리 기준으로 해석할까요 | (a) 예: 진입 파일 디렉터리부터 해석기로 품(그림자가 없으면 결과가 종전과 같음) (b) 아니요: 종전처럼 앱 기준만 | (a) | 측정: P2 의 em · ex · ex0 · ci 12칸(tokens 4 · 컴포넌트 8)이 실빌드 rc 1 인데 PASS 예요. 1.4.0 미만 그림자는 늘 ex0 라서 실제로 생기는 형태예요. 그림자 없는 P0e 와 P2 의 n0 · np0 는 상위 설치본으로 풀려 판정이 같아요. `cssDir`(프로젝트 밖 표지, Q37 문구를 고름)의 뜻은 그대로 두고 해석 시작 디렉터리를 따로 둬서, 기존 테스트 「앱 안 진입 파일은 cssDir undefined」(`template-check.test.ts:1516`)의 기대는 바뀌지 않게 해요(plan 2절) |
| Q74 | z5(설치본이 진입 파일 쪽 중첩 node_modules 에만 있고 줄은 다른 디렉터리의 하위 파일)를 어떻게 볼까요 | (a) 줄 위치에서 해석되지 않고 같은 패키지가 프로젝트 안 다른 줄 위치(진입 파일 등)에서는 해석되면 WARN (b) 줄 위치에서 해석되지 않으면 늘 WARN (c) 종전(앱 기준 설치본이 없으면 판정 안 함) | (a) | 측정: z5 rc 1, z5c · z5r rc 0. (b) 는 앱 선언 · 미설치(설치 전 check)에서 거짓 WARN 이라 Q28 과 어긋나요. (a) 는 「설치본이 있기는 한데 이 줄에서는 안 보임」만 잡아요 |
| Q75 | 그림자가 해석은 되는데 내용이 다른 경우(s9 형)를 판정할까요 | (a) 이 WI 는 해석 여부만, 내용은 알려진 한계 (b) 해석된 그림자의 버전으로 버전 확인(1.4.0 미만 WARN) (c) 해석된 파일 안의 `--axis-*` 정의까지 확인 | (a) | 측정 20칸(nf · es · cs · cd · np 의 tokens)이 산출 토큰 변수 0 이지만 전부 손으로 만든 그림자예요. 발행된 1.4.0 미만은 `./css/tailwind4` 를 내보내지 않아(측정) 새 모델에서 미노출 WARN 이 되고, 1.4.0 이상은 실제 토큰이라 내용 문제가 없어요(추정). (c) 는 파일 읽기 범위가 패키지 안으로 넓어져요 |
| Q76 | 그림자 전용 안내 문구 | (a) 원인별 3갈래(미노출 · 대상 파일 없음 · 이 위치에서 안 보임) + 그림자 경로 · 버전 + 할 일 (b) 한 문구 「<경로> 의 중첩 설치본이 먼저 잡혀 해석되지 않습니다」 (c) 종전 문구에 경로만 덧붙임 | (a) | 원인마다 할 일이 달라요(미노출: 지우거나 1.4.0 이상으로, 대상 파일 없음: 다시 설치, 안 보임: 앱 · 루트에 설치하거나 줄을 옮김). 초안은 plan 3절. 프로젝트 밖 진입 파일(Q37) 문구는 그대로 둬요 |
| Q77 | 새 WARN 의 심각도와 check 종료 코드 | (a) WARN(종료 코드 불변, 측정 147칸 모두 0 → 0) (b) FAIL(빌드가 실패하는 칸이라 rc 0 → 1, changeset 에 「종료 코드가 바뀌는 경우」 명시) | (a) | WI-0097 해석 불가 계열이 모두 WARN 이고, 같은 원인을 다른 심각도로 내면 사용자가 구분하기 어려워요. (b) 를 고르면 CI 에서 check 를 쓰는 프로젝트가 업데이트만으로 실패할 수 있어요 |
| Q78 | 적용 범위(패키지 · 명령) | (a) AXIS 3패키지(tokens · ui-react · agentic-ui)의 check 판정만, `tailwindcss` · `tw-animate-css` 줄 · 브랜드 import · theme add 는 종전 (b) `tailwindcss` 줄도 같은 모델(Q37 자리) (c) theme add 의 줄 넣기도 globalCss 위치 기준 그림자 판정 | (a) | `tailwindcss` 는 subpath 없는 `"."` export(조건 `style`)라 모델이 달라 그림자를 재지 않았어요(미측정). theme add 는 앱 기준 `componentCssResolution` 만 써서 이 문제와 축이 달라요. 범위를 좁혀 A/B(AC9)로 불변을 증명해요 |
| Q79 | Tailwind 3 프로젝트의 tokens 줄(globals.css 게이트)에도 새 모델을 쓸까요 | (a) 이번에는 Tailwind 4 감지 프로젝트에만, Tailwind 3 은 종전 (b) 둘 다 같은 모델 (c) 구현 전에 Tailwind 3 실빌드를 재고 정함 | (a) | 이번 실빌드는 Tailwind 4 해석기만 쟀어요. Tailwind 3 은 postcss-import 또는 Next css-loader 가 풀고 `exports` 처리가 다를 수 있어요(미측정). 측정 없이 같은 모델을 쓰면 새 거짓 판정을 만들 수 있어요 |
