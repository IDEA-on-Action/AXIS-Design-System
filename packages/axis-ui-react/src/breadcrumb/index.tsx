import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../utils";

/**
 * 브레드크럼 루트 네비게이션 컴포넌트
 * 현재 페이지의 계층 구조를 표시한다.
 */
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    /** 항목 사이의 구분자 요소 */
    separator?: React.ReactNode;
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />);
Breadcrumb.displayName = "Breadcrumb";

/** 브레드크럼 항목들을 감싸는 정렬된 목록 */
const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-[var(--axis-text-secondary)] sm:gap-2.5",
      className
    )}
    {...props}
  />
));
BreadcrumbList.displayName = "BreadcrumbList";

/** 브레드크럼의 개별 항목 컴포넌트 */
const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

/** 브레드크럼 항목의 클릭 가능한 링크 컴포넌트 */
const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    /** Slot 패턴을 사용하여 자식 요소를 링크로 렌더링 */
    asChild?: boolean;
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      className={cn(
        "transition-colors hover:text-[var(--axis-text-primary)]",
        className
      )}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

/** 현재 페이지를 나타내는 비활성 브레드크럼 항목 */
const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-[var(--axis-text-primary)]", className)}
    {...props}
  />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

/** 브레드크럼 항목 사이의 구분자 (기본: 화살표 아이콘) */
const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:h-3.5 [&>svg]:w-3.5", className)}
    {...props}
  >
    {children ?? (
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
        <path d="m9 18 6-6-6-6" />
      </svg>
    )}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

/** 생략된 브레드크럼 항목을 나타내는 말줄임 표시 */
const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
