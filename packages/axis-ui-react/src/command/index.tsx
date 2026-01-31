import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "../utils";

/**
 * 명령어 팔레트 루트 컴포넌트
 * cmdk 라이브러리를 기반으로 검색 가능한 명령 목록을 제공한다.
 */
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-[var(--axis-surface-primary)] text-[var(--axis-text-primary)]",
      className
    )}
    {...props}
  />
));
Command.displayName = "Command";

/** 명령어 팔레트의 검색 입력 필드 */
const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-[var(--axis-border-default)] px-3">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 h-4 w-4 shrink-0 opacity-50"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none",
        "placeholder:text-[var(--axis-text-tertiary)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
));
CommandInput.displayName = "CommandInput";

/** 명령어 항목들을 표시하는 스크롤 가능한 목록 영역 */
const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "max-h-[300px] overflow-y-auto overflow-x-hidden",
      className
    )}
    {...props}
  />
));
CommandList.displayName = "CommandList";

/** 검색 결과가 없을 때 표시되는 빈 상태 컴포넌트 */
const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-[var(--axis-text-secondary)]"
    {...props}
  />
));
CommandEmpty.displayName = "CommandEmpty";

/** 관련 명령어 항목들을 그룹화하는 컴포넌트 */
const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-[var(--axis-text-primary)]",
      "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[var(--axis-text-secondary)]",
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = "CommandGroup";

/** 명령어 그룹 사이의 시각적 구분선 */
const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-[var(--axis-border-default)]", className)}
    {...props}
  />
));
CommandSeparator.displayName = "CommandSeparator";

/** 명령어 팔레트의 개별 선택 가능한 항목 */
const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
      "data-[selected=true]:bg-[var(--axis-surface-secondary)] data-[selected=true]:text-[var(--axis-text-primary)]",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = "CommandItem";

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
};
