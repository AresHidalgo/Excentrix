import type { BottleShape, Gender, House, Perfume } from '@modules/product';
import { COLLECTION_RULES } from '../lib/collections';
import type { Brand, Category } from '../schemas';
import catalogo from './catalogo.json';
import marcas from './marcas.json';
import { getMockCategories } from './mock';
import { CATALOG_SIZES } from './pricing';

/**
 * Catálogo real de Excentrix (versiones inspiradas), importado del catálogo PDF con
 * scripts/catalogo/importar_catalogo.py. Es la fuente de la tienda hasta la fase 2, cuando
 * estos datos se cargan en Firestore y estas funciones pasan a leer de ahí con la misma firma.
 */

interface CatalogoItem {
  id: string;
  slug: string;
  inspiradoEn: string;
  marcaId: string;
  genero: Gender;
}

interface MarcaItem {
  id: string;
  nombre: string;
  slug: string;
  casa: House;
  casaPorConfirmar: boolean;
}

const HOUSE_TEXT: Record<House, string> = {
  disenador: 'de diseñador',
  nicho: 'de nicho',
  arabe: 'árabe',
};

const GENDER_TEXT: Record<Gender, string> = {
  hombre: 'masculina',
  mujer: 'femenina',
  unisex: 'unisex',
};

const SHAPES: readonly BottleShape[] = ['tall', 'round', 'faceted', 'oud'];

/** Silueta estable por perfume (mientras no hay fotos): misma entrada, misma forma. */
function shapeFor(slug: string): BottleShape {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return SHAPES[hash % SHAPES.length];
}

const BRANDS: Brand[] = (marcas as MarcaItem[]).map((m) => ({
  id: m.id,
  name: m.nombre,
  slug: m.slug,
}));

const HOUSE_BY_BRAND = new Map((marcas as MarcaItem[]).map((m) => [m.id, m.casa]));
const BRAND_NAME = new Map(BRANDS.map((b) => [b.id, b.name]));

const PERFUMES: Perfume[] = (catalogo as CatalogoItem[]).map((item, index) => {
  const brand = BRAND_NAME.get(item.marcaId) ?? item.marcaId;
  const house = HOUSE_BY_BRAND.get(item.marcaId) ?? 'disenador';
  return {
    id: item.id,
    name: item.inspiradoEn,
    slug: item.slug,
    brandId: item.marcaId,
    brand,
    inspired: true,
    description: `Fragancia ${GENDER_TEXT[item.genero]} inspirada en ${item.inspiradoEn} de ${brand}, de nuestra línea ${HOUSE_TEXT[house]}. Disponible en 30, 60 y 100 ml.`,
    gender: item.genero,
    concentration: null,
    olfactoryFamily: [],
    notes: { top: [], heart: [], base: [] },
    house,
    categoryIds: [],
    variants: CATALOG_SIZES.map((size) => ({
      id: `f${size.ml}`,
      type: 'frasco' as const,
      ml: size.ml,
      price: size.price,
      compareAtPrice: null,
      available: true,
      condition: 'nuevo' as const,
    })),
    badges: [],
    leadTime: null,
    images: [],
    featured: false,
    sortOrder: index,
    createdAt: '2026-01-01T00:00:00.000Z',
    shape: shapeFor(item.slug),
  };
});

export function getPerfumes(): Perfume[] {
  return PERFUMES;
}

export function getPerfumeBySlug(slug: string): Perfume | undefined {
  return PERFUMES.find((p) => p.slug === slug);
}

export function getBrands(): Brand[] {
  return BRANDS;
}

/** Cantidad de perfumes del catálogo en una colección. */
export function countCollection(slug: string): number {
  const rule = COLLECTION_RULES[slug];
  return rule ? PERFUMES.filter(rule).length : 0;
}

/**
 * Secciones del menú. Las colecciones sin perfumes en el catálogo (hoy: Nuevos, Ofertas,
 * Decants, Sets y Bajo encargo) se ocultan del menú; su página sigue existiendo.
 */
export function getCategories(): Category[] {
  const all = getMockCategories();
  const groups = new Set(all.map((c) => c.parentId).filter(Boolean));
  return all.map((c) => ({
    ...c,
    showInMenu: c.showInMenu && (groups.has(c.id) || countCollection(c.slug) > 0),
  }));
}
