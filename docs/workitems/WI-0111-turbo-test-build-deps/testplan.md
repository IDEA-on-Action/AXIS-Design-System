# WI-0111 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-11-02 | 상태: 측정 완료(2026-11-02)
> 환경: node v22.22.0 · pnpm 9.15.4 · turbo 2.7.5 · tsup 8.5.1 · WSL2 Linux x64(8코어)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음)
> 실험은 모두 레포 사본(`scratchpad/wi0111/{ab,refute}`, rsync + `pnpm install --offline`)에서 했어요. before 사본은 변경 파일을 HEAD 판으로 되돌린 것이에요.

## 1. test 별로 읽는 산출물

| test | 읽는 레포 산출물 | 의존(이번 변경 뒤) |
|---|---|---|
| ui-react | tokens dist(`progress` · `reduced-motion` · `density` 테스트) | `["^build", "build"]` |
| agentic-ui | ui-react dist(소스가 `@axis-ds/ui-react` 를 import, 없으면 12개 파일 중 11개 실패) · tokens dist | `["^build"]` |
| tokens | 자기 dist/css(`baseline-1.2.1` · `default-contrast` · `ontology-values`) | `["build"]` |
| mcp | tokens dist(`tokens-sync`) | `["^build"]`(종전부터) |
| cli · theme · registry-core | 없음(임시 디렉터리 fixture) | 없음 |

- 새 테스트가 레포 dist 를 읽게 되면 그 패키지 turbo.json 의 test 에 해당 build 의존을 더해요. 지금 agentic-ui 테스트는 자기 dist 를 읽지 않아, 동시 실행에서 agentic-ui#build 와 agentic-ui#test 가 같이 시작해도 문제가 없어요(측정: 둘 다 +38.8s 시작, 통과).
- ui-react 의 산출물 검사(cva/types 참조 0, d.ts 1개 이상)는 test 가 아니라 build 끝(`fix-cva-dts --check`)에서 해요.

## 2. 수용 기준별 결과

### AC1 · AC2 사본 음성 · 양성 대조(측정)

ui-react 빌드 중 d.ts 가 0개가 되는 순간 프로세스 그룹을 끊어 d.ts 0 · js 34 · mjs 34 dist 를 만들었어요(before 13.9s, after 17.7 ~ 25.7s 에 끊김).

| 경로 | before | after |
|---|---|---|
| `turbo run test --filter=@axis-ds/ui-react --concurrency=1` | rc 1 「d.ts 0개」, 그래프에 build 없음(test 하나만 실행), 끝난 뒤에도 d.ts 0 | rc 0, tokens#build → ui-react#build → ui-react#test 순서, 끝난 뒤 d.ts 복구, build 로그 「검사 d.ts 68개, 남은 참조 0건」 |
| 패키지 안 `pnpm test` | rc 1 「d.ts 0개」 | rc 0(test 가 dist 를 읽지 않음) |
| agentic-ui(ui-react dist 를 치운 상태) | rc 1, 12개 파일 중 11개 실패 | rc 0, tokens → ui-react build → test, 148 통과 |
| tokens(tokens dist 를 치운 상태) | rc 1, 4건 실패(「dist/css/variables.css 없음」) | rc 0, build → test, 568 통과 |

- after 의 캐시 미스 회차(1 · 3회차)만 통과 근거로 써요. 2회차는 build · test 모두 캐시 적중이라 test 가 실제로 돌지 않았어요(dist 가 캐시 복원으로 돌아온다는 근거로만 써요).
- 끊긴 빌드 뒤 같은 명령을 캐시 적중으로 돌려도 d.ts 68개가 복원돼요(측정). WI-0109 에서 관찰한 「남은 d.ts 0 dist 를 다음 실행의 test 가 먼저 읽는」 경로가 끊겨요.

### AC3 의존 그래프(측정, `turbo run test --dry=json`)

