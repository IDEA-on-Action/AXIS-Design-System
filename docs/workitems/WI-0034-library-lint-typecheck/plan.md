# WI-0034 구현 계획

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 작성일: 2026-10-17 | 기준: `origin/main` f41fa79
> 채택: 2안(lint 전수 정리 + tokens JS opt-in + 미적용 가드). 줄 번호와 건수는 2026-10-17 실측값이며, 코드가 바뀌면 낡으므로 다시 잴 때는 착수 시점에 확인합니다.

## 1. 수정 파일

| # | 파일 | 변경 |
|---|---|---|
| 1 | `package.json` | devDependencies 6개 추가(정확한 버전, caret 없음): `@eslint/js` 9.39.2 · `@typescript-eslint/eslint-plugin` 8.53.1 · `@typescript-eslint/parser` 8.53.1 · `eslint` 9.39.2 · `eslint-plugin-react-hooks` 5.2.0 · `globals` 14.0.0 |
| 2 | `eslint.config.mjs` (신규) | `@eslint/js` recommended + `@typescript-eslint` flat/recommended + react-hooks recommended 규칙, 전역은 browser + node. ignores: `**/dist/**` · `**/node_modules/**` · `**/.turbo/**` · `**/coverage/**` · `apps/web/**`. 규칙 `@typescript-eslint/no-empty-object-type` 에 `allowInterfaces: 'with-single-extends'` |
| 3 | `packages/axis-{tokens,ui-react,agentic-ui}/package.json` | `"lint": "eslint ."`. tokens 는 `type-check` 스크립트와 devDependencies `@types/node` 22.19.7 도 추가 |
| 4 | `pnpm-lock.yaml` | importers 추가(루트 6 · tokens 1), eslint 9.39.2 deprecated 표시, `eslint-import-resolver-typescript` 계열 resolver 키 재기록(+30/-8) |
| 5 | `packages/axis-ui-react/src/{card,separator,skeleton}/index.tsx` | 빈 interface `XProps extends Y {}` 를 `type XProps = Y` 로 변경, 주석의 「인터페이스」를 「타입」으로 변경 |
| 6 | `packages/axis-agentic-ui/src/surface-renderer/index.tsx` | `case "table":` 본문을 블록 `{ }` 으로 감쌈(no-case-declarations) |
| 7 | `packages/axis-agentic-ui/src/tool-call-card/tool-call-card.test.tsx` | 정규식 `/\"query\": \"hello\"/` 의 불필요한 `\"` 이스케이프 제거(같은 패턴) |
| 8 | `packages/axis-tokens/build-tokens.mjs` | 미사용 `import { dirname } from 'path'` 삭제, 임시 파일 삭제 `catch {}` 2곳에 의도 주석 |
| 9 | `packages/axis-tokens/tsconfig.typecheck.json` (신규) | extends `./tsconfig.json`, rootDir `.`, noEmit, allowJs, checkJs false, types `node`. include `src/**/*` · `build-tokens.mjs` · `scripts/*.mjs` · `test/*.mjs`, exclude `test/fixtures` |
| 10 | `packages/axis-tokens/scripts/check-ts-optin.mjs` (신규, `@ts-check`) | opt-in 현황 가드(prd FR-7) |
| 11 | `packages/axis-tokens/scripts/theme-modes.mjs` | `// @ts-check` + JSDoc(매개변수 · 반환 타입, 내부 walk 함수, 결과 배열 타입). 실행 코드 변경 없음. Style Dictionary 는 `import('style-dictionary')` 타입 참조만 씀 |
| 12 | `packages/axis-tokens/test/{theme-modes,dark-completeness}.test.mjs` | `// @ts-check` + JSDoc. 실행 코드 변경 없음 |

빌드용 `packages/axis-tokens/tsconfig.json`(tsup dts)과 CI workflow 는 바꾸지 않습니다. `packages/axis-tokens/build-tokens.js` 는 삭제했습니다(prd D2 · Q1).

## 2. 순서

