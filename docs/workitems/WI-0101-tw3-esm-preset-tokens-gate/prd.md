# WI-0101: check 가 Tailwind 3 preset 의 tokens 를 「이 앱에서 해석되는가」로 판정함(ESM · `.ts` 포함) PRD

> 작성일: 2026-10-29 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0101 | GitHub: #248 | 우선순위: P3 | 상태: Approved (2026-10-29 사용자 결정 Q61 ~ Q69, 모두 권장안)
> 기준: `main` e103d43 (linked 1.8.2 · cli 1.7.7 · mcp 1.4.6 발행됨. 발행 커밋 1e8da06 뒤 `git log 1e8da06..HEAD -- packages/` 0줄, 같은 범위 전체 커밋은 2건이라 조회 자체는 동작함. 발행본과 소스가 같음)
> 표기: **측정**(착수 측정에서 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, 발행본 cli 1.7.7 · mcp 1.4.6, Tailwind CLI 3.4.19)

Tailwind 3 의 `tailwind.config` 항목은 설정 파일에 `@axis-ds/tokens/tailwind` 참조가 있으면 PASS 예요(`tailwind-core.ts:1450` · `:1475`). tokens 를 따로 보는 곳은 WI-0072 · WI-0091 의 버전 게이트 하나뿐인데, 이 게이트는 **CommonJS 이고 `.default` 없는 bare require** 일 때만 돌아요(`:1453` `isCommonJsConfig && hasBareCjsPresetRequire`). 그래서 tokens 가 이 앱에서 해석되지 않아 Tailwind 빌드가 `Cannot find module '@axis-ds/tokens/tailwind'` 로 깨지는 레이아웃에서도 PASS 가 나와요.

착수 측정(testplan 2절, 63칸, 2회 재현 같음)에서 드러난 범위는 Issue 본문보다 넓어요.

| tokens 상태 | 실빌드 | 발행본 check(tailwind.config) | 다른 항목이 tokens 를 알리나 |
|---|---|---|---|
| 앱 선언 · 미설치(A-none) | 7형태 모두 rc 1 `Cannot find module` | 7형태 모두 **PASS**(CJS bare 도 선언 하한 `^1.8.2` 로 게이트 `ok`) | dependencies WARN「선언됐지만 설치되지 않은 의존성: @axis-ds/tokens」 |
| 루트 선언 · 미설치(R-none) | 7형태 모두 rc 1 | 7형태 모두 **PASS** | dependencies WARN「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다」 |
| 미선언 · 미설치(U-none, Issue g1) | 7형태 모두 rc 1 | CJS bare 2형태만 WARN(문구는 「버전을 확인하지 못했습니다」라 원인과 다름), 나머지 5형태 **PASS** | **없음**(dependencies 는 clsx · tailwind-merge 만) |
| 설치 1.6.2(앱 · 루트 · 미선언) | 7형태 모두 rc 0. CJS bare 2형태만 `.bg-primary` 0(preset 빠짐), 나머지 5형태 `.bg-primary` 1 | CJS bare 2형태만 WARN, 나머지 PASS | 해당 없음 |
| 설치 1.8.2(앱 · 루트 · 미선언) | 7형태 모두 rc 0 · `.bg-primary` 1 | 7형태 모두 PASS | 해당 없음 |

- 7형태: CJS bare `.js` · CJS bare `.cjs` · CJS `.default` · ESM `.mjs` · ESM 문법 `.js` · `.ts` · `.mjs` 안의 `require`(testplan 1절)
- MCP `axis.check_project` 는 63칸 모두 CLI 와 심각도 · 문구가 같아요(측정). 같은 코어 함수를 번들해요(cli `template-check.ts:41`, mcp `tools/template.ts:412`)
- 정정 1: Issue 는 「ESM import 모양이라 게이트가 돌지 않는다」로 적었지만, 실제 공백은 **모양과 상관없는 해석 가능성**이에요. CJS bare 도 tokens 를 선언만 하고 설치하지 않으면 PASS 예요(A-none · R-none). CJS `.default` 는 미선언 · 미설치여도 PASS 예요
- 정정 2: 버전 게이트를 ESM 으로 넓히는 것은 답이 아니에요. ESM `.mjs` · ESM 문법 `.js` · `.ts` · `.mjs` 의 `require` · CJS `.default` 는 tokens 1.6.2 에서도 preset 이 들어와요(`.bg-primary` 1, 3상태 × 5형태 = 15칸 측정). `tailwind-core.ts:1168-1170` 주석의 「jiti interop 이 `.default` 를 꺼내 줌(실측)」을 이번에 다시 확인했어요
- WI-0091 Q7 의 잔여(「게이트가 돌지 않는 모양(Tailwind 3 ESM · `.ts` 설정의 preset)에서는 tokens 가 루트 전용이어도 알리지 않음」, WI-0091 release-notes 잔여 절)는 이 표의 부분집합이에요(PnP 루트 전용 칸은 착수 때 재지 않았고 Q69 착수 게이트에서 실빌드로 쟀어요, testplan 3.3)

