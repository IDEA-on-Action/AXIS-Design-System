# WI-0089: MCP 서버가 같은 세션에서 tokens 상태 변경 뒤에도 이전 판독을 응답함 PRD

> 작성일: 2026-10-29 | 버전: v1.1 | 작성자: Sinclair Seo | WI: WI-0089 | GitHub: #224 | 우선순위: P3 | 상태: Approved (2026-10-29 사용자 결정 Q80 ~ Q85, 모두 권장안)
> 기준: `main` e103d43 (linked 1.8.2 · cli 1.7.7 · mcp 1.4.6 발행됨, `git log 1e8da06..HEAD -- packages/` 0줄이라 발행본과 소스가 같음). 측정은 발행본 mcp 1.4.6(`dist/index.js` sha256 앞 12자 87f1bd34cdd7) · Node v22.22.0
> 표기: **측정**(착수 · 구현 · 반박 검증에서 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, 발행본 mcp 1.4.6)

MCP 서버는 오래 사는 프로세스예요. 같은 프로세스에서 대상 프로젝트의 `node_modules/@axis-ds/tokens/package.json` 이 바뀌면, `axis.list_brands` · `axis.get_brand` 가 **처음 해석한 그 파일의 `exports`** 로 계속 판정해요. 버전 문자열은 매번 새로 읽어서, 「`@axis-ds/tokens 1.8.2 은 브랜드를 지원하지 않습니다`」처럼 새 버전과 낡은 판정이 한 문장에 섞여요. 서버를 다시 띄우기 전까지는 tokens 를 지웠다 다시 깔아도 풀리지 않아요.

같은 경로에서 상태를 바꾼 뒤 같은 프로세스(L)와 같은 경로에 새로 띄운 프로세스(F)의 응답을 칸마다 대조했어요(testplan 2절, 13 시퀀스 · 172칸 · 갈림 20칸).

| 전이(같은 경로) | L 응답(같은 프로세스) | F 응답(새 프로세스) | 시퀀스 |
|---|---|---|---|
| 미지원 1.2.1 → 빌드 전 1.7.0 (WI-0085 원 재현) | 미지원 안내(1.7.0) | 빌드 전 안내(1.7.0) | S1 · S2 |
| 미지원 1.2.1 → (빌드 전) → 정상 1.8.2 | 미지원 안내(1.8.2) | 브랜드 1개 · 상세 정상 | S2 |
| 위 상태에서 tokens 삭제 → 정상 1.8.2 재설치 | 미지원 안내(1.8.2) 그대로 | 정상 | S2 단계 5 |
| 정상 1.8.2 → 미지원 1.2.1 (다운그레이드) | 빌드 전 안내(1.2.1) | 미지원 안내(1.2.1) | S4 · S12 |
| 정상 1.8.2 → 같은 버전에 브랜드 zeta 추가(exports 2줄 추가) | **도구 오류**(`isError`, `Package subpath './brands/zeta/brand.json' is not defined by "exports"`) | 브랜드 2개 · zeta 상세 정상 | S8 |

같은 프로세스가 **따라간** 전이(갈림 0): 빌드 전 → 정상(S3), dist 삭제 · `index.json` 삭제 · `brand.json` 삭제와 복원(S3 · S6 · S7), version 문자열만 변경(S5), 1.7.0 → 1.8.2(S9), 미설치에서 처음 설치(S11), `axis.config.json` · `globals.css` 변경(S10 · S12 · S13). 공통점은 **`exports` 필드가 첫 해석 때와 같다**는 것이에요(반례 탐색 결과는 testplan 3절).

### 1.2 원인 (측정)

