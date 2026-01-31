import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "../utils";

/** 라디오 버튼 그룹의 루트 컴포넌트. 단일 선택 상태를 관리하며 키보드 네비게이션을 지원한다. */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    className={cn("grid gap-2", className)}
    {...props}
    ref={ref}
  />
));
RadioGroup.displayName = "RadioGroup";

/** 라디오 그룹 내 개별 라디오 버튼 컴포넌트. 선택 시 내부에 원형 인디케이터가 표시된다. */
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      "aspect-square h-4 w-4 rounded-full border border-[var(--axis-border-default)]",
      "ring-offset-[var(--axis-surface-primary)]",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-ring)] focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:border-[var(--axis-interactive-primary)] data-[state=checked]:text-[var(--axis-interactive-primary)]",
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="currentColor"
      >
        <circle cx="4" cy="4" r="4" />
      </svg>
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
