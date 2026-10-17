# WI-0025: 브랜드 테마 축 도입과 온톨로지 테마 TODO

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | 상태: 🔄 진행 중 (M1 완료 · 1.2.1 배포 2026-10-17, 다음 M2)

## 진행 순서

| Phase | 범위 | 릴리스 | GitHub |
|---|---|---|---|
| M1 | 트랙 A 토큰 정합 (FR-1~3) | 1.2.1 patch (tokens · ui-react · agentic-ui · theme) | #83 |
| M2 | 트랙 B 브랜드 빌드 · ThemeProvider (FR-4~6) | 1.3.0 minor | #84 |
| M3 | 트랙 C 온톨로지 프리셋 (FR-8 · FR-9) + FR-7 + a11y CI 배선 (Q7) | 1.3.0 minor | #84 |
| M4 | 문서 · 브랜드 전환 데모 (FR-10) | 1.3.0 minor | #84 |

- 배치 1: M1과 M2를 병렬로 개발 (2026-10-15 결정 D8). 겹치는 파일은 plan 3.5 충돌 표 기준 `packages/axis-tokens/build-tokens.mjs`(M2: 60줄 · 333줄 다음, B0 이동안 선택 시 34-36줄)와 `packages/axis-tokens/package.json`(M2: exports 8-22줄 · scripts 32-36줄)이며, M2 신규 파일(`scripts/brands.mjs`, `test/brands.test.mjs`, fixtures)과 `packages/axis-theme`는 M1과 겹치지 않음
- 배치 1 동안 `plan.md` · `todo.md` · `project-todo.md` 갱신은 M1 브랜치에서만 수행 (M2 브랜치는 참조만, plan 3.5)
- 머지 순서: **M1 머지 → 1.2.1 릴리스 PR 머지 · npm 배포 확인 → M2 머지** (M2 브랜치는 1.2.1 배포 후 rebase, plan 3.6)
- 배치 2: M3 → M4 순차 (M3는 M1 매핑과 M2 빌드 위에서만 성립)

---

## 착수 전 결정

> plan 각 절의 "결정 필요" 항목. 체크하지 않은 항목은 plan의 권장안으로 진행하되 해당 Phase 착수 시 재확인합니다. 괄호는 출처 절 · 번호. M1 착수 전 1~2절, M2 착수 전 3절, 해당 Phase 착수 전 4절 항목을 확정

### 1절 FR-1 정의 없는 변수 (M1)
- [x] 다크 모드 Alert 상태 변형: primitive 오타 정정 유지(다크에서도 파스텔 상자, 브랜드 미적용) vs semantic `surface-info` · `text-info` 계열 매핑(라이트 값 변경) (1.7 D-a) → ✅ 2026-10-15: semantic 매핑(surface · text-{info|success|warning|error}, border-info · border-warning · icon-info 신설)
- [ ] Progress 기본 채움 대상: `surface-brand`(다크 트랙 대비 2.84:1) vs `interactive.primary`(3.99:1), 상태 막대 라이트 대비 미달(1.55~1.84:1) 허용 여부 (1.7 D-b)
- [ ] Slider Range 라이트 대비 2.97:1 허용 여부 (썸이 3.68:1로 값 전달) (1.7 D-c)
- [x] Q2 전후 스크린샷 장소: 별도 하네스 vs `apps/web` 설정 수정(tailwind content 경로 · tokens CSS import)을 범위에 포함 (AC7 영향) (1.7 D-d) → ✅ 2026-10-15: M1은 별도 Playwright 하네스, `apps/web` 정비는 M3
- [ ] `apps/web/public/library/components/*.json` 10개 갱신 방식: 생성 스크립트 미확인 상태에서 수동 갱신 여부 (1.7 D-e)
- [ ] 온톨로지 초안의 `--axis-bg-muted`(98 · 197행) 삭제 확정 (참조 교체 시 미사용, 화면 변화 없음) (1.7 D-f)

