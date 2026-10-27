# WI-0093: 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md)

## 1. 공용 헬퍼 (registry-core `project.ts`, Q14)

기존 함수 본문(`isPnpProject` · `declaredDependency` 등)은 바꾸지 않고 새 함수만 더해요(같은 파일을 고치는 PR-A 와 hunk 가 겹치지 않게).

| 이름 | 내용 |
|---|---|
| `APP_LOCKFILES` | cli `theme-add.ts` 모듈 상수를 옮김(5종, bun 포함) |
| `hasAppLockfile(baseDir)` | 앱 디렉터리 자체에 lockfile 이 있는지(P2) |
| `rootDeclarationsAllowed(baseDir, pkg)` | `pkg` 있음 · PnP 아님 · 앱 lockfile 없음(P1 · P2). theme add 가 이것을 씀 |
| `DependencyInstallGuide` | `kind`(`add` · `install` · `install-at-root` · `pnp`) · `source` · `range` · `installCommand` · `addCommand` |
| `dependencyInstallGuide(baseDir, name, range)` | 앱 package.json 을 읽어 1.3 표의 갈래를 고름. 매니저는 `detectInstallCommand`, npm 루트 선언이면 `install-at-root` |

판정 순서: package.json 없음 → `add` / PnP → 앱 선언이면 `pnp`, 아니면 `add`(P1) / 앱 선언 → `install`(app) / P2 → `add` / 루트 선언 → npm 이면 `install-at-root`, 아니면 `install`(root) / 없음 → `add`.

## 2. cli

- `theme/index.ts`: `tokensInstallGuide(baseDir)` 추가(`tokensInstallCommand` 는 호환으로 둠). `tokensStatusGuide` 세 번째 인자가 문자열(종전 호출, `add` 로 봄) 또는 guide. list · info 등록부가 guide 를 넘김. `ROOT_TOKENS_UPGRADE_GUIDE`(DEC-8 문구) · `tokensPnpMessage` 추가.
- `renderThemeAdd`(Q17): 앱 present + `not-installed` → 설치 줄, 루트 present + `not-built` → 재설치 줄.
- 추가 결정(B1 · B2 · B3): `ThemeAddPlan` 에 `tokensGuide`(`dependencyInstallGuide(baseDir, TOKENS_PACKAGE, TOKENS_DEPENDENCY_RANGE)`)를 더해요. `renderThemeAdd` 는
  - B1: `tokensGuide.kind === "pnp"` 이고 tokens 가 `ok` 가 아니면 앱 present 줄 다음에 `tokensPnpMessage` 한 줄, 설치 · 재설치 줄과 `dep.upgrade` 의 경고 · 업그레이드 줄을 내지 않아요.
  - B2 · B3: 빌드 전 재설치 줄은 루트 present · 앱 present 모두 `rebuildGuide(tokensGuide)`(theme list 의 `tokensStatusGuide` 와 같은 함수, `installPhrase` 로 npm 루트면 「워크스페이스 루트에서 npm install」).
  - 루트 present + 미설치 줄은 종전 `plan.installCommand` 그대로(WI-0096).
- `theme/theme-add.ts`: `APP_LOCKFILES` · P1 · P2 식을 `rootDeclarationsAllowed` 로 바꿈(동작 불변, WI-0087 P2 테스트 5종 · PnP 테스트가 그대로 초록).

## 3. mcp

- B4: `src/index-brand-wiring.test.ts` 가 `@modelcontextprotocol/sdk` 의 `McpServer` · `StdioServerTransport` 를 대역으로 바꾸고 `src/index.ts` 를 불러 등록된 `axis.list_brands` · `axis.get_brand` 처리기를 npm 루트 선언 · PnP 앱 선언 픽스처에 돌려요.
- `tools/brand.ts`: `tokensInstallGuideFor(targetDir)` 추가, `formatTokensStatusGuide` · `formatListBrandsResult` · `formatGetBrandResult` 가 문자열 또는 guide 를 받음(문장은 CLI 와 같고 명령은 백틱). `index.ts` 703 · 739 호출지가 guide 를 넘김. mcp dist 는 외부 export 가 없는 bin 이라 시그니처 호환은 문자열 허용으로만 지켜요.
- brand-core(cli · mcp 바이트 사본)는 바꾸지 않아요(사본 일치 테스트 그대로).

## 4. 테스트 · 측정

- cli `theme-commands.test.ts` WI-0093 describe 13건 + 추가 결정 2건(B1 · B2/B3), `theme-add.test.ts` WI-0087 음성 대조 1건 기대 변경(Q17 · DEC-1 재오픈).
- mcp `brand.test.ts` WI-0093 describe 10건(CLI 와 대조), `index-brand-wiring.test.ts` 2건(B4).
- 실매니저 측정 스크립트(scratchpad `trackB-pm/measure.sh`): 수정 전 발행본 1.7.5 · 수정본 dist 를 같은 레이아웃에 각각 실행.
- 변이 9종(scratchpad `trackB-mut.py`) + 추가 결정 변이 6종(`trackB-mut2.py` 4종 · MCP 등록부 2종).
