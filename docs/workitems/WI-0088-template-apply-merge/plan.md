# WI-0088: template apply 의 package.json 합치기 구현 계획

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 기준: `main` e32275e | 상태: 구현 반영(2026-10-30), 결정 Q100 ~ Q107 은 권장안으로 진행 · 사용자 확인 대기

## 1. 모델

쓰기를 두 단계로 나눠요. **계획**(파일을 읽기만 함)과 **쓰기**(계획대로, 실패하면 되돌림)예요. CLI 와 MCP 가 같은 코어를 불러 판정 · 결과가 구조적으로 같아요.

| 대상에 같은 경로 파일 | 템플릿 경로 | 기존 내용 | action | 쓸 내용 |
|---|---|---|---|---|
| 없음 | - | - | `created` | 템플릿 바이트 그대로 |
| 있음 | `package.json` | JSON 객체 | `merged` | `mergePackageJson(사용자, 템플릿)` 을 기존 서식으로(Q100 · Q102 · Q105) |
| 있음 | `axis.config.json` | JSON 객체 | `merged` | `{ ...사용자, ...템플릿 }` 을 기존 서식으로(Q103) |
| 있음 | `package.json` · `axis.config.json` | JSON 객체가 아님 | `overwritten` + note | 템플릿 바이트(Q101) |
| 있음 | 그 밖(하위 경로 package.json 포함) | - | `overwritten` | 템플릿 바이트(종전) |

`mergePackageJson`:

1. 사용자 키 순서대로 돌며, `scripts` · `dependencies` · `devDependencies` · `peerDependencies` · `optionalDependencies` 이고 템플릿 값이 객체면 `{ ...사용자맵, ...템플릿맵 }`(사용자 맵이 객체가 아니면 템플릿 맵), 그 밖은 사용자 값
2. 템플릿에만 있는 키를 뒤에 붙임

서식(Q102): 첫 들여쓰기 줄이 탭이면 `"\t"`, 아니면 그 칸 수(못 찾으면 2). 기존에 `\r\n` 이 있으면 줄바꿈을 CRLF 로, 기존이 줄바꿈으로 끝나면 끝 줄바꿈을 붙여요.

쓰기(Q106): 계획 순서대로 디렉터리를 만들고(`mkdirSync recursive`, 새로 생긴 디렉터리 기록) `writeFileSync` 해요. 실패하면 이미 쓴 파일과 실패한 파일을 거꾸로 돌며 기존 내용이 있으면 다시 쓰고 없으면 지운 뒤, 새로 만든 디렉터리 가운데 빈 것을 안쪽부터 지우고 `TemplateApplyError`(되돌린 · 못 되돌린 목록)를 던져요.

### 1.1 경로 검증 (Q107)

`resolveTemplatePath(baseDir, relPath)` 하나로 판정해요. 빈 경로 · NUL 은 거부, POSIX · Windows 절대 경로는 「절대 경로」, `path.resolve(baseDir, relPath)` 가 baseDir 안(같은 경로 자체는 아님)이 아니면 「상위 디렉터리로 나감」, 있는 가장 가까운 조상까지 realpath 로 푼 대상 경로가 baseDir 실경로 안이 아니거나 끊긴 링크라 풀 수 없으면 「심볼릭 링크가 대상 디렉터리 밖을 가리킴」이에요. 문구는 `템플릿 경로 '<p>' 가 대상 디렉터리 밖을 가리켜(<원인>) 중단했습니다. 아무 파일도 바꾸지 않았습니다` 로 CLI · MCP 가 같은 `TemplatePathError` 를 써요.

- `planTemplateFiles(baseDir, files, extraPaths)` 가 파일을 읽기 전에 files 경로와 postInstall 경로(`extraPaths`)를 모두 검증해요. 그래서 apply 는 dry-run 을 포함해 어떤 파일도 읽거나 쓰기 전에 끝나요(부분 적용 없음)
- 되돌리기의 삭제(`unlinkSync`)는 계획의 `dest` 만 쓰므로 같은 검증을 거친 경로예요
- 안쪽을 가리키는 심볼릭 링크는 허용해요

## 2. 고친 지점

