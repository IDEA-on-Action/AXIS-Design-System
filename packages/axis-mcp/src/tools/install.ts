/**
 * AXIS Design System MCP - 설치 도구
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { getComponent } from "../registry/loader.js";
import type { ComponentMeta, InstallResult } from "../types.js";

export interface InstallComponentParams {
  name: string;
  targetDir: string;
}

// 컴포넌트 템플릿 (실제 구현에서는 별도 파일에서 로드)
const COMPONENT_TEMPLATES: Record<string, Record<string, string>> = {
  button: {
    "components/ui/button.tsx": `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
`,
  },
  input: {
    "components/ui/input.tsx": `import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
`,
  },
  label: {
    "components/ui/label.tsx": `"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
`,
  },
  card: {
    "components/ui/card.tsx": `import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
`,
  },
  badge: {
    "components/ui/badge.tsx": `import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
`,
  },
};

/**
 * axis.install_component 도구 구현
 *
 * 컴포넌트를 지정된 디렉토리에 설치합니다.
 */
export function handleInstallComponent(
  params: InstallComponentParams
): InstallResult {
  const { name, targetDir } = params;

  if (!name || name.trim() === "") {
    throw new Error("컴포넌트 이름(name)은 필수입니다.");
  }

  if (!targetDir || targetDir.trim() === "") {
    throw new Error("대상 디렉토리(targetDir)는 필수입니다.");
  }

  // 컴포넌트 메타데이터 조회
  const component = getComponent(name);
  if (!component) {
    return {
      success: false,
      installedFiles: [],
      dependencies: [],
      message: `컴포넌트 '${name}'을(를) 찾을 수 없습니다.`,
    };
  }

  // 템플릿 확인
  const templates = COMPONENT_TEMPLATES[name.toLowerCase()];
  if (!templates) {
    return {
      success: false,
      installedFiles: [],
      dependencies: component.dependencies,
      message: `컴포넌트 '${name}'의 템플릿이 아직 준비되지 않았습니다. 수동으로 설치해 주세요.`,
    };
  }

  const installedFiles: string[] = [];

  try {
    // 파일 설치
    for (const [relativePath, content] of Object.entries(templates)) {
      const fullPath = join(targetDir, relativePath);
      const dir = dirname(fullPath);

      // 디렉토리 생성
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // 파일 쓰기
      writeFileSync(fullPath, content, "utf-8");
      installedFiles.push(relativePath);
    }

    return {
      success: true,
      installedFiles,
      dependencies: component.dependencies,
      message: `컴포넌트 '${name}'이(가) 성공적으로 설치되었습니다.`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return {
      success: false,
      installedFiles,
      dependencies: component.dependencies,
      message: `설치 중 오류 발생: ${errorMessage}`,
    };
  }
}

/**
 * 설치 결과를 Markdown 형식으로 포맷팅
 */
export function formatInstallResult(result: InstallResult): string {
  const lines: string[] = [];

  if (result.success) {
    lines.push("# 컴포넌트 설치 완료");
    lines.push("");
    lines.push(result.message);
    lines.push("");

    if (result.installedFiles.length > 0) {
      lines.push("## 설치된 파일");
      for (const file of result.installedFiles) {
        lines.push(`- \`${file}\``);
      }
      lines.push("");
    }

    if (result.dependencies.length > 0) {
      lines.push("## 필요한 의존성");
      lines.push("다음 패키지를 설치해 주세요:");
      lines.push("");
      lines.push("```bash");
      lines.push(`npm install ${result.dependencies.join(" ")}`);
      lines.push("```");
    }
  } else {
    lines.push("# 컴포넌트 설치 실패");
    lines.push("");
    lines.push(result.message);

    if (result.dependencies.length > 0) {
      lines.push("");
      lines.push("## 필요한 의존성 (참고)");
      for (const dep of result.dependencies) {
        lines.push(`- \`${dep}\``);
      }
    }
  }

  return lines.join("\n");
}
