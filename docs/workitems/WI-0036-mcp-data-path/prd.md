# WI-0036: mcp 레지스트리 도구 데이터 경로 결함(ENOENT) 수정 PRD

> 작성일: 2026-10-19 | 버전: v1.0 (2026-10-19) | 작성자: Sinclair Seo | WI: WI-0036 | GitHub: #115 | 우선순위: P1 | 상태: Approved (2026-10-19 결정 반영)
> 기준: `origin/main` e690905 (`@axis-ds/mcp` 1.1.4 배포 완료)
> 관련: WI-0028(cli · mcp 브랜드 도구) 설계 중 발견. 이 WI 는 WI-0028 범위와 분리한 별도 patch 입니다(2026-10-19 사용자 결정)

---

## 1. 개요

### 1.1 배경
- 배포된 `@axis-ds/mcp@1.1.4` 에서 `axis.list_components` · `axis.list_tokens` 가 `ENOENT` 로 실패합니다(Issue #115). WI-0028 설계 중 stdio 로 서버를 띄워 `tools/list` 16개는 정상, 두 도구 호출은 `isError` 인 것을 확인했습니다.
- `pack-smoke` 는 tarball 구조(workspace 프로토콜 · exports 타깃 · CSS 변수)만 보고 서버를 실행하지 않아 이 결함을 잡지 못했습니다.

### 1.2 원인 (실측, e690905)
| # | 내용 | 실측 |
|---|---|---|
| C1 | 소스 `src/registry/loader.ts` 는 `DATA_DIR = join(__dirname, "data")` 입니다. 소스 기준 `__dirname` 은 `src/registry` 라 `src/registry/data` 를 가리켜 맞습니다 | 소스 트리에 `src/registry/data/{components,tokens}.json` 실재 |
| C2 | tsup 가 `src/index.ts` 를 `dist/index.js` 한 파일로 번들하면서 `__dirname` 이 `dist` 가 됩니다. 번들의 데이터 경로는 `dist/data` 입니다 | `dist/index.js` 14행 `var DATA_DIR = join(__dirname, "data");` |
| C3 | 빌드 스크립트 `copy-data` 는 `src/registry/data` 를 `dist/registry/data` 로 복사합니다. `files` 는 `dist` · `src/registry/data` 라 tarball 에 `dist/data` 가 없습니다 | 로컬 빌드 후 `find dist` 에 `dist/registry/data/*.json` 만 있음 |
| C4 | 같은 레지스트리(`getRegistry()`)를 쓰는 도구는 이슈에 적힌 2개가 아니라 6개입니다: `search_components` · `get_component` · `list_components` · `list_tokens` · `get_token` · `install_component` | 1.1.4 tarball 을 설치해 6개 호출, 6개 모두 `isError`(ENOENT `.../dist/data/components.json`) |
| C5 | 첫 배포 1.1.0 부터 같은 결함입니다 | 1.1.0 · 1.1.1 · 1.1.2 · 1.1.3 · 1.1.4 tarball 모두 `DATA_DIR = join(__dirname, "data")` 이고 `dist/data` 없음. 1.1.0 · 1.1.3 · 1.1.4 는 설치 · 실행으로 6건 isError 재현 |
| C6 | 나머지 도구는 번들 데이터를 읽지 않습니다. 템플릿 4개는 원격(`AXIS_TEMPLATE_URL`, 기본 `axis.minu.best/templates`), `check_project` 와 프롬프트 5개는 인자로 받은 디렉터리를 읽습니다 | `src/tools/template.ts` · `prompt/save.ts` · `prompt/validate.ts` 의 경로 기준 확인 |

### 1.3 목표
1. 배포 tarball 에서 레지스트리 도구 6개가 `isError` 없이 동작합니다.
2. tarball 을 설치해 서버를 실행하고 도구를 호출하는 스모크를 `pack-smoke` 에 붙여, 같은 계열 결함이 배포 전에 걸리게 합니다.
3. `@axis-ds/mcp` patch(1.1.5)로 배포합니다. cli 와 linked 4패키지는 바꾸지 않습니다.

### 1.4 확정 결정 (2026-10-19)
| # | 결정 | 내용 |
|---|---|---|
| D1 | 분리 | WI-0028 범위와 분리한 별도 patch(mcp 1.1.5) 로 고칩니다 |
| D2 | 수정 방식 | 데이터를 번들 옆(`dist/data`)에 복사합니다. 경로 기준을 번들 위치에 맞추는 코드 변경보다 단순하고, 소스 실행(`src/registry/data`)과 번들 실행(`dist/data`)이 같은 `join(__dirname, "data")` 로 맞습니다. tarball 목록으로 바로 검증됩니다 |
| D3 | 스모크 | tarball 을 빈 디렉터리에 `npm install` 하고 `bin` 으로 stdio 실행, `tools/list` 와 번들 데이터를 읽는 도구 6개를 호출합니다. `pack-smoke` 안에서 실행해 `publish.yml` 과 `pnpm release` 양쪽에 걸립니다 |
| D4 | PR CI (2026-10-19 추가 결정) | PR CI(`frontend.yml` `ci` job)에서도 `pnpm pack-smoke` 를 실행합니다. `EXPECTED_TOOLS` 1:1 이 깨지면 main push 의 발행이 막히기 전에 PR 단계에서 실패하게 하려는 것입니다(2장 Non-goal 에서 범위로 옮김) |

---

## 2. Non-goals (범위 제외)

- **loader 코드 변경**: D2 로 필요 없습니다.
- **`files` 의 `src/registry/data` 정리**: tarball 에 같은 JSON 이 두 벌 들어가지만 이번 결함과 무관합니다.
- **템플릿 도구의 실행 스모크**: 원격 사이트를 읽으므로 사이트 가용성이 배포를 막게 됩니다. 이번 스모크 대상이 아닙니다.
- **`@axis-ds/cli` 변경 · 배포**: cli 는 mcp 데이터를 쓰지 않습니다.
- ~~**PR CI(`frontend.yml`)에 pack-smoke 추가**~~: 2026-10-19 결정 D4 로 범위에 넣었습니다(FR-5).

---

## 3. 요구사항

### 3.1 기능 요구사항
- FR-1: `packages/axis-mcp/package.json` 의 `copy-data` 가 `src/registry/data` 를 `dist/data` 로 복사합니다.
- FR-2: `scripts/mcp-smoke.mjs` 는 tarball 하나를 받아(인자 없으면 `packages/axis-mcp` 를 `pnpm pack`) 빈 임시 디렉터리에 설치하고, 설치된 패키지의 `bin.axis-mcp` 를 stdio 로 실행해 JSON-RPC 로 검사합니다.
  - `initialize` 성공
  - `tools/list` 가 등록 도구 16개와 1:1(누락 · 목록 밖 도구 모두 실패)
  - 레지스트리 도구 6개 호출에서 JSON-RPC 오류 · `isError` 없음, 응답에 기대 문자열(`button` · `colors.primary`) 포함
- FR-3: `scripts/pack-smoke.mjs` 가 `@axis-ds/mcp` tarball 에 FR-2 를 실행합니다. 퍼블리시 대상에서 mcp 를 찾지 못해 실행하지 못하면 미수행으로 실패합니다.
- FR-4: `.changeset` 에 `@axis-ds/mcp` patch changeset 을 둡니다.
- FR-5: `.github/workflows/frontend.yml` `ci` job 이 `pnpm build` 다음에 `pnpm pack-smoke` 를 실행합니다(D4).
  - 실패를 숨기지 않습니다(`continue-on-error` · `|| true` 없음). 실패하면 `ci` job 이 실패해 `deploy-preview` · `deploy-production`(`needs: ci`)을 막습니다.
  - 위치는 기존 step 사이가 아니라 job 끝(Upload build artifact 다음)입니다. WI-0025 M4(#110)가 Build 와 Upload build artifact 사이를 고치므로 충돌을 피합니다.
  - 트리거 paths 는 이미 `packages/**` · `scripts/**` 를 포함하므로 바꾸지 않습니다.

### 3.2 비기능 요구사항
- **실경로**: 스모크는 소비자와 같이 `npm install <tgz>` 로 설치하고 `bin` 으로 실행합니다. env · 경로를 주입하지 않습니다(설치에 npm 레지스트리 접근이 필요합니다).
- **음성 대조**: 수정 전 tarball 로 스모크가 실패해야 합니다.

---

## 4. 수용 기준 (AC)

- AC1: 수정 후 `pnpm pack` tarball 에 `package/dist/data/components.json` · `tokens.json` 이 있습니다.
- AC2: 수정 후 `node scripts/pack-smoke.mjs` rc 0, mcp 줄에 `tools/list 16개, 레지스트리 도구 호출 6건`.
- AC3: 배포본 1.1.4 · 1.1.3 tarball 과 수정을 되돌린 로컬 빌드에서 스모크 rc 1, 6건 isError.
- AC4: `pnpm changeset status` 에 patch 대상이 `@axis-ds/mcp` 하나.
- AC5: `pnpm build` · `pnpm type-check` · `pnpm lint` 통과(`--force`).
- AC6: `frontend.yml` 의 CI step 순서를 로컬에서 그대로 실행해 `pnpm pack-smoke` rc 0, `EXPECTED_TOOLS` 에서 도구 하나를 뺀 변이로 rc 1(FR-5). PR CI run 에서 Pack smoke step 통과.
