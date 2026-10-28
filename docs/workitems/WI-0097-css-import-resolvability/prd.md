# WI-0097: check 가 해석되지 않는 CSS import 를 안내 · 인정함(TW4 B1 · globals.css tokens import) PRD

> 작성일: 2026-10-28 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0097 | GitHub: #241 | 우선순위: P3 | 상태: Approved (2026-10-28 사용자 결정 Q21 · Q22 · Q24 · Q26 · Q27 · Q28 · Q37 · Q39 · Q40 · Q41 · Q42 · Q43)
> 기준: `main` 18d0357 (linked 1.8.2 · cli 1.7.6 · mcp 1.4.5 발행됨, `git log ffc0383..HEAD -- packages/` 0줄이라 발행본과 소스가 같음). 같은 발행에 WI-0098(#242) · WI-0100(#244)을 묶어요(cli 1.7.7 · mcp 1.4.6)
> 표기: **측정**(착수 조사 · 반박 검증에서 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, 발행본 cli 1.7.6 · mcp 1.4.5, `@tailwindcss/cli` 4.1.14)

`axis check` 의 Tailwind 4 B1(컴포넌트 `tailwind.css` 누락 안내)은 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 가 **선언됐는지만** 봐요(`tailwind-core.ts:826-831`, `declaredRange` 옵션 없음). 설치 여부, 설치본에 `tailwind.css` 파일이 있는지, Plug'n'Play, 앱 lockfile(P2)은 보지 않아요. 그래서 안내를 따르면 빌드가 `Can't resolve` 로 깨지는 줄을 권하고, 이미 그런 줄이 있으면 PASS 로 인정해요. `globals.css` 항목도 tokens CSS import 줄(`:303-305`, `:360-366`)과 레이아웃 JS import(`:324-338`)만 보고 해석 가능성은 보지 않아요. 같은 레이아웃에서 `theme add` 는 WI-0087 DEC-2(`theme-add.ts:404-419`)로 그 줄을 넣지 않아 두 명령의 결론이 반대예요.

| fixture | 레이아웃 | 발행본 check(tailwind.config · globals.css) | 그 줄의 실빌드 |
|---|---|---|---|
| root-notinst | TW4, 루트에만 ui-react(검증은 agentic-ui) 선언, 설치본 없음 | B1 WARN「→ `@import "<pkg>/tailwind.css";`」, rc 0 | 줄 있음 rc 1 `Can't resolve`, 줄 없음 rc 0, 패키지 1.8.2 설치 뒤 줄 있음 rc 0 |
| root-inst-css | 루트 선언, 설치본에 `tailwind.css` 있음(정상 대조군) | 같은 B1 WARN | 미측정(설치 양성 대조로 rc 0 과 같은 조건, 추정) |
| root-inst-nofile | 루트 선언, 1.8.2 설치본에 파일 없음(손상) | 같은 B1 WARN | 미측정 |
| root-inst-old | 루트 선언, 설치본 1.3.0(파일 없음) | 같은 B1 WARN + 「(1.4.0 이상 필요: … 설치본 1.3.0)」 | 미측정 |
| pnp-root | `.pnp.cjs` + 루트에만 선언 | 같은 B1 WARN | **미측정**(Q22 착수 전 측정) |
| applock-root | 앱 `package-lock.json`(P2) + 루트 선언 | 같은 B1 WARN | 미측정 |
| appdecl-notinst | 앱 선언, 설치본 없음 | 같은 B1 WARN | 미측정(WI-0087 F2 의 rc 1 은 문서 인용, 재측정 안 함) |
| root-notinst-withline · root-inst-nofile-withline · pnp-root-withline | 위 레이아웃 + 줄이 이미 있음 | tailwind.config **PASS** | root-notinst-withline 은 rc 1(측정, 패키지 없는 build 구성). root-inst-nofile-withline · pnp-root-withline 은 미측정 |
| appdecl-notinst-withline | 앱 선언 · 미설치 + 줄 | PASS | 미측정 |
| root-inst-old-withline | 1.3.0 + 줄 | WARN「… import 가 있지만 … 버전 확인이 필요합니다」(`:843-847`) | 미측정 |
| g1 | TW3, tokens 미선언 · 미설치, `@import "@axis-ds/tokens/css"` | globals **PASS**, dependencies 는 tokens 를 언급 안 함(`REQUIRED_DEPENDENCIES` 는 tailwindcss 하나, `dependencies-core.ts:52`) | `css` · `css/tailwind4` 둘 다 rc 1(측정, tokens 없는 build2 구성. g1 fixture 자체에서는 빌드하지 않음) |
| g2 | TW4, tokens 앱 선언 · 미설치(수정본도 globals PASS 그대로, Q28) | tailwind.config PASS · globals PASS, dependencies 만 「선언됐지만 설치되지 않은 의존성」 WARN | rc 1 **추정**(tokens 미설치 실빌드 rc 1 을 build2 에서 측정했고 같은 조건으로 적용, g2 fixture 자체에서는 빌드하지 않음) |
| g4 | PnP, tokens 루트 전용 | 두 항목 PASS, dependencies 만 `PNP_ROOT_ONLY_NOTE` | 미측정 |
| g5 | TW3, `layout.tsx` 의 `import "@axis-ds/tokens/css"`, tokens 미선언 · 미설치 | globals PASS(rc 1 은 tailwind.config 파일 없음 FAIL 때문) | **미측정**(JS import 는 번들러가 해석, Tailwind CLI 로 재지 않음) |
| g3 | `.pnp.cjs` 표지만 둔 stub(`fx/g3-pnp-app`), tokens 앱 선언 | **미기록**(조사 · 반박 검증 결과에 check 출력 기록 없음, 착수 때 재측정) | 해당 없음(stub) |
| pnp-app | Yarn 4.5.3 PnP 실설치(`WI-0097/pnp-app`, g3 와 다른 디렉터리), tokens 앱 선언 · 설치 | check 는 재지 않음 | `css/tailwind4` · `css` 둘 다 rc 0, 산출물 `--axis-` 572 · 568줄(측정, 검증 값. 조사 값 570 · 568 은 셈 방식 차이) |

- 모든 fixture 의 check 는 rc 0 이에요(g5 만 rc 1, 원인은 이 WI 와 무관한 tailwind.config FAIL). 출처: 조사 `scratchpad/WI-0097/fx`, 반박 검증 `scratchpad/WI-0097-verify/fx`
- MCP `axis.check_project`(stdio JSON-RPC)도 root-notinst · root-notinst-withline · g1 에서 CLI 와 같은 결과예요(측정). 같은 코어 함수를 번들해요(`axis-mcp/src/tools/template.ts:409 · 412`)
- 정정: Issue 본문의 「PnP 앱 선언에서도 실패」는 이번 정의(PnP 앱 선언 + 설치)로는 재현되지 않았어요(g3). 그 문구의 출처를 WI-0092 Y2 로 본 조사 추정은 검증에서 **확인 불가**였어요(Y2 는 animation fixture). 「앱 선언했지만 캐시에서 빠진」 경우는 미측정이고 이번에 고치지 않아요(5절)
- 정정: 조사 결정 D6 의 근거(pnp-app 의 미선언 ui-react 줄 rc 1)는 「루트 전용 선언」이 아니라 「어디에도 미설치」를 잰 값이에요(검증 **확인 불가** 판정). PnP 루트 전용이 해석되지 않는다는 근거는 지금 `project.ts:174-175` 주석의 WI-0091 실측 주장뿐이라, Q22 가 착수 전 실빌드 1회를 요구해요

### 1.2 결정

#### 사용자 결정 (2026-10-28)

| # | 결정 | 이 WI 에서 |
|---|---|---|
| Q21 | 앱에 선언했지만 미설치인 경우는 B1 해석 게이트로 막지 않아요(DEC-2 `theme-add.ts:405-409` 와 대칭, 미설치는 dependencies 의 기존 WARN 이 알림). 막는 것은 **루트 선언 · 미설치(또는 설치본에 `tailwind.css` 없음)** 와 **PnP 루트 전용**이에요 | AC1 · AC2 · AC5, 앱 선언은 두 방향 모두 회귀 가드(AC7). globals.css 에 같은 이유를 적용한 것은 Q28 |
| Q22 | WI-0091 Q7 의 「Tailwind 판정에서 PnP 루트 전용 선언은 현행 유지」를 다시 열어요. PnP 루트 전용이면 줄 · 경로를 권하지도 인정하지도 않고 `PNP_ROOT_ONLY_NOTE` 계열 안내를 내요. 구현 첫 단계에서 PnP 루트 전용 CSS `@import` 실빌드를 1회 재서 근거를 확정해요 | AC3 · AC5 · AC6, todo 결정 2번 |
| Q24 | init 의 Tailwind 4 안내(`init.ts:324-332`, `:331` tokens 줄)는 이번에 고치지 않고 WI-0095(#239)로 보내요 | 범위 밖 |
| Q26 | Tailwind 3 preset 을 ESM · `.ts` 설정에서 쓰면 tokens 미선언 · 미설치여도 PASS 인 결함은 별도 WI-0101(Master 등록) | 범위 밖 |
| Q27 | `packages/axis-cli/README.md` 를 필수로 고치고, `docs/guides/troubleshooting.md` 에 PnP 한 줄을 더해요. 템플릿 content 는 별도 WI | 문서 범위 |
| Q28 | globals.css 의 tokens 해석 게이트도 Q21 과 같은 이유(미설치는 dependencies 의 「선언됐지만 설치되지 않은 의존성」 WARN 이 이미 알림)로 **앱 선언 · 미설치(g2)는 막지 않고** 종전 PASS 를 유지해요. globals 에서 해석 불가 WARN 을 내는 것은 **루트 선언 · 미설치, 미선언(설치본 없음), PnP 루트 전용**뿐이에요 | AC6 · AC7(G2 회귀 가드) · AC11 M6, 6절 O1 닫음 |
| Q37 | (WI-0100a 에서 넘어옴) 프로젝트 밖 진입 파일(`globalCss` 가 앱 밖을 가리키는 경우)의 패키지 줄은 그 파일 위치 기준으로 해석 게이트를 돌려 해석되지 않으면 WARN 이에요 | 2부 몫(0100a 머지 뒤). 1부에서는 구현하지 않음, plan 3절 · todo 2부 |
| Q39 | 설치본 버전을 읽지 못하고(`installedVersion: "?"`) `tailwind.css` 파일도 없는데 줄이 이미 있으면(root-inst-unknown-withline) 종전 PASS 가 아니라 해석 불가 WARN 이에요. 줄 없음(F4u)은 1.4 표 4번대로 「버전 모름」 표기 올림 안내예요 | 1.4 표 4번 줄 있음 칸, AC5, plan 4절 전이 행, 종료 코드 불변 |
| Q40 | Plug'n'Play 에서 앱에 선언하면 컴포넌트 `tailwind.css` import 는 해석되지만(rc 0) 컴포넌트 클래스가 생성되지 않는 현상(testplan 2절 부수 관찰)은 WI-0102(#249)로 분리해요 | 코드 변경 없음, 5절 잔여 · release-notes 한계에 「WI-0102 로 이관」 |
| Q41 | H4(npm 루트 설치 안내 구절이 check 와 theme add 에서 다름) · H5(선언 범위가 1.4.0 미만이거나 미설치일 때 설치 뒤 `@import` 안내)는 잔여로 둬요 | 5절 잔여. H4 는 WI-0096 에서 맞춤 |
| Q42 | 해석 판정 순서는 「설치본 파일 존재 → 버전」으로 확정해요. 파일이 있으면 버전과 상관없이 해석되고, 버전은 파일이 없을 때만 4번 · 5번을 가르는 데 써요 | 1.4 표 6번 칸, `project.ts` `componentCssResolution` docstring |
| Q43 | TW4 B1 의 새 안내 문구 8개(줄 없음 4: 루트 선언 미설치 · PnP 루트 전용 · 설치본 파일 없음(손상) · 1.4.0 미만/버전 모름, 줄 있음 4: 미설치 · PnP 루트 전용 · 설치본 파일 없음 · 버전 모름)를 지금 구현 그대로 확정해요. 코드는 바꾸지 않아요 | 1.4 표 문구 칸은 초안 당시 표현으로 두고 확정 문구는 testplan 4.4, todo 문구 확인 항목 닫음 |

Q23(WI-0098) · Q25(WI-0100)와 Q29 ~ Q36 · Q38(WI-0098 · WI-0100a)은 이 WI 에 해당하지 않아요.

#### 선례 · 코드로 정한 항목 (사용자 결정이 아님, 경계 보고서 3절)

| 항목 | 답 | 근거 |
|---|---|---|
| 판정 헬퍼 위치(조사 D3 · extra 4) | registry-core 로 옮겨요. DEC-2 의 판정(`theme-add.ts:404-419`), 미루는 이유 문구(`theme/index.ts:367-385`), `COMPONENT_TAILWIND_CSS_MIN_VERSION`(`theme-add.ts:115`)을 registry-core 로 옮기고 `TAILWIND4_MIN_AXIS_VERSION`(`tailwind-core.ts:393`)과 하나로 합쳐요. theme add 출력은 바이트 불변 | WI-0093 Q14(MCP 가 cli 코드를 쓸 수 없음) |
| TW4 토큰 진입점이 해석되지 않을 때 알리는 항목(D4) | globals.css 만 WARN. tailwind.config 의 TW4 PASS 는 그대로 | WI-0091 Q6 |
| 심각도(D5) | 항목별로 유지. 새 판정은 모두 WARN, 종료 코드 불변 | WI-0092 Q10 · WI-0094 Q11, README:115 |
| `pnpFallbackMode: all`(D7) | 잔여 오차로 둬요 | WI-0091 Q1 |
| 「해석된다」의 정의(extra 1) | B1 은 설치본의 `tailwind.css` **파일** 존재, tokens 는 설치본 **패키지 디렉터리** 존재(PnP 는 앱 선언). tokens 를 앱에 선언했으면 미설치여도 게이트 밖(Q28) | `tailwind-core.ts:411` · `:1438`, `apps/web/src/app/layout.tsx:7`(workspace 링크 · dist 없는 저장소에서 거짓 WARN 방지) |
| 앱 lockfile(P2) | 루트 선언을 인정하지 않아요(선언 없음과 같음) | `project.ts:237-239` `rootDeclarationsAllowed` |
| 펼친 `@import` 안의 근거(0097 R2 · 0100 경계) | 해석될 때만 인정. 펼침은 WI-0100b 가 이 WI 헬퍼를 거쳐요 | 경계 보고서 1-3 |

### 1.3 목표

- check · MCP 가 컴포넌트 `tailwind.css` 줄과 tokens CSS import 를 「선언됐는가」가 아니라 「이 앱에서 해석되는가」로 판정해요. 해석되지 않는 줄은 권하지도 인정하지도 않아서, 안내를 따랐다가 `Can't resolve` 로 깨지는 경로를 없애요
- 같은 레이아웃에서 check 와 theme add 가 같은 결론을 내도록 판정을 registry-core 헬퍼 하나로 써요
- 새 축이 판정할 수 없는 경우(앱 선언, 단일 앱, TW3 preset 경로)는 종전 동작을 그대로 둬요

### 1.4 판정 갈래와 우선순위 (B1, 루트 선언만)

같은 패키지에 여러 갈래가 맞으면 위에서부터 하나만 써요. 문구는 구현이 정하고 testplan 에 확정 기록해요(WI-0091 A1 선례). 아래 표의 문구는 초안 당시 표현이고, 확정 문구(사용자 결정 Q43)는 [testplan 4.4](./testplan.md) 에 코드 문자열 그대로 있어요.

| 순서 | 갈래 | 판정 | 줄 없음 방향(안내) | 줄 있음 방향 |
|---|---|---|---|---|
| 1 | PnP 루트 전용 | `pnpRootOnlyDependency` | 「<pkg> 가 `PNP_ROOT_ONLY_NOTE` → 앱 package.json 에 선언한 뒤 `@import …` 를 넣으세요」 | WARN 같은 틀(「… import 가 있지만 <pkg> 가 `PNP_ROOT_ONLY_NOTE`」) |
| 2 | P2(앱 lockfile) | `hasAppLockfile` | 선언 없음과 같음(요구하지 않음) | 판정하지 않음(종전 PASS) |
| 3 | 루트 선언 · 미설치 | `findInstalledPackage` 없음 | 「루트에 선언됐지만 설치되지 않았습니다 → 설치(<설치 명령>) 뒤 `@import …`」(DEC-2 U2 대칭) | WARN「import 가 있지만 설치되지 않아 해석되지 않습니다」 |
| 4 | 설치본 1.4.0 미만 또는 버전 모름(`installedVersion` 이 `"?"`), 파일 없음 | 설치본 버전 비교 | 1.4.0 이상으로 올리라는 안내(줄 없음, 버전 모름은 「버전 모름」 표기, DEC-2 문구 `theme/index.ts:370-383` 세 번째 갈래와 같음) | 1.4.0 미만은 종전 `:843-847` 버전 WARN 그대로. 버전 모름은 WARN「import 가 있지만 설치본(버전 모름)에 tailwind.css 가 없어 해석되지 않습니다」(Q39, 종전은 범위만 보는 버전 판정이 통과시켜 PASS) |
| 5 | 1.4.0 이상인데 파일 없음 | `isFile(<dir>/tailwind.css)` 거짓 | 다시 설치 안내(DEC-2 U3 대칭) | WARN「설치본에 tailwind.css 가 없어 해석되지 않습니다」 |
| 6 | 설치본에 파일 있음 | `isFile(<dir>/tailwind.css)` 참. 설치본에서는 4번 · 5번보다 **먼저** 봐요(Q42: 파일 존재 → 버전). 파일이 있으면 버전과 상관없이 해석됨 | 종전 B1 문구 그대로(바이트 동일) | 종전 PASS(설치본이 1.4.0 미만이면 종전 버전 WARN) |

- 겹치는 갈래: PnP 에는 `node_modules` 가 없어 1번 대상은 3번(미설치)으로도 잡히고, 1.3.0 설치본에는 `tailwind.css` 가 없어 4번 대상은 5번(파일 없음)으로도 잡혀요. 그래서 1 → 3, 4 → 5 순서가 판정을 정해요(AC11 M5a · M5b). 3번과 4번은 동시에 성립하지 않아요
- 앱 선언(Q21)은 이 표를 타지 않아요. 줄 없음은 종전 B1 줄 안내, 줄 있음은 종전 판정(1.3.0 이면 버전 WARN)이에요
- 두 패키지가 섞이면 해석되는 쪽은 종전 `missing.map(componentTailwindImportLine).join(" ")`(`:834`) 묶음에 남기고, 해석되지 않는 쪽은 패키지마다 문제 한 개로 ` / ` 뒤에 이어요(구현 세부, AC5 에서 측정)
- globals.css(tokens)는 PnP 루트 전용 → `PNP_ROOT_ONLY_NOTE` 틀, 루트 선언 · 미설치와 미선언 · 미설치(non-PnP 는 설치본 디렉터리 없음, PnP 는 앱 미선언) → 「import 가 있지만 @axis-ds/tokens 가 설치되지 않아 해석되지 않습니다 → 설치 안내」 WARN 이에요. 앱 선언은 설치 여부와 상관없이 종전 PASS 예요(Q28, g2). 미선언이어도 non-PnP 설치본 디렉터리가 있으면 해석돼 PASS 예요(extra 1, G6)

### 1.5 범위

- **포함**: registry-core `project.ts`(해석 상태 헬퍼), `template/tailwind-core.ts`(`tailwind4Issues` B1 두 방향 · `checkGlobalsCss` tokens 게이트 · 주석 `:1-33` · `:55-65`), DEC-2 판정 · 문구 · 상수의 registry-core 이전과 cli `theme-add.ts` · `theme/index.ts` 의 호출 교체(출력 불변), registry-core `project.ts:174-175` 주석(「PnP 루트 선언은 check 만 불인정」 서술), `packages/axis-cli/README.md` check 절(`:101` · `:104` · `:109`, `:104` 는 Tailwind 4 문제 5번 「import 가 있는데 버전 조건」 서술이라 줄 있음 방향 확대로 거짓이 됨), `docs/guides/troubleshooting.md` PnP 한 줄, changeset(cli · mcp patch)
- **제외와 행선지**

| 제외 | 행선지 |
|---|---|
| init 의 Tailwind 4 안내(`init.ts:318-332`, 루트 미설치 줄 · `:331` tokens 줄 항상 안내, fx/init-root-notinst 측정) | WI-0095(#239), Q24 |
| Tailwind 3 preset ESM · `.ts` 설정의 tokens 해석 가능성(`tailwind-core.ts:906-930`, g1 측정 PASS) | WI-0101(Master 등록), Q26. 조사의 「WI-0091 게이트가 이미 다룸」은 검증에서 **반박**됐어요(그 게이트는 `:909` CJS bare require 에만 걸림) |
| theme add 쓰기 동작(`theme-add.ts:421-422` 가 tokens 해석 가능성과 상관없이 `TOKENS_TAILWIND4_ENTRY` 를 씀) | 잔여로 기록, 행선지는 Master 판단(WI-0095 후보) |
| ontology-console 템플릿 content | 별도 WI(Master 판단), Q27 |
| CSS 가 다른 파일을 상대 `@import` 하는 경우 · 후보 첫 파일 고정 · `globalCss` 우선 | WI-0100(a · b) |
| PnP content glob · theme add content 안내 | WI-0098 |
| npm 루트 설치 위치 문구 | WI-0096 |
| brand CSS import(`css/brands/<b>`) 해석 가능성 | WI-0100(brand `@import`) · checkBrand 영역 |
| PnP 캐시 · `.pnp.cjs` 정적 파싱, `pnpFallbackMode` 읽기 | 잔여(WI-0091 Q1) |
| FAIL 로 올리기 | 선례(D5)로 하지 않음 |

## 2. 수용 기준

각 AC 의 「음성 대조」는 고치기 전(발행본 1.7.6 · 1.4.5 측정값)에서 실패가 재현되는지예요. 「수정 전후 불변」(AC7 · AC9 · AC12, testplan 4.2)의 비교 기준은 발행본이 아니라 **WI-0100a 머지 직후 HEAD 빌드 사본**이에요(0100a 의 `globalCss` 우선 변경이 섞이지 않게, 기준 SHA 는 testplan 머리말에 기록). **회귀 가드**는 수정 없이도 통과하는 기준이라 수정의 증거가 아니고, 대신 그 가드를 깨는 변이(AC11)로 가드 자체가 살아 있음을 보여요.

- **AC1**(Q21): TW4 · 루트 전용 · 미설치(root-notinst, ui-react 와 agentic-ui 각각)에서 tailwind.config 문구가 `→ @import "<pkg>/tailwind.css";` 로 바로 넣으라고 안내하지 않고, 설치 명령을 먼저 요구하는 안내(1.4 표 3번)예요. severity warn, rc 0
  - 측정: 수정본 dist 로 fixture 실행, 발행본 출력과 A/B 표. 안내대로 「설치 → 줄 추가」 한 뒤 `@tailwindcss/cli` 4.1.14 rc 0
  - 음성 대조: 발행본은 줄 안내(측정 완료), 그 줄의 실빌드 rc 1(측정 완료)
- **AC2**(Q21): 루트 선언 설치본 1.3.0(root-inst-old)은 줄 없이 1.4.0 이상으로 올리라는 안내, 1.4.0 이상인데 파일 없음(root-inst-nofile)은 다시 설치 안내예요(DEC-2 U3 와 같은 판정)
  - 측정: fixture 2종 출력 + 단위 테스트(설치본 stub 에 `tailwind.css` 유무)
  - 음성 대조: 발행본은 둘 다 줄 안내(root-inst-old 는 버전 꼬리만 붙음, 측정 완료)
- **AC3**(Q22): PnP + 루트 전용(pnp-root)은 줄 대신 `PNP_ROOT_ONLY_NOTE` 계열 안내예요
  - 측정: fixture 출력. 같은 fixture 에서 `.pnp.cjs` 를 치우면 AC1 갈래로 가는지(양성 대조). 착수 전 PnP 루트 전용 CSS `@import` 실빌드 rc 를 testplan 에 기록(Q22)
  - 음성 대조: 발행본은 줄 안내(측정 완료)
  - ⚠️ Q22 실빌드가 rc 0 이면(루트 전용이 해석됨) 이 AC 의 근거가 무너지므로 구현을 멈추고 Master 에 보고해요
- **AC4**(선례 P2): 앱 lockfile + 루트 선언(applock-root)은 루트 선언을 선언으로 보지 않아 B1 이 그 패키지를 요구하지 않아요(theme add 와 같은 결론). 줄이 이미 있으면(applock-root-withline) 판정하지 않고 종전 PASS 예요(1.4 표 2번)
  - 측정: fixture 2종(applock-root · applock-root-withline, 후자는 새로 만듦) 출력, applock-root 에 theme add 를 돌려 결론 대조
  - 음성 대조: 발행본은 줄 안내(측정 완료)
- **AC5**(Q21 · Q22): 해석되지 않는 줄이 이미 있으면(root-notinst-withline · root-inst-nofile-withline · pnp-root-withline) tailwind.config 는 PASS 가 아니라 WARN(1.4 표 줄 있음 방향)이에요. 두 패키지가 섞인 fixture(ui-react 해석됨 + agentic-ui 루트 미설치)에서 해석되지 않는 쪽만 알려요
  - 측정: fixture 출력 + 실빌드 rc 를 같은 표에(root-notinst-withline rc 1 은 측정 완료, PnP 는 Q22 측정)
  - 음성 대조: 발행본은 세 fixture 모두 PASS(측정 완료). 혼합 fixture 는 새로 만들어 발행본 결과를 먼저 기록(미측정)
- **AC6**(Q22 · Q28 · 선례 D4 · extra 1): globals.css 가 tokens 미선언 · 미설치(g1), 루트 선언 · 미설치(g7, 새로 만듦), PnP 루트 전용(g4), 레이아웃 JS import · 미선언 · 미설치(g5)에서 WARN 이에요. 앱 선언 · 미설치(g2)는 Q28 로 globals PASS 그대로이고 AC7 회귀 가드로 옮겨요. tailwind.config 의 TW4 PASS 는 그대로예요(D4)
  - 측정: fixture 4종 A/B. 실빌드 근거는 tokens 미설치 rc 1(build2 측정)을 g1 · g7 에 같은 조건으로 적용한 **추정**이에요(두 fixture 자체에서는 빌드하지 않음). g4 는 Q22 실빌드와 함께 재요
  - g5 는 **추정 근거 AC**예요. 번들러(Next) 실빌드 미측정이고, JS import 해석이 CSS 와 같은 규칙이라는 추정에 기대요. testplan 2절 선택 항목(layout.tsx import 의 번들러 1회 측정)을 재면 근거가 되고, 재지 않으면 이 갈래는 5절 잔여로 남겨요
  - 음성 대조: 발행본은 g1 · g4 · g5 globals PASS(측정 완료). g7 은 새로 만들어 발행본 결과를 먼저 기록해요(미측정)
- **AC7 회귀 가드**: 다음은 수정 전후(0100a 머지 직후 HEAD 사본 대 수정본) 출력이 바이트 같아요. 가드마다 그 가드를 깨는 변이를 붙여요
  - root-inst-css(F2, 루트 선언 · 파일 있음) B1 줄 안내, 같은 레이아웃 + 줄 있음(F13) PASS → M10
  - appdecl-notinst(F7) B1 줄 안내 · appdecl-notinst-withline(F14) PASS(Q21) → M6
  - g2(G2, tokens 앱 선언 · 미설치) globals PASS · tailwind.config PASS(Q28) → M6
  - pnp-appdecl(F8) 종전 결과, g3(PnP 앱 선언) globals PASS → M11
  - tokens 설치본이 있는 non-PnP globals PASS(G6) · 저장소 `apps/web`(W1, workspace 링크 · tokens dist 없음 상태 포함, `layout.tsx:7` 갈래) globals PASS → M9
  - TW4 tailwind.config 의 진입점 PASS(D4) → M12
  - 단일 앱(워크스페이스 아님): 대응 변이 없음, **출력 diff 0 으로만 확인**(루트가 없어 새 축이 판정할 대상이 없음)
  - 측정: fixture 출력 diff 0, 위 변이에서 해당 행 빨강
- **AC8 회귀 가드**(CLI · MCP): 모든 AC fixture 에서 CLI `axis check` 와 MCP `axis.check_project` 의 tailwind.config · globals.css 항목 **severity · message** 가 같아요(접두 `[WARN]` 등 출력 형식은 비교에서 뺌). 두 호출지가 같은 코어 함수를 불러서 배선이 바뀌지 않는 한 실패할 수 없다는 것을 testplan 에 적어요
- **AC9 회귀 가드**(선례 D3): DEC-2 판정 · 문구 · 상수를 옮긴 뒤 theme add 출력이 바이트 같아요
  - 측정: `theme-add.test.ts` 기존 기대 전부 통과, fixture root-notinst · root-inst-old · root-inst-nofile · pnp-root · applock-root 에 theme add 를 발행본 · 수정본으로 돌려 출력 diff 0
- **AC10**: 기존 테스트의 기대 변경은 plan.md 4절에 착수 전 고정한 목록과 같아요(목록 밖 변경 0). 목록 안 항목은 「설치 stub 보강(기대 불변)」 또는 「기대 변경(사유)」 중 하나로 처리해요
  - 측정: cli · mcp 테스트 전체 통과(registry-core 는 테스트 스크립트 · `*.test.ts` 가 없어 type-check · lint 만, 새 헬퍼 단위 테스트는 cli `template-check.test.ts` 의 「WI-0097」 describe 에 둠), A/B probe(같은 fixture 에 0100a 머지 직후 HEAD 사본과 수정본을 함께 돌림, WI-0091 testplan 3.2 방식)로 전이를 전수 기록
- **AC11**(변이): 아래 변이를 하나씩 넣으면 테스트가 1건 이상 빨개져요. M1 B1 해석 게이트 제거 · M2 PnP 루트 전용 갈래 제거 · M3 파일 존재 검사 제거 · M4 globals tokens 게이트 제거 · M5a 1.4 표 1번과 3번 순서 바꿈(F5 pnp-root 가 PnP 문구 대신 설치 안내로 가면 빨강) · M5b 1.4 표 4번과 5번 순서 바꿈(F4 root-inst-old 가 1.4.0 올림 대신 재설치 안내로 가면 빨강) · M6 B1 · globals 게이트를 앱 선언에도 적용(Q21 · Q28 가드, F7 · F14 · G2 빨강) · M7 줄 있음 방향 게이트 제거 · M8 P2 갈래 제거(applock-root · applock-root-withline) · M9 tokens 판정을 exports 대상 파일 존재로 바꿈(AC7 G6 · `apps/web` 가드) · M10 파일이 있어도 해석 불가로 판정(F2 · F13 빨강) · M11 PnP 에서 앱 선언도 불인정(F8 · G3 빨강) · M12 tailwind.config TW4 진입점에도 tokens 게이트(D4 가드 빨강). 3번과 4번 순서 바꿈은 두 갈래가 동시에 성립하지 않는 동치 변이라 넣지 않아요
- **AC12 회귀 가드**(종료 코드): 모든 AC fixture 에서 check rc 가 0100a 머지 직후 HEAD 사본과 수정본에서 같아요(`out=$(…); rc=$?` 로 받음). 발행본 rc 는 음성 대조 기록으로만 둬요
- **AC13**(문서 · 릴리스, Q27): `packages/axis-cli/README.md:101` · `:104` · `:109` 와 `docs/guides/troubleshooting.md` 2절 PnP 한 줄이 수정본 동작과 맞아요. `.changeset/` 에 `@axis-ds/cli` · `@axis-ds/mcp` patch 가 있고 `pnpm check-changeset-mcp-tokens` rc 0 이에요
  - 측정: 문서 서술과 testplan 확정 문구 대조, 범위를 적은 문장(「`declaredRange` 그대로」 · 「선언만 봄」 류)을 전 트리 grep 해 남은 곳 0, changeset 파일 존재와 rc

## 3. 종료 코드 변화

- **없어요.** 새 판정은 모두 WARN 이고(선례 D5), check 는 FAIL 이 있을 때만 rc 1 이에요(`axis-cli/src/template/index.ts:175`)
- 바뀌는 것은 문구와 PASS → WARN 전이예요. 해석되지 않는 줄이 이미 있는 루트 · PnP 레이아웃(AC5), tokens import 만 있고 해석되지 않는 앱(AC6)은 「N pass / M warn」 집계와 「권장 항목을 확인하세요」 출력이 달라져요. 문구를 grep 하는 사용자 스크립트는 영향을 받을 수 있어요

## 4. 위험

- globals 게이트를 넣으면 tokens 설치 stub 이 없는 기존 테스트가 PASS → WARN 으로 대량 뒤집힐 수 있어요(후보 cli 9건 · mcp 4건, plan 4절. tokens 를 앱에 선언한 fixture 는 Q28 로 뒤집히지 않아요). 테스트 의도가 「import 인정」이면 stub 을 보강하고 기대는 그대로 둬요
- pnpm 기본 레이아웃(`.pnpm` 스토어 심볼릭 링크)에서 `findInstalledPackage` 가 찾은 디렉터리의 `tailwind.css` 판정이 링크를 따라가는지는 미측정이에요(theme add 의 `isFile` 은 따라감, WI-0090 선례, 추정)
- 세 WI 를 합친 동작(0100 펼침과 이 WI 게이트의 상호작용)은 통합 fixture 로 아직 재지 않았어요(경계 보고서 5절)

## 5. 잔여 오차

- `pnpFallbackMode: all` 에서 루트 전용이 실제로 해석돼도 WARN 이에요(선례 D7, 실빌드 미측정). 종료 코드는 그대로예요
- PnP 는 설치본(캐시 · zip)을 읽지 않아요. 앱에 선언했지만 캐시에서 빠진 경우는 계속 PASS 예요(Issue 「PnP 앱 선언 실패」의 실제 정의로 추정, 미측정)
- 앱 선언 · 미설치(Q21 · Q28)는 B1 · globals.css 에서 알리지 않고 dependencies 의 「선언됐지만 설치되지 않은 의존성」 WARN 에 맡겨요. 앱 선언 · 미설치 + 줄 있음, tokens 앱 선언 · 미설치의 globals 도 PASS 로 남아요
- Next.js(postcss · css-loader) 경로와 Tailwind 3 경로의 실빌드는 재지 않았어요. 해석 판정은 `@tailwindcss/cli` 4.1.14 측정에 기대요
- init(Q24) · TW3 preset ESM(Q26) · theme add 의 tokens 진입점 쓰기는 이 WI 뒤에도 같은 부류의 결함으로 남아요(1.5 행선지)
- Plug'n'Play 앱 선언에서 컴포넌트 `tailwind.css` import 가 해석돼도(rc 0) 컴포넌트 클래스가 생성되지 않는 현상(testplan 2절 부수 관찰, `@source "./dist"` 가 zip 안을 가리킨다는 추정)은 **WI-0102(#249)로 이관**했어요(Q40). 이 WI 는 앱 선언을 해석됨으로 보고 코드를 바꾸지 않아요
- H4(Q41): npm 루트 선언의 설치 안내 구절이 check(`componentInstallPhrase`, 「워크스페이스 루트에서 npm install」)와 theme add(DEC-2 문구에 `plan.installCommand` 를 그대로 넣음)에서 달라요. WI-0096 에서 맞춰요
- H5(Q41): 루트 선언 범위가 1.4.0 미만이면서 미설치인 경우에도 1.4 표 3번은 「설치 뒤 `@import`」를 안내해요. 그 범위대로 설치하면 1.4.0 미만이 깔려 줄이 해석되지 않을 수 있어요(추정, 실빌드 미측정). 이번에는 고치지 않아요

## 6. 열린 확인 (호출한 쪽에서 확인 필요)

남은 열린 확인은 없어요.

- **O1**: **결정됨(Q28, 2026-10-28)**. g2(tokens **앱 선언** · 미설치)의 globals 는 Q21 과 같은 이유(dependencies 가 이미 WARN)로 종전 PASS 를 유지해요. 조사 AC5 의 「g2 globals WARN」 가정은 버렸고, AC6(g2 제외 · g7 추가) · AC7(G2 회귀 가드) · AC11 M6 와 testplan G2 · G7 · M4 · M6 에 반영했어요
