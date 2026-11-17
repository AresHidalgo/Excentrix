import type { Line, Perfume } from '../schemas';

/** Orden en que se muestran las líneas. */
export const LINE_ORDER: readonly Line[] = ['inspiracion', 'replica', 'original'];

export const LINE_LABEL: Record<Line, string> = {
  inspiracion: 'Inspiración',
  replica: 'Réplica 1.1',
  original: 'Original',
};

/** Nombre de la colección de cada línea en el menú. */
export const LINE_COLLECTION: Record<Line, { slug: string; name: string }> = {
  inspiracion: { slug: 'inspiraciones', name: 'Inspiraciones' },
  replica: { slug: 'replicas-1-1', name: 'Réplicas 1.1' },
  original: { slug: 'originales', name: 'Originales' },
};

/**
 * Aviso de cada línea. Las líneas que no son el producto de la marca lo dicen siempre, sin
 * ambigüedad: el comprador debe saber exactamente qué recibe.
 */
export const LINE_NOTICE: Record<Line, string> = {
  inspiracion:
    'Versión inspirada: fragancia propia que evoca al perfume de referencia. No es el perfume ni el frasco de la marca.',
  replica:
    'Réplica 1.1: imitación del perfume y de su frasco. No es el perfume original ni el frasco original de la marca.',
  original: 'Producto original de la marca.',
};

/** Descripción corta para la sección de líneas del inicio. */
export const LINE_SUMMARY: Record<Line, string> = {
  inspiracion: 'Fragancias inspiradas en los grandes perfumes, en 30, 60 y 100 ml a precio fijo.',
  replica: 'Imitación del perfume y de su frasco, con precio por referencia.',
  original: 'El perfume original de la marca, con precio por referencia.',
};

/** Líneas presentes en las variantes del perfume, en el orden de LINE_ORDER. */
export function linesOf(variants: readonly { line: Line }[]): Line[] {
  const present = new Set(variants.map((v) => v.line));
  return LINE_ORDER.filter((line) => present.has(line));
}

export function offersLine(perfume: Pick<Perfume, 'lines'>, line: Line): boolean {
  return perfume.lines.includes(line);
}
