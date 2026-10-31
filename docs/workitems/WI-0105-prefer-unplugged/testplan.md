# WI-0105: preferUnplugged 선언 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-11-01 | 상태: 측정 완료(2026-11-01)

## 1. fixture · 측정 명령

- tarball: 이 브랜치(71f0c62 + 이 WI 변경)에서 `pnpm turbo run build --force` 뒤 `packages/axis-ui-react` · `packages/axis-agentic-ui` 에서 `pnpm pack`. `workspace:*` 는 pack 이 `1.8.2` 로 바꿔요. 그 tarball 의 `version` 과 agentic-ui 의 `dependencies["@axis-ds/ui-react"]` 만 `1.8.3` 으로 고쳐 다시 묶었어요(`changeset version` 이 할 일의 시뮬레이션, `scripts/relabel.cjs`). `preferUnplugged` 는 하네스가 넣지 않고 소스에서 온 값이 있는지만 확인했어요(없으면 rc 1)
- 대조 tarball: npm 발행본 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/tokens` 1.8.2
- 이 브랜치 tarball 과 발행본 1.8.2 의 내용 차이(`diff -rq`): ui-react 는 `package.json` 과 `dist/command/index.d.{ts,mts}`(타입 선언만), agentic-ui 는 `package.json` 만. JS dist 는 같아요
- 로컬 레지스트리(`scripts/registry.cjs`, `127.0.0.1:48741`, `@axis-ds` 스코프만): packument 에서는 `preferUnplugged` 를 지우고 tarball 에만 둬요(보수적 조건). 나머지 패키지는 npmjs 에서 받아요
- **하네스 전제(실경로가 주지 않는 것)**: Yarn 은 `.yarnrc.yml` 에 `unsafeHttpWhitelist: [localhost]` 와 `npmScopes.axis-ds.npmRegistryServer: http://localhost:48741` 이 있어야 이 레지스트리를 써요. npm · pnpm 은 `.npmrc` 의 `@axis-ds:registry=http://localhost:48741/`. 실제 발행본은 npmjs HTTPS 라 이 설정이 필요 없어요
- Yarn 앱(`scripts/mkyarn.sh`): 루트 `package.json`(`workspaces: ["apps/*"]` · `packageManager: yarn@4.5.3`), `.yarnrc.yml`(`nodeLinker` · `enableGlobalCache: false` · `enableMirror: false` · 캐시는 scratchpad), 앱 `apps/web` 에 `@axis-ds/ui-react` · `@axis-ds/agentic-ui`(버전 고정) · `react` · `react-dom` 18.3.1 · `tailwindcss` · `@tailwindcss/cli` 4.1.14
- 입력: `base.css` = `@import "tailwindcss";`, `u.css` = base + `@import "@axis-ds/ui-react/tailwind.css";`, `g.css` = base + agentic-ui 같은 줄
- 빌드(`scripts/build.sh`): `out=$(corepack yarn tailwindcss -i <f>.css -o <f>.out.css 2>&1); rc=$?`. 집계: 바이트(`stat -c %s`), `grep -c axis-button-bg-default`, `grep -o 'var(--axis-' | wc -l`, `ls .yarn/unplugged | grep axis`
- 환경: node v22.22.0, corepack yarn 4.5.3, npm(node 22 동봉) · pnpm 9.15.4, WSL2 Linux x64
- 하네스는 브리프 측정(`run.fbUc/scripts`)을 재사용했고 포트만 48741 로 바꿨어요. 레지스트리는 PID 로 종료했어요(종료 뒤 `ss -ltn | grep -c 48741` = 0)

## 2. 실설치 측정

### 2.1 Yarn 4.5.3 · `@tailwindcss/cli` 4.1.14 (install rc 모두 0)

| # | 조건 | lock 버전 | base | u(ui-react) 바이트 · 클래스 · `var(--axis-` | g(agentic-ui) | `.yarn/unplugged` 의 axis | 판정 |
|---|---|---|---|---|---|---|---|
| V1 | **PnP + 이 브랜치 1.8.3** | 1.8.3 · 1.8.3 | 4,455 · 0 · 0 | **47,858 · 2 · 125** | **31,530 · 2 · 86** | 2개(`@axis-ds-ui-react-virtual-f160a2582d` · `@axis-ds-agentic-ui-virtual-50ce32ee8c`) | u · g 가 V3 와 `cmp` rc 0 |
| V2 | 음성 대조: PnP + 발행본 1.8.2 | 1.8.2 · 1.8.2 | 4,455 · 0 · 0 | 4,455 · 0 · 0 | 4,455 · 0 · 0 | 0개 | u 가 base 와 `cmp` rc 0(재현), V3 와 rc 1 |
| V3 | 양성 대조: node-modules + 1.8.3 | 1.8.3 | 4,455 · 0 · 0 | 47,858 · 2 · 125 | 31,530 · 2 · 86 | 0개 | 기준 |
| V4 | node-modules + 1.8.2 | 1.8.2 | 4,455 · 0 · 0 | 47,858 · 2 · 125 | 31,530 · 2 · 86 | 0개 | V3 와 `cmp` rc 0(산출물 불변) |
| V5 | opt-out: PnP + 1.8.3 + 루트 `dependenciesMeta` 두 패키지 `"unplugged": false` | 1.8.3 · 1.8.3 | 4,455 · 0 · 0 | 4,455 · 0 · 0 | 4,455 · 0 · 0 | 0개 | 사용자 설정이 필드보다 우선. u 가 base 와 `cmp` rc 0 |

