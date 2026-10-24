# WI-0061 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24

## 1. 단위 테스트 (`packages/axis-cli/src/registry/registry.test.ts`)

| 테스트 | 결과 |
|---|---|
| version 만 다르고 항목 sha256 이 같으면 알림 0 | 통과 |
| version 이 같아도 내용이 다르면 1번, 다른 항목 이름(button, utils) | 통과 |
| 한쪽에만 있는 항목(badge)도 다른 항목으로 셈 | 통과 |
| sha256 없는 항목이 있으면 종전 version 판정(다르면 알림, 같으면 없음) | 통과 |
| 종전 「version · 내용이 다르면 한 번 알리고 원격을 씀」 | 통과(같은 문구 요소 유지) |

- 다른 동작(폴백 · 검증 · sanitize 등)을 보는 기존 테스트 16건은 픽스처가 원격 · 동봉본을 서로 다른 내용으로 구분해 이제 내용 알림이 한 줄 더 나와요. 테스트 의도를 바꾸지 않도록 수집 헬퍼가 내용 알림을 `contentNotices` 로 따로 모으게 했어요. 원격 정상 경로 첫 테스트는 동봉본을 같은 내용으로 바꿔 「알림 없음」을 그대로 봐요
- `add.test.ts` 의 「출처를 섞지 않음」 테스트: 폴백 안내 필터가 내용 알림까지 세던 것을 폴백 문구로 좁히고, 원격 card 가 달라 내용 알림이 card 를 짚는지 단언을 더했어요

변이: 내용 비교 분기를 끄면(종전 version 판정) WI-0061 테스트 3건 실패, 원복 뒤 통과(`cmp` 일치).

## 2. 실측 (AC2)

| 실행 | pages.dev `/r` version 1.5.2 에 대해 |
|---|---|
| 빌드한 cli(동봉본 version 1.5.0, 항목 내용 같음) `list` | 안내 없음, 「원격 레지스트리, version 1.5.2」 |
| 배포본 `@axis-ds/cli@1.5.2`(동봉본 1.5.1, 음성 대조) | 「version 이 다릅니다」 안내 |

## 3. 게이트 (AC3, 캐시 우회)

turbo type-check · lint · build · test `--force` 모두 rc 0, Cached 0(cli 661 · mcp 138 · ui-react 110 · agentic-ui 90 · theme 31). test:registry · pack-smoke · cli-smoke · mcp-smoke · registry-install-smoke(대표 5/5) 모두 rc 0.
