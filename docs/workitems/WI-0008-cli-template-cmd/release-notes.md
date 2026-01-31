# 릴리스 노트 — WI-0008 CLI Template 명령어 구현

> 릴리스 날짜: 2026-02-01

---

## 요약

`axis template` 하위 명령어 5종과 `axis check` 검증 명령어를 구현하고, postInstall 패치 시스템 및 샘플 템플릿 3종을 추가했습니다.

---

## 변경 내역

### ✨ 추가 (Added)

- `axis template list` — 사용 가능한 템플릿 목록 조회
- `axis template info <name>` — 템플릿 상세 정보 조회
- `axis template apply <name>` — 프로젝트에 템플릿 적용 (충돌 감지, dry-run 지원)
- `axis template init [name]` — 새 프로젝트 초기화 (인터랙티브 선택)
- `axis template diff <name>` — 로컬 프로젝트와 템플릿 비교
- `axis check` — 프로젝트 설정 검증 (axis.config.json, tailwind, globals.css, utils.ts, package.json)
- postInstall 패치 시스템 (replace, append, prepend, json-merge)
- 샘플 템플릿 3종: theme-only, landing, dashboard

---

## Breaking Changes

> 없음 — 신규 명령어 추가입니다.

---

## 검증 방법 (How to Verify)

1. `pnpm install` 실행
2. `pnpm build` 빌드 통과 확인
3. `npx axis template list` 명령어 실행
4. `npx axis check` 프로젝트 검증 실행

---

## 관련

- WI: WI-0008
- GitHub: #52
- PRD: [prd.md](./prd.md)
