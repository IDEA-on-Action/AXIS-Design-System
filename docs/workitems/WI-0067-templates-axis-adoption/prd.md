# WI-0067: 템플릿 4종 AXIS 토큰 전환 PRD

> 작성일: 2026-10-25 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0067 | GitHub: #181 | 우선순위: P3 | 상태: Approved (2026-10-25 사용자 결정)
> 기준: `main` 17f2815 (linked 4패키지 1.7.0 · cli 1.6.1 · mcp 1.3.4 배포됨) | 분리 원천: WI-0037(템플릿 빌드, D-범위)
> 표기: **측정**(이번에 실행해 얻은 값) · **계산**(값에서 유도) · **추정**(실행하지 않음)

---

## 1. 개요

### 1.1 문제

- `apps/web/templates` 의 4종(theme-only · dashboard · landing-page · hr-dashboard)은 `@axis-ds` 참조가 0건이고 `globals.css` 에 자체 hsl 변수 39~53개를 정의했어요(측정, 배치 4 브리프). 그래서 WI-0029 대비 수정 같은 AXIS 변경이 템플릿에 들어가지 않았어요(전환 전 theme-only next build CSS 에 `--axis-*` 0건 · 옛 `--primary:240 5.9% 10%` 1건).
- cli 1.6.1 의 `axis check` 는 WI-0065 · WI-0070 부터 이 상태를 `tailwind.config`(preset 없음) · `globals.css`(자체 변수만) WARN 으로 알려 줘요. 4종 모두 두 항목 WARN 이었어요(측정, 발행본 cli 1.6.1 실경로).
- 템플릿에서 ontology 브랜드를 켜는 방법이 템플릿 · 가이드 어디에도 없었어요.

### 1.2 결정 (2026-10-25 사용자, 배치 4 브리프 권장안)

| # | 결정 | 내용 |
|---|---|---|
| D1 | (나) 토큰 + 브랜드 안내 | `@axis-ds/tokens/css` · `@axis-ds/tokens/css/shadcn` import 와 `presets: [axisPreset]`, 자체 변수 제거. `globals.css` 에 ontology 브랜드 import 를 주석 줄로 두고 README · features · 가이드에 켜는 법을 안내. ui-react 컴포넌트 교체는 하지 않음(WI-0027 FR-2 몫) |
| D2 | (가) AXIS 매핑 | hr-dashboard 의 chart-success · warning · alert 는 `--axis-status-success` · `warning` · `error`, chart-blue · zone 4색은 preset `chart-1~5`. glass 는 템플릿 로컬 클래스로 남기되 색의 원천은 AXIS 변수(`--card` · `--border` · `--radius`). fade-in-up · stagger 는 WI-0071 정책(진입 · 장식 전환은 정지)에 맞춰 움직임 줄이기에서 멈춤 |
| D3 | (나) Inter 제거 + Pretendard | `next/font/google` Inter 를 지우고 `pretendard@^1.3.9`(AXIS 문서 사이트와 같은 버전 범위)를 템플릿 의존성에 넣어 `layout.tsx` 에서 동적 서브셋 CSS 를 import. 글꼴 스택은 preset 이 `<html>` 에 적용(사용자 확인 완료) |
| D4 | (다) 동결 fixture + 기준선 | cli 테스트가 읽던 `public/templates/theme-only.json` 을 전환 전 사본(`packages/axis-cli/test/fixtures/theme/templates/theme-only-pre-wi0067.json`)으로 동결하고, 전환 후 템플릿용 check 기준선 1개를 추가 |
| D5 | (가) 수동 기재 + 일치 검사 | `@axis-ds/tokens ^1.7.0` 을 `template.json` 과 `files/package.json` 양쪽에 적고, `build-template-index.mjs` 가 두 곳의 dependencies · devDependencies 가 다르면 빌드 실패 |
| D6 | (가) 생성 결과 커밋 | `build:templates` 결과 중 내용이 바뀐 상세 JSON 4개와 index.json(템플릿 메타가 들어 있어 내용도 바뀜)을 커밋 |

### 1.3 범위 밖

- ui-react 컴포넌트 교체, ThemeProvider · 기본 브랜드 내장, `template.json` checks 필드(WI-0027 FR-1 · FR-2 · FR-4 몫)
- 외부 블록 38개(`apps/web/data/*.json`), 생성기 `updatedAt` 결정화(D6 (나), 필요하면 별도 WI)
- npm 릴리스 · changeset: cli · mcp 소스 변경이 없고 템플릿은 런타임에 pages.dev 에서 받으므로 Pages 배포만으로 반영돼요(review 확인: templates 는 cli · mcp dist 에 동봉되지 않음)
- hr-dashboard 트리맵의 스킬 10색(`lib/demo-data.ts` 의 범주 색 데이터)은 AXIS chart 색이 5개뿐이라 그대로 둬요(로컬 예외)

