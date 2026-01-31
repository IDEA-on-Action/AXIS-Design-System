import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full bg-[var(--axis-surface-secondary)]",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

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
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

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
            src={src}
            alt={alt || "Avatar"}
            className="aspect-square h-full w-full object-cover"
            onError={() => setHasError(true)}
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

export { Avatar, avatarVariants };
