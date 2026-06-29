# 릴리스 노트 - WI-0018 문서 페이지 심화 표준화

> 릴리스 날짜: 2026-06-30
> 범위: 문서 사이트(`apps/web`) 콘텐츠 표준화 · npm 배포 패키지 변경 없음
> 선행: WI-0016(레이아웃 표준화). 본 WI는 후속 콘텐츠 표준화.

---

## 요약

WI-0016이 통일한 레이아웃 위에서, 48개 문서 페이지의 섹션 순서·명칭을 단일 표준으로 정렬했어요. 시각적 구성은 유지하되 일관성을 높였어요.

---

## 변경 내역

### 🔄 변경 (Changed)

- **섹션 순서 정규화**: `Installation → Usage → Interactive Demo → 예제 → Props` 표준 적용
  - Usage 섹션을 Installation 직후(2번째)로 통일 (agentic 16페이지 Demo→Usage 역전 + agent-avatar 교정, 총 17페이지 재정렬)
  - 결과: 48/48 페이지 Usage=2번째, Demo 역전 0건
- **데모 섹션 명칭 통일**: "Demo"·"Animated Demo" → **"Interactive Demo"** (18종 전부 단일화)
- **Type 섹션 명칭 규칙**: `{TypeName} Type` 패턴 적용 (surface-renderer "SurfaceType" → "SurfaceType Type"). 열거형 섹션(File Types, Allowed Surface Types)과 prop 변이 쇼케이스(agent-avatar Types)는 타입 정의가 아니라 제외.

---

## Breaking Changes

> 없음. 문서 사이트 콘텐츠 재배치이며 npm 배포 패키지(`@axis-ds/*`) API에는 영향이 없어요.

---

## 검증 방법 (How to Verify)

1. `pnpm --filter @ax/web exec tsc --noEmit` → 타입 통과
2. `pnpm --filter @ax/web lint` → 린트 통과
3. `pnpm --filter @ax/web build` → 정적 214페이지 + Pagefind 48 인덱싱 유지
4. 순서 검증:
   ```bash
   # 모든 페이지에서 Usage가 2번째 DocSection인지
   # Demo가 Usage보다 앞서는 역전이 0건인지
   ```

---

## 알려진 이슈

- **Accessibility 섹션**은 본 WI에서 제외, **WI-0019로 분리**. 컴포넌트별 a11y 콘텐츠(키보드·ARIA·스크린리더) authoring이 필요해 구조 표준화와 분리.
- 컴포넌트별 예제 섹션(Variants/Sizes/States 등)의 순서·구성은 컴포넌트 고유라 통일 대상에서 제외.

---

## 롤백 가이드

```bash
git revert <머지 커밋>
```

---

## 기여자

- @sinclairseo
