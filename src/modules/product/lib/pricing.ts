import type { Perfume, Variant } from '../schemas';

/**
 * Derivados del perfume (PLAN §4). Viven en `product` porque los usan la ficha y el catálogo;
 * `catalog` los reexporta. Todas son funciones puras.
 */

export function availableVariants(perfume: Perfume): Variant[] {
  return perfume.variants.filter((v) => v.available);
}

export function isAvailable(perfume: Perfume): boolean {
  return perfume.variants.some((v) => v.available);
}

export function hasDecants(perfume: Perfume): boolean {
  return perfume.variants.some((v) => v.type === 'decant');
}

export function hasBottle(perfume: Perfume): boolean {
  return perfume.variants.some((v) => v.type === 'frasco');
}

/** Presentación disponible más barata (la que alimenta "Desde $X"). */
export function cheapestVariant(perfume: Perfume): Variant | null {
  const pool = availableVariants(perfume);
  if (pool.length === 0) return null;
  return pool.reduce((min, v) => (v.price < min.price ? v : min));
}

/** Precio más bajo disponible; si todo está agotado, el más bajo de todos (para ordenar). */
export function priceFrom(perfume: Perfume): number {
  const pool = availableVariants(perfume);
  const prices = (pool.length > 0 ? pool : perfume.variants).map((v) => v.price);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function variantOnSale(variant: Variant): boolean {
  return variant.compareAtPrice !== null && variant.compareAtPrice > variant.price;
}

export function isOnSale(perfume: Perfume): boolean {
  return perfume.variants.some(variantOnSale);
}

/** Descuento de una presentación en % (0 si no está en oferta). */
export function variantDiscount(variant: Variant): number {
  if (!variantOnSale(variant) || variant.compareAtPrice === null) return 0;
  return Math.round((1 - variant.price / variant.compareAtPrice) * 100);
}

/** Mayor descuento del perfume, para la insignia "-10 %". */
export function discountPercent(perfume: Perfume): number {
  return perfume.variants.reduce((max, v) => Math.max(max, variantDiscount(v)), 0);
}

/** Tamaños únicos ordenados de una presentación. */
export function sizesOf(perfume: Perfume, type: Variant['type']): number[] {
  return [...new Set(perfume.variants.filter((v) => v.type === type).map((v) => v.ml))].sort(
    (a, b) => a - b,
  );
}
