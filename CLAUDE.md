# AXIS Design System 개발 가이드

> Claude와의 개발 협업을 위한 프로젝트 핵심 문서

**현재 버전**: cli 1.8.0, mcp 1.5.0, ui-react · agentic-ui 1.8.5, tokens · theme 1.8.2 | **상태**: ✅ Active Development
**npm 배포**: ui-react · agentic-ui 1.8.5 (2026-11-01, WI-0108 Popover · DropdownMenu · Sheet 그림자를 브랜드 토큰 var(--axis-shadow-lg) 로 통일, 나머지 그대로), cli 1.8.0 · mcp 1.5.0 (2026-11-01, WI-0107 템플릿 규칙 검사). 이전 배포 이력은 각 패키지 CHANGELOG.md · git log · WI release-notes 에 있어요

---

## ⚠️ 환경 참고

- **OS**: Windows - 경로에 `\` 사용, bash 명령 호환성 주의
- **Shell**: PowerShell/Git Bash 환경에서 pnpm 스크립트 실행
- **Shell 격리**: Claude Code Bash 도구는 별도 프로세스 - 사용자 터미널의 환경변수 미공유. 인증 토큰 등은 시스템 환경변수로 등록하거나 명령에 `export`로 포함 필요
- **Windows + bash 루프**: `for` 루프에서 Windows 경로 `\`가 변수 보간과 충돌 - 개별 명령으로 분리하여 실행
- **개발 서버**: `pnpm dev:web` → `localhost:3100`
- **배포**: Cloudflare Pages (`@opennextjs/cloudflare`)
- **상태관리**: Zustand 5 + TanStack React Query 5
- **아이콘**: Lucide React

---

## 📦 npm 배포 참고

> 인증(OIDC Trusted Publishing) · 비상 수동 배포 · publish 부수효과는 `/ax-release`(`.claude/commands/ax-release.md`)에 있어요

- **tokens 를 올리면 mcp 도 함께**: `@axis-ds/tokens` 를 올리는 changeset 이 있으면 같은 발행에 `@axis-ds/mcp` patch 이상을 반드시 넣어요(같은 파일이든 다른 파일이든). mcp 는 빌드할 때 tokens dist 값을 동봉하고(WI-0076) tokens 를 devDependency 로만 가져서, tokens 만 발행하면 mcp 는 다시 발행되지 않고 MCP 토큰 응답이 이전 값으로 남아요. CI `pnpm check-changeset-mcp-tokens` 가 위반을 막아요
- **registry-core 를 바꾸면 cli · mcp 둘 다**: `packages/axis-registry-core/` 아래 파일을 바꾸는 PR 은 미발행 changeset 에 `@axis-ds/cli` 와 `@axis-ds/mcp` 올림을 모두 넣어요(registry-core 는 private 0.0.0 이라 발행되지 않고 cli · mcp 가 빌드 때 번들해서, 한쪽만 올리면 다른 쪽이 낡은 코어로 남아요, WI-0080 · 배치 6b 사용자 결정). 같은 `pnpm check-changeset-mcp-tokens` 가 PR 은 `origin/<base>` 와의 merge-base, main push 는 push 이전 커밋(`github.event.before`, frontend.yml 이 `AXIS_PUSH_BEFORE` 로 넘김)과의 merge-base(없으면 `HEAD^`), 로컬은 `origin/main` 과의 merge-base 를 기준으로 바뀐 파일을 보고, 기준을 못 구하면 exit 2 예요(CI checkout 은 `fetch-depth: 0`). 로컬은 커밋 전 워킹트리 변경도 셈하므로 `origin/main` 이 낡았으면 `git fetch origin` 뒤 돌려요
- **현재 배포 버전**: ui-react · agentic-ui 1.8.5 (2026-11-01 배포, run 41287266133, PR #278 을 Version PR #279 로 발행, WI-0108 떠 있는 레이어 그림자 토큰 통일), cli 1.8.0 · mcp 1.5.0 (2026-11-01 배포, run 41275421252, cli · mcp minor · ui-react · agentic-ui patch, PR #275 를 Version PR #276 으로 발행, provenance 4/4. WI-0107: axis.config.json 의 template 값으로 고른 템플릿 규칙(ontology-console 5규칙)을 registry-core 내장 모듈로 검사해 위반은 WARN(rc 0), 판정 못 한 파일이 있으면 WARN 「일부 측정 실패」. template 값이 없으면 출력이 종전과 바이트 같음. tokens · theme 1.8.2 그대로). 이전 배포는 CHANGELOG.md · git log 참고
- **정식 주소**: `https://axis-design-system.pages.dev` 이고 사용자 config 에 기록되므로 Cloudflare Pages 프로젝트 `axis-design-system` 은 삭제 · 이름 변경 금지

---

## 📝 참고사항

- **문서 인덱스**: [docs/INDEX.md](docs/INDEX.md)
- **Monorepo 설정**: [docs/guides/monorepo-setup.md](docs/guides/monorepo-setup.md)
- **Agentic UI 디자인**: [docs/guides/agentic-ui-design.md](docs/guides/agentic-ui-design.md)
- **템플릿**: [컴포넌트 PRD](docs/templates/component-prd.md) · [컴포넌트 스펙](docs/templates/component-spec.md) · [릴리스 노트](docs/templates/release-notes.md) · [ADR](docs/templates/adr.md)
