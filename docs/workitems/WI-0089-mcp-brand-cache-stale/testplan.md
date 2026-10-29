# WI-0089: MCP 브랜드 도구의 tokens 판독 낡음 테스트 계획

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 작성일: 2026-10-29 | 상태: 착수 측정 완료(2026-10-29, 2절 · 3절), 구현 측정은 4절에 채움
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

내용이 바뀌었는데 exports 가 같은 칸(S3 · S5 · S9)에서 갈림이 0 이라, 「package.json 이 바뀌면 낡는다」가 아니라 「exports 가 바뀌면 낡는다」예요. 감지 키 결정(Q81)에서 내용 sha 를 고르면 S5 · S9 에서 불필요한 격리 해석이 일어나는 이유예요.

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

## 4. 구현 측정 (구현 때 채움)

### 4.1 회귀 테스트 빨강 · 초록 (AC11)

| 테스트 | 수정 전 소스 | 수정본 |
|---|---|---|
| cli 「WI-0089」(한 프로세스 · 같은 경로: U → N, K → U, K → Da, 변경 없음 K → K) | 미측정 | 미측정 |
| mcp brand 핸들러 대응 행 | 미측정 | 미측정 |

### 4.2 하네스 A/B (AC1 ~ AC6)

발행본 1.4.6 과 수정본 빌드(`pnpm pack` → 새 디렉터리 설치)를 같은 `harness.mjs` 로 재요.

| 지표 | 발행본 | 수정본 |
|---|---|---|
| L · F 갈림(172칸) | 20 | 미측정(기대 0) |
| AC6 가드 칸(S3 · S5 · S6 · S7 · S9 · S10 · S11 · S13)의 L 이 발행본과 바이트 같음 | 해당 없음 | 미측정 |
| 격리 해석 횟수(AC5): 변경 없는 시퀀스 0회 | 해당 없음 | 미측정 |
| 변경 뒤 호출 지연(같은 프로세스, list_brands) | 해당 없음 | 미측정 |

### 4.3 변이 (AC9)

| 변이 | 내용 | 기대 | 결과 |
|---|---|---|---|
| V1 | 변경 감지 제거(항상 Node 해석) | 4.1 의 U → N · K → U · K → Da 빨강 | 미측정 |
| V2 | 감지 키를 version 문자열로 | K → Da(같은 버전) 빨강 | 미측정 |
| V3 | 항상 격리 해석 | AC5 격리 해석 횟수 행 빨강 | 미측정 |
| V4 | 첫 판독 기록을 호출마다 덮어씀 | 두 번째 변경(U → N → K) 빨강 | 미측정 |
| V5 | 폴백 안내 줄 누락 | AC8 행 빨강 | 미측정 |

### 4.4 CLI 불변 (AC10)

- cli 기존 테스트 기대 변경 0, `theme list` · `theme info` · `theme add` 출력을 발행본 cli 1.7.7 과 수정본으로 같은 fixture(1.1 의 A · U · N · K)에서 대조: 미측정

## 5. 미측정으로 남긴 칸

| 칸 | 이유 | 언제 |
|---|---|---|
| Node 20 · 24 | 이 머신에 Node 22.22.0 뿐. Node 20 배포본 내려받기가 두 번 다 시간 초과(nodejs.org 200 s · npm 레지스트리 280 s, 10 MB 도중) | 구현 검증(Q85) |
| pnpm 심링크 · 호이스팅 · Yarn PnP 레이아웃 | 평면 `node_modules` 픽스처 하나만 잼. 감지 키 경로와 Node 캐시 키 경로가 심링크에서 같은지 추정 | 구현 검증 |
| `import.meta.resolve` | 프로브 호출 형태가 맞지 않음(3.2). 현재 코드는 쓰지 않음 | 필요 시 |
| `axis.apply_template` · `axis.diff_template` · `axis.install_component` | 쓰기 도구이거나 레지스트리 · 네트워크를 타서 하네스에서 뺌. 코드 조사로 Node 해석을 타지 않음(prd 1.3 C5 · C8) | 재지 않음(Q82 ① 이면 범위 밖) |
| `axis.list_components` · `search_components` · `get_component` · `list_tokens` · `get_token` · `list_templates` · `get_template` · `axis.prompt.*` | 대상 프로젝트 tokens 를 읽지 않음(MCP 동봉 정적 데이터 · 레지스트리, prd 1.3 C3 · C4 · C5) | 재지 않음 |
| CLI 같은 프로세스 재판독 | CLI 는 한 프로세스 한 해석이라 경로가 없음(코드 조사) | 재지 않음 |
| Windows | 이 머신은 WSL | 재지 않음 |
