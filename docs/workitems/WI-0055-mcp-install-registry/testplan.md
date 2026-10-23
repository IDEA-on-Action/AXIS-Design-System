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

## 4. D13 config registry 제한 (2026-10-24)

단위 테스트 `packages/axis-mcp/src/tools/registry-guard.test.ts` 41개(네트워크 없음, DNS · fetch 주입). mcp vitest 6파일 105/105, cli 640/640(무변경).

| 경우 | 결과 |
|---|---|
| 판정 거부 25종 | 10/8 · 172.16/12 경계 · 192.168/16 · 100.64/10 · 169.254.169.254 · 127.0.0.1 · 0.0.0.0 · 10진 · 16진 IPv4 표기, `[::1]` · `[::]` · `[fe80::1]` · `[fd12::1]` · `[::ffff:10.0.0.1]` · `[::ffff:7f00:1]` · NAT64 `[64:ff9b::a9fe:a9fe]`, `localhost` · `*.localhost` · `*.local`, `http://`, 사설로 풀리는 이름 · 공인과 사설이 섞인 이름 · `::ffff:127.0.0.1` 로 풀리는 이름 · 조회 실패 |
| 판정 허용 5종 | 공인으로 풀리는 이름, `8.8.8.8`, `[2606:4700::1]`, 경계 밖 `172.32.0.1` · `100.128.0.1` |
| mcp 사설 IP · http · localhost · 사설로 풀리는 이름 config | 무시하고 기본 주소로만 요청, 안내 「axis.config.json 의 registry(…)를 쓰지 않습니다」, 출처 「기본값」 |
| 공인 https config | 그 주소로 요청(`redirect: "manual"`), 출처 「axis.config.json registry」 |
| 공인 config 가 302 | 따라가지 않고 동봉본, 다른 주소 요청 0건, 안내 「리다이렉트(HTTP 302)를 따라가지 않습니다」 |
| env `http://127.0.0.1:4873/r` | 제한 없이 사용, DNS 조회 0건, redirect 옵션 없음 |
| install 사설 config | 기본 주소 → 동봉본으로 설치, 결과에 주소 · 출처 · 안내 |
| userinfo 가 든 config | 안내 · 출처에 비밀번호 없음(`https://***@10.0.0.1/r`) |
| cli(제한 끔) | 사설 config 그대로, 안내 · DNS 조회 0건 |

변이 10건 모두 테스트 실패로 잡힘(원복 확인): 판정 끔(mcp 가 옵션 미전달, 7건 실패) · 판정 결과 무시(5건) · https 조건 제거(2건) · DNS 판정 생략(4건) · `::ffff:` 매핑 판정 제거(3건) · 100.64/10 제거(1건) · 리다이렉트 거부 끔(2건) · env 에도 제한(1건) · 결과에서 주소 · 출처 생략(6건) · 안내의 주소 가림 제거(1건).

tarball 실측(D13 반영 mcp 를 `pnpm pack` 해 설치, 로컬 http 서버 접근 기록):

| 실행 | 로컬 서버 요청 | 결과 |
|---|---|---|
| mcp, config `registry: http://127.0.0.1:<포트>/r`, env 없음 | **0건** | 「https 가 아님(http)」 안내 뒤 기본 주소(pages.dev)에서 설치, 출처 「기본값」 |
| mcp, env `AXIS_REGISTRY_URL` 에 같은 주소(양성 대조) | 3건(index · separator · utils) | 출처 「환경변수 AXIS_REGISTRY_URL」 |
| 빌드한 cli, 같은 config(cli 무변경 대조) | 3건 | 종전대로 config 주소 사용 |

게이트(재실행): `turbo run type-check --force` rc 0(10/10, Cached 0), cli · mcp `build --force` · `test --force` rc 0(Cached 0), cli-smoke · mcp-smoke · pack-smoke rc 0.

## 5. D13 보강 (2026-10-24, 자동 보안 리뷰 2차)

mcp vitest 6파일 138/138(가드 테스트 74개), cli 640/640(무변경).

| 경우 | 결과 |
|---|---|
| 보강 거부 22종 | 198.18.0.1 · 198.19.255.255 · 192.0.0.8 · 192.0.2.1 · 198.51.100.7 · 203.0.113.9 · 192.88.99.1 · 240.0.0.1 · 255.255.255.255 · 64:ff9b:1::1 · 100::1 · 100:0:0:1::5 · 6to4 2002:a00:1::1(10.0.0.1) · 2002:7f00:1:: · Teredo 서버 10.0.0.1 · Teredo 클라이언트(비트 반전) 127.0.0.1 · 2001:db8::1 · 2001:2::1 · 2001:10::1 · 3fff::1 · 5f00::1 · ::ffff:198.18.0.1 |
| 보강 허용 6종 | 198.20.0.1 · 192.0.3.1 · 203.0.114.1 · 6to4 93.184.216.34 · Teredo 공인 서버 · 공인 클라이언트 · 2001:4860:4860::8888 |
| 재판정 양성 대조 | 판정이 허용하면 lookup 결과로 연결, Host 는 원래 이름(`registry.example.com:<포트>`), 응답 200 |
| DNS 리바인딩(검사 때 공인, 연결 때 127.0.0.1) | 연결하지 않음, 로컬 서버 요청 0건, 동봉본으로 28개, 안내 「연결 단계에서 registry.example.com 가 127.0.0.1(루프백 …)로 풀려 연결하지 않습니다」 |
| 연결 때 공인 + 사설 섞임 | 연결하지 않음, 요청 0건 |
| 응답 상한 초과 | 실패 |
| env 경로 | 재판정 fetch 를 쓰지 않음(DNS 조회 0건), 종전대로 요청 |

변이 7건 모두 잡힘(원복 확인): 연결 단계 판정 끔(2건 실패) · config 경로에 재판정 fetch 미연결(1건) · 198.18/15 제거(3건) · 6to4 판정 제거(2건) · Teredo 비트 반전 복원 생략(1건) · 64:ff9b:1::/48 제거(1건) · 응답 상한 제거(1건).

tarball 회귀(보강판 mcp 를 pack 해 설치): config `http://127.0.0.1:<포트>/r` 은 로컬 서버 요청 **0건**, 같은 주소를 env 로 주면 3건(양성 대조). 공인 https config(`https://example.com/r`)는 재판정 경로로 실제 DNS · TLS 연결이 되어 「HTTP 404」를 받고 동봉본으로 폴백(연결 단계 경로가 실제 TLS 에서 동작함을 확인).

게이트: `turbo run type-check --force` rc 0(10/10, Cached 0), cli · mcp `build --force` · `test --force` rc 0(Cached 0), cli-smoke · mcp-smoke · pack-smoke rc 0.
