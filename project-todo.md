# AX Discovery Portal - Project TODO

> 프로젝트 진행 상황 및 다음 단계

**현재 버전**: 0.6.0
**마지막 업데이트**: 2026-01-23
**상태**: ✅ PoC 완료 → Post-PoC 진입

---

## 🎉 PoC 완료 요약

| 항목 | 목표 | 달성 |
|------|------|------|
| 기간 | 6주 | ✅ 완료 |
| 워크플로 | WF-01~06 | ✅ 6개 모두 구현 |
| 에이전트 | 6개 | ✅ 모두 동작 |
| 테스트 | 80%+ 커버리지 | ✅ 891개 통과 |
| 빌드 | 12 packages | ✅ 모두 성공 |

---

## 📌 현재 스프린트: Post-PoC Phase 진입

**목표**: 프로덕션 준비 및 실사용 전환
**테마**: v0.7.0 - 운영 안정화 및 실데이터 수집

### 🔥 즉시 작업 (Week 7)

| # | 항목 | 우선순위 | 상태 |
|---|------|----------|------|
| 1 | **디자인 시스템 리소스 연동** (shadcn/ui, Monet, V0) | P0 | 🔲 |
| 2 | 프로덕션 배포 환경 확정 (Render/AWS/GCP) | P0 | 🔲 |
| 3 | 사용자 온보딩 (BD팀 교육) | P1 | 🔲 |
| 4 | Confluence 실제 Space 연동 | P1 | 🔲 |

---

## 🎨 디자인 시스템 리소스 연동 계획

### 조사 결과 요약

| 소스 | 연동 방식 | 우선순위 |
|------|----------|----------|
| **shadcn/ui** | MCP 서버 + Registry API | P0 (핵심) |
| **Monet** | registry.monet.design API | P1 |
| **V0** | GitHub 동기화 (공개 API 없음) | P2 |

### Phase A: shadcn/ui MCP 서버 연동 (Week 7) ✅ 완료

| # | 작업 | 상태 |
|---|------|------|
| A1 | `pnpm dlx shadcn@latest mcp init --client claude` 실행 | ✅ |
| A2 | components.json에 AXIS 레지스트리 설정 추가 | ✅ |
| A3 | Claude Code에서 shadcn 컴포넌트 조회/설치 테스트 | ✅ |
| A4 | AXIS DS를 shadcn 호환 레지스트리로 배포 준비 | ✅ |

**생성된 파일**:
- `.mcp.json` - shadcn MCP 서버 설정
- `components.json` - shadcn/ui 설정 (registries 포함)
- `public/r/registry.json` - AXIS 통합 레지스트리
- `public/r/*.json` - 20개 컴포넌트 레지스트리 아이템
- `scripts/build-registry.mjs` - 레지스트리 빌드 스크립트

### Phase B: AXIS Design System Registry 구축 (Week 7-8) ✅ 완료

| # | 작업 | 상태 |
|---|------|------|
| B1 | `registry.json` 스키마 작성 (AXIS 컴포넌트 20개) | ✅ |
| B2 | 각 컴포넌트별 `registry-item.json` 생성 | ✅ |
| B3 | Registry 엔드포인트 배포 (`apps/web/public/r/`) | ✅ |
| B4 | CI/CD 워크플로 업데이트 (레지스트리 빌드 포함) | ✅ |

**배포 URL**: `https://[your-domain]/r/registry.json`
**CORS**: 모든 도메인 허용 (_headers 설정)

### Phase C: Monet Registry 클라이언트 (Week 8) ✅ 완료

| # | 작업 | 상태 |
|---|------|------|
| C1 | Monet API/MCP 분석 | ✅ |
| C2 | Monet CLI 도구 개발 (axis-cli monet) | ✅ |
| C3 | .claude/mcp.json에 Monet MCP 서버 추가 | ✅ |
| C4 | 사용 가이드 문서화 | ✅ |

**CLI 사용법**:
```bash
axis-cli monet list              # 카테고리 목록 (14개)
axis-cli monet browse <category> # 카테고리 컴포넌트 보기
axis-cli monet search <query>    # 컴포넌트 검색
axis-cli monet import            # 클립보드에서 가져오기
axis-cli monet setup             # MCP 설정 안내
```

