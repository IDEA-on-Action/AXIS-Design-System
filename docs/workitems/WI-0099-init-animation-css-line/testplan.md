# WI-0099: init 애니메이션 안내가 check 와 같은 전역 CSS 줄 판정을 씀 테스트 계획

> PRD: [prd.md](./prd.md) | 계획: [plan.md](./plan.md) | 기준: `main` b1912a5 | 측정일: 2026-10-31 | node 22.22.0

## 1. fixture · 측정 명령

- scratchpad `measure.sh <cli dist> <출력 디렉터리>`. 칸마다 `.git` 이 있는 임시 디렉터리(저장소 밖)를 만들고 `axis init -y` 뒤 `axis check` 를 실행해요. env · 플래그 주입은 없어요.
  - Tailwind 4 앱: `@axis-ds/tokens` · `@axis-ds/ui-react` · `tailwindcss@^4.1.0` · `clsx` · `tailwind-merge` 선언, 설치본 모의(`node_modules/<이름>/package.json`, tailwindcss 4.1.14). npm(`package-lock.json` `{}`).
  - 전역 CSS `app/globals.css`: `@import "tailwindcss";` · tokens tailwind4 · ui-react tailwind.css 줄 + 칸의 애니메이션 줄(`@import "tw-animate-css";` = twa, `@plugin "tailwindcss-animate";` = tca).
  - 칸 이름: `<선언 위치 app|root>-L<줄>-I<선언 + 설치>` · `D<선언만>`. root 는 `workspaces: ["apps/*"]` 루트에 애니메이션 패키지를 선언하고 apps/web 에서 실행.
  - 추가: 두 줄 · 둘 다 설치 등 5칸, 전역 CSS 없음 2칸, `@axis-ds/ui-react` 미선언 2칸, Yarn PnP(`yarn.lock` + `.pnp.cjs`) 5칸, Tailwind 3(`tailwind.config.js` plugins 유무) 3칸.
- 종전: main b1912a5 빌드 사본(scratchpad `base-cli`, `pnpm turbo build --filter=@axis-ds/cli... --force`). 수정: worktree 빌드(같은 명령, Cached 0).
- 표: scratchpad `table.mjs`(두 측정의 summary 를 칸별로 줄임). 「어긋남」은 init 침묵과 check PASS 가 일치하지 않는 칸이에요(check 항목이 없으면 -).

## 2. 착수 측정

### 2.1 원인 위치

cli `init/init.ts` `animationGuideLine` 은 선언 · 설치본만 보고(WI-0087 DEC-4), Tailwind 4 이름 집합(DEC-6) 가운데 하나라도 선언 · 설치면 침묵했어요. 전역 CSS 를 읽지 않아요. check 는 registry-core `checkAnimationPlugin` 이 CSS 줄마다 그 줄의 패키지를 봐요(WI-0092).

### 2.2 init 안내 · check 판정 (측정, 37칸, 종전 · 수정 함께)

