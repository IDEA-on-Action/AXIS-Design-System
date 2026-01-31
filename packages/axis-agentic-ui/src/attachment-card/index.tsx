import * as React from "react";
import { cn } from "@axis-ds/ui-react";
import { ATTACHMENT_TYPE_LABELS } from "../constants/a11y-labels";

export type AttachmentType = "image" | "document" | "code" | "archive" | "other";
export type AttachmentStatus = "uploading" | "complete" | "error";

export interface AttachmentCardProps {
  /** 파일 타입 */
  type: AttachmentType;
  /** 파일명 */
  name: string;
  /** 파일 크기 (bytes) */
  size?: number;
  /** 파일 URL */
  url?: string;
  /** 썸네일 URL (이미지인 경우) */
  thumbnail?: string;
  /** 업로드 상태 */
  status?: AttachmentStatus;
  /** 업로드 진행률 (0-100) */
  progress?: number;
  /** 삭제 콜백 */
  onRemove?: () => void;
  /** 추가 클래스 */
  className?: string;
}

const typeIcons: Record<AttachmentType, React.ReactNode> = {
  image: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  code: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  archive: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * 파일/이미지 첨부를 표시하는 카드 컴포넌트
 */
export function AttachmentCard({
  type,
  name,
  size,
  url,
  thumbnail,
  status = "complete",
  progress,
  onRemove,
  className,
}: AttachmentCardProps) {
  const typeLabel = ATTACHMENT_TYPE_LABELS[type];

  return (
    <div
      role="article"
      aria-label={`${typeLabel}: ${name}`}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        status === "error" && "border-[var(--axis-color-red-500)]/30",
        className
      )}
    >
      {/* 썸네일 또는 아이콘 */}
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          aria-hidden="true"
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div
          className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-[var(--axis-surface-secondary)] text-[var(--axis-icon-secondary)]"
          aria-hidden="true"
        >
          {typeIcons[type]}
        </div>
      )}

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--axis-text-primary)] truncate">
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              aria-label={`${name} (새 창에서 열림)`}
            >
              {name}
            </a>
          ) : (
            name
          )}
        </p>
        <div className="flex items-center gap-2 text-xs text-[var(--axis-text-tertiary)]">
          <span>{typeLabel}</span>
          {size !== undefined && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatFileSize(size)}</span>
            </>
          )}
          {status === "error" && (
            <span className="text-[var(--axis-text-error)]">업로드 실패</span>
          )}
        </div>

        {/* 업로드 진행률 */}
        {status === "uploading" && progress !== undefined && (
          <div className="mt-1.5 h-1 rounded-full bg-[var(--axis-surface-secondary)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--axis-color-blue-500)] transition-all"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="업로드 진행률"
            />
          </div>
        )}
      </div>

      {/* 삭제 버튼 */}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`${name} 삭제`}
          className="flex-shrink-0 p-1 rounded-md text-[var(--axis-text-tertiary)] hover:text-[var(--axis-text-secondary)] hover:bg-[var(--axis-surface-secondary)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
