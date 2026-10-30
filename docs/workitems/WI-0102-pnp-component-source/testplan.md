# WI-0102: Plug'n'Play zip 안의 컴포넌트 tailwind.css 테스트 계획

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-30 | 상태: 착수 측정 · 구현 측정 완료(2026-10-30). 사용자 결정 Q120 ~ Q125 대기

## 1. fixture · 측정 명령

- 측정 앱(저장소 밖, scratchpad `w102/`): 루트 `package.json`(`workspaces: ["apps/*"]` · `packageManager: yarn@4.5.3`), `.yarnrc.yml`(`nodeLinker` · `enableGlobalCache: false` · `enableMirror: false` · `cacheFolder: <w102>/cache` · `enableTelemetry: false`), 빈 `yarn.lock`. 앱 `apps/web/package.json` 에 `@tailwindcss/cli` · `tailwindcss` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui`(npm 발행본 1.8.2) · `react` · `react-dom` 18.3.1
- 입력: `base.css` = `@import "tailwindcss";`, `u.css` = base + `@import "@axis-ds/ui-react/tailwind.css";`, `g.css` = base + agentic-ui 같은 줄
- 빌드: `cd apps/web; out=$(corepack yarn@<ver> tailwindcss -i <f>.css -o <f>.out.css 2>&1); rc=$?`(파이프 rc 가림 회피). 집계: 바이트(`stat -c %s`), `grep -c axis-button-bg-default`, `grep -o 'var(--axis-' | wc -l`
- postcss 경로: 앱에 `postcss@8.5.6` · `@tailwindcss/postcss@4.1.14` 를 더하고 `yarn node pc.cjs <in> <out>`(`postcss([tw({ base: cwd })])`)
- 계측 대조: `node -r ./.pnp.cjs -e 'require.resolve("@axis-ds/ui-react/tailwind.css")'` 로 해석 위치, 산출물 바이트 동일성은 `cmp`
- 전역 Yarn 캐시 · 미러는 쓰지 않았어요(`enableGlobalCache: false` · `enableMirror: false`, 캐시는 scratchpad 안)
- 환경: node v22.22.0, corepack yarn 4.5.3(일부 4.18.1), WSL2 Linux x64

## 2. 착수 측정 (원인)

### 2.1 Tailwind CLI 4.1.14 · Yarn 4.5.3

| # | 조건 | 앱 | base | u(ui-react) 바이트 · 클래스 · `var(--axis-` | g(agentic-ui) | 판정 |
|---|---|---|---|---|---|---|
| C1 | **양성 대조**: node-modules linker | c-nm | 4,455 · 0 · 0 | **47,858 · 2 · 125** | **31,530 · 2 · 86** | 클래스 생성됨. Issue 의 npm 설치본 값(47,858 B · 2건)과 같음 |
| C2 | 재현: PnP 앱 선언 | c-pnp | 4,455 · 0 · 0 | **4,455 · 0 · 0** | **4,455 · 0 · 0** | rc 0 인데 클래스 0. `u.out.css` 와 `base.out.css` 가 `cmp` 같음 |
| C3 | ① PnP + 루트 `dependenciesMeta` 로 두 패키지 unplug | c-unplug | 4,455 · 0 · 0 | **47,858 · 2 · 125** | **31,530 · 2 · 86** | C1 과 `cmp` 같음(u · g 둘 다). `.yarn/unplugged/@axis-ds-ui-react-virtual-…` · `@axis-ds-agentic-ui-virtual-…` 생김 |
| C4 | PnP + **앱** `package.json` 의 `dependenciesMeta`(루트 아님) 뒤 재설치 | c-unplug-app | - | 4,455 · 0 · 0 | 4,455 · 0 · 0 | install rc 0, `.yarn/unplugged` 의 `axis` 0개. Yarn 은 앱 쪽 설정을 따르지 않음 |
| C5 | ③ PnP + 앱 CSS 에 `@source "<require.resolve 로 얻은 zip 안 절대경로>/dist"` | c-pnp | - | 4,455 · 0 · 0 | - | zip 안 경로는 직접 줘도 스캔 안 됨 |
| C6 | ③ PnP + 앱 CSS 에 `@source "../../../cache/<zip>/node_modules/@axis-ds/ui-react/dist"`(import 없이) | c-pnp | - | 5,481 · 0 · 0 | - | AXIS 클래스 0. 일반 유틸리티 정의 몇 개가 늘었지만(원인 미조사) 판정과 무관 |
| C7 | 계측 대조: 같은 dist 를 압축 푼 실제 디렉터리를 `@source` 로(import 없이) | c-pnp | - | **47,858 · 2 · 125** | - | 스캐너는 실제 디렉터리면 정상 |
| C8 | 후보 B: 발행본 tgz 에 `"preferUnplugged": true` 만 더한 사본을 `file:` 로 | c-pu | 4,455 · 0 · 0 | **47,858 · 2 · 125** | **31,530 · 2 · 86** | 두 패키지가 unplugged 로 풀림 |
| C9 | C8 의 대조: 원본 tgz 를 같은 `file:` 로 | c-file | 4,455 · 0 · 0 | 4,455 · 0 · 0 | 4,455 · 0 · 0 | `file:` 설치 자체는 unplug 하지 않음 |

- 해석 위치(C2, 측정): `…/c-pnp/.yarn/__virtual__/@axis-ds-ui-react-virtual-96ae3e6711/2/cache/@axis-ds-ui-react-npm-1.8.2-7fbc49f90a-10c0.zip/node_modules/@axis-ds/ui-react/tailwind.css`
- 양성 대조 C1 이 성립하고 C3 · C7 · C8 이 같은 값이라, C2 · C4 · C5 · C6 · C9 의 0 은 계측 실패가 아니라 「zip 안이라 스캔되지 않음」으로 읽어요
- ② node-modules linker 는 C1 이에요(Issue 의 「npm 설치본」 값과 같은 바이트)

### 2.2 `@tailwindcss/postcss` 4.1.14 (Next.js 가 쓰는 경로)

| 조건 | base | u | g |
|---|---|---|---|
| node-modules(c-nm) | 5,853 · 0 | **48,230 · 2** | **31,530 · 2** |
| PnP(c-pnp) | 5,481 · 0 | **5,481 · 0** | **5,481 · 0** |
| PnP + 루트 unplug(c-unplug) | 5,853 · 0 | **48,230 · 2** | **31,530 · 2** |

- base 바이트 차이(5,853 · 5,481)는 앱 디렉터리 자동 스캔 대상 파일 차이로 추정해요(판정과 무관, 미조사)

### 2.3 다른 버전

| 조건 | 결과 |
|---|---|
| Tailwind 4.3.3 · node-modules(c-nm433) | u 45,262 · 2 · 125, g 30,779 · 2 · 86, base 4,614 |
| Tailwind 4.3.3 · Yarn 4.5.3 PnP(c-pnp433) | base · u · g 모두 **rc 1** 「Error: Some options passed to require() aren't supported by PnP yet (conditions)」(Tailwind CLI 와 Yarn 4.5.3 PnP 의 호환 문제, 이 WI 와 별개) |
| Tailwind 4.3.3 · Yarn 4.18.1 PnP(c-pnp-y418) | base · u · g 모두 rc 0 · **4,614 · 0 · 0**(최신 조합도 같은 문제) |

### 2.4 unplug 디스크 비용 (후보 B 부작용, 측정)

`.yarn/unplugged` 의 ui-react 820 KB · agentic-ui 564 KB(`du -sh`), 캐시 zip 은 382,282 B · 285,988 B.

## 3. 기대값 (권장안 Q120 (a) · Q122 (a) · Q125 (a))

| fixture | 모양 | 수정 전 | 수정 후 | AC |
|---|---|---|---|---|
| Z1 | PnP · 앱 선언 1.8.2 · unplugged 없음 · 줄 없음 | 「컴포넌트 스캔 경로(tailwind.css)가 없습니다 → @import …」 | 줄 없음 PnP 문구(plan 3절) | AC3 |
| Z2 | Z1 + 줄 | PASS | 줄 있음 PnP 문구 WARN | AC2 |
| Z3 | Z1 · Z2 + 범위에 맞는 unplugged 설치본 | B1 · PASS | 같음 | AC4 |
| Z4 | `^1.8.2` 선언 + unplugged 1.7.0 | PASS | WARN | AC5 |
| Z5 | 앱 `dependenciesMeta` 만, unplugged 없음 | PASS | WARN | AC5 |
| Z6 | `workspace:*` · `portal:` · `link:` 범위 | PASS · 종전 버전 WARN | 같음(zip 문구 없음) | AC5 |
| Z7 | `npm:` 별칭 · `file:` 범위 | 종전 버전 WARN | zip 문구 + 종전 버전 안내, unplugged 가 있으면 zip 문구 없음 | AC5 |
| Z8 | node-modules linker + 줄 | PASS | PASS | AC5 |
| Z9 | 그 패키지를 가리키는 `@source` 직접 | PASS | PASS | AC5 |
| Z10 | ui-react 만 unplugged, agentic-ui 는 zip | - | agentic-ui 만 알림(두 방향) | AC2 · AC3 |
| Z11 | zip · unplugged 두 앱의 `runCheck` fail 수 | - | 같음 | AC7 |
| 헬퍼 | `pnpComponentSourceHidden` 단위 | - | non-PnP false · zip true · 범위 안 unplugged false · 범위 밖 · 다른 이름 true | AC4 · AC5 |

Z1 ~ Z9 는 ui-react · agentic-ui 두 패키지에 같은 테스트를 돌려요. MCP 는 `template.test.ts` 「WI-0102」 하나(줄 없음 · 줄 있음 · unplugged 생긴 뒤 PASS)로 같은 문구를 봐요.

## 4. 구현 뒤 측정

### 4.1 테스트 수

| 패키지 | 기준(e32275e 테스트 파일, 코드만 바꾼 상태) | 수정 뒤 |
|---|---|---|
| cli 전체 | 21 파일 · 1166 건(1162 통과 · 4 실패, 실패는 plan 4절의 두 테스트 × 2패키지) | 21 파일 · **1187 통과**(+21: 패키지별 9 × 2 + Z10 · Z11 · 헬퍼) |
| mcp 전체 | 9 파일 · 240 건(추정: 수정 뒤 241 에서 새 테스트 1건을 뺀 값) | 9 파일 · **241 통과** |

### 4.2 실측 앱에 수정본 CLI(`packages/axis-cli/dist/index.js check --dir <앱>/apps/web`, 전역 CSS 는 tokens · ui-react · agentic-ui 세 줄)

| 앱 | 실빌드(2절) | 수정 전 check(e32275e 빌드) Tailwind 4 항목 | 수정 후 |
|---|---|---|---|
| c-pnp | 클래스 0 | **PASS**(측정) | **WARN** 두 패키지 줄 있음 PnP 문구(측정) |
| c-unplug | 클래스 생성 | PASS(추정, 같은 코드 경로) | PASS(측정) |
| c-nm | 클래스 생성 | PASS(추정) | PASS(측정) |
| c-unplug-app | 클래스 0 | PASS(추정) | WARN(측정) |
| c-pu(후보 B 사본) | 클래스 생성 | `file:` 범위 버전 확인 WARN(추정) | zip 문구 없음, `file:` 범위 버전 확인 WARN 만(측정) |

check 판정(zip 문구 유무)과 실빌드 결과가 5개 앱 모두 맞아요. 종료 코드는 다섯 앱 모두 `axis.config.json` 없음 FAIL 이 정해요(새 판정은 WARN 만).

## 5. 변이 테스트 (`w102/scripts/mutate.py` · `mutate-mcp.py`, 적용 → 테스트 → 백업본으로 원복 · 내용 대조)

| 변이 | cli `template-check.test.ts` 실패 수 |
|---|---|
| M1 `pnpComponentSourceHidden` 이 늘 `false`(수정 전 동작과 같음, 음성 대조) | **12** |
| M2 줄 있음 방향 제거 | 9 |
| M3 줄 없음 방향 제거 | 3 |
| M4 unplugged 를 무시(PnP 면 늘 `true`) | 6 |
| M5 `workspace:` · `portal:` · `link:` 제외 제거 | 2 |
| M6 범위를 읽지 못할 때 이름만 보기 제거 | 2 |
| M7 범위를 무시(모든 버전 인정) | 3 |
| M8 PnP 판정 제거(non-PnP 에도 적용) | 48 |

- mcp `template.test.ts` 는 M1 에서 1 실패(새 테스트)
- 8/8 빨강, 원복 뒤 백업본과 내용 같음(스크립트 assert)

## 6. 게이트

| 명령 | 결과 |
|---|---|
| `pnpm exec turbo run build type-check lint --filter=@axis-ds/cli --filter=@axis-ds/mcp --filter=@axis-ds/registry-core --force` | rc 0, 9 tasks, **Cached 0** |
| cli `npx vitest run` | rc 0, 21 파일 · 1187 통과 |
| mcp `npx vitest run` | rc 0, 9 파일 · 241 통과 |
| `pnpm check-changeset-mcp-tokens` | rc 0(registry-core 2파일 변경 → cli · mcp 함께 올림 통과, 자체 테스트 19/19) |

## 7. 남은 미측정

- `next build` · `@tailwindcss/vite` 경유 빌드
- `workspace:` 범위 PnP 실빌드(Z6 은 추정 근거)
- 레지스트리 발행본에서의 `preferUnplugged`(C8 은 `file:` 사본)
- `pnpUnpluggedFolder` · `enableGlobalCache: true` · `pnpMode: loose`
