# WI-0098: Yarn PnP 의 Tailwind 3 content 판정 구현 계획

> PRD: [prd.md](./prd.md) | 같은 발행: WI-0097 · WI-0100 | 순서: WI-0100a → WI-0097 → WI-0100b, WI-0098 은 독립 병렬(경계 보고서 2절)
> 줄 번호는 `main` 18d0357 기준이에요. 착수 때 같은 커밋에서 다시 읽고, 앞선 WI 가 머지된 뒤 rebase 하면 줄을 다시 맞춰요

## 1. 고칠 지점

| 파일:줄 | 함수 · 자리 | 변경 |
|---|---|---|
| `packages/axis-registry-core/src/template/tailwind-core.ts:1141-1190` | `packageContentTarget` | :1152 의 `isPnpProject(baseDir) ? undefined : ...` 를 PnP 분기로 바꿔요. ① 루트 전용(`pnpRootOnlyDependency` 참): 표본 · 제안 없음, 상태 `rootOnly` ② unplugged 설치본 있음: 표본 = 그 디렉터리(baseDir 기준 상대) `dist/index.js`, 대체 표본 = 범위에 맞는 나머지 unplugged 디렉터리, 제안 = `<pnp 루트 상대>/.yarn/unplugged/*/node_modules/<pkg>/dist/**/*.{js,mjs}` ③ 기본 PnP: 덮일 수 있는 표본 없음, 상태 `noNodeModules`. 세 갈래 모두 종전 표본 `node_modules/<pkg>/dist/index.js` 를 「종전 덮음」 판별용으로만 함께 돌려줘요. PnP 가 아니면 지금 코드 그대로예요 |
| 같은 파일 :1245 · :1255 | `ContentTarget` · `TailwindContentInspection` | 선택 필드(가칭 `pnp?: { state: "noNodeModules" \| "unplugged" \| "rootOnly"; legacyCovered: boolean }`)를 더해요. PnP 가 아니면 필드를 만들지 않아 theme add · MCP 출력이 바이트 그대로예요(AC8) |
| 같은 파일 :1281-1315 | `inspectTailwindContent` | 대상 선정(:1294-1298 `declaredRange`)은 그대로 두고 루트 전용 여부만 대상에 실어요. :1308-1312 에서 `covered` 는 표본 · 대체 표본으로만, `legacyCovered` 는 종전 표본으로 계산해요. 루트 전용 대상은 `covered` 가 늘 거짓이에요(Q22 「인정하지 않음」) |
| 같은 파일 :1329-1354 | `checkTailwindContent` | 덮이지 않은 대상 중 PnP `legacyCovered` 참인 것은 WARN 쪽으로, 나머지는 종전 FAIL · WARN 규칙 그대로(C1 ~ C3). 목록 항목(:1340)은 PnP 대상이면 `label → "suggest"` 대신 이유를 쓰고(unplugged 는 glob 제안 유지), PnP 대상이 하나라도 있으면 안내 상수를 덧붙여요. :1342 `CONTENT_PARENT_PATH_NOTE` 판정은 그대로라 unplugged 제안에도 붙어요(C4). 루트 전용은 `PNP_ROOT_ONLY_NOTE` 틀(「<pkg> 가 <PNP_ROOT_ONLY_NOTE> → 앱 package.json 에 선언하세요」) |
| 같은 파일 :1110-1114 옆 | 새 export 함수 `contentPnpNote(names)`(구현 초안의 상수 `CONTENT_PNP_NOTE` 를 사용자 결정 Q31 로 바꿈, 패키지 이름을 채움) | 동적 형태 먼저 · unplugged 대안 안내(문구 초안은 testplan 3절). cli `theme/index.ts` 가 import 해요 |
| 같은 파일 :28-31 · :1141 · :1277-1279 | 주석 | 「PnP 면 종전 `node_modules/<pkg>`」 서술을 새 규칙으로 고치고 WI-0098 줄을 더해요 |
| `packages/axis-registry-core/src/project.ts` :525-533 옆 | 새 헬퍼(가칭 `findPnpUnpluggedPackages(baseDir, name, range)`) | `.pnp.cjs` 가 있는 층(= `isPnpProject` 와 같은 탐색, `.git` 멈춤)의 `.yarn/unplugged/*/node_modules/<name>/package.json` 을 읽고 버전이 앱 선언 범위에 맞는 것만 돌려줘요(extra 4). 범위 판정은 registry-core 의 기존 버전 비교 헬퍼를 재사용해요(착수 때 이름 확정). `.pnp.cjs` 는 읽지 않아요(Q23) |
| `packages/axis-registry-core/src/project.ts:205` | `pnpRootOnlyDependency` · `PNP_ROOT_ONLY_NOTE`(:217) | 변경 없이 재사용 |
| `packages/axis-cli/src/theme/theme-add.ts:479-485` | `plan.tailwindConfig.contentMissing` | **코드 변경 없음.** 필터 `!t.covered` 를 그대로 두면 PnP `legacyCovered` 대상도 담겨 종전 침묵(TA1-nm)이 사라져요. 구현 뒤 그렇게 담기는지만 확인해요. `contentUnknown` 계산(:484)도 그대로예요 |
| `packages/axis-cli/src/theme/index.ts:455-465` | theme add 의 content 안내 | PnP 대상이면 「넣으세요: "…"」 대신 이유 줄, 그 뒤 회색 안내 상수 줄(:465 `CONTENT_PARENT_PATH_NOTE` 패턴). 루트 전용은 AC6 문구. 비 PnP 줄은 그대로 |
| `packages/axis-cli/src/template/template-check.ts:61` · `packages/axis-mcp/src/tools/template.ts:457` | `checkTailwindContent` 호출 | 코드 변경 없음(번들로 반영) |
| `packages/axis-cli/README.md:115` | `tailwind.content` 절 | 1.7.7 PnP 서술(AC11) |
| `docs/guides/troubleshooting.md:115-131` | Tailwind 3 해결 절 | PnP 한 줄(AC11) |
| `.changeset/wi-0098-pnp-content-glob.md` | 새 파일 | cli · mcp patch(AC12) |

