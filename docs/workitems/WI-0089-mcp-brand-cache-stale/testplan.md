# WI-0089: MCP 브랜드 도구의 tokens 판독 낡음 테스트 계획

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 작성일: 2026-10-29 | 상태: 착수 측정(2026-10-29, 2절 · 3절) · 구현 측정과 반박 검증 보정(2026-10-29, 4절)
> 측정 산출물(세션 scratchpad, 커밋하지 않음): `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/7a29a557-9ebc-48a8-a772-89e5ee57e773/scratchpad/wi0089/` 이하 `$S`. 하네스 `$S/scripts/harness.mjs`(sha256 앞 16자 2c213d063342ea9f, S13 추가 뒤 값), Node 단독 프로브 `$S/scripts/probe-node.mjs`(2edea95a01c84a2f), 요약 `$S/scripts/analyze.py` · `table.py` · `cmp_runs.py`, 결과 `$S/out/pub-1.4.6.json`(1차) · `pub-1.4.6-run2.json`(2차, S1 ~ S12) · `pub-1.4.6-s13.json`(S13) · `probe-node.json`
> 기준: 발행본 mcp 1.4.6(`$S/../pub/node_modules/@axis-ds/mcp`, `dist/index.js` sha256 앞 12자 87f1bd34cdd7), Node v22.22.0. 소스 `main` e103d43 은 발행 커밋 1e8da06 이후 `packages/` 변경 0줄이라 발행본과 같아요

## 1. 하네스

- **오래 사는 프로세스 L**: 시퀀스마다 새 픽스처 `$S/work/fx/<시퀀스>` 를 만들고 첫 상태에서 MCP 를 stdio 로 띄워(`initialize` · `notifications/initialized`), 같은 프로세스를 끝까지 써요. 상태를 바꿀 때마다 같은 도구를 다시 불러요
- **새 프로세스 F(양성 대조)**: 상태마다 같은 경로에서 MCP 를 하나 더 띄워 같은 도구를 부르고 닫아요. L 과 F 가 갈리는 칸이 캐시 낡음이에요. 경로 문자열은 `<FX>` 로 정규화해 비교해요
- 자식 env 는 `PATH` · 새 `HOME` · 새 `XDG_CONFIG_HOME` 만이에요. 조상 가드(`$S/scripts/guard.py`, package.json · lockfile · 워크스페이스 · 저장소 표지 · node_modules · axis.config.json · `.pnp.cjs`): 픽스처 `$S/work/fx/S1_wi0085/app` 에서 시작하면 픽스처 자신의 3개(package.json · axis.config.json · node_modules)만 잡히고 그 위로는 **0개**예요. 같은 스크립트가 worktree 의 `packages/axis-mcp` 에서는 10개를 잡아 계측이 살아 있어요
- 픽스처: `package.json`(`@axis-ds/tokens` `^1.6.0` 앱 선언, S13 단계 2 에서 제거) · `axis.config.json`(`brand: ontology`, `globalCss: app/globals.css`) · `app/globals.css`(ontology 브랜드 import)
- tokens 는 npm 발행본 tarball 을 그대로 풀어 써요(1.2.1 sha256 5a7edbf9… · 1.7.0 5c33d04e… · 1.8.2 d221a3fa…). 1.2.1 은 `exports` 에 `./brands` 가 없고, 1.7.0 · 1.8.2 는 브랜드 키 3개(`./brands` · `./css/brands/ontology` · `./brands/ontology/brand.json`, 모두 문자열 값)가 같아요
- 도구: tools/list 실측 18개 가운데 대상 프로젝트를 읽는 것이 `axis.install_component` · `axis.apply_template` · `axis.diff_template` · `axis.check_project` · `axis.list_brands` · `axis.get_brand`(`targetDir` 인자, list · search · get_component 는 cwd 의 config 로 레지스트리를 고름)예요. 하네스는 tokens 상태를 판정하는 `list_brands` · `get_brand`(ontology · 없는 이름 zeta) · `check_project` 를 불러요. 나머지는 5절

### 1.1 상태

| 기호 | 상태 | 만드는 법(같은 경로 `node_modules/@axis-ds/tokens`) |
|---|---|---|
| A | 미설치 | 디렉터리 삭제 |
| U | 미지원 1.2.1 | 1.2.1 tarball 전체 |
| N | 빌드 전 1.7.0 | 1.7.0 의 package.json 만 |
| K7 | 정상 1.7.0 | 1.7.0 tarball 전체 |
| K | 정상 1.8.2 | 1.8.2 tarball 전체 |
| V | version 만 변경 | K 의 package.json `version` 을 1.8.3 으로 |
| Dd | dist 삭제 | K 에서 `dist/` 통째 삭제 |
| Dx | index 삭제 | K 에서 `dist/brands/index.json` 삭제 |
| Dm | brand.json 삭제 | K 에서 `dist/brands/ontology/brand.json` 삭제 |
| Da | 브랜드 추가(exports 변경) | K 에 zeta 브랜드(index 항목 · brand.json · CSS)와 `exports` 키 2개 추가 |
| Cm · Cb · Ct · P0 | 프로젝트 쪽(tokens 밖) | globals.css 브랜드 import 삭제 · config brand 를 zeta 로 · globals.css 에 `@axis-ds/tokens/css` import 추가 · 앱 package.json 에서 tokens 선언 제거 |

