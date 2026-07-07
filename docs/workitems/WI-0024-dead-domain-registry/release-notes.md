# WI-0024 릴리스 노트: 죽은 도메인 참조 정리 + 레지스트리 URL/경로 정합

> 릴리스일: 2026-07-07 | 유형: fix | 영향: @axis-ds/cli, @axis-ds/mcp, 문서 사이트 레지스트리/템플릿

## 배경

프로덕션 사이트 점검에서 CLI·레지스트리·템플릿이 참조하는 커스텀 도메인이 죽어 있음을 발견했다.
- `axis.minu.best`: DNS 복구(2026-07-07). 참조 유지.
- `ds.minu.best`: 폐기. 모든 활성 참조를 `axis.minu.best`로 통합.

## 변경 사항

### fix: 죽은 도메인 `ds.minu.best` 제거 (→ `axis.minu.best` 통합)
- CLI 기본 `REGISTRY_URL`: `ds.minu.best/r` → `axis.minu.best/r` (`axis-cli/src/index.ts`)
- CLI `axis.config.json` `$schema`: `ds.minu.best` → `axis.minu.best`
- 병합 레지스트리 `homepage`: `ds.minu.best` → `axis.minu.best` (`scripts/build-registry.mjs`)
- 템플릿 서브시스템: MCP `AXIS_TEMPLATE_URL`, CLI `registry-client`/`template-apply`, `components.json`, landing-page 템플릿 소스 → `axis.minu.best`
- 히스토리 기록(`changelog.md`)은 과거 릴리스 사실이므로 보존

### fix: 문서 URL 경로 `/ui/` → `/components/` 정합
- `getDocsUrl`에 category→route 매핑 도입: `agentic`→`/agentic/`, 그 외 전 카테고리→`/components/` (`axis-collector.ts`)
- 커밋된 라이브러리 메타 `source.url` 코드모드: `axis.minu.best/ui/<slug>` → `/components/<slug>` (26파일). `/agentic/` 참조는 실 라우트 일치로 미변경

### fix: 병합 레지스트리 `index.json` 방출 보강
- `buildMergedRegistry`가 배포 디렉토리에 `registry.json`만 쓰고 `index.json`을 누락 → shadcn collector `${registryUrl}/index.json` 조회 404
- `index.json`(name/homepage/items) 방출 추가

## 검증

- typecheck: 7/7 PASS (`--force` 캐시 우회 실 실행)
- lint: PASS (No ESLint warnings or errors)
- @axis-ds/cli test: 58 passed
- build:web: PASS (48 pages, pagefind 색인)
- 로컬 산출물: `out/r/index.json` 생성 + homepage=`axis.minu.best`, 라이브러리 `/ui/` 잔여 0, `ds.minu.best` 잔여 0(changelog 제외)
- 경로 정합 예시: `button`(ui)→`/components/button`, `agent-avatar`(agentic)→`/agentic/agent-avatar`

## npm 릴리스 (2026-07-07)

- `@axis-ds/cli` 1.1.2 → **1.1.3**, `@axis-ds/mcp` 1.1.2 → **1.1.3** (PR #77, changeset patch)
- CI publish EOTP(2FA) 이슈는 npm **Automation 토큰**으로 `NPM_TOKEN` 교체하여 해소 → 이후 릴리스 OTP 불필요
- 부수 효과: 그동안 EOTP로 밀려있던 linked 그룹(tokens/ui-react/agentic-ui/theme) 로컬 1.1.3도 함께 배포됨 → 6패키지 전부 npm 1.1.3
- 배포본 실측: `@axis-ds/cli@1.1.3` tarball에 `ds.minu.best` 0건, `REGISTRY_URL=https://axis.minu.best/r`, getDocsUrl 경로 매핑 확인

## 후속 (backlog)

- 배포 후 실 URL 200 재검증: `axis.minu.best/components/<slug>`, `/r/index.json`, `/r/registry.json` (axis.minu.best SSL 프로비저닝 완료 후)
- `schema.json` 자체가 배포본에 미존재(pages.dev/schema.json 404) - 별도 스키마 산출 이슈
