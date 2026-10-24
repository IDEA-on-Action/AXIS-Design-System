# WI-0066 릴리스 노트: 문서 사이트 `/components` mock 페이지를 실제 컴포넌트로

> 작성일: 2026-10-25 | WI: WI-0066 | GitHub: #180 | changeset: 없음(`apps/web` 만 바뀜, npm 배포 없음, Cloudflare Pages 재배포)

## 변경 사항

- **실컴포넌트 렌더**: `/components` 의 avatar · alert · skeleton · tooltip 4페이지가 페이지 안 mock 대신 `@axis-ds/ui-react` 의 실제 컴포넌트를 렌더해요. 이제 이 페이지에서 보이는 동작이 곧 패키지 동작이에요
- **Skeleton**: 움직임 줄이기 설정에서 패키지 Skeleton 동작(WI-0071, 5초 주기로 느리게)이 보여요. 전에는 mock 이 2초 주기로 그대로 돌았어요
- **Tooltip**: 키보드 포커스로 열리고 `role="tooltip"` 을 가지며 Esc 로 닫혀요. 전에는 마우스 호버로만 보였어요
- **Avatar**: 이미지를 불러오지 못하면 이니셜로 대체돼요(WI-0054). 전에는 깨진 이미지가 남았어요
- **Alert**: AXIS 토큰(`surface-info` 등) 색으로 렌더돼요. 전에는 Tailwind 기본 팔레트였어요

## 알려진 한계

- Tooltip 이 열린 뒤 페이지가 스크롤되면 닫혀요. 화면 밖 트리거로 Tab 이동하면 스크롤 인투뷰 때문에 바로 사라져요(1280x720 측정). WI-0073(#194)에서 다뤄요
- a11y 게이트 PAGES 는 그대로라 이 4페이지의 회귀는 게이트가 아직 지키지 않아요(측정은 [testplan.md](./testplan.md) 4절, PAGES 확장은 WI-0062)
- PropsTable 이 실제 API 와 일부 달라요(Tooltip `align` · Provider `delayDuration` 없음, Alert `AlertTitle` · `AlertDescription` 항목 없음). avatar 데모는 github.com 외부 이미지를 써요. 둘 다 이 WI 범위 밖이에요
