import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../utils";

/** 팝오버의 루트 컴포넌트. 열림/닫힘 상태를 관리한다. */
const Popover = PopoverPrimitive.Root;

/** 팝오버를 여는 트리거 요소 컴포넌트 */
const PopoverTrigger = PopoverPrimitive.Trigger;

/** 팝오버의 본문 콘텐츠 컴포넌트. 포털을 통해 렌더링되며 트리거 요소에 상대적으로 위치한다. */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border border-[var(--axis-border-default)] bg-[var(--axis-surface-primary)] p-4 text-[var(--axis-text-primary)] shadow-md outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
