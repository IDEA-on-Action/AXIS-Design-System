# WI-0045: `axis add` 레지스트리 기반 설치 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #136 (WI-0047 #138 흡수) | 상태: 🔄 구현 완료 · D5 · D6 · D7 반영 (2026-10-21) · D8 ~ D12 · m1 ~ m5 · D13 ~ D16 · n1 ~ n5 · D17 ~ D20 · p1 · p2 (2026-10-22) 반영 (2026-10-22, 미커밋 · 미배포)
> 범례: [x] 완료 · [ ] 남음 · ⏸ 사용자 결정 대기

## FR-1 레지스트리 정규화 (`scripts/build-registry.mjs`, D2)
- [x] 출력은 `apps/web/public/r` 하나. 생성 전에 출력 디렉터리의 `*.json` 을 지워 낡은 항목이 남지 않음
- [x] 미배포 사본 삭제(D4): 루트 `public/r` 30개 · `packages/axis-ui-react/registry/r` 11개 · `packages/axis-agentic-ui/registry/r` 19개 `git rm`. CI · `apps/web` 코드에서 참조 0건(grep), 참조는 지난 WI 문서와 `project-todo.md` 뿐
- [x] lib 항목 2개(`registry:lib`): `utils`(패키지 `src/utils.ts` 와 바이트 같음) · `agentic-a11y-labels`(`src/constants/a11y-labels.ts` 와 바이트 같음)
- [x] import 정규화(TypeScript AST): `../utils` 와 cn 만 가져오는 `@axis-ds/ui-react` → `@/registry/axis/lib/utils`, `../constants/a11y-labels` → `@/registry/axis/lib/agentic-a11y-labels`(shadcn 4.21.4 · `@shadcn/registry` 0.1.3 transformImport 규칙을 소스로 확인)
- [x] `dependencies` · `registryDependencies` 를 import 스캔으로 생성. button `@radix-ui/react-slot` · toast `class-variance-authority` 선언, agentic 의 `@axis-ds/ui-react` · 쓰지 않는 framer-motion · `@axis/*` 선언 제거
- [x] `"use client"`: WI-0050 `scripts/client-modules.mjs` 를 SSOT 로 agentic 7개 맨 앞에
- [x] index.json 에 `version`(ui-react package.json, 지금 1.5.0)과 항목별 `sha256`(30/30)
- [x] G1(`scripts/registry-integrity.mjs`): import 가 dependencies · registryDependencies · lib 로 닫히지 않으면 build-registry 실패. 단위 테스트 11개(양성 1 · 음성 5 · 측정 실패 1 · 정규화 4). 검증 보정 후 27개(testplan 9 · 10절)
- [x] registryDependencies 형식(D5): 절대 URL `<base>/<이름>.json`. `<base>` 는 `scripts/registry-integrity.mjs` 한 곳(`DEFAULT_REGISTRY_PUBLIC_URL` = `https://axis-design-system.pages.dev/r`, `AXIS_REGISTRY_PUBLIC_URL` 로 변경). build-registry `--out <dir>` 로 다른 위치에 사본 생성(AC5 스모크용)
- [x] G1 이 registryDependencies 형태(`<base>/<slug>.json`)와 그 이름의 항목 존재를 검사. 음성 테스트 8건(접두 없는 이름 · 다른 호스트 · 다른 확장자 · 상대 경로 · @ns · slug 위반 · 하위 경로 · 없는 이름) + 공개 URL 바꿈 1건, test:registry 39건

## FR-2 card · separator 빈 interface
- [x] 레지스트리 사본에서만 `extends` 하나뿐인 빈 interface 를 `type` 으로 바꿈(build-registry). create-next-app 기본 ESLint 통과(G2 card · separator 와 이를 끌어오는 항목)
- [x] 패키지 소스는 그대로(D6): `type` 으로 바꾸면 소비자의 `declare module` 병합이 TS2300 으로 깨짐(WI-0034 D5). PRD FR-2 문구를 「소스는 interface 유지, 레지스트리 사본만 type」으로 정정
- [x] 사본 변환 때 바로 위 JSDoc 의 「인터페이스」를 「타입」으로(separator 「Props 인터페이스」 → 「Props 타입」). 단위 1건

