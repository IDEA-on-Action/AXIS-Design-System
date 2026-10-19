# WI-0036: mcp 레지스트리 도구 데이터 경로 결함(ENOENT) 수정 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | 상태: 🔄 진행 (2026-10-19 구현 · 검증 완료, PR 대기)

## 진행 순서

| Phase | 범위 | 릴리스 | GitHub |
|---|---|---|---|
| M1 | 데이터 복사 위치 수정 · 실행 스모크 · changeset · PR CI 배선 (FR-1~5) | `@axis-ds/mcp` 1.1.5 (patch) | #115 |

- `project-todo.md` 와 `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다(PR #112 담당)

---

## 착수 전 결정

> 2026-10-19 사용자 결정. prd 1.4 표와 같습니다.

- [x] WI-0028 범위와 분리, 별도 patch → ✅ 2026-10-19 (D1)
- [x] 수정 방식: 경로 기준 변경 vs 번들 옆 복사 → ✅ 번들 옆 복사(`dist/data`) (D2)
- [x] 스모크: tarball 설치 · stdio 실행 · 도구 호출, pack-smoke 에 연결 (D3)
- [x] PR CI(`frontend.yml`)에서도 pack-smoke 실행 → ✅ 2026-10-19 (D4)

---

## Phase M1

### M1-1 원인 실측
- [x] 소스 경로 기준(`src/registry/loader.ts`), tsup 번들 출력(`dist/index.js` 단일), `copy-data` 대상, `files` 확인 (prd C1~C3)
- [x] 다른 도구의 데이터 경로 전수 확인: 레지스트리 6개, 템플릿 4개 원격, check_project · 프롬프트 5개 인자 디렉터리 (prd C4 · C6)
- [x] 배포본 1.1.0~1.1.4 tarball 확인, 첫 배포부터 결함 (prd C5)

### M1-2 수정
- [x] `copy-data` 대상 `dist/registry/data` → `dist/data` (FR-1)
- [x] 수정 후 tarball 에 `dist/data/{components,tokens}.json` (AC1)

### M1-3 스모크
- [x] `scripts/mcp-smoke.mjs` 추가, tarball 인자 또는 로컬 pack (FR-2)
- [x] `scripts/pack-smoke.mjs` 에 연결, 미수행 시 실패 (FR-3)
- [x] 양성: 수정 후 `node scripts/pack-smoke.mjs` rc 0, tools/list 16개 · 호출 6건 (AC2)
- [x] 음성: 1.1.4 · 1.1.3 · 1.1.0 배포본, 수정 전 HEAD 빌드, 수정을 되돌린 pack-smoke 경로 모두 rc 1 · 6건 isError (AC3)
- [x] 단언 보강: search_components 기대값을 결과 행 `` (`button`) `` 으로, install_component 는 설치 파일 생성 확인, `npm install` 300초 timeout. 변이 3종으로 실패 확인 (testplan T5~T7)

### M1-4 릴리스 준비
- [x] `.changeset/wi-0036-mcp-data-path.md` (`@axis-ds/mcp` patch) (FR-4 · AC4)
- [x] `pnpm build --force` · `pnpm type-check --force` · `pnpm lint --force` rc 0 (AC5)
- [ ] PR 생성 · 머지
- [ ] 배포 후 `npm pack @axis-ds/mcp@1.1.5` 로 `node scripts/mcp-smoke.mjs <tgz>` 재확인

### M1-5 PR CI 배선 (D4 · FR-5)
- [x] 전제 확인: `ci` job 은 Pack smoke 전에 `pnpm build`(turbo, 퍼블리시 대상 6개 + web)를 돌리고, turbo `build` outputs 에 `dist/**` 가 있어 캐시 적중이어도 dist 가 복원됩니다. 트리거 paths 에 `packages/**` · `scripts/**` 가 이미 있습니다. Node 20(`setup-node`), npm 은 그 번들본입니다
- [x] `frontend.yml` `ci` job 끝(Upload build artifact 다음)에 `pnpm pack-smoke` step 추가, `continue-on-error` · `|| true` 없음
- [x] CI 순서 로컬 실행 rc 0, `EXPECTED_TOOLS` 변이 rc 1, Node 20 rc 0, 빈 npm 캐시 rc 0, actionlint 추가 지적 0건 (testplan T10~T14)
- [x] #107(M3) · #110(M4) · #118(WI-0035) 와 `git merge-tree` 충돌 없음, #118 병합 트리에서 pack-smoke + pack-install-smoke rc 0 (testplan T15 · T15a · T16 · T17)
- [ ] PR #116 CI run 에서 Pack smoke step 통과와 소요 시간 확인 (AC6)
- [ ] #107 과 합쳐지면 `ci` job 에 Pack smoke step 이 2개가 됩니다(M3(#107, 64392e6)가 넣은 AC4 step 은 Build 다음, 이 WI 의 step 은 job 끝. #110(M4)은 M3 의 step 을 물려받았을 뿐입니다). #107 과 이 PR 만 머지돼도 생기므로, 나중에 머지되는 쪽에서 하나로 합칠지 결정이 필요합니다

---

## 후속

- [ ] WI-0028 prd 1장의 「빌드 때 `dist/registry/data`로 복사」 문구를 이 수정에 맞게 고칠지 결정
- [x] ~~PR CI(`frontend.yml`)에서도 pack-smoke 를 돌릴지 결정~~ → ✅ 2026-10-19 돌린다(D4, M1-5)
- [ ] **WI-0028 머지 시 `scripts/mcp-smoke.mjs` `EXPECTED_TOOLS` 에 `axis.list_brands` · `axis.get_brand` 추가 필수**. 스모크는 `tools/list` 를 1:1 로 보고 목록 밖 도구도 실패로 칩니다. 이 WI 머지 뒤에는 안 고치면 WI-0028 PR 의 CI(Pack smoke)가 실패합니다(M1-5)
- [ ] WI-0028 plan 1.2(36행) · testplan T5-6(84행)의 「pack-smoke 는 서버를 실행하지 않는다」 전제를 이 WI 머지에 맞게 고치고, WI-0028 plan · todo 에 `EXPECTED_TOOLS` 갱신 항목 추가(WI-0028 브랜치 담당)
