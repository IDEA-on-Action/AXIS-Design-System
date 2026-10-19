# WI-0036 릴리스 노트: mcp 레지스트리 도구 데이터 경로 수정

> 릴리스일: 미정(PR 머지 후 CI 발행) | 유형: fix | 영향: @axis-ds/mcp 1.1.4 → 1.1.5 (patch)

## 배경

배포된 `@axis-ds/mcp` 에서 컴포넌트 · 토큰 도구가 `ENOENT` 로 실패했습니다(Issue #115). 번들 `dist/index.js` 는 `dist/data/` 에서 레지스트리 JSON 을 찾는데, 빌드는 `dist/registry/data/` 로 복사하고 있었습니다. 첫 배포 1.1.0 부터 1.1.4 까지 같은 결함입니다.

## 변경 사항

### fix: 레지스트리 데이터 복사 위치 `dist/data`
- `packages/axis-mcp/package.json` `copy-data` 의 대상을 `dist/registry/data` 에서 `dist/data` 로 바꿨습니다. 코드와 데이터 내용은 그대로입니다.
- 다시 동작하는 도구 6개: `axis.list_components` · `axis.list_tokens` · `axis.search_components` · `axis.get_component` · `axis.get_token` · `axis.install_component`
- 템플릿 도구 4개 · `axis.check_project` · 프롬프트 도구 5개는 번들 데이터를 읽지 않아 영향이 없었습니다.

### chore: 실행 스모크 추가
- `scripts/mcp-smoke.mjs`: tarball 을 빈 디렉터리에 `npm install` 하고 `bin` 으로 stdio 실행해 `tools/list`(16개 1:1)와 레지스트리 도구 6개를 호출합니다.
- `scripts/pack-smoke.mjs` 가 mcp tarball 에 위 스모크를 실행합니다. `publish.yml` 의 Pack smoke 단계와 `pnpm release` 에 함께 걸립니다.
- 단언은 질의어를 되풀이하는 머리글이 아니라 결과 행으로 보고, `axis.install_component` 는 대상 디렉터리에 파일이 생겼는지까지 확인합니다. `npm install` 에는 300초 timeout 을 둡니다.
- mcp 도구를 더하거나 빼면 `scripts/mcp-smoke.mjs` 의 `EXPECTED_TOOLS` 도 같이 고쳐야 합니다. 안 고치면 main push 의 발행이 막힙니다.

## 검증 (2026-10-19, 기준 e690905 + 이 브랜치 변경)

| 항목 | 명령 | 결과 |
|---|---|---|
| 빌드 | `pnpm build --force` | rc 0, 8/8 태스크, 0 cached |
| 타입 | `pnpm type-check --force` | rc 0, 8/8, 0 cached |
| 린트 | `pnpm lint --force` | rc 0, 4/4, 0 cached |
| tarball | `pnpm pack` (packages/axis-mcp) | `dist/data/components.json` · `tokens.json` 포함 |
| 양성 | `node scripts/pack-smoke.mjs` | rc 0, mcp tools/list 16개 · 호출 6건, 6개 패키지 통과 |
| 음성 | `node scripts/mcp-smoke.mjs <배포본 tgz>` | 1.1.4 · 1.1.3 · 1.1.0 모두 rc 1, 6건 isError(ENOENT `dist/data/components.json`) |
| 음성 | 수정 전 HEAD 빌드로 `node scripts/mcp-smoke.mjs` | rc 1, 6건 isError |
| 음성 | `copy-data` 를 되돌린 빌드로 `node scripts/pack-smoke.mjs` | rc 1, 6건 결함 |
| 단언 변이 | 빈 레지스트리 · 설치 파일 쓰기 제거 · 설치 timeout 50ms | 모두 rc 1 (testplan T5~T7) |
| changeset | `pnpm changeset status` | patch 대상 `@axis-ds/mcp` 하나 |

- 스모크 전제: 설치는 npm 레지스트리에서 의존성을 받습니다(네트워크 필요). env · 경로 주입 없이 설치된 패키지의 `bin` 을 그대로 실행합니다.

## 소비 프로젝트 영향

- 1.1.5 로 올리면 컴포넌트 · 토큰 도구가 동작합니다. 설정 변경은 필요 없습니다.
