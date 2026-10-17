# WI-0025: 브랜드 테마 축 도입과 온톨로지 테마 TODO

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | 상태: 🔄 진행 중 (M1 · M2 완료, 1.2.1 배포 2026-10-17, M3 진행 중)

## 진행 순서

| Phase | 범위 | 릴리스 | GitHub |
|---|---|---|---|
| M1 | 트랙 A 토큰 정합 (FR-1~3) | 1.2.1 patch (tokens · ui-react · agentic-ui · theme) | #83 |
| M2 | 트랙 B 브랜드 빌드 · ThemeProvider (FR-4~6) | 1.3.0 minor | #84 |
| M3 | 트랙 C 온톨로지 프리셋 (FR-8 · FR-9) + FR-7 + a11y CI 배선 (Q7) | 1.3.0 minor | #84 |
| M4 | 문서 · 브랜드 전환 데모 (FR-10) | 1.3.0 minor | #84 |

- 배치 1: M1과 M2를 병렬로 개발 (2026-10-15 결정 D8). 겹치는 파일은 plan 3.5 충돌 표 기준 `packages/axis-tokens/build-tokens.mjs`(M2: 60줄 · 333줄 다음, B0 이동안 선택 시 34-36줄)와 `packages/axis-tokens/package.json`(M2: exports 8-22줄 · scripts 32-36줄)이며, M2 신규 파일(`scripts/brands.mjs`, `test/brands.test.mjs`, fixtures)과 `packages/axis-theme`는 M1과 겹치지 않음
- 배치 1 동안 `plan.md` · `todo.md` · `project-todo.md` 갱신은 M1 브랜치에서만 수행 (M2 브랜치는 참조만, plan 3.5)
- 머지 순서: **M1 머지 → 1.2.1 릴리스 PR 머지 · npm 배포 확인 → M2 머지** (M2 브랜치는 1.2.1 배포 후 `main`을 반영합니다. force push 금지라 rebase 대신 merge, plan 3.6)
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
- [x] 온톨로지 초안 2의 `--axis-bg-muted`(96 · 197행) 삭제 확정 (참조 교체 시 미사용, 화면 변화 없음) (1.7 D-f) → ✅ 2026-10-17: 이식에서 제외 확정. 초안 2의 실제 행은 97 · 198행(24행 추가 뒤)이고 변수명으로 제외했어요. ontology JSON에 `bg.muted`를 다시 넣으면 V3 · V6 위반으로 빌드 rc 1(음성 대조), 브랜드 테스트도 부재를 단언해요

### 2절 FR-2 agentic-ui primitive 매핑 (M1)
- [x] 기존 semantic(`icon.success` · `border.error` · `surface.brand` 등) 재사용 vs 신설 22개 (재사용 시 다크 화면 변경, 하위 호환 위반) (2.5 D-1) → ✅ 2026-10-15: 신설 22개(다크 화면 불변)
- [x] 토큰 이름 체계 확정: `-strong` · `-muted` · `-bg` · `-border` 접미사, `neutral` 범주, `agent.avatar-assistant|tool|system` 분리, 말풍선 `agent.message-user-bg` vs 별도 `message` 범주 (2.5 D-2) → ✅ 2026-10-15: plan 제안 이름 체계
- [x] `status.info`와 `status.running` 분리 유지 여부 (현재 둘 다 blue-500) (2.5 D-3) → ✅ 2026-10-15: 분리 유지
- [x] `diff.*`를 primitive 직접 참조로 둘지, `{status.*}` 별칭으로 둘지 (참조가 hex로 풀려 연쇄 안 됨) (2.5 D-4) → ✅ 2026-10-15: primitive 직접 참조
- [x] `text-white` 하드코딩 짝 처리: run-progress 163 · recovery-banner 69(버튼 글자 토큰 교체), approval-card 67 · 70, message-bubble 30 · plan-card 179 · step-timeline 76 · run-progress 127 · agent-avatar 80(짝 토큰 신설)을 FR-2 범위에 넣을지 (2.5 D-5) → ✅ 2026-10-15: 버튼 4곳(run-progress 163 · recovery-banner 69 · approval-card 67 · 70)은 M1에서 button-text 토큰으로, 나머지 5곳 짝 토큰은 M3
- [x] 온톨로지 프리셋에 신설 22개 토큰 값 추가 여부와 라이트 AA 보정 대상 포함 여부 (FR-8 연계) (2.5 D-6) → ✅ 2026-10-16 재결정: 접기 매핑으로 추가(plan 2.5 D-6 「2026-10-16 결정」). 배경: 초안 2는 상태를 무채색 · `key` · `bad` 세 계열로 접고(PRD FR-8 · Q8) 부록 B가 `sub` 1개 값 보정 + 미달 쌍 처리로 바뀌어, 질문이 "22개 값을 접기 매핑으로 추가할지, 흰 글자 짝 토큰(D-5 M3분)과 어떻게 맞출지"로 바뀜
- [ ] primitive 오버라이드 안내(`theme-customization.md` 92~97행, `component-usage.md` 175행) 동작 변경을 1.2.1 릴리스 노트에 적을지, 가이드 정정을 FR-10과 묶을지 (2.5 D-7)

