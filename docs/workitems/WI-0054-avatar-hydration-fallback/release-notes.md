# WI-0054 릴리스 노트: Avatar 하이드레이션 전 이미지 오류 fallback 전환

> 작성일: 2026-10-24 | WI: WI-0054 | GitHub: #148 | changeset: `@axis-ds/ui-react` patch

## 변경 사항

- **SSR 이미지 오류**: 서버 렌더된 `Avatar` 이미지가 하이드레이션 전에 로드에 실패하면 깨진 이미지가 그대로 남던 문제를 고쳤어요. 마운트할 때 `complete && naturalWidth === 0` 이면 실패 후보로 보고 `img.decode()` 가 거부되면 이니셜 fallback 으로 바꿔요
- **SVG 오판 방지**: 정상인데 고유 크기가 0 인 이미지(예: `width="0"` SVG)는 decode 가 이행되므로 fallback 으로 바꾸지 않아요. decode 가 없는 환경에서는 종전처럼 `onError` 만 써요
- **src 변경**: 한 번 실패한 뒤 `src` 를 바꿔도 fallback 에 고정되던 문제를 고쳤어요. 실패했던 주소로 돌아오면 다시 시도해요
- **library**: `apps/web/public/library` 의 `axis-avatar` 소스 사본을 재생성했어요(레지스트리 `public/r` 에는 이 항목이 없어 변경 없음)
- **테스트**: `avatar.test.tsx` 9건 추가(합계 20건), Playwright SSR 하이드레이션 실측(chromium · firefox · webkit)

props 이름 · 타입 · ref 대상은 바뀌지 않았어요.

## 알려진 한계

- 하이드레이션 직후 effect 에서 판정하므로 깨진 이미지 아이콘이 하이드레이션 전까지는 보여요(서버 렌더 단계에서는 이미지 결과를 알 수 없음)
- React 18 에서는 이번에 실측하지 않았어요(패키지 테스트는 React 19.2.3)
- agentic-ui `AgentAvatar` 의 같은 유형 결함은 점검하지 않았어요
