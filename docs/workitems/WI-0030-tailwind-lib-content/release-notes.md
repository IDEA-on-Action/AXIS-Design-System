# WI-0030 릴리스 노트: apps/web Tailwind content 경로에 src/lib 추가

> 릴리스일: 미정 (PR 머지 시) | 유형: fix | 영향: 문서 사이트(apps/web) 내부 변경, 패키지 배포 없음

## 배경

`apps/web/tailwind.config.ts` 의 `content` 에 `./src/lib` 가 없어 그 안의 클래스 문자열이 CSS 로 생성되지 않았다(Issue #95).

## 변경 사항

### fix: `content` 에 `./src/lib/**/*.{js,ts,jsx,tsx,mdx}` 추가
- `src/lib/library-types.ts` 의 shadcn/ui 출처 색 `bg-zinc-500` 이 산출 CSS 에 생성된다. 라이브러리 화면 3곳의 출처 점(`sourceInfo.color`)이 쓰는 클래스다(화면 확인은 하지 않았고, 산출 CSS 로만 판정).
- 다른 클래스 변화 없음(수정 전후 산출 CSS 고유 선택자 890 → 891, 사라진 선택자 0).

## 영향

- `@axis-ds/*` 패키지 변경 없음, changeset 없음.
- a11y spec 18 passed 유지.
