# WI-0099: init 애니메이션 안내가 check 와 같은 전역 CSS 줄 판정을 씀 PRD

> 작성일: 2026-10-31 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0099 | GitHub: #243 | 우선순위: P3 | 상태: 구현 완료, Q140 ~ Q147 은 권장안으로 진행, 2026-10-31 사용자 확정
> 기준: `main` b1912a5 (linked 1.8.2 · cli 1.7.9 · mcp 1.4.8 발행됨) 위 worktree 브랜치 `wi-0099-init-animation-css-line`. 착수 측정은 main 빌드(b1912a5)로 했어요
> 출처: WI-0092 조사의 S9(사용자 결정 Q18), WI-0087 DEC-4 · DEC-6 을 다시 정함
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정)

init 의 애니메이션 안내(`animationGuideLine`, WI-0087 DEC-4 · DEC-6)는 선언과 설치본만 보고 전역 CSS 를 읽지 않았어요. Tailwind 4 이름 집합 `tw-animate-css` · `tailwindcss-animate` 가운데 하나라도 선언 · 설치돼 있으면 침묵했어요. 반면 check 의 animation 항목은 WI-0092 부터 CSS 의 줄마다 그 줄이 가리키는 패키지를 봐요. 그래서 둘이 어긋났어요(testplan 2절, fixture 37칸).

| 갈래 | 칸(Tailwind 4) | main init | check |
|---|---|---|---|
| S9: 줄과 다른 이름만 설치 | 줄 `tw-animate-css` · `tailwindcss-animate` 만(앱 · 루트), 그 거울, 두 줄 · 한쪽만, PnP 앱 선언 S9 | 침묵 | WARN 「… 선언 없음」 |
| 줄 없음 · 설치됨 | 줄 없음 · 둘 중 하나 설치(앱 · 루트), PnP 앱 선언 | 침묵 | WARN 「애니메이션 플러그인이 없습니다」 |
| 다른 패키지를 안내 | 줄 `tailwindcss-animate` · 아무것도 없음(앱 · 루트), 줄 `tw-animate-css` · `tailwindcss-animate` 선언만, 그 거울 | `tw-animate-css` 설치(또는 줄과 다른 선언 이름) 안내 | 줄의 패키지로 WARN |

- 침묵 · WARN 어긋남 15칸 가운데 12칸이 위 두 갈래, 나머지 3칸은 전역 CSS 파일 없음 2칸 · Tailwind 3 plugins 미등록 1칸이에요.
- 「다른 패키지를 안내」 4칸은 둘 다 경고하지만 init 안내대로 하면 check 가 WARN 으로 남았어요(testplan 2.4 스모크: 줄 `tailwindcss-animate` 에 종전 안내대로 `tw-animate-css` 설치 + `@import` 추가 → WARN 그대로).
- init 종료 코드는 37칸 모두 0, check 는 다른 항목 때문에 rc 1 인 칸(CSS 없음 · Tailwind 3)만 1 이에요.

### 1.2 결정

#### 이 WI 의 결정 (Q140 ~ Q147, 권장안으로 진행, 2026-10-31 사용자 확정)

7절 표에 선택지 · 근거가 있어요.

| # | 진행한 권장안 |
|---|---|
| Q140 | init 은 Tailwind 4 에서 check 와 같은 전역 CSS(`selectCheckGlobalCss` · 상대 `@import` 펼침)와 같은 줄 판정(`inspectTailwind4Animation`, registry-core 공용)을 먼저 써요 |
| Q141 | 줄의 패키지를 쓸 수 없으면 check 와 같은 사유 + 설치 명령. 다른 이름이 이미 설치돼 있으면 그 패키지로 줄을 바꾸는(또는 지우는) 대안을 앞에 둬요 |
| Q142 | 줄 없음 · 설치됨(종전 침묵)도 함께 고쳐 「설치돼 있지만 <파일>에 애니메이션 줄이 없습니다」 |
| Q143 | 전역 CSS 파일을 고르지 못하면 종전 판정 그대로(어긋남 2칸은 잔여) |
| Q144 | Yarn PnP 앱 선언은 새 판정, 줄의 패키지가 루트에만 선언된 경우(루트 전용 사유)는 종전 그대로(WI-0095 범위) |
| Q145 | `@axis-ds/ui-react` 를 쓰지 않아 check 에 animation 항목이 없을 때도 init 은 안내를 유지 |
| Q146 | Tailwind 3(plugins 미등록 · 설치됨, init 침묵 · check WARN)은 범위 밖, 잔여 |
| Q147 | 새 문구 확정은 사용자 몫(WI-0097 Q43 · Q48 선례) |

