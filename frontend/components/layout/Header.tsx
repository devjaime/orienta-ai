"use client";

import { Menu, Bell, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { useNotificationStore } from "@/lib/stores/notification-store";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Left: hamburger on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5 text-vocari-text" />
        </button>
        <span className="text-lg font-bold text-vocari-primary hidden sm:block">
          Vocari
        </span>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-md hover:bg-gray-100"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
        >
          <Bell className="h-5 w-5 text-vocari-text-muted" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User menu */}
        {user && (
          <div className="flex items-center gap-2">
            <Avatar
              src={user.avatar_url}
              alt={user.full_name}
              size="sm"
            />
            <span className="hidden md:block text-sm text-vocari-text">
              {user.full_name}
            </span>
            <button
              onClick={logout}
              className="p-2 rounded-md hover:bg-gray-100"
              aria-label="Cerrar sesion"
            >
              <LogOut className="h-4 w-4 text-vocari-text-muted" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
