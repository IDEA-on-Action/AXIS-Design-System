# WI-0094: dependencies 의 @axis-ds/* 루트 대상 구현 계획

> PRD: [prd.md](./prd.md) | WI-0091 과 같은 함수 · 같은 구간(`checkDependencies` 72-89)을 고쳐서 0091 규칙을 먼저 확정한 뒤 이어서 고쳐요

## 1. 바꾸는 곳 (`registry-core/src/template/dependencies-core.ts` `checkDependencies`)

1. `appAxis = declaredAxisPackages(pkg)`, `rootAxis = declaredAxisPackages(rootPkg)` 중 앱에 없는 것. PnP 면 `rootAxis = []`(WI-0091 Q1)
2. `rootNote` 의 이름 목록 = 루트 출처 필수 · 권장 + `rootAxis`
3. 설치 확인 대상 = 선언된 필수 · 권장 + `appAxis` + `rootAxis`
4. 미설치를 둘로 나눔: `rootAxis` 에 든 것은 「워크스페이스 루트에 선언돼 있지만 설치되지 않았습니다: … → <설치 명령>」, 나머지는 종전 「선언됐지만 설치되지 않은 의존성: … → <설치 명령>」
5. 루트 package.json 은 종전처럼 `workspaceRootPackage`(`findWorkspaceRoot`, `.git` 에서 중단)로 한 번 읽음. 앱 lockfile 은 보지 않음(Q19)

## 2. 검증

- 기존 테스트 전체의 전이를 A/B probe 로 전수 기록(루트에 `@axis-ds` 를 선언한 기존 fixture, 바뀐 결과 12개)
- 새 테스트 5건(AC1 ~ AC4), MCP 1건(AC5)
- 실제 설치 fixture(WI-0094/fx 13개 · real 4개) 재측정
