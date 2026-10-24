# WI-0041 릴리스 노트: init 을 다시 실행해도 설정이 남아요

> 작성일: 2026-10-24 | WI: WI-0041 | GitHub: #128 | changeset: `@axis-ds/cli` minor(묶음 ③)

## 변경 사항

- `axis init` 을 다시 실행하면 init 이 다루는 키(`$schema` · `componentsDir` · `tailwindConfig` · `globalCss` · `registry`)만 바꾸고 `brand` · `monetDir` · `template` · `agenticDir` 등 나머지 키와 순서, 들여쓰기를 그대로 둬요. 종전에는 init 밖 키가 지워졌어요
- `-y` 재실행이 바꿔 둔 `componentsDir` 를 기본값으로 되돌리지 않아요. `globalCss` · `tailwindConfig` 는 가리키는 파일이 있으면 그대로 두고, 없으면 실제로 찾은 파일로 바꾸며 그 사실을 한 줄 알려요(찾지 못하면 그대로 두고 알려요)
- Tailwind 4 로 바뀐 프로젝트에서 다시 실행하면 쓰지 않는 `tailwindConfig` 를 지우고 알려요
- 대화형 init 의 초기값도 같은 규칙으로 정해요

## 남겨 둔 것

- 깨진 JSON 인 config 는 종전처럼 init 값으로 다시 써요(읽을 수 없어 병합할 기준이 없음)
