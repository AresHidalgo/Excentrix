/**
 * Migración: de { inspired, sizes } a { offers: { inspiracion, replica, original } }.
 *
 *   pnpm firebase:migrate-offers                     simula: cuenta qué migraría
 *   pnpm firebase:migrate-offers --confirm           respalda y migra
 *   pnpm firebase:migrate-offers --restore <archivo> --confirm   restaura un respaldo
 *
 * - Antes de escribir guarda TODOS los perfumes en backups/perfumes-<fecha>.json (fuera de git).
 * - Solo toca perfumes que aún no tienen `offers`. Se puede repetir sin efectos.
 * - Cada perfume queda con la línea Inspiración activa (sus tamaños actuales) y Réplica 1.1 y
 *   Original inactivas. Fotos, notas, estado y demás campos se conservan.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { FieldValue } from 'firebase-admin/firestore';
import { PerfumeDocSchema } from '../../src/modules/product/documents';
import { confirmed, db } from './admin-app';

const restoreIndex = process.argv.indexOf('--restore');
const restoreFile = restoreIndex >= 0 ? process.argv[restoreIndex + 1] : null;

type RawPerfume = Record<string, unknown> & {
  inspired?: boolean;
  sizes?: { ml: number; available: boolean }[];
  offers?: unknown;
};

async function backup(docs: { id: string; data: RawPerfume }[]): Promise<string> {
  mkdirSync('backups', { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = `backups/perfumes-${stamp}.json`;
  writeFileSync(file, JSON.stringify(docs, null, 2));
  return file;
}

async function restore(file: string): Promise<void> {
  const docs = JSON.parse(readFileSync(file, 'utf8')) as { id: string; data: RawPerfume }[];
  console.log(`Respaldo ${file}: ${docs.length} perfumes`);
  if (!confirmed) return console.log('Simulación: agrega --confirm para restaurarlo.');
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db().batch();
    for (const { id, data } of docs.slice(i, i + 400))
      batch.set(db().collection('perfumes').doc(id), data);
    await batch.commit();
  }
  console.log(`Restaurados ${docs.length} perfumes.`);
}

function migrate(data: RawPerfume) {
  const sizes = Array.isArray(data.sizes) ? data.sizes : [];
  return {
    ...data,
    offers: {
      inspiracion: { active: data.inspired !== false && sizes.length > 0, sizes },
      replica: { active: false, sizes: [] },
      original: { active: false, sizes: [] },
    },
  };
}

async function main(): Promise<void> {
  if (restoreFile) return restore(restoreFile);

  console.log(
    confirmed ? 'Modo: ESCRITURA (--confirm)' : 'Modo: simulación (agrega --confirm para escribir)',
  );
  const snap = await db().collection('perfumes').get();
  const all = snap.docs.map((d) => ({ id: d.id, data: d.data() as RawPerfume }));
  const pending = all.filter((d) => d.data.offers === undefined);
  console.log(
    `perfumes: ${all.length} · por migrar: ${pending.length} · ya migrados: ${all.length - pending.length}`,
  );

  // Valida todo antes de escribir nada.
  const migrated = pending.map(({ id, data }) => {
    // Zod descarta los campos viejos (inspired, sizes) al validar.
    const parsed = PerfumeDocSchema.safeParse(migrate(data));
    if (!parsed.success)
      throw new Error(`"${id}" no pasa la validación: ${parsed.error.issues[0]?.message}`);
    return { id, offers: parsed.data.offers };
  });
  console.log(`Validación: ${migrated.length} perfumes listos.`);
  if (!confirmed || migrated.length === 0) return;

  const file = await backup(all);
  console.log(`Respaldo guardado en ${file}`);
  for (let i = 0; i < migrated.length; i += 400) {
    const batch = db().batch();
    for (const { id, offers } of migrated.slice(i, i + 400)) {
      batch.update(db().collection('perfumes').doc(id), {
        offers,
        inspired: FieldValue.delete(),
        sizes: FieldValue.delete(),
      });
    }
    await batch.commit();
  }
  console.log(
    `Migrados ${migrated.length} perfumes. Para revertir: pnpm firebase:migrate-offers --restore ${file} --confirm`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
