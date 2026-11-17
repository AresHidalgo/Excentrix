import { hasBuildCredentials, readCollection, readSiteSettings } from '@shared/lib/firestore-build';
import {
  linesOf,
  type BottleShape,
  type Gender,
  type House,
  type Perfume,
  type PerfumeImage,
  type Variant,
} from '@modules/product';
import {
  BrandDocSchema,
  CatalogSizeSchema,
  PerfumeDocSchema,
  type CatalogSizeDoc,
  type PerfumeDoc,
} from '@modules/product/documents';
import { COLLECTION_RULES } from '../lib/collections';
import type { Brand, Category } from '../schemas';
import catalogo from './catalogo.json';
import marcas from './marcas.json';
import { getMockCategories } from './mock';
import { CATALOG_SIZES, type CatalogSize } from './pricing';

/**
 * Catálogo de la tienda (versiones inspiradas).
 *
 * Fuente:
 *   - Firestore (base "default") cuando el build tiene credenciales: lo que se edita en /admin.
 *     Solo perfumes con status "published". Si la lectura falla, el build se detiene.
 *   - Sin credenciales (p. ej. desarrollo sin .env): catalogo.json / marcas.json, generados por
 *     scripts/catalogo/importar_catalogo.py. Son también la carga inicial de Firestore.
 *
 * Los datos se cargan una vez al inicio del build; las funciones de abajo son síncronas.
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

interface BrandEntry extends Brand {
  house: House;
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

const byMl = (a: { ml: number }, b: { ml: number }) => a.ml - b.ml;

/** Foto de Cloudinary encuadrada 4:5 sobre blanco (PLAN §7, fotografía). */
function cloudinarySrc(url: string, width = 800): string {
  return url.replace('/upload/', `/upload/c_pad,ar_4:5,b_white,f_auto,q_auto,w_${width}/`);
}

function toPerfume(
  doc: PerfumeDoc,
  brand: BrandEntry | undefined,
  sizes: readonly CatalogSize[],
): Perfume {
  const priceOf = new Map(sizes.map((s) => [s.ml, s.price]));
  const { inspiracion, replica, original } = doc.offers;
  const frasco = (
    line: Variant['line'],
    ml: number,
    price: number,
    available: boolean,
  ): Variant => ({
    id: `${line}-${ml}`,
    line,
    type: 'frasco',
    ml,
    price,
    compareAtPrice: null,
    available,
    condition: 'nuevo',
  });
  const variants: Variant[] = [
    // Inspiración: precio de la tabla única (solo tamaños que existan en la tabla).
    ...(inspiracion.active
      ? [...inspiracion.sizes]
          .sort(byMl)
          .filter((s) => priceOf.has(s.ml))
          .map((s) => frasco('inspiracion', s.ml, priceOf.get(s.ml)!, s.available))
      : []),
    // Réplica 1.1 y Original: precio propio del perfume.
    ...(replica.active
      ? [...replica.sizes].sort(byMl).map((s) => frasco('replica', s.ml, s.price, s.available))
      : []),
    ...(original.active
      ? [...original.sizes].sort(byMl).map((s) => frasco('original', s.ml, s.price, s.available))
      : []),
  ];
  const lines = linesOf(variants);
  const images: PerfumeImage[] = doc.images.map((img) => ({
    src: cloudinarySrc(img.url),
    alt: img.alt,
    width: 800,
    height: 1000,
    kind: img.kind,
  }));
  return {
    id: doc.slug,
    name: doc.name,
    slug: doc.slug,
    brandId: doc.brandId,
    brand: brand?.name ?? doc.brandId,
    lines,
    // Solo inspiración: se muestra "Inspirado en {name} de {brand}".
    inspired: lines.length === 1 && lines[0] === 'inspiracion',
    description: doc.description,
    gender: doc.gender,
    concentration: doc.concentration,
    olfactoryFamily: doc.olfactoryFamily,
    notes: doc.notes,
    house: doc.house,
    categoryIds: doc.categoryIds,
    variants,
    badges: doc.badges,
    leadTime: doc.leadTime,
    images,
    featured: doc.featured,
    sortOrder: doc.sortOrder,
    createdAt: doc.createdAt,
    shape: shapeFor(doc.slug),
  };
}

interface CatalogData {
  source: 'firestore' | 'archivo';
  brands: BrandEntry[];
  perfumes: Perfume[];
  sizes: readonly CatalogSize[];
}