매 단계 증거(`evidence`)로 tokens package.json sha256 · version · `./brands` export 유무 · 주요 dist 파일 유무 · globals.css import 유무를 함께 기록해, 상태 변화가 실제로 일어났음을 칸마다 남겨요.

## 2. 착수 측정 (2026-10-29, 발행본 mcp 1.4.6)

### 2.1 요약

| 지표 | 값 |
|---|---|
| 칸(시퀀스 13 · 단계 43 · 도구 4) | 172 (2차 S1 ~ S12 152 + S13 20) |
| L · F 갈림 | **20** (S1 3 · S2 9 · S4 3 · S8 2 · S12 3), check_project 갈림 0 |
| 재현성 | 1차(S1 ~ S11, 132칸)와 2차의 갈림 집합이 17/17 같고 2차에만 있는 3칸은 1차에 없던 S12 |
| 양성 대조(F 가 상태를 따라감) | list_brands F 응답이 상태마다 미설치 · 미지원(1.2.1) · 빌드 전(1.7.0 · 1.8.2) · ok 1개(1.7.0 · 1.8.2 · 1.8.3) · ok 2개로 갈라짐. check_project F 는 브랜드 import PASS → WARN(Cm), brand zeta(Cb), globals 변수 없음 → PASS(Ct), PASS → 해석 불가 WARN → PASS(S13 A · K) |
| WI-0085 원 재현(같은 경로 미지원 1.2.1 → 빌드 전 1.7.0) | 재현됨(S1 단계 1: L 미지원 안내(1.7.0), F 빌드 전 안내(1.7.0)) |

### 2.2 칸별 표

굵은 칸이 L · F 갈림이고 「L / F」 순서예요. 「(같음)」은 L = F(바이트 같음)예요. check_project 는 판정 줄 가운데 globals · 브랜드 import 두 항목만 요약했어요(다른 줄은 모든 칸에서 같음: config PASS · tailwind.config FAIL · utils.ts WARN · tailwindcss 누락 FAIL · 루트 레이아웃 활성화 WARN).

