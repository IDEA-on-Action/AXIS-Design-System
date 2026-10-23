# WI-0055: MCP 컴포넌트 도구의 레지스트리 전환 TODO

> PRD: [prd.md](./prd.md) | GitHub: #150

## 1단계 실측 · 설계 조사 (2026-10-23)
- [x] 배포본 `@axis-ds/mcp@1.2.3` JSON-RPC 실측(list · search · get · install, 덮어쓰기 · 상대 경로), PRD 1.1 M1 ~ M10
- [x] 대조: 배포본 `@axis-ds/cli@1.5.1` 로 같은 3개 add(rc 0, 5파일)
- [x] 레지스트리 메타 · 하드코딩 템플릿 사용처 전수(grep)
- [x] cli 코어 의존 그래프, 옮길 모듈 목록(PRD 2.1 · 2.2)
- [x] tsup 번들 스파이크(devDependencies 코어 번들 · `import.meta.url` · dts 가 코어 타입 오류를 못 잡음 · tsc 는 잡음)
- [x] 스크립트 · 테스트 영향(PRD 2.5), 기준선 cli vitest 640 · mcp vitest 43 passed
- [ ] 결정 D3 ~ D12 (사용자)

## FR-1 코어 분리 (리팩터링, 동작 무변경)
- [ ] `packages/axis-registry-core`(D12) package.json(private · exports · type-check), tsconfig
- [ ] registry 4개 · safe-write · add · axis-config · site 를 `git mv`, theme-add 헬퍼 · selectUtilsDependencies 를 새 파일로 분리, tailwind-core(D9)
- [ ] cli 원래 경로에 심, cli · mcp devDependencies `workspace:*`, tsup `noExternal`
- [ ] 문구 주입 옵션(폴백 안내 · list · overwrite · init 안내), 기본값은 종전 문구
- [ ] `pnpm install`(lockfile), cli vitest 640 · cli build · cli-smoke, 변이 1회(덮어쓰기 판정 뒤집기 → cli 테스트 실패 확인)

## FR-2 ~ FR-5 mcp 전환
- [ ] list · search(28개, category 호환 D6, 출처 · version)
- [ ] get(레지스트리 + components.json props · examples, 없는 이름 안내)
- [ ] install(runAdd, targetDir D4 · 덮어쓰기 D3 · 의존성 D5 · 출력 D7), log · error · notify 주입(stdout 금지)
- [ ] build 에 copy-registry(dist/registry), turbo build · test inputs 에 레지스트리 · 코어 src
- [ ] 하드코딩 `COMPONENT_TEMPLATES` · loader 의 컴포넌트 함수 정리(tokens 는 유지)
- [ ] mcp 단위 테스트: 28개 · agentic 설치 · 덮어쓰기 · 경로 이탈 · 동봉본 폴백 · stdout 오염 없음

## FR-6 게이트
- [ ] mcp-smoke: `AXIS_REGISTRY_URL=http://127.0.0.1:9/r` 로 동봉본 경로, agentic 설치 · 건너뜀 · 이탈 거부 호출, 기대 문자열 갱신
- [ ] pack-smoke: `REQUIRED_FILES['@axis-ds/mcp']`, 코어 이름 누출 검사(양성 대조)
- [ ] 코어 type-check 가 turbo `type-check` 에서 도는지 확인(양성 대조: 타입 오류 주입 시 실패)

## 검증 · 문서
- [ ] AC1 ~ AC6, cli 1.5.1 대 새 mcp 설치 결과 바이트 비교
- [ ] `docs/guides/claude-workflow.md` 도구 표, mcp README · CHANGELOG(changeset)
- [ ] changeset(D11), testplan.md, release-notes.md
