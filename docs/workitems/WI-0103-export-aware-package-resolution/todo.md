# WI-0103: exports 를 보는 패키지 CSS import 해석 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #254 | 상태: 🔄 구현 · 검증 완료, PR 리뷰 · 발행 대기

## 착수
- [x] 발행본 cli 1.7.7 · mcp 1.4.6 으로 WI-0100b 의 s3 · s7 · z5 재현(양성 대조) (AC2 · AC3 · AC5) (2026-10-29, testplan 2.1: 세 경우 모두 WI-0100b 기록과 같음, CLI = MCP)
- [x] 위치 × 그림자 상태 × 대상 패키지 교차 측정, CLI · MCP · 실빌드(`@tailwindcss/postcss` 4.1.14) 대조 (AC1 ~ AC8) (2026-10-29, testplan 2.3: 147칸, 거짓 PASS 39 · 거짓 WARN 6 · 문구 다름 12 · 맞음 90, CLI = MCP 147/147, rc 0 147/147)
- [x] 실빌드 해석기가 그림자를 건너뛰는 조건을 상태마다 기록 (AC1) (2026-10-29, testplan 2.2)
- [x] 원인 위치 · 호출지 확인 (plan 2절) (2026-10-29)
- [x] 발행된 AXIS 버전의 exports 모양 확인 (Q70 · Q75) (2026-10-29, testplan 2.4)

## 결정
- [x] 사용자 결정 Q70 ~ Q79(2026-10-29, 모두 권장안)를 prd 1.2 · 7절, plan, testplan 3절에 반영 (AC1 ~ AC9)
- [x] 미측정 축 측정: Next 15 대표 4칸 · pnpm 레이아웃 2칸 (AC1) (2026-10-29, testplan 4.1 · 4.2: 2.2 와 같음)
- [x] 추가 결정 Q70a ~ Q70d 를 권장안으로 진행하고 prd 8절에 기록 (2026-10-29, Master 확인 대기)

## 구현
- [x] registry-core `project.ts`: `resolveCssPackageImport`(plan 1절) (AC1) (반박 검증 보정 포함: 거짓 값 exports · 대상 `.css` · `index.css` · 조건 안 `null`)
- [x] registry-core `project.ts`: `cssPackageLineResolution`(plan 1.1 표, 그림자 판별 · 조상 설치본 가드 · z5) (AC2 ~ AC5 · AC7)
- [x] 앱 안 진입 파일도 그 파일 디렉터리 기준(Q73). `expandGlobalCss` · `cssDir` 는 바꾸지 않음 (AC4 · AC7) (`template-check.test.ts:1516` 그대로 통과)
- [x] `tokensCssUnresolvedIssue` · `judgeGlobalsCss` · `tailwind4Issues` 연결, 레이아웃 JS import · `tailwindcss` 줄 · Tailwind 3 은 종전 (AC2 ~ AC5 · AC7) (변이 V11 ~ V13 빨강)
- [x] 그림자 전용 문구 3갈래(plan 3절, Q76) (AC6) (반박 검증 1-a ~ 1-c 반영, 변이 V10 · V17 · V18 빨강)
- [x] 주석 · `packages/axis-cli/README.md` 갱신, 범위 서술 grep 대조 (AC11) (반박 검증 문구 · 문서 관점 4-a ~ 4-h · 3-a ~ 3-c)

## 테스트
- [x] 착수 직전 HEAD 기준선 고정 (AC7 · AC10) (f9785c2, cli 1096 · mcp 231, testplan 7절)
- [x] 새 describe 「WI-0103」(cli 50 · mcp 3) (AC1 ~ AC6)
- [x] 새 테스트를 main 소스에 돌려 빨강, 수정본 초록 (AC10) (cli 29 빨강 · 24 가드 초록, mcp 3 빨강)
- [x] 147칸 + 양성 대조 5칸을 수정본 CLI · MCP 로 재측정 (AC2 ~ AC8) (실빌드 불일치 48 → 1(stub fixture pc-z5), CLI = MCP 152/152, rc 152/152 같음)
- [x] 기존 fixture 코퍼스 196개 A/B (AC7) (193/196 바이트 같음, 바뀐 3개는 그림자 fixture)
- [x] theme add A/B · 브랜드 항목 줄 불변 (AC9) (theme add 348/348 같음, 브랜드 항목은 코퍼스 A/B 에 포함)
- [x] 변이 V1 ~ V19 빨강, sha256 대조 원복 (AC10) (19/19)
- [x] `pnpm turbo run build type-check lint test --force`(registry-core · cli · mcp, Cached 0) (AC10) (rc 0, cli 1146 · mcp 234)
- [x] 반박 검증 3관점(정확성 · 회귀 · 문구와 문서) · 보정 · 회귀 재검증 (testplan 6절)

## 릴리스
- [x] changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0 (AC11)
- [x] release-notes.md(수정본 측정 문구)
- [x] PR · 머지 · 발행(Master) (#257 머지 c166b8a, Version PR #259 로 cli 1.7.8 · mcp 1.4.7 발행, 2026-10-30)
