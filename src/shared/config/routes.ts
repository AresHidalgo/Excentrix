/**
 * Rutas internas del sitio en un solo lugar. Las URLs viejas de /maquetas redirigen aquí
 * (firebase.json). La guía de estilo y la maqueta del admin siguen en /maquetas como referencia.
 */
const ROUTE_BASE = '';
const HOME = '/';

export const routes = {
  home: HOME,
  collection: (slug: string) => `${ROUTE_BASE}/coleccion/${slug}`,
  perfume: (slug: string) => `${ROUTE_BASE}/perfume/${slug}`,
  page: (slug: string) => `${ROUTE_BASE}/contenido/${slug}`,
  /** Resultados de búsqueda. */
  search: '/buscar',
} as const;
