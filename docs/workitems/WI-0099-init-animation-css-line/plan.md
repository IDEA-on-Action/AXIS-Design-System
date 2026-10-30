# WI-0099: init 애니메이션 안내가 check 와 같은 전역 CSS 줄 판정을 씀 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 기준: `main` b1912a5 | 상태: 권장안(Q140 ~ Q147)으로 구현 반영(2026-10-31), 사용자 확인 대기
> 다음 WI-0095 가 init 의 Yarn PnP 루트 선언 경계를 넓혀요. 이 WI 가 고친 공용 함수는 2절에 이름으로 적었어요

## 1. 판정 흐름 (`animationGuideLine`, Tailwind 4 · `baseDir` 있음)

1. `inspectTailwind4Animation(baseDir, pkg)`: check 와 같은 전역 CSS(`selectCheckGlobalCss` = axis.config.json 의 globalCss 다음 후보, init 은 설정을 쓴 뒤 이 줄을 내므로 방금 기록한 globalCss 를 봄)를 고르고 상대 `@import` 를 펼쳐 줄(`@import "tw-animate-css"` · `@plugin "tailwindcss-animate"`)과 줄마다 패키지 사유를 구해요.
2. 고른 파일이 있고 줄이 있으며 사유 가운데 PnP 루트 전용(`pnpRootOnly`)이 없으면:
   - 사유가 없으면 침묵(= check PASS)
   - 있으면 「애니메이션: <파일>[ (<하위 파일> 의 import)]의 애니메이션 줄을 쓸 수 없습니다(<사유 · 로 이음>). [대안, 아니면 ]설치하세요: <명령>」
     - 명령: 미선언 이름들은 `<추가 명령> <이름…>`, 선언 · 미설치가 있으면 `installCommandPhrase(설치 명령, 루트 선언 있음)`, 둘 다면 ` · ` 로 이음
     - 대안: 줄이 가리키지 않는 다른 이름이 선언 · 설치(PnP 는 앱 선언)돼 있으면, 그 이름의 줄이 없을 때 「이미 설치된 <이름> 를 쓰려면 <문제 줄> 줄을 <그 이름의 줄> 로 바꾸고」, 이미 있을 때 「이미 설치된 <이름> 만 쓰려면 <문제 줄> 줄을 지우고」
3. 그 밖은 종전 WI-0087 루프(후보 `tw-animate-css` → `tailwindcss-animate`):
   - 선언 + 설치(PnP 는 선언)인데 1 에서 파일을 골랐고 줄이 없으면 「애니메이션: <이름> 는 설치(PnP: 선언)돼 있지만 <파일>에 애니메이션 줄이 없습니다. 전역 CSS 에 <줄> 를 넣으세요.」, 아니면 침묵
   - 선언 · 미설치 → 종전 ③, 미선언 → 종전 ①

Tailwind 3 과 `baseDir` 없는 호출은 1 · 2 를 건너뛰어 종전과 같아요.

## 2. 고친 파일 · 공용 함수

| 파일 | 내용 |
|---|---|
| `packages/axis-registry-core/src/template/tailwind-core.ts` | 새 export `animationPluginProblem(baseDir, pkg, name, pnp)` · `inspectTailwind4Animation(baseDir, pkg?)`, 타입 `AnimationPluginProblem` · `Tailwind4AnimationInspection`. `checkAnimationPlugin` 은 이 둘을 써요(문구 · 판정 불변). 지역 `declaredRangeForCheck` 를 `animationPluginProblem` 으로 합침(선언 위치도 돌려주려고) |
| `packages/axis-cli/src/init/init.ts` | `animationGuideLine` 에 1 · 2 · 3 의 「줄 없음」 갈래, 지역 함수 `tailwind4AnimationLine` · `tailwind4AnimationProblemLine`. 호출부(`runInit`)는 그대로 |
| `packages/axis-cli/README.md` | init 절 애니메이션 서술에 WI-0099 하위 항목 |
| `packages/axis-cli/src/wi-0099-init-animation-css.test.ts` | 새 테스트 28건 |
| `.changeset/wi-0099-init-animation-css-line.md` | cli · mcp patch |

`animationPluginProblem` 의 `why` 는 종전 check 내부 `pluginProblem` 이 돌려주던 문자열 그대로예요. 그래서 init 「쓸 수 없음」 괄호 안 사유와 check 의 사유가 같은 문자열이에요(테스트로 고정).

## 3. 종료 코드 · 쓰기

- init 은 애니메이션 안내 한 줄만 바꿔요. 이 줄은 설정 · utils · package.json 을 쓴 뒤에 내므로 쓰기와 종료 코드에 영향이 없어요(측정 37칸 rc · 쓴 파일 sha256 같음).
- check · MCP 는 같은 판정을 같은 순서로 불러요(측정 37칸 출력 바이트 같음).

## 4. 검증 순서

1. main 빌드 사본으로 37칸 측정(testplan 2.2)
2. 구현 · 빌드 뒤 같은 37칸 재측정, check 출력 · 쓴 파일 비교(testplan 3)
3. 스모크(안내대로 고친 뒤 check, testplan 2.4)
4. 새 테스트 · 음성 대조 · 변이(testplan 4)
5. registry-core · cli · mcp type-check · lint · test(패키지 스크립트 직접 실행, turbo 캐시 없음) · `pnpm check-changeset-mcp-tokens`(testplan 5)