- AXIS 코드에는 판독 결과를 담는 캐시가 없어요. `brand-core.ts` 는 호출마다 `createRequire(...)` 를 새로 만들고(`:147-149`) `version` 은 `readFileSync` 로 새로 읽어요(`:165`)
- 낡음은 **Node 내부의 package.json 판독 캐시**에서 와요. `require.resolve` 가 패키지 `exports` 를 볼 때 읽은 package.json 을 프로세스가 끝날 때까지 지우지 않고, 공개된 무효화 API 도 없어요(`node:module` 공개 키에 해당 함수 없음, testplan 3.2). 새 `createRequire` 를 만들어도 캐시 키가 tokens package.json 경로라 같은 값이 나와요
- Node 단독 프로브(MCP 없이, 같은 경로에서 1.2.1 → 빌드 전 1.7.0 → 정상 1.8.2): 같은 프로세스 `createRequire().resolve("@axis-ds/tokens/brands")` 는 세 상태 모두 `ERR_PACKAGE_PATH_NOT_EXPORTED`, Worker 스레드와 자식 프로세스는 `ERR_PACKAGE_PATH_NOT_EXPORTED` → `MODULE_NOT_FOUND` → 해석 성공으로 따라가요(testplan 3.2)
- 영향 받는 호출은 `brand-core.ts` 의 Node 해석 세 곳이에요: `resolveTokens` `:169`(`./brands`), `readSummary` `:350`(`brand.json`), `getBrand` `:590`(브랜드 CSS). `exports` 에 없는 키를 만나면 `ERR_PACKAGE_PATH_NOT_EXPORTED` 를 「미지원」으로 분류하거나(`:173`) 그대로 던져(`readSummary` 경로) 도구 오류가 돼요
- `exports` 대상 파일의 존재 확인은 호출마다 새로 해요(Node 의 `Module._pathCache` 는 exports 해석 결과를 담지 않음). 그래서 dist 추가 · 삭제는 따라가요(S3 · S6 · S7). 단 이것은 메인 모듈의 동기 실행이 끝난 뒤의 호출에서만 성립해요. Node 는 메인 모듈을 동기로 실행하는 동안 stat 캐시를 켜 두어, 그 안에서 연달아 재면 dist 삭제도 못 따라가는 거짓 갈림이 나요(반박 검증 측정). MCP 도구 호출 · vitest 테스트 · 하네스는 모두 그 뒤의 비동기 호출이에요
- Node 가 기억하는 package.json 은 **찾은 경로 하나가 아니에요.** 패키지를 찾는 동안 읽은 후보 전부예요. 그래서 앱 안의 중첩 설치본을 지워 상위 설치본으로 넘어가면, Node 는 지워진 중첩 package.json 을 「있음」으로 기억한 채 그 `exports` 로 해석하다 `MODULE_NOT_FOUND` 를 내요(구현 뒤 반박 검증에서 찾음, testplan 4.9)

### 1.3 캐시 전수 (측정 · 코드 조사)

`packages/axis-mcp/src` · `packages/axis-registry-core/src` 의 최상위 `let` · `var`, 최상위 `new Map/Set/WeakMap`, `cache` · `memo` · `createRequire` · `require.resolve` · `import.meta.resolve` · `Module._*` 를 grep 으로 전수 조사했어요(테스트 파일 제외).

