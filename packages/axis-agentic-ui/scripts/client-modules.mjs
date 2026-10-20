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
 *     (useId · useMemo · useCallback 은 react-server 에도 있어 서버에서 동작합니다.
 *      ApprovalCard · PlanCard · RecoveryBanner · RunProgress 가 이 경우라 목록에 없습니다)
 *   - DOM 요소에 함수(이벤트 핸들러)를 직접 만들어 넘기는 파일(서버에서 직렬화할 수 없습니다)
 *
 * 넣지 않는 것:
 *   - 루트 배럴(index) · constants: 서버 컴포넌트가 루트에서 import 해도 서버 렌더 가능 컴포넌트
 *     11개가 서버에서 그대로 렌더되어야 합니다. 배럴에 지시문을 두면 전부 클라이언트 참조가 됩니다.
 *   - 사용자가 넘긴 핸들러를 DOM 에 그대로 전달만 하는 파일(onClick={onRetry} 등):
 *     서버 컴포넌트에서 핸들러를 넘기는 것 자체가 RSC 계약상 불가하고, 핸들러 없이 쓰면 서버에서 렌더됩니다.
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
    path: "code-block/index",
    reason: "useState(복사 완료 상태) + 복사 버튼 onClick 핸들러(navigator.clipboard)",
  },
  {
    path: "context-panel/index",
    reason: "useState(펼침 상태) + 토글 onClick 인라인 핸들러",
  },
  {
    path: "diff-viewer/index",
    reason: "useState(unified · split 보기 모드) + 모드 전환 onClick 인라인 핸들러",
  },
  {
    path: "feedback-buttons/index",
    reason: "useState(선택한 피드백) + like · dislike onClick 인라인 핸들러",
  },
  {
    path: "source-panel/index",
    reason: "useState(펼침 상태) + 토글 onClick 인라인 핸들러",
  },
  {
    path: "streaming-text/index",
    reason: "useState · useRef · useEffect(타이핑 애니메이션 타이머)",
  },
  {
    path: "tool-call-card/index",
    reason: "useState(펼침 상태) + 토글 onClick 인라인 핸들러",
  },
];
