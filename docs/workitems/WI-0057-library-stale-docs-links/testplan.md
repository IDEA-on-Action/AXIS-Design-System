# WI-0057 테스트 계획 · 결과

> PRD: [prd.md](./prd.md) | 실행일: 2026-10-23 | 기준: main 8a8cd5b

## 1. 단위 테스트

| 대상 | 결과 |
|---|---|
| cli vitest | 17파일 657/657 (`axis-collector.test.ts` 10건 · `axis-refresh.test.ts` 7건 추가) |
| 전체 `turbo run test --force` | 6 tasks, Cached 0, rc 0 (mcp 43 · theme 31 · ui-react 110 · agentic-ui 72 · cli 657) |

수집기 변이: `axis-collector.ts` 를 수정 전 판(8a8cd5b)으로 바꿔 두 테스트 파일을 돌리면 **9건 실패 · 8건 통과(rc 1)** 예요. 실패한 것은 컴포넌트 목록(a11y-test 포함), 루트 단일 파일, 테스트 파일 제외 · 정렬, 문서 라우트 실재, approval-card 별칭, 픽스처 URL 규칙 2건, 설명 추출, 재생성 통합 1건이에요. 원복 뒤 sha256 이 변이 전과 같음(`377eee2e…`)을 확인했어요.

## 2. AC 실측

| AC | 방법 | 결과 |
|---|---|---|
| AC1 링크 200 | `pnpm check-library-links:remote`(GET, 리다이렉트 추적) | 수정 데이터: 링크 109개 모두 2xx(pages.dev 48 · ui.shadcn.com 47 · monet.design 14). 음성 대조 main 데이터: 103개 중 pages.dev 404 7개(rc 1). 1단계 대조군(존재 200 · 없는 경로 404)은 [prd.md](./prd.md) 1.2 |
| AC2 오프라인 검사 | `pnpm check-library-links` | 수정 데이터: 사이트 링크 48 · 항목 129 · 컴포넌트 파일 99 · 카테고리 10, **위반 0건 rc 0**. main 데이터(`--library` 로 메인 체크아웃 지정): **라우트 7건** + 집합 4건 + 통계 2건, 위반 13건 rc 1 |
| AC3 정합 | 위 검사의 집합 · 카테고리 · 파일 · 통계 판정 | 위반 0. index · search-index · categories id 집합 일치, stats 129(shadcn 47 · monet 34 · axis 48) |
| AC4 수집기 | 1절 테스트와 변이 | 통과 / 변이 9건 실패 |
| AC5 외부 항목 불변 | 재생성 전후 스냅샷 비교(scratch 스크립트: 외부 컴포넌트 파일 sha256 · 집계 파일 속 외부 항목 정규화 JSON) | 외부 컴포넌트 파일 56개 sha256 모두 같음. categories 8개 파일 외부 항목 81개 · search-index 81개 변경 0 · 유실 0. index.json 은 외부 66개 변경 0 · 유실 0, 새로 15개(PRD I3), 새 항목은 categories 의 같은 항목과 필드 단위 불일치 0 |
| AC5 결정성 | 재생성 직후 `--updated-at 2027-01-01T00:00:00.000Z` 로 다시 실행(쓰기 모드) | 추가 0 · 변경 0 · 유지 48 · 삭제 0, 파일 쓰기 0개 |
| AC6 게이트 | 아래 3절 | 모두 rc 0, Cached 0 |
| AC6 정적 경로 | `turbo run build --force` 뒤 `apps/web/out/library/<category>/<slug>.html` 대조 | index 의 (category, slug) 124쌍(129항목 중 같은 쌍 5) 누락 0. 지운 `agentic/step-indicator` · `agentic/approval-dialog` 는 생성 안 됨, 새 `ui/alert` · `agentic/plan-card` 는 생성 |

## 3. 게이트 (각각 timeout, 캐시 우회)

| 게이트 | 결과 |
|---|---|
| `turbo run type-check --force` | 8 tasks, Cached 0, rc 0 (38초) |
| `turbo run lint --force` | 4 tasks, Cached 0, rc 0 |
| `turbo run build --force` | 8 tasks, Cached 0, rc 0 (1분 37초). `apps/web/public/templates/*.json` 변경은 `git checkout` 으로 되돌림 |
| `turbo run test --force` | 6 tasks, Cached 0, rc 0 |
| `pnpm test:registry` | 45/45, rc 0 |
| `pnpm cli-smoke` | OK, rc 0 |
| `pnpm pack-smoke` | 퍼블리시 대상 6개, pack-install-smoke OK, rc 0 |

cli 는 `type-check` · `lint` 스크립트가 없어 위 turbo 게이트에 들어가지 않아요. 그래서 `tsc --noEmit -p packages/axis-cli` 를 따로 돌렸어요. 오류는 20건이고 모두 기존 것이에요(library 테스트 2파일 · `template/template-apply.ts`). 기준선(8a8cd5b)은 21건이었고, `publisher.ts` 의 1건이 없어졌어요. 새 파일에서 난 오류는 0건이에요.

## 4. 재생성 기록

```
pnpm library:refresh-axis --updated-at 2026-10-23T00:00:00.000Z
추가 13 · 변경 35 · 유지 0 · 삭제 7
slug 가 외부 항목 파일과 겹쳐 파일을 쓰지 않음(E4): axis-alert, axis-avatar, axis-progress, axis-skeleton, axis-tooltip
파일 쓰기 48개 · 삭제 7개
전체 129개 {"shadcn":47,"monet":34,"axis":48}
```

- 추가: alert · avatar · progress · skeleton · tooltip · attachment-card · code-block · context-panel · diff-viewer · feedback-buttons · message-bubble · plan-card · token-usage-indicator
- 삭제: activity-preview-card · agent-run-container · approval-dialog · collector-health-bar · file-upload-zone · seminar-chat-panel · step-indicator
- 외부 원격 요청: 재생성 0건(AxisCollector 는 파일만 읽음). 원격 요청은 AC1 의 GET 뿐이에요
