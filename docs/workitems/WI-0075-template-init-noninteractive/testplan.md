# WI-0075: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #201 | 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w6impl/WI-0075/`(세션 scratchpad, 커밋하지 않음)
> 기준: worktree `fix/batch6`(413c076 위). 수정 전 = 그 HEAD 를 빌드한 dist(`before/`, `--version` 1.6.2). 템플릿은 `apps/web/public/templates` 를 127.0.0.1 정적 서버로 띄워 `AXIS_TEMPLATE_URL` 로 줬어요(네트워크 무관). HOME · XDG_CONFIG_HOME 은 새 디렉터리

## 1. 재현 (수정 전, 음성 대조)

`scripts/matrix.sh`(브리프 매트릭스를 로컬 템플릿 서버로 옮기고 `-y` 대조 2행을 더함)를 수정 전 dist 로 돌렸어요. stdin `/dev/null` 과 빈 파이프 결과가 15행 모두 같았어요. 결함 7행이 브리프와 같은 모양(질문 한 줄 · 파일 0 · rc 0)으로 재현됐어요. `template init --dir app -y` 는 `error: unknown option '-y'` rc 1 이에요(옵션 없음).

## 2. 명령별 비TTY 표 (측정, 수정 전 → 후, 두 stdin 조건 동일)

파일 수는 실행 전 → 후, 「바이트」는 실행 전후 파일 전체 sha256 이 같은지예요.

| 명령 | 수정 전 | 수정 후 | 판정 |
|---|---|---|---|
| template init dashboard (`--dir` 없음) | rc 0 · 0→0 · 질문 한 줄 | rc 0 · 0→10(`./dashboard`) · 「기본값 'dashboard' 로 정했습니다」 | 고침 |
| template init (이름 없음) | rc 0 · 0→0 · select 목록 | rc 1 · 0→0 · 「템플릿 이름을 주세요」 | 고침 |
| template init dashboard --dir app (비어 있지 않음) | rc 0 · 2→2 · 확인 질문 | rc 1 · 2→2 · 바이트 그대로 · `-y` 안내 | 고침 |
| template init dashboard --dir app -y (비어 있지 않음) | rc 1 · unknown option | rc 0 · 2→11 · 덮어씀 안내 | 새 옵션 |
| template apply dashboard (충돌, `-y` 없음) | rc 0 · 9→9 · 확인 질문 | rc 1 · 9→9 · 바이트 그대로 · `-y` · `--dry-run` 안내 | 고침 |
| template apply dashboard -y (충돌) | rc 0 · 덮어씀 | rc 0 · 덮어씀 | 불변(대조) |
| init (`-y` 없음) | rc 0 · 1→1 · 질문 한 줄 | rc 0 · 1→3 · 「기본값으로 진행합니다(-y 와 같음): componentsDir=…」 | 고침 |
| v0 import | rc 0 · 0→0 · select | rc 1 · 0→0 · `axis v0 convert <file>` 안내 | 고침 |
| monet import | rc 0 · 0→0 · 이름 질문 | rc 1 · 0→0 · 대화형 안내 | 고침 |
| template init --dir app (빈 디렉터리) · template apply (빈 디렉터리) · init -y | 정상 | 같음 | 불변 |
| add button (충돌, 비TTY) · add (config 없음) · theme add (config 없음) | 정상 | 같음 | 불변 |

- 결과 파일: `matrix-before-{null,pipe}.tsv` · `matrix-after-{null,pipe}.tsv`.
- 파이프로 응답을 넣던 사용(동작 변경, 측정): `printf 'other\n' | axis template init dashboard` 는 수정 전 `./other`, 수정 후 `./dashboard`(묻지 않고 기본값) 둘 다 rc 0. README · changeset 에 적었어요.

## 3. 단위 테스트

| 파일 | 건수 | 내용 |
|---|---|---|
| `src/template/template-apply.test.ts`(신규) | 18 | 비대화형 init 6(`--dir` 없음 · 이름 없음 · `-y`+이름 없음 · 비어 있지 않음 · 그 음성 대조 `-y` · 기본 디렉터리가 비어 있지 않음), apply 4(충돌 · `-y` 대조 · `--dry-run` · 충돌 없음), 대화형 5(디렉터리 질문 · 템플릿 선택 · 비어 있지 않음 거절 · `-y` · apply 덮어쓰기), 명령 등록 3(`-y` 옵션 · 판정 전달 · 대화형 양성 대조). 레지스트리는 2파일 픽스처 mock, prompts 는 호출 수를 세는 래퍼 |
| `src/interactive.test.ts`(신규) | 9 | `isInteractive`(isTTY true/false/undefined), `ask` 비대화형 거부 · 대화형 양성 대조, v0 import · ZIP · 클립보드 · monet import 비대화형 rc 1, 대화형 양성 대조, 가드 2(prompts import 는 `interactive.ts` 하나뿐: 계측 대조 파일 수 > 20 · 양성 대조 자기 자신, 진입점 `await program.parseAsync()` · 코드의 `program.parse(` 0건) |
| `src/init/init.test.ts` | +4, 갱신 2 | 비대화형 `init` 이 `init -y` 와 파일 바이트 같음 + 1줄 알림(Tailwind 3 · 4), `-y` 는 알림 없음, 대화형 주입 양성 대조. 기존 대화형 테스트 2건은 판정을 주입하도록(테스트 stdin 은 TTY 가 아님) |

