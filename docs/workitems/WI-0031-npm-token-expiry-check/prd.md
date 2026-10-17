# WI-0031: npm Trusted Publishing(OIDC) 전환으로 토큰 만료 위험 제거 PRD

> 작성일: 2026-10-17 | 버전: v1.0 (2026-10-17) | 작성자: Sinclair Seo | WI: WI-0031 | GitHub: #96 | 상태: Approved (2026-10-17 결정 반영)
> 기준: `origin/main` 91bbf65 (`@axis-ds/*` linked 4개 1.2.1 버전 표기, npm 미배포 · cli · mcp 1.1.3 배포됨)
> 관련: WI-0025 1.2.1 배포 대기(이 WI 머지가 곧 1.2.1 publish 실행입니다)

---

## 1. 개요

### 1.1 배경
- 2026-10-15 1.2.1 publish(run 38663901499)가 E404로 실패했습니다. 원인은 `NPM_TOKEN`(2026-07-07 등록, 90일 수명) 만료였고, 릴리스 PR 머지 뒤에야 드러났습니다.
- 토큰을 교체한 뒤 2026-10-16 실행(run 38933630020)은 granular 토큰의 EOTP(2FA 요구)로 다시 실패했습니다. 이 실행의 npm 은 Node 22.23.3 번들 npm 10.9.9 였습니다.
- npm 은 쓰기 토큰의 2FA 우회를 단계적으로 막고 있습니다. 2025-11-05 이후 쓰기 토큰은 기본으로 2FA 를 요구하고, bypass-2FA 토큰의 직접 publish 는 2027년 1월 제거가 목표입니다. 토큰 경로는 중기적으로 유지할 수 없습니다.

### 1.2 Issue #96 의 원래 목표와 이 WI 의 해결 방식
| 항목 | 내용 |
|---|---|
| 원래 목표 | 토큰 만료를 배포 전에 알아차립니다. 후보는 publish 전 인증 선검사(`npm whoami`)와 토큰 등록일 기준 만료 임박 알림이었습니다 |
| 해결 방식 | 감지 장치를 더하는 대신 **토큰 자체를 없앱니다.** GitHub Actions OIDC 로 npm 에 직접 인증하는 Trusted Publishing 으로 바꾸면 만료될 장기 토큰이 없어지므로, 만료를 감지할 대상이 사라집니다 |
| 부수 효과 | OIDC 발행에는 provenance 가 별도 설정 없이 붙습니다(public 저장소 · public 패키지 조건 충족) |

### 1.3 원인 (실측, 수정 전)
| # | 내용 | 위치 (수정 전) |
|---|---|---|
| C1 | publish job 에 `id-token: write` 권한이 없습니다. 이 권한이 없으면 npm CLI 가 OIDC 를 조용히 건너뜁니다 | `.github/workflows/publish.yml` L21-23 |
| C2 | Node 22 번들 npm 은 10.9.x 입니다. Trusted Publishing 은 npm 11.5.1 이상을 요구합니다. pnpm 9.15.4 의 publish 는 PATH 의 `npm` 에 위임하므로 이 버전이 OIDC 사용 여부를 결정합니다 | `publish.yml` L33-37 |
| C3 | changesets 단계에 `NPM_TOKEN` env 가 있습니다. changesets/action@v1 은 이 값이 있으면 `~/.npmrc` 에 `_authToken` 을 쓰고, npm CLI 는 OIDC 교환에 실패해도 예외 없이 그 토큰으로 넘어가 원인이 가려집니다 | `publish.yml` L67 |
| C4 | 6개 패키지의 `repository.url` 이 `https://github.com/thoughtandaction/axis.git` 입니다. 이 저장소는 GitHub API 에서 404 이고, npm 은 `repository.url` 이 발행 저장소와 정확히 일치하기를 요구합니다 | `packages/axis-{tokens,theme,ui-react,agentic-ui,cli,mcp}/package.json` |

### 1.4 목표
1. CI publish 가 장기 토큰 없이 OIDC 로 인증되게 합니다.
2. 1.2.1(linked 4개)을 이 경로로 처음 배포하고 provenance 를 확인합니다.
3. 검증이 끝나면 토큰 경로(`NPM_TOKEN` secret · granular 토큰 · 토큰 publish 허용)를 닫습니다.

### 1.5 범위
- 포함: `publish.yml` 4곳 변경(권한 · npm 설치 단계 · env · 주석), 6개 `package.json` `repository.url` 정정, npmjs.com 사용자 작업 절차, 검증 · 실패 대응 · 토큰 경로 폐쇄 순서 문서화
- 제외: 2장 Non-goals 참고

