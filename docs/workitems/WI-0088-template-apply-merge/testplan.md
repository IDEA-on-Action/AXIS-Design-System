# WI-0088: template apply 의 package.json 합치기 테스트 계획

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 작성일: 2026-10-30 | 상태: 착수 측정(2절) · 구현 결과(3 ~ 6절) · 경로 탈출 방어(7절) 반영, 기대값은 Q100 ~ Q107 권장안 기준
> 기준선: 착수 직전 HEAD e32275e 소스로 빌드한 cli · mcp dist(측정 뒤 scratchpad `$S/base/` 로 옮김)
> `S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/4ae00ed9-0062-46ea-b36b-1f1bfaf43fe2/scratchpad/WI-0088`(세션 임시 경로)

## 1. 측정 방법

- 템플릿: 저장소의 `apps/web/public/templates/<slug>.json` 5개를 로컬 HTTP 로 띄워 `AXIS_TEMPLATE_URL` 로 줘요(네트워크 없음, 배포본과 같은 파일)
- 사용자 프로젝트 7모양: `rich`(최상위 18필드) · `pm-yarn` · `pm-npm`(lockfile 없음, packageManager 만) · `ws-app`(npm 워크스페이스, 루트 package-lock · `apps/web` 에 `workspace:*` 의존성) · `empty` · `broken`(`{ broken json`) · `cfg`(axis.config.json 에 사용자 전용 키 `registry`)
- 실행: CLI `node <cli>/index.js template apply <t> --dir <d> -y`(rc 를 받음), MCP 는 stdio 로 `axis.apply_template { name, targetDir }`. 칸마다 새 tmpdir
- 판정: 전후 package.json 의 최상위 키(사라짐 · 바뀜 · 추가)와 맵 안 키 사라짐 수, 결과가 템플릿 바이트와 같은지, apply 의 「필요한 의존성」 첫 두 단어, 뒤이은 CLI `check --dir <d>` 출력의 설치 명령 첫 두 단어, axis.config.json 사라짐 · 바뀜
- 계측 확인: 처음 실행에서 check 설치 명령 정규식이 `pnpm install` 의 부분 문자열 `npm install` 을 잡아 70칸이 모두 npm 으로 나왔어요. 출력 원문(`theme-only.pm-yarn.cli.txt`)으로 확인하고 앞이 공백 · 줄머리인 경우만 잡게 고친 뒤 다시 쟀어요(아래 값은 고친 뒤)

## 2. 착수 측정 (e32275e 빌드)

70칸(7 × 5 × 2), CLI = MCP 35/35, 템플릿 바이트 그대로 70/70, CLI rc 0 35/35. 템플릿 5개의 결과가 모양마다 같아 모양별로 적어요.

| 모양 | 최상위 사라짐 | 바뀜 | 맵 안 사라짐 | apply 안내 | 뒤이은 check 안내 | axis.config.json |
|---|---|---|---|---|---|---|
| rich | 12 | name · version · private · scripts · dependencies · devDependencies | 6 | npm install | **pnpm install** | - |
| pm-yarn | packageManager | name | 0 | yarn add | **pnpm install** | - |
| pm-npm | packageManager | name | 0 | npm install | **pnpm install** | - |
| ws-app | 0 | name · version · dependencies | 1(`@acme/ui`) | npm install | npm install | - |
| empty | (파일 없음) | - | - | pnpm add | pnpm install | - |
| broken | (파싱 불가) | - | - | pnpm add | pnpm install | - |
| cfg | 0 | name | 0 | pnpm add | pnpm install | ontology-console 만: 사라짐 registry, 바뀜 componentsDir · tailwindConfig · globalCss · brand |

## 3. 수정본 재측정 (같은 스크립트, `--force` 빌드)

70칸, CLI = MCP 35/35, CLI rc 0 35/35.

