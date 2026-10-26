# WI-0086: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #218 | 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w6cimpl/WI-0086/`(세션 scratchpad, 커밋하지 않음)
> 기준: worktree `fix/batch6c`(main 1168942 위). 수정 전 = main 1168942 의 빌드본(`turbo build` 산출물을 수정 전에 `node_modules/.wi86b/dist` 로 복사, cli `index.js` sha256 63241b5c…, mcp d2223e49…). 발행본 cli 1.7.1 · mcp 1.4.1 과 판정 경로가 같은 소스예요(1168942 는 1.7.1 · 1.4.1 Release 뒤 문서 커밋만 있음)

## 1. 재현 (수정 전, 음성 대조)

- 새 테스트를 수정 전 소스로 돌렸어요. `sc/mutants.py` 가 수정본 5파일(project.ts · tailwind-core.ts · dependencies-core.ts · add.ts · init.ts)을 메모리에 두고 `git show HEAD:<path>` 로 뽑은 원본(`orig/`)을 써 넣은 뒤 테스트하고, 수정본으로 되돌려 sha256 이 같음을 확인했어요(「수정본 복원 sha 일치: True」).
  - CLI(`-t WI-0086`, workspace-root · template-check · init · add) 24건 중 `18 failed | 6 passed`, MCP template 1건 `1 failed`.
  - 초록으로 남은 6건은 불변 단언이에요(`sc/mutants-m0.py` 로 통과 이름 확인): workspace-root 「찾은 설치본 dir 은 풀지 않음」, template-check 음성 대조(앱 선언 · 워크스페이스 밖) · AC6 pnpm 스토어(수정 전에도 링크 안 node_modules 로 같은 제안) · ENOENT, init 음성 대조, add 워크스페이스 밖 음성 대조. 이 불변 행이 고친 뒤에도 지켜지는지는 4절 변이 M1 · M3 이 판별해요.
- 실제 설치 픽스처의 수정 전 측정(2절 `before.json`)이 브리프 서술과 같아요: g1-none 3레이아웃 rc 0 · 항목 5개(content · animation 없음), noinst4/r-app 「tailwind.config 파일이 없습니다」 rc 1, 링크 L1 행이 실경로와 다름, init 이 루트 선언 clsx · tailwind-merge 를 앱에 추가(3/3), add 가 둘을 다시 안내.

## 2. 실제 설치 픽스처 신구 비교 (측정, 2026-10-26)

브리프 측정 디렉터리(`w6cbrief/WI-0086`, 실제 `npm install` · `pnpm install` 된 fx-npm · fx-pnpm · fx-pnpmhoisted, 미설치 fx-noinst3 · fx-noinst4, 설치 fx-inst4, MCP SDK `tools/`)를 `w6cimpl/WI-0086` 으로 `cp -a` 했어요. 반박 검토 major 를 따라 3레이아웃에 **절대 glob 앱 `c1-abs`**(앱이 ui-react 선언, content 에 루트 node_modules 실경로 절대 glob)를 더했어요(`sc/prep.sh` · `sc/mkabs.cjs`).

재현 방법:

1. `bash sc/prep.sh` (c1-abs 생성 · 링크 27개: 앱 링크 `links/<k>-<app>`, 루트 링크 `links/ws-<k>`)
2. `node sc/matrix.mjs <B> <cli js> <mcp js> <out.json>` 85행. 자식 env 는 PATH · 새 HOME · 새 XDG_CONFIG_HOME 만(주입 없음). 행: 3레이아웃 x 6앱 x {real(`--dir` 실경로) · L1(`--dir` 앱 링크) · L2(`--dir` 루트 링크/apps/앱) · cwd(링크로 cd, `--dir` 없음)} = 72, noinst3 · noinst4 · inst4 x {r-app, c-app} x {real, L1} = 12, ENOENT 1. cli `axis check` 판정 줄 · rc 와 MCP stdio `axis.check_project` 결과
3. `node sc/cmp2.mjs before.json after.json` → `cmp-after.txt`
4. `node sc/initrun.mjs <B> <cli js> <tag>` (앱 사본에서 `init -y` 전후 package.json 바이트 비교, 별도 사본에서 `add button -y` 안내 줄) → `init-before.txt` · `init-after.txt`

결과:

