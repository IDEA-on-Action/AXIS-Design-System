# WI-0034: 라이브러리 패키지 lint · type-check 공백 해소 PRD

> 작성일: 2026-10-17 | 버전: v1.0 (2026-10-17) | 작성자: Sinclair Seo | WI: WI-0034 | GitHub: #100 | 상태: Approved (2026-10-17 결정 반영)
> 선행: 없음. 기준 `origin/main` f41fa79 (`@axis-ds/*` 1.2.1 배포 완료)
> 관련: WI-0025 M3(`feat/wi-0025-m3-ontology`)가 이 수정 위로 rebase 됩니다(D4)
> 후속: theme · cli type-check, M3 머지 뒤 JS opt-in 확대(todo 후속 절)

---

## 1. 개요

### 1.1 배경
- DoD 는 「type-check · lint · build 통과」인데, WI-0025 M3 구현 중에 라이브러리 패키지 일부가 실제로는 검사되지 않는 것을 확인했습니다(Issue #100).
- CI 두 곳(`frontend.yml` · `publish.yml`)은 이미 `pnpm lint` 와 `pnpm type-check` 를 실행합니다. 공백은 workflow 가 아니라 패키지 스크립트에 있습니다.

### 1.2 원인 (실측, f41fa79)
| # | 내용 | 실측 |
|---|---|---|
| C1 | tokens · ui-react · agentic-ui 에 `lint` 스크립트가 없습니다 | `turbo run lint --dry=json` 에서 스크립트가 있는 태스크 1개(@ax/web), 나머지는 `<NONEXISTENT>` |
| C2 | tokens 에 `type-check` 스크립트가 없습니다 | `turbo run type-check --dry=json` 에서 type-check 태스크 3개(web · ui-react · agentic-ui) |
| C3 | tokens tsconfig include 가 `src/**/*`(1파일)뿐이라 `build-tokens.mjs` · `scripts/*.mjs` · `test/*.mjs` 는 어떤 타입 검사에도 들어가지 않습니다 | `--listFilesOnly` 로 확인 |
| C4 | 공용 lint 설정(`@eslint/js` recommended + `@typescript-eslint` flat/recommended + react-hooks recommended)을 적용하면 세 패키지에서 위반 16건이 나옵니다. 그중 3건은 미사용 구판 `build-tokens.js` 이고 실제 정리 대상은 13건입니다 | tokens 3 · ui-react 3 · agentic-ui 7 |
| C5 | mjs 를 checkJs strict 로 검사하면 201건, noImplicitAny 를 끄면 20건입니다. 표본에서 실제 버그는 0건이고 전부 JSDoc 이 없어 생긴 추론 문제입니다 | 암시적 any 172건(86%) |

### 1.3 목표
1. 세 패키지의 lint 와 tokens 의 type-check 가 CI 에서 실제로 실행되게 합니다(turbo 커버리지 lint 1→4, type-check 3→4).
2. 도입 시점에 위반 0건으로 시작합니다. 경고 강등이나 기준선 고정으로 위반을 남기지 않습니다.
3. tokens 의 JS 는 파일 단위 opt-in 으로 점진 확대하고, 확대 정도를 수치로 볼 수 있게 합니다.
4. 동작(빌드 산출물 · 테스트 결과 · 공개 타입의 사용법)을 바꾸지 않습니다.

### 1.4 범위
- 포함: 루트 공용 ESLint 설정과 devDependencies, 세 패키지 `lint` 스크립트, 위반 13건 정리, tokens `tsconfig.typecheck.json` 과 `type-check` 스크립트, opt-in 첫 묶음(M3 와 겹치지 않는 파일), opt-in 현황 가드
- 제외: 2장 Non-goals 참고

### 1.5 확정 결정 (2026-10-17)
| # | 결정 | 내용 |
|---|---|---|
| D1 | 범위 | 2안. 세 패키지에 lint 를 넣고 위반을 전부 정리합니다. tokens type-check 는 별도 `tsconfig.typecheck.json` 으로 mjs 를 opt-in 합니다(`// @ts-check` 를 붙인 파일만 검사, checkJs 기본 off). include 대상 중 `@ts-check` 가 없는 파일 수를 출력하는 가드를 함께 둡니다(정보 출력, CI 를 막지 않음) |
| D2 | `build-tokens.js` | 삭제합니다. 코드 · 설정 · CI 참조는 0건이고, 문서 언급 3건(`docs/axis-ds-implementation-plan.md` 178행 예시 주석, WI-0025 plan 351행 · todo 172행)은 당시 상황을 적은 이력이라 그대로 둡니다(2026-10-17 사용자 결정) |
| D3 | theme · cli type-check | 이번 범위가 아닙니다. todo 후속 항목으로만 남깁니다 |
| D4 | M3 와의 순서 | WI-0034 를 M3 보다 먼저 머지합니다. 그래서 opt-in 첫 묶음은 M3 가 고치지 않는 파일만 고릅니다. `build-brands.mjs` · `brands.mjs` 와 그 테스트는 M3 머지 뒤로 미룹니다 |
| D5 | 빈 interface | `interface X extends Y {}` 형태를 유지하고, 규칙 옵션을 `allowInterfaces: 'with-single-extends'` 로 둡니다. 한때 type alias 로 바꿨으나 소비자의 선언 병합(TS2300)과 `Separator` 공개 시그니처의 이름 표시가 깨져 되돌렸습니다(2026-10-17 사용자 결정). 공개 API 는 1.2.1 과 같습니다 |

---

## 2. Non-goals (범위 제외)

- **mjs 전체를 checkJs strict 로 켜기(3안)**: 201건을 한 PR 에 넣으면 커지고, 중간에 켜면 CI 가 바로 실패합니다. opt-in 의 최종 목표(strict 201건 vs noImplicitAny off 20건)는 미정입니다.
- **theme(12건) · cli(20건, 실코드 2건 포함) · mcp 의 type-check 와 lint**: D3.
- **apps/web lint 변경**: `next lint` 를 그대로 둡니다. 루트 설정은 `apps/web/**` 를 무시합니다.
- **CI workflow 수정**: 이미 `pnpm lint` · `pnpm type-check` 를 실행하므로 고칠 것이 없습니다.

---

## 3. 요구사항

### 3.1 기능 요구사항
- FR-1: 루트 devDependencies 에 lockfile 에 이미 있는 정확한 버전만 넣습니다(caret 없음): `eslint@9.39.2` · `@eslint/js@9.39.2` · `@typescript-eslint/eslint-plugin@8.53.1` · `@typescript-eslint/parser@8.53.1` · `eslint-plugin-react-hooks@5.2.0` · `globals@14.0.0`. tokens devDependencies 에 `@types/node@22.19.7` 을 명시합니다.
- FR-2: 루트 `eslint.config.mjs` 를 둡니다. `ignores` 에 `**/dist/**` · `**/node_modules/**` · `apps/web/**` 를 넣습니다. ESLint 9 flat config 는 `.gitignore` 를 따르지 않으므로 빌드 뒤에도 dist 가 검사되지 않아야 합니다.
- FR-3: tokens · ui-react · agentic-ui 에 `"lint": "eslint ."` 를 넣습니다.
- FR-4: 위반 13건을 동작 변화 없이 정리합니다. 빈 interface 3개(card · separator · skeleton)는 `extends` 하나만 있는 형태라 규칙 옵션으로 허용하고 코드는 바꾸지 않습니다, 정규식의 불필요한 이스케이프 6건은 제거, case 안 선언 1건은 블록으로 감쌉니다. `build-tokens.mjs` 는 미사용 `dirname` import 를 지우고 빈 catch 2건에 의도 주석을 넣습니다.
- FR-4a: FR-4 가 바꾼 소스(card · separator · surface-renderer)의 사본인 레지스트리 JSON 9개(`apps/web/public/r` · `public/r` · 각 패키지 `registry/r` 의 `card` · `separator` · `agentic-surface-renderer`)를 `pnpm build:registry` 로 다시 만들어 함께 커밋합니다. CI 배포 단계도 `build:registry` 를 실행하지만, 저장소에 커밋된 사본이 소스와 어긋난 채로 남지 않게 하기 위해서입니다. interface 를 되돌린 뒤에는 card · separator 사본이 main 과 같아져, 이 WI 가 남기는 레지스트리 변경은 agentic-surface-renderer 사본 3개입니다.
- FR-5: tokens 에 `tsconfig.typecheck.json`(extends `./tsconfig.json`, rootDir `.`, allowJs, checkJs false, include `src` · `build-tokens.mjs` · `scripts/*.mjs` · `test/*.mjs`)을 두고 `"type-check": "tsc --noEmit -p tsconfig.typecheck.json && node scripts/check-ts-optin.mjs"` 를 넣습니다. 빌드용 tsconfig(tsup dts)는 바꾸지 않습니다.
- FR-6: opt-in 첫 묶음 `scripts/theme-modes.mjs` · `test/theme-modes.test.mjs` · `test/dark-completeness.test.mjs` 에 JSDoc 을 보강하고 `// @ts-check` 를 붙입니다. 세 파일 모두 M3 diff 에 없습니다.
- FR-7: `scripts/check-ts-optin.mjs` 가드는 tsc 와 같은 tsconfig 를 TypeScript API 로 해석해, 대상 파일 중 JS 수와 `@ts-check` 미적용 수 · 파일 목록을 출력합니다. 미적용이 있어도 rc 0 이고, tsconfig 를 읽지 못하거나 대상 JS 가 0개이면 측정 실패 rc 2 입니다.

### 3.2 비기능 요구사항
- **동작 불변**: 기존 테스트 수와 결과가 같고, 빌드 · pack-smoke 가 통과합니다.
- **새 다운로드 없음**: lockfile 에 이미 있는 버전만 쓰므로 `pnpm install --offline` 이 성공해야 합니다.
- **검사 대상 1:1**: ESLint 가 검사한 파일 목록이 `find` 로 센 대상 파일 목록과 같아야 합니다.

---

## 4. MVP 범위

| 단계 | 내용 | 산출물 | 릴리스 |
|---|---|---|---|
| M1 | FR-1~7 | 공용 lint 설정 · 스크립트 · 위반 정리 · tokens type-check · opt-in 첫 묶음 · 가드 | 없음(개발 도구 변경, changeset 없음) |

---

## 5. 수용 기준 (Acceptance Criteria)

- AC1: `turbo run lint --dry=json` 에서 스크립트가 있는 lint 태스크가 1→4(@ax/web · tokens · ui-react · agentic-ui), `turbo run type-check --dry=json` 에서 type-check 태스크가 3→4(+tokens)입니다.
- AC2: `turbo run lint type-check --force --continue` 가 rc 0, 캐시 0 입니다.
- AC3: ESLint 검사 파일이 `find` 목록과 1:1 이고(tokens 10 · ui-react 43 · agentic-ui 29), build 뒤에도 dist 0 입니다.
- AC4: 음성 대조군에서 각 검사가 실제로 실패합니다. lint 는 세 패키지 각각 조건부 `useState` 주입 시 rc 1, tokens src 에 TS2322 주입 시 rc 2, `@ts-check` 파일에 타입 없는 매개변수 주입 시 rc 2(TS7006)입니다. 주입을 지우면 다시 rc 0 입니다.
- AC5: 가드 출력이 opt-in 변화에 따라 움직이고(미적용 5 → `@ts-check` 제거 시 6, 추가 시 4), 측정 실패 경로가 rc 2 입니다.
- AC6: ui-react 공개 타입이 1.2.1 과 같습니다. dist 의 `CardProps` · `SeparatorProps` · `SkeletonProps` 가 interface 이고 `Separator` 시그니처가 `SeparatorProps` 이름을 씁니다. type-check · build · pack-smoke 가 통과하고, 확장 없는 빈 interface(`interface X {}`)는 여전히 lint 오류입니다(음성 대조).
- AC7: lockfile 변경이 importers 추가 · resolver 키 재기록 · deprecated 표시로 한정됩니다.

---

## 6. Assumptions (가정)

- A1: ESLint 9.39.2 · typescript-eslint 8.53.1 · TypeScript 5.9.3 에서만 측정했습니다.
- A2: CI 는 lint 를 build 보다 먼저 실행합니다. dist 무시는 로컬에서 build 뒤 lint 하는 경우를 위한 것입니다.

---

## 7. Risks / Open questions

| # | 내용 | 영향 | 상태 · 대응 |
|---|---|---|---|
| Q1 | `build-tokens.js` 문서 언급 3건을 참조로 볼지 | 낮음 | **해결(2026-10-17 사용자 결정)**: 참조가 아닌 이력으로 보고 파일을 삭제했습니다. 이력 문서는 고치지 않습니다 |
| Q2 | 빈 interface 를 type alias 로 바꾸면 소비자의 선언 병합이 TS2300 으로 깨지고 `Separator` 공개 시그니처에서 `SeparatorProps` 이름이 사라집니다 | 중간 | **해결(2026-10-17 사용자 결정)**: interface 로 되돌리고 `allowInterfaces: 'with-single-extends'` 를 씁니다 |
| Q3 | `eslint@9.39.2` 가 lockfile 재기록 때 deprecated 로 표시됐습니다 | 낮음 | 열림(2026-10-17 사용자 결정: 이번에는 유지하고 후속으로 검토). 버전 고정은 이번 결정(lockfile 기존 버전만)에 따른 것이고, 업그레이드는 별도로 판단합니다 |
| Q4 | M3 rebase 때 tokens `package.json` scripts 블록과 `build-tokens.mjs` 에서 텍스트 충돌이 날 수 있습니다 | 중간 | 해소 방법은 plan 5장에 적었습니다. M3 브랜치 소스에 같은 lint 설정을 적용하면 위반은 main 과 같은 13건뿐이고 M3 가 새로 만든 위반은 0건입니다 |
