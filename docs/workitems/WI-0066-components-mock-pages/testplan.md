# WI-0066 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-25 | 기준: main 778e1dd + 이 브랜치 변경(미커밋 작업본에서 측정, 측정 뒤 페이지 코드는 바꾸지 않음)
> 표기: **측정** = 이번에 실행해 얻은 값, **브리프** = 배치 3 브리프 스크래치 측정(a1a32ca, WI-0071 이전), **추정** = 확인하지 않은 해석
> 수정 전(before) 은 같은 worktree 에서 4파일만 HEAD 로 되돌려 `pnpm --filter @ax/web build` 한 정적 산출물, 수정 후(after) 는 이 브랜치 산출물이에요. 둘 다 패키지는 같은 빌드(ui-react 1.6.3 소스)예요

## 1. 정적 검사 · 빌드 (측정)

| 게이트 | 결과 |
|---|---|
| 패키지 빌드 `turbo build --force`(tokens · theme · ui-react · agentic-ui · cli · mcp) | rc 0. 새 worktree 에 dist 가 없어 test 가 tokens dist 없음으로 실패하므로 먼저 실행(첫 turbo 실행은 tokens test 3 subtests · agentic-ui 9 files 실패, 원인은 dist 부재) |
| `pnpm turbo type-check lint test build --force` | rc 0, **28/28 tasks, Cached 0/28**(1m49s). tests: tokens 281 · theme 31 · ui-react 126 · agentic-ui 95 · cli 707 · mcp 139 모두 통과, `@ax/web` lint 「No ESLint warnings or errors」 |
| `apps/web` `tsc --noEmit` | rc 0, 출력 0줄. 양성 대조: `components/skeleton/__probe.ts` 에 `const x: number = 'a'` 를 넣으면 TS2322 1건 검출, 지운 뒤 디렉터리에 page.tsx 만 남음 확인 |
| 미사용 import (lint 가 잡지 않음, WI-0058 과 같음) | 4페이지 import 이름마다 본문 출현 2회 이상인지 grep: 미사용 0건. 양성 대조: skeleton 사본에 `Badge` 를 import 에만 넣으면 `UNUSED probe Badge` 검출 |
| 빌드 churn | 빌드가 바꾼 `apps/web/public/templates/*.json` 5개(updatedAt 1줄씩), `build:registry` 가 바꾼 `public/r/index.json` · `registry.json` 의 version 필드(1.5.0 → 1.6.3)는 이 변경과 무관해 되돌렸어요(version 유지는 WI-0052 선례) |

## 2. AC1 mock 제거 (측정)

| 대상 | 페이지 안 mock 정의(`// Mock` 또는 `const <대문자> = (`) | `@axis-ds/ui-react` 실컴포넌트 import |
|---|---|---|
| 이 브랜치 | 0/4 | 4/4 (avatar `Avatar`, alert `Alert` · `AlertDescription` · `AlertTitle`, skeleton `Skeleton`, tooltip `Tooltip` · `TooltipContent` · `TooltipProvider` · `TooltipTrigger`) |
| 음성 대조: HEAD | 4/4 (`git diff` 삭제 줄에 각 파일 `// Mock` 블록) | 0/4 (tooltip 은 `Button` 만) |

변경 줄 수(`git diff --stat`): avatar 45 · alert 30 · skeleton 6 · tooltip 22, 합계 +4 −99. 브리프 수치와 같아요.

## 3. AC3 CI run 단계 (측정, `frontend.yml` 순서)

| 단계 | 결과 |
|---|---|
| `pnpm check-token-refs` | rc 0, 다크 완전성 :root 263 · .dark 263 · 미반영 0, 위반 0건 |
| `pnpm check-contrast-pairs` | rc 0, 검사 파일 21 · 소스 짝 15 · 표 짝 15, 위반 0건 |
| `pnpm check-types-versions` | rc 0, tests 8 · pass 8 |
| `pnpm check-library-links` | rc 0, 사이트 링크 48 · 항목 129 · 컴포넌트 파일 99, 위반 0건 |
| `pnpm build:registry` | rc 0, 30개 항목, G1 통과 |
| `pnpm test:registry` | rc 0, tests 45 · pass 45 |
| `pnpm check-licenses` | rc 0, 통과 |
| `pnpm pack-smoke` | rc 0, 「퍼블리시 대상 6개 패키지 전부 통과」(CI 가드의 개수 1 이상 조건 충족), pack-install-smoke · G2 RSC 통과 |
| `pnpm cli-smoke` | rc 0, OK |
| `pnpm registry-install-smoke` | rc 0, `[g2] 5/5 통과`(항목 94.5s) |
| E2E a11y (`CI=1 E2E_SERVER=static`) | rc 0, expected 40 · unexpected 0 · flaky 0 · skipped 0, 조합별 default/light · default/dark · ontology/light · ontology/dark 각 10건 |
| E2E nontext | rc 0, 8 · 0 · 0 · 0 |
| E2E demo | rc 0, 8 · 0 · 0 · 0 |
| E2E tokens | rc 0, 22 · 0 · 0 · 0 |