#### 다시 정하는 선례 결정

| 출처 | 종전 | 이 WI 뒤 |
|---|---|---|
| WI-0087 DEC-4 | ① 미선언 → 종전 줄 ② 선언 + 설치 → 침묵 ③ 선언 · 미설치 → 설치 안내 | Tailwind 4 이고 전역 CSS 를 골랐으면 줄 판정이 먼저예요. 줄이 있으면 줄의 패키지로 침묵 · 「쓸 수 없음」, 줄이 없으면 ② 가 「줄 없음」 안내로 바뀌고 ① · ③ 은 그대로예요. CSS 를 고르지 못하면 DEC-4 그대로예요 |
| WI-0087 DEC-6 | Tailwind 4 이름 둘 다 인정, 둘 다 선언되면 `tw-animate-css` 우선 | 줄이 있으면 우선순위가 아니라 줄이 가리키는 이름으로 판정해요. 줄이 없을 때(③ · 「줄 없음」 문구의 이름)와 CSS 를 고르지 못할 때는 DEC-6 그대로예요 |
| WI-0092 Q9 · A2 | check: 줄마다 그 줄의 패키지, 모든 줄이 선언 · 설치돼야 PASS | 바뀌지 않아요. init 이 같은 함수를 써요 |
| WI-0096 Q110 | npm 루트 선언 · 미설치는 「워크스페이스 루트에서 npm install」 | 새 「쓸 수 없음」 문구의 선언 · 미설치 명령도 같은 `installCommandPhrase` 예요 |

## 2. 범위

### 2.1 하는 것

- registry-core `template/tailwind-core.ts`: check 내부에 있던 줄 판정과 패키지 사유를 공용 함수 `inspectTailwind4Animation` · `animationPluginProblem`(타입 `Tailwind4AnimationInspection` · `AnimationPluginProblem`)로 꺼냄. `checkAnimationPlugin` 은 그 함수를 써요(판정 · 문구 바이트 불변). 지역 함수 `declaredRangeForCheck` 는 남은 사용처가 이것뿐이라 합쳤어요.
- cli `init/init.ts` `animationGuideLine`: Tailwind 4 · `baseDir` 가 있으면 줄 판정을 먼저 씀. 새 지역 함수 `tailwind4AnimationLine` · `tailwind4AnimationProblemLine`.
- `packages/axis-cli/README.md` init 절의 애니메이션 서술(「선언과 설치본이 모두 있으면 안내하지 않고」가 Tailwind 4 에서 거짓이 되므로).

### 2.2 하지 않는 것

- check · MCP `axis.check_project` 의 판정 · 문구 · 종료 코드(같은 코어, 수정 전후 37칸 바이트 같음).
- init 의 종료 코드 · 쓰기(설정 · utils · package.json). 바뀌는 것은 애니메이션 안내 한 줄뿐이에요.
- Tailwind 3 init 안내(Q146), 전역 CSS 없음(Q143), PnP 루트 전용 선언(Q144, WI-0095), theme add · add · template apply.
- 다른 WI 문서 · project-todo.md · wi-mapping.json(Master 몫).

### 2.3 알려진 한계 (이 WI 뒤에도 남음)

- Q143: 전역 CSS 파일이 없으면(설정의 globalCss 도 후보도 없음) init 은 종전처럼 선언 + 설치면 침묵하고, check 는 「애니메이션 플러그인이 없습니다 … (globalCss ./app/globals.css 없음)」 WARN 이에요(2칸). 이때 check 는 globals.css 항목도 FAIL 이라 rc 1 이에요.
- Q144: PnP 에서 줄의 패키지가 워크스페이스 루트에만 선언되면 init 은 종전 ① 줄(「yarn add tw-animate-css 뒤 …」), check 는 루트 전용 사유 WARN 이에요. 둘 다 경고하고 안내(앱에 선언)도 같은 방향이지만 문구가 달라요. WI-0095 가 init 의 PnP 루트 경계를 다룰 때 맞춰요.
- Q146: Tailwind 3 에서 `tailwindcss-animate` 가 선언 · 설치됐지만 plugins 에 없으면 init 은 침묵, check 는 WARN 이에요(1칸). init 은 tailwind.config 를 읽지 않아요.
- check 의 「모든 줄이 선언 · 설치돼야 PASS」(WI-0092 A2)를 그대로 따르므로, 두 줄이 있고 한쪽만 설치된 경우 init 도 경고해요.

