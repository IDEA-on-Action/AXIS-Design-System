import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export interface StreamingTextProps {
  /** 접근성 라이브 영역 모드 */
  "aria-live"?: "polite" | "assertive" | "off";
  /** 접근성 레이블 */
  "aria-label"?: string;
  /** 스트리밍할 텍스트 */
  text: string;
  /** 스트리밍 속도 (ms) */
  speed?: number;
  /** 스트리밍 완료 여부 */
  isComplete?: boolean;
  /** 커서 표시 여부 */
  showCursor?: boolean;
  /** 완료 콜백 */
  onComplete?: () => void;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 텍스트를 실시간으로 스트리밍하는 컴포넌트
 * AI 응답을 타이핑 효과로 표시할 때 사용
 */
export function StreamingText({
  text,
  speed = 20,
  isComplete = false,
  showCursor = true,
  onComplete,
  "aria-live": ariaLive,
  "aria-label": ariaLabel,
  className,
}: StreamingTextProps) {
  // 글자는 코드 포인트 단위로 센다(이모지 등 서로게이트 쌍을 반쪽으로 보이지 않게)
  const chars = React.useMemo(() => Array.from(text), [text]);
  // 상태는 "보여 줄 글자 수"만 두고 화면 문자열은 text 에서 잘라 만든다.
  // effect 가 정리 후 다시 실행돼도(StrictMode · 부모 재렌더) 이 위치에서 이어 간다.
  const [visibleLength, setVisibleLength] = React.useState(0);
  const [prevText, setPrevText] = React.useState(text);
  // text 변경: 이어 붙이기면 진행 위치 유지, 통째 교체면 처음부터(렌더 중 상태 조정)
  if (text !== prevText) {
    setPrevText(text);
    if (!text.startsWith(prevText)) setVisibleLength(0);
  }

  const targetLength = chars.length;
  const isStreaming = !isComplete && visibleLength < targetLength;

  // onComplete 는 ref 로 읽어 effect 의존성에서 뺀다(부모가 매 렌더 새 함수를 넘겨도 진행 유지)
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  React.useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setVisibleLength((n) => Math.min(n + 1, targetLength));
    }, speed);
    return () => clearInterval(interval);
  }, [isStreaming, targetLength, speed]);

  // 화면이 text 끝까지 따라잡은 순간 한 번 onComplete 를 부른다(isComplete 로 즉시 표시한 경우는 제외)
  const wasStreamingRef = React.useRef(false);
  React.useEffect(() => {
    if (isStreaming) {
      wasStreamingRef.current = true;
      return;
    }
    if (wasStreamingRef.current) {
      wasStreamingRef.current = false;
      if (!isComplete) onCompleteRef.current?.();
    }
  }, [isStreaming, isComplete]);

  const displayedText = isComplete ? text : chars.slice(0, visibleLength).join("");

  return (
    <div
      role="region"
      aria-label={ariaLabel || "AI 응답"}
      aria-live={ariaLive ?? "polite"}
      aria-busy={isStreaming}
      className={cn("relative", className)}
    >
      <span className="text-[var(--axis-text-primary)] whitespace-pre-wrap">
        {displayedText}
      </span>
      {showCursor && isStreaming && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-[var(--axis-text-primary)] animate-pulse" aria-hidden="true" />
      )}
    </div>
  );
}
