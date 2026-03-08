/* Roles de usuario */
export type UserRole =
  | "super_admin"
  | "admin"
  | "admin_colegio"
  | "orientador"
  | "apoderado"
  | "estudiante";

/* Usuario base */
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  institution_id: string | null;
  is_active: boolean;
  created_at: string;
}

/* Perfil extendido */
export interface UserProfile {
  id: string;
  user_id: string;
  phone: string | null;
  birth_date: string | null;
  grade: string | null;
  section: string | null;
  enrollment_year: number | null;
}