| # | 위치 | 담는 것 | 캐시 키 | 무효화 | 판정 |
|---|---|---|---|---|---|
| C1 | Node 내부 package.json 판독 캐시(`brand-core.ts:169` · `:350` · `:590` 의 `createRequire().resolve` 가 탐) | tokens package.json 의 `exports` 등 | package.json 경로(탐색한 후보마다) | 없음(프로세스 수명) | **낡음의 원인**(측정 S1 · S2 · S4 · S8 · S12, 중첩 설치본 제거는 반박 검증 측정) |
| C2 | Node `Module._pathCache` | 상대 · `node_modules` 경로 해석 결과 | 요청 + 탐색 경로 | 없음 | 무해. exports 해석 결과는 담지 않아 dist 추가 · 삭제를 따라감(측정 S3 · S6 · S7, 간접) |
| C3 | `axis-mcp/src/registry/loader.ts:24` `cachedComponents` | MCP 동봉 `dist/data/components.json` | 없음(단일 값) | `clearRegistryCache`(테스트용) | 무해. 대상 프로젝트가 아니라 MCP 패키지 안의 정적 파일이고, 바뀌는 때는 MCP 업그레이드(= 재시작)뿐(코드 조사) |
| C4 | `loader.ts:25` `cachedTokens` | MCP 동봉 `dist/data/tokens.json`(빌드 때 tokens dist 에서 생성, WI-0076) | 없음 | `clearRegistryCache` · `setTokenData`(테스트용) | 무해(C3 과 같음). `axis.list_tokens` · `axis.get_token` 은 원래 대상 프로젝트의 tokens 설치본을 읽지 않아요(설계) |
| C5 | `axis-registry-core/src/registry/index.ts:200-203` `RegistryClient` 의 `mode` · `indexPromise` · `bundledIndex` · `fallbackAnnounced` | 레지스트리 출처 · index | 인스턴스 | 인스턴스 수명 | 무해. MCP 는 호출마다 `createClientFor` 로 새 인스턴스를 만들어요(`axis-mcp/src/tools/registry-source.ts:64` 는 팩토리, `:74` 에서 호출마다 생성) |
| C6 | `axis-mcp/src/index.ts:62` `SERVER_VERSION` | MCP 자기 package.json 의 version | 없음 | 없음 | 무해(자기 패키지, 프로세스 수명 동안 불변) |
| C7 | `axis-mcp/src/registry/token-gen.mjs:272-275` `createRequire` · `require.resolve` | tokens dist 경로 | 해당 없음 | 해당 없음 | 무해. 빌드 때만 실행(런타임 아님) |
| C8 | registry-core 전체 | 최상위 가변 상태 0건, `createRequire` · `require.resolve` 런타임 호출 0건(주석과 생성 설정 문자열 `tailwind-core.ts:1697` 제외) | 해당 없음 | 해당 없음 | 무해. 설치본 판정은 `findInstalledPackage`(`project.ts:575`) 처럼 fs 로 직접 읽어요. `axis.check_project` 가 tokens 설치 · CSS · config 변경을 따라감(측정 S10 · S12 · S13) |

CLI: `brand-core.ts` 원본(`axis-cli/src/theme/brand-core.ts`, MCP 사본과 바이트 같음)을 써서 같은 Node 해석을 타요. 하지만 CLI 는 명령마다 새 프로세스이고 한 프로세스에서 tokens 를 한 번만 해석해요(`theme/index.ts:539` · `:548`, `theme-add.ts:341`). 해석과 설치 사이에 다시 해석하는 경로가 없어 **영향 없음**(착수 때는 코드 조사. 구현 뒤 측정: 발행본 cli 1.7.7 과 30쌍 바이트 같음, testplan 4.5).

### 1.4 결정

#### 사용자 결정 (2026-10-29: 권장안)

여섯 항목 모두 착수 측정 때 낸 권장안으로 정했어요.

| # | 질문 | 결정 | 이 WI 에서 |
|---|---|---|---|
| Q80 | 낡음을 어떻게 피할지 | 변경 감지 + 격리 해석(plan 2절 방식 B) | AC1 ~ AC4 · AC6 · AC12 |
| Q81 | 변경 감지 키 | package.json 내용 sha256(이미 매 호출 읽는 내용). 반박 검증 보정으로 찾은 경로뿐 아니라 그 앞의 후보 경로(없음 포함)까지 봐요 | AC5 · AC12 |
| Q82 | 적용 범위 | 낡음이 확인된 `brand-core.ts` Node 해석 세 곳만. C2 ~ C8 은 손대지 않음 | AC7 |
| Q83 | 격리 해석이 실패할 때(Worker 생성 불가 · 응답 없음) | 종전 Node 해석으로 폴백하고 응답에 재시작 안내 한 줄 | AC8 · AC13 |
| Q84 | changeset 범위 | `@axis-ds/mcp` · `@axis-ds/cli` patch 둘 다(원본이 cli 에 있어 소스 · 발행본 일치 유지) | AC10 |
| Q85 | Node 20 · 24 측정 시점 | 구현 검증 단계에서 재고, 착수는 막지 않음 | testplan 4.7 |

