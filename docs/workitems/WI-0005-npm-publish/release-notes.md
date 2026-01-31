# 릴리스 노트 — WI-0005: npm 배포 인프라

> 릴리스 날짜: 2026-02-01

---

## 요약

@axis-ds/* 패키지의 npm 배포 파이프라인을 구축하여 changesets 기반 버전 관리 및 GitHub Actions 자동 배포를 지원합니다.

---

## 변경 내역

### ✨ 추가 (Added)

- GitHub Actions 배포 워크플로우 (`.github/workflows/publish.yml`)
  - lint → type-check → build 품질 게이트 포함
  - changesets/action 기반 자동 Release PR 및 npm publish
- @changesets/cli 및 @changesets/changelog-github 설치
- `.changeset/config.json` 설정 (linked packages, public access)
- 루트 스크립트: `changeset`, `version-packages`, `release`
- 6개 패키지 `publishConfig: { "access": "public" }` 추가
- 6개 패키지 `prepublishOnly` 스크립트 추가
- 패키지별 README.md 작성 (tokens, ui-react, agentic-ui, theme, cli, mcp)

### 🔄 변경 (Changed)

- CLI 패키지명 `axis-cli` → `@axis-ds/cli` 통일

---

## Breaking Changes

없음. 신규 인프라 추가이므로 기존 사용에 영향 없습니다.

---

## 검증 방법 (How to Verify)

1. `pnpm install` 실행
2. `pnpm build` — 전체 패키지 빌드 성공 확인
3. `pnpm type-check` — 타입 체크 통과 확인
4. `pnpm lint` — 린트 통과 확인
5. 각 패키지에서 `npm pack --dry-run` 실행하여 배포 대상 파일 확인

---

## 알려진 이슈

- NPM_TOKEN 시크릿이 GitHub repository settings에 등록되어야 실제 npm publish가 동작합니다.
  - 설정 경로: GitHub repo → Settings → Secrets and variables → Actions → `NPM_TOKEN`
  - npm 토큰 생성: [npmjs.com](https://www.npmjs.com) → Access Tokens → Generate New Token (Automation)

---

## 기여자

- @anthropic-claude (AI 구현)
- @sinclair (프로젝트 리드)
