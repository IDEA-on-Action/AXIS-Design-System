# WI-0045: `axis add` 레지스트리 기반 설치 PRD

> 작성일: 2026-10-21 | 버전: v1.4 (2026-10-22 D17 ~ D20 반영, v1.3 2026-10-22 D13 ~ D16, v1.2 2026-10-22 D8 ~ D12, v1.1 2026-10-21 D5 · D6 · D7) | 작성자: Sinclair Seo | WI: WI-0045 | GitHub: #136 | 우선순위: P1 | 상태: Approved (2026-10-21 결정 반영)
> 기준: `origin/main` 21c4639 (linked 4패키지 1.5.0, `@axis-ds/cli` 1.4.0 · `@axis-ds/mcp` 1.2.2 배포)
> 관련: WI-0047(#138, 레지스트리 의존성 누락)을 흡수. MCP install 은 WI-0055(#150)로 분리. 실측 워크플로 `wf_f2815a13-bc9`(측정 4 · 반박 검증 12 · 설계 1)

---

## 1. 개요

### 1.1 문제 (실측, 배포본 1.4.0 · 2026-10-21)

| # | 문제 | 근거 |
|---|---|---|
| P1 | `axis add` 가 레지스트리를 조회하지 않고 `getComponentInfo`(packages/axis-cli/src/index.ts)에 하드코딩된 button 하나만 설치. 나머지는 rc 1 | CLI 최초 커밋 ea764b4(2026-01-23)부터 그대로. add 24회 동안 네트워크 호출 0건(양성 대조: `template list` 는 기록됨) |
| P2 | 하드코딩 button 은 shadcn 원형(`bg-primary`)이라 AXIS button 이 아님 | 계산 배경 rgb(17,24,39) 대 레지스트리 · npm Button rgb(59,130,246) |
| P3 | `--agentic` 이 무시됨. 이미 붙였는데도 「--agentic 옵션을 추가하세요」 안내 | `add button --agentic` 결과가 플래그 없을 때와 같음 |
| P4 | `list` 는 20개, add 는 1개. 이름 체계도 레지스트리(`agentic-run-progress`)와 다름 | 레지스트리에만 있는 agentic 8개는 list 에도 없음 |
| P5 | 문서 예시 `add button input card` 가 rc 0 으로 button 만 설치 | docs/guides/quick-start.md |
| P6 | 레지스트리를 그대로 설치해도 28개 모두 빌드 실패(배치 3종 84/84) | ui 의 `../utils` 위치 불일치, agentic 의 `@axis-ds/ui-react` 미선언 · `../constants/a11y-labels` 미공급(11개), button `@radix-ui/react-slot` · toast `class-variance-authority` 미선언, agentic 7개 `"use client"` 없음, card · separator 빈 interface 가 create-next-app 기본 ESLint 에 걸림, registryDependencies 가 실제 import 와 불일치(`@axis/*` 형식 · bare `button`) |
| P7 | 기본 호스트 `axis.minu.best` 가 Cloudflare 403(KT 망과 다른 출구 모두). 원본 `axis-design-system.pages.dev/r/` 는 200 이고 저장소 산출물과 30/30 바이트 일치. 기본값을 두면 원격 우선의 이점이 사라짐(레지스트리를 고쳐도 사용자는 CLI 새 버전이 나와야 받음) → D8 | |
| P8 | 기록 네 곳이 「add 가 fetch 한다」고 잘못 적음 | 함수 주석, add 오류 문구, WI-0024 PRD D1, cli CHANGELOG 1.1.3 |
| P9 | 쓰기 경로 이탈 검사 없음, `-y` 가 묻지 않고 덮어씀 | 사용자 수정이 사라짐(실측) |

- 배포되는 레지스트리는 CI 가 다시 만드는 `apps/web/public/r` 하나입니다. 루트 `public/r` 와 `packages/{axis-ui-react,axis-agentic-ui}/registry/r` 는 배포 · npm 어디에도 쓰이지 않는 중복 산출물입니다.

### 1.2 결정 (2026-10-21 · 2026-10-22 사용자)

| # | 결정 |
|---|---|
| D1 | 조회: 원격 1차(`AXIS_REGISTRY_URL` → `axis.config.json` 의 `registry` → 기본값) 실패 시 **CLI 동봉본**으로 폴백합니다. pages.dev · jsDelivr 같은 2차 원격은 두지 않습니다 |
| D2 | 레지스트리 정규화는 **build-registry 에서** 합니다. utils · a11y-labels 를 `registry:lib` 항목으로 추가하고, 상대 import 를 shadcn 표준 형태로 내보내며, agentic 의 `@axis-ds/ui-react` 의존(cn)을 utils 로 바꿉니다. CLI 는 설치 위치에 맞게 import 를 재작성합니다 |
| D3 | `-y` 는 내용이 다른 기존 파일을 **건너뛰고**, 덮어쓰기는 `--overwrite` 로만 합니다. `@axis-ds/cli` minor |
| D4 | 범위: MCP install 은 WI-0055 로 분리, WI-0047 은 흡수(의존성 선언을 import 스캔으로 생성), 미배포 사본(루트 `public/r` · `packages/*/registry/r`)은 삭제. template apply 경로 검사는 범위 밖 |
| D5 | AC5 참조 형태(2026-10-21 사용자): build-registry 가 `registryDependencies` 를 레지스트리 절대 URL `<base>/<이름>.json` 으로 내보냅니다. `<base>` 는 한 곳(`scripts/registry-integrity.mjs`)에서 정하고 `AXIS_REGISTRY_PUBLIC_URL` 로 바꿀 수 있으며 기본값은 `https://axis-design-system.pages.dev/r` 입니다(200 응답, `axis.minu.best` 는 403). axis CLI 는 URL 의 basename(`.json` 제거)을 이름으로 풀어 같은 레지스트리(지금 조회 중인 원격 또는 동봉본) 안에서 찾고, 접두 없는 이름도 받습니다(하위 호환). 그 밖의 형태(`@ns`, 상대 경로, 다른 확장자, slug 위반)는 검증 실패입니다. CLI `DEFAULT_REGISTRY_URL` 은 바꾸지 않습니다(D8 로 대체: 기본값을 pages.dev 로 바꿈. 호스트를 보지 않던 해석은 D11 로 좁힘) |
| D6 | 빈 interface(2026-10-21 사용자): 패키지 소스는 `interface` 를 유지하고(WI-0034 D5, 소비자 선언 병합), 레지스트리 사본만 `type` 으로 바꾸는 현행을 유지합니다. 바뀐 선언 바로 위 주석의 「인터페이스」도 사본에서 「타입」으로 맞춥니다 |
| D7 | init 기록(2026-10-21 사용자): `axis init` 은 `AXIS_REGISTRY_URL` 값을 `axis.config.json` 에 기록하지 않습니다. config 에는 기본값(또는 이미 있던 config 의 `registry`)만 쓰고, 환경변수는 실행할 때만 우선합니다 |
| D8 | 기본 레지스트리(2026-10-22 사용자): CLI `DEFAULT_REGISTRY_URL` 과 init 이 기록하는 기본값을 `https://axis-design-system.pages.dev/r` 로 바꿉니다. `axis.minu.best` 는 Cloudflare 403 이라 기본값으로 두면 사용자는 대부분 CLI 포함본으로 설치하게 됩니다. 이제 레지스트리 항목에 박힌 URL 호스트와 기본 원격이 같습니다. 저장소의 다른 `axis.minu.best/r` 참조는 cli 와 이 WI 문서에서만 바꾸고, mcp 는 범위 밖이라 목록만 남깁니다 |
| D9 | AC5 shadcn 직접 설치(2026-10-22 사용자): 안내는 「`shadcn init` 은 radix 프리셋(`-b radix`), `shadcn add` 는 `--overwrite`(init 이 만든 utils.ts 를 AXIS utils 로 바꾸기 위해)」입니다. base-ui 기본 프리셋은 select 의 `asChild` 변환으로 빌드가 실패한다는 사실을 알려진 한계로 둡니다. AC5 스모크는 components.json 을 직접 쓰지 않고 실제 shadcn@4.21.4 init(radix, 비대화, stdin 닫음)을 거친 뒤 `add --overwrite` 로 설치합니다 |
| D10 | 테스트 네트워크(2026-10-22 사용자): `packages/axis-cli/src/library/index.test.ts` 의 collectAll 이 실제 원격에 접속하지 않도록 fetch 를 mock 으로 바꿉니다(테스트 의도 유지). 네트워크가 막힌 상태(잘못된 프록시)에서도 통과해야 합니다 |
| D11 | 의존 URL 해석 범위(2026-10-22 사용자): axis CLI 는 지금 조회 중인 레지스트리 base 또는 공개 기본 base(`https://axis-design-system.pages.dev/r`, `AXIS_REGISTRY_PUBLIC_URL` 과 같은 의미)로 시작하는 `<base>/<이름>.json` 만 받습니다. 다른 호스트 · 경로, 공백 · userinfo 가 든 URL 은 검증 실패입니다(G1 과 같은 문자열 접두 기준). 동봉본을 해석할 때는 공개 기본 base 를 받습니다. 「`AXIS_REGISTRY_PUBLIC_URL` 과 같은 의미」는 공개 기본 base 의 값이 build-registry · G1 의 기본값과 같다는 뜻이고, CLI 는 이 환경변수를 읽지 않습니다(D16 확정). 다른 공개 URL 로 빌드한 레지스트리는 그 주소를 원격(`AXIS_REGISTRY_URL` · config)으로 읽을 때만 받습니다 |
| D12 | 심볼릭 링크 대상(2026-10-22 사용자): 설치 대상이 심볼릭 링크여도 내용이 같으면(unchanged) 쓰지 않고 건너뜁니다. 실제로 써야 하는 링크만 쓰기 전에 거부합니다(아무것도 쓰지 않음). 프로젝트 밖을 가리키는 링크의 예외는 D15 로 해소 |
| D13 | 종전 기본값 이전(2026-10-22 사용자): `axis.config.json` 의 `registry` 가 정확히 종전 기본값 `https://axis.minu.best/r`(끝 `/` 1개 차이는 같은 값)이면 CLI 는 새 기본값 `https://axis-design-system.pages.dev/r` 로 바꿔 읽고 안내 1줄(「종전 기본 주소라 새 기본 주소로 조회해요. axis.config.json 의 registry 를 고치면 이 안내가 사라져요」)을 출력합니다. 파일은 고치지 않습니다. 다른 값(다른 경로 `/rx` · 다른 호스트 등 사용자가 직접 지정한 주소)은 그대로 존중합니다. `AXIS_REGISTRY_URL` 이 있으면 그것이 우선이라 이전을 적용하지 않습니다 |
| D14 | 레지스트리 밖 `axis.minu.best` 참조(2026-10-22 사용자): 템플릿 기본 주소 `/templates`, `$schema` URL, add 안내 문서 링크, library 수집기 `baseUrl`, 루트 `components.json` 의 `@axis` 별칭, mcp template 도구, `apps/web` index.json `homepage` 는 이번 WI 에서 고치지 않고 WI-0056 으로 이관합니다 |
| D15 | D12 의 예외 해소(2026-10-22 사용자): 설치 대상이 프로젝트 밖을 가리키는 심볼릭 링크라도 내용이 같으면(unchanged) 쓰지 않고 건너뜁니다. 출력은 「= <경로> (같은 내용이라 건너뜀, 링크 대상이 프로젝트 밖)」이고 rc 0 입니다. `-y` 로 건너뛰는 경우(내용이 다름, 덮어쓰기 안 함)도 쓰지 않으므로 건너뜁니다. 실제로 써야 하는 경우(내용이 다르고 덮어쓰기)는 계속 거부합니다(rc 1, 아무것도 쓰지 않음). 기존 파일을 읽을 때 링크를 따라가 읽는 것은 허용하지만 링크 대상이 디렉터리 · 읽기 불가면 종전처럼 rc 1 입니다 |
| D16 | 공개 URL 환경변수(2026-10-22 사용자): CLI 는 `AXIS_REGISTRY_PUBLIC_URL` 을 읽지 않습니다(현행 유지). 이 환경변수는 build-registry · G1 전용입니다(D11 해석 확정) |
| D17 | init 의 utils.ts 링크 규칙(2026-10-22 사용자 2차): `axis init` 의 `utils.ts` 쓰기에 add 의 링크 규칙(D12 · D15)을 그대로 적용합니다. 대상이 심볼릭 링크면 내용이 같을 때 쓰지 않고 「유지(이미 같은 내용, 링크)」로 알리고, 내용이 다르면 쓰지 않고 그 사실(프로젝트 밖 · 안 링크)을 알린 뒤 rc 1 입니다. 깨진 링크 · 디렉터리 · 읽기 불가도 쓰지 않고 rc 1 입니다. 이 판정은 쓰기 전에 하고, 막히면 `axis.config.json` 도 쓰지 않습니다(add 와 같은 원칙, 아무것도 쓰지 않음). 일반 파일이 다르면 종전처럼 덮어쓰고 「덮어씀」으로 알립니다. 쓰기는 add 와 같은 `O_NOFOLLOW` 경로(공용 헬퍼)입니다 |
| D18 | 종전 기본값 판정의 정규화(2026-10-22 사용자 2차): D13 이전 판정을 URL 정규화 비교로 넓힙니다. `new URL()` 로 파싱해 스킴 · 호스트 소문자, 기본 포트(`:443` · `:80`) 제거, 경로 끝 슬래시 모두 제거한 결과가 `https://axis.minu.best/r` 와 같으면 이전합니다. 파싱 실패나 다른 경로(`/rx` 등) · 다른 호스트는 이전하지 않습니다. 실제 조회 URL 을 만드는 `normalizeRegistryBaseUrl` 과 같은 정규화를 써서 두 판정이 어긋나지 않게 합니다(앞뒤 공백은 떼고 판정, `http://` 는 정규화 결과가 `http://axis.minu.best/r` 라 비이전, 기본 포트는 스킴의 기본 포트만 지워 `https://…:80` 은 비이전) |
| D19 | 하드링크 덮어쓰기(2026-10-22 사용자 2차): `add --overwrite`(대화형 예 포함)와 `axis init` 의 덮어쓰기에서 대상 일반 파일의 nlink 가 2 이상이면(하드링크) 쓰지 않고 그 경로와 이유(다른 경로와 하드링크로 이어진 파일이라 덮어쓰지 않음)를 알린 뒤 rc 1 입니다. 판정은 쓰기 전 계획 단계(lstat)에서 하고, 실제로 연 fd 의 fstat 로 한 번 더 확인합니다(경합, 자르기 전). 내용이 같으면 종전처럼 건너뛰어 영향이 없고, `-y` 로 건너뛰는 경우도 쓰지 않으므로 거부하지 않습니다 |
| D20 | init 의 종전 기본 registry 갱신(2026-10-22 사용자 2차): `axis init` 을 다시 실행할 때 기존 config 의 `registry` 가 D18 정규화 기준으로 종전 기본값이면 새 기본값 `https://axis-design-system.pages.dev/r` 로 바꿔 쓰고 「registry 를 새 기본 주소로 갱신(종전 axis.minu.best)」 취지로 알립니다. 사용자가 지정한 다른 값은 그대로 둡니다(m5 · D7 유지) |

## 2. 요구사항

- FR-1 레지스트리 정규화(`scripts/build-registry.mjs`): 출력은 `apps/web/public/r` 하나. `utils`(패키지 utils 와 같은 내용) · `agentic-a11y-labels` lib 항목 추가. 상대 import 를 표준 형태로, agentic 의 `@axis-ds/ui-react` cn import 를 utils 로. `dependencies` · `registryDependencies` 는 실제 import 스캔으로 생성. `registryDependencies` 는 레지스트리 절대 URL `<base>/<이름>.json`(D5, `<base>` 기본 `https://axis-design-system.pages.dev/r`, `AXIS_REGISTRY_PUBLIC_URL` 로 변경)이고, G1 이 이 형태와 그 이름의 항목 존재를 검사합니다. WI-0050 `scripts/client-modules.mjs` 를 SSOT 로 해당 항목에 `"use client"`. index.json 에 `version` 과 항목별 sha256. shadcn 레지스트리 스키마 호환 유지.
- FR-2 card · separator 의 빈 interface: 패키지 소스는 interface 유지(WI-0034 D5, 선언 병합), 레지스트리 사본만 type 으로 변환(create-next-app 기본 ESLint 통과, D6). 공개 타입 이름 · 의미는 유지.
- FR-3 CLI 조회: D1 순서(기본값은 `https://axis-design-system.pages.dev/r`, D8. init 은 환경변수 값을 config 에 기록하지 않음, D7), 타임아웃, `res.ok` · JSON · 스키마 검증, 이름 slug 검사, `registryDependencies` URL 은 D11 의 base 로 시작하는 `<base>/<이름>.json` 만. 레지스트리 URL 은 G1 `normalizePublicUrl` 과 같은 기준으로 공백 · userinfo · 쿼리 · 해시를 거부하고(접근 실패로 동봉본 폴백, 안내 · 오류에 찍히는 URL 은 userinfo 를 가리고 쿼리 · 해시 값을 `?***` · `#***` 로 가림. G1 `normalizePublicUrl` 의 오류 문구도 같은 규칙), config 의 `registry` 가 종전 기본값(D18 URL 정규화 비교)이면 새 기본값으로 바꿔 읽고 한 줄 안내합니다(D13, add · list 는 파일을 고치지 않음, env 가 있으면 미적용. init 을 다시 실행하면 새 기본값으로 바꿔 씀, D20). 원격 실패 시 동봉본 사용을 한 번 안내하고, 안내 문구는 접근 실패(접속 · 타임아웃 · 상태 코드)와 형식 검증 실패(JSON · 스키마 · sha256)를 구분(폴백 동작은 같음). 동봉본은 cli 빌드 때 SSOT 를 복사(커밋하지 않는 산출물). 동봉본과 원격 version 이 다르면 알림. 기존 `axis.config.json` · `utils.ts` 에 init 을 다시 실행하면 출력이 「생성」이 아니라 사실(config 는 유지 · 갱신, utils.ts 는 유지 · 덮어씀)대로. 기존 `utils.ts` 를 읽지 못하면(ENOENT 가 아닌 오류) 「생성 완료」로 적지 않고 그 사실을 알린 뒤 아무것도 쓰지 않고 rc 1. init 의 `utils.ts` 쓰기는 add 의 링크 규칙(D17)과 하드링크 규칙(D19)을 따르고, 판정은 쓰기 전에 해 막히면 config 도 쓰지 않습니다.
- FR-4 CLI 설치: 가변 인자 `add <components...>`(하나라도 없으면 전체 rc 1), `registryDependencies` 재귀 · 순환 방지, 배치(ui 는 componentsDir, agentic 은 componentsDir 형제 `agentic` 또는 config, lib 은 init 이 기록한 utils 위치), import 재작성(설치 위치 기준, POSIX 구분자), 경로 이탈 검사(realpath 기준 프로젝트 안, `..ui` 같은 하위 이름은 안), 쓴 뒤 사후 검사에서 밖이면 지우지 않고 경로를 알린 뒤 rc 1, 덮어쓰기 D3(덮어쓴 파일은 `~` 로 새 파일 `+` 와 구분), 새 파일은 `O_CREAT|O_EXCL|O_NOFOLLOW` 로 열어 판정 뒤(확인 대기 중) 같은 이름의 파일이 생기면 덮어쓰지 않고 경로를 알린 뒤 rc 1(덮어쓰기는 `O_WRONLY|O_NOFOLLOW` 로 열어 자르지 않고, 연 fd 를 fstat 로 일반 파일 · nlink 1 인지 확인(D19)한 뒤 `ftruncate`), 기존 대상이 심볼릭 링크면(프로젝트 밖을 가리켜도) 내용이 같거나 `-y` 로 건너뛸 때 건너뛰고 써야 할 때만 거부(D12 · D15), 기존 대상이 일반 파일이 아니면(FIFO · 장치, 링크면 따라간 대상) 읽기 전에 거부하고 아무것도 쓰지 않고 rc 1(D15 의 「디렉터리 · 읽기 불가면 rc 1」과 같은 취지, init 의 utils.ts 판정과 같은 기준), 덮어써야 하는 일반 파일이 하드링크(nlink 2 이상)면 계획 단계에서 거부하고 연 fd 의 fstat 로 재확인(D19), 누락 의존성은 `detectInstallCommand` 로 설치 명령 안내(설치는 하지 않음). init 이 쓰는 utils 를 레지스트리 utils 와 같은 내용으로 맞춤.
- FR-5 하드코딩 button 제거. `--agentic` 은 `agentic-` 접두를 붙이는 별칭(전체 이름도 허용). `list` 는 레지스트리 index 에서 이름을 읽음. 오류 문구 정정.
- FR-6 기록 정정: 잘못된 주석 · 오류 문구, quick-start 예시, cli README. 지난 문서(WI-0024 PRD · CHANGELOG 1.1.3)는 고치지 않고 이 WI 산출물에 정정 기록.
- FR-7 게이트: G1 레지스트리 무결성(모든 항목의 import 가 dependencies · registryDependencies · lib 로 닫힘, build-registry 실패 조건), G2 설치 후 빌드(로컬 정적 서버 + create-next-app 15.5 Tailwind 4 pnpm 픽스처, 린트 포함 next build, 서버 page 렌더. PR 은 대표 항목, 전수는 릴리스 전), G3 폴백(접속 불가 URL · 404 HTML), G4 덮어쓰기 · 경로 이탈. 음성 대조: 정규화 전 레지스트리 84/84 실패 재현.

## 3. 수용 기준

- AC1: 레지스트리 28개 항목 각각을 `axis add` 로 create-next-app 15.5.28(Tailwind 4, pnpm) 앱에 설치하면 선언된 의존성 설치만으로 린트 포함 `next build` 가 통과합니다. 서버 page 에서 렌더되고(함수 prop 없이), "use client" 7개는 경계로 동작합니다.
- AC2: `AXIS_REGISTRY_URL` 이 접속 불가 · 403 · 404 HTML 이면 동봉본으로 설치하고 접근 실패 안내가 한 번 나옵니다. 응답 형식이 틀리면(JSON 아님 · 스키마 · sha256 · D11 밖 의존 URL) 같은 폴백에 형식 검증 실패 안내가 한 번 나옵니다. 원격이 정상이면 원격을 씁니다(네트워크 훅으로 확인). 아무것도 지정하지 않으면 기본 원격은 `https://axis-design-system.pages.dev/r` 입니다(D8). config 의 `registry` 가 URL 정규화 기준(스킴 · 호스트 소문자, 스킴 기본 포트 제거, 경로 끝 `/` 모두 제거, 앞뒤 공백 제거)으로 `https://axis.minu.best/r` 이면 새 기본값으로 조회하고 안내 1줄, 파싱 실패 · 다른 경로 · 호스트 · 스킴은 그대로, env 가 있으면 env 를 씁니다(D13 · D18). `axis init` 을 다시 실행하면 그 값을 새 기본값으로 바꿔 쓰고 알리며, 다른 값은 그대로 둡니다(D20). URL 에 공백 · userinfo · 쿼리 · 해시가 있으면 요청 없이 접근 실패 안내로 동봉본을 쓰고, 안내 · 오류에 비밀번호와 쿼리 · 해시 값이 찍히지 않습니다(p1).
- AC3: `-y` 는 다른 내용의 기존 파일을 건너뛰고 `--overwrite` 만 덮어씁니다(출력 `~`). `../` 등 프로젝트 밖 경로는 거부하고, `..ui` 같은 하위 이름은 받습니다. 내용이 같은 심볼릭 링크 대상은 프로젝트 밖을 가리켜도 건너뛰고(rc 0, 밖이면 그 사실을 출력), `-y` 로 건너뛰는 링크도 rc 0, 덮어써야 하는 링크는 아무것도 쓰지 않고 rc 1 입니다(D12 · D15). 확인 대기 중 같은 이름의 새 파일이 생기면 덮어쓰지 않고 rc 1 입니다. `--overwrite` · 대화형 예로 덮어써야 하는 일반 파일이 하드링크면 아무것도 쓰지 않고 경로 · 이유를 알린 뒤 rc 1, 같은 내용 · `-y` 건너뜀은 rc 0 입니다(D19). `axis init` 의 `utils.ts` 가 다른 내용의 링크 · 깨진 링크 · 디렉터리 · 읽기 불가 · 하드링크면 아무것도 쓰지 않고 rc 1, 같은 내용의 링크는 「유지(이미 같은 내용, 링크)」입니다(D17 · D19). 사후 검사로 밖에 쓰인 것을 알면 그 파일을 지우지 않고 경로를 알린 뒤 rc 1 입니다.
- AC4: `add button input card` 는 셋 다 설치, 없는 이름이 하나라도 있으면 rc 1. `add run-progress --agentic` 과 `add agentic-run-progress` 가 같습니다. `list` 가 레지스트리 28개를 보여 줍니다.
- AC5: shadcn CLI(4.21.4)로 레지스트리를 직접 설치해도 빌드됩니다(대표 button · dialog · select · agentic-tool-call-card, D5 · D9). 경로: create-next-app 픽스처에 실제 `shadcn init -b radix -p nova --yes --no-monorepo`(비대화, stdin 닫음. `-p` 가 없으면 프리셋 선택 프롬프트가 남아 rc 0 으로 아무것도 만들지 않음)를 거친 뒤 `shadcn add <URL...> --overwrite`. 판정: 로컬 정적 서버로 띄운 사본(`<base>` 를 그 로컬 URL 로 바꿔 빌드)에서 add rc 0, 컴포넌트 파일 실제 생성, 설치된 `lib/utils.ts` 가 AXIS utils 와 같은 내용, 설치된 파일이 npm 패키지 `cn` 을 import 하지 않음, add 단계에서 npm 패키지 `cn` 을 설치하려 하지 않음(add 동안 `cn` 메타데이터 요청 0건, 양성 대조로 add 가 새로 넣은 패키지의 요청이 기록돼야 함. init 이 이미 `cn` 을 넣으므로 `package.json` 비교로는 가리지 못함. init 이 넣은 `cn` 은 남음), add 동안 `ui.shadcn.com` 요청 중 `/r/colors/` 를 뺀 요청 0건(colors 요청 수는 기록), 서버 page 린트 포함 `next build` rc 0(`pnpm registry-shadcn-smoke`).
- AC6: G1 이 의존성 하나를 지운 변이에서 실패하고, 정규화 전 레지스트리로는 G2 가 실패합니다.
- AC7: `pnpm exec turbo run type-check|lint|build|test --force` · `pnpm pack-smoke` 통과, apps/web 빌드 포함. cli 단위 테스트는 외부 네트워크 없이 통과합니다(D10).

## 4. 범위 밖
- MCP install(WI-0055), template apply 경로 검사와 403 폴백, 레지스트리 밖 ui-react 20개(다중 파일 항목 지원), `--install` 자동 설치, minu.best WAF 조정(사용자 몫, D8 로 기본값에서는 쓰지 않음), mcp 의 `axis.minu.best/r` 참조(WI-0055 와 함께), 레지스트리 밖 `axis.minu.best` 참조(D14, WI-0056 으로 이관).
