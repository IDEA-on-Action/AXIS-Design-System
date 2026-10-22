# WI-0045 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-21(18절 2026-10-22) | 브랜치: `feat/wi-0045-add-registry`(미커밋 작업 트리, 기준 21c4639) | 환경: 로컬 WSL2, Node 22.22.0 · pnpm 10.33.0(corepack) 기본, CI 축 대조는 Node 20.19.5 · pnpm 9.15.4. turbo 2.7.5. 픽스처 create-next-app 15.5.28(next 15.5.28 · react 19.1.0 · tailwindcss 4)
> 범례: 통과 / 실패 / **미측정**(이 문서 작성 시점까지 실행하지 않음). 1 ~ 3절은 구현 단계별 실행 기록이고, 4절 이후는 구현 4/4 단계에서 현 작업 트리로 다시 돌린 값입니다.
> 원격 경로 실측은 모두 로컬 정적 서버(127.0.0.1)로 했습니다. 이 호스트에서 기본 호스트 `axis.minu.best` 는 Cloudflare 403 입니다.

## 1. 레지스트리 정규화 (구현 1/4, FR-1 · FR-2)

| # | 내용 | 명령 · 방법 | 결과 |
|---|---|---|---|
| R1 | 출력 · 미배포 사본 | `pnpm build:registry`, `git rm` 3곳 | 출력은 `apps/web/public/r` 32파일(항목 30 + index · registry). 삭제 60파일(루트 30 · ui-react 11 · agentic-ui 19). 참조 grep: CI · `apps/web` 0건 |
| R2 | lib 원본 일치 | `cmp` | `utils.ts` · `agentic-a11y-labels.ts` 각각 패키지 원본과 바이트 같음 |
| R3 | G1 단위 테스트 | `node --test scripts/registry-integrity.test.mjs` (4단계 재실행) | 11/11 통과. 음성 5종(dependencies 삭제 · registryDependencies 삭제 · 상대 import 잔존 · content 와 sha256 불일치 · 정규화가 문법을 깸)이 모두 실패로 잡힘 |
| R4 | build:registry 재현성 | `pnpm build:registry` 앞뒤 `cat *.json \| sha256sum` (4단계) | 같음(32 → 32 파일), G1 통과 문구 출력 |
| R5 | FR-2 소스 변경 영향 | `declare module` 병합 픽스처를 interface 판 · type 판으로 `tsc` | interface 판 rc 0, type 판 rc 2(TS2300). 소스는 그대로 두고 레지스트리 사본에서만 type 으로 바꿈(⏸ 결정 대기) |
| R6 | shadcn 규칙 근거 | `@shadcn/registry` 0.1.3 transformImport · resolveNestedFilePath 소스 확인 | `^@/registry/(.+)/lib/utils$` → aliases.utils, `^@/registry/(.+)/lib` → aliases.lib |
| R7 | AC5 shadcn CLI 직접 설치 | shadcn 4.21.4 로 로컬 서버 항목 설치 | 접두 없는 registryDependencies 가 공식 레지스트리(`styles/new-york-v4/<name>.json`)로 풀림. agentic 중 a11y-labels 의존 11개는 rc 1(not found), ui 10개와 agentic 18개의 utils 는 AXIS utils 대신 공식 utils(`export { cn } from "cn"` + npm 패키지 cn)로 설치됨. 전체 URL 로 바꾼 대조판은 rc 0 이고 AXIS utils · a11y-labels 가 설치됨. 공식 utils 로 설치된 항목의 빌드는 **미측정**. **AC5 미충족**(⏸ 결정 대기). D5 결정 뒤 11절에서 해소 |

## 2. CLI 조회 (구현 2/4, FR-3)

| # | 내용 | 결과 |
|---|---|---|
| F1 | `src/registry/registry.test.ts` | D1 순서 3건 · 원격 정상 4건 · 폴백 13건(접속 거부 · 404 HTML · 200 HTML · 403 · 타임아웃 · index · 항목 스키마 · version 누락 · 동시 실패 안내 1번 · name 불일치 · sha256 불일치 · URL 형식 · 둘 다 실패) · slug 2건 · 실레지스트리 전수 1건. 테스트 서버는 127.0.0.1 임시 포트 |
| F2 | 동봉본 tarball | `pnpm pack` 결과 `dist/registry/` 32파일(수동 확인). `pack-smoke` 필수 파일 목록에는 아직 없음(open issue) |

## 3. CLI 설치 (구현 3/4, FR-4 · FR-5)

| # | 내용 | 결과 |
|---|---|---|
| I1 | `src/add/add.test.ts` | 가변 인자 4 · 재귀 4 · 배치 5 · import 재작성 6(28개 전수 재작성 경로 실재 포함) · 덮어쓰기 5 · 경로 이탈 5(양성 대조 1 포함) · 의존성 안내 4 · 별칭 4 · list 2 · 원격 경로 2 |
| I2 | 실행 E2E(로컬 서버, 네트워크 훅) | E1 원격 정상: index · 항목 6건 fetch, 폴백 안내 없음. E2 접속 거부 · E3 404: 동봉본 설치, 안내 1번. E4 없는 이름: rc 1, 아무것도 안 씀. E5 list: 28개(원격). E6 `-y`: 다른 내용 건너뜀. E7 `--overwrite`: 덮어씀. E8 `run-progress --agentic` 과 E9 `agentic-run-progress` 결과 같음 |
| I3 | 28개 설치본 `tsc --noEmit` | 통과(ui-react node_modules 링크). AC1 의 린트 포함 next build 는 4절 G2 로 측정 |

## 4. G2 설치 후 빌드 (구현 4/4, FR-7 · AC1 · AC6)

스크립트: `scripts/registry-install-smoke.mjs`. 항목마다 기준 픽스처를 복사하고 `axis add <항목> -y` → cli 가 안내한 설치 명령만 실행 → 린트 포함 `next build` → `.next/server/app/index.html`(서버 page 프리렌더)에서 `data-g2-item` 래퍼 안 마크업 · 항목 문자열 확인. cli 실행에는 fetch 기록 훅을 걸고 index · 항목 200 기록과 폴백 안내 없음을 요구합니다.

| # | 조건 | 명령 | 결과 |
|---|---|---|---|
| G2-1 | 대표 5개, store 있음 | `node scripts/registry-install-smoke.mjs --port 5010 --keep` | 5/5 통과. 기준 빌드 11.8s, 항목 79.1s |
| G2-2 | 전수 28개 | `--items all --jobs 2 --port 5011` | **28/28 통과**, 항목 276.5s(jobs 2). 항목당 build 14 ~ 22s |
| G2-3 | 대표 5개, 빈 pnpm store · 캐시(냉) | `npm_config_store_dir` · `npm_config_cache_dir` 새 디렉터리 | 5/5, 전체 113s. 기준 픽스처 다운로드 330개(store 445MB), dialog 의존성 22개 · button · toast 3개 |
| G2-4 | CI 축: pnpm 9.15.4 · 냉 | pnpm 9.15.4 shim, 빈 store | 5/5, 전체 148s, 다운로드 336개. `.modules.yaml` 의 `packageManager: pnpm@9.15.4` 로 실제 버전 확인 |
| G2-5 | CI 축: Node 20.19.5 · pnpm 9.15.4 | PATH 앞에 node 20 · pnpm 9 | 5/5, 항목 63.9s |
| G2-6 | pnpm 스크립트 · 임시 포트 · 요약 | `GITHUB_STEP_SUMMARY=… pnpm registry-install-smoke` | 5/5, 요약 표 출력, 작업 디렉터리 정리 |
| N1 | 음성: 정규화 전 레지스트리 그대로 | `--registry-ref HEAD`(21c4639, 커밋 뒤에는 `HEAD~`) | 0/5, 5건 모두 add 단계 「원격 미사용(동봉본 폴백): index.json version 이 없습니다」. 폴백을 통과로 세지 않음을 확인 |
| N2 | 음성: 정규화 전 항목 내용을 실제 설치 | `--registry-ref HEAD --index-version 1.5.0-pre --items all --jobs 2` | **0/28**: build 21(ui 10 `../utils` Module not found, agentic `@axis-ds/ui-react` · `../constants/a11y-labels`) · add 7(`@axis/*` registryDependencies 가 레지스트리에 없음). PRD 「84/84 실패」(28 x 배치 3종)의 G2 판(배치 1종) |
| N3 | 음성: 린트 축 | G2-2 의 card 사례에서 `type CardProps` 를 빈 interface 로 되돌려 재빌드 | rc 1, `@typescript-eslint/no-empty-object-type`. 린트가 실제로 도는 것을 확인 |
| N4 | 음성: "use client" 경계 축 | G2-2 의 tool-call-card 사례에서 첫 줄 지시문 제거 후 재빌드 | rc 1, `Error occurred prerendering page "/"`, `c.useState is not a function` |
| P1 | 양성: 측정 계기 | 기준 앱(항목 설치 전) 빌드 · ndjson `fetched` 집계 | 모든 실행에서 기준 빌드 rc 0. 다운로드 수는 냉 330 · 온 0 으로 갈려 계측이 동작함 |

- AC1 판정: 28개 각각을 선언된 의존성 설치만으로 린트 포함 next build 통과, 서버 page 프리렌더 HTML 에 마크업 있음, "use client" 7개(code-block · context-panel · diff-viewer · feedback-buttons · source-panel · streaming-text · tool-call-card)는 설치본 첫 줄 지시문 확인 + N4 로 경계가 필요한 축임을 확인. 통과.
- 서버 page 는 함수 prop 없이 최소 props 로 렌더합니다(타입 검사 포함, `@ts-nocheck` 없음). toast 는 Radix 포털이라 `Toast` 본문이 프리렌더 HTML 에 없고 Viewport 마크업만 확인합니다.

## 5. G3 · G4 실행 파일 스모크 (구현 4/4, AC2 · AC3)

스크립트: `scripts/cli-bundled-smoke.mjs`(`pnpm cli-smoke`). 빌드한 `dist/index.js` 를 실제로 실행합니다. 세부 갈래는 2 · 3절 단위 테스트가 덮습니다.

| # | 조건 | 결과 |
|---|---|---|
| S1 | 현 dist | OK 19/19 항목, 1.4초. G3-a `AXIS_REGISTRY_URL=http://127.0.0.1:9`, G3-b 404 HTML 서버: 각각 rc 0 · 안내 1번 · 원격 요청 시도 기록(양성 대조) · button · utils · a11y-labels · tool-call-card 설치 · `@/registry/` 잔존 0 · 지시문 · 상대 import. G4-a `-y` 건너뜀 · `--overwrite` 복원. G4-b `componentsDir: ../outside` 거부 |
| S2 | 음성: 동봉본을 뺀 dist 사본 | FAIL 8건(G3 설치 실패 · G4-a 첫 설치 실패 · G4-b 거부 문구 없음) |
| S3 | 음성: 배포본 cli 1.4.0 | FAIL 10건(폴백 · 원격 요청 없음, `-y` 가 사용자 수정을 덮어씀, `--overwrite` 미지원) |
| S4 | CI 축 Node 20.19.5 · pnpm 9.15.4 | OK |

