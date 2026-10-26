---
'@axis-ds/cli': patch
'@axis-ds/mcp': patch
---

워크스페이스(모노레포) 앱에서 Tailwind · 컴포넌트 패키지 판정과 의존성 안내가 워크스페이스 루트 `package.json` 의 선언도 봐요(WI-0086). 종전에는 `dependencies` 항목만 루트 선언을 인정하고 나머지 판정은 앱 선언만 봐서, 같은 화면에서 판정이 갈렸어요.

- `axis check` · `axis.check_project`: 루트에만 `@axis-ds/ui-react` 를 선언한 Tailwind 3 앱에 `tailwind.content` · `animation` 항목이 새로 나와요. `content` 가 컴포넌트 경로를 덮지 않으면 `tailwind.content` FAIL 이라 종료 코드가 0 에서 1 로 바뀔 수 있어요(실제 빌드에서 컴포넌트 클래스가 만들어지지 않던 상태예요. 제안 경로를 `content` 에 넣으세요).
- 루트에만 `tailwindcss` ^4 를 선언하고 아직 설치하지 않은 앱은 Tailwind 4 로 판정해 「tailwind.config 파일이 없습니다」 FAIL 이 사라져요(종료 코드 1 에서 0). Tailwind 4 의 1.4.0 안내 · 컴포넌트 `tailwind.css` 안내, Tailwind 3 preset 버전 게이트, brand 의 `@axis-ds/theme` 버전 게이트도 루트 선언을 근거로 써요(설치본이 있으면 종전처럼 설치본이 먼저).
- `axis init`: 루트에 선언된 `clsx` · `tailwind-merge` 를 앱 `package.json` 에 다시 쓰지 않고 「워크스페이스 루트에 선언: …」으로 알려요. `axis add` · MCP `axis.install_component` 의 의존성 안내에서도 루트에 선언된 것은 빠져요.
- `--dir` · MCP `targetDir` 를 앱 디렉터리를 가리키는 심볼릭 링크로 줘도 실경로와 같은 판정이에요(종전에는 링크 쪽 상위를 올라가 루트 · 설치본을 못 찾았어요).
- 워크스페이스가 아닌 상위 · `.git` 너머의 선언은 여전히 인정하지 않고, 쓰기는 앱 `package.json` 에만 해요. `axis theme add` 가 루트 선언을 앱에 다시 쓰는 경로는 이번에 바꾸지 않았어요(WI-0087).
