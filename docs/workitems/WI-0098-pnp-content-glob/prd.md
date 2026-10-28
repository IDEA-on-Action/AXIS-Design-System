# WI-0098: Yarn PnP 에서 node_modules content glob 이 아무것도 스캔하지 않는데 check 가 PASS PRD

> 작성일: 2026-10-28 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0098 | GitHub: #242 | 우선순위: P3 | 상태: Approved (2026-10-28 사용자 결정 Q22 · Q23 · Q24 · Q26 · Q27 · Q29 · Q30 · Q31 · Q32 · Q33 · Q34 · Q44 · Q45 · Q47, 구현 완료 · 문구 확정(Q44 · Q45 · Q47))
> 기준: `main` 18d0357. 발행본 cli 1.7.6 · mcp 1.4.5 와 `packages/` 가 같아요(`git diff --stat ffc0383 HEAD -- packages` rc 0 · 빈 출력, ffc0383 존재 확인). 같은 발행에 WI-0097(#241) · WI-0100(#244)을 묶어요(cli 1.7.7 · mcp 1.4.6 patch, linked 4패키지 1.8.2 그대로)
> 표기: **측정**(조사 · 반박 검증 단계, 구현 첫 단계(착수 측정), Q31 ~ Q34 반영 단계에서 실행해 얻은 값, 모두 2026-10-28) · **추정**(실행하지 않음) · **미측정**(재야 하는데 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, Yarn 4.5.3 · Tailwind CLI 3.4.19 · 발행본 cli 1.7.6 · mcp 1.4.5)

Plug'n'Play(`isPnpProject` 참)면 content 판정의 패키지 표본이 무조건 `node_modules/<pkg>/dist/index.js` 이고 제안도 `./node_modules/<pkg>/dist/**/*.{js,mjs}` 예요(`tailwind-core.ts:1152-1153` · `:1186-1187`). 덮음 판정은 glob 문자열과 표본 문자열만 비교해서(`:1079-1107`, `:1279` 주석) PnP 에 없는 `./node_modules/...` 를 덮음으로 봐요. 그래서 빌드는 컴포넌트 클래스를 하나도 만들지 않는데 check 는 PASS 이고, FAIL 때 내는 제안을 따르면 PASS 로 바뀌지만 빌드 결과는 그대로예요.

빌드 규칙 수는 `@tailwind utilities;` 만 넣은 입력(util.css)의 `grep -c '{'` 예요. 429 는 node-modules 링커 대조군(P2-up · C-up)과 출력 CSS 가 `cmp` 로 같다는 뜻이에요(cmp 기록: 조사 V2-dyn · V4-zipabs · P3-unplugrel, 반박 검증 Q-ziprel · Q-zipabs · U-rel · Q-dyn). 「cmp 미기록」을 붙인 행은 규칙 수만 같고 바이트 비교 기록이 없어요. 4 는 패키지 glob 이 없을 때와 같다는 뜻이에요.

| fixture · 변형 | content 의 패키지 부분 | 빌드 규칙 | 발행본 check `tailwind.content` |
|---|---|---|---|
| 기본 PnP(P1 · Q1) none | 없음 | 4 | FAIL, 제안 `./node_modules/...` |
| 기본 PnP nm(V1-nm · Q-nm) | `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` | 4(none 과 바이트 같음) | **PASS** |
| 기본 PnP broad(V5-broad · Q-broad) | `./**/*.{js,mjs}` | 4 | **PASS** |
| 기본 PnP dyn(V2-dyn · Q-dyn) | `path.resolve(path.dirname(require.resolve("@axis-ds/ui-react")), "..")` + `dist/**/*.{js,mjs}` | 429 | WARN(정적으로 다 읽지 못함), 제안 `./node_modules/...` |
| 기본 PnP zip 정확 경로(V4-zipabs · Q-zipabs · Q-ziprel) | 캐시 zip 파일 이름을 그대로 쓴 절대 · 상대 glob | 429 | FAIL |
| 기본 PnP zip 정확 경로(P4-ziprel) | 캐시 zip 파일 이름을 그대로 쓴 상대 glob | 429(규칙 수, cmp 미기록) | FAIL |
| 기본 PnP zip 와일드카드(P4-ziprelwild · Q-zipwild) | `.../@axis-ds-ui-react-npm-*.zip/...` | 4 | 조사 자료에 판정 기록 없음 |
| 기본 PnP `__virtual__` 와일드카드(V6-virtualrel) | `../../.yarn/__virtual__/**/node_modules/...` | 4(조사 단계 값만, 반박 검증 미재현) | 조사 자료에 판정 기록 없음 |
| unplugged PnP(P3 · Q3) rel(P3-unplugrel · U-rel) | `../../.yarn/unplugged/*/node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}` | 429 | **FAIL** |
| unplugged PnP abs(P3-unplugabs) | unplugged 실경로 절대 glob | 429(규칙 수, cmp 미기록) | **FAIL** |
| 루트 전용 선언 PnP(Q4) dyn(R-dyn) | 동적 형태 | 빌드 rc 1(`Your application tried to access @axis-ds/ui-react, but it isn't declared in your dependencies`) | WARN, rc 0 |
| 루트 전용 선언 PnP(Q4) nm · broad(착수 측정) | `./node_modules/...` · `./**/*.{js,mjs}` | 4 · 4 | **PASS** · **PASS**, rc 0 |
| 루트 전용 선언 PnP(Q4) none(착수 측정) | 없음 | 4 | FAIL, 제안 `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`, rc 1 |
| 루트 전용 선언 PnP(Q4) R-dyn 제안 문자열(착수 측정) | 동적 형태 | 빌드 rc 1(산출물 없음) | WARN 「…: @axis-ds/ui-react → "./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"」, rc 0 |
| 루트 전용 선언 + unplugged(Q4u) unplugRel · unplugAbs(착수 측정) | unplugged 상대 · 절대 glob | 429 · 429(대조군과 cmp 같음) | FAIL · FAIL(제안 `./node_modules/...`), rc 1 |
| 단일 PnP 프로젝트 + unplugged(S1, 앱이 PnP 루트, Q33 착수 측정) broad | `./**/*.{js,mjs}` | 4(none 과 cmp 같음) | **PASS**(1.7.6 · Q33 반영 전 신판 모두), rc 0 |
| 단일 PnP 프로젝트 + unplugged(S1) unplugRel · `./.yarn/**` | `./.yarn/unplugged/*/node_modules/...` · `./.yarn/**/*.{js,mjs}` | 429(cmp 같음) · 435 | 1.7.6 unplugRel FAIL, Q33 반영 전 신판 PASS · PASS |
| node-modules 대조군(P2 · Q2) up | `../../node_modules/...` | 429 | PASS |
| node-modules 대조군 none · broad(C-broad) | 없음 · `./**` | 4 | FAIL(제안 `../../node_modules/...` + cwd 안내) |

- Q4 에서 `yarn node -e 'require.resolve("@axis-ds/ui-react")'` 는 `MODULE_NOT_FOUND` 로 throw 해요(측정). 루트에만 선언한 앱에 동적 형태를 권하면 빌드가 실패해요.
- 「착수 측정」 행은 구현 첫 단계에서 발행본 cli 1.7.6 · mcp 1.4.5 로 잰 값이고(원자료 scratchpad `WI-0098impl/out/`), S1 행은 Q33 반영 단계에서 잰 값이에요(`WI-0098impl/q33/out-pre` · `out-old`). S1 은 Q3 의 캐시로 오프라인 설치한 단일 프로젝트(`.git` · `.pnp.cjs` · `.yarn/unplugged/@axis-ds-ui-react-virtual-bb180e63fb`)예요. Tailwind 3 의 fast-glob 은 `**` · `*` 가 점으로 시작하는 `.yarn` 을 넘지 않아 S1 의 broad 가 컴포넌트 클래스를 하나도 만들지 않아요.
- MCP `axis.check_project` 1.4.5 는 Q1 · Q3 의 모든 행에서 CLI 와 같은 문구예요(측정, `mcp-call.mjs` stdio JSON-RPC). 두 호출지(`template-check.ts:61` · `mcp template.ts:457`)가 같은 코어 `checkTailwindContent` 를 써요.
- cli `theme add` 도 같은 코어(`theme-add.ts:479` `inspectTailwindContent`)를 써요. content 에 ui-react 가 없으면(TA1-none · P4) 「넣으세요: "./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"」를 안내하고, `./node_modules` glob 이 있으면(TA1-nm) content 안내를 한 줄도 내지 않아요(거짓 침묵). rc 는 TA1-none · TA1-nm 0(측정)이고, P4 는 출력 문구만 측정했어요(rc 기록 없음).
- 두 fixture 계열은 캐시 레이아웃이 달라요. P 계열은 프로젝트 밖 `cacheFolder`(`../yarn-cache/...`), Q 계열은 프로젝트 안 `.yarn/cache` 예요. 핵심 주장은 두 레이아웃에서 모두 재현됐어요(측정).
- check 전체 종료 코드는 다른 항목에 좌우돼요. `globals.css` 가 없던 첫 fixture 에서는 PASS 행도 rc 1 이었어요(측정). 그래서 이 WI 의 일차 판정은 `tailwind.content` 항목의 severity 이고, rc 는 다른 항목이 모두 PASS 인 fixture(globals.css · lib/utils.ts 있음)에서만 써요. 그 조건에서 Q-nm · Q-broad rc 0, Q-none · Q-ziprel rc 1 이었어요(측정).
- 단위 테스트 `template-check.test.ts:2213` 이 PnP 거짓 PASS(`contentItem("pnp", "local")` → PASS)를 기대값으로 고정하고 있어요. Issue 의 「규칙 45개」는 전체 CSS(base · components · utilities) 기준 값이에요(이전 세션 산출물 `grep -c '{'` = 45). 이번 측정은 utilities 만 쟀어요.

### 1.2 결정

#### 사용자 결정 (2026-10-28, 전역 연번)

| # | 결정 | 이 WI 에 미치는 것 |
|---|---|---|
| Q22 (U2) | WI-0091 Q7 의 「Tailwind 판정에서 PnP 루트 전용 선언은 현행 유지」를 다시 열어요. PnP 루트 전용이면 줄 · 경로를 권하지도 인정하지도 않고 `PNP_ROOT_ONLY_NOTE` 계열 안내를 내요. 착수 전(구현 첫 단계)에 PnP 루트 전용 CSS `@import` 실빌드를 1회 재서 근거를 확정해요 | content 대상 중 루트 전용 선언 패키지는 경로 제안 · 덮음 인정 없이 「앱 package.json 에 선언하세요」만 내요(AC6). Q22 근거는 축마다 갈라요. TW3 content(이 WI)의 근거는 Q4 R-dyn(측정, `require.resolve` `MODULE_NOT_FOUND` · 빌드 rc 1)과 이 WI 구현 첫 단계의 Q4 측정이고, CSS `@import` 실빌드는 WI-0097 의 근거예요(WI-0097 첫 단계에서 잼). 이 WI 는 병렬이라 2단계 시점에 그 측정이 없을 수 있으므로, 문구 고정(plan 2절 3단계) 전에 WI-0097 첫 단계 측정이 끝났고 루트 전용 안내와 어긋나지 않는지 확인해요. 이 WI 의 첫 단계 측정 목록은 Q4 nm · none 행의 발행본 판정 · 빌드, R-dyn 의 발행본 문구 재기록(제안 문자열), Q4 에 unplugged 를 설정하고 unplugRel glob 으로 빌드 · 발행본 check(todo 결정 절 · plan 2절 2단계 · testplan 4절과 같은 목록) |
| Q23 (U3) | 기본 Yarn PnP(unplugged 없음)에서 node_modules glob · 넓은 `./**` 는 WARN 으로 판정하고, `require.resolve` 를 쓰는 동적 content 형태를 먼저 · unplugged 를 대안으로 안내해요. FAIL 로 올리지 않으므로 종료 코드 0 → 1 변화는 없어요. zip 경로 판독은 하지 않아요(해시에 묶여 깨지기 쉬움) | 조사 초안의 목표 ②(zip 경로 거짓 FAIL 해소)와 AC3 를 이 결정에 맞게 다시 썼어요(2절 · 4절). 정확한 zip glob 은 잔여 오차예요(7절) |
| Q24 (U4) | init 의 Tailwind 4 안내(`init.ts:324-332`)는 이번에 고치지 않고 WI-0095(#239)로 보내요. 이번 묶음의 범위는 cli check · MCP `axis.check_project` 이고, WI-0098 은 theme add 의 content 안내를 포함해요 | theme add 안내는 범위 안(AC7), init 은 범위 밖. `init.ts:230` 의 `isPnpProject` 사용처는 content 판정 · 제안을 쓰지 않아요(검증 단계 grep) |
| Q26 (U6) | Tailwind 3 preset 을 ESM · `.ts` 설정에서 쓰면 tokens 미선언 · 미설치여도 PASS 인 결함은 별도 WI-0101(#248)로 둬요 | 범위 밖 |
| Q27 (U7) | 문서는 `packages/axis-cli/README.md` 를 필수로 고치고, docs 의 troubleshooting 가이드에 PnP 한 줄을 더해요. ontology-console 템플릿의 content 는 별도 WI 로 둬요(Master 가 등록 여부 판단) | AC11. 다른 안내 문서는 범위 밖(3.2) |
| Q30 | 아래 「이 문서가 정한 구현 해석」 C1 ~ C4 를 그대로 확정해요(2026-10-28, Master 확인). 새 안내 문구는 testplan 3절 초안으로 끝까지 구현하고, 문구는 구현 뒤 Master 확인으로 확정해요(WI-0091 A1 절차) | C1 ~ C4 가 착수 전 확인 대상에서 결정으로 바뀌어요. plan 2절 3단계의 「WI-0097 측정 대기」는 문구 확정 시점만 뒤로 미뤄요. 문구 확인은 Q44 · Q45(2026-10-28)로 닫았어요 |
| Q29 | unplugged 를 설정한 PnP 에서는 실재하는 `.yarn/unplugged` 디렉터리를 fs 로 찾아 표본으로 쓰고, 그 경로를 덮는 정적 glob 을 PASS 로 인정해요. 종료 코드가 1 → 0 으로 바뀌는 판정 완화를 받아들여요(구현 해석 초안 C5 를 확정) | 목표 3 · AC4 · 5절의 rc 1 → 0 의 근거예요. 조사 DEC-3 권장안이고, Q23 이 unplugged 를 대안으로 안내하므로 그 안내를 따른 설정을 인정해요. 정답 근거는 P3-unplugrel · U-rel 빌드 429(cmp 같음, 측정). 앱 선언 범위에 맞는 버전만 표본으로 쓰는 것은 extra 4 를 따라요 |
| Q31 | `CONTENT_PNP_NOTE` 의 `<패키지>` 자리표시를 실제 패키지 이름으로 채워요(`contentPnpNote(names)` 함수). 덮지 않은 PnP 대상(루트 전용 제외)이 둘 이상이면 동적 형태와 `dependenciesMeta` 항목을 패키지마다 나열해요 | 안내를 글자 그대로 복사해 넣으면 동작해요(AC5). 나열 구분자는 `, `(content 배열 · JSON 객체에 그대로 붙여 넣는 형태). 측정: Q1 · P1 none 의 신판 FAIL 문구에서 동적 형태를 바꾸지 않고 잘라 넣으면 빌드 429(대조군과 cmp 같음) · WARN rc 0. 문구 전체는 Q44 · Q45 로 확정 |
| Q32 | unplugged PnP 의 dyn 행(Q3-dyn · P3-dyn)의 현재 판정을 확정해요: WARN + unplugged 상대 glob 제안 + `CONTENT_PARENT_PATH_NOTE` + PnP 안내 | 측정: Q3-dyn · P3-dyn 빌드 429(cmp 같음), 신판 WARN rc 0. 단위 테스트 `template-check.test.ts` WI-0098 매트릭스 `pnpUnplugged.dyn` 이 이 행을 고정해요 |
| Q33 | 앱이 PnP 루트 자신이고 unplugged 가 있을 때 넓은 `./**` 가 unplugged 표본(`.yarn/unplugged/...`)을 덮는다고 보던 거짓 PASS 를 고쳐요. unplugged 표본은 glob 의 `**` · `*` 가 점으로 시작하는 세그먼트를 넘지 않을 때만 덮음으로 봐요(비 PnP 무변경) | 측정 S1-broad 빌드 4 인데 PASS(1.7.6 · 반영 전 신판). 반영 뒤 S1 8행(broad · `./*/**` · 절대 broad → WARN, unplugRel · unplugAbs · `./.yarn/**` → PASS, none FAIL, nm WARN)이 빌드 정답과 맞아요. `contentGlobToRegExp` · `contentGlobCovers` 의 `noDot` 옵션은 unplugged 표본에만 넘기고 기본값은 종전 정규식 그대로예요 |
| Q34 | unplugged 표본의 버전 규칙을 확정해요: 앱 선언 범위를 만족하는 버전만 인정하고, 범위를 읽지 못하면(`workspace:` · `catalog:` · git · 파일 등) 인정하지 않아요 | `yarn.lock` 의 해석 버전과는 대조하지 않아요(7절 한계). 범위 선언 앱에서 범위 안 다른 버전(합성 M2, 1.8.3)의 unplugged 만 가리켜도 PASS 예요 |
| Q44 | WI-0098 이 새로 만든 사용자 노출 문구(`contentPnpNote`)를 기존 check 문구와 같은 합니다체로 통일해요. 인자 · 경로 · 코드 조각은 바꾸지 않아요. theme add 의 안내 줄도 같은 함수를 써서 함께 바뀌어요 | 확정 문구는 testplan 3절. 「…가 없어요」 · 「…남아요」 가 「…가 없습니다」 · 「…남습니다」 로 바뀌고, 동적 형태 · dependenciesMeta 항목 · 경로는 글자 그대로예요. 측정: 실설치 51행 재측정에서 문구 외 차이(빌드 · severity · rc · 줄 수) 0, 비 PnP 31건 바이트 같음(testplan 8절) |
| Q45 | 그 패키지의 unplugged 디렉터리가 이미 있으면(`findPnpUnpluggedPackages` 결과에 있음, 대상 상태 `unplugged`) PnP 안내의 「정적 경로를 쓰려면 … dependenciesMeta 에 … 를 두고 yarn install 뒤 …」 설정 안내 문장을 빼고, 정적 경로 제안(목록 항목의 `→ "../../.yarn/unplugged/…"`)만 남겨요. 여러 패키지 중 일부만 unplugged 면 없는 패키지만 설정 안내에 나열해요 | `contentPnpNote(names, unplugged)` · `contentPnpNoteFor(targets)`(check · MCP · theme add 공용). 동적 형태 문장은 모든 대상 이름을 그대로 나열해요. 실설치에서는 Q3 · P3 의 none · nm · broad · dyn 8행(check · MCP 16개 파일)과 theme add Q3 none · nm 2개가 바뀌었어요 |
| Q47 | WI-0080 때부터 있던 상위 경로 안내 상수 `CONTENT_PARENT_PATH_NOTE` 를 다른 check 문구와 같은 합니다체로 맞춰요(「…기준으로 풀려요.」 → 「…기준으로 풀립니다.」). 경로 · 코드 조각 · 의미는 바꾸지 않고, 이 상수를 쓰는 check · MCP `axis.check_project` · theme add 가 함께 바뀌어요. 이번 결정은 이 상수 하나예요 | 확정 문구는 testplan 3절. 비 PnP 레이아웃 출력도 이 문구만큼 바뀌므로 AC8 의 정의를 「`CONTENT_PARENT_PATH_NOTE` 문구 외 바이트 불변」으로 고쳤어요. 이 문자열을 리터럴로 단언하던 기존 테스트 4곳(plan 5.1)의 기대를 갱신해요. 측정: 실설치 51행 · theme add 12개를 직전 출력(`q44/out-post`)과 비교하면 옛 문구를 새 문구로 치환한 뒤 차이 0(testplan 8절) |
| Q47-2 | 같은 결정의 범위(「상위 경로 안내」)로 WI-0090 의 「상위 경로 <rel> 는 앱이 쓰는 설치본과 다른 설치본…이라 덮음으로 보지 않아요」도 「…보지 않습니다」로 맞춰요. 판정 · severity 불변, check · MCP · theme add 목록 항목의 어미만 바뀌어요 | 2026-10-28 사용자 요청 「상위 경로 안내도 합니다체로」 |

Q30 의 「문구는 구현 뒤 Master 확인」은 Q44 · Q45 로 닫았어요. Q21 · Q25 와 Q35 ~ Q42 는 WI-0097 · WI-0100 몫이라 이 WI 에 영향이 없어요. Q29 는 구현 해석 초안 C5 를 사용자 결정으로 확정한 것이라 C5 행은 이 표로 옮겼어요.

#### 선례 · 코드로 정한 항목 (사용자 결정이 아님, 경계 보고서 3절 표 근거)

| 항목 | 답 | 근거 |
|---|---|---|
| DEC-4 WI-0080 AC5 「PnP 는 종전 경로」 | 대체해요. `pnp local` PASS 단언(`template-check.test.ts:2213`)은 새 PnP 판정으로 바꾸고, 「루트 설치본을 읽지 않음(`isPnpProject` 가드)」 불변식(`pnp up` 이 루트 설치본으로 PASS 가 되지 않음, `:2212`)은 유지해요 | Issue #242 가 이 결정을 다시 여는 건이에요 |
| extra 3 동적 형태의 문구 형식 | `suggest` 는 따옴표로 감싼 glob 문자열만 유지하고, 동적 형태 · unplugged 설정 안내는 별도 안내(구현 초안의 상수 `CONTENT_PNP_NOTE` 를 Q31 로 함수 `contentPnpNote(names)` 로 바꿈)로 붙여요 | `tailwind-core.ts:1340` · `theme/index.ts:460` 이 suggest 를 따옴표로 감싸요. `CONTENT_PARENT_PATH_NOTE`(`:1114`) 선례 |
| extra 4 unplugged 디렉터리가 여러 개일 때 | 패키지 이름 · 버전(`package.json`)이 앱 선언 범위와 맞는 디렉터리만 표본 · 대체 표본으로 써요(사용자 결정 Q34 로 확정) | WI-0090(실경로가 다른 설치본은 덮음으로 보지 않음, 426/427 실측) |
| extra 5 theme add 의 거짓 침묵 | 범위에 넣어요. theme add 도 check 와 같은 PnP 판정 · 같은 안내 문자열이에요 | WI-0080 D5(세 호출지가 같은 문자열) |
| `isPnpProject` 판정 조건 | 바꾸지 않아요(`.pnp.cjs` · `.pnp.js`, `.git` 멈춤) | WI-0091 Q3 |
| severity 원칙 | 항목별로 유지해요 | WI-0092 Q10 · WI-0094 Q11, README:115 |

#### 이 문서가 정한 구현 해석 (사용자 결정 · 선례가 직접 정하지 않은 자리, C1 ~ C4 는 Q30 으로 확정(2026-10-28), C5 는 Q29 로 확정해 결정 표로 옮김)

| # | 해석 | 이유 |
|---|---|---|
| C1 | 기본 PnP 에서 종전에 「덮지 않음」이던 대상(none · 정확한 zip · zip 와일드카드)은 **FAIL 을 유지**하고 제안만 PnP 안내로 바꿔요. WARN 으로 내리는 것은 Q23 이 이름 붙인 두 형태(node_modules glob · 넓은 `./**`), 곧 종전 표본을 덮던 glob 뿐이에요 | Q23 은 두 형태만 WARN 으로 정했어요. none 을 WARN 으로 내리면 결정에 없는 1 → 0 완화가 생겨요. 「없을 때 종전 동작」 원칙(measurement-discipline)과 최소 변경 원칙 |
| C2 | unplugged 가 있는 PnP 에서도 종전 표본을 덮던 glob(nm · broad)은 WARN 이에요(FAIL 아님) | Q23 의 「FAIL 로 올리지 않음 · 0 → 1 없음」을 unplugged 프로젝트에도 지켜요 |
| C3 | 루트 전용 선언 대상(Q22)의 severity 도 종전 덮음 여부를 따라요(종전 덮음 → WARN, 종전 덮지 않음 → FAIL). 예외로 content 를 정적으로 다 읽지 못하면(dynamic) 종전처럼 WARN 이에요(AC6 의 dynamic 조항, Q4 R-dyn). 문구만 `PNP_ROOT_ONLY_NOTE` 계열로 바꾸고 경로 제안은 내지 않아요 | Q22 는 「권하지도 인정하지도 않음」만 정했고 severity 는 정하지 않았어요. C1 · C2 와 같은 규칙으로 0 → 1 을 만들지 않아요 |
| C4 | unplugged 제안이 `../` 로 시작하면 종전처럼 `CONTENT_PARENT_PATH_NOTE` 가 붙어요 | `:1342` 의 `suggest.startsWith("../")` 판정을 그대로 둬요. 상위 경로가 빌드 cwd 기준으로 풀리는 것은 unplugged 경로에도 같다고 추정해요(미측정) |

---

## 2. 목표

Yarn Plug'n'Play 프로젝트의 Tailwind 3 `tailwind.content` 판정과 안내가 실제 빌드에서 ui-react · agentic-ui 클래스가 생기는지와 어긋나지 않게 해요.

1. node_modules 를 가리키는 glob 과 넓은 `./**` 를 PnP 에서 덮음(PASS)으로 보지 않아요. WARN 으로 알리고 이유(PnP 에는 node_modules 가 없음)를 문구에 넣어요(Q23). 앱이 PnP 루트이고 unplugged 가 있어도 `./**` 는 `.yarn` 을 넘지 않으므로 같아요(Q33).
2. PnP 에서 FAIL · WARN 문구와 theme add 의 안내가 `./node_modules/...` 를 권하지 않고, 동적 `require.resolve` 형태를 먼저 · unplugged 설정을 대안으로 안내해요(Q23, extra 3).
3. unplugged 설정(`dependenciesMeta` 의 `unplugged: true`)을 한 프로젝트에서는 실제 `.yarn/unplugged` 디렉터리를 표본으로 써서, 그 경로를 가리키는 정적 glob 을 PASS 로 인정해요(사용자 결정 Q29. 조사 결과 unplugged 상대 · 절대 glob 은 빌드 429 인데 FAIL). zip 경로는 판독하지 않아요(Q23).
4. 워크스페이스 루트에만 선언한 패키지는 PnP 에서 경로 제안 · 덮음 인정 없이 「앱 package.json 에 선언하세요」를 안내해요(Q22).
5. PnP 가 아닌 레이아웃(npm · pnpm 기본 · pnpm hoisted · yarn node-modules · 단일 · 설치본 없음)의 판정 · 문구 · theme add 출력은 바이트까지 그대로예요.

## 3. 범위

### 3.1 포함

- registry-core `tailwind-core.ts` 의 PnP content 표본 · 제안 · 덮음 판정: `packageContentTarget`(:1141-1190) · `inspectTailwindContent`(:1281-1315) · `checkTailwindContent`(:1329-1354), 타입 `ContentTarget`(:1245) · `TailwindContentInspection`(:1255), 새 안내 상수(:1114 옆), 머리 주석 :28-31 · :1141 · :1277-1279
- registry-core `project.ts`: unplugged 설치본 탐색 헬퍼(새 함수, `isPnpProject` :525-533 옆). 루트 전용 판정은 기존 `pnpRootOnlyDependency`(:205) 재사용
- cli theme add 의 content 안내: `theme/index.ts:455-465`(PnP 안내 줄). `theme-add.ts:479-485` 는 코드를 바꾸지 않아요(필터 `!t.covered` 그대로면 PnP 대상이 `contentMissing` 에 담겨요, plan 1절)
- cli check · MCP `axis.check_project` 는 코드 변경 없이 같은 코어를 번들로 반영(`template-check.ts:61` · `mcp template.ts:457`)
- 단위 테스트: cli `template-check.test.ts` WI-0080 블록(:2125-2214) PnP 행, cli `theme-add.test.ts` PnP content 행, mcp `template.test.ts` PnP content 행(`pnpApp` 헬퍼 :640 재사용)
- 문서(Q27): `packages/axis-cli/README.md:115` `tailwind.content` 절, `docs/guides/troubleshooting.md` Tailwind 3 해결 절(:115-131)에 PnP 한 줄
- changeset: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(registry-core 변경)

### 3.2 제외 (행선지)

| 항목 | 행선지 |
|---|---|
| Tailwind 4 의 content(`@source` · `tailwind.css` import). TW4 에서는 `inspectTailwindContent` 가 `null`(:1285) | WI-0097(#241) |
| init 의 PnP 안내 · Tailwind 4 안내(`init.ts:324-332`), PnP 루트 선언 경계를 init · add · template apply 로 넓히기 | WI-0095(#239, Q24) |
| Tailwind 3 preset ESM · `.ts` 설정의 tokens 게이트 공백 | WI-0101(#248, Q26) |
| ontology-console 템플릿의 content(`apps/web/templates/ontology-console/files/tailwind.config.ts:16`)와 그 산출물 `apps/web/public/templates/ontology-console.json` 재생성 | 별도 WI(Q27, Master 가 등록 여부 판단) |
| 그 밖의 `./node_modules` 안내 문서: `docs/guides/quick-start.md:106` · `packages/axis-ui-react/README.md:52` · `packages/axis-agentic-ui/README.md` · `docs/guides/theme-customization.md:255` · `:359` · `apps/web/src/app/(docs)/docs/page.tsx:80` | Q27 범위 밖. 템플릿 별도 WI 와 함께 Master 판단 |
| `.pnp.cjs` 정적 판독(`RAW_RUNTIME_STATE` packageLocation) · zip · `__virtual__` 경로 판독 | 하지 않음(Q23) |
| `isPnpProject` 판정 조건 변경 | 하지 않음(WI-0091 Q3) |
| `pnpFallbackMode` · `pnpMode: loose` 세부 판정, `.yarnrc.yml` 의 `pnpUnpluggedFolder` 사용자 지정 위치 | 잔여(7절) |
| `componentsDir` 대상(복사 설치) | PnP 와 무관, 그대로 |
| 동적 `require.resolve` 형태를 정적으로 인정해 PASS 로 올리기 | 하지 않음(WI-0080 D3 「동적 표현은 WARN」 유지) |
| WI-0097 · WI-0100 의 globals.css · TW4 판정 | 각 WI |

---

## 4. 수용 기준

모든 AC 의 일차 판정은 `tailwind.content` 항목의 severity · 문구예요. 종료 코드는 다른 항목이 모두 PASS 인 fixture 에서만 기록해요. 「음성 대조」는 고치기 전 소스 · 발행본에서 실패(거짓 판정)가 재현되는지예요. 수정 없이도 통과하는 AC 는 **회귀 가드**로 따로 표시했어요.

- **AC1**: 기본 PnP 앱에서 content 가 `./node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`(agentic-ui 도 같음)만으로 패키지를 덮으면 `tailwind.content` 가 WARN 이에요(PASS 아님, FAIL 아님). 문구에 「Plug'n'Play 에는 node_modules 가 없어 이 경로를 스캔하지 않음」 취지와 PnP 안내 상수가 들어가고 `./node_modules/...` 제안은 0건이에요.
  - 측정: 실설치 Q1 · P1 의 nm 행을 신판 cli check · MCP 로 실행, 빌드 4(none 과 `cmp` 같음)와 함께 기록. 단위 테스트는 `template-check.test.ts:2213` 기대를 새 WARN 으로 바꾸고 agentic-ui 행을 더해요.
  - 음성 대조: 발행본 1.7.6 은 PASS(측정 V1-nm · Q-nm). 새 단위 테스트를 HEAD 소스에 돌려 빨강을 기록해요.
- **AC2**: 기본 PnP 앱에서 넓은 glob `./**/*.{js,mjs}` 도 AC1 과 같은 WARN 이에요. node-modules 레이아웃의 broad 판정(hoisted FAIL · isolated · single PASS, `:2189-2191`)은 그대로예요.
  - 측정: Q1 · P1 broad 행, 빌드 4. 단위 테스트에 `pnp broad` 행을 더해요.
  - 음성 대조: 발행본 PASS(측정 V5-broad · Q-broad). 새 행을 HEAD 소스에 돌려 빨강을 기록해요.
- **AC3**(Q23 으로 다시 씀): 기본 PnP 앱에서 종전 표본을 덮지 않는 content(none · 정확한 zip 절대 · 상대 · zip 와일드카드)는 FAIL 을 유지하되(C1), 제안이 `./node_modules/...` 가 아니라 PnP 안내(동적 형태 먼저 · unplugged 대안)예요. 동적 `require.resolve` 형태는 종전처럼 WARN 이고 문구의 제안도 같은 PnP 안내로 바뀌어요. zip 경로는 판독하지 않으므로 정확한 zip glob 이 PASS 가 되지 않는 것은 실패가 아니라 기대값이에요.
  - 측정: Q1 · P1 의 none · zipabs · ziprel · zipwild · dyn 행. 행마다 빌드 정답(4 또는 429) · 구판 · 신판 판정을 표로 적어요. 단위 테스트는 `:2212`(`pnp up`) 기대를 새 제안으로 바꾸고 none · dyn 행을 더해요.
  - 음성 대조: 발행본은 none FAIL · dyn WARN 의 제안이 `./node_modules/...`(측정 V0-none · Q-none · V2-dyn · Q-dyn). 새 단위 단언을 HEAD 소스에 돌려 빨강을 기록해요.
- **AC4**(Q29): unplugged 를 설정한 PnP 앱에서 앱 선언 범위에 맞는 `.yarn/unplugged/<dir>/node_modules/<pkg>` 가 있으면, 그 위치를 가리키는 상대 glob(`../../.yarn/unplugged/*/node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}`)과 실경로 절대 glob 이 PASS 예요. 같은 앱의 none 은 FAIL 이고 제안은 unplugged 상대 glob(+ C4 의 cwd 안내)이에요. 앱 선언 범위에 맞지 않는 버전의 unplugged 디렉터리만 있으면 그 경로는 덮음으로 보지 않아요(extra 4 · Q34). unplugged 표본은 `**` · `*` 가 점으로 시작하는 세그먼트(`.yarn`)를 넘지 않는 glob 만 덮어요(Q33: PnP 루트 앱의 `./**` 는 WARN, `./.yarn/...` 를 글자로 쓴 glob 은 PASS).
  - 측정: 실설치 Q3 · P3 의 rel · abs · none 행, 빌드 429 는 C-up · P2-up 과 `cmp`. 단위 테스트는 `.yarn/unplugged` 스텁(맞는 버전 · 맞지 않는 버전 두 갈래)으로 행을 더해요.
  - 음성 대조: 발행본은 rel · abs 모두 FAIL(측정 P3-unplugrel · P3-unplugabs · U-rel, 빌드 429). 맞지 않는 버전 행은 실설치로 재지 않았어요(미측정, 단위 테스트로만 고정).
- **AC5**: 안내를 따르면 실제로 동작해요. Q1(기본 PnP) none 의 FAIL 문구에 든 동적 형태를 글자 그대로 `tailwind.config.js` 에 넣으면 빌드 429(C-up 과 `cmp` 같음)이고 check 는 WARN(정적 확인 불가) · rc 0 이에요. Q3(unplugged) none 의 제안 glob 을 그대로 넣으면 빌드 429 · check PASS 예요. theme add 가 같은 두 fixture 에서 내는 안내 문자열은 check 문구의 안내와 같아요.
  - 측정: 신판 문구를 복사해 넣고 빌드 · check 를 다시 실행(문구가 구현 때 정해지므로 수정 뒤에만 잴 수 있어요). 동적 형태는 `run.sh` 의 prelude 인자로 넣는 줄(`const path = require("path")`)을 기록에 명시하고, 그 밖의 글자는 문구에서 그대로 복사해요. 안내는 패키지 이름을 채워요(사용자 결정 Q31), 그래서 자리 바꿈 없이 그대로 복사해요. check · theme add 안내 문자열을 `diff`.
  - 음성 대조: 발행본 제안(`./node_modules/...`)을 따르면 빌드 4 인데 PASS(측정 V0-none → V1-nm, 출력 CSS `cmp` 같음).
- **AC6**(Q22): PnP 에서 `@axis-ds/ui-react` 를 워크스페이스 루트에만 선언한 앱은 content 대상 문구가 「@axis-ds/ui-react 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」 계열이고, 경로 제안 · 동적 형태 안내 · 덮음 인정이 없어요. severity 는 C3(종전 덮음 → WARN, 종전 덮지 않음 → FAIL, content 를 정적으로 다 읽지 못하면 종전처럼 WARN)를 따라요. 앱에도 선언하면 AC1 ~ AC4 의 판정으로 돌아가요(양성 대조).
  - 측정: 실설치 Q4 의 dyn · nm · none 행. 구현 첫 단계에서 Q4 nm · none 행의 발행본 판정 · 빌드, R-dyn 의 발행본 문구 재기록(제안 문자열), Q4 에 unplugged 를 설정하고 unplugRel glob 으로 빌드 · 발행본 check를 먼저 재요(지금은 R-dyn 의 severity · rc · 빌드만 측정). unplugRel 빌드가 429 이면 루트 전용을 인정하지 않는 C3 판정이 그 행에서 거짓 FAIL · WARN 이 되므로 7절에 알려진 한계로 적어요.
  - 음성 대조: 발행본은 Q4 R-dyn 에서 check WARN · rc 0, 그 동적 형태의 빌드는 rc 1 `MODULE_NOT_FOUND`(측정). 제안 문자열이 `./node_modules/...` 라는 것은 코드상 추정이에요(`tailwind-core.ts:1153`, 구현 첫 단계에서 재기록). 새 단위 단언을 HEAD 소스에 돌려 빨강을 기록해요.
- **AC7**(extra 5): PnP 앱에서 cli `theme add` 의 content 안내가 check 와 같은 판정 · 같은 안내 상수를 써요. `./node_modules` glob 만 있으면 종전 침묵 대신 PnP 안내 줄을 내고, none 이면 「넣으세요: "./node_modules/..."」 대신 PnP 안내를 내요. 루트 전용 선언이면 AC6 문구예요. theme add 종료 코드는 0 그대로예요.
  - 측정: 실설치 TA1-nm · TA1-none 과 P4 를 신판으로 실행, 줄 수 · 문구 기록. `theme-add.test.ts` 에 PnP TW3 행을 더해요.
  - 음성 대조: 발행본 TA1-nm content 안내 0줄 · TA1-none 「넣으세요: "./node_modules/..."」(측정). 새 단언을 HEAD 소스에 돌려 빨강을 기록해요.
- **AC8**(**회귀 가드**): PnP 가 아닌 레이아웃의 `tailwind.content` severity · 문구 · rc, theme add 출력은 수정 전 발행본 cli 1.7.6 · mcp 1.4.5 와 `CONTENT_PARENT_PATH_NOTE` 문구 외에는 바이트까지 같아요(사용자 결정 Q47: 그 상수의 옛 문구를 새 문구로 치환한 뒤 diff 0). 대상: npm workspaces(hoisted) · pnpm 기본 · pnpm hoisted · 단일 · 설치본 없음 · yarn node-modules(Q2 · P2)의 up · local · none · broad · relobj · abs 행. 기존 단위 테스트(WI-0080 MATRIX `:2188-2199`, WI-0090 블록 `:2295-`, mcp `template.test.ts:547-635`)는 기대값을 바꾸지 않고 초록이에요.
  - 측정: 구판 · 신판 출력 `diff` 0. 양성 대조로 같은 드라이버를 PnP 행(Q1 nm)에 돌려 diff 가 나는 것을 함께 보여, diff 0 이 측정 실패가 아님을 증명해요. 수정 없이 통과하는 AC 라 수정을 증명하지는 않아요.
- **AC9**(**회귀 가드**): CLI check 와 MCP `axis.check_project` 의 `tailwind.content` 문구가 모든 PnP 행(Q1 · Q3 · Q4 · P1 · P3)에서 같아요.
  - 측정: 행마다 CLI · MCP 출력 줄 대조, 불일치 0. 양성 대조로 비교 대상 한쪽 문자열을 일부러 바꾼 변이에서 불일치가 잡히는지 봐요. 두 호출지가 같은 코어를 번들하므로 발행본에서도 이미 같았어요(측정).
- **AC10**: 변이 검증. 아래 변이마다 해당 AC 의 테스트가 빨개지고, 되돌린 뒤 sha256 이 원본과 같아요. ① PnP 분기 제거(종전 `node_modules` 표본 · 제안) → AC1 · AC2 · AC3 ② unplugged 탐색 제거 → AC4 ③ 버전 범위 필터 제거 → AC4 의 맞지 않는 버전 행 ④ 루트 전용 분기 제거 → AC6 ⑤ 종전 덮음 PnP 대상을 FAIL 로 올림 → AC1 · AC2(0 → 1 가드) ⑥ theme add 의 PnP 안내 줄 제거 · PnP 대상을 `contentMissing` 에서 빼는 변이(testplan MT6 · MT7) → AC7.
  - 측정: testplan 5절 변이 표 형식으로 cli · mcp 빨강 건수 기록.
- **AC11**(Q27): `packages/axis-cli/README.md` 의 `tailwind.content` 절에 1.7.7 부터의 PnP 판정(node_modules glob · `./**` WARN, 동적 형태 · unplugged 안내, unplugged 인정, 루트 전용 선언)을 적고, 「설치본이 없거나 Plug'n'Play 면 `./node_modules/...`」 서술을 고쳐요. `docs/guides/troubleshooting.md` Tailwind 3 해결 절에 PnP 한 줄을 더해요.
  - 측정: 두 파일 `git diff` 검토, README 의 `Plug'n'Play 면 \`./node_modules` 서술 grep 0건.
  - 음성 대조: HEAD README:115 에 그 서술이 있어요(읽어서 확인).
- **AC12**: 이 WI 의 PR 에 `@axis-ds/cli` patch · `@axis-ds/mcp` patch changeset 이 있고, 본문에 「업데이트 뒤 check 종료 코드가 1 에서 0 으로 바뀔 수 있는 경우(unplugged glob)」와 「0 에서 1 로 바뀌는 경우는 없음」, PASS → WARN 으로 바뀌는 형태(node_modules glob · `./**`)를 적어요.
  - 측정: `pnpm check-changeset-mcp-tokens` rc 0, changeset 본문 grep. 이 검사는 미발행 changeset 전체를 세므로 이 PR 자기 changeset 이 있는지는 리뷰에서 따로 확인해요(경계 보고서 4절).

AC 12개 중 AC8 · AC9 는 회귀 가드예요.

## 5. 종료 코드 변화

check 전체 종료 코드는 다른 항목이 모두 PASS 일 때 기준이에요. 신판 값은 testplan 4절 · 8절의 재측정 값이에요.

| 경우 | 발행본 1.7.6 | 신판 기대 | rc |
|---|---|---|---|
| PnP(기본 · unplugged) + node_modules glob 또는 `./**` 만 | PASS | WARN | 0 → 0 |
| 기본 PnP + none · 정확한 zip · zip 와일드카드 | FAIL(제안 `./node_modules`) | FAIL(PnP 안내) | 1 → 1 |
| PnP + 동적 `require.resolve` | WARN(제안 `./node_modules`) | WARN(PnP 안내) | 0 → 0 |
| unplugged PnP + unplugged 상대 · 절대 glob(앱 범위에 맞는 버전) | FAIL | PASS | **1 → 0**(Q29) |
| PnP 루트 전용 선언 + 종전 덮음 glob | PASS(측정, 착수 측정 Q4 nm · broad) | WARN | 0 → 0 |
| PnP 루트 전용 선언 + 종전 덮지 않음 | FAIL(측정, 착수 측정 Q4 none) | FAIL(앱 선언 안내) | 1 → 1 |
| PnP 루트 앱 + unplugged + 넓은 `./**` 만(Q33) | PASS(측정 S1-broad, 빌드 4) | WARN | 0 → 0 |
| PnP 가 아닌 레이아웃 전부 | - | 바이트 같음 | 불변 |
| cli theme add(PnP) | rc 0 | 안내 줄이 바뀌거나 생김 | 0 → 0 |

0 → 1 로 바뀌는 경우는 없어요(Q23 · C1 ~ C3). MCP 는 종료 코드가 없고 결과 텍스트 · summary 의 pass/warn/fail 수가 같은 방향으로 바뀌어요.

## 6. 위험

- `isPnpProject` 오인: `.git` 이 없는 배포 디렉터리 등에서 상위 `.pnp.cjs` 를 보면 node_modules 프로젝트가 PnP 판정을 받아요. C1 · C2 덕분에 새로 FAIL 이 되지는 않고 PASS → WARN 만 생겨요(추정).
- 같은 파일을 고치는 WI-0097 · WI-0100 과 텍스트 충돌(`project.ts` · `theme/index.ts` import 블록 · README · `template-check.test.ts` · 머리 주석). 순서는 plan.md 3절.
- 단위 테스트 스텁의 한계: 빈 `.pnp.cjs` 와 가짜 디렉터리 스텁은 zip · virtual 동작을 재현하지 못해요. 빌드 정답은 실설치 fixture 측정으로만 판정해요.

## 7. 잔여 오차 (알려진 한계)

- 정확한 zip 경로 glob 은 빌드가 429 인데 FAIL 이에요(zip 판독 안 함, Q23 · C1). 안내를 따라 동적 형태로 바꾸면 rc 0 이 돼요.
- 기본 PnP 사용자는 정적 PASS 를 받을 수 없어요. 동적 형태는 영구 WARN 이고, PASS 는 unplugged 설정을 한 경우뿐이에요.
- unplugged 와일드카드 제안(`.yarn/unplugged/*/...`)은 업그레이드 뒤 남은 이전 버전 unplugged 디렉터리도 함께 스캔할 수 있어요. 판정은 extra 4 로 범위에 맞는 디렉터리만 표본으로 쓰지만 제안 glob 자체는 와일드카드예요(미측정).
- `.yarnrc.yml` 의 `pnpUnpluggedFolder` 로 위치를 바꾼 프로젝트는 unplugged 를 찾지 못해 기본 PnP 로 판정돼요(추정).
- 미측정 축: agentic-ui 실빌드(fixture 에 agentic-ui zip 없음, 코드 경로는 ui-react 와 같음), Next.js postcss 경유 빌드, Yarn 2 · 3, `pnpMode: loose` · `pnpFallbackMode: all`, Yarn 기본 전역 캐시(`enableGlobalCache: true`) 레이아웃, Windows 에서 동적 형태의 경로 구분자, ESM(`tailwind.config.mjs`) · `.ts` 설정에서 동적 형태 안내의 동작(`require` 가 없음), 덮지 않은 PnP 대상이 둘(ui-react · agentic-ui)일 때 나열한 안내를 그대로 넣은 실빌드(Q31, 단위 테스트로 문자열만 고정).
- 루트 전용 선언 + unplugged(Q4u)에서 unplugged 상대 · 절대 glob 은 빌드 429(대조군과 cmp 같음, 착수 측정)인데 FAIL 이에요. 루트 전용은 경로를 인정하지 않는 결정(Q22 · C3)의 알려진 한계예요. 앱 `package.json` 에 선언하면 AC4 판정으로 돌아가요.
- unplugged 표본의 버전은 앱 선언 범위만 보고 `yarn.lock` 의 해석 버전과 대조하지 않아요(Q34). 범위 선언(`^1.8.0`) 앱에서 범위 안의 다른 버전(1.8.3) unplugged 디렉터리만 가리키는 glob 도 PASS 예요(합성 fixture M2 측정, 실설치 재현 안 함). 서로 다른 워크스페이스가 범위 안의 두 버전을 함께 unplug 해야 생겨요.
- Q33 의 점 세그먼트 규칙은 세그먼트 첫머리의 `*` · `**` · `?` · `[...]` 에 걸고, `[.]yarn` 처럼 문자 집합으로 점을 쓴 glob 은 덮지 않는 쪽(보수적)으로 봐요(미측정). 비 PnP 판정에는 이 규칙을 쓰지 않아요(pnpm `.pnpm` 스토어 표본은 종전 정규식).
