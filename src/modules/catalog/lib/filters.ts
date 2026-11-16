import { formatPrice } from '@shared/lib/format';
import type { FacetGroup, FacetItem, FacetOption, FilterState } from '../schemas';

/**
 * Filtros del catálogo. Funciones puras sobre FacetItem: no importan del módulo `product`
 * para que la isla del navegador cargue solo lo necesario.
 */

export const EMPTY_FILTERS: FilterState = {
  genders: [],
  brands: [],
  families: [],
  presentations: [],
  sizes: [],
  prices: [],
};

export const PRICE_RANGES = [
  { value: '0-50000', min: 0, max: 50000 },
  { value: '50000-200000', min: 50000, max: 200000 },
  { value: '200000-600000', min: 200000, max: 600000 },
  { value: '600000-', min: 600000, max: Infinity },
] as const;

function priceRangeLabel(min: number, max: number): string {
  if (min === 0) return `Hasta ${formatPrice(max)}`;
  if (max === Infinity) return `Más de ${formatPrice(min)}`;
  return `${formatPrice(min)} – ${formatPrice(max)}`;
}

const GENDER_LABELS: Record<string, string> = {
  hombre: 'Hombre',
  mujer: 'Mujer',
  unisex: 'Unisex',
};
const PRESENTATION_LABELS: Record<string, string> = { decant: 'Decant', frasco: 'Frasco completo' };

function inRange(price: number, value: string): boolean {
  const range = PRICE_RANGES.find((r) => r.value === value);
  return range ? price >= range.min && price < range.max : false;
}

/** Valores de cada filtro para un perfume (los que pueden coincidir). */
function valuesOf(item: FacetItem, key: keyof FilterState): string[] {
  switch (key) {
    case 'genders':
      return [item.gender];
    case 'brands':
      return [item.brand];
    case 'families':
      return item.families;
    case 'presentations':
      return item.presentations;
    case 'sizes':
      return item.sizes.map(String);
    case 'prices':
      return PRICE_RANGES.filter((r) => inRange(item.priceFrom, r.value)).map((r) => r.value);
  }
}

/** O dentro de un mismo filtro, Y entre filtros distintos. */
export function matchesFilters(item: FacetItem, state: FilterState): boolean {
  return (Object.keys(state) as (keyof FilterState)[]).every((key) => {
    const selected = state[key];
    if (selected.length === 0) return true;
    const values = valuesOf(item, key);
    return selected.some((s) => values.includes(s));
  });
}

export function countActiveFilters(state: FilterState): number {
  return Object.values(state).reduce((sum, list) => sum + list.length, 0);
}

function options(
  items: readonly FacetItem[],
  key: keyof FilterState,
  label: (value: string) => string,
  order?: (a: string, b: string) => number,
): FacetOption[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const value of valuesOf(item, key)) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const values = [...counts.keys()].sort(order ?? ((a, b) => a.localeCompare(b, 'es')));
  return values.map((value) => ({ value, label: label(value), count: counts.get(value) ?? 0 }));
}

/** Grupos de filtros con conteos. Se ocultan los que tienen menos de 2 opciones. */
export function buildFacetGroups(items: readonly FacetItem[]): FacetGroup[] {
  const rangeOrder = (a: string, b: string) =>
    PRICE_RANGES.findIndex((r) => r.value === a) - PRICE_RANGES.findIndex((r) => r.value === b);
  const groups: FacetGroup[] = [
    {
      key: 'genders',
      title: 'Género',
      options: options(
        items,
        'genders',
        (v) => GENDER_LABELS[v] ?? v,
        (a, b) => Object.keys(GENDER_LABELS).indexOf(a) - Object.keys(GENDER_LABELS).indexOf(b),
      ),
    },
    { key: 'brands', title: 'Marca', options: options(items, 'brands', (v) => v) },
    {
      key: 'families',
      title: 'Familia olfativa',
      options: options(items, 'families', (v) => v.charAt(0).toUpperCase() + v.slice(1)),
    },
    {
      key: 'presentations',
      title: 'Presentación',
      options: options(items, 'presentations', (v) => PRESENTATION_LABELS[v] ?? v),
    },
    {
      key: 'sizes',
      title: 'Tamaño',
      options: options(
        items,
        'sizes',
        (v) => `${v} ml`,
        (a, b) => Number(a) - Number(b),
      ),
    },
    {
      key: 'prices',
      title: 'Rango de precio',
      options: options(
        items,
        'prices',
        (v) => {
          const r = PRICE_RANGES.find((range) => range.value === v);
          return r ? priceRangeLabel(r.min, r.max) : v;
        },
        rangeOrder,
      ),
    },
  ];
  return groups.filter((g) => g.options.length >= 2);
}