| 칸 | 종전 init | 수정 init | check(수정 전후 같음) | 종전 어긋남 | 수정 어긋남 |
|---|---|---|---|---|---|
| app-Ltwa-Itwa | 침묵 | 침묵 | PASS |  |  |
| app-Ltwa-Itca (S9) | 침묵 | 쓸 수 없음(tw-animate-css 선언 없음) npm install tw-animate-css + 줄 바꾸기 대안 | WARN(tw-animate-css 선언 없음) | 어긋남 |  |
| app-Ltwa-Inone | ① npm install tw-animate-css | 쓸 수 없음(tw-animate-css 선언 없음) npm install tw-animate-css | WARN(tw-animate-css 선언 없음) |  |  |
| app-Ltca-Itwa (S9 거울) | 침묵 | 쓸 수 없음(tailwindcss-animate 선언 없음) npm install tailwindcss-animate + 줄 바꾸기 대안 | WARN(tailwindcss-animate 선언 없음) | 어긋남 |  |
| app-Ltca-Itca | 침묵 | 침묵 | PASS |  |  |
| app-Ltca-Inone | ① npm install **tw-animate-css** | 쓸 수 없음(tailwindcss-animate 선언 없음) npm install tailwindcss-animate | WARN(tailwindcss-animate 선언 없음) | 방향 |  |
| app-Lnone-Itwa | 침묵 | 줄 없음(tw-animate-css 설치됨) | WARN 없음(줄 없음) | 어긋남 |  |
| app-Lnone-Itca | 침묵 | 줄 없음(tailwindcss-animate 설치됨) | WARN 없음(줄 없음) | 어긋남 |  |
| app-Lnone-Inone | ① npm install tw-animate-css | ① 그대로 | WARN 없음(줄 없음) |  |  |
| root-Ltwa-Itwa | 침묵 | 침묵 | PASS |  |  |
| root-Ltwa-Itca (S9) | 침묵 | 쓸 수 없음(tw-animate-css 선언 없음) npm install tw-animate-css + 줄 바꾸기 대안 | WARN(tw-animate-css 선언 없음) | 어긋남 |  |
| root-Ltwa-Inone | ① npm install tw-animate-css | 쓸 수 없음(tw-animate-css 선언 없음) npm install tw-animate-css | WARN(tw-animate-css 선언 없음) |  |  |
| root-Ltca-Itwa (S9 거울) | 침묵 | 쓸 수 없음(tailwindcss-animate 선언 없음) npm install tailwindcss-animate + 줄 바꾸기 대안 | WARN(tailwindcss-animate 선언 없음) | 어긋남 |  |
| root-Ltca-Itca | 침묵 | 침묵 | PASS |  |  |
| root-Ltca-Inone | ① npm install **tw-animate-css** | 쓸 수 없음(tailwindcss-animate 선언 없음) npm install tailwindcss-animate | WARN(tailwindcss-animate 선언 없음) | 방향 |  |
| root-Lnone-Itwa | 침묵 | 줄 없음(tw-animate-css 설치됨) | WARN 없음(줄 없음) | 어긋남 |  |
| root-Lnone-Itca | 침묵 | 줄 없음(tailwindcss-animate 설치됨) | WARN 없음(줄 없음) | 어긋남 |  |
| root-Lnone-Inone | ① npm install tw-animate-css | ① 그대로 | WARN 없음(줄 없음) |  |  |
| app-Ltwa-Dtwa | ③ tw-animate-css | 쓸 수 없음(tw-animate-css 미설치(선언만 있음)) npm install | WARN(tw-animate-css 미설치(선언만 있음)) |  |  |
| root-Ltwa-Dtwa | ③ tw-animate-css(루트) | 쓸 수 없음(tw-animate-css 미설치(선언만 있음)) 워크스페이스 루트에서 npm install | WARN(tw-animate-css 미설치(선언만 있음)) |  |  |
| app-Ltwa-Iboth | 침묵 | 침묵 | PASS |  |  |
| app-Lboth-Itwa | 침묵 | 쓸 수 없음(tailwindcss-animate 선언 없음) npm install tailwindcss-animate + 줄 지우기 대안 | WARN(tailwindcss-animate 선언 없음) | 어긋남 |  |
| app-Lboth-Iboth | 침묵 | 침묵 | PASS |  |  |
| app-Ltwa-Dtca | ③ **tailwindcss-animate** | 쓸 수 없음(tw-animate-css 선언 없음) npm install tw-animate-css | WARN(tw-animate-css 선언 없음) | 방향 |  |
| app-Ltca-Dtwa | ③ **tw-animate-css** | 쓸 수 없음(tailwindcss-animate 선언 없음) npm install tailwindcss-animate | WARN(tailwindcss-animate 선언 없음) | 방향 |  |
| app-nocss-Itwa | 침묵 | 침묵 | WARN 없음(globalCss 없음) (rc 1) | 어긋남 | 어긋남(Q143) |
| app-nocss-Itca | 침묵 | 침묵 | WARN 없음(globalCss 없음) (rc 1) | 어긋남 | 어긋남(Q143) |
| app-noui-Lnone-Inone | ① npm install tw-animate-css | ① 그대로 | 항목 없음 | - | - |
| app-noui-Ltwa-Itca | 침묵 | 쓸 수 없음(tw-animate-css 선언 없음) npm install tw-animate-css + 줄 바꾸기 대안 | 항목 없음 | - | -(Q145) |
| pnp-app-Ltwa-Itca | 침묵 | 쓸 수 없음(tw-animate-css 선언 없음) yarn add tw-animate-css + 줄 바꾸기 대안 | WARN(tw-animate-css 선언 없음) | 어긋남 |  |
| pnp-app-Ltwa-Itwa | 침묵 | 침묵 | PASS |  |  |
| pnp-app-Lnone-Itwa | 침묵 | 줄 없음(tw-animate-css 선언됨) | WARN 없음(줄 없음) | 어긋남 |  |
| pnp-root-Ltwa-Itca | ① yarn add tw-animate-css | 쓸 수 없음(tw-animate-css 선언 없음) yarn add tw-animate-css | WARN(tw-animate-css 선언 없음) |  |  |
| pnp-root-Ltwa-Itwa | ① yarn add tw-animate-css | ① 그대로(WI-0095 범위) | WARN(tw-animate-css 가 워크스페이스 루트에만 선언돼 Plug'n'Play 에서 앱이 해석하지 못합니다) |  |  |
| tw3-Pyes-Iyes | 침묵 | 침묵 | PASS (rc 1) |  |  |
| tw3-Pno-Iyes | 침묵 | 침묵 | WARN 없음(plugins 에 없음) (rc 1) | 어긋남 | 어긋남(Q146) |
| tw3-Pyes-Ino | ① npm install tailwindcss-animate | ① 그대로 | WARN 없음(tailwindcss-animate 선언 없음) (rc 1) |  |  |

