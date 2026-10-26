# WI-0087: theme add · init 애니메이션 안내가 워크스페이스 루트에 선언된 의존성을 인정 PRD

> 작성일: 2026-10-26 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0087 | GitHub: #222 | 우선순위: P3 | 상태: Approved (2026-10-26 사용자 결정, 문구 해석 일부는 확정 대기 · 5절)
> 기준: `main` c925ddf (linked 1.8.2 · cli 1.7.4 · mcp 1.4.4 발행됨) 위 브랜치 `fix/wi-0087-theme-add-root-deps` | origin/main 은 그 뒤 WI-0027 커밋 2개(0d621b6 · 1ca4025)가 앞서 있고, 겹치는 파일은 `init.test.ts` 의 다른 hunk 하나예요(충돌 없음은 추정)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정, 발행본 cli 1.7.4)

WI-0086 은 의존성 선언 판정을 `declaredDependency`(앱 `package.json` 다음 워크스페이스 루트, 쓰기는 앱으로만)로 합쳤어요. 그런데 `axis theme add` 의 세 판정과 `axis init` 의 애니메이션 안내는 앱 선언만 봐서, 루트에만 선언한 모노레포 앱에서 check · init · add 와 판정이 갈라졌어요.

| # | 위치(수정 전) | 증상 | 측정 |
|---|---|---|---|
| 1 | `theme-add.ts` 433 tokens | 루트에 `@axis-ds/tokens` 가 있어도 앱 `package.json` 에 `"^1.6.0"` 을 새로 씀 | depwrite 픽스처(npm · pnpm · pnpm hoisted x A~E) 앱 선언이 없는 12건 모두 씀, 미설치 6건도 모두 씀. 대조 D(앱 선언) 3건은 쓰기 없음 |
| 2 | `theme-add.ts` 432 theme | 루트에 `@axis-ds/theme` 를 선언해도 「ThemeProvider 를 쓰면 @axis-ds/theme 설치」 안내 | depwrite 15건 모두 안내, 미설치 6건도 안내 |
| 3 | `theme-add.ts` 356 컴포넌트 CSS | Tailwind 4 에서 루트에만 `@axis-ds/ui-react` 를 선언하면 `tailwind.css` 줄을 넣지 않아, theme add 직후 check 가 「컴포넌트 스캔 경로(tailwind.css)가 없습니다」 WARN | tw4comp 설치 3레이아웃에서 줄 0, 빌드 rc 0 이지만 `axis-button-bg-default` 4줄(줄을 넣으면 6줄) |
| 4 | `init.ts` 213 `animationGuideLine`(888 호출지가 baseDir 를 넘기지 않음) | 루트에 선언 · 설치한 플러그인에도 설치를 권하고, 앱에 선언만 하고 설치하지 않으면 침묵 | anim 15변형: V1 · V3 종전 줄(거짓 안내), V9 · V12 · V14 침묵(check 는 「미설치(선언만 있음)」 WARN) |

### 1.2 결정 (2026-10-26 사용자 결정)