- 판정 보강: 처음에는 G4-b 를 rc 1 로만 봤는데 S2 · S3 에서도 rc 1(다른 이유)로 통과해 「프로젝트 디렉터리 밖」 문구까지 보게 고쳤습니다. 고친 뒤 S1 통과 · S2 · S3 실패.

## 6. 품질 게이트 (AC7, 4단계 재실행)

| # | 명령 | 결과 |
|---|---|---|
| Q1 | `pnpm exec turbo run type-check lint build test --force` (한 번에) | rc 2. `@ax/web#type-check` 가 `.next/types/.../page.ts` TS6053. 같은 실행에서 web build 가 `.next` 를 다시 만드는 동안 type-check 가 읽은 경합으로 봄(HEAD 대조 **미측정**) |
| Q2 | `turbo run lint --force` | rc 0, Tasks 4/4, Cached 0 |
| Q3 | `turbo run type-check --force` | rc 0, Tasks 8/8, Cached 0 |
| Q4 | `turbo run test --force` | rc 0, Tasks 6/6, Cached 0. cli 411 · ui-react 110 · agentic-ui 72 · mcp 43 · theme 31 |
| Q5 | `turbo run build --force` (apps/web 포함) | rc 0, Tasks 8/8, Cached 0. 부산물 `apps/web/public/templates/*.json` 은 되돌림 |
| Q6 | `pnpm pack-smoke` | rc 0, 퍼블리시 대상 6개 통과, pack-install-smoke · RSC 통과 |
| Q7 | `pnpm exec changeset status --verbose` | minor: `@axis-ds/cli` 1.5.0 하나 |
| Q8 | frontend.yml YAML 파싱 | ci job step 순서: … Pack smoke → CLI 실행 스모크 → 레지스트리 설치 후 빌드 → Read Playwright version … |

## 7. CI 배선 판단 (FR-7)

- PR(ci job)에 G2 대표 5개와 cli 스모크를 넣었습니다. 근거: 냉 store 기준 로컬 113 ~ 148초(CI 는 pnpm 캐시가 워크스페이스 lockfile 기준이라 픽스처 패키지는 대개 냉), cli 스모크 1.4초. 레지스트리는 사용자가 직접 받는 산출물인데 G1 은 import 닫힘만 보고 빌드 · 린트 · 경계는 보지 않아, 머지 전에 이 부류를 막는 검사가 G2 뿐입니다.
- 전수 28개는 jobs 2 로 약 5분이라 릴리스 전 `pnpm registry-install-smoke:all` 로 둡니다.

## 8. 미측정

- 새 CI step 두 개의 GitHub Actions 실제 실행(push 하지 않음). 첫 PR run 에서 시간 · 결과 확인 필요
- 한 번에 돌린 turbo(Q1) 실패의 원인 확정(HEAD 에서 같은 명령 대조)
- npm · yarn 픽스처(npm 호이스팅이 선언 누락을 가릴 수 있음), Windows 경로
- 픽스처 next/font(Google Fonts) 네트워크 비용(빌드마다 받음, 계측 안 함)
- `axis.minu.best` 실제 응답(이 호스트 403), 다른 망의 원격 경로
- tailwind-merge v2 · v3 의 Tailwind 4 전용 클래스 병합 차이
- npm 배포본 `@axis-ds/cli@1.5.0` 으로의 재측정(배포 전)
- ~~AC5(shadcn CLI 직접 설치)의 agentic 항목: 결정 전이라 미충족 상태~~ D5 반영 뒤 11절에서 대표 3개 통과(전수 28개는 **미측정**)

## 9. 검증 보정 (2026-10-21, 검증 라운드 1 지적 반영)

검증(설치 · 리뷰 · 폴백)의 지적을 먼저 재현하고 사실인 것만 고쳤습니다. 재현은 새 테스트를 고치기 전 코드에 먼저 돌려 실패를 본 것입니다(cli 14건 실패: 경로 9 · 주석 1 · 비대화 1 · 출처 섞임 1 · sha256 우회 1 · 알림 문구 1).

| # | 지적 | 조치 | 판정 근거 |
|---|---|---|---|
| V1 | `files[].path` 의 `../` · 절대 경로 · 역슬래시 · `target` 이탈을 basename 으로 평탄화해 rc 0, `package.json` · 확장자 없는 파일도 설치(AC3 「거부」와 다름) | `placeFile` 이 path · target 을 검사하고 파일 이름을 .ts · .tsx 로 제한, 위반이면 rc 1 · 아무것도 쓰지 않음 | 단위 9건(it.each 8 + target 1) 수정 전 실패 · 수정 후 통과, 양성 대조(정상 하위 경로 .ts · .tsx) 통과. 실행 파일(127.0.0.1:5081 악성 레지스트리, sha 맞춤): button `../../../../` · card 절대 경로 · input `package.json` · badge target 모두 rc 1, 프로젝트 안팎 생성 파일 0. 같은 서버의 정상 dialog 는 rc 0 |
| V2 | TTY 없이(stdin 닫힘) 충돌이 있으면 prompts 가 응답 없이 끝나 요약 없이 rc 0, 다른 신규 파일도 안 씀 | stdin 이 TTY 가 아니면 확인을 띄우지 않고 `-y` 처럼 건너뜀(`createConfirm`) | 단위 1건(수정 전 5초 타임아웃 실패). 실행 파일 `add button dialog </dev/null`: rc 0, dialog 설치, button 건너뜀 안내, 사용자 수정 유지. 대조: `script` 로 TTY 를 주면 확인이 뜨고 y 로 덮어씀 |
| V3 | 앞 항목은 원격, 뒤 항목에서 원격 실패 시 두 출처가 한 add 에 섞임 | `collectItems` 가 수집 중 출처가 동봉본으로 바뀌면 처음부터 다시 수집 | 단위 1건(원격 card 를 실제로 받았음을 요청 기록으로 확인). 실행 파일(5082, button 404): rc 0, card 에 원격 표식 0, 폴백 안내 1번, 접근 로그 index · card · utils · button |
| V4 | index 에 sha256 이 있어도 files 2개면 대조를 건너뜀 | files 가 1개가 아니면 검증 실패(폴백 사유) | registry 단위 1건 수정 전 실패 · 수정 후 통과 |
| V5 | 주석 안 `@/registry/...` 때문에 rc 1(build 쪽 AST 판정과 어긋남) | 재작성 · 미해석 판정에서 주석 구간 제외(문자열 · 템플릿 안 `//` 는 주석 아님) | 단위 3건(음성 대조: 주석 밖 같은 import 는 여전히 거부) |
| V6 | 쓰기 직전 재검사 · 부모 재검사 · 사후 import 검사가 테스트로 고정되지 않음(변이 M3 · M4 · M14 생존), 검사와 쓰기 사이 링크 교체 · 쓰기 예외 미처리 | O_NOFOLLOW 로 쓰고 쓰기 예외를 rc 1 과 이미 쓴 목록으로 알림. 테스트 4건 추가 | 변이 시험(수정 후 코드): M3 · M4 · M14 · 재수집 제거 · 주석 제외 제거 · O_NOFOLLOW 제거 6종 모두 1건씩 실패로 잡힘 |
| V7 | G1 이 타입 위치 import(`typeof import("zod")`, `import("@axis-ds/ui-react").T`)를 놓침 | `scanImports` 에 ImportTypeNode 추가 | 음성 2건 · 스캔 1건 추가. 갈래 제거 변이로 3건 실패 |
| V8 | `"use client"` 판정이 content 맨 앞 정규식이라 앞 주석이 있으면 놓침 | TS AST 지시문 prologue 로 판정(`hasUseClientDirective`) | 단위 1건(주석 뒤 · use strict 뒤 · 지시문 아닌 위치). build:registry 재생성본 32파일 sha256 이 수정 전과 같음 |
| V9 | `registry-integrity.test.mjs` 가 CI 어디에도 없음 | 루트 `pnpm test:registry`, frontend.yml ci job Build Registry 다음 step | `pnpm test:registry` rc 0, 15/15 |
| V10 | publish.yml 이 build:registry 를 돌리지 않아 동봉본이 커밋본(낡을 수 있음)을 실음 | publish.yml Build 앞에 Build Registry step | YAML 파싱으로 순서 확인(Type check → Build Registry → Build). GitHub Actions 실제 실행은 **미측정** |
| V11 | version 차이 알림이 「원격을 사용합니다」인데 뒤에서 폴백할 수 있음 | 「원격 레지스트리를 우선 사용합니다」 | registry 단위 문구 대조 |

재실행 결과(같은 작업 트리):

| # | 명령 | 결과 |
|---|---|---|
| V-Q1 | `turbo run type-check --force` · `lint --force` · `build --force` · `test --force`(따로) | 각각 rc 0. Tasks 8/8 · 4/4 · 8/8 · 6/6, Cached 0. cli 테스트 430(종전 411). 부산물 templates 는 되돌림 |
| V-Q2 | `pnpm build:registry` | rc 0, G1 통과, 32파일 sha256 이 수정 전과 같음 |
| V-Q3 | `pnpm test:registry` | rc 0, 15/15(종전 11) |
| V-Q4 | `pnpm cli-smoke` | OK |
| V-Q5 | `node scripts/registry-install-smoke.mjs --items all --jobs 2 --port 5085` | **28/28 통과**(항목 248.7s) |
| V-Q6 | `pnpm pack-smoke` | rc 0, 퍼블리시 대상 6개 통과 |

고치지 않은 지적(결정 필요): AC5 shadcn 직접 설치(접두 없는 registryDependencies, FR-1 과 AC5 충돌), FR-2 문구(소스 대 레지스트리 사본), 커밋본 대 재생성본 drift 게이트.

## 10. 검증 보정 2 (2026-10-21, 검증 라운드 2 지적 반영)

major 2건(AC5 shadcn 직접 설치)은 재현만 하고 고치지 않았습니다. 현 `apps/web/public/r` 사본을 127.0.0.1:5080 으로 띄우고 shadcn@4.21.4 로 `add agentic-tool-call-card.json --dry-run` 을 실행하면 rc 1 이고, 네트워크 훅에 `ui.shadcn.com/r/styles/new-york-v4/agentic-a11y-labels.json` 과 `ui.shadcn.com/r/styles/new-york/utils.json` 요청이 기록됩니다(로컬 서버에는 항목 요청뿐). FR-1(접두 없는 이름)과 AC5 가 충돌하므로 형식 결정이 필요합니다. minor 는 아래만 고쳤습니다.