| 지표 | 수정 전 | 수정 후 |
|---|---|---|
| 계측 대조군(c1-appdecl real 3행에 content · animation 줄) | 3/3 | 3/3 |
| 링크 행(L1 · L2 · cwd)이 같은 앱 real 행과 같음(cli 판정 줄 · rc · mcp 줄) | 37/60 | **60/60** |
| real 행 전이(3절 표) | - | 12행, 표 밖 0 |
| cli 판정 줄 수 ≠ mcp 판정 줄 수인 행 | - | 0/85 |
| pnpm 기본 앱 선언 real 행(c1-appdecl · c1-appdecl-up) | - | 수정 전과 JSON 바이트 같음 |

- 수정 전 링크 행 23개 다름의 내역: L1 18행(3레이아웃 x 6앱, 루트 · 설치본을 못 찾아 「필수 의존성 누락: tailwindcss」 FAIL 등), **pnpm/c1-abs L2 1행**(루트 링크를 거친 절대 glob 거짓 FAIL), noinst3 · noinst4 · inst4 L1 4행.
- 최종 빌드(turbo build --force 뒤)로 다시 돌린 `after.json` 의 비교 결과가 첫 빌드 `after1.json` 과 같아요(cmp 출력 diff 0). init 도 `init-after.txt` · `init-after2.txt` diff 0.

## 3. 전이 표 (측정, real 행 · 안내)

### 3.1 axis check · axis.check_project (12행)

| # | 행 | 수정 전 | 수정 후 | rc |
|---|---|---|---|---|
| T1 | npm · pnpm · pnpmhoisted / g1-none(루트 ui-react · animate, content `./app` 만, plugins 있음) | 항목 없음 | `tailwind.content` FAIL `"../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` + 상위 경로 안내, `animation` PASS | 0→1 |
| T2 | 같은 3레이아웃 / g1-up(content 에 상위 경로 있음) | 항목 없음 | content PASS · animation PASS | 0 그대로 |
| T3 | 같은 3레이아웃 / g1-noanim(plugins 없음) | 항목 없음 | content FAIL(T1 과 같은 제안) · animation WARN 「(@axis-ds/ui-react 선언, tailwind.config.js plugins 에 없음)」 | 0→1 |
| T4 | noinst3/r-app(루트 tailwindcss ^3.4.0 · tokens ^1.6.0 · ui-react · animate, 미설치) | preset 게이트 「설치본 · 선언 없음」 WARN | preset 게이트 「선언 ^1.6.0 에서는 …」 WARN, content FAIL `"./node_modules/…"`(미설치라 종전 표본), animation WARN 「미설치(선언만 있음)」 | 0→1 |
| T5 | noinst4/r-app(루트 tailwindcss ^4.1.0 · tokens · ui-react ^1.3.0, 미설치) | 「tailwind.config 파일이 없습니다」 FAIL | Tailwind 4 분기: 컴포넌트 스캔 경로 WARN + 「1.4.0 이상 필요: @axis-ds/tokens ^1.3.0 · @axis-ds/ui-react ^1.3.0」, animation WARN(tw-animate-css) | **1→0** |
| T6 | inst4/r-app(루트 Tailwind 4 설치, ui-react · tw-animate-css 선언, CSS import 없음) | tailwind.config PASS, animation 없음 | tailwind.config WARN 「컴포넌트 스캔 경로(tailwind.css)가 없습니다」, animation WARN | 0 그대로 |

- 전이 0(바이트 같음): c1-appdecl · c1-appdecl-up · c1-abs(3레이아웃, 앱 선언 대조), noinst3 · noinst4 · inst4 의 c-app(앱 선언 대조), ENOENT 행. `dependencies` 항목 문구는 모든 행에서 그대로예요(`@axis-ds/*` 설치 확인 대상은 앱 선언만, D3).
- 링크 행(L1 · L2 · cwd)은 각 앱의 real 행과 같으므로 위 표가 링크 행의 수정 후 값이기도 해요. 수정 전 링크 행의 결함(23행)은 2절.

### 3.2 axis init · axis add (initrun, 10앱)

