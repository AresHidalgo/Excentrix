/**
 * Tamaños y precios del catálogo (página 1 del catálogo PDF, "Elige tu tamaño").
 * Un solo precio por tamaño para todo el catálogo: cambiarlo aquí actualiza cada perfume.
 * En la fase 2 pasa a Firestore (settings/site.sizes) con los mismos campos.
 */
export interface CatalogSize {
  ml: number;
  price: number;
  /** Frase corta del PDF para cada tamaño. */
  note: string;
}

export const CATALOG_SIZES: readonly CatalogSize[] = [
  { ml: 30, price: 30000, note: 'Perfecto para regalar' },
  { ml: 60, price: 60000, note: 'Perfecto para viajar' },
  { ml: 100, price: 100000, note: 'Aroma distintivo diario' },
];
