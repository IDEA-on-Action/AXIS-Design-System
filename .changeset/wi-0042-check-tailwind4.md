---
"@axis-ds/cli": minor
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 의 Tailwind 구성 항목을 고쳤습니다(WI-0042). Tailwind 4 이상은 `tailwind.config` 파일 대신 전역 CSS 의 `@import "tailwindcss"` 를 보고(종전에는 설정 파일이 없다고 FAIL), Tailwind 3 은 `tailwind.config.mjs` · `.cjs` 도 인정합니다. `axis check` 는 FAIL 이 있으면 종료 코드 1 로 끝납니다(종전에는 항상 0). CI 에서 `axis check` 를 쓰고 있다면 FAIL 이 실패로 잡히게 됩니다.
