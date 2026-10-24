# WI-0048 릴리스 노트: 문서 기술 스택 표기 · 문서 라우트 정리

> 작성일: 2026-10-24 | WI: WI-0048 | GitHub: #139 | changeset: 없음(문서만 바뀜, 배포 없음)

## 변경 사항

- **Tailwind 표기**: 저장소 스택을 「Tailwind CSS 4」로 적던 3곳을 「개발 · 문서 사이트 Tailwind CSS 3.4, 소비 프로젝트는 Tailwind 3 · 4 모두 지원(1.4.0+)」 두 축으로 고쳤습니다.
  - `README.md` 기술 스택 표
  - `docs/guides/monorepo-setup.md` 기술 스택
  - `.claude/prompts/README.md` 프로젝트 컨텍스트 예시
- **문서 링크**: `docs/guides/quick-start.md` 「다음 단계」의 컴포넌트 문서 링크가 없는 경로(`/docs/components`, 사이트 404)를 가리키던 것을 `https://axis-design-system.pages.dev/components/`(200)로 바꿨습니다.

## 검증

- 루트 README · `docs/guides` · `.claude/prompts` 13개 파일 링크 6개 전수 점검, 깨진 링크 0건. 상세는 [testplan.md](./testplan.md).

## 범위 밖

- `CLAUDE.md`(이미 3.4), `docs/guides/theme-customization.md`(별도 WI).