| 파일 | 함수 · 자리 | 바뀐 것 |
|---|---|---|
| `packages/axis-registry-core/src/template/apply-files.ts` (새 파일) | `planTemplateFiles` · `planTemplateFileContent` · `mergePackageJson` · `mergeAxisConfigJson` · `detectJsonIndent` · `isMergedTemplateFile` · `writeTemplateFiles` · `TemplateApplyError` · `PACKAGE_JSON_MERGED_MAPS` | 1절 모델 |
| `packages/axis-registry-core/package.json` | `exports` | `"./apply-files"` 한 줄 추가 |
| `packages/axis-cli/src/template/template-apply.ts` | `applyTemplate` | 충돌 탐지를 계획(`action !== "created"`)으로, 충돌 목록 · `--dry-run` 에 「합치기」, 쓰기를 `writeTemplateFiles` 로, 실패 시 스피너 실패 문구 · rc 1. 반환값을 `Promise<boolean>`(썼으면 true)으로 |
| 같은 파일 | `initTemplate` | `applyTemplate` 이 false 면 axis.config.json 생성 · 다음 단계로 가지 않음 |
| 같은 파일 | `templateDependencyCommands` 주석 | WI-0085 의 「덮어쓰기 때문」 서술을 지금 동작으로 고침 |
| `packages/axis-mcp/src/tools/template.ts` | `handleApplyTemplate` · `ApplyTemplateResult.files` · `formatApplyTemplateResult` | 같은 코어로 계획 · 쓰기, `action` 에 `merged` · `note` 추가, 「합치기: 기존 필드를 두고 템플릿 키를 합침」 표시 |
| `apply-files.ts` (Q107) | `resolveTemplatePath` · `assertTemplatePaths` · `TemplatePathError`, `planTemplateFiles` 세 번째 인자 | 1.1절 |
| `packages/axis-cli/src/template/template-apply.ts` (Q107) | `applyTemplate` | postInstall 경로를 계획에 넘기고 `TemplatePathError` 면 문구 · rc 1 · false(init 도 멈춤) |
| `packages/axis-cli/src/template/post-install.ts` (Q107) | `runPostInstall` | `path.resolve(baseDir, patch.file)` → 먼저 모두 `assertTemplatePaths`, 그다음 `resolveTemplatePath` |
| `packages/axis-cli/src/template/template-diff.ts` (Q107) | `diffTemplate` | `path.join(baseDir, file.path)`(종전 33줄) → 읽기 전에 모두 `resolveTemplatePath`, 밖이면 문구 · rc 1 |
| `packages/axis-mcp/src/tools/template.ts` (Q107) | `handleApplyTemplate` · `handleDiffTemplate` | postInstall 경로를 계획에 넘김(main 247줄 `path.join(baseDir, patch.file)` → `resolveTemplatePath`), diff 읽기(main 280줄 상당)도 검증. 오류는 도구 등록부가 `오류: <문구>` 로 응답 |
| `packages/axis-cli/README.md` · `packages/axis-mcp/README.md` | template 절 | 한 줄씩 |

- registry-core 의 기존 공용 함수(`project.ts` 의 `detectInstallCommand` · `addCommandFor` 등)는 **고치지 않았어요**. WI-0096 과 겹치는 함수는 없어요
- `TemplateApplyError` 는 MCP 에서 잡지 않고 도구 등록부(`index.ts` 의 `apply_template` catch)가 오류 응답(`isError`)으로 돌려줘요

## 3. 문구

| 자리 | 문구 |
|---|---|
| CLI 충돌 목록 | `  - package.json (기존 필드를 두고 템플릿 키를 합침)` |
| CLI `--dry-run` | `  합치기 <절대경로> (기존 필드를 두고 템플릿 키를 합침)` |
| CLI 쓰기 뒤 | `  package.json: 기존 필드를 두고 템플릿 키를 합침` |
| CLI · MCP 알림(Q101) | `기존 package.json 을 JSON 객체로 읽을 수 없어 템플릿 내용으로 덮어씁니다` |
| MCP 파일 목록 | `- ~ package.json (합치기: 기존 필드를 두고 템플릿 키를 합침)` |
| 쓰기 실패 | `템플릿 파일을 쓰는 도중 실패해 건드린 파일 N개를 원래대로 되돌렸습니다(<원인>).` (+ 못 되돌린 파일) |

## 4. 테스트 · 기존 테스트 영향

- 새 테스트: cli `apply-files.test.ts`(코어 12), `template-apply.test.ts` 의 describe 「WI-0088」(4), `template-apply-rollback.test.ts`(2), `template-path-guard.test.ts`(12, Q107), mcp `template-apply.test.ts` 의 WI-0088 2개 · `template-path-guard.test.ts`(4, Q107)
- 기존 테스트의 기대는 **하나도 바꾸지 않았어요**(`git diff --numstat` 의 테스트 파일 삭제 줄 0). WI-0075 의 「// 사용자 파일」 package.json 은 JSON 이 아니라 Q101 로 종전처럼 덮어써져 그대로 통과해요. WI-0085 의 MCP · CLI 의존성 안내 테스트도 그대로예요