| 모양 | 최상위 사라짐 | 바뀜 | 맵 안 사라짐 | apply 안내 | 뒤이은 check 안내 | 템플릿 바이트 | axis.config.json |
|---|---|---|---|---|---|---|---|
| rich | **0** | scripts · dependencies · devDependencies(템플릿 키 추가 · 같은 키 템플릿 값) | **0** | npm install | **npm install** | 다름(합침) | - |
| pm-yarn | **0** | 0 | 0 | yarn add | **yarn install** | 다름 | - |
| pm-npm | **0** | 0 | 0 | npm install | **npm install** | 다름 | - |
| ws-app | 0 | dependencies(템플릿 키 추가) | **0** | npm install | npm install | 다름 | - |
| empty | - | - | - | pnpm add | pnpm install | **같음** | - |
| broken | - | - | - | pnpm add | pnpm install | **같음**(알림 1줄) | - |
| cfg | 0 | 0 | 0 | pnpm add | pnpm install | 다름 | ontology-console: 사라짐 **0**, 바뀜 componentsDir · tailwindConfig · globalCss · brand(Q103) |

- 템플릿 바이트 그대로 70 → 20(empty · broken 의 5 × 2 × 2, AC6)
- 「필요한 의존성」 줄은 70칸 모두 수정 전과 같은 매니저예요(WI-0085 동작 불변)

## 4. 테스트 목록

| 파일 | 테스트 | AC |
|---|---|---|
| cli `src/template/apply-files.test.ts` | mergePackageJson 4(사용자 최상위 값 · 맵 합치기 · 키 순서 · 맵이 객체 아님), mergeAxisConfigJson 1, planTemplateFileContent 5(created 바이트 · packageManager · 읽을 수 없음 4종 · 합치지 않는 파일 · 서식 탭/4칸/CRLF/끝 줄바꿈), 계획과 쓰기 1, 실패 주입 되돌림 1 | AC1 ~ AC7 · AC9 |
| cli `src/template/template-apply.test.ts` describe 「WI-0088」 | apply -y 로 사용자 필드 유지 · 다음 명령 yarn, 충돌 목록 표시 · rc 1 · 바이트 그대로, `--dry-run` 표시, init -y 합치기 · 다음 단계 yarn | AC2 · AC8 |
| cli `src/template/template-apply-rollback.test.ts` | apply 쓰기 실패 되돌림 · rc 1, init 쓰기 실패 시 파일 · config · 다음 단계 없음 | AC9 |
| mcp `src/tools/template-apply.test.ts` | 합치기 · packageManager · 「합치기」 표시 · CLI apply -y 와 바이트 같음, 읽을 수 없는 파일 덮어쓰기 · note · dryRun 같은 action | AC6 · AC8 · AC10 |

## 5. 음성 대조

### 5.1 호출지를 HEAD 로 되돌림

`template-apply.ts` · `tools/template.ts` 를 `git show HEAD:` 로 되돌리고(코어 · 테스트는 그대로) 새 테스트를 돌렸어요. 원복은 sha256 대조(0317f695… · a69fbd04… 같음).

| 패키지 | 결과 |
|---|---|
| cli(3파일 49) | rc 1, **6 failed** · 43 passed. 빨강 = WI-0088 describe 4 + rollback 2(새 호출지 테스트 전부), 초록 = 코어 단위 12 · 기존 31 |
| mcp(8) | rc 1, **2 failed** · 6 passed(새 2 전부 빨강) |

### 5.2 코어 변이 (`$S/mutate.mjs`, 원복 sha256 643e604e… 같음)

| 변이 | cli(49) | mcp(8) | 판정 |
|---|---|---|---|
| V1 package.json 을 템플릿으로 통째로(종전) | 7 failed | 1 failed | 빨강 |
| V2 최상위 키 템플릿 우선 | 2 failed | 1 failed | 빨강 |
| V3 맵 같은 키 사용자 우선 | 2 failed | 0 | 빨강 |
| V4 되돌리기 없음 | 3 failed | 0 | 빨강 |
| V5 들여쓰기 무시 | 1 failed | 0 | 빨강 |
| V6 CRLF 무시 | 1 failed | 0 | 빨강 |
| V7 axis.config 사용자 우선 | 1 failed | 0 | 빨강 |
| V8 읽을 수 없어도 합치기 시도 | 7 failed | 1 failed | 빨강 |
| V9 새 디렉터리 정리 없음 | 3 failed | 0 | 빨강 |
| V10 하위 경로 package.json 도 합침 | 1 failed | 0 | 빨강 |
| V11 끝 줄바꿈 무시 | 1 failed | 0 | 빨강 |

