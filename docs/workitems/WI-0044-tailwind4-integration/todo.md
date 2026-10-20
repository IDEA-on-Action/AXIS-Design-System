# WI-0044: Tailwind 4 프로젝트의 AXIS 연동 TODO

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | 릴리스 노트: [release-notes.md](./release-notes.md) | 상태: 🔄 진행 중 (2026-10-20, 구현 · 문서 · 보정 2차 완료, 통합 검증 · 머지 · 배포 전)

## FR-1 토큰 진입점 (D1)
- [x] `build-tokens.mjs` 6단계에서 `src/tailwind-preset.ts` 를 읽어 `dist/css/tailwind4.css` 생성(`scripts/tailwind4.mjs`)
- [x] 색 24 · radius 3 · 글꼴 3 → `@theme inline`, `darkMode: ['class']` → `@custom-variant dark (&:where(.dark, .dark *))` (D5)
- [x] 모르는 항목(extend 새 키 · 다른 dark 전략 · extend 밖 테마 키 · 문자열 아닌 값)은 throw
- [x] 토큰 CSS 를 `layer(base)` 로 함께 import(한 줄 import 결정, 실측 근거는 testplan 2절)
- [x] `exports` 에 `./css/tailwind4`
- [x] `test/tailwind4.test.mjs` 14개, 생성기 변이 5종 음성 대조 (AC5)
- [x] 기존 dist 13개 파일 sha256 변경 전후 일치 (AC3)

## FR-2 패키지 스캔 진입점 (D2)
- [x] D2 전제 실측: import 한 CSS 안의 상대 `@source` 가 npm 실디렉터리 · pnpm 심볼릭 링크 · workspace 링크에서 동작
- [x] `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 루트에 `tailwind.css`(`@source "./dist";`), `files` · `exports` 에 추가
- [x] ui-react `sync-exports.mjs` 의 `STATIC_EXPORTS`(갱신 시 `./tailwind.css` 유지, 타깃 없으면 exit 1)
- [x] `scripts/pack-smoke.mjs` 검사 5번(tarball 포함 · `@source` 존재 · 상대 경로 실재), 변이 3종 음성 대조

## FR-3 · FR-4 CLI · MCP (D3)
- [x] `axis init`: Tailwind 4 에서 import 줄 · 이름 충돌 주의 · tokens 설치 명령 안내(파일은 고치지 않음)
- [x] `axis init`: Tailwind 4 에서 `tailwindConfig` 를 기록하지 않고 묻지 않음
- [x] `axis check` · MCP: Tailwind 4 + 토큰 진입점 없음 → WARN, 있음 → PASS, 공유 코어 사본 동일
- [x] WI-0042 테스트 5건(CLI 4 · MCP 1) fixture 에 진입점 줄 추가(동작 변경 반영)

## FR-5 문서
- [x] 패키지 README: tokens · ui-react · agentic-ui · cli 에 Tailwind 4 절(Tailwind 3 절 유지), tokens README 에 dark 변형 차이(D5)
- [x] `docs/guides/quick-start.md`: 「Tailwind CSS 4」 절(import 순서 · create-next-app 기본 블록 충돌 · Tailwind 3 과 다른 점)
- [x] `docs/guides/troubleshooting.md`: 스캔 원인을 Tailwind 4 `@source` 로 넓히고 Tailwind 4 증상표
- [x] `docs/guides/theme-customization.md`: Tailwind 4 브랜드 import 순서, dark 변형 차이(D5), `@theme inline` 확장 예시
- [x] `docs/guides/component-usage.md`: `--radius` 가 닿는 조건에 Tailwind 4 진입점 추가
- [x] 문서 사이트 `/docs`: 「Tailwind CSS」 절(4 · 3)
- [x] changeset: linked 3패키지(tokens · ui-react · agentic-ui) minor, cli minor, mcp patch

## 보정 (2026-10-20 사용자 결정 3건 + 문서, testplan 6절)
- [x] globals.css 오탐: tokens CSS import(`css` · `css/shadcn` · `css/tailwind4`)를 변수 정의로 인정, 공유 코어 `checkGlobalsCss` 로 CLI · MCP 같은 문구, 기준선 불변
- [x] init 충돌 문구를 `:root` · `@theme inline` · `@media (prefers-color-scheme: dark)` · `body` 네 블록으로 넓힘, quick-start 와 대조 테스트
- [x] 1.4.0 미만 · 판정 불가 선언에 `^1.4.0` 업그레이드 명령(init), check 진입점 WARN 에 「1.4.0 이상 필요」
- [x] 문서: quick-start Tailwind 4 절의 Tailwind 3 import 참조 오류, 색 미지정 border 기본색 차이(tokens README · quick-start · PRD 4절), cli README · changeset
- [x] 변이 음성 대조 2종(import 인정 끄기 · 버전 조건 끄기) 빨강, sha256 원복 확인

## 보정 2차 (2026-10-20 사용자 결정 7건, testplan 7절)
- [x] A1: 판정 불가 범위는 「설치된 버전이 1.4.0 이상인지 확인하세요」로 나눔, `workspace:` 제외(init · check 같은 규칙)
- [x] A2: quick-start · changeset · cli README · release-notes 의 버전 조건 서술을 코드와 맞춤
- [x] A3: 범위 하한 분기 테스트(하이픈 왼쪽 · 비교자 집합 최고 하한), `rangeLowerAtLeast` · `axisPackagesBelowTailwind4` 직접 호출
- [x] A4: 진입점이 있어도 tokens 선언이 1.4.0 조건에 걸리면 WARN
- [x] B1: 선언된 ui-react · agentic-ui 의 `tailwind.css` import 누락 WARN
- [x] B2: 진입점이 있는데 create-next-app 기본 정의가 남으면 WARN(tailwind 항목, create-next-app@15.5.28 실물 fixture)
- [x] B3: Tailwind 3 설정 파일의 `@axis-ds/tokens/tailwind` preset 참조 PASS, 기준선 불변, 1.3.0 대비 차이를 release-notes 에 기록
- [x] C: 여러 문제를 우선순위 순서로 ` / ` 로 잇고 버전 안내는 끝에 한 번, CLI · MCP 같은 문구 테스트
- [x] D: cli README · quick-start · troubleshooting · release-notes · testplan 7절 · changeset
- [x] E: cli 319 · mcp 39 통과, build rc 0, cli tsc 20 불변, 변이 4종 빨강 · sha256 원복, MCP 사본 cmp, scratch 세 프로젝트 init · check

## 검증 · 릴리스
- [ ] AC1 · AC2 실경로: create-next-app 15.5.28 + Playwright 계산 스타일(Button `#3B82F6`, `bg-primary`, `--radius` 프로브, ontology)
- [ ] AC4 실경로: 빌드한 cli · mcp 를 Tailwind 4 · 3 앱에서 실행
- [ ] AC6: `pnpm exec turbo run type-check|lint|build|test --force` · `pnpm pack-smoke`(통합 브랜치 기준)
- [ ] 미측정 항목 정리: 다크 모드 실앱 · hover · Next 16 · turbopack
- [ ] PR 생성 · 머지
- [ ] Version PR 머지 → npm 배포(tokens · ui-react · agentic-ui · theme 1.4.0, cli 1.4.0, mcp 1.2.2) 확인. tokens 1.4.0 이 cli 보다 먼저 또는 함께 배포돼야 `axis init` 의 설치 안내가 성립
- [ ] 배포본으로 AC1 재확인, project-todo.md · wi-mapping 현행화
