# WI-0027 테스트 계획 · 결과: 온톨로지 콘솔 템플릿

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | GitHub: #86 | 실행일: 2026-10-26 | 기준: `main` d7ae4a5 위 브랜치 `feat/wi-0027-ontology-console`(8절은 origin/main fd0a480 병합 뒤 포함)
> 표기: **측정**(이번에 실행) · **추정**(실행하지 않음). 측정 자료: 세션 scratchpad `w27impl/`(레포 밖)
> npm 상태: 착수 때는 1.8.2 가 없어(`npm view` 1.8.1) 로컬 tarball 로 먼저 쟀고, 측정 중 Release #229 가 발행돼(tokens 1.8.2 `time.modified` 2026-10-26T09:56Z, ui-react · theme 1.8.2, cli 1.7.3, mcp 1.4.3) **npm 발행본으로 다시 쟀어요.** 아래 표의 결과 앱 값은 발행본 기준이고, tarball 측정은 4절에 따로 적어요.

## 1. 저장소 게이트 (AC7)

| 게이트 | 명령 | 결과 |
|---|---|---|
| lint | `pnpm turbo run lint --force` | rc 0, 7 tasks, Cached 0 |
| type-check | `pnpm turbo run type-check --force` | rc 0, 11 tasks, Cached 0. `apps/web` tsc 가 템플릿 파일 20개(`templates/ontology-console`)를 함께 검사(`tsc --listFilesOnly`) |
| build | `pnpm turbo run build --force` | rc 0, 8 tasks, Cached 0. 생성기 「ontology-console.json (26개 파일)」 · 「index.json (43개 템플릿, 로컬 5)」, 정적 경로 `/templates/ontology-console/` 생성 |
| test | `pnpm turbo run test --force` | rc 0, 7 tasks, Cached 0 (cli 873 · mcp 181 · ui-react 199 · agentic-ui 148 · theme 47 등) |
| frontend.yml 나머지 run 단계 | check-token-refs · check-contrast-pairs · check-types-versions · check-changeset-mcp-tokens · check-library-links · build:registry · test:registry · check-licenses · pack-smoke · cli-smoke · registry-install-smoke | 11단계 모두 rc 0 (registry-install-smoke 5/5) |
| E2E static | 5절 | 5절 |

- cli 테스트 1건을 고쳤어요: `init.test.ts` 「tailwind-merge: 템플릿 4종」이 템플릿 개수를 4 로 고정해 새 템플릿에서 `expected 5 to be 4` 로 실패(고치기 전 측정). 같은 파일 clsx 테스트처럼 0건만 막도록 바꿨고, 규칙값 대조는 새 템플릿 포함 5개 모두에 그대로 걸려요. 테스트 파일이라 발행물(`files: ["dist"]`)은 바뀌지 않아요.
- 생성기 음성 대조: `template.json` 의 `@axis-ds/theme` 를 `^1.8.1` 로 바꾸자 「ontology-console: template.json 과 files/package.json 의 의존성이 다릅니다 / dependencies.@axis-ds/theme: template.json ^1.8.1 / files/package.json ^1.8.2」로 rc 1, 되돌리면 rc 0.
- a11y 건수 가드: `a11y-routes.cjs` 의 `templates/[slug]` 는 상세 JSON 이 있는 첫 항목(dashboard)만 보므로 새 상세 페이지가 생겨도 59경로 x 4조합 = 236건 그대로(측정).

## 2. 템플릿 스모크 (AC2, FR-6)

`node scripts/template-smoke.mjs`(빌드한 cli, 127.0.0.1 템플릿 서버 + `AXIS_TEMPLATE_URL` 주입 전제, npm install 은 실제 레지스트리, next build, CSS · HTML 내용 판정). 기본 목록은 이제 `index.json` 에서 계산해요.

| 입력 | slug(계산된 목록) | 결과 | rc |
|---|---|---|---|
| 이 브랜치 JSON | dashboard · hr-dashboard · landing-page · ontology-console · theme-only (5, 외부 블록 38개 제외) | 5/5 PASS. ontology-console: `@tailwind` 0 · `.bg-background` 1 · `--axis-*` 813 · 옛 `--primary` 0 · `data-brand="ontology"`(index.html) 1 | 0 |
| layout 의 `data-brand` 를 지운 JSON(`--templates-dir`, 음성 대조) | ontology-console | CSS 판정은 모두 통과인데 `data-brand` 0 → FAIL | 1 |

