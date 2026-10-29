# WI-0101: Tailwind 3 preset 의 tokens 해석 게이트 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-29 | 상태: 착수 측정(2026-10-29, 2절) · 구현 측정(2026-10-29, 3 ~ 5절, 반박 검증 보정 뒤 값)
> 측정 scratchpad(세션 임시 경로, 구현 때 사라질 수 있음): `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad/WI-0101/`. 이하 `$S` 로 줄여요. 스크립트 `$S/scripts/{mk.sh,ctrl.sh,run.sh,deps.sh,table.mjs}`, 결과 `$S/result.tsv` · `$S/result2.tsv`(구현 측정의 스크립트 · 결과는 3절 머리)
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

## 3. 구현 측정 (2026-10-29)

기준선: HEAD 4e54a70(= main e103d43 + 착수 문서. `packages/` 는 발행 커밋 1e8da06 과 같음)을 `turbo run build --force` 로 빌드한 사본 `$S/headbuild`. cli `dist/index.js` sha256 앞 16자 df33d876e1e3bdef · mcp 87f1bd34cdd72310 으로 **발행본과 바이트가 같아요**. 수정본은 `$S/newbuild`(cli 420be5f91b04648e · mcp 9aa378548ac12f3d). 최종 소스로 `turbo run ... --force` 를 다시 돌린 뒤의 dist 82개 파일 sha256 이 newbuild 와 같은 것을 대조했어요(주석만 고친 뒤라 번들 바이트 불변). 스크립트 `$S/scripts/{q69.sh,snap.sh,ab.sh,abdiff.sh,mk2.sh,mk3.sh,mk4.sh,build2.sh,mut.py,mutrun.sh,mainsrc.sh}`.

### 3.1 테스트 수

| 패키지 | 기준선(HEAD) | 수정본 | 새 테스트 | 바뀐 기존 테스트 |
|---|---|---|---|---|
| cli | 1096 | 1103 | 7(describe 「WI-0101」: AC1 · AC2 · AC3 · AC4 · AC5 · AC6 · 주석 안 참조) | 5(plan 4절: 보강 4 · 기대 변경 1) |
| mcp | 231 | 234 | 3(describe 「handleCheckProject WI-0101」) | 1(보강) |

- 새 테스트를 판정 소스보다 먼저 써서 HEAD 소스에서 돌렸을 때: cli 4 빨강(AC1 · AC2 · AC3 · AC6) · 초록 3(AC4 · AC5 · 주석, 설계한 회귀 가드), mcp 3 빨강
- 최종 테스트 전체를 판정 소스(`tailwind-core.ts`)만 HEAD 로 되돌린 상태에서 돌렸을 때(`mainsrc.sh`, 원복 sha256 25e2f610… 대조 OK): **cli 5 · mcp 3 빨강**. cli 5 는 새 4 + 기대를 바꾼 WI-0072 1이고, 보강한 기존 테스트 5건은 HEAD 소스에서도 초록이에요(기대 불변 확인)
- `turbo run build type-check lint test --force --filter=@axis-ds/registry-core --filter=@axis-ds/cli --filter=@axis-ds/mcp`: Tasks 11/11, **Cached 0**, rc 0(반박 검증 보정 뒤 다시 돌림)
- `pnpm check-changeset-mcp-tokens`: rc 0(「통과(registry-core → cli · mcp)」, 테스트 19/19). 음성 대조로 changeset 에서 mcp 줄을 지우면 rc 1 `::error::… @axis-ds/mcp 올림이 없어요`, 원복 sha256 대조 OK

### 3.2 fixture A/B (headbuild 대 newbuild, CLI 전체 텍스트 · 종료 코드 · MCP 텍스트)

대상 91개: 착수 63 + 추가 fx2 11(PnP stub 루트 전용 · 미선언 × ESM · `.ts` · bare, P2 미설치 · 설치, pnpm 격리 미설치 · 설치, package.json 없음) + Q69 실 PnP 2 + 저장소 템플릿 5 · `examples/nextjs-app` · `apps/web` + 템플릿 복사본 2(설치 전 상태) + fx3 4(심볼릭 링크 `--dir` · 루트 선언 · 앱 쪽 중첩 설치 · yarn classic 루트 선언 미설치 · devDependencies 선언 미설치) + fx4 1(pnpm 전이 의존, 호이스팅 안 됨) + fx5 1(pnpm 루트 `^1.6.0` · 미설치 · `.cjs` bare, 문서 반박 검증이 만든 fixture).

