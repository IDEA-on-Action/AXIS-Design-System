# WI-0028: CLI · MCP 브랜드 명령 TODO

> PRD: [prd.md](./prd.md) | Plan: [plan.md](./plan.md) | Testplan: [testplan.md](./testplan.md) | GitHub: #87 | 상태: 🔄 설계 완료 (2026-10-19, 구현 전)

## 진행 순서

| Phase | 범위 | 시점 | 릴리스 |
|---|---|---|---|
| P0 | 착수 전 결정, S0 스파이크 | 지금 | 없음 |
| P1 | 공통 기반: 버전 표기, `AxisConfig`, MCP 테스트 환경 (2.2 · FR-2 설정 · FR-6) | 지금 | 없음 |
| P2 | 공유 코어 + fixture, `theme list` · `theme info` (FR-1 · FR-3) | 지금 | 없음 |
| P3 | `theme add` (FR-2) | 지금 | 없음 |
| P4 | `axis check` · `axis.check_project` brand 검사 (FR-5) | 지금 | 없음 |
| P5 | MCP `axis.list_brands` · `axis.get_brand` (FR-4) | 지금 | 없음 |
| P6 | ontology 실데이터 재확인 | **WI-0025 M3(#107) 머지 뒤** | 없음 |
| P7 | AC2(b) 레지스트리 설치 빌드, changeset, 머지 | **1.3.0 배포 뒤** | cli · mcp 1.2.0 |

- P1~P5 는 main 기준 fixture(plan 6.1)로 개발합니다. 코드 PR 은 draft 로 열고, P7 에서 changeset 을 더한 뒤 ready 로 바꿉니다(plan 7장).
- `project-todo.md` · `.github/wi-mapping.json` 은 이 브랜치에서 고치지 않습니다.

---

## P0. 착수 전 결정

> 권장안은 plan 8장. 「게이트」 항목은 결정 전 해당 작업을 시작하지 않습니다.

- [ ] U1 공유 코어 방식: 복제 + 동일성 테스트 / 내부 패키지 신설 / MCP 가 CLI 소스 번들
- [ ] U2 브랜드 import 위치 (게이트: 위치를 바꾸는 경우): S0 실측 뒤 결정
- [ ] U3 FR-3 보정 내역 출처 (게이트): a11y 메타와 근거 안내만 / `brand.json` 보정 필드(WI-0025 D6 변경) / CLI 정적 표
- [ ] U4 「주요 토큰」 목록: 고정 12개 / 브랜드 CSS 전부 / `brand.json` 필드
- [ ] U5 tokens 미설치 시 `add` 검증: 이름 규칙만 + 경고 / npm 레지스트리 조회 / 거절
- [ ] U6 추가할 tokens 범위: `^1.3.0`
- [ ] U7 MCP 기존 데이터 경로 결함(plan 1.2): 별도 WI / 이 WI 포함(게이트)
- [ ] U8 기본 토큰 CSS 없는 프로젝트: 안내만 / 자동 추가(게이트)
- [ ] U9 버전 번호(PRD Q3)와 PRD 기준 버전 표기 정정 위치
- [ ] U10 ~ U13: `ThemeProvider` 안내만(Q1) · TS 타입만(Q2) · 설치 안내만(Q5) · 다른 브랜드 import 유지 + 추가
- [ ] **S0 스파이크** (U2 판단 근거): Next 15 App Router 와 theme-only 구조에서 globals.css 맨 앞 `@import` 한 브랜드 CSS 의 라이트 shadcn 값이 프로젝트 `:root` 값을 이기는지 계산값으로 실측 (plan 2장 D5, testplan T0)

---

## P1. 공통 기반

- [ ] CLI `.version()` 이 `package.json` 값을 읽음 (2.2) → testplan T1-1
- [ ] MCP `McpServer` version 이 `package.json` 값을 읽음 (2.2) → T1-2
- [ ] `src/config/axis-config.ts`: `AxisConfig`(`brand?` 포함) · `readAxisConfig` · 스키마 URL 상수 (FR-2 설정)
- [ ] `axis init` · `axis template init` 생성 객체에 `AxisConfig` 타입, 생성 내용 불변 → T1-3
- [ ] MCP `vitest` devDependency · `test` 스크립트 · `vitest.config.ts` (FR-6) → T1-4
- [ ] MCP `turbo.json` test inputs 에 CLI `brand-core.ts` (FR-6, plan 4.7)
- [ ] `pnpm install --offline` rc 0, lockfile 변경은 mcp importer 만 (FR-6)
- [ ] `turbo run test --dry=json` test 태스크 5 → 6 (FR-6) → T1-5

## P2. 공유 코어 · list · info

- [ ] fixture 원본 `packages/axis-cli/test/fixtures/theme/`(tokens-1.3 · tokens-1.3-unbuilt · tokens-1.2 · projects/app-init · projects/src-app)와 펼침 helper, theme-only 는 `theme-only.json` 에서 펼침 (plan 6.1)
- [ ] cli `turbo.json` test inputs 에 `theme-only.json` (plan 5장 12a)
- [ ] `brand-core.ts`: `resolveTokens` 4상태(ok · not-installed · unsupported · not-built), 설치 여부는 `node_modules/@axis-ds/tokens/package.json` 직접 탐색 (plan 3장 5) → T2-1
- [ ] `listBrands` 가 `index.json` → `brand.json` 순으로 읽음 (FR-1) → T2-2
- [ ] `parseBrandCss` 라이트 · 다크 블록 (FR-3) → T2-3
- [ ] `axis theme list` 출력: 이름 · 설명 · 테마 (FR-1, AC1 fixture 판) → T2-4
- [ ] `axis theme list` 미설치 · 미지원 안내, rc 1 (FR-1) → T2-5
- [ ] `axis theme info <brand>` 메타 · import 경로 · Provider 예시 · 주요 토큰 (FR-3) → T2-6
- [ ] `axis theme info` 보정 내역 (FR-3, U3 결정 뒤) → T2-7

## P3. theme add

- [ ] `planThemeAdd` · `applyThemeAdd` 분리 (FR-2)
- [ ] `axis.config.json` 없으면 아무것도 쓰지 않고 rc 1 (FR-2) → T3-1
- [ ] CSS 대상 탐색 순서 `globalCss` → `app/` → `src/app/` → 루트 (FR-2, A1) → T3-2
- [ ] `globalCss` 가 없는 파일을 가리키면 경고 후 다음 후보 (U14 권장안, plan 4.1) → T3-2b
- [ ] import 삽입 위치(`@charset` · 기존 `@import` 뒤) (FR-2, U2) → T3-3
- [ ] 두 번 실행해도 import 1줄 · 의존성 1회 · brand 기록 (AC2(a) fixture 판, 완료 판정은 T6-6) → T3-4
- [ ] tokens 없으면 `dependencies` 에 `^1.3.0` 추가 + 설치 안내, 설치 미실행 (FR-2, U6) → T3-5
- [ ] tokens 1.3.0 미만이면 범위 유지 + 업그레이드 안내 → T3-6
- [ ] 브랜드 이름 검증(U5) · 다른 브랜드 import 처리(U13) → T3-7 · T3-8
- [ ] Provider 안내 문구(`defaultBrand`, `<html data-brand>`, theme 1.3.0 조건) (FR-2, Q1) → T3-9
- [ ] CSS 대상 없음 → 수동 안내, 나머지 단계 진행 (A1) → T3-10

## P4. check 의 brand 검사

- [ ] CLI `runCheck` → `collectCheckResults` 분리, 출력 문구 불변 (FR-5, 2.2) → T4-1
- [ ] `brand` 없는 프로젝트는 결과 개수 · 문구가 이전과 같음 (FR-5) → T4-2
- [ ] brand 일치 pass · import 없음 warn · 다른 브랜드 warn · CSS 없음 warn (FR-5, AC4) → T4-3
- [ ] MCP `handleCheckProject` 에 같은 검사 (FR-5) → T4-4

## P5. MCP 브랜드 도구

- [ ] `src/tools/brand-core.ts` 사본 + 동일성 테스트 (U1) → T5-1
- [ ] `handleListBrands` · `handleGetBrand` · format (FR-4) → T5-2
- [ ] `axis.list_brands` · `axis.get_brand` 등록, 도구 16 → 18 (FR-4) → T5-3
- [ ] 미설치 · 미지원이면 `isError` 없이 설치 안내 (FR-4, Q5) → T5-4
- [ ] CLI · MCP 응답 동일성 (AC3) → T5-5
- [ ] 빌드 산출물 stdio 스모크: `tools/list` 18개, `axis.list_brands` 정상 응답 → T5-6
- [ ] README 2개 갱신

## P6. M3 머지 뒤 (ontology 재확인)

- [ ] tokens `build --force` 뒤 `dist/brands/index.json` · `ontology/brand.json` · `css/brands/ontology.css` 존재 (plan 6.2-1) → T6-1
- [ ] 산출물 형식과 fixture 대조, 다르면 fixture · 코어 수정 (plan 6.2-2) → T6-2
- [ ] tokens tarball `file:` 설치 프로젝트에서 `axis theme list` 가 `ontology` 출력 (**AC1**) → T6-3
- [ ] 같은 프로젝트에서 `theme info ontology` · MCP 두 도구 응답 (AC3 실데이터) → T6-4
- [ ] 주요 토큰 목록이 ontology 산출물에 있는지, 긴 `a11y.status` 출력 폭 (plan 6.2-4 · 5) → T6-5
- [ ] 실제 `axis template init theme-only` 산출물에 `axis theme add ontology` 2회 (**AC2(a)**, plan 6.2-7) → T6-6
- [ ] S0 을 P0 에서 못 끝냈으면 여기서 실측

## P7. 1.3.0 배포 뒤

- [ ] `npm view @axis-ds/tokens@1.3.0 exports --json` 에 `./brands` (plan 6.3-1) → T7-1
- [ ] App Router 프로젝트 `axis theme add ontology` → `pnpm install` → `pnpm build` rc 0 + import 1줄 · check brand pass · 산출 CSS 의 `data-brand` 선택자(음성 대조군 포함) (**AC2(b)**, plan 6.3-2) → T7-2
- [ ] changeset: `@axis-ds/cli` · `@axis-ds/mcp` minor (plan 7장)
- [ ] `release-notes.md` 작성
- [ ] 품질 게이트: `turbo run build test --force` rc 0, cached 0 → T7-3
- [ ] PR ready → 리뷰 → 머지, 배포 뒤 npm 실측(T7-4)
