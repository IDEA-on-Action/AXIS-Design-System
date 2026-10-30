---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

npm 워크스페이스에서 루트 `package.json` 에만 선언한 패키지가 설치되지 않았을 때, `axis theme add` · `axis init` · `axis check`(MCP `axis.check_project` 포함)가 「워크스페이스 루트에서 npm install」로 설치 위치까지 안내해요(WI-0096). 앱 디렉터리에서 plain `npm install` 을 실행하면 루트에만 선언한 패키지는 설치되지 않아서(npm 7.24.2 · 8.19.4 · 9.9.4 · 10.9.4 실측, lockfile 없음 · 빈 파일 · 정상 · 앱 lockfile 네 조건 모두), 종전 안내 「npm install」을 따라도 같은 경고가 다시 나왔어요. `axis theme list` · `axis theme info` · MCP 브랜드 도구와 check 의 Tailwind 4 CSS 줄은 이미 이 문구였고(WI-0093 · WI-0097), 이번에 남은 곳을 같은 문구로 맞췄어요. 두 패키지가 같은 공유 코어(registry-core)를 번들해 check 문구가 같아요.

- **문구가 바뀌는 곳**(npm 이고 그 안내 대상에 워크스페이스 루트 선언이 하나라도 있을 때만):
  - `axis theme add`: tokens 를 루트에만 선언하고 설치하지 않았을 때 「설치: npm install」 → 「설치: 워크스페이스 루트에서 npm install」. 루트에만 선언한 컴포넌트 패키지(`@axis-ds/ui-react` 등)가 설치되지 않아 `tailwind.css` 줄을 넣지 않았다는 안내의 「설치(npm install)」 → 「설치(워크스페이스 루트에서 npm install)」
  - `axis init`: `clsx` · `tailwind-merge` 가운데 하나라도 루트에 선언돼 있으면 「설치는 실행하지 않았습니다. 설치: npm install」 → 「… 설치: 워크스페이스 루트에서 npm install」(나머지를 앱 package.json 에 추가한 경우도 같아요. 루트에서 실행하면 앱 선언도 함께 설치돼요). 애니메이션 플러그인을 루트에 선언했지만 설치하지 않았으면 「npm install 뒤 …」 → 「워크스페이스 루트에서 npm install 뒤 …」
  - `axis check` · `axis.check_project` 의 dependencies 항목: 「선언됐지만 설치되지 않은 의존성: … → npm install」 묶음에 루트 선언이 있으면, 그리고 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: … → npm install」은 「→ 워크스페이스 루트에서 npm install」
- **check 종료 코드가 바뀌는 경우**: 없어요. 바뀐 것은 WARN 문구의 설치 명령 구절뿐이고 PASS · WARN · FAIL 판정과 「N pass / M warn」 집계는 그대로예요.
- 바뀌지 않는 경우: pnpm · yarn 워크스페이스는 앱 디렉터리에서 실행해도 루트 선언이 설치돼 종전 「pnpm install」 · 「yarn install」 그대로예요(pnpm 9.15.4 · yarn 1.22.22 는 이번 실측, yarn 4.5.3 node-modules 는 WI-0093 실측). npm 이어도 앱 `package.json` 에만 선언한 패키지의 안내는 종전 「npm install」이에요. 설치본이 있어 안내가 나오지 않는 경우, Yarn Plug'n'Play 안내, `axis theme add` 의 업그레이드 안내(루트 선언이면 「워크스페이스 루트 package.json 의 … 선언을 올리고 설치하세요」)도 그대로예요.
- 같은 발행의 WI-0088(`template apply` 의 package.json 처리)과는 다루는 명령이 겹치지 않아요.
