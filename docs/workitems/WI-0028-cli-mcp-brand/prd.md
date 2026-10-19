# WI-0028: CLI · MCP 브랜드 명령 PRD

> 작성일: 2026-10-15 | 버전: v0.4(2026-10-16, 디자인 기준 v0.24 교체) | 작성자: Sinclair Seo | WI: WI-0028 | GitHub: #87 | 상태: Draft
> v0.4 변경 요지(v0.3(2026-10-15) 이후): 온톨로지 디자인 기준이 프로토타입 v0.22에서 v0.24(디자인 시스템 v1)로 바뀌었습니다. 이 WI는 색 · 둥글기 같은 토큰 값을 직접 정하지 않으므로 요구사항 · 수용 기준은 바뀌지 않았고, FR-3 보정 내역의 근거 문서가 WI-0025 부록 B라는 점만 명시했습니다. 보정 전 값의 데이터 출처는 Q6으로 남겼습니다.
> 선행: WI-0025 FR-4 · FR-5(브랜드 토큰 소스, `dist/css/brands/*`, `brand.json`)와 FR-6(`ThemeProvider` brand 옵션). 모두 WI-0025 M2(1.3.0)에서 나오므로 그 배포 이후 착수합니다.
> 기준 버전: `@axis-ds/cli` · `@axis-ds/mcp` 1.1.3, `@axis-ds/tokens` · `@axis-ds/theme` 1.2.0(2026-10-15 실측)

---

## 1. 개요

### 1.1 배경
- WI-0025로 `@axis-ds/tokens`에 브랜드별 CSS가 생기지만, 소비 프로젝트에 적용하려면 import 문과 `ThemeProvider defaultBrand`를 손으로 넣어야 합니다. `defaultBrand`는 현재 `ThemeProvider`에 없는 prop이며(현재 props는 `children` · `defaultTheme` · `storageKey`), WI-0025 FR-6이 추가합니다.
- AXIS CLI의 최상위 명령은 `init` · `add` · `list` · `monet` · `v0` · `library` · `sync` · `template` · `check` 9개입니다(`template` 하위: `list` · `info` · `apply` · `init` · `diff`).
- MCP에는 도구 16개가 있고 모두 `axis.` 접두를 씁니다. 컴포넌트(`axis.search_components` · `axis.get_component` · `axis.list_components` · `axis.install_component`), 토큰(`axis.list_tokens` · `axis.get_token`), 프롬프트(`axis.prompt.detect` · `axis.prompt.analyze` · `axis.prompt.refine` · `axis.prompt.validate` · `axis.prompt.save`), 템플릿(`axis.list_templates` · `axis.get_template` · `axis.apply_template` · `axis.diff_template`), 프로젝트 점검(`axis.check_project`)입니다. 모두 `packages/axis-mcp/src/index.ts`에서 등록합니다.
- CLI와 MCP 어디에도 브랜드를 다루는 명령은 없습니다.
- Claude Code 같은 에이전트가 MCP로 「온톨로지 룩으로 만들어 줘」를 처리하려면 브랜드 목록과 적용 방법을 조회할 수 있어야 합니다.

### 1.2 목표
- CLI와 MCP에서 브랜드를 조회하고 프로젝트에 적용할 수 있게 합니다.

### 1.3 범위
- 포함: `axis theme list`, `axis theme add <brand>`, `axis theme info <brand>`, `axis.config.json`의 `brand` 필드(두 생성 경로와 검사기 포함, FR-2 · FR-5), MCP 도구 `axis.list_brands` · `axis.get_brand`, `@axis-ds/mcp` 테스트 환경 구성(FR-6), CLI · MCP 버전 표기 정정(2.2)
- 제외: 브랜드를 새로 만드는 생성기(`axis theme create`), 원격 브랜드 레지스트리, `brand.json` 작성과 배포(WI-0025 FR-4 · FR-5 소관)

---

## 2. 요구사항

