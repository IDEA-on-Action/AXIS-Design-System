# WI-0053: 서브패스 타입 해석(typesVersions) TODO

> PRD: [prd.md](./prd.md) | GitHub: #147

## 1단계 실측 · 초안
- [x] 배포본 1.5.0 해석 방식별(node · node16 CJS/ESM · bundler) tsc 실측, 루트 양성 대조, explainFiles 로 해석 수 확인
- [x] tsconfig 없는 Next 15.5.28 앱 `next build` 재현(음성 대조), Next 생성 tsconfig 의 `moduleResolution: "node"` 확인
- [x] create-next-app@15.5.28 템플릿 9종 `bundler` 확인
- [x] 시제품 A(명시 typesVersions) · B(와일드카드) · B'(와일드카드 + 루트 보호) · C(stub 디렉터리) 실측
- [x] skipLibCheck=false 재실측으로 cva `/types` 변형 타입 소실 발견(PRD 1.4)
- [ ] D1~D7 결정 반영(PRD 2절 「결정」 표로 교체)

## FR-1 typesVersions
- [ ] ui-react · agentic-ui · tokens `package.json` 에 생성 결과 기록

## FR-2 생성 · 검사
- [ ] `scripts/sync-types-versions.mjs`(쓰기 · `--check`)
- [ ] ui-react `build` 에 연결, 루트 `package.json` 스크립트와 CI(frontend.yml) 에 `--check`
- [ ] 변이: exports 항목 추가 · 삭제 시 `--check` rc 1

## FR-3 소비자 해석 게이트
- [ ] pack-install-smoke G2 소비자에서 node · node16 · bundler tsc, explainFiles 해석 수 판정, 대상 0 개는 exit 2
- [ ] 음성 대조: 1.5.0 tarball 로 node 52건 실패 확인

## FR-4 문서
- [ ] README 지원 해석 방식 안내

## 검증
- [ ] AC1~AC5, tsconfig 없는 Next 앱 `next build` rc 0
- [ ] changeset(D7), release-notes, testplan
