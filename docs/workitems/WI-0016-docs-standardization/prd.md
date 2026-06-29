# WI-0016: 문서 페이지 표준화 PRD

> 작성일: 2026-06-29 | 작성자: AXIS Team | 상태: Draft

---

## 1. 개요

### 1.1 배경
- 현재 문제: `apps/web/src/app/(docs)/` 하위 51개 문서 페이지가 손으로 작성된 TSX(예: button 169줄)라 페이지마다 섹션 구성·순서·표현이 제각각이다.
- 왜 필요한가: 일관된 문서 구조는 사용자 학습 비용을 낮추고, 신규 컴포넌트 문서 작성 시 복제 가능한 표준을 제공하며, WI-0017 검색의 인덱싱 품질도 높인다.

### 1.2 목표
- 컴포넌트/Agentic 문서 페이지의 표준 섹션 구조 확립
- 반복 구조를 공용 레이아웃/섹션 컴포넌트로 추출해 중복 제거
- 성공 지표: 표준 섹션 충족률 100%(전 페이지), 페이지당 보일러플레이트 코드 30%+ 감소

### 1.3 범위
- 포함: components(~25), agentic(~22) 문서 페이지의 구조 표준화, 공용 `DocPageLayout` + 섹션 컴포넌트
- 제외(Non-goals): 문서 내용(카피) 전면 재작성, 신규 컴포넌트 추가, MDX 전환

---

## 2. 사용자 및 사용 사례

### 2.1 대상 사용자
- 개발자: AXIS 컴포넌트를 도입하며 문서를 참조
- 기여자: 신규 컴포넌트 문서를 표준 구조로 작성

### 2.2 핵심 사용 시나리오
1. 개발자가 임의 컴포넌트 문서를 열면 항상 동일한 섹션 순서(Overview → Import → Usage → Props → Examples → Accessibility)를 본다.
2. 기여자가 표준 레이아웃 컴포넌트를 재사용해 새 문서를 빠르게 작성한다.

---

## 3. 요구사항

### 3.1 기능 요구사항 (AC)
- AC1: 표준 섹션 정의 - Overview, Import, Usage, Props, Examples, Accessibility 6개 섹션 순서 고정
- AC2: 공용 `DocPageLayout` 컴포넌트가 제목·설명·TOC·섹션 슬롯을 제공
- AC3: 51개 페이지 전수 감사 매트릭스 작성 후 누락 섹션 보강
- AC4: 최소 1개 Props 섹션은 자동 생성(레지스트리/타입 기반) 또는 표준 표 컴포넌트 사용

### 3.2 비기능 요구사항
- 접근성: 섹션 heading 레벨 일관(h1 > h2 > h3), TOC 앵커 동작
- 성능: 정적 export 빌드 시간 회귀 없음
- 호환: 기존 라우트 URL 불변(SEO 보존)

---

## 4. 구현 접근 (초안)

```
apps/web/src/components/docs/
├── doc-page-layout.tsx     # 제목 + 설명 + TOC + children
├── doc-section.tsx         # 표준 섹션 래퍼 (id, heading)
├── props-table.tsx         # Props 표준 표 (기존 개선분 재활용)
└── usage-block.tsx         # Import/Usage 코드 블록
```

- 1단계: 51개 페이지 섹션 충족 감사 (testplan.md 매트릭스)
- 2단계: 공용 컴포넌트 추출
- 3단계: components 25개 마이그레이션 → agentic 22개 마이그레이션 (점진)

---

## 5. Definition of Done
- [ ] 표준 섹션 정의 문서화
- [ ] 공용 DocPageLayout/섹션 컴포넌트 구현
- [ ] 51개 페이지 표준 구조 적용 + 감사 매트릭스 100%
- [ ] 타입 체크 / 린트 / 빌드 통과
- [ ] release-notes.md 작성
