# WI-0035: tokens ESM 진입점 문법 오류 수정 TODO

> PRD: [prd.md](./prd.md) | 상태: 🔄 진행 (2026-10-19 구현 · 검증 완료, PR 대기)

## 진행 순서

| Phase | 범위 | 릴리스 | GitHub |
|---|---|---|---|
| M1 | ESM 포맷 수정 · 설치 스모크 · 회귀 테스트 · changeset (FR-1~6) | `@axis-ds/tokens` 1.2.2 (patch) | #113 |

- 브랜치: `fix/wi-0035-tokens-esm` (기준 main e690905)
- `project-todo.md` · `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다(PR #112 담당)

---

## 착수 전 결정

- [x] 1.3.0 포함 vs 별도 patch 선배포 → ✅ 2026-10-19: 별도 patch 1.2.2 선배포 (D1)
- [x] 수정 방식 → ✅ 포맷에서 TS 전용 두 줄만 제거, `.d.ts` 불변 (D2)
- [ ] linked · 의존 패키지 동반 bump 수용 여부 → 사용자 확인 대기 (아래 M1-5)

---

## Phase M1

### M1-1 원인 실측
- [x] `tokens.mjs` 생성 위치: `build-tokens.mjs` 커스텀 포맷 `typescript/axis-module`, 최초 커밋 f57de7d 부터 (C1)
- [x] CJS · `.d.ts` 생성과 비교: 내장 `javascript/module-flat` · 커스텀 `typescript/axis-declarations`, TS 전용 문법 없음 (C2)
- [x] npm 배포본 6개(1.1.0~1.2.1) 전부 import 실패, 1.2.1 배포본 = e690905 빌드 (C3)

### M1-2 수정과 산출물 비교
- [x] 수정 전 기준선: e690905 `turbo run build --filter=@axis-ds/tokens --force` (rc 0, cached 0/1), dist 10개 sha256 저장
- [x] 포맷에서 ` as const` · `export type Tokens` 제거 (FR-1)
- [x] 수정 뒤 `--force` 빌드 sha256 diff: `js/tokens.mjs` 1개만 변경, `css/variables.css` · `css/shadcn-compat.css` · `tokens.js` · `tokens.json` · `tokens.d.ts` · tailwind 4개 동일 (FR-2)
- [x] 새 `tokens.mjs` = 1.2.1 배포본에서 TS 전용 두 줄만 걷어낸 파일 (`cmp` rc 0)
- [x] 값 동등: ESM 평면화 249개 = `tokens.js` 249개 = `tokens.json` (깊은 동등 PASS). 원형 그대로의 깊은 동등은 모양 차이(중첩 대 평면)로 성립하지 않음 (FR-3)

### M1-3 설치 스모크 (FR-4)
- [x] `scripts/pack-install-smoke.mjs` 추가, 루트 `pack-smoke` 뒤에 연결
- [x] 수정본: 런타임 8건 통과 + types(`.` · `./tailwind`) tsc rc 0, 스모크 rc 0
- [x] 음성 대조: e690905 사본 빌드 tarball → `.` import `Unexpected identifier 'as'` 1건, rc 1. npm 1.2.1 tarball 도 rc 1
- [x] 공개 타입: 수정 전후 tarball 의 `tokens.d.ts` sha256 동일(0993bd72dbb0), tsc 선언 출력 diff rc 0
- [x] `pnpm pack-smoke` 전체 rc 0 (6개 패키지 pack 검증 + tokens 설치 스모크)

### M1-4 테스트 (FR-5)
- [x] `test/js-entry.test.mjs` 4건 추가, `test` 스크립트에 등록
- [x] 음성 대조: 포맷에 ` as const` 를 되살리면 4건 중 3건 실패(rc 1), 원복 뒤 sha 동일 확인
- [x] tokens `turbo run test type-check lint --force`: rc 0, cached 0/3, tests 73 (기존 69 + 4), fail 0, skipped 0

### M1-5 changeset (FR-6)
- [x] `.changeset/wi-0035-tokens-esm-entry.md` (`@axis-ds/tokens` patch)
- [x] `pnpm changeset status --verbose`: tokens 1.2.2, ui-react · agentic-ui · theme 1.2.2, axis-nextjs-example 0.1.5 (전부 patch)
- [ ] 동반 bump 수용 여부 확인 (ui-react · agentic-ui · theme 는 `dependencies` 에 `workspace:*` 라 배포본이 `"@axis-ds/tokens": "1.2.1"` 정확 고정. tokens 만 올리면 이 세 패키지 사용자는 수정본을 받지 못함)

### M1-6 마무리
- [ ] PR 생성 · 리뷰 · main 머지
- [ ] publish.yml 실행 뒤 npm 1.2.2 배포본으로 설치 스모크 재실행(`--tarball`)

---

## 후속 (backlog)

- tailwindcss 4 와 TypeScript `node16` 조합에서 `@axis-ds/tokens/tailwind` 타입 import 가 TS1479 로 실패합니다(peer 범위 `>=3.0.0` 그대로 설치했을 때 관측, 3.4.19 에서는 통과). 별도 WI 후보
- `.d.ts` 의 `export =` 와 ESM 런타임 export 정합 검토
- 설치 스모크 대상 확대(ui-react · agentic-ui · theme · cli · mcp), PR CI 에서 pack-smoke 실행
- 루트 `scripts/pack-smoke.mjs` 의 미사용 `statSync` import(eslint no-unused-vars 1건, 루트 scripts 는 lint 대상 밖)