## 2. 구현 단계

1. **기준선**: worktree 에서 `pnpm install --frozen-lockfile` 뒤 cli `template-check.test.ts` · `theme-add.test.ts` · mcp `template.test.ts` 와 전체 통과 수를 기록해요(빌드 전 mcp `tokens-sync` 는 0건 실행이라 계측 실패로 따로 적어요, WI-0091 선례).
2. **Q22 근거 측정**: Q4 nm · none 행의 발행본 판정 · 빌드, R-dyn 의 발행본 문구 재기록(제안 문자열), Q4 에 unplugged 를 설정하고 unplugRel glob 으로 빌드 · 발행본 check를 재고 빌드 규칙 수를 기록해요(AC6 음성 대조의 빈칸). unplugRel 빌드가 429 이면 C3 의 알려진 한계로 prd 7절에 적어요. Q22 근거는 축마다 갈라요. TW3 content(이 WI)의 근거는 Q4 R-dyn(측정, `require.resolve` `MODULE_NOT_FOUND` · 빌드 rc 1)과 이 WI 구현 첫 단계의 Q4 측정이고, CSS `@import` 실빌드는 WI-0097 의 근거예요(WI-0097 첫 단계에서 잼). 이 WI 는 병렬이라 2단계 시점에 그 측정이 없을 수 있으므로, 문구 고정(plan 2절 3단계) 전에 WI-0097 첫 단계 측정이 끝났고 루트 전용 안내와 어긋나지 않는지 확인해요.
3. **문구 고정**(대기 조건: WI-0097 첫 단계의 CSS `@import` 실빌드 측정 완료): testplan 3절의 문구 초안을 Master 에 확인받아 확정해요(WI-0091 A1 선례처럼 문구는 출력 계약이에요). 그 측정이 아직 없으면 이 단계는 기다리고 4 · 5단계(헬퍼 · 코어 판정)는 먼저 진행해요.
4. **헬퍼**: `project.ts` unplugged 탐색. 단위 테스트(스텁 디렉터리 두 버전)부터 써요.
5. **코어**: `packageContentTarget` → 타입 → `inspectTailwindContent` → `checkTailwindContent` 순서. 각 단계에서 비 PnP 기존 테스트가 초록인지 봐요.
6. **theme add**: `theme/index.ts` 안내 줄. `theme-add.ts` 는 코드를 바꾸지 않고 PnP 대상이 `contentMissing` 에 담기는지만 확인해요.
7. **테스트**: 기존 기대 변경(5절) → 새 행 → A/B(새 테스트를 HEAD 소스에) → 변이(testplan 5절).
8. **실설치 재측정**: testplan 4절 표, CLI · MCP 줄 대조, 안내 적용 측정(AC5).
9. **문서 · changeset · release-notes 갱신**.
10. **게이트**: turbo build · type-check · lint `--force`(Cached 0), vitest. 빌드가 다시 만든 `apps/web/public/templates/*.json` 은 커밋 전에 되돌려요(WI-0091 선례).

## 3. 다른 WI 와의 순서 · 충돌 지점

### 3.1 소유 원칙 (경계 보고서 1-2)

