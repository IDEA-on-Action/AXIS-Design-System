# WI-0087: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 측정일: 2026-10-26 | 기준 c925ddf 위 작업 트리(origin/main 1ca4025 에는 아직 올리지 않음)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산** · **추정**(실행하지 않음)

## 1. 재현 (수정 전, 발행본 cli 1.7.4)

PRD 1.1 표 그대로예요. 3절 표의 「수정 전」 열이 같은 픽스처를 1.7.4 로 다시 잰 값이에요(측정).

## 2. 단위 테스트 (측정)

| 파일 | 추가 · 변경 | 수정 전 소스 | 수정 후 |
|---|---|---|---|
| `packages/axis-cli/src/theme/theme-add.test.ts` | WI-0087 describe 13항목 추가, 718 주석 갱신(2줄) | rc 1, 9 failed · 62 passed (71) | 71 통과 |
| `packages/axis-cli/src/init/init.test.ts` | WI-0087 describe 20건 추가(V1 ~ V15 행렬 · DEC-6 두 이름 · P1 PnP · 비워크스페이스 상위 · baseDir 없음 · `axis init -y` 호출지), 2073 을 「선언 + 설치 → 침묵」으로(DEC-5) | rc 1, 11 failed · 169 passed (180), 수정 전 기준선 160 passed | 180 통과 |

- theme-add 수정 전 빨강 9건: npm workspaces 루트 tokens(expected 'add' to be 'present'), pnpm-workspace 루트 tokens, 루트 tokens 미설치 설치 줄, 루트 theme(expected true to be false), TW4 루트 설치본 `tailwind.css` 있음, 설치본 `tailwind.css` 없음, 루트 미설치, 앱 · 루트 동시(declaredSource 없음), 루트 tokens < 1.3.0(action add).
- theme-add 수정 전 초록 4건은 종전 동작을 고정하는 음성 대조예요: P1 PnP, P2 lockfile 5종, 워크스페이스가 아닌 상위, Tailwind 3 + 루트 ui-react.
- init 수정 전 빨강: V1 · V2 · V3 · V4 · V8 · V9 · V12 · V13 · V14, DEC-6 두 이름, `axis init -y` 호출지. 초록 9건(V5 · V6 · V7 · V10 · V11 · V15, PnP, 비워크스페이스 상위, baseDir 없음)은 음성 대조예요.
- 단위 테스트의 설치본은 루트 `node_modules` 에 둔 `package.json`(필요하면 `tailwind.css` 1줄) stub 이에요. pnpm 심링크 레이아웃은 3절 실설치 픽스처로 재요.

## 3. 실제 설치 픽스처 (측정)

before 는 발행본 `@axis-ds/cli` 1.7.4, after 는 수정본 `pnpm --filter @axis-ds/cli build`(rc 0) 의 dist 예요. 두 경우 모두 조사 단계 픽스처의 같은 복사본에서 다시 실행했어요.

### 3.1 theme add 의존성 쓰기 (depwrite)

| 픽스처 | 수정 전 1.7.4 | 수정 후 |
|---|---|---|
| fx-npm · fx-pnpm · fx-pnpmhoisted x A · B · C · E(앱 선언 없음, 설치본 있음) 12건 | 앱 `package.json` 에 tokens `^1.6.0` 씀(diff rc 1) | 12건 모두 루트 문구, 앱 쓰기 0(diff rc 0), 설치본이 있어 설치 줄 없음 |
| 같은 15건의 ThemeProvider 안내 | 15건 모두 나옴 | 루트에 theme 를 선언한 B · C · E 9건은 꺼짐, theme 선언이 없는 A 는 유지(DEC-3) |
| 음성 대조 D(앱 선언) 3건 | - | 출력이 전후 바이트 같음 |
| 미설치 6건(3레이아웃 x 루트 tokens · theme `^1.8.0` · `^1.3.0`, `node_modules` 없음) | 6건 모두 앱에 `^1.6.0` 씀, ThemeProvider 안내 | 6건 모두 루트 문구 + 다음 줄 「설치: npm install / pnpm install」(lockfile 따름), 앱 쓰기 0, ThemeProvider 안내 없음, 루트 `^1.3.0` 이어도 범위 안내 없음(DEC-7) |

### 3.2 Tailwind 4 컴포넌트 `tailwind.css` 줄 (tw4comp, 루트에 ui-react 선언)

