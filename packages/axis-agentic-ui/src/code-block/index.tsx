import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export interface CodeBlockProps {
  /** 코드 문자열 */
  code: string;
  /** 언어 (구문 강조용 힌트) */
  language?: string;
  /** 파일명 */
  filename?: string;
  /** 줄 번호 표시 */
  showLineNumbers?: boolean;
  /** 복사 완료 콜백 */
  onCopy?: (code: string) => void;
  /** 최대 높이 (스크롤) */
  maxHeight?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 코드 표시 + 복사 버튼 컴포넌트
 */
export function CodeBlock({
  code,
  language,
  filename,
  showLineNumbers = false,
  onCopy,
  maxHeight,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.(code);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API 미지원 시 fallback 없음
    }
  };

  const lines = code.split("\n");

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--axis-border-default)] bg-[var(--axis-surface-secondary)]">
        <div className="flex items-center gap-2 min-w-0">
          {filename && (
            <code className="text-xs font-mono text-[var(--axis-text-primary)] truncate">
              {filename}
            </code>
          )}
          {language && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--axis-surface-tertiary)] text-[var(--axis-text-tertiary)]">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          aria-label={copied ? "복사됨" : "코드 복사"}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-[var(--axis-text-secondary)] hover:bg-[var(--axis-surface-tertiary)] transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-[var(--axis-color-green-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>복사됨</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>복사</span>
            </>
          )}
        </button>
      </div>

      {/* 코드 본문 */}
      <div
        className="overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <pre className="p-3 text-sm leading-relaxed">
          <code className="text-[var(--axis-text-primary)] font-mono">
            {showLineNumbers ? (
              <table className="border-collapse w-full" role="presentation">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td
                        className="select-none text-right pr-4 text-[var(--axis-text-tertiary)] w-8"
                        aria-hidden="true"
                      >
                        {i + 1}
                      </td>
                      <td className="whitespace-pre">{line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
