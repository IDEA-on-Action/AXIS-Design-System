import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export interface StreamingTextProps {
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
  className,
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const prevTextRef = React.useRef("");

  React.useEffect(() => {
    if (isComplete) {
      setDisplayedText(text);
      setIsStreaming(false);
      return;
    }

    // 새로운 텍스트가 추가된 경우에만 스트리밍
    if (text.length > prevTextRef.current.length && text.startsWith(prevTextRef.current)) {
      const newText = text.slice(prevTextRef.current.length);
      let charIndex = 0;
      setIsStreaming(true);

      const interval = setInterval(() => {
        if (charIndex < newText.length) {
          setDisplayedText((prev) => prev + newText[charIndex]);
          charIndex++;
        } else {
          clearInterval(interval);
          setIsStreaming(false);
          if (onComplete) onComplete();
        }
      }, speed);

      prevTextRef.current = text;
      return () => clearInterval(interval);
    } else if (text !== prevTextRef.current) {
      // 텍스트가 완전히 변경된 경우 리셋
      setDisplayedText("");
      prevTextRef.current = "";
    }
  }, [text, speed, isComplete, onComplete]);

  return (
    <div className={cn("relative", className)}>
      <span className="text-[var(--axis-text-primary)] whitespace-pre-wrap">
        {displayedText}
      </span>
      {showCursor && isStreaming && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-[var(--axis-text-primary)] animate-pulse" />
      )}
    </div>
  );
}
