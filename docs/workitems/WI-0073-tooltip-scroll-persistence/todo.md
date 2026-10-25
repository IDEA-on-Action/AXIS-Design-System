# WI-0073: Tooltip 이 포커스 스크롤에 닫힘 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #194 | 상태: 구현 · 검증 완료(2026-10-25), 배치 4 ② 묶음 PR 대기

## 결정 · 조사
- [x] 사용자 결정 D6 (가) 기록, 업스트림 이슈는 초안만 (PRD 1.3)
- [x] Radix 1.2.8 · 1.4.1 소스에서 scroll capture → onClose 확인, 끄는 prop · 닫힘 이유 없음 (PRD 1.1)
- [x] 브리프 원안(포커스 열기 지연)과 닫힘 차단 방식 비교, 열기 경로의 TOOLTIP_OPEN · skip-delay 보존 때문에 닫힘 차단 채택 (PRD 1.4)

## 구현
- [x] `packages/axis-ui-react/src/tooltip/index.tsx`: Tooltip 제어 래퍼(scroll 플래그 · 포커스 판정 · 명시 닫힘 표시), Trigger ref 연결, Content Esc · 바깥 포인터 표시
- [x] `scripts/client-modules.mjs` 에 `tooltip/index` 추가(postbuild 가드)
- [x] 문서 사이트 `/components/tooltip` 접근성 안내 한 줄

## 테스트
- [x] 단위 `tooltip/tooltip.test.tsx` 13건 · 변이 3종 (AC2 · AC3 · AC4 · AC6 · AC7)
- [x] E2E `apps/web/e2e/tooltip-persistence.spec.ts` 6건: 수정 전 빌드 2 실패 → 수정 뒤 6 통과 (AC1 ~ AC5 · AC7)
- [x] CI: frontend.yml `E2E Tooltip 지속성` 단계 · 건수 가드 `tooltip:6` · 실패 산출물 업로드 조건 (AC8)

## 생성물 · 릴리스
- [x] `library:refresh-axis`(변경 1: axis-tooltip, 태그 stateful · side-effects 추가) · `build:registry`(tooltip 항목 없음, 변경 0) · 템플릿 updatedAt churn 되돌림
- [x] changeset `.changeset/wi-0073-tooltip-scroll-persistence.md`(ui-react patch, 배치 4 ② 묶음과 함께 linked 1.8.0)
- [x] 게이트: turbo lint · type-check · build · test 각각 `--force` · frontend.yml run 단계 · E2E static
- [x] Radix 업스트림 이슈 초안 (AC9, 게시 안 함)
- [x] 배치 4 ② 묶음 PR · 머지 · 배포 뒤 발행본으로 E2E 재측정 (2026-10-25 #207 머지 f3dae65, Release #205 → linked 1.8.0 · cli 1.6.2 · mcp 1.3.5, run 40179615916. 발행본 소비자 앱에서 화면 밖 트리거 Tab 뒤 800ms 열린 채, 1.7.0 은 닫힘, testplan 「배포 뒤 재측정」)
