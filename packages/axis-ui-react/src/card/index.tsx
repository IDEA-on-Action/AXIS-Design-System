import * as React from "react";
import { cn } from "../utils";

/** Card 컴포넌트 Props */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

/** 관련 콘텐츠를 그룹화하여 표시하는 카드 컨테이너 컴포넌트 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-[var(--axis-card-bg-default)] border-[var(--axis-card-border-default)] shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

/** 카드의 헤더 영역 (제목, 설명 등을 포함) */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/** 카드의 제목을 표시하는 컴포넌트 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-[var(--axis-text-primary)]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/** 카드의 부가 설명을 표시하는 컴포넌트 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--axis-text-secondary)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/** 카드의 본문 콘텐츠 영역 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/** 카드의 하단 영역 (액션 버튼 등을 배치) */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
