# WI-0062: 기본 테마 텍스트 대비 잔여 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #170 | 상태: 구현 · 검증 완료(2026-10-25), 배치 4 ② 묶음 PR 대기

## 결정 · 조사
- [x] 사용자 결정 D1 (가) 기록 (PRD 1.3)
- [x] 1.7.0 기준 미달 쌍 재측정(브리프 `pairs.mjs` 를 이 브랜치 dist 로, 값 일치)
- [x] ontology 값이 같은 대체 토큰 전수 대조(`cand.mjs`), 값을 바꿀 토큰은 ontology 가 덮어쓰는 것만
- [x] 수정 전 정적 빌드 59경로 x 4환경 axe 기준선

## 구현
- [x] tokens: avatar-assistant · avatar-tool · neutral-muted-contrast · diff-added-text · diff-removed-text · input placeholder(다크 값 분리) · button disabled · shadcn destructive(라이트)
- [x] ui-react: Toast 설명 opacity 제거, DropdownMenuShortcut text-secondary
- [x] agentic-ui: TokenUsage 글자 text-warning · text-error, DiffViewer 헤더 · 탭 · 줄 번호, CodeBlock 배지, ContextPanel 제공자 · 버전, ToolCallCard 소요 시간
- [x] 문서 사이트: library · templates 필터 개수, contribute 제목
- [x] 짝 표: 아이콘 행 kind 'icon', 바뀐 소비처 행 갱신, 글자 행 12개 추가

## 테스트
- [x] tokens `default-contrast.test` 기본 브랜드 묶음(수정 전 dist 13 실패), `baseline-1.2.1` 예외 표, `ontology-values`
- [x] 단위 agentic · ui-react `text-contrast.test.tsx`(수정 전 소스 10 · 5 실패)
- [x] 브라우저 axe 59경로 x 4환경, ontology 계산값 289개 불변
- [x] E2E tokens(dark-tokens 기대값 갱신)
- [x] 최종 빌드 axe · 전체 게이트(WI-0063 커밋 뒤, testplan 3.2)

## 생성물 · 릴리스
- [x] `build:registry`(version 1.5.0 유지) · `library:refresh-axis` · 템플릿 updatedAt churn 되돌림
- [x] changeset `.changeset/wi-0062-text-contrast-remaining.md`(tokens · ui-react · agentic-ui minor, cli · mcp patch)
- [x] a11y E2E PAGES 확대(`e2e/a11y-routes.cjs` 경로 생성, 59경로 x 4 = 236) · incomplete 4.5 미만 실패 · CI 건수 가드 계산(`frontend.yml`)
- [x] changeset `.changeset/batch4-a11y-upgrade.md`(linked minor · cli · mcp patch, 값 직접 참조 사용자 업그레이드 안내)
- [x] 배치 4 ② 묶음 PR · 머지 · 배포 뒤 발행본으로 재측정 (2026-10-25 #207 머지 f3dae65, Release #205 → linked 1.8.0 · cli 1.6.2 · mcp 1.3.5, run 40179615916. 발행본 재측정 불일치 0, testplan 「배포 뒤 재측정」)
