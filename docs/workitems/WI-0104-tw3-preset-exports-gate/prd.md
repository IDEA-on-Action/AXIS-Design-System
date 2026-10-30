# WI-0104: check 가 Tailwind 3 preset · tokens 줄을 설치본의 exports 로 봄 PRD

> 작성일: 2026-10-30 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0104 | GitHub: #260 | 우선순위: P3 | 상태: 권장안으로 진행, 2026-10-30 사용자 확정(Q130 ~ Q137)
> 기준: `main` e32275e (cli 1.7.8 · mcp 1.4.7 발행됨. 발행 커밋 2445270 뒤 `git log 2445270..HEAD -- packages/` 0줄, 같은 범위 전체 커밋은 2건이라 조회 자체는 동작함. 발행본과 소스가 같음)
> 출처: WI-0101 · WI-0103 병합 검증(2026-10-30, 사용자 결정: 후속 WI 로 등록)
> 표기: **측정**(이번 착수 측정에서 실행해 얻은 값) · **추정**(실행하지 않음) · **미측정**(재야 하지만 아직 재지 않음)

---

## 1. 개요

### 1.1 문제 (측정, 발행본 cli 1.7.8 · mcp 1.4.7, Tailwind CLI 3.4.19 · Node 22.22.0)

Tailwind 3 의 tailwind.config 항목은 WI-0101 이후 preset(`@axis-ds/tokens/tailwind`) 참조를 「이 앱에서 tokens 가 해석되는가」로 보지만, 그 정의가 「설치본 디렉터리가 있음」(WI-0101 Q68)에 그쳐요. 설치본의 `exports` 에 `./tailwind` 가 있는지는 보지 않아요. WI-0103 의 exports 해석기(`resolveCssPackageImport` · `cssPackageLineResolution`)는 Tailwind 4 의 CSS 줄에만 걸려요(Q79).

Tailwind 3.4.19 는 설정을 `require()` 로 읽고 실패하면 jiti 로 다시 읽어요(`tailwindcss/lib/lib/load-config.js`). 어느 쪽이든 Node 해석기가 preset 을 풀고, 처음 잡힌 설치본에 `exports` 가 있으면 subpath 를 `exports` 로만 풀어요. 그래서 `./tailwind` 를 내보내지 않는 설치본은 빌드가 `ERR_PACKAGE_PATH_NOT_EXPORTED` 로 실패하는데 check 는 PASS 예요.

착수 측정(testplan 2.2, 설정 모양 7 × tokens 변형 13 × 레이아웃 2 + 중첩 없음 7 = 189칸, 2회 재현 같음):

| 분류 | 칸 수 | 내용 |
|---|---|---|
| 거짓 PASS(check PASS · 실빌드 rc 1) | **78** | `ERR_PACKAGE_PATH_NOT_EXPORTED` 50(미노출 · 조건 불일치, 단일 앱 · 중첩 설치본), `Cannot find module` 28(exports 없고 파일 없음 14 · 대상 파일 없음 14) |
| 거짓 WARN | 0 | - |
| 맞음 | 111 | 그 가운데 4칸은 rc 0 이지만 preset 이 빠짐(`module-sync` 만 내보낸 설치본 × CommonJS bare, 2.3) |

- CLI = MCP 189/189(심각도 · 문구), check 종료 코드는 189칸 모두 1(원인은 axis.config.json · globals.css 없음 FAIL, 이 WI 와 무관)
- 「중첩 그림자 설치본이 상위 정상 설치본을 가리는 경우」(W-*): 앱 `node_modules` 의 미노출 설치본은 루트 정상 설치본이 있어도 rc 1(14칸), `exports` 없고 `tailwind` 파일도 없는 중첩 디렉터리는 건너뛰어 rc 0(14칸). Tailwind 3 설정 파일은 앱 루트에 있어서 「처음 잡히는 설치본」이 곧 `findInstalledPackage` 가 찾는 앱 기준 설치본이에요(WI-0103 의 「그림자 = 앱 기준과 실경로가 다른 설치본」 구분이 생기지 않아요)
- 발행된 `@axis-ds/tokens` 는 1.1.0 ~ 1.8.2 모든 버전이 `./tailwind` 를 내보내요(testplan 2.5, `npm view`). 미노출 설치본은 손으로 만든 디렉터리 · 낡은 stub · 포크에서만 생겨요(추정)