선택지 · 근거는 plan 2절 · 6절에 있어요. 구현 중 정한 동기 대기 방식(사용자 결정 아님)은 testplan 4.1 에 적었어요. 이 WI 진행 중 새로 생긴 결정 후보(Q86 · Q87)는 6절이에요.

#### 선례 · 코드로 정한 항목 (사용자 결정이 아님)

| 항목 | 답 | 근거 |
|---|---|---|
| 고칠 파일 | CLI 원본 `axis-cli/src/theme/brand-core.ts` 를 고치고 MCP 사본에 `cp`. MCP 포매터 `brand.ts` 에 폴백 안내 한 줄 | WI-0028 U1, `brand-core.test.ts` 바이트 동일성 테스트, Q83 |
| mtime · TTL 로 「우리 캐시」를 무효화 | 해당 없음. 무효화할 AXIS 캐시가 없고 Node 캐시는 지울 수 없어요. mtime 은 Q81 에서 감지 키 후보로 검토했고 내용 sha256 을 골랐어요 | 1.2 원인 |
| 상태 분류 규칙(미설치 · 미지원 · 빌드 전 · 정상) | 바꾸지 않아요. 같은 입력이면 새 프로세스 응답과 바이트 같아야 해요 | WI-0028 plan 3장 5 |
| 격리 해석 대기 한도 · 실패 래치 | 5 초. 한 번 실패하면 그 프로세스에서는 Worker 를 다시 만들지 않고 바로 폴백해요(반박 검증 위험 3: 원인이 남은 채 호출마다 한도만큼 멈추지 않게) | testplan 4.9 |
| 폴백 중 낡은 exports 로 못 읽는 새 브랜드 | 목록에서는 그 항목만 빼고, 상세는 「없는 이름」 꼴(`brand: null`)로 두며 둘 다 `stale` 표시(반박 검증 결함 2: 도구 오류로 끝나던 것) | Q87 권장안으로 구현, 2026-10-30 확정(6절). Q83 의 「도구 오류로 끝나지 않음」을 지키는 갈래 |

### 1.5 목표

- 같은 MCP 프로세스 안에서 tokens 상태가 바뀌면 다음 호출 응답이 새 프로세스 응답과 같아요
- tokens 가 바뀌지 않은 호출은 지금과 같은 코드 경로 · 같은 비용이에요(새 축이 없을 때 종전 동작)
- CLI 출력은 바이트 불변이에요

### 1.6 범위

- 포함: `brand-core.ts`(원본 · 사본)의 tokens 해석 세 곳, mcp `brand.ts` 포매터의 폴백 안내 한 줄, 같은 프로세스 회귀 테스트(cli · mcp vitest, 테스트 헬퍼 `test-helpers.ts` 의 `installTokens`), stdio 하네스 재측정
- 제외: C2 ~ C8(무해), `axis.list_tokens` 가 대상 프로젝트 tokens 를 읽게 하는 것(별개 설계 질문), Yarn PnP · pnpm 심링크 레이아웃 고유 동작(testplan 5절 미측정으로 둠)

## 2. 수용 기준

「음성 대조」는 발행본 mcp 1.4.6 에서 실패가 재현되는지(측정 완료)예요. 「회귀 가드」는 수정 없이도 통과하는 기준이라 수정의 증거가 아니고, 그 가드를 깨는 변이(AC9)로 살아 있음을 보여요. 모든 AC 의 판정 기준은 **같은 경로 새 프로세스 응답과 바이트 같음**이에요(경로 문자열은 `<FX>` 로 정규화).

