# WI-0101: Tailwind 3 preset 의 tokens 해석 게이트 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-29 | 상태: 착수 측정(2026-10-29, 2절) · 구현 측정은 3절 이후에 채움
> 측정 scratchpad(세션 임시 경로, 구현 때 사라질 수 있음): `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad/WI-0101/`. 이하 `$S` 로 줄여요. 스크립트 `$S/scripts/{mk.sh,ctrl.sh,run.sh,deps.sh,table.mjs}`, 결과 `$S/result.tsv` · `$S/result2.tsv`
> 발행본: `scratchpad/pub/node_modules/@axis-ds/{cli,mcp}`(cli 1.7.7 · mcp 1.4.6, `dist/index.js` sha256 앞 16자 cli df33d876e1e3bdef · mcp 87f1bd34cdd72310). Tailwind CLI 3.4.19, Node 22.22.0, tokens 실패키지 1.8.2 · 1.6.2(npm 실설치본을 fixture 에 복사)

## 1. fixture

`$S/scripts/mk.sh` 가 상태 9 × 형태 7 = 63개를 만들어요. 모든 fixture 는 `src/page.tsx`(클래스 `bg-primary text-primary-foreground border-border rounded-lg p-4 animate-in`)와 `in.css`(`@tailwind utilities;`)를 가져요. `tailwindcss` 는 devDependencies `^3.4.19` 선언 + 실설치본 심볼릭 링크예요(R-* 는 루트 node_modules).

| 상태 | 레이아웃 | tokens 선언 | tokens 설치본 |
|---|---|---|---|
| A-inst182 · A-inst162 · A-none | 단일 앱 | 앱 `dependencies` `^1.8.2`(A-inst162 는 `^1.6.2`) | 앱 node_modules 1.8.2 · 1.6.2 · 없음 |
| R-inst182 · R-inst162 · R-none | npm 워크스페이스(`workspaces: ["apps/*"]`), check 대상은 `apps/web`, 앱 lockfile 없음 | 루트 `dependencies` `^1.8.2`(R-inst162 는 `^1.6.2`) | 루트 node_modules 1.8.2 · 1.6.2 · 없음 |
| U-none · U-inst182 · U-inst162 | 단일 앱 | 없음 | 없음 · 앱 node_modules 1.8.2 · 1.6.2(전이 설치를 흉내) |

| 형태 | 파일 | 모양 |
|---|---|---|
| `cjs-bare-js` | `tailwind.config.js` | `module.exports = { presets: [require("@axis-ds/tokens/tailwind")] }` |
| `cjs-bare-cjs` | `tailwind.config.cjs` | 같음 |
| `cjs-default-js` | `tailwind.config.js` | `require(...).default` |
| `esm-mjs` | `tailwind.config.mjs` | `import axisPreset from "@axis-ds/tokens/tailwind"; export default { presets: [axisPreset] }` |
| `esm-js` | `tailwind.config.js` | 같은 ESM 문법(package.json `type` 없음) |
| `ts` | `tailwind.config.ts` | `import type { Config }` + 같은 import, `satisfies Config`(템플릿 5개와 같은 모양) |
| `mjs-require` | `tailwind.config.mjs` | `export default { presets: [require(...)] }` |

## 2. 착수 측정 (2026-10-29, 발행본)

측정 명령(`$S/scripts/run.sh`): 칸마다 ① `out=$(node cli check --dir <app>); rc=$?` 에서 tailwind.config 줄 ② MCP `axis.check_project`(stdio JSON-RPC, `scratchpad/WI-0100-verify/scripts/mcp-call.mjs`)의 같은 줄 ③ app 디렉터리에서 `node tailwindcss/lib/cli.js -c <설정> -i in.css -o out.css`, rc · `{` 개수(규칙 수) · `.bg-primary` 줄 수.

### 2.1 양성 대조 (측정이 동작함을 먼저 보임, `$S/scripts/ctrl.sh`)

