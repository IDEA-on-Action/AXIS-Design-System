# WI-0095: Plug'n'Play 루트 선언 경계를 init · add 로 넓힘 PRD

> 작성일: 2026-10-31 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0095 | GitHub: #239 | 우선순위: P3 | 상태: 구현 완료, Q150 ~ Q157 은 권장안으로 진행, 사용자 확인 대기
> 기준: `main` e4d89ae (linked 1.8.2 · cli 1.7.9 · mcp 1.4.8 발행됨, WI-0099 머지됨 · 미발행) 위 worktree 브랜치 `wi-0095-pnp-root-boundary`. 착수 측정은 main 빌드(e4d89ae)로 했어요
> 출처: WI-0091 사용자 결정 Q2(경계를 check 에만 켜고 init · theme add · add · template apply 는 이 WI 로), WI-0099 Q144(PnP 루트 전용 애니메이션 칸 `pnp-root-Ltwa-Itwa`)
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, Yarn 4.5.3 실설치 · main e4d89ae 빌드)

WI-0091 은 Yarn Plug'n'Play 에서 워크스페이스 루트에만 선언한 패키지를 「선언됨」으로 보지 않는 경계(`declaredDependency(..., { appOnlyInPnp: true })`)를 `axis check` · MCP `axis.check_project` 에만 켰어요. 저장소 밖에 실제 PnP 워크스페이스 9개를 만들어 init · theme add · add · template apply 를 돌린 결과(testplan 2절), 결함은 init 과 registry-core add 에만 있었어요.

| 명령 | 루트 전용 레이아웃(R4 · U4 · R3 · M4)의 종전 동작 | 맞는 동작(앱 issuer 기준) | 판정 |
|---|---|---|---|
| init utils 의존성 | 「clsx · tailwind-merge 가 이미 있습니다(워크스페이스 루트에 선언)」, 앱 package.json 을 쓰지 않음 | 앱이 clsx 를 해석하지 못함(MODULE_NOT_FOUND) → 앱에 선언해야 `utils.ts` 가 동작 | **결함**: 잘못 건너뛴 쓰기 |
| init Tailwind 4 안내 | 루트 전용 ui-react 의 `@import "@axis-ds/ui-react/tailwind.css";` 줄을 그대로 냄, 루트 전용 tokens 의 설치 줄을 감춤 | 그 줄을 넣으면 빌드 `Can't resolve`(M4 실측) | **결함**: 잘못된 안내 · 잘못 건너뛴 설치 안내 |
| init 애니메이션(Tailwind 4, 줄 있음) | 종전 ① 「플러그인이 필요합니다. yarn add tw-animate-css 뒤 전역 CSS 에 … 넣으세요」(줄이 이미 있는데도) | check 는 루트 전용 사유 WARN | **어긋남**(문구만, 안내대로 하면 해결됨) |
| init tailwindcss | 침묵 | check 는 dependencies FAIL(rc 1) | **어긋남**: init 이 알리지 않음 |
| init Tailwind 3 · 4 분기 | 루트 선언으로 Tailwind 4 분기 | 워크스페이스가 Tailwind 4 라 맞음(앱 선언 뒤에도 같은 분기) | 결함 없음(WI-0091 Q6 와 같음) |
| registry-core add(cli `axis add` · MCP `axis.install_component`) | 의존성 명령에서 루트 전용 clsx · tailwind-merge 를 뺌 | 컴포넌트 import 가 실패하므로 명령에 넣어야 함 | **결함**: 잘못 건너뛴 설치 안내 |
| theme add | tokens 를 앱 package.json 에 씀, 루트 전용 ui-react 는 줄을 넣지 않음, Tailwind 4 분기 | 같음 | 측정상 결함 없음(`rootDeclarationsAllowed` 가 이미 PnP 를 막음, WI-0087 P1) |
| template apply · MCP apply_template | Tailwind major 불일치 경고를 루트 선언으로 냄(앱 선언 A4 와 같은 경고) | 같음 | 측정상 결함 없음(MCP 는 Tailwind 판정이 없음) |