- **AC1**(원 재현): 같은 프로세스에서 미지원 1.2.1 → 빌드 전 1.7.0 으로 바꾸면 `axis.list_brands` · `axis.get_brand` 가 빌드 전 안내를 내요
  - 측정: 하네스 S1 · S2 단계 2, L = F
  - 음성 대조: 발행본 L 은 미지원 안내(1.7.0), F 는 빌드 전 안내(측정 완료, 2회 실행 같음)
- **AC2**(업그레이드 · 재설치): 미지원 → 정상 1.8.2, 그리고 삭제 뒤 재설치에서 정상 응답이에요
  - 측정: S2 단계 3 · 5, L = F
  - 음성 대조: 발행본 L 은 미지원 안내(1.8.2)(측정 완료)
- **AC3**(다운그레이드): 정상 1.8.2 → 미지원 1.2.1 에서 미지원 안내예요
  - 측정: S4 단계 1 · S12 단계 4, L = F
  - 음성 대조: 발행본 L 은 빌드 전 안내(1.2.1)(측정 완료)
- **AC4**(exports 키 추가): 같은 버전에서 브랜드가 추가되면(`exports` 키 추가) `list_brands` 가 새 브랜드를 포함하고 `get_brand` 가 새 브랜드 상세를 내요. 도구 오류(`isError`)가 없어요
  - 측정: S8 단계 1, L = F
  - 음성 대조: 발행본 L 은 `isError`(측정 완료)
- **AC5**(변경 없는 경로 불변): tokens package.json 이 첫 판독과 같으면 격리 해석을 타지 않고, 같은 프로세스 연속 호출 비용이 발행본과 같은 자릿수예요
  - 측정: 단위 테스트 「package.json 이 첫 해석과 같으면 격리 해석을 하지 않음」(Worker 수 증가 0, 지우고 같은 내용으로 다시 설치해도)과 호출 지연(testplan 4.6). Q81 이 내용 sha256 이라 exports 는 같고 내용만 바뀐 전이(S3 · S5 · S9)도 격리 해석을 타요(결과는 같음, 비용만 붙음). 내용이 같은 S6 · S7 · S11 은 타지 않아요(코드 경로, 하네스에서 횟수를 세지는 않음)
- **AC6 회귀 가드**(이미 따라가던 전이): S3 · S5 · S6 · S7 · S9 · S10 · S11 · S13 의 L 응답이 발행본과 바이트 같고 F 와도 같아요
  - 측정: 하네스 발행본 · 수정본 A/B
- **AC7 회귀 가드**(범위): C2 ~ C8 위치의 코드가 바뀌지 않아요. 바뀐 파일은 `brand-core.ts` 두 파일 · mcp `brand.ts`(폴백 안내 한 줄) · 테스트(`test-helpers.ts` 포함) · changeset · 문서뿐이에요
- **AC8**(폴백, Q83): 격리 해석을 만들 수 없으면 종전 Node 해석 결과를 내고 응답에 재시작 안내 한 줄을 붙여요. 도구 오류로 끝나지 않아요(폴백 중 새로 생긴 브랜드도 포함)
  - 측정: 단위 테스트에서 격리 해석 함수를 실패하게 주입, 폴백 중 브랜드 추가(반박 검증 결함 2)
