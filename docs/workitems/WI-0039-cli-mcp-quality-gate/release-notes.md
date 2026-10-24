# WI-0039 릴리스 노트: cli · mcp · registry-core 품질 게이트

> 작성일: 2026-10-24 | WI: WI-0039 | GitHub: #125 | changeset: 없음(동작 변화 없음, 배포 없음, PRD D3)

## 변경 사항

- `@axis-ds/cli` 에 `lint`(`eslint .`) · `type-check`(`tsc --noEmit`), `@axis-ds/mcp` · `@axis-ds/registry-core` 에 `lint` 를 넣었어요. CI 의 `pnpm lint` · `pnpm type-check` 가 이제 이 패키지들도 검사해요
- 기존 오류를 0 으로 정리했어요: cli tsc 19(+ 가려져 있던 3) · cli eslint 25 · mcp eslint 11(+ 연쇄 1) · registry-core eslint 1
- cli 테스트는 실제 타입에 맞췄어요: `publisher.test.ts` 모의 인덱스를 `CodeInfo` · `ComponentStatus`(`active`) · `collectedAt` 로, fs-extra `pathExists` 모의는 프로미스 오버로드로 좁혀 `mockResolvedValue(boolean)` 를 그대로 써요. `as any` 는 `vi.mocked` 로 바꿨어요

## dist 실코드가 바뀐 곳 (동작 같음)

정리 전 · 뒤 빌드를 `diff -r` 로 비교한 결과예요(testplan 6절).

| 패키지 · 파일 | 바뀐 코드 | 동작이 같은 이유 |
|---|---|---|
| cli `dist/index.js` (shadcn 수집기) | `catch (error)` → `catch` | 바인딩을 쓰지 않았어요 |
| cli `dist/index.js` (monet 수집기) | `constructor(options = {})` → `constructor()` + 주석 1줄 | 인자를 쓰지 않았고 유일한 호출부(`new MonetCollector()`)는 인자가 없어요 |
| cli `dist/index.js` (monet 수집기) | `for (const [catId, examples] ...)` → `[, examples]` | 같은 `Object.entries` 순회 |
| cli `dist/index.js` (v0 수집기) | 미사용 `path.relative(...)` 호출 삭제 | 순수 함수, 결과를 쓰지 않았어요 |
| cli `dist/index.js` (`withoutUpdatedAt`) | 구조 분해 나머지 → 얕은 복사 뒤 `delete updatedAt` | 남는 키와 그 순서가 같아 `serialize` 결과가 같아요 |
| cli `dist/index.js` (`generateIndex`) | `for (const [source, collector] ...)` → `[, collector]` | 같은 Map 순회 |
| cli 청크(`registerSyncCommand`) | `printItemResult(itemResult, options.verbose)` → `printItemResult(itemResult)`, 인자 `verbose` 삭제 | 함수 안에서 `verbose` 를 쓰지 않았어요(`--verbose` 옵션 자체는 그대로) |
| cli · mcp `dist/index.js` (registry-core 번들) | BOM 제거 정규식 `/^<U+FEFF 문자>/` → `/^\uFEFF/` | 같은 한 글자 |
| mcp `dist/index.js` (prompt 도구 4곳) | `[\w\-\/]` → `[\w\-/]` | 문자 클래스 안 `/` 는 이스케이프가 필요 없어요(코드포인트 전수 대조 차이 0) |
| mcp `dist/index.js` (prompt 도구 2곳) | `[\-\*]` → `[-*]` | 맨 앞 `-` 와 클래스 안 `*` 는 글자 그대로(전수 대조 차이 0) |
| mcp `dist/index.js` (detect) | `calculateRepeatability(text, _context)` · `calculateScores(text, context)` 의 미사용 인자 삭제 | 안에서 쓰지 않았어요. 바깥 `handleDetect` 의 `context` 검사 · 분할은 그대로예요 |
| mcp `dist/index.js` (validate) | `checkDuplicate(text, _basePath)` → `checkDuplicate(text)` | 호출부가 인자 하나로 불렀어요 |
| mcp `dist/index.js` (save) | `updateIndex(index, entry, isNew)` → `updateIndex(index, entry)`, 호출부의 `!isDuplicate` 인자 삭제 | 안에서 쓰지 않았어요. `isDuplicate` 는 위 중복 검사에서 그대로 써요 |

- 바뀌지 않은 것: cli `*.d.ts` 전부, `monet.js`, v0 청크 내용(이름 해시만 바뀜), mcp `index.d.ts`. 미사용 import(`ora` · `MONET_CATEGORIES` · `STATUS_MAP` · `GitHubClient` · `CategoryDefinition`)와 미사용 상수 `V0_TO_AXIS_MAPPING` 은 원래 번들에서 빠져 있어 dist 차이가 없어요

## 남겨 둔 것

- theme 의 type-check(12건) · lint 는 이번 범위 밖이에요(PRD Non-goals)
- `turbo run type-check lint test build` 를 한 번에 기본 동시 실행으로 돌릴 때의 순서 경합 2종(testplan 5절)은 이번 변경과 무관해 고치지 않았어요. 새 WI 후보예요
