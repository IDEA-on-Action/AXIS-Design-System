# 릴리스 노트 — Core UI 컴포넌트 확장

> 릴리스 날짜: 2026-02-01

---

## 요약

Radix UI 기반 Core UI 컴포넌트 15개를 추가하여 총 30개 컴포넌트 체계를 완성합니다. 모든 컴포넌트는 AXIS 디자인 토큰을 적용하고 WCAG 접근성을 지원합니다.

---

## 변경 내역

### ✨ 추가 (Added)

- **레이아웃/구조**: Accordion, Sheet, Table
- **폼**: Checkbox, RadioGroup, Switch, Textarea, Slider
- **네비게이션/오버레이**: DropdownMenu, Popover, Command
- **피드백/표시**: Breadcrumb, ScrollArea, Toggle, Collapsible
- 15개 컴포넌트 문서 JSON (AXIS 레지스트리 형식)

### 주요 특징

- Radix UI Primitives 기반 접근성 내장
- AXIS 디자인 토큰 (`--axis-*` CSS 변수) 적용
- `forwardRef` 패턴으로 ref 전달 지원
- 다크모드 자동 대응
- class-variance-authority 기반 variant 시스템 (Sheet, Toggle)

---

## Breaking Changes

> 없음 (신규 컴포넌트 추가)

---

## 검증 방법 (How to Verify)

1. `pnpm install` 실행
2. `pnpm build` 로 전체 빌드 확인
3. `pnpm type-check` 타입 체크 통과 확인
4. `pnpm dev:web` 으로 문서 사이트에서 컴포넌트 확인

---

## 알려진 이슈

- 없음

---

## 롤백 가이드

문제 발생 시:

```bash
# 이전 버전으로 롤백
pnpm add @axis-ds/ui-react@<이전버전>
```

---

## 기여자

- @anthropic-claude (AI 협업)
