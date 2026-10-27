# WI-0093 릴리스 노트: theme list · info · MCP 브랜드 도구의 tokens 설치 안내가 선언 출처를 따라요

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #236 | 예상 버전: `@axis-ds/cli` 1.7.6 · `@axis-ds/mcp` 1.4.5(PR-A 와 함께 Version PR 하나로 발행). tokens · theme · ui-react · agentic-ui 는 바뀌지 않아요

## 바뀐 점

- `axis theme list` · `axis theme info` 와 MCP `axis.list_brands` · `axis.get_brand` 의 안내가 `@axis-ds/tokens` 선언 출처를 봐요. 종전에는 선언과 상관없이 `<pm> add "@axis-ds/tokens@^1.6.0"` 이었고, 그대로 실행하면 루트에만 선언한 앱에 새 선언이 생기고 앱 선언 범위가 다시 쓰였어요(yarn 은 `^1.8.0` 이 `^1.6.0` 으로 낮아짐, 실측).
  - 앱에 선언 · 미설치: 「설치: <pm> install」
  - pnpm · yarn 워크스페이스 루트에 선언 · 미설치: 「설치: <pm> install」(앱 디렉터리에서 실행해도 루트 선언이 설치돼요, pnpm 9.15.4 · yarn 4.5.3 실측)
  - npm 워크스페이스 루트에 선언 · 미설치: 「설치: 워크스페이스 루트에서 npm install」(앱 디렉터리의 `npm install` 은 루트 선언을 설치하지 않아요, npm 10.9.4 실측)
  - 루트 선언의 설치본이 1.3.0 미만: 「워크스페이스 루트 package.json 의 @axis-ds/tokens 선언을 ^1.3.0 이상으로 올리고 설치하세요.」(`theme add` 의 WI-0087 DEC-8 문구 그대로)
  - 선언이 있고 설치본이 빌드 전: 「워크스페이스면 <빌드 명령>, 아니면 재설치: <pm> install」(npm 루트는 「워크스페이스 루트에서 npm install」)
  - Yarn Plug'n'Play 에서 앱에 선언이 있으면: 「@axis-ds/tokens <범위> 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.」 한 줄. 종전 add 안내는 실행해도 같은 안내가 다시 나오는 고리였어요.
- `axis theme add` 의 설치 안내 공백을 메웠어요(**WI-0087 DEC-1 을 다시 정함**: DEC-1 은 앱 선언 출력을 종전 바이트 그대로 두기로 했어요).
  - 앱에 선언된 tokens 가 설치되지 않았으면 「- package.json: … 가 이미 있어 범위를 바꾸지 않음」 다음 줄에 「설치: <pm> install」
  - 설치본이 빌드 전이면 선언 출처와 상관없이(앱 선언 · 루트 선언 모두) 선언 줄 다음에 theme list 와 같은 「워크스페이스면 <빌드 명령>, 아니면 재설치: <pm> install」. npm 워크스페이스 루트 선언이면 「… 아니면 재설치: 워크스페이스 루트에서 npm install」이에요.
  - Yarn Plug'n'Play 에서 앱에 선언이 있으면 미설치 · 빌드 전 · 미지원 모두 앱 선언 줄 다음에 theme list 와 같은 한 줄(「@axis-ds/tokens <범위> 가 package.json 에 선언돼 있지만 Plug'n'Play 설치라 설치본을 판정하지 못해 브랜드를 읽을 수 없습니다.」)만 내요. 설치 줄, 미지원 경고 · 업그레이드 줄은 내지 않아요.

## 바뀌지 않은 점

- 선언이 없거나 `package.json` 이 없으면 안내는 종전 추가 명령이에요.
- 앱 선언인데 설치본이 1.3.0 미만이면 종전 업그레이드 추가 명령이에요(범위를 올려야 해서).
- 경계는 `theme add` 와 같아요. Yarn PnP 와 앱 디렉터리에 자체 lockfile(`package-lock.json` · `pnpm-lock.yaml` · `yarn.lock` · `bun.lockb` · `bun.lock`)이 있는 앱은 루트 선언을 보지 않고 종전 추가 명령이에요. PnP 에서 루트에만 선언한 tokens 는 앱에서 해석되지 않았어요(yarn 4.5.3 실측).
- `theme add` 에서 루트 선언 tokens 가 설치되지 않았을 때의 「설치: <pm> install」 줄은 npm 워크스페이스여도 종전처럼 앱 디렉터리 명령(「설치: npm install」)이에요. init · check dependencies 의 npm 루트 설치 위치 문구도 그대로예요(둘 다 WI-0096). 이번에 npm 루트 위치 문구를 쓰는 theme add 줄은 빌드 전 재설치 줄 하나예요.
- `theme add` 의 그 밖의 출력(선언 없음 · 앱 선언 미지원의 업그레이드 줄, 루트 선언 미지원의 DEC-8 줄, 「@axis-ds/tokens 를 읽을 수 없어 … 이름 규칙만 확인했습니다」 줄, ThemeProvider 의 `@axis-ds/theme` 설치 줄)은 그대로예요. PnP 에서도 이 「이름 규칙만 확인」 줄과 theme 설치 줄은 종전과 같아요.
- 쓰는 파일은 없어요(list · info · MCP 는 읽기만).

## 알아둘 점 (잔여)

- **PnP 에서는 안내를 따라도 브랜드를 읽지 못해요.** brand-core 가 node_modules 만 보기 때문이에요(Q13, 별도). 이번에는 add 를 다시 권하지 않게만 했어요.
- **선언 범위가 지원 버전을 허용하지 않을 때**(정확 버전 `1.2.1` · `~1.2.0` 등) 앱 선언 미설치는 「<pm> install」을 내고, 설치 뒤 미지원 안내(업그레이드 추가 명령)가 이어지는 두 단계가 돼요(Q20, 범위 밖).
- **npm 워크스페이스 루트 선언 · 미설치에서 theme add 의 「설치: npm install」**은 앱 디렉터리에서 실행하면 루트 선언을 설치하지 않아요(npm 10.9.4 실측, testplan 4절). theme list · info · MCP 와 theme add 의 빌드 전 재설치 줄은 「워크스페이스 루트에서」를 붙였지만 이 줄은 WI-0096 에서 고쳐요.
- yarn 1 · bun 멤버 앱 · npm 7 ~ 9 는 재지 않았어요(testplan 7절).
