# WI-0101: Tailwind 3 preset 의 tokens 해석 게이트 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 같은 배치: WI-0103 · WI-0089(병렬, 파일 겹침은 착수 때 확인)
> 줄 번호는 `main` e103d43 기준이에요(발행 커밋 1e8da06 뒤 `packages/` 변경 0줄). 이 계획은 prd 6절 권장안을 전제로 써요. 사용자 결정이 권장안과 다르면 2절 · 4절을 다시 써요

## 1. 원인 위치

| 파일:줄 | 지금 하는 일 | 공백 |
|---|---|---|
| `packages/axis-registry-core/src/template/tailwind-core.ts:1118` `PRESET_REFERENCE` · `:1121-1123` `hasTokensPresetReference` | require · `import()` · `from` · bare `import` 로 `@axis-ds/tokens/tailwind` 참조를 찾음(주석 제외) | 참조만 봄 |
| 같은 파일 `:1446-1476` `checkTailwindSetup` 의 Tailwind 3 루프 | `:1450` 참조가 있으면 `:1453` 조건을 보고, 아니면 `:1475` PASS | `:1453` `isCommonJsConfig(file, code) && hasBareCjsPresetRequire(code)` 가 아니면 tokens 를 전혀 보지 않음 |
| 같은 파일 `:1172-1174` `isCommonJsConfig` | `.cjs` 이거나 `module.exports` 가 있으면 CJS | ESM · `.ts` 는 여기서 빠짐 |
| 같은 파일 `:1150-1166` `hasBareCjsPresetRequire` | `.default` 없는 require 만 참 | CJS `.default` 도 여기서 빠짐 |
| 같은 파일 `:1194-1220` `packageVersionGate` | 설치본 버전 → 선언 하한 → `unknown`. 선언 하한이 1.7.0 이상이면 설치 여부와 상관없이 `ok` | CJS bare 의 A-none · R-none 이 PASS 인 이유(선언 `^1.8.2` 로 `ok`) |
| `packages/axis-registry-core/src/project.ts:702-723` `tokensCssResolution` | globals.css tokens 게이트(WI-0097 2부)의 해석 상태. `app` · `pnp-root-only` · `installed` · `not-installed`(root · none) | Tailwind 3 preset 에는 쓰이지 않음 |

## 2. 고칠 지점

| 파일:줄 | 변경 |
|---|---|
| `tailwind-core.ts:1450` 직후(`:1452` 의 `code` 계산 다음) | `tokensCssResolution(baseDir, pkg)` 를 불러 `pnp-root-only` · `not-installed` 면 WARN 을 돌려줌(prd 1.4 표 1 ~ 3번). `app` · `installed` 면 아래 종전 흐름으로 감(4번) |
| 같은 자리 | 문구 함수 1개(이름은 구현 때 확정). 설치 안내 구절은 `tokensInstallPhrase`(`:698`)를 재사용, PnP 는 `PNP_ROOT_ONLY_NOTE`. 범위는 `^1.7.0`(추가 결정 Q61a. 첫 발행 1.1.0(npm 레지스트리 exports) · 1.6.2 · 1.8.2(설치본)가 `./tailwind` 를 내보내는 것을 확인했고, CommonJS bare 로 바꿔도 다시 WARN 이 나지 않는 하한을 골랐어요) |
| `:1453-1473` 종전 CJS bare 버전 게이트 | 그대로 둠(Q64). 새 게이트 뒤라 U-none CJS bare 의 「버전을 확인하지 못했습니다(설치본 · 선언 없음)」 갈래는 닿지 않음(Q65). PnP 루트 전용 갈래(`:1455-1462`)도 새 게이트가 먼저 잡음. 문구 바이트를 지금과 같게 둘지(CJS bare 의 PnP 루트 전용) 구현 때 testplan 3.2 로 확인 |
| `tailwind-core.ts:34-35` 머리 주석, `:1381-1385` docstring, `:1168-1170` `isCommonJsConfig` 주석 | 「Tailwind 3 preset 은 CommonJS 형태 + 설치본 tokens 버전으로 판정」을 「모든 모양에서 tokens 해석 상태, CJS bare 는 버전도」로 넓힘. 범위를 바꾸는 커밋에서 같이 고침 |
| `packages/axis-cli/README.md:110-111` | Tailwind 3 tailwind.config 항목 서술에 해석 게이트 한 문장 |
| `.changeset/*.md` | `@axis-ds/cli` patch + `@axis-ds/mcp` patch(registry-core 규칙, `pnpm check-changeset-mcp-tokens` 로 확인). tokens 는 올리지 않음 |

mcp 쪽 코드 변경은 없어요(`tools/template.ts:412` 가 같은 함수를 번들). cli `template-check.ts:41` 도 그대로예요.

## 3. 구현 단계