- V1 의 unplugged 디렉터리 `package.json`: `@axis-ds/ui-react 1.8.3 preferUnplugged true` · `@axis-ds/agentic-ui 1.8.3 true`, `dist` 항목 38 · 23개
- 레지스트리 로그(`reg.log`): tarball 요청이 1.8.3 · 1.8.2 둘 다 기록돼 측정이 이 레지스트리를 거쳤어요
- 디스크: V1 `.yarn/unplugged` ui-react 820 KB · agentic-ui 564 KB(`du -sh`)

### 2.2 npm · pnpm (`npx tailwindcss`, install rc 모두 0)

| 매니저 | 버전 | 설치본 `preferUnplugged` | u | g | V3 와 `cmp` |
|---|---|---|---|---|---|
| npm | 1.8.3 | true | 47,858 · 2 | 31,530 · 2 | rc 0 · rc 0 |
| npm | 1.8.2 | undefined | 47,858 · 2 | 31,530 · 2 | rc 0 · rc 0 |
| pnpm 9.15.4 | 1.8.3 | true | 47,858 · 2 | 31,530 · 2 | rc 0 · rc 0 |
| pnpm 9.15.4 | 1.8.2 | - | 47,858 · 2 | 31,530 · 2 | rc 0 · rc 0 |

Yarn classic(1.x)은 이번에 다시 재지 않았어요(브리프의 시뮬레이션 tarball 측정에서 불변).

### 2.3 check 판정 (이 브랜치 빌드 `packages/axis-cli/dist/index.js check`, 전역 CSS = `u.css`)

| 앱 | ui-react PnP WARN(WI-0102 문구 「import 가 있지만 Plug'n'Play 에서 …」) |
|---|---|
| V1 PnP 1.8.3 | 없음(ui-react 줄은 통과, 남은 WARN 은 토큰 진입점 · agentic-ui 줄 없음 등 fixture 공통) |
| V2 PnP 1.8.2 | 있음 |
| V5 opt-out | 있음 |

check 종료 코드는 세 앱 모두 rc 1(fixture 에 components.json 등이 없어 공통 FAIL 1건). 판정 대상인 ui-react 줄만 갈려요. check 코드는 바꾸지 않았어요(D3).

## 3. pack-smoke 변이 A/B (`node scripts/pack-smoke.mjs`)

| # | 조건 | 신판 rc · 출력 | 구판(HEAD 71f0c62) rc |
|---|---|---|---|
| P0 | 현행 | **rc 0**, `· [@axis-ds/ui-react] @source CSS 1개(tailwind.css) · preferUnplugged true`, agentic-ui 같음 | - |
| P1 | ui-react `package.json` 에서 필드 줄 삭제 | **rc 1**, `✗ [@axis-ds/ui-react] tailwind.css 에 @source 가 있지만 package.json 의 preferUnplugged 가 true 가 아님 (값: undefined). Yarn Plug'n'Play 는 패키지를 .yarn/cache 의 zip 안에 두고 Tailwind 4 스캐너는 zip 안을 읽지 못해 컴포넌트 클래스가 생성되지 않음(WI-0105)` · `FAIL - 1건` | **rc 0**(같은 변이를 못 잡음) |
| P2 | agentic-ui 값을 문자열 `"true"` 로 | **rc 1**, 같은 문구 `(값: "true")` | - |
| P3 | 원복(백업 복사, sha256 `df3fe72a…` 변이 전후 같음) | **rc 0** | - |

- 양성 대조(관측 분기가 실제로 돈다): P0 에서 두 패키지가 「@source CSS 1개」 줄을 냈어요. 다른 4패키지는 배포 CSS 에 `@source` 가 없어 검사 대상이 아니에요(빌드 dist 실측: tokens CSS 4개 중 `@source` 0, theme · cli · mcp CSS 0개)
- 전체 `pnpm pack-smoke`(pack-install-smoke 포함): rc 0, `[pack-smoke] OK - 퍼블리시 대상 6개 패키지 전부 통과` · `[pack-install-smoke] OK`

## 4. 게이트

| 명령 | 결과 |
|---|---|
| `pnpm turbo run build --force` | rc 0, Tasks 8/8, Cached 0. `apps/web/public/templates/*.json` 6개가 updatedAt 만 바뀌어 되돌림. `public/r` 변화 없음 |
| `pnpm turbo run type-check --force` | rc 0, Tasks 11/11, Cached 0 |
| `pnpm turbo run lint --force` | rc 0, Tasks 7/7, Cached 0 |
| `pnpm check-changeset-mcp-tokens` | rc 0, `changeset 1개 · @axis-ds/tokens 올림 0개 · @axis-ds/mcp 올림 0개 · @axis-ds/cli 올림 0개`, 비교 기준 71f0c62f1009 · registry-core 0개, 단위 테스트 19/19 |
| `pnpm changeset status --verbose` | patch: `@axis-ds/ui-react 1.8.3` · `@axis-ds/agentic-ui 1.8.3` · `axis-nextjs-example 0.1.18`(private 예제, 의존 갱신. 선례 1296556 도 같음). minor · major 없음. tokens · theme · cli · mcp 없음 |

## 5. 남은 미측정

- Yarn classic(1.x) · `@tailwindcss/postcss` · Yarn 4.18.1 을 이 브랜치 tarball 로(2절)
- npm 발행본 1.8.3 실설치(발행 뒤)