**MCP 연동**: API 키 필요 (https://monet.design/mcp)

### Phase D: V0 통합 (Week 9)

| # | 작업 | 상태 |
|---|------|------|
| D1 | V0 생성 코드 → AXIS 컴포넌트 변환 가이드 작성 | 🔲 |
| D2 | GitHub 동기화 워크플로 설정 | 🔲 |
| D3 | V0 템플릿 AXIS 스타일 적용 스크립트 | 🔲 |

### 기술 스택

```
Registry 시스템
├── shadcn/ui Registry Schema (표준)
├── MCP Server (Claude Code 통합)
├── CLI Tool (axis-cli 확장)
└── API Endpoint (Cloudflare Pages)

연동 소스
├── shadcn/ui (ui.shadcn.com) - MCP 직접 연동
├── Monet (registry.monet.design) - API 클라이언트
└── V0 (v0.app) - GitHub 동기화
```

### 참고 리소스

- shadcn/ui Registry: https://ui.shadcn.com/docs/registry
- shadcn/ui MCP: https://ui.shadcn.com/docs/registry/mcp
- Monet 예시: https://www.monet.design/p/deepcon-ai-landing
- V0: https://v0.app/

### 📋 Post-PoC 백로그

#### Phase 6: Production Readiness (프로덕션 준비)

| # | 항목 | 우선순위 | 상태 |
|---|------|----------|------|
| 1 | 프로덕션 PostgreSQL 설정 (Supabase/RDS) | P0 | 🔲 |
| 2 | 환경 분리 (dev/staging/prod) | P0 | 🔲 |
| 3 | 시크릿 관리 (Vault/AWS Secrets Manager) | P1 | 🔲 |
| 4 | 로깅/모니터링 강화 (Datadog/Grafana) | P1 | 🔲 |
| 5 | 백업/복구 전략 수립 | P1 | 🔲 |
| 6 | 보안 감사 (OWASP Top 10 점검) | P2 | 🔲 |
| 7 | 성능 테스트 (부하 테스트) | P2 | 🔲 |

#### Phase 7: Scale & Expansion (확장)

| # | 항목 | 우선순위 | 상태 |
|---|------|----------|------|
| 1 | 모바일 앱 (PWA 또는 React Native) | P2 | 🔲 |
| 2 | 다중 테넌트 지원 (팀별 격리) | P2 | 🔲 |
| 3 | API Rate Limiting | P2 | 🔲 |
| 4 | Webhook 알림 시스템 | P2 | 🔲 |
| 5 | 외부 CRM 연동 (Salesforce/HubSpot) | P3 | 🔲 |
| 6 | 데이터 내보내기/가져오기 | P3 | 🔲 |

#### Phase 8: Advanced AI Features (AI 고도화)

| # | 항목 | 우선순위 | 상태 |
|---|------|----------|------|
| 1 | RAG 파이프라인 최적화 (Embedding 모델 튜닝) | P2 | 🔲 |
| 2 | 자동 요약 품질 개선 (Fine-tuning 검토) | P2 | 🔲 |
| 3 | 다국어 지원 (영/일/중) | P3 | 🔲 |
| 4 | 음성 입력 지원 (Whisper 연동) | P3 | 🔲 |
| 5 | 이미지/PDF 자동 분석 (Vision API) | P3 | 🔲 |

---

## 🚧 진행 중인 Phase

### Phase 5: AI 에이전트 평가(Evals) 플랫폼 (Phase 5.0 MVP 100% 완료) - 진행 중

> **근거**: RosettaLens 번역본 'AI 에이전트를 위한 평가(evals) 쉽게 이해하기' 및 Anthropic Engineering
> **목적**: 에이전트 품질을 개발 단계에서 자동 검증, 프로덕션 반응적 루프 감소

#### Phase 5.0: MVP (4-6주 목표)

| # | 항목 | 상태 | 예상 일정 |
|---|------|------|----------|
| 1 | Task/Suite YAML 스키마 정의 (`evals/` 디렉토리) | ✅ | Week 7 |
| 2 | 핵심 엔터티 모델 구현 (Task, Trial, Transcript, GraderResult) | ✅ | Week 7 |
| 3 | DB 마이그레이션 (eval_suites, eval_tasks, eval_runs, eval_trials) | ✅ | Week 7 |
| 4 | Eval Harness 기본 구현 (단일 프로세스 실행기) | ✅ | Week 8 |
| 5 | Deterministic Graders (pytest, ruff, mypy 기반) | ✅ | Week 8 |
| 6 | Transcript/Outcome 저장 + 간단 뷰어 API | ✅ | Week 8 |
| 7 | CI 게이팅 (regression suite 자동 실행) | ✅ | Week 9 (워크플로 수정 완료) |
| 8 | 기존 6개 에이전트 기본 Task 작성 (각 3-5개) | ✅ | Week 10 |

#### Phase 5.1: 신뢰성 강화 (Phase 5.0 완료 후)

| # | 항목 | 상태 |
|---|------|------|
| 1 | LLM-as-Judge grader 구현 (Claude 루브릭 기반) | ✅ |
| 2 | 인간 보정 워크플로 (SME 스팟체크, IAA 관리) | 🔲 |
| 3 | pass@k / pass^k 공식 리포트 | 🔲 |
| 4 | 비용/지연/토큰 대시보드 | 🔲 |
| 5 | Trial 격리 환경 (컨테이너 기반 샌드박스) | 🔲 |

#### Phase 5.2: 에이전트 유형 확장 + 거버넌스 (Phase 5.1 완료 후)

| # | 항목 | 상태 |
|---|------|------|
| 1 | 대화형 에이전트 평가 (사용자 시뮬레이터 LLM) | 🔲 |
| 2 | 리서치 에이전트 평가 (groundedness/coverage/source quality) | 🔲 |
| 3 | Eval saturation 모니터링 + capability→regression 자동 전환 | 🔲 |
| 4 | 도메인팀 Task PR 기여 모델 + 오너십 정책 | 🔲 |
| 5 | Anti-cheat grader 설계 가이드 | 🔲 |

#### 핵심 개념 모델

| 개념 | 설명 |
|------|------|
| **Task** | 입력 + 성공 기준이 정의된 단일 테스트 케이스 |
| **Trial** | 한 Task에 대한 1회 실행 시도 (비결정성 → 복수 트라이얼) |
| **Transcript** | Trial의 전체 기록 (출력, 도구 호출, 중간 상태) |
| **Outcome** | Trial 종료 시 환경의 최종 상태 ("말"이 아닌 "상태" 검증) |
| **Grader** | 성능 특정 측면을 점수화하는 로직 |
| **Eval Suite** | 특정 역량/행동을 측정하는 Task 묶음 |

#### 채점 전략 (에이전트별)

| 에이전트 | Eval 유형 | 채점 전략 |
|---------|----------|----------|
| orchestrator | capability | outcome + 워크플로 완료율 |
| external_scout | regression | 수집 데이터 품질 + 소스 다양성 |
| scorecard_evaluator | capability | Scorecard 정확도 + 인간 보정 |
| brief_writer | capability | Brief 품질 루브릭 (LLM judge) |
| confluence_sync | regression | 동기화 성공률 + 데이터 무결성 |
| voc_analyst | capability | 테마 추출 정확도 + coverage |

---

### Phase 3: Advanced Features (100% 완료)

**완료 항목** (36개):
- [x] Scorecard API 라우터 DB 연동 ✅ v0.3.0
- [x] Brief API 라우터 DB 연동 ✅ v0.3.0
- [x] PlayDashboard API 라우터 DB 연동 ✅ v0.3.0
- [x] WF-02 Interview-to-Brief 구현 ✅ v0.3.0
- [x] WF-04 Inbound Triage 구현 ✅ v0.3.0
- [x] WF-03 VoC Mining 구현 ✅ v0.4.0
- [x] Opportunity Stage 파이프라인 시스템 ✅ v0.5.0
- [x] Ontology 기반 Knowledge Graph ✅ v0.4.0 → v0.5.1 강화
- [x] 중복 Signal 체크 알고리즘 ✅ v0.3.0
- [x] WF-05 KPI Digest 구현 ✅ v0.4.0
- [x] WF-06 Confluence Sync 구현 ✅ v0.4.0
- [x] Teams 연동 (MCP 서버) ✅ v0.4.0
- [x] Slack 연동 (MCP 서버) ✅ v0.4.0
- [x] Vector RAG 파이프라인 ✅ v0.4.0

### Phase 4: UI & UX (100% 완료 - PoC 범위)

**Post-PoC 이관 항목**:
- 모바일 앱 (PWA/React Native) → Phase 7로 이동

**완료 항목** (17개):
- [x] 모노레포 구조 (pnpm + Turborepo) ✅ v0.3.0
- [x] 웹 UI (Next.js 15) - 6개 페이지 ✅ v0.3.0
- [x] AXIS 디자인 시스템 ✅ v0.3.0
- [x] 공유 패키지 5개 ✅ v0.3.0
- [x] 페이지별 API 연동 완성 ✅ v0.4.0

---

## 🐛 알려진 이슈

| # | 이슈 | 상태 | 해결 방법 |
|---|------|------|----------|
| 1 | Stream Router dataclass 오류 | ✅ 해결 | datetime deprecation 수정 |
| 2 | Confluence Database API 제약 | ✅ 해결 | PostgreSQL PlayRecordRepository 사용 |
| 3 | Markdown to Confluence 변환 | ✅ 해결 | markdown2 라이브러리 도입 |
| 4 | 인증/권한 mock 구현 | ✅ 해결 | JWT 인증 시스템 구현 |
| 5 | Alembic 마이그레이션 미완성 | ✅ 해결 | 3개 마이그레이션 체인 완성 |
| 6 | Render 배포 email-validator 누락 | ✅ 해결 | 명시적 의존성 추가 |

---

## ✅ 완료된 스프린트 (역순)

### Week 6 - 2026-01-23 (PoC 완료)

**목표**: PoC 완료 및 데모 준비 ✅ 달성

| 항목 | 상태 |
|------|------|
| WF-01~06 전체 파이프라인 E2E 테스트 | ✅ 80 passed |
| KPI Digest 리포트 생성 | ✅ v0.6.0 |
| 프로덕션 환경 모니터링 (Sentry) | ✅ |
| 성능 최적화 (N+1 쿼리 해결) | ✅ |
| 테스트 격리 문제 해결 (891개 통과) | ✅ |
| ESLint 9.x 설정 수정 | ✅ |
| 데모 시연 (3개 시나리오) | ✅ |
| v0.6.0 릴리스 및 태그 | ✅ |

**주요 성과**: PoC 6주 목표 100% 달성, 12 packages 빌드 성공

---

### Week 5 - 2026-01-16

**목표**: WF-06 스테이징 배포 및 검증 ✅ 달성

| 항목 | 상태 |
|------|------|
| CD 워크플로 staging 브랜치 지원 추가 | ✅ |
| email-validator 의존성 오류 해결 | ✅ |
| WF-06 Confluence Sync 스테이징 배포 성공 | ✅ |
| 9개 Confluence API 엔드포인트 테스트 통과 | ✅ |

**주요 성과**: v0.4.0 릴리스, WF-03/06 구현 완료, E2E 테스트 49개

---

### Week 4

**목표**: API 라우터 DB 연동 및 WF-02/04 구현 ✅ 달성

| 항목 | 상태 |
|------|------|
| 데이터베이스에 Signal 저장 | ✅ v0.3.0 |
| 웹 UI 기본 페이지 구현 | ✅ v0.3.0 |
| AXIS 디자인 시스템 타입 정의 | ✅ v0.3.0 |
| 데이터베이스에 Scorecard 저장 | ✅ v0.3.0 |
| 데이터베이스에 Brief 저장 | ✅ v0.3.0 |
| `/ax:triage` 실행 시 WF-04 성공 | ✅ v0.3.0 |
| Scorecard 100점 만점 평가 동작 | ✅ v0.3.0 |
| Brief 1-Page 포맷 자동 생성 | ✅ v0.3.0 |
| pytest 전체 테스트 통과 (80%+ 커버리지) | ✅ v0.4.0 |

---

## ✅ 완료된 Phase (역순)

### Phase 2.5: CI/CD & Infrastructure (완료) - v0.4.0

| 카테고리 | 완료 항목 |
|----------|----------|
| GitHub Actions | frontend.yml, ci-backend.yml, cd-backend.yml |
| Cloudflare | Pages, D1 데이터베이스, 마이그레이션 |
| Render | render.yaml, Deploy Hook |
| GitHub Secrets | 4개 설정 완료 |
| 기타 | 로컬 .env, GitHub Flow 브랜치 전략 |

---

### Phase 2: Core Integration (완료) - v0.2.0 ~ v0.3.0

| 카테고리 | 완료 항목 |
|----------|----------|
| Claude Agent SDK | Agent 인스턴스, MCP 도구 연동, 세션 관리 |
| WF-01 Seminar | Pydantic 모델, Activity/Signal 생성, AAR, Confluence |
| 데이터베이스 | PostgreSQL, SQLAlchemy 5개 테이블, Alembic, CRUD |
| 테스트 | Runner 17개, EventManager 12개, Workflow 12개 |

---

### Phase 1: Scaffolding (완료)

| 카테고리 | 완료 항목 |
|----------|----------|
| 프로젝트 구조 | 에이전트 8개, Skills 6개, Commands 5개 |
| 스키마 | JSON Schema 모델 7개, 워크플로우 골격 6개 |
| 백엔드 | FastAPI API 라우터 4개, Confluence MCP, pytest |

---

## 📊 전체 진행률

### PoC 완료 (Phase 1-4)

| Phase | 완료 | 미완료 | 완료율 |
|-------|------|--------|--------|
| Phase 1: Scaffolding | 9 | 0 | 100% |
| Phase 2: Core Integration | 19 | 0 | 100% |
| Phase 2.5: CI/CD | 11 | 0 | 100% |
| Phase 3: Advanced Features | 36 | 0 | 100% |
| Phase 4: UI & UX | 17 | 0 | 100% |
| **PoC 합계** | **92** | **0** | **100%** |

### Post-PoC (Phase 5-8)

| Phase | 완료 | 미완료 | 완료율 |
|-------|------|--------|--------|
| Phase 5: Evals 플랫폼 | 9 | 9 | 50% |
| Phase 6: Production Readiness | 0 | 7 | 0% |
| Phase 7: Scale & Expansion | 0 | 6 | 0% |
| Phase 8: Advanced AI | 0 | 5 | 0% |
| **Post-PoC 합계** | **9** | **27** | **25%** |

### 전체

| 범위 | 완료 | 미완료 | 완료율 |
|------|------|--------|--------|
| PoC (Phase 1-4) | 92 | 0 | **100%** |
| Post-PoC (Phase 5-8) | 9 | 27 | 25% |
| **전체** | **101** | **27** | **79%** |

---

## 📅 Post-PoC 로드맵

```
Week 7-8: 운영 전환
├── 실제 데이터 수집 시작 (Activity 20+/주)
├── 프로덕션 배포 환경 확정
├── BD팀 온보딩 및 교육
└── Confluence 실제 Space 연동

Week 9-12: Phase 6 - Production Readiness
├── 프로덕션 DB 설정 (Supabase/RDS)
├── 환경 분리 (dev/staging/prod)
├── 시크릿 관리 및 보안 점검
└── 로깅/모니터링 강화

Week 13-16: Phase 5.1 - Evals 신뢰성 강화
├── 인간 보정 워크플로 (SME 스팟체크)
├── pass@k / pass^k 리포트
├── 비용/지연/토큰 대시보드
└── Trial 격리 환경

Week 17+: Phase 7-8 - 확장
├── 모바일 앱 (PWA/React Native)
├── 다중 테넌트 지원
├── 외부 CRM 연동
└── AI 고도화 (RAG 최적화, 다국어)
```
