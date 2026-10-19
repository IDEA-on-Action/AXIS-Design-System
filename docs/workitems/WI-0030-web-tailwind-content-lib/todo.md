# WI-0030: apps/web Tailwind content 경로에 src/lib 추가 TODO

> PRD: [prd.md](./prd.md) | 상태: 🔄 진행 (2026-10-19 구현 · 검증 완료, PR 대기)

## 진행

- [x] 착수 실측: `src/lib` 4파일의 클래스 문자열 전수 조사 (C1)
- [x] 수정 전 산출 CSS 확인: 양성 대조군 먼저, 그 뒤 대상 클래스 (C2)
- [x] `content` 배열에 `./src/lib/**/*.{js,ts,jsx,tsx,mdx}` 추가 (`src/app` 줄 바로 다음 한 줄)
- [x] 수정 후 산출 CSS 비교 (AC-1 · AC-2)
- [x] type-check · lint · a11y spec (AC-3)
- [ ] PR 머지 뒤 `.github/wi-mapping.json` 을 ✅ 로, Issue #95 종료

## 실측 기록

> 측정 조건: 기준 `main` e690905, worktree 에서 `pnpm install --frozen-lockfile` 뒤 실행. 빌드는 매번 `pnpm turbo run build --filter=@ax/web... --force`(4 tasks, `Cached: 0 cached`). 산출 CSS 는 `apps/web/out` 아래 `.css` 5개 파일을 합쳐 셉니다. 빌드가 고친 `apps/web/public/templates/*.json` 5개는 매번 되돌렸습니다.

### 클래스 문자열 (src/lib)
| 파일 | 클래스 문자열 | 다른 content 경로에도 있는가 |
|---|---|---|
| `library-types.ts` | `bg-zinc-500` | 없음 (`src/lib` 전용) |
| `library-types.ts` | `bg-blue-500` · `bg-purple-500` · `bg-green-500` | 있음 (`src/app` · `src/components`) |
| `utils.ts` · `shiki.ts` · `template-types.ts` | 없음 | - |

### 산출 CSS
| 항목 | 수정 전 | 수정 후 |
|---|---|---|
| 빌드 rc | 0 | 0 |
| CSS 파일 수 / 바이트 | 5 / 149,770 | 5 / 149,858 |
| `.bg-blue-500{` (양성 대조군) | 1 | 1 |
| `.bg-zinc-500{` | 0 | 1 |
| `.bg-purple-500{` · `.bg-green-500{` | 1 · 1 | 1 · 1 |
| 고유 클래스 선택자 수 | 890 | 891 |
| 사라진 선택자 / 새 선택자 | - | 0 / 1 (`.bg-zinc-500`) |

- 실제로 빠지던 클래스는 1개(`bg-zinc-500`, 라이브러리 화면의 shadcn/ui 출처 점 색)입니다.

### 검증
| 항목 | 결과 |
|---|---|
| `pnpm --filter @ax/web type-check` | rc 0 |
| `pnpm --filter @ax/web lint` | rc 0, `No ESLint warnings or errors` |
| a11y spec (`pnpm exec playwright test a11y`) | 수정 전 18 passed, 수정 후 18 passed |

- a11y 는 main 의 `playwright.config.ts` 기본 webServer(`pnpm dev`, 3100) 로 실행했습니다. `E2E_SERVER=static` 분기는 main 에 아직 없습니다(실행 전 3100 포트가 비어 있음을 확인, 다른 서버 재사용 아님). 수정 전 수치는 같은 worktree 에서 추가한 줄을 잠시 빼고 잰 값입니다.

## 후속 (이번 범위 아님)
- `src/registry` 의 예제 파일 5개도 클래스 문자열을 갖고 있고 `content` 밖입니다. WI-0025 M3 · M4 가 그 경로를 더하므로 여기서는 손대지 않습니다.
- WI-0025 M3 · M4 와 `apps/web/tailwind.config.ts` 인접 줄 충돌: M3 · M4 는 이 WI 가 추가한 줄 바로 다음의 `../../packages/ui/src/**` 줄을 지우고 `./src/registry/**` · `axis-ui-react` · `axis-agentic-ui` 줄로 바꿉니다. 나중에 머지되는 쪽이 `./src/lib/**` 줄과 registry · `axis-ui-react` · `axis-agentic-ui` 줄을 모두 남기고, `packages/ui` 줄 삭제는 M3 쪽을 따릅니다. 머지 순서는 사용자가 정합니다.
  - 실측(2026-10-19, 이 브랜치 HEAD a31ea50 기준 `git merge-tree --write-tree --name-only`): `origin/feat/wi-0025-m3-ontology` 870969f · `origin/feat/wi-0025-m4-demo` 34d7bca · `feat/wi-0025-m3-ontology-v2` 17e4427 세 브랜치 모두 `tailwind.config.ts` 충돌. 대조군 `main` 대 같은 세 브랜치는 `tailwind.config.ts` 충돌 없음(M3 대조는 다른 파일 8개 충돌을 출력해 측정 수행 확인).
