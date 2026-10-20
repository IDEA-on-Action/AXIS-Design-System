# WI-0042 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-20 | 브랜치: `fix/wi-0042-check-tailwind4`

## 1. 단위 테스트

| # | 대상 | 내용 | 결과 |
|---|---|---|---|
| T1 | CLI `template-check.test.ts` | Tailwind 4 + `src/app/globals.css` 의 `@import "tailwindcss"`, 설정 파일 없음 → pass(재현 사례) | 통과 |
| T2 | 같음 | 같은 프로젝트에서 import 를 지우면 warn(대조군) | 통과 |
| T3 | 같음 | Tailwind 4 인데 CSS 없음 → warn, globals.css 항목 fail | 통과 |
| T4 | 같음 | import 표기: 작은따옴표 + layer · `url()` 은 pass, 블록 주석 안만 있으면 warn | 통과 |
| T5 | 같음 | 선언 `^3.4.0` + 설치본 4.1.0 → Tailwind 4 규칙(설치본 우선) | 통과 |
| T6 | 같음 | Tailwind 4 는 `tailwind.config.ts` 가 있어도 CSS 기준 | 통과 |
| T7 | 같음 | Tailwind 3 `.mjs` · `.cjs` → warn(TypeScript 권장) | 통과 |
| T8 | 같음 | Tailwind 3 · 판정 불가(`catalog:`) · package.json 없음 + 설정 파일 없음 → 종전 fail 문구 | 통과 |
| T9 | 같음 | `runCheck` 반환값 개수 | 통과 |
| T10 | 같음 | `axis check` 명령: fail → exitCode 1, warn 만 · 모두 pass → 설정 안 함 | 통과 |
| T11 | 같음(기존 T4-1) | 기준선 6개 프로젝트(1e84f15 캡처) 출력 줄 단위 불변 | 통과 |
| T12 | MCP `template.test.ts` | Tailwind 4 pass 문구가 CLI 와 같음, Tailwind 3 `.mjs` warn | 통과 |
| T13 | MCP `tailwind-core.test.ts` | 코어 사본이 CLI 원본과 바이트 단위로 같음 | 통과 |

## 2. 변이 음성 대조 (AC5)

`template-check.test.ts`(38개) 기준, 변이 뒤 원본을 복원하고 sha256 일치를 확인했습니다.

| 변이 | 결과 |
|---|---|
| 없음 | 38 통과 |
| Tailwind 4 분기 끔(`>= 4` → `>= 99`) | 7 실패 |
| `@import "tailwindcss"` 검사가 늘 거짓 | 4 실패 |
| 종료 코드 설정 제거 | 1 실패 |
| `.mjs` · `.cjs` 탐색 제거 | 1 실패 |
| MCP 코어 사본 끝에 한 줄 추가 | 사본 동일성 1 실패 |

## 3. 품질 게이트

- `pnpm exec turbo run type-check|lint|build|test --force`: 모두 rc 0, Cached 0. cli 테스트에 이번 테스트 포함.
- `pnpm pack-smoke` rc 0.
- cli `tsc --noEmit` 오류 20건은 기존과 같은 파일(`library/*` · `template-apply.ts`)이며 이번 변경이 더한 오류 0.
- 알려진 불안정: `src/library/index.test.ts` 의 `collectAll` 이 5초 시간 초과로 간헐 실패합니다(단독 2회 중 1회). 이 WI 는 `src/library` 를 바꾸지 않았습니다.

## 4. 실경로 (AC1 · AC2)

`pnpm pack` 한 tarball 을 빈 디렉터리에 설치해 실행했습니다. 음성 대조는 새 빌드가 설치되지 않은 디렉터리에서 `npx @axis-ds/cli@1.2.1` 로 실행했습니다(같은 이름 · 버전의 로컬 설치본을 npx 가 먼저 집는 오염을 한 번 겪어 다시 쟀습니다).

| 대상 | 1.2.1 배포본 | 이 브랜치 |
|---|---|---|
| Tailwind 4 앱(create-next-app 15.5.28 → init → theme add ontology) | `FAIL tailwind.config 파일이 없습니다`, 4 pass / 1 warn / 1 fail, rc 0 | `PASS Tailwind 4: src/app/globals.css에 @import "tailwindcss" 가 있습니다`, 5 pass / 1 warn / 0 fail, rc 0 |
| 빈 디렉터리 | 0 pass / 1 warn / 4 fail, rc 0 | 같은 결과, rc 1 |

## 5. 배포본 확인 (2026-10-20, publish run 39351203366)

새 빌드가 설치되지 않은 디렉터리에서 배포본을 실행했습니다.

| 대상 | 결과 |
|---|---|
| `@axis-ds/cli@1.3.0` · Tailwind 4 앱 | `PASS Tailwind 4: src/app/globals.css에 @import "tailwindcss" 가 있습니다`, 5 pass / 1 warn / 0 fail, rc 0 |
| `@axis-ds/cli@1.3.0` · 빈 디렉터리 | 0 pass / 1 warn / 4 fail, rc 1 |
| `@axis-ds/mcp@1.2.1` stdio `axis.check_project` · Tailwind 4 앱 | serverInfo 1.2.1, `[PASS] Tailwind 4: ...` |
| `@axis-ds/mcp@1.2.0`(대조군) · 같은 앱 | `[FAIL] tailwind.config 파일이 없습니다` |
