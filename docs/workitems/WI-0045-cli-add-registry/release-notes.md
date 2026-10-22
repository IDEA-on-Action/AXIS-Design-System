# WI-0045 릴리스 노트: `axis add` 레지스트리 기반 설치

> 상태: 미배포(2026-10-21 작성, 2026-10-22 D8 ~ D20 · m1 ~ m5 · n1 ~ n5 · p1 · p2 반영, 작업 트리 기준) | 유형: feat · 동작 변경 | 영향: `@axis-ds/cli` 1.4.0 → 1.5.0 (minor, `changeset status` 기준). linked 4패키지(tokens · ui-react · agentic-ui · theme)는 배포 파일 변경이 없어 올리지 않습니다. 레지스트리(`axis-design-system.pages.dev/r`)는 다음 사이트 배포 때 바뀝니다.
> changeset: `.changeset/wi-0045-cli-add-registry.md` | 흡수: WI-0047(#138)

## 변경 사항

### feat: `axis add` 가 레지스트리를 읽어 설치 (`@axis-ds/cli`)
종전(최초 배포 ~ 1.4.0)에는 레지스트리를 조회하지 않고 CLI 안에 박힌 shadcn 원형 button 하나만 설치했고, 나머지 이름은 모두 「찾을 수 없습니다」로 실패했습니다.

- 조회 순서: `AXIS_REGISTRY_URL` → `axis.config.json` 의 `registry` → 기본값(`https://axis-design-system.pages.dev/r`, D8). 원격을 읽지 못하면(접속 불가 · 타임아웃 · 오류 응답 · JSON 아님 · 형식 불일치) CLI 에 포함된 레지스트리로 설치하고 한 번 알립니다. 안내는 원격에 닿지 못한 경우(「원격 레지스트리에 접근하지 못해」)와 응답 내용이 검증을 통과하지 못한 경우(「원격 레지스트리 응답이 형식 검증을 통과하지 못해」)를 구분합니다(m1, 폴백 동작은 같음). 원격과 포함본의 version 이 다르면 원격을 우선 쓰면서 한 번 알립니다. 항목을 받는 도중 원격이 실패하면 이미 받은 원격 항목을 버리고 처음부터 포함본으로 다시 받아, 한 번의 add 에 두 출처를 섞지 않습니다. index 에 sha256 이 있는 항목은 파일이 1개여야 하고 내용이 sha256 과 맞아야 합니다.
- `axis add button input card` 처럼 여러 이름을 받습니다. 하나라도 없으면 없는 이름을 모두 알리고 아무것도 쓰지 않습니다(rc 1).
- `registryDependencies` 를 따라 `utils`(`cn`) · `agentic-a11y-labels` 를 함께 복사하고 import 를 설치 위치에 맞게 바꿉니다. `package.json` 에 없는 의존성은 설치 명령으로 안내만 합니다.
- `registryDependencies` 가 레지스트리 URL 이면 `<base>/<이름>.json` 형태만 받아 그 이름으로 지금 읽는 레지스트리(원격 또는 포함본)에서 찾습니다(D5 · D11). `<base>` 는 원격 응답이면 지금 조회 중인 레지스트리 주소 또는 공개 기본 주소(`https://axis-design-system.pages.dev/r`), 포함본이면 공개 기본 주소입니다. 판정은 G1 과 같은 문자열 접두 비교입니다. 다른 호스트 · 경로, 공백 · userinfo · 쿼리 · 해시가 든 URL, `@ns/이름` · 상대 경로 · `.json` 이 아닌 확장자 · 이름 규칙 위반은 형식 불일치입니다. 접두 없는 이름은 그대로 받습니다(하위 호환).
- 배치: Core UI · lib 은 `componentsDir`, Agentic UI 는 `agenticDir`(없으면 `componentsDir` 옆 `agentic`). 쓰기 전에 실제 경로가 프로젝트 안인지 확인합니다(`..ui` 처럼 `..` 로 시작하는 하위 이름은 안으로 봄, m4). 기존 대상 파일이 심볼릭 링크여도(프로젝트 밖을 가리켜도) 내용이 같거나 `-y` 로 건너뛰는 경우는 쓰지 않으므로 건너뛰고, 실제로 덮어써야 하는 링크만 아무것도 쓰지 않고 rc 1 로 알립니다(D12 · D15). 밖을 가리키는 링크를 건너뛸 때는 `= <경로> (같은 내용이라 건너뜀, 링크 대상이 프로젝트 밖)` 처럼 그 사실을 함께 적습니다(rc 0). 기존 파일을 비교할 때 링크를 따라가 읽지만, 링크 대상이 디렉터리이거나 읽을 수 없으면 종전처럼 rc 1 입니다. 기존 대상이 일반 파일이 아니면(FIFO · `/dev/zero` 같은 장치, 링크면 따라간 대상) 읽기 전에 「일반 파일이 아니라」로 알리고 아무것도 쓰지 않고 rc 1 입니다(init 의 utils.ts 와 같은 기준). 설치 대상이 디렉터리(또는 디렉터리를 가리키는 링크)이거나 기존 파일을 읽지 못하면(권한 등) 예외 스택 없이 이유를 알리고, 덮어쓰기를 묻기 전에 아무것도 쓰지 않고 rc 1 로 끝납니다. 쓴 뒤에는 실제 위치를 다시 보고 프로젝트 밖이면 그 파일을 지우지 않고 경로를 알린 뒤 rc 1 로 끝냅니다(동시 경합은 사후 검사로 감지, m3). 레지스트리의 `files[].path` · `target` 이 절대 경로이거나 `..` · 역슬래시를 포함하거나 파일 이름이 `.ts` · `.tsx` 가 아니면 거부합니다(rc 1, 아무것도 쓰지 않음).
- import 재작성은 주석 · 문자열 · 템플릿 글자 안의 `@/registry/...` 를 건드리지 않습니다(템플릿 `${}` 안은 코드로 봅니다). G1 은 TypeScript AST, CLI 는 상태 기계로 가려서 정규식 리터럴 같은 드문 형태에서는 판정이 다를 수 있습니다.
- 레지스트리의 `dependencies` · `devDependencies` 값이 패키지 이름(선택적 `@범위`) 형태가 아니면 형식 불일치로 보고 포함본을 씁니다. 안내하는 설치 명령은 사용자가 복사해 실행하므로 `;` · `$` · 따옴표 같은 셸 메타 문자를 받지 않습니다.
- `axis.config.json` 의 `componentsDir` · `agenticDir` 에 Windows 식 역슬래시를 적어도 `/` 로 읽습니다(종전 그대로 두면 POSIX 에서 agentic 이 프로젝트 루트 `agentic` 으로 갔습니다).
- 덮어쓰기를 묻는 동안 다른 프로세스(사용자 편집기 등)가 새로 설치할 파일과 같은 이름의 파일을 만들면, 그 파일을 덮어쓰지 않고 경로를 알린 뒤 rc 1 로 끝냅니다(n3). 새 파일은 `O_CREAT | O_EXCL | O_NOFOLLOW` 로 열고, 덮어쓰기로 판정한 파일은 `O_NOFOLLOW` 로 연 뒤 fd 를 다시 확인(D19)하고 나서 자릅니다(덮어쓰기 판정 뒤 파일이 지워졌으면 새 파일로 만들고 `+` 로 표기). 출력의 `+`(새 파일) · `~`(덮어씀)는 실제로 일어난 쓰기와 같습니다.
- 레지스트리 주소(`AXIS_REGISTRY_URL` · config 의 `registry`)에 공백 · 사용자 정보(userinfo) · 쿼리 · 해시가 있으면 G1 의 공개 URL 검사와 같은 기준으로 거부하고, 요청하지 않은 채 접근 실패 안내(「원격 레지스트리에 접근하지 못해」)로 포함본을 씁니다(rc 0, n4). 안내 · 오류에 찍히는 주소는 사용자 정보를 `***` 로, 쿼리 · 해시 값을 `?***` · `#***` 로 가립니다(`https://***@host/r?***`, p1). 레지스트리 빌드 쪽 공개 URL 검사(`normalizePublicUrl`)의 오류 문구도 같은 규칙으로 가립니다.
- `--agentic` 은 `agentic-` 접두 별칭입니다. `axis list` 는 레지스트리의 28개(Core UI 10 · Agentic UI 18)를 보여 줍니다.
- `axis init` 이 만드는 `utils.ts` 를 레지스트리 utils(`@axis-ds/ui-react` 의 `cn` 과 같은 `extendTailwindMerge` 판)와 같은 내용으로 바꿨습니다.
- `axis init` 은 `AXIS_REGISTRY_URL` 값을 `axis.config.json` 에 기록하지 않습니다. config 의 `registry` 는 기본값(`https://axis-design-system.pages.dev/r`, D8)이거나 이미 있던 config 값이고, 환경변수는 add · list 를 실행할 때만 우선합니다(D7). 종전(1.4.0 이하)에는 init 할 때 준 환경변수 값이 config 에 남았습니다.
- `axis init` 을 `axis.config.json` 이 이미 있는 곳에서 실행하면 「생성 완료」 대신 「유지(이미 같은 내용)」(파일을 다시 쓰지 않음) 또는 「갱신」(registry 는 기존 값 유지 · 기본값 중 하나를 함께 표시)으로 알립니다(m5). 갱신 때 add 가 읽는 `agenticDir` 는 기존 값을 지키고(「agenticDir 는 기존 값 유지」 표시), init 이 쓰지 않는 다른 키(`brand` · `monetDir` · `template` 등)는 빠지므로 「기존 설정에서 빠진 키」로 알립니다.
- `axis init` 을 다시 실행할 때 `utils.ts` 가 이미 있으면 같은 내용이면 「✓ utils.ts 유지(이미 같은 내용)」(다시 쓰지 않음), 다르면 종전처럼 init 의 utils 로 덮어쓰고 「✓ utils.ts 덮어씀(기존 내용과 달라 init 의 utils 로 다시 씀)」으로 알립니다(n1). 종전에는 어느 경우든 「생성 완료」였습니다. 기존 `utils.ts` 를 읽지 못하면(EACCES · ENOTDIR 등, ENOENT 가 아닌 오류) 「생성 완료」로 적지 않고 그 사실을 알린 뒤 아무것도 쓰지 않고 rc 1 입니다(p2).
- `axis init` 의 `utils.ts` 쓰기에 add 의 링크 규칙(D12 · D15)을 적용합니다(D17). 대상이 심볼릭 링크면 내용이 같을 때 쓰지 않고 「✓ utils.ts 유지(이미 같은 내용, 링크)」(밖을 가리키면 「링크 대상이 프로젝트 밖: <실제 위치>」), 내용이 다르면 쓰지 않고 그 사실(프로젝트 안 · 밖 링크)을 알린 뒤 rc 1 입니다. 깨진 링크 · 디렉터리 · 디렉터리를 가리키는 링크 · 읽기 불가도 rc 1 입니다. 이 판정은 쓰기 전에 하므로 막히면 `axis.config.json` · `package.json` 도 쓰지 않습니다. 일반 파일이 다르면 종전처럼 덮어씁니다. 쓰기는 add 와 같은 `O_NOFOLLOW` 경로(공용 `src/add/safe-write.ts`)입니다.
- `add --overwrite`(대화형 예 포함)와 `axis init` 이 덮어써야 하는 일반 파일이 다른 경로와 하드링크로 이어져 있으면(nlink 2 이상) 쓰지 않고 그 경로와 이유(「다른 경로와 하드링크로 이어진 파일이라(링크 수 N) 덮어쓰지 않습니다」)를 알린 뒤 rc 1 입니다(D19). 판정은 쓰기 전 계획 단계(lstat, 아무것도 쓰지 않음)에서 하고, 쓰기 직전 연 fd 의 fstat 로 한 번 더 봅니다(경합이면 자르지 않고 rc 1). 내용이 같거나 `-y` 로 건너뛰는 파일은 쓰지 않으므로 영향이 없습니다. init 의 `axis.config.json` 은 종전처럼 링크를 따라가 쓰므로 하드링크 판정도 따라간 대상으로 합니다.
- `--overwrite`(또는 대화형 예)로 덮어쓴 파일은 출력에서 `~ <경로> (덮어씀)` 로, 새로 만든 파일 `+` 와 구분합니다(m2).

### 동작 변경(사용자 확인 필요)
- 기본 레지스트리 주소(D8): `https://axis.minu.best/r` → `https://axis-design-system.pages.dev/r`. `axis.minu.best` 는 Cloudflare 403(2026-10-22 실측: `axis.minu.best/r/index.json` 403, `axis-design-system.pages.dev/r/index.json` 200)이라 기본값으로 두면 사용자는 매번 CLI 포함본으로 설치하게 되고, 레지스트리를 고쳐도 CLI 새 버전이 나와야 받습니다. 1.4.0 이하로 init 해 config 의 `registry` 가 정확히 종전 기본값(`https://axis.minu.best/r`, 끝 `/` 하나 차이는 같은 값)인 프로젝트는 CLI 가 새 기본값으로 바꿔 읽고 「axis.config.json 의 registry 가 종전 기본 주소(...)라 새 기본 주소(...)로 조회해요. axis.config.json 의 registry 를 고치면 이 안내가 사라져요」를 한 줄 알립니다(D13). add · list 는 파일을 고치지 않습니다. 같은 값인지는 URL 정규화 비교로 봅니다(D18): 앞뒤 공백을 떼고 실제 조회 URL 을 만드는 정규화(스킴 · 호스트 소문자, 스킴의 기본 포트 `:443` · `:80` 제거, 경로 끝 `/` 모두 제거)를 거친 결과가 `https://axis.minu.best/r` 이면 이전합니다(`/r//` · `HTTPS://` · `AXIS.MINU.BEST` · `:443` 포함). 파싱 실패 · 다른 경로(`/rx` 등) · 다른 호스트 · `http://`(정규화 결과가 다름)처럼 사용자가 직접 지정한 주소는 그대로 쓰고, `AXIS_REGISTRY_URL` 이 있으면 그것이 우선이라 이전을 적용하지 않습니다. `axis init` 을 다시 실행하면 이 종전 기본값을 새 기본값으로 바꿔 쓰고 「갱신(..., registry 를 새 기본 주소로 갱신)」과 「registry 를 새 기본 주소(...)로 갱신했습니다(종전 axis.minu.best: ...)」로 알립니다(D20). 사용자가 지정한 다른 값은 init 도 그대로 둡니다(m5 · D7).
- `-y`: 종전에는 묻지 않고 **덮어썼고**, 이제는 내용이 다른 기존 파일을 **건너뛰고** 목록을 알립니다. 덮어쓰려면 `--overwrite`. 터미널이 아닌 곳(CI · 파이프 · 닫힌 stdin)에서는 플래그가 없어도 묻지 않고 `-y` 와 같이 건너뜁니다.
- `add button` 내용: 종전 shadcn 원형(AXIS 색이 아님)에서 `@axis-ds/ui-react` Button 과 같은 AXIS button 으로 바뀌었습니다. 종전 button 이 있는 프로젝트에서 `add button -y` 는 건너뜁니다.
- 1.4.0 이하로 init 한 프로젝트의 `utils.ts` 는 내용이 달라 `add -y` 가 건너뜁니다(`cn` 은 그대로 동작).

### 레지스트리 정규화 (`apps/web/public/r`, D2)
- 항목 28개 + lib 2개(`utils` · `agentic-a11y-labels`). index.json 에 `version` 과 항목별 `sha256`.
- 상대 import(`../utils` · `../constants/a11y-labels`)와 agentic 의 `@axis-ds/ui-react`(cn) import 를 shadcn 표준 형태(`@/registry/axis/lib/...`)로 내보냅니다.
- `dependencies` · `registryDependencies` 를 실제 import 스캔으로 만듭니다. `registryDependencies` 는 레지스트리 절대 URL `<base>/<이름>.json` 입니다(D5). `<base>` 기본값은 `https://axis-design-system.pages.dev/r` 이고 빌드 때 `AXIS_REGISTRY_PUBLIC_URL` 로 바꿀 수 있습니다. 접두 없는 이름은 shadcn CLI 가 공식 레지스트리(ui.shadcn.com)로 풀기 때문입니다. agentic 7개(code-block · context-panel · diff-viewer · feedback-buttons · source-panel · streaming-text · tool-call-card)에 `"use client"`(WI-0050 목록).
- card · separator 의 빈 interface 는 레지스트리 사본에서만 `type` 으로 바꿨습니다(D6, 패키지 소스는 WI-0034 D5 선언 병합 때문에 interface 유지). 바뀐 선언 위 주석의 「인터페이스」도 사본에서 「타입」으로 맞췄습니다.
- 배포되지 않던 사본(루트 `public/r` · `packages/{axis-ui-react,axis-agentic-ui}/registry/r`, 60파일)을 지웠습니다.

### 게이트 (FR-7)
- G1 `scripts/registry-integrity.mjs`: build:registry 안에서 import 닫힘 · sha256 검사. 공개 URL(`AXIS_REGISTRY_PUBLIC_URL`)은 CLI 와 같은 기준으로 공백 · userinfo · 쿼리 · 해시를 거부합니다. 타입 위치 import(`typeof import("x")`)도 봅니다. `registryDependencies` 가 `<base>/<이름>.json` 형태이고 그 이름의 항목이 있는지 봅니다(D5). 단위 테스트 `pnpm test:registry`(CI ci job 의 Build Registry 다음).
- G2 `scripts/registry-install-smoke.mjs`: create-next-app 15.5.28 + Tailwind 4 + pnpm 픽스처에 항목마다 `axis add` → 안내된 의존성만 설치 → 린트 포함 `next build` → 서버 page 프리렌더 확인. PR 은 대표 5개(`pnpm registry-install-smoke`), 릴리스 전 전수 28개(`pnpm registry-install-smoke:all`). 로컬 28/28 통과, 정규화 전 레지스트리 0/28.
- G3 · G4 `scripts/cli-bundled-smoke.mjs`(`pnpm cli-smoke`): 빌드한 cli 로 동봉본 폴백 · `-y` · `--overwrite` · 경로 이탈 확인. init 이 환경변수 URL 을 config 에 쓰지 않는지(D7)도 봅니다.
- AC5 `scripts/registry-shadcn-smoke.mjs`(`pnpm registry-shadcn-smoke`, D9): create-next-app 픽스처에 실제 `shadcn@4.21.4 init -b radix -p nova --yes --no-monorepo`(stdin 닫음)를 거친 뒤 button · dialog · select · agentic-tool-call-card 를 URL 로 `add --overwrite --yes` → add rc 0 · 컴포넌트 파일 생성 · `lib/utils.ts` 가 AXIS utils · 설치 파일이 npm `cn` 을 import 하지 않음 · add 단계에서 npm `cn` 메타데이터 요청 0건(양성 대조: add 가 새로 넣은 패키지의 요청 기록) · 레지스트리 항목 dependencies 에 `cn` 선언 0건 · add 동안 ui.shadcn.com 요청 중 `/r/colors/` 외 0건(colors 는 기록) · 서버 page 린트 포함 next build rc 0. 양성 대조: init 의 ui.shadcn.com 요청 기록, 로컬 서버가 utils · agentic-a11y-labels 를 받음. 2026-10-22 로컬 rc 0(colors 1건 `neutral.json`, 그 밖 0건, add 동안 `cn` 요청 0건 · 새 패키지 요청 5/5 기록, init 이 넣은 `cn` 은 남음). 양성 대조가 ui.shadcn.com 접속에 기대므로 CI 에는 넣지 않고 릴리스 전 명령에 둡니다.
- cli 빌드의 `copy-registry` 는 동봉본 항목의 `registryDependencies` 가 CLI 가 동봉본에서 받는 형태(이름 또는 공개 기본 base URL)인지 보고, 아니면 빌드를 rc 1 로 멈춥니다(다른 공개 URL 로 만든 레지스트리가 동봉되지 않게).
- `pack-smoke` 가 `@axis-ds/cli` tarball 의 `dist/registry/index.json` 을 필수 파일로 봅니다. cli 빌드는 `tsup --clean` 으로 낡은 청크를 지운 뒤 동봉본을 복사합니다.
- CI(`frontend.yml` ci job)에 cli 스모크와 G2 대표 항목을 넣었습니다(첫 PR run 확인 필요).
- G2 · AC5 스모크의 자식 명령은 자기 프로세스 그룹으로 띄워, 상한 초과 · 스크립트 종료(exit · SIGINT · SIGTERM · SIGHUP) · 자식 종료 때 그룹 전체를 끝냅니다(n5). 처리기가 돌 수 없는 바깥 SIGKILL 에는 손자 그룹이 남을 수 있으니, 밖에서 끝낼 때는 SIGTERM 을 먼저 보냅니다. 종전에는 자식만 끝내 `pnpm dlx shadcn` 이 띄운 `pnpm add` 같은 손자 프로세스가 상한 뒤에도 돌았고, 스크립트가 SIGTERM 으로 끝나면 자식이 남았습니다(A/B 실측, testplan). `--run-timeout-ms <ms>` 로 명령 하나의 상한을 낮출 수 있습니다(점검용).

## WI-0047(#138) 해소 근거
#138 은 「레지스트리 항목 의존성 누락(button.json 의 @radix-ui/react-slot 등) 전수 점검 · 빌드 검사」입니다.
- 점검: 정규화 전 레지스트리에서 누락은 button `@radix-ui/react-slot` 외에 toast `class-variance-authority`, agentic 18개 `@axis-ds/ui-react`, 미공급 상대 import(ui 10개 `../utils` · agentic 11개 `../constants/a11y-labels`), 쓰지 않는 선언(framer-motion 6개 · `@axis/*` registryDependencies 7개)이었습니다(PRD P6, 실측 84/84 빌드 실패).
- 해소: 지금 `button.json` 은 `@radix-ui/react-slot` · `class-variance-authority`, `toast.json` 은 `@radix-ui/react-toast` · `class-variance-authority` 를 선언하고, agentic 은 `@axis-ds/ui-react` 대신 `utils` 를 registryDependencies 로 받습니다. 선언은 import 스캔으로 만들어 손으로 적은 목록이 낡을 여지가 없습니다.
- 검사: G1 이 의존성 하나를 지운 변이에서 실패하고(단위 테스트), G2 가 28개 전수를 안내된 의존성만으로 빌드해 통과합니다. 같은 G2 로 정규화 전 레지스트리는 0/28(build 21 · add 7)입니다.

## 정정한 잘못된 기록 (FR-6)
`axis add` 는 최초 커밋(ea764b4, 2026-01-23)부터 1.4.0 까지 네트워크를 쓰지 않았습니다(add 24회 실측 fetch 0건, 양성 대조 `template list` 는 기록됨). 아래 기록은 add 가 fetch 한다고 전제했습니다.

| # | 위치 | 기록 | 사실 | 처리 |
|---|---|---|---|---|
| 1 | `packages/axis-cli/src/index.ts` `getComponentInfo` 주석 | 「로컬 폴백 포함」 | 원격 조회가 없어 폴백할 대상도 없었음 | 함수와 함께 삭제 |
| 2 | 같은 파일 add 오류 문구(694888a) | 「네트워크 문제인 경우 인터넷 연결을 확인하세요」 | add 는 네트워크를 쓰지 않았음 | 삭제 |
| 3 | WI-0024 PRD D1 | 「`AXIS_REGISTRY_URL` 미지정 시 컴포넌트 fetch 실패」 | URL 은 `axis init` 이 `axis.config.json` 에 적는 데만 쓰였고 add 는 fetch 하지 않았음 | 지난 문서라 고치지 않고 여기에 기록 |
| 4 | `@axis-ds/cli` CHANGELOG 1.1.3 | 「(기존 `ds.minu.best`는 NXDOMAIN이라) 컴포넌트/템플릿 fetch 실패」 | 템플릿은 fetch 했지만 컴포넌트는 fetch 하지 않았음 | 고치지 않고 여기에 기록 |
| 5 | `docs/guides/quick-start.md` | `add button input card` 로 여러 개 추가 | 1.4.0 은 첫 이름(button)만 설치하고 rc 0 | 새 동작에 맞게 갱신 |
| 6 | `packages/axis-cli/README.md` | `axis list` 「설치된 컴포넌트 목록」 | CLI 에 적힌 20개 고정 목록이었음 | 레지스트리 목록으로 갱신 |

## 알려진 한계

- **배포 순서**: CLI 를 npm 에 발행하기 전에 새 레지스트리(`apps/web/public/r`, index.json 에 `version` 있음)를 `axis-design-system.pages.dev` 에 먼저 배포해야 원격 조회가 실제로 쓰입니다. 2026-10-22 실측으로 pages.dev 의 index.json 은 키가 name · homepage · items 뿐이라, 지금 발행하면 기본 경로와 D18 로 이전된 경로 모두 「원격 레지스트리 응답이 형식 검증을 통과하지 못해」 포함본으로 설치합니다(설치는 rc 0, CLI 결함 아님). 순서는 사이트 자동 배포에 맡깁니다(사용자 결정 2026-10-22): 이 PR 이 main 에 머지되면 Cloudflare Pages 가 새 `/r` 을 배포하고, Version PR 은 그 뒤에 머지됩니다. Version PR 머지 전에 pages.dev 의 index.json 에 `version` 이 있는지 실측합니다.
- **init 의 componentsDir 이탈**: `componentsDir` 가 프로젝트 밖(`../outside`, 또는 밖을 가리키는 링크 디렉터리)이면 init 은 종전처럼 그 밖의 위치에 utils.ts 를 만들거나 덮어씁니다(rc 0). add 는 같은 경우를 경로 이탈로 거부합니다. 사용자가 직접 밖을 지정한 경우라 이번 WI 에서는 동작을 바꾸지 않고 알려진 한계로 둡니다(사용자 결정 2026-10-22).
- MCP `axis.install_component` · `list_components` 는 여전히 레지스트리를 읽지 않습니다(WI-0055, #150).
- `axis.minu.best` 는 Cloudflare 403 입니다(2026-10-21 KT 망과 다른 출구 모두, 2026-10-22 이 작업 환경에서 curl 로 재확인 403 · pages.dev 200). 그래서 CLI 기본값을 `axis-design-system.pages.dev/r` 로 바꿨고(D8), WAF 조정은 사용자 몫으로 남습니다. 종전 기본값이 적힌 기존 config 는 새 기본값으로 바꿔 읽습니다(D13, 위 「동작 변경」). 또 새 레지스트리를 사이트에 배포하기 전까지 원격에 있는 구 index.json 에는 `version` 이 없어 검증에서 떨어지므로, 기본 경로도 포함본을 씁니다(설치 rc 0, 「형식 검증을 통과하지 못해」 안내 1번).
- (정정, D8) 종전 이 항목은 「CLI 기본 원격(`axis.minu.best/r`)과 레지스트리 항목에 박힌 URL 호스트(`axis-design-system.pages.dev/r`)가 다르다」고 적었습니다. 이제 기본 원격이 `https://axis-design-system.pages.dev/r` 라 두 호스트가 같고, shadcn CLI 로 직접 설치해도 같은 호스트에서 의존 항목을 받습니다. `AXIS_REGISTRY_URL` · config 로 다른 원격(미러 · 로컬)을 쓰면, 그 원격 base 로 시작하는 의존 URL 과 공개 기본 base 의 의존 URL 을 모두 지금 읽는 원격에서 찾습니다(D11).
- shadcn CLI 직접 설치에서 `components.json` 에 `tailwind.baseColor` 가 있으면(`shadcn init` 은 neutral 을 적음) shadcn 4.21.4 가 항목과 관계없이 `ui.shadcn.com/r/colors/<baseColor>.json` 을 받습니다(실측 1건). AC5 스모크는 실제 init 을 거치므로 「`/r/colors/` 를 뺀 요청 0건」으로 판정하고 colors 요청 수를 기록합니다(D9).
- shadcn CLI 직접 설치의 안내는 「`shadcn init -b radix -p nova`(radix 프리셋 + 스타일 프리셋 nova, 비대화는 `--yes --no-monorepo` 추가), `shadcn add <URL> --overwrite`」입니다(D9, Quick Start 「shadcn CLI 로 직접 설치하기」). `-p` 를 빼면 프리셋 선택 프롬프트가 뜨고, 입력이 닫힌 환경(CI · 파이프)에서는 init 이 rc 0 으로 끝나면서 `components.json` · `utils.ts` 를 만들지 않으며 이어진 add 도 rc 0 으로 아무것도 설치하지 않습니다(실패가 rc 로 드러나지 않음, shadcn 4.21.4 · 4.22.1 실측). 이 순서는 4.21.4(스모크 고정)와 4.22.1(확인 당시 `@latest`)에서 확인했습니다. init 이 npm 패키지 `cn` 을 `dependencies` 에 넣고 `utils.ts` 를 `cn` 패키지를 다시 내보내는 판으로 쓰므로, `--overwrite` 로 add 해야 `utils.ts` 가 AXIS utils 로 바뀝니다. `cn` 의존은 쓰이지 않은 채 `package.json` 에 남습니다. add 자체는 `cn` 을 더하지 않습니다: 레지스트리 30개 항목의 dependencies 에 `cn` 선언이 0건이고, AC5 스모크가 add 동안 `cn` 메타데이터 요청 0건을 봅니다(init 이 이미 `cn` 을 넣은 상태라 `package.json` 비교로는 가리지 못해 요청 기록으로 판정). 필요 없으면 직접 지웁니다.
- `<img>` 를 쓰는 레지스트리 항목 3개(`agentic-agent-avatar` · `agentic-message-bubble` · `agentic-attachment-card`, 레지스트리 30파일 중 `<img` grep 3건)는 사용자 프로젝트의 린트 포함 next build 에서 `@next/next/no-img-element` 경고를 냅니다(오류가 아니라 build rc 0). shadcn CLI 경로(2026-10-22 AC5 radix 경로 `agentic-agent-avatar` 실측)와 axis CLI 경로(`axis add`, 같은 레지스트리 내용을 설치하므로 같은 3개. 이전 검증 지적이고 이번 회차에 경고 문구를 다시 재지는 않음) 모두 해당합니다. 원본 컴포넌트가 `<img>` 를 쓰기 때문이고, 고칠지(주석 · `next/image` 전환)는 이번 WI 범위 밖이라 결정 대기입니다. 컴포넌트 코드는 고치지 않았습니다.
- shadcn 4.21.4 는 `agentic-a11y-labels` 를 설치할 때 파일 머리 JSDoc 주석(6줄)을 지웁니다. 나머지 설치 파일은 alias 치환(`@/registry/axis/lib/` → `@/lib/`) 말고는 레지스트리 내용과 바이트가 같습니다(2026-10-22 실측 16개 중 15개). 동작 영향은 없습니다. AC5 스모크는 `utils.ts` 만 레지스트리와 바이트 비교합니다.
- shadcn init 기본 프리셋(`init --defaults`, Base UI 기반 base-nova)으로 만든 프로젝트에서는 AXIS select 항목이 shadcn 의 `asChild` → `render` 변환을 거쳐 린트 포함 next build 가 실패합니다. 그래서 안내는 radix 프리셋(`-b radix`)이고(D9), AC5 스모크도 radix init 경로만 봅니다(radix 에서 select 포함 4개 통과).
- (해소, D12) 종전에는 기존 대상 파일이 심볼릭 링크면 내용이 같아도 add 전체를 rc 1 로 멈췄습니다. 이제 프로젝트 안을 가리키는 링크는 내용이 같으면(예: 앱 디렉터리 안의 공용 `utils.ts` 링크) 건너뛰고, `-y` 로 건너뛰는 링크도 막지 않습니다. 링크를 실제로 덮어써야 할 때(`--overwrite` · 대화형 예)만 아무것도 쓰지 않고 rc 1 입니다.
- (해소, D15) 프로젝트 밖을 가리키는 링크(예: 모노레포에서 앱 밖 공용 패키지의 `utils.ts`)도 내용이 같으면 쓰지 않고 건너뜁니다(`= <경로> (같은 내용이라 건너뜀, 링크 대상이 프로젝트 밖)`, rc 0). `-y` 로 건너뛰는 경우(내용이 다름)도 쓰지 않으므로 건너뜁니다. 실제로 써야 하는 경우(`--overwrite` · 대화형 예)는 계속 거부합니다(rc 1, 아무것도 쓰지 않음). 링크 대상이 디렉터리이거나 읽을 수 없으면 종전처럼 rc 1 입니다. 상위 디렉터리(`componentsDir` 등)가 밖을 가리키는 링크인 경우는 이 예외가 아니라 종전처럼 경로 이탈로 거부합니다.
- 원격 레지스트리의 `registryDependencies` 형식이 틀리면(@ns · 상대 경로 · 다른 확장자 · slug 위반 · 쿼리 · D11 밖 base) 원격 검증 실패로 보고 CLI 포함본으로 설치합니다(rc 0, 안내 1번, FR-3 폴백 유지). 안내 문구는 이제 「원격 레지스트리 응답이 형식 검증을 통과하지 못해」로 접근 실패(「접근하지 못해」)와 구분됩니다(m1).
- (해소, D11) 종전 axis CLI 는 URL 형태 `registryDependencies` 의 호스트 · 경로를 보지 않고 마지막 이름만 썼습니다. 이제 지금 조회 중인 원격 base 또는 공개 기본 base 로 시작하는 `<base>/<이름>.json` 만 받고, 그 밖은 형식 검증 실패입니다(포함본은 공개 기본 base 만). CLI 는 `AXIS_REGISTRY_PUBLIC_URL` 환경변수를 읽지 않으므로(D16 확정, 빌드 · G1 전용), 다른 공개 URL 로 빌드한 레지스트리는 그 주소를 원격(`AXIS_REGISTRY_URL` · config)으로 읽을 때만 받습니다.
- `AXIS_REGISTRY_PUBLIC_URL` 을 바꿔 빌드한 레지스트리는 다른 기본값으로 G1 을 돌리면 실패합니다(형태 검사가 그 URL 을 기준으로 함). 같은 환경변수로 빌드 · 검사해야 합니다.
- 쓰기 직전 검사(부모 realpath)와 쓰기 사이에 상위 디렉터리가 밖을 가리키는 링크로 바뀌는 경합은 미리 막지 못하고, 쓴 뒤 사후 검사로 감지해 rc 1 로 끝냅니다(O_NOFOLLOW 는 마지막 구성요소만 막음). 이때 밖에 쓰인 파일은 지우지 않고 그 경로를 알립니다(m3: 사용자 파일을 지우는 경로를 두지 않음). 밖에 같은 이름의 파일이 이미 있었다면 그 내용은 덮어쓰인 채 남으니 알린 경로를 직접 확인합니다. 프로젝트 디렉터리에 쓸 수 있는 다른 로컬 프로세스가 있어야 성립합니다.
- `--overwrite` 는 요청한 항목뿐 아니라 `registryDependencies` 로 끌려온 파일(예: 사용자가 고친 `utils.ts`)도 덮어씁니다. 출력은 이제 덮어쓴 파일을 `~ … (덮어씀)` 로 새 파일 `+` 와 구분합니다(m2).
- index.json `version` 은 ui-react 패키지 버전이라 content 만 바뀐 레지스트리를 구별하지 못합니다(원격과 포함본 content 가 달라도 version 이 같으면 알림 없음). contentHash 추가 여부는 결정 대기입니다.
- card · separator 패키지 소스의 빈 interface 는 그대로입니다(D6, WI-0034 D5 선언 병합). 레지스트리 사본만 type 입니다.
- 레지스트리 밖의 `axis.minu.best` 참조는 이번 WI 에서 고치지 않고 WI-0056 으로 이관합니다(D14): 템플릿 기본 주소(`/templates`, `src/template/registry-client.ts`), `axis.config.json` 의 `$schema` URL, add 의 init 안내 문서 링크, library 수집기 `baseUrl`, 루트 `components.json` 의 `@axis` 별칭, mcp template 도구, `apps/web` index.json `homepage`. 이 주소들은 Cloudflare 403 이라 해당 경로는 이번 배포 뒤에도 실패할 수 있습니다.
- 레지스트리 밖 ui-react 컴포넌트 20개(다중 파일 항목)와 template apply 경로 검사는 범위 밖입니다. 문서 사이트의 일부 add 예시(레지스트리 밖 컴포넌트, `--agentic` 없는 agentic 이름)는 rc 1 입니다.
- `publish.yml` 이 Build 앞에 build:registry 를 돌리도록 바꿔, CLI 포함본은 커밋된 사본이 아니라 소스에서 다시 만든 레지스트리를 싣습니다(배포 사이트와 같은 방식). 커밋된 `apps/web/public/r` 와 재생성본이 같은지 CI 에서 막는 검사(drift 게이트)는 아직 없습니다. 두면 Version Packages PR 도 막히므로 결정 대기입니다.
