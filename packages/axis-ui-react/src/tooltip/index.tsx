import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../utils";

/** 툴팁 시스템의 프로바이더 컴포넌트. delayDuration 등 전역 설정을 관리한다. */
const TooltipProvider = TooltipPrimitive.Provider;

/** 툴팁의 루트 컴포넌트. 열림/닫힘 상태를 관리한다. */
const Tooltip = TooltipPrimitive.Root;

/** 툴팁을 표시하기 위한 트리거 요소 */
const TooltipTrigger = TooltipPrimitive.Trigger;

/** 툴팁의 콘텐츠를 표시하는 컴포넌트. 포탈을 통해 렌더링되며 방향별 슬라이드 애니메이션을 지원한다. */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-[var(--axis-surface-inverse)] px-3 py-1.5 text-xs text-[var(--axis-text-inverse)]",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
