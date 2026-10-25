# WI-0074: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #199 | 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w6impl/WI-0074/`(세션 scratchpad, 커밋하지 않음)
> 기준: worktree `fix/batch6`(f844b68 위), 수정 전 소스 = 그 HEAD 의 registry-core src(브리프 sim-before 와 `diff -r` 동일)

## 1. 재현 (수정 전, 음성 대조)

- 새 테스트를 수정 전 소스로 실행: CLI 8건 중 `5 failed | 3 passed`(통과 3건은 단일 · 가까운 설치본 우선 · PnP, 모두 종전과 같아야 하는 불변 단언), MCP 3건 `3 failed`. CLI 환경 가드 1건은 그 뒤 추가해 9건.
- 실패 지점 예: hoisted a-twlatest tailwind.config(`FAIL tailwind.config 파일이 없습니다`), 양성 대조 below 의 `source: "declared"`(설치본을 못 읽음), init `plan.tailwind` 가 `{ source: "none" }`, theme add `css.tailwind4` false.

## 2. 실제 설치 픽스처 전후 비교 (측정)

브리프의 픽스처 4종(npm workspaces · pnpm 기본 · pnpm hoisted · 단일, 실제 `npm install` · `pnpm install`)과 앱 20개에서 check 항목 함수 5개(tailwind.config · globals.css · dependencies · tailwind.content · animation)를 esbuild 로 묶은 수정 전 · 후 registry-core 로 불렀어요(`scripts/sim.sh` · `compare.mjs`).

- 계측 대조: 수정 전 70개 중 60개가 브리프 sim-before(발행본 cli · mcp 출력과 70/70 일치로 보정된 값)와 바이트 같음. 나머지 10개(앱 2개 f-tw3content)는 브리프가 sim-before 를 잰 뒤(20:07:08) 그 앱의 `tailwind.config.ts` 를 고쳐(mtime 20:07:42) 생긴 차이로, 소스 차이가 아니에요(소스는 `diff -r` 동일). 전후 비교는 같은 픽스처 상태에서 했어요.
- 결과: 항목 70 → 70, **바뀐 항목 12 · 그대로 58**. 수정 후 결과는 브리프의 sim-after(같은 변경을 가정한 시뮬레이션)와 앱 20/20 일치.
- 빌드한 worktree `packages/axis-cli/dist` 의 `axis check` 와 `packages/axis-mcp/dist` stdio `axis.check_project` 출력에 수정 후 70개 항목이 문구까지 모두 있음(70 일치 / 0 불일치, 새 HOME · XDG).

| 앱 (픽스처) | 항목 | 전 | 후 |
|---|---|---|---|
| a-twlatest (npm · pnpm hoisted) | tailwind.config | FAIL 「tailwind.config 파일이 없습니다」 | PASS 「Tailwind 4: app/globals.css에 @import "tailwindcss" 와 AXIS 토큰 진입점이 있습니다」 (cli rc 1 → 0) |
| b-tokold (npm · pnpm hoisted) | tailwind.config | WARN 「... (1.4.0 이상 필요: @axis-ds/tokens ^1.3.0)」 | PASS |
| c-toklatest (npm · pnpm hoisted) | tailwind.config | WARN 「... (설치된 버전이 1.4.0 이상인지 확인하세요: @axis-ds/tokens latest)」 | PASS |
| d-rootonly (npm · pnpm · pnpm hoisted) | tailwind.config | FAIL 「tailwind.config 파일이 없습니다」 | PASS (rc 1 유지: dependencies FAIL 인접 결함) |
| h-rootonly-ui (npm) | tailwind.config | FAIL | WARN 「create-next-app 기본 정의 ... (body font-family: Arial)」 |
| h-rootonly-ui (npm) | globals.css | WARN (Arial) | PASS |
| h-rootonly-ui (npm) | animation | WARN 「tailwindcss-animate ... plugins」 | PASS 「app/globals.css에 애니메이션 플러그인이 있습니다」 |

전이 0(음성 대조): pnpm 기본의 a · b · c · e · f, 모든 e-tw3 · f-tw3content, 단일 프로젝트.

## 3. check 밖 호출지 전이

