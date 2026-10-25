# WI-0060 릴리스 노트: library 상세 데이터 slug 충돌

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #159 | 대상: `@axis-ds/cli` patch(배치 4 ② 와 함께 발행) · 문서 사이트(Pages)

## 바뀐 점

라이브러리(`/library`) 상세 화면이 항목마다 자기 데이터를 보여요. 이전에는 같은 slug 를 쓰는 30쌍이 상세 데이터 파일 하나를 나눠 써서 화면이 섞였어요.

| 주소 | 이전 | 이후 |
|---|---|---|
| shadcn 25개(예: `/library/data-display/badge`) | AXIS 코드 · AXIS 배지 · `npx @axis-ds/cli add badge` | shadcn/ui 배지 · `npx shadcn@latest add badge` · 「코드가 없습니다」 |
| AXIS 5개(alert · avatar · progress · skeleton · tooltip, `/library/ui/<slug>`) | shadcn/ui 배지 · 코드 없음 | AXIS 배지 · AXIS 코드 |
| `/library/ui/accordion` · `button` · `collapsible` · `command` · `toggle` | AXIS | AXIS 그대로 |
| shadcn accordion · button · collapsible · command · toggle | 페이지 없음 | `/library/ui/shadcn-<slug>` 새 페이지 |

- 상세 페이지 수: 124 → 129. 기존 124 URL 은 그대로예요.
- shadcn 상세의 코드 탭이 비는 것은 shadcn 코드가 레포에 원래 없기 때문이에요(다른 외부 항목 56개와 같은 상태). 원본 문서 링크는 그대로 있어요.

## 데이터 · cli

- 상세 데이터 파일: `/library/components/<slug>.json`(99개) → `/library/components/<id>.json`(129개, 예: `axis-button.json` · `shadcn-button.json`). 옛 파일 URL 은 404 가 돼요. 직접 읽던 곳은 `index.json` 에서 항목 id 를 찾아 새 경로를 읽어요.
- `axis library publish` · `axis library refresh-axis`(cli patch): 위 파일 키를 쓰고, 같은 상세 주소를 쓰는 외부 항목의 slug 를 `<source>-<slug>` 로 바꿔요. `refresh-axis` 결과의 `shadowedAxis` 는 없어지고 `renamedSlugs` 가 생겼어요.
- `pnpm check-library-links`: slug 충돌을 위반으로 봐요(항목마다 자기 파일 · 상세 주소 유일 · search url 일치).
- 레지스트리(`/r`) · mcp 는 바뀌지 않아요.
