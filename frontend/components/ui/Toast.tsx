"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils/validation";
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number; // ms, default 5000
}

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle; bg: string }
> = {
  success: { icon: CheckCircle, bg: "bg-green-50 border-green-200 text-green-800" },
  error: { icon: AlertCircle, bg: "bg-red-50 border-red-200 text-red-800" },
  warning: { icon: AlertTriangle, bg: "bg-yellow-50 border-yellow-200 text-yellow-800" },
  info: { icon: Info, bg: "bg-blue-50 border-blue-200 text-blue-800" },
};

/* Single toast */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, bg } = variantConfig[toast.variant];

  useEffect(() => {
    const timer = setTimeout(
      () => onDismiss(toast.id),
      toast.duration || 5000,
    );
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md min-w-[300px] max-w-[420px]",
        bg,
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 hover:opacity-70"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/* Toast container — renders all active toasts */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Expose add function globally via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastData>).detail;
      setToasts((prev) => [...prev, detail]);
    };
    window.addEventListener("vocari-toast", handler);
    return () => window.removeEventListener("vocari-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

/* Helper to fire a toast from anywhere */
let toastCounter = 0;
export function toast(variant: ToastVariant, message: string, duration?: number) {
  const id = `toast-${++toastCounter}-${Date.now()}`;
  const event = new CustomEvent<ToastData>("vocari-toast", {
    detail: { id, variant, message, duration },
  });
  window.dispatchEvent(event);
}