## 2. 요구사항

- FR-1 템플릿 4종 `globals.css` 는 tokens CSS 2줄을 `@tailwind` 앞에 두고 자체 `:root` · `.dark` 색 변수를 정의하지 않는다. 브랜드 import 는 주석 줄
- FR-2 `tailwind.config.ts` 는 `presets: [axisPreset]`(import 형태). hr-dashboard 로컬 확장은 `status` · `status-soft`(AXIS 상태 변수 참조) · `fade-in-up` 만
- FR-3 하드코딩 팔레트 색(`text-green-600` 등)을 AXIS 상태 변수로(dashboard stats-card: 라이트 `-strong` · 다크 기본, 원래 600 · 400 단계와 같은 쓰임)
- FR-4 `layout.tsx` 는 Inter 대신 Pretendard 동적 서브셋 CSS 를 import 하고 body 에 글꼴 클래스를 두지 않는다
- FR-5 의존성 `@axis-ds/tokens ^1.7.0` · `pretendard ^1.3.9` 를 두 곳에 같게, 생성기가 불일치를 막는다
- FR-6 template.json `description` · `features` · `version`(0.1.0 → 0.2.0)과 theme-only README 의 「AXIS 토큰 미사용」 서술 정정, 브랜드 켜는 법 안내
- FR-7 `template-smoke` 판정에 `--axis-*` 정의 1건 이상 · 전환 전 `--primary`(240 5.9% 10%) 0건 추가
- FR-8 가이드 `theme-customization.md` · `quick-start.md` 에 「템플릿에서 ontology 켜기」(init · 설치 · 주석 해제 · data-brand 또는 defaultBrand · 끄기 · check 확인)

## 3. 수용 기준 (AC)

- AC1 발행본 cli 1.6.1 로 빈 디렉터리에 `axis template init <slug>`(이 브랜치 생성 JSON, `AXIS_TEMPLATE_URL` 주입 전제) → `pnpm install` → `axis check` 4종 모두 `tailwind.config` · `globals.css` PASS, fail 0 (전환 전 4/4 WARN 이 음성 대조)
- AC2 4종 next build CSS 에 `@tailwind` 0 · `--axis-*` 정의 1건 이상 · 옛 `--primary` 0. template-smoke 가 이를 판정하고, 고치기 전 JSON 으로 FAIL
- AC3 템플릿 소스 4종에 자체 `:root` · `.dark` 색 변수 정의 0, 하드코딩 팔레트 클래스 0 (로컬 예외: hr-dashboard `.glass-panel` 클래스 · 트리맵 범주 색 데이터)
- AC4 `template.json` 과 `files/package.json` 의존성 4종 일치, 생성기가 불일치를 rc 1 로 막음(음성 대조)
- AC5 description · features · README 에 「AXIS 토큰 미사용」 류 서술 0, 브랜드 켜는 법 안내 1곳 이상
- AC6 라이트 · 다크 x 기본 · ontology 에서 배경 · 글자 · 테두리 계산값과 `--primary` 가 **설치된 tokens 버전의 값**과 같음(Chromium 실측, theme-only · hr-dashboard). ontology 를 끄면 기본값으로 돌아옴
- AC7 body 계산 `font-family` 가 설치된 tokens 의 `--axis-font-family-sans` 스택이고 Pretendard Variable 이 로드됨
- AC8 cli · mcp 테스트 통과, 동결 fixture 로 기존 테스트가 같은 의미로 통과(동결을 빼면 실패하는 A/B), 전환 후 기준선 1개 추가. turbo lint · type-check · build · test 통과
- AC9 배포 뒤 pages.dev 의 `templates/<slug>.json` 4개가 커밋본과 `updatedAt` 외 동일 (머지 · 배포 후 측정)

## 4. 위험

- 이미 템플릿을 받은 사용자는 자동으로 바뀌지 않아요(파일 복사). `axis template diff <slug>` 로 차이를 볼 수 있어요(release-notes 안내)
- tokens 를 `^1.7.0` 범위로 받으므로 이후 tokens 색 변경(배치 4 ② 대비 묶음 등)이 다음 설치부터 템플릿에 들어가요. AC6 은 버전에 묶지 않고 설치본 값과 대조해요
- hr-dashboard 상태 색을 AXIS 로 바꾸면 차트 · 글자 대비가 달라질 수 있어요. 템플릿용 axe 게이트는 아직 없어요(WI-0027 AC5 예정)
- `axis check` 의 TOKENS_CSS_IMPORT 판정은 shadcn 한 줄만 import 해도 PASS 를 줄 수 있어요(브리프 risks, 범위 밖). 템플릿은 두 줄을 모두 넣어요
- WI-0027 PRD FR-2 의 「기존 템플릿 4개는 @axis-ds 에 의존하지 않고」 문구는 이 WI 머지 뒤 낡은 전제가 돼요(배치 5 착수 전 갱신)
