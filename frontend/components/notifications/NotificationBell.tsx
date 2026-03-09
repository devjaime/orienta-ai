"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NotificationResponse, NotificationListResponse } from "@/lib/types";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/validation";

const TYPE_LABELS: Record<string, string> = {
  general: "General",
  session_scheduled: "Sesion programada",
  session_cancelled: "Sesion cancelada",
  test_completed: "Test completado",
  analysis_ready: "Analisis listo",
  consent_required: "Consentimiento requerido",
};

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: NotificationResponse;
  onMarkRead: (id: string) => void;
}) {
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("es-CL");
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors",
        notification.is_read
          ? "bg-white"
          : "bg-blue-50 border-l-2 border-vocari-primary",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium truncate",
              notification.is_read
                ? "text-vocari-text-muted"
                : "text-vocari-text",
            )}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-vocari-primary shrink-0" />
          )}
        </div>
        <p className="text-xs text-vocari-text-muted truncate mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-vocari-text-muted">
            {timeAgo(notification.created_at)}
          </span>
          <span className="text-xs text-vocari-text-muted">•</span>
          <span className="text-xs text-vocari-text-muted">
            {TYPE_LABELS[notification.notification_type] ||
              notification.notification_type}
          </span>
        </div>
      </div>
      {!notification.is_read && (
        <button
          onClick={() => onMarkRead(notification.id)}
          className="p-1 rounded hover:bg-gray-100 text-vocari-text-muted"
          title="Marcar como leida"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api.get<NotificationListResponse>("/api/v1/notifications?per_page=20"),
    staleTime: 30_000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (ids: string[]) =>
      api.post("/api/v1/notifications/mark-read", { notification_ids: ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.post("/api/v1/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast("success", "Todas las notificaciones leidas");
    },
  });

  const unreadCount = data?.unread_count ?? 0;
  const notifications = data?.items ?? [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      refetch();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, refetch]);

  const handleMarkRead = (id: string) => {
    markAsReadMutation.mutate([id]);
  };

  const handleMarkAllRead = () => {
    markAllAsReadMutation.mutate();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label={
          unreadCount > 0
            ? `Notificaciones (${unreadCount} sin leer)`
            : "Notificaciones"
        }
      >
        <Bell className="h-5 w-5 text-vocari-text-muted" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="font-semibold text-vocari-text">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-vocari-accent hover:underline flex items-center gap-1"
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todo leido
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-vocari-text-muted text-sm">
                Cargando...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-vocari-text-muted text-sm">
                No tienes notificaciones
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-100 bg-gray-50">
            <a
              href="/notificaciones"
              className="block text-center text-sm text-vocari-accent hover:underline py-1"
            >
              Ver todas las notificaciones
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
