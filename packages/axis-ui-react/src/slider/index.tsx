import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../utils";

/** 범위 내에서 값을 선택할 수 있는 슬라이더 컴포넌트. 트랙, 범위 표시, 드래그 가능한 썸을 포함한다. */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-[var(--axis-surface-tertiary)]">
      <SliderPrimitive.Range className="absolute h-full bg-[var(--axis-interactive-primary)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--axis-interactive-primary)] bg-[var(--axis-surface-primary)] ring-offset-[var(--axis-surface-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";

export { Slider };
