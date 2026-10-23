# WI-0055 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-23 | 기준: 브랜치 `feat/wi-0055-mcp-install-registry`(리팩터링 124b9b3, mcp 전환 7caf3b7)

## 1. 단위 테스트

| 대상 | 결과 |
|---|---|
| cli vitest | 15파일 640/640 (테스트 파일 무변경, 리팩터링 전후 같은 수) |
| mcp vitest | 5파일 64/64 (기준 43 - tailwind-core 사본 동일성 1 + 레지스트리 도구 22) |
| 코어 · mcp type-check(`tsc --noEmit`) | rc 0 |
| `pnpm test:registry` | 45/45 |

변이(원복은 파일 내용 일치로 확인, `mutate.py`):

| 변이 | 결과 |
|---|---|
| D3 install 이 항상 `overwrite: true` | mcp 1건 실패(건너뜀 · 사용자 수정 유지) |
| D3 건너뜀 첫머리 안내 제거 | mcp 1건 실패 |
| D4 기본 배치(fallbackConfig) 제거 | mcp 5건 실패 |
| D4 없는 targetDir 검사 제거 | mcp 1건 실패 |
| D2 lib 항목을 목록에 포함 | mcp 3건 실패(28개 · 합계 · lib 상세) |
| D6 `ui` 필터 무시 | mcp 2건 실패 |
| D6 없는 이름 안내가 `--agentic` 을 말함 | mcp 1건 실패 |
| stdout 오염(install 의 log 를 console.log 로) | mcp 1건 실패 |
| D8 동봉본 이름이 cli 문구로(clientOptions 미전달) | mcp 1건 실패 |
| D2 get 의 props 덧붙임 제거 | mcp 1건 실패 |
| cli 회귀: 코어 덮어쓰기 판정을 `-y` 도 덮어쓰게 | cli 5건 실패 |
| cli 회귀: 동봉본 이름 기본값을 MCP 문구로 | cli 23건 실패 |
| pack-smoke: mcp `dependencies` 에 코어 | 「dependencies.@axis-ds/registry-core (발행하지 않는 공유 코어가 의존으로 남음)」 |
| pack-smoke: mcp `dist/index.js` 가 코어 import | 「dist/index.js 가 @axis-ds/registry-core 를 import 함(번들되지 않음)」 |

## 2. 게이트 (2026-10-23, worktree)

| 게이트 | rc | 수치 |
|---|---|---|
| `turbo run type-check --force` | 0 | 10/10, Cached 0 |
| `turbo run lint --force` | 0 | 4/4, Cached 0 |
| `turbo run build --force` | 0 | 8/8, Cached 0 (빌드가 바꾼 `apps/web/public/templates/*.json` 5개는 원복) |
| `turbo run test --force` | 0 | 6/6, Cached 0 (cli 640 · mcp 64 · ui-react 110 · agentic-ui 72 · theme 31 · tokens 235) |
| `pnpm test:registry` | 0 | 45/45 |
| `pnpm cli-smoke` | 0 | OK(G3-a · G3-b 폴백, G4-a 건너뜀 · 덮어씀, G4-b 이탈) |
| `node scripts/mcp-smoke.mjs` | 0 | tools/list 18, 호출 9건 기대 일치 |
| `pnpm pack-smoke` | 0 | 6개 패키지, mcp stdio 호출 9건, mcp `dist/registry/index.json` 실재 |
| `pnpm registry-install-smoke` | 0 | 대표 5/5(button · dialog · toast · agentic-tool-call-card · agentic-approval-card) |

## 3. 실측 (tarball 설치본)

새 mcp · cli 를 `pnpm pack` 해 빈 디렉터리에 `npm install` 한 뒤 실행했습니다. 음성 대조는 배포본 `@axis-ds/mcp@1.2.3` · `@axis-ds/cli@1.5.1` 입니다.

| 확인 | 새 빌드 | 음성 대조 |
|---|---|---|
| 발행 `dependencies` | cli · mcp 모두 배포본과 같음(peer · optional 없음). devDependencies 의 코어는 `0.0.0` 으로 적힘 | 1.2.3 · 1.5.1 |
| mcp tarball 동봉본 | `dist/registry` 32파일(항목 30, version 1.5.0) | 1.2.3 은 `dist/data` 만 |
| list(원격 기본) | 합계 28, 출처 「원격 레지스트리 (version 1.5.0)」 | 합계 10, Agentic 0 |
| search `progress` | `agentic-run-progress` 1건 | 0건 |
| get `run-progress` | 없음 + 「전체 이름 'agentic-run-progress' 를 쓰세요」 | 「찾을 수 없습니다」만 |
| install separator · dialog · agentic-run-progress, config 없음, 원격 차단(`AXIS_REGISTRY_URL=http://127.0.0.1:1/r`) | isError false, 5파일(`components/ui/*` 4 · `components/agentic/run-progress.tsx`), 폴백 안내 1번 · 기본 배치 안내, 의존성 명령 안내 | separator · dialog 「템플릿 없음」, agentic 「찾을 수 없음」 |
| 같은 설치, config(`./src/components/ui`) | `src/components/ui/*` · `src/components/agentic/*` 5파일. cli 1.5.1 의 같은 add 결과와 `diff -r` rc 0(바이트 동일) | |
| 설치 뒤 빌드 | create-next-app 15.5.28(Tailwind 4 · eslint · src-dir · pnpm) 두 앱(config 없음 · 있음)에 안내 명령만 실행하고 세 컴포넌트를 쓰는 page 로 `next build` 모두 rc 0 | |
| 건너뜀 · overwrite · 이탈(mcp-smoke) | 사용자 수정 유지 + 「1개를 건너뛰었습니다」, `overwrite: true` 덮어씀, `componentsDir ../escaped` 는 isError · 밖에 파일 없음 | 1.2.3 으로 같은 mcp-smoke: 6건 결함(rc 1) |
| stdout | JSON-RPC 아닌 줄 0 | |
| cli 리팩터링 회귀 | 새 cli 와 1.5.1 의 `add separator dialog agentic-run-progress` 가 원격 · 원격 차단 두 경우 모두 파일 `diff -r` rc 0, 출력 diff rc 0 | |

참고: `127.0.0.1:1` 은 Node fetch 가 「bad port」로 요청 전에 거부합니다. 코어는 이것도 원격 접근 실패로 보고 동봉본으로 폴백하므로 원격 차단 측정으로는 같습니다. 접속 거부(ECONNREFUSED) · 404 HTML 은 cli-smoke 와 cli 단위 테스트가 덮습니다.
