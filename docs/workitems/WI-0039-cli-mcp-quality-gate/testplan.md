# WI-0039 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-24 | 환경: WSL2, Node 20, pnpm 9.15.4, 격리 worktree(main bd54e91 기준)

## 1. 기준선 재측정 (정리 전, bd54e91)

| 대상 | 명령 | rc | 오류 수 |
|---|---|---|---|
| cli | `tsc --noEmit -p .` | 2 | 19 (`error TS` 줄 수) |
| mcp | `tsc --noEmit -p .` | 0 | 0 |
| registry-core | `tsc --noEmit -p .` | 0 | 0 |
| cli | `eslint .` (루트 설정) | 1 | 25 |
| mcp | `eslint .` | 1 | 11 |
| registry-core | `eslint .` | 1 | 1 (`no-irregular-whitespace`, BOM 문자를 정규식에 그대로 씀) |

- 고치는 도중 드러난 가려진 오류: `publisher.test.ts` 의 `createdAt`(ComponentMeta 에 없는 필드) TS2353 3건. `code` · `status` 오류를 고친 뒤에야 보고됐어요. 연쇄로 드러난 lint 1건: mcp `detect.ts` `calculateScores` 의 `context`(안쪽 함수 인자를 지우자 미사용). 둘 다 0 으로 정리했어요.

## 2. 정리 뒤 (AC2)

| 대상 | rc | 오류 | 검사 파일 수 = 대상 파일 수 |
|---|---|---|---|
| cli `tsc --noEmit` | 0 | 0 | `--listFilesOnly` 의 `src/` 57 = `find src -name '*.ts'` 57 |
| cli `eslint .` | 0 | 0 | 62 = 62 (`scripts/*.mjs` · `test/fixtures` · `vitest.config.ts` 포함) |
| mcp `eslint .` | 0 | 0 | 27 = 27 |
| registry-core `eslint .` | 0 | 0 | 13 = 13 |
| mcp · registry-core `tsc --noEmit` | 0 | 0 | 종전과 같음 |

## 3. 파이프라인 등록 (AC1, `turbo run <task> --dry=json`)

- lint: 스크립트가 있는 태스크 web · tokens · ui-react · agentic-ui(정리 전 4) → + cli · mcp · registry-core(7). theme 은 `<NONEXISTENT>`(범위 밖)
- type-check: cli `tsc --noEmit` 추가. mcp · registry-core 는 이미 있었어요
- CI `frontend.yml` 은 `pnpm lint` · `pnpm type-check`(= `turbo run`)라 workflow 수정 없이 위 태스크가 실행돼요

## 4. 양성 대조 (AC3)

넣은 것: cli `src/site.ts` 에 `export const __wi0039Probe: number = "양성 대조";`(타입 오류) · `const __wi0039LintProbe = 1;`(미사용), mcp `src/index.ts` · registry-core `src/add/add.ts` 에 `const __wi0039Probe = 1;`.

`pnpm turbo run lint type-check --filter=@axis-ds/cli --filter=@axis-ds/mcp --filter=@axis-ds/registry-core --force --continue` → rc 2, 실패 태스크 4개: `cli#lint`(no-unused-vars) · `cli#type-check`(TS2322) · `mcp#lint` · `registry-core#lint`. 백업으로 원복한 뒤 세 파일 `sha256sum -c` 모두 OK.

## 5. 게이트 (AC4, 캐시 우회)

`pnpm turbo run type-check lint test build --force --concurrency=1` → rc 0, Tasks 28/28, Cached 0. 테스트 수: cli 661 · mcp 138(유지), ui-react 110 · agentic-ui 90 · theme 31.

- 같은 명령을 기본 동시 실행으로 돌리면 이번 변경과 무관한 순서 경합으로 실패했어요(관측 2종, 아래). `--concurrency=1` 은 순서만 바꾸고 검사 내용은 같아요
  - 새 worktree(빌드 산출물 없음)에서 `@axis-ds/agentic-ui#test` 가 `@axis-ds/ui-react` 빌드 전에 돌아 「Failed to resolve entry」(test 태스크에 `^build` 의존이 없음)
  - `@ax/web#type-check` 가 같은 실행의 `@ax/web#build`(next build 가 `.next` 를 다시 씀)와 겹쳐 `.next/types/**` TS6053
  - main 에서 같은 경합을 재현해 보지는 않았어요(미측정). CI 는 lint · type-check · test · build 를 따로 된 step 으로 순서대로 돌려 이 경합이 없어요
- 빌드가 다시 쓴 `apps/web/public/templates/*.json` 5개는 되돌렸어요

## 6. 동작 불변 (AC5)

정리 전 소스(bd54e91, 테스트 파일 외 동일)로 만든 dist 와 정리 뒤 dist 를 `diff -r` 로 비교했어요.

- 같음: cli `*.d.ts` 전부 · `monet.js`(미사용 `ora` import 는 원래 번들에서 빠져 있었음), mcp `index.d.ts`
- v0 청크: 내용이 바이트 단위로 같고(`cmp` rc 0) 파일 이름 해시만 바뀜(`V0_TO_AXIS_MAPPING` 은 원래 번들에서 빠져 있었음). `index.js` · `v0.js` 의 import 경로도 그 이름만 바뀜
- 실코드가 바뀐 곳은 [release-notes.md](./release-notes.md) 목록
- 정규식 동치: 바뀐 5쌍을 표본 14개 × 5 = 70건에서 `match` 결과 대조 차이 0, 문자 클래스 `[\w\-\/]`↔`[\w\-/]` · `[\-\*]`↔`[-*]` 를 코드포인트 0~0xFFFF 전수 대조 차이 0, 플래그 같음. 표본 가운데 7개는 구판 정규식에 걸려 대조가 빈 매칭만 본 것이 아님을 보였어요
