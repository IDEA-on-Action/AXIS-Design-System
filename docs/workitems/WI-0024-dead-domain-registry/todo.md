# WI-0024: 죽은 도메인 참조 정리 + 레지스트리 URL/경로 정합 TODO

> PRD: [prd.md](./prd.md) | 상태: ✅ 코드 완료 (배포 후 실 URL 재검증 후속)

## Phase 1: ds.minu.best → axis.minu.best 통합 ✅
- [x] `axis-cli/src/index.ts:15` REGISTRY_URL 기본값 → `https://axis.minu.best/r`
- [x] `axis-cli/src/index.ts:69` $schema → `https://axis.minu.best/schema.json`
- [x] `scripts/build-registry.mjs` mergedRegistry.homepage → `https://axis.minu.best`
- [x] 템플릿 서브시스템 5곳(components.json, hero.tsx, template.ts, template-apply.ts, registry-client.ts) 추가 발견·정정
- [x] 잔여 `ds.minu.best` 활성 소스 0건 (changelog 히스토리만 보존)

## Phase 2: /ui/ → /components/ 경로 정합 ✅
- [x] `axis-collector.ts:318` getDocsUrl category→route 매핑(agentic→agentic, 그 외→components)
- [x] `public/library/**/*.json` /ui/ → /components/ 코드모드 (26파일)
- [x] /agentic/ 참조 미변경 확인(실 라우트 일치)

## Phase 3: index.json 방출 + 재생성 ✅
- [x] `build-registry.mjs buildMergedRegistry`에 index.json write 추가
- [x] `pnpm build:registry` 재생성 (homepage=axis, index.json 4976B)

## Phase 4: 검증 ✅
- [x] typecheck(force) / lint / CLI test(58) / build:web 회귀 0
- [x] 로컬 out/ 반영 검증 (index.json 생성, /ui/ 0, ds 0)
- [x] PR #76 머지 + Deploy Production success
- [x] pages.dev 실 검증: `/r/index.json` 200(homepage=axis), `/components/button/` 200, 라이브러리 url=`/components/`
- [ ] ⚠️ **axis.minu.best 커스텀 도메인 403** - CF Pages "Custom domains"에 `axis.minu.best`가 이 프로젝트(axis-design-system)로 바인딩됐는지 확인 필요 (사용자 CF 대시보드). 바인딩 전까지 CLI가 axis.minu.best/r로 403

## DoD
- [x] release-notes.md