- 줄임말: ① 「Dialog · Select 등의 … 플러그인이 필요합니다. <명령> 뒤 …」(WI-0087 미선언), ③ 「<이름> 는 (워크스페이스 루트에) 선언돼 있지만 설치되지 않았습니다. …」, 「쓸 수 없음」 · 「줄 없음」은 이 WI 의 새 문구(release-notes 「바뀐 점」), 「방향」은 둘 다 경고하지만 init 이 줄과 다른 패키지를 안내한 칸(굵게).
- 집계: 침묵 · WARN 어긋남 종전 15 → 수정 3(Q143 2 · Q146 1), 방향 어긋남 4 → 0. init rc 는 37칸 모두 0(수정 전후 같음). check rc 1 칸은 다른 항목(globals.css FAIL · content FAIL) 때문이에요.
- `pnp-root-Ltwa-Itca` 는 루트에 `tailwindcss-animate` 만 선언돼 있고 줄은 `tw-animate-css` 라, 줄의 패키지가 아무 데도 선언되지 않은 칸이에요(루트 전용 사유가 아님). 새 판정이 쓰이고 대안은 내지 않아요(PnP 에서 루트 선언은 쓸 수 있는 패키지로 치지 않음, 종전 경계 그대로).

### 2.3 수정 후 비교 (측정)

- check 출력 37개: 수정 전후 바이트 같음(`cmp`).
- init 출력 37개: 다른 파일 21개, 다른 줄은 모두 「애니메이션:」 줄(그 밖의 줄 차이 0).
- init 이 쓴 파일(`axis.config.json` · `utils.ts` · `package.json`) 123개: sha256 목록 같음.

### 2.4 안내대로 고친 뒤 check (측정, scratchpad `smoke.sh`, 설치는 선언 + `node_modules` 모의)

| 칸 | 따른 안내 | check animation 전 → 후 |
|---|---|---|
| S9(app-Ltwa-Itca) | 새 대안: 줄을 `@plugin "tailwindcss-animate";` 로 바꿈 | WARN → PASS |
| S9(app-Ltwa-Itca) | 새 설치 안내: `tw-animate-css` 선언 · 설치 | WARN → PASS |
| app-Ltca-Inone | 새 설치 안내: `tailwindcss-animate` 선언 · 설치 | WARN → PASS |
| app-Ltca-Inone | **종전** 안내: `tw-animate-css` 설치 + `@import "tw-animate-css";` 추가 | WARN → WARN(같은 사유) |
| app-Lnone-Itwa | 새 「줄 없음」 안내: `@import "tw-animate-css";` 추가 | WARN → PASS |
| app-Lboth-Itwa | 새 대안: `@plugin "tailwindcss-animate";` 줄 지움 | WARN → PASS |
| root-Ltwa-Dtwa | 새 안내: 워크스페이스 루트 `node_modules` 에 설치 | WARN → PASS |

