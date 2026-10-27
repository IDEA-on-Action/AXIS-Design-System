# WI-0092: Tailwind 4 animation 선언 · 설치본 판정 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-27 | 기준선 · 게이트 · probe 방법은 [WI-0091 testplan](../WI-0091-check-pnp-root-deps/testplan.md) 1 · 2 · 3 · 5절과 같아요

## 1. Q12 선측정: WI-0074 원 fixture 에 tw-animate-css 가 설치돼 있었나

결론: **설치돼 있지 않았어요.** 그래서 결함 상태를 PASS 로 고정한 세 기대를 WARN 으로 바꿨어요(Q12 의 「설치돼 있지 않았다면」 갈래).

근거
1. 문서: WI-0074 testplan 2절은 h-rootonly-ui 의 animation 을 「WARN → PASS」로만 적었고 설치 여부는 적지 않았어요. 같은 문서 4절은 브리프 픽스처 4종(fx-npm 등)을 npm 레지스트리에서 설치했다고 적었어요. 원 픽스처 실물은 남아 있지 않아요(`/tmp` · 홈 아래 `fx-npm` · `h-rootonly*` 탐색 0건, 경로 탐색 자체는 수행됨).
2. 선언: 테스트 stub(`template-check.test.ts` WI-0074 describe)은 「브리프 측정의 전이 표를 stub 설치본으로 고정」했다고 적었고, h-rootonly-ui 의 선언은 앱 `@axis-ds/tokens` · `@axis-ds/ui-react`, 루트 `tailwindcss` 뿐이에요. WI-0081 testplan 의 같은 앱 dependencies 문구(「워크스페이스 루트에 선언: tailwindcss」)도 이 선언과 맞아요.
3. 전이 의존: `@axis-ds/ui-react` 1.8.0(커밋 4a5e185 시점)은 `tw-animate-css` 를 `peerDependencies` 에 두고 `peerDependenciesMeta.optional: true` 예요. npm 은 optional peer 를 설치하지 않아요.
4. 재현(2026-10-27, npm 10.9.4, 격리 HOME · 캐시, `--ignore-scripts`): 같은 선언으로 npm 워크스페이스를 설치하니 rc 0, 양성 대조 `node_modules/@axis-ds/ui-react` · `tokens` 있음, `tw-animate-css` 는 루트 · 앱 `node_modules` 모두 없음(grep rc 1), `package-lock.json` 의 `node_modules/tw-animate-css` 항목 0개(ui-react 의 peer 표기에만 나옴). 원 픽스처의 npm 버전은 기록이 없어 이 재현은 npm 10.9.4 기준이에요.

## 2. 테스트

### 2.1 기존 기대 변경 (Q12)

| 위치 | 종전 | 이번 |
|---|---|---|
| cli tw4Ok(WI-0065 D8 animation, 1535-1538) | PASS | WARN 「tw-animate-css 선언 없음」 + 새 행: 선언 · 설치본을 갖추면 PASS(종전 문구 바이트) |
| cli WI-0074 h-rootonly-ui(hoisted · isolated 두 레이아웃) | PASS | WARN 전체 문구 |
| mcp WI-0074 h-rootonly-ui(template.test.ts 501-510) | PASS | WARN 전체 문구(CLI 와 같음) |
| cli 2553-2568(AC6 회귀 대조군, 줄 없음) | WARN 종전 문구 | 바뀌지 않음(테스트 그대로 통과) |

### 2.2 새 테스트 (cli 「WI-0092」 6건 · mcp 1건)

| 테스트 | AC | HEAD 소스 |
|---|---|---|
| S1 선언 · 설치 PASS, S2 선언 · 미설치 WARN, S4 유령 설치 WARN | AC1 · AC2 | 빨강 |
| S9 다른 이름만 설치 WARN, `@plugin` 줄은 tailwindcss-animate 로 PASS · WARN | AC3 | 빨강 |
| 두 줄 다 있고 하나만 미설치 → 그 패키지만 안내 | AC2 | 빨강 |
| 호이스팅 루트 선언 · 설치 PASS, 줄 없음 종전 WARN | AC4 · AC5 | 초록(설계대로 대조군) |
| PnP 앱 선언 PASS, 루트 전용 전용 사유 WARN | AC4 | 빨강 |
| 줄은 있는데 미설치여도 animation 은 fail 아님 | Q10 | 빨강(HEAD 는 PASS) |
| MCP: 선언 · 미설치 WARN → 설치본을 두면 PASS | AC6 | (새 행) |

### 2.3 변이

| 변이 | cli 빨강 | mcp 빨강 |
|---|---|---|
| M5 TW4 설치본 검사 제거 | 5 / 197 | 1 / 42 |
| M6 TW4 를 종전처럼 줄만 보고 PASS | 8 / 197 | 2 / 42 |

