import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../utils";
import { avatarVariants } from "./variants";

/**
 * Avatar 컴포넌트 Props
 * @property size - 아바타 크기 (sm, default, lg, xl)
 */
export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /** 이미지 소스 URL */
  src?: string;
  /** 대체 텍스트 */
  alt?: string;
  /** 이미지 로드 실패 시 표시할 fallback 텍스트 */
  fallback?: string;
}

/**
 * 사용자 프로필 이미지를 표시하는 아바타 컴포넌트
 * 이미지 로드 실패 시 이니셜 fallback을 표시한다.
 *
 * 실패 판정은 두 경로다(WI-0054).
 * 1. `<img onError>`: 하이드레이션 뒤(또는 클라이언트 렌더)에 난 오류.
 * 2. 마운트 시 검사: 서버 렌더된 이미지의 오류가 하이드레이션 전에 끝나면 onError 가 붙기 전이라
 *    이벤트를 놓친다. 그래서 마운트(와 src 변경) 때 `complete && naturalWidth === 0` 이면 실패 후보로 보고,
 *    `img.decode()` 가 거부될 때만 실패로 확정한다. 고유 크기가 없는 SVG 처럼 정상 로드인데
 *    naturalWidth 가 0 일 수 있는 이미지는 decode 가 이행되므로 실패로 보지 않는다.
 *    decode 가 없는 환경에서는 판정하지 않는다(종전 동작).
 *
 * 실패 상태는 실패한 src 와 함께 기억한다. src 가 바뀌면 렌더 중에 초기화해 새 이미지를 다시 시도한다.
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    // 실패한 src. null 이면 실패 없음
    const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
    if (failedSrc !== null && failedSrc !== src) {
      // src 가 바뀌면 이전 실패를 지운다(렌더 중 상태 조정)
      setFailedSrc(null);
    }
    const hasError = failedSrc !== null && failedSrc === src;
    const imgRef = React.useRef<HTMLImageElement>(null);

    React.useEffect(() => {
      const img = imgRef.current;
      if (!img || !src) return;
      // 아직 로딩 중이면 onError 가 받는다. 크기가 있으면 정상 로드다
      if (!img.complete || img.naturalWidth !== 0) return;
      if (typeof img.decode !== "function") return;
      let cancelled = false;
      img.decode().then(
        () => undefined,
        () => {
          if (!cancelled) setFailedSrc(src);
        }
      );
      return () => {
        cancelled = true;
      };
    }, [src]);

    const initials = React.useMemo(() => {
      if (fallback) return fallback;
      if (!alt) return "?";
      return alt
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }, [alt, fallback]);

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {src && !hasError ? (
          <img
            ref={imgRef}
            src={src}
            alt={alt || "Avatar"}
            className="aspect-square h-full w-full object-cover"
            onError={() => setFailedSrc(src)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-[var(--axis-surface-tertiary)] text-[var(--axis-text-secondary)] font-medium">
            {initials}
          </span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
