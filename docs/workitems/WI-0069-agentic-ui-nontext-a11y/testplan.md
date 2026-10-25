# WI-0069: agentic-ui · ui-react 비대비 접근성 결함 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 작성일: 2026-10-25 | 기준: `main` f8a05be + 브랜치 `fix/batch4-a11y`(WI-0073 4e17809 뒤)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

## 1. 브라우저 axe (측정)

배치 4 브리프의 `axe-all.mjs` 와 같은 방식(Playwright Chromium + `@axe-core/playwright`, 태그 wcag2a · 2aa · 21a · 21aa, `nextjs-portal` 제외, `networkidle` 뒤 300ms)으로 이 브랜치 정적 빌드(`apps/web/out` 을 127.0.0.1 정적 서버로)를 쟀어요. 실행마다 html 의 `dark` 클래스 · `data-brand` · `--axis-control-h-md`(ontology 34px) 프로브로 브랜드 · 테마가 실제로 적용됐는지 확인했어요(전 실행 일치).

| 측정 | 경로 x 환경 | 실행 | 비대비 위반 노드 | 비대비 incomplete | color-contrast 위반(WI-0062 몫) |
|---|---|---|---|---|---|
| 수정 전 빌드(대상) | 12 x 4 | 48 | **28** | **44** | 44 |
| 수정 뒤 빌드(대상) | 12 x 4 | 48 | 0 | 0 | 44 |
| 수정 뒤 빌드(전 경로) | 정적 53 + 동적 2 x 4 | 220 | 4(아래) | 0 | 기본 라이트 42 · 기본 다크 7 |
| 최종 빌드(대상 + 동적 3) | 15 x 4 | 60 | 0 | 0 | 기본 라이트 37 · 기본 다크 7 |

- 양성 대조: 같은 스크립트가 수정 전 빌드에서 28 · 44 를 잡았고, 경로 · 규칙 · 노드 수가 배치 4 브리프의 배포본 측정(`scratchpad/b4/axe.json`, 212회)과 같아요. 수정 뒤 0 은 측정 경로가 살아 있는 상태의 0 이에요. 모든 실행이 HTTP 200 · passes 20 이상이에요.
- 전 경로 측정의 4노드: `/library/agentic/code-block/` 의 설치 명령 복사 아이콘 버튼 button-name(4환경 각 1). 배포본 pages.dev 같은 경로에도 같은 이름 없는 버튼이 있어(측정) 이번 변경이 만든 것이 아니라 동적 라우트를 처음 재서 드러난 기존 결함이에요. `aria-label` 을 더한 최종 빌드에서 0 이에요.
- 전 경로 color-contrast 42 · 7 은 배포본 브리프 기준선(53경로 기본 라이트 42 · 기본 다크 7)과 같아요. 이 WI 가 대비를 바꾸지 않았다는 회귀 판정이에요. 최종 측정의 37 · 7 은 대상 경로만 센 값이라 범위가 달라요(같은 대상 12경로의 수정 전 값 44 = 37 + 7 과 일치).
- 동적 대표: `/library/agentic/code-block/` · `/library/agentic/message-bubble/`(WI-0060 머지 뒤 `components/<id>.json` 구조) · `/templates/dashboard/`.
- 측정 산출물: `scratchpad/wa11y/w69/before.json` · `after.json` · `after-all.json` · `final.json`, 스크립트 `scratchpad/wa11y/w69/axe-run.mjs`.
- 추정(미측정): 모바일 폭(1024px 미만)의 헤더 「메뉴 열기」 Sheet 트리거. 같은 Sheet 래퍼라 고쳐졌을 것으로 보지만 재지 않았어요.

## 2. 단위 테스트 (측정)