### 2.4 A/B probe(기존 테스트 전체)

`checkAnimationPlugin` 361회 중 바뀐 결과 3개: tw4Ok, h-rootonly-ui hoisted · isolated(모두 PASS → WARN). 2.1 의 기대 변경과 1:1 이에요.

## 3. 실제 설치 fixture 재측정 (발행본 cli 1.7.5 · mcp 1.4.4 → worktree dist, `WI-0092/` single 10 · mono 10 · pnp 2 · tw3 1)

| fixture | 수정 전 animation | 수정 후 | rc |
|---|---|---|---|
| S2 · P2 · P4 · H3(선언 · 미설치) | PASS | WARN 「미설치(선언만 있음)」 | 그대로 |
| S3 · P5(선언 없음 · 미설치) | PASS | WARN 「선언 없음」 | 그대로 |
| S6(`@plugin "tailwindcss-animate"` 선언 · 미설치) | PASS | WARN 「tailwindcss-animate 미설치(선언만 있음)」 | 그대로 |
| S9(다른 이름만 설치) | PASS | WARN 「tw-animate-css 선언 없음」 | 그대로 |
| S4 · H4(유령 설치, 빌드 성공) | PASS | WARN 「선언 없음」 | 그대로 |
| S1 · S5 · C1 · H1 · H2 · H5 · P1 · P3(정상 · 줄 없음) · S7 · S8 · T1(TW3) · Y1 | 같음 | 같음 | 그대로 |
| Y2(PnP 앱 선언, 캐시에서 빠져 빌드 실패) | PASS | PASS | 그대로. PnP 는 설치본을 읽지 않아 잡지 못해요(잔여) |

빌드를 깨는 8건(S2 · S3 · S6 · S9 · P2 · P4 · P5 · H3)이 모두 PASS 에서 WARN 으로 바뀌었어요. 유령 설치 2건(S4 · H4)은 빌드가 성공하지만 Q9(선언 + 설치본)대로 WARN 이에요. CLI · MCP 줄 대조: 23 앱 × 수정 전 · 후 = 46 쌍, 278줄 모두 같음.

## 4. 추가 결정 A2: 두 줄 규칙의 실제 빌드 근거 (2026-10-27)

질문: CSS 에 `@import "tw-animate-css"` 와 `@plugin "tailwindcss-animate"` 가 함께 있을 때, 한 줄의 패키지만 해석되지 않아도 실제 빌드가 실패하나요? 실패하면 「모든 줄이 선언 · 설치돼야 PASS」 규칙이 맞아요.

방법: `WI-0092/bin/mk-single.sh` 로 단일 앱을 만들고(`tw4base` 실설치본 복사, tailwindcss · @tailwindcss/cli 4.1.14, tw-animate-css 1.4.0, tailwindcss-animate 1.0.7) `app/globals.css` 를 세 줄(`@import "tailwindcss";` + 두 줄)로 바꾼 뒤, 앱 디렉터리에서 `node node_modules/@tailwindcss/cli/dist/index.mjs -i app/globals.css -o out.css` 를 돌렸어요(scratchpad `WI-0092/twoline/D1 ~ D6`).

| fixture | 선언 | 설치본 | 빌드 rc | out.css |
|---|---|---|---|---|
| D1(양성 대조) | 둘 다 | 둘 다 | 0 | 있음(`.animate-in` 2 · `@keyframes enter` 3 · 9867 bytes) |
| D2 | tw-animate-css | tw-animate-css | 1 「Can't resolve 'tailwindcss-animate'」 | 없음 |
| D3 | tailwindcss-animate | tailwindcss-animate | 1 「Can't resolve 'tw-animate-css'」 | 없음 |
| D4 | 없음 | 없음 | 1 「Can't resolve 'tw-animate-css'」 | 없음 |
| D5 | 둘 다 | tw-animate-css 만 | 1 「Can't resolve 'tailwindcss-animate'」 | 없음 |
| D6 | 둘 다 | tailwindcss-animate 만 | 1 「Can't resolve 'tw-animate-css'」 | 없음 |

결론: 두 줄 중 하나라도 해석되지 않으면 빌드가 실패하고 출력 파일이 생기지 않아요(5/5). 양성 대조 D1 만 성공해서 측정 자체는 동작했어요. 그래서 규칙(모든 줄이 선언 · 설치돼야 PASS)을 바꾸지 않았고, 미결로 돌릴 것도 없어요. 「두 줄 다 있고 하나만 미설치 → 그 패키지만 안내」 테스트(2.2)가 이 규칙을 고정해요.

범위: Tailwind 4.1.14 CLI 경로만 쟀어요. `@tailwindcss/postcss` · Vite 플러그인 경로는 이번에 재지 않았어요(조사 단계에서 한 줄 경우는 postcss 경로도 CLI 와 같았음).