### 3절 M2 브랜드 빌드 · ThemeProvider (M2)
- [x] exports 방식: 명시형 `./css/brands/ontology`(권장) vs 패턴형 `./css/brands/*`(pack-smoke 수정 필요) (3 결정 1, 사용자 판단 필수) → ✅ 2026-10-15: 명시형 확정
- [x] `brand.json` 최종 경로(`dist/brands/<brand>/brand.json` 제안)와 목록 파일 `dist/brands/index.json` 생성 여부, WI-0028 통보 (3 결정 2) → ✅ 2026-10-17: A안(plan U24). `dist/brands/<b>/brand.json` 유지 + `dist/brands/index.json`(exports `./brands`) 생성, B5가 `./brands` 누락을 막아요. WI-0028 통보는 plan 3절 결정 2의 「WI-0028 통보」 메모(WI-0028 본문은 고치지 않음)
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
- [x] `publish.yml` paths에 `scripts/**` 추가 여부 (4 결정 7, M1) → ✅ 2026-10-18 추가로 결정(M3 2차 결정 14 권장안). `pack-smoke` · `guard-pnpm-publish`는 publish 경로에서만 돌아 scripts만 바뀐 push가 어디서도 검증되지 않았고, 개별 파일 경로는 파일이 늘면 다시 낡아요
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
- [x] `publish.yml` 「Build」 다음 · 「Pack smoke」 앞에 같은 step 추가, paths `scripts/**`는 4절 결정 7 반영 (FR-3) → step 추가 완료, paths `scripts/**`는 결정 7 미결로 보류 → ✅ 2026-10-18 `publish.yml` push paths에 `scripts/**` 추가(결정 7)
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
- [x] AC3 기준선 고정: 1.2.1 배포 직후 `variables.css` 라이트 · 다크 계산값 스냅샷을 tokens 테스트 fixture로 커밋 (M3 AC3 비교 기준) (AC3) → 2026-10-17 수행. 원천은 npm `@axis-ds/tokens@1.2.1` tarball(shasum `2332e344…2f5b` = `npm view dist.shasum`)의 `package/dist/css/variables.css` · `shadcn-compat.css` 원문을 `cp`로 고정했어요(`packages/axis-tokens/test/fixtures/baseline-1.2.1/`, 출처 · sha256 · 신규 변수 기본값은 같은 폴더 `SOURCE.json`). U12 문구의 3b52976 빌드 대신 배포본을 쓴 것은 AC3 정의가 '1.2.1 스냅샷과 일치'이고 1.2.1 이 WI-0033 포함 main 에서 발행됐기 때문이에요. `variables.css` 1.2.1 에는 `var(` 0건이라 텍스트 값 비교가 계산값 비교와 같아요(테스트가 `var(` 를 만나면 실패)
- [x] `CHANGELOG.md` · `project-todo.md` · `.github/wi-mapping.json` 현행화 → 패키지 4개 `CHANGELOG.md` 1.2.1 절은 PR #93(버전 절)과 PR #101(WI-0033 줄)에 포함(루트 `CHANGELOG.md`는 없음). `project-todo.md` #36 완료 · 현재 버전 1.2.1 반영(2026-10-17), `wi-mapping.json` WI-0025 는 M2~M4 가 남아 🔄 유지

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
- [x] 1.2.1 publish 확인 후 M2 브랜치에 `main` 반영(rebase 또는 merge, force push 금지 시 merge) (D3 · plan 3.6) → ✅ 2026-10-17: force push 금지라 rebase 대신 `origin/main`(014e8ac) merge(0151d6a). 병합 커밋 제목의 type `merge`는 06-sync 타입 목록 밖이지만, amend · force push 금지라 고치지 않고 허용 예외로 둡니다. 충돌은 tokens `package.json` `test` 줄 1곳. WI-0033 plan.md 6장대로 `build-brands.mjs` `renderTheme`에 다크 preprocessor 배선, 브랜드 미지정 `variables.css` `:root` · `.dark` 블록이 014e8ac 빌드와 바이트 동일
- [x] 머지 전 `npm view @axis-ds/tokens version` = `1.2.1`, `main`의 `.changeset/`에 patch 잔여 없음 확인 (D3) → ✅ 2026-10-17: `1.2.1`, `.changeset/`는 `config.json`만 있음
- [ ] 1.2.1 배포 전 머지 시 changeset 없이 머지 (minor changeset은 M4에서 추가) (D3)
- [x] `brand.json` 최종 경로를 WI-0028에 통보 (D6) → ✅ 2026-10-17: plan 3절 결정 2 「WI-0028 통보」 메모로 기록(목록 · 메타 · CSS 세 경로와 스키마). WI-0028 착수 때 그 WI의 PRD FR-1에 옮겨요

### M2 DoD
- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] `pnpm build` 성공 (브랜드 0개 상태에서도 정상)
- [x] `pnpm test` 통과 (tokens · theme)
- [ ] 문서: plan.md 3절 결정 반영, todo.md 체크

---

## Phase M3: 트랙 C 온톨로지 프리셋 + FR-7 + a11y CI (1.3.0)