### 1.2 결정

#### 사용자 결정 (2026-10-29: 권장안, Q61 ~ Q69 모두. 선택지와 근거는 6절)

| # | 질문 | 사용자 결정 2026-10-29: 권장안 | 이 WI 에서 |
|---|---|---|---|
| Q61 | 해석 게이트를 어느 모양에 걸까요 | preset 참조(`hasTokensPresetReference`)가 있는 모든 모양 | AC1 · AC2 |
| Q62 | 앱 선언 · 미설치(A-none)를 막을까요 | 막지 않음(Q21 · Q28 대칭, dependencies 가 이미 알림) | AC4 |
| Q63 | 루트 선언 · 미설치(R-none)를 막을까요 | WARN(Q28 의 globals 와 같은 갈래) | AC2 |
| Q64 | 버전 게이트를 넓힐까요 | 넓히지 않음(CJS bare 만) | AC5 |
| Q65 | 해석 불가와 버전 문제가 겹치면 무엇을 알릴까요 | 해석 불가 먼저(버전 문구 대신) | AC3 |
| Q66 | `.ts` 설정을 어디까지 해석할까요 | 지금 정규식 그대로(TS 파싱 · re-export 추적 안 함) | AC1 · 범위 밖 |
| Q67 | PASS 가 WARN 이 되는 기존 테스트를 어떻게 할까요 | 기대 불변, fixture 에 tokens 앱 선언을 더함(Q49 대칭) | AC8 |
| Q68 | 「해석된다」의 정의 | 설치본 패키지 디렉터리 존재(`tokensCssResolution` 그대로) | AC2 · AC4 |
| Q69 | PnP 루트 전용 ESM preset 실빌드를 착수 게이트로 둘까요 | 예, 구현 첫 단계에서 1회(Q22 와 같은 방식) | AC6 |

#### 추가 결정 (구현 중 생김, 권장안으로 진행, 2026-10-30 사용자가 세 건 모두 권장안으로 확정)

| # | 질문 | 선택지 | 확정한 안(권장) | 근거 |
|---|---|---|---|---|
| Q61a | 미선언 · 미설치일 때 설치 안내의 추가 명령 범위 | ① `^1.7.0`(CJS bare 의 버전 게이트 하한) ② `^1.4.0`(globals.css 게이트와 같음) ③ 범위 없음 | ① | 첫 발행 1.1.0 · 1.6.2 · 1.8.2 가 `./tailwind` 를 내보내(확인한 셋, 나머지 버전은 미확인) ESM 은 버전과 상관없이 되지만, 같은 프로젝트가 CommonJS bare 로 바꿔도 다시 WARN 이 나지 않는 범위예요. globals 게이트 문구(`^1.4.0`)와는 범위만 달라요 |
| Q61b | 새 WARN 문구 2종(「… preset 참조가 있지만 @axis-ds/tokens 가 설치되지 않아 해석되지 않습니다 → 설치(…)」 · PnP 루트 전용 「…(워크스페이스 루트 선언 …) → 앱 package.json 에 @axis-ds/tokens 를 선언하세요」)을 구현 그대로 확정할까요 | ① 구현 그대로 ② 고침 | ① | 같은 항목의 WI-0091 · WI-0072 문구 머리(「<파일>에 AXIS preset 참조가 있지만」)와 globals 게이트 G-1 꼬리(「설치되지 않아 해석되지 않습니다 → 설치(…)」)를 이었어요. WI-0097 Q43 · Q48 선례로 확정은 사용자 몫이에요 |
| Q65a | 루트에 1.7.0 미만으로 선언 · 미설치 · CommonJS bare 일 때, 설치 안내에 1.7.0 을 함께 적을까요 | ① 적지 않음(Q65 대로 설치만 안내) ② 「설치(…) · 1.7.0 이상」을 덧붙임 | ① | Q65 는 해석 불가를 먼저 알리기로 했어요. 설치 뒤에는 종전 버전 WARN 이 이어서 나와 두 단계로 고치게 돼요(문서 반박 검증 발견 7, changeset 에 적음). ②는 문구 분기가 하나 늘어요 |