- 수정 전 소스(대상 9파일을 HEAD 로 되돌리고 `interactive.ts` 제거)로 새 테스트 실행: `3 failed` 파일, `12 failed | 153 passed`(interactive.test.ts 는 모듈이 없어 수집 실패). 통과한 것은 종전과 같아야 하는 불변 단언(대화형 경로 · `-y` · dry-run · 충돌 없음)이에요. 원복 뒤 9파일 sha256 대조 OK.
- 변이(`scripts/mutate.sh`, 각 변이 뒤 tar 원복 + sha 대조): 10/10 빨강.

| 변이 | 내용 | 결과 |
|---|---|---|
| M1 | `isInteractive` 를 항상 true | 1 failed |
| M2 | initTemplate 판정을 항상 대화형 | 6 failed |
| M3 | applyTemplate 충돌 판정을 항상 대화형 | 2 failed |
| M4 | template init `-y` 무시 | 2 failed |
| M5 | init 판정을 항상 대화형 | 2 failed |
| M6 | `ask` 의 비대화형 거부 제거 | 1 failed |
| M7 | v0 import 가드 제거 | 1 failed |
| M8 | monet import 판정을 항상 대화형 | 1 failed |
| M9 | 진입점을 `program.parse()` 로 | 1 failed |
| M10 | 다른 소스(`site.ts`)에 prompts 직접 import | 1 failed |

## 4. 빌드 산출물 · CI 스모크

- **cli-smoke 비TTY 갈래(판단: 넣음)**: 단위 테스트는 판정을 주입하므로 「실제 stdin 이 닫힌 dist」와 진입점 안전망을 지나지 않아요. cli-smoke 는 이미 빌드한 dist 를 stdio ignore 로 실행하는 유일한 CI 게이트라(frontend.yml:137), 템플릿 서버(2파일 픽스처) 하나만 더해 넣었어요. 비용은 실행 10건 추가(로컬 수 초). template-smoke 의 CI 연결은 범위 밖(지시).
  - 갈래: stdin `/dev/null` · 빈 파이프 × (template init `--dir` 없음 · 이름 없음 · apply 충돌 · init `-y` 없음 · v0 import) = 10건, 실행 건수가 10이 아니면 측정 실패 rc 2.
  - 신판: 12 단언 통과, 「비TTY 갈래 10건 실행」, `[cli-smoke] OK` rc 0.
  - 양성 대조: `--cli <수정 전 dist>` 로 rc 1, ✗ 12건이 모두 N 갈래(G3 · G4 · D7 은 통과).
- **안전망 실측(`scripts/safety-net.sh`, 빌드한 dist 로 `template init dashboard </dev/null`)**:

| 변이 | rc | 파일 | 출력 |
|---|---|---|---|
| P1 디렉터리 기본값 분기 제거 → `ask(interactive=false)` | 1 | 0 | 「비대화형 실행이라 질문(프로젝트 디렉토리:)에 답할 수 없습니다 …」 |
| P2 P1 + `ask` 거부 제거 → prompts 가 EOF 에서 미결 | 13 | 0 | `Warning: Detected unsettled top-level await … await program.parseAsync()` |
| P3 P2 + 진입점 `program.parse()` | 0 | 0 | 질문 한 줄(종전 결함) |
| P0 원복 | 0 | 10 | 정상 |

- **종료 코드 A/B**(수정 전후 dist, `</dev/null`): `--version` · `--help` · 모르는 명령 · 없는 템플릿 apply · template list · check(빈 디렉터리 · init 뒤 2회) · 없는 컴포넌트 add · 잘못된 `--category` · theme list · v0 guide · monet list · init -y · add button -y 14종 rc 가 바이트 같음(`rc-ab-{before,after}.txt` cmp 동일).

## 5. 게이트 (측정)

| 게이트 | 결과 |
|---|---|
| `turbo run lint --force` | rc 0, 7 tasks, Cached 0 (@axis-ds/cli 포함) |
| `turbo run type-check --force` | rc 0, 11 tasks, Cached 0 |
| `turbo run build --force` | rc 0, 8 tasks, Cached 0. 템플릿 JSON 5개는 updatedAt 만 바뀌어 되돌림 |
| `turbo run test --force` | rc 0, 7 tasks, Cached 0. cli 19 files · 778 tests(이 WI 신규 31) · mcp 166 · ui-react 194 · agentic-ui 148 · theme 47 |
| check-token-refs · check-contrast-pairs · check-types-versions · check-library-links | rc 0 |
| build:registry · test:registry | rc 0. r/index.json · registry.json version 1.8.0 → 1.5.0 되돌림 |
| check-licenses · pack-smoke(퍼블리시 대상 6개 · G2 RSC 통과) · cli-smoke(비TTY 10건) · registry-install-smoke(5/5) | rc 0 |
| E2E | 해당 없음: apps/web 소스를 바꾸지 않았고 바꾼 가이드 문서(quick-start · theme-customization)는 웹앱이 읽지 않음(`apps/web/src` grep 0건) |

## 6. 남은 확인

- [ ] 실제 터미널에서 대화형 1회(사람): `axis template init dashboard`(디렉터리 질문 → Enter → 끝까지 생성), `axis template apply dashboard`(충돌 확인 → n → 그대로). 샌드박스 pty 는 ora 스피너에서 멈춰 판정 수단이 못 돼요(브리프 측정).
- [ ] 발행 뒤 npm 발행본 · 새 HOME · XDG 로 `scripts/matrix.sh` 재측정(AC7).