- WI-0100 은 「어느 전역 CSS 파일을 읽나」, WI-0097 은 「그 줄이 이 앱에서 해석되나」를 맡아요. WI-0098 은 Tailwind 3 content(`tailwind-core.ts:1079-1354`) 전부를 단독으로 맡아요.
- Tailwind 4 에서는 `inspectTailwindContent` 가 `null`(:1285)이라 판정이 겹치지 않아요. 그래서 별도 worktree 에서 병렬로 해요.

### 3.2 순서

| 단계 | 내용 | WI-0098 |
|---|---|---|
| 1 | WI-0100a 파일 선택 헬퍼 | 병렬 진행 |
| 2 | WI-0097 해석 게이트 · 문구 · 상수 이전 | **이 단계 머지 뒤 rebase** 해요(`theme/index.ts` import 블록이 겹침). 문구 고정(2절 3단계)은 이 단계의 첫 측정(CSS `@import` 실빌드)을 기다려요 |
| 3 | WI-0100b 상대 `@import` 펼침 | 겹치는 함수 없음. 머지 순서는 Master 가 정해요 |
| 발행 | 세 WI 를 Version PR 하나로 | cli 1.7.7 · mcp 1.4.6 |

WI-0095(#239)는 이 묶음 뒤예요. WI-0095 가 `theme-add.ts` · `theme/index.ts` 를 고치므로 이 WI 가 먼저 머지돼야 충돌이 작아요(추정).

### 3.3 텍스트 충돌 지점

| 자리 | WI-0097 | WI-0100 | WI-0098 | 처리 |
|---|---|---|---|---|
| `tailwind-core.ts` 머리 주석 :1-33 | :12-14 · :24-26 | globals 서술 | :28-31 | 각자 고치고, 마지막에 머지하는 쪽이 전체를 다시 읽어요 |
| `project.ts` | 해석 상태 헬퍼 | `findGlobalCss` 이전(:374 옆) | unplugged 헬퍼(:525-533 옆) | 함수는 갈리지만 import · export 줄이 겹쳐요. rebase 때 export 목록을 합쳐요 |
| `theme/index.ts` | :367-385 DEC-2 문구 이전 | :353 | :455-465 | WI-0097 뒤 rebase |
| `theme-add.ts` | :404-419, :115 상수 | :424 | 변경 없음(:479-485 읽기만) | WI-0098 은 고치지 않아 충돌 없음 |
| `packages/axis-cli/README.md` | :101 · :109 | :98 · :109 · :116 | :115 | WI-0098 은 :115 만 고쳐요 |
| `template-check.test.ts` | :922-940 · :1122-1134 · :2572-2586 | :230-347 | :2125-2214 | 블록은 다르고 텍스트 충돌만 남아요 |
| `.changeset/` | 자기 파일 | 자기 파일 | `wi-0098-pnp-content-glob.md` | `check-changeset-mcp-tokens` 는 미발행 전체를 세므로 PR 마다 자기 파일을 리뷰에서 확인해요 |

## 4. 바꾸지 않는 곳

- `isPnpProject` 조건(WI-0091 Q3), `detectTailwind`, 대상 선정의 `declaredRange`(루트 선언도 대상이 되는 것은 유지하고 문구 · 인정만 바꿈)
- `contentGlobBranchCovers` · `contentGlobCovers`(:1079-1107) 의 매칭 규칙. 표본만 바꾸고 매처는 그대로 써요
- `readTailwindContent`(:1236-1257) 의 동적 판정(동적 형태는 계속 WARN, WI-0080 D3)
- 비 PnP 의 표본 · 대체 표본 · `others`(WI-0080 · WI-0090)
- init(Q24, WI-0095), Tailwind 4 경로(WI-0097)

## 5. 바뀔 기존 테스트 (착수 전 고정 목록)

조사 · 검증 단계가 후보로 준 것을 HEAD 18d0357 에서 grep 으로 다시 확인한 목록이에요. 착수 때 기준선(2절 1단계) 실행 결과로 한 번 더 확정하고, 이 밖에서 빨개지는 테스트가 나오면 기대를 바꾸기 전에 원인부터 적어요.

### 5.1 기대가 바뀌는 것

| 파일:줄 | 테스트 | 종전 기대 | 새 기대 |
|---|---|---|---|
| `packages/axis-cli/src/template/template-check.test.ts:2213` | 「AC5: 설치본이 없거나 Plug'n'Play 면 종전 표본 …」 `contentItem("pnp", "local")` | PASS | WARN + PnP 이유 · 안내 상수(AC1) |
| 같은 파일 :2212 | 같은 테스트 `contentItem("pnp", "up")` | `FAIL(LOCAL)`(제안 `./node_modules/...`) | FAIL 유지 · 제안 자리에 PnP 안내(AC3). 「루트 설치본을 읽지 않음」 불변식은 그대로(DEC-4) |
| 같은 테스트 이름 · 주석 :2208-2211 | 「PnP 면 종전 표본」 | - | 새 규칙 서술로 바꿔요 |
| `packages/axis-cli/src/template/template-check.test.ts:1887` | 파일 상수 `PARENT_NOTE`(WI-0080 · WI-0090 · WI-0098 블록의 상위 경로 안내 단언) | 「…기준으로 풀려요.」 | 「…기준으로 풀립니다.」(사유 Q47) |
| `packages/axis-cli/src/theme/theme-add.test.ts:868` | 「호이스팅 모노레포: ui-react content 제안이 ../../node_modules 이고 cwd 기준 안내 1줄 …」 지역 상수 `PARENT_NOTE` | 「…풀려요.」 | 「…풀립니다.」(사유 Q47) |
| `packages/axis-cli/src/theme/theme-add.test.ts:904` | describe 「WI-0098: Plug'n'Play 의 content 안내」 지역 상수 `PARENT_NOTE` | 「…풀려요.」 | 「…풀립니다.」(사유 Q47) |
| `packages/axis-mcp/src/tools/template.test.ts:552` | describe 「handleCheckProject WI-0080: 호이스팅 Tailwind 3 앱의 content 표본 · 제안」 지역 상수 `PARENT_NOTE` | 「…풀려요.」 | 「…풀립니다.」(사유 Q47) |

사유 Q47(2026-10-28 사용자 결정): `CONTENT_PARENT_PATH_NOTE` 를 합니다체로 맞춰 이 상수를 리터럴로 단언하던 위 4곳만 기대를 바꿨어요. severity · rc · 목록 문구 단언은 그대로예요. 5.2 의 비 PnP 회귀 가드 가운데 상위 경로 제안을 단언하는 행(WI-0080 MATRIX · WI-0090 · mcp WI-0080 블록 · theme-add :847-894)은 이 상수를 위 리터럴로 참조하므로, 상수 글자 말고는 기대가 바뀌지 않았어요.

### 5.2 바뀌지 않아야 하는 것 (점검 후보, 회귀 가드)

| 파일:줄 | 이유 |
|---|---|
| `template-check.test.ts:2188-2199` WI-0080 MATRIX(hoisted · isolated · single) · `:2201-2206` · `:2215-` AC6 | 비 PnP(AC8) |
| `template-check.test.ts:2295-2360` WI-0090 블록 | 비 PnP(AC8) |
| `template-check.test.ts:1719` · `:2457` | PnP 지만 dependencies 항목만 단언 |
| `template-check.test.ts:2076` | PnP 지만 `detectTailwind` · `axisPackagesBelowTailwind4` 만 단언 |
| `theme-add.test.ts:1118-1139` P1 Plug'n'Play | Tailwind 4 경로라 content 안내가 없음 |
| `theme-add.test.ts:847-894` content 안내 행 | 비 PnP(AC8) |
| `theme-commands.test.ts:164-200` `pnp` 옵션 행 | theme list · info 경로, content 무관 |
| mcp `template.test.ts:228-241` WI-0065 D8 · `:547-635` WI-0080 블록 | 비 PnP(AC8) |
| mcp `template.test.ts:636-` WI-0091 · 0094 · 0092 `pnpApp` 블록 | dependencies · brand.activation · animation 만 단언(tailwind.content · summary 수 단언 없음, grep 확인). 새 PnP content 행이 결과 수를 바꿔도 이 블록 단언은 항목별이라 영향이 없다고 추정해요 |

### 5.3 새로 더하는 것

- cli `template-check.test.ts` WI-0080 블록 옆 새 describe 「WI-0098」: 레이아웃 `pnp`(기본) · `pnpUnplugged` · `pnpUnpluggedOther`(범위 밖 버전) · `pnpRootOnly` × 변형 nm · broad · none · dyn · unplugRel · unplugAbs, agentic-ui 한 행
- cli `theme-add.test.ts`: `wsApp`(:906-935, `pnp` 옵션 있음)으로 Tailwind 3 PnP 앱을 만들어 nm · none · 루트 전용 출력 단언. `wsApp` 이 Tailwind 3 설정 파일을 만들지 못하면 그 블록에 옵션을 더해요(착수 때 확인)
- mcp `template.test.ts`: `pnpApp` 재사용, nm · unplugRel · 루트 전용 3행(CLI 와 같은 문자열)
