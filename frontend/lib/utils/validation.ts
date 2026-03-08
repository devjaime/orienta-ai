/** Utilidades de validacion comunes */

/** Valida un RUT chileno (formato: 12.345.678-K) */
export function validateRUT(rut: string): boolean {
  const cleaned = rut.replace(/[.\-]/g, "");
  if (cleaned.length < 2) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDV = 11 - (sum % 11);
  const dvChar =
    expectedDV === 11 ? "0" : expectedDV === 10 ? "K" : String(expectedDV);

  return dv === dvChar;
}

/** Valida un email basico */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Utilidad para combinar classNames (similar a clsx) */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
