# WI-0031: npm Trusted Publishing(OIDC) 전환 TODO

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | 상태: ✅ 완료 (2026-10-17, 1.2.1 OIDC 배포 확인. cli · mcp 등록과 토큰 차단 상태 publish 실측은 다음 릴리스)

## 진행 순서

| Phase | 범위 | 실행 주체 | GitHub |
|---|---|---|---|
| M1 | workflow · `repository.url` 변경과 로컬 검증 (FR-1~5) | 에이전트 | #96 |
| M2 | npmjs.com 등록 → 머지 → 1.2.1 첫 OIDC publish 검증 | 사람 | #96 |
| M3 | verbose 제거 · 토큰 경로 폐쇄 · cli · mcp 등록 | 사람(후속 PR 은 에이전트) | #96 |

- 이 PR 의 머지가 곧 1.2.1 publish 실행입니다. 머지 직전에 npmjs.com 등록을 끝냅니다(D3).
- `project-todo.md` · `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다. 머지 뒤 별도로 현행화합니다

---

## 착수 전 결정

> 2026-10-17 사용자 결정. prd 1.6 표와 같습니다.

- [x] npm 확보 방식: Node 22 + npm 11.x 고정 vs Node 24 전환 → ✅ 2026-10-17: Node 22 유지 + `npm@11.19.1` 정확히 고정 (D1)
- [x] Allowed actions: direct `npm publish` 허용 vs staged-only → ✅ 2026-10-17: direct 허용, changesets 자동 publish 유지 (D2)
- [x] 실행 시점: 등록 직후 머지 vs 워크플로 disable → 머지 → 등록 → dispatch → ✅ 2026-10-17: 등록 직후 바로 머지 (D3)
- [x] cli · mcp 등록: 다음 릴리스 직전 vs 지금 → ✅ 2026-10-17: 다음 릴리스 직전 (D4)

---

## Phase M1: workflow · package.json

### M1-1 `publish.yml`
- [x] publish job `permissions` 에 `id-token: write` (FR-1)
- [x] `Setup Node.js` 다음에 `npm install -g npm@11.19.1` + `node` · `npm` 버전 · 경로 로그 단계, `registry-url` 미지정 (FR-2)
- [x] changesets env 에서 `NPM_TOKEN` 줄 삭제, `NPM_CONFIG_LOGLEVEL: verbose` 추가 (FR-3)
- [x] 발행 job 주석 OIDC 기준으로 정정 (FR-4)

### M1-2 `repository.url`
- [x] tokens · theme · ui-react · agentic-ui · cli · mcp 6개를 `https://github.com/IDEA-on-Action/AXIS-Design-System.git` 로, `type` · `directory` 유지 (FR-5)

### M1-3 검증 (plan 3장)
- [x] V1 YAML 파싱 · 단언 rc 0 (AC1). actionlint 는 로컬에 없어 미실행
- [x] V2 diff 가 FR-1~4 뿐 (AC2)
- [x] V3 6개 JSON 파싱 · url 이 origin 과 대소문자까지 일치 · 나머지 필드 불변 (AC3)
- [x] V4 tarball 6개 `repository.url` 일치 (AC4)
- [x] V5 build · type-check · test · lint `--force` 통과, `Cached: 0` (AC5)
- [x] V6 `.changeset/` · `version` 불변 (AC6)

---

## Phase M2: 첫 OIDC publish (사람)

