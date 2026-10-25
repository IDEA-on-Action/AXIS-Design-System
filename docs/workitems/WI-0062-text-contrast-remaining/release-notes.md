# WI-0062 릴리스 노트: 기본 테마 텍스트 대비 잔여

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #170 | 대상: `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` minor, `@axis-ds/cli` · `@axis-ds/mcp` patch(배치 4 ② 묶음과 함께 linked 1.8.0 으로 발행 예정)

## 바뀐 점

기본 테마(브랜드 미지정)에서 4.5:1 에 못 미치던 글자를 모두 4.5:1 이상으로 맞췄어요. **ontology 브랜드의 토큰 출력은 바이트 그대로예요.** ontology 에서 렌더가 바뀌는 곳은 Toast 설명(불투명 글자, 경고 · 오류 3.95 → 4.50) 하나예요.

| 대상 | 1.7.0 | 이번 변경 뒤 |
|---|---|---|
| AgentAvatar 이니셜(assistant · tool) | 흰 글자 3.95 · 3.67 | 5.38 · 5.17(바탕 purple.600 · blue.600) |
| RunProgress 대기 단계 숫자 | 흰 글자 1.47 | gray.700 글자 7.00 |
| Toast 설명 | `opacity-90` 으로 성공 · 경고 3.99 · 3.98 | 불투명 글자 4.79 · 4.76 |
| TokenUsage 경고 · 초과 글자 | 노랑 1.91 · 빨강 3.76 | `text-warning` 4.92 · `text-error` 6.47 |
| DiffViewer 추가 · 삭제 줄 글자 | 3.02 · 4.22(다크 삭제 3.89) | 4.60 · 5.66(다크 6.80) |
| DiffViewer 헤더 `+N` · `-N` | 2.07 · 3.41 | 회색 `text-secondary` 6.87 · `text-error` 5.88 |
| 회색 바탕 위 보조 글자(DiffViewer 탭 · 줄 번호, CodeBlock 언어 배지, ContextPanel 제공자 · 버전, ToolCallCard 소요 시간, DropdownMenuShortcut) | `text-tertiary` 3.90~4.43 | `text-secondary` 6.10 이상 |
| Input · Select placeholder | 2.53 | 4.83(다크 7.93 그대로) |
| shadcn 호환 `--destructive`(라이트) | red.500, 흰 글자 3.78 | red.600, 4.83 |
| 비활성 버튼 토큰(소비처 없음) | 3.28 · 다크 4.05 | 5.13 · 다크 5.78 |

## 업그레이드

컴포넌트를 그대로 쓰면 코드를 바꿀 필요가 없어요. 토큰 값을 직접 참조한다면 아래를 확인하세요.

| 직접 참조한 변수 | 바뀐 값(기본 라이트 / 다크) | 확인할 것 |
|---|---|---|
| `--axis-agent-avatar-assistant` · `--axis-agent-avatar-tool` | #9333EA · #2563EB (라이트 · 다크 같음) | 아바타 바탕을 직접 칠했다면 한 단계 짙어져요 |
| `--axis-status-neutral-muted-contrast` | #374151 (흰색에서) | 대기 상태 점 위에 흰 글자를 기대했다면 짙은 글자로 바뀌어요. 점 색 `--axis-status-neutral-muted` 는 그대로예요 |
| `--axis-diff-added-text` · `--axis-diff-removed-text` | #15803D · #B91C1C / #16A34A · #F87171 | 글자 전용 토큰이에요. 바탕이나 테두리에 썼다면 `--axis-diff-added` · `--axis-diff-removed`(그대로)를 쓰세요 |
| `--axis-input-text-placeholder` | #6B7280 / #9CA3AF | 라이트만 짙어져요 |
| `--axis-button-text-disabled` · `--axis-button-bg-disabled` | #4B5563 / 다크 바탕 #1F2937 | 비활성 표시가 더 또렷해져요 |
| shadcn `--destructive` | `0 72% 51%` (라이트) | shadcn `destructive` 버튼 · 배지 바탕이 한 단계 짙어져요 |

- 상태 색(`--axis-status-*`)을 **글자**에 직접 쓰고 있다면 같은 의미의 `--axis-text-success` · `--axis-text-warning` · `--axis-text-error` · `--axis-text-info` 로 바꾸세요. 상태 색은 점 · 막대 · 테두리용이라 흰 바탕 글자로는 4.5:1 에 못 미쳐요(이번에도 값을 바꾸지 않았어요).
- 회색 바탕(`--axis-surface-secondary` · `--axis-surface-tertiary`) 위 보조 글자는 `--axis-text-tertiary` 대신 `--axis-text-secondary` 를 쓰세요(기본 라이트 4.39 · 3.90 → 6.87 · 6.10).

## 알려진 제약

- ontology 라이트 Input placeholder `#9AA1AB` 는 흰 바탕 2.60 으로 남아요. ontology 토큰 값을 바꾸지 않는 범위라 이번에 고치지 않았고, 값 결정이 필요해요.
- MCP 서버(`@axis-ds/mcp`)가 동봉한 토큰 데이터(`src/registry/data/tokens.json`)는 이번에 바뀐 기본 테마 값과 새 변수를 반영하지 않아요. 이 데이터는 처음 만든 뒤(ea764b4) 갱신되지 않았고, mcp patch 는 동봉 레지스트리(`apps/web/public/r`) 갱신만 담아요. MCP 로 토큰을 물으면 처음 만든 때의 목록과 값이 나와요(실측: 새 변수 6개와 1.7.0 의 `--axis-control-h-*` 밀도 토큰도 0건). WI-0076(#202)에서 고칠 예정이에요.
