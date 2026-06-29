# 릴리스 노트 - WI-0017 문서 사이트 검색 (Pagefind)

> 릴리스 날짜: 2026-06-30
> 범위: 문서 사이트(`apps/web`) 기능 추가 · npm 배포 패키지 변경 없음

---

## 요약

문서 사이트에 Pagefind 기반 전역 검색을 추가했어요. ⌘K로 열어 컴포넌트·prop·예제를 즉시 찾을 수 있어요. 정적 사이트에 맞춰 빌드 타임 인덱싱 + 클라이언트 검색으로 동작하며 외부 런타임 서비스 의존이 없어요.

---

## 변경 내역

### ✨ 추가 (Added)

- **빌드 인덱싱**: `apps/web`의 `build` 스크립트에 `pagefind --site out` 체이닝
  - `next build`로 정적 export(`out`) 생성 후 Pagefind가 인덱싱
  - `pagefind` devDependency 추가
- **`use-pagefind` 훅** (`src/components/search/use-pagefind.ts`)
  - `/pagefind/pagefind.js` 동적 import(webpackIgnore) + debounce 쿼리
  - 인덱스 미생성 환경(dev 모드)에서 `available=false`로 graceful degrade
- **`SearchDialog`** (`src/components/search/search-dialog.tsx`)
  - 디자인 시스템 `Dialog` + `Command`(cmdk 기반) 조합
  - `shouldFilter={false}`로 Pagefind 랭킹을 그대로 사용
  - 결과: 제목 + excerpt(`<mark>` 하이라이트), 선택 시 해당 문서로 라우팅
- **`SearchTrigger`** (`src/components/search/search-trigger.tsx`)
  - ⌘K / Ctrl+K / `/` 글로벌 단축키
  - 헤더 검색 버튼(⌘K 힌트 포함)
- **`DocPageLayout`**: `data-pagefind-body` 부여 → 네비/푸터 제외하고 문서 본문만 인덱싱 (WI-0016 시너지)

### 🔄 변경 (Changed)

- `SiteHeader`에 검색 트리거를 ThemeToggle 좌측에 배치

---

## Breaking Changes

> 없음. 문서 사이트 기능 추가이며 npm 배포 패키지(`@axis-ds/*`) API에는 영향이 없어요.

---

## 검증 방법 (How to Verify)

1. `pnpm install`
2. `pnpm --filter @ax/web build`
   - 빌드 로그에 `Found a data-pagefind-body element` + `Indexed 48 pages` 확인
   - `apps/web/out/pagefind/pagefind.js` 생성 확인
3. 정적 서버로 `out` 서빙 후 ⌘K → 검색어 입력 → 결과 클릭 시 해당 문서 이동 확인
4. (dev) `pnpm dev:web` → 검색 다이얼로그가 "프로덕션 빌드에서 동작" 안내(graceful) 확인

---

## 알려진 이슈

- **dev 모드 미동작**: `next dev`는 Pagefind 인덱스를 생성하지 않아 검색이 비활성(안내 메시지 표시). 프로덕션 빌드 기준 기능.
- **인덱싱 범위**: `data-pagefind-body`를 가진 페이지(컴포넌트/Agentic 문서 48개)만 인덱싱. 인덱스 페이지·랜딩 등은 제외(의도). 확장 시 해당 레이아웃에 `data-pagefind-body` 추가.
- **한국어 stemming 미지원**: Pagefind가 한국어 어간 분석을 지원하지 않음(word 기반 인덱싱은 동작). 컴포넌트명/prop은 영문이라 영향이 적음.

---

## 롤백 가이드

문서 사이트 한정 변경이라 코드 롤백으로 충분해요:

```bash
git revert <머지 커밋>
```

빌드 인덱싱만 끄려면 `apps/web/package.json`의 `build`에서 `&& pagefind --site out`를 제거하면 돼요.

---

## 기여자

- @sinclairseo
