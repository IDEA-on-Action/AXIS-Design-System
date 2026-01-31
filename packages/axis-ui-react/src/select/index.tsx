import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "../utils";

/** 셀렉트의 루트 컴포넌트. 열림/닫힘 및 선택 상태를 관리한다. */
const Select = SelectPrimitive.Root;

/** 셀렉트 옵션들을 논리적으로 그룹화하는 컴포넌트 */
const SelectGroup = SelectPrimitive.Group;

/** 셀렉트 트리거 내에서 현재 선택된 값을 표시하는 컴포넌트 */
const SelectValue = SelectPrimitive.Value;

/** 셀렉트 드롭다운을 여는 트리거 버튼 컴포넌트. 선택된 값과 하향 화살표 아이콘을 표시한다. */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm",
      "bg-[var(--axis-input-bg-default)] border-[var(--axis-input-border-default)]",
      "placeholder:text-[var(--axis-input-text-placeholder)]",
      "hover:border-[var(--axis-input-border-hover)]",
      "focus:outline-none focus:ring-2 focus:ring-[var(--axis-input-border-focus)] focus:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "[&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <svg
        className="h-4 w-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

/** 셀렉트 드롭다운의 본문 콘텐츠 컴포넌트. 포털을 통해 렌더링되며 진입/퇴장 애니메이션을 포함한다. */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md",
        "bg-[var(--axis-surface-default)] border-[var(--axis-border-default)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

/** 셀렉트 옵션 그룹의 레이블 컴포넌트. 비선택 텍스트로 그룹 제목을 표시한다. */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "py-1.5 pl-8 pr-2 text-sm font-semibold text-[var(--axis-text-secondary)]",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

/** 셀렉트 드롭다운의 개별 선택 항목 컴포넌트. 선택 시 좌측에 체크 아이콘이 표시된다. */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
      "text-[var(--axis-text-primary)]",
      "focus:bg-[var(--axis-surface-secondary)] focus:text-[var(--axis-text-primary)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

/** 셀렉트 옵션 사이의 구분선 컴포넌트 */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[var(--axis-border-default)]", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
