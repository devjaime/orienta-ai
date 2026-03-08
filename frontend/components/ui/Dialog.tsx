"use client";

import { useEffect, useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils/validation";
import { X } from "lucide-react";

type DialogVariant = "modal" | "drawer" | "alert";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  variant?: DialogVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onClose,
  variant = "modal",
  title,
  children,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Focus the dialog when opened
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const panelClasses: Record<DialogVariant, string> = {
    modal:
      "relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto",
    drawer:
      "fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto",
    alert:
      "relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(panelClasses[variant], className)}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-vocari-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 text-vocari-text-muted"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
