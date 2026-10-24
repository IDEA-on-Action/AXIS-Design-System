# WI-0051: check dependencies 설치본 판정 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` 778e1dd + 브랜치 `fix/wi-0051-0070-0068-0072-check-brand-cjs`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)
> 이 문서 3절은 배치 3 묶음 ①(WI-0051 · 0068 · 0070 · 0072) 공통 게이트 기록이에요.

## 1. 단위 테스트 (측정)

| 대상 | 결과 |
|---|---|
| cli `template-check.test.ts` 「배치 3 ① WI-0051」 7건 | 선언만 · node_modules 없음 → WARN(`package-lock.json` 이 있으면 `npm install`) · 선언된 ui-react 미설치 WARN → stub 설치 뒤 PASS(4개 확인) · 호이스팅(상위 node_modules) PASS · exports 에 ./package.json 없는 tokens 형태 PASS · `.pnp.cjs` 선언 기준 PASS · 권장 누락 + 미설치 한 WARN · 필수 누락 FAIL · package.json 없음 · JSON 파손 FAIL(이름 `dependencies`) |
| cli T4-1 기준선 | node_modules 가 없는 fixture(theme-only · app-init · src-app · brokenConfig)의 dependencies 줄에 「선언됐지만 설치되지 않은 의존성」이 붙는 것을 의도한 변경으로 기록. allPass 빌더는 설치본 stub 을 써서 「선언 · 설치되어 있습니다 (3개 확인)」 |
| mcp `template.test.ts` | 빈 디렉터리 5항목 고정값(`dependencies` FAIL 「package.json 파일이 없습니다」) 그대로, 「배치 3 ①」 선언만 WARN · 설치 뒤 PASS |
| 공유 코어 | cli · mcp 가 `@axis-ds/registry-core/dependencies-core` 하나를 씀(중복 구현 제거). 설치본 판독은 `project.ts` 의 `findInstalledPackage` |

## 2. 배포 경로 실측 (측정, 이 브랜치 pack 한 cli · MCP)

- f1(npm install 뒤 `@axis-ds/ui-react` 를 선언만 더함): cli 1.6.0 · MCP 1.3.3 「필수 및 권장 의존성이 모두 설치되어 있습니다」 PASS, 이 브랜치 cli · MCP(stdio) WARN 「선언됐지만 설치되지 않은 의존성: @axis-ds/ui-react → npm install」.
- f2(ui-react 선언 제거): PASS 「필수 및 권장 의존성이 선언 · 설치되어 있습니다 (5개 확인)」. 5개 = tailwindcss · clsx · tailwind-merge · @axis-ds/tokens · @axis-ds/theme(계산: 선언 목록과 일치).

## 3. 묶음 ① 게이트 (측정)

| 게이트 | 결과 |
|---|---|
| `turbo run lint --force` | rc 0, 7 tasks · Cached 0 |
| `turbo run type-check --force` | rc 0, 11 tasks · Cached 0 |
| `turbo run test --force` | rc 0, 6 tasks · Cached 0(tokens 296 · ui-react 126 + 7 · agentic-ui 95 · theme 47 · cli 726 · mcp 143) |
| `turbo run build --force` | rc 0, 8 tasks · Cached 0 |
| `pnpm check-token-refs` · `check-contrast-pairs` · `check-types-versions` · `check-library-links` | 모두 rc 0 |
| `pnpm build:registry` · `test:registry` · `check-licenses` | 모두 rc 0, 레지스트리 생성물 변경 0(git status) |
| `pnpm pack-smoke` | rc 0, 퍼블리시 대상 6개, tokens `require-preset` 통과(WI-0072 testplan 2.2) |
| `pnpm cli-smoke` | rc 0 |
| `pnpm registry-install-smoke` | rc 0, 대표 5개(button · dialog · toast · agentic-tool-call-card · agentic-approval-card) 5/5 PASS |

- 처음 한 번은 `turbo run type-check lint test build --force` 를 한 명령으로 돌렸다가 agentic-ui test 가 `Failed to resolve entry for package "@axis-ds/ui-react"` 로 실패했어요. 같은 실행에서 ui-react build 가 dist 를 지우는 동안 테스트가 돌아서 생긴 순서 문제이고(test 는 build 에 의존하지 않음), CI 순서(lint → type-check(^build) → test → build)로 나눠 다시 돌린 결과가 위 표예요.
- 빌드가 다시 쓴 `apps/web/public/templates/*.json` 의 `updatedAt` 5파일은 무관한 churn 이라 되돌렸어요.

## 4. E2E (측정)

frontend.yml 과 같은 env(`E2E_SERVER=static`) · reporter 로 4종을 실행했어요. 건수는 JSON stats 로 읽었고 CI 의 실행 건수 가드 기대값과 같아요.

| suite | 기대 | 실행(통과) | 실패 · flaky · skipped |
|---|---|---|---|
| a11y | 40 | 40 | 0 · 0 · 0 |
| nontext | 8 | 8 | 0 · 0 · 0 |
| demo | 8 | 8 | 0 · 0 · 0 |
| tokens | 22 | 22 | 0 · 0 · 0 |

- 첫 실행의 a11y 는 22 통과 · 18 실패(`net::ERR_CONNECTION_REFUSED http://127.0.0.1:3101`)였어요. 로컬은 `reuseExistingServer` 가 켜져 있어 이미 3101 을 쓰던 다른 정적 서버를 재사용하다가 그 서버가 도중에 내려간 것으로 보여요(그 서버 PID 의 cwd 는 확인 전에 사라짐, 추정). `CI=1`(재사용 끔, 자기 서버 기동)로 4종을 다시 돌린 결과가 위 표이고, 첫 실행의 nontext · demo · tokens 결과는 같은 이유로 근거에서 뺐어요.
- 문서 사이트(apps/web)는 next-themes 를 쓰고 `@axis-ds/theme` 의 ThemeProvider 를 쓰지 않아요(`src/app/providers.tsx`). 그래서 이 E2E 는 WI-0068 의 새 동작을 직접 재지 않고 회귀가 없다는 것만 보여요. ThemeProvider 동작은 WI-0068 testplan 2절의 브라우저 실측이 근거예요.

## 배포 뒤 재측정 (2026-10-25)

- 대상: npm 발행본 tokens · theme · ui-react · agentic-ui 1.7.0, cli 1.6.1, mcp 1.3.4(run 40137182470, provenance 6/6). 레지스트리에서 설치해 node_modules 의 version 으로 확인했어요.
- 결과: 불일치 0. cli 1.6.1 · mcp 1.3.4 의 check 결과: 선언만 있고 미설치이면 WARN(npm · pnpm 설치 명령 안내), 상위 디렉터리 설치본이면 PASS, PASS 문구의 확인 개수도 일치했어요. Plug'n'Play 경로는 재지 않았어요.
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/post3`
