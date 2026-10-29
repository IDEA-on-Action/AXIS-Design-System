# WI-0098: Yarn PnP 의 Tailwind 3 content 판정 TODO

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #242 | 상태: ✅ 완료(2026-10-29, cli 1.7.7 · mcp 1.4.6)
> 같은 발행: WI-0097(#241) · WI-0100(#244), cli 1.7.7 · mcp 1.4.6 patch. 이 WI 는 별도 worktree 에서 병렬로 하고 WI-0097 머지 뒤 rebase 해요(plan.md 3절)

## 결정
- [x] 사용자 결정 Q22 · Q23 · Q24 · Q26 · Q27 반영 확인(prd 1.2) (AC1 · AC2 · AC3 · AC6 · AC7 · AC11)
- [x] 구현 해석 C1 ~ C4 를 착수 전 Master 에 확인, 사용자 결정 Q30(2026-10-28)으로 확정해 prd 1.2 결정 표에 기록(종전 덮지 않음은 FAIL 유지 · unplugged 프로젝트의 nm 도 WARN · 루트 전용 severity(dynamic 은 WARN) · unplugged 제안의 cwd 안내) (AC3 · AC4 · AC6)
- [x] 사용자 결정 Q29(2026-10-28): unplugged glob PASS 인정(rc 1 → 0). 구현 해석 초안 C5 를 확정해 prd 1.2 사용자 결정 표로 옮김 (AC4)
- [x] 사용자 결정 Q31 · Q32 · Q33 · Q34(2026-10-28) prd 1.2 결정 표 · 머리말 상태에 기록: 안내의 패키지 이름 채움 · unplugged dyn 행 확정 · PnP 루트 앱 `./**` 거짓 PASS 수정 · 버전 규칙 확정(`yarn.lock` 미대조는 한계) (AC4 · AC5)
- [x] Q22 근거 측정(구현 첫 단계, prd 1.1 표에 「착수 측정」 행으로 반영 · Q4u unplugRel · unplugAbs 빌드 429 인데 FAIL 은 prd 7절 알려진 한계): Q4 nm · none 행의 발행본 판정 · 빌드, R-dyn 의 발행본 문구 재기록(제안 문자열), Q4 에 unplugged 를 설정하고 unplugRel glob 으로 빌드 · 발행본 check를 1회 재서 prd 1.1 표에 더해요. unplugRel 빌드가 429 이면 C3 의 알려진 한계로 prd 7절에 적어요. Q22 근거는 축마다 갈라요. TW3 content(이 WI)의 근거는 Q4 R-dyn(측정, `require.resolve` `MODULE_NOT_FOUND` · 빌드 rc 1)과 이 WI 구현 첫 단계의 Q4 측정이고, CSS `@import` 실빌드는 WI-0097 의 근거예요(WI-0097 첫 단계에서 잼). 이 WI 는 병렬이라 2단계 시점에 그 측정이 없을 수 있으므로, 문구 고정(plan 2절 3단계) 전에 WI-0097 첫 단계 측정이 끝났고 루트 전용 안내와 어긋나지 않는지 확인해요 (AC6)
- [x] 새 안내 문구(PnP 안내 상수 · WARN 문구 · 루트 전용 문구) 초안을 testplan 3절에 고정하고 Master 확인 (AC1 · AC3 · AC6 · AC7) - 사용자 결정 Q44 · Q45(2026-10-28)로 확정, testplan 3절을 확정 문구로 갱신
- [x] 사용자 결정 Q44 · Q45(2026-10-28) prd 1.2 결정 표 · 머리말 상태에 기록: 안내 문구 합니다체 통일 · unplugged 디렉터리가 있는 패키지는 설정 안내에서 뺌 (AC3 · AC5 · AC7)
- [x] 사용자 결정 Q47(2026-10-28): 상위 경로 안내 `CONTENT_PARENT_PATH_NOTE` 와 WI-0090 의 「다른 설치본이라 덮음으로 보지 않음」 항목을 합니다체로, 비 PnP 는 그 문구 외 바이트 불변 (AC8)
- [x] 바뀔 기존 테스트 목록(plan.md 5절)을 HEAD 기준선과 함께 고정 (AC8) - 수정 뒤 빨개진 기존 테스트는 `template-check.test.ts` AC5 한 건(:2212 · :2213)뿐

## 구현
- [x] `project.ts`: unplugged 설치본 탐색 헬퍼(앱 선언 범위에 맞는 버전만, `isPnpProject` 와 같은 `.git` 멈춤) (AC4)
- [x] `tailwind-core.ts` `packageContentTarget`: PnP 분기(기본 · unplugged · 루트 전용), 종전 표본은 PnP 에서 「종전 덮음」 판별에만 씀 (AC1 · AC3 · AC4 · AC6)
- [x] `inspectTailwindContent`: 대상에 PnP 상태 필드(비 PnP 에서는 생기지 않음) · 루트 전용 판정에 `pnpRootOnlyDependency` (AC1 · AC6 · AC8)
- [x] `checkTailwindContent`: 종전 덮음 PnP → WARN, 종전 덮지 않음 → FAIL 유지, 제안 자리에 PnP 안내 상수 (AC1 · AC2 · AC3 · AC6)
- [x] 안내 상수 export(`CONTENT_PARENT_PATH_NOTE` 옆, 이름 가칭 `CONTENT_PNP_NOTE`) (AC3 · AC5 · AC7)
- [x] `theme-add.ts:479-485` 는 변경 없이 PnP 대상이 `contentMissing` 에 담기는지 확인 · `theme/index.ts:455-465` PnP 안내 줄 (AC7)
- [x] 머리 주석 :28-31 · :1141 · :1277-1279 의 「PnP 면 종전 node_modules」 서술 고침 (AC1 · AC3 · AC4 판정 서술)
- [x] 문서: `packages/axis-cli/README.md:115`, `docs/guides/troubleshooting.md` Tailwind 3 해결 절 PnP 한 줄 (AC11)
- [x] Q31: `CONTENT_PNP_NOTE` 상수를 `contentPnpNote(names)` · `contentPnpNoteTargets` 로 바꿈(check · theme add 같은 함수, 둘 이상이면 패키지별 나열) (AC5 · AC7)
- [x] Q33: unplugged 표본만 `contentGlobCovers(..., { noDot: true })`(점 세그먼트를 넘는 `**` · `*` 는 덮지 않음), 비 PnP 는 종전 정규식 (AC4)
- [x] Q44 · Q45: `contentPnpNote` 합니다체 · `contentPnpNote(names, unplugged)` 와 `contentPnpNoteFor(targets)`(check · MCP · theme add 공용, unplugged 대상은 설정 안내에서 뺌) (AC3 · AC5 · AC7)
- [x] 문서 4곳(README · changeset · release-notes 본문 · 종료 코드 표)의 「./** 는 WARN」 서술을 Q33 반영 뒤 동작(`.yarn` 은 글자 그대로 써야 인정)으로 고침 (AC11)

## 테스트
- [x] HEAD 기준선(파일별 통과 수: cli `template-check` · `theme-add` · mcp `template`) 기록 (AC8)
- [x] 기존 기대 변경: `template-check.test.ts:2212` · `:2213` (AC1 · AC3)
- [x] 새 단위 행: pnp nm · broad · none · dyn · agentic-ui, unplugged rel · abs · none · 맞지 않는 버전, 루트 전용 nm · none · 앱 선언 양성 대조 (AC1 · AC2 · AC3 · AC4 · AC6)
- [x] `theme-add.test.ts` PnP TW3 nm · none · 루트 전용 행 (AC7)
- [x] mcp `template.test.ts` PnP content 행(`pnpApp` 재사용), CLI 와 같은 문구 (AC9)
- [x] 새 테스트를 HEAD 소스에 돌려 빨강 확인(A/B, 판정 소스만 `git show HEAD:` 로 바꾸고 sha256 원복) (AC1 · AC2 · AC3 · AC4 · AC6 · AC7)
- [x] 변이 ① ~ ⑥ 각각 빨강 · 원복 sha256 일치 (AC10)
- [x] 실설치 fixture(P1 · P3 · P4 · Q1 · Q3 · Q4 · TA1) 신판 재측정: 빌드 정답 · 구판 · 신판 표 (AC1 · AC2 · AC3 · AC4 · AC6 · AC7)
- [x] 안내 적용 측정: Q1 동적 형태 · Q3 unplugged 제안을 글자 그대로 넣고 빌드 429 · check 판정 (AC5) - Q44 · Q45 확정 문구로 다시 잼(Q1 · P1 동적 형태 빌드 429 WARN rc 0, Q3 · P3 제안 glob 빌드 429 PASS)
- [x] 비 PnP 바이트 불변: 구판 · 신판 diff 0 + PnP 행 양성 대조 (AC8)
- [x] CLI · MCP 줄 대조 불일치 0 + 비교기 양성 대조 (AC9)
- [x] Q31 · Q33 테스트 · 변이 · A/B, 실설치 재측정(51행 + S1 8행 + theme add 12개), AC5 복사 측정 (AC4 · AC5 · AC10)
- [x] Q44 · Q45 테스트(cli `Q45` 1건 · mcp `Q45` 1건, 기존 리터럴 합니다체 · unplugged 행 기대 갱신) · 변이(조건 제거 cli 5 · mcp 2, theme add 만 무시 cli 1, 해요체 되돌림 cli 13 · mcp 3), 실설치 51행 + theme add 12개 재측정 · 비 PnP 31건 바이트 불변 (AC5 · AC7 · AC8 · AC9 · AC10)
- [x] turbo build · type-check · lint `--force`(Cached 0), cli · mcp `npx vitest run` (AC8) (2026-10-29, 이 WI 단독으로는 돌리지 않았고, 0098 머지 뒤 main 위에서 만든 #255 의 `turbo run build type-check lint --force`(registry-core · cli · mcp) Cached 0 rc 0 · vitest cli 1096 · mcp 231 로 갈음)

## 릴리스
- [x] changeset `.changeset/wi-0098-pnp-content-glob.md`(`@axis-ds/cli` patch + `@axis-ds/mcp` patch, 1 → 0 경우 · 0 → 1 없음 · PASS → WARN 형태 명시) (AC12)
- [x] `pnpm check-changeset-mcp-tokens` rc 0, 이 PR 자기 changeset 확인 (AC12)
- [x] release-notes.md 를 측정값으로 갱신하고 「미발행」 표기를 발행 정보로 바꿈 (AC12) (2026-10-29, 발행 정보와 발행본 재측정 단락 반영)
- [x] PR · 머지 · 발행(Master, WI-0097 · WI-0100 과 Version PR 하나) (2026-10-29, PR #252 머지 be61b74 · Version PR #251 머지 1e8da06 · publish run 40811479954 success, cli 1.7.7 · mcp 1.4.6 발행 · provenance 2/2, linked 4패키지 1.8.2 그대로)
