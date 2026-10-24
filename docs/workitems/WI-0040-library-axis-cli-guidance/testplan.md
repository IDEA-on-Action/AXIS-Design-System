# WI-0040 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 기준: main bd54e91 + 이 브랜치(`docs/wi-0028-0040-0048-closeout`)
> 표기: **측정**은 이번에 명령을 실행해 얻은 값, **기록**은 커밋 이력에서 읽은 값입니다.

## T1. 현재 데이터 위반 0건 (AC1)

| 항목 | 결과(측정) |
|---|---|
| `npx vitest run src/guidance.test.ts`(packages/axis-cli) | 1파일 4/4 통과(기존 3 + 양성 대조 1), rc 0 |
| 계측 대조: 스캔한 library 파일 | 100개 초과 단언 통과. `find apps/web/public/library -type f` 112개(모두 `.json`) |
| 계측 대조: 실재 파일 포함 | `components/step-timeline.json` · `categories/agentic.json` 포함, `step-timeline.json` 을 풀어 읽은 줄 50줄 초과 |
| 0건 교차 확인 | `git grep -c "npx axis-cli" HEAD -- apps/web/public/library` rc 1(0건). 같은 범위 대조군 `pages.dev` 45개 파일 · `CodeBlock` 2개 파일이 잡혀 grep 이 대상을 읽음 |

## T2. 양성 · 음성 대조 (AC3)

- fixture(006836a~1 원문 조각)를 `linesOf` 로 읽으면 위반 정확히 1줄: `<CodeBlock code="npx axis-cli add step-indicator" language="bash" />` (측정, 테스트 단언)
- 이스케이프를 풀어야만 잡히는 형태(합성 입력): `{"content":"```bash\nnpx -y axis-cli@latest init\n```"}` 원문 한 줄은 걸리지 않고(npx 앞 단어 경계 없음, BARE 패턴도 `@latest` 로 비껴감), 풀어 읽으면 걸림 (측정, 테스트 단언)
- 음성 대조: 같은 fixture 에서 `npx axis-cli` 를 `npx @axis-ds/cli` 로 바꾸면 위반 0 (측정, 테스트 단언)
- 참고(계산): 006836a~1 의 실제 14곳은 모두 `code=\"npx axis-cli` 형태라 원문 줄 검사로도 걸립니다. 이스케이프 풀기는 위 합성 입력 같은 `\n` 뒤 실행 안내를 놓치지 않으려는 것입니다.

## T3. 변이: 006836a~1 library 데이터 복원 (AC2)

| 변이 | 결과(측정) |
|---|---|
| `git checkout 006836a~1 -- apps/web/public/library`(추가 7 · 수정 40) 뒤 `npx vitest run src/guidance.test.ts` | rc 1, 1건 실패 · 3건 통과. 위반 14곳 모두 출력(`categories/agentic.json` 7 · `components/*.json` 7) |
| 같은 데이터에서 library 스캔을 끈 판(`[...SCAN_DIRS, ...LIBRARY_DATA_DIRS]` → `[...SCAN_DIRS]`) | rc 1, `expected 0 to be greater than 100`(계측 대조가 범위 누락을 잡음). 되돌린 뒤 `cmp` 로 원본과 같음 |
| 원복 | `git checkout HEAD -- apps/web/public/library` 뒤 되살아난 7개 파일을 index 와 작업 트리에서 지움. `git status --porcelain apps/web/public/library` 0줄, 파일 112개 |

## T4. 게이트 (AC4)

| 명령 | 결과(측정) |
|---|---|
| `pnpm exec turbo run test --filter=@axis-ds/cli --force` | rc 0, Cached 0/1, 17파일 662/662 |
| `pnpm --filter @axis-ds/cli test` | rc 0, 17파일 662/662 |
| `npx eslint packages/axis-cli/src/guidance.test.ts` | rc 0. 양성 대조: 같은 설정으로 `packages/axis-cli/src/index.ts` rc 1(기존 지적, 린트가 실제로 돎). cli 에는 `lint` 스크립트가 없어 `pnpm lint`(turbo) 대상이 아님 |
| `pnpm exec turbo run lint --force` | rc 0, 4/4 태스크(tokens · web · agentic-ui · ui-react), Cached 0 |
| `npx prettier --check packages/axis-cli/src/guidance.test.ts` | 경고. HEAD 판도 같은 설정으로 경고(기준선 결함)라 이 WI 에서 파일 전체를 다시 쓰지 않음 |
