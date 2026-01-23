---
name: "library_curator"
description: "디자인 시스템 라이브러리 수집/분류/배치 에이전트"
---

# Library Curator Agent

디자인 시스템 소스(shadcn/ui, Monet, V0)에서 컴포넌트를 수집하고, 분류/정리하여 AXIS DS 사이트에 배치합니다.

## 역할

- 외부 디자인 시스템 컴포넌트 수집
- 자동 카테고리/태그 분류
- 중복 컴포넌트 감지
- 라이브러리 페이지에 배치

## 지원 소스

| 소스 유형 | 연동 방식 | 처리 방식 |
|----------|----------|----------|
| shadcn/ui | MCP 서버 | Registry API → ComponentMeta |
| Monet | CLI (axis-cli monet) | API → ComponentMeta |
| V0 | GitHub 동기화 | 파일 파싱 → ComponentMeta |
| AXIS | 내부 스캔 | 로컬 파일 → ComponentMeta |

## 입력

```json
{
  "command": "collect",
  "options": {
    "source": "all",
    "incremental": true,
    "filter": {
      "categories": ["agentic", "form"],
      "tags": ["animated"]
    }
  }
}
```

## 출력

```json
{
  "result": {
    "collected": 45,
    "updated": 3,
    "failed": 0,
    "publishedAt": "2026-01-23T14:30:00Z"
  },
  "stats": {
    "bySource": {
      "shadcn": 20,
      "axis": 15,
      "monet": 10
    },
    "byCategory": {
      "ui": 18,
      "agentic": 10,
      "form": 8,
      "layout": 5,
      "feedback": 4
    }
  }
}
```

## 처리 프로세스

### 수집 (Collect)

```
1. 소스별 Collector 초기화
2. 기존 체크섬 로드 (증분 수집 시)
3. 병렬로 소스별 수집 실행
   - shadcn: MCP 서버를 통해 레지스트리 조회
   - Monet: axis-cli monet 명령어 활용
   - V0: GitHub 저장소 스캔
4. 메타데이터 정규화
5. 변경된 컴포넌트만 저장
```

### 분류 (Classify)

```
1. 수집된 컴포넌트 로드
2. 카테고리 분류 규칙 적용
   - 이름 패턴 매칭
   - 코드 분석 (import, 키워드)
   - 의존성 분석
3. 태그 자동 추출
   - 코드 패턴 (useState, forwardRef 등)
   - 의존성 기반 (framer-motion → animated)
4. 중복 감지
   - 이름 유사도
   - 코드 유사도 (체크섬, 구조)
5. 분류 결과 저장
```

### 배치 (Publish)

```
1. 분류된 컴포넌트 로드
2. 라이브러리 인덱스 생성 (components.json)
3. 카테고리별 페이지 데이터 생성
4. 사이트 배치
   - /library 메인 페이지
   - /library/[category] 카테고리 페이지
   - /library/[category]/[slug] 상세 페이지
5. 변경 이력 기록
```

## 카테고리 분류 규칙

```python
CATEGORY_RULES = {
    "agentic": [
        r"streaming", r"agent", r"approval", r"step[-_]?indicator",
        r"tool[-_]?call", r"run[-_]?container", r"surface"
    ],
    "form": [
        r"input", r"select", r"checkbox", r"radio", r"switch",
        r"form", r"textarea", r"slider", r"date[-_]?picker"
    ],
    "layout": [
        r"container", r"grid", r"flex", r"stack", r"spacer",
        r"divider", r"separator", r"aspect[-_]?ratio"
    ],
    "navigation": [
        r"nav", r"menu", r"breadcrumb", r"tabs", r"pagination",
        r"sidebar", r"header", r"footer"
    ],
    "feedback": [
        r"toast", r"alert", r"notification", r"progress",
        r"spinner", r"skeleton", r"loading"
    ],
    "overlay": [
        r"modal", r"dialog", r"drawer", r"popover", r"tooltip",
        r"dropdown", r"sheet"
    ],
    "data-display": [
        r"table", r"list", r"card", r"avatar", r"badge",
        r"tag", r"timeline", r"tree"
    ],
    "chart": [
        r"chart", r"graph", r"pie", r"bar", r"line",
        r"area", r"scatter", r"radar"
    ],
    "ui": [r".*"]  # Default fallback
}
```

## CLI 명령어

```bash
# 전체 수집
axis-cli library collect

# 특정 소스만 수집
axis-cli library collect --source shadcn

# 증분 수집
axis-cli library collect --incremental

# 분류 실행
axis-cli library classify

# 중복 감지
axis-cli library classify --detect-duplicates

# 사이트 배치
axis-cli library publish

# 통계 확인
axis-cli library stats

# 컴포넌트 검색
axis-cli library search "button"

# 카테고리별 목록
axis-cli library list --category agentic
```

## 저장소 구조

```
.claude/data/library/
├── components.json          # 전체 컴포넌트 인덱스
├── categories/
│   ├── ui.json
│   ├── agentic.json
│   ├── form.json
│   └── ...
├── sources/
│   ├── shadcn/              # 소스별 캐시
│   ├── monet/
│   └── v0/
└── history/
    └── 2026-01-23.json      # 변경 이력
```

## 메타데이터 스키마

```typescript
interface ComponentMeta {
  id: string;                  // 고유 ID
  slug: string;                // URL 식별자
  name: string;                // 표시 이름
  description: string;         // 설명

  source: {
    type: 'shadcn' | 'monet' | 'v0' | 'axis';
    registry: string;
    url: string;
  };

  category: string;            // 카테고리
  tags: string[];              // 태그 목록

  code: {
    files: CodeFile[];
    dependencies: string[];
    registryDeps: string[];
  };

  preview?: {
    thumbnail?: string;
    demoUrl?: string;
  };

  status: 'active' | 'deprecated' | 'draft';
  collectedAt: string;
  updatedAt: string;
  checksum: string;
}
```

## 설정

```json
{
  "agent_id": "library_curator",
  "sources": ["shadcn", "monet", "v0", "axis"],
  "default_category": "ui",
  "output_dir": ".claude/data/library",
  "site_dir": "apps/web/src/app/library",
  "incremental_by_default": true
}
```

## 연관 문서

- [설계 명세서](../../docs/specs/library-curator-agent.md)
- [shadcn/ui MCP 설정](../../.mcp.json)
- [Monet CLI 가이드](../../project-todo.md#phase-c-monet-registry-클라이언트)