Issue 의 「같은 계열(미검증)」인 Tailwind 3 globals.css 쪽 중첩 그림자도 쟀어요(testplan 2.4, Next 14.2.33 + Tailwind 3.4.19, 10칸).

| 칸 | 그림자(줄 위치 쪽 `node_modules/@axis-ds/tokens`) | 발행본 check(globals.css) | Next 빌드 |
|---|---|---|---|
| sub-ex · entry-ex | `exports` 에 `./css` 없음 | PASS | rc 1 「Package path ./css is not exported」 |
| sub-ci · sub-creq | `./css` 가 `import` · `require` 조건만 | PASS | rc 1 같은 오류 |
| sub-em | `./css` 를 내보내는데 대상 파일 없음 | PASS | rc 0(상위 설치본으로 풂, 토큰 변수 568) |
| sub-n0 · entry-n0 | `exports` 없음 · 파일 없음 | PASS | rc 0(568) |
| sub-cs · sub-mark | `style` 조건 · 파일 있음 | PASS | rc 0(그림자 파일을 씀, 토큰 변수 0) |
| sub-none(대조) | 없음 | PASS | rc 0(568) |

- 거짓 PASS 4칸(ex · ci · creq · entry-ex). 대상 파일 없음(em)은 Tailwind 4(WI-0103 em, rc 1)와 달리 Next 14 의 css-loader 가 상위 설치본으로 풀었어요
- Tailwind 3 CLI(postcss-import 15.1.0, `resolve` 패키지라 `exports` 를 보지 않음)는 정상 설치본에서도 `@import "@axis-ds/tokens/css"` 를 「Failed to find」로 풀지 못해요(측정). 그래서 CSS 줄의 실빌드 기준은 Next 로 잡았어요

### 1.2 결정

#### 사용자 확인이 필요한 결정 (권장안으로 진행, 2026-10-30 사용자 확정. 선택지와 근거는 6절)

| # | 질문 | 진행한 권장안 | 이 WI 에서 |
|---|---|---|---|
| Q130 | preset 의 exports 판정을 어느 설치본에 걸까요 | 설정 파일 위치에서 처음 잡히는 설치본(앱 선언 · 미선언 · 중첩 모두) | AC1 · AC2 |
| Q131 | 조건부 `exports` 의 조건 이름 | 참조 모양별: `require()` 는 require · node · module-sync · default, ESM `import` 는 import 조건 집합과 require 조건 집합 가운데 하나로 풀리면 됨 | AC3 |
| Q132 | 내보낸 대상 파일이 없는 설치본(tmiss) | 판정하지 않음(종전 PASS) | AC4 |
| Q133 | `exports` 없고 `tailwind` 파일도 없는데 상위에도 설치본이 없는 경우 | 판정하지 않음(종전 PASS) | AC4 |
| Q134 | Tailwind 3 globals.css 의 tokens 줄 그림자를 이번에 볼까요 | 그림자 미노출만 WARN(Next 측정), 대상 파일 없음 · 이 위치에서 안 보임은 종전 | AC6 |
| Q135 | CommonJS bare + 미노출 + 1.7.0 미만이면 어느 문구 | 미노출 문구 먼저 | AC5 |
| Q136 | 새 WARN 문구 2종을 구현 그대로 확정할까요 | 구현 그대로(3절) | AC1 · AC6 |
| Q137 | 새 판정의 심각도와 종료 코드 | WARN, 종료 코드 불변 | AC7 |

#### 선례 · 이어받는 결정

| 출처 | 내용 | 이 WI 에서 |
|---|---|---|
| WI-0101 Q62 | 앱 선언 · 미설치는 해석 게이트로 막지 않음 | 그대로(설치본이 없으면 해석기가 판정하지 않음) |
| WI-0101 Q64 | 1.7.0 버전 판정은 CommonJS bare 만 | 그대로. 미노출 판정은 그 앞(Q135) |
| WI-0101 Q68 | 「해석된다」= 설치본 디렉터리 존재(dist 없는 workspace 링크의 거짓 WARN 방지) | 「… 이고 exports 가 막지 않음」으로 좁힘. 대상 파일은 여전히 보지 않음(Q132) |
| WI-0103 Q70c | 앱 기준 설치본이 stub · 손상이면 판정하지 않음 | Q133 의 근거 |
| WI-0103 Q75 | 해석된 그림자 파일의 내용은 판정하지 않음 | 그대로(sub-cs · sub-mark 는 PASS) |
| WI-0103 Q79 | Tailwind 3 은 종전 | 이 WI 의 측정으로 「그림자 미노출만」 좁혀 바꿈(Q134) |
| WI-0097 D5 · WI-0103 Q77 | 해석 불가 계열은 WARN, 종료 코드 불변 | Q137 |

