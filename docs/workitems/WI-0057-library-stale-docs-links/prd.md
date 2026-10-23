# WI-0057: library 데이터의 낡은 agentic 항목 · 문서 링크 404 정리 PRD

> 작성일: 2026-10-23 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0057 | GitHub: #155 | 우선순위: P3 | 상태: Approved (2026-10-23 결정 반영)
> 기준: `main` 8a8cd5b (`@axis-ds/cli` 1.5.1 · `@axis-ds/mcp` 1.2.3 · linked 4패키지 1.5.0)
> 관련: WI-0056(#151) 검증에서 분리. 사이트 주소는 `https://axis-design-system.pages.dev`(WI-0056 D1)

---

## 1. 개요

### 1.1 생성 경로 (실측)

| 단계 | 위치 | 동작 |
|---|---|---|
| 수집 | `axis library collect [-s <source>]` (`packages/axis-cli/src/index.ts`) | `LibraryCurator.collectAll` 후 `generateIndex` · `saveIndex`. 중간 산출물은 `.claude/data/library/components.json` |
| 배치 | `axis library publish [--clean]` (`publisher.ts`) | 중간 산출물을 읽어 `apps/web/public/library/` 에 `index.json` · `meta.json` · `search-index.json` · `categories/*.json` · `components/<slug>.json` 을 씀. `--clean` 이 없으면 기존 파일을 지우지 않음 |
| 소비 | `apps/web/src/app/library/**` | `page.tsx` · `category-content.tsx` 가 `/library/index.json` 을 fetch, 상세는 `/library/components/<slug>.json`. `[category]/[slug]/page.tsx` 의 `generateStaticParams` 가 빌드 때 `index.json` 으로 정적 경로를 만듦. 상세 화면은 `source.url` 이 있을 때만 문서 링크를 그림 |

- 커밋 이력: `d4680ed`(2026-01-23, 최초 생성) → `8dc2309`(2026-02-01, axis UI 15개 · index.json 손수정) → `149dfd4` · `f465d2b` · `8253a82` → `6b61f24`(2026-10-23, WI-0056 호스트 치환 44파일). 1월 이후 수집기로 다시 만든 적이 없어요
- 중간 산출물 `.claude/data/library/` 는 메인 체크아웃에도 없어요(`ls` 실측). 지금 데이터를 수집기로 그대로 재현할 수단이 저장소에 남아 있지 않아요
- 이 데이터를 읽는 다른 곳: 없음(`apps/web/src/app/library/**` 3파일 · cli `publisher.ts` · `index.ts` 만, grep 실측). mcp 는 읽지 않아요
- `guidance.test.ts` 는 이 데이터를 「외부 소스에서 수집한 데이터라 손으로 고치지 않습니다(별도 WI)」로 스캔에서 빼 두었어요. 이 WI 가 그 별도 WI 예요

### 1.2 문제 (실측, 2026-10-23)

**링크 전수**: `apps/web/public/library/**` 의 URL 107개 중 링크 103개(pages.dev 42 · ui.shadcn.com 47 · monet.design 14)를 GET(리다이렉트 추적)으로 확인했어요. 코드 본문 안의 예시 값 4개(w3.org 네임스페이스 · example.com 2 · festa.io)는 링크가 아니라 제외했어요.

| 호스트 | 200 | 404 | 비고 |
|---|---|---|---|
| axis-design-system.pages.dev | 35 | 7 | 200 은 모두 끝 `/` 리다이렉트 1회 |
| ui.shadcn.com | 47 | 0 | 47개 모두 리다이렉트. 46개는 `/docs/components/base/<이름>`, form 은 `/docs/forms` |
| www.monet.design | 14 | 0 | |

대조군: `/agentic/agent-avatar` 200, `/agentic/__no_such_page__` 404, `ui.shadcn.com/docs/components/__no_such__` 404 로 판정이 404 를 낼 수 있음을 먼저 확인했어요.

**404 7개와 원인**

| slug | 원인 |
|---|---|
| activity-preview-card · agent-run-container · collector-health-bar · file-upload-zone · seminar-chat-panel · step-indicator | 2026-01-23 당시 `apps/web/src/app/agentic/<slug>/page.tsx` 데모 페이지를 수집기 `scanWebDirectory` 가 컴포넌트로 잡은 것. 그 페이지는 나중에 `(docs)` 라우트 그룹으로 옮기며 사라졌어요. 담긴 코드는 컴포넌트가 아니라 `page.tsx` 이고 지금 없는 `@ax/ui` 를 import 해요 |
| approval-card | 컴포넌트(`packages/axis-agentic-ui/src/approval-card`)와 레지스트리(`agentic-approval-card`)는 있지만 문서 페이지가 `/agentic/approval-dialog` 예요. 수집기 `getDocsUrl` 이 slug 그대로 `/agentic/<slug>` 를 만들어요 |

**이름 대응 전수**: 소스 디렉터리(index.tsx 보유)와 `(docs)` 라우트(page.tsx 보유)를 대조하면 ui-react 30 ↔ components 30 은 완전 일치, agentic-ui 18 ↔ agentic 18 은 `approval-card` ↔ `approval-dialog` 1쌍만 달라요.

**함께 드러난 것 (#155 본문 밖)**

| # | 내용 | 실측 |
|---|---|---|
| E1 | `approval-dialog` 항목도 데모 페이지 출신이에요. 링크는 200 이지만 코드가 `page.tsx`(`@ax/ui` import, 문서 페이지 안의 Mock) | 코드 경로가 `page.tsx` 인 항목은 위 6개와 이것까지 7개 |
| E2 | 소스에 있는데 library 에 없는 컴포넌트 13개: alert · avatar · progress · skeleton · tooltip · attachment-card · code-block · context-panel · diff-viewer · feedback-buttons · message-bubble · plan-card · token-usage-indicator | 소스 48 - library axis 정상 항목 35 |
| E3 | axis 항목 35개의 코드 스냅샷이 지금 소스와 35/35 다름(1~2월 판) | 파일 단위 문자열 비교. button 은 JSDoc 등 6줄 차이를 diff 로 확인 |
| E4 | slug 충돌 10개(badge · button · card · dialog · input · label · select · separator · tabs · toast): index.json 에는 shadcn · axis 가 둘 다 있는데 `components/<slug>.json` 은 하나라 axis 가 덮어써요. 예: `/library/data-display/badge`(shadcn) 상세에 axis 코드가 나와요 | index 108 항목 vs components 98 파일 |
| E5 | 수집기를 지금 그대로 돌리면(axis 만 오프라인 시험 실행, 쓰기 없음) 49개가 나오고 ① `a11y.test.tsx` 가 `a11y-test` 항목으로 잡히고 ② 컴포넌트 코드에 `*.test.tsx` 가 섞이고 ③ approval-card 는 여전히 `/agentic/approval-card` ④ 웹 스캔 경로 `apps/web/src/app/{components,agentic}` 는 없어져 조용히 0건이에요 | vite-node 로 `AxisCollector` 실행 |
| E6 | `library collect -s axis` 도 `generateIndex` 가 소스 인자를 무시하고 전체 수집기를 돌려 ui.shadcn.com 에 접속해요. 그리고 shadcn `/r/index.json` 이 이제 배열을 돌려줘(65개) 수집기의 `data.items` 접근이 실패하고 기본 목록으로 빠져요 | 코드 확인 + GET 1회(200, 60KB, 배열) |

### 1.3 결정 (2026-10-23 사용자, 모두 권장안 ①)

| # | 결정 |
|---|---|
| D1 | 수집기를 고친 뒤 AXIS 항목만 오프라인으로 다시 만듭니다. shadcn · monet 항목은 그대로 둡니다 |
| D2 | `approval-dialog` 항목(E1)은 지웁니다. approval-card 가 같은 문서로 링크합니다 |
| D3 | 문서 URL 은 `(docs)` 라우트 실재를 확인하고, 없으면 별칭 표(`agentic/approval-card → agentic/approval-dialog`)를 보고, 둘 다 없으면 비웁니다 |
| D4 | 오프라인 검사(사이트 링크 ↔ 라우트 실재 + library 파일 간 정합)를 CI 에 넣고, 외부 링크 네트워크 검사는 수동 스크립트로 둡니다 |
| D5 | `@axis-ds/cli` patch changeset |
| D6 | slug 충돌(E4)은 범위 밖입니다(Master 가 별도 WI 등록) |

### 1.4 구현하며 정한 것 (사용자 결정 아님, 검토 대상)

| # | 내용 | 근거 |
|---|---|---|
| I1 | 재생성 명령은 cli 의 `axis library refresh-axis` 이고, 루트 `pnpm library:refresh-axis` 가 cli 를 빌드한 뒤 실행합니다 | 기존 `library collect` 는 `generateIndex` 가 소스 인자를 무시해 원격에 접속하고(E6), 중간 산출물이 없어 기존 데이터와 합칠 수 없습니다 |
| I2 | AXIS 항목 카테고리는 패키지로 정합니다(ui-react → `ui`, agentic-ui → `agentic`). 2026-02-01 손수정으로 form · navigation · overlay · data-display 에 들어가 있던 AXIS 10개도 `ui` 가 됩니다 | 수집기의 종전 규칙(`collectComponent` 가 패키지 카테고리로 덮어씀)과 같습니다. library URL 은 `/library/form/checkbox` → `/library/ui/checkbox` 로 바뀌지만, 옛 경로는 같은 slug 의 shadcn 항목이 남아 404 가 되지 않습니다 |
| I3 | 외부 항목이 index · search-index · categories 중 일부에만 있으면 다른 파일의 같은 항목에서 같은 형태로 채웁니다. 2026-02-01 손수정으로 index.json 에서 빠진 shadcn 15개가 index.json 에 돌아옵니다 | D4 정합 검사의 전제입니다. 채운 값은 categories 의 같은 항목과 필드 단위로 같습니다(실측 불일치 0) |
| I4 | `components/<slug>.json` 은 지금 소유자를 유지합니다. 새 AXIS 항목 5개(alert · avatar · progress · skeleton · tooltip)는 shadcn 파일과 slug 가 겹쳐 파일을 쓰지 않습니다 | 외부 파일 바이트 불변(D1)을 지키려는 것입니다. 이 5개의 library 상세 화면은 shadcn 코드를 보여 줍니다(E4 와 같은 결함, 범위 밖) |
| I5 | 설명은 컴포넌트 이름 선언 바로 앞 JSDoc 첫 줄을 먼저 씁니다 | 종전 규칙(파일 첫 JSDoc)으로 재생성하면 「Badge 컴포넌트 Props」 같은 설명이 나왔습니다 |
| I6 | updatedAt: 내용이 같으면 기존 값 유지, 바뀐 항목만 `--updated-at`(기본: 오늘 KST 날짜의 00:00Z). index · meta 의 updatedAt 은 항목 최댓값 | 같은 소스로 다시 돌리면 파일이 하나도 바뀌지 않습니다(실측) |

## 2. 요구사항

- FR-1 수집기 문서 URL: `resolveDocsUrl` 이 `apps/web/src/app/(docs)/<route>/<slug>/page.tsx` 실재를 확인하고, 없으면 `DOCS_SLUG_ALIASES` 의 대상이 실재할 때 그 경로, 둘 다 없으면 빈 문자열을 씁니다(상세 화면은 링크를 숨김). route 는 패키지로 정합니다(ui-react → components, agentic-ui → agentic)
- FR-2 수집기 스캔 정리: 데모 페이지 스캔을 없애고, 패키지 src 바로 아래 index.tsx 가 있는 디렉터리만 컴포넌트로 봅니다. 코드 파일에서 `*.test.*` · `*.spec.*` · `*.stories.*` 를 빼고 이름순으로 정렬합니다
- FR-3 데이터: `axis library refresh-axis` 로 AXIS 항목을 다시 만듭니다. 낡은 7개(D2 포함)를 지우고, 외부 컴포넌트 파일은 바이트 그대로, 집계 파일 속 외부 항목은 객체 그대로 둡니다
- FR-4 검사: `scripts/check-library-links.mjs`(오프라인, CI) 와 `scripts/check-library-remote-links.mjs`(네트워크, 수동)
- FR-5 수집기 · 재생성 테스트: 실제 저장소 루트와 픽스처로 FR-1 · FR-2 · FR-3 을 고정하고, 수정 전 수집기에서 실패함을 확인합니다

## 3. 해결안 비교 (1단계 기록)

| 안 | 외부 원격 | 결정성 | 변경 규모 | 남는 문제 |
|---|---|---|---|---|
| ① axis 부분 재생성 (채택) | 없음(AxisCollector 는 파일만 읽음) | `updatedAt` 시각 외 결정적. 시각은 고정값 주입 또는 기존 값 유지로 해결 | axis 항목 48개 파일 + 인덱스 4종 | E4(별도) |
| ② 국소 수정 | 없음 | 결정적 | 7~8개 파일 삭제 + 인덱스 4종 + 1개 URL | E2 · E3 남음, 데이터가 여전히 손수정 |
| ③ 전체 재수집 | ui.shadcn.com(스키마가 바뀌어 기본 목록으로 빠짐, E6) | 비결정적(원격 상태 · 시각) | 거의 모든 파일 | shadcn 항목 내용이 원격 상태에 따라 바뀜 |

- 게이트: 오프라인 라우트 검사를 1단계 데이터로 시험하면 35 통과 · 7 실패로 네트워크 결과와 정확히 같았어요. 외부 링크(shadcn · monet)는 원격 상태에 따라 흔들리므로 CI 에 넣지 않아요

## 4. 수용 기준

- AC1 library 데이터의 사이트 링크 전수가 200(GET, 대조군 포함)
- AC2 오프라인 검사가 main 데이터에서 라우트 7건 실패(음성 대조), 수정 데이터에서 0건
- AC3 `index.json` · `search-index.json` · `categories/*` · `components/*` 항목 집합 일치, `index.json` · `meta.json` 통계가 실제 개수와 일치
- AC4 수집기 테스트: approval-card 문서 URL 이 `/agentic/approval-dialog`, 테스트 파일 · `a11y-test` 항목 없음. 수정 전 코드에서 테스트가 실패함을 확인(변이)
- AC5 재생성 전후 외부 컴포넌트 파일 sha256 불변, 집계 파일 속 외부 항목 객체 불변, 같은 소스로 다시 돌리면 쓰는 파일 0개
- AC6 기존 게이트(type-check · lint · build · test · test:registry · cli-smoke · pack-smoke) 캐시 우회 통과, web 빌드의 library 정적 경로가 index 전 항목을 덮음

## 5. 범위 밖

- slug 충돌(E4, I4 의 5개 포함): 별도 WI(D6)
- shadcn · monet 항목의 재수집과 외부 링크의 리다이렉트 정리
- 문서 사이트 라우트 이름 변경
- cli 의 `tsc --noEmit` 기존 오류 20건(library 테스트 2파일 · `template/template-apply.ts`). cli 에는 type-check 스크립트가 없어 게이트 밖입니다. 이 WI 는 `publisher.ts` 의 기존 오류 1건(없는 필드 `dependencies` 참조)만 없앴습니다
