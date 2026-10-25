---
'@axis-ds/cli': patch
'@axis-ds/mcp': patch
---

Tailwind 3 프로젝트의 `tailwind.content` 판정(`axis check` · `axis.check_project`)과 `axis theme add` 의 content 안내가 `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 의 실제 설치 위치를 따라요(WI-0080). 종전에는 표본 · 제안을 `./node_modules/<pkg>` 로 고정해서 npm workspaces · pnpm hoisted 모노레포에서 실제 위치 `../../node_modules/...` 를 넣어도 FAIL 이었고, 제안대로 `./node_modules/...` 를 넣으면 클래스가 하나도 생기지 않는데 PASS 였어요.

- 호이스팅 앱의 제안은 `"../../node_modules/@axis-ds/ui-react/dist/**/*.{js,mjs}"` 이고, 상위 경로는 Tailwind 3 가 빌드를 실행한 디렉터리 기준으로 풀린다는 안내(`relative: true` 권장)가 함께 나와요.
- `./**/*.{js,mjs}` 같은 glob 은 `../` 를 넘지 않으므로 호이스팅 설치본을 덮은 것으로 보지 않아요. 실제 설치 위치를 가리키는 절대경로 glob 은 인정해요.
- 설치본이 앱 `node_modules` 에 있는 구조(pnpm 기본 · 단일 프로젝트)와 설치본이 없거나 Plug'n'Play 인 경우의 판정 · 문구는 그대로예요(절대경로 glob 인정만 달라짐).
