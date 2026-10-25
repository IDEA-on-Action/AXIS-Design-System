# WI-0051: check dependencies 설치본 판정 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #144 | 상태: 구현 · 검증 완료(2026-10-25), PR 대기

## 결정
- [x] 설치본 확인 + WARN · 대상 선언된 @axis-ds/* 까지 · 판독 함수 하나 · 기존 installedVersion 호출지 유지 · 공유 코어 이관 (PRD D1~D5)

## 구현
- [x] registry-core `project.ts`: `findInstalledPackage` · `isPnpProject` · `exactVersionOf` · `compareExactVersions`
- [x] registry-core `template/dependencies-core.ts` + exports `./dependencies-core`
- [x] cli `template-check.ts` · mcp `template.ts` 가 공유 코어를 씀(중복 제거)
- [x] cli README check 서술

## 테스트
- [x] cli 7건 · mcp 1건 · T4-1 기준선 의도 변경
- [x] pack 한 cli · MCP 로 f1(ui-react 선언 · 미설치) · f2

## 릴리스
- [x] changeset(cli · mcp patch)
- [x] PR · 머지 · 발행 (2026-10-25 #196 머지 4f54bba, npm 1.7.0 · cli 1.6.1 · mcp 1.3.4, run 40137182470, provenance 6/6)
- [x] (사용자 확인) 기존 `installedVersion` 호출지(detectTailwind · axisPackagesBelowTailwind4)도 상위 탐색으로 옮길지 (2026-10-25 사용자 결정: 후속 WI-0074(#199) 로 분리 → WI-0074 에서 반영, PRD D4 해소 표기)