- [x] **M3 착수 게이트**: 부록 B(2026-10-16, v0.24 · 디자인 시스템 v1 기준) 디자인 오너 김정원 책임 승인. 승인 범위: ① 라이트 보조 · 흐린 글자 `sub` #6B7280 → #5F6673 1개 값 보정 ② 미달 쌍 처리(`key`/`key-light` → brand · info 글자는 `key-dark`, `muted`는 글자에 쓰지 않음, `bad-line` 주의 점은 warning 아이콘에만) ③ 라이트 입력 테두리 `line-2`/`card` 1.40:1 원본 유지 여부 ④ Q6 제품 화면 적용 여부 (D1 · FR-8 · AC8) → ✅ 2026-10-16 사용자(Sinclair Seo) 대리 승인, 디자인 오너(김정원 책임) 사후 확인 대기. 권장안 전부(③ 입력 테두리 원본 유지 + 포커스 key, ④ 제품 적용, ⑤ PlanCard 색 선 1px, ⑥ 상태 색 접기)
- [ ] **디자인 오너 사후 확인 목록** (2026-10-17 사용자 결정: 부록 B와 이번에 정한 화면 색 결정을 함께 확인받습니다. 값이 바뀌면 plan 5.3 표 · `src/brands/ontology/{light,dark}.json` · 초안 `axis-theme-ontology.css` · `test/ontology-pairs.mjs`를 함께 고칩니다) (D1 · FR-8 · AC8)
  - [ ] 부록 B ①~⑥ (`sub` 보정, 미달 쌍 처리, 라이트 입력 테두리 원본 유지 + 포커스 `key`, 제품 화면 적용, PlanCard 색 선 1px, 상태 색 접기)
  - [ ] warning 단계 (plan U25): 바탕 역할(`surface.warning` · `badge.warning.bg`)은 `bad-light`, 표식 · 글자(`status.warning`)는 `bad`, 강조(`status.warning-strong`)는 `bad-dark`
  - [ ] 에이전트 아바타 3색 (plan U25): tool = `key`, assistant = `ink-2`, system = `sub`(라이트 `sub-aa`), 글자 `on-key`
  - [ ] Dialog overlay (plan U25): v1 팔레트에 오버레이 색이 없어 기본값 `rgba(0, 0, 0, 0.5)`를 라이트 · 다크에 명시
  - [ ] 부록 B 승인 범위에 맞추려고 바꾼 값 (D2): destructive 버튼 hover · active 바탕 `bad-line` → `bad-light`(hover 때 바탕 변화가 없어짐), Alert warning 테두리(`border.warning`)와 `status.error-border` `bad-line` → `bad`, 비활성 버튼 글자(`button.text.disabled`) `muted` → `sub-aa`
  - [ ] 초안 역반영 (plan U18): 초안 2에 없던 42개 값을 `axis-theme-ontology.css`에 추가하고 머리말에 사후 확인 대기를 적음