### 1.3 목표

- Tailwind 3 의 tailwind.config 항목이 preset 을 Node 해석기가 `exports` 때문에 풀지 못하는 레이아웃(50칸)을 PASS 로 내지 않아요
- Tailwind 3 globals.css 의 tokens 줄도 그 줄 위치의 그림자가 subpath 를 내보내지 않는 레이아웃(4칸)을 PASS 로 내지 않아요
- 발행된 tokens 설치본 · dist 없는 workspace 링크 · 테스트 stub 은 종전 판정 그대로예요(거짓 WARN 0)

## 2. 범위

### 2.1 하는 것

1. registry-core `project.ts`: WI-0103 해석기 본체를 조건 · 파일 후보를 인자로 받게 나누고(`resolvePackageSubpath`), Tailwind 3 설정 파일용 `tailwindConfigImportResolution` 을 둬요
2. `presetTokensUnresolvedMessage`(tailwind-core) 가 WI-0101 해석 판정 뒤 exports 미노출을 WARN 으로 내요(모든 모양)
3. `judgeGlobalsCss` 의 Tailwind 3 갈래가 종전 판정 뒤 `packageLineShadowIssue(…, { tailwind3: true })` 로 그림자 미노출만 더 봐요
4. cli · mcp patch changeset(registry-core 변경)

### 2.2 하지 않는 것

- 대상 파일 없음 · `exports` 없고 파일 없음(Q132 · Q133)
- Tailwind 3 globals.css 의 대상 파일 없음 · 「이 위치에서 안 보임」(z5 형) · 프로젝트 밖 전역 CSS(Q134)
- `.ts` 의 tsconfig `paths` · re-export(WI-0101 Q66 그대로)
- Plug'n'Play(설치본을 읽지 않음)
- 해석된 preset · CSS 파일의 내용(`module-sync` 만 내보낸 설치본에서 CommonJS bare 가 preset 을 못 받는 4칸 포함)

## 3. 수용 기준 (AC)

| AC | 내용 | 근거(측정) | 결정 |
|---|---|---|---|
| AC1 | 단일 앱의 미노출 설치본(noexp · noexpf)은 7형태 모두 tailwind.config WARN 「<파일>에 AXIS preset 참조가 있지만 먼저 잡히는 node_modules/@axis-ds/tokens(<버전>)가 ./tailwind 를 내보내지 않아 해석되지 않습니다 → 그 node_modules 의 @axis-ds/tokens 를 지우거나 다시 설치하세요」 | 14칸 발행본 PASS · rc 1 | Q130 · Q136 |
| AC2 | Tailwind 3 + 중첩 설치본: 앱 `node_modules` 의 미노출 설치본이 루트 정상 설치본을 가리면 WARN(14칸), `exports` 없고 파일 없는 중첩 디렉터리는 PASS 그대로(14칸) | W-noexp* rc 1 · W-noexports* rc 0 | Q130 |
| AC3 | 조건부 `./tailwind`: import 만이면 require 4형태(CommonJS 3 · `.mjs` 의 require)만 WARN 이고 ESM 3형태 PASS, style 만이면 7형태 WARN, require · node · default · module-sync 만이면 PASS | 실빌드 열 그대로 | Q131 |
| AC4 | 회귀 가드: 정상 설치본 · 맨 경로 `tailwind.js` 가 있는 exports 없는 설치본은 PASS. 대상 파일 없음(tmiss) · exports 없고 파일 없음(단일 앱)은 종전 PASS. 앱 선언 · 미설치, Plug'n'Play 도 종전 | 189칸 가운데 판정이 바뀌지 않은 139칸의 문구가 발행본과 바이트 같음(testplan 3.1) | Q132 · Q133 |
| AC5 | CommonJS bare + 미노출 + 1.7.0 미만이면 버전 문구 대신 AC1 문구 | - | Q135 |
| AC6 | Tailwind 3 globals.css: 앱 안 진입 · 하위 파일의 tokens 줄 위치에서 먼저 잡히는 그림자가 subpath 를 내보내지 않으면(ex · ci · creq) WARN, 대상 파일 없음 · exports 없음 · style 조건 · 이 위치에서 안 보임은 PASS | Next 10칸 | Q134 · Q136 |
| AC7 | check 종료 코드 불변 · CLI = MCP | 189칸 · 기준선 rc 0 fixture 6개 · Next 10칸 | Q137 |
| AC8 | 새 테스트는 HEAD 소스에서 빨강, 수정본에서 초록, 변이(testplan 5절) 모두 빨강, cli · mcp vitest · type-check · lint 통과 | - | - |
| AC9 | changeset `@axis-ds/cli` patch + `@axis-ds/mcp` patch, `pnpm check-changeset-mcp-tokens` rc 0. `packages/axis-cli/README.md` · 코드 주석의 범위 서술(「Tailwind 3 은 종전」, Q68 정의) 갱신 | CLAUDE.md registry-core 규칙 | - |

