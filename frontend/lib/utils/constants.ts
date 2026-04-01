/** Constantes de la aplicacion */

export const APP_NAME = "Vocari";
export const APP_DESCRIPTION =
  "Orientacion vocacional inteligente para colegios chilenos";

/** Backend API base URL - usa proxy si no hay variable configurada */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Nombres de rutas por rol */
export const ROLE_HOME_ROUTES: Record<string, string> = {
  estudiante: "/estudiante",
  orientador: "/orientador",
  apoderado: "/apoderado",
  admin_colegio: "/admin",
  admin: "/super-admin",
  super_admin: "/super-admin",
};

/** TanStack Query stale times (en ms) */
export const STALE_TIMES = {
  careers: 60 * 60 * 1000, // 1 hora
  dashboard: 5 * 60 * 1000, // 5 minutos
  sessions: 1 * 60 * 1000, // 1 minuto
  profile: 5 * 60 * 1000, // 5 minutos
} as const;

/** Colores RIASEC para charts y badges */
export const RIASEC_COLORS: Record<string, string> = {
  R: "#e53e3e",
  I: "#3182ce",
  A: "#805ad5",
  S: "#38a169",
  E: "#d69e2e",
  C: "#4a5568",
};

/** Dias de la semana (es-CL) */
export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
] as const;
