import * as React from "react";
import { cn } from "../utils";

/** Input 컴포넌트의 Props 인터페이스 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 에러 상태 표시. true일 경우 테두리와 포커스 링이 에러 색상으로 변경된다. */
  error?: boolean;
}

/**
 * 텍스트 입력 필드 컴포넌트.
 * 다양한 HTML input 타입을 지원하며, 에러 상태와 비활성화 상태 스타일을 포함한다.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors",
          "bg-[var(--axis-input-bg-default)] text-[var(--axis-input-text-default)]",
          "border-[var(--axis-input-border-default)]",
          "placeholder:text-[var(--axis-input-text-placeholder)]",
          "hover:border-[var(--axis-input-border-hover)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-input-border-focus)] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--axis-input-bg-disabled)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          error && "border-[var(--axis-input-border-error)] focus-visible:ring-[var(--axis-input-border-error)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