### 1.6 확정 결정 (2026-10-17)
| # | 결정 | 내용 |
|---|---|---|
| D1 | npm 확보 방식 | Node 22 를 유지하고 `npm@11.19.1` 을 정확한 버전으로 고정 설치합니다. 11.19.1 은 2026-08-26 배포이고 engines `^20.17.0 \|\| >=22.9.0` 이 Node 22 와 맞습니다. 설계안의 11.21.1(2026-10-15 배포)은 배포 이틀째라 채택하지 않았습니다. dist-tag OIDC(11.21.0 이상)는 이번 경로에 필요하지 않습니다 |
| D2 | 발행 방식 | Trusted Publisher 의 Allowed actions 에 direct `npm publish` 를 허용하고 changesets 자동 publish 를 유지합니다. npm 권고(staged-only)와 반대 방향임을 인지하고 고른 결정입니다 |
| D3 | 실행 시점 | npmjs.com 등록 직후 바로 머지합니다. 워크플로 disable 단계는 두지 않습니다 |
| D4 | cli · mcp 등록 | 다음 릴리스 changeset 머지 직전에 등록합니다. 지금 등록하면 이번 실행에서 건너뛰어(1.1.3 배포됨) 첫 publish 없이 48시간 뒤 만료되기 때문입니다 |

---

## 2. Non-goals (범위 제외)

- **pnpm 11 · 12 로 업그레이드**: native OIDC 를 처음 지원한 pnpm 버전이 확인되지 않았고, 11.x 회귀 보고는 서드파티 출처뿐입니다.
- **changesets/action@v2 · Changesets CLI v3 전환**: CLI 3.0.0 은 `pnpm >=10.0.0` 을 요구해 pnpm 9.15.4 고정과 충돌합니다. `@v1` 을 유지합니다.
- **Node 24 전환**: lint · build 런타임까지 바뀌므로 이번 범위에서 다루지 않습니다(D1).
- **staged publish(`npm stage publish`) 도입**: changesets 지원 여부가 확인되지 않았습니다(D2).
- **버전 변경 · changeset 추가**: 1.2.1 은 이미 커밋돼 있습니다. `project-todo.md` · `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다.

---

## 3. 요구사항

### 3.1 기능 요구사항
- FR-1: `publish.yml` publish job `permissions` 에 `id-token: write` 를 추가합니다. `contents: write` · `pull-requests: write` 는 changesets 의 태그 push 와 Version PR 생성에 필요하므로 유지합니다.
- FR-2: `Setup Node.js` 바로 다음에 `npm install -g npm@11.19.1` 과 `node` · `npm` 버전 · `npm` 경로를 출력하는 단계를 둡니다. `setup-node` 에 `registry-url` 은 넣지 않습니다(넣으면 `NODE_AUTH_TOKEN` 용 `.npmrc` 가 생깁니다).
- FR-3: changesets 단계 env 에서 `NPM_TOKEN` 줄을 지웁니다(빈 값으로 남기지 않습니다). 첫 전환 실행에서 OIDC 실패 사유를 보기 위해 `NPM_CONFIG_LOGLEVEL: verbose` 를 둡니다.
- FR-4: 발행 job 주석을 OIDC 기준으로 고칩니다.
- FR-5: 6개 `package.json` 의 `repository.url` 을 `https://github.com/IDEA-on-Action/AXIS-Design-System.git` 로 바꿉니다. `type` · `directory` 는 유지하고, 조직 · 저장소 대소문자는 `git remote get-url origin` 값을 따릅니다.

### 3.2 비기능 요구사항
- **버전 불변**: 6개 `package.json` 의 `version` 과 `.changeset/` 은 바뀌지 않습니다.
- **변경 국소성**: `publish.yml` diff 는 FR-1~4 뿐이고, `package.json` diff 는 `repository.url` 한 줄씩뿐입니다.
- **회귀 없음**: build · type-check · test · lint 결과가 수정 전과 같습니다.

---

## 4. 사용자 작업 (npmjs.com, 사람이 직접)

### 4.1 Trusted Publisher 등록 입력값 (패키지마다)
위치: npmjs.com → 패키지 → Settings → Trusted Publisher → GitHub Actions

