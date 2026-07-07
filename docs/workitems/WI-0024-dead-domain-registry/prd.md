# WI-0024: 죽은 도메인 참조 정리 + 레지스트리 URL/경로 정합 PRD

> 작성일: 2026-07-07 | 작성자: AXIS Team | 상태: 코드 완료 (배포 후 실 URL 재검증 후속)
> 발단: 프로덕션 사이트 점검(daily-check 후속)에서 커스텀 도메인 2개 DEAD(NXDOMAIN) 발견.

## 1. 개요

프로덕션 점검 중 CLI/레지스트리가 참조하는 커스텀 도메인이 죽어 있어 실사용자 영향이 확인됐다.

- 실 배포(`axis-design-system.pages.dev`)는 정상(HTTP 200).
- `axis.minu.best`: DNS 복구 완료(2026-07-07, SSL 프로비저닝 대기). 코드 참조 유지 대상.
- `ds.minu.best`: 폐기 결정. 모든 참조를 `axis.minu.best`로 통합.

## 2. 발견된 결함

| # | 결함 | 위치 | 영향 |
|---|------|------|------|
| D1 | CLI 기본 `REGISTRY_URL`이 죽은 `ds.minu.best/r` | `axis-cli/src/index.ts:15` | `AXIS_REGISTRY_URL` 미지정 시 컴포넌트 fetch 실패 |
| D2 | `axis.config.json` `$schema`가 `ds.minu.best/schema.json` | `axis-cli/src/index.ts:69` | 생성 config의 dangling schema 참조 |
| D3 | 병합 레지스트리 `homepage`가 `ds.minu.best` 하드코딩 | `scripts/build-registry.mjs` | 생성물 `public/r/registry.json`에 죽은 도메인 전파 |
| D4 | 문서 URL 경로 `/ui/<slug>` 불일치(실 라우트 `/components/<slug>`) | `axis-cli/src/library/axis-collector.ts:318` `getDocsUrl` | 도메인 살려도 UI 컴포넌트 문서 링크 404 |
| D5 | 커밋된 라이브러리 메타 25개가 `/ui/` 경로 baked-in | `apps/web/public/library/components/*.json`, `categories/ui.json` | 라이브러리 UI 링크 404 (재생성 스크립트 없음 → 코드모드) |
| D6 | 병합 레지스트리에 `index.json` 미방출(`registry.json`만) | `scripts/build-registry.mjs buildMergedRegistry` | shadcn collector `${registryUrl}/index.json` fetch 404 |

## 3. 접근

- **ds→axis 통합**: D1/D2/D3의 `ds.minu.best` 리터럴을 `axis.minu.best`로 교체. 레지스트리 소스(`packages/*/registry/registry.json`)는 이미 `axis.minu.best`라 변경 불필요.
- **경로 정합**: `getDocsUrl`에 category→route 매핑 도입(`ui`→`components`, `agentic`→`agentic`). 커밋된 라이브러리 JSON은 `/ui/`→`/components/` 코드모드. `/agentic/` 참조는 실 라우트와 일치하므로 미변경(도메인만 복구됨).
- **index.json 방출**: 생성기가 이미 계산하는 index 데이터를 DEPLOY_DIRS에도 write.
- **재생성**: `pnpm build:registry`로 `public/r/*` 재생성 후 diff 확인.

## 4. AC

- AC1: 활성 소스/스크립트에 `ds.minu.best` 참조 0건
- AC2: `getDocsUrl(slug, 'ui')` → `/components/` 경로 반환 (단위 검증)
- AC3: 라이브러리 UI 컴포넌트 메타의 `source.url`이 `/components/` 경로
- AC4: `pnpm build:registry` 후 `public/r/index.json` 생성 + `registry.json` homepage=`axis.minu.best`
- AC5: pages.dev 기준 `/components/<slug>`, `/r/index.json`, `/r/registry.json` 200
- 비기능: typecheck/lint/build 회귀 0

## 5. 범위 외 (backlog)

- `schema.json` 자체가 배포본에 미존재(pages.dev/schema.json 404) - 별도 스키마 산출 이슈. 본 WI는 참조 도메인만 정정.
- `axis.minu.best` 커스텀 도메인 SSL 프로비저닝 - CF 측 비동기, 완료 후 실 도메인 200 재검증.

## 6. Definition of Done

- [ ] D1~D3 ds→axis 교체
- [ ] D4 getDocsUrl category→route 매핑
- [ ] D5 라이브러리 JSON /ui/→/components/ 코드모드
- [ ] D6 index.json 방출 보강
- [ ] build:registry 재생성 + typecheck/lint/build PASS
- [ ] pages.dev 경로 200 검증
- [ ] release-notes.md 작성
