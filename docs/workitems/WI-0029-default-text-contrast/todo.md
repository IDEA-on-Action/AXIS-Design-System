# WI-0029: 기본 테마 대비 미달 해소 TODO

> PRD: [prd.md](./prd.md) | GitHub: #94 | 브랜치: `feat/wi-0029-default-contrast`

- [x] 기준선 재측정(2026-10-24, `--force` 빌드 · static Chromium, 46노드 · 기록과 일치) · 교체안 4개 비교 · 결정 D1~D5
- [x] 토큰: 2.1 참조 변경(button · button-destructive · agent.message-user-bg · 다크 text.tertiary/secondary · 다크 input placeholder · plan-card.reject-hover-text 테마 분리)
- [x] 토큰: 2.2 새 component 토큰 3개 + ontology light/dark json · WI-0025 초안 CSS 동기화
- [x] agentic-ui: PlanCard className 3곳을 새 변수로 교체
- [x] 테스트: baseline-1.2.1 WI-0029 예외 목록 + 변이 확인(AC5), check-contrast-pairs 표(AC3), dark-tokens EXPECTED_DARK · fixture(AC6)
- [x] E2E: a11y 기준선 상수 제거 · 0 단언, DEFAULT_BUTTON_BG #2563EB(AC2), `--force` 빌드 위 static 재측정 + 양성 대조(AC1)
- [x] ontology 출력 바이트 비교(AC4)
- [x] 게이트(type-check · lint · test · build · E2E), changeset linked minor(AC7 · AC8)
- [x] testplan · release-notes, project-todo 현행화, 후속 WI-0062(#170) · WI-0063(#171) 등록
- [x] (추가) 결정 D6: shadcn 다크 `--muted-foreground` 는 text.secondary 파생 유지 + baseline 예외 1줄
- [x] (추가) cli · mcp patch: 커밋 레지스트리 PlanCard 항목 · sha256(version 1.5.0 유지, WI-0052 선례), 라이브러리 스냅샷(`library:refresh-axis`), 재설치 안내
- [ ] 머지 · 배포 뒤 npm 배포본과 pages.dev 로 AC1 재확인
