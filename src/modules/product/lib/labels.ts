import type { Concentration, Gender, House } from '../schemas';

export const GENDER_LABEL: Record<Gender, string> = {
  hombre: 'Hombre',
  mujer: 'Mujer',
  unisex: 'Unisex',
};

export const HOUSE_LABEL: Record<House, string> = {
  nicho: 'Nicho',
  disenador: 'Diseñador',
  arabe: 'Árabe',
};

export const CONCENTRATION_LABEL: Record<Concentration, string> = {
  EDT: 'Eau de Toilette',
  EDP: 'Eau de Parfum',
  Parfum: 'Parfum',
  Extrait: 'Extrait de Parfum',
};

/**
 * "Perfume Khamrah de Lattafa" — alt sugerido del plan (§7, fotografía).
 * Para versiones inspiradas: "Perfume inspirado en Delina de Parfums de Marly".
 */
export function perfumeAlt(name: string, brand: string, ml?: number, inspired = false): string {
  const base = inspired
    ? `Perfume inspirado en ${name} de ${brand}`
    : `Perfume ${name} de ${brand}`;
  return `${base}${ml ? `, frasco de ${ml} ml` : ''}`;
}

/**
 * Nombre completo para títulos y textos: "Inspirado en Delina de Parfums de Marly" o, para un
 * producto de marca, "Khamrah de Lattafa". Las marcas de referencia nunca se muestran como si
 * fueran el producto que se vende.
 */
export function perfumeTitle(perfume: { name: string; brand: string; inspired?: boolean }): string {
  return perfume.inspired
    ? `Inspirado en ${perfume.name} de ${perfume.brand}`
    : `${perfume.name} de ${perfume.brand}`;
}

/** Aviso legal para versiones inspiradas. */
export const INSPIRED_NOTICE =
  'Versión inspirada. Excentrix no está afiliada a las marcas mencionadas: sus nombres se usan solo como referencia olfativa.';