| # | 결정 | 근거 |
|---|---|---|
| P1 | Yarn PnP(`isPnpProject(baseDir)`)면 theme add 세 판정과 init 애니메이션 안내 모두 루트 선언을 인정하지 않고 종전 동작(앱 선언만)을 유지 | PnP 는 루트 선언이 앱에서 해석된다는 보장이 없음. check 쪽의 같은 결함은 별도 WI(DEC-9) |
| P2 | 앱 디렉터리 자체에 lockfile(`package-lock.json` · `pnpm-lock.yaml` · `yarn.lock` · `bun.lockb` · `bun.lock`)이 있으면 theme add 는 루트 선언을 쓰기 생략 · 안내 침묵의 근거로 쓰지 않고 종전 동작 | 앱이 워크스페이스 멤버가 아니라 따로 설치되는 경우. theme add 안에서만 보는 조건 |
| DEC-1 | tokens 는 `declaredDependency` 로 판정. 루트에서 찾으면 action `present` + `DependencyStep.declaredSource?: "app" \| "root"`, 앱 `package.json` 에 쓰지 않음. 문구 「- package.json: @axis-ds/tokens <범위> 가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음」. 앱 선언 문구는 바이트 그대로 | WI-0086 과 같은 경계, 쓰기는 앱으로만 |
| 설치 안내 | 루트 선언 present 이고 tokens 설치본이 없을 때(`plan.tokens.status`) 「설치: <installCommand>」 줄. 루트 출처에만 적용 | 앱에 쓰지 않으면 종전의 「설치는 실행하지 않았습니다. 설치: …」 줄이 빠지므로 |
| DEC-2 | Tailwind 4 컴포넌트 `tailwind.css` 줄: 앱 선언은 종전대로(설치 여부 무관). 루트에만 선언했으면 `findInstalledPackage` 로 찾은 설치본에 `tailwind.css` 파일이 실제로 있을 때만 줄을 씀. 없으면 줄을 쓰지 않고 안내 1줄(미설치 · 1.4.0 미만 구분) | 루트 선언 · 미설치에 줄을 넣으면 빌드가 「Can't resolve」로 깨짐(F2 앱 선언 미설치 실측 rc 1) |
| DEC-3 | `themeMissing` 을 `declaredDependency` 로 판정, 루트 theme 선언이면 ThemeProvider 설치 안내를 끔(P1 · P2 조건에서는 종전) | 1.1 #2 |
| DEC-4 | `animationGuideLine(pkg, tailwind4, installCommand, baseDir?)`: baseDir 가 없으면 종전 경로. 있으면 ① 미선언 → 종전 줄 ② 선언 + 설치 → 침묵 ③ 선언 · 미설치 → 「(워크스페이스 루트에) 선언돼 있지만 설치되지 않았습니다. <installCommand> 뒤 …」(TW3 plugins 에 `require("tailwindcss-animate")`, TW4 는 이름에 맞게 `@import "tw-animate-css";` 또는 `@plugin "tailwindcss-animate";`). 888 호출지에서 baseDir 를 넘김. PnP 면 루트 선언 불인정, 선언이 있으면 종전(침묵) | 1.1 #4 |
| DEC-5 | `init.test.ts` 2073 「음성 대조: 플러그인이 이미 선언돼 있으면 안내 없음」은 픽스처에 `node_modules/tailwindcss-animate/package.json` 을 넣어 「선언 + 설치 → 침묵」 대조로 바꾸고, 미설치 케이스는 새 테스트로 | 기존 기대 중 바꾸는 것은 이것과 `theme-add.test.ts` 718 주석뿐 |
| DEC-6 | 이름 집합은 check 와 같게: TW3 = `tailwindcss-animate` 만, TW4 = `tw-animate-css` · `tailwindcss-animate` 둘 다(둘 다 선언되면 `tw-animate-css` 우선). V8 · V14 기대를 AC 로 고정 | check 와 init 안내가 같은 이름을 보게 |
| devDeps | 루트 `devDependencies` 선언도 인정(WI-0086 경계). release-notes · changeset 에 「앱만 따로 운영 설치 · 배포하면 앱에 직접 선언 필요」 기록 | 루트 devDependencies 는 앱 단독 운영 설치에 들어가지 않음 |
| DEC-7 | 루트 범위가 낮아도 범위 안내 없음(upgrade 조건은 종전대로 설치본 < 1.3.0 만) | 범위 판정 규칙을 이번에 늘리지 않음 |
| DEC-8 | 루트 출처이고 upgrade 이면 앱 기준 업그레이드 명령을 내지 않고 「워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.」만 냄(2026-10-26 사용자 재결정, 처음 결정은 명령 뒤 덧붙임) | 선언 위치를 알려 줌 |
| DEC-9 | 범위 밖 4건은 별도 WI 로 등록(1.3) | 이번 WI 를 cli patch 하나로 |
| 버전 | `@axis-ds/cli` patch 만(예상 1.7.5). registry-core · brand-core · tokens 는 바꾸지 않음 | 공개 헬퍼(`declaredDependency` · `findInstalledPackage` · `isPnpProject` · `workspaceRootPackage`)가 이미 export 돼 있음 |

### 1.3 범위 밖

- DEC-9 의 4건은 **별도 WI 등록 예정(Master)** 이에요.
  1. `axis check` 가 Yarn PnP 에서 루트 선언으로 거짓 PASS 를 내는 것.
  2. Tailwind 4 애니메이션 판정(`tailwind-core.ts` 1400 근처)이 CSS import 만 보고 선언 · 설치를 보지 않는 것.
  3. `axis theme list` · `info` 의 미설치 안내가 선언 여부와 상관없이 add 명령을 내는 것(MCP `brand.ts` 도 같음).
  4. `dependencies` 항목의 `@axis-ds/*` 설치 확인 대상(`declaredAxisPackages`)이 루트 선언을 포함하지 않는 것.
- 루트 `package.json` 에 쓰기: 쓰기는 계속 앱 `package.json` 으로만 해요.
- template apply · MCP `apply_template` 의존성 안내(WI-0088 범위), tailwind-core 의 「baseDir 없을 때」 호환 분기.

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | theme add 가 루트에 선언된 tokens 를 앱 `package.json` 에 다시 쓰지 않고 루트 문구를 냄. 미설치면 설치 줄, upgrade 면 루트 선언을 올리라는 줄 | AC1 · AC2 |
| FR-2 | 루트 theme 선언이면 ThemeProvider 설치 안내 없음 | AC3 |
| FR-3 | Tailwind 4 에서 루트에만 선언한 컴포넌트 패키지의 `tailwind.css` 줄은 설치본에 파일이 있을 때만, 아니면 안내 1줄 | AC4 |
| FR-4 | init 애니메이션 안내 3갈래(DEC-4 · DEC-6) | AC5 |
| FR-5 | P1 · P2 · 앱 선언 · 워크스페이스 밖 상위는 종전 출력 | AC6 |

### 2.1 AC

