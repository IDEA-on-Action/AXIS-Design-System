---
'@axis-ds/mcp': minor
---

토큰 도구(`axis.list_tokens` · `axis.get_token`)의 데이터를 빌드 때 `@axis-ds/tokens` 빌드 산출물에서 생성합니다(WI-0076). 1.3.5 까지 동봉한 손 사본은 처음 만든 뒤 갱신되지 않아 41개 가운데 16개 값이 tokens 1.8.0 과 달랐어요(예: `colors.primary` 가 `hsl(222.2 47.4% 11.2%)`, 실제 `hsl(221 39% 11%)`).

- 토큰 309개(tokens 1.8.0 기준): 기존 경로 36개는 그대로 두고 tokens 의 모든 변수를 더했어요. 밀도 토큰(`control.h.md` · `radius.control` 등 15개)과 shadcn 변수 `card` · `popover` · `input` · `chart-1~5` · `radius` 가 새로 나와요.
- 항목마다 다크 값(`dark`)과 실제로 정의된 CSS 변수 이름을 함께 돌려줘요. `path` 는 기존 경로, tokens 이름 기반 경로(예: `space.5`), CSS 변수 이름(예: `--axis-control-h-md`)을 받아요.
- 응답 계약 변경: tokens 에 원천이 없던 `shadow.md` · `animation.duration.fast` · `animation.duration.normal` · `animation.duration.slow` · `animation.easing.default` 5개 경로를 뺐고, `category` 의 `animation` 을 빼고 `density` · `component` 를 더했어요. 없는 경로의 `axis.get_token` 은 `isError: true` 로 답해요. 1.3.5 의 `cssVariable` 4개(`--radius-none` 등)는 존재하지 않는 이름이라 `--axis-radius-*` 로 바로잡았어요.
- 브랜드 값은 계속 `axis.list_brands` · `axis.get_brand` 가 맡아요.
