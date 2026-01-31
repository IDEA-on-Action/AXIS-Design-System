# 릴리스 노트 — axis-cli 기능 확장

> 릴리스 날짜: 2026-02-01

---

## 요약

axis-cli에 GitHub Project 동기화(`axis sync`) 및 프로젝트 상태 확인(`axis status`) 명령어를 추가하여 개발 워크플로우를 자동화합니다.

---

## 변경 내역

### ✨ 추가 (Added)

- `axis sync` 명령어: GitHub Issue와 project-todo.md 간 상태 동기화
- `axis sync --dry-run` 모드: 실제 변경 없이 동기화 결과 미리보기
- `axis status` 명령어: 프로젝트 진행 상황 요약 출력
- GitHub API 클라이언트 (`github-client.ts`): Octokit 기반 Issue 조회
- WI 매핑 파서 (`parser.ts`, `mapper.ts`): wi-mapping.json 기반 WI ↔ Issue 매핑
- 타입 정의 (`types.ts`): sync 관련 전체 타입 체계

---

## Breaking Changes

> 없음 (신규 기능 추가)

---

## 검증 방법 (How to Verify)

1. `pnpm install` 실행
2. `pnpm build` 로 전체 빌드 확인
3. `pnpm type-check` 타입 체크 통과 확인

---

## 알려진 이슈

- GitHub API Rate Limit 초과 시 동기화 실패 가능 (캐싱 미구현)
- 양방향 동기화는 미지원 (GitHub → 로컬 단방향)

---

## 롤백 가이드

문제 발생 시:

```bash
# 이전 버전으로 롤백
pnpm add @axis-ds/cli@<이전버전>
```

---

## 기여자

- @anthropic-claude (AI 협업)
