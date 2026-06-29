# WI-0018: 문서 페이지 심화 표준화 PRD

> 작성일: 2026-06-30 | 작성자: AXIS Team | 상태: Draft
> 선행: WI-0016(레이아웃 전용 표준화 완료). 본 WI는 WI-0016에서 후속 분리한 콘텐츠 표준화.

---

## 1. 개요

### 1.1 배경
WI-0016이 48개 문서 페이지의 레이아웃(DocPageLayout/DocSection)을 통일했으나, 섹션의 **순서·명칭·구성**은 기존 그대로 보존했다. 감사 결과 다음 불일치가 남아있다:

| 항목 | 현황 (실측) |
|------|------------|
| Usage 위치 | 31페이지 2번째(정규) / 17페이지 3~5번째 |
| Demo/Usage 역전 | agentic 16페이지가 Demo를 Usage 앞에 배치 |
| 데모 섹션 명칭 | "Interactive Demo"(15) / "Demo"(2) / "Animated Demo"(1) |
| Type 섹션(agentic) | 9종 변이 (Types / PlanStep Type / SurfaceType / ...) |
| Accessibility 섹션 | 0개 (전무) |

### 1.2 목표
- 컴포넌트/Agentic 문서의 섹션 순서·명칭을 단일 표준으로 통일
- 표준 Accessibility 섹션 도입
- 성공 지표: 표준 순서 준수율 100%, 데모 명칭 1종, Type 섹션 명칭 규칙 1종

### 1.3 범위
- 포함: 섹션 순서 재정렬, 데모 명칭 통일, Type 섹션 명칭 규칙, Accessibility 섹션 추가
- 제외(Non-goals): 신규 컴포넌트, 예제 코드 내용 재작성, DocPageLayout/DocSection 구조 변경(WI-0016 완료분)

---

## 2. 표준 정의 (확정, 사용자 ratify 2026-06-30)

### 2.1 정규 섹션 순서 ✅
```
Installation → Usage → Interactive Demo → [컴포넌트별 예제] → Props → [{Type} Type] 
```
- **Usage를 Demo 앞에** ("tell then show", 31페이지 다수 패턴과 일치). agentic 16페이지의 Demo→Usage 역전을 교정(Demo 블록을 Usage 뒤로 이동).
- 컴포넌트별 예제 섹션(Variants 등)은 컴포넌트 고유라 순서·구성 자유.

### 2.2 데모 섹션 명칭 ✅
- **"Interactive Demo"로 통일** (다수안 15/18). "Demo"·"Animated Demo" 3개 개명.

### 2.3 Type 섹션 명칭 규칙 ✅
- **`{TypeName} Type` 패턴 유지** (명칭 정보량 보존). 아웃라이어만 보정(SurfaceType 등). 열거형 섹션(File Types, Allowed Surface Types 등)은 타입 정의가 아니므로 그대로 둠.

### 2.4 Accessibility 섹션 ⏭️ 분리
- **별도 WI-0019로 분리.** 컴포넌트별 a11y 콘텐츠 authoring 분량이 커 구조 표준화(본 WI)와 분리.

---

## 3. 요구사항 (AC)
- AC1: 모든 페이지가 정규 섹션 순서 준수 (Installation → Usage → Demo → ...)
- AC2: 데모 섹션 명칭 1종으로 통일
- AC3: Type 섹션 명칭 규칙 1종 적용
- AC4: (범위 확정 시) Accessibility 섹션 추가
- 비기능: 예제 코드·데모 동작 회귀 없음, typecheck/lint/build 통과

---

## 4. 리스크
- 콘텐츠 재배치는 코드모드만으로 안전 보장 어려움(섹션 블록 이동 시 JSX 정합성). 페이지별 검증 필요.
- Accessibility 콘텐츠는 컴포넌트별 a11y 지식 필요 → mechanical 변환 불가, 분량 큼.

---

## 5. Definition of Done
- [ ] 표준 순서/명칭/Type 규칙 확정 (사용자 ratify)
- [ ] 48개 페이지 표준 적용
- [ ] (범위 확정 시) Accessibility 섹션
- [ ] 타입 체크 / 린트 / 빌드 통과
- [ ] release-notes.md 작성
