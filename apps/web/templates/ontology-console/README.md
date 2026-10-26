# AXIS Ontology Console 템플릿

온톨로지 플랫폼 계열 업무 콘솔의 화면 문법(바탕 위 사이드바 240px + 흰 콘텐츠 카드 한 장, 높이 고정 · 카드 안 스크롤, 브레드크럼 없음)을 AXIS core 컴포넌트(`@axis-ds/ui-react`)와 `ontology` 브랜드로 조립한 Next.js 스타터예요. 화면 기준은 「온톨로지 플랫폼(가칭)」 프로토타입 v0.28 이고, 예시 데이터는 모두 가상이에요(WI-0027).

## 포함 화면

| 경로 | 화면 | 핵심 치수 · 규칙 |
|---|---|---|
| `/` | 통합 뷰: 인사 · 현황 카드 · 최근 변경 + 보조 상자(확인 필요) | 보조 상자 420px |
| `/entities` | 목록 페이지: 머리 · 검색 · 필터 칩 · 표 | 줄을 누르면 depth 상세(시트 아님) |
| `/entities/[id]` | depth 상세: 뒤로 · 이전 · 다음, 세그먼트 탭(개요 · 속성 · 기록) | 절 사이 40px |
| `/projects/[id]` | 프로젝트 상세 2분할 | 카드 안 왼쪽 열 300px + 1px 중립 선 |

공통 셸: 사이드바 240px(워크스페이스 · 대메뉴 하나만 펼침 · 라이트 · 다크 전환), 바탕 여백 위아래 16px · 오른쪽 18px, 카드 둥글기 12px · 그림자 없음, 1199px 이하에서 카드 안 분할 · 보조 상자 · 현황 카드가 1열로 바뀌어요.

## 설치

빈 디렉터리에 만드는 것을 기준으로 해요.

```bash
npx @axis-ds/cli template init ontology-console --dir my-console
cd my-console
npm install
npm run dev
npx @axis-ds/cli check      # axis.config.json · tailwind · globals.css · brand 항목 확인
npm run check:ontology      # 템플릿 디자인 규칙 검사
```

## ontology 브랜드

처음부터 켜져 있어요. 세 곳이 짝이에요.

1. `app/layout.tsx` 의 `<html data-brand="ontology">`: 서버 HTML 부터 브랜드 색으로 그려 첫 화면이 바뀌지 않아요.
2. `app/layout.tsx` 의 `<ThemeProvider defaultBrand="ontology">`(`@axis-ds/theme`): 런타임에 `setBrand` · `setTheme` 를 써요. 마크업이 `defaultBrand` 보다 앞서요(theme 1.7.0 이상).
3. `app/globals.css` 의 `@import "@axis-ds/tokens/css/brands/ontology";` 와 `axis.config.json` 의 `"brand": "ontology"`(`axis check` 의 brand 항목이 이 둘을 대조해요).

끄려면 `data-brand` 속성 · `defaultBrand` · 브랜드 import 줄 · config 의 `brand` 를 함께 지워요.

## 규칙 검사 (`npm run check:ontology`)

`scripts/check-ontology.mjs` 가 `app/` · `components/` · `lib/` 를 읽고 아래 다섯 가지를 봐요. 위반이 있으면 `파일:줄` 과 함께 종료 코드 1, 검사한 파일이 0개면 2 예요.

| 규칙 | 잡는 것 |
|---|---|
| em-dash | 긴 줄표(U+2014), 주석 포함 |
| exclamation | 느낌표가 든 한글 문구 |
| one-side-line | `border-l-4 border-primary` 처럼 한쪽 테두리에 색을 준 것(중립 `border-border` 선은 통과) |
| card-shadow | `<Card` · `bg-card` 와 `shadow-*` 조합, 선택자에 card 가 든 CSS `box-shadow` |
| palette | hex · `rgb()` · `hsl()` 리터럴, Tailwind 기본 팔레트 클래스(`text-red-500` · `text-white` 등) |

해요체 · 금지 표현 검사는 기준 목록이 정해지면 더해요. 이 검사는 `axis check` 와 따로 돌아요(연동은 후속 WI).

## 구조

```
├── app/
│   ├── layout.tsx              # data-brand · ThemeProvider · 셸
│   ├── globals.css             # AXIS 토큰 · ontology 브랜드 import
│   ├── page.tsx                # 통합 뷰
│   ├── entities/page.tsx       # 목록
│   ├── entities/[id]/page.tsx  # depth 상세
│   └── projects/[id]/page.tsx  # 프로젝트 상세 2분할
├── components/ontology/        # 셸 · 사이드바 · 카드 틀 · 머리 · 표 · 탭 · 타일 · 뱃지
├── lib/demo-data.ts            # 가상 예시 데이터(실제 앱에서는 API 호출로 바꿔요)
├── lib/utils.ts                # cn()
├── scripts/check-ontology.mjs  # 규칙 검사
├── axis.config.json            # brand: ontology
└── tailwind.config.ts          # AXIS preset + ui-react dist content + tailwindcss-animate
```

새 화면을 만들 때는 `components/ontology/page-frame.tsx` 의 `PageFrame` 으로 카드 한 장을 감싸고, 색은 토큰 클래스(`bg-card` · `text-muted-foreground` · `bg-accent` 등)만 써요. AXIS 에 없는 core 컴포넌트를 새로 만들기보다 `@axis-ds/ui-react` 컴포넌트를 조립해요.
