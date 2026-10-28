# WI-0097: check 의 CSS import 해석 가능성 판정 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #241 | 상태: 🔄 착수(2026-10-28)

## 결정
- [ ] 사용자 결정 Q21 · Q22 · Q24 · Q26 · Q27 · Q28(2026-10-28)과 선례 항목(prd 1.2)을 구현 전에 다시 읽고 범위 고정 (AC1 ~ AC13)
- [ ] **착수 게이트(Q22)**: PnP 루트 전용 CSS `@import` 실빌드 1회(`@axis-ds/ui-react/tailwind.css` · `@axis-ds/tokens/css/tailwind4`, Yarn 4.5.3 실설치, `.pnp.cjs` 표지 사용). rc 와 오류 문구를 testplan 2절에 기록. rc 0 이면 구현 중단 · Master 보고 (AC3 · AC5 · AC6)
- [x] 열린 확인 O1(g2 tokens 앱 선언 · 미설치의 globals) → 결정됨(Q28, 2026-10-28): globals PASS 유지, 앱 선언 · 미설치는 globals 게이트 밖 (AC6 · AC7 · AC11 M6)
- [ ] 바뀔 기존 테스트 목록을 plan 4절에서 「stub 보강」 · 「기대 변경」 · 「불변」으로 확정 (AC10)
- [ ] WI-0100a 머지 확인(파일 선택 헬퍼 · `findGlobalCss` 이전) 뒤 그 위에서 착수 (plan 3절)

## 구현
- [ ] registry-core `project.ts`: 컴포넌트 `tailwind.css` 해석 상태 헬퍼(1.4 표 6갈래 + 앱 선언) (AC1 ~ AC5)
- [ ] registry-core `project.ts`: tokens CSS 해석 상태 헬퍼(앱 선언은 미설치여도 해석으로 봄(Q28) · non-PnP 설치본 디렉터리 · PnP 루트 전용. WARN 은 루트 선언 · 미설치, 미선언 · 미설치, PnP 루트 전용만) (AC6 · AC7)
- [ ] DEC-2 판정 · 미루는 이유 문구 · 1.4.0 상수를 registry-core 로 이전, `COMPONENT_TAILWIND_CSS_MIN_VERSION` 과 `TAILWIND4_MIN_AXIS_VERSION` 통합 (AC9)
- [ ] cli `theme-add.ts:404-419` · `theme/index.ts:367-385` 가 이전한 헬퍼 · 문구 함수를 부르게 교체(출력 바이트 불변) (AC9)
- [ ] `tailwind4Issues` B1 줄 없음 방향(`:826-835`)을 헬퍼로 (AC1 ~ AC4)
- [ ] `tailwind4Issues` 줄 있음 방향(`:843-849`)에 해석 불가 WARN, 혼합 패키지 문구 잇기 (AC5)
- [ ] `checkGlobalsCss` pass 갈래(WI-0100a 가 옮긴 뒤의 `:360-366` 상당)에 tokens 게이트 (AC6)
- [ ] 주석 갱신: `tailwind-core.ts:1-33`(`:12-14` · `:24-26`), `:55-65`(B1 은 `declaredRange` 그대로라는 서술), `project.ts:174-175`. 확인은 범위 서술 grep 대조(「`declaredRange` 그대로」 · 「check 만 불인정」 류가 남은 곳 0) (AC13)
- [ ] 문서: `packages/axis-cli/README.md:101` · `:104` · `:109`, `docs/guides/troubleshooting.md` PnP 한 줄(Q27) (AC13)

## 테스트
- [ ] 0100a 머지 직후 HEAD 기준선(파일별 통과 수 · 빌드 사본 · SHA) 고정, mcp `tokens-sync` 는 빌드 뒤 실행 확인 (AC7 · AC10 · AC12)
- [ ] 새 describe 「WI-0097」: AC1 ~ AC6 행 · AC7 가드 행(cli), MCP 대응 행 (AC1 ~ AC8)
- [ ] 새 테스트를 HEAD 소스에 돌려 AC1 ~ AC6 행 빨강 · AC7 가드 행 초록 확인 (AC1 ~ AC7)
- [ ] A/B probe 로 기존 테스트 전이 전수 기록, plan 4절 목록과 대조 (AC10)
- [ ] 변이 M1 ~ M4 · M5a · M5b · M6 ~ M12 각각 빨강, sha256 대조 원복 (AC11)
- [ ] scratchpad fixture 를 발행본 · 수정본 CLI · MCP 로 재측정, rc 표 (AC1 ~ AC8 · AC12)
- [ ] theme add 출력 A/B(fixture 5종) diff 0 (AC9)
- [ ] 안내대로 고친 fixture 실빌드 rc 0(AC1), 해석 불가 줄 rc 1 재확인(AC5)
- [ ] turbo build · type-check · lint `--force`(Cached 0 확인), cli · mcp vitest (AC10)

## 릴리스
- [ ] changeset: `@axis-ds/cli` patch + `@axis-ds/mcp` patch(registry-core 변경, `pnpm check-changeset-mcp-tokens` rc 0), 이 WI 의 changeset 이 PR 에 있는지 리뷰에서 따로 확인 (AC13)
- [ ] release-notes.md 초안을 수정본 측정 문구로 갱신 (AC1 ~ AC6)
- [ ] PR · 머지 · 발행(Master, WI-0098 · WI-0100 과 한 발행: cli 1.7.7 · mcp 1.4.6, linked 4패키지 1.8.2 그대로)