- 결함 · 어긋남은 PnP 루트 전용 레이아웃(R4 · U4 · R3 · M4)에서만 나왔어요. 앱 선언(A4 · A3) · 미선언(N4) · yarn node-modules(R4nm) · npm(R4npm)은 정상이었어요.
- 루트에 `dependenciesMeta.unplugged` 를 둬도(U4) 앱 issuer 는 루트 전용 패키지를 해석하지 못해 R4 와 같았어요.
- 모든 명령의 종료 코드는 0 이었어요(36칸). check 는 루트 전용 레이아웃에서 rc 1 이에요.

### 1.2 결정 (Q150 ~ Q157, 권장안으로 진행, 사용자 확인 대기)

7절 표에 선택지 · 근거가 있어요.

| # | 진행한 권장안 |
|---|---|
| Q150 | 범위: 결함이 측정된 init · registry-core add 만 한 PR 로 고쳐요. theme add · template apply 는 측정상 결함 없음이라 손대지 않아요(분할 불필요) |
| Q151 | init utils: PnP 루트 전용 clsx · tailwind-merge 는 미선언과 같게 init 의 범위로 앱 package.json 에 더하고, 사유 한 줄을 붙여요 |
| Q152 | init tailwindcss: PnP 루트 전용이면 check 와 같은 사유 한 줄(「! 필수 의존성 tailwindcss 가 … → 앱 package.json 에 선언하세요」). package.json 에는 쓰지 않아요 |
| Q153 | init Tailwind 4 안내: 루트 전용 컴포넌트 패키지는 줄 대신 check B1 과 같은 문구, 루트 전용 tokens 는 미선언과 같은 설치 줄에 사유를 붙여요 |
| Q154 | init 애니메이션: WI-0099 이 남긴 PnP 루트 전용 칸도 같은 줄 판정을 써 check 와 같은 사유 · `yarn add <이름>` |
| Q155 | Tailwind 3 · 4 분기(`detectTailwind`)와 template apply 의 Tailwind major 경고는 루트 선언을 계속 인정해요(WI-0091 Q6 선례) |
| Q156 | registry-core add: PnP 루트 전용 의존성은 미선언과 같게 명령에 넣어요. 사유 줄은 더하지 않아요(MCP 응답 형식 불변) |
| Q157 | 새 문구 확정은 사용자 몫(WI-0097 Q43 · WI-0099 Q147 선례) |

#### 다시 정하는 선례 결정

| 출처 | 종전 | 이 WI 뒤 |
|---|---|---|
| WI-0091 Q2 | 경계는 check 호출지에서만 켬. init(326 · 345 · 472) · theme add(396 · 475) · registry-core add(524) · template apply(56)는 WI-0095 로 | init 의 utils 의존성 · Tailwind 4 안내 · 애니메이션과 registry-core add 에서도 켬. theme add 는 이미 같은 경계(WI-0087 P1), Tailwind 분기 · template apply 경고는 Q6 대로 루트 인정(Q155) |
| WI-0086 | init utils · add 의존성은 루트 선언을 「이미 있음」으로 봄 | PnP 가 아니면 그대로, PnP 면 앱 선언만 「이미 있음」 |
| WI-0099 Q144 | PnP 루트 전용 애니메이션 칸은 종전 ① 줄 | 줄 판정의 루트 전용 사유(Q154) |
| WI-0087 P1(init 애니메이션) | PnP 는 앱 선언만 봄 | 그대로(줄이 없을 때의 종전 루프) |

## 2. 범위

### 2.1 하는 것

- registry-core `add/add.ts` `missingDependencies`: 선언 판정에 `appOnlyInPnp`(cli `axis add` · MCP `axis.install_component` 공용).
- cli `init/init.ts`:
  - `planUtilsDependencies`: 선언 판정에 `appOnlyInPnp`, 새 필드 `pnpRootOnly`. `reportDependencies` 가 사유 한 줄을 냄.
  - `tailwind4GuideLines`: 컴포넌트 패키지 · tokens 판정에 `appOnlyInPnp`, 루트 전용 줄 · 사유.
  - `animationGuideLine`: `pnpRootOnly` 사유가 있어도 줄 판정 경로(WI-0099 의 제외 조건 삭제).
  - 새 export `pnpRootOnlyTailwindLine` 과 `runInit` 의 출력 한 줄.
