# WI-0107: TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #271 | 상태: 🔄 구현 · 검증 완료, PR 전

## 결정
- [x] D1 ~ D4 (2026-11-01 사용자 결정, 모두 권장안)

## 구현
- [x] registry-core `template-checks.ts`(정적 표 · 안전 조회 · 내장 판정 · 문구) · exports (FR-1 ~ FR-6)
- [x] cli `collectCheckResults` 10번째 항목, mcp `handleCheckProject` 같은 호출 · 도구 설명 (FR-1 · FR-2)
- [x] 템플릿 `check-ontology.mjs` 를 같은 판정으로(lstat · realpath · 상한 · 선형 분해 · 측정 실패) (D3 ⑤)
- [x] template.json `checks`, web 타입, 빌드 모양 검사 (FR-4)
- [x] axis-config.ts 주석 · schema.json 설명 정정 (D2)
- [x] tool-call-card 구분자 가운뎃점, r/ 재생성(version churn 되돌림) (D4)
- [x] changeset cli · mcp minor, agentic-ui patch (AC8)
- [x] cli README · 템플릿 README · WI-0027 PRD FR-4b · todo 후속 ② (FR-7)

## 테스트
- [x] 단위 · 패리티 · 동기화(cli 42), CLI = MCP 비교 · 원격 checks 무시 · 줄바꿈 파일 이름(mcp 12) (AC3 ~ AC7)
- [x] 변이 A/B 6종 (testplan 1절)
- [x] 신 · 구 dist 바이트 비교 13 fixture + 양성 대조 (AC2)
- [x] 실경로 init → check PASS · 위반 WARN rc 0 · 구판 항목 없음 · MCP stdio (AC1)
- [x] turbo build · type-check · lint · test `--force` Cached 0, pack-smoke, test:registry, cli-smoke, registry-install-smoke (AC9)
- [x] 레지스트리 전 컴포넌트 전수 (D4)

## 검토 반영(2026-11-01)
- [x] 괄호 짝 찾기 · 문자열 추출 선형화(`cn(\"` · `\'` 반복 2차 시간), 클래스 묶음 작업량 상한 → 일부 측정 실패
- [x] 한 줄 4,096자 상한 제거(위반을 가린 PASS), 256KB 초과 · 깊이 한도 밖 · 작업량 상한 초과는 위반 0건이어도 WARN 일부 측정 실패 · 스크립트 rc 2
- [x] 경로 이스케이프를 허용 목록으로(태그 · 폭 없는 문자 · BOM · 따옴표 · 역슬래시), 코드 포인트 단위 자르기
- [x] 위반을 파일 · 줄 · 규칙 순으로 정렬(첫 위치), 두 구현 같이
- [x] 패리티에 건너뜀 문구 비교 · 단위 경계 입력 fixture, 스크립트만 바꾼 변이 3종 A/B
- [x] 재검증: cli template-checks 56 · mcp 13 통과, turbo build 8/8 · type-check lint test 24/24 `--force` Cached 0, pack-smoke rc 0, check-changeset-mcp-tokens rc 0, 실경로 재측정(testplan 4.1)

## 머지 뒤(이 WI 범위 밖에서 현행화)
- [ ] project-todo.md · wi-mapping.json · CLAUDE.md 현행화
- [ ] 발행 뒤 발행본으로 같은 실경로 재측정