- **AC9**(변이): 아래 변이를 하나씩 넣으면 테스트가 1건 이상 빨개지거나 테스트 실행이 실패해요. V1 변경 감지 제거(항상 Node 해석, 원래 결함) · V2 감지 키를 version 문자열로(같은 버전 exports 변경을 놓침) · V3 항상 격리 해석(AC5 빨강) · V4 바뀐 판정에서도 기록을 덮어씀(바뀐 뒤 두 번째 호출이 「같음」으로 보여 Node 의 낡은 캐시로 돌아감) · V5 폴백에서 안내 줄 누락 · V6 폴백에서 `stale` 표시 누락 · V7 감지를 찾은 경로 하나로 좁힘(AC12) · V8 Worker `error` 리스너 제거(AC13) · V9 실패 래치 제거(AC13) · V10 · V12 폴백 중 낡은 exports 항목을 도구 오류로 둠(AC8) · V11 경합 사후 점검 끔(AC14)
- **AC10**(CLI 불변 · 릴리스): CLI `theme list` · `theme info` · `theme add` 출력이 바이트 같아요(기존 테스트 기대 변경 0). `brand-core.test.ts` 바이트 동일성 통과. `.changeset/` 에 Q84 결과대로 patch 가 있고 `pnpm check-changeset-mcp-tokens` rc 0
- **AC11**(회귀 테스트가 결함을 잡는지): 새 vitest 회귀 테스트(한 프로세스에서 같은 경로 fixture 의 tokens package.json 을 바꾸고 두 번 판정)를 수정 전 소스에 돌리면 빨강, 수정본에서 초록이에요
  - 근거: vitest 도 한 프로세스라 Node 캐시가 같은 방식으로 남아요(측정, testplan 4.2)
- **AC12**(중첩 설치본 제거, 반박 검증 결함 1): 앱 안의 중첩 tokens 를 지워 상위 설치본으로 넘어가면 상위 설치본으로 판정해요(새 프로세스와 같음)
  - 측정: 단위 테스트, 반박 검증 재현 `e2-dedupe`(상위 1.8.2 · 1.7.0 두 갈래)
  - 음성 대조: 보정 전 구현은 `not-built`(반박 검증 측정)
- **AC13**(Worker 실패, 반박 검증 위험 2 · 3): Worker 가 시작 중에 던지거나 끝나도 프로세스가 죽지 않고 폴백하며, 그 뒤로는 Worker 를 다시 만들지 않아요
  - 측정: 단위 테스트(시작 중 throw · `process.exit`, 한도 300 ms 로 주입)
  - 음성 대조: `error` 리스너가 없던 패턴은 한도 뒤 처리되지 않은 오류로 프로세스가 rc 1 로 끝남(반박 검증 측정, 변이 V8)
- **AC14**(경합, 반박 검증 위험 1): 기록한 뒤 Node 가 읽기 전에 package.json 이 바뀌면 격리 해석으로 다시 판정하고, 그 경로는 그 뒤로도 격리 해석해요
  - 측정: 단위 테스트(`fs.readFileSync` 가로채기 + `syncBuiltinESMExports`), 반박 검증 재현 `e8-race`
  - 음성 대조: 보정 전 구현은 되돌린 1.2.1 을 `not-built` 로 판정(반박 검증 측정)

## 3. 종료 코드 · 출력 변화

- MCP 도구에는 종료 코드가 없어요. 바뀌는 것은 상태가 바뀐 뒤 같은 세션의 응답 문구뿐이고, 새 프로세스 응답과 같아져요
- S8 류(같은 버전 exports 변경)에서 `isError` 응답이 정상 응답으로 바뀌어요
- CLI 는 바뀌지 않아요

## 4. 위험

- 격리 해석(Worker)은 호출 하나에 약 25 ~ 29 ms 가 더 들어요(측정, Node 22 MCP 왕복, testplan 4.6). Q81 이 내용 sha256 이라 tokens 가 바뀐 뒤 그 서버 세션의 모든 브랜드 호출이 이 비용을 내요(Q86)
- Worker 응답을 기다리는 동안 메인 스레드가 막혀요(동기 대기). 정상이면 수십 ms 이고, Worker 가 응답하지 못하면 최대 5 초 한 번이에요(그 뒤 래치)
- Worker 도 `createRequire(<baseDir>/package.json)` 의 기본 조건(require)으로 해석해 메인 스레드와 조건이 같아요(plan 3절 3). 해소: 빌드본 하네스 재측정 갈림 0(testplan 4.3)
- 번들(tsup) 결과에서 Worker 코드 문자열이 깨질 위험은 해소됐어요: 번들에 새 코드가 그대로 있고 빌드본 하네스가 갈림 0 이에요(testplan 4절 머리말 · 4.3)

