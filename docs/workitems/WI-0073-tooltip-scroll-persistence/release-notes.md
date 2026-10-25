# WI-0073 릴리스 노트: Tooltip 이 포커스 스크롤에 닫히지 않게

> PRD: [prd.md](./prd.md) | 테스트 계획: [testplan.md](./testplan.md) | GitHub: #194 | 대상: `@axis-ds/ui-react` patch(배치 4 ② 묶음과 함께 linked 1.8.0 으로 발행 예정)

## 바뀐 점

화면 밖에 있는 Tooltip 트리거로 Tab 하면 페이지가 트리거까지 스크롤되고, 1.7.0 까지는 그 스크롤이 막 열린 툴팁을 바로 닫았어요. 키보드 사용자는 포커스가 트리거에 있는데도 툴팁을 볼 수 없었어요(WCAG 2.2 SC 1.4.13 지속성). 이제 트리거에 포커스가 있는 동안에는 스크롤로 툴팁이 닫히지 않아요.

| 상황 | 1.7.0 | 이번 변경 뒤 |
|---|---|---|
| 화면 밖 트리거로 Tab(포커스 스크롤 발생) | 바로 닫힘 | 열린 채 |
| 포커스가 있는 상태에서 페이지 스크롤 | 닫힘 | 열린 채(위치는 트리거를 따라감) |
| Esc | 닫힘 | 닫힘 |
| 다른 요소로 포커스 이동 · 클릭 | 닫힘 | 닫힘 |
| 포인터 이탈 | 닫힘 | 닫힘 |
| 포커스 없이 hover 로 연 툴팁에서 스크롤 | 닫힘 | 닫힘 |

## 업그레이드

- 코드를 바꿀 필요가 없어요. `Tooltip` · `TooltipTrigger` · `TooltipContent` · `TooltipProvider` 의 props 는 같아요.
- `Tooltip` 에 `open` · `onOpenChange` 를 넘겨 직접 제어하는 경우: 포커스 중 스크롤로 생긴 닫힘은 이제 `onOpenChange(false)` 로 오지 않아요. Esc · 블러 · 포인터 이탈 · 클릭 닫힘은 이전처럼 와요.
- `TooltipContent` 의 `onEscapeKeyDown` · `onPointerDownOutside` 에서 `event.preventDefault()` 하면 이전처럼 닫히지 않아요.
- `tooltip` 모듈 산출물에 `"use client"` 가 붙어요. 서버 컴포넌트에서 `<Tooltip>` 을 그대로 쓸 수 있어요.
- 복사 설치(`axis add`) 레지스트리에는 tooltip 항목이 없어 바뀌는 것이 없어요. 문서 사이트 library 의 AXIS Tooltip 코드(`axis-tooltip`)는 새 코드로 바뀌었어요.

## 알려진 제약

- 닫힘 이유를 Radix 가 알려 주지 않아서, 래퍼가 자기 scroll 리스너를 Radix 보다 먼저 등록하는 순서에 기대요. Radix 가 리스너 등록 방식을 바꾸면 다시 확인해야 해요(E2E `tooltip-persistence.spec.ts` 가 CI 에서 잡아요).
- Radix 업스트림에 끄는 prop 이나 닫힘 이유 전달을 제안하는 이슈 초안을 썼고, 게시는 하지 않았어요.
- `Tooltip` 인스턴스마다 열림 여부와 상관없이 window `scroll`(capture) 리스너를 하나씩 달아 두고, 스크롤 이벤트마다 그 인스턴스의 `setTimeout(0)` 을 다시 걸어요(인스턴스당 대기 타이머는 하나). 툴팁이 많은 화면(표 · 아이콘 툴바)에서는 스크롤 이벤트 하나에 인스턴스 수만큼 리스너 호출과 타이머가 생겨요. 동작 결함은 아니고 비용이에요. 열려 있을 때만 리스너를 다는 방식으로 줄이려면 Radix 콘텐츠의 리스너보다 먼저 등록되는지(위 항목의 순서 전제)를 다시 확인해야 해요.
