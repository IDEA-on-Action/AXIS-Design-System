# WI-0069: agentic-ui · ui-react 비대비 접근성 결함 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #183 | 상태: 구현 · 검증 완료(2026-10-25), 배치 4 ② 묶음 PR 대기

## 결정 · 조사
- [x] 사용자 결정 D4 (가) · D5 (가) 기록 (PRD 1.4)
- [x] 수정 전 정적 빌드로 대상 12경로 x 4환경 axe 기준선(비대비 위반 28 · incomplete 44) (PRD 1.2)
- [x] 원인 분류: 컴포넌트 7(MessageBubble · CodeBlock · DiffViewer · RecoveryBanner · Command · ScrollArea · Dialog/Popover/Sheet) · 문서 예제 2(Input file · Slider) (PRD 1.3)
- [x] Radix 1.1.15 Trigger props 전개 순서 · cmdk 1.1.1 Separator role 고정 위치 판독 (PRD D4-1 · D4-2)

## 구현
- [x] agentic-ui `message-bubble`: 상태 아이콘 `role="img"`, `locale` · `timeZone` · `formatTime`, 하이드레이션 안전 기본
- [x] agentic-ui `step-timeline`: `locale` · `timeZone` · `formatTime`, `<time dateTime>`, 하이드레이션 안전 기본
- [x] agentic-ui `code-block`: 스크롤 영역 region · tabIndex 0 · 이름 · 포커스 링
- [x] agentic-ui `diff-viewer`: 줄 수를 aria-hidden 기호 + sr-only 문장으로
- [x] agentic-ui `recovery-banner`: 재시도 버튼 aria-describedby 조건부
- [x] ui-react `dialog` · `popover` · `sheet`: 열림 상태 래퍼, 닫힌 트리거 aria-controls 제거
- [x] ui-react `command`: CommandSeparator 를 aria-hidden 장식 요소로(검색 중 숨김 · alwaysRender · asChild 유지)
- [x] ui-react `scroll-area`: 뷰포트 tabIndex 0 · 포커스 링
- [x] client-modules: ui-react dialog · popover · sheet, agentic-ui message-bubble · step-timeline 추가, README 경계 표 갱신(Tooltip 행 WI-0073 누락분 포함)
- [x] 문서: Input file 라벨 · Slider aria-label 예제, library 상세 설치 명령 복사 버튼 aria-label(전 경로 측정에서 새로 잡힌 기존 결함), MessageBubble · StepTimeline Props 표, ScrollArea · Slider · MessageBubble · StepTimeline 접근성 안내
- [x] `ontology-pairs.mjs` 줄 번호 갱신(diff-viewer fgAt 123 · 126 → 125 · 129, where 문자열 step-timeline · message-bubble)

## 테스트
- [x] 단위 agentic `time-hydration.test.tsx` 9건 · `a11y.test.tsx` WI-0069 묶음 5건, 수정 전 소스에서 11 실패 (AC3 · AC4)
- [x] 단위 ui-react `nontext-a11y.test.tsx` 15건, 수정 전 소스에서 8 실패 · 호환 7 통과 (AC5)
- [x] 브라우저 axe 대상 12경로 x 4환경 수정 뒤 0 · 0 (AC1), 전 경로 55 x 4환경 (AC2)
- [x] 게이트: turbo lint · type-check · build · test 각각 `--force` · frontend.yml run 단계 · E2E static · tokens (AC9)

## 생성물 · 릴리스
- [x] `build:registry`(6항목: dialog · agentic 5, version 1.5.0 유지) · `library:refresh-axis`(axis 10항목 + 색인) · 템플릿 updatedAt churn 되돌림 (AC8)
- [x] changeset `.changeset/wi-0069-nontext-a11y.md`(ui-react · agentic-ui minor, cli · mcp patch)
- [ ] 배치 4 ② 묶음 PR · 머지 · 배포 뒤 발행본으로 axe 재측정
