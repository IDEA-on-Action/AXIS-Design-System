# WI-0086: 의존성 선언 판정의 워크스페이스 루트 합류 · 심링크 baseDir TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #218 | 상태: 🔄 구현 완료 · 머지 대기(브랜치 `fix/batch6c`, push · PR 전)

## 결정
- [x] D1 공용 헬퍼 declaredDependency(쓰기는 앱 pkg 로만) · D2 tailwind-core 7곳 + init utils + add(MCP install), theme add 쓰기 경로는 WI-0087 · D3 declaredAxisPackages 앱 선언만 · D4 realpath 는 공개 함수 진입부에서 한 번(절대 glob x 심링크 행 AC) · D5 cli · mcp patch · D6 커밋 WI-0086 → WI-0085 (배치 6c 결정)

## 구현
- [x] `project.ts`: `resolveBaseDir` · `workspaceRootPackage`(dependencies-core 에서 옮김) · `declaredDependency` 신설, `findWorkspaceRoot` · `detectInstallCommand` · `findInstalledPackage` · `isPnpProject` 진입부 실경로(찾은 dir 은 풀지 않음)
- [x] `tailwind-core.ts`: 지역 `hasDependency` 삭제, 7곳을 공용 헬퍼로(`tailwind4Issues` 에 baseDir 인자), 공개 함수 진입부 `resolveBaseDir`, `contentGlobCovers` 기준 실경로
- [x] `dependencies-core.ts`: 루트 인정을 공용 헬퍼로(문구 불변)
- [x] `init.ts` utils present 판정 · 출처 표시, `add.ts` missingDependencies
- [x] 문서: `docs/guides/theme-customization.md` tailwind.content · animation 행, WI-0080 · WI-0081 범위 밖 줄에 해소 표시

## 테스트
- [x] cli workspace-root 6 · template-check 11 · init 5 · add 2, mcp template 1 (절대 glob x 심링크 행 포함)
- [x] 수정 전 소스에서 cli 18 · mcp 1 빨강, 변이 V1~V9 · M1~M3 각각 빨강 · 원복(sha 같음)
- [x] 실제 설치 픽스처 85행 신구 비교: 링크 행 37/60 → 60/60, real 전이 12행(testplan 3절), pnpm 기본 앱 선언 행 바이트 불변, cli · mcp 판정 줄 수 불일치 0
- [x] init · add 10앱: 루트 선언 앱 package.json 바이트 불변 5/5, add 안내에서 루트 선언 빠짐 5/5, 앱 선언 대조 전이 0
- [x] turbo lint · type-check · build · test `--force`(Cached 0), frontend.yml run 단계 11종 rc 0, 생성물 되돌림

## 릴리스
- [x] changeset `.changeset/wi-0086-has-dependency-unify.md`(@axis-ds/cli patch · @axis-ds/mcp patch)
- [ ] WI-0085 커밋을 같은 브랜치에 올린 뒤 PR · 머지(단독 push, push run 완료 확인 뒤 Release 머지)
- [ ] 발행본으로 testplan 2절 스크립트 다시 재기(AC9, WI-0085 전이와 합친 표)
- [ ] 결정 필요: init.ts 213 · 281 · 294 의 앱 선언 전용 안내(testplan R1)
