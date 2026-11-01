# WI-0108: 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-11-01 | 상태: 측정 완료(2026-11-01)
> 환경: node v22.22.0 · pnpm 9.15.4 · WSL2 Linux x64 · tailwind-merge 2.6.0(lockfile) · Tailwind 3.4.19(워크스페이스) · Tailwind 4.1.13(임시 디렉터리 설치) · Playwright chromium

## 1. 그림자 클래스 전수 조사와 떠 있는 레이어 판정

대상: `packages/axis-ui-react/src` · `packages/axis-agentic-ui/src` 의 테스트 밖 소스에서 `shadow` 가 들어간 모든 클래스(측정). 떠 있는 레이어는 포털 · `fixed` · `z-50` 으로 다른 내용 위에 겹치는 요소로 판정했어요.

| 위치 | 변경 전 | 떠 있는 레이어 | 결정 |
|---|---|---|---|
| `popover/index.tsx:60` PopoverContent | `shadow-md` | 예(포털, z-50) | 토큰으로 바꿈 |
| `dropdown-menu/index.tsx:73` DropdownMenuSubContent | `shadow-lg` | 예(z-50) | 토큰으로 바꿈 |
| `dropdown-menu/index.tsx:92` DropdownMenuContent | `shadow-md` | 예(포털, z-50) | 토큰으로 바꿈 |
| `sheet/index.tsx:73` sheetVariants | `shadow-lg` | 예(포털, fixed z-50) | 토큰으로 바꿈 |
| `dialog/index.tsx:81` DialogContent | 토큰 | 예 | 이미 토큰 |
| `select/index.tsx:64` SelectContent | 토큰 | 예 | 이미 토큰(WI-0107) |
| `toast/index.tsx:26` toastVariants | 토큰 | 예(fixed 뷰포트 안) | 이미 토큰(WI-0107) |
| `tooltip/index.tsx:130` TooltipContent | 그림자 없음 | 예 | 그림자를 새로 넣는 것은 범위 밖 |
| Dialog · Sheet 오버레이, Toast 뷰포트 | 그림자 없음 | 예 | 바꿀 그림자 없음 |
| `card/index.tsx:13` Card | `--axis-card-shadow` 토큰 | 아니요(인라인 카드) | 제외, 카드 그림자 토큰을 따로 씀 |
| `switch/index.tsx:24` 손잡이 | `shadow-lg` | 아니요(트랙 안 인라인) | 제외 |
| `tabs/index.tsx:37` 활성 탭 | `data-[state=active]:shadow-sm` | 아니요(인라인 활성 표시) | 제외 |
| agentic-ui `diff-viewer/index.tsx:141 · :153` 보기 전환 버튼 | `shadow-sm` | 아니요(인라인 활성 표시) | 제외 |

- agentic-ui 에는 포털 · `fixed` · `z-50` 요소가 없어요(`absolute` 는 AgentAvatar 상태 점 · StepTimeline 선, `z-10` 은 StepTimeline 아이콘으로 모두 인라인).
- Command 는 그림자 클래스가 없어요. `apps/web` 문서 페이지의 `<Command className="rounded-lg border shadow-md">` 는 소비자 예제라 범위 밖이에요.

## 2. `cn` 그림자 그룹 병합(실측)

`packages/axis-ui-react/src/utils.ts` 는 이미 `extendTailwindMerge` 로 `^\[shadow:.+\]$` 를 그림자 그룹에 넣어 두었어요(WI-0025 U4, Dialog 를 토큰으로 바꿀 때). 코드는 바꾸지 않았어요. 기본 `twMerge` 와 나란히 돌린 결과(같은 tailwind-merge 2.6.0):

| 입력 `cn("z-50 rounded-md border shadow-[shadow:var(--axis-shadow-lg)]", X)` | 패키지 `cn` | 기본 `twMerge`(대조) |
|---|---|---|
| X = `shadow-none` | `… border shadow-none` | 토큰 그림자와 `shadow-none` 이 함께 남음 |
| X = `shadow-black/50` | 토큰 그림자 + `shadow-black/50` 공존 | 토큰 그림자가 지워짐 |
| X = `shadow-md` | `… border shadow-md` | 둘 다 남음 |
| X = `shadow-[0_0_0_1px_red]` | `… border shadow-[0_0_0_1px_red]` | 둘 다 남음 |

- 변이 A/B: `utils.ts` 의 그림자 그룹 확장 줄을 지우면 `utils.test.ts` 7건과 새 `overlay-shadow.test.tsx` 의 `shadow-none` 1건이 실패해요(8 failed / 13). 원복 뒤 통과.

## 3. 단위 테스트 `packages/axis-ui-react/src/overlay-shadow.test.tsx`

| 테스트 | 내용 | HEAD 컴포넌트 소스로 돌린 결과(음성 대조) |
|---|---|---|
| PopoverContent | 열린 상태 className 에 토큰 있음 · 고정 그림자 없음 | 실패 |
| DropdownMenuContent · SubContent | 하위 메뉴까지 연 상태로 두 요소 확인 | 실패 |
| SheetContent | top · right · bottom · left 네 방향 | 실패 |
| `className="shadow-none"` | 토큰 그림자를 대체 | 통과(HEAD 의 `shadow-md` 도 대체되므로 이 건은 `cn` 회귀용) |
| 소스 검사 | 두 패키지 소스 문자열 중 `z-50` · `z-[n]` · `fixed` 와 고정 그림자를 함께 가진 것 0건. 파일 30개 초과 · 떠 있는 레이어 문자열 5개 초과를 함께 단언(0건이 측정 실패가 아님을 확인) | 실패(4건 검출) |

## 4. 브랜드 · 테마별 box-shadow 계산값

