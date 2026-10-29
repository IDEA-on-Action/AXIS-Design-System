# WI-0089: MCP 브랜드 도구의 tokens 판독 낡음 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #224
> 줄 번호는 `main` e103d43 기준이에요. 구현 착수 때 다시 읽어요

## 1. 무엇을 고치나

낡음은 AXIS 의 캐시가 아니라 Node 내부 package.json 판독 캐시(prd 1.3 C1)에서 와요. 지울 수 있는 우리 캐시가 없으므로 「언제 무효화할지」가 아니라 **「언제 Node 해석을 믿고, 언제 우회할지」**를 정해야 해요. 브리프의 후보(매 호출 판독 · mtime · 크기와 mtime 조합 · TTL)는 아래처럼 다시 놓여요.

| 브리프 후보 | 이 WI 에서의 자리 |
|---|---|
| 매 호출 판독 | 이미 그래요. `version` 은 매 호출 `readFileSync`(`brand-core.ts:165`). 문제는 Node 해석이 그 판독을 쓰지 않는 것이라 「매 호출 판독」만으로는 안 풀려요 → 방식 A(자체 해석) · C(매 호출 격리) |
| mtime · 크기와 mtime | 「바뀌었는가」를 가리는 **감지 키** 후보(Q81) |
| TTL | 해당 없음. 만료시킬 캐시가 우리 쪽에 없고, Node 캐시는 시간이 지나도 안 풀려요 |

## 2. 방식 후보와 비용 (Q80)

비용은 Node v22.22.0 단독 프로브 측정값이에요(testplan 3.2, 호출 하나당 평균).

| 방식 | 내용 | 변경 없는 호출 비용 | 변경 뒤 호출 비용 | 정확도 | CLI 경로 | 코드 규모 |
|---|---|---|---|---|---|---|
| **B 변경 감지 + 격리 해석 (권장)** | 프로세스 안에서 tokens package.json 경로별로 **첫 Node 해석 때의 내용 키**를 기록. 이번 호출에서 읽은 내용 키가 다르면 그 호출의 해석 세 곳을 Worker 스레드에서 해요. 같으면 지금처럼 `createRequire().resolve` | 지금과 같음(+ 키 계산. sha256 은 이미 읽은 문자열이라 μs 단위, 추정) | Worker 1회 약 27 ms(측정). 한 호출의 해석 세 곳을 Worker 하나에 묶으면 호출당 1회 | Node 해석 그대로 | 첫 호출은 항상 Node 해석이라 CLI 는 새 갈래에 들어가지 않음(출력 · 비용 불변) | 중(Worker 진입 · 메시지 · 폴백) |
| A 자체 exports 해석 | 매 호출 package.json 을 읽어 `exports` 의 **문자열 값 · 정확한 키**만 직접 매핑하고 대상 파일 존재를 `statSync` 로 확인. 그 밖의 모양(조건 객체 · `*` 패턴 · 배열)은 종전 Node 해석 | 약 0.012 ms(JSON 판독, 측정) + stat 0.004 ms | 같음 | 지금 tokens 의 브랜드 키는 모두 문자열 · 정확한 키(1.7.0 · 1.8.2 · 저장소 HEAD 실측)라 맞아요. 나중에 모양이 바뀌면 그 키는 다시 낡아요 | CLI 도 자체 해석을 타서 코드 경로가 바뀜(결과는 같을 것으로 추정) | 소(15 ~ 25줄) |
| C 매 호출 격리 해석 | 항상 Worker(또는 자식 프로세스)에서 해석 | Worker 약 27 ms · 자식 약 24 ms(측정) | 같음 | Node 해석 그대로 | CLI 에도 비용이 붙음(사본 규칙으로 같은 코드) | 소 ~ 중 |
| D 감지 + 재시작 안내만 | 변경을 감지하면 판정은 그대로 두고 「서버를 다시 시작하세요」를 붙임 | 지금과 같음 | 지금과 같음 | 틀린 판정이 그대로 나감(안내만 정확) | 불변 | 소 |

- **권장 B 의 근거**: ① tokens 가 바뀌지 않은 호출은 코드 경로 · 비용이 지금과 같아요(새 축이 없을 때 종전 동작) ② Node 해석 의미를 다시 구현하지 않아 A 의 불일치 위험이 없어요 ③ CLI 는 한 프로세스 한 해석이라 감지가 늘 「첫 판독」이어서 출력이 바이트 불변이에요(AC10) ④ 비용은 tokens 가 실제로 바뀐 세션에만 붙어요
- 차선 A: 지금 패키지 모양에는 충분하고 가장 싸요. 다만 CLI 까지 해석 경로가 바뀌고, `exports` 모양이 바뀌는 날 조용히 다시 낡아요
- C 는 바뀌지 않은 대부분의 호출에 27 ms 를 붙이고 CLI 에도 비용이 가요. D 는 틀린 판정을 남겨 S8 의 도구 오류도 그대로예요

