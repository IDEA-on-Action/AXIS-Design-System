/**
 * AXIS Design System - Core UI Components
 *
 * React 기반 UI 컴포넌트 라이브러리.
 * Radix UI 프리미티브와 Tailwind CSS를 기반으로 접근성과 커스터마이징을 지원합니다.
 *
 * @example
 * ```tsx
 * import { Button, Card, Input } from "@axis-ds/ui-react";
 * ```
 *
 * @packageDocumentation
 */

// --- 유틸리티 ---
export { cn } from "./utils";

// --- 버튼 & 입력 컴포넌트 ---
export { Button, buttonVariants, type ButtonProps } from "./button";
export { Input, type InputProps } from "./input";
export { Label, type LabelProps } from "./label";
export { Checkbox } from "./checkbox";
export { RadioGroup, RadioGroupItem } from "./radio-group";
export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "./select";
export { Slider } from "./slider";
export { Switch } from "./switch";
export { Textarea } from "./textarea";
export { Toggle, toggleVariants } from "./toggle";

// --- 레이아웃 & 구조 컴포넌트 ---
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
} from "./card";
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";
export { Separator, type SeparatorProps } from "./separator";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

// --- 네비게이션 컴포넌트 ---
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./breadcrumb";

// --- 오버레이 & 팝업 컴포넌트 ---
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";
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
} from "./dropdown-menu";
export { Popover, PopoverTrigger, PopoverContent } from "./popover";
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./sheet";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip";

// --- 피드백 & 상태 컴포넌트 ---
export {
  Alert,
  AlertTitle,
  AlertDescription,
  alertVariants,
  type AlertProps,
} from "./alert";
export { Badge, badgeVariants, type BadgeProps } from "./badge";
export {
  Progress,
  progressVariants,
  progressIndicatorVariants,
  type ProgressProps,
} from "./progress";
export { Skeleton, type SkeletonProps } from "./skeleton";
export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from "./toast";

// --- 데이터 표시 컴포넌트 ---
export { Avatar, avatarVariants, type AvatarProps } from "./avatar";
export { ScrollArea, ScrollBar } from "./scroll-area";

// --- 커맨드 팔레트 ---
export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "./command";