| 결과 | 칸 수 |
|---|---|
| CLI 전체 출력 · MCP 출력 diff 0 | **65** |
| tailwind.config 줄만 바뀜(다른 줄 · 집계 외 diff 0) | **26** = PASS → WARN 21 · WARN → WARN 5 |
| 종료 코드가 바뀐 칸 | **0** |
| 수정본 CLI 판정 줄 = MCP 판정 줄 | 91 / 91 |

바뀐 26칸과 실빌드(Tailwind 3.4.19):

| 칸 | 전이 | 실빌드 |
|---|---|---|
| R-none 7형태 | PASS → WARN 「설치되지 않아 해석되지 않습니다 → 설치(pnpm install)」 | rc 1 ×7(2절) |
| U-none 비 bare 5형태 | PASS → WARN 「… → 설치(pnpm add "@axis-ds/tokens@^1.7.0")」 | rc 1 ×5(2절) |
| U-none CJS bare 2형태 | WARN → WARN(버전 문구 → 설치 안내) | rc 1 ×2(2절) |
| fx2 pnp-root-esm · pnp-root-tsf · q69/root(실 PnP) | PASS → WARN PnP 루트 전용 문구 | q69/root rc 1(3.3), stub 2칸은 같은 조건(추정) |
| fx2 pnp-none-esm · pnp-none-tsf | PASS → WARN 「설치(yarn add …)」 | 미측정(PnP 미선언 실설치 없음) |
| fx2 pnp-none-bare | WARN → WARN | 미측정 |
| fx2 p2-none | PASS → WARN 「설치(npm install "@axis-ds/tokens@^1.7.0")」(앱 lockfile 의 매니저) | rc 1 |
| fx2 pnpm-none · fx3 yarn1 | PASS → WARN 「설치(pnpm install)」 · 「설치(yarn install)」 | rc 1 · rc 1 |
| fx2 nopkg | PASS → WARN 「설치(pnpm add …)」 | rc 1 |
| fx4 pnpm-transitive | PASS → WARN | rc 1 |
| fx5 rb-root16-bare | WARN → WARN(「선언 ^1.6.0 에서는 …」 → 「설치(pnpm install)」) | 미측정(Tailwind 미설치 fixture) |

바뀌지 않은 65칸 가운데 실빌드 rc 0 인 칸: A-inst* · R-inst* · U-inst* 42칸(2절), fx2 p2-inst · pnpm-inst(rc 0 · `.bg-primary` 1), fx3 nested(rc 0), q69/app(rc 0). A-none 7칸 · devdecl 은 실빌드 rc 1 인데 PASS 그대로예요(사용자 결정 Q62, dependencies 항목이 알림).

### 3.3 착수 게이트 실빌드 (Q69, 2026-10-29)

`$S/scripts/q69.sh`: Yarn 4.5.3(corepack) PnP 실설치(`nodeLinker: pnp`, 캐시는 fixture 안), 루트에 `@axis-ds/tokens` 1.8.2, 앱은 `tailwindcss` 3.4.19 만. `.pnp.cjs` · `.pnp.loader.mjs` 생성 확인.

| 구성 | `tailwind.config.mjs`(ESM import) | `tailwind.config.ts` |
|---|---|---|
| 루트 전용(2회, `q69/root` · `q69/root2`) | rc 1 「Your application tried to access @axis-ds/tokens, but it isn't declared in your dependencies; this makes the require call ambiguous and unsound.」 | rc 1 같은 문구 |
| 앱에도 선언(양성 대조, `q69/app`) | rc 0 · 규칙 5 · `.bg-primary` 1 | rc 0 · 규칙 5 · `.bg-primary` 1 |

rc 1 이라 게이트 통과(구현 진행). prd 1.4 표 1번의 근거예요.

### 3.4 새 문구 (구현 그대로, 확정은 추가 결정 Q61b)

