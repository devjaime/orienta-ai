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
export function parseUserFromToken(token: string): Partial<User> | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
      institution_id: payload.institution_id,
    };
  } catch {
    return null;
  }
}

/** Build the Google OAuth redirect URL */
export function getGoogleAuthUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${apiUrl}/api/v1/auth/google`;
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
