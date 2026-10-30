# WI-0088: template apply · MCP apply_template 이 사용자 package.json 을 덮어쓰지 않고 합침 PRD

> 작성일: 2026-10-30 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0088 | GitHub: #223 | 우선순위: P3 | 상태: 구현 · 검증 완료, 결정 Q100 ~ Q107 은 **권장안으로 진행, 사용자 확인 대기**(Q107 경로 탈출 방어는 2026-10-30 Master 요청으로 추가)
> 기준: `main` e32275e (linked 1.8.2 · cli 1.7.8 · mcp 1.4.7 발행됨). 착수 측정은 e32275e 소스로 빌드한 cli · mcp dist 로 했어요
> 출처: 배치 6c 검토(WI-0085 D6, 2026-10-26)에서 분리. axis.config.json 덮어쓰기는 WI-0027 AC9 · project-todo 「ontology 테마 완료」 메모가 이 WI 범위로 넘겼어요
> 표기: **측정**(이번에 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, e32275e 빌드)

`axis template apply` · `template init` 과 MCP `axis.apply_template` 은 템플릿 파일 내용을 그대로 써요(`template-apply.ts` · `tools/template.ts` 의 `fs.writeFile(dest, file.content)`). 템플릿 5개(landing-page · dashboard · hr-dashboard · theme-only · ontology-console)는 모두 루트 `package.json` 을 갖고, ontology-console 은 `axis.config.json` 도 가져요. 그래서 사용자 파일이 통째로 템플릿 파일로 바뀌어요.

착수 측정(사용자 프로젝트 모양 7 × 템플릿 5 × CLI · MCP = **70칸**, testplan 2절):