E2E 건수는 CI 의 실행 건수 가드와 같은 jq 식으로 JSON 리포트에서 읽었어요(기대 a11y 40 · nontext 8 · tokens 22 · demo 8 과 일치). 교체한 4페이지는 게이트 PAGES 에 없어요(D2). 그래서 이 게이트 통과는 「사이트 나머지가 깨지지 않았다」는 근거이고, 4페이지 판정은 4절 측정이 근거예요.

## 4. AC4~AC6 교체 전 · 후 측정 (측정)

- 방법: 측정 전용 임시 spec 3개(브리프 `measure66.spec.ts` 그대로 + 키보드 · 외부 이미지 차단 spec + 툴팁 시간 흐름 spec, 커밋하지 않음)를 고유 포트 3166 정적 서버, workers 1 로 실행. axe `wcag2a · wcag2aa · wcag21a · wcag21aa`, `nextjs-portal` 제외
- 실행: before · after 각 20 tests 통과, 기록 36행씩(tooltip 은 초기 · 키보드 · 호버, skeleton · progress 는 초기 · motion)
- 미측정이 아님: 72행 모두 passes ≥ 24. 브랜드 양성 대조: default 행은 `data-brand` 없음 · `--axis-button-bg-default` rgb(37,99,235), ontology 행은 `data-brand="ontology"` · rgb(50,106,218)(라이트) / rgb(107,152,240)(다크). 다크 행은 `html.dark` 참
- 콘솔 · 페이지 오류: 72행 모두 0건

### 4.1 위반 · passes (기본 · ontology x 라이트 · 다크, 초기 상태)

| 페이지 | default 라이트 | default 다크 | ontology 라이트 | ontology 다크 | before 와 비교 |
|---|---|---|---|---|---|
| avatar | 위반 0 · passes 25 | 0 · 25 | 0 · 25 | 0 · 25 | 같음 |
| alert | 0 · 24 | 0 · 24 | 0 · 24 | 0 · 24 | 같음 |
| skeleton | 0 · 24 | 0 · 24 | 0 · 24 | 0 · 24 | 같음 |
| tooltip | 0 · 24 | 0 · 24 | 0 · 24 | 0 · 24 | 같음 |
| progress (대조군, 바꾸지 않음) | 0 · 25 | 0 · 25 | 0 · 25 | 0 · 25 | 같음 |

- tooltip 호버 상태(after): 4조합 모두 위반 0 · passes 26 · `role="tooltip"` 생성. before 는 4조합 모두 `role="tooltip"` 0(mock 은 role 이 없음), passes 24
- 판정 보류(axe incomplete): 호버로 툴팁을 연 상태에서 사이드바 링크 color-contrast incomplete after 6 · before 7(4조합 같음). 공통 레이아웃이 가려져 배경을 판정하지 못하는 것이고 수정 전에도 있어요. 위반 0 이 이 부분까지 무결하다는 뜻은 아니에요
- 대비 축에서 mock 이 가리던 결함은 이 4페이지에 없었어요(브리프와 같은 결론)

### 4.2 AC5 skeleton 움직임 줄이기 (측정)

| | 정적 HTML `motion-reduce:![animation-duration:5s]` | 정적 HTML `animate-pulse` | 일반 모드 실행 중 애니메이션 | reduce 에뮬레이션 |
|---|---|---|---|---|
| before (mock) | 0 | 15 | pulse@2s 15 | **pulse@2s 15** (줄지 않음) |
| after (패키지 Skeleton) | 15 | 15 | pulse@2s 15 | **pulse@5s 15** |
| 대조군 progress (before · after 같음) | - | - | progress-indeterminate@1.5s 1 | progress-indeterminate@4s 1 |