## 3. 테스트 (새로 더함)

cli `src/wi-0099-init-animation-css.test.ts`(28건). fixture 는 테스트가 임시 디렉터리에 만들고 지워요.

| describe | 건수 | 내용 |
|---|---|---|
| init 애니메이션 안내 = check 판정(측정 표 대표 칸) | 21 | A1 ~ A13(앱 선언), R1 ~ R4(루트 선언), P1 ~ P3(PnP 앱 선언), V1(상대 `@import` 하위 파일 출처). `resolveInitAnswers` + `runInit`(init -y 경로)의 애니메이션 줄 전체 문장과 `checkAnimationPlugin` severity, 그리고 「init 침묵 ⇔ check PASS」 |
| 종전 동작을 지키는 칸(음성 대조) | 4 | CSS 없음(Q143), PnP 루트 전용(WI-0095 범위, check 문구 함께), CSS 를 고르지 못하는 직접 호출의 DEC-6 우선순위, Tailwind 3 |
| inspectTailwind4Animation | 2 | 사유 · 선언 위치(`root: true`) · check 문구와 같은 사유 문자열, CSS 없음 |
| 종료 코드 · 쓰기 | 1 | S9 에서 rc 0, package.json dependencies 불변(utils 의존성이 이미 있음), CSS 불변 |

바뀐 기존 테스트는 없어요. WI-0087 · WI-0096 의 `animationGuideLine` 직접 호출 테스트는 CSS 파일이 없는 fixture 라 종전 판정 그대로 통과해요(Q143 경로).

## 4. 음성 대조 · 변이 (측정)

| 조건 | 결과 |
|---|---|
| `init.ts` 를 main(b1912a5)으로 되돌림(registry-core 는 수정본, 테스트가 공용 함수를 import 하므로) | 15 빨강 · 13 초록. 빨강은 init 출력이 바뀐 칸 전부(A2 A3 A5 A6 A7 A8 A10 A12 A13 R1 R2 R3 P1 P2 V1), 초록은 init 출력이 그대로인 칸 6(A1 A4 A11 R4 P3 침묵 · A9 종전 ① 줄) · 음성 대조 4 · 공용 함수 2 · 종료 코드 1 |
| 변이 1: PnP 루트 전용 사유에서 새 판정을 끄는 조건 제거 | 1 빨강(PnP 루트 전용 음성 대조) |
| 변이 2: 대안 문구 제거(`usable` 을 비움) | 6 빨강(A2 A3 A10 R1 P1 V1) |

변이 뒤 수정본은 백업 사본으로 되돌리고 sha256(`14ce3ffc…`)이 같은지 확인했어요.

## 5. 검증 (패키지 스크립트 직접 실행, turbo 캐시 없음)

| 명령 | rc | 결과 |
|---|---|---|
| `pnpm --filter @axis-ds/registry-core run type-check` | 0 | |
| `pnpm --filter @axis-ds/registry-core run lint` | 0 | |
| `pnpm --filter @axis-ds/cli run type-check` | 0 | |
| `pnpm --filter @axis-ds/cli run lint` | 0 | |
| `pnpm --filter @axis-ds/cli run test` | 0 | 26 파일 · 1266 통과(새 28 포함) |
| `pnpm --filter @axis-ds/mcp run type-check` | 0 | |
| `pnpm --filter @axis-ds/mcp run lint` | 0 | |
| `pnpm --filter @axis-ds/mcp run test` | 0 | 10 파일 · 251 통과(새 worktree 는 tokens dist 가 없어 `tokens-sync.test.ts` 가 모듈을 못 찾았고, `pnpm turbo build --filter=@axis-ds/mcp... --force` 뒤 통과) |
| `pnpm check-changeset-mcp-tokens` | 0 | registry-core 변경 1개 → cli · mcp 함께 올림 확인, 스크립트 테스트 19/19 |

registry-core 는 테스트 러너가 없어 공용 함수 테스트는 cli 에 있어요.
