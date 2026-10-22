---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

`axis.minu.best`(Cloudflare 403) 를 가리키던 기본 주소를 `https://axis-design-system.pages.dev` 로 바꿨습니다(WI-0056).

- `axis template list` · `axis template init` 과 MCP 템플릿 도구(`axis.list_templates` 등)의 기본 템플릿 주소가 `https://axis-design-system.pages.dev/templates` 입니다. 종전에는 기본 설정에서 「템플릿 인덱스를 가져올 수 없습니다 (403)」로 실패했습니다. `AXIS_TEMPLATE_URL` 이 있으면 그것이 우선합니다(종전과 같음).
- `axis init` · `axis template init` 이 기록하는 `$schema` 가 `https://axis-design-system.pages.dev/schema.json` 입니다. 이 주소에 `axis.config.json` 의 JSON Schema 를 새로 배포해, 에디터가 키 자동완성 · 오타 검사를 할 수 있습니다. 이미 있는 config 의 종전 `$schema` 값은 그대로 읽고, `axis init` 을 다시 실행하면 새 주소로 바뀝니다.
- `axis.config.json` 이 없을 때 `axis add` 가 안내하는 문서 링크를 GitHub 의 Quick Start 문서로 바꿨습니다(종전 링크는 403).
- `axis library` 수집 결과의 문서 링크 호스트를 pages.dev 로 바꿨습니다.
