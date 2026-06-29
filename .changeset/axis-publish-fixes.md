---
"@axis-ds/tokens": patch
"@axis-ds/ui-react": patch
---

외부 npm 소비 퍼블리싱 버그 3건 수정

- **tokens**: CSS 커스텀 프로퍼티명의 점(`--axis-space-2.5`)을 하이픈(`--axis-space-2-5`)으로 치환. Turbopack/Lightning CSS 파싱 실패(전 페이지 500) 해소.
- **ui-react**: `exports` 서브패스를 실제 빌드 산출물(`dist/<name>/index.*` 중첩 구조)에 맞게 정정하고, dist에서 자동 생성하는 `sync-exports` 스크립트로 드리프트 재발 방지. 누락됐던 6개 컴포넌트(badge/label/select/separator/tabs/toast) 서브패스 export 복구.
- **발행 채널 가드**: workspace 프로토콜 의존 패키지(ui-react/agentic-ui/theme)에 `npm publish` 차단 가드 추가(pnpm/CI 발행만 허용). `workspace:*` 누출로 인한 `npm install` 실패 재발 방지.
- **검증 게이트**: `pack-smoke` 스크립트로 tarball 단위 외부 소비 검증(workspace 누출/exports 미존재/CSS 점 변수)을 release + CI publish에 연결.
