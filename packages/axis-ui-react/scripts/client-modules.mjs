/**
 * "use client" 를 붙일 모듈 목록 (WI-0050 D1, 단일 관리 위치)
 *
 * 빌드는 모듈 구조를 보존해 소스 파일 하나가 dist 파일 하나(.mjs · .js)가 됩니다.
 * scripts/postbuild.mjs 가 아래 목록의 산출물 맨 앞에만 "use client" 를 붙입니다.
 * 소스 파일에는 지시문을 쓰지 않습니다(목록이 두 곳으로 갈라지지 않게).
 *
 * 목록에 넣는 기준(서버 컴포넌트에서 실제로 깨지는 것만):
 *   - react-server 빌드의 React 에 없는 API 를 쓰는 파일:
 *     useState · useEffect · useLayoutEffect · useRef · useReducer · useContext · createContext 등
 *     (forwardRef · memo · useId · useMemo · useCallback 은 react-server 에도 있어 서버에서 동작합니다)
 *   - DOM 요소에 함수(이벤트 핸들러)를 직접 넘기는 파일(서버에서 직렬화할 수 없습니다)
 *   - "use client" 모듈의 내보내기를 점(.)으로 접근하는 파일
 *     (서버에서는 클라이언트 참조의 속성이 undefined 가 됩니다. 예: cmdk 의 Command.Input)
 *
 * 넣지 않는 것:
 *   - 루트 배럴(index) · utils(cn) · *Variants 를 담은 파일: 서버에서 호출할 수 있어야 합니다.
 *     배럴에 지시문을 두면 cn() · buttonVariants() 등이 서버에서
 *     "Attempted to call X() from the server" 로 깨집니다(WI-0050 실측).
 *   - Radix 래퍼: Radix 패키지 dist 에 이미 "use client" 가 있어 래퍼(forwardRef)는 서버에서 돌고
 *     Radix 부분만 클라이언트 참조가 됩니다(1.4.0 RSC 하네스 · Next 빌드에서 통과 실측).
 *     네임스페이스 import(`import * as X`) 의 X.Root 는 모듈의 이름 있는 내보내기라 점 접근 문제가 없습니다.
 *   - Button 의 Slot(@radix-ui/react-slot): 지시문이 없지만 useCallback 만 써서 서버에서 동작합니다.
 *
 * 경로: src 기준, 확장자 없이. 새 컴포넌트가 위 기준에 걸리면 여기에 추가합니다.
 * postbuild 는 목록 밖 파일에서 상태 훅 · createContext · DOM 인라인 핸들러를 찾으면 빌드를 실패시킵니다.
 * 인라인 핸들러 검사는 props 자리에 화살표 · function 을 바로 쓴 경우(onClick: () => ...)만 잡습니다.
 * 컴포넌트 안 지역 함수를 넘기는 경우(const h = () => {}; onClick: h)는 prop 을 그대로 넘기는 형태와
 * 구분되지 않아 정적 검사로 잡지 않고, G2 RSC 하네스(scripts/pack-install-smoke.mjs --rsc-only)가 렌더 실패로 잡습니다.
 * 그런 파일은 기준(DOM 에 함수를 직접 만들어 넘김)에 걸리므로 직접 목록에 추가합니다.
 */
export const CLIENT_MODULES = [
  {
    path: "avatar/avatar",
    reason: "useState · useEffect · useRef(이미지 로드 오류 상태와 마운트 시 판정, WI-0054) + <img onError> 인라인 핸들러",
  },
  {
    path: "command/index",
    reason: "cmdk(\"use client\" 모듈)의 Command.Input · List · Empty · Group · Item · Separator 점 접근",
  },
  {
    path: "dialog/index",
    reason: "useState · createContext · useContext(열림 상태를 알아 닫힌 동안 트리거 aria-controls 를 뺌, WI-0069)",
  },
  {
    path: "popover/index",
    reason: "useState · createContext · useContext(열림 상태를 알아 닫힌 동안 트리거 aria-controls 를 뺌, WI-0069)",
  },
  {
    path: "sheet/index",
    reason: "useState · createContext · useContext(열림 상태를 알아 닫힌 동안 트리거 aria-controls 를 뺌, WI-0069)",
  },
  {
    path: "tooltip/index",
    reason: "useState · useRef · useLayoutEffect · createContext(스크롤 닫힘 판정과 open 제어, WI-0073) + Content 의 onEscapeKeyDown · onPointerDownOutside 인라인 핸들러",
  },
];