### 2절 FR-2 agentic-ui primitive 매핑 (M1)
- [x] 기존 semantic(`icon.success` · `border.error` · `surface.brand` 등) 재사용 vs 신설 22개 (재사용 시 다크 화면 변경, 하위 호환 위반) (2.5 D-1) → ✅ 2026-10-15: 신설 22개(다크 화면 불변)
- [x] 토큰 이름 체계 확정: `-strong` · `-muted` · `-bg` · `-border` 접미사, `neutral` 범주, `agent.avatar-assistant|tool|system` 분리, 말풍선 `agent.message-user-bg` vs 별도 `message` 범주 (2.5 D-2) → ✅ 2026-10-15: plan 제안 이름 체계
- [x] `status.info`와 `status.running` 분리 유지 여부 (현재 둘 다 blue-500) (2.5 D-3) → ✅ 2026-10-15: 분리 유지
- [x] `diff.*`를 primitive 직접 참조로 둘지, `{status.*}` 별칭으로 둘지 (참조가 hex로 풀려 연쇄 안 됨) (2.5 D-4) → ✅ 2026-10-15: primitive 직접 참조
- [x] `text-white` 하드코딩 짝 처리: run-progress 163 · recovery-banner 69(버튼 글자 토큰 교체), approval-card 67 · 70, message-bubble 30 · plan-card 179 · step-timeline 76 · run-progress 127 · agent-avatar 80(짝 토큰 신설)을 FR-2 범위에 넣을지 (2.5 D-5) → ✅ 2026-10-15: 버튼 4곳(run-progress 163 · recovery-banner 69 · approval-card 67 · 70)은 M1에서 button-text 토큰으로, 나머지 5곳 짝 토큰은 M3
- [ ] 온톨로지 프리셋에 신설 22개 토큰 값 추가 여부와 라이트 AA 보정 대상 포함 여부 (FR-8 연계) (2.5 D-6)
- [ ] primitive 오버라이드 안내(`theme-customization.md` 92~97행, `component-usage.md` 175행) 동작 변경을 1.2.1 릴리스 노트에 적을지, 가이드 정정을 FR-10과 묶을지 (2.5 D-7)

### 3절 M2 브랜드 빌드 · ThemeProvider (M2)
- [x] exports 방식: 명시형 `./css/brands/ontology`(권장) vs 패턴형 `./css/brands/*`(pack-smoke 수정 필요) (3 결정 1, 사용자 판단 필수) → ✅ 2026-10-15: 명시형 확정
- [ ] `brand.json` 최종 경로(`dist/brands/<brand>/brand.json` 제안)와 목록 파일 `dist/brands/index.json` 생성 여부, WI-0028 통보 (3 결정 2)
- [x] shadcn 층 생성 방식: 브랜드 JSON `shadcn` 섹션 그대로 출력(권장) vs `buildShadcnVars` 유도 (3 결정 3, 사용자 판단 필수) → ✅ 2026-10-15: shadcn 섹션 출력 확정
- [x] 다크 선택자 수: PRD FR-5의 3개 vs 초안의 `[data-theme="dark"] [data-brand]` 포함 4개 (3 결정 4, 사용자 판단 필수) → ✅ 2026-10-15: PRD FR-5 3종 확정
- [ ] 토큰 아닌 규칙(초안 221줄 `word-break: keep-all`) 처리: 문서 안내 vs `brand.json` 부가 CSS 필드 (3 결정 5)
- [x] `setBrand(undefined)` 저장 의미: `removeItem`(AC5 문구 일치) vs "브랜드 없음" sentinel (3 결정 6, 사용자 판단 필수) → ✅ 2026-10-15: removeItem 확정
- [ ] FOUC 방지 인라인 스크립트를 theme 패키지에서 제공할지 (PRD 범위 밖) (3 결정 7)
- [ ] 브랜드 CSS import 순서 의존: 문서 안내 vs `:root[data-brand]` 명시도 상향 (3 결정 8)
- [ ] V7 "색 값" 판정 기준: 값 형식 판정 vs component 토큰 테마 무관 표지 (3 결정 9)
- [ ] `cssVarName` 공유 방식: `scripts/brands.mjs`로 이동 후 import(sha 불변 조건) vs 복제 (3 결정 10)
- [ ] 브랜드 임시 파일 위치: `dist/.tmp` + try/finally vs `os.tmpdir()` (3 결정 11)
- [ ] tokens `test` 명령 형식: `node --test test/brands.test.mjs` 파일 명시(권장), Node 20 동작 미실측 (3 결정 12)
- [ ] 브랜드 CSS와 `shadcn-compat.css` · 소비자 shadcn 정의(`apps/web` `globals.css` `@layer base`) 순서 문제 해법 (결정 8과 같은 방식) (3 결정 13)

### 4절 FR-3 참조 검사 · CI 배선
- [ ] CI a11y 서버 방식: `next dev` 유지 vs `apps/web/out` 정적 서버(`playwright.config.ts` `webServer` CI 분기) (4 결정 1, M3)
- [ ] M3 a11y와 M4 데모 선후: 브랜드 CSS import만 M3로 당길지, ontology 조합 CI 게이트를 M4 이후에 켤지 (4 결정 2, M3)
- [ ] 동적 이름 예외: 예외 없이 "판정 불가 = 실패"로 시작(권장), FR-7 · FR-9 인라인 정의 필요 시 처리 (4 결정 3, M1)
- [ ] 브랜드 CSS가 `variables.css`에 없는 이름을 덮어쓰는 오타 검사를 같은 스크립트로 확장할지 (4 결정 4, M2)
- [ ] ui-react primitive 참조(FR-1 이후 alert · progress `--axis-color-*` 19개): 판정 4를 agentic-ui 한정으로 유지할지, 후속 semantic화 (4 결정 5, M1)
- [ ] 판정 범위: `src` 한정 vs 레지스트리 · `apps/web/public/library` 추적 산출물 포함 vs 별도 일치 검사 (4 결정 6, M1)
- [ ] `publish.yml` paths에 `scripts/**` 추가 여부 (4 결정 7, M1)
- [ ] 판정 3의 주석 · JSDoc · 테스트 설명 문자열 처리 규칙 (4 결정 8, M1)