| fixture | check rc | tailwind.config |
|---|---|---|
| U-none/cjs-bare-js | 1 | WARN「…버전을 확인하지 못했습니다(설치본 · 선언 없음). 1.7.0 미만이면 CommonJS 의 require(…) 로는 preset 이 적용되지 않습니다…」 |
| A-inst162/cjs-bare-js | 1 | WARN「…설치본 1.6.2 에서는 CommonJS 의 require(…) 가 preset 이 아니라 { default } 를 돌려줘…」 |
| R-inst162/cjs-bare-js/apps/web | 1 | 같은 WARN(설치본 1.6.2, 루트 node_modules 를 상위 탐색으로 찾음) |
| A-inst182/cjs-bare-js | 1 | PASS(1.8.2 는 게이트 통과) |
| U-none/esm-mjs · U-none/ts | 1 | **PASS**(Issue 재현) |

- 기존 게이트는 동작해요(CJS bare 가 1.6.2 · 미선언에서 WARN, 1.8.2 에서 PASS). 그래서 아래 표의 ESM · `.ts` PASS 는 측정 실패가 아니라 게이트가 돌지 않은 결과예요
- check rc 는 모든 fixture 에서 1 이에요. 원인은 `axis.config.json 파일이 없습니다` · `globals.css 파일을 찾을 수 없습니다` FAIL(R-inst162 전체 출력으로 확인)이고 이 WI 와 무관해요. 판정 대상은 rc 가 아니라 tailwind.config 줄이에요. 새 판정이 WARN 이라 rc 는 구현 뒤에도 같아야 해요(prd 3절)

### 2.2 63칸 결과

칸 = `CLI 심각도`(MCP 와 다르면 `CLI≠MCP`) / 실빌드(`rc 0 · 규칙 수 · .bg-primary 줄 수` 또는 `rc 1`).

| 상태 | `cjs-bare-js` | `cjs-bare-cjs` | `cjs-default-js` | `esm-mjs` | `esm-js` | `ts` | `mjs-require` |
|---|---|---|---|---|---|---|---|
| A-inst182 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| A-inst162 | WARN / rc 0 · 2 · 0 | WARN / rc 0 · 2 · 0 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| A-none | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| R-inst182 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| R-inst162 | WARN / rc 0 · 2 · 0 | WARN / rc 0 · 2 · 0 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| R-none | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| U-none | WARN / rc 1 | WARN / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 | PASS / rc 1 |
| U-inst182 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |
| U-inst162 | WARN / rc 0 · 2 · 0 | WARN / rc 0 · 2 · 0 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 | PASS / rc 0 · 5 · 1 |

- 실빌드 rc 1 칸(21칸)의 오류는 모두 `Error: Cannot find module '@axis-ds/tokens/tailwind'` 예요
- 규칙 5 = `.rounded-lg` · `.border-border` · `.bg-primary` · `.p-4` · `.text-primary-foreground`(preset 적용), 규칙 2 = `.rounded-lg` · `.p-4`(preset 빠짐, `A-inst162/cjs-bare-js` 출력으로 확인). `animate-in` 은 `tailwindcss-animate` 가 없어 어느 칸에도 없어요(이 WI 와 무관)
- CLI = MCP: 심각도 · 문구 모두 63/63 같아요
- 재현: 같은 fixture 로 2회 돌려 `result.tsv` · `result2.tsv` 의 1 ~ 10열 diff 0(rc 0)
- 발행본과 소스가 같은지: `git rev-parse --verify 1e8da06` 성공, `git log 1e8da06..HEAD -- packages/` 0줄, 같은 범위 전체는 2줄(조회가 동작함)

### 2.3 거짓 PASS 칸과 다른 항목 (`$S/scripts/deps.sh`)

| 칸 | 실빌드 | tailwind.config | dependencies 항목 |
|---|---|---|---|
| A-none(7) | rc 1 | PASS | WARN「선언됐지만 설치되지 않은 의존성: @axis-ds/tokens → pnpm install」 |
| R-none(7) | rc 1 | PASS | WARN「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: @axis-ds/tokens → pnpm install …」 |
| U-none `cjs-default-js` · ESM · `.ts` · `mjs-require`(5) | rc 1 | PASS | tokens 언급 없음(clsx · tailwind-merge 만) |
| U-none CJS bare(2) | rc 1 | WARN(버전 문구, 원인은 미설치) | tokens 언급 없음 |

