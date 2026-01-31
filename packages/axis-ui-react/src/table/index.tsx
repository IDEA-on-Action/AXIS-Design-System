import * as React from "react";
import { cn } from "../utils";

/** 데이터를 행과 열로 표시하는 테이블 컴포넌트. 가로 스크롤 가능한 래퍼를 포함한다. */
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-sm text-[var(--axis-text-primary)]",
        className
      )}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

/** 테이블의 헤더 섹션(thead)을 렌더링하는 컴포넌트 */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("[&_tr]:border-b", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

/** 테이블의 본문 섹션(tbody)을 렌더링하는 컴포넌트 */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
));
TableBody.displayName = "TableBody";

/** 테이블의 푸터 섹션(tfoot)을 렌더링하는 컴포넌트. 배경색이 적용된다. */
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-[var(--axis-surface-secondary)] font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

/** 테이블의 행(tr)을 렌더링하는 컴포넌트. 호버 효과와 선택 상태 스타일을 지원한다. */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-[var(--axis-border-default)] transition-colors",
      "hover:bg-[var(--axis-surface-secondary)]",
      "data-[state=selected]:bg-[var(--axis-surface-tertiary)]",
      className
    )}
    {...props}
  />
));
TableRow.displayName = "TableRow";

/** 테이블 헤더 셀(th)을 렌더링하는 컴포넌트. 보조 텍스트 색상과 중간 굵기 폰트가 적용된다. */
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-[var(--axis-text-secondary)]",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

/** 테이블 데이터 셀(td)을 렌더링하는 컴포넌트 */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-4 align-middle [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

/** 테이블의 캡션(caption)을 렌더링하는 컴포넌트. 테이블 하단에 보조 텍스트로 표시된다. */
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-4 text-sm text-[var(--axis-text-secondary)]",
      className
    )}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
