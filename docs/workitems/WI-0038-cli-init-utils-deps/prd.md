# WI-0038: `axis init` utils.ts 의존성(clsx · tailwind-merge) 추가 · 안내 PRD

> 작성일: 2026-10-19 | 버전: v1.1 (2026-10-19, E1 ~ E4 반영) | 작성자: Sinclair Seo | WI: WI-0038 | GitHub: #124 | 우선순위: P2 | 상태: Approved (2026-10-19 결정 반영)
> 기준: `origin/main` c131ee9 (`@axis-ds/cli` 1.2.0 배포 완료)
> 관련: WI-0028(#87, #123) AC2(b) 실측(T7-2)에서 발견. WI-0028 은 「선행 결함으로 보류」로 기록한 채 머지했고, 이 WI 완료 뒤 같은 절차로 다시 잽니다

---

## 1. 개요

### 1.1 배경
- `axis init -y` 는 `src/components/ui/utils.ts` 를 쓰는데, 이 파일은 `clsx` · `tailwind-merge` 를 import 합니다. init 은 두 패키지를 `package.json` 에 넣지도, 설치를 안내하지도 않습니다(Issue #124).
- 그래서 새 프로젝트에서 init 직후 빌드하면 `Cannot find module 'clsx'` 타입 오류로 실패합니다. WI-0028 T7-2 에서 create-next-app 15.5.28 프로젝트의 `pnpm build` 가 rc 1 이었고, theme add 없이 init 만 한 대조 프로젝트도 같은 rc 1 이었습니다.
- init 의 마지막 안내 `npx axis-cli add button` 은 우리 패키지가 아닙니다. `axis-cli` 는 2026-01-15 npm 에서 unpublish 된 타인 이름이라 누구나 다시 등록할 수 있습니다(typosquat 위험). 우리 패키지는 `@axis-ds/cli` 입니다.

### 1.2 원인 (실측, c131ee9)
| # | 내용 | 실측 |
|---|---|---|
| C1 | init 액션은 `axis.config.json` 과 `utils.ts` 만 쓰고 `package.json` 을 읽지 않습니다 | `packages/axis-cli/src/index.ts` 41~105행 |
| C2 | c131ee9 빌드를 `pnpm pack` 해 설치한 `axis init -y` 를 `{"name":"x"}` 프로젝트에서 실행 | rc 0, 출력 5줄에 의존성 안내 0줄, `package.json` 불변, 마지막 줄 `npx axis-cli add button` |
| C3 | `axis add <component>` 는 의존성 설치 명령을 안내하고(168~171행), `axis check` 는 `clsx` · `tailwind-merge` 를 권장 의존성으로 봅니다 | `src/index.ts` 170행, `src/template/template-check.ts` 210행 |
| C4 | `npx axis-cli` · `pnpm dlx axis-cli` · `bunx axis-cli` 실행 안내가 CLI 출력(`index.ts` · `sync/index.ts`)과 문서 사이트(`apps/web/src` 컴포넌트 · 에이전틱 문서 페이지, 랜딩 설치 명령, 라이브러리 설치 접두어)에 남아 있습니다. CLI 출력에는 `axis-cli monet ...` · `axis-cli v0 ...` · `axis-cli library collect` 처럼 `npx` 없이 쓴 안내도 있습니다 | `git grep -n 'axis-cli'` |

### 1.3 목표
1. `axis init` 직후 의존성 설치만 하면 빌드가 됩니다. init 은 설치를 실행하지 않습니다.
2. 실행 안내에서 `axis-cli` 이름을 없애고 `@axis-ds/cli` 로 맞춥니다. 이 상태를 테스트로 고정합니다.
3. 그 밖의 init 동작(출력 · `axis.config.json` · `utils.ts` 내용)은 바꾸지 않습니다.

### 1.4 확정 결정 (2026-10-19)
| # | 결정 | 내용 |
|---|---|---|
| D1 | 의존성 추가 · 안내 | init 은 `package.json` 이 있으면 `dependencies` 에 `clsx` · `tailwind-merge` 를 없을 때만 추가합니다. 이미 `dependencies` 나 `devDependencies` 에 있으면 그 버전을 유지합니다. lockfile 로 고른 설치 명령을 안내하고, 설치는 실행하지 않습니다. `package.json` 이 없으면 파일을 만들지 않고 설치 안내만 합니다. theme add(WI-0028, `src/theme/theme-add.ts`)의 `detectInstallCommand` · 포맷 보존 JSON 쓰기(`formatJsonLike`) · 쓰기 안전성(쓰기 직전 재확인 · 실제 경로 확인 · 쓰기 가능 확인)을 재사용합니다. 공유 위치로 옮기는 리팩터는 하지 않습니다(theme add 동작 불변을 증명할 필요가 없도록, 필요한 함수에 `export` 만 붙입니다) |
| D2 | 안내 문구 | 실행 안내의 `npx axis-cli ...` 를 `npx @axis-ds/cli ...` 로 고칩니다. 같은 위험의 `pnpm dlx axis-cli` · `bunx axis-cli` 는 `pnpm dlx @axis-ds/cli` · `bunx @axis-ds/cli` 로, CLI 출력과 사용법 주석의 `npx` 없는 `axis-cli <명령>` 은 `npx @axis-ds/cli <명령>` 으로 고칩니다. 패키지 디렉터리 이름(`packages/axis-cli`), 디렉터리 트리, turbo 입력 경로, 코드 식별자처럼 실행 안내가 아닌 것은 바꾸지 않습니다. 안내 문구를 고정하는 테스트를 넣습니다 |
| D3 | 의존성 범위 | `clsx` `^2.1.1`. `tailwind-merge` 는 프로젝트의 Tailwind major 가 4 이면 `^3.4.0`, 3 이거나 판정하지 못하면 `^2.6.0`(E2 로 보정, 판정 규칙은 1.6). 근거는 1.5 |
| E1 | 남은 실행 안내 정정 (2026-10-19 사용자 결정) | `.claude/agents/docs-writer.md` 와 `docs/axis-ds-implementation-plan.md` 의 `npx axis-cli` 를 `npx @axis-ds/cli` 로 고칩니다. 안내 테스트의 스캔 범위에 `.claude/agents/**` 와 `docs` 최상위 `*.md` 를 더합니다. 결함을 설명하는 WI 문서(`docs/workitems/**`), changeset · CHANGELOG 의 설명 문장, 테스트 fixture 는 스캔하지 않으며, 제외는 경로 목록이 아니라 그 근거를 테스트 주석에 적습니다. 넓힌 스캔이 `docs/axis_ds_mcp_template_plan_v0.3.md` 86행의 `axis-cli template apply` 도 잡아 같은 규칙(D2)으로 고쳤습니다 |
| E2 | `tailwind-merge` 범위를 Tailwind 버전에 맞춤 (2026-10-19 사용자 결정) | D3 의 고정 범위를 1.6 규칙으로 바꿉니다. `package.json` 이 없을 때 안내하는 추가 명령도 같은 규칙입니다 |

**에이전트 해석의 사용자 확정 (E3, 2026-10-19 사용자 확정)**: 구현 중 에이전트가 결정 문구를 해석해 정한 아래 세 가지를 사용자가 그대로 확정했습니다.
1. D2 의 정정 범위를 `npx axis-cli` 만이 아니라 같은 위험의 `pnpm dlx axis-cli` · `bunx axis-cli` 와 `npx` 없는 `axis-cli <명령>` 안내까지 넓힘(D2 표 내용).
2. 문서 사이트 산문 2줄(`apps/web/src/app/(docs)/docs/page.tsx` 20 · 105행의 「axis-cli를 사용하여 컴포넌트를 설치합니다」 · 「axis-cli는 컴포넌트 설치 외에도 ... 명령어를 제공합니다」)을 `@axis-ds/cli` 로 정정. 실행 명령은 아니지만 우리 패키지 이름을 잘못 알려 주는 문장이라 함께 고쳤습니다(안내 테스트 패턴 밖, testplan T9).
3. `package.json` 을 읽거나 쓸 수 없으면 바꾸지 않고 추가 명령만 안내하며 init 의 종료 코드는 0 으로 둠(FR-3).

### 1.5 의존성 범위 근거 (실측, c131ee9)
| 출처 | clsx | tailwind-merge | 비고 |
|---|---|---|---|
| `src/index.ts` 컴포넌트 의존성(button) | 이름만 | 이름만 | 안내 명령 `pnpm add clsx tailwind-merge ...` 에 범위 없음 |
| `src/template/template-check.ts` 권장 의존성 | 이름만 | 이름만 | 존재만 봄 |
| 템플릿 4종(`apps/web/templates/*/files/package.json`, `template.json`) | `^2.1.1` | `^3.4.0` | 사용자 프로젝트에 쓰는 값. 4종 모두 같음 |
| `apps/web/package.json` | `^2.1.1` | `^3.4.0` | 문서 사이트 |
| `packages/axis-ui-react` · `axis-agentic-ui` | `^2.1.0` | `^2.5.0` | 라이브러리 자신의 의존성(Tailwind 3.4 빌드) |
| npm 레지스트리(2026-10-19) | latest 2.1.1 | latest 3.7.0, `tailwind-merge-2` 2.6.1 | |

- init 이 쓰는 값은 사용자 프로젝트의 의존성이므로, 같은 역할인 템플릿 4종의 범위(`^2.1.1` · `^3.4.0`)를 그대로 씁니다.
- `tailwind-merge` 3.x 는 Tailwind 4 를 대상으로 합니다. init 을 쓰는 대표 경로인 create-next-app 15.5.28 은 Tailwind 4(tailwindcss 4.3.3)를 만듭니다(WI-0028 T7-2). Tailwind 3 프로젝트에 3.x 가 맞지 않는 점은 템플릿 4종(tailwindcss `^3.4.0` + tailwind-merge `^3.4.0`)과 같은 상태이며, 이 WI 에서 바꾸지 않습니다(2장).
- 이미 선언된 범위는 바꾸지 않으므로(D1), Tailwind 3 프로젝트가 `tailwind-merge` 2.x 를 이미 쓰고 있으면 그대로 유지됩니다.
- E2(2026-10-19) 로 위 고정 범위는 `tailwind-merge` 에 한해 1.6 규칙으로 바뀌었습니다. 위 표와 문단은 v1.0 의 실측 기록이라 그대로 둡니다.

### 1.6 `tailwind-merge` 범위 판정 규칙 (E2, 2026-10-19)
| 순서 | 판정 근거 | 읽는 방법 |
|---|---|---|
| 1 | 설치본 | `<프로젝트>/node_modules/tailwindcss/package.json` 의 `version`(예: `4.3.3`). 실제로 쓰이는 버전이라 선언보다 앞섭니다. 파일이 없거나 읽을 수 없거나 `version` 이 정확한 버전이 아니면 2 로 갑니다 |
| 2 | 선언 범위 | `package.json` 의 `dependencies`, 없으면 `devDependencies` 의 `tailwindcss`. 하나의 major 로 정해지는 단순 형태만 읽습니다: `4` · `4.1` · `^4` · `^4.1.0` · `~3.4` · `=3.4.17` · `3.4.x` · `v4` · `4.0.0-beta.1` |
| 3 | 판정 불가 | 1 · 2 가 없거나, 선언이 `workspace:*` · `latest` · `*` · `>=3` · `^3 \|\| ^4` · `>=3.4 <4` · `npm:...` · git · 파일 경로처럼 major 가 하나로 정해지지 않는 범위 |

| 판정 결과 | `tailwind-merge` | 근거 |
|---|---|---|
| major 4 | `^3.4.0` | tailwind-merge 3.x 가 Tailwind 4 를 대상으로 합니다. 템플릿 4종의 범위와 같습니다 |
| major 3 · 판정 불가 · 그 밖의 major | `^2.6.0` | tailwind-merge 2.x 가 Tailwind 3 을 대상으로 합니다. 판정 불가일 때의 기본값은 사용자 결정(「3 이거나 없으면 ^2.6.0」)입니다 |

- `^2.6.0` 근거(실측 2026-10-19 `npm view tailwind-merge`): dist-tag `tailwind-merge-2` 가 2.6.1(2026-01-30 발행)이고 2.x 의 마지막 minor 가 2.6(2.6.0 은 2024-12-23 발행)입니다. `latest` 는 3.7.0 입니다. `^2.6.0` 은 2.6.1 로 풀립니다(testplan T25 lockfile).
- `clsx` 는 Tailwind 와 관계없어 `^2.1.1` 그대로입니다.
- 설치본은 프로젝트 디렉터리의 `node_modules` 만 봅니다. 워크스페이스 루트로 끌어올린(hoist) 설치본은 보지 않고 선언 범위로 판정합니다.
- init 은 `tailwind-merge` 를 추가하거나 추가 명령을 안내할 때 고른 근거를 한 줄로 출력합니다(예: `tailwind-merge 범위 기준: 설치된 tailwindcss 4.3.3`). 이미 선언돼 있어 추가하지 않으면 출력하지 않습니다.
- 참고: 템플릿 4종(`apps/web/templates/*/files/package.json`)은 `tailwindcss ^3.4.0` 과 `tailwind-merge ^3.4.0` 을 함께 선언합니다. 이 규칙과 어긋나지만 템플릿은 init 이 쓰는 값이 아니라 이 WI 에서 바꾸지 않습니다.

---

## 2. Non-goals (범위 제외)

- **설치 실행**: init 은 설치 명령을 실행하지 않습니다(D1, WI-0028 U6 과 같은 원칙).
- **`tailwind.config.ts` · `globals.css` 기본값 변경**: init 의 기본 경로가 create-next-app 기본 구조(`src` 없음, Tailwind 4)와 다른 문제는 이 WI 밖입니다.
- ~~**Tailwind 버전별 `tailwind-merge` 범위 선택**: 템플릿과 같은 고정 범위를 씁니다(1.5).~~ E2(2026-10-19 사용자 결정)로 범위 안으로 옮겼습니다(1.6).
- **`apps/web/public/library/**` 의 수집 데이터**: 외부 소스에서 수집해 둔 데이터(`library collect` · `publish` 산출물)로, 원문 코드 문자열 안에 `npx axis-cli add` 가 있습니다. 문서 사이트 소스가 아니라 수집본이라 손으로 고치지 않습니다. 수집본의 정정은 별도 WI 로 넘겼습니다(E4, 2026-10-19 사용자 결정, 메인 세션이 등록).
- **init 재실행 시 `axis.config.json` 덮어쓰기**: init 을 다시 실행하면 기존 `axis.config.json` 을 묻지 않고 기본값으로 덮어씁니다(c131ee9 부터 같은 동작, AC7 로 고정한 기준값). 이를 막거나 확인하는 동작은 별도 WI 로 넘겼습니다(E4, 2026-10-19 사용자 결정, 메인 세션이 등록).
- **과거 WI 문서 · CHANGELOG**: 작성 시점 기록이라 바꾸지 않습니다.
- **cli 의 `type-check` · `lint` 스크립트**: WI-0039(#125) 범위입니다.

---

## 3. 요구사항

### 3.1 기능 요구사항
- FR-1: init 은 `axis.config.json` · `utils.ts` 를 쓴 뒤 `package.json` 을 봅니다.
  - 있고 `clsx` · `tailwind-merge` 중 `dependencies` · `devDependencies` 어디에도 없는 것이 있으면, 없는 것만 `dependencies` 에 D3 범위(`tailwind-merge` 는 1.6 규칙)로 추가합니다. 나머지 키 · 키 순서 · 들여쓰기 · 줄바꿈(CRLF) · 끝 줄바꿈 · UTF-8 BOM 을 유지합니다.
  - 이미 있는 것은 범위를 바꾸지 않습니다. 둘 다 있으면 `package.json` 을 쓰지 않습니다.
  - 추가했거나 이미 있으면 lockfile 로 고른 설치 명령(`pnpm install` · `yarn install` · `npm install`, lockfile 이 없으면 `pnpm install`)을 안내합니다.
- FR-2: `package.json` 이 없으면 파일을 만들지 않고, lockfile 로 고른 패키지 매니저의 추가 명령(예: `pnpm add "clsx@^2.1.1" "tailwind-merge@^2.6.0"`)을 안내합니다. 범위는 1.6 규칙(설치본이 있으면 그것, 없으면 기본값)입니다.
- FR-3: `package.json` 을 쓸 수 없는 경우(JSON 이 아님, 최상위나 `dependencies` 가 객체가 아님, 실제 경로가 프로젝트 밖, 쓰기 권한 없음)에는 `package.json` 을 바꾸지 않고 경고와 FR-2 의 추가 명령을 안내합니다. init 의 나머지 결과와 종료 코드(0)는 그대로입니다.
- FR-4: 쓰기 직전에 `package.json` 이 계획할 때와 같은지 다시 확인합니다. 다르면 쓰지 않고 오류(rc 1)입니다. 쓰기 자체가 실패해도 rc 1 입니다. 쓰는 도중 실패하면 원래 내용으로 되돌리고, 되돌렸는지(실패하면 그 이유)를 오류에 적습니다(2026-10-19 보정).
- FR-5: init 은 어떤 경우에도 설치 명령을 실행하지 않습니다(자식 프로세스 0).
- FR-6: init 의 마지막 안내를 `npx @axis-ds/cli add button` 으로, 그 밖의 실행 안내도 D2 대로 고칩니다.
- FR-7 (E2): `tailwind-merge` 범위를 1.6 규칙으로 고르고, 추가하거나 안내할 때 고른 근거를 한 줄 출력합니다.

### 3.2 비기능 요구사항
- **불변**: init 출력의 기존 줄, `axis.config.json`, `utils.ts` 내용은 FR-1 · FR-2 · FR-3 의 의존성 줄(FR-7 근거 줄 포함)과 FR-6 의 문구 외에 바뀌지 않습니다. c131ee9 빌드의 실제 출력과 파일을 기준값으로 테스트에 고정합니다.
- **멱등**: init 을 두 번 실행하면 두 번째는 `package.json` 을 쓰지 않습니다.
- **theme add 불변**: theme add 테스트가 수정 없이 그대로 통과합니다.
- **실경로**: 스모크는 레지스트리 설치와 실제 create-next-app 으로, env · 의존성 주입 없이 합니다.

---

## 4. 수용 기준 (AC)

- AC1: `package.json` 이 있는 새 프로젝트에서 init 뒤 `dependencies` 에 `clsx ^2.1.1` 과 1.6 규칙의 `tailwind-merge` 범위가 있고, 출력에 설치 명령 안내가 있습니다. 설치는 실행되지 않습니다.
- AC2: 이미 `dependencies` 나 `devDependencies` 에 있으면 범위가 그대로이고, 둘 다 있으면 `package.json` 바이트가 그대로입니다.
- AC3: `package.json` 이 없으면 만들지 않고 추가 명령을 안내합니다.
- AC4: 들여쓰기(탭 · 4칸) · CRLF · BOM · 끝 줄바꿈 없음이 유지됩니다. 두 번 실행해도 결과가 같습니다.
- AC5: lockfile(pnpm · yarn · npm · 없음)별 안내 명령이 맞습니다.
- AC6: init 출력 · CLI 소스 · 문서 사이트 소스에 `npx axis-cli` 같은 `axis-cli` 실행 안내가 0건이고, 이 상태를 테스트가 고정합니다.
- AC7: 기존 출력 줄 · `axis.config.json` · `utils.ts` 가 c131ee9 기준값과 같습니다(테스트).
- AC8: `@axis-ds/cli` 테스트 전체와 theme add 테스트가 통과합니다.
- AC9: create-next-app 15.5.28 새 프로젝트에서 `axis init -y` → `pnpm install` → `pnpm build` rc 0. 같은 절차를 c131ee9 CLI 로 하면 rc 1(음성 대조).
- AC10 (E2): 1.6 규칙의 각 경우(설치본 4 · 3, 선언만 `^4` · `~3.4` · `workspace:*` · 판정 불가 문자열, 없음, `devDependencies` 에만 있음, `package.json` 없음의 안내 명령)를 테스트가 고정합니다. 실경로에서 Tailwind 4 프로젝트(create-next-app 15.5.28)는 `^3.4.0`, Tailwind 3.4 프로젝트는 `^2.6.0` 이 추가되고 둘 다 `pnpm build` rc 0 입니다.
- AC11 (E1): `.claude/agents/**` 와 `docs` 최상위 `*.md` 에도 `axis-cli` 실행 안내가 0건이고, 안내 테스트가 이 범위를 스캔합니다.