- ui-react#test → tokens#build · ui-react#build, agentic-ui#test → tokens#build · ui-react#build, tokens#test → tokens#build.
- cli · theme · registry-core · web 의 test 의존은 `[]` 그대로예요. test 그래프는 11개에서 12개(ui-react#build 추가)로 늘었어요.
- resolvedTaskDefinition: 루트 test 설정(outputs `[]`, cache, env)은 그대로이고 tokens 의 inputs 도 유지돼요.

### AC4 build 끝 검사(측정)

| 상태 | `node scripts/fix-cva-dts.mjs --check` |
|---|---|
| 정상 dist | rc 0 |
| d.ts 하나에 cva/types 참조 주입 | rc 1(「참조가 남음」) |
| d.ts · d.mts 모두 삭제 | rc 2(「d.ts 0개」) |
| dist 없음 | rc 2 |

- 배선 테스트 변이(package.json build 만 바꿈): `--check` 제거 · `--check` 를 postbuild 앞으로 · tsup 뒤 fix 단계 제거 세 가지 모두 7번 테스트가 실패해요. fix 단계를 뺀 변이로 실제 build 를 돌리면 끝의 `--check` 가 「남은 참조 24건」으로 build 를 실패시켜요.
- 다른 build 경로: 사본에서 ui-react `prepublishOnly` rc 0, 루트 `pack-smoke` rc 0(6개 패키지). 사본 빌드 dist 는 레포 dist 와 `diff -rq` 차이 0 이에요(dist 내용 불변). `pack-install-smoke` 는 네트워크 설치가 필요해 돌리지 않았어요.

### 동시 실행(측정, after 사본)

`turbo run type-check lint test --force --continue` 2회: 모두 rc 0 · 24/24. ui-react#test 는 ui-react#build 가 끝난 뒤(+38.8s · +38.2s) 시작했어요. tokens#test 도 tokens#build 끝 뒤 시작했어요. 순서는 그래프가 보장하므로 반복 횟수보다 AC3 의 의존 그래프가 판정 근거예요.

### AC5 레포 게이트 · CI

| 명령 | 결과 |
|---|---|
| `npx turbo run build --force` | rc 0 · 8/8 · Cached 0(측정) |
| `npx turbo run type-check lint test --force`(기본 동시 실행, load 11 ~ 17 / 8코어) | rc 0 · 24/24 · Cached 0(측정). ui-react 206 + fix-cva-dts 7 · agentic-ui 148 · tokens 568 · theme 47 · cli 1568 · mcp 266 passed. 고치기 전에도 이 조합은 가끔만 실패했으므로 1회 통과는 판정 근거로 쓰지 않아요(근거는 AC1 ~ AC3). 빌드가 바꾼 `public/templates/*.json` 6개 updatedAt 은 되돌림 |
| PR CI(job 로그 API 로 같은 방법으로 읽음) | 고치기 전 #284 run 41388591374: type-check 11 task · 6 cached · 42.7s, test 7 task · 5 cached · 47.1s. 고친 뒤 #287 run 41439619504(첫 run): type-check 11 · 2 cached · 53.8s, test 8 task(ui-react#build 추가, 같은 job 의 type-check 단계 결과 재생) · 4 cached · 38.3s. 첫 run 은 패키지 turbo.json · ui-react package.json 이 build 입력이라 해시가 바뀌어(사본 측정: type-check lint test 32개 중 18개) 캐시 조건이 달라요. 「조건 다름」이라 시간 증감의 근거로 쓰지 않아요 |

## 3. 잃는 보증

- 7번 테스트가 dist 를 읽지 않으므로, turbo 를 거치지 않고 패키지에서 직접 돌리는 test 는 남은 불완전 dist(d.ts 0개 · 참조 잔존)를 더는 잡지 않아요(측정: 신판 pass 7, 구판 fail 1). 산출물 검출은 build 끝 `--check` 와 turbo 의존(캐시 적중 때 dist 복원)으로 옮겨요(사용자 결정 D2).
- CI 에서는 type-check 단계가 ui-react build 를 돌려 `--check` 가 실행돼요(측정: web#type-check 가 ui-react#build 에 의존). 캐시 적중이면 다시 돌지 않아요. 그래도 캐시된 출력은 `--check` 를 통과한 build 의 것이에요.
- `--check` 는 `.d.ts` 를 모두 지우고 `.d.mts` 를 남긴 상태에서는 rc 0 이에요(d.ts 수를 합쳐 셈). tsup 은 둘을 함께 지워서 끊긴 빌드에서는 생기기 어려운 상태로 봐요(추정).
- 정적 배선 검사는 `./scripts/...` 경로나 pnpm 스크립트 위임처럼 같은 동작의 다른 표기도 실패로 봐요(거짓 빨강이라 바꾸는 사람이 알아챔).
