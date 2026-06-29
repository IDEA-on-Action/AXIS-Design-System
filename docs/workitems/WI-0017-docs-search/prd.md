# WI-0017: 문서 사이트 검색 (Pagefind) PRD

> 작성일: 2026-06-29 | 작성자: AXIS Team | 상태: Draft

---

## 1. 개요

### 1.1 배경
- 현재 문제: 문서 사이트(`apps/web`)에 사이트 전역 검색이 없다. 51개 문서 페이지를 네비게이션으로만 탐색해야 한다. (기존 cmdk 사용처는 컴포넌트 데모/라이브러리 필터용이며 문서 검색이 아니다.)
- 왜 필요한가: 컴포넌트/Agentic 문서가 늘어나며 원하는 컴포넌트·prop·예제를 빠르게 찾는 검색이 사용자 경험에 필수가 되었다.

### 1.2 목표
- 정적 사이트(Next.js 15 static export, Cloudflare Pages)에 맞는 빌드 타임 인덱싱 검색 도입
- ⌘K 단축키로 즉시 검색, 키보드 네비게이션 지원
- 성공 지표: 51개 문서 페이지 인덱싱 100%, 검색 응답 체감 < 100ms(클라이언트), 외부 런타임 서비스 의존 0

### 1.3 범위
- 포함: Pagefind 빌드 통합, ⌘K 검색 UI(기존 cmdk 재활용), 결과 클릭 시 해당 문서 이동
- 제외(Non-goals): 서버 사이드 검색 API, 다국어 검색, 분석/검색 로그 수집

---

## 2. 기술 선정 근거

| 방식 | 선정 | 사유 |
|------|------|------|
| Pagefind | ✅ 채택 | 정적 사이트 최적, 빌드 후 산출물 인덱싱, 서버리스, Cloudflare Pages 정적 배포와 궁합 |
| cmdk + 자체 인덱스 | ❌ | 51페이지 수동 인덱스 유지보수 부담 |
| Algolia DocSearch | ❌ | 외부 의존·신청 절차, 현재 규모 대비 과함 |

> UI는 기존 cmdk를 재활용하고, 인덱스/검색 엔진만 Pagefind를 사용하는 하이브리드.

---

## 3. 요구사항

### 3.1 기능 요구사항 (AC)
- AC1: `build:web` 이후 Pagefind가 정적 export 산출물(`apps/web/out`)을 인덱싱
- AC2: ⌘K(또는 /) 단축키로 검색 모달 오픈, 입력 시 실시간 결과
- AC3: 결과 항목은 페이지 제목 + 섹션 + 스니펫 표시, 클릭 시 해당 앵커로 이동
- AC4: 키보드 화살표 네비게이션 + Enter 이동 + Esc 닫기

### 3.2 비기능 요구사항
- 성능: 인덱스 청크 lazy load, 초기 번들 영향 최소화
- 접근성: 모달 role/aria, 포커스 트랩, 스크린리더 결과 안내
- 배포: 인덱싱 산출물이 정적 배포에 포함되도록 빌드 파이프라인 정합

---

## 4. 구현 접근 (초안)

```
apps/web/
├── package.json        # "postbuild": "pagefind --site out" 또는 build:web 후속 단계
├── src/components/search/
│   ├── search-dialog.tsx   # cmdk 기반 모달 + ⌘K 트리거
│   └── use-pagefind.ts     # Pagefind 동적 import + 쿼리 훅
```

- 1단계: Pagefind 설치 + 빌드 통합(빌드 후 `out`/문서 디렉토리 인덱싱)
- 2단계: `use-pagefind` 훅(동적 import, debounce 쿼리)
- 3단계: cmdk 검색 모달 + ⌘K 글로벌 핫키
- 4단계: 결과 라우팅 + a11y 마감

---

## 5. 의존성·리스크
- WI-0016(문서 표준화)과 시너지: 표준 섹션 구조가 인덱싱 품질을 높임. 선후행 강제는 아니나 병행 권장.
- 리스크: static export 경로(`out`)와 Cloudflare Pages 배포 산출물 경로 정합 확인 필요.

---

## 6. Definition of Done
- [ ] Pagefind 빌드 통합 (AC1)
- [ ] ⌘K 검색 모달 + 실시간 결과 (AC2/AC3/AC4)
- [ ] 51개 문서 페이지 인덱싱 100% 확인
- [ ] 타입 체크 / 린트 / 빌드 통과
- [ ] Cloudflare Pages 정적 배포 검증
- [ ] release-notes.md 작성
