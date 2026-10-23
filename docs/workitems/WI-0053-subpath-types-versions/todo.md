# WI-0053: 서브패스 타입 해석(typesVersions) TODO

> PRD: [prd.md](./prd.md) | GitHub: #147

## 1단계 실측 · 초안
- [x] 배포본 1.5.0 해석 방식별(node · node16 CJS/ESM · bundler) tsc 실측, 루트 양성 대조, explainFiles 로 해석 수 확인
- [x] tsconfig 없는 Next 15.5.28 앱 `next build` 재현(음성 대조), Next 생성 tsconfig 의 `moduleResolution: "node"` 확인
- [x] create-next-app@15.5.28 템플릿 9종 `bundler` 확인
- [x] 시제품 A(명시 typesVersions) · B(와일드카드) · B'(와일드카드 + 루트 보호) · C(stub 디렉터리) 실측
- [x] skipLibCheck=false 재실측으로 cva `/types` 변형 타입 소실 발견(PRD 1.4)
- [x] D1~D7 결정 반영(2026-10-23, PRD v1.0)

## FR-1 typesVersions
- [x] ui-react(30) · agentic-ui(18) · tokens(4) `package.json` 에 생성 결과 기록, theme 은 없음

## FR-2 생성 · 검사
- [x] `scripts/sync-types-versions.mjs`(쓰기 · `--check` · `--only`) + `scripts/sync-types-versions.test.mjs`(8건)
- [x] ui-react `build` 에 연결, 루트 `sync-types-versions` · `check-types-versions` 스크립트, CI(frontend.yml) 한 단계
- [x] 변이: exports 항목 추가 · 삭제 · 타깃 변경, theme 임의 추가 시 `--check` rc 1, 생성 후 rc 0

## FR-3 소비자 해석 게이트
- [x] `scripts/types-resolution-gate.mjs` + pack-install-smoke G2 연결(탐침 56 × 4방식 = 224건, 해석 파일 대조, 대상 0 · 행 수 불일치는 exit 2)
- [x] 음성 대조: 1.5.0 tarball 결함 52건, typesVersions 만 뺀 ui-react 30건, 잘못된 타깃 변이 1건

## FR-4 문서
- [x] changeset · release-notes 에 해석 방식과 영향 기록

## 검증
- [x] AC1~AC5, tsconfig 없는 Next 앱 `next build` rc 0(testplan)
- [x] changeset(tokens · ui-react · agentic-ui patch), release-notes, testplan
