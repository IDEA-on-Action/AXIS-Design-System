# WI-0061: 레지스트리 내용 비교 TODO

> PRD: [prd.md](./prd.md) | GitHub: #167

- [x] 공유 코어 `registryContentDiff` · `contentMismatchMessage`, `warnVersionMismatch` 를 내용 기준으로(비교 불가 시 종전 version)
- [x] 테스트 4건 추가(같은 내용 · 다른 내용 · 한쪽만 · sha256 없음), 다른 동작을 보는 기존 테스트는 내용 알림을 따로 모으게 조정
- [x] 변이(내용 비교 끔) 확인, 실제 pages.dev 실측
- [x] 게이트, changeset(cli · mcp patch), testplan · release-notes
- [ ] 배포 뒤 npm 배포본으로 AC2 재실측
