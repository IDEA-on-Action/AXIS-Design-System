# WI-0041 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24

## 1. 단위 테스트 (`packages/axis-cli/src/init/init.test.ts`, 실제 명령 등록 경로 `axis init -y`)

| 테스트 | 결과 |
|---|---|
| brand · monetDir 값 보존, 키 순서 `$schema · componentsDir · tailwindConfig · globalCss · registry · brand · monetDir`, 빠진 키 안내 없음 | 통과 |
| 음성 대조(종전 결함 재현 조건): theme add 가 쓴 brand 가 재실행 뒤 남고 2회차는 「유지」 | 통과 |
| 기존 componentsDir `./x` 보존(종전 기대 `./src/components/ui` 를 바꿈), registry 기존 값 유지 | 통과 |
| agenticDir 보존 · componentsDir 다음 위치 · 2회차 「유지」(종전 테스트 유지) | 통과 |
| 실재하는 globalCss(`./styles/main.css`) · tailwindConfig(`./tw.config.ts`) 보존, 경고 없음 | 통과 |
| `./globals.css`(없음) + `app/globals.css`(있음) → 찾은 파일로 바꾸고 안내 1줄, template 키 보존 | 통과 |
| 없는 globalCss 이고 찾은 파일도 없음 → 그대로 두고 안내, 2회차 바이트 동일 · 「유지」 | 통과 |
| `mergeInitConfig` 단위: 순서 · 보존 · 삽입 위치 · 지움 | 통과 |
| Tailwind 4 재실행: tailwindConfig 지움 안내, brand 보존 | 통과 |
| 기존 4칸 들여쓰기 유지 | 통과 |
| 종전 기본 registry(axis.minu.best) 갱신 4건 · 사용자 값 유지 3건(문구만 새 갱신 문구로) | 통과 |

- 첫 구현에서 「찾지 못하면 기본값으로 바꿈」으로 했더니 `componentsDir: "src/components/ui"` 인 config 가 1회차에 utils.ts 를 만들며 `src/` 가 생겨, 2회차 기본값이 `./app/...` → `./src/app/...` 로 바뀌는 것을 측정했어요(재실행마다 값이 오감). 그래서 D5 를 「찾지 못하면 그대로 둠」으로 정했어요

## 2. 변이 (A/B)

저장소 밖 스크래치 스크립트로 분기를 종전 동작으로 되돌려 실행하고 원본으로 되돌렸어요(원복 sha 일치).

| 변이 | init.test.ts 결과 |
|---|---|
| 병합 끔(init 밖 키를 지움, 종전 동작) | 5건 실패 |

## 3. 게이트

WI-0037 testplan 3절과 같은 실행(type-check · lint 11/11, build · test 4/4, Cached 0, rc 0, cli 704 · mcp 139).
