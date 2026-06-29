# 릴리스 노트 - WI-0016 문서 페이지 레이아웃 표준화

> 릴리스 날짜: 2026-06-30
> 범위: 문서 사이트(`apps/web`) 내부 리팩토링 · npm 배포 패키지 변경 없음

---

## 요약

48개 컴포넌트/Agentic 문서 페이지가 수작업 반복하던 헤더·섹션 보일러플레이트를 `DocPageLayout`/`DocSection` 공용 컴포넌트로 표준화했어요 (레이아웃 전용, 시각적 변화 없음).

---

## 변경 내역

### ✨ 추가 (Added)

- `DocPageLayout` 컴포넌트 (`apps/web/src/components/doc-page-layout.tsx`)
  - container/max-w-4xl 래퍼 + breadcrumb + h1 + 설명 헤더를 표준화
  - props: `category`, `categoryHref`, `title`, `description`, `children`
- `DocSection` 컴포넌트 (`apps/web/src/components/doc-section.tsx`)
  - section/h2 패턴을 표준화
  - 제목을 슬러그화한 **TOC 앵커 id 자동 부여** + `scroll-mt-20` (앵커 점프 시 헤더 가림 방지)
  - props: `title`, `id?`, `children`

### 🔄 변경 (Changed)

- 컴포넌트 문서 26개 + Agentic 문서 22개 (총 48개) 페이지를 공용 컴포넌트 기반으로 마이그레이션
- 각 페이지의 기존 섹션 구성·순서는 그대로 보존 (레이아웃 전용 범위)
- DocSection 제목과 중복되던 인라인 섹션 주석 97개 제거

### 🐛 수정 (Fixed)

- 해당 없음 (기능 변경 없는 구조 리팩토링)

### 🗑️ 제거 (Removed)

- 각 페이지의 수작업 `container py-12` / `<section className="mb-12">` 보일러플레이트 (공용 컴포넌트로 대체)
- 페이지별 `import Link from 'next/link'` (breadcrumb이 DocPageLayout 내부로 이동)

---

## Breaking Changes

> 없음. 문서 사이트 내부 구조 변경이며, npm 배포 패키지(`@axis-ds/*`) API에는 영향이 없어요.

---

## 검증 방법 (How to Verify)

1. `pnpm install`
2. `pnpm --filter @ax/web exec tsc --noEmit` → 타입 통과
3. `pnpm --filter @ax/web lint` → 린트 통과
4. `pnpm --filter @ax/web build` → 정적 페이지 214개 생성 성공
5. `pnpm dev:web` → 임의 컴포넌트 문서 페이지가 기존과 동일하게 렌더링되는지 확인
6. 잔존 구식 패턴 점검:
   ```bash
   grep -rl 'container py-12\|<section className="mb-12">' "apps/web/src/app/(docs)"/{components,agentic} --include=page.tsx
   # → 결과 0건이어야 함
   ```

---

## 알려진 이슈

- 인덱스 페이지 3개(`components`, `agentic`, `docs`)는 구조가 달라 이번 범위에서 제외 (PropsTable 미사용).
- 심화 표준화(섹션 순서 재정렬, "Interactive Demo" 명칭 통일, Accessibility 섹션 추가)는 후속 작업으로 분리 (todo.md 하단 참조).

---

## 롤백 가이드

문서 사이트 한정 변경이라 코드 롤백으로 충분해요:

```bash
git revert <머지 커밋>
# 또는 공용 컴포넌트 도입 전 커밋으로 되돌림
```

---

## 기여자

- @sinclairseo
