import { cn } from "@/lib/utils/validation";

type ProgressVariant = "determinate" | "indeterminate";

interface ProgressBarProps {
  value?: number; // 0-100
  variant?: ProgressVariant;
  showLabel?: boolean;
  className?: string;
  color?: string; // Tailwind bg class
}

export function ProgressBar({
  value = 0,
  variant = "determinate",
  showLabel = false,
  className,
  color = "bg-vocari-accent",
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && variant === "determinate" && (
        <div className="flex justify-between mb-1">
          <span className="text-sm text-vocari-text-muted">Progreso</span>
          <span className="text-sm font-medium text-vocari-text">
            {Math.round(clampedValue)}%
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        {variant === "determinate" ? (
          <div
            className={cn("h-full rounded-full transition-all duration-300", color)}
            style={{ width: `${clampedValue}%` }}
            role="progressbar"
            aria-valuenow={clampedValue}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        ) : (
          <div
            className={cn(
              "h-full rounded-full animate-[indeterminate_1.5s_infinite_ease-in-out]",
              color,
            )}
            style={{ width: "40%" }}
            role="progressbar"
          />
        )}
      </div>
    </div>
  );
}
