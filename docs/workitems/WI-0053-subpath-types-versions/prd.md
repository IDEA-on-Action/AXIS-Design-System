# WI-0053: 서브패스 타입 해석 실패(moduleResolution node) - typesVersions PRD

> 작성일: 2026-10-23 | 버전: v0.1(초안) | 작성자: Sinclair Seo | WI: WI-0053 | GitHub: #147 | 우선순위: P2 | 상태: Draft (결정 대기)
> 기준: `main` 8a8cd5b (linked 4패키지 1.5.0 · cli 1.5.1 · mcp 1.2.3 배포)
> 관련: WI-0050(#143) 구현 검증(2026-10-20)에서 발견한 기존 결함(1.4.0 에도 같음). WI-0050 testplan 「TypeScript node10」 행

---

## 1. 개요

### 1.1 문제

`@axis-ds/ui-react/avatar` 같은 서브패스의 타입 선언은 `exports` 의 `types` 조건으로만 알려 줍니다. TypeScript 의 `moduleResolution: "node"`(node10)는 `exports` 를 읽지 않으므로, 패키지 루트에 `avatar/` 디렉터리도 `typesVersions` 도 없는 지금 구조에서는 서브패스를 못 찾고 TS2307 을 냅니다.

Next 15.5.28 은 tsconfig 가 없는 프로젝트에서 `next build` 할 때 tsconfig 를 만들어 주는데, 이때 `moduleResolution` 값이 `"node"` 입니다(`next/dist/lib/typescript/writeConfigurationDefaults.js` 의 `value: 'node'`, 실측 생성 파일도 같음). 반면 `create-next-app@15.5.28` 템플릿 9종은 모두 `"bundler"` 라서 새로 만든 앱에서는 재현되지 않습니다. 따라서 영향을 받는 곳은 「tsconfig 없이 시작해 Next 가 tsconfig 를 만든 앱」과 「예전에 `node` 로 만든 앱」입니다.

### 1.2 실측 (2026-10-23, npm 배포본 1.5.0)

환경: Node 20, TypeScript 5.9.3, next 15.5.28, react 19.2.0, `@types/react` 19.2.2. 빈 디렉터리에 4패키지 1.5.0 을 npm 으로 설치하고, `exports` 항목마다 탐침 파일 1개(`import * as m from '<spec>'`)를 두어 `tsc --noEmit` 했습니다. 컴파일 옵션은 Next 가 만드는 값(`skipLibCheck: true` · `strict: false` · `resolveJsonModule: true` 등)에 `module`/`moduleResolution` 만 바꿨습니다. CSS 서브패스 6개(`tokens/css` 4 · `ui-react/tailwind.css` · `agentic-ui/tailwind.css`)는 부수효과 import 라 tsc 가 검사하지 않으므로 뺐습니다.

| 패키지 | 대상 | 수 | node(node10) | node16 CJS(.cts) | node16 ESM(.mts) | bundler |
|---|---|---|---|---|---|---|
| tokens | 루트 | 1 | 0 실패 | 0 | 0 | 0 |
| tokens | TS 서브패스(`tailwind`) | 1 | **1 실패** | 0 | 0 | 0 |
| tokens | JSON 서브패스(`json` · `brands` · `brands/ontology/brand.json`) | 3 | **3 실패** | 0 | 0 | 0 |
| ui-react | 루트 | 1 | 0 실패 | 0 | 0 | 0 |
| ui-react | 서브패스 | 30 | **30 실패** | 0 | 0 | 0 |
| agentic-ui | 루트 | 1 | 0 실패 | 0 | 0 | 0 |
| agentic-ui | 서브패스 | 18 | **18 실패** | 0 | 0 | 0 |
| theme | 루트(서브패스 없음) | 1 | 0 실패 | 0 | 0 | 0 |

- node: tsc rc=2, 오류 52건 전부 TS2307. 루트 4개는 같은 실행에서 해석됨(양성 대조).
- node16 · bundler: rc=0. 「오류 0」이 해석 실패를 놓친 것이 아님을 `--explainFiles` 로 따로 확인했습니다. 탐침 import 가 `.d.ts` 로 해석된 수가 node16 · bundler 는 53/53(TS 진입점) + JSON 3/3, node 는 4/56(루트만)입니다.
- `next build` 재현(음성 대조): 탐침 앱(`app/page.tsx` 에서 `@axis-ds/ui-react/avatar` · `@axis-ds/agentic-ui/agent-avatar` · 루트 `Button` import, tsconfig 없음)이 rc=1, `Type error: Cannot find module '@axis-ds/ui-react/avatar'` 로 실패합니다. Next 가 만든 tsconfig 는 `"moduleResolution": "node"` 입니다.

### 1.3 해결안 시제품 (배포본 package.json 만 고쳐 실측)

| 안 | 내용 | tsc node 실패 | node16 · bundler | `next build`(node) | 비고 |
|---|---|---|---|---|---|
| A. 명시 typesVersions | `exports` 에서 생성. `{"*": {"avatar": ["./dist/avatar/index.d.ts"], ...}}`(키 = exports 키, 와일드카드 없음). tokens 는 `tailwind` + JSON 3 포함 | **0/56** | 0 | **rc=0** | 해석된 `@axis-ds` 파일 집합이 bundler 와 같음(diff rc=0). 루트 영향 없음 |
| B. 와일드카드 typesVersions | `{"*": {"*": ["./dist/*/index.d.ts"]}}` | 서브패스 0, **루트 2 실패** | 0 | (미실행) | node10 은 `types` 필드도 typesVersions 로 다시 매핑해 `dist/index.d.ts` 가 깨짐. 지금 되는 루트를 깨뜨림 |
| B'. 와일드카드 + 루트 보호 | `{"dist/*": ["./dist/*"], "*": ["./dist/*/index.d.ts"]}` | 0 | 0 | (미실행) | exports 에 없는 경로도 node10 에서 타입이 잡힘(exports 와 1:1 아님). tokens 처럼 배치가 다른 패키지는 못 씀 |
| C. 서브패스 stub 디렉터리 | 패키지 루트에 `avatar/package.json`(types · main · module → dist) 49개 | TS 0, **JSON 3 실패** | 0 | **rc=0** | `files` 에 디렉터리 49개 추가, 패키지 루트가 지저분해짐, JSON 서브패스는 못 풂 |

시제품 A 로 고친 뒤 `<Button variant="nope" />` 같은 잘못된 값이 bundler 에서는 TS2322 로 잡히고 node 에서는 잡히지 않았습니다(아래 1.4).

### 1.4 함께 드러난 것: node10 에서 cva 변형 타입이 any 로 떨어짐

`skipLibCheck: false` 로 다시 돌리면 시제품 A 에서도 node 해석에 오류 10건이 남습니다. 1건은 `tokens/dist/tailwind-preset.d.ts` 의 `tailwindcss`(탐침에 미설치, bundler 에서도 같음), 9건은 ui-react d.ts 의 `import ... from 'class-variance-authority/types'` 입니다. cva 0.7.1 은 `./types` 를 `exports` 로만 내보내고 `typesVersions` 가 없어서 node10 에서 못 찾습니다. tsup 의 d.ts 생성이 `buttonVariants` 같은 변수의 추론 타입을 펼치면서 이 서브패스를 참조합니다(ui-react `cva(` 사용 10곳, 서브패스 d.ts 9개 · 그 밖 3개 파일).

결과적으로 node10 + `skipLibCheck: true`(Next 기본)에서는 빌드는 통과하지만 `variant` · `size` 같은 변형 prop 의 타입 검사가 꺼집니다. **루트 import 도 같습니다**(배포본 1.5.0 루트 `Button` 에 `variant="nope"` 가 node 에서 오류 없음). 이번 WI 의 서브패스 해석과는 별개 결함이라 범위를 결정 D6 으로 묻습니다.

### 1.5 왜 지금까지 못 잡았나

`scripts/pack-install-smoke.mjs` 의 타입 검사(2단계)는 `module/moduleResolution: node16` 한 가지로, 그리고 기본 대상인 tokens 에만 돕니다. G2 RSC 하네스는 4패키지 서브패스를 모두 불러 보지만 런타임(ESM import)만 봅니다. node10 · bundler 해석은 어디에서도 재지 않았습니다.

## 2. 결정 대기

| # | 질문 | 권장안 |
|---|---|---|
| D1 | 적용 패키지 범위 | ui-react · agentic-ui · tokens(`tailwind` + JSON 3). theme 은 서브패스가 없어 typesVersions 를 두지 않고 검사만 |
| D2 | 해결 방식 | A. 명시 typesVersions(exports 와 1:1) |
| D3 | 생성 · 유지 방식 | 루트 공용 스크립트가 각 package.json 의 `exports` 에서 `typesVersions` 를 생성해 커밋하고, `--check` 로 드리프트 게이트 |
| D4 | 소비자 쪽 해석 게이트 | pack-install-smoke 의 G2 소비자 디렉터리(4패키지 tarball 설치)에서 전 서브패스 × node · node16 · bundler tsc |
| D5 | JSON 서브패스(tokens 3개) 포함 여부 | 포함 |
| D6 | cva `/types` 로 인한 변형 타입 소실(1.4) | 별도 WI 로 분리 |
| D7 | 릴리스 | 바뀐 3패키지(tokens · ui-react · agentic-ui) changeset patch |

선택지와 근거는 이 WI 의 결정 목록 보고(Master 전달)에 있고, 결정 후 이 표를 「결정」으로 바꿉니다.

## 3. 요구사항 (권장안 기준 초안)

- FR-1 typesVersions: ui-react · agentic-ui · tokens `package.json` 에 `typesVersions: {"*": {...}}` 를 둡니다. 키는 `exports` 키에서 `./` 를 뗀 값, 값은 그 항목의 `types` 타깃(JSON 은 파일 타깃) 1개입니다. `.` 와 CSS 항목은 넣지 않습니다. 와일드카드 키는 쓰지 않습니다(1.3 B: 루트가 깨짐)
- FR-2 생성 · 검사: `scripts/sync-types-versions.mjs`(이름 가안)가 FR-1 규칙으로 생성하고 `--check` 는 드리프트 시 exit 1 입니다. ui-react 는 `build` 의 `sync-exports` 뒤에 이어 실행해 exports 가 바뀌면 함께 바뀌게 합니다. agentic-ui · tokens 는 exports 를 손으로 고치므로 `--check` 가 CI 에서 잡습니다
- FR-3 소비자 해석 게이트: pack-install-smoke G2 소비자 디렉터리에서 `types` 조건이 있는 모든 exports 항목과 JSON 항목을 node · node16 · bundler 로 tsc 합니다. 판정은 rc 와 함께 「탐침 import 가 `.d.ts`/`.json` 으로 해석된 수 = 대상 수」(explainFiles)로 하고, 대상 0 개는 측정 실패(exit 2)입니다
- FR-4 문서: README(또는 설치 안내)에 지원 해석 방식과 node10 한계(D6 결과에 따라)를 적습니다

## 4. 수용 기준 (초안)

- AC1 수정 없는 1.5.0 tarball 로 FR-3 게이트가 node 에서 52건 실패합니다(음성 대조, `--rsc-tarball` 류 옵션)
- AC2 수정본 tarball 로 4패키지 TS 진입점 53 + JSON 3 이 node · node16 · bundler 모두 해석되고 rc 0 입니다
- AC3 tsconfig 없는 Next 15.5.28 탐침 앱이 수정본으로 `next build` rc 0 입니다(1.2 의 실패 재현과 같은 페이지)
- AC4 exports 에 항목을 하나 더하거나 빼면 `--check` 가 rc 1 입니다(변이)
- AC5 기존 게이트(type-check · lint · build · test · pack-smoke · cli-smoke · registry-install-smoke) 통과

## 5. 범위 밖

- CSS 서브패스(tsc 검사 대상 아님)
- cva `/types` 변형 타입 소실(D6 결정에 따름)
- `exports` 구조 자체의 변경
