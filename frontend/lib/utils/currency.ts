/** Formato de moneda CLP: $1.250.000 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formato de moneda USD: US$125.50 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Formato de numero: 1.000.500 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-CL").format(num);
}

/** Formato de porcentaje: 85,5% */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals).replace(".", ",")}%`;
}