#### 선례 · 코드로 정한 항목 (사용자 결정이 아님)

| 항목 | 답 | 근거 |
|---|---|---|
| 판정 헬퍼 | 새 헬퍼를 만들지 않고 `project.ts:702-723` `tokensCssResolution` 을 그대로 써요(globals.css 게이트와 같은 결론) | WI-0097 1.2 「같은 레이아웃에서 같은 결론」, WI-0093 Q14(MCP 가 cli 코드를 못 씀) |
| 심각도 | 새 판정은 모두 WARN, 종료 코드 불변 | WI-0092 Q10 · WI-0094 Q11 · WI-0097 D5 |
| 발행 | registry-core 변경이라 cli · mcp patch 를 함께 올려요. tokens 는 바꾸지 않아요 | CLAUDE.md 「registry-core 를 바꾸면 cli · mcp 둘 다」, `pnpm check-changeset-mcp-tokens` |
| PnP 루트 전용 | `tokensCssResolution` 의 `pnp-root-only` 갈래로 `PNP_ROOT_ONLY_NOTE` 계열 문구 | WI-0091 Q5 · Q7, WI-0097 Q22 |

### 1.3 목표

- Tailwind 3 의 tailwind.config 항목이 preset 참조를 「참조가 있는가」가 아니라 「이 앱에서 tokens 가 해석되는가」로 판정해요. 빌드가 `Cannot find module` 로 깨지는 레이아웃을 PASS 로 내지 않아요
- 같은 레이아웃에서 globals.css 의 tokens 게이트(WI-0097 2부)와 같은 결론을 내요
- 새 축이 판정할 수 없는 경우(앱 선언, 설치본 있음)는 종전 동작을 그대로 둬요. 특히 템플릿 5개(`apps/web/templates/*/files/tailwind.config.ts`, 모두 ESM import + 앱 선언)는 바이트 그대로예요

### 1.4 판정 갈래 (권장안 기준, Q61 · Q62 · Q63 · Q65 · Q68)

preset 참조가 있을 때 아래를 앞에서부터 봐요. 정해지면 끝이에요.

| # | `tokensCssResolution` | 판정 | 측정 칸(testplan 2절) |
|---|---|---|---|
| 1 | `pnp-root-only` | WARN `PNP_ROOT_ONLY_NOTE` 계열(모든 모양. CJS bare 는 지금도 같은 뜻의 WARN) | Q69 착수 게이트 실빌드: Yarn 4.5.3 PnP 루트 전용 ESM `.mjs` · `.ts` rc 1, 앱에도 선언하면 rc 0(testplan 3.3) |
| 2 | `not-installed`(`source: "root"`) | WARN 설치 안내(워크스페이스 루트 선언) | R-none 7칸 |
| 3 | `not-installed`(`source: "none"`) | WARN 설치 안내(범위를 붙인 추가 명령) | U-none 7칸 |
| 4 | `app` · `installed` | 종전 판정(CJS bare 면 버전 게이트, 아니면 PASS) | A-* · R-inst* · U-inst* 42칸 |

## 2. 수용 기준

