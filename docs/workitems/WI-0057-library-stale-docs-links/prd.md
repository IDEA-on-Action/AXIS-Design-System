# WI-0057: library 데이터의 낡은 agentic 항목 · 문서 링크 404 정리 PRD

> 작성일: 2026-10-23 | 버전: v0.1 (초안) | 작성자: Sinclair Seo | WI: WI-0057 | GitHub: #155 | 우선순위: P3 | 상태: Draft (결정 대기)
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

### 1.3 결정 (결정 대기)

| # | 질문 | 선택지(첫 번째가 권장안) |
|---|---|---|
| D1 | 데이터 정리 방식 | ① axis 부분만 재생성(수집기 고친 뒤 오프라인 실행, shadcn · monet 항목은 지금 값 유지) ② 국소 수정(7개 삭제 + approval-card URL 만 고침) ③ 전체 재수집(`collect` + `publish --clean`) |
| D2 | `approval-dialog` 항목(E1) | ① 삭제(approval-card 가 같은 문서로 링크) ② 유지(링크 200) |
| D3 | 수집기 문서 URL 규칙 | ① `(docs)` 라우트 실재 확인 + 별칭 표(`approval-card → approval-dialog`), 둘 다 없으면 URL 생략 ② 별칭 표만 ③ 문서 라우트를 `approval-card` 로 옮김 |
| D4 | 링크 검사 게이트 | ① 오프라인 검사를 CI 에(pages.dev URL ↔ `(docs)` 라우트 실재 + library 파일 간 정합) ② 오프라인 검사 + 외부 링크 네트워크 검사는 수동 스크립트 ③ 게이트 없음 |
| D5 | 릴리스 | ① `@axis-ds/cli` patch changeset ② changeset 없이 다음 cli 릴리스에 함께 ③ 수집기는 고치지 않음(데이터만) |
| D6 | slug 충돌(E4) | ① 별도 WI 로 분리 ② 이 WI 에 포함 |

권장 근거는 3절 「해결안 비교」에 있어요.

## 2. 요구사항 (권장안 기준 초안, 결정에 따라 바뀜)

- FR-1 수집기 문서 URL: `getDocsUrl` 이 `apps/web/src/app/(docs)/<route>/<slug>/page.tsx` 실재를 확인하고, 없으면 별칭 표를 보고, 그래도 없으면 `source.url` 을 비워요(상세 화면은 링크를 숨김) (D3 결정 대기)
- FR-2 수집기 스캔 정리: 데모 페이지 스캔(`scanWebDirectory`)을 없애고, 패키지 루트의 단일 파일(`a11y.test.tsx` 등)과 `*.test.*` · `test-utils` · `constants` 를 컴포넌트에서 빼요 (D1 결정 대기)
- FR-3 데이터: 낡은 6개(+ D2 에 따라 approval-dialog) 를 `components/` · `index.json` · `search-index.json` · `categories/agentic.json` · `meta.json` 통계에서 함께 지우고 approval-card URL 을 `/agentic/approval-dialog` 로 맞춰요. D1 ① 이면 axis 항목 전체를 지금 소스로 다시 만들고(E2 · E3 해소) shadcn · monet 항목은 바이트 그대로 둬요 (결정 대기)
- FR-4 검사: pages.dev URL 마다 `(docs)` 라우트가 있는지, `index.json` · `search-index.json` · `categories/*` · `components/*` 의 항목 집합이 맞는지 보는 오프라인 스크립트 (D4 결정 대기)
- FR-5 수집기 테스트: 실제 저장소 루트로 `AxisCollector` 를 돌려 모든 문서 URL 이 실재 라우트를 가리키고, 테스트 파일 · 단일 파일 항목이 없음을 확인해요

## 3. 해결안 비교

| 안 | 외부 원격 | 결정성 | 변경 규모 | 남는 문제 |
|---|---|---|---|---|
| ① axis 부분 재생성 | 없음(AxisCollector 는 파일만 읽음) | `updatedAt` 시각 외 결정적. 시각은 고정값 주입 또는 기존 값 유지로 해결 | axis 항목 48개 파일 + 인덱스 4종 | E4(별도) |
| ② 국소 수정 | 없음 | 결정적 | 7~8개 파일 삭제 + 인덱스 4종 + 1개 URL | E2 · E3 남음, 데이터가 여전히 손수정 |
| ③ 전체 재수집 | ui.shadcn.com(스키마가 바뀌어 기본 목록으로 빠짐, E6) | 비결정적(원격 상태 · 시각) | 거의 모든 파일 | shadcn 항목 내용이 원격 상태에 따라 바뀜 |

- ① 을 권장해요. 「생성물은 생성기로」라는 `guidance.test.ts` 의 원칙과 맞고, 고친 수집기를 실제로 한 번 돌려 FR-1 · FR-2 를 검증하는 효과가 있어요. 현재 CLI 는 소스 하나만 골라 기존 데이터와 합치는 경로가 없어서(E6, 중간 산출물 없음) 2단계에서 합치는 방법(CLI 옵션 또는 유지보수 스크립트)을 정해야 해요
- ② 는 가장 작고 안전하지만 library 화면이 1~2월 코드를 계속 보여 줘요(E3)
- 게이트: 오프라인 라우트 검사를 지금 데이터로 시험하면 35 통과 · 7 실패로 네트워크 결과와 정확히 같았어요. 네트워크 없이 결정적이라 CI 에 넣을 수 있어요. 외부 링크(shadcn · monet)는 원격 상태에 따라 흔들리므로 CI 에는 넣지 않는 것을 권장해요

## 4. 수용 기준 (초안)

- AC1 library 데이터의 pages.dev 링크 전수가 200(배포 뒤 GET, 대조군 포함)
- AC2 오프라인 검사 스크립트가 지금 main 데이터에서 7건 실패(음성 대조), 수정 데이터에서 0건(양성)
- AC3 `index.json` · `search-index.json` · `categories/*` · `components/*` 항목 집합 일치, `meta.json` 통계가 실제 개수와 일치
- AC4 수집기 테스트: approval-card 문서 URL 이 `/agentic/approval-dialog`, 테스트 파일 · `a11y-test` 항목 없음. 수정 전 코드에서 테스트가 실패함을 확인(변이)
- AC5 기존 게이트(type-check · lint · build · test · test:registry · cli-smoke · pack-smoke · registry-install-smoke) 통과

## 5. 범위 밖 (초안)

- slug 충돌(E4)은 D6 결정에 따름(권장: 별도 WI)
- shadcn · monet 항목의 재수집과 외부 링크의 리다이렉트 정리
- 문서 사이트 라우트 이름 변경(D3 ③ 을 고르지 않으면)
