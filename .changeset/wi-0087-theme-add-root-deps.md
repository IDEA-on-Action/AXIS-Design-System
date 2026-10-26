---
"@axis-ds/cli": patch
---

`axis theme add` · `axis init` 이 워크스페이스 루트 `package.json` 에 선언된 의존성을 인정해요(WI-0087).

- `theme add` 는 루트에 선언된 `@axis-ds/tokens` 를 앱 `package.json` 에 다시 쓰지 않고 「- package.json: @axis-ds/tokens <범위> 가 워크스페이스 루트에 선언돼 있어 앱 package.json 은 바꾸지 않음」을 내요. 설치본이 없으면 다음 줄에 「설치: <명령>」, 설치본이 1.3.0 미만이면 앱 기준 업그레이드 명령 대신 루트 선언을 올리라고 안내해요. 루트에 `@axis-ds/theme` 가 있으면 ThemeProvider 설치 안내를 내지 않아요.
- `theme add` 는 Tailwind 4 에서 루트에만 선언한 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 `tailwind.css` 줄을 설치본에 그 파일이 있을 때만 넣고, 없으면 넣지 않은 이유를 한 줄로 알려요.
- `init` 의 애니메이션 플러그인 안내는 선언(앱 · 루트)과 설치본을 봐요. 선언 · 설치면 침묵, 선언만 있으면 「선언돼 있지만 설치되지 않았습니다」 안내예요. 앱에만 선언하고 설치하지 않은 경우와 Tailwind 3 에서 `tw-animate-css` 만 선언한 경우에도 새 안내가 나와요.
- 루트 `devDependencies` 도 선언으로 인정해요. 앱만 따로 운영 설치 · 배포하면 루트 선언이 따라가지 않으니 앱 `package.json` 에 직접 선언하세요.
- Yarn PnP 와 앱 디렉터리에 자체 lockfile 이 있는 앱은 종전 동작이에요. 쓰기는 계속 앱 파일에만 해요.
