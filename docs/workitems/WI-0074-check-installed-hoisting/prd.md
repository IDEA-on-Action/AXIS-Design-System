# WI-0074: check 의 기존 설치본 판독을 상위 디렉터리 탐색으로 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0074 | GitHub: #199 | 우선순위: P3 | 상태: Approved (2026-10-25 배치 6 결정: 브리프 권장안 일괄 채택, project-todo 「배치 6 결정」 줄이 정본)
> 기준: `main` 3b5ed0f (linked 1.8.0 · cli 1.6.2 · mcp 1.3.5 발행됨, 미발행 changeset 0) | 묶음: 배치 6 (WI-0078 → 0076 → **0074** → 0075 → 0077)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

- registry-core `template/tailwind-core.ts` 의 `detectTailwind` 는 `<baseDir>/node_modules/tailwindcss/package.json` 한 층만, `axisPackagesBelowTailwind4` 가 부르던 `installedVersion` 은 `<baseDir>/node_modules/<pkg>/package.json` 한 층만 읽었어요. 그래서 npm workspaces · pnpm `node-linker=hoisted` 처럼 설치본이 루트 `node_modules` 에만 있는 모노레포에서는 설치본을 못 찾고 앱 선언(`latest` · `^1.3.0` · 선언 없음)으로 떨어졌어요.
- 같은 check 안의 다른 설치본 판정(`packageVersionGate` · animation · dependencies)은 WI-0051 부터 `findInstalledPackage`(상위 탐색)를 써서, 한 번의 check 안에서 항목마다 설치본 기준이 달랐어요. WI-0051 PRD D4 에서 의도적으로 남긴 상태예요.
- 브리프 측정(발행본 cli 1.6.2 · mcp 1.3.5, 실제 설치 픽스처 4종 · 앱 20개 · 항목 70개): 70개 중 12개가 거짓 FAIL · WARN 이에요. 예: npm 워크스페이스의 `tailwindcss: "latest"` 앱은 `FAIL tailwind.config 파일이 없습니다` 로 `axis check` rc 1(pnpm 기본 격리 설치에서는 rc 0).
- check 밖 실해(발행본 측정): `axis init -y` 가 Tailwind 4 앱에 `tailwind-merge@^2.6.0`(Tailwind 3 범위)을 써 넣고, `axis theme add` 가 Tailwind 4 CSS 에 Tailwind 3 기본 CSS(`@axis-ds/tokens/css` · `css/shadcn`)를 넣었어요. 둘 다 rc 0 이라 실패가 성공처럼 보였어요.
- `tailwind-core.ts` 헤더 주석은 「`packages/axis-mcp/src/tools/tailwind-core.ts` 에 바이트 사본」이라고 적었지만 그 파일은 없어요(WI-0055 이후 cli 는 6줄 re-export, mcp 는 번들). 낡은 진술이에요.

### 1.2 결정 (2026-10-25 배치 6 결정)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 범위 A: `detectTailwind` · `installedVersion`(→ `axisPackagesBelowTailwind4`) 두 판독만 `findInstalledPackage` 로 옮겨요. content 표본 경로는 WI-0080(#209), lockfile 상위 탐색은 WI-0081(#210) 으로 분리 | 고칠 파일이 하나이고 12건 전이가 실측으로 확정돼요. 다른 항목의 판정을 섞으면 전이 표의 원인 구분이 흐려져요 |
| D2 | `isPnpProject` 가드를 넣어요(Plug'n'Play 면 설치본을 읽지 않고 선언으로) | `packageVersionGate` · dependencies 와 같은 규칙. 가드가 없으면 PnP 프로젝트 상위에 남은 node_modules 를 읽어 항목마다 기준이 다시 갈려요 |
| D3 | 공유 함수를 그대로 바꾸고 check 밖 호출지(init · theme add · template apply · axis add)의 전이를 testplan 에 표로 기록 | init 과 check 가 같은 함수 결과를 쓰는 기존 설계(init.ts 266행 주석)를 지켜요. 같은 원인이 init · theme add 의 rc 0 실해를 만들어요 |
| D4 | brand-core 의 자체 상위 탐색(`findTokensPackageJson`, cli · mcp 바이트 사본) 통합은 미뤄요 | 이미 상위 탐색이라 전이 0. 바이트 사본 두 곳을 건드리면 검증 범위만 넓어져요 |
| D5 | 탐색은 가장 가까운 설치본에서 멈춰요(Node 해석 방향). 가장 가까운 `package.json` 의 version 이 정확한 버전이 아니면 더 올라가지 않고 선언으로 가요 | 종전 한 층 판독과 같은 규칙(정확한 버전이 아니면 선언), `findInstalledPackage` 의 기존 동작 |

### 1.3 범위 밖

