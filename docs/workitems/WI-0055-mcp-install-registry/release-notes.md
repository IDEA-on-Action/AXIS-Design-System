# WI-0055 릴리스 노트: MCP 컴포넌트 도구의 레지스트리 전환

> 작성일: 2026-10-23 | WI: WI-0055 | GitHub: #150 | changeset: `@axis-ds/mcp` minor(1.3.0) · `@axis-ds/cli` patch

## 변경 사항

- **공유 설치 코어(D1 · D12)**: cli 의 레지스트리 설치 코어(registry 클라이언트 · add · safe-write · axis-config · site · tailwind-core, 설치 명령 · utils 의존 범위 헬퍼)를 발행하지 않는 `packages/axis-registry-core`(`@axis-ds/registry-core`, private, 0.0.0, src 원본 exports)로 옮겼습니다. cli · mcp 는 devDependencies 로 두고 tsup 이 번들합니다. 발행 `dependencies` 는 바뀌지 않습니다. 코어는 `type-check` 로 검사합니다
- **cli(D10)**: 옛 경로는 같은 이름을 다시 내보내는 심입니다. 동작 · 출력은 1.5.1 과 같습니다(실측 diff 0)
- **install_component(D3 ~ D7)**: 레지스트리 항목을 cli `add` 와 같은 규칙으로 설치합니다. 내용이 다른 기존 파일은 건너뛰고 첫머리에 알리며 `overwrite: true` 만 덮어씁니다. `targetDir` 는 이미 있는 프로젝트 루트이고 config 가 없으면 `components/ui` · `components/agentic` 기본 배치입니다. 의존성은 명령만 안내합니다. `names` 배열을 받습니다
- **list · search · get(D2 · D6)**: 레지스트리 28개(lib 제외)를 보여 주고 `category` 에 `ui` 를 더했습니다. get 은 레지스트리 항목에 components.json 의 Props · 예제를 덧붙입니다
- **출처(D8)**: 호출마다 `AXIS_REGISTRY_URL` → 기준 디렉터리 config → pages.dev, 실패하면 `dist/registry`(빌드 때 cli 의 `copy-registry.mjs` 로 같은 검증을 거쳐 복사). 캐시하지 않습니다
- **사본 정리(D9)**: mcp 의 `tailwind-core.ts` 바이트 사본과 동일성 테스트를 지우고 코어를 씁니다. brand-core 사본은 그대로입니다
- **게이트**: mcp-smoke(원격 차단 동봉본으로 28개 · agentic 설치 · 건너뜀 · overwrite · 이탈 거부), pack-smoke(mcp `dist/registry` 필수, 코어 누출 검사), mcp turbo inputs(레지스트리 · 코어 src · copy-registry), cli turbo build inputs(코어 src)

## 호환성

- 도구 이름 · `targetDir` · `name` · `category` 종전 값은 그대로 받습니다. 결과 머리글(「# 컴포넌트 설치 완료」 · 「# 컴포넌트 설치 실패」 · 「# AXIS Design System 컴포넌트 목록」)도 유지합니다
- 바뀐 동작: 없는 `targetDir` 는 만들지 않고 실패합니다(종전에는 만들었음). 기존 파일을 묻지 않고 덮어쓰지 않습니다. button 등 5개도 shadcn 원형이 아니라 AXIS 레지스트리 내용이 설치되고 utils 가 함께 설치됩니다. search 결과의 「의존성」 줄은 빠졌습니다(index 에 의존성이 없음, get 에서 봅니다)
- 컴포넌트 도구가 이제 네트워크(기본 pages.dev, 5초 timeout)를 씁니다. 막힌 환경에서는 동봉본으로 동작하고 그 사실을 응답에 적습니다

## 알려진 한계

- 동봉본은 mcp 빌드 시점의 레지스트리입니다. 원격과 version 이 다르면 안내 1줄을 내고 원격을 씁니다
- cli 에는 여전히 `type-check` 스크립트가 없습니다(WI-0056 기록대로 기존 tsc 오류가 있음). cli 쪽 타입 오류는 코어로 옮긴 파일만 코어 type-check 가 잡습니다
- 기준 디렉터리의 `axis.config.json` 이 깨진 JSON 이면 install 은 cli 처럼 실패하고, list · search · get 은 config 없이 기본 주소로 읽습니다(cli list 와 같음)
