import { cn } from "@/lib/utils/validation";

type SkeletonVariant = "text" | "circle" | "rect";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className,
}: SkeletonProps) {
  const style = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200",
        variant === "text" && "h-4 rounded w-full",
        variant === "circle" && "rounded-full w-10 h-10",
        variant === "rect" && "rounded-lg w-full h-20",
        className,
      )}
      style={style}
      aria-hidden="true"
    />
  );
}