| 갈래 | 문구(코드 `presetTokensUnresolvedMessage`) |
|---|---|
| `not-installed` | `<파일>에 AXIS preset 참조가 있지만 @axis-ds/tokens 가 설치되지 않아 해석되지 않습니다 → 설치(<안내>)`. 안내는 `tokensInstallPhrase(baseDir, "^1.7.0")`: npm 워크스페이스 루트 선언은 「워크스페이스 루트에서 npm install」, pnpm · yarn 루트 선언은 「<pm> install」, 선언 없음(P2 · PnP 미선언 · package.json 없음 포함)은 「<pm> add "@axis-ds/tokens@^1.7.0"」(npm 은 `npm install "…"`) |
| `pnp-root-only`(bare 아님) | `<파일>에 AXIS preset 참조가 있지만 @axis-ds/tokens 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다(워크스페이스 루트 선언 <범위>) → 앱 package.json 에 @axis-ds/tokens 를 선언하세요` |

changeset · README 의 문구 예시는 fx/U-none/esm-mjs · fx2/pnp-root-esm 실제 출력과 바이트가 같아요(문서 반박 검증 대조).

## 4. 변이 (AC9, 2026-10-29, 최종 소스 sha256 25e2f610…)

`$S/scripts/mut.py` 로 `tailwind-core.ts` 에 하나씩 넣고 cli `template-check.test.ts`(351) · mcp `tools/template.test.ts`(80)를 돌린 뒤 `.orig` 로 되돌려 sha256 을 대조했어요(6회 모두 원복 OK, 마지막 sha256 원본과 같음). M2 · M3 · M5 는 globals 게이트에도 같은 줄이 있어 `presetTokensUnresolvedMessage` 안만 바꿨어요.

| # | 변이 | cli 빨강 | mcp 빨강 | 지목한 테스트가 빨간가 |
|---|---|---|---|---|
| M1 | 새 게이트 전체를 끔 | 5(AC1 · AC2 · AC3 · AC6 · WI-0072) | 3 | 예 |
| M2 | 루트 선언 · 미설치를 해석됨으로 봄 | 1(AC2) | 1(루트 선언 행) | 예 |
| M3 | 앱 선언 · 미설치도 막음(Q62 반대) | 6(AC4 · B3 4건(보강한 3 + 앱 선언 `.js` · `.mjs` · `.cjs`) · WI-0072) | 2 | 예(AC4) |
| M4 | bare 는 새 게이트를 건너뜀(Q65 순서 뒤집기) | 4(AC2 · AC3 · AC6 · WI-0072) | 1 | 예(AC3) |
| M5 | 설치본이 있어도 미선언이면 막음 | 6(AC5 · WI-0072 2 · WI-0086 AC3 · T4-3 · WI-0065 D8) | 3 | 예(AC5) |
| M6 | PnP 루트 전용 갈래를 지움 | 1(AC6) | 1(PnP 행) | 예 |

## 5. 반박 검증 (2026-10-29, 정확성 · 회귀 · 문구와 문서)

독립 에이전트 3개에 읽기 전용으로 맡겼어요. 정확성 · 회귀 두 개는 측정 없이 코드 판독만 남겼고(본인들이 「실측 0건 · 미측정」이라고 밝힘), 그 미측정 목록은 이 문서의 측정으로 채웠어요(심볼릭 링크 · P2 · package.json 없음 · 템플릿 · `apps/web` · 실빌드 · CLI = MCP · 테스트). 문구와 문서 검증은 fixture 를 돌려 대조했어요.

