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

## 문서

자세한 사용법은 [AXIS Design System 문서](https://axis.minu.best)를 참고하세요.

## 라이선스

MIT
