# WI-0103: exports 를 보는 패키지 CSS import 해석 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #254 | 상태: 착수 측정 완료 · 사용자 결정 Q70 ~ Q79 대기

## 착수
- [x] 발행본 cli 1.7.7 · mcp 1.4.6 으로 WI-0100b 의 s3 · s7 · z5 재현(양성 대조) (AC2 · AC3 · AC5) (2026-10-29, testplan 2.1: 세 경우 모두 WI-0100b 기록과 같음, CLI = MCP)
- [x] 위치 × 그림자 상태 × 대상 패키지 교차 측정, CLI · MCP · 실빌드(`@tailwindcss/postcss` 4.1.14) 대조 (AC1 ~ AC8) (2026-10-29, testplan 2.3: 147칸, 거짓 PASS 39 · 거짓 WARN 6 · 문구 다름 12 · 맞음 90, CLI = MCP 147/147, rc 0 147/147)
- [x] 실빌드 해석기가 그림자를 건너뛰는 조건을 상태마다 기록 (AC1) (2026-10-29, testplan 2.2: `exports` 없고 파일 없음 · package.json 없고 파일 없음만 건너뜀, `exports` 가 있으면 그 설치본에서 끝남)
- [x] 원인 위치 · 호출지 확인 (plan 2절) (2026-10-29, `project.ts:739-744` `outsideCssPackageResolution` · `:575-595` `findInstalledPackage`, 호출지 `tailwind-core.ts:722` · `:1279` · `:1310`, 시작 디렉터리 `:529` · `:630-634` · `:683-687`)
- [x] 발행된 AXIS 버전의 exports 모양 확인 (Q70 · Q75) (2026-10-29, testplan 2.4: 1.1.0 ~ 1.8.2 모두 exports 있음, 패턴 · 조건부 CSS 0건)

## 결정
- [ ] 사용자 결정 Q70 ~ Q79(prd 7절)를 받아 prd 1.2 · AC · plan 1.1 표 · 3절 문구 · testplan 3절 기대값에 반영 (AC1 ~ AC9)
- [ ] 미측정 축 측정: Next 15 대표 4칸 · pnpm 심볼릭 링크 레이아웃 1칸(testplan 4절). 결과가 testplan 2.2 와 다르면 plan 1절을 고친 뒤 진행 (AC1)

## 구현
- [ ] registry-core `project.ts`: `resolveCssPackageImport`(plan 1절 1 ~ 6) (AC1)
- [ ] registry-core `project.ts`: 그림자 판별 · z5 규칙을 담은 위치 판정(plan 1.1 표), `outsideCssPackageResolution` 대체 또는 확장 (AC2 ~ AC5 · AC7)
- [ ] `tailwind-core.ts` `expandGlobalCss`: 해석 시작 디렉터리(`resolveDir`), 앱 안 진입 파일은 그 디렉터리(Q73). `cssDir` 의 뜻은 그대로 (AC4 · AC7)
- [ ] `tokensCssUnresolvedIssue`(`:722`) · `tailwind4Issues`(`:1308-1313`)를 새 판정으로, `:796` 레이아웃 갈래 · `:1279` tailwindcss 는 종전 (AC2 ~ AC5 · AC7)
- [ ] 그림자 전용 문구 3갈래(plan 3절, Q76) (AC6)
- [ ] 주석 · `packages/axis-cli/README.md:107` 갱신, 범위 서술 grep 대조 (AC11)

## 테스트
- [ ] 착수 직전 HEAD 기준선(SHA · 빌드 사본 · cli · mcp 파일별 통과 수) 고정 (AC7 · AC10)
- [ ] 새 describe 「WI-0103」: 해석기 단위 테스트(testplan 3절 끝) · 칸 대표 행(cli), MCP 대표 행 (AC1 ~ AC6)
- [ ] 새 테스트를 HEAD 소스에 돌려 빨강, 수정본 초록 (AC10)
- [ ] 147칸을 수정본 CLI · MCP 로 재측정, testplan 3절 기대와 대조 (AC2 ~ AC8)
- [ ] A/B probe 전이 전수(기대: s5 문구 1건), 양성 대조 변이 빌드로 계측 확인 (AC7)
- [ ] theme add A/B · 브랜드 항목 줄 불변 (AC9)
- [ ] 변이 V1 ~ V12 빨강, sha256 대조 원복 (AC10)
- [ ] `pnpm turbo run build type-check lint --force`(Cached 0), cli · mcp vitest (AC10)

## 릴리스
- [ ] changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0 (AC11)
- [ ] release-notes.md(구현 뒤 측정 문구로)
- [ ] PR · 머지 · 발행(Master)