dependencies 줄은 `esm-mjs` 한 형태로 쟀어요. 다른 형태는 dependencies 가 설정 파일을 읽지 않아 같다고 봐요(추정).

### 2.4 미측정 칸

| 칸 | 이유 | 언제 |
|---|---|---|
| PnP(Yarn 4) 루트 전용 × 7형태, PnP 앱 미선언 | 이번 fixture 에 PnP 실설치가 없음 | 구현 첫 단계(Q69, 3.3) |
| 앱 lockfile(P2) + 루트 선언 | 만들지 않음 | 구현 A/B(3.2) |
| pnpm 기본(격리) 레이아웃 | 만들지 않음. 루트 선언은 루트 node_modules 에 링크되므로 R-* 와 같다고 봄(추정) | 구현 A/B(3.2) |
| 템플릿 5개 · `examples/nextjs-app` 의 check | 재지 않음(앱 선언 ESM `.ts` 라 A-* 와 같다고 봄, 추정) | 구현 A/B(3.2) |
| `import("@axis-ds/tokens/tailwind")` 동적 import · `import * as` 모양 | fixture 에 없음(기존 단위 테스트 `template-check.test.ts:2266` 이 참조 판독만 봄) | 구현 단위 테스트 |
| 설치본 디렉터리는 있고 `dist/tailwind-preset.*` 가 없는 손상 설치 | 만들지 않음(Q68) | 잔여 |
| Next.js 실빌드 · Windows | 범위 밖 | 잔여 |

## 3. 구현 측정 (구현 때 채움)

### 3.1 테스트 수

| 패키지 | 기준선(HEAD) | 수정본 | 새 테스트 | 바뀐 기존 테스트 |
|---|---|---|---|---|
| cli | 미측정 | | | |
| mcp | 미측정 | | | |

### 3.2 fixture A/B

2절 63칸 + 2.4 의 P2 · pnpm 격리 · 템플릿 5개를 기준선 빌드 사본과 수정본으로 재요. 기대: 바뀐 칸은 R-none 7 · U-none 7(그중 CJS bare 2칸은 WARN 문구만)이고, 나머지는 CLI 전체 텍스트 · MCP 텍스트 diff 0, 종료 코드는 전 칸 같음.

### 3.3 착수 게이트 실빌드 (Q69)

Yarn 4 PnP 실설치, 루트에만 tokens 선언, 앱은 `tailwindcss` 만. ESM `.mjs` · `.ts` 각 1회 rc 와 오류 문구, 대조로 앱에도 선언한 경우 rc.

### 3.4 새 문구

구현 그대로 확정할지 사용자 확인(WI-0097 Q43 · Q48 선례). 확정 문구와 코드 문자열 grep 대조를 여기 적어요.

## 4. 변이 계획 (AC9)

| # | 변이 | 빨개져야 하는 것 |
|---|---|---|
| M1 | 새 게이트 전체를 끔(종전 흐름만) | U-none · R-none 새 테스트(cli · mcp) |
| M2 | `not-installed`(`source: "root"`)를 해석됨으로 봄 | R-none 새 테스트만 |
| M3 | `app` 도 미설치면 막음(Q62 반대) | A-none 회귀 가드 |
| M4 | 새 게이트를 CJS bare 버전 게이트 뒤로 옮김(Q65 순서 뒤집기) | U-none CJS bare 문구 테스트 |
| M5 | `installed` 갈래를 지움(설치본 있어도 미선언이면 막음) | U-inst* 회귀 가드 |

판정은 통과 수가 아니라 「그 변이에서 지목한 테스트가 빨간가」예요. 기대한 곳이 빨개지지 않으면 그 테스트는 근거가 되지 못해요.

## 5. CLI · MCP 대조

3.2 의 모든 칸에서 tailwind.config 줄의 심각도 · 문구가 같아야 해요. 착수 측정은 63/63 같음이에요.
