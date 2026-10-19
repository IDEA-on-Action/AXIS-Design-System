# WI-0038: `axis init` utils.ts 의존성(clsx · tailwind-merge) 추가 · 안내 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | 상태: 🔄 진행 (2026-10-19 구현 · 검증 완료, PR 대기)

## 진행 순서

| Phase | 범위 | 릴리스 | GitHub |
|---|---|---|---|
| M1 | init 의존성 추가 · 안내(D1), 실행 안내 `@axis-ds/cli` 정정(D2), 테스트 · 스모크 | `@axis-ds/cli` patch 1.2.1 (`.changeset/wi-0038-cli-init-utils-deps.md`) | #124 |

- `project-todo.md` 와 `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다

---

## 착수 전 결정

> 2026-10-19 사용자 결정. prd 1.4 표와 같습니다.

- [x] init 이 `package.json` 에 쓸지 안내만 할지 → ✅ 없을 때만 `dependencies` 에 추가, 설치는 안내만 (D1)
- [x] `npx axis-cli` 안내 정정 → ✅ `npx @axis-ds/cli` (D2)
- [x] 의존성 범위 → ✅ 템플릿 4종과 같은 `clsx ^2.1.1` · `tailwind-merge ^3.4.0` (D3, prd 1.5). E2 로 `tailwind-merge` 는 Tailwind 버전별로 보정
- [x] 남은 실행 안내(`.claude/agents` · `docs` 최상위 문서) 정정과 스캔 범위 확장 → ✅ (E1, 2026-10-19 사용자 결정)
- [x] `tailwind-merge` 범위 → ✅ Tailwind 4 `^3.4.0`, 3 이거나 판정 불가 `^2.6.0`, 설치본 우선 (E2, prd 1.6)
- [x] Tailwind 판정 보강 → ✅ 하한 major 읽기 · 판정 불가와 설치본 · 선언 불일치 경고 · 4 이상은 `^3.4.0` (F1, 2026-10-19 사용자 결정, prd 1.6)
- [x] 안내 테스트 스캔 범위 → ✅ `docs/templates` · `.claude/commands` · `.claude/prompts` · `.claude/rules` · `.clinerules` 추가 (F2, 2026-10-19 사용자 결정)
- [x] 에이전트 해석 세 가지 → ✅ 2026-10-19 사용자 확정 (E3): D2 를 `pnpm dlx` · `bunx` · `npx` 없는 명령까지 확장, 문서 사이트 산문 2줄 정정, `package.json` 을 읽지 못하면 안내만 하고 rc 0 유지
- [x] init 재실행 시 `axis.config.json` 덮어쓰기 · library 수집본 → ✅ 별도 WI 로 넘김(E4, 메인 세션이 등록, prd 2장)

---

## Phase M1

### M1-1 원인 · 기준값 실측
- [x] c131ee9 빌드를 pack · 설치해 `axis init -y` 출력 · `axis.config.json` · `utils.ts` 기준값 기록 (prd C2)
- [x] `axis-cli` 전수 grep, 실행 안내와 아닌 것 분류 (prd C4)
- [x] 의존성 범위 출처 실측 (prd 1.5)

### M1-2 D1 구현
- [x] init 을 `src/init/` 으로 옮겨 테스트 가능한 형태(`registerInitCommand` · `runInit`)로 분리, 출력 · 파일 불변
- [x] `planUtilsDependencies` · `applyUtilsDependencies`: theme add 의 `detectInstallCommand` · `formatJsonLike` · `realPathInside` · `hasDependency` 재사용, BOM 유지
- [x] `package.json` 없음 · 읽을 수 없음 · 프로젝트 밖 · 쓰기 불가 · 계획 뒤 변경 처리 (FR-2 ~ FR-4)

### M1-3 D2 정정
- [x] CLI 출력 · 사용법 주석의 `axis-cli` 실행 안내 정정
- [x] 문서 사이트(`apps/web/src`) 실행 안내 정정
- [x] 안내 문구 고정 테스트(양성 대조 포함)

### M1-4 테스트 · 검증
- [x] init 테스트: `package.json` 없음 · 있음 · 이미 있음 · devDependencies · 포맷 보존(들여쓰기 · CRLF · BOM) · 두 번 실행 멱등 · lockfile 별 안내 · 쓸 수 없는 경우 · 자식 프로세스 0 · 기준값 불변 (33건, testplan T1)
- [x] `@axis-ds/cli` 테스트 전체 · theme add 테스트 통과 (212건, turbo `--force` 6/6, testplan T3 · T4)
- [x] 음성 대조: 수정 전 코드로 새 테스트가 실패 (변이 T8 24건 실패, 문구 되돌림 T9 위반 75줄)
- [x] 실경로 스모크: create-next-app 15.5.28 → `axis init -y` → `pnpm install` → `pnpm build` rc 0, c131ee9 CLI 로 rc 1 (AC9, testplan T10 · T11)
- [x] 커밋

### M1-5 실경로 재측정 · 배포 준비
- [x] 실경로 재측정 · 배포본 음성 대조: 이 브랜치 CLI(`--force` 빌드) `pnpm build` rc 0, npm `@axis-ds/cli@1.2.0` rc 1 (`Cannot find module 'clsx'`, testplan T13 · T14)
- [x] WI-0028 T7-2(AC2(b)) 를 이 브랜치 CLI 로 재측정: build rc 0 · import 1줄 · check brand PASS · 선택자 5건, 음성 대조군 0건 (testplan T15 · T16, WI-0028 testplan · todo T7-2 줄에 기록)
- [x] `.changeset/wi-0038-cli-init-utils-deps.md`(`@axis-ds/cli` patch), `pnpm changeset status --verbose` rc 0 · patch 1.2.1

### M1-6 보정: 쓰는 도중 실패하면 원래 내용으로 복원 (FR-4)
- [x] 재현: HEAD 7aa5e55 빌드로 `ulimit -f 1` 아래 init, `package.json` 1013B 가 1024B 로 잘리고 JSON 파손 · rc 1 (testplan T19)
- [x] `applyUtilsDependencies`: 쓰기 실패 시 `plan.write.before` 로 되돌리고 다시 읽어 확인, 복원 성공 · 실패를 오류 메시지에 담음. 쓰기 함수는 테스트용 인자로 주입 가능. init 오류 안내에 `axis.config.json` · `utils.ts` 는 이미 만들어졌다는 줄 추가
- [x] 테스트 3건(복원 성공 · 복원 실패 · 복원 내용 불일치), 수정 전 코드로 3건 모두 실패 (testplan U13 · T17 · T18)
- [x] 실경로: 수정본 빌드로 같은 절차, 복원 성공(sha 같음) · 한도보다 큰 원본은 복원 실패 안내 (T20 · T21), 성공 경로 T13 재측정 rc 0 (T22)
- [x] 커밋

### M1-7 보정: 남은 실행 안내 · Tailwind 버전별 범위 (E1 ~ E4, 2026-10-19 사용자 결정)
- [x] E1: `.claude/agents/docs-writer.md` 47행, `docs/axis-ds-implementation-plan.md` 378 ~ 389 · 663행 정정. 넓힌 스캔이 잡은 `docs/axis_ds_mcp_template_plan_v0.3.md` 86행도 D2 대로 정정
- [x] E1: `guidance.test.ts` 스캔 범위에 `.claude/agents/**` · `docs` 최상위 `*.md` 추가, 제외 근거(WI 문서 · changeset · CHANGELOG · 테스트 fixture · 수집본)를 주석으로. 정정을 되돌리면 위반 9줄로 실패 (testplan T29)
- [x] E2: `detectTailwind` · `tailwindMajorFromRange` · `selectUtilsDependencies`, 근거 한 줄 출력. `package.json` 없음 · 읽을 수 없음의 안내 명령도 같은 규칙 (prd 1.6)
- [x] E2 테스트: 설치본 4 · 3 · 잘못된 version, 선언 `^4` · `~3.4` · `^4.1.0` · `workspace:*` · `latest` · `^3 || ^4`, 없음, devDependencies 에만 있음, `package.json` 없음 · 읽을 수 없음, 이미 있음 (init 52건, testplan T24). 변이 3종으로 27 · 5 · 8건 실패 (T28)
- [x] 실경로: create-next-app 15.5.28(Tailwind 4.3.3) `^3.4.0` · build rc 0, Tailwind 3.4.19 최소 Next 프로젝트 `^2.6.0` · build rc 0 (T25 · T26)
- [x] E3 · E4: prd 1.4 · 2장, 이 문서 착수 전 결정에 기록
- [x] 커밋

### M1-8 보정: Tailwind 판정 보강 · 안내 스캔 확장 (F1 · F2, 2026-10-19 사용자 결정)
- [x] F1 (a): `tailwindMajorFromRange` 가 단순 형태가 아니면 하한의 major 를 읽음(`>=4` · `>=3.4 <4` · `4 - 4.2`). `||` · 하한 없음 · `catalog:` · `0.0.0-insiders.*` 는 판정 불가
- [x] F1 (a) · (b): `tailwindWarnings` 로 판정 불가 경고와 설치본 · 선언 불일치 경고를 근거 줄 뒤에 출력
- [x] F1 (c): major 4 이상 `^3.4.0`
- [x] F1: `init.ts` 주석 · prd 1.6 판정표의 템플릿 근거 서술을 고치고 템플릿 불일치는 WI-0037(#119)로 적음
- [x] F1 테스트 (init 64건, testplan T33), 변이 6종 각각 실패 (T34)
- [x] F2: `guidance.test.ts` 스캔 범위 · 경로별 계측 대조 · 제외 근거 주석 갱신. 계측 수 (T35), 주입 양성 대조 5/5 · HEAD 판 0/5 (T36)
- [x] 품질: 243건 통과 · lint · type-check · build `--force` rc 0 (T38)
- [x] 커밋

### M1-9 보정: 불일치 판정 오탐 · 배타 하한 (F1 (a) · (b) 보정, 2026-10-19)
- [x] 불일치 경고를 「하한 major ≠ 설치본 major」 대신 「설치본 major 가 선언 범위의 major 구간(`tailwindMajorBounds`) 밖」으로 바꿈. `>=3.4` · `>=3 <5` · `3.4 - 4` + 설치본 4.1.0 은 경고 없음, `>=3.4 <4` + 4.1.0 은 경고 (testplan T39)
- [x] 배타 하한 `>M` · `>M.x` 를 M+1 로 읽음(`>3` · `>3.x` → 4, `>4` → 5), `>3.0` · `>3.9.9` 는 3 유지. prd 1.6 의 `>4 → 4` 표기 정정
- [x] 테스트 (init 66건) · 변이 2종 각각 실패 (T40) · 실경로 3건 (T41) · 품질 245건 통과 · lint · type-check · build `--force` rc 0 (T42)
- [x] 커밋

### 이 브랜치 밖
- [ ] PR · 머지 · Version Packages PR · 배포
- [ ] 배포본(`@axis-ds/cli` 1.2.1)으로 T13 · T15 · T25 · T26 재확인
- [ ] 별도 WI(메인 세션이 등록): init 재실행 시 `axis.config.json` 덮어쓰기, `apps/web/public/library/**` 수집본의 `npx axis-cli` (E4)