| # | 지적 | 조치 | 판정 근거 |
|---|---|---|---|
| W1 | CLI import 재작성이 문자열 리터럴 안의 `from "@/registry/..."` 도 import 로 보고, 템플릿 안 템플릿에서 주석 판정이 어긋남 | `nonCodeRanges` 상태 기계(주석 · 문자열 · 템플릿 글자, `${}` 중첩 추적)로 앞부분이 코드가 아닌 일치를 건너뜀. 머리 주석을 실제 기준으로 고침 | 단위 2건(문자열 · 템플릿 4형태 무시, 음성 대조: `${}` 안 동적 import 는 판정). 변이: 문자열 제외 제거 · `${}` 안을 문자열로 처리 각 1건 실패 |
| W2 | `planFiles` 같은 위치 거부가 테스트로 고정되지 않음(변이 M18 생존) | 같은 basename 의 ui · lib 픽스처 테스트 | 변이 `if (false)` 로 1건 실패, 수정본 통과 |
| W3 | Windows 경로 축 미검증, 역슬래시 componentsDir 이면 agentic 이 루트로 | `toPosix` · `relativeSpecifier` 가 path 구현을 받음(path.win32 테스트), config 의 `componentsDir` · `agenticDir` 역슬래시를 `/` 로 | 단위 2건(win32 변환 + posix 대조, 역슬래시 config + POSIX 대조). 변이: 정규화 제거 · impl 무시 각 1건 실패 |
| W4 | `dependencies` 문자열을 검증하지 않아 원격 값이 설치 안내 셸 명령에 그대로 들어감 | `DEPENDENCY_SPEC_PATTERN`(패키지 이름 + 선택적 `@범위`, 셸 메타 문자 불가). 위반이면 항목 검증 실패라 포함본 폴백 | registry 단위 6건(음성 5: 세미콜론 · `&&` · `$()` · 백틱 · 따옴표, 양성 1: 범위 붙은 정상 값은 원격 사용). 변이로 5건 실패. 실제 레지스트리 30항목 검증 통과 |
| W5 | G1 검사 6갈래가 테스트로 고정되지 않음(I2 · I3 · I4 · I6 · I7 · I9 생존) | 음성 테스트 추가: 동적 import · `export *` · `export {}` · `export type {}` 재내보내기 · registry.json 불일치 · 낡은 zzz.json · version 없음 · 쓰지 않는 registryDependencies, 주석 · 문자열 스캔 대조 | 변이 8종(I2 · I3 · I4 · I6 · I7 · I9 + W6 의 2종) 모두 1건 이상 실패. version 테스트는 처음에 registry.json 불일치 문구에 걸려 I4 가 살아남아, 판정을 `index.json version` 으로 좁히고 registry.json 도 맞춘 뒤 잡힘 |
| W6 | G1 `scanImports` 가 `require("x")` 와 `/// <reference>` 를 보지 않음 | require 호출(식별자 require, 문자열 인자 1개)을 의존으로 스캔, reference types · path 지시문은 위반으로 거부(`referenceDirectives`) | 음성 3건. 지시문은 파일 맨 앞에서만 지시문이라 처음 끝에 붙인 테스트는 실패(측정 설계 오류)였고 앞에 붙이도록 고침. 변이: require 갈래 제거 1건 · 지시문 거부 제거 2건 실패 |

재실행 결과(같은 작업 트리):

| # | 명령 | 결과 |
|---|---|---|
| W-Q1 | `turbo run type-check lint test build --filter=@axis-ds/cli --force` | rc 0, Tasks 2/2(cli 에 정의된 test · build), Cached 0, cli 테스트 441(종전 430) |
| W-Q2 | `tsc --noEmit -p packages/axis-cli` | rc 2, 오류 23건. 수정 전 사본(verify-review-r1)도 같은 23건(add.ts writeFile `flag` 숫자 1 · library 테스트 등 22)이라 이번 변경으로 늘지 않음. cli 에 type-check 스크립트가 없어 게이트에는 걸리지 않음 |
| W-Q3 | `pnpm build:registry` | rc 0, G1 통과(새 검사 포함), 32파일 sha256 이 수정 전과 같음 |
| W-Q4 | `pnpm test:registry` | rc 0, 27/27(종전 15) |
| W-Q5 | `pnpm cli-smoke` | OK |

고치지 않은 지적(결정 필요): AC5 registryDependencies 형식(major 2건), `--overwrite` 로 덮어쓴 파일 표시, index.json contentHash, 쓰기 경합(TOCTOU, release-notes 알려진 한계).

## 11. 결정 D5 · D6 · D7 과 minor M1 ~ M6 반영 (2026-10-21)

환경: 위와 같은 호스트, Node 22.22.0 · pnpm 10.33.0. 임시 파일은 세션 scratch(`wi0045-impl/`)에만 두었습니다. `apps/web/public/templates` 변경 0건.

| # | 내용 | 명령 · 방법 | 결과 |
|---|---|---|---|
| X1 | build:registry(D5 URL 형태 · D6 주석) | `pnpm build:registry` | rc 0, G1 통과, 32파일. registryDependencies 39건이 모두 `https://axis-design-system.pages.dev/r/<이름>.json`. 다시 돌린 결과와 32파일 sha256 같음. separator 사본 주석 「Props 타입」, card · separator 는 `export type` |
| X2 | G1 단위 | `pnpm test:registry` | rc 0, 39/39(종전 27). D5 음성 8건(접두 없는 이름 · 다른 호스트 · 다른 확장자 · 상대 경로 · @ns · slug 위반 · 하위 경로 · 없는 이름), 공개 URL 바꿈 1, URL 결정 1, 생성본 형태 전수 1, D6 1 |
| X3 | 변이 (1) G1 URL 형태 검사 끔 | `registryDependencyName` 대신 basename 을 그대로 이름으로, 형태 오류 분기 끔 | test:registry rc 1, 8건 실패(D5 음성 7 + 공개 URL 바꿈 1). 원복 후 `diff -q` 일치, 39/39 |
| X4 | cli 단위(D5 · D7 · M1 · M2 · M3) | `vitest run src/registry src/add src/init` | registry 55 · add 67 · init 91 통과 |
| X5 | 변이 (2) CLI URL basename 해석 끔 | `registryDependencyName` 의 URL 갈래를 `return null` 로 | cli 테스트 37건 실패(동봉본 원본 URL 의존 항목 전부 검증 실패). 원복 `diff` 일치 |
| X6 | 변이 (3) D7 되돌림 | `registerInitCommand` 기본값을 `process.env.AXIS_REGISTRY_URL` 우선으로 | init 테스트 2건 실패(env 를 준 init · 빈 registry). 원복 `diff` 일치 |
| X7 | 변이 M1 · M2 · M3 | 링크 거부 분기 · 사후 검사 분기 · index 이름 중복 검사를 각각 `false &&` | M1 1건 · M2 1건 · M3 2건 실패. 원복 `diff` 일치 |
| X8 | turbo cli | `pnpm exec turbo run type-check lint test build --filter=@axis-ds/cli --force` | **rc 1** 두 번. build 통과, test 는 `src/library/index.test.ts` collectAll 2건이 5초 타임아웃(1차 1건 · 2차 2건), 나머지 461 통과. 이 테스트는 ui.shadcn.com 등 실제 원격을 받는데(같은 시각 `curl https://ui.shadcn.com/r/index.json` 4.3초), library 코드 · 테스트는 이번 변경에 없음. 단독 실행에서도 4건 실패로 재현되어 네트워크 지연에 따른 기존 결함으로 분류(open issue). cli 에는 type-check · lint 스크립트가 없어 Tasks 는 build · test 2개 |
| X9 | M5 tsup clean | 빌드 전 `dist/stale-marker-chunk.js` 를 만들고 turbo build | 빌드 뒤 표식과 낡은 파일 5개(chunk 4 · registry-client 1)가 사라지고 `dist/registry` 32파일(copy-registry 가 clean 뒤 실행) |
| X10 | `tsc --noEmit -p packages/axis-cli` | | 오류 21건(10절 W-Q2 의 23건 이하). 처음 낸 schema.ts 타입 좁힘 오류 2건은 고침 |
| X11 | cli-smoke | `pnpm cli-smoke` | OK. D7 2건(env 를 준 init 뒤 config.registry 기본값) 포함, 동봉본의 URL 의존으로 utils · a11y-labels 설치 |
| X12 | G2 대표 5개(URL 형태 레지스트리) | `node scripts/registry-install-smoke.mjs --work <scratch>` | rc 0, 5/5, 항목 107.8s |
| X13 | M4 pack-smoke | `node scripts/pack-smoke.mjs` | rc 0, 6개 통과. 음성 대조: 필수 경로를 없는 파일로 바꾼 사본에서 rc 1(`@axis-ds/cli 필수 배포 파일 미존재`), 원복 `diff` 일치 |
| X14 | AC5 shadcn 직접 설치 | `pnpm registry-shadcn-smoke --work <scratch> --keep` | **rc 0**. shadcn add rc 0(37.6s), ui.shadcn.com 요청 0건, 로컬 서버가 utils.json · agentic-a11y-labels.json 을 받음(URL 의존 양성 대조), `src/lib/utils.ts` = AXIS utils, npm `cn` 미추가, 린트 포함 next build rc 0(「Linting and checking validity of types」 확인). 양성 대조: 같은 훅으로 `shadcn view button` 이 ui.shadcn.com 3줄 기록 |
| X15 | AC5 음성 대조(D5 이전 형태) | 사본의 registryDependencies 를 접두 없는 이름으로 바꿔 로컬 서버 → `shadcn add … --dry-run` | rc 1, `ui.shadcn.com/r/styles/new-york{,-v4}/utils.json` · `agentic-a11y-labels.json` 요청 4건 기록 |
| X16 | AC5 전제 확인(baseColor) | 첫 실행은 components.json `baseColor: "neutral"` | shadcn 이 `ui.shadcn.com/r/colors/neutral.json` 1건을 받아 0건 판정 실패. 항목과 무관한 소비자 설정 요청이라 스모크는 baseColor 빈 값 전제로 0건을 보고, neutral 로 `add --dry-run` 해 colors 외 요청 0건을 따로 판정(X14 실행에서 colors 1건 · 그 외 0건) |

- 로컬 서버: 스모크의 서버는 스크립트 프로세스 안의 http 서버라 끝날 때 닫힙니다. 수동 probe 서버(포트 38809 · 38810)는 띄운 PID 로 종료했고 종료 뒤 두 포트 리스닝 0건(`ss -ltn`).
- AC5 CI 배선 판단: 한 번 실행에 create-next-app 23 ~ 77초 · 픽스처 install 111초 · 기준 빌드 20초 · add 38초 · 빌드 18초로 약 4분이고, 양성 대조가 ui.shadcn.com 접속에 기대어 외부 상태에 따라 rc 2 가 날 수 있습니다. PR CI 에는 이미 G2(같은 픽스처 비용)가 있어 넣지 않고, 릴리스 전 전수 명령에 둡니다.

릴리스 전 전수 명령(이 WI):

```bash
pnpm build:registry && pnpm test:registry
pnpm exec turbo run type-check lint test build --force
pnpm cli-smoke
pnpm registry-install-smoke:all     # G2 전수 28개
pnpm registry-shadcn-smoke          # AC5 shadcn 직접 설치(대표 3개)
pnpm pack-smoke
```