- registry-core `project.ts` `declaredDependency` 주석(적용 범위 서술 갱신).
- cli · mcp README 의 init · add · install_component 서술.

### 2.2 하지 않는 것

- theme add · template apply · MCP apply_template(측정상 결함 없음, Q150).
- `detectTailwind`(Tailwind 분기), 1.4.0 판정(`axisPackagesBelowTailwind4`), check 의 판정 · 문구 · 종료 코드.
- init 의 Tailwind 3 애니메이션 안내(루트 전용이면 종전 ① 「yarn add tailwindcss-animate 뒤 plugins 에 …」, check 는 WI-0091 A1 문구. 둘 다 앱 선언 방향이라 잔여로 둠, WI-0099 Q146 과 같은 이유로 tailwind.config 를 읽지 않음).
- `pnpFallbackMode: all` 읽기(WI-0091 Q1 잔여 오차 그대로).
- 다른 WI 문서 · project-todo.md · wi-mapping.json · CLAUDE.md(Master 몫).

### 2.3 알려진 한계 (이 WI 뒤에도 남음)

- `pnpFallbackMode: all` 인 워크스페이스는 루트 전용도 앱이 해석하는데, init 이 clsx · tailwind-merge 를 앱에 더하고 add 가 명령에 넣어요(무해한 중복 선언). WI-0091 Q1 의 거짓 FAIL 과 같은 잔여 오차예요(추정, 이번에 재지 않음).
- 루트 전용 tailwindcss 를 init 은 쓰지 않고 알리기만 해요(Q152). init 뒤에도 check 는 FAIL 이고, 사용자가 앱에 선언해야 해요.
- Tailwind 3 PnP 루트 전용 tailwindcss-animate 의 init · check 문구 차이(2.2).
- 루트 전용을 앱에 더할 때 범위는 init 의 범위(tailwind-merge 는 Tailwind 4 면 `^3.4.0`)라 루트 선언(예: `^3.3.1`)과 다를 수 있어요(Q151). 한 워크스페이스에 두 범위가 생기면 Yarn 이 둘 다 만족하는 버전을 고르거나 따로 설치해요(추정).

## 3. 수용 기준 (AC)

| AC | 기준 | 확인 |
|---|---|---|
| AC1 | 착수 전 main 으로 네 명령 × 레이아웃을 실측해 결함 호출지와 결과를 표로 기록 | testplan 2절: 9 fixture × 4 명령, 결함 4 · 어긋남 2 · 결함 없음 2(theme add · template apply) |
| AC2 | PnP 루트 전용 clsx · tailwind-merge 를 init 이 앱 package.json 에 더하고 사유를 알림 | 새 테스트, 수정본 측정 R4 · U4 · R3 |
| AC3 | init 의 Tailwind 4 안내가 루트 전용 컴포넌트 줄을 내지 않고 앱 선언을 안내, 루트 전용 tokens 에 설치 줄 | 새 테스트, 수정본 측정 R4 · U4 · M4 |
| AC4 | init 애니메이션의 PnP 루트 전용 칸이 check 와 같은 사유 | 새 테스트, 바뀐 WI-0099 테스트 1건 |
| AC5 | init 이 PnP 루트 전용 tailwindcss 를 check 와 같은 사유로 알림 | 새 테스트 |
| AC6 | add · MCP install_component 의존성 명령에 PnP 루트 전용 의존성이 들어감(CLI = MCP) | 새 테스트(cli · mcp), 수정본 측정 · MCP stdio |
| AC7 | PnP 가 아닌 레이아웃(pnpm · npm · yarn node-modules)과 PnP 앱 선언 · 미선언은 출력 · 쓰기 불변 | 새 음성 대조 13건, 수정본 측정 A4 · A3 · N4 · R4nm · R4npm 의 모든 로그 · 쓴 파일 바이트 같음 |
| AC8 | 안내대로 따르면 check · 빌드가 통과 | 스모크: 수정본 R4 는 check FAIL 0 · Tailwind 4 빌드 rc 0, 종전 안내대로는 FAIL 1 · 빌드 rc 1 |
| AC9 | 종료 코드 불변, 쓰는 파일 변화는 init 의 앱 package.json(PnP 루트 전용)뿐 | 측정 36칸 rc 같음, 쓴 파일 차이 3칸(R4 · U4 · R3 의 package.json) |
| AC10 | 새 테스트가 수정 전 코드에서 빨강, 변이마다 잡힘 | testplan 4절 |
| AC11 | 패키지별 type-check · lint · test(캐시 없이) · `pnpm check-changeset-mcp-tokens` 통과 | testplan 5절 |