- [x] M3 브랜치를 새 `main`(988294a, M2 #91 · WI-0033 #101 · WI-0031 #102 · #103 · WI-0034 #104 포함) 위로 옮김 (D3 · plan 3.6) → ✅ 2026-10-17: 원격 브랜치를 덮어쓰지 않도록 새 브랜치 `feat/wi-0025-m3-ontology-v2`에서 M2 원본 커밋 4개(8cfcc1c까지)를 빼고 M3 고유 커밋만 rebase 했습니다. 문서 커밋 4개(db0c7ad · cbf0b7e · e32e776 · e72b97f)는 main 이 같은 내용을 더 최신 상태로 갖고 있어 빈 커밋이 되어 건너뛰었습니다. 후속 커밋으로 `check-token-refs` CSS 미생성 판정을 판정 7 로 옮기고(WI-0033 plan 6장), M3 추가 component 토큰 2개(plan-card.accent-width · card-shadow)에 `themeIndependent` 마커를 붙였습니다. 실측: `check-token-refs` `:root 259 · .dark 259 · 다크 값 대상 29 · 미반영 0`, 테마 선언 `leaf 47 · 색 leaf 43 · 위반 0`, CSS 미생성 0, tokens test 83/83(WI-0033 16 + 브랜드 67), 브랜드 미지정 `variables.css`는 988294a 빌드 대비 `:root` · `.dark` 각각 M3 신규 변수 10개만 늘고 기존 249개 값은 같습니다
- [ ] 흰 글자 짝 토큰 신설과 교체: message-bubble 30 · plan-card 179 · step-timeline 76 · run-progress 127 · agent-avatar 80 (예: `agent.message-user-text`, `status.*-contrast`, `agent.avatar-text`, 기본값 #FFFFFF) (D-5 · FR-8) → ontology 값은 D-6 접기 매핑 표에서 대비 검산 후 결정(2026-10-16 결정, 초안 2에는 짝 배경인 `status` · `agent` 값이 없음, 다크 `key` #6B98F0 위 흰 글자는 2.85:1) → 2026-10-17 ontology 값 확정(plan 5.3): 짝 토큰 6개 모두 라이트 `on-key` #FFFFFF · 다크 `on-key` #0E1013, `neutral-muted-contrast`만 라이트 `ink-2` · 다크 `ink`(다크 `ink-2`는 3.79:1 미달). 대비 최소 라이트 4.99 · 다크 5.08:1, `test/ontology-values.test.mjs`가 단언해요
- [ ] 불투명도 수식어 결함 수정: agentic-ui 11곳(plan-card 6 · diff-viewer 2 · feedback-buttons 2 · attachment-card 1)의 `bg-[var(..)]/10` · `border-[var(..)]/30`을 `color-mix()` 형태로 교체해 의도된 옅은 바탕 복원(화면 변화, 1.3.0 릴리스 노트 기재), `check-token-refs`에 CSS 미생성 패턴 검출 추가 (2026-10-15 결정)
- [ ] FR-7 PlanCard 색 선 두께 component 토큰 `--axis-plan-card-accent-width`(기본 4px) 신설과 plan-card 참조 변경, 기본 화면 불변 (FR-7 · AC3)
- [ ] FR-9 그림자 primitive `--axis-shadow-sm` · `--axis-shadow-lg` 신설 (기본값 = Tailwind `shadow-sm` · `shadow-lg`) (FR-9 · AC3)
- [ ] FR-9 Card(`shadow-sm`) · Dialog(`shadow-lg`) 하드코딩을 그림자 변수 참조로 변경, 기본 화면 불변 (FR-9 · AC3). 2026-10-16 결정: Card는 component 토큰 `--axis-card-shadow`(기본값 `var(--axis-shadow-sm)`)를 참조하고 ontology는 `none`, Dialog는 `--axis-shadow-lg` 직접 참조 (변경 주석: 기본값은 plan U3 `{shadow.sm}` 참조로 빌드에서 리터럴로 풀림, ontology 값은 plan U2 `0 0 #0000`)
- [x] Card 그림자 변수 2개 역할 정리: 새 `--axis-card-shadow`(0 1px 2px, `shadow.sm`)와 기존 `--axis-card-shadow-default`(0 1px 3px)가 공존합니다. 대체 · 별칭 · 폐기 예정 중 하나로 정하고 문서화합니다 (2026-10-17 사용자 결정: M3 2차 구현 범위) → ✅ 2026-10-17 **폐기 예정**으로 결정(plan U23). `components.json` `card.shadow.default`에 `$extensions.axis.deprecated: "card-shadow"` 마커, `theme-modes.mjs` 허용 키 확장과 대체 경로 검사, 테스트(theme-modes 1 · brands 1 · Card 1) 추가, `theme-customization.md` 카드 예시를 `--axis-card-shadow`로 정정. 실측: tokens 빌드 산출물 10개 파일이 착수 전 빌드와 `diff -r` rc 0, AC3 테스트 `:root` · `.dark` 249/249 일치 · 신규 10, tokens test 100/100, `check-token-refs` 테마 선언 `leaf 47 · 색 leaf 43 · 위반 0`. 음성 대조: 마커 삭제 시 U23 단언 실패, 키 오타 `deprecatd` · 없는 대체 경로 시 빌드 rc 1 · `check-token-refs` 위반 1, Card 클래스를 폐기 예정 변수로 바꾸면 Card 테스트 2건 실패(모두 되돌림). 1.3.0 노트(U22)에 넘길 문장: ① `--axis-card-shadow-default` · `CardShadowDefault`는 폐기 예정이며 Card 그림자는 `--axis-card-shadow`로 조정합니다(가이드 예시 정정이며 동작 변경 아님, 이 변수는 배포된 어느 버전에서도 Card에 반영되지 않았습니다) ② Card · Dialog 그림자가 tokens CSS 변수를 참조하므로 `@axis-ds/tokens/css`를 로드하지 않는 환경에서는 그림자가 없습니다
- [ ] (백로그) `--axis-dialog-content-shadow`(0 25px 50px -12px)도 컴포넌트가 참조하지 않고 값도 Dialog 실제 그림자(`--axis-shadow-lg`)와 다릅니다. Card와 같은 폐기 예정 처리 여부를 별도로 정합니다 (plan U23 후속, 이번 범위 밖)
- [x] FR-8 `src/brands/ontology/light.json` · `dark.json` 작성 (초안 2 `axis-theme-ontology.css` 이식(v0.24 · 디자인 시스템 v1 기준), `bg-muted` 줄 제외(D-f), 신설 22개 status · diff · agent 값은 D-6 접기 매핑(2026-10-16 결정)) (FR-8 · AC6) → 🔄 2026-10-17 1차: 초안 2 이식분(라이트 74 · 다크 68, `bg-muted` 제외)과 Card 그림자 2개(U2 · U23)를 넣었어요. 초안 대비 기계 대조(블록별 이름 · 값 집합)에서 차이는 정확히 4건(초안에만 `bg-muted` 라이트 · 다크, 산출에만 `card-shadow` · `card-shadow-default` 라이트), 값이 다른 쌍 0건(shadcn 포함). 접기 매핑 값은 다음 단계에서 같은 파일에 더해요 → 2026-10-17 D2 보정: 초안 2가 `bad-line`(라이트 #F5C6C6 · 다크 #7A3330)을 `button-destructive` hover · active 바탕에도 썼는데, 부록 B는 `bad-line`을 warning 아이콘에만 허용하고 다크 글자 `bad-dark` #F49890 대비가 4.16:1로 AA 미달이라 hover · active를 `bad-light`(#FDE8E8 · #3A1A1A, default와 같은 값)로 바꿨어요. 대비 라이트 4.61 → 5.98:1, 다크 4.16 → 7.26:1. 이 교체로 초안과 값이 다른 쌍은 4건(라이트 · 다크 각 hover · active)이고 테스트의 D2 교체표에만 둡니다. hover · active 때 바탕 변화가 없어지므로 **디자인 오너 사후 확인 대상(D5)**에 넣어요. 테스트: `bad-line` 값 사용처가 `--axis-icon-warning` 하나뿐인지와 destructive 글자/바탕 3상태 4.5:1 이상을 단언(음성 대조: 다크 hover를 #7A3330으로 되돌리면 2건 실패, 되돌린 뒤 sha 일치) → ✅ 2026-10-17 2차: 초안 2에 없던 기본 토큰 40개(semantic 32 · component 8, Card 그림자 2개는 1차에서 넣어 대상 42개)의 접기 값을 넣었어요(plan 5.3 · U25). 「신설 22개」는 착수 전 추정이고 실제 범위는 `variables.css` `:root`의 semantic · component 109개 중 초안 2에 없던 42개예요. D2에 따라 `border.warning` · `status.error-border`는 `bad`, `button.text.disabled`는 `sub-aa`로 두었어요. 완전성 테스트(기본 소스 이름 = ontology 라이트, 제외 0) · 값 테스트 · 대비 28짝 x 2테마를 `test/ontology-values.test.mjs`에 추가, 짝 표 드리프트는 루트 `pnpm check-contrast-pairs`(U26). 실측: 브랜드 라이트 블록 누락 40 → 0, 기본 `variables.css` · `shadcn-compat.css` sha256 불변, tokens test 115 → 186 pass. 음성 대조 11종은 plan 5.3 검증 줄
- [x] U18 초안 역반영: 초안 2에 없던 기본 토큰 42개 값을 `axis-theme-ontology.css` 라이트 · 다크 블록에 원본 토큰 이름 주석과 함께 추가, 머리말에 「사후 확인 대기」 표기 (FR-8 · plan U18) → ✅ 2026-10-17 대리 승인 기준 별 커밋. 초안과 브랜드 CSS(`dist/css/brands/ontology.css`)를 블록별 `이름: 값` 집합으로 대조하면 차이는 `bg-muted`(D-f) 라이트 · 다크 1줄씩과 D2 destructive hover · active 4쌍뿐이에요(D2 값은 초안에 남기고 머리말과 테스트 교체표에 적음, 사후 확인 뒤 한쪽으로 맞춤). `brands.test.mjs`에 반대 방향 대조(브랜드 JSON 선언 ⊂ 초안, 참조는 기본 소스로 풀어 비교) 추가. 음성 대조(사본): 역반영 전 초안으로 되돌리면 반대 방향 단언 실패, 초안 `status-warning`을 `bad-line`으로 바꾸면 양방향 단언 모두 실패
- [x] 초안 2 CSS 정정: 글꼴 변수 이름을 `--axis-font-family-sans|mono`로, `--axis-plan-card-accent-width: 0` 줄 추가 (PRD FR-9 전제, 초안 2에는 정정 전 이름이 들어 있고 이 줄이 없음, plan 3.3 초안 2 대조) (FR-8 · FR-9) → ✅ 2026-10-16: 글꼴 이름 · PlanCard 0 줄 · 주석 2곳(rounded-md 10, line-2 3.12:1) 정정, shadcn HSL 30곳을 소수 퍼센트로 바꿔 원본 hex와 정확히 일치(AC6 결정)
- [x] FR-8 `shadcn` 섹션 이식 (`--radius: 12px` 포함) (FR-8 · AC6) → ✅ 2026-10-17: 라이트 20(`radius` 포함) · 다크 19, 산출 CSS에서 초안과 값 차이 0건
- [x] FR-9 글꼴 `font.family.sans|mono`, 둥글기 `radius.sm|md|lg`(초안 2: 6 · 8 · 12px, 컴포넌트 미참조라 이번 WI에서는 효과 없음), 그림자(초안 2는 라이트 · 다크 값 모두 있음), `plan-card` accent width `0` 지정 (FR-9) → ✅ 2026-10-17: accent width는 `0`이 아니라 U8 · 초안 2 24행대로 `1px`로 지정했어요(이 줄의 `0`은 U8 이전 문구). 글꼴 · 둥글기 · `plan-card`는 라이트에만, 그림자는 라이트 · 다크 모두, Card 그림자 2개는 라이트에만 `0 0 #0000`(plan U24)
- [x] `src/brands/ontology/brand.json` 작성 (a11y 상태 기록: 부록 B 2026-10-16 대리 승인, 디자인 오너 사후 확인 대기) (FR-4 · D6) → ✅ 2026-10-17: `status` "부록 B 2026-10-16 대리 승인, 디자인 오너 사후 확인 대기", `checkedAt` 2026-10-16, `gate` "WI-0025 부록 B"(AC8 CI 게이트가 켜지면 그 이름으로 갱신). npm 배포본에 그대로 들어가므로 개인 이름과 제품 가칭은 넣지 않았어요
- [x] `package.json` exports에 `./css/brands/ontology` · `./brands/ontology/brand.json` 추가 (FR-5 · AC4) → ✅ 2026-10-17: 두 항목과 목록 `./brands`를 브랜드 JSON과 같은 커밋으로 추가. 음성 대조: 사본에서 각 항목을 지우면 B5 위반으로 빌드 rc 1
- [x] AC4: `pnpm build` 후 `dist/css/brands/ontology.css` 생성, `import "@axis-ds/tokens/css/brands/ontology"` 동작, `pnpm pack-smoke` 통과 (AC4) → ✅ 2026-10-17: `pnpm build --force`(8/8, 캐시 0) 후 `ontology.css`(선택자 라이트 1 · 다크 3, `--axis-*` 144 = 라이트 76 · 다크 68, shadcn 39) · `brand.json` · `index.json` 생성. `pnpm pack-smoke` rc 0(6개 패키지), 음성 대조로 `ontology.css`를 지우면 rc 1(`exports 타깃 미존재`) 후 재빌드로 복구. 독립 실측: `pnpm pack` tarball을 빈 소비자 디렉터리에 `npm i`(심링크 아님)하고 `require.resolve` · `import.meta.resolve('@axis-ds/tokens/css/brands/ontology')` rc 0(`dist/css/brands/ontology.css`), `require('@axis-ds/tokens/brands/ontology/brand.json').name` = ontology, `require('@axis-ds/tokens/brands')` 목록의 css · meta 경로가 그대로 해석돼요. 번들러(Next · Turbopack) CSS import는 apps/web 브랜드 로드 단계에서 확인해요
- [x] AC3 스냅샷 테스트: 브랜드 미지정 `variables.css` 라이트 · 다크가 1.2.1과 일치, 신규 변수는 기본값만 검사 (AC3) → 2026-10-17 `test/baseline-1.2.1.test.mjs` 추가 · `scripts.test` 등록. HEAD f181716 재빌드(`--force`) 기준 `:root 249/249 · .dark 249/249 일치 · 신규 10`(전부 `SOURCE.json` 기본값), `shadcn-compat.css` 1897/1897 바이트 일치, tokens 테스트 83 → 98 pass. 음성 대조 8종(`:root` 값 · `.dark` 만 값 · 대문자 이름 줄 삭제 · 미지 변수 · 신규 변수에 1px · `.dark` 헤더 변경 · shadcn 1줄 · 없는 경로)이 전부 rc 1. dist stale 가드(src · scripts · build-tokens.mjs 보다 dist 가 오래되면 실패)는 로컬 전용이고 env `CI` 에서는 생략해요(checkout mtime 거짓 실패 방지, turbo 경유로 CI 변수 전달 확인). FR-8 브랜드 추가 뒤 재빌드에서 다시 돌려 기본 출력 불변을 재증명해요 → 2026-10-17 FR-8 구조 추가 뒤 재증명: `variables.css` · `shadcn-compat.css` sha256이 착수 전 HEAD(cb9979d) 빌드와 같고(`fa637a54…` · `dd374eca…`), 브랜드 산출물을 뺀 dist 10개 파일 `diff -r` rc 0, AC3 테스트 통과(tokens 114/114)
- [x] AC6 Playwright 계산 스타일 검사: `data-brand="ontology"` 라이트 · 다크 7개 변수가 부록 A(v1 기준)와 일치 (shadcn HSL은 원본 hex로 정확히 렌더되는 소수 퍼센트로 적고 렌더 rgb 채널당 ±1 비교, 2026-10-16 결정) (AC6) → 🔄 2026-10-17 setContent 층: `apps/web/e2e/brand-tokens.spec.ts`가 dist 3파일(variables · shadcn-compat · brands/ontology 순서, U11)을 올려 7개 변수를 재요. `--axis-*` 6개는 변수 원문과 렌더 rgb가 정확히 같고, `--primary`는 `hsl(var(--primary))` 렌더 rgb를 채널당 ±1로 비교해요. 갈래는 라이트 2(`html` 속성 · 하위 컨테이너) · 다크 3(FR-5 선택자 3종)이고, 갈래마다 브랜드 속성이 없는 대조 문서에서는 값이 달라야 해요. dist가 없거나 src보다 오래되면 실패해요(결정 24). 기대값은 `e2e/brand-expectations.ts`(부록 A를 손으로 옮긴 표, a11y spec이 import), `addInitScript` 헬퍼는 `e2e/helpers/brand.ts`의 `applyBrand`이고 가로챈 가짜 주소로 이동해 따로 확인해요. `playwright.tokens.config.ts` testMatch는 배열. 실측: `pnpm --filter @ax/web test:e2e:tokens` 17 pass(brand 13 · dark 4). 음성 대조 4종: dist 다크 `text-secondary` #9CA3AD를 #9CA3AE로 1채널 변조하면 4건 실패, 라이트 `--primary`를 정수 퍼센트 `220 69% 53%`(렌더 rgb(52,108,218), 차이 2)로 바꾸면 3건 실패, 차이 1인 `52.8%`는 통과(경계), src 파일 `touch` 뒤에는 낡은 dist로 로드 실패, 헬퍼가 다른 속성을 붙이게 하면 헬퍼 2건 실패. 변조는 모두 되돌렸고 ontology.css sha256 일치. 남은 것: 결정 23의 앱 1페이지 7변수 확인(layout 브랜드 import 뒤 단계) → ✅ 2026-10-17 앱 층: `a11y.spec.ts`가 ontology 18건 모두에서 axe 전에 같은 7변수를 `brand-expectations.ts` 표로 단언해요(`--axis-*` 6개 렌더 rgb 정확히 일치, `--primary` 렌더 ±1). 프로덕션 CSS 압축이 `#FFFFFF`를 `#FFF`로 바꾸므로 변수 원문이 아니라 렌더 rgb로 비교해요. 음성 대조: layout 브랜드 import를 지우면 ontology 18건 실패, tokens와 globals 사이로 옮기면 ontology 라이트 9건이 `--primary` 렌더 rgb(24, 24, 27)로 실패(빌드 재생성 뒤 되돌림)
- [x] `apps/web`이 AXIS 토큰 색을 그리도록 설정 정비 (`tailwind.config.ts` content 경로, tokens CSS import, `globals.css` shadcn 정의와 브랜드 CSS 순서, D-d · 3 결정 13 반영). M4에서 M3로 당김: 이 정비 없이 a11y를 돌리면 브랜드 값이 화면에 닿지 않은 채 통과함 (AC8 · FR-10) → ✅ 2026-10-17: tailwind content · tokens CSS import는 f64825d, 남은 브랜드 CSS 순서는 아래 줄에서 끝냈어요(결정 28에 따라 함께 체크)
- [x] `apps/web`에서 브랜드 CSS 로드 (4 결정 2 반영) (AC8) → ✅ 2026-10-17: `layout.tsx`에서 `@axis-ds/tokens/css/brands/ontology`를 `globals.css` 뒤에 import(라이트 `[data-brand]`와 globals `:root` 명시도가 같아 순서로 이김, U11 = globals 뒤). `pnpm turbo run build --filter=@ax/web... --force`(4/4, 캐시 0) 뒤 `out/index.html` CSS를 링크 순서대로 이어 보면 globals `--primary` 정의 2개(`:root` · `.dark`)가 모두 브랜드 라이트 규칙보다 앞이에요. 브랜드 속성이 없는 기본 화면은 그대로이고(a11y 기본 18건 결과가 import 유무와 무관하게 같음), 기본 `variables.css` · `shadcn-compat.css` sha256 불변(`fa637a54…` · `dd374eca…`)
- [x] ontology 라이트 · 다크 비텍스트 대비 측정: 포커스 링 · 의미 아이콘 3:1 이상 (axe는 비텍스트 대비를 판정하지 않음), 라이트 입력 테두리 `line-2` 1.40:1은 포커스 때 `key` 테두리로 바뀌는지 확인 (3.2 접근성 · 부록 A · B) → ✅ 2026-10-17 `apps/web/e2e/brand-nontext-contrast.spec.ts`(`pnpm --filter @ax/web test:e2e:nontext`, static out 6/6). Input은 테두리 대신 2px 링으로 포커스를 표시해서 키보드 포커스 때 링 색 = `key`, 링 대 바탕 3:1 이상으로 판정해요(결정 20, PRD 부록 A 끝 정정). 실측: 라이트 Input · Button 링 #326ADA 대 바탕 #F7F7F7 4.66:1, 다크 #6B98F0 대 #0E1013 6.69:1, 비포커스 테두리 라이트 `line-2` #D6DADF 1.40:1(원본 유지 승인이라 기록만) · 다크 #5F6874 3.12:1. 링 오프셋은 기록만(결정 21): 다크 링 대 흰 오프셋 2.85:1. 상태 아이콘은 문서 페이지가 패키지 컴포넌트가 아니라 페이지 안 시연용 구현(Tailwind gray · green 등)을 그려 `--axis-status-*` 아이콘이 화면에 0개라서, 같은 페이지에 svg 프로브를 넣어 컴포넌트가 아이콘에 쓰는 6색(neutral · running · success · error · info · warning)을 surface-default · surface-secondary 위에서 쟀어요(결정 22). 최소 라이트 4.53:1(running · info on secondary), 다크 5.60:1. 음성 대조 4종(링 변수 #D6DADF 주입 2건 · 키보드 포커스 생략 2건 · status-neutral #F5C6C6 1건 · 바탕 #4A7BE0 6건 실패, 되돌린 뒤 sha 일치). 범위 밖 기록(U20 부류, 고치지 않음): 기본 브랜드 Button 링 #60A5FA 흰 바탕 2.54:1, 기본 status-neutral #9CA3AF 흰 바탕 2.54:1
- [x] `apps/web/e2e/a11y.spec.ts`에 브랜드 축 추가: 기본 · ontology × 라이트 · 다크 × 9페이지 = 36건, ontology는 `addInitScript`로 `data-brand` 부착 (AC8) → ✅ 2026-10-17: `playwright.config.ts`에 `E2E_SERVER` 분기(U10, static = `out/`을 `python3 -m http.server` 3101, CI 기본 · dev = 3100 로컬 기본, static인데 `out/index.html`이 없으면 설정 단계 실패). D1 기준선(PRD AC8 개정): 기본 브랜드에서만 WI-0029 두 쌍 노드를 거르고 페이지 · 테마별 상한, ontology 예외 0. 실측(static, `--force` 빌드 out): 36/36 통과, 기준선 노드 기본 라이트 13 · 다크 13(12건 · 26노드, `#3b82f6` 24 · `#ef4444` 2), ontology 0. 음성 대조: 기준선 bg를 #3b82f7로 바꾸면 기본 12건 실패, ontology `/docs/` 라이트에 #bbbbbb 글자 주입 시 1건 실패, `out` 없이 static 실행 시 rc 1, `E2E_SERVER=bogus` rc 1. dev 모드 36건 실행은 하지 않았어요(판정 기준은 static)
- [ ] Q7 CI 배선: `frontend.yml` 「Build」 다음에 Playwright 캐시 · `playwright install --with-deps chromium` · `test:e2e:a11y` · 실패 시 `test-results` 업로드 (4 결정 1 서버 방식 반영) (AC8 · Q7) → 🔄 2026-10-18 배선 커밋(첫 배선, 결과만 보고). `ci` job 「Build」와 「Upload build artifact」 사이에 순서대로 ① 「Pack smoke」(AC4, 검사 패키지 수 1개 이상 가드) ② Playwright 버전 읽기(설치된 CLI, 형식 검사) ③ `~/.cache/ms-playwright` 캐시(키 = OS + Playwright 버전) ④ `playwright install --with-deps chromium` ⑤ E2E 3 step `test:e2e:a11y`(AC8, `E2E_SERVER=static`) · `test:e2e:nontext`(비텍스트 대비) · `test:e2e:tokens`(AC6), 셋 다 `continue-on-error: true`, JSON 리포트는 `apps/web/playwright-report/<suite>.json`, `--output=test-results/<suite>`로 출력 디렉터리를 나눔(Playwright가 실행마다 출력 디렉터리를 비워 앞 실행의 실패 산출물이 지워지기 때문) ⑥ 「E2E 실행 건수 가드」(continue-on-error 없음): 기대 a11y 36 · nontext 6 · tokens 17(`playwright --list` 실측), skipped 0, a11y 조합 4종 각 9건, JSON이 없으면 측정 실패로 rc 1, 결과 표를 step summary에 기록 ⑦ E2E step 하나라도 실패하거나 건수 가드가 실패하면 `test-results` · `playwright-report`를 `e2e-test-results` artifact로 업로드(7일). 로컬 재현(`pnpm build --force` 8/8 캐시 0 뒤 yml의 run 블록을 그대로 추출해 실행): pack-smoke 6개 · a11y 36 pass · nontext 6 pass · tokens 17 pass · 건수 가드 rc 0. 음성 대조 7종이 모두 rc 1: a11y JSON 없음, tokens 실행 16건, ontology/dark 8건(총계는 그대로), skipped 1, stats 값 비숫자, `out` 없이 static 실행(a11y step rc 1 뒤 가드 rc 1), pack-smoke 0개 · 문구 없음(가드 로직 사본으로 실행). 변이는 모두 gitignore 산출물에만 넣고 되돌렸어요. YAML은 actionlint가 없어 python yaml 파싱과 키 구조 검사(step 키 허용 목록, `steps.<id>` 참조가 앞선 step인지, step 순서, continue-on-error가 E2E 3개에만 있는지, deploy job `needs` 불변)로 대신했어요. 이 검사는 GitHub 표현식 문법 · action 입력 이름 · runner 환경(`jq`, `python3`, apt 의존성)을 검증하지 못하므로 실제 동작은 PR CI run에서 확인해요
- [ ] Q7 CI 게이트 켜기 (U9, M3 2차 결정 15): **조건** ① M3 PR의 `frontend.yml` run에서 E2E 3 step이 모두 성공(a11y 36 · nontext 6 · tokens 17 통과, D1 기준선 적용 뒤 기본 브랜드 기준선 밖 위반 0 · ontology 위반 0)이고 「E2E 실행 건수 가드」 표가 기대 건수와 같을 것 ② CI static 기준선 노드 수를 job 로그에서 읽어 로컬 실측(기본 라이트 13 · 다크 13, 12건 · 26노드)과 비교하고, 다르면 측정 조건(runner OS · Playwright 버전 · run id)과 함께 PRD AC8 상한 기록을 갱신할 것 ③ 확인 PR(4 결정 4)에서 대비 위반 주입 커밋이 a11y step 실패와 `e2e-test-results` 업로드를 일으키고, 되돌린 커밋에서 초록으로 돌아올 것. **방법** 별도 커밋에서 `frontend.yml`의 세 E2E step의 `continue-on-error: true` 줄과 위 「첫 배선」 주석 두 줄을 지우고, 그 커밋의 PR run에서 세 step 성공을 다시 확인해요. 게이트를 켜면 E2E 실패가 `deploy-preview` · `deploy-production`(`needs: ci`)을 막는 것이 의도된 동작이에요. 세 step을 따로 켤 수도 있지만, 켜지 않은 step은 실패해도 job이 초록이므로 그 사이에는 run 결과를 직접 확인해야 해요. 켠 뒤 `brand.json` `a11y.gate`를 게이트 이름으로 갱신해요(위 brand.json 줄)
- [ ] AC8: 4조합 axe 위반 0, 온톨로지 전용 예외 0 (CI 결과로 확인) (AC8)
- [ ] 레지스트리 · library 사본 재생성 (Card · Dialog · PlanCard 변경분) (FR-7 · FR-9)
- [ ] M3 PR 머지 전 `npm view @axis-ds/tokens version` = `1.2.1`, `main`의 `.changeset/`에 patch 잔여 없음 확인 (D3 · plan 3.6)

### M3 DoD
- [ ] `pnpm type-check` 통과
- [ ] `pnpm lint` 통과 (측정 범위: WI-0034(#104) 이후 lint 태스크는 tokens · ui-react · agentic-ui · `@ax/web` 4개, type-check 태스크도 4개)
- [ ] `pnpm build` 성공
- [ ] `pnpm test` 통과, `test:e2e:a11y` 36건 통과, `pnpm check-token-refs` rc 0
- [ ] 문서: 부록 B 승인 기록, todo.md 체크

---

## Phase M4: 문서 · 브랜드 전환 데모 (FR-10, 1.3.0)

- [ ] FR-10 `apps/web` 브랜드 전환 데모: `document.documentElement`에 `data-brand` 직접 부착 · 제거, 다크는 `next-themes` `.dark` 유지 (FR-10 · AC7)
- [ ] M4 PR 머지 전 1.2.1 배포 · patch changeset 잔여 없음 재확인 (D3 · plan 3.6)
- [ ] AC7: Button · Card · Input · Badge · Alert · PlanCard · MessageBubble 데모가 브랜드 · 테마 전환에 함께 바뀌는지 확인, v1에서 접힌 상태(성공 · 경고)가 늘 글자 · 아이콘과 함께 보이는지(Q8), 상태 뱃지 · 둥글기 · 그림자 차이가 함께 보이는 화면 구성(Q9) (AC7)
- [ ] FR-10 `docs/guides/theme-customization.md`에 「브랜드 테마」 절 추가 (import 순서 안내 포함) (FR-10)
- [ ] FR-10 같은 문서 「4. 커스텀 테마 생성」 예시를 브랜드 디렉터리 방식으로 갱신, primitive 오버라이드 안내(92~97행) · `component-usage.md` 175행 정정 (D-7 반영) (FR-10)
- [ ] FR-10 부록 B 원본 대비 보정 내역 문서 게재 (v1 기준 `sub` 1개 값 보정과 미달 쌍 처리) (FR-10 · D1)
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
