---
'@axis-ds/mcp': patch
---

fix: 레지스트리 도구가 번들 데이터를 찾지 못해 실패하던 결함 수정
  - 1.1.0 부터 1.1.4 까지 `axis.list_components` · `axis.list_tokens` · `axis.search_components` · `axis.get_component` · `axis.get_token` · `axis.install_component` 가 `ENOENT` 로 실패했어요. 번들 `dist/index.js` 는 `dist/data/` 에서 `components.json` · `tokens.json` 을 찾는데 빌드가 `dist/registry/data/` 로 복사하고 있었어요
  - 빌드의 데이터 복사 위치를 `dist/data/` 로 바꿨어요. 코드와 데이터 내용은 그대로예요