## 4. 미측정 · 위험

- Next.js 빌드는 돌리지 않았어요. 빌드 근거는 `@tailwindcss/cli` 4.1.14 의 CSS 빌드와 앱 issuer `require.resolve` 예요(`clsx` 를 import 하는 `utils.ts` 의 해석은 require.resolve 로 대신함).
- `@tailwindcss/cli` 4.3.3 은 Yarn 4.5.3 PnP 에서 `Some options passed to require() aren't supported by PnP yet (conditions)` 로 앱 선언(A4)도 실패해 4.1.14 로 고정했어요(이 WI 와 무관한 도구 조합 문제, 측정 출처 6절).
- `pnpFallbackMode: all` · `pnpMode: loose` 레이아웃은 이번에 재지 않았어요(WI-0091 측정: loose 는 strict 와 같음).

## 5. 의존 · 순서

- 배치 11 의 마지막 WI 예요(WI-0099 → WI-0095). WI-0099 의 공용 함수 `inspectTailwind4Animation` 사유(`pnpRootOnly`)를 그대로 써요.
- registry-core 를 바꾸므로 changeset 에 cli · mcp patch 를 함께 넣었어요(CLAUDE.md). WI-0099 changeset 과 함께 다음 patch 로 발행돼요.

## 6. 측정 출처

- scratchpad `mkfx.sh`: Yarn 4.5.3 워크스페이스(루트 `workspaces: ["apps/*"]`, `.git`, apps/web 에 `@tailwindcss/cli` 4.1.14) 9개 실설치. R4(Tailwind 4 루트 전용) · A4(앱 선언) · N4(미선언) · U4(R4 + 루트 unplugged) · R3(Tailwind 3 루트 전용) · A3(Tailwind 3 앱 선언) · M4(tailwindcss · clsx · tailwind-merge 는 앱, tokens · ui-react · tw-animate-css 는 루트) · R4nm(yarn node-modules) · R4npm(npm 워크스페이스).
- `measure.sh <cli dist>`: fixture 마다 새 사본에서 `init -y` · `check` · `theme add ontology` · `add button -y` · `template apply dashboard --dry-run` 을 돌려 출력 · rc · 쓴 파일 sha256 을 남김. 종전은 main e4d89ae 빌드 사본(`base-cli`), 수정은 worktree 빌드(`pnpm turbo build --filter=@axis-ds/cli... --filter=@axis-ds/mcp... --force`, Cached 0).
- `probe.sh`: 앱 issuer `yarn node -e require.resolve` 와 `yarn tailwindcss` 빌드. `smoke.sh`: init 안내대로 고친 뒤 check · 해석 · 빌드. `mcp-call.mjs`: MCP stdio `axis.install_component`.

## 7. 사용자 결정 항목 (Q150 ~ Q157, 권장안으로 진행, 사용자 확인 대기)

