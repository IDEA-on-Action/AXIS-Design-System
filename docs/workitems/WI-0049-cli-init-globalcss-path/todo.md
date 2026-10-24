# WI-0049: init 경로 기본값 TODO

> PRD: [prd.md](./prd.md) | GitHub: #140

- [x] registry-core `project.ts` 에 `GLOBAL_CSS_CANDIDATES` · `TAILWIND_CONFIG_CANDIDATES` · `detectProjectPaths` · `projectFileExists` · `addCommandFor`(init 에서 옮김)
- [x] brand-core 가 후보 상수를 공유 코어에서 import, `cp` 로 mcp 사본 동기화
- [x] init `resolveInitAnswers`(WI-0041 D5 와 같은 함수) 로 `-y` · 대화형 초기값 결정, `INIT_DEFAULTS_NO_SRC` 추가
- [x] 기존 테스트 갱신(src 없는 임시 디렉터리 기대값: AC7 기준값 · Tailwind 4 안내 제목 · utils 위치), 새 테스트 4건
- [x] 변이 확인, cli README 현행화