## 12. 검증 지적 보정 (2026-10-21)

환경: 11절과 같은 호스트. 임시 파일은 세션 scratch(`wi0045-impl/`)에만 두었습니다.

| # | 지적 | 고친 내용 | 확인 |
|---|---|---|---|
| Y1 | M2 사후 검사가 자기가 쓴 파일인지 보지 않고 realpath 가 가리키는 바깥 파일을 지움(쓴 뒤 상위가 바깥 링크로 바뀌면 사용자 파일 삭제) | 쓰기를 `fs.open(O_NOFOLLOW)` fd 로 하고 `fstat(fd)` 의 dev · ino 를 기억. 사후 검사에서 바깥 위치가 같은 dev · ino 일 때만 지우고, 다르면 지우지 않고 rc 1 · 직접 확인 안내(`isSameFile`) | add 단위 68 통과(신규 1: 쓴 뒤 교체 → 바깥 파일 보존 · 우리가 쓴 파일 유지). 기존 경합 테스트 2건은 쓰기 경로가 `fs.open` 으로 바뀌어 그 지점에 경합을 넣도록 옮김(기존 M2 「밖에 쓴 자기 파일은 지움」 그대로 통과). 변이: 신원 대조를 `false &&` 로 끄면 신규 1건 실패, 원복 sha256 일치 |
| Y2 | `build-registry --out <디렉터리>` 가 그 디렉터리의 *.json 을 모두 지움(앱 디렉터리를 주면 package.json · tsconfig.json 삭제 후 rc 0) | `staleRegistryFiles`: 배포 위치(`apps/web/public/r`)만 종전대로 *.json 전부. `--out` 은 없거나 빈 디렉터리, 또는 index.json 이 있는 레지스트리 디렉터리만 받고 지우는 것은 index.json · registry.json · 기존 index 항목 파일뿐. 그 밖은 rc 1 | 실경로: package.json · tsconfig.json 이 있는 디렉터리 → rc 1, 두 파일 보존. 새 디렉터리 rc 0(32파일) · 같은 곳 재빌드 rc 0. 배포 위치 재빌드 rc 0, 32파일 내용 sha256 불변. 단위 3건 추가(test:registry 42/42). 변이: owned 분기를 무시(종전 동작)하면 2건 실패, 원복 sha256 일치 |
| Y3 | D7 단위 테스트가 실제 진입점(src/index.ts)을 거치지 않음 | init.test.ts 에 「진입점 등록」 검사(src/index.ts 의 `registerInitCommand(...)` 호출이 1건이고 인자가 `program` 뿐) 추가. 빌드한 dist 를 실행하는 `pnpm cli-smoke`(CI) D7 단계가 같은 회귀를 잡는다는 것도 실측 | 변이: src/index.ts 가 `process.env.AXIS_REGISTRY_URL` 을 넘기게 바꾸면 vitest 신규 1건 실패, 그 변이로 빌드한 dist 의 cli-smoke rc 1(D7 2건 실패). 원복 sha256 일치, 재빌드 cli-smoke OK |
| Y4 | `registry-integrity.test.mjs` 가 실행마다 os.tmpdir() 에 axis-reg-* 를 쌓음 | 만든 디렉터리를 모아 모듈 수준 `after` 에서 지움 | `TMPDIR=<scratch>` 로 실행: 수정본 남은 axis-reg 0개, 정리 훅을 끈 변이 29개(양성 대조: 테스트가 실제로 만들고 있음). 이 항목은 테스트 판정이 아니라 개수 측정으로 확인 |
| Y5 | 음성 대조(N1 · N2)의 정의 | 고치지 않음(기록 정정). HEAD(21c4639) 레지스트리는 「접두 없는 이름」만 쓰는 것이 아니라 대부분 `@axis/<이름>` 네임스페이스이고, 접두 없는 이름은 dialog → `button` 1건뿐이며 utils.json · agentic-a11y-labels.json 이 없습니다. N2 의 add 7건 실패는 `@axis/*` 갈래, X15 는 사본을 접두 없는 이름으로 바꾼 별도 음성입니다 | 검증 측 재현: HEAD 15개 shadcn add rc 1(`Unknown registry "@axis"`), dialog+card 는 rc 0 이지만 ui.shadcn.com 의 button 을 받아 설치 |

- AC5 「ui.shadcn.com 요청 0건」의 init 흐름 문제(shadcn init 이 기록하는 baseColor=neutral 로 colors 1건)와 init 뒤 utils 덮어쓰기 질문(`--overwrite` 없이 `--yes` 면 rc 0 인데 컴포넌트 0개)은 판정 정의를 바꾸는 사안이라 고치지 않고 결정 대기로 넘겼습니다. 현재 스모크 5단계의 neutral `add --dry-run` 은 colors 외 요청 0건을 보는 참고 측정입니다.
- `--overwrite` 없이 `--yes` 만 준 shadcn add 는 rc 0 이어도 설치 0개일 수 있어, AC5 판정은 rc 만이 아니라 설치 파일 존재까지 봅니다(현 스모크는 항목별 설치 파일 존재 · 설치본 utils 내용 · 빌드로 판정, 단 init 을 거치지 않은 components.json 전제).
- Y2 뒤 AC5 재실행: `node scripts/registry-shadcn-smoke.mjs --work <scratch>` rc 0(`build-registry --out` 새 디렉터리 경로, 16개 판정 모두 통과, neutral dry-run colors 외 0건). 스크립트 안 서버는 끝날 때 닫혀 그 포트 리스닝 0건(`ss -ltn`).
- 보정 뒤 전수: `pnpm build:registry` rc 0(배포본 32파일 sha256 불변) · `pnpm test:registry` 42/42 · cli vitest 465/465(14파일) · `tsc --noEmit -p packages/axis-cli` 오류 20건(11절 21건 이하, 변경 파일 0건) · `pnpm cli-smoke` OK.

## 13. 검증 지적 보정 2 (2026-10-21)

| # | 지적 | 조치 | 결과 |
|---|---|---|---|
| Z1 | README M2 서술이 「밖이면 지운다」로 읽힘(실제는 dev · ino 일치일 때만 지움) | README · release-notes 문구를 동작에 맞춤(코드 변경 없음) | 문서만 변경. 동작은 add.test.ts 「사후 검사(M2)는 자기가 쓴 파일만 지움」이 고정(검증 측 변이: isSameFile 분기 제거 시 1건 실패) |
| Z2 | shadcn init 이 npm `cn` 을 더하는 사실이 문서에 없음 | release-notes 알려진 한계에 추가 | 「add 가 cn 을 더하지 않음」 판정(X14)은 init 을 거치지 않은 전제에서의 add 전후 비교로 유지. init 경로 최종 package.json 에는 init 이 넣은 `cn` 이 남음(검증 측 실측) |
| Z3 | init 기본 경로(base-nova)에서 select build 실패 · 원격 형식 위반의 폴백 · 링크 대상 거부 · URL 호스트 무시 | 고치지 않음(결정 대기). release-notes 알려진 한계에 현행 동작으로 기록 | 판정 정의 · D5 범위를 바꾸는 사안 |

- AC5 스모크(X14)는 shadcn init 을 실행하지 않고 components.json 을 직접 씁니다. 그래서 init 기본 경로(base-nova)의 select 변환 실패, init 이 기록하는 baseColor 로 생기는 colors 1건, init 이 더하는 `cn` 은 이 스모크로 측정되지 않습니다(**미측정** 축).

## 14. 결정 D8 ~ D12 와 minor m1 ~ m5 반영 (2026-10-22)

환경: 11절과 같은 호스트, Node 22.22.0. 임시 파일 · 로그 · 픽스처는 세션 scratch(`wi0045-impl/r4/`)에만 두었습니다. `apps/web/public/templates` 변경 0건, `apps/web/public/r` sha256 30파일 불변(build:registry 전후 대조).

| # | 항목 | 명령 · 방법 | 결과 |
|---|---|---|---|
| V1 | 레지스트리 빌드 · G1 | `pnpm build:registry` | rc 0, 30개 항목, G1 통과 |
| V2 | G1 단위 | `pnpm test:registry` | rc 0, 42/42 |
| V3 | cli 품질 게이트 | `pnpm exec turbo run type-check lint test build --filter=@axis-ds/cli --force`(timeout 900) | rc 0, Cached 0. cli 에는 type-check · lint 스크립트가 없어 turbo 가 실행한 task 는 test · build 2개(미측정 축: cli type-check · lint). vitest 506/506(registry 73 · add 86 · init 96 · library index 19 등 14파일). 종전 X8 의 collectAll 타임아웃 실패는 D10 으로 없어짐 |
| V4 | 실행 파일 스모크 | `pnpm cli-smoke` | rc 0, 21개 판정 통과. D7 기대값이 새 기본값(`https://axis-design-system.pages.dev/r`) |
| V5 | AC5 shadcn 직접 설치(D9) | `pnpm registry-shadcn-smoke --work <scratch> --keep` | 1차 측정 실패 rc 2: `init -b radix --yes --no-monorepo` 만으로는 프리셋 선택 프롬프트가 남음(stdin 닫혀 멈추지 않고 rc 0 으로 끝나 components.json 없음 → 측정 실패로 잡힘). `-p nova` 를 더해 2차 **rc 0**: init rc 0(radix-nova, baseColor neutral, init 의 ui.shadcn.com 요청 11건 = 양성 대조, init 이 cn 추가 · utils.ts 생성), add `--overwrite --yes` rc 0(3.3s), add 동안 ui.shadcn.com 요청 `/r/colors/neutral.json` 1건 · 그 밖 0건, 로컬 서버가 utils · agentic-a11y-labels 를 받음, `src/lib/utils.ts` 가 AXIS utils, 설치 파일 4개 생성 · npm `cn` import 0건, add 단계 cn 추가 없음(init 뒤 있음 → 그대로), 서버 page 린트 포함 next build rc 0 · 프리렌더 html 에 항목 출력 |
| V6 | D8 실제 원격 | `curl` 로 `axis.minu.best/r/index.json` · `axis-design-system.pages.dev/r/index.json` | 403 · 200(07:50 KST). 빌드한 cli 를 env 없이 실행: init 이 config 에 pages.dev 기록, add 는 배포된 구 index.json 에 version 이 없어 「형식 검증을 통과하지 못해」 안내 1번 뒤 포함본으로 설치(m1 문구 실측), 두 번째 init 은 「유지(이미 같은 내용)」(m5) |
| V7 | D10 네트워크 차단 | `NODE_USE_ENV_PROXY=1 HTTP(S)_PROXY=http://127.0.0.1:9` 로 `vitest run src/library/index.test.ts` | 19/19. 양성 대조: 같은 env 에서 `fetch("https://ui.shadcn.com/r/index.json")` 는 ECONNREFUSED(차단이 실제로 걸림) |

변이 확인(파일을 scratch 에 복사한 뒤 변이, 테스트, 복사본으로 원복하고 `diff -q` 로 일치 확인. 4건 모두 원복 일치):

