/**
 * Inicializa firebase-admin para los scripts locales.
 * Credenciales: GOOGLE_APPLICATION_CREDENTIALS con la ruta al JSON de la cuenta de servicio
 * (fuera de git), o FIREBASE_SERVICE_ACCOUNT con el JSON en una línea (CI).
 */
import { readFileSync } from 'node:fs';
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const PROJECT_ID = 'excentrix-e7794';
/** La base de Firestore del proyecto se llama "default" (no el "(default)" estándar). */
export const DATABASE_ID = 'default';

function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) return JSON.parse(inline) as ServiceAccount;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) return JSON.parse(readFileSync(path, 'utf8')) as ServiceAccount;
  throw new Error(
    'Faltan credenciales: define GOOGLE_APPLICATION_CREDENTIALS (ruta al JSON) o FIREBASE_SERVICE_ACCOUNT.',
  );
}

function app(): App {
  return (
    getApps()[0] ?? initializeApp({ credential: cert(loadServiceAccount()), projectId: PROJECT_ID })
  );
}

export const db = () => getFirestore(app(), DATABASE_ID);
export const auth = () => getAuth(app());

/** true solo si el comando incluye --confirm. Sin él, los scripts simulan y no escriben. */
export const confirmed = process.argv.includes('--confirm');
