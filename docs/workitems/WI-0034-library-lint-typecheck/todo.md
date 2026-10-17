# WI-0034: 라이브러리 패키지 lint · type-check 공백 해소 TODO

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | 상태: 🔄 진행 (2026-10-17 구현 · 검증 완료, PR 대기)

## 진행 순서

| Phase | 범위 | 릴리스 | GitHub |
|---|---|---|---|
| M1 | 공용 lint 설정 · 스크립트 · 위반 정리 · tokens type-check · opt-in 첫 묶음 · 가드 (FR-1~7) | 없음 | #100 |

- 머지 순서: **이 WI 머지 → WI-0025 M3 rebase · 머지 → opt-in 확대** (D4, plan 5장)
- `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다. 머지 뒤 현행화합니다

---

## 착수 전 결정

> 2026-10-17 사용자 결정. prd 1.5 표와 같습니다.

- [x] 범위: 1안(최소) vs 2안(opt-in) vs 3안(strict 전수) → ✅ 2026-10-17: 2안, 미적용 파일 수 가드 포함 (D1)
- [x] `build-tokens.js`: ignore vs 삭제 → ✅ 2026-10-17: 삭제, 단 참조 0건 확인 후 (D2) → 문서 언급 3건이 있어 삭제하지 않음(prd Q1)
- [x] theme · cli type-check 포함 여부 → ✅ 2026-10-17: 제외, 후속 항목 (D3)
- [x] M3 와의 순서 → ✅ 2026-10-17: WI-0034 먼저, opt-in 첫 묶음은 M3 비중첩 파일만 (D4)
- [ ] opt-in 최종 목표: strict 전수(201건) vs noImplicitAny off(20건) → 미정

---

## Phase M1

### M1-1 의존성 · 공용 설정
- [x] 루트 devDependencies 6개, lockfile 기존 정확한 버전 (FR-1)
- [x] tokens devDependencies `@types/node` 22.19.7 (FR-1)
- [x] `pnpm install --offline` rc 0 (새 다운로드 0), lockfile +30/-8 (FR-1)
- [x] 루트 `eslint.config.mjs`, ignores 에 dist · node_modules · apps/web · build-tokens.js (FR-2)

### M1-2 스크립트
- [x] tokens · ui-react · agentic-ui `"lint": "eslint ."` (FR-3)
- [x] tokens `"type-check": "tsc --noEmit -p tsconfig.typecheck.json && node scripts/check-ts-optin.mjs"` (FR-5)

### M1-3 위반 정리 (13건)
- [x] ui-react 빈 interface 3개 → type alias (card · separator · skeleton) (FR-4 · D5)
- [x] agentic-ui no-useless-escape 6건 (tool-call-card.test.tsx 60 · 61행) (FR-4)
- [x] agentic-ui no-case-declarations 1건 (surface-renderer `case "table"` 블록) (FR-4)
- [x] tokens `build-tokens.mjs` 미사용 `dirname` 1건 · 빈 catch 2건 주석 (FR-4)
- [x] 레지스트리 JSON 9개 재생성 커밋 (card · separator · agentic-surface-renderer, FR-4a)
- [ ] `packages/axis-tokens/build-tokens.js` 삭제 → 보류(prd Q1, 사용자 확인 필요)

### M1-4 tokens type-check · opt-in
- [x] `tsconfig.typecheck.json` (allowJs, checkJs false, 대상 10파일 `--listFilesOnly` 확인) (FR-5)
- [x] M3 diff 에 `scripts/theme-modes.mjs` · `test/theme-modes.test.mjs` · `test/dark-completeness.test.mjs` 가 없음 확인 (D4)
- [x] 첫 묶음 JSDoc 보강 + `// @ts-check` (오류 30 · 5 · 2 → 0) (FR-6)
- [x] `scripts/check-ts-optin.mjs` 가드, 도입 시점 출력 `JS 9개 · @ts-check 4개 · 미적용 5개` (FR-7)

### M1-5 검증 (plan 4장)
- [x] 커버리지 lint 1 → 4, type-check 3 → 4 (AC1)
- [x] `turbo run build --force` 단독 선행 후 `turbo run lint type-check --force --continue` rc 0 · cached 0 (AC2)
- [x] `turbo run test --force --continue` rc 0, 테스트 결과 변화 없음 (비기능)
- [x] ESLint 검사 파일 = `find` 목록(10 · 43 · 29), build 뒤 dist 0, `--no-ignore` 대조군 7 · 155 · 95 (AC3)
- [x] 음성 대조군 lint 3패키지 · type-check src · opt-in (a)(b)(c) (AC4 · AC5)
- [x] ui-react type-check · build · pack-smoke, 소비 측 타입 컴파일 (AC6)
- [x] lockfile diff 범위, frozen-lockfile rc 0 (AC7)
- [x] 빌드가 다시 만든 `apps/web/public/templates/*.json` 원복
- [ ] PR 생성 · 리뷰 · main 머지

---

## 후속

- [ ] theme type-check 추가 (12건, 전부 `theme.test.tsx` 의 vitest 전역 타입) (D3)
- [ ] cli type-check 추가 (20건, 테스트 18 · 실코드 2: `publisher.ts` · `template-apply.ts`) (D3)
- [ ] theme · cli · mcp lint 는 미측정. 추가하려면 먼저 위반 수를 잽니다
- [ ] M3 머지 뒤 opt-in 확대: `build-tokens.mjs`(16건) · `scripts/brands.mjs` · `scripts/build-brands.mjs`(9건) · `test/brands.test.mjs` · `test/build-brands.test.mjs` (D4)
- [ ] opt-in 최종 목표 결정: strict 전수(201건) vs noImplicitAny off(20건) → 미정. 정해지면 가드를 「미적용 0 요구」로 바꿀지도 함께 정합니다
- [ ] 빈 interface → type alias 의 선언 병합 영향(TS2300)과 `Separator` 공개 시그니처 펼침(이름 표시 소실)을 릴리스 노트에 적을지, interface 유지(`allowInterfaces: 'with-single-extends'`)로 돌릴지 결정 (prd Q2)
- [ ] `eslint@9.39.2` deprecated 표시 대응(업그레이드 여부) (prd Q3)
