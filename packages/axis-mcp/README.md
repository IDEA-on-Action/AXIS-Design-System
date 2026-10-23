# @axis-ds/mcp

AXIS Design System의 MCP(Model Context Protocol) 서버입니다. AI 어시스턴트가 컴포넌트를 검색하고 설치할 수 있도록 지원합니다.

## 설치

```bash
npm install @axis-ds/mcp
# or
pnpm add @axis-ds/mcp
```

## 사용법

Claude Desktop 또는 기타 MCP 호환 클라이언트에서 설정:

```json
{
  "mcpServers": {
    "axis": {
      "command": "npx",
      "args": ["@axis-ds/mcp"]
    }
  }
}
```

## 컴포넌트 도구

`npx @axis-ds/cli add` · `list` 와 같은 레지스트리를 읽고 같은 규칙으로 설치합니다(1.3.0, WI-0055).

| 도구 | 인자 | 응답 |
|------|------|------|
| `axis.list_components` | `category?`(core · form · layout · agentic · ui) | Core UI 10개 · Agentic UI 18개, 출처(원격 · MCP 포함본)와 version |
| `axis.search_components` | `query`, `category?` | 이름 · 제목 · 설명 검색 |
| `axis.get_component` | `name` | 설명 · 의존성 · 함께 설치되는 항목 · 파일 · Props · 예제 |
| `axis.install_component` | `name` 또는 `names`, `targetDir`, `overwrite?` | 쓴 파일 · 건너뛴 파일 · 의존성 설치 명령 |

- 레지스트리 주소: `AXIS_REGISTRY_URL` → 기준 디렉터리의 `axis.config.json` `registry` → `https://axis-design-system.pages.dev/r`. 원격에 닿지 못하면 패키지에 포함된 레지스트리(`dist/registry`)를 씁니다. 기준 디렉터리는 install 이 `targetDir`, 나머지는 서버의 현재 디렉터리입니다. 응답에는 사용한 주소와 출처(환경변수 · config · 기본값 · 포함본)를 항상 적습니다.
- 보안: `axis.config.json` 의 `registry` 는 **https 이고 루프백 · 사설 · 링크로컬 주소가 아닐 때만** 씁니다(호스트 이름은 DNS 결과로 판정). 아니면 그 값을 무시하고 기본 주소로 조회하며 그 사실을 응답에 적고, 쓰는 경우에도 리다이렉트를 따라가지 않으며 연결 단계에서 고른 주소를 다시 판정합니다(DNS 리바인딩 대비). 신뢰할 수 없는 저장소의 config 가 내부망으로 요청을 보내지 못하게 하려는 것입니다. 사내 레지스트리를 쓰려면 MCP 서버 설정의 환경변수 `AXIS_REGISTRY_URL` 로 주세요(제한하지 않음).
- 이름은 레지스트리 이름 그대로입니다. Agentic UI 는 `agentic-` 접두를 붙입니다(예: `agentic-run-progress`). 의존 항목(`utils` · `agentic-a11y-labels`)은 함께 설치됩니다.
- `targetDir` 는 이미 있는 프로젝트 루트입니다(상대 경로는 서버의 현재 디렉터리 기준). `axis.config.json` 이 있으면 그 `componentsDir` · `agenticDir` 에, 없으면 `components/ui` · `components/agentic` 에 설치하고 그 사실을 알립니다. 프로젝트 밖으로 나가는 경로는 아무것도 쓰지 않고 실패합니다.
- 내용이 다른 기존 파일은 덮어쓰지 않고 건너뛰며 응답 첫머리에 건너뛴 수를 적습니다. `overwrite: true` 일 때만 덮어씁니다.
- 의존성은 설치하지 않고 lockfile 에 맞는 명령(`pnpm add` · `npm install` · `yarn add`)만 안내합니다.

## 브랜드 도구

대상 프로젝트에 설치된 `@axis-ds/tokens`(1.3.0 이상)의 브랜드를 읽습니다. 패키지에 데이터를 번들하지 않으며, CLI `axis theme list` · `axis theme info` 와 같은 내용을 돌려줍니다.

| 도구 | 인자 | 응답 |
|------|------|------|
| `axis.list_brands` | `targetDir?` | 브랜드 이름 · 설명 · 테마 · import 경로 |
| `axis.get_brand` | `name`, `targetDir?` | import 경로 · Provider 예시(`defaultBrand`) · 주요 토큰(라이트 · 다크) · 보정 내역(a11y 메타) |

- `targetDir` 를 주지 않으면 서버의 현재 디렉터리를 봅니다.
- `@axis-ds/tokens` 가 없거나 1.3.0 미만이거나 빌드 산출물이 없으면 오류(`isError`)가 아니라 설치 · 업그레이드 안내를 돌려줍니다. 빈 목록으로 답하지 않습니다.
- 프로젝트에 적용하는 일(import 추가 · `axis.config.json` 의 `brand`)은 CLI `axis theme add <brand>` 가 맡습니다.

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis-design-system.pages.dev)를 참고하세요.

## 라이선스

MIT