| 변이 | 내용 | 결과 |
|---|---|---|
| D10 | `vi.stubGlobal("fetch", mockFetch)` 제거 + 깨진 프록시 | library 1건 실패(19 중, 「fetch mock 이 실제 원격 대신 응답한다」) |
| D11 | 의존 URL 의 base 접두 검사를 끄고 basename 만 사용 | registry 10건 실패(73 중) |
| D12 | 링크 거부 조건을 「써야 하는 링크」에서 「모든 링크」로(unchanged 건너뜀 끔) | add 2건 실패(86 중, 같은 내용 링크 · `-y` 건너뜀 링크) |
| m4 | `isSameOrInside` 를 종전 `!rel.startsWith("..")` 판정으로 | add 5건 실패(86 중, `..ui` posix 3 · win32 1 · 설치 1) |

- 범위 밖으로 남긴 `axis.minu.best` 참조(목록만, D8. D14 로 WI-0056 으로 이관): 루트 `components.json` 의 `@axis` 레지스트리 별칭(`https://axis.minu.best/r/{name}.json`), cli `src/template/registry-client.ts` · mcp `src/tools/template.ts` 의 `https://axis.minu.best/templates`(템플릿, 403 폴백은 PRD 범위 밖), `$schema`(cli `src/config/axis-config.ts` `AXIS_CONFIG_SCHEMA_URL` = `axis.minu.best/schema.json`) · 문서 링크(cli `src/add/add.ts` 의 config 없음 안내 `axis.minu.best/docs/guides/quick-start`, 이 호스트 403 · README 끝 링크) · cli `src/library/axis-collector.ts` 의 `baseUrl` · `apps/web/public/r/index.json` 과 동봉 `registry.json` 의 `homepage`. 빌드한 cli dist 에도 이 문자열이 남습니다(레지스트리 기본 주소는 pages.dev). mcp 에는 `axis.minu.best/r` 참조가 없습니다.
- `scripts/registry-integrity.test.mjs` 의 「다른 호스트」 음성 사례(`axis.minu.best/r/utils.json`)는 거부되어야 하는 입력이라 그대로 둡니다.
- 미측정: shadcn 직접 설치 전수 28개(대표 4개만), Windows 에서의 m4 실제 설치(win32 판정은 `path.win32` 단위만), 다른 망에서의 pages.dev 응답.

## 15. 검증 지적 보정 3 (2026-10-22)

임시 파일 · 로그 · 픽스처는 세션 scratch(`wi0045-impl/r4/r5/`)에만 두었습니다. `apps/web/public/templates` 변경 0건.

| # | 지적 | 조치 | 결과 |
|---|---|---|---|
| W1 | 스모크 `--work <기존 디렉터리>` 가 실패 정리 때 그 디렉터리를 통째로 지움(major) | `registry-shadcn-smoke.mjs` · `registry-install-smoke.mjs` 모두 `--work` 를 상위 디렉터리로 보고 그 아래 `mkdtemp` 하위만 만들고 지움 | 수정 후: sentinel 파일이 든 디렉터리로 실패 경로(rc 2) 실행 → 두 스크립트 모두 sentinel 남음. 변이(work = 사용자 경로로 되돌림): 두 스크립트 모두 디렉터리가 사라짐(재현). 원복 sha 일치 |
| W2 | 대상이 디렉터리를 가리키는 링크 · 읽을 수 없는 파일이면 스택 트레이스로 끝남 | `escapeReason` 이 링크를 따라가 디렉터리면 이유를 돌려줌, 덮어쓰기 판정 전에 기존 파일을 모두 읽고 실패를 모아 rc 1(묻기 전, 아무것도 쓰지 않음) | 테스트 2건 추가(통과). 변이 2건(디렉터리 검사 끔 · readFileSync try 제거) 각각 1건 실패. 빌드한 dist 로 `add badge -y` 재현: rc 1, 「같은 이름의 링크가 디렉터리(...)를 가리킵니다」, 스택 없음 |
| W3 | init 재실행 때 `agenticDir` 가 사라짐 | 기존 `agenticDir` 를 지킴(키 순서 componentsDir 다음), 갱신 문구에 「agenticDir 는 기존 값 유지」, init 이 쓰지 않는 다른 키는 「기존 설정에서 빠진 키」로 알림 | 테스트 3건 추가(음성 대조 포함, 통과). 변이 2건(agenticDir 보존 끔 · 빠진 키 안내 끔) 각각 1건 실패 |
| W4 | Quick Start · release-notes 의 `init -b radix` 에 `-p` 가 없어 비대화에서 rc 0 으로 아무것도 안 함 | 문서 · PRD AC5 경로를 스모크와 같은 `init -b radix -p nova`(비대화는 `--yes --no-monorepo`)로 맞추고, 프롬프트 · rc 0 무동작 사실과 확인 버전(4.21.4 · 4.22.1)을 적음 | 문서만. 근거는 검증 로그 `r4/v/init-doc.log` · `init-A.log` · `add-noinit.log` |
| W5 | README 예시 「공용 utils.ts 에 링크해 둔 모노레포」가 밖을 가리키는 링크로 읽힘 | README · release-notes · changeset 에 「밖을 가리키는 링크는 내용이 같아도 거부」를 적고 예시를 「앱 디렉터리 안」으로 좁힘(동작은 그대로, 결정 대기) | 문서만. 이후 D15 로 해소(17절) |

게이트 재실행:

- `pnpm exec turbo run type-check lint test build --filter=@axis-ds/cli --force`(timeout 900): rc 0, Cached 0, 14 파일 511 테스트 통과. cli 에는 type-check · lint 스크립트가 없어 test · build 2개만 돕니다.
- 참고: `npx tsc --noEmit -p packages/axis-cli/tsconfig.json` 은 rc 2(20건). 오류 위치는 `library/index.test.ts`(이번 diff 밖 줄 173~282) · `library/publisher*.ts` · `template/template-apply.ts`(이번 WI 미변경)뿐이고, 이번에 고친 add · init · config 파일에는 0건입니다.
- `pnpm cli-smoke` rc 0, `pnpm test:registry` rc 0(42/42).

## 16. 검증 지적 보정 4 (2026-10-22)

임시 파일 · 로그 · 픽스처는 세션 scratch(`wi0045-impl/r4/r6/`)에만 두었습니다. `apps/web/public/templates` 변경 0건.

| # | 지적 | 조치 | 결과 |
|---|---|---|---|
| U1 | G1 `normalizePublicUrl` 은 userinfo URL 을 받는데 CLI(D11)는 거부해, G1 통과 레지스트리가 CLI 에서 형식 검증 실패로 폴백 | `normalizePublicUrl` 이 공백 · userinfo · `?` · `#` 를 거부(CLI `registryDependencyName` 과 같은 기준). 단위 음성 5건 · 양성 1건(포트 · 하위 경로) | `pnpm test:registry` 42/42. 변이: userinfo 검사 끔 → 1건 실패, 공백 검사 끔 → 1건 실패. 원복 뒤 42/42 |
| U2 | `copy-registry` 가 동봉본의 D11 기준(공개 기본 base)을 보지 않아, 다른 `AXIS_REGISTRY_PUBLIC_URL` 로 만든 레지스트리가 rc 0 으로 배포될 수 있음 | 항목마다 `registryDependencies` 가 접두 없는 slug 이거나 `https://axis-design-system.pages.dev/r/<slug>.json` 인지 보고 아니면 rc 1. 테스트용 원본 · 대상 인자 추가. `src/registry/copy-registry.test.ts`(7건: 상수 일치 · 양성 · 음성 4 · 인자 1개 rc 2) | 검증 재현본(`mirror.example/r` 로 빌드한 레지스트리) → rc 1, 배포본 `apps/web/public/r` → rc 0(32파일). 변이: 의존 검사 끔 → 4건 실패. 원복 뒤 7/7 |
| U3 | AC5 「add 단계에서 cn 새로 추가 없음」 판정이 init 이 cn 을 넣은 경우 항상 참 | 판정을 add 동안의 패키지 메타데이터 요청 중 `cn` 0건으로 바꾸고, 양성 대조로 add 가 새로 넣은 패키지의 요청 기록을 요구(없으면 rc 2). 레지스트리 항목 dependencies 의 `cn` 선언 0건도 함께 판정. package.json 비교는 기록만 | 재실행 rc 0: add 동안 cn 요청 0건, 새 패키지 요청 5/5 기록, cn 선언 0/30. 판정식 대조: 같은 로그에 `https.request https://registry.npmjs.org/cn` 한 줄을 넣으면 FAIL, init 단계 로그(init 이 cn 설치)는 cn 요청 1건으로 FAIL(훅이 cn 요청을 실제로 잡는 양성 대조) |
| U4 | AC5 머리 주석이 init 이 button.tsx 를 만든다고 적음(실제 radix · nova init 은 안 만듦, 검사가 출력 없이 건너뜀) | 주석을 「init 이 만든 경우에만」으로 고치고, 건너뛸 때 로그 한 줄 | 재실행 로그에 「init 이 button.tsx 를 만들지 않아 … 건너뜀」 |
| U5 | shadcn 설치본 agent-avatar 의 `@next/next/no-img-element` 경고 · a11y-labels 머리 주석 삭제 | 고치지 않음. release-notes 알려진 한계에 기록(경고 처리는 범위 밖, 결정 대기) | 문서만 |
| U6 | release-notes D12 해소 항목의 예시 「모노레포 공용 utils.ts 링크」가 밖을 가리키는 링크(실제로는 rc 1)로 읽힘 | 예시를 「앱 디렉터리 안」으로 좁히고 밖을 가리키는 링크는 같은 내용 · `-y` 여도 rc 1 이고 결정 대기라고 적음(동작은 그대로) | 문서만. 이후 D15 결정으로 해소(밖 링크도 같은 내용 · `-y` 면 건너뜀, 17절), 「결정 대기」 문구는 README · release-notes 에서 정리 |

게이트 재실행:

- `pnpm exec turbo run test build --filter=@axis-ds/cli --force`(timeout 900): rc 0, Cached 0, 15파일 518 테스트 통과, copy-registry 32파일(항목 30).
- `pnpm cli-smoke` rc 0, `pnpm test:registry` rc 0(42/42).
- `node scripts/registry-shadcn-smoke.mjs --work <scratch>/r6 --keep`: rc 0(init 67.6s · add 14.9s · build 14.9s). add 동안 ui.shadcn.com `/r/colors/neutral.json` 1건 · 그 밖 0건. 스크립트 안 서버 포트 리스닝 0건(`ss -ltn`).

## 17. 결정 D13 ~ D16 과 minor n1 ~ n5 반영 (2026-10-22)

임시 파일 · 로그 · 픽스처는 세션 scratch(`wi0045-impl/r5/`)에만 두었습니다. `apps/web/public/templates` 변경 0건(`git status --short apps/web/public/templates` 0줄, build:registry · 스모크 뒤 각각 확인).

