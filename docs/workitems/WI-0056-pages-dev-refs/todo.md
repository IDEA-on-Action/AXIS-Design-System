# WI-0056: axis.minu.best 참조 전환 TODO

> PRD: [prd.md](./prd.md) | GitHub: #151

## FR-1 cli
- [x] `AXIS_SITE_URL` 상수, 레지스트리 공개 base · 템플릿 기본 주소 · `$schema` · 수집기 문서 URL 을 여기서 생성
- [x] add config 없음 안내를 GitHub quick-start 로
- [x] 테스트 기대값 · 픽스처 갱신

## FR-2 mcp
- [x] 템플릿 기본 주소 상수

## FR-3 schema.json
- [x] `apps/web/public/schema.json` 작성
- [x] 키 집합 일치 · init 산출물 검증 테스트, 변이 확인

## FR-4 생성물 · 메타 · 문서
- [x] components.json 별칭, build-registry homepage(재생성), library JSON, package.json homepage 6개, README 6개, 템플릿 hero(재생성), packages/*/registry/registry.json, mcp-smoke 주석

## 검증
- [x] AC1 grep, AC2 cli · mcp 실행, AC4 별칭 주소, AC5 게이트
- [x] changeset(cli · mcp patch), release-notes, testplan
- [ ] 배포 뒤 AC3 schema.json 200 · 검증