- 4조합 모두 같은 값이에요. 기대(D3, 검토 지적 반영)는 「정지」가 아니라 WI-0071 의 5초 느린 펄스이고, 측정이 기대와 같아요. 브리프(a1a32ca)의 after 는 reduce 에서 0 이었는데, 그 차이는 WI-0071 발행으로 패키지 Skeleton 이 바뀐 것이에요
- 사이트 CSS 에 해당 규칙이 있는지: `out/_next/static/css/*.css` 가운데 `animation-duration\:5s` 를 담은 파일 1개(apps/web tailwind content 가 `packages/axis-ui-react/src` 를 스캔)
- 페이지 안 animate 정의: 0(skeleton/page.tsx 에 `animate-` 문자열은 코드 예시에도 없음, mock 삭제로 사라짐)

### 4.3 AC6 tooltip 키보드 (측정)

키보드 경로: 트리거 앞 포커스 요소(코드 블록 `pre`)에 포커스를 둔 뒤 Tab 1회, `role="tooltip"` 을 1.5초까지 기다림, 0.5초 뒤 다시 확인, Esc.

| | 뷰포트 1280x3000 | 뷰포트 1280x720 |
|---|---|---|
| before (mock) | 열리지 않음(`role="tooltip"` 0, `data-state` 없음) | 열리지 않음 |
| after | 열림 `instant-open` · role 1, 0.5초 뒤에도 `instant-open` · role 1(유지), Esc 뒤 role 0 | 열린 뒤 바로 닫힘(scrollY 322 → 848, 0.5초 뒤 `closed` · role 0) |

- 1280x720 의 닫힘은 화면 밖 트리거로 Tab 이동할 때 스크롤 인투뷰가 일어나 Radix Tooltip 이 scroll(capture)에서 닫히는 패키지 동작이에요. 브리프가 찾은 현상이 같은 수치(scrollY → 848)로 재현됐고, D4 에 따라 WI-0073(#194)에서 다뤄요
- 측정 절차 주의(I2): `focus()` 직후 Shift+Tab · Tab 을 연달아(약 10ms) 누르면 열림 → 닫힘 뒤 다시 열리지 않았어요. 같은 순서를 300ms 간격으로 누르면 다시 열려요(`instant-open` → `closed` → `instant-open`). 그래서 브리프 spec 의 kb-focus 행(4조합 role 0, before · after 모두)은 판정에 쓰지 않았어요. 실제 키보드 사용에서 이 간격이 생기는지는 확인하지 않았어요(추정: 사람의 키 입력 간격으로는 생기지 않음)

### 4.4 AC6 alert · avatar (측정)

| | alert 정적 HTML `surface-info` / `bg-blue-50` | avatar 외부 요청 차단 시(3건 abort) |
|---|---|---|
| before (mock) | 0 / 1 | img 3개 모두 깨짐(naturalWidth 0) |
| after | 1 / 0 | img 0개, 이니셜 폴백 S · V · A |

- 네트워크가 열려 있으면 before · after 모두 github.com 이미지 3개가 정상 로드(외부 요청 6건, 리다이렉트 포함). 외부 이미지 교체는 범위 밖(D1)

## 5. 배포 뒤 확인 (Master, 머지 · Pages 배포 뒤)

- pages.dev `/components/skeleton/` HTML 에 `motion-reduce:![animation-duration:5s]` 15개, `/components/alert/` HTML 에 `surface-info` 1 · `bg-blue-50` 0, tooltip 페이지에서 키보드 포커스 시 `role="tooltip"` 생성(1280x3000 처럼 트리거가 화면 안일 때). avatar 는 정적 HTML 로는 전 · 후가 갈리지 않아요(`/_next/image` 가 before · after 모두 0, mock 이 `unoptimized` 였음) - 외부 이미지 차단 폴백으로 확인해요

## 배포 뒤 재측정 (2026-10-25)

- 대상: npm 발행본 tokens · theme · ui-react · agentic-ui 1.7.0, cli 1.6.1, mcp 1.3.4(run 40137182470, provenance 6/6). 레지스트리에서 설치해 node_modules 의 version 으로 확인했어요.
- 결과: 불일치 0. https://axis-design-system.pages.dev 에서 testplan 5절 항목(skeleton 의 motion-reduce 5s, alert surface-info, tooltip 키보드 열림, avatar 이니셜 폴백)이 모두 일치했어요.
- 원자료: `/tmp/claude-1000/-home-sinclair-work-idea-on-action-AXIS-Design-System/69d8f408-60b9-4bb2-8b0a-d1cb1f9af027/scratchpad/post3`
