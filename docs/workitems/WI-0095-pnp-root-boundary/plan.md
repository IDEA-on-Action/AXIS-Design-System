# WI-0095: Plug'n'Play 루트 선언 경계를 init · add 로 넓힘 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 기준: `main` e4d89ae | 상태: 권장안(Q150 ~ Q157)으로 구현 반영(2026-10-31), 사용자 확인 대기

## 1. 판정 규칙

모든 호출지가 registry-core `project.ts` 의 두 함수만 써요(check 와 같은 판정).

- `declaredDependency(baseDir, pkg, name, rootPkg?, { appOnlyInPnp: true })`: PnP(`isPnpProject`, `.git` 에서 멈춤)면 앱 선언만, 아니면 앱 다음 워크스페이스 루트.
- `pnpRootOnlyDependency(baseDir, pkg, name)`: PnP 이고 앱에는 없고 루트에만 있을 때 그 선언. 「미선언」과 「루트 전용이라 해석 불가」를 가르는 데만 써요.
- 문구는 `PNP_ROOT_ONLY_NOTE`(「워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다」).

## 2. 고친 파일 · 공용 함수

| 파일 · 함수 | 변경 |
|---|---|
| `packages/axis-registry-core/src/add/add.ts` `missingDependencies` | 선언 판정에 `appOnlyInPnp`(cli `axis add` · MCP `axis.install_component` 공용, Q156) |
| `packages/axis-registry-core/src/project.ts` `declaredDependency` | 주석만(적용 범위: check → check · init · add) |
| `packages/axis-cli/src/init/init.ts` `planUtilsDependencies` · `UtilsDependencyPlan.pnpRootOnly` | 선언 판정에 `appOnlyInPnp`, 루트 전용 이름을 `pnpRootOnly` 에 모음(Q151) |
| 같은 파일 `reportDependencies` | `add` 갈래에서 「<이름들> 는 <PNP_ROOT_ONLY_NOTE>」 회색 줄 |
| 같은 파일 `pnpRootOnlyTailwindLine`(새 export) · `runInit` | 루트 전용 tailwindcss 한 줄(노란색, utils 보고 뒤 · 애니메이션 앞, Q152) |
| 같은 파일 `tailwind4GuideLines` | 컴포넌트 · tokens 판정에 `appOnlyInPnp`, 루트 전용 컴포넌트는 「! <이름> 가 … → 앱 package.json 에 선언한 뒤 <줄>」, 루트 전용이 있으면 예시 줄 생략, tokens 설치 줄에 사유(Q153) |
| 같은 파일 `animationGuideLine` | 줄 판정 진입 조건에서 `pnpRootOnly` 제외를 지움(Q154). 사유 · 명령은 WI-0099 `tailwind4AnimationProblemLine` 그대로(`pnpRootOnly` 는 미선언 쪽 명령 `yarn add <이름>`) |
| `packages/axis-cli/README.md` · `packages/axis-mcp/README.md` | init utils · Tailwind 4 안내 · 애니메이션, add · install_component 의 PnP 서술 |

바꾸지 않은 호출지(Q150 · Q155): `detectTailwind`(init · theme add · add 범위 · template apply 경고), `axisPackagesBelowTailwind4`(1.4.0), theme add 의 `rootDeclarationsAllowed` · `componentCssResolution` · `inspectTailwindContent`, check 전부.

## 3. 종료 코드 · 쓰기

- 종료 코드: 바뀌지 않아요. 새 줄은 모두 안내이고, init 의 쓰기 실패 경로는 종전 그대로예요(측정 36칸 rc 같음).
- 쓰기: PnP 이고 clsx · tailwind-merge 가 루트에만 있는 앱에서 init 이 앱 package.json 의 dependencies 에 그 둘을 더해요(측정 R4 · U4 · R3). 그 밖의 레이아웃 · 명령은 쓴 파일 sha256 이 같아요.
- add 는 package.json 을 쓰지 않으므로 안내 명령 문자열만 바뀌어요.

## 4. 검증 순서

1. main 빌드 사본으로 9 fixture × 4 명령 + check 측정(testplan 2)
2. 구현 · 빌드 뒤 같은 측정, 차이 전수(testplan 3)
3. 스모크(안내대로 고친 뒤 check · 해석 · 빌드, testplan 3.3), MCP stdio 대조
4. 새 테스트 · 음성 대조 · 변이(testplan 4)
5. registry-core · cli · mcp type-check · lint · test(turbo `--force`) · `pnpm check-changeset-mcp-tokens`(testplan 5)
