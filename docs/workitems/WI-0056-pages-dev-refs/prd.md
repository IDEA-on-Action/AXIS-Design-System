# WI-0056: axis.minu.best(403) 참조를 pages.dev 로 전환 PRD

> 작성일: 2026-10-23 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0056 | GitHub: #151 | 우선순위: P2 | 상태: Approved (2026-10-23 결정 반영)
> 기준: `origin/main` 78edb8c (`@axis-ds/cli` 1.5.0 · `@axis-ds/mcp` 1.2.2 · linked 4패키지 1.5.0 배포)
> 관련: WI-0045(#136) D8 · D14 에서 분리. 레지스트리(`/r`) 기본 주소는 WI-0045 에서 이미 pages.dev

---

## 1. 개요

### 1.1 문제 (실측, 2026-10-23)

| 자원 | axis.minu.best | axis-design-system.pages.dev |
|---|---|---|
| 사이트 루트 · `/r/index.json` | 403 (KT 망과 다른 출구 모두) | 200 |
| `/templates/index.json` | 403 | 200 |
| `/schema.json` | 403 | 404 (파일이 어디에도 없음, WI-0028 U11) |
| `/docs/guides/quick-start` | 403 | 404 (문서 사이트에 페이지 없음) |
| `/components/button/` · `/agentic/run-progress/` | 403 | 200 |

GitHub `docs/guides/quick-start.md` 는 200(공개 저장소)입니다.

저장소의 `axis.minu.best` 참조(레지스트리 기본값 이전 판정용 LEGACY 상수와 그 테스트 · WI 문서 · CHANGELOG 제외):

| 분류 | 위치 | 영향 |
|---|---|---|
| 요청 주소 | cli `template/registry-client.ts` · mcp `tools/template.ts` 템플릿 기본 주소 | `axis template list` · mcp 템플릿 도구가 기본 설정에서 실패 |
| 요청 주소 | 루트 `components.json` 의 `@axis` 별칭 | shadcn 으로 `@axis/<이름>` 설치 실패 |
| 설정 | cli `AXIS_CONFIG_SCHEMA_URL`(init · template init 이 `$schema` 로 기록) | 에디터 스키마 조회 실패(파일도 없음) |
| 안내 | cli `add` 의 config 없음 안내 링크 | 403 |
| 생성물 링크 | cli library 수집기 문서 URL, `apps/web/public/library/**` 문서 URL, build-registry 의 `homepage`(`/r/index.json` · `registry.json`) | 403 |
| 메타 · 문서 | 6개 패키지 `package.json` `homepage`, README 「문서」 링크, 템플릿 landing-page hero 링크, `packages/*/registry/registry.json` `homepage`, `scripts/mcp-smoke.mjs` 주석 | npm 페이지 · README 링크 403 |

### 1.2 결정 (2026-10-23 사용자)

| # | 결정 |
|---|---|
| D1 | 정식 주소는 `https://axis-design-system.pages.dev` 로 전면 전환합니다. 코드에서는 사이트 주소를 상수 한 곳(cli · mcp 각각)에 두고 나머지는 거기서 만듭니다. 다만 「한 곳만 고치면 된다」는 코드 안에서만 맞습니다. 이 주소는 `axis init` 이 사용자 프로젝트의 `axis.config.json`(`registry` · `$schema`)에 기록하고, 발행된 cli 1.5.0 · 이번 패치 · npm `homepage` 에도 들어갑니다. 따라서 **pages.dev 프로젝트(`axis-design-system`)는 지우거나 이름을 바꾸지 않고 계속 유지**합니다. 장기용 자체 도메인을 둘 경우 사용자 config 가 더 쌓이기 전에 정하고, 옮긴 뒤에도 pages.dev 는 살려 둡니다 |
| D2 | `$schema`: `AxisConfig` 와 같은 JSON Schema 를 `apps/web/public/schema.json` 으로 만들어 pages.dev 에 배포하고, 타입과 어긋나지 않게 테스트로 묶습니다 |
| D3 | config 없음 안내 링크는 GitHub `docs/guides/quick-start.md` 로 바꿉니다 |
| D4 | 릴리스: `@axis-ds/cli` · `@axis-ds/mcp` patch. linked 4패키지는 `homepage` · README 만 바뀌므로 changeset 없이 다음 릴리스에 함께 나갑니다 |

## 2. 요구사항

- FR-1 cli: 사이트 상수 `AXIS_SITE_URL` 을 두고 템플릿 기본 주소(`<site>/templates`, `AXIS_TEMPLATE_URL` 우선은 유지), `$schema`(`<site>/schema.json`), 레지스트리 공개 base(`<site>/r`), library 수집기 문서 URL 을 여기서 만듭니다. add 안내 링크는 GitHub quick-start 입니다
- FR-2 mcp: 템플릿 기본 주소를 같은 사이트 주소로 바꿉니다
- FR-3 schema.json: `AxisConfig` 의 모든 키(`$schema` · `template` · `componentsDir` · `agenticDir` · `tailwindConfig` · `globalCss` · `registry` · `monetDir` · `brand`)를 string 으로 정의합니다. 테스트는 ① 타입의 키 집합과 스키마 properties 가 같은지 ② init · template init 이 만드는 config 가 스키마를 통과하는지 봅니다
- FR-4 생성물 · 메타 · 문서: `components.json` 별칭, build-registry `homepage`, `apps/web/public/library/**` 문서 URL, 6개 `package.json` `homepage`, README, 템플릿 hero, `packages/*/registry/registry.json`, mcp-smoke 주석을 바꿉니다
- FR-5 종전 값 호환: 이미 `$schema` 가 minu.best 인 config 는 그대로 읽습니다(값을 해석하지 않음). init 을 다시 실행하면 새 `$schema` 로 갱신됩니다

## 3. 수용 기준

- AC1 저장소에서 `axis.minu.best` 가 남는 곳은 레지스트리 이전 판정 상수(LEGACY)와 그 테스트, 과거 기록(WI 문서 · CHANGELOG)뿐입니다(grep 실측)
- AC2 빌드한 cli 를 env 없이 실행해 `template list` 가 pages.dev 템플릿 목록을 받습니다(rc 0, 네트워크 기록). mcp 템플릿 도구도 같은 주소로 rc 0
- AC3 배포 뒤 `https://axis-design-system.pages.dev/schema.json` 이 200 이고, init 이 쓴 config 가 그 스키마를 통과합니다
- AC4 `components.json` 의 `@axis` 별칭 주소로 `button.json` 이 200 입니다
- AC5 기존 게이트(type-check · lint · build · test · test:registry · cli-smoke · pack-smoke · registry-install-smoke) 통과

## 4. 범위 밖

- 문서 사이트에 quick-start 페이지를 새로 만드는 일(D3 으로 GitHub 링크)
- 과거 기록(WI 문서 · CHANGELOG)의 minu.best 표기
- MCP install 의 레지스트리 미사용(WI-0055)
