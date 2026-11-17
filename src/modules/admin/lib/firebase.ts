/**
 * Cliente de Firebase para el admin (solo navegador). Usa la configuración web pública del
 * proyecto excentrix-e7794; la seguridad la dan Firebase Auth y las reglas de Firestore.
 */
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/** La base de Firestore del proyecto se llama "default" (no el "(default)" estándar). */
export const DATABASE_ID = 'default';

const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

function app(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Falta la configuración web de Firebase (PUBLIC_FIREBASE_* en .env).');
  }
  return getApps()[0] ?? initializeApp(config);
}

export const auth = (): Auth => getAuth(app());
export const db = (): Firestore => getFirestore(app(), DATABASE_ID);
