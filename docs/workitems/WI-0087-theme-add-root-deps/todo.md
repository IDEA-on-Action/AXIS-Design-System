# WI-0087: theme add · init 애니메이션 안내의 워크스페이스 루트 선언 인정 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | GitHub: #222 | 상태: 🔄 구현 · 검증 완료, 문구 확정 · 릴리스 대기

## 결정
- [x] P1 PnP 종전 · P2 앱 lockfile 종전 · DEC-1 tokens 루트 present · 설치 안내 · DEC-2 tailwind.css 설치본 파일 게이트 · DEC-3 theme 안내 · DEC-4 init 3갈래 · DEC-5 2073 대조 전환 · DEC-6 이름 집합 · devDeps 인정 · DEC-7 · DEC-8 · DEC-9 · cli patch (2026-10-26 사용자 결정)
- [x] 확정 U1 ~ U9(prd 5절: DEC-8 덧붙임 위치, DEC-2 문구 · 1.4.0 이상 불완전 설치 · 이미 있는 줄, 설치 줄 조건, 루트 upgrade 명령, init ③ 문구 · 순서)
- [x] DEC-9 범위 밖 4건 별도 WI 등록 (Master)

## 구현
- [x] `theme-add.ts`: 루트 package.json 1회 읽기(rootPkg), tokens · theme 판정 `declaredDependency`, `DependencyStep.declaredSource`, Tailwind 4 컴포넌트 줄 설치본 파일 게이트 · `CssStep.deferredComponentImports`, P1 · P2 조건(앱 lockfile 5종 `APP_LOCKFILES`)
- [x] `theme/index.ts`: 루트 문구 · 「설치:」 줄 · DEC-8 루트 선언 올리기 줄 · 미삽입 안내 1줄
- [x] `init.ts`: `animationGuideLine` baseDir 인자 · 3갈래 · DEC-6 · P1, 888 호출지 baseDir 전달
- [x] 문서: `packages/axis-cli/README.md` · `docs/guides/theme-customization.md` 의 theme add 의존성 쓰기 · Tailwind 4 컴포넌트 줄 · init 애니메이션 문장, WI-0086 PRD 범위 밖 줄에 해소 표시

## 테스트
- [x] theme-add 새 WI-0087 describe(13항목, 파일 합계 71건) · init 새 20건(160 → 180), 기존 기대 변경은 `init.test.ts` 2073(DEC-5) · `theme-add.test.ts` 718 주석뿐
- [x] 수정 전 소스에서 theme-add 9 빨강 · init 11 빨강(나머지는 종전 동작 고정 대조라 초록)
- [x] 변이 14건(지정 10종 · ⑤ 2곳 · 추가 3종) 각각 빨강 1건 이상, 원복 sha 같음
- [x] 실제 설치 픽스처 신구 비교: depwrite 15 · 미설치 6, tw4comp, anim 15, PnP 음성 · 양성 대조
- [x] turbo lint · type-check · test `--force`(cli · mcp · registry-core, 9/9, Cached 0)

## 릴리스
- [x] changeset `.changeset/wi-0087-theme-add-root-deps.md`(@axis-ds/cli patch)
- [x] PR · 머지
- [x] Release PR 머지 · npm 발행(예상 cli 1.7.5)
- [x] 발행본으로 testplan 3절 픽스처 다시 재기