- template-smoke 는 CI 에서 돌지 않아요(frontend.yml 에 run 0건). `scripts/**` 변경은 CI 를 트리거하지만 이 스크립트 자체는 로컬 기록이 근거예요.

## 3. 결과 앱 (AC2 · AC3 · AC6, 발행본)

발행본 `npx @axis-ds/cli@1.7.3 template init ontology-console`(템플릿 JSON 은 이 브랜치 생성물, `AXIS_TEMPLATE_URL` 주입 전제) → install(npm 레지스트리, 주입 없음) → `next build`.

| 항목 | npm | pnpm(isolated 단독 앱, `node-linker=isolated` · `shamefully-hoist=false`) |
|---|---|---|
| init · install · build rc | 0 · 0 · 0 | 0 · 0 · 0 |
| 설치본 tokens · ui-react · theme | 1.8.2 · 1.8.2 · 1.8.2 (lock resolved `registry.npmjs.org/.../theme-1.8.2.tgz`) | 1.8.2 · 1.8.2 · 1.8.2 |
| CSS | `@tailwind` 0 · `.bg-background` 1 · `--axis-*` 813 · `[data-brand=ontology]` 선택자 5 | 같음 |
| 서버 HTML `data-brand="ontology"` | index.html 1 · entities.html 1 | 같음 |
| `npm run check:ontology` | rc 0, 검사 파일 20개 · 위반 0건 | 같음 |
| `axis check`(cli 1.7.3) | rc 0, 9 pass / 0 warn / 0 fail (brand · brand.activation · tailwind.content · animation PASS) | 같음 |

- `axis check` 를 cli 1.7.2 로도 재어 npm · pnpm 모두 9 / 0 / 0(tarball 앱, 4절).
- 배포 뒤 주입 없는 실경로(pages.dev 색인 · 새 HOME)는 아직 재지 않았어요(머지 · 배포 뒤 AC1 · AC2 · AC8).

### 3.1 check:ontology 변이 (AC6 음성 대조)

템플릿 `files/` 사본에 위반을 하나씩 넣어 실행(`check-mutations.mjs`).

| 변이 | rc | 보고 |
|---|---|---|
| 변이 없음 | 0 | 검사 파일 20개, 위반 0건 |
| 문구에 긴 줄표 | 1 | `app/entities/page.tsx:12 em-dash` |
| 주석에 긴 줄표 | 1 | `lib/utils.ts:4 em-dash` |
| JSX 문구에 느낌표 | 1 | `app/page.tsx:44 exclamation` |
| 문자열에 느낌표 | 1 | `lib/demo-data.ts:52 exclamation` |
| `border-l-4 border-primary` | 1 | `components/ontology/list-head.tsx:11 one-side-line` |
| CSS `border-left: 3px solid hsl(var(--primary))` | 1 | `app/globals.css:19 one-side-line` |
| `<Card className="shadow-md ...">` | 1 | `components/ontology/page-frame.tsx:20 card-shadow` |
| `bg-card shadow-sm` | 1 | `app/page.tsx:49 card-shadow` |
| CSS `.my-card { box-shadow }` | 1 | `app/globals.css:19 card-shadow` |
| `text-red-500` · `text-white` · `text-[#326ADA]` · CSS `rgb(50, 106, 218)` | 1 · 1 · 1 · 1 | 각각 `palette` |
| (통과 기대) `border-l border-border` · `bg-card shadow-none` | 0 · 0 | 위반 0건 |
| (측정 실패 기대) 대상 디렉터리 없음 | 2 | 「검사할 파일이 없어요」 |

## 4. 로컬 tarball 측정 (1.8.2 발행 전, 기록용)

착수 때 npm 에 1.8.2 가 없어 워크스페이스 tokens · ui-react · theme 를 `pnpm pack` 한 뒤 version 과 `@axis-ds/*` 의존을 1.8.2 로 고쳐 다시 묶은 tarball 을 결과 앱 `package.json` 에 `file:` 로 주입했어요(npm 은 `overrides` `$이름`, pnpm 은 `pnpm.overrides`). 이 측정은 **주입 전제**이고 판정 근거는 3절 발행본 측정이에요. 결과는 3절과 같았어요(npm · pnpm 각각 init · install · build rc 0, data-brand 1 · 1, check:ontology 0건, 워크스페이스 cli · 발행본 cli 1.7.2 `axis check` 9 / 0 / 0).

