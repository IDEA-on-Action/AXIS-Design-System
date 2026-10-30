# WI-0088: template apply · MCP apply_template 이 사용자 package.json 을 합침 릴리스 노트

> **발행**(2026-10-31, npm cli 1.7.9 · mcp 1.4.8, Version PR #266 · publish run 41135645387, provenance 2/2). 이 문서의 결정은 2026-10-30 사용자가 모두 확정했어요(아래 「확인 대기」 표기는 작성 당시 상태예요).

> 2026-10-30 작성(수정본 측정 반영). 결정 Q100 ~ Q107 은 권장안으로 진행했고 사용자 확인 대기예요([prd 7절](./prd.md))
> 대상: `@axis-ds/cli` patch · `@axis-ds/mcp` patch(registry-core 변경) | GitHub: #223 | linked 4패키지(tokens · theme · ui-react · agentic-ui)는 바뀌지 않아요

## 보안 수정

- 템플릿의 파일 경로(`files[].path`)와 postInstall 대상(`postInstall[].file`)이 대상 디렉터리 밖을 가리키면 `axis template apply` · `template init` · `template diff` 와 MCP `axis.apply_template` · `axis.diff_template` 이 **어떤 파일도 쓰거나 읽기 전에** 오류로 멈춰요. 막는 경우: 절대 경로, `../escape.txt` · `a/../../escape` 처럼 상위로 나가는 경로, 프로젝트 안 심볼릭 링크를 거쳐 밖으로 나가는 경로(끊긴 링크 포함)
  - 종전에는 경로를 그대로 이어 붙여, 오염된 레지스트리나 `AXIS_TEMPLATE_URL` 로 지정한 레지스트리가 프로젝트 밖에 파일을 쓰거나 밖의 파일을 비교용으로 읽을 수 있었어요
  - 문구: `템플릿 경로 '<경로>' 가 대상 디렉터리 밖을 가리켜(<원인>) 중단했습니다. 아무 파일도 바꾸지 않았습니다`(CLI rc 1, MCP 오류 응답, 같은 문구)
  - **정상 템플릿은 영향이 없어요**: 저장소 템플릿 5개의 경로는 모두 안쪽이고, 측정 70칸 결과가 이 수정 전과 바이트 같아요. 프로젝트 안을 가리키는 심볼릭 링크는 그대로 허용해요

## 바뀐 점

- `axis template apply` · `template init` · MCP `axis.apply_template` 이 대상에 이미 있는 `package.json` 을 템플릿 package.json 으로 덮어쓰지 않고 합쳐요.
  - `packageManager` · `name` · `version` · `private` · `workspaces` · `engines` · `type` 등 최상위 필드는 사용자 값을 두고, 템플릿에만 있는 필드는 뒤에 붙여요
  - `scripts` · `dependencies` · `devDependencies` · `peerDependencies` · `optionalDependencies` 는 키 단위로 합쳐요. 같은 키는 템플릿 값(「필요한 의존성」 설치 명령과 같은 범위)이고, 사용자에게만 있는 키는 남아요
  - 측정: 사용자 필드 18개짜리 package.json 에서 사라지던 최상위 필드 12개가 0개가 됐어요(템플릿 5개 × CLI · MCP)
- 그래서 apply 뒤 `axis check` 등 다음 명령의 설치 안내가 사용자의 `packageManager` 를 따라요. 측정: lockfile 없이 `packageManager: yarn@4.5.0` 인 앱은 apply 뒤 check 안내가 `pnpm install` 에서 `yarn install` 로 바뀌었어요
- npm 워크스페이스 앱의 이름(예: `@acme/web`)과 `workspace:*` 의존성이 남아요(종전에는 템플릿 이름 `axis-…` 로 바뀌고 의존성이 사라짐)
- ontology-console 템플릿의 `axis.config.json` 도 기존 파일과 합쳐요. 같은 키는 템플릿 값이고 사용자에게만 있는 키(예: `registry`)는 남아요
- 합친 파일은 기존 파일의 들여쓰기(탭 · 칸 수) · CRLF · 끝 줄바꿈 유무를 따라요
- CLI 충돌 목록 · `--dry-run` 은 그 파일을 「합치기 (기존 필드를 두고 템플릿 키를 합침)」로, MCP 결과는 「합치기: 기존 필드를 두고 템플릿 키를 합침」으로 보여 줘요
- 파일을 쓰는 도중 실패하면 건드린 파일을 원래 내용으로 되돌리고(새로 만든 파일 · 빈 디렉터리는 지움) CLI 는 rc 1, MCP 는 오류 응답이에요. `template init` 은 그때 axis.config.json 을 만들지 않고 다음 단계도 안내하지 않아요

## 종료 코드

- 쓰기에 성공하는 경우는 **바뀌지 않아요**(측정 35칸 rc 0 → 0). 충돌 확인(`-y` 없는 비대화형 rc 1)도 그대로예요
- 쓰는 도중 실패하는 경우와 템플릿 경로가 대상 디렉터리 밖을 가리키는 경우(보안 수정)만 rc 1 이에요(종전에는 각각 처리되지 않은 오류 · 그대로 씀)

## 바뀌지 않은 점

- 빈 디렉터리(같은 경로의 파일이 없음)에 쓰는 파일은 템플릿 바이트 그대로예요(측정 10/10)
- package.json · axis.config.json 이 아닌 파일(tsconfig.json · tailwind.config.ts · app/* 등)과 하위 경로의 package.json 은 종전처럼 덮어써요
- 기존 package.json 을 JSON 객체로 읽을 수 없으면 종전처럼 템플릿 내용으로 덮어쓰고 「기존 package.json 을 JSON 객체로 읽을 수 없어 템플릿 내용으로 덮어씁니다」 한 줄로 알려요
- 「필요한 의존성」 명령과 매니저 판정(WI-0085), 기존 프로젝트 구조 경고(WI-0037)

## 알려진 한계

- 같은 패키지가 사용자 `dependencies` 와 템플릿 `devDependencies` 처럼 다른 맵에 있으면 두 맵에 함께 남아요
- axis.config.json 의 `componentsDir` 는 템플릿 값(`./components/ui`)으로 바뀌어요. 다른 위치에 컴포넌트를 두고 있었다면 apply 뒤 고쳐 주세요
- 합친 JSON 은 `JSON.stringify` 서식으로 다시 써져 한 줄 배열 같은 원래 서식은 펼쳐져요
- postInstall json-merge 는 CLI(깊게) · MCP(얕게)가 여전히 달라요(현재 템플릿에는 postInstall 이 없어 드러나지 않음)

## 주의: 합쳐도 템플릿 값으로 바뀌는 것 (2026-10-30 추가)

- 양쪽에 같은 이름이 있는 `scripts` · 의존성 4맵의 키와 axis.config.json 의 키는 템플릿 값으로 바뀌어요(Q103 · Q105). 사용자가 고정한 버전(예: `react` `18.3.1`)도 템플릿 범위로 바뀌어요
- JSON 으로 읽을 수 없는 package.json 과 하위 경로의 package.json 은 종전처럼 통째로 덮어써요(Q101)
- 지키려면 apply 전에 `axis template diff` · `--dry-run` 으로 「합치기」 대상을 확인하고, apply 뒤 버전 관리 diff 로 되돌려요
