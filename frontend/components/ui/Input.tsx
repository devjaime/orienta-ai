"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/validation";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-vocari-text mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-3 py-2 rounded-sm border bg-white text-vocari-text",
            "placeholder:text-vocari-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-vocari-accent focus:border-transparent",
            "disabled:bg-gray-50 disabled:cursor-not-allowed",
            error
              ? "border-error focus:ring-error"
              : "border-gray-300",
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-error">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-vocari-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