| # | 내용 | 조치 | 결과 |
|---|---|---|---|
| D13 | 종전 기본값 이전 | `resolveRegistryUrl` 이 config 의 `registry` 가 정확히 `https://axis.minu.best/r`(끝 `/` 1개 포함)이면 새 기본값으로 바꾸고 `migratedFrom` 을 남김. `createClientFor` 가 안내 1줄(`LEGACY_REGISTRY_NOTICE`). 파일은 고치지 않음, env 가 있으면 미적용 | registry 단위 9건(정확히 일치 · 끝 슬래시 · 공백 trim · 다른 경로 `/rx` · 슬래시 둘 · 다른 호스트 · 다른 스킴 · 하위 경로 · env 우선 2), add 단위 6건(종전값 2 · 다른 주소 2 · env 우선 · 양성 대조 registry 없음). 파일 내용 불변 확인 |
| D14 | 레지스트리 밖 `axis.minu.best` 참조 | 고치지 않음. release-notes 알려진 한계 · 이 문서 14절 목록 · todo 범위 밖에 「WI-0056 으로 이관」 | 문서만 |
| D15 | 밖을 가리키는 링크 대상 | `escapeReason(…, { allowOutsideLink: true })` 를 계획 단계에서만 써서 밖 링크를 덮어쓰기 판정 뒤로 미룸. 써야 하면 기존 링크 거부(rc 1, 문구에 「프로젝트 밖(…)을 가리키는」), unchanged 는 `= <경로> (같은 내용이라 건너뜀, 링크 대상이 프로젝트 밖)`, `-y` 건너뜀은 `- <경로> (링크 대상이 프로젝트 밖)`. 디렉터리 대상 · 읽기 불가는 종전대로 rc 1 | add 단위 7건(같은 내용 3옵션 rc 0 · 밖 파일 mtime 불변, `-y` 건너뜀 rc 0, `--overwrite` rc 1 스냅샷 불변, 대화형 예 rc 1, 디렉터리 대상 rc 1, 읽기 불가 rc 1, 음성 대조: 상위 디렉터리가 밖 링크면 종전대로 거부). 종전 「밖 파일로 가는 링크면 -y · --overwrite 여도 거부」 테스트도 통과(내용이 달라 써야 하는 경우) |
| D16 | CLI 는 `AXIS_REGISTRY_PUBLIC_URL` 을 읽지 않음 | 코드 변경 없음. PRD D11 · D16 확정 문구, release-notes · README 에 「빌드 · G1 전용」 | `grep -rn AXIS_REGISTRY_PUBLIC_URL packages/axis-cli/src` 는 주석 · 테스트 설명뿐(읽는 코드 0건, 같은 grep 이 `scripts/registry-integrity.mjs` 에서는 `REGISTRY_PUBLIC_URL_ENV` 정의를 찾음: 양성 대조) |
| n1 | init 재실행 utils.ts 문구 | 같은 내용이면 쓰지 않고 「✓ utils.ts 유지(이미 같은 내용)」, 다르면 종전처럼 덮어쓰고 「✓ utils.ts 덮어씀(기존 내용과 달라 init 의 utils 로 다시 씀)」, 없으면 「생성 완료」 | init 단위 3건(양성 대조 생성 · 유지 mtime 불변 · 덮어씀 내용 교체) |
| n2 | no-img-element 경고 항목 | release-notes 에 axis CLI 경로와 3개 항목(`<img` grep 3/30) 기재. 컴포넌트 코드는 그대로 | 문서만. axis CLI 경로 경고 문구는 이번 회차에 다시 재지 않음(이전 검증 지적 기준) |
| n3 | 확인 대기 중 경합 | 새 파일(`write`)은 `O_WRONLY|O_CREAT|O_EXCL|O_NOFOLLOW`, 덮어쓰기(`overwrite`)만 `O_WRONLY|O_TRUNC|O_NOFOLLOW`(r6 에서 변경: D19 로 `O_WRONLY|O_NOFOLLOW` 로 열고 fd fstat 확인 뒤 `ftruncate`, 18 · 19절. O_CREAT 없음, 검증 보정 r5: 확인 대기 중 지워져 ENOENT 면 새 파일 플래그로 다시 열고 `+` 로 표기, overwritten 에 넣지 않음). EEXIST 면 링크로 바뀐 경우는 종전 「링크로 바뀌었습니다」, 아니면 「같은 이름의 파일이 생겼습니다 … 덮어쓰지 않았습니다」 rc 1 | `r4/review/race.mjs` 사례 A 를 add 단위로 옮김(card 사용자 내용 보존 · rc 1 · 경로 안내 · 출력에 card 없음) + 대조 2건(처음부터 있던 파일은 묻고 건너뜀 rc 0, 경합 없으면 `+ card`). 종전 「쓰기 직전 링크로 바뀜」 테스트도 통과(EEXIST + 링크 판정). r5: 덮어쓰기 동의 뒤 파일이 지워지는 사례(`+ button.tsx`, overwritten 미포함, rc 0) + 대조(그대로면 `~ (덮어씀)`) |
| n4 | 레지스트리 URL 검사 | `normalizeRegistryBaseUrl` 이 G1 `normalizePublicUrl` 과 같이 공백 · userinfo · 쿼리 · 해시 거부, 오류 문구 URL 은 `redactRegistryUrl` 로 userinfo 를 `***` 로 가림(검증 보정 r5: 정규식이 아니라 `new URL()` 이 읽은 userinfo 로 판정해 `https:/u:p@h` · `https:\\u:p@h` · `https:u:p@h` 도 가리고, 파싱 실패면 스킴 뒤부터 마지막 `@` 앞까지 가림. 슬래시가 든 비밀번호 대비). 거부는 RegistryClient 가 접근 실패(access)로 동봉본 폴백 | registry 단위: 거부 7건 · 가림 2건 · 양성 대조 2건 · redact 4건, 폴백 4건(userinfo · 공백 · 쿼리 · 해시 각각 요청 0건, 접근 실패 문구, 비밀번호 미노출) + 양성 대조(같은 서버 정상 URL 은 원격). 종전 「URL 형식이 아니면」 사례는 공백이 든 `not a url` 에서 `not-a-url` 로 바꿈(공백 사유가 먼저 걸려서). r5 추가: 비 표준 형태 7건(가림 · 오류 문구) + 폴백 2건, 빌드한 CLI 로 `AXIS_REGISTRY_URL` 5형태 실행 rc 0 · 비밀번호 grep 0건(양성 대조: 같은 출력에 `***@` 1건). URL 이 찍히는 다른 경로: `fetchRegistryJson` · 검증 오류는 정규화를 통과한 base 만 쓰므로 userinfo 가 들어갈 수 없음 |
| n5 | 스모크 자식 프로세스 정리 | `registry-shadcn-smoke.mjs` · `registry-install-smoke.mjs` 의 `run()` 이 자식을 `detached` 로 띄우고 timeout · 자식 종료 · 스크립트 `exit` · SIGINT · SIGTERM 에서 `process.kill(-pid, 'SIGKILL')`. 검증 보정 r5 에서 SIGHUP(터미널 닫힘)도 같은 처리기에 추가. `--run-timeout-ms` 로 상한을 낮출 수 있음. 한계: 처리기가 돌지 못하는 바깥 SIGKILL(`timeout -k` 마지막 단계 등)에는 손자 그룹이 남음(주석에 기록) | 아래 A/B |

n5 A/B(수정 전 사본은 `r5/n5/*.before.mjs`, ROOT 만 저장소 절대 경로로 바꾸고 상한을 `N5_TIMEOUT_MS` 로 받게 함. 소속 판정은 `/proc/<pid>/cwd` 가 작업 디렉터리 아래인지):

| 사례 | 수정 전 | 수정 후 |
|---|---|---|
| ① 실파일 `run()` 추출본으로 `pnpm dlx shadcn@4.21.4 add <URL>` 을 상한 3초로(손자 `pnpm add` 는 1.8 ~ 2.1초에 뜸) | 상한 1초 뒤에도 shadcn node · `pnpm add -- class-variance-authority` 2개가 살아 있고 `run` 은 7.5초에 돌아옴(rc 124) | `run` 이 3.0초에 돌아오고(rc 124) 2초 뒤 앱 디렉터리 cwd 프로세스 0개 |
| ② 스크립트 전체(`registry-shadcn-smoke`)에 18초에 SIGTERM | 양성 대조(15초) 1개(`pnpm install`), SIGTERM 2초 뒤 스크립트는 죽었는데 `pnpm install` 1개 남음 | 양성 대조(15초) 1개(`pnpm install`), SIGTERM 3초 뒤 0개, 스크립트 rc 143 · 「SIGTERM 를 받아 자식 프로세스 그룹을 끝내고 멈춥니다」 |
| ③ 스크립트 전체에 상한 20초(참고) | 손자가 끝날 때까지 `run` 이 돌아오지 않음(첫 실행 105초, 그 뒤 캐시가 차서 29초에 끝나 표본 시점에는 0개) | 상한에서 그룹 종료, 29초에 rc 2 |

④ r5 SIGHUP(실파일 `const RUN_TIMEOUT_CAP_MS` ~ `run()` 추출본으로 `sh -c 'sleep 301 & sleep 302'`, 1초 뒤 SIGHUP): 수정 전(SIGHUP 제외 변이) 2 → 2 잔존(node rc 129), 수정 후 shadcn 판 · install 판 모두 2 → 0(node rc 129). 남은 sleep 은 PID 로 정리, 최종 0건.

③ 은 네트워크 캐시 상태에 따라 걸리는 단계가 달라져 판정에 쓰지 않았습니다. 각 실행 뒤 `ps` 로 shadcn · pnpm dlx · pnpm add · next build · create-next-app 잔존 0건(grep rc 1, 같은 판정식이 ① 수정 전 표본에서는 2개를 찾음: 양성 대조).

변이(원복은 sha256 · `diff -q` 로 확인, 모두 일치):

| 결정 | 변이 | 결과 |
|---|---|---|
| D13 | 이전 조건을 `false &&` 로 끔 | 4건 실패(registry 2 · add 2, 207 중) |
| D15 | 계획 단계 `allowOutsideLink: false` | add 4건 실패(104 중) |
| n3 | 새 파일 플래그의 `O_EXCL` 을 `O_TRUNC` 로 | add 1건 실패(경합 사례 A) |
| n4 | userinfo 거부 끔 | registry 4건 실패(거부 2 · 가림 1 · 폴백 1) |
| n4 보강(r5) | `redactRegistryUrl` 을 종전 `스킴://` 정규식으로 | registry 2건 실패(비 표준 형태 가림 · 폴백 안내) |
| n3 보강(r5) | 덮어쓰기 플래그에 `O_CREAT` 복원 | add 1건 실패(지워진 뒤 `+` 표기) |
| n5 보강(r5) | 처리 신호에서 SIGHUP 제외 | 위 ④ 수정 전 열(잔존 2) |
| n1 | 같은 내용 판정 끔 | init 1건 실패(「유지」) |