---

## Phase M1: 트랙 A 토큰 정합 (1.2.1 patch)

### M1-1 토큰 추가 (`packages/axis-tokens`)
- [x] `src/semantic/light.json` · `dark.json`에 `interactive.primary` = `{color.blue.500}` 두 벌 추가 (FR-1 · AC1)
- [x] Alert용 `border.info` · `border.warning` · `icon.info` 신설, 라이트 · 다크 값은 기존 같은 계열(`border.success|error`, `icon.success|warning|error`) 규칙을 따름 (D-a · FR-1 · AC1)
- [x] `light.json` · `dark.json` `icon` 다음에 `status` 범주 14개 추가 (running · running-strong · success · success-strong · error · error-strong · error-border · warning · warning-strong · info · neutral · neutral-muted · neutral-strong · neutral-bg, 2단 구조) (FR-2 · AC2)
- [x] 같은 위치에 `diff` 범주 4개 추가 (added · removed · added-text · removed-text) (FR-2 · AC2)
- [x] 같은 위치에 `agent` 범주 4개 추가 (avatar-assistant · avatar-tool · avatar-system · message-user-bg) (FR-2 · AC2)
- [x] `build-tokens.mjs` `typescript/axis-declarations` 하드코딩 범주에 `status` · `diff` · `agent` 추가해 `dist/js/tokens.d.ts` 정합 (FR-2)
- [x] `pnpm build` 후 `variables.css`에 신설 23개 이름 출현, 기존 223개 이름 값 불변, `shadcn-compat.css` sha256 불변 확인 (FR-1 · FR-2 · AC1)

### M1-2 ui-react 정의 누락 해소 (`packages/axis-ui-react/src`)
- [x] `alert/index.tsx`: 11행 `surface-primary` → `surface-default`, 12 · 14 · 16 · 18행 접두 누락 16개 → semantic `surface-*` · `text-*` · `border-*` · `icon-*`(info · success · warning · error) 매핑 (D-a) (FR-1 · AC1) → 아이콘은 icon 토큰 대신 `text-current`(변형 글자색)로 둠: 라이트 success 2.18:1 · warning 1.85:1 비텍스트 대비 미달 (78eca9a)
- [x] `alert/alert.test.tsx`: 17 · 24 · 25 · 31 · 32 · 38 · 39 · 45 · 46행 단언을 새 이름으로 수정 (FR-1 · AC1)
- [x] `badge/index.tsx` 13행 `bg-muted` → `surface-secondary` (FR-1 · AC1)
- [x] `badge/badge.test.tsx` 21행 단언 수정 (FR-1 · AC1)
- [x] `progress`: 26행 `brand-500` → `surface-brand`(D-b 결정 반영), 27~29행 `green|yellow|red-500` → `--axis-color-*` (FR-1 · AC1)
- [x] `checkbox` 17 · 18행: `surface-primary` → `surface-default`, `ring` → `border-focus` (20행 `interactive-primary`는 신설 토큰으로 유지) (FR-1 · AC1)
- [x] `radio-group` 27 · 28행: `surface-primary` · `ring` 교체 (30행 유지) (FR-1 · AC1)
- [x] `switch` 13행: `surface-primary` · `ring` 교체 (15행 유지) (FR-1 · AC1)
- [x] `slider` 34행: `surface-primary` 2회 · `ring` 교체 (28 · 34행 `interactive-primary` 유지) (FR-1 · AC1)
- [x] `textarea` 11 · 13 · 15행: `surface-primary` · `ring` 교체 (FR-1 · AC1)
- [x] `toggle` 7행: `surface-primary` · `ring` 교체 (FR-1 · AC1)
- [x] `sheet` 35 · 73행: `surface-primary` · `ring` 교체 (FR-1 · AC1)
- [x] `popover` 22행, `command` 16행, `dropdown-menu` 73 · 92행: `surface-primary` → `surface-default` (FR-1 · AC1)

