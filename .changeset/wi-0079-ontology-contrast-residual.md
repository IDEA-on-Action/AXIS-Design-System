---
'@axis-ds/tokens': patch
'@axis-ds/mcp': patch
---

ontology 브랜드에 남아 있던 대비 미달을 고쳤어요(WI-0079). Progress warning 만 AXIS 원시색 노랑이고 나머지는 v1 팔레트 안의 값이에요. 기본 브랜드 값은 그대로예요. 디자인 오너 확인 문서의 권장안으로 먼저 반영했고, 오너가 다른 값을 고르면 다시 발행해요.

- `--axis-form-control-border` · `--axis-form-control-track`(Checkbox · Radio · Textarea 경계, Switch 꺼짐 · Slider 트랙): 라이트 `sub` #6B7280 · 다크 `muted` #7A828D. 페이지 · card · panel 바탕 위 최저 라이트 4.39 · 다크 4.11(종전 1.08~1.42), Switch 흰 썸 대 트랙 4.83 · 3.89
- `--axis-progress-fill-success` · `-destructive`: `ink-2` · `bad-dark`(라이트 #2A2F36 · #A8281F, 다크 #D0D4D9 · #F49890). 트랙 위 라이트 11.39 · 5.94(종전 success 1.93)
- `--axis-progress-fill-warning`: AXIS 원시색 노랑, 라이트 yellow-700 #A16207 · 다크 yellow-500 #EAB308(다크는 종전 값). 트랙 위 라이트 4.16 · 다크 7.12(종전 라이트 1.62). destructive(빨강)와 색상이 갈리도록 v1 팔레트 밖의 노랑을 썼어요(v1 에는 노랑이 없어요)
- `--axis-input-text-placeholder`: 라이트 `sub-aa` #5F6673 · 다크 `sub` #9CA3AD(입력 바탕 위 5.78 · 6.92, 종전 라이트 2.61). WI-0025 부록 B ② 의 「`muted` 는 placeholder 에만」 처리를 철회했어요. Textarea placeholder 와 같은 값이에요
- Input · Select 트리거 테두리 `--axis-input-border-default`(부록 B ③ 예외)는 바꾸지 않았어요
- mcp 는 tokens 를 올리면 함께 올리는 규칙(check-changeset-mcp-tokens)에 따라 올려요. 동봉 토큰 데이터(`dist/data/tokens.json`)는 기본 브랜드 값만 담아 이번 변경으로 바뀌지 않아요