async function fromFirestore(): Promise<CatalogData> {
  const [brandDocs, perfumeDocs, settings] = await Promise.all([
    readCollection('brands'),
    readCollection('perfumes', { field: 'status', equals: 'published' }),
    readSiteSettings(),
  ]);

  const brands: BrandEntry[] = brandDocs.map(({ id, data }) => {
    const b = BrandDocSchema.parse(data);
    return { id, name: b.name, slug: b.slug, house: b.house };
  });
  const sizes: CatalogSizeDoc[] = Array.isArray(settings?.sizes)
    ? (settings.sizes as unknown[]).map((s) => CatalogSizeSchema.parse(s))
    : [...CATALOG_SIZES];

  const brandById = new Map(brands.map((b) => [b.id, b]));
  const perfumes = perfumeDocs
    .map(({ id, data }) => {
      const parsed = PerfumeDocSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(
          `Firestore: el perfume "${id}" no es válido: ${parsed.error.issues[0]?.message}`,
        );
      }
      return toPerfume(parsed.data, brandById.get(parsed.data.brandId), sizes);
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (perfumes.length === 0)
    throw new Error('Firestore: no hay perfumes publicados; se detiene el build.');
  return { source: 'firestore', brands, perfumes, sizes };
}

function fromFiles(): CatalogData {
  const brands: BrandEntry[] = (marcas as MarcaItem[]).map((m) => ({
    id: m.id,
    name: m.nombre,
    slug: m.slug,
    house: m.casa,
  }));
  const brandById = new Map(brands.map((b) => [b.id, b]));
  const now = '2026-01-01T00:00:00.000Z';
  const perfumes = (catalogo as CatalogoItem[]).map((item, index) => {
    const brand = brandById.get(item.marcaId);
    const house = brand?.house ?? 'disenador';
    const doc: PerfumeDoc = {
      slug: item.slug,
      name: item.inspiradoEn,
      brandId: item.marcaId,
      description: `Fragancia ${GENDER_TEXT[item.genero]} inspirada en ${item.inspiradoEn} de ${brand?.name ?? item.marcaId}, de nuestra línea ${HOUSE_TEXT[house]}.`,
      gender: item.genero,
      house,
      concentration: null,
      olfactoryFamily: [],
      notes: { top: [], heart: [], base: [] },
      categoryIds: [],
      offers: {
        inspiracion: {
          active: true,
          sizes: CATALOG_SIZES.map((s) => ({ ml: s.ml, available: true })),
        },
        replica: { active: false, sizes: [] },
        original: { active: false, sizes: [] },
      },
      badges: [],
      leadTime: null,
      images: [],
      featured: false,
      sortOrder: index,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    };
    return toPerfume(doc, brand, CATALOG_SIZES);
  });
  return { source: 'archivo', brands, perfumes, sizes: CATALOG_SIZES };
}

const DATA: CatalogData = hasBuildCredentials() ? await fromFirestore() : fromFiles();
console.info(
  `[catálogo] fuente: ${DATA.source} · ${DATA.perfumes.length} perfumes · ${DATA.brands.length} marcas`,
);

const PERFUMES = DATA.perfumes;
const BRANDS: Brand[] = DATA.brands.map(({ id, name, slug }) => ({ id, name, slug }));

export function getCatalogSource(): CatalogData['source'] {
  return DATA.source;
}

export function getPerfumes(): Perfume[] {
  return PERFUMES;
}

export function getPerfumeBySlug(slug: string): Perfume | undefined {
  return PERFUMES.find((p) => p.slug === slug);
}

export function getBrands(): Brand[] {
  return BRANDS;
}

/** Tamaños y precios vigentes (Firestore settings/site o, sin credenciales, pricing.ts). */
export function getCatalogSizes(): readonly CatalogSize[] {
  return DATA.sizes;
}

/** Cantidad de perfumes del catálogo en una colección. */
export function countCollection(slug: string): number {
  const rule = COLLECTION_RULES[slug];
  return rule ? PERFUMES.filter(rule).length : 0;
}

/**
 * Secciones del menú. Las colecciones sin perfumes en el catálogo se ocultan del menú; su página
 * sigue existiendo.
 */
export function getCategories(): Category[] {
  const all = getMockCategories();
  const groups = new Set(all.map((c) => c.parentId).filter(Boolean));
  return all.map((c) => ({
    ...c,
    showInMenu: c.showInMenu && (groups.has(c.id) || countCollection(c.slug) > 0),
  }));
}
