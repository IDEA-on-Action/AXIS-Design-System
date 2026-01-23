# Library Curator Agent 사용 가이드

> AXIS Design System의 컴포넌트 라이브러리를 수집, 분류, 배치하는 Agent

**버전**: 0.7.0 | **최종 업데이트**: 2026-01-23

---

## 개요

Library Curator Agent는 다양한 디자인 시스템 소스(shadcn/ui, Monet, V0, AXIS)에서 컴포넌트를 자동으로 수집하고, 분류한 후, AXIS Design System 사이트에 배치합니다.

### 주요 기능

- **수집(Collect)**: 4개 소스에서 컴포넌트 메타데이터 및 코드 수집
- **분류(Classify)**: 10개 카테고리 자동 분류, 태그 추출, 중복 감지
- **배치(Publish)**: JSON 파일 생성, 검색 인덱스 생성, 사이트 배포

---

## 빠른 시작

### 1. 컴포넌트 수집

```bash
# 모든 소스에서 수집
npx axis-cli library collect

# 특정 소스만 수집
npx axis-cli library collect --source shadcn
npx axis-cli library collect --source monet
npx axis-cli library collect --source v0
npx axis-cli library collect --source axis

# 증분 수집 (변경분만)
npx axis-cli library collect --incremental
```

### 2. 컴포넌트 목록 조회

```bash
# 전체 목록
npx axis-cli library list

# 카테고리별 필터
npx axis-cli library list --category ui
npx axis-cli library list --category agentic

# 소스별 필터
npx axis-cli library list --source shadcn
```

### 3. 컴포넌트 검색

```bash
# 이름/설명/태그로 검색
npx axis-cli library search "button"
npx axis-cli library search "streaming"

# 필터와 함께 검색
npx axis-cli library search "dialog" --category overlay
npx axis-cli library search "form" --source axis
```

### 4. 통계 확인

```bash
npx axis-cli library stats
```

출력 예시:
```
📊 Library Curator - 통계

전체 컴포넌트: 45개
마지막 업데이트: 2026-01-23T10:30:00Z

소스별:
  shadcn     20개
  axis       15개
  monet      10개

카테고리별:
  ui              12개
  agentic         10개
  form            8개
  navigation      5개
  ...
```

### 5. 사이트 배치

```bash
# 기본 배치
npx axis-cli library publish

# 압축된 JSON 출력
npx axis-cli library publish --minify

# 기존 배치 정리 후 재배치
npx axis-cli library publish --clean

# 커스텀 출력 디렉토리
npx axis-cli library publish --output ./public/api/library
```

---

## 아키텍처

### 파이프라인 흐름

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Sources   │ ──▶ │  Collector  │ ──▶ │ Classifier  │ ──▶ │  Publisher  │
│             │     │             │     │             │     │             │
│ • shadcn    │     │ • listAll() │     │ • category  │     │ • JSON      │
│ • Monet     │     │ • collect() │     │ • tags      │     │ • search    │
│ • V0        │     │ • normalize │     │ • dedupe    │     │ • deploy    │
│ • AXIS      │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 디렉토리 구조

```
packages/axis-cli/src/library/
├── types.ts              # 타입 정의
├── base-collector.ts     # 베이스 Collector + Classifier
├── shadcn-collector.ts   # shadcn/ui 수집기
├── monet-collector.ts    # Monet 수집기
├── v0-collector.ts       # V0 수집기
├── axis-collector.ts     # AXIS 내부 수집기
├── publisher.ts          # 사이트 배치 모듈
└── index.ts              # LibraryCurator 메인 클래스

.claude/data/library/
├── components.json       # 전체 인덱스
└── categories/           # 카테고리별 JSON
    ├── ui.json
    ├── agentic.json
    └── ...

apps/web/public/library/  # 배치된 정적 파일
├── index.json
├── meta.json
├── search-index.json
├── categories/
└── components/
```

---

## 카테고리 분류

Library Curator는 10개의 카테고리로 컴포넌트를 자동 분류합니다:

| 카테고리 | 설명 | 예시 |
|---------|------|------|
| `ui` | 기본 UI 컴포넌트 | Button, Card, Badge |
| `agentic` | AI/LLM 특화 컴포넌트 | StreamingText, ApprovalDialog |
| `form` | 폼 입력 컴포넌트 | Input, Select, Checkbox |
| `layout` | 레이아웃 컴포넌트 | Separator, Grid, Container |
| `navigation` | 네비게이션 컴포넌트 | Tabs, Breadcrumb, Pagination |
| `feedback` | 피드백 컴포넌트 | Toast, Alert, Progress |
| `overlay` | 오버레이 컴포넌트 | Dialog, Modal, Popover |
| `data-display` | 데이터 표시 컴포넌트 | Table, Avatar, Badge |
| `chart` | 차트/시각화 컴포넌트 | BarChart, PieChart |
| `utility` | 유틸리티 컴포넌트 | Slot, Aspect Ratio |

분류는 컴포넌트 이름과 코드 내용을 기반으로 자동으로 수행됩니다.

---

## 소스별 수집 방식

### shadcn/ui

- **방식**: Registry API 직접 호출
- **엔드포인트**: `https://ui.shadcn.com/r/{name}.json`
- **특징**: 전체 코드 및 의존성 정보 수집 가능

### Monet

- **방식**: 정적 카테고리 메타데이터
- **제한**: 공개 API 없음, 카테고리 정보만 수집
- **사용**: `axis-cli monet browse` 명령어와 연동

### V0

- **방식**: 로컬 디렉토리 스캔
- **경로**: `./src/components/v0/`
- **특징**: V0 생성 코드를 AXIS 스타일로 자동 변환

### AXIS (내부)

- **방식**: 프로젝트 디렉토리 스캔
- **경로**:
  - `packages/axis-ui-react/src/`
  - `packages/axis-agentic-ui/src/`
  - `apps/web/src/app/components/`
  - `apps/web/src/app/agentic/`

---

## API 사용

프로그래밍 방식으로 Library Curator를 사용할 수 있습니다:

```typescript
import { LibraryCurator, Publisher } from "axis-cli/library";

// Curator 인스턴스 생성
const curator = new LibraryCurator({
  dataDir: ".claude/data/library",
  rootDir: process.cwd(),
});

// 전체 수집
const results = await curator.collectAll();

// 인덱스 생성
const index = await curator.generateIndex();

// 인덱스 저장
await curator.saveIndex(index);

// 검색
const components = await curator.searchComponents("streaming", {
  category: "agentic",
});

// 사이트 배치
const publisher = new Publisher();
const publishResult = await publisher.publish(index, {
  outputDir: "apps/web/public/library",
  minify: true,
  generateSearchIndex: true,
});
```

---

## 트러블슈팅

### 수집 실패

```bash
# 상세 로그 확인
npx axis-cli library collect --verbose

# 특정 소스만 테스트
npx axis-cli library collect --source shadcn --dry-run
```

### 인덱스 재생성

```bash
# 기존 인덱스 삭제 후 재수집
rm -rf .claude/data/library/
npx axis-cli library collect
```

### 배치 문제

```bash
# 배치 상태 확인
ls -la apps/web/public/library/

# 기존 배치 정리
npx axis-cli library publish --clean
```

---

## 참고 자료

- [Library Curator Agent 설계 문서](../specs/library-curator-agent.md)
- [AXIS CLI 사용 가이드](./cli-usage.md)
- [shadcn/ui Registry](https://ui.shadcn.com/docs/registry)
