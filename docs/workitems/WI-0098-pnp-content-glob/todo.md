# WI-0098: Yarn PnP 의 Tailwind 3 content 판정 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #242 | 상태: 🔄 착수(2026-10-28)
> 같은 발행: WI-0097(#241) · WI-0100(#244), cli 1.7.7 · mcp 1.4.6 patch. 이 WI 는 별도 worktree 에서 병렬로 하고 WI-0097 머지 뒤 rebase 해요(plan.md 3절)

## 결정
- [ ] 사용자 결정 Q22 · Q23 · Q24 · Q26 · Q27 반영 확인(prd 1.2) (AC1 · AC2 · AC3 · AC6 · AC7 · AC11)
- [ ] 구현 해석 C1 ~ C4 를 착수 전 Master 에 확인(종전 덮지 않음은 FAIL 유지 · unplugged 프로젝트의 nm 도 WARN · 루트 전용 severity(dynamic 은 WARN) · unplugged 제안의 cwd 안내) (AC3 · AC4 · AC6)
- [x] 사용자 결정 Q29(2026-10-28): unplugged glob PASS 인정(rc 1 → 0). 구현 해석 초안 C5 를 확정해 prd 1.2 사용자 결정 표로 옮김 (AC4)
- [ ] Q22 근거 측정(구현 첫 단계): Q4 nm · none 행의 발행본 판정 · 빌드, R-dyn 의 발행본 문구 재기록(제안 문자열), Q4 에 unplugged 를 설정하고 unplugRel glob 으로 빌드 · 발행본 check를 1회 재서 prd 1.1 표에 더해요. unplugRel 빌드가 429 이면 C3 의 알려진 한계로 prd 7절에 적어요. Q22 근거는 축마다 갈라요. TW3 content(이 WI)의 근거는 Q4 R-dyn(측정, `require.resolve` `MODULE_NOT_FOUND` · 빌드 rc 1)과 이 WI 구현 첫 단계의 Q4 측정이고, CSS `@import` 실빌드는 WI-0097 의 근거예요(WI-0097 첫 단계에서 잼). 이 WI 는 병렬이라 2단계 시점에 그 측정이 없을 수 있으므로, 문구 고정(plan 2절 3단계) 전에 WI-0097 첫 단계 측정이 끝났고 루트 전용 안내와 어긋나지 않는지 확인해요 (AC6)
- [ ] 새 안내 문구(PnP 안내 상수 · WARN 문구 · 루트 전용 문구) 초안을 testplan 3절에 고정하고 Master 확인 (AC1 · AC3 · AC6 · AC7)
- [ ] 바뀔 기존 테스트 목록(plan.md 5절)을 HEAD 기준선과 함께 고정 (AC8)

## 구현
- [ ] `project.ts`: unplugged 설치본 탐색 헬퍼(앱 선언 범위에 맞는 버전만, `isPnpProject` 와 같은 `.git` 멈춤) (AC4)
- [ ] `tailwind-core.ts` `packageContentTarget`: PnP 분기(기본 · unplugged · 루트 전용), 종전 표본은 PnP 에서 「종전 덮음」 판별에만 씀 (AC1 · AC3 · AC4 · AC6)
- [ ] `inspectTailwindContent`: 대상에 PnP 상태 필드(비 PnP 에서는 생기지 않음) · 루트 전용 판정에 `pnpRootOnlyDependency` (AC1 · AC6 · AC8)
- [ ] `checkTailwindContent`: 종전 덮음 PnP → WARN, 종전 덮지 않음 → FAIL 유지, 제안 자리에 PnP 안내 상수 (AC1 · AC2 · AC3 · AC6)
- [ ] 안내 상수 export(`CONTENT_PARENT_PATH_NOTE` 옆, 이름 가칭 `CONTENT_PNP_NOTE`) (AC3 · AC5 · AC7)
- [ ] `theme-add.ts:479-485` 는 변경 없이 PnP 대상이 `contentMissing` 에 담기는지 확인 · `theme/index.ts:455-465` PnP 안내 줄 (AC7)
- [ ] 머리 주석 :28-31 · :1141 · :1277-1279 의 「PnP 면 종전 node_modules」 서술 고침 (AC1 · AC3 · AC4 판정 서술)
- [ ] 문서: `packages/axis-cli/README.md:115`, `docs/guides/troubleshooting.md` Tailwind 3 해결 절 PnP 한 줄 (AC11)

## 테스트
- [ ] HEAD 기준선(파일별 통과 수: cli `template-check` · `theme-add` · mcp `template`) 기록 (AC8)
- [ ] 기존 기대 변경: `template-check.test.ts:2212` · `:2213` (AC1 · AC3)
- [ ] 새 단위 행: pnp nm · broad · none · dyn · agentic-ui, unplugged rel · abs · none · 맞지 않는 버전, 루트 전용 nm · none · 앱 선언 양성 대조 (AC1 · AC2 · AC3 · AC4 · AC6)
- [ ] `theme-add.test.ts` PnP TW3 nm · none · 루트 전용 행 (AC7)
- [ ] mcp `template.test.ts` PnP content 행(`pnpApp` 재사용), CLI 와 같은 문구 (AC9)
- [ ] 새 테스트를 HEAD 소스에 돌려 빨강 확인(A/B, 판정 소스만 `git show HEAD:` 로 바꾸고 sha256 원복) (AC1 · AC2 · AC3 · AC4 · AC6 · AC7)
- [ ] 변이 ① ~ ⑥ 각각 빨강 · 원복 sha256 일치 (AC10)
- [ ] 실설치 fixture(P1 · P3 · P4 · Q1 · Q3 · Q4 · TA1) 신판 재측정: 빌드 정답 · 구판 · 신판 표 (AC1 · AC2 · AC3 · AC4 · AC6 · AC7)
- [ ] 안내 적용 측정: Q1 동적 형태 · Q3 unplugged 제안을 글자 그대로 넣고 빌드 429 · check 판정 (AC5)
- [ ] 비 PnP 바이트 불변: 구판 · 신판 diff 0 + PnP 행 양성 대조 (AC8)
- [ ] CLI · MCP 줄 대조 불일치 0 + 비교기 양성 대조 (AC9)
- [ ] turbo build · type-check · lint `--force`(Cached 0), cli · mcp `npx vitest run` (AC8)

## 릴리스
- [ ] changeset `.changeset/wi-0098-pnp-content-glob.md`(`@axis-ds/cli` patch + `@axis-ds/mcp` patch, 1 → 0 경우 · 0 → 1 없음 · PASS → WARN 형태 명시) (AC12)
- [ ] `pnpm check-changeset-mcp-tokens` rc 0, 이 PR 자기 changeset 확인 (AC12)
- [ ] release-notes.md 를 측정값으로 갱신하고 「미발행」 표기를 발행 정보로 바꿈 (AC12)
- [ ] PR · 머지 · 발행(Master, WI-0097 · WI-0100 과 Version PR 하나)
