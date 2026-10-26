# WI-0085: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #217 | 측정 산출물: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/w6cimpl/WI-0085/`(세션 scratchpad, 커밋하지 않음)
> 기준: worktree `fix/batch6c`, 수정 전 = WI-0086 커밋 e63553a 의 빌드본(`turbo build --force` 뒤 `pnpm pack`), 수정 후 = 이 WI 의 빌드본(같은 방법). 발행본 대조 = npm cli 1.7.1 · mcp 1.4.1(브리프가 설치한 `w6cbrief/WI-0085/tools`)

## 1. 재현 · 수정 전 빨강 (측정, 2026-10-26)

- 새 테스트를 수정 전 소스로 돌렸어요. `scripts/prefix.py` 가 수정한 소스 9파일을 `git show HEAD:<path>`(수정 전) 로 바꿔 넣고 테스트한 뒤 수정본으로 되돌려 sha256 이 같음을 확인했어요(「수정본 복원 sha 일치: True」).
  - CLI(workspace-root · template-apply · theme-commands · monet-guidance) `18 failed | 57 passed (75)`, MCP(brand · template-apply) `10 failed | 12 passed (22)`.
  - 빨강 내역: packageManager 판정 3 · AC5 변형 1 · 헬퍼 3, template apply 6 · init 3, theme 빌드 전 1, monet 1(파일), MCP brand 4 · apply_template 6. 초록으로 남은 새 테스트는 수정 전에도 성립하는 음성 대조(conflict lockfile 우선, 워크스페이스 밖 · `.git` 너머, init 의 pnpm 행, cwd 가 npm 이어도 `--dir` 기준)이고, 고친 뒤 지켜지는지는 3절 변이가 판별해요.
- 실경로 수정 전 측정(2절 `meas-run-before.json`): 기대 매니저와 다른 명령 168/285, 발행본 1.7.1 · 1.4.1 은 171/285.

## 2. 실경로 신구 비교 (측정)

재현 방법(모두 scratchpad `scripts/`):

1. `bash scripts/mkfx.sh fx` 픽스처 14개(브리프 10개 + `pm-bun-nolock` · `ws-pm-npm-nolock` · `ws-applm-npm-rootyarn`(앱 npm@ + 루트 yarn.lock) · `outside-pm-npm`(워크스페이스 아닌 상위의 npm@)) + 측정 중 만드는 `link-ws-npm`(ws-npm 앱을 가리키는 링크 L1) = 15. 조상 가드: scratchpad 상위에 package.json · pnpm-workspace.yaml · lockfile · `.git` 0개(같은 루프가 worktree 경로에서는 3개를 잡아 계측이 살아 있음을 확인).
2. 빌드본을 `pnpm pack` 해 새 `tools/` 에 `env -i PATH=… HOME=<새> XDG_CONFIG_HOME=<새> npm install <tgz>` rc 0.
3. `node scripts/meas.mjs <B> fx <out>`: 픽스처마다 **상태별 새 사본**에서 cli `theme list --dir`(미설치 · 미지원 1.2.1 · 빌드 전 1.7.0), MCP stdio `axis.list_brands` · `axis.get_brand`, cli `template apply dashboard --dir -y`, MCP `axis.apply_template`, cli `template init dashboard --dir <apps/new 또는 new>`. 자식 env 는 PATH · 새 HOME · 새 XDG 만.
   - 상태마다 새 사본을 쓰는 이유(측정 중 발견): MCP 서버는 오래 사는 프로세스라 같은 경로의 tokens package.json 판독이 캐시돼, 같은 경로에서 미지원 → 빌드 전으로 바꾸면 빌드 전 칸에 미지원 안내가 찍혔어요. 첫 측정본은 버리고 사본 방식으로 수정 전 · 후 · 발행본을 모두 다시 쟀어요.
4. `python3 scripts/analyze.py` · `scripts/cmp.py` → `analyze.txt` · `cmp.txt`