게이트 재실행:

- `pnpm build:registry` rc 0(32파일, 앞뒤 `cat *.json | sha256sum` 같음, G1 통과 문구). `pnpm test:registry` rc 0(42/42).
- `pnpm exec turbo run test build --filter=@axis-ds/cli --force`(timeout -k 20 900): rc 0, Cached 0, 15파일 560 테스트 통과.
- `pnpm cli-smoke` rc 0.
- 검증 보정 r5 뒤: `packages/axis-cli` 에서 `pnpm test` rc 0(15파일 564 테스트), `pnpm build` rc 0. 변이 3종은 원복 뒤 sha256 일치.
- `pnpm registry-shadcn-smoke --work <scratch>/r5/shadcn-work`(timeout -k 20 1500): rc 0, 257초(install 161.4s · init 47.3s · add 15.7s · build 15.4s). add 동안 ui.shadcn.com `/r/colors/` 1건 · 그 밖 0건. 실행 직전 npm 레지스트리 응답 21.3초(`curl https://registry.npmjs.org/shadcn`), 느렸지만 상한 안에서 끝남. 끝난 뒤 잔존 프로세스 0건.
- 참고: `npx tsc --noEmit -p packages/axis-cli` 의 오류는 이번 WI 미변경 파일(`library/publisher*.ts` · `template/template-apply.ts` 등)뿐이고 add · registry · init · config 는 0건(grep).

## 18. 결정 D17 ~ D20 과 minor p1 · p2 반영 (2026-10-22)

임시 파일 · 로그 · 픽스처는 세션 scratch(`wi0045-impl/r6/`)에만 두었습니다. `apps/web/public/templates` 변경 0건(build:registry · turbo · cli-smoke · shadcn 스모크 뒤 각각 `git status --short apps/web/public/templates` 0줄).

| # | 내용 | 조치 | 결과 |
|---|---|---|---|
| D17 | init 의 utils.ts 링크 규칙 | add 의 경로 · 링크 판정 · `writeNoFollow` 를 `src/add/safe-write.ts` 로 옮겨 add · init 이 같이 씀(add.ts 는 종전 이름을 다시 내보냄). init 은 `planUtilsWrite`(lstat)로 create · keep · overwrite · reject 를 쓰기 전에 정하고, reject 가 하나라도 있으면 config · utils · package.json 모두 쓰지 않고 rc 1. 링크 · 같은 내용은 「✓ utils.ts 유지(이미 같은 내용, 링크)」(밖이면 「링크 대상이 프로젝트 밖: <실제 위치>」) | init 단위 7건: 안 링크 같은 내용 rc 0 · 밖 링크 같은 내용 rc 0 · 다른 내용 안 · 밖 링크 rc 1(config 미생성 · 스냅샷 불변 · 링크 유지) · 깨진 링크 · 디렉터리 · 디렉터리 링크 rc 1 · 양성 대조(일반 파일 덮어씀) · 쓰기 직전 링크로 바뀌는 경합(O_NOFOLLOW, 밖 파일 불변 rc 1) |
| D18 | 종전 기본값 판정 정규화 | `normalizeRegistryBaseUrl` 이 `<스킴>//<호스트[:포트]><경로 끝 / 제거>` 를 돌려줌(URL 파서가 스킴 · 호스트 소문자, 스킴 기본 포트 제거). `isLegacyDefaultRegistryUrl` 은 앞뒤 공백을 떼고 이 함수로 정규화한 결과를 종전 기본값과 비교(예외면 false) | registry 단위 26건: 이전 8(`/r//` · `/r///` · 대문자 스킴 · 대문자 호스트 · `:443` · `:443/` · 앞뒤 공백 · 탭 줄바꿈), 비이전 15(`/rx` · `/R` · `/r/v2` · 다른 호스트 · 호스트 접미 위장 · `http://` · `http://…:80` · `https://…:80` · `:8443` · 쿼리 · 해시 · userinfo · 중간 공백 · 파싱 실패 · 빈 문자열), 두 판정 일치 1(양성 대조: true 3건 · false 4건이 함께 나옴), 정규화 결과 1, env 우선 1. 종전 「슬래시 둘은 그대로 존중」 사례는 D18 로 이전 대상이 되어 비이전 표에서 뺌 |
| D19 | 하드링크 덮어쓰기 거부 | 계획 단계: add 는 덮어쓰기 판정(overwrite) 파일, init 은 덮어쓸 utils.ts 를 `hardLinkCount`(lstat, 일반 파일 nlink 2 이상)로 보고 거부 사유로 모음(아무것도 쓰지 않음). 쓰기: 덮어쓰기는 `O_WRONLY|O_NOFOLLOW` 로 열고(자르지 않음) `fstat` 로 일반 파일 · nlink 1 을 확인한 뒤 `ftruncate`. init 의 axis.config.json 은 종전처럼 링크를 따라가 쓰므로 판정도 `stat`(따라감) · 쓰기는 `overwriteFollowingLinks`(fd fstat 확인) | add 단위 7건: `--overwrite` 로 뒤 항목(input) 하드링크 rc 1 · written 0 · 스냅샷 불변 · 경로와 「다른 경로와 하드링크로 이어진 파일이라」, 대화형 예 rc 1, 같은 내용 rc 0(unchanged), `-y` 건너뜀 rc 0, 양성 대조(하드링크 아님 `~`), 경합(열기 직전 링크 생성 → 「하드링크로 이어졌습니다(동시 경합)」 rc 1, 두 경로 내용 불변), `writeNoFollow` 직접(하드링크면 HARDLINK 코드 · 내용 불변, 양성 대조 덮어씀). init 단위 4건: utils 하드링크 rc 1 스냅샷 불변 · 같은 내용 하드링크 유지 rc 0 · config 하드링크 rc 1 스냅샷 불변 · 양성 대조(config 갱신) |
| D20 | init 의 종전 기본 registry 갱신 | 기존 registry 가 `isLegacyDefaultRegistryUrl` 이면 init 의 기본값으로 바꿔 쓰고 「✓ axis.config.json 갱신(…, registry 를 새 기본 주소로 갱신)」 + 「registry 를 새 기본 주소(…)로 갱신했습니다(종전 axis.minu.best: …)」. 다른 값은 「registry 는 기존 값 유지」 | init 단위 7건: 종전값 4형태(정확히 · 끝 `/` · `HTTPS://AXIS.MINU.BEST:443/r//` · 앞뒤 공백) 갱신 후 재실행 「유지」, 다른 값 3형태(`/rx` · 다른 호스트 · `http://`) 유지 · 「새 기본 주소」 문구 없음 |
| p1 | URL 쿼리 · 해시 가림 | `redactRegistryUrl`(schema.ts 로 옮김, remote.ts 가 다시 내보냄)이 userinfo 를 먼저 가린 뒤 쿼리 · 해시 값을 `?***` · `#***` 로. 적용 경로: `normalizeRegistryBaseUrl` 오류, `fetchRegistryJson` 오류(타임아웃 · 요청 실패 · HTTP 상태 · JSON), 의존 URL 검증 오류, init D20 안내. `scripts/registry-integrity.mjs` 에 같은 규칙의 `redactPublicUrl` 을 두고 `normalizePublicUrl` 오류 문구에 적용 | registry 단위 6건(가림 규칙 · 음성 대조 · normalize 오류 5형태 · RegistryClient 폴백 안내 · fetchRegistryJson 403 · HTML 응답 · 의존 URL 오류), test:registry 1건(오류 7형태 비밀 미노출 · 양성 대조로 문구가 비지 않음 · 음성 대조) |
| p2 | init utils.ts 읽기 오류 | ENOENT 만 「생성」, 그 밖의 lstat · 읽기 오류는 reject(아무것도 쓰지 않고 rc 1, 「읽지 못해 비교할 수 없습니다(EACCES)」 · 「정보를 읽지 못했습니다(ENOTDIR)」) | init 단위 3건: EACCES(root 가 아닐 때) rc 1 · config 미생성 · 원본 불변, ENOTDIR(상위 경로가 파일) rc 1, 양성 대조 ENOENT 「생성 완료」 |

변이(파일을 scratch 로 복사해 두고 한 줄 바꿔 테스트 → 복사본으로 되돌림 → `diff -q` 일치 확인, 8건 모두 일치):

| 결정 | 변이 | 결과 |
|---|---|---|
| D17 | `planUtilsWrite` 의 링크 분기를 `false &&` 로 끔 | init 5건 실패(123 중) |
| D18 | `isLegacyDefaultRegistryUrl` 을 종전 문자열 비교(정확히 · 끝 `/` 하나)로 | registry · init · add 11건 실패(372 중) |
| D19 계획 단계 | `hardLinkCount` 가 늘 null | add · init 2건 실패(236 중, add 의 뒤 항목 부분 설치 · init 의 config 선행 쓰기) |
| D19 fd 재확인 | `writeNoFollow` 의 nlink 검사 줄 삭제 | add 2건 실패(113 중, 경합 · 직접 호출) |
| D19 config | init 의 config 하드링크 판정 끔 | init 1건 실패(123 중) |
| D20 | `migratedRegistry` 를 늘 false | init 4건 실패(123 중) |
| p1(CLI) | `redactRegistryUrl` 에서 쿼리 · 해시 가림 제거 | registry 5건 실패(136 중) |
| p1(G1) | `redactPublicUrl` 에서 쿼리 · 해시 가림 제거 | test:registry 1건 실패(43 중) |

게이트 재실행(이 회차):

- `pnpm build:registry` rc 0(30개 항목, 앞뒤 `cat apps/web/public/r/*.json | sha256sum` 같음, 「G1 통과」 문구). `pnpm test:registry` rc 0(43/43).
- `pnpm exec turbo run test build --filter=@axis-ds/cli --force`(timeout -k 20 900): rc 0, `Cached: 0 cached, 2 total`, 15파일 623 테스트 통과.
- `pnpm cli-smoke` rc 0(`[cli-smoke] OK`).
- `pnpm registry-shadcn-smoke --work <scratch>/r6/shadcn-work`(timeout -k 20 1500): rc 0, 44초(cna 0.7s · install 3.6s · baseBuild 12.6s · init 7.9s · add 4.3s · build 14.1s, 캐시가 찬 상태). add 동안 ui.shadcn.com `/r/colors/` 1건 · 그 밖 0건, cn 메타데이터 요청 0건(양성 대조: 새 패키지 요청 5/5건). 실행 직전 npm 레지스트리 응답 0.19초(`curl https://registry.npmjs.org/shadcn`, 200). 끝난 뒤 `ps` 로 shadcn · pnpm dlx · next build · create-next-app 잔존 0건(`grep -v grep` 뒤 rc 1, 같은 패턴은 필터 전 명령 자신을 3줄 찾음: 양성 대조), `--work` 하위 디렉터리 정리됨.
- `npx tsc --noEmit -p packages/axis-cli` 의 오류는 종전과 같이 이번 WI 미변경 파일뿐이고 add · init · registry 는 0건(grep).