## FR-3 CLI 조회 (`packages/axis-cli/src/registry/`, D1)
- [x] 순서: `AXIS_REGISTRY_URL` → `axis.config.json` 의 `registry` → 기본값(공백은 없는 것으로), http · https 만
- [x] registryDependencies 해석(D5): URL 이면 basename(`.json` 제거)을 이름으로 같은 레지스트리(원격 또는 동봉본)에서 찾음, 접두 없는 이름도 받음. `@ns` · 상대 경로 · 다른 확장자 · slug 위반 · 쿼리 붙은 URL · http 아닌 스킴은 항목 검증 실패(`registryDependencyName`, 단위 13건)
- [x] 기본 레지스트리(D8): `DEFAULT_REGISTRY_URL` · init 기본값을 `https://axis-design-system.pages.dev/r` 로(공개 base 상수 `REGISTRY_PUBLIC_BASE_URL` 과 같은 값). cli 테스트 · 픽스처 · cli-smoke 기대값도 교체. 저장소 안 다른 참조(루트 `components.json` `@axis` 별칭, mcp · cli 템플릿 URL `axis.minu.best/templates`)는 범위 밖이라 목록만
- [x] 의존 URL 범위(D11): 원격 응답은 지금 조회 중인 원격 base · 공개 기본 base, 동봉본은 공개 기본 base 로 시작하는 `<base>/<slug>.json` 만(G1 과 같은 문자열 접두). 다른 호스트 · 경로 · 공백 · userinfo · 쿼리 · 해시 거부. 단위: 형태 24건 + 원격 3건 + 동봉본 1건. 호스트 검사를 끈 변이에서 10건 실패
- [x] 폴백 안내 구분(m1): 접근 실패(`RegistryAccessError`: 접속 · 타임아웃 · 상태 코드)는 「접근하지 못해」, 그 밖(JSON · 스키마 · sha256 · 의존 URL)은 「형식 검증을 통과하지 못해」. 폴백 동작은 같음
- [x] 종전 기본값 이전(D13): config 의 `registry` 가 정확히 `https://axis.minu.best/r`(끝 `/` 1개 포함)이면 새 기본값으로 조회하고 안내 1줄, 파일은 고치지 않음. 다른 경로 · 호스트는 그대로, env 가 있으면 미적용. 단위 15건(registry 9 · add 6), 끈 변이 4건 실패
- [x] 레지스트리 URL 검사(n4): 공백 · userinfo · 쿼리 · 해시 거부(G1 `normalizePublicUrl` 과 같은 기준) → 접근 실패 문구로 동봉본 폴백(요청 0건), 안내의 URL 은 userinfo 를 `***` 로. userinfo 검사를 끈 변이 4건 실패. 검증 보정 r5: 가리기를 `new URL()` 판정으로 바꿔 `https:/u:p@h` 등 비 표준 형태 · 슬래시 비밀번호도 가림(종전 정규식 변이 2건 실패)
- [x] `AXIS_REGISTRY_PUBLIC_URL` 은 CLI 가 읽지 않음(D16, 현행 유지). PRD D11 · D16 에 확정 문구
- [x] init 출력(n1): `utils.ts` 가 이미 있으면 같은 내용은 「유지(이미 같은 내용)」(다시 쓰지 않음), 다르면 「덮어씀」. 단위 3건, 끈 변이 1건 실패
- [x] init 출력(m5): config 가 이미 있으면 「유지(이미 같은 내용)」(다시 쓰지 않음) 또는 「갱신(…, registry 는 기존 값 유지 · 기본값)」. 단위 4건
- [x] library 테스트 네트워크(D10): `src/library/index.test.ts` 의 fetch 를 mock 으로(collectAll · generateIndex · saveIndex). 깨진 프록시(`NODE_USE_ENV_PROXY=1` + 127.0.0.1:9)에서 19/19, mock 을 뺀 변이에서 1건 실패
- [x] init 기록(D7): `axis init` 은 `AXIS_REGISTRY_URL` 을 config 에 쓰지 않고 기본값(또는 기존 config 의 `registry`)만 씀. 단위 3건 · cli-smoke D7 2건
- [x] index.json 이름 중복 거부를 테스트로 고정(M3, 단위 3건, 검사를 끈 변이에서 2건 실패)
- [x] 타임아웃 5초(본문 읽기 포함), `res.ok` · JSON(본문 파싱으로만 판정) · 스키마 · 요청 이름과 응답 name · sha256 검증, 이름 slug 검사(위반은 네트워크 0건)
- [x] 원격 실패 시 동봉본(`dist/registry`, cli build 때 `scripts/copy-registry.mjs` 가 복사, 커밋 안 함)으로 폴백, 안내 한 번, 한 번 넘어가면 그 실행은 동봉본만. index 에 없는 이름은 폴백하지 않고 not-found
- [x] 동봉본과 원격 version 이 다르면 한 번 알림
- [x] tarball 에 동봉본 32개 파일 포함(수동 확인)
- [x] `pack-smoke` REQUIRED_FILES 에 `@axis-ds/cli: dist/registry/index.json` 추가(M4)
- [x] cli build 를 `tsup --clean` 으로(M5): 낡은 청크가 dist 에 남아 tarball 에 실리던 문제. clean 은 tsup 단계 안에서 끝나고 `copy-registry` 는 그 뒤 `&&` 로 실행

