# WI-0056 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-23

## 1. 단위 테스트

| 대상 | 결과 |
|---|---|
| cli vitest | 15파일 640/640 (스키마 테스트 3건 추가) |
| mcp vitest | 5파일 43/43 |
| `pnpm test:registry` | 45/45 |

스키마 테스트 변이(원복은 `cmp` 일치):

| 변이 | 결과 |
|---|---|
| schema.json 에서 키 삭제(brand) | vitest 1건 실패 |
| schema.json 에 키 추가(extra) | vitest 1건 실패 |
| `AxisConfig` 에 키 추가(newKey) | `tsc --noEmit` 에서 axis-config.test.ts 오류 1건(기준 0건, 전체 기존 오류 20건은 다른 파일) |

## 2. AC 실측

| AC | 방법 | 결과 |
|---|---|---|
| AC1 잔존 | `grep -rn axis.minu.best`(node_modules · dist · WI 문서 · CHANGELOG 제외) | 남은 곳: LEGACY 상수와 이전 판정 코드 · 테스트 · README 의 이전 설명, site.ts 주석, project-todo 의 이 WI 행 |
| AC1 dist | 빌드한 cli · mcp dist | cli `dist/index.js` 2건(LEGACY 상수 · D20 갱신 안내 문구), mcp 0건 |
| AC2 cli | 빌드한 cli 를 env 없이 `template list` | rc 0, 42개. 음성 대조 npm `@axis-ds/cli@1.5.0` 은 rc 1 「템플릿 인덱스를 가져올 수 없습니다 (403): https://axis.minu.best/templates/index.json」 |
| AC2 mcp | 빌드한 mcp 서버에 JSON-RPC `axis.list_templates`(env 없음) | 42개 목록. 음성 대조 `AXIS_TEMPLATE_URL=https://axis.minu.best/templates` 는 isError 403 |
| AC3 schema | 배포 뒤 `curl …/schema.json` 200 과 init 산출물 검증 | 배포 전(지금 404). 머지 뒤 측정 |
| AC4 별칭 | `components.json` 별칭 주소의 button.json | 200 |
| 새로 넣은 URL 전수 | diff 에서 추출한 46개 | 200: 37, 404: 9(`/r` base 자체 1 · 배포 전 schema.json 1 · library agentic 7, 알려진 한계 참조) |
