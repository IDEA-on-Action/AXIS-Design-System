# WI-0111: turbo test 빌드 의존 릴리스 노트

> 발행 없음(레포 개발 환경 변경, 2026-11-02 머지 #287) | GitHub: #286
> npm 패키지 내용(dist)은 바뀌지 않아요. ui-react 의 build 스크립트만 바뀌어요

## 바뀐 점

- 레포 dist 를 읽는 test 에만 build 의존을 걸었어요(패키지별 turbo.json, mcp 선례). ui-react 는 `["^build", "build"]`, agentic-ui 는 `["^build"]`, tokens 는 `["build"]` 예요. 그래서 `turbo run type-check lint test` 처럼 한 호출에 여러 작업을 묶어도 test 가 빌드 도중의 dist 를 읽지 않고, 끊긴 빌드가 남긴 불완전한 dist 는 다음 turbo 실행에서 다시 빌드되거나 캐시로 복원돼요.
- ui-react 의 산출물 검사(cva/types 참조 0, d.ts 1개 이상)를 test 에서 build 스크립트 끝(`node scripts/fix-cva-dts.mjs --check`)으로 옮겼어요. `fix-cva-dts.test.mjs` 의 산출물 테스트는 build 스크립트에 후처리와 `--check` 가 붙어 있는지 보는 정적 검사로 바뀌었어요.

## 바뀌지 않은 점

- CI(`frontend.yml`)의 단계 구성은 그대로예요. CI 는 원래 단계를 나눠 돌려 이 경합이 없었어요(최근 300 run 의 Test step 실패 0건).
- cli · theme · registry-core 의 test 는 build 를 기다리지 않아요.

## 영향

- 로컬 `turbo run test` 는 ui-react · agentic-ui · tokens 의 test 앞에 tokens · ui-react build 를 먼저 돌려요(캐시 적중이면 복원만).
- 이 변경을 머지한 뒤 첫 CI run 은 패키지 turbo.json · ui-react package.json 이 build 입력에 들어가 캐시가 많이 비어요(한 번만).

## 알려진 한계

- turbo 를 거치지 않고 패키지에서 직접 돌리는 test 는 남은 불완전 dist 를 잡지 않아요. 산출물 검사는 build 끝에서 해요.
- 새 테스트가 레포 dist 를 읽게 되면 그 패키지 turbo.json 의 test 에 build 의존을 직접 더해야 해요. 이것을 강제하는 장치는 없어요(판정 기준은 testplan 1절).
- 동시 실행 부하에서 cli 시간 한도 테스트 · guidance 5초 제한이 넘는 문제(후속 130), web 의 next build 와 type-check 가 `.next/types` 를 두고 경합하는 문제(후속 131)는 이번 범위 밖이에요.
