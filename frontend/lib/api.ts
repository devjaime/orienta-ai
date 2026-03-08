import { API_BASE_URL } from "@/lib/utils/constants";
import type { APIError } from "@/lib/types/api";

/** Token storage keys */
const ACCESS_TOKEN_KEY = "vocari_access_token";
const REFRESH_TOKEN_KEY = "vocari_refresh_token";

/** Get stored access token */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/** Get stored refresh token */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Store tokens */
export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/** Clear stored tokens */
export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/** Custom error for API failures */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/** Attempt to refresh the access token */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

/** Core fetch wrapper with auth headers and token refresh */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers);
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...options, headers });

  // If 401, try refreshing token once
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { ...options, headers });
    }
  }

  if (!res.ok) {
    let detail = "Error del servidor";
    let code: string | undefined;
    try {
      const body: APIError = await res.json();
      detail = body.detail || detail;
      code = body.code;
    } catch {
      // response body is not JSON
    }
    throw new ApiError(res.status, detail, code);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

/** Convenience methods */
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
