# WI-0056 릴리스 노트: axis.minu.best(403) 참조를 pages.dev 로 전환

> 작성일: 2026-10-23 | WI: WI-0056 | GitHub: #151 | changeset: `@axis-ds/cli` · `@axis-ds/mcp` patch

## 변경 사항

- **기본 주소(D1)**: cli 는 `src/site.ts` 의 `AXIS_SITE_URL`, mcp 는 `src/site.ts` 의 같은 상수 하나에서 레지스트리 공개 base(`/r`) · 템플릿(`/templates`) · `$schema`(`/schema.json`) · library 문서 URL 을 만듭니다. 도메인을 다시 바꿀 때 이 값만 고칩니다
- **템플릿**: cli `template list` · `template init` 과 mcp 템플릿 도구가 기본 설정에서 동작합니다(종전 403)
- **`$schema`(D2)**: `apps/web/public/schema.json`(draft-07, `AxisConfig` 키 9개 모두 string, 추가 키 거부)을 새로 배포합니다. `_headers` 에 CORS 를 열었습니다. 테스트가 스키마 키 집합 · `$id` 와 `AxisConfig` · init 산출물을 묶습니다
- **안내 링크(D3)**: `add` 의 config 없음 안내가 GitHub `docs/guides/quick-start.md` 를 가리킵니다
- **메타 · 생성물(D4)**: 6개 패키지 `homepage` · README 문서 링크, 루트 `components.json` 의 `@axis` 별칭, build-registry 의 `homepage`(`/r/index.json` · `registry.json`), `packages/*/registry/registry.json`, `apps/web/public/library/**` 문서 URL, 템플릿 landing-page hero 링크, mcp-smoke 주석

linked 4패키지(tokens · ui-react · agentic-ui · theme)는 `homepage` · README 만 바뀌어 changeset 없이 다음 릴리스에 함께 나갑니다.

## 남겨 둔 것

- `axis.minu.best/r` 는 cli 의 종전 기본값 이전 판정(WI-0045 D13 · D18 · D20, `LEGACY_DEFAULT_REGISTRY_URL`)과 그 테스트에 남습니다. 과거 기록(WI 문서 · CHANGELOG)도 그대로 둡니다

## 알려진 한계

- library 데이터(`apps/web/public/library/**`)의 agentic 문서 링크 7개는 호스트를 바꿔도 404 입니다. 6개(activity-preview-card · agent-run-container · collector-health-bar · file-upload-zone · seminar-chat-panel · step-indicator)는 지금 소스 · 레지스트리에 없는 낡은 항목이고, approval-card 는 문서 페이지가 `approval-dialog` 경로에 있습니다. 호스트 전환 전에도 깨진 링크였고(403), library 데이터 재수집은 이 WI 범위 밖입니다
- cli 에는 `type-check` 스크립트가 없어, `AxisConfig` 에 키를 추가하고 스키마 테스트의 `Required<AxisConfig>` 를 고치지 않은 경우는 vitest 가 아니라 `tsc --noEmit` 에서만 잡힙니다(변이로 확인)
