# WI-0037 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 환경: Node 22.22.0 · npm 레지스트리 next 15.5.28 · tailwindcss 3.4.19

## 1. 템플릿 스모크 (AC1 · AC2, 측정)

`node scripts/template-smoke.mjs` 가 빌드한 cli(`packages/axis-cli/dist/index.js`)로 `template init` 하고 `npm install` · `npx next build` 를 `CI=1` 로 실행해요. 템플릿 JSON 은 스크립트가 띄운 127.0.0.1 서버가 주고 cli 는 `AXIS_TEMPLATE_URL` 로 그 서버를 봐요. 그래서 이 결과는 「저장소 템플릿 JSON 의 내용」을 검증한 것이고 pages.dev 에서 받는 경로는 아니에요(주입 전제, 배포 뒤 재측정은 todo 에 남김).

| 대상 | init rc | install rc | build rc | `@tailwind` 잔존 | `.bg-background` | 판정 |
|---|---|---|---|---|---|---|
| 수정본 theme-only | 0 | 0 | 0 | 0 | 1 | PASS |
| 수정본 dashboard | 0 | 0 | 0 | 0 | 1 | PASS |
| 수정본 landing-page | 0 | 0 | 0 | 0 | 1 | PASS |
| 수정본 hr-dashboard | 0 | 0 | 0 | 0 | 1 | PASS |
| 음성 대조: 고치기 전(HEAD) JSON 4종 | 0 | 0 | 1 | 0 | 0 | 4/4 FAIL |
| 음성 대조: 수정본 theme-only 에서 postcss 만 뺌 | 0 | 0 | **0** | 3 | 0 | FAIL |

- postcss 를 뺀 변형은 build rc 0 인데 FAIL 이에요. 판정이 rc 가 아니라 CSS 내용이라는 것을 이 대조군이 보여요
- 첫 실행(수정 1차)은 4/4 build rc 1 이었어요: `@types/node` 누락(CI=1 에서 Next 가 자동 설치하지 않음) 4건, hr-dashboard `./lib/demo-data` 경로 1건. 고친 뒤 위 결과예요(측정)

## 2. 단위 테스트

| 파일 | 내용 | 결과 |
|---|---|---|
| `packages/axis-cli/src/config/axis-config.test.ts` | `createTemplateConfig` 는 정정 전(f1777ee)과 globalCss 한 값만 다름 | 통과 |
| `packages/axis-cli/src/init/init.test.ts` | 템플릿 4종 `tailwind-merge` 가 규칙값 ^2.6.0 과 같음(종전 「알려진 불일치」 고정을 정합으로) | 통과 |
| `packages/axis-cli/src/theme/brand-core.test.ts` | theme-only 레이아웃이 app/ 4개 · postcss 포함 8개 파일 | 통과 |
| `packages/axis-cli/src/template/template-check.test.ts` | apply 경고 4건(빈 디렉터리 0 · Tailwind 4 1 · 같은 major 0 · src/app 1), 템플릿 4종 JSON 구조(app/ 3개 · postcss, 루트 page 없음, tailwind-merge ^2.6.0) | 통과 |
| 같은 파일 T4-1 | check 기준선(1e84f15) 대비 theme-only 출력 변화는 「globals.css → app/globals.css」 와 WI-0065 의 두 줄뿐 | 통과 |

## 3. 게이트 (캐시 우회 `--force`)

- `pnpm turbo run type-check lint --filter=@axis-ds/cli --filter=@axis-ds/mcp --filter=@axis-ds/registry-core --filter=@ax/web --force`: 11/11, Cached 0, rc 0
- `pnpm turbo run build test --filter=@axis-ds/cli --filter=@axis-ds/mcp --force`: 4/4, Cached 0, rc 0(cli 704 · mcp 139)
- `pnpm --filter @ax/web build`: rc 0(정적 페이지 235개 생성)