## 3. 수정 지점 (방식 B, 구현 결과)

원본 `packages/axis-cli/src/theme/brand-core.ts` 를 고치고 `cp` 로 `packages/axis-mcp/src/tools/brand-core.ts` 에 맞췄어요(WI-0028 U1, `brand-core.test.ts`). 줄 번호는 착수 기준이고, 구현 뒤 위치는 함수 이름으로 찾아요.

1. Node 해석 세 곳(착수 `:169` `resolveTokens` · `:350` `readSummary` · `:590` `getBrand`)이 한 해석기(`openTokensResolver` 가 돌려주는 `TokensResolver`)를 써요. `openTokens` 가 package.json 을 한 번 읽어(문자열 그대로) version 과 감지 키를 함께 만들고, `listBrands` · `getBrand` 는 그 해석기를 `readSummary` · 브랜드 CSS 해석에 넘긴 뒤 `finally` 에서 닫아요. 오류 코드 분류(`ERR_PACKAGE_PATH_NOT_EXPORTED` → unsupported, `MODULE_NOT_FOUND` → not-built, `isMissingBuildFile`)는 그대로예요. `resolveTokens` 는 같은 서명으로 남아요(CLI `theme-add.ts` 가 씀)
2. 모듈 수준 `nodeSeenStates: Map<package.json 후보 경로, 상태>` 하나. 상태는 내용 sha256 · `absent`(없음) · `unknown`(경합) 가운데 하나이고, 담는 것은 판정 결과가 아니라 「Node 가 기억하고 있을 그 경로의 상태」예요. 후보는 `tokensPackageJsonCandidates` 가 baseDir 부터 위로 본 `node_modules/@axis-ds/tokens/package.json` 경로 전부(찾은 경로까지)예요. Node 의 패키지 탐색도 같은 순서로 이 경로들을 읽어요. 후보 하나라도 기록이 있고 지금 상태와 다르면 격리 해석, 아니면 기록이 없는 후보를 지금 상태로 기록하고 Node 해석이에요. 처음 구현은 찾은 경로 하나만 봐서, 중첩 설치본을 지워 상위로 넘어가는 경우를 놓쳤어요(반박 검증 결함 1, 변이 V7). 미설치 갈래는 Node 해석을 부르지 않아 기록하지 않아요. 격리 해석 판정에서는 기록을 덮어쓰지 않아요(Node 캐시는 여전히 첫 상태라서, 덮어쓰면 다음 호출이 낡은 캐시로 돌아가요. 변이 V4)
   - 경합(반박 검증 위험 1): 기록은 `openTokens` 가 읽은 문자열 기준이고 Node 는 resolve 할 때 따로 읽어요. 그래서 Node 해석 갈래의 첫 resolve 직후 package.json 을 다시 읽어 sha 가 기록과 다르면, 그 경로를 `unknown` 으로 표시하고(이후 늘 격리 해석) 이번 판정도 격리 해석으로 다시 하고 version 을 다시 읽어요(변이 V11)
3. 격리 해석: 한 판정(목록 하나 · 상세 하나)에 Worker 하나를 띄우고, 그 안의 해석 요청을 차례로 보내요. Worker 는 `createRequire(<baseDir>/package.json).resolve(spec)` 결과나 오류 `code` · `message` 를 돌려줘요. 메인 스레드와 같은 `createRequire` 기본 조건(require)이라 해석 규칙이 같아요
   - **동기 대기를 골랐어요.** `resolveTokens` · `listBrands` · `getBrand` 가 동기이고 CLI 호출지(`theme/index.ts` · `theme-add.ts`)가 그 반환값을 바로 써요. async 로 바꾸면 CLI 호출지 세 곳이 함께 바뀌어 「CLI 출력 바이트 불변」 기준을 코드 경로부터 건드려요. 그래서 메인 스레드가 `Atomics.wait` 로 `SharedArrayBuffer` 신호를 기다리고 `receiveMessageOnPort` 로 응답을 꺼내요(Worker 는 자기 스레드라 메인이 막혀도 돌아요)
   - **자식 프로세스(`spawnSync(process.execPath, …)`)는 쓰지 않았어요.** 동기라 구현은 더 단순하지만, MCP 를 Electron 같은 내장 Node 에서 띄우면 `process.execPath` 가 Node 가 아닐 수 있고, 부모의 `NODE_OPTIONS` 를 물려받아 다른 모듈을 먼저 실을 수 있어요. Worker 는 같은 프로세스 · 같은 Node 라 이 두 위험이 없어요. 비용은 비슷해요(Node 22 에서 Worker 27.4 ms · 자식 23.7 ms, testplan 3.2)
   - Worker 는 `unref` 해 프로세스 종료를 막지 않고, 판정이 끝나면 `terminate` 해요