| 파일 | 건수 | 내용 | 수정 전 소스 |
|---|---|---|---|
| agentic `src/time-hydration.test.tsx` | 9 | TZ=UTC `renderToString` → TZ=Asia/Seoul `hydrateRoot`. 양성 대조 2(두 시간대 문자열이 다름), MessageBubble 3 · StepTimeline 4(기본 · timeZone 만 · locale+timeZone · formatTime) | 7 실패(전제 2 통과) |
| agentic `src/a11y.test.tsx` WI-0069 묶음 | 5 | 결함을 드러내는 props 로 axe violations + incomplete 0(MessageBubble status 3종 · DiffViewer · RecoveryBanner onRetry), RecoveryBanner 설명 연결, CodeBlock region · tabIndex · 이름 | 4 실패(설명 연결 통과) |
| ui-react `src/nontext-a11y.test.tsx` | 15 | Dialog · Sheet · Popover x (닫힌 axe · 열고 닫기 · 제어 · defaultOpen), CommandSeparator(role · 검색 중 숨김 · alwaysRender), ScrollArea tabIndex | 8 실패 · 호환 7 통과 |

- 수정 전 소스: 컴포넌트 소스만 `git show HEAD:` 로 되돌리고 새 테스트를 돌린 뒤 백업으로 복원했어요. 결함 단언은 모두 실패하고, 호환 단언(제어 · defaultOpen · 검색 중 숨김 · 설명 연결)은 수정 전에도 통과해 회귀 판정 기준이 돼요.
- 하이드레이션 오류 직접 프로브: 같은 조건(UTC → Asia/Seoul)에서 `onRecoverableError` 건수가 수정 전 MessageBubble 2 · StepTimeline 2(「Text content does not match server-rendered HTML.」), 수정 뒤 0 · 0.
- jsdom 은 overflow 를 계산하지 않아 axe scrollable-region-focusable 이 jsdom 에서 해당 없음이 돼요. CodeBlock · ScrollArea 는 속성으로 고정하고 판정은 1절 브라우저 측정으로 해요.
- 전체: agentic-ui 109 · ui-react 183 통과(turbo test `--force`).

## 3. 정적 검사 · 생성물 (측정)

- `check-contrast-pairs`: diff-viewer 줄 수 마크업이 두 줄 밀려 수정 직후 「부모 바탕 근거 12행 중 위반 2」(fgAt 123 · 126). `ontology-pairs.mjs` 를 125 · 129 로 갱신 뒤 위반 0 · rc 0. 변이(125 → 123 되돌림) rc 1, 복원 rc 0 으로 rc 판정이 살아 있음을 확인했어요.
- postbuild 가드: agentic-ui 「"use client" 18개 파일(목록 9개 x ESM · CJS)」, ui-react 「12개 파일(목록 6개)」.
- `test:registry`: 수정 직후 1 실패(「"use client": client-modules.mjs 목록의 항목만」 기대값이 agentic 만 세어 새 client 모듈 `dialog` 를 몰랐음). 기대값을 ui-react 목록 중 레지스트리 항목이 있는 것까지로 넓히고(0개면 측정 실패로 단언) 45/45 통과.
- `build:registry`: 30항목 중 6개(dialog · agentic code-block · diff-viewer · message-bubble · recovery-banner · step-timeline) sha256 변경, `version` 은 1.5.0 유지(생성기가 1.7.0 으로 쓰는 것을 되돌림, WI-0052 선례). G1 통과.
- `library:refresh-axis`: axis 10항목(code-block · command · dialog · diff-viewer · message-bubble · popover · recovery-banner · scroll-area · sheet · step-timeline) + 색인 · 분류 · 검색 색인, 전체 129.
- `pnpm build` 의 `public/templates` 5파일은 `updatedAt` 한 줄씩만 바뀌어(그 밖의 diff 0줄) 되돌렸어요.

## 4. 게이트 (측정)

| 게이트 | 결과 |
|---|---|
| turbo lint · type-check · build · test 각각 `--force` | rc 0 · 0 · 0 · 0 (Cached 0) |
| check-token-refs · check-contrast-pairs · check-types-versions · check-library-links | rc 0 |
| build:registry · test:registry | rc 0 · rc 0(수정 뒤 재실행) |
| check-licenses · pack-smoke · cli-smoke · registry-install-smoke | rc 0. pack-smoke 퍼블리시 대상 6개, G2 RSC 결함 0(spec 51 · 렌더 267 중 경계 187). registry-install-smoke 대표 5개에 dialog 포함 |
| E2E static a11y · nontext · demo · tooltip · tokens | 40 · 8 · 8 · 6 · 22 통과(CI 건수 가드 기대값과 같음) |

로그: `scratchpad/wa11y/w69/gates/`.
