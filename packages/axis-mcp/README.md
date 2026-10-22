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