4. 폴백(Q83): Worker 를 만들 수 없거나 응답이 한도(5 초) 안에 오지 않으면 그 판정의 남은 해석을 Node 해석으로 하고 결과에 `stale: true` 를 달아요(`TokensResolution` · `BrandListResult` · `BrandGetResult` 의 선택 필드, 그럴 때만 생김). MCP `formatListBrandsResult` · `formatGetBrandResult`(`brand.ts`)는 응답 끝에 빈 줄과 `STALE_TOKENS_NOTE` 한 줄을 붙여요. CLI 렌더러는 이 필드를 보지 않아요(CLI 에서는 생길 수 없음)
   - 실패 래치(반박 검증 위험 3): 한 번 실패하면 그 프로세스에서는 Worker 를 다시 만들지 않고 바로 폴백해요. 시작 중에 죽는 원인이 남아 있으면 호출마다 한도만큼 멈추기 때문이에요(변이 V9). 처음 구현의 한도 10 초를 5 초로 줄였어요
   - `worker.on("error", () => {})`(반박 검증 위험 2): Worker 의 비동기 오류가 처리되지 않은 `error` 로 올라가 프로세스를 끝내지 않게 해요. 실패는 신호 대기의 시간 초과로 알아요(변이 V8)
   - 폴백 중 새 브랜드(반박 검증 결함 2): 낡은 exports 로는 새 브랜드의 `brand.json` · CSS 가 `ERR_PACKAGE_PATH_NOT_EXPORTED` 예요. `stale` 일 때만 이 오류를 목록에서는 그 항목 빼기, 상세에서는 `brand: null`(「없는 이름」 꼴)로 바꿔요. `stale` 이 아니면 종전처럼 던져요(변이 V10 · V12, Q87)
5. 감지 키(Q81): 찾은 경로는 `openTokens` 가 읽은 package.json 문자열의 sha256, 그 앞의 후보는 `absent`
6. 테스트 · 측정 전용 export: `isolatedResolveStats()`(만든 Worker 수 · Worker 로 해석한 지정자 수 · 폴백한 판정 수), `setIsolatedResolveFactoryForTest()`(실패 주입, 부를 때 래치도 풂), `workerResolveSessionForTest()`(Worker 소스 · 한도 주입), `IsolationFailure`. 두 패키지 모두 이 모듈을 패키지 진입점에서 다시 내보내지 않아 공개 API 는 아니에요(진입점은 실행 파일이라 export 가 없고, 최종본 d.ts 5개 전부에 네 이름 0건, testplan 4.8)

## 4. 회귀 범위

| 대상 | 바뀌나 | 확인 |
|---|---|---|
| MCP `axis.list_brands` · `axis.get_brand` | 상태가 바뀐 세션에서만 바뀜(새 프로세스와 같아짐) | 하네스 A/B(testplan 2절 전 시퀀스) |
| MCP `axis.check_project` | 아니요. `inspectBrandImport` · `inspectBrandActivation` 은 Node 해석을 쓰지 않아요(`brand-core.ts:298` · `:543`) | 하네스 S10 · S12 · S13 A/B |
| CLI `theme list` · `theme info` · `theme add` | 아니요(첫 판독 갈래만 탐) | 기존 테스트 기대 변경 0, CLI 출력 A/B(같은 fixture) |
| `brand-core.test.ts` 사본 동일성 | 원본 · 사본 같이 고쳐 통과 | vitest |
| 기존 brand 단위 테스트(cli `theme-*.test.ts` · mcp `brand.test.ts`) | 기대 변경 0(측정, testplan 4.2). fixture 마다 다른 임시 경로를 써서 모듈 수준 기록이 테스트끼리 섞이지 않아요 | vitest 전체 |
| C2 ~ C8 | 아니요 | `git diff --stat` |
| 번들 | tsup 이 Worker 코드 문자열 · `node:worker_threads` import 를 그대로 두는지 | `pnpm --filter @axis-ds/mcp build` 뒤 하네스를 빌드본으로 재측정 |

