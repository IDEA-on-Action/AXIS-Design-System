# WI-0054: Avatar 하이드레이션 전 이미지 오류 fallback 전환 PRD

> 작성일: 2026-10-24 | 버전: v1.0 | 작성자: Sinclair Seo | WI: WI-0054 | GitHub: #148 | 우선순위: P3 | 상태: Approved (2026-10-24 결정 반영)
> 기준: `main` bd54e91 (linked 4패키지 1.6.0, `packages/axis-ui-react/src/avatar/avatar.tsx` sha256 `b6da3332…cbe48d`)
> 관련: WI-0050(#143) 구현 검증(2026-10-20)에서 발견

---

## 1. 개요

### 1.1 문제 (실측, 2026-10-24)

`Avatar` 는 `<img onError>` 로만 실패를 알아요. 서버가 렌더한 `<img>` 는 HTML 이 도착하자마자 브라우저가 불러오기 시작하는데, 그 이미지의 로드 오류가 **하이드레이션 전에 끝나면** React 가 아직 `onError` 를 붙이지 않은 때라 이벤트를 놓쳐요. 그러면 깨진 이미지 아이콘이 계속 보이고 이니셜 fallback 으로 바뀌지 않아요.

재현 fixture(스크래치, 커밋 안 함): `react-dom/server` `renderToString` 으로 Avatar 를 SSR 한 HTML 을 내보내고, 페이지 `load` 이벤트(모든 이미지가 load · error 로 끝난 뒤) 다음에 `hydrateRoot` 번들을 붙여 「오류가 하이드레이션 전에 끝난」 상태를 결정적으로 만들었어요. React 19.2.3, Playwright 1.61.1.

| 사례 | 수정 전 (chromium 149 · firefox 151 · webkit 26.5 모두 같음) |
|---|---|
| 깨진 src(`/broken.png`, 404) | 하이드레이션 뒤에도 `img` 그대로. fallback `BU` 안 나옴 |
| 정상 PNG · SVG 3종 | `img` (정상) |
| 하이드레이션 뒤 ok → 깨진 src → 다시 ok (부수 결함) | 깨진 src 에서 fallback `SU` 로 바뀐 뒤 ok 로 바꿔도 계속 fallback |

### 1.2 원인

| # | 위치(수정 전 줄) | 원인 | 증상 |
|---|---|---|---|
| C1 | `avatar.tsx:51` | 실패 판정이 `onError` 하나뿐이에요. 하이드레이션 전에 이미 발생한 error 이벤트는 다시 오지 않아요 | SSR 이미지가 먼저 실패하면 fallback 미전환 |
| C2 | `avatar.tsx:27 · 46` | `hasError` 가 boolean 이고 src 가 바뀌어도 초기화하지 않아요. 한 번 실패하면 `src && !hasError` 가 계속 거짓이라 새 src 의 `<img>` 를 다시 그리지 않아요 | src 를 바꿔도 fallback 고정 |

## 2. 결정 (2026-10-24 사용자)

| # | 결정 |
|---|---|
| D1 | 마운트 시 img ref 로 `complete && naturalWidth === 0` 이면 실패로 판정해요. 고유 크기가 없는 SVG 처럼 정상인데 naturalWidth 가 0 일 수 있는 이미지는 오판하지 않도록 예외 처리해요(방법은 3절) |
| D2 | 같은 파일 부수 결함 C2(src 가 바뀌어도 오류 상태가 초기화되지 않음)도 이 WI 에서 고쳐요 |
| D3 | jsdom 단위 테스트 + Playwright SSR 하이드레이션 실측 1회(수정 전 실패 · 수정 후 통과 둘 다)로 검증하고, 판정을 끈 변이로 테스트가 실패하는지 확인해요 |
| D4 | changeset 은 `@axis-ds/ui-react` patch 1개예요 |
| D5 | 레지스트리 · library 재생성은 WI-0052 선례대로 그 항목(과 sha256)만 반영하고 version 필드는 그대로 둬요 |

## 3. SVG 예외 처리 방법과 근거

### 3.1 방법

`complete && naturalWidth === 0` 은 **실패 후보**로만 보고, `img.decode()` 가 거부될 때만 실패로 확정해요.

```
마운트 · src 변경 시(useEffect, [src])
  img 없음 · src 없음            → 판정 안 함
  complete 거짓(아직 로딩 중)     → 판정 안 함. 이후 오류는 붙어 있는 onError 가 받음
  naturalWidth > 0               → 정상 로드
  decode 함수 없음               → 판정 안 함(종전 동작)
  decode() 거부                  → 실패 확정, fallback
  decode() 이행                  → 정상(고유 크기 없는 이미지)
```

### 3.2 근거 (실측, 3개 엔진)

같은 fixture 에서 하이드레이션 전 `load` 시점에 각 이미지의 상태를 찍었어요.

| 이미지 | chromium 149 | firefox 151 | webkit 26.5 |
|---|---|---|---|
| 깨진 PNG(404) | complete · nw 0 · decode 거부(EncodingError) | 같음 | 같음 |
| 1×1 PNG | nw 1 · decode 이행 | 같음 | 같음 |
| SVG viewBox 만(크기 없음) | nw 150 · 이행 | nw 300 · 이행 | nw 150 · 이행 |
| SVG 크기 · viewBox 모두 없음 | nw 300 · 이행 | 같음 | 같음 |
| SVG `width="0" height="0"` | **complete · nw 0 · decode 이행** | 같음 | 같음 |

- 지금 세 엔진은 크기 없는 SVG 에 기본 크기(300×150 또는 viewBox 비율)를 줘서 naturalWidth 가 0 이 아니에요. 그래도 HTML 표준은 natural width 가 없으면 `naturalWidth` 가 0 을 돌려준다고 정하고 있어(추정: 엔진 · 버전에 따라 0 이 나올 수 있음) 이것에 기대지 않았어요.
- 정상 로드인데 naturalWidth 가 0 인 이미지는 실제로 만들 수 있어요(`width="0"` SVG). 이 이미지는 세 엔진 모두 `complete=true · naturalWidth=0` 이라 **`complete && naturalWidth === 0` 만으로 판정하면 fallback 으로 오판**해요(변이 M2 로 세 엔진에서 실측, testplan 3절).
- `decode()` 는 깨진 이미지에서만 거부되고(세 엔진 모두 `EncodingError`), 정상 로드된 이미지는 크기가 0 이어도 이행돼요. 그래서 decode 결과로 두 경우를 가를 수 있어요.
- 확장자 · MIME 으로 SVG 를 가리는 방법은 data URL · 확장자 없는 주소 · 서버 응답 헤더에 따라 틀려서 쓰지 않았어요.
- `decode` 가 없는 환경(jsdom 27 은 `HTMLImageElement.prototype.decode` 가 없음, 실측)에서는 판정하지 않고 종전 동작(onError 만)을 유지해요. 보수적인 쪽을 기본값으로 둬요.

## 4. 요구사항

- FR-1 하이드레이션 전에 이미 실패한 이미지는 하이드레이션 직후 fallback 으로 바뀌어요(하이드레이션 불일치 경고 없음: 첫 클라이언트 렌더는 서버와 같은 `<img>` 이고 바뀌는 것은 effect 뒤예요)
- FR-2 정상 이미지(크기 0 SVG 포함)는 fallback 으로 바뀌지 않아요
- FR-3 src 가 바뀌면 이전 실패를 지우고 새 이미지를 다시 그려요. 실패했던 src 로 돌아와도(A → B → A) 다시 시도해요
- FR-4 decode 대기 중 src 가 바뀌면 이전 src 의 결과로 새 이미지를 실패 처리하지 않아요
- FR-5 공개 API(props 이름 · 타입 · ref 대상 div)는 바꾸지 않아요
- FR-6 library 데이터의 `axis-avatar` 소스 사본을 `library refresh-axis` 로 재생성해요. ui-react Avatar 는 레지스트리(`apps/web/public/r`) 항목이 아니라 레지스트리 변경은 없어야 해요(스크래치 출력으로 대조)

## 5. 수용 기준

- AC1 jsdom 단위 테스트가 FR-1~FR-4 를 고정하고, 수정 전 소스에서는 실패(음성 대조)하고 수정 후 통과해요. 판정을 끈 변이를 포함해 핵심 줄 변이를 테스트가 잡아요
- AC2 Playwright SSR 하이드레이션 실측에서 수정 전은 깨진 src 가 `img` 로 남고, 수정 후는 fallback 으로 바뀌어요. 같은 실측에서 SVG 3종은 `img` 유지, 부수 결함 경로(ok → 깨진 src → ok)는 수정 후 `img` 로 돌아와요
- AC3 게이트 `pnpm turbo run type-check lint test build --force`(ui-react 와 그 의존 패키지) 통과, Cached 0
- AC4 배포 뒤 발행본 `@axis-ds/ui-react` 로 AC2 fixture 를 1회 다시 돌려 깨진 src 가 fallback 으로 바뀌어요

## 6. 범위 밖

- agentic-ui `AgentAvatar` 의 같은 유형 결함 점검(필요하면 별도 WI)
- React 18 실측(패키지 테스트 devDependency 는 React 19.2.3, peer 는 `>=18`. 쓴 API(useState · useEffect · useRef · 렌더 중 상태 조정)는 18 에도 있음, 미측정)
