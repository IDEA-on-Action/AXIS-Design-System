# WI-0042: `axis check` 의 Tailwind 4 tailwind.config 오탐 · FAIL 시 종료 코드 PRD

> 작성일: 2026-10-20 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0042 | GitHub: #131 | 우선순위: P2 | 상태: Approved (2026-10-20 결정 반영)
> 기준: `origin/main` b0ff0ad (`@axis-ds/cli` 1.2.1 · `@axis-ds/mcp` 1.2.0 배포 완료)
> 관련: WI-0038(#124) 배포본 확인(2026-10-20) 중 발견

---

## 1. 개요

### 1.1 배경
- Tailwind 4 프로젝트(`create-next-app@15.5.28`, `tailwindcss ^4`)에서 배포본 `@axis-ds/cli@1.2.1` 의 `axis check` 가 `FAIL tailwind.config 파일이 없습니다` 를 냈습니다. Tailwind 4 는 설정 파일 없이 CSS(`@import "tailwindcss"`)로 구성하는 것이 기본이라 오탐입니다.
- 결과에 FAIL 이 있어도 종료 코드가 0 이라 CI 에서 실패를 잡을 수 없었습니다.

### 1.2 원인 (실측, b0ff0ad)
| # | 내용 | 위치 |
|---|---|---|
| C1 | tailwind.config 항목이 `tailwind.config.ts` · `.js` 만 찾고 Tailwind 버전을 보지 않음. Tailwind 3 의 `.mjs` · `.cjs` 설정도 fail | `packages/axis-cli/src/template/template-check.ts` `checkTailwindConfig` |
| C2 | `runCheck` 가 개수를 세어 출력만 하고 종료 코드를 정하지 않음 | 같은 파일 `runCheck`, `template/index.ts` `registerCheckCommand` |
| C3 | MCP `axis.check_project` 에 같은 검사가 별도 사본으로 있어 같은 오탐을 냄 | `packages/axis-mcp/src/tools/template.ts` `handleCheckProject` |

### 1.3 결정 (2026-10-20 사용자)
| # | 결정 |
|---|---|
| D1 | Tailwind 4 이상은 설정 파일 대신 CSS 진입점의 `@import "tailwindcss"` 를 봅니다. 있으면 pass, 없으면 warn. Tailwind 3 은 `.mjs` · `.cjs` 설정도 인정합니다 |
| D2 | `axis check` 는 FAIL 이 있으면 종료 코드 1, WARN 만 있으면 0. 동작이 바뀌므로 `@axis-ds/cli` minor 로 냅니다 |
| D3 | MCP `axis.check_project` 도 함께 고칩니다. 종료 코드는 CLI 에만 해당합니다 |

## 2. 요구사항

- FR-1: Tailwind major 판정은 WI-0038 의 `detectTailwind`(설치본 → 선언 범위 → 판정 불가)를 씁니다. CLI · MCP 가 같이 쓰도록 `tailwind-core.ts` 공유 코어로 옮기고, MCP 에는 바이트 단위 사본과 동일성 테스트를 둡니다(brand-core 와 같은 방식). `init.ts` 는 다시 내보내 기존 import 를 유지합니다.
- FR-2: Tailwind 4 이상: `globals.css` 항목과 같은 후보 · 순서에서 처음 찾은 CSS 의 `@import "tailwindcss"`(작은따옴표 · `layer(...)` · `url()` 포함, 블록 주석 안은 제외)를 봅니다. CSS 가 없으면 warn(fail 은 globals.css 항목이 냅니다).
- FR-3: Tailwind 3 이하 · 판정 불가: 종전 규칙을 유지하고 `.mjs` · `.cjs` 를 warn(TypeScript 권장)으로 인정합니다. `.ts` · `.js` · 없음의 문구는 바꾸지 않습니다.
- FR-4: `runCheck` 는 pass · warn · fail 개수를 돌려주고, `axis check` 명령이 fail 이 있으면 `process.exitCode = 1` 을 둡니다.
- FR-5: README 에 Tailwind 구성 판정과 종료 코드를 적습니다.

## 3. 수용 기준

- AC1: 재현 프로젝트(Tailwind 4, 설정 파일 없음, `@import "tailwindcss"` 있음)에서 tailwind.config 항목이 pass 이고, 같은 프로젝트를 1.2.1 로 검사하면 fail(음성 대조).
- AC2: FAIL 이 있으면 rc 1, WARN 만 · 모두 pass 면 rc 0.
- AC3: 기준선 6개 프로젝트(Tailwind 3 · 판정 불가)의 `runCheck` 출력이 줄 단위로 같음.
- AC4: MCP 결과의 tailwind.config 항목이 CLI 와 같은 문구이고, 코어 사본이 CLI 원본과 바이트 단위로 같음.
- AC5: 판정 규칙 · import 검사 · 종료 코드 · `.mjs`/`.cjs` · 사본 동일성 각각을 끄는 변이에서 해당 테스트가 실패함.

## 4. 범위 밖
- `globals.css` 항목이 Tailwind 4 기본 CSS 에서 내는 `AXIS CSS 변수가 없습니다` WARN(토큰 CSS 를 import 로 받는 경우를 보지 않음). 이번 결정 범위가 아니라 기록만 합니다.
- Tailwind 4 용 AXIS 연동(`@theme` 진입점). `@axis-ds/tokens` 의 Tailwind 연동은 v3 preset(`./tailwind`)뿐이라, 이 WI 의 PASS 는 Tailwind 진입 import 만 뜻하고 AXIS 색 클래스 생성은 확인하지 않습니다. 그래서 PASS 문구에서 「설정 파일 불필요」를 뺐고(2026-10-20 사용자 결정), 실제 렌더 확인과 연동은 WI-0044 로 분리했습니다.
