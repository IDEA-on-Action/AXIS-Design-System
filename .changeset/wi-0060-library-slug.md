---
"@axis-ds/cli": patch
---

`axis library publish` · `axis library refresh-axis` 가 만드는 library 데이터에서 같은 slug 의 항목끼리 상세 데이터가 섞이던 결함을 고쳤어요(WI-0060).

- 상세 데이터 파일 키가 slug 에서 항목 id 로 바뀌었어요: `components/<slug>.json` → `components/<id>.json`(예: `components/axis-button.json` · `components/shadcn-button.json`). 항목마다 자기 파일을 가져서, 예전처럼 shadcn 상세에 AXIS 코드가 나오거나(25개) AXIS 상세에 shadcn 데이터가 나오지(5개) 않아요. 옛 이름의 파일은 `refresh-axis` 가 지워요.
- 같은 상세 주소(`/library/<category>/<slug>`)를 쓰는 항목이 있으면 AXIS 항목이 slug 를 지키고, 나머지는 slug 가 `<source>-<slug>` 가 돼요(예: shadcn/ui button 은 `/library/ui/shadcn-button`). `index.json` · `search-index.json`(slug · url) · `categories/*.json` · 상세 파일에 같은 값을 써요. 카테고리가 다르면 주소가 달라 바꾸지 않아요. 한 주소에 AXIS 항목이 둘이거나 바꾼 뒤에도 겹치면 쓰지 않고 멈춰요.
- `refresh-axis` 결과의 `shadowedAxis`(외부 파일과 겹쳐 파일을 못 가진 AXIS 항목)는 없어지고, slug 를 바꾼 항목을 알리는 `renamedSlugs` 가 생겼어요.
- `components/<slug>.json` 을 직접 읽던 소비자는 `index.json` 에서 항목 id 를 찾아 `components/<id>.json` 을 읽어야 해요.
