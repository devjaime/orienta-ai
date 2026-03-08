import { cn } from "@/lib/utils/validation";
import type { ReactNode } from "react";

/* ===== Table ===== */

type TableVariant = "default" | "compact" | "striped";

interface TableProps {
  variant?: TableVariant;
  children: ReactNode;
  className?: string;
}

export function Table({ variant = "default", children, className }: TableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          "w-full text-left text-vocari-text",
          variant === "compact" ? "text-sm" : "text-base",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
}

/* ===== TableHeader ===== */

export function TableHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead className={cn("border-b border-gray-200 bg-gray-50", className)}>
      {children}
    </thead>
  );
}

/* ===== TableBody ===== */

export function TableBody({
  children,
  className,
  striped = false,
}: {
  children: ReactNode;
  className?: string;
  striped?: boolean;
}) {
  return (
    <tbody
      className={cn(
        striped && "[&>tr:nth-child(even)]:bg-gray-50",
        className,
      )}
    >
      {children}
    </tbody>
  );
}

/* ===== TableRow ===== */

export function TableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("border-b border-gray-100", className)}>{children}</tr>
  );
}

/* ===== TableHead (th) ===== */

interface TableHeadProps {
  children: ReactNode;
  className?: string;
  sortable?: boolean;
  sorted?: "asc" | "desc" | null;
  onSort?: () => void;
}

export function TableHead({
  children,
  className,
  sortable = false,
  sorted,
  onSort,
}: TableHeadProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold text-vocari-text-muted text-sm uppercase tracking-wider",
        sortable && "cursor-pointer select-none hover:text-vocari-text",
        className,
      )}
      onClick={sortable ? onSort : undefined}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sorted === "asc" && <span aria-label="Ordenado ascendente">&#9650;</span>}
        {sorted === "desc" && <span aria-label="Ordenado descendente">&#9660;</span>}
      </span>
    </th>
  );
}

/* ===== TableCell (td) ===== */

export function TableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}
