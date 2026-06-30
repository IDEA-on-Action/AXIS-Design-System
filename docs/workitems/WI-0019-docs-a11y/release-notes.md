# 릴리스 노트 - WI-0019 문서 페이지 Accessibility 섹션

> 릴리스 날짜: 2026-06-30
> 범위: 문서 사이트(`apps/web`) 콘텐츠 추가 · npm 배포 패키지 변경 없음
> 선행: WI-0018(순서·명칭 표준화). 본 WI는 분리된 a11y 콘텐츠 authoring.

---

## 요약

48개 컴포넌트/Agentic 문서 페이지에 Accessibility 섹션을 추가했어요. 키보드 조작 표와 ARIA/스크린리더 노트를 컴포넌트별로 제공해요.

---

## 변경 내역

### ✨ 추가 (Added)

- **`KeyboardTable` 공용 컴포넌트** (`apps/web/src/components/keyboard-table.tsx`)
  - 키보드 조작을 Key/Action 표로 표준 표시 (PropsTable 스타일)
- **48개 페이지 Accessibility 섹션** (모든 페이지 마지막 섹션)
  - a11y 기반 한 줄(Radix/네이티브/커스텀) + 키보드 조작 표 + ARIA/스크린리더 노트
  - **Radix 기반 20개**: 문서화된 WAI-ARIA 패턴 동작을 단언 (dialog, checkbox, select, tabs, slider 등)
  - **커스텀/네이티브 10개**: 실제 마크업 시맨틱 + a11y 가이드 (input/textarea 네이티브, command cmdk, alert/badge/card 등)
  - **agentic 18개**: 검증 가능한 시맨틱 + 권고형 a11y 가이드

### 작성 원칙
- 정확성 우선: 구현에 없는 a11y 기능을 단언하지 않음. Radix는 라이브러리 보장 동작, 커스텀/agentic은 시맨틱 사실 + "~하세요" 권고형으로 기술.

---

## Breaking Changes

> 없음. 문서 콘텐츠 추가이며 npm 배포 패키지(`@axis-ds/*`) API에는 영향이 없어요.

---

## 검증 방법 (How to Verify)

1. `pnpm --filter @ax/web exec tsc --noEmit` → 타입 통과
2. `pnpm --filter @ax/web lint` → 린트 통과
3. `pnpm --filter @ax/web build` → 정적 214페이지 + Pagefind 48 인덱싱 유지
4. Accessibility 섹션 전수:
   ```bash
   # 모든 컴포넌트/agentic 페이지에 Accessibility 섹션 존재 (48/48)
   ```

---

## 알려진 이슈

- agentic/커스텀 컴포넌트의 a11y 노트는 일부 권고형(개선 가이드)이에요. 향후 컴포넌트 구현의 실제 aria 속성과 1:1 동기화하는 후속 점검이 가능해요.
- 자동 a11y 테스트(axe 등)는 본 WI 범위 밖이에요.

---

## 롤백 가이드

```bash
git revert <머지 커밋>
```

---

## 기여자

- @sinclairseo