| 픽스처 | 수정 전 | 수정 후 |
|---|---|---|
| inst-npm · inst-pnpm · inst-pnpmh | 줄 0, 앱 `package.json` 쓰기, 빌드 rc 0, `axis-button-bg-default` 4줄 | 줄 1, 앱 쓰기 0, 빌드 rc 0, 6줄(컴포넌트 클래스 생성) |
| noinst-npm · noinst-pnpm · noinst-pnpmh | 줄 0, 앱 쓰기 | 줄 0 + 「…선언됐지만 설치되지 않아 @import "@axis-ds/ui-react/tailwind.css"; 를 넣지 않았습니다. 설치(<cmd>) 뒤…」 1줄, 앱 쓰기 0 |
| F1(루트 선언, 루트 설치본 1.8.2) | 줄 0, 클래스 4줄 | 줄 1, 빌드 rc 0, 6줄 |
| F3(루트 선언, 미설치) | 줄 0 | 줄 0 + 미설치 안내 1줄, 빌드 rc 0(Can't resolve 없음) |
| 음성 대조 F2(앱 선언, 미설치) | 줄을 넣음, 빌드 rc 1 Can't resolve | 출력 · `globals.css` 전후 바이트 같음(종전) |
| T3(Tailwind 3, 루트 선언) | 파일 3개 | `globals.css` 전후 같음, package.json 줄만 루트 문구(파일 2개) |

1.3.x 설치본(`tailwind.css` 없음) 분기는 실제 설치 픽스처가 없어 단위 테스트로만 확인했어요.

### 3.3 init 애니메이션 줄 (anim 15변형, `axis init -y`)

| 변형 | 수정 전 | 수정 후 |
|---|---|---|
| V1 TW3 루트 선언 + 설치 | 종전 줄 | 침묵 |
| V2 TW3 루트 미설치 | 종전 줄 | 「tailwindcss-animate 는 워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다. pnpm install 뒤 … require("tailwindcss-animate")」 |
| V3 TW4 루트 선언 + 설치 | 종전 줄 | 침묵 |
| V4 TW4 루트 미설치 | 종전 줄 | 루트 미설치 `@import "tw-animate-css"` 안내 |
| V5 · V6 · V10 · V11 미선언 | 종전 줄 | 종전 줄(전후 같음) |
| V7 TW3 루트에 tw-animate-css 만 | 종전 줄 | 종전 줄 |
| V8 TW4 루트에 tailwindcss-animate 만, 미설치 | 종전 줄 | `@plugin "tailwindcss-animate"` 루트 미설치 안내(DEC-6) |
| V9 TW3 앱 선언, 미설치 | 침묵 | 「선언돼 있지만 설치되지 않았습니다」 |
| V12 TW4 앱 선언, 미설치 | 침묵 | `@import` 안내 |
| V13 TW3 앱에 tw-animate-css 만 | 침묵 | 종전 미선언 줄(DEC-6 이름 집합) |
| V14 TW4 앱에 tailwindcss-animate 만 | 침묵 | `@plugin` 안내(DEC-6) |
| V15 앱 선언 + 설치 | 침묵 | 침묵 |

모든 init rc 0 이에요.

### 3.4 PnP 음성 · 양성 대조 (regress-pnp 복사본)

- 픽스처: `.pnp.cjs` 있음, 루트 `devDependencies` 에만 `tailwindcss ^4.1` · tokens · theme · ui-react · tw-animate-css, lockfile 은 루트 `yarn.lock` 뿐. 실제 yarn 설치 없이 `.pnp.cjs` 표지만 둔 픽스처라는 전제가 있어요.
- theme add: 수정 전후 출력 · 앱 `package.json` · `globals.css` 모두 바이트 같음(cmp 0). 앱에 tokens `^1.6.0` 을 쓰고 설치 · ThemeProvider 안내 유지, 컴포넌트 줄 없음.
- init -y: 전후 출력 바이트 같음(종전 「yarn add tw-animate-css」 줄).
- 양성 대조(`.pnp.cjs` 이름만 바꿈): 수정 후 theme add 가 루트 문구 + 「설치: yarn install」 + ui-react 미설치 안내, 앱 쓰기 0. init 은 「tw-animate-css 는 워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다. yarn install 뒤…」. PnP 표지 하나로 판정이 갈림을 확인했어요.

## 4. 변이 (측정)

하네스는 scratchpad `wi0087/impl/verify1/mutate.py` 예요. 기준선(변이 없음)은 theme-add · init · theme-commands · theme-add-rollback 4파일 263건 모두 통과예요. 변이마다 같은 4파일을 실행하고 백업에서 되돌려 sha256 이 주입 전과 같음을 확인했어요(14건 모두 restored, 마지막 `sha256sum -c` OK).

| 변이 | 빨강 |
|---|---|
| ① tokens 판정을 `hasDependency` 로 | 4 |
| ② theme 판정을 `hasDependency` 로 | 1 |
| ③ 컴포넌트 CSS 루트 분기 제거 | 3 |
| ④ `tailwind.css` 파일 존재 게이트 제거 | 3(기존 WI-0086 루트 tailwindcss 미설치 테스트 1건 포함) |
| ⑤a theme add PnP 분기 제거 | 1 |
| ⑤b init PnP 분기 제거 | 1 |
| ⑥ 앱 lockfile(P2) 분기 제거 | 1 |
| ⑦ 루트 미설치 설치 줄 제거 | 1 |
| ⑧ init 설치본 판정 제거 | 8 |
| ⑨ init 호출지 baseDir 제거 | 1 |
| ⑩ DEC-6 TW4 tailwindcss-animate 인정 제거 | 2 |
| x1 DEC-8 덧붙임 줄 제거 | 1 |
| x2 DEC-6 우선순위 뒤집기 | 1 |
| x3 DEC-2 미삽입 안내 렌더 제거 | 2 |

빨강 0인 변이는 없어요. 구현 단계에서 따로 돌린 변이(theme-add M1 ~ M6 · init 3종)도 각각 빨강이었어요.

## 5. 게이트 (측정)

- `npx turbo run lint type-check test --filter=@axis-ds/cli --filter=@axis-ds/mcp --filter=@axis-ds/registry-core --force`: rc 0, Tasks 9/9 성공, Cached 0/9. cli 21 files · 910 tests, mcp 8 files · 181 tests 모두 통과.
- 금지 경로: `git diff --stat origin/main -- packages/axis-registry-core packages/axis-mcp packages/axis-tokens packages/axis-cli/src/theme/brand-core.ts` 0줄. 양성 대조 `-- packages/axis-cli` 는 5파일 +540/-21.
- 기존 테스트 기대 변경은 `init.test.ts` 2073(이름 변경 · 설치본 픽스처 1줄, DEC-5)과 `theme-add.test.ts` 718 주석뿐(diff -U0 확인).
- 검증 뒤 `git status --porcelain --untracked-files=all` 은 소스 · 테스트 5파일 M 뿐, untracked 0, `*.mutbak` 잔여 0.
- 미측정: `pnpm` 전체 build 게이트(cli 단독 build 는 rc 0), Windows.

## 6. 리뷰 결과 (측정 · 미보정)

보정 단계에서 고친 항목은 없어요. 아래는 PRD 5절 확정 대기로 옮겼어요.

- 이미 전역 CSS 에 `@import "@axis-ds/ui-react/tailwind.css";` 가 있어도 루트 선언 · 미설치면 「직접 넣으세요」 안내가 나옴(프로브 E1 · r1, U4).
- 설치본 1.8.1 에 `tailwind.css` 가 없으면 「1.4.0 이상으로 올린 뒤」 문구가 나옴(프로브 E2, U3).
- 심링크 앱 디렉터리 · 깨진 루트 `package.json` · PnP + TW4 앱 tw-animate-css 는 프로브로 정상(E3 · E4 · E5)이지만 저장소 테스트로 고정하지 않았어요.

## 7. 발행 뒤 재측정

- [ ] 발행본(예상 cli 1.7.5)으로 3절 픽스처를 다시 재요.

## 리뷰 후속 · 사용자 재결정 (2026-10-26, Master)

- U3: 설치본이 1.4.0 이상인데 `tailwind.css` 가 없으면 다시 설치를 안내하도록 고침. 테스트 +1(1.8.1 설치본 · 파일 없음). 변이(1.4.0 이상 분기 제거) 1 빨강, 원복 sha 같음.
- U4: 전역 CSS 에 이미 그 줄이 있으면 미룬 목록에서 뺌. 테스트 +1. 변이(필터 제거) 1 빨강, 원복 sha 같음.
- DEC-8 재결정: 루트 출처 upgrade 는 앱 기준 명령 없이 「워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.」만. 기존 WI-0087 테스트를 이 기대로 바꿈(앱 선언 음성 대조는 종전 명령 그대로).
- 위 반영 뒤 `vitest src/theme/ src/init/` 294/294 통과(측정). 위 8번 변이 표의 「x1 DEC-8 덧붙임 줄 제거」는 재결정 전 구현 기준이에요.
