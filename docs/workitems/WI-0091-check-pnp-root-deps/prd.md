# WI-0091: check 가 Yarn Plug'n'Play 에서 루트에만 선언한 패키지를 설치됨으로 판정 PRD

> 작성일: 2026-10-27 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0091 | GitHub: #234 | 우선순위: P3 | 상태: Approved (2026-10-27 사용자 결정 Q1 · Q2 · Q3 · Q5 · Q6 · Q7 · Q8)
> 기준: `main` ffbda57 (linked 1.8.2 · cli 1.7.5 · mcp 1.4.4 발행됨) 위 worktree 브랜치. 같은 PR 에 WI-0094(#237) · WI-0092(#235)를 묶어요(사용자 결정 Q4)
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정, Yarn 4.5.3 · 발행본 cli 1.7.5 · mcp 1.4.4)

공용 헬퍼 `declaredDependency`(registry-core `project.ts`)는 Plug'n'Play 를 보지 않아요. 그래서 PnP 에서는 「루트 선언 = 선언됨 = 설치됨」이 됐어요. PnP 의 앱 issuer 는 자기 `package.json` 에 없는 패키지를 해석하지 못해서, 루트에만 `tailwindcss` 를 선언한 앱은 postcss · Next 처럼 앱에서 require 하는 빌드가 실패하는데 check 는 PASS 였어요.

| fixture | 레이아웃 | 앱 issuer 해석 · 빌드 | 발행본 check |
|---|---|---|---|
| A | TW3, 루트 전용 선언 | 9/9 FAIL · 빌드 rc 1 | 9 pass / 0 warn / 0 fail, rc 0 |
| E | loose 모드, 루트 전용 | A 와 같음 | A 와 같음 |
| G | TW4, 루트 전용 | 해석 FAIL | 8 / 0 / 0, rc 0 |
| D | `pnpFallbackMode: all`, 루트 전용 | 앱이 해석함 | PASS(정답) |

또 `isPnpProject` 는 `.git` 에서 멈추지 않아서, 저장소 밖 상위에 빈 `.pnp.cjs` 가 남은 node-modules 프로젝트(refute-stray-1/outer/C)를 PnP 로 판정했어요(측정).

### 1.2 결정 (2026-10-27 사용자 결정)

| # | 결정 |
|---|---|
| Q1 | Yarn PnP 면 루트 선언을 인정하지 않고 앱 선언만 봐요(init P1 축). `pnpFallbackMode: all` 의 거짓 FAIL 가능성은 잔여 오차로 release-notes 에 적어요 |
| Q2 | 경계는 check 호출지에서만 켜요. `declaredDependency` 에 옵션(`appOnlyInPnp`)을 더하고 check 경로에서만 켜요. init(326 · 345 · 472) · theme add(396 · 475) · registry-core add(524) · template apply(56)는 이번에 고치지 않고 WI-0095 로 넘겨요 |
| Q3 | `isPnpProject` 가 `findWorkspaceRoot` 와 같게 `.git` 에서 탐색을 멈춰요(이번 수정의 전제) |
| Q5 | PnP 에서 필수 · 권장 의존성이 루트에만 있으면 미선언과 같은 심각도(필수 FAIL · 권장 WARN)로 내되, 「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」 전용 문구를 써요. 정답 기준은 앱 issuer 의 require 예요 |
| Q6 | `detectTailwind` 의 TW3/TW4 분기 선택에는 루트 선언을 계속 인정해요. 해석 불가는 dependencies 항목에서만 알려요 |
| Q7 | 버전 게이트(TW3 CJS preset 의 tokens 게이트 · brand.activation 의 theme 게이트)만 「앱에서 해석되지 않음」 전용 WARN 을 내요. 요구를 더하는 판정(TW4 B1 · content 대상 · animation 사용 판정 · 1.4.0 판정)은 현행 유지예요. 게이트가 돌지 않는 모양(ESM config · setBrand)의 공백은 잔여로 기록해요 |
| Q8 | 실제 PnP 레이아웃(루트 선언 · 앱 미선언)을 고정한 fixture 를 새로 둬요. 기존 빈 `.pnp.cjs` 표지 테스트는 새 규칙의 기대로 바꿔요 |

### 1.3 범위

- 포함: registry-core `project.ts`(`isPnpProject` 의 `.git` 경계, `declaredDependency` 옵션, `pnpRootOnlyDependency` · `PNP_ROOT_ONLY_NOTE`), `dependencies-core.ts`(필수 · 권장 PnP 판정), `tailwind-core.ts`(버전 게이트 옵션 · `unresolved`, tokens CJS 게이트 문구, animation 플러그인 선언의 PnP 판정), cli · mcp `brand-core.ts`(theme 게이트에 옵션), cli `template-check.ts` · mcp `template.ts`(brand.activation `unresolved` 문구)
- 제외: Q2 의 check 밖 호출지(WI-0095), `.pnp.cjs` 정적 파싱 · `pnpFallbackMode` 읽기(Q1), brand-core 의 PnP 설치본 해석(WI-0093 잔여), PnP 에서 globals.css tokens import 해석(WI-0097)

## 2. 수용 기준

- **AC1**: PnP 에서 루트에만 `tailwindcss` 가 있으면 dependencies FAIL 「필수 의존성 tailwindcss 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다 → 앱 package.json 에 선언하세요」, 종료 코드 1. 권장만 루트 전용이면 같은 문구의 WARN
- **AC2**: PnP 에서 CJS bare preset 의 `@axis-ds/tokens`, 마크업 `data-brand` + `ThemeProvider` 의 `@axis-ds/theme` 가 루트에만 있으면 「앱이 해석하지 못합니다(워크스페이스 루트 선언 <범위>)」 WARN. `packageVersionGate` 는 옵션이 없으면 종전 결과
- **AC3**: PnP 에서 TW3 플러그인 `tailwindcss-animate` 가 루트에만 있으면 animation WARN 사유가 전용 문구. ui-react 사용 판정은 루트 선언을 계속 인정
- **AC4**: Tailwind major 판정(`detectTailwind`)은 PnP 루트 선언으로도 TW4 분기(G)
- **AC5**: `isPnpProject` 는 같은 층에 `.pnp.cjs` 가 있으면 참, 표지 없이 `.git` 이 나오면 거짓. 상위 `.pnp.cjs` 가 있는 node-modules 저장소(refute-stray C)는 같은 레이아웃 대조군(C-nm-root)과 같은 출력
- **AC6**: 음성 대조: node-modules · npm · pnpm 의 루트 선언 인정, 앱 선언 PnP(B)는 바뀌지 않음. CLI · MCP 같은 문구
