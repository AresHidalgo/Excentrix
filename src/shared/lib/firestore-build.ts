/**
 * Lectura de Firestore durante el build (solo servidor: usa firebase-admin y nunca llega al
 * navegador). Base "default" del proyecto excentrix-e7794.
 *
 * Credenciales (la primera que exista):
 *   FIREBASE_SERVICE_ACCOUNT        JSON de la cuenta de servicio en una línea (CI, GitHub Secrets)
 *   GOOGLE_APPLICATION_CREDENTIALS  ruta al JSON (desarrollo local, en .env)
 * Sin credenciales, `hasBuildCredentials()` es false y cada módulo usa sus datos de archivo.
 * Con credenciales, cualquier error de lectura detiene el build: nunca se publica un catálogo
 * vacío o a medias.
 */
import { readFileSync } from 'node:fs';
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const FIRESTORE_PROJECT_ID = 'excentrix-e7794';
export const FIRESTORE_DATABASE_ID = 'default';

function serviceAccount(): ServiceAccount | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline?.trim()) return JSON.parse(inline) as ServiceAccount;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path?.trim()) return JSON.parse(readFileSync(path, 'utf8')) as ServiceAccount;
  return null;
}

export function hasBuildCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  );
}

let firestore: Firestore | null = null;
function db(): Firestore {
  if (firestore) return firestore;
  const account = serviceAccount();
  if (!account) throw new Error('Firestore: faltan credenciales de build.');
  const app =
    getApps().find((a) => a.name === 'build') ??
    initializeApp({ credential: cert(account), projectId: FIRESTORE_PROJECT_ID }, 'build');
  firestore = getFirestore(app, FIRESTORE_DATABASE_ID);
  return firestore;
}

/** Documentos de una colección como { id, data } (data sin validar: cada módulo la valida). */
export async function readCollection(
  name: string,
  filter?: { field: string; equals: string },
): Promise<{ id: string; data: unknown }[]> {
  const ref = db().collection(name);
  const snap = await (filter ? ref.where(filter.field, '==', filter.equals) : ref).get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

/** Un documento, o null si no existe. */
export async function readDocument(path: string): Promise<unknown | null> {
  const snap = await db().doc(path).get();
  return snap.exists ? snap.data() : null;
}

let siteSettings: Promise<Record<string, unknown> | null> | null = null;
/** settings/site sin validar (WhatsApp, anuncio, tamaños). null sin credenciales. */
export function readSiteSettings(): Promise<Record<string, unknown> | null> {
  siteSettings ??= hasBuildCredentials()
    ? readDocument('settings/site').then((d) => (d as Record<string, unknown>) ?? null)
    : Promise.resolve(null);
  return siteSettings;
}
