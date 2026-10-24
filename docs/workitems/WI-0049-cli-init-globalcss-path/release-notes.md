# WI-0049 릴리스 노트: init 이 실제 경로를 기록해요

> 작성일: 2026-10-24 | WI: WI-0049 | GitHub: #140 | changeset: `@axis-ds/cli` minor · `@axis-ds/mcp` patch(묶음 ③)

## 변경 사항

- `axis init` 의 경로 기본값을 프로젝트에서 찾아요. `src/` 가 없으면 `componentsDir` 가 `./components/ui` 이고 `src/` 를 새로 만들지 않아요
- `globalCss` 는 `app/globals.css` · `src/app/globals.css` · `styles/globals.css` · `src/styles/globals.css` · `globals.css` 가운데 실제로 있는 첫 파일, `tailwindConfig` 는 있는 `tailwind.config.{ts,js,mjs,cjs}` 가운데 첫 파일을 기록해요(종전에는 `.js` 만 있어도 `.ts` 를 기록)
- 찾지 못하면 기본값을 기록하고 그 사실을 한 줄 알려요. Tailwind 4 안내 제목도 실제 경로를 보여요
- `axis theme add` · `axis check`(brand 항목) · MCP 도 같은 전역 CSS 후보를 써서 `styles/globals.css` 도 찾아요

## 남겨 둔 것

- `axis check` 의 Tailwind 4 · globals.css 항목은 종전 후보 순서(루트 `globals.css` 먼저)를 그대로 써요
