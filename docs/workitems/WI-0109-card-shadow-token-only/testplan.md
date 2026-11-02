# WI-0109: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-11-02 | 상태: 측정 완료(2026-11-02)
> 환경: node v22.22.0 · pnpm 9.15.4 · WSL2 Linux x64 · vitest 2.1.9 · Tailwind 3.4.19(워크스페이스) · Tailwind 4.1.11(임시 디렉터리 설치)

## 1. 단위 · 패리티 테스트 (AC1)

`packages/axis-cli/src/template/template-checks.test.ts` 에 경계 사례를 목록으로 넣었어요. 목록마다 기대값을 문자열 경로와 `cn()` 분할 경로 두 갈래로 단언해요. 목록 전체는 `UNIT_INPUTS` 파일로 써서, 패리티 테스트가 두 구현(registry-core · 템플릿 스크립트)이 같은 결과를 내는지 함께 봐요.

| 목록 | 기대 | 담은 것 |
|---|---|---|
| `SHADOW_CLASS_FIXED` | card-shadow 1건 | 힌트가 붙은 고정값, `!shadow-md` · `shadow-md!` · `shadow-lg/50`, 폴백 · 고정 레이어를 섞은 토큰, 진짜 카드의 `--axis-shadow-lg`, 모양 단위의 힌트 없는 값(`shadow-[var(--x)]`), `--axis-` 접두가 아닌 shadow 이름, 빈 값, 대문자 변수 이름, `[-webkit-box-shadow:…]` 고정값 |
| `SHADOW_CLASS_PASS` | 0건 | 진짜 카드의 `var(--axis-card-shadow…)`, 모양 단위의 `--axis-shadow-lg`, 그림자 색 클래스(`current` · `border` · `ring` 등), `[-webkit-box-shadow:var(--axis-card-shadow)]` |
| `SHADOW_CLASS_PASS_PALETTE` | card-shadow 0 · palette 전 줄 | `shadow-[shadow:0_0_#0000]`, `shadow-white` 처럼 팔레트 색이 든 그림자 없음 · 색 |
| `SHADOW_TSX_FIXED` · `SHADOW_TSX_PASS` | 1건 · 0건 | `<Card style` 의 `boxShadow` · 재정의 키 · 계산 키, 문자열 연결(`+` · `||`) · 템플릿 리터럴 · `as const`, `! important` |
| `SHADOW_CSS_FIXED` · `SHADOW_CSS_PASS` | 1건 · 0건 | 선언마다 판정(`-webkit-` · `-moz-` · `--my-box-shadow`), 카드 규칙 `@apply`(`@APPLY` 대문자 포함), 카드 규칙 안 그림자 토큰 재정의, 빈 값, `! important` |
| `SHADOW_CSS_PASS_PALETTE` | card-shadow 0 · palette 전 줄 | `box-shadow: 0 0 #0000` |
| 현재 동작 고정(tsx · 클래스 · CSS) | 적힌 값 그대로 | prd 「알려진 한계」 사례(작은따옴표 `className='…'`, TS 제네릭, 삼항 style, `rounded-t-lg`, `[--tw-shadow:…]`, `inherit` · `0 0 transparent`) |

- FR-8 스크립트 문구는 stdout 단언 7건으로 고정했어요(문자열 묶음 2 · style boxShadow 1 · 클래스 묶음 「Card」 접두 1 · 재정의 키 1 · 연결식 꼬리 문구 1 · CSS 선택자 1).
- 결과(직접 재실행, 2026-11-02): cli `template-checks.test.ts` rc 0 · 282 passed, mcp `template-checks.test.ts` rc 0 · 13 passed.
- 두 구현 대조(측정): TS 를 transpile 해 최상위 선언을 정규화 비교하니 공유 52개 중 50개가 같았어요. 다른 2개(`closeMatcher` · `classUnits`)는 상수 이름과 따옴표 표기만 달라요. HEAD 에서도 같은 2개가 달라 이번 변경과 무관해요. 목록 밖 경계 사례 70종을 esbuild 번들과 스크립트 실제 실행에 넣었을 때도 불일치 0건이에요.

## 2. 레지스트리 · 템플릿 원본 (AC2)

- 레지스트리 전 컴포넌트를 넣은 사본: 위반 `rows=[]` 유지(패리티 테스트 통과).
- 템플릿 원본: 위반 0건 유지.

## 3. 코퍼스 A/B (AC3)

코퍼스는 ontology-console 템플릿 `files` 전체, `r/*.json` 의 `files[].content`, `packages/axis-ui-react/src` · `packages/axis-agentic-ui/src` 를 합친 138파일이에요.

| 판 | 위반 | HEAD 대비 |
|---|---|---|
| HEAD 스크립트 | 9건 | - |
| 신판 스크립트 | 9건 | 차이 0 (새 palette 0건 포함) |
| 템플릿 5개 전체(170파일, 참고) | HEAD 21 · 신판 21 | 차이 0 |

- 양성 대조군: 토큰 면제를 끈 변이는 133파일 코퍼스(1회차 정의)에서 26건으로 card-shadow 18줄이 새로 생겼어요(card · select · toast · dropdown-menu · popover 9파일). 이 코퍼스로 판정 차이가 드러난다는 뜻이에요.

## 4. 변이 검증 (AC4)

registry-core TS 사본만 바꿔 vitest 별칭으로 cli 테스트를 돌렸어요(양성 대조: 보고 두 줄을 지운 변이 rc 1 · 85건 실패로 별칭 적용 확인). 「공개 템플릿 JSON 동기화」 테스트로만 잡힌 경우는 잡은 것으로 세지 않았어요(이번 회차에서 그 테스트는 0건 실패).

