---
"@axis-ds/ui-react": patch
"@axis-ds/agentic-ui": patch
---

Yarn Plug'n'Play 앱에서 `@import "@axis-ds/ui-react/tailwind.css";` · `@import "@axis-ds/agentic-ui/tailwind.css";` 를 넣어도 컴포넌트 클래스가 하나도 생성되지 않던 문제를 고쳤어요(WI-0105).

- 두 패키지의 `package.json` 에 `"preferUnplugged": true` 를 선언했어요. Yarn 이 설치할 때 패키지를 `.yarn/cache` 의 zip 대신 `.yarn/unplugged` 에 풀어 두므로, `tailwind.css` 의 `@source "./dist"` 가 Tailwind 4 스캐너에 보여요. 루트 `package.json` 의 `dependenciesMeta` 설정 없이 node_modules 설치와 같은 CSS 가 나와요.
- 루트 `dependenciesMeta` 에 `"unplugged": false` 를 준 경우에는 그 설정이 우선해 종전처럼 zip 에 남아요.
- npm · pnpm · Yarn classic(1.x) · Yarn node-modules linker 에서는 이 필드를 쓰지 않아 설치 결과와 빌드 산출물이 바뀌지 않아요.
- 컴포넌트 · 스타일 · API 는 바뀌지 않았어요.