1. 기준선 측정: `turbo run lint --dry=json` · `turbo run type-check --dry=json` 에서 태스크 수(1 · 3)
2. 의존성 추가 후 `pnpm install --offline` 으로 새 다운로드가 없음을 확인
3. 공용 설정 · 스크립트를 넣고 위반 목록을 측정(13건, synth 실측과 같음)
4. 위반 정리 → 패키지별 `eslint .` rc 0
5. tokens `tsconfig.typecheck.json` → `--listFilesOnly` 로 대상 확인 → opt-in 첫 묶음에 `@ts-check` 를 붙여 오류를 세고(theme-modes.mjs 30 · theme-modes.test 5 · dark-completeness.test 2) JSDoc 으로 0건
6. 가드 추가, `type-check` 스크립트에 연결
7. 4장 검증

## 3. opt-in 첫 묶음 선정

| 파일 | M3 diff(`git diff origin/main...origin/feat/wi-0025-m3-ontology --name-only`) | `@ts-check` 시 오류 | 판정 |
|---|---|---|---|
| `scripts/theme-modes.mjs` | 없음 | 30 (매개변수 암시적 any 21 · never 추론 6 · 암시적 반환 any 2 · `{}` 속성 1) | **포함** |
| `test/theme-modes.test.mjs` | 없음 | 5 | **포함** |
| `test/dark-completeness.test.mjs` | 없음 | 2 | **포함** |
| `scripts/check-ts-optin.mjs` | 신규 | 0 | **포함**(처음부터 `@ts-check`) |
| `build-tokens.mjs` | 있음 | 16 | M3 머지 뒤 |
| `scripts/brands.mjs` · `scripts/build-brands.mjs` · `test/brands.test.mjs` · `test/build-brands.test.mjs` | 있음(main 과도 add/add 충돌) | 미측정(build-brands 9, synth) | M3 머지 뒤 |

가드 출력(도입 시점): `ts opt-in: 대상 10개 중 JS 9개 · @ts-check 4개 · 미적용 5개`

## 4. 검증 결과 (2026-10-17, f41fa79 위)