| 관점 | 발견 | 처리 |
|---|---|---|
| 정확성 | 빌드 사본의 `SHA` 파일이 둘 다 HEAD 라 newbuild 에 미커밋 변경이 들었는지 증명되지 않음, dist 문자열이 `\u` 이스케이프라 문구 grep 0건은 측정 실패 | 동작으로 증명: U-none ESM 에서 headbuild PASS · newbuild WARN(3.2). 최종 dist 82개 sha256 = newbuild |
| 정확성 | PnP 에서 tokens 를 `optionalDependencies` 에만 선언하면 `hasDependency` 가 보지 않아 거짓 WARN 일 수 있음(추정) | 미측정 잔여. globals 게이트와 같은 헬퍼의 기존 한계라 이 WI 에서 고치지 않음(release-notes 잔여) |
| 정확성 | 루트 `^1.6.0` 선언 · 미설치 · bare 는 안내대로 설치하면 다음 check 에서 버전 WARN 이 이어짐 | Q65 의 결과. changeset 에 적고 추가 결정 Q65a 로 올림 |
| 회귀 | newbuild dist 시각(19:47)이 `tailwind-core.ts` 수정 시각(19:52)보다 앞섬 | 원인은 변이 원복의 `cp`(내용은 같음, sha256 7b85…). 최종 소스로 다시 빌드해 dist 82개 sha256 이 newbuild 와 같음을 대조 |
| 회귀 | WI-0072 · WI-0086 보강이 그 갈래를 version 없는 설치본 stub 으로만 밟게 됨 | plan 4절에 관찰로 적음. 실제 레이아웃은 AC2 가 덮음 |
| 회귀 | `tokensInstallPhrase` · `checkTailwindSetup` 호출지 | 코드 판독 결과는 globals · preset 게이트, check · MCP 뿐. globals 줄은 91칸 A/B 에서 diff 0(3.2) |
| 문서 | changeset 이 루트 1.7.0 미만 선언 · 미설치 · bare 의 WARN → WARN 을 빠뜨리고 PASS → WARN 목록에 섞음(중) | 보정: 「WARN 문구만 바뀌는 경우」에 넣고, 루트 항목을 「bare 는 루트 범위가 1.7.0 이상일 때」로 좁힘. fx5 를 A/B 에 넣어 확인 |
| 문서 | changeset PnP 미선언 문장이 bare 까지 PASS 출발로 읽힘(하) | 보정: 「(bare require 가 아닌 모양)」 |
| 문서 | README 새 단락의 PnP 문구 · 「1.7.7 까지는 PASS」가 bare 에서 틀림(중) | 보정: bare 는 위 단락 문구, bare 는 이미 WARN 이었던 경우 문구만 바뀜 |
| 문서 | README 110 · 111행의 PASS · 「선언 하한」 서술이 조건부가 됐는데 표시 없음(하) | 보정: 두 자리에 1.7.8 조건을 붙임 |
| 문서 | `tailwind-core.ts:35` 낡은 범위 문장이 남음(중) | 보정: 그 문장에 「(WI-0101 부터 그 앞에 모든 모양의 tokens 해석 판정이 있어요, 아래)」 |
| 문서 | `docs/guides/theme-customization.md:355` check 표에 WI-0101 이 없음(중) | 보정: cli 1.7.8 · mcp 1.4.7 문장 추가 |
| 문서 | prd 의 조건부 · 미측정 서술이 결정 뒤에도 남음, changeset 종료 코드 근거가 문서에 없음(하) | 보정: prd AC4 · AC6 · 1.4 표 · 5절, changeset 에 「testplan 3.2」 |

보정 뒤 회귀 검증: `turbo ... --force` Cached 0 · rc 0, 91칸 A/B 다시(위 3.2 의 수치가 보정 뒤 값), 변이 M1 ~ M6 다시(4절), 판정 소스 HEAD 되돌림 빨강 다시(3.1).

## 6. CLI · MCP 대조

착수 63/63(발행본), 수정본 91/91 에서 판정 줄이 같아요. 새 테스트도 cli · mcp 가 같은 문구를 기대해요.

## 7. 남은 미측정

- PnP 앱 미선언(어디에도 선언 없음) 실빌드, PnP stub fixture 4칸의 실빌드(루트 전용은 실 PnP q69 로 대신함)
- PnP `optionalDependencies` 선언(정확성 반박 검증의 추정)
- fx5(루트 `^1.6.0` · bare) 실빌드
- 설치본 디렉터리는 있지만 `dist/tailwind-preset.*` 가 없는 손상 설치(Q68 잔여)
- `import * as` · 동적 `import()` 모양은 단위 테스트의 참조 판독(B3)만 있고 fixture A/B 는 없음
- tokens 1.2.x ~ 1.5.x 의 `./tailwind` exports(1.1.0 · 1.6.2 · 1.8.2 만 확인)
- Next.js 실빌드 · Windows