## 5. E2E static (frontend.yml 과 같은 6종)

`E2E_SERVER=static`(`apps/web/out` 을 python 정적 서버로), 이 브랜치 `turbo build --force` 산출물.

| spec | 결과 |
|---|---|
| a11y | rc 0, expected 236 · unexpected 0 · flaky 0 · skipped 0 (기대 59경로 x 4조합 = 236, 건수 가드와 같음) |
| nontext | rc 0, 12 · 0 · 0 · 0 |
| demo | rc 0, 8 · 0 · 0 · 0 |
| tooltip | rc 0, 6 · 0 · 0 · 0 |
| library | rc 0, 4 · 0 · 0 · 0 |
| tokens | rc 0, 22 · 0 · 0 · 0 |

갤러리(같은 `out` 을 정적 서버로): `/templates/` 에 Console 탭 1개, 누르면 「Ontology Console」 카드 1개, `/templates/ontology-console/` h1 「Ontology Console」 · category 표시 「Console」(Playwright 측정).

## 6. 브라우저 측정 (AC3 · AC4 · AC5)

발행본 앱(3절 npm)을 `next start` 로 띄우고 Chromium(Playwright 1.61.1)으로 `measure.mjs` 실행. 1440x900.

### 6.1 axe (wcag2a · wcag2aa · wcag21a · wcag21aa)

| 화면 | 라이트(passes · 위반) | 다크(passes · 위반) |
|---|---|---|
| `/` 통합 뷰 | 25 · 0 | 25 · 0 |
| `/entities` 목록 | 27 · 0 | 27 · 0 |
| `/entities/e-order` depth 상세 | 27 · 0 | 27 · 0 |
| `/projects/p-commerce` 2분할 | 27 · 0 | 27 · 0 |

8회 모두 `data-brand="ontology"`, 다크는 `<html class="dark">` 확인. 음성 대조: 통합 뷰 부제를 `text-border` 로 바꾼 사본에서 `color-contrast` 1건(게이트가 실제로 잡음).

### 6.2 브랜드 (AC3)

| 항목 | 라이트 | 다크 |
|---|---|---|
| `--primary` 계산값 | `220 69.4% 52.5%` | `219.7 81.6% 68%` |
| 설치본 `brands/ontology.css` 기대값 | 같음 | 같음 |

음성 대조(tarball 앱에서 소스를 바꿔 다시 빌드):

| 변이 | 서버 HTML data-brand | 하이드레이션 뒤 | `--primary` |
|---|---|---|---|
| layout 의 `data-brand` 제거 | 0 | `ontology`(defaultBrand 가 붙임) | ontology 값 |
| 브랜드 CSS import 주석 처리 | 1 | `ontology` | `221 39% 11%`(기본값) |

### 6.3 치수 (AC4)

| 항목 | 기대 | 측정 |
|---|---|---|
| 사이드바 폭 | 240 | 240 |
| 바탕 여백 위 · 아래 · 오른쪽 | 16 · 16 · 18 | 16 · 16 · 18 |
| 카드 둥글기 · 그림자 | 12px · 없음 | 12px · 투명 0px(그림자 없음) |
| 보조 상자 폭 | 420 | 420 |
| 프로젝트 왼쪽 열 | 300 | 300 |
| 절 사이 | 40 | 40 |
| 페이지 높이(100vh 고정) | 900 | `scrollHeight` 900 |
| 줄 클릭 | depth 상세로 | `/entities/e-order` |
| 대메뉴 하나만 펼침 | 하나만 | 프로젝트를 여니 `aria-expanded` false · true. **이 행은 속성만 재서 표시 결함을 놓쳤어요(8절에서 계산 스타일로 재측정)** |
| 1200px → 1199px | 2분할 → 1열, 보조 상자 → 카드 아래 | `300px 632px` → `931px`, 보조 상자 420 옆 → 933 폭 아래 |

## 7. apply 위 config (AC9)

워크스페이스 cli, 사용자 `axis.config.json`(`componentsDir ./src/components/ui`, brand 없음)을 둔 디렉터리.

| 경우 | rc | config 해시 전 → 후 | 결과 |
|---|---|---|---|
| `template apply` 비대화형 | 1 | 487c867856ba → 같음 | 충돌 목록에 `axis.config.json`, 아무것도 쓰지 않음 |
| `--dry-run` | 0 | 같음 | 미리보기에 `axis.config.json` 표시 |
| `-y` | 0 | → f91b7fd0fc58 | 사용자 config 를 템플릿 config 로 덮음(`componentsDir ./components/ui` · `brand ontology`) |
| config 없는 디렉터리(대조) | 0 | (없음) → f91b7fd0fc58 | 템플릿 config 생성 |

