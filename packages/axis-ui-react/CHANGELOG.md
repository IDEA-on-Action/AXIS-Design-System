# @axis-ds/ui-react

## 1.1.3

### Patch Changes

- bdbd1ad: 외부 npm 소비 퍼블리싱 버그 3건 수정
  - **tokens**: CSS 커스텀 프로퍼티명의 점(`--axis-space-2.5`)을 하이픈(`--axis-space-2-5`)으로 치환. Turbopack/Lightning CSS 파싱 실패(전 페이지 500) 해소.
  - **ui-react**: `exports` 서브패스를 실제 빌드 산출물(`dist/<name>/index.*` 중첩 구조)에 맞게 정정하고, dist에서 자동 생성하는 `sync-exports` 스크립트로 드리프트 재발 방지. 누락됐던 6개 컴포넌트(badge/label/select/separator/tabs/toast) 서브패스 export 복구.
  - **발행 채널 가드**: workspace 프로토콜 의존 패키지(ui-react/agentic-ui/theme)에 `npm publish` 차단 가드 추가(pnpm/CI 발행만 허용). `workspace:*` 누출로 인한 `npm install` 실패 재발 방지.
  - **검증 게이트**: `pack-smoke` 스크립트로 tarball 단위 외부 소비 검증(workspace 누출/exports 미존재/CSS 점 변수)을 release + CI publish에 연결.

- Updated dependencies [bdbd1ad]
  - @axis-ds/tokens@1.1.3

## 1.1.0

### Minor Changes

- dc711a8: 외부 프로젝트 연동을 위한 패키지 설정 개선
  - @axis-ds/tokens: Dark mode CSS Variables 빌드 추가, shadcn 호환 CSS Variables (shadcn-compat.css) 생성, Tailwind CSS preset 추가
  - 전체 패키지: sideEffects 필드 추가, README 개선
  - examples/nextjs-app: 외부 프로젝트 연동 예제 추가

### Patch Changes

- Updated dependencies [dc711a8]
  - @axis-ds/tokens@1.1.0
