# WI-0038 릴리스 노트: `axis init` utils.ts 의존성 추가 · 안내

> 릴리스일: 미정(PR 머지 뒤 Version Packages PR 을 머지할 때 CI 발행) | 유형: fix | 영향: @axis-ds/cli 1.2.0 → 1.2.1 (patch, `.changeset/wi-0038-cli-init-utils-deps.md`)

## 배경

`axis init` 이 만드는 `utils.ts` 는 `clsx` · `tailwind-merge` 를 import 하는데, init 은 두 패키지를 `package.json` 에 넣지도 안내하지도 않았습니다(Issue #124). 그래서 새 Next.js 프로젝트에서 init 직후 `pnpm build` 가 `Cannot find module 'clsx'` 로 실패했습니다. 또 init 의 마지막 안내 `npx axis-cli add button` 은 우리 패키지가 아니라 npm 에서 unpublish 된 타인 이름(`axis-cli`)이었습니다.

## 변경 사항

### fix: init 이 utils.ts 의존성을 추가하고 설치 명령을 안내
- `package.json` 이 있으면 `clsx ^2.1.1` · `tailwind-merge ^3.4.0` 중 `dependencies` · `devDependencies` 어디에도 없는 것만 `dependencies` 에 추가합니다. 이미 있는 것은 범위를 바꾸지 않습니다.
- lockfile 로 고른 설치 명령(`pnpm install` · `yarn install` · `npm install`)을 안내합니다. 설치는 실행하지 않습니다.
- `package.json` 이 없으면 만들지 않고, 패키지 매니저별 추가 명령(예: `pnpm add "clsx@^2.1.1" "tailwind-merge@^3.4.0"`)을 안내합니다. `package.json` 을 읽거나 쓸 수 없을 때(JSON 오류, 프로젝트 밖을 가리키는 링크, 쓰기 권한 없음)도 바꾸지 않고 같은 명령을 안내합니다.
- `package.json` 의 키 순서 · 들여쓰기 · 줄바꿈(CRLF) · 끝 줄바꿈 · BOM 을 유지합니다. init 을 다시 실행해도 `package.json` 은 바뀌지 않습니다.
- `package.json` 을 쓰는 도중 실패하면(디스크 공간 부족 등) 원래 내용으로 되돌리고, 되돌렸는지를 오류(rc 1)에 적습니다.
- `axis.config.json` · `utils.ts` 내용과 그 밖의 출력은 그대로입니다.
- 범위는 AXIS 템플릿 4종과 같은 값입니다. `tailwind-merge` 3.x 는 Tailwind 4 기준이며, create-next-app 15 의 기본 구성(Tailwind 4)과 맞습니다.

### fix: 실행 안내의 `axis-cli` 를 `@axis-ds/cli` 로
- CLI 출력(`init` · `list` · `sync` · `monet` · `v0` · `library`)과 문서 사이트의 설치 명령을 `npx @axis-ds/cli ...`(pnpm `pnpm dlx @axis-ds/cli`, bun `bunx @axis-ds/cli`)로 고쳤습니다.
- `axis-cli` 는 2026-01-15 npm 에서 unpublish 된 이름이라 누구나 다시 등록할 수 있습니다. 예전 안내를 따라 `npx axis-cli` 를 실행하지 마세요.
- 이 상태는 `packages/axis-cli/src/guidance.test.ts` 가 고정합니다.

## 검증 (2026-10-19, 기준 c131ee9 + 이 브랜치)

| 항목 | 명령 | 결과 |
|---|---|---|
| 단위 | `npx vitest run` (packages/axis-cli) | 12 파일 · 212건 통과(theme add 테스트 수정 없음) |
| 전체 테스트 | `pnpm turbo run test --force` | rc 0, 6/6, 0 cached |
| 린트 · 타입 | `pnpm turbo run lint type-check --force` | rc 0, 12/12, 0 cached |
| 빌드 | `pnpm build --force` | rc 0, 8/8, 0 cached |
| 실경로 | create-next-app 15.5.28 → `axis init -y` → `pnpm install` → `pnpm build` (이 브랜치 tarball) | `pnpm build` rc 0 |
| 음성 | 같은 절차, c131ee9 tarball | `pnpm build` rc 1, `Cannot find module 'clsx'` |
| 실경로 재측정 | 같은 절차, `--force` 빌드한 이 브랜치 CLI, init 이 안내한 `pnpm install` 실행 (testplan T13) | `pnpm build` rc 0 |
| 음성(배포본) | 같은 절차, npm `@axis-ds/cli@1.2.0` (testplan T14) | `pnpm build` rc 1, `Cannot find module 'clsx'` |
| WI-0028 AC2(b) | `axis init -y` → `axis theme add ontology` → `pnpm install` → `pnpm build` (testplan T15 · T16) | rc 0, import 1줄, `axis check` brand PASS, `data-brand=ontology` 5건, theme add 없는 대조군 0건 |
| 쓰기 도중 실패 | `ulimit -f 1` 로 쓰기 도중 EFBIG 를 낸 init (testplan T19 ~ T21) | 수정 전 `package.json` 잘림 · JSON 파손, 수정 뒤 원래 내용으로 복원(sha 같음) |
| changeset | `pnpm changeset status --verbose` | rc 0, patch `@axis-ds/cli` 1.2.1, minor · major 없음 |
| 음성 | D1 호출을 지운 변이 · 문구 변경을 되돌린 상태 | init 테스트 24건 실패 · 안내 테스트 위반 75줄 |

- 실경로 전제: 수정본이 npm 에 없어 이 브랜치를 `pnpm pack` 한 tarball 을 별도 디렉터리에 설치해 실행했습니다. 프로젝트 쪽 env · 의존성 주입은 없습니다. 자세한 조건은 testplan 3.1 · 3.2 입니다. 배포 뒤 1.2.1 배포본으로 T13 · T15 를 다시 확인합니다.

## 소비 프로젝트 영향

- 새 버전으로 `axis init` 을 실행하면 `package.json` 에 두 의존성이 추가될 수 있습니다. 안내된 설치 명령을 한 번 실행하면 됩니다.
- 이미 init 한 프로젝트는 `pnpm add clsx tailwind-merge`(또는 쓰는 패키지 매니저의 같은 명령)로 맞추면 됩니다.
