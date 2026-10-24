# WI-0039: cli · mcp · registry-core 품질 게이트 TODO

> PRD: [prd.md](./prd.md) | GitHub: #125

- [x] 기준선 재측정(bd54e91): cli tsc 19 · cli eslint 25 · mcp eslint 11 · registry-core eslint 1 (AC 근거, 이슈 등록 때 수치 대체)
- [x] cli `lint` · `type-check`, mcp · registry-core `lint` 스크립트 추가, turbo dry-run 으로 등록 확인 (AC1)
- [x] cli tsc 정리: 테스트를 실제 타입에 맞춤(가려진 `createdAt` 3건 포함), `template-apply.ts` prompts 응답 타입 명시 (AC2)
- [x] cli · mcp · registry-core eslint 정리: 미사용 제거, 정규식 이스케이프 동치 변환, BOM 리터럴을 `﻿` 로 (AC2)
- [x] 루트 `eslint.config.mjs` 머리 주석의 대상 목록 갱신
- [x] 양성 대조: 타입 오류 · lint 위반 주입으로 새 스크립트 4개 rc 비0, 원복 sha256 일치 (AC3)
- [x] 게이트 `turbo run type-check lint test build --force` rc 0, cli 661 · mcp 138 유지 (AC4)
- [x] 정리 전 · 뒤 dist 비교, 실코드 변경 목록과 정규식 동치 대조 (AC5)
- [x] testplan · release-notes
- [ ] PR 생성 · 머지(배포 없음, changeset 없음)