토큰 값은 `packages/axis-tokens/dist/css/variables.css` · `css/brands/ontology.css`(측정), 종전 값은 Tailwind 3.4.19 + AXIS preset · Tailwind 4.1.13 + `tailwind4.css` 로 `shadow-md` · `shadow-lg` 를 생성해 읽었어요(측정, 두 버전 값 같음). tokens dist 의 브랜드는 기본과 ontology 둘이에요.

| 브랜드 · 테마 | 변경 후(네 컴포넌트 공통) | 변경 전 Popover · DropdownMenu Content | 변경 전 SubContent · Sheet |
|---|---|---|---|
| 기본 · 밝은 | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | 변경 후와 같음 |
| 기본 · 어두운 | 위와 같음 | 위와 같음 | 변경 후와 같음 |
| ontology · 밝은 | `0 8px 24px rgba(17,20,24,.10)` | 기본 · 밝은과 같음(브랜드 무관) | `0 10px 15px -3px …`(브랜드 무관) |
| ontology · 어두운 | `0 8px 24px rgba(0,0,0,.50)` | 기본 · 밝은과 같음 | 위와 같음 |

### 4.1 브라우저 실측

`turbo build --force` 로 만든 `apps/web/out` 을 `python3 -m http.server 3101` 로 띄우고 Playwright chromium 으로 `/components/popover/` · `/components/dropdown-menu/` · `/components/sheet/` 의 트리거를 눌러 연 요소의 `getComputedStyle().boxShadow` 를 읽었어요. 브랜드는 `<html data-brand="ontology">`, 테마는 `<html class="dark">` 로 바꿨어요(12조합 측정).

| 브랜드 · 테마 | Popover · DropdownMenu · Sheet 계산값(앞 두 레이어는 ring 자리 `rgba(0, 0, 0, 0) 0px 0px 0px 0px`) |
|---|---|
| 기본 · 밝은 / 어두운 | `rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.1) 0px 4px 6px -4px` |
| ontology · 밝은 | `rgba(17, 20, 24, 0.1) 0px 8px 24px 0px` |
| ontology · 어두운 | `rgba(0, 0, 0, 0.5) 0px 8px 24px 0px` |

- DropdownMenuSubContent 는 문서 페이지에 예제가 없어 브라우저로 재지 않았어요(미측정). 같은 클래스라 계산값도 같다고 봐요(추정, 클래스 일치는 3절 단위 테스트로 측정).

## 5. Tailwind 3 · 4 클래스 생성

컴포넌트별 dist 디렉터리 하나만 스캔하게 해서 그 파일만으로 클래스가 생기는지 봤어요(측정).

| 스캔 대상 | Tailwind 3.4.19(`content`, AXIS preset) | Tailwind 4.1.13(`@import "tailwindcss" source(none)` + `@source`) |
|---|---|---|
| `dist/popover` | 토큰 규칙 1 · 고정 0 | 토큰 1 · 고정 0 |
| `dist/dropdown-menu` | 토큰 1 · 고정 0 | 토큰 1 · 고정 0 |
| `dist/sheet` | 토큰 1 · 고정 0 | 토큰 1 · 고정 0 |
| `dist/switch`(양성 대조) | 토큰 0 · 고정 1 | 토큰 0 · 고정 1 |

- 배포 진입점 `@import "@axis-ds/ui-react/tailwind.css"`(`@source "./dist"`)로 전체를 스캔한 Tailwind 4 출력에도 `.shadow-\[shadow\:var\(--axis-shadow-lg\)\]` 가 있어요.
- 문서 · 스토리 · 스냅샷: 레포에 스토리 · 스냅샷 파일이 없고, `docs/` · `apps/web` 문서에 네 컴포넌트의 그림자 클래스를 설명한 곳이 없어요(grep 측정). 레지스트리에 네 컴포넌트가 없어 `r/` 재생성도 없어요. 빌드가 바꾼 `public/templates/*.json` 은 `updatedAt` 만 바뀌어 되돌렸어요.

## 6. 품질 게이트

| 명령 | 결과 |
|---|---|
| `turbo build --force` | 8/8, Cached 0 |
| `turbo type-check lint test --force` (기본 동시 실행) | 1회차 실패: `@axis-ds/ui-react#test` 의 `fix-cva-dts.test.mjs` 「d.ts 0개」. 같은 실행 안에서 agentic-ui type-check 의 `^build` 가 ui-react 빌드(tsup 이 dist 를 지우고 다시 씀)를 돌리는 동안 테스트가 dist 를 읽은 경합이에요. 단독 `turbo test --force --filter=@axis-ds/ui-react` 는 vitest 204 + fix-cva-dts 7 통과, Cached 0 |
| `turbo type-check lint test --force --concurrency=1 --continue` | 23/24, Cached 0. 실패 1건은 `@axis-ds/cli` `template-check.test.ts` WI-0104 AC3 의 5초 시간 초과(5,919ms). 단독 `turbo test --force --filter=@axis-ds/cli` 는 1354 통과. cli 는 ui-react 소스를 쓰지 않아 이번 변경과 관계없는 부하 시간 초과로 봐요 |
| ui-react · agentic-ui vitest | 204 통과(17파일) · 148 통과(12파일) |
| `pnpm pack-smoke` | rc 0 |
| `pnpm check-changeset-mcp-tokens` | rc 0(19 pass) |
| `pnpm changeset status` | ui-react 1.8.5 · agentic-ui 1.8.5(내부 의존 patch, linked) · axis-nextjs-example 0.1.20 |
| 추가 줄 U+2014 | 0건(203줄). 양성 대조: 같은 검사로 추적 파일 63개에서 검출 |
