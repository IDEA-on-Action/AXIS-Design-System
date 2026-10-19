# WI-0036 테스트 계획: mcp 레지스트리 도구 데이터 경로 수정

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 릴리스 노트: [release-notes.md](./release-notes.md)

## 1. 범위

- `packages/axis-mcp` `copy-data` 대상 변경(FR-1)과 `scripts/mcp-smoke.mjs` · `scripts/pack-smoke.mjs` 연결(FR-2 · FR-3)
- 스모크 대상은 번들 레지스트리 데이터를 읽는 도구 6개입니다. 템플릿 도구 4개는 원격 `axis.minu.best` 를 읽어 대상이 아닙니다(prd C4).

## 2. 스모크 단언

| 도구 | 기대 | 왜 이 문자열인가 |
|---|---|---|
| `tools/list` | `EXPECTED_TOOLS` 16개와 1:1 (누락 · 목록 밖 도구 모두 실패) | 도구 등록과 스모크 목록이 어긋나면 드러나게 |
| `axis.list_components` | `button` | 레지스트리 목록 행 |
| `axis.list_tokens` | `colors.primary` | 토큰 목록 행 |
| `axis.search_components` | `` (`button`) `` | 머리글 `## 검색 결과: "button"` 은 결과 0건이어도 나오므로 결과 행 형식으로 봅니다 |
| `axis.get_component` | `button` | 컴포넌트 상세 |
| `axis.get_token` | `colors.primary` | 토큰 상세 |
| `axis.install_component` | 응답의 `button` + `install-target/components/ui/button.tsx` 실제 생성 | 응답 문구만으로는 파일 쓰기를 증명하지 못합니다 |

- 설치 단계 `npm install` 에 300초 timeout 을 둡니다. 시간 초과는 예외로 올라와 pack-smoke 의 `pack 중 오류` 실패가 됩니다.
- 하네스는 임시 디렉터리만 쓰고 워킹트리를 되돌리지 않습니다(`git checkout` · `git clean` · `git stash` 호출 0건, `scripts/pack-smoke.mjs` · `scripts/mcp-smoke.mjs` grep).

## 3. 결과 (2026-10-19, 기준 HEAD 4f27105 + 보정 변경)

| ID | AC | 명령 | 결과 |
|---|---|---|---|
| T1 | AC1 | `pnpm pack` (packages/axis-mcp) | `dist/data/components.json` · `tokens.json` 포함 |
| T2 | AC2 | `node scripts/pack-smoke.mjs` | rc 0, mcp tools/list 16개 · 호출 6건, 6개 패키지 통과 |
| T3 | AC3 | `node scripts/mcp-smoke.mjs <npm pack @axis-ds/mcp@1.1.4>` | rc 1, 6건 isError(ENOENT `dist/data/components.json`) |
| T4 | AC3 | 1.1.3 · 1.1.0 배포본, 수정 전 HEAD 빌드, `copy-data` 를 되돌린 pack-smoke | rc 1, 6건 결함(보정 전 실측, release-notes 검증 표) |
| T5 | 단언 | 로컬 tarball 의 `dist/data/components.json` 을 `{"components":[]}` 로 바꾼 변이 | 보정 전 rc 1 · 3건(search_components 통과), 보정 후 rc 1 · 4건(search_components 실패 추가) |
| T6 | 단언 | 번들의 `writeFileSync(fullPath, ...)` 를 지운 변이(응답은 성공) | 보정 후 rc 1, `install_component: 설치 파일 없음` 1건 |
| T7 | 단언 | `INSTALL_TIMEOUT_MS` 를 50 으로 바꾼 사본 | rc 1, `spawnSync npm ETIMEDOUT` |
| T8 | AC4 | `pnpm changeset status` | patch 대상 `@axis-ds/mcp` 하나 |
| T9 | AC5 | `pnpm build --force` · `pnpm type-check --force` · `pnpm lint --force` | rc 0, 8/8 · 8/8 · 4/4, 0 cached |

