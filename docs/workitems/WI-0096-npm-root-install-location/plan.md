# WI-0096: npm 워크스페이스 루트 선언의 설치 위치 안내 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 기준: `main` e32275e

## 1. 판정 규칙

설치 구절은 「매니저가 npm 이고, 그 안내 대상에 워크스페이스 루트 선언이 하나라도 있으면 `워크스페이스 루트에서 npm install`, 아니면 설치 명령 그대로」예요(Q110 · Q111).

| 매니저(`detectInstallCommand`) | 안내 대상 | 구절 |
|---|---|---|
| npm | 루트 선언 하나 이상 | 「워크스페이스 루트에서 npm install」 |
| npm | 앱 선언만 | 「npm install」(종전) |
| pnpm · yarn | 무엇이든 | 「pnpm install」 · 「yarn install」(종전) |

루트 선언 여부는 각 호출지가 이미 가진 선언 출처를 그대로 써요. 새 판정(P1 · P2 경계 등)을 더하지 않아요.

## 2. 고친 지점

| 파일 · 함수 | 바꾼 것 | 루트 선언 여부의 출처 |
|---|---|---|
| registry-core `project.ts` `installCommandPhrase`(새 함수) | 위 표 그대로. `packageManagerOf` 로 npm 을 가림 | 인자 `rootDeclared` |
| registry-core `project.ts` `deferredComponentImportReason` | 코드 불변, JSDoc 에 「`installCommand` 자리에 설치 구절을 넘김」 한 줄 | - |
| registry-core `template/dependencies-core.ts` `checkDependencies` | 「선언됐지만 설치되지 않은 의존성」 묶음은 그 안에 루트 선언(`fromRoot`)이 있으면, 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다」 묶음은 항상 `installCommandPhrase(…, true)` | `declaredDependency` 의 `source` |
| cli `theme/index.ts` | 루트 선언 tokens 미설치 줄을 `rootInstallPhrase(plan.installCommand)`(새 지역 함수, 명령만 청록색), 컴포넌트 보류 안내에 `installCommandPhrase(plan.installCommand, true)` 를 넘김 | 그 줄은 `dep.declaredSource === "root"` 갈래 안, 보류 안내는 루트 선언만 모음(`deferredComponentImports`) |
| cli `init/init.ts` `animationGuideLine` | 선언 · 미설치 줄의 설치 명령 | `declared.source === "root"` |
| cli `init/init.ts` `reportDependencies` | add · present 두 갈래의 「설치는 실행하지 않았습니다. 설치: …」 | `plan.present` 의 `source === "root"` |
| `packages/axis-cli/README.md` | theme add · init · check 의 해당 서술(「1.7.8 다음 patch 부터」) | - |

공용 함수(registry-core)는 `installCommandPhrase` 하나를 더한 것이 전부예요. 기존 함수의 시그니처 · 동작은 바꾸지 않았어요. `tailwind-core.ts` 의 `tokensInstallPhrase` · `componentInstallPhrase` 는 `dependencyInstallGuide` 기반이라 그대로 두었어요(같은 문구를 내고, 바꾸면 Tailwind 4 · Tailwind 3 게이트의 회귀 범위가 넓어져요).

MCP 는 `axis.check_project` 가 같은 `checkDependencies` 를 불러 따로 고칠 곳이 없어요. MCP 에는 theme add · init 에 해당하는 도구가 없어요(`axis.apply_template` 은 WI-0088 범위).

## 3. 안내 문구 (Q110 · Q115)

| 위치 | 종전 | 수정 후(npm 루트 선언) |
|---|---|---|
| theme add 컴포넌트 보류 | `… 설치(npm install) 뒤 theme add 를 다시 실행하거나 직접 넣으세요.` | `… 설치(워크스페이스 루트에서 npm install) 뒤 …` |
| theme add tokens 루트 선언 미설치 | `    설치: npm install` | `    설치: 워크스페이스 루트에서 npm install` |
| init utils | `  설치는 실행하지 않았습니다. 설치: npm install` | `  설치는 실행하지 않았습니다. 설치: 워크스페이스 루트에서 npm install` |
| init 애니메이션 | `… 설치되지 않았습니다. npm install 뒤 전역 CSS 에 …` | `… 설치되지 않았습니다. 워크스페이스 루트에서 npm install 뒤 전역 CSS 에 …` |
| check · MCP dependencies | `… → npm install` | `… → 워크스페이스 루트에서 npm install` |

## 4. 회귀 범위 · 바뀐 기존 테스트

기존 테스트 가운데 종전 npm 문구를 고정하던 4건의 기대값을 바꿨어요(모두 npm 루트 선언 · 미설치 행).

| 파일 | 테스트 | 바꾼 기대 |
|---|---|---|
| cli `src/theme/theme-add.test.ts` | WI-0087 「루트 선언 · tokens 미설치 → 루트 문구 다음에 설치 명령 줄 …」 | `toContain("설치: npm install")` → `toBe("    설치: 워크스페이스 루트에서 npm install")` |
| cli `src/theme/theme-commands.test.ts` | WI-0093 「theme add B2 · B3 …」의 「npm 루트 선언 · 미설치(종전 그대로)」 행 | `    설치: npm install` → `    설치: 워크스페이스 루트에서 npm install`, 행 이름을 「(WI-0096)」로 |
| cli `src/template/template-check.test.ts` | WI-0094 「루트 전용 · 미설치 → WARN …」 | `→ npm install` → `→ 워크스페이스 루트에서 npm install` |
| mcp `src/tools/template.test.ts` | WI-0094 「npm 워크스페이스 루트 전용 · 미설치 @axis-ds → WARN 루트 문구 · 출처 표시」 | 같음 |

새 테스트: cli `src/wi-0096-root-install.test.ts`(9건), mcp `src/tools/template.test.ts` 의 describe 「WI-0096」(2건). 행 구성은 testplan 3절이에요.

## 5. 단계 (실행 기록)

1. 착수 측정: npm 네 버전 · pnpm · yarn 1 설치 위치(testplan 2.1), main 빌드로 세 명령 출력 18개(2.2).
2. 공용 헬퍼 · 호출부 수정, 기존 테스트 4건 기대 갱신, 새 테스트 11건.
3. 음성 대조: 호출부 3파일을 main 으로 되돌려 새 · 갱신 테스트 실행(헬퍼는 남김, 4절), 패치 sha256 대조로 복원.
4. 수정본으로 출력 18개 재수집 · diff, 실경로 스모크(2.4).
5. 패키지별 type-check · lint · test, `pnpm check-changeset-mcp-tokens`(5절).
