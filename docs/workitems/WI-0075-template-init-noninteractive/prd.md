# WI-0075: 비대화형(비TTY) 실행의 질문 처리 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0075 | GitHub: #201 | 우선순위: P2 | 상태: Approved (2026-10-25 배치 6 결정: 브리프 권장안 일괄 채택, project-todo 「배치 6 결정」 줄이 정본)
> 기준: `main` 3b5ed0f (linked 1.8.0 · cli 1.6.2 · mcp 1.3.5 발행됨, 미발행 changeset 0) | 묶음: 배치 6 (WI-0078 → 0076 → 0074 → **0075** → 0077), worktree `fix/batch6` 의 WI-0074(413c076) 위
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

- `axis template init dashboard` 를 `--dir` 없이 비대화형(stdin `</dev/null` · 빈 파이프)으로 부르면 `? 프로젝트 디렉토리: › dashboard` 한 줄만 찍고 파일 0개 · rc 0 으로 끝났어요(WI-0067 실경로 검증에서 발견, 이슈 #201).
- 같은 모양(질문 한 줄 · 파일 0 · rc 0)이 7경로에서 났어요: template init(이름 없음 · `--dir` 없음 · 비어 있지 않은 `--dir`), template apply 충돌, init(`-y` 없음), v0 import, monet import. 수정 전 소스(HEAD 413c076 빌드)와 발행본 1.6.2(브리프) 둘 다에서 재현했어요(testplan 1절).
- 원인 두 층(브리프, 코드로 다시 확인):
  1. prompts 2.4.2 는 stdin `end` · readline `close` 에 리스너가 없어 비TTY stdin 이 EOF 가 되면 submit · abort 가 나오지 않고 `await prompts(...)` 가 끝나지 않아요.
  2. `src/index.ts` 의 `program.parse()` 가 async action 을 기다리지 않아, 이벤트 루프가 비는 순간 Node 가 rc 0 으로 끝나요.
- `axis add` 만 WI-0045 D3 에서 `createConfirm` 으로 막았고(`add/index.ts` 주석에 같은 결함이 적혀 있음) 다른 명령으로 퍼지지 않았어요. `template init` 에는 `-y` 가 없어(`--dir` 하나) 비어 있지 않은 디렉터리를 스크립트로 다룰 수 없었어요.

### 1.2 결정 (2026-10-25 배치 6 결정)

| # | 결정 | 근거 |
|---|---|---|
| D1 | 질문 성격으로 나눠요. 기본값이 있고 파괴적이지 않은 질문(template init 디렉터리 = 템플릿 이름, init 3문항)은 기본값으로 진행하고 쓴 값을 1줄로 알려요. 덮어쓰기 확인(비어 있지 않은 디렉터리, apply 충돌, init 의 내용이 다른 기존 `utils.ts`)과 기본값이 없는 입력(이름 없는 template init, v0 · monet)은 rc 1 + 필요한 플래그 안내예요 | 이슈의 기대 동작이 「slug 이름 디렉터리 기본값」이고, init `-y` 가 이미 같은 기본값(`resolveInitAnswers`)을 써요. 파괴적 확인을 rc 1 로 두는 것은 add D3 와 같은 방향이에요. init 의 utils.ts 덮어쓰기는 대화형에서도 묻지 않는 단계지만 비대화형에서 사용자 파일이 바뀌므로 같은 갈래로 둬요(반박 검토 major, 2026-10-25) |
| D2 | `template init -y` 를 추가해요. 질문을 기본값으로 답하고 비어 있지 않은 디렉터리도 진행해요(= init 이 apply 를 `yes: true` 로 부르는 덮어쓰기, `template apply -y` 와 같은 뜻) | 같은 명령군에서 `-y` 뜻이 맞아요. 새 옵션이라 cli minor |
| D3 | 공통 헬퍼(`src/interactive.ts`: `isInteractive` · `ask` · `noteDefault` · `failNonInteractive`)로 모든 질문을 감싸고, 진입점을 `await program.parseAsync()` 로 바꾸는 안전망을 둬요 | 원인 두 층을 둘 다 막아요. 가드를 빠뜨린 질문은 `ask` 가 `NonInteractiveError`(→ rc 1)로, 그마저 우회한 prompts 는 Node rc 13(unsettled top-level await)으로 드러나요 |
| D4 | v0 import · monet import 도 같은 헬퍼로 rc 1 + 안내만 넣어요 | 원래 붙여 넣기 대화형 기능이라 비TTY 에서는 안내와 rc 1 이면 돼요. 빼면 「rc 0 무출력 경로 0개」를 증명할 수 없어요 |

### 1.3 범위 밖

- `scripts/template-smoke.mjs` 의 CI(frontend.yml) 연결(반박 검토 제안). 배치 6 지시로 하지 않았어요. 대신 cli-smoke 에 비TTY 갈래를 넣었어요(아래 FR-6, 판단 근거는 testplan 4절).
- 실제 TTY 에서 끝까지 도는지 확인(샌드박스 pty 는 질문이 없는 `template list` 도 ora 스피너에서 멈춰 판정 수단이 못 돼요, 브리프 측정). 사람 확인 항목으로 남겨요.
- `@axis-ds/mcp`(template-apply · prompts 를 쓰지 않음, 브리프 grep 0건) · linked 4패키지.

## 2. 요구사항

| ID | 요구사항 | AC |
|---|---|---|
| FR-1 | `template init <name>` 을 `--dir` 없이 비대화형으로 부르면 `./<name>` 에 템플릿 파일과 `axis.config.json` 을 만들고 rc 0, 쓴 디렉터리를 1줄로 알려요 | AC1 |
| FR-2 | 비대화형에서 「질문만 찍고 rc 0」인 경로가 0개예요(대상 7경로). rc 0 이면 산출물 1개 이상, rc 비0 이면 안내 문구 | AC2 |
| FR-3 | 비어 있지 않은 디렉터리의 `template init` · 충돌이 있는 `template apply` · 내용이 다른 기존 `utils.ts` 가 있는 `init` 을 비대화형으로 `-y` 없이 부르면 기존 파일이 바이트 그대로이고 rc 1. `-y` 면 진행해 덮어쓰고 rc 0 | AC3 |
| FR-4 | 대화형(TTY) 경로는 바뀌지 않아요(같은 질문 · 같은 응답 처리) | AC4 |
| FR-5 | `template init` 에 `-y` 가 있어요(D2 뜻) | AC3 · AC4 |
| FR-6 | cli-smoke(빌드한 dist 실행, CI)에 비TTY 갈래(stdin `/dev/null` · 빈 파이프)를 넣고 실행 건수를 단언해요 | AC5 |
| FR-7 | 진입점이 action 을 끝까지 기다리고(`await program.parseAsync()`), 다른 명령의 종료 코드는 그대로예요 | AC6 |
| FR-8 | 소스에서 prompts 를 import 하는 곳은 `src/interactive.ts` 하나예요(재발 방지 가드 테스트) | AC2 |

## 3. 수용 기준

- **AC1** 비대화형 `template init <name>`(`--dir` 없음): 신판 rc 0 · `./dashboard` 10파일, 수정 전 dist 는 rc 0 · 0파일(A/B 로 갈림). stdin `/dev/null` · 빈 파이프 두 조건.
- **AC2** 명령별 비TTY 표(testplan 2절) 전부를 단위 테스트(`template-apply.test.ts` · `interactive.test.ts` · `init.test.ts`)와 매트릭스로 고정. 변이(판정을 항상 대화형으로, 가드 제거, parse 로 되돌림, prompts 직접 import)를 넣으면 테스트가 빨개져요.
- **AC3** 비대화형 `-y` 없는 덮어쓰기 경로는 바이트 그대로 · rc 1, `-y` 는 덮어씀 · rc 0(두 결과가 갈림).
- **AC4** 판정을 대화형으로 주입하면 prompts 가 불리고(호출 수 1 이상) inject 응답대로 동작해요. 실 TTY 는 사람이 1회 확인(미검증 축).
- **AC5** cli-smoke 의 비TTY 갈래 12건이 신판에서 통과하고, 수정 전 dist 를 `--cli` 로 주면 그 갈래가 FAIL 이에요(양성 대조). 건수가 기대와 다르면 rc 2.
- **AC6** 수정 전후 dist 의 종료 코드 A/B(오류 · 정상 명령 14종)가 같고, 안전망 실측에서 가드를 지운 dist 가 rc 13(parseAsync)과 rc 0(parse)으로 갈려요.
- **AC7** 발행 뒤 npm 발행본만 설치하고 HOME · XDG 를 새로 둔 상태에서 매트릭스를 다시 돌려 결함 7행이 기대값으로 바뀌고 정상 행이 그대로예요(발행 뒤).