- 변이 T5 · T6 · T7 은 임시 디렉터리의 tarball 사본과 스크립트 사본에만 적용했습니다. 저장소 파일은 바꾸지 않았습니다.
- `pnpm build` 가 고친 `apps/web/public/templates/*.json` 은 커밋하지 않고 되돌렸습니다.
- 스모크 전제: 설치는 npm 레지스트리에서 의존성을 받습니다(네트워크 필요). env · 경로 주입 없이 설치된 패키지의 `bin` 을 그대로 실행합니다.

## 3.1 PR CI 배선 결과 (FR-5 · AC6, 2026-10-19, HEAD ddf8047)

CI 와 같은 순서로 로컬 실행했습니다. Node v22.22.0 · npm 10.9.4 · pnpm 9.15.4(CI 는 Node 20, 아래 T12 로 따로 확인). turbo 단계는 `--force` 로 캐시를 쓰지 않았습니다.

| ID | 명령 | 결과 |
|---|---|---|
| T10 | `pnpm install --frozen-lockfile` → `pnpm lint --force` → `pnpm type-check --force` → `pnpm check-token-refs` → `pnpm run test --force` → `pnpm build:registry` → `pnpm check-licenses` → `pnpm build --force` → `pnpm pack-smoke` | 전부 rc 0. build 8/8 · `Cached: 0`(189초), type-check 8/8 · `Cached: 0`(79초), test 5/5 · `Cached: 0`(17초), pack-smoke 6개 패키지 통과 · mcp tools/list 16개 · 호출 6건(4초, npm 캐시 있음) |
| T11 | `scripts/mcp-smoke.mjs` `EXPECTED_TOOLS` 에서 `axis.check_project` 를 지운 변이 → `pnpm pack-smoke` | rc 1, `tools/list 에 목록 밖 도구: axis.check_project (EXPECTED_TOOLS 갱신 필요)` 1건. 원본 복원 후 sha256 앞 16자리 `1baaf76bfd9528e0` 일치 |
| T12 | `npx -y node@20 scripts/pack-smoke.mjs` (Node v20.20.2, npm 은 PATH 의 10.9.4) | rc 0, 6개 패키지 통과 · mcp 16개 · 6건(40초, node@20 내려받기 포함) |
| T13 | `npm_config_cache=<빈 디렉터리> pnpm pack-smoke` | rc 0, 9초(mcp 의존성을 npm 레지스트리에서 새로 받음) |
| T14 | actionlint 1.7.7(docker `rhysd/actionlint:1.7.7`) `frontend.yml` | 수정 전 · 후 모두 rc 1, 같은 4건(Cloudflare credentials 확인 step 의 SC2086 info, 수정 전 138 · 209행 = 수정 후 146 · 217행). 추가한 step 에서 나온 지적 0건. `publish.yml` rc 0 |
| T15 | `git merge-tree --write-tree HEAD origin/feat/wi-0025-m4-demo`(c111909, #110) | rc 0, 충돌 없음. 단 병합 트리에 Pack smoke step 이 2개(M4 의 AC4 step 105행, 이 WI 의 step 254행) |
| T16 | `git merge-tree --write-tree HEAD 940e83c`(#118 `fix/wi-0035-tokens-esm`) | rc 0, 충돌 없음. 병합 트리 `pack-smoke` 스크립트는 `node scripts/pack-smoke.mjs && node scripts/pack-install-smoke.mjs` |
| T17 | T16 병합 트리를 스크래치패드에 풀어 `pnpm install --frozen-lockfile` → `pnpm turbo run build --force --filter='./packages/*'` → `pnpm pack-smoke` | 모두 rc 0. build 6/6 · `Cached: 0`, pack-smoke 6개 통과 · mcp 16개 · 6건, 이어서 pack-install-smoke tokens 서브패스 8건 · tsc rc 0(33초) |

- T10 의 `pnpm build` 가 고친 `apps/web/public/templates/*.json` 5개는 되돌렸습니다.
- PR CI run 의 실측(Pack smoke step 소요 시간 · rc)은 push 뒤에 남습니다(4장).

## 4. 남은 확인

- 배포 후 `npm pack @axis-ds/mcp@1.1.5` 로 `node scripts/mcp-smoke.mjs <tgz>` rc 0 확인(todo M1-4)
- PR #116 CI run 에서 `Pack smoke (외부 npm 소비 · mcp 실행 검증, WI-0036)` step rc 0 과 소요 시간 확인(AC6, todo M1-5)