| # | 질문 | 선택지 | 권장안 | 근거 |
|---|---|---|---|---|
| Q150 | 범위 · 분할 | ① 결함이 측정된 init · registry-core add 만 한 PR ② 명령별로 PR 분할 ③ 네 명령 모두 check 처럼 앱 선언만 보게 일괄 변경 | ① | 고칠 호출지는 init.ts 4곳 · add.ts 1곳이고 모두 같은 `appOnlyInPnp` 를 써서 한 PR 로 검토할 만해요. theme add 는 `rootDeclarationsAllowed` 로 이미 같은 경계였고, template apply 경고는 루트 선언 기준이 맞았어요(측정). ③ 은 결함 없는 출력을 바꿔요 |
| Q151 | init utils 의 PnP 루트 전용 clsx · tailwind-merge | ① 미선언과 같게 init 범위로 앱 package.json 에 추가 + 사유 줄 ② 쓰지 않고 안내만 ③ 루트 선언 범위를 복사해 추가 | ① | 앱이 해석하지 못해 `utils.ts` 가 깨지므로 쓰는 것이 init 의 목적(D1)에 맞아요. 미선언 앱과 같은 범위라 규칙이 하나예요. ③ 은 루트 범위가 `catalog:` · `workspace:` 같은 루트 전용 표기일 수 있어 앱에 옮기면 깨질 수 있어요(추정). ② 는 check 의 WARN 을 남겨요 |
| Q152 | init 의 PnP 루트 전용 tailwindcss | ① check 와 같은 사유 한 줄, 쓰지 않음 ② 침묵(종전) ③ 앱 package.json 에 추가 | ① | init 은 tailwindcss 를 관리하지 않아요(설치 · 범위는 프레임워크가 정함). 종전에는 init 이 침묵하고 check 가 FAIL(rc 1)이라 사용자가 init 뒤에야 알았어요 |
| Q153 | init Tailwind 4 안내의 루트 전용 컴포넌트 · tokens | ① 컴포넌트는 check B1 문구로 앱 선언 먼저, tokens 는 설치 줄 + 사유 ② 종전(줄 그대로 · 설치 줄 없음) ③ theme add 처럼 줄을 빼고 알리지 않음 | ① | 종전 줄을 넣으면 빌드가 `Can't resolve`(M4 실측). ③ 은 사용자가 원인을 모른 채 컴포넌트 스타일이 빠져요. check 와 같은 문구라 init → check 가 이어져요 |
| Q154 | init 애니메이션의 PnP 루트 전용 칸(WI-0099 `pnp-root-Ltwa-Itwa`) | ① WI-0099 줄 판정의 사유 · `yarn add <이름>` ② 종전 ① 줄 유지 | ① | 종전 줄은 「전역 CSS 에 넣으세요」라 이미 줄이 있는 사용자에게 틀린 지시예요. ① 은 check 와 같은 사유이고 명령(앱에 추가)이 같아요 |
| Q155 | Tailwind 3 · 4 분기와 template apply 의 Tailwind major 경고 | ① 루트 선언 계속 인정 ② 앱 선언만 | ① | 루트 전용 Tailwind 4 워크스페이스에서 앱 선언만 보면 Tailwind 판정 불가 → Tailwind 3 분기(설정 파일 경로 기록)로 가고, template apply 는 Tailwind 4 프로젝트에 Tailwind 3 템플릿 경고를 놓쳐요. 사용자가 tailwindcss 를 앱에 선언해도 같은 분기라 ① 이 맞아요(WI-0091 Q6) |
| Q156 | add 의존성 안내의 사유 | ① 미선언과 같게 명령에만 넣음 ② 명령 + 사유 줄 | ① | 명령은 그대로 실행하면 해결돼요. 사유 줄은 cli 출력과 MCP 응답 형식을 함께 바꿔야 해서 범위가 커요. check · init 이 사유를 알려요 |
| Q157 | 새 문구 확정 | ① 사용자 확정(권장안 문구로 구현) ② 지금 확정 | ① | WI-0097 Q43 · WI-0099 Q147 선례. 새 문구는 release-notes 「바뀐 점」에 모았어요 |
