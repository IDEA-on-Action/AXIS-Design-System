# @axis-ds/cli

## 1.2.1

### Patch Changes

- 97e5d92: fix: `axis init` 이 utils.ts 의존성을 추가하고 실행 안내를 `@axis-ds/cli` 로 정정 (WI-0038)
  - `axis init` 이 만드는 `utils.ts` 가 import 하는 `clsx` · `tailwind-merge` 를 `package.json` 의 `dependencies` 에 없을 때만 추가해요(`clsx ^2.1.1`, `tailwind-merge` 는 설치된 tailwindcss 나 `package.json` 선언(범위면 하한)이 Tailwind 4 이상이면 `^3.4.0`, 3 이하이거나 판정할 수 없으면 `^2.6.0`). 판정할 수 없어 기본값을 썼거나 설치본과 선언이 다르면 경고 줄로 알려요. 이미 `dependencies` 나 `devDependencies` 에 있으면 범위를 그대로 둬요
  - 설치는 실행하지 않고 lockfile 로 고른 설치 명령(`pnpm install` · `yarn install` · `npm install`)을 안내해요. `package.json` 이 없거나 쓸 수 없으면 바꾸지 않고 추가 명령을 안내해요
  - `package.json` 의 키 순서 · 들여쓰기 · CRLF · 끝 줄바꿈 · BOM 을 유지하고, 다시 실행해도 결과가 같아요
  - CLI 출력과 문서의 실행 안내 `npx axis-cli ...` 를 `npx @axis-ds/cli ...` 로 고쳤어요. `axis-cli` 는 npm 에서 unpublish 된 다른 이름이라 실행하면 안 돼요

## 1.2.0

### Minor Changes

- b43c921: feat: 브랜드 테마 명령과 MCP 브랜드 도구 추가 (WI-0028)
  - CLI `axis theme list` · `axis theme info <brand>` · `axis theme add <brand>` 를 더했어요. 대상 프로젝트에 설치된 `@axis-ds/tokens`(1.3.0 이상)의 `./brands` 산출물을 읽어요
  - `axis theme add` 는 globals.css 에 브랜드 `@import` 한 줄, `package.json` 에 `@axis-ds/tokens`, `axis.config.json` 에 `brand` 를 기록해요. 두 번 실행해도 결과가 같고, 설치는 실행하지 않고 안내만 해요
  - `axis check` 와 MCP `axis.check_project` 가 `axis.config.json` 의 `brand` 와 실제 import 가 맞는지 검사해요. `brand` 가 없는 프로젝트의 결과는 그대로예요
  - MCP 도구 `axis.list_brands` · `axis.get_brand` 를 더했어요(도구 16개 → 18개). CLI 와 같은 코어로 대상 디렉터리를 읽어요
  - CLI `--version` 과 MCP `serverInfo.version` 이 `package.json` 의 버전을 읽어요(종전 `0.1.0` 고정)

## 1.1.4

### Patch Changes

- chore: npm Trusted Publishing(OIDC) 배포 경로로 첫 발행하고, `repository.url`을 실제 저장소(`IDEA-on-Action/AXIS-Design-System`)로 정정
  - 코드 변경은 없어요. npm 패키지 페이지의 Repository 링크와 provenance 출처가 실제 저장소를 가리키게 돼요

## 1.1.3

### Patch Changes

- fix: 죽은 도메인 `ds.minu.best` 참조를 `axis.minu.best`로 통합
  - CLI 기본 `REGISTRY_URL`/`$schema`, 템플릿 URL을 살아있는 도메인으로 교체 (기존 `ds.minu.best`는 NXDOMAIN이라 컴포넌트/템플릿 fetch 실패)
  - 문서 URL 경로 정합: `getDocsUrl`이 `agentic`은 `/agentic/`, 그 외 카테고리는 `/components/`로 매핑 (기존 `/ui/`는 실 라우트 404)

## 1.1.0

### Minor Changes

- dc711a8: 외부 프로젝트 연동을 위한 패키지 설정 개선
  - @axis-ds/tokens: Dark mode CSS Variables 빌드 추가, shadcn 호환 CSS Variables (shadcn-compat.css) 생성, Tailwind CSS preset 추가
  - 전체 패키지: sideEffects 필드 추가, README 개선
  - examples/nextjs-app: 외부 프로젝트 연동 예제 추가
