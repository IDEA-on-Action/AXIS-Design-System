# TODO — Core UI 컴포넌트 확장

> WI: WI-0003 | PRD 기반 | 상태: In Progress

---

## 현황

- 목표: 30개 Core UI 컴포넌트
- 기존 완료: 15개 (Button, Input, Label, Card, Separator, Dialog, Select, Tabs, Toast, Badge, Avatar, Tooltip, Skeleton, Alert, Progress)
- 추가 필요: 15개

---

## 실행 순서 (제안)

1. 레이아웃/구조 컴포넌트 (Accordion, Sheet, Table)
2. 폼 컴포넌트 (Checkbox, Radio, Switch, Textarea, Slider)
3. 네비게이션/오버레이 (Dropdown Menu, Popover, Command)
4. 피드백/표시 (Breadcrumb, Scroll Area, Toggle, Collapsible)
5. 품질 검증 및 문서화

---

## Tasks

### Phase 1: 레이아웃/구조 컴포넌트

- [x] **T1: Accordion 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/accordion/index.tsx`
  - 접근성: 키보드 탐색, aria-expanded

- [x] **T2: Sheet (사이드 패널) 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/sheet/index.tsx`
  - 접근성: focus trap, aria-modal

- [x] **T3: Table 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/table/index.tsx`
  - 접근성: role="table", 캡션 지원

### Phase 2: 폼 컴포넌트

- [x] **T4: Checkbox 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/checkbox/index.tsx`
  - 접근성: aria-checked, 라벨 연결

- [x] **T5: Radio Group 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/radio-group/index.tsx`
  - 접근성: role="radiogroup", 방향키 탐색

- [x] **T6: Switch 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/switch/index.tsx`
  - 접근성: role="switch", aria-checked

- [x] **T7: Textarea 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/textarea/index.tsx`
  - 접근성: 라벨 연결, aria-describedby

- [x] **T8: Slider 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/slider/index.tsx`
  - 접근성: role="slider", aria-valuemin/max/now

### Phase 3: 네비게이션/오버레이 컴포넌트

- [x] **T9: Dropdown Menu 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/dropdown-menu/index.tsx`
  - 접근성: role="menu", 키보드 탐색

- [x] **T10: Popover 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/popover/index.tsx`
  - 접근성: focus 관리, Escape 닫기

- [x] **T11: Command (커맨드 팔레트) 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/command/index.tsx`
  - 접근성: role="listbox", 검색 필터

### Phase 4: 피드백/표시 컴포넌트

- [x] **T12: Breadcrumb 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/breadcrumb/index.tsx`
  - 접근성: nav aria-label="breadcrumb"

- [x] **T13: Scroll Area 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/scroll-area/index.tsx`
  - 접근성: 키보드 스크롤 지원

- [x] **T14: Toggle 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/toggle/index.tsx`
  - 접근성: aria-pressed

- [x] **T15: Collapsible 컴포넌트**
  - AC: AC1, AC2, AC3
  - 대상 파일: `packages/axis-ui-react/src/collapsible/index.tsx`
  - 접근성: aria-expanded, aria-controls

### Phase 5: 품질 검증

- [x] **T16: 전체 타입 체크 통과**
  - AC: AC2
  - 검증: `pnpm type-check`

- [x] **T17: 전체 린트 통과**
  - AC: AC2
  - 검증: `pnpm lint`

- [x] **T18: 전체 빌드 성공**
  - AC: AC2
  - 검증: `pnpm build`

- [ ] **T19: 컴포넌트별 Props 문서 및 예제 작성**
  - AC: AC3
  - 대상: 추가된 15개 컴포넌트 문서 페이지

---

## Definition of Done (WI)

- [ ] 모든 Task 완료
- [x] 타입 체크 통과 (`pnpm type-check`)
- [x] 린트 통과 (`pnpm lint`)
- [x] 빌드 성공 (`pnpm build`)
- [ ] 컴포넌트별 문서 및 예제 포함
- [ ] 릴리스 노트 작성
