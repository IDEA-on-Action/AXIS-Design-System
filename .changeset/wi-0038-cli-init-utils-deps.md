---
'@axis-ds/cli': patch
---

fix: `axis init` 이 utils.ts 의존성을 추가하고 실행 안내를 `@axis-ds/cli` 로 정정 (WI-0038)
  - `axis init` 이 만드는 `utils.ts` 가 import 하는 `clsx` · `tailwind-merge` 를 `package.json` 의 `dependencies` 에 없을 때만 추가해요(`clsx ^2.1.1`, `tailwind-merge` 는 설치된 tailwindcss 나 `package.json` 선언이 Tailwind 4 이면 `^3.4.0`, 3 이거나 판정할 수 없으면 `^2.6.0`). 이미 `dependencies` 나 `devDependencies` 에 있으면 범위를 그대로 둬요
  - 설치는 실행하지 않고 lockfile 로 고른 설치 명령(`pnpm install` · `yarn install` · `npm install`)을 안내해요. `package.json` 이 없거나 쓸 수 없으면 바꾸지 않고 추가 명령을 안내해요
  - `package.json` 의 키 순서 · 들여쓰기 · CRLF · 끝 줄바꿈 · BOM 을 유지하고, 다시 실행해도 결과가 같아요
  - CLI 출력과 문서의 실행 안내 `npx axis-cli ...` 를 `npx @axis-ds/cli ...` 로 고쳤어요. `axis-cli` 는 npm 에서 unpublish 된 다른 이름이라 실행하면 안 돼요
