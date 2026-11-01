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
npx @axis-ds/cli check      # axis.config.json · tailwind · globals.css · brand · 템플릿 규칙 항목 확인
npm run check:ontology      # 템플릿 디자인 규칙 검사(위반 목록 전체)
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
| one-side-line | `border-l-4 border-primary` 처럼 한쪽 테두리에 색을 준 것(중립 `border-border` 선은 통과), CSS `border-left` · style `borderLeft` 등에 색을 준 것 |
| card-shadow | `<Card` · `bg-card` · 카드 모양(`rounded-*` 와 `border` 를 함께 쓴 상자) 과 `shadow-*` 조합, `<Card style` 의 `boxShadow`, 선택자에 card 가 든 CSS `box-shadow` |
| palette | hex · `rgb()` · `hsl()` 리터럴, CSS 이름 색(`red` · `white` 등), Tailwind 기본 팔레트 클래스(`text-red-500` · `text-white` 등) |

클래스 조합은 문자열 하나만 보지 않고 `className={...}` 표현식과 `cn()` · `clsx()` · `cva()` · `twMerge()` 인자 안의 문자열을 모두 합쳐 봐요. 그래서 `cn('border-l-4', active && 'border-primary')` 처럼 나눠 써도 잡혀요.

검사의 한계(소스를 정적으로 읽기 때문이에요):

- 변수 · 상수에 담아 넘긴 클래스, 런타임에 조립한 문자열, 다른 파일에서 가져온 클래스 묶음은 보지 않아요.
- 카드는 `<Card` · `bg-card` · `rounded-*` + `border` 조합으로 알아봐요. 테두리 없이 바탕색만 다른 상자에 그림자를 주면 잡지 못해요.
- `href="#add"` 같은 앵커와 URL 조각(`/entities#abc`)은 색으로 보지 않아요. 그 밖의 `#` + 16진 글자 3 ~ 8자는 리터럴 색으로 봐요.

읽는 범위: 심볼릭 링크는 실경로가 프로젝트 안일 때만 따라가요(같은 실경로는 한 번, 디렉터리 깊이 32 단계까지). 256KB 를 넘거나 한 줄이 4,096자를 넘는 파일은 생성 · 압축 파일로 보고 건너뛰며 건수를 알려 줘요. 8,000자를 넘는 클래스 묶음은 보지 않아요.

해요체 · 금지 표현 검사는 기준 목록이 정해지면 더해요.

### `axis check` 와의 관계

`npx @axis-ds/cli check`(cli 1.8.0 이상)와 MCP `axis.check_project`(mcp 1.5.0 이상)도 `axis.config.json` 의 `"template": "ontology-console"` 을 보고 같은 다섯 규칙을 `template.ontology-rules` 항목으로 검사해요.

- `axis check` 는 이 스크립트를 실행하지 않아요. 같은 판정을 axis 에 내장해 두었고, AXIS 저장소의 패리티 테스트가 두 구현이 같은 입력에 같은 위반 목록(파일 · 줄 · 규칙)을 내는지 확인해요.
- 위반이 있으면 `axis check` 는 WARN 으로 건수와 첫 위치만 알려 주고 종료 코드는 0 이에요. 위반 목록 전체는 `npm run check:ontology` 로 봐요.
- 이 스크립트를 고치거나(허용 색 추가 등) 지우면 `axis check` 결과와 달라질 수 있어요. `axis check` 는 설치한 cli 버전의 규칙을 따라요.

## 지원 화면 폭

데스크톱 업무 콘솔 기준이에요. 1200px 이상에서 프로토타입 v0.28 치수를 따르고, 1199px 이하에서는 카드 안 분할 · 보조 상자 · 현황 카드가 1열로 바뀌어요. 사이드바는 240px 로 남기 때문에 폰 폭(예: 390px)에서는 카드가 좁아지고 표가 잘려요. 모바일 레이아웃(사이드바 접기 · 표 가로 스크롤)은 이 템플릿 범위 밖이에요.

프로토타입과 다른 점: v0.28 의 보조 상자는 기본으로 닫혀 있다가 「확인 필요」 버튼으로 열리지만, 이 템플릿은 PRD 결정(통합 뷰 보조 상자 420px)에 따라 항상 열어 두고, 1199px 이하에서는 카드 아래로 내려요.

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
