# WI-0040: library 수집 데이터의 `npx axis-cli` 실행 안내 정리 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0040 | GitHub: #127 | 우선순위: P2 | 상태: Approved (2026-10-24 사용자 결정 반영)
> 기준: `main` bd54e91 (linked 4패키지 1.6.0 · `@axis-ds/cli` 1.5.4 · `@axis-ds/mcp` 1.3.2)
> 관련: WI-0038(#124, D2 실행 안내 금지 테스트), WI-0057(#155, 006836a 에서 해당 데이터 삭제)

---

## 1. 개요

### 1.1 배경
- 문서 사이트가 그대로 내보내는 library 수집 데이터(`apps/web/public/library/**`)에 `npx axis-cli add ...` 실행 안내가 있었습니다. `axis-cli` 는 2026-01-15 npm 에서 unpublish 된 타인 이름이라 누구나 다시 등록할 수 있습니다(typosquat).
- WI-0038 은 CLI 출력 · 소스 · 문서 사이트 소스 · 가이드의 같은 안내를 `npx @axis-ds/cli` 로 고쳤지만, 이 데이터는 수집기가 만든 것이라 범위에서 뺐고(2026-10-19 사용자 결정) 이 WI 로 분리했습니다.

### 1.2 현재 상태 (2026-10-24 실측)
- **이미 해소**: 커밋 006836a~1 에는 `npx axis-cli` 가 8개 파일 14곳(`categories/agentic.json` 7 · `components/*.json` 7)에 있었고, 모두 컴포넌트 데모 페이지 소스를 통째로 담은 문자열 안의 `<CodeBlock code=\"npx axis-cli add <slug>\" ...>` 형태였습니다. WI-0057(006836a, #162)이 수집기의 데모 페이지 스캔을 없애고 AXIS 항목을 다시 만들면서 이 조각이 모두 사라졌습니다(`git grep -c "npx axis-cli" 006836a -- apps/web/public/library` rc 1, 같은 명령으로 006836a~1 은 8개 파일).
- **남은 공백**: `packages/axis-cli/src/guidance.test.ts` 는 library 데이터를 「손으로 고치지 않는 수집 데이터」로 보고 검사 범위에서 뺐습니다. 수집기가 데모 페이지 스캔을 다시 하거나 외부 소스가 같은 문자열을 담으면 다시 들어와도 아무 검사도 실패하지 않습니다.

### 1.3 범위
- 포함: `guidance.test.ts` 의 검사 범위에 `apps/web/public/library` 추가(JSON 을 파싱해 문자열의 `\n` 등 이스케이프를 풀고 줄 단위 검사), 006836a~1 원문 조각 양성 대조 fixture, cli test 태스크의 turbo inputs 에 library 경로 추가
- 제외: library 데이터 자체 수정(이미 0건), 수집기 수정, 배포(changeset 없음, 테스트 · 문서만 바뀜)

## 2. 요구사항

- FR-1: `guidance.test.ts` 가 `apps/web/public/library/**/*.json` 을 모두 읽고, JSON 을 파싱해 모든 문자열(키 포함)의 이스케이프를 푼 뒤 줄로 나눠 기존 `isGuidanceViolation` 으로 검사합니다. 파싱에 실패하면 테스트가 실패합니다(미측정이 0건으로 보이지 않게).
- FR-2: 006836a~1 의 `components/step-indicator.json` `$.code.files[0].content` 에서 Installation 절을 그대로 옮긴 fixture 를 `packages/axis-cli/test/fixtures/guidance/` 에 두고, 그 조각이 위반으로 걸리는지 테스트로 고정합니다.
- FR-3: 계측 대조로 library 파일이 100개 넘게 스캔되고 실재 파일(`components/step-timeline.json` · `categories/agentic.json`)이 들어 있는지 봅니다.
- FR-4: cli `test` 태스크 turbo inputs 에 `apps/web/public/library/**` 를 더해 데이터가 바뀌면 캐시가 무효화되게 합니다.

## 3. 수용 기준 (Acceptance Criteria)

- AC1: 현재 library 데이터에서 위반 0건이고, 그 0건이 측정의 결과임을 계측 대조(스캔 파일 수 · 실재 파일 포함)로 보입니다.
- AC2: 006836a~1 의 library 데이터를 작업 트리에 되살리면 테스트가 실패하고, 14곳이 모두 위반으로 나옵니다.
- AC3: 양성 대조 fixture 가 위반으로 걸리고, 같은 조각을 `npx @axis-ds/cli` 로 바꾸면 걸리지 않습니다(음성 대조).
- AC4: `pnpm --filter @axis-ds/cli test` rc 0.

## 4. 결정 기록

| 날짜 | 결정 | 근거 |
|---|---|---|
| 2026-10-19 | 수집 데이터라 WI-0038 범위에서 빼고 별도 WI 로 등록 | 직접 치환하면 다음 수집 때 다시 덮어써질 수 있음 |
| 2026-10-24 | 회귀 방지(검사 범위 추가 + 양성 대조 픽스처)를 더한 뒤 종결 | 데이터는 WI-0057(006836a)에서 이미 0건. 다시 들어오는 경로를 테스트로 막음 |
