/**
 * Carga inicial del catálogo en Firestore (base "default").
 *
 *   pnpm firebase:seed            simula: muestra qué crearía, no escribe
 *   pnpm firebase:seed --confirm  escribe
 *
 * Solo CREA lo que falta: un perfume, marca o ajuste que ya existe en Firestore nunca se
 * sobrescribe, así las ediciones hechas desde el admin se conservan. Se puede repetir.
 * Revertir: borrar las colecciones perfumes, brands y el documento settings/site.
 */
import catalogo from '../../src/modules/catalog/data/catalogo.json' with { type: 'json' };
import marcas from '../../src/modules/catalog/data/marcas.json' with { type: 'json' };
import { CATALOG_SIZES } from '../../src/modules/catalog/data/pricing';
import {
  BrandDocSchema,
  PerfumeDocSchema,
  SiteSettingsDocSchema,
  type BrandDoc,
  type PerfumeDoc,
  type SiteSettingsDoc,
} from '../../src/modules/product/documents';
import { confirmed, db } from './admin-app';

type House = PerfumeDoc['house'];
type Gender = PerfumeDoc['gender'];

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

const now = new Date().toISOString();

const brands = new Map<string, BrandDoc>(
  marcas.map((m) => [
    m.id,
    BrandDocSchema.parse({
      name: m.nombre,
      slug: m.slug,
      house: m.casa,
      housePending: m.casaPorConfirmar,
    }),
  ]),
);

const perfumes: PerfumeDoc[] = catalogo.map((item, index) => {
  const brand = brands.get(item.marcaId);
  if (!brand) throw new Error(`Marca desconocida "${item.marcaId}" en ${item.slug}`);
  const gender = item.genero as Gender;
  return PerfumeDocSchema.parse({
    slug: item.slug,
    name: item.inspiradoEn,
    brandId: item.marcaId,
    inspired: true,
    description: `Fragancia ${GENDER_TEXT[gender]} inspirada en ${item.inspiradoEn} de ${brand.name}, de nuestra línea ${HOUSE_TEXT[brand.house]}.`,
    gender,
    house: brand.house,
    concentration: null,
    olfactoryFamily: [],
    notes: { top: [], heart: [], base: [] },
    categoryIds: [],
    sizes: CATALOG_SIZES.map((s) => ({ ml: s.ml, available: true })),
    badges: [],
    leadTime: null,
    images: [],
    featured: false,
    sortOrder: index,
    status: 'published',
    createdAt: now,
    updatedAt: now,
  });
});

const settings: SiteSettingsDoc = SiteSettingsDocSchema.parse({
  sizes: CATALOG_SIZES.map((s) => ({ ml: s.ml, price: s.price, note: s.note })),
  whatsappNumber: null,
  announcementBar: { text: 'Envío gratis por compras desde $179.999', active: true },
  updatedAt: now,
});

async function missingIds(collection: string, ids: string[]): Promise<Set<string>> {
  const refs = ids.map((id) => db().collection(collection).doc(id));
  const existing = new Set<string>();
  for (let i = 0; i < refs.length; i += 300) {
    const snaps = await db().getAll(...refs.slice(i, i + 300));
    snaps.forEach((s) => s.exists && existing.add(s.id));
  }
  return new Set(ids.filter((id) => !existing.has(id)));
}

async function writeMissing<T extends object>(
  collection: string,
  docs: Map<string, T>,
): Promise<number> {
  const missing = await missingIds(collection, [...docs.keys()]);
  console.log(
    `${collection}: ${docs.size} en el catálogo, ${docs.size - missing.size} ya existen, ${missing.size} por crear`,
  );
  if (!confirmed || missing.size === 0) return 0;
  const ids = [...missing];
  for (let i = 0; i < ids.length; i += 400) {
    const batch = db().batch();
    for (const id of ids.slice(i, i + 400))
      batch.create(db().collection(collection).doc(id), docs.get(id)!);
    await batch.commit();
  }
  return missing.size;
}

async function main(): Promise<void> {
  console.log(
    confirmed ? 'Modo: ESCRITURA (--confirm)' : 'Modo: simulación (agrega --confirm para escribir)',
  );
  const createdBrands = await writeMissing('brands', brands);
  const createdPerfumes = await writeMissing('perfumes', new Map(perfumes.map((p) => [p.slug, p])));
  const createdSettings = await writeMissing('settings', new Map([['site', settings]]));
  if (confirmed) {
    console.log(
      `Creados: ${createdBrands} marcas, ${createdPerfumes} perfumes, ${createdSettings} ajustes.`,
    );
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