11/11 빨강이에요.

## 6. 검증

| 명령 | 결과 |
|---|---|
| `pnpm turbo run build type-check lint test --filter=@axis-ds/registry-core --filter=@axis-ds/cli --filter=@axis-ds/mcp --force` | rc 0, Tasks 11 successful · **Cached 0**, cli 23 파일 · **1184 passed**, mcp 9 파일 · **242 passed**(Q107 전, Q107 뒤는 7.3절) |
| `pnpm check-changeset-mcp-tokens` | rc 0, 「통과(registry-core → cli · mcp)」, 스크립트 자체 테스트 19/19 |

## 7. 경로 탈출 방어 (Q107, 2026-10-30 Master 요청)

### 7.1 테스트

| 파일 | 내용 |
|---|---|
| cli `src/template/template-path-guard.test.ts`(12) | `resolveTemplatePath` 거부 6경우(`../escape.txt` · 절대 경로 · `a/../../escape` · 디렉터리 링크 경유 · 파일 링크 · 끊긴 링크)의 문구와 빈 경로 · `.` · `C:\\evil.txt` · NUL, 안쪽 경로 통과(안쪽 링크 · 아직 없는 대상 디렉터리 포함). apply `-y` 6경우마다 rc 1 · false, 대상 · 밖 · 상위 디렉터리 스냅샷 그대로(정상 파일 2개를 앞에 둬 부분 적용 없음 확인), `--dry-run` 도 rc 1, postInstall 대상이 밖이면 템플릿 파일도 쓰지 않음, init 은 아무것도 쓰지 않고 다음 단계 없음, diff 는 rc 1 · 결과 없음. 저장소 실제 템플릿 5개는 모든 경로가 통과하고 빈 디렉터리에 바이트 그대로 |
| mcp `src/tools/template-path-guard.test.ts`(4) | apply_template 5경우 × dryRun 두 가지가 CLI 와 같은 문구로 실패, 대상 · 밖 스냅샷 그대로, postInstall 대상이 밖이면 쓰지 않음, diff_template 링크 경유 거부, 양성 대조(안쪽 경로는 적용) |

### 7.2 음성 대조 (`$S/guard-mutate.mjs`, 원복 sha256 4파일 같음)

| 변이 | cli(12) | mcp(4) | 판정 |
|---|---|---|---|
| G1 검증 전체 제거(join 만, = main 과 같은 판정) | 6 failed | 3 failed | 빨강 |
| G2 심볼릭 링크 실경로 검사 제거 | 3 failed | 2 failed | 빨강 |
| G3 상위 디렉터리 검사 제거 | 2 failed | 2 failed | 빨강 |
| G4 계획이 postInstall 경로를 검증 안 함 | 1 failed | 1 failed | 빨강 |
| G5 계획이 쓰기 전에 검증하지 않음 | 3 failed | 1 failed | 빨강 |
| G6 CLI diff 검증 없음 | 1 failed | 0 | 빨강 |
| G7 MCP diff 검증 없음 | 0 | 1 failed | 빨강 |
| G8 MCP apply 가 postInstall 경로를 넘기지 않음 | 0 | 1 failed | 빨강 |
| G9 CLI apply 가 postInstall 경로를 넘기지 않음 | 1 failed | 0 | 빨강 |

9/9 빨강이에요. G1 에서 초록으로 남는 cli 6개는 정상 템플릿 5개와 안쪽 경로 통과 테스트예요(검증이 없어도 통과해야 맞음).

### 7.3 정상 템플릿 영향

- Q107 을 넣은 `--force` 빌드로 2 · 3절의 70칸을 다시 재고 `$S/out-fix/all.tsv` 와 `cmp` 했어요: rc 0(바이트 같음)
- `pnpm turbo run build type-check lint test --filter=@axis-ds/registry-core --filter=@axis-ds/cli --filter=@axis-ds/mcp --force`: rc 0, Tasks 11 · Cached 0, cli 24 파일 · **1196 passed**, mcp 10 파일 · **246 passed**
