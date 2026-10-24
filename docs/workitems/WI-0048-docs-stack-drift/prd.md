# WI-0048: 문서 기술 스택 표기 드리프트 · 문서 라우트 점검 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0048 | GitHub: #139 | 우선순위: P3 | 상태: Approved (2026-10-24 사용자 결정 반영)
> 기준: `main` bd54e91 (linked 4패키지 1.6.0 · `@axis-ds/cli` 1.5.4 · `@axis-ds/mcp` 1.3.2)
> 출처: WI-0044(#134) 실측 워크플로(2026-10-20)에서 발견한 기존 결함

---

## 1. 개요

### 1.1 배경 (2026-10-24 실측)
- 저장소 스택을 「Tailwind CSS 4」로 적은 곳이 3곳 있습니다: 루트 `README.md` 74행 기술 스택 표, `docs/guides/monorepo-setup.md` 29행, `.claude/prompts/README.md` 50행(프롬프트 컨텍스트 예시).
- 실제 개발 · 문서 사이트는 Tailwind 3 입니다(`apps/web/package.json` `"tailwindcss": "^3.4.17"`). 소비 프로젝트는 1.4.0 부터 Tailwind 3 · 4 를 모두 지원합니다(`docs/guides/quick-start.md` 9행 「Tailwind 4 연동은 `@axis-ds/tokens` · `@axis-ds/ui-react` · `@axis-ds/agentic-ui` 1.4.0 부터」). 「4」 한 숫자로는 어느 쪽 이야기인지 갈리지 않습니다.
- 문서 라우트: `docs/guides/quick-start.md` 208행 `[컴포넌트 문서](/docs/components)` 는 문서 사이트에 없는 경로입니다. 라우트는 `apps/web/src/app/(docs)/components/page.tsx` 라 `/components` 이고, `https://axis-design-system.pages.dev/docs/components` 는 404, `/components/` 는 200 입니다. 또 GitHub · npm 에서 읽는 마크다운에서 `/...` 상대 경로는 사이트가 아니라 저장소 · 패키지 페이지 기준으로 풀립니다.

### 1.2 범위
- 포함: 위 3곳 Tailwind 표기를 두 축 표기로, quick-start 208행 링크를 절대 URL 로. 루트 README · `docs/guides` · `.claude/prompts` 의 Tailwind 표기와 마크다운 링크 전수 점검
- 제외: `CLAUDE.md`(이 WI 에서 고치지 않음, 이미 3.4 로 맞음), `docs/guides/theme-customization.md`(별도 WI), 소비자 대상 Tailwind 4 설명(quick-start · troubleshooting · component-usage 의 「Tailwind CSS 4」 절은 소비 프로젝트 설정 안내라 드리프트가 아님), 배포(changeset 없음)

## 2. 요구사항

- FR-1: 저장소 스택 표기를 「개발 · 문서 사이트 Tailwind CSS 3.4, 소비 프로젝트는 Tailwind 3 · 4 모두 지원(1.4.0+)」 형태의 두 축으로 적습니다.
- FR-2: quick-start 208행 링크를 `https://axis-design-system.pages.dev/components/` 절대 URL 로 바꿉니다.
- FR-3: 대상 문서의 마크다운 링크를 전수 점검해(상대 파일 존재 · 사이트 경로 라우트 대조 · 사이트 URL HTTP 상태) 깨진 링크 0건을 확인합니다.

## 3. 수용 기준 (Acceptance Criteria)

- AC1: 대상 3곳에 단일 「Tailwind CSS 4」 저장소 스택 표기가 남지 않습니다.
- AC2: quick-start 208행 링크가 200 을 돌려줍니다.
- AC3: 대상 문서 전수 링크 점검 깨진 링크 0건, 점검이 실제로 링크를 셌다는 대조군(`](` 개수)과 같은 수.

## 4. 결정 기록

| 날짜 | 결정 | 근거 |
|---|---|---|
| 2026-10-20 | WI-0044 에서 별도 WI 로 분리 | 기존 결함, WI-0044 범위 밖 |
| 2026-10-24 | 두 축 표기(개발 · 문서 사이트 3.4 / 소비자 3 · 4 지원 1.4.0+) + quick-start:208 을 pages.dev 절대 URL 로 | 「4」 하나로는 개발 스택과 소비자 지원 범위가 갈리지 않음. 마크다운은 GitHub · npm 에서도 읽힘 |
| 2026-10-24 | theme-customization.md 는 이 묶음에서 고치지 않음 | 별도 WI 로 다룸 |
