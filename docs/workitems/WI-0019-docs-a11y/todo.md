# WI-0019: 문서 페이지 Accessibility 섹션 TODO

> PRD: [prd.md](./prd.md) | 상태: ✅ 완료

## Phase 1: 형식 확립 ✅
- [x] `KeyboardTable` 공용 컴포넌트 (PropsTable 스타일) + 배럴 등록
- [x] button(네이티브) 파일럿
- [x] dialog(Radix) 파일럿 + WAI-ARIA 패턴 링크

## Phase 2: 콘텐츠 authoring ✅
- [x] 컴포넌트별 a11y 데이터 작성 (Radix 단언 / 커스텀·agentic 시맨틱+가이드)
- [x] 46개 페이지 Accessibility 섹션 일괄 삽입 (button/dialog 제외)
- [x] lint-safe 생성 (텍스트 JSON.stringify → JS 표현식)

## Phase 3: 검증 ✅
- [x] Accessibility 섹션 48/48, 모든 페이지 마지막 위치(Props/Type 뒤)
- [x] typecheck / lint / build 통과, Pagefind 48 인덱싱 유지

## Definition of Done
- [x] KeyboardTable 컴포넌트
- [x] 48개 페이지 Accessibility 섹션
- [x] 타입 체크 / 린트 / 빌드 통과
- [x] release-notes.md 작성
