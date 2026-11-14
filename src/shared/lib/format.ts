import { SITE } from '@shared/config/site';

const priceFormatter = new Intl.NumberFormat(SITE.lang, {
  style: 'currency',
  currency: SITE.currency,
  maximumFractionDigits: 0,
});

/** Formatea un precio en pesos colombianos: 49999 → "$ 49.999" (según Intl es-CO). */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}
