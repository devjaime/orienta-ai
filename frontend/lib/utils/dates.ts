import { format, formatDistanceToNow, parseISO, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

/** Formato de fecha corta: 08/03/2026 */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd/MM/yyyy", { locale: es });
}

/** Formato de fecha larga: 8 de marzo de 2026 */
export function formatDateLong(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Formato de hora: 14:30 */
export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), "HH:mm", { locale: es });
}

/** Formato de fecha y hora: 08/03/2026 14:30 */
export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
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
