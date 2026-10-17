---
'@axis-ds/tokens': minor
'@axis-ds/ui-react': minor
'@axis-ds/agentic-ui': minor
'@axis-ds/theme': minor
---

브랜드 테마 축과 온톨로지 프리셋(WI-0025 M2 · M3): `data-brand`로 테마와 독립된 브랜드 색을 적용하고, 첫 브랜드 `ontology`를 함께 배포

- tokens: 브랜드 빌드(`dist/css/brands/<brand>.css`, `dist/brands/<brand>/brand.json`, 목록 `dist/brands/index.json`)와 exports `./css/brands/ontology` · `./brands/ontology/brand.json` · `./brands` 추가. 브랜드 미지정 `variables.css`는 1.2.1 변수 값이 그대로이고 새 변수 10개(`--axis-shadow-sm|lg`, `--axis-card-shadow`, `--axis-plan-card-accent-width`, 흰 글자 짝 토큰 6개, 기본값은 기존 화면과 같음)만 추가. `--axis-card-shadow-default`는 폐기 예정
- theme: `ThemeProvider`에 `defaultBrand` · `brandStorageKey`, `useTheme()`에 `brand` · `setBrand` 추가
- ui-react: Card · Dialog 그림자가 `--axis-card-shadow` · `--axis-shadow-lg`를 참조(기본 화면 불변, tokens CSS를 로드하지 않으면 그림자 없음), `cn()`이 그림자 변수 클래스를 그림자 그룹으로 병합
- agentic-ui: 흰 글자 5곳과 PlanCard 색 선 두께를 토큰으로 교체(기본 화면 불변). CSS가 생성되지 않던 불투명도 수식어 11곳을 고쳐 PlanCard 상태 배지 · 거절 버튼 hover, DiffViewer 줄, FeedbackButtons 선택 상태의 옅은 바탕과 AttachmentCard 오류 테두리가 표시됨(기본 화면 변화)