### 2.1 기능 요구사항
- FR-1: `axis theme list`는 대상 프로젝트에 설치된 `@axis-ds/tokens`의 브랜드 메타데이터 `brand.json`(name · description · themes · a11y 상태)을 읽어 브랜드 이름 · 설명 · 지원 테마(light · dark)를 출력합니다. `brand.json`은 WI-0025 FR-4 · FR-5가 `packages/axis-tokens/src/brands/<brand>/brand.json`으로 만들고 dist에 복사해 npm 배포본(1.3.0)에 넣습니다(Gate 2 D6). `@axis-ds/tokens`는 `dist`만 배포하므로 WI-0028은 dist 안의 사본만 읽습니다.
- FR-2: `axis theme add <brand>`는 다음을 수행합니다. 이미 있으면 중복 추가하지 않습니다.
  - CSS 대상 탐색: `axis.config.json`의 `globalCss` 경로를 최우선으로 쓰고, 없으면 `app/globals.css` → `src/app/globals.css` → 프로젝트 루트 `globals.css` 순으로 찾습니다. 찾은 파일에 `@axis-ds/tokens/css/brands/<brand>` import를 추가합니다.
  - 의존성: `package.json`에 `@axis-ds/tokens`가 없으면 dependencies에 추가하고 설치 명령(`pnpm install` 등)을 안내합니다. 설치 자체는 실행하지 않습니다.
  - 설정: `axis.config.json`에 `"brand": "<brand>"`를 기록합니다. `axis.config.json`은 이 저장소에 있는 파일이 아니라 CLI가 소비 프로젝트에 생성하는 파일이고 공식 스키마(스키마 파일 · TS 타입)가 없습니다. 생성 경로가 둘이고 필드가 서로 다릅니다(`axis init`: `$schema` · `componentsDir` · `tailwindConfig` · `globalCss` · `registry`, `axis template init`: `$schema` · `template` · `componentsDir` · `tailwindConfig` · `globalCss`). 이 WI에서 `brand`를 선택 필드로 정의하고 두 경로가 같은 필드 정의를 따르게 합니다. 파일이 없으면 `brand`만 담아 새로 만들지 않고 `axis init` 실행을 안내합니다.
  - Provider: `ThemeProvider`에 `defaultBrand`를 넣는 방법을 안내합니다(WI-0025 FR-6 완료 전제). 브랜드 CSS는 `[data-brand="<brand>"]` 선택자로 적용되므로 `ThemeProvider`(또는 `<html data-brand>`)가 없으면 import만으로는 화면이 바뀌지 않는다는 점도 함께 출력합니다.
- FR-3: `axis theme info <brand>`는 주요 토큰 값과 원본 대비 보정 내역(예: ontology의 AA 보정)을 출력합니다. 보정 내역의 근거 문서는 WI-0025 부록 B(2026-10-16 대리 승인, 디자인 오너 사후 확인 대기)이며, 이 문서에 값을 옮겨 적지 않습니다. 보정 전 값을 어디서 읽을지는 Q6에서 정합니다.
- FR-4: MCP `axis.list_brands`는 FR-1과 같은 목록을, `axis.get_brand`는 import 경로 · Provider 설정 예시(`defaultBrand`, WI-0025 FR-6 전제) · 주요 토큰을 돌려줍니다.
  - 데이터 출처: 기존 MCP 도구 가운데 컴포넌트 · 토큰 도구는 패키지에 번들한 정적 JSON(`src/registry/data/components.json` · `tokens.json`, 빌드 때 `dist/registry/data`로 복사)을 읽고, 템플릿 도구 4개는 원격 레지스트리를 조회하며(`src/tools/template.ts`), `axis.check_project`는 대상 디렉터리의 파일을 읽습니다. `@axis-ds/mcp`는 `@axis-ds/tokens`에 의존하지 않습니다. 브랜드 도구는 정적 번들을 새로 만들지 않고, CLI FR-1과 같은 방식으로 대상 프로젝트(`axis.check_project`처럼 디렉터리 인자를 받음)에 설치된 `@axis-ds/tokens`의 `brand.json`을 읽습니다. 설치돼 있지 않으면 빈 목록 대신 설치 안내를 돌려줍니다. 이렇게 해야 AC3의 CLI · MCP 동일성이 한 출처에서 보장됩니다.
- FR-5: `axis check`가 `axis.config.json`의 `brand`와 실제 import가 맞는지 검사합니다. 현재 검사기(CLI `template-check.ts`, MCP `axis.check_project`의 `tools/template.ts`)는 `axis.config.json`의 존재 여부만 보므로, 두 검사기 모두 config 내용(`brand`)을 읽고 FR-2와 같은 탐색 순서로 찾은 CSS 파일의 import와 대조하도록 확장합니다. `brand`가 없는 기존 프로젝트에서는 지금과 같은 결과를 냅니다.
- FR-6: `@axis-ds/mcp`에는 테스트 환경이 없습니다(테스트 파일 · `test` 스크립트 · vitest 의존성과 설정 없음). AC3을 위해 `@axis-ds/cli`의 구성(`vitest` devDependency, `"test": "vitest run"`, `vitest.config.ts`)을 본떠 테스트 환경을 구성합니다.

