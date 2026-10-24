# WI-0041: axis init 재실행 시 axis.config.json 설정 소실 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0041 | GitHub: #128 | 우선순위: P3 | 상태: Approved (2026-10-24 배치 2 결정 반영)
> 기준: `main` 59dd6a3 (cli 1.5.4) | 묶음: 배치 2 묶음 ③(WI-0037 · WI-0041 · WI-0049 · WI-0065)

---

## 1. 개요

### 1.1 문제 (측정, 2026-10-24, 이슈 본문보다 진행된 상태)

- 이슈 #128 본문(통째 덮어쓰기)은 부분 해소 전 서술이에요. cli 1.5.4 는 init 재실행 때 `registry` · `agenticDir` 는 이미 지켜요
- 그래도 `brand` · `monetDir` · `template` 같은 init 밖 키는 「기존 설정에서 빠진 키」 경고 뒤 지워졌어요. `axis theme add` 가 기록한 brand 가 init 한 번으로 사라져요
- `-y` 재실행은 사용자가 바꾼 `componentsDir`(예: `./components/ui`) · `globalCss` 를 기본값 `./src/...` 로 되돌렸어요. 그 위치에 utils.ts 가 따로 생기고 add 설치 위치와 기존 컴포넌트가 갈라져요

### 1.2 결정 (2026-10-24 사용자, 브리프 권장안 + 반박 검토 반영)

| # | 결정 |
|---|---|
| D4 | 기존 키 병합: init 이 다루는 키(`$schema` · `componentsDir` · `tailwindConfig` · `globalCss` · `registry`)만 바꾸고, 나머지 키의 값과 순서를 그대로 둬요. 없던 init 키는 init 순서에서 바로 앞 키 다음에 넣어요. 들여쓰기 · 줄바꿈 · BOM 은 기존 파일을 따라요(theme add 의 formatJsonLike) |
| D5 | 반박 검토 반영으로 좁힘: `componentsDir` 는 디렉터리라 아직 없을 수 있어 기존 값을 보존해요. 파일 경로(`globalCss` · `tailwindConfig`)는 가리키는 파일이 있으면 보존하고, 없으면 탐색값(WI-0049 D6)으로 바꾸고 알려요. 탐색값도 없으면 기존 값을 그대로 두고 알려요(없는 기본값으로 바꿔도 나아지지 않고, src/ 생성 여부에 따라 재실행마다 값이 오가는 것을 측정으로 확인) |
| D5-부수 | Tailwind 4 프로젝트에서 재실행하면 `tailwindConfig` 는 init 이 다루는 키라 지우고 「지운 키」로 알려요 |
| D5-대화형 | 대화형 초기값도 같은 값(기존 값 · 탐색값)을 써요 |
| 릴리스 | `@axis-ds/cli` minor(묶음 ③, WI-0065 D9) |

## 2. 수용 기준

- AC1 brand · monetDir · template 가 재실행 뒤 값 · 순서 그대로, 「빠진 키」 안내 없음
- AC2 기존 componentsDir 는 디렉터리가 없어도 보존, 실재하는 globalCss · tailwindConfig 보존
- AC3 실재하지 않는 globalCss 는 찾은 파일로 바꾸고 알림(cli 1.5.4 템플릿 config `./globals.css` 사례), 찾지 못하면 그대로 두고 알림, 두 번째 실행은 「유지」
- AC4 기존 4칸 들여쓰기 유지, Tailwind 4 재실행의 tailwindConfig 지움 안내
- AC5 변이: 병합을 끄면(종전 통째 덮어쓰기) 새 테스트가 실패