| 축 | 명령 | 결과 |
|---|---|---|
| 커버리지(lint) | `pnpm exec turbo run lint --dry=json` (task 이름으로 필터, `<NONEXISTENT>` 제외) | 1 → **4** (@ax/web · agentic-ui · tokens · ui-react) |
| 커버리지(type-check) | `pnpm exec turbo run type-check --dry=json` | 3 → **4** (+tokens) |
| 빌드 | `pnpm exec turbo run build --force` (단독 선행) | rc 0, 8/8, cached 0 |
| 실행 | `pnpm exec turbo run lint type-check --force --continue` | rc 0, 12/12(lint 4 · type-check 4 · 의존 build 4), cached 0 |
| 테스트 | `pnpm exec turbo run test --force --continue` | rc 0, 5/5, cached 0. tokens 69 · ui-react 100 · agentic-ui 72 · theme 31 · cli 58 통과 |
| 검사 대상 1:1 | 패키지별 `eslint . -f json` 파일 목록 vs `find`(node_modules · dist · .turbo 제외) | tokens 10 = 10 · ui-react 43 = 43 · agentic-ui 29 = 29, `diff` rc 0, dist 0 |
| dist 무시 대조군 | build 뒤 `eslint --no-ignore dist` | 검사 대상 tokens 7 · ui-react 155 · agentic-ui 95 (dist 가 실제로 있고, ignores 가 막고 있음) |
| 음성 대조군(lint) | 각 패키지 `src/__neg-hooks.tsx` 에 조건부 `useState` | 세 패키지 모두 rc 1, rules-of-hooks 1건. 삭제 후 rc 0 |
| 음성 대조군(type-check src) | `src/tailwind-preset.ts` 에 `const __neg: number = "s"` | rc 2, TS2322 1건. 원복 후 rc 0 |
| 음성 대조군(opt-in) | (a) `dark-completeness.test.mjs` 에 `function __neg(a)` | rc 2, TS7006 1건 |
| | (b) 같은 주입에서 `@ts-check` 제거 | rc 0, TS7006 0건, 가드 미적용 5 → 6 (0건이 미검사일 수 있음을 가드가 드러냄) |
| | (c) `build-tokens.mjs` 에 `@ts-check` 추가 | rc 2, 오류 16건, 가드 미적용 5 → 4 |
| 가드 측정 실패 | JS 가 없는 tsconfig 로 실행 | rc 2, 「대상에 JS 파일이 없습니다」 |
| 회귀(ui-react) | type-check · build · `node scripts/pack-smoke.mjs` | 모두 rc 0, pack-smoke 6/6 |
| 회귀(소비 측 타입) | dist `index.d.ts` 를 쓰는 소비 파일(skipLibCheck false): `interface X extends CardProps` · `SeparatorProps` · `SkeletonProps`, 인덱스 접근, `Omit`, `React.ComponentProps<typeof Card>`, 래퍼 컴포넌트, `@ts-expect-error` 음성 1건 | rc 0 (`@ts-expect-error` 가 소비되어 검사가 실제로 수행됨) |
| 회귀(선언 병합) | 빈 interface 를 type alias 로 바꿨을 때 `declare module '@axis-ds/ui-react' { interface CardProps { ... } }` | type alias 판에서 rc 2(TS2300)를 실측해 interface 로 되돌렸습니다(prd Q2). 되돌린 뒤 dist 의 세 Props 는 interface 입니다 |
| 회귀(공개 .d.ts 시그니처) | dist `separator/index.d.ts` 의 `declare const Separator` | `ForwardRefExoticComponent<SeparatorProps & React.RefAttributes<HTMLDivElement>>` 로 1.2.1 과 같습니다(type alias 판에서는 펼쳐진 형태였음) |
| 레지스트리 사본 동기화 | `pnpm build:registry` 뒤 `git status --short` 와 `git diff origin/main -- <card · separator 사본>` | 재생성 뒤 변경 0. card · separator 사본 6개는 main 과 같고, agentic-surface-renderer 사본 3개만 이 WI 의 변경입니다 |
| lockfile | `git diff --stat pnpm-lock.yaml`, `pnpm install --offline`, `pnpm install --frozen-lockfile --offline` | +30/-8, 오프라인 설치 rc 0(새 다운로드 0), frozen rc 0. 변경 내용은 1장 4행 |
| 원복 확인 | 음성 대조군 전후 `git diff` sha256 | 동일 |

빌드가 다시 만든 `apps/web/public/templates/*.json` 5개는 `git checkout` 으로 되돌렸습니다.

## 5. WI-0025 M3 rebase 체크리스트

M3 브랜치 끝(870969f)의 tokens · ui-react · agentic-ui 소스에 이 WI 의 lint 설정을 그대로 적용하면 위반은 main 과 같은 13건(build-tokens.mjs 3 · card/separator/skeleton 3 · surface-renderer 1 · tool-call-card.test 6)이고, M3 가 새로 만든 위반은 0건입니다. 이 13건은 이 WI 가 main 에서 고칩니다.

- tokens `package.json` scripts: M3 는 `test` 줄을, 이 WI 는 `lint` · `type-check` 줄을 바꿉니다. 인접 줄 충돌이 나면 세 줄을 모두 살립니다. M3 의 `test` 목록을 쓰되 `lint` · `type-check` 는 이 WI 값을 유지합니다.
- `build-tokens.mjs`: 이 WI 는 3행(`dirname` import 삭제)과 임시 파일 삭제 catch 2줄만 바꿉니다. 충돌 시 M3 쪽 변경에 이 세 줄을 다시 적용합니다.
- `ui-react/src/card/index.tsx`: 이 WI 는 이 파일을 바꾸지 않습니다(interface 유지). M3 의 13행 변경과 충돌하지 않습니다.
- rebase 뒤 `pnpm lint` · `pnpm type-check` 를 실행하고, 가드 출력의 미적용 수가 M3 의 JS 파일 증감과 맞는지 확인합니다.