## 19. 검증 지적 보정 5 (2026-10-22, r6 검증 반영)

임시 파일 · 변이 사본은 세션 scratch(`wi0045-impl/r6/fixmut`)에만 두었습니다. `apps/web/public/templates` 변경 0건.

| 지적 | 조치 | 결과 |
|---|---|---|
| add 가 일반 파일이 아닌 기존 대상(FIFO, D15 로 허용된 밖 링크가 `/dev/zero` 를 가리킴)을 따라가 읽어 끝나지 않음(major) | `escapeReason` 이 링크를 따라간 대상을 `stat` 해 `isFile()` 이 아니면 「일반 파일이 아니라 비교 · 덮어쓰기를 할 수 없습니다」로 거부. 계획 단계(planFiles)에서 읽기 전에 걸려 rc 1 · 아무것도 쓰지 않음 | add 단위 4건: `escapeReason` FIFO(옵션 2종) · 밖 `/dev/zero` 링크(D15 허용 옵션), `/dev/null` 링크 `-y` rc 1 · 스냅샷 불변, 양성 대조(밖 일반 파일 링크 `-y` rc 0 건너뜀). 회귀가 테스트를 멈추지 않게 FIFO · `/dev/zero` 는 판정 함수로 보고, 실행 경로는 읽어도 끝나는 `/dev/null` 로 봄 |
| init 의 링크 대상 isFile 가드를 지켜 주는 테스트 없음 | `planUtilsWrite` 를 `/dev/null` 링크로 직접 부르는 테스트와 init 실행 테스트 | init 단위 3건: reject · 「일반 파일이 아닙니다」, init rc 1 · config 미생성 · 링크 유지, 양성 대조(일반 파일 링크 keep) |
| add 의 링크 거부 문구가 init 과 다름 | 안 링크는 「프로젝트 안을 가리키는 심볼릭 링크라」, 깨진 링크는 「기존 파일 <상대 경로> 이 깨진 심볼릭 링크라」(절대 경로 안 찍음) | add 단위 2건 |
| init 의 utils.ts 쓰기 실패 안내가 config 를 쓰지 않은 실행에서도 「이미 썼습니다」 | config 상태(생성 · 갱신 · 유지)를 기록해 「이미 만들었습니다 · 이미 갱신했습니다 · 바꾸지 않았습니다(이미 같은 내용)」로, utils 새 파일은 「만들지 못했습니다」, 기존 파일은 「덮어쓰지 않았습니다」. package.json 실패 안내도 같은 기록으로 사실대로 | init 단위 2건(`chmod 555` componentsDir, root 아닐 때): 유지 실행 「바꾸지 않았습니다」 · 「이미 썼습니다」 없음 · config 불변, 새 실행 「이미 만들었습니다」 |
| `registry-integrity.mjs` 의 공개 URL 입력 오류가 스택과 rc 1(위반과 섞임) | main 의 공개 URL 결정 · 검사를 try/catch 로 감싸 「G1 측정 실패: …」 rc 2 | test:registry 1건: 잘못된 URL rc 2 · 비밀 미노출 · 스택 없음, 대조 다른 호스트 rc 1(「G1 실패」) · 기본 URL rc 0 |
| PRD FR-4 · 이 문서 n3 행의 `O_TRUNC` 서술 | FR-4 를 「`O_WRONLY|O_NOFOLLOW` 로 열고 fd fstat 확인(D19) 뒤 `ftruncate`」로, n3 행에 「r6 에서 변경」을 덧붙임 | 문서 |
| pages.dev 에 구 레지스트리(index.json 에 version 없음) | 배포 순서(웹 레지스트리 먼저, CLI 발행 나중)를 release-notes 「알려진 한계」 · todo 「릴리스」에 기록. 2026-10-22 재실측 `curl` 200, 키 name · homepage · items(로컬은 version 포함) | 문서(결정 · 실행은 사용자 몫) |

변이(사본 `fixmut` 에서 수정 하나씩 되돌림, 기준선 add · init 247/247 통과):

| 변이 | 결과 |
|---|---|
| `escapeReason` 의 일반 파일 검사 끔 | 3건 실패 |
| add 안 링크 문구를 종전 「심볼릭 링크라」로 | 1건 실패 |
| add 깨진 링크 문구를 종전 절대 경로 문구로 | 1건 실패 |
| `planUtilsWrite` 의 링크 대상 `isFile` 검사 끔(r6 리뷰 변이와 같은 줄) | 2건 실패(종전 380건 전부 통과) |
| utils 실패 안내를 종전 「axis.config.json 은 이미 썼습니다」로 | 2건 실패 |
| utils 새 파일 실패 문구를 「덮어쓰지 않았습니다」로 | 1건 실패 |
| `registry-integrity.mjs` main 의 try/catch 제거(저장소 파일을 scratch 백업 뒤 바꾸고 sha256 로 복원 확인) | test:registry 1건 실패(44 중) |

게이트 재실행(이 회차):

- `pnpm build:registry` rc 0(「G1 통과」, 앞뒤 `cat apps/web/public/r/*.json | sha256sum` 같음). `pnpm test:registry` rc 0(44/44).
- `pnpm exec turbo run test build --filter=@axis-ds/cli --force`(timeout -k 20 900): rc 0, `Cached: 0 cached, 2 total`, 15파일 634 테스트 통과(종전 623 + 11).
- `pnpm cli-smoke` rc 0(`[cli-smoke] OK`).
- `npx tsc --noEmit -p packages/axis-cli`: 오류 20건은 종전과 같이 이번 WI 미변경 파일이고 add · init · registry 는 0건(grep).
- 미조치(사용자 결정): init 의 utils.ts 쓰기에 add 의 상위 디렉터리 이탈 검사(`componentsDir` 가 밖을 가리키는 링크 · `../outside`)를 넣을지. HEAD 부터 있던 동작이라 D17 범위 해석이 필요합니다.

## 20. 검증 지적 보정 6 (2026-10-22, r6 2라운드 지적을 리더가 직접 반영)

4차 워크플로 2라운드에서 남은 지적 7건 가운데 5건을 고쳤어요. 2건은 사용자 결정으로 처리했어요(init componentsDir 이탈은 알려진 한계, 배포 순서는 사이트 자동 배포에 맡기고 Version PR 전 실측). $schema · 문서 링크 403 은 WI-0056 이관 항목이에요.

| 지적 | 수정 | 테스트 · 실측 | 변이(수정 되돌림) |
|---|---|---|---|
| (major) 읽지 못하는 기존 axis.config.json(EACCES)을 없는 파일로 보고 덮어씀(rc 0, 「생성 완료」, 사용자 registry · brand 소실) | ENOENT 만 없는 파일로 보고, 그 밖의 읽기 오류는 쓰기 전 판정(rejects)에 넣어 아무것도 쓰지 않고 rc 1. 새로 만드는 config 는 `wx`(O_EXCL)로 열어 판정 뒤 생긴 파일을 덮어쓰지 않음 | init.test.ts 「읽을 수 없는 기존 axis.config.json(EACCES)」 1건 | 판정 끔 → 1건 실패 |
| 읽기 전용 utils.ts 는 config 를 쓴 뒤 실패해 부분 쓰기가 남음 | planUtilsWrite 가 덮어쓰기 전에 `accessSync(W_OK)` 로 판정해 rc 1, config 도 쓰지 않음 | init.test.ts 「읽기 전용 utils.ts」 1건 | 판정 끔 → 1건 실패 |
| 숫자로 시작하는 비밀번호에 `?` · `#` 가 섞이면(https://admin:12345?x@host) 파서가 userinfo 를 못 읽어 가림이 빠짐 | CLI redactRegistryUrl · G1 redactPublicUrl 모두, 파서가 userinfo 를 못 읽었어도 스킴 뒤 첫 `/` 앞(authority 후보)에 `@` 가 있으면 그 앞까지 가림. 경로의 `@` 는 그대로 | registry.test.ts 1건, registry-integrity.test.mjs 3단언 | CLI · G1 각각 끔 → 각 1건 실패 |
| G1 normalizePublicUrl 이 원문을 돌려줘 D18 이후 CLI 정규화와 접두가 어긋남(대문자 호스트 · :443) | G1 도 `protocol//host + pathname` 에서 끝 `/` 를 뗀 값(CLI 와 같은 정규화)을 돌려줌 | registry-integrity.test.mjs 「D18 정합」 1건 | 원문 반환으로 되돌림 → 1건 실패 |
| 스모크 run() 정리가 'close' 에서만 돌아, 손자가 파이프를 쥐면 rc 0 인 명령도 상한까지 기다린 뒤 rc 124 | 'exit' 에서 프로세스 그룹을 정리하고 rc 는 exit 값으로 정함(두 스모크 스크립트 동일) | 실파일에서 run() 을 추출한 A/B: `bash -c 'sleep 30 & echo hi; exit 0'`, 상한 5초 → 수정본 rc 0 · 5ms(두 스크립트), exit 처리 제거 변이 rc 124 · 5658ms. 끝난 뒤 남은 sleep 0개 | (A/B 의 변이 열) |

게이트: `pnpm test:registry` 45/45, cli `vitest run` 15파일 637/637.


## 21. 배포 실측 (2026-10-22)

| 확인 | 결과 |
|---|---|
| #152 CI(run 39767335190) 새 단계 | G1 테스트 45/45, cli-smoke OK, G2 대표 5/5(약 73초) |
| pages.dev `/r` (#152 머지 뒤) | index.json version 1.5.0 · 30항목, 32파일 모두 main 과 바이트 동일. 종전 axis.minu.best/r 는 403 그대로 |
| 미발행 CLI(main 빌드), 기본 설정 | list 「원격 레지스트리, version 1.5.0」, add 폴백 안내 0건. 음성 대조(원격 차단)는 「접근하지 못해 … 포함된 레지스트리」, 종전 기본값 config 는 안내 1줄 뒤 원격 설치 |
| npm `@axis-ds/cli@1.5.0` (#153, run 39795328665) | latest 1.5.0, provenance(SLSA v1). tarball dist 45파일 · 동봉 레지스트리 32파일 모두 main 과 바이트 동일 |
| `npx @axis-ds/cli@1.5.0` 실사용(create-next-app 15.5.28, Tailwind 4, pnpm, env 없음 · 새 HOME) | init(registry pages.dev) · list(원격) · add button card dialog select agentic-tool-call-card agentic-run-progress -y(8개, rc 0) · 안내된 pnpm add rc 0 · 서버 page 에서 사용한 next build(린트 · 타입 포함) rc 0 |
| main 에서 전수 재측정(배포본과 바이트 동일한 빌드) | cli-smoke OK, registry-install-smoke:all 28/28 |

참고: 검증 하네스가 HOME 을 바꾸면 corepack 캐시 경로가 바뀌어 pnpm 실행이 실패해요(`COREPACK_HOME` 을 실경로로 지정해 해소, 배포본 결함 아님).
