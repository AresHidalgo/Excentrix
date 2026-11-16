import type { FacetItem, SortKey } from '../schemas';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'novedades', label: 'Novedades' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
];

type Sortable = Pick<FacetItem, 'available' | 'featured' | 'sortOrder' | 'createdAt' | 'priceFrom'>;

const COMPARATORS: Record<SortKey, (a: Sortable, b: Sortable) => number> = {
  destacados: (a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder,
  novedades: (a, b) => b.createdAt.localeCompare(a.createdAt),
  'precio-asc': (a, b) => a.priceFrom - b.priceFrom,
  'precio-desc': (a, b) => b.priceFrom - a.priceFrom,
};

/**
 * Ordena sin mutar. Los perfumes sin ninguna presentación disponible siempre bajan al final
 * (PLAN §5, "Precios").
 */
export function sortItems<T extends Sortable>(items: readonly T[], key: SortKey): T[] {
  const compare = COMPARATORS[key];
  return [...items].sort((a, b) => Number(b.available) - Number(a.available) || compare(a, b));
}
