# AXIS Design System 기여 가이드

AXIS Design System에 기여해 주셔서 감사합니다. 이 문서는 기여 절차와 규칙을 설명합니다.

## 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- pnpm 9.15.4+

### 설치

```bash
git clone https://github.com/IDEA-on-Action/AXIS-Design-System.git
cd AXIS-Design-System
pnpm install
```

### 개발 서버 실행

```bash
pnpm dev:web
```

## 외부 DS 연합 기여

AXIS는 외부 디자인 시스템의 리소스를 link-only 방식으로 연합합니다. 새로운 외부 DS를 추가하려면 다음 절차를 따르세요.

### 새 외부 DS 추가 방법

1. `apps/web/data/` 디렉토리에 JSON 파일을 생성합니다 (예: `my-ds-resources.json`).
2. 아래 스키마를 따라 리소스 항목을 작성합니다:

```json
[
  {
    "name": "리소스 이름",
    "slug": "소스-리소스id",
    "description": "리소스 설명",
    "category": "minimal|landing-page|dashboard|app|agentic",
    "version": "0.0.0",
    "author": "소스명",
    "tags": ["tag1", "tag2"],
    "features": ["Feature 1", "Feature 2"],
    "dependencies": {},
    "devDependencies": {},
    "type": "external",
    "externalUrl": "https://example.com/resource",
    "source": "소스명"
  }
]
```

3. 빌드 스크립트가 `data/` 폴더의 모든 JSON을 자동으로 인식합니다.
4. `pnpm build:registry` 실행 후 `pnpm dev:web`에서 갤러리를 확인합니다.

### 링크 검증 체크리스트

- [ ] 모든 `externalUrl`이 유효한 HTTPS URL인지 확인
- [ ] 각 URL이 404를 반환하지 않는지 확인
- [ ] `slug`가 기존 항목과 중복되지 않는지 확인
- [ ] `category`가 정의된 카테고리 중 하나인지 확인

## 라이선스 호환성 가이드라인

AXIS Design System은 MIT 라이선스입니다. 외부 DS 통합 시 라이선스 호환성을 반드시 확인하세요.

### 호환 라이선스

| 라이선스 | 호환 여부 |
|---------|----------|
| MIT | 호환 |
| Apache 2.0 | 호환 |
| BSD-2-Clause / BSD-3-Clause | 호환 |
| ISC | 호환 |
| CC0-1.0 / Unlicense | 호환 |

### 비호환 라이선스 (주의)

| 라이선스 | 상태 |
|---------|------|
| GPL-2.0 / GPL-3.0 | 경고 — 코드 포함 시 비호환 |
| AGPL-3.0 | 차단 — 통합 불가 |
| SSPL-1.0 | 차단 — 통합 불가 |

`pnpm check-licenses` 명령으로 자동 검증할 수 있습니다.

## PR 규칙

### 커밋 메시지 형식

```
<type>(<scope>): <subject>
```

- **type**: feat, fix, docs, refactor, test, chore
- **scope**: 패키지명 또는 영역 (web, tokens, ui-react 등)

### 코드 컨벤션

- `.claude/rules/10-code-conventions.md` 참조
- TypeScript strict mode 준수
- Tailwind CSS 유틸리티 클래스 사용

### 품질 게이트

PR 머지 전 다음을 통과해야 합니다:

```bash
pnpm type-check
pnpm lint
pnpm build
pnpm check-licenses
```
