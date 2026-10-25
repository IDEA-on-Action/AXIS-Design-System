# WI-0073: Tooltip 이 포커스 스크롤에 닫힘 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` f8a05be + 브랜치 `fix/batch4-a11y`
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 브라우저 E2E (측정)

`apps/web/e2e/tooltip-persistence.spec.ts` 6건. Playwright 1.61.1 Chromium, `E2E_SERVER=static`(이 브랜치 `pnpm --filter @ax/web build` 의 `out/`), 경로 `/components/tooltip/`. 키보드는 실제 Tab 입력이고 `focus()` 를 직접 부르지 않아요.

| # | 시나리오 | 수정 전 빌드 | 수정 뒤 빌드 |
|---|---|---|---|
| 1 | 1280x720 화면 밖 「Hover me」 Tab → scrollY > 0 단언 → 800ms 뒤 `data-state` open · `role=tooltip` 1 · 「Tooltip content」 (AC1) | 실패(`closed`) | 통과 |
| 2 | 1280x720 같은 조건에서 Esc → 닫힘 · 포커스는 트리거 (AC2) | 실패(전제 「열림」 1 이 0) | 통과 |
| 3 | 1280x720 Tab 으로 「Top」 이동 → 「Hover me」 닫힘 · 「Top」 열림 · 툴팁 1개 (AC3) | 통과 | 통과 |
| 4 | 1280x720 hover 로 「Top」 열고 포인터 이탈 → 닫힘, 다시 hover 로 열고(포커스 없음 단언) `scrollBy(0, 40)` → 닫힘 (AC4) | 통과 | 통과 |
| 5 | 1280x3000 5개 트리거를 차례로 Tab, 각각 scrollY 0 · 열림 · 툴팁 1개 (AC5 음성 대조) | 통과 | 통과 |
| 6 | 1280x3000 Esc 닫힘 (AC5) | 통과 | 통과 |

- 수정 전 빌드는 같은 브랜치에서 소스를 고치기 전 ui-react dist 로 만든 `out/` 이에요(웹앱은 `@axis-ds/ui-react` 의 dist 를 씀). 실패 2건이 배치 4 브리프의 배포본 재현(720 에서 스크롤된 트리거 1/1 닫힘 · 나머지 4/4 유지 · 3000 5/5 유지)과 같은 갈래예요. 통과 4건은 정상 닫힘 경로와 음성 대조가 수정 전에도 성립함을 보여요(회귀 판정의 기준선).
- 재현 조건 증명: 1번은 scrollY > 0 을 먼저 단언해요. 스크롤이 안 일어난 환경이면 통과가 아니라 실패예요.
- 수정 뒤 빌드에 새 코드가 들어갔는지: `out/_next/static/chunks` 6파일에 `markDismiss`, `out/components/tooltip/index.html` 에 새 접근성 안내 문구 1건.
- 기존 suite 와의 겹침: `playwright test a11y` · `brand-nontext-contrast` · `brand-demo` 의 `--list` 는 40 · 8 · 8건이고 tooltip-persistence 를 담지 않아요(0 은 목록이 비어서가 아님: 같은 명령이 40 · 8 · 8 을 돌려줌).

## 2. 단위 테스트 (측정)

`packages/axis-ui-react/src/tooltip/tooltip.test.tsx` 13건 통과. jsdom 은 포커스 스크롤을 만들지 않아 `scroll` 이벤트를 직접 보내 같은 경로를 태워요.

| 묶음 | 건수 |
|---|---|
| 포커스 중 문서 · 상위 요소 스크롤에 유지 | 2 |
| 포커스 없이 연 툴팁은 스크롤에 닫힘 | 1 |
| Esc(일반 · 스크롤 플래그가 켜진 같은 태스크) · Esc 뒤 다시 연 툴팁 유지 | 3 |
| 포커스 이동 · 블러 닫힘 | 2 |
| 제어 모드(무시한 닫힘 미전달 · Esc 전달 · `open={false}` 존중) | 2 |
| 소비자 `onEscapeKeyDown` preventDefault 존중 · ref 전달 · 서버 렌더 | 3 |

### 2.1 변이 (측정)

원본 `src/tooltip/index.tsx` sha256 `6631305c…abbe3` 를 스크래치에 백업하고 하나씩 주입한 뒤 매번 복원해 같은 sha 를 확인했어요.

| 변이 | 결과 |
|---|---|
| 닫힘 무시 조건을 끔(`if (false && …)`, 사실상 Radix 원래 동작) | 4 실패(포커스 중 스크롤 유지 2 · Esc 뒤 재열기 유지 · 제어 모드) |
| 명시 닫힘 표시를 끔(`markDismiss` 가 false 를 씀) | 1 실패(스크롤 플래그가 켜진 같은 태스크의 Esc) |
| 포커스 조건을 뺌(스크롤 중이면 항상 무시) | 1 실패(포커스 없이 연 툴팁의 스크롤 닫힘) |

## 3. 게이트 (측정)

| 게이트 | 결과 |
|---|---|
| `turbo run lint --force` | 7/7, Cached 0 |
| `turbo run type-check --force` | 11/11, Cached 0 |
| `turbo run build --force` | 8/8, Cached 0. ui-react postbuild 가 처음에 `tooltip` 의 createContext · 인라인 핸들러를 잡아 실패 → `client-modules.mjs` 에 추가 뒤 통과, dist 첫 줄 `"use client"` |
| `turbo run test --force` | 6/6, Cached 0. ui-react 168(12파일) · agentic-ui 95 · theme 47 · cli 738 · mcp 143 |
| 문서 페이지 수정 뒤 `turbo run lint type-check --filter=@ax/web --filter=@axis-ds/ui-react --force` | 7/7, Cached 0 |
| check-token-refs · check-contrast-pairs(위반 0) · check-types-versions · check-library-links(위반 0) | rc 0 |
| build:registry · test:registry | rc 0, test:registry 45 통과. build:registry 는 `version` 을 1.7.0 으로 바꿨고 항목 내용 변경은 없어서 되돌림(1.5.0 유지, WI-0052 선례). 되돌린 뒤 test:registry 45 통과 |
| check-licenses · pack-smoke(퍼블리시 대상 6개 · G2 RSC 통과) · cli-smoke · registry-install-smoke(5/5) | rc 0 |
| E2E static a11y · nontext · demo · tooltip, tokens | 40 · 8 · 8 · 6 · 22 통과 |
| CI 건수 가드 입력 | 로컬 JSON reporter 의 stats: expected 6 · unexpected 0 · flaky 0 · skipped 0 → 가드식 `ok + bad + flaky = 6` 이 기대 6 과 같음(계산) |

## 4. 생성물 (측정)

- `library:refresh-axis`: 변경 1(axis-tooltip, 코드 · 태그 stateful · side-effects 추가), 파일 5개. 재실행 변경 0 · 쓰기 0.
- 레지스트리(`public/r`): tooltip 항목이 없어 내용 변경 0(위 version 되돌림만).
- `public/templates`: 웹 빌드가 updatedAt 만 바꿈(내용 diff 0줄) → 되돌림.

## 5. 남은 확인 (추정)

- Firefox · Safari 실측은 하지 않았어요. 같은 대상 · 같은 단계 리스너의 등록 순서 호출은 DOM 표준 동작이라 같게 동작할 것으로 추정해요.
- 발행본(1.8.0) 기준 재측정은 배포 뒤에 해요(todo 마지막 항목).