### M1-3 agentic-ui primitive 직접 참조 교체 (`packages/axis-agentic-ui/src/*/index.tsx`)
- [x] `plan-card` 28건: 상태 색 선 · 뱃지 · 단계 아이콘 · 진행 막대 · 승인/거절 버튼 → `status.*` (FR-2 · AC2)
- [x] `run-progress` 8건: 단계 점 · 헤더 점 · 진행 막대 → `status.*`, 163행 재시도 버튼 → `--axis-button-bg-default|hover` (FR-2 · AC2)
- [x] `agent-avatar` 6건: 접속 점 → `status.*`, 아바타 배경 → `agent.avatar-*` (FR-2 · AC2)
- [x] `approval-card` 6건: 색 선 · 아이콘 → `status.info|warning|error` (FR-2 · AC2)
- [x] `diff-viewer` 6건: 줄 배경 · 글자 · 줄 수 → `diff.*` (FR-2 · AC2)
- [x] `step-timeline` 5건, `token-usage-indicator` 5건, `tool-call-card` 4건 → `status.*` (FR-2 · AC2)
- [x] `recovery-banner` 4건: 테두리 → `status.error-border`, 아이콘 → `status.error`, 69행 버튼 → `--axis-button-destructive-bg-default|hover` (FR-2 · AC2)
- [x] `feedback-buttons` 4건, `attachment-card` 2건, `code-block` 1건 → `status.*` (FR-2 · AC2)
- [x] `message-bubble` 30행 → `agent.message-user-bg` (FR-2 · AC2)
- [ ] Tailwind 불투명도 수식어(`/10` · `/30`) 유지 확인 (FR-2) → 유지는 확인했으나 Tailwind 3.4.19가 `bg-[var(..)]/10` 형태의 CSS를 만들지 않아 main부터 효과 없음(agentic 11곳). 수정 여부 결정 대기
- [x] 버튼 글자 `text-white` 4곳(run-progress 163 · recovery-banner 69 · approval-card 67 · 70) → `--axis-button-text-default` · `--axis-button-destructive-text-default` (기본값 #FFFFFF, 화면 불변) (D-5 · FR-2)
- [x] `grep -rn 'var(--axis-color-' packages/axis-agentic-ui/src` 0건 확인 (FR-2 · AC2)

### M1-4 참조 검사 스크립트 · CI (FR-3)
- [x] `scripts/check-token-refs.mjs` 작성: 판정 1 정의 누락 · 판정 2 fallback · 판정 3 동적 이름 · 판정 4 agentic-ui primitive, `--css-dir` · `--src` 옵션, `[test]` 표지, 요약 줄 (FR-3 · AC1 · AC2)
- [x] 종료 코드 0(통과) · 1(위반) · 2(측정 실패: CSS 없음 · 정의 0 · 검사 파일 0 · 참조 0) 구현, `GITHUB_ACTIONS=true`면 `::error file=…,line=…::` 출력 (FR-3)
- [x] 루트 `package.json`에 `"check-token-refs": "node scripts/check-token-refs.mjs"` 추가 (FR-3)
- [x] `frontend.yml` `ci` job 「Type check」 다음에 `pnpm check-token-refs` step 추가 (FR-3 · AC1)
- [x] `frontend.yml` push · pull_request paths에 `'scripts/**'` 추가 (FR-3)
- [ ] `publish.yml` 「Build」 다음 · 「Pack smoke」 앞에 같은 step 추가, paths `scripts/**`는 4절 결정 7 반영 (FR-3) → step 추가 완료, paths `scripts/**`는 결정 7 미결로 보류
- [x] 착수 전 상태 실행: rc 1, 위반 140건(정의 누락 60 · primitive 80) 재현 확인 (FR-3 · AC1 · AC2)
- [x] 음성 대조군: `variables.css`에서 정의 1줄 삭제한 사본(`shadcn-compat.css` 함께 복사)으로 rc 1 · 참조 위치 전수 출력 확인 (FR-3)
- [x] 판정 규칙 대조군: fixture 4건(미정의 · fallback 미정의 · 템플릿 리터럴 · agentic `--axis-color-`)이 각각 정의 누락 · 정의 누락 · 판정 불가 · primitive 참조로 잡히는지 확인 (FR-3)
- [x] 측정 실패 대조군: 없는 `--css-dir`, 빈 `--src`에서 rc 2 확인 (FR-3)
- [x] 양성 대조군: M1 수정 후 rc 0, 요약 줄 검사 파일 67 · 참조 492건 규모 확인 (FR-3 · AC1 · AC2)
- [ ] CI 배선 확인: 위반 1건 넣은 확인용 PR에서 「Token reference check」 step 실패 확인 후 되돌림 (FR-3)

### M1-5 생성 사본 재생성
- [x] `pnpm build:registry`로 `packages/axis-ui-react/registry/r` · `packages/axis-agentic-ui/registry/r` · `public/r` · `apps/web/public/r` 재생성 후 커밋 (badge.json `bg-muted` 3곳, agentic `--axis-color-` 80건 해소) (FR-1 · FR-2)
- [x] `apps/web/public/library` 재출력: axis-cli `publisher.ts` 명령 확인 후 components(ui-react 10 · agentic 6) · `categories/agentic.json` 갱신 (D-e 결정 반영) (FR-1 · FR-2) → 생성기(library collect · publish)는 외부 소스까지 재수집해 쓰지 않고, src 변경 줄을 사본의 같은 줄에 적용 (4411bd3)
- [x] 재생성 사본에서 미정의 24개 이름 · agentic `var(--axis-color-` 0건 grep 확인 (FR-1 · FR-2)

### M1-6 화면 변화 검증 (Q2)
- [x] 별도 Playwright 하네스(tokens CSS 로드)로 13개 컴포넌트 전후 스크린샷 비교, 라이트 · 다크, Tab 포커스 상태 포함 (D-d · FR-1 · Q2)
- [x] 정의 후 계산값이 plan 1.3 표 대상 값과 일치하는지 확인 (포커스 box-shadow 라이트 `rgb(59,130,246)` · 다크 `rgb(96,165,250)`) (FR-1 · AC1)
- [x] agentic-ui 13개 컴포넌트 라이트 · 다크 계산값 교체 전후 동일 확인 (FR-2 · AC2)

### M1-7 1.2.1 릴리스
- [x] `release-notes.md` 1.2.1 절: 화면 변화 컴포넌트 13개(Alert · Badge · Progress · Checkbox · RadioGroup · Switch · Slider · Textarea · Toggle · Sheet · Popover · DropdownMenu · Command), agentic-ui 화면 불변 명시 (FR-1 · Q2)
- [x] 1.2.1 릴리스 노트에 primitive 오버라이드 동작 변경 안내 (D-7 결정 시) (FR-2)
- [x] 소비 프로젝트(Minu · Discovery-X 등 `^1.2.0` 설치처) 영향 확인: 13개 컴포넌트 사용처를 찾아 1.2.1 로컬 빌드(`pnpm pack` 또는 link)로 화면 확인, patch 자동 반영으로 알림 없이 바뀌는 점을 각 프로젝트에 공지 (3.2 하위 호환 · A3) → RFP-X(1.1.2) · Discovery-X(1.1.1) 모두 정확 버전 고정이라 자동 반영 없음, 영향은 Badge secondary 8곳 · Textarea 3곳(릴리스 노트 기재). Minu는 로컬 미발견
- [x] patch changeset 1개 작성: tokens · ui-react · agentic-ui · theme 4개 직접 기재 (D5)
- [x] `pnpm changeset status --verbose`로 4개 패키지 1.2.1 확인 (D5) → 4개 1.2.1 확인(private 예제 axis-nextjs-example 0.1.4는 배포 대상 아님)
- [x] M1 PR(#83) 머지 → PR #90 squash 머지 (f465d2b)
- [x] 릴리스 PR을 다른 changeset보다 먼저 머지, publish 성공 확인 (D3) → PR #93 머지(3b52976, 2026-10-15). 그때 publish 는 NPM_TOKEN 만료로 실패했고, 다른 changeset 없이(`main`의 `.changeset/`은 `config.json`뿐) WI-0031 머지 push 의 run 38992207088(2026-10-17)에서 Trusted Publishing 으로 4개 발행 성공
- [x] `npm view @axis-ds/theme@1.2.1 dependencies` → `{ '@axis-ds/tokens': '1.2.1' }` 확인 (D5) → 2026-10-17 일치 확인(ui-react · agentic-ui 의 tokens 의존도 1.2.1)
- [x] 릴리스 노트에 라이트 Alert success · warning 테두리 대비(2.18 · 1.85:1)는 장식 요소라 비텍스트 기준 대상이 아니라는 판단 기록 (2026-10-15 결정)
- [x] 1.2.1 Breaking change 없음 확인: 공개 export · 기존 CSS 변수 이름 삭제 0건, 화면 변화는 정의 누락 보완분만 (3.2 릴리스)
- [ ] AC3 기준선 고정: 1.2.1 배포 직후 `variables.css` 라이트 · 다크 계산값 스냅샷을 tokens 테스트 fixture로 커밋 (M3 AC3 비교 기준) (AC3) → 미수행. `packages/axis-tokens/test/fixtures/`에 1.2.1 `variables.css` 스냅샷이 없습니다(있는 `variables.css`는 `dark-completeness` 판정용 합성 fixture). `apps/web/e2e/fixtures/dark-tokens-light-3b52976.json`은 라이트 component 45개만 담은 WI-0033 기준값이라 이 기준선을 대신하지 않습니다. M3 머지 전에 npm 1.2.1 산출물 기준으로 수행합니다
- [x] `CHANGELOG.md` · `project-todo.md` · `.github/wi-mapping.json` 현행화 → 패키지 4개 `CHANGELOG.md` 1.2.1 절은 PR #93 에 포함(루트 `CHANGELOG.md`는 없음). `project-todo.md` #36 완료 · 현재 버전 1.2.1 반영(2026-10-17), `wi-mapping.json` WI-0025 는 M2~M4 가 남아 🔄 유지

### M1 DoD
- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] `pnpm build` 성공 (`build:registry` 포함)
- [x] `pnpm test` 통과 (alert · badge 수정 테스트 포함), `pnpm check-token-refs` rc 0
- [ ] 문서: plan.md 1 · 2 · 4절 결정 반영, release-notes.md 1.2.1 절, todo.md 체크

---

## Phase M2: 트랙 B 브랜드 빌드 · ThemeProvider (1.3.0)

### M2-1 브랜드 빌드 (`packages/axis-tokens`)
- [x] 브랜드 소스 구조 `src/brands/<brand>/{light,dark,brand}.json` 규약 확정 (`shadcn` 최상위 예약 키, `brand.json`: name · description · themes · a11y) (FR-4)
- [x] B0 `cssVarName` 공유 (3 결정 10 반영) (FR-5)
- [x] B1 `build-tokens.mjs` 60줄 다음에 `css/axis-brand` 포맷 등록 (`file.options.selector`) (FR-5)
- [x] B2 신규 `scripts/brands.mjs`: `listBrands` · `loadBrand` · `collectBasePaths` · `validateBrand` · `renderShadcnBlock` · `brandSelectors` 순수 함수 (FR-4 · FR-5)
- [x] V8용 shadcn 변수 25개 이름: `build-tokens.mjs`에서 상수 배열로 추출해 공유(조건: `shadcn-compat.css` sha256 불변) vs 복제 중 택1 (FR-5)
- [x] `validateBrand` V1~V8 구현 (kebab-case · 파일 3종 · 기본 경로 존재 · 최상위 범위 · leaf 형태와 참조 · 변수명 충돌 · 라이트/다크 짝 · shadcn 키와 값 형식) (FR-4)
- [x] `brandSelectors`: 라이트 `[data-brand="<b>"]`, 다크 `[data-brand="<b>"].dark` · `[data-brand="<b>"][data-theme="dark"]` · `.dark [data-brand="<b>"]` (3 결정 4 반영) (FR-5)
- [x] B3 333줄 다음 5단계: 검증 실패 시 exit 1, SD 인스턴스 2개(다크에도 component 포함, `transformGroup: 'css'`, 브랜드 경로 필터), `dist/css/brands/<brand>.css` 출력 (FR-5 · AC4)
- [x] B3 ⑤ `src/brands/<brand>/brand.json` → `dist/brands/<brand>/brand.json` 복사 (D6 · FR-5)
- [x] B3 임시 파일 정리 (try/finally 또는 dist 밖, 3 결정 11 반영) (FR-5)
- [x] B4 브랜드 SD 인스턴스 `log: { verbosity: 'silent' }` (FR-5)
- [x] B5 `src/brands/*`마다 `package.json` exports 항목 존재 검사, 누락 시 빌드 실패 (3 결정 1 반영) (FR-5 · AC4)
- [x] 기존 1~4단계 무변경: M1 반영 기준선 대비 `variables.css` · `shadcn-compat.css` sha256 동일 확인 (AC3 · NFR 번들 크기)
- [x] 미사용 `build-tokens.js`는 수정하지 않음 확인 (FR-5)

### M2-2 tokens 테스트
- [x] B6 `packages/axis-tokens/package.json`에 `test` 스크립트 추가 (3 결정 12 반영) (FR-4 · FR-5)
- [x] 신규 `test/brands.test.mjs`: V1~V8 양성 · 음성 fixture (`test/fixtures/brands/`, dist 미의존) (FR-4 · FR-5)
- [ ] CI(Node 20)에서 `pnpm test`가 tokens `test`를 실제 실행하는지 로그로 확인 (미실측 축) (FR-4)

### M2-3 ThemeProvider brand (`packages/axis-theme/src/index.ts`)
- [x] `ThemeProviderProps`에 `defaultBrand?: string` · `brandStorageKey?: string`(기본 `"axis-brand"`) 추가 (FR-6 · AC5)
- [x] `ThemeContextValue`에 `brand` · `setBrand` 추가, `value` · deps 반영 (FR-6 · AC5)
- [x] `readBrand` · `writeBrand` 헬퍼 (window 가드 · try/catch · 빈 문자열 = undefined) (FR-6)
- [x] brand 상태 초기화 (저장값 우선, SSR 가드) (FR-6 · AC5)
- [x] `[brand]` 의존 effect로 `data-brand` set/remove, 기존 theme effect · 시스템 감지 effect 무변경 (FR-6 · AC5)
- [x] `setBrand`: undefined면 `removeItem` (3 결정 6 반영) (FR-6 · AC5)
- [x] `theme.test.tsx` `beforeEach`에 `removeAttribute("data-brand")` 추가 (FR-6)
- [x] `describe("brand")` 7건: defaultBrand 부착 · 미지정 시 없음 · setBrand 저장 · setBrand(undefined) 삭제 · 저장값 복원 · 커스텀 storageKey · setTheme 비간섭 (FR-6 · AC5)
- [x] 신규 `src/theme.ssr.test.tsx` (`@vitest-environment node`, `renderToString` 무예외) (FR-6)
- [x] 기존 theme 테스트 21건 회귀 없음 (FR-6)

### M2-4 머지 절차
- [ ] 1.2.1 publish 확인 후 M2 브랜치 rebase (D3)
- [ ] 머지 전 `npm view @axis-ds/tokens version` = `1.2.1`, `main`의 `.changeset/`에 patch 잔여 없음 확인 (D3)
- [ ] 1.2.1 배포 전 머지 시 changeset 없이 머지 (minor changeset은 M4에서 추가) (D3)
- [ ] `brand.json` 최종 경로를 WI-0028에 통보 (D6)

### M2 DoD
- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] `pnpm build` 성공 (브랜드 0개 상태에서도 정상)
- [x] `pnpm test` 통과 (tokens · theme)
- [ ] 문서: plan.md 3절 결정 반영, todo.md 체크