### 2.2 비기능 요구사항
- 릴리스: `@axis-ds/cli` · `@axis-ds/mcp` 1.1.3 → 1.2.0(minor). 두 패키지는 changeset linked 그룹(tokens · ui-react · agentic-ui · theme)에 속하지 않아 따로 오르며, linked 패키지의 1.2.0과 번호만 같고 서로 묶이지 않습니다(Q3).
- `@axis-ds/tokens`는 이 WI에서 올리지 않습니다. `brand.json`은 WI-0025 1.3.0 배포본에 들어갑니다(Gate 2 D6).
- 버전 표기 정정: CLI `packages/axis-cli/src/index.ts`의 `.version("0.1.0")`과 MCP `packages/axis-mcp/src/index.ts`의 서버 `version: "0.1.0"`이 `package.json`(1.1.3)과 어긋나 있습니다. 이번 릴리스에서 둘 다 `package.json` 값을 읽도록 바꿉니다.
- 기존 명령의 출력 형식을 바꾸지 않습니다.

---

## 3. 수용 기준 (Acceptance Criteria)

- AC1: `axis theme list`가 `ontology`를 출력합니다.
- AC2: 다음 두 프로젝트에서 확인합니다.
  - (a) `axis template init theme-only`로 만든 프로젝트(루트 평면 구조, `axis.config.json`의 `globalCss`가 `./globals.css`, `@axis-ds/tokens` 의존성 없음)에 `axis theme add ontology`를 두 번 실행해도 루트 `globals.css`에 import가 한 줄만 남고, `package.json`에 `@axis-ds/tokens`가 한 번만 추가되며, `axis.config.json`에 brand가 기록됩니다.
  - (b) App Router 구조(`app/globals.css`, `app/layout.tsx`)의 Next.js 프로젝트에 `axis theme add ontology`를 적용하고 `pnpm install` 후 `pnpm build`가 통과합니다. theme-only는 `ThemeProvider`가 없고 루트 평면 구조라 빌드 기준선이 확인되지 않았으므로 빌드 검증 대상으로 쓰지 않습니다(Q4).
- AC3: MCP `axis.list_brands` · `axis.get_brand` 응답이 CLI 출력과 같은 내용을 담습니다(FR-6의 vitest 단위 테스트).
- AC4: brand와 import가 어긋난 프로젝트에서 `axis check`가 경고를 냅니다.

---

## 4. Assumptions

- A1: 소비 프로젝트의 CSS 진입점은 `axis.config.json`의 `globalCss`를 우선 따르고, 없으면 Next.js App Router 구조(`app/globals.css` 또는 `src/app/globals.css`), 그다음 루트 `globals.css`를 가정합니다. 모두 찾지 못하면 수동 적용 안내를 출력합니다.

## 5. Risks / Open questions

- Q1: `ThemeProvider` 코드까지 자동 수정할지, 안내만 할지 정해야 합니다(코드 변형 범위). `defaultBrand`는 WI-0025 FR-6 완료 전제입니다.
- Q2: `brand` 필드를 정의할 공식 `axis.config.json` 스키마를 이 WI에서 만들지 정해야 합니다. 현재 `$schema` URL(`https://axis.minu.best/schema.json`)에 해당하는 파일이 저장소에 없고, `monet`은 정의되지 않은 `monetDir` 키를 읽습니다.
- Q3: cli · mcp 1.2.0이 linked 패키지 1.2.0과 번호가 겹쳐, 같은 1.2.0이라도 서로 다른 시점 · 내용이라는 점이 사용자에게 혼동을 줄 수 있습니다. 그대로 1.2.0으로 낼지, 버전 정책을 따로 정할지 결정이 필요합니다.
- Q4: theme-only 템플릿은 `axis template init` 시 `globals.css` · `layout.tsx` · `page.tsx`가 `app/` 없이 루트에 놓입니다. 이 구조의 `pnpm build` 기준선(미실행)과, 템플릿 구조를 App Router로 고칠지는 이 WI 밖에서 정해야 합니다.
- Q5: MCP 브랜드 도구가 대상 프로젝트에 `@axis-ds/tokens`가 설치되지 않았을 때 번들 스냅샷으로 대신 응답할지 정해야 합니다(현재 안: 설치 안내만 반환).
- Q6: FR-3의 「원본 대비 보정 내역」에 필요한 보정 전 값의 데이터 출처를 정해야 합니다. WI-0025 D6 · FR-4의 `brand.json`은 name · description · themes · a11y 상태만 담고, 배포 토큰에는 보정 후 값만 있어 지금 출처만으로는 원본 대비 차이를 낼 수 없습니다. `brand.json`에 보정 내역 필드를 두는 안은 WI-0025 D6 변경이 필요합니다.
