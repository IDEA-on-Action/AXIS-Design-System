# WI-0063: 기본 테마 비텍스트 대비 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #171 | 상태: 구현 · 검증 완료(2026-10-25), 배치 4 ② 묶음 PR 대기

## 결정 · 조사
- [x] 사용자 결정 D3 (가) · D1 (가) 기록 (PRD 1.3)
- [x] 1.7.0 기준 비텍스트 미달 재측정(계산 · 브라우저 · E2E DEFAULT_BRAND_FLOOR)
- [x] ontology 값이 같은 대체 토큰 전수 대조, 새 토큰 이름 충돌(밀도 접두 `control-`) 확인

## 구현
- [x] tokens: `form-control.border` · `track`, `progress.fill.*` 새 토큰(ontology 는 1.7.0 렌더 값), input 경계 · hover, button 포커스 링, border.warning 라이트, running-contrast · success-contrast(다크), d.ts 타입
- [x] ui-react: Checkbox · RadioGroupItem · Textarea 경계, Switch · Slider 트랙, Progress 채움
- [x] agentic-ui: 아이콘 · 점 text-*, 스피너 arc 불투명, 오류 테두리 border-error, PlanCard 승인 글자 button-text-default
- [x] 짝 표: 바뀐 소비처 행, 상태 점 · 포커스 링 · 켜진 컨트롤 행 추가, check-contrast-pairs 부모 근거 21행
- [x] brand-nontext-contrast E2E: EXPECTED_VAR · 아이콘 변수 · 잔여 프로브 갱신, DEFAULT_BRAND_FLOOR 비움, 낡은 「해소는 WI-0029 #94」 정정

## 테스트
- [x] tokens `default-contrast.test` 전 행 + 기본 전용 비텍스트 9짝, `brands.test` WI0063_SAME, `baseline-1.2.1` WI0063 예외, `theme-modes` 색 leaf 53
- [x] 단위 agentic · ui-react `nontext-contrast.test.tsx`(수정 전 소스 14 · 6 실패)
- [x] E2E nontext 8 · a11y 40 · demo 8 · tooltip 6 · tokens 22
- [x] 브라우저: 59경로 x 4환경 axe, 폼 컨트롤 실요소 실측, ontology 계산값 · 렌더 색 수정 전후 비교
- [x] 게이트: turbo lint · type-check · build · test `--force`, frontend.yml run 단계

## 생성물 · 릴리스
- [x] `build:registry`(agentic 10항목, version 1.5.0 유지) · `library:refresh-axis` · 템플릿 updatedAt churn 되돌림
- [x] changeset `.changeset/wi-0063-nontext-contrast.md`(tokens · ui-react · agentic-ui minor, cli · mcp patch)
- [x] 변수 덮어쓰기 사용자 안내(검토 지적): theme-customization 가이드 2절 · 5절 acme 예시, component-usage 가이드, release-notes 「업그레이드」 표, batch4 changeset. Chromium 실측: 예전 변수만 덮어쓰면 새 변수 소비처는 기본값(#2563EB · #6B7280) 유지, 새 변수까지 덮어쓰면 따라감
- [ ] ontology 컨트롤 경계 · Progress success · warning 채움 값 결정(사용자 결정 대상, 이번 범위 밖)
- [ ] 배치 4 ② 묶음 PR · 머지 · 배포 뒤 발행본으로 재측정