## FR-4 CLI 설치 (`packages/axis-cli/src/add/`, D3)
- [x] 가변 인자 `add <components...>`, 하나라도 없으면 없는 이름을 모두 알리고 rc 1, 아무것도 쓰지 않음
- [x] registryDependencies 재귀(visited 로 순환 · 중복 차단, 의존 항목 먼저), 의존 항목이 없으면 rc 1
- [x] 배치: ui · lib 은 componentsDir, agentic 은 `agenticDir`(없으면 componentsDir 형제 `agentic`), 파일명은 `file.path` basename. `file.path` · `target` 이 절대 · `..` · 역슬래시이거나 .ts · .tsx 가 아니면 rc 1(검증 보정)
- [x] import 재작성(설치 위치 기준 POSIX 상대 경로), 바꿀 대상 없는 `@/registry/` 가 남으면 쓰기 전에 실패
- [x] 경로 이탈 검사: 계획 단계(논리 경로 · 가장 가까운 기존 상위 realpath · 기존 파일 realpath, 디렉터리 · 깨진 링크 거부) + 쓰기 직전 부모 realpath
- [x] 기존 대상이 심볼릭 링크면(lstat, 안을 가리켜도) 거부 사유로 모아 아무것도 쓰지 않음(M1, 부분 설치 0). 쓰기 단계 ELOOP 문구는 검사 뒤 바뀐 동시 경합에만
- [x] 링크 대상(D12): 내용이 같은 링크(unchanged)와 `-y` 로 건너뛰는 링크는 쓰지 않으니 막지 않고, 실제로 써야 하는 링크(`--overwrite` · 대화형 예)만 쓰기 전에 거부. 단위 4건 + 양성 대조 1건, unchanged 링크 건너뜀을 끈 변이에서 2건 실패
- [x] 밖을 가리키는 링크 대상(D15): 내용이 같으면 `= <경로> (같은 내용이라 건너뜀, 링크 대상이 프로젝트 밖)` rc 0, `-y` 건너뜀도 rc 0, 써야 하면 거부 rc 1(아무것도 쓰지 않음), 디렉터리 대상 · 읽기 불가는 rc 1. 단위 7건, 끈 변이 4건 실패
- [x] 확인 대기 중 경합(n3): 새 파일은 `O_CREAT|O_EXCL|O_NOFOLLOW`, 덮어쓰기는 `O_NOFOLLOW` 로 연 뒤 fd 확인(D19) 다음에 `ftruncate`(종전 `O_TRUNC`). EEXIST 면 덮어쓰지 않고 경로 안내 rc 1. `r4/review/race.mjs` 사례 A 를 단위로(대조 2건 포함), `O_EXCL` 을 뺀 변이 1건 실패. 검증 보정 r5: 덮어쓰기 판정 뒤 지워진 파일은 O_CREAT 없이 ENOENT 로 알고 새 파일로 만들어 `+` 표기(`O_CREAT` 복원 변이 1건 실패)
- [x] 쓴 뒤 사후 검사(M2 · m3): realpath(대상)가 프로젝트 밖이면 지우지 않고 그 경로를 알린 뒤 rc 1(사용자 파일을 지우는 경로 제거, 단위 2건 경합 모사). 주석 · README · changeset · release-notes 를 같은 동작으로
- [x] 덮어쓴 파일 표시(m2): `--overwrite` · 대화형 예로 덮어쓴 파일은 `~ <경로> (덮어씀)`, 새 파일은 `+`. `AddResult.overwritten` 추가. 단위 2건
- [x] `isSameOrInside`(m4): `rel === '..'` · `..<sep>` 접두 · 절대 경로일 때만 밖. `..ui` 같은 하위 이름은 안(posix 9 · win32 3 · 설치 1건), 종전 판정으로 되돌린 변이에서 5건 실패
- [x] 쓰기 헬퍼 공용화(D17): 경로 이탈 · 링크 판정 · `O_NOFOLLOW` 쓰기를 `src/add/safe-write.ts` 로 옮겨 add · init 이 같이 씀(add.ts 는 종전 이름을 다시 내보냄)
- [x] init utils.ts 링크 규칙(D17): 링크 · 같은 내용은 「유지(이미 같은 내용, 링크)」(밖이면 실제 위치 표기), 다른 내용 링크(안 · 밖) · 깨진 링크 · 디렉터리 · 디렉터리 링크 · 읽기 불가는 쓰기 전에 판정해 아무것도 쓰지 않고(config · package.json 포함) rc 1. 일반 파일이 다르면 종전처럼 덮어씀. 단위 7건(쓰기 직전 링크로 바뀌는 경합 1건 포함), 링크 판정을 끈 변이에서 5건 실패
- [x] 종전 기본값 판정을 URL 정규화 비교로(D18): `isLegacyDefaultRegistryUrl` 이 앞뒤 공백을 떼고 `normalizeRegistryBaseUrl`(스킴 · 호스트 소문자, 스킴 기본 포트 제거, 경로 끝 `/` 모두 제거)로 정규화한 결과를 비교. 실제 조회 URL 도 같은 정규화 결과. `/r//` · 대문자 스킴 · 대문자 호스트 · `:443` · 앞뒤 공백은 이전, `/rx` · `/R` · `http://` · `:80`(https) · `:8443` · 쿼리 · userinfo · 파싱 실패는 비이전. 단위 26건, 문자열 비교로 되돌린 변이에서 11건 실패
- [x] 하드링크 덮어쓰기 거부(D19): add `--overwrite` · 대화형 예와 init 덮어쓰기에서 대상 일반 파일 nlink 2 이상이면 계획 단계(lstat)에서 경로 · 이유를 알리고 아무것도 쓰지 않고 rc 1, 쓰기 직전 연 fd 의 fstat 로 재확인(경합이면 자르지 않음). 같은 내용 · `-y` 건너뜀은 영향 없음. init 의 axis.config.json 은 종전처럼 링크를 따라가 쓰므로 따라간 대상으로 판정. 단위 add 7건 · init 4건, 계획 단계 끔 2건 · fstat 끔 2건 · config 판정 끔 1건 실패
- [x] init registry 갱신(D20): 기존 config 의 registry 가 D18 기준 종전 기본값이면 새 기본값으로 바꿔 쓰고 「registry 를 새 기본 주소로 갱신」 · 「(종전 axis.minu.best: …)」로 알림, 다른 값은 그대로(m5 · D7). 단위 7건, 갱신을 끈 변이에서 4건 실패
- [x] URL 쿼리 · 해시 가림(p1): `redactRegistryUrl` 이 userinfo 다음 쿼리 · 해시 값을 `?***` · `#***` 로(normalizeRegistryBaseUrl · fetchRegistryJson · 의존 URL 검증 · init D20 안내). 순환 import 를 피해 schema.ts 로 옮기고 remote.ts 에서 다시 내보냄. G1 `normalizePublicUrl` 오류 문구도 `redactPublicUrl` 로 같은 규칙. 단위 registry 6건 · test:registry 1건, 쿼리 가림을 끈 변이에서 5건 · 1건 실패
- [x] init utils.ts 읽기 오류(p2): ENOENT 가 아닌 오류(EACCES · ENOTDIR 등)는 「생성 완료」가 아니라 그 사실을 알리고 아무것도 쓰지 않고 rc 1. 단위 3건(양성 대조 1건 포함)
- [x] 일반 파일이 아닌 기존 대상(검증 보정 r6): FIFO · 장치(링크면 따라간 대상, D15 로 허용한 밖 링크 포함)는 `escapeReason` 이 읽기 전에 거부해 rc 1 · 아무것도 쓰지 않음(종전에는 readFileSync 가 끝나지 않음). 링크 거부 문구를 init 과 맞춤(안 링크는 「프로젝트 안을 가리키는 심볼릭 링크라」, 깨진 링크는 프로젝트 기준 상대 경로). init 의 utils.ts 쓰기 실패 안내가 config 를 실제로 썼는지(생성 · 갱신 · 유지)와 utils 새 파일 · 기존 파일을 나눠 사실대로 알림. 단위 add 6 · init 5, 되돌림 변이 6건 모두 실패
- [x] 덮어쓰기 D3: 같은 내용은 건너뜀, 다르면 대화형은 묻고 `-y` 는 건너뛰며 목록 · `--overwrite` 안내, `--overwrite` 만 덮어씀
- [x] 누락 의존성은 `detectInstallCommand` 로 설치 명령만 안내(clsx · tailwind-merge 는 init 과 같은 범위)
- [x] init 이 쓰는 utils 를 레지스트리 utils 와 같은 내용으로(`extendTailwindMerge` 판), init.test.ts 가 두 원본과 대조

