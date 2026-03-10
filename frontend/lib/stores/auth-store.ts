import { create } from "zustand";
import type { User, UserRole } from "@/lib/types/user";
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from "@/lib/api";
import { parseUserFromToken } from "@/lib/auth";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  handleAuthCallback: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

/** Obtiene el perfil completo del usuario desde /me */
async function fetchFullProfile(accessToken: string): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const me = await res.json();
    return {
      id: me.id,
      email: me.email,
      full_name: me.name ?? "",
      avatar_url: me.avatar_url ?? null,
      role: me.role,
      institution_id: me.institution?.id ?? null,
      is_active: true,
      created_at: "",
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        set({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // Parseo rápido del JWT para verificar que es válido y obtener el rol
      const quickUser = parseUserFromToken(token);
      if (!quickUser?.role) {
        clearTokens();
        set({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // Mostrar usuario del JWT mientras se carga el perfil completo
      set({ user: quickUser, isAuthenticated: true });

      // Enriquecer con datos completos desde /me
      const fullUser = await fetchFullProfile(token);
      if (fullUser) {
        set({ user: fullUser, isLoading: false });
      } else {
        // Si /me falla, usar los datos del JWT (no cerrar sesión)
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Auth initialize error:", error);
      clearTokens();
      set({ user: null, isLoading: false, isAuthenticated: false });
    }
  },

  handleAuthCallback: async (accessToken: string, refreshToken: string) => {
    try {
      setTokens(accessToken, refreshToken);

      // Parseo rápido para validar el token
      const quickUser = parseUserFromToken(accessToken);
      if (!quickUser?.role) {
        clearTokens();
        set({ user: null, isLoading: false, isAuthenticated: false });
        return;
      }

      // Obtener perfil completo desde /me (incluye avatar_url, etc.)
      const fullUser = await fetchFullProfile(accessToken);
      set({
        user: fullUser ?? quickUser,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Auth callback error:", error);
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
    if (user.role === "super_admin" || user.role === "admin") return true;
    return user.role === role;
  },
}));