| 필드 | 입력값 | 비고 |
|---|---|---|
| Organization or user | `IDEA-on-Action` | 대소문자를 구분합니다 |
| Repository | `AXIS-Design-System` | 대소문자를 구분합니다 |
| Workflow filename | `publish.yml` | 경로 없이 파일명만, 확장자 포함 |
| Environment name | 비움 | workflow 에 `environment:` 가 없습니다. 넣으면 workflow 도 맞춰야 합니다 |
| Allowed actions | `npm publish`(direct publishing) 체크 | 2026-09-03 이후 만든 설정은 기본이 `npm stage publish` 만입니다(D2). dist-tag 관리는 필요하지 않습니다 |

- **이번 대상은 linked 4개뿐입니다**: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` · `@axis-ds/theme`. cli · mcp 는 다음 릴리스 직전에 등록합니다(D4).
- CLI 로도 등록할 수 있습니다: `npm trust github <pkg> --file publish.yml --repo IDEA-on-Action/AXIS-Design-System --allow-publish`. npm 11.15.0 이상 · 계정 2FA · 패키지가 레지스트리에 있어야 하며, 인자 문법은 v12 문서 기준이므로 실행 전에 `npm trust --help` 로 다시 확인합니다.

### 4.2 제약
- **48시간 만료**: 새 설정은 48시간(문서 표기 "within 2 days") 안에 첫 publish 에 성공하지 않으면 만료됩니다. 그래서 **머지 직전에** 등록합니다. 일찍 등록하면 만료되고, 등록하지 않고 머지하면 publish 가 실패합니다.
- **수정 불가**: 설정은 고칠 수 없고 삭제 후 다시 만들어야 합니다. 일반 편집으로 48시간 마감이 늘어나지 않습니다. 저장할 때 검증하지 않고 publish 할 때 처음 오류가 납니다. 패키지당 최대 10개입니다.
- **대화형 2FA 필요**: 2026-07-31 부터 bypass 토큰으로는 trusted publishing 설정과 패키지 access 를 바꿀 수 없습니다. 등록과 Publishing access 변경은 사람이 직접 합니다.
- **Publishing access 는 검증 뒤에만 바꿉니다**: 먼저 "disallow tokens" 로 바꾸면 토큰 수동 복구 경로까지 막힙니다.

---

## 5. 수용 기준 (Acceptance Criteria)

- AC1: `publish.yml` 이 YAML 로 파싱되고, publish job 에 `id-token: write` 가 있으며, changesets env 에 `NPM_TOKEN` 이 없고 `NPM_CONFIG_LOGLEVEL: verbose` 가 있습니다. `Setup Node.js` 다음 단계가 `npm@11.19.1` 설치이고 `registry-url` 이 없습니다.
- AC2: `publish.yml` 수정 전후 diff 가 FR-1~4 뿐입니다.
- AC3: 6개 `package.json` 이 JSON 으로 파싱되고 `repository` 가 `{type: git, url: https://github.com/IDEA-on-Action/AXIS-Design-System.git, directory: 기존값}` 이며, `repository` 외 필드는 바뀌지 않습니다.
- AC4: `pnpm pack` 으로 만든 6개 tarball 안 `package.json` 의 `repository.url` 이 AC3 값입니다.
- AC5: `pnpm turbo run build --force` · `pnpm turbo run type-check test --force` 가 `Cached: 0` 으로 통과합니다.
- AC6: `.changeset/` 과 `version` 필드가 바뀌지 않습니다.
- AC7 (머지 뒤, 검증 3축): 첫 publish 실행에서 아래 7장의 세 축을 모두 만족합니다.

---

## 6. 실행 순서

1. 이 PR 의 리뷰와 PR CI 까지 진행하고 **머지하지 않습니다.** workflow 변경과 `repository.url` 정정은 둘 다 publish 트리거 경로라 한 PR 에 담습니다(나눠 머지하면 publish 가 두 번 돕니다).
2. npm 쪽 사전 점검(사람): 계정 2FA 활성, 4개 패키지 maintainer 권한을 확인합니다. Publishing access 는 아직 바꾸지 않습니다.
3. 머지 직전 등록(사람): 4.1 표대로 linked 4개를 등록하고 direct `npm publish` 를 허용합니다. 4개가 모두 등록됐는지 화면에서 대조합니다.
4. 곧바로 머지합니다(D3). `.changeset/` 에 대기 changeset 이 없고 linked 4개가 1.2.1(미배포)이므로 changesets/action 이 publish 분기로 들어갑니다. **이 머지가 곧 1.2.1 릴리스입니다.**
5. 7장 검증 3축을 확인합니다.
6. 검증을 통과하면 `NPM_CONFIG_LOGLEVEL: verbose` 를 지우는 후속 PR 을 올립니다. 이 PR 도 publish 를 실행하지만 미배포 버전이 없어 아무것도 발행하지 않습니다.
7. 토큰 경로 폐쇄(9장).
8. cli · mcp: 다음 릴리스 changeset 머지 직전에 3번처럼 등록하고, 그 publish 가 확인되면 9장처럼 닫습니다(D4).

---

## 7. 검증 3축 (머지 뒤)

### 7.1 워크플로 로그
- `Upgrade npm for Trusted Publishing` 단계 출력이 `npm=11.19.1` 이고 `npm_path` 가 전역 설치 경로입니다.
- changesets 단계에 `No NPM_TOKEN found, but OIDC is available - using npm trusted publishing` 이 찍힙니다. 이 줄이 없고 `creating one with NPM_TOKEN` 이 보이면 env 삭제가 적용되지 않은 것입니다.
- 4개 패키지 publish 성공, job 성공(exit 0)입니다.
- 정상이어도 나오는 오류 줄이 있습니다. changeset publish 2.29.8 은 시작할 때 `npm profile get` 으로 2FA 여부를 확인하고, 토큰이 없으면 `error while checking if token is required` 를 error 레벨로 찍지만 false 로 처리하고 계속 진행합니다.

### 7.2 레지스트리 실측
- `npm view @axis-ds/<pkg> dist-tags` 로 4개 모두 `latest=1.2.1` 인지 확인합니다.
- `npm view @axis-ds/ui-react@1.2.1 dependencies` 로 `@axis-ds/tokens` 가 `1.2.1` 로 치환됐는지 확인합니다.
- npmjs.com 패키지 페이지에 provenance 표시가 있는지 확인합니다.

### 7.3 소비 실측
- 빈 디렉터리에서 `npm install @axis-ds/ui-react@1.2.1 @axis-ds/agentic-ui@1.2.1` 이 성공하는지 확인합니다.
- `npm audit signatures` 결과를 확인합니다.

---

## 8. 실패 대응

| 증상 | 유력 원인 | 대응 |
|---|---|---|
| 4개 모두 ENEEDAUTH("Unable to authenticate") | OIDC 교환 실패(권한 없음 · 설정 필드 불일치 · 미등록) | verbose 로그에서 oidc 사유를 봅니다. 설정은 수정이 안 되므로 삭제 후 재생성하고(48시간 창이 새로 열립니다) `workflow_dispatch` 로 다시 실행합니다 |
| 4개 모두 실패하고 repository 관련 거부 | `repository.url` 불일치 | 이 PR 의 정정이 들어갔는지 확인합니다 |
| direct publish 거부 | Allowed actions 에 `npm publish` 미허용 | 설정을 지우고 다시 만들 때 direct 를 켭니다 |
| 여전히 EOTP | `NPM_TOKEN` 이 남아 `.npmrc` 토큰 경로로 떨어졌고 OIDC 는 실패 | env 줄 삭제를 확인한 뒤 위 행으로 원인을 다시 진단합니다 |
| npm 버전 미달, OIDC 로그 없음 | npm 설치 단계 누락 또는 pnpm 이 다른 npm 을 호출 | `npm_path` 로그로 확인합니다. 그래도 안 되면 Node 24 전환을 검토합니다 |
| **부분 배포**(일부만 1.2.1) | 일부 패키지만 등록했거나 입력 오타 | changeset publish 는 패키지를 동시에 발행하고 실패한 패키지가 있어도 나머지를 계속 진행합니다. 소비자 설치가 깨지는 상태(ui-react@1.2.1 → tokens@1.2.1 없음)이므로, 실패한 패키지 설정을 고치고 48시간 안에 즉시 다시 실행해 롤포워드합니다. 이미 배포된 버전은 건너뜁니다 |

**하지 않을 것**
- **revert PR 머지로 복구하지 않습니다.** revert 도 `publish.yml` 변경이라 publish 를 다시 일으키고, 토큰 경로는 이미 EOTP 로 실패합니다.
- **unpublish 는 기본적으로 쓰지 않습니다.** 72시간 안 · 의존 공개 패키지 없음 조건에서만 가능하고 같은 name@version 은 다시 쓸 수 없습니다. 비가역이므로 사람이 직접 판단하며, 대안은 `npm deprecate` 입니다.
- **"disallow tokens" 는 성공 확인 뒤에만** 켭니다.

**비상시 토큰 경로**: Bypass 2FA 를 체크한 granular 토큰을 새로 만들고 `NPM_TOKEN` env 를 다시 넣습니다. 2027년 1월 제거가 목표인 임시 수단입니다.

---

## 9. 머지 뒤 토큰 경로 폐쇄 순서

npm 문서의 Migration 조언("trusted publisher 를 먼저 검증한 다음 토큰을 제한")과 같은 순서입니다.

1. 7장 검증 3축을 4개 패키지 모두 통과한 것을 확인합니다.
2. 4개 패키지 Settings → Publishing access 를 "Require two-factor authentication and disallow tokens" 로 바꿉니다. 이 설정이 trusted publisher 에 영향을 주지 않는다는 근거는 trusted-publishers 문서뿐이므로, 다음 릴리스에서 실측으로 확인합니다.
3. GitHub secret `NPM_TOKEN` 을 삭제합니다.
4. npmjs.com 에서 granular 토큰을 회수합니다.
5. cli · mcp 는 첫 OIDC publish 를 확인한 뒤 같은 순서로 2번을 적용합니다.

---

## 10. Assumptions (가정)

- A1: pnpm 9.15.4 는 tarball 을 pack 한 뒤 PATH 의 `npm` 으로 `npm publish` 를 실행합니다. 번들 소스 실측 근거이고 pnpm 9.x 공식 문서에는 명시돼 있지 않습니다.
- A2: changesets/action `@v1` 은 브랜치이고 현재 v1.9.0 커밋을 가리킵니다. trusted publishing 용 `.npmrc` 처리(v1.7.0)가 들어 있습니다.
- A3: 저장소는 public, 6개 패키지는 `publishConfig.access: public` 이므로 provenance 조건을 충족합니다.

---

## 11. 미확인 사항

| # | 내용 | 확인 시점 |
|---|---|---|
| U1 | pnpm 9.15.4 → npm 11.19.1 위임 경로에서 OIDC 교환과 provenance 가 CI 에서 실제로 성공하는지(소스 실측뿐, 실행 증거 없음) | 첫 publish 실행 |
| U2 | `repository.url` 이 틀렸을 때의 정확한 오류 코드, npm 의 URL 정규화 규칙(`.git` 접미사 · `git+` 접두). 그래서 기존 형식을 유지했습니다 | 미정 |
| U3 | direct publish 미허용 설정에서의 오류, changesets 의 `npm stage publish` 지원 여부 | 미정 |
| U4 | 미등록 패키지가 토큰 없이 실패할 때의 정확한 오류 코드(ENEEDAUTH 로 추정) | 미정 |
| U5 | "disallow tokens" 를 켠 뒤에도 OIDC publish 가 되는지 | 다음 릴리스 |
| U6 | 2026-10-16 EOTP 의 실제 원인(토큰 Bypass 2FA 미체크 또는 Publishing access 설정). npm 계정 설정에서만 확인할 수 있습니다 | 사람 확인 |
| U7 | npm 12.x 와 changesets 2.29.8 · pnpm 9 조합의 호환성(그래서 11.x 로 고정했습니다) | 미정 |
| U8 | provenance 확인 명령의 정확한 형식 | 첫 publish 뒤 |
| U9 | pnpm 이 native OIDC 를 처음 지원한 버전(pnpm 업그레이드 때 필요) | 미정 |
| U10 | 설정이 맞지 않을 때 403 이 난다는 진술과, 빈 `NPM_TOKEN` · `NODE_AUTH_TOKEN` 이 OIDC 를 방해한다는 진술은 서드파티 출처뿐이라 설계 근거로 쓰지 않았습니다 | 미정 |

---

## 12. 출처

- https://docs.npmjs.com/trusted-publishers (2026-10-06 수정)
- https://docs.npmjs.com/generating-provenance-statements (2026-05-04 수정)
- https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification (2026-08-03 수정)
- https://docs.npmjs.com/policies/unpublish
- https://github.blog/changelog/2025-11-05-npm-security-update-classic-token-creation-disabled-and-granular-token-changes/
- https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens
- https://github.blog/changelog/2026-09-03-multiple-trusted-publishing-configurations-for-npm/
- https://github.blog/changelog/2026-10-02-unvalidated-npm-trusted-publishing-configurations-now-expire/
- https://github.com/changesets/action/releases/tag/v2.0.0
- registry.npmjs.org/npm (2026-10-17 조회: 11.19.1 2026-08-26 배포, engines `^20.17.0 || >=22.9.0`)
