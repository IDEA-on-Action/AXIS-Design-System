# WI-0105: Yarn Plug'n'Play 에서 컴포넌트 클래스가 생성되도록 preferUnplugged 선언 릴리스 노트

> 미발행(2026-11-01 작성) | 대상: `@axis-ds/ui-react` patch · `@axis-ds/agentic-ui` patch → 1.8.3 | GitHub: #265
> `@axis-ds/tokens` · `@axis-ds/theme` 는 1.8.2 그대로예요. cli · mcp 는 바뀌지 않아요

## 원인

Yarn Plug'n'Play 는 패키지를 `.yarn/cache` 의 zip 으로 둬요. 컴포넌트 패키지의 `tailwind.css` 에 있는 `@source "./dist"` 가 zip 안을 가리키고, Tailwind 4 스캐너는 실제 디렉터리만 읽어서 컴포넌트 클래스가 하나도 생성되지 않았어요(빌드는 rc 0). 1.8.2 까지는 PnP 루트 `package.json` 에 `dependenciesMeta` 로 직접 unplug 해야 했어요.

## 바뀐 점

- 두 패키지의 `package.json` 에 `"preferUnplugged": true` 를 선언했어요. Yarn(Berry)이 설치할 때 두 패키지를 `.yarn/unplugged` 에 풀어 두므로 별도 설정 없이 컴포넌트 클래스가 생성돼요.
  - 측정(Yarn 4.5.3 · `@tailwindcss/cli` 4.1.14, 이 브랜치 tarball): PnP 1.8.3 의 산출물이 node_modules 설치와 바이트가 같아요(ui-react 47,858 B · agentic-ui 31,530 B). 1.8.2 는 4,455 B · 클래스 0 이에요
- `axis check`(cli 1.7.9 이상)의 Plug'n'Play WARN 은 설치 결과를 보므로, 1.8.3 을 설치하면 설정 없이 사라져요(측정).
- `docs/guides/troubleshooting.md` 에 1.8.3 부터는 설정이 필요 없다는 문단을 더했어요.
- 발행 게이트 `pack-smoke` 가 배포 CSS 에 `@source` 가 있는 패키지는 `preferUnplugged: true` 를 선언했는지 확인해요.

## 바뀌지 않은 점

- npm · pnpm · Yarn node-modules linker 설치: 이 필드를 쓰지 않아 빌드 산출물이 같아요(측정)
- 컴포넌트 · 스타일 · API · exports
- check · init · add 의 판정과 문구

## 알려진 한계

- PnP 에서 두 패키지가 압축을 푼 만큼 디스크를 더 써요(ui-react 약 820 KB · agentic-ui 약 564 KB)
- 루트 `dependenciesMeta` 에 `"unplugged": false` 를 준 프로젝트는 그 설정이 우선해 종전처럼 클래스가 생성되지 않아요. 그 설정을 지우거나 `true` 로 바꾸세요