| # | 행 | 수정 전 | 수정 후 |
|---|---|---|---|
| I1 | npm · pnpm · pnpmhoisted / g2-init(루트 clsx · tailwind-merge, 앱은 tokens 만) | init 「✓ package.json dependencies 에 추가: clsx@^2.1.1, tailwind-merge@^2.6.0」, package.json 바뀜 | 「✓ utils.ts 의존성이 package.json 에 이미 있습니다(버전 유지): clsx (^2.1.1), tailwind-merge (^2.6.0) (워크스페이스 루트에 선언: clsx, tailwind-merge)」, **바이트 불변** |
| I2 | 같은 3앱의 add button | `… @radix-ui/react-slot class-variance-authority "clsx@^2.1.1" "tailwind-merge@^2.6.0"` | `… @radix-ui/react-slot class-variance-authority` |
| I3 | noinst4/r-app(루트 Tailwind 4 미설치, tailwind-merge ^3.0.0) | 범위 기준 「tailwindcss 를 찾지 못해 기본값(Tailwind 3)」으로 앱에 `tailwind-merge@^2.6.0` 추가 | 「이미 있습니다 … tailwind-merge (^3.0.0) (워크스페이스 루트에 선언 …)」, 바이트 불변. add 안내에서 clsx · tailwind-merge 빠짐 |
| I4 | inst4/r-app(루트 Tailwind 4 설치) | 앱에 `tailwind-merge@^3.4.0` 추가, add 안내에 둘 포함 | 바이트 불변, add 안내에서 빠짐 |
| I5 | noinst4/r-app 의 Tailwind 4 안내 | (Tailwind 3 로 보아 해당 없음) | 첫 구현(0ad6d5e)에서는 「@axis-ds/tokens 설치: pnpm add "@axis-ds/tokens@^1.4.0"」 줄이 새로 나왔어요(init.ts 294 가 앱 선언만 봄). 검토 후속에서 281 · 294 를 `declaredDependency` 로 바꿔 이 줄이 나오지 않고, 루트 선언 ui-react 의 `@import "@axis-ds/ui-react/tailwind.css";` 줄이 나와요(단위 테스트 「Tailwind 4 안내: 루트에 tokens · ui-react 선언이면 …」, 수정 전 소스에서 빨강) |
| I6 | 루트에 tailwindcss ^4.1.0 만(미설치, tailwind-merge 없음) | Tailwind 3 판정이라 앱에 `tailwind-merge@^2.6.0` 추가 | Tailwind 4 판정이라 앱에 `tailwind-merge@^3.4.0` 추가(앱에 쓰는 값의 전이). 단위 테스트 「루트에 tailwindcss ^4.1.0 만 선언(미설치)」, 변이 V4(detectTailwind 선언 폴백만 앱)에서 빨강 |

- 전이 0: c2-init-appdecl(3레이아웃) · noinst4 · inst4 의 c-app(앱 선언 대조, 종전 「이미 있습니다(버전 유지)」).

### 3.3 공용 코어를 지나 함께 바뀌는 호출지

| # | 행 | 수정 전 | 수정 후 |
|---|---|---|---|
| TA1 | `axis theme add`: 루트(workspaces)에 tailwindcss ^4.1.0 · ui-react 선언(미설치), 앱은 tokens 만, globals.css `@import "tailwindcss";` | 전역 CSS 에 `@import "@axis-ds/tokens/css";` · `@import "@axis-ds/tokens/css/shadcn";` · 브랜드 import 를 씀(tailwind4=false) | `@import "@axis-ds/tokens/css/tailwind4";` · 브랜드 import 를 씀(tailwind4=true). 앱 package.json 은 쓰지 않음(tokens 앱 선언). 루트 선언 ui-react 의 `tailwind.css` 줄은 넣지 않음(theme-add 356 이 앱 선언만 봄, WI-0087) |
| TA2 | TA1 과 같은데 상위가 워크스페이스가 아님(음성 대조) | Tailwind 3 두 줄 | 같음(전이 0) |

- 측정: 검토 지적의 vite-node 재현(HEAD 와 detectTailwind 선언 판정만 되돌린 변이)과 같은 결과를 단위 테스트 「WI-0086: 루트에만 tailwindcss ^4.1.0(미설치) → 전역 CSS 에 tailwind4 진입점 …」로 고정했어요. 같은 변이(V4)에서 이 테스트가 빨개지고, 원복 뒤 tailwind-core.ts sha256 d56fe2c4… 가 같아요.
- 방향 판단: Tailwind 4 프로젝트에 Tailwind 3 진입점(`css` · `shadcn`)을 넣던 쪽이 틀린 동작이라 전이를 막지 않고 기록해요(changeset · release-notes). 막으려면 theme add 만 앱 선언 판정을 따로 두어야 해서 check 와 다시 갈라져요.
- `axis template apply` 경고(template-apply 32), cli · mcp `brand-core.ts:534` 의 theme 게이트(`packageVersionGate`)도 같은 코어 함수를 불러요. theme 게이트는 단위 테스트로 고정(「brand-core theme 게이트」), template apply 경고는 미측정이에요.
- `brand-core.ts` 사본 두 개는 고치지 않았어요(시그니처 불변, U1 바이트 동일 규칙 유지).

