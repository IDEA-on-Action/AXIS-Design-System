---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis check` · MCP `axis.check_project` 의 `tailwind.content` 가 pnpm 기본 레이아웃에서 실경로가 같은 상위 설치본(`../../node_modules/...`)과 `.pnpm` 스토어 실경로를 상대 경로로 쓴 glob 을 덮은 것으로 봐요(WI-0090). 종전에는 실제 Tailwind 3 빌드가 같은 클래스를 만드는데도 FAIL 이었어요.

- 실경로가 다른 상위 설치본(다른 버전 등)을 가리키면 종전대로 FAIL 이고, 문구에 그 이유를 붙여요(실측: 루트 1.8.1 · 앱 1.8.2 에서 그 경로는 Select placeholder 클래스 하나를 놓침)
- 제안 glob 과 그 밖의 문구는 그대로예요