- **AC1**: npm workspaces 루트 `devDependencies` · pnpm-workspace 루트 `dependencies` 에 tokens 를 선언한 앱에서 theme add 가 앱 `package.json` 을 바꾸지 않고(쓰기 0) 「… 가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음」을 냄. 실제 설치 픽스처 depwrite 12건 · 미설치 6건에서 앱 쓰기 0.
- **AC2**: 루트 선언 · tokens 미설치면 그 다음 줄에 「설치: <installCommand>」(lockfile 에 따라 `npm install` · `pnpm install`). 루트 선언 · 설치본 1.2.1 이면 업그레이드 줄 다음 줄에 「워크스페이스 루트 package.json 의 선언을 올리세요.」. 앱 선언이면 두 줄 모두 없음.
- **AC3**: 루트 `@axis-ds/theme` 선언이면 ThemeProvider 설치 안내 없음(depwrite B · C · E 9건). 앱 · 루트 모두 없으면 안내 1줄(A 유지).
- **AC4**: Tailwind 4 + 루트 ui-react 설치본에 `tailwind.css` 있음 → 줄 추가, 빌드 클래스 4→6줄(tw4comp 실설치). 설치본 1.3.x(파일 없음) → 줄 없음 + 1.4.0 안내 1줄. 미설치 → 줄 없음 + 설치 안내 1줄, 빌드 rc 0(Can't resolve 없음). Tailwind 3 은 줄 · 안내 0.
- **AC5**: anim 15변형이 V1 · V3 · V15 침묵, V2 · V4 · V8 루트 ③(V4 `@import`, V8 `@plugin`), V9 · V12 · V14 앱 ③(V12 `@import`, V14 `@plugin`), V5 · V6 · V7 · V10 · V11 · V13 종전 미선언 줄. TW4 두 이름 선언이면 `tw-animate-css` 로 판정.
- **AC6**: PnP(`.pnp.cjs`) 픽스처에서 theme add · init -y 출력과 파일이 수정 전과 바이트 같음, `.pnp.cjs` 만 치운 양성 대조에서는 루트 문구가 나옴. 앱 디렉터리 lockfile 5종 각각 종전, 워크스페이스가 아닌 상위 선언 종전, 앱 · 루트 동시 선언은 앱 출처 · 종전 문구. depwrite 대조 D 3건 출력 바이트 같음.
- **AC7**: 변이(tokens · theme 판정 되돌림, 컴포넌트 CSS 루트 분기 · 파일 게이트 제거, PnP · lockfile 분기 제거, 설치 줄 · 덧붙임 줄 제거, init 설치본 판정 · baseDir 전달 · DEC-6 인정 · 우선순위 변경) 각각 빨강 1건 이상.

## 3. 릴리스

- `@axis-ds/cli` patch(예상 1.7.5). registry-core 를 바꾸지 않으므로 `check-changeset-mcp-tokens` 가 mcp 를 요구하지 않아요(추정, 변경 파일이 cli 뿐).
- 동작 변경은 release-notes 「바뀐 점」. 앱 선언 사용자에게도 init 애니메이션 줄이 바뀌는 경우가 있어요(V9 · V12 · V14 · V13).

## 4. 쓰기 · 출력 경계

- 쓰기는 앱 `package.json` · 전역 CSS · `axis.config.json` 그대로이고, 루트 `package.json` 은 쓰지 않아요.
- 앱 선언(또는 P1 · P2 조건)이면 theme add 출력과 파일은 종전과 바이트 같아요(depwrite D · PnP 실측).

## 5. 구현 해석 · 리뷰 후속 (2026-10-26 확정)

구현이 결정 문구를 해석했거나 리뷰가 찾은 항목이에요. 모두 사용자 확인을 거쳐 아래 「확정」대로예요.

| # | 항목 | 확정 |
|---|---|---|
| U1 · U6 | 루트 upgrade 안내 | 앱 기준 명령을 빼고 루트 선언을 올리라는 문구만(사용자 재결정, DEC-8 갱신) |
| U2 | DEC-2 안내 문구 | 미설치 「… 선언됐지만 설치되지 않아 … 를 넣지 않았습니다. 설치(<cmd>) 뒤 …」, 1.4.0 미만 「(1.4.0 부터 제공) … 1.4.0 이상으로 올린 뒤 …」, 버전을 못 읽으면 「버전 모름」 |
| U3 | 설치본 1.4.0 이상인데 `tailwind.css` 없음 | 리뷰 후속으로 고침: 「설치가 손상됐을 수 있으니 다시 설치(<cmd>) 뒤 …」 |
| U4 | 전역 CSS 에 이미 그 줄이 있음 | 리뷰 후속으로 고침: 안내 대상에서 뺌(다시 실행해도 반복되지 않음) |
| U5 | 루트 출처 「설치:」 줄의 조건 | `plan.tokens.status === "not-installed"` 일 때만(확정) |
| U7 · U8 | init ③ 문구 | 루트일 때만 「워크스페이스 루트에 」, 종전 설명문은 넣지 않음(확정) |
| U9 | TW4 두 이름의 판정 순서 | 이름 우선(`tw-animate-css` 먼저)(확정) |