| 사용자 프로젝트 | 결과(5템플릿 모두 같음, CLI = MCP) |
|---|---|
| rich(최상위 필드 18개) | 최상위 키 **12개 사라짐**(description · type · packageManager · engines · license · repository · browserslist · peerDependencies · optionalDependencies · overrides · pnpm · resolutions), **6개 바뀜**(name · version · private · scripts · dependencies · devDependencies), 맵 안 키 6개 사라짐(scripts.test · scripts.user:only · dependencies.zod · devDependencies.vitest · 맵째 사라진 peer · optional 각 1) |
| pm-yarn · pm-npm(lockfile 없음, `packageManager` 만) | `packageManager` 사라짐, name 바뀜. apply 의 「필요한 의존성」은 yarn · npm 로 맞지만(WI-0085 D6) **그다음 `axis check` 의 설치 안내는 `pnpm install`**(이슈 #223 증상) |
| ws-app(npm 워크스페이스의 apps/web) | name `@acme/web` → `axis-landing-page` 등, version 바뀜, `dependencies["@acme/ui"]: "workspace:*"` 사라짐. check 안내는 루트 lockfile 로 npm(맞음) |
| cfg + ontology-console | axis.config.json 의 사용자 키 `registry` 사라짐, componentsDir · tailwindConfig · globalCss · brand 는 템플릿 값 |
| empty(파일 없음) · broken(JSON 아님) | 템플릿 바이트 그대로(대조) |

- 70칸 모두 쓰인 package.json 이 템플릿 바이트와 같았어요(70/70). CLI 와 MCP 는 35쌍 모두 같은 결과예요. CLI rc 는 모두 0 이에요
- 템플릿에 `postInstall` 은 없어요(5/5, 측정). 그래서 CLI(깊은 json-merge) · MCP(얕은 json-merge)의 postInstall 차이는 지금 드러나지 않아요(4절)

### 1.2 결정

#### 사용자 결정 대기 (권장안으로 진행)

Q100 ~ Q107 은 모두 7절 권장안으로 구현했어요. **권장안으로 진행, 사용자 확인 대기**예요. 다른 선택지로 바꾸면 plan 2절의 해당 함수만 바뀌어요.

| # | 진행한 권장안 |
|---|---|
| Q100 | package.json 은 합침: 최상위 키는 사용자 값, 템플릿에만 있는 키는 뒤에 붙임 |
| Q101 | JSON 객체로 읽을 수 없는 기존 파일은 종전처럼 덮어쓰고 한 줄로 알림 |
| Q102 | 합친 파일은 기존 파일의 들여쓰기 · CRLF · 끝 줄바꿈을 따름 |
| Q103 | axis.config.json 도 합침: 같은 키는 템플릿 값, 사용자에게만 있는 키는 남김 |
| Q104 | 합친 파일은 「합치기」로 표시(CLI 충돌 목록 · `--dry-run` · 쓰기 뒤 한 줄, MCP `action: "merged"`) |
| Q105 | `scripts` · 의존성 4맵은 키 단위로 합치고 같은 키는 템플릿 값 |
| Q106 | 쓸 내용을 먼저 모두 정하고, 쓰는 도중 실패하면 건드린 파일을 되돌림. init 은 그때 멈춤 |
| Q107 | 템플릿 경로(files[].path · postInstall[].file)가 대상 디렉터리 밖(절대 경로 · `..` · 심볼릭 링크 경유)이면 어떤 파일도 쓰거나 읽기 전에 오류로 중단(보안 수정) |

#### 선례 · 이어받는 결정

| 출처 | 내용 | 이 WI 에서 |
|---|---|---|
| WI-0085 D6 | 매니저는 템플릿 파일을 쓰기 전의 프로젝트로 고름 | 그대로 둠(합친 뒤에도 같은 값이지만 순서를 바꾸지 않음) |
| WI-0075 D1 · D2 | 충돌이 있으면 `-y` 없는 비대화형은 rc 1 · 아무것도 쓰지 않음 | 그대로. 합치는 파일도 충돌로 셈(내용이 바뀌므로) |
| WI-0037 D3 | 기존 프로젝트 apply 는 구조 경고만 | 그대로 |
| theme add rollback(`theme-add-rollback.test.ts`) | 쓰기 도중 실패하면 되돌리고 오류 | 같은 방식(Q106) |
| WI-0080 · 배치 6b | registry-core 를 바꾸면 cli · mcp 를 함께 올림 | changeset cli · mcp patch |

## 2. 범위

### 2.1 하는 것

1. registry-core 에 **템플릿 파일 쓰기 코어** `apply-files.ts`(`@axis-ds/registry-core/apply-files`)를 둬요. 쓸 내용 계획(`planTemplateFiles`) · 합치기(`mergePackageJson` · `mergeAxisConfigJson`) · 되돌리는 쓰기(`writeTemplateFiles`)
2. CLI `applyTemplate`(apply · init 공용)과 MCP `handleApplyTemplate` 이 이 코어를 써요(CLI = MCP 를 구조로 보장)
3. 「합치기」 표시와 JSON 으로 읽을 수 없는 파일 알림(Q101 · Q104)
4. 쓰기 도중 실패 되돌림, init 중단(Q106)
5. **경로 탈출 방어(Q107, 보안 수정)**: 템플릿 `files[].path` · `postInstall[].file` 은 원격 레지스트리 JSON 에서 와요(`AXIS_TEMPLATE_URL` 로 바꿀 수 있음). main 은 CLI · MCP 모두 `path.join(baseDir, file.path)` 그대로라 오염된 레지스트리가 프로젝트 밖에 쓰거나 읽을 수 있었어요(이 WI 의 되돌리기 삭제도 같은 경로를 씀). `resolveTemplatePath` 하나로 CLI apply · init · diff · postInstall, MCP apply_template · diff_template 의 경로를 모두 검증해요
6. cli · mcp README 한 줄씩, changeset cli · mcp patch

### 2.2 하지 않는 것

- package.json · axis.config.json 이 아닌 파일(tsconfig.json · tailwind.config.ts · app/* 등)은 종전처럼 덮어써요
- 하위 경로의 package.json(템플릿에는 없음, 측정)은 합치지 않아요
- postInstall 패치의 CLI · MCP 차이 정리(템플릿에 postInstall 이 없어 드러나지 않음, 후속 후보)
- 「필요한 의존성」 명령 · 매니저 판정(`detectInstallCommand`, WI-0096 범위)은 바꾸지 않아요

### 2.3 알려진 한계 (이 WI 뒤에도 남음)

- 같은 패키지가 사용자 `dependencies` 와 템플릿 `devDependencies` 처럼 **다른 맵**에 있으면 두 맵에 함께 남아요(맵 사이 이동은 하지 않음, 매니저별 동작은 미측정)
- axis.config.json 의 `componentsDir` 는 템플릿 값(`./components/ui`)이 이겨서, 사용자가 다른 위치에 컴포넌트를 두고 있었다면 다음 `axis add` 위치가 바뀌어요(Q103 의 대가, 템플릿은 그 디렉터리에 파일을 쓰지 않음)
- 합치면 JSON 을 다시 쓰므로 원래 파일의 키 사이 공백 · 한 줄 배열 같은 서식은 `JSON.stringify` 서식으로 바뀌어요(들여쓰기 · CRLF · 끝 줄바꿈만 따름)
- 되돌리기는 이 프로세스가 쓴 파일만이에요. 되돌리기 자체가 실패하면 그 파일 이름을 오류 문구에 적어요

## 3. 수용 기준 (AC)

| AC | 내용 | 근거(측정) | 결정 |
|---|---|---|---|
| AC1 | 70칸 측정에서 사용자 최상위 키 사라짐이 0 이에요(rich 12 → 0, pm-* 1 → 0) | testplan 2 · 4절 | Q100 |
| AC2 | pm-yarn · pm-npm 에서 apply 뒤 `axis check` 의 설치 안내가 yarn · npm 이에요(종전 pnpm) | 같음 | Q100 |
| AC3 | ws-app 의 name · version · `workspace:*` 의존성이 남아요 | 같음 | Q100 · Q105 |
| AC4 | 의존성 · scripts 의 같은 키는 템플릿 값, 사용자에게만 있는 키는 남아요(rich 의 react ^18 → ^19, zod 남음) | 단위 테스트 | Q105 |
| AC5 | ontology-console 의 axis.config.json 에서 사용자에게만 있는 키(registry)가 남고 같은 키는 템플릿 값이에요 | 측정 cfg 행 | Q103 |
| AC6 | 빈 디렉터리 · JSON 아님(empty · broken 10칸 × 2)은 템플릿 바이트 그대로예요(종전과 같음). broken 은 알림 한 줄 | 측정 20/20 | Q101 |
| AC7 | 합친 파일은 기존 들여쓰기(탭 · 4칸) · CRLF · 끝 줄바꿈 유무를 따라요 | 단위 테스트 | Q102 |
| AC8 | CLI 충돌 목록 · `--dry-run` · 쓰기 뒤 줄과 MCP 결과가 합친 파일을 「합치기」로 보여요. 충돌 확인 rc(비대화형 `-y` 없음 rc 1)는 그대로예요 | 테스트 | Q104 |
| AC9 | 쓰기 도중 실패하면 건드린 파일이 원래 바이트로 돌아오고 새 파일 · 새 디렉터리가 지워지며, CLI rc 1 · MCP 오류 · init 은 axis.config.json · 다음 단계 없음 | 실패 주입 테스트 | Q106 |
| AC10 | CLI = MCP: 측정 35쌍이 같은 결과, 같은 픽스처에서 쓴 package.json 바이트가 같아요 | 측정 · MCP 테스트 | - |
| AC11 | 새 테스트는 호출지를 HEAD 로 되돌리면 빨강, 코어 변이 모두 빨강, 기존 테스트 기대는 바뀌지 않아요. registry-core · cli · mcp build · type-check · lint · test(`--force`) 통과 | testplan 5 · 6절 | - |
| AC13 | 템플릿 경로 `../escape.txt` · 절대 경로 · `a/../../escape` · 디렉터리 심볼릭 링크 경유 · 파일 심볼릭 링크 · 끊긴 링크 · 밖을 가리키는 postInstall 대상에서 CLI apply(`-y` · `--dry-run`) · init · diff, MCP apply_template(dryRun 포함) · diff_template 이 rc 1 · 오류로 끝나고, 대상 디렉터리 밖에 파일이 생기지 않으며 안쪽 파일도 하나도 바뀌지 않아요(정상 파일을 앞에 둬 부분 적용이 없음을 확인). CLI · MCP 오류 문구가 같아요. 저장소의 실제 템플릿 5개는 그대로 적용돼요(70칸 재측정 결과가 Q107 전과 바이트 같음) | testplan 7절 | Q107 |
| AC12 | changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0 | - | - |

## 4. 미측정 · 위험

| 항목 | 상태 | 영향 |
|---|---|---|
| 합친 package.json 위에서 실제 `npm install` · `yarn install` · `pnpm install` | 미측정 | 키를 지우지 않으므로 종전보다 나빠지지 않는다고 봐요(추정). 맵 사이 중복(2.3)은 매니저마다 다를 수 있음 |
| postInstall json-merge 의 CLI(깊게) · MCP(얕게) 차이 | 템플릿에 postInstall 0/5(측정) | 템플릿이 postInstall 을 쓰기 시작하면 CLI ≠ MCP. 후속 WI 후보 |
| Windows 줄바꿈(CRLF) 실기 | 단위 테스트로만 확인 | - |
| WI-0096(설치 위치 안내)과의 겹침 | 이 WI 는 registry-core `project.ts` 를 고치지 않음(새 파일만) | 텍스트 충돌 없음(추정) |

## 5. 의존 · 순서

- 배치 10(WI-0088 ∥ 0096 ∥ 0102 ∥ 0104) 안에서 registry-core 를 바꾸는 WI 와는 `package.json` 의 `exports` 한 줄만 겹칠 수 있어요(새 subpath 추가)
- 발행은 배치 10 Version PR 하나에 cli · mcp patch 로 묶어요(linked 4패키지는 그대로)

## 6. 측정 출처

- scratchpad `S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/4ae00ed9-0062-46ea-b36b-1f1bfaf43fe2/scratchpad/WI-0088`(세션 임시 경로)
- 측정 스크립트 `$S/measure.mjs`(로컬 HTTP 로 `apps/web/public/templates` 를 `AXIS_TEMPLATE_URL` 에 주고, CLI 는 `node <cli>/index.js template apply <t> --dir <d> -y`, MCP 는 stdio `axis.apply_template`, 뒤이어 CLI `check --dir <d>`), 요약 `$S/summary.mjs`
- 수정 전: `$S/out-base/all.tsv` · 칸별 출력 `<템플릿>.<픽스처>.<cli|mcp>.txt`. 수정 후: `$S/out-fix/`
- 변이: `$S/mutate.mjs` → `$S/mutate.tsv`, 경로 검증 변이 `$S/guard-mutate.mjs` → `$S/guard-mutate.tsv`, Q107 뒤 재측정 `$S/out-guard/`

## 7. 사용자 결정 항목 (Q100 ~ Q107, 권장안으로 진행, 사용자 확인 대기)

| # | 질문 | 선택지 | 권장안 | 근거 |
|---|---|---|---|---|
| Q100 | 기존 package.json 이 있을 때 어떻게 쓸까요 | (a) 합침: 최상위 키는 사용자 값, 템플릿에만 있는 키는 붙임(맵은 Q105) (b) `packageManager` 만 보존하고 나머지는 종전 덮어쓰기 (c) 기존 package.json 이 있으면 쓰지 않고 「필요한 의존성」 안내만 (d) 종전(덮어쓰기) | (a) | 측정: rich 에서 12개 사라짐 · ws-app 에서 워크스페이스 이름과 `workspace:*` 의존성이 사라져요. (b) 는 이슈 문구만 고치고 나머지 소실은 남아요. (c) 는 템플릿 scripts(dev · build · `check:ontology`)가 빠지고 의존성 선언도 설치 명령을 돌려야 생겨요. (a) 는 키를 지우지 않아 종전보다 잃는 것이 없어요 |
| Q101 | 기존 파일을 JSON 객체로 읽을 수 없으면(주석 · 깨진 JSON · 배열) | (a) 종전처럼 템플릿으로 덮어쓰고 한 줄 알림 (b) 그 파일만 건너뛰고 알림 (c) 아무것도 쓰지 않고 rc 1 | (a) | 종전 동작 · 기존 테스트(WI-0075 「// 사용자 파일」 픽스처)와 같아요. 이미 깨진 파일이라 합칠 대상이 없고, 충돌 확인(CLI)은 그대로 거쳐요. (b) 는 템플릿이 의존성 선언 없이 남고, (c) 는 apply 를 막아요 |
| Q102 | 합친 파일의 서식 | (a) 기존 파일의 들여쓰기 · CRLF · 끝 줄바꿈 유무를 따름 (b) 템플릿처럼 2칸 · LF · 끝 줄바꿈 | (a) | 사용자 파일이 diff 에서 통째로 바뀌는 것을 줄여요. 탐지는 첫 들여쓰기 줄 하나로 단순해요 |
| Q103 | 템플릿 axis.config.json(ontology-console)이 기존 axis.config.json 을 만날 때 | (a) 키 단위로 합침, 같은 키는 템플릿 값, 사용자에게만 있는 키는 남김 (b) 같은 키도 사용자 값 (c) 이 WI 범위 밖(종전 덮어쓰기) | (a) | 측정: 종전에는 `registry` 같은 사용자 전용 키가 사라져요. 같은 키(tailwindConfig · globalCss · brand)는 템플릿이 쓴 파일과 `<html data-brand="ontology">` 를 가리켜 (b) 로 두면 check 가 다른 파일 · 브랜드를 봐요. 대가는 componentsDir(2.3) |
| Q104 | 합친 파일을 어떻게 보일까요 | (a) 「합치기」로 따로 표시(CLI 충돌 목록 「(기존 필드를 두고 템플릿 키를 합침)」 · `--dry-run` · 쓰기 뒤 한 줄, MCP `action: "merged"` · 「합치기: …」) (b) 종전처럼 「덮어쓰기」 | (a) | 사용자가 package.json 이 지워지지 않는다는 것을 확인하고 `-y` 를 고를 수 있어요. MCP 결과 객체의 `action` 에 새 값 `merged` 가 생기는 것은 응답 형식 변화예요(도구 응답은 포매팅된 텍스트라 영향은 작다고 봐요, 추정) |
| Q105 | `scripts` · `dependencies` · `devDependencies` · `peerDependencies` · `optionalDependencies` 의 같은 키 | (a) 템플릿 값(사용자에게만 있는 키는 남김) (b) 사용자 값 (c) 맵 전체를 사용자 값 | (a) | 템플릿 코드는 그 범위(예: react ^19 · tailwindcss ^3.4)를 전제로 하고, 「필요한 의존성」 명령도 템플릿 범위를 설치해요. 종전 동작(템플릿 값)과도 같아요. (b) 는 선언과 설치 명령이 어긋나요 |
| Q107 | 템플릿 경로가 대상 디렉터리 밖을 가리킬 때(보안 리뷰 지적, Master 요청) | (a) 쓰기 · 읽기 · 삭제 전에 모든 경로를 한 함수로 검증하고 하나라도 밖이면 아무것도 건드리지 않고 오류(절대 경로 · `..` · 실경로가 밖인 심볼릭 링크 · 끊긴 링크 · 빈 경로 거부) (b) 밖을 가리키는 파일만 건너뛰고 나머지 적용 (c) 어휘 검사만(심볼릭 링크는 보지 않음) | (a) | (b) 는 오염된 템플릿을 부분 적용해 결과를 예측하기 어려워요. (c) 는 프로젝트 안 링크를 거친 쓰기를 못 막아요. 저장소 템플릿 5개의 경로는 모두 안쪽이라 정상 사용에는 영향이 없어요(측정 70칸 결과 바이트 같음). 안쪽을 가리키는 링크는 허용해요 |
| Q106 | 이슈의 「rollback 테스트」 범위 | (a) 쓸 내용을 먼저 모두 정하고, 쓰는 도중 실패하면 건드린 파일을 원래대로 · 새 파일과 새 빈 디렉터리 삭제, CLI rc 1 · MCP 오류, init 은 멈춤(실패 주입 테스트) (b) 계산만 먼저 하고 되돌리기는 하지 않음 (c) package.json 백업 파일을 남김 | (a) | 합치기는 사용자 파일을 다시 쓰므로 중간 실패 때 반쯤 바뀐 프로젝트가 남지 않아야 해요. theme add 가 같은 방식이에요(`theme-add-rollback.test.ts`). (c) 는 파일이 늘어나 사용자가 지워야 해요 |
