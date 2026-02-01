# WI-0014: 문서 사이트 핵심 컴포넌트

## Phase 2: 핵심 컴포넌트

### 2-1. 코드 블록 구문 강조
- [x] shiki 패키지 설치
- [x] lib/shiki.ts — 싱글톤 인스턴스 (github-light/dark 듀얼 테마)
- [x] code-block.tsx 전면 재작성 — shiki 하이라이팅, 라인 넘버, 라인 하이라이트, 파일명

### 2-2. 컴포넌트 프리뷰 시스템
- [x] component-example.tsx — Preview/Code 탭 통합
- [x] registry/example-registry.ts — lazy import + raw code 매핑
- [x] registry/examples/ — button, badge, input, card 예제 파일

### 2-3. Props 테이블 개선
- [x] Required 뱃지 추가
- [x] Type monospace 스타일링
- [x] hover 효과 추가
- [x] 모바일 카드형 레이아웃

## Definition of Done
- [x] 타입 체크 통과
- [x] 빌드 성공