## 5. 구현 단계

1. 새 회귀 테스트를 먼저 써서(cli `brand-core.test.ts` 에 한 프로세스 · 같은 경로 · 상태 바꾸기 describe 「WI-0089」, mcp `brand.test.ts` 에 핸들러 대응 행) 수정 전 소스에서 빨강을 확인(AC11)
2. 3절 1 ~ 5 구현, 원본 → 사본 `cp`
3. 변이 V1 ~ V12(prd AC9)를 하나씩 넣어 빨강, sha256 대조 원복
4. `turbo build · type-check · lint --force`(Cached 0), cli · mcp vitest
5. 빌드본으로 하네스 재측정(발행본 대 수정본, 갈림 0 · AC6 바이트 같음). AC5 는 단위 테스트 Worker 증가 0 · 호출 지연(testplan 4.6)
6. changeset(Q84)

## 6. 결정 항목의 선택지 (Q80 ~ Q85)

| # | 선택지 | 권장 | 근거 |
|---|---|---|---|
| Q80 방식 | B 변경 감지 + 격리 해석 / A 자체 exports 해석 / C 매 호출 격리 / D 재시작 안내만 | **B** | 2절 표. 변경 없는 경로 불변 · Node 의미 그대로 · CLI 불변 |
| Q81 감지 키 | ① 내용 sha256 / ② `exports` 필드 정규화 비교 / ③ mtime + 크기 / ④ mtime | **①** | 낡음을 만드는 것은 `exports` 지만 Node 는 다른 필드(`imports` · `type` · `main`)도 같은 캐시에 담아요. 비교할 수 없을 때는 보수적인 쪽이 기본값이에요. ①은 이미 읽은 문자열이라 추가 판독이 없고, 대가는 exports 는 같고 내용만 바뀐 경우(S3 · S5 · S9)에도 격리 해석 비용이 붙는 것뿐(결과는 같음). ②는 더 싸지만 Node 가 캐시하는 필드 목록을 우리가 베껴야 해요. ③ · ④는 같은 크기 · 같은 시각 해상도 안의 다시 쓰기를 놓치고 stat 을 하나 더 해요 |
| Q82 범위 | ① `brand-core.ts` Node 해석 세 곳만 / ② C3 · C4 정적 캐시도 매 호출 판독으로 / ③ MCP 전 도구에 「세션 시작 뒤 바뀐 파일」 감시 | **①** | 낡음이 측정된 곳은 C1 뿐이고 C2 ~ C8 은 대상 프로젝트를 담지 않거나 인스턴스 수명이 호출 하나예요(prd 1.3). 낡음이 확인되지 않은 곳을 고치면 회귀 범위만 넓어져요 |
| Q83 폴백 | ① Node 해석 + 재시작 안내 한 줄 / ② 도구 오류(`isError`) / ③ 조용히 Node 해석 | **①** | ②는 지금도 정상 판정이 나올 수 있는 경우까지 실패로 만들어요. ③은 낡은 판정을 숨겨요. ①은 결과를 내면서 정확도의 한계를 알려요 |
| Q84 changeset | ① mcp · cli patch / ② mcp patch 만 / ③ 없음 | **①** | 원본이 cli 에 있어 cli 만 발행하지 않으면 「`git log <발행 커밋>..HEAD -- packages/` 0줄이라 발행본과 소스가 같음」이라는 기준이 cli 에서 깨져요. CLI 동작은 바뀌지 않는다고 changeset 에 적어요 |
| Q85 Node 버전 | ① 구현 검증 때 Node 20 · 24 로 하네스 재측정, 착수는 막지 않음 / ② 착수 전 측정 필수 / ③ 재지 않음 | **①** | 방식 B 는 Node 캐시 구현과 무관하게 동작해요(Worker 는 별도 환경). Node 버전이 바꾸는 것은 「낡음이 나는가」이고 「고친 뒤 맞는가」가 아니어서 착수를 막을 이유가 약해요. 다만 mcp `package.json` 에 `engines` 가 없어 Node 18 · 20 사용자를 배제할 수 없으니 재기는 해요 |

## 7. 바꾸지 않는 곳

- `axis.list_tokens` · `axis.get_token` 이 MCP 동봉 토큰을 내는 설계(C4, WI-0076)
- 레지스트리 클라이언트 생성 방식(C5)
- 상태 분류 규칙과 안내 문구(`formatTokensStatusGuide`, `brand.ts:101-135`). 폴백 안내 한 줄만 더해요