## 3. 수용 기준 (AC)

| AC | 기준 | 확인 |
|---|---|---|
| AC1 | 착수 전 main 출력에서 init · check 가 어긋나는 칸을 모두 찾음 | testplan 2.2, 37칸 가운데 침묵 · WARN 어긋남 15 · 다른 패키지 안내 4 |
| AC2 | Tailwind 4 · 전역 CSS 있음의 모든 칸에서 init 침묵 ⇔ check PASS | 수정 후 측정 어긋남 15 → 3(남은 3칸은 Q143 · Q146), 새 테스트 21칸 불변식 |
| AC3 | S9(앱 · 루트 · PnP 앱 선언)에서 init 이 check 와 같은 사유와 설치 명령, 다른 이름으로 줄을 바꾸는 대안을 냄 | 새 테스트 A2 · A3 · R1 · P1 · V1 |
| AC4 | init 안내대로 하면 check animation 이 PASS | testplan 2.4 스모크 6갈래 |
| AC5 | check · MCP 의 판정 · 문구 · rc 불변 | 수정 전후 check 출력 37개 바이트 같음, 기존 cli · mcp 테스트 그대로 통과 |
| AC6 | init 의 종료 코드 · 쓴 파일 불변 | 수정 전후 rc 37/37 같음, 쓴 파일 123개 sha256 같음, 새 테스트 1건 |
| AC7 | 종전 동작을 지키는 칸(CSS 없음 · PnP 루트 전용 · Tailwind 3 · CSS 를 고르지 못하는 직접 호출)은 그대로 | 음성 대조 테스트 4건, 기존 WI-0087 · WI-0096 테스트 그대로 |
| AC8 | 새 테스트가 수정 전 init 에서 빨강 | testplan 4절: 15 빨강 · 13 초록(PASS 칸 · 음성 대조), 변이 2건 빨강 |
| AC9 | 패키지별 type-check · lint · test(캐시 없이) · `pnpm check-changeset-mcp-tokens` 통과 | testplan 5절 |

## 4. 미측정 · 위험

- 실제 패키지 설치(npm 레지스트리)로 스모크하지 않았어요. 설치는 선언 + `node_modules/<이름>/package.json` 모의예요(판정 함수 `findInstalledPackage` 가 보는 것과 같음). 실 Tailwind 4 빌드로 「두 줄 · 한쪽만 설치」가 실패한다는 근거는 WI-0092 A2 측정을 이어받아요.
- init 이 전역 CSS 를 새로 읽어요(Tailwind 4 · `baseDir` 있음일 때만). 읽기는 check 와 같은 `expandGlobalCss`(깊이 · 순환 상한 있음)라 init 이 실패하는 새 경로는 없다고 봐요(추정). 읽기 실패는 줄 없음으로 다뤄져요.
- `@axis-ds/ui-react` 를 쓰지 않는 앱에서 init 이 새 「쓸 수 없음」 · 「줄 없음」 안내를 낼 수 있어요(check 는 항목 없음, Q145).

## 5. 의존 · 순서

- 배치 11 은 WI-0099 → WI-0095 순서예요. WI-0095 가 init 의 Yarn PnP 루트 선언 경계를 넓히면 Q144 의 칸(PnP 루트 전용 · 줄 있음)을 이 WI 의 `inspectTailwind4Animation` 사유(`pnpRootOnly`)로 맞출 수 있어요. 이 WI 는 그 칸에서 새 판정을 끄고 종전 경로로 보내요(`animationGuideLine` 의 `pnpRootOnly` 조건).
- registry-core 를 바꾸므로 changeset 에 cli · mcp patch 를 함께 넣었어요(CLAUDE.md).

## 6. 측정 출처

- scratchpad `measure.sh <cli dist> <출력 디렉터리>`: Tailwind 4 fixture 18칸(줄 3 × 설치본 3 × 선언 위치 2) + 추가 11칸 + PnP 5칸 + Tailwind 3 3칸 = 37칸. 각 칸에서 `axis init -y` 뒤 `axis check`. 종전은 main b1912a5 빌드 사본(`base-cli`), 수정은 worktree 빌드(`pnpm turbo build --filter=@axis-ds/cli... --force`, Cached 0).
- scratchpad `table.mjs`(두 측정의 표), `smoke.sh`(안내대로 고친 뒤 check).

