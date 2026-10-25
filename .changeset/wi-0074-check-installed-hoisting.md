---
'@axis-ds/cli': patch
'@axis-ds/mcp': patch
---

`axis check` · `axis.check_project` 의 Tailwind 판정과 Tailwind 4 버전 안내가 설치본을 프로젝트 디렉터리부터 상위로 찾아요(WI-0074). 종전에는 `node_modules` 한 층만 읽어 npm workspaces · pnpm hoisted 모노레포에서 설치본을 못 찾고 선언(`latest` · `^1.3.0` · 선언 없음)으로 판정해 거짓 FAIL · WARN 이 났어요(예: 앱 선언 `tailwindcss: "latest"` 이면 「tailwind.config 파일이 없습니다」 FAIL).

- 같은 판정을 쓰는 `axis init`(tailwind-merge 범위 · Tailwind 4 버전 안내), `axis theme add`(Tailwind 4 기본 CSS), `axis template apply`(major 경고), `axis add`(tailwind-merge 범위)도 상위 설치본을 따라요.
- 가장 가까운 설치본이 앞서고, Plug'n'Play(`.pnp.cjs`)면 종전처럼 선언으로 판정해요. 설치본이 프로젝트 디렉터리에 있는 구조는 판정이 바뀌지 않아요.
