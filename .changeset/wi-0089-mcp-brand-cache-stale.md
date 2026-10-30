---
"@axis-ds/cli": patch
"@axis-ds/mcp": patch
---

MCP `axis.list_brands` · `axis.get_brand` 가 같은 서버 세션에서 `@axis-ds/tokens` 가 바뀐 뒤(업그레이드 · 다운그레이드 · 같은 버전의 브랜드 추가 · 중첩 설치본 제거처럼 Node 가 처음 읽은 package.json 과 달라진 경우) 처음 읽은 상태로 계속 판정하던 결함을 고쳤어요(WI-0089). 서버를 다시 시작하지 않아도 다음 호출이 새 상태를 따라가요.

- 원인: Node 는 `require.resolve` 가 처음 읽은 package.json 을 프로세스가 끝날 때까지 기억해요. 그래서 1.2.1 에서 1.7.0 이상으로 올려도 「브랜드를 지원하지 않습니다」(버전 표시는 새 버전), 1.8.2 에서 1.2.1 로 내리면 「빌드 산출물이 없어」가 나왔고, 같은 버전에 브랜드를 더하면 도구가 `Package subpath ... is not defined by "exports"` 오류로 끝났어요.
- 고친 방식: 같은 프로세스에서 tokens package.json 의 내용(sha256, 패키지를 찾는 동안 본 후보 경로의 「없음」 포함)이 처음 해석했을 때와 다르면 그 호출의 해석만 Worker 스레드에서 해요. 내용이 같으면 종전과 같은 해석이고 비용도 같아요. 바뀐 뒤의 호출은 Worker 하나를 띄우는 만큼(측정 환경에서 약 25 ~ 29 ms) 더 걸려요.
- Worker 를 띄우지 못하거나 응답이 없으면(5 초) 종전처럼 판정하고 응답 끝에 「이 MCP 서버가 @axis-ds/tokens 를 처음 읽은 뒤 내용이 바뀌었는데 새 상태를 다시 읽지 못했습니다 … MCP 서버를 다시 시작하세요」 한 줄을 붙여요. 그 세션에서는 Worker 를 다시 띄우지 않고, 종전 판정으로 읽을 수 없는 새 브랜드는 목록에서 빠져요(도구 오류로 끝나지 않음).
- `axis theme list` · `axis theme info` · `axis theme add` 의 동작과 출력은 바뀌지 않아요. CLI 는 명령마다 새 프로세스라 늘 처음 해석이에요. CLI 와 MCP 가 같은 브랜드 코어(바이트 사본)를 써서 두 패키지를 함께 올려요.
- `axis.check_project` 와 그 밖의 MCP 도구는 바뀌지 않아요(이 해석을 쓰지 않아요).
