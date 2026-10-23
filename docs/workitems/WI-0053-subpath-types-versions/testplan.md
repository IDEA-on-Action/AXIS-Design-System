# WI-0053 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-23 | 환경: Node 22.22.0, pnpm 9.15.4, TypeScript 5.9.3, next 15.5.28

## 1. 단위 테스트 (`pnpm check-types-versions` = `--check` + `node --test scripts/sync-types-versions.test.mjs`)

| 대상 | 결과 |
|---|---|
| 생성 전 `--check` (음성 대조) | rc 1, DRIFT 3패키지(tokens 빠짐 4 · ui-react 빠짐 30 · agentic-ui 빠짐 18), theme OK 키 0 |
| 생성 후 `--check` | rc 0, 키 tokens 4 · ui-react 30 · agentic-ui 18 · theme 0 |
| 단위 테스트 | 8/8 |

단위 테스트 안의 변이(실제 package.json 사본에서, `syncPackage` 와 CLI `--check --only` 둘 다):

| 변이 | 결과 |
|---|---|
| ui-react exports 에 `./new-thing` 추가 | 드리프트 「빠짐 new-thing」, CLI rc 1 → 다시 생성하면 rc 0 |
| agentic-ui exports 에서 `./agent-avatar` 삭제 | 「남음 agent-avatar」, rc 1 → 생성 후 rc 0 |
| tokens `./json` 타깃 변경 | 「값 다름 json」, rc 1 → 생성 후 rc 0 |
| theme 에 typesVersions 임의 추가 | 「남음 x」, rc 1 → 생성(제거) 후 rc 0 |
| package.json 없는 디렉터리 | rc 2(측정 실패) |

테스트 자체의 변이: 저장소 tokens package.json 에서 typesVersions 키 `json` 하나를 지우면 8건 중 3건 실패(저장소 `--check` · 1:1 독립 검산 · 변이 테스트의 tokens 사본). 복구 후 `--check` rc 0.

## 2. 소비자 해석 게이트 (pack-install-smoke G2-types)

탐침 56개(루트 4 · TS 서브패스 49 · JSON 3) × node · node16 CJS · node16 ESM · bundler = 224건. 항목마다 탐침 오류 0 과 explainFiles 해석 파일 = exports 타깃을 함께 봅니다.

| tarball | 결과 | node 실패(tokens · ui-react · agentic-ui · theme) | node16 · bundler 실패 |
|---|---|---|---|
| 수정본(`pnpm pack-smoke`) | rc 0 | 0/5 · 0/31 · 0/19 · 0/1 | 0 |
| 음성 대조: npm 1.5.0 4개 | rc 1, 결함 52건 | 4/5 · 30/31 · 18/19 · 0/1 | 0 |
| 음성 대조: 수정 ui-react 에서 typesVersions 만 제거 | rc 1, 결함 30건 | 0/5 · 30/31 · 0/19 · 0/1 | 0 |
| 변이: ui-react `avatar` 를 `dist/button/index.d.ts` 로 | rc 1, 결함 1건 「해석 파일 …/dist/button/index.d.ts != …/dist/avatar/index.d.ts」 | | 0 |

마지막 변이는 tsc 오류가 0 이라 rc 만 보는 검사로는 통과합니다. 해석 파일 대조가 잡습니다.

## 3. Next 실측 (tsconfig 없이 시작, Next 가 `"moduleResolution": "node"` 로 생성)

탐침 페이지: `@axis-ds/ui-react/avatar` 의 `Avatar`, `@axis-ds/agentic-ui/agent-avatar` 의 `AgentAvatar name="axis"`, 루트 `Button`.

| 설치본 | `next build` |
|---|---|
| npm 1.5.0 (음성 대조) | rc 1, `Type error: Cannot find module '@axis-ds/ui-react/avatar'` |
| 수정 tarball 4개 | rc 0, 정적 페이지 4/4 |
| 수정 tarball + `<AgentAvatar />`(필수 prop `name` 누락) | rc 1, `Property 'name' is missing ... 'AgentAvatarProps'`(서브패스 타입이 실제로 검사됨) |

## 4. 게이트

| 명령 | 결과 |
|---|---|
| `turbo run type-check --force` | rc 0, 8/8, Cached 0 |
| `turbo run lint --force` | rc 0, 4/4, Cached 0 |
| `turbo run build --force` | rc 0, 8/8, Cached 0(ui-react build 의 sync-types-versions OK 키 30). 바뀐 `apps/web/public/templates/*.json` 은 되돌림 |
| `turbo run test --force` | rc 0, 6/6, Cached 0(cli 640 · ui-react 110 · agentic-ui 72 · mcp 43 · theme 31 · tokens 235) |
| `pnpm test:registry` | rc 0, 45/45 |
| `pnpm pack-smoke` | rc 0, 퍼블리시 대상 6개 통과, G2-types 224건 실패 0, G2 RSC 결함 0 |
| `pnpm cli-smoke` | rc 0 |
| `pnpm check-types-versions` | rc 0, 8/8 |

## 5. 범위 밖 확인

- node10 에서 ui-react 변형 prop(`variant` 등) 타입이 any 로 떨어지는 cva `/types` 문제(PRD 1.4)는 이 게이트가 잡지 않습니다. 게이트는 `skipLibCheck: true`(Next 기본)라 d.ts 안의 외부 서브패스 미해석이 보이지 않습니다. 별도 WI(D6)

## 6. 배포 실측 (2026-10-24)

- npm `@axis-ds/ui-react` · `agentic-ui` · `tokens` 1.5.1 을 tsconfig 없는 Next 15.5.28 앱에 설치해 `next build`: Next 가 `"moduleResolution": "node"` 로 tsconfig 를 만들고 rc 0(서브패스 `ui-react/avatar` · `agentic-ui/agent-avatar` · `tokens/json` + 루트). `<AgentAvatar />`(필수 prop 누락)는 rc 1 「Property 'name' is missing」로 서브패스 타입이 실제로 검사됨