| 지표 | 발행본 1.7.1 · 1.4.1 | 수정 전(WI-0086 위) | 수정 후 |
|---|---|---|---|
| 기대 매니저와 다른 명령(15픽스처 x 11칸, 명령 285개) | 171 | 168 | **0** |
| cli · mcp 문자열 비교(설치 3상태 x list · get + apply, 90쌍) 불일치 | - | - | **0** |
| rc 바뀐 칸(수정 전 → 후) | - | - | 0 (theme list 3상태 rc 1, template apply · init rc 0 그대로) |
| 계측 대조군: 수정 전에도 판정을 거치던 cli 설치 줄이 lockfile 픽스처에서 npm · yarn | - | 6/6 | 6/6 |

- 기대 매니저: 앱 층 판정 기준 conflict · single-npm · ws-npm · pm-npm · ws-pm-npm · link → npm, single-yarn · ws-yarn · pm-yarn · ws-pm-yarn · ws-applm → yarn, none · ws-pnpm · pm-bun · outside → pnpm. init 은 새 디렉터리 기준이라 워크스페이스 아래(`apps/new`)는 루트 매니저, 단일 프로젝트 아래 `new` 는 pnpm(WI-0081 경계).
- 음성 대조 4픽스처(none · ws-pnpm · pm-bun-nolock · outside-pm-npm): 바뀐 칸은 templateApply · mcpApply · templateInit 의 따옴표뿐(따옴표를 빼면 수정 전과 같음), 나머지 8칸 바이트 같음.
- 발행본 → 수정 후 칸별 바뀐 픽스처 수: themeNotInstalled · themeUnsupported 5/15(packageManager 4 + 링크 1, 링크 행은 WI-0086), MCP brand 5칸 · themeNotBuilt 11/15, template 3칸 15/15(따옴표 포함). 발행본 → 수정 전(WI-0086) 차이 3칸은 모두 `link-ws-npm` 의 cli theme 설치 줄(pnpm → npm, WI-0086 실경로 진입부). 두 WI 의 전이를 합친 표는 `meas-run-published.json` → `meas-run-after.json` 이에요.

## 3. 변이 (측정)

`scripts/mutants.py`: 수정본에 변이 하나씩 넣고 CLI 4파일 · MCP 2파일 테스트, 원복 뒤 sha256 같음(「복원 sha 일치: True」).

| 변이 | 내용 | CLI | MCP |
|---|---|---|---|
| P1 | packageManager 를 lockfile 앞에 | 2 failed | - |
| P2 | packageManager 무시 | 8 failed | 2 failed |
| P3 | 경계 없이 아무 상위 package.json 의 packageManager | 1 failed | - |
| A1 | apply 를 pnpm 상수로 | 8 failed | - |
| A2 | dev 플래그 누락 | 6 failed | 5 failed |
| A3 | 템플릿을 쓴 뒤 판정 | 1 failed | - |
| I1 | init 을 cwd 로 판정 | 4 failed | - |
| I2 | run 명령 pnpm dev 고정 | 3 failed | - |
| W1 | 워크스페이스 실행 분기 제거 | 2 failed | 3 failed |
| M1 | MCP handle 이 installCommand 를 채우지 않음 | - | 5 failed |
| B2 | MCP 포매터가 installCommand 무시 | - | 3 failed |
| N1 | monet 고정 문자열 | 1 failed | - |
| B1 | MCP index.ts 가 명령을 넘기지 않음 | (단위 테스트 밖) | stdio 실측 ws-npm list_brands · get_brand 가 `pnpm add` 로 돌아감(`b1-mutant.txt`), 원복 · 재빌드 뒤 `npm install`(`b1-fixed.txt`), index.ts sha256 원복 OK |

## 4. 게이트 (측정)

| 게이트 | 결과 |
|---|---|
| `turbo run lint --force` | rc 0, 7/7, Cached 0 |
| `turbo run type-check --force` | rc 0, 11/11, Cached 0 |
| `turbo run build --force` | rc 0, 8/8, Cached 0 |
| `turbo run test --force` | rc 0, 7/7, Cached 0 (cli 869 · mcp 181 · ui-react 194 · agentic-ui 148 · theme 47) |
| check-token-refs · check-contrast-pairs | rc 0, 위반 0건 |
| check-types-versions | rc 0, pass 8 · fail 0 |
| check-changeset-mcp-tokens | rc 0, 기준 1168942(merge-base) · 바뀐 파일 36 · registry-core 4개, 「통과(registry-core → cli · mcp)」, 단위 pass 19 |
| check-library-links | rc 0, pass 28 |
| build:registry · test:registry | rc 0 · rc 0(pass 45) |
| check-licenses | rc 0 |
| pack-smoke | rc 0, 퍼블리시 대상 6개 |
| cli-smoke | rc 0, 비TTY 갈래 12건 |
| registry-install-smoke | rc 0, 5/5 |
| 전수 grep(AC9) | 남은 18줄이 기본값 · 주석 · 헬퍼 분기, 대조군 `project.ts:29` 잡힘(`ac9-grep.txt`) |

