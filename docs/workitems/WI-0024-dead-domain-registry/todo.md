# WI-0024: 죽은 도메인 참조 정리 + 레지스트리 URL/경로 정합 TODO

> PRD: [prd.md](./prd.md) | 상태: ✅ 완료 (배포·검증 완료, PR #76)

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
- [x] axis.minu.best 커스텀 도메인 바인딩 완료 (사용자 확인, 브라우저 정상 접속). 샌드박스는 CF WAF("Attention Required")로 자동화 요청 차단되어 독립 검증 불가 - 배포 문제 아님, pages.dev 200으로 등가 검증됨

## 후속 (별도 backlog)
- [ ] 🔎 CF WAF/Bot Fight Mode가 `/r/*.json` 레지스트리 프로그램 요청도 차단하는지 확인 권장. CLI가 `axis.minu.best/r`를 fetch하므로, 사용자 CI/자동화 환경에서 챌린지되면 설치 실패 가능 → 레지스트리 경로 WAF skip rule 검토

## DoD
- [x] release-notes.md
