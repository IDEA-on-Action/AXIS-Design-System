# WI-0031 구현 계획

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 작성일: 2026-10-17 | 기준: `origin/main` b548748 (WI-0033 #101 병합 반영, 1.2.1 에 WI-0033 포함)
> 채택: Node 22 유지 + `npm@11.19.1` 고정 설치, direct publish 허용, 등록 직후 머지(prd 1.6 D1~D4). 줄 번호는 2026-10-17 실측값이며, 코드가 바뀌면 낡으므로 착수 시점에 다시 확인합니다.

## 1. 수정 파일

| # | 파일 | 변경 |
|---|---|---|
| 1 | `.github/workflows/publish.yml` | ① publish job `permissions` 에 `id-token: write`(주석 포함) ② `Setup Node.js` 다음에 `Upgrade npm for Trusted Publishing` 단계(`npm install -g npm@11.19.1` + `node` · `npm` 버전 · 경로 출력), `registry-url` 미지정 주석 ③ changesets env 에서 `NPM_TOKEN` 줄 삭제, `NPM_CONFIG_LOGLEVEL: verbose` 추가 ④ L19 발행 job 주석을 OIDC 기준으로 정정 |
| 2 | `packages/axis-tokens/package.json` L59 | `repository.url` → `https://github.com/IDEA-on-Action/AXIS-Design-System.git` |
| 3 | `packages/axis-theme/package.json` L61 | 같음 |
| 4 | `packages/axis-ui-react/package.json` L239 | 같음 |
| 5 | `packages/axis-agentic-ui/package.json` L131 | 같음 |
| 6 | `packages/axis-cli/package.json` L53 | 같음 |
| 7 | `packages/axis-mcp/package.json` L47 | 같음 |
| 8 | `docs/workitems/WI-0031-npm-token-expiry-check/{prd,plan,todo}.md` (신규) | 이 문서들 |

손대지 않는 파일: `.changeset/`(대기 changeset 없음, 버전 불변), 각 `package.json` 의 `version`, `project-todo.md` · `.github/wi-mapping.json`(머지 뒤 별도 현행화)

cli · mcp 의 `repository.url` 정정은 이번 실행에서 npm 에 반영되지 않습니다(1.1.3 이 이미 배포돼 publish 를 건너뜁니다). 다음 릴리스 때 반영됩니다.

## 2. 순서

1. `git switch -c chore/wi-0031-npm-trusted-publishing`
2. 수정 전 `publish.yml` · 6개 `package.json` 사본과 `.changeset/` sha256 저장
3. `package.json` 6개 `repository.url` 교체(파일마다 기존 값 1건 → 새 값 1건)
4. `publish.yml` 4곳 수정
5. 3장 검증
6. 커밋: 워크플로 · `package.json` 1건, 문서 1건(파일 경로 개별 지정, push 하지 않음)
7. 리뷰 → prd 6장 실행 순서(머지 직전 npmjs.com 등록 → 즉시 머지)
8. PR 을 만들 때 본문 맨 위에 아래 체크리스트를 넣고, 리뷰 승인 전에는 머지하지 않습니다.

```markdown
> **이 PR 머지 = 1.2.1 publish 실행(main push 트리거)입니다.** 리뷰 승인 전에는 머지하지 않습니다.
- [ ] 머지 직전 npmjs.com 에서 linked 4개(tokens · theme · ui-react · agentic-ui) Trusted Publisher 등록: Organization `IDEA-on-Action` / Repository `AXIS-Design-System` / Workflow `publish.yml` / Environment 비움 / direct `npm publish` 허용
- [ ] 등록 뒤 48시간 안에 첫 publish 성공 필요(넘기면 다시 등록)
- [ ] 1.2.1 에는 WI-0033(#101) 다크 component 토큰 수정이 포함됨을 확인
```

## 3. 검증 명령과 결과 (2026-10-17 로컬 실측)

| # | 목적 | 명령 · 판정 | 결과 | 대조군 |
|---|---|---|---|---|
| V1 | YAML 파싱 | python `yaml.safe_load` 로 publish job 단언(`id-token: write` · env 에 `NPM_TOKEN` 없음 · `NPM_CONFIG_LOGLEVEL: verbose` · `registry-url` 없음 · npm 단계가 `Setup Node.js` 바로 다음 · `npm@11.19.1`) | rc 0, `YAML_ASSERT_OK` | 수정 전 파일에서는 `id-token` 없음 · `NPM_TOKEN` 있음으로 읽힘. actionlint 는 로컬에 없어 실행하지 못했습니다(PR CI 에도 actionlint 단계 없음) |
| V2 | diff 범위 | `diff -u 수정전 수정후` | rc 1, hunk 3개: 주석 정정 · `id-token` · npm 단계 · env 만 변경 | - |
| V3 | package.json | node `JSON.parse` 후 `repository` 가 `{type, url, directory}` 3키이고 url 이 origin 에서 만든 기대값과 같은지, `repository` 외 필드가 수정 전과 같은지 | 6/6 일치, 나머지 필드 동일, `version` 동일 | origin `git@github.com:IDEA-on-Action/AXIS-Design-System.git` 에서 기대값을 만들어 대소문자까지 비교. `thoughtandaction` 잔존 0 · 새 값 6(같은 grep 이 새 값을 셈) |
| V4 | tarball | `pnpm install --frozen-lockfile` → `pnpm --filter @axis-ds/tokens build` → `pnpm -C packages/axis-<pkg> pack --pack-destination <임시>` 6개 → 압축을 푼 `package/package.json` 의 `repository.url` | 6/6 일치(linked 4개 1.2.1, cli · mcp 1.1.3) | `pnpm --filter <pkg> pack` 은 pnpm 9.15.4 에서 `Unknown option: 'recursive'` 로 rc 1 이고 tarball 0개였습니다. 그래서 `-C` 로 바꿨습니다. tarball 안 `"name": "@axis-ds/` 6건 · `thoughtandaction` 0건 |
| V5 | 회귀 | `pnpm turbo run build --force` → `pnpm turbo run type-check test --force`, 추가로 `pnpm turbo run lint --force` · `pnpm check-token-refs` | build 8/8 · `Cached: 0`, type-check · test 11/11 · `Cached: 0`(theme 21 · ui-react 100 · agentic-ui 72 · cli 58 통과), lint 1/1 · `Cached: 0`, token-refs 위반 0 | - |
| V6 | 버전 · changeset | `.changeset/` sha256 재대조, `version` 비교 | `config.json: OK`(파일 1개), version 6개 동일 | - |

| V7 | 병합 트리 회귀(b548748 병합 뒤) | `pnpm install --frozen-lockfile` → `pnpm turbo run build --force` → `pnpm turbo run type-check test lint --force` → `pnpm pack-smoke` · `node scripts/check-token-refs.mjs` | build 8/8 · `Cached: 0`, type-check · test · lint 13/13 · `Cached: 0`(tokens 16 · theme 21 · ui-react 100 · agentic-ui 72 · cli 58 통과, fail 0), pack-smoke 6/6, token-refs 위반 0(:root 249 · .dark 249 · 다크 값 미반영 0) | build 와 type-check 를 한 turbo 실행에 묶으면 `@ax/web#type-check` 가 `.next/types` 파일 누락(TS6053)으로 rc 2 였습니다. `next build` 가 같은 시점에 `.next` 를 다시 만드는 경합이고, 순차 실행에서는 통과합니다. CI(`frontend.yml` · `publish.yml`)는 lint · type-check · build 를 단계별로 순차 실행합니다 |

- 빌드가 `apps/web/public/templates/*.json` 5개를 다시 생성합니다(`updatedAt` · 템플릿 목록). 이 WI 범위가 아니므로 커밋에서 제외하고 되돌렸습니다.
- 로컬 Node 는 22.22.0, pnpm 은 9.15.4 입니다. 로컬 실측은 OIDC 발행 자체를 증명하지 않습니다. OIDC 교환 · provenance 는 머지 뒤 첫 실행(prd 7장)이 검증입니다.

## 4. 머지 뒤 작업 (사람)

prd 6장 · 9장을 따릅니다. 요약:

1. 머지 직전 linked 4개 Trusted Publisher 등록(prd 4.1 표, direct `npm publish` 허용)
2. 즉시 머지 → publish 실행 → prd 7장 검증 3축
3. `NPM_CONFIG_LOGLEVEL: verbose` 제거 후속 PR
4. Publishing access "disallow tokens" → `NPM_TOKEN` secret 삭제 → granular 토큰 회수
5. 다음 릴리스 직전 cli · mcp 등록
