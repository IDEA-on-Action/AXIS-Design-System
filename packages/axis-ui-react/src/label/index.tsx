import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const labelVariants = cva(
  "text-sm font-medium leading-none text-[var(--axis-text-primary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

/** Label 컴포넌트의 Props 인터페이스. Radix Label 프리미티브의 속성을 확장한다. */
export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {}

/**
 * 폼 요소에 연결되는 레이블 컴포넌트.
 * 접근성을 위해 htmlFor 속성으로 폼 요소와 연결할 수 있으며, 연결된 요소가 비활성화되면 자동으로 시각적 피드백을 제공한다.
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