- 생성물: build 뒤 `apps/web/public/templates/*.json` 5개 diff 는 updatedAt 줄뿐(나머지 0줄)이라 되돌렸고, build:registry 뒤 `r/index.json` · `r/registry.json` version 1.8.1 → 1.5.0 으로 되돌렸어요.
- E2E: 이번 커밋에 `apps/` 변경 0건. `apps/web/e2e` 의 `pnpm --filter` 3파일은 레포 개발 안내 주석이라 바뀐 코드와 무관해 로컬에서 돌리지 않았어요(미실행, PR CI 가 돎).

## 5. 남은 것 · 위험

- ~~R1 발행 뒤 재측정(AC10): 새 발행본으로 2절을 다시 돌려 수정 후 표와 1:1 인지.~~ 2026-10-26 해소(6절, 1:1 일치)
- R2 yarn 실제 설치본에서 `yarn workspace X build` · `yarn dev`, npm 7 미만에서 `-w` 는 미측정.
- R3 Corepack 탐색 방식은 미측정(prd 1.3).
- R4 monet import 대화형 출력은 미측정(판정 함수 단위 테스트만).

## 6. 발행 뒤 재측정 (AC10, 2026-10-26)

- 대상: npm 발행본 `@axis-ds/cli` 1.7.2 · `@axis-ds/mcp` 1.4.2(PR #225 머지 7d1915b, Release PR #226 머지 37b73d0, publish run 40271807118, provenance 2/2), 대조 cli 1.7.1 · mcp 1.4.1. 설치본 버전을 실측으로 확인(tools 1.7.2 · 1.4.2, tools-old 1.7.1 · 1.4.1, npm install rc 0).
- 환경: 자식 프로세스 env 는 PATH · 새 HOME · 새 XDG_CONFIG_HOME 만. 조상 가드(package.json · lockfile · .git)에 걸린 것 0개, 같은 루프를 레포 경로에서 돌린 양성 대조는 3개를 잡음. 2절의 `scripts/meas.mjs` · `mkfx.sh` 를 그대로 재사용(15픽스처 x 11칸).
- 결과: 1.7.2 · 1.4.2 의 `meas-run-new.json` 은 구현 때 `meas-run-after.json` 과 cmp rc 0(35760 바이트). 기대 매니저와 다른 명령 신판 0/285 · 구판 171/285, 픽스처별 신판 0(ws-npm · ws-yarn · single-npm · single-yarn · pm-*-nolock 4종 · link-ws-npm 각 0/19). cli · mcp 문자열 비교 90쌍 불일치 0.
- 종료 코드: 칸 165 중 바뀐 칸 121 · 같은 칸 44, rc 가 바뀐 칸 0. 신판 rc 는 templateApply 0 · templateInit 0 · theme 3상태 1 로 기대값과 같음.
- 음성 대조: none · ws-pnpm · pm-bun-nolock · outside-pm-npm 4개는 신구 pnpm 0/19 오차, 바뀐 칸은 templateApply · mcpApply · templateInit 의 따옴표뿐, 나머지 8칸 바이트 같음. 계측 대조군: 구판 cli 설치 줄이 lockfile 픽스처에서 npm · yarn 인 것 5/5.
- 측정 방법 재현: 1.7.1 · 1.4.1 로 잰 `meas-run-old.json` 이 구현 때 `meas-run-published.json` 과 cmp rc 0(33066 바이트).
- 미측정(R2 · R3 그대로): 실제 yarn 설치본의 `yarn workspace X build` · `yarn dev`, npm 7 미만 `-w`, Corepack 탐색 방식(픽스처가 lockfile 스텁).
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/wpub6c/w85-new/meas-run-new.json` · `wpub6c/w85-old/meas-run-old.json` · `wpub6c/w85-an/`(analyze.txt · cmp.txt · byfx.py)
