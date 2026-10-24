# WI-0061: 원격 · 동봉 레지스트리 비교를 version 이 아니라 항목 sha256 으로 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0061 | GitHub: #167 | 우선순위: P2 | 상태: Approved (2026-10-24 결정 반영)
> 기준: `main` bc1e091 (ui-react · agentic-ui 1.5.2, cli 1.5.2 · mcp 1.3.0)
> 관련: WI-0059(#158) 배포 확인에서 발견. 레지스트리 설치 코어는 WI-0055 의 `packages/axis-registry-core`

---

## 1. 개요

### 1.1 문제 (실측, 2026-10-24)

- 공유 코어 `RegistryClient` 는 원격 index 와 동봉 index 의 `version` 문자열이 다르면 「원격 레지스트리(version X)와 CLI 에 포함된 레지스트리(version Y)의 version 이 다릅니다」를 알려요
- 레지스트리 `version` 은 build-registry 가 ui-react package.json 에서 가져와요. ui-react 만 릴리스하면 pages.dev `/r` version 은 오르지만 cli · mcp 동봉본은 그대로라, 다음 cli 발행 전까지 모든 `list` · `add` 첫 줄에 이 안내가 떠요
- 실측: ui-react 1.5.2 배포 뒤 `npx @axis-ds/cli@1.5.2 list` 첫 줄이 위 안내. 그런데 원격 1.5.2 와 동봉 1.5.1 의 항목 30개 sha256 은 모두 같았어요(내용 차이 없음, 거짓 경보)

### 1.2 결정 (2026-10-24 사용자)

| # | 결정 |
|---|---|
| D1 | 판정을 내용 기준으로: index 항목별 sha256 을 비교해 실제로 다른 항목(한쪽에만 있는 항목 포함)이 있을 때만 알리고, 다른 항목 이름을 5개까지 적어요. version 만 다르면 알리지 않아요 |
| D2 | 비교할 수 없을 때(양쪽에 있는 항목 중 sha256 이 없는 것이 있음)는 종전처럼 version 으로 판정해요(새 판정 축이 없으면 종전 동작) |
| D3 | 릴리스: `@axis-ds/cli` · `@axis-ds/mcp` patch(공유 코어를 번들) |

## 2. 수용 기준

- AC1 version 만 다르고 내용이 같으면 알림 0, 내용이 다르면 1번(항목 이름 포함), 한쪽에만 있는 항목도 다른 것으로 셈, sha256 없음은 종전 version 판정
- AC2 빌드한 cli 를 실제 pages.dev 에 실행해 안내 없음(음성 대조: 배포본 1.5.2 는 안내)
- AC3 기존 게이트 통과
