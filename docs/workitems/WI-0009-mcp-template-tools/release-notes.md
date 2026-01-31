# 릴리스 노트 — WI-0009 MCP 템플릿 Tools 구현

> 릴리스 날짜: 2026-02-01

---

## 요약

MCP 서버에 템플릿 관련 도구 5종을 추가하여 AI 에이전트가 템플릿 워크플로우를 활용할 수 있게 했습니다.

---

## 변경 내역

### ✨ 추가 (Added)

- **`axis.list_templates`** — 템플릿 목록 조회 (카테고리 필터 지원)
- **`axis.get_template`** — 템플릿 상세 정보 조회 (features, dependencies, files)
- **`axis.apply_template`** — 템플릿 적용 (dry-run, postInstall 패치 지원)
- **`axis.diff_template`** — 로컬 프로젝트와 원격 템플릿 파일 비교
- **`axis.check_project`** — 프로젝트 AXIS 설정 상태 검증 (axis.config.json, tailwind, globals.css, utils.ts, package.json)
- `tools/template.ts` 모듈: 핸들러 + 포매터
- `tools/index.ts`에 export 등록
- `index.ts`에 5개 tool 등록 (Zod 스키마 포함)

---

## Breaking Changes

> 없음 — 기존 MCP tool과 호환됩니다.

---

## 검증 방법 (How to Verify)

1. `pnpm install` 실행
2. `pnpm type-check` 타입 체크 통과 확인
3. `pnpm build` 빌드 통과 확인
4. Claude Code에서 `axis.list_templates` tool 호출 테스트

---

## 관련

- WI: WI-0009
- GitHub: #53
- PRD: [prd.md](./prd.md)