## FR-5 하드코딩 제거 · 별칭 · list
- [x] `getComponentInfo` · 하드코딩 button 제거, add · list 를 `src/add` 로 분리
- [x] `--agentic` 은 `agentic-` 접두 별칭(전체 이름도 허용), `button --agentic` 은 Core UI 라고 안내
- [x] `list` 는 레지스트리 index 의 28개(lib 제외), `--category ui|agentic`
- [x] 오류 문구 정정(「네트워크 문제인 경우 인터넷 연결을 확인하세요」 삭제)

## FR-6 기록 정정
- [x] 잘못된 주석 · 오류 문구 제거(index.ts)
- [x] quick-start 예시 · cli README 갱신
- [x] 지난 문서(WI-0024 PRD D1 · cli CHANGELOG 1.1.3)는 고치지 않고 release-notes 「정정한 잘못된 기록」에 남김
- [ ] 레지스트리 밖 `axis.minu.best` 참조(템플릿 `/templates` · `$schema` · add 안내 문서 링크 · library 수집기 `baseUrl` · 루트 `components.json` `@axis` 별칭 · mcp template 도구 · `apps/web` index.json `homepage`): 범위 밖, WI-0056 으로 이관(D14)
- [ ] 문서 사이트(`apps/web/src`) add 예시 정합: 레지스트리 밖 ui-react 컴포넌트 · `--agentic` 없는 agentic 예시가 rc 1(범위 밖이라 남김, open issue)

