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

/** "Perfume Khamrah de Lattafa" — alt sugerido del plan (§7, fotografía). */
export function perfumeAlt(name: string, brand: string, ml?: number): string {
  return `Perfume ${name} de ${brand}${ml ? `, frasco de ${ml} ml` : ''}`;
}