| 변이 | rc | 실패 |
|---|---|---|
| 토큰 면제 끔 · 힌트 무시 · 카드 단위 구분 없앰(1회차, TS) | 1 | 29 · 15 · 8 |
| 같은 세 변이(1회차, mjs) | 1 | 패리티 실패 |
| m1 모양 단위의 힌트 없는 값을 토큰으로 | 1 | 4 |
| m7 `--axis-` 접두 조건 제거 | 1 | 4 |
| m10 style 값의 「문자열 하나로 끝남」 조건 제거(회귀 되살림) | 1 | 5 (boxShadow 쪽만 4 · 재정의 키 쪽만 3) |
| m11 `! important` 공백 허용 제거 | 1 | 4 |
| m12 빈 값을 그림자 없음으로 | 1 | 5 |
| m13 `@apply` 대소문자 구분 | 1 | 3 |
| m14 card 허용 이름 비교에 `toLowerCase` | 1 | 3 |

- 2회차 검증에서 m1 · m7 은 249건을 모두 통과(살아남음)했어요. 그래서 그 사례를 테스트에 넣었고, 3회차에서 살아남은 변이는 0/9 예요.
- 변이 실행 뒤 레포 파일은 sha256 · `git status` 로 원본과 같은 것을 확인했어요.

## 5. 적대 입력 시간 · 작업량 (AC5)

- WI-0109 가 더한 적대 입력 테스트는 값 판정 21종(8,000자 이름, 깊은 대괄호, 많은 쉼표 레이어, CSS 선언 반복, 공백 22만 자 계산 키, style 문자열 연결 반복 등)과 겹친 묶음 3종이에요. 상한은 각각 500ms, 그림자 없는 같은 모양의 1.6배예요. 1회차에 잰 19종은 각 3 ~ 36ms 였고, 이후 더한 것을 포함해 전체가 통과해요(1절 282 passed).
- 구현 중 결함 1건을 이 테스트가 잡았어요. `normalizeShadowValue` 가 이어 붙이는 문자열을 글자 단위로 다시 읽어 2차 시간이 났고(CSS 쉼표 레이어 250KB 18.5초, 같은 입력에 HEAD 0.05초), 글자 배열과 직전 글자 변수로 바꿔 0.08초가 됐어요.
- 설계안의 var 정규식 `/^var\(--axis-[\w-]*shadow[\w-]*\)$/` 은 25만 자 입력에서 6,610ms 라 쓰지 않았어요. 이름을 먼저 뽑고 `includes` 로 보는 구현은 1ms 예요.
- 겹친 `cn` 깊이 16 에서 판정 비용이 HEAD 의 약 3배였던 것은 파일 단위 메모(`ShadowMemo`)로 HEAD 수준에 맞췄어요.
- 크기 증가(측정): 적대 입력 11종을 256K · 512K · 1M 자로 3회씩 잰 최솟값이 크기를 두 배로 하면 1.4 ~ 2.8배라 선형으로 봤어요. 신판 최대는 연결식 `<Card` 반복 1M 284ms(HEAD 148ms)예요.

## 6. 품질 게이트 (AC6)

| 명령 | 결과 |
|---|---|
| `npx turbo run build type-check lint test --force`(1회, 기본 동시 실행, load 17 / 8코어) | rc 1 · Cached 0 · 21/23 성공. `@axis-ds/cli#test` 2건이 시간 한도로 실패: 적대 입력 「style 계산 키 뒤 긴 공백」 583ms(상한 500ms), 이번 변경과 무관한 `guidance.test.ts` 5초 제한. 둘 다 단독 실행은 통과(286 passed)했고, 같은 입력의 판정 시간은 번들 직접 측정으로 16 ~ 29ms(절반 크기 7ms)예요 |
| 같은 명령(2회, 기본 동시 실행) | rc 1 · Cached 0. `@axis-ds/ui-react#test` 의 `fix-cva-dts.test.mjs` 「d.ts 0개」(dist 재작성 경합). ui-react 는 이번에 바뀌지 않았고 1회차에는 통과했어요 |
| 같은 명령 `--concurrency=1`(3회) | rc 1. ui-react `fix-cva-dts` 「d.ts 0개」. 2회차가 중단되며 ui-react 빌드가 DTS 단계에서 끊겨 dist 에 d.ts 가 0개로 남았고, `test` 는 `build` 에 의존하지 않아 3회차에서 빌드보다 먼저 그 dist 를 읽었어요(로그 순서 test → build) |
| `npx turbo run build --force` 뒤 `npx turbo run type-check lint test --force --concurrency=1 --continue`(4회) | 빌드 rc 0 · 8/8 · Cached 0, 이어서 rc 0 · 24/24 · Cached 0. cli 1568 · mcp 266 · ui-react 204 · agentic-ui 148 passed |
| `pnpm -s check-changeset-mcp-tokens` | rc 0 · node --test 19 pass · registry-core → cli · mcp 동반 통과(기준 bd55b1d) |
| `pnpm -s check-token-refs` | rc 0 · 검사 85파일 · 판정 불가 0 · 위반 0 |
| deslop-ko(prd · README · testplan · release-notes · changeset) | 차단 0. 이번에 쓴 줄의 경고 0 |

- 1 ~ 3회 실패는 project-todo 124(동시 실행 시 fix-cva-dts dist 경합 · cli 시간 한도 테스트)에 이미 기록된 증상과 같아요. 124 는 이번 배치 뒤 인프라 작업에서 다뤄요.
