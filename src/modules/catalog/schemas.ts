/** Tipos del catálogo (PLAN §4). En la fase 2 pasan a esquemas Zod con los mismos campos. */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  showInMenu: boolean;
  menuOrder: number;
  /** auto = se llena sola según una regla fija (lib/collections.ts). */
  rule: 'manual' | 'auto';
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  country?: string;
}

export interface MenuItem {
  label: string;
  /** Sin href cuando es un grupo desplegable (Género). */
  href?: string;
  children?: MenuItem[];
}

export type SortKey = 'destacados' | 'precio-asc' | 'precio-desc' | 'novedades';

/** Datos mínimos de cada perfume que la isla de filtros necesita en el navegador. */
export interface FacetItem {
  slug: string;
  gender: 'hombre' | 'mujer' | 'unisex';
  brand: string;
  families: string[];
  presentations: ('decant' | 'frasco')[];
  sizes: number[];
  priceFrom: number;
  available: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface FilterState {
  genders: string[];
  brands: string[];
  families: string[];
  presentations: string[];
  sizes: string[];
  prices: string[];
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface FacetGroup {
  key: keyof FilterState;
  title: string;
  options: FacetOption[];
}
