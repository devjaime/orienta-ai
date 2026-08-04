import { format, formatDistanceToNow, parseISO, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

/** Formato de fecha corta: 08/03/2026 */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd/MM/yyyy", { locale: es });
}

/** Alias compatible con las pantallas que explicitan formato chileno. */
export function formatDateCL(date: string | Date): string {
  const parsedDate = date instanceof Date ? date : parseISO(date);
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

/** Formato de fecha larga: 8 de marzo de 2026 */
export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Formato de hora: 14:30 */
export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), "HH:mm", { locale: es });
}

/** Hora localizada para Chile; acepta Date para mensajes creados en el cliente. */
export function formatTimeCL(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  },
): string {
  const parsedDate = date instanceof Date ? date : parseISO(date);
  return new Intl.DateTimeFormat("es-CL", options).format(parsedDate);
}

/** Formato de fecha y hora: 08/03/2026 14:30 */
export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
}

/** Fecha y hora chilena con fallback para datos opcionales del backend. */
export function formatDateTimeCL(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/D";
  return formatDateTime(dateStr);
}

/** Tiempo relativo: "hace 2 horas" */
export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: es });
}

/** Etiqueta amigable para sesiones: "Hoy 14:30", "Manana 10:00", "8 de marzo 14:30" */
export function formatSessionDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const time = format(date, "HH:mm");

  if (isToday(date)) return `Hoy ${time}`;
  if (isTomorrow(date)) return `Manana ${time}`;
  return `${format(date, "d 'de' MMMM", { locale: es })} ${time}`;
}
