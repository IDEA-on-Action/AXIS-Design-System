# WI-0008: CLI Template 명령어 구현 - TODO

> PRD: [prd.md](./prd.md)

## AC1: 템플릿 명령어 5종

- [x] `axis template list` — 카테고리별 그룹화 출력, `--category` 필터
- [x] `axis template info <name>` — 이름, 설명, features, 파일 목록, 의존성 출력
- [x] `axis template apply <name>` — 충돌 탐지, prompts 확인, 파일 쓰기, postInstall, 의존성 안내
  - [x] `-y/--yes`, `--dry-run`, `--skip-deps`, `-d/--dir` 옵션
- [x] `axis template init [name]` — 템플릿 선택 → mkdir → apply → axis.config.json 생성
  - [x] `-d/--dir` 옵션
- [x] `axis template diff <name>` — 로컬 vs 원본 비교 (added/modified/unchanged/extra)
  - [x] `--verbose` 옵션

## AC2: 샘플 템플릿 3종

- [x] theme-only (기존 유지)
- [x] landing-page — Hero 섹션, 기능 카드 그리드, CTA 버튼
- [x] dashboard — 사이드바 네비게이션, 통계 카드

## AC3: axis check 명령어

- [x] `axis check` — 독립 명령어
- [x] axis.config.json 존재 검증
- [x] tailwind.config 검증 (토큰 포함 여부)
- [x] globals.css 검증 (CSS 변수 존재 여부)
- [x] utils.ts 검증 (cn 함수 존재 여부)
- [x] package.json 의존성 검증
- [x] pass/warn/fail 결과 출력

## AC4: postInstall 패치 시스템

- [x] template.json의 `postInstall` 배열 지원
- [x] replace, append, prepend, json-merge 타입 구현
- [x] apply 완료 후 자동 실행
- [x] dry-run 시 미리보기

## 품질 게이트

- [x] `pnpm type-check` 통과
- [x] `pnpm lint` 통과
- [x] `pnpm build` 통과 (axis-cli 포함)
- [x] `build-template-index.mjs` 후 3개 템플릿 확인
