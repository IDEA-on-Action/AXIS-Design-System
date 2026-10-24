import * as React from "react";
import { cn } from "../utils";

/** Skeleton 컴포넌트의 Props 인터페이스. HTML div 요소의 모든 속성을 지원한다. */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * 콘텐츠 로딩 상태를 시각적으로 나타내는 스켈레톤 컴포넌트. 펄스 애니메이션이 적용된다.
 * 움직임 줄이기 설정에서는 멈추지 않고 느리게(2s → 5s) 깜박여 로딩 중임을 계속 알린다(WI-0071).
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-md bg-[var(--axis-surface-tertiary)] motion-reduce:![animation-duration:5s]",
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
