import * as React from "react";
import { cn } from "@axis-ds/ui-react";

export interface ModelInfo {
  /** 모델 이름 */
  name: string;
  /** 모델 제공자 */
  provider?: string;
  /** 모델 버전 */
  version?: string;
}

export interface ContextPanelProps {
  /** 모델 정보 */
  modelInfo?: ModelInfo;
  /** 시스템 프롬프트 */
  systemPrompt?: string;
  /** 첨부 파일 목록 */
  attachedFiles?: string[];
  /** 추가 설정 키-값 */
  settings?: Record<string, string>;
  /** 접힘 가능 여부 */
  collapsible?: boolean;
  /** 기본 펼침 상태 */
  defaultExpanded?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 모델/설정 메타 정보를 표시하는 패널 컴포넌트
 */
export function ContextPanel({
  modelInfo,
  systemPrompt,
  attachedFiles,
  settings,
  collapsible = true,
  defaultExpanded = false,
  className,
}: ContextPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const contentId = React.useId();

  const hasContent = modelInfo || systemPrompt || (attachedFiles && attachedFiles.length > 0) || (settings && Object.keys(settings).length > 0);
  if (!hasContent) return null;

  const header = (
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 text-[var(--axis-icon-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span className="text-xs font-medium text-[var(--axis-text-secondary)]">컨텍스트</span>
    </div>
  );

  const content = (
    <div id={contentId} className="space-y-3 mt-2">
      {modelInfo && (
        <div>
          <h5 className="text-xs font-medium text-[var(--axis-text-secondary)] mb-1">모델</h5>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-[var(--axis-text-primary)]">{modelInfo.name}</code>
            {modelInfo.provider && (
              <span className="text-xs text-[var(--axis-text-tertiary)]">{modelInfo.provider}</span>
            )}
            {modelInfo.version && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--axis-surface-tertiary)] text-[var(--axis-text-tertiary)]">
                {modelInfo.version}
              </span>
            )}
          </div>
        </div>
      )}

      {systemPrompt && (
        <div>
          <h5 className="text-xs font-medium text-[var(--axis-text-secondary)] mb-1">시스템 프롬프트</h5>
          <p className="text-xs text-[var(--axis-text-primary)] p-2 rounded bg-[var(--axis-surface-secondary)] line-clamp-3 whitespace-pre-wrap">
            {systemPrompt}
          </p>
        </div>
      )}

      {attachedFiles && attachedFiles.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-[var(--axis-text-secondary)] mb-1">
            첨부 파일 ({attachedFiles.length})
          </h5>
          <div className="space-y-1">
            {attachedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-[var(--axis-text-primary)]">
                <svg className="w-3 h-3 text-[var(--axis-icon-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="truncate">{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {settings && Object.keys(settings).length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-[var(--axis-text-secondary)] mb-1">설정</h5>
          <div className="space-y-1">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-[var(--axis-text-secondary)]">{key}</span>
                <code className="font-mono text-[var(--axis-text-primary)]">{value}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        "bg-[var(--axis-surface-secondary)] border-[var(--axis-border-default)]",
        className
      )}
    >
      {collapsible ? (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={contentId}
            className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            {header}
            <svg
              className={cn(
                "w-4 h-4 text-[var(--axis-text-secondary)] transition-transform",
                isExpanded && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isExpanded && content}
        </>
      ) : (
        <>
          {header}
          {content}
        </>
      )}
    </div>
  );
}
