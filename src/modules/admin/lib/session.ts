/**
 * Sesión del administrador: login con correo y contraseña de Firebase Auth.
 * Solo es admin quien tiene el custom claim admin == true (se asigna con
 * `pnpm firebase:admin correo --confirm`); las reglas de Firestore exigen lo mismo.
 */
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export type SessionState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'not-admin'; email: string | null }
  | { status: 'admin'; user: User };

/** Escucha cambios de sesión y entrega el estado ya resuelto (incluye la verificación de rol). */
export function watchSession(callback: (state: SessionState) => void): () => void {
  callback({ status: 'loading' });
  return onIdTokenChanged(auth(), async (user) => {
    if (!user) return callback({ status: 'signed-out' });
    const token = await user.getIdTokenResult();
    callback(
      token.claims.admin === true
        ? { status: 'admin', user }
        : { status: 'not-admin', email: user.email },
    );
  });
}

const AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
};

/** Inicia sesión. Devuelve un mensaje de error en español, o null si entró. */
export async function signIn(email: string, password: string): Promise<string | null> {
  try {
    await signInWithEmailAndPassword(auth(), email.trim(), password);
    return null;
  } catch (error) {
    const code = (error as { code?: string }).code ?? '';
    return AUTH_ERRORS[code] ?? 'No pudimos iniciar sesión. Intenta de nuevo.';
  }
}

export function signOut(): Promise<void> {
  return firebaseSignOut(auth());
}