- cli 는 충돌을 보여 주고 `-y` 없이는 쓰지 않아요(말없이 덮지 않음). `-y` 를 주면 package.json(WI-0088) 과 같이 config 도 덮어요.
- MCP `apply_template` 은 소스 판독(`packages/axis-mcp/src/tools/template.ts` `handleApplyTemplate`): 확인 없이 쓰고 결과에 `action: "overwritten"` 만 남겨요(실행 측정은 하지 않음, MCP dist 가 서버 진입점 하나로 묶여 있어 함수만 부르지 못함). 후속 처리는 결과 보고의 결정 항목이에요.

## 8. 구현 검토 반영 재측정 (2026-10-26)

검토 2건(changes_requested)의 지적을 실측으로 판정하고 고친 뒤 다시 쟀어요. 측정 자료: scratchpad `w27fix/`(레포 밖).

### 8.1 판정

| 지적 | 심각도 | 판정 | 조치 |
|---|---|---|---|
| 사이드바: 접은 하위 목록이 보임(`hidden` + `.flex`) | major | 맞음. preflight `[hidden]:where(...)` 와 `.flex` 명시도가 같고 유틸리티가 뒤라 flex 가 이김 | 접히면 className 을 `hidden` 하나로, 펼치면 flex 클래스 |
| check:ontology: cn() 여러 인자 · style 객체를 못 봄 | major | 맞음. 구판에 같은 변이를 넣어 rc 0 재현(8.2 A/B) | 클래스 묶음(className 표현식 · cn/clsx/cva/twMerge 인자) 합산, style 객체 판정 추가 |
| 사이드바 펼침 상태가 경로를 따라가지 않음 | minor | 맞음 | 경로 그룹이 바뀔 때만 그 그룹을 펼침(같은 그룹 안 이동은 사용자가 접은 상태 유지) |
| 팔레트 오탐(`#add`) · 놓침(CSS 이름 색, 따옴표 섞인 JSX 느낌표) | minor | 맞음 | 앵커 · URL 조각 제외, CSS · style 이름 색 148개, JSX 조각은 문자열 리터럴을 지운 나머지를 봄 |
| 카드 모양 div(bg-card 없음) 그림자 통과 | minor | 맞음(FR-4a 정의 안이었음) | `rounded-*` + `border` 조합을 카드로 보도록 넓힘, PRD FR-4a · README 갱신 |
| PRD D1 ~ D9 표기 · ListToolbar | minor | 맞음 | v0.6.1 로 정정 |
| project-todo 배치 5 비고 · origin/main 충돌 | minor | 맞음 | 비고 갱신, origin/main 병합 |
| v0.28 과 보조 상자 · 폰 폭 차이 | minor(기록) | 맞음, PRD 결정에 따른 차이 | README 「지원 화면 폭」 에 기록. 디자인 오너 확인은 결정 항목 |
| a11y 경로에 새 상세 페이지 없음 | minor(기록) | 맞음(59경로 그대로) | 후속. 넣으면 건수 가드 236 이 240 으로 바뀌어 가드 · 문서를 함께 고쳐야 해요 |
| registry-core `axis-config.ts:13` 주석 | minor(기록) | 맞음 | 후속(발행 패키지 소스 변경 0 유지) |

### 8.2 check:ontology 변이 A/B

같은 27종 변이(`check-mutations-v2.mjs`, 위반 기대 20 · 통과 기대 7)를 구판 · 신판 스크립트에 태웠어요. 템플릿 `files/` 사본 기준이고 기준 상태는 둘 다 rc 0(20파일).

| 판 | 기대와 일치 | 놓침 · 오탐 |
|---|---|---|
| 구판(검토 전) | 17/27 | 놓침 8: cn 두 번째 인자 Card 그림자 · cn 조건부 한쪽 색 선 · style borderLeft · bg-card 없는 카드형 div 그림자 · 따옴표 섞인 JSX 느낌표 · CSS 이름 색 · style 이름 색 · Card style boxShadow. 오탐 2: `href="#add"` · `/entities#add` |
| 신판 | 27/27 | 0 |

