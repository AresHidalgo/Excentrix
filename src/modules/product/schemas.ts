/**
 * Modelo del perfume (PLAN-EXCENTRIX.md §4). Tipos TS simples por ahora; en la fase 2 se
 * reemplazan por esquemas Zod con los mismos nombres de campo.
 */
export type Gender = 'hombre' | 'mujer' | 'unisex';
export type Concentration = 'EDT' | 'EDP' | 'Parfum' | 'Extrait';
export type House = 'nicho' | 'disenador' | 'arabe';
/** "oferta" no se guarda: se calcula por compareAtPrice. */
export type PerfumeBadge = 'nuevo' | 'bajo-encargo' | 'preventa';
export type VariantType = 'decant' | 'frasco';
export type BottleCondition = 'nuevo' | 'tester';
/** Línea de producto: inspiración, réplica 1.1 u original (ver documents.ts). */
export type Line = 'inspiracion' | 'replica' | 'original';

export interface Variant {
  id: string;
  /** Línea a la que pertenece esta presentación. */
  line: Line;
  type: VariantType;
  ml: number;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  /** Solo aplica a frascos. */
  condition?: BottleCondition;
}

export interface OlfactoryNotes {
  top: string[];
  heart: string[];
  base: string[];
}

export interface PerfumeImage {
  /** URL final (Cloudinary con e_trim,c_pad,ar_4:5,b_white). */
  src: string;
  alt: string;
  width: number;
  height: number;
  kind: 'producto' | 'ambiente';
}

/** Silueta del frasco de reemplazo mientras no hay fotos (solo maquetas). */
export type BottleShape = 'tall' | 'round' | 'faceted' | 'oud';

export interface Perfume {
  id: string;
  /** Si `inspired` es true: nombre de la fragancia de referencia ("Delina"). */
  name: string;
  slug: string;
  brandId: string;
  /** Nombre de la marca ya resuelto en el build (brands/{brandId}.name). */
  brand: string;
  /** Líneas en las que se ofrece (orden: inspiración, réplica 1.1, original). */
  lines: Line[];
  /**
   * Derivado: true si el perfume se ofrece SOLO como inspiración. Entonces `name` y `brand` son la
   * fragancia y la marca de referencia y se muestra "Inspirado en {name} de {brand}".
   */
  inspired?: boolean;
  description: string;
  gender: Gender;
  /** null cuando no se conoce (catálogo importado sin ese dato). */
  concentration: Concentration | null;
  olfactoryFamily: string[];
  notes: OlfactoryNotes;
  house: House;
  categoryIds: string[];
  variants: Variant[];
  badges: PerfumeBadge[];
  leadTime: string | null;
  images: PerfumeImage[];
  featured: boolean;
  sortOrder: number;
  /** ISO 8601. */
  createdAt: string;
  shape: BottleShape;
}
