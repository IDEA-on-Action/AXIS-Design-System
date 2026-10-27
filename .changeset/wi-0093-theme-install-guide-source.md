---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis theme list` · `axis theme info` 와 MCP `axis.list_brands` · `axis.get_brand` 의 `@axis-ds/tokens` 설치 안내가 선언 출처를 따라요(WI-0093).

- 앱 `package.json` 이나 워크스페이스 루트(pnpm · yarn)에 선언돼 있으면 미설치 안내가 범위를 붙인 추가 명령 대신 「설치: <pm> install」이에요. 종전 추가 명령은 루트에만 선언한 앱에 새 선언을 만들고, 앱 선언 범위를 다시 썼어요.
- npm 워크스페이스 루트에 선언돼 있으면 「설치: 워크스페이스 루트에서 npm install」이에요(앱 디렉터리의 `npm install` 은 루트 선언을 설치하지 않아요).
- 루트 선언 설치본이 브랜드를 지원하지 않으면(1.3.0 미만) 「워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.」, 빌드 전이면 재설치를 install 로 안내해요.
- Yarn Plug'n'Play 에서 앱에 선언이 있으면 설치 명령 대신 「Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다」를 내요. 경계는 `theme add` 와 같아서 PnP 와 앱 디렉터리에 자체 lockfile 이 있는 앱은 루트 선언을 보지 않아요(종전 추가 명령).
- `axis theme add` 는 앱에 선언된 tokens 가 설치되지 않았으면 「설치: <pm> install」을, 루트 선언 설치본이 빌드 전이면 재설치 안내를 더해요.
- 선언이 없으면 안내는 종전과 같아요. 판정은 registry-core 공용 헬퍼(`dependencyInstallGuide`)로 cli · mcp 가 같이 써요.
