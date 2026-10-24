---
"@axis-ds/ui-react": patch
---

`Avatar` 가 하이드레이션 전에 끝난 이미지 로드 오류를 이니셜 fallback 으로 바꾸지 못하던 결함을 고쳤습니다(WI-0054).

- 서버 렌더된 이미지가 하이드레이션 전에 실패하면 `onError` 가 붙기 전이라 깨진 이미지가 그대로 남았습니다. 이제 마운트할 때 `complete && naturalWidth === 0` 이면 `img.decode()` 로 확인해 거부되면 fallback 으로 바꿉니다.
- 정상 로드인데 고유 크기가 0 인 이미지(예: `width="0"` SVG)는 decode 가 이행되므로 fallback 으로 바꾸지 않습니다. `decode` 가 없는 환경에서는 종전처럼 `onError` 만 씁니다.
- 한 번 실패한 뒤 `src` 를 바꿔도 fallback 에 고정되던 문제를 함께 고쳤습니다. 실패했던 주소로 돌아오면 다시 시도합니다.
- props 이름 · 타입 · ref 대상은 바뀌지 않았습니다.
