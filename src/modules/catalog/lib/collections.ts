import { routes } from '@shared/config/routes';
import { hasDecants, isAvailable, isOnSale, priceFrom, type Perfume } from '@modules/product';
import type { Category, FacetItem, MenuItem, SortKey } from '../schemas';
import { sortItems } from './sorting';

/**
 * Reglas de cada sección del menú (PLAN §4). Las automáticas se calculan solas a partir de los
 * datos del perfume; las manuales leen el campo que el admin asigna (house o categoryIds).
 */
export const COLLECTION_RULES: Record<string, (p: Perfume) => boolean> = {
  // Automáticas
  'nuevos-lanzamientos': (p) => p.badges.includes('nuevo'),
  ofertas: (p) => isOnSale(p),
  hombre: (p) => p.gender === 'hombre',
  mujer: (p) => p.gender === 'mujer',
  unisex: (p) => p.gender === 'unisex',
  decants: (p) => hasDecants(p),
  'bajo-encargo': (p) => p.badges.includes('bajo-encargo'),
  // Manuales
  nicho: (p) => p.house === 'nicho',
  disenador: (p) => p.house === 'disenador',
  arabe: (p) => p.house === 'arabe',
  sets: (p) => p.categoryIds.includes('sets'),
};

/** Proyección liviana del perfume para filtrar y ordenar en el navegador. */
export function toFacetItem(p: Perfume): FacetItem {
  return {
    slug: p.slug,
    gender: p.gender,
    brand: p.brand,
    families: p.olfactoryFamily,
    presentations: [...new Set(p.variants.map((v) => v.type))],
    sizes: [...new Set(p.variants.map((v) => v.ml))].sort((a, b) => a - b),
    priceFrom: priceFrom(p),
    available: isAvailable(p),
    featured: p.featured,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt,
  };
}

export function isCollectionSlug(slug: string): boolean {
  return slug in COLLECTION_RULES;
}

/** Ordena perfumes completos con las mismas reglas que la isla de filtros. */
export function sortPerfumes(perfumes: readonly Perfume[], key: SortKey = 'destacados'): Perfume[] {
  const bySlug = new Map(perfumes.map((p) => [p.slug, p]));
  return sortItems(perfumes.map(toFacetItem), key).map((item) => bySlug.get(item.slug)!);
}

/** Perfumes de una colección, ya ordenados (agotados al final). */
export function getCollectionPerfumes(
  perfumes: readonly Perfume[],
  slug: string,
  sort: SortKey = 'destacados',
): Perfume[] {
  const rule = COLLECTION_RULES[slug];
  return rule ? sortPerfumes(perfumes.filter(rule), sort) : [];
}

/** Categorías que tienen página propia (todas menos los grupos como "Género"). */
export function collectionCategories(categories: readonly Category[]): Category[] {
  return categories.filter((c) => isCollectionSlug(c.slug));
}

/** Arma el menú (escritorio y panel móvil) a partir de las categorías visibles. */
export function buildMenu(categories: readonly Category[]): MenuItem[] {
  const visible = categories.filter((c) => c.showInMenu);
  const byOrder = (a: Category, b: Category) => a.menuOrder - b.menuOrder;
  return visible
    .filter((c) => c.parentId === null)
    .sort(byOrder)
    .map((c) => {
      const children = visible.filter((child) => child.parentId === c.id).sort(byOrder);
      return children.length > 0
        ? {
            label: c.name,
            children: children.map((child) => ({
              label: child.name,
              href: routes.collection(child.slug),
            })),
          }
        : { label: c.name, href: routes.collection(c.slug) };
    });
}

/** Perfumes relacionados: misma casa o familia, sin repetir el actual, disponibles primero. */
export function getRelatedPerfumes(
  perfumes: readonly Perfume[],
  current: Perfume,
  limit = 4,
): Perfume[] {
  const score = (p: Perfume) =>
    (p.house === current.house ? 2 : 0) +
    (p.gender === current.gender ? 1 : 0) +
    p.olfactoryFamily.filter((f) => current.olfactoryFamily.includes(f)).length;
  const candidates = perfumes.filter((p) => p.slug !== current.slug);
  return sortPerfumes(candidates)
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((a, b) => Number(isAvailable(b.p)) - Number(isAvailable(a.p)) || b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map(({ p }) => p);
}