## 4. 종료 코드 변화

새 판정은 모두 WARN 이라 `axis check` 종료 코드는 바뀌지 않아요(측정: 다른 항목이 모두 통과하는 fixture 6개에서 발행본 · 수정본 모두 rc 0, testplan 3.3). 바뀌는 것은 「N pass / M warn」 집계와 해당 항목의 문구예요.

## 5. 위험 · 잔여 오차

| 항목 | 상태 | 영향 |
|---|---|---|
| Node 20 등 `require(esm)` · 타입 제거가 기본이 아닌 런타임 | 미측정 | ESM 설정이 jiti 로만 읽혀 `import` 조건만 내보낸 설치본은 실빌드 rc 1 일 수 있어요(추정). 이 WI 는 Node 22.22 기준이라 그 경우 PASS 로 남아요(Q131) |
| Vite 등 Next 밖 Tailwind 3 CSS 파이프라인 | 미측정 | Q134 는 Next 14 css-loader 측정이에요. 조건 이름이 다르면 판정이 어긋날 수 있어요 |
| 대상 파일 없음 · exports 없는 stub(28칸) | 알려진 한계 | 실빌드 rc 1 이지만 PASS(Q132 · Q133) |
| `module-sync` 만 내보낸 설치본 × CommonJS bare(4칸) | 알려진 한계 | rc 0 이지만 preset 이 빠짐(규칙 5 → 2). 해석은 되므로 이 WI 범위 밖 |
| 새 문구 확정 | 2026-10-30 사용자 확정 | Q136 |

## 6. 결정 항목 상세 (Q130 ~ Q137, 권장안으로 진행, 2026-10-30 사용자 확정)

