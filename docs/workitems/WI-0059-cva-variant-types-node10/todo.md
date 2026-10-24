# WI-0059: cva 변형 타입 node10 TODO

> PRD: [prd.md](./prd.md) | GitHub: #158

- [x] FR-1 `fix-cva-dts.mjs`(이름공간 · 부수효과 import, 예상 밖 모양은 실패), build 연결
- [x] FR-2 동치 테스트(tsc), 변환 · 실패 경로 테스트, `test` 스크립트 연결
- [x] FR-3 G2-types 변형 탐침, pack-install-smoke 탐침 수 검산
- [x] AC1 ~ AC3 실측, 음성 대조 · 변이
- [x] AC4 게이트
- [x] changeset(ui-react patch), testplan · release-notes
- [x] 배포 뒤 npm 배포본으로 AC3 재실측(2026-10-24): `@axis-ds/ui-react@1.5.2` d.ts 의 cva/types 참조 0, Next(node tsconfig) `variant="nope"` rc 1 · `variant="secondary"` rc 0