## 7. 사용자 결정 항목 (Q140 ~ Q147, 권장안으로 진행, 2026-10-31 사용자 확정)

| # | 질문 | 선택지 | 권장안 | 근거 |
|---|---|---|---|---|
| Q140 | init 이 S9 를 어떻게 알아낼지 | ① check 와 같은 전역 CSS · 줄 판정을 registry-core 공용 함수로 재사용 ② CSS 를 읽지 않고 「두 이름 중 한쪽만 설치」를 별도 규칙으로 경고 ③ 문서로만 안내 | ① | S9 는 줄과 설치본의 짝이 맞지 않는 것이라 CSS 없이 판별할 수 없어요. ② 는 줄이 실제로 설치된 이름을 가리키는 정상 칸(A4 등)까지 경고해요. ① 은 같은 함수라 init 침묵 ⇔ check PASS 가 구조로 보장돼요(측정 21칸) |
| Q141 | S9 안내 문구 | ① 사유(check 와 같음) + 설치 명령, 다른 이름이 설치돼 있으면 줄을 바꾸는 대안을 앞에 ② 설치 명령만(check 와 같은 방향) ③ 줄 바꾸기만 | ① | S9 사용자는 둘 중 어느 쪽을 의도했는지 알 수 없어요. 두 길 모두 스모크에서 check PASS 가 됐어요(testplan 2.4). 명령을 복사하기 쉽게 줄 끝은 명령 그대로예요 |
| Q142 | 줄 없음 · 패키지 설치됨(종전 침묵, check WARN) | ① 함께 고침(「설치돼 있지만 <파일>에 애니메이션 줄이 없습니다. 전역 CSS 에 <줄> 를 넣으세요.」) ② 범위 밖 | ① | 같은 침묵 · WARN 어긋남이고 원인(CSS 를 보지 않음)이 같아요. 고치지 않으면 5칸(앱 · 루트 각 2, PnP 앱 1)이 더 남아 남는 어긋남이 3 → 8칸이에요 |
| Q143 | 전역 CSS 파일을 고르지 못할 때 | ① 종전 판정 유지 ② check 처럼 「플러그인이 없습니다」 | ① | init 은 CSS 를 만들기 전 새 프로젝트에서도 돌고, 이미 「전역 CSS 파일을 찾지 못해 기본값 …」 줄과 Tailwind 4 연동 안내(파일 맨 위에 넣을 줄)를 내요. check 는 이때 globals.css FAIL 이 따로 있어요 |
| Q144 | Yarn PnP | ① 앱 선언은 새 판정, 줄의 패키지가 루트 전용이면 종전(WI-0095 범위) ② PnP 는 전부 종전 ③ 루트 전용도 check 사유로 | ① | 앱 선언 S9 · 줄 없음은 루트 경계와 무관하게 check 와 어긋났어요(2칸). ③ 은 WI-0095 의 경계를 미리 바꿔요(지시: 이 WI 에서 건드리지 않음) |
| Q145 | `@axis-ds/ui-react` 미사용(check 항목 없음) | ① init 은 안내 유지 ② check 처럼 침묵 | ① | init 은 컴포넌트를 추가하기 전에 돌고(다음 단계가 `add button`), WI-0065 D8 부터 사용 여부와 상관없이 안내했어요 |
| Q146 | Tailwind 3 plugins 미등록 · 설치됨(init 침묵 · check WARN) | ① 범위 밖, 별도 WI 후보 ② 함께 tailwind.config 판독 | ① | Issue 는 Tailwind 4 S9 를 지목했어요. Tailwind 3 은 설정 파일을 읽어 plugins 배열을 판독해야 해서(`readAnimationPluginUse`) 범위가 달라요 |
| Q147 | 새 문구 확정 | ① 사용자 확정(권장안 문구로 구현) ② 지금 확정 | ① | WI-0097 Q43 · Q48 선례. 새 문구는 release-notes 「바뀐 점」에 모았어요 |

## 결정 확정 (2026-10-31)

Q140 ~ Q147 은 2026-10-31 사용자가 모두 권장안으로 확정했어요.