## FR-7 게이트
- [x] G1 레지스트리 무결성: build:registry 안에서 실행(CI 「Build Registry」), 단위 테스트 `node --test scripts/registry-integrity.test.mjs`
- [x] G2 설치 후 빌드: `scripts/registry-install-smoke.mjs`(`pnpm registry-install-smoke` 대표 5 · `:all` 전수 28). 로컬 28/28 통과, 음성 대조(정규화 전 레지스트리) 0/28
- [x] G2 를 CI(frontend.yml ci job, Pack smoke 다음)에 대표 항목으로 배선
- [x] G3 폴백 · G4 덮어쓰기 · 경로 이탈: cli 단위 테스트 재사용 + 실행 파일 스모크 `scripts/cli-bundled-smoke.mjs`(`pnpm cli-smoke`), CI 배선
- [ ] CI 에서 새 step 두 개가 실제로 도는지 PR 에서 확인(미측정)
- [x] `registry-integrity.test.mjs` CI 배선: 루트 `pnpm test:registry`, frontend.yml ci job 의 Build Registry 다음(검증 보정)
- [x] publish.yml 에 Build 앞 build:registry(동봉본을 소스 재생성본으로, 검증 보정)
- [ ] 커밋본과 재생성본 drift 게이트(Version Packages PR 과 충돌, 결정 대기)
- [x] AC5 shadcn 직접 설치 스모크 `scripts/registry-shadcn-smoke.mjs`(`pnpm registry-shadcn-smoke`): shadcn 4.21.4 · 대표 button · dialog · agentic-tool-call-card. 로컬 1회 rc 0. CI 에는 넣지 않고 릴리스 전 전수 명령에 포함(비용 · 외부 의존, testplan 11절)
- [x] AC5 스모크를 실제 경로로(D9): components.json 직접 쓰기를 없애고 `shadcn init -b radix -p nova --yes --no-monorepo`(stdin 닫음) → `add <URL...> --overwrite --yes`. 대표에 select 추가. 판정은 PRD AC5(colors 요청 수 기록, init 의 cn 은 남음). 2026-10-22 rc 0(testplan 14절)
- [x] 스모크 자식 프로세스 그룹 정리(n5): G2 · AC5 스모크 `run()` 이 `detached` + `process.kill(-pid, 'SIGKILL')`(timeout · 자식 종료 · exit · SIGINT · SIGTERM · SIGHUP(검증 보정 r5, A/B 2→0)), `--run-timeout-ms`. A/B: 수정 전 shadcn add 상한 뒤 손자 `pnpm add` 생존 · SIGTERM 뒤 `pnpm install` 잔존, 수정 후 0개(testplan 17절)
- [x] G1 공개 URL 기준을 CLI D11 과 맞춤: `normalizePublicUrl` 이 공백 · userinfo · 쿼리 · 해시 거부(검증 보정 4)
- [x] `copy-registry` 가 동봉본 `registryDependencies` 를 D11 동봉본 기준으로 검사, 아니면 cli 빌드 rc 1(단위 7건, 검증 보정 4)
- [x] AC5 cn 판정을 add 동안 `cn` 메타데이터 요청 0건(양성 대조: 새 패키지 요청 기록) · 레지스트리 `cn` 선언 0건으로(검증 보정 4)
- [x] Quick Start · release-notes 에 shadcn 직접 설치 안내(`-b radix` · `--overwrite`)와 base-ui 프리셋의 select 빌드 실패(알려진 한계)

