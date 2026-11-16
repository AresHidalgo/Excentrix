/**
 * Rutas internas del sitio en un solo lugar.
 *
 * En la fase 1 las páginas viven bajo /maquetas con datos de ejemplo. Cuando las rutas reales
 * existan (fase 3), basta con cambiar ROUTE_BASE a '' y HOME a '/'.
 */
const ROUTE_BASE = '/maquetas';
const HOME = `${ROUTE_BASE}/inicio`;

export const routes = {
  home: HOME,
  collection: (slug: string) => `${ROUTE_BASE}/coleccion/${slug}`,
  perfume: (slug: string) => `${ROUTE_BASE}/perfume/${slug}`,
  page: (slug: string) => `${ROUTE_BASE}/contenido/${slug}`,
  /** Resultados de Pagefind (fase 4). */
  search: '/buscar',
} as const;