## 5. 잔여 오차

- Node 20 미측정(이 머신에 없고, 배포본 내려받기가 시간 초과). Node 20 은 package.json 캐시가 JS `Map` 이라 같은 낡음이 날 것으로 **추정**. Node 20 은 「없음」도 기억할 것으로 추정되는데, 감지 키가 후보의 「없음」 상태까지 보므로 중첩 설치본이 새로 생기는 방향도 격리 해석으로 가요(코드 경로, 미측정). Node 24 는 구현 검증에서 쟀어요(testplan 4.7)
  - 정정(2026-10-29 구현 단계): 착수 때 「이 머신에 Node 22.22.0 하나」라고 적었는데 틀렸어요. nvm 에 v24.14.1 · v24.18.0 이 있었고, 착수 조회(`ls ~/.nvm/versions/node`)는 작업용으로 바뀐 `$HOME` 을 따라가 빈 결과였어요. 그 빈 결과를 「없음」으로 읽은 것이 잘못이었어요
- pnpm 심링크 레이아웃 · Yarn PnP 레이아웃은 하네스로 재지 않았어요. 반박 검증이 pnpm 식 심링크 교체 10단계와 호이스팅(중첩 제거 · 추가)을 재현 스크립트로 쟀고 새 프로세스와 같았어요(testplan 4.9). 감지 키 경로와 Node 캐시 키 경로는 둘 다 실경로가 아닌 원래 경로 문자열이라 어긋나지 않아요(코드 조사)
- `import.meta.resolve` 경로는 프로브 호출 형태가 맞지 않아 세 상태 모두 같은 오류였어요(미측정, 현재 코드는 쓰지 않음)
- `axis.apply_template` · `axis.diff_template` · `axis.install_component` · 레지스트리 도구 · `axis.prompt.*` 는 하네스에 넣지 않았어요. 코드 조사로 Node 해석을 타지 않음을 확인했어요(C5 · C8)
- 경합은 사후 점검으로 가리지만, 기록과 사후 점검 사이에 두 번 바뀌어 처음 내용으로 돌아오는 경우는 가리지 못해요(추정, 창이 설치 도중의 아주 짧은 순간)

## 6. 열린 확인 (호출한 쪽에서 확인 필요)

Q80 ~ Q85 는 2026-10-29 에 정해졌어요(1.4). 진행 중 새로 생긴 결정 후보는 아래 둘이고, 둘 다 권장안대로 구현해 두었어요. 2026-10-30 사용자가 둘 다 권장안 ①로 확정했어요.

| # | 질문 | 선택지 | 권장(지금 구현) | 근거 |
|---|---|---|---|---|
| Q86 | tokens 가 바뀐 뒤 같은 세션의 브랜드 호출마다 Worker 를 새로 띄우는 비용(약 25 ~ 29 ms)을 줄일지 | ① 그대로 둠 / ② 「경로 + 내용 sha」별로 격리 해석 결과를 기억 / ③ Worker 를 세션 동안 살려 둠 | **①** | ② 는 우리가 무효화를 책임지는 새 캐시를 다시 만드는 것이라 이 WI 가 없앤 부류의 결함을 다시 들일 수 있어요. ③ 은 Worker 의 Node 캐시가 다시 낡아요(Worker 도 첫 판독을 기억). 비용은 바뀐 세션에만, 재시작하면 사라져요 |
| Q87 | 폴백(Q83) 중 새로 생긴 브랜드를 어떻게 보일지 | ① 목록에서 빼고 상세는 「없는 이름」 + stale 안내 / ② 그 브랜드만 도구 오류 / ③ 폴백이면 브랜드 판정 전체를 「측정 못 함」으로 | **①** | Q83 의 「도구 오류로 끝나지 않음」을 지키고, 나머지 브랜드는 종전 판정 그대로 보여요. 안내 줄이 재시작을 알려요 |
