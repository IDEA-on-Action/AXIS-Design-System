---
'@axis-ds/cli': minor
'@axis-ds/mcp': minor
---

feat: 브랜드 테마 명령과 MCP 브랜드 도구 추가 (WI-0028)
  - CLI `axis theme list` · `axis theme info <brand>` · `axis theme add <brand>` 를 더했어요. 대상 프로젝트에 설치된 `@axis-ds/tokens`(1.3.0 이상)의 `./brands` 산출물을 읽어요
  - `axis theme add` 는 globals.css 에 브랜드 `@import` 한 줄, `package.json` 에 `@axis-ds/tokens`, `axis.config.json` 에 `brand` 를 기록해요. 두 번 실행해도 결과가 같고, 설치는 실행하지 않고 안내만 해요
  - `axis check` 와 MCP `axis.check_project` 가 `axis.config.json` 의 `brand` 와 실제 import 가 맞는지 검사해요. `brand` 가 없는 프로젝트의 결과는 그대로예요
  - MCP 도구 `axis.list_brands` · `axis.get_brand` 를 더했어요(도구 16개 → 18개). CLI 와 같은 코어로 대상 디렉터리를 읽어요
  - CLI `--version` 과 MCP `serverInfo.version` 이 `package.json` 의 버전을 읽어요(종전 `0.1.0` 고정)