## 4. 단위 테스트

| 파일 | 건수 | 내용 |
|---|---|---|
| `packages/axis-cli/src/workspace-root.test.ts` | +6 | declaredDependency 출처 · 음성 대조(워크스페이스 밖 · .git · 앱이 곧 루트), resolveBaseDir(L1 · L2 · 찾은 dir 은 풀지 않음 · ENOENT 폴백). `tree()` 가 실경로를 돌려주게(macOS 등 tmpdir 링크 대비) |
| `packages/axis-cli/src/template/template-check.test.ts` | +11 | AC1 npm · pnpm, AC2 TW3 · TW4, AC3, brand theme 게이트, 음성 대조, AC5 npm · pnpm(g1-none · g1-up · c1-appdecl · **c1-abs 절대 glob**), AC6 pnpm 스토어, ENOENT |
| `packages/axis-cli/src/init/init.test.ts` | +7 | 루트 선언 npm · pnpm 바이트 불변 · 출처, 루트 Tailwind 4 미설치 범위, 일부만 루트, 음성 대조. 검토 후속 +2: I6 루트 tailwindcss ^4 만(tailwind-merge ^3.4.0), I5 Tailwind 4 안내의 tokens · 컴포넌트 줄(워크스페이스 밖 · baseDir 없음 음성 대조) |
| `packages/axis-cli/src/theme/theme-add.test.ts` | +1 | 검토 후속: TA1 · TA2 |
| `packages/axis-cli/src/add/add.test.ts` | +2 | 루트 선언 제외 · 앱 package.json 불변, 워크스페이스 밖 음성 대조 |
| `packages/axis-mcp/src/tools/template.test.ts` | +1 | check_project 루트 선언 앱 content · animation, 링크 targetDir 같은 결과 |

변이(`sc/mutants.py`, 각각 넣고 WI-0086 테스트만 실행 → 수정본 복원 sha 같음):

| 변이 | 내용 | cli 빨강 | mcp 빨강 |
|---|---|---|---|
| M0 | 수정 전 소스(HEAD 5파일) | 18 | 1 |
| V1 | content 대상만 앱 선언 | 4 | 1 |
| V2 | animation 의 tailwindcss-animate 선언만 앱 | 1 | 1 |
| V3 | animation 의 ui-react 사용 판정만 앱 | 2 | 1 |
| V4 | detectTailwind 선언 폴백만 앱 | 2 | 0 |
| V5 | init utils 판정만 앱 | 4 | 0 |
| V6 | add 의존성 안내만 앱 | 1 | 0 |
| V7 | packageVersionGate(preset · theme 게이트)만 앱 | 2 | 0 |
| V8 | axisPackagesBelowTailwind4 만 앱 | 1 | 0 |
| V9 | Tailwind 4 컴포넌트 tailwind.css 판정만 앱 | 1 | 0 |
| M1 | 탐색 시작점만 실경로(tailwind-core 진입부 · relative · covers 는 입력 경로, 브리프 M1) | 3 | 1 |
| M2 | contentGlobCovers 기준만 입력 경로(반박 검토의 M2 구멍) | 2(AC5 c1-abs) | 0 |
| R1 | (검토 후속) contentGlobCovers 진입부의 resolveBaseDir 만 `resolve` 로(다른 진입부는 실경로 유지) | 첫 구현에서는 0(동치 변이, 내부 호출자가 이미 실경로를 넘김). 단위 테스트 「링크 baseDir 의 절대 glob」 추가 뒤 1 | 0 |
| V4' | (검토 후속) detectTailwind 선언 폴백만 앱, 새 테스트 포함 | 4(TA1 · I3 · I5 · I6) | - |
| I0 | (검토 후속) init 281 · 294 를 앱 선언만으로(수정 전 소스) | 1(I5 테스트) | - |
| M3 | 찾은 설치본 dir 까지 실경로(스토어 경로 누출, 브리프 M3) | 4 | 0 |

## 5. 게이트 (측정, 2026-10-26, 커밋 0ad6d5e 위)

