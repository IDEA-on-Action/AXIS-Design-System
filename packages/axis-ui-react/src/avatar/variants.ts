import { cva } from "class-variance-authority";

/**
 * Avatar 크기 variants
 *
 * 컴포넌트(./avatar, 클라이언트 경계)와 파일을 나눠 두었습니다. 같은 파일에 있으면
 * 서버 컴포넌트에서 `avatarVariants()` 를 부를 때 클라이언트 참조가 되어 실패합니다(WI-0050 D2).
 * 이 파일은 클라이언트 지시문 목록(scripts/client-modules.mjs)에 넣지 않습니다.
 */
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full bg-[var(--axis-surface-secondary)]",
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export { avatarVariants };