- 인접 결함(측정, 이번 변경으로 안 바뀜): ① 루트에만 `tailwindcss` 를 선언한 앱의 `dependencies` 는 여전히 `FAIL 필수 의존성 누락: tailwindcss` 라, 같은 화면에서 tailwind.config 는 「Tailwind 4」 PASS 와 모순돼요. ② npm 호이스팅 Tailwind 3 의 `tailwind.content` 가 실제 위치(`../../node_modules/...`)를 인정하지 않아요(WI-0080). ③ `detectInstallCommand` 가 lockfile 을 한 층만 봐서 npm 워크스페이스에 `pnpm` 명령을 안내해요(WI-0081). ①은 WI-0081 과 같은 「워크스페이스 루트 선언 인정」 축이라 그쪽 PRD 에서 함께 정해요(결정 필요 항목으로 결과에 남김).
- brand-core 통합(D4), linked 4패키지(변경 없음).

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | 호이스팅 모노레포에서 `detectTailwind` 가 루트 설치본으로 판정하고 tailwind.config 가 실제 major 의 규칙으로 판정돼요 | AC1 |
| FR-2 | `axisPackagesBelowTailwind4` 가 상위 설치본 version 으로 1.4.0 조건을 봐요(설치본 1.8.0 이면 안내 0, 1.3.0 이면 below 1) | AC2 |
| FR-3 | 가장 가까운 설치본이 앞서요(앱 3.4.19 가 루트 4.3.3 보다 우선) | AC3 |
| FR-4 | 설치본이 앱 디렉터리에 있는 구조(pnpm 기본 · 단일 프로젝트)는 판정이 바뀌지 않아요 | AC4 |
| FR-5 | Plug'n'Play 면 상위 node_modules 를 읽지 않고 선언으로 가요 | AC5 |
| FR-6 | MCP `axis.check_project` 가 CLI 와 같은 판정 · 문구예요 | AC6 |
| FR-7 | init 의 tailwind-merge 범위 · theme add 의 기본 CSS · template apply 의 major 경고가 상위 설치본을 따라요 | AC7 |
| FR-8 | 발행 뒤 발행본으로 같은 픽스처를 다시 재 12 전이 · 58 불변이 그대로예요 | AC8 |
| FR-9 | 낡은 진술 정리: `installedVersion` 제거, 헤더의 MCP 사본 주장 정정, WI-0051 D4 · WI-0044 testplan 서술 갱신 | AC9 |

### 2.1 AC

- **AC1**: hoisted 픽스처(루트 `node_modules/tailwindcss` 4.3.3, 앱 node_modules 없음, 앱 선언 `latest`)에서 `detectTailwind` 가 `{ major: 4, source: "installed", value: "4.3.3" }`, tailwind.config 가 `PASS Tailwind 4: ...`. 한 층 판독으로 되돌리는 변이에서 빨개져요.
- **AC2**: 앱 선언 `^1.3.0` · `latest` + 루트 tokens 1.8.0 이면 below 0건. 양성 대조로 루트 tokens 1.3.0 이면 `@axis-ds/tokens 설치본 1.3.0` below 1건.
- **AC3**: 앱 node_modules 에 tailwindcss 3.4.19, 루트 4.3.3 이면 major 3. 루트 우선 변이에서 빨개져요.
- **AC4**: 기존 cli · mcp 테스트 전부 초록, isolated · 단일 픽스처의 판정이 문구까지 같음. 실제 설치 픽스처 20개 앱에서 비호이스팅 항목 0 diff, 같은 비교기가 호이스팅 앱에서 12건 diff(계측 대조).
- **AC5**: `.pnp.cjs` + 상위 tailwindcss 4.3.3 이면 선언(`latest` → none, `^4.1.0` → declared). 가드 제거 변이에서 빨개져요.
- **AC6**: MCP 테스트에 호이스팅 케이스 3건이 실제로 실행되고(건수 확인), 수정 전 소스에서 3건 빨개져요.
- **AC7**: 루트 전용 Tailwind 4 앱에서 init 이 `tailwind-merge ^3.4.0`, theme add 가 `@axis-ds/tokens/css/tailwind4` 를 기본 CSS 로, template apply 가 Tailwind 3 템플릿에 major 경고. 수정 전 소스에서 빨개져요.
- **AC8**: 발행본 cli · mcp patch 를 새 HOME 으로 설치해 같은 픽스처를 다시 재요. 수집 항목 70 을 먼저 확인하고 12 전이 · 58 불변.
- **AC9**: registry-core src 에서 `installedVersion` grep 0건(양성 대조: 같은 파일에서 `findInstalledPackage` 1건 이상), 헤더에 MCP 사본 주장 0건, WI-0051 D4 · WI-0044 testplan:147 정정.

## 3. 릴리스

- `@axis-ds/cli` patch · `@axis-ds/mcp` patch(registry-core 는 private 이고 두 패키지가 번들). 판정이 바뀌지만 거짓 FAIL · WARN 을 실제 설치본 기준으로 바로잡는 버그 수정이에요. 배치 6 묶음 발행에서는 WI-0075(cli) · WI-0076(mcp minor)과 합쳐 cli 1.7.0 · mcp 1.4.0 예정(project-todo 결정 줄).
