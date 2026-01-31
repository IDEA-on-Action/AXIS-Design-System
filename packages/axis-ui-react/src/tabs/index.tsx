import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../utils";

/** 탭 기반 네비게이션의 루트 컴포넌트. 활성 탭 상태를 관리한다. */
const Tabs = TabsPrimitive.Root;

/** 탭 트리거 버튼들을 감싸는 리스트 컨테이너. 인라인 정렬과 배경색이 적용된다. */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md p-1",
      "bg-[var(--axis-surface-secondary)] text-[var(--axis-text-secondary)]",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

/** 개별 탭을 선택하는 트리거 버튼. 활성 상태에 따라 스타일이 변경된다. */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
      "ring-offset-[var(--axis-surface-default)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-border-focus)] focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-[var(--axis-surface-default)] data-[state=active]:text-[var(--axis-text-primary)] data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

/** 선택된 탭에 해당하는 콘텐츠를 표시하는 컴포넌트. 포커스 링 스타일을 지원한다. */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-[var(--axis-surface-default)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-border-focus)] focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