| 시퀀스 | 단계 | 상태 | list_brands L / F | get_brand ontology L / F | get_brand zeta L / F | check_project |
|---|---|---|---|---|---|---|
| S1 | 0 U | 미지원 1.2.1(dist 있음) | 미지원 안내(1.2.1) (같음) | 미지원 안내(1.2.1) (같음) | 미지원 안내(1.2.1) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S1 | 1 N | 빌드 전 1.7.0(package.json 만) | **미지원 안내(1.7.0)** / 빌드 전 안내(1.7.0) | **미지원 안내(1.7.0)** / 빌드 전 안내(1.7.0) | **미지원 안내(1.7.0)** / 빌드 전 안내(1.7.0) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S2 | 0 A | 미설치 | 미설치 안내 (같음) | 미설치 안내 (같음) | 미설치 안내 (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S2 | 1 U | 미지원 1.2.1(dist 있음) | 미지원 안내(1.2.1) (같음) | 미지원 안내(1.2.1) (같음) | 미지원 안내(1.2.1) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S2 | 2 N | 빌드 전 1.7.0(package.json 만) | **미지원 안내(1.7.0)** / 빌드 전 안내(1.7.0) | **미지원 안내(1.7.0)** / 빌드 전 안내(1.7.0) | **미지원 안내(1.7.0)** / 빌드 전 안내(1.7.0) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S2 | 3 K | 정상 1.8.2 | **미지원 안내(1.8.2)** / ok 1.8.2 브랜드 1개(ontology) | **미지원 안내(1.8.2)** / 상세 ok | **미지원 안내(1.8.2)** / 없는 이름(1.8.2, 목록 ontology) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S2 | 4 A | 미설치 | 미설치 안내 (같음) | 미설치 안내 (같음) | 미설치 안내 (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S2 | 5 K | 정상 1.8.2 | **미지원 안내(1.8.2)** / ok 1.8.2 브랜드 1개(ontology) | **미지원 안내(1.8.2)** / 상세 ok | **미지원 안내(1.8.2)** / 없는 이름(1.8.2, 목록 ontology) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S3 | 0 N | 빌드 전 1.7.0(package.json 만) | 빌드 전 안내(1.7.0) (같음) | 빌드 전 안내(1.7.0) (같음) | 빌드 전 안내(1.7.0) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S3 | 1 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S3 | 2 Dd | 정상 1.8.2 에서 dist 통째 삭제(package.json 유지) | 빌드 전 안내(1.8.2) (같음) | 빌드 전 안내(1.8.2) (같음) | 빌드 전 안내(1.8.2) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S3 | 3 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S4 | 0 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S4 | 1 U | 미지원 1.2.1(dist 있음) | **빌드 전 안내(1.2.1)** / 미지원 안내(1.2.1) | **빌드 전 안내(1.2.1)** / 미지원 안내(1.2.1) | **빌드 전 안내(1.2.1)** / 미지원 안내(1.2.1) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S4 | 2 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S5 | 0 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S5 | 1 V | 정상 1.8.2 의 package.json version 만 1.8.3 | ok 1.8.3 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.3, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S6 | 0 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S6 | 1 Dx | 정상 1.8.2 에서 dist/brands/index.json 삭제 | 빌드 전 안내(1.8.2) (같음) | 빌드 전 안내(1.8.2) (같음) | 빌드 전 안내(1.8.2) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S6 | 2 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S7 | 0 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S7 | 1 Dm | 정상 1.8.2 에서 dist/brands/ontology/brand.json 삭제 | 빌드 전 안내(1.8.2) (같음) | 빌드 전 안내(1.8.2) (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S7 | 2 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S8 | 0 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S8 | 1 Da | 정상 1.8.2 에 브랜드 zeta 추가(index.json · brand.json · css · exports 2줄) | **isError 오류: Package subpath './brands/zeta/brand.json' is not defined by "exports" in <F** / ok 1.8.2 브랜드 2개(ontology,zeta) | 상세 ok (같음) | **isError 오류: Package subpath './brands/zeta/brand.json' is not defined by "exports" in <F** / 상세 ok | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S8 | 2 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S9 | 0 K7 | 정상 1.7.0 | ok 1.7.0 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.7.0, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S9 | 1 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S10 | 0 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S10 | 1 Cm | globals.css 의 브랜드 import 를 지움 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import WARN (같음) |
| S10 | 2 Cb | axis.config.json brand 를 zeta 로 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand zeta import WARN (같음) |
| S11 | 0 A | 미설치 | 미설치 안내 (같음) | 미설치 안내 (같음) | 미설치 안내 (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S11 | 1 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S12 | 0 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S12 | 1 Ct | globals.css 에 tokens CSS import 추가 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals PASS · brand ontology import PASS (같음) |
| S12 | 2 A | 미설치 | 미설치 안내 (같음) | 미설치 안내 (같음) | 미설치 안내 (같음) | globals PASS · brand ontology import PASS (같음) |
| S12 | 3 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals PASS · brand ontology import PASS (같음) |
| S12 | 4 U | 미지원 1.2.1(dist 있음) | **빌드 전 안내(1.2.1)** / 미지원 안내(1.2.1) | **빌드 전 안내(1.2.1)** / 미지원 안내(1.2.1) | **빌드 전 안내(1.2.1)** / 미지원 안내(1.2.1) | globals PASS · brand ontology import PASS (같음) |
| S13 | 0 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals 변수 없음 WARN · brand ontology import PASS (같음) |
| S13 | 1 Ct | globals.css 에 tokens CSS import 추가 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals PASS · brand ontology import PASS (같음) |
| S13 | 2 P0 | 앱 package.json 에서 tokens 선언 제거 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals PASS · brand ontology import PASS (같음) |
| S13 | 3 A | 미설치 | 미설치 안내 (같음) | 미설치 안내 (같음) | 미설치 안내 (같음) | globals 해석 불가 WARN · brand ontology import PASS (같음) |
| S13 | 4 K | 정상 1.8.2 | ok 1.8.2 브랜드 1개(ontology) (같음) | 상세 ok (같음) | 없는 이름(1.8.2, 목록 ontology) (같음) | globals PASS · brand ontology import PASS (같음) |

### 2.3 읽는 법

- 갈림 20칸은 모두 **`exports` 필드가 L 의 첫 Node 해석 때와 다른** 단계예요(S1 · S2 는 첫 해석이 1.2.1, S4 · S12 는 1.8.2, S8 은 1.8.2 에 키 추가)
- L 은 낡은 판정에 **새 버전 문자열**을 붙여요(S2 단계 3 「미지원 안내(1.8.2)」). version 은 `readFileSync` 로 매번 읽고(`brand-core.ts:165`) 판정만 낡아요
- 삭제 뒤 재설치(S2 단계 4 → 5)로도 풀리지 않아요. 미설치 단계(A)는 `existsSync` 로 판정해 L 도 맞게 「미설치」를 내지만, 다시 설치하면 첫 해석 때의 `exports` 로 돌아가요
- S8 은 안내가 아니라 **도구 오류**예요. `readSummary` 의 Node 해석이 `ERR_PACKAGE_PATH_NOT_EXPORTED` 를 던지고, `listBrands` 는 그 코드를 빌드 전으로 바꾸지 않아(`isMissingBuildFile` 은 `MODULE_NOT_FOUND` · `ENOENT` 만) 그대로 올라가요
- 이 픽스처는 tokens 를 앱에 선언해서 check_project 의 tokens CSS 판정이 설치 여부와 무관하게 PASS 예요(S12 단계 2, WI-0097 Q28 「앱 선언은 미설치여도 pass」). 그래서 S12 로는 check 의 tokens 설치 축에 양성 대조가 없어, 선언을 뺀 S13 을 더해 그 축을 쟀어요(F 가 PASS → WARN → PASS 로 움직였고 L 도 같음)

## 3. 원인 분리 (2026-10-29)

### 3.1 반례 탐색 (규칙: 「`exports` 가 첫 해석과 다를 때만 낡음」)

| 시퀀스 | package.json 내용 | exports | 갈림 | 규칙과 |
|---|---|---|---|---|
| S5(K → V) | 바뀜(sha 8ddc3c → e62169) | 같음 | 0 | 맞음 |
| S9(K7 → K) | 바뀜(9cc40f → 8ddc3c) | 같음 | 0 | 맞음 |
| S3(N → K → Dd → K) | 바뀜 | 같음 | 0 | 맞음(dist 추가 · 삭제는 따라감) |
| S6 · S7(파일 삭제 · 복원) | 같음 | 같음 | 0 | 맞음 |
| S11(A → K) | 첫 Node 해석이 K | 해당 없음 | 0 | 맞음(미설치 단계는 Node 해석을 부르지 않음) |
| S1 · S2 · S4 · S8 · S12 | 바뀜 | **바뀜** | 20 | 맞음 |

내용이 바뀌었는데 exports 가 같은 칸(S3 · S5 · S9)에서 갈림이 0 이라, 「package.json 이 바뀌면 낡는다」가 아니라 「exports 가 바뀌면 낡는다」예요. 감지 키 결정(Q81)에서 내용 sha 를 고르면 S3 · S5 · S9 에서 불필요한 격리 해석이 일어나는 이유예요.

### 3.2 Node 단독 프로브 (`probe-node.mjs`, MCP 없음)

같은 경로에서 1.2.1(전체) → 1.7.0(package.json 만) → 1.8.2(전체) 로 바꾸며 `@axis-ds/tokens/brands` 를 해석했어요.

| 상태 | 같은 프로세스 `createRequire().resolve` | Worker 스레드 | 자식 프로세스 | `import.meta.resolve` |
|---|---|---|---|---|
| 미지원 1.2.1 | `ERR_PACKAGE_PATH_NOT_EXPORTED` | `ERR_PACKAGE_PATH_NOT_EXPORTED` | `ERR_PACKAGE_PATH_NOT_EXPORTED` | 미측정(세 상태 모두 `ERR_MODULE_NOT_FOUND`, 부모 URL 을 넘기는 호출 형태가 이 Node 에서 맞지 않음) |
| 빌드 전 1.7.0 | **`ERR_PACKAGE_PATH_NOT_EXPORTED`**(낡음) | `MODULE_NOT_FOUND` | `MODULE_NOT_FOUND` | 미측정 |
| 정상 1.8.2 | **`ERR_PACKAGE_PATH_NOT_EXPORTED`**(낡음) | 해석 성공 `dist/brands/index.json` | 해석 성공 | 미측정 |

- MCP 없이 Node 만으로 같은 낡음이 나서 원인이 Node 내부 캐시임을 갈랐어요. Worker 는 자기 환경의 캐시를 따로 가져 새 상태를 따라가요
- `node:module` 공개 키(`_cache` · `_pathCache` · `findPackageJSON` · `enableCompileCache` 등)에 package.json 판독 캐시를 지우는 함수는 없어요
- 호출 하나당 평균 비용: `createRequire().resolve` 0.040 ms(200회) · Worker 27.4 ms(20회) · 자식 프로세스 23.7 ms(20회) · package.json `readFileSync` + `JSON.parse` 0.012 ms(200회) · `statSync` 0.004 ms(200회)

## 4. 구현 측정 (2026-10-29)

수정본은 이 브랜치의 작업 트리를 `turbo run build --force` 로 빌드하고 `pnpm pack` 한 tarball(버전 문자열은 1.4.6 · 1.7.7 그대로)을 새 디렉터리에 `npm install` 한 것이에요. 반박 검증(4.9) 보정 뒤의 **최종본**은 `$S/final/tools`(mcp tarball sha256 앞 16자 6683b9017d73e1a9 · 번들 `dist/index.js` d87e5688453b24f5, cli tarball 7b2a8d92f975b2f6 · 번들 0ff9f375ade03c0f)이고, 아래 표는 따로 적지 않으면 최종본 값이에요. 보정 전 1차 구현(`$S/impl/tools`, mcp 번들 e0f90252…)의 값은 4.9 에 남겼어요. 발행본은 착수와 같은 mcp 1.4.6 · cli 1.7.7 이에요. 측정 스크립트는 `$S/scripts/` 의 `harness.mjs` · `cost.mjs` · `cli_ab.mjs` · `mutants.py` · `main_red.py` · `main_count.py` · `cmp_ab.py` · `cmp_runs.py` 예요. 원본 · 사본 `brand-core.ts` sha256 은 9d5618886a318e25… 로 같아요.

### 4.1 동기 대기 방식 (사용자 결정 아님, plan 3절 3)

- **Worker + `Atomics.wait` 동기 대기**를 골랐어요. 기준은 「CLI 출력 바이트 불변」이에요. 브랜드 코어의 `resolveTokens` · `listBrands` · `getBrand` 는 동기이고 CLI 호출지 세 곳(`theme/index.ts` 의 list · info, `theme-add.ts`)이 반환값을 바로 써요. async 로 바꾸면 그 호출지와 렌더 순서까지 코드 경로가 바뀌어요. 동기 대기면 함수 서명과 CLI 호출지는 그대로이고, CLI 는 처음 보는 경로만 만나서 새 갈래에 들어가지도 않아요
- 자식 프로세스(`spawnSync`)를 버린 이유: MCP 를 내장 Node(Electron 등)에서 띄우면 `process.execPath` 가 Node 가 아닐 수 있고, 부모 `NODE_OPTIONS` 를 물려받아요. Worker 는 같은 프로세스 · 같은 Node 예요
- 결과: CLI 출력 A/B 30쌍 바이트 같음(4.5)

### 4.2 회귀 테스트 빨강 · 초록 (AC11)

| 측정 | cli | mcp |
|---|---|---|
| main(e103d43) 전체 테스트 수(`main_count.py`: 바뀐 6파일을 main 판으로 되돌려 vitest 전체, 원복 sha 일치) | 1096 통과 | 231 통과 |
| 수정본 전체 테스트 수(`turbo … test --force`) | 1109 통과(+13) | 234 통과(+3) |
| 새 테스트를 main 제품 소스에 돌림(`main_red.py`: 제품 3파일만 main 판, 테스트 · 헬퍼는 그대로, 원복 sha 일치) | **13 빨강** / 13 | **3 빨강** / 3 |
| 새 테스트 가운데 반박 검증 4건을 보정 전 1차 구현에 돌림 | 4 빨강 / 4 | 해당 없음 |
| 기존 테스트 기대 변경 | 0 | 0 |

- cli 13 빨강의 내역: 동작 단언이 빨강인 것 8건(1.2 → 빌드 전 1.3 이 unsupported 그대로 · 1.2 → 1.3 이 unsupported · 1.3 → 1.2 가 not-built · 브랜드 추가가 `ERR_PACKAGE_PATH_NOT_EXPORTED` 로 던짐 · 연속 변경의 두 번째가 unsupported · 중첩 설치본 제거 · 폴백 중 브랜드 추가 · 경합). 새 API(`isolatedResolveStats` · `setIsolatedResolveFactoryForTest` · `workerResolveSessionForTest`)가 main 에 없어 빨강인 것 5건이에요. 그 가운데 「처음 보는 경로에는 stale 필드가 없음」은 동작으로는 main 에서도 성립하는 가드인데, describe 의 `afterEach` 가 없는 함수를 불러 같이 빨개졌어요. 그래서 이 행은 수정의 증거가 아니라 4.4 변이 V6 · 4.5 CLI A/B 가 지켜요
- 보정 전 1차 구현에서 빨강인 4건: 중첩 설치본 제거(not-built) · 폴백 중 브랜드 추가(던짐) · 경합(되돌린 1.2.1 이 not-built) · Worker 비동기 실패(이 행은 새 테스트 함수가 1차 구현에 없어 빨강. 동작은 변이 V8 · V9 가 가려요)
- mcp 3 빨강: 동작 2건(1.2 → 빌드 전 1.3 응답 글, 1.3 → 1.2 응답) · 폴백 안내 1건(새 API 없음)

### 4.3 하네스 A/B (AC1 ~ AC6)

같은 `harness.mjs` 를 발행본 · 최종본으로 돌렸어요(Node 22.22.0 은 `out/pub-all.json` · `out/final-all.json`, Node 24.18.0 은 `out/n24-pub-abs.json` · `out/n24-final.json`).

| 지표 | 발행본 | 최종본 Node 22 | 최종본 Node 24 |
|---|---|---|---|
| L · F 갈림(172칸) | 20(착수 2차와 같은 20칸, 1차의 17칸 포함. Node 22 에서 세 번째 · Node 24 에서도 재현) | **0** | **0** |
| F(새 프로세스) 응답이 발행본과 바이트 같음 | 해당 없음 | 172 / 172 | 172 / 172 |
| AC6 가드: 발행본에서 갈리지 않던 L 칸이 발행본 L 과 바이트 같음 | 해당 없음 | 152 / 152 | 152 / 152 |
| 고친 칸: 발행본에서 갈리던 L 칸이 발행본 F 와 바이트 같음 | 해당 없음 | 20 / 20 | 20 / 20 |

- 계측 대조군: 하네스의 바이트 비교(`diverged`, 문자열 `!==`)가 발행본 안에서는 L 과 F 를 20칸 다르게 보아 다름을 잡는 비교임을 보여요. `cmp_ab.py` 도 같은 문자열 비교로 「고친 칸」 20칸에서 발행본 L 과 최종본 L 이 다름을 함께 셌어요(발행본 L ≠ 발행본 F = 최종본 L)
- 측정 조건 일치: Node 24 첫 대조에서 172칸 가운데 72칸이 달랐어요. 원인은 발행본 실행에 작업 경로를 **상대 경로**로, 수정본 실행에 절대 경로로 넘겨 응답 안 경로 문자열이 달랐던 것이었어요(브랜드와 무관한 `check_project` 까지 갈린 것이 그 표지). 발행본을 같은 절대 경로 조건으로 다시 재서 위 값을 얻었어요(`n24-pub-abs.json`)

### 4.4 변이 (AC9)

`mutants.py`: 최종 원본 `brand-core.ts`(V5 만 mcp `brand.ts`)에 변이를 하나씩 넣고 cli `brand-core.test.ts`(V5 는 mcp `brand.test.ts`)를 돌린 뒤 원복해 sha256 을 대조했어요.

| 변이 | 내용 | 결과 | 원복 sha |
|---|---|---|---|
| V1 | 변경 감지 제거(항상 Node 해석, 원래 결함) | 11 빨강 / 42 | 일치 |
| V2 | 감지 키를 version 문자열로(사후 점검도 같은 키) | 2 빨강 / 42 | 일치 |
| V3 | 항상 격리 해석 | 5 빨강 / 42 | 일치 |
| V4 | 바뀐 판정에서도 기록을 덮어씀 | 9 빨강 / 42 | 일치 |
| V5 | MCP 폴백 안내 줄 누락 | 1 빨강 / 29 | 일치 |
| V6 | 폴백에서 `stale` 표시 누락 | 3 빨강 / 42 | 일치 |
| V7 | 감지를 찾은 경로 하나로 좁힘(반박 검증 결함 1) | 1 빨강 / 42 | 일치 |
| V8 | Worker `error` 리스너 제거(위험 2) | 단언 42 / 42 통과, 처리되지 않은 오류로 실행 rc 1 | 일치 |
| V9 | 실패 래치 제거(위험 3) | 1 빨강 / 42 | 일치 |
| V10 | stale 목록에서 낡은 exports 항목을 건너뛰지 않음(결함 2) | 1 빨강 / 42 | 일치 |
| V11 | 경합 사후 점검 끔(위험 1) | 1 빨강 / 42 | 일치 |
| V12 | stale 상세에서 낡은 exports 를 도구 오류로 둠(결함 2) | 1 빨강 / 42 | 일치 |

변이 뒤 원본 · 사본 sha256 이 둘 다 9d5618886a318e25… 로 같아 사본 동일성도 그대로였어요. 보정 전 1차 구현에서도 V1 ~ V6 를 같은 방법으로 넣어 모두 빨강이었어요(1차 테스트 38건 기준 7 · 1 · 2 · 6 · 1 · 1).

### 4.5 CLI 불변 (AC10)

- `cli_ab.mjs`: 레이아웃 2(package.json 만 · `app/globals.css` + `axis.config.json`) × tokens 상태 5(미설치 · 1.2.1 · 1.7.0 package.json 만 · 1.7.0 · 1.8.2) × 명령 3(`theme list` · `theme info ontology` · `theme add ontology`, 모두 `--dir`) = 30쌍. 같은 경로를 매번 새로 만들어 발행본 cli 1.7.7 과 수정본을 차례로 돌리고 stdout · stderr · rc · 실행 뒤 파일 sha256(node_modules 제외)을 대조했어요
- 결과: **30 / 30 바이트 같음**(1차 구현 · 보정본 각각, `out/cli-ab.json` · `out/cli-ab2.json`). 최종본 cli tarball 은 보정본 측정에 쓴 것과 sha256 이 같아요(7b2a8d92…). rc 분포는 0 이 13쌍 · 1 이 17쌍이고, app 레이아웃의 `theme add` 5쌍은 rc 0 으로 globals.css · axis.config.json 을 실제로 써서 파일 대조가 비어 있지 않았어요
- `brand-core.test.ts`(mcp, 원본 · 사본 바이트 동일성): 통과

### 4.6 비용 (AC5)

`cost.mjs`: 한 MCP 프로세스에서 `tools/call` 왕복 지연. 첫 호출은 따로 두고 이어서 N 회. 「변경 뒤」는 같은 경로를 1.8.2 에서 1.7.0 으로 바꾼 상태예요. exports 는 같고 내용은 달라서, 발행본도 결과가 맞고 수정본은 내용 sha 가 달라 격리 해석 갈래를 타요. 시점이 다른 측정을 나란히 두지 않으려고 **발행본과 수정본을 번갈아** 쟀어요(ms, 중앙값 · p90, Node 22).

| 회차(200회) | 갈래 | 발행본 | 최종본 |
|---|---|---|---|
| a | 변경 없음 list · get | 1.09 · 1.74 / 1.16 · 1.94 | 1.14 · 1.74 / 1.21 · 1.90 |
| a | 변경 뒤 list · get | 1.03 · 1.58 / 1.15 · 1.68 | 25.14 · 27.02 / 26.58 · 30.45 |
| b | 변경 없음 list · get | 1.16 · 1.80 / 1.22 · 1.66 | 1.07 · 1.55 / 1.28 · 2.48 |
| b | 변경 뒤 list · get | 1.05 · 1.72 / 1.10 · 1.76 | 25.23 · 26.79 / 26.53 · 29.36 |

- 변경 없는 호출은 발행본과 같은 자릿수(약 1 ~ 2 ms)이고 차이(-0.09 ~ +0.06 ms)가 회차마다 방향이 엇갈려 잡음과 구분되지 않아요. 보정본(최종본과 해석 코드가 같음)으로 3회 더 번갈아 잰 값(`out/cost-alt-*.json`)도 -0.31 ~ +0.07 ms 였어요. 경로가 같다는 것은 단위 테스트 「package.json 이 첫 해석과 같으면 격리 해석을 하지 않음」(Worker 수 증가 0, 지우고 같은 내용으로 다시 설치해도)이 직접 보여요
- 변경 뒤에는 **그 서버 세션이 끝날 때까지** 브랜드 호출마다 약 25 ~ 29 ms 가 더 들어요. Node 캐시는 첫 내용을 계속 들고 있어서 매 호출 격리 해석을 해요. exports 는 같고 내용만 바뀐 경우(S3 · S5 · S9 류)에도 같아요(Q81 내용 sha 의 대가, plan 6절 · Q86)
- 1차 구현 측정(시점이 달라 위 표와 나란히 두지 않음): 발행본 50회 2회차 · 1차 구현 50회 2회차에서 변경 뒤 27.0 ~ 29.1 ms, Node 24.18.0 에서 1차 구현 변경 뒤 28.4 · 28.6 ms(`out/cost-*.json`, `out/cost-n24-*.json`)
- Node 단독 프로브의 Worker 1회 비용은 Node 22 27.4 ms · Node 24 22.1 ms 라 위 증가분과 맞아요

### 4.7 Node 버전 (Q85)

| Node | 하네스 발행본 갈림 | 하네스 최종본 갈림 | 최종본 F · L 바이트 대조 | 단위 테스트(cli `brand-core.test.ts` · mcp `brand.test.ts` + `brand-core.test.ts`) | 프로브 |
|---|---|---|---|---|---|
| v22.22.0 | 20 | 0 | 172 · 152 · 20 모두 같음 | 42 · 30 통과 | 같은 프로세스 낡음 · Worker · 자식 정상 |
| v24.18.0(nvm) | 20(같은 20칸) | 0 | 172 · 152 · 20 모두 같음 | 42 · 30 통과 | 같은 결과(Worker 22.1 ms · 자식 31.0 ms) |
| v20 | 미측정 | 미측정 | 미측정 | 미측정 | 미측정(설치돼 있지 않음) |

- Node 24 프로브 첫 실행은 작업 경로를 상대 경로로 넘겨 세 칸 모두 `ERR_INVALID_ARG_VALUE` 였어요(`createRequire` 인자 오류, 측정 실패). 절대 경로로 다시 재서 위 값을 얻었어요
- v24.14.1 도 nvm 에 있지만 재지 않았어요(같은 메이저)

### 4.8 품질 게이트

| 명령 | 결과 |
|---|---|
| `npx turbo run build type-check lint test --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | 최종 코드에서 rc 0, 9 / 9, Cached 0(cli 1109 · mcp 234 통과). 보정 중 한 번은 mcp lint 가 쓰이지 않게 된 `findTokensPackageJson` 을 잡아 rc 1 이었고, 함수를 지운 뒤 다시 돌린 값이에요 |
| `pnpm check-changeset-mcp-tokens` | rc 0. 「changeset 1개 · tokens 올림 0 · mcp 올림 1 · cli 올림 1」, registry-core 변경 0 이라 두 규칙 모두 검사 대상 없음, 자체 테스트 fail 0 |
| 공개 d.ts 에 새 export(`isolatedResolveStats` · `setIsolatedResolveFactoryForTest` · `workerResolveSessionForTest` · `IsolationFailure`) | 나가지 않아요. 두 패키지의 `main` 진입점은 실행 파일이라 `dist/index.d.ts` 는 shebang 한 줄(20 바이트)이고 번들 `dist/index.js` 도 export 가 0건이에요. 그래서 index.d.ts 의 「0건」은 구조상 늘 0 이라 그것만으로는 판정 근거가 못 돼요. 양성 대조로 export 가 있는 cli 의 다른 d.ts(`v0` · `monet` · `sync/index`, export 줄 3개)까지 최종본 d.ts 5개 전부를 grep 해 네 이름 0건이었어요. 반박 검증이 1차 구현의 d.ts 가 발행본과 바이트 같음을 따로 확인했어요 |

### 4.9 반박 검증과 보정 (2026-10-29)

1차 구현(4.2 ~ 4.8 의 1차 값) 뒤 독립 에이전트 셋이 정확성 · 회귀 · 문구와 문서 관점에서 반박 검증했어요. 셋 모두 worktree 를 고치지 않고 scratchpad(`$S/../wi0089-review-correctness/` · `wi0089-review-regression/`)에서 실험했어요.

| 관점 | 발견 | 심각도 | 보정 | 확인 |
|---|---|---|---|---|
| 정확성 | 결함 1: 앱 안 중첩 tokens 를 지워 상위로 넘어가면 `not-built`. 감지가 찾은 경로 하나만 봐서, Node 가 기억한 지워진 중첩 package.json 을 놓침 | 결함 | 후보 경로 전부(없음 포함)를 감지 키로(plan 3절 2) | 단위 테스트 · 변이 V7, 재현 `e2-dedupe` 상위 1.8.2 · 1.7.0 두 갈래 4/4 SAME(Node 22 · 24) |
| 정확성 | 결함 2: 폴백 중 같은 버전에 브랜드를 더하면 `ERR_PACKAGE_PATH_NOT_EXPORTED` 로 도구 오류(AC8 위반) | 결함 | stale 일 때만 그 항목을 빼거나 상세를 `brand: null` 로(Q87) | 단위 테스트 · 변이 V10 · V12, 재현 `e7` 폴백 list 에 ontology · stale, get zeta 는 `brand: null` · stale |
| 정확성 · 회귀 | 위험 1: 기록과 Node 판독 사이 경합(설치 도중 호출)이 프로세스 끝까지 남음 | 위험 | Node 해석 직후 다시 읽어 다르면 `unknown` 표시 · 격리 해석으로 다시 판정 · version 다시 읽음 | 단위 테스트(fs 가로채기) · 변이 V11, 재현 `e8-race` 경합 호출 · 1.2.1 복귀 둘 다 새 프로세스와 같음(Node 22 · 24) |
| 정확성 · 회귀 | 위험 2: Worker 에 `error` 리스너가 없어 비동기 오류가 프로세스를 끝냄(재현: 시작 중 throw 하는 Worker 는 한도 뒤 rc 1 종료) | 위험 | `worker.on("error", () => {})` | 단위 테스트(시작 중 throw · `process.exit`) · 변이 V8 |
| 정확성 · 회귀 | 위험 3: 시작 중에 죽는 Worker 는 호출마다 10 초 블록 | 위험 | 실패 래치, 한도 5 초 | 단위 테스트(두 번째 호출에서 Worker 증가 0) · 변이 V9 |
| 회귀 | 사소: 바뀐 경로는 세션 끝까지 호출마다 Worker | 사소 | 그대로(Q86) | 4.6 |
| 회귀 | 확인: 호출지 전수 · CLI 12건 바이트 같음 · 공개 d.ts 발행본과 바이트 같음 · 번들 import 와 eval 문자열 보존 · stdin 닫으면 10 ms 안에 rc 0 종료 · shuffle 시드 여럿에서 통과 | 문제 없음 | 없음 | 리뷰어 측정 |
| 정확성 | 확인: 같은 경로 10단계 전이(복사 설치 · pnpm 식 심링크 교체) 갈림 0 · 신호 경합 2만 회 섞임 0 · `close` 를 빼도 `unref` 로 바로 끝남 | 문제 없음 | 없음 | 보정본으로 `e3-sequence` 30칸 SAME 재확인 |
| 정확성 | 측정 조건: 메인 모듈 동기 실행 중에는 Node stat 캐시가 켜져 dist 삭제도 못 따라가는 거짓 갈림이 나요. 재현은 `setImmediate` 뒤에서 함 | 측정 주의 | prd 1.2 에 조건 적음 | 하네스 · vitest 는 비동기 호출이라 해당 없음 |
| 문서 | 사실 오류 4 · 어긋남 9 · 표현 7(AC5 의 0회 대상, S3 누락, changeset 의 「빌드」, Node 20 단정, 4.6 · 4.7 참조, Q86 미등재, AC7 범위, 열린 확인, 위험 서술, 테스트 수 기준, 착수 1차 칸 수, C8 표현, 안내 문구의 기준 시점, 주석 어미 등) | 문서 | 20건 모두 반영(안내 문구는 「이 MCP 서버가 @axis-ds/tokens 를 처음 읽은 뒤 내용이 바뀌었는데」로, 새 주석은 파일의 합니다체로) | 이 문서 · prd · plan · release-notes · changeset |

- 보정 뒤 회귀 검증은 4.2 ~ 4.8 의 최종본 값 전부예요(하네스 Node 22 · 24, CLI A/B, 비용 번갈아, 변이 12개, main 빨강, turbo 게이트, changeset)

## 5. 미측정으로 남긴 칸

| 칸 | 이유 | 언제 |
|---|---|---|
| Node 20 | 이 머신에 없음(nvm 에 22.22.0 · 24.14.1 · 24.18.0). 배포본 내려받기가 두 번 다 시간 초과(nodejs.org 200 s · npm 레지스트리 280 s, 10 MB 도중). Node 20 은 「없음」도 기억할 것으로 추정되며, 감지 키가 후보의 없음 상태까지 보므로 대응은 돼 있어요(코드 경로) | CI 또는 Node 20 이 있는 환경 |
| Yarn PnP 레이아웃 | 하네스 · 재현 모두 `node_modules` 레이아웃만 잼. pnpm 식 심링크 교체 · 호이스팅은 반박 검증 재현으로 잼(4.9) | 재지 않음(prd 5절) |
| Worker 시간 초과 실경로(5 초) | 폴백은 생성 실패 주입과 한도 300 ms 의 실패 Worker 주입으로만 시험. 실제 5 초 대기는 재지 않음 | 재지 않음 |
| 경합의 두 번 바뀜(기록 · 사후 점검 사이에 바뀌었다 돌아옴) | 재현하지 않음(prd 5절, 추정) | 재지 않음 |
| `import.meta.resolve` | 프로브 호출 형태가 맞지 않음(3.2). 코드는 쓰지 않음 | 재지 않음 |
| `axis.apply_template` · `axis.diff_template` · `axis.install_component` | 쓰기 도구이거나 레지스트리 · 네트워크를 타서 하네스에서 뺌. 브랜드 해석을 쓰지 않음(prd 1.3 C5 · C8, 반박 검증 호출지 전수) | 재지 않음 |
| `axis.list_components` · `search_components` · `get_component` · `list_tokens` · `get_token` · `list_templates` · `get_template` · `axis.prompt.*` | 대상 프로젝트 tokens 를 읽지 않음(prd 1.3 C3 · C4 · C5) | 재지 않음 |
| Windows | 이 머신은 WSL | 재지 않음 |