## 릴리스
- [x] changeset `.changeset/wi-0045-cli-add-registry.md`(`@axis-ds/cli` minor). ui-react 배포 파일 변경이 없어 linked 4패키지는 올리지 않음
- [ ] 배포 순서: CLI 발행(publish.yml 의 changesets publish) 전에 새 `/r`(index.json 에 `version` 있음)을 `axis-design-system.pages.dev` 에 먼저 배포. 2026-10-22 실측 pages.dev 의 index.json 은 키가 name · homepage · items 뿐이라 기본 경로 · D18 이전 경로 모두 「형식 검증을 통과하지 못해」 포함본으로 폴백(설치는 rc 0). 배포 뒤 `curl …/r/index.json` 에 version 이 있는지 확인. 순서는 사이트 자동 배포(이 PR 머지)에 맡기고 Version PR 머지 전에 실측(사용자 결정 2026-10-22)
- [ ] 릴리스 전 `pnpm registry-install-smoke:all`(전수 28) · `pnpm registry-shadcn-smoke`(AC5) 재실행
- [ ] 배포 후 npm 배포본 `@axis-ds/cli@1.5.0` 으로 G2 · cli-smoke 재측정
- [ ] #136 · #138 닫기, project-todo.md 57 · 59행 갱신(호출 쪽)
- [x] project-todo.md 334행 삭제된 경로(`registry/r` · `public/r`) 언급을 현재 사실(`apps/web/public/r` 하나)로 정정(M6)
