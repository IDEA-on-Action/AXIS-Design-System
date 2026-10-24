# WI-0064 릴리스 노트: 브랜드 테마 가이드 현행화

> 작성일: 2026-10-24 | WI: WI-0064 | GitHub: #174 | changeset: 없음(문서만)

## 변경 사항

- **브랜드 적용 빠른 시작(D1)**: `docs/guides/theme-customization.md` 4절 맨 앞에 체크리스트를 두었어요. Tailwind 4 는 컴포넌트 패키지의 `tailwind.css` 까지 5줄, Tailwind 3 은 preset 과 `@axis-ds/tokens/css/shadcn`, 그리고 `defaultBrand` 나 `<html data-brand>` 로 브랜드를 켜는 단계, Pretendard 웹폰트 로드예요. 각 항목에 빠졌을 때의 실측 증상(투명한 Button, 6px · 0px 둥글기 등)을 적었어요
- **사실 정정(D3 · D5)**: 기본 토큰 개수와 1.6.0 변경, Tailwind 4 import 블록, `.dark` 하위 요소(브랜드가 꺼지고 기본 다크가 됨, 지원하지 않음 · 우회 2가지), 첫 화면 깜빡임의 원인(첫 페인트가 아니라 `transition-colors` 전환)과 인라인 스크립트 처방, ontology PlanCard 새 변수 3개 값
- **`defaultBrand` 와 해제(D4)**: `defaultBrand` 를 쓰면 `setBrand(undefined)` 로 끈 상태가 새로고침 뒤 풀린다는 한계와 용도별 설정 표를 적었어요. 고치는 일은 WI-0068(#182)에서 해요
- **Quick Start(D2)**: Tailwind 3 절을 preset · `css/shadcn` · `tailwindcss-animate` 를 쓰는 형태로 바꾸고 `@import` 를 `@tailwind` 앞으로 옮겼어요. 3절에 「브랜드 적용(선택)」을 더했어요
- **cli 로 적용하기(D7, FR-6)**: 「브랜드 적용 빠른 시작」 끝에 `npx @axis-ds/cli theme add ontology` 가 해 주는 일(전역 CSS 의 기본 토큰 CSS · 브랜드 import 순서와 위치, `package.json` 의 `@axis-ds/tokens@^1.6.0`, `axis.config.json` 의 `brand`), 사람이 해야 하는 일(브랜드 켜기, Tailwind 3 preset · content, Tailwind 4 기본 블록 지우기, 설치, 웹폰트), `axis check` 의 새 판정 항목(`tailwind.config` preset WARN · `brand.activation` · `tailwind.content` · `animation`)을 적었어요. 이 cli 동작은 `@axis-ds/cli` 1.6.0부터예요. 브랜드 켜기 예시는 cli 출력 그대로(`<html data-brand>` · `setBrand`, `defaultBrand` 없음)이고, quick-start 「브랜드 적용(선택)」에도 같은 내용을 한 단락 더했어요
- **tokens README(D6)**: Tailwind 3 Preset 절에 `css/shadcn` · 브랜드 켜기 · 글꼴 안내를 더했어요. npm 의 README 는 다음 tokens 발행 때 바뀌어요

## 영향

- 패키지 코드 · 생성물은 바뀌지 않아요. 발행은 없어요
- 종전 quick-start 의 Tailwind 3 설정(preset 없음)으로 만든 프로젝트는 둥글기 · 글꼴이 AXIS 값이 아니에요. 새 블록처럼 preset 과 `css/shadcn` 을 더하면 맞춰져요

## 알려진 한계

- 「cli 로 적용하기」는 묶음 ③(PR #186) 머지 전 빌드로 잰 내용이에요. ③ 이 1.6.0 으로 발행된 뒤 출력 문구를 한 번 더 대조해요. 그 전에 이 PR 이 먼저 머지되면 1.5.x 사용자에게는 이 단락이 맞지 않아요(단락 첫머리에 1.6.0부터라고 적음)
- Tailwind 4 에서 컴포넌트 패키지를 나중에 선언하고 `theme add` 를 다시 실행하면 그 `tailwind.css` 줄이 브랜드 줄 뒤에 들어가요(③ 쪽에 보고)
- Tailwind 4 진입점 구성의 `.dark` 하위 요소 동작과 Next App Router 의 인라인 스크립트는 재지 않았어요
- 「기본은 ontology 이면서 사용자가 끌 수 있음」은 WI-0068 전까지 지원하지 않아요
