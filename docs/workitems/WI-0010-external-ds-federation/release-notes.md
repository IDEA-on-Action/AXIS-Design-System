# Release Notes — WI-0010: 외부 DS 연합형 확장

> 완료일: 2026-02-01 | WI: WI-0010 | GitHub: #54

---

## 요약

AXIS Design System에 외부 디자인 시스템(shadcn, monet)을 링크 기반으로 연합 연동하고, 커뮤니티 기여 체계 및 라이선스 자동 검증 파이프라인을 구축했습니다.

---

## 변경사항

### AC1: shadcn 블록 연동

- `apps/web/data/shadcn-blocks.json` — shadcn 블록 27개 카탈로그 매핑
- Templates 갤러리 페이지에서 소스 필터(`shadcn`) 및 외부 링크 카드 지원
- 빌드 스크립트(`build-template-index.mjs`)에서 외부 블록 자동 병합

### AC2: monet 리소스 링크 연동

- `apps/web/data/monet-resources.json` — monet 리소스 8개 카탈로그 매핑 (아이콘, 컬러, 타이포 등)
- Templates 갤러리 페이지에서 소스 필터(`monet`) 지원
- 빌드 스크립트에서 monet 데이터 자동 병합

### AC3: 기여 가이드 문서

- `CONTRIBUTING.md` — 외부 DS 연합 기여 절차 문서
- `.github/pull_request_template.md` — PR 체크리스트 템플릿
- `.github/ISSUE_TEMPLATE/external-ds-request.yml` — 외부 DS 요청 이슈 템플릿
- `apps/web/src/app/contribute/page.tsx` — 기여 가이드 페이지 UI

### AC4: 라이선스 검증 자동화

- `scripts/check-licenses.mjs` — 라이선스 호환성 검증 스크립트
  - MIT 호환성 매트릭스 기반 자동 검증
  - `block` 레벨 감지 시 exit code 1 (CI 실패)
  - `warn` 레벨은 경고 로그만 출력
- `package.json` — `pnpm check-licenses` 스크립트 등록
- `.github/workflows/frontend.yml` — CI 파이프라인에 라이선스 게이트 단계 추가

---

## 영향 범위

| 패키지/앱 | 영향 |
|-----------|------|
| `apps/web` | Templates 갤러리, Contribute 페이지 추가 |
| `scripts/` | 라이선스 검증 스크립트 추가 |
| `.github/` | CI 워크플로우, PR/이슈 템플릿 추가 |
| 루트 | CONTRIBUTING.md, package.json 스크립트 추가 |

---

## 검증 결과

- `pnpm check-licenses` — 통과 (35개 블록, 2개 소스 MIT 호환)
- `pnpm type-check` — 통과
- `pnpm lint` — 통과
- `pnpm build` — (캐시 기반 통과)
