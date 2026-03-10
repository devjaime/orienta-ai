import type { User, UserRole } from "@/lib/types/user";
import type { AuthTokens } from "@/lib/types/api";

/** Auth token management for non-browser contexts (e.g., SSR) */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/** Parse user from JWT payload (for quick access without API call) */
export function parseUserFromToken(token: string | null | undefined): User | null {
  if (!token || typeof token !== "string") return null;
  
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return {
      id: payload.sub,
      email: payload.email,
      full_name: payload.name ?? payload.full_name ?? "",
      role: payload.role as UserRole,
      institution_id: payload.institution_id ?? null,
      avatar_url: null,
      is_active: true,
      created_at: "",
    };
  } catch {
    return null;
  }
}

/** Build the Google OAuth redirect URL */
export function getGoogleAuthUrl(): string {
  // Usar el proxy de Next.js
  return "/api/auth/google";
}

/** Type guard for AuthTokens */
export function isAuthTokens(data: unknown): data is AuthTokens {
  return (
    typeof data === "object" &&
    data !== null &&
    "access_token" in data &&
    "refresh_token" in data
  );
}
