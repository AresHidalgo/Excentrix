export type {
  Brand,
  Category,
  FacetGroup,
  FacetItem,
  FacetOption,
  FilterState,
  MenuItem,
  SortKey,
} from './schemas';
// Datos de muestra: solo para la guía de estilo y la maqueta del admin (casos especiales).
export {
  getMockBrands,
  getMockCategories,
  getMockPerfumeBySlug,
  getMockPerfumes,
} from './data/mock';
// Catálogo real de la tienda.
export {
  countCollection,
  getBrands,
  getCategories,
  getPerfumeBySlug,
  getPerfumes,
} from './data/catalog';
export { CATALOG_SIZES, getCatalogSizes, type CatalogSize } from './data/pricing';
export {
  buildMenu,
  collectionCategories,
  COLLECTION_RULES,
  getCollectionPerfumes,
  getRelatedPerfumes,
  isCollectionSlug,
  sortPerfumes,
  toFacetItem,
} from './lib/collections';
export {
  buildFacetGroups,
  countActiveFilters,
  EMPTY_FILTERS,
  matchesFilters,
  PRICE_RANGES,
} from './lib/filters';
export { SORT_OPTIONS, sortItems } from './lib/sorting';
// Derivados del perfume: viven en `product` y se reexportan aquí por comodidad.
export { discountPercent, hasDecants, isOnSale, priceFrom } from '@modules/product';
export { default as CollectionResults } from './components/CollectionResults.astro';
export { default as CollectionHero } from './components/CollectionHero.astro';
export { default as EmptyState } from './components/EmptyState.astro';
export { default as ProductCard } from './components/ProductCard.astro';
export { default as ProductGrid } from './components/ProductGrid.astro';
export { default as ProductGridSkeleton } from './components/ProductGridSkeleton.astro';
export { default as ProductRow } from './components/ProductRow.astro';