| 호출지 | 쓰는 함수 | 호이스팅 모노레포에서 종전 | 이제 | 확인 |
|---|---|---|---|---|
| `axis init` utils 의존성(`planUtilsDependencies`, init.ts 370 · 415) | `detectTailwind` → `selectUtilsDependencies` | 루트 전용 · `latest` Tailwind 4 앱에 `tailwind-merge@^2.6.0`(Tailwind 3 범위), 근거 「tailwindcss 를 찾지 못해 기본값」 | `^3.4.0`, 근거 「설치된 tailwindcss 4.3.3」, 애니메이션 안내도 Tailwind 4(`tw-animate-css`) | 단위 테스트 + 빌드 cli 실경로(fx-npm d · a 사본, 발행본 실측과 대조) |
| `axis init` Tailwind 4 버전 안내(`tailwind4GuideLines`, init.ts 299) | `axisPackagesBelowTailwind4` | 앱 선언 `^1.3.0` 이면 루트 설치본 1.8.0 이어도 「선언을 올리세요」 | 설치본 기준(1.8.0 이면 안내 없음, 1.3.0 이면 「설치본(...)을 올리세요」) | check 와 같은 함수(양성 대조 테스트) |
| `axis theme add`(theme-add.ts 351) | `detectTailwind` | 루트 전용 Tailwind 4 CSS 에 `@axis-ds/tokens/css` · `css/shadcn`(Tailwind 3 기본 CSS) 삽입 + Tailwind 3 preset 안내 | `@axis-ds/tokens/css/tailwind4` 만 기본 CSS, preset 안내 없음 | 단위 테스트 + 빌드 cli 실경로(fx-npm d 사본) |
| `axis template apply` 경고(template-apply.ts 32) | `detectTailwind` | 루트 전용 Tailwind 4 앱에 Tailwind 3 템플릿을 적용해도 major 경고 없음 | 「템플릿은 Tailwind 3 기준인데 이 프로젝트는 Tailwind 4(4.3.3) 입니다」 경고 | 단위 테스트 |
| `axis add` 의존성 범위(registry-core add.ts 514) | `detectTailwind` → `selectUtilsDependencies` | init 과 같은 원인으로 tailwind-merge Tailwind 3 범위 | init 과 같음 | 같은 함수 결과(init 테스트가 지킴), 별도 테스트 없음 |
| MCP `axis.check_project` | 위 check 항목 함수(번들) | CLI 와 같은 거짓 FAIL · WARN | CLI 와 같은 판정 · 문구 | MCP 테스트 3건 + 빌드 mcp stdio 70/70 |

## 4. 단위 테스트

CLI `packages/axis-cli/src/template/template-check.test.ts` 「WI-0074」 9건, MCP `packages/axis-mcp/src/tools/template.test.ts` 「WI-0074」 3건.

| # | 테스트 | AC |
|---|---|---|
| 1 | hoisted: 앱 6개(a · b · c · d · e · h)의 항목 표 + detectTailwind · below | AC1 · AC2 |
| 2 | isolated(음성 대조): 같은 앱을 앱 node_modules 설치로, 결과 동일 | AC4 |
| 3 | 단일 프로젝트(음성 대조) | AC4 |
| 4 | 양성 대조: 루트 tokens 1.3.0 → below 1건 · WARN 문구 | AC2 |
| 5 | 가까운 설치본 우선(e-tw3) | AC3 |
| 6 | 환경 가드: tmpdir 조상에 tailwindcss · AXIS 설치본 없음 | 위험 대응 |
| 7 | Plug'n'Play: 상위 node_modules 를 읽지 않음 | AC5 |
| 8 | init tailwind-merge 범위 · template apply 경고 | AC7 |
| 9 | theme add 기본 CSS | AC7 |
| M1~M3 | MCP: a · b PASS, h 네 항목, 양성 대조 | AC6 |

변이(각각 원복 뒤 `cmp` 동일 확인):

| 변이 | 결과 |
|---|---|
| M1 detectTailwind 를 한 층 판독으로 | CLI 4건 빨강(hoisted · isolated · init/template · theme) |
| M2 AXIS 버전 판독을 한 층으로 | 2건 빨강(hoisted · 양성 대조) |
| M3 detectTailwind 의 PnP 가드 제거 | 1건 빨강(PnP) |
| M4 AXIS 버전 판독의 PnP 가드 제거 | 1건 빨강(PnP) |
| M5 루트 우선 탐색 | 3건 빨강(hoisted · isolated · 가까운 설치본 우선) |
| 수정 전 소스 전체(MCP) | 3건 빨강 |

기존 테스트 보정 1건: `init.test.ts` 「tailwind-merge: 템플릿 4종은 1.6 규칙」은 저장소 안 `apps/web/templates/*/files` 에서 판정해, 상위 탐색이 저장소 루트 `node_modules/tailwindcss`(3.4.19, 개발 의존성)를 읽어 `source: "installed"` 로 바뀌었어요. 테스트 의도(템플릿 선언 확인)대로 tmpdir 에서 판정하게 고쳤어요. 브리프가 예고한 위험(레포 안 픽스처 오염)이 실제로 1건 나타난 것이고, 6번 환경 가드로 tmpdir 쪽 오염을 막아요.

