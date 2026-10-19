# WI-0038 테스트 계획: `axis init` utils.ts 의존성 추가 · 안내

> PRD: [prd.md](./prd.md) | TODO: [todo.md](./todo.md) | 릴리스 노트: [release-notes.md](./release-notes.md)

## 1. 범위

- `packages/axis-cli` init 명령(FR-1 ~ FR-6)과 `axis-cli` 실행 안내 정정(D2)
- theme add 는 바꾸지 않습니다. 재사용하는 함수에 `export` 만 붙이므로 theme add 테스트가 수정 없이 통과하는지로 확인합니다.

## 2. 단위 테스트 (vitest, `packages/axis-cli`)

| ID | AC | 경우 | 기대 |
|---|---|---|---|
| U1 | AC3 | `package.json` 없음 | 파일을 만들지 않음, `pnpm add "clsx@^2.1.1" "tailwind-merge@^3.4.0"` 안내 |
| U2 | AC1 | `package.json` 있음, 두 의존성 없음 | `dependencies` 에 두 범위 추가, 나머지 키 · 순서 유지, `pnpm install` 안내 |
| U3 | AC2 | 둘 다 `dependencies` 에 있음 | `package.json` 바이트 불변, 쓰기 0 |
| U4 | AC2 | `devDependencies` 에 있음(하나 · 둘) | 그 범위 유지, `dependencies` 에 중복 추가 안 함 |
| U5 | AC4 | 탭 · 4칸 들여쓰기, CRLF, BOM, 끝 줄바꿈 없음 | 형식 유지, 결과가 JSON |
| U6 | AC4 | init 두 번 | 두 번째 실행 전후 디렉터리 스냅샷 같음 |
| U7 | AC5 | lockfile pnpm · yarn · npm · 없음 | `pnpm install` · `yarn install` · `npm install` · `pnpm install`, 추가 명령도 매니저별 |
| U8 | FR-3 | JSON 이 아님 · 최상위 배열 · `dependencies` 가 배열 · 실제 경로가 밖(심볼릭 링크) | `package.json` 불변, 경고 + 추가 명령, rc 0 |
| U9 | FR-4 | 계획 뒤 `package.json` 변경 | 쓰지 않고 오류 |
| U10 | FR-5 | 모든 경우 | `child_process` 호출 0 |
| U11 | AC7 | 기본값 init | 기존 출력 줄 · `axis.config.json` · `utils.ts` 가 c131ee9 기준값과 같음 |
| U12 | AC6 | init 출력 · 소스 스캔 | `axis-cli` 실행 안내 0건, 스캔 대상 파일 수 > 0, 패턴이 알려진 나쁜 문자열을 잡는지 양성 대조 |

## 3. 실경로 스모크 (AC9)

- 프로젝트: `npx --yes create-next-app@15.5.28 <dir> --ts --tailwind --eslint --app --no-src-dir --use-pnpm --import-alias "@/*" --no-turbopack --skip-git`(WI-0028 T7-2 와 같은 명령)
- CLI: 이 브랜치 빌드를 `pnpm pack` 한 tarball 을 별도 디렉터리에 `npm install` 하고 그 `bin` 으로 실행합니다(수정본은 아직 npm 에 없음). 음성 대조는 c131ee9 빌드의 tarball 입니다.
- 절차: `axis init -y` → `pnpm install` → `pnpm build`. env · 의존성 주입 없음.

## 3.1 결과

(구현 뒤 기록)
