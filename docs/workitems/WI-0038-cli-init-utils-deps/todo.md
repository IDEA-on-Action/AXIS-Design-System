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
- [x] 의존성 범위 → ✅ 템플릿 4종과 같은 `clsx ^2.1.1` · `tailwind-merge ^3.4.0` (D3, prd 1.5)

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

### M1-5 뒤 단계 (이 브랜치 밖)
- [x] 실경로 재측정 · 배포본 음성 대조: 이 브랜치 CLI(`--force` 빌드) `pnpm build` rc 0, npm `@axis-ds/cli@1.2.0` rc 1 (`Cannot find module 'clsx'`, testplan T13 · T14)
- [x] WI-0028 T7-2(AC2(b)) 를 이 브랜치 CLI 로 재측정: build rc 0 · import 1줄 · check brand PASS · 선택자 5건, 음성 대조군 0건 (testplan T15 · T16, WI-0028 testplan · todo T7-2 줄에 기록)
- [x] `.changeset/wi-0038-cli-init-utils-deps.md`(`@axis-ds/cli` patch), `pnpm changeset status --verbose` rc 0 · patch 1.2.1
- [ ] PR · 머지 · Version Packages PR · 배포
- [ ] 배포본(`@axis-ds/cli` 1.2.1)으로 T13 · T15 재확인
