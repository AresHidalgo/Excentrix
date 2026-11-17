/**
 * Da (o quita) el rol de administrador a un usuario de Firebase Authentication.
 * Las reglas de Firestore solo dejan escribir a quien tenga el custom claim admin == true.
 *
 *   pnpm firebase:admin correo@dominio.com            simula
 *   pnpm firebase:admin correo@dominio.com --confirm  asigna el rol
 *   pnpm firebase:admin correo@dominio.com --revoke --confirm  lo quita
 *
 * El usuario debe cerrar sesión y volver a entrar al admin para que el cambio aplique.
 * No maneja contraseñas: el usuario se crea en la consola de Firebase.
 */
import { auth, confirmed } from './admin-app';

async function main(): Promise<void> {
  const email = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!email) throw new Error('Uso: pnpm firebase:admin correo@dominio.com [--revoke] [--confirm]');
  const revoke = process.argv.includes('--revoke');

  const user = await auth().getUserByEmail(email);
  const current = user.customClaims ?? {};
  console.log(`Usuario: ${user.email} (uid ${user.uid}) · admin actual: ${current.admin === true}`);

  const next = { ...current, admin: !revoke };
  if (!confirmed) {
    console.log(`Simulación: quedaría admin = ${next.admin}. Agrega --confirm para aplicarlo.`);
    return;
  }
  await auth().setCustomUserClaims(user.uid, next);
  console.log(`Listo: admin = ${next.admin}. Cierra sesión y vuelve a entrar al admin.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