1. 착수 게이트(Q69): Yarn 4 PnP 실설치 + 루트 전용 tokens 로 ESM `.mjs` · `.ts` 실빌드 1회씩. rc · 오류 문구를 testplan 3.3 에 적어요. rc 0 이면 prd 1.4 표 1번을 빼고 Master 에 보고해요
2. HEAD 기준선: 빌드 사본(cli `index.js` · mcp `index.js` sha256 앞 16자)과 파일별 테스트 통과 수를 고정해요. mcp vitest 는 빌드 뒤 실행해요
3. 새 테스트 먼저(빨강 확인): cli `template-check.test.ts` 에 describe 「WI-0101」, mcp `tools/template.test.ts` 에 대응 행. 기준선 소스에서 빨강이어야 해요
4. 2절 구현 → 새 테스트 초록
5. 4절 기존 테스트 처리(Q67)
6. fixture A/B: testplan 2절 63칸 + 3.2 의 새 칸을 기준선 사본 대 수정본으로 재고, 바뀐 칸이 prd 1.4 표 2 · 3번과 AC3 만인지 봐요
7. 변이(testplan 4절), 주석 · README grep 대조(AC10), `pnpm type-check` · `pnpm lint` · `pnpm build` · cli · mcp 테스트

## 4. 바뀐 기존 테스트 (2026-10-29 실행으로 확정)

판정 방법: 새 게이트를 넣은 소스로 cli · mcp 전체 테스트를 돌려 실패한 기존 테스트를 모았어요(cli 5 · mcp 1, 후보 표의 나머지는 실패하지 않아 불변). 처리는 사용자 결정 Q67 이에요.

| 위치(수정 전 줄) | 실패 원인 | 처리 |
|---|---|---|
| cli `template-check.test.ts:2261-2270` B3 `.ts` 3형태 | `tailwindcss` 만 선언 → 미선언 · 미설치 WARN | 보강: tokens `^1.8.2` 앱 선언(기대 불변) |
| cli 같은 파일 `:2289-2306` 「주석 안 · 다른 경로」의 `urlString` | 같음 | 보강: tokens 앱 선언(기대 불변) |
| cli 같은 파일 `:2308-2314` preset + 자체 `hsl(var())` | 같음 | 보강: tokens 앱 선언(기대 불변) |
| cli 같은 파일 `:3033-3043` WI-0072 「둘 다 없으면 확인하지 못했습니다」 | 미선언 · 미설치가 이제 해석 불가 WARN(Q65) | 기대 변경(새 문구) + 「확인하지 못했습니다」 갈래를 version 없는 설치본 stub 행으로 따로 지킴 |
| cli 같은 파일 `:4139-4167` WI-0086 AC3 의 tw3(루트 `^1.6.0` · 미설치 · bare) | 루트 선언 · 미설치가 이제 해석 불가 WARN(Q63) | 보강: 루트에 version 없는 설치본 stub(「선언 ^1.6.0」 근거를 그대로 봄, 기대 불변) |
| mcp `tools/template.test.ts:359-366` B3 `.mjs` | `tailwindcss` 만 선언 | 보강: tokens 앱 선언(기대 불변) |

- WI-0072 · WI-0086 의 두 보강은 「선언 하한」 · 「확인하지 못했습니다」 갈래를 version 필드 없는 설치본이라는 인위적 상태로만 밟게 됐어요(회귀 반박 검증 관찰). 실제 사용자 레이아웃(루트 선언 · 미설치)의 새 기대는 WI-0101 AC2 테스트가 덮어요.

## 5. 바꾸지 않는 곳

- Tailwind 4 분기(`:1389-1441`), globals.css 게이트(`checkGlobalsCss`), animation · content 판정
- `packageVersionGate` · `TOKENS_CJS_PRESET_FIXED_VERSION`(1.7.0)의 의미(Q64)
- `PRESET_REFERENCE` 정규식(Q66). 참조를 못 찾는 모양은 종전 「preset 없음」 WARN 이에요
- dependencies 항목(`dependencies-core.ts:122-127` 의 미설치 문구). 같은 레이아웃에서 두 항목이 함께 WARN 이 되는 것(R-none)은 Q28 때와 같아요
- theme add · init 의 Tailwind 3 preset 안내

## 6. 회귀 범위와 A/B 방법

- 바뀌면 안 되는 칸: A-* 21칸(Q62 권장안), R-inst* · U-inst* 28칸, 템플릿 5개(`apps/web/templates/*/files`, 앱 선언 ESM `.ts`) · `examples/nextjs-app`. 기준선 사본과 수정본의 check 출력(CLI 전체 텍스트 · MCP 텍스트)을 칸마다 `diff` 해서 0 이어야 해요
- 바뀌어야 하는 칸: R-none 7칸 · U-none 7칸(U-none CJS bare 2칸은 문구만). 바뀐 칸은 실빌드 rc 1 과 1:1 로 대응해야 해요(testplan 2절 표의 실빌드 열)
- 음성 대조: 수정 전 사본에서 같은 칸이 PASS 인 것을 먼저 다시 보여요(testplan 2절 값의 재현)
- 계측 대조군: 같은 스크립트가 A-inst162 CJS bare 에서 WARN 을 내는지(측정 자체가 동작하는지) 매번 같이 봐요
- 종료 코드: 모든 칸에서 기준선과 같아야 해요(새 판정은 WARN)