## 5. 게이트 (측정, 2026-10-25)

| 게이트 | 결과 |
|---|---|
| `turbo lint --force` | rc 0, 7/7, Cached 0 |
| `turbo type-check --force` | rc 0, 11/11, Cached 0 |
| `turbo build --force` | rc 0, 8/8, Cached 0. `public/templates/*.json` 5개는 updatedAt 한 줄만 바뀌어 되돌림 |
| `turbo test --force` | rc 0, 7/7, Cached 0. cli 747(HEAD 738 + 9, 계산) · mcp 166(HEAD 163 + 3) · ui-react 194 · agentic-ui 148 · theme 47 |
| check-token-refs | rc 0, 검사 파일 83 · 참조 590 · 위반 0 |
| check-contrast-pairs | rc 0, 검사 파일 21 · 짝 13 · 위반 0 |
| check-types-versions | rc 0, 검사 4개 패키지 |
| check-library-links | rc 0, 링크 48 · 항목 129 · 위반 0 |
| build:registry | rc 0, G1 30개 항목 통과. `public/r/index.json` · `registry.json` version 1.8.0 → 1.5.0 으로 되돌림 |
| test:registry | rc 0, 45 pass · 0 fail |
| check-licenses | rc 0, 외부 블록 38 · 소스 3 |
| pack-smoke | rc 0, 퍼블리시 대상 6개 |
| cli-smoke | rc 0 |
| registry-install-smoke | rc 0, 5/5 |
| E2E | 해당 없음(apps/web 소스 · 정적 산출물 변경 없음) |

## 6. 발행 후 재측정 (AC8, 2026-10-26)

- 대상: npm 발행본 `@axis-ds/cli` 1.7.0 · `@axis-ds/mcp` 1.4.0 · tokens 1.8.1(PR #214 머지 4a5e185, Release PR #216 머지 61ae674, publish run 40205738223, provenance 6/6), 대조 cli 1.6.2 · mcp 1.3.5 · tokens 1.8.0. 버전은 설치본 package.json 에서 읽었어요.
- 환경: 격리 HOME · XDG · npm 캐시로 npm 레지스트리에서 설치, 자식 프로세스 env 는 PATH · HOME · XDG_CONFIG_HOME 셋뿐. 브리프 픽스처 4종(fx-npm · fx-pnpm · fx-pnpmhoisted · fx-single, 절대경로 심링크 0)을 `cp -a` 하고 `diff -rq` rc 0 확인.
- 수집 확인 먼저: 앱 20개, 기대 항목 70. 구판 출력에 2절 before 항목 70/70, 신판 출력에 after 항목 70/70 이 cli(`SEV  msg`) · mcp(`[SEV] msg`) 양쪽에 문구까지 있음(불일치 0, mcp isError 0).
- 발행본끼리 줄 비교: cli 110줄(항목 70 + axis.config 20 + utils 20) 중 바뀐 12 · 그대로 98, mcp 도 12 · 98. 바뀐 12줄은 2절 표와 같음(tailwind.config 9건: npm · hoisted 의 a · b · c · d, pnpm 기본 d. h-rootonly-ui 3건: tailwind.config FAIL→WARN, globals.css WARN→PASS, animation WARN→PASS).
- 음성 대조: pnpm 기본 a · b · c · e · f, 모든 e-tw3 · f-tw3content, fx-single 은 전이 0. cli rc 는 a-twlatest(npm · hoisted) 1→0, d-rootonly 는 1 유지(아래 인접 결함), 나머지는 그대로.
- 3절 전이: `init -y`(루트 전용 TW4 앱 d · a 사본) 구판 tailwind-merge ^2.6.0(「tailwindcss 를 찾지 못해 기본값」), 신판 ^3.4.0(「설치된 tailwindcss 4.3.3」, 애니메이션 안내 tw-animate-css), rc 모두 0. `theme add ontology`(d 사본) 구판은 globals.css 에 tokens/css · css/shadcn · ontology 3줄 + preset 안내, 신판은 ontology 1줄(tailwind4 진입점 유지) · preset 안내 0줄. 0줄 판정은 같은 grep 이 구판 파일에서 걸리는 것으로 측정이 수행된 것을 확인.
- 남은 것: d-rootonly(npm · pnpm · pnpm hoisted)와 h-rootonly-ui 는 1.7.0 에서도 cli rc 1 이에요(dependencies FAIL, 인접 결함 WI-0081 축). npm workspaces 픽스처의 init 출력이 설치 명령을 「pnpm install」로 안내하는 것은 신구 같고 WI-0081(#210) 범위예요.
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/wpub6/WI-0074/`
