# WI-0057 릴리스 노트: library 낡은 항목 · 문서 링크 404 정리

> 작성일: 2026-10-23 | WI: WI-0057 | GitHub: #155 | changeset: `@axis-ds/cli` patch

## 변경 사항

- **수집기 문서 URL(D3)**: AXIS 수집기는 문서 사이트에 페이지(`(docs)/<route>/<slug>/page.tsx`)가 있을 때만 문서 링크를 만들어요. 이름이 다른 것은 별칭 표(`approval-card → approval-dialog`)로 잇고, 둘 다 없으면 링크를 비워요(상세 화면은 링크를 숨김)
- **수집 범위**: 문서 사이트 데모 페이지 스캔을 없앴어요. 패키지 루트 단일 파일(`a11y.test.tsx`)과 테스트 · 스토리 파일은 수집하지 않고, 코드 파일은 이름순이에요. 설명은 컴포넌트 이름 선언 바로 앞 JSDoc 을 먼저 써요
- **재생성 명령(D1)**: `axis library refresh-axis`(루트 `pnpm library:refresh-axis`). AXIS 항목만 다시 만들고 외부 소스 항목은 그대로 둬요. 원격에 접속하지 않고, 같은 소스로 다시 돌리면 아무 파일도 바뀌지 않아요
- **library 데이터**: AXIS 48개를 지금 소스로 다시 만들었어요(새로 13 · 갱신 35). 낡은 7개(데모 페이지 출신 6개 + approval-dialog)를 지웠어요. 2026-02-01 손수정으로 어긋난 index · search-index · categories · stats 를 맞췄어요(전체 129개)
- **검사(D4)**: `pnpm check-library-links`(오프라인, CI `Library link check (offline)` 단계)가 사이트 링크마다 문서 라우트가 있는지와 파일 간 정합을 봐요. `pnpm check-library-links:remote` 는 외부 링크까지 GET 으로 보는 수동 스크립트예요

## 운영

- AXIS 컴포넌트 소스를 바꾸면 `pnpm library:refresh-axis` 로 library 데이터를 다시 만들어 함께 커밋해요. 바뀐 항목만 `updatedAt` 이 오늘(KST) 날짜로 바뀌어요
- 문서 페이지 이름이 컴포넌트와 다르면 `packages/axis-cli/src/library/axis-collector.ts` 의 `DOCS_SLUG_ALIASES` 에 더해요. 빠뜨려도 링크가 비워질 뿐 404 링크는 생기지 않아요

## 알려진 한계

- slug 충돌(E4): 같은 slug 의 shadcn · AXIS 항목은 `components/<slug>.json` 하나를 나눠 써요. 30쌍이고, 새 AXIS 5개(alert · avatar · progress · skeleton · tooltip)는 shadcn 파일을 덮지 않아 상세 화면이 shadcn 코드를 보여 줘요. 별도 WI 로 다뤄요(D6)
- AXIS 항목 10개(breadcrumb · checkbox · dropdown-menu · popover · radio-group · sheet · slider · switch · table · textarea)의 library 경로가 `/library/<form 등>/<slug>` 에서 `/library/ui/<slug>` 로 바뀌었어요. 옛 경로는 같은 slug 의 shadcn 항목이 써서 404 는 아니에요
- shadcn 링크 47개는 모두 리다이렉트(`/docs/components/base/<이름>` 등)를 거쳐 200 이에요. 링크 자체는 고치지 않았어요
