# AXIS Design System 개발 가이드

> Claude와의 개발 협업을 위한 프로젝트 핵심 문서

**현재 버전**: ui-react · agentic-ui 1.8.3, tokens · theme 1.8.2, cli 1.7.10, mcp 1.4.9 | **상태**: ✅ Active Development
**npm 배포**: ui-react · agentic-ui 1.8.3 (2026-11-01, WI-0105 Yarn PnP 에서 컴포넌트 tailwind.css 가 스캔되도록 preferUnplugged 선언, tokens · theme 1.8.2 · cli 1.7.10 · mcp 1.4.9 그대로), cli 1.7.10 · mcp 1.4.9 (2026-11-01, WI-0099 · 0095). 이전 배포 이력은 각 패키지 CHANGELOG.md · git log · WI release-notes 에 있어요

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
- **현재 배포 버전**: cli 1.7.10 · mcp 1.4.9 (2026-11-01 배포, run 41241569184, cli · mcp patch, PR #267 · #269 를 Version PR #268 하나로 발행, provenance 2/2. WI-0099: init 의 Tailwind 4 애니메이션 안내가 registry-core `inspectTailwind4Animation` 하나로 check 와 같은 판정을 씀(check 판정 · 문구는 바이트 그대로). WI-0095: Yarn PnP 에서 워크스페이스 루트에만 선언한 패키지를 init · axis add · MCP install_component 도 「선언됨」으로 보지 않고 앱에 추가하라고 안내함. linked 4패키지 1.8.2 그대로). 이전 배포는 CHANGELOG.md · git log 참고
- **정식 주소**: `https://axis-design-system.pages.dev` 이고 사용자 config 에 기록되므로 Cloudflare Pages 프로젝트 `axis-design-system` 은 삭제 · 이름 변경 금지

---

## 📝 참고사항

- **문서 인덱스**: [docs/INDEX.md](docs/INDEX.md)
- **Monorepo 설정**: [docs/guides/monorepo-setup.md](docs/guides/monorepo-setup.md)
- **Agentic UI 디자인**: [docs/guides/agentic-ui-design.md](docs/guides/agentic-ui-design.md)
- **템플릿**: [컴포넌트 PRD](docs/templates/component-prd.md) · [컴포넌트 스펙](docs/templates/component-spec.md) · [릴리스 노트](docs/templates/release-notes.md) · [ADR](docs/templates/adr.md)