---

## Phase M3: 트랙 C 온톨로지 프리셋 + FR-7 + a11y CI (1.3.0)

- [ ] **M3 착수 게이트**: 부록 B 라이트 AA 보정 내역 디자인 오너 승인 (Q6 제품 화면 적용 여부 포함) (D1 · FR-8 · AC8)
- [ ] 흰 글자 짝 토큰 신설과 교체: message-bubble 30 · plan-card 179 · step-timeline 76 · run-progress 127 · agent-avatar 80 (예: `agent.message-user-text`, `status.*-contrast`, `agent.avatar-text`, 기본값 #FFFFFF) (D-5 · FR-8)
- [ ] 불투명도 수식어 결함 수정: agentic-ui 11곳(plan-card 6 · diff-viewer 2 · feedback-buttons 2 · attachment-card 1)의 `bg-[var(..)]/10` · `border-[var(..)]/30`을 `color-mix()` 형태로 교체해 의도된 옅은 바탕 복원(화면 변화, 1.3.0 릴리스 노트 기재), `check-token-refs`에 CSS 미생성 패턴 검출 추가 (2026-10-15 결정)
- [ ] FR-7 PlanCard 색 선 두께 component 토큰 `--axis-plan-card-accent-width`(기본 4px) 신설과 plan-card 참조 변경, 기본 화면 불변 (FR-7 · AC3)
- [ ] FR-9 그림자 primitive `--axis-shadow-sm` · `--axis-shadow-lg` 신설 (기본값 = Tailwind `shadow-sm` · `shadow-lg`) (FR-9 · AC3)
- [ ] FR-9 Card(`shadow-sm`) · Dialog(`shadow-lg`) 하드코딩을 그림자 변수 참조로 변경, 기본 화면 불변 (FR-9 · AC3)
- [ ] FR-8 `src/brands/ontology/light.json` · `dark.json` 작성 (초안 `axis-theme-ontology.css` 이식, `bg-muted` 줄 제외, 신설 22개 status · diff · agent 값은 D-6 결정 반영) (FR-8 · AC6)
- [ ] FR-8 `shadcn` 섹션 이식 (`--radius: 12px` 포함) (FR-8 · AC6)
- [ ] FR-9 글꼴 `font.family.sans|mono`, 둥글기 `radius.sm|md|lg`, 그림자, `plan-card` accent width `0` 지정 (FR-9)
- [ ] `src/brands/ontology/brand.json` 작성 (a11y 상태 기록) (FR-4 · D6)
- [ ] `package.json` exports에 `./css/brands/ontology` · `./brands/ontology/brand.json` 추가 (FR-5 · AC4)
- [ ] AC4: `pnpm build` 후 `dist/css/brands/ontology.css` 생성, `import "@axis-ds/tokens/css/brands/ontology"` 동작, `pnpm pack-smoke` 통과 (AC4)
- [ ] AC3 스냅샷 테스트: 브랜드 미지정 `variables.css` 라이트 · 다크가 1.2.1과 일치, 신규 변수는 기본값만 검사 (AC3)
- [ ] AC6 Playwright 계산 스타일 검사: `data-brand="ontology"` 라이트 · 다크 7개 변수가 부록 A와 일치 (shadcn HSL은 원문 비교 또는 rgb ±1) (AC6)
- [ ] `apps/web`이 AXIS 토큰 색을 그리도록 설정 정비 (`tailwind.config.ts` content 경로, tokens CSS import, `globals.css` shadcn 정의와 브랜드 CSS 순서, D-d · 3 결정 13 반영). M4에서 M3로 당김: 이 정비 없이 a11y를 돌리면 브랜드 값이 화면에 닿지 않은 채 통과함 (AC8 · FR-10)
- [ ] `apps/web`에서 브랜드 CSS 로드 (4 결정 2 반영) (AC8)
- [ ] ontology 라이트 · 다크 비텍스트 대비 측정: 포커스 링 · 의미 아이콘 3:1 이상 (axe는 비텍스트 대비를 판정하지 않음) (3.2 접근성)
- [ ] `apps/web/e2e/a11y.spec.ts`에 브랜드 축 추가: 기본 · ontology × 라이트 · 다크 × 9페이지 = 36건, ontology는 `addInitScript`로 `data-brand` 부착 (AC8)
- [ ] Q7 CI 배선: `frontend.yml` 「Build」 다음에 Playwright 캐시 · `playwright install --with-deps chromium` · `test:e2e:a11y` · 실패 시 `test-results` 업로드 (4 결정 1 서버 방식 반영) (AC8 · Q7)
- [ ] AC8: 4조합 axe 위반 0, 온톨로지 전용 예외 0 (CI 결과로 확인) (AC8)
- [ ] 레지스트리 · library 사본 재생성 (Card · Dialog · PlanCard 변경분) (FR-7 · FR-9)
- [ ] M3 PR 머지 전 `npm view @axis-ds/tokens version` = `1.2.1`, `main`의 `.changeset/`에 patch 잔여 없음 확인 (D3 · plan 3.6)

### M3 DoD
- [ ] `pnpm type-check` 통과
- [ ] `pnpm lint` 통과
- [ ] `pnpm build` 성공
- [ ] `pnpm test` 통과, `test:e2e:a11y` 36건 통과, `pnpm check-token-refs` rc 0
- [ ] 문서: 부록 B 승인 기록, todo.md 체크

---

## Phase M4: 문서 · 브랜드 전환 데모 (FR-10, 1.3.0)

- [ ] FR-10 `apps/web` 브랜드 전환 데모: `document.documentElement`에 `data-brand` 직접 부착 · 제거, 다크는 `next-themes` `.dark` 유지 (FR-10 · AC7)
- [ ] M4 PR 머지 전 1.2.1 배포 · patch changeset 잔여 없음 재확인 (D3 · plan 3.6)
- [ ] AC7: Button · Card · Input · Badge · Alert · PlanCard · MessageBubble 데모가 브랜드 · 테마 전환에 함께 바뀌는지 확인 (AC7)
- [ ] FR-10 `docs/guides/theme-customization.md`에 「브랜드 테마」 절 추가 (import 순서 안내 포함) (FR-10)
- [ ] FR-10 같은 문서 「4. 커스텀 테마 생성」 예시를 브랜드 디렉터리 방식으로 갱신, primitive 오버라이드 안내(92~97행) · `component-usage.md` 175행 정정 (D-7 반영) (FR-10)
- [ ] FR-10 부록 B 원본 대비 보정 내역 문서 게재 (FR-10 · D1)
- [ ] `release-notes.md` 1.3.0 절 작성 (브랜드 축 · ontology 프리셋 · 신규 변수 기본값 불변 명시)
- [ ] 1.2.1 배포 확인 후 minor changeset 작성 (tokens · theme · ui-react · agentic-ui) (D3)
- [ ] 1.3.0 Breaking change 없음 확인: 브랜드 미지정 시 기존 변수 계산값 불변(AC3), 공개 API 추가만 (3.2 릴리스)
- [ ] 1.3.0 릴리스 PR에서 linked 4개 1.3.0 확인 후 머지, `pack-smoke` 브랜드 exports 통과, npm 배포 확인 (D3)
- [ ] `CHANGELOG.md` · `project-todo.md` · `.github/wi-mapping.json` 현행화, #84 close

### M4 DoD
- [ ] `pnpm type-check` 통과
- [ ] `pnpm lint` 통과
- [ ] `pnpm build` 성공 (`build:web` 포함)
- [ ] `pnpm test` 통과, 기존 E2E 회귀 0
- [ ] 문서: theme-customization.md · release-notes.md 1.3.0 · testplan.md 결과 기록, todo.md 체크