| 게이트 | 결과 |
|---|---|
| `turbo run lint --force` | rc 0, 7/7, Cached 0 |
| `turbo run type-check --force` | rc 0, 11/11, Cached 0 |
| `turbo run build --force` | rc 0, 8/8, Cached 0. 생성물 `apps/web/public/templates/*.json` 5개 updatedAt 만 바뀌어 되돌림 |
| `turbo run test --force` | rc 0, 7/7, Cached 0. cli 843 · mcp 170 · ui-react 194 · agentic-ui 148 · theme 47 |
| check-token-refs · check-contrast-pairs · check-types-versions | rc 0 · 0 · 0 |
| check-changeset-mcp-tokens | rc 0. 「비교 기준 1168942c6119 · 바뀐 파일 12개 · packages/axis-registry-core/ 4개, 통과(registry-core → cli · mcp)」 (registry-core N=4 > 0 으로 실제 판정이 돔) |
| check-library-links | rc 0, node --test pass 28 · fail 0 |
| build:registry · test:registry | rc 0 · rc 0(pass 45 · fail 0). 생성물 `r/index.json` · `registry.json` version 1.8.1 → 1.5.0 으로 되돌림 |
| check-licenses · pack-smoke · cli-smoke · registry-install-smoke | rc 0 · 0(「pack-install-smoke OK」) · 0(「[cli-smoke] OK」) · 0(「[g2] 5/5 통과」) |

### 5.1 검토 후속 재실행 (2026-10-26, 커밋 f31d31e 위 수정본)

| 게이트 | 결과 |
|---|---|
| `turbo run lint --force` · `type-check --force` | rc 0 · 7/7 Cached 0, rc 0 · 11/11 Cached 0 |
| `turbo run build --force` | rc 0, 8/8 Cached 0. templates 5개 updatedAt 만 바뀌어(그 밖 diff 0줄) 되돌림 |
| `turbo run test --force` | rc 0, 7/7 Cached 0. cli 873(869 + 검토 후속 4) · mcp 181 · ui-react 194 · agentic-ui 148 · theme 47 |
| check-token-refs · check-contrast-pairs · check-types-versions | rc 0 · 0 · 0(「위반 0건」 · 「위반 0건」 · pass 8 fail 0) |
| check-changeset-mcp-tokens | rc 0. 「비교 기준 1168942c6119 · 바뀐 파일 43개 · packages/axis-registry-core/ 4개」, 통과(cli · mcp 각 changeset 2개) |
| check-library-links · build:registry · test:registry | rc 0(pass 28 fail 0) · rc 0(30개 항목, G1 통과) · rc 0(pass 45 fail 0). `r/index.json` · `registry.json` version 1.8.1 → 1.5.0 되돌림 |
| check-licenses · pack-smoke · cli-smoke · registry-install-smoke | rc 0 · 0(「퍼블리시 대상 6개」 · 「pack-install-smoke OK」) · 0(「[cli-smoke] OK」) · 0(「[g2] 5/5 통과」) |

## 6. 위험 · 잔여

| # | 내용 | 처리 |
|---|---|---|
| R1 | init.ts 213 · 281 · 294 는 앱 선언만 봐요. I5 처럼 루트 선언 tokens 를 다시 설치하라고 안내할 수 있어요 | 281 · 294 는 검토 후속에서 고침(Tailwind 4 판정 전이로 새로 생긴 줄). 213 애니메이션 안내는 Tailwind 3 에서도 종전부터 있던 앱 선언 전용 동작이라 후속(WI-0087 에 합칠지, 새 WI 인지 결정 필요) |
| R2 | 심링크 --dir 의 설치 안내 명령은 실경로 루트 lockfile 을 따라요(WI-0085 영역과 겹치는 행동 전이). 이번 매트릭스에서 L1 행의 미설치 안내(noinst 「→ pnpm install」)가 실경로와 같아짐을 확인 | WI-0085 커밋 뒤 합친 전이 표로 재측정(AC9) |
| R3 | Windows realpath(subst · 8.3 이름 · 대소문자) | 미검증. relative 가 다른 드라이브면 종전 `node_modules/<pkg>` 폴백(tailwind-core packageContentTarget) |
| R4 | 링크 경로로 쓴 절대 content glob 은 실경로 기준이라 덮음으로 보지 않음 | 추정, 측정 행 없음. 사용 예가 나오면 후속 |
| R5 | theme add · template apply 경로의 공용 코어 전이(3.3) | theme add 전역 CSS 쓰기 전이는 TA1 로 측정 · 테스트 고정, changeset · release-notes 에 기록. theme-add 356(컴포넌트 tailwind.css 목록) · 432-433(package.json 쓰기)은 WI-0087. template apply 경고는 미측정 |
