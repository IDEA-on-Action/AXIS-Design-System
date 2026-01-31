import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../utils";

/** 드롭다운 메뉴의 루트 컴포넌트. 열림/닫힘 상태를 관리한다. */
const DropdownMenu = DropdownMenuPrimitive.Root;

/** 드롭다운 메뉴를 여는 트리거 버튼 컴포넌트 */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

/** 메뉴 항목들을 논리적으로 그룹화하는 컴포넌트 */
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

/** 드롭다운 콘텐츠를 포털로 렌더링하는 컴포넌트 */
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

/** 중첩 서브 메뉴의 루트 컴포넌트 */
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

/** 라디오 선택 항목들을 그룹화하는 컴포넌트 */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/**
 * 서브 메뉴를 여는 트리거 항목 컴포넌트. 우측에 화살표 아이콘이 표시된다.
 * @param inset - true일 경우 좌측 패딩을 추가하여 아이콘 없는 항목과 정렬을 맞춘다
 */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    /** true일 경우 좌측 패딩을 추가하여 정렬을 맞춘다 */
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
      "focus:bg-[var(--axis-surface-secondary)]",
      "data-[state=open]:bg-[var(--axis-surface-secondary)]",
      "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
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
      className="ml-auto"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

/** 서브 메뉴의 콘텐츠 영역 컴포넌트. 진입/퇴장 애니메이션을 포함한다. */
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--axis-border-default)] bg-[var(--axis-surface-primary)] p-1 text-[var(--axis-text-primary)] shadow-lg",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

/** 드롭다운 메뉴의 본문 콘텐츠 컴포넌트. 포털을 통해 렌더링되며 위치 애니메이션을 포함한다. */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--axis-border-default)] bg-[var(--axis-surface-primary)] p-1 text-[var(--axis-text-primary)] shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

/**
 * 드롭다운 메뉴의 개별 항목 컴포넌트. 키보드 네비게이션과 포커스 스타일을 지원한다.
 * @param inset - true일 경우 좌측 패딩을 추가하여 정렬을 맞춘다
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    /** true일 경우 좌측 패딩을 추가하여 정렬을 맞춘다 */
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
      "focus:bg-[var(--axis-surface-secondary)] focus:text-[var(--axis-text-primary)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

/** 체크박스 기능이 포함된 메뉴 항목 컴포넌트. 선택 시 좌측에 체크 아이콘이 표시된다. */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
      "focus:bg-[var(--axis-surface-secondary)] focus:text-[var(--axis-text-primary)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
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
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

/** 라디오 선택 기능이 포함된 메뉴 항목 컴포넌트. 선택 시 좌측에 원형 인디케이터가 표시된다. */
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
      "focus:bg-[var(--axis-surface-secondary)] focus:text-[var(--axis-text-primary)]",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="currentColor"
        >
          <circle cx="4" cy="4" r="4" />
        </svg>
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

/**
 * 메뉴 그룹의 레이블 컴포넌트. 비선택 텍스트로 그룹 제목을 표시한다.
 * @param inset - true일 경우 좌측 패딩을 추가하여 정렬을 맞춘다
 */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    /** true일 경우 좌측 패딩을 추가하여 정렬을 맞춘다 */
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

/** 메뉴 항목 사이의 구분선 컴포넌트 */
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(
      "-mx-1 my-1 h-px bg-[var(--axis-border-default)]",
      className
    )}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

/** 메뉴 항목의 키보드 단축키를 표시하는 보조 텍스트 컴포넌트 */
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      "ml-auto text-xs tracking-widest text-[var(--axis-text-tertiary)]",
      className
    )}
    {...props}
  />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
