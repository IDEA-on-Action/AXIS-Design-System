# WI-0019: 문서 페이지 Accessibility 섹션 PRD

> 작성일: 2026-06-30 | 작성자: AXIS Team | 상태: Draft
> 선행: WI-0018(순서·명칭 표준화). 본 WI는 WI-0018에서 분리한 a11y 콘텐츠 authoring.

---

## 1. 개요

### 1.1 배경
WI-0016/0018로 48개 문서 페이지의 레이아웃·순서·명칭이 표준화됐으나 **Accessibility 섹션은 0개**다. 컴포넌트 라이브러리 문서는 키보드 조작·ARIA·스크린리더 지원을 명시해야 한다.

### 1.2 a11y 기반 (실측)
- **Radix 기반 ui-react 20개** (dialog, checkbox, select, tabs, tooltip 등): WAI-ARIA 패턴 a11y 내장 → Radix 문서화 동작을 근거로 정확히 기술 가능
- **커스텀/네이티브 ui-react 10개** (input/textarea=네이티브, command=cmdk, alert/badge/card 등): 컴포넌트별 실제 마크업 기반 기술
- **agentic 18개**: 커스텀, aria/role 일부 사용 → 소스 실측 기반 기술

### 1.3 목표
- 컴포넌트 특성에 맞는 정확한 Accessibility 섹션 추가
- 정확성 우선: 구현에 없는 a11y 기능을 주장하지 않음(소스 근거 필수)

### 1.4 범위
- 포함: 48개 페이지 Accessibility DocSection (키보드 조작 + ARIA/스크린리더 노트)
- 제외(Non-goals): 컴포넌트 a11y 구현 변경(문서화만), 자동 a11y 테스트(별도)

---

## 2. Accessibility 섹션 형식 (제안)

표준 구조 (DocSection title="Accessibility"):
1. **a11y 기반 한 줄**: Radix WAI-ARIA / 네이티브 / 커스텀 명시
2. **키보드 조작 표** (`KeyboardTable` 컴포넌트, key → 동작)
3. **노트**: ARIA 역할/속성, 포커스 관리, 스크린리더 고려 (해당 시)

신규 공용 컴포넌트: `KeyboardTable` (PropsTable 스타일 재활용, `keys: {key, description}[]`).

---

## 3. 요구사항 (AC)
- AC1: 48개 페이지에 Accessibility DocSection 추가 (Props 뒤 위치)
- AC2: 각 a11y 주장은 소스(Radix 사용/aria 속성/네이티브 요소)로 검증 가능
- AC3: 키보드 조작이 있는 컴포넌트는 KeyboardTable 포함
- 비기능: typecheck/lint/build 통과, Pagefind 인덱싱 유지

---

## 4. 리스크
- **정확성**: 잘못된 a11y 주장은 해롭다. Radix는 문서화 동작 근거, 커스텀은 소스 aria 실측 근거로만 기술.
- **분량**: 48개 authoring. 페이즈 분할 권장(Radix 먼저 → 커스텀/agentic).

---

## 5. Definition of Done
- [x] KeyboardTable 컴포넌트
- [x] 48개 페이지 Accessibility 섹션 (전체 일괄, 사용자 결정 2026-06-30)
- [x] 타입 체크 / 린트 / 빌드 통과 (정적 214 + Pagefind 48 유지)
- [x] release-notes.md 작성

## 6. 구현 결과
- `KeyboardTable` 공용 컴포넌트 신설 (PropsTable 스타일)
- button(네이티브)·dialog(Radix) 파일럿으로 형식 확립 후, 컴포넌트별 a11y 콘텐츠를 데이터화하여 46개 일괄 삽입
- 근거 원칙: Radix는 문서화 WAI-ARIA 동작 단언, 커스텀/네이티브/agentic은 검증 가능 시맨틱 + 가이드(권고형)
- 위치: 모든 페이지 마지막 섹션(Props/Type 뒤)