- [ ] npm 계정 2FA 활성 · linked 4개 maintainer 권한 확인 (Publishing access 는 아직 바꾸지 않음) → maintainer 는 `npm view @axis-ds/tokens maintainers` = `sinclairseo` 로 확인. 2FA 활성은 npmjs.com 계정 화면에서만 보여 에이전트가 확인하지 못해 체크하지 않습니다
- [x] 머지 직전 linked 4개 Trusted Publisher 등록 (prd 4.1 표: `IDEA-on-Action` · `AXIS-Design-System` · `publish.yml` · Environment 비움 · direct `npm publish` 허용) → 사용자 등록(Status Valid), OIDC publish 4/4 성공으로 설정 일치 확인
- [x] 4개 등록을 화면에서 대조 (하나라도 빠지면 부분 배포) → 사용자 화면 대조(4개 Status Valid), 부분 배포 없음(4개 모두 1.2.1)
- [x] 등록 직후 머지 (48시간 안에 첫 publish 성공 필요) → PR #102 머지(014e8ac, 2026-10-17 01:45 UTC), 같은 push 의 run 38992207088 성공(01:49 UTC)
- [x] 검증 축 ① 로그: `npm=11.19.1` · `npm_path` 전역 경로 · `No NPM_TOKEN found, but OIDC is available` · 4개 publish 성공 · exit 0 → run 38992207088 로그에서 `node=v22.23.3 npm=11.19.1 npm_path=/opt/hostedtoolcache/node/22.23.3/x64/bin/npm`, `No NPM_TOKEN found, but OIDC is available - using npm trusted publishing`, `New tag` 4개(cli · mcp 는 1.1.3 기발행으로 건너뜀), conclusion success
- [x] 검증 축 ② 레지스트리: 4개 `latest=1.2.1`, ui-react@1.2.1 의 tokens 의존이 `1.2.1`, provenance 표시 → `npm view` 로 4개 `latest` 1.2.1, ui-react · theme 의 tokens 의존 1.2.1, 4개 모두 `dist.attestations.provenance` SLSA v1 확인
- [x] 검증 축 ③ 소비: 빈 디렉터리 `npm install @axis-ds/ui-react@1.2.1 @axis-ds/agentic-ui@1.2.1` 성공, `npm audit signatures` → theme 포함 3개 설치 rc 0(71 패키지, `@axis-ds/*` 4개 모두 1.2.1), `npm audit signatures` 서명 71 · attestation 55 검증
- [x] 실패 시 prd 8장 대응 (revert 머지 금지, unpublish 는 사람 판단) → 해당 없음(첫 실행 성공)

## Phase M3: 정리 (머지 뒤)

- [x] `NPM_CONFIG_LOGLEVEL: verbose` 제거 후속 PR → `chore/post-121-cleanup` 에서 그 줄과 주석만 삭제
- [x] `.npmrc` 주석 · `CLAUDE.md` npm 배포 절(116 · 126 · 129행 「CI는 NPM_TOKEN secret」)을 OIDC 기준으로 현행화(머지 시점부터 사실과 달라짐, `CLAUDE.md` 수정 여부는 사람이 정합니다) → `chore/post-121-cleanup` 에서 OIDC 기준으로 현행화
- [x] linked 4개 Publishing access → "Require two-factor authentication and disallow tokens" → 2026-10-17 사용자가 변경. npmjs.com 4개 패키지 Settings 화면 캡처에서 「Require two-factor authentication and disallow bypass 2fa tokens (recommended)」 선택을 확인했습니다(npm 화면의 표기이고 문서의 「disallow tokens」와 같은 선택지). 같은 화면에서 Trusted Publisher Status 는 4개 모두 Valid 입니다
- [x] GitHub secret `NPM_TOKEN` 삭제 → `gh secret list` 결과 3개(CLOUDFLARE_ACCOUNT_ID · CLOUDFLARE_API_TOKEN · RENDER_PRODUCTION_DEPLOY_HOOK)에 `NPM_TOKEN` 없음, REST API `total_count` 3 으로 교차 확인
- [x] npm granular 토큰 회수 → 2026-10-17 사용자가 npmjs.com Access Tokens 에서 삭제 완료(사용자 확인, 에이전트는 계정 화면을 볼 수 없음)
- [ ] 다음 릴리스 changeset 머지 직전 cli · mcp Trusted Publisher 등록, publish 확인 뒤 Publishing access 변경
- [ ] 다음 릴리스에서 "disallow tokens" 상태의 OIDC publish 실측 (prd 11장 U5)
- [x] `project-todo.md` · `.github/wi-mapping.json` 현행화, Issue #96 종료 → Issue #96 은 PR #102 머지로 종료(2026-10-17 01:45 UTC), 현행화는 `chore/post-121-cleanup`
