# WI-0036 테스트 계획: mcp 레지스트리 도구 데이터 경로 수정

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 릴리스 노트: [release-notes.md](./release-notes.md)

## 1. 범위

- `packages/axis-mcp` `copy-data` 대상 변경(FR-1)과 `scripts/mcp-smoke.mjs` · `scripts/pack-smoke.mjs` 연결(FR-2 · FR-3)
- 스모크 대상은 번들 레지스트리 데이터를 읽는 도구 6개입니다. 템플릿 도구 4개는 원격 `axis.minu.best` 를 읽어 대상이 아닙니다(prd C4).

## 2. 스모크 단언

| 도구 | 기대 | 왜 이 문자열인가 |
|---|---|---|
| `tools/list` | `EXPECTED_TOOLS` 16개와 1:1 (누락 · 목록 밖 도구 모두 실패) | 도구 등록과 스모크 목록이 어긋나면 드러나게 |
| `axis.list_components` | `button` | 레지스트리 목록 행 |
| `axis.list_tokens` | `colors.primary` | 토큰 목록 행 |
| `axis.search_components` | `` (`button`) `` | 머리글 `## 검색 결과: "button"` 은 결과 0건이어도 나오므로 결과 행 형식으로 봅니다 |
| `axis.get_component` | `button` | 컴포넌트 상세 |
| `axis.get_token` | `colors.primary` | 토큰 상세 |
| `axis.install_component` | 응답의 `button` + `install-target/components/ui/button.tsx` 실제 생성 | 응답 문구만으로는 파일 쓰기를 증명하지 못합니다 |

- 설치 단계 `npm install` 에 300초 timeout 을 둡니다. 시간 초과는 예외로 올라와 pack-smoke 의 `pack 중 오류` 실패가 됩니다.
- 하네스는 임시 디렉터리만 쓰고 워킹트리를 되돌리지 않습니다(`git checkout` · `git clean` · `git stash` 호출 0건, `scripts/pack-smoke.mjs` · `scripts/mcp-smoke.mjs` grep).

## 3. 결과 (2026-10-19, 기준 HEAD 4f27105 + 보정 변경)

| ID | AC | 명령 | 결과 |
|---|---|---|---|
| T1 | AC1 | `pnpm pack` (packages/axis-mcp) | `dist/data/components.json` · `tokens.json` 포함 |
| T2 | AC2 | `node scripts/pack-smoke.mjs` | rc 0, mcp tools/list 16개 · 호출 6건, 6개 패키지 통과 |
| T3 | AC3 | `node scripts/mcp-smoke.mjs <npm pack @axis-ds/mcp@1.1.4>` | rc 1, 6건 isError(ENOENT `dist/data/components.json`) |
| T4 | AC3 | 1.1.3 · 1.1.0 배포본, 수정 전 HEAD 빌드, `copy-data` 를 되돌린 pack-smoke | rc 1, 6건 결함(보정 전 실측, release-notes 검증 표) |
| T5 | 단언 | 로컬 tarball 의 `dist/data/components.json` 을 `{"components":[]}` 로 바꾼 변이 | 보정 전 rc 1 · 3건(search_components 통과), 보정 후 rc 1 · 4건(search_components 실패 추가) |
| T6 | 단언 | 번들의 `writeFileSync(fullPath, ...)` 를 지운 변이(응답은 성공) | 보정 후 rc 1, `install_component: 설치 파일 없음` 1건 |
| T7 | 단언 | `INSTALL_TIMEOUT_MS` 를 50 으로 바꾼 사본 | rc 1, `spawnSync npm ETIMEDOUT` |
| T8 | AC4 | `pnpm changeset status` | patch 대상 `@axis-ds/mcp` 하나 |
| T9 | AC5 | `pnpm build --force` · `pnpm type-check --force` · `pnpm lint --force` | rc 0, 8/8 · 8/8 · 4/4, 0 cached |

- 변이 T5 · T6 · T7 은 임시 디렉터리의 tarball 사본과 스크립트 사본에만 적용했습니다. 저장소 파일은 바꾸지 않았습니다.
- `pnpm build` 가 고친 `apps/web/public/templates/*.json` 은 커밋하지 않고 되돌렸습니다.
- 스모크 전제: 설치는 npm 레지스트리에서 의존성을 받습니다(네트워크 필요). env · 경로 주입 없이 설치된 패키지의 `bin` 을 그대로 실행합니다.

## 4. 남은 확인

- 배포 후 `npm pack @axis-ds/mcp@1.1.5` 로 `node scripts/mcp-smoke.mjs <tgz>` rc 0 확인(todo M1-4)
