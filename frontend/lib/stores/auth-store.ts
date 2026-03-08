import { create } from "zustand";
import type { User, UserRole } from "@/lib/types/user";
import { api } from "@/lib/api";
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from "@/lib/api";
import { parseUserFromToken } from "@/lib/auth";
import type { AuthMeResponse } from "@/lib/types/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  /** Initialize auth state from stored token */
  initialize: () => Promise<void>;
  /** Store tokens and fetch user profile */
  handleAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  /** Logout: clear tokens and state */
  logout: () => void;
  /** Check if user has a specific role */
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    // Quick parse from JWT while we fetch full profile
    const quickUser = parseUserFromToken(token);
    if (quickUser) {
      set({ user: quickUser as User, isAuthenticated: true });
    }

    try {
      const data = await api.get<AuthMeResponse>("/api/v1/auth/me");
      set({ user: data.user, isLoading: false, isAuthenticated: true });
    } catch {
      clearTokens();
      set({ user: null, isLoading: false, isAuthenticated: false });
    }
  },

  handleAuthCallback: async (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    try {
      const data = await api.get<AuthMeResponse>("/api/v1/auth/me");
      set({ user: data.user, isLoading: false, isAuthenticated: true });
    } catch {
      clearTokens();
      set({ user: null, isLoading: false, isAuthenticated: false });
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, isLoading: false, isAuthenticated: false });
  },

  hasRole: (role: UserRole) => {
    const { user } = get();
    if (!user) return false;
    // super_admin and admin have all privileges
    if (user.role === "super_admin" || user.role === "admin") return true;
    return user.role === role;
  },
}));