| AC | 내용 | 근거(측정) |
|---|---|---|
| AC1 | ESM `.mjs` · ESM 문법 `.js` · `.ts` · `.mjs` 의 `require` · CJS `.default` 에서 미선언 · 미설치면 tailwind.config 가 WARN 이에요(발행본 PASS) | U-none 5칸 PASS · 실빌드 rc 1 |
| AC2 | 같은 5형태 + CJS bare 2형태에서 루트 선언 · 미설치면 WARN 이에요(발행본 PASS) | R-none 7칸 PASS · rc 1 |
| AC3 | CJS bare 2형태의 미선언 · 미설치는 「버전을 확인하지 못했습니다」 대신 해석 불가 WARN 이에요(WARN → WARN, 문구만 바뀜) | U-none CJS bare 2칸 |
| AC4 | 앱 선언 · 미설치(A-none 7칸)는 발행본과 바이트가 같아요(Q62 결정) | A-none 7칸 PASS, dependencies WARN 이 이미 있음 |
| AC5 | 설치본이 있으면(앱 · 루트 · 미선언 × 1.8.2 · 1.6.2, 42칸) 발행본과 바이트가 같아요. CJS bare × 1.6.2 의 버전 WARN 도 그대로예요 | 42칸 실빌드와 check 대응(1.6.2 CJS bare 만 `.bg-primary` 0) |
| AC6 | PnP 루트 전용이면 모든 모양에서 `PNP_ROOT_ONLY_NOTE` 계열 WARN 이에요. CJS bare 는 종전 문구 그대로예요 | Q69 착수 게이트 측정(testplan 3.3, 루트 전용 rc 1 · 앱 선언 rc 0) |
| AC7 | CLI 와 MCP 가 2절 fixture 전부에서 같은 심각도 · 문구예요 | 발행본 63/63 같음 |
| AC8 | 기존 테스트의 목적(preset 모양 판독 · 주석 제외 · 버전 경계)을 지키고, 바뀐 기대는 plan 4절 목록에 든 것만이에요 | plan 4절 |
| AC9 | 변이: 새 게이트를 끄면(U-none · R-none 을 PASS 로) 새 테스트가 빨개지고, 게이트를 「앱 선언도 막음」으로 바꾸면 A-none 회귀 가드가 빨개져요 | testplan 4절 |
| AC10 | `tailwind-core.ts` 머리 주석 `:34-35`(「Tailwind 3 preset 은 CommonJS 형태 + 설치본 tokens 버전으로 판정」) · `checkTailwindSetup` docstring `:1381-1385` · `packages/axis-cli/README.md:110-111`(「preset 을 `require` · `import` 하면 PASS」 · 「`import` 형태는 PASS」) 서술을 새 범위로 고쳐요. 확인은 범위 서술 grep 대조예요 | 규칙: 범위를 넓히는 커밋에서 그 범위를 적은 문장을 같이 고침 |

## 3. 종료 코드 변화

새 판정은 모두 WARN 이라 `axis check` 종료 코드는 바뀌지 않아요. 측정 fixture 는 모두 rc 1 인데 원인은 axis.config.json · globals.css 없음 FAIL 이에요(이 WI 와 무관, testplan 2절).

## 4. 위험

| 위험 | 대응 |
|---|---|
| 템플릿으로 막 만든 앱(`axis template init` 직후, 설치 전)이 WARN 이 됨 | 템플릿 package.json 은 tokens 를 앱에 선언해요. Q62 권장안이면 게이트 밖이라 그대로예요(추정, 구현 때 템플릿 5개 fixture 로 측정) |
| workspace 링크 · dist 없는 저장소(이 저장소 `apps/web`, `workspace:*` 앱 선언)에서 거짓 WARN | 앱 선언은 게이트 밖(Q62), 해석 정의는 디렉터리 존재(Q68) |
| B3 기존 테스트가 tokens 없이 PASS 를 기대함(후보: cli `template-check.test.ts:2261-2270`, mcp `tools/template.test.ts:359-366` 등, 전체는 plan 4절에서 구현 첫 단계에 실행으로 확정) | Q67, plan 4절 |
| 메시지 문구가 globals.css 와 따로 놀음 | 설치 안내 구절은 `tokensInstallPhrase`(`tailwind-core.ts:698`)를 같이 써요 |

## 5. 잔여 오차

- PnP 루트 전용은 Q69 착수 게이트로 실빌드했어요(rc 1). PnP 앱 미선언(어디에도 선언 없음) 칸은 실빌드하지 않았어요(미측정)
- 앱 lockfile(P2) + 루트 선언 · 미설치는 3번 갈래(미선언과 같음, 안내는 앱 lockfile 의 매니저)예요(측정, testplan 3.2)
- `.ts` 에서 tsconfig `paths` 별칭 · 다른 파일 re-export 로 preset 을 받는 모양은 참조를 찾지 못해 종전 「preset 없음」 WARN 이에요(Q66 권장안이면 범위 밖)
- 설치본 디렉터리는 있는데 `dist/tailwind-preset.*` 가 없는 손상 설치는 PASS 로 남아요(Q68 권장안)
- Next.js 실제 빌드 · Windows 는 재지 않았어요

## 6. 결정 항목 상세 (2026-10-29 사용자 결정: 모두 권장안)

