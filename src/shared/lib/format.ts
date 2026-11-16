/**
 * Formatea un precio en pesos colombianos: 49999 → "$ 49.999".
 *
 * No usa Intl.NumberFormat a propósito: algunos Node (compilados con small-icu) no traen el locale
 * es-CO y devuelven "COP 49,999", lo que rompe el build y desajusta la hidratación de las islas.
 * El espacio después de "$" es de no separación para que el precio nunca se parta en dos líneas.
 */
export function formatPrice(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const grouped = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}$\u00A0${grouped}`;
}

/** Porcentaje de descuento con el formato del plan: "-10 %" (espacio de no separación). */
export function formatDiscount(percent: number): string {
  return `-${Math.round(percent)}\u00A0%`;
}
