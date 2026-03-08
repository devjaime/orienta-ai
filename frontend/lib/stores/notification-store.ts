import { create } from "zustand";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (n: Omit<Notification, "id" | "read" | "created_at">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

let notifCounter = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: `notif-${++notifCounter}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    }));
  },

  markAsRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllAsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
