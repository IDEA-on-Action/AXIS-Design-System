# WI-0090: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 측정일: 2026-10-26 | 기준 fd0a480 위 작업 트리

## 1. 재현 (수정 전, 발행본 cli 1.7.3)

PRD 1.1 표 그대로예요. 같은 버전 픽스처에서 `../../node_modules/...` · 스토어 상대 실경로가 빌드 427(기준 CSS 와 `cmp` 바이트 같음)인데 check FAIL.

## 2. 실제 설치 픽스처 (측정, 수정 후 빌드본 `packages/axis-cli/dist`)

측정 스크립트: scratchpad `wi0090/bin/measure.sh <앱> <axis bin>`(content 변형마다 `tailwind.config.js` 를 쓰고 Tailwind 3.4.19 CLI 를 앱 cwd 에서 실행, 선택자 수 · `axis check` 의 content 줄).

| 픽스처 | 변형 | 빌드 선택자 | 수정 전 | 수정 후 |
|---|---|---|---|---|
| fx-pnpm(같은 버전) | 대조 | 38 | FAIL | FAIL |
| | 앱 경로 | 427 | PASS | PASS |
| | 상위 `../../` | 427 | FAIL | **PASS** |
| | 스토어 상대 실경로 | 427 | FAIL | **PASS** |
| | 스토어 절대 실경로 | 427 | PASS | PASS |
| fx-pnpm-diff(루트 1.8.1 · 앱 1.8.2) | 대조 | 38 | FAIL | FAIL |
| | 앱 경로 | 427 | PASS | PASS |
| | 상위 `../../` | 426 | FAIL | FAIL + 이유 `(1.8.1, 앱 1.8.2)` |
| | 스토어 상대 실경로 | 427 | FAIL | **PASS** |
| | 스토어 절대 실경로 | 427 | PASS | PASS |

판정이 빌드 정답과 일치: 수정 전 7/10 → 수정 후 10/10. npm · pnpm hoisted 실제 픽스처는 이번에 다시 재지 않았고, 단위 매트릭스(WI-0080 hoisted · isolated · single)가 그대로 통과해요.

## 3. 단위 테스트

| 파일 | 추가 · 변경 | 내용 |
|---|---|---|
| `packages/axis-cli/src/template/template-check.test.ts` | +4 | WI-0090 AC1 ~ AC4(스토어 링크 픽스처) |
| `packages/axis-mcp/src/tools/template.test.ts` | 1 변경 | WI-0080 isolated 음성 대조: 판정 FAIL 그대로, 루트 실제 디렉터리 사본(같은 버전)을 가리키면 이유 `(버전은 1.8.1 로 같음)` 이 붙는 전이 |

- 수정 전 소스에서 새 테스트 3 빨강(AC1 ~ AC3), AC4 초록(종전 동작 고정).
- 변이(scratchpad `wi0090/bin/mutate.py`): M1 실경로 비교 끔 · M2 상대 실경로 표본 제거 · M3 이유 제거 각각 1 빨강, 원복 sha 같음.

## 4. 게이트

- `turbo run lint type-check test --filter=@axis-ds/cli --filter=@axis-ds/mcp --filter=@axis-ds/registry-core --force`: 9/9 성공, Cached 0. cli 877 · mcp 181 통과.
