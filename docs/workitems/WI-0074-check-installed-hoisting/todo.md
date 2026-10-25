# WI-0074: check 설치본 상위 탐색 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #199 | 상태: 구현 · 로컬 검증 완료(2026-10-25), PR 대기

## 결정
- [x] 범위 A(두 판독만) · isPnpProject 가드 · 공유 함수 그대로 + check 밖 전이 기록 · brand-core 통합 미룸 (PRD D1~D5, 배치 6 결정)

## 구현
- [x] `detectTailwind` 를 `findInstalledPackage` + `isPnpProject` 가드로
- [x] `installedVersion` 을 지우고 `installedAxisVersion`(같은 규칙)으로, `axisPackagesBelowTailwind4` 가 사용
- [x] `tailwind-core.ts` 헤더의 MCP 바이트 사본 주장 · D4 서술 정정, 함수 주석 갱신, `init.ts` 주석 1줄
- [x] WI-0051 PRD D4 · todo 해소 표기, WI-0044 testplan 147행 R2 서술 갱신

## 테스트
- [x] CLI `template-check.test.ts` 「WI-0074」 9건(hoisted 전이 표 · isolated · 단일 음성 대조 · 양성 대조 · 가까운 설치본 · 환경 가드 · PnP · init/template apply · theme add)
- [x] MCP `template.test.ts` 「WI-0074」 3건
- [x] 수정 전 소스에서 CLI 5 · MCP 3 빨강, 변이 M1~M5 빨강 · 원복 cmp
- [x] `init.test.ts` 템플릿 tailwind-merge 테스트를 tmpdir 판정으로(저장소 루트 node_modules 오염)
- [x] 실제 설치 픽스처 20개 앱 전후: 12 전이 · 58 불변, 빌드 cli · mcp 출력 70/70
- [x] turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계 10종

## 릴리스
- [x] changeset `.changeset/wi-0074-check-installed-hoisting.md`(@axis-ds/cli patch · @axis-ds/mcp patch)
- [ ] PR · 머지(배치 6 순서 WI-0078 → 0076 → 0074), Release PR 에서 cli · mcp 버전 대조
- [ ] 발행본으로 testplan 6절 다시 재기(격리 HOME, 70 수집 확인 뒤 12 전이 · 58 불변)