| # | 질문 | 선택지 | 권장안 | 근거 |
|---|---|---|---|---|
| Q61 | 해석 게이트를 어느 모양의 preset 참조에 걸까요 | ① `hasTokensPresetReference` 가 찾는 모든 모양(require · `import()` · `from` · bare `import`) ② ESM(`from` · `import()`)과 `.ts` 만 ③ 현행 유지(잔여로 둠) | ① | 미설치 실빌드 rc 1 이 7형태 모두 같아요. CJS bare 도 A-none · R-none 에서 PASS 라 ②로는 공백이 남아요 |
| Q62 | 앱에 선언했지만 설치하지 않은 경우(A-none)를 막을까요 | ① 막지 않음(PASS 유지) ② WARN | ① | dependencies 항목이 「선언됐지만 설치되지 않은 의존성」 WARN 을 이미 내요(측정). Q21 · Q28 과 대칭이고 템플릿 직후 · workspace 링크 거짓 WARN 을 막아요. 단점: tailwind.config 만 보면 rc 1 빌드가 PASS 로 남아요 |
| Q63 | 루트에 선언했지만 설치하지 않은 경우(R-none)를 막을까요 | ① WARN ② 막지 않음(Q62 와 같이 dependencies 에 맡김) | ① | Q28 이 globals.css 에서 같은 갈래를 WARN 으로 정했어요. 같은 헬퍼(`tokensCssResolution`)로 두 항목의 결론을 맞춰요. dependencies 도 이 경우를 알리지만(측정) Q28 때도 같은 조건이었어요 |
| Q64 | tokens 버전 게이트(1.7.0)를 ESM · `.ts` 로 넓힐까요 | ① 넓히지 않음(CJS bare 만) ② 모든 모양으로 넓힘 | ① | 1.6.2 실빌드에서 CJS bare 만 preset 이 빠지고(`.bg-primary` 0) 나머지 5형태는 들어와요(15칸 측정). ②는 거짓 WARN 이에요 |
| Q65 | CJS bare 이면서 해석도 안 되는 경우(U-none CJS bare) 어느 문구를 낼까요 | ① 해석 불가 문구만 ② 버전 문구 유지 ③ 둘을 ` / ` 로 이음 | ① | 그 레이아웃은 버전과 상관없이 빌드가 rc 1 이라 「버전 확인」 안내를 따라도 고쳐지지 않아요. 심각도 · 종료 코드는 같아요 |
| Q66 | `.ts` 설정을 어디까지 해석할까요 | ① 지금 정규식(주석 제거 + `PRESET_REFERENCE`) 그대로 ② tsconfig `paths` · 상대 re-export 를 따라감 ③ TS 파서 도입 | ① | `.ts` 는 실빌드 · check 모두 `.mjs` 와 같은 결과예요(측정). ②③은 새 의존성 · 새 실패 모드를 들여와요. 따라가지 못한 모양은 종전 「preset 없음」 WARN 이라 거짓 PASS 를 만들지 않아요 |
| Q67 | 새 게이트로 PASS 에서 WARN 이 되는 기존 테스트를 어떻게 할까요 | ① 기대 불변, fixture 에 tokens 앱 선언(또는 설치 stub)을 더함 ② 기대를 WARN 으로 바꿈 | ① | 그 테스트들의 목적은 preset 모양 판독이라 tokens 상태와 무관해요. WI-0097 Q49 와 같은 처리예요. WARN 갈래는 새 테스트가 고정해요 |
| Q68 | 「tokens 가 해석된다」를 무엇으로 볼까요 | ① 설치본 패키지 디렉터리 존재(`tokensCssResolution` 그대로) ② `dist/tailwind-preset.js` · `.mjs` 파일 존재 | ① | WI-0097 extra 1 이 같은 이유(dist 없는 workspace 링크의 거짓 WARN)로 ①을 정했고 globals 게이트와 결론을 맞춰요. 손상 설치는 잔여로 둬요 |
| Q69 | PnP 루트 전용 칸을 착수 게이트 실빌드로 확정할까요 | ① 구현 첫 단계에서 Yarn PnP 실설치로 ESM `.mjs` · `.ts` 1회씩 재고 rc 1 이면 진행 ② 재지 않고 WI-0091 의 CJS 측정으로 갈음 | ① | 이번 측정에 PnP 칸이 없어요(미측정). WI-0097 Q22 가 같은 방식으로 근거를 확정했어요. rc 0 이면 1.4 표 1번을 빼고 보고해요 |