| # | 질문 | 선택지 | 권장안 | 근거 |
|---|---|---|---|---|
| Q130 | preset 의 exports 판정을 어느 설치본에 걸까요 | ① 설정 파일 위치에서 처음 잡히는 설치본(앱 선언이어도) ② 미선언 · 루트 선언일 때만(앱 선언은 WI-0101 Q62 처럼 건너뜀) ③ 판정하지 않음(Issue 를 잔여로) | ① | 미노출 설치본은 선언과 상관없이 실빌드가 rc 1 이에요(A · W 28칸). Q62 의 이유(dependencies WARN 이 이미 알림)는 미설치에만 맞고, 설치본이 있으면 dependencies 는 조용해요. ②는 가장 흔한 앱 선언 레이아웃을 놓쳐요(측정 fixture 는 모두 앱 선언) |
| Q131 | 조건부 `exports` 에서 어떤 조건을 맞는 것으로 볼까요 | ① 참조 모양별(아래) ② require 조건만 ③ 조건부 값은 판정하지 않음 | ① | 측정: `require()` 참조는 require · node · default · module-sync 에서 rc 0, import 만 · style 만에서 rc 1. ESM 참조는 import 만 · require 만 모두 rc 0(Node 22 의 `require(esm)` · 타입 제거로 먼저 import 조건으로 읽고, 실패하면 jiti 가 require 조건으로 다시 읽음). ②는 import 만 내보낸 설치본의 ESM 3형태를 거짓 WARN 으로 만들어요 |
| Q132 | 내보낸 대상 파일이 없는 설치본 | ① 판정하지 않음 ② WARN | ① | 실빌드는 rc 1 이지만, dist 를 아직 빌드하지 않은 workspace 링크(이 저장소 `apps/web` 처럼)가 같은 모양이라 거짓 WARN 이 돼요. WI-0101 Q68 · WI-0103 Q72 와 같은 이유예요 |
| Q133 | `exports` 없고 `tailwind` 파일도 없는데 상위에도 설치본이 없는 경우 | ① 판정하지 않음 ② WARN(「설치본이 손상됐습니다」) | ① | 테스트 · 측정 fixture 의 설치본 stub(`{ name, version }` 만)이 이 모양이에요. WI-0103 Q70c 와 같은 처리예요. 발행된 tokens 는 모든 버전에 exports 가 있어 실제로는 손으로 만든 디렉터리에서만 생겨요 |
| Q134 | Tailwind 3 globals.css 의 tokens 줄 그림자를 이번에 볼까요 | ① 그림자 미노출만(Next 측정) ② WI-0103 모델 전부(대상 파일 없음 · 안 보임 포함) ③ 종전(Q79 유지, 잔여로) | ① | 측정: 미노출 · 조건 불일치 4칸은 Next rc 1 · check PASS. 대상 파일 없음은 Next 가 상위로 풀어 rc 0 이라 ②는 거짓 WARN 이에요. 「이 위치에서 안 보임」은 재지 않았어요 |
| Q135 | CommonJS bare + 미노출 + 1.7.0 미만이면 어느 문구 | ① 미노출 문구만 ② 버전 문구 유지 ③ 둘을 ` / ` 로 이음 | ① | 그 레이아웃은 버전과 상관없이 빌드가 rc 1 이라 버전 안내를 따라도 고쳐지지 않아요. WI-0101 Q65 와 같은 순서예요 |
| Q136 | 새 WARN 문구 2종(3절 표 AC1 · AC6 문구)을 구현 그대로 확정할까요 | ① 구현 그대로 ② 고침 | ① | preset 문구는 WI-0101 머리(「<파일>에 AXIS preset 참조가 있지만」)와 WI-0103 그림자 문구 꼬리(「먼저 잡히는 <경로>(<버전>)가 <subpath> 를 내보내지 않아 해석되지 않습니다 → 그 … 를 지우거나 다시 설치하세요」)를 이었어요. CSS 문구는 WI-0103 문구 그대로이고 할 일만 늘 「다시 설치하세요」(1.4.0 은 Tailwind 4 진입점 기준이라 Tailwind 3 에는 맞지 않음). 확정은 사용자 몫이에요(WI-0097 Q43 · Q48 선례) |
| Q137 | 새 판정의 심각도와 check 종료 코드 | ① WARN(종료 코드 불변) ② FAIL | ① | WI-0097 해석 불가 계열 · WI-0103 그림자가 모두 WARN 이에요. ②는 CI 에서 check 를 쓰는 프로젝트가 업데이트만으로 실패할 수 있어요 |

## 7. 측정 출처

- scratchpad `S=/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/4ae00ed9-0062-46ea-b36b-1f1bfaf43fe2/scratchpad/w104`(세션 임시 경로)
- preset: `$S/scripts/mk.mjs` · `run.mjs` · `table.mjs`, 결과 `$S/out-pub.tsv` · `out-pub2.tsv`(재현) · `out-new.tsv`(수정본)
- CSS: `$S/scripts/mk-next.mjs` · `run-next.mjs`, 결과 `$S/out-next-pub.tsv` · `out-next-new.tsv` · `out-next3-new.tsv`(MCP 대조)
- 종료 코드: `$S/scripts/mk-rc.mjs`, 결과 `$S/out-rc-pub.tsv` · `out-rc-new.tsv`
- 버전별 exports: `$S/scripts/exports-hist.mjs`

## 결정 확정 (2026-10-30)

Q130 ~ Q137 는 2026-10-30 사용자가 모두 권장안으로 확정했어요.
