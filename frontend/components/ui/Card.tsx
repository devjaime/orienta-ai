import { cn } from "@/lib/utils/validation";
import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "elevated" | "interactive";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white border border-gray-200 shadow-sm",
  elevated: "bg-white shadow-md",
  interactive:
    "bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-vocari-accent transition-all cursor-pointer",
};

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn("rounded-lg p-4", variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-vocari-text", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-vocari-text", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 pt-3 border-t border-gray-100", className)}
      {...props}
    >
      {children}
    </div>
  );
}
