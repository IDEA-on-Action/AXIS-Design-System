# WI-0092: Tailwind 4 animation 선언 · 설치본 판정 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #235 | 상태: 🔄 구현 · 검증 완료, PR · 릴리스 대기

## 결정
- [x] Q9 · Q10 · Q12 (2026-10-27 사용자 결정), PnP 행은 WI-0091 Q1
- [x] Q12 선측정: WI-0074 원 fixture 에 `tw-animate-css` 미설치 확인(npm 10.9.4 재현) → 기대 WARN

## 구현
- [x] `checkAnimationPlugin` TW4 줄별 패키지 · 선언 · 설치본 (AC1 ~ AC5)
- [x] TW3 · TW4 공용 사유 `pluginProblem`
- [x] 문서: `docs/guides/theme-customization.md` animation 행(360), `packages/axis-cli/README.md` animation 절

## 테스트
- [x] 기존 기대 변경: cli tw4Ok(+ 새 PASS 행) · h-rootonly-ui hoisted · isolated, mcp h-rootonly-ui. 2553-2568 불변
- [x] 새 describe 「WI-0092」 6건 · MCP 1건
- [x] HEAD 소스에서 새 테스트 5 빨강(호이스팅 PASS · 줄 없음 대조는 설계상 초록)
- [x] 변이 M5 · M6 각각 빨강
- [x] 실제 설치 fixture 23개 재측정 · CLI · MCP 대조

## 릴리스
- [x] changeset(WI-0091 과 같은 파일)
- [ ] PR · 머지 · 발행(Master)
