/**
 * Lectura y escritura del catálogo en Firestore desde el admin. Todo lo que se guarda pasa
 * antes por los esquemas Zod (product/documents.ts); las reglas de Firestore exigen el rol admin.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import {
  BrandDocSchema,
  PerfumeDocSchema,
  SiteSettingsDocSchema,
  type BrandDoc,
  type PerfumeDoc,
  type SiteSettingsDoc,
} from '@modules/product/documents';
import { db } from './firebase';

export type Validated<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

/** Valida con Zod y devuelve los errores por campo ("notes.top", "images.0.url"…). */
export function validatePerfume(input: unknown): Validated<PerfumeDoc> {
  const result = PerfumeDocSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}

export async function listPerfumes(): Promise<PerfumeDoc[]> {
  const snap = await getDocs(collection(db(), 'perfumes'));
  return snap.docs
    .map((d) => PerfumeDocSchema.safeParse(d.data()))
    .filter((r) => r.success)
    .map((r) => r.data)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPerfume(slug: string): Promise<PerfumeDoc | null> {
  const snap = await getDoc(doc(db(), 'perfumes', slug));
  if (!snap.exists()) return null;
  const parsed = PerfumeDocSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : null;
}

/** Guarda un perfume existente (actualiza updatedAt). */
export async function savePerfume(perfume: PerfumeDoc): Promise<void> {
  const data = PerfumeDocSchema.parse({ ...perfume, updatedAt: new Date().toISOString() });
  await setDoc(doc(db(), 'perfumes', data.slug), data);
}

/** Crea un perfume nuevo; falla si ya existe uno con ese slug. */
export async function createPerfume(perfume: PerfumeDoc): Promise<void> {
  const now = new Date().toISOString();
  const data = PerfumeDocSchema.parse({ ...perfume, createdAt: now, updatedAt: now });
  const ref = doc(db(), 'perfumes', data.slug);
  await runTransaction(db(), async (tx) => {
    if ((await tx.get(ref)).exists())
      throw new Error(`Ya existe un perfume con la URL "${data.slug}".`);
    tx.set(ref, data);
  });
}

export function deletePerfume(slug: string): Promise<void> {
  return deleteDoc(doc(db(), 'perfumes', slug));
}

export async function listBrands(): Promise<(BrandDoc & { id: string })[]> {
  const snap = await getDocs(collection(db(), 'brands'));
  return snap.docs
    .map((d) => ({ id: d.id, parsed: BrandDocSchema.safeParse(d.data()) }))
    .filter((r) => r.parsed.success)
    .map((r) => ({ id: r.id, ...r.parsed.data! }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

export async function getSettings(): Promise<SiteSettingsDoc | null> {
  const snap = await getDoc(doc(db(), 'settings', 'site'));
  if (!snap.exists()) return null;
  const parsed = SiteSettingsDocSchema.safeParse(snap.data());
  return parsed.success ? parsed.data : null;
}

export async function saveSettings(settings: SiteSettingsDoc): Promise<void> {
  const data = SiteSettingsDocSchema.parse({ ...settings, updatedAt: new Date().toISOString() });
  await setDoc(doc(db(), 'settings', 'site'), data);
}

/** URL del perfume a partir del nombre y la marca: "delina-parfums-de-marly". */
export function slugFor(name: string, brandSlug: string): string {
  return `${name} ${brandSlug}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