통과 기대 7종(앵커 · URL 조각 · `!==` 근처 한글 · `shadow-none` Card · `border-r` + `text-primary` · `border-r` + `ring-primary`, style 중립 테두리)은 신판에서 모두 rc 0 이에요. 결과 앱 사본에서도 `cn(..., active && '... border-primary', 'border-l-4')` 를 넣으면 rc 1(`sidebar.tsx:108 one-side-line`), 되돌리면 rc 0 이에요.

### 8.3 저장소 게이트 · E2E

| 게이트 | 결과 |
|---|---|
| turbo lint · type-check · build · test `--force` | rc 0 · 0 · 0 · 0, Cached 0 (7 · 11 · 8 · 7 tasks) |
| frontend.yml run 11단계 | 모두 rc 0 (registry-install-smoke 5/5) |
| E2E static a11y · nontext · demo · tooltip · library · tokens | rc 0, 236 · 12 · 8 · 6 · 4 · 22, unexpected · flaky · skipped 0 (a11y 기대 59 x 4 = 236) |
| origin/main 병합 뒤(9a01eab, 들어온 것은 패키지 버전 · CHANGELOG · 문서뿐) | turbo 4종 `--force` rc 0, Cached 0 · frontend.yml run 11단계 rc 0 · 생성물 6개 JSON 모두 updatedAt 외 차이 0. E2E 는 앱 소스 변경이 없어 병합 전 측정을 근거로 둠 |
| 생성물 | `ontology-console.json` 만 내용 변경(sidebar · check 스크립트), 26파일 모두 소스와 일치. 기존 4종 · index.json 은 updatedAt 만이라 되돌림, build:registry 뒤 r/ version 1.5.0 되돌림 |

### 8.4 결과 앱 (발행본)

새 HOME · `XDG_CONFIG_HOME` · npm 캐시를 scratchpad 로 격리하고, 발행본 `npx @axis-ds/cli@1.7.3 template init ontology-console`(`AXIS_TEMPLATE_URL` 로 이 브랜치 생성물 주입 전제) → `npm install`(tokens · ui-react · theme 1.8.2 발행본, tarball 주입 없음) → `next build`.

| 항목 | 결과 |
|---|---|
| init · install · build | rc 0 · 0 · 0. 받은 sidebar · check 스크립트에 수정 표지 있음 |
| 서버 HTML `data-brand="ontology"` | index 1 · entities 1 |
| `npm run check:ontology` | rc 0, 20파일 · 위반 0건 |
| `axis check`(cli 1.7.3) | rc 0, 9 pass / 0 warn / 0 fail |
| axe(라이트 · 다크 x 4화면, wcag2a/aa · 21a/aa) | 위반 0, passes 25 ~ 27(측정 수행 확인). 다크는 localStorage `axis-theme` 주입 전제, `--primary` 라이트 · 다크 모두 설치본 기대값과 같음 |
| AC4 치수 | 사이드바 240 · 여백 16/16/18 · 둥글기 12px · 그림자 투명 · 보조 상자 420 · 왼쪽 열 300 · 절 사이 40 · scrollHeight 900, 1199px 에서 1열 |

사이드바 계산 스타일(`nav2.mjs`, 1440x900):

| 상황 | 결과 |
|---|---|
| `/entities` 첫 로드 | 온톨로지 펼침(display flex · 높이 51.75), 프로젝트 접힘(hidden · display none · 높이 0), aria-current 「요소 목록」 보임 |
| 온톨로지까지 접음 | 두 목록 모두 display none · 높이 0, ariaSnapshot 에 하위 링크 0(버튼 둘만) |
| 프로젝트 펼침 | 프로젝트 display flex · 높이 91.5, 온톨로지 none |
| `/entities/e-order` 의 프로젝트 링크로 클라이언트 이동 | `/projects/p-commerce`, aria-expanded 온톨로지 false · 프로젝트 true, aria-current 「주문 처리 온톨로지」 보임 |
| 반대로 프로젝트 표의 요소 링크로 이동 | 온톨로지 true · 프로젝트 false, aria-current 「요소 목록」 보임 |
| 같은 그룹 안 이동(온톨로지를 접고 요소 링크) | 접은 상태 유지(경로 그룹이 바뀔 때만 펼침) |

음성 대조: 검토 측정(`w27impl/review-shots`, 수정 전 같은 발행본 경로)에서 접은 목록이 hiddenAttr true · display flex · 높이 91.5 였고, 클라이언트 이동 뒤 aria-current 링크가 숨은 목록 안에 있었어요.
