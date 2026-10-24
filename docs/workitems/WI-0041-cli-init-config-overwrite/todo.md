# WI-0041: init 재실행 병합 TODO

> PRD: [prd.md](./prd.md) | GitHub: #128

- [x] `mergeInitConfig`(기존 키 순서 · init 밖 키 보존 · 없던 init 키 삽입 위치 · 빠진 init 키 지움) 와 `INIT_MANAGED_KEYS`
- [x] runInit 이 기존 config 를 읽었으면 병합 + `formatJsonLike` 로 쓰기, 「갱신」 문구를 「init 이 다루는 키만 바꾸고 나머지 키는 그대로 둠」으로
- [x] `resolveInitAnswers`: componentsDir 보존, globalCss · tailwindConfig 실재 판정 · 탐색값 교체 · 그대로 둠 안내, `-y` 와 대화형 초기값이 같은 값
- [x] 기존 테스트 갱신(빠진 키 → 보존, componentsDir 되돌림 → 보존, 갱신 문구), 새 테스트 7건
- [x] 변이 확인, cli README 현행화
