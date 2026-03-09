/* Respuesta paginada generica */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/* Respuesta de error de la API */
export interface APIError {
  detail: string;
  code?: string;
  status_code: number;
}

/* Tokens de autenticacion */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/* Respuesta de /auth/me */
export interface AuthMeResponse {
  user: import("./user").User;
  profile: import("./user").UserProfile | null;
}

export * from "./dashboard";

export type NotificationType = "general" | "session_scheduled" | "session_cancelled" | "test_completed" | "analysis_ready" | "consent_required";

export interface NotificationResponse {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  extra_data: Record<string, unknown>;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  total: number;
  unread_count: number;
  page: number;
  per_page: number;
}
